import { defineType, defineField } from 'sanity'
import { TransferIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups } from './baseFields'
import { BulkGalleryInput } from '../components/BulkGalleryInput'
import { brand } from '../../src/site.config'

export default defineType({
  name: 'tour',
  title: 'Tour (Tour)',
  type: 'document',
  icon: TransferIcon,
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
            validation: Rule => Rule.required(),
            initialValue: (_value: unknown, context: Record<string, unknown>) =>
              ((context.document as Record<string,unknown>)?.title?.vi || (context.document as Record<string,unknown>)?.title || '')  + ' — Ảnh ' + brand.name
          })
        ]
      }]
    }),
    ...baseFieldsAfterGallery,
    defineField({
      name: 'itinerary', type: 'array',
      group: 'viTri',
      of: [{
        type: 'object',
        fields: [
          defineField({
            name: 'place', type: 'reference',
            to: [{ type: 'attraction' }, { type: 'place' }],
            description: 'Điểm trong vùng; bỏ trống nếu là điểm ngoài vùng'
          }),
          defineField({
            name: 'externalStop', type: 'object',
            fields: [
              defineField({ name: 'name', type: 'string' }),
              defineField({ name: 'geo', type: 'geopoint' }),
              defineField({ name: 'sameAs', type: 'url' })
            ]
          }),
          defineField({ name: 'note', type: 'text', rows: 2 }),
          defineField({ name: 'durationAtStop', type: 'string', description: 'ISO 8601, vd PT1H30M' })
        ]
      }],
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: 'operator', type: 'reference',
      group: 'viTri',
      to: [{ type: 'organization' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'tourFormat', type: 'string',
      group: 'seo',
      options: {
        list: [
          { title: 'Ghép đoàn', value: 'join-in' },
          { title: 'Tour riêng', value: 'private' },
          { title: 'Cả hai', value: 'both' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'tripOrigin', type: 'reference',
      group: 'viTri',
      to: [{ type: 'place' }, { type: 'attraction' }]
    }),
    defineField({
      name: 'departureNote', type: 'object',
      group: 'seo',
      fields: [
        defineField({ name: 'vi', type: 'text', rows: 2 }),
        defineField({ name: 'en', type: 'text', rows: 2 }),
        defineField({ name: 'zh', type: 'text', rows: 2 }),
        defineField({ name: 'ko', type: 'text', rows: 2 }),
        defineField({ name: 'ru', type: 'text', rows: 2 }),
      ]
    }),
    defineField({ name: 'duration', type: 'string', group: 'seo', description: 'ISO 8601, vd PT8H, P2D' }),
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
      name: 'excludes', type: 'object',
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
    defineField({
      name: 'seasonNote', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({ name: 'vi', type: 'text', rows: 2 }),
        defineField({ name: 'en', type: 'text', rows: 2 }),
        defineField({ name: 'zh', type: 'text', rows: 2 }),
        defineField({ name: 'ko', type: 'text', rows: 2 }),
        defineField({ name: 'ru', type: 'text', rows: 2 }),
      ]
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
    }),
  ],
  preview: {
    select: { title: 'title.vi', status: 'reviewStatus', media: 'mainImage' },
    prepare({ title, status, media }) {
      const label: Record<string, string> = { draft: 'Nháp', inReview: 'Đang duyệt', approved: 'Đã duyệt' }
      return { title, subtitle: label[status] ?? status ?? '—', media }
    }
  }
})
