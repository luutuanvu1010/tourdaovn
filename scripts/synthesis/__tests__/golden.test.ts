// Golden extraction test (R3) — deterministic, KHÔNG gọi LLM/Sanity/HTTP.
// Nạp fixture (giả lập output đã merge prose+resolver) qua mapFields + validateOutput hiện có,
// chứng minh: (a) field MỚI map đúng vị trí/kiểu; (b) field cũ không vỡ; (c) field cấm bị chặn;
// (d) validator trả đúng kỳ vọng theo gate per-entity.
//
// LƯU Ý drift R3(a) ↔ R6/R7: spec R3(a) liệt "operator-text, itinerary-text" vào nhóm "ra giá
// trị nguyên không wrap". Nhưng R6+R7 (ràng buộc cứng, định nghĩa hành vi mapper) nói itinerary
// và operator là TEXT gợi ý → chỉ log cảnh báo, KHÔNG ghi vào mapped (giống containedInPlace),
// vì field thật của chúng là array-of-stop và reference — ghi text thô vào đó tạo dữ liệu sai
// schema (vi phạm R2/R6). Test này theo R6/R7: assert itinerary/operator KHÔNG vào mapped + có
// cảnh báo. Đã ghi drift cho Cowork/QA.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mapFields } from '../field-mapper'
import { validateOutput } from '../output-validator'

import { restaurantRawGolden } from './fixtures/restaurant.golden'
import { hotelRawGolden } from './fixtures/hotel.golden'
import { specialtyRawGolden, specialtyRawNoSameAs } from './fixtures/specialty.golden'
import { tourRawGolden, tourRawMinimal } from './fixtures/tour.golden'

const FORBIDDEN_PRICE_KEYS = ['price', 'offers', 'aggregateRating', 'priceRange', 'cost']

function assertNoForbiddenKeys(mapped: Record<string, any>, extra: string[] = []) {
  for (const key of [...FORBIDDEN_PRICE_KEYS, ...extra]) {
    assert.equal(mapped[key], undefined, `field cấm "${key}" KHÔNG được lọt qua mapper`)
  }
}

// localized object {vi: ...}
function assertLocalized(value: any, label: string) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} phải là object localized`)
  assert.ok('vi' in value, `${label} phải có khóa vi`)
}

// ── restaurant (venue) ──────────────────────────────────────────────────────
test('golden restaurant — field mới + cũ map đúng, field cấm bị chặn', () => {
  const { mapped, warnings } = mapFields('restaurant', restaurantRawGolden)

  // (b) field cũ vẫn map đúng {vi:...}
  assertLocalized(mapped.title, 'title')
  assert.equal(mapped.title.vi, 'Nhà hàng Hải Sản Sáu Hơn')
  assertLocalized(mapped.summary, 'summary')
  assertLocalized(mapped.body, 'body')
  assert.ok(Array.isArray(mapped.body.vi), 'body.vi là portable text array')
  assertLocalized(mapped.highlights, 'highlights')
  assert.ok(Array.isArray(mapped.highlights.vi))
  assertLocalized(mapped.faq, 'faq')

  // (a) field MỚI localized → {vi:[...]}
  assertLocalized(mapped.servesCuisine, 'servesCuisine')
  assert.deepEqual(mapped.servesCuisine.vi, ['hải sản', 'món Việt'])

  // (a) field MỚI shared → giá trị nguyên không wrap
  assert.equal(mapped.telephone, '0258 123 4567')

  // openingHours object giữ nguyên cấu trúc
  assert.equal(mapped.openingHours.open, '10:00')

  // containedInPlace text → cảnh báo, KHÔNG vào mapped (P3 resolver lo)
  assert.equal(mapped.containedInPlace, undefined)
  assert.ok(warnings.some(w => w.includes('containedInPlace')), 'có cảnh báo containedInPlace')

  // slug tự sinh
  assert.equal(mapped.slug.vi.current, 'nha-hang-hai-san-sau-hon')

  // (c) field cấm I1 không lọt
  assertNoForbiddenKeys(mapped, ['bookingRef'])

  // (d) validator: venue thiếu officialSource → CẢNH BÁO, không error (R5)
  const v = validateOutput('restaurant', mapped)
  assert.equal(v.ok, true, 'restaurant qua validator (geo/address không phải gate, R5)')
  assert.ok(v.warnings.some(w => w.includes('officialSource')), 'cảnh báo thiếu officialSource (R5)')
})

// ── hotel (venue) ───────────────────────────────────────────────────────────
test('golden hotel — amenityFeature/starRating map đúng, telephone+giá bị bỏ', () => {
  const { mapped } = mapFields('hotel', hotelRawGolden)

  // (a) field MỚI localized
  assertLocalized(mapped.amenityFeature, 'amenityFeature')
  assert.deepEqual(mapped.amenityFeature.vi, ['hồ bơi vô cực', 'gym', 'spa', 'nhà hàng buffet'])
  // (b) accessInfo cũ vẫn map (portable text localized)
  assertLocalized(mapped.accessInfo, 'accessInfo')
  assert.ok(Array.isArray(mapped.accessInfo.vi))

  // (a) field MỚI shared số → nguyên
  assert.equal(mapped.starRating, 5)
  assert.equal(mapped.numberOfRooms, 240)

  // telephone ngoài whitelist hotel (§2.5) → bị bỏ
  assert.equal(mapped.telephone, undefined, 'hotel không có telephone (§2.5)')

  // (c) field cấm I1 không lọt
  assertNoForbiddenKeys(mapped)

  // (d) validator: venue → cảnh báo, không error
  const v = validateOutput('hotel', mapped)
  assert.equal(v.ok, true)
})

test('golden hotel — numberOfRooms bằng 0 bị bỏ để tránh ghi dữ liệu rỗng', () => {
  const { mapped, warnings } = mapFields('hotel', { ...hotelRawGolden, numberOfRooms: 0 })

  assert.equal(mapped.numberOfRooms, undefined)
  assert.ok(warnings.some(w => w.includes('numberOfRooms')), 'có cảnh báo numberOfRooms không hợp lệ')
})

// ── specialty (gate sameAs I17) ─────────────────────────────────────────────
test('golden specialty — originNote/season localized, highlights bị bỏ, gate I17', () => {
  const { mapped } = mapFields('specialty', specialtyRawGolden)

  // (a) field MỚI localized
  assertLocalized(mapped.originNote, 'originNote')
  assertLocalized(mapped.season, 'season')
  // (a) field MỚI shared enum
  assert.equal(mapped.specialtyType, 'dish')
  // sameAs (từ resolver) giữ
  assert.deepEqual(mapped.sameAs, ['https://vi.wikipedia.org/wiki/Nem_nướng'])

  // highlights ngoài whitelist specialty (§2.14 loại có chủ ý) → bị bỏ
  assert.equal(mapped.highlights, undefined, 'specialty không có highlights (§2.14)')

  // (c) field cấm: bookingRef/brand/price không lọt
  assertNoForbiddenKeys(mapped, ['bookingRef', 'brand'])

  // (d) validator: có sameAs → KHÔNG lỗi I17
  const v = validateOutput('specialty', mapped)
  assert.equal(v.ok, true, 'specialty có sameAs qua gate I17')
  assert.ok(!v.errors.some(e => e.includes('I17')), 'không lỗi I17 khi có sameAs')
})

test('golden specialty — thiếu sameAs → error gate I17', () => {
  const { mapped } = mapFields('specialty', specialtyRawNoSameAs)
  const v = validateOutput('specialty', mapped)
  assert.equal(v.ok, false, 'specialty thiếu sameAs phải TRƯỢT')
  assert.ok(v.errors.some(e => e.includes('I17')), 'có lỗi gate I17')
})

// ── tour (itinerary/operator text → R6) ─────────────────────────────────────
test('golden tour — includes/excludes/departureNote localized, itinerary/operator chỉ cảnh báo', () => {
  const { mapped, warnings } = mapFields('tour', tourRawGolden)

  // (b) field cũ
  assertLocalized(mapped.title, 'title')
  assertLocalized(mapped.body, 'body')
  assertLocalized(mapped.highlights, 'highlights')
  assertLocalized(mapped.faq, 'faq')

  // (a) field MỚI localized
  assertLocalized(mapped.includes, 'includes')
  assert.deepEqual(mapped.includes.vi, ['ăn trưa trên tàu', 'thiết bị lặn cơ bản', 'đón tiễn khách sạn'])
  assertLocalized(mapped.excludes, 'excludes')
  assertLocalized(mapped.departureNote, 'departureNote')

  // (a) field MỚI shared
  assert.equal(mapped.tourFormat, 'join-in')
  assert.equal(mapped.duration, 'PT8H')

  // R6: itinerary + operator là TEXT gợi ý → KHÔNG vào mapped, chỉ cảnh báo
  assert.equal(mapped.itinerary, undefined, 'itinerary text KHÔNG vào mapped (R6)')
  assert.equal(mapped.operator, undefined, 'operator text KHÔNG vào mapped (R6)')
  assert.ok(warnings.some(w => w.includes('itinerary')), 'có cảnh báo itinerary (R6)')
  assert.ok(warnings.some(w => w.includes('operator')), 'có cảnh báo operator (R6)')

  // (c) field cấm I1 không lọt
  assertNoForbiddenKeys(mapped)

  // (d) validator: tour có tourFormat (không cảnh báo tourFormat), nhưng itinerary/operator
  // chưa resolve → cảnh báo gate I14, KHÔNG error (R6)
  const v = validateOutput('tour', mapped)
  assert.equal(v.ok, true, 'tour không bị chặn ở tầng synthesis (R6)')
  assert.ok(v.warnings.some(w => w.includes('itinerary')), 'cảnh báo itinerary gate I14')
  assert.ok(v.warnings.some(w => w.includes('operator')), 'cảnh báo operator gate I14')
  assert.ok(!v.warnings.some(w => w.includes('tourFormat')), 'có tourFormat → không cảnh báo tourFormat')
})

test('golden tour minimal — thiếu itinerary/operator/tourFormat → cảnh báo gate I14', () => {
  const { mapped } = mapFields('tour', tourRawMinimal)
  const v = validateOutput('tour', mapped)
  assert.equal(v.ok, true, 'thiếu quan hệ là cảnh báo, không error (R6)')
  assert.ok(v.warnings.some(w => w.includes('itinerary')))
  assert.ok(v.warnings.some(w => w.includes('operator')))
  assert.ok(v.warnings.some(w => w.includes('tourFormat')))
})
