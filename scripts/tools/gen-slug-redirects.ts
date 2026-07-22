// Sinh public/_redirects (301) khi slug đổi: so snapshot slug cũ (tools/snapshot-slugs.ts)
// với slug hiện tại (ưu tiên DRAFT — slug mới nằm ở draft cho tới khi founder publish).
//
// Format khớp parseRedirects (scripts/validators/r3-r4-post.ts) và sitemap production:
// đường dẫn Unicode thô, không percent-encode, có trailing slash, status 301.
// Segment tra từ ROUTE_MAP (src/lib/routes.ts) — nguồn sự thật duy nhất cho segment.
//
// Cách chạy: npm --prefix scripts run gen:slug-redirects -- --snapshot backups/slugs-<date>.json
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'
import {
  loadNodeDotEnv,
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  SANITY_READ_TOKEN,
} from '../synthesis/config'
import { ENTITY_TYPES } from '../translate/config'
import { ROUTE_MAP } from '../../src/lib/routes'
import type { SlugSnapshotRow } from './snapshot-slugs'

const LANGS = ['vi', 'en', 'zh', 'ko', 'ru'] as const
type SnapLang = (typeof LANGS)[number]

function pathFor(entity: string, lang: SnapLang, slug: string): string | null {
  const seg = ROUTE_MAP.find(r => r.entity === entity)?.segments[lang]
  if (!seg) return null
  const prefix = lang === 'vi' ? '' : `/${lang}`
  return `${prefix}/${seg}/${slug}/`
}

async function main() {
  await loadNodeDotEnv()

  const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), '..')
  const argv = process.argv.slice(2)
  const snapIdx = argv.indexOf('--snapshot')
  if (snapIdx === -1 || !argv[snapIdx + 1]) {
    console.error('Cách dùng: gen:slug-redirects -- --snapshot backups/slugs-<date>.json')
    process.exit(1)
  }
  const snapPath = join(scriptsDir, argv[snapIdx + 1])
  if (!existsSync(snapPath)) {
    console.error(`Không thấy snapshot: ${snapPath}`)
    process.exit(1)
  }
  const snapshot: { rows: SlugSnapshotRow[] } = JSON.parse(readFileSync(snapPath, 'utf-8'))

  // raw perspective để đọc được cả draft lẫn published; ưu tiên draft (slug mới chưa publish)
  const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2026-06-01',
    token: SANITY_READ_TOKEN || undefined,
    useCdn: false,
    perspective: 'raw',
  })
  const docs: any[] = await client.fetch(`*[_type in $types]{ _id, _type, slug }`, {
    types: [...ENTITY_TYPES],
  })
  const currentById = new Map<string, any>()
  for (const doc of docs) {
    const pubId = doc._id.startsWith('drafts.') ? doc._id.slice('drafts.'.length) : doc._id
    const existing = currentById.get(pubId)
    // draft thắng published
    if (!existing || doc._id.startsWith('drafts.')) currentById.set(pubId, doc)
  }

  const lines: string[] = []
  const warnings: string[] = []
  for (const row of snapshot.rows) {
    const current = currentById.get(row._id)
    if (!current) {
      warnings.push(`${row._id} (${row._type}): không còn trong dataset — cần xử lý redirect/410 thủ công`)
      continue
    }
    for (const lang of LANGS) {
      const oldSlug = row.slugs[lang]
      if (!oldSlug) continue
      const newSlug = current.slug?.[lang]?.current
      if (!newSlug) {
        warnings.push(`${row._id} (${row._type}): slug.${lang} biến mất (cũ "${oldSlug}") — R3 sẽ chặn nếu URL từng public`)
        continue
      }
      if (newSlug === oldSlug) continue
      const from = pathFor(row._type, lang, oldSlug)
      const to = pathFor(row._type, lang, newSlug)
      if (!from || !to) {
        warnings.push(`${row._id} (${row._type}): không tra được segment ${lang} trong ROUTE_MAP`)
        continue
      }
      lines.push(`${from} ${to} 301`)
    }
  }

  const repoRoot = join(scriptsDir, '..')
  const redirectsPath = join(repoRoot, 'public', '_redirects')
  const existing = existsSync(redirectsPath) ? readFileSync(redirectsPath, 'utf-8') : ''
  const existingLines = existing.split('\n').map(l => l.trim()).filter(Boolean)
  const byFrom = new Map<string, string>()
  for (const line of existingLines) {
    if (line.startsWith('#')) continue
    const from = line.split(/\s+/)[0]
    byFrom.set(from, line)
  }
  // dòng mới thắng dòng cũ cùng from-path
  for (const line of lines) {
    byFrom.set(line.split(/\s+/)[0], line)
  }

  const header = '# Redirect slug đổi — sinh bởi scripts/tools/gen-slug-redirects.ts, đừng sửa tay khi có thể chạy lại tool'
  const output = [header, ...[...byFrom.values()].sort()].join('\n') + '\n'
  writeFileSync(redirectsPath, output)

  console.log(`Slug đổi: ${lines.length} redirect | tổng dòng trong _redirects: ${byFrom.size}`)
  console.log(`Đã ghi ${redirectsPath}`)
  if (warnings.length) {
    console.log('\nCảnh báo:')
    warnings.forEach(w => console.log(`  - ${w}`))
  }
}

main().catch(err => {
  console.error('Lỗi gen redirects:', err.message)
  process.exit(1)
})
