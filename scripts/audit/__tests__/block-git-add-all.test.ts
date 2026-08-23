import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runHook, bashInput } from './hook-harness'

const HOOK = 'block-git-add-all.sh'

const PHAI_CHAN = [
  'git add -A',
  'git add --all',
  'git add .',
  'git add -A .',
  'cd /tmp && git add -A',
  'git commit -am "sửa"',
  'git commit -a -m "sửa"',
]

for (const cmd of PHAI_CHAN) {
  test(`chặn: ${cmd}`, () => {
    const r = runHook(HOOK, bashInput(cmd))
    assert.equal(r.denied, true, `đáng lẽ phải chặn: ${cmd}`)
    assert.match(r.reason, /đường dẫn cụ thể/)
  })
}

const PHAI_CHO_QUA = [
  'git add src/components/Header.astro',
  'git add docs/plans/2026-08-23-bo-kiem-tu-dong.md scripts/audit/lib/evidence.ts',
  'git commit -m "sửa Header"',
  'git status',
  'git diff --stat',
  'npm run build',
  'echo "git add -A là điều cấm"',
]

for (const cmd of PHAI_CHO_QUA) {
  test(`cho qua: ${cmd}`, () => {
    assert.equal(runHook(HOOK, bashInput(cmd)).denied, false, `đáng lẽ phải cho qua: ${cmd}`)
  })
}

test('công cụ khác Bash thì không đụng tới', () => {
  const r = runHook(HOOK, {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: '/tmp/x', content: 'git add -A' },
  })
  assert.equal(r.denied, false)
})
