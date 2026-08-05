// siteTheme.ts — bộ giao diện đang bật, đọc từ siteSettings.theme.
// Cache module-level: build hỏi Sanity đúng một lần cho mọi trang.
//
// Danh sách hợp lệ khai ở đây VÀ ở 07-DESIGN_TOKENS §1b. Đây không phải nguồn
// sự thật thứ hai về MÀU — màu chỉ sống trong tokens.css; chỗ này chỉ là danh
// sách tên hợp lệ, để một giá trị lạ trong Studio không làm trang mất token.
import { getClient } from './sanity'
import type { SiteTheme } from './types'

const THEMES: readonly SiteTheme[] = ['bien-sau', 'cat-bien', 'ngoc-lam']
export const DEFAULT_THEME: SiteTheme = 'bien-sau'

const QUERY = `*[_type == "siteSettings" && _id == "siteSettings"][0].theme`

let cached: Promise<SiteTheme> | null = null

export function fetchSiteTheme(): Promise<SiteTheme> {
  if (!cached) {
    cached = getClient()
      .fetch<string | null>(QUERY)
      .then((value) =>
        THEMES.includes(value as SiteTheme) ? (value as SiteTheme) : DEFAULT_THEME,
      )
      .catch(() => DEFAULT_THEME)
  }
  return cached
}
