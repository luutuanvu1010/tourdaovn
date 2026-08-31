// queries/resort.ts — GROQ query cho Resort
// Nguồn: 01-CONTENT_MODEL.md §2.0b, §2.7; cms/schemas/resort.ts, lodgingBase.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, galleryFragment,
  faqFragment, entityRefFragment, imageProvenanceFragment, bodyFragment,
  highlightsFragment, amenityFeatureFragment, beachAccessFragment,
  accessInfoFragment, onSiteActivitiesFragment
} from './fragments'
import type { ResortResult } from '../types'

function lodgingBaseFragment(lang: string): string {
  return `
    geo,
    address { street, ward },
    officialSource,
    sameAs,
    starRating,
    ${amenityFeatureFragment(lang)},
    checkinTime,
    checkoutTime,
    numberOfRooms,
    petsAllowed,
    "containedInPlace": containedInPlace->${entityRefFragment(lang)},
    bookingRef { key },
    ${beachAccessFragment(lang)},
    ${accessInfoFragment(lang)},
    ${bodyFragment(lang)},
    ${galleryFragment()},
    ${highlightsFragment(lang)},
    ${faqFragment(lang)},
    ${imageProvenanceFragment()}
  `
}

export function resortBySlugQuery(lang: string): string {
  return `*[_type == "resort" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
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
    ${lodgingBaseFragment(lang)},
    beachfront,
    ${onSiteActivitiesFragment(lang)},
    landArea
  }`
}

export function allResortsQuery(lang: string): string {
  return `*[_type == "resort" && reviewStatus == "approved"] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    starRating,
    beachfront,
    geo
  }`
}

export function nearbyResortsQuery(lang: string): string {
  return `*[_type in ["hotel", "resort"] && reviewStatus == "approved" && _id != $id && containedInPlace._ref == $placeRef] [0...4] {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    ${mainImageFragment()},
    starRating,
    beachfront,
    geo
  }`
}

export type { ResortResult }
