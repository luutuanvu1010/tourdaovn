// serialize/event.ts — JSON-LD serialize cho Event
// Nguồn: 01-CONTENT_MODEL.md §2.10
// @type subtype thật theo eventType — không cần additionalType

import type { EventResult, Lang } from '../types'
import {
  ldRoot, imagesToLd, faqPageToLd, portableTextToDescription,
  refToLdRef, sanitizeLd
} from './utils'

/**
 * Bảng map eventType → @type (đóng, 5.3).
 * Tất cả đều là subtype thật trong schema.org core.
 */
const EVENT_TYPE_MAP: Record<string, string> = {
  festival: 'Festival',
  sports: 'SportsEvent',
  music: 'MusicEvent',
  food: 'FoodEvent',
  exhibition: 'ExhibitionEvent',
  other: 'Event'
}

/**
 * Serialize Event → JSON-LD Event subtype.
 *
 * Kênh vé ba nhánh (ưu tiên giảm dần):
 *   1. bookingRef (mình bán vé) → không xuất JSON-LD (giá ngoài)
 *   2. ticketUrl → offers.url
 *   3. isAccessibleForFree → isAccessibleForFree
 *
 * Mapping:
 *   title → name
 *   summary + body → description
 *   startDate → startDate
 *   endDate → endDate
 *   location → location (deref)
 *   organizer → organizer (deref)
 *   eventStatus → eventStatus
 */
export function eventToJsonLd(
  event: EventResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const ldType = EVENT_TYPE_MAP[event.eventType] ?? 'Event'
  const ld = ldRoot(baseUrl, ldType, 'event', event.slug, lang)

  // name
  ld['name'] = event.title

  // description
  const descParts: string[] = []
  if (event.summary) descParts.push(event.summary)
  if (event.body) {
    const bodyText = portableTextToDescription(event.body)
    if (bodyText) descParts.push(bodyText)
  }
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // image: mainImage + gallery gộp một mảng (photo không tồn tại trên Event)
  const img = imagesToLd(event.mainImage, event.gallery, lang)
  if (img) ld['image'] = img

  // startDate / endDate — guard null từ GROQ (null bị JSON.stringify giữ lại)
  if (event.startDate) ld['startDate'] = event.startDate
  if (event.endDate) ld['endDate'] = event.endDate

  // location
  if (event.location) {
    const location = refToLdRef(baseUrl, event.location, lang)
    if (location) ld['location'] = location
  }

  // organizer
  if (event.organizer) {
    const organizer = refToLdRef(baseUrl, event.organizer, lang)
    if (organizer) ld['organizer'] = organizer
  }

  // eventStatus
  if (event.eventStatus) ld['eventStatus'] = event.eventStatus

  // Kênh vé ba nhánh
  if (event.ticketUrl) {
    // ticketUrl: link kênh vé chính thức bên ngoài
    ld['offers'] = {
      '@type': 'Offer',
      url: event.ticketUrl
    }
  } else if (typeof event.isAccessibleForFree === 'boolean') {
    ld['isAccessibleForFree'] = event.isAccessibleForFree
  }
  // bookingRef có nhưng không xuất JSON-LD (giá thuộc nguồn giá, I1)

  // faq → subjectOf
  const faqPage = faqPageToLd(event.faq, baseUrl, 'event', event.slug, lang)
  if (faqPage) ld['subjectOf'] = faqPage

  return sanitizeLd(ld)
}
