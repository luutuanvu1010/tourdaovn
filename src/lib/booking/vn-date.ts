// vn-date.ts — ngày theo giờ Việt Nam cho module đặt tour.
// Mọi luật theo ngày — mốc "không nhận ngày đã qua", mã đơn theo ngày — đều tính theo
// Asia/Ho_Chi_Minh, không theo giờ máy chủ (Worker chạy UTC) hay giờ trình duyệt khách.
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

// Thứ trong tuần, viết theo lối Việt. Chép cứng bảy chuỗi chứ KHÔNG gọi Intl với 'vi': lịch
// gốc của <input type="date"> đi theo ngôn ngữ GIAO DIỆN trình duyệt (đo được: máy có
// navigator.language = 'vi' nhưng Intl phân giải ra 'en-US'), nên Intl ở đây cũng có thể trả
// tiếng Anh trên chính máy khách. Bảy chuỗi này là thứ duy nhất chắc chắn ra tiếng Việt.
const THU_VN = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const

/**
 * Đầu cột của lịch tự vẽ. Bản ngắn của `THU_VN` ở trên, cùng thứ tự bắt đầu từ Chủ nhật để
 * dùng thẳng được `getUTCDay()`.
 */
export const THU_NGAN_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const

/**
 * Tên tháng cho tiêu đề lịch tự vẽ. CHÉP CỨNG mười hai chuỗi, cùng đúng một lý do với
 * `THU_VN` ngay trên: `Intl` với 'vi' có thể phân giải ra tiếng Anh trên chính máy khách
 * (đo được trên máy chủ dự án: trang `lang="vi"` mà `Intl` ra 'en-US'). Cả cái lịch tự vẽ
 * này sinh ra chỉ vì lịch gốc của trình duyệt in tháng tiếng Anh — gọi `Intl` ở đây là dẫm
 * lại đúng cái bẫy vừa thoát ra.
 */
export const THANG_VN = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
] as const

/** 2026, 8 (0-based) → 'Tháng 9, 2026'. Tiêu đề đầu lịch. */
export function thangNamVN(year: number, monthIndex: number): string {
  return `${THANG_VN[monthIndex]}, ${year}`
}

/**
 * '2026-09-01' → 'Thứ Ba, 01/09/2026'. Dùng cho dòng đọc lại ngày khởi hành đặt cạnh ô chọn
 * ngày: ô đó là điều khiển gốc của trình duyệt nên không ép được ngôn ngữ, còn dòng này thì
 * luôn tiếng Việt và luôn đúng quy ước dd/mm của site.
 *
 * Tính thứ bằng `Date.UTC` chứ không `new Date(iso)` — giống `addDaysISO` ở trên, để không
 * dính lệch một ngày theo múi giờ máy khách.
 */
export function formatDateFullVN(iso: string): string {
  if (!isISODate(iso)) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const thu = THU_VN[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${thu}, ${formatDateVN(iso)}`
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
