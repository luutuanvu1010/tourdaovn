// queries/siteSettings.ts — GROQ query cho siteSettings singleton

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
