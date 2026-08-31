# SPEC — Tự động đối soát chuyển khoản: webhook biến động số dư, sổ cái, và trang tra đơn

- **Ngày:** 2026-08-31   **Soạn:** Claude (qua Cowork)   **Duyệt QA1:** *(chờ)*
- **Quyết định chi phối:** `ADR-0032` (**ĐÃ PHÊ CHUẨN 2026-08-31**, `QĐ-2026-08-31-02`), `ADR-0031` §2 (giữ nguyên, không nới),
  `ADR-0030` §2 §5, `ADR-0027`
- **Ràng buộc:** `04-CONSTRAINTS` §1d `BK1`–`BK5`, §2 điều cấm 3
- **Nhánh gốc:** `main` tại `4987b16` trở đi
- **Ba mục thiết kế được chủ dự án duyệt lần lượt trong phiên 2026-08-31**, sau sáu câu chốt ở §2

> ## ⛔ HOÃN — chủ dự án ghi nợ toàn bộ kế hoạch ngày 2026-08-31
>
> `ADR-0032` **đã phê chuẩn**, spec này **đã xong**, nhưng **không mở việc cho Code**. Theo dõi
> ở `docs/BACKLOG.md` mục **`B-022`**. Ai định thi công thì phải có người mở việc lại trước —
> spec xong không đồng nghĩa với việc đã được giao.

> ## Điều kiện chặn, đọc trước khi mở việc
>
> **Chưa ai xác nhận có nhà cung cấp nào đọc được tài khoản DOANH NGHIỆP Techcombank.** Tra
> ngày 31/08: SePay không hỗ trợ Techcombank (tài liệu lập trình, mười ngân hàng, không có
> TCB); payOS không hỗ trợ TCB cho tài khoản doanh nghiệp; Casso và Pay2S có liệt kê TCB nhưng
> không nói rõ về tài khoản doanh nghiệp và về cách kết nối.
>
> **Chủ dự án cho phép dựng phần lõi trước (2026-08-31), với điều kiện lõi độc lập cả với nhà
> cung cấp lẫn với ngân hàng** (`ADR-0032` quyết định 2 và 2b). §4.1–§4.7 làm được ngay vì
> chúng không phụ thuộc hai thứ đó — đó là chủ ý, không phải may mắn. Thứ **không** làm được là lớp chuyển đổi thật (§4.1c) và bước xác minh
> đầu-cuối (§7 bước 5). **Không được tuyên bố tính năng đã chạy khi chưa có một đồng tiền thật
> đi qua đường đó** — đúng bài học của lần QR: ảnh dựng được không chứng minh gì, quét bằng app
> ngân hàng thật mới chứng minh.

## 1. Mục tiêu

Khách chuyển khoản xong thì **hệ tự biết**, không chờ ai mở app ngân hàng ra dò:

1. Nhận webhook báo biến động số dư từ một nhà cung cấp, ghi vào sổ cái chỉ-thêm.
2. Khớp giao dịch với đơn **theo mã đơn trong nội dung chuyển khoản**.
3. Đủ 100% tổng đơn → đơn mang trạng thái **đã thanh toán** (suy ra, không lưu).
4. Báo nhân viên mọi trường hợp — kể cả **không khớp**.
5. Khách tự xem được ở `/dat-tour/<mã>/`.

## 2. Năm câu chủ dự án chốt trong phiên 2026-08-31

| # | Câu hỏi | Chốt |
|---|---|---|
| 1 | Mức tự động | **Hệ tự khẳng định đã thanh toán**, không phải chỉ giảm công đối soát |
| 2 | Số tiền | **Đủ 100% `quote.total`** (số đã trừ ưu đãi 5%). Không cọc một phần |
| 3 | Tài khoản | **Giữ Techcombank `2502503979`.** Chỉ cần *"webhook bắn tin có biến động số dư"*; chọn nhà cung cấp là thủ tục, không phải kiến trúc |
| 4 | Hết hạn giữ chỗ | **24 giờ, hoặc trước giờ khởi hành** — cái nào đến trước |
| 5 | Báo khách | **Làm luôn trang tra đơn `/dat-tour/<mã>/`** (đang nợ ở spec QR §4.4), cộng thư SES nếu khách có điền email |
| 6 | Độc lập ngân hàng | **Lõi phải chạy được khi thêm hoặc đổi ngân hàng** — nhiều tài khoản nhận tiền song song, nhiều nhà cung cấp song song (§4.1d, §4.2). Chủ dự án thêm sau khi đọc bản đề xuất |

## 3. Không làm gì (ranh giới)

- **Không** cổng thanh toán, không ô nhập thẻ. Site vẫn **không nhận tiền** — tiền đi thẳng từ
  ngân hàng khách sang ngân hàng công ty. `00-PROJECT_BRIEF` §5 phần *"thanh toán trực tuyến"*
  **không** bị đảo; phần *"webhook báo tiền"* thì có (`ADR-0032` quyết định 1).
- **Không** đụng `payment-qr.ts` — không một dòng. Nội dung chuyển khoản vẫn là mã đơn bỏ gạch
  nối, và đó chính là thứ §4.4 khớp.
- **Không** tài khoản ảo (VA) theo đơn.
- **Không** Cron Trigger. Hết hạn suy ra lúc đọc (§4.5).
- **Không** tự huỷ đơn, **không** tự hoàn tiền, **không** tự tính lại giá khi quá hạn.
- **Không** đổi nghĩa `booking.status` và `booking.payment_method` (`ADR-0031` §2).
- **Không** sửa luật đơn trùng của `handler.ts` — chỉ **tránh** (§4.4d).
- **Không** làm bảng điều khiển quản trị. Hàng chờ đi qua kênh báo tin (§4.7).
- **Không** làm ZNS. Vẫn chặn ở ba thủ tục Zalo của chủ dự án.
- **Không** thêm lớp đăng nhập cho trang tra đơn — spec QR §4.4 đã chốt, không mở lại.

## 4. Thiết kế

### 4.1 Hợp đồng `BankTxn` và lớp chuyển đổi nhà cung cấp

**a. Kiểu — đây là toàn bộ hợp đồng với thế giới bên ngoài.** `src/lib/payment/txn.ts`, thuần
tuyệt đối: không mạng, không D1, không Astro, không đọc `site.config` (khuôn `BK5`).

```ts
export type BankTxn = {
  /** Mã giao dịch của NHÀ CUNG CẤP. Khoá chống ghi trùng. */
  providerTxnId: string
  /** Thời điểm NGÂN HÀNG ghi nhận, ISO 8601 UTC. Không phải lúc ta nhận webhook. */
  occurredAt: string
  accountNumber: string
  /** Số nguyên VNĐ, luôn dương. */
  amount: number
  direction: 'in' | 'out'
  /** Nội dung chuyển khoản THÔ, chưa chuẩn hoá. */
  memo: string
}
```

**b. Giao diện nhà cung cấp.** `src/lib/payment/providers/index.ts`:

```ts
export interface BankProvider {
  readonly name: string
  /** Xác thực TRƯỚC khi tin bất cứ thứ gì trong thân. So sánh phải là thời-gian-hằng. */
  verify(req: Request, rawBody: string, secret: string): Promise<boolean>
  /** Đổi thân thô sang BankTxn. Trả null khi payload không phải một giao dịch
   *  (tin thử kết nối, tin đổi trạng thái tài khoản…). null KHÔNG phải lỗi. */
  parse(rawBody: string): BankTxn | null
}
```

**c. Mỗi nhà cung cấp một file, khoảng 30 dòng.** Chọn ai đọc từ `BANK_WEBHOOK_PROVIDER` (§6).

> **Chưa viết được cho tới khi chủ dự án chốt nhà cung cấp.** Không đoán hình dạng payload của
> ai. Trong lúc chờ, `vitest` chạy trên một provider `test` khai ngay trong thư mục test —
> **không** đưa provider giả vào mã sản phẩm.

**d. Nhiều nhà cung cấp cùng lúc — sổ đăng ký, không phải một biến.**

```ts
export const PROVIDERS: Record<string, BankProvider>   // khoá = tên trong đường dẫn
```

Không có "nhà cung cấp đang chọn". Đường dẫn quyết định (§4.2), sổ đăng ký tra ra. Thêm nhà
cung cấp thứ hai = thêm một file và một dòng trong sổ; **không đụng** nhà cung cấp thứ nhất.

### 4.2 Endpoint `POST /api/bank-webhook/<nhà cung cấp>`

`src/pages/api/bank-webhook/[provider].ts` chỉ nối binding, mọi logic ở `src/lib/payment/webhook.ts` —
đúng khuôn `dat-tour.ts` đang theo, để test không cần dựng Astro.

**Trình tự, dừng ở bước đầu tiên không qua:**

| # | Bước | Không qua thì |
|---|---|---|
| 0 | `<nhà cung cấp>` có trong `PROVIDERS` không | **404** — không tiết lộ nhà cung cấp nào đang bật |
| 1 | Có bí mật của **đúng nhà cung cấp đó** không (§6) | **503** — hỏng ồn ào, không hỏng câm (khuôn Turnstile §4.7 spec đặt tour) |
| 2 | Phương thức là `POST` | **405** |
| 3 | `provider.verify()` | **401**, thân rỗng |
| 4 | Đọc được thân thành `BankTxn` | **400** |
| 5 | `parse()` trả `null` | **200** — không phải lỗi, chỉ là tin không liên quan |
| 6 | `accountNumber` **thuộc tập tài khoản nhận tiền** (§4.2b), `direction === 'in'` | **200**, không ghi gì |
| 7 | Khớp đơn (§4.4) rồi `INSERT` | trùng `provider_txn_id` → **200**, không ghi dòng thứ hai, **không** bắn tin lại |

**b. Tập tài khoản nhận tiền — không phải một số.**

```ts
const ACCEPTED = [banking.accountNumber, ...banking.alsoAccept]
```

`banking.alsoAccept: readonly string[]` là **tài khoản vẫn nhận tiền nhưng không còn in lên
QR**. Đổi ngân hàng = đổi `accountNumber`, đẩy số cũ sang `alsoAccept`, và những đơn đã phát QR
cũ **vẫn khớp**. Không có nó thì ngày chuyển đổi là ngày mất dấu một lứa tiền.

> Khai bằng chú thích kiểu tường minh (`readonly string[]`), **không** để `as const` thu nó
> thành `never[]` — mảng rỗng mặc định sẽ bị suy ra sai kiểu và lần thêm số đầu tiên mới lộ.
> `scripts/validators/banking-shape.ts` kiểm **mọi phần tử**, cùng luật với `accountNumber`.

**Ba luật cứng:**

1. **Xác thực trước khi đọc thân.** So sánh chữ ký bằng hàm thời-gian-hằng, không `===` trên
   chuỗi.
2. **Endpoint MÙ.** Thân phản hồi luôn là `{"ok":true}` hoặc rỗng — **không bao giờ** chứa mã
   đơn, số tiền, hay bất kỳ dữ liệu đơn nào. Người lạ không được dùng nó để hỏi *"đơn
   TD-260831-K7QM trả tiền chưa"*. **Có một test canh đúng điều này** (§7), để lần sau ai
   "tiện tay" thêm dữ liệu vào phản hồi thì cổng đỏ.
3. **Ghi `raw_json` nguyên văn.** Ghi trước khi tin vào phán đoán của mình. Khớp sai còn dựng
   lại được; không ghi thì mất vĩnh viễn — và đây là bằng chứng khi phải đối chiếu với ngân hàng.

**Bắn tin đi sau khi đã ghi**, qua `ctx.waitUntil`. Tin hỏng **không** được làm webhook trả
khác `200`: trả khác là nhà cung cấp bắn lại, và bắn lại thì khách nhận hai lá thư.

### 4.3 Migration `0004_bank_txn.sql` và lớp D1

> **Đánh số `0004`. `0003` đã bị spec QR đặt chỗ: `0003_kenh_bao_khach.sql`** — hai cột trên
> `booking` cộng bảng `zalo_token` (spec QR §4.7, danh sách file §5). Việc đó còn nợ; lấy `0003`
> là đâm nhau với một nhánh chưa mở.

```sql
-- Sổ cái giao dịch ngân hàng — ADR-0032. CHỈ THÊM DÒNG.
-- Không DELETE, không UPDATE số tiền. Sửa duy nhất được phép: matched_code, match_note —
-- tức sửa PHÁN ĐOÁN CỦA TA, không sửa SỰ KIỆN CỦA NGÂN HÀNG.
CREATE TABLE bank_txn (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  provider        TEXT NOT NULL,
  provider_txn_id TEXT NOT NULL,
  occurred_at     TEXT NOT NULL,
  received_at     TEXT NOT NULL,
  account_number  TEXT NOT NULL,
  amount          INTEGER NOT NULL,
  direction       TEXT NOT NULL,
  memo            TEXT NOT NULL,
  raw_json        TEXT NOT NULL,
  matched_code    TEXT,
  match_note      TEXT,
  UNIQUE (provider, provider_txn_id)
);
CREATE INDEX idx_txn_matched  ON bank_txn(matched_code);
CREATE INDEX idx_txn_occurred ON bank_txn(occurred_at);
```

`src/lib/payment/store.ts` — prepared statement tham số hoá cho mọi truy vấn (`security.md`):

```ts
insertTxn(db, row): Promise<'inserted' | 'duplicate'>   // bắt UNIQUE bằng isUniqueViolation()
sumMatchedIn(db, code): Promise<number>                 // SUM(amount) WHERE matched_code=? AND direction='in'
listMatchedIn(db, code): Promise<TxnRow[]>              // cho trang tra đơn và tin báo
```

`isUniqueViolation()` đã có ở `src/lib/booking/store.ts` — **dùng lại**, không viết bản thứ hai.

### 4.4 Luật khớp — bốn bước

**a. Chuẩn hoá.** `normalizeMemo(memo)`: bỏ mọi ký tự không phải chữ/số, viết hoa.

**b. Bắt mã.** `extractBookingCode(memo)` tìm khuôn `TD` + 6 chữ số + 4 ký tự thuộc
`CODE_ALPHABET` **ở bất kỳ đâu trong chuỗi đã chuẩn hoá** — ngân hàng chèn thêm chữ
(`CHUYEN TIEN`, mã `FT26…`, tên người gửi) nên so bằng là hỏng.

> **Nhập `CODE_ALPHABET` từ `src/lib/booking/code.ts`.** Chép lại bảng chữ vào file mới là tạo
> nguồn sự thật thứ hai (P6/N7); đổi bảng chữ ở một chỗ mà quên chỗ kia là hỏng câm.

Trả về mã **có gạch nối** (`TD-260831-K7QM`) vì cột `booking.code` lưu dạng đó.
**Tìm thấy hai mã khác nhau → coi như không khớp**, vào hàng chờ. Không chọn cái đầu.

**c. Tra đơn** theo mã. Không có → hàng chờ.

**d. Đối chiếu số tiền với `quoted_json.total` ĐANG LƯU TRONG D1 của mã đó.**

> **Cái bẫy, phải đọc kỹ.** Luật đơn trùng của `handler.ts` trả **mã cũ** trong khi mọi con số
> dựng từ lần nộp **mới** — nên một mã có thể ứng với hai tổng khác nhau (`ADR-0031` "Nợ mở").
> Spec này **không sửa** chuyện đó, nhưng **không được xây lên trên nó**: nguồn duy nhất để so
> là `quoted_json` trong D1. Khách quét QR của lần nộp thứ hai mà D1 giữ số cũ → lệch → hàng
> chờ, người xử. Sai thì sai to tiếng.

**Phán quyết** (`paid` = `sumMatchedIn(code)` **trước** giao dịch này, cộng giao dịch này):

| Điều kiện | `matched_code` | `match_note` | Tin bắn |
|---|---|---|---|
| `paid === total` | mã | `đủ` | ✅ đủ |
| `paid > total` | mã | `dư <số>` | ✅ kèm *cần hoàn* |
| `paid < total` | mã | `còn thiếu <số>` | ⚠️ thiếu |
| Không bắt được mã / không có đơn / hai mã | `NULL` | lý do | ⚠️ **CHƯA KHỚP** |

**Dung sai: không có.** Phí chuyển khoản do người gửi trả nên tiền vào đúng số. Không có
"gần đủ thì thôi" — không con số nào biện minh được, và một lần nới là mọi lần sau nới theo.

**Nhiều lần chuyển cộng dồn** chạm đủ thì khẳng định tại giao dịch làm tổng chạm ngưỡng — đây
là thứ sổ cái làm được mà một cột boolean thì không.

### 4.5 Trạng thái thanh toán và hết hạn — SUY RA lúc đọc

`src/lib/payment/status.ts`, thuần. **Không lưu trạng thái vào đâu cả.**

```ts
export type PaymentState =
  | { kind: 'not-required' }                                  // payment_method = 'onboard'
  | { kind: 'awaiting';  dueAt: string; remaining: number }
  | { kind: 'short';     paid: number;  remaining: number }
  | { kind: 'paid';      paidAt: string; overpaid: number }
  | { kind: 'expired';   paid: number }                       // chưa đủ VÀ quá hạn
  | { kind: 'late-paid'; paidAt: string }                     // đủ NHƯNG sau hạn
  | { kind: 'mismatch' }                                      // xem ghi chú bên dưới

export function computePaymentState(b: BookingRow, txns: TxnRow[], now: Date): PaymentState
```

> **`mismatch` tồn tại vì §4.4d, và bỏ nó đi là dựng một câu sai cho khách đọc.** Khi có giao
> dịch khớp mã nhưng số tiền **không** khớp `quoted_json` đang lưu, trạng thái **không được**
> là `short` và cũng **không được** là `paid`. Khách quét QR của lần nộp thứ hai đã trả **đúng
> số mà QR đòi**; nói với họ *"còn thiếu 200.000₫"* là đổ lỗi sai chỗ, và nói *"đã nhận đủ"*
> thì sổ không đỡ nổi. `mismatch` là chỗ duy nhất trung thực: hệ biết có tiền, biết số không
> khớp, và **không tự phân xử**. Nhân viên phân xử.

**Hết hạn:**

```
dueAt = min( created_at + 24 giờ,  ngày khởi hành 00:00 giờ VN )
```

Múi giờ đi qua `src/lib/booking/vn-date.ts` — **không viết phép cộng múi giờ thứ hai**. Thiếu
hàm thì thêm vào file đó.

`late-paid` **không** làm hệ tự quyết gì cả: nhân viên đọc và xử. Quá hạn **không** tự tính lại
giá — ưu đãi 5% mất hiệu lực là việc người nói với người.

### 4.6 Trang `/dat-tour/<mã>/`

`src/pages/dat-tour/[code].astro`, `export const prerender = false`.

**Hiện đúng năm thứ:** mã đơn · tên tour · ngày khởi hành · tổng tiền · **một dòng trạng thái**.

| `PaymentState` | Dòng khách đọc |
|---|---|
| `awaiting` | ⏳ Chưa nhận được chuyển khoản — còn **N giờ** để giữ chỗ |
| `short` | ⏳ Đã nhận **X₫**, còn thiếu **Y₫** |
| `paid` / `late-paid` | ✅ Đã nhận đủ tiền lúc **14:32 ngày 31/08** |
| `expired` | ⚠️ Quá hạn giữ chỗ — nhân viên sẽ gọi lại xác nhận |
| `mismatch` | ⚠️ Đã nhận được chuyển khoản — nhân viên sẽ gọi lại xác nhận. **Không hiện con số nào**: số nào cũng đang tranh chấp, in ra là mời khách cãi với một con số hệ chưa chắc |
| `not-required` | Đơn đã ghi nhận — nhân viên sẽ gọi lại xác nhận |

**Không hiện:** danh sách giao dịch, số tài khoản người gửi, số tiền từng lần, và **không một
mẩu PII nào** — tên, SĐT, email, điểm đón, ghi chú (`BK3`).

**Bảo mật:**

- Mã sai khuôn `CODE_RE` → **404**. Không tìm thấy đơn → **404 y hệt**. Hai trường hợp phải
  không phân biệt được từ bên ngoài, kẻo trang thành máy dò mã hợp lệ.
- `<meta name="robots" content="noindex, nofollow">`, **không** vào `sitemap-vi.xml`.
- **Giới hạn tần suất bằng luật WAF trên `/dat-tour/*`**, không bằng mã — `04-CONSTRAINTS` §1d
  (ghi chú module đặt tour) đã có tiền lệ "ba lớp chống lạm dụng… luật WAF". Ghi vào runbook. Lý do phải có: mã đơn chỉ
  có `31⁴ ≈ 923.000` khả năng mỗi ngày và phần ngày thì đoán được; con số đó đủ khi trang hiện
  một *yêu cầu đặt*, mỏng hơn khi trang hiện **tiền**.
- Không lớp đăng nhập (spec QR §4.4 đã chốt; không mở lại).

### 4.7 Báo tin

**Nhân viên** — dùng lại đường đang chạy (`notify/ses.ts`, `notify/zalo.ts`). Thêm
`src/lib/payment/notify.ts`; **không** nhét vào `Notifier` của đặt tour, vì giao diện đó nhận
`NewBooking`, còn đây là một sự kiện khác loại.

```
✅ TD-260831-K7QM · Tour 4 đảo · KH 05/09 · 1.450.000₫ — ĐÃ ĐỦ
⚠️ TD-260831-K7QM · còn thiếu 200.000₫ (đã nhận 1.250.000₫)
⚠️ CHƯA KHỚP · 1.450.000₫ lúc 14:32 · nội dung: "CHUYEN TIEN FT26..."
```

Tin **CHƯA KHỚP bắt buộc phải bắn**. Không bắn thì tiền về mà không ai biết — tệ hơn hiện tại.

**Khách** — thư SES *"đã nhận đủ tiền"* kèm link trang tra đơn, **chỉ khi**: `booking.email`
khác `NULL` **và** giao dịch này là giao dịch làm trạng thái chuyển sang `paid` lần đầu. Điều
kiện thứ hai là thứ chặn việc gửi hai lá thư khi khách chuyển dư rồi chuyển thêm.

Không có email → chỉ trang tra đơn. **ZNS chừa chỗ, không làm đợt này.**

### 4.8 Drift phải ghi, không tự hoà giải

- **Drift URL map** (số hiệu cấp lúc ghi — `DR-106` là số cuối cùng đang dùng, đừng chép cứng
  `DR-107` vào mã nếu lúc ghi đã có drift khác chen vào) — `05-URL_MAP` §2 và cây URL: site có thêm không gian `/dat-tour/<mã>/` là
  trang **on-demand đọc D1**, không sinh từ Sanity và không vào sitemap. Ghi drift, **không**
  tự sửa `05-URL_MAP`.
- **`00-PROJECT_BRIEF` §3 và §5** cần dòng *"Bổ sung 2026-08-31"* — và lần này phải viết đúng
  là **đảo một điều cấm**, khác hai lần trước (`QĐ-2026-08-21-01`, `QĐ-2026-08-30-01`) vốn
  cẩn thận ghi *"không đảo"*. Việc sửa brief thuộc thẩm quyền chủ dự án, không phải của Code.
- **`wrangler.toml`** có chú thích *"Mọi trang khác vẫn là asset tĩnh, phục vụ trước Worker"*.
  `/dat-tour/<mã>/` là route on-demand **thứ hai**, nên câu đó thành sai kể từ đợt này. Sửa
  chú thích cùng lúc với việc thêm trang — đây đúng loại chú thích cũ hoá nói dối mà `DR-105`
  đã ghi một lần.
- **`SPEC-2026-08-31-qr-thanh-toan-va-zns` §3** có câu *"Không thêm… webhook báo tiền"*. Câu đó
  đúng cho đợt QR. Thêm một dòng trỏ sang `ADR-0032`, **không xoá câu cũ**.

## 5. File thêm và file sửa

| File | Việc |
|---|---|
| `migrations/0004_bank_txn.sql` | **thêm** |
| `src/lib/payment/txn.ts` | **thêm** — `BankTxn`, `normalizeMemo`, `extractBookingCode`. Thuần |
| `src/lib/payment/status.ts` | **thêm** — `computePaymentState`. Thuần |
| `src/lib/payment/store.ts` | **thêm** — lớp D1 |
| `src/lib/payment/webhook.ts` | **thêm** — toàn bộ logic endpoint |
| `src/lib/payment/notify.ts` | **thêm** — tin nhân viên + thư khách |
| `src/lib/payment/providers/index.ts` | **thêm** — `BankProvider` + sổ đăng ký `PROVIDERS` |
| `src/lib/payment/providers/<nhà cung cấp>.ts` | **thêm — CHỜ CHỐT NHÀ CUNG CẤP** |
| `src/pages/api/bank-webhook/[provider].ts` | **thêm** — chỉ nối binding |
| `src/pages/dat-tour/[code].astro` | **thêm** — trang tra đơn |
| `src/env.d.ts` | **sửa** — hai tên biến mới (§6) |
| `src/lib/booking/code.ts` | **không sửa** — chỉ `import { CODE_ALPHABET, CODE_RE }` |
| `src/site.config.ts` | **sửa** — thêm `banking.alsoAccept` (mặc định rỗng) |
| `scripts/validators/banking-shape.ts` | **sửa** — kiểm cả `alsoAccept` |
| `src/lib/booking/payment-qr.ts` | **không sửa, không một dòng** — QR chỉ đọc `accountNumber` |
| `src/lib/booking/handler.ts` | **không sửa** |

Trang `[code].astro` **không** phải trang chi tiết entity, nên cổng `entity-layout-post.ts`
(quét theo tên `*Detail.astro`) **không** chạm tới nó. Đúng thiết kế — nhưng ghi ra đây vì
`DR-076` đã dạy rằng cách đặt tên file quyết định phạm vi cổng, và điều đó phải được nói ra
chứ không để người sau tự phát hiện.

## 6. Bí mật và cấu hình (`BK4`)

**Một bí mật cho mỗi nhà cung cấp**, tên suy ra từ tên nhà cung cấp:

```
BANK_WEBHOOK_SECRET_CASSO
BANK_WEBHOOK_SECRET_PAY2S
```

Không dùng **một** khoá chung: nhà cung cấp này lộ khoá thì nhà cung cấp kia vẫn sạch, và tắt
một nhà cung cấp là xoá đúng một bí mật. Không cần biến `BANK_WEBHOOK_PROVIDER` nữa — đường dẫn
đã nói nhà cung cấp nào, và một biến "đang chọn ai" sẽ mâu thuẫn với việc chạy song song.

Khai **tên** vào `src/env.d.ts` (`?: string`), **không** khai giá trị (`BK4`). Runbook Task 13
tăng từ 8 lên **8 + số nhà cung cấp đang bật** giá trị phải `wrangler secret put`.

## 7. Cổng và bằng chứng — mặc định là KHÔNG ĐẠT

| # | Kiểm | Cách | Mức |
|---|---|---|---|
| 1 | Chuẩn hoá + bắt mã | `vitest`: mã ở đầu / giữa / cuối; có `CHUYEN TIEN`, `FT26…`, tên người gửi; chuỗi có `0`/`O`/`1`/`I`/`L` **không** khớp; hai mã khác nhau → không khớp | fail |
| 2 | Phán quyết tiền | `vitest`: đủ / thiếu / dư / cộng dồn hai lần chuyển; so với `quoted_json` **trong D1**, không phải payload | fail |
| 2b | `mismatch` | `vitest`: khớp mã nhưng lệch tổng → state là `mismatch`, **không** phải `short`; và HTML trang tra đơn **không chứa con số nào** ở ca này | fail |
| 3 | Chống ghi trùng | `vitest`: bắn lại cùng `(provider, provider_txn_id)` → **một** dòng, trả `200`, **không** bắn tin lần hai | fail |
| 4 | Bỏ qua đúng chỗ | `vitest`: `direction='out'`; sai `account_number`; `parse()` trả `null` → `200`, không ghi | fail |
| 5 | Hết hạn | `vitest`: biên 24 giờ; biên ngày khởi hành; cả hai theo **giờ VN** | fail |
| 6 | Bảo mật endpoint | `vitest`: không chữ ký → `401`; chữ ký đúng thân hỏng → `400`; thiếu secret → `503`; **và thân phản hồi không chứa mã đơn** | fail |
| 7 | Trang tra đơn | `vitest` / kiểm tay: mã sai khuôn và mã không tồn tại trả **404 giống hệt nhau**; HTML có `noindex`; HTML **không** chứa SĐT/email/tên khách | fail |
| 7b | Đa ngân hàng, đa nhà cung cấp | `vitest`: số tài khoản trong `alsoAccept` **được nhận**; số lạ bị bỏ; hai nhà cung cấp cùng `provider_txn_id` → **hai** dòng (khoá là cặp); đường dẫn nhà cung cấp lạ → `404` | fail |
| 8 | Cổng dự án | `npm run build` **trước** rồi `npm run gate` — 12/12 xanh | fail |
| 9 | **Đầu-cuối, bằng chứng duy nhất có giá trị** | Chuyển **2.000₫ thật** vào tài khoản với nội dung một mã đơn thật → dòng vào `bank_txn`, tin về Zalo, trang tra đơn đổi. Ghi lại thời điểm và `provider_txn_id` | fail |

Bước 9 **chặn tuyên bố hoàn thành**. Không có nó thì đúng nhất chỉ được nói *"đã thi công, chưa
xác minh với tiền thật"*.

## 8. Migration — chạy TRƯỚC khi merge

```
wrangler d1 migrations apply tourdao-booking --remote
```

**Bỏ bước này thì hỏng câm**: webhook về, `INSERT` ném lỗi bảng không tồn tại, endpoint trả
khác `200`, nhà cung cấp bắn lại bảy lần rồi bỏ — và **không cổng nào đỏ**. Đây đúng bài học
§8 của spec ZNS, ghi lại ở đây vì người đọc spec này có thể chưa đọc spec kia.

## 9. Thứ tự thi công

1. `0004_bank_txn.sql` + `store.ts`
2. `txn.ts` + `status.ts` + test (§7 mục 1, 2, 5) — **thuần, làm được ngay, không cần nhà cung cấp**
3. `webhook.ts` + `providers/index.ts` + `site.config` `alsoAccept` + test (§7 mục 3, 4, 6, 7b)
   — provider `test` khai trong test
4. `[code].astro` + test (§7 mục 7)
5. `notify.ts`
6. **Dừng lại.** Chờ chủ dự án chốt nhà cung cấp → viết lớp chuyển đổi thật → §7 mục 9

## 10. Câu chưa trả lời được — chủ dự án hỏi nhà cung cấp

1. Có nhận tài khoản **doanh nghiệp** Techcombank không?
2. Kết nối bằng cách nào — API chính thức của ngân hàng, hay phải đưa **thông tin đăng nhập
   internet banking**? Nếu là cách sau thì đó là quyết định về rủi ro tài chính, cần đọc điều
   khoản của Techcombank về chia sẻ thông tin đăng nhập **trước khi** làm.
3. Webhook có mang một **mã giao dịch ổn định** không? Không có nó thì không chống được ghi
   trùng — mất đúng bảo đảm quan trọng nhất của thiết kế này.
4. Ký webhook bằng gì — HMAC, API key trong header, hay chỉ IP allowlist?
5. Có môi trường thử (sandbox) để chạy §7 mục 9 mà không cần tiền thật không?

## 11. QA1 — điều kiện mở việc cho Code

- [x] `ADR-0032` **đã được chủ dự án phê chuẩn** 2026-08-31 (`QĐ-2026-08-31-02`)
- [ ] Chủ dự án xác nhận đảo `00-PROJECT_BRIEF` §5 và `ADR-0030` §5, và tự sửa brief
- [ ] Sáu câu §2 đúng như đã chốt trong phiên
- [ ] §9 bước 1–5 mở được ngay; bước 6 chờ §10
