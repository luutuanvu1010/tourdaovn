// scripts/migrate/migrate-highlights-reverse.mjs
// JS version — tránh esbuild platform mismatch trong VM sandbox.
//
// Migrate highlights từ array of highlightItem → array of string.
// Founder chốt 2026-07-01: highlight chỉ cần 1 chuỗi là đủ, không cần object 3 field.
//
// Với mỗi item: nếu là object highlightItem → ghép thành chuỗi "emoji title — description".
// Nếu đã là string → bỏ qua (idempotent).
// Xử lý highlights object localized {vi,en,zh,ko,ru} (entity field-level i18n).

import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN || ''

function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function highlightItemToString(item) {
  if (typeof item === 'string') return item
  if (!isObject(item)) return String(item)

  const emoji = typeof item.emoji === 'string' ? item.emoji.trim() : ''
  const title = typeof item.title === 'string' ? item.title.trim() : ''
  const desc = typeof item.description === 'string' ? item.description.trim() : ''

  const parts = []
  if (emoji) parts.push(emoji)
  if (title) parts.push(title)
  if (desc) parts.push(desc)

  return parts.join(' — ') || parts.join(' ') || ''
}

const LANGUAGES = ['vi', 'en', 'zh', 'ko', 'ru']

async function main() {
  const dryRun = !process.argv.includes('--live')

  const readClient = createClient({
    projectId,
    dataset,
    apiVersion: '2026-06-01',
    token: token || undefined,
    useCdn: false,
    perspective: 'raw',
  })

  const writeClient = createClient({
    projectId,
    dataset,
    apiVersion: '2026-06-01',
    token: token || undefined,
    useCdn: false,
    perspective: 'raw',
  })

  console.log(`Migrate highlights: highlightItem[] → string[]`)
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}\n`)

  const query = `*[defined(highlights)] { _id, _type, highlights }`
  const docs = await readClient.fetch(query)

  console.log(`Tìm thấy ${docs.length} document có highlights\n`)

  let totalMigrated = 0
  let totalSkipped = 0
  let totalPatched = 0

  const patches = []

  for (const doc of docs) {
    const hl = doc.highlights
    if (!isObject(hl)) continue

    const patch = {}
    const affectedLangs = []

    for (const lang of LANGUAGES) {
      const arr = hl[lang]
      if (!Array.isArray(arr)) continue

      const hasHighlightItem = arr.some(
        (item) => isObject(item) && item._type === 'highlightItem'
      )
      if (!hasHighlightItem) {
        totalSkipped += arr.length
        continue
      }

      const converted = arr.map((item) => highlightItemToString(item))
      patch[`highlights.${lang}`] = converted
      affectedLangs.push(lang)
      totalMigrated += arr.length
    }

    if (Object.keys(patch).length > 0) {
      patches.push({ id: doc._id, type: doc._type, langs: affectedLangs })
      totalPatched++

      if (!dryRun) {
        try {
          await writeClient.patch(doc._id, (p) => p.set(patch)).commit()
        } catch (err) {
          console.error(`  ✗ ${doc._id}: ${err.message}`)
        }
      }
    }
  }

  console.log(`\n--- Kết quả ---`)
  console.log(`${totalPatched} document cần migrate, ${totalMigrated} item sẽ chuyển sang string`)
  console.log(`${totalSkipped} item đã là string — bỏ qua\n`)

  if (patches.length > 0) {
    console.log('Các document ảnh hưởng:')
    for (const p of patches) {
      console.log(`  ${p.id} (${p.type}) → ${p.langs.join(', ')}`)
    }
  }

  if (dryRun) {
    console.log(`\n✓ DRY-RUN hoàn tất. Chạy lại với --live để ghi:`)
    console.log('  node scripts/migrate/migrate-highlights-reverse.mjs --live')
  } else {
    console.log(`\n✓ LIVE hoàn tất: ${totalMigrated} item đã migrate.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
