// format.ts — nội dung tin báo đơn (email + Zalo). Tiếng Việt, không có giọng tiếp thị.
// Đây là nơi DUY NHẤT PII rời D1 (BK3): chỉ vào thư/tin gửi cho nhân viên.
import { formatPrice } from '../../renderer'
import { PAX_ORDER, type PaxCode } from '../quote'
import { formatDateVN } from '../vn-date'
import type { NewBooking } from '../store'

export const PAX_LABEL_VI: Record<PaxCode, string> = {
  adult: 'Người lớn', child: 'Trẻ em', senior: 'Người cao tuổi', infant: 'Em bé',
}

function totalGuests(b: NewBooking): number {
  return PAX_ORDER.reduce((n, c) => n + (b.pax[c] || 0), 0)
}

export function formatSubject(b: NewBooking): string {
  return `[Đặt tour] ${b.code} · ${b.tourTitle} · ${formatDateVN(b.departDate)} · ${totalGuests(b)} khách`
}

function paxLines(b: NewBooking): string[] {
  const out: string[] = []
  for (const c of PAX_ORDER) {
    const n = b.pax[c] || 0
    if (n <= 0) continue
    const amount = b.quoted.perPax[c]
    out.push(`${PAX_LABEL_VI[c]} × ${n}` + (typeof amount === 'number' ? ` — ${formatPrice(amount * n, 'vi')}` : ''))
  }
  return out
}

export function formatText(b: NewBooking): string {
  const lines = [
    `Đơn đặt tour mới — ${b.code}`,
    `Tour: ${b.tourTitle}`,
    `Ngày khởi hành: ${formatDateVN(b.departDate)}`,
    ...paxLines(b),
    `Tạm tính: ${formatPrice(b.quoted.total, 'vi')}`,
    ``,
    `Khách: ${b.customerName}`,
    `SĐT: ${b.phone}`,
  ]
  if (b.email) lines.push(`Email: ${b.email}`)
  if (b.pickup) lines.push(`Điểm đón: ${b.pickup}`)
  if (b.note) lines.push(`Ghi chú: ${b.note}`)
  lines.push(``, `Gửi lúc: ${b.createdAt} · nguồn: ${b.source}`)
  return lines.join('\n')
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string))
}

export function formatHtml(b: NewBooking): string {
  const rows = formatText(b).split('\n').filter(Boolean).map(l => `<p style="margin:0 0 6px">${escapeHtml(l)}</p>`)
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5">${rows.join('')}</div>`
}
