// scripts/seed/seed-sample.ts
//
// Seed nội dung mẫu vào Sanity (B8.8.1). Chỉ 4 entity bách khoa, tất cả ở
// trạng thái reviewStatus: 'draft' để founder duyệt tay trong Studio.
//
// Quy ước (xem prompt B8.8.1-STUDIO-SEED.md, ràng buộc R1-R7):
// - sameAs và geo đều là dữ liệu THẬT, đã đối chiếu Wikidata/Wikipedia.
// - KHÔNG set reviewStatus 'approved', KHÔNG set approvedBy (chỉ founder duyệt).
// - contentProvenance: 'ai-t1' (AI sinh, người duyệt).
// - mainImage để trống; founder thêm ảnh có bản quyền khi duyệt.
// - Chỉ điền field tiếng 'vi'.
// - Token chỉ đọc từ process.env.SANITY_WRITE_TOKEN, không hardcode.
//
// Chạy:
//   cd scripts && npm install
//   SANITY_WRITE_TOKEN=<token> npx tsx seed/seed-sample.ts
//
// Idempotent: dùng _id ổn định + createOrReplace, chạy lại không nhân đôi.

import { createClient } from '@sanity/client'

// --- Cấu hình client -------------------------------------------------------
// Project thật: lmgxynxp ("Nha Trang Travel Hub", cli-init 2026-06-07). Token
// write của founder thuộc project này. (3pcbi333 trong .env/memory cũ là sai.)
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!token) {
  console.error('Thiếu SANITY_WRITE_TOKEN. Chạy: SANITY_WRITE_TOKEN=<token> npx tsx seed/seed-sample.ts')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-06-01',
  token,
  useCdn: false,
})

// --- Toạ độ Hòn Chồng do founder cấp (R3: không đoán) ----------------------
// Wikipedia/Wikidata của Hòn Chồng (Q10771161) không có P625. Founder cấp toạ
// độ thật từ nguồn founder tin. Điền lat/lng rồi mới chạy được.
// Founder cấp 2026-06-13 (toạ độ thật, không có trên Wikipedia/Wikidata của entity).
const HON_CHONG_GEO: { lat: number; lng: number } | null = {
  lat: 12.273148776173677,
  lng: 109.20695178557433,
}

// --- Helper Portable Text --------------------------------------------------
let keyCounter = 0
const k = () => `seed${(keyCounter++).toString(36)}`

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
const ID = {
  nhaTrang: 'seed.nha-trang',
  bacNhaTrang: 'seed.bac-nha-trang',
  honChong: 'seed.hon-chong',
  thapBa: 'seed.thap-ba-ponagar',
}

// --- Document --------------------------------------------------------------

// 1) TouristDestination: Nha Trang
const nhaTrang = {
  _id: ID.nhaTrang,
  _type: 'touristDestination',
  title: { vi: 'Nha Trang' },
  slug: { vi: slug('nha-trang') },
  summary: {
    vi: 'Nha Trang là thành phố ven biển, tỉnh lỵ của tỉnh Khánh Hòa ở duyên hải Nam Trung Bộ. Thành phố nổi tiếng với bãi biển, vịnh Nha Trang và là một trung tâm du lịch lớn của Việt Nam.',
  },
  sameAs: [
    'https://www.wikidata.org/wiki/Q19491',
    'https://vi.wikipedia.org/wiki/Nha_Trang_(thành_phố)',
  ],
  geo: geopoint(12.245, 109.192),
  containedInPlaceRef: ['https://www.wikidata.org/wiki/Q33369'], // tỉnh Khánh Hòa (I15)
  body: [
    block(
      'Nha Trang nằm bên bờ vịnh Nha Trang thuộc tỉnh Khánh Hòa, là một trong những trung tâm du lịch biển lớn của Việt Nam. Khí hậu ôn hòa quanh năm cùng bờ biển dài khiến nơi đây thu hút khách trong nước và quốc tế.',
    ),
    block(
      'Với cảnh quan ven biển và nhiều đảo ngoài khơi, Nha Trang được ví là hòn ngọc của Biển Đông. Du lịch và dịch vụ là trụ cột kinh tế của thành phố.',
    ),
  ],
  reviewStatus: 'draft',
  contentProvenance: 'ai-t1',
}

// 2) Place (ward): Bắc Nha Trang — chứa Hòn Chồng và Tháp Bà
const bacNhaTrang = {
  _id: ID.bacNhaTrang,
  _type: 'place',
  title: { vi: 'Bắc Nha Trang' },
  slug: { vi: slug('bac-nha-trang') },
  summary: {
    vi: 'Bắc Nha Trang là phường thuộc tỉnh Khánh Hòa, thành lập ngày 16 tháng 6 năm 2025 trên cơ sở hợp nhất các phường Vĩnh Hòa, Vĩnh Hải, Vĩnh Phước, Vĩnh Thọ và các xã Vĩnh Lương, Vĩnh Phương của thành phố Nha Trang trước đây.',
  },
  placeType: 'ward',
  sameAs: ['https://www.wikidata.org/wiki/Q138636916'],
  geo: geopoint(12.28139, 109.18972),
  containedInPlace: { _type: 'reference', _ref: ID.nhaTrang },
  body: [
    block(
      'Phường Bắc Nha Trang được lập theo sắp xếp đơn vị hành chính năm 2025 của tỉnh Khánh Hòa, gộp địa bàn các phường Vĩnh Hòa, Vĩnh Hải, Vĩnh Phước, Vĩnh Thọ cùng các xã Vĩnh Lương, Vĩnh Phương thuộc thành phố Nha Trang trước đây.',
    ),
    block(
      'Trên địa bàn phường có nhiều điểm tham quan quen thuộc của Nha Trang như khu danh thắng Hòn Chồng và quần thể Tháp Bà Ponagar.',
    ),
  ],
  reviewStatus: 'draft',
  contentProvenance: 'ai-t1',
}

// 3) Place (landform): Hòn Chồng — containedInPlace Bắc Nha Trang
function buildHonChong() {
  if (!HON_CHONG_GEO) {
    throw new Error(
      'Chưa có toạ độ Hòn Chồng. Điền HON_CHONG_GEO (lat/lng thật) ở đầu file rồi chạy lại.',
    )
  }
  return {
    _id: ID.honChong,
    _type: 'place',
    title: { vi: 'Hòn Chồng' },
    slug: { vi: slug('hon-chong') },
    summary: {
      vi: 'Hòn Chồng là cụm đá tự nhiên ven biển ở Nha Trang, tỉnh Khánh Hòa, gồm những khối đá lớn xếp chồng lên nhau ở chân đồi La-san. Đây là một danh thắng quen thuộc nhìn ra vịnh Nha Trang.',
    },
    placeType: 'landform',
    sameAs: ['https://vi.wikipedia.org/wiki/Hòn_Chồng'],
    geo: geopoint(HON_CHONG_GEO.lat, HON_CHONG_GEO.lng),
    containedInPlace: { _type: 'reference', _ref: ID.bacNhaTrang },
    body: [
      block(
        'Hòn Chồng là bãi đá xếp chồng lên nhau một cách tự nhiên bên bờ biển Nha Trang, dưới chân đồi La-san thuộc phường Bắc Nha Trang. Trên khối đá lớn hướng ra biển có vết lõm hình bàn tay gắn với truyền thuyết dân gian về một người khổng lồ.',
      ),
      block(
        'Gần Hòn Chồng còn có cụm đá Hòn Vợ. Từ đây có thể ngắm vịnh Nha Trang cùng các đảo ngoài khơi.',
      ),
    ],
    reviewStatus: 'draft',
    contentProvenance: 'ai-t1',
  }
}

// 4) Attraction (temple): Tháp Bà Ponagar — containedInPlace Bắc Nha Trang (Place parent, I8)
const thapBa = {
  _id: ID.thapBa,
  _type: 'attraction',
  title: { vi: 'Tháp Bà Ponagar' },
  slug: { vi: slug('thap-ba-ponagar') },
  summary: {
    vi: 'Tháp Bà Ponagar là quần thể đền tháp Chăm thờ nữ thần Po Nagar (Thiên Y Thánh Mẫu), nằm trên một ngọn đồi bên cửa sông Cái, phường Bắc Nha Trang, tỉnh Khánh Hòa.',
  },
  attractionType: 'temple',
  sameAs: ['https://vi.wikipedia.org/wiki/Tháp_Po_Nagar'],
  geo: geopoint(12.26528, 109.19556),
  containedInPlace: { _type: 'reference', _ref: ID.bacNhaTrang },
  body: [
    block(
      'Tháp Bà Ponagar là công trình của người Chăm, thờ nữ thần Po Nagar, còn gọi là Thiên Y Thánh Mẫu, gắn với truyền thống Hindu giáo. Quần thể được xây dựng và bồi đắp qua nhiều thế kỷ, với các tháp chính ước định khoảng thế kỷ 10 đến 13.',
    ),
    block(
      'Di tích tọa lạc trên một ngọn đồi nhỏ cao khoảng 10 đến 12 mét bên cửa sông Cái, cách trung tâm Nha Trang khoảng 2 km về phía bắc, nay thuộc phường Bắc Nha Trang.',
    ),
  ],
  reviewStatus: 'draft',
  contentProvenance: 'ai-t1',
}

// --- Chạy seed (đúng thứ tự phụ thuộc reference) ---------------------------
async function run() {
  const honChong = buildHonChong() // throw sớm nếu thiếu geo

  console.log(`Seed vào project=${projectId} dataset=${dataset}`)

  // Thứ tự: TD -> ward -> (landform, attraction). createOrReplace idempotent.
  const docs: Array<Record<string, unknown> & { _id: string; _type: string }> = [
    nhaTrang,
    bacNhaTrang,
    honChong,
    thapBa,
  ]
  for (const doc of docs) {
    const res = await client.createOrReplace(doc)
    console.log(`  ✓ ${res._type} ${res._id} (reviewStatus=${(res as any).reviewStatus})`)
  }

  // Verify: đếm trong kho
  const count = await client.fetch(
    'count(*[_type in ["touristDestination","place","attraction"] && _id in $ids])',
    { ids: Object.values(ID) },
  )
  console.log(`Verify: ${count} document seed có trong kho (kỳ vọng 4).`)
}

run().catch((err) => {
  console.error('Seed thất bại:', err.message)
  process.exit(1)
})
