#!/usr/bin/env npx tsx
// Khôi phục nhánh vi cho 9 document N5 đã publish sau khi phát hiện S25 thiếu vi.
// Mặc định dry-run; thêm --execute mới ghi Sanity.

import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env'), quiet: true })

const execute = process.argv.includes('--execute')
const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId) {
  console.error('Thiếu SANITY_STUDIO_PROJECT_ID')
  process.exit(1)
}
if (!token) {
  console.error('Thiếu SANITY_WRITE_TOKEN')
  process.exit(1)
}

const slug = (current: string) => ({ _type: 'slug', current })

const patches: Record<string, Record<string, any>> = {
  'seed.banh-canh-cha-ca': {
    'title.vi': 'Bánh canh chả cá',
    'slug.vi': slug('banh-canh-cha-ca'),
    'summary.vi': 'Bánh canh chả cá là đặc sản Nha Trang với sợi bánh canh dai, nước dùng cá thanh ngọt và chả cá thơm. Món thường ăn nóng cùng rau sống, ớt và chanh.',
  },
  'seed.bun-sua': {
    'title.vi': 'Bún sứa',
    'slug.vi': slug('bun-sua'),
    'summary.vi': 'Bún sứa là món ăn miền Trung phổ biến ở Khánh Hòa, dùng sứa tươi giòn với bún, nước lèo nhẹ, rau sống, ớt và chanh.',
  },
  'seed.costa-seafood': {
    'title.vi': 'Costa Seafood Nha Trang',
    'slug.vi': slug('costa-seafood'),
    'summary.vi': 'Costa Seafood là nhà hàng hải sản trong khu phức hợp The Costa Nha Trang, phục vụ hải sản địa phương và nhập khẩu trong không gian hiện đại gần đường Trần Phú.',
  },
  'seed.intercontinental-nha-trang': {
    'title.vi': 'InterContinental Nha Trang',
    'slug.vi': slug('intercontinental-nha-trang'),
    'summary.vi': 'InterContinental Nha Trang là khách sạn sang trọng bên biển ở trung tâm Nha Trang, có tầm nhìn vịnh và vị trí thuận tiện trên đường Trần Phú.',
  },
  'seed.louisiane-brewhouse-nha-trang': {
    'title.vi': 'Louisiane Brewhouse Nha Trang',
    'slug.vi': slug('louisiane-brewhouse-nha-trang'),
    'summary.vi': 'Louisiane Brewhouse là nhà hàng kiêm xưởng bia thủ công bên biển Nha Trang, phục vụ bia ủ tại chỗ, món Á - Âu, hồ bơi và nhạc sống cuối tuần.',
  },
  'seed.muong-thanh-luxury-nha-trang': {
    'title.vi': 'Mường Thanh Luxury Nha Trang',
    'slug.vi': slug('muong-thanh-luxury-nha-trang'),
    'summary.vi': 'Mường Thanh Luxury Nha Trang là khách sạn cao tầng trên đường Trần Phú, hướng ra vịnh Nha Trang, với phòng nhìn biển và nhiều tiện ích nghỉ dưỡng.',
  },
  'seed.novotel-nha-trang': {
    'title.vi': 'Novotel Nha Trang',
    'slug.vi': slug('novotel-nha-trang'),
    'summary.vi': 'Novotel Nha Trang là khách sạn bốn sao trên đường Trần Phú, đối diện bãi biển, có phòng ban công nhìn vịnh và phù hợp cho nghỉ dưỡng lẫn công tác.',
  },
  'seed.sheraton-nha-trang-hotel-spa': {
    'title.vi': 'Sheraton Nha Trang Hotel & Spa',
    'slug.vi': slug('sheraton-nha-trang-hotel-spa'),
    'summary.vi': 'Sheraton Nha Trang Hotel & Spa là khách sạn năm sao ở trung tâm Nha Trang, có phòng nhìn vịnh, nhà hàng, spa và lối tiếp cận thuận tiện ra bãi biển chính.',
  },
  'seed.vinpearl-resort-nha-trang': {
    'title.vi': 'Vinpearl Resort Nha Trang',
    'slug.vi': slug('vinpearl-resort-nha-trang'),
    'summary.vi': 'Vinpearl Resort Nha Trang là khu nghỉ dưỡng năm sao trên đảo Hòn Tre, có bãi biển riêng, nhiều tiện ích nghỉ dưỡng và kết nối thuận tiện tới VinWonders Nha Trang.',
  },
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-06-01',
  token,
  useCdn: false,
  perspective: 'raw',
})

async function main() {
  console.log(`${execute ? 'PATCH' : 'DRY-RUN'} vi fields for ${Object.keys(patches).length} published docs:`)
  for (const id of Object.keys(patches)) console.log(`- ${id}`)
  if (!execute) return

  let tx = client.transaction()
  for (const [id, patch] of Object.entries(patches)) {
    tx = tx.patch(id, p => p.set(patch))
  }
  await tx.commit()
  console.log('Đã khôi phục vi cho published docs.')
}

main().catch(err => {
  console.error('Lỗi patch-n5-live-vi:', err.message)
  process.exit(1)
})
