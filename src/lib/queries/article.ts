// queries/article.ts — GROQ query cho Article
// Nguồn: 01-CONTENT_MODEL.md §2.11, cms/schemas/article.ts
// i18n: document-level (ADR-0004) — entity DUY NHẤT đi nhánh này
// body và faq là field phẳng (document-level, không localized)

import {
  baseDocFieldsFragment, mainImageFragment, galleryFragment,
  entityRefFragment, imageProvenanceFragment
} from './fragments'
import type { ArticleResult } from '../types'

export function articleBySlugQuery(): string {
  return `*[_type == "article" && slug.current == $slug && language == $lang && reviewStatus == "approved"][0]{
    _id, _type, _createdAt, _updatedAt,
    title,
    "slug": slug.current,
    language,
    translationGroup,
    summary,
    ${mainImageFragment()},
    ${galleryFragment()},
    seo { metaTitle, metaDescription },
    "category": category[]->{ _id, "name": coalesce(name[$lang], name.vi), termCode, _type },
    reviewStatus, approvedBy, contentProvenance,
    publishedAt, updatedAt,
    articleType,
    "author": author->{
      _id, _type,
      "title": title.vi,
      "slug": slug.vi.current,
      "summary": summary.vi,
      ${mainImageFragment()},
      sameAs,
      url,
      // QĐ-2026-08-25-03: jobTitle la object i18n. Thieu chieu ngon ngu thi
      // component render ra chuoi "[object Object]" — da len trang song o 2
      // trang cam nang. queries/person.ts:29 von da chieu dung; hang nay sot.
      // (Chu thich khong dau va khong backtick: khoi nay nam TRONG template
      //  literal cua GROQ, backtick se dong chuoi.)
      "jobTitle": jobTitle.vi,
      imageProvenance
    },
    body,
    "about": about[]->{
      _id, _type,
      "title": coalesce(title[$lang], title.vi, title.en),
      "slug": coalesce(slug[$lang].current, slug.vi.current, slug.en.current),
      "summary": coalesce(summary[$lang], summary.vi, summary.en)
    },
    "mentions": mentions[]->{
      _id, _type,
      "title": coalesce(title[$lang], title.vi, title.en),
      "slug": coalesce(slug[$lang].current, slug.vi.current, slug.en.current),
      "summary": coalesce(summary[$lang], summary.vi, summary.en)
    },
    faq[] { question, answer },
    howTo[] { step, text },
    ${imageProvenanceFragment()}
  }`
}

export function allArticlesQuery(): string {
  return `*[_type == "article" && language == $lang && reviewStatus == "approved"] | order(publishedAt desc) {
    _id, _type,
    title,
    "slug": slug.current,
    language,
    summary,
    ${mainImageFragment()},
    articleType,
    publishedAt,
    "author": author->{
      _id,
      "title": title.vi,
      "slug": slug.vi.current
    }
  }`
}

export function relatedArticlesQuery(): string {
  return `*[_type == "article" && language == $lang && reviewStatus == "approved" && slug.current \!= $slug && count(category[@._ref in $categoryRefs]) > 0] | order(publishedAt desc) [0...5] {
    _id, _type,
    title,
    "slug": slug.current,
    ${mainImageFragment()},
    articleType,
    publishedAt
  }`
}

export function nearbyArticlesQuery(): string {
  return `*[_type == "article" && language == $lang && reviewStatus == "approved" && slug.current != $slug && (count(about[@._ref in $aboutRefs]) > 0 || articleType == $articleType)] | order(publishedAt desc) [0...4] {
    _id, _type,
    title,
    "slug": slug.current,
    ${mainImageFragment()},
    articleType,
    publishedAt,
    "author": author->{ _id, "title": title.vi, "slug": slug.vi.current }
  }`
}

export type { ArticleResult }
