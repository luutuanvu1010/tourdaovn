// siteUrl.ts — một dòng dùng chung thay cho 25 chỗ lặp lại
// `Astro.site?.toString() || 'https://<domain viết cứng>'` (ADR-0021, PHA 2 GÓI 2).
//
// Ưu tiên `Astro.site` (Astro tự tạo từ `site:` trong astro.config.mjs lúc build).
// Nếu vì lý do gì đó ngữ cảnh gọi không có (site undefined), rơi về `site.url` trong
// site.config.ts — nguồn sự thật duy nhất cho domain, không viết cứng domain ở đây.

import { site } from '../site.config'

/** Địa chỉ gốc của site, luôn KHÔNG có dấu `/` ở cuối. Truyền `Astro.site` (component)
 *  hoặc `site` từ APIContext (API route) vào tham số `astroSite`. */
export function siteBaseUrl(astroSite: URL | undefined): string {
  return (astroSite?.toString() ?? site.url).replace(/\/$/, '')
}

/**
 * Nhãn ngắn cho một URL ngoài: "Wikipedia", "Wikidata", hoặc tên miền không `www.`.
 * Dùng cho giá trị của dòng link trong thẻ thông tin — thay cho chữ "Xem" vô nghĩa
 * và nhãn "Wikidata" gắn cứng dù `sameAs[0]` là Wikipedia (kế hoạch vòng 4, F6).
 * URL hỏng hoặc rỗng → chuỗi rỗng; người gọi đã có cờ `visible` riêng.
 */
export function hostLabel(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (/(^|\.)wikipedia\.org$/.test(host)) return 'Wikipedia'
    if (/(^|\.)wikidata\.org$/.test(host)) return 'Wikidata'
    return host
  } catch {
    return ''
  }
}
