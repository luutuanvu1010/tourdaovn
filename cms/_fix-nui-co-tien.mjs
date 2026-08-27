// Núi Cô Tiên: doc `approved` nhưng thiếu `slug.vi` nên không render ra trang nào —
// đã duyệt mà vô hình. Chủ dự án chốt trong phiên 2026-08-27: đặt slug `nui-co-tien`,
// loại `nature` (SPEC-2026-08-27-loai-diem-tham-quan §17).
//
// Đây là việc SINH MỘT URL MỚI trên site, không phải sửa dữ liệu thuần, nên tách khỏi
// script migration hàng loạt để thấy rõ trong lịch sử.
//
// Doc có `officialSource`, và `nature` thuộc nhánh "một trong hai" của I2, nên qua cổng.
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

const ID = 'd67f230e-1d45-490a-ba5f-8dd906671d06'
const SLUG = 'nui-co-tien'
const DRY = process.argv.includes('--dry')

// R1: slug term và slug entity sống chung nhánh /diem-tham-quan/, cấm trùng.
const clash = await client.fetch(
  `*[(_type=="attraction" && slug.vi.current==$s && _id!=$id)
    || (_type=="category" && inDefinedTermSet=="attraction-type" && slug.current==$s)][0]{_id,_type}`,
  { s: SLUG, id: ID },
)
if (clash) throw new Error(`R1: slug "${SLUG}" da bi ${clash._type} ${clash._id} dung`)

let n = 0
for (const id of [ID, `drafts.${ID}`]) {
  const doc = await client.fetch('*[_id==$id][0]{_id, "t": title.vi, "s": slug.vi.current}', { id })
  if (!doc) continue
  console.log(`${DRY ? '[thu] ' : ''}${id}  slug=${doc.s ?? '(trong)'} -> ${SLUG}, attractionType -> nature   ${doc.t}`)
  if (!DRY) {
    await client.patch(id).set({
      slug: { vi: { _type: 'slug', current: SLUG } },
      attractionType: 'nature',
    }).commit()
  }
  n++
}
console.log(`\n${DRY ? 'SE patch' : 'Da patch'}: ${n} ban ghi. URL moi: /diem-tham-quan/${SLUG}/`)
