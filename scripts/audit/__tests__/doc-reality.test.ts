import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  timChuoiCam,
  trichLuatChuyenHuong,
  kiemChuyenHuong,
  kiemQuyetDinhDaDong,
  kiemTanDuMa,
  kiemTanDuTaiLieu,
  kiemTanDuTaiLieuVoiDanhSachNen,
  DANH_SACH_NEN_DOC2_DOCS,
} from '../doc-reality'
import { REPO_ROOT } from '../lib/evidence'

test('timChuoiCam bắt được chuỗi và nói rõ file nào dòng nào', () => {
  const files = [{ path: 'README.md', content: 'dòng 1\nDeploy qua Cloudflare Pages\ndòng 3' }]
  const luat = [{ chuoi: 'Cloudflare Pages', lyDo: 'đường thật là Workers Builds', drift: 'DR-040' }]
  const c = timChuoiCam(files, luat)[0]
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /README\.md:2/)
  assert.deepEqual(c.drift, ['DR-040'])
})

test('timChuoiCam đạt khi không có chuỗi cấm', () => {
  const files = [{ path: 'README.md', content: 'Deploy qua Workers Builds' }]
  const luat = [{ chuoi: 'Cloudflare Pages', lyDo: 'x', drift: 'DR-040' }]
  assert.equal(timChuoiCam(files, luat)[0].verdict, 'pass')
})

test('trichLuatChuyenHuong bắt cặp nguồn → đích (glyph Unicode)', () => {
  const t = 'Luật `/ → https://tourdaonhatrang.com/ 302` đang bật.'
  assert.deepEqual(trichLuatChuyenHuong(t), [{ tu: '/', den: 'https://tourdaonhatrang.com/' }])
})

test('trichLuatChuyenHuong bắt cặp nguồn -> đích (ASCII)', () => {
  const t = 'Luật `/ -> https://tourdaonhatrang.com/ 302` đang bật.'
  assert.deepEqual(trichLuatChuyenHuong(t), [{ tu: '/', den: 'https://tourdaonhatrang.com/' }])
})

test('trichLuatChuyenHuong bắt cặp nguồn ⇒ đích (glyph khác)', () => {
  const t = 'Luật `/ ⇒ https://tourdaonhatrang.com/ 302` đang bật.'
  assert.deepEqual(trichLuatChuyenHuong(t), [{ tu: '/', den: 'https://tourdaonhatrang.com/' }])
})

test('DOC3 trượt khi BUILD-NOTES mô tả luật mà _redirects không có (DR-043)', () => {
  const bn = 'Luật `/ → https://tourdaonhatrang.com/ 302` ĐANG BẬT.'
  const c = kiemChuyenHuong(bn, '# không có luật nào\n')[0]
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /BUILD-NOTES mô tả/)
})

test('DOC3 đạt khi _redirects có luật đó', () => {
  const bn = 'Luật `/ → https://tourdaonhatrang.com/ 302`.'
  const c = kiemChuyenHuong(bn, '/    https://tourdaonhatrang.com/    302\n')[0]
  assert.equal(c.verdict, 'pass')
})

test('DOC3 báo skip (không phải mảng rỗng im lặng — DR-021) khi BUILD-NOTES không mô tả luật nào', () => {
  const c = kiemChuyenHuong('không nhắc chuyển hướng', '')[0]
  assert.equal(c.verdict, 'skip')
  assert.equal(c.id, 'DOC3')
  assert.match(c.detail, /không mô tả luật chuyển hướng nào/)
})

test('DOC4 trượt khi DRIFT_LOG trích quyết định mà DECISIONS không có', () => {
  const c = kiemQuyetDinhDaDong('đóng ở `QĐ-2026-08-22-04`.', '# Sổ quyết định\n')[0]
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /QĐ-2026-08-22-04/)
})

test('DOC4 đạt khi mọi quyết định được trích đều có trong sổ', () => {
  const c = kiemQuyetDinhDaDong('xem `QĐ-2026-08-22-04`.', '## QĐ-2026-08-22-04 — nội dung\n')[0]
  assert.equal(c.verdict, 'pass')
})

test('DOC4 báo skip (không phải pass rỗng — DR-021) khi DRIFT_LOG không trích quyết định nào', () => {
  const c = kiemQuyetDinhDaDong('không nhắc quyết định nào ở đây', '# Sổ quyết định\n')[0]
  assert.equal(c.verdict, 'skip')
  assert.equal(c.id, 'DOC4')
  assert.match(c.detail, /không trích mã quyết định nào/)
})

test('DOC4 không nhận mã-là-tiền-tố-của-mã-khác làm khớp (ranh giới từ)', () => {
  const c = kiemQuyetDinhDaDong('đóng ở `QĐ-2026-08-22-04`.', '## QĐ-2026-08-22-04X — nội dung khác\n')[0]
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /QĐ-2026-08-22-04/)
})

test('kiemTanDuMa (DOC2-code) đạt khi mã/cấu hình sạch', () => {
  const files = [{ path: 'src/site.config.ts', content: 'export const fallback = "https://tourdao.vn"' }]
  const c = kiemTanDuMa(files, 'nhatrangtravel')[0]
  assert.equal(c.verdict, 'pass')
  assert.equal(c.id, 'DOC2-code/nhatrangtravel')
})

test('kiemTanDuMa (DOC2-code) trượt khi mã/cấu hình đang chạy còn tàn dư — ca nghiêm trọng DR-006', () => {
  const files = [{ path: 'src/site.config.ts', content: "fallback = 'https://nhatrangtravel.net'" }]
  const c = kiemTanDuMa(files, 'nhatrangtravel')[0]
  assert.equal(c.verdict, 'fail')
  assert.equal(c.id, 'DOC2-code/nhatrangtravel')
  assert.match(c.detail, /src\/site\.config\.ts/)
  assert.deepEqual(c.drift, ['DR-006'])
})

test('kiemTanDuTaiLieu (DOC2-docs) trượt nhưng nói rõ là tường thuật, trỏ sang DOC2-code', () => {
  const files = [{ path: 'README.md', content: 'Trích từ nhatrangtravel, giữ phần cốt lõi.' }]
  const c = kiemTanDuTaiLieu(files, 'nhatrangtravel')[0]
  assert.equal(c.verdict, 'fail')
  assert.equal(c.id, 'DOC2-docs/nhatrangtravel')
  assert.match(c.detail, /tường thuật/)
  assert.match(c.detail, /DOC2-code/)
})

// --- kiemTanDuTaiLieuVoiDanhSachNen: danh sách nền cho DOC2-docs ---
// Khoá theo (file, nội dung dòng đã trim) — KHÔNG theo số dòng, vì thêm một
// dòng ở đầu file sẽ đẩy lệch mọi số dòng bên dưới dù không đổi gì thật.

test('kiemTanDuTaiLieuVoiDanhSachNen đạt khi mọi chỗ khớp đều nằm trong danh sách nền', () => {
  const nen = [
    { file: 'README.md', dong: 'Trích từ nhatrangtravel, giữ phần cốt lõi.', lyDo: 'ghi nguồn gốc' },
  ]
  const files = [{ path: 'README.md', content: 'dòng đầu\nTrích từ nhatrangtravel, giữ phần cốt lõi.\ndòng cuối' }]
  const c = kiemTanDuTaiLieuVoiDanhSachNen(files, 'nhatrangtravel', nen)
  assert.equal(c.verdict, 'pass')
  assert.equal(c.id, 'DOC2-docs/nhatrangtravel')
})

test('kiemTanDuTaiLieuVoiDanhSachNen KHÔNG neo vào số dòng — thêm dòng ở đầu file không làm trượt', () => {
  const nen = [
    { file: 'README.md', dong: 'Trích từ nhatrangtravel, giữ phần cốt lõi.', lyDo: 'ghi nguồn gốc' },
  ]
  // Cùng nội dung như test trên, nhưng chèn thêm 3 dòng ở đầu — số dòng khớp lệch hẳn.
  const files = [
    { path: 'README.md', content: 'mới 1\nmới 2\nmới 3\nTrích từ nhatrangtravel, giữ phần cốt lõi.' },
  ]
  const c = kiemTanDuTaiLieuVoiDanhSachNen(files, 'nhatrangtravel', nen)
  assert.equal(c.verdict, 'pass')
})

test('kiemTanDuTaiLieuVoiDanhSachNen trượt khi xuất hiện chỗ khớp MỚI ngoài danh sách nền', () => {
  const nen = [
    { file: 'README.md', dong: 'Trích từ nhatrangtravel, giữ phần cốt lõi.', lyDo: 'ghi nguồn gốc' },
  ]
  const files = [
    {
      path: 'README.md',
      content: 'Trích từ nhatrangtravel, giữ phần cốt lõi.\nMột dòng MỚI nhắc nhatrangtravel chưa từng khai.',
    },
  ]
  const c = kiemTanDuTaiLieuVoiDanhSachNen(files, 'nhatrangtravel', nen)
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /MỚI/)
  assert.match(c.detail, /README\.md:2/)
})

test('kiemTanDuTaiLieuVoiDanhSachNen trượt khi một vị trí trong danh sách nền đã biến mất (cần dọn)', () => {
  const nen = [
    { file: 'README.md', dong: 'Trích từ nhatrangtravel, giữ phần cốt lõi.', lyDo: 'ghi nguồn gốc' },
  ]
  // Dòng đã đổi/xoá — không còn khớp nội dung nền đã khai nữa.
  const files = [{ path: 'README.md', content: 'Đã viết lại, không còn nhắc site cũ.' }]
  const c = kiemTanDuTaiLieuVoiDanhSachNen(files, 'nhatrangtravel', nen)
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /biến mất|không còn khớp|dọn/)
  assert.match(c.detail, /README\.md/)
})

test('DANH_SACH_NEN_DOC2_DOCS khớp đúng thực tế README.md và SETUP-NEW-SITE.md hôm nay (6 vị trí)', () => {
  const files = [
    { path: 'README.md', content: readFileSync(join(REPO_ROOT, 'README.md'), 'utf8') },
    { path: 'SETUP-NEW-SITE.md', content: readFileSync(join(REPO_ROOT, 'SETUP-NEW-SITE.md'), 'utf8') },
  ]
  assert.equal(DANH_SACH_NEN_DOC2_DOCS.length, 6)
  const c = kiemTanDuTaiLieuVoiDanhSachNen(files, 'nhatrangtravel', DANH_SACH_NEN_DOC2_DOCS)
  assert.equal(c.verdict, 'pass')
})
