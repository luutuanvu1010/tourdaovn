// scripts/seed/seed-person.ts
//
// Seed Person tác giả "Khánh Hoà Travel" vào Sanity.
// Đây là Person duy nhất phase 1 — tác giả của mọi Article pillar.
//
// Gate I12 + 2.12: title + slug + summary + bio + mainImage + sameAs ≥1.
// mainImage để trống — founder thêm ảnh chân dung + imageProvenance khi duyệt
// trong Studio. Không có ảnh thì không publish (gate I12).
//
// Quy ước nhất quán với seed-trungtam.ts:
// - reviewStatus: 'draft' — founder duyệt tay trong Studio.
// - contentProvenance: 'human' — tác giả là người thật, không phải AI.
// - Chỉ điền field tiếng 'vi' ở bước này; bản en/zh/ko/ru qua module dịch AI sau.
//
// Chạy:
//   cd scripts && npm install
//   SANITY_WRITE_TOKEN=<token> npx tsx seed/seed-person.ts
//
// Idempotent: dùng _id ổn định + createOrReplace.

import { createClient } from '@sanity/client'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset   = process.env.SANITY_STUDIO_DATASET   || 'production'
const token     = process.env.SANITY_WRITE_TOKEN

if (!token) {
  console.error('Thiếu SANITY_WRITE_TOKEN. Chạy: SANITY_WRITE_TOKEN=<token> npx tsx seed/seed-person.ts')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-06-01',
  token,
  useCdn: false,
})

// --- Helper Portable Text ---------------------------------------------------
let keyCounter = 0
const k = () => `seedp${(keyCounter++).toString(36)}`

function block(text: string) {
  return {
    _type: 'block',
    _key: k(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: k(), text, marks: [] }],
  }
}

// --- ID ổn định -------------------------------------------------------------
export const ID_PERSON = 'seed.khanh-hoa-travel-author'

// --- Document ---------------------------------------------------------------
const person = {
  _id: ID_PERSON,
  _type: 'person',

  // field chung (2.0) — i18n field-level
  title: { vi: 'Khánh Hoà Travel' },
  slug:  { vi: { _type: 'slug', current: 'khanh-hoa-travel' } },

  summary: {
    vi: 'Người viết cẩm nang du lịch bản địa, am hiểu biển đảo và ẩm thực Nha Trang – Khánh Hoà.',
  },

  // field riêng Person (2.12)
  sameAs: [
    'https://www.facebook.com/khanhhoatravelcomvn',
  ],

  jobTitle: { vi: 'Biên tập viên cẩm nang du lịch' },

  knowsAbout: {
    vi: [
      'Du lịch biển đảo Nha Trang',
      'Ẩm thực đặc sản Khánh Hoà',
      'Tham quan di tích lịch sử – văn hoá Nha Trang',
      'Tắm bùn và suối khoáng Nha Trang',
      'Lịch trình du lịch Nha Trang',
    ],
  },

  bio: {
    vi: [
      block(
        'Khánh Hoà Travel là đội ngũ biên tập cẩm nang du lịch bản địa, hoạt động tại Nha Trang – Khánh Hoà. ' +
        'Chúng tôi chuyên viết và kiểm chứng thông tin về các điểm tham quan, đặc sản, lịch trình và trải nghiệm ' +
        'tại vùng biển Nam Trung Bộ, với mục tiêu cung cấp nội dung chính xác và thiết thực cho người đi du lịch.'
      ),
      block(
        'Mọi bài viết được xây dựng từ trải nghiệm thực địa và nguồn tin đáng tin cậy, ' +
        'bao gồm dữ liệu địa lý, lịch sử, và thông tin vận hành cập nhật từ các đơn vị tại chỗ.'
      ),
    ],
  },

  // mainImage: để trống — founder thêm ảnh đại diện + imageProvenance trong Studio
  // Không publish nếu chưa có ảnh (gate I12)

  // quản trị
  reviewStatus:     'draft',
  contentProvenance: 'human',
  // approvedBy: do founder điền trong Studio khi duyệt

  publishedAt: new Date().toISOString(),
}

// --- Chạy -------------------------------------------------------------------
async function run() {
  console.log('Seeding Person: Khánh Hoà Travel...')
  try {
    const res = await client.createOrReplace(person as any)
    console.log(`  ✓ person ${res._id} (reviewStatus=draft)`)
    console.log('')
    console.log('Việc còn lại (founder làm trong Studio):')
    console.log('  1. Thêm ảnh đại diện (mainImage) + điền imageProvenance')
    console.log('  2. Kiểm nội dung bio, sửa nếu cần')
    console.log('  3. Set reviewStatus = approved + approvedBy = tên thật')
    console.log('  4. Publish → webhook tự kích build')
  } catch (err) {
    console.error('Lỗi:', err)
    process.exit(1)
  }
}

run()
