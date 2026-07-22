import type { PriceEntry, PriceView, Lang } from './types'
import { formatPrice } from './renderer'
import { UI_COPY, PRICE_LABEL_TEMPLATES } from './uiCopy'
import { formatMonthYear } from './dates'

/**
 * Tra cứu giá cho một entity từ map prices
 * @param bookingRef — khóa từ Sanity entity.bookingRef.key
 * @param entityType — _type của entity Sanity
 * @param isAccessibleForFree — entity.isAccessibleForFree
 * @param prices — Map từ loader
 * @param lang — ngôn ngữ trang, quyết định nhãn và format số
 * @returns PriceView hoặc null (ẩn vùng giá)
 */
export function resolvePrice(
  bookingRef: string | undefined,
  entityType: string,
  isAccessibleForFree: boolean | undefined,
  prices: Map<string, PriceEntry>,
  lang: Lang
): PriceView {
  const tpl = PRICE_LABEL_TEMPLATES[lang]

  // Miễn phí → hiện nhãn, không cần giá
  if (isAccessibleForFree) {
    return { label: UI_COPY[lang].free, offers: [], isFree: true }
  }

  // Không có bookingRef → ẩn vùng giá (không CTA giả)
  if (!bookingRef) return null

  const entry = prices.get(bookingRef)
  // Trỏ hụt → KHÔNG render giá (validator CI sẽ chặn build)
  if (!entry) return null

  // Giải theo unit
  switch (entry.unit) {
    case 'perPax': {
      if ('tiers' in entry) {
        // Tour private: nhiều tiers
        const amounts = entry.tiers.map(t => t.amount)
        if (amounts.length === 0) return null
        const low = Math.min(...amounts)
        return {
          label: tpl.perPaxFrom(formatPrice(low, lang)),
          offers: [{ price: low, priceCurrency: 'VND' }],
          isFree: false
        }
      }
      // Đơn: Experience, Tour join-in, Attraction vé
      return {
        label: tpl.perPax(formatPrice(entry.amount, lang)),
        offers: [{ price: entry.amount, priceCurrency: 'VND' }],
        isFree: false
      }
    }

    case 'perRoomNight': {
      const asOf = formatMonthYear(entry.asOf, lang)
      return {
        label: tpl.perNightFrom(formatPrice(entry.from, lang), asOf),
        offers: [{ price: entry.from, priceCurrency: 'VND' }],
        isFree: false,
        asOf
      }
    }

    case 'perTicket': {
      const nums = entry.tickets.map(t => t.amount)
      if (nums.length === 0) return null
      const low = Math.min(...nums)
      return {
        label: tpl.perTicketFrom(formatPrice(low, lang)),
        offers: entry.tickets.map(t => ({
          price: t.amount,
          priceCurrency: 'VND' as const,
          name: t.name
        })),
        isFree: false
      }
    }

    default:
      return null
  }
}
