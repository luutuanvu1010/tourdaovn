import { defineType, defineField, defineArrayMember } from 'sanity'
import { CalendarIcon } from '@sanity/icons'

// Bảng mùa vụ: KHÔNG chứa giá, chỉ chứa quy tắc điều chỉnh (ADR-0030 §3). Nguồn giá vẫn là
// Google Sheet → data/prices.yaml. Thứ tự các mục trong `muaVu` LÀ độ ưu tiên: mục trên thắng
// mục dưới. Kéo thả để sắp lại — không cần sửa mã.
export default defineType({
  name: 'bangGiaMuaVu',
  title: 'Giá theo mùa',
  type: 'document',
  icon: CalendarIcon,
  fields: [
    defineField({
      name: 'muaVu',
      title: 'Danh sách mùa — mục TRÊN thắng mục DƯỚI',
      description:
        'Khi một ngày rơi vào nhiều mùa, hệ dùng mùa đứng cao nhất trong danh sách rồi dừng. ' +
        'Kéo thả để đổi độ ưu tiên. Phần trăm dương là tăng giá, âm là giảm giá.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'mua',
          fields: [
            defineField({
              name: 'tenMua', title: 'Tên mùa', type: 'string',
              description: 'Hiện trong thư báo đơn để nhân viên biết vì sao ra con số đó.',
              validation: Rule => Rule.required().max(60),
            }),
            defineField({
              name: 'tuNgay', title: 'Từ ngày', type: 'date',
              options: { dateFormat: 'DD/MM/YYYY' },
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'denNgay', title: 'Đến ngày', type: 'date',
              description: 'Tính cả ngày này. Ngày lễ đơn lẻ thì điền trùng với Từ ngày.',
              options: { dateFormat: 'DD/MM/YYYY' },
              validation: Rule => Rule.required(),
            }),
            defineField({
              name: 'phanTram', title: 'Điều chỉnh (%)', type: 'number',
              description: 'Ví dụ 30 là tăng 30%, -15 là giảm 15%. Giá sau điều chỉnh làm tròn lên nghìn.',
              validation: Rule => Rule.required().min(-90).max(200),
            }),
            defineField({
              name: 'apCho', title: 'Chỉ áp cho các khoá giá', type: 'array',
              of: [{ type: 'string' }],
              description: 'Bỏ trống = áp cho mọi tour. Điền khoá giá (cột "Khoá giá" trong bảng tính).',
            }),
            defineField({
              name: 'truRa', title: 'Trừ ra các khoá giá', type: 'array',
              of: [{ type: 'string' }],
              description: 'Các tour KHÔNG áp mùa này, kể cả khi ô trên bỏ trống.',
            }),
          ],
          preview: {
            select: { title: 'tenMua', tu: 'tuNgay', den: 'denNgay', pct: 'phanTram' },
            prepare({ title, tu, den, pct }) {
              const dau = typeof pct === 'number' && pct > 0 ? '+' : ''
              return { title: `${title ?? '(chưa đặt tên)'} · ${dau}${pct ?? 0}%`, subtitle: `${tu ?? '?'} → ${den ?? '?'}` }
            },
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Giá theo mùa' }) },
})
