import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateI20 } from '../i1-i19.js'

const withDest = {
  _id: 'a', _type: 'tour', reviewStatus: 'approved',
  destination: { _type: 'reference', _ref: 'seed.nha-trang' },
}
const withoutDest = { _id: 'b', _type: 'tour', reviewStatus: 'approved' }
const notInScope = { _id: 'c', _type: 'person', reviewStatus: 'approved' }
const destItself = { _id: 'd', _type: 'touristDestination', reviewStatus: 'approved' }

test('I20: entity trong phạm vi có destination thì pass', () => {
  const r = validateI20([withDest])
  assert.equal(r.passed, true)
  assert.deepEqual(r.errors, [])
})

test('I20: entity trong phạm vi thiếu destination thì báo lỗi, nêu _id và _type', () => {
  const r = validateI20([withoutDest])
  assert.equal(r.passed, false)
  assert.equal(r.errors.length, 1)
  assert.match(r.errors[0], /\bb\b/)
  assert.match(r.errors[0], /tour/)
  assert.match(r.errors[0], /I20/)
})

test('I20: type ngoài phạm vi không bị bắt', () => {
  assert.equal(validateI20([notInScope]).passed, true)
  assert.equal(validateI20([destItself]).passed, true)
})

test('I20: chỉ bắt document đã approved', () => {
  const draft = { ...withoutDest, _id: 'e', reviewStatus: 'draft' }
  assert.equal(validateI20([draft]).passed, true)
})

test('I20: reference rỗng (_ref trống) tính là thiếu', () => {
  const empty = { ...withoutDest, _id: 'f', destination: { _type: 'reference', _ref: '' } }
  assert.equal(validateI20([empty]).passed, false)
})
