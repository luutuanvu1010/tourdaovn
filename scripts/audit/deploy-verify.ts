// deploy-verifier — bản đang chạy thật có đúng là bản vừa dựng không.
//
// DR-041: wrangler deploy in Success, curl trả 200, nội dung là của hai tuần
// trước. Cạm bẫy nằm ở chỗ không có tín hiệu hỏng nào. Script này tạo tín hiệu
// đó bằng cách so bit thật trên production với bit trong dist/.
//
// Chạy SAU khi deploy. guard-deploy.sh chặn TRƯỚC, dựa vào nguyên nhân đã biết;
// script này đo kết quả, nên bắt được cả nguyên nhân chưa biết.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildReport, duocGoiTrucTiep, exitCodeFor, writeReport, REPO_ROOT } from './lib/evidence'
import type { Check } from './lib/evidence'

const SITE = 'https://tourdao.vn'

// Tên file sitemap thật trong dist/ (kiểm bằng tay 2026-08-24): Astro sinh
// sitemap.xml làm sitemapindex trỏ tới sitemap-vi.xml — nơi thật sự chứa các
// thẻ <url><loc>. "sitemap-0.xml" trong ghi chú brief không tồn tại ở repo
// này; dùng tên thật thay vì đoán thêm tên thứ hai.
const TEN_FILE_SITEMAP = 'sitemap-vi.xml'

export function trichTieuDe(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  return m ? m[1].trim() : null
}

export function demUrlSitemap(xml: string): number {
  return (xml.match(/<loc>/g) ?? []).length
}

/**
 * So sự có mặt của từng dấu hiệu giữa production và dist/.
 * Dấu hiệu là chuỗi con thô — ví dụ "--sticky-bar-h", "Có thu phí" — chọn theo
 * đúng thay đổi vừa deploy. Đó là cách DR-041 được phát hiện bằng tay.
 */
export function soDauHieu(live: string, dist: string, dauHieu: string[]): Check[] {
  return dauHieu.map((d) => {
    const oLive = live.includes(d)
    const oDist = dist.includes(d)
    if (oLive === oDist) {
      return {
        id: `DV2/${d}`,
        verdict: 'pass' as const,
        detail: `dấu hiệu "${d}": hai bên giống nhau (${oLive ? 'đều có' : 'đều không có'})`,
        drift: ['DR-041'],
      }
    }
    return {
      id: `DV2/${d}`,
      verdict: 'fail' as const,
      detail: oLive
        ? `dấu hiệu "${d}": production có, dist/ không — bản đang chạy CŨ HƠN bản vừa dựng`
        : `dấu hiệu "${d}": dist/ có, production không — bản vừa dựng CHƯA lên tới khách`,
      drift: ['DR-041'],
    }
  })
}

/** Tải kèm tham số phá cache. Không phá cache là đo lại chính bản cũ. */
async function tai(duongDan: string, moc: string): Promise<string> {
  const url = `${SITE}${duongDan}?cache-bust=${encodeURIComponent(moc)}`
  const res = await fetch(url, { cache: 'no-store', redirect: 'follow' })
  if (!res.ok) throw new Error(`${url} trả ${res.status}`)
  return res.text()
}

async function main(): Promise<void> {
  const ranAt = new Date().toISOString()
  const dauHieu = process.argv.slice(2)
  const checks: Check[] = []

  const distIndex = join(REPO_ROOT, 'dist', 'index.html')
  if (!existsSync(distIndex)) {
    checks.push({
      id: 'DV0',
      verdict: 'skip',
      detail: 'không có dist/index.html — chưa build thì không có gì để so',
      drift: ['DR-041'],
    })
  } else {
    const distHtml = readFileSync(distIndex, 'utf8')
    let liveHtml: string
    try {
      liveHtml = await tai('/', ranAt)
    } catch (e) {
      checks.push({
        id: 'DV0',
        verdict: 'skip',
        detail: `không tải được ${SITE}/ : ${(e as Error).message}`,
        drift: ['DR-041'],
      })
      ket(ranAt, checks)
      return
    }

    // DV1 — tiêu đề trang chủ
    const tLive = trichTieuDe(liveHtml)
    const tDist = trichTieuDe(distHtml)
    checks.push(
      tLive === tDist
        ? { id: 'DV1', verdict: 'pass', detail: `tiêu đề trang chủ khớp: "${tDist ?? ''}"`, drift: ['DR-041'] }
        : {
            id: 'DV1',
            verdict: 'fail',
            detail: `tiêu đề lệch — production "${tLive ?? '(không có)'}" vs dist/ "${tDist ?? '(không có)'}"`,
            drift: ['DR-041'],
          },
    )

    // DV2 — dấu hiệu do người gọi chỉ định
    if (dauHieu.length === 0) {
      checks.push({
        id: 'DV2',
        verdict: 'skip',
        detail:
          'không có dấu hiệu nào được truyền vào. Tiêu đề khớp KHÔNG chứng minh nội dung khớp — DR-041 có tiêu đề khớp mà nội dung lệch hai tuần. Truyền dấu hiệu: npm --prefix scripts run audit:deploy -- "--sticky-bar-h" "Có thu phí"',
        drift: ['DR-041'],
      })
    } else {
      checks.push(...soDauHieu(liveHtml, distHtml, dauHieu))
    }

    // DV3 — số URL trong sitemap
    const distSitemap = join(REPO_ROOT, 'dist', TEN_FILE_SITEMAP)
    if (!existsSync(distSitemap)) {
      checks.push({ id: 'DV3', verdict: 'skip', detail: `không có dist/${TEN_FILE_SITEMAP}`, drift: ['DR-041'] })
    } else {
      try {
        const nLive = demUrlSitemap(await tai(`/${TEN_FILE_SITEMAP}`, ranAt))
        const nDist = demUrlSitemap(readFileSync(distSitemap, 'utf8'))
        checks.push(
          nLive === nDist
            ? { id: 'DV3', verdict: 'pass', detail: `sitemap: ${nDist} URL ở cả hai bên`, drift: ['DR-041'] }
            : {
                id: 'DV3',
                verdict: 'fail',
                detail: `sitemap lệch — production ${nLive} URL, dist/ ${nDist} URL`,
                drift: ['DR-041'],
              },
        )
      } catch (e) {
        checks.push({ id: 'DV3', verdict: 'skip', detail: `không tải được sitemap: ${(e as Error).message}`, drift: ['DR-041'] })
      }
    }
  }

  ket(ranAt, checks)
}

function ket(ranAt: string, checks: Check[]): void {
  const report = buildReport('deploy-verifier', ranAt, checks)
  const dir = writeReport(report)
  console.log(`[deploy-verifier] ${report.summary.pass} đạt, ${report.summary.fail} trượt, ${report.summary.skip} không kiểm được`)
  console.log(`[deploy-verifier] bằng chứng: ${dir}`)
  process.exit(exitCodeFor(report))
}

// Chỉ chạy main() khi file này được thực thi trực tiếp (npm run audit:deploy).
// Test import các hàm thuần ở trên bằng `import ... from '../deploy-verify'` —
// nếu main() chạy vô điều kiện ở đây, mỗi lần test nạp module sẽ tự gọi mạng
// và process.exit() giữa chừng, giết luôn tiến trình test.
if (duocGoiTrucTiep(import.meta.url)) void main()
