import { test } from 'node:test'
import assert from 'node:assert/strict'
import { trichTieuDe, demUrlSitemap, soDauHieu } from '../deploy-verify'

test('trichTieuDe lấy nội dung thẻ title', () => {
  assert.equal(trichTieuDe('<html><head><title>Tour Đảo</title></head></html>'), 'Tour Đảo')
  assert.equal(trichTieuDe('<title>\n  Có xuống dòng\n</title>'), 'Có xuống dòng')
  assert.equal(trichTieuDe('<html><body>không có title</body></html>'), null)
})

test('demUrlSitemap đếm thẻ loc', () => {
  const xml = '<urlset><url><loc>https://a/</loc></url><url><loc>https://b/</loc></url></urlset>'
  assert.equal(demUrlSitemap(xml), 2)
  assert.equal(demUrlSitemap('<urlset></urlset>'), 0)
})

test('soDauHieu đạt khi hai bên giống nhau', () => {
  const checks = soDauHieu('<p>có A</p>', '<p>có A</p>', ['có A', 'không có B'])
  assert.equal(checks.filter((c) => c.verdict === 'pass').length, 2)
})

test('soDauHieu trượt và nói rõ bên nào có (DR-041)', () => {
  const checks = soDauHieu('<p>Có thu phí</p>', '<p>đã bỏ</p>', ['Có thu phí'])
  assert.equal(checks[0].verdict, 'fail')
  assert.match(checks[0].detail, /production có.*dist\/ không/)
  assert.deepEqual(checks[0].drift, ['DR-041'])
})

test('soDauHieu trượt theo chiều ngược lại', () => {
  const checks = soDauHieu('<p>cũ</p>', '<p>--sticky-bar-h: 10px</p>', ['--sticky-bar-h'])
  assert.equal(checks[0].verdict, 'fail')
  assert.match(checks[0].detail, /dist\/ có.*production không/)
})
