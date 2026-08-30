# SPEC — Ưu đãi thanh toán trước bằng chuyển khoản

- **Ngày:** 2026-08-30   **Soạn:** Claude (qua Cowork)   **Duyệt QA1:** *(chờ)*
- **Quyết định chi phối:** `ADR-0031` (đề xuất 2026-08-30), `ADR-0030` §3 §5, `ADR-0027`
- **Ràng buộc:** `04-CONSTRAINTS` §1d `BK1`–`BK5`, §2 điều cấm 3
- **Nhánh gốc:** `main` tại `6342262` trở đi (đã có giá mùa vụ)

> **Cảnh báo về cây làm việc.** `tourdaovn-dat-tour` (`worktree-feat+dat-tour`) đang **17 commit
> sau `main`**, không có `season.ts`, không có `ADR-0030`. Không thi công ở đó.

## 1. Mục tiêu

Khách đặt tour chọn *"Chuyển khoản trước"* thì đơn giá **mỗi hạng khách** giảm `x%`, `x` khai
trong Sanity Studio và tắt được bằng một công tắc. Site **không** biết tiền đã về; đơn ghi lại
lựa chọn của khách và cả con số nếu khách không chọn.

## 2. Năm điểm chủ dự án chốt (phiên 2026-08-30)

1. Điều kiện là **lựa chọn** của khách, giảm ngay trên form; site không theo dõi thanh toán.
2. Ưu đãi **luôn áp**, chồng lên giá mùa.
3. `x` là **một con số toàn site**, khai trong CMS, có công tắc bật/tắt.
4. Chỉ hiện **trong form đặt tour** — nhãn giá và JSON-LD giữ giá đầy đủ.
5. Trên form là **hai nút chọn bắt buộc chọn một**, không nút nào chọn sẵn.

## 3. Không làm gì (ranh giới)

- Không trạng thái đơn mới, không hạn giữ giá, không đối soát ngân hàng (`ADR-0030` §5).
- Không đụng `data/prices.yaml`, `resolver.ts`, khuôn nhãn giá, JSON-LD.
- Không thêm phụ thuộc lúc chạy (`ADR-0027` quyết định 7).
- Không cho `src/lib/booking/*` import `prices.ts` / `sanity.ts` / `resolver.ts` (`BK1`).

## 4. Thiết kế

### 4.1 Studio: hai ô mới trong `bangGiaMuaVu`

`cms/schemas/bangGiaMuaVu.ts` — tiêu đề tài liệu đổi *"Giá theo mùa"* → *"Quy tắc giá"*, thêm
một nhóm ô **Ưu đãi thanh toán trước**:

| Ô | Kiểu | Ràng buộc Studio | Ghi chú hiện cho biên tập |
|---|---|---|---|
| `batUuDai` | boolean | — | "Tắt là ưu đãi biến mất khỏi mọi trang tour." |
| `phanTramUuDai` | number | `min(0).max(50)` | "Ví dụ 5 là giảm 5% mỗi khách khi khách chọn chuyển khoản trước." |

Kéo theo, cùng lượt: `01-CONTENT_MODEL` §2.16 và bảng `bangGiaMuaVu` trong
`scripts/meta-validators/g1-content-model-vs-schema.ts`. Lệch là cổng `g1` đỏ.

### 4.2 Đường dữ liệu vào form (lúc dựng trang)

`src/lib/queries/seasons.ts` đang chiếu **thẳng vào mảng**:
`*[_id == "bangGiaMuaVu"][0].muaVu[]{…}`. Hai ô mới nằm ở **cấp tài liệu**, không nằm trong mảng,
nên truy vấn phải chiếu tài liệu rồi lấy mảng làm một khoá con:

```groq
*[_id == "bangGiaMuaVu"][0]{
  "seasons": muaVu[]{
    "name": tenMua, "from": tuNgay, "to": denNgay, "percent": phanTram,
    "apCho": coalesce(apCho, []), "truRa": coalesce(truRa, [])
  },
  "batUuDai": coalesce(batUuDai, false),
  "phanTramUuDai": coalesce(phanTramUuDai, 0)
}
```

Vẫn **một lời gọi mạng, một tài liệu** — chỉ đổi hình dạng kết quả. Hàm đổi tên theo cho khỏi
nói dối:

```ts
fetchPriceRules(): Promise<{ seasons: SeasonRule[]; prepayPercent: number }>
```

`prepayPercent = batUuDai ? (phanTramUuDai ?? 0) : 0`. Quy về **một con số** ngay ở tầng truy
vấn: công tắc tắt và phần trăm bằng 0 là cùng một trạng thái với mọi tầng dưới, nên không tầng
nào phải mang hai biến để diễn tả một ý.

`seasonsForKey()` **không đổi**. `TourDetail.astro` đổi một dòng gọi hàm, rồi truyền
`prepayPercent` xuống `BookingForm.astro` như đang truyền `seasons`.

Giữ nguyên chú thích đang có ở đầu file: mã tài liệu `bangGiaMuaVu` phải khớp
`documentId('bangGiaMuaVu')` trong `cms/lib/structure.ts` — đổi một chỗ là phải đổi cả hai.

### 4.3 Lớp nghiệp vụ: `quote.ts`

```ts
export type QuoteOptions = {
  seasons?: Season[]
  departDate?: string
  /** % ưu đãi thanh toán trước — số DƯƠNG nghĩa là GIẢM. 0 = không có ưu đãi */
  prepayPercent?: number
  /** khách đã chọn "chuyển khoản trước" hay chưa */
  prepay?: boolean
}

export type Quote = {
  lines: QuoteLine[]
  total: number
  perPax: Partial<Record<PaxCode, number>>
  season?: { name: string; percent: number }
  /** chỉ có mặt khi prepay === true VÀ prepayPercent > 0 */
  prepay?: { percent: number; totalGoc: number }
}

export function apDieuChinh(amount: number, seasonPct: number, prepayPct = 0): number {
  if (!seasonPct && !prepayPct) return amount
  return Math.ceil((amount * (100 + seasonPct) * (100 - prepayPct)) / 10_000 / 1000) * 1000
}
```

**Luật:**

1. Tham số thứ ba **tuỳ chọn** → chữ ký cũ và mọi test mùa vụ hiện có không đổi một dòng.
2. Cả hai phần trăm bằng 0 → trả **nguyên giá gốc**, không làm tròn. Dòng bảo vệ này đã cứu giá
   mùa vụ khỏi tự làm tròn mọi giá gốc không phải bội số nghìn; nay nó phải canh **hai** biến,
   không phải một. Bỏ sót là âm thầm đổi giá của 29 tour.
3. **Một lần làm tròn**, ở cuối, sau khi đã nhân cả hai phần trăm.
4. `totalGoc` cộng dồn **trong chính vòng lặp đang có**, bằng một biến chạy song song:

   ```ts
   totalGoc += apDieuChinh(goc, pct, 0) * count       // nhánh flat
   totalGoc  = apDieuChinh(tier.amount, pct, 0) * n    // nhánh tiers
   ```

   **Không gọi lại `computeQuote()`** để lấy con số này. Lời gọi thứ hai có thể trả `null`, và
   nó chọn mùa lại từ đầu — hai nguồn sự thật cho cùng một phép, đúng thứ `BK5` sinh ra để cấm.
   Không nhân ngược từ `total`: làm tròn lên không có phép nghịch đảo.
5. **Cả hai nhánh `flat` và `tiers`** đều áp ưu đãi. Bỏ sót nhánh `tiers` thì tour bán theo bậc
   số khách âm thầm không được giảm, mà không cổng nào đỏ.
6. Hạng giá 0 vẫn 0.

### 4.4 Hợp đồng payload và luật kiểm: `schema.ts`

```ts
export type PaymentMethod = 'transfer' | 'onboard'
export type Quoted = { …, prepay?: { percent: number; totalGoc: number } }
export type BookingInput = { …, paymentMethod: PaymentMethod }
```

`parseBookingPayload()`:

- `paymentMethod`: nhận `'transfer'` nếu bằng đúng chuỗi đó, **mọi giá trị khác → `'onboard'`**.
- `quoted.prepay`: làm sạch như `quoted.season` đang làm — sai hình dạng thì **bỏ khoá**, tuyệt
  đối không ném. Nhận khi `percent` là số nguyên `0..50` và `totalGoc` là số nguyên `≥ 0`.

`validateBooking()` — **một luật mới duy nhất**:

| Tình huống | Kết quả |
|---|---|
| có `quoted.prepay` và `paymentMethod === 'transfer'` | hợp lệ |
| có `quoted.prepay` và `paymentMethod === 'onboard'` | `fields.quoted = MSG.quotedMismatch` → 400 |
| `paymentMethod === 'transfer'`, không có `quoted.prepay` hợp lệ | `fields.quoted = MSG.quotedMismatch` → 400 |
| không `quoted.prepay`, `paymentMethod === 'onboard'` | hợp lệ (đường của mọi đơn hôm nay) |
| `totalGoc < total` | `fields.quoted = MSG.quotedMismatch` → 400 |

**Không đổi:** phép kiểm `total === Σ(perPax × count)` bằng `computeQuote({kind:'flat', perPax})`.
Ưu đãi đã gấp vào `perPax` nên phép kiểm đứng nguyên. `BK5` nguyên vẹn.

**Máy chủ không đòi `paymentMethod`.** `BK1` cấm nó đọc Sanity, nên nó không biết công tắc đang
bật hay tắt và không thể phân biệt "khách bỏ qua ô bắt buộc" với "site tắt ưu đãi". Bắt buộc
chọn là luật của **form** (§4.6). Đây là chủ ý, không phải thiếu sót — ai định "siết cho chặt"
bằng cách bắt máy chủ đòi trường này sẽ làm hỏng mọi đơn khi công tắc tắt.

### 4.5 D1: `migrations/0002_payment_method.sql`

```sql
-- Ý ĐỊNH của khách, KHÔNG phải sự thật thanh toán (ADR-0031 §2).
-- Site không biết tiền đã về; nhân viên đối soát ngoài hệ.
ALTER TABLE booking ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'onboard';
CREATE INDEX idx_booking_payment ON booking(payment_method);
```

`store.ts`: `NewBooking` thêm `paymentMethod`; `BookingRow` thêm `payment_method`; `INSERT` thêm
một tham số `?18`. Vẫn prepared statement tham số hoá.

`quoted.prepay` đi vào `quoted_json` cùng `quoted.season` — không cột riêng, vì nó là **lý do ra
con số**, không phải thứ để lọc.

### 4.6 Form: `BookingForm.astro`

- Một nhóm hai nút chọn (`radiogroup`), **không nút nào `checked`**, đặt ngay trên khối tạm tính.
- Nhãn lấy từ `uiCopy.ts` — **cả năm ngôn ngữ** (`vi`, `en`, `zh`, `ko`, `ru`; `Lang` ở
  `src/lib/types.ts:59`). `UIKey` suy ra từ khoá của bản `vi`, nên thiếu một ngôn ngữ là
  `astro check` đỏ. Phần trăm chèn từ `data-prepay-percent` nướng lúc dựng.
- `prepayPercent === 0` → **không render nhóm này**, form trở về đúng hình dạng hôm nay.
- Đổi lựa chọn → gọi lại `computeQuote()` qua đúng đường đã có cho đổi ngày và đổi số người; cập
  nhật cả đơn giá từng hạng lẫn tổng. **Không lời gọi mạng nào.**
- Chưa chọn mà bấm gửi → chặn tại client, hiện lỗi trường bằng cơ chế `fields` đang có.
- Payload gửi lên dựng qua `buildQuotedPayload()` — hàm đã tách sẵn ở lượt mùa vụ chính vì lỗi
  Task 6 (script tự dựng `quoted` rồi bỏ sót khoá `season`). Chữ ký **phải nới**, nếu không lỗi
  cũ lặp lại nguyên xi với khoá mới:

  ```ts
  buildQuotedPayload(
    quote: Pick<Quote, 'perPax' | 'total' | 'season' | 'prepay'>,
    quotedAt: string,
  ): Quoted
  ```

  Chỉ thêm khoá `prepay` khi `quote.prepay` có mặt, để đơn không ưu đãi giữ nguyên hình dạng
  payload cũ — đúng cách khoá `season` đang làm.
- Không JS: hiện giá đầy đủ, không chọn sẵn gì — theo đánh đổi đã chấp nhận ở `ADR-0027`.
- Màu, cỡ chữ, khoảng cách lấy từ `tokens.css`. Không viết cứng (luật cứng 1, `CLAUDE.md` §8).

### 4.7 Báo tin: `notify/format.ts`

Thêm một dòng ngay dưới `Mùa áp dụng`, dùng chung cho email và Zalo:

```
Thanh toán: Chuyển khoản trước — đã giảm 5% (nếu không: 495.000₫)
Thanh toán: Khi khởi hành
```

Đây là dòng nhân viên cần nhất khi cầm máy gọi khách.

### 4.8 Bản đồ file

| File | Việc |
|---|---|
| `cms/schemas/bangGiaMuaVu.ts` | hai ô mới, đổi tiêu đề tài liệu |
| `docs/core-specs/01-CONTENT_MODEL.md` §2.16 | khai hai ô mới |
| `scripts/meta-validators/g1-content-model-vs-schema.ts` | bảng `bangGiaMuaVu` |
| `src/lib/queries/seasons.ts` | chiếu tài liệu thay vì mảng; `fetchSeasons` → `fetchPriceRules` |
| `src/components/TourDetail.astro` | gọi `fetchPriceRules`, truyền `prepayPercent` xuống form |
| `src/lib/booking/quote.ts` | `QuoteOptions`, `Quote.prepay`, `apDieuChinh` ba tham số |
| `src/lib/booking/schema.ts` | `paymentMethod`, `quoted.prepay`, luật chéo |
| `src/lib/booking/store.ts` | cột mới trong `NewBooking` / `BookingRow` / `INSERT` |
| `src/lib/booking/handler.ts` | chuyển `paymentMethod` vào `NewBooking` |
| `src/lib/booking/notify/format.ts` | dòng "Thanh toán:" |
| `src/components/BookingForm.astro` | nhóm hai nút chọn, tính lại khi đổi |
| `src/lib/uiCopy.ts` | nhãn cho **cả 5** bản ngôn ngữ (vi, en, zh, ko, ru) |
| `migrations/0002_payment_method.sql` | cột mới |
| `docs/core-specs/00-PROJECT_BRIEF.md` §3 | một dòng *"Bổ sung"*, đúng khuôn `QĐ-2026-08-21-01` |
| `docs/DECISIONS.md` | một mục `QĐ-2026-08-30-xx` chốt năm điểm §2 |
| `BUILD-NOTES.md` | bước `d1 migrations apply` trong runbook phát hành |

## 5. Kiểm thử

**Phép tính** (`test/booking/quote.test.ts`, mở rộng):

- không mùa, không ưu đãi → **nguyên giá gốc**, không làm tròn (ca chống hồi quy quan trọng nhất)
- chỉ ưu đãi: 800.000, −5% → 760.000
- mùa + ưu đãi, làm tròn **một lần**: 430.000, +15%, −5% → **470.000** (làm tròn hai lần ra
  471.000 — đây là ca chứng minh luật, chọn đúng bộ số này, đừng đổi sang bộ khác cho "tròn hơn":
  phần lớn bộ số cho kết quả **giống nhau** ở cả hai cách nên không phân biệt được gì)
- `prepay: false` với `prepayPercent > 0` → không giảm, không có khoá `prepay`
- `prepayPercent = 0` với `prepay: true` → không giảm, không có khoá `prepay`
- `totalGoc` bằng đúng tổng khi không chọn ưu đãi, mùa vẫn áp
- **bảng `tiers` + ưu đãi**: bậc giá cũng giảm, cũng làm tròn một lần
- hạng giá 0 vẫn 0

**Luật kiểm** (`test/booking/schema.test.ts`): năm hàng của bảng §4.4, cộng ca payload không có
`paymentMethod` → `onboard` và vẫn nhận đơn.

**Payload** (`test/booking/schema.test.ts`): `buildQuotedPayload()` mang theo `prepay` — ca test
đi qua đúng ranh giới "trình duyệt dựng payload", không tự dựng sẵn `quoted` có `prepay`.

**Lưu trữ** (`test/booking/store.test.ts`): migration áp được; đơn cũ đọc ra `onboard`; đơn mới
ghi và đọc lại đúng `transfer`.

**Báo tin** (`test/booking/notify.test.ts`): hai dạng dòng "Thanh toán:".

**Fixture cũ phải sửa cùng lượt.** `paymentMethod` là trường **bắt buộc** của `NewBooking` —
không để tuỳ chọn, vì một đơn luôn có một hình thức thanh toán và `'onboard'` là giá trị thật,
không phải giá trị vắng mặt. Ba chỗ dựng `NewBooking` phải thêm khoá, nếu không `astro check`
đỏ: `test/booking/notify.test.ts:8`, hàm `nb()` ở `test/booking/store.test.ts:5`, và `record`
trong `handler.ts`. Ba chỗ, không hơn — đã đếm.

## 6. Cổng phải xanh trước khi gộp

- `npx astro check` — 0 errors
- `npx vitest run` — toàn bộ pass
- `g1` (CONTENT_MODEL vs schema) — sau khi cập nhật §2.16
- `BK1` — grep `src/lib/booking/` không có `prices|sanity|resolver`
- `BK5` — test lệch `total` vẫn trả 400

## 7. Vận hành

1. Chạy `npx wrangler d1 migrations apply tourdao-booking --remote` **trước khi merge/push
   nhánh này vào `main`**. Site này nối Workers Builds với `main` (`BUILD-NOTES.md` mục "Có
   đường thứ hai: Cloudflare tự dựng từ GitHub") — không có một lần "deploy tay đầu tiên" nào
   để đứng trước làm mốc; **merge vào `main` chính là deploy**. Bỏ bước này rồi mới push thì
   Worker mới lên ngay khi CI dựng xong, còn câu `INSERT` của nó đã kê tên cột
   `payment_method` chưa tồn tại trong D1 production: **mọi đơn đặt tour trả về 500** — không
   riêng đơn chọn chuyển khoản.
2. Deploy Studio: `cd cms && npx sanity deploy`. `cms/sanity.cli.ts` khai
   `studioHost: 'tourdaovn'` nên Studio là bản đã dựng, host sẵn — merge code không tự cập
   nhật nó. Chưa deploy thì biên tập mở tài liệu vẫn thấy tiêu đề cũ "Giá theo mùa", không có
   nhóm ô "Ưu đãi thanh toán trước", và phần trăm mãi là 0.
3. Trong Studio: mở *Quy tắc giá*, bật ưu đãi, đặt phần trăm, Publish → trang dựng lại.
4. Nghiệm thu trên production: một tour có mùa, một tour không mùa; chọn từng nút và đối chiếu
   con số; gửi thử một đơn và kiểm dòng "Thanh toán:" trong thư báo.

## 8. Còn nợ

- **Không đo được** chuyện khách chọn chuyển khoản rồi không chuyển. Điểm mù cho tới khi bảng
  điều khiển `ADR-0030` §2 có bộ lọc theo `payment_method`. Ghi vào ADR-0031 mục nợ mở.
- QR chuyển khoản (`ADR-0030` §5) chưa làm; khi làm thì dòng "Thanh toán:" là chỗ nó cắm vào.
- **De-duplicate có thể echo một hình thức thanh toán khác với đơn đã lưu.** Endpoint chặn
  trùng theo tour + ngày + số điện thoại trong 24h bằng cách trả **mã đơn đã lưu**, nhưng dựng
  tóm tắt xác nhận trên màn hình từ **payload vừa nộp**. Khách nộp lần đầu chọn *"Thanh toán
  khi khởi hành"* (nhân viên đã nhận báo với dòng "Thanh toán: Khi khởi hành"), rồi trong 24h
  nộp lại đổi sang *"Chuyển khoản trước"*: màn hình khách hiện tổng **đã giảm**, nhưng dòng lưu
  trong D1 vẫn là đơn cũ (`payment_method = onboard`, giá gốc), và **không có thông báo thứ
  hai** đi ra — nhân viên gọi lại theo báo cũ sẽ nói ngược với điều khách vừa thấy trên form.
  Hành vi de-duplicate **có từ trước tính năng này** (đổi số khách rồi nộp lại trong 24h đã
  từng lệch tổng so với đơn lưu theo cách y hệt); ưu đãi chỉ thêm một trục lệch vào một điểm mù
  đã có sẵn, và sửa đường de-duplicate là đổi hành vi chưa ai duyệt — ngoài phạm vi ADR này.
  **Chưa sửa.** Giảm nhẹ hiện có: `x` là một con số **toàn site** (§2 điểm 3), nên nhân viên
  biết mức ưu đãi đang áp và có thể tự áp đúng khi gọi lại, bất kể dòng lưu ghi gì. Ghi vào
  ADR-0031 mục nợ mở.
