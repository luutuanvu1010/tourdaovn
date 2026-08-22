// schema.ts — hợp đồng payload của POST /api/dat-tour và luật kiểm (SPEC §4.4).
// Thuần TypeScript, không Astro, không D1. Thông điệp tiếng Việt ở đây là nguồn duy nhất
// cho lỗi API; nhãn giao diện thì ở uiCopy.ts.
import { PAX_ORDER, computeQuote, type PaxCode, type PaxCounts } from './quote'
import { addDaysISO, isISODate } from './vn-date'

export const LIMITS = {
  ADULT_MIN: 1, PER_TYPE_MAX: 20, TOTAL_MAX: 30, MAX_DAYS_AHEAD: 365,
  NAME_MIN: 2, NAME_MAX: 80, EMAIL_MAX: 120, PICKUP_MAX: 200, NOTE_MAX: 1000,
  TITLE_MAX: 200, SLUG_MAX: 120, TOTAL_MAX_VND: 1_000_000_000, BODY_MAX_BYTES: 16 * 1024,
} as const

export const MSG = {
  formInvalid: 'Vui lòng kiểm tra lại các ô được đánh dấu.',
  tourInvalid: 'Thông tin tour không hợp lệ, hãy tải lại trang.',
  dateRequired: 'Chọn ngày khởi hành.',
  dateInvalid: 'Ngày khởi hành không hợp lệ.',
  dateTooEarly: 'Ngày khởi hành phải từ ngày mai trở đi.',
  dateTooFar: 'Chỉ nhận đặt trước tối đa 365 ngày.',
  paxInvalid: 'Số người không hợp lệ.',
  adultMin: 'Cần ít nhất 1 người lớn.',
  perTypeMax: 'Tối đa 20 người mỗi hạng. Đoàn lớn hơn, nhắn Zalo để báo giá riêng.',
  totalMax: 'Tối đa 30 người một đơn. Đoàn lớn hơn, nhắn Zalo để báo giá riêng.',
  quotedMismatch: 'Tạm tính không khớp số người, hãy tải lại trang và thử lại.',
  nameRequired: 'Nhập họ và tên.',
  nameShort: 'Họ và tên cần ít nhất 2 ký tự.',
  nameLong: 'Họ và tên quá dài.',
  phoneRequired: 'Nhập số điện thoại.',
  phoneInvalid: 'Số điện thoại chưa đúng (ví dụ 0905 123 456).',
  emailInvalid: 'Email chưa đúng định dạng.',
  pickupLong: 'Điểm đón quá dài (tối đa 200 ký tự).',
  noteLong: 'Ghi chú quá dài (tối đa 1000 ký tự).',
  turnstileFailed: 'Xác minh không thành công, vui lòng thử lại.',
  rateLimited: 'Bạn vừa gửi nhiều yêu cầu, vui lòng thử lại sau ít phút.',
  serverError: 'Chưa gửi được, vui lòng thử lại hoặc nhắn Zalo.',
  methodNotAllowed: 'Chỉ nhận POST.',
  forbiddenOrigin: 'Yêu cầu không đến từ trang của chúng tôi.',
  bodyTooLarge: 'Dữ liệu gửi lên quá lớn.',
  bodyInvalid: 'Dữ liệu gửi lên không đọc được.',
  noScript: 'Cần bật JavaScript để gửi yêu cầu. Hoặc liên hệ theo trang Liên hệ.',
} as const

export type Quoted = { perPax: Partial<Record<PaxCode, number>>; total: number; quotedAt: string }

export type BookingInput = {
  tourSlug: string; tourTitle: string; bookingRef: string; departDate: string
  pax: PaxCounts
  quoted: Quoted
  name: string; phone: string; email: string; pickup: string; note: string
  turnstileToken: string; website: string
}

export type BookingValid = Omit<BookingInput, 'turnstileToken' | 'website' | 'email'> & { email: string | null }

export type ValidationResult =
  | { ok: true; value: BookingValid }
  | { ok: false; fields: Record<string, string>; message: string }

const SLUG_RE = /^[a-z0-9-]{1,120}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}
function int(v: unknown): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : 0
}
function pick(raw: Record<string, unknown>, dotted: string): unknown {
  // hỗ trợ cả dạng lồng {pax:{adult}} lẫn dạng phẳng {'pax.adult'} từ form
  if (dotted in raw) return raw[dotted]
  return dotted.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), raw)
}

/** Ép một object bất kỳ (JSON hoặc form phẳng) về đúng hình BookingInput. Không kiểm luật ở đây. */
export function parseBookingPayload(raw: unknown): BookingInput {
  const r = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>
  const pax = {} as PaxCounts
  for (const c of PAX_ORDER) pax[c] = int(pick(r, `pax.${c}`))
  const perPax: Partial<Record<PaxCode, number>> = {}
  for (const c of PAX_ORDER) {
    const v = pick(r, `quoted.perPax.${c}`)
    if (v !== undefined && v !== null && v !== '') perPax[c] = int(v)
  }
  return {
    tourSlug: str(r.tourSlug).trim(),
    tourTitle: str(r.tourTitle).trim(),
    bookingRef: str(r.bookingRef).trim(),
    departDate: str(r.departDate).trim(),
    pax,
    quoted: { perPax, total: int(pick(r, 'quoted.total')), quotedAt: str(pick(r, 'quoted.quotedAt')) },
    name: str(r.name).trim(),
    phone: str(r.phone).trim(),
    email: str(r.email).trim(),
    pickup: str(r.pickup).trim(),
    note: str(r.note).trim(),
    turnstileToken: str(r.turnstileToken ?? r['cf-turnstile-response']).trim(),
    website: str(r.website).trim(),
  }
}

/** Bỏ mọi ký tự không phải số; +84/84 đầu → 0; phải là 0 + 9–10 số. */
export function normalizePhone(raw: string): string | null {
  let digits = (raw || '').replace(/\D/g, '')
  if (digits.startsWith('84')) digits = '0' + digits.slice(2)
  return /^0\d{9,10}$/.test(digits) ? digits : null
}

export function validateBooking(input: BookingInput, today: string): ValidationResult {
  const fields: Record<string, string> = {}

  if (!SLUG_RE.test(input.tourSlug) || !SLUG_RE.test(input.bookingRef) || input.tourTitle.length === 0 || input.tourTitle.length > LIMITS.TITLE_MAX) {
    fields.tour = MSG.tourInvalid
  }

  if (!input.departDate) fields.departDate = MSG.dateRequired
  else if (!isISODate(input.departDate)) fields.departDate = MSG.dateInvalid
  else if (input.departDate < addDaysISO(today, 1)) fields.departDate = MSG.dateTooEarly
  else if (input.departDate > addDaysISO(today, LIMITS.MAX_DAYS_AHEAD)) fields.departDate = MSG.dateTooFar

  let total = 0
  for (const c of PAX_ORDER) {
    const n = input.pax[c]
    if (!Number.isInteger(n) || n < 0) { fields[`pax.${c}`] = MSG.paxInvalid; continue }
    if (n > LIMITS.PER_TYPE_MAX) fields[`pax.${c}`] = MSG.perTypeMax
    total += n
  }
  if (!fields['pax.adult'] && input.pax.adult < LIMITS.ADULT_MIN) fields['pax.adult'] = MSG.adultMin
  if (total > LIMITS.TOTAL_MAX) fields.pax = MSG.totalMax

  // Kiểm NHẤT QUÁN tạm tính bằng đúng hàm client dùng (BK5) — không phải kiểm đúng giá.
  // KHÔNG tự vá 'adult' bằng 0 khi client bỏ khoá này khỏi perPax: để nguyên (có thể
  // undefined lúc chạy dù kiểu ép là number) thì computeQuote tự trả null cho pax.adult > 0
  // thiếu giá — giống hệt cách nó xử mọi hạng khác thiếu giá, không cần nhánh riêng cho adult.
  const quotedPerPax = input.quoted.perPax as Partial<Record<PaxCode, number>> & { adult: number }
  const q = computeQuote({ kind: 'flat', perPax: quotedPerPax }, input.pax)
  const quotedOk = typeof input.quoted.perPax.adult === 'number'
    && Object.values(input.quoted.perPax).every(v => Number.isInteger(v) && (v as number) >= 0)
    && Number.isInteger(input.quoted.total) && input.quoted.total >= 0 && input.quoted.total <= LIMITS.TOTAL_MAX_VND
  if (!quotedOk || !q || q.total !== input.quoted.total) fields.quoted = MSG.quotedMismatch

  if (!input.name) fields.name = MSG.nameRequired
  else if (input.name.length < LIMITS.NAME_MIN) fields.name = MSG.nameShort
  else if (input.name.length > LIMITS.NAME_MAX) fields.name = MSG.nameLong

  const phone = normalizePhone(input.phone)
  if (!input.phone) fields.phone = MSG.phoneRequired
  else if (!phone) fields.phone = MSG.phoneInvalid

  if (input.email && (input.email.length > LIMITS.EMAIL_MAX || !EMAIL_RE.test(input.email))) fields.email = MSG.emailInvalid
  if (input.pickup.length > LIMITS.PICKUP_MAX) fields.pickup = MSG.pickupLong
  if (input.note.length > LIMITS.NOTE_MAX) fields.note = MSG.noteLong

  if (Object.keys(fields).length > 0) return { ok: false, fields, message: MSG.formInvalid }

  const { turnstileToken: _t, website: _w, ...rest } = input
  return { ok: true, value: { ...rest, phone: phone as string, email: input.email || null } }
}
