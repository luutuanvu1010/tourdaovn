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
    heroText {
      vi,
      en,
      zh,
      ko,
      ru
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
