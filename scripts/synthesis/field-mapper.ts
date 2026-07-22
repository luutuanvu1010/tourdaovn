// Field whitelist theo entity (P5): gom từ 4 chỗ hardcode cũ (mapper, dispatch, fieldDiff,
// validator) vào một bảng duy nhất, bám CONTENT_MODEL — xem entity-fields.ts.
import { fieldsFor } from './entity-fields'
import { normalizeClassify, CLASSIFY_ENUMS, type ClassifyField } from './classify'
import { slugifyTitle } from '../lib/slug'

// Field cần wrap trong {vi: ...} theo i18n field-level (ADR-0013)
const LOCALIZED_FIELDS = new Set([
  'title', 'summary', 'body', 'highlights', 'faq', 'accessInfo',
  // P5: field localized mới cho restaurant/hotel/specialty/tour — đối chiếu i18nConfig.TRANSLATABLE_FIELDS
  'servesCuisine', 'amenityFeature', 'originNote', 'season', 'includes', 'excludes', 'departureNote',
  'touristType',
])

// --- Citation marker cleanup -------------------------------------------------
// LLM synthesis (NotebookLM-style) trả text kèm marker [cite:NN]. Marker là
// artefact nội bộ của bước tổng hợp, không được lọt vào Sanity — đã từng lộ
// ra JSON-LD và trang production (phát hiện audit 2026-07-06).
function stripCiteMarkers(text: string): string {
  return text
    .replace(/\[cite:[^\]]*\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
}

function stripCitesDeep<T>(value: T): T {
  if (typeof value === 'string') return stripCiteMarkers(value) as unknown as T
  if (Array.isArray(value)) return value.map(v => stripCitesDeep(v)) as unknown as T
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = stripCitesDeep(v)
    }
    return out as unknown as T
  }
  return value
}

// --- Portable text helpers --------------------------------------------------
let keyCounter = 0
const k = () => `synth${(keyCounter++).toString(36)}`

export function resetKeyCounter() {
  keyCounter = 0
}

function textToPortableText(text: string) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  if (paragraphs.length === 0) {
    paragraphs.push(text)
  }
  return paragraphs.map(p => ({
    _type: 'block' as const,
    _key: k(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span' as const, _key: k(), text: p.trim(), marks: [] }],
  }))
}

function stringArrayToPortableText(items: string[]) {
  return items
    .filter(item => item.trim())
    .map(item => ({
      _type: 'block' as const,
      _key: k(),
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span' as const, _key: k(), text: item.trim(), marks: [] }],
    }))
}

// --- Geo rounding -----------------------------------------------------------
function roundGeo(value: number): number {
  return Number(value.toFixed(5))
}

// --- Wikidata ID → URL -------------------------------------------------------
function wikidataUrl(id: string): string {
  const cleaned = id.trim()
  if (/^Q\d+$/i.test(cleaned)) {
    return `https://www.wikidata.org/wiki/${cleaned}`
  }
  return cleaned
}

// --- Type validation helpers ------------------------------------------------
function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v)
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v)
}

// --- Main mapper ------------------------------------------------------------
export function mapFields(
  entityType: string,
  raw: Record<string, any>,
): { mapped: Record<string, any>; warnings: string[] } {
  resetKeyCounter()

  const whitelist = fieldsFor(entityType)
  const mapped: Record<string, any> = {}
  const warnings: string[] = []

  for (const [key, rawValue] of Object.entries(raw)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') continue

    if (!whitelist.includes(key)) {
      warnings.push(`Field ngoài whitelist → bỏ: "${key}"`)
      continue
    }

    // Gỡ marker [cite:NN] khỏi mọi string trước khi map (đệ quy cả array/object)
    const value = stripCitesDeep(rawValue)

    const isLocalized = LOCALIZED_FIELDS.has(key)

    try {
      switch (key) {
        case 'title': {
          if (!isString(value)) {
            warnings.push(`title sai kiểu (cần string) → bỏ qua`)
            continue
          }
          mapped.title = { vi: value }
          break
        }

        case 'summary': {
          if (!isString(value)) {
            warnings.push(`summary sai kiểu (cần string) → bỏ qua`)
            continue
          }
          mapped.summary = { vi: value }
          break
        }

        case 'body': {
          let text: string
          if (isString(value)) {
            text = value
          } else if (isArray(value)) {
            // Scrapfly có thể trả array of strings
            text = (value as any[]).map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n\n')
          } else {
            warnings.push(`body sai kiểu → bỏ qua`)
            continue
          }
          mapped.body = { vi: textToPortableText(text) }
          break
        }

        case 'highlights': {
          let items: string[]
          if (isArray(value)) {
            items = (value as any[]).map(v => (typeof v === 'string' ? v : String(v)))
          } else if (isString(value)) {
            items = value.split(/\n|•|-|\*/).filter(s => s.trim())
          } else {
            warnings.push(`highlights sai kiểu → bỏ qua`)
            continue
          }
          mapped.highlights = { vi: items.filter(s => s.trim()) }
          break
        }

        case 'faq': {
          if (!isArray(value)) {
            warnings.push(`faq sai kiểu (cần array) → bỏ qua`)
            continue
          }
          const faqItems = (value as any[])
            .map((item: any) => {
              if (typeof item === 'object' && item.question && item.answer) {
                return {
                  _type: 'faqItem',
                  _key: k(),
                  question: String(item.question),
                  answer: String(item.answer),
                }
              }
              return null
            })
            .filter(Boolean)
          if (faqItems.length === 0) {
            warnings.push('faq không parse được item nào')
            continue
          }
          mapped.faq = { vi: faqItems }
          break
        }

        case 'accessInfo': {
          let text: string
          if (isString(value)) {
            text = value
          } else if (isArray(value)) {
            text = (value as any[]).map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n\n')
          } else {
            warnings.push(`accessInfo sai kiểu → bỏ qua`)
            continue
          }
          mapped.accessInfo = { vi: textToPortableText(text) }
          break
        }

        case 'geo': {
          if (typeof value === 'object' && value !== null && 'lat' in value && 'lng' in value) {
            mapped.geo = {
              _type: 'geopoint',
              lat: roundGeo(Number((value as any).lat)),
              lng: roundGeo(Number((value as any).lng)),
            }
          } else if (typeof value === 'object' && value !== null && 'latitude' in value) {
            mapped.geo = {
              _type: 'geopoint',
              lat: roundGeo(Number((value as any).latitude)),
              lng: roundGeo(Number((value as any).longitude)),
            }
          } else {
            warnings.push(`geo sai định dạng → bỏ qua`)
          }
          break
        }

        case 'sameAs': {
          let urls: string[]
          if (isString(value)) {
            urls = [value]
          } else if (isArray(value)) {
            urls = (value as any[]).map(v => String(v))
          } else {
            warnings.push(`sameAs sai kiểu → bỏ qua`)
            continue
          }
          mapped.sameAs = urls.map(u => {
            if (/^Q\d+$/i.test(u.trim())) return wikidataUrl(u)
            if (u.startsWith('http')) return u
            return u
          })
          break
        }

        case 'mainImage':
        case 'gallery': {
          // Phase 1: chỉ lưu URL tham chiếu, không upload Sanity CDN
          // Ghi log để founder xử lý thủ công
          if (isString(value)) {
            warnings.push(`${key}: URL "${value}" — chưa upload Sanity CDN (cần xử lý thủ công phase 1)`)
          } else if (isArray(value)) {
            warnings.push(`${key}: ${(value as any[]).length} URL — chưa upload Sanity CDN`)
          }
          break
        }

        case 'containedInPlace': {
          // Chỉ lưu tên tham chiếu, Reference Resolver (tier 8) sẽ resolve sau
          if (isString(value)) {
            warnings.push(`containedInPlace: "${value}" — cần resolve thủ công sang Sanity reference`)
          }
          break
        }

        case 'openingHours': {
          if (typeof value === 'object' && value !== null) {
            mapped.openingHours = {
              open: String((value as any).open ?? (value as any).opens ?? ''),
              close: String((value as any).close ?? (value as any).closes ?? ''),
              note: String((value as any).note ?? ''),
            }
          } else if (isString(value)) {
            mapped.openingHours = { open: '', close: '', note: value }
          }
          break
        }

        case 'isAccessibleForFree': {
          if (typeof value === 'boolean') {
            mapped.isAccessibleForFree = value
          } else if (isString(value)) {
            mapped.isAccessibleForFree = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes'
          }
          break
        }

        case 'hasMap':
        case 'officialSource': {
          if (isString(value)) {
            mapped[key] = value
          }
          break
        }

        case 'placeType':
        case 'attractionType':
        case 'specialtyType': {
          // N5b — field phân loại enum đóng (classify.ts, trích từ schema). Khớp enum → map
          // (đã lowercase/trim); ngoài enum hoặc không phải string → để trống + cảnh báo, KHÔNG
          // ghi rác (R1/R2). Một block chung cho cả 3 entity, một nguồn enum.
          const field = key as ClassifyField
          const { value: classified, invalid } = normalizeClassify(field, value)
          if (classified !== undefined) {
            mapped[field] = classified
          } else if (invalid !== undefined) {
            warnings.push(`${field} "${invalid}" không khớp enum → bỏ qua (cần: ${CLASSIFY_ENUMS[field].join(', ')})`)
          }
          break
        }

        // --- P5: case mới cho restaurant/hotel/specialty/tour, bám CONTENT_MODEL --------------

        case 'servesCuisine':
        case 'includes':
        case 'excludes':
        case 'amenityFeature':
        case 'touristType': {
          let items: string[]
          if (isArray(value)) {
            items = (value as any[]).map(v => (typeof v === 'string' ? v : String(v)))
          } else if (isString(value)) {
            items = value.split(/\n|•|-|\*/).filter(s => s.trim())
          } else {
            warnings.push(`${key} sai kiểu → bỏ qua`)
            continue
          }
          mapped[key] = { vi: items.filter(s => s.trim()) }
          break
        }

        case 'originNote':
        case 'season':
        case 'departureNote': {
          if (!isString(value)) {
            warnings.push(`${key} sai kiểu (cần string) → bỏ qua`)
            continue
          }
          mapped[key] = { vi: value }
          break
        }

        case 'telephone':
        case 'duration': {
          if (isString(value)) {
            mapped[key] = value
          }
          break
        }

        case 'starRating': {
          if (isNumber(value)) {
            mapped[key] = value
          } else if (isString(value) && value.trim() !== '' && !Number.isNaN(Number(value))) {
            mapped[key] = Number(value)
          }
          break
        }

        case 'numberOfRooms': {
          const n = isNumber(value)
            ? value
            : isString(value) && value.trim() !== '' && !Number.isNaN(Number(value))
              ? Number(value)
              : undefined
          if (n === undefined) break
          if (Number.isInteger(n) && n > 0) {
            mapped.numberOfRooms = n
          } else {
            warnings.push(`numberOfRooms phải là số nguyên dương → bỏ qua`)
          }
          break
        }

        case 'tourFormat': {
          if (isString(value)) {
            const valid = ['join-in', 'private', 'both']
            const cleaned = value.toLowerCase().trim()
            if (valid.includes(cleaned)) {
              mapped.tourFormat = cleaned
            } else {
              warnings.push(`tourFormat "${value}" không khớp enum → bỏ qua (cần: ${valid.join(', ')})`)
            }
          }
          break
        }

        case 'itinerary': {
          // R6: chỉ text gợi ý các chặng, KHÔNG bịa reference — reference-resolver/người gán sau
          // (ngoài phạm vi P5). Không ghi vào mapped, chỉ cảnh báo, giống containedInPlace.
          if (isArray(value) && (value as any[]).length > 0) {
            warnings.push(`itinerary: ${(value as any[]).length} chặng gợi ý (text) — cần resolve thủ công sang Sanity reference/externalStop (R6)`)
          } else if (isString(value) && value.trim()) {
            warnings.push(`itinerary: text gợi ý — cần resolve thủ công sang Sanity reference/externalStop (R6)`)
          }
          break
        }

        case 'operator': {
          // R6: chỉ tên đơn vị dạng text, KHÔNG bịa reference Organization — người gán sau.
          if (isString(value) && value.trim()) {
            warnings.push(`operator: "${value}" — cần resolve thủ công sang Sanity reference Organization (R6)`)
          }
          break
        }

        default: {
          // Field whitelisted nhưng không có logic đặc biệt → gán nguyên
          mapped[key] = value
        }
      }
    } catch (err: any) {
      warnings.push(`Lỗi xử lý field "${key}": ${err.message}`)
    }
  }

  // Tự sinh slug từ title nếu chưa có
  if (mapped.title?.vi && !mapped.slug) {
    mapped.slug = {
      vi: { _type: 'slug', current: slugifyTitle(mapped.title.vi) },
    }
  }

  return { mapped, warnings }
}
