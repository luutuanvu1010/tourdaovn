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

/** Thư mục dự án giả với cờ có tuổi chính xác `phut` phút — để ôm sát biên 30 phút. */
function duAnGiaCoTuoi(phut: number): string {
  const dir = mkdtempSync(join(tmpdir(), 'tourdao-data-bien-'))
  mkdirSync(join(dir, '.claude'), { recursive: true })
  const f = join(dir, '.claude', '.cho-phep-ghi-du-lieu')
  writeFileSync(f, '')
  const t = new Date(Date.now() - phut * 60 * 1000)
  utimesSync(f, t, t)
  return dir
}

const LENH_GHI = [
  'npm --prefix scripts run publish:drafts',
  'npm --prefix scripts run patch:n5',
  'npm --prefix scripts run backfill:seo-meta',
  'npx sanity documents delete abc123',
  'npx sanity dataset delete production',
  'node --import ./node_modules/tsx/dist/esm/index.mjs migrate/doi-slug.ts',
  // Vòng sửa 1 — lỗ hổng reviewer tìm thấy:
  'npm --prefix scripts run translate',
  'npx sanity@latest documents delete abc',
  'node --import ./node_modules/tsx/dist/esm/index.mjs migrate/migrate-highlights-reverse.mjs',
  'node --import ./node_modules/tsx/dist/esm/index.mjs seed/seed-sample.ts',
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

test('cờ 29 phút vẫn còn hiệu lực (ôm sát biên 30 phút)', () => {
  const r = runHook(HOOK, bashInput('npm --prefix scripts run publish:drafts'), duAnGiaCoTuoi(29))
  assert.equal(r.denied, false)
})

test('cờ 31 phút coi như hết hạn (ôm sát biên 30 phút)', () => {
  const r = runHook(HOOK, bashInput('npm --prefix scripts run publish:drafts'), duAnGiaCoTuoi(31))
  assert.equal(r.denied, true)
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

// Vòng sửa 1 — danh sách chặn theo tiền tố để lọt các công cụ không khớp mẫu
// quen thuộc. Đảo sang danh sách cho phép: mọi công cụ dưới đây phải bị chặn
// dù không "ghi" theo tên gọi hiển nhiên.
const MCP_GHI_AN_DANH = [
  'mcp__Sanity__run_sanity_cli', // cổng chạy CLI tuỳ ý, gồm documents delete / dataset delete
  'mcp__Sanity__add_cors_origin',
  'mcp__Sanity__generate_image',
  'mcp__Sanity__mot_cong_cu_bia_ra_chua_tung_ton_tai', // chứng minh danh sách CHO PHÉP, không phải danh sách CHẶN
]

for (const t of MCP_GHI_AN_DANH) {
  test(`công cụ MCP Sanity không nằm trong danh sách cho phép thì bị chặn: ${t}`, () => {
    const r = runHook(
      HOOK,
      { hook_event_name: 'PreToolUse', tool_name: t, tool_input: {} },
      duAnGia('khong'),
    )
    assert.equal(r.denied, true, t)
  })
}

test('công cụ MCP Sanity đọc thì cho qua', () => {
  for (const t of [
    'mcp__Sanity__query_documents',
    'mcp__Sanity__get_schema',
    'mcp__Sanity__list_datasets',
    'mcp__Sanity__whoami',
    'mcp__Sanity__cors_origins_list',
  ]) {
    const r = runHook(
      HOOK,
      { hook_event_name: 'PreToolUse', tool_name: t, tool_input: {} },
      duAnGia('khong'),
    )
    assert.equal(r.denied, false, t)
  }
})
