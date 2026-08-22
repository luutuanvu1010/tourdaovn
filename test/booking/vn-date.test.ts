import { describe, expect, it } from 'vitest'
import { addDaysISO, formatDateVN, isISODate, todayVN, yymmddVN } from '../../src/lib/booking/vn-date'

describe('vn-date', () => {
  it('todayVN theo giờ Việt Nam, không theo UTC', () => {
    // 2026-09-04T17:30Z = 2026-09-05 00:30 giờ VN
    expect(todayVN(new Date('2026-09-04T17:30:00Z'))).toBe('2026-09-05')
    expect(todayVN(new Date('2026-09-04T16:30:00Z'))).toBe('2026-09-04')
  })
  it('addDaysISO cộng ngày qua tháng', () => {
    expect(addDaysISO('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDaysISO('2026-02-28', 365)).toBe('2027-02-28')
  })
  it('isISODate bắt ngày ảo', () => {
    expect(isISODate('2026-09-05')).toBe(true)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('5/9/2026')).toBe(false)
  })
  it('formatDateVN dd/mm/yyyy', () => {
    expect(formatDateVN('2026-09-05')).toBe('05/09/2026')
  })
  it('yymmddVN cho mã đơn', () => {
    expect(yymmddVN(new Date('2026-09-04T17:30:00Z'))).toBe('260905')
  })
})
