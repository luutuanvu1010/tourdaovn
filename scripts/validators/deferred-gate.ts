/**
 * Default-deny guard for deferred validators.
 *
 * Pre-build validators may mark a fail-level rule as deferred only when a real
 * executor runs later in the same build. This script proves that handoff by
 * comparing scripts/reports/validator-status.json and postbuild-status.json.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = resolve(__dirname, '..', 'reports')
const PREBUILD = resolve(REPORT_DIR, 'validator-status.json')
const POSTBUILD = resolve(REPORT_DIR, 'postbuild-status.json')
const REGISTRY_PATH = resolve(__dirname, '..', '..', 'project', 'governance', 'control-registry.yaml')

type Control = {
  id: string
  status: 'live' | 'deferred' | 'gap'
  stage: string
  level: 'fail' | 'warn'
  deferred_to?: string[]
}

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function readRegistry(): Map<string, Control> {
  if (!existsSync(REGISTRY_PATH)) {
    console.error('[error] thiếu project/governance/control-registry.yaml — không thể chứng minh deferred hợp lệ.')
    process.exit(1)
  }
  const registry = parse(readFileSync(REGISTRY_PATH, 'utf-8'))
  return new Map<string, Control>((registry.controls ?? []).map((item: Control) => [item.id, item]))
}

function main() {
  console.log('=== Deferred validator gate ===\n')

  if (!existsSync(PREBUILD)) {
    console.error('[error] thiếu scripts/reports/validator-status.json — pre-build validate chưa chạy.')
    process.exit(1)
  }

  const pre = readJson(PREBUILD)
  const registry = readRegistry()
  const deferred = (pre.items ?? []).filter((item: any) => item.status === 'defer')
  if (deferred.length === 0) {
    console.log('[pass] Không có validator deferred.')
    return
  }

  const post = existsSync(POSTBUILD) ? readJson(POSTBUILD) : { items: [] }
  const postStatus = new Map<string, string>((post.items ?? []).map((item: any) => [item.id, item.status]))

  const errors: string[] = []
  for (const item of deferred) {
    const id = item.id
    const level = item.level ?? 'fail'
    if (level !== 'fail') {
      console.log(`[pass] ${id} — deferred ${level}, không phải fail-level`)
      continue
    }
    const control = registry.get(id)
    if (!control) {
      errors.push(`${id}: deferred nhưng thiếu trong control registry`)
      continue
    }
    if (control.status === 'deferred') {
      const targets = control.deferred_to ?? []
      if (targets.length === 0) {
        errors.push(`${id}: registry status deferred nhưng thiếu deferred_to`)
        continue
      }
      const badTargets = targets.filter((targetId) => registry.get(targetId)?.status !== 'live')
      if (badTargets.length > 0) {
        errors.push(`${id}: deferred_to không live: ${badTargets.join(', ')}`)
      } else {
        console.log(`[pass] ${id} — delegated composite qua registry: ${targets.join(', ')}`)
      }
      continue
    }
    if (control.status !== 'live' || control.stage !== 'post-build') {
      errors.push(`${id}: deferred nhưng registry không khai live post-build executor`)
      continue
    }
    if (postStatus.get(id) !== 'pass') {
      errors.push(`${id}: deferred nhưng post-build executor chưa pass`)
    } else {
      console.log(`[pass] ${id} — post-build executor đã pass`)
    }
  }

  if (errors.length > 0) {
    console.log(`[FAIL] Deferred gate — ${errors.length} lỗi:`)
    for (const err of errors) console.log(`       ${err}`)
    process.exit(1)
  }
}

main()
