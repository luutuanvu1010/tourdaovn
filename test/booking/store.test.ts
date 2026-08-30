import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { countRecentByIp, findRecentDuplicate, getBookingByCode, insertBooking, isUniqueViolation, updateNotifyStatus, type NewBooking } from '../../src/lib/booking/store'

function nb(over: Partial<NewBooking> = {}): NewBooking {
  return {
    code: 'TD-260905-AAAA', createdAt: '2026-09-01T03:00:00.000Z', tourSlug: 'tour-3-dao', tourTitle: 'Tour 3 đảo',
    bookingRef: 'tour-3-dao', departDate: '2026-09-05', pax: { adult: 2, child: 1, senior: 0, infant: 0 },
    quoted: { perPax: { adult: 550000, child: 350000 }, total: 1450000, quotedAt: '2026-08-21T02:00:00Z' },
    customerName: 'Nguyễn Văn A', phone: '0905123456', email: null, pickup: 'KS Mường Thanh', note: null,
    lang: 'vi', source: 'web', paymentMethod: 'onboard', ipHash: 'h1', userAgent: 'vitest', ...over,
  }
}

// Lệch so với brief (ghi rõ, không im lặng sửa): bản @cloudflare/vitest-pool-workers@0.22.0
// cài trong repo này KHÔNG có isolatedStorage per-test — WorkersPoolOptionsSchema (dist/pool/
// index.d.mts) không có trường này, và thực nghiệm xác nhận: một `it()` insert xong, `it()`
// sau trong CÙNG file vẫn thấy hàng đó (state không bị rollback giữa các test). Vì vậy mỗi
// test dưới đây tự mang `code`/`phone`/`ipHash` riêng thay vì dùng chung mặc định của `nb()`
// khi giá trị đó cũng là mặc định mà test khác dùng — để mỗi test độc lập với thứ tự chạy và
// dữ liệu còn sót lại trong bảng, không phụ thuộc giả định isolatedStorage không có thật.
// Không đổi vitest.config.ts / test/setup/ (bị cấm); không đổi ý định hay assertion của ca
// test nào — chỉ đổi giá trị khoá để tránh đụng nhau.

describe('store', () => {
  it('insert rồi đọc lại đủ cột; pax/quoted là JSON', async () => {
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-C1AA' }))
    const row = await getBookingByCode(env.BOOKING_DB, 'TD-260905-C1AA')
    expect(row?.customer_name).toBe('Nguyễn Văn A')
    expect(row?.status).toBe('new')
    expect(JSON.parse(row!.pax_json)).toEqual({ adult: 2, child: 1, senior: 0, infant: 0 })
    expect(JSON.parse(row!.quoted_json).total).toBe(1450000)
    expect(row?.notify_email).toBeNull()
  })
  it('trùng code → ném lỗi nhận diện được', async () => {
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-C2AA' }))
    let caught: unknown
    try { await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-C2AA', phone: '0905000000' })) } catch (e) { caught = e }
    expect(caught).toBeTruthy()
    expect(isUniqueViolation(caught)).toBe(true)
  })
  it('findRecentDuplicate theo phone+tour+ngày trong cửa sổ', async () => {
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-C3AA', phone: '0905300001' }))
    expect(await findRecentDuplicate(env.BOOKING_DB, '0905300001', 'tour-3-dao', '2026-09-05', '2026-09-01T00:00:00.000Z')).toBe('TD-260905-C3AA')
    expect(await findRecentDuplicate(env.BOOKING_DB, '0905300001', 'tour-3-dao', '2026-09-06', '2026-09-01T00:00:00.000Z')).toBeNull()
    expect(await findRecentDuplicate(env.BOOKING_DB, '0905300001', 'tour-3-dao', '2026-09-05', '2026-09-01T04:00:00.000Z')).toBeNull()
  })
  it('countRecentByIp đếm đúng cửa sổ', async () => {
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-AAAB', createdAt: '2026-09-01T03:00:00.000Z', ipHash: 'ipc-1' }))
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-AAAC', createdAt: '2026-09-01T03:05:00.000Z', ipHash: 'ipc-1' }))
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-AAAD', createdAt: '2026-09-01T02:00:00.000Z', ipHash: 'ipc-1' }))
    expect(await countRecentByIp(env.BOOKING_DB, 'ipc-1', '2026-09-01T02:55:00.000Z')).toBe(2)
    expect(await countRecentByIp(env.BOOKING_DB, 'ipc-2', '2026-09-01T00:00:00.000Z')).toBe(0)
  })
  it('updateNotifyStatus ghi từng kênh', async () => {
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-C5AA' }))
    await updateNotifyStatus(env.BOOKING_DB, 'TD-260905-C5AA', { email: 'sent', zalo: 'failed:http 500' })
    const row = await getBookingByCode(env.BOOKING_DB, 'TD-260905-C5AA')
    expect(row?.notify_email).toBe('sent')
    expect(row?.notify_zalo).toBe('failed:http 500')
  })
  it('ghi và đọc lại paymentMethod', async () => {
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-PAY1', phone: '0905000111', paymentMethod: 'transfer' }))
    const row = await getBookingByCode(env.BOOKING_DB, 'TD-260905-PAY1')
    expect(row?.payment_method).toBe('transfer')
  })
  it('đơn không khai hình thức → onboard', async () => {
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-PAY2', phone: '0905000222' }))
    const row = await getBookingByCode(env.BOOKING_DB, 'TD-260905-PAY2')
    expect(row?.payment_method).toBe('onboard')
  })
})
