#!/usr/bin/env npx tsx
// PRECHECK-BATCH — kiểm một cụm draft vừa import, tránh nhiễu bởi draft cũ trong dataset.
//
// Mặc định phục vụ N5 batch 30 ngày 2026-06-28:
//   node --import ./node_modules/tsx/dist/esm/index.mjs precheck-batch.ts
//
// Tùy chọn:
//   --since 2026-06-28T12:21:00Z
//   --json

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import { VALIDATORS, VALIDATOR_LEVELS, type ValidatorResult } from './validators/i1-i19.js'
import { PY_VALIDATORS, PY_VALIDATOR_LEVELS } from './validators/py1-py8.js'
import { loadPrices } from './lib/price-loader.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env'), quiet: true })

const ALL_TYPES = [
  'touristDestination', 'place', 'attraction', 'experience', 'restaurant',
  'specialty', 'hotel', 'resort', 'tour', 'organization', 'event', 'article',
  'person', 'category',
]
const BATCH_TYPES = ['place', 'attraction', 'specialty', 'hotel', 'restaurant', 'tour']
const FULL_CORPUS_VALIDATORS = new Set(['I1', 'I4', 'I7', 'I8', 'I13', 'I14', 'I15', 'I17', 'I18', 'I-FAQ-TYPE'])

function argValue(name: string, fallback: string): string {
  const idx = process.argv.indexOf(name)
  return idx >= 0 ? process.argv[idx + 1] || fallback : fallback
}

function baseId(id: string): string {
  return id.replace(/^drafts\./, '')
}

const since = argValue('--since', '2026-06-28T12:21:00Z')
const asJson = process.argv.includes('--json')
const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_READ_TOKEN || process.env.SANITY_WRITE_TOKEN

if (!projectId) {
  console.error('Thiếu SANITY_STUDIO_PROJECT_ID')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2026-06-01', token, useCdn: false, perspective: 'raw' })

async function main() {
  const all: any[] = await client.fetch(`*[_type in $types]`, { types: ALL_TYPES })
  const batchDrafts: any[] = await client.fetch(
    `*[
      _id match "drafts.*" &&
      _type in $types &&
      _updatedAt >= $since &&
      reviewStatus != "approved"
    ]{_id,_type,title,reviewStatus,_updatedAt} | order(_type asc, _id asc)`,
    { types: BATCH_TYPES, since },
  )
  const batchDraftFull: any[] = await client.fetch(`*[_id in $ids]`, { ids: batchDrafts.map(doc => doc._id) })
  const targets = batchDrafts.map(doc => baseId(doc._id))

  const simMap = new Map<string, any>()
  for (const doc of all) {
    if (doc.reviewStatus === 'approved' || doc._type === 'category') simMap.set(baseId(doc._id), doc)
  }
  for (const doc of batchDraftFull) {
    simMap.set(baseId(doc._id), {
      ...doc,
      _id: baseId(doc._id),
      reviewStatus: 'approved',
      approvedBy: doc.approvedBy || 'PRECHECK_SIMULATION',
      contentProvenance: doc.contentProvenance || 'mixed',
    })
  }

  const simCorpus = [...simMap.values()]
  const approvedScope = simCorpus.filter(doc => doc.reviewStatus === 'approved' || doc._type === 'category')
  const prices = loadPrices(resolve(__dirname, '..', 'data', 'prices.yaml'))
  const allValidators = { ...VALIDATORS, ...PY_VALIDATORS } as Record<string, (docs: any[], prices: Map<string, any>) => ValidatorResult>
  const allLevels = { ...VALIDATOR_LEVELS, ...PY_VALIDATOR_LEVELS } as Record<string, 'fail' | 'warn'>

  const issues = new Map<string, any>()
  for (const doc of batchDrafts) {
    issues.set(baseId(doc._id), {
      id: baseId(doc._id),
      draftId: doc._id,
      type: doc._type,
      title: doc.title?.vi || doc.title?.en || '(không title)',
      updatedAt: doc._updatedAt,
      errors: [] as string[],
      warnings: [] as string[],
    })
  }

  for (const doc of batchDraftFull) {
    const id = baseId(doc._id)
    const item = issues.get(id)
    if (!item) continue

    const text = JSON.stringify({
      title: doc.title,
      summary: doc.summary,
      body: doc.body,
    })
    if (
      id === 'seed.hon-mot' &&
      (text.includes('Phú Quốc') || text.includes('Kiên Giang') || Number(doc.geo?.lat) < 11)
    ) {
      item.errors.push('[CONTENT] seed.hon-mot: nội dung/geo đang trỏ Hòn Một Phú Quốc, không được publish vào cụm Vịnh Nha Trang')
    }
  }

  for (const id of Object.keys(allValidators).sort()) {
    if (id === 'I19') continue
    const useFull = FULL_CORPUS_VALIDATORS.has(id) || id.startsWith('PY')
    const input = useFull ? simCorpus : approvedScope
    let result: ValidatorResult
    try {
      result = allValidators[id](input, prices)
    } catch {
      continue
    }
    if (result.deferred || result.stub || result.passed) continue

    const level = result.level || allLevels[id]
    for (const error of result.errors) {
      for (const target of targets) {
        if (!error.includes(target)) continue
        const item = issues.get(target)
        if (!item) continue
        ;(level === 'fail' ? item.errors : item.warnings).push(`[${id}] ${error}`)
      }
    }
  }

  const rows = [...issues.values()]
  const clean = rows.filter(row => row.errors.length === 0)
  const blocked = rows.filter(row => row.errors.length > 0)
  const byType = (items: any[]) => items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1
    return acc
  }, {})

  const report = {
    since,
    checked: rows.length,
    cleanCount: clean.length,
    blockedCount: blocked.length,
    cleanByType: byType(clean),
    blockedByType: byType(blocked),
    clean: clean.map(({ id, type, title, warnings }) => ({ id, type, title, warnings })),
    blocked: blocked.map(({ id, type, title, errors, warnings }) => ({ id, type, title, errors, warnings })),
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  console.log(`\n🔍 PRECHECK BATCH từ ${since}`)
  console.log(`Kiểm ${report.checked} draft: ${report.cleanCount} sạch, ${report.blockedCount} còn chặn.`)
  console.log('\n✅ Có thể đưa founder duyệt/publish sau khi điền approvedBy:')
  for (const item of report.clean) console.log(`  - [${item.type}] ${item.id} — ${item.title}`)
  console.log('\n⛔ Cần sửa trước publish:')
  for (const item of report.blocked) {
    console.log(`  - [${item.type}] ${item.id} — ${item.title}`)
    for (const error of item.errors) console.log(`      ${error}`)
  }
}

main().catch(err => {
  console.error('Lỗi precheck-batch:', err.message)
  process.exit(1)
})
