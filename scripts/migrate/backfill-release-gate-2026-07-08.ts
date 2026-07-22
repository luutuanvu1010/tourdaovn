// scripts/migrate/backfill-release-gate-2026-07-08.ts
//
// Backfill the published Sanity fields currently blocking the release gate:
// - Cam Lam: I15 prose cleanup, missing contentProvenance, missing ko slug.
// - Alma Resort Cam Ranh: missing summary en/zh/ko/ru.
// - Hon Tam Resort: missing title/slug/summary en/zh/ko/ru.
//
// Idempotent: only sets missing fields, plus the explicit I15 summary.vi cleanup
// when the old forbidden wording is still present.
// Also patches a matching draft when present so a later publish does not regress fields.
//
// Run:
//   cd scripts
//   node --import ./node_modules/tsx/dist/esm/index.mjs migrate/backfill-release-gate-2026-07-08.ts --dry-run
//   node --import ./node_modules/tsx/dist/esm/index.mjs migrate/backfill-release-gate-2026-07-08.ts --live

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
  console.error('Thieu SANITY_WRITE_TOKEN.')
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

const slug = (current: string) => ({ _type: 'slug', current })

interface Fill {
  id: string
  title?: Partial<Record<Lang, string>>
  slug?: Partial<Record<Lang, string>>
  summary?: Partial<Record<Lang, string>>
  setIfMissing?: Record<string, unknown>
  replaceIfContains?: Array<{ path: string; contains: string; value: unknown }>
}

const FILLS: Fill[] = [
  {
    id: '2becda43-69c1-4db6-a517-d3c7490f340b',
    slug: { ko: 'cam-lam' },
    setIfMissing: {
      contentProvenance: 'mixed',
    },
    replaceIfContains: [
      {
        path: 'summary.vi',
        contains: 'thành phố Nha Trang',
        value: 'Trước đây Cam Lâm là một huyện ven biển thuộc tỉnh Khánh Hòa, nằm giữa Nha Trang và sân bay quốc tế Cam Ranh. Nơi đây nổi tiếng với Bãi Dài, cảnh quan thiên nhiên hoang sơ Đầm Thủy Triều và là "thủ phủ" của đặc sản xoài',
      },
    ],
  },
  {
    id: 'seed.alma-resort-cam-ranh',
    summary: {
      en: 'Alma Resort Cam Ranh is a five-star resort on the Cam Ranh coast, with open-plan suites and villas overlooking the ocean. The resort offers multi-generational facilities including 12 swimming pools, a water park, spa, and family-friendly entertainment activities.',
      zh: 'Alma Resort Cam Ranh 是位于金兰海岸的五星级度假村，拥有开放式套房和别墅，可欣赏海景。度假村提供适合多代同游的设施，包括 12 个泳池、水上乐园、spa 以及多种家庭娱乐活动。',
      ko: '알마 리조트 캄란은 캄란 해안에 자리한 5성급 리조트로, 바다 전망을 갖춘 개방형 스위트와 빌라를 제공합니다. 리조트에는 12개의 수영장, 워터파크, 스파와 가족 친화적인 엔터테인먼트 시설 등 여러 세대가 함께 즐기기 좋은 편의시설이 있습니다.',
      ru: 'Alma Resort Cam Ranh — пятизвездочный курорт на побережье Камраня с просторными сьютами и виллами с видом на океан. Курорт предлагает инфраструктуру для отдыха нескольких поколений, включая 12 бассейнов, аквапарк, спа и семейные развлечения.',
    },
  },
  {
    id: 'seed.hon-tam-resort',
    title: {
      en: 'Hon Tam Resort',
      zh: 'Hòn Tằm Resort',
      ko: '혼탐 리조트',
      ru: 'Hon Tam Resort',
    },
    slug: {
      en: 'hon-tam-resort',
      zh: 'hon-tam-resort',
      ko: 'hon-tam-resort',
      ru: 'hon-tam-resort',
    },
    summary: {
      en: 'Hon Tam Resort Nha Trang is a resort on Hon Tam Island, known for its natural scenery and refined bungalow and villa architecture. It offers a relaxing body, mind and spirit retreat amid green surroundings, open sea and sky.',
      zh: 'Hòn Tằm Resort Nha Trang 是位于 Hòn Tằm 岛上的度假村，以自然景观和精致的 bungalow、villa 建筑而闻名。这里在绿意、海天之间提供放松身心的度假体验。',
      ko: '혼탐 리조트 나트랑은 혼탐 섬에 자리한 리조트로, 자연 경관과 세련된 방갈로 및 빌라 건축이 돋보입니다. 푸른 자연과 탁 트인 바다, 하늘 사이에서 몸과 마음을 쉬게 하는 휴식 경험을 제공합니다.',
      ru: 'Hon Tam Resort Nha Trang — курорт на острове Хон Там, известный природными пейзажами и изящной архитектурой бунгало и вилл. Здесь можно расслабиться телом и душой среди зелени, моря и открытого неба.',
    },
  },
]

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (value && typeof value === 'object' && 'current' in value) {
    return typeof (value as { current?: unknown }).current === 'string' && Boolean((value as { current?: string }).current?.trim())
  }
  return value !== undefined && value !== null
}

function readPath(obj: Record<string, any>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== 'object') return undefined
    return (acc as Record<string, unknown>)[part]
  }, obj)
}

async function fetchWithDraft(id: string): Promise<Record<string, any>[]> {
  return client.fetch(`*[_id in [$id, $draftId]]{_id, _type, title, slug, summary, contentProvenance}`, {
    id,
    draftId: `drafts.${id}`,
  })
}

async function main() {
  console.log('Backfill release gate 2026-07-08')
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`)

  for (const fill of FILLS) {
    console.log(`\n- ${fill.id}`)
    const docs = await fetchWithDraft(fill.id)
    if (docs.length === 0) {
      console.log('  SKIP: khong tim thay document')
      continue
    }

    for (const doc of docs) {
      const set: Record<string, unknown> = {}
      for (const lang of LANGS) {
        if (fill.title?.[lang] && !hasValue(doc.title?.[lang])) set[`title.${lang}`] = fill.title[lang]
        if (fill.summary?.[lang] && !hasValue(doc.summary?.[lang])) set[`summary.${lang}`] = fill.summary[lang]
        if (fill.slug?.[lang] && !hasValue(doc.slug?.[lang])) set[`slug.${lang}`] = slug(fill.slug[lang])
      }
      for (const [path, value] of Object.entries(fill.setIfMissing ?? {})) {
        if (hasValue(readPath(doc, path))) continue
        set[path] = value
      }
      for (const item of fill.replaceIfContains ?? []) {
        const current = readPath(doc, item.path)
        if (typeof current === 'string' && current.includes(item.contains)) set[item.path] = item.value
      }

      if (Object.keys(set).length === 0) {
        console.log(`  OK ${doc._id}: da du, khong patch`)
        continue
      }

      console.log(`  ${dryRun ? '[DRY-RUN]' : '[LIVE]'} ${doc._id}: set ${Object.keys(set).join(', ')}`)
      if (!dryRun) await client.patch(doc._id as string).set(set).commit()
    }
  }

  console.log(`\nXong (${dryRun ? 'dry-run, chua ghi gi' : 'da ghi Sanity'}).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
