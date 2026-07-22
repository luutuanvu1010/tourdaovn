// serialize/touristDestination.ts — JSON-LD serialize cho TouristDestination
// Nguồn: 01-CONTENT_MODEL.md §2.1, schema.org/TouristDestination

import type { TouristDestinationResult, Lang } from '../types'
import {
  ldRoot, imagesToLd, geoToLd, sameAsToLd,
  keyFactsToLd, faqPageToLd,
  refToLdRef, portableTextToDescription, sanitizeLd
} from './utils'

/**
 * Serialize TouristDestination → JSON-LD TouristDestination.
 *
 * Mapping:
 *   title → name
 *   summary → description
 *   mainImage + gallery → image (mảng, Google khuyến nghị nhiều ảnh)
 *   sameAs → sameAs
 *   geo → geo (GeoCoordinates)
 *   containedInPlaceRef → containedInPlace (Wikidata URL của tỉnh Khánh Hòa)
 *   body → description (nối vào summary)
 *   keyFacts → additionalProperty (PropertyValue[])
 *   faq → subjectOf FAQPage (speakable sống trên FAQPage — Place không có property speakable)
 *   featuredAttractions → includesAttraction (property định nghĩa của TouristDestination)
 *   featuredStays/Experiences/Specialties/Tours → không xuất (vai trình bày)
 */
export function touristDestinationToJsonLd(
  td: TouristDestinationResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const ld = ldRoot(baseUrl, 'TouristDestination', 'touristDestination', td.slug, lang)

  // name
  ld['name'] = td.title

  // description: summary cộng body
  const descParts: string[] = []
  if (td.summary) descParts.push(td.summary)
  if (td.body) {
    const bodyText = portableTextToDescription(td.body)
    if (bodyText) descParts.push(bodyText)
  }
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // image: mainImage + gallery gộp một mảng (photo chỉ hợp lệ trên Place,
  // CONTENT_MODEL loại có chủ ý — dùng image cho nhất quán mọi entity)
  const img = imagesToLd(td.mainImage, td.gallery, lang)
  if (img) ld['image'] = img

  // sameAs (Wikidata + Wikipedia)
  if (td.sameAs && td.sameAs.length > 0) {
    ld['sameAs'] = sameAsToLd(td.sameAs)
  }

  // geo
  const geo = geoToLd(td.geo)
  if (geo) ld['geo'] = geo

  // containedInPlace — trỏ tỉnh Khánh Hòa qua Wikidata URL (I15)
  if (td.containedInPlaceRef && td.containedInPlaceRef.length > 0) {
    ld['containedInPlace'] = td.containedInPlaceRef.map((url) => ({
      '@type': 'AdministrativeArea',
      '@id': url
    }))
  }

  // keyFacts → additionalProperty
  const kf = keyFactsToLd(td.keyFacts)
  if (kf.length > 0) ld['additionalProperty'] = kf

  // includesAttraction — property định nghĩa của TouristDestination, tạo cạnh
  // hub → attraction trong knowledge graph. Nguồn: featuredAttractions (tuyển
  // chọn biên tập, chỉ entity đã publish). Lọc _type serialize ra
  // TouristAttraction (attraction, experience) để đúng range của property.
  if (td.featuredAttractions && td.featuredAttractions.length > 0) {
    const attractions = td.featuredAttractions
      .filter(ref => ref._type === 'attraction' || ref._type === 'experience')
      .map(ref => refToLdRef(baseUrl, ref, lang))
      .filter(Boolean)
    if (attractions.length > 0) ld['includesAttraction'] = attractions
  }

  // faq → subjectOf FAQPage (kèm speakable — hợp lệ trên FAQPage,
  // không hợp lệ trên TouristDestination vì Place không có property speakable)
  const faqPage = faqPageToLd(td.faq, baseUrl, 'touristDestination', td.slug, lang)
  if (faqPage) ld['subjectOf'] = faqPage

  // safetyNote — tầng 4, nhập description hoặc bỏ
  // safetyNote đã được ghi trong body, nên không thêm riêng

  return sanitizeLd(ld)
}
