// serialize/restaurant.ts — JSON-LD serialize cho Restaurant
// Nguồn: 01-CONTENT_MODEL.md §2.5
// @type Restaurant (subtype FoodEstablishment)

import type { RestaurantResult, Lang } from '../types'
import {
  ldRoot, imagesToLd, geoToLd, addressToLd, sameAsToLd,
  openingHoursToLd, faqPageToLd, portableTextToDescription,
  refToLdRef, sanitizeLd
} from './utils'

/**
 * Serialize Restaurant → JSON-LD Restaurant.
 *
 * Mapping:
 *   title → name
 *   summary + body → description
 *   geo → geo
 *   address → address
 *   officialSource → url
 *   sameAs → sameAs
 *   servesCuisine → servesCuisine
 *   servesSpecialty → makesOffer (Offer/itemOffered trỏ Specialty; không giá, I1 giữ nguyên)
 *   containedInPlace → containedInPlace
 *   openingHours → openingHoursSpecification
 *   acceptsReservations → boolean
 *   hasMenu → hasMenu
 *   telephone → telephone
 *   faq → subjectOf FAQPage
 *
 * Cấm: priceRange, aggregateRating, review (không UGC phase 1)
 */
export function restaurantToJsonLd(
  restaurant: RestaurantResult,
  baseUrl: string,
  lang?: Lang
): Record<string, unknown> {
  const ld = ldRoot(baseUrl, 'Restaurant', 'restaurant', restaurant.slug, lang)

  // name
  ld['name'] = restaurant.title

  // description
  const descParts: string[] = []
  if (restaurant.summary) descParts.push(restaurant.summary)
  if (restaurant.body) {
    const bodyText = portableTextToDescription(restaurant.body)
    if (bodyText) descParts.push(bodyText)
  }
  if (descParts.length > 0) ld['description'] = descParts.join('\n\n')

  // image: mainImage + gallery gộp một mảng
  const img = imagesToLd(restaurant.mainImage, restaurant.gallery, lang)
  if (img) ld['image'] = img

  // geo
  const geo = geoToLd(restaurant.geo)
  if (geo) ld['geo'] = geo

  // address
  const addr = addressToLd(restaurant.address)
  if (addr) ld['address'] = addr

  // url = officialSource
  if (restaurant.officialSource) ld['url'] = restaurant.officialSource

  // sameAs
  if (restaurant.sameAs && restaurant.sameAs.length > 0) {
    ld['sameAs'] = sameAsToLd(restaurant.sameAs)
  }

  // servesCuisine
  if (restaurant.servesCuisine && restaurant.servesCuisine.length > 0) {
    ld['servesCuisine'] = restaurant.servesCuisine
  }

  // servesSpecialty → makesOffer (Organization property, LocalBusiness kế thừa).
  // Offer/itemOffered là cạnh hợp lệ duy nhất Restaurant → Product; không giá (I1).
  // Trước đây gán nhầm vào hasMenu (sai kiểu: hasMenu expect Menu/URL, không phải Product).
  if (restaurant.servesSpecialty && restaurant.servesSpecialty.length > 0) {
    const offers = restaurant.servesSpecialty
      .map(s => {
        const item = refToLdRef(baseUrl, s, lang)
        return item ? { '@type': 'Offer', itemOffered: item } : null
      })
      .filter(Boolean)
    if (offers.length > 0) ld['makesOffer'] = offers
  }

  // containedInPlace
  if (restaurant.containedInPlace) {
    const parent = refToLdRef(baseUrl, restaurant.containedInPlace, lang)
    if (parent) ld['containedInPlace'] = parent
  }

  // openingHours
  const oh = openingHoursToLd(restaurant.openingHours)
  if (oh) {
    ld['openingHoursSpecification'] = oh
  }

  // acceptsReservations
  if (typeof restaurant.acceptsReservations === 'boolean') {
    ld['acceptsReservations'] = restaurant.acceptsReservations
  }

  // hasMenu (link menu chính thức bên ngoài)
  if (restaurant.hasMenu) ld['hasMenu'] = restaurant.hasMenu

  // telephone
  if (restaurant.telephone) ld['telephone'] = restaurant.telephone

  // faq → subjectOf
  const faqPage = faqPageToLd(restaurant.faq, baseUrl, 'restaurant', restaurant.slug, lang)
  if (faqPage) ld['subjectOf'] = faqPage

  return sanitizeLd(ld)
}
