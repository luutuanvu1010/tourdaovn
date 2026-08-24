// gate-auditor — kiểm chính bộ kiểm.
//
// Nhóm lỗi lớn nhất của dự án là cổng in [pass] cho phép kiểm nó không hề chạy:
// DR-021 (vòng đối chiếu chạy 0 lần vì file nguồn không tồn tại), DR-022 (control
// khai live, dẫn bằng chứng là file chưa từng được ghi). DR-015 từng là một ca
// thuộc lớp lỗi này — cả bộ kiểm pre-build chết ngay lúc nhập module vì thư mục
// shared/ chưa có trong repo — nhưng đã được xử theo ND-005 (commit b73326c,
// 2026-08-06); shared/gates/ tồn tại thật ngày hôm nay. Vẫn giữ DR-015 làm ví dụ
// lịch sử về đúng lớp lỗi mà GA4 đi tìm, đừng đọc như thể nó đang còn xảy ra.
//
// Thiết kế: phần quyết định là hàm thuần nhận dữ liệu và một vị từ tồn-tại, nên
// test không cần đụng đĩa. Phần đọc đĩa nằm gọn trong main().

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { parse } from 'yaml'
import { buildReport, duocGoiTrucTiep, exitCodeFor, writeReport, REPO_ROOT } from './lib/evidence'
import type { Check } from './lib/evidence'

export interface Control {
  id: string
  status: string
  evidence?: string
  executor?: string
}

interface Registry {
  pipelines?: Record<string, { files?: string[] }>
  controls?: Control[]
}

/**
 * Evidence trong registry là "<đường dẫn> <lời giải thích>", hoặc là một lời hứa
 * không có đường dẫn nào ("chưa có — sẽ là ... khi ND-005 trả xong").
 * Trả null cho trường hợp thứ hai.
 */
export function duongDanTuEvidence(evidence: string): string | null {
  const dau = evidence.trim().split(/\s+/)[0] ?? ''
  return dau.includes('/') ? dau : null
}

/** GA1 — control live phải dẫn bằng chứng là file có thật. */
export function kiemBangChung(controls: Control[], tonTai: (p: string) => boolean): Check[] {
  return controls
    .filter((c) => c.status === 'live')
    .map((c) => {
      const duongDan = duongDanTuEvidence(c.evidence ?? '')
      if (duongDan === null) {
        return {
          id: `GA1/${c.id}`,
          verdict: 'fail' as const,
          detail: `control ${c.id} khai live nhưng evidence không dẫn được đường dẫn nào: "${c.evidence ?? ''}"`,
          drift: ['DR-022'],
        }
      }
      return tonTai(duongDan)
        ? {
            id: `GA1/${c.id}`,
            verdict: 'pass' as const,
            detail: `control ${c.id} live, bằng chứng ${duongDan} tồn tại`,
            drift: ['DR-022'],
          }
        : {
            id: `GA1/${c.id}`,
            verdict: 'fail' as const,
            detail: `control ${c.id} khai live nhưng bằng chứng ${duongDan} không tồn tại`,
            drift: ['DR-022'],
          }
    })
}

/**
 * Rút đường dẫn file báo cáo được NHẮC TỚI trong evidence dạng lời hứa
 * ("chưa có — sẽ là scripts/reports/validator-status.json mục I1 khi ND-005 trả
 * xong"). Khác `duongDanTuEvidence`: hàm đó chỉ đọc TOKEN ĐẦU câu nên trả null
 * cho đúng dạng câu này (không sửa `duongDanTuEvidence` — GA1 dựa vào hành vi
 * hiện tại của nó). Hàm này quét CẢ CÂU tìm một token dạng đường dẫn kết thúc
 * bằng .json, dùng riêng cho GA6.
 */
export function duongDanBaoCaoTuLoiHua(evidence: string): string | null {
  const m = evidence.match(/[\w./-]+\.json/)
  return m ? m[0] : null
}

/**
 * GA6 — chiều ngược của GA1: GA1 kiểm control khai `live` có bằng chứng thật
 * hay không; GA6 kiểm control khai `gap` mà file báo cáo evidence dẫn tới THỰC
 * RA đã có mục mang đúng id của nó — tức control này đang chạy mà sổ chưa cập
 * nhật. `dangChayThat(duongDan, id)` là vị từ: true nghĩa là file `duongDan`
 * tồn tại VÀ có mục `id` bên trong — do main() cấp, để hàm này thuần và test
 * được mà không đụng đĩa (giống `tonTai` trong kiemBangChung).
 */
export function kiemGapConChayThat(
  controls: Control[],
  dangChayThat: (duongDan: string, id: string) => boolean,
): Check[] {
  return controls
    .filter((c) => c.status === 'gap')
    .map((c) => {
      const duongDan = duongDanBaoCaoTuLoiHua(c.evidence ?? '')
      if (duongDan === null) {
        return {
          id: `GA6/${c.id}`,
          verdict: 'skip' as const,
          detail: `control ${c.id} khai gap, evidence không nhắc file báo cáo nào để đối chiếu: "${c.evidence ?? ''}"`,
          drift: ['DR-022'],
        }
      }
      return dangChayThat(duongDan, c.id)
        ? {
            id: `GA6/${c.id}`,
            verdict: 'fail' as const,
            detail: `control ${c.id} khai gap nhưng ${duongDan} đã có mục ${c.id} — control này thực ra đang chạy, sổ control-registry.yaml chưa cập nhật`,
            drift: ['DR-022'],
          }
        : {
            id: `GA6/${c.id}`,
            verdict: 'pass' as const,
            detail: `control ${c.id} khai gap, ${duongDan} chưa có mục ${c.id} — khớp với lời khai`,
            drift: ['DR-022'],
          }
    })
}

/** Bắt import tương đối trong mã nguồn. Bỏ qua import gói (node:fs, yaml...). */
export function trichImportTuongDoi(source: string): string[] {
  const ket: string[] = []
  const re = /^\s*import\s[^'"]*['"](\.[^'"]+)['"]/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) ket.push(m[1])
  return ket
}

/** GA4 — mọi import tương đối trong validator phải giải được thành file có thật. */
export function kiemImport(
  files: Array<{ path: string; source: string }>,
  tonTai: (p: string) => boolean,
): Check[] {
  return files.map((f) => {
    const hong = trichImportTuongDoi(f.source).filter((spec) => {
      // join + normalize, KHÔNG resolve(): f.path là đường dẫn tương đối so với
      // gốc repo, không phải đường dẫn tuyệt đối. resolve() với hai đối số
      // tương đối sẽ neo ngầm vào thư mục tiến trình đang đứng — sai lệch một
      // cấp khi bị gọi qua `npm --prefix scripts` (cwd đổi sang scripts/). join()
      // chỉ nối chuỗi và normalize, không đọc thư mục hiện hành.
      const goc = join(dirname(f.path), spec)
      // moduleResolution "bundler": thử extensionless, .ts, .js->.ts, và /index.ts
      const ungVien = [goc, `${goc}.ts`, goc.replace(/\.js$/, '.ts'), join(goc, 'index.ts')]
      return !ungVien.some(tonTai)
    })
    return hong.length === 0
      ? {
          id: `GA4/${f.path}`,
          verdict: 'pass' as const,
          detail: `mọi import tương đối trong ${f.path} giải được`,
          drift: ['DR-015'],
        }
      : {
          id: `GA4/${f.path}`,
          verdict: 'fail' as const,
          detail: `${f.path} nhập ${hong.join(', ')} — không giải được thành file nào. Module này không khởi động nổi, nên mọi control dựa vào nó chưa từng chạy.`,
          drift: ['DR-015'],
        }
  })
}

function main(): void {
  const ranAt = new Date().toISOString()
  const checks: Check[] = []
  const tonTai = (p: string) => existsSync(resolve(REPO_ROOT, p))

  // --- Đọc registry ---
  const duongDanRegistry = join(REPO_ROOT, 'docs', 'governance', 'control-registry.yaml')
  let registry: Registry | null = null
  if (existsSync(duongDanRegistry)) {
    registry = parse(readFileSync(duongDanRegistry, 'utf8')) as Registry
  } else {
    checks.push({
      id: 'GA1',
      verdict: 'skip',
      detail: `không đọc được ${duongDanRegistry} — không kiểm được bằng chứng của control live`,
      drift: ['DR-022'],
    })
  }

  if (registry?.controls) checks.push(...kiemBangChung(registry.controls, tonTai))

  // --- GA6: control khai gap mà báo cáo evidence dẫn tới thực ra đã có mục ---
  const capNhatItemCache = new Map<string, Array<{ id: string }>>()
  const dangChayThatTrongBaoCao = (duongDan: string, id: string): boolean => {
    if (!capNhatItemCache.has(duongDan)) {
      const p = resolve(REPO_ROOT, duongDan)
      if (!existsSync(p)) {
        capNhatItemCache.set(duongDan, [])
      } else {
        try {
          const data = JSON.parse(readFileSync(p, 'utf8')) as { items?: Array<{ id: string }> }
          capNhatItemCache.set(duongDan, data.items ?? [])
        } catch {
          capNhatItemCache.set(duongDan, [])
        }
      }
    }
    return (capNhatItemCache.get(duongDan) ?? []).some((i) => i.id === id)
  }
  if (registry?.controls) checks.push(...kiemGapConChayThat(registry.controls, dangChayThatTrongBaoCao))

  // --- GA2: báo cáo không cũ hơn bản dựng ---
  const baoCao = join(REPO_ROOT, 'scripts', 'reports', 'postbuild-status.json')
  const dist = join(REPO_ROOT, 'dist', 'index.html')
  if (!existsSync(baoCao) || !existsSync(dist)) {
    checks.push({
      id: 'GA2',
      verdict: 'skip',
      detail: 'thiếu postbuild-status.json hoặc dist/index.html — không so được tuổi',
      drift: ['DR-001'],
    })
  } else {
    const tuoiBaoCao = statSync(baoCao).mtimeMs
    const tuoiDist = statSync(dist).mtimeMs
    checks.push(
      tuoiBaoCao >= tuoiDist
        ? { id: 'GA2', verdict: 'pass', detail: 'postbuild-status.json mới hơn hoặc bằng dist/', drift: ['DR-001'] }
        : {
            id: 'GA2',
            verdict: 'fail',
            detail:
              'postbuild-status.json CŨ HƠN dist/index.html — báo cáo đang nói về một bản dựng khác với bản đang nằm trên đĩa. Chạy lại npm run gate.',
            drift: ['DR-001'],
          },
    )
  }

  // --- GA3: control live có mục trong báo cáo ---
  if (registry?.controls && existsSync(baoCao)) {
    const items = (JSON.parse(readFileSync(baoCao, 'utf8')).items ?? []) as Array<{ id: string; status: string }>
    const coTrongBaoCao = new Set(items.map((i) => i.id))
    for (const c of registry.controls.filter((c) => c.status === 'live')) {
      checks.push(
        coTrongBaoCao.has(c.id)
          ? { id: `GA3/${c.id}`, verdict: 'pass', detail: `${c.id} có mục trong postbuild-status.json`, drift: ['DR-022'] }
          : {
              id: `GA3/${c.id}`,
              verdict: 'fail',
              detail: `${c.id} khai live nhưng không có mục nào trong postbuild-status.json — nó đỏ hay xanh cũng không ai biết qua cổng`,
              drift: ['DR-022'],
            },
      )
    }
  }

  // --- GA4: import giải được ---
  const thuMucValidator = [join('scripts', 'validators'), join('scripts', 'meta-validators')]
  const files: Array<{ path: string; source: string }> = []
  for (const tm of thuMucValidator) {
    const tuyetDoi = join(REPO_ROOT, tm)
    if (!existsSync(tuyetDoi)) continue
    for (const ten of readdirSync(tuyetDoi).filter((t) => t.endsWith('.ts'))) {
      const p = join(tm, ten)
      files.push({ path: p, source: readFileSync(join(REPO_ROOT, p), 'utf8') })
    }
  }
  checks.push(...kiemImport(files, tonTai))

  // --- GA5: file khai trong pipeline tồn tại ---
  for (const [ten, pl] of Object.entries(registry?.pipelines ?? {})) {
    for (const f of pl.files ?? []) {
      checks.push(
        tonTai(f)
          ? { id: `GA5/${f}`, verdict: 'pass', detail: `pipeline ${ten} khai ${f}, file tồn tại`, drift: ['DR-026'] }
          : {
              id: `GA5/${f}`,
              verdict: 'fail',
              detail: `pipeline ${ten} khai ${f} nhưng file không tồn tại`,
              drift: ['DR-026'],
            },
      )
    }
  }

  const report = buildReport('gate-auditor', ranAt, checks)
  const dir = writeReport(report)
  console.log(`[gate-auditor] ${report.summary.pass} đạt, ${report.summary.fail} trượt, ${report.summary.skip} không kiểm được`)
  console.log(`[gate-auditor] bằng chứng: ${dir}`)
  process.exit(exitCodeFor(report))
}

// Chỉ chạy main() khi file này được thực thi trực tiếp (npm run audit:gate).
// Test import các hàm thuần ở trên bằng `import ... from '../gate-audit'` —
// nếu main() chạy vô điều kiện ở đây, mỗi lần test nạp module sẽ tự ghi báo
// cáo ra đĩa và gọi process.exit() giữa chừng, giết luôn tiến trình test.
if (duocGoiTrucTiep(import.meta.url)) main()
