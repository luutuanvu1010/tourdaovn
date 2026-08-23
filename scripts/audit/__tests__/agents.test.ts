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
