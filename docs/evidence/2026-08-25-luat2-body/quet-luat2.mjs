// Quét Luật 2 — "cấu trúc giữ khung, bài viết giữ chiều sâu".
//
// `06` §6 Luật 2: field cấu trúc (openingHours, itinerary, includes, accessInfo…)
// là câu trả lời ngắn ở vùng cố định; `body` KHÔNG mở mục cùng vai.
//
// Cách đo: với mỗi trang chi tiết đã dựng, lấy nhãn của các ô Thông tin nhanh
// (vùng cố định), rồi tìm chính nhãn đó xuất hiện lại trong `.body-block`.
// Chỉ tính khi nhãn đứng đầu một câu/dòng hoặc trong thẻ tiêu đề — tức biên tập
// đang MỞ MỤC cùng vai, không phải nhắc thoáng qua giữa câu.
//
// Chạy: node docs/evidence/2026-08-25-luat2-body/quet-luat2.mjs
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const GOC = 'dist'
const NHANH = ['tour', 'diem-tham-quan', 'dia-danh', 'trai-nghiem', 'khach-san', 'resort', 'cam-nang']

const boThe = (h) => h.replace(/<[^>]+>/g, ' ')
const goHtml = (t) => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
const gon = (t) => goHtml(boThe(t)).replace(/[^\S¶]+/g, ' ').replace(/\s*¶\s*/g, ' ¶ ').trim()

function catKhoi(html, moc) {
  const i = html.indexOf(moc)
  if (i < 0) return ''
  // cắt thô: từ mốc tới 40k ký tự — chấp nhận được cho fact-strip, vì ta chỉ
  // đọc nhãn `fact-label` và vùng đó ngắn.
  return html.slice(i, i + 40000)
}

/**
 * Cắt ĐÚNG phần tử `.body-block` bằng cách đếm độ sâu <div>.
 *
 * Bản đầu của script này cắt thân bài bằng một cửa sổ 60.000 ký tự và vì thế
 * đếm lẫn cả FAQ lẫn chân trang — ra 13 ca, trong đó **1 ca giả**
 * (`dia-danh/cang-du-lich-nha-trang`, nhãn "Địa chỉ" nằm trong `faq-answer` ở
 * byte 35370 trong khi `.body-block` bắt đầu ở 20515). Đúng lỗi "cửa sổ ký tự
 * không phải phạm vi phần tử" mà QĐ-2026-08-25-03 đã ghi ở một chỗ khác.
 */
function catBody(html) {
  const m = /<div class="body-block[^"]*"[^>]*>/.exec(html)
  if (!m) return ''
  const i = m.index + m[0].length
  let depth = 1
  for (const t of html.slice(i).matchAll(/<(\/?)div\b[^>]*>/g)) {
    depth += t[1] ? -1 : 1
    if (depth === 0) return html.slice(i, i + t.index)
  }
  return html.slice(i)
}

const ket = []
for (const nhanh of NHANH) {
  const thuMuc = join(GOC, nhanh)
  if (!existsSync(thuMuc)) continue
  for (const slug of readdirSync(thuMuc)) {
    const f = join(thuMuc, slug, 'index.html')
    if (!existsSync(f) || !statSync(join(thuMuc, slug)).isDirectory()) continue
    const html = readFileSync(f, 'utf8')

    // nhãn các ô Thông tin nhanh
    const vungFact = catKhoi(html, 'data-region="fact-strip"')
    const nhan = [...vungFact.matchAll(/class="fact-label"[^>]*>([\s\S]*?)<\/dt>/g)]
      .map(m => gon(m[1]).replace(/^[^\p{L}]+/u, '').trim())
      .filter(Boolean)
    if (!nhan.length) continue

    // thân bài — cắt đúng phần tử, không dùng cửa sổ ký tự
    const raw = catBody(html)
    if (!raw) continue
    // Chèn '¶' ở ranh giới thẻ TRƯỚC khi làm phẳng. Không có nó thì gon() gộp
    // mọi khoảng trắng về một và ranh giới tiêu đề biến mất — bản quét đầu bỏ
    // sót đúng vì vậy (vd `chua-long-son`, nơi "Giờ mở cửa:" mở đầu một khối
    // chứ không đứng sau dấu chấm).
    const than = gon(raw.replace(/<\/(p|h[1-6]|li|div|td|dd|dt)>/gi, ' ¶ '))

    for (const n of nhan) {
      // Mở mục cùng vai = nhãn đứng ngay trước dấu hai chấm, VÀ không nằm giữa
      // câu. "Không giữa câu" nhận diện bằng: đầu chuỗi, sau dấu kết câu, hoặc
      // sau ranh giới thẻ (sau khi bỏ thẻ, ranh giới thành ≥2 khoảng trắng —
      // đây là chỗ bản quét đầu bỏ sót, vì tiêu đề h2/h3 không kết bằng dấu chấm).
      // Cho phép nhãn nằm trong CỤM GHÉP: "Giá vé & Giờ mở cửa:" là một tiêu đề
      // mở mục cho hai field cấu trúc cùng lúc — vẫn là Luật 2. Không có nhánh
      // '&|và|/' thì ca `chua-long-son` lọt lưới.
      const re = new RegExp('(^|[.!?»)\\]¶]\\s*|[&/]\\s*|\\bvà\\s+)' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[::]', 'u')
      if (re.test(than)) {
        const i = than.search(re)
        ket.push({ trang: `${nhanh}/${slug}`, nhan: n, trich: than.slice(Math.max(0, i), i + 110).trim() })
      }
    }
  }
}

console.log(`Quét ${NHANH.length} nhánh trong dist/ — tìm field cấu trúc bị mở lại thành mục trong thân bài.\n`)
if (!ket.length) { console.log('Không có ca nào.'); process.exit(0) }

const theoNhan = {}
for (const k of ket) (theoNhan[k.nhan] ??= []).push(k)
console.log(`${ket.length} ca, trên ${new Set(ket.map(k => k.trang)).size} trang:\n`)
for (const [n, ds] of Object.entries(theoNhan).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`── "${n}" — ${ds.length} trang`)
  for (const d of ds.slice(0, 4)) console.log(`     ${d.trang}\n       ${d.trich}`)
  if (ds.length > 4) console.log(`     … và ${ds.length - 4} trang nữa`)
  console.log()
}
