// scripts/migrate/backfill-nha-trang-locale-slugs.ts
//
// Backfill missing locale slugs for the canonical TouristDestination document.
// The current public URLs intentionally use the shared Latin slug:
//   /nha-trang/, /zh/nha-trang/, /ko/nha-trang/, /ru/nha-trang/
//
// Chạy:
//   cd scripts
//   node --import ./node_modules/tsx/dist/esm/index.mjs migrate/backfill-nha-trang-locale-slugs.ts --dry-run
//   node --import ./node_modules/tsx/dist/esm/index.mjs migrate/backfill-nha-trang-locale-slugs.ts --live

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

if (live && !writeToken) {
  console.error('Thiếu SANITY_WRITE_TOKEN.')
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

const targetIds = ['seed.nha-trang', 'drafts.seed.nha-trang']
const requiredLangs = ['zh', 'ko', 'ru'] as const
const slugValue = { _type: 'slug', current: 'nha-trang' }

type Doc = {
  _id: string
  _type: string
  slug?: Record<string, { current?: string }>
}

async function main() {
  console.log('Backfill Nha Trang locale slugs')
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}\n`)

  const docs = await client.fetch<Doc[]>(
    `*[_id in $ids]{_id, _type, slug} | order(_id asc)`,
    { ids: targetIds },
  )

  if (docs.length === 0) {
    console.error('Không tìm thấy seed.nha-trang hoặc draft tương ứng.')
    process.exit(1)
  }

  let totalPatches = 0
  for (const doc of docs) {
    if (doc._type !== 'touristDestination') {
      console.log(`- SKIP ${doc._id}: type ${doc._type}`)
      continue
    }

    const patch: Record<string, typeof slugValue> = {}
    for (const lang of requiredLangs) {
      if (!doc.slug?.[lang]?.current) {
        patch[`slug.${lang}`] = slugValue
      }
    }

    if (Object.keys(patch).length === 0) {
      console.log(`- OK ${doc._id}: đủ slug.zh/ko/ru`)
      continue
    }

    totalPatches++
    console.log(`- PATCH ${doc._id}: ${Object.keys(patch).join(', ')}`)
    if (live) {
      await client.patch(doc._id).set(patch).commit()
    }
  }

  if (dryRun) {
    console.log(`\nDRY-RUN: ${totalPatches} document sẽ được patch nếu chạy --live.`)
  } else {
    console.log(`\nLIVE: đã patch ${totalPatches} document.`)
  }
}

main().catch((err) => {
  console.error('Backfill slug thất bại:', err.message)
  process.exit(1)
})
