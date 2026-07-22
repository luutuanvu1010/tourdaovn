// scripts/migrate/backfill-s25-translations.ts
//
// Backfill bản dịch title/summary/slug còn thiếu cho 4 document đã publish
// (S25-FIVE-LANGUAGE-COVERAGE fail, chặn pre-push 2026-07-07):
//   - place 57137e33 (Hòn Miễu): title + summary en/zh/ko/ru
//   - experience 72d9d53a (Lặn biển Hòn Mun): slug zh/ko
//   - tour bc8ce486 (Hòn Mun - Làng Chài - Mini Beach): summary en/zh/ko/ru + slug ko
//   - attraction seed.mini-beach: title + slug + summary en/zh/ko/ru
//
// Bản dịch do Claude (Anthropic) đảm nhận thay vai provider của module dịch
// (scripts/translate provider chain DeepSeek→OpenAI→Anthropic bất khả dụng:
// DeepSeek HTTP 402 Insufficient Balance, .env không có OPENAI/ANTHROPIC key).
// Cùng tầng tin cậy ai-t1 như module. Quy ước giữ nguyên từ dữ liệu hiện có:
//   - slug ko/zh dùng Latin theo vi (đối chiếu sitemap production: thap-ba-ponagar,
//     cho-dam, hon-mun... đều Latin xuyên ngôn ngữ)
//   - tên riêng đảo: en "Hon X Island", ko transliteration + 섬, ru transliteration
//     (đối chiếu Hòn Mun/Hòn Tằm/Hòn Tre); zh giữ nguyên khi không có tên Hán
//     thông dụng (tiền lệ Hòn Tằm zh = "Hòn Tằm")
//
// Idempotent: chỉ set field đang thiếu (không đè bản dịch đã có).
// Patch cả draft song song (nếu có) để draft publish sau không xoá ngược.
//
// Chạy:
//   cd scripts
//   node --import ./node_modules/tsx/dist/esm/index.mjs migrate/backfill-s25-translations.ts --dry-run
//   node --import ./node_modules/tsx/dist/esm/index.mjs migrate/backfill-s25-translations.ts --live

import { createClient } from '@sanity/client'
import { config as dotenvConfig } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenvConfig({ path: resolve(__dirname, '../..', '.env'), quiet: true })

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const writeToken = process.env.SANITY_WRITE_TOKEN || ''
const readToken = process.env.SANITY_READ_TOKEN || ''
const live = process.argv.includes('--live')
const dryRun = !live

if (live && !writeToken) {
  console.error('Thiếu SANITY_WRITE_TOKEN.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-06-01',
  token: live ? writeToken : writeToken || readToken || undefined,
  useCdn: false,
  perspective: 'raw',
})

type Lang = 'en' | 'zh' | 'ko' | 'ru'
const LANGS: Lang[] = ['en', 'zh', 'ko', 'ru']

interface DocFill {
  id: string
  title?: Partial<Record<Lang, string>>
  summary?: Partial<Record<Lang, string>>
  slug?: Partial<Record<Lang, string>>
}

const FILLS: DocFill[] = [
  {
    id: '57137e33-2618-4144-8bfb-d37d20bea2a6',
    title: {
      en: 'Hon Mieu Island',
      zh: 'Hòn Miễu',
      ko: '혼미에우 섬',
      ru: 'Хон Миеу',
    },
    summary: {
      en: 'Hon Mieu is one of the near-shore islands of Nha Trang Bay, a familiar stop on island-hopping tours thanks to its convenient location and a fishing-village atmosphere that still keeps its everyday charm. The island is also known as Tri Nguyen, home to a coastal community, seafood rafts and well-known stops such as the Fishing Village, Bai Tranh beach, Mini Beach or the Tri Nguyen Aquarium depending on the itinerary.',
      zh: 'Hòn Miễu 是芽庄湾近岸的岛屿之一，凭借便利的位置和保留着日常气息的渔村氛围，常出现在跳岛游行程中。该岛也被称为 Trí Nguyên，这里有沿海居民区、海鲜养殖筏，以及渔村、Bãi Tranh 海滩、Mini Beach 或 Trí Nguyên 水族馆等常见停靠点，具体视行程而定。',
      ko: '혼미에우(Hòn Miễu)는 나트랑 만의 근해 섬 중 하나로, 편리한 위치와 일상적인 정취를 간직한 어촌 분위기 덕분에 섬 투어 일정에 자주 포함됩니다. 이 섬은 찌응우옌(Trí Nguyên)이라는 이름으로도 알려져 있으며, 해안 마을과 해산물 양식 뗏목이 있고 일정에 따라 어촌 마을, 바이짜인(Bãi Tranh) 해변, 미니 비치, 찌응우옌 수족관 같은 친숙한 정차 지점을 둘러볼 수 있습니다.',
      ru: 'Хон Миеу — один из прибрежных островов залива Нячанг, частая остановка в островных турах благодаря удобному расположению и атмосфере рыбацкой деревни, сохранившей повседневный уклад жизни. Остров также известен под названием Чи Нгуен (Trí Nguyên): здесь находятся прибрежный посёлок, плоты с морепродуктами и такие знакомые остановки, как Рыбацкая деревня, пляж Бай Чань, Мини-Бич или аквариум Чи Нгуен — в зависимости от маршрута.',
    },
  },
  {
    id: '72d9d53a-fd42-42c7-8835-2cbf64343e49',
    slug: {
      zh: 'lan-bien-hon-mun',
      ko: 'lan-bien-hon-mun',
    },
  },
  {
    id: 'bc8ce486-840d-417c-a1d1-4f90da02d6bd',
    slug: {
      ko: 'hon-mun-lang-chai-mini-beach',
    },
    summary: {
      en: 'The Nha Trang three-island tour on the Hon Mun – Fishing Village – Mini Beach route is a one-day island excursion, suited to travelers who want to combine sea views, island relaxation and a glimpse of coastal tourism life in Nha Trang.\nThe itinerary is compact and easy to follow, focusing on three main stops: Hon Mun, the Fishing Village and Mini Beach. It is a good fit for solo travelers, families, groups of friends, hotel guests or anyone looking for a light one-day island program.',
      zh: '芽庄三岛游（黑岛–渔村–Mini Beach 线路）是一日海岛观光行程，适合想把海景体验、海岛休憩与探索芽庄海洋旅游生活结合起来的游客。\n行程紧凑、轻松易行，集中于三个主要停靠点：黑岛（Hòn Mun）、渔村和 Mini Beach。适合散客、家庭、朋友结伴、酒店住客，或需要一个轻松一日海岛行程的团体。',
      ko: '혼문 – 어촌 마을 – 미니 비치 코스를 도는 나트랑 3섬 투어는 당일 해양 관광 프로그램으로, 바다 풍경과 섬에서의 휴식, 나트랑 해양 관광의 일상을 함께 경험하고 싶은 여행객에게 적합합니다.\n일정은 간결하고 이동이 쉬우며 혼문, 어촌 마을, 미니 비치 세 곳의 주요 정차 지점에 집중되어 있습니다. 개인 여행객, 가족, 친구 모임, 호텔 투숙객 또는 가벼운 당일 섬 일정이 필요한 단체에게 알맞은 선택입니다.',
      ru: 'Тур по трём островам Нячанга по маршруту Хон Мун – Рыбацкая деревня – Мини-Бич — это однодневная морская экскурсия для тех, кто хочет совместить морские пейзажи, отдых на острове и знакомство с жизнью прибрежного туризма Нячанга.\nМаршрут построен компактно и легко: три основные остановки — Хон Мун, Рыбацкая деревня и Мини-Бич. Подходит для индивидуальных путешественников, семей, компаний друзей, гостей отелей и всех, кому нужна лёгкая однодневная островная программа.',
    },
  },
  {
    id: 'seed.mini-beach',
    title: {
      en: 'Mini Beach',
      zh: '迷你海滩',
      ko: '미니 비치',
      ru: 'Мини-Бич',
    },
    slug: {
      en: 'mini-beach',
      zh: 'mini-beach',
      ko: 'mini-beach',
      ru: 'mini-beach',
    },
    summary: {
      en: 'Mini Beach is a beautiful beach on Hon Mieu Island, part of the Nha Trang Bay sightseeing route. Many visitors compare it to a "miniature Hawaii" thanks to its clear blue water, bright sand, open space and easy-going resort feel. Mini Beach is ideal for travelers who want to swim, rest, take photos and enjoy a less hurried stop on an island tour. It is also a favorite among international visitors for its relaxing atmosphere, simple services and a rather private island feel. On the Hon Mun – Fishing Village – Mini Beach route, this stop usually serves as the relaxing final part of the journey, balancing sightseeing, lunch and beach time.',
      zh: 'Mini Beach（迷你海滩）是位于 Hòn Miễu 岛上的一片美丽海滩，属于芽庄湾观光线路。这里海水清澈、沙滩明亮、空间开阔、度假氛围轻松，被许多游客比作"迷你夏威夷"。Mini Beach 特别适合想要游泳、休息、拍照，并在跳岛行程中享受一个不那么匆忙停靠点的游客。凭借令人放松的氛围、简洁的服务和相对私密的海岛感受，这里也深受国际游客喜爱。在黑岛–渔村–Mini Beach 线路中，这一站通常是行程末段的休闲部分，让旅程在观光、午餐与海边放松之间取得平衡。',
      ko: '미니 비치는 나트랑 만 관광 코스에 속한 혼미에우 섬의 아름다운 해변입니다. 맑고 푸른 바닷물, 밝은 모래사장, 탁 트인 공간과 여유로운 휴양 분위기 덕분에 많은 여행객이 이곳을 "미니 하와이"에 비유합니다. 미니 비치는 해수욕과 휴식, 사진 촬영을 즐기며 섬 투어 일정 중 서두르지 않는 정차 지점을 원하는 여행객에게 특히 알맞습니다. 편안한 분위기와 간결한 서비스, 사적인 느낌의 섬 정취 덕분에 외국인 여행객에게도 인기가 많습니다. 혼문 – 어촌 마을 – 미니 비치 코스에서 이곳은 보통 여정 마지막의 휴양 구간으로, 관광과 점심, 해변 휴식 사이의 균형을 잡아 줍니다.',
      ru: 'Мини-Бич — красивый пляж на острове Хон Миеу, входящий в экскурсионный маршрут по заливу Нячанг. За бирюзовую воду, светлый песок, простор и спокойную курортную атмосферу многие туристы называют его «Гавайями в миниатюре». Мини-Бич особенно подойдёт тем, кто хочет искупаться, отдохнуть, пофотографироваться и сделать менее суетную остановку в островном туре. Это место любят и иностранные гости — за расслабляющую атмосферу, простой сервис и довольно уединённое ощущение острова. На маршруте Хон Мун – Рыбацкая деревня – Мини-Бич эта остановка обычно становится завершающей курортной частью поездки, уравновешивая экскурсии, обед и отдых у моря.',
    },
  },
]

async function fetchWithDraft(id: string): Promise<Record<string, unknown>[]> {
  return client.fetch(`*[_id in [$id, $draftId]]{_id, title, summary, slug}`, { id, draftId: `drafts.${id}` })
}

async function main() {
  console.log('Backfill bản dịch S25 (title/summary/slug)')
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`)

  for (const fill of FILLS) {
    console.log(`\n— ${fill.id}`)
    const docs = await fetchWithDraft(fill.id)
    if (docs.length === 0) { console.log('  SKIP: không tìm thấy document'); continue }

    for (const doc of docs) {
      const set: Record<string, unknown> = {}
      for (const lang of LANGS) {
        const title = (doc.title as Record<string, unknown> | undefined)?.[lang]
        if (fill.title?.[lang] && !title) set[`title.${lang}`] = fill.title[lang]

        const summary = (doc.summary as Record<string, unknown> | undefined)?.[lang]
        if (fill.summary?.[lang] && !summary) set[`summary.${lang}`] = fill.summary[lang]

        const slugCurrent = (doc.slug as Record<string, { current?: string }> | undefined)?.[lang]?.current
        if (fill.slug?.[lang] && !slugCurrent) {
          set[`slug.${lang}`] = { _type: 'slug', current: fill.slug[lang] }
        }
      }
      if (Object.keys(set).length === 0) { console.log(`  OK ${doc._id}: đã đủ, không patch`); continue }
      console.log(`  ${dryRun ? '[DRY-RUN]' : '[LIVE]'} ${doc._id}: set ${Object.keys(set).join(', ')}`)
      if (!dryRun) await client.patch(doc._id as string).set(set).commit()
    }
  }

  console.log(`\nXong (${dryRun ? 'dry-run, chưa ghi gì' : 'đã ghi Sanity'}).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
