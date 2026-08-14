// siteFooter.ts — chữ và ảnh chân trang, đọc từ siteSettings.footer.
// Cache module-level: build hỏi Sanity đúng một lần cho mọi trang.
//
// Vì sao là helper riêng chứ không dùng `siteSettingsQuery()`: `Footer.astro`
// nằm trong `BaseLayout` nên render ở MỌI trang, còn truy vấn đầy đủ chỉ chạy ở
// trang chủ. Đây đúng tình huống đã sinh ra `siteContact.ts`, `siteTheme.ts` và
// `siteBranding.ts` — cùng khuôn, cùng lý do (N7).
//
// Hình chiếu GROQ dùng lại `FOOTER_PROJECTION` trong queries/siteSettings.ts,
// không chép tay bản thứ hai (P6).
import { getClient } from './sanity'
import { FOOTER_PROJECTION } from './queries/siteSettings'
import type { SiteFooter } from './types'

const QUERY = `*[_type == "siteSettings" && _id == "siteSettings"][0].${FOOTER_PROJECTION}`

let cached: Promise<SiteFooter | null> | null = null

/**
 * Trả `null` khi chưa ai nhập gì, khi field trống, hoặc khi Sanity không trả lời.
 * Mọi nơi gọi phải có lớp dự phòng — chưa nhập gì thì chân trang vẫn phải dựng
 * đúng hình cũ (guard rỗng, giống `contact` và `branding`).
 */
export function fetchSiteFooter(): Promise<SiteFooter | null> {
  if (!cached) {
    cached = getClient()
      .fetch<SiteFooter | null>(QUERY)
      .then((result) => result ?? null)
      .catch(() => null)
  }
  return cached
}
