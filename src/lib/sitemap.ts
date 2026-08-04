import { ROUTE_MAP } from './routes'
import { fetchAllDestinationSlugs, fetchAllSlugs, fetchAllTerms } from './sanity'
import type { Lang } from './types'
import { langs } from '../site.config'

/** Ngôn ngữ site đang chạy. Nguồn sự thật: src/site.config.ts */
export const LANGS: Lang[] = langs

export function langPrefix(lang: Lang): string {
  return lang === 'vi' ? '' : `/${lang}`
}

export function withTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`
}

export function homeAlternates(): Record<Lang, string> {
  return Object.fromEntries(LANGS.map((lang) => [lang, withTrailingSlash(langPrefix(lang) || '/')])) as Record<Lang, string>
}

export function destinationAlternates(slug: string): Record<Lang, string> {
  return Object.fromEntries(
    LANGS.map((lang) => [lang, withTrailingSlash(`${langPrefix(lang)}/${slug}`)]),
  ) as Record<Lang, string>
}

export function routeAlternates(entity: string, slug?: string): Record<Lang, string> {
  const route = ROUTE_MAP.find((r) => r.entity === entity)
  if (!route) return {} as Record<Lang, string>

  return Object.fromEntries(
    LANGS.map((lang) => {
      const prefix = langPrefix(lang)
      const parts = [route.segments[lang], slug].filter(Boolean)
      return [lang, withTrailingSlash(`${prefix}/${parts.join('/')}`)]
    }),
  ) as Record<Lang, string>
}

// Trang tĩnh có file route riêng trong src/pages, không đi qua ROUTE_MAP vì nội dung là
// config của công ty chứ không phải entity có slug. Khai ở đây để sitemap không bỏ sót.
// Hiện chỉ có bản tiếng Việt — thêm ngôn ngữ thì phải tạo file trang tương ứng trước.
const STATIC_PAGES: Record<string, string[]> = {
  vi: ['lo-trinh-don-khach'],
}

export async function buildSitemapPaths(lang: Lang): Promise<string[]> {
  const paths = new Set<string>()
  paths.add(withTrailingSlash(langPrefix(lang) || '/'))

  for (const page of STATIC_PAGES[lang] ?? []) {
    paths.add(withTrailingSlash(`${langPrefix(lang)}/${page}`))
  }

  for (const route of ROUTE_MAP) {
    if (route.hasIndex || route.entity.startsWith('hub-')) {
      paths.add(withTrailingSlash(`${langPrefix(lang)}/${route.segments[lang]}`))
    }
  }

  const [slugs, terms] = await Promise.all([
    fetchAllSlugs(lang),
    fetchAllTerms(lang),
  ])

  for (const item of slugs) {
    const route = ROUTE_MAP.find((r) => r.entity === item._type)
    if (!route) continue
    paths.add(withTrailingSlash(`${langPrefix(lang)}/${route.segments[lang]}/${item.slug}`))
  }

  for (const term of terms) {
    const entity = term.inDefinedTermSet === 'experience-type' ? 'experience' : 'tour'
    const route = ROUTE_MAP.find((r) => r.entity === entity)
    if (!route) continue
    paths.add(withTrailingSlash(`${langPrefix(lang)}/${route.segments[lang]}/${term.slug}`))
  }

  const destinationSlugs = await fetchAllDestinationSlugs()
  const routeSegments = new Set(ROUTE_MAP.flatMap((route) => Object.values(route.segments)))
  for (const slug of destinationSlugs) {
    if (!slug || routeSegments.has(slug)) continue
    paths.add(withTrailingSlash(`${langPrefix(lang)}/${slug}`))
  }

  return Array.from(paths).sort()
}

export function sitemapUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}${withTrailingSlash(path)}`
}
