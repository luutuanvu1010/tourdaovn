import type { Lang } from './types'

// Nguồn duy nhất map lang → BCP-47 locale cho Intl (date/number).
// en-GB để giữ trật tự ngày/tháng nhất quán với quy ước dd/mm hiện có.
export const LOCALE_MAP: Record<Lang, string> = {
  vi: 'vi-VN',
  en: 'en-GB',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ru: 'ru-RU',
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
}

/**
 * Ngày đầy đủ theo locale trang. timeZone UTC để build local và CI cho cùng output.
 * numeric: vi/en "08/07/2026", zh "2026/07/08", ko "2026. 07. 08.", ru "08.07.2026"
 * — validator S24-UPDATED-HTML (scripts/validators/governance-post.ts) regex theo đúng các dạng này.
 */
export function formatDate(value: string | undefined | null, lang: Lang, style: 'numeric' | 'long' = 'numeric'): string {
  const d = parseDate(value)
  if (!d) return ''
  const opts: Intl.DateTimeFormatOptions = style === 'long'
    ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }
  return new Intl.DateTimeFormat(LOCALE_MAP[lang], opts).format(d)
}

/** Ngày + tháng (badge sự kiện). vi giữ quy ước dd/MM vì Intl vi-VN trả "dd-MM". */
export function formatDateShort(value: string | undefined | null, lang: Lang): string {
  const d = parseDate(value)
  if (!d) return ''
  if (lang === 'vi') {
    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  }
  return new Intl.DateTimeFormat(LOCALE_MAP[lang], { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(d)
}

/** Tháng/năm cho nhãn cập nhật giá (asOf dạng "YYYY-MM..."). vi giữ quy ước MM/YYYY vì Intl vi-VN trả "tháng MM, YYYY". */
export function formatMonthYear(value: string | undefined | null, lang: Lang): string {
  if (!value || !/^\d{4}-\d{2}/.test(value)) return ''
  if (lang === 'vi') {
    const [y, m] = value.split('-')
    return `${m}/${y}`
  }
  const d = parseDate(value)
  if (!d) return ''
  return new Intl.DateTimeFormat(LOCALE_MAP[lang], { month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(d)
}

/** Số theo locale trang (dấu nhóm nghìn). */
export function formatNumber(n: number, lang: Lang): string {
  return n.toLocaleString(LOCALE_MAP[lang])
}
