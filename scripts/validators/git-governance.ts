/**
 * Git-history governance gates.
 *
 * These checks need commit history, so they run outside Cloudflare Pages
 * post-build validation.
 */
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type GateResult = {
  id: 'STACK-S25-CI' | 'STACK-S26-CI'
  status: 'pass' | 'fail'
  errors: string[]
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')

function git(args: string[]): string {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd()
}

function gitShow(ref: string, path: string): string | null {
  try {
    return git(['show', `${ref}:${path}`])
  } catch {
    return null
  }
}

function changedFiles(): string[] {
  try {
    return git(['diff', '--name-only', 'HEAD^', 'HEAD']).split('\n').filter(Boolean)
  } catch (err: any) {
    return [`__GIT_DIFF_ERROR__:${err.message ?? 'unknown'}`]
  }
}

function fileContainsAccepted(path: string, ref: 'HEAD' | 'HEAD^'): boolean {
  const content = gitShow(ref, path)
  if (content === null) return false
  return /trạng thái:\s*accepted|status:\s*accepted/i.test(content)
}

function oldLinesPreserved(oldContent: string, newContent: string): boolean {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  let cursor = 0
  for (const line of newLines) {
    if (line === oldLines[cursor]) cursor++
    if (cursor === oldLines.length) return true
  }
  return oldLines.length === 0
}

function validateAppendOnlyDocs(changes: string[]): GateResult {
  const errors: string[] = []
  if (changes.some((file) => file.startsWith('__GIT_DIFF_ERROR__'))) {
    errors.push('không đọc được git diff HEAD^..HEAD — chạy cửa này ở clone có commit cha')
  }

  if (changes.includes('DECISIONS.md')) {
    const oldContent = gitShow('HEAD^', 'DECISIONS.md')
    const newContent = gitShow('HEAD', 'DECISIONS.md')
    if (oldContent === null || newContent === null) {
      errors.push('DECISIONS.md đổi nhưng không đọc được bản cũ/mới từ git')
    } else if (!oldLinesPreserved(oldContent, newContent)) {
      errors.push('DECISIONS.md không append-only: có dòng cũ bị sửa/xóa hoặc đảo thứ tự')
    }
  }

  for (const file of changes.filter((path) => path.startsWith('project/adr/') && path.endsWith('.md'))) {
    const existedBefore = gitShow('HEAD^', file) !== null
    if (existedBefore && fileContainsAccepted(file, 'HEAD^')) {
      errors.push(`${file}: ADR accepted đã tồn tại bị sửa; tạo ADR mới để supersede thay vì sửa nội dung cũ`)
    }
  }

  return { id: 'STACK-S25-CI', status: errors.length === 0 ? 'pass' : 'fail', errors }
}

function validateConstitutionUnchanged(changes: string[]): GateResult {
  const errors = changes.includes('playbook/CONSTITUTION.md')
    ? ['playbook/CONSTITUTION.md bị sửa trong project session — bị cấm ở git-governance gate']
    : []
  return { id: 'STACK-S26-CI', status: errors.length === 0 ? 'pass' : 'fail', errors }
}

function main() {
  console.log('=== Git governance gates — append-only docs ===\n')

  const changes = changedFiles()
  const results: GateResult[] = [
    validateAppendOnlyDocs(changes),
    validateConstitutionUnchanged(changes),
  ]

  for (const result of results) {
    if (result.status === 'pass') {
      console.log(`[pass] ${result.id}`)
    } else {
      console.log(`[FAIL] ${result.id} — ${result.errors.length} lỗi:`)
      for (const err of result.errors) console.log(`       ${err}`)
    }
  }

  if (results.some((result) => result.status === 'fail')) process.exit(1)
}

main()
