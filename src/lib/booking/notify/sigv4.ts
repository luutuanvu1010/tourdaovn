// sigv4.ts — tự ký AWS Signature Version 4. Tách hẳn khỏi ses.ts để kiểm được chữ ký riêng
// bằng bộ vector chính thức của AWS (test/booking/sigv4.test.ts).
//
// Vì sao tự ký: Amazon SES không nhận API key đơn giản, mọi lời gọi phải ký SigV4; mà ADR-0027
// quyết định 5 (đính chính 2026-08-22) cấm thêm dependency runtime — không aws4fetch, không SDK
// AWS. Bốn bước dưới đây theo tài liệu AWS "Create a signed AWS API request"
// (https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv-create-signed-request.html):
// canonical request → string to sign → signing key → Authorization. Chỉ dùng `crypto.subtle`,
// có sẵn trong Workers.
//
// BK3: KHÔNG log gì trong file này. Thân request đi qua đây chứa tên và SĐT khách; một dòng
// console.log để gỡ rối cũng là PII rời khỏi D1.

const ALGO = 'AWS4-HMAC-SHA256'
const TERM = 'aws4_request'
const enc = new TextEncoder()

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Băm theo BYTE UTF-8 (TextEncoder), không theo mã đơn vị UTF-16 — thân thư đầy tiếng Việt. */
async function sha256Hex(s: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(s)))
}

// `BufferSource` chứ không phải `ArrayBuffer | Uint8Array`: bare `Uint8Array` là
// `Uint8Array<ArrayBufferLike>`, gồm cả SharedArrayBuffer, nên không khớp tham số của importKey.
async function hmac(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', k, enc.encode(data))
}

/** Date → `20150830T123600Z` (định dạng x-amz-date, bỏ mili giây). */
function amzDate(d: Date): string {
  return `${d.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`
}

/**
 * Chuỗi truy vấn chuẩn hoá: mã hoá từng khoá/giá trị rồi sắp xếp. Endpoint SES không có tham số
 * truy vấn nào, nhưng hàm này là hàm ký dùng chung nên vẫn xử lý cho đúng.
 */
function canonicalQuery(u: URL): string {
  const encode = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
  return [...u.searchParams].map(([k, v]) => `${encode(k)}=${encode(v)}`).sort().join('&')
}

/**
 * Ký một request và trả về bộ header để đưa thẳng cho `fetch`: header gọi vào, cộng
 * `x-amz-date` và `Authorization`.
 *
 * Tất định theo `now` — cùng đầu vào, cùng `now` thì cùng chữ ký; đó là điều làm nó kiểm được.
 *
 * Hai điểm dễ hiểu nhầm, ghi rõ ở đây:
 *
 * 1. SignedHeaders đúng bằng `host` + `x-amz-date` + những header người gọi truyền vào. Mặc định
 *    KHÔNG gửi kèm `x-amz-content-sha256`, vì tài liệu AWS
 *    ("Create a signed AWS API request") nói rõ hai lần: "any `x-amz-*` headers that you plan to
 *    include in your request must also be added" vào CanonicalHeaders, và phải đưa mọi header
 *    `x-amz-*` vào chữ ký. Gửi header `x-amz-*` mà không ký là tổ hợp tài liệu cấm. SES không
 *    cần header này (chỉ S3 mới bắt buộc), nên đường mặc định là không gửi.
 *
 *    Bật `signPayloadHeader` thì header vừa được gửi VỪA được ký — đúng cách S3 đòi. Đừng thêm
 *    một nhánh thứ ba "gửi mà không ký".
 *
 *    Lưu ý: thân request LUÔN được chữ ký bảo vệ dù có gửi header hay không, vì băm payload là
 *    dòng cuối của canonical request. Header đó chỉ là bản sao công khai của cùng giá trị.
 * 2. Không trả `host` trong bộ header. Workers tự đặt Host theo URL và không cho ghi đè; ta ký
 *    đúng `new URL(url).host` nên giá trị gửi đi và giá trị đã ký luôn khớp nhau.
 */
export async function signRequest(o: {
  method: string
  url: string
  headers: Record<string, string>
  body: string
  accessKeyId: string
  secretAccessKey: string
  region: string
  service: string
  now: Date
  /** Gửi kèm VÀ ký `x-amz-content-sha256` (S3 bắt buộc; SES không cần). Mặc định `false`. */
  signPayloadHeader?: boolean
}): Promise<Record<string, string>> {
  const u = new URL(o.url)
  const amz = amzDate(o.now)
  const day = amz.slice(0, 8)
  const payloadHash = await sha256Hex(o.body)

  // Giá trị header: cắt khoảng trắng đầu/cuối và ép dãy khoảng trắng về một dấu cách, theo
  // "Elements of an AWS API request signature". Tên header hạ về chữ thường và sắp xếp.
  const signed: Record<string, string> = { host: u.host, 'x-amz-date': amz }
  if (o.signPayloadHeader) signed['x-amz-content-sha256'] = payloadHash
  for (const [k, v] of Object.entries(o.headers)) signed[k.toLowerCase()] = v.trim().replace(/\s+/g, ' ')
  const names = Object.keys(signed).sort()
  const signedHeaders = names.join(';')

  // Đường dẫn lấy nguyên `pathname`: `URL` đã chuẩn hoá và mã hoá phần trăm sẵn. Bước "mã hoá
  // hai lần" mà AWS đòi cho dịch vụ ngoài S3 chỉ đổi kết quả khi đường dẫn có ký tự cần mã hoá;
  // đường dẫn SES (`/v2/email/outbound-emails`) là ASCII thuần, không có.
  const canonicalRequest = [
    o.method.toUpperCase(),
    u.pathname || '/',
    canonicalQuery(u),
    names.map(n => `${n}:${signed[n]}\n`).join(''),
    signedHeaders,
    payloadHash,
  ].join('\n')

  const scope = `${day}/${o.region}/${o.service}/${TERM}`
  const stringToSign = [ALGO, amz, scope, await sha256Hex(canonicalRequest)].join('\n')

  // Khoá ký dẫn xuất bốn nấc: ngày → vùng → dịch vụ → chuỗi kết thúc.
  let key = await hmac(enc.encode(`AWS4${o.secretAccessKey}`), day)
  key = await hmac(key, o.region)
  key = await hmac(key, o.service)
  key = await hmac(key, TERM)
  const signature = hex(await hmac(key, stringToSign))

  return {
    ...o.headers,
    'x-amz-date': amz,
    ...(o.signPayloadHeader ? { 'x-amz-content-sha256': payloadHash } : {}),
    Authorization: `${ALGO} Credential=${o.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  }
}
