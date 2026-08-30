import { createClient, type SanityClient } from '@sanity/client'
import { SANITY_DATASET, SANITY_PROJECT_ID, SANITY_READ_TOKEN } from '../synthesis/config'
import type { SeasonRule } from '../../src/lib/queries/seasons.js'

let client: SanityClient | null = null
let clientKey = ''

export function getClient(): SanityClient {
  const key = `${SANITY_PROJECT_ID}:${SANITY_DATASET}:${SANITY_READ_TOKEN ? 'token' : 'anon'}`
  if (client && clientKey === key) return client

  if (!SANITY_PROJECT_ID) throw new Error('SANITY_STUDIO_PROJECT_ID is required')

  client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2026-06-01',
    token: SANITY_READ_TOKEN || undefined,
    useCdn: false,
    perspective: 'published'
  })
  clientKey = key

  return client
}

const ALL_TYPES = [
  'touristDestination', 'place', 'attraction', 'experience',
  'restaurant', 'specialty', 'hotel', 'resort', 'tour',
  'organization', 'event', 'article', 'person', 'category'
]

/**
 * Fetch tất cả document trong published namespace từ Sanity.
 * Dùng `...` để lấy toàn bộ field gốc (gồm reference dạng {_ref, _type}).
 *
 * CHỦ Ý trả ĐỦ corpus, KHÔNG lọc reviewStatus ở đây (ADR-0008 Phương án bị loại:
 * lọc approved-only ở mức toàn cục làm I18/I17 mất tầm nhìn vào reference từ document
 * chưa approved, gài regression). Phạm vi "đã publish = approved" áp ở tầng dispatch
 * (validate-constraints.ts) cho riêng nhóm cổng completeness — xem ADR-0008 Quyết định 4.
 */
export async function fetchAllDocs(): Promise<any[]> {
  const c = getClient()
  const query = `*[_type in $types]`
  return c.fetch(query, { types: ALL_TYPES }) as Promise<any[]>
}

// `bangGiaMuaVu` không nằm trong ALL_TYPES ở trên (fetchAllDocs chỉ lấy nhóm entity nội
// dung) nên validator MUA1 (scripts/validators/mua-vu.ts, đăng ký ở validate-constraints.ts)
// cần fetch riêng. GROQ này PHẢI khớp với src/lib/queries/seasons.ts (fetchSeasons) — đổi
// field ở Studio thì sửa cả hai. KHÔNG import giá trị fetchSeasons từ đó: nó gọi getClient()
// của tầng Astro, đọc import.meta.env — global đó không tồn tại dưới tsx/Node thuần của
// scripts/, chỉ import được `type SeasonRule`.
//
// Lấy theo mã cố định (_id), không theo loại tài liệu (_type) — cùng lý do đã ghi ở
// seasons.ts: _type cho kết quả không đoán trước theo thứ tự nội bộ khi có nhiều bản cùng
// loại.
//
// CHỦ Ý không lọc bỏ dòng thiếu trường như fetchSeasons làm cho tầng render: validator cần
// THẤY đúng dòng hỏng để báo lỗi, lọc ở đây sẽ che mất chính tín hiệu nó phải bắt.
const SEASON_RULES_QUERY = `*[_id == "bangGiaMuaVu"][0].muaVu[]{
  "name": tenMua, "from": tuNgay, "to": denNgay, "percent": phanTram,
  "apCho": coalesce(apCho, []), "truRa": coalesce(truRa, [])
}`

export async function fetchSeasonRules(): Promise<SeasonRule[]> {
  const c = getClient()
  const rows = await c.fetch<SeasonRule[] | null>(SEASON_RULES_QUERY)
  return rows ?? []
}
