// serialize/attraction.ts — JSON-LD serialize cho Attraction
// Nguồn: 01-CONTENT_MODEL.md §2.3
// @type mảng hai type: [TouristAttraction, <type cụ thể>]

import type { AttractionResult, Lang } from '../types'
import {
  ldRoot, imagesToLd, geoToLd, addressToLd, sameAsToLd,
  openingHoursToLd, faqPageToLd, portableTextToDescription,
  refToLdRef, sanitizeLd
} from './utils'

/**
 * Bảng map attractionType → @type (01-CONTENT_MODEL §2.3 v1.0.19, bảng map ĐÓNG).
 *
 * Cùng hình dạng với PLACE_TYPE_MAP ở serialize/place.ts: `{type, additionalType}`.
 * Hai giá trị cuối phát @type ĐƠN — schema.org không có type sạch cho chúng, và
 * lặp TouristAttraction hai lần trong mảng là tín hiệu rỗng chứ không phải tín hiệu
 * yếu. Trước v1.0.19 fallback `?? 'TouristAttraction'` tạo đúng mảng lặp đó trên
 * 17/39 trang; nay giá trị lạ hoặc trống rơi về nhánh `general` bên dưới.
 */
const ATTRACTION_TYPE_MAP: Record<string, { type: string | string[]; additionalType?: string }> = {
  historic: { type: ['TouristAttraction', 'LandmarksOrHistoricalBuildings'] },
  temple: { type: ['TouristAttraction', 'BuddhistTemple'] },
  church: { type: ['TouristAttraction', 'Church'] },
  museum: { type: ['TouristAttraction', 'Museum'] },
  beach: { type: ['TouristAttraction', 'Beach'] },
  island: { type: ['TouristAttraction', 'Landform'], additionalType: 'https://www.wikidata.org/wiki/Q23442' },
  nature: { type: ['TouristAttraction', 'Landform'] },
  'theme-park': { type: ['TouristAttraction', 'AmusementPark'] },
  aquarium: { type: ['TouristAttraction', 'Aquarium'] },
  'mud-spa': { type: ['TouristAttraction', 'DaySpa'] },
  market: { type: ['TouristAttraction', 'ShoppingCenter'] },
  park: { type: ['TouristAttraction', 'Park'] },
  'craft-village': { type: 'TouristAttraction' },
  general: { type: 'TouristAttraction' }
}

/** Bộ term làm NHÃN cho Attraction — nguồn additionalType phụ (01 §2.13). */
const ATTRACTION_LABEL_TERM_SET = 'attraction-type'

/**
 * Serialize Attraction → JSON-LD [TouristAttraction, <type cụ thể>].
 *
 * Gate chia BA nhóm (I2, 01 §2.3 v1.0.19):
 * - Bách khoa (historic, temple, church, museum): bắt buộc sameAs
 * - Venue (theme-park, aquarium, mud-spa, market, park): bắt buộc officialSource
 * - Một trong hai (beach, island, nature, craft-village, general): ít nhất một trong hai
 */
export function attractionToJsonLd(
  attraction: AttractionResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const mapped = ATTRACTION_TYPE_MAP[attraction.attractionType] ?? ATTRACTION_TYPE_MAP.general

  const ld = ldRoot(baseUrl, mapped.type, 'attraction', attraction.slug, lang)

  // additionalType: QID của chính loại (island) cộng QID của các NHÃN thuộc bộ
  // attraction-type. Term không có sameAs thì bỏ qua — cấm phát property rỗng (§5.1, I6).
  const additional = [
    ...(mapped.additionalType ? [mapped.additionalType] : []),
    ...(attraction.category ?? [])
      .filter(c => c?.inDefinedTermSet === ATTRACTION_LABEL_TERM_SET)
      .map(c => c?.sameAs)
      .filter((u): u is string => typeof u === 'string' && u !== '')
  ]
  const uniqueAdditional = [...new Set(additional)]
  if (uniqueAdditional.length === 1) ld['additionalType'] = uniqueAdditional[0]
  else if (uniqueAdditional.length > 1) ld['additionalType'] = uniqueAdditional

  // name
  ld['name'] = attraction.title

  // description: summary cộng body cộng accessInfo
  const descParts: string[] = []
  if (attraction.summary) descParts.push(attraction.summary)
  if (attraction.body) {
    const bodyText = portableTextToDescription(attraction.body)
    if (bodyText) descParts.push(bodyText)
  }
  if (attraction.accessInfo) {
    // accessInfo nhập thẳng description, không prefix nhãn — nhãn cứng tiếng Việt
    // vi phạm R6 (JSON-LD một trang một ngôn ngữ), xem CONTENT_MODEL §2.2/§5.1
    const accessText = portableTextToDescription(attraction.accessInfo)
    if (accessText) descParts.push(accessText)
  }
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // image: mainImage + gallery gộp một mảng
  const img = imagesToLd(attraction.mainImage, attraction.gallery, lang)
  if (img) ld['image'] = img

  // sameAs
  if (attraction.sameAs && attraction.sameAs.length > 0) {
    ld['sameAs'] = sameAsToLd(attraction.sameAs)
  }

  // officialSource
  if (attraction.officialSource) ld['url'] = attraction.officialSource

  // geo
  const geo = geoToLd(attraction.geo)
  if (geo) ld['geo'] = geo

  // address
  const addr = addressToLd(attraction.address)
  if (addr) ld['address'] = addr

  // containedInPlace
  const parent = refToLdRef(baseUrl, attraction.containedInPlace, lang)
  if (parent) ld['containedInPlace'] = parent

  // openingHours
  const oh = openingHoursToLd(attraction.openingHours)
  if (oh) {
    ld['openingHoursSpecification'] = oh
  }

  // isAccessibleForFree
  if (typeof attraction.isAccessibleForFree === 'boolean') {
    ld['isAccessibleForFree'] = attraction.isAccessibleForFree
  }

  // hasMap
  if (attraction.hasMap) ld['hasMap'] = attraction.hasMap

  // faq → subjectOf
  const faqPage = faqPageToLd(attraction.faq, baseUrl, 'attraction', attraction.slug, lang)
  if (faqPage) ld['subjectOf'] = faqPage

  return sanitizeLd(ld)
}
