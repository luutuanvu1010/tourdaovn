import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync, mkdirSync } from 'node:fs'
import { config as dotenvConfig } from 'dotenv'
import { fetchAllDocs } from './lib/sanity-client.js'
import { loadNodeDotEnv } from './synthesis/config.js'
import { loadPrices } from './lib/price-loader.js'
import { VALIDATORS, VALIDATOR_LEVELS, type ValidatorResult } from './validators/i1-i19.js'
import { PY_VALIDATORS, PY_VALIDATOR_LEVELS } from './validators/py1-py8.js'
import { R_VALIDATORS, R_VALIDATOR_LEVELS } from './validators/r1-r4.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenvConfig({ path: resolve(__dirname, '..', '.env'), quiet: true })

async function main() {
  await loadNodeDotEnv()
  console.log('=== B8.3 CI Validator — I1–I19 + PY1–PY8 + R1–R4 ===\n')

  // ── Load data ──
  console.log('[load] Đọc dữ liệu từ Sanity...')
  let docs: any[]
  try {
    docs = await fetchAllDocs()
  } catch (err: any) {
    console.error(`[error] Không đọc được dữ liệu Sanity: ${err.message}`)
    console.error('[error] Kiểm tra SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET, SANITY_READ_TOKEN')
    process.exit(1)
  }
  console.log(`[load] ${docs.length} documents (published)\n`)

  // Fail-closed (R3): dataset production có nội dung thật, đọc được 0 document là bất
  // thường — gần như chắc do thiếu/sai SANITY_READ_TOKEN hoặc sai project/dataset (query
  // trả [] chứ không ném lỗi nên try/catch ở trên không bắt). KHÔNG để validator "xanh giả"
  // vì không có gì để kiểm. Đây là tầng chống false-green cho CI khi secret chưa cấp.
  if (docs.length === 0) {
    console.error('[error] Đọc được 0 document từ dataset — bất thường (production có nội dung).')
    console.error('[error] Kiểm SANITY_READ_TOKEN (secret CI), SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET. Fail-closed.')
    process.exit(1)
  }

  // ── Phạm vi reviewStatus (ADR-0008) ──
  // Cổng completeness/chất lượng/publish-meta đánh giá đúng tập "đã publish"
  // = reviewStatus == "approved" (Category miễn, ngoại lệ I19). Renderer frontend
  // đã lọc đúng tập này; validator kéo về cho khớp → 4 lỗi giả của document draft
  // trong published namespace biến mất (audit V4).
  //
  // Validator quan hệ/ref-integrity và điều cấm vẫn thấy ĐỦ corpus gồm document
  // reviewStatus == "draft" (ADR-0008 Quyết định 4): I18 (đếm ref vào Organization
  // kể cả từ Tour/Event/Article draft), I17 (subset whereToTry↔servesSpecialty),
  // cùng họ ref-integrity (I4, I7, I8, I13, I14) và điều cấm hạng cứng (I1 cấm giá,
  // I15 cấm chuỗi địa lý). KHÔNG lọc toàn cục ở fetchAllDocs (ADR-0008 Phương án bị loại).
  const FULL_CORPUS_VALIDATORS = new Set([
    'I1', 'I4', 'I7', 'I8', 'I13', 'I14', 'I15', 'I17', 'I18', 'I-FAQ-TYPE',
  ])
  const publishedDocs = docs.filter(
    (d) => d.reviewStatus === 'approved' || d._type === 'category'
  )
  console.log(`[scope] completeness gate: ${publishedDocs.length} approved (+category); quan hệ/cấm: ${docs.length} đủ corpus\n`)

  console.log('[load] Đọc prices.yaml...')
  const pricesPath = resolve(__dirname, '..', 'data', 'prices.yaml')
  let prices: Map<string, any>
  try {
    prices = loadPrices(pricesPath)
  } catch (err: any) {
    console.error(`[error] Không đọc được prices.yaml: ${err.message}`)
    process.exit(1)
  }
  console.log(`[load] ${prices.size} dòng giá\n`)

  // ── Merge validators ──
  const allValidators: Record<string, (docs: any[], prices: Map<string, any>) => ValidatorResult> = {
    ...VALIDATORS,
    ...PY_VALIDATORS,
    ...R_VALIDATORS,
  }
  const allLevels: Record<string, 'fail' | 'warn'> = {
    ...VALIDATOR_LEVELS,
    ...PY_VALIDATOR_LEVELS,
    ...R_VALIDATOR_LEVELS,
  }

  // ── Run validators ──
  const validatorIds = Object.keys(allValidators).sort()
  let failCount = 0
  let warnCount = 0
  let stubCount = 0
  let deferCount = 0
  // Thu kết quả từng validator để ghi file JSON (badge gate dashboard, không đổi hành vi exit)
  const reportItems: Array<{ id: string; status: string; level?: string; deferred?: string; errorCount?: number; errors?: string[] }> = []

  for (const id of validatorIds) {
    const fn = allValidators[id]
    const dispatchLevel = allLevels[id]
    // Completeness gate (I-validator không thuộc FULL_CORPUS) chạy trên tập approved;
    // còn lại (quan hệ, cấm, và toàn bộ PY giá — ngoài phạm vi W1) thấy đủ corpus.
    const useFullCorpus = FULL_CORPUS_VALIDATORS.has(id) || id.startsWith('PY')
    const inputDocs = useFullCorpus ? docs : publishedDocs
    const result: ValidatorResult = fn(inputDocs, prices)
    const level = result.level || dispatchLevel

    if (result.deferred) {
      deferCount++
      console.log(`[defer] ${id} — enforce ở: ${result.deferred}`)
      reportItems.push({ id, status: 'defer', level, deferred: result.deferred })
      continue
    }

    if (result.stub) {
      stubCount++
      console.log(`[stub] ${id} — chưa kích hoạt (đợt sau)`)
      reportItems.push({ id, status: 'stub' })
      continue
    }

    if (result.passed) {
      console.log(`[pass] ${id}`)
      reportItems.push({ id, status: 'pass' })
    } else {
      const tag = level === 'fail' ? 'FAIL' : 'WARN'
      console.log(`[${tag}] ${id} — ${result.errors.length} lỗi:`)
      for (const err of result.errors) {
        console.log(`       ${err}`)
      }
      if (level === 'fail') failCount++
      else warnCount++
      reportItems.push({ id, status: level === 'fail' ? 'fail' : 'warn', level, errorCount: result.errors.length, errors: result.errors })
    }
  }

  // ── Summary ──
  console.log('\n=== Kết quả ===')
  console.log(`Validator: ${validatorIds.length} (${stubCount} stub, ${deferCount} defer)`)
  console.log(`Pass: ${validatorIds.length - failCount - warnCount - stubCount - deferCount}`)
  if (failCount > 0) console.log(`FAIL: ${failCount}`)
  if (warnCount > 0) console.log(`WARN: ${warnCount}`)

  // ── Ghi file JSON kết quả (badge gate dashboard) ──
  // Không ảnh hưởng exit code; chỉ là ảnh chụp trạng thái gate cho dashboard đọc.
  const passCount = validatorIds.length - failCount - warnCount - stubCount - deferCount
  const report = {
    ranAt: new Date().toISOString(),
    overall: failCount > 0 ? 'fail' : (warnCount > 0 ? 'warn' : 'pass'),
    totals: { total: validatorIds.length, pass: passCount, fail: failCount, warn: warnCount, stub: stubCount, defer: deferCount },
    items: reportItems,
  }
  try {
    const outDir = resolve(__dirname, 'reports')
    mkdirSync(outDir, { recursive: true })
    writeFileSync(resolve(outDir, 'validator-status.json'), JSON.stringify(report, null, 2), 'utf-8')
    console.log(`[report] Ghi scripts/reports/validator-status.json (overall=${report.overall})`)
  } catch (err: any) {
    console.warn(`[report] Không ghi được file kết quả: ${err.message}`)
  }

  if (failCount > 0) {
    console.log('\n[exit] Có validator fail — build dừng (fail-closed).')
    process.exit(1)
  }

  console.log('\n[exit] Tất cả validator fail đạt. Build tiếp tục.')
}

main()
