import { defineType, defineField } from 'sanity'
import { TagIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups, destinationField } from './baseFields'
import { BulkGalleryInput } from '../components/BulkGalleryInput'
import { brand } from '../../src/site.config'

/**
 * Ba nhóm gate I2 (01-CONTENT_MODEL §2.3 v1.0.19, QĐ-2026-08-27-03).
 * Hợp ba tập PHẢI phủ đúng enum attractionType: giá trị rơi ra ngoài cả ba
 * không phải "được cho phép" mà là "không được kiểm" — đúng lỗi đã xảy ra với
 * aquarium trước v1.0.19. Bản sao cơ học ở shared/gates/index.ts (validator CI).
 */
const ENCYCLOPEDIC_TYPES = ['historic', 'temple', 'church', 'museum']
const VENUE_TYPES = ['theme-park', 'aquarium', 'mud-spa', 'market', 'park']
const EITHER_SOURCE_TYPES = ['beach', 'island', 'nature', 'craft-village', 'general']

export default defineType({
  name: 'attraction',
  title: 'Điểm tham quan (Attraction)',
  type: 'document',
  icon: TagIcon,
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
    destinationField,
    defineField({
      name: 'attractionType', type: 'string',
      group: 'coBan',
      options: {
        list: [
          { title: 'Di tích lịch sử', value: 'historic' },
          { title: 'Chùa', value: 'temple' },
          { title: 'Nhà thờ', value: 'church' },
          { title: 'Bảo tàng', value: 'museum' },
          { title: 'Bãi biển', value: 'beach' },
          { title: 'Đảo', value: 'island' },
          { title: 'Thiên nhiên, sinh thái', value: 'nature' },
          { title: 'Công viên giải trí', value: 'theme-park' },
          { title: 'Thủy cung', value: 'aquarium' },
          { title: 'Tắm bùn, suối khoáng', value: 'mud-spa' },
          { title: 'Chợ', value: 'market' },
          { title: 'Công viên', value: 'park' },
          { title: 'Làng chài, làng nghề', value: 'craft-village' },
          { title: 'Điểm thu hút khách', value: 'general' }
        ]
      },
    }),
    defineField({
      name: 'sameAs', type: 'array',
      group: 'viTri',
      of: [{ type: 'url' }],
      description:
        'Bắt buộc với nhóm bách khoa (historic, temple, church, museum) — gate I2. ' +
        'Với beach, island, nature, craft-village, general: cần ít nhất một trong sameAs hoặc officialSource.',
      validation: Rule => Rule.custom((value, context) => {
        const doc = (context.document ?? {}) as Record<string, unknown>
        const atype = doc.attractionType as string
        const hasValue = Array.isArray(value) && value.length > 0
        if (ENCYCLOPEDIC_TYPES.includes(atype) && !hasValue) {
          return 'sameAs (Wikidata/Wikipedia) bắt buộc với nhóm bách khoa — gate I2'
        }
        if (EITHER_SOURCE_TYPES.includes(atype) && !hasValue && !doc.officialSource) {
          return 'Cần ít nhất một trong sameAs hoặc officialSource — gate I2'
        }
        return true
      })
    }),
    defineField({
      name: 'officialSource', type: 'url',
      group: 'viTri',
      description:
        'Bắt buộc với nhóm venue (theme-park, aquarium, mud-spa, market, park) — gate I2. ' +
        'Với beach, island, nature, craft-village, general: cần ít nhất một trong sameAs hoặc officialSource.',
      validation: Rule => Rule.custom((value, context) => {
        const doc = (context.document ?? {}) as Record<string, unknown>
        const atype = doc.attractionType as string
        if (VENUE_TYPES.includes(atype) && !value) {
          return 'officialSource bắt buộc với nhóm venue thương mại — gate I2'
        }
        const hasSameAs = Array.isArray(doc.sameAs) && (doc.sameAs as unknown[]).length > 0
        if (EITHER_SOURCE_TYPES.includes(atype) && !value && !hasSameAs) {
          return 'Cần ít nhất một trong sameAs hoặc officialSource — gate I2'
        }
        return true
      })
    }),
    defineField({
      name: 'geo', type: 'geopoint',
      group: 'viTri'
    }),
    defineField({
      name: 'address', type: 'object',
      group: 'viTri',
      description: 'Không bắt buộc; điền khi có nguồn địa chỉ chắc chắn.',
      fields: [
        defineField({ name: 'street', type: 'string' }),
        defineField({
          name: 'ward', type: 'string',
          description: 'Phường hiện hành (I15)'
        })
      ]
    }),
    defineField({
      name: 'containedInPlace', type: 'reference',
      group: 'viTri',
      to: [{ type: 'place' }, { type: 'touristDestination' }],
      title: 'Nằm trong (đơn vị chứa trực tiếp)',
      description:
        'Chọn Place cụ thể nhất chứa nó (vd một Phường hoặc một Đảo), không nhảy thẳng lên cấp Tỉnh. ' +
        'Trỏ TouristDestination khi vùng chứa là thương hiệu du lịch chứ không phải đơn vị hành chính.'
    }),
    defineField({
      name: 'bookingRef', type: 'object',
      group: 'viTri',
      fields: [
        defineField({ name: 'key', type: 'string' })
      ],
      description: 'Trỏ tới dòng trong prices.yaml, không lưu con số giá (I1)'
    }),
    defineField({
      name: 'openingHours', type: 'object',
      group: 'seo',
      fields: [
        defineField({ name: 'open', type: 'string' }),
        defineField({ name: 'close', type: 'string' }),
        defineField({ name: 'note', type: 'string' })
      ]
    }),
    defineField({ name: 'isAccessibleForFree', type: 'boolean', group: 'seo' }),
    defineField({
      name: 'accessInfo', type: 'object',
      group: 'seo',
      fields: [
        defineField({ name: 'vi', type: 'array', of: [{ type: 'block' }] }),
        defineField({ name: 'en', type: 'array', of: [{ type: 'block' }] }),
        defineField({ name: 'zh', type: 'array', of: [{ type: 'block' }] }),
        defineField({ name: 'ko', type: 'array', of: [{ type: 'block' }] }),
        defineField({ name: 'ru', type: 'array', of: [{ type: 'block' }] }),
      ]
    }),
    defineField({ name: 'hasMap', type: 'url', group: 'seo' }),
    defineField({ name: 'telephone', type: 'string', group: 'viTri' }),
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
