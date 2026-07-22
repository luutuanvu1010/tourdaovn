import { defineType, defineField } from 'sanity'
import { baseFieldsAfter, baseGroups } from './baseFields'

// Nội dung biên tập → JSON-LD schema.org Article. Bắt buộc có author.
// publishedAt bắt buộc được enforce ở gate.config (V3), field trong Studio để nhập.
export const article = defineType({
  name: 'article',
  title: 'Bài viết',
  type: 'document',
  groups: baseGroups,
  fields: [
    defineField({ name: 'title', title: 'Tiêu đề', type: 'string', group: 'coBan', validation: Rule => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', group: 'coBan',
      options: { source: 'title', maxLength: 96 }, validation: Rule => Rule.required(),
    }),
    defineField({ name: 'excerpt', title: 'Tóm tắt', type: 'text', rows: 3, group: 'coBan', validation: Rule => Rule.required() }),
    defineField({ name: 'body', title: 'Nội dung', type: 'array', of: [{ type: 'block' }, { type: 'image' }], group: 'noiDung', validation: Rule => Rule.required() }),
    defineField({
      name: 'heroImage', title: 'Ảnh đại diện', type: 'image', group: 'coBan', options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string' })],
    }),
    defineField({
      name: 'author', title: 'Tác giả', type: 'reference', group: 'coBan',
      to: [{ type: 'author' }], validation: Rule => Rule.required(),
    }),
    ...baseFieldsAfter,
  ],
})
