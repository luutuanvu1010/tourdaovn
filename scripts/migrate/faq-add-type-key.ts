// scripts/migrate/faq-add-type-key.ts
//
// Chuẩn hóa faq item về named type 'faqItem' + đảm bảo _key ổn định.
// Schema định nghĩa faq item là named object type `faqItem` (FIX-FAQ-TYPE 2026-06-24).
//
// Với mỗi item: đặt _type='faqItem' (thêm khi thiếu HOẶC đổi từ 'object' cũ),
// thêm _key nếu thiếu. KHÔNG đổi question/answer/nội dung.
// Xử cả hai dạng faq: object localized {vi,en,zh,ko,ru} (entity bách khoa/venue)
// và mảng phẳng (Article, document-level i18n).
// Idempotent: chạy lại không đổi gì nếu mọi item đã 'faqItem' + có _key.
//
// Chạy:
//   cd scripts
//   export SANITY_WRITE_TOKEN=<token>
//   npx tsx migrate/faq-add-type-key.ts --dry-run     # preview patch
//   npx tsx migrate/faq-add-type-key.ts --live        # áp dụng (cần creator duyệt dry-run trước)
//
// ⚠️  Export dataset làm mốc lùi TRƯỚC KHI chạy --live:
//   npx sanity dataset export production backups/backup-$(date +%Y-%m-%d).tar.gz

import { createClient } from '@sanity/client'

// --- Cấu hình client -------------------------------------------------------
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN
const dryRun = process.argv.includes('--dry-run')
const live = process.argv.includes('--live')

if (!token) {
  console.error('Thiếu SANITY_WRITE_TOKEN.')
  console.error('Chạy: SANITY_WRITE_TOKEN=<token> npx tsx migrate/faq-add-type-key.ts [--dry-run|--live]')
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

// --- Counter ổn định cho _key (giống field-mapper.ts) ----
let keyCounter = 0
const k = () => `faq${(keyCounter++).toString(36)}`

// --- Helper ----------------------------------------------------------------
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

interface MigrationResult {
  added: number
  skipped: number
  patched: number
  errors: string[]
  patches: Array<{ id: string; patch: Record<string, unknown> }>
}

async function migrateDocs(docs: Record<string, unknown>[], ns: 'published' | 'draft'): Promise<MigrationResult> {
  const result: MigrationResult = { added: 0, skipped: 0, patched: 0, errors: [], patches: [] }
  const langs = ['vi', 'en', 'zh', 'ko', 'ru']

  for (const doc of docs) {
    const rawId = doc._id as string
    const type = doc._type as string
    const faq = doc.faq

    // BUG ĐÃ SỬA: perspective 'drafts' trả _id ĐÃ strip tiền tố 'drafts.', nên
    // client.patch(doc._id) đi NHẦM sang bản published. Phải khôi phục đúng _id
    // theo namespace trước khi patch. (Verify: backfill báo "✓ PATCH" nhưng dataset
    // không đổi vì patch nhầm chỗ — Cowork 2026-06-22.)
    const id = ns === 'draft' && !rawId.startsWith('drafts.') ? `drafts.${rawId}` : rawId

    // Không có faq → SKIP
    if (!faq) {
      result.skipped++
      continue
    }

    let docChanged = false
    const patchData: Record<string, unknown> = {}

    // Chuẩn hóa một mảng faq item: đặt _type='faqItem' (thêm khi thiếu HOẶC đổi
    // từ 'object'/giá trị cũ khác), thêm _key nếu thiếu. KHÔNG đụng question/answer.
    // Idempotent: item đã 'faqItem' + có _key → không đổi.
    const migrateArray = (faqArray: unknown[]): { patched: unknown[]; changed: boolean } => {
      let changed = false
      const patched = faqArray.map((item) => {
        if (!isObject(item)) return item

        let itemChanged = false
        const patchedItem = { ...item }

        if (item._type !== 'faqItem') {
          patchedItem._type = 'faqItem'
          itemChanged = true
        }

        if (!('_key' in item)) {
          patchedItem._key = k()
          itemChanged = true
        }

        if (itemChanged) {
          result.added++
          changed = true
          docChanged = true
        }

        return patchedItem
      })
      return { patched, changed }
    }

    if (Array.isArray(faq)) {
      // Article: faq là mảng phẳng (document-level i18n)
      const { patched, changed } = migrateArray(faq)
      if (changed) patchData['faq'] = patched
    } else if (isObject(faq)) {
      // Entity bách khoa/venue: faq là object localized {vi,en,zh,ko,ru}
      for (const lang of langs) {
        const faqArray = faq[lang]
        if (!Array.isArray(faqArray)) continue
        const { patched, changed } = migrateArray(faqArray)
        // Chỉ ghi lại đúng ngôn ngữ có thay đổi (tránh write thừa)
        if (changed) patchData[`faq.${lang}`] = patched
      }
    } else {
      result.skipped++
      continue
    }

    if (docChanged) {
      result.patched++
      result.patches.push({ id, patch: patchData })

      if (live) {
        try {
          await client.patch(id).set(patchData).commit()
          console.log(`  ✓ PATCH ${type} ${id} — ${result.added} item`)
        } catch (err: any) {
          console.error(`  ✗ ERROR ${type} ${id}: ${err.message}`)
          result.errors.push(`${type} ${id}: ${err.message}`)
        }
      }
    }
  }

  return result
}

// --- Main ------------------------------------------------------------------
async function main() {
  console.log(`Chuẩn hóa faq item → _type:'faqItem' + _key`)
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}\n`)

  // Query: lấy entity có faq (không bị system)
  const query = `*[!(_type match "system.*") && faq != null]`

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
    console.error('Đọc được 0 document — bất thường. Kiểm tra SANITY_WRITE_TOKEN và project/dataset.')
    process.exit(1)
  }

  keyCounter = 0 // Reset counter cho published
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

  let draftResult: MigrationResult = { added: 0, skipped: 0, patched: 0, errors: [], patches: [] }
  if (drafts.length > 0) {
    console.log(`Đọc ${drafts.length} document\n`)
    keyCounter = 0 // Reset counter cho draft
    draftResult = await migrateDocs(drafts, 'draft')
  } else {
    console.log('Không có draft.\n')
  }

  // --- Tổng kết ---
  console.log('\n=== Tổng kết ===')
  console.log(`Published — ITEM chuẩn hóa: ${pubResult.added}, PATCHED: ${pubResult.patched}, ERROR: ${pubResult.errors.length}`)
  console.log(`Draft     — ITEM chuẩn hóa: ${draftResult.added}, PATCHED: ${draftResult.patched}, ERROR: ${draftResult.errors.length}`)

  const totalAdded = pubResult.added + draftResult.added
  const totalPatched = pubResult.patched + draftResult.patched
  const totalErrors = pubResult.errors.length + draftResult.errors.length

  if (totalErrors > 0) {
    console.log(`\n${totalErrors} lỗi — xem log trên.`)
    process.exit(1)
  }

  if (dryRun) {
    console.log(`\n✓ DRY-RUN: ${totalAdded} item sẽ được chuẩn hóa (_type→faqItem / thêm _key) trên ${totalPatched} entity`)
    if (pubResult.patches.length > 0 || draftResult.patches.length > 0) {
      console.log('\n--- Sample patch (published) ---')
      const sample = pubResult.patches[0] || draftResult.patches[0]
      if (sample) {
        console.log(JSON.stringify(sample, null, 2))
      }
    }
    console.log('\n⚠️  Review patch trên. Khi sẵn sàng, chạy:')
    console.log('  SANITY_WRITE_TOKEN=<token> npx tsx migrate/faq-add-type-key.ts --live')
  } else if (live) {
    console.log(`\n✓ LIVE: ${totalAdded} item đã chuẩn hóa (_type→faqItem / thêm _key) trên ${totalPatched} entity`)
  }
}

main().catch((err) => {
  console.error('Backfill thất bại:', err.message)
  process.exit(1)
})
