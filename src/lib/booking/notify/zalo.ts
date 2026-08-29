// Zalo Bot API — https://bot.zapps.me/docs (tài liệu chính thức dùng tên miền
// bot-api.zaloplatforms.com; SDK cộng đồng còn thấy bot-api.zapps.me — đổi ở một hằng số).
// Mọi lời gọi: POST {base}/bot{TOKEN}/{method}, JSON, trả {ok, result, error_code, description}.
// chat_id lấy bằng getUpdates sau khi nhân viên nhắn cho bot (SPEC §6 bước 4).
import { failed, type Notifier } from './index'
import { formatText } from './format'

export const ZALO_BOT_BASE = 'https://bot-api.zaloplatforms.com'
const ZALO_TEXT_MAX = 1000

export function createZaloNotifier(o: { token?: string; chatIds?: string; baseUrl?: string; fetchImpl?: typeof fetch }): Notifier {
  const f = o.fetchImpl ?? fetch
  const base = (o.baseUrl ?? ZALO_BOT_BASE).replace(/\/$/, '')
  const ids = (o.chatIds ?? '').split(',').map(s => s.trim()).filter(Boolean)
  return {
    name: 'zalo',
    async send(b) {
      if (!o.token || ids.length === 0) return 'skipped'
      const text = formatText(b).slice(0, ZALO_TEXT_MAX)
      let bad = 0
      for (const chat_id of ids) {
        try {
          const res = await f(`${base}/bot${o.token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id, text }),
          })
          const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
          if (!res.ok || data.ok !== true) bad++
        } catch (e) {
          bad++
          void failed(e) // giữ chữ ký thống nhất; lý do gom ở dưới
        }
      }
      return bad === 0 ? 'sent' : `failed:${bad}/${ids.length} chat lỗi`
    },
  }
}
