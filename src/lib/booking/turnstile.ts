// Turnstile siteverify — https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
// Thiếu secret (chỉ ở dev) → bỏ qua và báo skipped; production PHẢI có secret (SPEC §4.7).
export type TurnstileResult = { ok: true; skipped?: true } | { ok: false; reason: string }

// Cảnh báo một lần cho mỗi isolate (SPEC §4.4, hàng `turnstileToken`: "thiếu secret ở môi
// trường → bỏ qua kiểm (chỉ dev), ghi `console.warn` một lần"). Biến sống ở phạm vi module nên
// một isolate chỉ in một dòng, không mỗi đơn một dòng.
let warnedNoSecret = false

export async function verifyTurnstile(o: { secret?: string; token?: string; ip?: string | null; fetchImpl?: typeof fetch }): Promise<TurnstileResult> {
  if (!o.secret) {
    if (!warnedNoSecret) {
      warnedNoSecret = true
      // BK3: chỉ nêu TÊN biến môi trường, không kèm bất kỳ dữ liệu nào của khách.
      // Nhánh này chỉ tới được ở dev: handler.ts từ chối nhận đơn (503) khi thiếu
      // TURNSTILE_SECRET_KEY mà không có cờ BOOKING_ALLOW_NO_TURNSTILE=1.
      console.warn('[dat-tour] TURNSTILE_SECRET_KEY chưa đặt — BỎ QUA xác minh bot (chỉ được phép ở dev)')
    }
    return { ok: true, skipped: true }
  }
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
