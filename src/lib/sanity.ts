import { createClient, type SanityClient } from '@sanity/client'
import { allDestinationSlugsQuery } from './queries/touristDestination'
import { fieldLevelEntities } from '../site.config'

let client: SanityClient | null = null

// ─────────────────────────────────────────────────────────────────────────────
// Lớp quan sát field thiếu (SPEC-2026-08-05, bước 3)
//
// Kiểu dữ liệu đã khai thật (`| null` trong types.ts) nên build không còn vỡ vì
// field trống. Nhưng "không vỡ" mà im lặng thì chủ dự án không biết có ô nào
// đang bỏ trống. Lớp này CHỈ QUAN SÁT: nó đếm và in, không sửa một giá trị nào.
// Sửa ở đây sẽ che mất chính tín hiệu nó sinh ra để báo.
//
// Mức `warn` theo đúng định nghĩa sẵn có ở 04-CONSTRAINTS §0: build chạy tiếp,
// vi phạm in thành báo cáo cuối log build để founder rà. Không thêm cổng mới,
// không đụng VALIDATOR_LEVELS, không đụng control-registry.yaml.
//
// Đây là báo cáo MÔ TẢ ("field này đang trống"), không phải QUY ĐỊNH ("field này
// bắt buộc"). Nguồn sự thật về field bắt buộc vẫn là 01-CONTENT_MODEL §2 và
// scripts/gate.config.ts — xem chú thích cuối báo cáo.
// ─────────────────────────────────────────────────────────────────────────────

// docKey ("attraction / hon-mun") → những field trả null trên document đó.
const nullsByDoc = new Map<string, Set<string>>()

/**
 * Truy vấn gộp nhiều loại entity (`_type in [...]`) chiếu chung một bộ field
 * cho mọi loại, nên nó trả null cho những field mà loại đó vốn không có —
 * "article thiếu itinerary", "place thiếu venue". Đó là hình dạng truy vấn,
 * không phải ô bỏ trống. Bỏ qua chúng; các document ấy vẫn được truy vấn riêng
 * theo từng loại ở nơi khác, và bản riêng mới nói đúng loại đó có field gì.
 */
function isUnionQuery(query: string): boolean {
  return /_type\s+in\s/.test(query)
}

/**
 * Duyệt kết quả GROQ, ghi lại field nào trả null. Không đổi giá trị.
 *
 * Chỉ tính những object có CẢ `_type` lẫn `_id` là document. Object lồng như
 * ảnh hay kết quả `select()` theo ngôn ngữ cũng mang `_type` nhưng không có
 * `_id`; đếm chúng chỉ sinh nhiễu chứ không cho biết ô nào đang bỏ trống.
 */
function scanForMissing(node: unknown, depth = 0): void {
  if (depth > 6 || node === null || typeof node !== 'object') return

  if (Array.isArray(node)) {
    for (const item of node) scanForMissing(item, depth + 1)
    return
  }

  const obj = node as Record<string, unknown>
  const type = typeof obj._type === 'string' ? obj._type : null

  if (type !== null && typeof obj._id === 'string') {
    const slug = typeof obj.slug === 'string' ? obj.slug : obj._id
    const docKey = `${type} / ${slug}`
    let fields = nullsByDoc.get(docKey)
    if (!fields) {
      fields = new Set()
      nullsByDoc.set(docKey, fields)
    }
    for (const [key, value] of Object.entries(obj)) {
      if (!key.startsWith('_') && value === null) fields.add(key)
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('_') || value === null) continue
    if (typeof value === 'object') scanForMissing(value, depth + 1)
  }
}

let reported = false

function reportMissing(): void {
  if (reported) return
  reported = true

  const rows: Array<[string, string[]]> = []
  for (const [docKey, fields] of [...nullsByDoc].sort()) {
    if (fields.size > 0) rows.push([docKey, [...fields].sort()])
  }
  if (rows.length === 0) return

  const fieldCount = rows.reduce((n, [, fields]) => n + fields.length, 0)
  const width = Math.min(46, Math.max(...rows.map(([doc]) => doc.length)))

  const lines = [
    '',
    `[dữ liệu thiếu] ${fieldCount} field trống trên ${rows.length} document — ` +
    'trang vẫn dựng, phần liên quan không hiển thị',
    '',
  ]
  for (const [doc, fields] of rows) lines.push(`  ${doc.padEnd(width)}  ${fields.join(', ')}`)
  lines.push('')
  lines.push('  Đây là báo cáo mô tả, không phải danh sách field bắt buộc.')
  lines.push('  Field nào bắt buộc: xem 01-CONTENT_MODEL §2 và scripts/gate.config.ts.')
  lines.push('')

  console.warn(lines.join('\n'))
}

// Chỉ gắn khi đang chạy trong Node lúc build. File này cũng bị gói vào
// `_worker.js`, mà runtime Workers không có `process.on` — gọi thẳng sẽ nổ trên
// production. Cùng cách phòng thủ mà `getClient()` bên dưới đã dùng cho
// `process.env`.
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('exit', reportMissing)
}

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
    /* Đọc qua `apicdn.sanity.io` thay vì `api.sanity.io`. Hai endpoint có HẠN
       MỨC RIÊNG, và bản dựng là hộ tiêu thụ lớn nhất: mỗi lần dựng đọc lại toàn
       bộ dữ liệu cho ~140 trang cộng các endpoint máy đọc.

       2026-08-25 hạn mức của `api` cạn — build của Cloudflare chết ở bước
       prerender với `plan_limit_reached`, và mọi bản dựng ở máy cũng hỏng. Cùng
       lúc đó `apicdn` vẫn trả 200. Xem `QĐ-2026-08-25-06`.

       Đánh đổi: CDN có thể trả nội dung trễ tới ~60 giây. Ở dự án này việc đó
       không thành vấn đề vì publish và deploy vốn đã tách rời — webhook Sanity
       đang tắt theo `QĐ-2026-08-22-03`, nên nội dung chỉ lên trang khi có người
       đẩy mã. Đo lúc chuyển: bản dựng qua CDN cho 141 URL so với 140 đang chạy,
       thêm một bài mới, **không mất trang nào**.

       Vẫn gửi kèm token: đã kiểm, `apicdn` nhận token và trả 200 bình thường
       với `perspective: 'published'`. */
    useCdn: true,
    perspective: 'published',
  })

  // Gắn lớp quan sát vào chính client singleton. Làm ở đây vì đây là nơi duy
  // nhất `createClient` được gọi, nên mọi đường đọc dữ liệu — 6 file gọi thẳng
  // `getClient().fetch(...)` lẫn các helper bên dưới — đều được phủ, không cần
  // sửa 17 lời gọi rải rác.
  const originalFetch = client.fetch.bind(client)
  client.fetch = (async (query: string, params?: unknown, options?: unknown) => {
    const result = await (originalFetch as (...args: unknown[]) => Promise<unknown>)(
      query, params, options
    )
    if (!isUnionQuery(query)) scanForMissing(result)
    return result
  }) as typeof client.fetch

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

/** Category thuộc hai bộ term nhưng CHƯA điền `slug` — nên không có trang danh mục con. */
export interface TermSlugGap {
  termCode: string
  name: string
  inDefinedTermSet: string
}

export interface TermScan {
  terms: TermEntry[]
  gaps: TermSlugGap[]
}

/**
 * Quét mọi category thuộc hai bộ term, TÁCH làm hai: cái đã điền `slug` (có
 * trang danh mục con) và cái chưa (không có trang).
 *
 * Vì sao phải tách thay vì lọc thẳng trong GROQ như trước: `slug` là field tuỳ
 * chọn trong `cms/schemas/category.ts` (nhóm seo), còn `termCode` mới là field
 * bắt buộc. Lọc `defined(slug.current)` ngay trong truy vấn làm category thiếu
 * slug BIẾN MẤT CÂM khỏi build — không trang, không cảnh báo, không ai biết.
 * Đó chính là cách trang danh mục "Tour đảo" vắng mặt cho tới 2026-08-13.
 * Nay cái thiếu vẫn bị loại khỏi danh sách trang, nhưng được trả về để gọi ở
 * ngoài dựng cổng trên nó.
 */
export async function scanTerms(): Promise<TermScan> {
  const c = getClient()
  const query = `*[_type == "category" && inDefinedTermSet in ["experience-type", "tour-type"]]{
    "termCode": termCode.current,
    "slug": slug.current,
    "name": coalesce(name.vi, termCode.current),
    inDefinedTermSet
  }`
  const rows = (await c.fetch<Array<TermEntry & { name: string }>>(query)) ?? []

  return {
    terms: rows.filter(r => typeof r.slug === 'string' && r.slug !== ''),
    gaps: rows
      .filter(r => typeof r.slug !== 'string' || r.slug === '')
      .map(({ termCode, name, inDefinedTermSet }) => ({ termCode, name, inDefinedTermSet })),
  }
}

export async function fetchAllTerms(_lang: string): Promise<TermEntry[]> {
  return (await scanTerms()).terms
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
  // `defined(translationGroup)` là ĐIỀU KIỆN, không phải phòng thủ thừa.
  // Không có nó, bài chưa gắn nhóm dịch làm vế phải thành `null`, và
  // `translationGroup._ref == null` khớp MỌI bài cũng chưa gắn — tức toàn bộ.
  // Vòng lặp bên dưới gán alternates[lang] theo thứ tự, cái cuối thắng, nên mỗi
  // bài nhận `vi` alternate trỏ sang một bài KHÁC. Đo 2026-08-25: 0/18 bài có
  // translationGroup, mà vị từ khớp cả 18 → 51 lỗi R4 trên 18 trang. Xem DR-057.
  const query = `{
    "current": *[_id == $id][0]{ _type, language, reviewStatus, translationGroup },
    "translations": *[
      _type == "article" &&
      reviewStatus == "approved" &&
      defined(slug.current) &&
      defined(language) &&
      defined(translationGroup) &&
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
