// geo.ts — Parse tọa độ an toàn, chống lỗi mất dấu thập phân (locale vi-VN nuốt '.').
// Nguồn ngoài (JSON-LD, OpenGraph, REST, Wikidata) có thể trả string dùng ',' làm dấu
// thập phân, hoặc số ngoài phạm vi hợp lệ. parseCoord chuẩn hoá về number hoặc null.

export type CoordKind = 'lat' | 'lng'

/**
 * Ép input về number tọa độ hợp lệ, hoặc null.
 * - number: dùng trực tiếp (vẫn qua guard phạm vi).
 * - string: trim, bỏ khoảng trắng, thay mọi ',' → '.'. Nếu còn >1 dấu '.' → null
 *   (không đoán định dạng nghìn/thập phân). Ép Number.
 * - Trả null nếu !isFinite hoặc |n| > (lat?90:180).
 */
export function parseCoord(input: unknown, kind: CoordKind): number | null {
  let n: number
  if (typeof input === 'number') {
    n = input
  } else if (typeof input === 'string') {
    let s = input.trim().replace(/\s+/g, '').replace(/,/g, '.')
    if ((s.match(/\./g) || []).length > 1) return null
    n = Number(s)
  } else {
    return null
  }
  if (!Number.isFinite(n)) return null
  const max = kind === 'lat' ? 90 : 180
  if (Math.abs(n) > max) return null
  return n
}
