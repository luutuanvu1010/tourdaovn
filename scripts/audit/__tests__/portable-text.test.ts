import { test } from 'node:test'
import assert from 'node:assert/strict'
import { planBody } from '../../../src/lib/portableText'

/**
 * Hồi quy cho lỗi "mất định dạng thân bài".
 *
 * Đo được ngày 2026-08-29 trên dataset đang phát hành: 1 845 khối `listItem:
 * bullet`, 12 khối `listItem: number`, 49 khối `style: blockquote` và 94 khối
 * `style: h1` trong `body.vi` của 108 document, cộng 508 khối bullet trong
 * `article.body` và 9 trong `person.bio`. Không khối nào trong số đó ra được
 * HTML đúng nghĩa: `Body.astro` chỉ nhận `image`, `h2..h4` và mọi thứ còn lại
 * rơi hết vào một nhánh `<p>`.
 *
 * Test này khoá HÌNH DẠNG CÂY, không khoá CSS.
 */

const b = (text: string, extra: Record<string, unknown> = {}) => ({
  _type: 'block',
  style: 'normal',
  children: [{ _type: 'span', text, marks: [] }],
  ...extra,
})

const li = (text: string, level = 1, listItem: 'bullet' | 'number' = 'bullet') =>
  b(text, { listItem, level })

test('bullet liền nhau gộp thành MỘT <ul>, mỗi khối một <li>', () => {
  const nodes = planBody([li('một'), li('hai'), li('ba')], {})
  assert.equal(nodes.length, 1)
  assert.equal(nodes[0].kind, 'list')
  assert.equal(
    nodes[0].kind === 'list' ? nodes[0].html : '',
    '<ul><li>một</li><li>hai</li><li>ba</li></ul>',
  )
})

test('listItem number ra <ol>', () => {
  const nodes = planBody([li('một', 1, 'number'), li('hai', 1, 'number')], {})
  assert.equal(nodes[0].kind === 'list' ? nodes[0].html : '', '<ol><li>một</li><li>hai</li></ol>')
})

test('level 2 nằm TRONG <li> của mục cha, không thành list anh em', () => {
  const nodes = planBody([li('cha'), li('con A', 2), li('con B', 2), li('cha 2')], {})
  assert.equal(nodes.length, 1)
  assert.equal(
    nodes[0].kind === 'list' ? nodes[0].html : '',
    '<ul><li>cha<ul><li>con A</li><li>con B</li></ul></li><li>cha 2</li></ul>',
  )
})

test('đoạn văn xen giữa cắt thành hai list riêng', () => {
  const nodes = planBody([li('một'), b('đoạn văn'), li('hai')], {})
  assert.deepEqual(nodes.map((n) => n.kind), ['list', 'paragraph', 'list'])
})

test('bullet rồi number cùng cấp là hai list khác loại', () => {
  const nodes = planBody([li('a'), li('b', 1, 'number')], {})
  assert.deepEqual(nodes.map((n) => n.kind), ['list', 'list'])
  assert.match(nodes[0].kind === 'list' ? nodes[0].html : '', /^<ul>/)
  assert.match(nodes[1].kind === 'list' ? nodes[1].html : '', /^<ol>/)
})

test('mục danh sách giữ được mark và link như đoạn văn', () => {
  const blocks = [
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [{ _key: 'k1', _type: 'link', href: 'https://tourdao.vn/tour/' }],
      children: [
        { _type: 'span', text: 'Giá: ', marks: [] },
        { _type: 'span', text: '450k', marks: ['strong'] },
        { _type: 'span', text: ' xem tour', marks: ['k1'] },
      ],
    },
  ]
  const html = planBody(blocks, {})[0]
  assert.equal(
    html.kind === 'list' ? html.html : '',
    '<ul><li>Giá: <strong>450k</strong><a href="https://tourdao.vn/tour/"> xem tour</a></li></ul>',
  )
})

test('blockquote ra <blockquote>, không rơi về <p>', () => {
  const nodes = planBody([b('lời trích', { style: 'blockquote' })], {})
  assert.equal(nodes[0].kind, 'quote')
})

test('h1 trong thân bài KHÔNG bao giờ ra <h1> — trang đã có h1 tiêu đề', () => {
  const camNang = planBody([b('Tiêu đề', { style: 'h1' })], { headingOffset: 0 })
  const entity = planBody([b('Tiêu đề', { style: 'h1' })], { headingOffset: 1 })
  assert.equal(camNang[0].kind === 'heading' ? camNang[0].tag : '', 'h2')
  assert.equal(entity[0].kind === 'heading' ? entity[0].tag : '', 'h3')
})

test('hạ cấp tiêu đề cũ giữ nguyên: h2→h3, h4→h5, kẹp ở h5', () => {
  const styles = ['h2', 'h3', 'h4', 'h5'].map((s) => b('x', { style: s }))
  const got = planBody(styles, { headingOffset: 1 }).map((n) => (n.kind === 'heading' ? n.tag : n.kind))
  assert.deepEqual(got, ['h3', 'h4', 'h5', 'h5'])
})

test('mark code ra <code>', () => {
  const blocks = [
    { _type: 'block', style: 'normal', children: [{ _type: 'span', text: 'npm run build', marks: ['code'] }] },
  ]
  const n = planBody(blocks, {})[0]
  assert.equal(n.kind === 'paragraph' ? n.html : '', '<code>npm run build</code>')
})

test('giữ nguyên hành vi cũ: escape, gỡ rác cite, bỏ khối rỗng, ảnh', () => {
  const nodes = planBody(
    [
      b('<script>alert(1)</script>'),
      b('rác <cite index="3"> ở đây'),
      b('   '),
      { _type: 'image', asset: { url: 'https://x/y.jpg' } },
    ],
    {},
  )
  assert.deepEqual(nodes.map((n) => n.kind), ['paragraph', 'paragraph', 'image'])
  assert.equal(
    nodes[0].kind === 'paragraph' ? nodes[0].html : '',
    '&lt;script&gt;alert(1)&lt;/script&gt;',
  )
  assert.equal(nodes[1].kind === 'paragraph' ? nodes[1].html : '', 'rác  ở đây')
})

test('mục danh sách rỗng không sinh <li> rỗng', () => {
  const nodes = planBody([li('một'), li('  '), li('hai')], {})
  assert.equal(nodes[0].kind === 'list' ? nodes[0].html : '', '<ul><li>một</li><li>hai</li></ul>')
})
