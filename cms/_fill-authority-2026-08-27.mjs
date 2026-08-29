// Điền metadata thẩm quyền cho 4 document đang làm `governance-post` (S24) đỏ.
//
// Giá trị do CHỦ DỰ ÁN cung cấp trong phiên 2026-08-27 — máy không suy ra được,
// đây là lời khẳng định về việc con người đã làm gì (QĐ-2026-08-27-02 mục 3).
//
// Ghi chú về `ben-cang-da-chong`: nó là `place`, schema không có field `author`.
// Không cần thêm nguồn: AuthorityMeta.astro:33 lấy `data-author-name` từ
// `author?.title || approvedBy`, nên riêng `approvedBy` đã phủ cả hai phép kiểm
// "thiếu người duyệt" và "thiếu nguồn xác minh hoặc tác giả".
import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'

dotenv({ path: '../.env', quiet: true })

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2026-06-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
  perspective: 'raw',
})

const APPROVER = 'Hồ Đắc Duy'
const PERSON_HO_DAC_DUY = 'ecbf0678-b4c3-4a37-a315-1b720ae6e121'

const PATCHES = [
  {
    id: '8a236bb6-3abd-46b3-84c7-e51319d9a16f',
    what: 'cam-nang/review-mini-beach-… (article)',
    set: {
      approvedBy: APPROVER,
      author: { _type: 'reference', _ref: PERSON_HO_DAC_DUY },
    },
  },
  {
    id: '31296182-2a50-43fe-bea9-cf471b4c6c01',
    what: 'cam-nang/top-7-ngon-nui-… (article, đã có tác giả khác — giữ nguyên)',
    set: { approvedBy: APPROVER },
  },
  {
    id: '5b82bbad-a2c5-48bc-a3e0-4b3b5f987d22',
    what: 'dia-danh/ben-cang-da-chong (place, không có field author)',
    set: { approvedBy: APPROVER },
  },
  {
    id: 'ecbf0678-b4c3-4a37-a315-1b720ae6e121',
    what: 'tac-gia/ho-dac-duy (person)',
    set: { contentProvenance: 'human' },
  },
]

const DRY = process.argv.includes('--dry')
let n = 0
for (const p of PATCHES) {
  for (const id of [p.id, `drafts.${p.id}`]) {
    const doc = await client.fetch('*[_id==$id][0]{_id}', { id })
    if (!doc) continue
    console.log(`${DRY ? '[thu] ' : ''}${id}  ${JSON.stringify(p.set)}   ${p.what}`)
    if (!DRY) await client.patch(id).set(p.set).commit()
    n++
  }
}
console.log(`\n${DRY ? 'SE patch' : 'Da patch'}: ${n} ban ghi`)
