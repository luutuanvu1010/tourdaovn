/**
 * Sinh docs/design-context/COMPONENT_INVENTORY.md từ src/components/*.astro.
 *
 * Inventory là DẪN XUẤT từ code, không phải nguồn. Sửa component thì chạy lại
 * script, không sửa tay file markdown.
 *
 * Đường ra sửa 2026-08-05: trước đây ghi vào `project/design-context/`, thư mục
 * không tồn tại ở tourdaovn nên script chưa từng chạy được. Chú thích cũ còn dẫn
 * `docs/superpowers/specs/2026-07-13-design-context-pack-design.md`, cũng không
 * tồn tại; đã gỡ. Xem docs/DRIFT_LOG.md DR-010.
 *
 * Ràng buộc 04-CONSTRAINTS điều cấm 7: cấm lấy repo root từ CWD của tiến trình,
 * vì npm --prefix đổi CWD. Resolve từ import.meta.url, tức vị trí của chính file này.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, join, relative } from 'node:path'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const COMPONENTS_DIR = resolve(REPO_ROOT, 'src/components')
const LIB_DIR = resolve(REPO_ROOT, 'src/lib')
const OUT_DIR = resolve(REPO_ROOT, 'docs/design-context')
const OUT_FILE = join(OUT_DIR, 'COMPONENT_INVENTORY.md')

/** Type dựng sẵn của TS hoặc DOM, không cần giải về module dự án. */
const BUILTIN_TYPES = new Set([
  'Array', 'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Exclude',
  'Extract', 'NonNullable', 'ReturnType', 'Parameters', 'Promise', 'Map', 'Set',
  'Date', 'RegExp', 'Error', 'Function', 'Object', 'String', 'Number', 'Boolean',
  'HTMLElement', 'HTMLAttributes', 'ImageMetadata', 'Props',
])

/** Nhóm component suy ra từ quy ước tên file. Không có bảng ánh xạ viết tay. */
function groupOf(name) {
  if (name.startsWith('Home')) return 'Trang chủ'
  if (name.endsWith('Detail')) return 'Template entity detail'
  if (name.endsWith('Index') || name.startsWith('Hub')) return 'Trang danh sách'
  return 'Primitive dùng chung'
}
const GROUP_ORDER = [
  'Primitive dùng chung',
  'Template entity detail',
  'Trang danh sách',
  'Trang chủ',
]

/** Frontmatter là phần giữa cặp `---` đầu tiên và thứ hai của file .astro. */
function frontmatterOf(source) {
  if (!source.startsWith('---')) return ''
  const end = source.indexOf('\n---', 3)
  return end === -1 ? '' : source.slice(3, end)
}

/**
 * Bóc thân một `interface X { ... }` bằng đếm ngoặc nhọn, bắt đầu từ vị trí marker.
 * Không dùng regex: thân interface chứa ngoặc lồng, ví dụ object type inline và
 * `import('../lib/types').NearbyEntity[]`.
 */
function braceMatch(source, marker) {
  const open = source.indexOf('{', marker)
  if (open === -1) return null

  let depth = 0
  for (let i = open; i < source.length; i++) {
    const ch = source[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return source.slice(marker, i + 1)
    }
  }
  return null
}

function extractProps(frontmatter) {
  const marker = frontmatter.indexOf('export interface Props')
  return marker === -1 ? null : braceMatch(frontmatter, marker)
}

/**
 * Mọi khai báo type ở frontmatter component: `interface X {...}` và `type X = ...`.
 * Chúng là phần của hợp đồng API khi Props tham chiếu tới, nên phải vào inventory.
 * Ví dụ InfoBarItem (InfoBar.astro), HomeCard (HomeRollupSection.astro).
 */
function localTypeDecls(frontmatter) {
  const decls = new Map()

  for (const m of frontmatter.matchAll(/(?:export\s+)?interface\s+([A-Za-z0-9_]+)/g)) {
    if (m[1] === 'Props') continue
    const text = braceMatch(frontmatter, m.index)
    if (text) decls.set(m[1], text)
  }

  // `type X = A | B` kể cả union xuống dòng bằng dấu | ở đầu dòng.
  for (const m of frontmatter.matchAll(
    /(?:export\s+)?type\s+([A-Za-z0-9_]+)\s*=[^\n;]*(?:\n\s*\|[^\n;]*)*/g
  )) {
    decls.set(m[1], m[0].trim())
  }

  return decls
}

/** Gỡ chuỗi và comment để không bắt nhầm string literal union thành tên type. */
function stripNoise(body) {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/'[^']*'/g, ' ')
    .replace(/"[^"]*"/g, ' ')
    .replace(/`[^`]*`/g, ' ')
}

/** Định danh PascalCase trong thân Props là tên type. Key của Props là camelCase. */
function typeNamesIn(body) {
  const found = new Set()
  for (const m of stripNoise(body).matchAll(/\b([A-Z][A-Za-z0-9_]*)\b/g)) {
    if (!BUILTIN_TYPES.has(m[1])) found.add(m[1])
  }
  return found
}

/** Mọi file .ts dưới src/lib, kể cả thư mục con (serialize/, ...). */
function walkTs(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walkTs(full))
    else if (entry.endsWith('.ts')) out.push(full)
  }
  return out
}

/** Map tên type đã export -> đường dẫn module định nghĩa nó. */
function buildTypeIndex() {
  const index = new Map()
  for (const file of walkTs(LIB_DIR)) {
    const source = readFileSync(file, 'utf-8')
    const rel = relative(REPO_ROOT, file)
    for (const m of source.matchAll(/export\s+(?:type|interface|enum|const)\s+([A-Za-z0-9_]+)/g)) {
      if (!index.has(m[1])) index.set(m[1], rel)
    }
  }
  return index
}

// ── chạy ──────────────────────────────────────────────────────────────────────

const libTypeIndex = buildTypeIndex()

const files = readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith('.astro')).sort()

// Vòng 1: đọc frontmatter, gom mọi type khai trong component (kể cả type dùng
// chéo giữa các component, ví dụ DetailLayout dùng InfoBarItem của InfoBar).
const parsed = []
const localTypes = new Map() // tên type -> { text, owner }

for (const file of files) {
  const name = file.replace(/\.astro$/, '')
  const frontmatter = frontmatterOf(readFileSync(join(COMPONENTS_DIR, file), 'utf-8'))
  const decls = localTypeDecls(frontmatter)
  for (const [type, text] of decls) {
    if (!localTypes.has(type)) localTypes.set(type, { text, owner: name })
  }
  parsed.push({ name, file, props: extractProps(frontmatter) })
}

// Vòng 2: giải type của từng Props.
const components = []
const missingProps = []
const unresolved = new Map() // tên type -> danh sách component dùng nó
const modulesNeeded = new Set()

for (const { name, file, props } of parsed) {
  if (!props) {
    missingProps.push(name)
    continue
  }

  // Đóng bao truy hồi: type phụ trợ có thể tham chiếu type phụ trợ khác.
  const support = new Map()
  const queue = [...typeNamesIn(props)]
  const seen = new Set()

  while (queue.length) {
    const type = queue.shift()
    if (seen.has(type)) continue
    seen.add(type)

    if (libTypeIndex.has(type)) {
      modulesNeeded.add(libTypeIndex.get(type))
      continue
    }
    if (localTypes.has(type)) {
      const decl = localTypes.get(type)
      support.set(type, decl)
      queue.push(...typeNamesIn(decl.text))
      continue
    }
    if (!unresolved.has(type)) unresolved.set(type, [])
    unresolved.get(type).push(name)
  }

  components.push({
    name,
    path: `src/components/${file}`,
    group: groupOf(name),
    props,
    support,
  })
}

// ── xuất markdown ─────────────────────────────────────────────────────────────

const lines = []
lines.push('# Danh mục component — Nha Trang Travel')
lines.push('')
lines.push('> File sinh tự động bởi `scripts/gen-component-inventory.mjs`. Không sửa tay.')
lines.push('> Sinh lại: `npm run gen:design-context`')
lines.push('')
lines.push('Hợp đồng API của thư viện component đang chạy production. Mỗi mục là interface')
lines.push('`Props` nguyên văn trong code, không diễn giải lại.')
lines.push('')

for (const group of GROUP_ORDER) {
  const inGroup = components.filter((c) => c.group === group)
  if (!inGroup.length) continue

  lines.push(`## ${group} (${inGroup.length})`)
  lines.push('')
  for (const c of inGroup) {
    lines.push(`### ${c.name}`)
    lines.push('')
    lines.push(`\`${c.path}\``)
    lines.push('')
    lines.push('```ts')
    lines.push(c.props)
    lines.push('```')
    lines.push('')

    if (c.support.size) {
      lines.push('Type phụ trợ:')
      lines.push('')
      lines.push('```ts')
      for (const [type, decl] of c.support) {
        const origin = decl.owner === c.name ? '' : ` // khai ở ${decl.owner}.astro`
        lines.push(decl.text + origin)
      }
      lines.push('```')
      lines.push('')
    }
  }
}

lines.push('## Module cần đính kèm để giải hết type')
lines.push('')
lines.push('Các `Props` trên tham chiếu type định nghĩa ở những module sau. Đính kèm chúng')
lines.push('cùng inventory, nếu không thì hợp đồng API còn type treo.')
lines.push('')
for (const m of [...modulesNeeded].sort()) lines.push(`- \`${m}\``)
lines.push('')

lines.push('## Tổng kết')
lines.push('')
lines.push('| Nhóm | Số component |')
lines.push('|---|---|')
for (const group of GROUP_ORDER) {
  const n = components.filter((c) => c.group === group).length
  if (n) lines.push(`| ${group} | ${n} |`)
}
lines.push(`| **Tổng** | **${components.length}** |`)
lines.push('')

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_FILE, lines.join('\n'), 'utf-8')

// ── báo cáo ───────────────────────────────────────────────────────────────────

console.log(`Đã xử lý ${files.length} file .astro`)
for (const group of GROUP_ORDER) {
  const n = components.filter((c) => c.group === group).length
  if (n) console.log(`  ${group}: ${n}`)
}
console.log(`Ghi: ${relative(REPO_ROOT, OUT_FILE)}`)
console.log(`Module cần đính kèm: ${modulesNeeded.size}`)

let failed = false

if (missingProps.length) {
  failed = true
  console.error(`\nFAIL: ${missingProps.length} component không có "export interface Props":`)
  for (const n of missingProps) console.error(`  - ${n}`)
}

if (unresolved.size) {
  failed = true
  console.error(`\nFAIL: ${unresolved.size} type không giải được về src/lib:`)
  for (const [type, users] of unresolved) {
    console.error(`  - ${type} (dùng bởi: ${users.join(', ')})`)
  }
  console.error('\nType treo nghĩa là hợp đồng API sai. Agent thiết kế sẽ dùng sai')
  console.error('component đó ở mọi thiết kế nó sinh ra. Sửa trước khi bàn giao.')
}

process.exit(failed ? 1 : 0)
