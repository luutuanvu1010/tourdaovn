import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID||'lmgxynxp', dataset: process.env.SANITY_STUDIO_DATASET||'production',
  apiVersion: '2026-06-01', token: process.env.SANITY_WRITE_TOKEN, useCdn: false, perspective: 'raw',
})
const IDS = ['seed.bac-nha-trang','seed.biet-dien-cau-da']
for (const id of IDS) {
  const doc = await client.fetch('*[_id==$id][0]{_id, approvedBy, contentProvenance}', { id })
  if (!doc) { console.log(`${id}: KHÔNG thấy, bỏ`); continue }
  const patch = { reviewStatus: 'approved' }
  if (!doc.approvedBy) patch.approvedBy = 'Lưu Tuấn Vũ'
  if (!doc.contentProvenance) patch.contentProvenance = 'mixed'
  await client.patch(id).set(patch).commit()
  // dọn draft thừa nếu có
  const draftId = `drafts.${id}`
  const d = await client.fetch('*[_id==$id][0]{_id}', { id: draftId })
  if (d) { await client.delete(draftId); console.log(`${id}: approved + xóa draft thừa`) }
  else console.log(`${id}: approved`)
}
console.log('✅ R3 fixed')
