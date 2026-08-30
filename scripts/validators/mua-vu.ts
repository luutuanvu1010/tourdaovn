// scripts/validators/mua-vu.ts — Validator canh dữ liệu mùa (bangGiaMuaVu) — Task 7 của
// docs/plans/2026-08-30-gia-mua-vu.md. Đăng ký dispatch ở scripts/validate-constraints.ts
// dưới mã MUA1 (xem chú thích tại nơi đăng ký).
import type { SeasonRule } from '../../src/lib/queries/seasons.js'

const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Ba luật. KHÔNG có luật nào về chồng lấn: hai mùa phủ nhau là hợp lệ, thứ tự trong Studio
 * quyết định cái nào thắng (ADR-0030 §3). Đừng thêm cảnh báo chồng lấn ở đây.
 */
export function validateMuaVu(rules: SeasonRule[], priceKeys: Set<string>): { errors: string[] } {
  const errors: string[] = []
  rules.forEach((r, i) => {
    const nhan = `mùa #${i + 1} "${r.name || '(chưa đặt tên)'}"`
    if (!ISO.test(r.from) || !ISO.test(r.to)) {
      errors.push(`${nhan}: ngày phải dạng YYYY-MM-DD`)
    } else if (r.from > r.to) {
      errors.push(`${nhan}: "Đến ngày" (${r.to}) đứng trước "Từ ngày" (${r.from})`)
    }
    if (typeof r.percent !== 'number' || r.percent < -90 || r.percent > 200) {
      errors.push(`${nhan}: phần trăm ${r.percent} ngoài khoảng cho phép (-90…200)`)
    }
    for (const k of [...(r.apCho ?? []), ...(r.truRa ?? [])]) {
      if (!priceKeys.has(k)) errors.push(`${nhan}: khoá giá "${k}" không có trong data/prices.yaml`)
    }
  })
  return { errors }
}
