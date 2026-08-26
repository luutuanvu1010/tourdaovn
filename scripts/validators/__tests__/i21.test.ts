import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateI21 } from '../i1-i19.js'

const ref = (id: string) => ({ _type: 'reference', _ref: id })

const nhaTrang = { _id: 'seed.nha-trang', _type: 'touristDestination', reviewStatus: 'approved' }
const ninhThuan = { _id: 'dest.ninh-thuan', _type: 'touristDestination', reviewStatus: 'approved' }

/** Attraction thuộc Nha Trang */
const honMun = { _id: 'a1', _type: 'attraction', destination: ref('seed.nha-trang') }
/** Attraction thuộc Ninh Thuận */
const vinhHy = { _id: 'a2', _type: 'attraction', destination: ref('dest.ninh-thuan') }
/** Attraction chưa khai thuộc điểm đến nào */
const moCoi = { _id: 'a3', _type: 'attraction' }

test('I21: mục nổi bật thuộc đúng điểm đến thì pass', () => {
  const r = validateI21([{ ...nhaTrang, featuredAttractions: [ref('a1')] }, honMun])
  assert.equal(r.passed, true)
  assert.deepEqual(r.errors, [])
})

test('I21: mục nổi bật thuộc điểm đến KHÁC thì báo lỗi, nêu đủ hai phía', () => {
  const r = validateI21([{ ...ninhThuan, featuredAttractions: [ref('a1')] }, honMun, nhaTrang])
  assert.equal(r.passed, false)
  assert.equal(r.errors.length, 1)
  assert.match(r.errors[0], /dest\.ninh-thuan/)
  assert.match(r.errors[0], /a1/)
  assert.match(r.errors[0], /featuredAttractions/)
  assert.match(r.errors[0], /I21/)
})

test('I21: quét đủ CẢ NĂM ô nổi bật, không chỉ attractions', () => {
  const doc = {
    ...ninhThuan,
    featuredAttractions: [ref('a1')],
    featuredStays: [ref('a1')],
    featuredExperiences: [ref('a1')],
    featuredSpecialties: [ref('a1')],
    featuredTours: [ref('a1')],
  }
  const r = validateI21([doc, honMun, nhaTrang])
  assert.equal(r.errors.length, 5)
  for (const f of ['featuredAttractions','featuredStays','featuredExperiences','featuredSpecialties','featuredTours'])
    assert.ok(r.errors.some(e => e.includes(f)), `thiếu lỗi cho ${f}`)
})

test('I21: mục nổi bật CHƯA khai destination thì báo lỗi — đó là I20 ở chiều khác', () => {
  const r = validateI21([{ ...ninhThuan, featuredAttractions: [ref('a3')] }, moCoi])
  assert.equal(r.passed, false)
  assert.match(r.errors[0], /a3/)
})

test('I21: ô nổi bật trỏ tới _id không tồn tại thì bỏ qua — V2 của validate-min lo việc đó', () => {
  const r = validateI21([{ ...ninhThuan, featuredAttractions: [ref('khong-co-that')] }])
  assert.equal(r.passed, true)
})

test('I21: điểm đến không có ô nổi bật nào thì pass', () => {
  assert.equal(validateI21([ninhThuan]).passed, true)
})

test('I21: dữ liệu thật đúng thì nhiều điểm đến cùng pass', () => {
  const docs = [
    { ...nhaTrang, featuredAttractions: [ref('a1')] },
    { ...ninhThuan, featuredAttractions: [ref('a2')] },
    honMun, vinhHy,
  ]
  assert.equal(validateI21(docs).passed, true)
})
