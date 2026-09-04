import { test } from 'node:test'
import assert from 'node:assert/strict'
import { danhGiaTuoi, type MocThoiGian } from '../dist-freshness.ts'

// Cổng hậu build đọc dist/. Nếu dist/ cũ hơn nguồn sinh ra nó thì kết quả cổng
// không nói gì về mã đang push — đã đo được CẢ đỏ giả LẪN xanh giả, xem
// docs/evidence/2026-09-04-ra-soat-tu-dong-hoa §1. Bộ kiểm này là tiền điều
// kiện, không phải validator: nó chạy TRƯỚC và chặn cả lượt nếu dist/ cũ.

const MOC = 1_000_000
const goc = (): MocThoiGian => ({
  distMs: MOC,
  nguonMoiNhatMs: MOC - 1000,
  nguonMoiNhatTen: 'src/pages/index.astro',
  sanityMoiNhatMs: MOC - 1000,
  sanityMoiNhatIso: '2026-09-04T00:00:00Z',
})

test('dist mới hơn cả nguồn lẫn Sanity — tươi', () => {
  const kq = danhGiaTuoi(goc())
  assert.equal(kq.tuoi, true)
  assert.deepEqual(kq.lyDo, [])
})

test('chưa build thì không tươi', () => {
  const kq = danhGiaTuoi({ ...goc(), distMs: null })
  assert.equal(kq.tuoi, false)
  assert.match(kq.lyDo.join('\n'), /chưa có dist\/index\.html/)
})

test('file nguồn mới hơn dist — không tươi, và nêu đúng tên file', () => {
  const kq = danhGiaTuoi({ ...goc(), nguonMoiNhatMs: MOC + 5000, nguonMoiNhatTen: 'src/lib/x.ts' })
  assert.equal(kq.tuoi, false)
  assert.match(kq.lyDo.join('\n'), /src\/lib\/x\.ts/)
})

test('Sanity đổi sau khi dựng — không tươi', () => {
  const kq = danhGiaTuoi({ ...goc(), sanityMoiNhatMs: MOC + 5000, sanityMoiNhatIso: '2026-09-04T09:00:00Z' })
  assert.equal(kq.tuoi, false)
  assert.match(kq.lyDo.join('\n'), /Sanity/)
})

// Fail-closed: không xác minh được thì KHÔNG cho qua. Cùng triết lý với nhánh
// D-A của guard-deploy.sh (không thấy origin/main thì chặn, không lọt im lặng).
test('không hỏi được Sanity thì fail-closed, không mặc định tươi', () => {
  const kq = danhGiaTuoi({ ...goc(), sanityMoiNhatMs: null, sanityMoiNhatIso: null })
  assert.equal(kq.tuoi, false)
  assert.match(kq.lyDo.join('\n'), /không xác minh được/i)
})

test('nhiều thứ cũ cùng lúc thì nêu hết, không dừng ở cái đầu', () => {
  const kq = danhGiaTuoi({
    ...goc(),
    nguonMoiNhatMs: MOC + 1000,
    sanityMoiNhatMs: MOC + 2000,
  })
  assert.equal(kq.tuoi, false)
  assert.equal(kq.lyDo.length, 2)
})

test('bằng đúng mốc dist thì vẫn tươi — chỉ MỚI HƠN mới là cũ', () => {
  const kq = danhGiaTuoi({ ...goc(), nguonMoiNhatMs: MOC, sanityMoiNhatMs: MOC })
  assert.equal(kq.tuoi, true)
})

test('kho nguồn rỗng không làm sập — coi như không có gì mới hơn', () => {
  const kq = danhGiaTuoi({ ...goc(), nguonMoiNhatMs: null, nguonMoiNhatTen: null })
  assert.equal(kq.tuoi, true)
})
