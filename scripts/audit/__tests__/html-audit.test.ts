// Test cho seo-auditor. SEO/canonical ĐÃ BỊ LOẠI khỏi cả file này lẫn
// html-audit.ts — xem đầu file html-audit.ts để biết vì dòng nào của
// scripts/validators/jsonld-post.ts đã lo phần đó rồi.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kiemTrang, gomViPham } from '../html-audit'

const MO_TA = {
  'IMG/alt': { moTa: 'thẻ img thiếu alt', drift: 'yêu cầu 2026-08-23' },
  'IMG/kich-thuoc': { moTa: 'thẻ img thiếu width/height', drift: 'yêu cầu 2026-08-23' },
  'IMG/lazy': { moTa: 'ảnh dưới màn hình đầu chưa lazy', drift: 'yêu cầu 2026-08-23' },
  'IMG/kich-co-sanity': { moTa: 'ảnh Sanity tải bản gốc', drift: 'yêu cầu 2026-08-23' },
}

test('IMG/alt: bắt img thiếu alt, bỏ qua img có alt kể cả alt rỗng', () => {
  const html = '<img src="a.jpg"><img src="b.jpg" alt=""><img src="c.jpg" alt="mô tả">'
  const v = kiemTrang(html, '/x/').filter((x) => x.rule === 'IMG/alt')
  assert.equal(v.length, 1)
  assert.match(v[0].detail, /a\.jpg/)
})

test('IMG/kich-thuoc: bắt img thiếu width hoặc height', () => {
  const html = '<img src="a.jpg" alt="" width="10"><img src="b.jpg" alt="" width="10" height="20">'
  const v = kiemTrang(html, '/x/').filter((x) => x.rule === 'IMG/kich-thuoc')
  assert.equal(v.length, 1)
  assert.match(v[0].detail, /a\.jpg/)
})

test('IMG/lazy: ảnh đầu tiên được miễn, từ ảnh thứ hai bắt buộc lazy', () => {
  const html =
    '<img src="hero.jpg" alt=""><img src="b.jpg" alt="" loading="lazy"><img src="c.jpg" alt="">'
  const v = kiemTrang(html, '/x/').filter((x) => x.rule === 'IMG/lazy')
  assert.equal(v.length, 1)
  assert.match(v[0].detail, /c\.jpg/)
})

test('IMG/kich-co-sanity: ảnh cdn.sanity.io phải có tham số w=', () => {
  const html =
    '<img src="https://cdn.sanity.io/images/x/y/a.jpg" alt="" width="1" height="1" loading="lazy">' +
    '<img src="https://cdn.sanity.io/images/x/y/b.jpg?w=800" alt="" width="1" height="1" loading="lazy">'
  const v = kiemTrang(html, '/x/').filter((x) => x.rule === 'IMG/kich-co-sanity')
  assert.equal(v.length, 1)
  assert.match(v[0].detail, /a\.jpg/)
})

test('trang sạch thì không sinh vi phạm nào', () => {
  const html =
    '<img src="https://cdn.sanity.io/images/x/y/a.jpg?w=1200" alt="hero" width="1200" height="800">'
  assert.deepEqual(kiemTrang(html, '/x/'), [])
})

test('gomViPham gộp theo luật, một Check cho mỗi luật', () => {
  const vp = [
    { rule: 'IMG/alt', detail: 'a.jpg', trang: '/x/' },
    { rule: 'IMG/alt', detail: 'b.jpg', trang: '/y/' },
  ]
  const checks = gomViPham(vp, 10, MO_TA)
  const alt = checks.find((c) => c.id === 'IMG/alt')!
  assert.equal(alt.verdict, 'fail')
  assert.match(alt.detail, /2 chỗ trên 2 trang/)
  assert.equal(checks.find((c) => c.id === 'IMG/kich-co-sanity')!.verdict, 'pass')
})

test('gomViPham cắt danh sách dài nhưng nói ra đã cắt bao nhiêu', () => {
  const vp = Array.from({ length: 30 }, (_, i) => ({
    rule: 'IMG/alt',
    detail: `anh-${i}.jpg`,
    trang: `/t${i}/`,
  }))
  const alt = gomViPham(vp, 30, MO_TA).find((c) => c.id === 'IMG/alt')!
  assert.match(alt.detail, /và 25 chỗ nữa/)
})

test('gomViPham: tongTrang bằng 0 thì mọi luật là skip, không được pass ảo', () => {
  const checks = gomViPham([], 0, MO_TA)
  for (const c of checks) {
    assert.equal(c.verdict, 'skip', `${c.id} phải là skip khi chưa đọc trang nào, không được pass`)
    assert.match(c.detail, /không có trang nào để kiểm|0 trang/)
  }
})
