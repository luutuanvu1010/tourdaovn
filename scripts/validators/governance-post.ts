/**
 * Post-build governance gates that inspect rendered artifacts.
 *
 * Covered controls:
 * - STACK-S23: no runtime/client price fetch in rendered bundle.
 * - BM-ORPHAN-REGION: no unresolved/no-op UI links in live page main content.
 * - BM-EMPTY-REGION: no scaffolding or empty framed regions in live page main content.
 * - S24-UPDATED-HTML: entity detail pages expose updated date in rendered HTML.
 * - S24-AUTHORITY-HTML: entity detail pages expose hidden machine-readable authority/provenance metadata.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type GateResult = {
  id: 'STACK-S23' | 'BM-ORPHAN-REGION' | 'BM-EMPTY-REGION' | 'S24-UPDATED-HTML' | 'S24-AUTHORITY-HTML'
  status: 'pass' | 'fail'
  errors: string[]
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
const DIST = resolve(REPO_ROOT, 'dist')

function allFiles(dir: string): string[] {
  const out: string[] = []
  if (!existsSync(dir)) return out
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry)
      if (statSync(full).isDirectory()) walk(full)
      else out.push(full)
    }
  }
  walk(dir)
  return out
}

function htmlFiles(): string[] {
  return allFiles(DIST).filter((file) => file.endsWith('.html'))
}

function mainHtml(html: string): string {
  return html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? ''
}

/**
 * Trang listing (CollectionPage) có cùng hình dạng URL với trang chi tiết
 * (vd term page /trai-nghiem/lan-bien/ vs detail /trai-nghiem/lan-bien-hon-mun/),
 * nên isDetailPage() không phân biệt được bằng path. Phân biệt bằng JSON-LD:
 * trang listing phát @type CollectionPage, trang chi tiết không bao giờ.
 */
function isCollectionPage(html: string): boolean {
  return /"@type":\s*"CollectionPage"/.test(html)
}

function visibleText(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function validateNoRuntimePriceFetch(): GateResult {
  const errors: string[] = []
  if (!existsSync(DIST)) {
    return { id: 'STACK-S23', status: 'fail', errors: ['dist/ không tồn tại — chạy build trước governance-post.'] }
  }

  const files = allFiles(DIST).filter((file) => /\.(html|js|mjs|css)$/i.test(file))
  const forbiddenPatterns: Array<{ re: RegExp; label: string }> = [
    { re: /fetch\s*\([^)]*(price|prices|bookingRef|booking-ref)/i, label: 'runtime fetch liên quan giá/bookingRef' },
    { re: /\/api\/(?:price|prices|booking|bookings)\b/i, label: 'endpoint giá/booking runtime' },
    { re: /https?:\/\/[^"'\s]+\/(?:api\/)?(?:price|prices|booking|bookings)\b/i, label: 'URL giá/booking runtime' },
    { re: /data\/prices\.ya?ml/i, label: 'đường dẫn prices.yaml lộ trong output' },
  ]

  for (const file of files) {
    const rel = relative(DIST, file).replace(/\\/g, '/')
    const text = readFileSync(file, 'utf-8')
    for (const pattern of forbiddenPatterns) {
      if (pattern.re.test(text)) {
        errors.push(`${rel}: phát hiện ${pattern.label}`)
      }
    }
  }

  return { id: 'STACK-S23', status: errors.length === 0 ? 'pass' : 'fail', errors }
}

function validateNoOrphanMainLinks(): GateResult {
  const errors: string[] = []
  for (const file of htmlFiles()) {
    const rel = relative(DIST, file).replace(/\\/g, '/')
    if (rel === '404.html') continue
    const main = mainHtml(readFileSync(file, 'utf-8'))
    if (!main) {
      errors.push(`${rel}: thiếu <main> để kiểm vùng UI`)
      continue
    }
    const noOpLinks = [...main.matchAll(/<a\b[^>]*href=["']#["'][^>]*>/gi)]
    if (noOpLinks.length > 0) {
      errors.push(`${rel}: có ${noOpLinks.length} link href="#" trong main content`)
    }
  }
  return { id: 'BM-ORPHAN-REGION', status: errors.length === 0 ? 'pass' : 'fail', errors }
}

function validateNoEmptyOrScaffoldRegions(): GateResult {
  const errors: string[] = []
  const scaffoldText = /\b(TODO|Lorem ipsum|coming soon|placeholder|B8\.)\b|sẽ query|đang chờ dữ liệu/i

  for (const file of htmlFiles()) {
    const rel = relative(DIST, file).replace(/\\/g, '/')
    if (rel === '404.html') continue
    const main = mainHtml(readFileSync(file, 'utf-8'))
    if (!main) continue
    const text = visibleText(main)
    if (scaffoldText.test(text)) {
      errors.push(`${rel}: main content chứa text scaffolding/placeholder`)
    }

    for (const section of main.matchAll(/<section\b[\s\S]*?<\/section>/gi)) {
      const sectionHtml = section[0]
      if (/<script\b/i.test(sectionHtml)) continue
      if (/<section\b[^>]*(?:\bhidden\b|\bdata-authority-meta\b)/i.test(sectionHtml)) continue
      const sectionText = visibleText(sectionHtml)
      const hasMediaOnly = /<(img|svg|canvas|picture)\b/i.test(sectionHtml)
      if (!sectionText && !hasMediaOnly) {
        errors.push(`${rel}: có section rỗng trong main content`)
      }
    }
  }

  return { id: 'BM-EMPTY-REGION', status: errors.length === 0 ? 'pass' : 'fail', errors }
}

function isDetailPage(rel: string): boolean {
  if (rel === 'index.html' || rel === '404.html' || rel === 'sitemap.xml') return false
  if (!rel.endsWith('/index.html')) return false
  const parts = rel.split('/')
  if (parts.length < 3) return false
  const first = parts[0]
  if (['en', 'zh', 'ko', 'ru'].includes(first)) return parts.length >= 4
  return true
}

function langForRel(rel: string): 'vi' | 'en' | 'zh' | 'ko' | 'ru' {
  const first = rel.split('/')[0]
  return (['en', 'zh', 'ko', 'ru'] as const).includes(first as any) ? (first as 'en' | 'zh' | 'ko' | 'ru') : 'vi'
}

// Nhãn "updated" + format ngày Intl theo TỪNG ngôn ngữ — đồng bộ với
// UI_COPY.updated (src/lib/uiCopy.ts) và formatDate numeric (src/lib/dates.ts).
// Kiểm đúng nhãn + đúng dạng ngày của lang trang, chặt hơn alternation cũ.
const UPDATED_PATTERNS: Record<string, RegExp> = {
  vi: /Cập nhật\s+\d{2}\/\d{2}\/\d{4}/,
  en: /Updated\s+\d{2}\/\d{2}\/\d{4}/,
  zh: /更新\s+\d{4}\/\d{2}\/\d{2}/,
  ko: /업데이트\s+\d{4}\. \d{2}\. \d{2}\./,
  ru: /Обновлено\s+\d{2}\.\d{2}\.\d{4}/,
}

function validateUpdatedDateOnDetailPages(): GateResult {
  const errors: string[] = []
  for (const file of htmlFiles()) {
    const rel = relative(DIST, file).replace(/\\/g, '/')
    if (!isDetailPage(rel)) continue
    const html = readFileSync(file, 'utf-8')
    if (isCollectionPage(html)) continue
    const main = mainHtml(html)
    const text = visibleText(main)
    if (!UPDATED_PATTERNS[langForRel(rel)].test(text)) {
      errors.push(`${rel}: trang chi tiết thiếu ngày cập nhật hiển thị trong HTML (nhãn + format theo lang)`)
    }
  }
  return { id: 'S24-UPDATED-HTML', status: errors.length === 0 ? 'pass' : 'fail', errors }
}

function validateAuthorityMetaOnDetailPages(): GateResult {
  const errors: string[] = []
  for (const file of htmlFiles()) {
    const rel = relative(DIST, file).replace(/\\/g, '/')
    if (!isDetailPage(rel)) continue
    const html = readFileSync(file, 'utf-8')
    if (isCollectionPage(html)) continue
    const main = mainHtml(html)
    const authority = main.match(/<section\b[^>]*data-authority-meta\b[^>]*>/i)?.[0]
    if (!authority) {
      errors.push(`${rel}: trang chi tiết thiếu khối authority metadata`)
      continue
    }
    if (!/\bdata-approved-by=["'][^"']+["']/i.test(authority)) {
      errors.push(`${rel}: authority metadata thiếu người duyệt`)
    }
    if (!/\bdata-content-provenance=["'](?:human|ai-t1|mixed)["']/i.test(authority)) {
      errors.push(`${rel}: authority metadata thiếu nguồn gốc nội dung hợp lệ`)
    }
    if (!/\bdata-source-url=["'][^"']+["']|\bdata-author-name=["'][^"']+["']/i.test(authority)) {
      errors.push(`${rel}: authority metadata thiếu nguồn xác minh hoặc tác giả`)
    }
  }
  return { id: 'S24-AUTHORITY-HTML', status: errors.length === 0 ? 'pass' : 'fail', errors }
}

function main() {
  console.log('=== Post-build governance gates — rendered artifact ===\n')

  const results: GateResult[] = [
    validateNoRuntimePriceFetch(),
    validateNoOrphanMainLinks(),
    validateNoEmptyOrScaffoldRegions(),
    validateUpdatedDateOnDetailPages(),
    validateAuthorityMetaOnDetailPages(),
  ]

  for (const result of results) {
    if (result.status === 'pass') {
      console.log(`[pass] ${result.id}`)
    } else {
      console.log(`[FAIL] ${result.id} — ${result.errors.length} lỗi:`)
      for (const err of result.errors) console.log(`       ${err}`)
    }
  }

  if (results.some((result) => result.status === 'fail')) process.exit(1)
}

main()
