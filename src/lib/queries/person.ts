// queries/person.ts — GROQ query cho Person
// Nguồn: 01-CONTENT_MODEL.md §2.12, cms/schemas/person.ts
// i18n: field-level (ADR-0004)

import { baseFieldsFragment, mainImageFragment, imageProvenanceFragment } from './fragments'
import type { PersonResult } from '../types'

/**
 * GROQ query lấy một Person theo slug, pick field theo lang.
 * Filter: reviewStatus == "approved" (I19).
 *
 * @param lang Ngôn ngữ hiện tại (vi, en, zh, ko, ru)
 */
export function personBySlugQuery(lang: string): string {
  return `*[_type == "person" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
    _id, _type, _createdAt, _updatedAt,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    "seo": {
      "metaTitle": seo.metaTitle.${lang},
      "metaDescription": seo.metaDescription.${lang}
    },
    "category": category[]->{ _id, "name": name.${lang}, termCode, _type },
    reviewStatus, approvedBy, contentProvenance,
    publishedAt, updatedAt,
    sameAs,
    "jobTitle": jobTitle.${lang},
    "knowsAbout": knowsAbout.${lang},
    url,
    "bio": bio.${lang},
    ${imageProvenanceFragment()}
  }`
}

/**
 * GROQ query lấy tất cả Person đã publish.
 * Dùng cho listing page, chọn tác giả.
 */
export function allPersonsQuery(lang: string): string {
  return `*[_type == "person" && reviewStatus == "approved"] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    "jobTitle": jobTitle.${lang},
    url
  }`
}

export function articlesByPersonQuery(): string {
  return `*[_type == "article" && language == $lang && reviewStatus == "approved" && references(^._id)] | order(publishedAt desc) [0...4] {
    _id, _type,
    title,
    "slug": slug.current,
    ${mainImageFragment()},
    articleType,
    publishedAt,
    "author": author->{ _id, "title": title.vi, "slug": slug.vi.current }
  }`
}

export type { PersonResult }
