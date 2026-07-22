import type { Lang } from './types'
import { LOCALE_MAP } from './dates'

/**
 * Định dạng số tiền VND theo locale trang
 * vi: 850000 → "850.000₫" | en/zh/ko: "850,000₫" | ru: "850 000₫"
 */
export function formatPrice(amount: number, lang: Lang): string {
  return amount.toLocaleString(LOCALE_MAP[lang]) + '₫'
}
