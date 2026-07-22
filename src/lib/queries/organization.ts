// queries/organization.ts — GROQ query cho Organization
// Nguồn: 01-CONTENT_MODEL.md §2.9, cms/schemas/organization.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, imageProvenanceFragment, bodyFragment,
  licenseInfoFragment
} from './fragments'
import type { OrganizationResult } from '../types'

export function organizationBySlugQuery(lang: string): string {
  return `*[_type == "organization" && slug.${lang}.current == $slug && reviewStatus == "approved"][0]{
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
    orgType,
    url,
    officialSource,
    sameAs,
    logo { _type, asset->{ _id, url }, hotspot, "alt": alt },
    geo,
    address { street, ward },
    telephone,
    ${licenseInfoFragment(lang)},
    ${bodyFragment(lang)},
    ${imageProvenanceFragment()}
  }`
}

export function allOrganizationsQuery(lang: string): string {
  return `*[_type == "organization" && reviewStatus == "approved"] | order(title.${lang} asc) {
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    ${mainImageFragment()},
    orgType
  }`
}

export function nearbyForOrganizationQuery(lang: string): string {
  return `{
    "tours": *[_type == "tour" && reviewStatus == "approved" && operator._ref == $orgId] [0...4] {
      _id, _type,
      "title": title.${lang},
      "slug": slug.${lang}.current,
      ${mainImageFragment()},
      tourFormat,
      duration,
      bookingRef { key }
    },
    "events": *[_type == "event" && reviewStatus == "approved" && organizer._ref == $orgId] [0...4] {
      _id, _type,
      "title": title.${lang},
      "slug": slug.${lang}.current,
      ${mainImageFragment()},
      eventType,
      startDate,
      endDate,
      eventStatus
    }
  }`
}

export type { OrganizationResult }
