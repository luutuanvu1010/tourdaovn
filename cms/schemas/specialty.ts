import { defineType, defineField } from 'sanity'
import { StarIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups, destinationField } from './baseFields'
import { BulkGalleryInput } from '../components/BulkGalleryInput'
import { brand } from '../../src/site.config'

export default defineType({
  name: 'specialty',
  title: 'Đặc sản (Specialty)',
  type: 'document',
  icon: StarIcon,
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
      name: 'specialtyType', type: 'string',
      group: 'coBan',
      options: {
        list: [
          { title: 'Món ăn', value: 'dish' },
          { title: 'Sản vật', value: 'product' }
        ]
      },
    }),
    defineField({
      name: 'sameAs', type: 'array',
      group: 'viTri',
      of: [{ type: 'url' }],
    }),
    defineField({
      name: 'originNote', type: 'object',
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
      name: 'season', type: 'object',
      group: 'seo',
      fields: [
        defineField({ name: 'vi', type: 'text', rows: 1 }),
        defineField({ name: 'en', type: 'text', rows: 1 }),
        defineField({ name: 'zh', type: 'text', rows: 1 }),
        defineField({ name: 'ko', type: 'text', rows: 1 }),
        defineField({ name: 'ru', type: 'text', rows: 1 }),
      ]
    }),
    defineField({
      name: 'whereToTry', type: 'array',
      group: 'viTri',
      of: [{ type: 'reference', to: [{ type: 'restaurant' }] }],
      description: 'Tuyển chọn biên tập — phải là tập con của chiều servesSpecialty suy ngược (I17)'
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
