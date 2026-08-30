import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateMuaVu } from '../mua-vu.js'

const KEYS = new Set(['tour-hon-tam-tron-goi', 'du-thuyen-vega-day-tour'])

test('dữ liệu đúng thì không lỗi', () => {
  const r = [{ name: 'Hè', from: '2027-06-01', to: '2027-08-31', percent: 20, apCho: [], truRa: [] }]
  assert.equal(validateMuaVu(r as any, KEYS).errors.length, 0)
})
test('ngày kết thúc trước ngày bắt đầu là lỗi', () => {
  const r = [{ name: 'Sai', from: '2027-08-31', to: '2027-06-01', percent: 20, apCho: [], truRa: [] }]
  assert.match(validateMuaVu(r as any, KEYS).errors[0], /Đến ngày/)
})
test('phần trăm ngoài khoảng là lỗi', () => {
  const r = [{ name: 'Quá', from: '2027-06-01', to: '2027-08-31', percent: 500, apCho: [], truRa: [] }]
  assert.match(validateMuaVu(r as any, KEYS).errors[0], /phần trăm/i)
})
test('khoá giá không tồn tại là lỗi', () => {
  const r = [{ name: 'Hè', from: '2027-06-01', to: '2027-08-31', percent: 20, apCho: ['khong-co-that'], truRa: [] }]
  assert.match(validateMuaVu(r as any, KEYS).errors[0], /khong-co-that/)
})
test('hai mùa phủ nhau KHÔNG phải lỗi — thứ tự quyết định', () => {
  const r = [
    { name: 'Lễ', from: '2027-04-30', to: '2027-05-01', percent: 30, apCho: [], truRa: [] },
    { name: 'Hè', from: '2027-04-01', to: '2027-08-31', percent: 20, apCho: [], truRa: [] },
  ]
  assert.equal(validateMuaVu(r as any, KEYS).errors.length, 0)
})
