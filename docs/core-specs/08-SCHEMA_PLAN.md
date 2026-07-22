# 08 — SCHEMA PLAN (Sanity Schema từ CONTENT_MODEL)

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Nguồn: nhatrangtravel/project/08-SCHEMA_PLAN.md · Nhóm A (tái dùng CAO)
Blueprint dịch CONTENT_MODEL → schema Sanity: cấu trúc thư mục, pattern baseFields/lodgingBase
dùng spread, chiến lược i18n document-level vs field-level, thứ tự thi công theo reference.
Phần riêng site cần thay khi copy đi (tìm 🔧 SITE-SPECIFIC):
  - Danh mục 14 entity + tên file schema (place/attraction/specialty/touristDestination...).
  - initialValue 'Nha Trang' trong lodgingBase.
  - 3 ví dụ schema hoàn chỉnh mang dữ liệu Nha Trang.
Phần KHÔNG nhãn (cấu trúc thư mục cms/, pattern spread baseFields, chiến lược i18n) = khuôn.
═══════════════════════════════════════════════════════════════════ -->

> Bước 8.1 — cầu nối giữa spec (01) và code (Sanity Studio). File này là plan thi công: đọc là làm được, không cần đoán.
>
> 🔧 **SITE-SPECIFIC:** danh mục 14 entity và mọi tên schema cụ thể là của nhatrangtravel. Giữ *pattern* (baseFields spread, i18n, thứ tự thi công); thay *danh mục entity* theo site.

- **Đầu vào:** `01-CONTENT_MODEL.md` v1.0.1
- **Đầu ra:** Thư mục `cms/schemas/` với 14 entity + 1 base group + config i18n
- **Ngày:** 2026-06-12

---

## 1. Cấu trúc thư mục Sanity

```
cms/
├── sanity.config.ts          ← define workspace, plugins, i18n
├── sanity.cli.ts             ← CLI config
├── schemas/
│   ├── index.ts              ← export tất cả schema types
│   ├── baseFields.ts         ← field chung §2.0 (shared, không phải document)
│   ├── lodgingBase.ts        ← field group LodgingBase §2.0b
│   ├── touristDestination.ts ← §2.1
│   ├── place.ts              ← §2.2
│   ├── attraction.ts         ← §2.3
│   ├── experience.ts         ← §2.4
│   ├── restaurant.ts         ← §2.5
│   ├── hotel.ts              ← §2.6
│   ├── resort.ts             ← §2.7
│   ├── tour.ts               ← §2.8
│   ├── organization.ts       ← §2.9
│   ├── event.ts              ← §2.10
│   ├── article.ts            ← §2.11
│   ├── person.ts             ← §2.12
│   ├── category.ts           ← §2.13
│   └── specialty.ts          ← §2.14
├── lib/
│   └── fieldGroups.ts        ← groups for Studio UI (nội dung, địa lý, SEO...)
└── deskStructure.ts          ← custom desk structure (nhóm entity theo họ)
```

---

## 2. Mapping kiểu dữ liệu: CONTENT_MODEL → Sanity

| CONTENT_MODEL | Sanity type | Ghi chú |
|---|---|---|
| `string` | `defineField({ type: 'string' })` | — |
| `text` | `defineField({ type: 'text' })` | multiline |
| `slug` | `defineField({ type: 'slug' })` | options.source từ title |
| `number` | `defineField({ type: 'number' })` | — |
| `boolean` | `defineField({ type: 'boolean' })` | — |
| `datetime` | `defineField({ type: 'datetime' })` | ISO 8601 |
| `time` | `defineField({ type: 'string' })` | HH:MM format |
| `url` | `defineField({ type: 'url' })` | validation: uri() |
| `geopoint` | `defineField({ type: 'geopoint' })` | lat + lng + alt |
| `image` | `defineField({ type: 'image' })` | fields: alt text |
| `array` (string) | `defineField({ type: 'array', of: [{type:'string'}] })` | — |
| `array` (image) | `defineField({ type: 'array', of: [{type:'image'}] })` | gallery |
| `array` (object) | `defineField({ type: 'array', of: [{type:'object'}] })` | itinerary, keyFacts |
| `array` (reference) | `defineField({ type: 'array', of: [{type:'reference', to:[...]}] })` | — |
| `reference` | `defineField({ type: 'reference', to: [...] })` | đơn hoặc mảng |
| `object` | `defineField({ type: 'object' })` | address, seo |
| `object localized` | `defineField({ type: 'object', options: {i18n: true} })` | field-level i18n |
| `string enum` | `defineField({ type: 'string', options: {list: [...]} })` | — |
| `portable text` | `defineField({ type: 'array', of: [{type:'block'},{type:'image'}] })` | body, bio, accessInfo |
| `reference hoặc string` (bookingRef) | `{ type: 'object', fields: [{name:'ref', type:'reference'}, {name:'key', type:'string'}] }` | hỗn hợp: trỏ entity nội bộ hoặc key ngoài |

---

## 3. Chiến lược i18n

### 3.1 Document-level (chỉ Article)

Mỗi ngôn ngữ = một document riêng, nhóm bằng `translationGroup`.

```ts
// article.ts
defineField({
  name: 'language',
  type: 'string',
  options: { list: [
    { title: 'Tiếng Việt', value: 'vi' },
    { title: 'English', value: 'en' },
    { title: '中文', value: 'zh' },
    { title: '한국어', value: 'ko' },
    { title: 'Русский', value: 'ru' },
  ]}
})
defineField({
  name: 'translationGroup',
  type: 'reference',
  to: [{ type: 'article' }],
  weak: true
})
```

Slug unique: `(language, _type)` — không dùng i18n plugin, viết custom validation.

### 3.2 Field-level (tất cả entity còn lại)

Dùng `@sanity/document-internationalization` plugin với schema option `i18n: true` cho field dịch được.

```ts
// sanity.config.ts
import { documentInternationalization } from '@sanity/document-internationalization'

export default defineConfig({
  plugins: [
    documentInternationalization({
      supportedLanguages: [
        { id: 'vi', title: 'Tiếng Việt' },
        { id: 'en', title: 'English' },
        { id: 'zh', title: '中文' },
        { id: 'ko', title: '한국어' },
        { id: 'ru', title: 'Русский' },
      ],
      schemaTypes: ['place','attraction','experience','restaurant','specialty','hotel','resort','tour','organization','event','person','category','touristDestination']
    })
  ]
})
```

Field không dịch (geo, sameAs, reference...) bỏ `options: { i18n: true }`.

---

## 4. Các pattern field tái dùng

### 4.1 baseFields.ts — §2.0

```ts
// Mọi entity kế thừa 7 field này
export const baseFields = [
  defineField({ name: 'title', type: 'string', validation: Rule => Rule.required() }),
  defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
  defineField({ name: 'summary', type: 'text', rows: 3, validation: Rule => Rule.required() }),
  defineField({
    name: 'mainImage', type: 'image',
    fields: [{ name: 'alt', type: 'string', validation: Rule => Rule.required() }]
  }),
  defineField({ name: 'seo', type: 'object',
    fields: [
      { name: 'metaTitle', type: 'string' },
      { name: 'metaDescription', type: 'text', rows: 2 }
    ]
  }),
  defineField({ name: 'category', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }] }),
  // Bộ quản trị (I19)
  defineField({
    name: 'reviewStatus', type: 'string',
    options: { list: ['draft','inReview','approved'].map(v => ({ title: v, value: v })) },
    initialValue: 'draft'
  }),
  defineField({ name: 'approvedBy', type: 'string' }),
  defineField({
    name: 'contentProvenance', type: 'string',
    options: { list: ['human','ai-t1','mixed'].map(v => ({ title: v, value: v })) }
  }),
  // System fields
  defineField({ name: 'publishedAt', type: 'datetime', readOnly: true }),
  defineField({ name: 'updatedAt', type: 'datetime', readOnly: true }),
]
```

### 4.2 lodgingBase.ts — §2.0b

```ts
// Hotel và Resort dùng chung qua spread
export const lodgingBaseFields = [
  defineField({ name: 'geo', type: 'geopoint', validation: Rule => Rule.required() }),
  defineField({ name: 'address', type: 'object', fields: [
    { name: 'street', type: 'string' },
    { name: 'ward', type: 'string', description: 'Phường hiện hành (I15)' },
    { name: 'city', type: 'string', initialValue: 'Nha Trang' },
  ]}),
  defineField({ name: 'officialSource', type: 'url', validation: Rule => Rule.required() }),
  defineField({ name: 'sameAs', type: 'array', of: [{ type: 'url' }] }),
  defineField({ name: 'starRating', type: 'number', validation: Rule => Rule.min(1).max(5) }),
  defineField({ name: 'amenityFeature', type: 'array', of: [{ type: 'string' }] }),
  defineField({ name: 'checkinTime', type: 'string' }),
  defineField({ name: 'checkoutTime', type: 'string' }),
  defineField({ name: 'numberOfRooms', type: 'number' }),
  defineField({ name: 'petsAllowed', type: 'boolean' }),
  defineField({ name: 'containedInPlace', type: 'reference', to: [{ type: 'place' }, { type: 'touristDestination' }] }),
  defineField({ name: 'bookingRef', type: 'object', fields: [
    { name: 'ref', type: 'reference', to: [] },  // placeholder — không trỏ entity Sanity
    { name: 'key', type: 'string', description: 'Khóa trong prices.yaml' }
  ]}),
  defineField({ name: 'beachAccess', type: 'text', rows: 2 }),
  defineField({ name: 'accessInfo', type: 'array', of: [{ type: 'block' }] }),
  defineField({ name: 'body', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
  defineField({ name: 'gallery', type: 'array', of: [{
    type: 'image',
    fields: [{ name: 'alt', type: 'string', validation: Rule => Rule.required() }]
  }]}),
  defineField({ name: 'highlights', type: 'array', of: [{ type: 'string' }] }),
  defineField({ name: 'faq', type: 'array', of: [{ type: 'object', fields: [
    { name: 'question', type: 'string' },
    { name: 'answer', type: 'text', rows: 3 }
  ]}]}),
  defineField({ name: 'imageProvenance', type: 'text', rows: 1 }),
]
```

### 4.3 Pattern gallery (dùng lại ở nhiều entity)

```ts
export const galleryField = defineField({
  name: 'gallery', type: 'array',
  of: [{
    type: 'image',
    fields: [
      { name: 'alt', type: 'string', validation: Rule => Rule.required() },
      { name: 'caption', type: 'string' }
    ]
  }]
})
```

### 4.4 Pattern faq (dùng lại)

```ts
export const faqField = defineField({
  name: 'faq', type: 'array',
  of: [{
    type: 'object',
    fields: [
      { name: 'question', type: 'string', validation: Rule => Rule.required() },
      { name: 'answer', type: 'text', rows: 4, validation: Rule => Rule.required() }
    ],
    preview: { select: { title: 'question' } }
  }]
})
```

---

## 5. Thứ tự thi công — 3 đợt

### Đợt 1: Nền móng (base + entity đơn giản nhất)

| # | File | Entity | Độ khó | Lý do làm trước |
|---|---|---|---|---|
| 1 | `baseFields.ts` | — | Thấp | Mọi entity kế thừa |
| 2 | `lodgingBase.ts` | — | Thấp | Hotel + Resort tái dùng |
| 3 | `category.ts` | Category §2.13 | Thấp | Ít field, không i18n field-level, chuẩn bị cho reference |
| 4 | `person.ts` | Person §2.12 | Thấp | Ít field, chỉ 1-3 doc |
| 5 | `touristDestination.ts` | TouristDestination §2.1 | Trung bình | 1 doc duy nhất, nhiều field tùy chọn |
| 6 | `place.ts` | Place §2.2 | Trung bình | Enum placeType, containedInPlace reference |

### Đợt 2: Entity có reference phức tạp

| # | File | Entity | Độ khó | Lý do |
|---|---|---|---|---|
| 7 | `attraction.ts` | Attraction §2.3 | Cao | 2 nhóm gate khác nhau, enum attractionType 9 giá trị |
| 8 | `restaurant.ts` | Restaurant §2.5 | Trung bình | servesSpecialty reference, address required |
| 9 | `specialty.ts` | Specialty §2.14 | Trung bình | whereToTry subset check (I17) |
| 10 | `hotel.ts` | Hotel §2.6 | Thấp | Kế thừa lodgingBase + 1 field |
| 11 | `resort.ts` | Resort §2.7 | Thấp | Kế thừa lodgingBase + 3 field |

### Đợt 3: Entity có cấu trúc lồng + document-level i18n

| # | File | Entity | Độ khó | Lý do |
|---|---|---|---|---|
| 12 | `experience.ts` | Experience §2.4 | Trung bình | experienceType ref, venue ref, pricing model |
| 13 | `organization.ts` | Organization §2.9 | Trung bình | orgType enum, I18 gate (cần có ref vào mới publish) |
| 14 | `event.ts` | Event §2.10 | Trung bình | eventType enum, 3 kênh vé, eventStatus |
| 15 | `tour.ts` | Tour §2.8 | Cao | itinerary (object array có stop), operator ref, tourFormat |
| 16 | `article.ts` | Article §2.11 | Cao | Document-level i18n, author ref, about array, howTo |

---

## 6. Ví dụ schema hoàn chỉnh — 3 entity mẫu

### 6.1 Category (đơn giản nhất)

```ts
// cms/schemas/category.ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Từ vựng (Category)',
  type: 'document',
  fields: [
    defineField({
      name: 'name', type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description', type: 'text', rows: 2,
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'inDefinedTermSet', type: 'string',
      options: {
        list: [
          { title: 'Phân mục chung', value: 'general-category' },
          { title: 'Loại trải nghiệm', value: 'experience-type' },
          { title: 'Loại tour', value: 'tour-type' },
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'termCode', type: 'slug',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug', type: 'slug',
      options: { source: 'name' },
      hidden: ({ document }) => document?.inDefinedTermSet === 'general-category'
    }),
    defineField({
      name: 'sameAs', type: 'url'
    }),
    defineField({ name: 'publishedAt', type: 'datetime', readOnly: true }),
    defineField({ name: 'updatedAt', type: 'datetime', readOnly: true }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'inDefinedTermSet' }
  }
})
```

### 6.2 Place (field-level i18n, enum)

```ts
// cms/schemas/place.ts
import { defineType, defineField } from 'sanity'
import { baseFields } from './baseFields'

export default defineType({
  name: 'place',
  title: 'Địa danh (Place)',
  type: 'document',
  // Kế thừa field chung §2.0
  fields: [
    ...baseFields,
    defineField({
      name: 'placeType', type: 'string',
      options: {
        list: [
          { title: 'Bãi biển', value: 'beach' },
          { title: 'Đảo', value: 'island' },
          { title: 'Địa hình', value: 'landform' },
          { title: 'Phường', value: 'ward' },
          { title: 'Khu vực', value: 'area' },
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'sameAs', type: 'array', of: [{ type: 'url' }],
      validation: Rule => Rule.required().min(1)  // I2 gate
    }),
    defineField({
      name: 'geo', type: 'geopoint',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'address', type: 'object',
      fields: [
        { name: 'street', type: 'string' },
        { name: 'ward', type: 'string', description: 'Phường hiện hành (I15)' },
      ]
    }),
    defineField({
      name: 'containedInPlace', type: 'reference',
      to: [{ type: 'place' }, { type: 'touristDestination' }],
      validation: Rule => Rule.required()  // I8
    }),
    defineField({ name: 'hasMap', type: 'url' }),
    defineField({ name: 'accessInfo', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'openingHours', type: 'object', fields: [
      { name: 'open', type: 'string' },
      { name: 'close', type: 'string' },
      { name: 'note', type: 'string' }
    ]}),
    defineField({ name: 'isAccessibleForFree', type: 'boolean' }),
    defineField({ name: 'body', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
    defineField({
      name: 'gallery', type: 'array',
      of: [{
        type: 'image',
        fields: [{ name: 'alt', type: 'string', validation: Rule => Rule.required() }]
      }]
    }),
    defineField({ name: 'highlights', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'faq', type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'question', type: 'string' },
          { name: 'answer', type: 'text', rows: 3 }
        ]
      }]
    }),
    defineField({ name: 'imageProvenance', type: 'text', rows: 1 }),
  ],
  // Custom validation: gate publish logic
  // (sẽ viết ở file riêng — 08-VALIDATORS.md)
  preview: {
    select: { title: 'title', subtitle: 'placeType', media: 'mainImage' }
  }
})
```

### 6.3 Article (document-level i18n)

```ts
// cms/schemas/article.ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'article',
  title: 'Cẩm nang (Article)',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: Rule => Rule.required() }),
    defineField({
      name: 'slug', type: 'slug',
      options: { source: 'title' },
      validation: Rule => Rule.required()
    }),
    // Document-level: language là field bắt buộc
    defineField({
      name: 'language', type: 'string',
      options: {
        list: [
          { title: 'Tiếng Việt', value: 'vi' },
          { title: 'English', value: 'en' },
          { title: '中文', value: 'zh' },
          { title: '한국어', value: 'ko' },
          { title: 'Русский', value: 'ru' },
        ]
      },
      validation: Rule => Rule.required(),
      initialValue: 'vi'
    }),
    defineField({
      name: 'translationGroup', type: 'reference',
      to: [{ type: 'article' }], weak: true
    }),
    defineField({ name: 'summary', type: 'text', rows: 3, validation: Rule => Rule.required() }),
    defineField({
      name: 'mainImage', type: 'image',
      fields: [{ name: 'alt', type: 'string' }],
      validation: Rule => Rule.required()  // I4 gate
    }),
    defineField({
      name: 'articleType', type: 'string',
      options: {
        list: [
          { title: 'Cẩm nang', value: 'guide' },
          { title: 'Danh sách', value: 'list' },
          { title: 'Tin tức', value: 'news' },
          { title: 'Đánh giá', value: 'review' },
          { title: 'Lịch trình', value: 'itinerary' },
          { title: 'Di chuyển', value: 'transport-guide' },
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'author', type: 'reference',
      to: [{ type: 'person' }],
      validation: Rule => Rule.required()  // I4 gate
    }),
    defineField({
      name: 'body', type: 'array',
      of: [{ type: 'block' }, { type: 'image' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'about', type: 'array',
      of: [{
        type: 'reference',
        to: [
          { type: 'place' }, { type: 'attraction' }, { type: 'experience' },
          { type: 'restaurant' }, { type: 'specialty' }, { type: 'hotel' },
          { type: 'resort' }, { type: 'tour' }, { type: 'event' },
          { type: 'organization' }
        ]
      }]
    }),
    defineField({ name: 'mentions', type: 'array', of: [{ type: 'reference', to: [] }] }),
    defineField({
      name: 'faq', type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'question', type: 'string' },
          { name: 'answer', type: 'text', rows: 3 }
        ]
      }]
    }),
    defineField({
      name: 'howTo', type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'step', type: 'string' },
          { name: 'text', type: 'text', rows: 3 }
        ]
      }]
    }),
    defineField({ name: 'seo', type: 'object',
      fields: [
        { name: 'metaTitle', type: 'string' },
        { name: 'metaDescription', type: 'text', rows: 2 }
      ]
    }),
    defineField({ name: 'imageProvenance', type: 'text', rows: 1 }),
    // Quản trị
    defineField({ name: 'reviewStatus', type: 'string',
      options: { list: ['draft','inReview','approved'].map(v=>({title:v,value:v})) },
      initialValue: 'draft'
    }),
    defineField({ name: 'approvedBy', type: 'string' }),
    defineField({ name: 'contentProvenance', type: 'string',
      options: { list: ['human','ai-t1','mixed'].map(v=>({title:v,value:v})) }
    }),
    defineField({ name: 'category', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }] }),
    defineField({ name: 'publishedAt', type: 'datetime', readOnly: true }),
    defineField({ name: 'updatedAt', type: 'datetime', readOnly: true }),
  ],
  // I7: slug unique per (language, _type)
  // Custom validation: nếu articleType === 'transport-guide' thì phải có howTo hoặc faq
  preview: {
    select: { title: 'title', subtitle: 'articleType', media: 'mainImage' }
  }
})
```

---

## 7. Những điểm cần chú ý khi viết schema

### 7.1 Reference validation (I8, I13, I17, I18)

Sanity không hỗ trợ custom validation trên reference integrity khi build. Cần viết script riêng:

```ts
// scripts/validate-refs.ts
// Chạy trước build, kiểm tra:
// - containedInPlace không trỏ vào chính nó (I8 chu trình)
// - Experience.venue không rỗng (I13)
// - Specialty.whereToTry là tập con của Restaurant.servesSpecialty (I17)
// - Organization có ít nhất 1 ref từ Tour/Event/Article (I18)
```

### 7.2 i18n slug uniqueness

Field-level i18n: Sanity plugin tạo slug cho từng ngôn ngữ. Cần custom validation đảm bảo slug duy nhất theo `(_type, slug)`, không cần language vì field-level chỉ có 1 doc.

Document-level (Article): slug unique theo `(language, _type)`. Viết custom async validation.

### 7.3 bookingRef — reference hoặc string

Đây là field đặc biệt: trỏ entity Sanity (nếu là sản phẩm nội bộ) hoặc là key string (khóa trong `prices.yaml`). Dùng object:

```ts
defineField({
  name: 'bookingRef', type: 'object',
  fields: [
    { name: 'ref', type: 'reference', to: [] },
    { name: 'key', type: 'string', description: 'Khóa trong prices.yaml' }
  ]
})
```

### 7.4 Enum đóng vs mở

Tất cả enum trong spec (placeType, attractionType, orgType, eventType, articleType, specialtyType, tourFormat, inDefinedTermSet) đều là **đóng** — dùng `options.list`, không dùng string tự do.

---

## 8. Việc làm ngay sau schema

| # | Việc | File |
|---|---|---|
| 1 | Viết script kiểm tra reference integrity | `scripts/validate-refs.ts` |
| 2 | Viết `prices.yaml` mẫu + cấu trúc | `data/prices.yaml` |
| 3 | Cấu hình Sanity Studio desk structure | `cms/deskStructure.ts` |
| 4 | Viết GROQ query mẫu cho từng entity | `cms/queries/` |
| 5 | Cấu hình CI validator (04-CONSTRAINTS) | `.github/workflows/validate.yml` |

---

## Phụ lục: Checklist 16 schema

- [ ] `baseFields.ts` — field chung §2.0
- [ ] `lodgingBase.ts` — field group §2.0b
- [ ] `category.ts` — §2.13 (đơn giản nhất)
- [ ] `person.ts` — §2.12
- [ ] `touristDestination.ts` — §2.1
- [ ] `place.ts` — §2.2
- [ ] `attraction.ts` — §2.3 (2 nhóm gate)
- [ ] `restaurant.ts` — §2.5
- [ ] `specialty.ts` — §2.14
- [ ] `hotel.ts` — §2.6 (kế thừa lodgingBase)
- [ ] `resort.ts` — §2.7 (kế thừa lodgingBase)
- [ ] `experience.ts` — §2.4
- [ ] `organization.ts` — §2.9
- [ ] `event.ts` — §2.10
- [ ] `tour.ts` — §2.8 (itinerary object array)
- [ ] `article.ts` — §2.11 (document-level i18n)
- [ ] `index.ts` — export tất cả
- [ ] `sanity.config.ts` — cấu hình workspace + i18n plugin
