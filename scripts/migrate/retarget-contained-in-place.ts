// scripts/migrate/retarget-contained-in-place.ts
//
// Retarget stale containedInPlace references from the deleted Place
// seed.trung-tam-nha-trang to the canonical TouristDestination seed.nha-trang.
//
// The founder explicitly deleted seed.trung-tam-nha-trang because it is no
// longer semantically correct. Do not recreate that Place.
//
// Chạy:
//   cd scripts
//   ./node_modules/.bin/tsx migrate/retarget-contained-in-place.ts --dry-run
//   ./node_modules/.bin/tsx migrate/retarget-contained-in-place.ts --live

import { createClient } from '@sanity/client'
import { config as dotenvConfig } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenvConfig({ path: resolve(__dirname, '../..', '.env'), quiet: true })

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const writeToken = process.env.SANITY_WRITE_TOKEN || ''
const readToken = process.env.SANITY_READ_TOKEN || ''
const live = process.argv.includes('--live')
const dryRun = !live

const fromId = 'seed.trung-tam-nha-trang'
const toId = 'seed.nha-trang'
const allowedTypes = ['place', 'attraction', 'restaurant', 'hotel', 'resort']

if (live && !writeToken) {
  console.error('Thiếu SANITY_WRITE_TOKEN.')
  console.error('Chạy: SANITY_WRITE_TOKEN=<token> ./node_modules/.bin/tsx migrate/retarget-contained-in-place.ts --live')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-06-01',
  token: live ? writeToken : writeToken || readToken || undefined,
  useCdn: false,
  perspective: 'raw',
})

type RefDoc = {
  _id: string
  _type: string
  reviewStatus?: string
  title?: { vi?: string } | string
  slug?: Record<string, { current?: string }>
  containedInPlace?: { _ref?: string; _type?: string; _weak?: boolean }
}

function titleOf(doc: RefDoc): string {
  if (typeof doc.title === 'string') return doc.title
  return doc.title?.vi || doc._id
}

async function main() {
  console.log('Retarget containedInPlace stale refs')
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`)
  console.log(`From: ${fromId}`)
  console.log(`To:   ${toId}\n`)

  const target = await client.fetch<{ _id: string; _type: string } | null>(
    `*[_id == $toId && _type == "touristDestination"][0]{_id, _type}`,
    { toId },
  )
  if (!target) {
    console.error(`Không tìm thấy target TouristDestination ${toId}. Dừng để tránh patch sai.`)
    process.exit(1)
  }

  const docs = await client.fetch<RefDoc[]>(
    `*[_type in $types && containedInPlace._ref == $fromId]{
      _id,
      _type,
      reviewStatus,
      title,
      slug,
      containedInPlace
    } | order(_type asc, _id asc)`,
    { types: allowedTypes, fromId },
  )

  if (docs.length === 0) {
    console.log('Không còn document nào trỏ containedInPlace tới seed.trung-tam-nha-trang. OK.')
    return
  }

  console.log(`Sẽ retarget ${docs.length} document:\n`)
  for (const doc of docs) {
    const ns = doc._id.startsWith('drafts.') ? 'draft' : 'published'
    const weak = doc.containedInPlace?._weak ? ' weak' : ''
    console.log(`- [${ns}] ${doc._type} ${doc._id} (${doc.reviewStatus || 'no-status'})${weak}: ${titleOf(doc)}`)
  }

  const patchValue = { _type: 'reference', _ref: toId }
  if (dryRun) {
    console.log('\nDRY-RUN: chưa ghi dữ liệu. Patch mẫu:')
    console.log(JSON.stringify({ containedInPlace: patchValue }, null, 2))
    console.log('\nKhi đã duyệt, chạy:')
    console.log('  cd scripts')
    console.log('  ./node_modules/.bin/tsx migrate/retarget-contained-in-place.ts --live')
    return
  }

  let patched = 0
  for (const doc of docs) {
    await client.patch(doc._id).set({ containedInPlace: patchValue }).commit()
    patched++
    console.log(`  ✓ PATCH ${doc._type} ${doc._id}`)
  }

  console.log(`\nLIVE: đã retarget ${patched}/${docs.length} document sang ${toId}.`)
}

main().catch((err) => {
  console.error('Retarget thất bại:', err.message)
  process.exit(1)
})
