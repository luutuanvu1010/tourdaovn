// queries/specialty.ts — GROQ query cho Specialty
// Nguồn: 01-CONTENT_MODEL.md §2.14, cms/schemas/specialty.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, galleryFragment,
  faqFragment, entityRefFragment, imageProvenanceFragment, bodyFragment,
  originNoteFragment, seasonFragment
} from './fragments'
import type { SpecialtyResult } from '../types'

export function specialtyBySlugQuery(lang: string): string {
  return `*[_type == "specialty" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
    _id, _type, _createdAt, _updatedAt,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    "seo": {
      "metaTitle": seo.metaTitle.${lang},
      "metaDescription": seo.metaDescription.${lang}
    },
    "category": category[]->{ _id, name, termCode, _type },
    reviewStatus, approvedBy, contentProvenance,
    publishedAt, updatedAt,
    specialtyType,
    sameAs,
    ${originNoteFragment(lang)},
    ${seasonFragment(lang)},
    "whereToTry": whereToTry[]->${entityRefFragment(lang)},
    ${bodyFragment(lang)},
    ${galleryFragment()},
    ${faqFragment(lang)},
    ${imageProvenanceFragment()}
  }`
}

export function allSpecialtiesQuery(lang: string): string {
  return `*[_type == "specialty" && reviewStatus == "approved"] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    specialtyType,
    sameAs
  }`
}

export function nearbyForSpecialtyQuery(lang: string): string {
  return `*[_type == "restaurant" && reviewStatus == "approved" && references(^._id)] [0...4] {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    ${mainImageFragment()},
    geo
  }`
}

export type { SpecialtyResult }
