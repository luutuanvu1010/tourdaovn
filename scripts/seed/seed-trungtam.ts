// scripts/seed/seed-trungtam.ts
//
// DEPRECATED 2026-07-02:
// Founder đã xóa seed.trung-tam-nha-trang vì node này không còn đúng.
// Không chạy script này để tái tạo Place "Trung tâm Nha Trang"; giữ file chỉ
// như lịch sử seed cũ. Reference stale phải retarget sang seed.nha-trang bằng
// migrate/retarget-contained-in-place.ts.
//
// Seed CỤM TRUNG TÂM Nha Trang vào Sanity (phiên 2026-06-14). Tất cả ở trạng
// thái reviewStatus: 'draft' để founder duyệt tay trong Studio (gate I19).
//
// Cụm gồm 1 Place cha (khu vực Trung tâm Nha Trang) + 5 Attraction bách khoa.
// Cộng với Tháp Bà + Hòn Chồng (đã seed ở seed-sample.ts) tạo thành mạng điểm
// trung tâm/lân cận trên trang. Chiến lược: đào sâu MỘT vùng cho thành cụm thật,
// không rải mỏng (completeness over coverage, CONSTITUTION).
//
// Quy ước (giữ nguyên seed-sample.ts):
// - sameAs đối chiếu Wikidata/Wikipedia THẬT (verify 2026-06-14, xem ghi chú từng entity).
// - KHÔNG set reviewStatus 'approved', KHÔNG set approvedBy (chỉ founder duyệt).
// - contentProvenance: 'ai-t1' (AI sinh, người duyệt).
// - mainImage để trống; founder thêm ảnh có bản quyền + imageProvenance khi duyệt.
// - Chỉ điền field tiếng 'vi'.
// - Token chỉ đọc từ process.env.SANITY_WRITE_TOKEN, không hardcode.
//
// ⚠️ TOẠ ĐỘ GEO: founder chọn "Claude điền, xác nhận sau" (2026-06-14). Toạ độ
// dưới là điểm đại diện lấy từ địa chỉ đã biết qua nghiên cứu web, ĐÁNH DẤU
// [CẦN XÁC NHẬN]. Founder kiểm lại trên Google Maps khi duyệt trong Studio.
//
// Chạy:
//   cd scripts && npm install
//   SANITY_WRITE_TOKEN=<token> npx tsx seed/seed-trungtam.ts
//
// Idempotent: dùng _id ổn định + createOrReplace, chạy lại không nhân đôi.

import { createClient } from '@sanity/client'

// --- Cấu hình client -------------------------------------------------------
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!token) {
  console.error('Thiếu SANITY_WRITE_TOKEN. Chạy: SANITY_WRITE_TOKEN=<token> npx tsx seed/seed-trungtam.ts')
  process.exit(1)
}

if (!process.argv.includes('--allow-deprecated-seed')) {
  console.error('seed-trungtam.ts đã deprecated: không tái tạo seed.trung-tam-nha-trang.')
  console.error('Dùng migrate/retarget-contained-in-place.ts để retarget reference stale sang seed.nha-trang.')
  console.error('Nếu cần khảo cổ dữ liệu cũ, đọc file này như tài liệu lịch sử; không chạy production.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-06-01',
  token,
  useCdn: false,
})

// --- Helper Portable Text --------------------------------------------------
let keyCounter = 0
const k = () => `seedtt${(keyCounter++).toString(36)}`

function block(text: string) {
  return {
    _type: 'block',
    _key: k(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: k(), text, marks: [] }],
  }
}

const geopoint = (lat: number, lng: number) => ({ _type: 'geopoint', lat, lng })
const slug = (current: string) => ({ _type: 'slug', current })

// --- ID ổn định ------------------------------------------------------------
// Tham chiếu sang ID đã có ở seed-sample.ts để nối quan hệ (Nha Trang TD).
const ID = {
  nhaTrang: 'seed.nha-trang',            // đã seed ở seed-sample.ts
  trungTam: 'seed.trung-tam-nha-trang',  // Place cha mới (khu vực)
  longSon: 'seed.chua-long-son',
  nhaThoNui: 'seed.nha-tho-nui',
  haiDuongHoc: 'seed.bao-tang-hai-duong-hoc',
  choDam: 'seed.cho-dam',
  cauDa: 'seed.biet-dien-cau-da',
}

// --- Document --------------------------------------------------------------

// 1) Place (area): Trung tâm Nha Trang — Place cha gom cụm lõi đô thị.
//    Lưu ý thiết kế (ghi DECISIONS): đây là KHU VỰC địa lý gom cụm, KHÔNG phải
//    đơn vị hành chính có thật tên "Trung tâm Nha Trang". placeType='area' đúng
//    nghĩa "khu vực". sameAs trỏ Wikidata Nha Trang (thành phố), không phịa phường.
const trungTam = {
  _id: ID.trungTam,
  _type: 'place',
  title: { vi: 'Trung tâm Nha Trang' },
  slug: { vi: slug('trung-tam-nha-trang') },
  summary: {
    vi: 'Trung tâm Nha Trang là khu vực lõi đô thị ven biển của thành phố, nơi tập trung nhiều điểm tham quan tiêu biểu như chùa Long Sơn, nhà thờ Núi, chợ Đầm và Bảo tàng Hải dương học.',
  },
  placeType: 'area',
  // sameAs: Wikidata + Wikipedia thành phố Nha Trang (verify 2026-06-14).
  sameAs: [
    'https://www.wikidata.org/wiki/Q19491',
    'https://vi.wikipedia.org/wiki/Nha_Trang_(thành_phố)',
  ],
  geo: geopoint(12.2388, 109.1967), // [CẦN XÁC NHẬN] điểm đại diện lõi đô thị (quanh quảng trường 2/4)
  containedInPlace: { _type: 'reference', _ref: ID.nhaTrang },
  body: [
    block(
      'Khu vực trung tâm Nha Trang trải dọc bờ biển và hai bên trục đường Trần Phú, là nơi tập trung phần lớn hoạt động du lịch, mua sắm và các công trình văn hóa của thành phố.',
    ),
    block(
      'Trong bán kính đi bộ hoặc vài phút di chuyển từ trung tâm có thể tới chùa Long Sơn dưới chân đồi Trại Thủy, nhà thờ Chánh tòa Kitô Vua trên núi Bông, chợ Đầm tròn và Bảo tàng Hải dương học ở khu Cầu Đá.',
    ),
  ],
  reviewStatus: 'draft',
  contentProvenance: 'ai-t1',
}

// 2) Attraction (temple): chùa Long Sơn
//    sameAs: Wikidata Q2277986 + Wikipedia vi (verify 2026-06-14).
const longSon = {
  _id: ID.longSon,
  _type: 'attraction',
  title: { vi: 'Chùa Long Sơn' },
  slug: { vi: slug('chua-long-son') },
  summary: {
    vi: 'Ngôi chùa hơn trăm tuổi dưới chân đồi Trại Thủy, nổi tiếng với tượng Phật trắng ngồi lộ thiên cao 14 mét và 193 bậc đá dẫn lên đỉnh.',
  },
  attractionType: 'temple',
  sameAs: [
    'https://www.wikidata.org/wiki/Q2277986',
    'https://vi.wikipedia.org/wiki/Chùa_Long_Sơn_(Nha_Trang)',
  ],
  geo: geopoint(12.2526, 109.1817), // [CẦN XÁC NHẬN] 22 đường 23 Tháng 10, P. Phương Sơn cũ
  address: { ward: 'Bắc Nha Trang' }, // P. Phương Sơn cũ nay thuộc phường Bắc Nha Trang (I15) [CẦN XÁC NHẬN]
  containedInPlace: { _type: 'reference', _ref: ID.trungTam },
  isAccessibleForFree: true,
  body: [
    block(
      'Chùa Long Sơn nằm ở số 22 đường 23 Tháng 10, dưới chân đồi Trại Thủy. Chùa lập năm 1886, ban đầu mang tên Đằng Long Tự, do nhà sư Thích Ngộ Trí dựng. Sau một trận bão, chùa được dời và xây lại ở vị trí hiện nay, đến năm 1940 thì trùng tu thành quy mô lớn.',
    ),
    block(
      'Điểm được biết đến nhiều nhất là tượng Kim Thân Phật Tổ ngồi lộ thiên trên đỉnh đồi, hoàn thành năm 1963. Tượng cao 14 mét, đặt trên đài sen cao 7 mét, từng được ghi nhận là tượng Phật ngoài trời lớn nhất Việt Nam. Để lên tới tượng, khách leo 193 bậc đá; dọc đường có tượng Phật nhập Niết bàn và tầm nhìn bao quát thành phố.',
    ),
    block(
      'Chùa còn là một trung tâm Phật giáo của tỉnh, gắn với phong trào chấn hưng Phật giáo ở miền Trung đầu thế kỷ 20.',
    ),
  ],
  highlights: [
    'Tượng Phật trắng lộ thiên cao 14 mét trên đỉnh đồi Trại Thủy',
    '193 bậc đá dẫn lên, có tượng Phật nhập Niết bàn dọc đường',
    'Một trong những ngôi chùa cổ và lớn nhất Khánh Hòa, lập từ năm 1886',
  ],
  reviewStatus: 'draft',
  contentProvenance: 'ai-t1',
}

// 3) Attraction (church): nhà thờ Núi (Chánh tòa Kitô Vua)
//    sameAs: Wikidata Q2942901 + Wikipedia vi (verify 2026-06-14).
const nhaThoNui = {
  _id: ID.nhaThoNui,
  _type: 'attraction',
  title: { vi: 'Nhà thờ Núi (Chánh tòa Kitô Vua)' },
  slug: { vi: slug('nha-tho-nui') },
  summary: {
    vi: 'Nhà thờ Công giáo theo lối Gothic xây bằng đá trên núi Bông giữa trung tâm Nha Trang, khởi công năm 1928 và hoàn thành năm 1941, tên chính thức là nhà thờ chính tòa Kitô Vua.',
  },
  attractionType: 'church',
  sameAs: [
    'https://www.wikidata.org/wiki/Q2942901',
    'https://vi.wikipedia.org/wiki/Nhà_thờ_Núi_Nha_Trang',
  ],
  geo: geopoint(12.2447, 109.1899), // [CẦN XÁC NHẬN] số 1 Thái Nguyên, khu Ngã Sáu
  address: { street: '1 Thái Nguyên', ward: 'Nha Trang' }, // [CẦN XÁC NHẬN phường hiện hành]
  containedInPlace: { _type: 'reference', _ref: ID.trungTam },
  isAccessibleForFree: true,
  body: [
    block(
      'Nhà thờ Núi, tên chính thức là nhà thờ chính tòa Kitô Vua, là nhà thờ Công giáo ở số 1 đường Thái Nguyên. Công trình còn được gọi quen là nhà thờ Đá vì xây bằng đá, hay nhà thờ Ngã Sáu theo vị trí.',
    ),
    block(
      'Nhà thờ khởi công ngày 3 tháng 9 năm 1928 trên một mỏm núi nhỏ tên núi Bông; để tạo mặt bằng, người ta dùng khoảng 500 trái mìn hạ đỉnh núi. Công trình hoàn thành tháng 12 năm 1941, xây bằng hơn 22.000 viên đá, chiều cao từ móng đến đỉnh tháp khoảng 28 mét. Năm 1933, nhà thờ được cung hiến với tước hiệu Chúa Kitô Vua.',
    ),
  ],
  highlights: [
    'Kiến trúc Gothic xây hoàn toàn bằng đá, khánh thành thập niên 1930',
    'Tọa lạc trên núi Bông, cao hơn mặt phố khoảng 12 mét',
    'Tháp chuông cao khoảng 28 mét, điểm nhận diện của trung tâm thành phố',
  ],
  reviewStatus: 'draft',
  contentProvenance: 'ai-t1',
}

// 4) Attraction (museum): Bảo tàng Hải dương học (Viện Hải dương học)
//    sameAs: Wikidata Q7023323 + Wikipedia vi (verify 2026-06-14).
const haiDuongHoc = {
  _id: ID.haiDuongHoc,
  _type: 'attraction',
  title: { vi: 'Bảo tàng Hải dương học' },
  slug: { vi: slug('bao-tang-hai-duong-hoc') },
  summary: {
    vi: 'Bảo tàng thuộc Viện Hải dương học ở khu Cầu Đá, thành lập thời Pháp năm 1922, trưng bày hàng nghìn mẫu vật và sinh vật biển sống, là trung tâm nghiên cứu biển lớn của Việt Nam.',
  },
  attractionType: 'museum',
  sameAs: [
    'https://www.wikidata.org/wiki/Q7023323',
    'https://vi.wikipedia.org/wiki/Viện_Hải_dương_học',
  ],
  geo: geopoint(12.2058, 109.2178), // [CẦN XÁC NHẬN] số 1 Cầu Đá, gần cảng Cầu Đá
  address: { street: '1 Cầu Đá', ward: 'Nha Trang' }, // [CẦN XÁC NHẬN phường hiện hành]
  containedInPlace: { _type: 'reference', _ref: ID.trungTam },
  body: [
    block(
      'Bảo tàng Hải dương học là bộ phận trưng bày của Viện Hải dương học, đặt tại số 1 Cầu Đá, gần cảng Cầu Đá ở phía nam Nha Trang. Viện thành lập ngày 14 tháng 9 năm 1922 dưới thời Pháp, ban đầu là Sở Hải dương học nghề cá Đông Dương.',
    ),
    block(
      'Bảo tàng lưu giữ hơn 24.000 mẫu vật của hơn 4.000 loài sinh vật biển và nước ngọt, cùng nhiều bể nuôi sinh vật sống. Đây được xem là một trong những trung tâm nghiên cứu và lưu giữ về biển lớn nhất Đông Nam Á.',
    ),
  ],
  highlights: [
    'Viện nghiên cứu biển lâu đời, thành lập năm 1922',
    'Hơn 24.000 mẫu vật của hơn 4.000 loài sinh vật biển và nước ngọt',
    'Khu bể nuôi sinh vật biển sống và bộ xương cá voi lớn',
  ],
  reviewStatus: 'draft',
  contentProvenance: 'ai-t1',
}

// 5) Attraction (market): chợ Đầm
//    Nhóm venue thương mại nhưng CÓ danh tính bách khoa (Wikipedia vi). Founder
//    chốt (2026-06-14): xếp 'market', điền cả sameAs LẪN geo+address phủ hai gate.
//    officialSource (trang ban quản lý chợ) chưa có → PHIẾU NỢ, founder bổ sung khi duyệt.
const choDam = {
  _id: ID.choDam,
  _type: 'attraction',
  title: { vi: 'Chợ Đầm' },
  slug: { vi: slug('cho-dam') },
  summary: {
    vi: 'Khu chợ trung tâm lâu đời của Nha Trang bên cửa sông Cái, nổi bật với tòa chợ Đầm tròn hình hoa sen, là biểu tượng mua sắm và văn hóa của thành phố.',
  },
  attractionType: 'market',
  sameAs: ['https://vi.wikipedia.org/wiki/Chợ_Đầm'],
  geo: geopoint(12.2497, 109.1922), // [CẦN XÁC NHẬN] khu cửa sông Cái, gần cầu Hà Ra
  address: { ward: 'Nha Trang' }, // [CẦN XÁC NHẬN phường hiện hành]
  // officialSource: TODO — trang ban quản lý chợ chưa tìm được (phiếu nợ gate venue)
  containedInPlace: { _type: 'reference', _ref: ID.trungTam },
  body: [
    block(
      'Chợ Đầm là khu chợ trung tâm và lâu đời của Nha Trang, hình thành từ đầu thế kỷ 20 trên một vùng đầm cũ ăn thông ra cửa sông Cái, dưới chân cầu Hà Ra. Tên gọi chợ Đầm bắt nguồn từ địa thế đầm lầy ban đầu.',
    ),
    block(
      'Tòa chợ tròn đặc trưng được xây theo đồ án của kiến trúc sư Lê Quý Phong từ giữa thập niên 1960, mái xếp hình hoa sen đường kính hơn 60 mét. Nếu Hà Nội có chợ Đồng Xuân, Sài Gòn có chợ Bến Thành thì Nha Trang gắn với chợ Đầm.',
    ),
  ],
  highlights: [
    'Tòa chợ tròn hình hoa sen, kiến trúc đặc trưng từ thập niên 1960',
    'Chợ trung tâm lâu đời nhất Nha Trang, gắn với cửa sông Cái',
    'Điểm mua đặc sản, hải sản khô và đồ lưu niệm',
  ],
  reviewStatus: 'draft',
  contentProvenance: 'ai-t1',
}

// 6) Attraction (historic): Biệt điện Cầu Đá (lầu Bảo Đại)
//    sameAs: Wikipedia vi (verify 2026-06-14; chưa thấy Q-item riêng, Wikipedia đủ gate I2).
const cauDa = {
  _id: ID.cauDa,
  _type: 'attraction',
  title: { vi: 'Biệt điện Cầu Đá (lầu Bảo Đại)' },
  slug: { vi: slug('biet-dien-cau-da') },
  summary: {
    vi: 'Cụm năm biệt thự Pháp xây năm 1923 trên đồi Cảnh Long sát vịnh Nha Trang, gắn với vua Bảo Đại và hoàng hậu Nam Phương, được xếp hạng di tích và mở lại đón khách năm 2026.',
  },
  attractionType: 'historic',
  sameAs: ['https://vi.wikipedia.org/wiki/Biệt_điện_Cầu_Đá'],
  geo: geopoint(12.2065, 109.2200), // [CẦN XÁC NHẬN] đồi Cảnh Long, khu Cầu Đá, P. Vĩnh Nguyên cũ
  address: { ward: 'Nha Trang' }, // P. Vĩnh Nguyên cũ [CẦN XÁC NHẬN phường hiện hành]
  containedInPlace: { _type: 'reference', _ref: ID.trungTam },
  body: [
    block(
      'Biệt điện Cầu Đá, quen gọi là lầu Bảo Đại, là cụm năm biệt thự mang tên Xương Rồng, Bông Sứ, Bông Giấy, Phượng Vĩ và Cây Bàng, do người Pháp xây năm 1923 trên đồi Cảnh Long ở khu Cầu Đá, nhìn ra vịnh Nha Trang.',
    ),
    block(
      'Giai đoạn 1940 đến 1945, vua Bảo Đại và hoàng hậu Nam Phương thường lui tới nghỉ tại đây, từ đó cụm biệt thự mang tên lầu Bảo Đại. Tháng 10 năm 1995, di tích được xếp hạng là di tích lịch sử văn hóa và danh thắng. Sau nhiều năm trùng tu, di tích mở cửa đón khách trở lại từ tháng 4 năm 2026.',
    ),
  ],
  highlights: [
    'Cụm năm biệt thự Pháp xây năm 1923 trên đồi sát biển',
    'Gắn với vua Bảo Đại và hoàng hậu Nam Phương thập niên 1940',
    'Di tích xếp hạng năm 1995, mở lại đón khách năm 2026',
  ],
  reviewStatus: 'draft',
  contentProvenance: 'ai-t1',
}

// --- Chạy seed (đúng thứ tự phụ thuộc reference) ---------------------------
async function run() {
  console.log(`Seed CỤM TRUNG TÂM vào project=${projectId} dataset=${dataset}`)

  // Thứ tự: Place cha trước (các Attraction trỏ containedInPlace tới nó).
  // Nha Trang TD đã seed ở seed-sample.ts; nếu chưa có, chạy seed-sample.ts trước.
  const docs: Array<Record<string, unknown> & { _id: string; _type: string }> = [
    trungTam,
    longSon,
    nhaThoNui,
    haiDuongHoc,
    choDam,
    cauDa,
  ]
  for (const doc of docs) {
    const res = await client.createOrReplace(doc)
    console.log(`  ✓ ${res._type} ${res._id} (reviewStatus=${(res as any).reviewStatus})`)
  }

  // Verify: đếm cụm trong kho
  const ids = [ID.trungTam, ID.longSon, ID.nhaThoNui, ID.haiDuongHoc, ID.choDam, ID.cauDa]
  const count = await client.fetch(
    'count(*[_type in ["place","attraction"] && _id in $ids])',
    { ids },
  )
  console.log(`Verify: ${count} document cụm trung tâm có trong kho (kỳ vọng 6).`)

  // Cảnh báo: kiểm tham chiếu Nha Trang TD tồn tại (Place cha trỏ tới)
  const tdExists = await client.fetch('count(*[_id == $id])', { id: ID.nhaTrang })
  if (!tdExists) {
    console.warn(
      `⚠️  Chưa thấy ${ID.nhaTrang} (TouristDestination Nha Trang). ` +
      `Chạy seed-sample.ts trước để Place cha có nơi trỏ containedInPlace.`,
    )
  }
}

run().catch((err) => {
  console.error('Seed thất bại:', err.message)
  process.exit(1)
})
