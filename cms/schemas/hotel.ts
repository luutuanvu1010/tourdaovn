import { defineType, defineField } from 'sanity'
import { HomeIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups } from './baseFields'
import { lodgingBaseFields, lodgingGalleryField } from './lodgingBase'

export default defineType({
  name: 'hotel',
  title: 'Khách sạn (Hotel)',
  type: 'document',
  icon: HomeIcon,
  groups: baseGroups,
  fields: [
    ...baseFieldsBeforeGallery,
    lodgingGalleryField,
    ...baseFieldsAfterGallery,
    ...lodgingBaseFields
  ],
  preview: {
    select: { title: 'title.vi', status: 'reviewStatus', media: 'mainImage' },
    prepare({ title, status, media }) {
      const label: Record<string, string> = { draft: 'Nháp', inReview: 'Đang duyệt', approved: 'Đã duyệt' }
      return { title, subtitle: label[status] ?? status ?? '—', media }
    }
  }
})
