#!/usr/bin/env node
/**
 * Runner gom kết quả cho các chuỗi validator.
 *
 * Vì sao tồn tại: `validate:post` và `audit:spec` trước đây nối bằng `&&`, nên
 * mắt xích đầu tiên đỏ là mọi mắt xích sau không chạy. Hai hậu quả thật đã gặp:
 *   - `deferred-gate` nằm cuối `validate:post` và luôn đỏ vì ND-005, nên
 *     `npm run gate` không bao giờ tới được `audit:spec` (DR-019).
 *   - `g1` đỏ là `g3`/`g4` im, và file báo cáo cũ của chúng vẫn nằm đó nói "pass"
 *     (cùng loại với DR-001).
 *
 * Runner này chạy hết, in output của từng cái, rồi mới quyết đỏ/xanh. Nó KHÔNG
 * nới bất kỳ mức nào: một validator đỏ vẫn làm cả lệnh đỏ. Nó chỉ đổi "dừng ở
 * lỗi đầu" thành "báo đủ mọi lỗi".
 *
 * Đường dẫn lấy từ import.meta.url, không tin vào thư mục làm việc hiện hành —
 * xem scripts/check-no-process-cwd.sh.
 */
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url))
const TSX_LOADER = resolve(SCRIPTS_DIR, 'node_modules', 'tsx', 'dist', 'esm', 'index.mjs')

/**
 * `gaps` là những bất biến nhóm này ĐÁNG LẼ kiểm nhưng hiện không kiểm. In ra
 * cùng bảng tổng kết, vì một bảng toàn [pass] mà im về phần bỏ sót là lời khai
 * vượt quá phần đã kiểm — cùng lý do với các dòng [skip] trong
 * control-registry-gate.ts. Xem DR-021 và DR-023.
 */
const GROUPS = {
  post: {
    label: 'Post-build validators',
    gaps: [],
    files: [
      'validators/jsonld-post.ts',
      'validators/r3-r4-post.ts',
      'validators/governance-post.ts',
      'validators/geo-knowledge-post.ts',
      'validators/entity-layout-post.ts',
      'validators/luat1-post.ts',
      'validators/banking-shape.ts',
      'validators/control-registry-gate.ts',
      'validators/deferred-gate.ts',
    ],
  },
  spec: {
    label: 'Meta-validators (spec vs code)',
    gaps: [
      'g2 (01-CONTENT_MODEL §2 ↔ enforcement trong gate.config.ts) không chạy — tắt theo QĐ-2026-08-05-03, nợ ND-001. Không có validator nào khác kiểm bất biến "field bắt buộc khai trong content model thì cũng bắt buộc lúc thi hành".',
    ],
    files: [
      'meta-validators/g1-content-model-vs-schema.ts',
      'meta-validators/g3-binding-map-vs-template.ts',
      'meta-validators/g4-groq-field-validity.ts',
    ],
  },
}

function runOne(relPath) {
  const started = Date.now()
  const result = spawnSync(
    process.execPath,
    ['--import', TSX_LOADER, resolve(SCRIPTS_DIR, relPath)],
    { stdio: 'inherit', cwd: SCRIPTS_DIR },
  )
  const code = result.status ?? 1
  return { relPath, code, ms: Date.now() - started }
}

/**
 * Tiền điều kiện, chạy TRƯỚC mọi nhóm: dist/ có phải bản dựng của mã hiện tại không.
 *
 * Vì sao chặn cả lượt thay vì thêm một validator nữa vào GROUPS.post: runner này cố ý
 * chạy hết rồi mới kết luận (xem đầu file). Nhưng dist/ cũ không phải "một lỗi trong số
 * nhiều" — nó làm MỌI kết quả phía sau mất nghĩa, cả đỏ lẫn xanh. In một bảng lẫn lộn
 * trong tình huống đó chính là cách sinh ra hiểu nhầm ở §1 của
 * docs/evidence/2026-09-04-ra-soat-tu-dong-hoa.
 *
 * Mã thoát 3 (khác 1 của "có validator đỏ") để phân biệt "chưa kiểm được" với "đã kiểm và đỏ".
 */
function tienDieuKien() {
  const r = runOne('validators/dist-freshness.ts')
  if (r.code !== 0) {
    console.log('\n########## Cổng KHÔNG chạy ##########\n')
    console.log('dist/ không phải bản dựng của mã hiện tại, nên kết quả cổng hậu build')
    console.log('sẽ không nói gì về mã đang push. Không chạy validator nào.')
    process.exit(3)
  }
}

function main() {
  const requested = process.argv.slice(2)
  const names = requested.length > 0 ? requested : Object.keys(GROUPS)

  for (const name of names) {
    if (!GROUPS[name]) {
      console.error(`[error] nhóm không tồn tại: "${name}" (chỉ nhận ${Object.keys(GROUPS).join(', ')})`)
      process.exit(2)
    }
  }

  // Chỉ nhóm `post` đọc dist/. `spec` so đặc tả với mã nguồn nên không phụ thuộc bản dựng.
  if (names.includes('post')) tienDieuKien()

  const results = []
  const gaps = []
  for (const name of names) {
    const group = GROUPS[name]
    console.log(`\n########## ${group.label} ##########`)
    for (const file of group.files) {
      console.log(`\n--- ${file} ---`)
      results.push(runOne(file))
    }
    for (const gap of group.gaps ?? []) gaps.push(gap)
  }

  const failed = results.filter((r) => r.code !== 0)
  const width = Math.max(...results.map((r) => r.relPath.length))

  console.log('\n########## Tổng kết ##########\n')
  for (const r of results) {
    const mark = r.code === 0 ? '[pass]' : `[FAIL:${r.code}]`
    console.log(`${mark.padEnd(10)} ${r.relPath.padEnd(width)}  ${(r.ms / 1000).toFixed(1)}s`)
  }

  for (const gap of gaps) console.log(`\n[gap]      ${gap}`)

  if (failed.length > 0) {
    console.log(`\n${failed.length}/${results.length} đỏ: ${failed.map((r) => r.relPath).join(', ')}`)
    process.exit(1)
  }

  const caveat = gaps.length === 0 ? '' : ` — nhưng ${gaps.length} bất biến không có ai kiểm, xem [gap] ở trên`
  console.log(`\n${results.length}/${results.length} xanh${caveat}.`)
}

main()
