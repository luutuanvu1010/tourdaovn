import { defineType, defineField } from 'sanity'
import { TagsIcon } from '@sanity/icons'
import { baseGroups } from './baseFields'

export default defineType({
  name: 'category',
  title: 'Danh mục (Category)',
  type: 'document',
  icon: TagsIcon,
  groups: baseGroups,
  fields: [
    defineField({
      name: 'name', type: 'object',
      group: 'coBan',
      fields: [
        defineField({ name: 'vi', type: 'string', validation: Rule => Rule.required() }),
        defineField({ name: 'en', type: 'string' }),
        defineField({ name: 'zh', type: 'string' }),
        defineField({ name: 'ko', type: 'string' }),
        defineField({ name: 'ru', type: 'string' }),
      ]
    }),
    defineField({
      name: 'description', type: 'object',
      group: 'coBan',
      fields: [
        defineField({ name: 'vi', type: 'text', rows: 2 }),
        defineField({ name: 'en', type: 'text', rows: 2 }),
        defineField({ name: 'zh', type: 'text', rows: 2 }),
        defineField({ name: 'ko', type: 'text', rows: 2 }),
        defineField({ name: 'ru', type: 'text', rows: 2 }),
      ]
    }),
    defineField({
      name: 'inDefinedTermSet', type: 'string',
      group: 'coBan',
      options: {
        list: [
          { title: 'Phân mục chung', value: 'general-category' },
          { title: 'Loại trải nghiệm', value: 'experience-type' },
          { title: 'Loại tour', value: 'tour-type' },
          { title: 'Nhãn điểm tham quan', value: 'attraction-type' }
        ]
      },
    }),
    defineField({
      name: 'termCode', type: 'slug',
      group: 'coBan',
      options: { source: 'name.vi' },
      description: 'Tự sinh từ tên tiếng Việt. Khóa ổn định, không đổi khi sửa tên hiển thị.',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug', type: 'slug',
      group: 'seo',
      options: { source: 'name.vi' },
      hidden: ({ document }) => document?.inDefinedTermSet === 'general-category'
    }),
    defineField({
      name: 'sameAs', type: 'url',
      group: 'viTri'
    }),
    defineField({ name: 'publishedAt', type: 'datetime', group: 'quanTri', readOnly: true }),
    defineField({ name: 'updatedAt', type: 'datetime', group: 'quanTri', readOnly: true })
  ],
  preview: {
    select: { title: 'name.vi', subtitle: 'inDefinedTermSet' }
    // category không có reviewStatus; giữ subtitle = inDefinedTermSet theo spec
  }
})
