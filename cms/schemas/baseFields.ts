import { defineField } from 'sanity'
import { ApprovedByInput } from '../components/ApprovedByInput'
import { SeoAutoInput } from '../components/SeoAutoInput'
import { slugifyTitle } from '../../scripts/lib/slug'

// Nút Generate của Studio phải sinh slug cùng quy tắc với module dịch
// (CONTENT_MODEL v1.0.10: slug từ title bản ngữ, chữ bản địa, NFC) — không dùng
// slugify mặc định của Sanity để tránh nguồn sinh slug thứ hai lệch spec.
const slugOptions = (lang: string) => ({
  source: `title.${lang}`,
  slugify: (input: string) => slugifyTitle(input),
})

export const baseGroups = [
  { name: 'coBan', title: 'Cơ bản', default: true },
  { name: 'noiDung', title: 'Nội dung' },
  { name: 'viTri', title: 'Vị trí & liên kết' },
  { name: 'seo', title: 'SEO & kỹ thuật' },
  { name: 'quanTri', title: 'Quản trị' }
]

export const baseFieldsBeforeGallery = [
  defineField({
    name: 'title',
    type: 'object',
    group: 'coBan',
    validation: Rule => Rule.required(),
    fields: [
      defineField({ name: 'vi', type: 'string', validation: Rule => Rule.required() }),
      defineField({ name: 'en', type: 'string' }),
      defineField({ name: 'zh', type: 'string' }),
      defineField({ name: 'ko', type: 'string' }),
      defineField({ name: 'ru', type: 'string' })
    ]
  }),
  defineField({
    name: 'slug',
    type: 'object',
    group: 'seo',
    validation: Rule => Rule.required(),
    fields: [
      defineField({
        name: 'vi', type: 'slug',
        options: slugOptions('vi'),
        validation: Rule => Rule.required()
      }),
      defineField({
        name: 'en', type: 'slug',
        options: slugOptions('en')
      }),
      defineField({
        name: 'zh', type: 'slug',
        options: slugOptions('zh')
      }),
      defineField({
        name: 'ko', type: 'slug',
        options: slugOptions('ko')
      }),
      defineField({
        name: 'ru', type: 'slug',
        options: slugOptions('ru')
      })
    ]
  }),
  defineField({
    name: 'summary',
    type: 'object',
    group: 'coBan',
    validation: Rule => Rule.required(),
    fields: [
      defineField({ name: 'vi', type: 'text', rows: 3 }),
      defineField({ name: 'en', type: 'text', rows: 3 }),
      defineField({ name: 'zh', type: 'text', rows: 3 }),
      defineField({ name: 'ko', type: 'text', rows: 3 }),
      defineField({ name: 'ru', type: 'text', rows: 3 })
    ]
  }),
  defineField({
    name: 'mainImage', type: 'image',
    group: 'coBan',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt', type: 'string',
        validation: Rule => Rule.required(),
        initialValue: (_value: unknown, context: Record<string, unknown>) =>
          (context.document as Record<string,unknown>)?.title?.vi || '',
        description: 'Alt tự điền từ tiêu đề — sửa lại cho đúng nội dung ảnh'
      })
    ]
  }),
]

export const baseFieldsAfterGallery = [
  defineField({
    name: 'imageProvenance', type: 'text', rows: 1,
    hidden: true,
    description: 'Nguồn ảnh nội bộ để quản trị bản quyền; không hiển thị mặc định trên trang.'
  }),
  defineField({
    name: 'seo', type: 'object',
    group: 'seo',
    components: { input: SeoAutoInput },
    fields: [
      defineField({
        name: 'metaTitle',
        type: 'object',
        fields: [
          defineField({ name: 'vi', type: 'string' }),
          defineField({ name: 'en', type: 'string' }),
          defineField({ name: 'zh', type: 'string' }),
          defineField({ name: 'ko', type: 'string' }),
          defineField({ name: 'ru', type: 'string' })
        ]
      }),
      defineField({
        name: 'metaDescription',
        type: 'object',
        fields: [
          defineField({ name: 'vi', type: 'text', rows: 2 }),
          defineField({ name: 'en', type: 'text', rows: 2 }),
          defineField({ name: 'zh', type: 'text', rows: 2 }),
          defineField({ name: 'ko', type: 'text', rows: 2 }),
          defineField({ name: 'ru', type: 'text', rows: 2 })
        ]
      })
    ]
  }),
  defineField({
    name: 'category', type: 'array',
    group: 'viTri',
    of: [{ type: 'reference', to: [{ type: 'category' }] }]
  }),
  defineField({
    name: 'reviewStatus', type: 'string',
    group: 'quanTri',
    options: {
      list: [
        { title: 'Nháp', value: 'draft' },
        { title: 'Đang duyệt', value: 'inReview' },
        { title: 'Đã duyệt', value: 'approved' }
      ]
    },
    initialValue: 'draft'
  }),
  defineField({
    name: 'approvedBy', type: 'string',
    group: 'quanTri',
    components: { input: ApprovedByInput }
  }),
  defineField({
    name: 'contentProvenance', type: 'string',
    group: 'quanTri',
    options: {
      list: [
        { title: 'Người viết', value: 'human' },
        { title: 'AI sinh, người duyệt', value: 'ai-t1' },
        { title: 'Trộn', value: 'mixed' }
      ]
    }
  }),
  defineField({ name: 'publishedAt', type: 'datetime', group: 'quanTri', readOnly: true }),
  defineField({ name: 'updatedAt', type: 'datetime', group: 'quanTri', readOnly: true })
]

export const baseFields = [
  ...baseFieldsBeforeGallery,
  ...baseFieldsAfterGallery
]
