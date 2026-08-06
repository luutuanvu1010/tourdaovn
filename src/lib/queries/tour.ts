// queries/tour.ts — GROQ query cho Tour
// Nguồn: 01-CONTENT_MODEL.md §2.8, cms/schemas/tour.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, galleryFragment,
  faqFragment, imageProvenanceFragment, bodyFragment,
  highlightsFragment, includesFragment, excludesFragment,
  touristTypeFragment, departureNoteFragment, seasonNoteFragment,
  licenseInfoFragment
} from './fragments'
import type { TourResult } from '../types'

export function tourBySlugQuery(lang: string): string {
  return `*[_type == "tour" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
    _id, _type, _createdAt, _updatedAt,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    "seo": {
      "metaTitle": seo.metaTitle.${lang},
      "metaDescription": seo.metaDescription.${lang}
    },
    "category": category[]->{ _id, name, termCode, _type, sameAs },
    reviewStatus, approvedBy, contentProvenance,
    publishedAt, updatedAt,
    itinerary[] {
      "place": place->{
        _id, _type,
        "title": coalesce(title.${lang}, title),
        "slug": coalesce(slug.${lang}.current, slug.current),
        "summary": coalesce(summary.${lang}, summary),
        ${mainImageFragment()},
        geo
      },
      externalStop { name, geo, sameAs },
      note,
      durationAtStop
    },
    "operator": select(operator->reviewStatus == "approved" => operator->{
      _id, _type,
      "title": title.${lang},
      "slug": slug.${lang}.current,
      "summary": summary.${lang},
      ${mainImageFragment()},
      url, officialSource,
      ${licenseInfoFragment(lang)}
    }, null),
    tourFormat,
    "tripOrigin": tripOrigin->{
      _id, _type,
      "title": coalesce(title.${lang}, title),
      "slug": coalesce(slug.${lang}.current, slug.current),
      "summary": coalesce(summary.${lang}, summary),
      ${mainImageFragment()},
      geo
    },
    ${departureNoteFragment(lang)},
    duration,
    ${includesFragment(lang)},
    ${excludesFragment(lang)},
    ${touristTypeFragment(lang)},
    ${seasonNoteFragment(lang)},
    bookingRef { key },
    ${bodyFragment(lang)},
    ${galleryFragment()},
    ${highlightsFragment(lang)},
    ${faqFragment(lang)},
    ${imageProvenanceFragment()}
  }`
}

export function allToursQuery(lang: string): string {
  return `*[_type == "tour" && reviewStatus == "approved"] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    tourFormat,
    duration,
    bookingRef { key }
  }`
}

export function toursByTypeQuery(lang: string): string {
  return `*[_type == "tour" && reviewStatus == "approved" && references(*[_type == "category" && slug.current == $slug]._id)] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    tourFormat,
    duration,
    bookingRef { key }
  }`
}

export function nearbyToursQuery(lang: string): string {
  return `*[_type == "tour" && reviewStatus == "approved" && _id != $id && (operator._ref == $operatorRef || count(category[@._ref in $categoryRefs]) > 0)] [0...4] {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    ${mainImageFragment()},
    tourFormat,
    duration,
    bookingRef { key }
  }`
}

export type { TourResult }
