#!/usr/bin/env npx tsx
// Backfill SEO meta for field-level entities from Basic tab data.
// Default is dry-run; add --execute to write.
// Default preserves existing editor-entered SEO values; add --overwrite to replace all values.

import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env'), quiet: true })

const execute = process.argv.includes('--execute')
const overwrite = process.argv.includes('--overwrite')
const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

const ENTITY_TYPES = [
  'touristDestination',
  'place',
  'attraction',
  'restaurant',
  'specialty',
  'hotel',
  'resort',
  'experience',
  'organization',
  'event',
  'tour',
  'person',
  'category',
]

const LANGUAGES = ['vi', 'en', 'zh', 'ko', 'ru'] as const
type Lang = (typeof LANGUAGES)[number]
type Localized = Partial<Record<Lang, string>>

if (!projectId) {
  console.error('Thiếu SANITY_STUDIO_PROJECT_ID')
  process.exit(1)
}
if (!token) {
  console.error('Thiếu SANITY_WRITE_TOKEN')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-06-01',
  token,
  useCdn: false,
  perspective: 'raw',
})

function cleanLocalized(value: unknown): Localized {
  if (!value || typeof value !== 'object') return {}
  return LANGUAGES.reduce<Localized>((acc, lang) => {
    const text = (value as Record<string, unknown>)[lang]
    if (typeof text === 'string' && text.trim()) acc[lang] = text.trim()
    return acc
  }, {})
}

function mergeGenerated(existing: unknown, generated: Localized): Localized {
  if (overwrite) return generated
  return { ...generated, ...cleanLocalized(existing) }
}

function hasDiff(left: unknown, right: unknown) {
  return JSON.stringify(cleanLocalized(left)) !== JSON.stringify(cleanLocalized(right))
}

async function main() {
  const docs = await client.fetch(
    `*[_type in $types]{
      _id,
      _type,
      title,
      summary,
      seo
    } | order(_type asc, _id asc)`,
    { types: ENTITY_TYPES },
  )

  const patches = []
  for (const doc of docs) {
    const metaTitle = mergeGenerated(doc.seo?.metaTitle, cleanLocalized(doc.title))
    const metaDescription = mergeGenerated(doc.seo?.metaDescription, cleanLocalized(doc.summary))
    if (!Object.keys(metaTitle).length && !Object.keys(metaDescription).length) continue

    const patch: Record<string, unknown> = {}
    if (hasDiff(doc.seo?.metaTitle, metaTitle)) patch['seo.metaTitle'] = metaTitle
    if (hasDiff(doc.seo?.metaDescription, metaDescription)) patch['seo.metaDescription'] = metaDescription
    if (Object.keys(patch).length) patches.push({ id: doc._id, type: doc._type, patch })
  }

  console.log(`${execute ? 'PATCH' : 'DRY-RUN'} seo meta: ${patches.length}/${docs.length} document cần cập nhật (${overwrite ? 'overwrite' : 'preserve existing'})`)
  for (const item of patches) {
    console.log(`- ${item.id} [${item.type}]: ${Object.keys(item.patch).join(', ')}`)
  }
  if (!execute || patches.length === 0) return

  let tx = client.transaction()
  for (const item of patches) tx = tx.patch(item.id, patch => patch.set(item.patch))
  await tx.commit()
  console.log(`Đã cập nhật SEO meta cho ${patches.length} document.`)
}

main().catch(err => {
  console.error('Lỗi backfill-seo-meta:', err.message)
  process.exit(1)
})
