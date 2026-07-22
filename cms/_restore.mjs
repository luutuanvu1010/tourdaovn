import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const c = createClient({ projectId: process.env.SANITY_STUDIO_PROJECT_ID||'lmgxynxp', dataset: 'production', apiVersion: '2026-06-01', token: process.env.SANITY_WRITE_TOKEN, useCdn: false, perspective: 'raw' })
const doc = await c.fetch('*[_id=="seed.dao-binh-ba"][0]{faq}')
let n=0
for (const lang of ['vi','en','zh','ko','ru']) for (const it of (doc.faq[lang]||[])) if(!it._type){it._type='object';n++}
await c.patch('seed.dao-binh-ba').set({ faq: doc.faq }).commit()
console.log(`Khôi phục _type cho ${n} item`)
