import { defineType, defineField } from 'sanity'
import { UserIcon } from '@sanity/icons'
import { baseFields, baseGroups } from './baseFields'

export default defineType({
  name: 'person',
  title: 'Tác giả (Person)',
  type: 'document',
  icon: UserIcon,
  groups: baseGroups,
  fields: [
    ...baseFields,
    defineField({
      name: 'sameAs', type: 'array',
      group: 'viTri',
      of: [{ type: 'url' }],
    }),
    defineField({
      name: 'jobTitle', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({ name: 'vi', type: 'string' }),
        defineField({ name: 'en', type: 'string' }),
        defineField({ name: 'zh', type: 'string' }),
        defineField({ name: 'ko', type: 'string' }),
        defineField({ name: 'ru', type: 'string' }),
      ]
    }),
    defineField({
      name: 'knowsAbout', type: 'object',
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
      name: 'url', type: 'url',
      group: 'viTri'
    }),
    defineField({
      name: 'bio', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({ name: 'vi', type: 'array', of: [{ type: 'block' }] }),
        defineField({ name: 'en', type: 'array', of: [{ type: 'block' }] }),
        defineField({ name: 'zh', type: 'array', of: [{ type: 'block' }] }),
        defineField({ name: 'ko', type: 'array', of: [{ type: 'block' }] }),
        defineField({ name: 'ru', type: 'array', of: [{ type: 'block' }] }),
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
