#!/usr/bin/env npx tsx
// Điền tối thiểu title/slug/summary 5 ngôn ngữ cho các draft N5 đã sạch gate nội dung.
// Không gọi provider dịch ngoài. Mặc định dry-run; thêm --execute mới ghi Sanity.

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
const sharedSlug = (vi: string, en = vi) => ({
  en: slug(en),
  zh: slug(vi),
  ko: slug(vi),
  ru: slug(vi),
})

const patches: Record<string, Record<string, any>> = {
  'drafts.seed.banh-canh-cha-ca': {
    title: {
      en: 'Fish cake banh canh noodle soup',
      zh: '鱼饼越南粗米粉汤',
      ko: '어묵 반깐 국수',
      ru: 'Бань кань с рыбной котлетой',
    },
    slug: sharedSlug('banh-canh-cha-ca', 'fish-cake-banh-canh-noodle-soup'),
    summary: {
      en: 'Fish cake banh canh is a Nha Trang specialty with chewy rice or tapioca noodles, a clear fish-bone broth, and fragrant fish cakes. It is usually served hot with herbs, chili, and lime.',
      zh: '鱼饼越南粗米粉汤是芽庄特色小吃，使用有嚼劲的米粉或木薯粉条，配清甜鱼骨汤和香味浓郁的鱼饼，通常搭配香草、辣椒和青柠食用。',
      ko: '어묵 반깐 국수는 쫄깃한 쌀 또는 타피오카 면, 맑은 생선 육수, 향긋한 어묵이 어우러진 나트랑 특산 음식입니다. 보통 허브, 고추, 라임과 함께 따뜻하게 먹습니다.',
      ru: 'Бань кань с рыбной котлетой — фирменное блюдо Нячанга с упругой рисовой или тапиоковой лапшой, прозрачным рыбным бульоном и ароматными рыбными котлетами. Обычно подается горячим с зеленью, чили и лаймом.',
    },
  },
  'drafts.seed.bun-sua': {
    title: {
      en: 'Jellyfish noodle soup',
      zh: '海蜇米粉汤',
      ko: '해파리 쌀국수',
      ru: 'Рисовая лапша с медузой',
    },
    slug: sharedSlug('bun-sua', 'jellyfish-noodle-soup'),
    summary: {
      en: 'Jellyfish noodle soup is a coastal Central Vietnam dish popular in Khanh Hoa. Fresh crunchy jellyfish is served with rice noodles, light broth, herbs, and vegetables for a clean seafood flavor.',
      zh: '海蜇米粉汤是越南中部沿海常见的菜肴，在庆和一带很受欢迎。新鲜爽脆的海蜇配米粉、清汤、香草和蔬菜，海味清爽。',
      ko: '해파리 쌀국수는 카인호아 지역에서 인기 있는 베트남 중부 해안 음식입니다. 신선하고 아삭한 해파리를 쌀국수, 맑은 육수, 허브와 채소와 함께 즐깁니다.',
      ru: 'Рисовая лапша с медузой — прибрежное блюдо Центрального Вьетнама, популярное в Кханьхоа. Хрустящую свежую медузу подают с рисовой лапшой, легким бульоном, зеленью и овощами.',
    },
  },
  'drafts.seed.costa-seafood': {
    title: {
      en: 'Costa Seafood',
      zh: 'Costa Seafood 海鲜餐厅',
      ko: '코스타 씨푸드',
      ru: 'Costa Seafood',
    },
    slug: sharedSlug('costa-seafood'),
    summary: {
      en: 'Costa Seafood is an upscale seafood restaurant in The Costa Nha Trang complex, serving local and imported seafood in a modern seaside setting near Tran Phu Street.',
      zh: 'Costa Seafood 位于 The Costa Nha Trang 综合体内，是一家高端海鲜餐厅，供应本地和进口海鲜，空间现代，靠近陈富街海滨。',
      ko: '코스타 씨푸드는 더 코스타 나트랑 단지에 있는 고급 해산물 레스토랑으로, 쩐푸 거리 해변 근처의 현대적인 공간에서 현지 및 수입 해산물을 제공합니다.',
      ru: 'Costa Seafood — ресторан морепродуктов высокого уровня в комплексе The Costa Nha Trang, где подают местные и импортные морепродукты в современной обстановке у моря рядом с улицей Чан Фу.',
    },
  },
  'drafts.seed.intercontinental-nha-trang': {
    title: {
      en: 'InterContinental Nha Trang',
      zh: '芽庄洲际酒店',
      ko: '인터컨티넨탈 나트랑',
      ru: 'InterContinental Нячанг',
    },
    slug: sharedSlug('intercontinental-nha-trang'),
    summary: {
      en: 'InterContinental Nha Trang is a luxury beachfront hotel in central Nha Trang, combining international service standards with views over the bay and easy access to Tran Phu Street.',
      zh: '芽庄洲际酒店是位于芽庄中心的海滨豪华酒店，提供国际标准服务，可欣赏海湾景色，并方便前往陈富街。',
      ko: '인터컨티넨탈 나트랑은 나트랑 중심부 해변에 자리한 럭셔리 호텔로, 국제적인 서비스와 만 전망, 쩐푸 거리 접근성을 함께 제공합니다.',
      ru: 'InterContinental Нячанг — роскошный отель у моря в центре Нячанга с международным уровнем сервиса, видами на залив и удобным доступом к улице Чан Фу.',
    },
  },
  'drafts.seed.louisiane-brewhouse-nha-trang': {
    title: {
      en: 'Louisiane Brewhouse Nha Trang',
      zh: '芽庄 Louisiane Brewhouse',
      ko: '루이지애나 브루하우스 나트랑',
      ru: 'Louisiane Brewhouse Нячанг',
    },
    slug: sharedSlug('louisiane-brewhouse-nha-trang'),
    summary: {
      en: 'Louisiane Brewhouse is a beachfront craft brewery and restaurant in Nha Trang, serving house-brewed beer, Asian and Western dishes, plus a relaxed poolside setting with weekend live music.',
      zh: 'Louisiane Brewhouse 是芽庄海滨精酿啤酒餐厅，供应自酿啤酒、亚洲和西式菜肴，并有轻松的泳池空间和周末现场音乐。',
      ko: '루이지애나 브루하우스는 나트랑 해변의 수제맥주 양조장 겸 레스토랑으로, 직접 만든 맥주와 아시아 및 서양 요리, 수영장 분위기와 주말 라이브 음악을 제공합니다.',
      ru: 'Louisiane Brewhouse — прибрежная крафтовая пивоварня и ресторан в Нячанге с собственным пивом, блюдами азиатской и западной кухни, бассейном и живой музыкой по выходным.',
    },
  },
  'drafts.seed.muong-thanh-luxury-nha-trang': {
    title: {
      en: 'Muong Thanh Luxury Nha Trang',
      zh: '芽庄孟清豪华酒店',
      ko: '므엉탄 럭셔리 나트랑',
      ru: 'Muong Thanh Luxury Нячанг',
    },
    slug: sharedSlug('muong-thanh-luxury-nha-trang'),
    summary: {
      en: 'Muong Thanh Luxury Nha Trang is a high-rise hotel on Tran Phu Street facing Nha Trang Bay, with sea-view rooms and convenient access to the central beachfront area.',
      zh: '芽庄孟清豪华酒店位于陈富街，面向芽庄湾，是一座高层酒店，拥有海景客房，前往市中心海滨区域十分方便。',
      ko: '므엉탄 럭셔리 나트랑은 나트랑 만을 마주한 쩐푸 거리의 고층 호텔로, 바다 전망 객실과 중심 해변 접근성이 좋습니다.',
      ru: 'Muong Thanh Luxury Нячанг — высотный отель на улице Чан Фу напротив залива Нячанг, с номерами с видом на море и удобным доступом к центральной набережной.',
    },
  },
  'drafts.seed.novotel-nha-trang': {
    title: {
      en: 'Novotel Nha Trang',
      zh: '芽庄诺富特酒店',
      ko: '노보텔 나트랑',
      ru: 'Novotel Нячанг',
    },
    slug: sharedSlug('novotel-nha-trang'),
    summary: {
      en: 'Novotel Nha Trang is a four-star hotel on Tran Phu Street opposite the beach. Its balcony rooms overlook Nha Trang Bay and suit both leisure and business travelers.',
      zh: '芽庄诺富特酒店是位于陈富街、面向海滩的四星级酒店。带阳台的客房可俯瞰芽庄湾，适合度假和商务旅客。',
      ko: '노보텔 나트랑은 해변 맞은편 쩐푸 거리에 있는 4성급 호텔입니다. 발코니 객실에서 나트랑 만을 바라볼 수 있어 휴양과 비즈니스 여행 모두에 적합합니다.',
      ru: 'Novotel Нячанг — четырехзвездочный отель на улице Чан Фу напротив пляжа. Номера с балконами выходят на залив Нячанг и подходят как для отдыха, так и для деловых поездок.',
    },
  },
  'drafts.seed.sheraton-nha-trang-hotel-spa': {
    title: {
      en: 'Sheraton Nha Trang Hotel & Spa',
      zh: '芽庄喜来登酒店及水疗中心',
      ko: '쉐라톤 나트랑 호텔 앤 스파',
      ru: 'Sheraton Nha Trang Hotel & Spa',
    },
    slug: sharedSlug('sheraton-nha-trang-hotel-spa'),
    summary: {
      en: 'Sheraton Nha Trang Hotel & Spa is a five-star hotel in central Nha Trang with bay-view rooms, dining venues, spa facilities, and easy access to the main beachfront.',
      zh: '芽庄喜来登酒店及水疗中心是位于芽庄中心的五星级酒店，拥有海湾景观客房、餐饮空间、水疗设施，并方便前往主要海滨。',
      ko: '쉐라톤 나트랑 호텔 앤 스파는 나트랑 중심부의 5성급 호텔로, 만 전망 객실, 레스토랑, 스파 시설과 주요 해변 접근성을 갖추고 있습니다.',
      ru: 'Sheraton Nha Trang Hotel & Spa — пятизвездочный отель в центре Нячанга с номерами с видом на залив, ресторанами, спа и удобным доступом к главной набережной.',
    },
  },
  'drafts.seed.vinpearl-resort-nha-trang': {
    title: {
      en: 'Vinpearl Resort Nha Trang',
      zh: '芽庄珍珠岛度假村',
      ko: '빈펄 리조트 나트랑',
      ru: 'Vinpearl Resort Нячанг',
    },
    slug: sharedSlug('vinpearl-resort-nha-trang'),
    summary: {
      en: 'Vinpearl Resort Nha Trang is a five-star resort on Hon Tre Island with a private beach, broad resort facilities, and access to VinWonders Nha Trang and nearby leisure activities.',
      zh: '芽庄珍珠岛度假村位于竹岛，是五星级度假村，拥有私人海滩、多样度假设施，并可方便前往 VinWonders 芽庄及周边休闲项目。',
      ko: '빈펄 리조트 나트랑은 혼째 섬의 5성급 리조트로, 전용 해변과 다양한 리조트 시설, 빈원더스 나트랑 및 주변 레저 활동 접근성을 제공합니다.',
      ru: 'Vinpearl Resort Нячанг — пятизвездочный курорт на острове Хон Тре с частным пляжем, развитой инфраструктурой и доступом к VinWonders Nha Trang и другим развлечениям.',
    },
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

function flattenPatch(input: Record<string, any>, prefix = ''): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(input)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      value._type !== 'slug'
    ) {
      Object.assign(out, flattenPatch(value, path))
    } else {
      out[path] = value
    }
  }
  return out
}

async function main() {
  console.log(`${execute ? 'PATCH' : 'DRY-RUN'} S25 fields for ${Object.keys(patches).length} draft:`)
  for (const id of Object.keys(patches)) console.log(`- ${id}`)
  if (!execute) return

  let tx = client.transaction()
  for (const [id, patch] of Object.entries(patches)) {
    tx = tx.patch(id, p => p.set(flattenPatch(patch)))
  }
  await tx.commit()
  console.log('Đã vá S25 draft.')
}

main().catch(err => {
  console.error('Lỗi patch-n5-s25:', err.message)
  process.exit(1)
})
