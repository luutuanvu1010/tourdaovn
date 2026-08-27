// queries/attraction.ts — GROQ query cho Attraction
// Nguồn: 01-CONTENT_MODEL.md §2.3, cms/schemas/attraction.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, galleryFragment,
  faqFragment, entityRefFragment, openingHoursFragment,
  imageProvenanceFragment, bodyFragment, highlightsFragment,
  accessInfoFragment
} from './fragments'
import type { AttractionResult } from '../types'

export function attractionBySlugQuery(lang: string): string {
  return `*[_type == "attraction" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
    _id, _type, _createdAt, _updatedAt,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    "seo": {
      "metaTitle": seo.metaTitle.${lang},
      "metaDescription": seo.metaDescription.${lang}
    },
    "category": category[]->{ _id, name, termCode, _type, sameAs, inDefinedTermSet },
    reviewStatus, approvedBy, contentProvenance,
    publishedAt, updatedAt,
    attractionType,
    sameAs,
    officialSource,
    geo,
    address { street, ward },
    "containedInPlace": containedInPlace->${entityRefFragment(lang)},
    bookingRef { key },
    ${openingHoursFragment()},
    isAccessibleForFree,
    ${accessInfoFragment(lang)},
    hasMap,
    telephone,
    ${bodyFragment(lang)},
    ${galleryFragment()},
    ${highlightsFragment(lang)},
    ${faqFragment(lang)},
    ${imageProvenanceFragment()},
    "experiences": *[_type == "experience" && reviewStatus == "approved" && venue._ref == ^._id] | order(title.${lang} asc) {
      "title": title.${lang},
      "slug": slug.${lang}.current,
      "summary": summary.${lang},
      ${mainImageFragment()},
      "experienceType": coalesce(experienceType->name.${lang}, experienceType->name.vi),
      isAccessibleForFree
    }
  }`
}

/**
 * Rollup trang term `/diem-tham-quan/{term}` — Attraction trỏ tới term qua `category`.
 *
 * Khác Experience và Tour: chúng có field phân loại RIÊNG (`experienceType`), còn Attraction
 * dùng mảng `category` đa trị, nên lọc bằng `references()` chứ không so sánh một ref.
 * Chỉ nhận term thuộc bộ `attraction-type` — nhãn của bộ khác lọt vào đây là sai vai (01 §2.13).
 */
export function attractionsByTermQuery(lang: string): string {
  return `*[_type == "attraction" && reviewStatus == "approved"
    && count(category[@->slug.current == $slug && @->inDefinedTermSet == "attraction-type"]) > 0
  ] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    attractionType,
    isAccessibleForFree
  }`
}

export function allAttractionsQuery(lang: string): string {
  return `*[_type == "attraction" && reviewStatus == "approved"] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    attractionType,
    geo,
    "containedInPlace": containedInPlace->${entityRefFragment(lang)}
  }`
}

export function nearbyAttractionsQuery(lang: string): string {
  return `*[_type == "attraction" && reviewStatus == "approved" && _id != $id && containedInPlace._ref == $placeRef] | order(_createdAt desc) [0...4] {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    ${mainImageFragment()},
    attractionType,
    geo
  }`
}

export type { AttractionResult }
