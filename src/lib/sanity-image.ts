// sanity-image.ts — helper tối ưu ảnh từ Sanity CDN
//
// Mọi component dùng ảnh Sanity phải qua hàm này, không dùng asset.url trực tiếp.
// Sanity CDN hỗ trợ query params: ?w=, ?q=, ?auto=format, ?fit=
//
// Dùng:
//   import { imageUrl } from '../lib/sanity-image'
//   <img src={imageUrl(data.mainImage, { width: 1200 })} ... />

import type { ImageAsset } from './types'

export interface ImageOptions {
  width?: number
  /** Cao (px). Đi kèm `fit: 'crop'` để cắt về đúng khung, ví dụ og:image 1200×630. */
  height?: number
  fit?: 'crop' | 'clip' | 'fill' | 'max' | 'min' | 'scale'
  /** Ép định dạng đầu ra (`fm=`). Dùng khi nơi nhận không đọc được webp/avif. */
  format?: 'png' | 'jpg' | 'webp'
  quality?: number
  autoFormat?: boolean
}

const DEFAULT_QUALITY = 80

/** Sanity CDN không biến đổi được SVG — gắn `?w=`/`?auto=format` vào là vô nghĩa. */
export function isSvg(image: ImageAsset | undefined): boolean {
  return image?.asset?.mimeType === 'image/svg+xml'
}

/**
 * Sinh URL ảnh Sanity đã tối ưu.
 *
 * @param image - ImageAsset từ GROQ (đã deref asset->{_id, url, ...})
 * @param options - width/height (px), fit, format, quality (1-100, default 80),
 *                  autoFormat (default true)
 *
 * Ảnh SVG trả về URL gốc, không tham số: CDN không xử lý được nên tham số chỉ
 * làm URL dài ra và làm người đọc tưởng ảnh đã được đổi cỡ. Cần biết được điều
 * này thì truy vấn phải deref `mimeType` — xem `BRANDING_PROJECTION`.
 */
export function imageUrl(
  image: ImageAsset | undefined,
  options: ImageOptions = {}
): string | undefined {
  if (!image?.asset?.url) return undefined

  const url = image.asset.url
  if (isSvg(image)) return url

  const { width, height, fit, format, quality = DEFAULT_QUALITY, autoFormat = true } = options

  const params: string[] = []
  if (width) params.push(`w=${width}`)
  if (height) params.push(`h=${height}`)
  if (fit) params.push(`fit=${fit}`)
  if (format) params.push(`fm=${format}`)
  params.push(`q=${quality}`)
  // `fm=` đã chỉ định đích danh định dạng — thêm `auto=format` là hai lệnh đánh nhau.
  if (autoFormat && !format) params.push('auto=format')

  const sep = url.includes('?') ? '&' : '?'
  return url + sep + params.join('&')
}
