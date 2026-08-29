import { defineType, defineField } from 'sanity'
import { RocketIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups, destinationField } from './baseFields'
import { BulkGalleryInput } from '../components/BulkGalleryInput'
import { brand } from '../../src/site.config'

export default defineType({
  name: 'experience',
  title: 'Trải nghiệm (Experience)',
  type: 'document',
  icon: RocketIcon,
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
      name: 'experienceType', type: 'reference',
      group: 'coBan',
      to: [{ type: 'category' }],
      description: 'Trỏ bộ experience-type trong Category'
    }),
    defineField({
      name: 'venue', type: 'reference',
      group: 'viTri',
      to: [{ type: 'attraction' }, { type: 'hotel' }, { type: 'resort' }, { type: 'place' }],
      title: 'Diễn ra tại (venue)',
      description:
        'Nơi cụ thể diễn ra hoạt động — mắt xích cuối của chuỗi. ' +
        'Vd "Lặn biển" chọn venue là Place "Hòn Mun"; cấp trên (Phường Nha Trang, Tỉnh Khánh Hoà) suy ra tự động, không chọn ở đây.'
    }),
    defineField({ name: 'isAccessibleForFree', type: 'boolean', group: 'seo' }),
    defineField({ name: 'duration', type: 'string', group: 'seo', description: 'ISO 8601, vd PT2H' }),
    defineField({
      name: 'includes', type: 'object',
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
      name: 'touristType', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({ name: 'vi', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'en', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'zh', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'ko', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'ru', type: 'array', of: [{ type: 'string' }] }),
      ]
    }),
    defineField({ name: 'geo', type: 'geopoint', group: 'viTri' }),
    defineField({
      name: 'bookingRef', type: 'object',
      group: 'viTri',
      fields: [
        defineField({ name: 'key', type: 'string' })
      ],
      description: 'Trỏ tới dòng trong prices.yaml, không lưu con số giá (I1)'
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
