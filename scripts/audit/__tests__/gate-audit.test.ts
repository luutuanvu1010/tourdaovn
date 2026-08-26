import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chdir, cwd as layThuMucLamViecHienHanh } from 'node:process'
import {
  duongDanTuEvidence,
  duongDanBaoCaoTuLoiHua,
  trichImportTuongDoi,
  kiemBangChung,
  kiemImport,
  kiemGapConChayThat,
  kiemLiveCoTrongBaoCao,
} from '../gate-audit'
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

// --- GA6: chiều ngược của GA1 — control khai gap mà thực ra đang chạy ---

test('duongDanBaoCaoTuLoiHua rút được đường dẫn file báo cáo trong câu lời hứa', () => {
  assert.equal(
    duongDanBaoCaoTuLoiHua('chưa có — sẽ là scripts/reports/validator-status.json mục I1 khi ND-005 trả xong'),
    'scripts/reports/validator-status.json',
  )
})

test('duongDanBaoCaoTuLoiHua trả null khi câu không nhắc file báo cáo nào', () => {
  assert.equal(duongDanBaoCaoTuLoiHua('đã kiểm bằng mắt, chưa có file nào'), null)
})

test('GA6 trượt khi control khai gap nhưng file evidence đã có mục mang đúng id — sổ chưa cập nhật', () => {
  const controls: Control[] = [
    {
      id: 'I1',
      status: 'gap',
      evidence: 'chưa có — sẽ là scripts/reports/validator-status.json mục I1 khi ND-005 trả xong',
    },
  ]
  // vị từ giả: file tồn tại VÀ có mục I1 — tức control này thực ra đang chạy.
  const c = kiemGapConChayThat(controls, () => true)[0]
  assert.equal(c.verdict, 'fail')
  assert.equal(c.id, 'GA6/I1')
  assert.match(c.detail, /I1/)
  assert.match(c.detail, /gap/)
})

test('GA6 đạt khi control khai gap và file evidence chưa có mục nào mang id đó — khớp lời khai', () => {
  const controls: Control[] = [
    {
      id: 'I2',
      status: 'gap',
      evidence: 'chưa có — sẽ là scripts/reports/validator-status.json mục I2 khi ND-005 trả xong',
    },
  ]
  const c = kiemGapConChayThat(controls, () => false)[0]
  assert.equal(c.verdict, 'pass')
  assert.equal(c.id, 'GA6/I2')
})

test('GA6 skip khi evidence không nhắc file báo cáo nào để đối chiếu', () => {
  const controls: Control[] = [{ id: 'I3', status: 'gap', evidence: 'đã kiểm bằng mắt' }]
  const c = kiemGapConChayThat(controls, () => true)[0]
  assert.equal(c.verdict, 'skip')
})

test('GA6 bỏ qua control live — chúng không khai là gap', () => {
  const controls: Control[] = [{ id: 'I6', status: 'live', evidence: 'scripts/reports/postbuild-status.json mục I6' }]
  assert.deepEqual(kiemGapConChayThat(controls, () => true), [])
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

// ── GA3: control live phải có mục trong báo cáo của CHẶNG nó chạy ──
// Hồi quy cho lỗi bắt được khi thêm I20 (ADR-0028): bản cũ đóng cứng
// postbuild-status.json, nên mọi control live ở chặng pre-build trượt vĩnh viễn.

const VALIDATOR_STATUS = 'scripts/reports/validator-status.json'
const POSTBUILD_STATUS = 'scripts/reports/postbuild-status.json'

/** Vị từ giả: chỉ file `duongDanCo` mới có mục mang `idCo`. */
const chiCo = (duongDanCo: string, idCo: string) =>
  (duongDan: string, id: string) => duongDan === duongDanCo && id === idCo

test('GA3 tìm control pre-build trong validator-status.json, không phải postbuild', () => {
  const controls: Control[] = [{ id: 'I20', status: 'live', stage: 'pre-build' }]
  const checks = kiemLiveCoTrongBaoCao(controls, chiCo(VALIDATOR_STATUS, 'I20'))
  assert.equal(checks.length, 1)
  assert.equal(checks[0].verdict, 'pass')
  assert.match(checks[0].detail, /validator-status\.json/)
})

test('GA3 trượt khi control pre-build chưa có mục trong validator-status.json', () => {
  const controls: Control[] = [{ id: 'I20', status: 'live', stage: 'pre-build' }]
  const checks = kiemLiveCoTrongBaoCao(controls, () => false)
  assert.equal(checks[0].verdict, 'fail')
  assert.match(checks[0].detail, /I20/)
  assert.match(checks[0].detail, /validator-status\.json/)
  assert.deepEqual(checks[0].drift, ['DR-022'])
})

test('GA3 KHÔNG chấp nhận control pre-build chỉ vì nó có mặt trong postbuild-status.json', () => {
  const controls: Control[] = [{ id: 'I20', status: 'live', stage: 'pre-build' }]
  const checks = kiemLiveCoTrongBaoCao(controls, chiCo(POSTBUILD_STATUS, 'I20'))
  assert.equal(checks[0].verdict, 'fail')
})

test('GA3 giữ nguyên hành vi cũ cho control post-build', () => {
  const controls: Control[] = [{ id: 'R3', status: 'live', stage: 'post-build' }]
  assert.equal(kiemLiveCoTrongBaoCao(controls, chiCo(POSTBUILD_STATUS, 'R3'))[0].verdict, 'pass')
  assert.equal(kiemLiveCoTrongBaoCao(controls, () => false)[0].verdict, 'fail')
})

test('GA3 bỏ qua control live khai stage lạ hoặc thiếu stage, không tự phán đoán', () => {
  const controls: Control[] = [
    { id: 'X1', status: 'live', stage: 'runtime' },
    { id: 'X2', status: 'live' },
  ]
  const checks = kiemLiveCoTrongBaoCao(controls, () => true)
  assert.equal(checks.length, 2)
  assert.equal(checks[0].verdict, 'skip')
  assert.match(checks[0].detail, /runtime/)
  assert.equal(checks[1].verdict, 'skip')
  assert.match(checks[1].detail, /thiếu/)
})

test('GA3 không đụng tới control khai gap', () => {
  const controls: Control[] = [{ id: 'I19', status: 'gap', stage: 'pre-build' }]
  assert.deepEqual(kiemLiveCoTrongBaoCao(controls, () => false), [])
})
