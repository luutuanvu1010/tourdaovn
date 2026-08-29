// handler.ts — toàn luồng POST /api/dat-tour (SPEC §4.4), KHÔNG phụ thuộc Astro để test được.
// Thứ tự: phương thức → Origin → cổng cấu hình (Turnstile) → đọc body → honeypot → kiểm đầu
// vào → Turnstile → tần suất → trùng → sinh mã + INSERT (thử lại khi trùng mã) → trả lời →
// báo tin trong waitUntil.
// BK1: không import prices.ts / sanity.ts / resolver.ts. BK2: chỉ ghi D1. BK3: không log PII.
import type { D1Database } from '@cloudflare/workers-types'
import { brand, site } from '../../site.config'
import { generateBookingCode } from './code'
import { renderBookingPage } from './html'
import { notifyAll, type Notifier } from './notify/index'
import { createSesNotifier } from './notify/ses'
import { createZaloNotifier } from './notify/zalo'
import { LIMITS, MSG, parseBookingPayload, validateBooking, type BookingValid } from './schema'
import { countRecentByIp, findRecentDuplicate, insertBooking, isUniqueViolation, updateNotifyStatus, type NewBooking } from './store'
import { verifyTurnstile } from './turnstile'
import { formatDateVN, todayVN } from './vn-date'
import { formatPrice } from '../renderer'

export type BookingEnv = {
  BOOKING_DB: D1Database
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  AWS_SES_REGION?: string
  BOOKING_NOTIFY_EMAIL?: string
  ZALO_BOT_TOKEN?: string
  ZALO_BOT_CHAT_IDS?: string
  TURNSTILE_SECRET_KEY?: string
  /** Muối băm IP cho tần suất (F4, review Task 8) — vòng đời RIÊNG với TURNSTILE_SECRET_KEY:
   *  xoay khoá Turnstile không được kéo theo việc mọi ip_hash đã lưu bỗng vô nghĩa. */
  IP_HASH_SALT?: string
  /** Cửa thoát TƯỜNG MINH cho dev khi chưa có TURNSTILE_SECRET_KEY (xem cổng cấu hình trong
   *  handleBooking). Đặt `'1'` ở `.dev.vars`; KHÔNG bao giờ đặt trên production, và KHÔNG khai
   *  trong `wrangler.toml` — file đó không có `[vars]` (BK4). */
  BOOKING_ALLOW_NO_TURNSTILE?: string
}
export type WaitUntilCtx = { waitUntil(p: Promise<unknown>): void }
export type HandlerDeps = {
  fetchImpl?: typeof fetch
  now?: () => Date
  rand?: () => number
  notifiers?: Notifier[]
  fromEmail?: string
}

export const RATE_WINDOW_MS = 10 * 60 * 1000
export const RATE_MAX = 5
export const DUP_WINDOW_MS = 24 * 60 * 60 * 1000
const CODE_RETRIES = 5

// Cảnh báo một lần cho mỗi isolate, không phải mỗi đơn một dòng. Nội dung chỉ nêu TÊN biến môi
// trường — không kèm tên/SĐT/email/điểm đón/ghi chú của khách (BK3).
let warnedNoTurnstile = false
let warnedNoSalt = false

type Reply = { status: number; body: Record<string, unknown>; heading: string; lines: string[]; ok: boolean }

function wantsHtml(request: Request): boolean {
  return !(request.headers.get('accept') ?? '').includes('application/json')
}

function backHref(tourSlug: string): string {
  return /^[a-z0-9-]{1,120}$/.test(tourSlug) ? `/tour/${tourSlug}/` : '/'
}

function reply(request: Request, r: Reply, tourSlug: string): Response {
  if (wantsHtml(request)) {
    const html = renderBookingPage({ title: `${r.heading} — ${brand.name}`, heading: r.heading, lines: r.lines, backHref: backHref(tourSlug), ok: r.ok })
    return new Response(html, { status: r.status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
  }
  return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })
}

function errorReply(status: number, message: string, extra: Record<string, unknown> = {}): Reply {
  return { status, body: { ok: false, message, ...extra }, heading: 'Chưa gửi được yêu cầu', lines: [message, MSG.noScript], ok: false }
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function readBody(request: Request): Promise<{ data: unknown } | { error: Reply }> {
  const len = Number(request.headers.get('content-length') ?? 0)
  if (len > LIMITS.BODY_MAX_BYTES) return { error: errorReply(413, MSG.bodyTooLarge) }
  // F1 (review Task 8): PHẢI đọc bằng text() cho CẢ HAI loại thân rồi tự kiểm kích thước trước
  // khi parse — không được đọc form-urlencoded bằng formData() mà bỏ qua kiểm kích thước, vì
  // đây là đường ghi D1 DUY NHẤT của site và honeypot/validate/Turnstile/tần suất đều nằm SAU
  // bước đọc thân. Đổi lại có cảnh báo console của workerd ("Called .text() on an HTTP body
  // which does not appear to be text... Content-Type is application/x-www-form-urlencoded") ở
  // ca test form-urlencoded — chấp nhận cảnh báo đó, không đánh đổi lớp chặn kích thước lấy im
  // lặng console (xem báo cáo).
  const text = await request.text()
  // F2 (review Task 8): đo bằng byte (TextEncoder), không phải .length (đơn vị UTF-16) — tên
  // hằng là BODY_MAX_BYTES, chuỗi tiếng Việt nhiều dấu có thể dài hơn nhiều byte so với số ký tự.
  if (new TextEncoder().encode(text).byteLength > LIMITS.BODY_MAX_BYTES) return { error: errorReply(413, MSG.bodyTooLarge) }
  const ct = request.headers.get('content-type') ?? ''
  try {
    if (ct.includes('application/x-www-form-urlencoded')) return { data: Object.fromEntries(new URLSearchParams(text)) }
    return { data: JSON.parse(text) }
  } catch {
    // M9 (review Task 8): thêm khoá `error` để phân biệt với hai loại 400 kia (validation/turnstile).
    return { error: errorReply(400, MSG.bodyInvalid, { error: 'body' }) }
  }
}

function summaryLines(v: BookingValid, code: string): string[] {
  return [
    `Mã đơn: ${code}`,
    `Tour: ${v.tourTitle}`,
    `Ngày khởi hành: ${formatDateVN(v.departDate)}`,
    `Tạm tính: ${formatPrice(v.quoted.total, 'vi')}`,
    `${brand.name} sẽ gọi lại xác nhận trong giờ làm việc.`,
  ]
}

function defaultNotifiers(env: BookingEnv, deps: HandlerDeps): Notifier[] {
  const host = new URL(site.url).host
  return [
    createSesNotifier({ accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY, region: env.AWS_SES_REGION, to: env.BOOKING_NOTIFY_EMAIL, from: deps.fromEmail ?? `${brand.name} <dat-tour@${host}>`, fetchImpl: deps.fetchImpl }),
    createZaloNotifier({ token: env.ZALO_BOT_TOKEN, chatIds: env.ZALO_BOT_CHAT_IDS, fetchImpl: deps.fetchImpl }),
  ]
}

export async function handleBooking(request: Request, env: BookingEnv, ctx: WaitUntilCtx, deps: HandlerDeps = {}): Promise<Response> {
  const now = deps.now ?? (() => new Date())
  let tourSlug = ''
  try {
    if (request.method !== 'POST') {
      const r = reply(request, errorReply(405, MSG.methodNotAllowed), '')
      r.headers.set('Allow', 'POST')
      return r
    }
    const origin = request.headers.get('origin')
    if (origin) {
      let originHost = ''
      try { originHost = new URL(origin).host } catch { /* Origin hỏng → coi như khác host */ }
      const host = request.headers.get('host') ?? new URL(request.url).host
      // M10 (review Task 8): host không phân biệt hoa/thường (RFC 3986 §3.2.2); so nguyên văn
      // trước đây khiến Host viết hoa (vd. "TourDao.vn") bị chặn 403 nhầm.
      if (originHost.toLowerCase() !== host.toLowerCase()) {
        return reply(request, errorReply(403, MSG.forbiddenOrigin), '')
      }
    }

    // ─── Cổng cấu hình: thiếu TURNSTILE_SECRET_KEY thì HỎNG ỒN ÀO, không hỏng câm ──────────
    // SPEC §4.7 (hàng `PUBLIC_TURNSTILE_SITE_KEY`), nguyên văn: "production **phải** có cả site
    // key lẫn secret, thiếu một trong hai thì mọi đơn bị 400 — hỏng ồn ào, không hỏng câm".
    // SPEC §4.4 (hàng `turnstileToken`), nguyên văn: "thiếu secret ở môi trường → bỏ qua kiểm
    // (chỉ dev), ghi `console.warn` một lần".
    // Hai câu mâu thuẫn về CHỮ nhưng không mâu thuẫn về Ý: §4.4 tự giới hạn phạm vi bỏ qua vào
    // **dev**, §4.7 nói production không được im lặng mở toang. Cửa thoát TƯỜNG MINH dưới đây
    // thoả cả hai: dev đặt `BOOKING_ALLOW_NO_TURNSTILE=1` trong `.dev.vars` thì vẫn chạy được;
    // production không đặt biến đó (và `wrangler.toml` không có `[vars]` — BK4) nên thiếu secret
    // là TỪ CHỐI nhận đơn, chứ không phải nhận đơn mà không kiểm gì.
    // Vì sao phải chặn: bỏ qua Turnstile thì lớp còn lại chỉ là honeypot (lách bằng cách để
    // trống ô `website`) và chống trùng (lách bằng đổi một chữ số SĐT) — không lớp nào là lớp
    // chặn. Chặn theo lượt yêu cầu nằm ở luật WAF, ngoài Worker (SPEC §4.10 lớp 3).
    // Đây là THI HÀNH hai mục SPEC trên (phán xét controller, vòng review toàn nhánh
    // 2026-08-23), KHÔNG phải một quyết định kiến trúc tự đặt ra ở tầng code.
    if (!env.TURNSTILE_SECRET_KEY && env.BOOKING_ALLOW_NO_TURNSTILE !== '1') {
      if (!warnedNoTurnstile) {
        warnedNoTurnstile = true
        console.error('[dat-tour] TURNSTILE_SECRET_KEY chưa đặt và không có BOOKING_ALLOW_NO_TURNSTILE=1 — TỪ CHỐI nhận đơn')
      }
      return reply(request, errorReply(503, MSG.serverError), '')
    }

    const body = await readBody(request)
    if ('error' in body) return reply(request, body.error, '')
    const input = parseBookingPayload(body.data)
    tourSlug = input.tourSlug

    // Honeypot: trả lời như thật, không lưu, không báo, không mách bot (SPEC §4.4).
    if (input.website) {
      const fake = generateBookingCode(now(), deps.rand)
      return reply(request, { status: 200, body: { ok: true, code: fake }, heading: 'Đã nhận yêu cầu đặt tour', lines: [`Mã đơn: ${fake}`], ok: true }, tourSlug)
    }

    const t = now()
    const valid = validateBooking(input, todayVN(t))
    if (!valid.ok) {
      return reply(request, { status: 400, body: { ok: false, error: 'validation', fields: valid.fields, message: valid.message }, heading: 'Chưa gửi được yêu cầu', lines: [valid.message, ...Object.values(valid.fields)], ok: false }, tourSlug)
    }
    const v = valid.value

    const ip = request.headers.get('cf-connecting-ip')
    const ts = await verifyTurnstile({ secret: env.TURNSTILE_SECRET_KEY, token: input.turnstileToken, ip, fetchImpl: deps.fetchImpl })
    if (!ts.ok) return reply(request, errorReply(400, MSG.turnstileFailed, { error: 'turnstile' }), tourSlug)

    // F4 (review Task 8): muối RIÊNG cho ip_hash, không dùng chung TURNSTILE_SECRET_KEY — xoay
    // khoá Turnstile không được kéo theo việc mọi ip_hash đã lưu bỗng vô nghĩa (hai vòng đời bí
    // mật khác nhau). Thiếu muối (dev) → ipHash = null, KHÔNG tụt về hằng số đoán được: một
    // hằng cố định làm "băm có muối" chỉ còn danh nghĩa (IPv4 dò ngược được trong vài giây).
    const ipHash = ip && env.IP_HASH_SALT ? await sha256Hex(`${ip}|${env.IP_HASH_SALT}`) : null
    if (!env.IP_HASH_SALT && !warnedNoSalt) {
      warnedNoSalt = true
      // Thiếu muối → cả khối đếm tần suất bên dưới bị nhảy qua. Trước đây việc đó diễn ra
      // hoàn toàn im lặng; nay ít nhất có một dòng trong log (BK3: chỉ tên biến).
      console.warn('[dat-tour] IP_HASH_SALT chưa đặt — BỎ QUA đếm tần suất theo IP')
    }
    // F3 (review Task 8, quyết định controller — KHÔNG đổi kiến trúc): bộ đếm dưới đây đếm số
    // ĐƠN ĐÃ TẠO (đã qua Turnstile, đã INSERT) trong RATE_WINDOW_MS, đúng nghĩa "số đơn/10 phút"
    // của SPEC §4.4 — KHÔNG phải giới hạn số LƯỢT YÊU CẦU. Chặn theo lượt yêu cầu (10 yêu
    // cầu/10 giây/IP) là một lớp riêng: luật WAF Rate Limiting trên /api/dat-tour, xem SPEC
    // §4.10 và runbook Task 13 bước 7 — không thuộc phạm vi endpoint này.
    if (ipHash) {
      const recent = await countRecentByIp(env.BOOKING_DB, ipHash, new Date(t.getTime() - RATE_WINDOW_MS).toISOString())
      if (recent >= RATE_MAX) return reply(request, errorReply(429, MSG.rateLimited), tourSlug)
    }

    const dup = await findRecentDuplicate(env.BOOKING_DB, v.phone, v.tourSlug, v.departDate, new Date(t.getTime() - DUP_WINDOW_MS).toISOString())
    if (dup) {
      return reply(request, { status: 200, body: { ok: true, code: dup, duplicate: true, summary: { tourTitle: v.tourTitle, departDate: v.departDate, pax: v.pax, total: v.quoted.total } }, heading: 'Yêu cầu này đã được ghi nhận', lines: summaryLines(v, dup), ok: true }, tourSlug)
    }

    const record: NewBooking = {
      code: '', createdAt: t.toISOString(), tourSlug: v.tourSlug, tourTitle: v.tourTitle, bookingRef: v.bookingRef,
      departDate: v.departDate, pax: v.pax, quoted: v.quoted,
      customerName: v.name, phone: v.phone, email: v.email, pickup: v.pickup || null, note: v.note || null,
      lang: 'vi', source: 'web', ipHash, userAgent: (request.headers.get('user-agent') ?? '').slice(0, 200) || null,
    }
    let inserted = false
    for (let i = 0; i < CODE_RETRIES && !inserted; i++) {
      record.code = generateBookingCode(t, deps.rand)
      try { await insertBooking(env.BOOKING_DB, record); inserted = true }
      catch (e) { if (!isUniqueViolation(e) || i === CODE_RETRIES - 1) throw e }
    }

    const notifiers = deps.notifiers ?? defaultNotifiers(env, deps)
    ctx.waitUntil((async () => {
      // M6 (review Task 8): bọc try/catch — nếu updateNotifyStatus (hoặc notifyAll) ném, đơn
      // vẫn đã nằm trong D1 (không hỏng nghiệp vụ), nhưng thiếu try/catch thì mất luôn dòng
      // console.log mã đơn, tín hiệu quan sát duy nhất của tác vụ nền này.
      try {
        const status = await notifyAll(notifiers, record)
        await updateNotifyStatus(env.BOOKING_DB, record.code, status)
        console.log(`[dat-tour] ${record.code} email=${status.email ?? '-'} zalo=${status.zalo ?? '-'}`)
      } catch (e) {
        // Chỉ log mã đơn + lý do lỗi, không log PII (BK3).
        console.error(`[dat-tour] ${record.code} lỗi báo tin:`, e instanceof Error ? e.message : String(e))
      }
    })())

    return reply(request, { status: 201, body: { ok: true, code: record.code, summary: { tourTitle: v.tourTitle, departDate: v.departDate, pax: v.pax, total: v.quoted.total } }, heading: 'Đã nhận yêu cầu đặt tour', lines: summaryLines(v, record.code), ok: true }, tourSlug)
  } catch (e) {
    // Chỉ log thông điệp lỗi, không log body (BK3).
    console.error('[dat-tour] lỗi:', e instanceof Error ? e.message : String(e))
    return reply(request, errorReply(500, MSG.serverError), tourSlug)
  }
}
