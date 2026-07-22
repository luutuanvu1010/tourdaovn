import { defineType, defineField } from 'sanity'
import { baseFieldsAfter, baseGroups } from './baseFields'

// Khách sạn đối tác giới thiệu → JSON-LD schema.org Hotel (subtype LodgingBusiness).
// Tour Đảo là đại lý đặt phòng: KHÔNG có field giá/tồn kho trong Sanity (ADR-0001).
// Đặt phòng qua liên hệ hoặc seam booking.
export const hotel = defineType({
  name: 'hotel',
  title: 'Khách sạn',
  type: 'document',
  groups: baseGroups,
  fields: [
    defineField({ name: 'name', title: 'Tên khách sạn', type: 'string', group: 'coBan', validation: Rule => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', group: 'coBan',
      options: { source: 'name', maxLength: 96 }, validation: Rule => Rule.required(),
    }),
    defineField({ name: 'description', title: 'Mô tả', type: 'text', rows: 4, group: 'coBan', validation: Rule => Rule.required() }),
    defineField({
      name: 'images', title: 'Ảnh', type: 'array', group: 'coBan',
      of: [{ type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', type: 'string' })] }],
      validation: Rule => Rule.required().min(1),
    }),
    defineField({
      name: 'address', title: 'Địa chỉ', type: 'object', group: 'viTri',
      validation: Rule => Rule.required(),
      fields: [
        defineField({ name: 'streetAddress', title: 'Số nhà, đường', type: 'string' }),
        defineField({ name: 'addressLocality', title: 'Thành phố', type: 'string', initialValue: 'Nha Trang' }),
        defineField({ name: 'addressRegion', title: 'Tỉnh', type: 'string', initialValue: 'Khánh Hòa' }),
      ],
    }),
    defineField({
      name: 'geo', title: 'Toạ độ', type: 'object', group: 'viTri',
      fields: [
        defineField({ name: 'lat', title: 'Vĩ độ', type: 'number' }),
        defineField({ name: 'lng', title: 'Kinh độ', type: 'number' }),
      ],
    }),
    defineField({ name: 'starRating', title: 'Hạng sao', type: 'number', group: 'noiDung', validation: Rule => Rule.min(1).max(5) }),
    defineField({ name: 'amenities', title: 'Tiện ích', type: 'array', of: [{ type: 'string' }], group: 'noiDung' }),
    defineField({ name: 'officialSource', title: 'Trang chính thức khách sạn', type: 'url', group: 'viTri' }),
    defineField({
      name: 'contact', title: 'Liên hệ đặt qua Tour Đảo', type: 'object', group: 'coBan',
      fields: [
        defineField({ name: 'phone', title: 'Điện thoại', type: 'string' }),
        defineField({ name: 'note', title: 'Ghi chú', type: 'string' }),
      ],
    }),
    ...baseFieldsAfter,
  ],
})
