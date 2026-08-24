import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  timChuoiCam,
  trichLuatChuyenHuong,
  kiemChuyenHuong,
  kiemQuyetDinhDaDong,
} from '../doc-reality'

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

test('trichLuatChuyenHuong bắt cặp nguồn → đích', () => {
  const t = 'Luật `/ → https://tourdaonhatrang.com/ 302` đang bật.'
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

test('DOC3 đạt (rỗng) khi BUILD-NOTES không mô tả luật nào', () => {
  assert.deepEqual(kiemChuyenHuong('không nhắc chuyển hướng', ''), [])
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
