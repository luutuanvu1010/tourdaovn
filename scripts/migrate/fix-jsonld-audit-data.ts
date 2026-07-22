// scripts/migrate/fix-jsonld-audit-data.ts
//
// Sửa 4 lỗi dữ liệu phát hiện trong audit cấu trúc dữ liệu JSON-LD
// (DECISIONS 2026-07-06, phần "Nợ ghi lại"):
//   1. seed.nha-trang: keyFacts.vi 2 item đầu đảo ngược label/value.
//   2. Tour "Hòn Mun - Làng Chài - Mini Beach": tripOrigin trỏ Hòn Mun —
//      là điểm ĐẾN của tour, không phải nơi xuất phát → unset (field tùy,
//      không thuộc gate I14; dữ liệu sai tệ hơn dữ liệu vắng).
//   3. Experience "Lặn biển Hòn Mun": marker [cite:NN] của module tổng hợp
//      còn sót trong summary/body/seo → strip (đồng bộ với fix code trong
//      field-mapper.ts + sanitizeLd).
//   4. Sheraton: checkinTime/checkoutTime (14:00/10:00) lệch với FAQ đã
//      duyệt (15:00/12:00, theo Marriott) → căn theo FAQ.
//
// Idempotent: mỗi mục chỉ patch khi còn đúng giá trị lỗi.
// Patch cả bản draft nếu tồn tại để draft publish sau không đè ngược.
//
// Chạy:
//   cd scripts
//   node --import ./node_modules/tsx/dist/esm/index.mjs migrate/fix-jsonld-audit-data.ts --dry-run
//   node --import ./node_modules/tsx/dist/esm/index.mjs migrate/fix-jsonld-audit-data.ts --live

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

const NHA_TRANG_ID = 'seed.nha-trang'
const TOUR_ID = 'bc8ce486-840d-417c-a1d1-4f90da02d6bd'
const EXPERIENCE_ID = '72d9d53a-fd42-42c7-8835-2cbf64343e49'
const SHERATON_ID = 'seed.sheraton-nha-trang-hotel-spa'

// keyFacts.vi bị đảo: label chứa giá trị, value chứa nhãn. Nhận diện theo
// value là nhãn đã biết để idempotent.
const SWAPPED_VALUE_LABELS = new Set(['Vị trí', 'Nổi tiếng với'])

function stripCiteMarkers(text: string): string {
  return text
    .replace(/\[cite:[^\]]*\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
}

function stripCitesDeep<T>(value: T): T {
  if (typeof value === 'string') return stripCiteMarkers(value) as unknown as T
  if (Array.isArray(value)) return value.map((v) => stripCitesDeep(v)) as unknown as T
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = stripCitesDeep(v)
    }
    return out as unknown as T
  }
  return value
}

/** Lấy doc published + draft (nếu có) cho một id. */
async function fetchWithDraft(id: string): Promise<Record<string, unknown>[]> {
  return client.fetch(`*[_id in [$id, $draftId]]`, { id, draftId: `drafts.${id}` })
}

async function applyPatch(id: string, label: string, set: Record<string, unknown>, unset: string[] = []) {
  const keys = [...Object.keys(set), ...unset.map((u) => `unset ${u}`)]
  console.log(`  ${dryRun ? '[DRY-RUN]' : '[LIVE]'} ${id}: ${label} — ${keys.join(', ')}`)
  if (dryRun) return
  let patch = client.patch(id)
  if (Object.keys(set).length > 0) patch = patch.set(set)
  if (unset.length > 0) patch = patch.unset(unset)
  await patch.commit()
}

async function fixKeyFacts() {
  console.log('\n1. keyFacts.vi đảo label/value (seed.nha-trang)')
  for (const doc of await fetchWithDraft(NHA_TRANG_ID)) {
    const keyFacts = (doc.keyFacts as Record<string, unknown> | undefined) ?? {}
    const vi = keyFacts.vi as Array<{ _key: string; label?: string; value?: string }> | undefined
    if (!vi) { console.log(`  SKIP ${doc._id}: không có keyFacts.vi`); continue }
    let changed = false
    const fixed = vi.map((item) => {
      if (item.value && SWAPPED_VALUE_LABELS.has(item.value)) {
        changed = true
        return { ...item, label: item.value, value: item.label }
      }
      return item
    })
    if (!changed) { console.log(`  OK ${doc._id}: không còn item đảo`); continue }
    await applyPatch(doc._id as string, 'swap label/value', { 'keyFacts.vi': fixed })
  }
}

async function fixTripOrigin() {
  console.log('\n2. tripOrigin sai (tour Hòn Mun - Làng Chài - Mini Beach)')
  for (const doc of await fetchWithDraft(TOUR_ID)) {
    const ref = (doc.tripOrigin as { _ref?: string } | undefined)?._ref
    if (ref !== 'seed.hon-mun') { console.log(`  OK ${doc._id}: tripOrigin không trỏ seed.hon-mun (${ref ?? 'rỗng'})`); continue }
    await applyPatch(doc._id as string, 'unset tripOrigin trỏ điểm đến', {}, ['tripOrigin'])
  }
}

async function fixCiteMarkers() {
  console.log('\n3. Marker [cite:NN] trong experience Lặn biển Hòn Mun')
  for (const doc of await fetchWithDraft(EXPERIENCE_ID)) {
    const set: Record<string, unknown> = {}
    for (const field of ['summary', 'body', 'seo'] as const) {
      const value = doc[field]
      if (!value) continue
      if (!JSON.stringify(value).includes('[cite:')) continue
      set[field] = stripCitesDeep(value)
    }
    if (Object.keys(set).length === 0) { console.log(`  OK ${doc._id}: không còn [cite:]`); continue }
    await applyPatch(doc._id as string, 'strip [cite:NN]', set)
  }
}

async function fixSheratonTimes() {
  console.log('\n4. Sheraton checkinTime/checkoutTime lệch FAQ đã duyệt')
  for (const doc of await fetchWithDraft(SHERATON_ID)) {
    const set: Record<string, unknown> = {}
    if (doc.checkinTime === '14:00') set.checkinTime = '15:00'
    if (doc.checkoutTime === '10:00') set.checkoutTime = '12:00'
    if (Object.keys(set).length === 0) { console.log(`  OK ${doc._id}: giờ đã khớp FAQ`); continue }
    await applyPatch(doc._id as string, 'căn giờ theo FAQ (Marriott)', set)
  }
}

async function main() {
  console.log('Fix dữ liệu audit JSON-LD 2026-07-06')
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`)

  await fixKeyFacts()
  await fixTripOrigin()
  await fixCiteMarkers()
  await fixSheratonTimes()

  console.log(`\nXong (${dryRun ? 'dry-run, chưa ghi gì' : 'đã ghi Sanity'}).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
