// Bảng field theo entity — nguồn duy nhất cho field-mapper whitelist + fieldDiff (P5).
// Field list bám CONTENT_MODEL §2.0 (chung), §2.2 (Place), §2.3 (Attraction), §2.5 (Restaurant),
// §2.0b+2.6+2.7 (Hotel/Resort qua LodgingBase), §2.8 (Tour), §2.14 (Specialty).
//
// Lưu ý field bị loại dù gate-table cũ (đợt P5) có nhắc tới, vì không tồn tại trong CONTENT_MODEL
// cho đúng entity đó (R2 — không bịa field ngoài model):
//   - restaurant, tour: KHÔNG có accessInfo (chỉ Place/Attraction/Hotel/Resort có field này)
//   - specialty: KHÔNG có highlights ("loại có chủ ý" 2.14 — body đủ), KHÔNG có servesCuisine
//     (chỉ Restaurant có, property FoodEstablishment)
//   - specialty, tour: KHÔNG có geo/containedInPlace; tour KHÔNG có sameAs
// officialSource nằm trong whitelist (field thật của Restaurant/Hotel/Resort, gate I3) nhưng
// KHÔNG nằm trong field LLM được xin (R1/Cấm) — venue.ts không request nó, để trống chờ
// harvester/người (R5). geo/address là optional, điền khi có nguồn chắc.

// Base dùng chung place + attraction (gần như trùng field). Tách riêng để field phân loại của
// từng entity KHÔNG rò sang entity kia: placeType chỉ thuộc place, attractionType chỉ thuộc
// attraction (N5b). placeType KHÔNG có trong ATTRACTION_FIELDS, attractionType KHÔNG có trong
// PLACE_FIELDS.
const PLACE_ATTRACTION_BASE = [
  'title', 'summary', 'body', 'geo', 'sameAs', 'containedInPlace',
  'highlights', 'faq', 'accessInfo', 'openingHours', 'isAccessibleForFree',
  'mainImage', 'gallery', 'hasMap',
]

export const PLACE_FIELDS = [...PLACE_ATTRACTION_BASE, 'placeType']

export const ATTRACTION_FIELDS = [...PLACE_ATTRACTION_BASE, 'officialSource', 'attractionType']

export const RESTAURANT_FIELDS = [
  'title', 'summary', 'body', 'highlights', 'faq', 'mainImage', 'gallery',
  'geo', 'sameAs', 'containedInPlace', 'officialSource',
  'servesCuisine', 'openingHours', 'telephone',
]

// Dùng chung cho 'hotel' và 'resort' (LodgingBase, §2.0b).
// Beachfront/onSiteActivities/landArea (Resort) không vào template P5 (gate table không xin).
export const HOTEL_FIELDS = [
  'title', 'summary', 'body', 'highlights', 'faq', 'mainImage', 'gallery',
  'geo', 'sameAs', 'containedInPlace', 'officialSource',
  'amenityFeature', 'accessInfo', 'starRating', 'numberOfRooms',
]

export const SPECIALTY_FIELDS = [
  'title', 'summary', 'body', 'faq', 'mainImage', 'gallery',
  'sameAs', 'specialtyType', 'originNote', 'season',
]

export const TOUR_FIELDS = [
  'title', 'summary', 'body', 'highlights', 'faq', 'mainImage', 'gallery',
  'itinerary', 'operator', 'tourFormat', 'includes', 'excludes', 'departureNote', 'duration',
]

// CONTENT_MODEL §2.4: prose-only fields. experienceType (reference Category) và venue
// (reference Attraction/Hotel/Resort/Place) do resolver xử lý, KHÔNG nằm trong LLM extraction.
// geo kế thừa venue nếu trống, suy ở build.
export const EXPERIENCE_FIELDS = [
  'title', 'summary', 'body', 'faq', 'mainImage', 'gallery',
  'duration', 'includes', 'touristType', 'isAccessibleForFree',
]

export const ENTITY_FIELDS: Record<string, string[]> = {
  place: PLACE_FIELDS,
  attraction: ATTRACTION_FIELDS,
  restaurant: RESTAURANT_FIELDS,
  hotel: HOTEL_FIELDS,
  resort: HOTEL_FIELDS,
  specialty: SPECIALTY_FIELDS,
  tour: TOUR_FIELDS,
  experience: EXPERIENCE_FIELDS,
}

export const KNOWN_ENTITY_TYPES = Object.keys(ENTITY_FIELDS)

export function fieldsFor(entityType: string): string[] {
  return ENTITY_FIELDS[entityType] ?? PLACE_FIELDS
}
