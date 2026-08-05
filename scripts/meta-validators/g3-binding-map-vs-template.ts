/**
 * Meta-validator G3: BINDING_MAP vs Astro template field access.
 *
 * Kiểm: mỗi vùng giao diện khai trong BINDING_MAP có được template Astro
 * render đúng field không. Phát hiện: field có trong BINDING_MAP nhưng
 * template không dùng → vùng câm; field template dùng nhưng BINDING_MAP
 * không khai → dữ liệu không được đặc tả.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
// Xem ghi chú cùng loại ở g1: spec sống ở docs/core-specs/, không phải project/.
const BINDING_MAP_PATH = resolve(REPO_ROOT, 'docs', 'core-specs', '06-BINDING_MAP.md')
const COMPONENTS_DIR = resolve(REPO_ROOT, 'src', 'components')
const REPORT_DIR = resolve(REPO_ROOT, 'scripts', 'reports')

// ── Entity → template file mapping ──
const ENTITY_TEMPLATES: Record<string, string> = {
  place: 'PlaceDetail.astro',
  attraction: 'AttractionDetail.astro',
  experience: 'ExperienceDetail.astro',
  restaurant: 'RestaurantDetail.astro',
  specialty: 'SpecialtyDetail.astro',
  hotel: 'LodgingDetail.astro',
  resort: 'LodgingDetail.astro',
  tour: 'TourDetail.astro',
  event: 'EventDetail.astro',
  article: 'ArticleDetail.astro',
  person: 'PersonDetail.astro',
  organization: 'OrganizationDetail.astro',
}

// ── BINDING_MAP data sources per entity ──
// Manually extracted from BINDING_MAP §3 (common frame) + §4 (deltas).
// Each entry: { zone: string, sources: string[], required: boolean }
// "sources" are the Sanity field names (without "data." prefix)

interface ZoneDef {
  zone: string
  sources: string[]     // Sanity field names
  required: boolean
  note?: string
}

const COMMON_FRAME_ZONES: ZoneDef[] = [
  { zone: 'Hero (title+image)', sources: ['title', 'mainImage'], required: true },
  { zone: 'Summary', sources: ['summary'], required: true },
  { zone: 'Body', sources: ['body'], required: false },
  { zone: 'Gallery', sources: ['gallery'], required: false },
  { zone: 'Highlights', sources: ['highlights'], required: false },
  { zone: 'FAQ', sources: ['faq'], required: false },
  { zone: 'Updated date', sources: ['_updatedAt'], required: true },
]

const ENTITY_DELTA_ZONES: Record<string, ZoneDef[]> = {
  place: [
    { zone: 'Map/Location', sources: ['geo', 'address', 'hasMap'], required: false },
    { zone: 'Access info', sources: ['accessInfo'], required: false },
    { zone: 'Hours & admission', sources: ['openingHours', 'isAccessibleForFree'], required: false },
  ],
  attraction: [
    { zone: 'Map/Location', sources: ['geo', 'address', 'hasMap'], required: false },
    { zone: 'Official source', sources: ['officialSource'], required: false },
    { zone: 'Hours & admission', sources: ['openingHours', 'isAccessibleForFree'], required: false },
    { zone: 'Access info', sources: ['accessInfo'], required: false },
  ],
  experience: [
    { zone: 'Experience type', sources: ['experienceType'], required: true },
    { zone: 'Venue', sources: ['venue'], required: true },
    { zone: 'Duration', sources: ['duration'], required: false },
    { zone: 'Includes', sources: ['includes'], required: false },
    { zone: 'Tourist type', sources: ['touristType'], required: false },
  ],
  restaurant: [
    { zone: 'Map/Location', sources: ['geo', 'address'], required: false },
    { zone: 'Official source', sources: ['officialSource'], required: false },
    { zone: 'Specialties served', sources: ['servesSpecialty'], required: false },
    { zone: 'Cuisine', sources: ['servesCuisine'], required: false },
    { zone: 'Hours', sources: ['openingHours'], required: false },
    { zone: 'Phone CTA', sources: ['telephone'], required: false },
    { zone: 'Reservations', sources: ['acceptsReservations'], required: false },
    { zone: 'Menu', sources: ['hasMenu'], required: false },
  ],
  specialty: [
    { zone: 'Type', sources: ['specialtyType'], required: true },
    { zone: 'Origin note', sources: ['originNote'], required: false },
    { zone: 'Season', sources: ['season'], required: false },
    { zone: 'Where to try', sources: ['whereToTry'], required: false },
  ],
  hotel: [
    { zone: 'Map/Location', sources: ['geo', 'address'], required: false },
    { zone: 'Official source', sources: ['officialSource'], required: false },
    { zone: 'Star rating', sources: ['starRating'], required: false },
    { zone: 'Amenities', sources: ['amenityFeature'], required: false },
    { zone: 'Check-in/out', sources: ['checkinTime', 'checkoutTime'], required: false },
    { zone: 'Rooms & pets', sources: ['numberOfRooms', 'petsAllowed'], required: false },
    { zone: 'Beach access', sources: ['beachAccess'], required: false },
    { zone: 'Access info', sources: ['accessInfo'], required: false },
  ],
  resort: [
    { zone: 'Map/Location', sources: ['geo', 'address'], required: false },
    { zone: 'Official source', sources: ['officialSource'], required: false },
    { zone: 'Star rating', sources: ['starRating'], required: false },
    { zone: 'Amenities', sources: ['amenityFeature'], required: false },
    { zone: 'Check-in/out', sources: ['checkinTime', 'checkoutTime'], required: false },
    { zone: 'Rooms & pets', sources: ['numberOfRooms', 'petsAllowed'], required: false },
    { zone: 'Beach access', sources: ['beachAccess'], required: false },
    { zone: 'Access info', sources: ['accessInfo'], required: false },
    { zone: 'Beachfront & land area', sources: ['beachfront', 'landArea'], required: false },
    { zone: 'On-site activities', sources: ['onSiteActivities'], required: false },
  ],
  tour: [
    { zone: 'Itinerary', sources: ['itinerary'], required: true },
    { zone: 'Operator', sources: ['operator'], required: true },
    { zone: 'Tour format', sources: ['tourFormat'], required: true },
    { zone: 'Trip origin', sources: ['tripOrigin'], required: false },
    { zone: 'Departure note', sources: ['departureNote'], required: false },
    { zone: 'Duration', sources: ['duration'], required: false },
    { zone: 'Includes/Excludes', sources: ['includes', 'excludes'], required: false },
    { zone: 'Tourist type', sources: ['touristType'], required: false },
    { zone: 'Season note', sources: ['seasonNote'], required: false },
  ],
  event: [
    { zone: 'Time', sources: ['startDate', 'endDate'], required: true },
    { zone: 'Event status', sources: ['eventStatus'], required: false },
    { zone: 'Location', sources: ['location'], required: true },
    { zone: 'Organizer', sources: ['organizer'], required: false },
    { zone: 'Ticket (3 branches)', sources: ['bookingRef', 'ticketUrl', 'isAccessibleForFree'], required: false },
  ],
  article: [
    { zone: 'Article type', sources: ['articleType'], required: true },
    { zone: 'Author box', sources: ['author'], required: true },
    { zone: 'Publish/update dates', sources: ['publishedAt', '_updatedAt'], required: true },
    { zone: 'How-to steps', sources: ['howTo'], required: false },
    { zone: 'About references', sources: ['about'], required: false },
  ],
  person: [
    { zone: 'Bio', sources: ['bio'], required: true },
    { zone: 'Role & expertise', sources: ['jobTitle', 'knowsAbout'], required: false },
    { zone: 'External profiles', sources: ['sameAs', 'url'], required: false },
  ],
  organization: [
    { zone: 'Logo', sources: ['logo'], required: false },
    { zone: 'Org type', sources: ['orgType'], required: true },
    { zone: 'Website/source', sources: ['url', 'officialSource'], required: true },
    { zone: 'Office location', sources: ['geo', 'address'], required: false },
    { zone: 'Phone CTA', sources: ['telephone'], required: false },
    { zone: 'License info', sources: ['licenseInfo'], required: false },
  ],
}

// ── Step 1: Extract data.xxx field accesses from an Astro template ──

function extractFieldAccesses(templatePath: string): Set<string> {
  const fields = new Set<string>()
  let content: string
  try {
    content = readFileSync(templatePath, 'utf-8')
  } catch {
    return fields
  }

  // Pattern 1: data.fieldName — direct access
  const directPattern = /data\.(\w+)\b/g
  let m: RegExpExecArray | null
  while ((m = directPattern.exec(content)) !== null) {
    const name = m[1]
    // Skip Astro runtime props, destructuring artifacts
    if (name === 'Astro' || name === 'props' || name === 'site' || name === 'url') continue
    fields.add(name)
  }

  return fields
}

// ── Step 2: Compare ──

interface DriftItem {
  entityType: string
  zone: string
  diff: string        // 'zone_source_not_in_template', 'template_field_not_in_map'
  severity: 'fail' | 'warn'
  detail: string
}

function compareForEntity(
  entityType: string,
  zones: ZoneDef[],
  templateFields: Set<string>,
): DriftItem[] {
  const drifts: DriftItem[] = []

  // Skip entities with no template
  if (templateFields.size === 0) {
    drifts.push({
      entityType, zone: '—',
      diff: 'template_not_found',
      severity: 'fail',
      detail: `Không tìm thấy hoặc không parse được template cho ${entityType}`,
    })
    return drifts
  }

  // Check: each zone's sources that are in the template
  for (const zone of zones) {
    const foundSources = zone.sources.filter(s => templateFields.has(s))
    const missingSources = zone.sources.filter(s => !templateFields.has(s))

    // Zone with ALL sources missing → could be unimplemented
    if (foundSources.length === 0 && zone.required) {
      drifts.push({
        entityType, zone: zone.zone,
        diff: 'required_zone_no_source_in_template',
        severity: 'fail',
        detail: `Zone bắt buộc "${zone.zone}" (source=[${zone.sources.join(', ')}]) — KHÔNG field nào trong số này được template truy cập`,
      })
    } else if (foundSources.length === 0 && !zone.required) {
      drifts.push({
        entityType, zone: zone.zone,
        diff: 'optional_zone_no_source_in_template',
        severity: 'warn',
        detail: `Zone tùy chọn "${zone.zone}" (source=[${zone.sources.join(', ')}]) — KHÔNG field nào được template truy cập. Có thể chưa implement hoặc đang xử lý qua component khác.`,
      })
    }
  }

  // Check: template fields NOT in any BINDING_MAP zone
  const allMapSources = new Set<string>()
  for (const zone of zones) {
    for (const s of zone.sources) allMapSources.add(s)
  }
  for (const field of templateFields) {
    // Skip internal fields
    if (field.startsWith('_')) continue
    // Skip structured sub-fields
    if (field === 'children' || field === 'text' || field === 'style' || field === 'type' ||
        field === 'street' || field === 'ward' || field === 'open' || field === 'close') continue

    if (!allMapSources.has(field)) {
      drifts.push({
        entityType, zone: '—',
        diff: 'template_field_not_in_map',
        severity: 'warn',
        detail: `Template truy cập data.${field} nhưng field này không có trong BINDING_MAP cho ${entityType} — dữ liệu không được đặc tả`,
      })
    }
  }

  return drifts
}

// ── Main ──

function main() {
  console.log('=== Meta-validator G3: BINDING_MAP vs template field access ===\n')

  const allDrifts: DriftItem[] = []

  for (const [entityType, templateFile] of Object.entries(ENTITY_TEMPLATES)) {
    const templatePath = resolve(COMPONENTS_DIR, templateFile)

    // Get zones: common frame + entity-specific delta
    const zones = [
      ...COMMON_FRAME_ZONES,
      ...(ENTITY_DELTA_ZONES[entityType] || []),
    ]

    const templateFields = extractFieldAccesses(templatePath)

    console.log(`[${entityType}] ${templateFile}: ${templateFields.size} field accesses`)
    const drifts = compareForEntity(entityType, zones, templateFields)
    allDrifts.push(...drifts)
  }

  // Report
  if (allDrifts.length === 0) {
    console.log('\n[pass] Tất cả template khớp BINDING_MAP. Không drift.')
  } else {
    const failDrifts = allDrifts.filter(d => d.severity === 'fail')
    const warnDrifts = allDrifts.filter(d => d.severity === 'warn')
    console.log(`\n[DRIFT] ${allDrifts.length} điểm không khớp (${failDrifts.length} fail, ${warnDrifts.length} warn):\n`)

    // Group by entity for readability
    const byEntity = new Map<string, DriftItem[]>()
    for (const d of allDrifts) {
      const key = d.entityType
      if (!byEntity.has(key)) byEntity.set(key, [])
      byEntity.get(key)!.push(d)
    }

    for (const [entity, items] of byEntity) {
      console.log(`  ── ${entity} ──`)
      for (const d of items) {
        const tag = d.severity === 'fail' ? 'FAIL' : 'WARN'
        console.log(`    [${tag}] ${d.detail}`)
      }
      console.log()
    }
  }

  // Write report
  const report = {
    ranAt: new Date().toISOString(),
    summary: {
      total: allDrifts.length,
      fail: allDrifts.filter(d => d.severity === 'fail').length,
      warn: allDrifts.filter(d => d.severity === 'warn').length,
    },
    drifts: allDrifts.map(d => ({
      entityType: d.entityType,
      zone: d.zone,
      diff: d.diff,
      severity: d.severity,
      detail: d.detail,
    })),
  }
  mkdirSync(REPORT_DIR, { recursive: true })
  const reportPath = resolve(REPORT_DIR, 'g3-binding-map-vs-template.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`[report] Ghi ${reportPath}`)

  if (allDrifts.some(d => d.severity === 'fail')) {
    console.log('\n[exit] Có drift mức fail — cần sửa trước khi tiếp tục.')
    process.exit(1)
  }

  console.log('\n[exit] Không có drift mức fail.')
}

main()
