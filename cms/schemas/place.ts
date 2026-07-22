import { defineType, defineField } from 'sanity'
import { PinIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups } from './baseFields'
import { BulkGalleryInput } from '../components/BulkGalleryInput'
import { IncomingExperiences } from '../components/IncomingExperiences'

export default defineType({
  name: 'place',
  title: 'Địa danh (Place)',
  type: 'document',
  icon: PinIcon,
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
              ((context.document as Record<string,unknown>)?.title?.vi || (context.document as Record<string,unknown>)?.title || '')  + ' — Ảnh Nha Trang Travel'
          })
        ]
      }]
    }),
    ...baseFieldsAfterGallery,
    defineField({
      name: 'placeType', type: 'string',
      group: 'coBan',
      options: {
        list: [
          { title: 'Bãi biển', value: 'beach' },
          { title: 'Đảo', value: 'island' },
          { title: 'Địa hình', value: 'landform' },
          { title: 'Phường', value: 'ward' },
          { title: 'Khu vực', value: 'area' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'sameAs', type: 'array',
      group: 'viTri',
      of: [{ type: 'url' }],
      validation: Rule => Rule.required().min(1)
    }),
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
      name: 'containedInPlace', type: 'reference',
      group: 'viTri',
      to: [{ type: 'place' }, { type: 'touristDestination' }],
      validation: Rule => Rule.required()
    }),
    defineField({ name: 'hasMap', type: 'url', group: 'seo' }),
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
    defineField({
      name: 'incomingExperiences', type: 'string',
      group: 'viTri',
      readOnly: true,
      components: { input: IncomingExperiences },
      description: 'Trải nghiệm diễn ra tại địa danh này (tham chiếu từ Experience.venue)'
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
