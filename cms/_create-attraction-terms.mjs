// Tạo bộ term `attraction-type` — tầng NHÃN cho Attraction (01-CONTENT_MODEL §2.13 v1.0.19,
// QĐ-2026-08-27-03, SPEC-2026-08-27-loai-diem-tham-quan §5).
//
// Nhãn KHÁC loại: nhãn đa trị, không quyết @type, không vào gate publish.
// `attractionType` đơn trị, quyết @type, nằm trong gate.
//
// Trang term chỉ mọc khi có ít nhất một Attraction publish trỏ tới (R2), nên chạy script này
// KHÔNG sinh URL nào — nó chỉ tuyển từ vựng trước. Đã kiểm R1: không termCode nào trùng
// slug của 43 Attraction hiện có.
//
// QID do chủ dự án duyệt trong phiên 2026-08-27, tra bằng API Wikidata.
// `diem-check-in` cố ý KHÔNG có sameAs: không có khái niệm Wikidata tương ứng, và §5.1 cấm
// phát property rỗng hoặc tự chế — term không có QID thì đơn giản không góp vào additionalType.
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

const W = (q) => `https://www.wikidata.org/wiki/${q}`

const TERMS = [
  { code: 'dao', name: 'Đảo', qid: 'Q23442',
    desc: 'Đảo và hòn ngoài khơi — nơi tới bằng tàu hoặc cano, thường gắn với tắm biển, lặn ngắm san hô.' },
  { code: 'bien', name: 'Biển', qid: 'Q93352',
    desc: 'Bãi biển, vịnh và dải bờ — nơi tắm biển, ngắm cảnh, hoạt động thể thao nước.' },
  { code: 'di-tich-lich-su', name: 'Di tích lịch sử', qid: 'Q1081138',
    desc: 'Công trình và địa điểm mang giá trị lịch sử, kiến trúc hoặc khảo cổ đã được ghi nhận.' },
  { code: 'chua-va-tam-linh', name: 'Chùa & tâm linh', qid: 'Q1370598',
    desc: 'Chùa, nhà thờ, đền và các nơi thờ tự mở cửa cho khách tham quan.' },
  { code: 'cong-vien-khu-vui-choi', name: 'Công viên & khu vui chơi', qid: 'Q194195',
    desc: 'Công viên giải trí, khu trò chơi và công viên công cộng — nơi vui chơi theo nhóm hoặc gia đình.' },
  { code: 'bao-tang-van-hoa', name: 'Bảo tàng & văn hóa', qid: 'Q33506',
    desc: 'Bảo tàng, nhà trưng bày, làng nghề và không gian văn hóa — nơi tìm hiểu chứ không chỉ ngắm.' },
  { code: 'thien-nhien-sinh-thai', name: 'Thiên nhiên & sinh thái', qid: 'Q179049',
    desc: 'Thác, suối, rừng, núi và khu bảo tồn — cảnh quan tự nhiên và du lịch sinh thái.' },
  { code: 'cho-va-am-thuc', name: 'Chợ & ẩm thực', qid: 'Q330284',
    desc: 'Chợ, phố ăn uống và nơi thưởng thức đặc sản địa phương ngay tại chỗ.' },
  { code: 'diem-check-in', name: 'Điểm check-in', qid: null,
    desc: 'Nơi có góc chụp đẹp, cảnh quan hoặc kiến trúc nổi bật để lưu lại hình ảnh chuyến đi.' },
  { code: 'trai-nghiem-du-lich', name: 'Trải nghiệm du lịch', qid: 'Q49389',
    desc: 'Nơi có hoạt động để tham gia — lặn biển, tắm bùn, thể thao nước, tour trong ngày.' },
  { code: 'khu-nghi-duong', name: 'Khu nghỉ dưỡng', qid: 'Q875157',
    desc: 'Khu phức hợp nghỉ dưỡng có lưu trú, ăn uống và tiện ích trong cùng khuôn viên.' },
]

const DRY = process.argv.includes('--dry')
let created = 0
let skipped = 0

for (const t of TERMS) {
  const existing = await client.fetch(
    '*[_type=="category" && termCode.current==$c][0]{_id}', { c: t.code }
  )
  if (existing) { console.log(`[bo qua] ${t.code} — da ton tai (${existing._id})`); skipped++; continue }

  const doc = {
    _type: 'category',
    name: { vi: t.name },
    description: { vi: t.desc },
    inDefinedTermSet: 'attraction-type',
    termCode: { _type: 'slug', current: t.code },
    slug: { _type: 'slug', current: t.code },
    ...(t.qid ? { sameAs: W(t.qid) } : {}),
  }
  console.log(`${DRY ? '[thu] ' : ''}tao ${t.code}  "${t.name}"  ${t.qid ? W(t.qid) : '(khong QID)'}`)
  if (!DRY) await client.create(doc)
  created++
}

console.log(`\n${DRY ? 'SE tao' : 'Da tao'}: ${created} term · bo qua: ${skipped}`)
console.log('Trang term chua moc: R2 doi it nhat mot Attraction publish tro toi tung term.')
