// queries/hotel.ts — GROQ query cho Hotel
// Nguồn: 01-CONTENT_MODEL.md §2.0b, §2.6; cms/schemas/hotel.ts, lodgingBase.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, galleryFragment,
  faqFragment, entityRefFragment, openingHoursFragment,
  imageProvenanceFragment, bodyFragment, highlightsFragment,
  amenityFeatureFragment, beachAccessFragment, accessInfoFragment
} from './fragments'
import type { HotelResult } from '../types'

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

export function hotelBySlugQuery(lang: string): string {
  return `*[_type == "hotel" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
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
    ${lodgingBaseFragment(lang)}
  }`
}

export function allHotelsQuery(lang: string): string {
  return `*[_type == "hotel" && reviewStatus == "approved"] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    starRating,
    geo
  }`
}

export function nearbyHotelsQuery(lang: string): string {
  return `*[_type in ["hotel", "resort"] && reviewStatus == "approved" && _id != $id && containedInPlace._ref == $placeRef] [0...4] {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    ${mainImageFragment()},
    starRating,
    geo
  }`
}

export type { HotelResult }
