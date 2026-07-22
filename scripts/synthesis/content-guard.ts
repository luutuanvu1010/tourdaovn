// Chuẩn hoá I15: "thành phố Nha Trang" không còn là đơn vị hành chính sau 2025.
// Thay deterministic mọi biến thể hoa/thường "thành phố Nha Trang" → "Nha Trang".
// An toàn cả ngữ cảnh lịch sử: "thành phố Nha Trang trước đây" → "Nha Trang trước đây" (vẫn đúng).
// KHÔNG đụng "vịnh Nha Trang", "Nha Trang" đơn, hay cụm khác.
//
// Regex khớp đúng cách shared/gates/index.ts (checkI15) dò cụm, để normalizer triệt tận gốc
// thay vì lệch pattern (R4).
const PHRASE = /thành\s*phố\s*Nha\s*Trang/gi

export function normalizeI15(text: string): string {
  if (typeof text !== 'string') return text
  PHRASE.lastIndex = 0
  return text.replace(PHRASE, 'Nha Trang')
}

// Đệ quy mọi giá trị string trong object/array (prose: summary, body, highlights, faq, accessInfo),
// bảo toàn cấu trúc (chỉ sửa text leaf). Trả { value, changed: boolean }.
export function normalizeI15Deep<T>(value: T): { value: T; changed: boolean } {
  if (typeof value === 'string') {
    const next = normalizeI15(value)
    return { value: next as unknown as T, changed: next !== value }
  }

  if (Array.isArray(value)) {
    let changed = false
    const next = value.map(item => {
      const r = normalizeI15Deep(item)
      if (r.changed) changed = true
      return r.value
    })
    return { value: (changed ? next : value) as unknown as T, changed }
  }

  if (value !== null && typeof value === 'object') {
    let changed = false
    const next: Record<string, any> = { ...(value as Record<string, any>) }
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      const r = normalizeI15Deep(v)
      if (r.changed) {
        changed = true
        next[k] = r.value
      }
    }
    return { value: (changed ? next : value) as unknown as T, changed }
  }

  return { value, changed: false }
}
