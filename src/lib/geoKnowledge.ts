import YAML from 'yaml'
import pricesYaml from '../../data/prices.yaml?raw'
import { getClient } from './sanity'
import { ROUTE_MAP } from './routes'
import { LANGS, langPrefix, withTrailingSlash } from './sitemap'
import type { Lang, PriceEntry } from './types'
import { site } from '../site.config'

export const GEO_SCHEMA_VERSION = '1.0.0'
export const SITE_URL = site.url

export const GEO_ENTITY_TYPES = [
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
] as const

export const GEO_RELATIONS = [
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
] as const

type GeoEntityType = typeof GEO_ENTITY_TYPES[number]
type GeoRelation = typeof GEO_RELATIONS[number]

interface RefDoc {
  _id?: string
  _type?: string
  title?: Record<string, string> | string
  slug?: Record<string, { current?: string }> | { current?: string }
  sameAs?: string[]
  url?: string
}

interface RawDoc {
  _id: string
  _type: GeoEntityType
  _createdAt?: string
  _updatedAt?: string
  updatedAt?: string
  publishedAt?: string
  reviewStatus?: string
  approvedBy?: string
  contentProvenance?: string
  title?: Record<string, string> | string
  slug?: Record<string, { current?: string }> | { current?: string }
  summary?: Record<string, string> | string
  language?: Lang
  sameAs?: string[]
  officialSource?: string
  url?: string
  mainImage?: { asset?: { url?: string }; alt?: string }
  category?: Array<{ _id?: string; termCode?: string; name?: Record<string, string> | string }>
  bookingRef?: { key?: string }
  isAccessibleForFree?: boolean
  ticketUrl?: string
  containedInPlace?: RefDoc
  venue?: RefDoc
  itinerary?: Array<{ place?: RefDoc; externalStop?: { name?: string; sameAs?: string; url?: string } }>
  operator?: RefDoc
  organizer?: RefDoc
  location?: RefDoc
  author?: RefDoc
  about?: RefDoc[]
  mentions?: RefDoc[]
  servesSpecialty?: RefDoc[]
  whereToTry?: RefDoc[]
}

export interface AiEntity {
  id: string
  type: GeoEntityType
  // compactObject() bỏ hẳn key khi object rỗng, nên hai field này CÓ THỂ vắng mặt
  // (doc không có title/summary dùng được ở ngôn ngữ nào). Khai optional để trình
  // biên dịch bắt lỗi thay vì để build vỡ lúc prerender (llms.txt, 2026-08-04).
  title?: Partial<Record<Lang, string>>
  summary?: Partial<Record<Lang, string>>
  canonicalUrl: string
  urls: Partial<Record<Lang, string>>
  languages: Lang[]
  updatedAt?: string
  publishedAt?: string
  reviewStatus?: string
  contentProvenance?: string
  approvedBy?: string
  officialSource?: string
  sameAs?: string[]
  hasBookingRef: boolean
  isAccessibleForFree?: boolean
  hasPriceData: boolean
  ticketUrl?: string
  mainImage?: { url: string; alt?: string }
  topics?: string[]
  studioUrl: string
}

export interface AiGraphNode {
  id: string
  type: GeoEntityType
  title: string
  canonicalUrl: string
}

export interface AiGraphEdge {
  from: string
  to: string
  relation: GeoRelation
  sourceField: string
  confidence: 'source'
  external?: boolean
  name?: string
  url?: string
}

export interface GeoDataset {
  generatedAt: string
  prices: Record<string, PriceEntry>
  entities: AiEntity[]
  graph: { nodes: AiGraphNode[]; edges: AiGraphEdge[] }
  stats: {
    totalEntities: number
    byType: Record<string, number>
    urlsByLanguage: Record<Lang, number>
  }
}

function cleanId(id: string): string {
  return id.replace(/^drafts\./, '')
}

function textForLang(value: unknown, lang: Lang): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value.trim() || undefined
  if (typeof value === 'object') {
    const item = (value as Record<string, unknown>)[lang] ?? (value as Record<string, unknown>).vi
    if (typeof item === 'string') return item.trim() || undefined
  }
  return undefined
}

/**
 * Như textForLang nhưng KHÔNG fallback về vi — dùng để quyết định một ngôn ngữ
 * "tồn tại thật" hay không. Trang [lang] chỉ được build khi defined(title.[lang])
 * (fetchAllSlugs, sanity.ts); nếu dùng bản fallback thì entities.json khai URL
 * cho ngôn ngữ chưa có trang thật → AI_ENTITY_LANG_URL_MISSING.
 */
function strictTextForLang(value: unknown, lang: Lang): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value.trim() || undefined
  if (typeof value === 'object') {
    const item = (value as Record<string, unknown>)[lang]
    if (typeof item === 'string') return item.trim() || undefined
  }
  return undefined
}

function normalizePathPart(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed.normalize('NFC') : undefined
}

function slugForLang(doc: Pick<RawDoc, '_type' | 'slug' | 'language'>, lang: Lang): string | undefined {
  if (!doc.slug) return undefined
  if (doc._type === 'article') {
    if (doc.language !== lang) return undefined
    const current = (doc.slug as { current?: string }).current
    return normalizePathPart(current)
  }
  const localized = doc.slug as Record<string, { current?: string }>
  if (doc._type === 'touristDestination') {
    return normalizePathPart(localized.vi?.current)
  }
  return normalizePathPart(localized[lang]?.current)
}

function urlFor(doc: Pick<RawDoc, '_type' | 'slug' | 'language'>, lang: Lang): string | undefined {
  const slug = slugForLang(doc, lang)
  if (doc._type === 'touristDestination') {
    if (!slug) return undefined
    return `${SITE_URL}${withTrailingSlash(`${langPrefix(lang)}/${slug}`)}`
  }
  const route = ROUTE_MAP.find((item) => item.entity === doc._type)
  if (!route || !slug) return undefined
  return `${SITE_URL}${withTrailingSlash(`${langPrefix(lang)}/${route.segments[lang]}/${slug}`)}`
}

function refUrl(ref: RefDoc | undefined, lang: Lang): string | undefined {
  if (!ref?._type || !ref.slug) return undefined
  return urlFor(ref as RawDoc, lang)
}

function buildUrls(doc: RawDoc): Partial<Record<Lang, string>> {
  const urls: Partial<Record<Lang, string>> = {}
  for (const lang of LANGS) {
    // Tiêu chí phải KHỚP fetchAllSlugs (sanity.ts): defined(title.[lang]) không
    // fallback vi — nếu không, entities.json khai URL cho trang không được build.
    if (doc._type !== 'article' && !strictTextForLang(doc.title, lang)) continue
    const url = urlFor(doc, lang)
    if (url) urls[lang] = url
  }
  return urls
}

function countBy<T extends string>(items: T[]): Record<T, number> {
  return items.reduce((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1
    return acc
  }, {} as Record<T, number>)
}

function compactObject<T extends Record<string, unknown>>(input: T): T {
  const output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (Array.isArray(value) && value.length === 0) continue
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) continue
    output[key] = value
  }
  return output as T
}

async function readPrices(): Promise<Record<string, PriceEntry>> {
  return YAML.parse(pricesYaml) ?? {}
}

async function fetchRawDocs(): Promise<RawDoc[]> {
  const query = `*[
    _type in $types &&
    reviewStatus == "approved" &&
    !(_id in path("drafts.**"))
  ]{
    _id, _type, _createdAt, _updatedAt, updatedAt, publishedAt,
    reviewStatus, approvedBy, contentProvenance,
    title, slug, summary, language,
    sameAs, officialSource, url,
    mainImage { asset->{ url }, alt },
    category[]->{ _id, termCode, name },
    bookingRef { key },
    isAccessibleForFree,
    ticketUrl,
    containedInPlace->{ _id, _type, title, slug, sameAs, url },
    venue->{ _id, _type, title, slug, sameAs, url },
    itinerary[] {
      place->{ _id, _type, title, slug, sameAs, url },
      externalStop { name, sameAs, url }
    },
    operator->{ _id, _type, title, slug, sameAs, url },
    organizer->{ _id, _type, title, slug, sameAs, url },
    location->{ _id, _type, title, slug, sameAs, url },
    author->{ _id, _type, title, slug, sameAs, url },
    about[]->{ _id, _type, title, slug, sameAs, url },
    mentions[]->{ _id, _type, title, slug, sameAs, url },
    servesSpecialty[]->{ _id, _type, title, slug, sameAs, url },
    whereToTry[]->{ _id, _type, title, slug, sameAs, url }
  } | order(_type asc, _updatedAt desc)`
  return getClient().fetch<RawDoc[]>(query, { types: GEO_ENTITY_TYPES })
}

function entityFromRaw(doc: RawDoc, prices: Record<string, PriceEntry>): AiEntity | null {
  const urls = buildUrls(doc)
  const languages = LANGS.filter((lang) => urls[lang]) as Lang[]
  if (languages.length === 0) return null
  const title = Object.fromEntries(languages.map((lang) => [lang, textForLang(doc.title, lang)]).filter(([, value]) => value))
  const summary = Object.fromEntries(languages.map((lang) => [lang, textForLang(doc.summary, lang)]).filter(([, value]) => value))
  const bookingKey = doc.bookingRef?.key
  const canonicalUrl = urls.vi ?? urls[languages[0]]
  if (!canonicalUrl) return null

  return compactObject({
    id: cleanId(doc._id),
    type: doc._type,
    title,
    summary,
    canonicalUrl,
    urls,
    languages,
    updatedAt: doc.updatedAt ?? doc._updatedAt,
    publishedAt: doc.publishedAt,
    reviewStatus: doc.reviewStatus,
    contentProvenance: doc.contentProvenance,
    approvedBy: doc.approvedBy,
    officialSource: doc.officialSource ?? doc.url,
    sameAs: doc.sameAs,
    hasBookingRef: Boolean(bookingKey),
    isAccessibleForFree: doc.isAccessibleForFree,
    hasPriceData: Boolean(bookingKey && prices[bookingKey]),
    ticketUrl: doc.ticketUrl,
    mainImage: doc.mainImage?.asset?.url ? { url: doc.mainImage.asset.url, alt: doc.mainImage.alt } : undefined,
    topics: doc.category?.map((item) => item.termCode).filter((item): item is string => Boolean(item)),
    studioUrl: `https://${site.studioHost}.sanity.studio/desk/${doc._type};${cleanId(doc._id)}`,
  })
}

/**
 * Lấy chuỗi đầu tiên dùng được trong một field đa ngữ. Chịu được cả trường hợp
 * field bị compactObject() bỏ đi (undefined) — xem ghi chú ở AiEntity.
 */
export function firstLangText(map: Partial<Record<Lang, string>> | undefined): string | undefined {
  if (!map) return undefined
  return map.vi ?? map.en ?? Object.values(map).find((value): value is string => Boolean(value))
}

function nodeTitle(entity: AiEntity): string {
  return firstLangText(entity.title) ?? entity.id
}

function targetId(ref: RefDoc | undefined): string | undefined {
  return ref?._id ? cleanId(ref._id) : undefined
}

function pushRefEdge(edges: AiGraphEdge[], from: string, ref: RefDoc | undefined, relation: GeoRelation, sourceField: string) {
  const to = targetId(ref)
  if (!to) return
  edges.push({ from, to, relation, sourceField, confidence: 'source' })
}

function pushExternalEdge(edges: AiGraphEdge[], from: string, stop: { name?: string; sameAs?: string; url?: string } | undefined, sourceField: string) {
  if (!stop?.name) return
  const url = stop.url ?? stop.sameAs
  if (!url) return
  edges.push({
    from,
    to: `external:${stop.name}`,
    relation: 'itineraryStop',
    sourceField,
    confidence: 'source',
    external: true,
    name: stop.name,
    url,
  })
}

function graphFromRaw(rawDocs: RawDoc[], entities: AiEntity[]): GeoDataset['graph'] {
  const entityById = new Map(entities.map((entity) => [entity.id, entity]))
  const nodes = entities.map((entity) => ({
    id: entity.id,
    type: entity.type,
    title: nodeTitle(entity),
    canonicalUrl: entity.canonicalUrl,
  }))
  const edges: AiGraphEdge[] = []

  for (const doc of rawDocs) {
    const from = cleanId(doc._id)
    if (!entityById.has(from)) continue
    pushRefEdge(edges, from, doc.containedInPlace, 'containedInPlace', 'containedInPlace')
    pushRefEdge(edges, from, doc.venue, 'venue', 'venue')
    pushRefEdge(edges, from, doc.operator, 'operator', 'operator')
    pushRefEdge(edges, from, doc.organizer, 'organizer', 'organizer')
    pushRefEdge(edges, from, doc.location, 'venue', 'location')
    pushRefEdge(edges, from, doc.author, 'author', 'author')
    for (const item of doc.about ?? []) pushRefEdge(edges, from, item, 'about', 'about')
    for (const item of doc.mentions ?? []) pushRefEdge(edges, from, item, 'mentions', 'mentions')
    for (const item of doc.servesSpecialty ?? []) pushRefEdge(edges, from, item, 'servesSpecialty', 'servesSpecialty')
    for (const item of doc.whereToTry ?? []) pushRefEdge(edges, from, item, 'whereToTry', 'whereToTry')
    for (const stop of doc.itinerary ?? []) {
      pushRefEdge(edges, from, stop.place, 'itineraryStop', 'itinerary.place')
      pushExternalEdge(edges, from, stop.externalStop, 'itinerary.externalStop')
    }
  }

  // Edge nội bộ chỉ hợp lệ khi đích là node thật trong graph. Reference tới
  // document chưa approved (vd Organization còn draft) bị loại — không phát
  // edge dangling (GRAPH_TO_DANGLING).
  const validEdges = edges.filter((edge) => edge.external || entityById.has(edge.to))

  return { nodes, edges: validEdges }
}

export async function buildGeoDataset(): Promise<GeoDataset> {
  const [rawDocs, prices] = await Promise.all([fetchRawDocs(), readPrices()])
  const entities = rawDocs
    .map((doc) => entityFromRaw(doc, prices))
    .filter((entity): entity is AiEntity => Boolean(entity))
    .sort((a, b) => `${a.type}:${nodeTitle(a)}`.localeCompare(`${b.type}:${nodeTitle(b)}`, 'vi'))
  const graph = graphFromRaw(rawDocs, entities)
  const urlsByLanguage = Object.fromEntries(LANGS.map((lang) => [lang, entities.filter((entity) => entity.urls[lang]).length])) as Record<Lang, number>
  return {
    generatedAt: new Date().toISOString(),
    prices,
    entities,
    graph,
    stats: {
      totalEntities: entities.length,
      byType: countBy(entities.map((entity) => entity.type)),
      urlsByLanguage,
    },
  }
}

export function jsonResponse(data: unknown): Response {
  return new Response(`${JSON.stringify(data, null, 2)}\n`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  })
}

export function routeSummary() {
  return GEO_ENTITY_TYPES.map((type) => {
    const route = ROUTE_MAP.find((item) => item.entity === type)
    return {
      type,
      route: type === 'touristDestination' ? '/{slug}/' : route ? `/${route.segments.vi}/` : null,
      labels: route?.labels,
      hasIndex: route?.hasIndex ?? false,
    }
  })
}

export function refToUrl(ref: RefDoc | undefined, lang: Lang = 'vi'): string | undefined {
  return refUrl(ref, lang)
}
