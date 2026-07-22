// queries/restaurant.ts — GROQ query cho Restaurant
// Nguồn: 01-CONTENT_MODEL.md §2.5, cms/schemas/restaurant.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, galleryFragment,
  faqFragment, entityRefFragment, openingHoursFragment,
  imageProvenanceFragment, bodyFragment, highlightsFragment,
  servesCuisineFragment
} from './fragments'
import type { RestaurantResult } from '../types'

export function restaurantBySlugQuery(lang: string): string {
  return `*[_type == "restaurant" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
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
    geo,
    address { street, ward },
    officialSource,
    sameAs,
    ${servesCuisineFragment(lang)},
    "servesSpecialty": servesSpecialty[]->${entityRefFragment(lang)},
    "containedInPlace": containedInPlace->${entityRefFragment(lang)},
    ${openingHoursFragment()},
    acceptsReservations,
    hasMenu,
    telephone,
    ${bodyFragment(lang)},
    ${galleryFragment()},
    ${highlightsFragment(lang)},
    ${faqFragment(lang)},
    ${imageProvenanceFragment()}
  }`
}

export function allRestaurantsQuery(lang: string): string {
  return `*[_type == "restaurant" && reviewStatus == "approved"] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    ${servesCuisineFragment(lang)},
    geo,
    "containedInPlace": containedInPlace->${entityRefFragment(lang)}
  }`
}

export function restaurantsBySpecialtyQuery(specialtyIdParam = '$specialtyId', lang: string): string {
  return `*[_type == "restaurant" && reviewStatus == "approved" && references(${specialtyIdParam})] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    ${mainImageFragment()},
    geo
  }`
}

export function nearbyRestaurantsQuery(lang: string): string {
  return `*[_type == "restaurant" && reviewStatus == "approved" && _id != $id && (containedInPlace._ref == $placeRef || count(servesCuisine[@ in $cuisines]) > 0)] | order(_createdAt desc) [0...4] {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    ${mainImageFragment()},
    geo
  }`
}

export type { RestaurantResult }
