// Chạy một hook bash với JSON trên stdin, đọc quyết định trả về.
// Hợp đồng hook: LUÔN exit 0. Chặn bằng permissionDecision trong JSON, không
// bằng mã thoát. Một hook exit khác 0 là hook hỏng, không phải hook chặn.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { REPO_ROOT } from '../lib/evidence'

const HOOKS_DIR = join(REPO_ROOT, '.claude', 'hooks')

// Mọi thư mục tạm mà repoGia() dựng ra, để dọn một lần khi tiến trình test kết
// thúc. Dọn ở process.on('exit') thay vì t.after() từng test vì repoGia không
// nhận test context — gọn hơn là phải sửa chữ ký mọi lời gọi hiện có. Nếu một
// test đỏ, thư mục của nó vẫn được dọn ở đây (khác phần "chấp nhận được nếu còn
// lại để soi" nêu trong yêu cầu review — nhưng dọn triệt để không vi phạm gì,
// chỉ là dọn sớm hơn mức tối thiểu được yêu cầu).
const THU_MUC_TAM: string[] = []
process.on('exit', () => {
  for (const dir of THU_MUC_TAM) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // Bỏ qua — dọn best-effort, không để lỗi dọn dẹp làm rối kết quả test.
    }
  }
})

export interface HookResult {
  denied: boolean
  reason: string
  systemMessage: string
}

export function runHook(name: string, input: unknown, projectDir: string = REPO_ROOT): HookResult {
  const r = spawnSync('bash', [join(HOOKS_DIR, name)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  })
  assert.equal(r.status, 0, `hook phải luôn exit 0, nhận ${r.status}. stderr: ${r.stderr}`)
  const out = r.stdout.trim()
  if (out === '') return { denied: false, reason: '', systemMessage: '' }
  const parsed = JSON.parse(out)
  return {
    denied: parsed.hookSpecificOutput?.permissionDecision === 'deny',
    reason: parsed.hookSpecificOutput?.permissionDecisionReason ?? '',
    systemMessage: parsed.systemMessage ?? '',
  }
}

/** Dựng input PreToolUse cho công cụ Bash. */
export function bashInput(command: string): unknown {
  return {
    session_id: 'test',
    transcript_path: '/dev/null',
    cwd: REPO_ROOT,
    permission_mode: 'ask',
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command },
  }
}

/**
 * Dựng một repo git tạm để test hook đọc trạng thái git thật.
 * `ahead` = số commit local đi trước origin/main.
 * `distFresh` = dist/index.html mới hơn src/ hay không.
 * `coOriginMain` = có tạo ref refs/remotes/origin/main hay không (mặc định
 * có). Đặt false để dựng ca "repo git nhưng chưa từng fetch origin/main".
 */
export function repoGia(opts: { ahead: number; distFresh: boolean; coOriginMain?: boolean }): string {
  const dir = mkdtempSync(join(tmpdir(), 'tourdao-hook-'))
  THU_MUC_TAM.push(dir)
  const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' })

  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'test')

  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'dist'), { recursive: true })
  writeFileSync(join(dir, 'src', 'a.astro'), '<p>a</p>')
  git('add', 'src/a.astro')
  git('commit', '-q', '-m', 'nen')

  // origin/main trỏ vào commit nền. Không cần remote thật.
  if (opts.coOriginMain ?? true) {
    git('update-ref', 'refs/remotes/origin/main', 'HEAD')
  }

  for (let i = 0; i < opts.ahead; i++) {
    writeFileSync(join(dir, 'src', `b${i}.astro`), `<p>b${i}</p>`)
    git('add', `src/b${i}.astro`)
    git('commit', '-q', '-m', `them-${i}`)
  }

  writeFileSync(join(dir, 'dist', 'index.html'), '<html></html>')
  if (!opts.distFresh) {
    // Đẩy mtime của dist về quá khứ để src/ trở thành mới hơn.
    const cu = new Date('2020-01-01T00:00:00Z')
    utimesSync(join(dir, 'dist', 'index.html'), cu, cu)
  }
  return dir
}

/** Một thư mục tạm rỗng, không phải repo git — để test nhánh fail-closed khi hook chạy ngoài mọi repo. */
export function thuMucKhongPhaiGit(): string {
  const dir = mkdtempSync(join(tmpdir(), 'tourdao-hook-non-git-'))
  THU_MUC_TAM.push(dir)
  return dir
}
