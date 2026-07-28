import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as dotenvConfig } from 'dotenv'
import { fetchAllDocs } from '../lib/sanity-client.js'
import { loadNodeDotEnv } from '../synthesis/config.js'
import { ROUTE_MAP } from '../../src/lib/routes.js'
import { site } from '../../src/site.config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
const DIST = resolve(REPO_ROOT, 'dist')
const REPORT_PATH = resolve(REPO_ROOT, 'scripts', 'reports', 'geo-knowledge-status.json')
const SITE = site.url
const LANGS = ['vi', 'en', 'zh', 'ko', 'ru'] as const
type Lang = typeof LANGS[number]

const REQUIRED_JSON = ['index.json', 'entities.json', 'graph.json', 'reading-guide.json']
const REQUIRED_PUBLIC = ['robots.txt', 'llms.txt', ...REQUIRED_JSON.map((file) => `ai/${file}`)]
const RELATIONS = new Set([
  'containedInPlace',
  'venue',
  'itineraryStop',
  'operator',
  'organizer',
  'about',
  'mentions',
  'servesSpecialty',
  'whereToTry',
  'author',
])
const ENTITY_TYPES = new Set([
  'touristDestination',
  'place',
  'attraction',
  'experience',
  'restaurant',
  'specialty',
  'hotel',
  'resort',
  'tour',
  'event',
  'article',
  'person',
  'organization',
])
const COMMERCIAL_TYPES = new Set(['experience', 'tour', 'hotel', 'resort', 'attraction', 'event'])

interface ReportIssue {
  level: 'fail' | 'warn'
  code: string
  message: string
}

interface Report {
  schemaVersion: string
  generatedAt: string
  status: 'pass' | 'warn' | 'fail'
  summary: {
    files: Record<string, 'present' | 'missing'>
    totalEntities: number
    entityTypes: Record<string, number>
    urlsByLanguage: Record<Lang, number>
    aiCoverageRatio: number
    sitemapCoverageRatio: number
    graph: {
      nodes: number
      edges: number
      danglingEdges: number
      orphanNodes: number
      relations: Record<string, number>
    }
    readiness: {
      missingSource: number
      missingSameAs: number
      commercialMissingBookingOrFreeFlag: number
      missingLanguages: number
      staleFiles: string[]
    }
    readingPaths: string[]
  }
  issues: ReportIssue[]
  entities: Array<{
    id: string
    type: string
    title: string
    canonicalUrl: string
    languages: string[]
    inAiLayer: boolean
    inSitemap: boolean
    inGraph: boolean
    hasOfficialSource: boolean
    hasSameAs: boolean
    hasBookingOrFreeFlag: boolean
    studioUrl?: string
  }>
}

function addIssue(issues: ReportIssue[], level: 'fail' | 'warn', code: string, message: string) {
  issues.push({ level, code, message })
}

function readJson<T = any>(path: string, issues: ReportIssue[], label: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T
  } catch (err: any) {
    addIssue(issues, 'fail', 'JSON_PARSE', `${label}: ${err.message ?? 'invalid JSON'}`)
    return null
  }
}

function parseUrlsFromSitemap(xml: string): Set<string> {
  const urls = new Set<string>()
  const re = /<loc>([^<]+)<\/loc>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(xml))) urls.add(match[1])
  return urls
}

function getHtmlFiles(dir: string): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith('.html')) files.push(full)
    }
  }
  walk(dir)
  return files
}

function htmlPathToUrlPath(filePath: string): string {
  let rel = relative(DIST, filePath).replace(/\\/g, '/')
  if (rel === 'index.html') return '/'
  if (rel.endsWith('/index.html')) rel = rel.slice(0, -'index.html'.length)
  else rel = rel.replace(/\.html$/, '/')
  return decodeURI(rel.startsWith('/') ? rel : `/${rel}`).normalize('NFC')
}

function siteUrlToPath(url: string): string {
  const parsed = new URL(url)
  const decoded = decodeURI(parsed.pathname || '/')
  return (decoded.endsWith('/') ? decoded : `${decoded}/`).normalize('NFC')
}

function routeForType(type: string) {
  return ROUTE_MAP.find((route) => route.entity === type)
}

function localizedText(value: any, lang: Lang): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value.trim() || undefined
  return value[lang]?.trim?.() || value.vi?.trim?.() || undefined
}

function normalizeSlug(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.normalize('NFC') : undefined
}

function slugFor(doc: any, lang: Lang): string | undefined {
  if (!doc.slug) return undefined
  if (doc._type === 'article') {
    return doc.language === lang ? normalizeSlug(doc.slug.current) : undefined
  }
  return normalizeSlug(doc.slug[lang]?.current)
}

function docUrl(doc: any, lang: Lang): string | undefined {
  if (doc._type !== 'article' && !localizedText(doc.title, lang)) return undefined
  if (doc._type === 'touristDestination') {
    const slug = normalizeSlug(doc.slug?.vi?.current)
    if (!slug) return undefined
    const prefix = lang === 'vi' ? '' : `/${lang}`
    return `${SITE}${prefix}/${slug}/`
  }
  const route = routeForType(doc._type)
  const slug = slugFor(doc, lang)
  if (!route || !slug) return undefined
  const prefix = lang === 'vi' ? '' : `/${lang}`
  return `${SITE}${prefix}/${route.segments[lang]}/${slug}/`
}

function collectExpectedDocs(docs: any[]) {
  const expected: Array<{ id: string; type: string; urls: Partial<Record<Lang, string>>; title: string }> = []
  for (const doc of docs) {
    if (doc.reviewStatus !== 'approved') continue
    if (!ENTITY_TYPES.has(doc._type)) continue
    const urls: Partial<Record<Lang, string>> = {}
    for (const lang of LANGS) {
      const url = docUrl(doc, lang)
      if (url) urls[lang] = url
    }
    if (Object.keys(urls).length === 0) continue
    expected.push({
      id: doc._id.replace(/^drafts\./, ''),
      type: doc._type,
      urls,
      title: localizedText(doc.title, 'vi') ?? doc.title ?? doc._id,
    })
  }
  return expected
}

function hasSecretSignal(value: unknown): boolean {
  const text = JSON.stringify(value)
  return /(SANITY_[A-Z_]*TOKEN|CLOUDFLARE_API_TOKEN|CF_API_TOKEN|SCRAPFLY_KEY|DEEPSEEK_API_KEY|privateNote|internalNote|secret|api[_-]?key|bearer\s+[a-z0-9._-]+)/i.test(text)
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
}

async function main() {
  dotenvConfig({ path: resolve(REPO_ROOT, '.env'), quiet: true })
  await loadNodeDotEnv()
  const issues: ReportIssue[] = []
  const generatedAt = new Date().toISOString()

  if (!existsSync(DIST)) {
    addIssue(issues, 'fail', 'DIST_MISSING', 'dist/ khong ton tai. Chay npm run build truoc.')
  }

  const fileStatus: Record<string, 'present' | 'missing'> = {}
  for (const file of REQUIRED_PUBLIC) {
    const present = existsSync(resolve(DIST, file))
    fileStatus[`/${file}`] = present ? 'present' : 'missing'
    if (!present) addIssue(issues, 'fail', 'FILE_MISSING', `Thieu dist/${file}`)
  }

  const aiFiles = Object.fromEntries(
    REQUIRED_JSON.map((file) => [file, existsSync(resolve(DIST, 'ai', file)) ? readJson(resolve(DIST, 'ai', file), issues, file) : null]),
  ) as Record<string, any | null>

  for (const [file, json] of Object.entries(aiFiles)) {
    if (!json) continue
    if (!json.schemaVersion && !json.version) addIssue(issues, 'fail', 'AI_VERSION_MISSING', `${file} thieu schemaVersion/version`)
    if (!json.generatedAt) addIssue(issues, 'fail', 'AI_GENERATED_AT_MISSING', `${file} thieu generatedAt`)
    if (hasSecretSignal(json)) addIssue(issues, 'fail', 'AI_SECRET_SIGNAL', `${file} co dau hieu secret/token/private note`)
  }

  const entitiesJson = aiFiles['entities.json']
  const graphJson = aiFiles['graph.json']
  const readingGuideJson = aiFiles['reading-guide.json']
  const entities: any[] = Array.isArray(entitiesJson?.entities) ? entitiesJson.entities : []
  const entityIds = new Set(entities.map((entity) => entity.id))
  const nodes: any[] = Array.isArray(graphJson?.nodes) ? graphJson.nodes : []
  const edges: any[] = Array.isArray(graphJson?.edges) ? graphJson.edges : []
  const nodeIds = new Set(nodes.map((node) => node.id))

  const htmlPaths = new Set(getHtmlFiles(DIST).map(htmlPathToUrlPath).filter((path) => path !== '/404/'))
  const sitemapUrls = new Set<string>()
  const sitemapIndexPath = resolve(DIST, 'sitemap.xml')
  if (existsSync(sitemapIndexPath)) {
    for (const loc of parseUrlsFromSitemap(readFileSync(sitemapIndexPath, 'utf-8'))) {
      const childPath = resolve(DIST, siteUrlToPath(loc).replace(/^\//, '').replace(/\/$/, ''))
      if (!existsSync(childPath)) continue
      for (const url of parseUrlsFromSitemap(readFileSync(childPath, 'utf-8'))) sitemapUrls.add(url)
    }
  }

  let expectedDocs: ReturnType<typeof collectExpectedDocs> = []
  try {
    expectedDocs = collectExpectedDocs(await fetchAllDocs())
  } catch (err: any) {
    addIssue(issues, 'fail', 'SANITY_READ_FAILED', `Khong doc duoc Sanity: ${err.message ?? 'unknown error'}`)
  }

  for (const expected of expectedDocs) {
    if (!entityIds.has(expected.id)) addIssue(issues, 'fail', 'AI_ENTITY_MISSING', `${expected.id}: approved co trang that nhung thieu trong entities.json`)
  }

  for (const entity of entities) {
    if (!ENTITY_TYPES.has(entity.type)) addIssue(issues, 'fail', 'AI_ENTITY_TYPE_UNKNOWN', `${entity.id}: type khong hop le ${entity.type}`)
    if (!entity.canonicalUrl || !htmlPaths.has(siteUrlToPath(entity.canonicalUrl))) {
      addIssue(issues, 'fail', 'AI_ENTITY_URL_MISSING', `${entity.id}: canonicalUrl khong co file HTML that`)
    }
    for (const lang of entity.languages ?? []) {
      const url = entity.urls?.[lang]
      if (!url || !htmlPaths.has(siteUrlToPath(url))) addIssue(issues, 'fail', 'AI_ENTITY_LANG_URL_MISSING', `${entity.id}: ngon ngu ${lang} khong co URL that`)
    }
  }

  for (const edge of edges) {
    if (!RELATIONS.has(edge.relation)) addIssue(issues, 'fail', 'GRAPH_RELATION_UNKNOWN', `${edge.from} -> ${edge.to}: relation ${edge.relation} ngoai enum`)
    if (!nodeIds.has(edge.from)) addIssue(issues, 'fail', 'GRAPH_FROM_DANGLING', `${edge.from} -> ${edge.to}: edge.from khong co node`)
    if (!edge.external && !nodeIds.has(edge.to)) addIssue(issues, 'fail', 'GRAPH_TO_DANGLING', `${edge.from} -> ${edge.to}: edge.to khong co node`)
    if (edge.external && (!edge.name || !edge.url)) addIssue(issues, 'warn', 'GRAPH_EXTERNAL_WEAK', `${edge.from}: external edge thieu name/url day du`)
  }

  const filesInReadingGuide = new Set(['/ai/index.json', '/ai/entities.json', '/ai/graph.json', '/ai/reading-guide.json'])
  for (const intent of readingGuideJson?.intents ?? []) {
    for (const type of intent.priorityEntityTypes ?? []) {
      if (!ENTITY_TYPES.has(type)) addIssue(issues, 'fail', 'READING_GUIDE_TYPE_UNKNOWN', `${intent.id}: entity type ${type} khong ton tai`)
    }
    for (const file of intent.readFirst ?? []) {
      if (!filesInReadingGuide.has(file)) addIssue(issues, 'fail', 'READING_GUIDE_FILE_UNKNOWN', `${intent.id}: file ${file} khong ton tai trong AI layer`)
    }
  }

  const relationCounts = countBy(edges.map((edge) => edge.relation).filter(Boolean))
  const connectedNodeIds = new Set<string>()
  for (const edge of edges) {
    if (nodeIds.has(edge.from)) connectedNodeIds.add(edge.from)
    if (!edge.external && nodeIds.has(edge.to)) connectedNodeIds.add(edge.to)
  }
  const orphanNodes = nodes.filter((node) => !connectedNodeIds.has(node.id)).length
  const danglingEdges = edges.filter((edge) => !nodeIds.has(edge.from) || (!edge.external && !nodeIds.has(edge.to))).length
  const urlsByLanguage = Object.fromEntries(LANGS.map((lang) => [lang, entities.filter((entity) => entity.urls?.[lang]).length])) as Record<Lang, number>
  const entityTypes = countBy(entities.map((entity) => entity.type))
  const expectedIds = new Set(expectedDocs.map((doc) => doc.id))
  const aiCovered = expectedDocs.filter((doc) => entityIds.has(doc.id)).length
  const sitemapCovered = entities.filter((entity) => entity.canonicalUrl && sitemapUrls.has(entity.canonicalUrl)).length
  const missingSource = entities.filter((entity) => !entity.officialSource).length
  const missingSameAs = entities.filter((entity) => !Array.isArray(entity.sameAs) || entity.sameAs.length === 0).length
  const commercialMissingBookingOrFreeFlag = entities.filter((entity) => COMMERCIAL_TYPES.has(entity.type) && !entity.hasBookingRef && entity.isAccessibleForFree !== true && !entity.ticketUrl).length
  const missingLanguages = entities.filter((entity) => (entity.languages ?? []).length < LANGS.length).length

  const reportEntities = entities.map((entity) => ({
    id: entity.id,
    type: entity.type,
    title: entity.title?.vi ?? entity.title?.en ?? entity.id,
    canonicalUrl: entity.canonicalUrl,
    languages: entity.languages ?? [],
    inAiLayer: expectedIds.size === 0 ? true : expectedIds.has(entity.id),
    inSitemap: sitemapUrls.has(entity.canonicalUrl),
    inGraph: nodeIds.has(entity.id),
    hasOfficialSource: Boolean(entity.officialSource),
    hasSameAs: Array.isArray(entity.sameAs) && entity.sameAs.length > 0,
    hasBookingOrFreeFlag: !COMMERCIAL_TYPES.has(entity.type) || Boolean(entity.hasBookingRef || entity.isAccessibleForFree || entity.ticketUrl),
    studioUrl: entity.studioUrl,
  }))

  const hasFail = issues.some((issue) => issue.level === 'fail')
  const hasWarn = issues.some((issue) => issue.level === 'warn')
  const report: Report = {
    schemaVersion: '1.0.0',
    generatedAt,
    status: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass',
    summary: {
      files: fileStatus,
      totalEntities: entities.length,
      entityTypes,
      urlsByLanguage,
      aiCoverageRatio: expectedDocs.length ? aiCovered / expectedDocs.length : 1,
      sitemapCoverageRatio: entities.length ? sitemapCovered / entities.length : 1,
      graph: {
        nodes: nodes.length,
        edges: edges.length,
        danglingEdges,
        orphanNodes,
        relations: relationCounts,
      },
      readiness: {
        missingSource,
        missingSameAs,
        commercialMissingBookingOrFreeFlag,
        missingLanguages,
        staleFiles: [],
      },
      readingPaths: (readingGuideJson?.intents ?? []).map((intent: any) => intent.id).filter(Boolean),
    },
    issues,
    entities: reportEntities,
  }

  mkdirSync(dirname(REPORT_PATH), { recursive: true })
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)

  console.log('=== GEO Knowledge post-build validator ===')
  console.log(`[report] ${REPORT_PATH}`)
  console.log(`[status] ${report.status} — ${issues.length} issue(s)`)
  for (const issue of issues) console.log(`[${issue.level}] ${issue.code}: ${issue.message}`)

  if (hasFail) process.exit(1)
}

main()
