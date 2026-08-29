// code.ts — mã đơn khách giữ để tra: TD-yymmdd-XXXX (SPEC §4.4).
// 4 ký tự base32 không nhầm lẫn (bỏ 0/O/1/I/L) → 31^4 ≈ 923k mã mỗi ngày; cột `code`
// UNIQUE trong D1 là lớp chặn trùng, handler thử lại tối đa 5 lần.
import { yymmddVN } from './vn-date'

export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const CODE_RE = /^TD-\d{6}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/

function secureRandom(): number {
  // Worker và trình duyệt đều có crypto.getRandomValues; Node 22 cũng có globalThis.crypto.
  const buf = new Uint32Array(1)
  globalThis.crypto.getRandomValues(buf)
  return buf[0] / 2 ** 32
}

export function generateBookingCode(now: Date = new Date(), rand: () => number = secureRandom): string {
  let tail = ''
  for (let i = 0; i < 4; i++) {
    const idx = Math.min(CODE_ALPHABET.length - 1, Math.floor(rand() * CODE_ALPHABET.length))
    tail += CODE_ALPHABET[idx]
  }
  return `TD-${yymmddVN(now)}-${tail}`
}
