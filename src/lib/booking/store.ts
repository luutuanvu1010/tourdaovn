// store.ts — lớp D1 cho bảng `booking` (migrations/0001_booking.sql). Chỉ prepared statement
// tham số hoá (security.md: "prepared statement cho mọi truy vấn"). Đây là đường GHI duy
// nhất của cả site lúc runtime (BK2).
import type { D1Database } from '@cloudflare/workers-types'
import type { PaxCounts } from './quote'
import type { PaymentMethod, ProductType, Quoted } from './schema'

export type NewBooking = {
  code: string; createdAt: string; tourSlug: string; tourTitle: string; bookingRef: string
  departDate: string; pax: PaxCounts; quoted: Quoted
  customerName: string; phone: string; email: string | null; pickup: string | null; note: string | null
  lang: string; source: string; paymentMethod: PaymentMethod; productType: ProductType
  ipHash: string | null; userAgent: string | null
}

export type BookingRow = {
  id: number; code: string; created_at: string; tour_slug: string; tour_title: string
  booking_ref: string | null; depart_date: string; pax_json: string; quoted_json: string
  customer_name: string; phone: string; email: string | null; pickup: string | null; note: string | null
  lang: string; source: string; status: string; notify_email: string | null; notify_zalo: string | null
  ip_hash: string | null; user_agent: string | null; payment_method: string; product_type: string
}

export function isUniqueViolation(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /UNIQUE constraint failed/i.test(msg)
}

export async function insertBooking(db: D1Database, b: NewBooking): Promise<void> {
  await db.prepare(
    `INSERT INTO booking (code, created_at, tour_slug, tour_title, booking_ref, depart_date, pax_json, quoted_json,
       customer_name, phone, email, pickup, note, lang, source, ip_hash, user_agent, payment_method, product_type)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)`,
  ).bind(
    b.code, b.createdAt, b.tourSlug, b.tourTitle, b.bookingRef, b.departDate,
    JSON.stringify(b.pax), JSON.stringify(b.quoted),
    b.customerName, b.phone, b.email, b.pickup, b.note, b.lang, b.source, b.ipHash, b.userAgent,
    b.paymentMethod, b.productType,
  ).run()
}

export async function findRecentDuplicate(db: D1Database, phone: string, tourSlug: string, departDate: string, sinceISO: string): Promise<string | null> {
  const row = await db.prepare(
    `SELECT code FROM booking WHERE phone = ?1 AND tour_slug = ?2 AND depart_date = ?3 AND created_at >= ?4 ORDER BY id DESC LIMIT 1`,
  ).bind(phone, tourSlug, departDate, sinceISO).first<{ code: string }>()
  return row?.code ?? null
}

export async function countRecentByIp(db: D1Database, ipHash: string, sinceISO: string): Promise<number> {
  const row = await db.prepare(
    `SELECT COUNT(*) AS n FROM booking WHERE ip_hash = ?1 AND created_at >= ?2`,
  ).bind(ipHash, sinceISO).first<{ n: number }>()
  return Number(row?.n ?? 0)
}

export async function updateNotifyStatus(db: D1Database, code: string, s: { email?: string; zalo?: string }): Promise<void> {
  if (s.email !== undefined) {
    await db.prepare(`UPDATE booking SET notify_email = ?1 WHERE code = ?2`).bind(s.email, code).run()
  }
  if (s.zalo !== undefined) {
    await db.prepare(`UPDATE booking SET notify_zalo = ?1 WHERE code = ?2`).bind(s.zalo, code).run()
  }
}

export async function getBookingByCode(db: D1Database, code: string): Promise<BookingRow | null> {
  return (await db.prepare(`SELECT * FROM booking WHERE code = ?1`).bind(code).first<BookingRow>()) ?? null
}
