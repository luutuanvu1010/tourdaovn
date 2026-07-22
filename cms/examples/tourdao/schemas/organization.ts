import { defineType, defineField } from 'sanity'
import { baseFieldsAfter, baseGroups } from './baseFields'

// Chính công ty Tour Đảo → JSON-LD schema.org TravelAgency.
// Chỉ một document publish (bản thân doanh nghiệp).
export const organization = defineType({
  name: 'organization',
  title: 'Doanh nghiệp',
  type: 'document',
  groups: baseGroups,
  fields: [
    defineField({ name: 'name', title: 'Tên doanh nghiệp', type: 'string', group: 'coBan', validation: Rule => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', group: 'coBan',
      options: { source: 'name', maxLength: 96 }, validation: Rule => Rule.required(),
    }),
    defineField({ name: 'description', title: 'Mô tả', type: 'text', rows: 4, group: 'coBan', validation: Rule => Rule.required() }),
    defineField({
      name: 'logo', title: 'Logo', type: 'image', group: 'coBan', options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt', type: 'string', validation: Rule => Rule.required() })],
      validation: Rule => Rule.required(),
    }),
    defineField({ name: 'url', title: 'URL chính thức', type: 'url', group: 'coBan', validation: Rule => Rule.required() }),
    defineField({ name: 'telephone', title: 'Điện thoại', type: 'string', group: 'coBan' }),
    defineField({ name: 'email', title: 'Email', type: 'string', group: 'coBan' }),
    defineField({
      name: 'address', title: 'Địa chỉ', type: 'object', group: 'viTri',
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
    defineField({ name: 'sameAs', title: 'Liên kết chính thức (fanpage, Zalo OA...)', type: 'array', of: [{ type: 'url' }], group: 'viTri' }),
    defineField({ name: 'officialSource', title: 'Nguồn xác thực', type: 'url', group: 'viTri' }),
    ...baseFieldsAfter,
  ],
})
