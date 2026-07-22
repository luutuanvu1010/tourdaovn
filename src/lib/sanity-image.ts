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
  quality?: number
  autoFormat?: boolean
}

const DEFAULT_QUALITY = 80

/**
 * Sinh URL ảnh Sanity đã tối ưu.
 *
 * @param image - ImageAsset từ GROQ (đã deref asset->{_id, url, ...})
 * @param options - width (px), quality (1-100, default 80), autoFormat (default true)
 */
export function imageUrl(
  image: ImageAsset | undefined,
  options: ImageOptions = {}
): string | undefined {
  if (!image?.asset?.url) return undefined

  const url = image.asset.url
  const { width, quality = DEFAULT_QUALITY, autoFormat = true } = options

  const params: string[] = []
  if (width) params.push(`w=${width}`)
  params.push(`q=${quality}`)
  if (autoFormat) params.push('auto=format')

  const sep = url.includes('?') ? '&' : '?'
  return url + sep + params.join('&')
}
