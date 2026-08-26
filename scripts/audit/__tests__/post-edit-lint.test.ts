// Test phần định tuyến và chống dội bằng DẤU VẾT THẬT: package.json giả có
// script `check` chỉ `touch` một tệp, không gọi astro. Trước đây thư mục giả
// KHÔNG có package.json nên mọi ca đều thoát sớm ở cửa cuối cùng ("có
// package.json không") bất kể ba cửa lọc trước đó đúng hay sai — xoá hẳn khối
// lọc đường dẫn hay khối chống dội, test vẫn xanh vì test chỉ nhìn systemMessage
// rỗng, không chứng minh được hook có thật sự CHẠY tới npm run check hay không.
// Sửa bằng cách khẳng định trên sự tồn tại của dấu vết đó.
//
// KHÔNG test bản thân `astro check` thật — chạy nó mất ~20 giây và phụ thuộc
// trạng thái mã nguồn, không tất định. Đường đó kiểm bằng tay, xem
// task-5-report.md.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { runHook } from './hook-harness'
import { REPO_ROOT } from '../lib/evidence'

const HOOK = 'post-edit-lint.sh'
const HOOK_PATH = join(REPO_ROOT, '.claude', 'hooks', HOOK)
const DAU_VET = '.da-chay-check'

// hook-harness.ts chỉ dọn thư mục tạm nó tự dựng (repoGia/thuMucKhongPhaiGit),
// không biết về thư mục duAnGia() ở file này — nên tự dọn riêng, cùng cách.
const THU_MUC_TAM: string[] = []
process.on('exit', () => {
  for (const dir of THU_MUC_TAM) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // Dọn best-effort — không để lỗi dọn dẹp làm rối kết quả test.
    }
  }
})

/**
 * Dựng thư mục dự án giả có `package.json` THẬT: script `check` chỉ `touch`
 * một tệp dấu vết (KHÔNG gọi astro). Test khẳng định trên sự tồn tại của tệp
 * này để chứng minh hook có thật sự chạy tới `npm run check` hay không.
 */
function duAnGia(coDauChongDoi: boolean): string {
  const dir = mkdtempSync(join(tmpdir(), 'tourdao-lint-'))
  THU_MUC_TAM.push(dir)
  mkdirSync(join(dir, '.claude'), { recursive: true })
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts: { check: `touch ${DAU_VET}` } }))
  if (coDauChongDoi) writeFileSync(join(dir, '.claude', '.last-astro-check'), '')
  return dir
}

function coDauVet(dir: string): boolean {
  return existsSync(join(dir, DAU_VET))
}

function editInput(filePath: string, toolName = 'Edit'): unknown {
  return {
    hook_event_name: 'PostToolUse',
    tool_name: toolName,
    tool_input: { file_path: filePath, old_string: 'a', new_string: 'b' },
  }
}

test('file .astro hợp lệ trong src/, không dấu chống dội: hook chạy thật tới npm run check', () => {
  const dir = duAnGia(false)
  const r = runHook(HOOK, editInput(join(dir, 'src/components/Header.astro')), dir)
  assert.equal(coDauVet(dir), true, 'dấu vết phải xuất hiện — hook phải chạy tới npm run check')
  assert.equal(r.systemMessage, '')
})

test('dấu chống dội còn mới: hook không chạy lại npm run check', () => {
  const dir = duAnGia(true)
  const r = runHook(HOOK, editInput(join(dir, 'src/components/Header.astro')), dir)
  assert.equal(coDauVet(dir), false, 'dấu vết không được xuất hiện — dấu chống dội phải chặn')
  assert.equal(r.systemMessage, '')
})

test('file ngoài src/ thì không chạy gì', () => {
  for (const f of ['docs/plans/x.md', 'README.md', 'scripts/audit/lib/evidence.ts']) {
    const dir = duAnGia(false)
    const r = runHook(HOOK, editInput(join(dir, f)), dir)
    assert.equal(coDauVet(dir), false, f)
    assert.equal(r.systemMessage, '', f)
  }
})

test('file trong src/ nhưng đuôi không liên quan thì không chạy gì', () => {
  const dir = duAnGia(false)
  const r = runHook(HOOK, editInput(join(dir, 'src/x.md')), dir)
  assert.equal(coDauVet(dir), false)
  assert.equal(r.systemMessage, '')
})

test('tool_name không phải Edit/Write/MultiEdit thì không chạy gì', () => {
  const dir = duAnGia(false)
  const r = runHook(HOOK, editInput(join(dir, 'src/components/Header.astro'), 'Read'), dir)
  assert.equal(coDauVet(dir), false)
  assert.equal(r.systemMessage, '')
})

test('hook không bao giờ chặn', () => {
  const dir = duAnGia(false)
  const r = runHook(HOOK, editInput(join(dir, 'src/components/Header.astro')), dir)
  assert.equal(r.denied, false)
})

// --- Ca biên: đường dẫn giả mạo / thiếu điều kiện ---

test('file_path tương đối (không tuyệt đối) thì không chạy gì', () => {
  const dir = duAnGia(false)
  const r = runHook(HOOK, editInput('src/components/Header.astro'), dir)
  assert.equal(coDauVet(dir), false)
  assert.equal(r.systemMessage, '')
})

test('file_path chứa /src/ nhưng nằm ngoài CLAUDE_PROJECT_DIR thì không chạy gì', () => {
  const dir = duAnGia(false)
  const noiKhac = mkdtempSync(join(tmpdir(), 'tourdao-lint-ngoai-'))
  THU_MUC_TAM.push(noiKhac)
  mkdirSync(join(noiKhac, 'src'), { recursive: true })
  const r = runHook(HOOK, editInput(join(noiKhac, 'src/a.astro')), dir)
  assert.equal(coDauVet(dir), false)
  assert.equal(r.systemMessage, '')
})

test('file_path có tiền tố giả mạo kiểu <project>-evil/src/... thì không chạy gì', () => {
  const dir = duAnGia(false)
  const r = runHook(HOOK, editInput(`${dir}-evil/src/a.astro`), dir)
  assert.equal(coDauVet(dir), false)
  assert.equal(r.systemMessage, '')
})

test('tool_input không có file_path thì không chạy gì', () => {
  const dir = duAnGia(false)
  const input = {
    hook_event_name: 'PostToolUse',
    tool_name: 'Edit',
    tool_input: { old_string: 'a', new_string: 'b' },
  }
  const r = runHook(HOOK, input, dir)
  assert.equal(coDauVet(dir), false)
  assert.equal(r.systemMessage, '')
})

test('CLAUDE_PROJECT_DIR không được đặt thì không chạy gì', () => {
  const dir = duAnGia(false)
  const env = { ...process.env }
  delete env.CLAUDE_PROJECT_DIR
  const r = spawnSync('bash', [HOOK_PATH], {
    input: JSON.stringify(editInput(join(dir, 'src/components/Header.astro'))),
    encoding: 'utf8',
    env,
  })
  assert.equal(r.status, 0)
  assert.equal(r.stdout.trim(), '')
  assert.equal(coDauVet(dir), false)
})
