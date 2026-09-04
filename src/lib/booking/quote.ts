// quote.ts — tạm tính cho form đặt tour. MỘT hàm cho cả client (script trong
// BookingForm.astro) lẫn server (handler kiểm nhất quán) — BK5 của 04-CONSTRAINTS §1d.
// Thuần: không import prices.ts / sanity.ts / resolver.ts (BK1).

import { pickSeason, type Season } from './season'

export type PaxCode = 'adult' | 'child' | 'senior' | 'infant'
/** Thứ tự hiện trên form, cố định bất kể thứ tự trong prices.yaml (SPEC §4.2 luật 5). */
export const PAX_ORDER: readonly PaxCode[] = ['adult', 'child', 'senior', 'infant']
export type PaxCounts = Record<PaxCode, number>

export type PriceTable =
  | { kind: 'flat'; perPax: Partial<Record<PaxCode, number>> & { adult: number }; notes?: Partial<Record<PaxCode, string>> }
  | { kind: 'tiers'; tiers: { maxPax: number; amount: number }[] }
  // ADR-0033 §2: một giá cho cả nhóm. `amount` là giá MỘT LƯỢT.
  | { kind: 'group'; amount: number; maxPax: number }

/**
 * `unit: 'luot'` → `count` đếm LƯỢT, không đếm người. Chỉ nhánh group dùng.
 * `goc` / `subtotalGoc` (05/09): đơn giá và thành tiền TRƯỚC ưu đãi thanh toán trước, ĐÃ áp mùa —
 * cùng phép với `prepay.totalGoc`, chỉ là tách theo dòng; cộng mọi `subtotalGoc` ra đúng `totalGoc`.
 * Tồn tại vì nút "Chi tiết" trên form in thành tiền từng hạng theo giá gốc, mà giao diện thì không
 * được tự nhân (SPEC-2026-09-04 §3.2 luật 1). Không ưu đãi thì `goc === amount`.
 */
export type QuoteLine = { code: PaxCode; count: number; amount: number; subtotal: number; goc: number; subtotalGoc: number; unit?: 'luot' }
export type QuoteOptions = {
  seasons?: Season[]
  departDate?: string
  /** % ưu đãi thanh toán trước — số DƯƠNG nghĩa là GIẢM (ADR-0031 §3). 0 = không có ưu đãi. */
  prepayPercent?: number
  /** khách đã chọn "chuyển khoản trước" hay chưa */
  prepay?: boolean
}
export type Quote = {
  lines: QuoteLine[]
  total: number
  perPax: Partial<Record<PaxCode, number>>
  /** Mùa đã áp, để đơn ghi lại vì sao ra con số này (ADR-0030 §3). */
  season?: { name: string; percent: number }
  /** Ưu đãi đã áp + tổng NẾU KHÔNG chọn ưu đãi (đã gồm mùa) — ADR-0031 §4. */
  prepay?: { percent: number; totalGoc: number }
  /**
   * Có mặt ⇔ bảng giá dùng là `group` (ADR-0033 §2). `amount` ở đây là giá MỘT LƯỢT ĐÃ ÁP
   * mùa/ưu đãi (cùng giá trị với `lines[0].amount`) — không phải giá gốc trong `PriceTable`.
   * `maxPax` không đổi theo mùa/ưu đãi, chỉ chép lại nguyên trạng. Lý do trường này tồn tại:
   * nhánh group để `perPax` RỖNG có chủ ý (không có "giá mỗi người"), nên đây là chỗ DUY NHẤT
   * mang amount/maxPax đi tiếp cho `buildQuotedPayload` (schema.ts) dựng lại `Quoted.group` và
   * cho máy chủ dựng lại bảng giá khi kiểm nhất quán (BK5).
   */
  group?: { amount: number; maxPax: number }
}

export function emptyPax(): PaxCounts {
  return { adult: 1, child: 0, senior: 0, infant: 0 }
}

export function totalPax(pax: PaxCounts): number {
  return PAX_ORDER.reduce((n, c) => n + (pax[c] || 0), 0)
}

/** Làm tròn LÊN nghìn sau khi áp CẢ HAI phần trăm (ADR-0030 §3, ADR-0031 §3). */
export function apDieuChinh(amount: number, seasonPct: number, prepayPct = 0): number {
  // Giữ tương thích ngược, đừng xoá dù trông dư: bỏ dòng này, Math.ceil bên dưới sẽ làm tròn
  // lên cả khi không có mùa lẫn ưu đãi, âm thầm đổi mọi giá gốc không phải bội số nghìn.
  // NAY PHẢI CANH HAI BIẾN, không phải một — bỏ sót `prepayPct` là mở lại đúng lỗi đó.
  if (!seasonPct && !prepayPct) return amount
  return Math.ceil((amount * (100 + seasonPct) * (100 - prepayPct)) / 10_000 / 1000) * 1000
}

/** null = không tính được (hạng có người nhưng không có giá, vượt bậc, hoặc 0 khách). */
export function computeQuote(table: PriceTable, pax: PaxCounts, opts: QuoteOptions = {}): Quote | null {
  const n = totalPax(pax)
  if (n <= 0) return null

  const mua = opts.seasons && opts.departDate ? pickSeason(opts.seasons, opts.departDate) : null
  const pct = mua?.percent ?? 0
  // Ưu đãi chỉ sống khi khách CHỌN và công tắc đang bật. Hai điều kiện, không phải một.
  const uuDai = opts.prepay && typeof opts.prepayPercent === 'number' && opts.prepayPercent > 0
    ? opts.prepayPercent
    : 0
  const nhan = (x: number) => apDieuChinh(x, pct, uuDai)
  // `totalGoc` cộng dồn TRONG vòng lặp bên dưới bằng hàm này — KHÔNG gọi lại computeQuote():
  // lời gọi thứ hai có thể trả null và chọn mùa lại từ đầu, thành hai nguồn sự thật cho cùng
  // một phép. Cũng không nhân ngược từ `total`: làm tròn lên không có phép nghịch đảo.
  const khongUuDai = (x: number) => apDieuChinh(x, pct, 0)
  const kem = (q: Omit<Quote, 'season' | 'prepay'>, totalGoc: number): Quote => {
    const out: Quote = { ...q }
    if (mua) out.season = { name: mua.name, percent: mua.percent }
    if (uuDai) out.prepay = { percent: uuDai, totalGoc }
    return out
  }

  if (table.kind === 'group') {
    // maxPax <= 0 thì ceil(n/0) = Infinity — chặn ở đây, đừng để nó thành số tiền.
    if (!Number.isInteger(table.maxPax) || table.maxPax <= 0) return null
    const soLuot = Math.ceil(n / table.maxPax)
    const amount = nhan(table.amount)
    const goc = khongUuDai(table.amount)
    const q = kem({
      lines: [{ code: 'adult', count: soLuot, amount, subtotal: amount * soLuot, goc, subtotalGoc: goc * soLuot, unit: 'luot' }],
      total: amount * soLuot,
      // RỖNG có chủ ý: không có "giá mỗi người" nào tồn tại cho dòng giá này. Trả một con số
      // ở đây là dựng lại đúng lỗi đã khiến `tiers` bị loại khỏi vai giá nhóm (ADR-0033 §2).
      perPax: {},
    }, goc * soLuot)
    // amount đã áp mùa/ưu đãi — cùng giá trị với lines[0].amount (xem ghi chú ở kiểu Quote).
    q.group = { amount, maxPax: table.maxPax }
    return q
  }

  if (table.kind === 'tiers') {
    const tier = [...table.tiers].sort((a, b) => a.maxPax - b.maxPax).find(t => t.maxPax >= n)
    if (!tier) return null
    const amount = nhan(tier.amount)
    const goc = khongUuDai(tier.amount)
    return kem({
      lines: [{ code: 'adult', count: n, amount, subtotal: amount * n, goc, subtotalGoc: goc * n }],
      total: amount * n,
      perPax: { adult: amount },
    }, goc * n)
  }

  const lines: QuoteLine[] = []
  const perPax: Partial<Record<PaxCode, number>> = {}
  let totalGoc = 0
  for (const code of PAX_ORDER) {
    const count = pax[code] || 0
    if (count <= 0) continue
    const goc = table.perPax[code]
    if (typeof goc !== 'number') return null
    const amount = nhan(goc)
    const gocDong = khongUuDai(goc)
    lines.push({ code, count, amount, subtotal: amount * count, goc: gocDong, subtotalGoc: gocDong * count })
    perPax[code] = amount
    totalGoc += gocDong * count
  }
  return kem({ lines, total: lines.reduce((s, l) => s + l.subtotal, 0), perPax }, totalGoc)
}

/** Hạng nào được hiện bộ đếm: flat → adult + mọi khoá có giá; tiers → chỉ "số khách" (adult). */
export function availablePaxCodes(table: PriceTable): PaxCode[] {
  if (table.kind === 'tiers' || table.kind === 'group') return ['adult']
  return PAX_ORDER.filter(c => typeof table.perPax[c] === 'number')
}

/**
 * Dựng bảng giá cho form từ một dòng prices.yaml (PriceEntry). Chạy lúc BUILD trong
 * TourDetail.astro; kết quả nướng vào data-attr. Nhận `unknown` để không kéo kiểu
 * PriceEntry vào bundle client.
 */
export function priceTableFromEntry(entry: unknown): PriceTable | null {
  if (!entry || typeof entry !== 'object') return null
  const e = entry as Record<string, unknown>
  if (e.unit === 'perGroup') {
    const amount = e.amount, maxPax = e.maxPax
    if (typeof amount !== 'number') return null
    if (typeof maxPax !== 'number' || !Number.isInteger(maxPax) || maxPax <= 0) return null
    return { kind: 'group', amount, maxPax }
  }
  if (e.unit !== 'perPax') return null

  if (Array.isArray(e.tiers) && e.tiers.length > 0) {
    const tiers = (e.tiers as Array<{ maxPax: number; amount: number }>)
      .map(t => ({ maxPax: t.maxPax, amount: t.amount }))
      .sort((a, b) => a.maxPax - b.maxPax)
    return { kind: 'tiers', tiers }
  }

  if (typeof e.amount !== 'number') return null
  const perPax: Partial<Record<PaxCode, number>> & { adult: number } = { adult: e.amount }
  const notes: Partial<Record<PaxCode, string>> = {}
  const rates = (e.paxRates ?? {}) as Partial<Record<Exclude<PaxCode, 'adult'>, { amount: number; note?: string }>>
  for (const code of ['child', 'senior', 'infant'] as const) {
    const r = rates[code]
    if (!r || typeof r.amount !== 'number') continue
    perPax[code] = r.amount
    if (r.note) notes[code] = r.note
  }
  return Object.keys(notes).length ? { kind: 'flat', perPax, notes } : { kind: 'flat', perPax }
}
