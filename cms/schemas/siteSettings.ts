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
    // CONTENT_MODEL §2.15 v1.0.17 — ảnh nhận diện thương hiệu (QĐ-2026-08-14-01).
    //
    // Ranh giới với src/site.config.ts (ADR-0021 QĐ8): CHỮ thương hiệu — tên site,
    // tên pháp nhân, mô tả — ở lại file config vì nó vào JSON-LD và thẻ meta của
    // mọi trang, phải cố định lúc build. ẢNH ở đây vì site chỉ tham chiếu chúng
    // bằng URL; biên tập viên đổi ảnh không đổi cấu trúc trang nào.
    defineField({
      name: 'branding',
      title: 'Nhận diện thương hiệu',
      description:
        'Logo, favicon và ảnh chia sẻ. Để trống ô nào thì site dùng hình mặc định ' +
        'trong code — không có ô nào bắt buộc, không ô nào để trống làm vỡ trang.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'logo',
          title: 'Logo (header và chân trang)',
          description:
            'Nên là ảnh nền trong suốt (PNG hoặc SVG), cao khoảng 68px là đủ nét. ' +
            'Để trống thì site dùng hình mặc định.',
          type: 'image',
          options: { accept: 'image/svg+xml,image/png,image/webp' },
          // CỐ Ý KHÔNG có ô "alt", khác partners[].logo ngay dưới. Logo nằm trong
          // thẻ <a> đã mang aria-label "về trang chủ"; thêm alt là trình đọc màn
          // hình đọc hai lần cùng một thứ. Logo đối tác thì ngược lại — đó là ảnh
          // nội dung, đứng một mình, nên phải có alt.
        }),
        defineField({
          name: 'hideWordmark',
          title: 'Ẩn chữ tên site bên cạnh logo',
          description:
            'Bật khi ảnh logo đã có sẵn chữ thương hiệu, để chữ không hiện hai lần. ' +
            'Chưa tải logo lên thì công tắc này không có tác dụng — site vẫn hiện chữ, ' +
            'không để trống cụm thương hiệu.',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'favicon',
          title: 'Favicon (biểu tượng trên tab trình duyệt)',
          description:
            'Ảnh VUÔNG, tối thiểu 512×512. PNG nét hơn trên iPhone; SVG nhẹ hơn nhưng ' +
            'iPhone không đọc được nên sẽ dùng hình mặc định cho biểu tượng màn hình chính.',
          type: 'image',
          options: { accept: 'image/svg+xml,image/png' },
        }),
        defineField({
          name: 'ogImage',
          title: 'Ảnh chia sẻ mặc định (Facebook, Zalo)',
          description:
            'Ảnh hiện khi dán link site lên mạng xã hội. Tỉ lệ 1200×630. Trang nào có ' +
            'ảnh riêng thì ảnh đó thắng; ảnh này chỉ đỡ những trang không có.',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Mô tả ảnh (alt)',
              type: 'string',
              description: 'Mạng xã hội đọc cho người dùng trình đọc màn hình.',
            }),
          ],
        }),
      ],
    }),
    // CONTENT_MODEL §2.15 v1.0.18 — chữ và ảnh của Hero trang chủ (QĐ-2026-08-14-03).
    //
    // Ranh giới với src/site.config.ts: đây là chữ NGƯỜI ĐỌC thấy. Chữ MÁY đọc —
    // tên site, tên pháp nhân, và `brand.description` khi nó làm <meta description>
    // — vẫn ở file config, cố định lúc build (ADR-0021 QĐ8, QĐ-2026-08-14-01).
    // Hệ quả có chủ ý: mô tả trên Hero có thể khác meta description.
    //
    // Ô chữ MỘT TẦNG, không phải object 5 ngôn ngữ như `heroText` cũ: site.config
    // khai `langs = ['vi']`, bốn ngôn ngữ kia chưa build ra trang nào. Luật render
    // kèm theo: sáu ô chữ chỉ áp khi lang === 'vi'; ngôn ngữ khác dùng bản dịch
    // trong code, không để câu tiếng Việt rơi lên trang tiếng Anh.
    defineField({
      name: 'hero',
      title: 'Hero trang chủ',
      description:
        'Khối lớn nhất đầu trang chủ. Để trống ô nào thì site dùng chữ và ảnh mặc định ' +
        'trong code — không ô nào bắt buộc, không ô nào để trống làm vỡ trang.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Dòng nhỏ phía trên tiêu đề',
          description: 'Chữ in hoa nhỏ, ví dụ "Tour biển đảo Nha Trang".',
          type: 'string',
        }),
        defineField({
          name: 'heading',
          title: 'Tiêu đề lớn (H1)',
          description:
            'Câu định vị của site. Nói site BÁN GÌ, đừng chỉ lặp lại tên thương hiệu. ' +
            'Để trống thì dùng câu mặc định trong code.',
          type: 'string',
        }),
        defineField({
          name: 'summary',
          title: 'Đoạn mô tả dưới tiêu đề',
          description:
            'Hai tới ba dòng cho người đọc. Ô này KHÔNG phải thẻ mô tả cho Google — ' +
            'thẻ đó cố định lúc build, sửa ở đây không đổi nó.',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'image',
          title: 'Ảnh nền',
          description:
            'Ảnh ngang, tối thiểu 1800px chiều rộng. Để trống thì dùng ảnh đại diện ' +
            'của Điểm đến chính như hiện nay.',
          type: 'image',
          options: { hotspot: true },
          // CỐ Ý KHÔNG có ô "alt": đây là ảnh trang trí, nội dung nằm ở tiêu đề H1
          // ngay trên nó. Thêm alt là trình đọc màn hình đọc hai lần cùng một ý.
          // Cùng lý do đã bỏ alt khỏi `branding.logo`.
        }),
        defineField({
          name: 'imageCredit',
          title: 'Ghi nguồn ảnh',
          description: 'Dòng chữ nhỏ ở góc ảnh, ví dụ "Ảnh: Nguyễn Văn A". Để trống thì không hiện.',
          type: 'string',
        }),
        defineField({
          name: 'ctaPrimaryLabel',
          title: 'Chữ trên nút chính',
          description:
            'Nút dẫn tới Zalo. Đích đến lấy từ "Kênh liên hệ" bên dưới, không đổi được ở đây. ' +
            'Để trống thì dùng chữ mặc định.',
          type: 'string',
        }),
        defineField({
          name: 'ctaSecondaryLabel',
          title: 'Chữ trên nút phụ',
          description: 'Nút dẫn tới trang Điểm đến chính. Để trống thì dùng chữ mặc định.',
          type: 'string',
        }),
      ],
    }),
    // CONTENT_MODEL §2.15 v1.0.18 — chữ và ảnh chân trang (QĐ-2026-08-14-03).
    //
    // KHÔNG có tiêu đề cột ở đây: các cột chân trang sinh tự động từ ROUTE_MAP
    // (ADR-0023). Đưa tiêu đề vào Studio là dựng lại nguồn thứ hai cho điều hướng,
    // đúng thứ DR-007 vừa dọn xong.
    defineField({
      name: 'footer',
      title: 'Chân trang',
      description:
        'Chữ và ảnh ở chân trang. Tên cột và danh sách liên kết KHÔNG nằm ở đây — ' +
        'chúng sinh tự động từ menu, sửa menu là chân trang đổi theo.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'tagline',
          title: 'Câu giới thiệu dưới logo',
          description: 'Một tới hai dòng. Để trống thì dùng câu mặc định trong code.',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'disclaimer',
          title: 'Dòng miễn trừ trách nhiệm',
          description:
            'Dòng cuối chân trang, cạnh dòng bản quyền. Để trống thì dùng câu mặc định. ' +
            'Dòng bản quyền và tên pháp nhân KHÔNG sửa được ở đây.',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'backgroundImage',
          title: 'Ảnh nền chân trang',
          description:
            'Ảnh ngang, mờ phía sau chân trang. Site tự phủ một lớp màu đậm lên trên ' +
            'để chữ vẫn đọc được, nên ảnh sáng cũng không làm mất chữ. Để trống thì nền màu trơn.',
          type: 'image',
          options: { hotspot: true },
        }),
        defineField({
          name: 'badges',
          title: 'Huy hiệu, thanh toán, mạng xã hội',
          description:
            'Kéo thả để sắp thứ tự. Site tự gom theo Loại và hiện thành từng dải: ' +
            'chứng nhận trước, rồi thanh toán, rồi mạng xã hội. Để trống thì không hiện dải nào.',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'kind',
                  title: 'Loại',
                  type: 'string',
                  options: {
                    list: [
                      { title: '🏅 Chứng nhận, giấy phép', value: 'chung-nhan' },
                      { title: '💳 Thanh toán', value: 'thanh-toan' },
                      { title: '🔗 Mạng xã hội', value: 'mang-xa-hoi' },
                    ],
                    layout: 'radio',
                  },
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'image',
                  title: 'Ảnh',
                  description: 'Ảnh nền trong suốt (PNG hoặc SVG) hiện đẹp nhất. Cao khoảng 40px là đủ nét.',
                  type: 'image',
                  options: { accept: 'image/svg+xml,image/png,image/webp' },
                }),
                defineField({
                  name: 'alt',
                  title: 'Mô tả ảnh (alt)',
                  type: 'string',
                  description:
                    'Bắt buộc khi có ảnh — người dùng trình đọc màn hình cần nó. Để trống ' +
                    'mà có liên kết thì site tạm lấy tên Loại, nhưng đó là bản vá, không phải bản đúng.',
                }),
                defineField({
                  name: 'url',
                  title: 'Liên kết',
                  type: 'url',
                  description: 'Để trống thì ảnh không thành link.',
                  validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
                }),
              ],
              preview: {
                select: { alt: 'alt', kind: 'kind', media: 'image' },
                prepare({ alt, kind, media }: { alt?: string; kind?: string; media?: unknown }) {
                  const kindLabel: Record<string, string> = {
                    'chung-nhan': 'Chứng nhận, giấy phép',
                    'thanh-toan': 'Thanh toán',
                    'mang-xa-hoi': 'Mạng xã hội',
                  }
                  return {
                    title: alt || '(chưa có mô tả ảnh)',
                    subtitle: kind ? kindLabel[kind] ?? kind : '(chưa chọn loại)',
                    media,
                  }
                },
              },
            },
          ],
        }),
      ],
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
    // `heroText` (object 5 ngôn ngữ) đã chuyển thành `hero.eyebrow` một tầng —
    // QĐ-2026-08-14-03, migration ở cms/_migrate-hero-footer.mjs.
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
