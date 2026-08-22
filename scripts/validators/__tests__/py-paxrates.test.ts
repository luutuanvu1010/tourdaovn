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
  assert.equal(validatePY7(map({ t: { unit: 'perPax', amount: 1, paxRates: { child: { amount: -1 } } } })).passed, false)
  assert.equal(validatePY7(map({ t: { unit: 'perPax', amount: 1, paxRates: { infant: { amount: 0 } } } })).passed, true)
})

test('PY7: khoá lạ bên trong một hạng, note quá 40 ký tự → fail', () => {
  assert.equal(validatePY7(map({ t: { unit: 'perPax', amount: 1, paxRates: { child: { amount: 1, cost: 2 } } } })).passed, false)
  assert.equal(validatePY7(map({ t: { unit: 'perPax', amount: 1, paxRates: { child: { amount: 1, note: 'x'.repeat(41) } } } })).passed, false)
})
