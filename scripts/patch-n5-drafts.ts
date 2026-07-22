#!/usr/bin/env npx tsx
// Vá các field draft N5 có nguồn đủ chắc. Mặc định dry-run; thêm --execute mới ghi.

import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env'), quiet: true })

const execute = process.argv.includes('--execute')
const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId) {
  console.error('Thiếu SANITY_STUDIO_PROJECT_ID')
  process.exit(1)
}
if (!token) {
  console.error('Thiếu SANITY_WRITE_TOKEN')
  process.exit(1)
}

const ref = (_ref: string) => ({ _type: 'reference', _ref })
const patches: Record<string, Record<string, any>> = {
  'drafts.seed.intercontinental-nha-trang': {
    address: { street: '32-34 Tran Phu Street', ward: 'Loc Tho' },
  },
  'drafts.seed.muong-thanh-luxury-nha-trang': {
    address: { street: '60 Tran Phu Street', ward: 'Loc Tho' },
  },
  'drafts.seed.sheraton-nha-trang-hotel-spa': {
    address: { street: '26-28 Tran Phu Street', ward: 'Loc Tho' },
  },
  'drafts.seed.vinpearl-resort-nha-trang': {
    address: { street: 'Hon Tre Island', ward: 'Vinh Nguyen' },
  },
  'drafts.seed.costa-seafood': {
    address: { street: '32-34 Tran Phu Street', ward: 'Loc Tho' },
    officialSource: 'https://costaseafood.com.vn/',
    containedInPlace: ref('seed.nha-trang'),
  },
  'drafts.seed.louisiane-brewhouse-nha-trang': {
    address: { street: '29 Tran Phu Street', ward: 'Loc Tho' },
  },
  'drafts.seed.hon-mot': {
    containedInPlace: ref('seed.vinh-nha-trang'),
  },
  'drafts.seed.chua-hai-duc': {
    containedInPlace: ref('seed.nha-trang'),
    address: { street: '51 Hải Đức', ward: 'Phương Sơn' },
  },
  'drafts.seed.doc-let': {
    containedInPlace: ref('seed.bac-nha-trang'),
    officialSource: 'https://vi.wikipedia.org/wiki/D%E1%BB%91c_L%E1%BA%BFt',
    address: { street: 'Dốc Lết', ward: 'Đông Ninh Hòa' },
  },
  'drafts.seed.suoi-hoa-lan': {
    containedInPlace: ref('seed.dam-nha-phu'),
    officialSource: 'https://vi.wikipedia.org/wiki/Su%E1%BB%91i_Hoa_Lan',
    address: { street: 'Khu du lịch Suối Hoa Lan', ward: 'Ninh Phú' },
  },
}

const client = createClient({ projectId, dataset, apiVersion: '2026-06-01', token, useCdn: false, perspective: 'raw' })

async function main() {
  const existing: string[] = await client.fetch(`*[_id in $ids]._id`, { ids: Object.keys(patches) })
  const existingIds = new Set(existing)
  const activePatches = Object.fromEntries(Object.entries(patches).filter(([id]) => existingIds.has(id)))

  console.log(`${execute ? 'PATCH' : 'DRY-RUN'} ${Object.keys(activePatches).length} draft:`)
  for (const [id, patch] of Object.entries(activePatches)) {
    console.log(`- ${id}: ${Object.keys(patch).join(', ')}`)
  }
  const skipped = Object.keys(patches).filter(id => !existingIds.has(id))
  if (skipped.length) console.log(`Bỏ qua draft không còn tồn tại: ${skipped.join(', ')}`)
  if (!execute) return

  let tx = client.transaction()
  for (const [id, patch] of Object.entries(activePatches)) {
    tx = tx.patch(id, p => p.set(patch))
  }
  await tx.commit()
  console.log('Đã vá draft.')
}

main().catch(err => {
  console.error('Lỗi patch-n5-drafts:', err.message)
  process.exit(1)
})
