/**
 * ĐỒNG BỘ GIÁ MỘT CHIỀU — Google Sheet (tab `gia`) → data/prices.yaml
 *
 * Căn cứ: QĐ-2026-08-26-02 trong docs/DECISIONS.md; bố cục cột ở docs/gia/README.md.
 *
 * Sheet là BỀ MẶT NHẬP. `data/prices.yaml` vẫn là NGUỒN SỰ THẬT: nó là thứ được commit
 * và là thứ duy nhất bản dựng đọc. Script này chỉ chảy một chiều Sheet → yaml, chạy tay,
 * không bao giờ ghi ngược lên Sheet, không chạy lúc build, không chạy lúc runtime.
 *
 * Năm điều đáng nhớ về file này:
 *
 *   1. KHÔNG dependency mới. `fetch` của Node 22 và gói `yaml` đã có sẵn trong scripts/.
 *      Bộ đọc CSV viết tay ở dưới — vì tên tour có dấu phẩy nên phải xử ô trong ngoặc kép.
 *   2. XOÁ PHẢI ỒN ÀO. Khoá có trong yaml mà không có trong Sheet = xoá một dòng giá, và
 *      xoá một dòng đang được trỏ tới là làm tour đó mất form đặt. Script liệt kê rồi DỪNG.
 *      Chỉ xoá khi chạy kèm cờ `--cho-phep-xoa`. Cùng tinh thần "hỏng ồn ào" của DR-099.
 *   3. KIỂM TRƯỚC KHI GHI. Một dòng sai là không ghi gì cả. Không có chuyện ghi một nửa.
 *      Luật hợp lệ NHẬP THẲNG từ scripts/validators/py1-py8.ts, và ngay trước khi ghi thì
 *      chạy chính PY1/PY2/PY7 trên nội dung sắp ghi. Không có bản chép tay nào để lệch câm,
 *      và bước "chạy validator" mà chốt 2 của quyết định đòi là được THI HÀNH, không phải
 *      được nhắc. Ghi ra tệp tạm rồi `renameSync`, để chết giữa chừng không để lại file rỗng.
 *   4. KHỐI CHÚ THÍCH đầu prices.yaml được đọc lại từ chính file cũ và chép nguyên văn.
 *      Nó ghi bài học DR-097 (khoá là định danh ổn định, đừng đổi theo slug) — sinh lại
 *      file mà mất khối đó là xoá mất lời cảnh báo đã phải trả giá mới có.
 *   5. BẤT BIẾN. Thứ tự khoá và cách xuống dòng cố định (xem `tachKhoiCu` + `xepKhoiRa`). Sheet
 *      không đổi thì chạy bao nhiêu lần yaml cũng không đổi một byte.
 *
 * Cách chạy:
 *   npm --prefix scripts run prices:pull                      đọc Sheet thật
 *   npm --prefix scripts run prices:pull -- --cho-phep-xoa    cho phép xoá dòng giá
 *   npm --prefix scripts run prices:pull -- --tu-tep <csv>    đọc CSV cục bộ, không gọi mạng
 *
 * Soạn 2026-08-26.
 */
import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, isAbsolute } from 'node:path'
import { parse as docYaml } from 'yaml'
import { config as napEnv } from 'dotenv'
// Luật hợp lệ KHÔNG chép tay: nhập thẳng từ cổng đang chạy, rồi chạy chính cổng đó trên nội
// dung sắp ghi. Vì thế file này chạy bằng `tsx` chứ không phải `node` trần — xem package.json.
import {
  VALID_UNITS,
  ALLOWED_PAX_CODES,
  PAX_NOTE_MAX,
  validatePY1,
  validatePY2,
  validatePY7,
} from './validators/py1-py8.js'

// ── Đường dẫn: suy từ vị trí của chính file này qua import.meta.url, không bao giờ từ thư
// mục làm việc hiện hành — 04-CONSTRAINTS §2.7, vì `npm --prefix` đổi thư mục đó. ──

const GOC_REPO = fileURLToPath(new URL('..', import.meta.url))
const DUONG_YAML = resolve(GOC_REPO, 'data/prices.yaml')
const DUONG_HAT_GIONG = resolve(GOC_REPO, 'docs/gia/mau-nhap-gia.csv')

// Nạp `.env` ở gốc repo — cùng khuôn với các script khác trong `scripts/`. Không có bước
// này thì `PRICES_SHEET_ID` chỉ đọc được khi người dùng tự export ra shell, và lệnh
// `npm run prices:pull` sẽ chết ngay dòng kiểm bên dưới.
napEnv({ path: resolve(GOC_REPO, '.env'), quiet: true })

// Tệp này VỪA là CLI vừa là module cho test (`docDonVi`, `DON_VI_TU_SHEET` — xem
// scripts/validators/__tests__/prices-pull-pergroup.test.ts). Không có hàng rào này thì
// `import '../../prices-pull.mjs'` từ một tệp test sẽ CHẠY nguyên đường đồng bộ: đọc `.env`,
// gọi Google Sheet thật, và `renameSync` đè `data/prices.yaml` — từ trong `npm test`. Đã đo
// 2026-09-04 (docs/evidence/2026-09-04-ra-soat-task7-prices-pull/): trong tiến trình con của
// `node:test`, `process.argv.slice(2)` là `[]` nên `chay()` đi thẳng nhánh mặc định, không
// cờ nào chặn lại. Node ở repo này là v22 nên `import.meta.filename` dùng được thẳng.
const LA_CLI = process.argv[1] != null && resolve(process.argv[1]) === import.meta.filename

// Mã Sheet đọc từ biến môi trường, KHÔNG viết cứng vào kho.
//
// Vì sao: kho này là PUBLIC, và Sheet giá bật "Xuất bản lên web" nên `gviz/tq` đọc được
// ẨN DANH — đã đo 2026-08-27: gọi không cookie trả HTTP 200 kèm dữ liệu thật. Nghĩa là mã
// Sheet KHÔNG phải một định danh vô hại, nó là chìa khoá: ai có mã là đọc được bảng giá.
// Thứ duy nhất đang che nó là chưa ai biết mã — viết cứng vào kho public là gỡ đúng lớp
// che đó.
//
// Đặt trong `.env` ở gốc repo (file đó không được track):
//   PRICES_SHEET_ID=<mã sheet>
//
// Phép kiểm "thiếu PRICES_SHEET_ID → dừng" nằm TRONG `chay()` (đầu hàm), không ở tầng module
// nữa — tầng module chạy cả lúc `import` từ test, và một máy không có `.env` (CI, clone mới)
// import tệp này để lấy `docDonVi` không được phép chết ở đây.
const MA_SHEET = process.env.PRICES_SHEET_ID
const TEN_TAB = 'gia'
// Tìm tab THEO TÊN chứ không theo gid — thêm tab khác vào Sheet không làm hỏng đồng bộ.
const URL_SHEET =
  `https://docs.google.com/spreadsheets/d/${MA_SHEET}/gviz/tq` +
  `?tqx=out:csv&sheet=${encodeURIComponent(TEN_TAB)}`

// ── Luật, chép từ scripts/validators/py1-py8.ts và docs/gia/README.md ──

// Bảng 13 cột của Sheet chỉ biểu diễn được `perPax`. `VALID_UNITS` nhập từ cổng, nên nếu
// enum bên đó bỏ `perPax` thì script chết ngay lúc nạp chứ không âm thầm sinh ra một unit
// đã hết hợp lệ.
const DON_VI_BAT_BUOC = 'perPax'
if (!VALID_UNITS.has(DON_VI_BAT_BUOC)) {
  throw new Error(`PY1 không còn nhận unit "${DON_VI_BAT_BUOC}" — Sheet 13 cột hết biểu diễn được giá.`)
}

const DANG_DON_VI_NHOM = /^per(\d+)pax$/i

/**
 * Đọc ô `Đơn vị` của Sheet. Trả null nếu site chưa hỗ trợ đơn vị đó.
 * `per5pax` là ký hiệu CHỦ DỰ ÁN TỰ DÙNG trước khi có ai đặc tả (ADR-0033 §3) — giữ nguyên
 * ký hiệu ấy thay vì thêm một cột "Số khách mỗi lượt" vào bảng 13 cột. Chuỗi này không rời
 * khỏi biên Sheet: trong yaml nó thành hai khoá tường minh `unit` + `maxPax`.
 *
 * Khớp KHÔNG PHÂN BIỆT hoa/thường — người kinh doanh gõ tay, và `per5Pax` (P hoa) đã từng
 * lọt qua luật cũ rồi bị BỎ QUA IM LẶNG vì so khớp chính xác hoa/thường. Nhưng giá trị TRẢ VỀ
 * luôn CHUẨN HOÁ (`perPax` / `perGroup`) bất kể người gõ kiểu gì — thứ ghi vào prices.yaml
 * không được phản ánh cách gõ của người dùng. Chỉ nới CHIỀU HOA/THƯỜNG, không nới hình dạng:
 * `per5paxx`, `perpaxx` vẫn phải trượt null như trước.
 */
export function docDonVi(s) {
  if (String(s).toLowerCase() === DON_VI_BAT_BUOC.toLowerCase()) return { unit: 'perPax' }
  const m = DANG_DON_VI_NHOM.exec(s)
  if (m) {
    const maxPax = parseInt(m[1], 10)
    if (Number.isInteger(maxPax) && maxPax > 0) return { unit: 'perGroup', maxPax }
  }
  return null
}

/**
 * Đơn vị mà Sheet SINH RA ĐƯỢC. Tập ĐÓNG, đối chiếu được với `docDonVi` ngay trên.
 *
 * Đo 2026-09-04: `data/prices.yaml` chỉ có ba khoá con `unit`/`amount`/`paxRates` trên cả 29 mục —
 * không `tiers`, không `perRoomNight`, không `perTicket`. Nên hôm nay CẢ HAI luật đều cho `giuNguyen`
 * tập rỗng; rủi ro dưới đây hoàn toàn là rủi ro TƯƠNG LAI, không phải lỗi đang xảy ra.
 *
 * Vì sao khai theo chiều này chứ không liệt kê "thứ Sheet không chở được": luật cũ
 * `unit !== 'perPax'` bảo vệ được cả những đơn vị CHƯA AI NGHĨ RA. Liệt kê thứ-không-chở-được là
 * một tập MỞ phải nuôi mãi mãi — quên một cái thì dòng đó thành "của Sheet", vắng mặt trong Sheet,
 * và rơi vào đường xoá. Khai theo chiều "Sheet sinh ra được" giữ lại tính chất mặc-định-an-toàn.
 */
export const DON_VI_TU_SHEET = new Set(['perPax', 'perGroup'])

// Thứ tự IN ba hạng phụ ghim tại chỗ, vì nó quyết định byte của file sinh ra (chốt 6). Nhưng
// TẬP hạng phụ lấy từ cổng: thêm hoặc bớt một hạng bên py1-py8.ts là script dừng và bảo sửa,
// chứ không lệch câm.
const HANG_PHU = ['child', 'senior', 'infant']
{
  const ben_cong = [...ALLOWED_PAX_CODES].sort().join(',')
  const ben_nay = [...HANG_PHU].sort().join(',')
  if (ben_cong !== ben_nay) {
    throw new Error(
      `Tập hạng phụ đã lệch: PY7 khai [${ben_cong}], script này in [${ben_nay}]. ` +
      'Sửa HANG_PHU trong scripts/prices-pull.mjs cho khớp rồi chạy lại.'
    )
  }
}

const GHI_CHU_TOI_DA = PAX_NOTE_MAX              // nhập từ PY7, không chép tay
const TRAN_GIA = 1_000_000_000                   // một tỷ đồng một khách; quá đây gần như chắc chắn gõ nhầm
const DANG_KHOA = /^[a-z0-9-]+$/                 // chữ thường, số, gạch ngang
const DANG_MA_TOUR = /^TD[A-Z0-9-]{0,8}$/        // tiền tố TD, tổng tối đa 10 ký tự

/**
 * `Mã tour` CHƯA chảy vào prices.yaml ở lượt này.
 *
 * Lý do: `validatePY2`/`validatePY7` giữ danh sách khoá đóng cho perPax
 * (`unit`, `amount`, `tiers`, `paxRates`), nên thêm một khoá nữa là cổng báo đỏ ngay.
 * Đưa `Mã tour` vào yaml là đổi lược đồ giá — cần một quyết định riêng ở tầng ADR.
 *
 * KHI CÓ QUYẾT ĐỊNH ĐÓ: đổi hằng này từ `null` thành tên khoá yaml (ví dụ `'maTour'`),
 * rồi mở rộng `ALLOWED_TOP_KEYS.perPax` trong scripts/validators/py1-py8.ts cho khớp.
 * Trong file này không phải sửa chỗ nào khác — hai điểm dùng nó đều đọc từ hằng.
 */
const KHOA_YAML_CHO_MA_TOUR = null

/**
 * Chuẩn hoá tên cột trước khi khớp. Người dùng Sheet sẽ gõ hoa/thường lẫn lộn, thừa khoảng
 * trắng, hoặc bỏ dấu — cả ba đều phải ăn về cùng một cột.
 *   "Giá người lớn" · "giá người lớn " · "GIA NGUOI LON" · "gia-nguoi-lon" · "gia_nguoi_lon"
 *   → tất cả thành "gia-nguoi-lon".
 * Phải hạ chữ thường TRƯỚC rồi mới đổi đ→d, vì NFD không tách được đ/Đ thành d + dấu.
 */
function chuanHoaTen(tho) {
  return String(tho)
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_.]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Bảng cột. `ten` là tiêu đề chuẩn hiện nay; `biDanhThem` là những tên cũ vẫn nhận để Sheet
 * đang dùng bố cục cũ không gãy. Cột được tìm THEO TIÊU ĐỀ, không theo vị trí — chèn cột
 * mới vào giữa Sheet không làm hỏng đồng bộ.
 */
const COT = {
  maTour:       { ten: 'Mã tour',                batBuoc: false },
  tenTour:      { ten: 'Tên tour',               batBuoc: false },
  khoa:         { ten: 'Khoá giá',               batBuoc: true, biDanhThem: ['khoa', 'khoa-gia'] },
  duongDan:     { ten: 'Đường dẫn',              batBuoc: false, biDanhThem: ['slug-tour'] },
  donVi:        { ten: 'Đơn vị',                 batBuoc: true },
  giaNguoiLon:  { ten: 'Giá người lớn',          batBuoc: true },
  giaChild:     { ten: 'Giá trẻ em',             batBuoc: false },
  ghiChuChild:  { ten: 'Ghi chú trẻ em',         batBuoc: false },
  giaSenior:    { ten: 'Giá người cao tuổi',     batBuoc: false, biDanhThem: ['gia-cao-tuoi'] },
  ghiChuSenior: { ten: 'Ghi chú người cao tuổi', batBuoc: false, biDanhThem: ['ghi-chu-cao-tuoi'] },
  giaInfant:    { ten: 'Giá em bé',              batBuoc: false },
  ghiChuInfant: { ten: 'Ghi chú em bé',          batBuoc: false },
  ghiChuNoiBo:  { ten: 'Ghi chú nội bộ',         batBuoc: false },
}
for (const dn of Object.values(COT)) {
  dn.biDanh = new Set([chuanHoaTen(dn.ten), ...(dn.biDanhThem ?? []).map(chuanHoaTen)])
}

// Ba hạng phụ trỏ về đúng cặp cột giá/ghi chú của mình.
const COT_HANG_PHU = {
  child: { gia: 'giaChild', ghiChu: 'ghiChuChild' },
  senior: { gia: 'giaSenior', ghiChu: 'ghiChuSenior' },
  infant: { gia: 'giaInfant', ghiChu: 'ghiChuInfant' },
}

// Dòng nhắc thêm vào đầu khối chú thích của prices.yaml. Nhận diện bằng chuỗi `prices:pull`
// nên chạy lại nhiều lần cũng chỉ thêm đúng một lần.
const DAU_HIEU_DONG_NHAC = 'prices:pull'
const DONG_NHAC =
  '# File này nay SINH RA từ Google Sheet tab "gia" bằng `npm --prefix scripts run prices:pull`' +
  ' — sửa tay ở đây sẽ bị ghi đè ở lần chạy sau.'

// ── Đọc tham số dòng lệnh ──

function docThamSo(tho) {
  const ts = { choPhepXoa: false, tuTep: null, giup: false }
  for (let i = 0; i < tho.length; i++) {
    const a = tho[i]
    if (a === '--cho-phep-xoa') { ts.choPhepXoa = true; continue }
    if (a === '--giup' || a === '-h' || a === '--help') { ts.giup = true; continue }
    if (a === '--tu-tep') {
      ts.tuTep = tho[++i]
      if (!ts.tuTep) dungLai('Cờ --tu-tep thiếu đường dẫn tệp CSV đi kèm.')
      continue
    }
    if (a.startsWith('--tu-tep=')) { ts.tuTep = a.slice('--tu-tep='.length); continue }
    dungLai(`Không hiểu tham số "${a}". Chạy với --giup để xem cách dùng.`)
  }
  return ts
}

function dungLai(thongDiep) {
  console.error('')
  console.error(`✖ ${thongDiep}`)
  console.error('')
  console.error('  Không đụng vào data/prices.yaml.')
  console.error('')
  process.exit(1)
}

function inHuongDan() {
  console.log(`
Đồng bộ giá một chiều: Google Sheet tab "gia" → data/prices.yaml

  npm --prefix scripts run prices:pull                     đọc Sheet thật
  npm --prefix scripts run prices:pull -- --cho-phep-xoa   cho phép xoá dòng giá đã biến mất khỏi Sheet
  npm --prefix scripts run prices:pull -- --tu-tep <csv>   đọc một tệp CSV cục bộ, không gọi mạng

Script không bao giờ ghi lên Sheet, và không tự commit. Xem xong diff thì tự commit.
`)
}

// ── Bộ đọc CSV viết tay (RFC 4180) ──
// Phải tự viết vì không được thêm dependency, và phải xử đúng ô trong ngoặc kép: tên tour
// có dấu phẩy ngay bên trong ("Vé Vinwonders tiêu chuẩn + Buffet 350,000 VNĐ").

function docCsv(vanBan) {
  const s = vanBan.charCodeAt(0) === 0xfeff ? vanBan.slice(1) : vanBan  // bỏ BOM
  const hang = []
  let o = []
  let dem = ''
  let trongNgoac = false

  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (trongNgoac) {
      if (c === '"') {
        if (s[i + 1] === '"') { dem += '"'; i++; continue }  // "" là một dấu ngoặc kép thật
        trongNgoac = false
        continue
      }
      dem += c
      continue
    }
    if (c === '"') { trongNgoac = true; continue }
    if (c === ',') { o.push(dem); dem = ''; continue }
    if (c === '\r') continue                                  // CRLF: bỏ \r ngoài ngoặc kép
    if (c === '\n') { o.push(dem); hang.push(o); o = []; dem = ''; continue }
    dem += c
  }
  if (dem !== '' || o.length > 0) { o.push(dem); hang.push(o) }

  // Bỏ các hàng rỗng hoàn toàn ở cuối tệp
  while (hang.length > 0 && hang[hang.length - 1].every((v) => v.trim() === '')) hang.pop()
  return hang
}

// ── Đọc số tiền ──
// Người nhập có thể gõ 800000, 800.000, 800,000 hay 800 000. Chấp cả bốn.
// KHÔNG chấp 800.5 — nhóm ba chữ số là bắt buộc, nếu không thì 800.5 sẽ âm thầm thành 8005.

function docSoTien(tho) {
  const s = String(tho).trim().replace(/[\u00A0\u202F]/g, ' ')
  if (s === '') return { rong: true }
  if (/^\d+$/.test(s)) return { so: Number(s) }
  if (/^\d{1,3}([.,\u0020]\d{3})+$/.test(s)) return { so: Number(s.replace(/[.,\u0020]/g, '')) }
  // Google Sheet đôi khi xuất số thành "800000.0"; phần nguyên >3 chữ số nên không lẫn với
  // cách nhóm nghìn kiểu Việt Nam, đọc an toàn được.
  const m = /^(\d{4,})[.,]0+$/.exec(s)
  if (m) return { so: Number(m[1]) }
  return { loi: `không đọc được "${tho}" thành số tiền. Chấp nhận: 800000, 800.000, 800,000, 800 000` }
}

const dinhDangTien = (n) => n.toLocaleString('vi-VN')

// Nhãn đơn vị đi kèm số tiền khi in cho người đọc — DÙNG CHUNG cho mọi chỗ in giá (khối
// "Thêm giá mới", khối Cổng xoá…), để không lệch nhau về sau. `perGroup` là giá MỘT NHÓM tối
// đa N khách, không phải giá đầu người — in "đ/khách" cho nó là sai NGHĨA VỀ TIỀN, không phải
// lỗi hiển thị: người đọc (chủ dự án) sẽ tưởng giá sai rồi quay lại "sửa" Sheet theo hiểu nhầm.
const nhanDonVi = (entry) =>
  entry.unit === 'perGroup' ? `đ/nhóm (tối đa ${entry.maxPax} khách)` : 'đ/khách'

// ── Lấy CSV: từ mạng hoặc từ tệp ──

async function layCsvTuMang() {
  let phanHoi
  try {
    phanHoi = await fetch(URL_SHEET, { redirect: 'follow' })
  } catch (e) {
    dungLai(
      `Không nối được tới Google Sheet: ${e.message}\n\n` +
      '  Kiểm tra mạng rồi chạy lại. Cần làm việc ngoại tuyến thì dùng:\n' +
      '    npm --prefix scripts run prices:pull -- --tu-tep docs/gia/mau-nhap-gia.csv'
    )
  }

  if (!phanHoi.ok) {
    dungLai(
      `Google trả về mã ${phanHoi.status} khi đọc tab "${TEN_TAB}".\n\n` +
      '  Thường là một trong hai chuyện:\n' +
      '    • Sheet không còn ở chế độ "bất kỳ ai có đường liên kết → người xem".\n' +
      `    • Tab không còn tên là "${TEN_TAB}" (viết thường, không dấu).\n` +
      `\n  Sheet: https://docs.google.com/spreadsheets/d/${MA_SHEET}/edit`
    )
  }

  const kieu = phanHoi.headers.get('content-type') || ''
  const than = await phanHoi.text()

  // Google trả HTML thay vì CSV khi Sheet bị đóng quyền lại — bắt cho rõ, đừng để bộ đọc
  // CSV nuốt cả trang đăng nhập rồi báo một lỗi vô nghĩa ở dưới.
  if (kieu.includes('text/html') || /^\s*</.test(than)) {
    dungLai(
      'Google trả về một trang web chứ không phải dữ liệu CSV.\n\n' +
      '  Gần như chắc chắn là Sheet đã bị đóng quyền đọc. Mở lại:\n' +
      `    https://docs.google.com/spreadsheets/d/${MA_SHEET}/edit\n` +
      '    → Chia sẻ → Bất kỳ ai có đường liên kết → Người xem'
    )
  }
  return than
}

function layCsvTuTep(duongDan) {
  const d = isAbsolute(duongDan) ? duongDan : resolve(GOC_REPO, duongDan)
  if (!existsSync(d)) dungLai(`Không tìm thấy tệp CSV: ${d}`)
  return readFileSync(d, 'utf-8')
}

// ── Gán cột theo tiêu đề đã chuẩn hoá ──

function ganCot(tieuDeTho) {
  const viTri = {}
  const laCotBiet = new Array(tieuDeTho.length).fill(false)
  const canhBao = []

  tieuDeTho.forEach((tho, i) => {
    const ch = chuanHoaTen(tho)
    if (ch === '') return
    for (const [ma, dn] of Object.entries(COT)) {
      if (!dn.biDanh.has(ch)) continue
      laCotBiet[i] = true
      if (viTri[ma] === undefined) viTri[ma] = i
      else canhBao.push(`Cột "${tho}" trùng với cột "${tieuDeTho[viTri[ma]]}" — script dùng cột bên trái, bỏ cột bên phải.`)
      return
    }
  })

  tieuDeTho.forEach((tho, i) => {
    if (tho.trim() !== '' && !laCotBiet[i]) {
      canhBao.push(`Cột "${tho.trim()}" không nằm trong bố cục đã chốt — script bỏ qua, không đưa vào giá.`)
    }
  })

  const thieuBatBuoc = Object.entries(COT).filter(([ma, dn]) => dn.batBuoc && viTri[ma] === undefined)
  if (thieuBatBuoc.length > 0) {
    dungLai(
      `Hàng tiêu đề của Sheet thiếu cột bắt buộc: ${thieuBatBuoc.map(([, dn]) => `"${dn.ten}"`).join(', ')}.\n\n` +
      `  Đang thấy: ${tieuDeTho.map((t) => t.trim()).filter(Boolean).join(' | ') || '(không có tiêu đề nào)'}\n` +
      '  Bố cục chuẩn 13 cột nằm ở docs/gia/README.md.'
    )
  }

  // Thiếu một cột hạng phụ không phải lỗi, nhưng im lặng thì cả hạng đó biến mất khỏi giá.
  for (const [ma, cot] of Object.entries(COT_HANG_PHU)) {
    if (viTri[cot.gia] === undefined) {
      canhBao.push(`Sheet không có cột "${COT[cot.gia].ten}" — hạng ${ma} sẽ không có trong bảng giá.`)
    }
  }

  return { viTri, canhBao }
}

// ── Phân tích bảng thành các dòng giá ──

function phanTich(hang) {
  const loi = []
  const nhacBoQua = []
  const muc = []                  // [{ khoa, entry, soHang, tenTour }] — theo thứ tự hàng Sheet
  const khoaChuaGia = new Map()   // khoa → { soHang, tenTour } cho hàng có khoá mà chưa điền giá
  const donViLa = []              // { soHang, khoa, donVi } — hàng bị BỎ QUA vì đơn vị site chưa hỗ trợ

  const { viTri, canhBao } = ganCot(hang[0])
  const o = (h, ma) => (viTri[ma] !== undefined ? (h[viTri[ma]] ?? '').trim() : '')

  for (let i = 1; i < hang.length; i++) {
    const h = hang[i]
    const soHang = i + 1                                 // hàng 1 là tiêu đề
    const khoa = o(h, 'khoa')
    const tenTour = o(h, 'tenTour')
    const maTour = o(h, 'maTour')
    const giaNguoiLon = o(h, 'giaNguoiLon')

    // `Mã tour` chỉ để người kinh doanh tra cứu, chưa vào yaml — nhưng sai dạng thì phải
    // nói, không nuốt. Cảnh báo thôi, không chặn ghi, vì cột này chưa ảnh hưởng đầu ra.
    if (maTour !== '' && !DANG_MA_TOUR.test(maTour)) {
      canhBao.push(`Hàng ${soHang}: Mã tour "${maTour}" sai dạng — phải bắt đầu bằng TD, chỉ chữ hoa/số/gạch ngang, tối đa 10 ký tự.`)
    }

    if (khoa === '') {
      // Hàng trống trong Sheet — bỏ qua im lặng. Nhưng nếu có giá mà thiếu khoá thì đó là
      // sai sót thật, một dòng giá sắp rơi mất, phải kêu.
      if (giaNguoiLon !== '') {
        loi.push(`Hàng ${soHang}: có giá "${giaNguoiLon}" nhưng cột "Khoá giá" để trống — dòng giá này không gắn được vào tour nào.`)
      }
      continue
    }

    if (!DANG_KHOA.test(khoa)) {
      loi.push(`Hàng ${soHang}: khoá giá "${khoa}" sai dạng — chỉ được chữ thường, số và gạch ngang.`)
      continue
    }

    if (giaNguoiLon === '') {
      // Tour chưa điền giá. Đây là trạng thái bình thường lúc này, không phải lỗi.
      khoaChuaGia.set(khoa, { soHang, tenTour })
      nhacBoQua.push({ khoa, tenTour, soHang })
      continue
    }

    const donVi = o(h, 'donVi')
    const dv = docDonVi(donVi)
    if (!dv) {
      // CẢNH BÁO chứ không chặn: một ô Đơn vị lạ không được kéo 34 dòng vô can cùng chết.
      // `continue` là BẮT BUỘC — mã cũ push vào loi[] mà không continue, hàng lỗi vẫn chạy
      // tiếp xuống dưới và vào `muc`. Bỏ chặn mà quên continue là ghi một dòng đơn vị lạ vào
      // prices.yaml NHƯ THỂ nó là perPax.
      canhBao.push(`Hàng ${soHang} (${khoa}): Đơn vị = "${donVi}" chưa được hỗ trợ — BỎ QUA, dòng này KHÔNG vào prices.yaml.`)
      donViLa.push({ soHang, khoa, donVi })
      continue
    }

    const dg = docSoTien(giaNguoiLon)
    let soTien = null
    if (dg.loi) {
      loi.push(`Hàng ${soHang} (${khoa}): cột "Giá người lớn" ${dg.loi}.`)
    } else if (!Number.isSafeInteger(dg.so) || dg.so <= 0) {
      // PY7: amount của perPax phải là số nguyên DƯƠNG (`<= 0` là lỗi) — hạng phụ mới được bằng 0.
      // isSafeInteger chứ không phải isInteger: `Number.isInteger(1e21)` là TRUE, và 1e21 ghi
      // xuống yaml thành `amount: 1e+21` trong một file có dòng đầu ghi "VND, số nguyên".
      loi.push(`Hàng ${soHang} (${khoa}): Giá người lớn = "${giaNguoiLon}" — phải là số nguyên lớn hơn 0.`)
    } else if (dg.so > TRAN_GIA) {
      loi.push(`Hàng ${soHang} (${khoa}): Giá người lớn = ${dinhDangTien(dg.so)} đ, vượt trần ${dinhDangTien(TRAN_GIA)} đ một khách — kiểm lại ô, nhiều khả năng thừa số 0.`)
    } else {
      soTien = dg.so
    }

    const paxRates = {}
    for (const ma of HANG_PHU) {
      const cot = COT_HANG_PHU[ma]
      const tenCotGia = COT[cot.gia].ten
      const tenCotGhiChu = COT[cot.ghiChu].ten
      const giaTho = o(h, cot.gia)
      const ghiChu = o(h, cot.ghiChu)

      if (giaTho === '') {
        if (ghiChu !== '') {
          loi.push(`Hàng ${soHang} (${khoa}): "${tenCotGhiChu}" có ghi chú "${ghiChu}" nhưng "${tenCotGia}" để trống — điền giá hoặc xoá ghi chú.`)
        }
        continue
      }

      const dp = docSoTien(giaTho)
      if (dp.loi) {
        loi.push(`Hàng ${soHang} (${khoa}): cột "${tenCotGia}" ${dp.loi}.`)
        continue
      }
      // PY7: amount của hạng phụ phải là số nguyên ≥ 0 — khác giá người lớn, hạng phụ ĐƯỢC bằng 0.
      if (!Number.isSafeInteger(dp.so) || dp.so < 0) {
        loi.push(`Hàng ${soHang} (${khoa}): "${tenCotGia}" = "${giaTho}" — phải là số nguyên từ 0 trở lên.`)
        continue
      }
      if (dp.so > TRAN_GIA) {
        loi.push(`Hàng ${soHang} (${khoa}): "${tenCotGia}" = ${dinhDangTien(dp.so)} đ, vượt trần ${dinhDangTien(TRAN_GIA)} đ một khách — kiểm lại ô, nhiều khả năng thừa số 0.`)
        continue
      }
      if (ghiChu.length > GHI_CHU_TOI_DA) {
        loi.push(`Hàng ${soHang} (${khoa}): "${tenCotGhiChu}" dài ${ghiChu.length} ký tự, tối đa ${GHI_CHU_TOI_DA}.`)
        continue
      }

      const r = { amount: dp.so }
      if (ghiChu !== '') r.note = ghiChu        // ghi chú rỗng thì bỏ hẳn, đừng ghi note: ""
      paxRates[ma] = r
    }

    // perGroup là giá cả nhóm — không có khái niệm "hạng khách" bên trong một nhóm.
    if (dv.unit === 'perGroup' && Object.keys(paxRates).length > 0) {
      loi.push(`Hàng ${soHang} (${khoa}): đơn vị nhóm không nhận giá theo hạng khách — xoá các cột giá trẻ em / người cao tuổi / em bé.`)
      continue
    }

    if (soTien === null) continue               // đã có lỗi ở dòng này, không dựng entry

    const entry = dv.unit === 'perGroup'
      ? { unit: 'perGroup', amount: soTien, maxPax: dv.maxPax }
      : { unit: DON_VI_BAT_BUOC, amount: soTien }
    if (KHOA_YAML_CHO_MA_TOUR && maTour !== '') entry[KHOA_YAML_CHO_MA_TOUR] = maTour
    if (Object.keys(paxRates).length > 0) entry.paxRates = paxRates   // cả ba hạng trống → bỏ hẳn khoá
    muc.push({ khoa, entry, soHang, tenTour, maTour })
  }

  // Trùng khoá trong Sheet: hai hàng cùng một khoá thì hàng sau đè hàng trước, im lặng là nguy hiểm.
  const daGap = new Map()
  for (const m of muc) {
    if (daGap.has(m.khoa)) {
      loi.push(`Hàng ${m.soHang}: khoá giá "${m.khoa}" đã xuất hiện ở hàng ${daGap.get(m.khoa)} — mỗi khoá chỉ được một dòng.`)
    } else {
      daGap.set(m.khoa, m.soHang)
    }
  }

  return { muc, khoaChuaGia, nhacBoQua, loi, canhBao, donViLa, soHangDuLieu: hang.length - 1 }
}

// ── Dựng văn bản yaml ──

/**
 * Tách file cũ thành khối chú thích đầu file + từng khối khoá, GIỮ NGUYÊN VĂN từng dòng.
 *
 * Đọc thứ tự khoá từ văn bản chứ không từ `Object.keys` của bản yaml đã parse: `Object.keys`
 * nhấc khoá toàn chữ số lên đầu theo thứ tự số học, nên một dòng giá đặt khoá là "2026" sẽ âm
 * thầm nhảy lên đầu file và làm thủng đúng lời hứa "giữ nguyên thứ tự cũ".
 *
 * Giữ nguyên văn cũng là cách duy nhất chép lại đúng byte những khối mà bộ sinh ở dưới không
 * biết dựng — perRoomNight, perTicket, tiers[].
 */
function tachKhoiCu(vanBanCu) {
  const dong = vanBanCu.split('\n')
  let i = 0
  const chuThich = []
  while (i < dong.length && dong[i].startsWith('#')) chuThich.push(dong[i++])

  const khoi = []
  let hienTai = null
  for (; i < dong.length; i++) {
    const d = dong[i]
    const m = /^([^\s#][^:]*):\s*$/.exec(d)      // khoá cấp cao nhất: nằm ở cột 0, không có giá trị cùng dòng
    if (m) {
      hienTai = { khoa: m[1], dong: [d] }
      khoi.push(hienTai)
      continue
    }
    if (hienTai) hienTai.dong.push(d)
  }
  for (const k of khoi) {
    while (k.dong.length > 0 && k.dong[k.dong.length - 1].trim() === '') k.dong.pop()
  }
  return { chuThich, khoi }
}

/**
 * Thứ tự khoá: giữ nguyên thứ tự đang có trong prices.yaml cho những khoá còn sống, khoá
 * mới nối vào cuối theo thứ tự hàng trong Sheet.
 *
 * Vì sao không đơn giản lấy thứ tự Sheet: thứ tự hàng trong Sheet là chuyện trình bày của
 * người kinh doanh — họ sẽ sắp lại theo nhóm sản phẩm bất cứ lúc nào. Nếu yaml đi theo thì
 * mỗi lần sắp lại Sheet sẽ đẻ ra một diff to đùng không có thay đổi giá nào bên trong, và
 * `git diff data/prices.yaml` — bước duyệt duy nhất trước khi commit — mất tác dụng.
 * Thứ tự khoá trong yaml không mang nghĩa gì với bản dựng, nên giữ nó ổn định là đúng.
 *
 * Vẫn tất định: cùng một cặp (yaml cũ, Sheet) luôn ra cùng một thứ tự.
 */
function xepKhoiRa(khoiCu, giuNguyen, muc) {
  const conLai = new Map(muc.map((m) => [m.khoa, m]))
  const ra = []
  for (const k of khoiCu) {
    if (giuNguyen.has(k.khoa)) {           // ngoài tầm của Sheet — chép nguyên văn, đúng chỗ cũ
      ra.push({ khoa: k.khoa, dong: k.dong, nguyenVan: true })
      conLai.delete(k.khoa)
      continue
    }
    const m = conLai.get(k.khoa)
    if (m) { ra.push({ khoa: m.khoa, dong: dungKhoi(m.khoa, m.entry) }); conLai.delete(k.khoa) }
    // khoá cũ không còn trong Sheet và không thuộc diện giữ nguyên: cổng xoá ở trên đã xử
  }
  for (const m of muc) {                   // khoá mới, nối vào cuối theo thứ tự hàng Sheet
    if (conLai.has(m.khoa)) { ra.push({ khoa: m.khoa, dong: dungKhoi(m.khoa, m.entry) }); conLai.delete(m.khoa) }
  }
  return ra
}

function dungKhoi(khoa, entry) {
  const dong = [`${khoa}:`, `  unit: ${entry.unit}`, `  amount: ${entry.amount}`]
  // Thứ tự khoá CỐ ĐỊNH — hàm này phải tất định, cùng đầu vào ra cùng byte, kẻo mỗi lần
  // pull đẻ một diff giả và `git diff data/prices.yaml` mất tác dụng làm bước duyệt.
  if (entry.unit === 'perGroup') dong.push(`  maxPax: ${entry.maxPax}`)
  if (KHOA_YAML_CHO_MA_TOUR && entry[KHOA_YAML_CHO_MA_TOUR] !== undefined) {
    dong.push(`  ${KHOA_YAML_CHO_MA_TOUR}: ${JSON.stringify(entry[KHOA_YAML_CHO_MA_TOUR])}`)
  }
  if (entry.paxRates) {
    dong.push('  paxRates:')
    for (const ma of HANG_PHU) {                    // thứ tự cố định → kết quả bất biến
      const r = entry.paxRates[ma]
      if (!r) continue
      const phan = [`amount: ${r.amount}`]
      if (r.note !== undefined) phan.push(`note: ${JSON.stringify(r.note)}`)
      dong.push(`    ${ma}: { ${phan.join(', ')} }`)
    }
  }
  return dong
}

function dungVanBanYaml(khoiChuThich, khoiRa) {
  const dong = [...khoiChuThich]
  for (const k of khoiRa) {
    dong.push('')
    dong.push(...k.dong)
  }
  return dong.join('\n') + '\n'
}

// ── Tra tên tour cho một khoá, chỉ để in cho người đọc ──

function traTenTour(khoaCanTra, muc, khoaChuaGia) {
  const tuSheet = muc.find((m) => m.khoa === khoaCanTra)?.tenTour || khoaChuaGia.get(khoaCanTra)?.tenTour
  if (tuSheet) return { ten: tuSheet, nguon: 'Sheet' }
  if (!existsSync(DUONG_HAT_GIONG)) return null
  try {
    const hang = docCsv(readFileSync(DUONG_HAT_GIONG, 'utf-8'))
    const ch = hang[0].map(chuanHoaTen)
    const iKhoa = ch.findIndex((t) => COT.khoa.biDanh.has(t))
    const iTen = ch.findIndex((t) => COT.tenTour.biDanh.has(t))
    if (iKhoa < 0 || iTen < 0) return null
    for (let i = 1; i < hang.length; i++) {
      if ((hang[i][iKhoa] ?? '').trim() === khoaCanTra) {
        const ten = (hang[i][iTen] ?? '').trim()
        if (ten) return { ten, nguon: 'hạt giống, có thể đã cũ' }
      }
    }
  } catch { /* tra tên chỉ để cho đẹp, hỏng thì thôi */ }
  return null
}

// ── Chạy ──

async function chay() {
  // Dời từ tầng module xuống đây (Bẫy 1, 2026-09-04): tầng module chạy cả lúc `import` từ
  // test, và một máy không có `.env` (CI, clone mới) import tệp này chỉ để lấy `docDonVi`
  // không được phép chết ở đây. Đặt TRƯỚC mọi nhánh khác — `MA_SHEET` còn được nội suy vào
  // thông báo lỗi ở dưới (Cổng "hang.length === 0"), đặt sau sẽ in ra `undefined` trong đó.
  if (!MA_SHEET) {
    console.error('Thiếu PRICES_SHEET_ID. Đặt vào .env ở gốc repo:')
    console.error('  PRICES_SHEET_ID=<mã sheet giá>')
    console.error('Mã lấy ở URL của Sheet: docs.google.com/spreadsheets/d/<mã>/edit')
    process.exit(1)
  }

  const ts = docThamSo(process.argv.slice(2))
  if (ts.giup) { inHuongDan(); return }

  if (!existsSync(DUONG_YAML)) {
    dungLai(
      `Không tìm thấy ${DUONG_YAML}.\n\n` +
      '  File này là nguồn sự thật về giá, và khối chú thích đầu file phải được giữ lại.\n' +
      '  Khôi phục nó từ lịch sử git rồi chạy lại — script cố tình không tự dựng file mới.'
    )
  }

  const vanBanCu = readFileSync(DUONG_YAML, 'utf-8')
  let giaCu
  try {
    // Đối tượng không prototype: khoá kiểu "constructor" trong yaml không lẫn với Object.prototype.
    giaCu = Object.assign(Object.create(null), docYaml(vanBanCu) ?? {})
  } catch (e) {
    dungLai(`data/prices.yaml hiện đang không đọc được: ${e.message}`)
  }

  const { chuThich: khoiChuThich, khoi: khoiCu } = tachKhoiCu(vanBanCu)
  if (khoiChuThich.length === 0) {
    dungLai(
      'data/prices.yaml không còn khối chú thích ở đầu file.\n\n' +
      '  Khối đó ghi bài học DR-097 (khoá là định danh ổn định, đừng đổi theo slug) và phải\n' +
      '  sống sót qua mọi lần sinh lại. Khôi phục file từ lịch sử git rồi chạy lại.'
    )
  }

  // Dòng giá không phải thứ Sheet SINH RA ĐƯỢC (`DON_VI_TU_SHEET`) nằm NGOÀI TẦM của bảng 13
  // cột — không có cột nào chở được `tiers[]`, `tickets[]` hay `asOf`. Chúng không phải "bị
  // xoá khỏi Sheet", chúng chưa bao giờ ở trong Sheet. Chép nguyên văn, đúng chỗ cũ, và nói rõ ra.
  //
  // ĐỌC KỸ: định nghĩa cũ là `unit !== 'perPax'`, và nó SAI kể từ khi có perGroup.
  // perGroup sinh ra TỪ Sheet; xếp nó vào "ngoài tầm" là chép nguyên văn nó mãi mãi —
  // chủ dự án sửa giá Phao chuối trong Sheet, chạy pull, KHÔNG CÓ GÌ XẢY RA và KHÔNG AI BÁO.
  // Lỗi này nổ SAU khi đợt này nghiệm thu xong, nên không cổng nào của đợt bắt được.
  const giuNguyen = new Set(
    khoiCu.map((k) => k.khoa).filter((k) => {
      const e = giaCu[k]
      if (!e) return false
      if (!DON_VI_TU_SHEET.has(e.unit)) return true   // Sheet không sinh ra được → giữ nguyên
      return e.unit === 'perPax' && Array.isArray(e.tiers) && e.tiers.length > 0
    })
  )

  console.log('')
  if (ts.tuTep) console.log(`Đọc bảng giá từ tệp: ${ts.tuTep}`)
  else console.log(`Đọc bảng giá từ Google Sheet, tab "${TEN_TAB}".`)

  const csv = ts.tuTep ? layCsvTuTep(ts.tuTep) : await layCsvTuMang()
  const hang = docCsv(csv)

  if (hang.length === 0) {
    dungLai(
      `Tab "${TEN_TAB}" không trả về dòng nào — Sheet đang rỗng, hoặc không có tab nào tên "${TEN_TAB}".\n\n` +
      '  Google trả cùng một kết quả cho cả hai trường hợp nên không phân biệt được. Cách sửa:\n' +
      `    1. Mở https://docs.google.com/spreadsheets/d/${MA_SHEET}/edit\n` +
      `    2. Kiểm tab có đúng tên "${TEN_TAB}" không (viết thường, không dấu).\n` +
      '    3. Nếu Sheet còn trống: Tệp → Nhập → Tải lên → docs/gia/mau-nhap-gia.csv\n' +
      '       → Thay thế trang tính hiện tại.\n' +
      '    4. Kiểm hàng 1 có đủ 13 tên cột theo docs/gia/README.md.'
    )
  }
  if (hang.length === 1) {
    dungLai(
      `Tab "${TEN_TAB}" chỉ có hàng tiêu đề, chưa có dòng giá nào.\n\n` +
      '  Điền giá vào Sheet rồi chạy lại. Ghi đè prices.yaml bằng một bảng rỗng sẽ xoá sạch\n' +
      '  giá đang chạy, nên script dừng ở đây.'
    )
  }

  const kq = phanTich(hang)

  if (kq.canhBao.length > 0) {
    console.log('')
    for (const c of kq.canhBao) console.log(`  ⚠ ${c}`)
  }

  // ── Cổng 1: dòng sai thì không ghi gì cả ──
  if (kq.loi.length > 0) {
    console.error('')
    console.error(`✖ ${kq.loi.length} chỗ cần sửa trong Sheet. Không ghi gì vào data/prices.yaml.`)
    console.error('')
    for (const l of kq.loi) console.error(`  • ${l}`)
    console.error('')
    console.error('  Sửa đúng những hàng trên trong Sheet rồi chạy lại.')
    console.error('')
    process.exit(1)
  }

  // ── So với yaml hiện có ──
  const tapMoi = new Set(kq.muc.map((m) => m.khoa))
  const khoaCu = khoiCu.map((k) => k.khoa)          // thứ tự THEO VĂN BẢN, không theo Object.keys

  // Sheet có giá cho một khoá mà yaml đang khai kiểu giá khác: Sheet không đổi được kiểu giá,
  // và im lặng để perPax đè lên một bảng tickets[] là mất dữ liệu. Dừng, bảo người quyết.
  const xungDotKieu = kq.muc.filter((m) => giuNguyen.has(m.khoa))
  if (xungDotKieu.length > 0) {
    console.error('')
    console.error(`✖ ${xungDotKieu.length} khoá có giá trong Sheet nhưng trong prices.yaml lại là kiểu giá khác:`)
    console.error('')
    for (const m of xungDotKieu) {
      console.error(`  • hàng ${m.soHang} (${m.khoa}): yaml đang là ${giaCu[m.khoa].unit}, Sheet chỉ chở được ${DON_VI_BAT_BUOC}`)
    }
    console.error('')
    console.error('  Bảng 13 cột không đổi được kiểu giá. Hoặc xoá dòng đó khỏi Sheet để giữ nguyên')
    console.error('  khối trong yaml, hoặc sửa tay khối trong yaml trước rồi mới đưa vào Sheet.')
    console.error('')
    process.exit(1)
  }

  const themMoi = kq.muc.filter((m) => !(m.khoa in giaCu)).map((m) => m.khoa)
  const seXoa = khoaCu.filter((k) => !tapMoi.has(k) && !giuNguyen.has(k))
  const doiGia = []
  for (const m of kq.muc) {
    const cu = giaCu[m.khoa]
    if (!cu) continue
    if (dungKhoi(m.khoa, cu).join('\n') !== dungKhoi(m.khoa, m.entry).join('\n')) {
      doiGia.push({ khoa: m.khoa, tenTour: m.tenTour, cu, moi: m.entry })
    }
  }

  // ── Tóm tắt cho người đọc ──
  console.log('')
  console.log(`Đọc được ${kq.soHangDuLieu} hàng. ${kq.muc.length} tour có giá, ${kq.nhacBoQua.length} tour chưa điền giá.`)

  if (kq.nhacBoQua.length > 0) {
    console.log('')
    console.log(`Bỏ qua vì chưa điền giá người lớn (${kq.nhacBoQua.length} tour, đây không phải lỗi):`)
    for (const b of kq.nhacBoQua) {
      console.log(`  – hàng ${b.soHang}: ${b.khoa}${b.tenTour ? ` — ${b.tenTour}` : ''}`)
    }
  }

  // Đơn vị Sheet ghi nhưng site chưa hỗ trợ (docDonVi trả null): hàng KHÔNG vào prices.yaml.
  // Lặp lại ở đây, trong khối tổng kết cuối — người chạy đọc phần cuối, không đọc dòng ⚠ lẫn
  // ở giữa stdout. Với khoá MỚI (chưa từng có trong yaml), đây là lý do duy nhất tour đó
  // không có form đặt: entity trỏ vào khoá không tồn tại → resolvePrice trả null.
  if (kq.donViLa.length > 0) {
    console.log('')
    console.log(`⚠ Đơn vị chưa được hỗ trợ, BỎ QUA — KHÔNG vào prices.yaml (${kq.donViLa.length}):`)
    for (const d of kq.donViLa) {
      console.log(`  ⚠ hàng ${d.soHang} (${d.khoa}): Đơn vị = "${d.donVi}"`)
    }
  }

  if (themMoi.length > 0) {
    console.log('')
    console.log(`Thêm giá mới (${themMoi.length}):`)
    for (const k of themMoi) {
      const m = kq.muc.find((x) => x.khoa === k)
      console.log(`  + ${k}${m.tenTour ? ` — ${m.tenTour}` : ''}: ${dinhDangTien(m.entry.amount)} ${nhanDonVi(m.entry)}`)
    }
  }

  if (doiGia.length > 0) {
    console.log('')
    console.log(`Đổi giá (${doiGia.length}):`)
    for (const d of doiGia) {
      console.log(`  ~ ${d.khoa}${d.tenTour ? ` — ${d.tenTour}` : ''}`)
      if (d.cu.amount !== d.moi.amount) {
        console.log(`      người lớn: ${dinhDangTien(d.cu.amount)} → ${dinhDangTien(d.moi.amount)} đ`)
      }
      // perGroup đổi maxPax mà amount giữ nguyên vẫn phải có dòng riêng — khoá vẫn vào "Đổi
      // giá" (dungKhoi() khác byte) nhưng không nói đổi CÁI GÌ nếu bỏ nhánh này.
      if (d.cu.unit === 'perGroup' && d.moi.unit === 'perGroup' && d.cu.maxPax !== d.moi.maxPax) {
        console.log(`      tối đa khách/nhóm: ${d.cu.maxPax} → ${d.moi.maxPax}`)
      }
      for (const ma of HANG_PHU) {
        const a = d.cu.paxRates?.[ma]
        const b = d.moi.paxRates?.[ma]
        if (!a && !b) continue
        if (a && !b) { console.log(`      ${ma}: bỏ hạng này (đang là ${dinhDangTien(a.amount)} đ)`); continue }
        if (!a && b) { console.log(`      ${ma}: thêm mới ${dinhDangTien(b.amount)} đ`); continue }
        if (a.amount !== b.amount) console.log(`      ${ma}: ${dinhDangTien(a.amount)} → ${dinhDangTien(b.amount)} đ`)
        if ((a.note ?? '') !== (b.note ?? '')) console.log(`      ${ma} ghi chú: "${a.note ?? ''}" → "${b.note ?? ''}"`)
      }
    }
  }

  // ── Cổng 2: xoá phải ồn ào (QĐ-2026-08-26-02 chốt 5) ──
  if (seXoa.length > 0) {
    const hienChoPhep = ts.choPhepXoa
    const dong = (t) => (hienChoPhep ? console.log(t) : console.error(t))
    dong('')
    dong(`${hienChoPhep ? '⚠' : '✖'} ${seXoa.length} dòng giá có trong prices.yaml nhưng KHÔNG có trong Sheet:`)
    dong('')
    for (const k of seXoa) {
      const tra = traTenTour(k, kq.muc, kq.khoaChuaGia)
      dong(`  − ${k}${tra ? ` — ${tra.ten} (${tra.nguon})` : ' — không tra được tên tour'}`)
      const cu = giaCu[k]
      // Dùng DON_VI_TU_SHEET (Sheet SINH RA ĐƯỢC gì), không phải "unit !== perPax" — perGroup
      // giờ Sheet sinh ra được, nên một khoá perGroup bị xoá KHÔNG PHẢI vì "Sheet không biểu
      // diễn được kiểu giá này" (sai — dẫn người đọc bấm --cho-phep-xoa vì lý do sai), mà đơn
      // giản là khoá đó vắng mặt khỏi Sheet, giống hệt một khoá perPax bị xoá.
      if (cu?.unit && !DON_VI_TU_SHEET.has(cu.unit)) {
        dong(`      dòng này là ${cu.unit}, bảng Sheet không biểu diễn được kiểu giá này`)
      } else if (typeof cu?.amount === 'number') {
        dong(`      đang là ${dinhDangTien(cu.amount)} ${nhanDonVi(cu)}`)
      }
      if (kq.khoaChuaGia.has(k)) {
        dong(`      hàng ${kq.khoaChuaGia.get(k).soHang} trong Sheet có khoá này nhưng cột "Giá người lớn" để trống`)
      }
    }

    if (!hienChoPhep) {
      console.error('')
      console.error('  Xoá một dòng giá đang được trỏ tới là làm tour đó mất form đặt, nên script dừng ở đây')
      console.error('  và KHÔNG ghi gì vào data/prices.yaml.')
      console.error('')
      console.error('  Nếu chỉ là quên điền: điền lại giá trong Sheet rồi chạy lại.')
      console.error('  Nếu thật sự muốn bỏ những dòng trên:')
      console.error('    npm --prefix scripts run prices:pull -- --cho-phep-xoa')
      console.error('')
      process.exit(1)
    }
    console.log('')
    console.log('  Có cờ --cho-phep-xoa nên vẫn ghi. Kiểm kỹ diff trước khi commit.')
  }

  // ── Ghi ──
  if (!khoiChuThich.some((d) => d.includes(DAU_HIEU_DONG_NHAC))) khoiChuThich.unshift(DONG_NHAC)

  const khoiRa = xepKhoiRa(khoiCu, giuNguyen, kq.muc)
  const vanBanMoi = dungVanBanYaml(khoiChuThich, khoiRa)

  // ── Cổng 3: chạy CHÍNH validator của repo trên nội dung sắp ghi ──
  // QĐ-2026-08-26-02 chốt 2 khai luồng có bước "chạy validator". In một dòng nhắc người ta tự
  // chạy KHÔNG phải là thi hành bước đó. PY1/PY2/PY7 chỉ cần Map<khoá, PriceEntry>, không cần
  // tài liệu Sanity, nên chạy được ngay tại đây — trước khi chạm vào file.
  let ganGhi
  try {
    ganGhi = new Map(Object.entries(docYaml(vanBanMoi) ?? {}))
  } catch (e) {
    dungLai(`Nội dung vừa dựng không phải yaml hợp lệ: ${e.message}. Đây là lỗi của script, không phải của Sheet.`)
  }
  const loiCong = []
  for (const [ten, ham] of [['PY1', validatePY1], ['PY2', validatePY2], ['PY7', validatePY7]]) {
    const r = ham(ganGhi)
    if (!r.passed) for (const l of r.errors) loiCong.push(`${ten} — ${l}`)
  }
  if (loiCong.length > 0) {
    console.error('')
    console.error(`✖ Bộ kiểm giá của repo bác nội dung vừa dựng (${loiCong.length} lỗi). Không ghi gì.`)
    console.error('')
    for (const l of loiCong) console.error(`  • ${l}`)
    console.error('')
    console.error('  Nếu lỗi trỏ vào một dòng bạn vừa sửa trong Sheet thì sửa ở Sheet rồi chạy lại.')
    console.error('  Nếu không, đây là lỗi của script — luật kiểm trước khi ghi đã lệch khỏi cổng.')
    console.error('')
    process.exit(1)
  }

  if (vanBanMoi === vanBanCu) {
    console.log('')
    console.log('data/prices.yaml đã khớp với Sheet. Không có gì để ghi.')
    console.log('')
    return
  }

  // Ghi tệp tạm rồi đổi tên: `writeFileSync` cắt cụt file trước rồi mới ghi, chết đúng khe đó
  // là để lại nguồn sự thật về giá RỖNG. `renameSync` trong cùng thư mục là thao tác nguyên tử.
  const duongTam = `${DUONG_YAML}.tmp-${process.pid}`
  try {
    writeFileSync(duongTam, vanBanMoi, 'utf-8')
    renameSync(duongTam, DUONG_YAML)
  } catch (e) {
    try { if (existsSync(duongTam)) unlinkSync(duongTam) } catch { /* dọn được thì dọn */ }
    dungLai(`Không ghi được data/prices.yaml: ${e.message}`)
  }

  const soGiuNguyen = khoiRa.filter((k) => k.nguyenVan).length
  console.log('')
  console.log(`Đã ghi ${kq.muc.length} dòng giá vào data/prices.yaml. Bộ kiểm PY1/PY2/PY7 xanh.`)
  if (soGiuNguyen > 0) {
    console.log(`Giữ nguyên văn ${soGiuNguyen} khối không phải ${DON_VI_BAT_BUOC} — Sheet không chở được kiểu giá đó:`)
    for (const k of khoiRa.filter((x) => x.nguyenVan)) {
      console.log(`  = ${k.khoa} (${giaCu[k.khoa].unit})`)
    }
  }
  console.log('')
  console.log('Còn hai việc, script cố tình không tự làm:')
  console.log('  1. Xem thay đổi:   git diff data/prices.yaml')
  console.log('  2. Chạy đủ bộ kiểm: npm --prefix scripts run validate')
  console.log('')
  console.log('Ưng thì commit. Dựng lại site thì giá mới lên trang.')
  console.log('')
}

// Chỉ chạy đường CLI khi tệp này được gọi thẳng (`node`/`tsx prices-pull.mjs ...`, hoặc
// `npm run prices:pull`). `import` từ một tệp test thì chỉ nạp hàm (`docDonVi`,
// `DON_VI_TU_SHEET`) — không gọi Sheet, không đụng data/prices.yaml.
if (LA_CLI) {
  chay().catch((e) => {
    console.error('')
    console.error(`✖ Lỗi ngoài dự tính: ${e?.stack || e?.message || e}`)
    console.error('')
    console.error('  data/prices.yaml không bị đụng tới.')
    console.error('')
    process.exit(1)
  })
}
