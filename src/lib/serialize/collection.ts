// serialize/collection.ts — JSON-LD cho trang listing (CollectionPage)
// Nguồn: 06-BINDING_MAP.md §2, schema.org/CollectionPage, schema.org/ItemList
//
// @id lấy từ pagePath (đường dẫn thật của trang đang render, Astro.url.pathname),
// không suy từ entityType/term.name — cách suy cũ tạo @id trỏ URL không tồn tại
// (vd /dia-danh/place/, /the-loai/Lặn biển/).

import type { EntityRef, Lang, JsonLdObject } from '../types'
import { urlForEntity, imageToLd, sanitizeLd, TYPE_LD_MAP } from './utils'

/**
 * Ghép base + pathname thành URL tuyệt đối, bảo đảm trailing slash.
 * pagePath có fragment (#past...) giữ nguyên — dùng khi một trang phát
 * nhiều CollectionPage, mỗi node cần @id riêng để không đè nhau.
 */
function pageUrl(baseUrl: string, pagePath: string): string {
  const base = baseUrl.replace(/\/$/, '')
  const path = pagePath.startsWith('/') ? pagePath : `/${pagePath}`
  if (path.includes('#')) return `${base}${path}`
  return `${base}${path.endsWith('/') ? path : `${path}/`}`
}

function entitiesToItemList(
  entities: CollectionPageInput['entities'],
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  return {
    '@type': 'ItemList',
    numberOfItems: entities.length,
    itemListElement: entities.map((e, i) => {
      const url = urlForEntity(baseUrl, e._type, e.slug, lang)
      const img = imageToLd(e.mainImage, lang)
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          // @type thật theo entity + @id trùng node trang chi tiết → một entity
          // một node xuyên suốt knowledge graph của site
          '@type': TYPE_LD_MAP[e._type] ?? 'Thing',
          '@id': url,
          name: e.title,
          url,
          ...(e.summary ? { description: e.summary } : {}),
          ...(img ? { image: img } : {}),
        },
      }
    }),
  }
}

export interface CollectionPageInput {
  title: string
  description?: string
  entityType: string
  entities: Array<{
    title: string
    slug: string
    summary?: string
    mainImage?: EntityRef['mainImage']
    _type: string
  }>
  lang?: Lang
  /** Đường dẫn thật của trang đang render (Astro.url.pathname) — nguồn @id. */
  pagePath: string
}

export function collectionPageToJsonLd(
  input: CollectionPageInput,
  baseUrl: string
): JsonLdObject {
  const { title, description, entities, lang, pagePath } = input

  const ld: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl(baseUrl, pagePath),
    url: pageUrl(baseUrl, pagePath),
    inLanguage: lang ?? 'vi',
  }

  ld['name'] = title
  if (description) ld['description'] = description

  if (entities.length > 0) {
    ld['mainEntity'] = entitiesToItemList(entities, baseUrl, lang)
  }

  return sanitizeLd(ld)
}

export interface TermPageInput {
  term: {
    name: string
    description?: string
    sameAs?: string[]
  }
  entityType: string
  entities: CollectionPageInput['entities']
  lang?: Lang
  /** Đường dẫn thật của trang term đang render (Astro.url.pathname) — nguồn @id. */
  pagePath: string
}

export function termToJsonLd(
  input: TermPageInput,
  baseUrl: string
): JsonLdObject {
  const { term, entities, lang, pagePath } = input

  const ld: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl(baseUrl, pagePath),
    url: pageUrl(baseUrl, pagePath),
    inLanguage: lang ?? 'vi',
  }

  ld['name'] = term.name
  if (term.description) ld['description'] = term.description

  ld['about'] = {
    '@type': 'DefinedTerm',
    name: term.name,
    ...(term.description ? { description: term.description } : {}),
    ...(term.sameAs && term.sameAs.length > 0
      ? { sameAs: term.sameAs }
      : {}),
  }

  if (entities.length > 0) {
    ld['mainEntity'] = entitiesToItemList(entities, baseUrl, lang)
  }

  return sanitizeLd(ld)
}
