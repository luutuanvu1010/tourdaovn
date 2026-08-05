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
// tourdaovn. Sổ đăng ký của dự án này sống ở docs/governance/, theo
// QĐ-2026-08-05-07; họ lỗi đường dẫn 'project/' ghi ở DR-001.
const REGISTRY_PATH = resolve(REPO_ROOT, 'docs', 'governance', 'control-registry.yaml')
// CONTROL_GATES.md cấp dự án chưa được soạn; bản duy nhất trong repo là khuôn
// rỗng ở playbook/governance/ không có dấu ✅ nào, nên documentedLiveIds() trả
// tập rỗng và vòng đối chiếu chéo hiện là no-op. Ghi phiếu nợ ND-004.
const CONTROL_GATES_PATH = resolve(REPO_ROOT, 'docs', 'governance', 'CONTROL_GATES.md')
const POSTBUILD_STATUS = resolve(REPO_ROOT, 'scripts', 'reports', 'postbuild-status.json')
// Từ vựng stage đóng. Vòng đối chiếu postbuild-status ở cuối file lọc theo
// control.stage === 'post-build'; một cách viết khác ('postbuild') làm vòng đó
// bỏ qua mọi control và cổng in [pass] trên một control đang đỏ. Xem DR-017.
const VALID_STAGES = new Set(['pre-build', 'post-build'])

function loadRegistry(): Registry {
  if (!existsSync(REGISTRY_PATH)) {
    throw new Error(`thiếu ${REGISTRY_PATH.replace(REPO_ROOT + '/', '')}`)
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

function validateRegistry(registry: Registry): { errors: string[]; skipped: string[] } {
  const errors: string[] = []
  // Những phép kiểm không thực hiện được vì thiếu đầu vào. Phải in ra, không được
  // im lặng: một dòng [pass] trống đứng sau nó là lời khai vượt quá phần đã kiểm,
  // trái CLAUDE.md §6 (cổng không bằng chứng thì mặc định là không đạt). Xem DR-021.
  const skipped: string[] = []
  const controls = registry.controls ?? []
  const pipelines = registry.pipelines ?? {}
  const byId = new Map<string, Control>()

  for (const [name, pipeline] of Object.entries(pipelines)) {
    if (!VALID_STAGES.has(pipeline.stage)) {
      errors.push(`pipeline ${name}: stage không hợp lệ "${pipeline.stage}" (chỉ nhận ${[...VALID_STAGES].join(', ')})`)
    }
  }

  for (const control of controls) {
    if (!control.id) errors.push('control thiếu id')
    if (control.id && byId.has(control.id)) errors.push(`${control.id}: id trùng trong registry`)
    if (control.id) byId.set(control.id, control)
    if (!control.source) errors.push(`${control.id}: thiếu source`)
    if (!control.level) errors.push(`${control.id}: thiếu level`)
    if (!control.stage) errors.push(`${control.id}: thiếu stage`)
    else if (!VALID_STAGES.has(control.stage)) {
      errors.push(`${control.id}: stage không hợp lệ "${control.stage}" (chỉ nhận ${[...VALID_STAGES].join(', ')})`)
    }
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

    // Một control `live` phải chỉ ra được bằng chứng có thật. Trước đây trường
    // evidence chỉ bị kiểm "không rỗng", nên R3/R4 khai trỏ vào các mục của
    // postbuild-status.json suốt thời gian executor của chúng không ghi báo cáo
    // nào. Xem docs/DRIFT_LOG.md DR-022.
    const evidencePath = control.evidence?.trim().split(/\s+/)[0] ?? ''
    if (evidencePath.includes('/') && !relExists(evidencePath)) {
      errors.push(`${control.id}: live nhưng evidence trỏ vào file không tồn tại: ${evidencePath}`)
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

  if (!existsSync(CONTROL_GATES_PATH)) {
    skipped.push(`đối chiếu registry ↔ CONTROL_GATES.md — thiếu ${CONTROL_GATES_PATH.replace(REPO_ROOT + '/', '')} (ND-004)`)
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
    const livePostBuild = controls.filter((c) => c.status === 'live' && c.stage === 'post-build')
    const unreported = livePostBuild.filter((c) => !postStatus.has(c.id)).map((c) => c.id)
    if (unreported.length > 0) {
      skipped.push(`đối chiếu post-build cho ${unreported.join(', ')} — executor không ghi mục nào vào postbuild-status.json`)
    }
    for (const control of livePostBuild) {
      if (!postStatus.has(control.id)) continue
      if (postStatus.get(control.id) !== 'pass') {
        errors.push(`${control.id}: post-build report tồn tại nhưng chưa pass`)
      }
    }
  } else {
    skipped.push('đối chiếu post-build — chưa có scripts/reports/postbuild-status.json')
  }

  return { errors, skipped }
}

function main() {
  console.log('=== Control registry gate ===\n')

  const registry = loadRegistry()
  const { errors, skipped } = validateRegistry(registry)

  for (const note of skipped) console.log(`[skip] ${note}`)
  if (skipped.length > 0) console.log('')

  if (errors.length > 0) {
    console.log(`[FAIL] Control registry — ${errors.length} lỗi:`)
    for (const err of errors) console.log(`       ${err}`)
    process.exit(1)
  }

  const scope = skipped.length === 0
    ? 'toàn bộ phép kiểm đã chạy'
    : `${skipped.length} phép kiểm KHÔNG chạy được, xem [skip] ở trên`
  console.log(`[pass] Registry coherent: ${registry.controls.length} controls — ${scope}`)
}

main()
