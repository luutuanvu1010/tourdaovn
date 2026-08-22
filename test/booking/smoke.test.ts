import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

describe('migration D1', () => {
  it('tạo bảng booking với cột code UNIQUE', async () => {
    const cols = await env.BOOKING_DB.prepare('PRAGMA table_info(booking)').all<{ name: string }>()
    const names = cols.results.map(c => c.name)
    expect(names).toEqual(expect.arrayContaining(['code', 'created_at', 'tour_slug', 'depart_date', 'pax_json', 'quoted_json', 'customer_name', 'phone', 'status', 'notify_email', 'notify_zalo', 'ip_hash']))
    await env.BOOKING_DB.prepare(`INSERT INTO booking (code, created_at, tour_slug, tour_title, depart_date, pax_json, quoted_json, customer_name, phone) VALUES ('TD-260901-AAAA','2026-09-01T00:00:00Z','t','T','2026-09-05','{}','{}','A','0905123456')`).run()
    await expect(
      env.BOOKING_DB.prepare(`INSERT INTO booking (code, created_at, tour_slug, tour_title, depart_date, pax_json, quoted_json, customer_name, phone) VALUES ('TD-260901-AAAA','2026-09-01T00:00:00Z','t','T','2026-09-05','{}','{}','B','0905123457')`).run()
    ).rejects.toThrow(/UNIQUE/)
  })
})
