import { defineType, defineField } from 'sanity'
import { HelpCircleIcon } from '@sanity/icons'

// Named object type cho một mục faq (question + answer).
// Lý do tồn tại: khi faq item là anonymous inline object (`of: [{ type: 'object' }]`),
// Studio không gán `_type` nhất quán lúc thêm tay → ra `_type: null`, vỡ gate
// I-FAQ-TYPE và JSON-LD. Named type buộc Studio tự gán `_type: 'faqItem'`.
// (FIX-FAQ-TYPE 2026-06-24 — CONTENT_MODEL §2.11, DECISIONS.md)
export default defineType({
  name: 'faqItem',
  title: 'Câu hỏi thường gặp',
  type: 'object',
  icon: HelpCircleIcon,
  fields: [
    defineField({ name: 'question', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'answer', type: 'text', rows: 4, validation: Rule => Rule.required() })
  ],
  preview: { select: { title: 'question' } }
})
