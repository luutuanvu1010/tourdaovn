// ── Module gate entity-local dùng chung (ADR-0011 Đợt A) ──
//
// Bóc phần luật gate THUẦN entity-local (kiểm MỘT document bằng chính field của nó) ra
// đây để cả hai luồng dùng CHUNG một nguồn (P6/N7): Node (CI/hook/build qua
// scripts/validators/i1-i19.ts) và browser (Sanity Studio qua Rule.custom — Đợt B).
//
// BROWSER-SAFE TUYỆT ĐỐI (ADR-0011 QĐ1, R2): module này KHÔNG được import fs / node:* /
// sanity client, không đọc file. Chỉ logic thuần trên object đầu vào. `import type` được
// phép (bị xoá lúc biên dịch). Nếu cần dữ liệu ngoài một document (reference tồn tại, đếm
// quan hệ, prices.yaml…) thì đó là gate DATASET-WIDE — giữ ở orchestrator, KHÔNG vào đây.
//
// Mỗi hàm checkIx(doc) trả Violation[] (chuỗi lỗi). Văn bản lỗi phải GIỮ NGUYÊN như bản
// validate-constraints cũ (R1). validateIx(docs) ở i1-i19.ts nay gọi lại các hàm này.

import type { Violation } from './types.js'

// ── Helpers (thuần, không I/O) ──

/** Trích _ref từ Sanity reference object hoặc trả về null */
export function refId(ref: any): string | null {
  if (!ref) return null
  if (typeof ref === 'string') return ref
  if (typeof ref === 'object' && ref._ref) return ref._ref
  return null
}

/** Duyệt toàn bộ giá trị text trong object lồng, trả về [(path, value), ...] */
function getAllTextValues(obj: any, prefix: string = ''): [string, string][] {
  const result: [string, string][] = []
  if (!obj || typeof obj !== 'object') return result
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof val === 'string') {
      result.push([path, val])
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      if (key === 'geo' || key === 'mainImage' || key === 'seo') continue
      result.push(...getAllTextValues(val, path))
    } else if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        if (typeof val[i] === 'string') {
          result.push([`${path}[${i}]`, val[i]])
        } else if (typeof val[i] === 'object' && val[i] !== null) {
          result.push(...getAllTextValues(val[i], `${path}[${i}]`))
        }
      }
    }
  }
  return result
}

// ── Constants ──

const PRICE_FIELD_NAMES = /^(price|gia|cost|fee|rate|fare|charge|tien|phi|money)$/i
const ALLOWED_NUMBER_FIELDS = new Set(['starRating', 'numberOfRooms', 'landArea', 'maxPax'])
const PRICE_TEXT_PATTERN = /(\d{1,3}(?:[.,]\d{3})+\s*(?:đ|d|vnđ|k|VND|VNĐ)|\d+\s*(?:đồng|ngàn|nghìn|triệu|tiền))/i
const COMMERCIAL_TYPES = new Set(['experience', 'tour', 'hotel', 'resort', 'attraction', 'event'])
// I2 ba nhánh (01-CONTENT_MODEL §2.3 v1.0.19, QĐ-2026-08-27-03).
// Hợp ba tập PHẢI phủ đúng enum attractionType: giá trị rơi ra ngoài cả ba không
// phải "được cho phép" mà là "không được kiểm".
const VENUE_ATTRACTION_TYPES = new Set(['theme-park', 'aquarium', 'mud-spa', 'market', 'park'])
const ENCYCLOPEDIC_ATTRACTION_TYPES = new Set(['historic', 'temple', 'church', 'museum'])
const EITHER_SOURCE_ATTRACTION_TYPES = new Set(['beach', 'island', 'nature', 'craft-village', 'general'])
const VALID_PROVENANCE = new Set(['human', 'ai-t1', 'mixed'])
// Denylist hẹp, tường minh: giá trị approvedBy giống tên role của API token,
// không phải tên người duyệt thật (audit V3, ADR-0008 Hệ quả). So khớp đã trim +
// case-insensitive. Giữ hẹp để KHÔNG bắt nhầm tên người thật (R4).
const APPROVED_BY_TOKEN_DENYLIST = new Set(['editor'])
const VALID_CATEGORY_SETS = new Set(['general-category', 'experience-type', 'tour-type'])
// I12-body (FIX-01, AUDIT_MERGED-2026-07-06 mục 4 P2·Bước 5 #3): ngưỡng độ dài body completeness,
// bịt kẽ "đủ field nhưng rỗng ruột" (bài 22 từ Hòn Tằm, body rỗng Bắc Nha Trang).
const MIN_BODY_CHARS = 400
const BODY_GATED_TYPES = new Set(['article', 'place', 'attraction', 'experience', 'tour'])

// ── I1: Sanity không lưu con số giá ──

export function checkI1(doc: any): Violation[] {
  const errors: Violation[] = []
  for (const [key, val] of Object.entries(doc)) {
    if (key.startsWith('_')) continue
    if (typeof val === 'number' && !ALLOWED_NUMBER_FIELDS.has(key) && PRICE_FIELD_NAMES.test(key)) {
      errors.push(`${doc._id}: number field "${key}" = ${val} — looks like a price value (I1)`)
    }
  }
  if (COMMERCIAL_TYPES.has(doc._type)) {
    for (const [path, text] of getAllTextValues(doc)) {
      if (path.includes('body') || path.includes('summary') || path.includes('description') || path.includes('highlights')) {
        if (PRICE_TEXT_PATTERN.test(text)) {
          errors.push(`${doc._id}: text field "${path}" contains price pattern — "${text.substring(0, 80)}" (I1)`)
        }
      }
    }
  }
  return errors
}

// ── I2: sameAs cho nhóm bách khoa; officialSource cho venue ──

export function checkI2(doc: any): Violation[] {
  const errors: Violation[] = []
  if (doc._type === 'place') {
    if (!doc.sameAs || !Array.isArray(doc.sameAs) || doc.sameAs.length === 0) {
      errors.push(`${doc._id}: Place thiếu sameAs (I2)`)
    }
  }
  if (doc._type === 'attraction') {
    const atype = doc.attractionType
    if (ENCYCLOPEDIC_ATTRACTION_TYPES.has(atype)) {
      if (!doc.sameAs || !Array.isArray(doc.sameAs) || doc.sameAs.length === 0) {
        errors.push(`${doc._id}: Attraction (${atype}) thuộc nhóm bách khoa, thiếu sameAs (I2)`)
      }
    } else if (VENUE_ATTRACTION_TYPES.has(atype)) {
      if (!doc.officialSource) {
        errors.push(`${doc._id}: Attraction (${atype}) venue thiếu officialSource (I2)`)
      }
    } else if (EITHER_SOURCE_ATTRACTION_TYPES.has(atype)) {
      const hasSameAs = Array.isArray(doc.sameAs) && doc.sameAs.length > 0
      if (!hasSameAs && !doc.officialSource) {
        errors.push(`${doc._id}: Attraction (${atype}) thiếu cả sameAs lẫn officialSource — cần ít nhất một (I2)`)
      }
    }
  }
  return errors
}

// ── I3: Restaurant/Hotel/Resort officialSource; Organization url+officialSource ──

export function checkI3(doc: any): Violation[] {
  const errors: Violation[] = []
  if (doc._type === 'restaurant' || doc._type === 'hotel' || doc._type === 'resort') {
    if (!doc.officialSource) {
      errors.push(`${doc._id}: ${doc._type} thiếu officialSource (I3)`)
    }
  }
  if (doc._type === 'organization') {
    if (!doc.url) errors.push(`${doc._id}: Organization thiếu url (I3)`)
    if (!doc.officialSource) {
      errors.push(`${doc._id}: Organization thiếu officialSource (I3)`)
    }
  }
  return errors
}

// ── I5: Event đủ eventType+startDate+location ──

export function checkI5(doc: any): Violation[] {
  const errors: Violation[] = []
  if (doc._type !== 'event') return errors
  if (!doc.eventType) errors.push(`${doc._id}: Event thiếu eventType (I5)`)
  if (!doc.startDate) errors.push(`${doc._id}: Event thiếu startDate (I5)`)
  if (!refId(doc.location)) {
    errors.push(`${doc._id}: Event thiếu location (I5)`)
  }
  // Không kiểm endDate quá hạn ở đây. CONTENT_MODEL §2.10 xếp việc đánh dấu past vào
  // tầng trình bày (index chia hai khối lúc build), còn eventStatus là enum schema.org
  // đóng (EventScheduled, EventPostponed, EventRescheduled, EventCancelled) không có
  // giá trị 'past'. Nhánh cũ báo fail vô điều kiện khi endDate < now và không đọc
  // eventStatus, nên không có giá trị dữ liệu nào gỡ được: mọi Event đã diễn ra sẽ
  // chặn push vĩnh viễn. Founder chốt 2026-07-31.
  return errors
}

// ── I10: summary đủ dài và cấu trúc câu (warn) ──

export function checkI10(doc: any): Violation[] {
  const errors: Violation[] = []
  const MIN_LENGTH = 50
  if (doc._type === 'category') return errors
  const summary = doc.summary
  if (!summary) {
    errors.push(`${doc._id}: thiếu summary (I10)`)
    return errors
  }
  if (typeof summary === 'object') {
    for (const lang of ['vi', 'en']) {
      const text = summary[lang]
      if (typeof text === 'string') {
        if (text.trim().length < MIN_LENGTH) {
          errors.push(`${doc._id}: summary.${lang} quá ngắn (${text.trim().length} ký tự, cần ≥${MIN_LENGTH}) (I10)`)
        }
        if (text.trim().length > 0 && text.trim()[0] !== text.trim()[0].toUpperCase()) {
          errors.push(`${doc._id}: summary.${lang} không bắt đầu bằng chữ hoa (I10)`)
        }
      }
    }
  }
  return errors
}

// ── I11: Category là từ vựng đóng ──

export function checkI11(doc: any): Violation[] {
  const errors: Violation[] = []
  if (doc._type !== 'category') return errors
  const set = doc.inDefinedTermSet
  if (!set) {
    errors.push(`${doc._id}: Category thiếu inDefinedTermSet (I11)`)
  } else if (!VALID_CATEGORY_SETS.has(set)) {
    errors.push(`${doc._id}: Category có inDefinedTermSet="${set}" không thuộc danh sách đóng [${[...VALID_CATEGORY_SETS].join(', ')}] (I11)`)
  }
  if (!doc.termCode) {
    errors.push(`${doc._id}: Category thiếu termCode (I11)`)
  }
  return errors
}

// ── I12: Không publish thiếu field bắt buộc ──

// I12 KHÔNG giữ bảng field bắt buộc riêng.
//
// Bản gốc ở nhatrangtravel có một bảng `gateFields` liệt field bắt buộc theo
// từng entity. Chép nguyên sang tourdaovn sẽ áp lại luật chặt của site kia
// (bắt buộc sameAs, body, placeType, containedInPlace…), trái với quyết định
// của chủ dự án ngày 2026-08-04 nới toàn bộ điều kiện bắt buộc sang tuỳ chọn ở
// CẢ hai tầng — schema Sanity và cổng publish (CONTENT_MODEL v1.0.12).
//
// Pha B chốt: `cms/schemas/*.ts` là nguồn sự thật duy nhất cho "field nào bắt
// buộc" (P6 + N7); `scripts/gate.config.ts` là bản dẫn xuất; file này ĐỌC từ đó
// chứ không khai lại. Xem QĐ-2026-08-06-02.
//
// Phần `conditional` của bảng cũ cũng bỏ theo: nó mã hoá tính bắt buộc của
// nhatrangtravel, và những gì nó kiểm đã có validator riêng — sameAs theo nhóm
// attraction là I2, officialSource là I3, experienceType/venue là I13,
// itinerary/operator là I14.

export function checkI12(doc: any, requiredFields: Record<string, string[]>): Violation[] {
  const errors: Violation[] = []
  const fields = requiredFields[doc._type]
  if (!fields) return errors

  for (const field of fields) {
    const val = doc[field]
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      errors.push(`${doc._id}: ${doc._type} publish thiếu field bắt buộc "${field}" (I12)`)
    }
  }
  return errors
}

/** Trích plain-text từ mảng portable text block (cùng logic portableTextToDescription). */
function plainTextFromBlocks(blocks: unknown): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return ''
  const texts: string[] = []
  for (const block of blocks) {
    if (typeof block === 'object' && block !== null) {
      const b = block as Record<string, unknown>
      if (b._type === 'block' && Array.isArray(b.children)) {
        for (const child of b.children as Record<string, unknown>[]) {
          if (child._type === 'span' && typeof child.text === 'string') {
            texts.push(child.text)
          }
        }
      }
    }
  }
  return texts.join('\n').trim()
}

/**
 * I12-body: ngưỡng độ dài body completeness cho publish (FIX-01).
 * Article lưu body dạng mảng phẳng (document-level, ADR-0004); place/attraction/experience/tour
 * lưu body dạng object theo ngôn ngữ (field-level) — chỉ kiểm "vi" vì đó là ngôn ngữ nguồn nội
 * dung, còn module dịch các ngôn ngữ khác đang gián đoạn nên không phải mục tiêu gate này.
 */
export function checkBodyLength(doc: any): Violation[] {
  const errors: Violation[] = []
  if (!BODY_GATED_TYPES.has(doc._type)) return errors
  const body = doc.body
  const text = Array.isArray(body) ? plainTextFromBlocks(body) : plainTextFromBlocks(body?.vi)
  if (text.length < MIN_BODY_CHARS) {
    errors.push(`${doc._id}: body quá ngắn (${text.length}<${MIN_BODY_CHARS}) (I12-body)`)
  }
  return errors
}

// ── I15: Cấm "thành phố Nha Trang", trừ ngữ cảnh lịch sử (cách A, DECISIONS 2026-06-15) ──
// Founder chốt: "thành phố Nha Trang" là cách gọi quen thuộc khi nói về quá khứ, nên cho phép
// khi đi kèm dấu hiệu lịch sử ("trước đây" / "trước kia" / "cũ") ngay sau cụm. Vẫn bắt nếu dùng
// ở thì hiện tại (không có dấu hiệu lịch sử). Nới một bất biến — lý do + rủi ro ghi ở DECISIONS.

// checkI15 (cấm chuỗi "thành phố Nha Trang") ĐÃ GỠ cho tourdaovn.
// I15 là luật địa danh riêng của nhatrangtravel; chủ dự án chốt 2026-08-06 nó
// không còn áp cho site này. Xem 04-CONSTRAINTS §1 và QĐ-2026-08-06-01.

export function checkI19(doc: any): Violation[] {
  const errors: Violation[] = []
  if (doc._type === 'category') return errors
  if (doc.reviewStatus !== 'approved') {
    errors.push(`${doc._id}: reviewStatus="${doc.reviewStatus}" chưa phải approved, không được publish (I19)`)
  }
  const approvedBy = typeof doc.approvedBy === 'string' ? doc.approvedBy.trim() : ''
  if (!doc.approvedBy || approvedBy === '') {
    errors.push(`${doc._id}: thiếu approvedBy (I19)`)
  } else if (APPROVED_BY_TOKEN_DENYLIST.has(approvedBy.toLowerCase())) {
    // V3: dấu vết trách nhiệm phải là người, không phải tên role token (interlock
    // có chủ ý — chỉ xanh sau khi founder sửa approvedBy ở làn Studio).
    errors.push(`${doc._id}: approvedBy="${doc.approvedBy}" là tên role của token, cần tên người duyệt thật (I19)`)
  }
  if (!doc.contentProvenance) {
    errors.push(`${doc._id}: thiếu contentProvenance (I19)`)
  } else if (!VALID_PROVENANCE.has(doc.contentProvenance)) {
    errors.push(`${doc._id}: contentProvenance="${doc.contentProvenance}" không thuộc enum [${[...VALID_PROVENANCE].join(', ')}] (I19)`)
  }
  return errors
}
