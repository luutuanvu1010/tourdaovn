import { defineType, defineField } from 'sanity'
import { baseFieldsAfter, baseGroups } from './baseFields'

// Tác giả → JSON-LD schema.org Person. Publish cần bio, ảnh và sameAs (hồ sơ thật).
export const author = defineType({
  name: 'author',
  title: 'Tác giả',
  type: 'document',
  groups: baseGroups,
  fields: [
    defineField({ name: 'name', title: 'Họ tên', type: 'string', group: 'coBan', validation: Rule => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', group: 'coBan',
      options: { source: 'name', maxLength: 96 }, validation: Rule => Rule.required(),
    }),
    defineField({ name: 'bio', title: 'Tiểu sử', type: 'text', rows: 3, group: 'coBan', validation: Rule => Rule.required() }),
    defineField({
      name: 'avatar', title: 'Ảnh', type: 'image', group: 'coBan', options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string' })],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'sameAs', title: 'Hồ sơ thật (link)', type: 'array', of: [{ type: 'url' }], group: 'viTri',
      validation: Rule => Rule.required().min(1),
    }),
    ...baseFieldsAfter,
  ],
})
