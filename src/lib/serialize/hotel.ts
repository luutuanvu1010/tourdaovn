// serialize/hotel.ts — JSON-LD serialize cho Hotel
// Nguồn: 01-CONTENT_MODEL.md §2.0b, §2.6
// @type Hotel (subtype LodgingBusiness)

import type { HotelResult, Lang } from '../types'
import { lodgingToJsonLdBase } from './lodgingBase'

/**
 * Serialize Hotel → JSON-LD Hotel.
 * Dùng chung lodgingBase logic.
 */
export function hotelToJsonLd(
  hotel: HotelResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  return lodgingToJsonLdBase(hotel, baseUrl, 'Hotel', lang)
}
