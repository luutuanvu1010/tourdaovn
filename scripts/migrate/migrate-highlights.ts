// scripts/migrate/migrate-highlights.ts
//
// Migrate highlights từ array of string → array of highlightItem.
// Schema định nghĩa highlightItem là named object type (B8.10 2026-06-30).
//
// Với mỗi item: nếu là string → map thành { _type: 'highlightItem', emoji: '', title: string, description: '' }.
// Nếu đã là object có _type === 'highlightItem' → bỏ qua (idempotent).
// Xử lý highlights object localized {vi,en,zh,ko,ru} (entity field-level i18n).
//
// Chạy:
//   cd scripts
//   export SANITY_WRITE_TOKEN=<token>
//   npx tsx migrate/migrate-highlights.ts --dry-run     # preview patch
//   npx tsx migrate/migrate-highlights.ts --live        # áp dụng

import { createClient } from '@sanity/client'

// --- Cấu hình client -------------------------------------------------------
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN
const dryRun = process.argv.includes('--dry-run')
const live = process.argv.includes('--live')

if (!token) {
  console.error('Thiếu SANITY_WRITE_TOKEN.')
  console.error('Chạy: SANITY_WRITE_TOKEN=<token> npx tsx migrate/migrate-highlights.ts [--dry-run|--live]')
  process.exit(1)
}

if (!dryRun && !live) {
  console.error('Chỉ định --dry-run hoặc --live')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-06-01',
  token,
  useCdn: false,
})

let keyCounter = 0
const k = () => `hl${(keyCounter++).toString(36)}`

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

interface MigrationResult {
  itemsMigrated: number
  itemsSkipped: number
  docsPatched: number
  errors: string[]
  patches: Array<{ id: string; patch: Record<string, unknown> }>
}

async function migrateDocs(docs: Record<string, unknown>[], ns: 'published' | 'draft'): Promise<MigrationResult> {
  const result: MigrationResult = { itemsMigrated: 0, itemsSkipped: 0, docsPatched: 0, errors: [], patches: [] }
  const langs = ['vi', 'en', 'zh', 'ko', 'ru']

  for (const doc of docs) {
    const rawId = doc._id as string
    const type = doc._type as string
    const highlights = doc.highlights

    const id = ns === 'draft' && !rawId.startsWith('drafts.') ? `drafts.${rawId}` : rawId

    if (!highlights) continue
    if (!isObject(highlights)) continue

    let docChanged = false
    const patchData: Record<string, unknown> = {}

    for (const lang of langs) {
      const arr = highlights[lang]
      if (!Array.isArray(arr)) continue

      let langChanged = false
      const patched = arr.map((item) => {
        if (isObject(item) && item._type === 'highlightItem') {
          result.itemsSkipped++
          return item
        }

        if (typeof item === 'string') {
          langChanged = true
          result.itemsMigrated++
          return {
            _type: 'highlightItem',
            _key: k(),
            emoji: '',
            title: item,
            description: '',
          }
        }

        // Là object nhưng không có _type='highlightItem' — đặt lại _type, giữ field hiện có
        if (isObject(item)) {
          langChanged = true
          result.itemsMigrated++
          return {
            ...item,
            _type: 'highlightItem',
            _key: (item as Record<string, unknown>)._key || k(),
            emoji: (item as Record<string, unknown>).emoji || '',
            title: (item as Record<string, unknown>).title || '',
            description: (item as Record<string, unknown>).description || '',
          }
        }

        result.itemsSkipped++
        return item
      })

      if (langChanged) {
        patchData[`highlights.${lang}`] = patched
        docChanged = true
      }
    }

    if (docChanged) {
      result.docsPatched++
      result.patches.push({ id, patch: patchData })

      if (live) {
        try {
          await client.patch(id).set(patchData).commit()
          console.log(`  ✓ PATCH ${type} ${id}`)
        } catch (err: any) {
          console.error(`  ✗ ERROR ${type} ${id}: ${err.message}`)
          result.errors.push(`${type} ${id}: ${err.message}`)
        }
      }
    }
  }

  return result
}

async function main() {
  console.log(`Migrate highlights string[] → highlightItem[]`)
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}\n`)

  const query = `*[!(_type match "system.*") && highlights != null]`

  // --- Published namespace ---
  console.log('--- Published namespace ---')
  let docs: Record<string, unknown>[]
  try {
    docs = await client.fetch(query)
  } catch (err: any) {
    console.error(`Không đọc được dữ liệu: ${err.message}`)
    process.exit(1)
  }
  console.log(`Đọc ${docs.length} document\n`)

  if (docs.length === 0) {
    console.log('Không có document nào có field highlights. OK.')
    process.exit(0)
  }

  keyCounter = 0
  const pubResult = await migrateDocs(docs, 'published')

  // --- Draft namespace ---
  console.log('\n--- Draft namespace ---')
  let drafts: Record<string, unknown>[]
  try {
    drafts = await client.fetch(query, {}, { perspective: 'drafts' })
  } catch (err: any) {
    console.warn(`Không đọc được draft: ${err.message}. Bỏ qua draft namespace.`)
    drafts = []
  }

  let draftResult: MigrationResult = { itemsMigrated: 0, itemsSkipped: 0, docsPatched: 0, errors: [], patches: [] }
  if (drafts.length > 0) {
    console.log(`Đọc ${drafts.length} document\n`)
    keyCounter = 0
    draftResult = await migrateDocs(drafts, 'draft')
  } else {
    console.log('Không có draft.\n')
  }

  // --- Tổng kết ---
  console.log('\n=== Tổng kết ===')
  console.log(`Published — ITEM migrate: ${pubResult.itemsMigrated}, SKIPPED: ${pubResult.itemsSkipped}, DOCS PATCHED: ${pubResult.docsPatched}, ERROR: ${pubResult.errors.length}`)
  console.log(`Draft     — ITEM migrate: ${draftResult.itemsMigrated}, SKIPPED: ${draftResult.itemsSkipped}, DOCS PATCHED: ${draftResult.docsPatched}, ERROR: ${draftResult.errors.length}`)

  const totalMigrated = pubResult.itemsMigrated + draftResult.itemsMigrated
  const totalPatched = pubResult.docsPatched + draftResult.docsPatched
  const totalErrors = pubResult.errors.length + draftResult.errors.length

  if (totalErrors > 0) {
    console.log(`\n${totalErrors} lỗi — xem log trên.`)
    process.exit(1)
  }

  if (dryRun) {
    console.log(`\n✓ DRY-RUN: ${totalMigrated} item sẽ được migrate (string→highlightItem) trên ${totalPatched} entity`)
    if (pubResult.patches.length > 0 || draftResult.patches.length > 0) {
      console.log('\n--- Sample patch (published) ---')
      const sample = pubResult.patches[0] || draftResult.patches[0]
      if (sample) {
        console.log(JSON.stringify(sample, null, 2))
      }
    }
    console.log('\n⚠️  Review patch trên. Khi sẵn sàng, chạy:')
    console.log('  SANITY_WRITE_TOKEN=<token> npx tsx migrate/migrate-highlights.ts --live')
  } else if (live) {
    console.log(`\n✓ LIVE: ${totalMigrated} item đã migrate (string→highlightItem) trên ${totalPatched} entity`)
  }
}

main().catch((err) => {
  console.error('Migration thất bại:', err.message)
  process.exit(1)
})
