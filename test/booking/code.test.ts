import { describe, expect, it } from 'vitest'
import { CODE_ALPHABET, CODE_RE, generateBookingCode } from '../../src/lib/booking/code'

describe('generateBookingCode', () => {
  it('đúng định dạng TD-yymmdd-XXXX theo giờ VN', () => {
    const code = generateBookingCode(new Date('2026-09-04T17:30:00Z'))
    expect(code).toMatch(CODE_RE)
    expect(code.startsWith('TD-260905-')).toBe(true)
  })
  it('1000 mã không chứa 0 O 1 I L và chỉ dùng bảng chữ cho phép', () => {
    for (let i = 0; i < 1000; i++) {
      const tail = generateBookingCode().slice(-4)
      expect(tail).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/)
      expect(/[0O1IL]/.test(tail)).toBe(false)
    }
  })
  it('rand tiêm vào quyết định ký tự (để test xác định)', () => {
    expect(generateBookingCode(new Date('2026-09-04T17:30:00Z'), () => 0)).toBe('TD-260905-AAAA')
    const last = CODE_ALPHABET[CODE_ALPHABET.length - 1]
    expect(generateBookingCode(new Date('2026-09-04T17:30:00Z'), () => 0.999999)).toBe(`TD-260905-${last.repeat(4)}`)
  })
})
