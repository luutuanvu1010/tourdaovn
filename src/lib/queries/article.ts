// queries/article.ts — GROQ query cho Article
// Nguồn: 01-CONTENT_MODEL.md §2.11, cms/schemas/article.ts
// i18n: document-level (ADR-0004) — entity DUY NHẤT đi nhánh này
// body và faq là field phẳng (document-level, không localized)

import {
  baseDocFieldsFragment, mainImageFragment, galleryFragment,
  entityRefFragment, imageProvenanceFragment, bodyDocFragment
} from './fragments'
import type { ArticleResult } from '../types'

/**
 * QĐ-2026-08-25-03 áp MUỘN cho Article.
 *
 * Hàng thân bài trong truy vấn này từng là `body,` thô, nên khối ảnh chỉ mang
 * `asset: { _ref }` — không có `url`. `Body.astro` gọi `imageUrl()`, nhận
 * `undefined`, rồi `return null`. Ảnh thân bài vì thế biến mất im lặng trên
 * TOÀN BỘ trang cẩm nang: đo trên bản dựng 2026-08-30 được 23 trang, 0 thẻ
 * `<figure>`, trong khi dữ liệu Sanity có 2–14 khối ảnh mỗi bài.
 *
 * Không dùng `bodyFragment(lang)` được: Article là i18n document-level
 * (ADR-0004), `body` của nó là mảng PHẲNG chứ không phải object theo ngôn ngữ.
 * Xem `bodyDocFragment()` trong `fragments.ts` để biết vì sao có hai hàm.
 */
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
    // Than bai deref asset-> qua bodyDocFragment; xem docblock tren ham.
    // (Chu thich trong template literal: khong backtick, backtick se dong chuoi.)
    ${bodyDocFragment()},
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
