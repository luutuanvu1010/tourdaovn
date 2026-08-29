import { describe, expect, it, vi } from 'vitest'
import { verifyTurnstile } from '../../src/lib/booking/turnstile'

describe('verifyTurnstile', () => {
  it('không có secret → ok + skipped (chỉ dev)', async () => {
    expect(await verifyTurnstile({ secret: '', token: 'x' })).toEqual({ ok: true, skipped: true })
  })
  it('có secret mà thiếu token → fail, không gọi mạng', async () => {
    const f = vi.fn() as unknown as typeof fetch
    expect(await verifyTurnstile({ secret: 's', token: '', fetchImpl: f })).toEqual({ ok: false, reason: 'missing-token' })
    expect(f).not.toHaveBeenCalled()
  })
  it('gọi siteverify với secret, response, remoteip; success → ok', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })) as unknown as typeof fetch
    expect(await verifyTurnstile({ secret: 's', token: 't', ip: '1.2.3.4', fetchImpl: f })).toEqual({ ok: true })
    const [url, init] = (f as any).mock.calls[0]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    const body = JSON.parse(init.body)
    expect(body).toEqual({ secret: 's', response: 't', remoteip: '1.2.3.4' })
  })
  it('success=false → fail kèm error-codes; mạng ném → fail', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ success: false, 'error-codes': ['timeout-or-duplicate'] }), { status: 200 })) as unknown as typeof fetch
    expect(await verifyTurnstile({ secret: 's', token: 't', fetchImpl: f })).toEqual({ ok: false, reason: 'timeout-or-duplicate' })
    const boom = vi.fn(async () => { throw new Error('down') }) as unknown as typeof fetch
    expect(await verifyTurnstile({ secret: 's', token: 't', fetchImpl: boom })).toEqual({ ok: false, reason: 'down' })
  })
})
