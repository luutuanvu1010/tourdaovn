// Hoàn nguyên attractionType về đúng bản sao lưu backup-2026-08-27-07-42.ndjson.
//
// Vì sao cần: hook Sanity (bật lại theo QĐ-2026-08-27-01) dựng lại production từ
// origin/main, nơi CHƯA có 5 giá trị enum mới của v1.0.19. Sau khi _retype-attractions.mjs
// chạy, main render nhãn bằng chuỗi mã máy ("craft-village", "island") ngay trên huy hiệu
// hero mà khách nhìn thấy. Thứ tự đúng là MÃ lên main trước, DỮ LIỆU sau.
import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { config as dotenv } from 'dotenv'

// dotenv PHẢI chạy trước createClient — nếu không, token là undefined và truy vấn
// trả về rỗng trong im lặng, khiến script báo "0 bản ghi" như thể không có gì để làm.
dotenv({ path: '../.env', quiet: true })

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2026-06-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
  perspective: 'raw',
})

const BACKUP = '../backups/backup-2026-08-27-07-42.ndjson'

const backup = new Map()
for (const line of readFileSync(BACKUP, 'utf8').split('\n').filter(Boolean)) {
  const d = JSON.parse(line)
  if (d._type === 'attraction') backup.set(d._id, d.attractionType)
}

const now = await client.fetch('*[_type=="attraction"]{_id, "t": title.vi, attractionType}')
console.log(`Doc trong ban sao luu: ${backup.size} · doc doc duoc tu dataset: ${now.length}`)
if (now.length === 0) throw new Error('Truy van tra ve rong — kiem tra token truoc khi ket luan la khong co gi de hoan nguyen')
let n = 0
for (const d of now) {
  if (!backup.has(d._id)) continue
  const was = backup.get(d._id)
  // GROQ trả null cho field không tồn tại, còn bản sao lưu thì vắng hẳn key (undefined).
  // So sánh thẳng bằng === sẽ coi hai thứ này là khác nhau và patch lại vô hạn.
  const norm = (v) => (v === undefined || v === null || v === '' ? null : v)
  if (norm(was) === norm(d.attractionType)) continue
  if (norm(was) === null) {
    await client.patch(d._id).unset(['attractionType']).commit()
    console.log(`${d._id}  ${d.attractionType} -> (trong)   ${d.t}`)
  } else {
    await client.patch(d._id).set({ attractionType: was }).commit()
    console.log(`${d._id}  ${d.attractionType} -> ${was}   ${d.t}`)
  }
  n++
}
console.log(`\nHoan nguyen ${n} ban ghi ve trang thai luc 07:42.`)
