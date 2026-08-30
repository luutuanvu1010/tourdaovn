// queries/seasons.ts — Đọc bảng mùa (bangGiaMuaVu) lúc DỰNG TRANG. File này thuộc tầng dữ
// liệu build, KHÔNG được import từ src/lib/booking/* ngoài kiểu (BK1) — TourDetail.astro là
// nơi ghép hai thứ lại. Chỉ import `type Season` (kiểu, không phải giá trị) từ booking/season.
import { getClient } from '../sanity'
import type { Season } from '../booking/season'

export type SeasonRule = Season & { apCho: string[]; truRa: string[] }

export type PriceRules = { seasons: SeasonRule[]; prepayPercent: number }

// Lấy theo mã cố định (_id), không theo loại tài liệu (_type): loại thì hai bảng cùng
// loại cho kết quả không đoán trước theo thứ tự nội bộ của kho dữ liệu. Mã này khớp
// `documentId('bangGiaMuaVu')` mà cms/lib/structure.ts khai cho mục menu — đổi một chỗ
// phải đổi cả hai.
// Hai ô ưu đãi nằm ở CẤP TÀI LIỆU, không nằm trong mảng `muaVu`, nên chiếu tài liệu rồi
// lấy mảng làm một khoá con — không chiếu thẳng mảng như trước nữa.
const QUERY = `*[_id == "bangGiaMuaVu"][0]{
  "seasons": muaVu[]{
    "name": tenMua, "from": tuNgay, "to": denNgay, "percent": phanTram,
    "apCho": coalesce(apCho, []), "truRa": coalesce(truRa, [])
  },
  "batUuDai": coalesce(batUuDai, false),
  "phanTramUuDai": coalesce(phanTramUuDai, 0)
}`

type RawDoc = { seasons: SeasonRule[] | null; batUuDai: boolean; phanTramUuDai: number }

export async function fetchPriceRules(): Promise<PriceRules> {
  const c = getClient()
  const doc = await c.fetch<RawDoc | null>(QUERY)
  if (!doc) return { seasons: [], prepayPercent: 0 }
  // Bỏ dòng thiếu trường bắt buộc thay vì để form nhận dữ liệu rác. Validator (Task 7) mới là
  // nơi báo đỏ; ở đây chỉ cần không làm hỏng trang.
  const seasons = (doc.seasons ?? []).filter(r => r && r.name && r.from && r.to && typeof r.percent === 'number')
  // Công tắc tắt và phần trăm 0 quy về CÙNG MỘT trạng thái ngay tại đây, để không tầng nào
  // bên dưới phải mang hai biến để diễn tả một ý.
  const pct = doc.batUuDai && typeof doc.phanTramUuDai === 'number' ? Math.round(doc.phanTramUuDai) : 0
  return { seasons, prepayPercent: pct > 0 && pct <= 50 ? pct : 0 }
}

/** Lọc mùa áp được cho một tour, GIỮ NGUYÊN thứ tự ưu tiên. */
export function seasonsForKey(rules: SeasonRule[], bookingKey: string): Season[] {
  return rules
    .filter(r => !r.truRa.includes(bookingKey))
    .filter(r => r.apCho.length === 0 || r.apCho.includes(bookingKey))
    .map(({ name, from, to, percent }) => ({ name, from, to, percent }))
}
