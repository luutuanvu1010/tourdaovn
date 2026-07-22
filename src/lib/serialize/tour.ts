// serialize/tour.ts — JSON-LD serialize cho Tour
// Nguồn: 01-CONTENT_MODEL.md §2.8
// @type TouristTrip; itinerary → ItemList giữ thứ tự

import { UI_COPY } from '../uiCopy'
import type { TourResult, TourStop, Lang } from '../types'
import {
  ldRoot, imagesToLd, faqPageToLd, portableTextToDescription,
  refToLdRef, urlForEntity, sanitizeLd, TYPE_LD_MAP
} from './utils'

/**
 * Serialize một stop trong itinerary → ListItem.
 * Nội vùng: deref Place/Attraction.
 * Ngoại vùng: externalStop → Place tối thiểu {name, geo, sameAs}.
 */
function stopToListItem(
  stop: TourStop,
  index: number,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const item: Record<string, unknown> = {
    '@type': 'ListItem',
    position: index + 1
  }

  let itemData: Record<string, unknown>

  if (stop.place) {
    // Điểm nội vùng — deref, @type theo entity thật (Place hoặc TouristAttraction)
    itemData = {
      '@type': TYPE_LD_MAP[stop.place._type] ?? 'Place',
      '@id': urlForEntity(baseUrl, stop.place._type, stop.place.slug, lang),
      name: stop.place.title
    }
  } else if (stop.externalStop) {
    // Điểm ngoại vùng — dữ liệu tối thiểu
    itemData = {
      '@type': 'Place',
      name: stop.externalStop.name
    }
    if (stop.externalStop.geo) {
      itemData['geo'] = {
        '@type': 'GeoCoordinates',
        latitude: stop.externalStop.geo.lat,
        longitude: stop.externalStop.geo.lng
      }
    }
    if (stop.externalStop.sameAs) {
      itemData['sameAs'] = stop.externalStop.sameAs
    }
  } else {
    return item // stop rỗng — bỏ qua
  }

  // Note của stop nhập description của ListItem
  if (stop.note) {
    itemData['description'] = stop.note
  }
  if (stop.durationAtStop) {
    itemData['description'] = (itemData['description'] || '') +
      ` (${stop.durationAtStop})`
  }

  item['item'] = itemData
  return item
}

/**
 * Serialize Tour → JSON-LD TouristTrip.
 *
 * Mapping:
 *   title → name
 *   summary + body → description
 *   itinerary → ItemList (subTrip có thứ tự)
 *   operator → provider (Organization)
 *   tripOrigin → tripOrigin
 *   departureNote, duration, includes, excludes, seasonNote → nhập description (§5.1)
 *   category → additionalType (qua Category.sameAs)
 *   touristType → touristType
 */
export function tourToJsonLd(
  tour: TourResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const additionalTypes: string[] = []
  if (tour.category) {
    for (const cat of tour.category) {
      // category[] trong GROQ đã deref — nếu schema có sameAs
      // Nhưng GROQ fragment category chỉ lấy _id, name, termCode
      // Cần thêm sameAs trong GROQ query → đã thêm ở trên
      const catAny = cat as Record<string, unknown>
      if (catAny.sameAs) additionalTypes.push(catAny.sameAs as string)
    }
  }

  const ld = ldRoot(baseUrl, 'TouristTrip', 'tour', tour.slug, lang)
  if (additionalTypes.length > 0) ld['additionalType'] = additionalTypes

  // name
  ld['name'] = tour.title

  // description
  const descParts: string[] = []
  if (tour.summary) descParts.push(tour.summary)
  if (tour.body) {
    const bodyText = portableTextToDescription(tour.body)
    if (bodyText) descParts.push(bodyText)
  }
  // departureNote, duration, includes, excludes, seasonNote → nhập description (§5.1)
  const L = UI_COPY[lang ?? 'vi'] ?? UI_COPY.vi
  if (tour.departureNote) descParts.push(`${L.departureSchedule}: ${tour.departureNote}`)
  if (tour.duration) descParts.push(`${L.duration}: ${tour.duration}`)
  if (tour.includes && tour.includes.length > 0) {
    descParts.push(`${L.includes}: ${tour.includes.join(', ')}`)
  }
  if (tour.excludes && tour.excludes.length > 0) {
    descParts.push(`${L.excludes}: ${tour.excludes.join(', ')}`)
  }
  if (tour.seasonNote) descParts.push(`${L.season}: ${tour.seasonNote}`)
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // image: mainImage + gallery gộp một mảng (photo không tồn tại trên TouristTrip)
  const img = imagesToLd(tour.mainImage, tour.gallery, lang)
  if (img) ld['image'] = img

  // itinerary → ItemList trực tiếp trên TouristTrip (property thật, CONTENT_MODEL §2.8;
  // subTrip bị loại có chủ ý — tour nhiều ngày chưa có phase 1)
  if (tour.itinerary && tour.itinerary.length > 0) {
    const listItems = tour.itinerary
      .map((stop, i) => stopToListItem(stop, i, baseUrl, lang))
      .filter(li => li['item'])

    if (listItems.length > 0) {
      ld['itinerary'] = {
        '@type': 'ItemList',
        numberOfItems: listItems.length,
        itemListElement: listItems
      }
    }
  }

  // operator → provider
  if (tour.operator) {
    const provider = refToLdRef(baseUrl, tour.operator, lang)
    if (provider) ld['provider'] = provider
  }

  // tripOrigin
  if (tour.tripOrigin) {
    const tripOrigin = refToLdRef(baseUrl, tour.tripOrigin, lang)
    if (tripOrigin) ld['tripOrigin'] = tripOrigin
  }

  // touristType
  if (tour.touristType && tour.touristType.length > 0) {
    ld['touristType'] = tour.touristType
  }

  // faq → subjectOf
  const faqPage = faqPageToLd(tour.faq, baseUrl, 'tour', tour.slug, lang)
  if (faqPage) ld['subjectOf'] = faqPage

  return sanitizeLd(ld)
}
