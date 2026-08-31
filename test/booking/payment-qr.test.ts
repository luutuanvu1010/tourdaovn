import { describe, expect, it } from 'vitest'
import { buildPaymentQr, type Banking } from '../../src/lib/booking/payment-qr'
import { computeQuote, type PriceTable } from '../../src/lib/booking/quote'
import { banking as banking_thuc } from '../../src/site.config'

const banking: Banking = {
  bin: '970407',
  bankName: 'Techcombank',
  accountNumber: '2502503979',
  accountName: 'CONG TY TNHH TOUR DAO',
}
const CODE = 'TD-260831-K7QM'

describe('buildPaymentQr', () => {
  it('trả null khi và chỉ khi không phải chuyển khoản', () => {
    expect(buildPaymentQr(banking, CODE, 1450000, 'onboard')).toBeNull()
    expect(buildPaymentQr(banking, CODE, 1450000, 'transfer')).not.toBeNull()
  })

  it('nội dung chuyển khoản bỏ gạch nối — khách THẤY có gạch, GÕ không gạch', () => {
    const qr = buildPaymentQr(banking, CODE, 1450000, 'transfer')!
    expect(qr.addInfo).toBe('TD260831K7QM')
    expect(qr.addInfo).toMatch(/^[A-Za-z0-9]+$/)
    expect(qr.addInfo.length).toBeLessThanOrEqual(50)
  })

  it('URL đúng khuôn compact2 và mang đủ ba tham số', () => {
    const qr = buildPaymentQr(banking, CODE, 1450000, 'transfer')!
    expect(qr.imageUrl).toBe(
      'https://img.vietqr.io/image/970407-2502503979-compact2.png'
      + '?amount=1450000&addInfo=TD260831K7QM&accountName=CONG%20TY%20TNHH%20TOUR%20DAO',
    )
  })

  it('khoảng trắng mã hoá %20, KHÔNG phải dấu cộng (VietQR không hiểu "+")', () => {
    const qr = buildPaymentQr(banking, CODE, 1450000, 'transfer')!
    expect(qr.imageUrl).toContain('%20')
    expect(qr.imageUrl).not.toContain('+')
  })

  it('số tiền trên QR bằng đúng total truyền vào', () => {
    const qr = buildPaymentQr(banking, CODE, 987000, 'transfer')!
    expect(qr.amount).toBe(987000)
    expect(qr.imageUrl).toContain('amount=987000')
  })

  // SPEC §11.6 — ca này là ca dễ sai nhất và phải có ưu đãi > 0 mới bắt được.
  // Lấy nhầm `prepay.totalGoc` (tổng CHƯA giảm, dành cho nhân viên mặc cả) thì khách
  // chuyển thừa tiền, mà mọi ca không-ưu-đãi vẫn xanh.
  it('với ưu đãi trả trước, QR mang tổng ĐÃ GIẢM chứ không phải totalGoc', () => {
    const table: PriceTable = { kind: 'flat', perPax: { adult: 550000 } }
    const q = computeQuote(table, { adult: 2, child: 0, senior: 0, infant: 0 }, {
      prepayPercent: 5,
      prepay: true,
    })!
    expect(q.prepay?.totalGoc).toBe(1100000)
    expect(q.total).toBe(1046000)

    const qr = buildPaymentQr(banking, CODE, q.total, 'transfer')!
    expect(qr.amount).toBe(1046000)
    expect(qr.imageUrl).toContain('amount=1046000')
    expect(qr.imageUrl).not.toContain('1100000')
  })

  it('không có PII của khách trong URL — chỉ tài khoản công ty, số tiền, mã đơn', () => {
    const qr = buildPaymentQr(banking, CODE, 1450000, 'transfer')!
    for (const pii of ['Nguyen', '090', '@', 'khach']) {
      expect(qr.imageUrl.toLowerCase()).not.toContain(pii.toLowerCase())
    }
  })

  it('cấu hình thật trong site.config đúng hình dạng VietQR', () => {
    expect(banking_thuc.bin).toMatch(/^\d{6}$/)
    expect(banking_thuc.accountNumber).toMatch(/^[0-9a-zA-Z]{1,19}$/)
    expect(banking_thuc.accountName).toMatch(/^[A-Z0-9 ]+$/)
    expect(banking_thuc.bankName.length).toBeGreaterThan(0)
  })
})
