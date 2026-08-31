# SPEC — Mã QR chuyển khoản và kênh báo tin thẳng tới khách

- **Ngày:** 2026-08-31   **Soạn:** Claude (qua Cowork)   **Duyệt QA1:** *(chờ)*
- **Quyết định chi phối:** `ADR-0030` §5 (QR là tiện ích, không ràng buộc) và §4 (một nguồn
  token, tách nội dung khỏi trình bày), `ADR-0031` §2, `ADR-0027` quyết định 3 và 7,
  `QĐ-2026-08-22-07` (SES)
- **Ràng buộc:** `04-CONSTRAINTS` §1d `BK1`–`BK5`, §2 điều cấm 3
- **Nhánh gốc:** `main` tại `db4d067` trở đi (đã có cửa sổ 90 ngày và ưu đãi thanh toán trước)
- **Sáu mục thiết kế được chủ dự án duyệt lần lượt trong phiên 2026-08-31.** Bản này là **bản
  2**, viết lại sau hai lượt review bằng agent — xem §10 để biết bản 1 sai những gì.

## 1. Mục tiêu

Hai việc, một đường dữ liệu:

1. **Báo cho khách qua Zalo OA tới số điện thoại của họ** khi đơn được tạo — mọi đơn, không
   riêng đơn chuyển khoản.
2. **Mã QR chuyển khoản cho từng đơn**: hiện ngay sau khi đặt thành công, và gửi kèm qua Zalo
   lẫn email.

## 2. Ba câu chủ dự án chốt trong phiên

1. **Zalo OA đã xác thực**, hiện gửi được tin cho ID biết trước (báo cho admin). Chưa liên kết
   ZBS Account, chưa nạp tiền, chưa có mẫu tin được duyệt.
2. **Nội dung chuyển khoản là mã đơn**, không phải `TEN_So_dien_thoai`. Mục đích của nội dung đó
   là *"để nhân viên đối chiếu tiền về ứng với đơn nào"* — mã đơn làm việc đó tốt hơn và không
   đụng `BK3`. Chủ dự án xác nhận giữ nội dung chuyển khoản **khác** mã đơn ở chỗ gạch nối (§4.3).
3. **Tài khoản ngân hàng khai trong `src/site.config.ts`**, không trong Sanity.

## 3. Không làm gì (ranh giới)

- **Không** thêm cổng thanh toán, ô nhập thẻ, webhook báo tiền. Site vẫn **không biết** tiền đã
  về hay chưa, vẫn **không có** trạng thái "đã cọc". `ADR-0027` dòng *"thanh toán / đặt cọc
  online — ngoài phạm vi"* và `00-PROJECT_BRIEF` §5 không bị đảo.
- **Không** đổi ô email trên form thành bắt buộc.
- **Không** thêm Cron Trigger làm mới token trong đợt này (§9).
- **Không** thêm lớp xác thực phụ cho trang tra đơn (§4.4).
- **Không** sửa gốc lỗi `summary.total` của đơn trùng — chỉ tránh (§4.5).
- **Không** dọn nợ màu/cỡ chữ của `html.ts` và `format.ts` — chỉ không bồi thêm (§9).
- **Không** đảo phát biểu *"Không có DB nào khác"* ở `05-URL_MAP` §2 — chỉ ghi drift (§4.8).

## 4. Thiết kế

### 4.1 Mẫu tin ZNS — nộp trước tiên, đây là đường găng

Duyệt mẫu mất **2 ngày làm việc**, là thời gian chờ bên ngoài và nối tiếp. Nội dung mẫu ràng
buộc mọi thứ phía sau, nên nó là sản phẩm của thiết kế chứ không của thi công.

**Một mẫu duy nhất cho mọi đơn** — không tách theo hình thức thanh toán. Mục tiêu là báo cho
khách *khi họ đặt tour*, không riêng khách chuyển khoản; một mẫu thì một lần duyệt, và trang
đích tự quyết định có hiện QR hay không.

**Loại mẫu:** Tin giao dịch.

**Nội dung** (phần chữ tĩnh **176** ký tự; tham số tối đa **174**; **tổng tối đa 350** — hạn mức
400, dư 50):

```
Cảm ơn quý khách đã gửi yêu cầu đặt tour.

Mã đơn: <ma_don>
Tour: <ten_tour>
Ngày khởi hành: <ngay_khoi_hanh>
Số khách: <so_khach>
Tổng tạm tính: <tong_tien>
Hình thức thanh toán: <hinh_thuc_thanh_toan>

Nhân viên sẽ gọi lại xác nhận trong giờ làm việc.
```

**Đúng một nút CTA:** nhãn *"Xem chi tiết đơn"*, trỏ `https://tourdao.vn/dat-tour/<ma_don>/`
— **có gạch chéo cuối**, thống nhất với mọi URL khác của site (đối chiếu `sitemap-vi.xml`: mọi
`<loc>` đều kết thúc bằng `/`). Domain chính chủ nên nút đầu **miễn phí**. Không thêm nút "Gọi
hotline": nút thứ hai tính thêm tiền mỗi tin, và số điện thoại **bị cấm đặt trong thân tin**.

**Sáu tham số. Hạn dài dưới đây là hạn KHAI LÚC ĐĂNG KÝ, đã đối chiếu với giá trị dài nhất
thực tế sinh ra được** — không phải ước lượng:

| Tham số | Nguồn | Hạn khai | Dài nhất thật | Ghi chú |
|---|---|---|---|---|
| `<ma_don>` | `booking.code` | 14 | 14 | `TD-260831-K7QM`, độ dài cố định |
| `<ten_tour>` | `tour_title` | 60 | **200** | **PHẢI CẮT** — `LIMITS.TITLE_MAX` là 200 |
| `<ngay_khoi_hanh>` | `depart_date` | 10 | 10 | `31/08/2026`, cố định |
| `<so_khach>` | `pax_json` | **50** | **48** | 4 hạng: `2 người lớn, 1 trẻ em, 1 người cao tuổi, 1 em bé` |
| `<tong_tien>` | `quoted.total` | 15 | 14 | `1.000.000.000₫` ở trần `TOTAL_MAX_VND` |
| `<hinh_thuc_thanh_toan>` | `payment_method` | **25** | **24** | `Thanh toán khi khởi hành` |

> **Bản 1 khai `so_khach` là 20 và `hinh_thuc_thanh_toan` là 22 — cả hai NGẮN HƠN chính ví dụ
> đặt cạnh.** Đơn đủ bốn hạng khách là đơn hợp lệ hôm nay (`PAX_ORDER` có đủ bốn), dài 48 ký tự.
> Zalo từ chối **cả tin**, không riêng một trường. Khai sai ở đây tốn thêm 2 ngày chờ duyệt lại.

Tên tham số viết thường, nối bằng gạch dưới, không dấu — theo luật đặt tên của Zalo.

**Ba việc của chủ dự án, không phải của code:** logo hai bản (sáng và tối, nền trong suốt, bản
tối là logo âm bản, cùng tỉ lệ); liên kết OA với ZBS Account và **nạp tiền**; nộp mẫu.

**Chưa xác minh, xác nhận lúc nộp mẫu:** tham số động nằm trong **đường dẫn**
(`/dat-tour/<ma_don>/`) có được duyệt không, hay Zalo chỉ nhận ở **query string**
(`/dat-tour/?ma=<ma_don>`). Hai dạng dựng được như nhau ở phía code; dạng query string thì
`[code].astro` đổi thành `index.astro` đọc `Astro.url.searchParams`.

### 4.2 Cấu hình ngân hàng — `src/site.config.ts`

```ts
export const banking = {
  bin: '970436',                          // BIN NAPAS, đúng 6 chữ số
  accountNumber: '...',                   // 1–19 ký tự chữ/số
  accountName: 'CONG TY TNHH TOUR DAO',   // IN HOA, KHÔNG DẤU — theo lệ ngân hàng
} as const
```

> **Ba giá trị trên là KHUÔN, không phải số thật.** `970436` là BIN Vietcombank, dùng làm ví dụ
> định dạng. Chủ dự án cấp cả ba giá trị thật; **không đoán, không mượn số của ai để chạy thử.**

**Luật thứ tự, để §4.2 không chọi cổng ở §7:** khối `banking` **chỉ được commit khi đã có ba giá
trị thật**, trong cùng một commit. Không commit khối mang giá trị khuôn rồi sửa sau — validator
ở §7 mức fail sẽ bắt `'...'` (không phải 1–19 ký tự chữ/số) và làm đỏ cổng ngay từ commit đầu.
Chưa có số thật thì task §4.2 và §4.3 **chưa mở**; các task còn lại chạy song song được.

Khối chú thích đầu file phải sửa **hai chỗ**, không phải một: bảng *"SỬA Ở ĐÂU?"* (thêm hàng
*"Số tài khoản nhận chuyển khoản → FILE NÀY → sau khi build lại"*) và câu nguyên tắc phân chia
*"Nguyên tắc phân chia: thứ gì đổi thì URL đổi theo (phải build lại) thì nằm ở file này…"* —
nới thành *"…**hoặc** thứ biên tập viên không được phép chạm"*. Lý do: biên tập viên không được
có quyền đổi hướng dòng tiền của khách. Khối *"AI ĐƯỢC SỬA GÌ"* ngay dưới cũng nhắc lại ranh
giới này, thêm một dòng cho số tài khoản.

### 4.3 Lớp nghiệp vụ — `src/lib/booking/payment-qr.ts`

```ts
export type Banking = { bin: string; accountNumber: string; accountName: string }
export type PaymentQr = {
  imageUrl: string; addInfo: string; amount: number
  bin: string; accountNumber: string; accountName: string
}
export function buildPaymentQr(
  banking: Banking, code: string, total: number, paymentMethod: PaymentMethod,
): PaymentQr | null
```

Trả `null` **khi và chỉ khi** `paymentMethod !== 'transfer'`. Đây là **đường trả `null` duy
nhất** — hàm **không** kiểm hình dạng `banking`, việc đó thuộc validator ở §7 (một chỗ chịu
trách nhiệm, không ba). Không mạng, không D1, không Astro; test dưới một giây.

> **Cấu hình đi vào bằng THAM SỐ, hàm không tự `import` `site.config.ts`.** Lý do là **khuôn
> `BK5`** — `quote.ts` nhận bảng giá làm đối số, người gọi cấp — để hàm thuần tuyệt đối và test
> không phải dựng cấu hình site. *(Bản 1 viện thêm lý do "tránh cho `src/lib/booking/*` mọc
> thêm quan hệ import mà `BK1` phải xét". Lý do đó **sai**: `handler.ts:7` đã
> `import { brand, site } from '../../site.config'` từ trước.)*

**URL sinh ra**, ghép bằng `encodeURIComponent` cho từng giá trị — **không** dùng
`URLSearchParams` (nó mã hoá dấu cách thành `+`, ta cần `%20`), và `accountName` có dấu cách:

```
https://img.vietqr.io/image/{bin}-{accountNumber}-compact2.png
  ?amount={total}&addInfo={addInfo}&accountName={accountName%20đã%20mã%20hoá}
```

`compact2` in sẵn số tiền và nội dung lên ảnh — khách đối chiếu bằng mắt trước khi quét.

**Nội dung chuyển khoản khác mã đơn ở chỗ gạch nối.** `addInfo` của VietQR tối đa 50 ký tự và
**không nhận ký tự đặc biệt**; mã đơn `TD-260831-K7QM` có gạch nối. Nên
`addInfo = code.replace(/-/g, '')` → **`TD260831K7QM`**, 12 ký tự, chỉ chữ và số.

Hai hệ quả phải nói rõ ở **mọi** bề mặt: cái khách **thấy** là `TD-260831-K7QM`; cái khách **gõ**
là `TD260831K7QM`. Và khi bảng điều khiển `ADR-0030` §2 làm chức năng đối soát, nó phải khớp
theo **dạng đã bỏ gạch nối** — cột `code` trong D1 vẫn lưu có gạch.

**Ảnh QR không bao giờ là đường duy nhất.** Mọi chỗ hiện QR phải in **ngay cạnh ảnh**, dạng chữ
chọn-copy được: tên ngân hàng, số tài khoản, tên chủ tài khoản, số tiền, nội dung chuyển khoản.
`img.vietqr.io` là bên thứ ba ngoài tầm kiểm soát, và **phần lớn ứng dụng email chặn ảnh từ xa
theo mặc định**.

**Không PII trong URL.** Chỉ tài khoản công ty, số tiền, mã đơn. `ADR-0030` §5 (*"không có tên
hay số điện thoại khách trong đường dẫn đó"*) thoả nguyên văn.

### 4.4 Trang `/dat-tour/{mã đơn}/`

**Hai file, không một:**

| File | Việc |
|---|---|
| `src/lib/booking/detail-html.ts` | `renderBookingDetail(row, banking): string` — **hàm thuần**, dựng toàn bộ HTML |
| `src/pages/dat-tour/[code].astro` | `prerender = false`; vỏ mỏng: đọc D1 → gọi hàm trên → `Response` |

Tách vì **§5 nhóm 4 không chạy được nếu không tách**: `vitest.config.ts` chỉ đăng ký
`cloudflareTest()`, không có plugin Astro, nên không `import` được file `.astro`. Mọi test hiện
có đều gọi hàm thuần hoặc `handleBooking()`. Tách ra thì cổng PII ở §7 test được thật.

**Đọc D1:** `getBookingByCode()` — đã có trong `store.ts:65`, **chưa nơi nào trong `src/` gọi**.
Nó trả `BookingRow` với `pax_json` và `quoted_json` là **chuỗi**. Thêm vào `store.ts` một hàm
`parseBookingRow(row): BookingDetail | null` làm việc `JSON.parse` cả hai và trả `null` khi
hỏng; trang coi `null` như không tìm thấy → 404. Không `JSON.parse` rải trong trang.

**Trang KHÔNG dùng `BaseLayout`, `Header`, `Footer`. Lý do là kỹ thuật, không phải chi phí:**
`src/lib/siteTheme.ts:24` gọi `readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'))`.
Trong Worker lúc chạy **không có hệ tập tin đó**; `catch` nuốt lỗi và trả `'#FFFFFF'`, nên
`<meta name="theme-color">` sẽ sai và im lặng.

> *Bản 1 viện lý do "ba lời gọi Sanity chạy mỗi lượt xem, tốn $1/25k lượt". **Sai** — cả ba
> (`siteTheme.ts:47`, `siteBranding.ts:16`, `siteContact.ts:14`) memo hoá ở tầng module bằng
> `let cached`, nên tốn một lần mỗi isolate lạnh, không phải mỗi lượt xem. Kết luận giữ, lý do
> thay.*

Trang tự chứa và `import '../../styles/tokens.css'` — Astro gói lúc dựng, không đụng Sanity lúc
chạy. **Dùng token thật, không viết cứng màu**: nợ ở §9 không nhân lên.

**Ngôn ngữ: trang chỉ có tiếng Việt.** `handler.ts:220` viết cứng `lang: 'vi'` cho mọi đơn, và
URL không mang tiền tố ngôn ngữ. Trang gọi `uiCopy('vi')`. Lưu ý cho người thi công: thêm khoá
vào `uiCopy.ts` vẫn phải viết **đủ 5 bản dịch** vì kiểu bắt thế — thiếu một bản là `astro check`
đỏ; đó là hệ quả của kiểu, không phải trang cần 5 ngôn ngữ.

**Luật hiển thị — luật cứng:**

| Hiện | Không hiện |
|---|---|
| Mã đơn, tên tour, ngày khởi hành | Tên khách |
| Số khách (tách hạng, dùng `PAX_LABEL_VI`), tổng tiền, hình thức thanh toán | Số điện thoại |
| Mã QR + khối chữ tài khoản *(chỉ khi `transfer`)* | Email, điểm đón, ghi chú |

Vế phải **đúng bằng** danh sách PII mà `BK3` liệt kê (`04-CONSTRAINTS.md:94`).

Mã đơn dò được — 31⁴ ≈ 923k tổ hợp mỗi ngày, không gian hữu hạn. Người dò trúng thấy *"có ai đó
đặt tour X ngày Y hết Z đồng"*. Chấp nhận được. **Không thêm lớp xác thực phụ**: nút CTA một
chạm không mang được thử thách kiểu nhập 4 số cuối SĐT, thêm vào là phá chính cơ chế đang dựng.
Bù bằng **một luật WAF giới hạn tần suất trên `/dat-tour/*`**, cùng khuôn luật đã có cho
`/api/dat-tour` — bước runbook ghi vào `BUILD-NOTES.md`, không phải mã.

**Phản hồi:** mã không tồn tại / sai định dạng / `quoted_json` hỏng → trang **tự trả**
`new Response(html404, { status: 404 })`, không rơi về `src/pages/404.astro`
(`not_found_handling` trong `wrangler.toml` chi phối **asset**, không chi phối route Worker).
Không thông điệp nào phân biệt ba ca. Mọi phản hồi mang `Cache-Control: no-store` — cùng luật
`handler.ts:68` đang dùng, vì trang in dữ liệu đơn. `<meta name="robots" content="noindex">`.

**Hình dạng site đổi, phải ghi lại.** Hiện `src/pages/api/dat-tour.ts:6` là route
`prerender = false` **duy nhất**. Thêm trang này là hai. Cần một ADR ghi nhận, và sửa chú thích
`wrangler.toml:2–3` (xem §4.8 để biết chuỗi **thật** cần sửa).

### 4.5 Khối thành công trên form — `BookingForm.astro`

Bề mặt **mọi khách** nhìn thấy: không phụ thuộc email, Zalo, hay thủ tục nào.

**Cấu hình `banking` tới script trình duyệt bằng đường `import`, không qua `Astro.props`.**
`BookingForm.astro` đang chạy song song hai khuôn: nướng qua props → `data-*` → `JSON.parse`
(dùng cho `priceTable`, `seasons`, `prepayPercent` — dữ liệu đọc từ Sanity lúc dựng), và script
`import` thẳng module (`:234` đang `import { LIMITS, MSG, buildQuotedPayload } from
'../lib/booking/schema'`). `banking` là **hằng số biên dịch**, cùng loại với `LIMITS` — nên đi
khuôn thứ hai: `import { banking } from '../site.config'` trong script. **`TourDetail.astro`
không phải sửa**, và bản đồ file §4.8 đúng như đang ghi.

**Chữ ký mới:**

```ts
function showDone(code: string, duplicate: boolean, total: number, paymentMethod: PaymentMethod)
```

`total` lấy từ **`quote.total` phía client**, không phải `data.summary.total` — nhất quán với
dòng "Không đổi hợp đồng JSON của API", và `showDone` hiện đã dựng khối tóm tắt từ `quote`
(`:556–557`) chứ không đọc `data.summary`.

**Khối QR hiện:** ảnh VietQR, và **ngay cạnh** là số tài khoản, tên chủ tài khoản, số tiền, nội
dung chuyển khoản dạng chữ chọn-copy được (§4.3). Chỉ hiện khi `paymentMethod === 'transfer'`.

**Bẫy tiền thật.** Khi đơn **trùng**, `handler.ts:211–213` trả `code: dup` (mã đơn **CŨ**) nhưng
`summary.total` là `v.quoted.total` — tổng của lần nộp **MỚI**. Đường không-JS còn lộ trực tiếp
hơn: `lines: summaryLines(v, dup)` in `Tạm tính: <tổng mới>` ngay dưới mã cũ. Hôm nay đó là một
dòng hiển thị lệch; in con số đó lên **mã QR** thì thành **khách chuyển sai số tiền**. Khoản nợ
này `ADR-0031:191–202` đã ghi sẵn.

> **Luật đơn trùng — danh sách đóng.** Khối thành công hiện **đúng ba thứ**: mã đơn; câu *"Yêu
> cầu này đã được ghi nhận trước đó"*; liên kết *"Xem chi tiết và số tiền đã lưu"* tới
> `/dat-tour/{mã}/`. **Không QR, không dòng tiền, không tên tour, không ngày khởi hành** — vì
> cả bốn đều dựng từ `quote` của lần nộp mới, không phải từ đơn đã lưu. Trang ở §4.4 đọc D1 nên
> in đúng; để nó làm việc đó.

**Đường không-JavaScript** (`html.ts`, `renderBookingPage`): thêm khối chữ tài khoản, **không**
nhúng ảnh QR (trang đó đang mang nợ màu ở §9, thêm ảnh là bồi nợ). Kèm liên kết
`/dat-tour/{mã}/`. Ca đơn trùng: `summaryLines()` phải theo cùng luật danh sách đóng ở trên.

### 4.6 Tách nội dung khách khỏi nội dung nhân viên — `notify/format.ts`

`format.ts` hiện sinh **nội dung cho nhân viên**: đủ tên, SĐT, email, điểm đón, ghi chú, mùa đã
áp, và `totalGoc` — con số nội bộ để người gọi mặc cả. **Không gửi cái đó cho khách được.**

```ts
export function formatStaffText(b: NewBooking): string          // đổi tên từ formatText, giữ nguyên nội dung
export function formatCustomerText(b: NewBooking, qr: PaymentQr | null): string
export function formatCustomerHtml(b: NewBooking, qr: PaymentQr | null): string
```

`qr` là **tham số**, không tự dựng trong `format.ts` — cùng lý do khuôn `BK5` ở §4.3; người gọi
(`ses.ts`) dựng bằng `buildPaymentQr(banking, …)` rồi truyền vào. Nội dung khách: mã đơn, tour,
ngày, số khách, tổng tiền, hình thức thanh toán, khối thanh toán. **Không** `totalGoc`, **không**
điểm đón, **không** ghi chú.

**`formatCustomerHtml` CÓ nhúng `<img src={qr.imageUrl}>`**, kèm khối chữ bên cạnh. Thư là bề
mặt duy nhất ảnh đáng giá, và khối chữ đã phủ ca ứng dụng chặn ảnh. (Khác `html.ts` ở §4.5 —
chỗ đó không nhúng vì lý do nợ màu, không phải vì ảnh vô dụng.)

> **`notify/zalo.ts` cũng phải sửa:** `zalo.ts:6` đang `import { formatText } from './format'`.
> Đổi tên hàm là vỡ nó. *(Bản 1 bỏ sót file này khỏi bản đồ.)*

### 4.7 Kênh báo tin — `notify/index.ts`, `store.ts`, `notify/zns.ts`, `zalo-token.ts`

**Bốn tên notifier, chọn tên là định danh hợp lệ** để `out[n.name]` giữ nguyên hình dạng
(`notify/index.ts:22`): `'email'`, `'zalo'`, `'emailKhach'`, `'zns'`. Ánh xạ tên → cột nằm
**trong `store.ts`**, một bảng hằng, không rải ở `handler.ts`:

| Tên notifier | Cột D1 |
|---|---|
| `email` | `notify_email` |
| `zalo` | `notify_zalo` |
| `emailKhach` | `notify_customer_email` |
| `zns` | `notify_zns` |

Luật trạng thái giữ y khuôn đang chạy: thiếu bí mật → `skipped`; hỏng → `failed:…`; **không bao
giờ ném ra ngoài**. Khách không điền email → `skipped`.

**Dòng log ở `handler.ts:237` phải mở thành bốn trường**, nếu không hai kênh mới mất quan sát:
`[dat-tour] {code} email={..} zalo={..} emailKhach={..} zns={..}`. Luật `console.error` khi
không kênh nào `sent` giữ nguyên.

**Ba biến môi trường mới**, đặt bằng `wrangler secret put` (`BK4` cấm `[vars]`):
`ZALO_OA_APP_ID`, `ZALO_OA_SECRET_KEY`, `ZNS_TEMPLATE_ID`.

**Hợp đồng gọi ZNS** — trong repo không có tiền lệ (`zalo.ts` là Zalo **Bot** API, khác hẳn):

- `POST https://business.openapi.zalo.me/message/template`, header `access_token`.
- Thân: `{ phone, templateId, templateData: { ma_don, ten_tour, ngay_khoi_hanh, so_khach,
  tong_tien, hinh_thuc_thanh_toan } }`. **Khoá `templateData` KHÔNG có ngoặc nhọn** — ngoặc chỉ
  dùng khi soạn mẫu ở §4.1.
- **Số điện thoại phải đổi dạng.** D1 lưu `0xxxxxxxxx` (chuẩn hoá ở `schema.ts`); ZNS cần
  `84xxxxxxxxx`. Đổi **trong `zns.ts`**, không đụng `schema.ts` hay D1.
- `sent` khi thân trả `error === 0`; ngược lại `failed:{error}:{message}`.

> **Chưa chốt, xác nhận khi nộp mẫu:** tên khoá là `templateId`/`templateData` (camelCase, theo
> tài liệu ZBS Template Message API) hay `template_id`/`template_data` (snake_case, theo tài
> liệu ZNS v2 cũ). Hai kiểu cùng lưu hành trong tài liệu Zalo. Đọc bản PDF *ZBS Template Message
> API* trên cổng developers lúc đăng ký và chốt **một** kiểu; đây là chỗ duy nhất trong spec
> chấp nhận xác nhận muộn, vì nó kiểm được trong 5 phút bằng một lời gọi thật.

**Token Zalo OA tự xoay và dùng được đúng một lần.** `access_token` sống **1 giờ**;
`refresh_token` sống **3 tháng** nhưng **dùng được đúng một lần** — mỗi lần làm mới sinh cặp mới
và **vô hiệu cặp cũ**. Không để trong `wrangler secret`: secret bất biến lúc chạy, và đêm 29/08
đã có lần build **xoá sạch secrets**. Chỗ đúng là **D1**, hợp `BK2`.

`zalo-token.ts` xuất đúng một hàm:

```ts
export async function getAccessToken(db: D1Database, o: {
  appId?: string; secretKey?: string; fetchImpl?: typeof fetch; now?: () => Date
}): Promise<string | null>
```

Trả `null` (không ném) khi: thiếu biến môi trường, bảng chưa có `refresh_token`, hoặc làm mới
hỏng. `zns.ts` gặp `null` → `skipped` khi chưa cấu hình, `failed:token` khi có cấu hình mà làm
mới hỏng.

**Luật làm mới:**

1. Đọc hàng `id = 1`. Không có hàng, hoặc `refresh_token` rỗng → trả `null`.
2. Còn hạn (`expires_at` **trừ 5 phút biên** vẫn ở tương lai) → dùng `access_token` đang có.
3. Hết hạn → gọi Zalo làm mới, rồi ghi **so-rồi-đổi**:
   `UPDATE zalo_token SET … WHERE id = 1 AND refresh_token = <cái vừa đọc>`.
4. `changes = 0` → người khác đã làm mới. **Đọc lại một lần và dùng token của họ.** Nếu token
   đọc lại **cũng** hết hạn → trả `null`, **không lặp** (một vòng, không đệ quy — vòng lặp ở đây
   là đường tới bão yêu cầu khi Zalo hỏng).
5. Zalo trả lỗi ở bước 3 → **không ghi gì vào D1**, trả `null`. Ghi đè bằng kết quả hỏng là làm
   đứt chuỗi vĩnh viễn.

**Hàng đầu tiên vào hệ bằng tay, và đó là bước runbook bắt buộc.** Migration `0003` tạo bảng
**rỗng**, không chèn hàng. Sau khi uỷ quyền OA lần đầu, người vận hành chạy một lệnh
`wrangler d1 execute --remote` chèn `id=1` kèm `refresh_token` lấy từ luồng uỷ quyền. Chưa chèn
thì `zns` trả `skipped` — hỏng ồn ào theo cột `notify_zns`, không phải hỏng câm. Lệnh cụ thể ghi
vào `BUILD-NOTES.md`.

**Migration `0003_kenh_bao_khach.sql` — hình dạng đầy đủ:**

```sql
ALTER TABLE booking ADD COLUMN notify_customer_email TEXT;   -- nullable, khuôn 0001
ALTER TABLE booking ADD COLUMN notify_zns TEXT;

CREATE TABLE zalo_token (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at    TEXT NOT NULL,   -- ISO 8601 UTC, cùng khuôn created_at của booking
  updated_at    TEXT NOT NULL
);
```

`expires_at` là **ISO 8601**, không phải epoch — Zalo trả `expires_in` (giây), `zalo-token.ts`
cộng vào thời điểm hiện tại rồi `.toISOString()`. Một khuôn thời gian cho cả cơ sở dữ liệu.

### 4.8 Bản đồ file

| File | Việc |
|---|---|
| `src/site.config.ts` | khối `banking`; sửa **hai chỗ** trong chú thích đầu file (§4.2) |
| `src/lib/booking/payment-qr.ts` | **mới** — `buildPaymentQr()` |
| `src/lib/booking/detail-html.ts` | **mới** — `renderBookingDetail()`, hàm thuần, để test được |
| `src/lib/booking/zalo-token.ts` | **mới** — `getAccessToken()`, so-rồi-đổi |
| `src/lib/booking/notify/zns.ts` | **mới** — notifier ZNS tới SĐT khách |
| `src/pages/dat-tour/[code].astro` | **mới** — vỏ mỏng, `prerender = false` |
| `migrations/0003_kenh_bao_khach.sql` | **mới** — 2 cột + bảng `zalo_token` (§4.7) |
| `src/lib/booking/notify/format.ts` | đổi tên `formatText`; thêm 2 hàm nội dung khách |
| `src/lib/booking/notify/zalo.ts` | **sửa import** `formatText` → `formatStaffText` |
| `src/lib/booking/notify/index.ts` | union `Notifier.name` thành 4; kiểu trả `notifyAll` |
| `src/lib/booking/notify/ses.ts` | notifier thứ hai gửi cho khách |
| `src/lib/booking/store.ts` | `parseBookingRow()`; bảng ánh xạ tên→cột; `updateNotifyStatus` 4 cột; đọc/ghi `zalo_token` |
| `src/lib/booking/handler.ts` | 4 notifier; 3 biến ZNS vào `BookingEnv`; dòng log 4 trường |
| `src/components/BookingForm.astro` | khối QR; `showDone()` chữ ký mới; luật đơn trùng |
| `src/lib/booking/html.ts` | khối chữ tài khoản + liên kết; luật đơn trùng |
| `src/lib/uiCopy.ts` | nhãn khối QR, **đủ 5 bản dịch** (kiểu bắt buộc) |
| `wrangler.toml` | sửa chú thích **dòng 2–3** — xem ô cảnh báo dưới |
| `docs/adr/ADR-00xx-route-dong-thu-hai.md` | **mới** — ghi nhận site có hai route on-demand |
| `docs/DECISIONS.md` | QĐ nới `BK3` (§6) + QĐ nới nguyên tắc chia của `site.config` (§4.2) |
| `docs/core-specs/04-CONSTRAINTS.md` | sửa `BK3` theo §6 |
| `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md` | thêm `/dat-tour/{code}/` vào bảng URL — **chỉ vậy** |
| `docs/DRIFT_LOG.md` | ghi drift: `05-URL_MAP` §2 vẫn nói *"không có DB nào khác"* dù D1 có từ ADR-0027 |
| `BUILD-NOTES.md` | bước áp migration; lệnh chèn hàng `zalo_token` đầu tiên; luật WAF `/dat-tour/*` |

> **Chuỗi cần sửa trong `wrangler.toml` KHÔNG phải "route on-demand DUY NHẤT"** — cụm đó không
> tồn tại trong file. *(Bản 1 trích bịa.)* Nguyên văn dòng 2–3 là: *"…từ ADR-0027 được deploy để
> chạy route on-demand /api/dat-tour. Mọi trang khác vẫn là asset tĩnh, phục vụ trước Worker."*
> Mệnh đề mang nghĩa "duy nhất" là **"Mọi trang khác vẫn là asset tĩnh"** — đó là chỗ phải sửa.

> **Hàng `05-URL_MAP` thu hẹp so với bản 1.** Bản 1 ghi *"thêm `/dat-tour/{code}` và 2 cột +
> bảng mới"*. Không làm được: file đó **không có** bảng `booking`, không có D1, và §2 dòng 130
> còn khẳng định thành văn *"Không có DB nào khác: hai nguồn duy nhất của hệ là Sanity dataset
> và `prices.yaml` (P6, S2.7)"*. Thêm hai cột vào đó là **đảo một phát biểu P6/S2.7** — phạm vi
> lớn hơn hẳn. Đây là drift có từ `ADR-0027` (D1 ra đời mà `05` không cập nhật), spec này không
> tạo ra nó và **không sửa nó**: chỉ thêm URL, và ghi drift vào `DRIFT_LOG.md`.

## 5. Kiểm thử

Bốn nhóm, không nhóm nào cần mạng. Khuôn hiện có: `vitest.config.ts` đăng ký `cloudflareTest()`,
mọi test trong `test/booking/` gọi hàm thuần hoặc `handleBooking()`.

1. **`test/booking/payment-qr.test.ts`** — URL đúng khuôn, khoảng trắng mã hoá `%20` (không
   `+`); `addInfo` bỏ gạch nối; trả `null` khi `onboard`; số tiền bằng `quoted.total`.
2. **`test/booking/notify.test.ts` mở rộng** — bốn notifier, bốn trạng thái, `fetchImpl` giả.
   Ca quan trọng nhất: **`formatCustomerText()` KHÔNG chứa `totalGoc`, điểm đón, ghi chú** —
   khẳng định trực tiếp trên chuỗi sinh ra. Thêm ca `zns.ts` đổi `0…` → `84…`.
3. **`test/booking/zalo-token.test.ts`** — hết hạn thì làm mới; biên 5 phút; so-rồi-đổi khi
   `changes = 0` thì **đọc lại đúng một lần** rồi bỏ cuộc; Zalo trả lỗi thì **không ghi D1**;
   bảng rỗng → `null`.
4. **`test/booking/detail-html.test.ts`** — gọi `renderBookingDetail()` (hàm thuần, §4.4):
   **HTML sinh ra không chứa tên, SĐT, email, điểm đón, ghi chú của đơn**; đơn `onboard` không
   chứa `img.vietqr.io`; `quoted_json` hỏng → `parseBookingRow()` trả `null`.

Thêm hai ca cho §4.5, đặt trong `test/booking/quote.test.ts` (phần thuần của khối thành công)
hoặc kiểm bằng nghiệm thu tay ở §8 nếu không tách được khỏi script Astro: đơn trùng thì khối
thành công **không** chứa `img.vietqr.io` và **không** chứa dòng tiền nào.

## 6. Sửa `BK3` — đây là **nới** ràng buộc, chủ dự án đã duyệt

`04-CONSTRAINTS.md:94` hiện ghi *"PII (tên, SĐT, email, điểm đón, ghi chú) chỉ ở D1 và **hai tin
báo**"*, mức **fail**. Sau đợt này có bốn tin báo, và quan trọng hơn: **số điện thoại khách đi
sang VNG** làm địa chỉ nhận ZNS, **email khách đi sang AWS SES** làm người nhận thật thay vì chỉ
nằm trong thân thư. Hai chỗ mới mà PII chảy tới.

Theo `04-CONSTRAINTS.md:135` đây là **nới** → cần chủ dự án phê chuẩn kèm lý do ghi vào
`DECISIONS.md`. **Đã duyệt trong phiên 2026-08-31.** Bản sửa: liệt kê đích danh bốn kênh và hai
bên thứ ba (AWS SES, VNG/Zalo); giữ nguyên mức **fail**; giữ nguyên mọi điều cấm còn lại.

## 7. Cổng phải xanh trước khi gộp

- `npm run gate` (`astro check` + `gate:all`) — baseline là 4 đỏ đã biết, không thêm cái thứ 5.
- **Validator hình dạng `banking`, mức fail.** File: `scripts/validators/banking-shape.ts`, chạy
  qua `scripts/run-gates.mjs` **trong `gate:all`** — không phải trong `npm run build` (hai chuỗi
  lệnh khác nhau: `build` = `astro check && astro build`). Kiểm: `bin` đúng 6 chữ số,
  `accountNumber` 1–19 ký tự chữ/số, `accountName` không rỗng và không dấu. Đây là **chỗ duy
  nhất** kiểm hình dạng `banking` (§4.3 nói rõ hàm không tự kiểm).
- **`dist/_routes.json` sau build phải có `/dat-tour/*` trong `include`.** Hiện `include` có 3
  mục (`/_server-islands/*`, `/_image`, `/api/*`) và `exclude` có 30 → **tổng 33**, hạn mức 100
  của Cloudflare tính cả hai mảng nên còn xa. *(Bản 1 ghi 34, nhầm cột.)* Adapter Astro được
  **kỳ vọng** tự thêm khi thấy trang `prerender = false`; đó là kỳ vọng, không phải bằng chứng.
  **Không có dòng này thì trang trả 404 và toàn bộ mục tiêu (1) chết câm** — production hiện đã
  chứng minh: `GET /dat-tour/TD-260831-K7QM/` trả **404**, `/api/dat-tour` trả **405**.
  Kiểm bằng một dòng trong `run-gates.mjs` đọc `dist/_routes.json`. Nếu adapter **không** tự
  thêm: khai tay `_routes.json` qua `public/_routes.json` và ghi lý do vào ADR ở §4.8.
- Cổng PII: nhóm test 4 ở §5.

## 8. Vận hành

**Bốn kiểu hỏng, bốn cách chịu.** Đơn đã nằm trong D1 trước khi bất kỳ kênh nào chạy.

| Hỏng ở đâu | Khách thấy gì | Hệ ghi lại gì |
|---|---|---|
| `img.vietqr.io` chết hoặc bị chặn | Khối chữ cạnh ảnh vẫn đủ để chuyển tay (§4.3) | không gì |
| ZNS hỏng / token đứt / SĐT không có Zalo | Không có tin Zalo; vẫn có khối thành công và thư | `notify_zns = failed:…` / `skipped` |
| Khách không điền email | Không có thư | `notify_customer_email = skipped` |
| **Cả bốn kênh im** | Vẫn thấy "sẽ gọi lại xác nhận" | `console.error` — dòng đã có ở `handler.ts` |

Hàng cuối **đã xảy ra thật đêm 29/08**.

**Thứ tự thi công.** Đường găng là **nộp mẫu ZNS trước tiên** (§4.1). Rồi: hàm QR (§4.3, mở khi
có số tài khoản thật) → hàm thuần dựng HTML + trang (§4.4) → khối thành công (§4.5) → tách nội
dung (§4.6) → kênh báo tin và token (§4.7). Trang phải xong trước khi ZNS bật.

**Trước khi merge — bước bắt buộc, bản 1 bỏ sót:**

> `npx wrangler d1 migrations apply tourdao-booking --remote` **trước khi merge/push vào
> `main`**, vì **merge vào `main` chính là deploy** (Workers Builds). Bỏ bước này thì hỏng
> **câm**, không như lần trước: `INSERT` không đụng cột mới nên đơn vẫn vào D1, nhưng
> `updateNotifyStatus` ghi cột chưa tồn tại sẽ ném — và cú ném rơi đúng vào `try/catch` M6 ở
> `handler.ts:245`. Kết quả: **mất toàn bộ trạng thái báo tin**, mọi lượt đọc `zalo_token` hỏng,
> ZNS chết. **Không cổng nào đỏ.**

Sau khi uỷ quyền OA lần đầu: chèn hàng `zalo_token` (§4.7), lệnh ở `BUILD-NOTES.md`.

**Nghiệm thu tay — bốn bước, theo thứ tự.**

> **Đơn nghiệm thu là đơn THẬT trong D1 production và sẽ bắn cả bốn kênh** — tốn tiền ZNS và
> nhắn vào một máy thật. `handler.ts` **không có** chế độ thử. Nên: dùng **SĐT và email của nhân
> viên**, báo trước người trực, và **xoá đơn ngay sau khi nghiệm thu** bằng
> `wrangler d1 execute --remote --command "DELETE FROM booking WHERE code='TD-…'"`. Không xoá
> thì bảng điều khiển `ADR-0030` §2 sẽ đếm nó như đơn thật. Bước 1–2 chạy được trên `astro dev`
> với D1 cục bộ; bước 3 thì không, vì Zalo phải gọi vào domain thật.

1. Đặt đơn chọn *chuyển khoản trước* → quét QR bằng app ngân hàng → **số tiền và nội dung hiện
   đúng trên màn hình app**, chưa chuyển tiền.
2. Mở `/dat-tour/{mã}/` trên điện thoại → đối chiếu bảng §4.4, không trường nào ở cột phải xuất
   hiện. Nộp lại đúng đơn đó lần hai → khối thành công chỉ hiện ba thứ theo luật đơn trùng §4.5.
3. Kiểm tin Zalo tới máy thật, bấm nút CTA, xem có mở đúng trang không.
4. `wrangler d1 execute` đọc bốn cột `notify_*` của đơn đó.

## 9. Còn nợ

- **Chuỗi token sống nhờ lưu lượng.** Site **3 tháng liền không có đơn nào** thì `refresh_token`
  hết hạn và ZNS chết — im lặng. Cách chặn triệt để là Cron Trigger làm mới hằng ngày, nhưng
  adapter Astro tự xuất `default` cho Worker nên gắn `scheduled` phải bọc thêm một lớp quanh
  `dist/_worker.js/index.js` — mong manh. **Chủ dự án chốt chấp nhận rủi ro**; bước cấp lại
  token ghi vào runbook, bảng điều khiển `ADR-0030` §2 phải lộ cột `notify_zns`.
- **Nợ màu và cỡ chữ — lớn hơn bản 1 ước, và ở hai file theo hai kiểu khác nhau.** Luật
  `ADR-0030` §4 cấm *"mã màu **và cỡ chữ** viết cứng"*:
  - `html.ts` mang nợ **màu**: **sáu** mã, không phải hai — `:7` `#0C4A6E`/`#96271A`, `:9`
    `#F8FAFC`/`#0F172A`, `:10` `#fff`/`#E2E8F0` — cộng `font-size:22px` ở `:11`.
  - `notify/format.ts` **không có mã màu nào**; nó mang nợ **cỡ chữ và font**: `font-size:15px`,
    `font-family:system-ui,sans-serif` ở `:75`. *(Bản 1 nói file này viết cứng màu — sai.)*
  - Hai mã ở `html.ts:7` bằng `--c-primary`/`--c-accent-strong` **chỉ với bộ token mặc định**;
    `tokens.css` còn hai bộ đè (`:204`/`:209`, `:223`/`:228`) cho giá trị khác. Nên `html.ts`
    không chỉ trùng lặp — nó **sai** khi site đổi bộ token.
  - Đợt này **không nhân lên** (trang mới ở §4.4 dùng token thật) nhưng cũng **không trả**.
- **Đối soát vẫn là việc tay.** Nợ mở của `ADR-0031` — hệ không đo được chuyện khách chọn chuyển
  khoản rồi không chuyển — còn nguyên; mã QR không thu hẹp nó.
- **`summary.total` của đơn trùng vẫn lệch** trong hợp đồng JSON và trong `summaryLines()`. Đợt
  này chỉ *tránh*, **không sửa** gốc. Sửa gốc là đổi `handler.ts` để đọc lại đơn cũ từ D1 —
  phạm vi khác, cần quyết định riêng.
- **`05-URL_MAP` §2 vẫn nói sai** rằng hệ không có DB nào ngoài Sanity và `prices.yaml`. Ghi vào
  `DRIFT_LOG.md`, không sửa ở đợt này (§4.8).

## 10. Bản 1 sai những gì

Ghi lại để lần sau không lặp, và để người đọc bản 1 biết chỗ nào đã đổi.

| Sai | Thật | Hậu quả nếu không bắt |
|---|---|---|
| `so_khach` hạn 20, `hinh_thuc_thanh_toan` hạn 22 | 48 và 24 | **Nặng nhất** — mẫu bị từ chối, mất thêm 2 ngày trên đường găng |
| *"ba lời gọi Sanity chạy mỗi lượt xem"* | Cả ba memo hoá tầng module | Luận cứ sai chống một kết luận đúng; lý do thật là `readFileSync` không chạy trong Worker |
| `notify/format.ts` viết cứng màu | Không mã màu nào; nó nợ **cỡ chữ** | Ước sai khối lượng trả nợ |
| Trích `ADR-0030` **§3** cho phần token (4 chỗ) | Là **§4**; §3 là giá mùa vụ | Người thi công mở nhầm mục |
| Trích `wrangler.toml` *"route on-demand DUY NHẤT"* | Cụm đó **không tồn tại** trong file | `grep` ra rỗng, không biết sửa gì |
| `05-URL_MAP`: *"thêm 2 cột + bảng mới"* | File không có bảng `booking` nào để thêm | Che mất một drift từ `ADR-0027` |
| `_routes.json` "hiện 34" | 3 include + 30 exclude = **33** | Nhầm cột, không đổi kết luận |
| Bỏ sót: bước áp migration; `zalo.ts` trong bản đồ; bootstrap `zalo_token`; hợp đồng ZNS; chữ ký `showDone`; cách test trang `.astro`; ADR/`DECISIONS.md`/`BUILD-NOTES.md` | — | Tám chỗ người thi công buộc phải đoán |
