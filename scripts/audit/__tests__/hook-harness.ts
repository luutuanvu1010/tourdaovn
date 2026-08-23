// Chạy một hook bash với JSON trên stdin, đọc quyết định trả về.
// Hợp đồng hook: LUÔN exit 0. Chặn bằng permissionDecision trong JSON, không
// bằng mã thoát. Một hook exit khác 0 là hook hỏng, không phải hook chặn.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { REPO_ROOT } from '../lib/evidence'

const HOOKS_DIR = join(REPO_ROOT, '.claude', 'hooks')

export interface HookResult {
  denied: boolean
  reason: string
  systemMessage: string
}

export function runHook(name: string, input: unknown): HookResult {
  const r = spawnSync('bash', [join(HOOKS_DIR, name)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: REPO_ROOT },
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
