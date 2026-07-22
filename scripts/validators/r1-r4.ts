import type { ValidatorResult } from './i1-i19.js'
import { ROUTE_MAP } from '../../src/lib/routes.js'

// R1 + R2 chạy trên tập publishedDocs (approved + category) — dispatch ở validate-constraints.ts
// đã lọc đúng tập này (không thuộc FULL_CORPUS_VALIDATORS, không prefix PY).

// Mapping: entity type có hasTerm === true (lấy từ ROUTE_MAP) → { termSet, refField }
// Field name theo CONTENT_MODEL §2:
//   - experience: experienceType (reference → category) — cms/schemas/experience.ts:12
//   - tour: category (array reference → category, field chung 2.0) — dùng chung baseFields
const TERM_BRANCHES: Record<string, { termSet: string; refField: string }> = {
  experience: { termSet: 'experience-type', refField: 'experienceType' },
  tour:       { termSet: 'tour-type',       refField: 'category' },
}

const LANGS = ['vi', 'en', 'zh', 'ko', 'ru'] as const
const FIELD_LEVEL_I18N_TYPES = new Set([
  'touristDestination', 'place', 'attraction', 'experience',
  'restaurant', 'specialty', 'hotel', 'resort', 'tour',
  'organization', 'event', 'person',
])

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== ''
}

// ── R1: trong một nhánh prefix, slug không trùng giữa term Category và entity ──
// 04-CONSTRAINTS §1c R1: union slug của term và entity theo nhánh và ngôn ngữ lúc build

export function validateR1(docs: any[]): ValidatorResult {
  const errors: string[] = []

  const termBranches = ROUTE_MAP.filter(r => r.hasTerm)

  for (const branch of termBranches) {
    const config = TERM_BRANCHES[branch.entity]
    if (!config) continue

    // Category thuộc bộ term của nhánh này
    const termCategories = docs.filter(
      (d: any) => d._type === 'category' && d.inDefinedTermSet === config.termSet
    )

    // Entity cùng nhánh
    const entities = docs.filter((d: any) => d._type === branch.entity)

    for (const lang of LANGS) {
      // Term slug: Category dùng slug đơn (slug.current), không localize
      const termSlugs = new Map<string, string>()
      for (const cat of termCategories) {
        const slug: string | undefined = cat.slug?.current
        if (!slug) continue
        termSlugs.set(slug.toLowerCase(), cat._id)
      }

      if (termSlugs.size === 0) continue

      // Entity slug: field-level i18n → slug[lang].current
      for (const entity of entities) {
        const slug: string | undefined = entity.slug?.[lang]?.current
        if (!slug) continue
        const lower = slug.toLowerCase()
        if (termSlugs.has(lower)) {
          errors.push(
            `R1: slug "${slug}" (${branch.entity} ${entity._id}, lang=${lang}) trùng term Category ${termSlugs.get(lower)} trong nhánh /${branch.segments.vi}/`
          )
        }
      }
    }
  }

  return { passed: errors.length === 0, errors }
}

// ── R2: trang term chỉ sinh khi có ≥1 entity publish trỏ tới ──
// 04-CONSTRAINTS §1c R2: đếm entity publish theo term lúc build, dưới ngưỡng thì fail

export function validateR2(docs: any[]): ValidatorResult {
  const errors: string[] = []

  for (const [entityType, config] of Object.entries(TERM_BRANCHES)) {
    const termCategories = docs.filter(
      (d: any) => d._type === 'category' && d.inDefinedTermSet === config.termSet
    )

    const entities = docs.filter((d: any) => d._type === entityType)

    for (const cat of termCategories) {
      // Đếm entity có refField trỏ tới category này (reference dạng {_ref: id})
      const count = entities.filter((e: any) => {
        const ref = e[config.refField]
        if (!ref) return false
        const refs = Array.isArray(ref) ? ref : [ref]
        return refs.some((r: any) => (r._ref || r) === cat._id)
      }).length

      if (count < 1) {
        errors.push(
          `R2: Category "${cat.name?.vi || cat.name?.en || cat._id}" (bộ ${config.termSet}) có 0 ${entityType} publish trỏ tới — trang term rỗng không được sinh`
        )
      }
    }
  }

  return { passed: errors.length === 0, errors }
}

// ── S25-FIVE-LANGUAGE-COVERAGE: approved content must have all five public languages ──
// Overlay S2.5: production is five-language. AI translation may create drafts, but approved
// published entities must not be partial.

export function validateS25FiveLanguageCoverage(docs: any[]): ValidatorResult {
  const errors: string[] = []

  for (const doc of docs) {
    if (FIELD_LEVEL_I18N_TYPES.has(doc._type)) {
      for (const lang of LANGS) {
        if (!isNonEmptyString(doc.title?.[lang])) {
          errors.push(`${doc._id}: thiếu title.${lang} cho strict 5-language coverage (S2.5)`)
        }
        if (!isNonEmptyString(doc.slug?.[lang]?.current)) {
          errors.push(`${doc._id}: thiếu slug.${lang}.current cho strict 5-language coverage (S2.5)`)
        }
        if (!isNonEmptyString(doc.summary?.[lang])) {
          errors.push(`${doc._id}: thiếu summary.${lang} cho strict 5-language coverage (S2.5)`)
        }
      }
    }
  }

  const articleGroups = new Map<string, Map<string, string>>()
  for (const doc of docs.filter((d: any) => d._type === 'article')) {
    const group = doc.translationGroup?._ref
    const lang = doc.language
    if (!group || !isNonEmptyString(lang)) {
      errors.push(`${doc._id}: Article thiếu translationGroup/language cho strict 5-language coverage (S2.5)`)
      continue
    }
    const langs = articleGroups.get(group) ?? new Map<string, string>()
    langs.set(lang, doc._id)
    articleGroups.set(group, langs)
  }

  for (const [group, langs] of articleGroups) {
    for (const lang of LANGS) {
      if (!langs.has(lang)) {
        errors.push(`Article translationGroup ${group}: thiếu bản ${lang} approved cho strict 5-language coverage (S2.5)`)
      }
    }
  }

  return { passed: errors.length === 0, errors }
}

// ── Dispatch map (pattern giống py1-py8.ts) ──

export const R_VALIDATORS: Record<string, (docs: any[], prices: Map<string, any>) => ValidatorResult> = {
  R1: (docs, _prices) => validateR1(docs),
  R2: (docs, _prices) => validateR2(docs),
  'S25-FIVE-LANGUAGE-COVERAGE': (docs, _prices) => validateS25FiveLanguageCoverage(docs),
}

export const R_VALIDATOR_LEVELS: Record<string, 'fail' | 'warn'> = {
  R1: 'fail',
  R2: 'fail',
  'S25-FIVE-LANGUAGE-COVERAGE': 'fail',
}
