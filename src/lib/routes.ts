import type { Lang } from './types'
// `import type` bị xoá lúc biên dịch, nên routes.ts KHÔNG kéo theo client Sanity
// vào mọi component đang dùng nó. Giữ đúng một nguồn cho kiểu này.
import type { TermSlugGap } from './sanity'
import {
  enabledRoutes,
  isRouteEnabled,
  entities as ENTITY_FLAGS,
  hubs as HUB_FLAGS,
  nav,
  staticPages,
  langs,
  defaultLang,
  type NavItem,
} from '../site.config'

/** Mọi mục ĐÃ ĐƯỢC KHAI trong site.config, kể cả mục đang để false. */
const DECLARED_KEYS = new Set<string>([
  ...Object.keys(ENTITY_FLAGS),
  ...Object.keys(HUB_FLAGS),
])

export interface RouteEntry {
  entity: string
  segments: Record<Lang, string>
  labels: Record<Lang, string>
  hasIndex: boolean
  hasTerm: boolean
}

/**
 * BẢNG ĐỊA CHỈ URL — chỉ trả lời "mục này nằm ở đường dẫn nào".
 *
 * Việc BẬT/TẮT một mục KHÔNG nằm ở đây, mà ở `src/site.config.ts`.
 * Bảng này chỉ là danh mục địa chỉ; `ROUTE_MAP` bên dưới đã được lọc theo
 * công tắc trong site.config, nên phần còn lại của code không cần biết
 * mục nào đang bật hay tắt.
 */
const ROUTE_TABLE: RouteEntry[] = [
  { entity: 'place',            segments: { vi:'dia-danh',         en:'places',          zh:'地点',       ko:'장소',       ru:'места' },                  labels: { vi:'Địa danh',      en:'Places',          zh:'地点',       ko:'장소',       ru:'Места' },                  hasIndex: true,  hasTerm: false },
  { entity: 'attraction',       segments: { vi:'diem-tham-quan',   en:'attractions',     zh:'景点',       ko:'명소',       ru:'достопримечательности' }, labels: { vi:'Điểm tham quan', en:'Attractions',     zh:'景点',       ko:'명소',       ru:'Достопримечательности' }, hasIndex: true,  hasTerm: false },
  { entity: 'experience',       segments: { vi:'trai-nghiem',      en:'experiences',     zh:'体验',       ko:'체험',       ru:'впечатления' },            labels: { vi:'Trải nghiệm',    en:'Experiences',     zh:'体验',       ko:'체험',       ru:'Впечатления' },            hasIndex: true,  hasTerm: true },
  { entity: 'hotel',            segments: { vi:'khach-san',        en:'hotels',          zh:'酒店',       ko:'호텔',       ru:'отели' },                  labels: { vi:'Khách sạn',      en:'Hotels',          zh:'酒店',       ko:'호텔',       ru:'Отели' },                  hasIndex: true,  hasTerm: false },
  { entity: 'resort',           segments: { vi:'resort',           en:'resorts',         zh:'度假村',     ko:'리조트',     ru:'курорты' },                labels: { vi:'Resort',         en:'Resorts',         zh:'度假村',     ko:'리조트',     ru:'Курорты' },                hasIndex: true,  hasTerm: false },
  { entity: 'tour',             segments: { vi:'tour',             en:'tours',           zh:'旅行团',     ko:'투어',       ru:'туры' },                   labels: { vi:'Tour',           en:'Tours',           zh:'旅行团',     ko:'투어',       ru:'Туры' },                   hasIndex: true,  hasTerm: true },
  { entity: 'article',          segments: { vi:'cam-nang',         en:'guides',          zh:'攻略',       ko:'가이드',     ru:'гайды' },                  labels: { vi:'Cẩm nang',       en:'Guides',          zh:'攻略',       ko:'가이드',     ru:'Гайды' },                  hasIndex: true,  hasTerm: false },
  { entity: 'person',           segments: { vi:'tac-gia',          en:'authors',         zh:'作者',       ko:'작가',       ru:'авторы' },                 labels: { vi:'Tác giả',        en:'Authors',         zh:'作者',       ko:'작가',       ru:'Авторы' },                 hasIndex: false, hasTerm: false },
  { entity: 'organization',     segments: { vi:'cong-ty',          en:'companies',       zh:'公司',       ko:'회사',       ru:'компании' },               labels: { vi:'Công ty',        en:'Companies',       zh:'公司',       ko:'회사',       ru:'Компании' },               hasIndex: false, hasTerm: false },
  { entity: 'hub-kham-pha',     segments: { vi:'kham-pha',         en:'things-to-do',    zh:'玩乐',       ko:'즐길거리',   ru:'развлечения' },            labels: { vi:'Khám phá',       en:'Things to do',    zh:'玩乐',       ko:'즐길거리',   ru:'Развлечения' },            hasIndex: false, hasTerm: false },
  { entity: 'hub-luu-tru',      segments: { vi:'luu-tru',          en:'where-to-stay',   zh:'住宿',       ko:'숙소',       ru:'проживание' },             labels: { vi:'Lưu trú',        en:'Where to stay',   zh:'住宿',       ko:'숙소',       ru:'Проживание' },             hasIndex: false, hasTerm: false },
  { entity: 'hub-di-lai',       segments: { vi:'di-lai',           en:'getting-around',  zh:'交通',       ko:'교통',       ru:'транспорт' },              labels: { vi:'Đi lại',         en:'Getting around',  zh:'交通',       ko:'교통',       ru:'Транспорт' },              hasIndex: false, hasTerm: false },
  { entity: 'hub-all',          segments: { vi:'tat-ca',           en:'all',             zh:'all',        ko:'all',        ru:'all' },                    labels: { vi:'Tất cả',         en:'All',             zh:'全部',       ko:'전체',       ru:'Все' },                    hasIndex: false, hasTerm: false },
]

// ───────────────────────────────────────────────────────────────────────────
//  BỘ KIỂM CHỐNG LỆCH — chạy lúc build, mặc định TỪ CHỐI
//  (Hiến pháp Điều 8.5: không có bằng chứng đạt thì coi như chưa đạt.)
//
//  Bắt hai kiểu sai:
//   (a) Bật một mục trong site.config nhưng quên khai địa chỉ URL cho nó
//       → mục đó sẽ im lặng biến mất khỏi site. Nay build DỪNG.
//   (b) Khai địa chỉ URL cho một mục chưa hề có trong site.config
//       → không ai biết mục đó đang bật hay tắt. Nay build DỪNG.
// ───────────────────────────────────────────────────────────────────────────
function assertRouteConfigConsistency(): void {
  const tableKeys = new Set(ROUTE_TABLE.map(r => r.entity))
  const problems: string[] = []

  for (const key of enabledRoutes) {
    if (!tableKeys.has(key)) {
      problems.push(
        `  • "${key}" đang BẬT trong site.config.ts nhưng chưa có địa chỉ URL trong routes.ts`,
      )
    }
  }

  for (const key of tableKeys) {
    if (!DECLARED_KEYS.has(key)) {
      problems.push(
        `  • "${key}" có địa chỉ URL trong routes.ts nhưng chưa được khai trong site.config.ts`,
      )
    }
  }

  if (problems.length > 0) {
    throw new Error(
      '\n\n[site.config] Cấu hình site không khớp bảng địa chỉ URL:\n' +
        problems.join('\n') +
        '\n\nSửa src/site.config.ts hoặc src/lib/routes.ts cho khớp rồi build lại.\n',
    )
  }
}

assertRouteConfigConsistency()

/**
 * Bảng địa chỉ THỰC TẾ của site — đã lọc theo công tắc trong site.config.ts.
 * Đây là thứ mọi nơi khác trong code phải dùng.
 */
export const ROUTE_MAP: RouteEntry[] = ROUTE_TABLE.filter(r => isRouteEnabled(r.entity))

export function lookupRoute(segment: string, lang: Lang): RouteEntry | null {
  return ROUTE_MAP.find(r => r.segments[lang] === segment) ?? null
}

export function isTermEntity(entity: string): boolean {
  return entity === 'experience' || entity === 'tour'
}

// ───────────────────────────────────────────────────────────────────────────
//  MENU CHÍNH — phân giải `nav` trong site.config.ts thành địa chỉ thật
//  (ADR-0023. Trước đây menu viết cứng ở Header/Footer/homepage — DR-007.)
// ───────────────────────────────────────────────────────────────────────────

/** Một mục menu đã phân giải xong, sẵn sàng render. */
export interface ResolvedNavItem {
  label: string
  /** Địa chỉ đích. `null` với mục 'zalo' chưa điền link, và với mục có children. */
  href: string | null
  /** Địa chỉ nội bộ phải tồn tại trong build. `null` nếu đích nằm ngoài site. */
  internalPath: string | null
  children: ResolvedNavItem[]
}

function langPrefix(lang: Lang): string {
  return lang === defaultLang ? '' : `/${lang}`
}

/** Segment công khai của một danh mục hoặc hub. `null` nếu mục đang tắt. */
function segmentOf(entity: string, lang: Lang): string | null {
  return ROUTE_MAP.find(r => r.entity === entity)?.segments[lang] ?? null
}

/**
 * Đổi một mục menu thành đường dẫn nội bộ.
 * Trả `null` khi đích nằm ngoài site ('zalo') hoặc mục chỉ là nhóm chứa con.
 * Ném lỗi khi khai sai — bắt sớm còn hơn để menu trỏ vào hư không.
 */
function resolveInternalPath(item: NavItem, lang: Lang): string | null {
  if (item.children?.length) return null
  if (item.kind === 'zalo') return null

  const prefix = langPrefix(lang)
  const bad = (msg: string) => {
    throw new Error(`\n\n[site.config] Mục menu "${item.label}": ${msg}\n`)
  }

  if (!item.kind) bad('thiếu `kind`. Xem bảng sáu loại đích ở site.config.ts mục 7.')
  if (!item.target) bad(`\`kind: '${item.kind}'\` cần có \`target\`.`)
  const target = item.target as string

  if (item.kind === 'static') {
    if (!(staticPages as readonly string[]).includes(target)) {
      bad(`trang tĩnh "${target}" chưa khai trong \`staticPages\` ở site.config.ts.`)
    }
    return `${prefix}/${target}/`
  }

  if (item.kind === 'index' || item.kind === 'hub') {
    const seg = segmentOf(target, lang)
    if (!seg) bad(`"${target}" không có địa chỉ URL, hoặc đang tắt trong site.config.ts.`)
    return `${prefix}/${seg}/`
  }

  // 'detail' và 'term' dùng chung dạng '<danh mục>/<đường dẫn>'
  const slash = target.indexOf('/')
  if (slash < 1 || slash === target.length - 1) {
    bad(`\`kind: '${item.kind}'\` cần \`target\` dạng '<danh mục>/<đường dẫn>', đang là "${target}".`)
  }
  const entity = target.slice(0, slash)
  const slug = target.slice(slash + 1)
  const seg = segmentOf(entity, lang)
  if (!seg) bad(`danh mục "${entity}" không có địa chỉ URL, hoặc đang tắt trong site.config.ts.`)
  if (item.kind === 'term' && !isTermEntity(entity)) {
    bad(`danh mục "${entity}" không có trang danh mục con, nên \`kind: 'term'\` không dùng được.`)
  }
  return `${prefix}/${seg}/${slug}/`
}

/**
 * Menu đã phân giải, cho một ngôn ngữ.
 *
 * `zaloUrl` lấy từ siteSettings lúc build. Chưa điền thì mục 'zalo' bị bỏ hẳn
 * khỏi menu — không render nút chết.
 */
export function resolveNav(lang: Lang, zaloUrl?: string | null): ResolvedNavItem[] {
  const walk = (items: NavItem[]): ResolvedNavItem[] =>
    items.flatMap(item => {
      if (item.kind === 'zalo' && !zaloUrl) return []
      const children = item.children?.length ? walk(item.children) : []
      if (item.children?.length && children.length === 0) return []
      const internalPath = resolveInternalPath(item, lang)
      return [{
        label: item.label,
        href: item.kind === 'zalo' ? (zaloUrl ?? null) : internalPath,
        internalPath,
        children,
      }]
    })
  return walk(nav)
}

/** Mọi đường dẫn nội bộ mà menu trỏ tới, cho mọi ngôn ngữ đang bật. */
export function navInternalPaths(): string[] {
  const out: string[] = []
  const walk = (items: ResolvedNavItem[]) => {
    for (const item of items) {
      if (item.internalPath) out.push(item.internalPath)
      walk(item.children)
    }
  }
  // Truyền zaloUrl giả để mục 'zalo' không bị lọc mất — nó không có đường dẫn
  // nội bộ nên không ảnh hưởng kết quả.
  for (const lang of langs) walk(resolveNav(lang, 'https://zalo.me/placeholder'))
  return out
}

/**
 * BỘ KIỂM: mọi mục menu phải trỏ tới trang mà lần build này THỰC SỰ sinh ra.
 * Mức `fail` (QĐ-2026-08-05-14). Gọi từ getStaticPaths sau khi đã dựng xong
 * danh sách trang.
 *
 * Không có phép kiểm này thì khai một mục menu quá sớm sẽ lên production rồi
 * khách bấm vào trang trắng. Có nó, build dừng ngay trên máy.
 */
export function assertNavTargetsExist(generatedPaths: Iterable<string>): void {
  const norm = (p: string) => `/${p.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/')
  const have = new Set([...generatedPaths].map(norm))

  // Giới hạn đã biết của phép kiểm này: trang tĩnh được TIN là có, không được
  // kiểm. Lúc getStaticPaths chạy, các file trang khác chưa dựng nên không có
  // cách nào biết. Khai một tên vào `staticPages` mà quên tạo file .astro thì
  // chỗ này không bắt được — R4 post-build mới bắt, bằng cách so sitemap với
  // output thật. R4 đã chứng minh bắt được đúng loại lỗi đó khi hai trang
  // /ho-tro/ và /lien-he/ lần đầu bị quên khỏi sitemap.
  for (const key of staticPages) {
    for (const lang of langs) have.add(norm(`${langPrefix(lang)}/${key}`))
  }

  const missing = navInternalPaths().filter(p => !have.has(norm(p)))
  if (missing.length === 0) return

  throw new Error(
    '\n\n[site.config] Menu đang trỏ tới trang KHÔNG TỒN TẠI:\n' +
      [...new Set(missing)].map(p => `  • ${p}`).join('\n') +
      '\n\nNguyên nhân thường gặp: khai mục menu trước khi nhập nội dung trong\n' +
      'Sanity Studio, hoặc đường dẫn (slug) trong `nav` không khớp document thật.\n\n' +
      'Sửa: nhập nội dung trước, hoặc tạm ghi chú dòng đó lại trong\n' +
      'src/site.config.ts mục 7, rồi build lại.\n',
  )
}

/** Mọi mục menu `kind: 'term'`, đã phẳng hoá qua các cấp con. */
function navTermItems(): NavItem[] {
  const out: NavItem[] = []
  const walk = (items: NavItem[]) => {
    for (const item of items) {
      if (item.children?.length) { walk(item.children); continue }
      if (item.kind === 'term' && item.target) out.push(item)
    }
  }
  walk(nav)
  return out
}

/**
 * BỘ KIỂM: mục menu `kind: 'term'` trỏ vào một category CÓ THẬT nhưng chưa
 * điền `slug`. Mức `fail`. Gọi từ getStaticPaths, TRƯỚC assertNavTargetsExist.
 *
 * Vì sao cần riêng một cổng nữa khi đã có assertNavTargetsExist: cổng kia chỉ
 * biết "trang không tồn tại" nên nó đoán sai bệnh — nó bảo chủ dự án đi nhập
 * nội dung, trong khi nội dung đã có đủ và cái thiếu chỉ là một ô `slug` trong
 * category. Sự cố 2026-08-13 mất một vòng chẩn đoán vì đúng câu đoán sai đó.
 *
 * Giới hạn đã biết: cổng này khớp `target` của menu với `termCode`. Hai giá trị
 * ấy trùng nhau khi slug sinh tự động từ tên (mặc định của Studio). Nếu chủ dự
 * án cố ý đặt slug khác termCode thì cổng này im, và assertNavTargetsExist vẫn
 * bắt được — chỉ là với câu đoán chung chung như cũ.
 */
export function assertNavTermsHaveSlug(gaps: Iterable<TermSlugGap>): void {
  const byCode = new Map<string, TermSlugGap>()
  for (const g of gaps) byCode.set(g.termCode, g)
  if (byCode.size === 0) return

  const hits: string[] = []
  for (const item of navTermItems()) {
    const target = item.target as string
    const gap = byCode.get(target.slice(target.indexOf('/') + 1))
    if (gap) hits.push(`  • "${item.label}" → ${target}   (category "${gap.name}", bộ ${gap.inDefinedTermSet})`)
  }
  if (hits.length === 0) return

  throw new Error(
    '\n\n[site.config] Mục menu trỏ vào category CHƯA ĐIỀN SLUG:\n' +
      hits.join('\n') +
      '\n\nCategory có thật và đã publish, nhưng ô `slug` (nhóm SEO) còn trống.\n' +
      'Trang danh mục con sinh ra từ `slug`, không phải từ `termCode`, nên thiếu\n' +
      'ô đó thì không có trang nào để menu trỏ vào.\n\n' +
      'Sửa: mở category trong Sanity Studio, điền ô `slug`, publish, rồi build lại.\n',
  )
}

/**
 * BÁO CÁO mức `warn`: category term-set còn trống `slug`. Build vẫn chạy —
 * đây là mô tả hiện trạng để chủ dự án rà, không phải danh sách bắt buộc.
 * Cái nào đang bị menu trỏ vào thì assertNavTermsHaveSlug đã chặn cứng ở trên.
 */
export function reportTermSlugGaps(gaps: TermSlugGap[]): void {
  if (gaps.length === 0) return
  console.warn(
    `\n[danh mục con] ${gaps.length} category chưa điền slug — không có trang danh mục con:\n` +
      gaps.map(g => `  ${g.inDefinedTermSet.padEnd(16)} ${g.name} (termCode: ${g.termCode})`).join('\n') +
      '\n',
  )
}
