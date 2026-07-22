#!/usr/bin/env npx tsx
// Publish các draft đã qua gate. Mặc định dry-run; thêm --execute mới ghi Sanity.

import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env'), quiet: true })

function argValue(name: string, fallback = ''): string {
  const idx = process.argv.indexOf(name)
  return idx >= 0 ? process.argv[idx + 1] || fallback : fallback
}

function baseId(id: string): string {
  return id.replace(/^drafts\./, '')
}

function draftId(id: string): string {
  return `drafts.${baseId(id)}`
}

function cleanForPublish(doc: Record<string, any>, approvedBy: string): Record<string, any> {
  const { _createdAt, _updatedAt, _rev, ...rest } = doc
  const now = new Date().toISOString()
  return {
    ...rest,
    _id: baseId(doc._id),
    reviewStatus: 'approved',
    approvedBy,
    contentProvenance: doc.contentProvenance || 'mixed',
    publishedAt: doc.publishedAt || now,
    updatedAt: now,
  }
}

const ids = argValue('--ids').split(',').map(s => s.trim()).filter(Boolean)
const approvedBy = argValue('--approved-by', 'Lưu Tuấn Vũ')
const execute = process.argv.includes('--execute')
const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId) {
  console.error('Thiếu SANITY_STUDIO_PROJECT_ID')
  process.exit(1)
}
if (!token) {
  console.error('Thiếu SANITY_WRITE_TOKEN')
  process.exit(1)
}
if (ids.length === 0) {
  console.error('Cần --ids seed.a,seed.b')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2026-06-01', token, useCdn: false, perspective: 'raw' })

async function main() {
  const draftIds = ids.map(draftId)
  const drafts: any[] = await client.fetch(`*[_id in $ids]`, { ids: draftIds })
  const found = new Set(drafts.map(doc => doc._id))
  const missing = draftIds.filter(id => !found.has(id))
  if (missing.length) {
    console.error(`Thiếu draft: ${missing.join(', ')}`)
    process.exit(1)
  }

  const publishDocs = drafts.map(doc => cleanForPublish(doc, approvedBy))
  console.log(`${execute ? 'PUBLISH' : 'DRY-RUN'} ${publishDocs.length} draft:`)
  for (const doc of publishDocs) {
    console.log(`- ${doc._id} (${doc._type}) — ${doc.title?.vi || doc.title?.en || '(không title)'}`)
  }

  if (!execute) return

  let tx = client.transaction()
  for (const doc of publishDocs) {
    tx = tx.createOrReplace(doc).delete(draftId(doc._id))
  }
  await tx.commit()
  console.log('Đã publish và xoá draft tương ứng.')
}

main().catch(err => {
  console.error('Lỗi publish-drafts:', err.message)
  process.exit(1)
})
