// Turnstile siteverify — https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
// Thiếu secret (chỉ ở dev) → bỏ qua và báo skipped; production PHẢI có secret (SPEC §4.7).
export type TurnstileResult = { ok: true; skipped?: true } | { ok: false; reason: string }

export async function verifyTurnstile(o: { secret?: string; token?: string; ip?: string | null; fetchImpl?: typeof fetch }): Promise<TurnstileResult> {
  if (!o.secret) return { ok: true, skipped: true }
  if (!o.token) return { ok: false, reason: 'missing-token' }
  const f = o.fetchImpl ?? fetch
  try {
    const res = await f('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: o.secret, response: o.token, ...(o.ip ? { remoteip: o.ip } : {}) }),
    })
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (data.success === true) return { ok: true }
    return { ok: false, reason: (data['error-codes'] ?? ['unknown']).join(',') }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}
