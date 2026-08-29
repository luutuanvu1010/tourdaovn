// Email qua Amazon SES v2, thao tác SendEmail (QĐ-2026-08-22-07 — thay Resend: tên miền
// tourdao.vn đã verify sẵn ở SES, không mở thêm nhà cung cấp thứ hai cho một luồng thư nội bộ).
// API: POST https://email.{region}.amazonaws.com/v2/email/outbound-emails, thân JSON
// (https://docs.aws.amazon.com/ses/latest/APIReference-V2/API_SendEmail.html).
// `from` phải là địa chỉ/tên miền đã verify ở SES (runbook SPEC §6 bước 3).
//
// Khác Resend một điểm cốt lõi: SES không nhận API key, mọi lời gọi phải ký AWS Signature V4 —
// xem ./sigv4. Luật trạng thái thì giữ y như notifier cũ: thiếu bí mật là `skipped`, hỏng là
// `failed:…`, không bao giờ ném ra ngoài (đơn đã nằm trong D1 trước khi notifier chạy).
import { failed, type Notifier } from './index'
import { formatHtml, formatSubject, formatText } from './format'
import { signRequest } from './sigv4'

/** Tên dịch vụ trong phạm vi ký của SES — `ses`, không phải `email` (`email` chỉ là tiền tố
 *  máy chủ). Nguồn: metadata `signingName` trong mô hình dịch vụ sesv2 của botocore. */
const SES_SERVICE = 'ses'

export function createSesNotifier(o: {
  accessKeyId?: string
  secretAccessKey?: string
  region?: string
  to?: string
  from: string
  fetchImpl?: typeof fetch
  now?: () => Date
}): Notifier {
  const f = o.fetchImpl ?? fetch
  const now = o.now ?? (() => new Date())
  const to = (o.to ?? '').split(',').map(s => s.trim()).filter(Boolean)
  return {
    name: 'email',
    async send(b) {
      // Thiếu bất kỳ mảnh bí mật nào thì dừng TẠI ĐÂY, không gọi mạng: ký bằng khoá rỗng chỉ
      // đổi im lặng lấy một cú 403 khó đọc trong cột notify_email.
      if (!o.accessKeyId || !o.secretAccessKey || !o.region || to.length === 0) return 'skipped'
      try {
        const url = `https://email.${o.region}.amazonaws.com/v2/email/outbound-emails`
        const body = JSON.stringify({
          FromEmailAddress: o.from,
          Destination: { ToAddresses: to },
          // Bỏ HẲN khoá khi khách không cho email — SES nhận mảng rỗng nhưng gửi đi thì thừa.
          ...(b.email ? { ReplyToAddresses: [b.email] } : {}),
          Content: {
            Simple: {
              Subject: { Data: formatSubject(b), Charset: 'UTF-8' },
              Body: {
                Text: { Data: formatText(b), Charset: 'UTF-8' },
                Html: { Data: formatHtml(b), Charset: 'UTF-8' },
              },
            },
          },
        })
        // Ký sau khi thân đã cố định: chữ ký gắn với đúng chuỗi byte sẽ gửi đi.
        const headers = await signRequest({
          method: 'POST',
          url,
          headers: { 'Content-Type': 'application/json' },
          body,
          accessKeyId: o.accessKeyId,
          secretAccessKey: o.secretAccessKey,
          region: o.region,
          service: SES_SERVICE,
          now: now(),
        })
        const res = await f(url, { method: 'POST', headers, body })
        return res.ok ? 'sent' : `failed:http ${res.status}`
      } catch (e) {
        return failed(e)
      }
    },
  }
}
