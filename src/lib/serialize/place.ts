// serialize/place.ts — JSON-LD serialize cho Place
// Nguồn: 01-CONTENT_MODEL.md §2.2, schema.org/Place và các subtype

import type { PlaceResult, Lang } from '../types'
import {
  ldRoot, imagesToLd, geoToLd, addressToLd, sameAsToLd,
  openingHoursToLd, faqPageToLd,
  portableTextToDescription, refToLdRef, sanitizeLd
} from './utils'

/**
 * Bảng map placeType → @type theo CONTENT_MODEL §2.2.
 * Đóng, thêm giá trị là cửa hai chiều (5.3).
 *
 * beach/island/landform du lịch multi-type kèm TouristAttraction — pattern
 * chính tắc của schema.org ("any Thing can be a TouristAttraction, use
 * multi-typing"): giữ danh tính địa lý (Beach, Landform) đồng thời phát
 * tín hiệu du lịch cho Google/LLM. ward/area là đơn vị hành chính và khu
 * vực điều hướng, không phải attraction.
 */
const PLACE_TYPE_MAP: Record<string, { type: string | string[]; additionalType?: string }> = {
  // Cấp hành chính — khung chứa, không phải điểm du lịch (v1.0.12)
  province: { type: 'AdministrativeArea' },
  ward: { type: 'AdministrativeArea' },
  commune: { type: 'AdministrativeArea' },
  // Địa danh tự nhiên / vùng du lịch
  beach: { type: ['Beach', 'TouristAttraction'] },
  island: { type: ['Landform', 'TouristAttraction'], additionalType: 'https://www.wikidata.org/wiki/Q23442' },
  landform: { type: ['Landform', 'TouristAttraction'] },
  area: { type: 'Place' }
}

// Cấp hành chính: JSON-LD chỉ trỏ tỉnh qua Wikidata URL khi CHƯA có Place cấp
// province trong dataset (đường cũ, I15). Có rồi thì trỏ entity cha như bình thường.
const ADMIN_LEVEL_TYPES = new Set(['province', 'ward', 'commune'])

/**
 * Serialize Place → JSON-LD Place (với subtype theo placeType).
 *
 * Quy tắc đặc biệt:
 * - Cấp hành chính (province/ward/commune) mà cha là TouristDestination: JSON-LD
 *   xuất containedInPlace là tỉnh qua Wikidata URL lấy từ containedInPlaceRef của
 *   cha, không trỏ thương hiệu du lịch (I15). Khi cha đã là Place cấp province thật
 *   (v1.0.12) thì trỏ thẳng entity đó như mọi Place khác.
 * - accessInfo nhập description (5.1).
 * - isAccessibleForFree → boolean property thật.
 */
export function placeToJsonLd(
  place: PlaceResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  // placeType là tuỳ chọn từ v1.0.12 — thiếu thì lùi về Place chung, không đoán bừa.
  const placeType = place.placeType ?? ''
  const pm = PLACE_TYPE_MAP[placeType] ?? { type: 'Place' }
  const ld = ldRoot(baseUrl, pm.type, 'place', place.slug, lang)
  if (pm.additionalType) ld['additionalType'] = pm.additionalType

  // name
  ld['name'] = place.title

  // description: summary cộng body cộng accessInfo
  const descParts: string[] = []
  if (place.summary) descParts.push(place.summary)
  if (place.body) {
    const bodyText = portableTextToDescription(place.body)
    if (bodyText) descParts.push(bodyText)
  }
  // accessInfo nhập description (5.1) — cấm property tự chế
  if (place.accessInfo) {
    const accessText = portableTextToDescription(place.accessInfo)
    if (accessText) descParts.push(accessText)
  }
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // image: mainImage + gallery gộp một mảng
  const img = imagesToLd(place.mainImage, place.gallery, lang)
  if (img) ld['image'] = img

  // sameAs
  if (place.sameAs && place.sameAs.length > 0) {
    ld['sameAs'] = sameAsToLd(place.sameAs)
  }

  // geo
  const geo = geoToLd(place.geo)
  if (geo) ld['geo'] = geo

  // address
  const addr = addressToLd(place.address)
  if (addr) ld['address'] = addr

  // containedInPlace
  if (place.containedInPlace) {
    const parentRefs = place.containedInPlace.containedInPlaceRef
    if (ADMIN_LEVEL_TYPES.has(placeType) && parentRefs && parentRefs.length > 0) {
      // Cha là TouristDestination (không phải đơn vị hành chính): xuất tỉnh qua
      // Wikidata URL thay vì trỏ thương hiệu du lịch — phường thuộc tỉnh, không
      // thuộc thực thể nào tên Nha Trang (I15).
      ld['containedInPlace'] = {
        '@type': 'AdministrativeArea',
        '@id': parentRefs[0]
      }
    } else {
      // Cha là entity thật (kể cả Place cấp province): trỏ thẳng entity đó.
      const parent = refToLdRef(baseUrl, place.containedInPlace, lang)
      if (parent) ld['containedInPlace'] = parent
    }
  }

  // hasMap
  if (place.hasMap) ld['hasMap'] = place.hasMap

  // openingHours — chỉ hợp lệ cho venue có giờ mở cửa thật. Cả 7 placeType
  // (province, ward, commune, beach, island, landform, area) là địa hình tự nhiên
  // hoặc đơn vị hành chính, không phải venue — không có khái niệm "giờ mở cửa" (A6).
  const NO_OPENING_HOURS_TYPES = new Set(['province', 'ward', 'commune', 'area', 'beach', 'island', 'landform'])
  if (placeType && !NO_OPENING_HOURS_TYPES.has(placeType)) {
    const oh = openingHoursToLd(place.openingHours)
    if (oh) {
      ld['openingHoursSpecification'] = oh
    }
  }

  // isAccessibleForFree — property thật
  if (typeof place.isAccessibleForFree === 'boolean') {
    ld['isAccessibleForFree'] = place.isAccessibleForFree
  }

  // faq → subjectOf FAQPage
  const faqPage = faqPageToLd(place.faq, baseUrl, 'place', place.slug, lang)
  if (faqPage) ld['subjectOf'] = faqPage

  return sanitizeLd(ld)
}
