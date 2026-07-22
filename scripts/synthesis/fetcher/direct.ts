import { FETCH_TIMEOUT_MS } from '../config'
import type { FetchResult, Fetcher } from './types'

export function htmlToText(html: string): string {
  let text = html
  // Xoá script, style, nav, header, footer, comment
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<!--[\s\S]*?-->/g, '')
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')

  // Heading → markdown heading
  for (let i = 6; i >= 1; i--) {
    const re = new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, 'gi')
    text = text.replace(re, (_, inner) => `\n\n${'#'.repeat(i)} ${cleanInline(inner)}\n\n`)
  }

  // Block elements → newlines
  text = text.replace(/<\/?(p|div|section|article|main|aside|figure|figcaption|details|summary)[^>]*>/gi, '\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/?li[^>]*>/gi, '\n- ')
  text = text.replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
  text = text.replace(/<\/?blockquote[^>]*>/gi, '\n\n> ')

  // Inline formatting
  text = text.replace(/<\/?(strong|b)[^>]*>/gi, '**')
  text = text.replace(/<\/?(em|i)[^>]*>/gi, '*')

  // Link → [text](href)
  text = text.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
    return `[${cleanInline(inner)}](${href})`
  })

  // Image → ![alt](src)
  text = text.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi, '![$1]($2)')
  text = text.replace(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)')

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode common entities
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))

  // Whitespace cleanup
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()

  return text
}

function cleanInline(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
}

async function fetchContentDirect(url: string): Promise<FetchResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)

      if (!res.ok) {
        if (attempt === 0) continue
        return { success: false, sourceAdapter: 'direct', error: `HTTP ${res.status} từ ${url}` }
      }

      const contentType = res.headers.get('content-type') || ''
      const raw = await res.text()

      const content = contentType.includes('text/html') || contentType.includes('application/xhtml')
        ? htmlToText(raw)
        : raw

      const rawHtml = contentType.includes('text/html') || contentType.includes('application/xhtml')
        ? raw
        : undefined

      return { success: true, content, rawHtml, creditsUsed: 0, sourceAdapter: 'direct' }
    } catch (err: any) {
      clearTimeout(timer)
      if (attempt === 0) continue
      const reason = err.name === 'AbortError' ? `Timeout sau ${FETCH_TIMEOUT_MS}ms` : err.message
      return { success: false, sourceAdapter: 'direct', error: `Lỗi mạng: ${reason}` }
    }
  }

  return { success: false, sourceAdapter: 'direct', error: 'fetchDirect: hết retry' }
}

export const directAdapter: Fetcher = {
  name: 'direct',
  fetchContent: fetchContentDirect,
}
