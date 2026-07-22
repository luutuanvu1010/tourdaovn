import { defineType, defineField } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'
import { baseGroups } from './baseFields'
import { ApprovedByInput } from '../components/ApprovedByInput'

export default defineType({
  name: 'article',
  title: 'Cẩm nang (Article)',
  type: 'document',
  icon: DocumentTextIcon,
  groups: baseGroups,
  fields: [
    defineField({
      name: 'title', type: 'string',
      group: 'coBan',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug', type: 'slug',
      group: 'seo',
      options: { source: 'title' },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'language', type: 'string',
      group: 'quanTri',
      options: {
        list: [
          { title: 'Tiếng Việt', value: 'vi' },
          { title: 'English', value: 'en' },
          { title: '中文', value: 'zh' },
          { title: '한국어', value: 'ko' },
          { title: 'Русский', value: 'ru' }
        ]
      },
      validation: Rule => Rule.required(),
      initialValue: 'vi'
    }),
    defineField({
      name: 'translationGroup', type: 'reference',
      group: 'quanTri',
      to: [{ type: 'article' }], weak: true,
      description: 'Nhóm các bản dịch cùng bài; mỗi language tối đa một lần (I7)'
    }),
    defineField({
      name: 'summary', type: 'text', rows: 3,
      group: 'coBan',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'mainImage', type: 'image',
      group: 'coBan',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt', type: 'string',
          validation: Rule => Rule.required()
        })
      ],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'articleType', type: 'string',
      group: 'coBan',
      options: {
        list: [
          { title: 'Cẩm nang', value: 'guide' },
          { title: 'Danh sách', value: 'list' },
          { title: 'Tin tức', value: 'news' },
          { title: 'Đánh giá', value: 'review' },
          { title: 'Lịch trình', value: 'itinerary' },
          { title: 'Di chuyển', value: 'transport-guide' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'author', type: 'reference',
      group: 'viTri',
      to: [{ type: 'person' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'body', type: 'array',
      group: 'noiDung',
      of: [{ type: 'block' }, { type: 'image' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'about', type: 'array',
      group: 'viTri',
      of: [{
        type: 'reference',
        to: [
          { type: 'place' }, { type: 'attraction' }, { type: 'experience' },
          { type: 'restaurant' }, { type: 'specialty' }, { type: 'hotel' },
          { type: 'resort' }, { type: 'tour' }, { type: 'event' },
          { type: 'organization' }
        ]
      }]
    }),
    defineField({
      name: 'mentions', type: 'array',
      group: 'viTri',
      of: [{
        type: 'reference',
        to: [
          { type: 'place' }, { type: 'attraction' }, { type: 'experience' },
          { type: 'restaurant' }, { type: 'specialty' }, { type: 'hotel' },
          { type: 'resort' }, { type: 'tour' }, { type: 'event' },
          { type: 'organization' }
        ]
      }]
    }),
    defineField({
      name: 'faq', type: 'array',
      group: 'noiDung',
      of: [{ type: 'faqItem' }]
    }),
    defineField({
      name: 'howTo', type: 'array',
      group: 'noiDung',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'step', type: 'string' }),
          defineField({ name: 'text', type: 'text', rows: 3 })
        ]
      }]
    }),
    defineField({
      name: 'seo', type: 'object',
      group: 'seo',
      fields: [
        defineField({ name: 'metaTitle', type: 'string' }),
        defineField({ name: 'metaDescription', type: 'text', rows: 2 })
      ]
    }),
    defineField({
      name: 'reviewStatus', type: 'string',
      group: 'quanTri',
      options: {
        list: [
          { title: 'Nháp', value: 'draft' },
          { title: 'Đang duyệt', value: 'inReview' },
          { title: 'Đã duyệt', value: 'approved' }
        ]
      },
      initialValue: 'draft'
    }),
    defineField({ name: 'approvedBy', type: 'string', group: 'quanTri', components: { input: ApprovedByInput } }),
    defineField({
      name: 'contentProvenance', type: 'string',
      group: 'quanTri',
      options: {
        list: [
          { title: 'Người viết', value: 'human' },
          { title: 'AI sinh, người duyệt', value: 'ai-t1' },
          { title: 'Trộn', value: 'mixed' }
        ]
      }
    }),
    defineField({
      name: 'category', type: 'array',
      group: 'viTri',
      of: [{ type: 'reference', to: [{ type: 'category' }] }]
    }),
    defineField({ name: 'publishedAt', type: 'datetime', group: 'quanTri', readOnly: true }),
    defineField({ name: 'updatedAt', type: 'datetime', group: 'quanTri', readOnly: true })
  ],
  preview: {
    select: { title: 'title', status: 'reviewStatus', media: 'mainImage' },
    prepare({ title, status, media }) {
      const label: Record<string, string> = { draft: 'Nháp', inReview: 'Đang duyệt', approved: 'Đã duyệt' }
      return { title, subtitle: label[status] ?? status ?? '—', media }
    }
  }
})
