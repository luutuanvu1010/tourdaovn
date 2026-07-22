import { createClient } from '@sanity/client'
import { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_WRITE_TOKEN } from './config'

function getWriteClient() {
  return createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2026-06-01',
    token: SANITY_WRITE_TOKEN,
    useCdn: false,
  })
}

function slugFromData(data: Record<string, any>): string {
  if (data.slug?.vi?.current) return data.slug.vi.current
  if (data.slug?.vi) return String(data.slug.vi)
  if (data.title?.vi) {
    return String(data.title.vi)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  return `entity-${Date.now()}`
}

function publishedId(id: string): string {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
}

function draftId(id: string): string {
  return `drafts.${publishedId(id)}`
}

function withoutSystemFields(doc: Record<string, any>): Record<string, any> {
  const { _rev, _createdAt, _updatedAt, ...rest } = doc
  return rest
}

function isFieldEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) return true
  // Với localized object {vi: ...}, kiểm tra vi có trống không
  if (typeof value === 'object' && value !== null && 'vi' in value) {
    const vi = (value as any).vi
    if (vi === undefined || vi === null) return true
    if (typeof vi === 'string' && vi.trim() === '') return true
    if (Array.isArray(vi) && vi.length === 0) return true
  }
  return false
}

function isTransientNetworkError(err: any): boolean {
  const message = String(err?.message || err || '')
  return /ENOTFOUND|EAI_AGAIN|ECONNRESET|ECONNREFUSED|ETIMEDOUT|fetch failed|network|socket|timeout/i.test(message)
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function withTransientRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastErr: any
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await operation()
    } catch (err: any) {
      lastErr = err
      if (attempt === 3 || !isTransientNetworkError(err)) throw err
      await sleep(750 * attempt)
    }
  }
  throw lastErr
}

export async function writeDraft(
  entityType: string,
  data: Record<string, any>,
  sourceUrls: string[],
  options: { dryRun: boolean; silent?: boolean },
): Promise<{ success: boolean; docId?: string; error?: string }> {
  const client = getWriteClient()
  const slug = slugFromData(data)
  const docId = `seed.${slug}`
  const targetDraftId = draftId(docId)

  // Kiểm tra trùng bằng sameAs
  let existingDoc: Record<string, any> | null = null
  if (data.sameAs && Array.isArray(data.sameAs) && data.sameAs.length > 0) {
    try {
      const query = `*[_type == $type && count(sameAs[@ in $sameAs]) > 0][0]`
      existingDoc = await withTransientRetry(() => client.fetch(query, { type: entityType, sameAs: data.sameAs }))
    } catch (err: any) {
      // Nếu query lỗi (vd token không có quyền đọc), vẫn tiếp tục với null
      console.warn(`Cảnh báo: không query được sameAs — ${err.message}`)
    }
  }

  // Merge: nếu doc đã tồn tại, chỉ điền field còn trống
  let finalData: Record<string, any>
  if (existingDoc) {
    finalData = {
      ...withoutSystemFields(existingDoc),
      _id: draftId(existingDoc._id),
      _type: entityType,
      reviewStatus: 'draft',
      contentProvenance: existingDoc.contentProvenance ?? 'mixed',
    }
    for (const [key, value] of Object.entries(data)) {
      if (key === '_id' || key === '_type' || key === '_rev') continue
      if (isFieldEmpty(finalData[key])) {
        finalData[key] = value
      }
    }
  } else {
    finalData = {
      _id: targetDraftId,
      _type: entityType,
      reviewStatus: 'draft',
      contentProvenance: 'mixed',
      ...data,
    }
  }

  if (options.dryRun) {
    if (!options.silent) console.log(JSON.stringify({ _id: finalData._id, ...finalData }, null, 2))
    return { success: true, docId: finalData._id }
  }

  if (!SANITY_WRITE_TOKEN) {
    return { success: false, error: 'Thiếu SANITY_WRITE_TOKEN trong process.env' }
  }

  try {
    const res = await withTransientRetry(() => client.createOrReplace(finalData as any))
    const resultId = (res as any)?._id ?? finalData._id

    const filledFields = Object.keys(data).filter(k => k !== '_id' && k !== '_type')
    if (!options.silent) {
      console.log(`  ✓ ${entityType} ${resultId}`)
      console.log(`    Field đã điền: ${filledFields.join(', ') || '(không có)'}`)
      console.log(`    URL nguồn: ${sourceUrls.join(', ')}`)
    }

    return { success: true, docId: resultId }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
