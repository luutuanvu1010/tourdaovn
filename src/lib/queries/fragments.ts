// fragments.ts — GROQ fragment dùng chung cho mọi entity query
// Nguồn: cms/schemas/baseFields.ts, 01-CONTENT_MODEL.md §2.0

/**
 * Fragment cho entity field-level i18n (13/14 entity).
 * Dùng với template literal: nội suy ${lang} trực tiếp vào query string.
 *
 * Cách dùng:
 *   const q = `*[...]{ ${baseFieldsFragment('vi')} }`
 */
export function baseFieldsFragment(lang: string): string {
  // title, summary là object localized → pick theo lang
  // slug là object localized → pick slug.current theo lang
  // seo.metaTitle, seo.metaDescription cũng localized
  return `
    _id, _type, _createdAt, _updatedAt,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
    "seo": {
      "metaTitle": seo.metaTitle.${lang},
      "metaDescription": seo.metaDescription.${lang}
    },
    "category": category[]->{ _id, "name": name.${lang}, termCode, _type },
    reviewStatus, approvedBy, contentProvenance,
    publishedAt, updatedAt
  `
}

/**
 * Fragment cho Article (document-level i18n).
 * Không pick localized field vì Article dùng document-level.
 */
export function baseDocFieldsFragment(): string {
  return `
    _id, _type, _createdAt, _updatedAt,
    title,
    "slug": slug.current,
    language,
    translationGroup,
    summary,
    ${mainImageFragment()},
    seo { metaTitle, metaDescription },
    "category": category[]->{ _id, "name": coalesce(name[$lang], name.vi), termCode, _type },
    reviewStatus, approvedBy, contentProvenance,
    publishedAt, updatedAt
  `
}

/**
 * Fragment ảnh — dùng chung cho mainImage và gallery item.
 * Luôn lấy alt (bắt buộc khi có ảnh, I12).
 */
export function mainImageFragment(): string {
  return `mainImage {
    _type, asset->{ _id, url, metadata { dimensions { width, height } } },
    hotspot, "alt": alt
  }`
}

/**
 * Fragment gallery — mảng ảnh có alt bắt buộc.
 */
export function galleryFragment(): string {
  return `gallery[] {
    _type, asset->{ _id, url, metadata { dimensions { width, height } } },
    hotspot, "alt": alt
  }`
}

/**
 * Fragment FAQ — object localized mảng question/answer.
 */
export function faqFragment(lang: string): string {
  return `"faq": coalesce(faq.${lang}, faq.vi)`
}

/**
 * Fragment highlights — object localized mảng string.
 */
export function highlightsFragment(lang: string): string {
  return `"highlights": coalesce(highlights.${lang}[], highlights.vi[])`
}

/**
 * Fragment entity reference rút gọn — dùng khi deref trong GROQ.
 * Trả về _id, _type, title (theo lang), slug (theo lang), mainImage.
 */
export function entityRefFragment(lang: string): string {
  return `{
    _id, _type,
    "title": title.${lang},
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()}
  }`
}

/**
 * Fragment openingHours — object { open, close, note }.
 */
export function openingHoursFragment(): string {
  return `openingHours { open, close, note }`
}

/**
 * Fragment body portable text — object localized.
 *
 * QĐ-2026-08-25-03: deref `asset->` cho khối ảnh trong thân bài.
 *
 * Trước đó fragment này trả portable text THÔ, nên khối ảnh chỉ có
 * `asset: { _ref, _type: 'reference' }` — không có `url`. `Body.astro` gọi
 * `imageUrl()`, hàm đó đòi `asset.url`, trả `undefined`, và component
 * `return null`. Kết quả: **ảnh trong thân bài biến mất im lặng trên 66 trang
 * đã phát hành**, không cổng nào đỏ vì không có gì để đỏ — HTML hợp lệ, chỉ
 * thiếu một thẻ `<figure>`.
 *
 * Hình dạng `asset->` chép đúng `mainImageFragment` để `imageUrl()` và
 * `isSvg()` dùng chung một hợp đồng, không phải hai.
 */
export function bodyFragment(lang: string): string {
  return `"body": coalesce(body.${lang}, body.vi)[] {
    ...,
    _type == "image" => {
      asset->{ _id, url, mimeType, metadata { dimensions { width, height } } }
    }
  }`
}

/**
 * Fragment thân bài cho entity i18n **document-level** — hôm nay chỉ có Article
 * (ADR-0004). Ở đó `body` là mảng PHẲNG, không phải object `{vi, en}`, nên
 * `bodyFragment()` ở trên KHÔNG dùng được: `coalesce(body.vi, body.vi)` trên một
 * mảng trả về `null` và cả thân bài biến mất.
 *
 * QĐ-2026-08-25-03 vá `asset->` cho 11 truy vấn i18n field-level nhưng bỏ sót
 * đúng nhánh này; `queries/article.ts` vì thế còn lấy `body,` THÔ suốt từ đó.
 * Hệ quả đo được trên bản dựng 2026-08-30: 23 trang cẩm nang, 0 thẻ `<figure>`
 * trong thân bài, trong khi dữ liệu Sanity có 2–14 khối ảnh mỗi bài. Không cổng
 * nào đỏ vì HTML vẫn hợp lệ — chỉ thiếu ảnh.
 *
 * Hai hàm CỐ Ý tách đôi, đừng gộp: khác nhau ở chiều ngôn ngữ của `body`, không
 * phải ở hình dạng ảnh. Phần `asset->` dưới đây phải chép đúng `bodyFragment` và
 * `mainImageFragment` để `imageUrl()` và `isSvg()` dùng chung một hợp đồng.
 */
export function bodyDocFragment(): string {
  return `body[] {
    ...,
    _type == "image" => {
      asset->{ _id, url, mimeType, metadata { dimensions { width, height } } }
    }
  }`
}

/**
 * Fragment imageProvenance.
 */
export function imageProvenanceFragment(): string {
  return `imageProvenance`
}

// ─── Fragment cho field rich đã localized ───

export function keyFactsFragment(lang: string): string {
  return `"keyFacts": coalesce(keyFacts.${lang}, keyFacts.vi)`
}

export function accessInfoFragment(lang: string): string {
  return `"accessInfo": coalesce(accessInfo.${lang}, accessInfo.vi)`
}

export function safetyNoteFragment(lang: string): string {
  return `"safetyNote": coalesce(safetyNote.${lang}, safetyNote.vi)`
}

export function seasonNoteFragment(lang: string): string {
  return `"seasonNote": coalesce(seasonNote.${lang}, seasonNote.vi)`
}

export function departureNoteFragment(lang: string): string {
  return `"departureNote": coalesce(departureNote.${lang}, departureNote.vi)`
}

export function originNoteFragment(lang: string): string {
  return `"originNote": coalesce(originNote.${lang}, originNote.vi)`
}

export function seasonFragment(lang: string): string {
  return `"season": coalesce(season.${lang}, season.vi)`
}

export function includesFragment(lang: string): string {
  return `"includes": coalesce(includes.${lang}, includes.vi)`
}

export function excludesFragment(lang: string): string {
  return `"excludes": coalesce(excludes.${lang}, excludes.vi)`
}

export function touristTypeFragment(lang: string): string {
  return `"touristType": coalesce(touristType.${lang}, touristType.vi)`
}

export function amenityFeatureFragment(lang: string): string {
  return `"amenityFeature": coalesce(amenityFeature.${lang}, amenityFeature.vi)`
}

export function onSiteActivitiesFragment(lang: string): string {
  return `"onSiteActivities": coalesce(onSiteActivities.${lang}, onSiteActivities.vi)`
}

export function licenseInfoFragment(lang: string): string {
  return `"licenseInfo": coalesce(licenseInfo.${lang}, licenseInfo.vi)`
}

export function beachAccessFragment(lang: string): string {
  return `"beachAccess": coalesce(beachAccess.${lang}, beachAccess.vi)`
}

export function servesCuisineFragment(lang: string): string {
  return `"servesCuisine": coalesce(servesCuisine.${lang}, servesCuisine.vi)`
}
