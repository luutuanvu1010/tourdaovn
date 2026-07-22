// queries/siteSettings.ts — GROQ query cho siteSettings singleton

/**
 * GROQ query lay document siteSettings duy nhat.
 */
export function siteSettingsQuery(): string {
  return `*[_type == "siteSettings" && _id == "siteSettings"][0]{
    title,
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
    }
  }`
}
