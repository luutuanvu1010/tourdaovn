import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { runHook, bashInput } from './hook-harness'

const HOOK = 'guard-data-mutation.sh'

/** Thư mục dự án giả, có thể kèm cờ mở khoá mới hoặc đã hết hạn. */
function duAnGia(co: 'khong' | 'moi' | 'het-han'): string {
  const dir = mkdtempSync(join(tmpdir(), 'tourdao-data-'))
  mkdirSync(join(dir, '.claude'), { recursive: true })
  if (co !== 'khong') {
    const f = join(dir, '.claude', '.cho-phep-ghi-du-lieu')
    writeFileSync(f, '')
    if (co === 'het-han') {
      const cu = new Date(Date.now() - 60 * 60 * 1000) // 60 phút trước
      utimesSync(f, cu, cu)
    }
  }
  return dir
}

const LENH_GHI = [
  'npm --prefix scripts run publish:drafts',
  'npm --prefix scripts run patch:n5',
  'npm --prefix scripts run backfill:seo-meta',
  'npx sanity documents delete abc123',
  'npx sanity dataset delete production',
  'node --import ./node_modules/tsx/dist/esm/index.mjs migrate/doi-slug.ts',
]

for (const cmd of LENH_GHI) {
  test(`chặn khi không có cờ: ${cmd}`, () => {
    const r = runHook(HOOK, bashInput(cmd), duAnGia('khong'))
    assert.equal(r.denied, true, cmd)
    assert.match(r.reason, /cho-phep-ghi-du-lieu/)
  })
}

const LENH_DOC = [
  'npm --prefix scripts run precheck',
  'npm --prefix scripts run validate:post',
  'npx sanity documents get abc123',
  'npm run build',
  'git status',
]

for (const cmd of LENH_DOC) {
  test(`cho qua lệnh đọc: ${cmd}`, () => {
    assert.equal(runHook(HOOK, bashInput(cmd), duAnGia('khong')).denied, false, cmd)
  })
}

test('cờ mới thì mở khoá', () => {
  const r = runHook(HOOK, bashInput('npm --prefix scripts run publish:drafts'), duAnGia('moi'))
  assert.equal(r.denied, false)
})

test('cờ quá 30 phút thì coi như không có', () => {
  const r = runHook(HOOK, bashInput('npm --prefix scripts run publish:drafts'), duAnGia('het-han'))
  assert.equal(r.denied, true)
  assert.match(r.reason, /quá hạn|cho-phep-ghi-du-lieu/)
})

test('công cụ MCP Sanity ghi cũng bị chặn', () => {
  const r = runHook(
    HOOK,
    {
      hook_event_name: 'PreToolUse',
      tool_name: 'mcp__Sanity__delete_documents',
      tool_input: {},
    },
    duAnGia('khong'),
  )
  assert.equal(r.denied, true)
})

test('công cụ MCP Sanity đọc thì cho qua', () => {
  for (const t of ['mcp__Sanity__query_documents', 'mcp__Sanity__get_schema']) {
    const r = runHook(
      HOOK,
      { hook_event_name: 'PreToolUse', tool_name: t, tool_input: {} },
      duAnGia('khong'),
    )
    assert.equal(r.denied, false, t)
  }
})
