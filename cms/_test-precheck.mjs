import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const c = createClient({ projectId: process.env.SANITY_STUDIO_PROJECT_ID||'lmgxynxp', dataset: 'production', apiVersion: '2026-06-01', token: process.env.SANITY_WRITE_TOKEN, useCdn: false, perspective: 'raw' })
// Tạm bỏ _type của 1 faq item Bình Ba (mô phỏng sửa tay trên published)
const doc = await c.fetch('*[_id=="seed.dao-binh-ba"][0]{faq}')
const item = doc.faq.vi.find(x => x._key === 'a8c8d9715cee')
const saved = item._type
delete item._type
await c.patch('seed.dao-binh-ba').set({ faq: doc.faq }).commit()
console.log('TẠO lỗi tạm: bỏ _type faq item Bình Ba')
