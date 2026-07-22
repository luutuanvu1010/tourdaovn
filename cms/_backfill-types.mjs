import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID||'lmgxynxp', dataset: process.env.SANITY_STUDIO_DATASET||'production',
  apiVersion: '2026-06-01', token: process.env.SANITY_WRITE_TOKEN, useCdn: false, perspective: 'raw',
})
// Mapping suy từ bản chất, đúng enum CONTENT_MODEL
const MAP = {
  // place: beach|island|landform|ward|area
  'seed.vinh-nha-trang': { placeType: 'landform' },
  'seed.hon-mun': { placeType: 'island' },
  'seed.hon-mot': { placeType: 'island' },
  'seed.dao-binh-ba': { placeType: 'island' },
  'seed.dam-nha-phu': { placeType: 'landform' },
  // attraction bách khoa: historic|temple|church|museum (có sameAs nên đủ I12)
  'seed.thanh-co-dien-khanh': { attractionType: 'historic' },
  'seed.vien-pasteur-nha-trang': { attractionType: 'museum' },
  'seed.chua-hai-duc': { attractionType: 'temple' },
  // specialty: dish|product (có sameAs nên đủ)
  'seed.bun-sua': { specialtyType: 'dish' },
  'seed.nem-nuong-ninh-hoa': { specialtyType: 'dish' },
  'seed.banh-can': { specialtyType: 'dish' },
  'seed.bun-cha-ca-nha-trang': { specialtyType: 'dish' },
  'seed.yen-sao': { specialtyType: 'product' },
}
let n = 0
for (const [base, patch] of Object.entries(MAP)) {
  for (const id of [base, `drafts.${base}`]) {
    const doc = await client.fetch('*[_id==$id][0]{_id}', { id })
    if (doc) { await client.patch(id).set(patch).commit(); console.log(`${id} ← ${JSON.stringify(patch)}`); n++ }
  }
}
console.log(`\n✅ Backfill ${n} bản ghi`)
