import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validatePY1, validatePY2, validatePY7 } from '../py1-py8.js'

const m = (e: any) => new Map([['phao-chuoi', e]])
const hopLe = { unit: 'perGroup', amount: 1000000, maxPax: 5 }

test('PY1: perGroup thuộc enum đơn vị', () => {
  assert.equal(validatePY1(m(hopLe)).passed, true)
})

test('PY2: perGroup phải có amount và maxPax', () => {
  assert.equal(validatePY2(m(hopLe)).passed, true)
  assert.equal(validatePY2(m({ unit: 'perGroup', amount: 1000000 })).passed, false)
  assert.equal(validatePY2(m({ unit: 'perGroup', maxPax: 5 })).passed, false)
})

test('PY2: perGroup KHÔNG được kèm khoá lạ (tập khoá đóng)', () => {
  const r = validatePY2(m({ ...hopLe, paxRates: { child: { amount: 1 } } }))
  assert.equal(r.passed, false)
})

test('PY7: maxPax <= 0 phải FAIL — chia cho 0 ra vô số lượt', () => {
  assert.equal(validatePY7(m({ ...hopLe, maxPax: 0 })).passed, false)
  assert.equal(validatePY7(m({ ...hopLe, maxPax: -1 })).passed, false)
  assert.equal(validatePY7(m({ ...hopLe, maxPax: 2.5 })).passed, false)
})

test('PY7: amount phải là số nguyên dương VND', () => {
  assert.equal(validatePY7(m({ ...hopLe, amount: 0 })).passed, false)
  assert.equal(validatePY7(m({ ...hopLe, amount: 1000.5 })).passed, false)
  assert.equal(validatePY7(m(hopLe)).passed, true)
})
