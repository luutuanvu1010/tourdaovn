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

export type QuoteLine = { code: PaxCode; count: number; amount: number; subtotal: number }
export type QuoteOptions = { seasons?: Season[]; departDate?: string }
export type Quote = {
  lines: QuoteLine[]
  total: number
  perPax: Partial<Record<PaxCode, number>>
  /** Mùa đã áp, để đơn ghi lại vì sao ra con số này (ADR-0030 §3). */
  season?: { name: string; percent: number }
}

export function emptyPax(): PaxCounts {
  return { adult: 1, child: 0, senior: 0, infant: 0 }
}

export function totalPax(pax: PaxCounts): number {
  return PAX_ORDER.reduce((n, c) => n + (pax[c] || 0), 0)
}

/** Làm tròn LÊN nghìn sau khi áp phần trăm (ADR-0030 §3). */
function apDieuChinh(amount: number, percent: number): number {
  if (!percent) return amount
  return Math.ceil((amount * (100 + percent)) / 100 / 1000) * 1000
}

/** null = không tính được (hạng có người nhưng không có giá, vượt bậc, hoặc 0 khách). */
export function computeQuote(table: PriceTable, pax: PaxCounts, opts: QuoteOptions = {}): Quote | null {
  const n = totalPax(pax)
  if (n <= 0) return null

  const mua = opts.seasons && opts.departDate ? pickSeason(opts.seasons, opts.departDate) : null
  const pct = mua?.percent ?? 0
  const nhan = (x: number) => apDieuChinh(x, pct)
  const kem = (q: Omit<Quote, 'season'>): Quote => (mua ? { ...q, season: { name: mua.name, percent: mua.percent } } : q)

  if (table.kind === 'tiers') {
    const tier = [...table.tiers].sort((a, b) => a.maxPax - b.maxPax).find(t => t.maxPax >= n)
    if (!tier) return null
    const amount = nhan(tier.amount)
    return kem({
      lines: [{ code: 'adult', count: n, amount, subtotal: amount * n }],
      total: amount * n,
      perPax: { adult: amount },
    })
  }

  const lines: QuoteLine[] = []
  const perPax: Partial<Record<PaxCode, number>> = {}
  for (const code of PAX_ORDER) {
    const count = pax[code] || 0
    if (count <= 0) continue
    const goc = table.perPax[code]
    if (typeof goc !== 'number') return null
    const amount = nhan(goc)
    lines.push({ code, count, amount, subtotal: amount * count })
    perPax[code] = amount
  }
  return kem({ lines, total: lines.reduce((s, l) => s + l.subtotal, 0), perPax })
}

/** Hạng nào được hiện bộ đếm: flat → adult + mọi khoá có giá; tiers → chỉ "số khách" (adult). */
export function availablePaxCodes(table: PriceTable): PaxCode[] {
  if (table.kind === 'tiers') return ['adult']
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
