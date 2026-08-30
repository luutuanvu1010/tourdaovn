import { describe, expect, it } from 'vitest'
import { LIMITS, MSG, buildQuotedPayload, normalizePhone, parseBookingPayload, validateBooking, type BookingInput } from '../../src/lib/booking/schema'
import { computeQuote } from '../../src/lib/booking/quote'

const TODAY = '2026-09-01'
function good(over: Partial<BookingInput> = {}): BookingInput {
  return {
    tourSlug: 'tour-3-dao-nha-trang', tourTitle: 'Tour 3 đảo Nha Trang', bookingRef: 'tour-3-dao',
    departDate: '2026-09-05',
    pax: { adult: 2, child: 1, senior: 0, infant: 0 },
    quoted: { perPax: { adult: 550000, child: 350000 }, total: 1450000, quotedAt: '2026-08-21T02:00:00Z' },
    name: 'Nguyễn Văn A', phone: '0905 123 456', email: '', pickup: 'KS Mường Thanh', note: '',
    turnstileToken: 'tok', website: '',
    ...over,
  }
}

describe('normalizePhone', () => {
  it('ba dạng đầu vào về 0905123456', () => {
    expect(normalizePhone('0905 123 456')).toBe('0905123456')
    expect(normalizePhone('+84905123456')).toBe('0905123456')
    expect(normalizePhone('84905123456')).toBe('0905123456')
    expect(normalizePhone('0258.3521.123')).toBe('02583521123')
  })
  it('số ngắn, chữ, rỗng → null', () => {
    expect(normalizePhone('0123')).toBeNull()
    expect(normalizePhone('abc')).toBeNull()
    expect(normalizePhone('')).toBeNull()
  })

  // Bảng ca đầy đủ. Hai hàng đánh dấu ← là lỗ hổng thật: bản cũ cắt `84` rồi LUÔN dán `'0'`,
  // nên khách gõ cả `+84` lẫn số `0` đầu ra `00905123456` — vẫn khớp `/^0\d{9,10}$/` nên lọt
  // cổng, và nhân viên nhận một số KHÔNG gọi được. SĐT là kênh liên lạc bắt buộc duy nhất.
  const CASES: Array<[string, string | null]> = [
    ['0905123456', '0905123456'],
    ['+84905123456', '0905123456'],
    ['84905123456', '0905123456'],
    ['+84 905 123 456', '0905123456'],
    ['+84 0905 123 456', '0905123456'], // ← ca đang hỏng
    ['84 0905 123 456', '0905123456'],  // ← cùng gốc
    ['(090) 512-3456', '0905123456'],
    ['0905 123 456', '0905123456'],
    ['0084905123456', null],
    ['8484905123456', null],
    ['090512345', null],
  ]
  it.each(CASES)('%s → %s', (raw, want) => {
    expect(normalizePhone(raw)).toBe(want)
  })
})

describe('validateBooking', () => {
  it('đơn hợp lệ → ok, phone chuẩn hoá, email rỗng → null', () => {
    const r = validateBooking(good(), TODAY)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.phone).toBe('0905123456')
      expect(r.value.email).toBeNull()
      expect(r.value.name).toBe('Nguyễn Văn A')
    }
  })
  it('ngày hôm nay → lỗi departDate; +366 → lỗi; ngày ảo → lỗi', () => {
    for (const d of ['2026-09-01', '2027-09-02', '2026-02-30']) {
      const r = validateBooking(good({ departDate: d }), TODAY)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.fields.departDate).toBeTruthy()
    }
    expect(validateBooking(good({ departDate: '2026-09-02' }), TODAY).ok).toBe(true)
    expect(validateBooking(good({ departDate: '2027-09-01', quoted: { perPax: { adult: 550000, child: 350000 }, total: 1450000, quotedAt: 'x' } }), TODAY).ok).toBe(true)
  })
  it('adult 0 → lỗi; tổng 31 → lỗi; 21 một hạng → lỗi', () => {
    const r1 = validateBooking(good({ pax: { adult: 0, child: 1, senior: 0, infant: 0 }, quoted: { perPax: { child: 350000 }, total: 350000, quotedAt: 'x' } }), TODAY)
    expect(r1.ok).toBe(false); if (!r1.ok) expect(r1.fields['pax.adult']).toBe(MSG.adultMin)
    const r2 = validateBooking(good({ pax: { adult: 20, child: 11, senior: 0, infant: 0 }, quoted: { perPax: { adult: 1, child: 1 }, total: 31, quotedAt: 'x' } }), TODAY)
    expect(r2.ok).toBe(false); if (!r2.ok) expect(r2.fields.pax).toBe(MSG.totalMax)
    const r3 = validateBooking(good({ pax: { adult: 21, child: 0, senior: 0, infant: 0 }, quoted: { perPax: { adult: 1 }, total: 21, quotedAt: 'x' } }), TODAY)
    expect(r3.ok).toBe(false); if (!r3.ok) expect(r3.fields['pax.adult']).toBe(MSG.perTypeMax)
  })
  it('total lệch với Σ count×perPax → lỗi quoted', () => {
    const r = validateBooking(good({ quoted: { perPax: { adult: 550000, child: 350000 }, total: 1000, quotedAt: 'x' } }), TODAY)
    expect(r.ok).toBe(false); if (!r.ok) expect(r.fields.quoted).toBe(MSG.quotedMismatch)
  })
  it('thiếu SĐT / tên 1 ký tự / email sai → từng lỗi đúng ô', () => {
    const r = validateBooking(good({ phone: '', name: 'A', email: 'khong-phai-email' }), TODAY)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.fields.phone).toBe(MSG.phoneRequired)
      expect(r.fields.name).toBe(MSG.nameShort)
      expect(r.fields.email).toBe(MSG.emailInvalid)
      expect(r.message).toBe(MSG.formInvalid)
    }
  })
  it('slug lạ, title quá dài, note quá dài → lỗi đúng ô', () => {
    const rSlug = validateBooking(good({ tourSlug: '../x' }), TODAY)
    expect(rSlug.ok).toBe(false); if (!rSlug.ok) expect(rSlug.fields.tour).toBe(MSG.tourInvalid)
    const rTitle = validateBooking(good({ tourTitle: 'x'.repeat(LIMITS.TITLE_MAX + 1) }), TODAY)
    expect(rTitle.ok).toBe(false); if (!rTitle.ok) expect(rTitle.fields.tour).toBe(MSG.tourInvalid)
    const rNote = validateBooking(good({ note: 'x'.repeat(LIMITS.NOTE_MAX + 1) }), TODAY)
    expect(rNote.ok).toBe(false); if (!rNote.ok) expect(rNote.fields.note).toBe(MSG.noteLong)
  })
  it('quoted.perPax thiếu giá cho hạng đang có người → lỗi quoted; giá 0 khai tường minh vẫn hợp lệ', () => {
    const rMissing = validateBooking(good({
      pax: { adult: 2, child: 0, senior: 0, infant: 0 },
      quoted: { perPax: {}, total: 0, quotedAt: 'x' },
    }), TODAY)
    expect(rMissing.ok).toBe(false)
    if (!rMissing.ok) expect(rMissing.fields.quoted).toBe(MSG.quotedMismatch)

    const rFree = validateBooking(good({
      pax: { adult: 2, child: 0, senior: 0, infant: 0 },
      quoted: { perPax: { adult: 0 }, total: 0, quotedAt: 'x' },
    }), TODAY)
    expect(rFree.ok).toBe(true)
  })
})

describe('parseBookingPayload', () => {
  it('đọc object phẳng từ form (pax.adult, quoted.total) thành BookingInput', () => {
    const p = parseBookingPayload({
      tourSlug: 't', tourTitle: 'T', bookingRef: 'r', departDate: '2026-09-05',
      'pax.adult': '2', 'pax.child': '1', 'quoted.perPax.adult': '550000', 'quoted.perPax.child': '350000',
      'quoted.total': '1450000', 'quoted.quotedAt': 'x', name: 'A B', phone: '0905123456',
    })
    expect(p.pax).toEqual({ adult: 2, child: 1, senior: 0, infant: 0 })
    expect(p.quoted).toEqual({ perPax: { adult: 550000, child: 350000 }, total: 1450000, quotedAt: 'x' })
    expect(p.email).toBe('')
    expect(p.website).toBe('')
  })
  it('đọc JSON lồng nhau, ép kiểu chuỗi/số, bỏ khoá lạ', () => {
    const p = parseBookingPayload({ tourSlug: 't', pax: { adult: '3', child: 'x' }, quoted: { perPax: { adult: 1 }, total: '3' }, name: 5, extra: 1 } as any)
    expect(p.pax).toEqual({ adult: 3, child: 0, senior: 0, infant: 0 })
    expect(p.quoted.total).toBe(3)
    expect(p.name).toBe('5')
    expect((p as any).extra).toBeUndefined()
  })

  // Task 6 — mùa đã áp (Task 2: computeQuote trả Quote.season) đi theo `quoted` để đơn ghi lại
  // vì sao ra con số này. Server không tin và không tính lại theo mùa (BK1) — chỉ làm sạch.
  it('nhận quoted.season và giữ nguyên khi hợp lệ', () => {
    const p = parseBookingPayload({
      tourSlug: 'x', tourTitle: 'X', bookingRef: 'x', departDate: '2027-04-30',
      pax: { adult: 1 },
      quoted: { perPax: { adult: 962000 }, total: 962000, quotedAt: '2027-01-01T00:00:00.000Z', season: { name: 'Lễ 30/4', percent: 30 } },
      name: 'A', phone: '0905123456',
    })
    expect(p.quoted.season).toEqual({ name: 'Lễ 30/4', percent: 30 })
  })

  it('season rác (không phải object) thì bỏ, không ném', () => {
    const p = parseBookingPayload({
      tourSlug: 'x', tourTitle: 'X', bookingRef: 'x', departDate: '2027-04-30',
      pax: { adult: 1 },
      quoted: { perPax: { adult: 1 }, total: 1, quotedAt: '2027-01-01T00:00:00.000Z', season: 'không phải object' },
      name: 'A', phone: '0905123456',
    })
    expect(p.quoted.season).toBeUndefined()
  })

  it('season thiếu percent hoặc name sai kiểu thì bỏ', () => {
    expect(parseBookingPayload({ quoted: { season: { name: 'X' } } }).quoted.season).toBeUndefined()
    expect(parseBookingPayload({ quoted: { season: { name: 1, percent: 10 } } }).quoted.season).toBeUndefined()
    expect(parseBookingPayload({ quoted: {} }).quoted.season).toBeUndefined()
  })

  it('tên mùa lọc ký tự điều khiển và cắt còn 60 ký tự', () => {
    const p = parseBookingPayload({ quoted: { season: { name: 'A\n'.repeat(40), percent: 10 } } })
    expect(p.quoted.season?.name.length).toBeLessThanOrEqual(60)
    expect(p.quoted.season?.name).not.toMatch(/[\u0000-\u001F\u007F]/)
  })
})

// Lỗi chặn gộp đã sửa: BookingForm.astro dựng `quoted` gửi lên bằng object literal tay —
// `{ perPax: quote.perPax, total: quote.total, quotedAt }` — bỏ sót `quote.season`. Sáu ca ở
// trên (và ở notify.test.ts) đều TỰ DỰNG SẴN một `quoted` đã có `season` rồi mới đưa vào hàm,
// nên chúng xanh dù trình duyệt không hề gửi mùa lên máy chủ. Ca dưới đây đi qua đúng ranh giới
// đó: gọi `computeQuote()` THẬT (không tự bịa season) rồi đưa kết quả qua `buildQuotedPayload` —
// đúng và DUY NHẤT hàm mà script trong BookingForm.astro gọi để dựng `quoted` trước khi
// `JSON.stringify` và `fetch`. Vì script không còn logic nào khác quyết định hình dạng `quoted`,
// phá `buildQuotedPayload` (bỏ nhánh spread `season`) tương đương phá đúng dòng đã gây lỗi —
// ca này sẽ đỏ ngay, khác với sáu ca cũ.
describe('buildQuotedPayload — dữ liệu do trình duyệt dựng có mang mùa', () => {
  it('computeQuote → buildQuotedPayload → parseBookingPayload (qua JSON như fetch thật) giữ được season', () => {
    const seasons = [{ name: 'Lễ 30/4', from: '2027-04-28', to: '2027-05-03', percent: 30 }]
    const quote = computeQuote({ kind: 'flat', perPax: { adult: 740000 } }, { adult: 1, child: 0, senior: 0, infant: 0 }, { seasons, departDate: '2027-04-30' })
    expect(quote?.season).toEqual({ name: 'Lễ 30/4', percent: 30 }) // computeQuote thật, không tự bịa

    const quoted = buildQuotedPayload(quote!, '2027-01-01T00:00:00.000Z')
    expect(quoted.season).toEqual({ name: 'Lễ 30/4', percent: 30 })

    // JSON.parse(JSON.stringify(...)) mô phỏng đúng vòng fetch() của form: client stringify,
    // handler parse rồi đưa qua parseBookingPayload — chỗ server đọc quoted.season từ payload thô.
    const wire = JSON.parse(JSON.stringify({ quoted }))
    expect(parseBookingPayload(wire).quoted.season).toEqual({ name: 'Lễ 30/4', percent: 30 })
  })

  it('không rơi vào mùa nào thì quoted không có khoá season — giữ nguyên hình dạng payload cũ', () => {
    const quote = computeQuote({ kind: 'flat', perPax: { adult: 740000 } }, { adult: 1, child: 0, senior: 0, infant: 0 })
    const quoted = buildQuotedPayload(quote!, '2027-01-01T00:00:00.000Z')
    expect('season' in quoted).toBe(false)
  })
})

// Vòng review toàn nhánh 2026-08-23 — mục 6 và 7.
describe('lọc ký tự điều khiển, chặn trên cho quotedAt, email có <>', () => {
  it('CR/LF/TAB và ký tự điều khiển trong tourTitle/name/pickup/note → thành khoảng trắng', () => {
    // Vì sao quan trọng: `note`/`name` có xuống dòng GIẢ MẠO được dòng trong thân thư văn bản
    // thuần và tin Zalo — một `note` chứa xuống dòng rồi "SĐT: 0999999999" trông y hệt một
    // trường thật với nhân viên đang đọc. `tourTitle` thì đi thẳng vào tiêu đề thư SES
    // (`notify/format.ts:17`), ký tự điều khiển ở đó dễ làm SES trả 400 và MẤT LUÔN thư báo.
    const p = parseBookingPayload({
      tourTitle: 'Tour\r\n3 đảo',
      name: 'Nguyễn Văn A\nSĐT: 0999999999',
      pickup: 'KS\tMường Thanh',
      note: 'ghi chú\u0000cuối',
    })
    expect(p.tourTitle).toBe('Tour  3 đảo')
    expect(p.name).toBe('Nguyễn Văn A SĐT: 0999999999')
    expect(p.pickup).toBe('KS Mường Thanh')
    expect(p.note).toBe('ghi chú cuối')
    for (const v of [p.tourTitle, p.name, p.pickup, p.note]) expect(v).not.toMatch(/[\u0000-\u001F\u007F]/)
  })

  it('ký tự điều khiển ở hai rìa không để lại khoảng trắng thừa (thay rồi mới trim)', () => {
    const p = parseBookingPayload({ tourTitle: '\r\n Tour 3 đảo \n', name: 'A B', pickup: '\n', note: '\r\n' })
    expect(p.tourTitle).toBe('Tour 3 đảo')
    expect(p.name).toBe('A B')
    expect(p.pickup).toBe('')
    expect(p.note).toBe('')
  })

  it('quotedAt cắt còn 40 ký tự — trường duy nhất trước đây không có chặn trên', () => {
    const p = parseBookingPayload({ quoted: { quotedAt: 'x'.repeat(15_000) } })
    expect(p.quoted.quotedAt.length).toBe(40)
    const ok = parseBookingPayload({ quoted: { quotedAt: '2026-08-21T02:00:00Z' } })
    expect(ok.quoted.quotedAt).toBe('2026-08-21T02:00:00Z')
  })

  it('email chứa < hoặc > → lỗi email (lọt xuống ReplyToAddresses thì SES trả 400, mất thư báo)', () => {
    const r1 = validateBooking(good({ email: 'a<b@c.dd' }), TODAY)
    expect(r1.ok).toBe(false)
    expect((r1 as { fields: Record<string, string> }).fields.email).toBe(MSG.emailInvalid)
    const r2 = validateBooking(good({ email: 'a@b.cc>' }), TODAY)
    expect(r2.ok).toBe(false)
    expect((r2 as { fields: Record<string, string> }).fields.email).toBe(MSG.emailInvalid)
    // Email thường vẫn qua — không siết nhầm sang chối bỏ địa chỉ hợp lệ.
    expect(validateBooking(good({ email: 'khach.hang+dat@gmail.com' }), TODAY).ok).toBe(true)
  })
})

describe('paymentMethod và luật chéo với quoted.prepay', () => {
  const HOM_NAY = '2026-09-01'
  function payload(over: Record<string, unknown> = {}) {
    return {
      tourSlug: 'tour-3-dao', tourTitle: 'Tour 3 đảo', bookingRef: 'tour-3-dao',
      departDate: '2026-09-05', pax: { adult: 1, child: 0, senior: 0, infant: 0 },
      quoted: { perPax: { adult: 409000 }, total: 409000, quotedAt: '2026-08-30T02:00:00Z' },
      name: 'Nguyễn Văn A', phone: '0905123456', email: '', pickup: '', note: '',
      turnstileToken: 't', website: '', ...over,
    }
  }

  it('vắng paymentMethod → onboard, đơn vẫn hợp lệ (công tắc đang tắt)', () => {
    const r = validateBooking(parseBookingPayload(payload()), HOM_NAY)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.paymentMethod).toBe('onboard')
  })

  it('giá trị lạ → onboard, không ném', () => {
    const p = parseBookingPayload(payload({ paymentMethod: 'bitcoin' }))
    expect(p.paymentMethod).toBe('onboard')
  })

  it('transfer + prepay hợp lệ → nhận', () => {
    const r = validateBooking(parseBookingPayload(payload({
      paymentMethod: 'transfer',
      quoted: { perPax: { adult: 409000 }, total: 409000, quotedAt: 'x', prepay: { percent: 5, totalGoc: 430000 } },
    })), HOM_NAY)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.quoted.prepay).toEqual({ percent: 5, totalGoc: 430000 })
  })

  it('onboard mà vẫn mang giá đã giảm → 400', () => {
    const r = validateBooking(parseBookingPayload(payload({
      paymentMethod: 'onboard',
      quoted: { perPax: { adult: 409000 }, total: 409000, quotedAt: 'x', prepay: { percent: 5, totalGoc: 430000 } },
    })), HOM_NAY)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fields.quoted).toBe(MSG.quotedMismatch)
  })

  it('transfer mà không có prepay → 400', () => {
    const r = validateBooking(parseBookingPayload(payload({ paymentMethod: 'transfer' })), HOM_NAY)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fields.quoted).toBe(MSG.quotedMismatch)
  })

  it('totalGoc nhỏ hơn total → 400 (ưu đãi không thể làm giá TĂNG)', () => {
    const r = validateBooking(parseBookingPayload(payload({
      paymentMethod: 'transfer',
      quoted: { perPax: { adult: 409000 }, total: 409000, quotedAt: 'x', prepay: { percent: 5, totalGoc: 400000 } },
    })), HOM_NAY)
    expect(r.ok).toBe(false)
  })

  it('prepay sai hình dạng thì BỎ khoá — rồi luật chéo bắt được vì paymentMethod là transfer', () => {
    const p = parseBookingPayload(payload({
      paymentMethod: 'transfer',
      quoted: { perPax: { adult: 409000 }, total: 409000, quotedAt: 'x', prepay: { percent: 'năm phần trăm' } },
    }))
    expect(p.quoted.prepay).toBeUndefined()
    expect(validateBooking(p, HOM_NAY).ok).toBe(false)
  })

  it('buildQuotedPayload mang theo prepay', () => {
    const q = { perPax: { adult: 409000 }, total: 409000, prepay: { percent: 5, totalGoc: 430000 } }
    expect(buildQuotedPayload(q, 'x').prepay).toEqual({ percent: 5, totalGoc: 430000 })
    expect(buildQuotedPayload({ perPax: { adult: 1 }, total: 1 }, 'x')).not.toHaveProperty('prepay')
  })
})
