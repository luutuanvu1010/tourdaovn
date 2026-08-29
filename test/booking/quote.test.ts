import { describe, expect, it } from 'vitest'
import { availablePaxCodes, computeQuote, emptyPax, priceTableFromEntry, totalPax, type PriceTable } from '../../src/lib/booking/quote'

const flat: PriceTable = { kind: 'flat', perPax: { adult: 550000, child: 350000 }, notes: { child: '5–11 tuổi' } }
const tiers: PriceTable = { kind: 'tiers', tiers: [{ maxPax: 6, amount: 900000 }, { maxPax: 2, amount: 1200000 }] }

describe('computeQuote', () => {
  it('2 người lớn + 1 trẻ em = 1.450.000', () => {
    const q = computeQuote(flat, { adult: 2, child: 1, senior: 0, infant: 0 })
    expect(q?.total).toBe(1450000)
    expect(q?.lines).toEqual([
      { code: 'adult', count: 2, amount: 550000, subtotal: 1100000 },
      { code: 'child', count: 1, amount: 350000, subtotal: 350000 },
    ])
    expect(q?.perPax).toEqual({ adult: 550000, child: 350000 })
  })
  it('hạng không có giá mà có người → null (không đoán giá)', () => {
    expect(computeQuote(flat, { adult: 1, child: 0, senior: 1, infant: 0 })).toBeNull()
  })
  it('giá 0 đồng vẫn là một dòng (miễn phí)', () => {
    const t: PriceTable = { kind: 'flat', perPax: { adult: 500000, infant: 0 } }
    const q = computeQuote(t, { adult: 1, child: 0, senior: 0, infant: 1 })
    expect(q?.total).toBe(500000)
    expect(q?.lines[1]).toEqual({ code: 'infant', count: 1, amount: 0, subtotal: 0 })
  })
  it('tiers: chọn bậc nhỏ nhất đủ chỗ, nhân tổng khách', () => {
    const q = computeQuote(tiers, { adult: 3, child: 0, senior: 0, infant: 0 })
    expect(q?.total).toBe(2700000)
    expect(q?.perPax).toEqual({ adult: 900000 })
    expect(q?.lines).toEqual([{ code: 'adult', count: 3, amount: 900000, subtotal: 2700000 }])
  })
  it('tiers: vượt bậc cao nhất → null', () => {
    expect(computeQuote(tiers, { adult: 7, child: 0, senior: 0, infant: 0 })).toBeNull()
  })
  it('0 khách → null', () => {
    expect(computeQuote(flat, { adult: 0, child: 0, senior: 0, infant: 0 })).toBeNull()
  })
})

describe('priceTableFromEntry', () => {
  it('perPax amount + paxRates → flat, giữ note', () => {
    const t = priceTableFromEntry({ unit: 'perPax', amount: 550000, paxRates: { child: { amount: 350000, note: '5–11 tuổi' }, senior: { amount: 450000 } } })
    expect(t).toEqual({ kind: 'flat', perPax: { adult: 550000, child: 350000, senior: 450000 }, notes: { child: '5–11 tuổi' } })
  })
  it('perPax tiers → tiers đã sắp theo maxPax', () => {
    expect(priceTableFromEntry({ unit: 'perPax', tiers: [{ maxPax: 6, amount: 900000 }, { maxPax: 2, amount: 1200000 }] }))
      .toEqual({ kind: 'tiers', tiers: [{ maxPax: 2, amount: 1200000 }, { maxPax: 6, amount: 900000 }] })
  })
  it('unit khác hoặc thiếu → null', () => {
    expect(priceTableFromEntry({ unit: 'perRoomNight', from: 1, asOf: '2026-01-01' })).toBeNull()
    expect(priceTableFromEntry(undefined)).toBeNull()
  })
})

describe('tiện ích', () => {
  it('emptyPax có 1 người lớn; totalPax cộng đủ', () => {
    expect(emptyPax()).toEqual({ adult: 1, child: 0, senior: 0, infant: 0 })
    expect(totalPax({ adult: 2, child: 1, senior: 1, infant: 0 })).toBe(4)
  })
  it('availablePaxCodes theo thứ tự cố định; tiers chỉ adult', () => {
    expect(availablePaxCodes({ kind: 'flat', perPax: { adult: 1, senior: 2, child: 3 } })).toEqual(['adult', 'child', 'senior'])
    expect(availablePaxCodes(tiers)).toEqual(['adult'])
  })
})
