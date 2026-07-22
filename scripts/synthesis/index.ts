#!/usr/bin/env npx tsx
// Usage:
//   npx tsx synthesis/index.ts --dry-run --entity place --name "Hòn Mun" --urls "https://..."
//   npx tsx synthesis/index.ts --live --entity place --name "Hòn Mun" --urls "https://..."

import { loadNodeDotEnv } from './config'
import { KNOWN_ENTITY_TYPES } from './entity-fields'

interface Args {
  dryRun: boolean
  live: boolean
  entity: string
  name: string
  urls: string[]
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, live: false, entity: '', name: '', urls: [] }

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case '--dry-run':
        args.dryRun = true
        break
      case '--live':
        args.live = true
        break
      case '--entity':
        args.entity = argv[++i] || ''
        break
      case '--name':
        args.name = argv[++i] || ''
        break
      case '--urls': {
        const raw = argv[++i] || ''
        args.urls = raw.split(',').map(u => u.trim()).filter(Boolean)
        break
      }
      default:
        break
    }
  }

  return args
}

function validateArgs(args: Args): string | null {
  if (!args.dryRun && !args.live) return 'Cần --dry-run hoặc --live'
  if (!args.entity) return `Cần --entity (${KNOWN_ENTITY_TYPES.join(' | ')})`
  if (!KNOWN_ENTITY_TYPES.includes(args.entity)) return `--entity phải là một trong: ${KNOWN_ENTITY_TYPES.join(', ')}`
  if (!args.name) return 'Cần --name (tên entity)'
  if (args.urls.length === 0) return 'Cần --urls (danh sách URL, cách nhau bằng dấu phẩy)'
  return null
}

async function main() {
  await loadNodeDotEnv()
  const args = parseArgs(process.argv)

  const validationError = validateArgs(args)
  if (validationError) {
    console.error(`Lỗi: ${validationError}`)
    console.error('Cách dùng: npx tsx synthesis/index.ts --dry-run|--live --entity <type> --name "<tên>" --urls "<url1>,<url2>,..."')
    process.exit(1)
  }

  console.log(`\n🔬 Synthesis — ${args.entity} "${args.name}"`)
  console.log(`   Mode: ${args.dryRun ? 'DRY-RUN' : 'LIVE'}`)
  console.log(`   URLs: ${args.urls.join(', ')}\n`)

  const { runSynthesis } = await import('../../src/lib/synth-runner')
  const result = await runSynthesis({
    dryRun: args.dryRun,
    entity: args.entity,
    name: args.name,
    urls: args.urls,
    onLog: (message) => console.log(`  ${message}`),
  })

  if (!result.validator.ok) {
    console.log(`\n  ⛔ VALIDATOR FAIL — ${result.validator.errors.length} lỗi:`)
    result.validator.errors.forEach(e => console.log(`     - ${e}`))
  }
  if (result.validator.warnings.length > 0) {
    console.log(`\n  ⚠️  Validator warnings:`)
    result.validator.warnings.forEach(w => console.log(`     - ${w}`))
  }
  if (result.warnings.length > 0) {
    console.log(`\n  ⚠️  Pipeline warnings:`)
    result.warnings.forEach(w => console.log(`     - ${w}`))
  }

  console.log(`\n  📝 Writer (${args.dryRun ? 'DRY-RUN' : 'LIVE'}):`)
  if (args.dryRun) console.log(JSON.stringify({ _id: result.docId, ...result.mapped }, null, 2))

  console.log(`\n📊 Báo cáo:`)
  console.log(`   Entity: ${args.entity} "${args.name}"`)
  console.log(`   Field đã điền: ${result.fields.filled.join(', ') || '(không có)'}`)
  console.log(`   Field thiếu: ${result.fields.missing.join(', ') || '—'}`)
  console.log(`   Fetch adapter: ${result.report.fetchAdapter}`)
  console.log(`   Credits: ${result.report.credits}`)
  console.log(`   Provider prose: ${result.report.provider ?? '(không)'}`)
  console.log(`   Nguồn geo: ${result.report.geoSource}`)
  console.log(`   Nguồn sameAs: ${result.report.sameAsSource}`)
  console.log(`   Nguồn officialSource: ${result.report.officialSourceSource}`)
  console.log(`   Nguồn address: ${result.report.addressSource}`)
  console.log(`   Nguồn containedInPlace: ${result.report.containedInPlaceSource}`)
  console.log(`   imageCandidate: ${result.report.imageCandidate ?? '(không có)'}`)
  console.log(`   htmlImageCandidate: ${result.report.htmlImageCandidate ?? '(không có)'}`)
  console.log(`   imageCandidates từ HTML: ${result.imageCandidates.length}`)
  result.imageCandidates.slice(0, 3).forEach((image, index) => {
    console.log(`     ${index + 1}. ${image.url}${image.alt ? ` — ${image.alt}` : ''} (${image.source})`)
  })
  console.log(`   Ảnh upload: ${result.report.imageUploadCount}`)
  console.log(`   Gallery upload: ${result.report.galleryImageCount}`)
  console.log(`   Ảnh: ${result.report.imageRef ?? '(không có)'}`)
  console.log(`   Validator: ${result.validator.ok ? 'ĐẠT' : `TRƯỢT (${result.validator.errors.length} lỗi)`}${result.validator.warnings.length > 0 ? ` + ${result.validator.warnings.length} cảnh báo` : ''}`)

  if (result.ok && !args.dryRun) {
    console.log(`   🔗 Studio: https://${process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'}.sanity.studio/structure/${args.entity};${result.docId}`)
  }

  if (!result.ok) {
    console.error(`\n❌ Writer thất bại: ${result.write.error}`)
    process.exit(1)
  }

  console.log(`\n✅ Xong — ${args.dryRun ? 'kiểm JSON phía trên' : `doc ${result.docId}`}`)
}

main().catch((err) => {
  console.error('❌ Lỗi không mong muốn:', err.message)
  process.exit(1)
})
