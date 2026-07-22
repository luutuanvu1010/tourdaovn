// Kiểm output sau field-mapper, theo CONTENT_MODEL §2.2 (Place I12) và §2.3 (Attraction I12),
// gate sameAs I2, khung geo DESIGN AUD-09.
import { CLASSIFY_ENUMS, CLASSIFY_FIELD_BY_ENTITY, VENUE_ATTRACTION_TYPES } from './classify'

const VN_LAT_RANGE: [number, number] = [8, 24]
const VN_LNG_RANGE: [number, number] = [102, 110]

const ENCYCLOPEDIC_ATTRACTION_TYPES = new Set(['historic', 'temple', 'church', 'museum'])

export function validateOutput(
  entityType: string,
  mapped: Record<string, any>,
): { ok: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // geo
  const geo = mapped.geo
  if (geo && typeof geo === 'object' && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
    const [latMin, latMax] = VN_LAT_RANGE
    const [lngMin, lngMax] = VN_LNG_RANGE
    if (geo.lat < latMin || geo.lat > latMax || geo.lng < lngMin || geo.lng > lngMax) {
      errors.push(`geo ngoài khung Việt Nam/Khánh Hòa [${latMin},${latMax}]×[${lngMin},${lngMax}]: lat=${geo.lat}, lng=${geo.lng}`)
    }
  }

  // sameAs (gate I2): bắt buộc cho place, và attraction nhóm bách khoa
  const sameAs: string[] = Array.isArray(mapped.sameAs) ? mapped.sameAs : []
  const hasWikiSameAs = sameAs.some(
    (u) => typeof u === 'string' && (u.includes('wikidata.org') || u.includes('wikipedia.org')),
  )
  const requiresSameAs =
    entityType === 'place' ||
    (entityType === 'attraction' && ENCYCLOPEDIC_ATTRACTION_TYPES.has(mapped.attractionType))
  if (requiresSameAs && !hasWikiSameAs) {
    errors.push('Thiếu sameAs Wikidata/Wikipedia (gate I2)')
  }

  // slug
  const slugCurrent = mapped.slug?.vi?.current
  if (!slugCurrent || String(slugCurrent).trim() === '') {
    errors.push('Thiếu slug.vi.current')
  }

  // gate publish tối thiểu: title, summary (slug đã kiểm ở trên)
  if (!mapped.title?.vi || String(mapped.title.vi).trim() === '') {
    errors.push('Thiếu title')
  }
  if (!mapped.summary?.vi || String(mapped.summary.vi).trim() === '') {
    errors.push('Thiếu summary')
  }

  // containedInPlace: P3 reference-resolver lo, không error ở P2
  if (mapped.containedInPlace === undefined) {
    warnings.push('Thiếu containedInPlace — P3 reference resolver xử lý')
  }

  // entity quá thưa
  const filledCount = Object.keys(mapped).filter((k) => mapped[k] !== undefined).length
  if (filledCount < 3) {
    warnings.push('Entity quá thưa: dưới 3 field đã điền')
  }

  // P5 — specialty: sameAs bắt buộc (gate I17, CONTENT_MODEL §2.14). Nhánh riêng, không đụng
  // requiresSameAs/hasWikiSameAs (I2) ở trên.
  if (entityType === 'specialty' && !hasWikiSameAs) {
    errors.push('Thiếu sameAs Wikidata/Wikipedia (gate I17, specialty)')
  }

  // P5 — venue thương mại (restaurant/hotel/resort): officialSource chưa có nguồn tự
  // động ổn định. CẢNH BÁO, không chặn ở tầng synthesis — đợi harvester/người.
  const P5_VENUE_TYPES = new Set(['restaurant', 'hotel', 'resort'])
  if (P5_VENUE_TYPES.has(entityType)) {
    if (!mapped.officialSource) {
      warnings.push('Thiếu officialSource — cần harvester/người (R5)')
    }
  }

  // P5 — tour: itinerary/operator/tourFormat (gate I14, CONTENT_MODEL §2.8). itinerary/operator
  // không có resolver reference trong P5 (R6, để đợt sau) nên CẢNH BÁO chứ không chặn ở tầng
  // synthesis; tourFormat cảnh báo khi nguồn không nêu rõ (người điền).
  if (entityType === 'tour') {
    if (mapped.itinerary === undefined) {
      warnings.push('Thiếu itinerary (gate I14) — cần resolve thủ công (R6)')
    }
    if (mapped.operator === undefined) {
      warnings.push('Thiếu operator (gate I14) — cần resolve thủ công (R6)')
    }
    if (mapped.tourFormat === undefined) {
      warnings.push('Thiếu tourFormat (gate I14) — người điền nếu nguồn không nêu rõ')
    }
  }

  // N5b — field phân loại (gate I12): place→placeType, attraction→attractionType,
  // specialty→specialtyType. Thiếu → CẢNH BÁO "cần điền trước publish" (founder điền tay, R2).
  // Có giá trị ngoài enum đóng → FAIL (defense-in-depth: mapper đã chặn, đây là lưới cuối).
  const classifyField = CLASSIFY_FIELD_BY_ENTITY[entityType]
  if (classifyField) {
    const val = mapped[classifyField]
    if (val === undefined || val === null || String(val).trim() === '') {
      warnings.push(`${classifyField} thiếu — cần điền trước publish (gate I12)`)
    } else if (!CLASSIFY_ENUMS[classifyField].includes(String(val))) {
      errors.push(`${classifyField} "${val}" ngoài enum đóng (gate I12)`)
    }
  }

  // N5b R3 — attraction nhóm venue thương mại: cần officialSource. Synthesis
  // KHÔNG tự bịa (chưa có on-page harvester N3) → CẢNH BÁO để founder biết, không chặn ở tầng này.
  if (entityType === 'attraction' && VENUE_ATTRACTION_TYPES.includes(String(mapped.attractionType))) {
    if (!mapped.officialSource) {
      warnings.push('Venue (attractionType) cần officialSource — gate I2, synthesis không tự bịa (R3)')
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}
