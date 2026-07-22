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
  beach: { type: ['Beach', 'TouristAttraction'] },
  island: { type: ['Landform', 'TouristAttraction'], additionalType: 'https://www.wikidata.org/wiki/Q23442' },
  landform: { type: ['Landform', 'TouristAttraction'] },
  ward: { type: 'AdministrativeArea' },
  area: { type: 'Place' }
}

/**
 * Serialize Place → JSON-LD Place (với subtype theo placeType).
 *
 * Quy tắc đặc biệt:
 * - ward: containedInPlace nội bộ trỏ TouristDestination, nhưng JSON-LD
 *   xuất containedInPlace là tỉnh Khánh Hòa qua Wikidata URL (I15).
 *   Dùng containedInPlaceRef của TouristDestination cha.
 * - accessInfo nhập description (5.1).
 * - isAccessibleForFree → boolean property thật.
 */
export function placeToJsonLd(
  place: PlaceResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const pm = PLACE_TYPE_MAP[place.placeType] ?? { type: 'Place' }
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
    if (place.placeType === 'ward') {
      // Ward: JSON-LD xuất containedInPlace là tỉnh Khánh Hòa qua Wikidata URL (I15)
      const parentRefs = place.containedInPlace.containedInPlaceRef
      if (parentRefs && parentRefs.length > 0) {
        ld['containedInPlace'] = {
          '@type': 'AdministrativeArea',
          '@id': parentRefs[0]
        }
      }
    } else {
      // Place/Attraction thường: trỏ entity cha
      const parent = refToLdRef(baseUrl, place.containedInPlace, lang)
      if (parent) ld['containedInPlace'] = parent
    }
  }

  // hasMap
  if (place.hasMap) ld['hasMap'] = place.hasMap

  // openingHours — chỉ hợp lệ cho venue có giờ mở cửa thật. Cả 5 placeType
  // (beach, island, landform, ward, area) là địa hình tự nhiên hoặc đơn vị
  // hành chính, không phải venue — không có khái niệm "giờ mở cửa" (A6).
  const NO_OPENING_HOURS_TYPES = new Set(['ward', 'area', 'beach', 'island', 'landform'])
  if (!NO_OPENING_HOURS_TYPES.has(place.placeType)) {
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
