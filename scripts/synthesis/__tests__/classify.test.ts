// Classify test (N5b) — deterministic, KHÔNG gọi LLM/Sanity/HTTP.
// Chứng minh module synthesis tự sinh field phân loại đúng enum đóng (placeType/attractionType/
// specialtyType) và validator gác I12:
//   (a) LLM trả enum hợp lệ → map đúng (chuẩn hoá hoa/space);
//   (b) LLM trả giá trị rác → để trống + cảnh báo, KHÔNG ghi rác (R1/R2);
//   (c) thiếu → validator cảnh báo I12 (không error);
//   + whitelist: placeType KHÔNG rò sang attraction;
//   + defense-in-depth: giá trị ngoài enum lọt thẳng vào mapped → validator FAIL;
//   + R3: attraction nhóm venue → cảnh báo cần officialSource.
// Enum trích NGUYÊN từ cms/schemas/{place,attraction,specialty}.ts (nguồn chính xác).
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mapFields } from '../field-mapper'
import { validateOutput } from '../output-validator'
import { fieldsFor } from '../entity-fields'

// ── (a) enum hợp lệ → map đúng ───────────────────────────────────────────────
test('classify (a) — placeType hợp lệ map đúng', () => {
  const { mapped, warnings } = mapFields('place', { title: 'Hòn Mun', placeType: 'island' })
  assert.equal(mapped.placeType, 'island')
  assert.ok(!warnings.some(w => w.includes('placeType')), 'không cảnh báo khi enum hợp lệ')
})

test('classify (a) — placeType chữ HOA + khoảng trắng được chuẩn hoá về enum', () => {
  const { mapped } = mapFields('place', { title: 'X', placeType: '  ISLAND ' })
  assert.equal(mapped.placeType, 'island')
})

test('classify (a) — attractionType hợp lệ map đúng', () => {
  const { mapped } = mapFields('attraction', { title: 'X', attractionType: 'temple' })
  assert.equal(mapped.attractionType, 'temple')
})

test('classify (a) — specialtyType hợp lệ map đúng', () => {
  const { mapped } = mapFields('specialty', { title: 'X', specialtyType: 'product' })
  assert.equal(mapped.specialtyType, 'product')
})

// ── (b) rác → để trống + cảnh báo, KHÔNG ghi rác ─────────────────────────────
test('classify (b) — placeType ngoài enum → bỏ + cảnh báo, KHÔNG ghi rác', () => {
  const { mapped, warnings } = mapFields('place', { title: 'X', placeType: 'mountain' })
  assert.equal(mapped.placeType, undefined, 'giá trị rác KHÔNG vào mapped')
  assert.ok(warnings.some(w => w.includes('placeType')), 'có cảnh báo placeType ngoài enum')
})

test('classify (b) — attractionType ngoài enum → bỏ + cảnh báo', () => {
  const { mapped, warnings } = mapFields('attraction', { title: 'X', attractionType: 'zoo' })
  assert.equal(mapped.attractionType, undefined)
  assert.ok(warnings.some(w => w.includes('attractionType')))
})

test('classify (b) — specialtyType ngoài enum → bỏ + cảnh báo', () => {
  const { mapped, warnings } = mapFields('specialty', { title: 'X', specialtyType: 'beverage' })
  assert.equal(mapped.specialtyType, undefined)
  assert.ok(warnings.some(w => w.includes('specialtyType')))
})

// ── whitelist: placeType KHÔNG rò sang attraction ────────────────────────────
test('classify — placeType thuộc whitelist place, KHÔNG thuộc attraction', () => {
  assert.ok(fieldsFor('place').includes('placeType'), 'place có placeType trong whitelist')
  assert.ok(!fieldsFor('attraction').includes('placeType'), 'attraction KHÔNG có placeType')

  const { mapped, warnings } = mapFields('attraction', { title: 'X', placeType: 'island' })
  assert.equal(mapped.placeType, undefined, 'placeType bị loại khỏi attraction (ngoài whitelist)')
  assert.ok(warnings.some(w => w.includes('placeType')), 'cảnh báo placeType ngoài whitelist attraction')
})

// ── (c) thiếu → validator cảnh báo I12 (không error) ─────────────────────────
test('classify (c) — place thiếu placeType → cảnh báo I12, KHÔNG error', () => {
  const { mapped } = mapFields('place', {
    title: 'Hòn Mun', summary: 'x', body: 'y',
    sameAs: ['https://www.wikidata.org/wiki/Q123'],
    geo: { lat: 12.1, lng: 109.2 },
  })
  const v = validateOutput('place', mapped)
  assert.ok(
    v.warnings.some(w => w.includes('placeType') && w.includes('I12')),
    'cảnh báo thiếu placeType (I12)',
  )
  assert.ok(!v.errors.some(e => e.includes('placeType')), 'thiếu placeType KHÔNG phải error')
})

test('classify (c) — place có placeType hợp lệ → KHÔNG cảnh báo placeType', () => {
  const { mapped } = mapFields('place', {
    title: 'Hòn Mun', summary: 'x', body: 'y', placeType: 'island',
    sameAs: ['https://www.wikidata.org/wiki/Q123'],
    geo: { lat: 12.1, lng: 109.2 },
  })
  const v = validateOutput('place', mapped)
  assert.ok(!v.warnings.some(w => w.includes('placeType')), 'có placeType → không cảnh báo')
})

test('classify (c) — specialty thiếu specialtyType → cảnh báo I12', () => {
  const v = validateOutput('specialty', {
    title: { vi: 'X' }, summary: { vi: 's' }, slug: { vi: { current: 'x' } },
    sameAs: ['https://vi.wikipedia.org/wiki/X'],
  })
  assert.ok(v.warnings.some(w => w.includes('specialtyType') && w.includes('I12')))
})

// ── defense-in-depth: enum rác lọt thẳng vào mapped → validator FAIL ─────────
test('classify — placeType ngoài enum lọt thẳng vào mapped → validator FAIL', () => {
  const v = validateOutput('place', {
    title: { vi: 'X' }, summary: { vi: 'x' }, slug: { vi: { current: 'x' } },
    placeType: 'mountain',
    sameAs: ['https://www.wikidata.org/wiki/Q1'],
    geo: { lat: 12, lng: 109 },
  })
  assert.equal(v.ok, false, 'placeType ngoài enum → FAIL')
  assert.ok(v.errors.some(e => e.includes('placeType')), 'error placeType ngoài enum')
})

// ── R3: attraction nhóm venue → cảnh báo cần officialSource ────────────────
test('classify (R3) — attraction venue (theme-park) cảnh báo cần officialSource', () => {
  const { mapped } = mapFields('attraction', {
    title: 'X', summary: 's', body: 'b', attractionType: 'theme-park',
    geo: { lat: 12, lng: 109 },
  })
  const v = validateOutput('attraction', mapped)
  assert.ok(
    v.warnings.some(w => /officialSource/.test(w)),
    'cảnh báo venue cần officialSource',
  )
})
