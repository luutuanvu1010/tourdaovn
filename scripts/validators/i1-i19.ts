import type { PriceEntry } from '../lib/price-loader.js'
// Gate entity-local (kiểm một document bằng field của nó) sống ở module dùng chung
// browser-safe (ADR-0011 Đợt A). Một nguồn luật (P6/N7): các validateIx entity-local
// dưới đây CHỈ gọi lại checkIx, KHÔNG giữ bản sao logic. Gate dataset-wide (cần cả corpus
// hoặc prices.yaml: I4, I7, I8, I9, I13, I14, I17, I18, PY*) vẫn ở đây / py1-py8.ts.
import {
  refId,
  checkI1, checkI2, checkI3, checkI5, checkI10,
  checkI11, checkI12, checkI19, checkBodyLength,
} from '../../shared/gates/index.js'
import { GATE } from '../gate.config.js'

export type ValidatorResult = {
  passed: boolean
  errors: string[]
  stub?: boolean
  /**
   * Enforce thật sống ở nơi khác, không phải check pre-build này: QA2 post-build
   * (cần output build), hoặc validator khác (composite). Khác `stub` ("chưa kích hoạt
   * đợt sau"): `deferred` là quyết định kiến trúc về NƠI enforce, không phải nợ chưa làm.
   */
  deferred?: string
  level?: 'fail' | 'warn'
}

// ── Helpers (chỉ phục vụ gate dataset-wide; helper entity-local đã sang shared/gates) ──

/** Trích mảng _ref từ mảng Sanity reference */
function refIds(arr: any): string[] {
  if (!arr || !Array.isArray(arr)) return []
  return arr.map(r => refId(r)).filter(Boolean) as string[]
}

/** Kiểm tra field object localized có nội dung không */
function hasContent(val: any): boolean {
  if (!val) return false
  if (typeof val === 'string') return val.trim().length > 0
  if (typeof val === 'object') {
    return Object.values(val).some(v => typeof v === 'string' && v.trim().length > 0)
  }
  return false
}

function getSlugValue(doc: any, lang?: string): string | null {
  const s = doc.slug
  if (!s) return null
  if (typeof s === 'object' && s.current) return s.current
  if (typeof s === 'object' && lang) {
    const lv = s[lang]
    if (lv && typeof lv === 'object' && lv.current) return lv.current
    if (typeof lv === 'string') return lv
  }
  if (typeof s === 'object') {
    for (const l of ['vi', 'en', 'zh', 'ko', 'ru']) {
      const lv = s[l]
      if (lv && lv.current) return lv.current
      if (typeof lv === 'string') return lv
    }
  }
  return null
}

// ── I1: Sanity không lưu con số giá (entity-local → shared/gates checkI1) ──

export function validateI1(docs: any[]): ValidatorResult {
  const errors = docs.flatMap(checkI1)
  return { passed: errors.length === 0, errors }
}

// ── I2: sameAs cho nhóm bách khoa; officialSource cho venue ──

export function validateI2(docs: any[]): ValidatorResult {
  const errors = docs.flatMap(checkI2)
  return { passed: errors.length === 0, errors }
}

// ── I3: Restaurant/Hotel/Resort officialSource; Organization url+officialSource ──

export function validateI3(docs: any[]): ValidatorResult {
  const errors = docs.flatMap(checkI3)
  return { passed: errors.length === 0, errors }
}

// ── I4: Article có author trỏ Person tồn tại ──

export function validateI4(docs: any[]): ValidatorResult {
  const errors: string[] = []
  const personIds = new Set(docs.filter(d => d._type === 'person').map(d => d._id))
  for (const doc of docs) {
    if (doc._type !== 'article') continue
    const authorId = refId(doc.author)
    if (!authorId) {
      errors.push(`${doc._id}: Article thiếu author (I4)`)
    } else if (!personIds.has(authorId)) {
      errors.push(`${doc._id}: Article author trỏ ${authorId} nhưng Person không tồn tại hoặc chưa publish (I4)`)
    }
  }
  return { passed: errors.length === 0, errors }
}

// ── I5: Event đủ eventType+startDate+location ──

export function validateI5(docs: any[]): ValidatorResult {
  const errors = docs.flatMap(checkI5)
  return { passed: errors.length === 0, errors }
}

// ── I6: JSON-LD hợp lệ 100% — kiểm ở QA2 post-build (founder chốt 2026-06-14) ──

export function validateI6(_docs: any[]): ValidatorResult {
  // 04-CONSTRAINTS I6: "schema validator chạy trên TOÀN BỘ output build". Validator này
  // chạy TRƯỚC build (đọc Sanity + yaml), chưa có HTML render → I6 không kiểm được ở đây.
  // Enforce thật thuộc QA2 hồi tố post-build (parse mọi khối ld+json của output). Không
  // giả vờ kiểm pre-build, cũng không re-stub "đợt sau".
  return { passed: true, errors: [], deferred: 'QA2 post-build — JSON-LD trên output build (04-CONSTRAINTS I6)' }
}

// ── I7: translationGroup mỗi language tối đa 1 lần ──

export function validateI7(docs: any[]): ValidatorResult {
  const errors: string[] = []
  const groups = new Map<string, Set<string>>()
  for (const doc of docs) {
    if (doc._type !== 'article') continue
    const tgKey = refId(doc.translationGroup)
    if (!tgKey) continue
    const lang = doc.language
    if (!lang) continue
    if (!groups.has(tgKey)) groups.set(tgKey, new Set())
    const langs = groups.get(tgKey)!
    if (langs.has(lang)) {
      errors.push(`${doc._id}: translationGroup "${tgKey}" đã có bản dịch tiếng ${lang}, trùng lặp (I7)`)
    }
    langs.add(lang)
  }
  return { passed: errors.length === 0, errors }
}

// ── I8: containedInPlace không chu trình ──

export function validateI8(docs: any[]): ValidatorResult {
  const errors: string[] = []
  const graph = new Map<string, string>()
  const validIds = new Set(docs.map(d => d._id))

  for (const doc of docs) {
    const cipId = refId(doc.containedInPlace)
    if (cipId) {
      if (!validIds.has(cipId)) {
        errors.push(`${doc._id}: containedInPlace trỏ ${cipId} nhưng doc không tồn tại hoặc chưa publish (I8)`)
      }
      graph.set(doc._id, cipId)
    }
  }

  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map<string, number>()
  for (const id of graph.keys()) color.set(id, WHITE)

  function dfs(node: string): boolean {
    color.set(node, GRAY)
    const next = graph.get(node)
    if (next) {
      const c = color.get(next)
      if (c === GRAY) {
        errors.push(`Chu trình containedInPlace phát hiện tại ${node} → ${next} (I8)`)
        return true
      }
      if (c === WHITE && dfs(next)) return true
    }
    color.set(node, BLACK)
    return false
  }

  for (const id of graph.keys()) {
    if (color.get(id) === WHITE) dfs(id)
  }

  return { passed: errors.length === 0, errors }
}

// ── I9: slug duy nhất theo i18n strategy ──

export function validateI9(docs: any[]): ValidatorResult {
  const errors: string[] = []
  const documentLevelTypes = new Set(['article'])
  const fieldLevelTypes = new Set([
    'touristDestination', 'place', 'attraction', 'experience',
    'restaurant', 'specialty', 'hotel', 'resort', 'tour',
    'organization', 'event', 'person'
  ])

  // Document-level: unique per (language, _type) — Article
  const docLevelSeen = new Map<string, string>()
  for (const doc of docs) {
    if (!documentLevelTypes.has(doc._type)) continue
    const lang = doc.language || 'vi'
    const slugVal = getSlugValue(doc)
    if (!slugVal) continue
    const key = `${lang}:${doc._type}:${slugVal}`
    if (docLevelSeen.has(key)) {
      errors.push(`${doc._id}: slug "${slugVal}" (${lang}) trùng với ${docLevelSeen.get(key)} trong cùng _type="${doc._type}" (I9)`)
    }
    docLevelSeen.set(key, doc._id)
  }

  // Field-level: unique per (_type, slug per language)
  const fieldLevelSeen = new Map<string, string>()
  for (const doc of docs) {
    if (!fieldLevelTypes.has(doc._type)) continue
    const s = doc.slug
    if (!s || typeof s !== 'object') continue
    for (const lang of ['vi', 'en', 'zh', 'ko', 'ru']) {
      const lv = s[lang]
      if (!lv) continue
      const slugVal = typeof lv === 'object' ? lv.current : lv
      if (!slugVal) continue
      const key = `${doc._type}:${lang}:${slugVal}`
      if (fieldLevelSeen.has(key)) {
        errors.push(`${doc._id}: slug "${slugVal}" (${lang}) trùng với ${fieldLevelSeen.get(key)} trong _type="${doc._type}" (I9)`)
      }
      fieldLevelSeen.set(key, doc._id)
    }
  }

  return { passed: errors.length === 0, errors }
}

// ── I10: summary đủ dài và cấu trúc câu (warn) ──

export function validateI10(docs: any[]): ValidatorResult {
  const errors = docs.flatMap(checkI10)
  return { passed: errors.length === 0, errors }
}

// ── I11: Category là từ vựng đóng ──

export function validateI11(docs: any[]): ValidatorResult {
  const errors = docs.flatMap(checkI11)
  return { passed: errors.length === 0, errors }
}

// ── I12: Không publish thiếu field bắt buộc ──

export function validateI12(docs: any[]): ValidatorResult {
  // Hai-pass GIỮ NGUYÊN thứ tự lỗi của bản cũ: mọi lỗi non-category trước (theo thứ tự
  // doc), rồi mọi lỗi category sau. checkI12 thuần lo logic một document (cả category,
  // chuỗi "category publish thiếu..." khớp vì ${doc._type}="category"). (R1)
  const errors: string[] = []
  for (const doc of docs) {
    if (doc._type === 'category') continue
    errors.push(...checkI12(doc, GATE.requiredFields))
    errors.push(...checkBodyLength(doc))
  }
  for (const doc of docs) {
    if (doc._type !== 'category') continue
    errors.push(...checkI12(doc, GATE.requiredFields))
  }
  return { passed: errors.length === 0, errors }
}

// ── I13: Experience đủ experienceType + venue ──

export function validateI13(docs: any[]): ValidatorResult {
  const errors: string[] = []
  const validIds = new Set(docs.map(d => d._id))
  for (const doc of docs) {
    if (doc._type !== 'experience') continue
    const expTypeId = refId(doc.experienceType)
    if (!expTypeId) {
      errors.push(`${doc._id}: Experience thiếu experienceType (I13)`)
    }
    const venueId = refId(doc.venue)
    if (!venueId) {
      errors.push(`${doc._id}: Experience thiếu venue (I13)`)
    } else if (!validIds.has(venueId)) {
      errors.push(`${doc._id}: Experience venue trỏ ${venueId} không tồn tại hoặc chưa publish (I13)`)
    }
  }
  return { passed: errors.length === 0, errors }
}

// ── I14: Tour đủ itinerary≥1 + operator + tourFormat ──

export function validateI14(docs: any[]): ValidatorResult {
  const errors: string[] = []
  const validIds = new Set(docs.map(d => d._id))
  const VALID_TOUR_FORMATS = new Set(['join-in', 'private', 'both'])
  for (const doc of docs) {
    if (doc._type !== 'tour') continue
    if (!doc.itinerary || !Array.isArray(doc.itinerary) || doc.itinerary.length === 0) {
      errors.push(`${doc._id}: Tour thiếu itinerary ≥1 stop (I14)`)
    }
    const opId = refId(doc.operator)
    if (!opId) {
      errors.push(`${doc._id}: Tour thiếu operator (I14)`)
    } else if (!validIds.has(opId)) {
      errors.push(`${doc._id}: Tour operator trỏ ${opId} không tồn tại hoặc chưa publish (I14)`)
    }
    if (!doc.tourFormat) {
      errors.push(`${doc._id}: Tour thiếu tourFormat (I14)`)
    } else if (!VALID_TOUR_FORMATS.has(doc.tourFormat)) {
      errors.push(`${doc._id}: Tour tourFormat="${doc.tourFormat}" không hợp lệ, phải thuộc [join-in, private, both] (I14)`)
    }
  }
  return { passed: errors.length === 0, errors }
}

// ── I15: Cấm "thành phố Nha Trang", trừ ngữ cảnh lịch sử (cách A, DECISIONS 2026-06-15) ──
// Founder chốt: "thành phố Nha Trang" là cách gọi quen thuộc khi nói về quá khứ, nên cho phép
// khi đi kèm dấu hiệu lịch sử ("trước đây" / "trước kia" / "cũ") ngay sau cụm. Vẫn bắt nếu dùng
// ở thì hiện tại (không có dấu hiệu lịch sử). Nới một bất biến — lý do + rủi ro ghi ở DECISIONS.

export function validateI15(docs: any[]): ValidatorResult {
  const errors: string[] = []  // I15 đã gỡ cho tourdaovn (QĐ-2026-08-06-01)
  return { passed: errors.length === 0, errors }
}

// ── I16: Giá render một chiều qua bookingRef — composite, enforce qua PY + điều cấm ──

export function validateI16(_docs: any[], _prices?: Map<string, PriceEntry>): ValidatorResult {
  // 04-CONSTRAINTS I16: "thi hành ở bảng PY (PY1, PY2, PY4) và mục 2 điều cấm 4, 5".
  // I16 là composite, không có khẳng định độc lập riêng — enforce thật nằm ở các validator
  // và điều cấm đó. Không bịa check mới (R4; founder chốt 2026-06-14: marker delegation).
  return { passed: true, errors: [], deferred: 'PY1/PY2/PY4 + điều cấm 2.4/2.5 (04-CONSTRAINTS I16)' }
}

// ── I17: Specialty đủ specialtyType + sameAs; whereToTry subset check ──

export function validateI17(docs: any[]): ValidatorResult {
  const errors: string[] = []
  const validIds = new Set(docs.map(d => d._id))
  const restaurantSpecialties = new Map<string, Set<string>>()

  for (const doc of docs) {
    if (doc._type === 'restaurant') {
      const refs = new Set(refIds(doc.servesSpecialty))
      restaurantSpecialties.set(doc._id, refs)
    }
  }

  for (const doc of docs) {
    if (doc._type !== 'specialty') continue
    if (!doc.specialtyType) errors.push(`${doc._id}: Specialty thiếu specialtyType (I17)`)
    if (!doc.sameAs || !Array.isArray(doc.sameAs) || doc.sameAs.length === 0) {
      errors.push(`${doc._id}: Specialty thiếu sameAs (I17)`)
    }
    const whereToTryRefs = refIds(doc.whereToTry)
    for (const ref of whereToTryRefs) {
      if (!validIds.has(ref)) {
        errors.push(`${doc._id}: whereToTry trỏ ${ref} không tồn tại hoặc chưa publish (I17)`)
        continue
      }
      const servedSpecs = restaurantSpecialties.get(ref)
      if (servedSpecs && !servedSpecs.has(doc._id)) {
        errors.push(`${doc._id}: whereToTry trỏ Restaurant ${ref} nhưng Restaurant không có servesSpecialty chứa Specialty này (I17)`)
      }
    }
  }
  return { passed: errors.length === 0, errors }
}

// ── I18: Organization có ít nhất 1 quan hệ vào ──

export function validateI18(docs: any[]): ValidatorResult {
  const errors: string[] = []
  const orgIds = new Set(docs.filter(d => d._type === 'organization').map(d => d._id))
  if (orgIds.size === 0) return { passed: true, errors: [] }
  const incoming = new Map<string, string[]>()
  for (const orgId of orgIds) incoming.set(orgId, [])

  for (const doc of docs) {
    if (doc._type === 'tour') {
      const opId = refId(doc.operator)
      if (opId && orgIds.has(opId)) incoming.get(opId)!.push(`Tour ${doc._id}`)
    }
    if (doc._type === 'event') {
      const orgId = refId(doc.organizer)
      if (orgId && orgIds.has(orgId)) incoming.get(orgId)!.push(`Event ${doc._id}`)
    }
    if (doc._type === 'article') {
      const aboutRefs = refIds(doc.about)
      for (const ref of aboutRefs) {
        if (orgIds.has(ref)) incoming.get(ref)!.push(`Article ${doc._id}`)
      }
    }
  }

  for (const [orgId, refs] of incoming) {
    if (refs.length === 0) {
      errors.push(`${orgId}: Organization không có quan hệ vào nào (Tour.operator, Event.organizer, Article.about) — không được publish (I18)`)
    }
  }

  return { passed: errors.length === 0, errors }
}

// ── I19: Publish cần reviewStatus=approved + approvedBy + contentProvenance; Category miễn ──
//
// Phạm vi (ADR-0008): khi chạy qua validate-constraints.ts, I19 nhận tập approved
// (cổng completeness). Check reviewStatus dưới đây là phòng vệ — chỉ kêu nếu lọt một
// doc chưa approved vào đây; với tập đúng nó im. Trọng tâm I19 trên tập approved là
// xác nhận metadata duyệt (approvedBy người thật + contentProvenance enum).

export function validateI19(docs: any[]): ValidatorResult {
  const errors = docs.flatMap(checkI19)
  return { passed: errors.length === 0, errors }
}

// ── I-FAQ-TYPE: faq item phải có _type + _key (schema enforcement) ──
//
// Faq field trong schema là `array of { type: 'faqItem' }` (named object type,
// FIX-FAQ-TYPE 2026-06-24). Mỗi item phải có `_type` và `_key` ổn định.
// Thiếu → lỗi cấu trúc (phá JSON-LD, module dịch bị báo "dạng lạ").
// Gate chỉ kiểm *có* _type (presence), KHÔNG ràng giá trị — an toàn trong cửa sổ
// migrate object→faqItem; siết `=== 'faqItem'` chỉ sau khi migrate --live xong.

export function validateI_FAQ_TYPE(docs: any[]): ValidatorResult {
  const errors: string[] = []
  const langs = ['vi', 'en', 'zh', 'ko', 'ru']

  for (const doc of docs) {
    if (!doc.faq || typeof doc.faq !== 'object') continue

    for (const lang of langs) {
      const faqArray = doc.faq[lang]
      if (!Array.isArray(faqArray)) continue

      faqArray.forEach((item, idx) => {
        if (typeof item === 'object' && !item._type) {
          errors.push(
            `${doc._id}: faq.${lang}[${idx}] thiếu _type (q: "${item.question?.substring(0, 30)}...") (I-FAQ-TYPE)`
          )
        }
        if (typeof item === 'object' && !item._key) {
          errors.push(
            `${doc._id}: faq.${lang}[${idx}] thiếu _key (q: "${item.question?.substring(0, 30)}...") (I-FAQ-TYPE)`
          )
        }
      })
    }
  }

  return { passed: errors.length === 0, errors }
}

// ── I20: Entity đã publish nên khai mình thuộc điểm đến nào (ADR-0028) ──
// Mức warn có chủ ý: thiếu ô này KHÔNG làm hỏng trang nào — document vẫn lên trang danh
// mục bình thường, chỉ không xuất hiện ở trang điểm đến nào. Đặt fail ở đây là chặn publish
// mọi nội dung chưa nạp bù, gồm cả nội dung đang chờ lên.

const I20_SCOPE = new Set([
  'place', 'attraction', 'experience', 'hotel', 'resort',
  'tour', 'article', 'restaurant', 'specialty', 'event',
])

export function validateI20(docs: any[]): ValidatorResult {
  const errors: string[] = []
  for (const doc of docs) {
    if (!I20_SCOPE.has(doc._type)) continue
    if (doc.reviewStatus !== 'approved') continue
    if (!refId(doc.destination)) {
      errors.push(`${doc._id}: ${doc._type} đã publish nhưng thiếu destination — không hiện ở trang điểm đến nào (I20)`)
    }
  }
  return { passed: errors.length === 0, errors }
}

// ── Dispatch map ──

export const VALIDATORS: Record<string, (docs: any[], prices?: Map<string, PriceEntry>) => ValidatorResult> = {
  I1: (docs) => validateI1(docs),
  I2: (docs) => validateI2(docs),
  I3: (docs) => validateI3(docs),
  I4: (docs) => validateI4(docs),
  I5: (docs) => validateI5(docs),
  I6: (docs) => validateI6(docs),
  I7: (docs) => validateI7(docs),
  I8: (docs) => validateI8(docs),
  I9: (docs) => validateI9(docs),
  I10: (docs) => validateI10(docs),
  I11: (docs) => validateI11(docs),
  I12: (docs) => validateI12(docs),
  I13: (docs) => validateI13(docs),
  I14: (docs) => validateI14(docs),
  I15: (docs) => validateI15(docs),
  I16: (docs, prices) => validateI16(docs, prices),
  I17: (docs) => validateI17(docs),
  I18: (docs) => validateI18(docs),
  I19: (docs) => validateI19(docs),
  I20: (docs) => validateI20(docs),
  'I-FAQ-TYPE': (docs) => validateI_FAQ_TYPE(docs)
}

export const VALIDATOR_LEVELS: Record<string, 'fail' | 'warn'> = {
  I1: 'fail', I2: 'fail', I3: 'fail', I4: 'fail', I5: 'fail',
  I6: 'fail', I7: 'fail', I8: 'fail', I9: 'fail', I10: 'warn',
  I11: 'fail', I12: 'fail', I13: 'fail', I14: 'fail', I15: 'fail',
  I16: 'fail', I17: 'fail', I18: 'fail', I19: 'fail', I20: 'warn',
  'I-FAQ-TYPE': 'fail'
}
