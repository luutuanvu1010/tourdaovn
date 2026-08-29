import { defineType, defineField } from 'sanity'
import { EarthGlobeIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups } from './baseFields'
import { BulkGalleryInput } from '../components/BulkGalleryInput'
import { brand } from '../../src/site.config'

const LANGUAGES = ['vi', 'en', 'zh', 'ko', 'ru'] as const
const HOMEPAGE_BANNER_LINK_PREFIXES = ['/', 'https://', 'http://', 'tel:', 'mailto:']

// requiredVi giữ lại làm tham số để bật lại khi cần; mặc định tắt —
// mọi field của entity là tuỳ chọn, trừ title.vi và slug.vi (xem baseFields.ts).
function localizedStringFields(requiredVi = false) {
  return LANGUAGES.map(lang => defineField({
    name: lang,
    type: 'string',
    ...(requiredVi && lang === 'vi'
      ? { validation: (Rule: any) => Rule.required() }
      : {})
  }))
}

function localizedTextFields() {
  return LANGUAGES.map(lang => defineField({
    name: lang,
    type: 'text',
    rows: 2
  }))
}

export default defineType({
  name: 'touristDestination',
  title: 'Điểm đến (TouristDestination)',
  type: 'document',
  icon: EarthGlobeIcon,
  groups: baseGroups,
  fields: [
    ...baseFieldsBeforeGallery,
    defineField({
      name: 'gallery', type: 'array',
      group: 'coBan',
      options: { layout: 'grid' },
      components: { input: BulkGalleryInput },
      validation: Rule => Rule.max(30),
      of: [{
        type: 'image',
        options: { hotspot: true },
        fields: [
          defineField({
            name: 'alt', type: 'string',
            initialValue: (_value: unknown, context: Record<string, unknown>) =>
              ((context.document as Record<string,unknown>)?.title?.vi || (context.document as Record<string,unknown>)?.title || '')  + ' — Ảnh ' + brand.name
          })
        ]
      }]
    }),
    ...baseFieldsAfterGallery,
    defineField({
      name: 'sameAs', type: 'array',
      group: 'viTri',
      of: [{ type: 'url' }],
    }),
    defineField({
      name: 'geo', type: 'geopoint',
      group: 'viTri'
    }),
    defineField({
      name: 'containedInPlaceRef', type: 'array',
      group: 'viTri',
      of: [{ type: 'url' }],
      title: 'Nằm trong tỉnh/thành (URL Wikidata)',
      description:
        'Trỏ tỉnh/thành chứa điểm đến này qua Wikidata URL. ' +
        'Nếu đã tạo Place cấp Tỉnh tương ứng thì ô này chỉ còn để xuất JSON-LD; ' +
        'chuỗi điều hướng đi theo Place.containedInPlace.'
    }),
    defineField({
      name: 'body', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({ name: 'vi', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
        defineField({ name: 'en', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
        defineField({ name: 'zh', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
        defineField({ name: 'ko', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
        defineField({ name: 'ru', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
      ]
    }),
    defineField({
      name: 'keyFacts', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({
          name: 'vi', type: 'array', of: [{
            type: 'object',
            fields: [
              defineField({ name: 'label', type: 'string' }),
              defineField({ name: 'value', type: 'string' })
            ]
          }]
        }),
        defineField({
          name: 'en', type: 'array', of: [{
            type: 'object',
            fields: [
              defineField({ name: 'label', type: 'string' }),
              defineField({ name: 'value', type: 'string' })
            ]
          }]
        }),
        defineField({
          name: 'zh', type: 'array', of: [{
            type: 'object',
            fields: [
              defineField({ name: 'label', type: 'string' }),
              defineField({ name: 'value', type: 'string' })
            ]
          }]
        }),
        defineField({
          name: 'ko', type: 'array', of: [{
            type: 'object',
            fields: [
              defineField({ name: 'label', type: 'string' }),
              defineField({ name: 'value', type: 'string' })
            ]
          }]
        }),
        defineField({
          name: 'ru', type: 'array', of: [{
            type: 'object',
            fields: [
              defineField({ name: 'label', type: 'string' }),
              defineField({ name: 'value', type: 'string' })
            ]
          }]
        }),
      ]
    }),
    defineField({
      name: 'homepageBanners',
      title: 'Banner trang chủ',
      type: 'array',
      group: 'noiDung',
      description: 'Tối đa 3 banner active sẽ hiện trên trang chủ, xếp theo priority.',
      of: [{
        type: 'object',
        fields: [
          defineField({
            name: 'title',
            title: 'Tiêu đề',
            type: 'object',
            fields: localizedStringFields()
          }),
          defineField({
            name: 'description',
            title: 'Mô tả',
            type: 'object',
            fields: localizedTextFields()
          }),
          defineField({
            name: 'linkLabel',
            title: 'Nhãn link',
            type: 'object',
            fields: localizedStringFields()
          }),
          defineField({
            name: 'linkUrl',
            title: 'Liên kết',
            type: 'string',
            description: 'Cho phép /, https://, http://, tel:, mailto:',
            validation: Rule => Rule.custom((value: unknown) => {
              if (!value) return true
              if (typeof value !== 'string') return 'Link không hợp lệ'
              return HOMEPAGE_BANNER_LINK_PREFIXES.some(prefix => value.startsWith(prefix))
                ? true
                : 'Link phải bắt đầu bằng /, https://, http://, tel: hoặc mailto:'
            })
          }),
          defineField({
            name: 'image',
            title: 'Ảnh',
            type: 'image',
            options: { hotspot: true },
            fields: [
              defineField({
                name: 'alt',
                type: 'string',
              })
            ]
          }),
          defineField({
            name: 'variant',
            title: 'Biến thể',
            type: 'string',
            options: {
              list: [
                { title: 'Cẩm nang Vinpearl', value: 'vinpearl' },
                { title: 'Tour đảo', value: 'island-tour' },
                { title: 'Lần đầu đi', value: 'first-time' },
                { title: 'Cẩm nang', value: 'guide' },
                { title: 'Tùy chỉnh', value: 'custom' }
              ]
            },
            initialValue: 'custom',
          }),
          defineField({
            name: 'theme',
            title: 'Tông màu',
            type: 'string',
            options: {
              list: [
                { title: 'Ocean', value: 'ocean' },
                { title: 'Sand', value: 'sand' },
                { title: 'Pearl', value: 'pearl' },
                { title: 'Image', value: 'image' }
              ]
            },
            initialValue: 'ocean',
          }),
          defineField({
            name: 'isActive',
            title: 'Đang hiện',
            type: 'boolean',
            initialValue: true,
          }),
          defineField({
            name: 'priority',
            title: 'Thứ tự',
            type: 'number',
            initialValue: 10,
            validation: Rule => Rule.integer().min(0)
          })
        ],
        preview: {
          select: { title: 'title.vi', variant: 'variant', isActive: 'isActive', media: 'image' },
          prepare({ title, variant, isActive, media }) {
            return {
              title: title || 'Banner trang chủ',
              subtitle: `${variant || 'custom'} · ${isActive ? 'Đang hiện' : 'Ẩn'}`,
              media
            }
          }
        }
      }]
    }),
    defineField({
      name: 'highlights', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({ name: 'vi', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'en', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'zh', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'ko', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'ru', type: 'array', of: [{ type: 'string' }] }),
      ]
    }),
    defineField({
      name: 'faq', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({ name: 'vi', type: 'array', of: [{ type: 'faqItem' }] }),
        defineField({ name: 'en', type: 'array', of: [{ type: 'faqItem' }] }),
        defineField({ name: 'zh', type: 'array', of: [{ type: 'faqItem' }] }),
        defineField({ name: 'ko', type: 'array', of: [{ type: 'faqItem' }] }),
        defineField({ name: 'ru', type: 'array', of: [{ type: 'faqItem' }] }),
      ]
    }),
    defineField({
      name: 'featuredAttractions', type: 'array',
      group: 'viTri',
      of: [{ type: 'reference', to: [{ type: 'attraction' }] }]
    }),
    defineField({
      name: 'featuredStays', type: 'array',
      group: 'viTri',
      of: [{ type: 'reference', to: [{ type: 'hotel' }, { type: 'resort' }] }]
    }),
    defineField({
      name: 'featuredExperiences', type: 'array',
      group: 'viTri',
      of: [{ type: 'reference', to: [{ type: 'experience' }] }]
    }),
    defineField({
      name: 'featuredSpecialties', type: 'array',
      group: 'viTri',
      of: [{ type: 'reference', to: [{ type: 'specialty' }] }]
    }),
    defineField({
      name: 'featuredTours', type: 'array',
      group: 'viTri',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }]
    }),
    defineField({
      name: 'relatedDestinations', type: 'array',
      group: 'viTri',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'name', type: 'string' }),
          defineField({ name: 'url', type: 'url' })
        ]
      }]
    }),
    defineField({
      name: 'safetyNote', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({ name: 'vi', type: 'text', rows: 2 }),
        defineField({ name: 'en', type: 'text', rows: 2 }),
        defineField({ name: 'zh', type: 'text', rows: 2 }),
        defineField({ name: 'ko', type: 'text', rows: 2 }),
        defineField({ name: 'ru', type: 'text', rows: 2 }),
      ]
    })
  ],
  preview: {
    select: { title: 'title.vi', status: 'reviewStatus', media: 'mainImage' },
    prepare({ title, status, media }) {
      const label: Record<string, string> = { draft: 'Nháp', inReview: 'Đang duyệt', approved: 'Đã duyệt' }
      return { title, subtitle: label[status] ?? status ?? '—', media }
    }
  }
})
