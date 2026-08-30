// queries/seasons.ts — Đọc bảng mùa (bangGiaMuaVu) lúc DỰNG TRANG. File này thuộc tầng dữ
// liệu build, KHÔNG được import từ src/lib/booking/* ngoài kiểu (BK1) — TourDetail.astro là
// nơi ghép hai thứ lại. Chỉ import `type Season` (kiểu, không phải giá trị) từ booking/season.
import { getClient } from '../sanity'
import type { Season } from '../booking/season'

export type SeasonRule = Season & { apCho: string[]; truRa: string[] }

// Lấy theo mã cố định (_id), không theo loại tài liệu (_type): loại thì hai bảng cùng
// loại cho kết quả không đoán trước theo thứ tự nội bộ của kho dữ liệu. Mã này khớp
// `documentId('bangGiaMuaVu')` mà cms/lib/structure.ts khai cho mục menu — đổi một chỗ
// phải đổi cả hai.
const QUERY = `*[_id == "bangGiaMuaVu"][0].muaVu[]{
  "name": tenMua, "from": tuNgay, "to": denNgay, "percent": phanTram,
  "apCho": coalesce(apCho, []), "truRa": coalesce(truRa, [])
}`

export async function fetchSeasons(): Promise<SeasonRule[]> {
  const c = getClient()
  const rows = await c.fetch<SeasonRule[] | null>(QUERY)
  if (!rows) return []
  // Bỏ dòng thiếu trường bắt buộc thay vì để form nhận dữ liệu rác. Validator (Task 7) mới là
  // nơi báo đỏ; ở đây chỉ cần không làm hỏng trang.
  return rows.filter(r => r && r.name && r.from && r.to && typeof r.percent === 'number')
}

/** Lọc mùa áp được cho một tour, GIỮ NGUYÊN thứ tự ưu tiên. */
export function seasonsForKey(rules: SeasonRule[], bookingKey: string): Season[] {
  return rules
    .filter(r => !r.truRa.includes(bookingKey))
    .filter(r => r.apCho.length === 0 || r.apCho.includes(bookingKey))
    .map(({ name, from, to, percent }) => ({ name, from, to, percent }))
}
