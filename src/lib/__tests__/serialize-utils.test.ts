import { test } from 'node:test'
import assert from 'node:assert/strict'
import { urlForEntity } from '../serialize/utils.ts'

const BASE = 'https://tourdao.vn'

// DR — 2026-09-04: một article trong Sanity có slug kết thúc bằng "/", nên
// `${base}/${path}/${slug}/` sinh ra "//" và làm hỏng @id của JSON-LD
// (FAQPage @id ".../tour-ghep-hay-thue-cano-rieng-nha-trang//#faq"). Lỗi lên
// tới production vì đường phát hành không chạy validator (ADR-0022), còn
// `npm run gate` khi đó đọc `dist/` cũ nên in [pass] — xanh giả.
//
// `base` vốn đã được chuẩn hoá bằng `.replace(/\/$/, '')`; `slug` thì không.
// Các test dưới khoá lại tính đối xứng đó: dữ liệu bẩn không được phép biến
// thành URL bẩn.

test('slug sạch — giữ nguyên hành vi cũ', () => {
  assert.equal(
    urlForEntity(BASE, 'article', 'tour-ghep-hay-thue-cano-rieng-nha-trang'),
    'https://tourdao.vn/cam-nang/tour-ghep-hay-thue-cano-rieng-nha-trang/',
  )
})

test('slug thừa dấu / ở cuối không được sinh ra //', () => {
  assert.equal(
    urlForEntity(BASE, 'article', 'tour-ghep-hay-thue-cano-rieng-nha-trang/'),
    'https://tourdao.vn/cam-nang/tour-ghep-hay-thue-cano-rieng-nha-trang/',
  )
})

test('slug thừa dấu / ở đầu cũng được chuẩn hoá', () => {
  assert.equal(
    urlForEntity(BASE, 'article', '/tour-ghep-hay-thue-cano-rieng-nha-trang'),
    'https://tourdao.vn/cam-nang/tour-ghep-hay-thue-cano-rieng-nha-trang/',
  )
})

test('baseUrl thừa dấu / vẫn được chuẩn hoá như trước', () => {
  assert.equal(
    urlForEntity(`${BASE}/`, 'article', 'tour-ghep-hay-thue-cano-rieng-nha-trang'),
    'https://tourdao.vn/cam-nang/tour-ghep-hay-thue-cano-rieng-nha-trang/',
  )
})

// Ba nhánh còn lại của urlForEntity ghép slug theo cùng một kiểu, nên phải
// chuẩn hoá cùng chỗ — không sửa riêng nhánh article.

test('nhánh touristDestination — slug bẩn không sinh //', () => {
  assert.equal(
    urlForEntity(BASE, 'touristDestination', 'tinh-khanh-hoa/'),
    'https://tourdao.vn/tinh-khanh-hoa/',
  )
})

test('nhánh category — slug bẩn không sinh //', () => {
  assert.equal(
    urlForEntity(BASE, 'category', 'lan-bien/'),
    'https://tourdao.vn/the-loai/lan-bien/',
  )
})

test('nhánh đa ngôn ngữ — slug bẩn không sinh //', () => {
  assert.equal(
    urlForEntity(BASE, 'article', 'snorkeling-la-gi/', 'en'),
    'https://tourdao.vn/en/guides/snorkeling-la-gi/',
  )
})
