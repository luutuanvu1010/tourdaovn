# Bộ kiểm tự động — 10 subagent + 4 hook — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng 10 subagent Claude Code và 4 hook cho `tourdaovn`, trong đó phần kiểm định lượng nằm trong script có test, còn subagent chỉ là lớp vỏ gọi script và diễn giải.

**Architecture:** Ba lớp. (1) `scripts/audit/` — script kiểm thuần, không phụ thuộc Claude, có test `node:test`, ghi ra file bằng chứng JSON + Markdown. (2) `.claude/agents/*.md` — 10 định nghĩa subagent; loại định lượng chỉ gọi script lớp 1, loại phán đoán làm việc bằng đọc mã và trình duyệt. (3) `.claude/hooks/*.sh` — 4 hook bash chặn cứng ở `PreToolUse`/`PostToolUse`, khuôn giống hook đang chạy thật ở `vatengine`.

Lý do tách lớp: `CLAUDE.md` §6 nói *"Mặc định của cổng là không đạt nếu không có bằng chứng"* và *"Không dùng lời khẳng định chung chung kiểu 'đã kiểm xong'"*. Một subagent tự viết "đã kiểm, đạt" chính là lời tự khai mà `GOVERNANCE` 5.1 cấm. Nên mọi kết luận phải quy về một artifact trên đĩa, và artifact đó phải do script sinh ra chứ không do văn xuôi của agent.

**Tech Stack:** Node 22 ESM, TypeScript 5.7 chạy qua `tsx`, `node:test`, bash + `jq`, Astro 5, Cloudflare Workers, Sanity client v6.

**Spec:** Không có tài liệu spec riêng. Nguồn yêu cầu là hội thoại chốt ngày 2026-08-23 và bằng chứng thực nghiệm trong `docs/DRIFT_LOG.md` (43 mục, 16 đang mở). Mỗi phép kiểm dưới đây phải truy được về **một trong ba** nguồn: một mã `DR-nnn` trong sổ drift, một `id` control trong `docs/governance/control-registry.yaml`, hoặc chuỗi `yêu cầu 2026-08-23` cho phép kiểm đến thẳng từ yêu cầu của chủ dự án. Phép kiểm không truy được về nguồn nào là phạm vi nở, phải dừng và hỏi.

---

## Global Constraints

Mọi task đều mang các ràng buộc này, không lặp lại trong từng task.

- **Cấm `process.cwd()` trong `scripts/`.** Xác định gốc repo từ `import.meta.url`. Vi phạm làm `npm run check:cwd` đỏ. Nguồn: `scripts/check-no-process-cwd.sh`.
- **Kiểu import: extensionless.** `tsconfig.json` đặt `moduleResolution: "bundler"`. Viết `import { x } from '../lib/evidence'`, không viết `'../lib/evidence.ts'` cũng không `'.js'`.
- **`strict: true`, target ES2022.** Không dùng `as any` để lấp kiểu — chính `as any` là nội dung của `DR-028`.
- **Test chạy bằng** `npm --prefix scripts test`. Script đó hiện là `tsx --test synthesis/__tests__/*.test.ts` và **phải được mở rộng ở Task 1** để bao luôn `audit/__tests__/`.
- **Không có thời gian ẩn trong hàm thuần.** Mọi hàm nhận `ranAt: string` từ ngoài vào, không gọi `new Date()` bên trong. Lý do: test phải tất định.
- **Ngôn ngữ đầu ra là tiếng Việt.** Toàn bộ repo dùng tiếng Việt cho thông điệp người đọc, kể cả thông điệp chặn của hook.
- **Không tạo nguồn sự thật thứ hai.** `CONSTITUTION` cấm. Script kiểm được phép *đọc* `docs/governance/control-registry.yaml`, `docs/core-specs/`, `cms/schemas/`; không được chép giá trị từ đó thành hằng số riêng.
- **`build:ci` = `npm run build`, không chạy validator nào.** Đừng viết bất cứ thứ gì giả định CI sẽ chặn. Mọi cổng ở đây là lệnh gọi tay hoặc hook cục bộ.
- **Hook dùng `bash` + `jq`**, đọc JSON từ stdin, đường dẫn qua `${CLAUDE_PROJECT_DIR}`. Khuôn mẫu tham chiếu: `/Users/tuanbao/Documents/projects/vatengine/.claude/hooks/block-dangerous.sh`.
- **Hook chặn bằng** `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"..."}}` rồi `exit 0`. Không chặn bằng exit code khác 0.
- **Đầu ra bằng chứng** đặt tại `docs/evidence/<YYYY-MM-DD>-<tên-agent>/report.json` và `report.md`.

## Giới hạn đã biết, đã chọn cách đi vòng

**Hook không biết nó đang chạy trong subagent nào.** Đã xác minh: JSON vào hook chỉ có `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, `tool_name`, `tool_input`. Không có trường tên agent.

Hệ quả: yêu cầu ban đầu *"hook chỉ cho phép subagent `data-reader` đọc"* **không thực hiện được đúng nghĩa đen**. Cách đi vòng đã chọn, hai lớp:

1. `data-reader.md` khai `tools:` tối thiểu — không có `Write`, không có `Edit`.
2. `guard-data-mutation.sh` chặn lệnh ghi dữ liệu **cho mọi agent, kể cả phiên chính**, trừ khi lệnh mang cờ xác nhận rõ ràng.

Lớp 2 chặt hơn yêu cầu gốc chứ không lỏng hơn: mutation vào Sanity nguy hiểm bất kể ai gọi. Ghi lại ở đây để người duyệt biết đây là quyết định có ý thức, không phải sót.

---

## File Structure

**Tạo mới:**

| Đường dẫn | Trách nhiệm |
|---|---|
| `scripts/audit/lib/evidence.ts` | Dựng và ghi báo cáo bằng chứng. Nguồn duy nhất của định dạng report. |
| `scripts/audit/gate-audit.ts` | Kiểm bộ kiểm: cổng có thật sự chạy không (DR-021, DR-022, DR-015). |
| `scripts/audit/deploy-verify.ts` | So bản dựng local với bản đang chạy thật (DR-041). |
| `scripts/audit/doc-reality.ts` | Tài liệu vs thực tế production (DR-040, DR-043, DR-006). |
| `scripts/audit/html-audit.ts` | SEO meta + thẻ ảnh trên `dist/**/*.html`. |
| `scripts/audit/__tests__/*.test.ts` | Test cho từng module trên + test frontmatter của cả 10 agent + test 4 hook. |
| `.claude/agents/*.md` | 10 định nghĩa subagent. |
| `.claude/hooks/*.sh` | 4 hook. |

**Sửa:**

| Đường dẫn | Sửa gì |
|---|---|
| `scripts/package.json:24` | `test` bao thêm `audit/__tests__/*.test.ts`; thêm 4 script `audit:*`. |
| `.claude/settings.json` | Thêm khối `hooks`. |

Mỗi file `scripts/audit/*.ts` giữ một trách nhiệm và tự chạy được bằng `node --import ./node_modules/tsx/dist/esm/index.mjs audit/<file>.ts` từ thư mục `scripts/`.

## Ba pha

- **Pha 1 (Task 1–5): nền + 4 hook.** Giao được độc lập. Xong pha này là đã bịt được ba lỗ hổng đã trả giá thật, chưa cần subagent nào.
- **Pha 2 (Task 6–9): 4 auditor có script.** Phụ thuộc Task 1.
- **Pha 3 (Task 10–14): 6 agent phán đoán + đăng ký.** Phụ thuộc Task 1 (test frontmatter).

Dừng được sau bất kỳ pha nào mà thứ đã làm vẫn chạy.

---

# PHA 1 — Nền và 4 hook

## Task 1: Thư viện bằng chứng

**Files:**
- Create: `scripts/audit/lib/evidence.ts`
- Create: `scripts/audit/__tests__/evidence.test.ts`
- Modify: `scripts/package.json:24` (script `test`)

**Interfaces:**
- Consumes: không có (task đầu tiên).
- Produces: `REPO_ROOT: string`; `type Verdict = 'pass'|'fail'|'skip'`; `interface Check { id: string; verdict: Verdict; detail: string; drift: string[] }`; `interface Report { agent: string; ranAt: string; checks: Check[]; summary: { pass: number; fail: number; skip: number } }`; `buildReport(agent: string, ranAt: string, checks: Check[]): Report`; `evidenceDir(report: Report): string`; `renderMarkdown(report: Report): string`; `writeReport(report: Report): string`; `exitCodeFor(report: Report): number`. Task 6–9 đều dùng bộ này.

- [ ] **Step 1: Mở rộng script test để nhận thư mục mới**

Sửa `scripts/package.json`, dòng `"test"`:

```json
    "test": "tsx --test synthesis/__tests__/*.test.ts audit/__tests__/*.test.ts",
```

- [ ] **Step 2: Viết test trước**

Tạo `scripts/audit/__tests__/evidence.test.ts`:

```ts
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
```

- [ ] **Step 3: Chạy test, xác nhận nó đỏ**

```bash
npm --prefix scripts test
```

Kỳ vọng: đỏ với `ERR_MODULE_NOT_FOUND` cho `../lib/evidence`.

- [ ] **Step 4: Viết `scripts/audit/lib/evidence.ts`**

```ts
// Thư viện bằng chứng — nguồn duy nhất của định dạng báo cáo cho scripts/audit.
//
// Vì sao tồn tại: CLAUDE.md §6 nói "Mặc định của cổng là không đạt nếu không có
// bằng chứng" và cấm "lời khẳng định chung chung kiểu đã kiểm xong". Một subagent
// tự viết "đã kiểm, đạt" là lời tự khai mà GOVERNANCE 5.1 cấm nhận. Nên mọi kết
// luận của bộ audit phải quy về file do module này ghi ra.
//
// Bài học DR-021: bảng toàn [pass] mà im về phần không kiểm được là lời khai vượt
// quá phần đã kiểm. Nên 'skip' là hạng công dân thứ nhất, và renderMarkdown BẮT
// BUỘC nói ra số skip ở dòng kết luận.
//
// Đường dẫn từ import.meta.url, không tin process.cwd() — check-no-process-cwd.sh.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LIB_DIR = dirname(fileURLToPath(import.meta.url))

/** scripts/audit/lib -> scripts/audit -> scripts -> <gốc repo> */
export const REPO_ROOT = resolve(LIB_DIR, '..', '..', '..')

export type Verdict = 'pass' | 'fail' | 'skip'

export interface Check {
  /** Mã ổn định giữa các lần chạy, để so hai báo cáo với nhau. */
  id: string
  verdict: Verdict
  /** Nói rõ đã kiểm cái gì, hoặc vì sao không kiểm được. */
  detail: string
  /** Mã DR-nnn mà phép kiểm này truy về. Rỗng nghĩa là phạm vi nở. */
  drift: string[]
}

export interface Report {
  agent: string
  ranAt: string
  checks: Check[]
  summary: { pass: number; fail: number; skip: number }
}

export function buildReport(agent: string, ranAt: string, checks: Check[]): Report {
  return {
    agent,
    ranAt,
    checks,
    summary: {
      pass: checks.filter((c) => c.verdict === 'pass').length,
      fail: checks.filter((c) => c.verdict === 'fail').length,
      skip: checks.filter((c) => c.verdict === 'skip').length,
    },
  }
}

/** docs/evidence/<YYYY-MM-DD>-<agent>/ — ngày lấy từ ranAt, không từ đồng hồ. */
export function evidenceDir(report: Report): string {
  return join(REPO_ROOT, 'docs', 'evidence', `${report.ranAt.slice(0, 10)}-${report.agent}`)
}

export function renderMarkdown(report: Report): string {
  const { pass, fail, skip } = report.summary
  const lines: string[] = [
    `# Bằng chứng — ${report.agent}`,
    '',
    `Chạy lúc: ${report.ranAt}`,
    '',
    '| Mã | Kết quả | Chi tiết | Truy về |',
    '|---|---|---|---|',
  ]
  for (const c of report.checks) {
    const mark =
      c.verdict === 'pass' ? 'đạt' : c.verdict === 'fail' ? '**TRƯỢT**' : 'không kiểm được'
    lines.push(
      `| ${c.id} | ${mark} | ${c.detail.replace(/\|/g, '\\|')} | ${c.drift.join(', ') || '—'} |`,
    )
  }
  lines.push('')
  lines.push(
    skip === 0
      ? `Kết luận: ${pass} đạt, ${fail} trượt.`
      : `Kết luận: ${pass} đạt, ${fail} trượt — và ${skip} phép kiểm không chạy được, xem bảng trên. Bảng này không nói gì về ${skip} bất biến đó.`,
  )
  return lines.join('\n') + '\n'
}

/** Ghi report.json + report.md. Trả về thư mục đã ghi. */
export function writeReport(report: Report): string {
  const dir = evidenceDir(report)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8')
  writeFileSync(join(dir, 'report.md'), renderMarkdown(report), 'utf8')
  return dir
}

/** Mã thoát cho script gọi. Skip KHÔNG làm đỏ — nó làm hẹp phạm vi lời khai. */
export function exitCodeFor(report: Report): number {
  return report.summary.fail > 0 ? 1 : 0
}
```

- [ ] **Step 5: Chạy test, xác nhận xanh**

```bash
npm --prefix scripts test
```

Kỳ vọng: 6 test của `evidence.test.ts` xanh, các test `synthesis` cũ vẫn xanh.

- [ ] **Step 6: Xác nhận không phạm luật cwd**

```bash
npm run check:cwd
```

Kỳ vọng: không in gì, thoát 0.

- [ ] **Step 7: Commit**

```bash
git add scripts/audit/lib/evidence.ts scripts/audit/__tests__/evidence.test.ts scripts/package.json
git commit -m "feat(audit): thư viện bằng chứng cho bộ kiểm tự động"
```

---

## Task 2: Bộ khung test hook + hook chặn `git add` gom cả cây

**Files:**
- Create: `.claude/hooks/block-git-add-all.sh`
- Create: `scripts/audit/__tests__/hook-harness.ts`
- Create: `scripts/audit/__tests__/block-git-add-all.test.ts`

**Interfaces:**
- Consumes: `REPO_ROOT` từ Task 1.
- Produces: `runHook(name: string, input: unknown): { denied: boolean; reason: string }` trong `hook-harness.ts`. Task 3, 4, 5 đều dùng lại hàm này.

Bối cảnh: máy này chạy nhiều phiên Claude trên cùng một working dir. `git add -A` gom cả file phiên khác đang viết dở vào commit của mình. Đã xảy ra thật.

- [ ] **Step 1: Viết bộ khung chạy hook (chưa phải test)**

Tạo `scripts/audit/__tests__/hook-harness.ts`. Đặt tên **không** kết thúc bằng `.test.ts` để `tsx --test` không coi nó là một test file.

```ts
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
```

- [ ] **Step 2: Viết test trước**

Tạo `scripts/audit/__tests__/block-git-add-all.test.ts`:

```ts
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
```

Lưu ý về ca `echo "git add -A là điều cấm"`: hook phải không chặn khi cụm nằm trong chuỗi của lệnh khác. Cách đạt: chỉ soi phần đầu mỗi mệnh đề, xem Step 4.

- [ ] **Step 3: Chạy test, xác nhận nó đỏ**

```bash
npm --prefix scripts test
```

Kỳ vọng: đỏ vì `.claude/hooks/block-git-add-all.sh` chưa tồn tại (`bash: No such file`, hook exit khác 0 → assert trong harness đỏ).

- [ ] **Step 4: Viết hook**

Tạo `.claude/hooks/block-git-add-all.sh`:

```bash
#!/bin/bash
# PreToolUse(Bash) — chặn `git add` gom cả cây làm việc.
#
# Vì sao: máy này chạy nhiều phiên Claude trên cùng một working dir. `git add -A`
# gom cả file phiên khác đang viết dở vào commit của mình. Đã xảy ra thật.
# Cách đúng: liệt kê từng đường dẫn.
#
# Heuristic best-effort, không phải trình phân tích cú pháp shell. Nó soi mệnh đề
# đầu tiên sau mỗi dấu ngắt (; && || |) nên `echo "git add -A"` không bị chặn.
set -euo pipefail

INPUT=$(cat)
[ "$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')" = "Bash" ] || exit 0
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

LY_DO_ADD="git add gom cả cây bị chặn. Working dir này dùng chung với phiên Claude khác, -A/--all/. sẽ nuốt file phiên khác đang viết dở. Liệt kê đường dẫn cụ thể: git add <file1> <file2>."
LY_DO_COMMIT="git commit -a bị chặn vì nó tự stage mọi file đã track, kể cả file phiên khác đang sửa. Dùng git add <đường dẫn cụ thể> rồi git commit -m."

# Tách theo dấu ngắt, xét từng mệnh đề riêng. Dùng here-string chứ không dùng
# pipe: pipe đẩy vòng lặp vào subshell và biến gán trong đó mất khi ra ngoài.
VERDICT=""
while IFS= read -r MENH_DE; do
  CLAUSE=$(printf '%s' "$MENH_DE" | sed 's/^[[:space:]]*//')

  case "$CLAUSE" in
    git\ add\ *)
      if printf '%s' "$CLAUSE" | grep -Eq -- '(^|[[:space:]])(-A|--all|\.|:/)([[:space:]]|$)'; then
        VERDICT="ADD"
        break
      fi
      ;;
    git\ commit\ *)
      if printf '%s' "$CLAUSE" | grep -Eq -- 'commit[[:space:]]+-[a-zA-Z]*a[a-zA-Z]*([[:space:]]|$)'; then
        VERDICT="COMMIT"
        break
      fi
      if printf '%s' "$CLAUSE" | grep -Eq -- '(^|[[:space:]])--all([[:space:]]|$)'; then
        VERDICT="COMMIT"
        break
      fi
      ;;
  esac
done <<< "$(printf '%s' "$CMD" | tr ';|&' '\n')"

case "$VERDICT" in
  ADD) deny "$LY_DO_ADD" ;;
  COMMIT) deny "$LY_DO_COMMIT" ;;
esac

exit 0
```

Ba chỗ dễ sai, ghi ra để người thực thi không phải dò:

1. **Dùng here-string, không dùng pipe.** `cmd | while ...` đẩy vòng lặp vào subshell, `VERDICT` gán trong đó mất khi ra ngoài. `while ... <<< "$(...)"` giữ vòng lặp ở shell hiện tại.
2. **`tr ';|&' '\n'` tách mệnh đề** nên `echo "git add -A là điều cấm"` cho ra mệnh đề bắt đầu bằng `echo`, không khớp `case git\ add\ *`, nên không bị chặn. Đó là ca test `PHAI_CHO_QUA` cuối.
3. **`cd /tmp && git add -A`** tách thành hai mệnh đề, mệnh đề thứ hai là `git add -A` sau khi `sed` cắt khoảng trắng đầu — khớp và bị chặn. Đó là ca test tương ứng.

- [ ] **Step 5: Cho phép chạy và chạy test**

```bash
chmod +x .claude/hooks/block-git-add-all.sh
npm --prefix scripts test
```

Kỳ vọng: 15 test của `block-git-add-all.test.ts` xanh.

- [ ] **Step 6: Thử tay một ca chặn và một ca cho qua**

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git add -A"}}' | bash .claude/hooks/block-git-add-all.sh
echo '{"tool_name":"Bash","tool_input":{"command":"git add src/x.astro"}}' | bash .claude/hooks/block-git-add-all.sh
```

Kỳ vọng: lệnh đầu in JSON có `"permissionDecision": "deny"`; lệnh sau không in gì.

- [ ] **Step 7: Commit**

```bash
git add .claude/hooks/block-git-add-all.sh scripts/audit/__tests__/hook-harness.ts scripts/audit/__tests__/block-git-add-all.test.ts
git commit -m "feat(hooks): chặn git add gom cả cây làm việc"
```

---

## Task 3: Hook chặn deploy khi bản dựng chưa chắc lên tới khách

**Files:**
- Create: `.claude/hooks/guard-deploy.sh`
- Create: `scripts/audit/__tests__/guard-deploy.test.ts`
- Modify: `scripts/audit/__tests__/hook-harness.ts` (thêm tham số `projectDir`)

**Interfaces:**
- Consumes: `runHook`, `bashInput` từ Task 2.
- Produces: `runHook(name, input, projectDir?)` — chữ ký mở rộng, mặc định vẫn là `REPO_ROOT`. Task 4 và 5 dùng chữ ký này.

Bối cảnh, `DR-041` ngày 2026-08-22: `wrangler deploy` in `Success`, `curl` trả `200`, nội dung trên tourdao.vn là của hai tuần trước. Nguyên đợt 4A không lên tới khách. Cơ chế: Sanity Publish kích Cloudflare dựng lại từ `origin/main` và **thay thế** version đang chạy, mà `main` local khi đó đi trước `origin/main` bảy commit. Sổ ghi đúng chỗ đau: *"không có tín hiệu hỏng nào"*. Hook này là tín hiệu đó.

Hai phép chặn:

- **D-A — có commit chưa push.** Áp cho mọi lệnh deploy. Bản dựng phía Cloudflare lấy từ `origin/main`, nên commit chưa push là commit không có mặt trong bản dựng tự động, và bản dựng tự động sẽ đè lên bản deploy tay.
- **D-B — `dist/` cũ hơn `src/`.** Chỉ áp cho lệnh **không** tự build trong cùng chuỗi. `npm run deploy` = `npm run build && wrangler deploy` nên nó tự làm mới `dist/`; chặn nó theo D-B là chặn nhầm.

- [ ] **Step 1: Mở rộng harness nhận thư mục dự án**

Sửa `scripts/audit/__tests__/hook-harness.ts`, thay thân hàm `runHook`:

```ts
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
```

Thêm vào cuối cùng file một hàm dựng repo giả:

```ts
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'

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
```

- [ ] **Step 2: Viết test trước**

Tạo `scripts/audit/__tests__/guard-deploy.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runHook, bashInput, repoGia } from './hook-harness'

const HOOK = 'guard-deploy.sh'

test('lệnh không phải deploy thì không đụng tới', () => {
  const dir = repoGia({ ahead: 5, distFresh: false })
  for (const cmd of ['npm run build', 'git status', 'npm --prefix scripts test']) {
    assert.equal(runHook(HOOK, bashInput(cmd), dir).denied, false, cmd)
  }
})

test('D-A: có commit chưa push thì chặn mọi lệnh deploy', () => {
  const dir = repoGia({ ahead: 3, distFresh: true })
  for (const cmd of ['npm run deploy', 'npx wrangler deploy', 'npm run deploy:preview']) {
    const r = runHook(HOOK, bashInput(cmd), dir)
    assert.equal(r.denied, true, cmd)
    assert.match(r.reason, /3 commit chưa push/)
  }
})

test('D-A: đã push hết thì cho qua', () => {
  const dir = repoGia({ ahead: 0, distFresh: true })
  assert.equal(runHook(HOOK, bashInput('npm run deploy'), dir).denied, false)
})

test('D-B: wrangler deploy trần với dist cũ hơn src thì chặn', () => {
  const dir = repoGia({ ahead: 0, distFresh: false })
  const r = runHook(HOOK, bashInput('npx wrangler deploy'), dir)
  assert.equal(r.denied, true)
  assert.match(r.reason, /dist\/ cũ hơn src\//)
})

test('D-B: npm run deploy tự build nên dist cũ không phải lý do chặn', () => {
  const dir = repoGia({ ahead: 0, distFresh: false })
  assert.equal(runHook(HOOK, bashInput('npm run deploy'), dir).denied, false)
})

test('D-B: chuỗi có build trước thì cũng cho qua', () => {
  const dir = repoGia({ ahead: 0, distFresh: false })
  assert.equal(runHook(HOOK, bashInput('npm run build && npx wrangler deploy'), dir).denied, false)
})
```

- [ ] **Step 3: Chạy test, xác nhận nó đỏ**

```bash
npm --prefix scripts test
```

Kỳ vọng: đỏ vì `guard-deploy.sh` chưa tồn tại.

- [ ] **Step 4: Viết hook**

Tạo `.claude/hooks/guard-deploy.sh`:

```bash
#!/bin/bash
# PreToolUse(Bash) — chặn deploy khi bản dựng chưa chắc lên tới khách.
#
# DR-041 (2026-08-22): wrangler deploy in Success, curl trả 200, nội dung là của
# hai tuần trước. Cloudflare dựng lại từ origin/main khi Sanity Publish bắn hook,
# và bản dựng đó THAY THẾ version đang chạy. main local khi ấy đi trước origin 7
# commit, nên đợt 4A "deploy xong" mà chưa từng lên tới khách. Không có tín hiệu
# hỏng nào. Hook này là tín hiệu đó.
#
# Hook KHÔNG tự fetch: gọi mạng trong hook làm mọi lệnh deploy chậm và có thể
# treo. Thông điệp chặn nhắc người dùng tự fetch.
set -euo pipefail

INPUT=$(cat)
[ "$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')" = "Bash" ] || exit 0
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

# Có phải lệnh deploy không?
printf '%s' "$CMD" | grep -Eq '(wrangler[[:space:]]+(deploy|versions[[:space:]]+upload)|npm[[:space:]]+run[[:space:]]+deploy)' || exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
[ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ] || exit 0
cd "$PROJECT_DIR"

# --- D-A: commit chưa push ---
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "")
if [ -n "$AHEAD" ] && [ "$AHEAD" -gt 0 ] 2>/dev/null; then
  deny "Chặn deploy: còn $AHEAD commit chưa push lên origin/main. Cloudflare dựng site từ origin/main, nên bản deploy tay này sẽ bị đè ngay lần Sanity Publish kế tiếp — đúng cơ chế DR-041 đã làm mất trắng đợt 4A. Chạy: git fetch origin main, rồi git push, rồi deploy lại. Nếu đã push rồi mà vẫn bị chặn thì ref origin/main ở local đang cũ, fetch lại."
fi

# --- D-B: dist/ cũ hơn src/ ---
# Chỉ áp cho lệnh KHÔNG tự build trong cùng chuỗi. npm run deploy đã có
# npm run build ở đầu, chặn nó theo D-B là chặn nhầm.
if ! printf '%s' "$CMD" | grep -Eq '(npm[[:space:]]+run[[:space:]]+build|npm[[:space:]]+run[[:space:]]+deploy)'; then
  if [ ! -f dist/index.html ]; then
    deny "Chặn deploy: không có dist/index.html. Chưa build thì không có gì để tải lên. Chạy npm run build trước."
  fi
  MOI_HON=$(find src -type f \( -name '*.astro' -o -name '*.ts' -o -name '*.css' \) -newer dist/index.html -print -quit 2>/dev/null || true)
  if [ -n "$MOI_HON" ]; then
    deny "Chặn deploy: dist/ cũ hơn src/ — ví dụ $MOI_HON mới hơn dist/index.html. Bản sắp tải lên không chứa thay đổi vừa sửa. Chạy npm run build trước."
  fi
fi

exit 0
```

- [ ] **Step 5: Cho phép chạy và chạy test**

```bash
chmod +x .claude/hooks/guard-deploy.sh
npm --prefix scripts test
```

Kỳ vọng: 6 test của `guard-deploy.test.ts` xanh.

- [ ] **Step 6: Commit**

```bash
git add .claude/hooks/guard-deploy.sh scripts/audit/__tests__/guard-deploy.test.ts scripts/audit/__tests__/hook-harness.ts
git commit -m "feat(hooks): chặn deploy khi còn commit chưa push hoặc dist cũ hơn src"
```

---

## Task 4: Hook chặn ghi dữ liệu ngoài ý muốn

**Files:**
- Create: `.claude/hooks/guard-data-mutation.sh`
- Create: `scripts/audit/__tests__/guard-data-mutation.test.ts`
- Modify: `.gitignore` (bỏ qua file cờ cho phép ghi)

**Interfaces:**
- Consumes: `runHook`, `bashInput` từ Task 2/3.
- Produces: giao ước cờ mở khoá `.claude/.cho-phep-ghi-du-lieu` — Task 14 (`data-reader.md`) trích dẫn giao ước này.

Đây là lớp 2 của cách đi vòng đã ghi ở mục *Giới hạn đã biết*: hook không biết nó đang chạy trong subagent nào, nên thay vì khoá riêng `data-reader`, ta khoá **mọi agent** khỏi các lệnh ghi dữ liệu, và mở bằng một cờ có chủ đích.

Cơ chế mở khoá: file `.claude/.cho-phep-ghi-du-lieu` tồn tại **và** được tạo trong vòng 30 phút. Vừa dùng được cho lệnh Bash vừa dùng được cho công cụ MCP Sanity, nên chỉ cần một đường thoát chứ không phải hai. Hết hạn tự động vì một cờ bỏ quên là một cổng mở vĩnh viễn.

- [ ] **Step 1: Viết test trước**

Tạo `scripts/audit/__tests__/guard-data-mutation.test.ts`:

```ts
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
```

- [ ] **Step 2: Chạy test, xác nhận nó đỏ**

```bash
npm --prefix scripts test
```

Kỳ vọng: đỏ vì `guard-data-mutation.sh` chưa tồn tại.

- [ ] **Step 3: Viết hook**

Tạo `.claude/hooks/guard-data-mutation.sh`:

```bash
#!/bin/bash
# PreToolUse(Bash + mcp__Sanity__*) — chặn lệnh ghi dữ liệu ngoài ý muốn.
#
# Vì sao chặn cho MỌI agent chứ không riêng data-reader: JSON vào hook không có
# trường nào cho biết đang chạy trong subagent nào (chỉ có session_id,
# transcript_path, cwd, permission_mode, hook_event_name, tool_name, tool_input).
# Nên không khoá riêng một subagent được. Khoá chung chặt hơn, không lỏng hơn:
# mutation vào Sanity nguy hiểm bất kể ai gọi.
#
# Mở khoá: tạo .claude/.cho-phep-ghi-du-lieu trong dự án. Cờ hết hiệu lực sau 30
# phút — một cờ bỏ quên là một cổng mở vĩnh viễn.
set -euo pipefail

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

LY_DO="Chặn ghi dữ liệu. Lệnh này sửa hoặc xoá nội dung trong Sanity. Nếu đây đúng là việc muốn làm, tạo cờ rồi chạy lại: touch .claude/.cho-phep-ghi-du-lieu — cờ tự hết hiệu lực sau 30 phút."

co_the_ghi() {
  PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
  [ -n "$PROJECT_DIR" ] || return 1
  CO="$PROJECT_DIR/.claude/.cho-phep-ghi-du-lieu"
  [ -f "$CO" ] || return 1
  # find -mmin -30: cờ được sửa trong vòng 30 phút gần đây.
  [ -n "$(find "$CO" -mmin -30 -print -quit 2>/dev/null || true)" ] || return 1
  return 0
}

# --- Công cụ MCP Sanity ---
case "$TOOL" in
  mcp__Sanity__create_*|mcp__Sanity__patch_*|mcp__Sanity__delete_*|mcp__Sanity__publish_*|\
  mcp__Sanity__unpublish_*|mcp__Sanity__discard_*|mcp__Sanity__update_*|mcp__Sanity__version_*|\
  mcp__Sanity__deploy_*|mcp__Sanity__dataset_assets_upload)
    co_the_ghi || deny "$LY_DO Công cụ bị chặn: $TOOL."
    exit 0
    ;;
esac

# --- Lệnh Bash ---
[ "$TOOL" = "Bash" ] || exit 0
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

# Danh sách lấy từ scripts/package.json — đúng những script đụng dữ liệu thật.
MAU_GHI='(publish:drafts|publish-drafts\.ts|patch:n5|patch-n5-[a-z0-9-]+\.ts|backfill:seo-meta|backfill-seo-meta\.ts|scripts/migrate/|(^|[[:space:]])migrate/[a-z0-9-]+\.ts|sanity[[:space:]]+documents[[:space:]]+(create|delete|replace)|sanity[[:space:]]+dataset[[:space:]]+delete)'

if printf '%s' "$CMD" | grep -Eq "$MAU_GHI"; then
  co_the_ghi || deny "$LY_DO"
fi

exit 0
```

- [ ] **Step 4: Cho phép chạy, thêm cờ vào .gitignore, chạy test**

Thêm vào cuối `.gitignore`:

```
# Cờ mở khoá tạm cho hook guard-data-mutation.sh — không bao giờ commit.
.claude/.cho-phep-ghi-du-lieu
```

```bash
chmod +x .claude/hooks/guard-data-mutation.sh
npm --prefix scripts test
```

Kỳ vọng: 15 test của `guard-data-mutation.test.ts` xanh.

- [ ] **Step 5: Commit**

```bash
git add .claude/hooks/guard-data-mutation.sh scripts/audit/__tests__/guard-data-mutation.test.ts .gitignore
git commit -m "feat(hooks): chặn lệnh ghi dữ liệu Sanity trừ khi có cờ mở khoá"
```

---

## Task 5: Hook tự kiểm lỗi sau khi sửa file, và nối cả 4 hook vào settings

**Files:**
- Create: `.claude/hooks/post-edit-lint.sh`
- Create: `scripts/audit/__tests__/post-edit-lint.test.ts`
- Modify: `.claude/settings.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `runHook` từ Task 3 (chữ ký có `projectDir`).
- Produces: không có API cho task sau; đây là task đóng Pha 1.

Đây là phần "tích hợp tự động kiểm tra lỗi sau khi sửa file" trong yêu cầu. Ba điểm thiết kế:

1. **Không chặn.** `PostToolUse` chạy *sau* khi file đã ghi. Chặn ở đó vô nghĩa. Hook trả `systemMessage` để Claude thấy lỗi ngay thay vì để dồn tới lúc build.
2. **Chỉ chạy khi file trong `src/` đổi.** Sửa `docs/*.md` mà chạy `astro check` là phí 20 giây mỗi lần.
3. **Chống dội 60 giây.** Một loạt `Edit` liên tiếp chỉ tốn một lần kiểm.

- [ ] **Step 1: Viết test trước**

Tạo `scripts/audit/__tests__/post-edit-lint.test.ts`:

```ts
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
```

Ghi chú về test cuối: thư mục giả không có `package.json`, nên nhánh chạy `astro check` sẽ thoát sớm ở phép kiểm "có `package.json` không". Hook vẫn phải exit 0 và không chặn. Đó chính là điều test khẳng định.

- [ ] **Step 2: Chạy test, xác nhận nó đỏ**

```bash
npm --prefix scripts test
```

Kỳ vọng: đỏ vì `post-edit-lint.sh` chưa tồn tại.

- [ ] **Step 3: Viết hook**

Tạo `.claude/hooks/post-edit-lint.sh`:

```bash
#!/bin/bash
# PostToolUse(Edit|Write) — chạy astro check sau khi file trong src/ đổi.
#
# KHÔNG chặn: PostToolUse chạy sau khi file đã ghi, chặn ở đó vô nghĩa. Hook trả
# systemMessage để lỗi kiểu hiện ra ngay thay vì dồn tới lúc build.
#
# Chống dội 60 giây: một loạt Edit liên tiếp chỉ tốn một lần kiểm.
set -euo pipefail

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')
case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
[ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ] || exit 0

# Chỉ quan tâm file mã nguồn trong src/.
case "$FILE_PATH" in
  "$PROJECT_DIR"/src/*.astro|"$PROJECT_DIR"/src/*.ts|"$PROJECT_DIR"/src/*.tsx) ;;
  *) exit 0 ;;
esac

DAU="$PROJECT_DIR/.claude/.last-astro-check"
# Đã chạy trong vòng 60 giây thì thôi. find -newermt cần mốc thời gian; dùng
# -mmin -1 cho đơn giản và đủ chính xác.
if [ -f "$DAU" ] && [ -n "$(find "$DAU" -mmin -1 -print -quit 2>/dev/null || true)" ]; then
  exit 0
fi

[ -f "$PROJECT_DIR/package.json" ] || exit 0
cd "$PROJECT_DIR"
touch "$DAU"

# astro check trả khác 0 khi có lỗi. Không để set -e giết hook.
OUT=$(npm run check 2>&1) && CODE=0 || CODE=$?

if [ "$CODE" -ne 0 ]; then
  # Chỉ lấy phần cuối cho gọn; toàn bộ output nằm trong log của npm.
  TOM_TAT=$(printf '%s' "$OUT" | tail -n 40)
  jq -n --arg msg "astro check đỏ sau khi sửa $FILE_PATH:

$TOM_TAT" '{systemMessage: $msg}'
fi

exit 0
```

- [ ] **Step 4: Cho phép chạy, bỏ qua dấu chống dội trong git, chạy test**

Thêm vào `.gitignore`:

```
# Dấu chống dội của hook post-edit-lint.sh.
.claude/.last-astro-check
```

```bash
chmod +x .claude/hooks/post-edit-lint.sh
npm --prefix scripts test
```

Kỳ vọng: 4 test của `post-edit-lint.test.ts` xanh.

Kiểm tay đường chạy thật (không có trong test tự động):

```bash
rm -f .claude/.last-astro-check
echo "{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$PWD/src/components/Header.astro\"}}" \
  | CLAUDE_PROJECT_DIR="$PWD" bash .claude/hooks/post-edit-lint.sh
```

Kỳ vọng: mất khoảng 20–40 giây. Nếu `astro check` đang xanh thì không in gì; nếu đỏ thì in JSON có `systemMessage`.

- [ ] **Step 5: Nối cả 4 hook vào settings**

Thay toàn bộ `.claude/settings.json` bằng nội dung sau. Giữ nguyên khối `worktree` đang có — nó là cấu hình thật, không được xoá.

```json
{
  "worktree": {
    "baseRef": "head"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/block-git-add-all.sh",
            "timeout": 10
          },
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-deploy.sh",
            "timeout": 15
          }
        ]
      },
      {
        "matcher": "Bash|mcp__Sanity__.*",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-data-mutation.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/post-edit-lint.sh",
            "timeout": 180
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 6: Kiểm settings hợp lệ và hook thật sự nạp**

```bash
jq empty .claude/settings.json && echo "JSON hợp lệ"
jq -r '.hooks.PreToolUse[].hooks[].command' .claude/settings.json
```

Kỳ vọng: in ba đường dẫn hook `PreToolUse`. Sau đó **khởi động lại phiên Claude Code** rồi thử `git add -A` — phải bị chặn. Hook chỉ được nạp lúc phiên bắt đầu; sửa `settings.json` giữa phiên không có tác dụng ngay.

- [ ] **Step 7: Commit**

```bash
git add .claude/hooks/post-edit-lint.sh .claude/settings.json .gitignore scripts/audit/__tests__/post-edit-lint.test.ts
git commit -m "feat(hooks): tự chạy astro check sau khi sửa src, nối 4 hook vào settings"
```

**Kết thúc Pha 1.** Đến đây đã có 4 hook chạy thật và một thư viện bằng chứng có test. Dừng được ở đây; ba lỗ hổng đã trả giá thật (`git add -A` nuốt file phiên khác, deploy khi chưa push, ghi dữ liệu ngoài ý muốn) đã được bịt mà chưa cần subagent nào.

---

# PHA 2 — Bốn auditor có script

Nguyên tắc chung của pha này: **phần kiểm định lượng nằm trong script `.ts` có test; file `.md` của agent chỉ gọi script rồi diễn giải.** Agent không được tự kết luận vượt quá nội dung `report.json` mà script ghi ra. Đó là điều kiện để `GOVERNANCE` 5.1 chấp nhận kết quả làm bằng chứng thay vì lời tự khai.

## Task 6: `gate-auditor` — kiểm chính bộ kiểm

**Files:**
- Create: `scripts/audit/gate-audit.ts`
- Create: `scripts/audit/__tests__/gate-audit.test.ts`
- Create: `scripts/audit/__tests__/agents.test.ts`
- Create: `.claude/agents/gate-auditor.md`
- Modify: `scripts/package.json` (thêm `audit:gate`)

**Interfaces:**
- Consumes: `Check`, `buildReport`, `writeReport`, `exitCodeFor`, `REPO_ROOT` từ Task 1.
- Produces: `duongDanTuEvidence(evidence: string): string | null`; `trichImportTuongDoi(source: string): string[]`; `kiemBangChung(controls: Control[], tonTai: (p: string) => boolean): Check[]`; `kiemImport(files: Array<{ path: string; source: string }>, tonTai: (p: string) => boolean): Check[]`; `interface Control { id: string; status: string; evidence?: string; executor?: string }`. Task 7–9 không dùng lại, nhưng `agents.test.ts` thì Task 7–14 đều sửa.

Đây là subagent quan trọng nhất trong cả bộ. Nhóm lỗi lớn nhất của dự án — khoảng 13 trên 43 mục drift — là **cổng in `[pass]` cho phép kiểm nó không hề chạy**. Ví dụ `DR-021`: `control-registry-gate` đối chiếu với `CONTROL_GATES.md`, file đó không tồn tại, tập rỗng, vòng lặp chạy 0 lần, cổng vẫn in `[pass] Registry coherent: 31 controls`. Ví dụ `DR-022`: `control-registry.yaml` khai R3/R4 `status: live` và dẫn bằng chứng là một file chưa từng được ghi ra.

Năm phép kiểm:

| Mã | Kiểm gì | Truy về |
|---|---|---|
| `GA1` | Mọi control `status: live` có `evidence:` trỏ tới file tồn tại thật | DR-022 |
| `GA2` | `scripts/reports/postbuild-status.json` không cũ hơn `dist/index.html` | DR-001 |
| `GA3` | Mọi id `live` có mục tương ứng trong `postbuild-status.json` | DR-022 |
| `GA4` | Mọi import tương đối trong validator trỏ tới file tồn tại | DR-015 |
| `GA5` | Mọi file khai trong `pipelines.*.files` tồn tại | DR-026 |

`GA4` là phép kiểm bắt được thứ nặng nhất: `scripts/validators/i1-i19.ts:10` nhập `../../shared/gates/index.js`, thư mục `shared/` không tồn tại trong repo, nên toàn bộ bộ kiểm ràng buộc pre-build **chưa từng chạy được** ở tourdaovn. Chính header của `control-registry.yaml` thừa nhận điều đó và nói rõ `control-registry-gate` không phát hiện được, vì nó kiểm bản đồ chứ không kiểm pipeline có khởi động nổi hay không.

- [ ] **Step 1: Viết test cho phần thuần trước**

Tạo `scripts/audit/__tests__/gate-audit.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { duongDanTuEvidence, trichImportTuongDoi, kiemBangChung, kiemImport } from '../gate-audit'
import type { Control } from '../gate-audit'

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
```

- [ ] **Step 2: Chạy test, xác nhận nó đỏ**

```bash
npm --prefix scripts test
```

Kỳ vọng: `ERR_MODULE_NOT_FOUND` cho `../gate-audit`.

- [ ] **Step 3: Viết `scripts/audit/gate-audit.ts`**

```ts
// gate-auditor — kiểm chính bộ kiểm.
//
// Nhóm lỗi lớn nhất của dự án là cổng in [pass] cho phép kiểm nó không hề chạy:
// DR-021 (vòng đối chiếu chạy 0 lần vì file nguồn không tồn tại), DR-022 (control
// khai live, dẫn bằng chứng là file chưa từng được ghi), DR-015 (cả bộ kiểm
// pre-build chết ngay lúc nhập module vì shared/ không có trong repo).
//
// Thiết kế: phần quyết định là hàm thuần nhận dữ liệu và một vị từ tồn-tại, nên
// test không cần đụng đĩa. Phần đọc đĩa nằm gọn trong main().

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { parse } from 'yaml'
import { buildReport, exitCodeFor, writeReport, REPO_ROOT } from './lib/evidence'
import type { Check } from './lib/evidence'

export interface Control {
  id: string
  status: string
  evidence?: string
  executor?: string
  pipeline?: string
}

interface Registry {
  pipelines?: Record<string, { files?: string[] }>
  controls?: Control[]
}

/**
 * Evidence trong registry là "<đường dẫn> <lời giải thích>", hoặc là một lời hứa
 * không có đường dẫn nào ("chưa có — sẽ là ... khi ND-005 trả xong").
 * Trả null cho trường hợp thứ hai.
 */
export function duongDanTuEvidence(evidence: string): string | null {
  const dau = evidence.trim().split(/\s+/)[0] ?? ''
  return dau.includes('/') ? dau : null
}

/** GA1 — control live phải dẫn bằng chứng là file có thật. */
export function kiemBangChung(controls: Control[], tonTai: (p: string) => boolean): Check[] {
  return controls
    .filter((c) => c.status === 'live')
    .map((c) => {
      const duongDan = duongDanTuEvidence(c.evidence ?? '')
      if (duongDan === null) {
        return {
          id: `GA1/${c.id}`,
          verdict: 'fail' as const,
          detail: `control ${c.id} khai live nhưng evidence không dẫn được đường dẫn nào: "${c.evidence ?? ''}"`,
          drift: ['DR-022'],
        }
      }
      return tonTai(duongDan)
        ? {
            id: `GA1/${c.id}`,
            verdict: 'pass' as const,
            detail: `control ${c.id} live, bằng chứng ${duongDan} tồn tại`,
            drift: ['DR-022'],
          }
        : {
            id: `GA1/${c.id}`,
            verdict: 'fail' as const,
            detail: `control ${c.id} khai live nhưng bằng chứng ${duongDan} không tồn tại`,
            drift: ['DR-022'],
          }
    })
}

/** Bắt import tương đối trong mã nguồn. Bỏ qua import gói (node:fs, yaml...). */
export function trichImportTuongDoi(source: string): string[] {
  const ket: string[] = []
  const re = /^\s*import\s[^'"]*['"](\.[^'"]+)['"]/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) ket.push(m[1])
  return ket
}

/** GA4 — mọi import tương đối trong validator phải giải được thành file có thật. */
export function kiemImport(
  files: Array<{ path: string; source: string }>,
  tonTai: (p: string) => boolean,
): Check[] {
  return files.map((f) => {
    const hong = trichImportTuongDoi(f.source).filter((spec) => {
      const goc = resolve(dirname(f.path), spec)
      // moduleResolution "bundler": thử extensionless, .ts, .js->.ts, và /index.ts
      const ungVien = [goc, `${goc}.ts`, goc.replace(/\.js$/, '.ts'), join(goc, 'index.ts')]
      return !ungVien.some(tonTai)
    })
    return hong.length === 0
      ? {
          id: `GA4/${f.path}`,
          verdict: 'pass' as const,
          detail: `mọi import tương đối trong ${f.path} giải được`,
          drift: ['DR-015'],
        }
      : {
          id: `GA4/${f.path}`,
          verdict: 'fail' as const,
          detail: `${f.path} nhập ${hong.join(', ')} — không giải được thành file nào. Module này không khởi động nổi, nên mọi control dựa vào nó chưa từng chạy.`,
          drift: ['DR-015'],
        }
  })
}

function main(): void {
  const ranAt = new Date().toISOString()
  const checks: Check[] = []
  const tonTai = (p: string) => existsSync(resolve(REPO_ROOT, p))

  // --- Đọc registry ---
  const duongDanRegistry = join(REPO_ROOT, 'docs', 'governance', 'control-registry.yaml')
  let registry: Registry | null = null
  if (existsSync(duongDanRegistry)) {
    registry = parse(readFileSync(duongDanRegistry, 'utf8')) as Registry
  } else {
    checks.push({
      id: 'GA1',
      verdict: 'skip',
      detail: `không đọc được ${duongDanRegistry} — không kiểm được bằng chứng của control live`,
      drift: ['DR-022'],
    })
  }

  if (registry?.controls) checks.push(...kiemBangChung(registry.controls, tonTai))

  // --- GA2: báo cáo không cũ hơn bản dựng ---
  const baoCao = join(REPO_ROOT, 'scripts', 'reports', 'postbuild-status.json')
  const dist = join(REPO_ROOT, 'dist', 'index.html')
  if (!existsSync(baoCao) || !existsSync(dist)) {
    checks.push({
      id: 'GA2',
      verdict: 'skip',
      detail: 'thiếu postbuild-status.json hoặc dist/index.html — không so được tuổi',
      drift: ['DR-001'],
    })
  } else {
    const tuoiBaoCao = statSync(baoCao).mtimeMs
    const tuoiDist = statSync(dist).mtimeMs
    checks.push(
      tuoiBaoCao >= tuoiDist
        ? { id: 'GA2', verdict: 'pass', detail: 'postbuild-status.json mới hơn hoặc bằng dist/', drift: ['DR-001'] }
        : {
            id: 'GA2',
            verdict: 'fail',
            detail:
              'postbuild-status.json CŨ HƠN dist/index.html — báo cáo đang nói về một bản dựng khác với bản đang nằm trên đĩa. Chạy lại npm run gate.',
            drift: ['DR-001'],
          },
    )
  }

  // --- GA3: control live có mục trong báo cáo ---
  if (registry?.controls && existsSync(baoCao)) {
    const items = (JSON.parse(readFileSync(baoCao, 'utf8')).items ?? []) as Array<{ id: string; status: string }>
    const coTrongBaoCao = new Set(items.map((i) => i.id))
    for (const c of registry.controls.filter((c) => c.status === 'live')) {
      checks.push(
        coTrongBaoCao.has(c.id)
          ? { id: `GA3/${c.id}`, verdict: 'pass', detail: `${c.id} có mục trong postbuild-status.json`, drift: ['DR-022'] }
          : {
              id: `GA3/${c.id}`,
              verdict: 'fail',
              detail: `${c.id} khai live nhưng không có mục nào trong postbuild-status.json — nó đỏ hay xanh cũng không ai biết qua cổng`,
              drift: ['DR-022'],
            },
      )
    }
  }

  // --- GA4: import giải được ---
  const thuMucValidator = [join('scripts', 'validators'), join('scripts', 'meta-validators')]
  const files: Array<{ path: string; source: string }> = []
  for (const tm of thuMucValidator) {
    const tuyetDoi = join(REPO_ROOT, tm)
    if (!existsSync(tuyetDoi)) continue
    for (const ten of readdirSync(tuyetDoi).filter((t) => t.endsWith('.ts'))) {
      const p = join(tm, ten)
      files.push({ path: p, source: readFileSync(join(REPO_ROOT, p), 'utf8') })
    }
  }
  checks.push(...kiemImport(files, tonTai))

  // --- GA5: file khai trong pipeline tồn tại ---
  for (const [ten, pl] of Object.entries(registry?.pipelines ?? {})) {
    for (const f of pl.files ?? []) {
      checks.push(
        tonTai(f)
          ? { id: `GA5/${f}`, verdict: 'pass', detail: `pipeline ${ten} khai ${f}, file tồn tại`, drift: ['DR-026'] }
          : {
              id: `GA5/${f}`,
              verdict: 'fail',
              detail: `pipeline ${ten} khai ${f} nhưng file không tồn tại`,
              drift: ['DR-026'],
            },
      )
    }
  }

  const report = buildReport('gate-auditor', ranAt, checks)
  const dir = writeReport(report)
  console.log(`[gate-auditor] ${report.summary.pass} đạt, ${report.summary.fail} trượt, ${report.summary.skip} không kiểm được`)
  console.log(`[gate-auditor] bằng chứng: ${dir}`)
  process.exit(exitCodeFor(report))
}

main()
```

- [ ] **Step 4: Thêm lệnh chạy**

Thêm vào `scripts/package.json`, khối `scripts`:

```json
    "audit:gate": "node --import ./node_modules/tsx/dist/esm/index.mjs audit/gate-audit.ts",
```

- [ ] **Step 5: Chạy test, xác nhận xanh, rồi chạy thật**

```bash
npm --prefix scripts test
npm --prefix scripts run audit:gate || true
```

Kỳ vọng test: 9 test của `gate-audit.test.ts` xanh.

Kỳ vọng chạy thật: **báo cáo sẽ có mục TRƯỢT, và đó là đúng.** Ít nhất `GA4` phải bắt được `scripts/validators/i1-i19.ts` nhập `../../shared/gates/index.js` không giải được. Nếu `GA4` toàn `pass` thì phép kiểm hỏng, không phải repo sạch — dừng lại và soi. Đọc `docs/evidence/<hôm-nay>-gate-auditor/report.md` để xác nhận.

- [ ] **Step 6: Viết test frontmatter cho agent**

Tạo `scripts/audit/__tests__/agents.test.ts`:

```ts
// Kiểm định nghĩa subagent. Mỗi task thêm agent mới thì thêm tên vào MONG_DOI,
// test đỏ, viết file, test xanh.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { parse } from 'yaml'
import { REPO_ROOT } from '../lib/evidence'

const AGENTS_DIR = join(REPO_ROOT, '.claude', 'agents')

/** Cập nhật danh sách này khi thêm agent. */
const MONG_DOI = ['gate-auditor']

/** Công cụ được phép khai trong `tools:`. Sai tên là agent im lặng mất công cụ. */
const CONG_CU_HOP_LE = new Set([
  'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch',
  'NotebookEdit', 'AskUserQuestion', 'TodoWrite', 'Skill',
])

function docFrontmatter(duongDan: string): Record<string, unknown> {
  const raw = readFileSync(duongDan, 'utf8')
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(raw)
  assert.ok(m, `${duongDan} không có khối frontmatter --- ở đầu file`)
  return parse(m![1]) as Record<string, unknown>
}

test('mọi agent mong đợi đều có file', () => {
  for (const ten of MONG_DOI) {
    assert.ok(existsSync(join(AGENTS_DIR, `${ten}.md`)), `thiếu .claude/agents/${ten}.md`)
  }
})

test('frontmatter: name khớp tên file, description đủ dài', () => {
  for (const f of readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'))) {
    const fm = docFrontmatter(join(AGENTS_DIR, f))
    assert.equal(fm.name, basename(f, '.md'), `${f}: name phải khớp tên file`)
    assert.equal(typeof fm.description, 'string', `${f}: thiếu description`)
    assert.ok(
      (fm.description as string).length >= 60,
      `${f}: description quá ngắn — Claude chọn agent bằng chuỗi này, mô tả mơ hồ là chọn nhầm`,
    )
  }
})

test('tools chỉ khai công cụ có thật', () => {
  for (const f of readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'))) {
    const fm = docFrontmatter(join(AGENTS_DIR, f))
    if (typeof fm.tools !== 'string') continue
    for (const t of (fm.tools as string).split(',').map((s) => s.trim())) {
      if (t.startsWith('mcp__')) continue // công cụ MCP, không kiểm ở đây
      assert.ok(CONG_CU_HOP_LE.has(t), `${f}: công cụ không hợp lệ "${t}"`)
    }
  }
})
```

- [ ] **Step 7: Chạy test, xác nhận nó đỏ**

```bash
npm --prefix scripts test
```

Kỳ vọng: đỏ ở `mọi agent mong đợi đều có file` — thiếu `.claude/agents/gate-auditor.md`.

- [ ] **Step 8: Viết định nghĩa agent**

Tạo `.claude/agents/gate-auditor.md`:

```markdown
---
name: gate-auditor
description: Kiểm chính bộ kiểm của dự án — trả lời câu hỏi "cổng có thật sự chạy không, hay nó in [pass] cho phép kiểm nó không hề thực hiện". Dùng khi ai đó sắp trích một dòng [pass] làm bằng chứng QA2, khi vừa sửa validator hoặc control-registry.yaml, khi một control đổi trạng thái live/gap, hoặc khi cần biết phạm vi thật của bộ kiểm trước lúc mở cổng. Không dùng để tìm lỗi trong mã sản phẩm — đó là việc của code-reviewer và debugger.
tools: Read, Glob, Grep, Bash
model: inherit
color: yellow
---

# gate-auditor

Bạn kiểm **bộ kiểm**, không kiểm sản phẩm.

## Vì sao vai này tồn tại

Nhóm lỗi lớn nhất của dự án là cổng nói dối. `DR-021`: `control-registry-gate` đối chiếu với một file không tồn tại, tập rỗng, vòng lặp chạy 0 lần, cổng vẫn in `[pass] Registry coherent: 31 controls`. `DR-022`: hai control khai `live` và dẫn bằng chứng là một file chưa từng được ghi ra. `DR-015`: cả bộ kiểm pre-build chết ngay lúc nhập module vì `shared/` không có trong repo — mà `control-registry-gate` vẫn báo coherent, vì nó kiểm bản đồ chứ không kiểm pipeline có khởi động nổi hay không.

`CLAUDE.md` §6: *"Mặc định của cổng là không đạt nếu không có bằng chứng."*

## Cách làm

1. Chạy `npm --prefix scripts run audit:gate`. Lệnh này ghi `docs/evidence/<ngày>-gate-auditor/report.json` và `report.md`.
2. Đọc `report.md`.
3. Báo cáo lại đúng nội dung báo cáo đó.

## Ràng buộc cứng

- **Không kết luận vượt quá `report.json`.** Bạn không được viết "bộ kiểm ổn" khi báo cáo có mục `skip`. Mỗi `skip` là một bất biến không ai kiểm; nói "ổn" là đúng cái lỗi `DR-021`.
- **Luôn nêu số `skip` trong câu kết.** Kể cả khi 0 trượt.
- **Không sửa gì.** Bạn chỉ đọc và chạy `audit:gate`. Muốn sửa thì báo lại cho phiên chính, không tự sửa.
- **Không nhận lời tự khai làm bằng chứng** (`GOVERNANCE` 5.1). Nếu một file tài liệu nói "đã kiểm", đó không phải bằng chứng; bằng chứng là file mà `report.json` trỏ tới.

## Định dạng trả về

```
Bằng chứng: docs/evidence/<ngày>-gate-auditor/report.md
Kết quả: <n> đạt, <n> trượt, <n> không kiểm được

Trượt:
- <mã>: <chi tiết> (truy về <DR-nnn>)

Không kiểm được:
- <mã>: <vì sao>

Đề xuất: <việc cần làm, hoặc "không có">
```

Nếu `audit:gate` chạy lỗi thì báo nguyên văn lỗi, không đoán kết quả.
```

- [ ] **Step 9: Thêm tên vào danh sách mong đợi, chạy test**

Trong `scripts/audit/__tests__/agents.test.ts` danh sách `MONG_DOI` đã có `'gate-auditor'` từ Step 6. Chạy lại:

```bash
npm --prefix scripts test
```

Kỳ vọng: 3 test của `agents.test.ts` xanh.

- [ ] **Step 10: Commit**

```bash
git add scripts/audit/gate-audit.ts scripts/audit/__tests__/gate-audit.test.ts scripts/audit/__tests__/agents.test.ts .claude/agents/gate-auditor.md scripts/package.json
git commit -m "feat(audit): gate-auditor kiểm chính bộ kiểm"
```

---

## Task 7: `deploy-verifier` — bản đang chạy có đúng là bản vừa dựng không

**Files:**
- Create: `scripts/audit/deploy-verify.ts`
- Create: `scripts/audit/__tests__/deploy-verify.test.ts`
- Create: `.claude/agents/deploy-verifier.md`
- Modify: `scripts/package.json`, `scripts/audit/__tests__/agents.test.ts`

**Interfaces:**
- Consumes: `Check`, `buildReport`, `writeReport`, `exitCodeFor`, `REPO_ROOT` từ Task 1.
- Produces: `trichTieuDe(html: string): string | null`; `demUrlSitemap(xml: string): number`; `soDauHieu(live: string, dist: string, dauHieu: string[]): Check[]`.

`DR-041` là mục đắt nhất trong sổ: `wrangler deploy` in `Success`, `curl` trả `200`, nội dung là của hai tuần trước, nguyên đợt 4A không lên tới khách. Task 3 đã chặn *trước* khi deploy. Task này kiểm *sau* khi deploy — vì hook chỉ bắt được nguyên nhân đã biết, còn đây là phép đo kết quả thật.

Ba phép kiểm: `DV1` tiêu đề trang chủ production khớp `dist/index.html`; `DV2` các dấu hiệu do người gọi chỉ định có mặt/vắng mặt giống nhau ở hai bên; `DV3` số URL trong sitemap production khớp sitemap local.

- [ ] **Step 1: Viết test cho phần thuần trước**

Tạo `scripts/audit/__tests__/deploy-verify.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { trichTieuDe, demUrlSitemap, soDauHieu } from '../deploy-verify'

test('trichTieuDe lấy nội dung thẻ title', () => {
  assert.equal(trichTieuDe('<html><head><title>Tour Đảo</title></head></html>'), 'Tour Đảo')
  assert.equal(trichTieuDe('<title>\n  Có xuống dòng\n</title>'), 'Có xuống dòng')
  assert.equal(trichTieuDe('<html><body>không có title</body></html>'), null)
})

test('demUrlSitemap đếm thẻ loc', () => {
  const xml = '<urlset><url><loc>https://a/</loc></url><url><loc>https://b/</loc></url></urlset>'
  assert.equal(demUrlSitemap(xml), 2)
  assert.equal(demUrlSitemap('<urlset></urlset>'), 0)
})

test('soDauHieu đạt khi hai bên giống nhau', () => {
  const checks = soDauHieu('<p>có A</p>', '<p>có A</p>', ['có A', 'không có B'])
  assert.equal(checks.filter((c) => c.verdict === 'pass').length, 2)
})

test('soDauHieu trượt và nói rõ bên nào có (DR-041)', () => {
  const checks = soDauHieu('<p>Có thu phí</p>', '<p>đã bỏ</p>', ['Có thu phí'])
  assert.equal(checks[0].verdict, 'fail')
  assert.match(checks[0].detail, /production có.*dist\/ không/)
  assert.deepEqual(checks[0].drift, ['DR-041'])
})

test('soDauHieu trượt theo chiều ngược lại', () => {
  const checks = soDauHieu('<p>cũ</p>', '<p>--sticky-bar-h: 10px</p>', ['--sticky-bar-h'])
  assert.equal(checks[0].verdict, 'fail')
  assert.match(checks[0].detail, /dist\/ có.*production không/)
})
```

- [ ] **Step 2: Chạy test, xác nhận nó đỏ**

```bash
npm --prefix scripts test
```

- [ ] **Step 3: Viết `scripts/audit/deploy-verify.ts`**

```ts
// deploy-verifier — bản đang chạy thật có đúng là bản vừa dựng không.
//
// DR-041: wrangler deploy in Success, curl trả 200, nội dung là của hai tuần
// trước. Cạm bẫy nằm ở chỗ không có tín hiệu hỏng nào. Script này tạo tín hiệu
// đó bằng cách so bit thật trên production với bit trong dist/.
//
// Chạy SAU khi deploy. guard-deploy.sh chặn TRƯỚC, dựa vào nguyên nhân đã biết;
// script này đo kết quả, nên bắt được cả nguyên nhân chưa biết.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildReport, exitCodeFor, writeReport, REPO_ROOT } from './lib/evidence'
import type { Check } from './lib/evidence'

const SITE = 'https://tourdao.vn'

export function trichTieuDe(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  return m ? m[1].trim() : null
}

export function demUrlSitemap(xml: string): number {
  return (xml.match(/<loc>/g) ?? []).length
}

/**
 * So sự có mặt của từng dấu hiệu giữa production và dist/.
 * Dấu hiệu là chuỗi con thô — ví dụ "--sticky-bar-h", "Có thu phí" — chọn theo
 * đúng thay đổi vừa deploy. Đó là cách DR-041 được phát hiện bằng tay.
 */
export function soDauHieu(live: string, dist: string, dauHieu: string[]): Check[] {
  return dauHieu.map((d) => {
    const oLive = live.includes(d)
    const oDist = dist.includes(d)
    if (oLive === oDist) {
      return {
        id: `DV2/${d}`,
        verdict: 'pass' as const,
        detail: `dấu hiệu "${d}": hai bên giống nhau (${oLive ? 'đều có' : 'đều không có'})`,
        drift: ['DR-041'],
      }
    }
    return {
      id: `DV2/${d}`,
      verdict: 'fail' as const,
      detail: oLive
        ? `dấu hiệu "${d}": production có, dist/ không — bản đang chạy CŨ HƠN bản vừa dựng`
        : `dấu hiệu "${d}": dist/ có, production không — bản vừa dựng CHƯA lên tới khách`,
      drift: ['DR-041'],
    }
  })
}

/** Tải kèm tham số phá cache. Không phá cache là đo lại chính bản cũ. */
async function tai(duongDan: string, moc: string): Promise<string> {
  const url = `${SITE}${duongDan}?cache-bust=${encodeURIComponent(moc)}`
  const res = await fetch(url, { cache: 'no-store', redirect: 'follow' })
  if (!res.ok) throw new Error(`${url} trả ${res.status}`)
  return res.text()
}

async function main(): Promise<void> {
  const ranAt = new Date().toISOString()
  const dauHieu = process.argv.slice(2)
  const checks: Check[] = []

  const distIndex = join(REPO_ROOT, 'dist', 'index.html')
  if (!existsSync(distIndex)) {
    checks.push({
      id: 'DV0',
      verdict: 'skip',
      detail: 'không có dist/index.html — chưa build thì không có gì để so',
      drift: ['DR-041'],
    })
  } else {
    const distHtml = readFileSync(distIndex, 'utf8')
    let liveHtml: string
    try {
      liveHtml = await tai('/', ranAt)
    } catch (e) {
      checks.push({
        id: 'DV0',
        verdict: 'skip',
        detail: `không tải được ${SITE}/ : ${(e as Error).message}`,
        drift: ['DR-041'],
      })
      ket(ranAt, checks)
      return
    }

    // DV1 — tiêu đề trang chủ
    const tLive = trichTieuDe(liveHtml)
    const tDist = trichTieuDe(distHtml)
    checks.push(
      tLive === tDist
        ? { id: 'DV1', verdict: 'pass', detail: `tiêu đề trang chủ khớp: "${tDist ?? ''}"`, drift: ['DR-041'] }
        : {
            id: 'DV1',
            verdict: 'fail',
            detail: `tiêu đề lệch — production "${tLive ?? '(không có)'}" vs dist/ "${tDist ?? '(không có)'}"`,
            drift: ['DR-041'],
          },
    )

    // DV2 — dấu hiệu do người gọi chỉ định
    if (dauHieu.length === 0) {
      checks.push({
        id: 'DV2',
        verdict: 'skip',
        detail:
          'không có dấu hiệu nào được truyền vào. Tiêu đề khớp KHÔNG chứng minh nội dung khớp — DR-041 có tiêu đề khớp mà nội dung lệch hai tuần. Truyền dấu hiệu: npm --prefix scripts run audit:deploy -- "--sticky-bar-h" "Có thu phí"',
        drift: ['DR-041'],
      })
    } else {
      checks.push(...soDauHieu(liveHtml, distHtml, dauHieu))
    }

    // DV3 — số URL trong sitemap
    const distSitemap = join(REPO_ROOT, 'dist', 'sitemap-0.xml')
    if (!existsSync(distSitemap)) {
      checks.push({ id: 'DV3', verdict: 'skip', detail: 'không có dist/sitemap-0.xml', drift: ['DR-041'] })
    } else {
      try {
        const nLive = demUrlSitemap(await tai('/sitemap-0.xml', ranAt))
        const nDist = demUrlSitemap(readFileSync(distSitemap, 'utf8'))
        checks.push(
          nLive === nDist
            ? { id: 'DV3', verdict: 'pass', detail: `sitemap: ${nDist} URL ở cả hai bên`, drift: ['DR-041'] }
            : {
                id: 'DV3',
                verdict: 'fail',
                detail: `sitemap lệch — production ${nLive} URL, dist/ ${nDist} URL`,
                drift: ['DR-041'],
              },
        )
      } catch (e) {
        checks.push({ id: 'DV3', verdict: 'skip', detail: `không tải được sitemap: ${(e as Error).message}`, drift: ['DR-041'] })
      }
    }
  }

  ket(ranAt, checks)
}

function ket(ranAt: string, checks: Check[]): void {
  const report = buildReport('deploy-verifier', ranAt, checks)
  const dir = writeReport(report)
  console.log(`[deploy-verifier] ${report.summary.pass} đạt, ${report.summary.fail} trượt, ${report.summary.skip} không kiểm được`)
  console.log(`[deploy-verifier] bằng chứng: ${dir}`)
  process.exit(exitCodeFor(report))
}

void main()
```

Ghi chú: `sitemap-0.xml` là tên do Astro sinh. Nếu chạy thật thấy `DV3` báo không có file, mở `dist/` xem tên thật rồi sửa hằng số — **không** đoán thêm tên thứ hai để thử vòng.

- [ ] **Step 4: Thêm lệnh chạy**

```json
    "audit:deploy": "node --import ./node_modules/tsx/dist/esm/index.mjs audit/deploy-verify.ts",
```

- [ ] **Step 5: Chạy test và chạy thật**

```bash
npm --prefix scripts test
npm run build
npm --prefix scripts run audit:deploy || true
```

Kỳ vọng test: 5 test xanh. Kỳ vọng chạy thật: có mạng thì `DV1`/`DV3` cho kết quả thật và `DV2` là `skip` kèm lời nhắc truyền dấu hiệu; không có mạng thì `DV0` là `skip`. **`skip` không làm đỏ nhưng cũng không phải xanh** — đọc `report.md` để thấy câu kết nói rõ điều đó.

- [ ] **Step 6: Viết `.claude/agents/deploy-verifier.md`**

```markdown
---
name: deploy-verifier
description: Kiểm sau khi deploy xem bản đang chạy trên tourdao.vn có đúng là bản vừa dựng trong dist/ hay không. Dùng ngay sau mỗi lần deploy, khi nghi ngờ thay đổi đã deploy mà không thấy trên site, khi bản deploy tay có thể đã bị bản dựng tự động từ origin/main đè lên, hoặc trước khi báo với người khác rằng một tính năng đã lên production. Không dùng để kiểm mã nguồn hay giao diện — đó là việc của code-reviewer và ui-auditor.
tools: Read, Glob, Grep, Bash
model: inherit
color: red
---

# deploy-verifier

Bạn trả lời đúng một câu hỏi: **bit đang phục vụ khách có đúng là bit vừa dựng không.**

## Vì sao vai này tồn tại

`DR-041`, 2026-08-22. `wrangler deploy` in `Success`. `curl` trả `200`. Nội dung trên tourdao.vn là của hai tuần trước. Nguyên đợt 4A "deploy xong" mà chưa từng lên tới khách.

Cơ chế: webhook Sanity bấm chuông, Cloudflare clone `origin/main` trên GitHub và dựng từ đó, rồi bản dựng ấy **thay thế** version đang chạy — kể cả version vừa tải tay lên. Máy local không tham gia. `main` local khi đó đi trước `origin/main` bảy commit.

Sổ ghi đúng chỗ đau: *"không có tín hiệu hỏng nào"*.

## Cách làm

1. Hỏi phiên chính: **thay đổi vừa deploy có dấu hiệu nào nhận ra được trong HTML?** Ví dụ một biến CSS mới (`--sticky-bar-h`), một cụm chữ vừa bỏ (`Có thu phí`), một giá trị token (`theme-color`).
2. Chạy: `npm --prefix scripts run audit:deploy -- "<dấu hiệu 1>" "<dấu hiệu 2>"`
3. Đọc `docs/evidence/<ngày>-deploy-verifier/report.md` và báo cáo lại.

## Ràng buộc cứng

- **Chạy không có dấu hiệu nào thì không kết luận được gì về nội dung.** `DV2` sẽ là `skip`, và `skip` không phải `pass`. Tiêu đề trang chủ khớp không chứng minh nội dung khớp — chính DR-041 có tiêu đề khớp.
- **Không suy ra "deploy thành công" từ `wrangler` in `Success` hay từ `curl` trả `200`.** Cả hai đều xanh trong DR-041.
- **Nếu có mục trượt, luôn kiểm thêm** `git rev-list --count origin/main..HEAD`. Khác 0 là gần như chắc chắn đã gặp lại DR-041.
- Không sửa gì. Báo lại cho phiên chính.

## Định dạng trả về

Giống `gate-auditor`: đường dẫn bằng chứng, ba con số, danh sách trượt, danh sách không kiểm được, đề xuất.
```

- [ ] **Step 7: Thêm vào `MONG_DOI`, chạy test, commit**

Trong `scripts/audit/__tests__/agents.test.ts` sửa thành:

```ts
const MONG_DOI = ['gate-auditor', 'deploy-verifier']
```

```bash
npm --prefix scripts test
git add scripts/audit/deploy-verify.ts scripts/audit/__tests__/deploy-verify.test.ts .claude/agents/deploy-verifier.md scripts/package.json scripts/audit/__tests__/agents.test.ts
git commit -m "feat(audit): deploy-verifier so bản đang chạy với bản vừa dựng"
```

---

## Task 8: `doc-reality-auditor` — tài liệu có đang mô tả đúng thực tế không

**Files:**
- Create: `scripts/audit/doc-reality.ts`
- Create: `scripts/audit/__tests__/doc-reality.test.ts`
- Create: `.claude/agents/doc-reality-auditor.md`
- Modify: `scripts/package.json`, `scripts/audit/__tests__/agents.test.ts`

**Interfaces:**
- Consumes: `Check`, `buildReport`, `writeReport`, `exitCodeFor`, `REPO_ROOT` từ Task 1.
- Produces: `timChuoiCam(files: Array<{ path: string; content: string }>, luat: LuatCam[]): Check[]`; `interface LuatCam { chuoi: string; lyDo: string; drift: string }`; `trichLuatChuyenHuong(text: string): Array<{ tu: string; den: string }>`; `kiemChuyenHuong(buildNotes: string, redirects: string): Check[]`; `kiemQuyetDinhDaDong(driftLog: string, decisions: string): Check[]`.

Bốn phép kiểm, mỗi cái truy về một mục drift thật:

| Mã | Kiểm gì | Truy về |
|---|---|---|
| `DOC1` | Tài liệu vận hành không được viết "Cloudflare Pages" — đường phát hành thật là Workers Builds | DR-040 |
| `DOC2` | Không còn tàn dư tên site khác (`nhatrangtravel`) rò sang | DR-006 |
| `DOC3` | Mọi luật chuyển hướng mà `BUILD-NOTES.md` mô tả phải có thật trong `public/_redirects` | DR-043 |
| `DOC4` | Mọi mã `QĐ-...` được trích trong `DRIFT_LOG.md` phải có mặt trong `DECISIONS.md` | DR-043 (gốc rễ) |

`DOC4` là phép kiểm đánh vào **gốc rễ** chứ không vào triệu chứng. `DR-043` ghi: `QĐ-2026-08-06-04` bước 6 đòi "ghi mục mới trong sổ để đóng `QĐ-2026-08-06-02`", bước đó chưa từng được thi hành, nên `BUILD-NOTES` không có tín hiệu nào để phải cập nhật theo, và nó nói sai về production suốt chín ngày.

- [ ] **Step 1: Viết test trước**

Tạo `scripts/audit/__tests__/doc-reality.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  timChuoiCam,
  trichLuatChuyenHuong,
  kiemChuyenHuong,
  kiemQuyetDinhDaDong,
} from '../doc-reality'

test('timChuoiCam bắt được chuỗi và nói rõ file nào dòng nào', () => {
  const files = [{ path: 'README.md', content: 'dòng 1\nDeploy qua Cloudflare Pages\ndòng 3' }]
  const luat = [{ chuoi: 'Cloudflare Pages', lyDo: 'đường thật là Workers Builds', drift: 'DR-040' }]
  const c = timChuoiCam(files, luat)[0]
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /README\.md:2/)
  assert.deepEqual(c.drift, ['DR-040'])
})

test('timChuoiCam đạt khi không có chuỗi cấm', () => {
  const files = [{ path: 'README.md', content: 'Deploy qua Workers Builds' }]
  const luat = [{ chuoi: 'Cloudflare Pages', lyDo: 'x', drift: 'DR-040' }]
  assert.equal(timChuoiCam(files, luat)[0].verdict, 'pass')
})

test('trichLuatChuyenHuong bắt cặp nguồn → đích', () => {
  const t = 'Luật `/ → https://tourdaonhatrang.com/ 302` đang bật.'
  assert.deepEqual(trichLuatChuyenHuong(t), [{ tu: '/', den: 'https://tourdaonhatrang.com/' }])
})

test('DOC3 trượt khi BUILD-NOTES mô tả luật mà _redirects không có (DR-043)', () => {
  const bn = 'Luật `/ → https://tourdaonhatrang.com/ 302` ĐANG BẬT.'
  const c = kiemChuyenHuong(bn, '# không có luật nào\n')[0]
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /BUILD-NOTES mô tả/)
})

test('DOC3 đạt khi _redirects có luật đó', () => {
  const bn = 'Luật `/ → https://tourdaonhatrang.com/ 302`.'
  const c = kiemChuyenHuong(bn, '/    https://tourdaonhatrang.com/    302\n')[0]
  assert.equal(c.verdict, 'pass')
})

test('DOC3 đạt (rỗng) khi BUILD-NOTES không mô tả luật nào', () => {
  assert.deepEqual(kiemChuyenHuong('không nhắc chuyển hướng', ''), [])
})

test('DOC4 trượt khi DRIFT_LOG trích quyết định mà DECISIONS không có', () => {
  const c = kiemQuyetDinhDaDong('đóng ở `QĐ-2026-08-22-04`.', '# Sổ quyết định\n')[0]
  assert.equal(c.verdict, 'fail')
  assert.match(c.detail, /QĐ-2026-08-22-04/)
})

test('DOC4 đạt khi mọi quyết định được trích đều có trong sổ', () => {
  const c = kiemQuyetDinhDaDong('xem `QĐ-2026-08-22-04`.', '## QĐ-2026-08-22-04 — nội dung\n')[0]
  assert.equal(c.verdict, 'pass')
})
```

- [ ] **Step 2: Chạy test, xác nhận đỏ, rồi viết `scripts/audit/doc-reality.ts`**

```ts
// doc-reality-auditor — tài liệu có đang mô tả đúng thực tế không.
//
// DR-043: BUILD-NOTES.md mở đầu bằng "ĐANG BẬT" cho một luật chuyển hướng đã gỡ
// chín ngày trước. File này là thứ người vận hành mở ra khi deploy, và nó đang
// mô tả hành vi production SAI. DR-040: mọi tài liệu viết "Cloudflare Pages"
// trong khi đường phát hành thật là Workers Builds. DR-006: 00-PROJECT_BRIEF là
// của nhatrangtravel, và sai đã rò xuống code.
//
// DOC4 đánh vào gốc rễ: DR-043 xảy ra vì bước "ghi mục đóng quyết định" chưa
// từng được thi hành, nên không có tín hiệu nào bắt BUILD-NOTES phải cập nhật.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildReport, exitCodeFor, writeReport, REPO_ROOT } from './lib/evidence'
import type { Check } from './lib/evidence'

export interface LuatCam {
  chuoi: string
  lyDo: string
  drift: string
}

/** DOC1 + DOC2 — một Check cho mỗi luật, gom mọi chỗ vi phạm vào detail. */
export function timChuoiCam(
  files: Array<{ path: string; content: string }>,
  luat: LuatCam[],
): Check[] {
  return luat.map((l) => {
    const cho: string[] = []
    for (const f of files) {
      f.content.split('\n').forEach((dong, i) => {
        if (dong.includes(l.chuoi)) cho.push(`${f.path}:${i + 1}`)
      })
    }
    return cho.length === 0
      ? {
          id: `chuoi-cam/${l.chuoi}`,
          verdict: 'pass' as const,
          detail: `không còn chỗ nào viết "${l.chuoi}"`,
          drift: [l.drift],
        }
      : {
          id: `chuoi-cam/${l.chuoi}`,
          verdict: 'fail' as const,
          detail: `"${l.chuoi}" còn ở ${cho.length} chỗ (${l.lyDo}): ${cho.slice(0, 8).join(', ')}${cho.length > 8 ? ` và ${cho.length - 8} chỗ nữa` : ''}`,
          drift: [l.drift],
        }
  })
}

/** Bắt cặp "<đường dẫn> → <URL>" trong văn bản mô tả chuyển hướng. */
export function trichLuatChuyenHuong(text: string): Array<{ tu: string; den: string }> {
  const ket: Array<{ tu: string; den: string }> = []
  const re = /(\/[^\s`]*)\s*→\s*(https?:\/\/[^\s`]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) ket.push({ tu: m[1], den: m[2] })
  return ket
}

/** DOC3 — luật mà tài liệu mô tả phải có thật trong public/_redirects. */
export function kiemChuyenHuong(buildNotes: string, redirects: string): Check[] {
  return trichLuatChuyenHuong(buildNotes).map((l) => {
    const co = redirects
      .split('\n')
      .some((d) => !d.trim().startsWith('#') && d.includes(l.tu) && d.includes(l.den))
    return co
      ? {
          id: `DOC3/${l.tu}`,
          verdict: 'pass' as const,
          detail: `BUILD-NOTES mô tả ${l.tu} → ${l.den}, public/_redirects có luật đó`,
          drift: ['DR-043'],
        }
      : {
          id: `DOC3/${l.tu}`,
          verdict: 'fail' as const,
          detail: `BUILD-NOTES mô tả chuyển hướng ${l.tu} → ${l.den} nhưng public/_redirects KHÔNG có luật đó. Tài liệu đang nói sai về production.`,
          drift: ['DR-043'],
        }
  })
}

/** DOC4 — mọi QĐ được DRIFT_LOG trích dẫn phải có mặt trong DECISIONS.md. */
export function kiemQuyetDinhDaDong(driftLog: string, decisions: string): Check[] {
  const duocTrich = new Set(driftLog.match(/QĐ-\d{4}-\d{2}-\d{2}-\d{2}/g) ?? [])
  const thieu = [...duocTrich].filter((qd) => !decisions.includes(qd)).sort()
  return [
    thieu.length === 0
      ? {
          id: 'DOC4',
          verdict: 'pass' as const,
          detail: `cả ${duocTrich.size} quyết định được DRIFT_LOG trích đều có trong DECISIONS.md`,
          drift: ['DR-043'],
        }
      : {
          id: 'DOC4',
          verdict: 'fail' as const,
          detail: `${thieu.length} quyết định được DRIFT_LOG trích nhưng không có trong DECISIONS.md: ${thieu.join(', ')}. Code đổi mà sổ không đổi là gốc rễ của DR-043.`,
          drift: ['DR-043'],
        },
  ]
}

function doc(rel: string): string {
  const p = join(REPO_ROOT, rel)
  return existsSync(p) ? readFileSync(p, 'utf8') : ''
}

function main(): void {
  const ranAt = new Date().toISOString()
  const checks: Check[] = []

  const TAI_LIEU_VAN_HANH = ['BUILD-NOTES.md', 'README.md', 'SETUP-NEW-SITE.md']
  const files = TAI_LIEU_VAN_HANH.map((p) => ({ path: p, content: doc(p) })).filter(
    (f) => f.content !== '',
  )

  if (files.length === 0) {
    checks.push({ id: 'DOC1', verdict: 'skip', detail: 'không đọc được tài liệu vận hành nào', drift: ['DR-040'] })
  } else {
    checks.push(
      ...timChuoiCam(files, [
        {
          chuoi: 'Cloudflare Pages',
          lyDo: 'đường phát hành thật là Workers Builds, không có Pages project nào tên tourdaovn — QĐ-2026-08-14-02',
          drift: 'DR-040',
        },
        {
          chuoi: 'nhatrangtravel',
          lyDo: 'tên site khác rò sang, đã từng rò xuống code',
          drift: 'DR-006',
        },
      ]),
    )
  }

  checks.push(...kiemChuyenHuong(doc('BUILD-NOTES.md'), doc('public/_redirects')))
  checks.push(...kiemQuyetDinhDaDong(doc('docs/DRIFT_LOG.md'), doc('docs/DECISIONS.md')))

  const report = buildReport('doc-reality-auditor', ranAt, checks)
  const dir = writeReport(report)
  console.log(`[doc-reality-auditor] ${report.summary.pass} đạt, ${report.summary.fail} trượt, ${report.summary.skip} không kiểm được`)
  console.log(`[doc-reality-auditor] bằng chứng: ${dir}`)
  process.exit(exitCodeFor(report))
}

main()
```

- [ ] **Step 3: Thêm lệnh chạy, chạy test, chạy thật**

```json
    "audit:doc": "node --import ./node_modules/tsx/dist/esm/index.mjs audit/doc-reality.ts",
```

```bash
npm --prefix scripts test
npm --prefix scripts run audit:doc || true
```

Kỳ vọng test: 8 test xanh.

Kỳ vọng chạy thật: **`DOC1` phải trượt.** `DR-040` ghi rõ "Cloudflare Pages" còn mở ở `README.md:66` và `SETUP-NEW-SITE.md:109–111`. Nếu `DOC1` xanh thì phép kiểm hỏng — dừng lại và soi, đừng mừng.

- [ ] **Step 4: Viết `.claude/agents/doc-reality-auditor.md`**

```markdown
---
name: doc-reality-auditor
description: Đối chiếu tài liệu vận hành với thực tế production và với sổ quyết định — bắt trường hợp README, BUILD-NOTES hay ADR đang mô tả hành vi mà site không còn làm nữa, hoặc còn tàn dư tên site khác rò sang. Dùng trước khi giao tài liệu cho người khác đọc, sau khi gỡ hoặc thêm luật chuyển hướng, sau khi đổi đường phát hành, và định kỳ khi rà soát nợ tài liệu. Không dùng để soát chính tả hay văn phong.
tools: Read, Glob, Grep, Bash
model: inherit
color: blue
---

# doc-reality-auditor

Bạn kiểm xem **tài liệu có đang nói dối về production không.**

## Vì sao vai này tồn tại

`DR-043`: `BUILD-NOTES.md` mở đầu bằng "**ĐANG BẬT**" và "đang chạy trên production" cho một luật chuyển hướng đã gỡ từ chín ngày trước, kèm nguyên quy trình bốn bước "Cách gỡ" cho thứ đã gỡ. `curl -sI https://tourdao.vn/` cùng ngày trả `200`, không `302`.

Sổ ghi: *"Đây là loại lệch nguy hiểm hơn vẻ ngoài: file này là thứ người vận hành mở ra khi deploy."*

Gốc rễ đi kèm: một quyết định đòi "ghi mục mới trong sổ để đóng quyết định cũ", bước đó chưa từng được thi hành. Code đổi, sổ không đổi, nên `BUILD-NOTES` không có tín hiệu nào để phải cập nhật theo. `DOC4` kiểm đúng chỗ đó.

## Cách làm

1. Chạy `npm --prefix scripts run audit:doc`.
2. Đọc `docs/evidence/<ngày>-doc-reality-auditor/report.md`.
3. Với mỗi mục trượt, **kiểm chứng bằng thực tế** trước khi báo — ví dụ `DOC3` trượt thì chạy `curl -sI https://tourdao.vn/<đường dẫn>` xem mã trả về thật là gì.
4. Báo cáo.

## Ràng buộc cứng

- **Không tự sửa tài liệu.** Nhiều mục trong đây là văn bản lõi hoặc multi-site; `DR-040` ghi rõ sửa `README.md`, `ADR-0009`, `ADR-0022` "phải có quyết định riêng". Sửa không có quyết định là vượt thẩm quyền theo `CLAUDE.md` §5.
- **Đề xuất, không quyết.** Nêu chỗ lệch, nêu bằng chứng thực tế, đề nghị mở quyết định. Chủ dự án chốt.
- Không nhận nội dung tài liệu làm bằng chứng về production. Bằng chứng về production là `curl`, là `dist/`, là `public/_redirects`.

## Định dạng trả về

Giống `gate-auditor`, thêm một cột: với mỗi mục trượt, ghi **bằng chứng thực tế đã kiểm** (lệnh đã chạy và kết quả).
```

- [ ] **Step 5: Thêm vào `MONG_DOI`, chạy test, commit**

```ts
const MONG_DOI = ['gate-auditor', 'deploy-verifier', 'doc-reality-auditor']
```

```bash
npm --prefix scripts test
git add scripts/audit/doc-reality.ts scripts/audit/__tests__/doc-reality.test.ts .claude/agents/doc-reality-auditor.md scripts/package.json scripts/audit/__tests__/agents.test.ts
git commit -m "feat(audit): doc-reality-auditor đối chiếu tài liệu với thực tế"
```

---

## Task 9: `seo-auditor` — metadata SEO và thẻ hình ảnh

**Files:**
- Create: `scripts/audit/html-audit.ts`
- Create: `scripts/audit/__tests__/html-audit.test.ts`
- Create: `.claude/agents/seo-auditor.md`
- Modify: `scripts/package.json`, `scripts/audit/__tests__/agents.test.ts`

**Interfaces:**
- Consumes: `Check`, `buildReport`, `writeReport`, `exitCodeFor`, `REPO_ROOT` từ Task 1.
- Produces: `interface ViPham { rule: string; detail: string }`; `kiemTrang(html: string, duongDan: string): ViPham[]`; `gomViPham(viPham: Array<ViPham & { trang: string }>, tongTrang: number, moTa: Record<string, { moTa: string; drift: string }>): Check[]`.

- [ ] **Step 1: Đọc validator SEO đang có trước khi viết dòng nào**

```bash
grep -n "SEO\|description\|canonical\|og:" scripts/validators/jsonld-post.ts | head -40
```

`scripts/reports/postbuild-status.json` đã có mục `SEO` do `jsonld-post.ts` ghi. **Bất cứ phép kiểm nào `jsonld-post.ts` đã làm thì KHÔNG được làm lại ở đây** — `CONSTITUTION` cấm tạo nguồn sự thật thứ hai cho cùng một thứ. Ghi lại vào phần đầu file `html-audit.ts` danh sách phép kiểm đã bị loại vì trùng, kèm dòng nào của `jsonld-post.ts` đã lo. Nếu `jsonld-post.ts` đã lo hết phần meta thì Task này chỉ còn phần ảnh — đó là kết quả hợp lệ, không phải thất bại.

- [ ] **Step 2: Viết test trước**

Tạo `scripts/audit/__tests__/html-audit.test.ts`. Nếu Step 1 cho thấy phép kiểm meta nào đó đã có chủ, **xoá test tương ứng ở đây** thay vì giữ cả hai.

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kiemTrang, gomViPham } from '../html-audit'

const MO_TA = {
  'IMG/alt': { moTa: 'thẻ img thiếu alt', drift: 'yêu cầu 2026-08-23' },
  'IMG/kich-thuoc': { moTa: 'thẻ img thiếu width/height', drift: 'yêu cầu 2026-08-23' },
  'IMG/lazy': { moTa: 'ảnh dưới màn hình đầu chưa lazy', drift: 'yêu cầu 2026-08-23' },
  'IMG/kich-co-sanity': { moTa: 'ảnh Sanity tải bản gốc', drift: 'yêu cầu 2026-08-23' },
  'SEO/canonical': { moTa: 'thiếu link canonical', drift: 'yêu cầu 2026-08-23' },
}

test('IMG/alt: bắt img thiếu alt, bỏ qua img có alt kể cả alt rỗng', () => {
  const html = '<img src="a.jpg"><img src="b.jpg" alt=""><img src="c.jpg" alt="mô tả">'
  const v = kiemTrang(html, '/x/').filter((x) => x.rule === 'IMG/alt')
  assert.equal(v.length, 1)
  assert.match(v[0].detail, /a\.jpg/)
})

test('IMG/kich-thuoc: bắt img thiếu width hoặc height', () => {
  const html = '<img src="a.jpg" alt="" width="10"><img src="b.jpg" alt="" width="10" height="20">'
  const v = kiemTrang(html, '/x/').filter((x) => x.rule === 'IMG/kich-thuoc')
  assert.equal(v.length, 1)
  assert.match(v[0].detail, /a\.jpg/)
})

test('IMG/lazy: ảnh đầu tiên được miễn, từ ảnh thứ hai bắt buộc lazy', () => {
  const html =
    '<img src="hero.jpg" alt=""><img src="b.jpg" alt="" loading="lazy"><img src="c.jpg" alt="">'
  const v = kiemTrang(html, '/x/').filter((x) => x.rule === 'IMG/lazy')
  assert.equal(v.length, 1)
  assert.match(v[0].detail, /c\.jpg/)
})

test('IMG/kich-co-sanity: ảnh cdn.sanity.io phải có tham số w=', () => {
  const html =
    '<img src="https://cdn.sanity.io/images/x/y/a.jpg" alt="" width="1" height="1" loading="lazy">' +
    '<img src="https://cdn.sanity.io/images/x/y/b.jpg?w=800" alt="" width="1" height="1" loading="lazy">'
  const v = kiemTrang(html, '/x/').filter((x) => x.rule === 'IMG/kich-co-sanity')
  assert.equal(v.length, 1)
  assert.match(v[0].detail, /a\.jpg/)
})

test('SEO/canonical: bắt trang thiếu canonical', () => {
  assert.equal(kiemTrang('<head></head>', '/x/').filter((x) => x.rule === 'SEO/canonical').length, 1)
  assert.equal(
    kiemTrang('<link rel="canonical" href="https://tourdao.vn/x/">', '/x/').filter(
      (x) => x.rule === 'SEO/canonical',
    ).length,
    0,
  )
})

test('trang sạch thì không sinh vi phạm nào', () => {
  const html =
    '<link rel="canonical" href="https://tourdao.vn/x/">' +
    '<img src="https://cdn.sanity.io/images/x/y/a.jpg?w=1200" alt="hero" width="1200" height="800">'
  assert.deepEqual(kiemTrang(html, '/x/'), [])
})

test('gomViPham gộp theo luật, một Check cho mỗi luật', () => {
  const vp = [
    { rule: 'IMG/alt', detail: 'a.jpg', trang: '/x/' },
    { rule: 'IMG/alt', detail: 'b.jpg', trang: '/y/' },
  ]
  const checks = gomViPham(vp, 10, MO_TA)
  const alt = checks.find((c) => c.id === 'IMG/alt')!
  assert.equal(alt.verdict, 'fail')
  assert.match(alt.detail, /2 chỗ trên 2 trang/)
  assert.equal(checks.find((c) => c.id === 'SEO/canonical')!.verdict, 'pass')
})

test('gomViPham cắt danh sách dài nhưng nói ra đã cắt bao nhiêu', () => {
  const vp = Array.from({ length: 30 }, (_, i) => ({
    rule: 'IMG/alt',
    detail: `anh-${i}.jpg`,
    trang: `/t${i}/`,
  }))
  const alt = gomViPham(vp, 30, MO_TA).find((c) => c.id === 'IMG/alt')!
  assert.match(alt.detail, /và 25 chỗ nữa/)
})
```

Test cuối quan trọng: cắt danh sách mà không nói ra đã cắt bao nhiêu chính là lỗi `N17` trong sổ — đọc phần xem trước rồi khai "kiểm hết".

- [ ] **Step 3: Chạy test, xác nhận đỏ, rồi viết `scripts/audit/html-audit.ts`**

```ts
// seo-auditor — metadata SEO và thẻ hình ảnh trên bản dựng.
//
// PHẠM VI: chỉ những phép kiểm mà scripts/validators/jsonld-post.ts CHƯA làm.
// jsonld-post.ts đã ghi mục "SEO" vào postbuild-status.json; làm lại phần nó đã
// lo là tạo nguồn sự thật thứ hai, CONSTITUTION cấm.
// <Step 1 điền vào đây: đã loại phép kiểm nào, vì dòng nào của jsonld-post.ts.>
//
// Đọc dist/ chứ không đọc src/: thứ tới tay khách là HTML đã render, không phải
// component. Ảnh do Sanity trả về chỉ lộ tham số kích cỡ ở tầng HTML.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { buildReport, exitCodeFor, writeReport, REPO_ROOT } from './lib/evidence'
import type { Check } from './lib/evidence'

export interface ViPham {
  rule: string
  detail: string
}

const MO_TA: Record<string, { moTa: string; drift: string }> = {
  'IMG/alt': { moTa: 'thẻ img thiếu thuộc tính alt', drift: 'yêu cầu 2026-08-23' },
  'IMG/kich-thuoc': { moTa: 'thẻ img thiếu width hoặc height (gây nhảy khung khi tải)', drift: 'yêu cầu 2026-08-23' },
  'IMG/lazy': { moTa: 'ảnh từ vị trí thứ hai trở đi chưa có loading="lazy"', drift: 'yêu cầu 2026-08-23' },
  'IMG/kich-co-sanity': { moTa: 'ảnh cdn.sanity.io tải bản gốc, không có tham số w=', drift: 'yêu cầu 2026-08-23' },
  'SEO/canonical': { moTa: 'trang thiếu link rel=canonical', drift: 'yêu cầu 2026-08-23' },
}

/** Lấy giá trị một thuộc tính trong chuỗi thẻ. Trả '' nếu có mặt mà rỗng, null nếu vắng. */
function thuocTinh(the: string, ten: string): string | null {
  const m = new RegExp(`\\s${ten}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(the)
  if (m) return m[2] ?? m[3] ?? ''
  return new RegExp(`\\s${ten}(\\s|>|$)`, 'i').test(the) ? '' : null
}

function nguon(the: string): string {
  return thuocTinh(the, 'src') ?? '(không có src)'
}

export function kiemTrang(html: string, duongDan: string): ViPham[] {
  const vp: ViPham[] = []

  if (!/<link[^>]+rel\s*=\s*["']canonical["']/i.test(html)) {
    vp.push({ rule: 'SEO/canonical', detail: `${duongDan}: không có <link rel="canonical">` })
  }

  const the = html.match(/<img\b[^>]*>/gi) ?? []
  the.forEach((t, i) => {
    const src = nguon(t)
    if (thuocTinh(t, 'alt') === null) {
      vp.push({ rule: 'IMG/alt', detail: `${duongDan}: ${src}` })
    }
    if (thuocTinh(t, 'width') === null || thuocTinh(t, 'height') === null) {
      vp.push({ rule: 'IMG/kich-thuoc', detail: `${duongDan}: ${src}` })
    }
    // Ảnh đầu tiên thường là hero, nằm trên màn hình đầu — lazy nó làm chậm LCP.
    if (i > 0 && (thuocTinh(t, 'loading') ?? '').toLowerCase() !== 'lazy') {
      vp.push({ rule: 'IMG/lazy', detail: `${duongDan}: ${src}` })
    }
    if (src.includes('cdn.sanity.io') && !/[?&]w=/.test(src)) {
      vp.push({ rule: 'IMG/kich-co-sanity', detail: `${duongDan}: ${src}` })
    }
  })

  return vp
}

/** Một Check cho mỗi luật, gom mọi chỗ vi phạm. Luật không ai vi phạm thì pass. */
export function gomViPham(
  viPham: Array<ViPham & { trang: string }>,
  tongTrang: number,
  moTa: Record<string, { moTa: string; drift: string }>,
): Check[] {
  return Object.entries(moTa).map(([rule, m]) => {
    const cua = viPham.filter((v) => v.rule === rule)
    if (cua.length === 0) {
      return {
        id: rule,
        verdict: 'pass' as const,
        detail: `${tongTrang} trang, không trang nào vi phạm: ${m.moTa}`,
        drift: [m.drift],
      }
    }
    const soTrang = new Set(cua.map((v) => v.trang)).size
    const hienThi = cua.slice(0, 5).map((v) => v.detail)
    const conLai = cua.length - hienThi.length
    return {
      id: rule,
      verdict: 'fail' as const,
      detail: `${m.moTa} — ${cua.length} chỗ trên ${soTrang} trang: ${hienThi.join('; ')}${conLai > 0 ? ` và ${conLai} chỗ nữa` : ''}`,
      drift: [m.drift],
    }
  })
}

function moiFileHtml(goc: string): string[] {
  const ket: string[] = []
  const di = (thuMuc: string): void => {
    for (const ten of readdirSync(thuMuc)) {
      const p = join(thuMuc, ten)
      if (statSync(p).isDirectory()) di(p)
      else if (ten.endsWith('.html')) ket.push(p)
    }
  }
  di(goc)
  return ket
}

function main(): void {
  const ranAt = new Date().toISOString()
  const dist = join(REPO_ROOT, 'dist')

  if (!existsSync(dist)) {
    const report = buildReport('seo-auditor', ranAt, [
      { id: 'SEO/0', verdict: 'skip', detail: 'không có dist/ — chạy npm run build trước', drift: ['yêu cầu 2026-08-23'] },
    ])
    console.log(`[seo-auditor] bằng chứng: ${writeReport(report)}`)
    process.exit(exitCodeFor(report))
  }

  const files = moiFileHtml(dist)
  const viPham: Array<ViPham & { trang: string }> = []
  for (const f of files) {
    const trang = `/${relative(dist, f)}`
    for (const v of kiemTrang(readFileSync(f, 'utf8'), trang)) viPham.push({ ...v, trang })
  }

  const report = buildReport('seo-auditor', ranAt, gomViPham(viPham, files.length, MO_TA))
  const dir = writeReport(report)
  console.log(`[seo-auditor] ${files.length} trang — ${report.summary.pass} đạt, ${report.summary.fail} trượt, ${report.summary.skip} không kiểm được`)
  console.log(`[seo-auditor] bằng chứng: ${dir}`)
  process.exit(exitCodeFor(report))
}

main()
```

- [ ] **Step 4: Thêm lệnh chạy, chạy test, chạy thật**

```json
    "audit:seo": "node --import ./node_modules/tsx/dist/esm/index.mjs audit/html-audit.ts",
```

```bash
npm --prefix scripts test
npm run build && npm --prefix scripts run audit:seo || true
```

Kỳ vọng test: 8 test xanh (trừ test nào đã xoá ở Step 2 vì trùng `jsonld-post.ts`).

Kỳ vọng chạy thật: chạy hết ~105 trang trong `dist/`, in số trang đã quét. **Con số trang phải khớp số file `.html` thật** — kiểm chéo bằng `find dist -name '*.html' | wc -l`. Lệch là script bỏ sót thư mục.

- [ ] **Step 5: Viết `.claude/agents/seo-auditor.md`**

```markdown
---
name: seo-auditor
description: Quét bản dựng trong dist/ để kiểm metadata SEO và thẻ hình ảnh — canonical, và với ảnh thì alt, width/height, loading lazy, tham số kích cỡ cho ảnh Sanity. Dùng sau khi build và trước khi deploy, khi vừa thêm hoặc sửa component có ảnh, khi rà soát tốc độ tải trang, hoặc khi cần bằng chứng về chất lượng SEO kỹ thuật. Không dùng để đánh giá nội dung chữ nghĩa hay thứ hạng từ khoá.
tools: Read, Glob, Grep, Bash
model: inherit
color: green
---

# seo-auditor

Bạn quét **HTML đã render trong `dist/`**, không quét component trong `src/`. Thứ tới tay khách là HTML; tham số kích cỡ ảnh Sanity chỉ lộ ra ở tầng đó.

## Cách làm

1. Kiểm `dist/` có mới hơn `src/` không: `find src -newer dist/index.html -type f -print -quit`. Có kết quả nghĩa là `dist/` cũ — chạy `npm run build` trước, nếu không bạn đang kiểm bản cũ.
2. Chạy `npm --prefix scripts run audit:seo`.
3. Đọc `docs/evidence/<ngày>-seo-auditor/report.md`.
4. Báo cáo.

## Ràng buộc cứng

- **Không kiểm lại phần `scripts/validators/jsonld-post.ts` đã kiểm.** Nó đã ghi mục `SEO` vào `postbuild-status.json`. Trùng lặp là tạo nguồn sự thật thứ hai — `CONSTITUTION` cấm.
- **Danh sách vi phạm trong báo cáo bị cắt ở 5 mục mỗi luật.** Khi báo cáo, luôn nói ra tổng số thật, không nói "một vài chỗ". Đọc phần xem trước rồi khai "đã kiểm hết" là lỗi đã ghi vào sổ.
- **Không tự sửa component.** Báo lại chỗ hỏng và đề xuất; sửa là việc của phiên chính, và sửa component có ảnh thì phải qua `astro-auditor`.
- Ảnh đầu tiên mỗi trang được miễn `loading="lazy"` có chủ ý — lazy ảnh hero làm chậm LCP. Đừng đề xuất lazy nó.

## Định dạng trả về

Giống `gate-auditor`, thêm số trang đã quét ở đầu.
```

- [ ] **Step 6: Thêm vào `MONG_DOI`, chạy test, commit**

```ts
const MONG_DOI = ['gate-auditor', 'deploy-verifier', 'doc-reality-auditor', 'seo-auditor']
```

```bash
npm --prefix scripts test
git add scripts/audit/html-audit.ts scripts/audit/__tests__/html-audit.test.ts .claude/agents/seo-auditor.md scripts/package.json scripts/audit/__tests__/agents.test.ts
git commit -m "feat(audit): seo-auditor kiểm metadata và thẻ ảnh trên dist"
```

**Kết thúc Pha 2.** Bốn auditor có script, có test, ghi bằng chứng ra đĩa.

---

# PHA 3 — Sáu agent phán đoán

Sáu agent còn lại không có script riêng, vì việc của chúng là phán đoán chứ không phải đếm. Nhưng **không có script không có nghĩa là không có bằng chứng**: mỗi agent ở pha này đều phải gọi một công cụ đã tồn tại (`astro check`, `npm run gate`, `audit:*`, `check:theme`, trình duyệt) và trích kết quả thật, không được kết luận bằng cảm nhận.

Vòng TDD của pha này là `agents.test.ts`: thêm tên vào `MONG_DOI` → test đỏ → viết file `.md` → test xanh.

## Task 10: `contract-checker` — hợp đồng dữ liệu

**Files:**
- Create: `.claude/agents/contract-checker.md`
- Modify: `scripts/audit/__tests__/agents.test.ts`

**Interfaces:**
- Consumes: `MONG_DOI` trong `agents.test.ts`.
- Produces: không có API.

Agent này **không có script mới** — và đó là quyết định có ý thức. `scripts/meta-validators/g1`, `g3`, `g4` đã kiểm content model ↔ schema, binding map ↔ template, và tính hợp lệ của field trong GROQ. Viết thêm một bộ kiểm nữa cho cùng bất biến là tạo nguồn sự thật thứ hai. Việc của agent là **chạy chúng và diễn giải**, cộng thêm một phép quét mà chưa ai làm: tìm `as any` che field không tồn tại (`DR-028`).

- [ ] **Step 1: Thêm tên vào `MONG_DOI`, chạy test, xác nhận đỏ**

```ts
const MONG_DOI = [
  'gate-auditor', 'deploy-verifier', 'doc-reality-auditor', 'seo-auditor',
  'contract-checker',
]
```

```bash
npm --prefix scripts test
```

Kỳ vọng: đỏ ở `mọi agent mong đợi đều có file`.

- [ ] **Step 2: Viết `.claude/agents/contract-checker.md`**

```markdown
---
name: contract-checker
description: Kiểm hợp đồng dữ liệu giữa schema Sanity, content model, binding map, truy vấn GROQ và template Astro — bắt trường hợp template đọc field không tồn tại, binding map khai loại trang không có thật, hoặc as any che một field đã biến mất. Dùng sau khi sửa schema trong cms/, sau khi đổi truy vấn GROQ, khi thêm loại trang mới, hoặc khi một trang render ra rỗng mà không rõ vì sao. Không dùng để kiểm giao diện hay hiệu năng.
tools: Read, Glob, Grep, Bash
model: inherit
color: cyan
---

# contract-checker

Bạn kiểm **hợp đồng giữa dữ liệu và bề mặt**: schema Sanity → content model → binding map → GROQ → template.

## Vì sao vai này tồn tại

- `DR-028`: `LodgingDetail` đọc một field không tồn tại, che bằng `as any`. Không cổng nào bắt được vì `as any` tắt đúng cái kiểm sẽ bắt.
- `DR-032`: một field đổ vào ba vùng trên trang chi tiết, trái chữ "hoặc" của `06-BINDING_MAP` §3.
- `DR-005`: binding map khai loại trang không tồn tại, và thiếu loại trang đang chạy.
- `DR-011` và `DR-027`: `g3` báo `organization` truy cập field không có trong binding map — và trước đó `g3` chưa từng đọc `06-BINDING_MAP.md`.

## Cách làm

1. **Chạy bộ meta-validator đã có** — đừng viết bộ kiểm mới:

```bash
npm --prefix scripts run audit:spec
```

Nó chạy `g1` (content model ↔ schema), `g3` (binding map ↔ template), `g4` (field trong GROQ). Kết quả ghi ở `scripts/reports/g1-*.json`, `g3-*.json`, `g4-*.json`.

2. **Đọc dòng `[gap]` trong output.** `run-gates.mjs` in ra những bất biến *đáng lẽ* kiểm mà hiện không kiểm. Hiện có ít nhất một: `g2` bị tắt theo `QĐ-2026-08-05-03`, nợ `ND-001`. Một bảng toàn `[pass]` mà im về `[gap]` là lời khai vượt quá phần đã kiểm.

3. **Quét `as any` trong `src/`** — phép này chưa ai làm:

```bash
grep -rn "as any" src/ --include='*.astro' --include='*.ts'
```

Với mỗi chỗ, mở ra xem nó đang che field nào, rồi đối chiếu field đó với `cms/schemas/<type>.ts`. Field không có trong schema là một `DR-028` nữa.

4. **Quét danh sách ngôn ngữ hardcode** — `DR-012` và `DR-024` đều là "hardcode 5 ngôn ngữ":

```bash
grep -rn "\['vi'\|\"vi\"," src/ scripts/ --include='*.ts' --include='*.astro' | grep -v node_modules
```

## Ràng buộc cứng

- **Không viết validator mới.** `g1`–`g4` đã có chủ. Trùng lặp là nguồn sự thật thứ hai, `CONSTITUTION` cấm. Nếu thấy một bất biến thật sự chưa ai kiểm, **báo lại và đề nghị mở phiếu nợ**, đừng tự viết.
- **`cms/schemas/<type>.ts` là nguồn sự thật duy nhất cho "field nào bắt buộc"** (P6 + N7). Không suy ra danh sách bắt buộc từ tài liệu.
- **Không sửa `as any` thành `as unknown as X`.** Đó là đổi cách che chứ không phải bỏ che. Báo lại field thật sự thiếu.
- Không sửa schema. Đổi schema là đổi hợp đồng, cần quyết định.

## Định dạng trả về

```
Đã chạy: npm --prefix scripts run audit:spec
Kết quả cổng: <n> xanh, <n> đỏ
Dòng [gap] cổng tự khai: <liệt kê nguyên văn>

Trượt từ g1/g3/g4:
- <mã>: <nguyên văn thông điệp> (file báo cáo: scripts/reports/<...>.json)

as any đang che field không tồn tại:
- <file>:<dòng> — field "<tên>" không có trong cms/schemas/<type>.ts

Ngôn ngữ hardcode:
- <file>:<dòng>

Đề xuất: <việc cần làm, hoặc "không có">
```
```

- [ ] **Step 3: Chạy test, xác nhận xanh, commit**

```bash
npm --prefix scripts test
git add .claude/agents/contract-checker.md scripts/audit/__tests__/agents.test.ts
git commit -m "feat(agents): contract-checker kiểm hợp đồng dữ liệu"
```

---

## Task 11: `astro-auditor` — quét component mới và tự lint

**Files:**
- Create: `.claude/agents/astro-auditor.md`
- Modify: `scripts/audit/__tests__/agents.test.ts`

**Interfaces:**
- Consumes: `MONG_DOI`; hook `post-edit-lint.sh` từ Task 5.
- Produces: không có API.

Phần "tự động kiểm tra lỗi sau khi sửa file" của yêu cầu đã do **hook** ở Task 5 lo — hook chạy vô điều kiện, không cần Claude nhớ gọi. Agent này lo phần hook không lo được: **đọc component mới viết và đối chiếu với token, với binding map, với các mục drift đã biết.**

- [ ] **Step 1: Thêm tên vào `MONG_DOI`, chạy test, xác nhận đỏ**

```ts
const MONG_DOI = [
  'gate-auditor', 'deploy-verifier', 'doc-reality-auditor', 'seo-auditor',
  'contract-checker', 'astro-auditor',
]
```

- [ ] **Step 2: Viết `.claude/agents/astro-auditor.md`**

```markdown
---
name: astro-auditor
description: Quét component Astro vừa viết hoặc vừa sửa — chạy astro check và bộ cổng, rồi đối chiếu component với nguồn token trong 07-DESIGN_TOKENS, với 06-BINDING_MAP, và với các lỗi đã từng gặp như màu hardcode ngoài token hay cấp đậm font không tồn tại. Dùng sau khi viết component mới, sau một đợt sửa nhiều file trong src/components, và trước khi mở QA2. Không dùng để kiểm bản dựng đã render — đó là việc của seo-auditor.
tools: Read, Glob, Grep, Bash
model: inherit
color: orange
---

# astro-auditor

Bạn soi **mã nguồn component**, không soi HTML đã render.

Phần lint tự động sau mỗi lần sửa file đã do hook `post-edit-lint.sh` lo — nó chạy `npm run check` vô điều kiện khi file trong `src/` đổi. Việc của bạn là phần hook không làm được: đọc mã và đối chiếu với hợp đồng.

## Cách làm

1. **Xác định phạm vi.** Mặc định là mã chưa commit:

```bash
git status --porcelain src/
git diff --stat src/
```

Nếu phiên chính chỉ định file khác thì theo chỉ định đó.

2. **Chạy cổng:**

```bash
npm run check
npm run gate
```

`npm run gate` = `astro check && npm --prefix scripts run gate:all`. Đọc cả bảng tổng kết **và** các dòng `[gap]`.

3. **Đối chiếu từng component trong phạm vi** với năm lỗi đã từng gặp:

| Soi gì | Vì sao | Cách tìm |
|---|---|---|
| Màu, cỡ chữ, khoảng cách viết cứng ngoài token | `DR-002`, `DR-037` (`theme-color` hardcode màu site cũ) | `grep -nE '#[0-9a-fA-F]{3,8}\|rgb\(' <file>` |
| Cấp đậm font mà bộ chữ không có | `DR-031` — 16 chỗ xin 800/900 mà Lora không có | `grep -nE 'font-weight:\s*(800\|900)\|font-\(?bold\|black' <file>` |
| Một field đổ vào nhiều vùng | `DR-032` — trái chữ "hoặc" của `06-BINDING_MAP` §3 | đọc, không grep được |
| `as any` | `DR-028` | `grep -n 'as any' <file>` |
| Clamp số dòng mà không chặn tràn | `DR-038` — clamp 2 dòng vẫn lòi dòng 3 | `grep -n 'line-clamp' <file>` |

4. **Đối chiếu với `docs/core-specs/07-DESIGN_TOKENS.md`** cho mọi giá trị thị giác tìm được ở bước 3.

## Ràng buộc cứng

- **Không sửa.** Bạn báo cáo. Sửa là việc của phiên chính — vì nhiều mục ở đây đụng token, mà token là artifact đã duyệt.
- **Không đề xuất giá trị token mới.** Thấy một giá trị không có trong `07-DESIGN_TOKENS` thì báo là thiếu, đừng bịa số.
- **`npm run gate` xanh không có nghĩa là đủ.** Đọc dòng `[gap]`: `g2` hiện bị tắt, nợ `ND-001`, nên bất biến "field bắt buộc khai trong content model thì cũng bắt buộc lúc thi hành" không có ai kiểm. Luôn nói ra điều này khi kết luận.
- Nếu `astro check` đỏ, dừng ở đó và báo. Đối chiếu token trên mã không biên dịch được là lãng phí.

## Định dạng trả về

```
Phạm vi: <danh sách file>
astro check: <xanh/đỏ, số lỗi>
npm run gate: <n> xanh, <n> đỏ
[gap] cổng tự khai: <nguyên văn>

Phát hiện:
- <file>:<dòng> — <vấn đề> (truy về <DR-nnn>)

Đề xuất: <việc cần làm, hoặc "không có">
```
```

- [ ] **Step 3: Chạy test, xác nhận xanh, commit**

```bash
npm --prefix scripts test
git add .claude/agents/astro-auditor.md scripts/audit/__tests__/agents.test.ts
git commit -m "feat(agents): astro-auditor quét component và chạy cổng"
```

---

## Task 12: `ui-auditor` — vỡ khung trên di động và khó nhìn

**Files:**
- Create: `.claude/agents/ui-auditor.md`
- Modify: `scripts/audit/__tests__/agents.test.ts`

**Interfaces:**
- Consumes: `MONG_DOI`; công cụ MCP `claude-in-chrome`.
- Produces: không có API.

Đây là agent duy nhất trong bộ dùng trình duyệt thật. Phép đo "vỡ khung hình" phải là **phép đo**, không phải cảm nhận: `document.documentElement.scrollWidth > document.documentElement.clientWidth` là tràn ngang, đúng hay sai, không tranh cãi.

- [ ] **Step 1: Thêm tên vào `MONG_DOI`, chạy test, xác nhận đỏ**

```ts
const MONG_DOI = [
  'gate-auditor', 'deploy-verifier', 'doc-reality-auditor', 'seo-auditor',
  'contract-checker', 'astro-auditor', 'ui-auditor',
]
```

- [ ] **Step 2: Viết `.claude/agents/ui-auditor.md`**

```markdown
---
name: ui-auditor
description: Mở trang thật trong Chrome ở nhiều khổ màn hình để đo xem giao diện có vỡ khung, tràn ngang, chồng lấn, chữ bị cắt hay tương phản không đủ hay không. Dùng khi cần kiểm trang chủ hoặc trang chi tiết trên điện thoại, sau khi sửa layout hoặc thanh dính, khi ai đó báo trang khó nhìn trên di động, và trước khi mở QA2 cho một đợt thiết kế. Không dùng để đọc mã nguồn component — đó là việc của astro-auditor.
tools: Read, Glob, Grep, Bash, mcp__claude-in-chrome__tabs_context_mcp, mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__tabs_close_mcp, mcp__claude-in-chrome__navigate, mcp__claude-in-chrome__computer, mcp__claude-in-chrome__resize_window, mcp__claude-in-chrome__javascript_tool, mcp__claude-in-chrome__read_page
model: inherit
color: purple
---

# ui-auditor

Bạn **đo**, không cảm nhận. Mọi kết luận phải kèm một con số hoặc một ảnh chụp.

## Vì sao vai này tồn tại

Bảy mục drift về giao diện đều được tìm ra bằng tay trong các đợt audit rời rạc: `DR-033` sidebar dính bị header và thanh dính che; `DR-034` thang chữ render lớn hơn `07-DESIGN_TOKENS` 6,25 % ở mọi bậc; `DR-038` thẻ danh sách clamp 2 dòng nhưng vẫn lòi dòng 3; `DR-029` site chưa bao giờ hiện đúng font đã duyệt. Không cái nào có phép đo tự động.

## Cách làm

1. **Lấy bối cảnh tab trước** — `tabs_context_mcp`. Đừng dùng lại tab của phiên khác. Tạo tab mới bằng `tabs_create_mcp`.

2. **Chọn nguồn.** Mặc định là `http://localhost:4321` sau khi phiên chính đã chạy `npm run dev`. Kiểm trang production thì dùng `https://tourdao.vn` và **nói rõ trong báo cáo là đang đo production**, vì production có thể không phải bản vừa dựng — xem `deploy-verifier`.

3. **Ba khổ màn hình**, dùng `resize_window`:

| Khổ | Kích thước | Đại diện |
|---|---|---|
| Điện thoại | 390 × 844 | iPhone phổ thông |
| Máy tính bảng | 768 × 1024 | iPad dọc |
| Máy để bàn | 1440 × 900 | laptop |

4. **Ở mỗi khổ, chạy phép đo bằng `javascript_tool`:**

```js
const r = {
  tranNgang: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  rongCuon: document.documentElement.scrollWidth,
  rongKhung: document.documentElement.clientWidth,
  phanTuTran: [...document.querySelectorAll('*')]
    .filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
    .slice(0, 10)
    .map((e) => `${e.tagName.toLowerCase()}.${e.className || '(không lớp)'} rộng ${Math.round(e.getBoundingClientRect().width)}px`),
  chuNhoHon12px: [...document.querySelectorAll('p, li, span, a')]
    .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12)
    .slice(0, 10)
    .map((e) => `${e.tagName.toLowerCase()}: ${getComputedStyle(e).fontSize}`),
  chuBiCat: [...document.querySelectorAll('*')]
    .filter((e) => e.scrollHeight > e.clientHeight + 2 && getComputedStyle(e).overflow === 'hidden')
    .slice(0, 10)
    .map((e) => `${e.tagName.toLowerCase()}.${e.className || '(không lớp)'} tràn ${e.scrollHeight - e.clientHeight}px`),
};
console.log('[ui-auditor]', JSON.stringify(r, null, 2));
```

Đọc kết quả bằng `read_console_messages` với `pattern: "\\[ui-auditor\\]"` nếu output không trả về trực tiếp.

`tranNgang > 0` là **vỡ khung**, không phải ý kiến. `chuBiCat` bắt đúng loại lỗi `DR-038`.

5. **Chụp màn hình mỗi khổ** bằng `computer` với action screenshot. Ảnh là bằng chứng hạng E1.

6. **Chạy phép kiểm tương phản đã có** — đừng viết lại:

```bash
npm --prefix scripts run check:theme
```

## Ràng buộc cứng

- **Không gây hộp thoại.** Không bấm nút xoá, không kích `alert`/`confirm`. Hộp thoại chặn mọi lệnh sau đó và làm mất phiên trình duyệt.
- **Không sửa CSS.** Bạn đo và báo. Sửa token hay layout là việc cần quyết định — `07-DESIGN_TOKENS` là artifact đã duyệt.
- **Đóng tab đã mở** khi xong.
- **Thất bại 2–3 lần thì dừng và hỏi**, đừng thử vòng. Trang không tải, phần tử không phản hồi, extension im — báo lại đã thử gì, hỏng ở đâu.
- **Nói rõ đã đo trang nào, ở nguồn nào.** "Trang chủ ổn trên di động" mà không nói localhost hay production là lời khai không kiểm chứng được.

## Định dạng trả về

```
Nguồn: <localhost:4321 | tourdao.vn>  |  Trang: <danh sách đường dẫn>

| Khổ | Tràn ngang | Chữ < 12px | Chữ bị cắt |
|---|---|---|---|
| 390×844 | <n>px | <n> chỗ | <n> chỗ |
| 768×1024 | ... | ... | ... |
| 1440×900 | ... | ... | ... |

Phần tử tràn (390×844):
- <thẻ>.<lớp> rộng <n>px

check:theme: <xanh/đỏ, chi tiết>

Ảnh chụp: <mô tả những gì thấy>
Đề xuất: <việc cần làm, hoặc "không có">
```
```

- [ ] **Step 3: Chạy test, xác nhận xanh, và thử agent thật một lần**

```bash
npm --prefix scripts test
```

Thử thật: ở phiên chính, chạy `npm run dev` rồi yêu cầu `ui-auditor` đo trang chủ. Kiểm hai điều: (a) nó có thật sự chạy `javascript_tool` và trả về con số, không phải mô tả suông; (b) nó có đóng tab không.

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/ui-auditor.md scripts/audit/__tests__/agents.test.ts
git commit -m "feat(agents): ui-auditor đo vỡ khung và độ dễ nhìn bằng trình duyệt thật"
```

---

## Task 13: `code-reviewer` và `debugger`

**Files:**
- Create: `.claude/agents/code-reviewer.md`
- Create: `.claude/agents/debugger.md`
- Modify: `scripts/audit/__tests__/agents.test.ts`

**Interfaces:**
- Consumes: `MONG_DOI`.
- Produces: không có API.

Hai agent này gần nhau nên phải vạch ranh giới rõ, nếu không Claude sẽ chọn nhầm. Ranh giới: **`code-reviewer` đọc diff khi chưa ai báo hỏng; `debugger` đọc triệu chứng khi đã có thứ hỏng.**

Lưu ý: dự án đã dùng skill `/code-review` chung. Agent `code-reviewer` ở đây **không thay thế nó** — nó là bản chuyên cho giao diện và UX của tourdaovn, biết các mục drift của chính dự án này. Khi phân vân, `/code-review` lo phần đúng-sai chung của mã, agent này lo phần hợp đồng thị giác.

- [ ] **Step 1: Thêm hai tên vào `MONG_DOI`, chạy test, xác nhận đỏ**

```ts
const MONG_DOI = [
  'gate-auditor', 'deploy-verifier', 'doc-reality-auditor', 'seo-auditor',
  'contract-checker', 'astro-auditor', 'ui-auditor',
  'code-reviewer', 'debugger',
]
```

- [ ] **Step 2: Viết `.claude/agents/code-reviewer.md`**

```markdown
---
name: code-reviewer
description: Duyệt mã nguồn giao diện và trải nghiệm người dùng của tourdaovn trước khi commit hoặc merge — đối chiếu diff với 06-BINDING_MAP, 07-DESIGN_TOKENS, và các lỗi thị giác đã ghi trong sổ drift của chính dự án này. Dùng khi vừa viết xong một tính năng giao diện, trước khi mở QA2, và trước khi merge nhánh. Khi cần tìm nguyên nhân một thứ đang hỏng thì dùng debugger chứ không dùng agent này.
tools: Read, Glob, Grep, Bash
model: inherit
color: green
---

# code-reviewer

Bạn duyệt **diff**, khi chưa ai báo có gì hỏng. Câu hỏi của bạn là *"mã này có giữ đúng hợp đồng không"*, không phải *"vì sao nó hỏng"*.

## Cách làm

1. **Lấy phạm vi:**

```bash
git diff --stat
git diff
```

Phiên chính chỉ định phạm vi khác thì theo chỉ định đó.

2. **Đọc hợp đồng trước khi đọc mã**, đúng thứ tự thẩm quyền ở `CLAUDE.md` §1:
   - `docs/core-specs/04-CONSTRAINTS.md`
   - `docs/core-specs/06-BINDING_MAP.md`
   - `docs/core-specs/07-DESIGN_TOKENS.md`
   - spec của task hiện tại, nếu có

3. **Soi diff theo bốn trục**, xếp phát hiện theo mức:

| Mức | Nghĩa |
|---|---|
| CHẶN | Trái một ràng buộc đã duyệt, hoặc lặp lại một mục drift đã biết |
| SỬA | Đúng hợp đồng nhưng sai cách, sẽ thành nợ |
| HỎI | Không đủ dữ kiện để kết luận, cần chủ dự án trả lời |
| GHI | Đáng ghi vào sổ nhưng không chặn đợt này |

Bốn trục:

- **Hợp đồng thị giác** — giá trị màu, cỡ chữ, khoảng cách có nằm trong `07-DESIGN_TOKENS` không (`DR-002`, `DR-034`, `DR-037`).
- **Hợp đồng dữ liệu** — field template đọc có trong binding map không; một field có đổ vào nhiều vùng không (`DR-032`); có `as any` không (`DR-028`).
- **Hành vi rìa** — trang rỗng có bị sinh ra không (`DR-030`); CTA dự phòng trỏ đi đâu (`DR-036`); nhãn cho cùng một giá trị có hai bảng không (`DR-035`).
- **Lặp lại lịch sử** — mở `docs/DRIFT_LOG.md`, tìm mục nào mô tả đúng thứ diff này đang làm.

## Ràng buộc cứng

- **Không sửa mã.** Bạn duyệt. Sửa là việc của phiên chính.
- **Không tự chấm QA cho artifact mình duyệt.** `GOVERNANCE` tách soạn và chấm; kết luận của bạn là điều kiện cần, chủ dự án chốt là điều kiện đủ.
- **Im lặng là trượt.** Không đủ dữ kiện thì ghi HỎI, đừng cho qua.
- **Mỗi phát hiện phải chỉ được `file:dòng`.** "Có vẻ chưa ổn ở phần header" không phải phát hiện.
- Không nới ràng buộc bằng lập luận. Thấy ràng buộc sai thì đề nghị mở ADR.

## Định dạng trả về

```
Phạm vi: <n> file, <n> dòng thêm, <n> dòng bớt
Hợp đồng đã đọc: <danh sách>

CHẶN:
- <file>:<dòng> — <vấn đề> — trái <ràng buộc/DR-nnn>

SỬA:
- <file>:<dòng> — <vấn đề>

HỎI:
- <câu hỏi cần chủ dự án trả lời>

GHI:
- <đề nghị mở mục drift mới, nếu có>

Kết luận: <đủ điều kiện mở QA2 / chưa đủ, vì ...>
```
```

- [ ] **Step 3: Viết `.claude/agents/debugger.md`**

```markdown
---
name: debugger
description: Tìm nguyên nhân gốc của một lỗi giao diện hoặc API đang xảy ra trên tourdaovn — trang render sai hoặc rỗng, thành phần không hiện, truy vấn Sanity trả về thiếu, build hoặc test đỏ, site chạy khác với mã nguồn, hoặc cần đọc log lỗi thời gian thực của Cloudflare Worker qua wrangler tail. Dùng khi đã có triệu chứng cụ thể cần truy nguyên. Khi chỉ muốn duyệt mã chưa ai báo hỏng thì dùng code-reviewer; khi nghi bản deploy không lên thì dùng deploy-verifier.
tools: Read, Glob, Grep, Bash
model: inherit
color: red
---

# debugger

Bạn có **một triệu chứng cụ thể** và phải tìm nguyên nhân gốc. Không có triệu chứng thì đây không phải việc của bạn.

## Quy tắc số một

**Đừng sửa trước khi tái hiện được.** Một bản sửa cho lỗi chưa tái hiện là một bản sửa cho lỗi tưởng tượng. Nếu không tái hiện được, hãy nói ra và hỏi thêm dữ kiện.

## Thứ tự truy nguyên

Đi từ ngoài vào trong. Dừng ngay khi tìm ra tầng gây lỗi, đừng đi tiếp.

1. **Bản đang chạy có đúng là bản mã nguồn này không?**

```bash
git rev-list --count origin/main..HEAD
find src -newer dist/index.html -type f -print -quit
```

Khác 0 hoặc có kết quả nghĩa là **bạn đang soi mã không phải mã đang chạy**. Đó là `DR-041`, và nó tiêu tốn nguyên một đợt. Dừng, báo lại, gọi `deploy-verifier`.

2. **Build có đỏ không?**

```bash
npm run check
```

3. **Cổng có đỏ không, và cổng có thật sự chạy không?**

```bash
npm run gate
```

Đọc cả dòng `[gap]`. Một cổng xanh vì nó không kiểm gì thì không nói lên điều gì — đó là `DR-021`. Nghi ngờ thì gọi `gate-auditor`.

4. **Dữ liệu có đúng không?** Truy vấn GROQ chỉ đọc:

```bash
npm --prefix scripts run precheck
```

Cần truy vấn tự do thì dùng công cụ MCP Sanity **chỉ đọc** (`query_documents`, `get_document`, `get_schema`). Lệnh ghi bị `guard-data-mutation.sh` chặn, và đó là cố ý.

5. **Render có đúng không?** Mở trang thật — gọi `ui-auditor` nếu là lỗi thị giác, hoặc đọc `dist/<đường dẫn>/index.html` nếu là lỗi nội dung.

6. **Worker có báo lỗi lúc chạy không?** Đây là tầng duy nhất không thấy được từ mã nguồn hay `dist/`:

```bash
npx wrangler deployments list          # version nào đang phục vụ, tạo lúc nào
npx wrangler versions list             # lịch sử, đối chiếu với giờ deploy
timeout 60 npx wrangler tail --format json   # log thời gian thực, 60 giây rồi tự dừng
```

`wrangler tail` chạy vô hạn nếu không chặn — **luôn bọc `timeout`**, nếu không phiên sẽ treo. Log chỉ chảy khi có người truy cập; muốn thấy log của một trang cụ thể thì mở trang đó ở tab khác trong lúc `tail` đang chạy.

Đọc `deployments list` trước khi kết luận bất cứ điều gì về production: nếu version đang phục vụ được tạo **sau** lần `wrangler deploy` gần nhất của bạn, thì bản của bạn đã bị một bản dựng tự động đè lên. Đó là `DR-041`.

7. **Test có đỏ không?**

```bash
npm --prefix scripts test
```

Test đỏ ở `scripts/audit/__tests__/` nghĩa là chính bộ kiểm hỏng, không phải sản phẩm hỏng. Sửa bộ kiểm trước.

## Ràng buộc cứng

- **Sửa nhỏ nhất chạm đúng nguyên nhân gốc.** Không nhân dịp dọn dẹp.
- **Không dùng `as any` để làm hết lỗi kiểu.** Đó là `DR-028`: che field không tồn tại. Field thiếu thì báo field thiếu.
- **Không sửa cổng cho nó xanh.** Cổng đỏ là tin tức, không phải chướng ngại.
- **Mỗi kết luận nguyên nhân phải kèm bằng chứng tái hiện** — lệnh đã chạy và output thật.
- Nếu nguyên nhân nằm ở tầng quyết định (ràng buộc mâu thuẫn, spec thiếu), dừng theo `CLAUDE.md` §5 và nêu ra, đừng tự hoà giải.

## Định dạng trả về

```
Triệu chứng: <mô tả>
Tái hiện được: <có/không> — <lệnh và output>

Đã loại trừ:
- Tầng <n>: <lệnh> → <kết quả> → không phải ở đây

Nguyên nhân gốc: <file>:<dòng> — <giải thích>
Bằng chứng: <lệnh và output chứng minh>

Bản sửa đề xuất: <mô tả thay đổi nhỏ nhất>
Rủi ro: <cái gì có thể vỡ theo>
```
```

- [ ] **Step 4: Chạy test, xác nhận xanh, commit**

```bash
npm --prefix scripts test
git add .claude/agents/code-reviewer.md .claude/agents/debugger.md scripts/audit/__tests__/agents.test.ts
git commit -m "feat(agents): code-reviewer và debugger"
```

---

## Task 14: `data-reader` và bản đăng ký cả bộ

**Files:**
- Create: `.claude/agents/data-reader.md`
- Create: `.claude/agents/README.md`
- Modify: `scripts/audit/__tests__/agents.test.ts`

**Interfaces:**
- Consumes: `MONG_DOI`; giao ước cờ `.claude/.cho-phep-ghi-du-lieu` từ Task 4.
- Produces: không có API. Đây là task đóng kế hoạch.

- [ ] **Step 1: Thêm tên vào `MONG_DOI` và thêm phép kiểm chốt số lượng**

```ts
const MONG_DOI = [
  'gate-auditor', 'deploy-verifier', 'doc-reality-auditor', 'seo-auditor',
  'contract-checker', 'astro-auditor', 'ui-auditor',
  'code-reviewer', 'debugger', 'data-reader',
]
```

Thêm một test nữa vào cuối `agents.test.ts`:

```ts
test('đúng 10 agent, không thừa không thiếu', () => {
  const co = readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => basename(f, '.md'))
    .sort()
  assert.deepEqual(co, [...MONG_DOI].sort())
})

test('data-reader không được cấp công cụ ghi', () => {
  const fm = docFrontmatter(join(AGENTS_DIR, 'data-reader.md'))
  const tools = (fm.tools as string).split(',').map((s) => s.trim())
  for (const cam of ['Write', 'Edit', 'NotebookEdit']) {
    assert.equal(tools.includes(cam), false, `data-reader không được cấp ${cam}`)
  }
})
```

Test thứ hai là lớp 1 của phòng thủ hai lớp đã ghi ở mục *Giới hạn đã biết*. Nó chốt cứng bằng test, nên ai nới `tools:` sau này sẽ làm đỏ CI.

- [ ] **Step 2: Chạy test, xác nhận đỏ**

```bash
npm --prefix scripts test
```

- [ ] **Step 3: Viết `.claude/agents/data-reader.md`**

```markdown
---
name: data-reader
description: Truy vấn dữ liệu Sanity của tourdaovn ở chế độ chỉ đọc để trả lời câu hỏi về nội dung — có bao nhiêu tour đang publish, document nào thiếu field bắt buộc, slug nào trùng, reference nào trỏ vào chỗ trống. Dùng khi cần số liệu hoặc mẫu dữ liệu thật trước khi quyết định, và khi cần thử một truy vấn GROQ. Không bao giờ dùng để sửa, xoá, publish hay migrate dữ liệu.
tools: Read, Glob, Grep, Bash
model: inherit
color: cyan
---

# data-reader

Bạn **chỉ đọc**. Không ghi, không xoá, không publish, không migrate.

## Hai lớp giữ bạn ở trong ranh giới

**Lớp 1 — công cụ.** Frontmatter không cấp `Write`, `Edit`, `NotebookEdit`. Có một test khoá chuyện này: `agents.test.ts` sẽ đỏ nếu ai nới danh sách.

**Lớp 2 — hook.** `.claude/hooks/guard-data-mutation.sh` chặn ở tầng `PreToolUse` mọi lệnh ghi dữ liệu: `publish:drafts`, `patch:n5*`, `backfill:seo-meta`, `scripts/migrate/`, `sanity documents create|delete|replace`, `sanity dataset delete`, và các công cụ MCP Sanity ghi.

Điều bạn cần biết về lớp 2: **nó chặn mọi agent, không riêng bạn.** Hook không có cách nào biết nó đang chạy trong subagent nào — JSON vào hook chỉ có `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, `tool_name`, `tool_input`. Nên hàng rào được dựng rộng hơn thay vì hẹp hơn.

Có một cờ mở khoá: `.claude/.cho-phep-ghi-du-lieu`, hiệu lực 30 phút. **Bạn không bao giờ được tạo cờ đó.** Thấy một việc cần ghi dữ liệu thì báo lại cho phiên chính và dừng.

## Cách làm

**Ưu tiên script đã có** trước khi viết truy vấn mới:

```bash
npm --prefix scripts run precheck          # soát bản nháp
npm --prefix scripts run precheck:batch    # soát theo lô
```

**Truy vấn tự do** thì dùng công cụ MCP Sanity chỉ đọc: `query_documents`, `get_document`, `get_schema`, `list_datasets`, `semantic_search`.

**Trước khi viết GROQ, luôn đọc schema trước** — `get_schema`. `cms/schemas/<type>.ts` là nguồn sự thật duy nhất cho field nào tồn tại và field nào bắt buộc (P6 + N7). Đoán tên field rồi báo "không có dữ liệu" là kết luận sai.

## Ràng buộc cứng

- **Không tạo `.claude/.cho-phep-ghi-du-lieu`.** Không bao giờ, không vì lý do gì.
- **Không chạy lệnh có `--dry-run=false`, `--force`, `--replace`.**
- **Nói rõ dataset đang truy vấn.** Số đếm ở `production` khác `development`; không nói ra là số vô nghĩa.
- **Không suy ra kết luận từ mẫu.** Lấy 10 document không cho phép nói "mọi tour đều thiếu field X". Muốn nói "mọi" thì phải đếm bằng `count()`.
- **Truy vấn bị hook chặn thì báo lại nguyên văn thông điệp chặn**, đừng tìm đường vòng.

## Định dạng trả về

```
Dataset: <production/development>
Truy vấn đã chạy: <GROQ nguyên văn>
Số bản ghi: <n> (đếm bằng count(), không phải bằng độ dài mẫu)

Kết quả:
<bảng hoặc danh sách>

Giới hạn của câu trả lời này: <mẫu bao nhiêu, suy rộng được tới đâu>
```
```

- [ ] **Step 4: Viết `.claude/agents/README.md` — bản đăng ký**

```markdown
# Subagent của tourdaovn

Mười agent, chia ba nhóm theo thứ bạn muốn biết.

## Nhóm 1 — kiểm chính bộ kiểm và đường phát hành

| Agent | Trả lời câu hỏi | Chạy gì |
|---|---|---|
| `gate-auditor` | Cổng có thật sự chạy không, hay in `[pass]` cho phép kiểm nó không thực hiện | `audit:gate` |
| `deploy-verifier` | Bit đang phục vụ khách có đúng là bit vừa dựng không | `audit:deploy` |
| `doc-reality-auditor` | Tài liệu có đang nói dối về production không | `audit:doc` |

## Nhóm 2 — kiểm sản phẩm

| Agent | Trả lời câu hỏi | Chạy gì |
|---|---|---|
| `seo-auditor` | Metadata và thẻ ảnh trên `dist/` có đạt không | `audit:seo` |
| `astro-auditor` | Component vừa viết có giữ đúng token và binding map không | `npm run gate` |
| `ui-auditor` | Trang có vỡ khung hay khó nhìn trên di động không | Chrome + `check:theme` |
| `contract-checker` | Template có đọc field không tồn tại không | `audit:spec` |

## Nhóm 3 — làm việc trên mã và dữ liệu

| Agent | Dùng khi |
|---|---|
| `code-reviewer` | Có diff, chưa ai báo hỏng |
| `debugger` | Có triệu chứng cụ thể, cần truy nguyên — gồm cả log Worker qua `wrangler tail` |
| `data-reader` | Cần số liệu hoặc mẫu dữ liệu thật, chỉ đọc |

## Bốn hook đi kèm

| Hook | Sự kiện | Chặn gì |
|---|---|---|
| `block-git-add-all.sh` | PreToolUse(Bash) | `git add -A/--all/.`, `git commit -a` |
| `guard-deploy.sh` | PreToolUse(Bash) | Deploy khi còn commit chưa push, hoặc `dist/` cũ hơn `src/` |
| `guard-data-mutation.sh` | PreToolUse(Bash, mcp\_\_Sanity\_\_\*) | Lệnh ghi dữ liệu, trừ khi có cờ `.claude/.cho-phep-ghi-du-lieu` |
| `post-edit-lint.sh` | PostToolUse(Edit/Write) | Không chặn — chạy `astro check` khi file `src/` đổi |

Hook chỉ nạp lúc phiên bắt đầu. Sửa `.claude/settings.json` giữa phiên thì phải khởi động lại mới có tác dụng.

## Giao ước bằng chứng

Mọi agent nhóm 1 và 2 ghi ra `docs/evidence/<ngày>-<tên-agent>/report.json` và `report.md`.

`CLAUDE.md` §6: *"Mặc định của cổng là không đạt nếu không có bằng chứng"*, và `GOVERNANCE` 5.1 không nhận lời tự khai của tác nhân làm bằng chứng. Nên **câu văn của agent không phải bằng chứng; file `report.json` mới là.** Trích một kết luận mà không trích được file báo cáo là lặp lại đúng lỗi `DR-021`.

Một điểm nữa lấy thẳng từ `DR-021`: `skip` không phải `pass`. Báo cáo có `skip` nghĩa là có bất biến không ai kiểm. Câu kết của mọi agent phải nói ra số `skip`.
```

- [ ] **Step 5: Chạy toàn bộ test và các cổng**

```bash
npm --prefix scripts test
npm run check:cwd
npm run check
```

Kỳ vọng: toàn bộ test xanh, kể cả hai test mới ở Step 1; `check:cwd` im lặng; `astro check` không phát sinh lỗi mới.

- [ ] **Step 6: Chạy thử cả bốn lệnh audit một lượt**

```bash
npm run build
for c in gate deploy doc seo; do
  echo "===== audit:$c ====="
  npm --prefix scripts run "audit:$c" || true
done
ls -d docs/evidence/*-{gate-auditor,deploy-verifier,doc-reality-auditor,seo-auditor}
```

Kỳ vọng: bốn thư mục bằng chứng của hôm nay tồn tại, mỗi thư mục có `report.json` và `report.md`. **Có mục trượt là bình thường và đúng** — `GA4` và `DOC1` gần như chắc chắn trượt theo đúng những gì sổ drift đã ghi. Bốn báo cáo toàn xanh là dấu hiệu phép kiểm hỏng, không phải dấu hiệu repo sạch.

- [ ] **Step 7: Commit**

```bash
git add .claude/agents/data-reader.md .claude/agents/README.md scripts/audit/__tests__/agents.test.ts
git commit -m "feat(agents): data-reader chỉ đọc và bản đăng ký cả bộ"
```

- [ ] **Step 8: Điểm dừng chờ chủ dự án**

Kế hoạch này **không** sửa `CLAUDE.md`. Thêm một mục trỏ tới `.claude/agents/README.md` trong `CLAUDE.md` §3 (Role routing) sẽ giúp agent dễ được tìm thấy, nhưng `CLAUDE.md` là văn bản định tuyến cấp dự án — sửa nó cần chủ dự án gật, theo `CLAUDE.md` §5 ("Yêu cầu sửa luật gốc mà không có thẩm quyền rõ ràng" là hard stop).

Trình bày cho chủ dự án hai việc và chờ chốt:

1. Có thêm mục trỏ tới bản đăng ký agent trong `CLAUDE.md` không.
2. Có mở phiếu drift mới cho những gì `gate-auditor` và `doc-reality-auditor` vừa bắt được không, hay chúng đã nằm trong mục cũ.

---

# Đối chiếu kế hoạch với yêu cầu

Bảng này để người duyệt kiểm nhanh xem có sót gì không.

| Yêu cầu ngày 2026-08-23 | Giao ở đâu |
|---|---|
| Soi lỗi giao diện, tối ưu giao diện | `ui-auditor` (Task 12) |
| Kiểm thử, kiểm log lỗi từ Wrangler | `debugger` tầng 6 và 7 (Task 13) |
| Quét component mới viết | `astro-auditor` (Task 11) |
| Kiểm metadata SEO | `seo-auditor` (Task 9) |
| Kiểm thẻ hình ảnh đã tối ưu chưa, đưa ra cảnh báo | `seo-auditor`, bốn luật `IMG/*` (Task 9) |
| Subagent chỉ đọc dữ liệu, chặn qua PreToolUse hook | `data-reader` (Task 14) + `guard-data-mutation.sh` (Task 4) |
| `astro-auditor.md` tích hợp tự lint sau khi sửa file | `post-edit-lint.sh` (Task 5) + `astro-auditor` (Task 11) |
| `code-reviewer` duyệt mã giao diện và UX | Task 13 |
| `debugger` tìm và sửa lỗi giao diện/API | Task 13 |
| Kiểm trang chủ vỡ khung trên di động, khó nhìn | `ui-auditor`, phép đo `tranNgang`/`chuBiCat`/`chuNhoHon12px` (Task 12) |
| *(bổ sung)* Kiểm chính bộ kiểm | `gate-auditor` (Task 6) |
| *(bổ sung)* Kiểm bản đang chạy thật | `deploy-verifier` (Task 7) |
| *(bổ sung)* Kiểm tài liệu vs thực tế | `doc-reality-auditor` (Task 8) |
| *(bổ sung)* Kiểm hợp đồng dữ liệu | `contract-checker` (Task 10) |
| Hook chặn `git add -A` | Task 2 |
| Hook chặn deploy rủi ro | Task 3 |
| Hook chặn ghi dữ liệu | Task 4 |
| Hook tự lint sau khi sửa file | Task 5 |

**Một yêu cầu không được thực hiện đúng nghĩa đen, đã đổi cách làm:** hook không thể giới hạn riêng subagent `data-reader`, vì JSON vào hook không có trường nào cho biết đang chạy trong subagent nào. Đã thay bằng phòng thủ hai lớp — `tools:` tối thiểu (khoá bằng test) và hook chặn ghi dữ liệu cho mọi agent. Chi tiết ở mục *Giới hạn đã biết* đầu kế hoạch.

# Thứ kế hoạch này cố ý không làm

- **Không nối bất cứ thứ gì vào CI.** `build:ci` = `npm run build`, không chạy validator nào, theo `ADR-0022`. Đổi điều đó là đổi đường phát hành, cần quyết định riêng.
- **Không sửa `CLAUDE.md`.** Xem Task 14 Step 8.
- **Không đóng mục drift nào.** Bộ kiểm này *phát hiện*; đóng một mục drift là việc cần bằng chứng và chữ ký, không phải việc của script.
- **Không viết validator mới cho bất biến đã có chủ.** `g1`–`g4`, `jsonld-post`, `r3-r4-post` giữ nguyên phạm vi. Chỗ nào thấy trùng thì cắt phần mới, không cắt phần cũ.
- **Không tự động chạy `audit:*` sau mỗi lần sửa.** Chỉ `post-edit-lint.sh` chạy tự động, vì nó nhanh. Bốn lệnh `audit:*` chạy khi được gọi — `audit:seo` phải quét hơn trăm file, `audit:deploy` phải ra mạng.

# Rủi ro đã biết

| Rủi ro | Dấu hiệu | Xử |
|---|---|---|
| Hook chặn nhầm việc hợp lệ | Bị chặn khi đang làm việc đúng | Mọi thông điệp chặn đều nói rõ cách đi tiếp. `guard-data-mutation` có cờ 30 phút. Chặn nhầm lặp lại thì nới mẫu regex và **thêm test cho ca đó trước** |
| `post-edit-lint.sh` làm chậm phiên | Mỗi lần sửa `src/` đợi 20–40 giây | Đã chống dội 60 giây. Vẫn phiền thì đổi `matcher` sang chỉ `Write` |
| Bốn báo cáo audit đều xanh ngay lần đầu | — | **Đây là dấu hiệu xấu, không phải tốt.** `GA4` và `DOC1` phải trượt theo đúng những gì sổ drift đã ghi. Toàn xanh nghĩa là phép kiểm hỏng |
| Agent kết luận vượt quá `report.json` | Agent nói "ổn" khi báo cáo có `skip` | Mỗi file `.md` đều có ràng buộc cứng cấm điều này. Bắt được thì siết lại mô tả |
| Mười agent làm Claude chọn nhầm | Gọi `code-reviewer` khi đáng lẽ gọi `debugger` | `description` của từng agent đều có câu "khi ... thì dùng ... chứ không dùng agent này". Test `agents.test.ts` bắt buộc `description` dài tối thiểu 60 ký tự |

# Sau khi xong

Chạy một lượt để lấy ảnh chụp trạng thái ban đầu, rồi mở một mục trong `docs/DRIFT_LOG.md` cho mỗi phát hiện mới mà chưa mục nào phủ. Đó là cách bộ kiểm này trả lại giá trị: không phải bằng việc xanh, mà bằng việc biến thứ đang im lặng thành thứ có số hiệu.
