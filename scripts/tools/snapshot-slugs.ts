// Snapshot slug PUBLISHED của mọi entity field-level → scripts/backups/slugs-<YYYY-MM-DD>.json
// Chạy TRƯỚC khi regenerate slug (npm run translate -- --force-slug) — nguồn để sinh redirect 301
// qua tools/gen-slug-redirects.ts.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNodeDotEnv } from '../synthesis/config'
import { ENTITY_TYPES } from '../translate/config'

const LANGS = ['vi', 'en', 'zh', 'ko', 'ru'] as const

export interface SlugSnapshotRow {
  _id: string
  _type: string
  slugs: Record<string, string>
}

async function main() {
  await loadNodeDotEnv()
  const { getClient } = await import('../lib/sanity-client')
  const client = getClient()

  const docs: any[] = await client.fetch(
    `*[_type in $types && reviewStatus == "approved"]{ _id, _type, slug }`,
    { types: [...ENTITY_TYPES] },
  )

  const rows: SlugSnapshotRow[] = docs.map(doc => {
    const slugs: Record<string, string> = {}
    for (const lang of LANGS) {
      const cur = doc.slug?.[lang]?.current
      if (typeof cur === 'string' && cur) slugs[lang] = cur
    }
    return { _id: doc._id, _type: doc._type, slugs }
  })

  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'backups')
  mkdirSync(dir, { recursive: true })
  const date = new Date().toISOString().slice(0, 10)
  const file = join(dir, `slugs-${date}.json`)
  writeFileSync(file, JSON.stringify({ takenAt: new Date().toISOString(), rows }, null, 2))
  console.log(`Đã snapshot slug của ${rows.length} entity approved → ${file}`)
}

main().catch(err => {
  console.error('Lỗi snapshot:', err.message)
  process.exit(1)
})
