import type { PriceEntry } from '../lib/price-loader.js'
import type { ValidatorResult } from './i1-i19.js'

const VALID_UNITS = new Set(['perPax', 'perRoomNight', 'perTicket'])
const COMMERCIAL_TYPES = new Set(['experience', 'tour', 'hotel', 'resort', 'attraction', 'event'])
const ALLOWED_TOP_KEYS: Record<string, Set<string>> = {
  perPax: new Set(['unit', 'amount', 'tiers']),
  perRoomNight: new Set(['unit', 'from', 'asOf']),
  perTicket: new Set(['unit', 'tickets']),
}
const ALLOWED_TIER_KEYS = new Set(['maxPax', 'amount'])
const ALLOWED_TICKET_KEYS = new Set(['name', 'amount'])
const FORBIDDEN_KEYS = /^(cost|commission|gia_von|hoa_hong|profit|margin|chiet_khau|wholesale|retail_price)$/i

// ── PY1: unit thuộc enum perPax/perRoomNight/perTicket ──

export function validatePY1(prices: Map<string, PriceEntry>): ValidatorResult {
  const errors: string[] = []
  for (const [key, entry] of prices) {
    if (!VALID_UNITS.has(entry.unit)) {
      errors.push(`${key}: unit="${entry.unit}" không thuộc enum [perPax, perRoomNight, perTicket] (PY1)`)
    }
  }
  return { passed: errors.length === 0, errors }
}

// ── PY2: hình dạng theo unit ──

export function validatePY2(prices: Map<string, PriceEntry>): ValidatorResult {
  const errors: string[] = []
  for (const [key, entry] of prices) {
    if (entry.unit === 'perPax') {
      const hasAmount = 'amount' in entry && typeof (entry as any).amount === 'number'
      const hasTiers = 'tiers' in entry && Array.isArray((entry as any).tiers) && (entry as any).tiers.length > 0
      if (!hasAmount && !hasTiers) {
        errors.push(`${key}: perPax thiếu amount hoặc tiers[] (PY2)`)
      } else if (hasAmount && hasTiers) {
        errors.push(`${key}: perPax có cả amount và tiers[], chỉ được một trong hai (PY2)`)
      }
      if (hasTiers) {
        const tiers = (entry as any).tiers
        for (let i = 0; i < tiers.length; i++) {
          const t = tiers[i]
          if (typeof t.maxPax !== 'number' || typeof t.amount !== 'number') {
            errors.push(`${key}: tiers[${i}] thiếu maxPax hoặc amount (PY2)`)
          }
        }
      }
    } else if (entry.unit === 'perRoomNight') {
      if (!('from' in entry) || typeof (entry as any).from !== 'number') {
        errors.push(`${key}: perRoomNight thiếu from (PY2)`)
      }
      if (!('asOf' in entry) || typeof (entry as any).asOf !== 'string') {
        errors.push(`${key}: perRoomNight thiếu asOf (PY2)`)
      }
    } else if (entry.unit === 'perTicket') {
      if (!('tickets' in entry) || !Array.isArray((entry as any).tickets) || (entry as any).tickets.length === 0) {
        errors.push(`${key}: perTicket thiếu tickets[] ≥1 hạng (PY2)`)
      } else {
        const tickets = (entry as any).tickets
        for (let i = 0; i < tickets.length; i++) {
          const t = tickets[i]
          if (typeof t.name !== 'string' || t.name.trim() === '') {
            errors.push(`${key}: tickets[${i}] thiếu name (PY2)`)
          }
          if (typeof t.amount !== 'number') {
            errors.push(`${key}: tickets[${i}] thiếu amount (PY2)`)
          }
        }
      }
    }
  }
  return { passed: errors.length === 0, errors }
}

// ── PY3: mọi Tour có bookingRef → dòng giá unit=perPax ──

export function validatePY3(docs: any[], prices: Map<string, PriceEntry>): ValidatorResult {
  const errors: string[] = []
  for (const doc of docs) {
    if (doc._type !== 'tour') continue
    const ref = doc.bookingRef
    if (!ref || typeof ref !== 'string') continue
    const entry = prices.get(ref)
    if (!entry) continue // PY4 handles missing refs
    if (entry.unit !== 'perPax') {
      errors.push(`${doc._id}: Tour bookingRef="${ref}" → unit=${entry.unit}, phải là perPax (PY3)`)
    }
  }
  return { passed: errors.length === 0, errors }
}

// ── PY4: toàn vẹn tham chiếu hai phía (fail: trỏ hụt; warn: mồ côi) ──

export function validatePY4(docs: any[], prices: Map<string, PriceEntry>): ValidatorResult {
  const errors: string[] = []
  let hasFail = false

  const refsFromSanity = new Set<string>()
  for (const doc of docs) {
    if (doc.bookingRef && typeof doc.bookingRef === 'string') {
      refsFromSanity.add(doc.bookingRef)
    }
  }

  // Trỏ hụt: bookingRef trong Sanity nhưng không có dòng giá → fail
  for (const doc of docs) {
    const ref = doc.bookingRef
    if (!ref || typeof ref !== 'string') continue
    if (!prices.has(ref)) {
      errors.push(`${doc._id}: bookingRef="${ref}" không có dòng giá tương ứng trong prices.yaml (PY4)`)
      hasFail = true
    }
  }

  // Dòng giá mồ côi: không entity nào trỏ → warn
  for (const key of prices.keys()) {
    if (!refsFromSanity.has(key)) {
      errors.push(`prices.yaml: dòng "${key}" không có entity nào trỏ bookingRef (PY4)`)
    }
  }

  const orphanOnly = errors.length > 0 && !hasFail
  return { passed: errors.length === 0, errors, level: orphanOnly ? 'warn' : undefined }
}

// ── PY5: entity thương mại thiếu cả bookingRef lẫn isAccessibleForFree → warn ──

export function validatePY5(docs: any[]): ValidatorResult {
  const errors: string[] = []
  for (const doc of docs) {
    if (!COMMERCIAL_TYPES.has(doc._type)) continue
    const hasBookingRef = doc.bookingRef && typeof doc.bookingRef === 'string'
    const hasFree = doc.isAccessibleForFree === true
    const hasTicketUrl = doc._type === 'event' && doc.ticketUrl && typeof doc.ticketUrl === 'string'

    if (!hasBookingRef && !hasFree && !hasTicketUrl) {
      const extra = doc._type === 'event' ? '/ticketUrl' : ''
      errors.push(`${doc._id}: ${doc._type} thiếu cả bookingRef lẫn isAccessibleForFree${extra} — có thể quên gắn giá (PY5)`)
    }
  }
  return { passed: errors.length === 0, errors }
}

// ── PY6: asOf của perRoomNight cũ > 60 ngày → warn ──

export function validatePY6(prices: Map<string, PriceEntry>): ValidatorResult {
  const errors: string[] = []
  const now = new Date()
  const STALE_DAYS = 60
  for (const [key, entry] of prices) {
    if (entry.unit !== 'perRoomNight') continue
    const e = entry as { unit: 'perRoomNight'; from: number; asOf: string }
    if (!e.asOf) continue
    const asOf = new Date(e.asOf)
    const diffMs = now.getTime() - asOf.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays > STALE_DAYS) {
      errors.push(`${key}: asOf=${e.asOf} cũ ${diffDays} ngày > ${STALE_DAYS} ngày (PY6)`)
    }
  }
  return { passed: errors.length === 0, errors }
}

// ── PY7: chỉ giá VND, số nguyên dương, khóa đúng lược đồ, cấm cost/commission ──

export function validatePY7(prices: Map<string, PriceEntry>): ValidatorResult {
  const errors: string[] = []

  for (const [key, entry] of prices) {
    const raw = entry as any

    // Kiểm khóa cấm (cost, commission...)
    for (const k of Object.keys(raw)) {
      if (FORBIDDEN_KEYS.test(k)) {
        errors.push(`${key}: chứa khóa cấm "${k}" — không được lưu giá vốn/hoa hồng (PY7)`)
      }
    }

    // Kiểm khóa không thuộc lược đồ
    const allowedTop = ALLOWED_TOP_KEYS[entry.unit]
    if (allowedTop) {
      for (const k of Object.keys(raw)) {
        if (!allowedTop.has(k) && !FORBIDDEN_KEYS.test(k)) {
          errors.push(`${key}: khóa "${k}" không thuộc lược đồ cho unit=${entry.unit} (PY7)`)
        }
      }
    }

    // Kiểm nested keys trong tiers
    if (raw.tiers && Array.isArray(raw.tiers)) {
      for (let i = 0; i < raw.tiers.length; i++) {
        for (const k of Object.keys(raw.tiers[i])) {
          if (!ALLOWED_TIER_KEYS.has(k)) {
            errors.push(`${key}: tiers[${i}] có khóa lạ "${k}" không thuộc lược đồ (PY7)`)
          }
        }
      }
    }

    // Kiểm nested keys trong tickets
    if (raw.tickets && Array.isArray(raw.tickets)) {
      for (let i = 0; i < raw.tickets.length; i++) {
        for (const k of Object.keys(raw.tickets[i])) {
          if (!ALLOWED_TICKET_KEYS.has(k)) {
            errors.push(`${key}: tickets[${i}] có khóa lạ "${k}" không thuộc lược đồ (PY7)`)
          }
        }
      }
    }

    // Kiểm số nguyên dương
    if (entry.unit === 'perPax') {
      if ('amount' in entry && typeof raw.amount === 'number') {
        if (!Number.isInteger(raw.amount) || raw.amount <= 0) {
          errors.push(`${key}: amount=${raw.amount} không phải số nguyên dương VND (PY7)`)
        }
      }
      if (raw.tiers) {
        for (let i = 0; i < raw.tiers.length; i++) {
          const a = raw.tiers[i].amount
          if (typeof a === 'number' && (!Number.isInteger(a) || a <= 0)) {
            errors.push(`${key}: tiers[${i}].amount=${a} không phải số nguyên dương VND (PY7)`)
          }
        }
      }
    } else if (entry.unit === 'perRoomNight') {
      const from = raw.from
      if (typeof from === 'number' && (!Number.isInteger(from) || from <= 0)) {
        errors.push(`${key}: from=${from} không phải số nguyên dương VND (PY7)`)
      }
    } else if (entry.unit === 'perTicket') {
      if (raw.tickets) {
        for (let i = 0; i < raw.tickets.length; i++) {
          const a = raw.tickets[i].amount
          if (typeof a === 'number' && (!Number.isInteger(a) || a <= 0)) {
            errors.push(`${key}: tickets[${i}].amount=${a} không phải số nguyên dương VND (PY7)`)
          }
        }
      }
    }
  }

  return { passed: errors.length === 0, errors }
}

// ── PY8: giá vào JSON-LD đúng map SAD §3.3 — chờ task render giá→JSON-LD + QA2 post-build ──

export function validatePY8(): ValidatorResult {
  // SAD §3.3 / PY8: "snapshot test trên output JSON-LD của build". Hai điều chặn pre-build:
  // (1) cần output build; (2) tầng render HIỆN chưa đưa giá prices.yaml vào JSON-LD (giá chỉ
  // vào HTML) — đây là nợ riêng (founder chốt 2026-06-14 hoãn, tách task render giá→JSON-LD).
  // PY8 kiểm thật ở QA2 post-build SAU khi task đó xong; chưa có entity giá nào live nên latent.
  return { passed: true, errors: [], deferred: 'QA2 post-build sau task render giá→JSON-LD (nợ riêng); SAD §3.3' }
}

// ── Dispatch map ──

export const PY_VALIDATORS: Record<string, (docs: any[], prices: Map<string, PriceEntry>) => ValidatorResult> = {
  PY1: (_docs, prices) => validatePY1(prices),
  PY2: (_docs, prices) => validatePY2(prices),
  PY3: (docs, prices) => validatePY3(docs, prices),
  PY4: (docs, prices) => validatePY4(docs, prices),
  PY5: (docs, _prices) => validatePY5(docs),
  PY6: (_docs, prices) => validatePY6(prices),
  PY7: (_docs, prices) => validatePY7(prices),
  PY8: (_docs, _prices) => validatePY8(),
}

export const PY_VALIDATOR_LEVELS: Record<string, 'fail' | 'warn'> = {
  PY1: 'fail', PY2: 'fail', PY3: 'fail', PY4: 'fail',
  PY5: 'warn', PY6: 'warn', PY7: 'fail', PY8: 'fail',
}
