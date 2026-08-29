// Chuyển Tour.bookingRef.key từ CHUỖI GIÁ ("Người lớn: 850.000 VNĐ | …") thành KHOÁ = slug.vi.
// DR-039, QĐ-2026-08-21-01, kế hoạch docs/plans/2026-08-22-dat-tour.md Task 11.
//
// CHẠY `node _export-backup.mjs` TRƯỚC.
// Thử:   npx sanity exec _migrate-bookingref-keys.mjs --with-user-token -- --dry-run
// Thật:  npx sanity exec _migrate-bookingref-keys.mjs --with-user-token
//
// Cùng khuôn _migrate-hero-footer.mjs: getCliClient() mượn phiên đăng nhập CLI, không token
// nào đi qua file hay dòng lệnh (N10). Chỉ sửa document có key KHÔNG phải slug hợp lệ và có
// slug.vi; chạy lại nhiều lần vô hại. Con số giá KHÔNG ghi vào Sanity (I1) — chúng sang
// data/prices.yaml bằng tay theo bảng trong kế hoạch.
import { getCliClient } from 'sanity/cli'

const dryRun = process.argv.includes('--dry-run')
const client = getCliClient({ apiVersion: '2026-06-01' }).withConfig({ useCdn: false, perspective: 'raw' })

const KEY_RE = /^[a-z0-9-]{1,120}$/
const docs = await client.fetch(`*[_type == "tour" && defined(bookingRef.key)]{ _id, "slug": slug.vi.current, "key": bookingRef.key }`)

let changed = 0
for (const d of docs) {
  if (KEY_RE.test(d.key)) { console.log(`${d._id}: key đã là khoá "${d.key}", bỏ qua`); continue }
  if (!d.slug) { console.log(`${d._id}: ⚠ không có slug.vi, KHÔNG sửa — key cũ: "${d.key}"`); continue }
  console.log(`${d._id}: "${d.key}" → "${d.slug}"${dryRun ? '  (dry-run)' : ''}`)
  if (!dryRun) {
    await client.patch(d._id).set({ 'bookingRef.key': d.slug }).commit()
    changed++
  }
}
console.log(dryRun ? `✅ dry-run xong, sẽ sửa ${docs.filter(d => !KEY_RE.test(d.key) && d.slug).length} document` : `✅ xong, đã sửa ${changed} document`)
