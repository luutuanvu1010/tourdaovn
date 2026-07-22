#!/usr/bin/env npx tsx
// Runner: đọc batch-*.jsonl, chạy index.ts --dry-run cho từng entity, gom kết quả.
// Dùng: npx tsx synthesis/run-batch.ts batch-30.jsonl
import { readFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const file = args.find(arg => !arg.startsWith('--')) || 'batch-30.jsonl'
const only = args.find(arg => arg.startsWith('--only='))?.slice('--only='.length).toLowerCase()
const live = args.includes('--live')
const tsxLoader = resolve(__dirname, '..', 'node_modules', 'tsx', 'dist', 'esm', 'index.mjs')
const lines = readFileSync(resolve(__dirname, file), 'utf8')
  .split('\n').map(l => l.trim()).filter(Boolean)

interface Row { entity: string; name: string; urls: string[] }
const rows: Row[] = lines.map(l => JSON.parse(l))
  .filter((row: Row) => !only || row.name.toLowerCase().includes(only) || row.entity.toLowerCase() === only)

const results: { entity: string; name: string; pass: boolean; validator: string; tail: string }[] = []

console.log(`\n🚀 Batch ${live ? 'live draft write' : 'dry-run'}: ${rows.length} entity\n${'='.repeat(60)}`)

for (const [i, r] of rows.entries()) {
  process.stdout.write(`\n[${i + 1}/${rows.length}] ${r.entity} "${r.name}" ... `)
  const out = spawnSync(process.execPath, [
    '--import', tsxLoader, resolve(__dirname, 'index.ts'),
    live ? '--live' : '--dry-run', '--entity', r.entity, '--name', r.name, '--urls', r.urls.join(','),
  ], { encoding: 'utf8', timeout: 180_000, cwd: resolve(__dirname, '..') })

  const stdout = (out.stdout || '') + (out.stderr || '')
  // Tìm dòng Validator
  const vMatch = stdout.match(/Validator: (.+)/)
  const validator = vMatch ? vMatch[1].trim() : '(không có dòng validator)'
  const pass = /Validator: ĐẠT/.test(stdout)
  const errorLine = stdout.split('\n').find(line => /Lỗi|Error|Timeout|HTTP \d{3}/i.test(line.trim()))
  const tail = (errorLine || stdout.split('\n').filter(Boolean).slice(-4).join(' | ')).slice(0, 240)
  results.push({ entity: r.entity, name: r.name, pass, validator: pass ? validator : `${validator} — ${tail}`, tail })
  process.stdout.write(pass ? '✅ ĐẠT' : '❌ ' + (tail || validator).slice(0, 80))
}

console.log(`\n\n${'='.repeat(60)}\n📊 TỔNG KẾT\n${'='.repeat(60)}`)
const byType: Record<string, { pass: number; total: number }> = {}
for (const r of results) {
  byType[r.entity] ??= { pass: 0, total: 0 }
  byType[r.entity].total++
  if (r.pass) byType[r.entity].pass++
}
for (const [t, s] of Object.entries(byType)) {
  console.log(`  ${t.padEnd(12)} ${s.pass}/${s.total} đạt`)
}
console.log(`\nChi tiết entity TRƯỢT:`)
for (const r of results.filter(r => !r.pass)) {
  console.log(`  ✗ [${r.entity}] ${r.name} → ${r.validator}`)
}
console.log(`\nTổng: ${results.filter(r => r.pass).length}/${results.length} đạt validator`)
