import { describe, expect, it, vi } from 'vitest'
import { notifyAll } from '../../src/lib/booking/notify/index'
import { formatHtml, formatSubject, formatText } from '../../src/lib/booking/notify/format'
import { createResendNotifier } from '../../src/lib/booking/notify/resend'
import { ZALO_BOT_BASE, createZaloNotifier } from '../../src/lib/booking/notify/zalo'
import type { NewBooking } from '../../src/lib/booking/store'

const b: NewBooking = {
  code: 'TD-260905-7K3Q', createdAt: '2026-09-01T03:00:00.000Z', tourSlug: 'tour-3-dao', tourTitle: 'Tour 3 đảo <Nha Trang>',
  bookingRef: 'tour-3-dao', departDate: '2026-09-05', pax: { adult: 2, child: 1, senior: 0, infant: 0 },
  quoted: { perPax: { adult: 550000, child: 350000 }, total: 1450000, quotedAt: '2026-08-21T02:00:00Z' },
  customerName: 'Nguyễn Văn A', phone: '0905123456', email: 'a@example.com', pickup: 'KS Mường Thanh', note: 'Đón 7h',
  lang: 'vi', source: 'web', ipHash: 'h', userAgent: 'ua',
}

function okFetch(status = 200, body: unknown = { ok: true, id: 'x' }) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch
}

describe('format', () => {
  it('subject gọn: mã · tour · ngày · số khách', () => {
    expect(formatSubject(b)).toBe('[Đặt tour] TD-260905-7K3Q · Tour 3 đảo <Nha Trang> · 05/09/2026 · 3 khách')
  })
  it('text đủ trường và tạm tính theo vi-VN', () => {
    const t = formatText(b)
    for (const s of ['TD-260905-7K3Q', 'Tour 3 đảo <Nha Trang>', '05/09/2026', 'Người lớn × 2', 'Trẻ em × 1', '1.450.000₫', 'Nguyễn Văn A', '0905123456', 'a@example.com', 'KS Mường Thanh', 'Đón 7h']) {
      expect(t).toContain(s)
    }
    expect(t).not.toContain('Người cao tuổi') // hạng 0 người không in
  })
  it('html escape ký tự đặc biệt', () => {
    const h = formatHtml(b)
    expect(h).toContain('Tour 3 đảo &lt;Nha Trang&gt;')
    expect(h).not.toContain('<Nha Trang>')
  })
})

describe('resend', () => {
  it('thiếu apiKey hoặc to → skipped, không gọi mạng', async () => {
    const f = okFetch()
    expect(await createResendNotifier({ apiKey: '', to: 'x@y.z', from: 'a@b.c', fetchImpl: f }).send(b)).toBe('skipped')
    expect(await createResendNotifier({ apiKey: 'k', to: '', from: 'a@b.c', fetchImpl: f }).send(b)).toBe('skipped')
    expect(f).not.toHaveBeenCalled()
  })
  it('gửi đúng endpoint, bearer, to nhiều địa chỉ, reply_to email khách → sent', async () => {
    const f = okFetch()
    const n = createResendNotifier({ apiKey: 'k', to: 'a@tourdao.vn, b@tourdao.vn', from: 'Tour Đảo <dat-tour@tourdao.vn>', fetchImpl: f })
    expect(await n.send(b)).toBe('sent')
    const [url, init] = (f as any).mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers.Authorization).toBe('Bearer k')
    const body = JSON.parse(init.body)
    expect(body.to).toEqual(['a@tourdao.vn', 'b@tourdao.vn'])
    expect(body.reply_to).toBe('a@example.com')
    expect(body.subject).toBe(formatSubject(b))
  })
  it('HTTP lỗi → failed:http <mã>; mạng ném → failed:<message>', async () => {
    expect(await createResendNotifier({ apiKey: 'k', to: 'x@y.z', from: 'a@b.c', fetchImpl: okFetch(422, { message: 'bad' }) }).send(b)).toBe('failed:http 422')
    const boom = vi.fn(async () => { throw new Error('ECONN') }) as unknown as typeof fetch
    expect(await createResendNotifier({ apiKey: 'k', to: 'x@y.z', from: 'a@b.c', fetchImpl: boom }).send(b)).toBe('failed:ECONN')
  })
})

describe('zalo', () => {
  it('thiếu token/chatIds → skipped', async () => {
    const f = okFetch()
    expect(await createZaloNotifier({ token: '', chatIds: '1', fetchImpl: f }).send(b)).toBe('skipped')
    expect(await createZaloNotifier({ token: 't', chatIds: '', fetchImpl: f }).send(b)).toBe('skipped')
    expect(f).not.toHaveBeenCalled()
  })
  it('gửi tới từng chat_id, URL có token, body {chat_id, text} → sent', async () => {
    const f = okFetch(200, { ok: true, result: {} })
    expect(await createZaloNotifier({ token: 'abc:def', chatIds: '111, 222', fetchImpl: f }).send(b)).toBe('sent')
    expect(f).toHaveBeenCalledTimes(2)
    const [url, init] = (f as any).mock.calls[0]
    expect(url).toBe(`${ZALO_BOT_BASE}/botabc:def/sendMessage`)
    const body = JSON.parse(init.body)
    expect(body.chat_id).toBe('111')
    expect(body.text).toContain('TD-260905-7K3Q')
    expect(body.text.length).toBeLessThanOrEqual(1000)
  })
  it('một chat lỗi → failed:<n>/<tổng>', async () => {
    let i = 0
    const f = vi.fn(async () => new Response(JSON.stringify(i++ === 0 ? { ok: true } : { ok: false, error_code: 400, description: 'bad' }), { status: 200 })) as unknown as typeof fetch
    expect(await createZaloNotifier({ token: 't', chatIds: '1,2', fetchImpl: f }).send(b)).toBe('failed:1/2 chat lỗi')
  })
  it('một chat ném lỗi mạng vẫn tiếp tục gửi chat còn lại → failed:<n>/<tổng>', async () => {
    let i = 0
    const f = vi.fn(async () => {
      if (i++ === 0) throw new Error('zalo down')
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }) as unknown as typeof fetch
    expect(await createZaloNotifier({ token: 't', chatIds: '1,2', fetchImpl: f }).send(b)).toBe('failed:1/2 chat lỗi')
    expect(f).toHaveBeenCalledTimes(2)
  })
})

describe('notifyAll', () => {
  it('gom theo tên, một kênh ném lỗi không kéo kênh kia', async () => {
    const r = await notifyAll([
      { name: 'email', send: async () => 'sent' },
      { name: 'zalo', send: async () => { throw new Error('boom') } },
    ], b)
    expect(r).toEqual({ email: 'sent', zalo: 'failed:boom' })
  })
})
