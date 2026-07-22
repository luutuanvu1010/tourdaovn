export interface FetchResult {
  success: boolean
  content?: string        // markdown/text
  rawHtml?: string        // HTML thô nếu adapter lấy được, dùng cho harvester deterministic
  creditsUsed?: number    // 0 với direct-fetch
  sourceAdapter: string   // 'scrapfly' | 'direct'
  error?: string
}

export interface Fetcher {
  name: string
  fetchContent(url: string): Promise<FetchResult>
}
