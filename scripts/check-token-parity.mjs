/**
 * BỘ KIỂM ĐỐI SÁNH TOKEN — 07-DESIGN_TOKENS.md ↔ src/styles/tokens.css
 *
 * Vì sao có file này. `07` mở đầu tự khai là nguồn token duy nhất, nhưng không
 * có gì canh việc nó mô tả đúng thứ đang chạy. Hệ quả đo được: DR-050 (07 khai
 * ngược bộ chữ, sống từ 2026-08-14) và DR-051 (07 khai thang 8 bậc, mã chạy 14
 * giá trị phân biệt). Cả hai lọt qua nhiều vòng review vì không cổng nào đỏ.
 *
 * Cách đọc kết quả. Bộ kiểm KHÔNG đòi `07` và `tokens.css` giống hệt nhau —
 * nhiều lệch là có chủ ý và đã có phiếu. Nó chia làm hai mức:
 *
 *   ĐỎ   — lệch MỚI, chưa ai khai. Đây là thứ phải xử.
 *   VÀNG — lệch đã khai ở LECH_DA_BIET bên dưới, mỗi mục kèm số phiếu DR.
 *          Không làm đỏ, nhưng in ra để không ai quên chúng còn đó.
 *
 * Nghĩa là file này không chặn drift ĐANG CÓ; nó chặn drift TIẾP THEO. Khi V5
 * viết lại `07`, xoá dần các mục trong LECH_DA_BIET — mục nào xoá đi mà vẫn
 * xanh thì nợ đó đã đóng thật.
 *
 * KHÔNG nằm trong `gate:all`. Thêm một cổng vào gate là cửa một chiều, phải
 * được chủ dự án chốt riêng (tiền lệ: V0b ở SPEC-2026-08-22-be-mat-vong-5 §4).
 * Chạy tay: npm --prefix scripts run check:token-parity
 *
 * Soạn 2026-08-24, cùng đợt với DR-050/051/052.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const SPEC = resolve(REPO_ROOT, 'docs/core-specs/07-DESIGN_TOKENS.md')
const CSS = resolve(REPO_ROOT, 'src/styles/tokens.css')

/**
 * Ánh xạ tên token trong `07` → tên biến CSS.
 * `color.*` suy được cơ học (color.text.muted → --c-text-muted) nên không liệt kê.
 * Phần còn lại KHÔNG cơ học, phải khai tay — và chính chỗ không cơ học này là
 * nơi DR-050 nấp suốt mười ngày.
 */
const ANH_XA = {
  'font.family.heading': '--font-display',
  'font.family.body': '--font-ui',
  'font.size.base': '--fs-base',
  'font.size.sm': '--fs-sm',
  'font.size.label': '--fs-label',
  'font.size.badge': '--fs-badge',
  'font.size.display': '--fs-display',
  'line-height.display': '--lh-display',
  'line-height.eyebrow': '--lh-eyebrow',
  'letter-spacing.eyebrow': '--ls-eyebrow',
}

/** Token trong `07` cố ý không thành một biến — có lý do, không phải sót. */
const KHONG_CO_BIEN = new Set([
  'font.weight',        // trải thành --fw-500..--fw-900
  'font.size.scale',    // là mô tả thang, không phải một giá trị
  'line-height',        // trải thành --lh-heading và --lh-body
  'letter-spacing',     // để mặc định, không khai biến
  'measure',            // 07 dùng ch; mã dùng --container-editorial: 800px
])

/**
 * Lệch đã có phiếu. Mỗi mục PHẢI kèm mã DR — không có phiếu thì không được
 * nằm ở đây, phải để nó đỏ.
 */
const LECH_DA_BIET = {
  'font.family.heading': 'DR-050 — 07 khai Nunito trước; mã chạy Be Vietnam Pro trước từ 2026-08-14',
  'font.size.badge': 'DR-002 + DR-051 — 07 khai 12px, --fs-badge chạy 11px',
}

const doc = readFileSync(SPEC, 'utf8')
const css = readFileSync(CSS, 'utf8')

/** Đọc bảng markdown của `07`: | token | giá trị | dùng cho | */
const khaiBao = new Map()
for (const line of doc.split('\n')) {
  const m = line.match(/^\|\s*([a-z][a-z0-9.-]*)\s*\|\s*([^|]+?)\s*\|/i)
  if (m) khaiBao.set(m[1], m[2])
}

/** Đọc khối :root đầu tiên của tokens.css (bộ mặc định bien-sau). */
const root = css.slice(css.indexOf(':root'), css.indexOf('\n}'))
const bien = new Map()
for (const m of root.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
  bien.set(m[1], m[2].replace(/\/\*[\s\S]*?\*\//g, '').trim())
}

/**
 * Chuẩn hoá một giá trị token trước khi so. Ba phép, mỗi phép vì một lý do thật
 * gặp trong kho — bỏ phép nào thì bộ kiểm báo động giả và mất tin cậy:
 *
 *   1. Dấu phẩy thập phân. `07` viết tiếng Việt ("1,22"), CSS viết "1.22".
 *      Chỉ đổi dấu phẩy NẰM GIỮA HAI CHỮ SỐ — không đụng dấu phẩy ngăn cách
 *      trong font stack ("Nunito", "Be Vietnam Pro").
 *   2. rem → px. `07` khai px cho người đọc, `tokens.css` khai rem. 17px và
 *      1.0625rem là một, không phải lệch. Gốc 16px.
 *   3. Nháy đơn/kép và khoảng trắng trong font stack.
 *
 * Đổi rem sang px chứ không ngược lại, để 12px ≠ 0.6875rem (=11px) vẫn đỏ đúng.
 */
function chuanHoa(s) {
  return s
    .toLowerCase()
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d*\.?\d+)rem\b/g, (_, n) => `${+(parseFloat(n) * 16).toFixed(4)}px`)
    .replace(/(\d*\.?\d+)px\b/g, (_, n) => `${+parseFloat(n).toFixed(4)}px`)
    .replace(/['"]/g, '"')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

function bang(a, b) {
  return chuanHoa(a) === chuanHoa(b)
}

const doDo = []
const vang = []
const thieuBien = []

for (const [ten, giaTriKhai] of khaiBao) {
  if (KHONG_CO_BIEN.has(ten)) continue
  const bienCss = ANH_XA[ten] ?? (ten.startsWith('color.') ? '--c-' + ten.slice(6).replace(/\./g, '-') : null)
  if (!bienCss) continue

  const giaTriChay = bien.get(bienCss)
  if (giaTriChay === undefined) { thieuBien.push([ten, bienCss]); continue }

  // 07 hay viết "#0C4A6E" hoặc "17px (1.0625rem)" — lấy phần trước ngoặc để so.
  const khai = giaTriKhai.replace(/\*\*/g, '').split(/\s*\(/)[0].trim()
  if (bang(khai, giaTriChay)) continue

  const phieu = LECH_DA_BIET[ten]
  ;(phieu ? vang : doDo).push({ ten, bienCss, khai, chay: giaTriChay, phieu })
}

console.log(`Đối sánh 07-DESIGN_TOKENS ↔ tokens.css — đọc ${khaiBao.size} dòng token trong 07\n`)

if (vang.length) {
  console.log(`VÀNG — ${vang.length} lệch đã có phiếu, không chặn:`)
  for (const v of vang) {
    console.log(`  ${v.ten} (${v.bienCss}): 07 "${v.khai}" ≠ mã "${v.chay}"`)
    console.log(`    └─ ${v.phieu}`)
  }
  console.log('')
}

if (thieuBien.length) {
  console.log(`GHI CHÚ — ${thieuBien.length} token 07 khai mà không thấy biến tương ứng trong :root:`)
  for (const [t, b] of thieuBien) console.log(`  ${t} → ${b}`)
  console.log('')
}

if (doDo.length) {
  console.log(`ĐỎ — ${doDo.length} lệch MỚI, chưa có phiếu:`)
  for (const d of doDo) console.log(`  ${d.ten} (${d.bienCss}): 07 khai "${d.khai}", mã chạy "${d.chay}"`)
  console.log('\nXử một trong hai cách: sửa cho khớp, hoặc ghi phiếu DR rồi khai vào LECH_DA_BIET.')
  process.exit(1)
}

console.log('XANH — không có lệch mới ngoài những mục đã có phiếu.')
