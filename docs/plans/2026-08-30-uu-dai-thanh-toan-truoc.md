# Ưu đãi thanh toán trước — kế hoạch thi công

> **Cho tác nhân thi hành:** BẮT BUỘC dùng `superpowers:subagent-driven-development` (khuyến
> nghị) hoặc `superpowers:executing-plans` để chạy từng task. Các bước dùng ô tick `- [ ]`.

**Mục tiêu:** khách đặt tour chọn *"Chuyển khoản trước"* thì đơn giá **mỗi hạng khách** giảm
`x%`, `x` khai trong Sanity Studio và tắt được bằng một công tắc.

**Kiến trúc:** ưu đãi là **quy tắc giá thứ hai**, cùng tầng với mùa vụ. `computeQuote()` gộp hai
phần trăm thành một phép nhân rồi làm tròn lên nghìn **đúng một lần**. Điều kiện neo vào **lựa
chọn** của khách, không neo vào tiền đã về — site không biết khách đã trả hay chưa. Đơn ghi cột
`payment_method` (ý định) và `quoted.prepay` (lý do ra con số).

**Công nghệ:** Astro 5 · Sanity Studio v3 (`cms/`) · TypeScript · vitest (`test/booking/`) ·
Cloudflare D1.

**Đặc tả:** `docs/specs/SPEC-2026-08-30-uu-dai-thanh-toan-truoc.md`
**Quyết định:** `ADR-0031` (ĐÃ PHÊ CHUẨN 2026-08-30), `QĐ-2026-08-30-01`

## Global Constraints

Mọi task đều phải giữ, không có ngoại lệ:

- **Nhánh gốc là `main`** (đã có giá mùa vụ từ `6342262`). Cây `tourdaovn-dat-tour` đang **17
  commit sau main**, không có `season.ts` — **không thi công ở đó.**
- **`BK1`:** `src/pages/api/dat-tour.ts` và `src/lib/booking/*` **không** import
  `lib/prices.ts`, `lib/sanity.ts`, `lib/resolver.ts`. Ưu đãi đi vào form qua `TourDetail.astro`
  lúc dựng trang.
- **`BK5`:** một hàm tính giá dùng chung cho cả trình duyệt lẫn máy chủ. Không viết hai bản.
- **Làm tròn LÊN nghìn đúng MỘT lần**, ở cuối, sau khi đã nhân cả hai phần trăm.
- **Ưu đãi là số DƯƠNG nghĩa là GIẢM** (`percent: 5` = giảm 5%). Ngược với mùa vụ, nơi dương là
  tăng. Đây là chủ ý: biên tập gõ "5" cho "giảm 5%", không gõ "−5".
- **Máy chủ KHÔNG đòi `paymentMethod`.** `BK1` khiến nó không biết công tắc bật hay tắt. "Bắt
  buộc chọn" là luật của **form**. Ai siết bằng cách bắt máy chủ đòi trường này sẽ làm hỏng mọi
  đơn khi công tắc tắt.
- **Không thêm phụ thuộc lúc chạy** (`ADR-0027` quyết định 7).
- **Không đụng** `data/prices.yaml`, `resolver.ts`, khuôn nhãn giá, JSON-LD.
- Cổng phải xanh trước mỗi commit: `npx astro check` 0 errors · `npx vitest run` toàn bộ pass.
  **Không có ngoại lệ.** Bản đầu của mục này dự đoán `astro check` sẽ đỏ giữa Task 2 và Task 5.
  **Dự đoán đó sai** (kiểm thực tế 2026-08-30 sau khi Task 2 chạy xong): `handler.ts` dựng
  `NewBooking` **từng trường một**, không `spread` `BookingValid`, nên thêm một trường vào
  `BookingValid` không phá gì. Cổng xanh suốt.

  Hệ quả phải nhớ: **không có dây cột trình biên dịch nào nhắc Task 5 nối đường ghi.** Task 5
  phải tự thêm `paymentMethod` **bắt buộc** vào `NewBooking` — chính lúc đó ba chỗ dựng
  `NewBooking` mới đỏ lên. Quên bước đó thì cổng vẫn xanh và cột `payment_method` luôn ghi
  `'onboard'`, im lặng. Ca test của Task 5 là lớp bắt duy nhất.

  Dù thế nào cũng **không** được cho `paymentMethod` một giá trị mặc định trong `store.ts` —
  đó là mở một chỗ thứ hai quyết định hình thức thanh toán.

---

### Task 1: Ưu đãi vào phép tính giá

Lớp nghiệp vụ thuần. Đây là nơi luật "một phép nhân, một lần làm tròn" sống.

**Files:**
- Modify: `src/lib/booking/quote.ts`
- Test: `test/booking/quote.test.ts` (mở rộng, không tạo mới)

**Interfaces:**
- Consumes: `pickSeason`, `type Season` từ `./season` (đã có).
- Produces:
  `apDieuChinh(amount: number, seasonPct: number, prepayPct = 0): number`;
  `QuoteOptions` thêm `prepayPercent?: number` và `prepay?: boolean`;
  `Quote` thêm `prepay?: { percent: number; totalGoc: number }`.

- [ ] **Bước 1: Viết test thất bại**

Thêm vào cuối `test/booking/quote.test.ts` (giữ nguyên mọi test đang có):

```ts
describe('ưu đãi thanh toán trước', () => {
  const FLAT: PriceTable = { kind: 'flat', perPax: { adult: 430000, child: 340000 } }
  const HE: Season = { name: 'Cao điểm hè', from: '2027-06-01', to: '2027-08-31', percent: 15 }
  const MOT: PaxCounts = { adult: 1, child: 0, senior: 0, infant: 0 }

  it('không mùa, không ưu đãi → NGUYÊN giá gốc, không làm tròn', () => {
    const T: PriceTable = { kind: 'flat', perPax: { adult: 730500 } }
    expect(computeQuote(T, MOT)?.total).toBe(730500)
    expect(computeQuote(T, MOT, { prepayPercent: 5, prepay: false })?.total).toBe(730500)
  })

  it('khách KHÔNG chọn → không giảm, không có khoá prepay', () => {
    const q = computeQuote(FLAT, MOT, { prepayPercent: 5, prepay: false })
    expect(q?.total).toBe(430000)
    expect(q?.prepay).toBeUndefined()
  })

  it('công tắc tắt (0%) dù khách chọn → không giảm', () => {
    const q = computeQuote(FLAT, MOT, { prepayPercent: 0, prepay: true })
    expect(q?.total).toBe(430000)
    expect(q?.prepay).toBeUndefined()
  })

  it('chỉ ưu đãi, không mùa: 430.000 −5% → 409.000', () => {
    const q = computeQuote(FLAT, MOT, { prepayPercent: 5, prepay: true })
    expect(q?.total).toBe(409000)
    expect(q?.prepay).toEqual({ percent: 5, totalGoc: 430000 })
  })

  // CA CHỨNG MINH LUẬT — đừng đổi bộ số này cho "tròn hơn": phần lớn bộ số cho kết quả GIỐNG
  // nhau ở cả hai cách làm tròn nên không phân biệt được gì. Bộ này lệch đúng 1.000₫.
  it('mùa + ưu đãi làm tròn MỘT lần: 430.000 +15% −5% → 470.000 (hai lần ra 471.000)', () => {
    const q = computeQuote(FLAT, MOT, { seasons: [HE], departDate: '2027-07-01', prepayPercent: 5, prepay: true })
    expect(q?.total).toBe(470000)
    expect(q?.season).toEqual({ name: 'Cao điểm hè', percent: 15 })
    expect(q?.prepay).toEqual({ percent: 5, totalGoc: 495000 })
  })

  it('nhiều hạng khách: totalGoc cộng dồn đúng theo từng hạng', () => {
    const pax: PaxCounts = { adult: 2, child: 1, senior: 0, infant: 0 }
    const q = computeQuote(FLAT, pax, { prepayPercent: 5, prepay: true })
    // 430.000 → 409.000 ; 340.000 → 323.000 (ceil 323.000)
    expect(q?.total).toBe(409000 * 2 + 323000)
    expect(q?.prepay?.totalGoc).toBe(430000 * 2 + 340000)
  })

  it('bảng tiers cũng được giảm', () => {
    const T: PriceTable = { kind: 'tiers', tiers: [{ maxPax: 4, amount: 1200000 }] }
    const pax: PaxCounts = { adult: 2, child: 0, senior: 0, infant: 0 }
    const q = computeQuote(T, pax, { prepayPercent: 5, prepay: true })
    expect(q?.total).toBe(1140000 * 2)
    expect(q?.prepay).toEqual({ percent: 5, totalGoc: 2400000 })
  })

  it('hạng giá 0 vẫn 0', () => {
    const T: PriceTable = { kind: 'flat', perPax: { adult: 430000, infant: 0 } }
    const pax: PaxCounts = { adult: 1, child: 0, senior: 0, infant: 1 }
    const q = computeQuote(T, pax, { prepayPercent: 5, prepay: true })
    expect(q?.perPax.infant).toBe(0)
  })

  it('apDieuChinh: tham số thứ ba tuỳ chọn, chữ ký cũ không đổi', () => {
    expect(apDieuChinh(430000, 15)).toBe(495000)
    expect(apDieuChinh(430000, 15, 5)).toBe(470000)
    expect(apDieuChinh(730500, 0, 0)).toBe(730500)
  })
})
```

Bổ sung import ở đầu file nếu chưa có: `apDieuChinh`, `type PaxCounts`, `type PriceTable`,
`type Season`.

- [ ] **Bước 2: Chạy test cho thất bại**

Chạy: `npx vitest run test/booking/quote.test.ts`
Kỳ vọng: FAIL — `apDieuChinh` chưa nhận tham số thứ ba, `Quote` chưa có khoá `prepay`.

- [ ] **Bước 3: Viết mã tối thiểu**

Trong `src/lib/booking/quote.ts`, sửa ba khối:

```ts
export type QuoteOptions = {
  seasons?: Season[]
  departDate?: string
  /** % ưu đãi thanh toán trước — số DƯƠNG nghĩa là GIẢM (ADR-0031 §3). 0 = không có ưu đãi. */
  prepayPercent?: number
  /** khách đã chọn "chuyển khoản trước" hay chưa */
  prepay?: boolean
}

export type Quote = {
  lines: QuoteLine[]
  total: number
  perPax: Partial<Record<PaxCode, number>>
  /** Mùa đã áp, để đơn ghi lại vì sao ra con số này (ADR-0030 §3). */
  season?: { name: string; percent: number }
  /** Ưu đãi đã áp + tổng NẾU KHÔNG chọn ưu đãi (đã gồm mùa) — ADR-0031 §4. */
  prepay?: { percent: number; totalGoc: number }
}

/** Làm tròn LÊN nghìn sau khi áp CẢ HAI phần trăm (ADR-0030 §3, ADR-0031 §3). */
export function apDieuChinh(amount: number, seasonPct: number, prepayPct = 0): number {
  // Giữ tương thích ngược, đừng xoá dù trông dư: bỏ dòng này, Math.ceil bên dưới sẽ làm tròn
  // lên cả khi không có mùa lẫn ưu đãi, âm thầm đổi mọi giá gốc không phải bội số nghìn.
  // NAY PHẢI CANH HAI BIẾN, không phải một — bỏ sót `prepayPct` là mở lại đúng lỗi đó.
  if (!seasonPct && !prepayPct) return amount
  return Math.ceil((amount * (100 + seasonPct) * (100 - prepayPct)) / 10_000 / 1000) * 1000
}
```

Và `computeQuote`:

```ts
export function computeQuote(table: PriceTable, pax: PaxCounts, opts: QuoteOptions = {}): Quote | null {
  const n = totalPax(pax)
  if (n <= 0) return null

  const mua = opts.seasons && opts.departDate ? pickSeason(opts.seasons, opts.departDate) : null
  const pct = mua?.percent ?? 0
  // Ưu đãi chỉ sống khi khách CHỌN và công tắc đang bật. Hai điều kiện, không phải một.
  const uuDai = opts.prepay && typeof opts.prepayPercent === 'number' && opts.prepayPercent > 0
    ? opts.prepayPercent
    : 0
  const nhan = (x: number) => apDieuChinh(x, pct, uuDai)
  // `totalGoc` cộng dồn TRONG vòng lặp bên dưới bằng hàm này — KHÔNG gọi lại computeQuote():
  // lời gọi thứ hai có thể trả null và chọn mùa lại từ đầu, thành hai nguồn sự thật cho cùng
  // một phép. Cũng không nhân ngược từ `total`: làm tròn lên không có phép nghịch đảo.
  const khongUuDai = (x: number) => apDieuChinh(x, pct, 0)
  const kem = (q: Omit<Quote, 'season' | 'prepay'>, totalGoc: number): Quote => {
    const out: Quote = { ...q }
    if (mua) out.season = { name: mua.name, percent: mua.percent }
    if (uuDai) out.prepay = { percent: uuDai, totalGoc }
    return out
  }

  if (table.kind === 'tiers') {
    const tier = [...table.tiers].sort((a, b) => a.maxPax - b.maxPax).find(t => t.maxPax >= n)
    if (!tier) return null
    const amount = nhan(tier.amount)
    return kem({
      lines: [{ code: 'adult', count: n, amount, subtotal: amount * n }],
      total: amount * n,
      perPax: { adult: amount },
    }, khongUuDai(tier.amount) * n)
  }

  const lines: QuoteLine[] = []
  const perPax: Partial<Record<PaxCode, number>> = {}
  let totalGoc = 0
  for (const code of PAX_ORDER) {
    const count = pax[code] || 0
    if (count <= 0) continue
    const goc = table.perPax[code]
    if (typeof goc !== 'number') return null
    const amount = nhan(goc)
    lines.push({ code, count, amount, subtotal: amount * count })
    perPax[code] = amount
    totalGoc += khongUuDai(goc) * count
  }
  return kem({ lines, total: lines.reduce((s, l) => s + l.subtotal, 0), perPax }, totalGoc)
}
```

- [ ] **Bước 4: Chạy test cho pass**

Chạy: `npx vitest run test/booking/quote.test.ts && npx astro check 2>&1 | tail -3`
Kỳ vọng: toàn bộ PASS (kể cả các test mùa vụ cũ), `astro check` 0 errors.

- [ ] **Bước 5: Commit**

```bash
git add src/lib/booking/quote.ts test/booking/quote.test.ts
git commit -m "feat(gia): uu dai thanh toan truoc gap vao computeQuote, mot lan lam tron"
```

---

### Task 2: Hợp đồng payload và luật chéo

**Files:**
- Modify: `src/lib/booking/schema.ts`
- Test: `test/booking/schema.test.ts` (mở rộng)

**Interfaces:**
- Consumes: `Quote.prepay` (Task 1).
- Produces: `type PaymentMethod = 'transfer' | 'onboard'`; `Quoted` thêm
  `prepay?: { percent: number; totalGoc: number }`; `BookingInput` thêm
  `paymentMethod: PaymentMethod`; `buildQuotedPayload` nới `Pick<…, 'prepay'>`.

- [ ] **Bước 1: Viết test thất bại**

Thêm vào `test/booking/schema.test.ts`:

```ts
describe('paymentMethod và luật chéo với quoted.prepay', () => {
  const HOM_NAY = '2026-09-01'
  function payload(over: Record<string, unknown> = {}) {
    return {
      tourSlug: 'tour-3-dao', tourTitle: 'Tour 3 đảo', bookingRef: 'tour-3-dao',
      departDate: '2026-09-05', pax: { adult: 1, child: 0, senior: 0, infant: 0 },
      quoted: { perPax: { adult: 409000 }, total: 409000, quotedAt: '2026-08-30T02:00:00Z' },
      name: 'Nguyễn Văn A', phone: '0905123456', email: '', pickup: '', note: '',
      turnstileToken: 't', website: '', ...over,
    }
  }

  it('vắng paymentMethod → onboard, đơn vẫn hợp lệ (công tắc đang tắt)', () => {
    const r = validateBooking(parseBookingPayload(payload()), HOM_NAY)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.paymentMethod).toBe('onboard')
  })

  it('giá trị lạ → onboard, không ném', () => {
    const p = parseBookingPayload(payload({ paymentMethod: 'bitcoin' }))
    expect(p.paymentMethod).toBe('onboard')
  })

  it('transfer + prepay hợp lệ → nhận', () => {
    const r = validateBooking(parseBookingPayload(payload({
      paymentMethod: 'transfer',
      quoted: { perPax: { adult: 409000 }, total: 409000, quotedAt: 'x', prepay: { percent: 5, totalGoc: 430000 } },
    })), HOM_NAY)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.quoted.prepay).toEqual({ percent: 5, totalGoc: 430000 })
  })

  it('onboard mà vẫn mang giá đã giảm → 400', () => {
    const r = validateBooking(parseBookingPayload(payload({
      paymentMethod: 'onboard',
      quoted: { perPax: { adult: 409000 }, total: 409000, quotedAt: 'x', prepay: { percent: 5, totalGoc: 430000 } },
    })), HOM_NAY)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fields.quoted).toBe(MSG.quotedMismatch)
  })

  it('transfer mà không có prepay → 400', () => {
    const r = validateBooking(parseBookingPayload(payload({ paymentMethod: 'transfer' })), HOM_NAY)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fields.quoted).toBe(MSG.quotedMismatch)
  })

  it('totalGoc nhỏ hơn total → 400 (ưu đãi không thể làm giá TĂNG)', () => {
    const r = validateBooking(parseBookingPayload(payload({
      paymentMethod: 'transfer',
      quoted: { perPax: { adult: 409000 }, total: 409000, quotedAt: 'x', prepay: { percent: 5, totalGoc: 400000 } },
    })), HOM_NAY)
    expect(r.ok).toBe(false)
  })

  it('prepay sai hình dạng thì BỎ khoá — rồi luật chéo bắt được vì paymentMethod là transfer', () => {
    const p = parseBookingPayload(payload({
      paymentMethod: 'transfer',
      quoted: { perPax: { adult: 409000 }, total: 409000, quotedAt: 'x', prepay: { percent: 'năm phần trăm' } },
    }))
    expect(p.quoted.prepay).toBeUndefined()
    expect(validateBooking(p, HOM_NAY).ok).toBe(false)
  })

  it('buildQuotedPayload mang theo prepay', () => {
    const q = { perPax: { adult: 409000 }, total: 409000, prepay: { percent: 5, totalGoc: 430000 } }
    expect(buildQuotedPayload(q, 'x').prepay).toEqual({ percent: 5, totalGoc: 430000 })
    expect(buildQuotedPayload({ perPax: { adult: 1 }, total: 1 }, 'x')).not.toHaveProperty('prepay')
  })
})
```

- [ ] **Bước 2: Chạy test cho thất bại**

Chạy: `npx vitest run test/booking/schema.test.ts`
Kỳ vọng: FAIL — `paymentMethod` chưa tồn tại trên `BookingInput`.

- [ ] **Bước 3: Viết mã tối thiểu**

Trong `src/lib/booking/schema.ts`:

```ts
export type PaymentMethod = 'transfer' | 'onboard'

export type Quoted = {
  perPax: Partial<Record<PaxCode, number>>
  total: number
  quotedAt: string
  season?: { name: string; percent: number }
  /** Ưu đãi đã áp + tổng nếu KHÔNG chọn. Ghi lại, server không tính lại (BK1) — ADR-0031 §4. */
  prepay?: { percent: number; totalGoc: number }
}

export type BookingInput = {
  tourSlug: string; tourTitle: string; bookingRef: string; departDate: string
  pax: PaxCounts
  quoted: Quoted
  paymentMethod: PaymentMethod
  name: string; phone: string; email: string; pickup: string; note: string
  turnstileToken: string; website: string
}
```

`buildQuotedPayload` nới chữ ký — **bỏ bước này là lặp lại nguyên xi lỗi Task 6 của mùa vụ**
(script dựng payload rồi âm thầm rụng mất một khoá):

```ts
export function buildQuotedPayload(
  quote: Pick<Quote, 'perPax' | 'total' | 'season' | 'prepay'>,
  quotedAt: string,
): Quoted {
  return {
    perPax: quote.perPax,
    total: quote.total,
    quotedAt,
    ...(quote.season ? { season: quote.season } : {}),
    ...(quote.prepay ? { prepay: quote.prepay } : {}),
  }
}
```

Trong `parseBookingPayload`, cạnh chỗ làm sạch `season`:

```ts
  // Ưu đãi chỉ để ĐƠN GHI LẠI vì sao ra con số này — server không tin và không tính lại (BK1).
  // Sai hình dạng thì BỎ khoá, tuyệt đối không ném; luật chéo trong validateBooking mới là nơi
  // biến một payload mâu thuẫn thành 400.
  const rawPrepay = pick(r, 'quoted.prepay')
  let prepay: { percent: number; totalGoc: number } | undefined
  if (rawPrepay && typeof rawPrepay === 'object' && !Array.isArray(rawPrepay)) {
    const o = rawPrepay as Record<string, unknown>
    const percent = int(o.percent)
    const totalGoc = int(o.totalGoc)
    if (percent > 0 && percent <= 50 && totalGoc >= 0 && totalGoc <= LIMITS.TOTAL_MAX_VND) {
      prepay = { percent, totalGoc }
    }
  }
```

Và trong khối `return` của `parseBookingPayload`:

```ts
    quoted: { perPax, total: int(pick(r, 'quoted.total')), quotedAt: str(pick(r, 'quoted.quotedAt')).slice(0, 40), ...(season ? { season } : {}), ...(prepay ? { prepay } : {}) },
    paymentMethod: str(r.paymentMethod).trim() === 'transfer' ? 'transfer' : 'onboard',
```

Trong `validateBooking`, ngay **sau** khối kiểm `quotedOk` đang có:

```ts
  // Luật chéo (ADR-0031 §5). Máy chủ KHÔNG đòi `paymentMethod` — BK1 khiến nó không biết công
  // tắc ưu đãi đang bật hay tắt, nên không phân biệt được "khách bỏ qua ô bắt buộc" với "site
  // tắt ưu đãi". Nó chỉ canh sự MÂU THUẪN TỰ THÂN: một đơn không được phép mang giá đã giảm mà
  // không khai chuyển khoản, và không được khai chuyển khoản mà không có dòng giải thích.
  const pre = input.quoted.prepay
  if (pre && input.paymentMethod !== 'transfer') fields.quoted = MSG.quotedMismatch
  if (!pre && input.paymentMethod === 'transfer') fields.quoted = MSG.quotedMismatch
  if (pre && pre.totalGoc < input.quoted.total) fields.quoted = MSG.quotedMismatch
```

- [ ] **Bước 4: Chạy test cho pass**

Chạy: `npx vitest run test/booking/schema.test.ts && npx astro check 2>&1 | tail -3`

Kỳ vọng: test PASS. `astro check` **sẽ** báo lỗi ở `store.ts` và `handler.ts` — `BookingValid`
nay có `paymentMethod` mà đường ghi chưa nhận. Đó là ngoại lệ đã lường trước ở Global
Constraints, không phải hỏng. Đóng nó ở Task 5; đừng vá bằng giá trị mặc định trong `store.ts`.

Kiểm import ở đầu `test/booking/schema.test.ts` có đủ `MSG`, `buildQuotedPayload`,
`parseBookingPayload`, `validateBooking` — bổ sung nếu thiếu.

- [ ] **Bước 5: Commit**

```bash
git add src/lib/booking/schema.ts test/booking/schema.test.ts
git commit -m "feat(dat-tour): paymentMethod va quoted.prepay trong hop dong payload"
```

---

### Task 3: Hai ô mới trong Studio, và ba tài liệu đi kèm

Ba file này phải đổi **cùng một commit**: schema, `01-CONTENT_MODEL`, và bản đồ của cổng `g1`.
Lệch một chỗ là `g1` đỏ.

**Files:**
- Modify: `cms/schemas/bangGiaMuaVu.ts`
- Modify: `docs/core-specs/01-CONTENT_MODEL.md` (§2.16 và changelog cuối file)
- Modify: `scripts/meta-validators/g1-content-model-vs-schema.ts` (bảng `bangGiaMuaVu`)

**Interfaces:**
- Consumes: không có.
- Produces: hai field Sanity `batUuDai: boolean`, `phanTramUuDai: number` trên document
  `bangGiaMuaVu`.

- [ ] **Bước 1: Thêm hai ô vào schema**

Trong `cms/schemas/bangGiaMuaVu.ts`, đổi tiêu đề tài liệu và thêm fieldset:

```ts
export default defineType({
  name: 'bangGiaMuaVu',
  title: 'Quy tắc giá',
  type: 'document',
  icon: CalendarIcon,
  fieldsets: [
    { name: 'uuDai', title: 'Ưu đãi thanh toán trước', options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    // … field `muaVu` giữ NGUYÊN, không sửa …
    defineField({
      name: 'batUuDai',
      title: 'Bật ưu đãi thanh toán trước',
      type: 'boolean',
      fieldset: 'uuDai',
      initialValue: false,
      description: 'Tắt là ô chọn hình thức thanh toán biến mất khỏi mọi trang tour.',
    }),
    defineField({
      name: 'phanTramUuDai',
      title: 'Mức giảm (%)',
      type: 'number',
      fieldset: 'uuDai',
      description: 'Ví dụ 5 là giảm 5% mỗi khách khi khách chọn chuyển khoản trước. Số DƯƠNG là GIẢM (ngược với ô phần trăm của mùa). Giá sau giảm làm tròn lên nghìn.',
      validation: Rule => Rule.min(0).max(50),
    }),
  ],
  preview: { prepare: () => ({ title: 'Quy tắc giá' }) },
})
```

- [ ] **Bước 2: Khai vào `01-CONTENT_MODEL` §2.16**

Đổi câu mở đầu §2.16 (câu hiện tại chỉ nói về mùa):

```markdown
### 2.16 bangGiaMuaVu (singleton)

Bảng **quy tắc giá**: điều chỉnh theo thời gian (mùa vụ) và ưu đãi theo hình thức thanh toán.
```

Thêm hai hàng vào bảng field, ngay dưới hàng `muaVu`:

```markdown
| batUuDai | boolean | tùy | không | công tắc ưu đãi thanh toán trước; vắng hoặc `false` → không ưu đãi, ô chọn hình thức thanh toán không render (`ADR-0031` §1) | founder |
| phanTramUuDai | number | tùy | không | mức giảm khi khách chọn chuyển khoản trước, **số DƯƠNG là GIẢM** (ngược với `phanTram` của mùa); khoảng 0–50; chỉ có hiệu lực khi `batUuDai` = `true`; nhân vào giá từng hạng khách CÙNG lúc với mùa rồi làm tròn lên nghìn ĐÚNG MỘT LẦN (`ADR-0031` §3) | founder |
```

Và một dòng vào changelog cuối file:

```markdown
- v1.0.21 (2026-08-30): thêm `batUuDai` + `phanTramUuDai` vào `bangGiaMuaVu` (§2.16) — ưu đãi thanh toán trước, một con số toàn site có công tắc. **Không chứa con số tiền** — vẫn là quy tắc, `data/prices.yaml` giữ vai nguồn giá duy nhất (I1). Số DƯƠNG là GIẢM, ngược với `phanTram` của mùa, vì biên tập gõ "5" cho "giảm 5%". Bản ghi `ADR-0031` §1, `QĐ-2026-08-30-01`.
```

- [ ] **Bước 3: Mở bản đồ `g1`**

Trong `scripts/meta-validators/g1-content-model-vs-schema.ts`:

```ts
  bangGiaMuaVu: {
    muaVu: { required: false },
    batUuDai: { required: false },
    phanTramUuDai: { required: false },
  },
```

- [ ] **Bước 4: Chạy cổng**

```bash
cd scripts && node --import ./node_modules/tsx/dist/esm/index.mjs meta-validators/g1-content-model-vs-schema.ts 2>&1 | tail -8
```

(Chạy **từ trong `scripts/`** với tsx của chính gói đó — `npx tsx` ở gốc repo không tìm ra module.)

Kỳ vọng: dòng cuối vẫn là `[exit] Không có drift mức fail.` — đó là **baseline đã đo trước khi
làm Task 3**, không phải "sạch tuyệt đối": bộ này vốn có sẵn một nhúm `[WARN]` cho `siteSettings`
và `touristDestination`. Điều phải đúng là **không có dòng nào nhắc `batUuDai` hay
`phanTramUuDai`**.

Lệnh này ghi đè `scripts/reports/g1-content-model-vs-schema.json`. **Đừng commit file đó** —
commit ở bước sau chỉ liệt kê ba file của task.

- [ ] **Bước 5: Commit**

```bash
git add cms/schemas/bangGiaMuaVu.ts docs/core-specs/01-CONTENT_MODEL.md scripts/meta-validators/g1-content-model-vs-schema.ts
git commit -m "feat(cms): hai o uu dai thanh toan truoc trong Quy tac gia"
```

---

### Task 4: Đọc lúc dựng trang và nướng vào form

**Files:**
- Modify: `src/lib/queries/seasons.ts`
- Modify: `src/components/TourDetail.astro`
- Modify: `src/components/BookingForm.astro` (chỉ phần frontmatter + thuộc tính `data-`)

**Interfaces:**
- Consumes: hai field Sanity (Task 3).
- Produces: `fetchPriceRules(): Promise<{ seasons: SeasonRule[]; prepayPercent: number }>`;
  `BookingForm` nhận prop `prepayPercent?: number`; form mang `data-prepay-percent`.

- [ ] **Bước 1: Đổi truy vấn từ chiếu mảng sang chiếu tài liệu**

Hai ô mới nằm ở **cấp tài liệu**, không nằm trong mảng, nên `[0].muaVu[]{…}` không với tới.
Trong `src/lib/queries/seasons.ts`:

```ts
export type PriceRules = { seasons: SeasonRule[]; prepayPercent: number }

// Lấy theo mã cố định (_id), không theo loại tài liệu (_type) — xem chú thích cũ ở trên.
// Chiếu TÀI LIỆU rồi lấy mảng làm một khoá con: hai ô ưu đãi ở cấp tài liệu.
const QUERY = `*[_id == "bangGiaMuaVu"][0]{
  "seasons": muaVu[]{
    "name": tenMua, "from": tuNgay, "to": denNgay, "percent": phanTram,
    "apCho": coalesce(apCho, []), "truRa": coalesce(truRa, [])
  },
  "batUuDai": coalesce(batUuDai, false),
  "phanTramUuDai": coalesce(phanTramUuDai, 0)
}`

type RawDoc = { seasons: SeasonRule[] | null; batUuDai: boolean; phanTramUuDai: number }

export async function fetchPriceRules(): Promise<PriceRules> {
  const c = getClient()
  const doc = await c.fetch<RawDoc | null>(QUERY)
  if (!doc) return { seasons: [], prepayPercent: 0 }
  // Bỏ dòng thiếu trường bắt buộc thay vì để form nhận dữ liệu rác (giữ nguyên luật cũ).
  const seasons = (doc.seasons ?? []).filter(r => r && r.name && r.from && r.to && typeof r.percent === 'number')
  // Công tắc tắt và phần trăm 0 quy về CÙNG MỘT trạng thái ngay tại đây, để không tầng nào
  // bên dưới phải mang hai biến để diễn tả một ý.
  const pct = doc.batUuDai && typeof doc.phanTramUuDai === 'number' ? Math.round(doc.phanTramUuDai) : 0
  return { seasons, prepayPercent: pct > 0 && pct <= 50 ? pct : 0 }
}
```

`seasonsForKey` giữ **nguyên**, không sửa một dòng.

- [ ] **Bước 2: Đổi chỗ gọi trong `TourDetail.astro`**

```ts
import { fetchPriceRules, seasonsForKey } from '../lib/queries/seasons'
// …
const priceRules = await fetchPriceRules()
const seasons = bookingKey ? seasonsForKey(priceRules.seasons, bookingKey) : []
```

Và ở chỗ render `<BookingForm …>`, thêm một prop:

```astro
      seasons={seasons}
      prepayPercent={priceRules.prepayPercent}
```

- [ ] **Bước 3: Nhận prop và nướng vào thuộc tính**

Trong `src/components/BookingForm.astro`, phần frontmatter:

```ts
export interface Props {
  // … các prop đang có …
  prepayPercent?: number
}

const { /* … */, prepayPercent = 0 } = Astro.props
```

Và trong thẻ `<form>`, cạnh `data-seasons`:

```astro
  data-prepay-percent={String(prepayPercent)}
```

- [ ] **Bước 4: Dựng và kiểm số đã tới trang**

```bash
npx astro check 2>&1 | tail -3
npx astro build 2>&1 | grep -E "error|Complete" | tail -2
grep -o 'data-prepay-percent="[0-9]*"' dist/tour/*/index.html | head -3
```

Kỳ vọng: 0 errors; thuộc tính có mặt trong HTML đã dựng (giá trị `0` khi chưa bật ở Studio —
đó là đúng, không phải hỏng).

- [ ] **Bước 5: Commit**

```bash
git add src/lib/queries/seasons.ts src/components/TourDetail.astro src/components/BookingForm.astro
git commit -m "feat(gia): doc uu dai luc dung trang, nuong vao form"
```

---

### Task 5: Cột D1, đường ghi, và runbook

**Files:**
- Create: `migrations/0002_payment_method.sql`
- Modify: `src/lib/booking/store.ts`
- Modify: `src/lib/booking/handler.ts`
- Modify: `test/booking/store.test.ts`, `test/booking/notify.test.ts` (fixture)
- Modify: `BUILD-NOTES.md`

**Interfaces:**
- Consumes: `BookingValid.paymentMethod` (Task 2).
- Produces: `NewBooking.paymentMethod: PaymentMethod` (**bắt buộc**), `BookingRow.payment_method`.

- [ ] **Bước 1: Viết migration**

```sql
-- migrations/0002_payment_method.sql
-- Ý ĐỊNH của khách, KHÔNG phải sự thật thanh toán (ADR-0031 §2). Site không biết tiền đã về;
-- nhân viên đối soát ngân hàng ngoài hệ. Đơn cũ nhận 'onboard' — đúng sự thật lịch sử.
ALTER TABLE booking ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'onboard';
CREATE INDEX idx_booking_payment ON booking(payment_method);
```

- [ ] **Bước 2: Viết test thất bại**

Trong `test/booking/store.test.ts`, thêm `paymentMethod: 'onboard',` vào `nb()` (cạnh `source`),
rồi thêm ca test:

```ts
  it('ghi và đọc lại paymentMethod', async () => {
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-PAY1', phone: '0905000111', paymentMethod: 'transfer' }))
    const row = await getBookingByCode(env.BOOKING_DB, 'TD-260905-PAY1')
    expect(row?.payment_method).toBe('transfer')
  })

  it('đơn không khai hình thức → onboard', async () => {
    await insertBooking(env.BOOKING_DB, nb({ code: 'TD-260905-PAY2', phone: '0905000222' }))
    const row = await getBookingByCode(env.BOOKING_DB, 'TD-260905-PAY2')
    expect(row?.payment_method).toBe('onboard')
  })
```

Chạy: `npx vitest run test/booking/store.test.ts` → FAIL (cột chưa tồn tại).

- [ ] **Bước 3: Sửa `store.ts`**

```ts
import type { PaymentMethod, Quoted } from './schema'

export type NewBooking = {
  code: string; createdAt: string; tourSlug: string; tourTitle: string; bookingRef: string
  departDate: string; pax: PaxCounts; quoted: Quoted
  customerName: string; phone: string; email: string | null; pickup: string | null; note: string | null
  lang: string; source: string; paymentMethod: PaymentMethod
  ipHash: string | null; userAgent: string | null
}

export type BookingRow = {
  // … các trường đang có …
  payment_method: string
}
```

Và câu `INSERT`:

```ts
  await db.prepare(
    `INSERT INTO booking (code, created_at, tour_slug, tour_title, booking_ref, depart_date, pax_json, quoted_json,
       customer_name, phone, email, pickup, note, lang, source, ip_hash, user_agent, payment_method)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)`,
  ).bind(
    b.code, b.createdAt, b.tourSlug, b.tourTitle, b.bookingRef, b.departDate,
    JSON.stringify(b.pax), JSON.stringify(b.quoted),
    b.customerName, b.phone, b.email, b.pickup, b.note, b.lang, b.source, b.ipHash, b.userAgent,
    b.paymentMethod,
  ).run()
```

- [ ] **Bước 4: Sửa `handler.ts` và fixture còn lại**

Trong `handler.ts`, khối dựng `record`, thêm một khoá cạnh `source`:

```ts
      lang: 'vi', source: 'web', paymentMethod: v.paymentMethod, ipHash,
```

Trong `test/booking/notify.test.ts`, thêm `paymentMethod: 'onboard',` vào fixture `b` (cạnh
`source: 'web'`).

**Ba chỗ dựng `NewBooking`, không hơn — đã đếm:** `handler.ts`, `nb()` ở `store.test.ts:5`,
fixture `b` ở `notify.test.ts:8`. Nếu `astro check` báo chỗ thứ tư thì có nghĩa mã đã đổi sau
khi kế hoạch này viết ra — dừng và báo, đừng tự thêm giá trị mặc định.

- [ ] **Bước 5: Chạy cổng**

```bash
npx vitest run && npx astro check 2>&1 | tail -3
```

Kỳ vọng: toàn bộ PASS, 0 errors (mọi lỗi kiểu do Task 2 để lại nay đã đóng).

- [ ] **Bước 6: Ghi bước phát hành vào `BUILD-NOTES.md`**

Thêm vào mục runbook phát hành:

```markdown
- **Trước khi merge/push nhánh này vào `main`** (Workers Builds tự dựng theo `main`, merge
  chính là deploy — không có một lần "deploy tay đầu tiên" nào đứng trước để làm mốc): chạy
  `npx wrangler d1 migrations apply tourdao-booking --remote`. Bỏ qua thì nhánh lên `main` là
  Cloudflare tự dựng ngay, còn câu `INSERT` đã kê tên cột `payment_method` chưa tồn tại trong
  D1 production — **mọi đơn đặt tour trả về 500**, không riêng đơn chọn chuyển khoản.
```

- [ ] **Bước 7: Commit**

```bash
git add migrations/0002_payment_method.sql src/lib/booking/store.ts src/lib/booking/handler.ts test/booking/store.test.ts test/booking/notify.test.ts BUILD-NOTES.md
git commit -m "feat(dat-tour): cot payment_method trong D1 va duong ghi"
```

---

### Task 6: Hai nút chọn trên form

**Files:**
- Modify: `src/components/BookingForm.astro` (markup, script, style)
- Modify: `src/lib/uiCopy.ts` (**cả 5 bản ngôn ngữ**)
- Modify: `docs/core-specs/00-PROJECT_BRIEF.md` §3

**Interfaces:**
- Consumes: `data-prepay-percent` (Task 4); `computeQuote(table, pax, opts)` (Task 1);
  `buildQuotedPayload` (Task 2).
- Produces: trường form `paymentMethod`; hành vi: đổi lựa chọn thì tạm tính đổi theo.

- [ ] **Bước 1: Thêm bốn khoá vào `uiCopy.ts`**

`UIKey` suy ra từ khoá của bản `vi`, nên **thiếu một ngôn ngữ là `astro check` đỏ**. Năm bản:
`vi` (~dòng 69), `en` (198), `zh` (373), `ko` (548), `ru` (723).

```ts
// vi
  bookingPayLabel: 'Hình thức thanh toán',
  bookingPayTransfer: 'Chuyển khoản trước — giảm {x}%',
  bookingPayOnboard: 'Thanh toán khi khởi hành',
  bookingPayRequired: 'Chọn hình thức thanh toán.',
// en
  bookingPayLabel: 'Payment method',
  bookingPayTransfer: 'Bank transfer in advance — {x}% off',
  bookingPayOnboard: 'Pay on departure day',
  bookingPayRequired: 'Choose a payment method.',
// zh
  bookingPayLabel: '付款方式',
  bookingPayTransfer: '提前银行转账 — 立减 {x}%',
  bookingPayOnboard: '出发当天付款',
  bookingPayRequired: '请选择付款方式。',
// ko
  bookingPayLabel: '결제 방법',
  bookingPayTransfer: '사전 계좌이체 — {x}% 할인',
  bookingPayOnboard: '출발 당일 결제',
  bookingPayRequired: '결제 방법을 선택하세요.',
// ru
  bookingPayLabel: 'Способ оплаты',
  bookingPayTransfer: 'Предоплата банковским переводом — скидка {x}%',
  bookingPayOnboard: 'Оплата в день отправления',
  bookingPayRequired: 'Выберите способ оплаты.',
```

- [ ] **Bước 2: Thêm markup**

Trong `src/components/BookingForm.astro`, đặt **ngay sau** `<p class="bf__err" data-err="pax">`
và **trước** `<div class="bf__quote">` — khách chọn hình thức rồi mới nhìn con số:

```astro
    {prepayPercent > 0 && (
      <>
        <p class="bf__label" id="bf-pay-label">{t('bookingPayLabel')}</p>
        <div class="bf__pay" role="radiogroup" aria-labelledby="bf-pay-label">
          <label class="bf__pay-opt">
            <input type="radio" name="paymentMethod" value="transfer" />
            <span>{t('bookingPayTransfer').replace('{x}', String(prepayPercent))}</span>
          </label>
          <label class="bf__pay-opt">
            <input type="radio" name="paymentMethod" value="onboard" />
            <span>{t('bookingPayOnboard')}</span>
          </label>
        </div>
        <p class="bf__err" data-err="paymentMethod" aria-live="polite"></p>
      </>
    )}
```

Thêm một thuộc tính vào thẻ `<form>`, cạnh `data-error-text` (theo đúng nếp đang có: thông điệp
giao diện đi qua `data-`, không nhét vào `MSG` của API):

```astro
  data-pay-required-text={t('bookingPayRequired')}
```

Và một dòng hiện mức giảm, đặt ngay sau `<p class="bf__season" data-season hidden></p>`:

```astro
      <p class="bf__season" data-prepay hidden></p>
```

- [ ] **Bước 3: Nối vào script**

Trong `init(form)`, cạnh chỗ đọc `seasons`:

```ts
    const prepayPercent = Number(form.dataset.prepayPercent) || 0
    const payRequiredText = form.dataset.payRequiredText || ''
    const payEls = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="paymentMethod"]'))
    const chonChuyenKhoan = () => payEls.some(el => el.checked && el.value === 'transfer')
    payEls.forEach(el => el.addEventListener('change', update))
```

Trong `update()`, đổi lời gọi:

```ts
      const chon = chonChuyenKhoan()
      const uuDai = chon ? prepayPercent : 0
      quote = computeQuote(table!, pax, { seasons, departDate: dateEl.value, prepayPercent, prepay: chon })
```

Và **trong cùng hàm đó**, dòng tính lại đơn giá cho hạng chưa có khách phải truyền `uuDai`, nếu
không hạng đang ở số 0 sẽ hiện giá chưa giảm rồi **nhảy** ngay khi khách bấm "+" — đúng lỗi mà
bản vá mùa vụ ngày 2026-08-30 sinh ra để dẹp:

```ts
        const adjusted = apDieuChinh(goc, quote?.season?.percent ?? 0, uuDai)
```

Hiện mức giảm cho khách thấy, cuối `update()`:

```ts
      const prepayEl = q<HTMLElement>('[data-prepay]')!
      if (quote?.prepay) {
        prepayEl.textContent = `− ${quote.prepay.percent}% · ${formatPrice(quote.prepay.totalGoc, 'vi')} nếu thanh toán khi khởi hành`
        prepayEl.hidden = false
      } else {
        prepayEl.textContent = ''
        prepayEl.hidden = true
      }
```

Chặn ở cửa bước 2 — **luật "bắt buộc chọn" sống ở đây, không ở máy chủ**. Trong `openStep2()`,
đặt cạnh chỗ kiểm ngày:

```ts
      if (payEls.length && !payEls.some(el => el.checked)) {
        showErr('paymentMethod', payRequiredText)
        payEls[0]?.focus()
        return
      }
```

Trong khối `payload` của `submit`, thêm một khoá:

```ts
        paymentMethod: chonChuyenKhoan() ? 'transfer' : 'onboard',
```

- [ ] **Bước 4: Thêm CSS, và nhớ danh sách `[hidden]`**

`.bf__prepay` **phải** vào danh sách `display: none` ở cuối khối style — quên là khối hiện
thường trực, đúng bẫy đã ghi ở `DR-102`. Sửa dòng đang có (`~571`):

```css
  .bf__hint[hidden], .bf__done-dup[hidden], .bf__season[hidden], .bf__prepay[hidden] { display: none; }
```

Thêm, chỉ dùng token sẵn có — không viết cứng màu, cỡ, khoảng cách (luật cứng 1, `CLAUDE.md` §8):

```css
  .bf__pay { display: flex; flex-direction: column; gap: var(--s2); }
  .bf__pay-opt { display: flex; align-items: center; gap: var(--s2); min-height: 2.75rem; font-size: var(--fs-sm); }
  .bf__prepay { font-size: var(--fs-sm); color: var(--c-accent-strong); margin: 0; }
```

`min-height: 2.75rem` là đích chạm 44px — cùng con số đã chốt cho nút `+`/`−` ở `f466a4c`.

- [ ] **Bước 5: Ghi một dòng "Bổ sung" vào brief**

`docs/core-specs/00-PROJECT_BRIEF.md` §3, ngay dưới dòng bổ sung của `QĐ-2026-08-21-01`:

```markdown
> **Bổ sung 2026-08-30 (`QĐ-2026-08-30-01`, ADR-0031):** form đặt tour có thêm ô chọn **hình thức thanh toán** — *chuyển khoản trước* (giảm một mức phần trăm khai trong Studio) hoặc *thanh toán khi khởi hành*. Đây là một **điều khoản giá**, không phải cơ chế thanh toán: site không có cổng thanh toán, không nhận tiền, không biết khách đã chuyển hay chưa; nhân viên vẫn gọi lại xác nhận và tự đối soát. §5 "không thanh toán trực tuyến, không giỏ hàng, không quản lý chỗ trống" còn nguyên. Spec: `docs/specs/SPEC-2026-08-30-uu-dai-thanh-toan-truoc.md`.
```

- [ ] **Bước 6: Dựng và kiểm bằng mắt**

```bash
npx astro check 2>&1 | tail -3
npx astro build 2>&1 | grep -E "error|Complete" | tail -2
npx vitest run 2>&1 | tail -5
```

Kỳ vọng: 0 errors, toàn bộ test pass. Với `prepayPercent = 0` (chưa bật ở Studio) thì HTML dựng
ra **không** được có chuỗi `name="paymentMethod"`:

```bash
grep -c 'name="paymentMethod"' dist/tour/*/index.html | head -3
```

- [ ] **Bước 7: Commit**

```bash
git add src/components/BookingForm.astro src/lib/uiCopy.ts docs/core-specs/00-PROJECT_BRIEF.md
git commit -m "feat(dat-tour): hai nut chon hinh thuc thanh toan, tinh lai ngay tren form"
```

---

### Task 7: Dòng "Thanh toán" trong thư và tin Zalo

**Files:**
- Modify: `src/lib/booking/notify/format.ts`
- Test: `test/booking/notify.test.ts`

**Interfaces:**
- Consumes: `NewBooking.paymentMethod` (Task 5), `quoted.prepay` (Task 2).
- Produces: không có API mới. `formatHtml` dựng **từ** `formatText`, nên một chỗ sửa phủ cả thư
  HTML lẫn tin Zalo — không sửa `formatHtml`.

- [ ] **Bước 1: Viết test thất bại**

```ts
  it('đơn chuyển khoản: dòng Thanh toán có mức giảm và giá nếu không', () => {
    const t = formatText({
      ...b,
      paymentMethod: 'transfer',
      quoted: { ...b.quoted, total: 470000, prepay: { percent: 5, totalGoc: 495000 } },
    })
    expect(t).toContain('Thanh toán: Chuyển khoản trước — đã giảm 5% (nếu không: 495.000₫)')
  })

  it('đơn thường: dòng Thanh toán ngắn gọn', () => {
    expect(formatText(b)).toContain('Thanh toán: Khi khởi hành')
  })

  it('dòng Thanh toán cũng vào thư HTML (formatHtml dựng từ formatText)', () => {
    const h = formatHtml({ ...b, paymentMethod: 'transfer', quoted: { ...b.quoted, prepay: { percent: 5, totalGoc: 495000 } } })
    expect(h).toContain('đã giảm 5%')
  })
```

Chuỗi tiền theo `formatPrice(…, 'vi')` = `toLocaleString('vi-VN') + '₫'` — **không có khoảng
trắng** trước `₫` (`src/lib/renderer.ts`). Đã kiểm; dùng đúng chuỗi trên, đừng sửa `formatPrice`.

- [ ] **Bước 2: Chạy test cho thất bại**

Chạy: `npx vitest run test/booking/notify.test.ts`
Kỳ vọng: FAIL — chưa có dòng nào tên "Thanh toán".

- [ ] **Bước 3: Viết mã tối thiểu**

Trong `formatText`, ngay **sau** khối `if (b.quoted.season) { … }`:

```ts
  // Hình thức thanh toán khách CHỌN — không phải xác nhận đã trả tiền (ADR-0031 §2). Nhân viên
  // vẫn phải đối soát. `totalGoc` in kèm để khi khách đổi ý, người gọi đọc được ngay con số
  // thay thế, không tính nhẩm ngược qua một phép làm tròn lên.
  if (b.paymentMethod === 'transfer' && b.quoted.prepay) {
    const p = b.quoted.prepay
    lines.push(`Thanh toán: Chuyển khoản trước — đã giảm ${p.percent}% (nếu không: ${formatPrice(p.totalGoc, 'vi')})`)
  } else {
    lines.push('Thanh toán: Khi khởi hành')
  }
```

- [ ] **Bước 4: Chạy test cho pass**

Chạy: `npx vitest run && npx astro check 2>&1 | tail -3`
Kỳ vọng: toàn bộ PASS, 0 errors.

- [ ] **Bước 5: Commit**

```bash
git add src/lib/booking/notify/format.ts test/booking/notify.test.ts
git commit -m "feat(dat-tour): dong Thanh toan trong thu bao don va tin Zalo"
```

---

## Sau khi xong bảy task

- [ ] **Cổng toàn nhánh:** `npx astro check` 0 errors · `npx vitest run` toàn bộ pass ·
      `npx tsx scripts/meta-validators/g1-content-model-vs-schema.ts` không báo lệch ·
      `grep -rn "prices\|sanity\|resolver" src/lib/booking/ --include=*.ts | grep import` rỗng (`BK1`).
- [ ] **Migration trước khi merge/push vào `main`:**
      `npx wrangler d1 migrations apply tourdao-booking --remote`. Merge vào `main` chính là
      deploy (Workers Builds tự dựng theo `main`) — không chạy trước thì mọi đơn mới trả về
      500, không riêng đơn chọn chuyển khoản.
- [ ] **Deploy Studio:** `cd cms && npm run deploy`. Chưa deploy thì Studio vẫn hiện tài liệu
      cũ "Giá theo mùa", không có ô ưu đãi thanh toán trước.
- [ ] **Bật trong Studio:** mở *Quy tắc giá* → bật ưu đãi → đặt phần trăm → Publish.
- [ ] **Nghiệm thu trên production:** một tour **có** mùa và một tour **không** mùa; đổi qua lại
      hai nút và đối chiếu con số bằng tay; gửi một đơn thật và kiểm dòng "Thanh toán:" trong
      thư báo; kiểm `payment_method` trong D1 bằng
      `npx wrangler d1 execute tourdao-booking --remote --command "SELECT code, payment_method FROM booking ORDER BY id DESC LIMIT 5"`.
- [ ] **Ghi kết quả nghiệm thu** vào `docs/specs/SPEC-2026-08-30-uu-dai-thanh-toan-truoc.md` như
      SPEC đặt tour đã làm ở mục "4b. Kết quả nghiệm thu".
