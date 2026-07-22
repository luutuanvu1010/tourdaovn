// Điều phối: đọc document vi đã duyệt, dịch field trống, gom patch, ghi draft (R2, R4, R5).
import { createClient, type SanityClient } from '@sanity/client'
import {
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  SANITY_READ_TOKEN,
  SANITY_WRITE_TOKEN,
  TARGET_LANGS,
  ENTITY_TYPES,
} from './config'
import { TRANSLATABLE_FIELDS } from '../../cms/lib/i18nConfig'
import { translateField, isFieldEmptyValue } from './translate'
import { slugifyTitle } from '../lib/slug'

let readClient: SanityClient | null = null
let writeClient: SanityClient | null = null
let clientKey = ''

function getClients(): { readClient: SanityClient; writeClient: SanityClient } {
  const key = `${SANITY_PROJECT_ID}:${SANITY_DATASET}:${SANITY_READ_TOKEN ? 'read' : 'anon'}:${SANITY_WRITE_TOKEN ? 'write' : 'readonly'}`
  if (readClient && writeClient && clientKey === key) return { readClient, writeClient }

  readClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2026-06-01',
    token: SANITY_READ_TOKEN || undefined,
    useCdn: false,
    perspective: 'raw',
  })

  writeClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2026-06-01',
    token: SANITY_WRITE_TOKEN || undefined,
    useCdn: false,
    perspective: 'raw',
  })

  clientKey = key
  return { readClient, writeClient }
}

export interface BatchOptions {
  dryRun: boolean
  id?: string
  type?: string
  lang?: string
  field?: string
  forceSlug?: boolean
}

export interface DocumentReport {
  docId: string
  type: string
  fieldsTranslated: string[]
  /** Field.lang có mục trống, ĐÃ thử dịch nhưng thất bại (provider lỗi / cấu trúc lệch). */
  fieldsFailed: string[]
  providersUsed: string[]
  warnings: string[]
  patch: Record<string, any>
  skipped?: string
  written?: boolean
}

async function fetchApprovedPublished(types: string[], idFilter?: string): Promise<any[]> {
  const { readClient } = getClients()
  const filters = ['_type in $types', '!(_id in path("drafts.**"))', 'reviewStatus == "approved"']
  if (idFilter) filters.push('_id == $id')
  const query = `*[${filters.join(' && ')}]`
  const params: Record<string, any> = { types }
  if (idFilter) params.id = idFilter
  return readClient.fetch(query, params)
}

// Slug mỗi ngôn ngữ sinh từ title CỦA CHÍNH ngôn ngữ đó (DECISIONS 2026-07-11).
// KHÔNG fallback copy slug.vi: thiếu title.<lang> → không ghi slug.<lang> (trang không sinh,
// vì src/lib/sanity.ts fetchAllSlugs đòi cả title lẫn slug) — dịch title trước rồi chạy lại.
function addMissingSlugs(
  source: any,
  targetLangs: readonly string[],
  report: DocumentReport,
  patch: Record<string, any>,
  forceSlug?: boolean,
): void {
  if (!(source.slug?.vi?.current || source.slug?.vi)) {
    report.warnings.push('thiếu slug.vi — entity chưa đạt S2.5, cần bổ sung trong Studio/synthesis')
  }

  for (const lang of targetLangs) {
    if (!forceSlug && !isFieldEmptyValue(source.slug?.[lang]?.current)) continue

    const titleFromPatch = patch[`title.${lang}`]
    const titleFromSource = source.title?.[lang]
    const titleValue = titleFromPatch || titleFromSource
    if (!isNonEmptyString(titleValue)) {
      report.warnings.push(`thiếu title.${lang} — chưa sinh slug.${lang}, chạy dịch title trước`)
      continue
    }

    const slug = slugifyTitle(String(titleValue))
    if (!slug) {
      report.warnings.push(`không sinh được slug.${lang}`)
      continue
    }

    patch[`slug.${lang}`] = { _type: 'slug', current: slug }
    report.fieldsTranslated.push(`slug.${lang}`)
  }
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== ''
}

async function fetchDraft(publishedId: string): Promise<any | null> {
  const { readClient } = getClients()
  return readClient.fetch(`*[_id == $id][0]`, { id: `drafts.${publishedId}` })
}

function detectDuplicates(docs: any[]): Set<string> {
  const slugMap = new Map<string, string[]>()
  for (const doc of docs) {
    const slug = doc.slug?.vi?.current || doc.slug?.vi
    if (!slug) continue
    const key = `${doc._type}:${slug}`
    const list = slugMap.get(key) || []
    list.push(doc._id)
    slugMap.set(key, list)
  }
  const duplicates = new Set<string>()
  for (const ids of slugMap.values()) {
    if (ids.length > 1) ids.forEach(id => duplicates.add(id))
  }
  return duplicates
}

async function translateSeoField(
  fieldValue: Record<string, any>,
  targetLangs: readonly string[],
  report: DocumentReport,
  patch: Record<string, any>,
  subFilter?: 'metaTitle' | 'metaDescription',
): Promise<void> {
  for (const sub of ['metaTitle', 'metaDescription'] as const) {
    if (subFilter && sub !== subFilter) continue
    const subWrap = fieldValue[sub]
    if (!subWrap || typeof subWrap !== 'object' || isFieldEmptyValue(subWrap.vi)) continue

    for (const lang of targetLangs) {
      if (!isFieldEmptyValue(subWrap[lang])) continue
      const { value, provider, warning } = await translateField(`seo.${sub}`, subWrap.vi, lang)
      if (warning) report.warnings.push(warning)
      if (provider && !report.providersUsed.includes(provider)) report.providersUsed.push(provider)
      if (value === null || value === undefined) {
        report.fieldsFailed.push(`seo.${sub}.${lang}`)
        continue
      }
      patch[`seo.${sub}.${lang}`] = value
      report.fieldsTranslated.push(`seo.${sub}.${lang}`)
    }
  }
}

export async function runBatch(options: BatchOptions): Promise<DocumentReport[]> {
  const { writeClient } = getClients()
  const types = options.type ? [options.type] : ENTITY_TYPES
  const targetLangs = options.lang ? [options.lang] : TARGET_LANGS
  const requestedField = options.field

  const published = await fetchApprovedPublished(types, options.id)
  const duplicateIds = detectDuplicates(published)

  // Fallback: nếu một document cụ thể được yêu cầu (từ Sanity Studio)
  // nhưng chưa từng publish — chỉ tồn tại draft — thì query trực tiếp draft
  let isDraftOnly = false
  if (published.length === 0 && options.id) {
    const draftDoc = await fetchDraft(options.id)
    if (draftDoc) {
      // Chuẩn hóa _id: fetchDraft trả về drafts.xxx, cần strip prefix
      // để vòng lặp bên dưới ghi draftId đúng (tránh lỗi drafts.drafts.xxx)
      draftDoc._id = options.id
      published.push(draftDoc)
      isDraftOnly = true
    }
  }

  const reports: DocumentReport[] = []

  for (const pub of published) {
    const report: DocumentReport = {
      docId: pub._id,
      type: pub._type,
      fieldsTranslated: [],
      fieldsFailed: [],
      providersUsed: [],
      warnings: [],
      patch: {},
    }

    if (duplicateIds.has(pub._id)) {
      report.skipped = 'nhiều bản approved cùng id/slug — bỏ qua, cần xử lý thủ công'
      report.warnings.push(report.skipped)
      reports.push(report)
      continue
    }

    const draft = await fetchDraft(pub._id)
    const source = draft || pub

    // Gate reviewStatus: chỉ áp dụng khi có bản published thật sự.
    // Khi document chỉ có draft (isDraftOnly), người dùng đã chủ động
    // nhấn Translate All từ Studio — không cần gate này.
    if (!isDraftOnly && source.reviewStatus !== 'approved') {
      report.skipped = 'reviewStatus draft khác published, không xác định nguồn duyệt'
      report.warnings.push(report.skipped)
      reports.push(report)
      continue
    }

    const patch: Record<string, any> = {}

    for (const fieldName of TRANSLATABLE_FIELDS) {
      if (requestedField && requestedField !== fieldName && !requestedField.startsWith(`${fieldName}.`)) continue
      const fieldValue = source[fieldName]
      if (fieldValue === undefined || fieldValue === null) continue

      if (fieldName === 'seo') {
        const subFilter = requestedField?.startsWith('seo.')
          ? requestedField.slice('seo.'.length)
          : undefined
        if (subFilter && subFilter !== 'metaTitle' && subFilter !== 'metaDescription') {
          report.warnings.push(`field seo không hỗ trợ: ${requestedField}`)
          continue
        }
        await translateSeoField(fieldValue, targetLangs, report, patch, subFilter as 'metaTitle' | 'metaDescription' | undefined)
        continue
      }

      if (typeof fieldValue !== 'object' || Array.isArray(fieldValue) || !('vi' in fieldValue)) {
        report.warnings.push(`dạng field lạ: ${fieldName} (không có khung đa ngữ {vi,en,zh,ko,ru})`)
        continue
      }

      const viValue = fieldValue.vi
      if (isFieldEmptyValue(viValue)) continue

      for (const lang of targetLangs) {
        if (!isFieldEmptyValue(fieldValue[lang])) continue
        const { value, provider, warning } = await translateField(fieldName, viValue, lang)
        if (warning) report.warnings.push(warning)
        if (provider && !report.providersUsed.includes(provider)) report.providersUsed.push(provider)
        if (value === null || value === undefined) {
          report.fieldsFailed.push(`${fieldName}.${lang}`)
          continue
        }
        patch[`${fieldName}.${lang}`] = value
        report.fieldsTranslated.push(`${fieldName}.${lang}`)
      }
    }

    if (!requestedField || requestedField === 'title') {
      // touristDestination: KHÔNG sinh slug — destinationAlternates (src/lib/sitemap.ts) dùng
      // MỘT slug chung cho mọi ngôn ngữ, slug lệch nhau sẽ vỡ hreflang trang hub.
      // Quản slug destination thủ công tới khi gỡ phiếu nợ (DECISIONS 2026-07-11).
      if (pub._type === 'touristDestination') {
        report.warnings.push('touristDestination: module không sinh slug (destinationAlternates dùng slug chung mọi ngôn ngữ — phiếu nợ DECISIONS 2026-07-11)')
      } else {
        addMissingSlugs(source, targetLangs, report, patch, options.forceSlug)
      }
    }

    report.patch = patch

    if (Object.keys(patch).length === 0) {
      reports.push(report)
      continue
    }

    if (options.dryRun) {
      reports.push(report)
      continue
    }

    if (!SANITY_WRITE_TOKEN) {
      report.warnings.push('Thiếu SANITY_WRITE_TOKEN — không ghi được')
      reports.push(report)
      continue
    }

    try {
      const draftId = `drafts.${pub._id}`
      const draftBase = { ...source, _id: draftId, _type: pub._type }
      delete (draftBase as any)._rev

      await writeClient
        .transaction()
        .createIfNotExists(draftBase as any)
        .patch(draftId, p => p.set(patch))
        .commit()

      report.written = true
    } catch (err: any) {
      report.warnings.push(`ghi Sanity thất bại: ${err.message}`)
    }

    reports.push(report)
  }

  return reports
}
