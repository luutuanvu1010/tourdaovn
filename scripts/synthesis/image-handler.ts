// P4.2: Wikimedia Commons → Sanity CDN. dryRun chỉ validate + dựng provenance, KHÔNG upload/ghi Sanity.
import { createClient } from '@sanity/client'
import { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_WRITE_TOKEN, FETCH_TIMEOUT_MS } from './config'
import type { ImageCandidate } from './rich-harvester'

export interface SanityImageValue {
  _type: 'image'
  _key?: string
  asset: { _type: 'reference'; _ref: string }
  alt: string
}

export interface ImageResult {
  mainImage?: SanityImageValue
  gallery?: SanityImageValue[]
  imageProvenance?: string
  selectedUrls?: string[]
  uploadedImageCount?: number
  warnings: string[]
}

function getWriteClient() {
  return createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2026-06-01',
    token: SANITY_WRITE_TOKEN,
    useCdn: false,
  })
}

function isCommonsUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname === 'upload.wikimedia.org' || u.hostname === 'commons.wikimedia.org'
  } catch {
    return false
  }
}

function extractCommonsFilename(commonsUrl: string): string | null {
  try {
    const u = new URL(commonsUrl)
    // Special:FilePath/<file>
    const filePathIdx = u.pathname.indexOf('Special:FilePath/')
    if (filePathIdx !== -1) {
      const raw = u.pathname.slice(filePathIdx + 'Special:FilePath/'.length)
      return decodeURIComponent(raw)
    }
    // thumbnail dạng /wikipedia/commons/thumb/x/xx/<file>/NNNpx-<file>
    // hoặc /wikipedia/commons/x/xx/<file>
    const parts = u.pathname.split('/').filter(Boolean)
    const thumbIdx = parts.indexOf('thumb')
    if (thumbIdx !== -1 && parts.length > thumbIdx + 3) {
      return decodeURIComponent(parts[thumbIdx + 3])
    }
    if (parts.length >= 2) {
      const last = parts[parts.length - 1]
      // file gốc thường là phần tử cuối path (sau hash 2 ký tự)
      if (/\.[a-zA-Z0-9]+$/.test(last)) return decodeURIComponent(last)
    }
    return null
  } catch {
    return null
  }
}

async function fetchCommonsLicense(
  filename: string,
  warnings: string[],
): Promise<{ artist?: string; license?: string } | null> {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    `File:${filename}`,
  )}&prop=imageinfo&iiprop=extmetadata&format=json`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(apiUrl, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) {
      warnings.push(`Commons imageinfo HTTP ${res.status} cho ${filename}`)
      return null
    }
    const json: any = await res.json()
    const pages = json?.query?.pages
    if (!pages) return null
    const page = Object.values(pages)[0] as any
    const meta = page?.imageinfo?.[0]?.extmetadata
    if (!meta) return null
    const license = meta.LicenseShortName?.value
    const artist = meta.Artist?.value || meta.Credit?.value
    return { artist, license }
  } catch (err: any) {
    clearTimeout(timer)
    const reason = err.name === 'AbortError' ? `timeout sau ${FETCH_TIMEOUT_MS}ms` : err.message
    warnings.push(`Lỗi gọi Commons imageinfo (${filename}): ${reason}`)
    return null
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim()
}

function imageKey(url: string): string {
  try {
    const u = new URL(url)
    const last = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || u.pathname)
    const assetName = last
      .replace(/:.+$/, '')
      .replace(/\.(jpe?g|png|webp|avif)$/i, '')
      .toLowerCase()
    return `${u.hostname}/${assetName || u.pathname.toLowerCase()}`
  } catch {
    return url.replace(/\?.*$/, '').toLowerCase()
  }
}

function filenameFromUrl(url: string, index = 0, contentType = ''): string {
  const extFromType =
    contentType.includes('png') ? '.png'
      : contentType.includes('webp') ? '.webp'
        : contentType.includes('avif') ? '.avif'
          : contentType.includes('jpeg') || contentType.includes('jpg') ? '.jpg'
            : ''
  try {
    const u = new URL(url)
    const last = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '')
      .replace(/:.+$/, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    if (last && /\.[a-zA-Z0-9]+$/.test(last)) return last
    if (last) return `${last}${extFromType || '.jpg'}`
  } catch {
    // fall through
  }
  return `image-${Date.now()}-${index}${extFromType || '.jpg'}`
}

function isLikelyDecorativeImage(candidate: ImageCandidate): boolean {
  const haystack = `${candidate.url} ${candidate.alt ?? ''}`.toLowerCase()
  return /akamai-logo|\/logo|logo_|credit[\s_-]?card|\bcard\b|cobrand|bonvoy|favicon|sprite|icon|\.svg(?:\?|$)/i.test(haystack)
}

export function selectUploadableImageCandidates(
  candidates: ImageCandidate[],
  limit = 6,
): ImageCandidate[] {
  const selected: ImageCandidate[] = []
  const seen = new Set<string>()

  for (const candidate of candidates) {
    if (!candidate.url || isLikelyDecorativeImage(candidate)) continue
    const key = imageKey(candidate.url)
    if (seen.has(key)) continue
    seen.add(key)
    selected.push(candidate)
    if (selected.length >= limit) break
  }

  return selected
}

async function uploadImageUrl(
  url: string,
  altText: string,
  index: number,
  warnings: string[],
): Promise<SanityImageValue | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'nhatrangtravel-synthesis/1.0 (https://nhatrangtravel.net)' },
    })
    clearTimeout(timer)
    if (!res.ok) {
      warnings.push(`Download ảnh HTML thất bại HTTP ${res.status} (${url})`)
      return null
    }

    const contentType = res.headers.get('content-type') || ''
    if (contentType && !contentType.startsWith('image/')) {
      warnings.push(`Bỏ ảnh vì content-type không phải image (${contentType}) — ${url}`)
      return null
    }
    if (contentType.includes('svg')) {
      warnings.push(`Bỏ ảnh SVG/decorative — ${url}`)
      return null
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const filename = filenameFromUrl(url, index, contentType)
    const asset = await withTransientRetry(
      `Upload ảnh Sanity (${filename})`,
      warnings,
      () => getWriteClient().assets.upload('image', buffer, { filename }),
    )

    return {
      _type: 'image',
      _key: `synthimg${index.toString(36)}`,
      asset: { _type: 'reference', _ref: asset._id },
      alt: altText,
    }
  } catch (err: any) {
    clearTimeout(timer)
    const reason = err.name === 'AbortError' ? `timeout sau ${FETCH_TIMEOUT_MS}ms` : err.message
    warnings.push(`Lỗi upload ảnh HTML (${url}): ${reason}`)
    return null
  }
}

function buildRemoteImageProvenance(selected: ImageCandidate[], sourceUrl?: string): string | undefined {
  if (selected.length === 0) return undefined
  const urls = selected.map(image => image.url).join(', ')
  const source = sourceUrl ? `Nguồn trang: ${sourceUrl}. ` : ''
  return `${source}Ảnh lấy từ nguồn HTML/JSON-LD chính thức (${selected.length} URL): ${urls}. Cần kiểm quyền sử dụng trước publish.`
}

function isTransientNetworkError(err: any): boolean {
  const message = String(err?.message || err || '')
  return /ENOTFOUND|EAI_AGAIN|ECONNRESET|ECONNREFUSED|ETIMEDOUT|fetch failed|network|socket|timeout/i.test(message)
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function withTransientRetry<T>(
  label: string,
  warnings: string[],
  operation: () => Promise<T>,
): Promise<T> {
  let lastErr: any
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await operation()
    } catch (err: any) {
      lastErr = err
      if (attempt === 3 || !isTransientNetworkError(err)) throw err
      warnings.push(`${label}: lỗi mạng tạm thời, retry ${attempt}/2 (${err.message})`)
      await sleep(750 * attempt)
    }
  }
  throw lastErr
}

async function buildImageProvenance(
  commonsUrl: string,
  warnings: string[],
): Promise<string> {
  const filename = extractCommonsFilename(commonsUrl)
  if (!filename) {
    warnings.push(`Không suy được tên file Commons từ ${commonsUrl}`)
    return `Wikimedia Commons (${commonsUrl}) — cần xác nhận license trước publish`
  }

  const info = await fetchCommonsLicense(filename, warnings)
  if (!info || (!info.license && !info.artist)) {
    warnings.push(`Không lấy được license/artist Commons cho ${filename}`)
    return `Wikimedia Commons (${commonsUrl}) — cần xác nhận license trước publish`
  }

  const artist = info.artist ? stripHtml(info.artist) : 'không rõ tác giả'
  const license = info.license ? stripHtml(info.license) : 'license không rõ'
  return `Ảnh: ${artist}, ${license}, Wikimedia Commons (${commonsUrl})`
}

export async function handleImage(
  commonsUrl: string,
  altText: string,
  options: { dryRun: boolean },
): Promise<ImageResult> {
  const warnings: string[] = []

  if (!isCommonsUrl(commonsUrl)) {
    warnings.push('ảnh không thuộc Wikimedia, bỏ')
    return { warnings }
  }

  const imageProvenance = await buildImageProvenance(commonsUrl, warnings)

  if (options.dryRun) {
    console.log(`     would upload: ${commonsUrl}`)
    return { imageProvenance, warnings }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(commonsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'nhatrangtravel-synthesis/1.0 (https://nhatrangtravel.net)' },
    })
    clearTimeout(timer)
    if (!res.ok) {
      warnings.push(`Download ảnh thất bại HTTP ${res.status} (${commonsUrl})`)
      return { imageProvenance, warnings }
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const filename = extractCommonsFilename(commonsUrl) || `image-${Date.now()}`

    const asset = await withTransientRetry(
      `Upload ảnh Commons (${filename})`,
      warnings,
      () => getWriteClient().assets.upload('image', buffer, { filename }),
    )

    return {
      mainImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
        alt: altText,
      },
      imageProvenance,
      warnings,
    }
  } catch (err: any) {
    const reason = err.name === 'AbortError' ? `timeout sau ${FETCH_TIMEOUT_MS}ms` : err.message
    warnings.push(`Lỗi upload ảnh (${commonsUrl}): ${reason}`)
    return { imageProvenance, warnings }
  }
}

export async function handleImageCandidates(
  candidates: ImageCandidate[],
  altText: string,
  options: { dryRun: boolean; sourceUrl?: string; limit?: number },
): Promise<ImageResult> {
  const warnings: string[] = []
  const selected = selectUploadableImageCandidates(candidates, options.limit ?? 6)
  const selectedUrls = selected.map(image => image.url)
  const imageProvenance = buildRemoteImageProvenance(selected, options.sourceUrl)

  if (selected.length === 0) {
    warnings.push('Không có ảnh HTML phù hợp để upload vào mainImage/gallery')
    return { imageProvenance, selectedUrls, uploadedImageCount: 0, warnings }
  }

  if (options.dryRun) {
    selectedUrls.forEach(url => console.log(`     would upload HTML image: ${url}`))
    return { imageProvenance, selectedUrls, uploadedImageCount: selected.length, warnings }
  }

  const uploaded: SanityImageValue[] = []
  for (let i = 0; i < selected.length; i++) {
    const alt = selected[i].alt || altText
    const image = await uploadImageUrl(selected[i].url, alt, i, warnings)
    if (image) uploaded.push(image)
  }

  if (uploaded.length === 0) {
    warnings.push('Không upload được ảnh HTML nào vào Sanity CDN')
    return { imageProvenance, selectedUrls, uploadedImageCount: 0, warnings }
  }

  const [first, ...gallery] = uploaded
  const mainImage: SanityImageValue = {
    _type: 'image',
    asset: first.asset,
    alt: first.alt || altText,
  }

  return {
    mainImage,
    gallery,
    imageProvenance,
    selectedUrls,
    uploadedImageCount: uploaded.length,
    warnings,
  }
}
