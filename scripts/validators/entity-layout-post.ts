/**
 * Entity detail layout contract.
 *
 * Tầng 1 — Component selection: detail phải dùng DetailLayout (wrapper chung) hoặc
 *          Hero/Section/Gallery/FactStrip/NearbySection/Sidebar (primitive chung).
 * Tầng 2 — Container containment: mọi visible element trong detail phải nằm trong container.
 * Tầng 3 — FactStrip contract: 9 entity có FactStrip, 3 không có.
 * Tầng 4 — Hero caller contract: mọi NƠI GỌI Hero phải ghi danh và phải truyền
 *          `gallery`. Xem khối HERO_CALLERS bên dưới (DR-076).
 *
 * Nguyên tắc container policy (chốt 2026-06-30):
 *   Mỗi component visible trong detail phải tự bọc <div class="container">,
 *   hoặc được bọc bởi một primitive đã có container (Hero, Section, FAQ, Gallery, FactStrip).
 *   Không có element nào được render trần ra ngoài container.
 *   Ngoại lệ: FactStrip (full-width bar có chủ ý), Hero (full-width).
 *
 * B8.13 (2026-06-30): DetailLayout.astro là proxy hợp lệ cho Hero/Sidebar/NearbySection/FactStrip.
 *   Template dùng DetailLayout không cần import trực tiếp các primitive đó.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')

type DetailRule = {
  file: string
  requiresAny: string[]
  note: string
}

const SHARED_PRIMITIVES = [
  'src/components/DetailLayout.astro',
  'src/components/Hero.astro',
  'src/components/Section.astro',
  'src/components/Gallery.astro',
  'src/components/FactStrip.astro',
  'src/components/NearbySection.astro',
  'src/components/Sidebar.astro',
  'src/components/BookingCTA.astro',
  'src/components/LodgingDetail.astro',
  'src/styles/tokens.css',
]

// B8.13: DetailLayout là proxy hợp lệ cho Hero + Sidebar + NearbySection + FactStrip.
// Mỗi rule yêu cầu EITHER import trực tiếp các primitive cũ HOẶC import DetailLayout.
const DETAIL_RULES: DetailRule[] = [
  {
    file: 'src/components/PlaceDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Place detail must use shared DetailLayout or Hero/Section/FactStrip/Sidebar backbone',
  },
  {
    file: 'src/components/AttractionDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Attraction detail must use shared DetailLayout or Hero/Section/FactStrip/Sidebar backbone',
  },
  {
    file: 'src/components/RestaurantDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Restaurant detail must use shared DetailLayout or Hero/Section/FactStrip/Sidebar backbone',
  },
  {
    file: 'src/components/SpecialtyDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Specialty detail must use shared DetailLayout or Hero/Section/FactStrip/Sidebar backbone',
  },
  {
    file: 'src/components/ExperienceDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Experience detail must use shared DetailLayout or Hero/Section/FactStrip/Sidebar backbone',
  },
  {
    file: 'src/components/LodgingDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Hotel/Resort shared lodging detail must use shared DetailLayout or Hero/Section/FactStrip/Sidebar backbone',
  },
  {
    file: 'src/components/HotelDetail.astro',
    requiresAny: ["import LodgingDetail from './LodgingDetail.astro'"],
    note: 'Hotel detail must delegate to LodgingDetail',
  },
  {
    file: 'src/components/ResortDetail.astro',
    requiresAny: ["import LodgingDetail from './LodgingDetail.astro'"],
    note: 'Resort detail must delegate to LodgingDetail',
  },
  {
    file: 'src/components/TourDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Tour detail must use shared DetailLayout or Hero/Section/FactStrip/Sidebar backbone',
  },
  {
    file: 'src/components/EventDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Event detail must use shared DetailLayout or Hero/Section/FactStrip/Sidebar backbone',
  },
  {
    file: 'src/components/ArticleDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Article detail must use shared DetailLayout or Hero/Section/Sidebar backbone (no FactStrip)',
  },
  {
    file: 'src/components/OrganizationDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Organization detail must use shared DetailLayout or Hero/Section/Sidebar backbone (no FactStrip)',
  },
  {
    file: 'src/components/PersonDetail.astro',
    requiresAny: ["import DetailLayout from './DetailLayout.astro'", "import Hero from './Hero.astro'"],
    note: 'Person detail must use shared DetailLayout or Hero/Section/Sidebar backbone (no FactStrip)',
  },
]

const LEGACY_EXCEPTIONS: string[] = []

const FORBIDDEN_DRIFT = [
  { file: 'src/components/LodgingDetail.astro', pattern: 'class="hotel-head"', reason: 'old lodging header bypasses shared Hero' },
]

function readRel(path: string): string {
  return readFileSync(resolve(REPO_ROOT, path), 'utf-8')
}

/**
 * Cắt ra từng thẻ mở `<Hero ...>` trong một file.
 *
 * Đếm ngoặc nhọn chứ không cắt ở dấu `>` đầu tiên: `hasOverlay={badgeList.length > 0}`
 * có `>` NẰM TRONG biểu thức, cắt thô sẽ nuốt mất phần đuôi của thẻ và làm cổng
 * báo thiếu prop trong khi prop có thật.
 */
function heroOpenTags(content: string): string[] {
  const tags: string[] = []
  let from = 0
  for (;;) {
    const start = content.indexOf('<Hero', from)
    if (start < 0) break
    let depth = 0
    let end = content.length - 1
    for (let i = start; i < content.length; i++) {
      const ch = content[i]
      if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (ch === '>' && depth === 0) { end = i; break }
    }
    tags.push(content.slice(start, end + 1))
    from = start + '<Hero'.length
  }
  return tags
}

function main() {
  console.log('=== Entity layout contract ===\n')

  const errors: string[] = []

  for (const path of SHARED_PRIMITIVES) {
    if (!existsSync(resolve(REPO_ROOT, path))) {
      errors.push(`thiếu primitive layout chung: ${path}`)
    }
  }

  const known = new Set([...DETAIL_RULES.map((rule) => rule.file), ...LEGACY_EXCEPTIONS])
  const detailDir = resolve(REPO_ROOT, 'src', 'components')
  for (const name of readdirSync(detailDir)) {
    if (!name.endsWith('Detail.astro')) continue
    const rel = `src/components/${name}`
    if (!known.has(rel)) {
      errors.push(`${rel}: detail entity mới chưa được khai báo trong layout contract`)
    }
  }

  for (const rule of DETAIL_RULES) {
    const path = resolve(REPO_ROOT, rule.file)
    if (!existsSync(path)) {
      errors.push(`${rule.file}: không tồn tại`)
      continue
    }
    const content = readRel(rule.file)
    if (!rule.requiresAny.some((needle) => content.includes(needle))) {
      errors.push(`${rule.file}: ${rule.note}`)
    }
  }

  for (const item of FORBIDDEN_DRIFT) {
    const content = readRel(item.file)
    if (content.includes(item.pattern)) {
      errors.push(`${item.file}: còn "${item.pattern}" — ${item.reason}`)
    }
  }

  const heroContent = readRel('src/components/Hero.astro')
  const HERO_MOSAIC_CONTRACT = [
    { needle: 'class="hero-media-grid"', note: 'Hero phải bọc ảnh chính và gallery trong media grid chung' },
    { needle: 'class="hero-gallery-grid"', note: 'Hero gallery phải là grid phải 2x2 kiểu Booking/Klook' },
    { needle: '.hero-block--mosaic .hero-media-grid', note: 'Hero phải có biến thể mosaic khi có gallery' },
    { needle: 'const hasGallery = galleryItems.length === 4', note: 'Hero mosaic chỉ được bật khi có đủ 4 ảnh phụ kiểu Hotel' },
    { needle: 'grid-template-rows: repeat(2, minmax(0, 1fr));', note: 'Hero gallery desktop phải có 2 hàng ảnh' },
    { needle: '.hero-gallery-item img', note: 'Hero gallery phải khóa kích thước ảnh bên trong từng ô' },
    { needle: 'min-height: 0;', note: 'Hero gallery item phải cho phép grid row co đều, không đè mất hàng dưới' },
  ]
  for (const item of HERO_MOSAIC_CONTRACT) {
    if (!heroContent.includes(item.needle)) {
      errors.push(`src/components/Hero.astro: ${item.note}`)
    }
  }
  if (heroContent.includes('hero-gallery-strip')) {
    errors.push('src/components/Hero.astro: không quay lại gallery strip ngang cũ')
  }
  for (const pattern of [
    '.hero-gallery-item:first-child:last-child',
    '.hero-gallery-item:first-child:nth-last-child(2)',
    '.hero-gallery-item:nth-child(3):last-child',
  ]) {
    if (heroContent.includes(pattern)) {
      errors.push(`src/components/Hero.astro: không dùng rule span "${pattern}" vì Hero Hotel-style phải luôn 2x2 đều`)
    }
  }

  // ── Tầng 4: Hero caller contract (DR-076) ──
  // Vì sao phải có tầng này: HERO_MOSAIC_CONTRACT ở trên chỉ đọc `Hero.astro`,
  // tức chỉ kiểm Hero CÓ CÀI mosaic. Nó không kiểm nơi gọi CÓ TRUYỀN `gallery`.
  // Và vòng quét tự động của tầng 1 chỉ nhặt file kết thúc bằng `Detail.astro`,
  // nên `TouristDestinationHub.astro` nằm ngoài MỌI cổng. Hai khoảng mù đó cộng
  // lại: chỗ gọi ở trang điểm đến đánh rơi `gallery` mà cả bộ kiểm vẫn xanh —
  // hero điểm đến không bao giờ vào được mosaic dù dữ liệu đủ 4 ảnh. DR-076.
  const HERO_CALLERS: { file: string; note: string }[] = [
    { file: 'src/components/DetailLayout.astro', note: 'khung chung trang chi tiết' },
    { file: 'src/components/TouristDestinationHub.astro', note: 'trang điểm đến — 06 §4.1 "khung chung áp dụng, cộng"' },
  ]
  const heroCallerFiles = new Set(HERO_CALLERS.map((caller) => caller.file))
  for (const name of readdirSync(detailDir)) {
    if (!name.endsWith('.astro')) continue
    const rel = `src/components/${name}`
    if (rel === 'src/components/Hero.astro') continue
    if (!readRel(rel).includes('<Hero')) continue
    if (!heroCallerFiles.has(rel)) {
      errors.push(`${rel}: render <Hero> nhưng chưa khai trong HERO_CALLERS — nơi gọi Hero mới phải được ghi danh`)
    }
  }
  for (const caller of HERO_CALLERS) {
    if (!existsSync(resolve(REPO_ROOT, caller.file))) {
      errors.push(`${caller.file}: khai trong HERO_CALLERS nhưng file không tồn tại`)
      continue
    }
    const tags = heroOpenTags(readRel(caller.file))
    if (tags.length === 0) {
      errors.push(`${caller.file}: khai là nơi gọi Hero nhưng không render <Hero>`)
      continue
    }
    for (const tag of tags) {
      if (!/\bgallery=/.test(tag)) {
        errors.push(`${caller.file}: <Hero> thiếu prop gallery — 06 §3 hàng Hero bắt gallery đủ 4 ảnh đi qua Hero mosaic (${caller.note})`)
      }
    }
  }

  const renderDetailFiles = DETAIL_RULES
    .map((rule) => rule.file)
    .filter((file) => !['src/components/HotelDetail.astro', 'src/components/ResortDetail.astro'].includes(file))

  for (const file of renderDetailFiles) {
    const content = readRel(file)

    if (content.includes('AuthorityMeta')) {
      errors.push(`${file}: không render AuthorityMeta/source provenance trong layout Entity`)
    }

    if (content.includes('<Gallery')) {
      errors.push(`${file}: Gallery phải đi qua Hero gallery mosaic, không render section gallery rời`)
    }

    // B8.13: Hero/title order check relaxed — DetailLayout handles this.
    // Only check for templates NOT using DetailLayout.
    const usesDetailLayout = content.includes("import DetailLayout from './DetailLayout.astro'")
    if (!usesDetailLayout) {
      const heroIndex = content.indexOf('<Hero')
      const breadcrumbIndex = content.indexOf('<Breadcrumb')
      if (heroIndex >= 0 && breadcrumbIndex >= 0 && heroIndex > breadcrumbIndex) {
        errors.push(`${file}: Hero/title phải đứng trước Breadcrumb`)
      }
    }

    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes('<Section') && !line.includes('contained={false}')) {
        errors.push(`${file}:${i + 1}: Section trong two-col phải dùng contained={false} để tránh nested container`)
      }
      if (line.includes('<FAQ') && !line.includes('contained={false}')) {
        errors.push(`${file}:${i + 1}: FAQ trong two-col phải dùng contained={false} để tránh nested container`)
      }
    }
  }

  // ── Tầng 3: FactStrip contract ──
  // B8.13: DetailLayout handles FactStrip rendering — a template using
  // DetailLayout satisfies the requirement without importing FactStrip
  // directly. Task 7 fix round (2026-08-23): InfoBar.astro deleted, all 9
  // entities below now render their quick facts through DetailLayout's
  // `facts` prop rather than a direct FactStrip/InfoBar import.
  const ENTITIES_WITH_FACTSTRIP = [
    'src/components/PlaceDetail.astro',
    'src/components/AttractionDetail.astro',
    'src/components/ExperienceDetail.astro',
    'src/components/RestaurantDetail.astro',
    'src/components/SpecialtyDetail.astro',
    'src/components/LodgingDetail.astro',
    'src/components/TourDetail.astro',
    'src/components/EventDetail.astro',
    // QĐ-2026-08-29-02: Bài viết chuyển từ InfoCard sang FactStrip, tức vào
    // đúng khung chung mà chín entity kia đã dùng. Chuyển hàng ở đây để sổ hợp
    // đồng khai đúng thực tế — để nguyên ở danh sách "không có FactStrip" thì
    // cổng vẫn xanh nhưng nói sai, đúng loại lỗi DR-050.
    'src/components/ArticleDetail.astro',
    // QĐ-2026-08-29-03: hai template cuối cùng chuyển nốt. ENTITIES_WITHOUT_
    // FACTSTRIP nay RỖNG — mọi entity detail đều đi qua FactStrip. Giữ mảng
    // rỗng thay vì xoá: vòng lặp bên dưới vẫn chạy, và mảng rỗng nói rõ "không
    // còn ngoại lệ", khác hẳn với việc xoá đi rồi không ai biết từng có.
    'src/components/PersonDetail.astro',
    'src/components/OrganizationDetail.astro',
  ]
  const ENTITIES_WITHOUT_FACTSTRIP: string[] = []

  for (const file of ENTITIES_WITH_FACTSTRIP) {
    if (!existsSync(resolve(REPO_ROOT, file))) continue
    const content = readRel(file)
    const hasDirectImport = content.includes("import FactStrip from './FactStrip.astro'")
    const usesDetailLayout = content.includes("import DetailLayout from './DetailLayout.astro'")
    if (!hasDirectImport && !usesDetailLayout) {
      errors.push(`${file}: entity yêu cầu FactStrip nhưng thiếu import hoặc DetailLayout`)
    }
  }

  for (const file of ENTITIES_WITHOUT_FACTSTRIP) {
    if (!existsSync(resolve(REPO_ROOT, file))) continue
    if (readRel(file).includes("import FactStrip from './FactStrip.astro'")) {
      errors.push(`${file}: entity KHÔNG có FactStrip nhưng lại import FactStrip`)
    }
  }

  // Sidebar contract — B8.13: DetailLayout wraps Sidebar, templates only need DetailLayout
  for (const file of [...ENTITIES_WITH_FACTSTRIP, ...ENTITIES_WITHOUT_FACTSTRIP]) {
    if (!existsSync(resolve(REPO_ROOT, file))) continue
    const content = readRel(file)
    const hasSidebarImport = content.includes("import Sidebar from './Sidebar.astro'")
    const usesDetailLayout = content.includes("import DetailLayout from './DetailLayout.astro'")
    if (!hasSidebarImport && !usesDetailLayout) {
      errors.push(`${file}: thiếu Sidebar import hoặc DetailLayout`)
    }
  }

  // NearbySection contract — B8.13: DetailLayout wraps NearbySection
  for (const file of [...ENTITIES_WITH_FACTSTRIP, ...ENTITIES_WITHOUT_FACTSTRIP]) {
    if (!existsSync(resolve(REPO_ROOT, file))) continue
    const content = readRel(file)
    const hasNearbyImport = content.includes("import NearbySection from './NearbySection.astro'")
    const usesDetailLayout = content.includes("import DetailLayout from './DetailLayout.astro'")
    if (!hasNearbyImport && !usesDetailLayout) {
      errors.push(`${file}: thiếu NearbySection import hoặc DetailLayout`)
    }
  }

  // ── Tầng 2: Container containment ──
  const SHARED_CONTAINMENT = [
    { file: 'src/components/Breadcrumb.astro', needle: '<div class="container">', note: 'Breadcrumb must wrap nav in container' },
    // QĐ-2026-08-29-02 đổi markup sang `class:list` để bật `two-col--solo` khi
    // cột phụ rỗng, nên neo cũ `<div class="container two-col">` không còn khớp.
    // Neo mới vẫn kiểm đúng điều cần kiểm: hai lớp `container` và `two-col`
    // cùng nằm trên một phần tử.
    { file: 'src/components/DetailLayout.astro', needle: '["container", "two-col"', note: 'DetailLayout must have container two-col' },
  ]
  for (const item of SHARED_CONTAINMENT) {
    if (!readRel(item.file).includes(item.needle)) {
      errors.push(`${item.file}: ${item.note}`)
    }
  }

  const BARE_VISIBLE_CLASSES = [
    'updated', 'badge-row', 'cta-row', 'meta-row', 'summary-block',
    'cat-section', 'pills-section', 'logo-section', 'meta-section', 'cat-row',
    'gallery-head', 'gallery-heading', 'gallery-underline',
    'author-box',
  ]
  const detailFiles = [...DETAIL_RULES.map(r => r.file), 'src/components/LodgingDetail.astro']
  for (const file of [...new Set(detailFiles)]) {
    if (!existsSync(resolve(REPO_ROOT, file))) continue
    const usesDetailLayout = readRel(file).includes("import DetailLayout from './DetailLayout.astro'")
    const lines = readRel(file).split('\n')
    for (let i = 0; i < lines.length; i++) {
      for (const cls of BARE_VISIBLE_CLASSES) {
        if (lines[i].includes(`class="${cls}"`) && !lines[i].includes('container')) {
          const prev = lines.slice(Math.max(0, i - 2), i).join('\n')
          const next = lines.slice(i + 1, Math.min(lines.length, i + 3)).join('\n')
          const isContained = prev.includes('class="container"')
            || prev.includes("class=\"summary-section\"")
            || prev.includes('<div class="container">')
            || next.includes('class="container"')
            || next.includes('<div class="container">')
          // B8.13: elements inside DetailLayout slots are contained by DetailLayout's container
          if (!isContained && usesDetailLayout) {
            // Skip — DetailLayout wraps content slot in <div class="container two-col">
            continue
          }
          if (!isContained) {
            errors.push(`${file}:${i + 1}: .${cls} không có container trong 2 dòng lân cận`)
          }
        }
      }
    }
  }

  const tokens = readRel('src/styles/tokens.css')
  const baseLayout = readRel('src/layouts/BaseLayout.astro')
  if (!baseLayout.includes("import '../styles/tokens.css'")) {
    errors.push('BaseLayout.astro không import src/styles/tokens.css')
  }
  for (const token of ['--font-display:', '--font-ui:', '--fs-base:', '--lh-body:', '--container:']) {
    if (!tokens.includes(token)) errors.push(`tokens.css thiếu token nền ${token}`)
  }

  if (errors.length > 0) {
    console.log(`[FAIL] Entity layout contract — ${errors.length} lỗi:`)
    for (const err of errors) console.log(`       ${err}`)
    process.exit(1)
  }

  console.log(`[pass] ${DETAIL_RULES.length} detail rules, ${LEGACY_EXCEPTIONS.length} legacy exceptions declared`)
  console.log(`[pass] FactStrip contract: ${ENTITIES_WITH_FACTSTRIP.length} with, ${ENTITIES_WITHOUT_FACTSTRIP.length} without`)
}

main()
