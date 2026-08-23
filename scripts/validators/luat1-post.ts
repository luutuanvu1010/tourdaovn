/**
 * Luật 1 (06-BINDING_MAP §6) — một thông tin, một vùng, một lần.
 *
 * Tầng A (bật ở Task 2) — LẶP VÙNG: một field xuất hiện ở nhiều vùng hơn mức
 *   §3.1 cho phép. Ngoại lệ duy nhất là giá (thanh dính + khối hành động).
 * Tầng B (bật ở Task 8, 2026-08-23) — SAI VÙNG: field render ở vùng khác vùng
 *   §3.1 khai, dù không lặp (vd chỉ render đúng 1 lần nhưng ở nhầm vùng).
 *   Tầng B chỉ bật sau khi tầng A đã xanh trên toàn kho — bật sớm hơn thì mọi
 *   trang đỏ vì `info-bar`/`info-card` không phải vùng §3.1 khai, baseline
 *   thật bị chìm trong nhiễu.
 *
 * GIỚI HẠN CỦA TẦNG B — đọc trước khi coi tầng B là "bắt hết sai vùng":
 *   §3.1 đặt tên nhiều vùng bằng văn xuôi trỏ vào một MỤC NỘI DUNG cụ thể
 *   (`highlights`, `body`, `accessInfo`, `faq`, `seasonNote`, `includes`,
 *   `excludes`, `itinerary`, `sameAs`, rollup `experiences` — mỗi ô đọc
 *   "mục ..." hoặc "dòng ..."). idTuTenVung() gom TẤT CẢ các ô đó về một id
 *   chung duy nhất là `'section'` (nhánh `key.startsWith('mục')` /
 *   `startsWith('dòng')` bên dưới) — HTML cũng không tách mục nào ra id
 *   riêng. Hệ quả: tầng B phân biệt được field render ở `fact-strip` thay vì
 *   `hero-badge` (id khác nhau), nhưng KHÔNG phân biệt được field render ở
 *   mục "Câu hỏi thường gặp" thay vì mục "Nguồn tham khảo" — cả hai đều chỉ
 *   là `'section'`, nên một field cho sai mục nội dung này sang mục nội dung
 *   khác sẽ lọt qua tầng B mà không hiện đỏ. Đây không phải lỗi cần vá ở đợt
 *   này: mở rộng parser để tách id cho từng mục nội dung là việc khác phạm
 *   vi Task 8 (chờ §3.1 được sửa để gán id riêng cho từng mục — đề xuất đó
 *   đang chờ chủ dự án duyệt bản sửa spec, chưa có ở đây). Tầng B vẫn có giá
 *   trị thật trong biên đã nêu; chỉ đừng đọc nó rộng hơn biên đó.
 *
 *   Giới hạn thứ hai, phát hiện khi chạy thật lần đầu (Task 8, 2026-08-23):
 *   docMaTran() gộp vùng theo TÊN FIELD, không theo entity/cột. §3.1 chỉ có
 *   cột cho 4 entity (Điểm tham quan, Địa danh, Trải nghiệm, Tour) —
 *   Organization và Person KHÔNG có hàng nào ở §3.1 (xem DR-046). Nhưng
 *   `OrganizationDetail.astro`/`PersonDetail.astro` dùng lại đúng TÊN field
 *   (`address`, `telephone`, `officialSource`, `licenseInfo`, `sameAs`) mà
 *   §3.1 đã khai vùng cho các entity khác — nên tầng B đọc nhầm "field này có
 *   vùng đã khai" và đỏ khi trang Organization/Person render chúng ở
 *   `info-card` (vùng InfoCard hợp lệ cho hai entity này, vì chúng chưa nằm
 *   trong phạm vi đóng Luật 1 của Task 5–7). Tầng B KHÔNG có trục entity để
 *   phân biệt "field X ở entity A" với "field X (trùng tên) ở entity B chưa
 *   có hàng trong §3.1" — thêm trục đó là mở rộng parser, ngoài phạm vi Task
 *   8. Xem DR-046 (đã cập nhật) cho danh sách cụ thể và cách đọc kết quả này.
 *
 * Vì sao có file này: Luật 1 là luật duy nhất trong 06 không có bộ kiểm máy.
 * g3 kiểm field CÓ được render không, không kiểm được render MẤY LẦN — và §3.1
 * tự ghi "bộ kiểm g3 không đọc". Một đợt rà tay trước đó (lọc sitemap theo 4
 * tiền tố URL, không xem trang lưu trú) từng đếm 44/58 trang chi tiết lặp
 * vùng. Bộ kiểm máy này quét TOÀN BỘ dist/ và đo đúng hơn: 58/58 trang có
 * data-region ở diem-tham-quan · dia-danh · trai-nghiem · tour · khach-san
 * đều lặp vùng (132 vi phạm) — bắt thêm cả khach-san (starRating,
 * beachAccess, checkinTime) mà đợt rà tay bỏ sót. Đây chính là lý do cần bộ
 * kiểm máy thay vì đếm tay (chốt kiểm soát 2026-08-23).
 *
 * ĐỌC THẲNG §3.1 TỪ MARKDOWN, không chép tay bảng vào đây — DR-027.
 *
 * Ghi chú vá lỗi phân tích bảng (so với bản nháp task-2-brief.md, thấy khi
 * chạy thật trên 06-BINDING_MAP.md v2.2 — không phải một bảng "chép tay"
 * mới, chỉ là parser tổng quát hơn để đọc đúng văn xuôi ô bảng thật):
 *   1. Dòng phân cách markdown `|---|---|...|` từng lọt qua bộ lọc (regex
 *      cũ so `line.slice(1)` với mẫu đòi `|` ở đầu — không bao giờ khớp).
 *      Sửa: nhận diện dòng phân cách bằng nội dung ô (toàn dấu `-`/`:`),
 *      không so chuỗi cụ thể của bảng này.
 *   2. Cột Field "giá (`bookingRef`)" chưa bỏ ngoặc đơn trước khi so
 *      `=== 'giá'`, nên field không bao giờ quy về khoá `gia`. Sửa: áp cùng
 *      phép bỏ ngoặc đã dùng cho ô giá trị.
 *   3. Nhiều ô vùng trong v2.2 là văn xuôi dài hơn ALIAS gốc dự liệu ("mắt
 *      cha trong breadcrumb", "ghi chú trong khối hành động", "khối hành
 *      động (`BookingForm`); …", "— (Tour không có mắt cha; …)"). ALIAS
 *      vẫn CHỈ ánh xạ cách viết tên vùng → id ngắn (không phải field→vùng);
 *      chỉ tổng quát hoá so khớp từ "bằng hệt" sang "chứa cụm đã biết", và
 *      chuẩn hoá ô rặt dấu gạch ngang (có hoặc không có chú thích sau nó)
 *      thành "không có vùng". Không field→vùng nào được gán tay.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
const BINDING_MAP = resolve(REPO_ROOT, 'docs', 'core-specs', '06-BINDING_MAP.md')
const DIST = resolve(REPO_ROOT, 'dist')
const REPORT_DIR = resolve(REPO_ROOT, 'scripts', 'reports')

/**
 * Sàn cỡ kho trang — chống "xanh giả" khi build hỏng giữa chừng.
 *
 * Phát hiện thật, 2026-08-23: dist/ bị cắt tay xuống còn 2 trang (mô phỏng
 * build chết nửa chừng — Sanity API ở đây có timeout thật), rồi chạy
 * validator này KHÔNG sửa gì khác. Kết quả in ra:
 *
 *     [pass] Luật 1 — 2 trang, 0 field lặp vùng
 *
 * Đó là XANH GIẢ: dist/ méo, không phải dist/ sạch. Task 3 sắp đăng ký
 * validator này vào gate:all — một cổng bị build hỏng làm xanh còn tệ hơn
 * không có cổng, vì nó cấp "chứng nhận sạch" cho thứ chưa từng được soi.
 *
 * Sàn 80: build đầy đủ đo được là 105 trang; 80 chừa dư địa cho nội dung co
 * lại tự nhiên (gỡ trang, gộp mục) mà vẫn bắt được cắt-build thảm hoạ. Đây
 * KHÔNG phải nguồn sự thật thứ hai kiểu DR-027 cảnh báo — nó không nói field
 * nào thuộc vùng nào, chỉ nói "kho trang này nhỏ tới mức không kết luận được
 * gì cả", nên phải dừng trước khi tính vi phạm, không lẫn vào kết quả Luật 1.
 */
const CORPUS_FLOOR = 80

/**
 * Lớp phiên dịch tên vùng: §3.1 gọi vùng bằng tiếng Việt, HTML gắn id ngắn.
 * Đây KHÔNG phải nguồn sự thật thứ hai về "field nào ở vùng nào" — nó chỉ
 * chuẩn hoá CÁCH VIẾT. Bằng chứng: mọi tên vùng đọc được từ §3.1 mà không có
 * trong bảng này đều làm validator đỏ (xem ktraVungLa).
 */
const ALIAS: Record<string, string> = {
  'huy hiệu hero': 'hero-badge',
  'hero': 'hero',
  'breadcrumb': 'breadcrumb',
  'thông tin nhanh': 'fact-strip',
  'thanh dính': 'sticky-bar',
  'khối hành động': 'action-block',
  'thẻ bản đồ': 'map-card',
  'cuối nội dung': 'footer-meta',
  'bookingform': 'action-block',
}

function chuanHoa(s: string): string {
  return s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[`*]/g, '').trim()
}

// Thứ tự thử "chứa cụm" trong idTuTenVung phải là DÀI NHẤT TRƯỚC, không phải
// thứ tự khai báo trong ALIAS. Lý do: nếu một alias ngắn (vd "hero") lại là
// chuỗi con của một alias dài hơn xuất hiện cùng ô ("huy hiệu hero"), thử theo
// thứ tự khai báo có thể khớp nhầm alias ngắn trước — sai âm thầm, không lỗi.
// Hôm nay không cell nào rơi vào ca đó (mọi ô khớp bằng-hệt trước khi tới
// nhánh này), nhưng đây là bảo đảm mà comment idTuTenVung/ktraVungLa hứa:
// "tên vùng lạ ⇒ đỏ" chỉ đúng nếu match không phụ thuộc thứ tự khai báo.
const ALIAS_DAI_TOI_NGAN = Object.entries(ALIAS).sort((a, b) => b[0].length - a[0].length)

/** Tên vùng → id ngắn. So bằng hệt trước; rồi "chứa cụm ALIAS đã biết" cho
 *  văn xuôi dài hơn (vd "ghi chú trong khối hành động" chứa "khối hành động"),
 *  thử alias DÀI NHẤT trước để khớp không phụ thuộc thứ tự khai báo ALIAS. */
function idTuTenVung(key: string): string | null {
  if (ALIAS[key]) return ALIAS[key]
  if (key.startsWith('mục') || key.startsWith('dòng')) return 'section'
  for (const [aliasKey, id] of ALIAS_DAI_TOI_NGAN) {
    if (key.includes(aliasKey)) return id
  }
  return null
}

/** Đọc ma trận §3.1 → Map<field, Set<vùng>>. */
function docMaTran(): Map<string, Set<string>> {
  const doc = readFileSync(BINDING_MAP, 'utf-8')
  const m = doc.match(/### 3\.1[\s\S]*?\n(\|[\s\S]*?)\n\n/)
  if (!m) throw new Error('Khong doc duoc ma tran §3.1 trong 06-BINDING_MAP.md')
  const out = new Map<string, Set<string>>()
  for (const line of m[1].split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line.split('|').slice(1, -1).map(c => c.trim())
    if (cells.length < 2 || cells[0] === 'Field') continue
    // Dòng phân cách markdown: mọi ô chỉ gồm dấu gạch ngang (có thể kèm ':').
    if (cells.every(c => /^:?-+:?$/.test(c))) continue
    // Cột 0 có thể gộp nhiều field: "`a` · `b` · `c`"; có thể kèm chú thích
    // trong ngoặc đơn ("giá (`bookingRef`)") — phải bỏ ngoặc trước khi so.
    const fields = cells[0]
      .split('·')
      .map(f => f.replace(/\(.*?\)/g, '').replace(/[`*]/g, '').trim())
      .filter(Boolean)
    const vungs = new Set<string>()
    for (const cell of cells.slice(1)) {
      const oChuan = chuanHoa(cell)
      if (!oChuan || oChuan === '—') continue // "—" hoặc "— (chú thích)" đều là không có vùng
      for (const phan of oChuan.split('+')) {
        const key = phan.replace(/,.*$/, '').trim()
        if (!key || key === '—') continue
        const id = idTuTenVung(key)
        vungs.add(id ?? `?${key}`)
      }
    }
    for (const f of fields) {
      const k = f === 'giá' ? 'gia' : f
      out.set(k, new Set([...(out.get(k) ?? []), ...vungs]))
    }
  }
  return out
}

function ktraVungLa(maTran: Map<string, Set<string>>): string[] {
  const la: string[] = []
  for (const [field, vungs] of maTran)
    for (const v of vungs) if (v.startsWith('?')) la.push(`${field} → ${v.slice(1)}`)
  return la
}

function moiTrangHtml(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = resolve(dir, e)
    if (statSync(p).isDirectory()) moiTrangHtml(p, acc)
    else if (e === 'index.html') acc.push(p)
  }
  return acc
}

/** Gom (field, vùng) của một trang. Vùng là data-region gần nhất bao ô đó. */
function docTrang(html: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  // Nhóm field CỐ Ý rộng ([^"]+), không phải [A-Za-z]+: §3.1 (06-BINDING_MAP.md
  // dòng 122) khai `_updatedAt` · `updatedAt`, tên field có gạch dưới đứng đầu —
  // [A-Za-z]+ không khớp, data-field="_updatedAt" sẽ bị bỏ qua ÂM THẦM, không lỗi,
  // không đếm, không lên báo cáo. Đây đúng kiểu lỗi rơi-lặng mà nhánh ALIAS đã
  // cố tình dựng để nổ ra (ktraVungLa) — không được để mở lại ở phía HTML.
  const rx = /data-region="([a-z-]+)"|data-field="([^"]+)"/g
  let vungHienTai = ''
  let m: RegExpExecArray | null
  while ((m = rx.exec(html))) {
    if (m[1]) { vungHienTai = m[1]; continue }
    const field = m[2]
    if (!vungHienTai) continue
    if (!out.has(field)) out.set(field, new Set())
    out.get(field)!.add(vungHienTai)
  }
  return out
}

function main() {
  const maTran = docMaTran()
  const la = ktraVungLa(maTran)
  if (la.length > 0) {
    console.log(`[FAIL] §3.1 có ${la.length} tên vùng chưa khai trong ALIAS:`)
    for (const x of la) console.log(`       ${x}`)
    console.log('       Sửa ALIAS trong luat1-post.ts, KHÔNG sửa 06 để né bộ kiểm.')
    process.exit(1)
  }

  const trangs = moiTrangHtml(DIST)

  // Sàn cỡ kho trang — PHẢI chạy trước khi tính vi phạm. Đây không phải kết
  // quả Luật 1 (không nói field/vùng gì cả), nên không được lẫn vào [pass]
  // hay [FAIL] vi phạm lặp vùng — phải là nhánh thoát riêng, rõ ràng khác.
  if (trangs.length < CORPUS_FLOOR) {
    console.log(
      `[REFUSE] Luật 1 — chỉ thấy ${trangs.length} trang trong dist/, dưới sàn ${CORPUS_FLOOR}.`,
    )
    console.log('         Build trông như bị cắt (dở dang hoặc lỗi giữa chừng), không phải dist/ sạch.')
    console.log('         Từ chối phán quyết Luật 1 trên kho trang này — đây KHÔNG phải "0 vi phạm".')
    console.log('         Sửa: build lại (npm run build) rồi chạy lại validator.')
    process.exit(1)
  }

  const viPham: { page: string; field: string; regions: string[] }[] = []
  for (const p of trangs) {
    const duLieu = docTrang(readFileSync(p, 'utf-8'))
    for (const [field, vungs] of duLieu) {
      const chophep = maTran.get(field)
      // Vùng cũ chưa có trong §3.1 vẫn tính vào số vùng — đó là điểm của tầng A.
      const soVungChoPhep = chophep ? chophep.size : 1
      if (vungs.size > soVungChoPhep)
        viPham.push({ page: relative(REPO_ROOT, p), field, regions: [...vungs].sort() })

      // Tầng B — SAI VÙNG. Field render ở vùng khác vùng §3.1 khai.
      if (chophep) {
        const sai = [...vungs].filter(v => !chophep.has(v))
        if (sai.length > 0)
          viPham.push({ page: relative(REPO_ROOT, p), field, regions: [`SAI VUNG: ${sai.sort().join(' + ')}`] })
      }
    }
  }

  mkdirSync(REPORT_DIR, { recursive: true })
  writeFileSync(
    resolve(REPORT_DIR, 'luat1-post.json'),
    JSON.stringify({ pages: trangs.length, violations: viPham }, null, 2),
  )

  if (viPham.length > 0) {
    const soTrang = new Set(viPham.map(v => v.page)).size
    // Tách đếm theo tầng chỉ để in đúng chữ — không đổi cách tính viPham.
    const soSaiVung = viPham.filter(v => v.regions[0]?.startsWith('SAI VUNG:')).length
    const soLapVung = viPham.length - soSaiVung
    console.log(
      `[FAIL] Luật 1 — ${viPham.length} vi phạm (${soLapVung} lặp vùng, ${soSaiVung} sai vùng) trên ${soTrang} trang:`,
    )
    for (const v of viPham.slice(0, 20))
      console.log(`       ${v.page}  ${v.field}  →  ${v.regions.join(' + ')}`)
    if (viPham.length > 20) console.log(`       … và ${viPham.length - 20} vi phạm nữa (xem scripts/reports/luat1-post.json)`)
    process.exit(1)
  }

  console.log(`[pass] Luật 1 — ${trangs.length} trang, 0 field lặp vùng, 0 field sai vùng`)
}

main()
