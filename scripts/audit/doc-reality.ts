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
//
// Vòng sửa 1 (review): DOC3/DOC4 từng trả mảng rỗng hoặc pass rỗng khi tập
// nguồn rỗng — đúng hình dạng DR-021 (cổng in [pass] mà chưa đối chiếu gì
// thật). Nay cả hai trả một Check verdict 'skip' tường minh. Đồng thời DOC2
// tách làm hai: DOC2-code quét mã/cấu hình ĐANG CHẠY (ca nghiêm trọng, đúng
// lớp mà DR-006 từng xảy ra) và DOC2-docs quét tài liệu vận hành (nhắc tới
// mang tính tường thuật, không nguy hiểm bằng — không thu hẹp phạm vi quét
// gốc, chỉ tách bạch hai mức độ).

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { buildReport, duocGoiTrucTiep, exitCodeFor, writeReport, REPO_ROOT } from './lib/evidence'
import type { Check } from './lib/evidence'

export interface LuatCam {
  chuoi: string
  lyDo: string
  drift: string
}

/** Một Check cho mỗi luật, gom mọi chỗ vi phạm vào detail. Khối xây cho DOC1/DOC2-*. */
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

/**
 * DOC2-code — quét MÃ/CẤU HÌNH ĐANG CHẠY tìm tàn dư tên site khác.
 * Nghiêm trọng: DR-006 từng rò xuống đúng lớp này (không phải tài liệu).
 */
export function kiemTanDuMa(
  files: Array<{ path: string; content: string }>,
  tenSite: string,
): Check[] {
  return timChuoiCam(files, [
    {
      chuoi: tenSite,
      lyDo: `tàn dư tên site khác rò vào mã/cấu hình ĐANG CHẠY — ca nghiêm trọng đúng như DR-006 từng xảy ra`,
      drift: 'DR-006',
    },
  ]).map((c) => ({ ...c, id: c.id.replace(/^chuoi-cam\//, 'DOC2-code/') }))
}

/**
 * DOC2-docs — quét TÀI LIỆU VẬN HÀNH tìm nhắc tới tên site khác.
 * Không tự nới lỏng: đây là substring thô, không phân biệt được nhắc tới mang
 * tính tường thuật/hướng dẫn với rò thật — nên thông điệp luôn trỏ sang
 * DOC2-code để người đọc tự phân biệt được, không cần hỏi thêm.
 */
export function kiemTanDuTaiLieu(
  files: Array<{ path: string; content: string }>,
  tenSite: string,
): Check[] {
  return timChuoiCam(files, [
    {
      chuoi: tenSite,
      lyDo: `nhắc tới mang tính tường thuật trong tài liệu vận hành (lịch sử/hướng dẫn), KHÔNG phải rò vào cấu hình đang chạy — xem DOC2-code để biết có rò thật hay không`,
      drift: 'DR-006',
    },
  ]).map((c) => ({ ...c, id: c.id.replace(/^chuoi-cam\//, 'DOC2-docs/') }))
}

/** Bắt cặp "<đường dẫn> <mũi tên> <URL>" — nhận →, ->, ⇒ vì tài liệu đổi cách viết là phép kiểm mù nếu chỉ nhận một glyph. */
export function trichLuatChuyenHuong(text: string): Array<{ tu: string; den: string }> {
  const ket: Array<{ tu: string; den: string }> = []
  const re = /(\/[^\s`]*)\s*(?:→|->|⇒)\s*(https?:\/\/[^\s`]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) ket.push({ tu: m[1], den: m[2] })
  return ket
}

/**
 * DOC3 — luật mà tài liệu mô tả phải có thật trong public/_redirects.
 * Tập trích rỗng phải là 'skip' tường minh, không phải mảng rỗng im lặng
 * (DR-021): mảng rỗng biến mất khỏi báo cáo, không ai biết là "chưa kiểm".
 */
export function kiemChuyenHuong(buildNotes: string, redirects: string): Check[] {
  const luat = trichLuatChuyenHuong(buildNotes)
  if (luat.length === 0) {
    return [
      {
        id: 'DOC3',
        verdict: 'skip',
        detail: 'BUILD-NOTES không mô tả luật chuyển hướng nào để đối chiếu',
        drift: ['DR-043'],
      },
    ]
  }
  return luat.map((l) => {
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

/** Thoát ký tự đặc biệt của regex trong một chuỗi dùng làm literal. */
function thoatRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Có `qd` trong `decisions` không, với RANH GIỚI TỪ ở hai đầu — không chỉ
 * substring thô. `decisions.includes('QĐ-2026-08-22-04')` sẽ khớp nhầm khi sổ
 * chỉ có `QĐ-2026-08-22-04X` (một quyết định KHÁC có tiền tố trùng).
 */
function coMaTrongSo(qd: string, decisions: string): boolean {
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${thoatRegex(qd)}(?![\\p{L}\\p{N}])`, 'u')
  return re.test(decisions)
}

/**
 * DOC4 — mọi QĐ được DRIFT_LOG trích dẫn phải có mặt trong DECISIONS.md.
 * Tập trích rỗng phải là 'skip' tường minh, KHÔNG phải "pass rỗng" — đó là
 * đúng hình dạng DR-021: cổng in [pass] cho một phép kiểm chưa đối chiếu gì.
 */
export function kiemQuyetDinhDaDong(driftLog: string, decisions: string): Check[] {
  const duocTrich = new Set(driftLog.match(/QĐ-\d{4}-\d{2}-\d{2}-\d{2}/g) ?? [])
  if (duocTrich.size === 0) {
    return [
      {
        id: 'DOC4',
        verdict: 'skip',
        detail: 'DRIFT_LOG không trích mã quyết định nào để đối chiếu',
        drift: ['DR-043'],
      },
    ]
  }
  const thieu = [...duocTrich].filter((qd) => !coMaTrongSo(qd, decisions)).sort()
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

/** Đọc đệ quy mọi file dưới `relDir` (neo vào REPO_ROOT). Trả về đường dẫn tương đối so với gốc repo. */
function docsDuoiThuMuc(relDir: string): Array<{ path: string; content: string }> {
  const goc = join(REPO_ROOT, relDir)
  if (!existsSync(goc)) return []
  const ket: Array<{ path: string; content: string }> = []
  const duyet = (tuyetDoi: string, tuongDoi: string): void => {
    for (const ten of readdirSync(tuyetDoi)) {
      const conTuyetDoi = join(tuyetDoi, ten)
      const conTuongDoi = join(tuongDoi, ten)
      const st = statSync(conTuyetDoi)
      if (st.isDirectory()) duyet(conTuyetDoi, conTuongDoi)
      else if (st.isFile()) ket.push({ path: conTuongDoi, content: readFileSync(conTuyetDoi, 'utf8') })
    }
  }
  duyet(goc, relDir)
  return ket
}

function main(): void {
  const ranAt = new Date().toISOString()
  const checks: Check[] = []

  // --- DOC1 + DOC2-docs: tài liệu vận hành ---
  const TAI_LIEU_VAN_HANH = ['BUILD-NOTES.md', 'README.md', 'SETUP-NEW-SITE.md']
  const docFiles = TAI_LIEU_VAN_HANH.map((p) => ({ path: p, content: doc(p) })).filter(
    (f) => f.content !== '',
  )

  if (docFiles.length === 0) {
    checks.push(
      { id: 'DOC1', verdict: 'skip', detail: 'không đọc được tài liệu vận hành nào', drift: ['DR-040'] },
      { id: 'DOC2-docs', verdict: 'skip', detail: 'không đọc được tài liệu vận hành nào', drift: ['DR-006'] },
    )
  } else {
    checks.push(
      ...timChuoiCam(docFiles, [
        {
          chuoi: 'Cloudflare Pages',
          lyDo: 'đường phát hành thật là Workers Builds, không có Pages project nào tên tourdaovn — QĐ-2026-08-14-02',
          drift: 'DR-040',
        },
      ]),
    )
    checks.push(...kiemTanDuTaiLieu(docFiles, 'nhatrangtravel'))
  }

  // --- DOC2-code: mã/cấu hình đang chạy (ca nghiêm trọng, không thu hẹp phạm vi) ---
  const MA_VA_CAU_HINH = [
    ...docsDuoiThuMuc('src'),
    ...['astro.config.mjs', 'wrangler.toml']
      .map((p) => ({ path: p, content: doc(p) }))
      .filter((f) => f.content !== ''),
  ]
  if (MA_VA_CAU_HINH.length === 0) {
    checks.push({
      id: 'DOC2-code',
      verdict: 'skip',
      detail: 'không đọc được mã/cấu hình nào (src/, astro.config.mjs, wrangler.toml) để đối chiếu',
      drift: ['DR-006'],
    })
  } else {
    checks.push(...kiemTanDuMa(MA_VA_CAU_HINH, 'nhatrangtravel'))
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
