/**
 * I6 + PY8 post-build validator.
 *
 * Runs after Astro has rendered dist/. This is the only layer that can prove
 * the actual production HTML contains clean JSON-LD, canonical/SEO bindings,
 * and price offers emitted from prices.yaml.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROUTE_MAP } from '../../src/lib/routes'
import { site } from '../../src/site.config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
const DIST = resolve(REPO_ROOT, 'dist')
const REPORT_DIR = resolve(REPO_ROOT, 'scripts', 'reports')
const SITE = site.url

type PostItem = {
  id: 'I6' | 'PY8' | 'SEO'
  status: 'pass' | 'fail'
  errors: string[]
}

const ROUTE_SEGMENTS = new Set([
  'dia-danh', 'diem-tham-quan', 'trai-nghiem', 'nha-hang', 'dac-san',
  'khach-san', 'resort', 'tour', 'su-kien', 'cam-nang', 'tac-gia',
  'cong-ty', 'kham-pha', 'luu-tru', 'am-thuc', 'di-lai',
  'places', 'attractions', 'experiences', 'restaurants', 'specialties',
  'hotels', 'resorts', 'tours', 'events', 'guides', 'authors', 'companies',
  'things-to-do', 'where-to-stay', 'food', 'getting-around',
])

const CREATIVE_WORK_DATE_TYPES = new Set([
  'Article',
  'BlogPosting',
  'CollectionPage',
  'CreativeWork',
  'FAQPage',
  'HowTo',
  'NewsArticle',
  'WebPage',
  'WebSite',
])

const DETAIL_ENTITY_TYPES: Record<string, string[]> = {
  place: ['Place', 'Beach', 'Landform', 'AdministrativeArea', 'TouristAttraction'],
  attraction: ['TouristAttraction'],
  experience: ['TouristAttraction'],
  restaurant: ['Restaurant'],
  specialty: ['Product'],
  hotel: ['Hotel'],
  resort: ['Resort'],
  tour: ['TouristTrip'],
  // Đồng bộ EVENT_TYPE_MAP (src/lib/serialize/event.ts) — subtype thật theo eventType, CONTENT_MODEL §2.10
  event: ['Event', 'Festival', 'SportsEvent', 'MusicEvent', 'FoodEvent', 'ExhibitionEvent'],
  article: ['Article'],
  person: ['Person'],
  // Đồng bộ ORG_TYPE_MAP (src/lib/serialize/organization.ts) — @type theo orgType.
  // CONTENT_MODEL §2.9 dòng 375 và 05-URL_MAP dòng 118 đều khai "TravelAgency hoặc
  // Organization theo orgType"; danh sách này trước đây chỉ có Organization nên mọi
  // đơn vị orgType=travelAgency đều bị báo I6 sai. Xem docs/DRIFT_LOG.md DR-009.
  organization: ['Organization', 'TravelAgency'],
}

const DETAIL_SCHEMA_BY_SEGMENT = new Map<string, string[]>()
for (const route of ROUTE_MAP) {
  const types = DETAIL_ENTITY_TYPES[route.entity]
  if (!types) continue
  for (const segment of Object.values(route.segments)) DETAIL_SCHEMA_BY_SEGMENT.set(segment, types)
}

const LANG_PREFIXES = new Set(['en', 'zh', 'ko', 'ru'])
const NON_DETAIL_ROOT_TYPES = new Set(['CollectionPage', 'WebSite'])

function typeNames(type: unknown): string[] {
  if (Array.isArray(type)) return type.filter((item): item is string => typeof item === 'string')
  return typeof type === 'string' ? [type] : []
}

function canOwnCreativeWorkDate(type: unknown): boolean {
  return typeNames(type).some((t) => CREATIVE_WORK_DATE_TYPES.has(t))
}

function expectedDetailTypesForRel(rel: string): string[] | null {
  if (rel === 'index.html' || rel === '404.html') return null

  let path = rel.replace(/\\/g, '/')
  if (path.endsWith('/index.html')) path = path.slice(0, -'/index.html'.length)
  else if (path.endsWith('.html')) path = path.slice(0, -'.html'.length)

  const parts = path.split('/').filter(Boolean)
  const routeIndex = LANG_PREFIXES.has(parts[0]) ? 1 : 0
  const segment = parts[routeIndex]
  const slug = parts[routeIndex + 1]
  if (!segment || !slug) return null

  return DETAIL_SCHEMA_BY_SEGMENT.get(segment) ?? null
}

function topLevelJsonLdObjects(value: unknown): Record<string, unknown>[] {
  const roots = Array.isArray(value) ? value : [value]
  return roots.filter((root): root is Record<string, unknown> => Boolean(root) && typeof root === 'object' && !Array.isArray(root))
}

function hasAnyType(types: string[], expected: string[]): boolean {
  return types.some((type) => expected.includes(type))
}

function mainEntityOfPageIsWebPage(obj: Record<string, unknown>): boolean {
  const value = obj.mainEntityOfPage
  const pages = Array.isArray(value) ? value : value ? [value] : []
  return pages.some((page) => {
    if (!page || typeof page !== 'object' || Array.isArray(page)) return false
    return typeNames((page as Record<string, unknown>)['@type']).includes('WebPage')
  })
}

function getAllHtmlFiles(dir: string): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith('.html')) files.push(full)
    }
  }
  walk(dir)
  return files
}

function filePathToUrl(filePath: string): string {
  let rel = relative(DIST, filePath).replace(/\\/g, '/')
  if (rel === 'index.html') rel = ''
  else if (rel.endsWith('/index.html')) rel = rel.slice(0, -'index.html'.length)
  else if (rel.endsWith('.html')) rel = rel.slice(0, -'.html'.length) + '/'
  const url = `${SITE}/${rel}`
  return url.endsWith('/') ? url : `${url}/`
}

function sameUrl(a: string, b: string): boolean {
  try {
    return decodeURI(a).normalize('NFC') === decodeURI(b).normalize('NFC')
  } catch {
    return a === b
  }
}

function walkJson(value: unknown, visit: (obj: Record<string, unknown>) => void): void {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, visit)
    return
  }
  const obj = value as Record<string, unknown>
  visit(obj)
  for (const child of Object.values(obj)) walkJson(child, visit)
}

function walkJsonValues(value: unknown, visit: (key: string, child: unknown) => void, key = '$'): void {
  visit(key, value)
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((child, index) => walkJsonValues(child, visit, `${key}[${index}]`))
    return
  }
  const obj = value as Record<string, unknown>
  for (const [childKey, childValue] of Object.entries(obj)) {
    walkJsonValues(childValue, visit, childKey)
  }
}

function isUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\/[^\s]+$/i.test(value)
}

function jsonLdBlocks(html: string): string[] {
  const blocks: string[] = []
  const re = /<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    blocks.push(match[1].trim())
  }
  return blocks
}

function attrValue(tag: string, attr: string): string | null {
  const m = tag.match(new RegExp(`\\b${attr}=["']([^"']+)["']`, 'i'))
  return m?.[1] ?? null
}

function parseCanonical(html: string): string | null {
  const tags = html.match(/<link\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    if (attrValue(tag, 'rel')?.toLowerCase() === 'canonical') return attrValue(tag, 'href')
  }
  return null
}

function hasMetaDescription(html: string): boolean {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  return tags.some((tag) => attrValue(tag, 'name')?.toLowerCase() === 'description' && Boolean(attrValue(tag, 'content')?.trim()))
}

function bookingKeys(html: string): string[] {
  const keys = new Set<string>()
  const re = /href=["']#booking-([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) keys.add(match[1])
  return [...keys]
}

function matchingOfferKeys(value: unknown): Set<string> {
  const keys = new Set<string>()
  walkJson(value, (obj) => {
    const offers = obj.offers
    const list = Array.isArray(offers) ? offers : offers ? [offers] : []
    for (const offer of list) {
      if (!offer || typeof offer !== 'object') continue
      const o = offer as Record<string, unknown>
      const type = o['@type']
      const identifier = typeof o.identifier === 'string' ? o.identifier : ''
      if (type === 'Offer' && typeof o.price === 'number' && o.priceCurrency === 'VND' && identifier) keys.add(identifier)
      if (
        type === 'AggregateOffer' &&
        typeof o.lowPrice === 'number' &&
        typeof o.highPrice === 'number' &&
        typeof o.offerCount === 'number' &&
        o.priceCurrency === 'VND' &&
        identifier
      ) keys.add(identifier)
    }
  })
  return keys
}

function validateJsonLdForPage(file: string, html: string): { i6: string[]; py8: string[]; seo: string[] } {
  const pageUrl = filePathToUrl(file)
  const rel = relative(DIST, file).replace(/\\/g, '/')
  const i6: string[] = []
  const py8: string[] = []
  const seo: string[] = []

  const canonical = parseCanonical(html)
  if (rel !== '404.html') {
    if (!canonical) seo.push(`${rel}: thiếu canonical`)
    else if (!sameUrl(canonical, pageUrl)) seo.push(`${rel}: canonical="${canonical}" không khớp URL build "${pageUrl}"`)
    if (!hasMetaDescription(html)) seo.push(`${rel}: thiếu meta description`)
  }

  const blocks = jsonLdBlocks(html)
  if (rel !== '404.html' && blocks.length === 0) {
    i6.push(`${rel}: thiếu script application/ld+json`)
  }

  const parsedBlocks: unknown[] = []
  blocks.forEach((raw, index) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
      parsedBlocks.push(parsed)
    } catch (err: any) {
      i6.push(`${rel}: JSON-LD block #${index + 1} parse lỗi: ${err.message}`)
      return
    }

    const roots = Array.isArray(parsed) ? parsed : [parsed]
    for (const root of roots) {
      if (!root || typeof root !== 'object') {
        i6.push(`${rel}: JSON-LD block #${index + 1} root không phải object`)
        continue
      }
      const obj = root as Record<string, unknown>
      if (!obj['@context']) i6.push(`${rel}: JSON-LD block #${index + 1} thiếu @context`)
      if (!obj['@type'] && !obj['@graph']) i6.push(`${rel}: JSON-LD block #${index + 1} thiếu @type`)
    }

    walkJson(parsed, (obj) => {
      const type = obj['@type']
      const types = typeNames(type)
      for (const t of types) {
        if (/^https?:\/\//i.test(t)) {
          i6.push(`${rel}: @type chứa URL "${t}" — dùng additionalType`)
        }
      }

      const hasCreativeWorkDate = Object.prototype.hasOwnProperty.call(obj, 'datePublished') ||
        Object.prototype.hasOwnProperty.call(obj, 'dateModified')
      if (hasCreativeWorkDate && !canOwnCreativeWorkDate(type)) {
        const label = types.length > 0 ? types.join(',') : '(thiếu @type)'
        i6.push(`${rel}: ${label} chứa datePublished/dateModified nhưng các property này chỉ được phát trên CreativeWork/WebPage`)
      }

      const additionalType = obj.additionalType
      const additionalTypes = Array.isArray(additionalType) ? additionalType : additionalType ? [additionalType] : []
      for (const t of additionalTypes) {
        if (!isUrl(t)) i6.push(`${rel}: additionalType không phải URL hợp lệ: ${String(t)}`)
      }

      if (type === 'FAQPage') {
        if (typeof obj['@id'] !== 'string' || !sameUrl(obj['@id'], `${pageUrl}#faq`)) {
          i6.push(`${rel}: FAQPage @id="${String(obj['@id'])}" phải là "${pageUrl}#faq"`)
        }
        if (!Array.isArray(obj.mainEntity) || obj.mainEntity.length === 0) {
          i6.push(`${rel}: FAQPage thiếu mainEntity Question[]`)
        }
      }

      if (type === 'BreadcrumbList') {
        const items = Array.isArray(obj.itemListElement) ? obj.itemListElement : []
        for (const item of items) {
          if (!item || typeof item !== 'object') continue
          const name = String((item as Record<string, unknown>).name ?? '')
          if (ROUTE_SEGMENTS.has(name)) {
            i6.push(`${rel}: BreadcrumbList name="${name}" là slug kỹ thuật`)
          }
        }
      }
    })

    walkJsonValues(parsed, (key, value) => {
      if (value === null) {
        i6.push(`${rel}: JSON-LD chứa null tại "${key}" — bỏ field hoặc cung cấp dữ liệu hợp lệ`)
      }
      if (typeof value === 'string') {
        if ((key === '@id' || key === 'url') && /\/null\/?$/i.test(value)) {
          i6.push(`${rel}: JSON-LD ${key} trỏ URL null "${value}"`)
        }
        if ((key === '@id' || key === 'url' || key === 'name') && value.trim() === '') {
          i6.push(`${rel}: JSON-LD ${key} rỗng`)
        }
      }
    })
  })

  const expectedDetailTypes = expectedDetailTypesForRel(rel)
  if (expectedDetailTypes) {
    const rootObjects = parsedBlocks.flatMap(topLevelJsonLdObjects)
    const rootTypes = rootObjects.flatMap((obj) => typeNames(obj['@type']))
    const isCollectionOrSitePage = rootTypes.some((type) => NON_DETAIL_ROOT_TYPES.has(type))

    if (!isCollectionOrSitePage) {
      const rootEntityObjects = rootObjects.filter((obj) => hasAnyType(typeNames(obj['@type']), expectedDetailTypes))

      if (rootEntityObjects.length === 0) {
        let nestedHasExpectedEntity = false
        for (const parsed of parsedBlocks) {
          walkJson(parsed, (obj) => {
            if (hasAnyType(typeNames(obj['@type']), expectedDetailTypes)) nestedHasExpectedEntity = true
          })
        }

        const expectedLabel = expectedDetailTypes.join('|')
        if (nestedHasExpectedEntity) {
          i6.push(`${rel}: schema chính ${expectedLabel} đang nằm trong @graph/nested; phải là top-level JSON-LD root`)
        } else {
          i6.push(`${rel}: thiếu top-level schema chính ${expectedLabel}`)
        }
      }

      const needsWebPageDateHolder = expectedDetailTypes.some((type) => !CREATIVE_WORK_DATE_TYPES.has(type))
      if (needsWebPageDateHolder) {
        for (const root of rootEntityObjects) {
          if (!mainEntityOfPageIsWebPage(root)) {
            const label = typeNames(root['@type']).join(',') || '(thiếu @type)'
            i6.push(`${rel}: ${label} thiếu mainEntityOfPage WebPage để giữ datePublished/dateModified ngoài entity schema chính`)
          }
        }
      }
    }
  }

  const ctaKeys = bookingKeys(html)
  if (ctaKeys.length > 0) {
    const offerKeys = new Set<string>()
    for (const parsed of parsedBlocks) {
      for (const key of matchingOfferKeys(parsed)) offerKeys.add(key)
    }
    for (const key of ctaKeys) {
      if (!offerKeys.has(key)) {
        py8.push(`${rel}: CTA booking "${key}" nhưng JSON-LD không có Offer/AggregateOffer VND cùng identifier`)
      }
    }
  }

  return { i6, py8, seo }
}

async function main() {
  console.log('=== Post-build validator — I6 JSON-LD + PY8 offers + SEO bindings ===\n')

  if (!existsSync(DIST)) {
    console.error('[error] dist/ không tồn tại — chạy astro build trước.')
    process.exit(1)
  }

  const htmlFiles = getAllHtmlFiles(DIST)
  if (htmlFiles.length === 0) {
    console.error('[error] dist/ không có HTML nào — không thể chứng minh I6/PY8/SEO.')
    process.exit(1)
  }
  const i6Errors: string[] = []
  const py8Errors: string[] = []
  const seoErrors: string[] = []

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8')
    const result = validateJsonLdForPage(file, html)
    i6Errors.push(...result.i6)
    py8Errors.push(...result.py8)
    seoErrors.push(...result.seo)
  }

  const items: PostItem[] = [
    { id: 'I6', status: i6Errors.length === 0 ? 'pass' : 'fail', errors: i6Errors },
    { id: 'PY8', status: py8Errors.length === 0 ? 'pass' : 'fail', errors: py8Errors },
    { id: 'SEO', status: seoErrors.length === 0 ? 'pass' : 'fail', errors: seoErrors },
  ]

  for (const item of items) {
    if (item.status === 'pass') {
      console.log(`[pass] ${item.id}`)
    } else {
      console.log(`[FAIL] ${item.id} — ${item.errors.length} lỗi:`)
      for (const err of item.errors) console.log(`       ${err}`)
    }
  }

  mkdirSync(REPORT_DIR, { recursive: true })
  writeFileSync(
    resolve(REPORT_DIR, 'postbuild-status.json'),
    JSON.stringify({ ranAt: new Date().toISOString(), items }, null, 2),
    'utf-8',
  )
  console.log('[report] Ghi scripts/reports/postbuild-status.json')

  if (items.some((item) => item.status === 'fail')) {
    process.exit(1)
  }
}

main()
