// handler.ts — toàn luồng POST /api/dat-tour (SPEC §4.4), KHÔNG phụ thuộc Astro để test được.
// Thứ tự: phương thức → Origin → đọc body → honeypot → kiểm đầu vào → Turnstile → tần suất
// → trùng → sinh mã + INSERT (thử lại khi trùng mã) → trả lời → báo tin trong waitUntil.
// BK1: không import prices.ts / sanity.ts / resolver.ts. BK2: chỉ ghi D1. BK3: không log PII.
import type { D1Database } from '@cloudflare/workers-types'
import { brand, site } from '../../site.config'
import { generateBookingCode } from './code'
import { renderBookingPage } from './html'
import { notifyAll, type Notifier } from './notify/index'
import { createResendNotifier } from './notify/resend'
import { createZaloNotifier } from './notify/zalo'
import { LIMITS, MSG, parseBookingPayload, validateBooking, type BookingValid } from './schema'
import { countRecentByIp, findRecentDuplicate, insertBooking, isUniqueViolation, updateNotifyStatus, type NewBooking } from './store'
import { verifyTurnstile } from './turnstile'
import { formatDateVN, todayVN } from './vn-date'
import { formatPrice } from '../renderer'

export type BookingEnv = {
  BOOKING_DB: D1Database
  RESEND_API_KEY?: string
  BOOKING_NOTIFY_EMAIL?: string
  ZALO_BOT_TOKEN?: string
  ZALO_BOT_CHAT_IDS?: string
  TURNSTILE_SECRET_KEY?: string
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
  const ct = request.headers.get('content-type') ?? ''
  try {
    // form-urlencoded: đọc bằng formData() thay vì text() — workerd cảnh báo (không phải lỗi)
    // khi gọi .text() trên thân có Content-Type form/multipart; formData() là API đúng chỗ.
    if (ct.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData()
      const data: Record<string, string> = {}
      for (const [k, v] of form.entries()) data[k] = String(v)
      return { data }
    }
    const text = await request.text()
    if (text.length > LIMITS.BODY_MAX_BYTES) return { error: errorReply(413, MSG.bodyTooLarge) }
    return { data: JSON.parse(text) }
  } catch {
    return { error: errorReply(400, MSG.bodyInvalid) }
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
    createResendNotifier({ apiKey: env.RESEND_API_KEY, to: env.BOOKING_NOTIFY_EMAIL, from: deps.fromEmail ?? `${brand.name} <dat-tour@${host}>`, fetchImpl: deps.fetchImpl }),
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
      if (originHost !== (request.headers.get('host') ?? new URL(request.url).host)) {
        return reply(request, errorReply(403, MSG.forbiddenOrigin), '')
      }
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

    const ipHash = ip ? await sha256Hex(`${ip}|${env.TURNSTILE_SECRET_KEY ?? 'dev'}`) : null
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
      const status = await notifyAll(notifiers, record)
      await updateNotifyStatus(env.BOOKING_DB, record.code, status)
      console.log(`[dat-tour] ${record.code} email=${status.email ?? '-'} zalo=${status.zalo ?? '-'}`)
    })())

    return reply(request, { status: 201, body: { ok: true, code: record.code, summary: { tourTitle: v.tourTitle, departDate: v.departDate, pax: v.pax, total: v.quoted.total } }, heading: 'Đã nhận yêu cầu đặt tour', lines: summaryLines(v, record.code), ok: true }, tourSlug)
  } catch (e) {
    // Chỉ log thông điệp lỗi, không log body (BK3).
    console.error('[dat-tour] lỗi:', e instanceof Error ? e.message : String(e))
    return reply(request, errorReply(500, MSG.serverError), tourSlug)
  }
}
