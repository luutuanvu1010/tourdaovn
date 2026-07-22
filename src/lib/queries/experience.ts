// queries/experience.ts — GROQ query cho Experience
// Nguồn: 01-CONTENT_MODEL.md §2.4, cms/schemas/experience.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, galleryFragment,
  faqFragment, entityRefFragment, imageProvenanceFragment, bodyFragment,
  highlightsFragment, includesFragment, touristTypeFragment
} from './fragments'
import type { ExperienceResult } from '../types'

export function experienceBySlugQuery(lang: string): string {
  return `*[_type == "experience" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
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
    "experienceType": experienceType->{
      _id,
      "name": coalesce(name.${lang}, name.vi),
      termCode, sameAs, _type
    },
    "venue": venue->${entityRefFragment(lang)},
    isAccessibleForFree,
    duration,
    ${includesFragment(lang)},
    ${touristTypeFragment(lang)},
    geo,
    bookingRef { key },
    ${bodyFragment(lang)},
    ${galleryFragment()},
    ${highlightsFragment(lang)},
    ${faqFragment(lang)},
    ${imageProvenanceFragment()}
  }`
}

export function experiencesByVenueQuery(venueIdParam = '$venueId', lang: string): string {
  return `*[_type == "experience" && reviewStatus == "approved" && venue._ref == ${venueIdParam}] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    isAccessibleForFree,
    bookingRef { key }
  }`
}

export function allExperiencesQuery(lang: string): string {
  return `*[_type == "experience" && reviewStatus == "approved"] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    "experienceType": coalesce(experienceType->name.${lang}, experienceType->name.vi),
    isAccessibleForFree,
    bookingRef { key }
  }`
}

export function experiencesByTypeQuery(lang: string): string {
  return `*[_type == "experience" && reviewStatus == "approved" && experienceType->slug.current == $slug] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    "experienceType": coalesce(experienceType->name.${lang}, experienceType->name.vi),
    isAccessibleForFree,
    bookingRef { key }
  }`
}

export function nearbyExperiencesQuery(lang: string): string {
  return `*[_type == "experience" && reviewStatus == "approved" && _id != $id && (experienceType._ref == $typeRef || venue._ref == $venueRef)] | order(_createdAt desc) [0...4] {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    ${mainImageFragment()},
    isAccessibleForFree,
    bookingRef { key }
  }`
}

export type { ExperienceResult }
