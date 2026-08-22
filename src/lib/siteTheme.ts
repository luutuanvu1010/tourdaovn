// siteTheme.ts — bộ giao diện đang bật, đọc từ siteSettings.theme.
// Cache module-level: build hỏi Sanity đúng một lần cho mọi trang.
//
// Danh sách hợp lệ khai ở đây VÀ ở 07-DESIGN_TOKENS §1b. Đây không phải nguồn
// sự thật thứ hai về MÀU — màu chỉ sống trong tokens.css; chỗ này chỉ là danh
// sách tên hợp lệ, để một giá trị lạ trong Studio không làm trang mất token.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getClient } from './sanity'
import type { SiteTheme } from './types'

const THEMES: readonly SiteTheme[] = ['bien-sau', 'cat-bien', 'ngoc-lam']
export const DEFAULT_THEME: SiteTheme = 'bien-sau'

// ── Màu nền trang của bộ đang bật, đọc THẲNG tokens.css ──
// Dùng cho <meta name="theme-color"> (DR-037: trước đây viết cứng #C2410C, màu của
// site cũ). Không chép hex vào đây — tokens.css vẫn là nguồn duy nhất; hàm này chỉ
// đọc. Dùng process.cwd() như prices.ts: astro build/dev luôn chạy từ project root,
// còn import.meta.url trỏ sai khi file bị bundle vào dist/_worker.js.
let tokensCss: string | null = null
function readTokensCss(): string {
  if (tokensCss === null) {
    try {
      tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf-8')
    } catch {
      tokensCss = ''
    }
  }
  return tokensCss
}

/** `--c-surface` của bộ giao diện, theo đúng khối `:root[data-theme='…']` trong tokens.css;
 *  bộ mặc định hoặc không tìm thấy → giá trị ở `:root`; không đọc được file → trắng. */
export function themeSurface(theme: SiteTheme): string {
  const css = readTokensCss()
  const pick = (block: string | undefined) => block?.match(/--c-surface:\s*(#[0-9A-Fa-f]{6})/)?.[1]
  if (theme !== DEFAULT_THEME) {
    const scoped = css.match(new RegExp(`:root\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`))?.[1]
    const hex = pick(scoped)
    if (hex) return hex
  }
  return pick(css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1]) ?? '#FFFFFF'
}

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
