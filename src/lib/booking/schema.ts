// schema.ts — hợp đồng payload của POST /api/dat-tour và luật kiểm (SPEC §4.4).
// Thuần TypeScript, không Astro, không D1. Thông điệp tiếng Việt ở đây là nguồn duy nhất
// cho lỗi API; nhãn giao diện thì ở uiCopy.ts.
import { PAX_ORDER, computeQuote, type PaxCode, type PaxCounts, type Quote } from './quote'
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

// `season` chỉ để ĐƠN GHI LẠI vì sao ra con số tạm tính này (ADR-0030 §3, Task 2). Server
// không tin và không tính lại theo mùa (BK1: server không đọc giá) — xem `parseBookingPayload`.
export type Quoted = { perPax: Partial<Record<PaxCode, number>>; total: number; quotedAt: string; season?: { name: string; percent: number } }

/**
 * Dựng `quoted` gửi lên máy chủ từ `Quote` mà `computeQuote()` vừa tính ở trình duyệt
 * (BookingForm.astro script) — tách khỏi script trình duyệt để kiểm bằng test đi qua đúng ranh
 * giới "trình duyệt dựng payload", chứ không phải test tự dựng sẵn `quoted` đã có `season`.
 * Task 6 (lỗi đã sửa): script cũ dựng `quoted` trực tiếp, bỏ sót `quote.season`, nên mùa không
 * bao giờ tới máy chủ dù `computeQuote` đã tính đúng. Chỉ thêm khoá `season` khi `quote.season`
 * có mặt, để đơn không mùa giữ nguyên hình dạng payload cũ.
 */
export function buildQuotedPayload(quote: Pick<Quote, 'perPax' | 'total' | 'season'>, quotedAt: string): Quoted {
  return { perPax: quote.perPax, total: quote.total, quotedAt, ...(quote.season ? { season: quote.season } : {}) }
}

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
// `<>` nằm trong lớp bị cấm (vòng review toàn nhánh 2026-08-23): một địa chỉ kiểu `a<b@c.dd`
// lọt qua biểu thức cũ rồi đi thẳng vào `ReplyToAddresses` của SES → SES trả 400 và MẤT LUÔN
// thư báo của đơn đó. Vẫn là "biểu thức email đơn giản" theo SPEC §4.4, chỉ bịt đúng hai ký tự.
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/

// Ký tự điều khiển (C0 + DEL) → khoảng trắng, rồi mới `trim()`. Áp cho MỌI trường văn bản tự
// do (`tourTitle`, `name`, `pickup`, `note`) trong `parseBookingPayload`.
// Vì sao cần (vòng review toàn nhánh 2026-08-23): schema này kiểm độ dài và biểu thức nhưng
// không lọc `\r`/`\n`. Hai hệ quả thật:
//  - `note`/`name` có xuống dòng GIẢ MẠO được một dòng trong thân thư văn bản thuần và trong
//    tin Zalo: một `note` chứa xuống dòng rồi "SĐT: 0999999999" trông y hệt một trường thật với
//    nhân viên đang đọc (`notify/format.ts` nối mảng dòng bằng `\n`).
//  - `tourTitle` đi thẳng vào tiêu đề thư SES (`notify/format.ts:17`); ký tự điều khiển ở header
//    dễ làm SES trả 400 và MẤT LUÔN thư báo của đơn đó.
// Thay bằng khoảng trắng (không xoá hẳn) để hai chữ dính nhau không bị dán liền.
const CONTROL_RE = /[\u0000-\u001F\u007F]/g
function clean(s: string): string {
  return s.replace(CONTROL_RE, ' ').trim()
}
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
  // Mùa chỉ để ĐƠN GHI LẠI vì sao ra con số tạm tính này — server không tin và không tính lại
  // theo mùa (BK1: server không đọc giá; `validateBooking` chỉ đối chiếu `perPax`/`total` với
  // `computeQuote` KHÔNG truyền `seasons`). Nhận vào thì làm sạch, sai hình dạng thì bỏ, tuyệt
  // đối không ném lỗi.
  const rawSeason = pick(r, 'quoted.season')
  const season = rawSeason && typeof rawSeason === 'object' && !Array.isArray(rawSeason)
    && typeof (rawSeason as Record<string, unknown>).name === 'string'
    && typeof (rawSeason as Record<string, unknown>).percent === 'number'
    ? { name: clean(String((rawSeason as Record<string, unknown>).name)).slice(0, 60), percent: (rawSeason as Record<string, unknown>).percent as number }
    : undefined
  return {
    tourSlug: str(r.tourSlug).trim(),
    tourTitle: clean(str(r.tourTitle)),
    bookingRef: str(r.bookingRef).trim(),
    departDate: str(r.departDate).trim(),
    pax,
    // `quotedAt` là trường DUY NHẤT trong toàn payload trước đây không có chặn trên: chỉ qua
    // `str()`, không kiểm định dạng, không giới hạn độ dài — một chuỗi ~15 KB ghi thẳng vào cột
    // `quoted_json`. Cắt 40 ký tự (dư cho một dấu thời gian ISO 8601 đầy đủ).
    quoted: { perPax, total: int(pick(r, 'quoted.total')), quotedAt: str(pick(r, 'quoted.quotedAt')).slice(0, 40), ...(season ? { season } : {}) },
    name: clean(str(r.name)),
    phone: str(r.phone).trim(),
    email: str(r.email).trim(),
    pickup: clean(str(r.pickup)),
    note: clean(str(r.note)),
    turnstileToken: str(r.turnstileToken ?? r['cf-turnstile-response']).trim(),
    website: str(r.website).trim(),
  }
}

/**
 * Bỏ mọi ký tự không phải số; bỏ tiền tố `84`; nếu phần còn lại chưa bắt đầu bằng `0` thì
 * thêm `0`; phải là 0 + 9–10 số.
 *
 * Bản cũ luôn dán `'0'` sau khi cắt `84`, nên `+84 0905 123 456` — khách gõ cả mã quốc gia
 * lẫn số `0` đầu, rất phổ biến — ra `00905123456`, vẫn khớp `/^0\d{9,10}$/` (0 + 10 số) nên
 * lọt cổng và nhân viên nhận số KHÔNG gọi được. SĐT là kênh liên lạc bắt buộc duy nhất của
 * đơn, nên đây là lỗi mất đơn chứ không phải lỗi hiển thị.
 */
export function normalizePhone(raw: string): string | null {
  let digits = (raw || '').replace(/\D/g, '')
  if (digits.startsWith('84')) digits = digits.slice(2)
  if (!digits.startsWith('0')) digits = '0' + digits
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
