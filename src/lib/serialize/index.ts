// serialize/index.ts — Barrel export cho tất cả JSON-LD serializer
// Nguồn: 01-CONTENT_MODEL.md §5 (nguyên tắc serialize)

// Utils
export {
  urlForEntity, ldRoot, imageToLd, galleryToLd, imagesToLd,
  geoToLd, addressToLd, faqToLd, faqPageToLd,
  openingHoursToLd, keyFactsToLd, sameAsToLd,
  refToUrl, refToLdRef, portableTextToDescription,
  speakableToLd, applyPriceToJsonLd,
  entityWebPageToLd, entityPageGraphToLd,
  stripCiteMarkers, sanitizeLd, jsonLdScriptContent, TYPE_LD_MAP
} from './utils'

// Shared lodging base
export { lodgingToJsonLdBase } from './lodgingBase'

// B8.5.1
export { categoryToJsonLd } from './category'
export { personToJsonLd } from './person'
export { touristDestinationToJsonLd } from './touristDestination'
export { placeToJsonLd } from './place'

// B8.5.2
export { attractionToJsonLd } from './attraction'
export { experienceToJsonLd } from './experience'
export { restaurantToJsonLd } from './restaurant'
export { specialtyToJsonLd } from './specialty'

// B8.5.3
export { hotelToJsonLd } from './hotel'
export { resortToJsonLd } from './resort'
export { tourToJsonLd } from './tour'
export { organizationToJsonLd } from './organization'
export { eventToJsonLd } from './event'
export { articleToJsonLd } from './article'

// B8.7 — CollectionPage listing
export { collectionPageToJsonLd, termToJsonLd } from './collection'
export type { CollectionPageInput, TermPageInput } from './collection'

// Types
export type { JsonLdObject } from '../types'
