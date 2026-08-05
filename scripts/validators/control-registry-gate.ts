/**
 * Machine-readable control registry gate.
 *
 * The registry is not law. This gate only proves that the implementation map is
 * internally coherent and that live controls point to real executors wired into
 * the declared pipeline.
 */
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

type Status = 'live' | 'deferred' | 'gap'

type Pipeline = {
  stage: string
  command: string
  files?: string[]
}

type Control = {
  id: string
  source: string
  level: 'fail' | 'warn'
  stage: string
  executor: string | null
  pipeline: string | null
  status: Status
  evidence: string
  gap_id?: string
  deferred_to?: string[]
}

type Registry = {
  pipelines: Record<string, Pipeline>
  controls: Control[]
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
// 'project/governance/' là quy ước thư mục của nhatrangtravel, không tồn tại ở
// tourdaovn. Sổ đăng ký của dự án này sống ở docs/governance/. Xem DR-015.
const REGISTRY_PATH = resolve(REPO_ROOT, 'docs', 'governance', 'control-registry.yaml')
// CONTROL_GATES.md cấp dự án chưa được soạn; bản duy nhất trong repo là khuôn
// rỗng ở playbook/governance/ không có dấu ✅ nào, nên documentedLiveIds() trả
// tập rỗng và vòng đối chiếu chéo hiện là no-op. Ghi phiếu nợ ND-004.
const CONTROL_GATES_PATH = resolve(REPO_ROOT, 'docs', 'governance', 'CONTROL_GATES.md')
const POSTBUILD_STATUS = resolve(REPO_ROOT, 'scripts', 'reports', 'postbuild-status.json')

function loadRegistry(): Registry {
  if (!existsSync(REGISTRY_PATH)) {
    throw new Error('thiếu project/governance/control-registry.yaml')
  }
  return parse(readFileSync(REGISTRY_PATH, 'utf-8')) as Registry
}

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function relExists(path: string): boolean {
  return existsSync(resolve(REPO_ROOT, path))
}

function pipelineContainsExecutor(pipeline: Pipeline, executor: string): boolean {
  const files = pipeline.files ?? []
  if (files.includes(executor)) return true
  const needle = executor.replace(/\\/g, '/')
  const base = basename(executor)
  return pipeline.command.includes(needle) || pipeline.command.includes(base)
}

function expandControlTokens(line: string): string[] {
  const ids = new Set<string>()
  const rangeRe = /\b(I|PY|R)(\d+)\s*[–-]\s*(?:I|PY|R)?(\d+)\b/g
  let range: RegExpExecArray | null
  while ((range = rangeRe.exec(line)) !== null) {
    const prefix = range[1]
    const start = Number(range[2])
    const end = Number(range[3])
    for (let i = start; i <= end; i++) ids.add(`${prefix}${i}`)
  }

  const singleRe = /\b(I|PY|R)(\d+)\b/g
  let single: RegExpExecArray | null
  while ((single = singleRe.exec(line)) !== null) {
    ids.add(`${single[1]}${single[2]}`)
  }

  return [...ids]
}

function documentedLiveIds(): Set<string> {
  const ids = new Set<string>()
  if (!existsSync(CONTROL_GATES_PATH)) return ids
  const content = readFileSync(CONTROL_GATES_PATH, 'utf-8')
  for (const line of content.split('\n')) {
    if (!line.includes('✅')) continue
    if (!/(live|delegated|advisory)/i.test(line)) continue
    for (const id of expandControlTokens(line)) ids.add(id)
  }
  return ids
}

function validateRegistry(registry: Registry): string[] {
  const errors: string[] = []
  const controls = registry.controls ?? []
  const pipelines = registry.pipelines ?? {}
  const byId = new Map<string, Control>()

  for (const control of controls) {
    if (!control.id) errors.push('control thiếu id')
    if (control.id && byId.has(control.id)) errors.push(`${control.id}: id trùng trong registry`)
    if (control.id) byId.set(control.id, control)
    if (!control.source) errors.push(`${control.id}: thiếu source`)
    if (!control.level) errors.push(`${control.id}: thiếu level`)
    if (!control.stage) errors.push(`${control.id}: thiếu stage`)
    if (!control.status) errors.push(`${control.id}: thiếu status`)
    if (!control.evidence) errors.push(`${control.id}: thiếu evidence`)

    if (control.status === 'gap') {
      if (!control.gap_id) errors.push(`${control.id}: status gap thiếu gap_id`)
      continue
    }

    if (control.status === 'deferred') {
      if (!Array.isArray(control.deferred_to) || control.deferred_to.length === 0) {
        errors.push(`${control.id}: status deferred thiếu deferred_to hợp lệ`)
      }
      continue
    }

    if (control.status !== 'live') {
      errors.push(`${control.id}: status không hợp lệ "${String(control.status)}"`)
      continue
    }

    if (control.level === 'fail' && !control.executor) {
      errors.push(`${control.id}: fail-level live thiếu executor`)
    }
    if (!control.executor) continue
    if (!relExists(control.executor)) {
      errors.push(`${control.id}: executor không tồn tại: ${control.executor}`)
    }
    if (!control.pipeline) {
      errors.push(`${control.id}: live control thiếu pipeline`)
      continue
    }
    const pipeline = pipelines[control.pipeline]
    if (!pipeline) {
      errors.push(`${control.id}: pipeline không tồn tại: ${control.pipeline}`)
      continue
    }
    if (pipeline.stage !== control.stage) {
      errors.push(`${control.id}: stage="${control.stage}" không khớp pipeline ${control.pipeline} stage="${pipeline.stage}"`)
    }
    if (!pipelineContainsExecutor(pipeline, control.executor)) {
      errors.push(`${control.id}: executor ${control.executor} không nằm trong pipeline ${control.pipeline}`)
    }
  }

  for (const control of controls) {
    if (control.status !== 'deferred') continue
    for (const targetId of control.deferred_to ?? []) {
      const target = byId.get(targetId)
      if (!target) {
        errors.push(`${control.id}: deferred_to="${targetId}" không tồn tại trong registry`)
      } else if (target.status !== 'live') {
        errors.push(`${control.id}: deferred_to="${targetId}" không trỏ tới live control`)
      }
    }
  }

  for (const id of documentedLiveIds()) {
    const control = byId.get(id)
    if (!control) {
      errors.push(`CONTROL_GATES.md tuyên bố ${id} live/delegated/advisory nhưng registry thiếu id`)
      continue
    }
    if (control.status === 'gap') {
      errors.push(`CONTROL_GATES.md tuyên bố ${id} live/delegated/advisory nhưng registry đang gap`)
    }
  }

  if (existsSync(POSTBUILD_STATUS)) {
    const post = readJson(POSTBUILD_STATUS)
    const postStatus = new Map<string, string>((post.items ?? []).map((item: any) => [item.id, item.status]))
    for (const control of controls) {
      if (control.status !== 'live' || control.stage !== 'post-build') continue
      if (!postStatus.has(control.id)) continue
      if (postStatus.get(control.id) !== 'pass') {
        errors.push(`${control.id}: post-build report tồn tại nhưng chưa pass`)
      }
    }
  }

  return errors
}

function main() {
  console.log('=== Control registry gate ===\n')

  const registry = loadRegistry()
  const errors = validateRegistry(registry)

  if (errors.length > 0) {
    console.log(`[FAIL] Control registry — ${errors.length} lỗi:`)
    for (const err of errors) console.log(`       ${err}`)
    process.exit(1)
  }

  console.log(`[pass] Registry coherent: ${registry.controls.length} controls`)
}

main()
