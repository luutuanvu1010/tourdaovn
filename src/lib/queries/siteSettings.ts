// queries/siteSettings.ts — GROQ query cho siteSettings singleton

/**
 * Hình chiếu ảnh nhận diện (CONTENT_MODEL §2.15 v1.0.17).
 *
 * CỐ Ý KHÔNG nằm trong `siteSettingsQuery()` dưới đây. `branding` được đọc qua
 * ĐÚNG MỘT đường — `src/lib/siteBranding.ts` — vì Header, Footer và BaseLayout
 * cần nó ở mọi trang, còn truy vấn đầy đủ chỉ chạy ở trang chủ. Để nó ở cả hai
 * nơi thì trang chủ đọc bản này còn các trang khác đọc bản kia; hai đường lệch
 * nhau là header có logo mà JSON-LD thì không — đúng thứ N7 cấm.
 *
 * `mimeType` cần cho việc phân biệt SVG (Sanity CDN không biến đổi được) với
 * ảnh raster.
 */
export const BRANDING_PROJECTION = `branding {
      logo { _type, asset->{ _id, url, mimeType } },
      hideWordmark,
      favicon { _type, asset->{ _id, url, mimeType } },
      ogImage { _type, asset->{ _id, url, mimeType, metadata { dimensions } }, hotspot, "alt": alt }
    }`

/**
 * Hình chiếu chân trang (CONTENT_MODEL §2.15 v1.0.18, QĐ-2026-08-14-03).
 *
 * CỐ Ý KHÔNG nằm trong `siteSettingsQuery()`, đúng lý do của `BRANDING_PROJECTION`
 * ngay trên: `Footer.astro` render ở MỌI trang, còn truy vấn đầy đủ chỉ chạy ở
 * trang chủ. Đọc qua đúng một đường — `src/lib/siteFooter.ts`.
 *
 * `hero` thì ngược lại: chỉ trang chủ mới có Hero, nên nó đi thẳng trong truy vấn
 * đầy đủ bên dưới, không đẻ thêm đường đọc nào.
 */
export const FOOTER_PROJECTION = `footer {
      tagline,
      disclaimer,
      backgroundImage { _type, asset->{ _id, url, mimeType }, hotspot },
      badges[] {
        _key,
        kind,
        image { _type, asset->{ _id, url, mimeType } },
        alt,
        url
      }
    }`

/**
 * GROQ query lay document siteSettings duy nhat.
 */
export function siteSettingsQuery(): string {
  return `*[_type == "siteSettings" && _id == "siteSettings"][0]{
    title,
    theme,
    sections[]{
      _key,
      key,
      hidden
    },
    hero {
      eyebrow,
      heading,
      summary,
      image { _type, asset->{ _id, url, mimeType }, hotspot },
      imageCredit,
      ctaPrimaryLabel,
      ctaSecondaryLabel
    },
    contact {
      hotline,
      zaloUrl,
      whatsapp,
      email
    },
    pickupPoints[]{
      _key,
      stopName,
      stopAddress,
      geo,
      pickupTime,
      pickupNote,
      hidden
    },
    support {
      bookingGuide[] { step, text },
      cancellationPolicy,
      faq[] { question, answer }
    },
    stats[] { value, label, note },
    partners[] {
      name,
      logo { _type, asset->{ _id, url }, hotspot, "alt": alt },
      url
    },
    testimonials[] { quote, authorName, authorNote, sourceName, sourceUrl },
    groupQuote { heading, text, ctaLabel }
  }`
}
