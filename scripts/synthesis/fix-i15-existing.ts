#!/usr/bin/env npx tsx
// Sửa I15 trong dữ liệu đã ghi (place/attraction): chuẩn hoá "thành phố Nha Trang" → "Nha Trang"
// trong các field prose localized. Đọc cả published và drafts.* (query không lọc perspective —
// @sanity/client v6 mặc định 'raw', trả mọi document trong dataset, kể cả drafts.*).
//
// Usage:
//   npx tsx synthesis/fix-i15-existing.ts             (mặc định --dry-run, chỉ in diff)
//   npx tsx synthesis/fix-i15-existing.ts --dry-run
//   npx tsx synthesis/fix-i15-existing.ts --live       (ghi thật — founder duyệt diff trước)

import { createClient } from '@sanity/client'
import { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_WRITE_TOKEN } from './config'
import { normalizeI15Deep } from './content-guard'

// Field prose localized có thể dính I15 (CONTENT_MODEL §2.2/§2.3 + ADR-0013)
const PROSE_FIELDS = ['title', 'summary', 'body', 'highlights', 'faq', 'accessInfo']

function parseArgs(argv: string[]): { live: boolean } {
  return { live: argv.includes('--live') }
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2026-06-01',
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
})

async function main() {
  const { live } = parseArgs(process.argv)

  if (live && !SANITY_WRITE_TOKEN) {
    console.error('Lỗi: thiếu SANITY_WRITE_TOKEN trong .env (cần để chạy --live)')
    process.exit(1)
  }

  console.log(`\n🔧 fix-i15-existing — mode: ${live ? 'LIVE (sẽ ghi Sanity)' : 'DRY-RUN (chỉ in diff)'}\n`)

  let docs: any[]
  try {
    docs = await client.fetch(`*[_type in ["place","attraction"]]`)
  } catch (err: any) {
    console.error(`Lỗi query Sanity: ${err.message}`)
    process.exit(1)
  }

  console.log(`  Đã quét ${docs.length} document (place/attraction, gồm cả published và drafts.*).\n`)

  let docsChanged = 0
  let docsErrored = 0

  for (const doc of docs) {
    let changesForDoc: { field: string; before: any; after: any }[]
    try {
      changesForDoc = []
      for (const field of PROSE_FIELDS) {
        const value = doc[field]
        if (value === undefined || value === null) continue
        const { value: after, changed } = normalizeI15Deep(value)
        if (changed) {
          changesForDoc.push({ field, before: value, after })
        }
      }
    } catch (err: any) {
      console.error(`  ✗ Lỗi xử lý ${doc._id}: ${err.message}`)
      docsErrored++
      continue
    }

    if (changesForDoc.length === 0) continue

    docsChanged++
    console.log(`📝 ${doc._id} (${doc._type})`)
    for (const c of changesForDoc) {
      console.log(`   field "${c.field}":`)
      console.log(`     trước: ${JSON.stringify(c.before)}`)
      console.log(`     sau:   ${JSON.stringify(c.after)}`)
    }

    if (live) {
      try {
        const patch: Record<string, any> = {}
        for (const c of changesForDoc) {
          patch[c.field] = c.after
        }
        await client.patch(doc._id).set(patch).commit()
        console.log(`   ✓ Đã ghi (${doc._id})`)
      } catch (err: any) {
        console.error(`   ✗ Lỗi ghi ${doc._id}: ${err.message}`)
        docsErrored++
      }
    }
    console.log('')
  }

  console.log(`📊 Tổng: ${docsChanged} document có thay đổi, ${docsErrored} lỗi.`)
  if (!live) {
    console.log(`   DRY-RUN — không ghi gì. Founder duyệt diff rồi chạy lại với --live để áp dụng.`)
  }
}

main().catch(err => {
  console.error('Lỗi:', err.message)
  process.exit(1)
})
