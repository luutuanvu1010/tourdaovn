import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chdir, cwd as layThuMucLamViecHienHanh } from 'node:process'
import { duongDanTuEvidence, trichImportTuongDoi, kiemBangChung, kiemImport } from '../gate-audit'
import type { Control } from '../gate-audit'
import { REPO_ROOT } from '../lib/evidence'

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

// Từ đây trở xuống dùng vị từ tồn-tại THẬT (đọc đĩa, neo vào REPO_ROOT), không
// phải hằng số () => true / () => false. Hai ca trước không chạm vào phép tính
// đường dẫn thật của kiemImport nên không thể bắt được lỗi: kiemImport từng
// dùng resolve(dirname(f.path), spec), mà f.path là đường dẫn TƯƠNG ĐỐI so với
// gốc repo — resolve() với hai đối số tương đối neo ngầm vào thư mục làm việc
// hiện hành, nên kết quả lệch một cấp khi bị gọi qua `npm --prefix scripts`
// (đổi thư mục làm việc sang scripts/). Hai test dưới đây chạm đúng chỗ đó.
const tonTaiThat = (p: string) => existsSync(resolve(REPO_ROOT, p))

test('GA4 dùng vị từ tồn-tại thật: i1-i19.ts nhập shared/gates/index.js — file có thật, phải đạt', () => {
  const files = [
    { path: 'scripts/validators/i1-i19.ts', source: "import { g } from '../../shared/gates/index.js'" },
  ]
  assert.equal(kiemImport(files, tonTaiThat)[0].verdict, 'pass')
})

test('GA4 cho kết quả giống hệt nhau bất kể chạy từ thư mục làm việc nào (bẫy tái diễn DR-021 ngay trong gate-auditor)', () => {
  const files = [
    { path: 'scripts/validators/i1-i19.ts', source: "import { g } from '../../shared/gates/index.js'" },
  ]

  const truoc = layThuMucLamViecHienHanh()
  try {
    chdir(REPO_ROOT)
    const tuGocRepo = kiemImport(files, tonTaiThat)

    chdir(resolve(REPO_ROOT, 'scripts'))
    const tuThuMucScripts = kiemImport(files, tonTaiThat)

    assert.deepEqual(tuThuMucScripts, tuGocRepo)
    assert.equal(tuGocRepo[0].verdict, 'pass')
  } finally {
    chdir(truoc)
  }
})
