import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const c = createClient({ projectId: process.env.SANITY_STUDIO_PROJECT_ID||'lmgxynxp', dataset: 'production', apiVersion: '2026-06-01', token: process.env.SANITY_WRITE_TOKEN, useCdn: false, perspective: 'raw' })
const LANGS = ['vi','en','zh','ko','ru']
// Quét toàn dataset, vá mọi faq item thiếu _type (localized + flat)
const docs = await c.fetch('*[defined(faq)]{_id, faq}')
let total = 0
for (const d of docs) {
  let changed = false
  const faq = d.faq
  if (Array.isArray(faq)) {
    for (const it of faq) if (it && typeof it==='object' && !it._type) { it._type='object'; changed=true; total++ }
  } else if (faq && typeof faq==='object') {
    for (const lang of LANGS) {
      const arr = faq[lang]; if (!Array.isArray(arr)) continue
      for (const it of arr) if (it && typeof it==='object' && !it._type) { it._type='object'; changed=true; total++ }
    }
  }
  if (changed) { await c.patch(d._id).set({ faq }).commit(); console.log(`vá ${d._id}`) }
}
console.log(`✅ vá ${total} faq item`)
