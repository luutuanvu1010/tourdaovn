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
