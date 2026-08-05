/**
 * Meta-validator G3: BINDING_MAP vs Astro template field access.
 *
 * Kiểm: mỗi vùng giao diện khai trong BINDING_MAP có được template Astro
 * render đúng field không. Phát hiện: field có trong BINDING_MAP nhưng
 * template không dùng → vùng câm; field template dùng nhưng BINDING_MAP
 * không khai → dữ liệu không được đặc tả.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isEntityEnabled } from '../../src/site.config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
// Xem ghi chú cùng loại ở g1: spec sống ở docs/core-specs/, không phải project/.
const BINDING_MAP_PATH = resolve(REPO_ROOT, 'docs', 'core-specs', '06-BINDING_MAP.md')
const COMPONENTS_DIR = resolve(REPO_ROOT, 'src', 'components')
const REPORT_DIR = resolve(REPO_ROOT, 'scripts', 'reports')

// ── Entity → template file mapping ──
const ENTITY_TEMPLATES: Record<string, string> = {
  place: 'PlaceDetail.astro',
  attraction: 'AttractionDetail.astro',
  experience: 'ExperienceDetail.astro',
  restaurant: 'RestaurantDetail.astro',
  specialty: 'SpecialtyDetail.astro',
  hotel: 'LodgingDetail.astro',
  resort: 'LodgingDetail.astro',
  tour: 'TourDetail.astro',
  event: 'EventDetail.astro',
  article: 'ArticleDetail.astro',
  person: 'PersonDetail.astro',
  organization: 'OrganizationDetail.astro',
}

// ── BINDING_MAP: ĐỌC THẲNG TỪ MARKDOWN ──
//
// Trước 2026-08-05 chỗ này là một bảng CHÉP TAY từ 06-BINDING_MAP.md, và
// `BINDING_MAP_PATH` khai ở đầu file không hề được dùng. Hệ quả: validator mang
// tên bản ánh xạ nhưng chưa từng mở nó, nên tài liệu và bộ kiểm là hai nguồn sự
// thật song song (N7, P6). Sửa bản ánh xạ không làm đổi gì máy kiểm — đã đo:
// sau khi v2 khai bù đủ field, g3 vẫn ra đúng 40 cảnh báo như cũ. Ghi ở DR-027,
// chủ dự án chốt hướng 1 ngày 2026-08-05.
//
// Nay bảng ở markdown là nguồn duy nhất. Quy ước máy đọc (06-BINDING_MAP §1):
//   • tên field Sanity viết trong dấu backtick ở cột "Dữ liệu nuôi"
//   • vùng không áp dụng cho entity nào ghi ở cột "Ghi chú" theo khuôn
//     `không áp dụng: <entity>, <entity>`
// Chữ ngoài backtick là văn xuôi, không phải tên field.

interface ZoneDef {
  zone: string
  sources: string[]     // Sanity field names
  required: boolean
  excludes: Set<string> // entity không áp dụng vùng này
}

/**
 * Tên field hợp lệ: định danh camelCase, cho phép tiền tố `_` của field hệ
 * thống Sanity (`_updatedAt`). Loại `prices.yaml`, `src/site.config.ts`...
 */
function isFieldName(token: string): boolean {
  return /^_?[a-z][A-Za-z0-9]*$/.test(token)
}

function splitRow(line: string): string[] {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
}

/**
 * "có" và "có (gate…)" là bắt buộc; "nên có", "tùy", "chỉ …" thì không.
 * Cố ý chặt: đánh nhầm thành bắt buộc sẽ sinh drift mức fail giả.
 */
function isRequired(cell: string): boolean {
  const c = cell.trim().toLowerCase()
  return c.startsWith('có') && !c.startsWith('nên')
}

function parseZoneTable(lines: string[]): ZoneDef[] {
  const zones: ZoneDef[] = []
  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue
    const cells = splitRow(line)
    if (cells.length < 3) continue
    if (/^-+$/.test(cells[0].replace(/[\s-]/g, '-'))) continue   // dòng kẻ
    if (cells[0] === 'Vùng giao diện' || cells[0] === 'Vùng trong card') continue
    if (cells[0] === 'Trang' || cells[0] === 'Hub' || cells[0] === '#') continue

    const sources = [...cells[1].matchAll(/`([^`]+)`/g)]
      .map(m => m[1])
      .filter(isFieldName)
    if (sources.length === 0) continue   // vùng ăn config/rollup/decor — không phải field

    // Tìm "không áp dụng:" ở BẤT KỲ cột nào sau cột "Bắt buộc?" — hàng có thể
    // có số cột khác nhau, nên bám cột cuối là bám nhầm.
    const tail = cells.slice(3).join(' ')
    const ex = tail.match(/không áp dụng:\s*([^|]+)/i)
    // Chỉ nhận định danh trần; dừng ở dấu ngoặc để văn xuôi giải thích trong
    // ngoặc không lọt vào danh sách entity.
    const excludes = new Set(
      ex
        ? ex[1]
            .split(',')
            .map(x => x.trim().toLowerCase().split(/[\s(]/)[0])
            .filter(x => /^[a-z][a-zA-Z]*$/.test(x))
        : [],
    )

    zones.push({ zone: cells[0], sources, required: isRequired(cells[2] ?? ''), excludes })
  }
  return zones
}

/** Tiêu đề §4.x → khoá entity. Một tiêu đề có thể mang hai entity (Hotel và Resort). */
function entitiesInHeading(heading: string): string[] {
  const found: string[] = []
  for (const key of Object.keys(ENTITY_TEMPLATES)) {
    const label = key === 'organization' ? 'Organization'
      : key.charAt(0).toUpperCase() + key.slice(1)
    if (new RegExp(`\\b${label}\\b`, 'i').test(heading)) found.push(key)
  }
  return found
}

function parseBindingMap(): { common: ZoneDef[]; perEntity: Record<string, ZoneDef[]> } {
  const md = readFileSync(BINDING_MAP_PATH, 'utf-8').split('\n')

  const common: ZoneDef[] = []
  const perEntity: Record<string, ZoneDef[]> = {}

  let mode: 'none' | 'common' | 'delta' = 'none'
  let current: string[] = []
  let buffer: string[] = []

  const flush = () => {
    if (mode === 'common') common.push(...parseZoneTable(buffer))
    else if (mode === 'delta') {
      const zones = parseZoneTable(buffer)
      for (const e of current) (perEntity[e] ??= []).push(...zones)
    }
    buffer = []
  }

  for (const line of md) {
    if (/^## 3\. /.test(line)) { flush(); mode = 'common'; current = []; continue }
    if (/^## 4\. /.test(line)) { flush(); mode = 'none'; current = []; continue }
    // §8 là phụ lục entity đang tắt — không tính vào hợp đồng đang hiệu lực
    if (/^## (5|6|7|8)\. /.test(line)) { flush(); mode = 'none'; current = []; continue }
    if (/^### 4\.\d+ /.test(line)) {
      flush()
      current = entitiesInHeading(line)
      mode = current.length > 0 ? 'delta' : 'none'
      continue
    }
    buffer.push(line)
  }
  flush()

  return { common, perEntity }
}

const { common: COMMON_FRAME_ZONES, perEntity: ENTITY_DELTA_ZONES } = parseBindingMap()

// ── Step 1: Extract data.xxx field accesses from an Astro template ──

function extractFieldAccesses(templatePath: string): Set<string> {
  const fields = new Set<string>()
  let content: string
  try {
    content = readFileSync(templatePath, 'utf-8')
  } catch {
    return fields
  }

  // Pattern 1: data.fieldName — truy cập thẳng, cộng dạng ép kiểu
  // `(data as ResortResult).beachfront` mà LodgingDetail dùng cho field riêng
  // của Resort. Thiếu nhánh thứ hai thì g3 báo câm nhầm cho vùng có render thật.
  const directPattern = /data(?:\s+as\s+\w+)?\)?\.(\w+)\b/g
  let m: RegExpExecArray | null
  while ((m = directPattern.exec(content)) !== null) {
    const name = m[1]
    // Skip Astro runtime props, destructuring artifacts
    if (name === 'Astro' || name === 'props' || name === 'site' || name === 'url') continue
    fields.add(name)
  }

  return fields
}

// ── Step 2: Compare ──

interface DriftItem {
  entityType: string
  zone: string
  diff: string        // 'zone_source_not_in_template', 'template_field_not_in_map'
  severity: 'fail' | 'warn'
  detail: string
}

function compareForEntity(
  entityType: string,
  zones: ZoneDef[],
  templateFields: Set<string>,
): DriftItem[] {
  const drifts: DriftItem[] = []

  // Skip entities with no template
  if (templateFields.size === 0) {
    drifts.push({
      entityType, zone: '—',
      diff: 'template_not_found',
      severity: 'fail',
      detail: `Không tìm thấy hoặc không parse được template cho ${entityType}`,
    })
    return drifts
  }

  // Check: each zone's sources that are in the template
  for (const zone of zones) {
    const foundSources = zone.sources.filter(s => templateFields.has(s))
    const missingSources = zone.sources.filter(s => !templateFields.has(s))

    // Zone with ALL sources missing → could be unimplemented
    if (foundSources.length === 0 && zone.required) {
      drifts.push({
        entityType, zone: zone.zone,
        diff: 'required_zone_no_source_in_template',
        severity: 'fail',
        detail: `Zone bắt buộc "${zone.zone}" (source=[${zone.sources.join(', ')}]) — KHÔNG field nào trong số này được template truy cập`,
      })
    } else if (foundSources.length === 0 && !zone.required) {
      drifts.push({
        entityType, zone: zone.zone,
        diff: 'optional_zone_no_source_in_template',
        severity: 'warn',
        detail: `Zone tùy chọn "${zone.zone}" (source=[${zone.sources.join(', ')}]) — KHÔNG field nào được template truy cập. Có thể chưa implement hoặc đang xử lý qua component khác.`,
      })
    }
  }

  // Check: template fields NOT in any BINDING_MAP zone
  const allMapSources = new Set<string>()
  for (const zone of zones) {
    for (const s of zone.sources) allMapSources.add(s)
  }
  for (const field of templateFields) {
    // Skip internal fields
    if (field.startsWith('_')) continue
    // Skip structured sub-fields
    if (field === 'children' || field === 'text' || field === 'style' || field === 'type' ||
        field === 'street' || field === 'ward' || field === 'open' || field === 'close') continue

    if (!allMapSources.has(field)) {
      drifts.push({
        entityType, zone: '—',
        diff: 'template_field_not_in_map',
        severity: 'warn',
        detail: `Template truy cập data.${field} nhưng field này không có trong BINDING_MAP cho ${entityType} — dữ liệu không được đặc tả`,
      })
    }
  }

  return drifts
}

// ── Main ──

function main() {
  console.log('=== Meta-validator G3: BINDING_MAP vs template field access ===\n')

  const allDrifts: DriftItem[] = []

  for (const [entityType, templateFile] of Object.entries(ENTITY_TEMPLATES)) {
    // Entity tắt trong site.config.ts không có URL và không sinh trang; template
    // của chúng còn trong repo để không gãy tham chiếu, nhưng không thuộc hợp
    // đồng đang hiệu lực. Bảng ánh xạ của chúng cũng nằm ở phụ lục §8.
    if (!isEntityEnabled(entityType)) {
      console.log(`[${entityType}] bỏ qua — đang tắt trong site.config.ts`)
      continue
    }
    const templatePath = resolve(COMPONENTS_DIR, templateFile)

    // Khung chung cộng delta, sau khi loại những vùng mà bản ánh xạ khai
    // "không áp dụng" cho chính entity này (06-BINDING_MAP §1).
    const zones = [
      ...COMMON_FRAME_ZONES,
      ...(ENTITY_DELTA_ZONES[entityType] || []),
    ].filter(z => !z.excludes.has(entityType))

    const templateFields = extractFieldAccesses(templatePath)

    console.log(`[${entityType}] ${templateFile}: ${templateFields.size} field accesses`)
    const drifts = compareForEntity(entityType, zones, templateFields)
    allDrifts.push(...drifts)
  }

  // Report
  if (allDrifts.length === 0) {
    console.log('\n[pass] Tất cả template khớp BINDING_MAP. Không drift.')
  } else {
    const failDrifts = allDrifts.filter(d => d.severity === 'fail')
    const warnDrifts = allDrifts.filter(d => d.severity === 'warn')
    console.log(`\n[DRIFT] ${allDrifts.length} điểm không khớp (${failDrifts.length} fail, ${warnDrifts.length} warn):\n`)

    // Group by entity for readability
    const byEntity = new Map<string, DriftItem[]>()
    for (const d of allDrifts) {
      const key = d.entityType
      if (!byEntity.has(key)) byEntity.set(key, [])
      byEntity.get(key)!.push(d)
    }

    for (const [entity, items] of byEntity) {
      console.log(`  ── ${entity} ──`)
      for (const d of items) {
        const tag = d.severity === 'fail' ? 'FAIL' : 'WARN'
        console.log(`    [${tag}] ${d.detail}`)
      }
      console.log()
    }
  }

  // Write report
  const report = {
    ranAt: new Date().toISOString(),
    summary: {
      total: allDrifts.length,
      fail: allDrifts.filter(d => d.severity === 'fail').length,
      warn: allDrifts.filter(d => d.severity === 'warn').length,
    },
    drifts: allDrifts.map(d => ({
      entityType: d.entityType,
      zone: d.zone,
      diff: d.diff,
      severity: d.severity,
      detail: d.detail,
    })),
  }
  mkdirSync(REPORT_DIR, { recursive: true })
  const reportPath = resolve(REPORT_DIR, 'g3-binding-map-vs-template.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`[report] Ghi ${reportPath}`)

  if (allDrifts.some(d => d.severity === 'fail')) {
    console.log('\n[exit] Có drift mức fail — cần sửa trước khi tiếp tục.')
    process.exit(1)
  }

  console.log('\n[exit] Không có drift mức fail.')
}

main()
