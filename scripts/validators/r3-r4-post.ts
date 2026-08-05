/**
 * R3 + R4 post-build validators (04-CONSTRAINTS §1c)
 * Chạy SAU astro build, kiểm output trong dist/.
 * Script riêng — không import vào runner pre-build.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { site, langs } from '../../src/site.config'

// Repo root = scripts/validators/ → ../../
const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
const DIST = resolve(REPO_ROOT, 'dist')
const SITE = site.url
// Bảng prefix giữ đủ 5 ngôn ngữ vì đó là tập khả dĩ của core. Nhưng danh sách
// ngôn ngữ ĐANG BẬT phải đọc từ site.config: ADR-0021 chốt site.config.ts là
// nguồn sự thật duy nhất về phạm vi site, gồm cả ngôn ngữ. Trước đây file này
// hardcode cả 5 nên R4 đòi sitemap-en/zh/ko/ru trên một site vi-only và luôn
// fail 8 lỗi. Xem docs/DRIFT_LOG.md DR-012.
const ALL_LANGS = ['vi', 'en', 'zh', 'ko', 'ru'] as const
type Lang = typeof ALL_LANGS[number]
const LANG_PREFIXES: Record<Lang, string> = { vi: '', en: '/en', zh: '/zh', ko: '/ko', ru: '/ru' }
const LANGS: readonly Lang[] = ALL_LANGS.filter((l) => (langs as readonly string[]).includes(l))

interface PostResult {
  id: string
  passed: boolean
  errors: string[]
  skipped?: string
}

// ── Helpers ──

function parseUrlsFromSitemap(xml: string): Set<string> {
  const urls = new Set<string>()
  const re = /<loc>([^<]+)<\/loc>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    urls.add(m[1].normalize('NFC'))
  }
  return urls
}

function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex\b/i.test(xml)
}

function normalizeUrlPath(url: string): string {
  const rawPath = url.startsWith('http') ? new URL(url).pathname : url
  const decoded = decodeURI(rawPath || '/').normalize('NFC')
  return decoded.endsWith('/') ? decoded : `${decoded}/`
}

function langForPath(path: string): Lang | null {
  if (path === '/') return 'vi'
  for (const lang of LANGS) {
    const prefix = LANG_PREFIXES[lang]
    if (!prefix) continue
    if (path === `${prefix}/` || path.startsWith(`${prefix}/`)) return lang
  }
  if (!/^\/(en|zh|ko|ru)(\/|$)/.test(path)) return 'vi'
  return null
}

function parseRedirects(content: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const parts = trimmed.split(/\s+/)
    if (parts.length >= 3) {
      const from = parts[0]
      const status = parseInt(parts[2], 10)
      if (!isNaN(status)) map.set(from, status)
    }
  }
  return map
}

function attrValue(tag: string, attr: string): string | null {
  const re = new RegExp(`\\s${attr}=["']([^"']+)["']`, 'i')
  return tag.match(re)?.[1] ?? null
}

function getAllHtmlFiles(dir: string): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (entry.endsWith('.html')) {
        files.push(full)
      }
    }
  }
  walk(dir)
  return files
}

function filePathToUrl(filePath: string, base: string): string {
  let rel = relative(DIST, filePath).replace(/\\/g, '/')
  if (rel.endsWith('/index.html')) {
    rel = rel.slice(0, -'index.html'.length)
  } else if (rel === 'index.html') {
    rel = ''
  } else if (rel.endsWith('.html')) {
    // Bare html files like 404.html → /404/
    rel = rel.slice(0, -'.html'.length) + '/'
  }
  const url = `${base}/${rel}`
  // Normalize to always end with / (directory-style)
  return (url.endsWith('/') ? url : url + '/').normalize('NFC')
}

/**
 * Resolve a relative path to a real file on disk, handling Unicode
 * NFD/NFC mismatch on APFS. Each path segment is matched against
 * actual directory entries by comparing NFC-normalized names.
 * Returns null if any segment cannot be found.
 */
function resolvePathOnDisk(base: string, relativePath: string): string | null {
  const segments = relativePath.split('/').filter(Boolean)
  let current = base
  for (const seg of segments) {
    if (!existsSync(current)) return null
    let found = false
    for (const entry of readdirSync(current)) {
      if (entry.normalize('NFC') === seg.normalize('NFC')) {
        current = join(current, entry)
        found = true
        break
      }
    }
    if (!found) return null
  }
  return current
}

function isPublicHtmlPage(filePath: string): boolean {
  const pagePath = filePathToUrl(filePath, '')
  return pagePath !== '/404/'
}

function readBuildSitemapPageUrls(): Set<string> {
  const sitemapPath = resolve(DIST, 'sitemap.xml')
  if (!existsSync(sitemapPath)) return new Set()
  const sitemapXml = readFileSync(sitemapPath, 'utf-8')
  if (!isSitemapIndex(sitemapXml)) return parseUrlsFromSitemap(sitemapXml)

  const urls = new Set<string>()
  for (const loc of parseUrlsFromSitemap(sitemapXml)) {
    const fileName = normalizeUrlPath(loc).replace(/^\//, '').replace(/\/$/, '')
    const childPath = resolve(DIST, fileName)
    if (!existsSync(childPath)) continue
    for (const url of parseUrlsFromSitemap(readFileSync(childPath, 'utf-8'))) {
      urls.add(url)
    }
  }
  return urls
}

async function fetchSitemapPageUrls(url: string): Promise<Set<string>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  const res = await fetch(url, { signal: controller.signal })
  clearTimeout(timeout)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()
  if (!isSitemapIndex(xml)) return parseUrlsFromSitemap(xml)

  const urls = new Set<string>()
  for (const loc of parseUrlsFromSitemap(xml)) {
    const child = await fetchSitemapPageUrls(loc)
    for (const item of child) urls.add(item)
  }
  return urls
}

// ── R3: URL không biến mất câm ──

async function validateR3(): Promise<PostResult> {
  const id = 'R3'
  const errors: string[] = []

  // Sitemap mới từ build
  const newSitemapPath = resolve(DIST, 'sitemap.xml')
  if (!existsSync(newSitemapPath)) {
    return {
      id,
      passed: false,
      errors: ['R3: dist/sitemap.xml chưa tồn tại — fail-closed vì không chứng minh được URL production'],
    }
  }
  const newSitemap = readBuildSitemapPageUrls()

  // Sitemap production cũ — fail-closed. R3 là cổng URL công khai; nếu không có
  // bằng chứng sitemap cũ thì không được âm thầm cho qua.
  let oldSitemap: Set<string>
  try {
    oldSitemap = await fetchSitemapPageUrls(`${SITE}/sitemap.xml`)
  } catch (err: any) {
    return {
      id,
      passed: false,
      errors: [`R3: không fetch được sitemap production (${err.message ?? 'unknown error'}) — fail-closed`],
    }
  }

  // Redirects
  const redirectsPath = resolve(REPO_ROOT, 'public', '_redirects')
  const redirects = existsSync(redirectsPath)
    ? parseRedirects(readFileSync(redirectsPath, 'utf-8'))
    : new Map<string, number>()

  // Check: URL cũ mất mà không có redirect
  for (const url of oldSitemap) {
    if (newSitemap.has(url)) continue
    // Derive path from url for redirect lookup
    const path = url.replace(SITE, '') || '/'
    const redirectStatus = redirects.get(path)
    if (redirectStatus && (redirectStatus === 301 || redirectStatus === 302 || redirectStatus === 410)) {
      continue
    }
    errors.push(`R3: URL "${url}" trong sitemap production cũ biến mất, không có redirect trong public/_redirects`)
  }

  return { id, passed: errors.length === 0, errors }
}

// ── R4: hreflang đối xứng + sitemap chỉ trang thật ──

function validateR4(): PostResult {
  const id = 'R4'
  const errors: string[] = []

  const htmlFiles = getAllHtmlFiles(DIST).filter(isPublicHtmlPage)

  // Build set of existing pages (as URL paths relative to site)
  const existingPaths = new Set<string>()
  for (const f of htmlFiles) {
    const url = filePathToUrl(f, '')
    existingPaths.add(url)
  }

  const sitemapIndexPath = resolve(DIST, 'sitemap.xml')
  if (!existsSync(sitemapIndexPath)) {
    errors.push('R4: dist/sitemap.xml chưa tồn tại')
  } else {
    const sitemapIndexXml = readFileSync(sitemapIndexPath, 'utf-8')
    if (!isSitemapIndex(sitemapIndexXml)) {
      errors.push('R4: /sitemap.xml phải là sitemap index, không phải urlset')
    }
    const locs = parseUrlsFromSitemap(sitemapIndexXml)
    const expected = new Set(LANGS.map((lang) => `${SITE}/sitemap-${lang}.xml`))
    for (const child of expected) {
      if (!locs.has(child)) errors.push(`R4: sitemap index thiếu sitemap con ${child}`)
    }
    for (const loc of locs) {
      if (!expected.has(loc)) errors.push(`R4: sitemap index chứa sitemap ngoài bộ 5 ngôn ngữ: ${loc}`)
    }
  }

  const sitemapUrlsByLang = new Map<Lang, Set<string>>()
  for (const lang of LANGS) {
    const childPath = resolve(DIST, `sitemap-${lang}.xml`)
    if (!existsSync(childPath)) {
      errors.push(`R4: thiếu dist/sitemap-${lang}.xml`)
      sitemapUrlsByLang.set(lang, new Set())
      continue
    }
    const childXml = readFileSync(childPath, 'utf-8')
    if (isSitemapIndex(childXml)) {
      errors.push(`R4: sitemap-${lang}.xml phải là urlset, không phải sitemap index`)
    }
    const childUrls = parseUrlsFromSitemap(childXml)
    sitemapUrlsByLang.set(lang, childUrls)
    for (const url of childUrls) {
      const path = normalizeUrlPath(url.replace(SITE, '') || '/')
      const detectedLang = langForPath(path)
      if (detectedLang !== lang) {
        errors.push(`R4: sitemap-${lang}.xml chứa URL sai ngôn ngữ/prefix: ${url}`)
      }
      if (!existingPaths.has(path)) {
        errors.push(`R4: sitemap-${lang}.xml chứa URL phantom "${url}" — không có file tương ứng trong dist/`)
      }
    }
  }

  for (const pagePath of existingPaths) {
    const lang = langForPath(pagePath)
    if (!lang) {
      errors.push(`R4: trang public ${pagePath} có prefix ngôn ngữ không hợp lệ`)
      continue
    }
    const url = `${SITE}${pagePath}`
    if (!sitemapUrlsByLang.get(lang)?.has(url)) {
      errors.push(`R4: trang public thật "${url}" không nằm trong sitemap-${lang}.xml`)
    }
  }

  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8')
    const pageUrl = filePathToUrl(file, SITE)
    const pagePath = filePathToUrl(file, '')

    // Collect hreflang declarations from this page
    const alternates: Array<{ lang: string; href: string }> = []
    for (const match of content.matchAll(/<link\b[^>]*>/gi)) {
      const tag = match[0]
      if (attrValue(tag, 'rel') !== 'alternate') continue
      const lang = attrValue(tag, 'hreflang')
      const href = attrValue(tag, 'href')
      if (lang && href) alternates.push({ lang, href: href.normalize('NFC') })
    }

    const hreflangByLang = new Map(alternates.map((alt) => [alt.lang, alt.href]))
    const currentLang = langForPath(pagePath)

    if (alternates.length === 0) {
      errors.push(`R4: ${pagePath} thiếu hreflang alternate`)
      continue
    }

    if (currentLang && hreflangByLang.get(currentLang) !== pageUrl) {
      errors.push(`R4: ${pagePath} thiếu hreflang self cho ngôn ngữ "${currentLang}"`)
    }

    const viHref = hreflangByLang.get('vi')
    if (!viHref) {
      errors.push(`R4: ${pagePath} thiếu hreflang="vi" để làm đích x-default`)
    } else if (hreflangByLang.get('x-default') !== viHref) {
      errors.push(`R4: ${pagePath} x-default phải trỏ bản tiếng Việt tương ứng ${viHref}`)
    }

    for (const alt of alternates) {
      // Check target file exists in dist
      const targetPath = normalizeUrlPath(alt.href.replace(SITE, '') || '/')
      if (!existingPaths.has(targetPath)) {
        errors.push(`R4: ${pagePath} hreflang="${alt.lang}" trỏ tới ${alt.href} nhưng file không tồn tại trong dist/`)
        continue
      }

      // Check symmetry: target must have hreflang pointing back
      const stripped = targetPath === '/' ? '' : targetPath.replace(/^\//, '').replace(/\/$/, '')
      let targetFilePath = resolvePathOnDisk(DIST, stripped ? `${stripped}/index.html` : 'index.html')
      if (!existsSync(targetFilePath)) {
        // Try bare .html (e.g. 404.html)
        const altPath = resolvePathOnDisk(DIST, `${stripped}.html`)
        if (existsSync(altPath)) {
          targetFilePath = altPath
        } else {
          errors.push(`R4: ${pagePath} hreflang="${alt.lang}" → ${targetPath}: file dist không tìm thấy`)
          continue
        }
      }

      const targetContent = readFileSync(targetFilePath, 'utf-8')
      const hasBacklink = Array.from(targetContent.matchAll(/<link\b[^>]*>/gi)).some((match) => {
        const tag = match[0]
        return attrValue(tag, 'rel') === 'alternate' && (attrValue(tag, 'href') || '').normalize('NFC') === pageUrl
      })
      if (!hasBacklink) {
        errors.push(`R4: hreflang không đối xứng: ${pagePath} → ${targetPath} (lang=${alt.lang}) nhưng ngược lại không trỏ về`)
      }
    }

    // Check prefix consistency: hreflang URL prefix must match declared language
    for (const alt of alternates) {
      if (alt.lang === 'x-default') {
        if (viHref && alt.href !== viHref) {
          errors.push(`R4: ${pagePath} x-default href sai: ${alt.href}`)
        }
        continue
      }
      const expectedPrefix = LANG_PREFIXES[alt.lang as Lang]
      if (expectedPrefix === undefined) continue
      const path = normalizeUrlPath(alt.href.replace(SITE, '') || '/')
      if (expectedPrefix === '') {
        // vi: should NOT start with /en/, /zh/, /ko/, /ru/
        if (/^\/(en|zh|ko|ru)\//.test(path)) {
          errors.push(`R4: ${pagePath} hreflang="${alt.lang}" href có prefix ngôn ngữ sai: ${path}`)
        }
      } else {
        if (!path.startsWith(expectedPrefix + '/') && path !== expectedPrefix) {
          errors.push(`R4: ${pagePath} hreflang="${alt.lang}" href thiếu prefix "${expectedPrefix}": ${path}`)
        }
      }
    }
  }

  return { id, passed: errors.length === 0, errors }
}

// ── Main ──

async function main() {
  console.log('=== Post-build validator — R3 + R4 ===\n')

  if (!existsSync(DIST)) {
    console.error('[error] dist/ không tồn tại — chạy astro build trước.')
    process.exit(1)
  }

  const results: PostResult[] = []

  results.push(await validateR3())
  results.push(validateR4())

  let failCount = 0
  for (const r of results) {
    if (r.skipped) {
      console.log(`[skip] ${r.id} — ${r.skipped}`)
    } else if (r.passed) {
      console.log(`[pass] ${r.id}`)
    } else {
      console.log(`[FAIL] ${r.id} — ${r.errors.length} lỗi:`)
      for (const err of r.errors) {
        console.log(`       ${err}`)
      }
      failCount++
    }
  }

  console.log(`\n=== Kết quả post-build: ${failCount === 0 ? 'ĐẠT' : `${failCount} FAIL`} ===`)

  if (failCount > 0) {
    process.exit(1)
  }
}

main()
