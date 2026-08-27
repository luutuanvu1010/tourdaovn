import { ROUTE_MAP, TERM_SET_ENTITY } from './routes'
import { fetchAllDestinationSlugs, fetchAllSlugs, fetchAllTerms, fetchUsedAttractionTermSlugs } from './sanity'
import type { Lang } from './types'
import { langs, publishedDevPages, staticPages } from '../site.config'

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

export async function buildSitemapPaths(lang: Lang): Promise<string[]> {
  const paths = new Set<string>()
  paths.add(withTrailingSlash(langPrefix(lang) || '/'))

  // Trang tĩnh có file route riêng trong src/pages, không đi qua ROUTE_MAP vì nội dung là
  // config của công ty chứ không phải entity có slug. Chỉ trang đã BẬT HẲN mới vào sitemap
  // (site.config §5) — trang đang phát triển tuy xem được bằng `npm run dev` nhưng không
  // có mặt trong bản production, khai vào sitemap sẽ thành URL chết. Hiện chỉ có bản
  // tiếng Việt; thêm ngôn ngữ thì phải tạo file trang tương ứng trước.
  if (lang === 'vi') {
    for (const page of publishedDevPages) {
      paths.add(withTrailingSlash(`${langPrefix(lang)}/${page}`))
    }
  }

  for (const route of ROUTE_MAP) {
    if (route.hasIndex || route.entity.startsWith('hub-')) {
      paths.add(withTrailingSlash(`${langPrefix(lang)}/${route.segments[lang]}`))
    }
  }

  // Trang tĩnh site tự dựng (ADR-0023) — /ho-tro/, /lien-he/. Đọc từ site.config
  // chứ không liệt tay: thêm trang mới mà quên sitemap thì R4 đỏ, và đó đúng là
  // lỗi đã xảy ra khi dựng hai trang này lần đầu.
  for (const page of staticPages) {
    paths.add(withTrailingSlash(`${langPrefix(lang)}/${page}`))
  }

  const [slugs, terms, usedAttractionTerms] = await Promise.all([
    fetchAllSlugs(lang),
    fetchAllTerms(lang),
    fetchUsedAttractionTermSlugs(),
  ])

  for (const item of slugs) {
    const route = ROUTE_MAP.find((r) => r.entity === item._type)
    if (!route) continue
    paths.add(withTrailingSlash(`${langPrefix(lang)}/${route.segments[lang]}/${item.slug}`))
  }

  // Cùng nguồn ánh xạ với [...path].astro (TERM_SET_ENTITY ở routes.ts) và cùng luật
  // R2. Hai nơi này PHẢI khớp nhau từng đường: lệch một chút là sitemap phát URL ma
  // (R4) hoặc bỏ sót trang có thật (R3).
  for (const term of terms) {
    const entity = TERM_SET_ENTITY[term.inDefinedTermSet]
    if (!entity) continue
    if (term.inDefinedTermSet === 'attraction-type' && !usedAttractionTerms.has(term.slug)) continue
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
