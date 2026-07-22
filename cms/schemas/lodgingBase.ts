import { defineField } from 'sanity'
import { BulkGalleryInput } from '../components/BulkGalleryInput'

export const lodgingGalleryField = defineField({
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
        validation: Rule => Rule.required()
      })
    ]
  }]
})

export const lodgingBaseFields = [
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
    name: 'starRating', type: 'number',
    group: 'noiDung',
    validation: Rule => Rule.min(1).max(5)
  }),
  defineField({
      name: 'amenityFeature', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({ name: 'vi', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'en', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'zh', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'ko', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'ru', type: 'array', of: [{ type: 'string' }] }),
      ]
    }),
  defineField({ name: 'checkinTime', type: 'string', group: 'noiDung' }),
  defineField({ name: 'checkoutTime', type: 'string', group: 'noiDung' }),
  defineField({ name: 'numberOfRooms', type: 'number', group: 'noiDung' }),
  defineField({ name: 'petsAllowed', type: 'boolean', group: 'noiDung' }),
  defineField({
    name: 'containedInPlace', type: 'reference',
    group: 'viTri',
    to: [{ type: 'place' }, { type: 'touristDestination' }],
    validation: Rule => Rule.required()
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
      name: 'beachAccess', type: 'object',
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
]
