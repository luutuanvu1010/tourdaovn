import { test } from 'node:test'
import assert from 'node:assert/strict'
import { docDonVi, DON_VI_TU_SHEET } from '../../prices-pull.mjs'

test('per5pax đọc thành perGroup maxPax 5', () => {
  assert.deepEqual(docDonVi('per5pax'), { unit: 'perGroup', maxPax: 5 })
  assert.deepEqual(docDonVi('per12pax'), { unit: 'perGroup', maxPax: 12 })
})
test('perPax vẫn là perPax', () => {
  assert.deepEqual(docDonVi('perPax'), { unit: 'perPax' })
})
test('đơn vị thật sự lạ → null (gọi bên ngoài sẽ cảnh báo và bỏ qua)', () => {
  assert.equal(docDonVi('perNight'), null)
  assert.equal(docDonVi('per0pax'), null)   // maxPax 0 vô nghĩa
})
test('giuNguyen KHÔNG được nuốt perGroup', () => {
  // perGroup SINH RA TỪ Sheet, nên nó phải nằm TRONG tập "Sheet sinh ra được".
  assert.equal(DON_VI_TU_SHEET.has('perGroup'), true)
  assert.equal(DON_VI_TU_SHEET.has('perPax'), true)
  assert.equal(DON_VI_TU_SHEET.has('perRoomNight'), false)
})
test('mặc-định-an-toàn: đơn vị lạ chưa ai nghĩ ra vẫn được GIỮ NGUYÊN', () => {
  // Đây là tính chất luật cũ (`unit !== perPax`) có mà một danh sách liệt kê sẽ đánh mất.
  assert.equal(DON_VI_TU_SHEET.has('perNight'), false)
})
