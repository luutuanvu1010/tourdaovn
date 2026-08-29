// vn-date.ts — ngày theo giờ Việt Nam cho module đặt tour.
// Mọi luật "từ ngày mai", mã đơn theo ngày, đều tính theo Asia/Ho_Chi_Minh, không theo
// giờ máy chủ (Worker chạy UTC) hay giờ trình duyệt khách.
export const VN_TZ = 'Asia/Ho_Chi_Minh'

const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: VN_TZ, year: 'numeric', month: '2-digit', day: '2-digit' })

/** 'YYYY-MM-DD' của hôm nay theo giờ Việt Nam. */
export function todayVN(now: Date = new Date()): string {
  return ymd.format(now) // en-CA cho đúng dạng ISO
}

/** Cộng ngày trên chuỗi ISO, tính bằng UTC để không dính DST. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d + days)
  return new Date(t).toISOString().slice(0, 10)
}

/** Đúng dạng YYYY-MM-DD và là ngày có thật trên lịch. */
export function isISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

/** '2026-09-05' → '05/09/2026' (quy ước dd/mm của site, xem dates.ts). */
export function formatDateVN(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: VN_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/**
 * Dấu thời gian ISO (UTC) → 'HH:mm dd/mm/yyyy' theo giờ Việt Nam, ví dụ
 * '2026-08-29T16:36:59.736Z' → '23:36 29/08/2026'.
 *
 * Dùng chung đúng `VN_TZ` với `todayVN`/`yymmddVN` để múi giờ chỉ có MỘT nguồn sự thật:
 * đơn đặt sau 17h UTC trước đây in ra ngày lệch hẳn so với chính mã đơn (mã đơn vốn tính
 * theo giờ Việt Nam). Chuỗi không đọc được thì trả nguyên si, không ném.
 */
export function formatDateTimeVN(iso: string): string {
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return iso
  return `${hhmm.format(t)} ${formatDateVN(ymd.format(t))}`
}

/** 'yymmdd' theo giờ Việt Nam, dùng trong mã đơn. */
export function yymmddVN(now: Date = new Date()): string {
  const [y, m, d] = todayVN(now).split('-')
  return `${y.slice(2)}${m}${d}`
}
