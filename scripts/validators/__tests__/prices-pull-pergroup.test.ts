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
test('docDonVi không phân biệt hoa/thường — nhưng KẾT QUẢ luôn chuẩn hoá', () => {
  // Người kinh doanh gõ tay vào Sheet; `per5Pax` (P hoa) đã từng bị bỏ qua im lặng vì so
  // khớp chính xác hoa/thường của luật cũ. Bất kể gõ kiểu gì, giá trị TRẢ VỀ phải luôn đúng
  // chữ hoa/thường chuẩn — thứ ghi vào data/prices.yaml không được phản ánh cách gõ.
  assert.deepEqual(docDonVi('per5Pax'), { unit: 'perGroup', maxPax: 5 })
  assert.deepEqual(docDonVi('PER5PAX'), { unit: 'perGroup', maxPax: 5 })
  assert.deepEqual(docDonVi('perpax'), { unit: 'perPax' })
  assert.deepEqual(docDonVi('PerPax'), { unit: 'perPax' })
})
test('docDonVi CHỈ nới chiều hoa/thường — không nới hình dạng: vẫn phải trượt null', () => {
  // Ca quan trọng nhất: chứng minh việc nới hoa/thường không mở toang cho các biến thể sai
  // hình dạng khác lọt qua theo.
  assert.equal(docDonVi('per5paxx'), null)
  assert.equal(docDonVi('perpaxx'), null)
})
