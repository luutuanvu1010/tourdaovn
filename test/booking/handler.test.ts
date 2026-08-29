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
})
