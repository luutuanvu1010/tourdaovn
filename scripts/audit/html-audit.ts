// seo-auditor — metadata SEO và thẻ hình ảnh trên bản dựng.
//
// PHẠM VI: chỉ những phép kiểm mà scripts/validators/jsonld-post.ts CHƯA làm.
// jsonld-post.ts đã ghi mục "SEO" vào postbuild-status.json; làm lại phần nó đã
// lo là tạo nguồn sự thật thứ hai, CONSTITUTION cấm.
//
// Step 1 — đã loại vì trùng với jsonld-post.ts (đọc trước khi viết dòng nào):
//   - canonical có mặt hay không, và canonical có khớp URL build hay không
//     → validateJsonLdForPage() dòng 249-252 của jsonld-post.ts đã kiểm, ghi
//     lỗi "thiếu canonical" / "canonical=... không khớp URL build" vào mảng
//     `seo`, gộp vào Check id 'SEO' trong postbuild-status.json.
//   - meta description có mặt và không rỗng
//     → jsonld-post.ts dòng 253 (gọi hasMetaDescription(), định nghĩa dòng
//     205-208) đã kiểm, cũng gộp vào Check 'SEO' cùng chỗ trên.
// Vậy phần "SEO/canonical" nêu trong brief KHÔNG được viết lại ở đây và test
// tương ứng đã bị xoá khỏi html-audit.test.ts. Task này chỉ còn phần thẻ ảnh
// (IMG/*) — đó là kết quả hợp lệ theo đúng Step 1, không phải thiếu sót.
//
// Đọc dist/ chứ không đọc src/: thứ tới tay khách là HTML đã render, không phải
// component. Ảnh do Sanity trả về chỉ lộ tham số kích cỡ ở tầng HTML.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { buildReport, duocGoiTrucTiep, exitCodeFor, writeReport, REPO_ROOT } from './lib/evidence'
import type { Check } from './lib/evidence'

export interface ViPham {
  rule: string
  detail: string
}

const MO_TA: Record<string, { moTa: string; drift: string }> = {
  'IMG/alt': { moTa: 'thẻ img thiếu thuộc tính alt', drift: 'yêu cầu 2026-08-23' },
  'IMG/kich-thuoc': {
    moTa: 'thẻ img thiếu width hoặc height (gây nhảy khung khi tải)',
    drift: 'yêu cầu 2026-08-23',
  },
  'IMG/lazy': {
    moTa: 'ảnh từ vị trí thứ hai trở đi chưa có loading="lazy"',
    drift: 'yêu cầu 2026-08-23',
  },
  'IMG/kich-co-sanity': {
    moTa: 'ảnh cdn.sanity.io tải bản gốc, không có tham số w=',
    drift: 'yêu cầu 2026-08-23',
  },
}

/** Lấy giá trị một thuộc tính trong chuỗi thẻ. Trả '' nếu có mặt mà rỗng, null nếu vắng. */
function thuocTinh(the: string, ten: string): string | null {
  const m = new RegExp(`\\s${ten}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(the)
  if (m) return m[2] ?? m[3] ?? ''
  return new RegExp(`\\s${ten}(\\s|>|$)`, 'i').test(the) ? '' : null
}

function nguon(the: string): string {
  return thuocTinh(the, 'src') ?? '(không có src)'
}

/** Quét một trang HTML, trả về mọi vi phạm thẻ ảnh tìm thấy. */
export function kiemTrang(html: string, duongDan: string): ViPham[] {
  const vp: ViPham[] = []

  const the = html.match(/<img\b[^>]*>/gi) ?? []
  the.forEach((t, i) => {
    const src = nguon(t)
    if (thuocTinh(t, 'alt') === null) {
      vp.push({ rule: 'IMG/alt', detail: `${duongDan}: ${src}` })
    }
    if (thuocTinh(t, 'width') === null || thuocTinh(t, 'height') === null) {
      vp.push({ rule: 'IMG/kich-thuoc', detail: `${duongDan}: ${src}` })
    }
    // Ảnh đầu tiên thường là hero, nằm trên màn hình đầu — lazy nó làm chậm LCP.
    if (i > 0 && (thuocTinh(t, 'loading') ?? '').toLowerCase() !== 'lazy') {
      vp.push({ rule: 'IMG/lazy', detail: `${duongDan}: ${src}` })
    }
    if (src.includes('cdn.sanity.io') && !/[?&]w=/.test(src)) {
      vp.push({ rule: 'IMG/kich-co-sanity', detail: `${duongDan}: ${src}` })
    }
  })

  return vp
}

/**
 * Một Check cho mỗi luật, gom mọi chỗ vi phạm. Luật không ai vi phạm thì pass —
 * NHƯNG chỉ khi thật sự đã đọc trang nào đó. Bài học N-021/DR-021: một hàm trả
 * 'pass' cho tập nguồn rỗng là lời khai vượt quá phần đã kiểm — trông giống hệt
 * "đã kiểm, sạch" trong khi chưa đọc byte HTML nào. Nên tongTrang === 0 bắt buộc
 * mọi luật phải là 'skip', không được 'pass'.
 */
export function gomViPham(
  viPham: Array<ViPham & { trang: string }>,
  tongTrang: number,
  moTa: Record<string, { moTa: string; drift: string }>,
): Check[] {
  if (tongTrang === 0) {
    return Object.entries(moTa).map(([rule, m]) => ({
      id: rule,
      verdict: 'skip' as const,
      detail: `0 trang — không có trang nào để kiểm (${m.moTa})`,
      drift: [m.drift],
    }))
  }

  return Object.entries(moTa).map(([rule, m]) => {
    const cua = viPham.filter((v) => v.rule === rule)
    if (cua.length === 0) {
      return {
        id: rule,
        verdict: 'pass' as const,
        detail: `${tongTrang} trang, không trang nào vi phạm: ${m.moTa}`,
        drift: [m.drift],
      }
    }
    const soTrang = new Set(cua.map((v) => v.trang)).size
    const hienThi = cua.slice(0, 5).map((v) => v.detail)
    const conLai = cua.length - hienThi.length
    return {
      id: rule,
      verdict: 'fail' as const,
      detail: `${m.moTa} — ${cua.length} chỗ trên ${soTrang} trang: ${hienThi.join('; ')}${conLai > 0 ? ` và ${conLai} chỗ nữa` : ''}`,
      drift: [m.drift],
    }
  })
}

/** Đọc đệ quy mọi file .html dưới `goc` (đường tuyệt đối). */
function moiFileHtml(goc: string): string[] {
  const ket: string[] = []
  const di = (thuMuc: string): void => {
    for (const ten of readdirSync(thuMuc)) {
      const p = join(thuMuc, ten)
      if (statSync(p).isDirectory()) di(p)
      else if (ten.endsWith('.html')) ket.push(p)
    }
  }
  di(goc)
  return ket
}

function main(): void {
  const ranAt = new Date().toISOString()
  const dist = join(REPO_ROOT, 'dist')

  if (!existsSync(dist)) {
    const report = buildReport('seo-auditor', ranAt, [
      {
        id: 'IMG/0',
        verdict: 'skip',
        detail: 'không có dist/ — chạy npm run build trước',
        drift: ['yêu cầu 2026-08-23'],
      },
    ])
    console.log(`[seo-auditor] bằng chứng: ${writeReport(report)}`)
    process.exit(exitCodeFor(report))
  }

  const files = moiFileHtml(dist)
  const viPham: Array<ViPham & { trang: string }> = []
  for (const f of files) {
    const trang = `/${relative(dist, f)}`
    for (const v of kiemTrang(readFileSync(f, 'utf8'), trang)) viPham.push({ ...v, trang })
  }

  const report = buildReport('seo-auditor', ranAt, gomViPham(viPham, files.length, MO_TA))
  const dir = writeReport(report)
  console.log(
    `[seo-auditor] ${files.length} trang — ${report.summary.pass} đạt, ${report.summary.fail} trượt, ${report.summary.skip} không kiểm được`,
  )
  console.log(`[seo-auditor] bằng chứng: ${dir}`)
  process.exit(exitCodeFor(report))
}

// Chỉ chạy main() khi file này được thực thi trực tiếp (npm run audit:seo).
// Test import các hàm thuần ở trên bằng `import ... from '../html-audit'` — nếu
// main() chạy vô điều kiện, mỗi lần test nạp module sẽ ghi báo cáo ra đĩa và
// gọi process.exit() giữa chừng, giết luôn tiến trình test.
if (duocGoiTrucTiep(import.meta.url)) main()
