/**
 * Meta-validator G1: CONTENT_MODEL.md §2 vs Sanity schema files.
 *
 * Kiểm P4: đặc tả CONTENT_MODEL là nguồn sự thật cho mọi field.
 * Field có trong schema mà KHÔNG có trong CONTENT_MODEL → fail (vi phạm P4).
 * Field có trong CONTENT_MODEL mà KHÔNG có trong schema → warn (có thể chưa implement).
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
// Spec sống ở docs/core-specs/ trong repo này. Đường dẫn 'project/' là quy ước
// của nhatrangtravel, thư mục đó không tồn tại ở tourdaovn nên validator ném
// ENOENT và cả chuỗi audit:spec chết. Sửa 2026-08-05, xem docs/DRIFT_LOG.md.
const CONTENT_MODEL_PATH = resolve(REPO_ROOT, 'docs', 'core-specs', '01-CONTENT_MODEL.md')
const SCHEMAS_DIR = resolve(REPO_ROOT, 'cms', 'schemas')
const REPORT_DIR = resolve(REPO_ROOT, 'scripts', 'reports')

// Fields from baseFields.ts that apply to ALL entities
// Extracted by parsing baseFields.ts
const BASE_BEFORE_GALLERY = ['title', 'slug', 'summary', 'mainImage']
const BASE_AFTER_GALLERY = ['imageProvenance', 'seo', 'category', 'reviewStatus', 'approvedBy', 'contentProvenance', 'publishedAt', 'updatedAt']

// Fields from lodgingBase.ts shared by Hotel and Resort
const LODGING_BASE = [
  'geo', 'address', 'officialSource', 'sameAs', 'starRating',
  'amenityFeature', 'checkinTime', 'checkoutTime', 'numberOfRooms',
  'petsAllowed', 'containedInPlace', 'bookingRef', 'beachAccess',
  'accessInfo', 'body', 'highlights', 'faq'
]
const LODGING_GALLERY = 'gallery'

// Internal/system fields to ignore
const IGNORE_FIELDS = new Set([
  '_id', '_type', '_rev', '_createdAt', '_updatedAt',
  'orderRank', // plugin field
])

// Sub-fields that belong to parent object types — not top-level entity fields
const SUB_FIELD_IGNORE = new Set([
  // mainImage / gallery item sub-fields
  'alt', 'caption', 'crop', 'hotspot', 'asset',
  // address sub-fields
  'street', 'ward', 'district', 'locality', 'postalCode',
  // seo sub-fields
  'metaTitle', 'metaDescription',
  // openingHours sub-fields
  'open', 'close', 'note', 'days',
  // bookingRef sub-fields
  'key',
  // howTo sub-fields
  'step', 'text',
  // itinerary stop sub-fields (tour)
  'place', 'externalStop', 'durationAtStop',
  // touristDestination complex object sub-fields
  'label', 'linkLabel', 'linkUrl',
  'variant', 'theme', 'isActive', 'priority',
  // geo sub-fields
  'lat', 'lng',
  // slug sub-fields
  'current',
  // generic language sub-fields
  'vi', 'en', 'zh', 'ko', 'ru',
  // siteSettings.contact sub-fields (CONTENT_MODEL §2.15 v1.0.11, CONV-01)
  'hotline', 'zaloUrl', 'whatsapp', 'email',
  // siteSettings.pickupPoints[] sub-fields (CONTENT_MODEL §2.15 v1.0.13)
  'stopName', 'stopAddress', 'pickupTime', 'pickupNote',
  // siteSettings.support sub-fields (CONTENT_MODEL §2.15 v1.0.14, ADR-0023)
  'bookingGuide', 'cancellationPolicy',
  // siteSettings.stats[] / partners[] / testimonials[] / groupQuote (v1.0.16)
  'authorName', 'authorNote', 'sourceName', 'sourceUrl', 'ctaLabel', 'quote', 'heading',
  // siteSettings.branding sub-fields (CONTENT_MODEL §2.15 v1.0.17).
  // `logo` KHÔNG thêm ở đây — nó đã nằm trong AMBIGUOUS_SUB_FIELDS.siteSettings
  // bên dưới, và chính vì thế field cha phải mang tên `branding`: đặt tên field
  // top-level là `logo` thì G1 coi nó là sub-field và bỏ qua IM LẶNG, cổng mất
  // tác dụng đúng chỗ cần nó nhất.
  'favicon', 'ogImage', 'hideWordmark',
  // siteSettings.hero sub-fields (CONTENT_MODEL §2.15 v1.0.18, QĐ-2026-08-14-03).
  // `heading` đã có ở dòng v1.0.16 bên trên. `image` KHÔNG thêm ở đây — nó vào
  // AMBIGUOUS_SUB_FIELDS.siteSettings, cùng cách xử với `logo`.
  //
  // `summary` cố ý KHÔNG thêm, và đây là một CHỖ MÙ đã biết: `summary` là field
  // chung ở CONTENT_MODEL_COMMON_ALL, nên `hero.summary` làm G1 tưởng siteSettings
  // có field top-level `summary` và tắt một cảnh báo lẽ ra vẫn nên kêu. Đúng cơ
  // chế đã buộc field ảnh phải mang tên `branding` chứ không phải `logo`
  // (QĐ-2026-08-14-01). Ở đây hậu quả bằng không — `summary` không bắt buộc với
  // siteSettings và không cổng nào dựa vào nó — nên giữ tên đúng nghĩa cho biên
  // tập viên, và ghi chỗ mù ra đây thay vì để nó im lặng.
  'eyebrow', 'imageCredit', 'ctaPrimaryLabel', 'ctaSecondaryLabel',
  // siteSettings.footer sub-fields (CONTENT_MODEL §2.15 v1.0.18)
  'tagline', 'disclaimer', 'backgroundImage', 'badges', 'kind',
])

// Fields that exist as both top-level and sub-field in different entities
// "name" is a top-level field for Category; sub-field in tour stop and touristDestination
// "url" is top-level for Organization and Person; sub-field in touristDestination featured*
// "image" is sub-field of touristDestination homepageBanners
// "description" is top-level for Category; sub-field in touristDestination keyFacts
// "geo" is top-level for many entities; sub-field in tour externalStop
// "sameAs" is top-level for many entities; sub-field in tour externalStop
const AMBIGUOUS_SUB_FIELDS: Record<string, string[]> = {
  // entity types where these are TRUE sub-fields (not top-level)
  touristDestination: ['name', 'url', 'image', 'description', 'value'],
  tour: ['name', 'geo', 'sameAs', 'note'],
  // "hidden" là sub-field của sections[] và pickupPoints[] (CONTENT_MODEL §2.15),
  // "geo" là sub-field của pickupPoints[] (v1.0.13) — cả hai không phải field top-level.
  // "faq" là top-level ở nhiều entity khác, nhưng ở đây là sub-field của support (v1.0.14).
  // Bốn field v1.0.16 mang sub-field trùng tên với field top-level của entity
  // khác: `name`/`logo`/`url` (partners[]), `value` (stats[]).
  // `image` thêm v1.0.18: sub-field của `hero` và của `badges[]` (QĐ-2026-08-14-03).
  siteSettings: ['hidden', 'geo', 'faq', 'name', 'logo', 'url', 'value', 'image'],
}

// Common fields from CONTENT_MODEL §2.0
// "language" and "translationGroup" only apply to document-level i18n entities (Article, Category)
// v1.0.12 (2026-08-04): mọi field là tuỳ chọn, trừ title và slug — xem
// 01-CONTENT_MODEL.md §4 "Nới bắt buộc v1.0.12". Cột `required` dưới đây là
// gương của spec; hiện G1 chỉ so khớp TÊN field, chưa dùng cột này để kiểm.
const CONTENT_MODEL_COMMON_ALL: Record<string, { required: boolean }> = {
  title: { required: true },
  slug: { required: true },
  summary: { required: false },
  mainImage: { required: false },
  seo: { required: false },
  category: { required: false },
  publishedAt: { required: false },
  updatedAt: { required: false },
  reviewStatus: { required: false },
  approvedBy: { required: false },
  contentProvenance: { required: false },
}

const DOCUMENT_LEVEL_I18N_FIELDS: Record<string, { required: boolean }> = {
  language: { required: false },
  translationGroup: { required: false },
}

// Entities with document-level i18n (ADR-0004)
const DOCUMENT_LEVEL_ENTITIES = new Set(['article', 'category'])

// Entity-specific fields from CONTENT_MODEL §2.1–2.14
const CONTENT_MODEL_ENTITY_FIELDS: Record<string, Record<string, { required: boolean }>> = {
  touristDestination: {
    sameAs: { required: false }, containedInPlaceRef: { required: false },
    body: { required: false }, keyFacts: { required: false },
    homepageBanners: { required: false }, highlights: { required: false },
    faq: { required: false }, gallery: { required: false },
    featuredAttractions: { required: false }, featuredStays: { required: false },
    featuredExperiences: { required: false }, featuredSpecialties: { required: false },
    featuredTours: { required: false }, relatedDestinations: { required: false },
    safetyNote: { required: false }, speakable: { required: false },
    geo: { required: false }, imageProvenance: { required: false },
  },
  place: {
    placeType: { required: false }, sameAs: { required: false },
    geo: { required: false }, address: { required: false },
    containedInPlace: { required: false }, containsPlace: { required: false },
    incomingExperiences: { required: false }, // §2.2 v1.0.9: Studio display-only, không serialize
    placeHierarchy: { required: false }, // §2.2 v1.0.12: Studio display-only, hiển thị chuỗi phân cấp, không serialize
    hasMap: { required: false }, accessInfo: { required: false },
    openingHours: { required: false }, isAccessibleForFree: { required: false },
    body: { required: false }, gallery: { required: false },
    highlights: { required: false }, faq: { required: false },
    imageProvenance: { required: false },
  },
  attraction: {
    attractionType: { required: false }, sameAs: { required: false },
    officialSource: { required: false }, geo: { required: false },
    address: { required: false }, containedInPlace: { required: false },
    bookingRef: { required: false }, openingHours: { required: false },
    isAccessibleForFree: { required: false }, accessInfo: { required: false },
    hasMap: { required: false }, telephone: { required: false },
    body: { required: false }, gallery: { required: false },
    highlights: { required: false }, faq: { required: false },
    imageProvenance: { required: false },
  },
  experience: {
    experienceType: { required: false }, venue: { required: false },
    isAccessibleForFree: { required: false }, duration: { required: false },
    includes: { required: false }, touristType: { required: false },
    geo: { required: false }, bookingRef: { required: false },
    body: { required: false }, gallery: { required: false },
    highlights: { required: false }, faq: { required: false },
    imageProvenance: { required: false },
  },
  restaurant: {
    geo: { required: false }, address: { required: false },
    officialSource: { required: false }, sameAs: { required: false },
    servesCuisine: { required: false }, servesSpecialty: { required: false },
    containedInPlace: { required: false }, openingHours: { required: false },
    acceptsReservations: { required: false }, hasMenu: { required: false },
    telephone: { required: false },
    body: { required: false }, gallery: { required: false },
    highlights: { required: false }, faq: { required: false },
    imageProvenance: { required: false },
  },
  specialty: {
    specialtyType: { required: false }, sameAs: { required: false },
    originNote: { required: false }, season: { required: false },
    whereToTry: { required: false },
    body: { required: false }, gallery: { required: false },
    faq: { required: false }, imageProvenance: { required: false },
  },
  hotel: {
    geo: { required: false }, address: { required: false },
    officialSource: { required: false }, sameAs: { required: false },
    starRating: { required: false }, amenityFeature: { required: false },
    checkinTime: { required: false }, checkoutTime: { required: false },
    numberOfRooms: { required: false }, petsAllowed: { required: false },
    containedInPlace: { required: false }, bookingRef: { required: false },
    beachAccess: { required: false }, accessInfo: { required: false },
    body: { required: false }, gallery: { required: false },
    highlights: { required: false }, faq: { required: false },
    imageProvenance: { required: false },
  },
  resort: {
    geo: { required: false }, address: { required: false },
    officialSource: { required: false }, sameAs: { required: false },
    starRating: { required: false }, amenityFeature: { required: false },
    checkinTime: { required: false }, checkoutTime: { required: false },
    numberOfRooms: { required: false }, petsAllowed: { required: false },
    containedInPlace: { required: false }, bookingRef: { required: false },
    beachAccess: { required: false }, accessInfo: { required: false },
    beachfront: { required: false }, onSiteActivities: { required: false },
    landArea: { required: false },
    body: { required: false }, gallery: { required: false },
    highlights: { required: false }, faq: { required: false },
    imageProvenance: { required: false },
  },
  tour: {
    itinerary: { required: false }, operator: { required: false },
    tourFormat: { required: false }, tripOrigin: { required: false },
    departureNote: { required: false }, duration: { required: false },
    includes: { required: false }, excludes: { required: false },
    touristType: { required: false }, seasonNote: { required: false },
    bookingRef: { required: false },
    body: { required: false }, gallery: { required: false },
    highlights: { required: false }, faq: { required: false },
    imageProvenance: { required: false },
  },
  organization: {
    orgType: { required: false }, url: { required: false },
    officialSource: { required: false }, sameAs: { required: false },
    logo: { required: false }, geo: { required: false },
    address: { required: false }, telephone: { required: false },
    licenseInfo: { required: false }, body: { required: false },
    imageProvenance: { required: false },
  },
  event: {
    eventType: { required: false }, startDate: { required: false },
    endDate: { required: false }, location: { required: false },
    organizer: { required: false }, eventStatus: { required: false },
    isAccessibleForFree: { required: false }, bookingRef: { required: false },
    ticketUrl: { required: false },
    body: { required: false }, gallery: { required: false },
    faq: { required: false },
    imageProvenance: { required: false },
  },
  article: {
    articleType: { required: false }, author: { required: false },
    body: { required: false }, about: { required: false },
    mentions: { required: false }, faq: { required: false },
    howTo: { required: false }, language: { required: false },
    imageProvenance: { required: false },
  },
  person: {
    sameAs: { required: false }, jobTitle: { required: false },
    knowsAbout: { required: false }, url: { required: false },
    bio: { required: false },
    imageProvenance: { required: false },
  },
  category: {
    name: { required: false }, description: { required: false },
    inDefinedTermSet: { required: false }, termCode: { required: false },
    slug: { required: false }, sameAs: { required: false },
    imageProvenance: { required: false },
  },
  // §2.15 (v1.0.6): singleton config, không phải content entity — không gate publish
  // contact thêm v1.0.11 (CONV-01, DECISIONS 2026-07-13)
  siteSettings: {
    // branding thêm v1.0.17 (QĐ-2026-08-14-01) — ảnh nhận diện thương hiệu.
    // Sub-field logo/favicon/ogImage/hideWordmark xử ở SUB_FIELD_IGNORE và
    // AMBIGUOUS_SUB_FIELDS bên trên.
    branding: { required: false },
    sections: { required: false },
    // hero + footer thêm v1.0.18 (QĐ-2026-08-14-03) — chữ và ảnh Hero trang chủ
    // và chân trang. `heroText` (object 5 ngôn ngữ) đã bị gỡ: nó thành
    // `hero.eyebrow` một tầng, migration ở cms/_migrate-hero-footer.mjs.
    hero: { required: false },
    footer: { required: false },
    contact: { required: false },
    // pickupPoints thêm v1.0.13 — lộ trình đón khách, nguồn cho /lo-trinh-don-khach
    pickupPoints: { required: false },
    // theme thêm v1.0.15 — bộ giao diện chọn được (07-DESIGN_TOKENS §1b)
    theme: { required: false },
    // support thêm v1.0.14 (ADR-0023) — nội dung trang /ho-tro
    support: { required: false },
    // bốn field trang chủ thêm v1.0.16 (SPEC-2026-08-06)
    stats: { required: false },
    partners: { required: false },
    testimonials: { required: false },
    groupQuote: { required: false },
  },
}

// ── Schema entity → which base arrays it uses ──
// Determined by reading import statements in each schema file
type SchemaConfig = {
  usesBaseBefore: boolean
  usesBaseAfter: boolean
  usesLodgingBase: boolean
  usesLodgingGallery: boolean
}

const SCHEMA_CONFIG: Record<string, SchemaConfig> = {
  touristDestination: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  place: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  attraction: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  experience: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  restaurant: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  specialty: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  hotel: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: true, usesLodgingGallery: true },
  resort: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: true, usesLodgingGallery: true },
  tour: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  organization: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  event: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  article: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  person: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
  category: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false },
}

// Entity type name from schema → CONTENT_MODEL key
const SCHEMA_TYPE_TO_CM: Record<string, string> = {
  touristDestination: 'touristDestination',
  place: 'place',
  attraction: 'attraction',
  experience: 'experience',
  restaurant: 'restaurant',
  specialty: 'specialty',
  hotel: 'hotel',
  resort: 'resort',
  tour: 'tour',
  organization: 'organization',
  event: 'event',
  article: 'article',
  person: 'person',
  category: 'category',
}

// Skip these files (not entity schemas)
const SKIP_FILES = new Set(['baseFields.ts', 'lodgingBase.ts', 'index.ts'])

// ── Step 1: Extract top-level field names from a schema file ──

function extractSchemaFields(filePath: string, entityType: string): Set<string> {
  const content = readFileSync(filePath, 'utf-8')
  const rawFields = new Set<string>()

  // Only match defineField({ name: 'xxx', ... }) — NOT defineType({ name: 'xxx' })
  // The inline pattern handles non-defineField inline objects inside the fields array
  const defineFieldPattern = /defineField\(\{\s*\n*\s*name:\s*['"](\w+)['"]/g
  let m: RegExpExecArray | null
  while ((m = defineFieldPattern.exec(content)) !== null) {
    rawFields.add(m[1])
  }

  // Filter: remove system fields, sub-fields, and language keys
  const topFields = new Set<string>()
  for (const name of rawFields) {
    if (IGNORE_FIELDS.has(name)) continue
    if (SUB_FIELD_IGNORE.has(name)) continue
    // Check ambiguous sub-fields per entity type
    const ambig = AMBIGUOUS_SUB_FIELDS[entityType]
    if (ambig && ambig.includes(name)) continue
    topFields.add(name)
  }

  return topFields
}

// ── Step 2: Build full field set per schema entity ──

function buildSchemaFieldSet(entityType: string, filePath: string): Set<string> {
  const config = SCHEMA_CONFIG[entityType]
  const allFields = new Set<string>()

  if (config) {
    if (config.usesBaseBefore) BASE_BEFORE_GALLERY.forEach(f => allFields.add(f))
    if (config.usesBaseAfter) BASE_AFTER_GALLERY.forEach(f => allFields.add(f))
    if (config.usesLodgingBase) LODGING_BASE.forEach(f => allFields.add(f))
    if (config.usesLodgingGallery) allFields.add(LODGING_GALLERY)
  }

  // Add entity-specific fields from the schema file
  const directFields = extractSchemaFields(filePath, entityType)
  directFields.forEach(f => allFields.add(f))

  return allFields
}

// ── Step 3: Build CONTENT_MODEL field set per entity ──

function buildCMFieldSet(entityType: string): { fields: Set<string>, requiredFields: Set<string> } {
  const fields = new Set<string>()
  const requiredFields = new Set<string>()

  // Add common fields (all entities get these)
  for (const [name, info] of Object.entries(CONTENT_MODEL_COMMON_ALL)) {
    fields.add(name)
    if (info.required) requiredFields.add(name)
  }

  // Add document-level i18n fields only for entities that use document-level i18n
  if (DOCUMENT_LEVEL_ENTITIES.has(entityType)) {
    for (const [name, info] of Object.entries(DOCUMENT_LEVEL_I18N_FIELDS)) {
      fields.add(name)
      if (info.required) requiredFields.add(name)
    }
  }

  // Add entity-specific fields
  const entityFields = CONTENT_MODEL_ENTITY_FIELDS[entityType]
  if (entityFields) {
    for (const [name, info] of Object.entries(entityFields)) {
      fields.add(name)
      if (info.required) requiredFields.add(name)
    }
  }

  return { fields, requiredFields }
}

// ── Step 4: Compare ──

interface DriftItem {
  entityType: string
  field: string
  diff: string
  severity: 'fail' | 'warn'
  detail: string
}

function compare(
  entityType: string,
  schemaFields: Set<string>,
  cmFields: Set<string>,
  cmRequired: Set<string>,
): DriftItem[] {
  const drifts: DriftItem[] = []

  // Field in schema but NOT in CONTENT_MODEL → fail (P4 violation)
  for (const f of schemaFields) {
    if (!cmFields.has(f)) {
      drifts.push({
        entityType, field: f,
        diff: 'in_schema_not_in_content_model',
        severity: 'fail',
        detail: `Field "${f}" có trong schema ${entityType}.ts nhưng KHÔNG có trong CONTENT_MODEL §2 — vi phạm P4: đặc tả là nguồn sự thật`,
      })
    }
  }

  // Field in CONTENT_MODEL but NOT in schema → warn (may not be implemented yet)
  for (const f of cmFields) {
    if (!schemaFields.has(f)) {
      drifts.push({
        entityType, field: f,
        diff: 'in_content_model_not_in_schema',
        severity: 'warn',
        detail: `Field "${f}" có trong CONTENT_MODEL §2 cho ${entityType} nhưng KHÔNG có trong schema — có thể chưa implement`,
      })
    }
  }

  return drifts
}

// ── Main ──

function main() {
  console.log('=== Meta-validator G1: CONTENT_MODEL vs Sanity schema ===\n')

  const allDrifts: DriftItem[] = []
  const schemaFiles = readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.ts') && !SKIP_FILES.has(f))

  for (const file of schemaFiles) {
    const filePath = resolve(SCHEMAS_DIR, file)
    const entityType = file.replace('.ts', '')

    if (entityType === 'objects') continue // skip objects/ directory

    const schemaFields = buildSchemaFieldSet(entityType, filePath)
    const { fields: cmFields, requiredFields: cmRequired } = buildCMFieldSet(entityType)

    console.log(`[${entityType}] schema: ${schemaFields.size} fields, CONTENT_MODEL: ${cmFields.size} fields`)

    const drifts = compare(entityType, schemaFields, cmFields, cmRequired)
    allDrifts.push(...drifts)

    if (drifts.length === 0) {
      console.log(`  [pass] Khớp hoàn toàn`)
    }
  }

  // Report
  if (allDrifts.length === 0) {
    console.log('\n[pass] Tất cả schema khớp CONTENT_MODEL. Không drift.')
  } else {
    const failDrifts = allDrifts.filter(d => d.severity === 'fail')
    const warnDrifts = allDrifts.filter(d => d.severity === 'warn')
    console.log(`\n[DRIFT] ${allDrifts.length} điểm không khớp (${failDrifts.length} fail, ${warnDrifts.length} warn):\n`)

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
      entityType: d.entityType, field: d.field,
      diff: d.diff, severity: d.severity, detail: d.detail,
    })),
  }
  mkdirSync(REPORT_DIR, { recursive: true })
  writeFileSync(resolve(REPORT_DIR, 'g1-content-model-vs-schema.json'), JSON.stringify(report, null, 2), 'utf-8')
  console.log(`[report] Ghi scripts/reports/g1-content-model-vs-schema.json`)

  if (allDrifts.some(d => d.severity === 'fail')) {
    console.log('\n[exit] Có drift mức fail — cần sửa trước khi tiếp tục.')
    process.exit(1)
  }

  console.log('\n[exit] Không có drift mức fail.')
}

main()
