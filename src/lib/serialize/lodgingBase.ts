// serialize/lodgingBase.ts — JSON-LD serialize chung cho Hotel và Resort
// Nguồn: 01-CONTENT_MODEL.md §2.0b
// Hotel và Resort chia sẻ LodgingBase, serialize chung để không trôi khỏi nhau

import type { Lang, EntityRef, GeoPoint, ImageAsset, FAQItem } from '../types'
import {
  ldRoot, imagesToLd, geoToLd, addressToLd, sameAsToLd,
  faqPageToLd, portableTextToDescription, refToLdRef, sanitizeLd
} from './utils'

interface LodgingData {
  _type: string
  title: string
  slug: string
  summary: string
  mainImage?: ImageAsset
  gallery?: ImageAsset[] | null
  geo?: GeoPoint
  address?: { street?: string; ward?: string }
  officialSource: string
  sameAs?: string[] | null
  starRating?: number
  amenityFeature?: string[] | null
  checkinTime?: string
  checkoutTime?: string
  numberOfRooms?: number
  petsAllowed?: boolean
  containedInPlace: EntityRef
  beachAccess?: string
  accessInfo?: unknown[] | null
  body?: unknown[] | null
  highlights?: string[] | null
  faq?: FAQItem[] | null
  imageProvenance?: string
  publishedAt?: string
  updatedAt?: string
  _updatedAt?: string
}

/**
 * Serialize chung cho Hotel và Resort.
 * @param data Kết quả GROQ (HotelResult hoặc ResortResult)
 * @param baseUrl Base URL site
 * @param ldType '@type' JSON-LD: 'Hotel' hoặc 'Resort'
 * @param lang Ngôn ngữ hiện tại
 */
export function lodgingToJsonLdBase(
  data: LodgingData,
  baseUrl: string,
  ldType: 'Hotel' | 'Resort',
  lang?: Lang
): Record<string, unknown> {
  const ld = ldRoot(baseUrl, ldType, data._type, data.slug, lang)

  // name
  ld['name'] = data.title

  // description
  const descParts: string[] = []
  if (data.summary) descParts.push(data.summary)
  if (data.body) {
    const bodyText = portableTextToDescription(data.body)
    if (bodyText) descParts.push(bodyText)
  }
  if (data.accessInfo) {
    // accessInfo/beachAccess nhập thẳng description, không prefix nhãn — nhãn cứng
    // tiếng Việt vi phạm R6 (JSON-LD một trang một ngôn ngữ), xem CONTENT_MODEL §5.1
    const accessText = portableTextToDescription(data.accessInfo)
    if (accessText) descParts.push(accessText)
  }
  if (data.beachAccess) descParts.push(data.beachAccess)
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // image: mainImage + gallery gộp một mảng
  const img = imagesToLd(data.mainImage, data.gallery, lang)
  if (img) ld['image'] = img

  // geo + address
  const geo = geoToLd(data.geo)
  if (geo) ld['geo'] = geo
  const addr = addressToLd(data.address)
  if (addr) ld['address'] = addr

  // url = officialSource (chỉ gán khi có giá trị thật)
  if (data.officialSource) ld['url'] = data.officialSource

  // sameAs
  if (data.sameAs && data.sameAs.length > 0) {
    ld['sameAs'] = sameAsToLd(data.sameAs)
  }

  // starRating — schema.org expect Rating object, không phải số trần
  if (data.starRating != null) {
    ld['starRating'] = {
      '@type': 'Rating',
      ratingValue: data.starRating
    }
  }

  // amenityFeature
  if (data.amenityFeature && data.amenityFeature.length > 0) {
    ld['amenityFeature'] = data.amenityFeature.map(a => ({
      '@type': 'LocationFeatureSpecification',
      name: a
    }))
  }

  // checkin/checkout
  if (data.checkinTime) ld['checkinTime'] = data.checkinTime
  if (data.checkoutTime) ld['checkoutTime'] = data.checkoutTime

  // numberOfRooms
  if (data.numberOfRooms != null) ld['numberOfRooms'] = data.numberOfRooms

  // petsAllowed
  if (typeof data.petsAllowed === 'boolean') ld['petsAllowed'] = data.petsAllowed

  // containedInPlace
  if (data.containedInPlace) {
    const parent = refToLdRef(baseUrl, data.containedInPlace, lang)
    if (parent) ld['containedInPlace'] = parent
  }

  // faq → subjectOf
  const faqPage = faqPageToLd(data.faq, baseUrl, data._type, data.slug, lang)
  if (faqPage) ld['subjectOf'] = faqPage

  return sanitizeLd(ld)
}
