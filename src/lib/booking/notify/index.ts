// Notifier cắm thêm (ADR-0027 quyết định 3). Hỏng kênh nào ghi kênh đó, không ném ra ngoài:
// đơn đã nằm trong D1 trước khi bất kỳ notifier nào chạy.
import type { NewBooking } from '../store'

export type NotifyStatus = 'sent' | 'skipped' | `failed:${string}`

export interface Notifier {
  readonly name: 'email' | 'zalo'
  send(b: NewBooking): Promise<NotifyStatus>
}

export function failed(reason: unknown): NotifyStatus {
  const msg = reason instanceof Error ? reason.message : String(reason)
  return `failed:${msg.slice(0, 120)}`
}

export async function notifyAll(notifiers: Notifier[], b: NewBooking): Promise<{ email?: NotifyStatus; zalo?: NotifyStatus }> {
  const out: { email?: NotifyStatus; zalo?: NotifyStatus } = {}
  const results = await Promise.allSettled(notifiers.map(n => n.send(b)))
  notifiers.forEach((n, i) => {
    const r = results[i]
    out[n.name] = r.status === 'fulfilled' ? r.value : failed(r.reason)
  })
  return out
}
