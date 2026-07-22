import { OPEN_FETCH_DOMAINS } from '../config'
import { scrapflyAdapter } from './scrapfly'
import { directAdapter } from './direct'
import type { FetchResult } from './types'

export type { FetchResult, Fetcher } from './types'

export async function fetchVia(url: string): Promise<FetchResult> {
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return { success: false, sourceAdapter: 'direct', error: `URL không hợp lệ: ${url}` }
  }

  const useDirect = OPEN_FETCH_DOMAINS.some(domain => host.endsWith(domain))

  if (useDirect) {
    return directAdapter.fetchContent(url)
  }
  return scrapflyAdapter.fetchContent(url)
}
