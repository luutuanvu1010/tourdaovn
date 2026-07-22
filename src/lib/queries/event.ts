// queries/event.ts — GROQ query cho Event
// Nguồn: 01-CONTENT_MODEL.md §2.10, cms/schemas/event.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, galleryFragment,
  faqFragment, entityRefFragment, imageProvenanceFragment, bodyFragment
} from './fragments'
import type { EventResult } from '../types'

export function eventBySlugQuery(lang: string): string {
  return `*[_type == "event" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
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
    eventType,
    startDate,
    endDate,
    "location": location->${entityRefFragment(lang)},
    "organizer": select(organizer->reviewStatus == "approved" => organizer->${entityRefFragment(lang)}, null),
    eventStatus,
    isAccessibleForFree,
    bookingRef { key },
    ticketUrl,
    ${bodyFragment(lang)},
    ${galleryFragment()},
    ${faqFragment(lang)},
    ${imageProvenanceFragment()}
  }`
}

export function allEventsQuery(lang: string): string {
  return `*[_type == "event" && reviewStatus == "approved"] | order(startDate asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    eventType,
    startDate,
    endDate,
    eventStatus,
    isAccessibleForFree
  }`
}

export function nearbyEventsQuery(lang: string): string {
  return `*[_type == "event" && reviewStatus == "approved" && _id != $id && (location._ref == $locationRef || eventType == $eventType)] | order(startDate asc) [0...4] {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    ${mainImageFragment()},
    eventType,
    startDate,
    endDate,
    eventStatus
  }`
}

export type { EventResult }
