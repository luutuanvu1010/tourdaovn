// Lớp nghiệp vụ thuần: không import Sanity, không import prices (BK1). So chuỗi ngày dạng
// YYYY-MM-DD trực tiếp — chuỗi ISO ngày so từ điển đúng bằng so thời gian, nên không cần
// dựng Date và không dính bẫy múi giờ.

export type Season = {
  name: string
  /** YYYY-MM-DD, tính cả ngày này */
  from: string
  /** YYYY-MM-DD, tính cả ngày này */
  to: string
  /** dương là tăng, âm là giảm */
  percent: number
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Mùa đầu tiên trong danh sách phủ `departDate`. Thứ tự danh sách LÀ độ ưu tiên: cái trên
 * thắng cái dưới (ADR-0030 §3). Không so số học — hai mùa phủ nhau là hợp lệ, biên tập sắp
 * thứ tự trong Studio để quyết định cái nào thắng.
 */
export function pickSeason(seasons: Season[], departDate: string): Season | null {
  if (!ISO.test(departDate)) return null
  for (const s of seasons) {
    if (!ISO.test(s.from) || !ISO.test(s.to)) continue
    // Khai ngược đầu đuôi thì bỏ qua thay vì ném: dữ liệu đến từ biên tập, một dòng hỏng
    // không được làm chết cả form. Validator lúc dựng mới là nơi báo đỏ.
    if (s.from > s.to) continue
    if (departDate >= s.from && departDate <= s.to) return s
  }
  return null
}
