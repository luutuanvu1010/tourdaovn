import { defineType, defineField } from 'sanity'
import { baseFieldsAfter, baseGroups } from './baseFields'

// Entity dịch vụ gom: tour đảo, vé Vinpearl, vé Hòn Tằm, transfer.
// serviceType quyết định @type JSON-LD lúc serialize:
//   island-tour, combo -> TouristTrip ; ticket -> Product + Offer ; transfer -> Service
// Giá KHÔNG nhập ở đây; priceKey tra ở data/prices.yaml lúc build (ADR-0001/0007).
export const tour = defineType({
  name: 'tour',
  title: 'Tour / Dịch vụ',
  type: 'document',
  groups: baseGroups,
  fields: [
    defineField({ name: 'title', title: 'Tên', type: 'string', group: 'coBan', validation: Rule => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', group: 'coBan',
      options: { source: 'title', maxLength: 96 }, validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'serviceType', title: 'Loại dịch vụ', type: 'string', group: 'coBan',
      options: {
        list: [
          { title: 'Tour đảo', value: 'island-tour' },
          { title: 'Vé (Vinpearl, Hòn Tằm...)', value: 'ticket' },
          { title: 'Vận chuyển', value: 'transfer' },
          { title: 'Combo', value: 'combo' },
        ],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
    }),
    defineField({ name: 'summary', title: 'Tóm tắt', type: 'text', rows: 3, group: 'coBan', validation: Rule => Rule.required() }),
    defineField({ name: 'body', title: 'Nội dung', type: 'array', of: [{ type: 'block' }], group: 'noiDung' }),
    defineField({
      name: 'heroImage', title: 'Ảnh chính', type: 'image', group: 'coBan', options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt', type: 'string', validation: Rule => Rule.required() })],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'gallery', title: 'Thư viện ảnh', type: 'array', group: 'noiDung',
      of: [{ type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', type: 'string' })] }],
    }),
    defineField({
      name: 'provider', title: 'Đơn vị cung cấp', type: 'reference', group: 'coBan',
      to: [{ type: 'organization' }], validation: Rule => Rule.required(),
    }),
    defineField({ name: 'duration', title: 'Thời lượng', type: 'string', group: 'noiDung', description: 'Ví dụ: 1 ngày, 4 giờ' }),
    defineField({
      name: 'itinerary', title: 'Lịch trình', type: 'array', group: 'noiDung',
      of: [{ type: 'object', fields: [
        defineField({ name: 'title', title: 'Chặng', type: 'string' }),
        defineField({ name: 'detail', title: 'Chi tiết', type: 'text', rows: 2 }),
      ] }],
      description: 'Dùng cho serviceType = island-tour.',
    }),
    defineField({ name: 'meetingPoint', title: 'Điểm đón', type: 'string', group: 'viTri' }),
    defineField({
      name: 'geo', title: 'Toạ độ điểm đón', type: 'object', group: 'viTri',
      fields: [
        defineField({ name: 'lat', title: 'Vĩ độ', type: 'number' }),
        defineField({ name: 'lng', title: 'Kinh độ', type: 'number' }),
      ],
    }),
    defineField({ name: 'includes', title: 'Bao gồm', type: 'array', of: [{ type: 'string' }], group: 'noiDung' }),
    defineField({ name: 'excludes', title: 'Không bao gồm', type: 'array', of: [{ type: 'string' }], group: 'noiDung' }),
    defineField({ name: 'priceKey', title: 'Khoá giá (seam)', type: 'string', group: 'quanTri', description: 'Khoá tra giá ở data/prices.yaml. KHÔNG nhập số tiền vào Sanity.' }),
    ...baseFieldsAfter,
  ],
})
