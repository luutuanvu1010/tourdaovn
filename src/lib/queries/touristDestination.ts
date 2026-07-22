// queries/touristDestination.ts — GROQ query cho TouristDestination
// Nguồn: 01-CONTENT_MODEL.md §2.1, cms/schemas/touristDestination.ts
// i18n: field-level (ADR-0004)

import {
  baseFieldsFragment, mainImageFragment, galleryFragment,
  faqFragment, entityRefFragment, imageProvenanceFragment, bodyFragment,
  highlightsFragment, keyFactsFragment, safetyNoteFragment
} from './fragments'
import type { TouristDestinationResult } from '../types'

/**
 * GROQ query lấy TouristDestination (Nha Trang) theo slug.
 * Deref tất cả featured* references để template dùng ngay.
 *
 * @param lang Ngôn ngữ hiện tại
 */
export function touristDestinationBySlugQuery(lang: string): string {
  return `*[
    _type == "touristDestination" &&
    reviewStatus == "approved" &&
    (slug.${lang}.current == $slug || slug.vi.current == $slug)
  ][0]{
    _id, _type, _createdAt, _updatedAt,
    "title": title.${lang},
    "slug": coalesce(slug.${lang}.current, slug.vi.current),
    "summary": summary.${lang},
    ${mainImageFragment()},
    "seo": {
      "metaTitle": seo.metaTitle.${lang},
      "metaDescription": seo.metaDescription.${lang}
    },
    "category": category[]->{ _id, name, termCode, _type },
    reviewStatus, approvedBy, contentProvenance,
    publishedAt, updatedAt,
    sameAs,
    geo,
    containedInPlaceRef,
    ${bodyFragment(lang)},
    ${keyFactsFragment(lang)},
    "homepageBanners": homepageBanners[isActive == true] | order(priority asc)[0...3]{
      _key,
      "title": coalesce(title.${lang}, title.vi),
      "description": coalesce(description.${lang}, description.vi),
      "linkLabel": coalesce(linkLabel.${lang}, linkLabel.vi),
      linkUrl,
      image {
        _type, asset->{ _id, url, metadata { dimensions { width, height } } },
        hotspot, "alt": alt
      },
      variant,
      theme,
      isActive,
      priority
    },
    "homepagePlaces": *[_type == "place" && reviewStatus == "approved" && defined(slug.${lang}.current)] | order(
      select(
        placeType == "area" => 0,
        placeType == "beach" => 1,
        placeType == "island" => 2,
        placeType == "landform" => 3,
        placeType == "ward" => 4,
        9
      ),
      title.${lang} asc
    )[0...4]{
      _id, _type,
      "title": coalesce(title.${lang}, title.vi),
      "slug": slug.${lang}.current,
      "summary": coalesce(summary.${lang}, summary.vi),
      ${mainImageFragment()},
      placeType
    },
    "homepageArticles": *[_type == "article" && reviewStatus == "approved" && language == "${lang}" && defined(slug.current)] | order(
      select(
        articleType == "transport-guide" => 0,
        articleType == "itinerary" => 1,
        articleType == "guide" => 2,
        9
      ),
      publishedAt desc,
      updatedAt desc
    )[0...4]{
      _id, _type,
      title,
      "slug": slug.current,
      summary,
      ${mainImageFragment()},
      language,
      articleType,
      publishedAt,
      updatedAt,
      "author": author->{
        _id,
        "title": title.vi,
        "slug": slug.vi.current
      }
    },
    ${highlightsFragment(lang)},
    ${faqFragment(lang)},
    ${galleryFragment()},
    "featuredAttractions": featuredAttractions[]->${entityRefFragment(lang)},
    "featuredStays": featuredStays[]->${entityRefFragment(lang)},
    "featuredExperiences": featuredExperiences[]->${entityRefFragment(lang)},
    "featuredSpecialties": featuredSpecialties[]->${entityRefFragment(lang)},
    "featuredTours": featuredTours[]->${entityRefFragment(lang)},
    relatedDestinations,
    ${safetyNoteFragment(lang)},
    ${imageProvenanceFragment()}
  }`
}

export function allDestinationSlugsQuery(): string {
  return `*[_type == "touristDestination" && reviewStatus == "approved"]{
    "slug": slug.vi.current
  }`
}

export type { TouristDestinationResult }
