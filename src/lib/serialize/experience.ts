// serialize/experience.ts — JSON-LD serialize cho Experience
// Nguồn: 01-CONTENT_MODEL.md §2.4
// @type TouristAttraction + additionalType từ Category.sameAs

import { UI_COPY } from '../uiCopy'
import type { ExperienceResult, Lang } from '../types'
import {
  ldRoot, imagesToLd, geoToLd, faqPageToLd,
  portableTextToDescription, refToLdRef, sanitizeLd
} from './utils'

/**
 * Serialize Experience → JSON-LD TouristAttraction + additionalType.
 *
 * Mapping:
 *   title → name
 *   summary + body → description
 *   experienceType.sameAs → additionalType
 *   venue → containedInPlace (hoặc location)
 *   isAccessibleForFree → boolean
 *   duration, includes → nhập description (§5.1)
 *   touristType → touristType (property thật của TouristAttraction)
 */
export function experienceToJsonLd(
  exp: ExperienceResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  // @type: TouristAttraction với additionalType từ Category
  const ld = ldRoot(baseUrl, 'TouristAttraction', 'experience', exp.slug, lang)
  if (exp.experienceType?.sameAs) ld['additionalType'] = exp.experienceType.sameAs

  // name
  ld['name'] = exp.title

  // description: summary cộng body cộng duration cộng includes
  const descParts: string[] = []
  if (exp.summary) descParts.push(exp.summary)
  if (exp.body) {
    const bodyText = portableTextToDescription(exp.body)
    if (bodyText) descParts.push(bodyText)
  }
  // duration và includes nhập description (§5.1)
  const L = UI_COPY[lang ?? 'vi'] ?? UI_COPY.vi
  if (exp.duration) descParts.push(`${L.duration}: ${exp.duration}`)
  if (exp.includes && exp.includes.length > 0) {
    descParts.push(`${L.includes}: ${exp.includes.join(', ')}`)
  }
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // image: mainImage + gallery gộp một mảng
  const img = imagesToLd(exp.mainImage, exp.gallery, lang)
  if (img) ld['image'] = img

  // venue → containedInPlace
  if (exp.venue) {
    const venue = refToLdRef(baseUrl, exp.venue, lang)
    if (venue) ld['containedInPlace'] = venue
  }

  // geo — kế thừa venue nếu trống; guard null (geoToLd trả null khi lat/lng thiếu)
  const geo = geoToLd(exp.geo)
  if (geo) ld['geo'] = geo

  // isAccessibleForFree
  if (typeof exp.isAccessibleForFree === 'boolean') {
    ld['isAccessibleForFree'] = exp.isAccessibleForFree
  }

  // touristType — property thật của TouristAttraction (schema.org/touristType:
  // domainIncludes TouristAttraction, TouristDestination, TouristTrip;
  // CONTENT_MODEL §2.4 xác nhận). Emit trực tiếp, không nhập description.
  if (exp.touristType && exp.touristType.length > 0) {
    ld['touristType'] = exp.touristType
  }

  // faq → subjectOf
  const faqPage = faqPageToLd(exp.faq, baseUrl, 'experience', exp.slug, lang)
  if (faqPage) ld['subjectOf'] = faqPage

  return sanitizeLd(ld)
}
