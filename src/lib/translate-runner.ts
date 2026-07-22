import { configureSynthesisEnv, type SynthesisEnv } from '../../scripts/synthesis/config'
import { runBatch } from '../../scripts/translate/batch'
import { ENTITY_TYPES, TARGET_LANGS } from '../../scripts/translate/config'
import { TRANSLATABLE_FIELDS } from '../../cms/lib/i18nConfig'

const SEO_FIELDS = ['seo.metaTitle', 'seo.metaDescription'] as const

export interface RunTranslationInput {
  dryRun: boolean
  id: string
  type?: string
  lang?: string
  field?: string
  forceSlug?: boolean
  env?: SynthesisEnv
}

export interface RunTranslationResult {
  ok: boolean
  dryRun: boolean
  id: string
  type?: string
  lang?: string
  field?: string
  fieldsTranslated: string[]
  /** Mục trống đã thử dịch nhưng thất bại (provider lỗi / cấu trúc lệch). */
  fieldsFailed: string[]
  providersUsed: string[]
  warnings: string[]
  error?: string
  written: boolean
  reports: Awaited<ReturnType<typeof runBatch>>
}

function publishedId(id: string): string {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
}

function isSupportedField(field: string): boolean {
  return TRANSLATABLE_FIELDS.includes(field) || (SEO_FIELDS as readonly string[]).includes(field)
}

export function validateTranslationInput(input: Pick<RunTranslationInput, 'id' | 'type' | 'lang' | 'field'>): string | null {
  if (!input.id || !input.id.trim()) return 'Cần document id'
  if (input.type && !ENTITY_TYPES.includes(input.type as any)) {
    return `type phải là một trong: ${ENTITY_TYPES.join(', ')}`
  }
  if (input.lang && !TARGET_LANGS.includes(input.lang as any)) {
    return `lang phải là một trong: ${TARGET_LANGS.join(', ')}`
  }
  if (input.field && !isSupportedField(input.field)) {
    return `field không hỗ trợ dịch: ${input.field}`
  }
  return null
}

export async function runTranslation(input: RunTranslationInput): Promise<RunTranslationResult> {
  if (input.env) configureSynthesisEnv(input.env)

  const validationError = validateTranslationInput(input)
  if (validationError) throw new Error(validationError)

  const id = publishedId(input.id)
  const reports = await runBatch({
    dryRun: input.dryRun,
    id,
    type: input.type,
    lang: input.lang,
    field: input.field,
    forceSlug: input.forceSlug,
  })

  const fieldsTranslated = reports.flatMap(report => report.fieldsTranslated)
  const fieldsFailed = reports.flatMap(report => report.fieldsFailed)
  const providersUsed = [...new Set(reports.flatMap(report => report.providersUsed))]
  const warnings = reports.flatMap(report => report.warnings)
  const hasSkipped = reports.some(report => Boolean(report.skipped))
  const hasPatch = reports.some(report => Object.keys(report.patch).length > 0)
  const written = reports.some(report => report.written)
  const writeSatisfied = input.dryRun || !hasPatch || written

  // Thử dịch mà fail toàn bộ (0 mục thành công) = lỗi thật, không phải "hết field trống"
  const allFailed = fieldsFailed.length > 0 && fieldsTranslated.length === 0

  const ok = reports.length > 0 && !hasSkipped && writeSatisfied && !allFailed
  let error: string | undefined
  if (reports.length === 0) {
    error = `Không tìm thấy document ${id}${input.type ? ` (${input.type})` : ''}. Có thể document chưa được tạo hoặc đã bị xóa.`
  } else if (allFailed) {
    error = `Dịch thất bại toàn bộ ${fieldsFailed.length} mục trống — ${warnings[0] || 'không provider nào trả kết quả'}`
  }

  return {
    ok,
    dryRun: input.dryRun,
    id,
    type: input.type,
    lang: input.lang,
    field: input.field,
    fieldsTranslated,
    fieldsFailed,
    providersUsed,
    warnings,
    error,
    written,
    reports,
  }
}
