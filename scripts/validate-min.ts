/**
 * Cổng tối thiểu cho starter — 3 kiểm, fail-closed.
 * Bất kỳ FAIL nào -> process.exit(1) -> Cloudflare không deploy.
 * Không nuốt lỗi, không `|| true`. Xem docs/adr/ADR-0002.
 *
 * Hai chế độ (chọn qua tham số CLI):
 *   (mặc định)     pre-build: V2 reference + V3 governance (đọc Sanity). V1 chỉ chạy
 *                  nếu tình cờ đã có dist/, không có thì warn — chưa phải lúc kiểm V1.
 *   --jsonld-only  post-build: chỉ V1 JSON-LD (quét dist/). Bắt buộc phải có dist/;
 *                  không có dist/ = FAIL (build lỗi mới thiếu dist ở bước này).
 *
 * build:ci ghép cả hai: validate:min (pre) -> astro build -> validate:jsonld (post),
 * nên cả 3 kiểm đều fail-closed. Xem package.json và README mục "Cổng".
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { getClient } from './lib/sanity-client'
import { GATE } from './gate.config'

type Doc = Record<string, any>
const fails: string[] = []
const warns: string[] = []

function isRef(v: any): v is { _ref: string } {
  return v && typeof v === 'object' && typeof v._ref === 'string'
}

// ---- V2 reference + V3 governance (đọc Sanity) ----
async function validateData() {
  if (GATE.publishableTypes.length === 0) {
    warns.push('gate.config.ts trống: chưa khai báo publishableTypes. Bỏ qua V2/V3.')
    return
  }

  const client = getClient()
  const docs: Doc[] = await client.fetch('*[_type in $types]', {
    types: GATE.publishableTypes,
  })
  const byId = new Map(docs.map(d => [d._id, d]))

  for (const doc of docs) {
    const type = doc._type
    const id = doc._id

    // V3 governance: chỉ soi doc đã publish (approved). Nháp thì bỏ qua.
    if (doc.reviewStatus !== 'approved') continue

    // V3: field bắt buộc
    for (const field of GATE.requiredFields[type] ?? []) {
      const val = doc[field]
      const empty =
        val == null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0)
      if (empty) {
        fails.push(`V3 governance: ${type}/${id} thiếu field bắt buộc "${field}"`)
      }
    }

    // V2 reference: reference phải deref được, đúng type đích
    for (const rule of GATE.references[type] ?? []) {
      const val = doc[rule.field]
      const refs = Array.isArray(val) ? val : [val]
      for (const r of refs) {
        if (r == null) continue
        if (!isRef(r)) {
          fails.push(`V2 reference: ${type}/${id} field "${rule.field}" không phải reference hợp lệ`)
          continue
        }
        const target = byId.get(r._ref) ?? (await client.fetch('*[_id == $id][0]', { id: r._ref }))
        if (!target) {
          fails.push(`V2 reference: ${type}/${id} field "${rule.field}" trỏ tới _id không tồn tại (${r._ref})`)
        } else if (rule.to && target._type !== rule.to) {
          fails.push(`V2 reference: ${type}/${id} field "${rule.field}" trỏ sai type (mong ${rule.to}, gặp ${target._type})`)
        }
      }
    }
  }
}

// ---- V1 JSON-LD (quét dist/ nếu có) ----
function walkHtml(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) walkHtml(p, out)
    else if (name.endsWith('.html')) out.push(p)
  }
}

function validateJsonLd(required: boolean) {
  const dist = join(process.cwd(), '..', 'dist')
  if (!existsSync(dist)) {
    if (required) {
      fails.push('V1 JSON-LD: không tìm thấy dist/ ở bước post-build (astro build có thể đã lỗi).')
    } else {
      warns.push('Chưa có dist/: bỏ qua V1 JSON-LD (chạy sau astro build để kiểm chặt).')
    }
    return
  }
  const files: string[] = []
  walkHtml(dist, files)
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

  for (const file of files) {
    const html = readFileSync(file, 'utf8')
    let m: RegExpExecArray | null
    while ((m = re.exec(html))) {
      let data: any
      try {
        data = JSON.parse(m[1])
      } catch {
        fails.push(`V1 JSON-LD: ${file} có block ld+json không parse được`)
        continue
      }
      const blocks = Array.isArray(data) ? data : [data]
      for (const b of blocks) {
        if (!b['@type']) fails.push(`V1 JSON-LD: ${file} có block thiếu @type`)
        for (const [k, v] of Object.entries(b)) {
          if (v === '' || (Array.isArray(v) && v.length === 0)) {
            fails.push(`V1 JSON-LD: ${file} property "${k}" rỗng (schema.org invalid)`)
          }
        }
      }
    }
  }
}

async function main() {
  const jsonLdOnly = process.argv.includes('--jsonld-only')

  if (jsonLdOnly) {
    // Post-build: chỉ V1, và dist/ là bắt buộc.
    validateJsonLd(true)
  } else {
    // Pre-build: V2 + V3; V1 chỉ chạy nếu tình cờ có dist/ (không bắt buộc).
    await validateData()
    validateJsonLd(false)
  }

  const label = jsonLdOnly ? 'validate:jsonld' : 'validate:min'
  for (const w of warns) console.warn('WARN', w)
  if (fails.length) {
    console.error(`\n${label} FAIL (${fails.length}):`)
    for (const f of fails) console.error('  ✗', f)
    process.exit(1)
  }
  console.log(`${label} PASS`)
}

main().catch(err => {
  console.error('validate lỗi khi chạy:', err)
  process.exit(1)
})
