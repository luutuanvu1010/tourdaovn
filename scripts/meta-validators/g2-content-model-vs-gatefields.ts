/**
 * Meta-validator G2: CONTENT_MODEL.md vs shared/gates gateFields.
 *
 * Kiểm P6: hai nguồn sự thật cho cùng một thứ ("field nào bắt buộc trên mỗi entity")
 * có khớp nhau không. CONTENT_MODEL.md §2 là đặc tả canonical; gateFields trong
 * shared/gates/index.ts là enforcement. Nếu hai nguồn lệch, entity sai được publish
 * hoặc entity đúng bị chặn oan.
 *
 * Đây là meta-validator — chạy độc lập, không nằm trong `npm run gate`.
 * Output: báo cáo drift ra console + JSON.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..', '..')
const CONTENT_MODEL_PATH = resolve(REPO_ROOT, 'project', '01-CONTENT_MODEL.md')
const GATE_FIELDS_PATH = resolve(REPO_ROOT, 'shared', 'gates', 'index.ts')
const REPORT_DIR = resolve(REPO_ROOT, 'scripts', 'reports')

// ── Entity name mapping: CONTENT_MODEL section → Sanity _type ──
const ENTITY_NAME_TO_TYPE: Record<string, string> = {
  'TouristDestination': 'touristDestination',
  'Place': 'place',
  'Attraction': 'attraction',
  'Experience': 'experience',
  'Restaurant': 'restaurant',
  'Hotel': 'hotel',
  'Resort': 'resort',
  'Tour': 'tour',
  'Organization': 'organization',
  'Event': 'event',
  'Article': 'article',
  'Person': 'person',
  'Category': 'category',
  'Specialty': 'specialty',
}

interface ParsedGate {
  entityName: string
  entityType: string
  fields: string[]
  conditionals: string[]    // extra conditions mentioned after field list
  sourceLine: string
  sectionName: string
}

interface GateFieldsEntry {
  fields: string[]
  conditional: string | null  // simplified — just check presence, not logic
  conditionalExpression: string
  /** Fields checked inside the conditional expression (extracted from d.xxx patterns) */
  conditionalFields: string[]
  /** Combined: fields + conditionalFields — the full set of fields enforced */
  allEnforcedFields: string[]
}

// ── Step 1: Parse CONTENT_MODEL.md ──

function parseContentModel(): ParsedGate[] {
  const content = readFileSync(CONTENT_MODEL_PATH, 'utf-8')
  const lines = content.split('\n')
  const gates: ParsedGate[] = []

  // Tìm section heading hiện tại để biết entity nào
  let currentSection = ''
  let currentEntityName = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track section headings: ### 2.X EntityName
    const sectionMatch = line.match(/^###\s+2\.\d+\s+(.+)$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim()
      // Extract entity name from heading like "Place (đã audit...)"
      const nameMatch = currentSection.match(/^(\w+)/)
      if (nameMatch) {
        currentEntityName = nameMatch[1]
      }
      continue
    }

    // Check for LodgingBase subsection
    const lodgingMatch = line.match(/^###\s+2\.0b\s+(.+)$/)
    if (lodgingMatch) {
      currentSection = 'LodgingBase'
      currentEntityName = ''
      continue
    }

    // Find "Gate publish" lines
    if (line.includes('Gate publish')) {
      if (currentSection === 'LodgingBase') {
        // LodgingBase gate applies to both Hotel and Resort
        const hotelGate = parseGateLine(line, 'Hotel', currentSection)
        const resortGate = parseGateLine(line, 'Resort', currentSection)
        if (hotelGate) gates.push(hotelGate)
        if (resortGate) gates.push(resortGate)
      } else {
        const parsed = parseGateLine(line, currentEntityName, currentSection)
        if (parsed) {
          gates.push(parsed)
        }
      }
    }
  }

  return gates
}

function parseGateLine(line: string, entityName: string, section: string): ParsedGate | null {
  // Normalize: collapse spaces, remove markdown bold markers
  const clean = line.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()

  // Extract the entity name from the Gate publish context if entityName is empty
  // (for LodgingBase which is shared by Hotel and Resort)
  let resolvedName = entityName

  // Pattern: "Gate publish (I12, I3): title, slug, summary, ..."
  const match = clean.match(/^Gate\s+publish\s*\([^)]+\):\s*(.+)$/)
  if (!match) return null

  const rest = match[1].trim()

  // Parse fields before any conditional separator
  // Split at: cộng, cộng theo, cộng ít nhất
  // But "cộng" may appear in the fieldPart too (Organization: "...officialSource, cộng ít nhất...")
  // So first split by ";", then within fieldPart also split on ", cộng"
  const condSplit = rest.split(/\s*;\s*/)
  let fieldPart = condSplit[0].trim()
  const conditionals = condSplit.slice(1).map(s => s.trim())

  // Also split fieldPart on ", cộng" — this handles Organization-style lines
  const cộngIdx = fieldPart.search(/,\s*cộng\s/)
  if (cộngIdx >= 0) {
    conditionals.unshift(fieldPart.slice(cộngIdx + 1).trim())
    fieldPart = fieldPart.slice(0, cộngIdx).trim()
  }

  // Parse field list: split by comma, handle parenthetical notes like "sameAs (I2)"
  const rawFields = fieldPart.split(',').map(f => {
    // Remove parenthetical notes like "(I2)", "(gate)", "(gate I4)"
    let cleaned = f.replace(/\([^)]*\)/g, '').trim()
    // Handle "≥1" or "≥1 stop" suffixes
    cleaned = cleaned.replace(/\s*≥\d+.*$/, '').trim()
    // Remove trailing dots and spaces
    cleaned = cleaned.replace(/[.;]\s*$/, '').trim()
    return cleaned
  }).filter(f => f.length > 0 && !f.match(/^(cộng|cộng theo|imageProvenance)/i))

  // "imageProvenance khi có ảnh" is a conditional — exclude from fields array
  // since it was already overridden (no longer a gate per DECISIONS.md)

  const entityType = ENTITY_NAME_TO_TYPE[resolvedName] || resolvedName.toLowerCase()

  return {
    entityName: resolvedName,
    entityType,
    fields: rawFields,
    conditionals,
    sourceLine: line.trim(),
    sectionName: section,
  }
}

// ── Step 2: Parse shared/gates/index.ts gateFields ──

function parseGateFields(): Record<string, GateFieldsEntry> {
  const content = readFileSync(GATE_FIELDS_PATH, 'utf-8')
  const result: Record<string, GateFieldsEntry> = {}

  // Extract the gateFields object: from "const gateFields: Record<string, GateDef> = {" to the matching "}"
  const startMatch = content.match(/const\s+gateFields\s*:\s*Record\s*<\s*string\s*,\s*GateDef\s*>\s*=\s*\{/)
  if (!startMatch) {
    console.error('[error] Không tìm thấy gateFields trong shared/gates/index.ts')
    return result
  }

  // Find the block — we need to handle nested braces
  const startIdx = startMatch.index! + startMatch[0].length
  let depth = 1
  let endIdx = startIdx
  for (let i = startIdx; i < content.length && depth > 0; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') depth--
    if (depth === 0) endIdx = i
  }

  const block = content.slice(startIdx, endIdx)

  // Parse each entity entry. Each entry looks like:
  //   entityName: {
  //     fields: ['field1', 'field2', ...],
  //     conditional: (d) => { ... return null }
  //   },
  //
  // We'll find all top-level keys first, then parse each one's fields.

  // Find top-level keys: word followed by ": {"
  const keyPattern = /(\w+)\s*:\s*\{/g
  let keyMatch: RegExpExecArray | null
  const keys: string[] = []
  while ((keyMatch = keyPattern.exec(block)) !== null) {
    keys.push(keyMatch[1])
  }

  for (const key of keys) {
    // Find this key's block
    const keyStartRegex = new RegExp(`${key}\\s*:\\s*\\{`)
    const keyStartMatch = keyStartRegex.exec(block)
    if (!keyStartMatch) continue

    const keyStartIdx = keyStartMatch.index + keyStartMatch[0].length
    let keyDepth = 1
    let keyEndIdx = keyStartIdx
    for (let i = keyStartIdx; i < block.length && keyDepth > 0; i++) {
      if (block[i] === '{') keyDepth++
      else if (block[i] === '}') keyDepth--
      if (keyDepth === 0) keyEndIdx = i
    }

    const entryBlock = block.slice(keyStartIdx, keyEndIdx)

    // Parse fields array
    const fieldsMatch = entryBlock.match(/fields\s*:\s*\[([^\]]*)\]/)
    const fields: string[] = []
    if (fieldsMatch) {
      const fieldsStr = fieldsMatch[1]
      // Extract quoted strings
      const fieldPattern = /['"]([^'"]+)['"]/g
      let fm: RegExpExecArray | null
      while ((fm = fieldPattern.exec(fieldsStr)) !== null) {
        fields.push(fm[1])
      }
    }

    // Check if conditional actually enforces something (returns non-null string)
    // Look for return statements that return a string literal (error message), not just "return null"
    const hasEffectiveConditional = entryBlock.includes('conditional:') &&
      /return\s+(?!null)[^;]+/.test(entryBlock)

    // Extract the conditional expression for reporting
    let condExpr = ''
    if (hasEffectiveConditional) {
      const condMatch = entryBlock.match(/conditional\s*:\s*\(d\)\s*=>\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/)
      if (condMatch) {
        condExpr = condMatch[1].trim().replace(/\s+/g, ' ').substring(0, 120)
      } else {
        condExpr = '(có điều kiện phức tạp)'
      }
    }

    // Extract field names from conditional expression (d.xxx patterns)
    const conditionalFields: string[] = []
    if (hasEffectiveConditional) {
      // Match patterns like: d.fieldName, refId(d.fieldName), !d.fieldName, d.fieldName && ...
      // We want to extract known Sanity field names, not _id, _type, _ref etc
      const fieldRefRegex = /\bd\.(\w+)\b/g
      let fr: RegExpExecArray | null
      const seen = new Set<string>()
      while ((fr = fieldRefRegex.exec(entryBlock)) !== null) {
        const name = fr[1]
        // Filter out method calls and internal properties
        if (!seen.has(name) && !name.startsWith('_') && name !== 'refId') {
          seen.add(name)
          conditionalFields.push(name)
        }
      }
    }

    const allEnforced = new Set([...fields, ...conditionalFields])

    result[key] = {
      fields,
      conditional: hasEffectiveConditional ? condExpr : null,
      conditionalExpression: condExpr,
      conditionalFields,
      allEnforcedFields: [...allEnforced],
    }
  }

  return result
}

// ── Step 3: Compare ──

interface DriftItem {
  entityType: string
  entityName: string
  diff: string
  severity: 'fail' | 'warn'
  detail: string
}

function compare(contentGates: ParsedGate[], gateFieldsMap: Record<string, GateFieldsEntry>): DriftItem[] {
  const drifts: DriftItem[] = []

  for (const gate of contentGates) {
    const entityType = gate.entityType
    const gf = gateFieldsMap[entityType]

    if (!gf) {
      drifts.push({
        entityType,
        entityName: gate.entityName,
        diff: 'entity_type_missing',
        severity: 'fail',
        detail: `CONTENT_MODEL khai gate cho "${gate.entityName}" (_type="${entityType}") nhưng gateFields KHÔNG có entry cho _type này`,
      })
      continue
    }

    // Use allEnforcedFields (fields + conditionalFields) for comparison
    const contentFields = new Set(gate.fields)
    const gateAllFields = new Set(gf.allEnforcedFields)
    const gateStaticFields = new Set(gf.fields)

    // Fields in CONTENT_MODEL but NOT enforced anywhere in gateFields → real drift
    for (const f of contentFields) {
      if (!gateAllFields.has(f)) {
        drifts.push({
          entityType,
          entityName: gate.entityName,
          diff: 'in_content_model_not_in_gate',
          severity: 'fail',
          detail: `"${f}": có trong CONTENT_MODEL gate publish nhưng KHÔNG có trong gateFields (kể cả conditional) — entity có thể publish thiếu field này`,
        })
      } else if (!gateStaticFields.has(f)) {
        // Field is in conditional but not in static fields — noted for transparency
        drifts.push({
          entityType,
          entityName: gate.entityName,
          diff: 'in_content_model_only_in_conditional',
          severity: 'warn',
          detail: `"${f}": có trong CONTENT_MODEL gate publish, được enforce qua conditional (không phải static fields) — hoạt động đúng nhưng dễ bỏ sót nếu sửa conditional`,
        })
      }
    }

    // Fields enforced in gateFields but NOT in CONTENT_MODEL → could be extra enforcement
    for (const f of gateAllFields) {
      if (!contentFields.has(f)) {
        drifts.push({
          entityType,
          entityName: gate.entityName,
          diff: 'in_gate_not_in_content_model',
          severity: 'warn',
          detail: `"${f}": có trong gateFields nhưng KHÔNG có trong CONTENT_MODEL gate publish — có thể đang chặn field không còn bắt buộc, hoặc CONTENT_MODEL cần cập nhật`,
        })
      }
    }

    // Compare conditionals: CONTENT_MODEL has explicit conditions that gateFields should enforce
    if (gate.conditionals.length > 0 && !gf.conditional) {
      drifts.push({
        entityType,
        entityName: gate.entityName,
        diff: 'conditional_in_spec_not_in_gate',
        severity: 'warn',
        detail: `CONTENT_MODEL có điều kiện bổ sung: "${gate.conditionals.join('; ')}" nhưng gateFields không có conditional`,
      })
    }
  }

  // Check for gateFields entries NOT in CONTENT_MODEL
  const contentTypes = new Set(contentGates.map(g => g.entityType))
  for (const [type, gf] of Object.entries(gateFieldsMap)) {
    if (!contentTypes.has(type)) {
      drifts.push({
        entityType: type,
        entityName: type,
        diff: 'in_gate_not_in_content_model_entity',
        severity: 'fail',
        detail: `_type="${type}" có trong gateFields (fields=[${gf.fields.join(', ')}]) nhưng KHÔNG có gate publish trong CONTENT_MODEL`,
      })
    }
  }

  return drifts
}

// ── Main ──

function main() {
  console.log('=== Meta-validator G2: CONTENT_MODEL vs gateFields ===\n')

  // Parse
  console.log('[parse] Đọc CONTENT_MODEL.md...')
  const contentGates = parseContentModel()
  console.log(`[parse] Tìm thấy ${contentGates.length} gate definition:\n`)
  for (const g of contentGates) {
    console.log(`  ${g.entityName} (${g.entityType}): [${g.fields.join(', ')}]${g.conditionals.length ? ' + ' + g.conditionals.join('; ') : ''}`)
  }

  console.log(`\n[parse] Đọc shared/gates/index.ts...`)
  const gateFieldsMap = parseGateFields()
  console.log(`[parse] Tìm thấy ${Object.keys(gateFieldsMap).length} gateFields entry:\n`)
  for (const [type, gf] of Object.entries(gateFieldsMap)) {
    console.log(`  ${type}: static=[${gf.fields.join(', ')}]${gf.conditionalFields.length ? ' cond=[' + gf.conditionalFields.join(', ') + ']' : ''}`)
  }

  // Compare
  console.log('\n[compare] So sánh hai nguồn...')
  const drifts = compare(contentGates, gateFieldsMap)

  if (drifts.length === 0) {
    console.log('\n[pass] CONTENT_MODEL và gateFields khớp hoàn toàn. Không drift.')
  } else {
    const failDrifts = drifts.filter(d => d.severity === 'fail')
    const warnDrifts = drifts.filter(d => d.severity === 'warn')

    console.log(`\n[DRIFT] ${drifts.length} điểm không khớp (${failDrifts.length} fail, ${warnDrifts.length} warn):\n`)

    for (const d of drifts) {
      const tag = d.severity === 'fail' ? 'FAIL' : 'WARN'
      console.log(`  [${tag}] ${d.entityName} (${d.entityType}) — ${d.detail}`)
    }
  }

  // Write report
  const report = {
    ranAt: new Date().toISOString(),
    sources: {
      contentModel: CONTENT_MODEL_PATH,
      gateFields: GATE_FIELDS_PATH,
    },
    parsed: {
      contentModelGates: contentGates.map(g => ({
        entityType: g.entityType,
        entityName: g.entityName,
        fields: g.fields,
        conditionals: g.conditionals,
      })),
      gateFields: Object.fromEntries(
        Object.entries(gateFieldsMap).map(([k, v]) => [k, { fields: v.fields, hasEffectiveConditional: v.conditional !== null }])
      ),
    },
    drifts: drifts.map(d => ({
      entityType: d.entityType,
      entityName: d.entityName,
      diff: d.diff,
      severity: d.severity,
      detail: d.detail,
    })),
    summary: {
      total: drifts.length,
      fail: drifts.filter(d => d.severity === 'fail').length,
      warn: drifts.filter(d => d.severity === 'warn').length,
    },
  }

  mkdirSync(REPORT_DIR, { recursive: true })
  const reportPath = resolve(REPORT_DIR, 'g2-content-model-vs-gatefields.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`\n[report] Ghi ${reportPath}`)

  // Exit code: fail if there are fail-level drifts
  if (drifts.some(d => d.severity === 'fail')) {
    console.log('\n[exit] Có drift mức fail — cần sửa trước khi tiếp tục.')
    process.exit(1)
  }

  console.log('\n[exit] Không có drift mức fail.')
}

main()
