// Thư viện bằng chứng — nguồn duy nhất của định dạng báo cáo cho scripts/audit.
//
// Vì sao tồn tại: CLAUDE.md §6 nói "Mặc định của cổng là không đạt nếu không có
// bằng chứng" và cấm "lời khẳng định chung chung kiểu đã kiểm xong". Một subagent
// tự viết "đã kiểm, đạt" là lời tự khai mà GOVERNANCE 5.1 cấm nhận. Nên mọi kết
// luận của bộ audit phải quy về file do module này ghi ra.
//
// Bài học DR-021: bảng toàn [pass] mà im về phần không kiểm được là lời khai vượt
// quá phần đã kiểm. Nên 'skip' là hạng công dân thứ nhất, và renderMarkdown BẮT
// BUỘC nói ra số skip ở dòng kết luận.
//
// Đường dẫn từ import.meta.url, không tin cwd của tiến trình khi chạy qua
// npm --prefix — xem check-no-process-cwd.sh.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const LIB_DIR = dirname(fileURLToPath(import.meta.url))

/** scripts/audit/lib -> scripts/audit -> scripts -> <gốc repo> */
export const REPO_ROOT = resolve(LIB_DIR, '..', '..', '..')

export type Verdict = 'pass' | 'fail' | 'skip'

export interface Check {
  /** Mã ổn định giữa các lần chạy, để so hai báo cáo với nhau. */
  id: string
  verdict: Verdict
  /** Nói rõ đã kiểm cái gì, hoặc vì sao không kiểm được. */
  detail: string
  /** Mã DR-nnn mà phép kiểm này truy về. Rỗng nghĩa là phạm vi nở. */
  drift: string[]
}

export interface Report {
  agent: string
  ranAt: string
  checks: Check[]
  summary: { pass: number; fail: number; skip: number }
}

export function buildReport(agent: string, ranAt: string, checks: Check[]): Report {
  return {
    agent,
    ranAt,
    checks,
    summary: {
      pass: checks.filter((c) => c.verdict === 'pass').length,
      fail: checks.filter((c) => c.verdict === 'fail').length,
      skip: checks.filter((c) => c.verdict === 'skip').length,
    },
  }
}

/** docs/evidence/<YYYY-MM-DD>-<agent>/ — ngày lấy từ ranAt, không từ đồng hồ. */
export function evidenceDir(report: Report): string {
  return join(REPO_ROOT, 'docs', 'evidence', `${report.ranAt.slice(0, 10)}-${report.agent}`)
}

export function renderMarkdown(report: Report): string {
  const { pass, fail, skip } = report.summary
  const lines: string[] = [
    `# Bằng chứng — ${report.agent}`,
    '',
    `Chạy lúc: ${report.ranAt}`,
    '',
    '| Mã | Kết quả | Chi tiết | Truy về |',
    '|---|---|---|---|',
  ]
  for (const c of report.checks) {
    const mark =
      c.verdict === 'pass' ? 'đạt' : c.verdict === 'fail' ? '**TRƯỢT**' : 'không kiểm được'
    lines.push(
      `| ${c.id} | ${mark} | ${c.detail.replace(/\|/g, '\\|')} | ${c.drift.join(', ') || '—'} |`,
    )
  }
  lines.push('')
  lines.push(
    skip === 0
      ? `Kết luận: ${pass} đạt, ${fail} trượt.`
      : `Kết luận: ${pass} đạt, ${fail} trượt — và ${skip} phép kiểm không chạy được, xem bảng trên. Bảng này không nói gì về ${skip} bất biến đó.`,
  )
  return lines.join('\n') + '\n'
}

/** Ghi report.json + report.md. Trả về thư mục đã ghi. */
export function writeReport(report: Report): string {
  const dir = evidenceDir(report)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8')
  writeFileSync(join(dir, 'report.md'), renderMarkdown(report), 'utf8')
  return dir
}

/** Mã thoát cho script gọi. Skip KHÔNG làm đỏ — nó làm hẹp phạm vi lời khai. */
export function exitCodeFor(report: Report): number {
  return report.summary.fail > 0 ? 1 : 0
}

/**
 * True khi file đang chạy chính là file được thực thi trực tiếp (node script.ts),
 * false khi nó chỉ bị import (ví dụ từ test). Mỗi script trong scripts/audit gọi
 * hàm main() của mình ở top-level; nếu gọi vô điều kiện, test import các hàm
 * thuần từ file đó sẽ vô tình chạy luôn main() — ghi báo cáo ra đĩa và gọi
 * process.exit() giữa chừng, giết tiến trình test. Dùng chung một helper ở đây
 * để Task 7-9 không phải chép tay ba lần và có nguy cơ chép lệch.
 *
 * Gọi bằng: `if (duocGoiTrucTiep(import.meta.url)) main()`.
 */
export function duocGoiTrucTiep(url: string): boolean {
  return process.argv[1] !== undefined && url === pathToFileURL(process.argv[1]).href
}
