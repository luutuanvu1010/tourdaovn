import { test } from 'node:test'
import assert from 'node:assert/strict'
import { articleToJsonLd } from '../serialize/article.ts'

// 2026-09-04: một bài vừa publish thiếu `articleType`, và serializer gán thẳng
// `ld['articleSection'] = article.articleType` nên JSON-LD xuất ra `"articleSection":null`.
// Lỗi đã lên tới production (curl xác nhận) vì đường phát hành không chạy validator
// (ADR-0022). `null` trong JSON-LD không phải "giá trị rỗng" mà là dữ liệu hỏng —
// đúng thứ cổng I6 bắt. Bỏ hẳn field mới là cách đúng, và cũng là idiom sẵn có của
// chính file này (`if (article.summary)`, `if (speakable)`, `if (faqPage)`).
//
// Nợ dữ liệu "bài thiếu articleType" KHÔNG bị giấu đi: nó có cổng publish riêng
// (I12/I4/I7 — 01-CONTENT_MODEL §493). Việc của serializer chỉ là đừng xuất JSON hỏng.

const BASE = 'https://tourdao.vn'

function baiViet(thay: Record<string, unknown> = {}) {
  return {
    _id: 'a1', slug: 'thu-nghiem', title: 'Bài thử nghiệm',
    language: 'vi', articleType: 'guide',
    summary: null, body: null, faq: null, mainImage: null,
    author: null, publishedAt: null, updatedAt: null,
    ...thay,
  } as any
}

test('có articleType thì xuất articleSection như cũ', () => {
  const ld = articleToJsonLd(baiViet({ articleType: 'guide' }), BASE)
  assert.equal(ld['articleSection'], 'guide')
})

test('thiếu articleType thì BỎ HẲN field, không xuất null', () => {
  const ld = articleToJsonLd(baiViet({ articleType: null }), BASE)
  assert.ok(!('articleSection' in ld), 'articleSection phải vắng mặt hẳn')
})

test('articleType undefined cũng bỏ hẳn field', () => {
  const ld = articleToJsonLd(baiViet({ articleType: undefined }), BASE)
  assert.ok(!('articleSection' in ld))
})

test('articleType chuỗi rỗng cũng bỏ — chuỗi rỗng không phải một section', () => {
  const ld = articleToJsonLd(baiViet({ articleType: '' }), BASE)
  assert.ok(!('articleSection' in ld))
})

// Bất biến chung, không riêng articleSection: cổng I6 đỏ với BẤT KỲ null nào trong
// JSON-LD, nên serializer không được để lọt null ra ngoài ở bất cứ field nào.
test('không field nào trong JSON-LD mang giá trị null', () => {
  const ld = articleToJsonLd(baiViet({ articleType: null }), BASE)
  const nulls = Object.entries(ld).filter(([, v]) => v === null).map(([k]) => k)
  assert.deepEqual(nulls, [], `field còn null: ${nulls.join(', ')}`)
})

test('bài đủ field cũng không lọt null nào', () => {
  const ld = articleToJsonLd(
    baiViet({ articleType: 'review', summary: 'Tóm tắt ngắn.' }),
    BASE,
  )
  const nulls = Object.entries(ld).filter(([, v]) => v === null).map(([k]) => k)
  assert.deepEqual(nulls, [])
})
