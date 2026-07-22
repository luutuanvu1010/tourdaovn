// queries/place.ts — GROQ query cho Place
// Nguồn: 01-CONTENT_MODEL.md §2.2, cms/schemas/place.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, galleryFragment,
  faqFragment, entityRefFragment, openingHoursFragment,
  imageProvenanceFragment, bodyFragment, highlightsFragment,
  accessInfoFragment
} from './fragments'
import type { PlaceResult } from '../types'

export function placeBySlugQuery(lang: string): string {
  return `*[_type == "place" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
    _id, _type, _createdAt, _updatedAt,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    "seo": {
      "metaTitle": seo.metaTitle.${lang},
      "metaDescription": seo.metaDescription.${lang}
    },
    reviewStatus, approvedBy, contentProvenance,
    publishedAt, updatedAt,
    placeType,
    sameAs,
    geo,
    address { street, ward },
    "containedInPlace": containedInPlace->{
      _id, _type,
      "title": coalesce(title.${lang}, title),
      "slug": coalesce(slug.${lang}.current, slug.current),
      sameAs,
      containedInPlaceRef
    },
    hasMap,
    ${accessInfoFragment(lang)},
    ${openingHoursFragment()},
    isAccessibleForFree,
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

export function allPlacesQuery(lang: string): string {
  return `*[_type == "place" && reviewStatus == "approved"] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    placeType,
    geo,
    "containedInPlace": containedInPlace->{
      _id, _type,
      "title": coalesce(title.${lang}, title),
      "slug": coalesce(slug.${lang}.current, slug.current)
    }
  }`
}

export function placesContainedInQuery(parentIdParam = '$parentId', lang: string): string {
  return `*[_type == "place" && reviewStatus == "approved" && containedInPlace._ref == ${parentIdParam}] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    placeType,
    geo
  }`
}

export function nearbyForPlaceQuery(lang: string): string {
  return `{
    "attractions": *[_type == "attraction" && reviewStatus == "approved" && containedInPlace._ref == $placeRef && _id != $id] | order(_createdAt desc) [0...4] {
      _id, _type,
      "title": title.${lang},
      "slug": slug.${lang}.current,
      ${mainImageFragment()},
      attractionType,
      geo
    },
    "places": *[_type == "place" && reviewStatus == "approved" && containedInPlace._ref == $parentRef && _id != $id] | order(_createdAt desc) [0...4] {
      _id, _type,
      "title": title.${lang},
      "slug": slug.${lang}.current,
      ${mainImageFragment()},
      placeType,
      geo
    }
  }`
}

export type { PlaceResult }
