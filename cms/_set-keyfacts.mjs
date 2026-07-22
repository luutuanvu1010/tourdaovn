import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID||'lmgxynxp', dataset: process.env.SANITY_STUDIO_DATASET||'production',
  apiVersion: '2026-06-01', token: process.env.SANITY_WRITE_TOKEN, useCdn: false, perspective: 'raw',
})
const keyFacts = {
  vi: [
    { _key: 'kf1', value: '24.965 ha', label: 'Diện tích Vịnh Nha Trang' },
    { _key: 'kf2', value: '~300', label: 'Ngày nắng mỗi năm' },
    { _key: 'kf3', value: '19+', label: 'Hòn đảo lớn nhỏ' },
    { _key: 'kf4', value: 'Thành viên', label: 'CLB vịnh đẹp nhất thế giới' },
  ]
}
for (const id of ['seed.nha-trang','drafts.seed.nha-trang']) {
  const doc = await client.fetch('*[_id==$id][0]{_id, keyFacts}', { id })
  if (!doc) continue
  // chỉ điền nếu trống (không đè nội dung founder có thể đã thêm)
  if (doc.keyFacts?.vi?.length) { console.log(`${id}: đã có keyFacts, bỏ qua`); continue }
  await client.patch(id).set({ keyFacts }).commit()
  console.log(`${id}: gắn 4 keyFacts`)
}
console.log('✅ xong')
