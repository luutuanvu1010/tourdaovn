import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chonTourTrangChu } from '../homepage.ts'

const a = { _id: 'a', slug: 'tour-a', title: 'A', duration: '8 giờ' }
const b = { _id: 'b', slug: 'tour-b', title: 'B', duration: '6 giờ' }
const c = { _id: 'c', slug: 'tour-c', title: 'C', duration: '7 giờ' }
const d = { _id: 'd', slug: 'tour-d', title: 'D', duration: '9 giờ' }
const kho = [a, b, c, d]

test('featuredTours rỗng thì rơi về ba tour đầu của kho', () => {
  assert.deepEqual(chonTourTrangChu(kho, []), [a, b, c])
})

test('featuredTours vắng hoặc null thì không ném lỗi, vẫn rơi về kho', () => {
  assert.deepEqual(chonTourTrangChu(kho, undefined), [a, b, c])
  assert.deepEqual(chonTourTrangChu(kho, null), [a, b, c])
})

test('phần tử null trong featuredTours bị bỏ, không ném lỗi', () => {
  assert.deepEqual(chonTourTrangChu(kho, [null, { _id: 'c' }]), [c])
})

test('giữ đúng thứ tự biên tập xếp, không theo bảng chữ cái', () => {
  assert.deepEqual(chonTourTrangChu(kho, [{ _id: 'c' }, { _id: 'a' }]), [c, a])
})

test('tour biên tập chọn nhưng không có trong kho đã duyệt thì bị loại', () => {
  assert.deepEqual(chonTourTrangChu(kho, [{ _id: 'khong-co' }, { _id: 'b' }]), [b])
})

test('kho rỗng thì trả mảng rỗng, không ném lỗi', () => {
  assert.deepEqual(chonTourTrangChu([], [{ _id: 'a' }]), [])
})
