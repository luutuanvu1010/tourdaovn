#!/usr/bin/env npx tsx
// PRECHECK — kiểm gate completeness trên DRAFT trước khi publish.
//
// Vì sao cần: validator CI chỉ enforce trên published (reviewStatus=approved). Nên lỗi gate
// (tour thiếu itinerary, place thiếu containedInPlace, venue thiếu officialSource…) chỉ lộ
// SAU khi publish + build Cloudflare fail. Precheck đẩy phát hiện lên SỚM: trả lời câu
// "nếu publish draft này thì vướng gate nào không?" — chạy trên máy, TRƯỚC khi publish.
//
// Cơ chế (một nguồn luật, P6 — KHÔNG tái tạo logic gate): lấy mọi draft, strip prefix
// "drafts.", GIẢ LẬP reviewStatus="approved", merge vào corpus, rồi chạy LẠI chính bộ
// validator của CI. Chỉ in lỗi liên quan tới draft sắp publish.
//
// Dùng: npm --prefix scripts run precheck
//   hoặc 1 entity: npx tsx precheck-drafts.ts --id seed.tour-4-dao-nha-trang

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import { VALIDATORS, VALIDATOR_LEVELS, type ValidatorResult } from './validators/i1-i19.js'
import { PY_VALIDATORS, PY_VALIDATOR_LEVELS } from './validators/py1-py8.js'
import { loadPrices } from './lib/price-loader.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env'), quiet: true })

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_READ_TOKEN
if (!projectId) { console.error('Thiếu SANITY_STUDIO_PROJECT_ID'); process.exit(1) }

const client = createClient({ projectId, dataset, apiVersion: '2026-06-01', token, useCdn: false, perspective: 'raw' })

const ALL_TYPES = ['touristDestination','place','attraction','experience','restaurant','specialty','hotel','resort','tour','organization','event','article','person','category']
// Giống validate-constraints.ts: các gate cần đủ corpus (quan hệ + cấm), còn lại chạy trên scope approved.
const FULL_CORPUS_VALIDATORS = new Set(['I1','I4','I7','I8','I13','I14','I15','I17','I18','I-FAQ-TYPE'])

const baseId = (id: string) => id.replace(/^drafts\./, '')

async function main() {
  const idArg = process.argv.includes('--id') ? process.argv[process.argv.indexOf('--id') + 1] : null

  const all: any[] = await client.fetch(`*[_type in $types]`, { types: ALL_TYPES })

  // "Sắp publish" = mọi entity CHƯA approved, dù nằm ở namespace nào.
  // Module synthesis ghi id "seed.xxx" (published namespace) NHƯNG reviewStatus=draft —
  // nên KHÔNG thể chỉ lọc theo prefix "drafts.". Phải lọc theo reviewStatus (audit 06-23).
  const pending = all.filter(d => d.reviewStatus !== 'approved' && d._type !== 'category')

  // Corpus mô phỏng SAU PUBLISH: ép mọi pending thành approved (giả lập bấm publish),
  // dedupe theo baseId (draft." thắng bản published cùng base nếu có).
  const simMap = new Map<string, any>()
  for (const d of all) if (d.reviewStatus === 'approved' || d._type === 'category') simMap.set(baseId(d._id), d)
  for (const d of pending) simMap.set(baseId(d._id), { ...d, _id: baseId(d._id), reviewStatus: 'approved' })
  const simCorpus = [...simMap.values()]
  const approvedScope = simCorpus.filter(d => d.reviewStatus === 'approved' || d._type === 'category')

  // Target = entity pending sắp publish (lọc theo --id nếu có).
  // LƯU Ý (vá 2026-06-24): ngoài pending, precheck CÒN báo mọi lỗi FAIL của entity ĐÃ
  // approved+published — vì sửa tay trực tiếp trên published (vd thêm faq trong Studio
  // ra _type:null) tạo lỗi mà CI sẽ chặn, dù entity đó không "sắp publish". Lỗ hổng cũ:
  // chỉ lọc theo target pending → bỏ sót lỗi published (ca dao-binh-ba I-FAQ-TYPE).
  const targets = pending.map(d => baseId(d._id)).filter(bid => !idArg || bid === idArg)
  if (targets.length === 0 && !idArg) {
    console.log('Không có entity chưa-approved. Vẫn kiểm lỗi FAIL trên corpus đã publish (sửa-tay).')
  }

  console.log(`\n🔍 PRECHECK ${targets.length} entity sắp publish + lỗi FAIL trên corpus đã publish\n${'='.repeat(56)}`)

  let prices: Map<string, any>
  try { prices = loadPrices(resolve(__dirname, '..', 'data', 'prices.yaml')) }
  catch (e: any) { console.error(`Không đọc được prices.yaml: ${e.message}`); prices = new Map() }

  const allValidators = { ...VALIDATORS, ...PY_VALIDATORS } as Record<string, (docs: any[], prices: Map<string, any>) => ValidatorResult>
  const allLevels = { ...VALIDATOR_LEVELS, ...PY_VALIDATOR_LEVELS } as Record<string, 'fail' | 'warn'>

  const fails: string[] = []
  const warns: string[] = []

  for (const id of Object.keys(allValidators).sort()) {
    const useFull = FULL_CORPUS_VALIDATORS.has(id) || id.startsWith('PY')
    const input = useFull ? simCorpus : approvedScope
    let res: ValidatorResult
    try { res = allValidators[id](input, prices) } catch { continue }
    if (res.deferred || res.stub || res.passed) continue
    const level = res.level || allLevels[id]
    for (const e of res.errors) {
      const isTarget = targets.some(t => e.includes(t))
      if (level === 'fail') {
        // FAIL: báo HẾT — bất kỳ lỗi fail nào (kể cả entity đã publish sửa tay) đều chặn build.
        // Nếu có --id, vẫn chỉ lỗi của id đó để gọn.
        if (idArg && !isTarget) continue
        fails.push(`[${id}] ${e}`)
      } else {
        // WARN: chỉ báo cho entity sắp publish, tránh nhiễu nợ cũ (PY4/PY5) trên corpus.
        if (!isTarget) continue
        warns.push(`[${id}] ${e}`)
      }
    }
  }

  if (warns.length) {
    console.log(`\n⚠️  ${warns.length} cảnh báo (không chặn build):`)
    warns.forEach(e => console.log(`   ${e}`))
  }

  if (fails.length === 0) {
    console.log(`\n✅ AN TOÀN — ${targets.length} draft publish được, không vướng gate chặn build.\n`)
  } else {
    console.log(`\n⛔ ${fails.length} lỗi SẼ chặn build NẾU publish:`)
    fails.forEach(e => console.log(`   ${e}`))
    console.log(`\n→ Sửa entity trên trong Studio TRƯỚC khi publish, hoặc để nguyên draft.\n`)
    process.exitCode = 1
  }
}

main().catch(err => { console.error('Lỗi precheck:', err.message); process.exit(1) })
