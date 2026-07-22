import { SCRAPFLY_KEY, SCRAPFLY_BASE, FETCH_TIMEOUT_MS, MAX_CONSECUTIVE_ERRORS } from '../config'
import { htmlToText } from './direct'
import type { FetchResult, Fetcher } from './types'

let consecutiveErrors = 0

interface ScrapflyAttempt {
  label: 'scrapfly' | 'scrapfly-render' | 'scrapfly-asp-render'
  renderJs: boolean
  asp?: boolean
  country?: string
}

function resetCircuitBreaker() {
  consecutiveErrors = 0
}

export function getConsecutiveErrors(): number {
  return consecutiveErrors
}

export function looksLikeBlockedHtml(html: string, content?: string): boolean {
  const text = (content ?? htmlToText(html)).replace(/\s+/g, ' ').trim()
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() ?? ''
  const thinResponse = text.length < 500
  const explicitBlock = /access denied|request blocked|forbidden|enable javascript|unusual traffic|reference #/i.test(
    `${title} ${text}`,
  )
  const akamaiShell = /akamai|Reference #/i.test(html) && thinResponse

  return (thinResponse && explicitBlock) || akamaiShell
}

async function runScrapflyAttempt(url: string, attempt: ScrapflyAttempt): Promise<FetchResult> {
  if (!SCRAPFLY_KEY) {
    return { success: false, sourceAdapter: 'scrapfly', error: 'Thiếu SCRAPFLY_KEY trong process.env' }
  }

  const params = new URLSearchParams({
    key: SCRAPFLY_KEY,
    url,
    format: 'raw',
    cache: attempt.renderJs ? 'false' : 'true',
  })
  if (attempt.renderJs) {
    params.set('render_js', 'true')
    params.set('rendering_wait', '5000')
  }
  if (attempt.asp) params.set('asp', 'true')
  if (attempt.country) params.set('country', attempt.country)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(`${SCRAPFLY_BASE}?${params.toString()}`, {
      signal: controller.signal,
    })

    const creditsUsed = Number(res.headers.get('X-Scrapfly-Api-Cost') ?? 0)

    if (res.status !== 200) {
      consecutiveErrors++
      const errorBody = await res.text().catch(() => '')
      const msg = `Scrapfly HTTP ${res.status}: ${errorBody.slice(0, 300)}`
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        throw new Error(`Circuit breaker: ${MAX_CONSECUTIVE_ERRORS} lỗi liên tiếp. Lỗi cuối: ${msg}`)
      }
      return { success: false, sourceAdapter: attempt.label, error: msg, creditsUsed }
    }

    resetCircuitBreaker()

    const body = await res.json()
    const rawHtml = body.result?.content ?? null
    const content = rawHtml ? htmlToText(rawHtml) : null

    if (!content) {
      consecutiveErrors++
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        throw new Error(`Circuit breaker: ${MAX_CONSECUTIVE_ERRORS} lỗi liên tiếp — content trống`)
      }
      return { success: false, sourceAdapter: attempt.label, error: 'result.content trống', creditsUsed }
    }

    if (looksLikeBlockedHtml(rawHtml, content)) {
      return {
        success: false,
        content,
        rawHtml,
        creditsUsed,
        sourceAdapter: attempt.label,
        error: 'Scrapfly nhận trang chống bot/challenge thay vì nội dung thật',
      }
    }

    resetCircuitBreaker()
    return { success: true, content, rawHtml, creditsUsed, sourceAdapter: attempt.label }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      consecutiveErrors++
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        throw new Error(`Circuit breaker: ${MAX_CONSECUTIVE_ERRORS} lỗi liên tiếp — timeout`)
      }
      return { success: false, sourceAdapter: attempt.label, error: `Timeout sau ${FETCH_TIMEOUT_MS}ms` }
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

async function fetchContentViaScrapfly(url: string): Promise<FetchResult> {
  const first = await runScrapflyAttempt(url, { label: 'scrapfly', renderJs: false })
  if (first.success || !first.error?.includes('trang chống bot/challenge')) return first

  const rendered = await runScrapflyAttempt(url, { label: 'scrapfly-render', renderJs: true })
  const firstAndRenderCredits = (first.creditsUsed ?? 0) + (rendered.creditsUsed ?? 0)
  if (rendered.success || !rendered.error?.includes('trang chống bot/challenge')) {
    return {
      ...rendered,
      creditsUsed: firstAndRenderCredits,
      error: rendered.success ? undefined : `${first.error}; render_js retry: ${rendered.error}`,
    }
  }

  const aspRendered = await runScrapflyAttempt(url, {
    label: 'scrapfly-asp-render',
    renderJs: true,
    asp: true,
    country: 'us',
  })
  return {
    ...aspRendered,
    creditsUsed: firstAndRenderCredits + (aspRendered.creditsUsed ?? 0),
    error: aspRendered.success
      ? undefined
      : `${first.error}; render_js retry: ${rendered.error}; asp+render_js retry: ${aspRendered.error}`,
  }
}

export const scrapflyAdapter: Fetcher = {
  name: 'scrapfly',
  fetchContent: fetchContentViaScrapfly,
}
