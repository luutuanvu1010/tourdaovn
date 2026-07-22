// Cấu hình cổng cho tourdao. validate-min.ts đọc file này để chạy V2 (reference)
// và V3 (governance + field bắt buộc) trên dữ liệu thật lúc build.

export interface RefRule {
  field: string
  to: string
}

export interface GateConfig {
  // Type có render trang, phải reviewStatus == "approved" mới được publish.
  publishableTypes: string[]
  // Field bắt buộc theo type (điều kiện completeness tối thiểu).
  requiredFields: Record<string, string[]>
  // Reference phải deref được, đúng type đích.
  references: Record<string, RefRule[]>
}

export const GATE: GateConfig = {
  publishableTypes: ['organization', 'tour', 'hotel', 'article', 'author'],
  requiredFields: {
    organization: ['name', 'slug', 'description', 'logo', 'url'],
    tour: ['title', 'slug', 'serviceType', 'summary', 'heroImage', 'provider'],
    hotel: ['name', 'slug', 'description', 'images', 'address'],
    article: ['title', 'slug', 'excerpt', 'body', 'author', 'publishedAt'],
    author: ['name', 'slug', 'bio', 'avatar', 'sameAs'],
  },
  references: {
    tour: [{ field: 'provider', to: 'organization' }],
    article: [{ field: 'author', to: 'author' }],
  },
}
