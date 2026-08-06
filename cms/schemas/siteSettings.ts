import { defineType, defineField } from 'sanity'
import { CogIcon } from '@sanity/icons'

const SECTION_KEYS = [
  { title: '🖼 Hero — Lời chào và ảnh bìa', value: 'hero' },
  { title: '✅ Vì sao chọn (bốn điểm khác biệt)', value: 'trustBar' },
  { title: '📊 Dải số liệu', value: 'stats' },
  { title: '🤝 Logo đối tác', value: 'partners' },
  { title: '💬 Đánh giá khách', value: 'testimonials' },
  { title: '📨 Báo giá đoàn', value: 'groupQuote' },
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
              title: 'Khối nội dung',
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
      // Bỏ `title: lang.toUpperCase()` (sinh ra "VI", "EN"...) để từ điển nhãn ở
      // cms/lib/fieldLabels.ts điền "Tiếng Việt", "Tiếng Anh"... — một nguồn tên
      // ngôn ngữ duy nhất cho cả Studio.
      fields: LANGUAGES.map((lang) =>
        defineField({
          name: lang,
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
          title: 'Liên kết Zalo',
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
    // CONTENT_MODEL §2.15 v1.0.13 — lộ trình đón khách. Nguồn duy nhất cho trang
    // /lo-trinh-don-khach; cấm hardcode danh sách điểm đón trong component.
    defineField({
      name: 'pickupPoints',
      title: 'Điểm đón khách (lộ trình xe đưa đón)',
      description:
        'Kéo thả để sắp thứ tự — bản đồ vẽ đường nối theo đúng thứ tự này. ' +
        'Điểm thiếu toạ độ vẫn hiện trong bảng giờ đón nhưng không lên bản đồ. ' +
        'Để trống toàn bộ → trang lộ trình không hiển thị bản đồ.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'stopName',
              title: 'Tên điểm đón',
              type: 'string',
              description: 'Tên khách dễ nhận ra, ví dụ "Tháp Trầm Hương".',
            }),
            defineField({
              name: 'stopAddress',
              title: 'Địa chỉ / vị trí đứng chờ',
              type: 'string',
              description: 'Mô tả cụ thể để khách biết đứng ở đâu.',
            }),
            defineField({
              name: 'geo',
              title: 'Toạ độ trên bản đồ',
              type: 'geopoint',
              description: 'Bấm để chọn vị trí. Thiếu toạ độ thì điểm này không lên bản đồ.',
            }),
            defineField({
              name: 'pickupTime',
              title: 'Giờ đón',
              type: 'string',
              description: 'Dạng HH:MM, ví dụ 07:30. Để trống nếu chưa cố định giờ.',
              validation: (Rule) =>
                Rule.regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
                  name: 'giờ HH:MM',
                  invert: false,
                }).error('Nhập đúng dạng HH:MM, ví dụ 07:30'),
            }),
            defineField({
              name: 'pickupNote',
              title: 'Ghi chú',
              type: 'string',
              description: 'Ví dụ "đứng phía cổng chính", "gọi tài xế trước 5 phút".',
            }),
            defineField({
              name: 'hidden',
              title: 'Tạm ẩn điểm này',
              type: 'boolean',
              initialValue: false,
              description: 'Bật để ẩn khỏi bản đồ và bảng mà không xoá dữ liệu.',
            }),
          ],
          preview: {
            select: {
              stopName: 'stopName',
              pickupTime: 'pickupTime',
              hidden: 'hidden',
              geo: 'geo',
            },
            prepare({
              stopName,
              pickupTime,
              hidden,
              geo,
            }: {
              stopName?: string
              pickupTime?: string
              hidden?: boolean
              geo?: { lat?: number; lng?: number }
            }) {
              const parts = [
                pickupTime || 'chưa có giờ',
                geo?.lat ? 'có toạ độ' : 'thiếu toạ độ',
                hidden ? 'ĐANG ẨN' : null,
              ].filter(Boolean)
              return {
                title: stopName || '(chưa đặt tên)',
                subtitle: parts.join(' · '),
              }
            },
          },
        },
      ],
    }),
    // CONTENT_MODEL §2.15 v1.0.15 — chọn bộ giao diện.
    // Danh sách đóng: Studio CHỌN một bộ, không nhập được giá trị màu, nên
    // 07-DESIGN_TOKENS §1b vẫn là nguồn sự thật duy nhất cho màu.
    defineField({
      name: 'theme',
      title: 'Bộ giao diện',
      description:
        'Đổi tông màu toàn site. Bố cục và chữ không đổi. ' +
        'Để trống thì dùng bộ mặc định "Biển sâu".',
      type: 'string',
      initialValue: 'bien-sau',
      options: {
        list: [
          { title: 'Biển sâu — nền trắng, xanh biển sâu, nhấn san hô (mặc định)', value: 'bien-sau' },
          { title: 'Cát biển — nền kem ấm, nhấn cam nắng', value: 'cat-bien' },
          { title: 'Ngọc lam — nền trắng, xanh ngọc, nhấn hồng san hô', value: 'ngoc-lam' },
        ],
        layout: 'radio',
      },
    }),
    // CONTENT_MODEL §2.15 v1.0.16 — dải số liệu trang chủ.
    defineField({
      name: 'stats',
      title: 'Dải số liệu (trang chủ)',
      description:
        'Con số làm bằng chứng: số năm hoạt động, số khách đã phục vụ, số chuyến/năm. ' +
        'Để trống toàn bộ thì khối không hiện.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Con số',
              type: 'string',
              description: 'Viết đúng như muốn hiện: 50.000+, 12, 4,9/5, 24/7.',
            }),
            defineField({ name: 'label', title: 'Nhãn', type: 'string', description: 'Ví dụ "khách đã phục vụ".' }),
            defineField({ name: 'note', title: 'Ghi chú nhỏ', type: 'string' }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        },
      ],
    }),
    // CONTENT_MODEL §2.15 v1.0.16 — logo đối tác.
    defineField({
      name: 'partners',
      title: 'Đối tác (trang chủ)',
      description: 'Logo OTA, hãng tàu, khách sạn, đại lý. Để trống thì khối không hiện.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Tên đối tác', type: 'string' }),
            defineField({
              name: 'logo',
              title: 'Logo',
              type: 'image',
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Mô tả ảnh (alt)',
                  type: 'string',
                  description: 'Bắt buộc khi có ảnh — người dùng trình đọc màn hình cần nó.',
                }),
              ],
            }),
            defineField({
              name: 'url',
              title: 'Liên kết',
              type: 'url',
              description: 'Để trống thì logo không thành link.',
              validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
            }),
          ],
          preview: { select: { title: 'name', media: 'logo' } },
        },
      ],
    }),
    // CONTENT_MODEL §2.15 v1.0.16 — đánh giá khách.
    // KHÔNG serialize ra JSON-LD: Google cấm rich snippet đánh giá tự phục vụ.
    defineField({
      name: 'testimonials',
      title: 'Đánh giá khách (trang chủ)',
      description:
        'Hiện cho người đọc. Cố ý KHÔNG xuất dữ liệu có cấu trúc cho Google — ' +
        'đánh giá tự đăng mà xuất ra là rủi ro bị phạt.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'quote', title: 'Nội dung đánh giá', type: 'text', rows: 4 }),
            defineField({ name: 'authorName', title: 'Tên khách', type: 'string' }),
            defineField({ name: 'authorNote', title: 'Ghi chú về khách', type: 'string', description: 'Ví dụ "Đoàn 24 khách, tháng 6/2026".' }),
            defineField({ name: 'sourceName', title: 'Nguồn', type: 'string', description: 'Ví dụ "TripAdvisor". Để trống nếu thu trực tiếp.' }),
            defineField({
              name: 'sourceUrl',
              title: 'Liên kết nguồn',
              type: 'url',
              validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
            }),
          ],
          preview: { select: { title: 'authorName', subtitle: 'quote' } },
        },
      ],
    }),
    // CONTENT_MODEL §2.15 v1.0.16 — khối báo giá đoàn.
    defineField({
      name: 'groupQuote',
      title: 'Khối báo giá đoàn (trang chủ)',
      description: 'Khối cuối trang chủ dành cho khách đoàn. Nút dùng lại Liên kết Zalo ở mục Kênh liên hệ.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'heading', title: 'Tiêu đề', type: 'string' }),
        defineField({ name: 'text', title: 'Mô tả', type: 'text', rows: 3 }),
        defineField({ name: 'ctaLabel', title: 'Chữ trên nút', type: 'string' }),
      ],
    }),
    // CONTENT_MODEL §2.15 v1.0.14 — nội dung trang /ho-tro (ADR-0023).
    // Ba phần độc lập: phần nào trống thì khối đó không hiện trên trang và node
    // JSON-LD tương ứng không phát. Cấm hardcode chính sách hay câu hỏi thường
    // gặp trong component.
    defineField({
      name: 'support',
      title: 'Trang Hỗ trợ',
      description:
        'Nội dung trang /ho-tro. Ba phần độc lập nhau — để trống phần nào thì phần đó ' +
        'không hiện, trang vẫn chạy bình thường.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'bookingGuide',
          title: 'Hướng dẫn đặt tour',
          description: 'Các bước khách cần làm để đặt. Kéo thả để sắp thứ tự.',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'step',
                  title: 'Tên bước',
                  type: 'string',
                  description: 'Ví dụ "Bước 1 — Chọn tour".',
                }),
                defineField({
                  name: 'text',
                  title: 'Mô tả',
                  type: 'text',
                  rows: 3,
                }),
              ],
              preview: { select: { title: 'step', subtitle: 'text' } },
            },
          ],
        }),
        defineField({
          name: 'cancellationPolicy',
          title: 'Chính sách huỷ và hoàn tiền',
          description: 'Viết như một bài — có thể in đậm, gạch đầu dòng, chèn ảnh.',
          type: 'array',
          of: [{ type: 'block' }, { type: 'image' }],
        }),
        defineField({
          name: 'faq',
          title: 'Câu hỏi thường gặp',
          description: 'Hiện trên trang, đồng thời phát ra dữ liệu có cấu trúc cho Google.',
          type: 'array',
          of: [{ type: 'faqItem' }],
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
