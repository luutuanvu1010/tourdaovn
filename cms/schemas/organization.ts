import { defineType, defineField } from 'sanity'
import { UsersIcon } from '@sanity/icons'
import { baseFields, baseGroups } from './baseFields'

export default defineType({
  name: 'organization',
  title: 'Đơn vị vận hành (Organization)',
  type: 'document',
  icon: UsersIcon,
  groups: baseGroups,
  fields: [
    ...baseFields,
    defineField({
      name: 'orgType', type: 'string',
      group: 'coBan',
      options: {
        list: [
          { title: 'Đại lý du lịch', value: 'travelAgency' },
          { title: 'Công ty vận tải', value: 'transportCompany' },
          { title: 'Trung tâm lặn', value: 'diveOperator' },
          { title: 'DMC', value: 'dmc' },
          { title: 'Tổ chức', value: 'organization' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'url', type: 'url',
      group: 'viTri',
      validation: Rule => Rule.required().uri()
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
      name: 'logo', type: 'image',
      group: 'viTri',
      options: { hotspot: true }
    }),
    defineField({ name: 'geo', type: 'geopoint', group: 'viTri' }),
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
    defineField({ name: 'telephone', type: 'string', group: 'seo' }),
    defineField({
      name: 'licenseInfo', type: 'object',
      group: 'viTri',
      fields: [
        defineField({ name: 'vi', type: 'text', rows: 1 }),
        defineField({ name: 'en', type: 'text', rows: 1 }),
        defineField({ name: 'zh', type: 'text', rows: 1 }),
        defineField({ name: 'ko', type: 'text', rows: 1 }),
        defineField({ name: 'ru', type: 'text', rows: 1 }),
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
    })
  ],
  preview: {
    select: { title: 'title.vi', status: 'reviewStatus', media: 'logo' },
    prepare({ title, status, media }) {
      const label: Record<string, string> = { draft: 'Nháp', inReview: 'Đang duyệt', approved: 'Đã duyệt' }
      return { title, subtitle: label[status] ?? status ?? '—', media }
    }
  }
})
