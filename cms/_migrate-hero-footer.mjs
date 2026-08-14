// Chuyển `siteSettings.heroText` (object 5 ngôn ngữ) → `hero.eyebrow` (một tầng).
// QĐ-2026-08-14-03, spec docs/specs/SPEC-2026-08-14-hero-footer-tuy-bien.md §3.7
//
// CHẠY `node cms/_export-backup.mjs` TRƯỚC. Script này bỏ hẳn bốn ngôn ngữ
// en/zh/ko/ru của heroText; bản sao lưu là chỗ duy nhất lấy lại được.
//
// An toàn khi chạy lại nhiều lần: đã có `hero.eyebrow` thì không đè.
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

let changed = 0

for (const id of ['siteSettings', 'drafts.siteSettings']) {
  const doc = await client.fetch('*[_id==$id][0]{_id, heroText, hero}', { id })
  if (!doc) {
    console.log(`${id}: không có document, bỏ qua`)
    continue
  }

  const oldVi = doc.heroText?.vi
  const already = doc.hero?.eyebrow
  const dropped = ['en', 'zh', 'ko', 'ru'].filter((l) => doc.heroText?.[l])

  if (!doc.heroText) {
    console.log(`${id}: không còn heroText, không cần chuyển`)
    continue
  }

  const patch = client.patch(id)

  if (already) {
    console.log(`${id}: hero.eyebrow đã có "${already}" — KHÔNG đè, chỉ gỡ heroText`)
  } else if (oldVi) {
    patch.set({ 'hero.eyebrow': oldVi })
    console.log(`${id}: heroText.vi "${oldVi}" → hero.eyebrow`)
  } else {
    console.log(`${id}: heroText.vi trống, không có gì để chuyển`)
  }

  if (dropped.length) {
    console.log(`${id}: ⚠ BỎ ${dropped.length} ngôn ngữ khác của heroText (${dropped.join(', ')}) — lấy lại từ bản sao lưu nếu cần`)
  }

  patch.unset(['heroText'])
  await patch.commit()
  changed++
}

console.log(changed ? `✅ xong, đã sửa ${changed} document` : '✅ không có gì để sửa')
