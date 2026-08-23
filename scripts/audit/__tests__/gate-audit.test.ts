import { test } from 'node:test'
import assert from 'node:assert/strict'
import { duongDanTuEvidence, trichImportTuongDoi, kiemBangChung, kiemImport } from '../gate-audit'
import type { Control } from '../gate-audit'

test('duongDanTuEvidence lấy đường dẫn ở đầu chuỗi', () => {
  assert.equal(
    duongDanTuEvidence('scripts/reports/postbuild-status.json mục R3/R4'),
    'scripts/reports/postbuild-status.json',
  )
})

test('duongDanTuEvidence trả null khi evidence là lời hứa chứ không phải đường dẫn', () => {
  assert.equal(
    duongDanTuEvidence('chưa có — sẽ là scripts/reports/validator-status.json khi ND-005 trả xong'),
    null,
  )
  assert.equal(duongDanTuEvidence(''), null)
})

test('GA1 trượt khi control live dẫn bằng chứng không tồn tại (DR-022)', () => {
  const controls: Control[] = [
    { id: 'R3', status: 'live', evidence: 'scripts/reports/postbuild-status.json mục R3' },
  ]
  const checks = kiemBangChung(controls, () => false)
  assert.equal(checks.length, 1)
  assert.equal(checks[0].verdict, 'fail')
  assert.match(checks[0].detail, /R3/)
  assert.deepEqual(checks[0].drift, ['DR-022'])
})

test('GA1 đạt khi file bằng chứng tồn tại', () => {
  const controls: Control[] = [
    { id: 'I6', status: 'live', evidence: 'scripts/reports/postbuild-status.json mục I6' },
  ]
  assert.equal(kiemBangChung(controls, () => true)[0].verdict, 'pass')
})

test('GA1 trượt khi control live không dẫn được đường dẫn nào', () => {
  const controls: Control[] = [{ id: 'X1', status: 'live', evidence: 'đã kiểm bằng mắt' }]
  const c = kiemBangChung(controls, () => true)[0]
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /không dẫn được đường dẫn/)
})

test('GA1 bỏ qua control gap — chúng không khai là đang chạy', () => {
  const controls: Control[] = [{ id: 'I1', status: 'gap', evidence: 'chưa có' }]
  assert.deepEqual(kiemBangChung(controls, () => false), [])
})

test('trichImportTuongDoi bắt import tương đối, bỏ qua import gói', () => {
  const src = [
    "import { readFileSync } from 'node:fs'",
    "import { parse } from 'yaml'",
    "import { gate } from '../../shared/gates/index.js'",
    "import type { X } from './types'",
    'const y = 1',
  ].join('\n')
  assert.deepEqual(trichImportTuongDoi(src), ['../../shared/gates/index.js', './types'])
})

test('GA4 trượt khi import tương đối không giải được (DR-015)', () => {
  const files = [
    { path: 'scripts/validators/i1-i19.ts', source: "import { g } from '../../shared/gates/index.js'" },
  ]
  const c = kiemImport(files, () => false)[0]
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /shared\/gates/)
  assert.deepEqual(c.drift, ['DR-015'])
})

test('GA4 đạt khi mọi import giải được', () => {
  const files = [{ path: 'scripts/validators/x.ts', source: "import { g } from './y'" }]
  assert.equal(kiemImport(files, () => true)[0].verdict, 'pass')
})
