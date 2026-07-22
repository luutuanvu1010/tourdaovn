import { createClient } from '@sanity/client'
import { config as dotenv } from 'dotenv'
dotenv({ path: '../.env', quiet: true })
const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2026-06-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false, perspective: 'raw',
})

const NEW_PASTEUR = 'Viện Pasteur đầu tiên thiết lập ở Đông Dương là do Bác sĩ Albert Calmette chủ trương được xây ở Sài Gòn vào Tháng Giêng năm 1891 mang tên "L\'Institut Pasteur de Saigon". Bốn năm sau vào năm 1895 Bác sĩ Alexandre Yersin cho lập thêm chi nhánh nữa ở Nha Trang. Được toàn quyền Đông Dương Chevassieux trợ cấp kinh phí, Yersin lập một phòng thí nghiệm đơn sơ tại bờ biển Nha Trang, và cất tại Suối Dầu một trại nuôi trâu, bò, lừa, ngựa, cùng thỏ, chuột, dùng cho việc thí nghiệm.'

const TOUR_IDS = ['seed.tour-4-dao-nha-trang','seed.tour-dao-binh-ba-1-ngay','seed.tour-hon-mun-lan-bien','seed.tour-suoi-khoang-nong-i-resort','seed.tour-vinpearl-land-nha-trang']

// Hàm: với 1 id, áp lên cả published và drafts. nếu doc không tồn tại thì bỏ qua.
async function forEachVariant(baseId, fn) {
  for (const id of [baseId, `drafts.${baseId}`]) {
    const doc = await client.fetch('*[_id == $id][0]', { id })
    if (doc) await fn(id, doc)
  }
}

let log = []

// --- I8: xóa containedInPlace tự-trỏ của Vịnh ---
await forEachVariant('seed.vinh-nha-trang', async (id) => {
  await client.patch(id).unset(['containedInPlace']).commit()
  log.push(`I8: unset containedInPlace @ ${id}`)
})

// --- I1: sửa text Pasteur (span synth3 trong block synth2) ---
await forEachVariant('seed.vien-pasteur-nha-trang', async (id, doc) => {
  const body = doc.body?.vi
  if (!Array.isArray(body)) { log.push(`I1: ${id} không có body.vi array, bỏ`); return }
  const block = body.find(b => b._key === 'synth2')
  if (!block) { log.push(`I1: ${id} không thấy block synth2`); return }
  const span = block.children?.find(c => c._key === 'synth3')
  if (!span) { log.push(`I1: ${id} không thấy span synth3`); return }
  span.text = NEW_PASTEUR
  await client.patch(id).set({ 'body.vi': body }).commit()
  log.push(`I1: sửa text Pasteur @ ${id}`)
})

// --- I14: unpublish 5 tour (xóa bản published, giữ draft) ---
for (const baseId of TOUR_IDS) {
  const pub = await client.fetch('*[_id == $id][0]', { id: baseId })
  if (!pub) { log.push(`I14: ${baseId} không có published, bỏ`); continue }
  // tạo draft từ published nếu chưa có, rồi xóa published
  const draftId = `drafts.${baseId}`
  const existingDraft = await client.fetch('*[_id == $id][0]', { id: draftId })
  if (!existingDraft) {
    const draftDoc = { ...pub, _id: draftId }
    delete draftDoc._rev
    await client.createIfNotExists(draftDoc)
    log.push(`I14: tạo draft ${draftId} từ published`)
  }
  await client.delete(baseId)
  log.push(`I14: unpublish (xóa published) ${baseId}`)
}

console.log(log.join('\n'))
console.log('\n✅ Xong fix 3 lỗi')
