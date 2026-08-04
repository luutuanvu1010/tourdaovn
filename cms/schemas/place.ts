import { defineType, defineField } from 'sanity'
import { PinIcon } from '@sanity/icons'
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups } from './baseFields'
import { BulkGalleryInput } from '../components/BulkGalleryInput'
import { IncomingExperiences } from '../components/IncomingExperiences'
import { PlaceHierarchy } from '../components/PlaceHierarchy'
import { brand } from '../../src/site.config'

export default defineType({
  name: 'place',
  title: 'Địa danh (Place)',
  type: 'document',
  icon: PinIcon,
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
    defineField({
      name: 'placeType', type: 'string',
      group: 'coBan',
      description:
        'Cấp hành chính đi trước (Tỉnh → Phường/Xã), rồi tới địa danh tự nhiên (Đảo, Bãi biển, Địa hình). ' +
        '"Khu vực" là vùng du lịch không trùng ranh giới hành chính.',
      options: {
        list: [
          // ── Cấp hành chính (dùng làm khung chứa) ──
          { title: 'Tỉnh', value: 'province' },
          { title: 'Phường', value: 'ward' },
          { title: 'Xã', value: 'commune' },
          // ── Địa danh tự nhiên / vùng du lịch ──
          { title: 'Đảo', value: 'island' },
          { title: 'Bãi biển', value: 'beach' },
          { title: 'Địa hình', value: 'landform' },
          { title: 'Khu vực', value: 'area' }
        ]
      }
    }),
    defineField({
      name: 'sameAs', type: 'array',
      group: 'viTri',
      of: [{ type: 'url' }],
      description: 'Wikidata/Wikipedia. Với cấp hành chính (tỉnh, phường, xã) nên có để JSON-LD trỏ đúng thực thể chuẩn (I2).'
    }),
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
      name: 'containedInPlace', type: 'reference',
      group: 'viTri',
      to: [{ type: 'place' }, { type: 'touristDestination' }],
      title: 'Nằm trong (đơn vị chứa trực tiếp)',
      description:
        'Chọn đơn vị chứa TRỰC TIẾP, không nhảy cấp. Chuỗi mẫu: ' +
        'Hòn Mun (Đảo) → Phường Nha Trang (Phường) → Tỉnh Khánh Hoà (Tỉnh). ' +
        'Place cấp Tỉnh là gốc, để trống ô này. ' +
        'Trỏ TouristDestination khi vùng chứa là thương hiệu du lịch chứ không phải đơn vị hành chính.',
      validation: Rule => Rule.custom((value: any, context: any) => {
        if (!value?._ref) return true
        const selfId = String(context?.document?._id || '').replace(/^drafts\./, '')
        if (selfId && value._ref.replace(/^drafts\./, '') === selfId) {
          return 'Một địa danh không thể nằm trong chính nó (chu trình — I8)'
        }
        return true
      })
    }),
    defineField({ name: 'hasMap', type: 'url', group: 'seo' }),
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
      name: 'openingHours', type: 'object',
      group: 'seo',
      fields: [
        defineField({ name: 'open', type: 'string' }),
        defineField({ name: 'close', type: 'string' }),
        defineField({ name: 'note', type: 'string' })
      ]
    }),
    defineField({ name: 'isAccessibleForFree', type: 'boolean', group: 'seo' }),
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
    defineField({
      name: 'placeHierarchy', type: 'string',
      title: 'Chuỗi liên kết thực tế',
      group: 'viTri',
      readOnly: true,
      components: { input: PlaceHierarchy },
      description:
        'Chỉ để xem — suy ngược từ dữ liệu, không lưu. ' +
        'Chuỗi mẫu: Tỉnh Khánh Hoà → Phường Nha Trang → Hòn Mun → Lặn biển.'
    }),
    defineField({
      name: 'incomingExperiences', type: 'string',
      group: 'viTri',
      hidden: true,
      readOnly: true,
      components: { input: IncomingExperiences },
      description: 'Trải nghiệm diễn ra tại địa danh này (tham chiếu từ Experience.venue)'
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
