import { describe, expect, it } from 'vitest'
import { apDieuChinh, availablePaxCodes, computeQuote, emptyPax, priceTableFromEntry, totalPax, type PaxCounts, type PriceTable } from '../../src/lib/booking/quote'
import { pickSeason, type Season } from '../../src/lib/booking/season'

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

describe('computeQuote với mùa', () => {
  const bang: PriceTable = { kind: 'flat', perPax: { adult: 740000, child: 430000, infant: 0 } }
  const mua: Season[] = [
    { name: 'Lễ 30/4', from: '2027-04-30', to: '2027-05-01', percent: 30 },
    { name: 'Cao điểm hè', from: '2027-06-01', to: '2027-08-31', percent: 20 },
    { name: 'Thấp điểm', from: '2027-10-01', to: '2027-11-30', percent: -15 },
  ]

  it('không mùa nào phủ → giá gốc, không có trường season', () => {
    const q = computeQuote(bang, { adult: 2, child: 0, senior: 0, infant: 0 }, { seasons: mua, departDate: '2027-03-10' })
    expect(q?.total).toBe(1480000)
    expect(q?.season).toBeUndefined()
  })

  it('mùa tăng 30%: từng hạng nhân rồi làm tròn LÊN nghìn', () => {
    const q = computeQuote(bang, { adult: 2, child: 1, senior: 0, infant: 1 }, { seasons: mua, departDate: '2027-04-30' })
    // 740.000 × 1,3 = 962.000 ; 430.000 × 1,3 = 559.000 ; em bé 0 vẫn 0
    expect(q?.perPax).toEqual({ adult: 962000, child: 559000, infant: 0 })
    expect(q?.total).toBe(962000 * 2 + 559000)
    expect(q?.season).toEqual({ name: 'Lễ 30/4', percent: 30 })
  })

  it('mùa giảm 15% cũng làm tròn LÊN nghìn', () => {
    const q = computeQuote(bang, { adult: 1, child: 1, senior: 0, infant: 0 }, { seasons: mua, departDate: '2027-10-05' })
    // 740.000 × 0,85 = 629.000 (tròn sẵn) ; 430.000 × 0,85 = 365.500 → 366.000
    expect(q?.perPax).toEqual({ adult: 629000, child: 366000 })
    expect(q?.season).toEqual({ name: 'Thấp điểm', percent: -15 })
  })

  it('làm tròn LÊN chứ không phải gần nhất — 762.200 thành 763.000', () => {
    // 740.000 × 1,03 = 762.200 → chia nghìn được 762,2: phần thập phân 0,2 nhỏ hơn 0,5,
    // vùng DUY NHẤT Math.ceil và Math.round cho kết quả khác nhau (mọi số khác trong file
    // này rơi đúng nghìn hoặc đúng .5, nơi hai phép trùng kết quả). Đừng đổi 762.200 thành
    // một số tròn "đẹp" hơn — làm vậy sẽ âm thầm vô hiệu hoá chính ca kiểm này.
    const nhe: Season[] = [{ name: 'Phụ thu nhẹ', from: '2027-09-01', to: '2027-09-10', percent: 3 }]
    const q = computeQuote(bang, { adult: 1, child: 0, senior: 0, infant: 0 }, { seasons: nhe, departDate: '2027-09-05' })
    expect(q?.perPax.adult).toBe(763000)
    expect(q?.total).toBe(763000)
  })

  it('em bé miễn phí vẫn miễn phí ở mọi mùa', () => {
    const q = computeQuote(bang, { adult: 1, child: 0, senior: 0, infant: 2 }, { seasons: mua, departDate: '2027-07-01' })
    expect(q?.perPax.infant).toBe(0)
    expect(q?.lines.find(l => l.code === 'infant')?.subtotal).toBe(0)
  })

  it('không truyền mùa → y hệt hành vi cũ', () => {
    const a = computeQuote(bang, { adult: 2, child: 0, senior: 0, infant: 0 })
    const b = computeQuote(bang, { adult: 2, child: 0, senior: 0, infant: 0 }, {})
    expect(a?.total).toBe(1480000)
    expect(b?.total).toBe(1480000)
    expect(a?.season).toBeUndefined()
  })

  it('bảng giá theo bậc cũng áp được mùa', () => {
    const bac: PriceTable = { kind: 'tiers', tiers: [{ maxPax: 6, amount: 900000 }] }
    const q = computeQuote(bac, { adult: 3, child: 0, senior: 0, infant: 0 }, { seasons: mua, departDate: '2027-07-01' })
    // 900.000 × 1,2 = 1.080.000
    expect(q?.total).toBe(1080000 * 3)
    expect(q?.season?.name).toBe('Cao điểm hè')
  })
})

// apDieuChinh xuất ra để BookingForm.astro dùng CHUNG một phép tính cho ô đơn giá của
// hạng đang 0 khách (không nằm trong quote.perPax) — không tính lại bằng công thức riêng
// (fix(gia) 2026-08-30). Các ca dưới đối chiếu đúng ba con số đo được trên trình duyệt.
describe('apDieuChinh', () => {
  it('không phần trăm → giữ nguyên giá gốc dù không phải bội số nghìn (tương thích ngược)', () => {
    expect(apDieuChinh(762200, 0)).toBe(762200)
  })
  it('mùa +15%: người lớn 740.000 → 851.000, trẻ em 430.000 → 495.000, cao tuổi 560.000 → 644.000', () => {
    expect(apDieuChinh(740000, 15)).toBe(851000)
    expect(apDieuChinh(430000, 15)).toBe(495000)
    expect(apDieuChinh(560000, 15)).toBe(644000)
  })
  it('phần trăm âm cũng làm tròn LÊN nghìn', () => {
    expect(apDieuChinh(430000, -15)).toBe(366000)
  })
  it('giá gốc 0đ ("Miễn phí") luôn ra 0 dù áp mùa', () => {
    expect(apDieuChinh(0, 15)).toBe(0)
    expect(apDieuChinh(0, -15)).toBe(0)
  })
})

describe('ưu đãi thanh toán trước', () => {
  const FLAT: PriceTable = { kind: 'flat', perPax: { adult: 430000, child: 340000 } }
  const HE: Season = { name: 'Cao điểm hè', from: '2027-06-01', to: '2027-08-31', percent: 15 }
  const MOT: PaxCounts = { adult: 1, child: 0, senior: 0, infant: 0 }

  it('không mùa, không ưu đãi → NGUYÊN giá gốc, không làm tròn', () => {
    const T: PriceTable = { kind: 'flat', perPax: { adult: 730500 } }
    expect(computeQuote(T, MOT)?.total).toBe(730500)
    expect(computeQuote(T, MOT, { prepayPercent: 5, prepay: false })?.total).toBe(730500)
  })

  it('khách KHÔNG chọn → không giảm, không có khoá prepay', () => {
    const q = computeQuote(FLAT, MOT, { prepayPercent: 5, prepay: false })
    expect(q?.total).toBe(430000)
    expect(q?.prepay).toBeUndefined()
  })

  it('công tắc tắt (0%) dù khách chọn → không giảm', () => {
    const q = computeQuote(FLAT, MOT, { prepayPercent: 0, prepay: true })
    expect(q?.total).toBe(430000)
    expect(q?.prepay).toBeUndefined()
  })

  it('chỉ ưu đãi, không mùa: 430.000 −5% → 409.000', () => {
    const q = computeQuote(FLAT, MOT, { prepayPercent: 5, prepay: true })
    expect(q?.total).toBe(409000)
    expect(q?.prepay).toEqual({ percent: 5, totalGoc: 430000 })
  })

  // CA CHỨNG MINH LUẬT — đừng đổi bộ số này cho "tròn hơn": phần lớn bộ số cho kết quả GIỐNG
  // nhau ở cả hai cách làm tròn nên không phân biệt được gì. Bộ này lệch đúng 1.000₫.
  it('mùa + ưu đãi làm tròn MỘT lần: 430.000 +15% −5% → 470.000 (hai lần ra 471.000)', () => {
    const q = computeQuote(FLAT, MOT, { seasons: [HE], departDate: '2027-07-01', prepayPercent: 5, prepay: true })
    expect(q?.total).toBe(470000)
    expect(q?.season).toEqual({ name: 'Cao điểm hè', percent: 15 })
    expect(q?.prepay).toEqual({ percent: 5, totalGoc: 495000 })
  })

  it('nhiều hạng khách: totalGoc cộng dồn đúng theo từng hạng', () => {
    const pax: PaxCounts = { adult: 2, child: 1, senior: 0, infant: 0 }
    const q = computeQuote(FLAT, pax, { prepayPercent: 5, prepay: true })
    // 430.000 → 409.000 ; 340.000 → 323.000 (ceil 323.000)
    expect(q?.total).toBe(409000 * 2 + 323000)
    expect(q?.prepay?.totalGoc).toBe(430000 * 2 + 340000)
  })

  it('bảng tiers cũng được giảm', () => {
    const T: PriceTable = { kind: 'tiers', tiers: [{ maxPax: 4, amount: 1200000 }] }
    const pax: PaxCounts = { adult: 2, child: 0, senior: 0, infant: 0 }
    const q = computeQuote(T, pax, { prepayPercent: 5, prepay: true })
    expect(q?.total).toBe(1140000 * 2)
    expect(q?.prepay).toEqual({ percent: 5, totalGoc: 2400000 })
  })

  it('hạng giá 0 vẫn 0', () => {
    const T: PriceTable = { kind: 'flat', perPax: { adult: 430000, infant: 0 } }
    const pax: PaxCounts = { adult: 1, child: 0, senior: 0, infant: 1 }
    const q = computeQuote(T, pax, { prepayPercent: 5, prepay: true })
    expect(q?.perPax.infant).toBe(0)
  })

  it('apDieuChinh: tham số thứ ba tuỳ chọn, chữ ký cũ không đổi', () => {
    expect(apDieuChinh(430000, 15)).toBe(495000)
    expect(apDieuChinh(430000, 15, 5)).toBe(470000)
    expect(apDieuChinh(730500, 0, 0)).toBe(730500)
  })
})

const group: PriceTable = { kind: 'group', amount: 1000000, maxPax: 5 }

describe('computeQuote — perGroup', () => {
  it('1 khách = 1 lượt = 1.000.000', () => {
    expect(computeQuote(group, { adult: 1, child: 0, senior: 0, infant: 0 })?.total).toBe(1000000)
  })
  it('5 khách VẪN 1 lượt = 1.000.000 (giá nhóm, không nhân đầu người)', () => {
    expect(computeQuote(group, { adult: 5, child: 0, senior: 0, infant: 0 })?.total).toBe(1000000)
  })
  it('6 khách = 2 lượt = 2.000.000 (tiền nhảy bậc)', () => {
    expect(computeQuote(group, { adult: 6, child: 0, senior: 0, infant: 0 })?.total).toBe(2000000)
  })
  it('30 khách = 6 lượt', () => {
    const q = computeQuote(group, { adult: 30, child: 0, senior: 0, infant: 0 })
    expect(q?.total).toBe(6000000)
    expect(q?.lines[0]).toEqual({ code: 'adult', count: 6, amount: 1000000, subtotal: 6000000, unit: 'luot' })
  })
  it('perPax phải RỖNG — không bịa ra một con số "mỗi người"', () => {
    // Đây chính là lỗi đã loại `tiers` vì nó (quote.ts:82 trả perPax:{adult}).
    expect(computeQuote(group, { adult: 3, child: 0, senior: 0, infant: 0 })?.perPax).toEqual({})
  })
  it('0 khách → null', () => {
    expect(computeQuote(group, { adult: 0, child: 0, senior: 0, infant: 0 })).toBeNull()
  })
  it('maxPax <= 0 → null, không chia cho 0', () => {
    expect(computeQuote({ kind: 'group', amount: 1000000, maxPax: 0 }, { adult: 3, child: 0, senior: 0, infant: 0 })).toBeNull()
  })
  it('ưu đãi 5% áp lên GIÁ MỘT LƯỢT rồi mới nhân số lượt', () => {
    // 1.000.000 − 5% = 950.000; 2 lượt = 1.900.000. KHÔNG phải 2.000.000 − 5%.
    const q = computeQuote(group, { adult: 6, child: 0, senior: 0, infant: 0 }, { prepayPercent: 5, prepay: true })
    expect(q?.total).toBe(1900000)
    expect(q?.prepay).toEqual({ percent: 5, totalGoc: 2000000 })
  })
  it('Quote.group mang amount ĐÃ áp ưu đãi + maxPax nguyên trạng, cho buildQuotedPayload dùng lại', () => {
    const q = computeQuote(group, { adult: 6, child: 0, senior: 0, infant: 0 }, { prepayPercent: 5, prepay: true })
    expect(q?.group).toEqual({ amount: 950000, maxPax: 5 })
  })
})

describe('priceTableFromEntry — perGroup', () => {
  it('đọc được dòng perGroup', () => {
    expect(priceTableFromEntry({ unit: 'perGroup', amount: 1000000, maxPax: 5 }))
      .toEqual({ kind: 'group', amount: 1000000, maxPax: 5 })
  })
  it('thiếu maxPax hoặc maxPax <= 0 → null (không đoán)', () => {
    expect(priceTableFromEntry({ unit: 'perGroup', amount: 1000000 })).toBeNull()
    expect(priceTableFromEntry({ unit: 'perGroup', amount: 1000000, maxPax: 0 })).toBeNull()
  })
  it('availablePaxCodes: chỉ một ô đếm', () => {
    expect(availablePaxCodes(group)).toEqual(['adult'])
  })
})
