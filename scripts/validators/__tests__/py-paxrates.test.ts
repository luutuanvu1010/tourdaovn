import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validatePY2, validatePY7 } from '../py1-py8.js'
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
