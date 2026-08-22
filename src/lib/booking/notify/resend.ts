// Email qua Resend (https://resend.com/docs/api-reference/emails/send-email).
// from phải thuộc tên miền đã xác minh ở Resend (runbook SPEC §6 bước 3).
import { failed, type Notifier } from './index'
import { formatHtml, formatSubject, formatText } from './format'

export function createResendNotifier(o: { apiKey?: string; to?: string; from: string; fetchImpl?: typeof fetch }): Notifier {
  const f = o.fetchImpl ?? fetch
  const to = (o.to ?? '').split(',').map(s => s.trim()).filter(Boolean)
  return {
    name: 'email',
    async send(b) {
      if (!o.apiKey || to.length === 0) return 'skipped'
      try {
        const res = await f('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${o.apiKey}` },
          body: JSON.stringify({
            from: o.from, to, subject: formatSubject(b), text: formatText(b), html: formatHtml(b),
            ...(b.email ? { reply_to: b.email } : {}),
          }),
        })
        return res.ok ? 'sent' : `failed:http ${res.status}`
      } catch (e) {
        return failed(e)
      }
    },
  }
}
