// Test thư viện bằng chứng. Điểm quan trọng nhất là test "nói ra số skip":
// đó là bài học DR-021 — cổng in [pass] cho phép kiểm nó không chạy được.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildReport, renderMarkdown, evidenceDir, exitCodeFor } from '../lib/evidence'
import type { Check } from '../lib/evidence'

const RAN_AT = '2026-08-23T04:05:06.000Z'

const BA_HANG: Check[] = [
  { id: 'A1', verdict: 'pass', detail: 'đã đối chiếu 3 file', drift: ['DR-022'] },
  { id: 'A2', verdict: 'fail', detail: 'thiếu postbuild-status.json', drift: ['DR-022'] },
  { id: 'A3', verdict: 'skip', detail: 'không đọc được registry', drift: ['DR-021'] },
]

test('buildReport đếm đúng ba hạng', () => {
  const r = buildReport('gate-auditor', RAN_AT, BA_HANG)
  assert.deepEqual(r.summary, { pass: 1, fail: 1, skip: 1 })
  assert.equal(r.agent, 'gate-auditor')
  assert.equal(r.ranAt, RAN_AT)
})

test('renderMarkdown nói ra số skip ở dòng kết luận (DR-021)', () => {
  const md = renderMarkdown(buildReport('gate-auditor', RAN_AT, BA_HANG))
  assert.match(md, /1 phép kiểm không chạy được/)
})

test('renderMarkdown im về skip khi không có skip', () => {
  const chi_dat: Check[] = [{ id: 'A1', verdict: 'pass', detail: 'ok', drift: ['DR-022'] }]
  const md = renderMarkdown(buildReport('x', RAN_AT, chi_dat))
  assert.equal(md.includes('không chạy được'), false)
  assert.match(md, /Kết luận: 1 đạt, 0 trượt\./)
})

test('renderMarkdown thoát ký tự | để không vỡ bảng', () => {
  const co_gach: Check[] = [{ id: 'A1', verdict: 'pass', detail: 'a | b', drift: [] }]
  const md = renderMarkdown(buildReport('x', RAN_AT, co_gach))
  assert.match(md, /a \\\| b/)
})

test('evidenceDir lấy ngày từ ranAt, không từ đồng hồ', () => {
  const dir = evidenceDir(buildReport('deploy-verifier', RAN_AT, []))
  assert.match(dir, /docs\/evidence\/2026-08-23-deploy-verifier$/)
})

test('exitCodeFor: skip không làm đỏ, fail làm đỏ', () => {
  const chi_skip: Check[] = [{ id: 'A3', verdict: 'skip', detail: 'x', drift: [] }]
  assert.equal(exitCodeFor(buildReport('x', RAN_AT, chi_skip)), 0)
  assert.equal(exitCodeFor(buildReport('x', RAN_AT, BA_HANG)), 1)
})
