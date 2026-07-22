// CLI module dịch. --dry-run mặc định bật (R5) — phải --live mới ghi Sanity thật.
import { loadNodeDotEnv } from '../synthesis/config'
import { runBatch } from './batch'
import { TARGET_LANGS } from './config'

interface Args {
  dryRun: boolean
  id?: string
  type?: string
  lang?: string
  field?: string
  forceSlug?: boolean
}

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: true }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--live') out.dryRun = false
    else if (arg === '--dry-run') out.dryRun = true
    else if (arg === '--id') out.id = argv[++i]
    else if (arg === '--type') out.type = argv[++i]
    else if (arg === '--lang') out.lang = argv[++i]
    else if (arg === '--field') out.field = argv[++i]
    else if (arg === '--force-slug') out.forceSlug = true
  }
  return out
}

async function main() {
  await loadNodeDotEnv()
  const args = parseArgs(process.argv.slice(2))

  if (args.lang && !(TARGET_LANGS as readonly string[]).includes(args.lang)) {
    console.error(`Ngôn ngữ không hợp lệ: ${args.lang}. Chỉ nhận: ${TARGET_LANGS.join(', ')}`)
    process.exit(1)
  }

  console.log(`Chế độ: ${args.dryRun ? 'DRY-RUN (không ghi Sanity)' : 'LIVE (ghi thật vào draft)'}`)
  if (args.id) console.log(`Lọc document: ${args.id}`)
  if (args.type) console.log(`Lọc loại: ${args.type}`)
  if (args.lang) console.log(`Lọc ngôn ngữ: ${args.lang}`)
  if (args.field) console.log(`Lọc field: ${args.field}`)
  if (args.forceSlug) console.log('Force-slug: bật (ghi đè slug hiện có)')

  const reports = await runBatch({ dryRun: args.dryRun, id: args.id, type: args.type, lang: args.lang, field: args.field, forceSlug: args.forceSlug })

  let totalFieldsLangs = 0
  let totalFailed = 0
  const providers = new Set<string>()
  let totalWarnings = 0

  for (const r of reports) {
    console.log(`\n— ${r.docId} (${r.type})`)

    if (r.skipped) {
      console.log(`  BỎ QUA: ${r.skipped}`)
      continue
    }

    if (r.fieldsFailed.length > 0) {
      console.log(`  THẤT BẠI ${r.fieldsFailed.length} mục trống (không dịch được): ${r.fieldsFailed.join(', ')}`)
      totalFailed += r.fieldsFailed.length
    }

    if (Object.keys(r.patch).length === 0) {
      if (r.fieldsFailed.length === 0) {
        console.log('  Không có field nào cần dịch (đã đủ ngôn ngữ hoặc vi trống)')
      }
    } else {
      console.log('  Patch (set):')
      console.log(JSON.stringify(r.patch, null, 2))
      console.log(`  Đã ghi draft: ${r.written ? 'có' : 'không (dry-run hoặc lỗi)'}`)
      totalFieldsLangs += Object.keys(r.patch).length
    }

    r.providersUsed.forEach(p => providers.add(p))

    if (r.warnings.length > 0) {
      console.log('  Cảnh báo:')
      r.warnings.forEach(w => console.log(`    - ${w}`))
      totalWarnings += r.warnings.length
    }
  }

  console.log('\n=== Tổng kết ===')
  console.log(`Document xử lý: ${reports.length}`)
  console.log(`Field*ngôn ngữ đã dịch (tổng): ${totalFieldsLangs}`)
  console.log(`Field*ngôn ngữ THẤT BẠI (tổng): ${totalFailed}`)
  console.log(`Provider dùng: ${[...providers].join(', ') || '(không có)'}`)
  console.log(`Cảnh báo: ${totalWarnings}`)

  // Chết toàn phần (có mục trống cần dịch nhưng không dịch được mục nào) → exit 1,
  // để CI/người chạy không nhầm là "đã hết field trống".
  if (totalFailed > 0 && totalFieldsLangs === 0) {
    console.error('\nKẾT LUẬN: dịch thất bại toàn bộ — kiểm tra key provider (DEEPSEEK/OPENAI/ANTHROPIC_API_KEY) và cảnh báo phía trên.')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Lỗi batch:', err.message)
  process.exit(1)
})
