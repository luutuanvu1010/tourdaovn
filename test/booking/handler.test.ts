import { env } from 'cloudflare:test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RATE_MAX, handleBooking, type BookingEnv } from '../../src/lib/booking/handler'
import { getBookingByCode } from '../../src/lib/booking/store'
import { MSG } from '../../src/lib/booking/schema'

const NOW = new Date('2026-09-01T03:00:00.000Z')
const TOK = 'ok-token'

function payload(over: Record<string, unknown> = {}) {
  return {
    tourSlug: 'tour-3-dao-nha-trang', tourTitle: 'Tour 3 đảo Nha Trang', bookingRef: 'tour-3-dao',
    departDate: '2026-09-05', pax: { adult: 2, child: 1, senior: 0, infant: 0 },
    quoted: { perPax: { adult: 550000, child: 350000 }, total: 1450000, quotedAt: '2026-08-21T02:00:00Z' },
    name: 'Nguyễn Văn A', phone: '0905 123 456', email: '', pickup: '', note: '', turnstileToken: TOK, website: '',
    ...over,
  }
}

/** fetch giả: Turnstile theo token, SES/Zalo ghi lại lời gọi. */
function fakeFetch(opts: { sesStatus?: number; zaloThrows?: boolean } = {}) {
  const calls: { url: string; body: any }[] = []
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : {}
    calls.push({ url, body })
    if (url.includes('turnstile')) return new Response(JSON.stringify({ success: body.response === TOK, 'error-codes': ['invalid-input-response'] }))
    if (url.includes('amazonaws.com')) return new Response('{}', { status: opts.sesStatus ?? 200 })
    if (url.includes('zaloplatforms')) { if (opts.zaloThrows) throw new Error('zalo down'); return new Response(JSON.stringify({ ok: true })) }
    return new Response('not found', { status: 404 })
  }) as unknown as typeof fetch
  return { f, calls }
}

function mkEnv(over: Partial<BookingEnv> = {}): BookingEnv {
  // IP_HASH_SALT: thêm ở review Task 8 (F4) — handler nay đòi muối RIÊNG cho ip_hash, không
  // còn tụt về hằng số 'dev' khi thiếu. Không đặt thì ca "tần suất" bên dưới sẽ không còn ai
  // đếm được (ipHash luôn null), phá vỡ khẳng định 429.
  return { BOOKING_DB: env.BOOKING_DB, TURNSTILE_SECRET_KEY: 'secret', AWS_ACCESS_KEY_ID: 'AKIDEXAMPLE', AWS_SECRET_ACCESS_KEY: 'sekret', AWS_SES_REGION: 'ap-southeast-1', BOOKING_NOTIFY_EMAIL: 'ops@tourdao.vn', ZALO_BOT_TOKEN: 'zt', ZALO_BOT_CHAT_IDS: '111', IP_HASH_SALT: 'test-salt', ...over }
}

function mkCtx() {
  const tasks: Promise<unknown>[] = []
  return { ctx: { waitUntil: (p: Promise<unknown>) => { tasks.push(p) } }, flush: () => Promise.allSettled(tasks) }
}

function req(body: unknown, h: Record<string, string> = {}, opts: { form?: boolean; method?: string } = {}) {
  const headers: Record<string, string> = { 'Content-Type': opts.form ? 'application/x-www-form-urlencoded' : 'application/json', Accept: 'application/json', 'CF-Connecting-IP': '1.2.3.4', Origin: 'https://tourdao.vn', ...h }
  const b = opts.form ? new URLSearchParams(body as Record<string, string>).toString() : JSON.stringify(body)
  return new Request('https://tourdao.vn/api/dat-tour', { method: opts.method ?? 'POST', headers, body: opts.method === 'GET' ? undefined : b })
}

describe('handleBooking', () => {
  // Lệch so với brief (ghi rõ, không im lặng sửa): bản @cloudflare/vitest-pool-workers@0.22.0
  // cài trong repo này KHÔNG cô lập D1 theo từng it() trong cùng file — trạng thái dính giữa
  // các ca (đã xác nhận thực nghiệm ở Task 6). Ghi chú ngược lại ở test/setup/apply-migrations.ts
  // ("isolatedStorage mặc định") là sai.
  // M13 (review Task 8, sửa chú thích cho đúng — bản trước dẫn nhầm): Task 6 GẶP đúng vấn đề
  // này ở test/booking/store.test.ts nhưng giải bằng cách KHÁC — đặt code/phone/ipHash RIÊNG
  // cho từng ca, KHÔNG có beforeEach/DELETE ở đó. Ở đây không dùng cách đó vì nhiều ca dưới
  // đây CỐ Ý dùng lại đúng phone/tourSlug/departDate/IP mặc định giống ca khác (đề bài yêu cầu
  // dùng nguyên văn payload()/req() mặc định) — ví dụ ca trùng đơn cần hai lần gọi cùng
  // phone+tour+ngày, ca tần suất cần cùng một IP xuyên suốt 6 lần gọi trong chính nó. Nếu
  // không dọn bảng, dữ liệu insert ở ca trước sẽ làm sai số đếm/đối chiếu trùng của ca sau.
  // Chọn dọn bảng `booking` trước MỖI ca (thay vì đổi phone/tourSlug/IP của từng ca như Task 6)
  // vì cách này không đụng tới bất kỳ giá trị hay khẳng định nào trong đoạn test cho sẵn — chỉ
  // thêm một beforeEach bao ngoài. Không đổi vitest.config.ts / test/setup/ (bị cấm sửa).
  beforeEach(async () => {
    await env.BOOKING_DB.prepare('DELETE FROM booking').run()
  })

  it('đơn hợp lệ → 201, mã đúng định dạng, D1 có dòng, báo tin cả hai kênh = sent', async () => {
    const { f, calls } = fakeFetch(); const { ctx, flush } = mkCtx()
    const res = await handleBooking(req(payload()), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(201)
    const j = await res.json() as any
    expect(j.ok).toBe(true)
    expect(j.code).toMatch(/^TD-260901-[A-Z2-9]{4}$/)
    expect(j.summary.total).toBe(1450000)
    await flush()
    const row = await getBookingByCode(env.BOOKING_DB, j.code)
    expect(row?.phone).toBe('0905123456')
    expect(row?.notify_email).toBe('sent')
    expect(row?.notify_zalo).toBe('sent')
    expect(calls.map(c => c.url)).toEqual(expect.arrayContaining([expect.stringContaining('turnstile'), 'https://email.ap-southeast-1.amazonaws.com/v2/email/outbound-emails', expect.stringContaining('/botzt/sendMessage')]))
    const ses = calls.find(c => c.url.includes('amazonaws.com'))!
    expect(ses.body.Destination.ToAddresses).toEqual(['ops@tourdao.vn'])
    expect(ses.body.FromEmailAddress).toContain('@tourdao.vn')
  })

  // Fix round 1 (Finding 1): trước ca này, không test nào trong repo đi hết đường
  // v.paymentMethod (BookingValid, Task 2) → record.paymentMethod (handler.ts:216) → cột
  // payment_method (D1). store.test.ts gọi thẳng insertBooking, không qua handler; notify.test.ts
  // không gọi handleBooking; các ca payload() sẵn có ở đây không khai paymentMethod. Hạ cứng
  // handler.ts:216 thành 'onboard' vẫn xanh hết — đúng lỗ hổng task này phải bịt.
  // paymentMethod: 'transfer' PHẢI đi kèm quoted.prepay hợp lệ — luật chéo ADR-0031 §5
  // (validateBooking, schema.ts) từ chối 'transfer' không có prepay bằng 400 quotedMismatch;
  // thiếu prepay thì ca này sẽ 400 chứ không phải 201, và chứng minh điều ngược lại ý định.
  it('paymentMethod=transfer (kèm prepay hợp lệ) đi hết đường tới D1', async () => {
    const { f } = fakeFetch(); const { ctx, flush } = mkCtx()
    const body = payload({
      paymentMethod: 'transfer',
      quoted: { perPax: { adult: 550000, child: 350000 }, total: 1450000, quotedAt: '2026-08-21T02:00:00Z', prepay: { percent: 10, totalGoc: 1450000 } },
    })
    const res = await handleBooking(req(body), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(201)
    const j = await res.json() as any
    expect(j.ok).toBe(true)
    await flush()
    const row = await getBookingByCode(env.BOOKING_DB, j.code)
    expect(row?.payment_method).toBe('transfer')
  })

  it('honeypot có chữ → 200 mã giả, KHÔNG lưu, KHÔNG báo', async () => {
    const { f, calls } = fakeFetch(); const { ctx, flush } = mkCtx()
    const res = await handleBooking(req(payload({ website: 'http://spam' })), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(200)
    const j = await res.json() as any
    expect(j.ok).toBe(true)
    await flush()
    // F5 (review Task 8): tra theo j.code (mã GIẢ, chưa chắc trùng mã thật lỡ được lưu) không
    // thể đỏ nếu handler lỡ lưu dưới một mã khác — đếm cả bảng mới thật sự khẳng định "không lưu".
    const n = await env.BOOKING_DB.prepare('SELECT COUNT(*) AS n FROM booking').first<{ n: number }>()
    expect(Number(n?.n)).toBe(0)
    expect(calls.length).toBe(0)
  })

  it('Turnstile không đạt → 400 error turnstile', async () => {
    const { f } = fakeFetch(); const { ctx } = mkCtx()
    const res = await handleBooking(req(payload({ turnstileToken: 'bad' })), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(400)
    const j = await res.json() as any
    expect(j.error).toBe('turnstile'); expect(j.message).toBe(MSG.turnstileFailed)
  })

  it('thiếu SĐT → 400 validation kèm fields.phone; không lưu', async () => {
    const { f } = fakeFetch(); const { ctx } = mkCtx()
    const res = await handleBooking(req(payload({ phone: '' })), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(400)
    const j = await res.json() as any
    expect(j.error).toBe('validation'); expect(j.fields.phone).toBe(MSG.phoneRequired)
    expect(f).not.toHaveBeenCalled() // kiểm đầu vào trước khi tốn một lời gọi Turnstile
  })

  it(`${RATE_MAX} đơn/10 phút cùng IP → đơn thứ ${RATE_MAX + 1} nhận 429`, async () => {
    const { f } = fakeFetch(); const { ctx, flush } = mkCtx()
    for (let i = 0; i < RATE_MAX; i++) {
      const r = await handleBooking(req(payload({ phone: `090500000${i}` })), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
      expect(r.status).toBe(201)
    }
    const r6 = await handleBooking(req(payload({ phone: '0905999999' })), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(r6.status).toBe(429)
    expect(((await r6.json()) as any).message).toBe(MSG.rateLimited)
    // M11 (review Task 8): 5 đơn thành công ở trên đều lên lịch báo tin qua ctx.waitUntil —
    // đợi cho xong trước khi ca kết thúc, tránh promise trôi qua ranh giới sang ca sau.
    await flush()
  })

  it('trùng phone+tour+ngày trong 24h → 200 duplicate, trả mã cũ, không thêm dòng', async () => {
    const { f, calls } = fakeFetch(); const { ctx, flush } = mkCtx()
    const r1 = await handleBooking(req(payload()), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    const code1 = ((await r1.json()) as any).code
    await flush(); const before = calls.length
    const r2 = await handleBooking(req(payload({ name: 'Người khác' })), mkEnv(), ctx, { fetchImpl: f, now: () => new Date(NOW.getTime() + 60_000) })
    expect(r2.status).toBe(200)
    const j2 = await r2.json() as any
    expect(j2.duplicate).toBe(true); expect(j2.code).toBe(code1)
    await flush()
    expect(calls.length - before).toBe(1) // chỉ thêm đúng lời gọi Turnstile, không báo tin lại
    const n = await env.BOOKING_DB.prepare('SELECT COUNT(*) AS n FROM booking').first<{ n: number }>()
    expect(Number(n?.n)).toBe(1)
  })

  it('notifier hỏng → vẫn 201; cột notify ghi failed', async () => {
    const { f } = fakeFetch({ sesStatus: 500, zaloThrows: true }); const { ctx, flush } = mkCtx()
    const res = await handleBooking(req(payload()), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(201)
    const code = ((await res.json()) as any).code
    await flush()
    const row = await getBookingByCode(env.BOOKING_DB, code)
    expect(row?.notify_email).toBe('failed:http 500')
    expect(row?.notify_zalo).toMatch(/^failed:/)
  })

  it('thiếu secret/khoá (dev, CÓ cờ BOOKING_ALLOW_NO_TURNSTILE) → Turnstile bỏ qua, notifier skipped', async () => {
    const { f } = fakeFetch(); const { ctx, flush } = mkCtx()
    const res = await handleBooking(req(payload({ turnstileToken: '' })), { BOOKING_DB: env.BOOKING_DB, BOOKING_ALLOW_NO_TURNSTILE: '1' }, ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(201)
    await flush()
    const row = await getBookingByCode(env.BOOKING_DB, ((await res.clone().json()) as any).code)
    expect(row?.notify_email).toBe('skipped'); expect(row?.notify_zalo).toBe('skipped')
  })

  // Cổng cấu hình (vòng review toàn nhánh 2026-08-23): thiếu TURNSTILE_SECRET_KEY thì endpoint
  // TỪ CHỐI nhận đơn thay vì lặng lẽ tụt xuống chế độ không có lớp chặn nào (SPEC §4.7 "hỏng ồn
  // ào, không hỏng câm"); cửa thoát cho dev là biến BOOKING_ALLOW_NO_TURNSTILE='1' (SPEC §4.4
  // "bỏ qua kiểm (chỉ dev)").
  it('thiếu TURNSTILE_SECRET_KEY và KHÔNG có cờ dev → 503, không lưu, không gọi mạng', async () => {
    const { f } = fakeFetch(); const { ctx } = mkCtx()
    const res = await handleBooking(req(payload()), { BOOKING_DB: env.BOOKING_DB }, ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(503)
    expect(((await res.json()) as any).message).toBe(MSG.serverError)
    expect(f).not.toHaveBeenCalled()
    const n = await env.BOOKING_DB.prepare('SELECT COUNT(*) AS n FROM booking').first<{ n: number }>()
    expect(Number(n?.n)).toBe(0)
  })

  it('thiếu TURNSTILE_SECRET_KEY nhưng cờ dev = "1" → đi tiếp như cũ (201)', async () => {
    const { f } = fakeFetch(); const { ctx, flush } = mkCtx()
    const res = await handleBooking(req(payload()), mkEnv({ TURNSTILE_SECRET_KEY: undefined, BOOKING_ALLOW_NO_TURNSTILE: '1' }), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(201)
    expect(((await res.clone().json()) as any).code).toMatch(/^TD-260901-[A-Z2-9]{4}$/)
    await flush()
  })

  it('cờ dev khác "1" không mở cổng — vẫn 503', async () => {
    const { f } = fakeFetch(); const { ctx } = mkCtx()
    const res = await handleBooking(req(payload()), { BOOKING_DB: env.BOOKING_DB, BOOKING_ALLOW_NO_TURNSTILE: 'true' }, ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(503)
  })

  it('form-urlencoded + Accept text/html → trang HTML có mã đơn', async () => {
    const { f } = fakeFetch(); const { ctx, flush } = mkCtx()
    const flat = { tourSlug: 'tour-3-dao-nha-trang', tourTitle: 'Tour 3 đảo', bookingRef: 'tour-3-dao', departDate: '2026-09-05', 'pax.adult': '2', 'pax.child': '1', 'quoted.perPax.adult': '550000', 'quoted.perPax.child': '350000', 'quoted.total': '1450000', 'quoted.quotedAt': 'x', name: 'Nguyễn Văn A', phone: '0905123456', 'cf-turnstile-response': TOK }
    const res = await handleBooking(req(flat, { Accept: 'text/html,application/xhtml+xml' }, { form: true }), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(201)
    expect(res.headers.get('content-type')).toContain('text/html')
    const html = await res.text()
    expect(html).toMatch(/TD-260901-[A-Z2-9]{4}/)
    expect(html).toContain('/tour/tour-3-dao-nha-trang/')
    expect(html).toContain('/lien-he/')
    // M11 (review Task 8): đơn này 201 thật, cũng lên lịch báo tin qua ctx.waitUntil — đợi
    // cho xong trước khi ca kết thúc.
    await flush()
  })

  it('body form-urlencoded quá 16KB → 413 (F1, review Task 8: nhánh form từng không có test)', async () => {
    const { f } = fakeFetch(); const { ctx } = mkCtx()
    const res = await handleBooking(req({ note: 'x'.repeat(17 * 1024) }, {}, { form: true }), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(413)
  })

  it('GET → 405; Origin khác host → 403; body quá 16KB → 413; JSON hỏng → 400', async () => {
    const { f } = fakeFetch(); const { ctx } = mkCtx()
    expect((await handleBooking(req({}, {}, { method: 'GET' }), mkEnv(), ctx, { fetchImpl: f })).status).toBe(405)
    expect((await handleBooking(req(payload(), { Origin: 'https://evil.example' }), mkEnv(), ctx, { fetchImpl: f })).status).toBe(403)
    expect((await handleBooking(req(payload({ note: 'x'.repeat(17 * 1024) })), mkEnv(), ctx, { fetchImpl: f })).status).toBe(413)
    const bad = new Request('https://tourdao.vn/api/dat-tour', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: '{not json' })
    expect((await handleBooking(bad, mkEnv(), ctx, { fetchImpl: f })).status).toBe(400)
  })

  // ── Khối chữ tài khoản trên đường KHÔNG-JavaScript (SPEC §4.5 + §11) ────────────────────
  // Đường này quan trọng hơn vẻ ngoài của nó: khách tắt JS, hoặc script lỗi, vẫn phải chuyển
  // khoản được. Và nó là bề mặt DUY NHẤT của luật đơn trùng mà test tự động với tới —
  // khối thành công trong BookingForm.astro không import được vào vitest (không có plugin Astro).

  const CK = (over: Record<string, unknown> = {}) => payload({
    paymentMethod: 'transfer',
    quoted: { perPax: { adult: 550000, child: 350000 }, total: 1450000, quotedAt: '2026-08-21T02:00:00Z', prepay: { percent: 10, totalGoc: 1610000 } },
    ...over,
  })

  it('chuyển khoản + HTML → có đủ khối chữ tài khoản, nội dung CK bỏ gạch nối', async () => {
    const { f } = fakeFetch(); const { ctx, flush } = mkCtx()
    const res = await handleBooking(req(CK(), { Accept: 'text/html' }), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(201)
    const html = await res.text()
    const code = html.match(/TD-260901-[A-Z2-9]{4}/)![0]

    expect(html).toContain('Techcombank')
    expect(html).toContain('2502503979')
    expect(html).toContain('CONG TY TNHH TOUR DAO')
    expect(html).toContain('1.450.000')
    // Khách THẤY mã có gạch, GÕ mã không gạch — cả hai phải có mặt, đúng vai.
    expect(html).toContain(code)
    expect(html).toContain(code.replace(/-/g, ''))
    // Đường này CỐ Ý không nhúng ảnh: html.ts đang mang nợ màu, thêm ảnh là bồi nợ (SPEC §4.5).
    expect(html).not.toContain('img.vietqr.io')
    await flush()
  })

  it('thanh toán khi khởi hành + HTML → KHÔNG có khối tài khoản', async () => {
    const { f } = fakeFetch(); const { ctx, flush } = mkCtx()
    const res = await handleBooking(req(payload({ paymentMethod: 'onboard', phone: '0905 999 111' }), { Accept: 'text/html' }), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    expect(res.status).toBe(201)
    const html = await res.text()
    expect(html).not.toContain('2502503979')
    expect(html).not.toContain('Techcombank')
    expect(html).not.toContain('Nội dung chuyển khoản')
    await flush()
  })

  // CA GIỮ TIỀN. Khi trùng, handler trả mã đơn CŨ nhưng `v.quoted.total` là tổng lần nộp MỚI.
  // In số tiền mới cạnh mã cũ đã sai; đưa nó vào khối chuyển khoản là khách CHUYỂN SAI SỐ TIỀN.
  // Danh sách đóng: chỉ mã đơn và câu đã ghi nhận. Không tiền, không tài khoản, không tour.
  it('ĐƠN TRÙNG + HTML → chỉ mã đơn, KHÔNG một dòng tiền nào, KHÔNG tài khoản', async () => {
    const { f } = fakeFetch(); const { ctx, flush } = mkCtx()
    const r1 = await handleBooking(req(CK({ phone: '0905 222 333' }), { Accept: 'text/html' }), mkEnv(), ctx, { fetchImpl: f, now: () => NOW })
    const code1 = (await r1.text()).match(/TD-260901-[A-Z2-9]{4}/)![0]
    await flush()

    // Lần nộp thứ hai: CÙNG phone+tour+ngày nhưng TỔNG KHÁC (2.000.000 thay vì 1.450.000).
    // Nếu luật danh sách đóng hỏng, con số 2.000.000 sẽ hiện ngay dưới mã đơn cũ.
    const r2 = await handleBooking(req(CK({
      phone: '0905 222 333',
      quoted: { perPax: { adult: 1000000 }, total: 2000000, quotedAt: '2026-08-21T02:00:00Z', prepay: { percent: 10, totalGoc: 2200000 } },
      pax: { adult: 2, child: 0, senior: 0, infant: 0 },
    }), { Accept: 'text/html' }), mkEnv(), ctx, { fetchImpl: f, now: () => new Date(NOW.getTime() + 60_000) })
    expect(r2.status).toBe(200)
    const html = await r2.text()

    expect(html).toContain(code1)
    expect(html).toContain('đã được ghi nhận')
    // Không một con số tiền nào — cả tổng cũ lẫn tổng mới.
    expect(html).not.toContain('2.000.000')
    expect(html).not.toContain('1.450.000')
    expect(html).not.toContain('Tạm tính')
    // Không khối tài khoản, không nội dung chuyển khoản.
    expect(html).not.toContain('2502503979')
    expect(html).not.toContain('Techcombank')
    expect(html).not.toContain(code1.replace(/-/g, ''))
    // Không tên tour, không ngày khởi hành (cả hai dựng từ lần nộp mới).
    expect(html).not.toContain('Ngày khởi hành')
    await flush()
  })

  // ── backHref theo loại sản phẩm (Task 2, ADR-0033 §6) ────────────────────────────────────
  // Lệch so với brief (ghi rõ, không im lặng sửa): brief gọi tên helper `postForm`, nhưng tệp
  // này KHÔNG có helper đó — helper đang có là `req()` (dựng Request) + `payload()` (dựng thân
  // JSON) đi cùng `handleBooking(...)`. Dùng lại đúng cặp helper đang có, không tạo helper thứ
  // hai (đúng chỉ dẫn "nếu tên khác thì theo tên đang có").
  describe('backHref theo loại sản phẩm', () => {
    it('experience → /trai-nghiem/{slug}/, KHÔNG phải 404', async () => {
      const { f } = fakeFetch(); const { ctx, flush } = mkCtx()
      const res = await handleBooking(
        req(payload({ productType: 'experience', tourSlug: 'du-bay-parasailing-keo-bang-cano', tourTitle: 'Dù bay Parasailing kéo bằng canô', phone: '0905 111 222' }), { Accept: 'text/html' }),
        mkEnv(), ctx, { fetchImpl: f, now: () => NOW },
      )
      expect(res.status).toBe(201)
      const html = await res.text()
      expect(html).toContain('/trai-nghiem/du-bay-parasailing-keo-bang-cano/')
      expect(html).not.toContain('/tour/du-bay-parasailing-keo-bang-cano/')
      // Task 3 (review vòng 1): chữ neo phải khớp loại sản phẩm, không mặc định "tour".
      expect(html).toContain('Về trang trải nghiệm')
      await flush()
    })

    it('tour → /tour/{slug}/ như cũ', async () => {
      const { f } = fakeFetch(); const { ctx, flush } = mkCtx()
      const res = await handleBooking(
        req(payload({ productType: 'tour', tourSlug: 'tour-hon-tam-tron-goi', tourTitle: 'Tour Hòn Tằm trọn gói', bookingRef: 'tour-hon-tam', phone: '0905 333 444' }), { Accept: 'text/html' }),
        mkEnv(), ctx, { fetchImpl: f, now: () => NOW },
      )
      expect(res.status).toBe(201)
      const html = await res.text()
      expect(html).toContain('/tour/tour-hon-tam-tron-goi/')
      // Task 3 (review vòng 1): đối xứng với ca experience — chữ neo giữ nguyên "tour".
      expect(html).toContain('Về trang tour')
      await flush()
    })

    it('slug sai dạng → "/" bất kể loại', async () => {
      const { f } = fakeFetch(); const { ctx } = mkCtx()
      const res = await handleBooking(
        req(payload({ productType: 'experience', tourSlug: 'CÓ DẤU CÁCH', phone: '0905 555 666' }), { Accept: 'text/html' }),
        mkEnv(), ctx, { fetchImpl: f, now: () => NOW },
      )
      // Cố ý neo cả status: slug sai dạng thất bại validateBooking (fields.tour) → 400.
      // Thiếu dòng này ca sẽ xanh cả trước lẫn sau sửa (nhánh regex-fail vốn đã trả '/'),
      // không phân biệt được backHref MỚI với hành vi CŨ (advisor review, xem báo cáo).
      expect(res.status).toBe(400)
      expect(await res.text()).toContain('href="/"')
    })
  })
})
