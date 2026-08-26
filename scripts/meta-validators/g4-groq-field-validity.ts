/**
 * Meta-validator G4: GROQ query field validity.
 *
 * Trích field name từ GROQ queries trong src/lib/queries/*.ts,
 * so sánh với CONTENT_MODEL để phát hiện query gọi field không tồn tại.
 * Field ảo → GROQ trả null âm thầm → render rỗng, không ai biết.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
const QUERIES_DIR = resolve(REPO_ROOT, 'src', 'lib', 'queries')
const REPORT_DIR = resolve(REPO_ROOT, 'scripts', 'reports')

// ── Valid fields per entity from CONTENT_MODEL ──
// Common fields (§2.0) + entity-specific fields (§2.1–2.14)
// Also includes internal/system fields

const SYSTEM_FIELDS = new Set([
  '_id', '_type', '_createdAt', '_updatedAt', '_rev',
  'reviewStatus', 'approvedBy', 'contentProvenance',
  'publishedAt', 'updatedAt',
])

const COMMON_FIELDS: Record<string, string[]> = {
  // §2.0 fields available to all entities (some may not apply to specific types)
  common: [
    'title', 'slug', 'language', 'translationGroup',
    'summary', 'mainImage', 'seo', 'category',
    'imageProvenance',
  ],
}

const COMMON_SUB_FIELDS: Record<string, string[]> = {
  mainImage: ['asset', 'alt', 'caption', 'crop', 'hotspot'],
  seo: ['metaTitle', 'metaDescription'],
  slug: ['current'],
  address: ['street', 'ward', 'district', 'locality', 'postalCode'],
  geo: ['lat', 'lng', 'alt'],
  openingHours: ['open', 'close', 'days'],
  containedInPlace: ['_id', '_type', 'title', 'slug', 'sameAs', 'containedInPlaceRef', 'geo'],
}

const ENTITY_FIELDS: Record<string, string[]> = {
  touristDestination: [
    'sameAs', 'geo', 'containedInPlaceRef', 'body',
    'keyFacts', 'homepageBanners', 'highlights', 'faq', 'gallery',
    'featuredAttractions', 'featuredStays', 'featuredExperiences',
    'featuredSpecialties', 'featuredTours', 'relatedDestinations',
    'safetyNote', 'speakable',
  ],
  place: [
    'placeType', 'sameAs', 'geo', 'address', 'containedInPlace',
    'containsPlace', 'hasMap', 'accessInfo', 'openingHours',
    'isAccessibleForFree', 'body', 'gallery', 'highlights', 'faq', 'destination',
  ],
  attraction: [
    'attractionType', 'sameAs', 'officialSource', 'geo', 'address',
    'containedInPlace', 'bookingRef', 'openingHours', 'isAccessibleForFree',
    'accessInfo', 'hasMap', 'telephone', 'body', 'gallery', 'highlights', 'faq', 'destination',
  ],
  experience: [
    'experienceType', 'venue', 'isAccessibleForFree', 'duration',
    'includes', 'touristType', 'geo', 'bookingRef',
    'body', 'gallery', 'highlights', 'faq', 'destination',
  ],
  restaurant: [
    'geo', 'address', 'officialSource', 'sameAs',
    'servesCuisine', 'servesSpecialty', 'containedInPlace',
    'openingHours', 'acceptsReservations', 'hasMenu', 'telephone',
    'body', 'gallery', 'highlights', 'faq', 'destination',
  ],
  specialty: [
    'specialtyType', 'sameAs', 'originNote', 'season',
    'whereToTry', 'body', 'gallery', 'faq', 'destination',
  ],
  hotel: [
    'geo', 'address', 'officialSource', 'sameAs', 'starRating',
    'amenityFeature', 'checkinTime', 'checkoutTime', 'numberOfRooms',
    'petsAllowed', 'containedInPlace', 'bookingRef', 'beachAccess',
    'accessInfo', 'body', 'gallery', 'highlights', 'faq', 'destination',
  ],
  resort: [
    'geo', 'address', 'officialSource', 'sameAs', 'starRating',
    'amenityFeature', 'checkinTime', 'checkoutTime', 'numberOfRooms',
    'petsAllowed', 'containedInPlace', 'bookingRef', 'beachAccess',
    'accessInfo', 'body', 'gallery', 'highlights', 'faq',
    'beachfront', 'onSiteActivities', 'landArea', 'destination',
  ],
  tour: [
    'itinerary', 'operator', 'tourFormat', 'tripOrigin',
    'departureNote', 'duration', 'includes', 'excludes',
    'touristType', 'seasonNote', 'bookingRef',
    'body', 'gallery', 'highlights', 'faq', 'destination',
  ],
  organization: [
    'orgType', 'url', 'officialSource', 'sameAs', 'logo',
    'geo', 'address', 'telephone', 'licenseInfo', 'body',
  ],
  event: [
    'eventType', 'startDate', 'endDate', 'location', 'organizer',
    'eventStatus', 'isAccessibleForFree', 'bookingRef', 'ticketUrl',
    'body', 'gallery', 'faq', 'destination',
  ],
  article: [
    'articleType', 'author', 'body', 'about', 'mentions',
    'faq', 'howTo', 'language', 'destination',
  ],
  person: [
    'sameAs', 'jobTitle', 'knowsAbout', 'url', 'bio',
  ],
  category: [
    'name', 'description', 'inDefinedTermSet', 'termCode',
    'slug', 'sameAs',
  ],
}

// Entity type → GROQ query file mapping
const QUERY_FILES: Record<string, string> = {
  touristDestination: 'touristDestination.ts',
  place: 'place.ts',
  attraction: 'attraction.ts',
  experience: 'experience.ts',
  restaurant: 'restaurant.ts',
  specialty: 'specialty.ts',
  hotel: 'hotel.ts',
  resort: 'resort.ts',
  tour: 'tour.ts',
  organization: 'organization.ts',
  event: 'event.ts',
  article: 'article.ts',
  person: 'person.ts',
  category: 'category.ts',
}

// ── Build valid field set per entity ──

function buildValidFields(entityType: string): Set<string> {
  const fields = new Set([...SYSTEM_FIELDS])
  for (const f of COMMON_FIELDS.common) fields.add(f)
  const entitySpecific = ENTITY_FIELDS[entityType] || []
  for (const f of entitySpecific) fields.add(f)
  return fields
}

// ── Extract field names from a GROQ query string ──

function extractGroqFields(queryStr: string): Set<string> {
  const fields = new Set<string>()

  // Remove comments (// ... and /* ... */)
  const noComments = queryStr
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

  // Split into lines within projection braces
  // Find the main projection block after the filter
  const projMatch = noComments.match(/\][^{]*\{([\s\S]*)\}$/)
  const projBlock = projMatch ? projMatch[1] : noComments

  // Extract field references from projection
  // Patterns:
  //   1. fieldName,  (bare field)
  //   2. "alias": fieldName  (aliased)
  //   3. "alias": fieldName.subField  (localized)
  //   4. fieldName { sub }  (sub-object)
  //   5. fieldName->{ sub }  (dereference)

  // Pattern: bare field names (not inside strings, not after . or ->)
  // Match identifiers at the start of projection lines
  const lines = projBlock.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//')) continue

    // Skip fragment references ${...}
    if (trimmed.startsWith('$')) continue

    // Extract bare field names: word at start of line or after comma
    // "fieldName," or "fieldName {" or "fieldName->"
    const bareMatch = trimmed.match(/^(\w+)\s*(?:,|\{|->|$)/)
    if (bareMatch && !bareMatch[1].startsWith('coalesce') && !bareMatch[1].startsWith('count')) {
      const name = bareMatch[1]
      if (name && name.length > 1) fields.add(name)
    }

    // Extract field names from aliased patterns: "alias": fieldName...
    const aliasMatch = trimmed.match(/"\w+"\s*:\s*(\w+)/)
    if (aliasMatch && !aliasMatch[1].startsWith('coalesce')) {
      fields.add(aliasMatch[1])
    }

    // Extract field names from localized access: fieldName.lang
    const localizedMatch = trimmed.match(/"\w+"\s*:\s*(\w+)\./)
    if (localizedMatch) {
      fields.add(localizedMatch[1])
    }
  }

  return fields
}

// ── Compare ──

interface DriftItem {
  entityType: string
  file: string
  field: string
  diff: string
  severity: 'fail' | 'warn'
  detail: string
}

function validateEntityGroq(
  entityType: string,
  queryFile: string,
  validFields: Set<string>,
): DriftItem[] {
  const drifts: DriftItem[] = []
  const filePath = resolve(QUERIES_DIR, queryFile)

  let content: string
  try {
    content = readFileSync(filePath, 'utf-8')
  } catch {
    return [{
      entityType, file: queryFile, field: '—',
      diff: 'query_file_missing',
      severity: 'fail',
      detail: `Không đọc được file query ${queryFile}`,
    }]
  }

  // Extract all groq`` template literals
  const groqBlocks = content.match(/`[\s\S]*?`/g) || []
  if (groqBlocks.length === 0) {
    return [{
      entityType, file: queryFile, field: '—',
      diff: 'no_groq_found',
      severity: 'warn',
      detail: `Không tìm thấy GROQ template literal trong ${queryFile}`,
    }]
  }

  const queryFields = new Set<string>()
  for (const block of groqBlocks) {
    // Skip non-GROQ template literals (like import paths)
    if (block.includes('import') || block.includes('from')) continue
    const fields = extractGroqFields(block)
    for (const f of fields) queryFields.add(f)
  }

  // Known false-positives: fields used in coalesce() or as string values
  const IGNORE = new Set(['current', 'vi', 'en', 'zh', 'ko', 'ru', 'lang'])
  for (const f of IGNORE) queryFields.delete(f)

  // Check each query field against valid fields
  for (const field of queryFields) {
    if (field.startsWith('_')) continue // system fields already in valid set
    if (validFields.has(field)) continue

    drifts.push({
      entityType, file: queryFile, field,
      diff: 'field_not_in_content_model',
      severity: 'warn',
      detail: `GROQ query trong ${queryFile} gọi field "${field}" nhưng field này không có trong CONTENT_MODEL cho ${entityType} — có thể trả null`,
    })
  }

  return drifts
}

// ── Main ──

function main() {
  console.log('=== Meta-validator G4: GROQ field validity ===\n')

  const allDrifts: DriftItem[] = []

  for (const [entityType, queryFile] of Object.entries(QUERY_FILES)) {
    const validFields = buildValidFields(entityType)
    const drifts = validateEntityGroq(entityType, queryFile, validFields)
    allDrifts.push(...drifts)

    if (drifts.length === 0) {
      console.log(`  [pass] ${entityType}`)
    }
  }

  if (allDrifts.length === 0) {
    console.log('\n[pass] Tất cả GROQ query dùng field hợp lệ. Không drift.')
  } else {
    console.log(`\n[DRIFT] ${allDrifts.length} field không có trong CONTENT_MODEL:\n`)

    const byFile = new Map<string, DriftItem[]>()
    for (const d of allDrifts) {
      const key = d.file
      if (!byFile.has(key)) byFile.set(key, [])
      byFile.get(key)!.push(d)
    }

    for (const [file, items] of byFile) {
      console.log(`  ── ${file} ──`)
      for (const d of items) {
        console.log(`    [${d.severity.toUpperCase()}] ${d.field}: ${d.detail}`)
      }
      console.log()
    }
  }

  const report = {
    ranAt: new Date().toISOString(),
    summary: {
      total: allDrifts.length,
    },
    drifts: allDrifts.map(d => ({
      entityType: d.entityType, file: d.file, field: d.field,
      diff: d.diff, detail: d.detail,
    })),
  }
  mkdirSync(REPORT_DIR, { recursive: true })
  writeFileSync(resolve(REPORT_DIR, 'g4-groq-field-validity.json'), JSON.stringify(report, null, 2), 'utf-8')
  console.log(`[report] Ghi scripts/reports/g4-groq-field-validity.json`)
}

main()
