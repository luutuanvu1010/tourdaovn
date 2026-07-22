import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2026-06-01', token: process.env.SANITY_WRITE_TOKEN, useCdn: false, perspective: 'raw',
})
const ref = { _type: 'reference', _ref: 'seed.nha-trang' }
for (const id of ['seed.vinh-nha-trang','drafts.seed.vinh-nha-trang']) {
  const doc = await client.fetch('*[_id == $id][0]', { id })
  if (doc) { await client.patch(id).set({ containedInPlace: ref }).commit(); console.log(`set containedInPlace=seed.nha-trang @ ${id}`) }
}
console.log('✅ I12 fixed')
