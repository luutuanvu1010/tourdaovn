// serialize/category.ts — JSON-LD serialize cho Category (DefinedTerm)
// Nguồn: 01-CONTENT_MODEL.md §2.13

import type { CategoryResult, JsonLdObject } from '../types'
import { ldRoot, urlForEntity, sanitizeLd } from './utils'

/**
 * Serialize Category → JSON-LD DefinedTerm.
 *
 * @param category Kết quả GROQ query
 * @param baseUrl Base URL của site (vd "https://tourdao.vn")
 */
export function categoryToJsonLd(
  category: CategoryResult,
  baseUrl: string
): JsonLdObject {
  const ld = ldRoot(baseUrl, 'DefinedTerm', 'category', category.slug ?? category.termCode)

  ld['name'] = category.name
  ld['description'] = category.description
  ld['termCode'] = category.termCode
  ld['inDefinedTermSet'] = category.inDefinedTermSet

  if (category.sameAs) {
    ld['sameAs'] = category.sameAs
  }

  if (category.slug) {
    ld['url'] = urlForEntity(baseUrl, 'category', category.slug)
  }

  return sanitizeLd(ld)
}
