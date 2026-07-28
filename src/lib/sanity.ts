import { createClient, type SanityClient } from '@sanity/client'
import { allDestinationSlugsQuery } from './queries/touristDestination'
import { fieldLevelEntities } from '../site.config'

let client: SanityClient | null = null

export function getClient(): SanityClient {
  if (client) return client

  // Đọc biến từ cả import.meta.env (.env local) và process.env (Cloudflare/CI build)
  const penv = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>
  const projectId = import.meta.env.SANITY_STUDIO_PROJECT_ID || penv.SANITY_STUDIO_PROJECT_ID
  const dataset = import.meta.env.SANITY_STUDIO_DATASET || penv.SANITY_STUDIO_DATASET || 'production'
  const token = import.meta.env.SANITY_READ_TOKEN || penv.SANITY_READ_TOKEN

  if (!projectId) {
    throw new Error('SANITY_STUDIO_PROJECT_ID is required')
  }

  client = createClient({
    projectId,
    dataset,
    apiVersion: '2026-06-01',
    token,
    useCdn: false,
    perspective: 'published',
  })

  return client
}

// Danh mục cần hỏi Sanity lúc build. Lấy từ site.config nên khi tắt một danh
// mục, site thôi luôn việc truy vấn nó — không còn tải dữ liệu chết.
const FIELD_LEVEL_TYPES = fieldLevelEntities

export interface SlugEntry {
  _type: string
  slug: string
}

export async function fetchAllSlugs(lang: string): Promise<SlugEntry[]> {
  const c = getClient()
  const fieldLevel = `*[_type in $fieldTypes && reviewStatus == "approved" && defined(slug.${lang}.current) && defined(title.${lang})]{
    _type,
    "slug": slug.${lang}.current
  }`
  const docLevel = `*[_type == "article" && language == $lang && reviewStatus == "approved" && defined(slug.current)]{
    _type,
    "slug": slug.current
  }`
  const query = `{ "field": ${fieldLevel}, "doc": ${docLevel} }`
  const result = await c.fetch<{ field: SlugEntry[]; doc: SlugEntry[] }>(query, {
    fieldTypes: FIELD_LEVEL_TYPES,
    lang,
  })
  return [...result.field, ...result.doc]
}

export interface TermEntry {
  termCode: string
  slug: string
  inDefinedTermSet: string
}

export async function fetchAllTerms(_lang: string): Promise<TermEntry[]> {
  const c = getClient()
  const query = `*[_type == "category" && inDefinedTermSet in ["experience-type", "tour-type"] && defined(slug.current)]{
    termCode,
    "slug": slug.current,
    inDefinedTermSet
  }`
  return c.fetch(query) as Promise<TermEntry[]>
}

export async function fetchAllDestinationSlugs(): Promise<string[]> {
  const c = getClient()
  const results = await c.fetch<Array<{ slug: string }>>(allDestinationSlugsQuery())
  return (results ?? []).map(r => r.slug).filter(Boolean)
}

export async function fetchOne(query: string, params: Record<string, unknown> = {}) {
  const c = getClient()
  return c.fetch(query, params)
}

export interface AlternateSlugs {
  _type: string
  vi?: string
  en?: string
  zh?: string
  ko?: string
  ru?: string
  reviewStatus?: string
}

export async function fetchAlternateSlugs(id: string): Promise<AlternateSlugs | null> {
  const c = getClient()
  const query = `*[_id == $id][0]{
    _type,
    "vi": select(defined(slug.vi.current) && defined(title.vi) => slug.vi.current),
    "en": select(defined(slug.en.current) && defined(title.en) => slug.en.current),
    "zh": select(defined(slug.zh.current) && defined(title.zh) => slug.zh.current),
    "ko": select(defined(slug.ko.current) && defined(title.ko) => slug.ko.current),
    "ru": select(defined(slug.ru.current) && defined(title.ru) => slug.ru.current),
    reviewStatus
  }`
  const result = await c.fetch<AlternateSlugs | null>(query, { id })
  return result ?? null
}

export async function fetchArticleAlternateSlugs(id: string): Promise<AlternateSlugs | null> {
  const c = getClient()
  const query = `{
    "current": *[_id == $id][0]{ _type, language, reviewStatus, translationGroup },
    "translations": *[
      _type == "article" &&
      reviewStatus == "approved" &&
      defined(slug.current) &&
      defined(language) &&
      translationGroup._ref == *[_id == $id][0].translationGroup._ref
    ]{
      language,
      "slug": slug.current
    }
  }`
  const result = await c.fetch<{
    current: { _type?: string; reviewStatus?: string; translationGroup?: { _ref?: string } } | null
    translations: Array<{ language?: string; slug?: string }>
  }>(query, { id })

  if (!result.current || result.current._type !== 'article' || result.current.reviewStatus !== 'approved') {
    return null
  }

  const alternates: AlternateSlugs = { _type: 'article', reviewStatus: 'approved' }
  for (const item of result.translations ?? []) {
    if (item.language && item.slug && ['vi', 'en', 'zh', 'ko', 'ru'].includes(item.language)) {
      alternates[item.language as keyof Pick<AlternateSlugs, 'vi' | 'en' | 'zh' | 'ko' | 'ru'>] = item.slug
    }
  }

  return alternates
}
