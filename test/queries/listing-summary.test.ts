import { describe, expect, it } from 'vitest'
import { allOrganizationsQuery } from '../../src/lib/queries/organization'
import { allHotelsQuery } from '../../src/lib/queries/hotel'
import { allResortsQuery } from '../../src/lib/queries/resort'
import { allToursQuery } from '../../src/lib/queries/tour'

// Hợp đồng: mọi truy vấn danh sách phải lấy `summary`, vì `Card.astro` render
// <p class="card-summary"> KHÔNG kiểm rỗng — thiếu field là đẻ ra một <p> rỗng
// trên URL công khai (R7 "vùng rỗng ẩn hẳn"). Đo 2026-08-31: /khach-san/ có
// 10 thẻ, cả 10 rỗng.
describe('truy vấn danh sách lấy summary', () => {
  const truyVan = {
    organization: allOrganizationsQuery,
    hotel: allHotelsQuery,
    resort: allResortsQuery,
    tour: allToursQuery,
  }

  for (const [ten, fn] of Object.entries(truyVan)) {
    it(`${ten} có "summary": summary.<lang>`, () => {
      expect(fn('vi')).toContain('"summary": summary.vi')
    })
    it(`${ten} nội suy đúng ngôn ngữ, không chép cứng vi`, () => {
      expect(fn('en')).toContain('"summary": summary.en')
      expect(fn('en')).not.toContain('summary.vi')
    })
  }
})
