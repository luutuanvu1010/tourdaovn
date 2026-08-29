// quote.ts — tạm tính cho form đặt tour. MỘT hàm cho cả client (script trong
// BookingForm.astro) lẫn server (handler kiểm nhất quán) — BK5 của 04-CONSTRAINTS §1d.
// Thuần: không import prices.ts / sanity.ts / resolver.ts (BK1).

export type PaxCode = 'adult' | 'child' | 'senior' | 'infant'
/** Thứ tự hiện trên form, cố định bất kể thứ tự trong prices.yaml (SPEC §4.2 luật 5). */
export const PAX_ORDER: readonly PaxCode[] = ['adult', 'child', 'senior', 'infant']
export type PaxCounts = Record<PaxCode, number>

export type PriceTable =
  | { kind: 'flat'; perPax: Partial<Record<PaxCode, number>> & { adult: number }; notes?: Partial<Record<PaxCode, string>> }
  | { kind: 'tiers'; tiers: { maxPax: number; amount: number }[] }

export type QuoteLine = { code: PaxCode; count: number; amount: number; subtotal: number }
export type Quote = { lines: QuoteLine[]; total: number; perPax: Partial<Record<PaxCode, number>> }

export function emptyPax(): PaxCounts {
  return { adult: 1, child: 0, senior: 0, infant: 0 }
}

export function totalPax(pax: PaxCounts): number {
  return PAX_ORDER.reduce((n, c) => n + (pax[c] || 0), 0)
}

/** null = không tính được (hạng có người nhưng không có giá, vượt bậc, hoặc 0 khách). */
export function computeQuote(table: PriceTable, pax: PaxCounts): Quote | null {
  const n = totalPax(pax)
  if (n <= 0) return null

  if (table.kind === 'tiers') {
    const tier = [...table.tiers].sort((a, b) => a.maxPax - b.maxPax).find(t => t.maxPax >= n)
    if (!tier) return null
    return {
      lines: [{ code: 'adult', count: n, amount: tier.amount, subtotal: tier.amount * n }],
      total: tier.amount * n,
      perPax: { adult: tier.amount },
    }
  }

  const lines: QuoteLine[] = []
  const perPax: Partial<Record<PaxCode, number>> = {}
  for (const code of PAX_ORDER) {
    const count = pax[code] || 0
    if (count <= 0) continue
    const amount = table.perPax[code]
    if (typeof amount !== 'number') return null
    lines.push({ code, count, amount, subtotal: amount * count })
    perPax[code] = amount
  }
  return { lines, total: lines.reduce((s, l) => s + l.subtotal, 0), perPax }
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
