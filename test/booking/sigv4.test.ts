import { describe, expect, it } from 'vitest'
import { signRequest } from '../../src/lib/booking/notify/sigv4'

// Vector kiểm LẤY TỪ NGUỒN NGOÀI, không do mã trong repo này sinh ra: bộ `aws-sig-v4-test-suite`
// chính thức của AWS (AWS General Reference), đọc qua bản sao công khai
// https://github.com/saibotsivad/aws-sig-v4-test-suite — thư mục `raw/aws-sig-v4-test-suite/`.
// Mọi chuỗi kỳ vọng bên dưới chép nguyên văn từ file `.authz` / `.creq` của bộ đó.
//
// Vì sao phải có vector ngoài: đường ghi này chưa từng chạy thật (sandbox chặn wrangler --local),
// nên chữ ký sai sẽ không lộ ra cho tới khi nghiệm thu, dưới dạng `notify_email = failed:http 403`.
// Một test tự sinh chữ ký rồi tự khẳng định nó đúng thì không chứng minh được gì.
const KEY_ID = 'AKIDEXAMPLE'
const SECRET = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
const REGION = 'us-east-1'
const SERVICE = 'service'
/** 20150830T123600Z — đúng thời điểm cả bộ vector dùng. */
const NOW = new Date('2015-08-30T12:36:00Z')

const base = { accessKeyId: KEY_ID, secretAccessKey: SECRET, region: REGION, service: SERVICE, now: NOW }

describe('signRequest — đối chiếu vector chính thức của AWS', () => {
  it('ca get-vanilla: Authorization khớp nguyên văn get-vanilla.authz', async () => {
    const h = await signRequest({ ...base, method: 'GET', url: 'https://example.amazonaws.com/', headers: {}, body: '' })
    // get-vanilla/get-vanilla.authz
    expect(h.Authorization).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, SignedHeaders=host;x-amz-date, Signature=5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31',
    )
    expect(h['x-amz-date']).toBe('20150830T123600Z')
    // Băm thân rỗng — dòng cuối của get-vanilla/get-vanilla.creq.
    expect(h['x-amz-content-sha256']).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('ca post-x-www-form-urlencoded (POST có thân): Authorization khớp nguyên văn .authz', async () => {
    // Ca này quan trọng hơn get-vanilla với SES: nó là POST có thân, tức là có đi qua đúng nhánh
    // băm payload mà lời gọi SES thật sẽ dùng.
    //
    // Cảnh báo về chính bộ vector (đã tự đối chiếu, không phải suy đoán): file
    // `post-x-www-form-urlencoded.creq` của AWS liệt kê thêm `content-length` trong canonical
    // headers, nhưng SHA-256 của chính file .creq đó (a1a6cdc4…) KHÔNG khớp dòng cuối của
    // `.sts` (42a5e5bb…). Dựng lại canonical request theo đúng SignedHeaders mà `.authz` công bố
    // — `content-type;host;x-amz-date`, không có content-length — thì ra đúng 42a5e5bb… và ký
    // tiếp ra đúng ff118979… Nghĩa là file `.creq` mới là file lỗi trong bộ vector; cặp
    // `.sts`/`.authz` mới nhất quán, và đó là cặp được dùng làm giá trị kỳ vọng ở đây.
    const h = await signRequest({
      ...base,
      method: 'POST',
      url: 'https://example.amazonaws.com/',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'Param1=value1',
    })
    // post-x-www-form-urlencoded/post-x-www-form-urlencoded.authz
    expect(h.Authorization).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=ff11897932ad3f4e8b18135d722051e5ac45fc38421b1da7b9d196a0fe09473a',
    )
    // Băm thân `Param1=value1` — dòng cuối của post-x-www-form-urlencoded.creq.
    expect(h['x-amz-content-sha256']).toBe('9095672bbd1f56dfc5b65f3e153adc8731a4a654192329106275f4c7b24d0b6e')
    // Header gọi vào giữ nguyên để đưa thẳng cho fetch.
    expect(h['Content-Type']).toBe('application/x-www-form-urlencoded')
  })

  it('ca get-header-value-trim: cắt khoảng trắng và ép dãy cách về một dấu cách', async () => {
    // Phủ đúng nhánh `.trim().replace(/\s+/g, ' ')`: `My-Header2: "a   b   c"` phải thành
    // `my-header2:"a b c"` trong canonical headers, và tên header phải hạ chữ thường + sắp xếp.
    const h = await signRequest({
      ...base,
      method: 'GET',
      url: 'https://example.amazonaws.com/',
      headers: { 'My-Header1': ' value1 ', 'My-Header2': ' "a   b   c" ' },
      body: '',
    })
    // get-header-value-trim/get-header-value-trim.authz
    expect(h.Authorization).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, SignedHeaders=host;my-header1;my-header2;x-amz-date, Signature=acc3ed3afb60bb290fc8d2dd0098b9911fcaa05412b367055dee359757a9c736',
    )
  })

  it('ca get-vanilla-query-order-key-case: tham số truy vấn được sắp xếp lại', async () => {
    // URL đưa Param2 trước Param1; canonical query phải là `Param1=value1&Param2=value2`.
    const h = await signRequest({
      ...base,
      method: 'GET',
      url: 'https://example.amazonaws.com/?Param2=value2&Param1=value1',
      headers: {},
      body: '',
    })
    // get-vanilla-query-order-key-case/get-vanilla-query-order-key-case.authz
    expect(h.Authorization).toBe(
      'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, SignedHeaders=host;x-amz-date, Signature=b97d918cfa904a5beff61c982a1b6f458b799221646efd99d3219ec94cdf2500',
    )
  })

  it('x-amz-content-sha256 được TRẢ VỀ nhưng KHÔNG nằm trong SignedHeaders', async () => {
    // Chốt lại lựa chọn thiết kế, vì nó là điều kiện để hai ca vector trên khớp: SignedHeaders
    // đúng bằng `host` + `x-amz-date` + những header người gọi truyền vào. Header băm payload
    // vẫn gửi kèm (một số dịch vụ soi nó) nhưng không ký — AWS bỏ qua header ngoài SignedHeaders.
    const h = await signRequest({ ...base, method: 'GET', url: 'https://example.amazonaws.com/', headers: {}, body: '' })
    expect(h.Authorization).toContain('SignedHeaders=host;x-amz-date,')
    expect(h.Authorization).not.toContain('x-amz-content-sha256')
    expect(h['x-amz-content-sha256']).toBeTruthy()
  })
})

describe('signRequest — tính chất', () => {
  it('cùng đầu vào + cùng now → cùng chữ ký', async () => {
    const o = { ...base, method: 'POST', url: 'https://email.ap-southeast-1.amazonaws.com/v2/email/outbound-emails', headers: { 'Content-Type': 'application/json' }, body: '{"a":1}' }
    const a = await signRequest(o)
    const b = await signRequest(o)
    expect(a.Authorization).toBe(b.Authorization)
  })

  it('đổi một byte trong thân → chữ ký đổi', async () => {
    const o = { ...base, method: 'POST', url: 'https://email.ap-southeast-1.amazonaws.com/v2/email/outbound-emails', headers: { 'Content-Type': 'application/json' }, body: '{"a":1}' }
    const a = await signRequest(o)
    const b = await signRequest({ ...o, body: '{"a":2}' })
    expect(b.Authorization).not.toBe(a.Authorization)
    expect(b['x-amz-content-sha256']).not.toBe(a['x-amz-content-sha256'])
  })

  it('đổi now → x-amz-date và chữ ký đổi theo', async () => {
    const o = { ...base, method: 'GET', url: 'https://example.amazonaws.com/', headers: {}, body: '' }
    const a = await signRequest(o)
    const b = await signRequest({ ...o, now: new Date('2015-08-31T12:36:00Z') })
    expect(b['x-amz-date']).toBe('20150831T123600Z')
    expect(b.Authorization).toContain('Credential=AKIDEXAMPLE/20150831/us-east-1/service/aws4_request')
    expect(b.Authorization).not.toBe(a.Authorization)
  })

  it('thân tiếng Việt được băm theo byte UTF-8, không theo mã đơn vị UTF-16', async () => {
    // Chuỗi 1 ký tự nhưng 3 byte UTF-8 — nếu băm nhầm theo UTF-16 thì chữ ký sẽ khác với AWS.
    const o = { ...base, method: 'POST', url: 'https://example.amazonaws.com/', headers: {}, body: 'đ' }
    const h = await signRequest(o)
    // SHA-256 của byte UTF-8 của 'đ' (0xC4 0x91). Giá trị lấy từ công cụ ngoài, không do mã này
    // sinh: `printf 'đ' | shasum -a 256` và `printf 'đ' | openssl dgst -sha256` cho cùng kết quả.
    expect(h['x-amz-content-sha256']).toBe('bf502a39582f3ed3530d27b1687b8f250a933b0526842dd148ee4ad227255427')
  })
})
