export interface ImageCandidate {
  url: string
  source: 'jsonld' | 'og' | 'html'
  alt?: string
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
}

function absolutizeUrl(url: string, pageUrl?: string): string | null {
  const trimmed = decodeHtmlEntities(url).trim()
  if (!trimmed || trimmed.startsWith('data:')) return null
  try {
    return new URL(trimmed, pageUrl).toString()
  } catch {
    return null
  }
}

function metaContent(html: string, property: string): string | undefined {
  const esc = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re1 = new RegExp(`<meta[^>]*(?:property|name)=["']${esc}["'][^>]*content=["']([^"']*)["']`, 'i')
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${esc}["']`, 'i')
  const m = html.match(re1) || html.match(re2)
  return m ? m[1].trim() : undefined
}

function extractJsonLdNodes(html: string): any[] {
  const nodes: any[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim())
      if (Array.isArray(parsed)) nodes.push(...parsed)
      else if (parsed && Array.isArray(parsed['@graph'])) nodes.push(...parsed['@graph'])
      else if (parsed && typeof parsed === 'object') nodes.push(parsed)
    } catch {
      // ignore invalid JSON-LD
    }
  }
  return nodes
}

function imageUrlsFromJsonLdValue(value: any): string[] {
  if (!value) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(imageUrlsFromJsonLdValue)
  if (typeof value === 'object') {
    return [value.url, value.contentUrl, value.thumbnailUrl].filter((v): v is string => typeof v === 'string')
  }
  return []
}

export function harvestImageCandidates(html: string, pageUrl?: string, limit = 12): ImageCandidate[] {
  const out: ImageCandidate[] = []
  const seen = new Set<string>()

  function push(url: string | undefined, source: ImageCandidate['source'], alt?: string) {
    if (!url) return
    const absolute = absolutizeUrl(url, pageUrl)
    if (!absolute) return
    const key = absolute.replace(/\?.*$/, '')
    if (seen.has(key)) return
    seen.add(key)
    out.push({ url: absolute, source, alt })
  }

  for (const node of extractJsonLdNodes(html)) {
    for (const url of imageUrlsFromJsonLdValue(node?.image)) push(url, 'jsonld')
  }

  push(metaContent(html, 'og:image'), 'og')
  push(metaContent(html, 'og:image:secure_url'), 'og')
  push(metaContent(html, 'twitter:image'), 'og')

  const imgRe = /<img\b([^>]*)>/gi
  let m: RegExpExecArray | null
  while ((m = imgRe.exec(html)) !== null && out.length < limit) {
    const attrs = m[1]
    const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1]
      || attrs.match(/\bdata-src=["']([^"']+)["']/i)?.[1]
      || attrs.match(/\bdata-lazy-src=["']([^"']+)["']/i)?.[1]
    const alt = attrs.match(/\balt=["']([^"']*)["']/i)?.[1]?.trim()
    const width = Number(attrs.match(/\bwidth=["']?(\d+)/i)?.[1] ?? 0)
    const height = Number(attrs.match(/\bheight=["']?(\d+)/i)?.[1] ?? 0)
    if (width && height && (width < 480 || height < 280)) continue
    push(src, 'html', alt || undefined)
  }

  return out.slice(0, limit)
}
