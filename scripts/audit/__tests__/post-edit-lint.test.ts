// Test phần định tuyến và chống dội. KHÔNG test bản thân `astro check` — chạy nó
// mất ~20 giây và phụ thuộc trạng thái mã nguồn, không tất định. Đường đó kiểm
// bằng tay ở Step 4.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { runHook } from './hook-harness'

const HOOK = 'post-edit-lint.sh'

function duAnGia(coDauChongDoi: boolean): string {
  const dir = mkdtempSync(join(tmpdir(), 'tourdao-lint-'))
  mkdirSync(join(dir, '.claude'), { recursive: true })
  mkdirSync(join(dir, 'src'), { recursive: true })
  if (coDauChongDoi) writeFileSync(join(dir, '.claude', '.last-astro-check'), '')
  return dir
}

function editInput(filePath: string): unknown {
  return {
    hook_event_name: 'PostToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: filePath, old_string: 'a', new_string: 'b' },
  }
}

test('file ngoài src/ thì không chạy gì', () => {
  const dir = duAnGia(false)
  for (const f of ['docs/plans/x.md', 'README.md', 'scripts/audit/lib/evidence.ts']) {
    const r = runHook(HOOK, editInput(join(dir, f)), dir)
    assert.equal(r.systemMessage, '', f)
  }
})

test('file trong src/ nhưng đuôi không liên quan thì không chạy gì', () => {
  const dir = duAnGia(false)
  const r = runHook(HOOK, editInput(join(dir, 'src/assets/ghi-chu.md')), dir)
  assert.equal(r.systemMessage, '')
})

test('dấu chống dội còn mới thì bỏ qua', () => {
  const dir = duAnGia(true)
  const r = runHook(HOOK, editInput(join(dir, 'src/components/Header.astro')), dir)
  assert.equal(r.systemMessage, '')
})

test('hook không bao giờ chặn', () => {
  const dir = duAnGia(false)
  const r = runHook(HOOK, editInput(join(dir, 'src/components/Header.astro')), dir)
  assert.equal(r.denied, false)
})
