// serialize/specialty.ts — JSON-LD serialize cho Specialty
// Nguồn: 01-CONTENT_MODEL.md §2.14
// @type Product + additionalType từ sameAs
// specialtyType (dish/product) là phân loại nội dung, không đổi @type

import { UI_COPY } from '../uiCopy'
import type { SpecialtyResult, Lang } from '../types'
import {
  ldRoot, imagesToLd, sameAsToLd,
  faqPageToLd, portableTextToDescription,
  sanitizeLd
} from './utils'

/**
 * Serialize Specialty → JSON-LD Product + additionalType.
 *
 * Mapping:
 *   title → name
 *   summary + body → description
 *   sameAs (URL Wikidata đầu tiên) → additionalType — Wikidata QID đóng vai loại
 *     (§2.14); URL Wikipedia là instance, không phải class, không dùng làm additionalType
 *   sameAs → sameAs
 *   originNote, season → nhập description (§5.1)
 *   whereToTry → không xuất JSON-LD: isRelatedTo expect Product/Service, Restaurant
 *     sai range (I6). Cạnh Restaurant→Specialty đã có qua Restaurant.makesOffer
 *     (whereToTry ⊂ reverse servesSpecialty theo I17); whereToTry giữ vai trình bày.
 *   specialtyType → không xuất (phân loại nội dung, không có property)
 *
 * Không có offers → không rich result Product (chấp nhận, §2.14).
 */
export function specialtyToJsonLd(
  specialty: SpecialtyResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  // @type Product + additionalType từ URL Wikidata trong sameAs (QID đóng vai loại,
  // §2.14). Không lấy sameAs[0] mù quáng: Wikipedia URL là instance, sai vai class.
  const ld = ldRoot(baseUrl, 'Product', 'specialty', specialty.slug, lang)
  const wikidata = specialty.sameAs?.find(u => u.includes('wikidata.org'))
  if (wikidata) ld['additionalType'] = wikidata

  // name
  ld['name'] = specialty.title

  // description: summary cộng body cộng originNote cộng season
  const descParts: string[] = []
  if (specialty.summary) descParts.push(specialty.summary)
  if (specialty.body) {
    const bodyText = portableTextToDescription(specialty.body)
    if (bodyText) descParts.push(bodyText)
  }
  // originNote, season: tầng 4, nhập description (§5.1)
  const L = UI_COPY[lang ?? 'vi'] ?? UI_COPY.vi
  if (specialty.originNote) descParts.push(`${L.origin}: ${specialty.originNote}`)
  if (specialty.season) descParts.push(`${L.season}: ${specialty.season}`)
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // image: mainImage + gallery gộp một mảng (photo không tồn tại trên Product)
  const img = imagesToLd(specialty.mainImage, specialty.gallery, lang)
  if (img) ld['image'] = img

  // sameAs (chỉ gán khi có URL hợp lệ)
  const sa = sameAsToLd(specialty.sameAs)
  if (sa.length > 0) ld['sameAs'] = sa

  // whereToTry — không xuất JSON-LD (xem doc comment); cạnh đã có ở Restaurant.makesOffer

  // faq → subjectOf
  const faqPage = faqPageToLd(specialty.faq, baseUrl, 'specialty', specialty.slug, lang)
  if (faqPage) ld['subjectOf'] = faqPage

  return sanitizeLd(ld)
}
