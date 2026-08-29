// queries/category.ts — GROQ query cho Category
// Nguồn: 01-CONTENT_MODEL.md §2.13, cms/schemas/category.ts
// Category không dùng baseFields — dùng name/description thay title/summary
// Miễn reviewStatus vì founder tuyển = duyệt (I19 ngoại lệ)
// name và description là object localized {vi,en,zh,ko,ru}

import type { CategoryResult } from '../types'

export function categoryByTermCodeQuery(slugParam = '$termCode', lang = 'vi'): string {
  return `*[_type == "category" && termCode.current == ${slugParam}][0]{
    _id,
    _type,
    "name": coalesce(name.${lang}, name.vi),
    "description": coalesce(description.${lang}, description.vi),
    inDefinedTermSet,
    "termCode": termCode.current,
    "slug": slug.current,
    sameAs,
    publishedAt,
    updatedAt
  }`
}

/**
 * Category theo slug — nuôi trang term `/{segment}/{termSlug}/`.
 *
 * Danh sách bộ term ở đây phải phủ ĐÚNG các bộ mà `[...path].astro` sinh đường
 * dẫn, tức mọi khoá của `TERM_SET_ENTITY`. Thiếu một bộ thì đường dẫn vẫn sinh
 * ra nhưng truy vấn trả null, `RouteDispatch` bật `notFound`, và trang 404
 * ĐƯỢC XUẤT BẢN như một trang thật — không cổng nào bắt vì cổng chỉ soi trang
 * đã dựng chứ không đối chiếu hai danh sách này với nhau. Đúng chuyện đã xảy ra
 * với `attraction-type` khi mở enum: `/diem-tham-quan/di-tich-lich-su/` và
 * `/diem-tham-quan/thien-nhien-sinh-thai/` ra 404. Xem DR-077.
 */
export function categoryBySlugQuery(lang = 'vi'): string {
  return `*[_type == "category" && inDefinedTermSet in ["experience-type", "tour-type", "attraction-type"] && slug.current == $slug][0]{
    _id,
    _type,
    "name": coalesce(name.${lang}, name.vi),
    "description": coalesce(description.${lang}, description.vi),
    inDefinedTermSet,
    "termCode": termCode.current,
    "slug": slug.current,
    sameAs,
    publishedAt,
    updatedAt
  }`
}

export function categoriesBySetQuery(slugParam = '$setName', lang = 'vi'): string {
  return `*[_type == "category" && inDefinedTermSet == ${slugParam}] | order(name.${lang} asc) {
    _id,
    _type,
    "name": coalesce(name.${lang}, name.vi),
    "description": coalesce(description.${lang}, description.vi),
    inDefinedTermSet,
    "termCode": termCode.current,
    "slug": slug.current,
    sameAs
  }`
}

export type { CategoryResult }
