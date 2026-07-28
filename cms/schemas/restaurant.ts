import { defineType, defineField } from 'sanity'
import { BasketIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups } from './baseFields'
import { BulkGalleryInput } from '../components/BulkGalleryInput'
import { brand } from '../../src/site.config'

export default defineType({
  name: 'restaurant',
  title: 'Nhà hàng (Restaurant)',
  type: 'document',
  icon: BasketIcon,
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
      name: 'geo', type: 'geopoint',
      group: 'viTri'
    }),
    defineField({
      name: 'address', type: 'object',
      group: 'viTri',
      fields: [
        defineField({ name: 'street', type: 'string' }),
        defineField({
          name: 'ward', type: 'string',
          description: 'Phường hiện hành (I15)'
        })
      ]
    }),
    defineField({
      name: 'officialSource', type: 'url',
      group: 'viTri',
      validation: Rule => Rule.required().uri()
    }),
    defineField({
      name: 'sameAs', type: 'array',
      group: 'viTri',
      of: [{ type: 'url' }]
    }),
    defineField({
      name: 'servesCuisine', type: 'object',
      group: 'seo',
      fields: [
        defineField({ name: 'vi', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'en', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'zh', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'ko', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'ru', type: 'array', of: [{ type: 'string' }] }),
      ]
    }),
    defineField({
      name: 'servesSpecialty', type: 'array',
      group: 'viTri',
      of: [{ type: 'reference', to: [{ type: 'specialty' }] }]
    }),
    defineField({
      name: 'containedInPlace', type: 'reference',
      group: 'viTri',
      to: [{ type: 'place' }, { type: 'touristDestination' }],
      validation: Rule => Rule.required()
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
    defineField({
      name: 'acceptsReservations', type: 'boolean',
      group: 'seo'
    }),
    defineField({ name: 'hasMenu', type: 'url', group: 'seo' }),
    defineField({ name: 'telephone', type: 'string', group: 'seo' }),
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
