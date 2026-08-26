// scripts/migrate/backfill-destination.ts
//
// Việc MỘT LẦN (ADR-0028): gán `destination` = điểm đến trụ cho mọi document cũ thuộc mười
// entity mà chưa có ô đó. Dùng setIfMissing nên chạy lại nhiều lần không hại.
//
// Chạy:
//   npm --prefix scripts run backfill:destination            (khô, không ghi)
//   npm --prefix scripts run backfill:destination -- --live  (ghi thật)

import { createClient } from '@sanity/client'
import { config as dotenvConfig } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { primaryDestinationSlug } from '../../src/site.config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenvConfig({ path: resolve(__dirname, '../..', '.env'), quiet: true })

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const writeToken = process.env.SANITY_WRITE_TOKEN || ''
const readToken = process.env.SANITY_READ_TOKEN || ''
const live = process.argv.includes('--live')
const dryRun = !live

export const BACKFILL_TYPES = [
  'place', 'attraction', 'experience', 'hotel', 'resort',
  'tour', 'article', 'restaurant', 'specialty', 'event',
]

/** Gom số đếm theo _type để in bảng trước/sau. Tách ra để test được mà không gọi mạng. */
export function countByType(docs: Array<{ _type: string }>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const d of docs) out[d._type] = (out[d._type] ?? 0) + 1
  return out
}

if (!projectId) { console.error('Thiếu SANITY_STUDIO_PROJECT_ID trong .env'); process.exit(1) }
if (live && !writeToken) {
  console.error('Thiếu SANITY_WRITE_TOKEN — token đọc không patch được.')
  console.error('Chạy: SANITY_WRITE_TOKEN=<token> npm --prefix scripts run backfill:destination -- --live')
  process.exit(1)
}

const client = createClient({
  projectId, dataset, apiVersion: '2026-06-01',
  token: live ? writeToken : writeToken || readToken || undefined,
  useCdn: false, perspective: 'raw',
})

async function main() {
  console.log('Nạp bù field destination (ADR-0028)')
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`)
  console.log(`Điểm đến trụ (site.config): ${primaryDestinationSlug}\n`)

  // Loại draft khỏi phép tra: reference phải trỏ document ĐÃ PUBLISH. Chạy dưới
  // `perspective: 'raw'` thì cả `drafts.seed.nha-trang` lẫn `seed.nha-trang` cùng khớp,
  // và `drafts.` đứng trước theo thứ tự _id — không lọc là nạp bù trỏ vào bản nháp.
  const target = await client.fetch<{ _id: string } | null>(
    `*[_type == "touristDestination" && slug.vi.current == $slug
       && !(_id in path("drafts.**"))][0]{_id}`,
    { slug: primaryDestinationSlug },
  )
  if (!target) {
    console.error(`Không tìm thấy TouristDestination ĐÃ PUBLISH có slug.vi = "${primaryDestinationSlug}". Dừng để không đoán bừa.`)
    console.error('(Chỉ có bản nháp thì phải Publish nó trong Studio trước — reference không được trỏ vào draft.)')
    process.exit(1)
  }
  console.log(`Target: ${target._id}\n`)

  const docs = await client.fetch<Array<{ _id: string; _type: string }>>(
    `*[_type in $types && !defined(destination)]{_id, _type} | order(_type asc, _id asc)`,
    { types: BACKFILL_TYPES },
  )

  if (docs.length === 0) {
    console.log('Không còn document nào thiếu destination. OK.')
    return
  }

  const before = countByType(docs)
  console.log(`Thiếu destination: ${docs.length} document`)
  for (const [type, n] of Object.entries(before).sort()) console.log(`  ${type.padEnd(14)} ${n}`)

  const patchValue = { _type: 'reference', _ref: target._id }

  if (dryRun) {
    console.log('\nDRY-RUN: chưa ghi gì. Patch mẫu:')
    console.log(JSON.stringify({ destination: patchValue }, null, 2))
    console.log('\nKhi đã duyệt, chạy:')
    console.log('  npm --prefix scripts run backfill:destination -- --live')
    return
  }

  let patched = 0
  for (const doc of docs) {
    await client.patch(doc._id).setIfMissing({ destination: patchValue }).commit()
    patched++
    console.log(`  ✓ ${doc._type} ${doc._id}`)
  }

  const left = await client.fetch<number>(
    `count(*[_type in $types && !defined(destination)])`, { types: BACKFILL_TYPES },
  )
  console.log(`\nLIVE: đã nạp bù ${patched}/${docs.length}. Còn thiếu: ${left} (phải là 0).`)
  if (left !== 0) process.exit(1)
}

main().catch((err) => {
  console.error('Nạp bù thất bại:', err.message)
  process.exit(1)
})
