// Chạy một hook bash với JSON trên stdin, đọc quyết định trả về.
// Hợp đồng hook: LUÔN exit 0. Chặn bằng permissionDecision trong JSON, không
// bằng mã thoát. Một hook exit khác 0 là hook hỏng, không phải hook chặn.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { REPO_ROOT } from '../lib/evidence'

const HOOKS_DIR = join(REPO_ROOT, '.claude', 'hooks')

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
 */
export function repoGia(opts: { ahead: number; distFresh: boolean }): string {
  const dir = mkdtempSync(join(tmpdir(), 'tourdao-hook-'))
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
  git('update-ref', 'refs/remotes/origin/main', 'HEAD')

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
