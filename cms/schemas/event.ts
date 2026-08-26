import { defineType, defineField } from 'sanity'
import { CalendarIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups, destinationField } from './baseFields'
import { BulkGalleryInput } from '../components/BulkGalleryInput'
import { brand } from '../../src/site.config'

export default defineType({
  name: 'event',
  title: 'Sự kiện (Event)',
  type: 'document',
  icon: CalendarIcon,
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
      name: 'eventType', type: 'string',
      group: 'coBan',
      options: {
        list: [
          { title: 'Lễ hội', value: 'festival' },
          { title: 'Thể thao', value: 'sports' },
          { title: 'Âm nhạc', value: 'music' },
          { title: 'Ẩm thực', value: 'food' },
          { title: 'Triển lãm', value: 'exhibition' },
          { title: 'Khác', value: 'other' }
        ]
      },
    }),
    defineField({
      name: 'startDate', type: 'datetime',
      group: 'seo',
    }),
    defineField({ name: 'endDate', type: 'datetime', group: 'seo' }),
    defineField({
      name: 'location', type: 'reference',
      group: 'viTri',
      to: [{ type: 'place' }, { type: 'attraction' }],
    }),
    defineField({
      name: 'organizer', type: 'reference',
      group: 'viTri',
      to: [{ type: 'organization' }]
    }),
    defineField({
      name: 'eventStatus', type: 'string',
      group: 'seo',
      options: {
        list: [
          { title: 'Đã lên lịch', value: 'EventScheduled' },
          { title: 'Đã hoãn', value: 'EventPostponed' },
          { title: 'Đã dời lịch', value: 'EventRescheduled' },
          { title: 'Đã hủy', value: 'EventCancelled' }
        ]
      }
    }),
    defineField({ name: 'isAccessibleForFree', type: 'boolean', group: 'seo' }),
    defineField({
      name: 'bookingRef', type: 'object',
      group: 'viTri',
      fields: [
        defineField({ name: 'key', type: 'string' })
      ],
      description: 'Vé chính mình bán với tư cách đại lý (I1)'
    }),
    defineField({
      name: 'ticketUrl', type: 'url',
      group: 'seo',
      description: 'Link kênh vé chính thức bên ngoài, không hoa hồng'
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
