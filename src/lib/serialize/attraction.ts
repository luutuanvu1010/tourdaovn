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
 * Bảng map attractionType → @type cụ thể (type thứ hai trong mảng).
 * Type đầu tiên luôn là TouristAttraction.
 */
const ATTRACTION_TYPE_MAP: Record<string, string> = {
  historic: 'LandmarksOrHistoricalBuildings',
  temple: 'BuddhistTemple',
  church: 'Church',
  museum: 'Museum',
  'theme-park': 'AmusementPark',
  aquarium: 'Aquarium',
  'mud-spa': 'DaySpa',
  market: 'ShoppingCenter',
  park: 'Park'
}

/**
 * Serialize Attraction → JSON-LD [TouristAttraction, <type cụ thể>].
 *
 * Gate chia hai nhóm:
 * - Nhóm bách khoa (historic, temple, church, museum): bắt buộc sameAs
 * - Nhóm venue (theme-park, aquarium, mud-spa, market, park): bắt buộc geo + address + officialSource
 */
export function attractionToJsonLd(
  attraction: AttractionResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const specificType = ATTRACTION_TYPE_MAP[attraction.attractionType] ?? 'TouristAttraction'
  const types = ['TouristAttraction', specificType]

  const ld = ldRoot(baseUrl, types, 'attraction', attraction.slug, lang)

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
