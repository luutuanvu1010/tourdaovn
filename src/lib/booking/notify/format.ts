// format.ts — nội dung tin báo đơn (email + Zalo). Tiếng Việt, không có giọng tiếp thị.
// Đây là nơi DUY NHẤT PII rời D1 (BK3): chỉ vào thư/tin gửi cho nhân viên.
import { formatPrice } from '../../renderer'
import { PAX_ORDER, type PaxCode } from '../quote'
import type { ProductType } from '../schema'
import { formatDateTimeVN, formatDateVN } from '../vn-date'
import type { NewBooking } from '../store'

export const PAX_LABEL_VI: Record<PaxCode, string> = {
  adult: 'Người lớn', child: 'Trẻ em', senior: 'Người cao tuổi', infant: 'Em bé',
}

// Nhân viên đọc thư phải biết ngay đơn thuộc loại sản phẩm gì (ADR-0033 §6).
const NHAN_LOAI: Record<ProductType, string> = { tour: 'tour', experience: 'trải nghiệm' }
const NHAN_DONG: Record<ProductType, string> = { tour: 'Tour', experience: 'Trải nghiệm' }

function totalGuests(b: NewBooking): number {
  return PAX_ORDER.reduce((n, c) => n + (b.pax[c] || 0), 0)
}

export function formatSubject(b: NewBooking): string {
  return `[Đặt ${NHAN_LOAI[b.productType]}] ${b.code} · ${b.tourTitle} · ${formatDateVN(b.departDate)} · ${totalGuests(b)} khách`
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

// Đơn giá nhóm (ADR-0033 §2, Task 5): quoted.perPax rỗng có chủ ý, nên paxLines() ở trên
// không in được gì cho hạng nào — nhân viên cần thấy CẢ số khách lẫn số lượt. Số lượt tính lại
// từ maxPax + tổng số khách, KHÔNG suy từ quoted.total / soLuot: sau khi áp mùa/ưu đãi phép
// chia đó ra số lẻ và bịa ra một "giá một lượt" không có thật — đúng lỗi đã khiến `tiers` bị
// loại khỏi vai giá nhóm. quoted.group.amount đã là giá một lượt ĐÃ áp mùa/ưu đãi rồi
// (xem `Quote.group`), nên in thẳng, không tính lại.
function groupLine(b: NewBooking): string | null {
  const g = b.quoted.group
  if (!g) return null
  const soLuot = Math.ceil(totalGuests(b) / g.maxPax)
  return `Số khách: ${totalGuests(b)} · ${soLuot} lượt × ${formatPrice(g.amount, 'vi')} · tổng ${formatPrice(b.quoted.total, 'vi')}`
}

export function formatText(b: NewBooking): string {
  const gLine = groupLine(b)
  const lines = [
    `Đơn đặt ${NHAN_LOAI[b.productType]} mới — ${b.code}`,
    `${NHAN_DONG[b.productType]}: ${b.tourTitle}`,
    `Ngày khởi hành: ${formatDateVN(b.departDate)}`,
    ...(gLine ? [gLine] : paxLines(b)),
    `Tạm tính: ${formatPrice(b.quoted.total, 'vi')}`,
  ]
  // Mùa đã áp (nếu có) — ghi lại vì sao ra con số tạm tính ở trên. Đây là nội dung thư/tin gửi
  // nhân viên (BK3 chỉ cấm log PII, không cấm nội dung thư như dòng này).
  if (b.quoted.season) {
    const s = b.quoted.season
    const dau = s.percent > 0 ? '+' : ''
    lines.push(`Mùa áp dụng: ${s.name} (${dau}${s.percent}%)`)
  }
  // Hình thức thanh toán khách CHỌN — không phải xác nhận đã trả tiền (ADR-0031 §2). Nhân viên
  // vẫn phải đối soát. `totalGoc` in kèm để khi khách đổi ý, người gọi đọc được ngay con số
  // thay thế, không tính nhẩm ngược qua một phép làm tròn lên.
  if (b.paymentMethod === 'transfer' && b.quoted.prepay) {
    const p = b.quoted.prepay
    lines.push(`Thanh toán: Chuyển khoản trước — đã giảm ${p.percent}% (nếu không: ${formatPrice(p.totalGoc, 'vi')})`)
  } else {
    lines.push('Thanh toán: Khi khởi hành')
  }
  lines.push(
    ``,
    `Khách: ${b.customerName}`,
    `SĐT: ${b.phone}`,
  )
  if (b.email) lines.push(`Email: ${b.email}`)
  if (b.pickup) lines.push(`Điểm đón: ${b.pickup}`)
  if (b.note) lines.push(`Ghi chú: ${b.note}`)
  // `createdAt` là ISO UTC. In nguyên si thì nhân viên đọc lệch 7 tiếng, và đơn đặt sau 17h
  // UTC còn lệch cả ngày so với chính mã đơn (mã đơn tính theo giờ Việt Nam).
  lines.push(``, `Gửi lúc: ${formatDateTimeVN(b.createdAt)} · nguồn: ${b.source}`)
  return lines.join('\n')
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string))
}

export function formatHtml(b: NewBooking): string {
  const rows = formatText(b).split('\n').filter(Boolean).map(l => `<p style="margin:0 0 6px">${escapeHtml(l)}</p>`)
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5">${rows.join('')}</div>`
}
