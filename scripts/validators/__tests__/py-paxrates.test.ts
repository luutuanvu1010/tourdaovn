import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validatePY2, validatePY3, validatePY4, validatePY5, validatePY7 } from '../py1-py8.js'
import type { PriceEntry } from '../../lib/price-loader.js'

const map = (o: Record<string, unknown>) => new Map(Object.entries(o)) as Map<string, PriceEntry>

test('PY2/PY7: paxRates hợp lệ đi cùng amount → xanh', () => {
  const prices = map({ 'tour-a': { unit: 'perPax', amount: 550000, paxRates: { child: { amount: 350000, note: '5–11 tuổi' }, senior: { amount: 450000 } } } })
  assert.equal(validatePY2(prices).passed, true, validatePY2(prices).errors.join('\n'))
  assert.equal(validatePY7(prices).passed, true, validatePY7(prices).errors.join('\n'))
})

test('PY2: paxRates cùng tiers → fail', () => {
  const prices = map({ 'tour-b': { unit: 'perPax', tiers: [{ maxPax: 2, amount: 1 }], paxRates: { child: { amount: 1 } } } })
  const r = validatePY2(prices)
  assert.equal(r.passed, false)
  assert.match(r.errors.join('\n'), /paxRates.*tiers/)
})

test('PY7: khoá con lạ trong paxRates → fail', () => {
  const prices = map({ 'tour-c': { unit: 'perPax', amount: 1, paxRates: { baby: { amount: 0 } } } })
  const r = validatePY7(prices)
  assert.equal(r.passed, false)
  assert.match(r.errors.join('\n'), /paxRates\.baby/)
})

test('PY7: amount hạng phụ âm → fail; 0 → hợp lệ', () => {
  const neg = validatePY7(map({ t: { unit: 'perPax', amount: 1, paxRates: { child: { amount: -1 } } } }))
  assert.equal(neg.passed, false)
  assert.match(neg.errors.join('\n'), /paxRates\.child\.amount/)
  assert.match(neg.errors.join('\n'), /số nguyên ≥ 0/)

  const zero = validatePY7(map({ t: { unit: 'perPax', amount: 1, paxRates: { infant: { amount: 0 } } } }))
  assert.equal(zero.passed, true)
  assert.equal(zero.errors.filter((e) => e.includes('paxRates')).length, 0)
})

test('PY7: khoá lạ bên trong một hạng, note quá 40 ký tự → fail', () => {
  const badKey = validatePY7(map({ t: { unit: 'perPax', amount: 1, paxRates: { child: { amount: 1, cost: 2 } } } }))
  assert.equal(badKey.passed, false)
  assert.match(badKey.errors.join('\n'), /paxRates\.child/)
  assert.match(badKey.errors.join('\n'), /khóa lạ/)

  const longNote = validatePY7(map({ t: { unit: 'perPax', amount: 1, paxRates: { child: { amount: 1, note: 'x'.repeat(41) } } } }))
  assert.equal(longNote.passed, false)
  assert.match(longNote.errors.join('\n'), /paxRates\.child\.note/)
  assert.match(longNote.errors.join('\n'), /40/)
})

// ── DR-096: bookingRef là object { key }, không phải chuỗi — PY3/PY4/PY5 phải đọc bookingRef.key ──

test('PY4: tour trỏ đúng bookingRef.key có dòng giá tương ứng → passed true, không báo mồ côi', () => {
  const prices = map({ 'tour-a': { unit: 'perPax', amount: 500000 } })
  const docs = [{ _id: 'd1', _type: 'tour', bookingRef: { key: 'tour-a' } }]
  const r = validatePY4(docs, prices)
  assert.equal(r.passed, true, r.errors.join('\n'))
  assert.equal(r.errors.length, 0)
})

test('PY4: tour trỏ bookingRef.key không có dòng giá → passed false, báo trỏ hụt (không phải warn)', () => {
  const prices = map({ 'tour-a': { unit: 'perPax', amount: 500000 } })
  const docs = [{ _id: 'd1', _type: 'tour', bookingRef: { key: 'tour-thieu' } }]
  const r = validatePY4(docs, prices)
  assert.equal(r.passed, false)
  assert.match(r.errors.join('\n'), /trỏ hụt|không có dòng giá/)
  assert.notEqual(r.level, 'warn')
})

test('PY5: tour có bookingRef.key hợp lệ, không isAccessibleForFree → passed true', () => {
  const docs = [{ _id: 'd1', _type: 'tour', bookingRef: { key: 'tour-a' } }]
  const r = validatePY5(docs)
  assert.equal(r.passed, true, r.errors.join('\n'))
})

test('PY3: tour trỏ dòng giá unit=perRoomNight → passed false, thông điệp chứa perPax', () => {
  const prices = map({ 'tour-a': { unit: 'perRoomNight', from: 500000, asOf: '2026-08-22' } })
  const docs = [{ _id: 'd1', _type: 'tour', bookingRef: { key: 'tour-a' } }]
  const r = validatePY3(docs, prices)
  assert.equal(r.passed, false)
  assert.match(r.errors.join('\n'), /perPax/)
})

test('DR-096: bookingRef object không có key (hoặc key rỗng) → coi như không có bookingRef, không nổ', () => {
  const prices = map({ 'tour-a': { unit: 'perPax', amount: 500000 } })
  const docs = [
    { _id: 'd1', _type: 'tour', bookingRef: {} },
    { _id: 'd2', _type: 'tour', bookingRef: { key: '' } },
    { _id: 'd3', _type: 'tour', bookingRef: null },
  ]
  assert.doesNotThrow(() => validatePY3(docs, prices))
  assert.doesNotThrow(() => validatePY4(docs, prices))
  assert.doesNotThrow(() => validatePY5(docs))

  const r3 = validatePY3(docs, prices)
  assert.equal(r3.passed, true, r3.errors.join('\n')) // không bookingRef hợp lệ → PY3 bỏ qua, không báo lỗi giả

  const r4 = validatePY4(docs, prices)
  assert.equal(r4.errors.some((e) => e.includes('d1') || e.includes('d2') || e.includes('d3')), false)
})
