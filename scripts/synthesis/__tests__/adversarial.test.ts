// Adversarial test (R4) — deterministic, KHÔNG gọi LLM/Sanity/HTTP.
// Giả định LLM ĐÃ bị lừa (trickedLLMOutput) và chứng minh các tầng sau là lưới chặn:
//   (a) field cấm (price/offers) không lọt qua mapper/validator
//   (b) content-guard chuẩn hoá "thành phố Nha Trang" → "Nha Trang" (I15)
//   (c) validator từ chối sameAs không phải Wikidata/Wikipedia (gate I2)
//   (d) ảnh ngoài Wikimedia bị image-handler bỏ (không kiểm được license)
//   (e) bộ upload HTML bỏ ảnh trang trí/logo/card trước khi lưu gallery
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mapFields } from '../field-mapper'
import { validateOutput } from '../output-validator'
import { normalizeI15, normalizeI15Deep } from '../content-guard'
import { handleImage, selectUploadableImageCandidates } from '../image-handler'

import { trickedLLMOutput, externalImageUrl } from './fixtures/adversarial.golden'

// (a) field cấm I1 không lọt qua mapper, dù LLM bị tiêm price/offers
test('adversarial (a) — price/offers bị mapper loại khỏi whitelist', () => {
  const { mapped } = mapFields('place', trickedLLMOutput)
  assert.equal(mapped.price, undefined, 'price (I1) KHÔNG được lọt')
  assert.equal(mapped.offers, undefined, 'offers (I1) KHÔNG được lọt')
  // field hợp lệ vẫn map (title/summary) — chứng minh chỉ field độc bị bỏ, không phá lõi
  assert.ok(mapped.title?.vi, 'title hợp lệ vẫn map')
})

// (b) content-guard chuẩn hoá I15 trên prose độc, đệ quy mọi string leaf
test('adversarial (b) — content-guard chuẩn hoá "thành phố Nha Trang"', () => {
  // hàm phẳng
  assert.equal(normalizeI15('thành phố Nha Trang'), 'Nha Trang')
  assert.equal(normalizeI15('Thành Phố Nha Trang'), 'Nha Trang')

  // đệ quy trên object output
  const { value, changed } = normalizeI15Deep(trickedLLMOutput)
  assert.equal(changed, true, 'phát hiện và sửa cụm cấm')
  assert.ok(!JSON.stringify(value).includes('thành phố Nha Trang'), 'không còn cụm "thành phố Nha Trang"')
  assert.ok(!JSON.stringify(value).toLowerCase().includes('thành phố nha trang'))
})

// (c) validator từ chối sameAs rác (gate I2) — place bắt buộc sameAs Wikidata/Wikipedia
test('adversarial (c) — validator từ chối sameAs không phải Wikidata/Wikipedia', () => {
  const { mapped } = mapFields('place', trickedLLMOutput)
  // sameAs rác vẫn nằm trong mapped (mapper không phán license), nhưng validator phải bắt
  assert.deepEqual(mapped.sameAs, ['https://evil.example.com/not-wikidata'])

  const v = validateOutput('place', mapped)
  assert.equal(v.ok, false, 'place với sameAs rác phải TRƯỢT')
  assert.ok(
    v.errors.some(e => e.includes('sameAs')),
    'có lỗi gate sameAs (I2) — URL rác không thoả Wikidata/Wikipedia',
  )
})

// (d) image-handler bỏ ảnh ngoài Wikimedia — offline, isCommonsUrl false → return trước fetch
test('adversarial (d) — ảnh ngoài Wikimedia bị image-handler bỏ', async () => {
  const result = await handleImage(externalImageUrl, 'Hòn Mun', { dryRun: true })
  assert.equal(result.mainImage, undefined, 'không nhận ảnh ngoài Wikimedia')
  assert.equal(result.imageProvenance, undefined, 'không dựng provenance cho ảnh không kiểm được license')
  assert.ok(
    result.warnings.some(w => w.includes('Wikimedia')),
    'có cảnh báo ảnh không thuộc Wikimedia',
  )
})

test('adversarial (e) — bộ upload HTML bỏ logo/card và dedupe rendition', () => {
  const selected = selectUploadableImageCandidates([
    { url: 'https://cache.marriott.com/content/dam/foo/si-nhasi-infinity-pool-32377.jpg', source: 'jsonld' },
    { url: 'https://cache.marriott.com/is/image/marriotts7prod/si-nhasi-infinity-pool-32377:Wide-Hor?wid=1336', source: 'og' },
    { url: 'https://cache.marriott.com/content/dam/foo/si_logo_L.png', source: 'html', alt: 'Sheraton Hotel logo' },
    { url: 'https://example.com/card.png', source: 'html', alt: 'Credit Card' },
    { url: 'https://cache.marriott.com/content/dam/foo/si-nhasi-presidential-suite-32738.jpg', source: 'html', alt: 'Suite' },
  ])

  assert.deepEqual(selected.map(image => image.url), [
    'https://cache.marriott.com/content/dam/foo/si-nhasi-infinity-pool-32377.jpg',
    'https://cache.marriott.com/content/dam/foo/si-nhasi-presidential-suite-32738.jpg',
  ])
})
