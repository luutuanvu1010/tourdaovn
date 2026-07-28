import { defineType, defineField } from 'sanity'
import { CogIcon } from '@sanity/icons'

const SECTION_KEYS = [
  { title: '🖼 Hero — Lời chào và ảnh bìa', value: 'hero' },
  { title: '✅ Thanh tin cậy', value: 'trustBar' },
  { title: '📝 Nội dung biên tập (body, highlights, facts)', value: 'editorialBody' },
  { title: '🎫 Banner', value: 'banners' },
  { title: '🧭 Hub điều hướng (3 hub)', value: 'hubGrid' },
  { title: '🗺 Khu vực', value: 'areas' },
  { title: '🎯 Điểm tham quan nổi bật', value: 'attractions' },
  { title: '🏄 Trải nghiệm nổi bật', value: 'experiences' },
  { title: '📖 Cẩm nang bản địa', value: 'guides' },
  { title: '🏨 Lưu trú nổi bật', value: 'stays' },
  { title: '🍜 Đặc sản nổi bật', value: 'specialties' },
  { title: '🚌 Tour nổi bật', value: 'tours' },
  { title: '❓ FAQ — Câu hỏi thường gặp', value: 'faq' },
  { title: '⚠ Lưu ý an toàn', value: 'safety' },
  { title: '📋 Thanh meta (Wikidata + ngày cập nhật)', value: 'meta' },
] as const

const LANGUAGES = ['vi', 'en', 'zh', 'ko', 'ru'] as const

export default defineType({
  name: 'siteSettings',
  title: 'Cấu hình Trang chủ',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Tên',
      type: 'string',
      initialValue: 'Trang chủ',
      description: 'Chỉ dùng để hiển thị trên header của Studio',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sections',
      title: 'Section trên Trang chủ',
      type: 'array',
      description: 'Kéo để sắp xếp thứ tự. Section không có dữ liệu sẽ tự ẩn dù đang bật.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'key',
              title: 'Section',
              type: 'string',
              options: { list: SECTION_KEYS },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'hidden',
              title: 'Ẩn',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: { key: 'key', hidden: 'hidden' },
            prepare({ key, hidden }: { key: string; hidden: boolean }) {
              const found = SECTION_KEYS.find((s) => s.value === key)
              return {
                title: found?.title ?? key ?? '(chưa chọn)',
                subtitle: hidden ? 'Đang ẩn' : 'Đang hiện',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'heroText',
      title: 'Lời chào (Hero)',
      description: 'Bấm chọn ngôn ngữ ở trên để nhập cho từng ngôn ngữ. Để trống → dùng mặc định trong code.',
      type: 'object',
      fields: LANGUAGES.map((lang) =>
        defineField({
          name: lang,
          title: lang.toUpperCase(),
          type: 'string',
        })
      ),
    }),
    defineField({
      name: 'contact',
      title: 'Kênh liên hệ',
      description: 'Nguồn duy nhất cho nút liên hệ trên site (sidebar booking, footer, Organization JSON-LD). Để trống field nào thì kênh đó không hiện.',
      type: 'object',
      fields: [
        defineField({
          name: 'hotline',
          title: 'Số điện thoại (hotline)',
          type: 'string',
          description: 'Số gọi được, ví dụ 0905xxxxxx. Site sẽ tự bỏ khoảng trắng khi tạo link gọi.',
        }),
        defineField({
          name: 'zaloUrl',
          title: 'Link Zalo',
          type: 'url',
          description: 'Link zalo.me hoặc Zalo OA đầy đủ.',
          validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
        }),
        defineField({
          name: 'whatsapp',
          title: 'Số WhatsApp',
          type: 'string',
          description: 'Số dạng quốc tế không dấu cộng, ví dụ 84905xxxxxx.',
        }),
        defineField({
          name: 'email',
          title: 'Email liên hệ',
          type: 'string',
          description: 'Email nhận yêu cầu, hiện ở footer dạng mailto.',
          validation: (Rule) => Rule.email(),
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'Trang chủ' }
    },
  },
})
