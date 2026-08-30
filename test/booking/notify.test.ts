import { describe, expect, it, vi } from 'vitest'
import { notifyAll } from '../../src/lib/booking/notify/index'
import { formatHtml, formatSubject, formatText } from '../../src/lib/booking/notify/format'
import { createSesNotifier } from '../../src/lib/booking/notify/ses'
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

  // Task 6 — mùa đã áp (Task 2: computeQuote trả Quote.season) đi vào thư nội bộ để nhân viên
  // thấy vì sao ra con số tạm tính này. Không phải log (BK3 chỉ cấm log PII, đây là nội dung thư).
  it('có mùa thì thư ghi thêm một dòng', () => {
    const withSeason: typeof b = { ...b, quoted: { ...b.quoted, season: { name: 'Lễ 30/4', percent: 30 } } }
    const t = formatText(withSeason)
    expect(t).toContain('Mùa áp dụng: Lễ 30/4 (+30%)')
  })
  it('không mùa thì không có dòng đó', () => {
    const t = formatText(b)
    expect(t).not.toContain('Mùa áp dụng')
  })
})

describe('ses', () => {
  // QĐ-2026-08-22-07: email đi qua Amazon SES, không qua Resend. Khác biệt cốt lõi là SES không
  // nhận API key — mọi lời gọi phải ký SigV4 (đúng đắn của chữ ký kiểm riêng ở sigv4.test.ts).
  const creds = { accessKeyId: 'AKIDEXAMPLE', secretAccessKey: 'sekret', region: 'ap-southeast-1' }

  it('thiếu bất kỳ bí mật nào, hoặc to rỗng → skipped, không gọi mạng', async () => {
    const f = okFetch()
    expect(await createSesNotifier({ ...creds, accessKeyId: '', to: 'x@y.z', from: 'a@b.c', fetchImpl: f }).send(b)).toBe('skipped')
    expect(await createSesNotifier({ ...creds, secretAccessKey: '', to: 'x@y.z', from: 'a@b.c', fetchImpl: f }).send(b)).toBe('skipped')
    expect(await createSesNotifier({ ...creds, region: '', to: 'x@y.z', from: 'a@b.c', fetchImpl: f }).send(b)).toBe('skipped')
    expect(await createSesNotifier({ ...creds, to: '', from: 'a@b.c', fetchImpl: f }).send(b)).toBe('skipped')
    // Khẳng định quan trọng: skipped phải là "chưa hề gọi mạng", không phải "gọi rồi bỏ kết quả".
    expect(f).not.toHaveBeenCalled()
  })

  it('gửi đúng endpoint theo vùng, ToAddresses nhiều địa chỉ, ReplyToAddresses email khách → sent', async () => {
    const f = okFetch(200, { MessageId: 'x' })
    const n = createSesNotifier({ ...creds, to: 'a@tourdao.vn, b@tourdao.vn', from: 'Tour Đảo <dat-tour@tourdao.vn>', fetchImpl: f })
    expect(await n.send(b)).toBe('sent')
    const [url, init] = (f as any).mock.calls[0]
    expect(url).toBe('https://email.ap-southeast-1.amazonaws.com/v2/email/outbound-emails')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    const body = JSON.parse(init.body)
    expect(body.FromEmailAddress).toBe('Tour Đảo <dat-tour@tourdao.vn>')
    expect(body.Destination.ToAddresses).toEqual(['a@tourdao.vn', 'b@tourdao.vn'])
    expect(body.ReplyToAddresses).toEqual(['a@example.com'])
  })

  it('thân JSON đúng hình dạng Content.Simple của SES v2', async () => {
    const f = okFetch(200, { MessageId: 'x' })
    await createSesNotifier({ ...creds, to: 'ops@tourdao.vn', from: 'a@b.c', fetchImpl: f }).send(b)
    const body = JSON.parse((f as any).mock.calls[0][1].body)
    expect(body.Content.Simple).toEqual({
      Subject: { Data: formatSubject(b), Charset: 'UTF-8' },
      Body: {
        Text: { Data: formatText(b), Charset: 'UTF-8' },
        Html: { Data: formatHtml(b), Charset: 'UTF-8' },
      },
    })
  })

  it('request được ký SigV4: Authorization là AWS4-HMAC-SHA256 đúng phạm vi ses của vùng', async () => {
    const f = okFetch(200, { MessageId: 'x' })
    const n = createSesNotifier({ ...creds, to: 'ops@tourdao.vn', from: 'a@b.c', fetchImpl: f, now: () => new Date('2026-09-01T03:00:00Z') })
    expect(await n.send(b)).toBe('sent')
    const h = (f as any).mock.calls[0][1].headers
    expect(h.Authorization).toMatch(/^AWS4-HMAC-SHA256 /)
    expect(h.Authorization).toContain('Credential=AKIDEXAMPLE/20260901/ap-southeast-1/ses/aws4_request')
    expect(h['x-amz-date']).toBe('20260901T030000Z')
    // Không gửi kèm x-amz-content-sha256: tài liệu AWS đòi mọi header `x-amz-*` có mặt đều phải
    // được ký, mà SES thì không cần header này (review Task 16, Important 1). Thân thư vẫn được
    // chữ ký bảo vệ qua dòng băm payload trong canonical request.
    expect('x-amz-content-sha256' in h).toBe(false)
  })

  it('khách không cho email → BỎ HẲN khoá ReplyToAddresses, không gửi mảng rỗng', async () => {
    const f = okFetch(200, { MessageId: 'x' })
    await createSesNotifier({ ...creds, to: 'ops@tourdao.vn', from: 'a@b.c', fetchImpl: f }).send({ ...b, email: null })
    const body = JSON.parse((f as any).mock.calls[0][1].body)
    expect('ReplyToAddresses' in body).toBe(false)
  })

  it('HTTP lỗi → failed:http <mã>; mạng ném → failed:<message>', async () => {
    expect(await createSesNotifier({ ...creds, to: 'x@y.z', from: 'a@b.c', fetchImpl: okFetch(403, { message: 'bad' }) }).send(b)).toBe('failed:http 403')
    const boom = vi.fn(async () => { throw new Error('ECONN') }) as unknown as typeof fetch
    expect(await createSesNotifier({ ...creds, to: 'x@y.z', from: 'a@b.c', fetchImpl: boom }).send(b)).toBe('failed:ECONN')
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
