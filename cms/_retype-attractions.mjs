// Xếp lại attractionType theo SPEC-2026-08-27-loai-diem-tham-quan §8 (QĐ-2026-08-27-03).
// Chạy sau khi đã sao lưu bằng _export-backup.mjs. Patch cả bản published lẫn draft.
// Chỉ ghi 39 slug ĐÃ ĐƯỢC DUYỆT trong bảng §8; slug ngoài bảng thì BỎ QUA và báo ra,
// không tự đoán (R2).
import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2026-06-01', token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false, perspective: 'raw',
})

const MAP = {
  'bai-bien-doc-let': 'beach', 'bai-dai-cam-lam': 'beach', 'khu-du-lich-bai-tranh': 'beach',
  'bien-ninh-chu': 'beach', 'khu-du-lich-binh-tien': 'beach', 'khu-du-lich-mini-beach': 'beach',
  'dao-ga-nha-trang': 'island', 'khu-du-lich-hon-mun': 'island', 'khu-du-lich-hon-soi': 'island',
  'khu-du-lich-dao-hoa-lan-hon-heo': 'island', 'khu-du-lich-hon-tam': 'island',
  'hon-chong': 'nature', 'thac-ta-gu': 'nature', 'khu-du-lich-suoi-tien': 'nature',
  'rung-thong-khanh-son': 'nature', 'vinh-vinh-hy': 'nature', 'khu-du-lich-vinh-san-ho': 'nature',
  'khu-du-lich-tam-linh-hon-ba': 'nature', 'vinh-nha-trang': 'nature', 'vinh-nha-phu': 'nature',
  'khu-du-lich-ba-ho': 'nature', 'khu-du-lich-yang-bay': 'nature',
  'lang-chai-bich-dam': 'craft-village', 'lang-chai-hon-mieu': 'craft-village',
  'lang-nghe-truong-son': 'craft-village', 'ben-du-thuyen-nha-trang': 'general',
  'cong-vien-giai-tri-vinwonders': 'theme-park', 'vin-harbour': 'theme-park',
  'khu-du-lich-kong-forest': 'theme-park', 'khu-du-lich-diamond-bay': 'theme-park',
  'vien-hai-duong-hoc': 'aquarium', 'khu-du-lich-i-resort': 'mud-spa',
  'khu-du-lich-tam-bun-thap-ba': 'mud-spa', 'chua-long-son': 'temple',
  'chua-phap-vien-thanh-son': 'temple', 'chua-suoi-do': 'temple', 'nha-tho-nui': 'church',
  'thanh-co-dien-khanh': 'historic', 'thap-ba-ponaga': 'historic',
  // Bổ sung §15/§16 — ba doc còn ở trạng thái draft, không có trong bảng §8 ban đầu
  // vì bảng đó dựng từ dist/ (bản dựng cũ, chỉ có doc đã publish).
  'lang-gom-bau-truc': 'craft-village',
  'vinh-ninh-van': 'nature',
  'khu-du-lich-dao-khi-hon-lao': 'island',
  // KHÔNG đưa `Núi Cô Tiên` vào: doc approved nhưng thiếu slug.vi nên không render ra
  // trang nào; đặt slug là quyết định URL, không suy ra được (xem §15).
}

const docs = await client.fetch(
  '*[_type=="attraction"]{_id, "slug": slug.vi.current, "t": title.vi, attractionType}'
)
const DRY = process.argv.includes('--dry')
let patched = 0, same = 0
const skipped = []
for (const d of docs) {
  const want = MAP[d.slug]
  if (!want) { if (!d._id.startsWith('drafts.')) skipped.push(`${d.slug ?? '(thiếu slug)'} — ${d.t}`); continue }
  if (d.attractionType === want) { same++; continue }
  console.log(`${DRY ? '[thử] ' : ''}${d._id}  ${d.attractionType ?? '(trống)'} → ${want}   ${d.t}`)
  if (!DRY) await client.patch(d._id).set({ attractionType: want }).commit()
  patched++
}
console.log(`\n${DRY ? 'SẼ patch' : 'Đã patch'}: ${patched} · đã đúng sẵn: ${same}`)
if (skipped.length) console.log(`Ngoài bảng §8, KHÔNG đụng (${skipped.length}):\n  ` + skipped.join('\n  '))
