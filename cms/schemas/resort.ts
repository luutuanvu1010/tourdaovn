import { defineType, defineField } from 'sanity'
import { SunIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups, destinationField } from './baseFields'
import { lodgingBaseFields, lodgingGalleryField } from './lodgingBase'

export default defineType({
  name: 'resort',
  title: 'Khu nghỉ dưỡng (Resort)',
  type: 'document',
  icon: SunIcon,
  groups: baseGroups,
  fields: [
    ...baseFieldsBeforeGallery,
    lodgingGalleryField,
    ...baseFieldsAfterGallery,
    destinationField,
    ...lodgingBaseFields,
    defineField({ name: 'beachfront', type: 'boolean', group: 'noiDung' }),
    defineField({
      name: 'onSiteActivities', type: 'object',
      group: 'noiDung',
      fields: [
        defineField({ name: 'vi', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'en', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'zh', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'ko', type: 'array', of: [{ type: 'string' }] }),
        defineField({ name: 'ru', type: 'array', of: [{ type: 'string' }] }),
      ]
    }),
    defineField({ name: 'landArea', type: 'number', group: 'noiDung' })
  ],
  preview: {
    select: { title: 'title.vi', status: 'reviewStatus', media: 'mainImage' },
    prepare({ title, status, media }) {
      const label: Record<string, string> = { draft: 'Nháp', inReview: 'Đang duyệt', approved: 'Đã duyệt' }
      return { title, subtitle: label[status] ?? status ?? '—', media }
    }
  }
})
