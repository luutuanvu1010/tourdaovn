// scripts/migrate/i18n-flat-to-object.ts
//
// Di trú dữ liệu field-level: chuyển field phẳng → object localized {vi: X}
// Spec: ADR-0013 §Hệ quả (dòng 38-39)
//
// Chỉ di trú field trong TRANSLATABLE_FIELDS, không đụng SHARED_FIELDS.
// Field đã là object có key "vi" → SKIP (idempotent).
// Article (document-level i18n) và Person (đã di trú DOT1) → bỏ qua.
//
// Chạy:
//   cd scripts
//   export SANITY_WRITE_TOKEN=<token>
//   npx tsx migrate/i18n-flat-to-object.ts
//
// ⚠️  Export dataset làm mốc lùi TRƯỚC KHI chạy:
//   npx sanity dataset export production backups/backup-$(date +%Y-%m-%d).tar.gz

import { createClient } from '@sanity/client'
import { TRANSLATABLE_FIELDS } from '../../cms/lib/i18nConfig'

// --- Cấu hình client -------------------------------------------------------
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!token) {
  console.error('Thiếu SANITY_WRITE_TOKEN.')
  console.error('Chạy: SANITY_WRITE_TOKEN=<token> npx tsx migrate/i18n-flat-to-object.ts')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-06-01',
  token,
  useCdn: false,
})

// --- Hằng ------------------------------------------------------------------
const SKIP_TYPES = ['article', 'person']

// Field đã là object localized từ trước DOT1 (có key "vi" từ đầu)
// slug nằm trong SHARED_FIELDS, không bị quét — chỉ liệt kê ở đây để biết
const ALREADY_OBJECT = new Set([
  'title',
  'summary',
  'seo',
  'jobTitle',
  'knowsAbout',
  'bio',
])

// Field cần di trú = TRANSLATABLE_FIELDS − ALREADY_OBJECT
const FIELDS_TO_MIGRATE = TRANSLATABLE_FIELDS.filter(
  (f) => !ALREADY_OBJECT.has(f)
)

// --- Helper ----------------------------------------------------------------
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

interface MigrationResult {
  wrapped: number
  skipped: number
  warned: number
  errors: string[]
}

async function migrateDocs(docs: Record<string, unknown>[]): Promise<MigrationResult> {
  const result: MigrationResult = { wrapped: 0, skipped: 0, warned: 0, errors: [] }

  for (const doc of docs) {
    const id = doc._id as string
    const type = doc._type as string
    let changed = false

    for (const field of FIELDS_TO_MIGRATE) {
      const value = doc[field]

      // null/undefined → SKIP
      if (value === null || value === undefined) continue

      if (isObject(value)) {
        if ('vi' in value) {
          console.log(`  SKIP  ${type} ${id}.${field} — đã là object localized`)
          result.skipped++
          continue
        }
        // Object nhưng không có key "vi" — bất thường, không đụng
        console.warn(`  WARN  ${type} ${id}.${field} — object nhưng không có key "vi", bỏ qua`)
        result.warned++
        continue
      }

      // Flat value (string, array, number, boolean) → wrap {vi: original}
      doc[field] = { vi: value }
      console.log(`  WRAP  ${type} ${id}.${field}`)
      result.wrapped++
      changed = true
    }

    if (changed) {
      try {
        await client.createOrReplace(doc as Record<string, unknown> & { _id: string; _type: string })
      } catch (err: any) {
        console.error(`  ERROR ${type} ${id}: ${err.message}`)
        result.errors.push(`${type} ${id}: ${err.message}`)
      }
    }
  }

  return result
}

// --- Main ------------------------------------------------------------------
async function main() {
  console.log(`Migration i18n flat → object localized`)
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Field cần di trú: ${FIELDS_TO_MIGRATE.join(', ')}`)
  console.log(`Skip type: ${SKIP_TYPES.join(', ')}\n`)

  // Build query filter: bỏ qua Article và Person
  const typeFilter = SKIP_TYPES.map((t) => `_type != "${t}"`).join(' && ')
  const query = `*[${typeFilter} && !(_type match "system.*")]`

  // --- Published namespace ---
  console.log('--- Published namespace ---')
  let docs: Record<string, unknown>[]
  try {
    docs = await client.fetch(query)
  } catch (err: any) {
    console.error(`Không đọc được dữ liệu: ${err.message}`)
    process.exit(1)
  }
  console.log(`Đọc ${docs.length} document field-level (published)\n`)

  // Fail-closed: dataset production có nội dung thật, 0 document là bất thường
  if (docs.length === 0) {
    console.error('Đọc được 0 document — bất thường. Kiểm tra SANITY_WRITE_TOKEN và project/dataset.')
    process.exit(1)
  }

  const pubResult = await migrateDocs(docs)

  // --- Draft namespace ---
  console.log('\n--- Draft namespace ---')
  let drafts: Record<string, unknown>[]
  try {
    drafts = await client.fetch(query, {}, { perspective: 'drafts' })
  } catch (err: any) {
    console.warn(`Không đọc được draft: ${err.message}. Bỏ qua draft namespace.`)
    drafts = []
  }

  if (drafts.length > 0) {
    console.log(`Đọc ${drafts.length} document draft\n`)
    const draftResult = await migrateDocs(drafts)

    // Tổng kết
    console.log('\n=== Tổng kết ===')
    console.log(`Published — WRAP: ${pubResult.wrapped}, SKIP: ${pubResult.skipped}, WARN: ${pubResult.warned}, ERROR: ${pubResult.errors.length}`)
    console.log(`Draft     — WRAP: ${draftResult.wrapped}, SKIP: ${draftResult.skipped}, WARN: ${draftResult.warned}, ERROR: ${draftResult.errors.length}`)

    const totalErrors = pubResult.errors.length + draftResult.errors.length
    if (totalErrors > 0) {
      console.log(`\n${totalErrors} lỗi — xem log trên.`)
      process.exit(1)
    }
  } else {
    console.log('Không có draft.\n')

    // Tổng kết
    console.log('=== Tổng kết ===')
    console.log(`WRAP: ${pubResult.wrapped}, SKIP: ${pubResult.skipped}, WARN: ${pubResult.warned}, ERROR: ${pubResult.errors.length}`)

    if (pubResult.errors.length > 0) {
      console.log(`\n${pubResult.errors.length} lỗi — xem log trên.`)
      process.exit(1)
    }
  }

  console.log('\nMigration hoàn tất. Không có lỗi.')
}

main().catch((err) => {
  console.error('Migration thất bại:', err.message)
  process.exit(1)
})
