import { defineType, defineField } from 'sanity'

// Object SEO tái dùng: metaTitle, metaDescription. Bỏ trống thì trang tự lấy title/summary.
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 2 }),
  ],
})
