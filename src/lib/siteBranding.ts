// siteBranding.ts — ảnh nhận diện thương hiệu, đọc từ siteSettings.branding.
// Cache module-level: build hỏi Sanity đúng một lần cho mọi trang.
//
// Vì sao là helper riêng chứ không dùng `siteSettingsQuery()`: Header, Footer và
// BaseLayout render ở MỌI trang, còn query đầy đủ chỉ chạy ở trang chủ. Đây đúng
// tình huống đã sinh ra `siteContact.ts` và `siteTheme.ts` — cùng khuôn, cùng lý do.
//
// Hình chiếu GROQ dùng lại `BRANDING_PROJECTION` trong queries/siteSettings.ts,
// không chép tay bản thứ hai (P6).
import { getClient } from './sanity'
import { BRANDING_PROJECTION } from './queries/siteSettings'
import type { SiteBranding } from './types'

const QUERY = `*[_type == "siteSettings" && _id == "siteSettings"][0].${BRANDING_PROJECTION}`

let cached: Promise<SiteBranding | null> | null = null

/**
 * Trả `null` khi chưa ai nhập gì, khi field trống, hoặc khi Sanity không trả lời.
 * Mọi nơi gọi phải có lớp dự phòng — chưa tải ảnh lên thì site vẫn phải dựng
 * đúng hình cũ (guard rỗng, giống `contact` và `partners`).
 */
export function fetchSiteBranding(): Promise<SiteBranding | null> {
  if (!cached) {
    cached = getClient()
      .fetch<SiteBranding | null>(QUERY)
      .then((result) => result ?? null)
      .catch(() => null)
  }
  return cached
}
