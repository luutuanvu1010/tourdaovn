// GROQ fragment dùng chung, component-ready. Deref reference tại thời điểm build.
// Mỗi site thêm query theo entity của mình, tái dùng các fragment dưới.

export const imageFragment = `{
  "url": asset->url,
  "alt": alt,
  "lqip": asset->metadata.lqip,
  "dimensions": asset->metadata.dimensions
}`

// Field cơ bản mọi entity publish đều có (starter single-locale).
export const baseFragment = `
  _id,
  _type,
  "title": title,
  "slug": slug.current,
  "summary": summary,
  reviewStatus,
  publishedAt,
  updatedAt
`

// Chỉ lấy doc đã approved (điều kiện publish).
export const approvedFilter = `reviewStatus == "approved"`
