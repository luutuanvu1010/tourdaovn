// doc-reality-auditor — tài liệu có đang mô tả đúng thực tế không.
//
// DR-043: BUILD-NOTES.md mở đầu bằng "ĐANG BẬT" cho một luật chuyển hướng đã gỡ
// chín ngày trước. File này là thứ người vận hành mở ra khi deploy, và nó đang
// mô tả hành vi production SAI. DR-040: mọi tài liệu viết "Cloudflare Pages"
// trong khi đường phát hành thật là Workers Builds. DR-006: 00-PROJECT_BRIEF là
// của nhatrangtravel, và sai đã rò xuống code.
//
// DOC4 đánh vào gốc rễ: DR-043 xảy ra vì bước "ghi mục đóng quyết định" chưa
// từng được thi hành, nên không có tín hiệu nào bắt BUILD-NOTES phải cập nhật.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildReport, duocGoiTrucTiep, exitCodeFor, writeReport, REPO_ROOT } from './lib/evidence'
import type { Check } from './lib/evidence'

export interface LuatCam {
  chuoi: string
  lyDo: string
  drift: string
}

/** DOC1 + DOC2 — một Check cho mỗi luật, gom mọi chỗ vi phạm vào detail. */
export function timChuoiCam(
  files: Array<{ path: string; content: string }>,
  luat: LuatCam[],
): Check[] {
  return luat.map((l) => {
    const cho: string[] = []
    for (const f of files) {
      f.content.split('\n').forEach((dong, i) => {
        if (dong.includes(l.chuoi)) cho.push(`${f.path}:${i + 1}`)
      })
    }
    return cho.length === 0
      ? {
          id: `chuoi-cam/${l.chuoi}`,
          verdict: 'pass' as const,
          detail: `không còn chỗ nào viết "${l.chuoi}"`,
          drift: [l.drift],
        }
      : {
          id: `chuoi-cam/${l.chuoi}`,
          verdict: 'fail' as const,
          detail: `"${l.chuoi}" còn ở ${cho.length} chỗ (${l.lyDo}): ${cho.slice(0, 8).join(', ')}${cho.length > 8 ? ` và ${cho.length - 8} chỗ nữa` : ''}`,
          drift: [l.drift],
        }
  })
}

/** Bắt cặp "<đường dẫn> → <URL>" trong văn bản mô tả chuyển hướng. */
export function trichLuatChuyenHuong(text: string): Array<{ tu: string; den: string }> {
  const ket: Array<{ tu: string; den: string }> = []
  const re = /(\/[^\s`]*)\s*→\s*(https?:\/\/[^\s`]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) ket.push({ tu: m[1], den: m[2] })
  return ket
}

/** DOC3 — luật mà tài liệu mô tả phải có thật trong public/_redirects. */
export function kiemChuyenHuong(buildNotes: string, redirects: string): Check[] {
  return trichLuatChuyenHuong(buildNotes).map((l) => {
    const co = redirects
      .split('\n')
      .some((d) => !d.trim().startsWith('#') && d.includes(l.tu) && d.includes(l.den))
    return co
      ? {
          id: `DOC3/${l.tu}`,
          verdict: 'pass' as const,
          detail: `BUILD-NOTES mô tả ${l.tu} → ${l.den}, public/_redirects có luật đó`,
          drift: ['DR-043'],
        }
      : {
          id: `DOC3/${l.tu}`,
          verdict: 'fail' as const,
          detail: `BUILD-NOTES mô tả chuyển hướng ${l.tu} → ${l.den} nhưng public/_redirects KHÔNG có luật đó. Tài liệu đang nói sai về production.`,
          drift: ['DR-043'],
        }
  })
}

/** DOC4 — mọi QĐ được DRIFT_LOG trích dẫn phải có mặt trong DECISIONS.md. */
export function kiemQuyetDinhDaDong(driftLog: string, decisions: string): Check[] {
  const duocTrich = new Set(driftLog.match(/QĐ-\d{4}-\d{2}-\d{2}-\d{2}/g) ?? [])
  const thieu = [...duocTrich].filter((qd) => !decisions.includes(qd)).sort()
  return [
    thieu.length === 0
      ? {
          id: 'DOC4',
          verdict: 'pass' as const,
          detail: `cả ${duocTrich.size} quyết định được DRIFT_LOG trích đều có trong DECISIONS.md`,
          drift: ['DR-043'],
        }
      : {
          id: 'DOC4',
          verdict: 'fail' as const,
          detail: `${thieu.length} quyết định được DRIFT_LOG trích nhưng không có trong DECISIONS.md: ${thieu.join(', ')}. Code đổi mà sổ không đổi là gốc rễ của DR-043.`,
          drift: ['DR-043'],
        },
  ]
}

function doc(rel: string): string {
  const p = join(REPO_ROOT, rel)
  return existsSync(p) ? readFileSync(p, 'utf8') : ''
}

function main(): void {
  const ranAt = new Date().toISOString()
  const checks: Check[] = []

  const TAI_LIEU_VAN_HANH = ['BUILD-NOTES.md', 'README.md', 'SETUP-NEW-SITE.md']
  const files = TAI_LIEU_VAN_HANH.map((p) => ({ path: p, content: doc(p) })).filter(
    (f) => f.content !== '',
  )

  if (files.length === 0) {
    checks.push({ id: 'DOC1', verdict: 'skip', detail: 'không đọc được tài liệu vận hành nào', drift: ['DR-040'] })
  } else {
    checks.push(
      ...timChuoiCam(files, [
        {
          chuoi: 'Cloudflare Pages',
          lyDo: 'đường phát hành thật là Workers Builds, không có Pages project nào tên tourdaovn — QĐ-2026-08-14-02',
          drift: 'DR-040',
        },
        {
          chuoi: 'nhatrangtravel',
          lyDo: 'tên site khác rò sang, đã từng rò xuống code',
          drift: 'DR-006',
        },
      ]),
    )
  }

  checks.push(...kiemChuyenHuong(doc('BUILD-NOTES.md'), doc('public/_redirects')))
  checks.push(...kiemQuyetDinhDaDong(doc('docs/DRIFT_LOG.md'), doc('docs/DECISIONS.md')))

  const report = buildReport('doc-reality-auditor', ranAt, checks)
  const dir = writeReport(report)
  console.log(`[doc-reality-auditor] ${report.summary.pass} đạt, ${report.summary.fail} trượt, ${report.summary.skip} không kiểm được`)
  console.log(`[doc-reality-auditor] bằng chứng: ${dir}`)
  process.exit(exitCodeFor(report))
}

// Chỉ chạy main() khi file này được thực thi trực tiếp (npm run audit:doc).
// Test import các hàm thuần ở trên bằng `import ... from '../doc-reality'` —
// nếu main() chạy vô điều kiện ở đây, mỗi lần test nạp module sẽ tự ghi báo
// cáo ra đĩa và gọi process.exit() giữa chừng, giết luôn tiến trình test.
if (duocGoiTrucTiep(import.meta.url)) main()
