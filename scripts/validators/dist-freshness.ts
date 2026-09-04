/**
 * Tiền điều kiện của cổng hậu build: dist/ có thật sự là bản dựng của mã đang push không.
 *
 * VÌ SAO TỒN TẠI. Nhóm `post` trong run-gates.mjs là validator HẬU BUILD — chúng đọc
 * `dist/`. Nhưng `npm run gate` không build trước, nên kết quả cổng là hàm của thư mục
 * `dist/` tình cờ nằm trên máy, KHÔNG phải hàm của mã đang push. Ngày 2026-09-04 đã đo
 * được cả hai chiều hỏng, chạy hai lần không đổi một dòng mã nào, chỉ chèn `npm run build`
 * vào giữa (docs/evidence/2026-09-04-ra-soat-tu-dong-hoa §1):
 *
 *   - ĐỎ GIẢ  — r3-r4-post báo 33 lỗi, geo-knowledge-post báo 32 lỗi. Dựng lại: cả hai xanh.
 *   - XANH GIẢ — jsonld-post in [pass] trong khi có một `@id` hỏng ĐANG SỐNG trên production.
 *
 * Đỏ giả chỉ gây phiền. Xanh giả mới là thứ nguy hiểm, và nó cùng họ với DR-001: không
 * phải "báo cáo cũ nói pass" mà "dist/ cũ làm validator nói pass".
 *
 * VÌ SAO KHÔNG ĐƠN GIẢN LÀ CHO `gate` TỰ BUILD. Đo thật: build 251 giây, validators 11 giây.
 * Bắt mỗi `git push` chờ hơn 4 phút thì người ta sẽ dùng `--no-verify`, và hàng rào coi như
 * mất hẳn — tệ hơn hiện trạng. Nên chỗ này KHÔNG dựng lại; nó chỉ trả lời "dist/ còn dùng
 * được không", mất khoảng một giây, rồi bảo người dùng chạy `npm run build` nếu không.
 *
 * VÌ SAO LÀ TIỀN ĐIỀU KIỆN CHỨ KHÔNG PHẢI MỘT VALIDATOR NỮA. run-gates.mjs cố ý chạy hết
 * mọi validator thay vì dừng ở lỗi đầu (DR-019). Nhưng dist/ cũ không phải "một lỗi trong
 * số nhiều" — nó làm MỌI kết quả phía sau mất nghĩa. Chạy tiếp rồi in một bảng đỏ/xanh lẫn
 * lộn chính là cách sinh ra hiểu nhầm ở §1. Nên khi cũ thì chặn cả lượt, và nói rõ vì sao.
 *
 * KHÔNG dùng file dấu vết. Mốc dựng lấy từ chính `mtime` của `dist/index.html` — nó sinh ra
 * và chết cùng bản dựng, nên không có cảnh "xoá dist mà dấu vết còn nằm đó nói là tươi".
 */
import { existsSync, statSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(SCRIPTS_DIR, '..', '..')
const DIST_INDEX = resolve(ROOT, 'dist', 'index.html')

/** Thứ mà bản dựng đọc vào. `src/` là mã; `data/` có prices.yaml; `public/` là asset chép thẳng. */
const NGUON = ['src', 'data', 'public', 'astro.config.mjs']

export type MocThoiGian = {
  /** mtime của dist/index.html, hoặc null nếu chưa build. */
  distMs: number | null
  /** mtime của file nguồn mới nhất, hoặc null nếu không có file nào. */
  nguonMoiNhatMs: number | null
  nguonMoiNhatTen: string | null
  /** _updatedAt lớn nhất trong namespace published, hoặc null nếu KHÔNG hỏi được. */
  sanityMoiNhatMs: number | null
  sanityMoiNhatIso: string | null
}

export type KetQua = { tuoi: boolean; lyDo: string[] }

function gio(ms: number): string {
  return new Date(ms).toLocaleString('sv-SE').replace('T', ' ')
}

/**
 * Logic thuần, không I/O — để test được mọi nhánh mà không cần dựng site thật.
 *
 * "Bằng đúng mốc" tính là TƯƠI: chỉ MỚI HƠN mới làm dist/ cũ. Sai số một mili giây
 * không phải tín hiệu gì.
 */
export function danhGiaTuoi(m: MocThoiGian): KetQua {
  const lyDo: string[] = []

  if (m.distMs === null) {
    return { tuoi: false, lyDo: ['chưa có dist/index.html — chưa build thì không có gì để kiểm'] }
  }

  if (m.nguonMoiNhatMs !== null && m.nguonMoiNhatMs > m.distMs) {
    lyDo.push(
      `nguồn mới hơn bản dựng — ${m.nguonMoiNhatTen} sửa lúc ${gio(m.nguonMoiNhatMs)}, ` +
      `dist/ dựng lúc ${gio(m.distMs)}`,
    )
  }

  // Fail-closed. Không hỏi được Sanity thì KHÔNG kết luận là tươi — nội dung trang lấy
  // từ Sanity lúc build, nên bỏ qua nhánh này là mở đúng cái cửa đã sinh ra đỏ giả/xanh
  // giả. Cùng triết lý với nhánh D-A của guard-deploy.sh.
  if (m.sanityMoiNhatMs === null) {
    lyDo.push(
      'không xác minh được nội dung Sanity (không hỏi được Sanity) — fail-closed, ' +
      'vì nội dung trang lấy từ Sanity lúc build',
    )
  } else if (m.sanityMoiNhatMs > m.distMs) {
    lyDo.push(
      `Sanity đổi sau khi dựng — document mới nhất ${m.sanityMoiNhatIso}, ` +
      `dist/ dựng lúc ${gio(m.distMs)}`,
    )
  }

  return { tuoi: lyDo.length === 0, lyDo }
}

// ── I/O ──

function mtimeMoiNhat(duongDan: string): { ms: number; ten: string } | null {
  if (!existsSync(duongDan)) return null
  const st = statSync(duongDan)
  if (!st.isDirectory()) return { ms: st.mtimeMs, ten: relative(ROOT, duongDan) }

  let moi: { ms: number; ten: string } | null = null
  for (const muc of readdirSync(duongDan, { withFileTypes: true })) {
    const con = mtimeMoiNhat(join(duongDan, muc.name))
    if (con && (!moi || con.ms > moi.ms)) moi = con
  }
  return moi
}

async function hoiSanity(): Promise<{ ms: number; iso: string } | null> {
  try {
    const { getClient } = await import('../lib/sanity-client.js')
    // Một truy vấn duy nhất, chỉ lấy một mốc thời gian — rẻ hơn nhiều so với fetchAllDocs.
    const iso: string | null = await getClient().fetch(
      `*[defined(_updatedAt)] | order(_updatedAt desc)[0]._updatedAt`,
    )
    if (!iso) return null
    return { ms: Date.parse(iso), iso }
  } catch {
    return null
  }
}

export async function docMoc(): Promise<MocThoiGian> {
  const dist = existsSync(DIST_INDEX) ? statSync(DIST_INDEX).mtimeMs : null

  let nguon: { ms: number; ten: string } | null = null
  for (const ten of NGUON) {
    const con = mtimeMoiNhat(resolve(ROOT, ten))
    if (con && (!nguon || con.ms > nguon.ms)) nguon = con
  }

  const sanity = await hoiSanity()

  return {
    distMs: dist,
    nguonMoiNhatMs: nguon?.ms ?? null,
    nguonMoiNhatTen: nguon?.ten ?? null,
    sanityMoiNhatMs: sanity?.ms ?? null,
    sanityMoiNhatIso: sanity?.iso ?? null,
  }
}

async function main() {
  console.log('=== Tiền điều kiện: dist/ có phải bản dựng của mã đang push không ===\n')
  const kq = danhGiaTuoi(await docMoc())

  if (kq.tuoi) {
    console.log('[pass] dist/ còn tươi — cổng hậu build nói đúng về mã hiện tại.')
    return
  }

  for (const l of kq.lyDo) console.log(`[FAIL] ${l}`)
  console.log('\n  Cổng hậu build KHÔNG chạy — chạy trên dist/ cũ thì kết quả, đỏ hay xanh,')
  console.log('  đều không nói gì về mã đang push. Xem §1 trong')
  console.log('  docs/evidence/2026-09-04-ra-soat-tu-dong-hoa/report.md.')
  console.log('\n  Chạy:  npm run build')
  process.exit(1)
}

// Chỉ chạy khi được gọi trực tiếp, để test import được mà không kích hoạt main().
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
