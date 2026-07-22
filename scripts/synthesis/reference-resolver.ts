// Reference Resolver (P4.1, theo 11-SCRAPE_TRANSLATE_PLAN §A2 tier 8): containedInPlace
// text (LLM trả) → Sanity reference (Place/TouristDestination). CHỈ ĐỌC, khớp chắc mới gán.
// TODO: resolve experienceType (text → Category ref) and venue (text → Attraction/Hotel/Place ref)
// for experience entity. Hiện tại experienceType và venue nằm ngoài LLM extraction, do người gán.
import { getClient } from '../lib/sanity-client'

export interface RefResult {
  ref: { _type: 'reference'; _ref: string } | null
  matchedTitle?: string
  warnings: string[]
}

const CONTAINER_TYPES_GROQ = '["place","touristDestination"]'

const PLACE_PREFIX_RE = /^(đảo|bãi biển|bãi|vịnh|mũi|núi|đầm|phường|khu vực)\s+/i

function uniqueNonEmpty(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const normalized = item.replace(/\s+/g, ' ').trim()
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(normalized)
  }
  return out
}

export function containedInPlaceCandidates(name: string): string[] {
  const trimmed = name.trim()
  const beforeComma = trimmed.split(',')[0]?.trim() ?? ''
  const withoutPrefix = beforeComma.replace(PLACE_PREFIX_RE, '').trim()

  return uniqueNonEmpty([
    trimmed,
    beforeComma,
    withoutPrefix,
  ])
}

export async function resolveContainedInPlace(name: string): Promise<RefResult> {
  const trimmed = name.trim()
  if (!trimmed) {
    return { ref: null, warnings: ['containedInPlace text trống'] }
  }

  const warnings: string[] = []

  try {
    const client = getClient()
    const candidates = containedInPlaceCandidates(trimmed)

    for (const candidate of candidates) {
      const exactMatches: Array<{ _id: string; t: string }> = await client.fetch(
        `*[_type in ${CONTAINER_TYPES_GROQ} && lower(title.vi) == lower($name)]{_id, "t": title.vi}`,
        { name: candidate },
      )

      if (exactMatches.length === 1) {
        const id = exactMatches[0]._id.replace(/^drafts\./, '')
        if (candidate !== trimmed) {
          warnings.push(`containedInPlace "${trimmed}": resolve qua tên chuẩn hoá "${candidate}"`)
        }
        return { ref: { _type: 'reference', _ref: id }, matchedTitle: exactMatches[0].t, warnings }
      }

      if (exactMatches.length > 1) {
        warnings.push(`containedInPlace "${trimmed}": nhiều entity trùng tên "${candidate}", không tự chọn`)
        return { ref: null, warnings }
      }
    }

    // 0 kết quả chắc → thử khớp mờ theo từng ứng viên CHỈ để cảnh báo, KHÔNG gán
    const fuzzyMatches: Array<{ _id: string; t: string }> = []
    for (const candidate of candidates) {
      const matches: Array<{ _id: string; t: string }> = await client.fetch(
        `*[_type in ${CONTAINER_TYPES_GROQ} && title.vi match $name + "*"]{_id, "t": title.vi}`,
        { name: candidate },
      )
      fuzzyMatches.push(...matches)
    }

    const fuzzyTitles = uniqueNonEmpty(fuzzyMatches.map((m) => m.t))
    if (fuzzyTitles.length > 0) {
      warnings.push(
        `containedInPlace "${trimmed}": tìm thấy gần đúng ${fuzzyTitles.join(', ')}, không tự gán`,
      )
    } else {
      warnings.push(`containedInPlace "${trimmed}": không tìm thấy entity Place/TouristDestination khớp`)
    }

    return { ref: null, warnings }
  } catch (err: any) {
    warnings.push(`Lỗi query containedInPlace "${trimmed}": ${err.message}`)
    return { ref: null, warnings }
  }
}
