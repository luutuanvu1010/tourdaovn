import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID||'lmgxynxp', dataset: process.env.SANITY_STUDIO_DATASET||'production',
  apiVersion: '2026-06-01', token: process.env.SANITY_WRITE_TOKEN, useCdn: false, perspective: 'raw',
})
const LANGS = ['vi','en','zh','ko','ru']
let fixed = 0
for (const id of ['seed.dao-binh-ba','drafts.seed.dao-binh-ba']) {
  const doc = await client.fetch('*[_id==$id][0]{_id, faq}', { id })
  if (!doc?.faq) continue
  let changed = false
  for (const lang of LANGS) {
    const arr = doc.faq[lang]
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      if (!item._type) { item._type = 'object'; changed = true }
    }
  }
  if (changed) { await client.patch(id).set({ faq: doc.faq }).commit(); fixed++; console.log(`${id}: vá _type faq item`) }
  else console.log(`${id}: không có item thiếu _type`)
}
console.log(`✅ vá ${fixed} doc`)
