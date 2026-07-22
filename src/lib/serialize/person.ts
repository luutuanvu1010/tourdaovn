// serialize/person.ts — JSON-LD serialize cho Person
// Nguồn: 01-CONTENT_MODEL.md §2.12

import type { PersonResult, Lang } from '../types'
import { ldRoot, imageToLd, sameAsToLd, portableTextToDescription, urlForEntity, sanitizeLd } from './utils'

/**
 * Serialize Person → JSON-LD Person.
 *
 * Mapping:
 *   title → name
 *   mainImage → image (ImageObject)
 *   summary → description (vai trò)
 *   bio → nhập vào description (cùng trường, nối)
 *   sameAs → sameAs
 *   jobTitle → jobTitle
 *   knowsAbout → knowsAbout
 *   url → url
 *
 * @param person Kết quả GROQ query
 * @param baseUrl Base URL của site
 * @param lang Ngôn ngữ hiện tại (cho URL)
 */
export function personToJsonLd(
  person: PersonResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const ld = ldRoot(baseUrl, 'Person', 'person', person.slug, lang)

  ld['name'] = person.title

  // description: summary cộng bio nối
  const descParts: string[] = []
  if (person.summary) descParts.push(person.summary)
  const bioText = portableTextToDescription(person.bio)
  if (bioText) descParts.push(bioText)
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // image
  const img = imageToLd(person.mainImage, lang)
  if (img) ld['image'] = img

  // sameAs
  if (person.sameAs && person.sameAs.length > 0) {
    ld['sameAs'] = sameAsToLd(person.sameAs)
  }

  if (person.jobTitle) ld['jobTitle'] = person.jobTitle
  if (person.knowsAbout && person.knowsAbout.length > 0) ld['knowsAbout'] = person.knowsAbout

  // url: hồ sơ riêng nếu có, fallback trang tác giả (qua ROUTE_MAP, đúng segment theo lang)
  ld['url'] = person.url || urlForEntity(baseUrl, 'person', person.slug, lang)

  return sanitizeLd(ld)
}
