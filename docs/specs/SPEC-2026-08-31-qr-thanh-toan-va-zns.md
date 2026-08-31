# SPEC — Mã QR chuyển khoản và kênh báo tin thẳng tới khách

- **Ngày:** 2026-08-31   **Soạn:** Claude (qua Cowork)   **Duyệt QA1:** *(chờ)*
- **Quyết định chi phối:** `ADR-0030` §5 (QR là tiện ích, không ràng buộc), `ADR-0031` §2,
  `ADR-0027` quyết định 3 và 7, `QĐ-2026-08-22-07` (SES)
- **Ràng buộc:** `04-CONSTRAINTS` §1d `BK1`–`BK5`, §2 điều cấm 3
- **Nhánh gốc:** `main` tại `db4d067` trở đi (đã có cửa sổ 90 ngày và ưu đãi thanh toán trước)
- **Sáu mục thiết kế đã được chủ dự án duyệt lần lượt trong phiên 2026-08-31.**

## 1. Mục tiêu

Hai việc, một đường dữ liệu:

1. **Báo cho khách qua Zalo OA tới số điện thoại của họ** khi đơn được tạo — mọi đơn, không
   riêng đơn chuyển khoản.
2. **Mã QR chuyển khoản cho từng đơn**: hiện ngay sau khi đặt thành công, và gửi kèm qua Zalo
   lẫn email.

## 2. Ba câu chủ dự án chốt trong phiên

1. **Zalo OA đã xác thực**, hiện gửi được tin cho ID biết trước (báo cho admin). Chưa liên kết
   ZBS Account, chưa nạp tiền, chưa có mẫu tin được duyệt.
2. **Nội dung chuyển khoản là mã đơn**, không phải `TEN_So_dien_thoai`. Mục đích của nội dung
   đó là *"để nhân viên đối chiếu tiền về ứng với đơn nào"* — mã đơn làm việc đó tốt hơn và
   không đụng `BK3`. Chủ dự án xác nhận giữ nội dung chuyển khoản **khác** mã đơn ở chỗ gạch
   nối (xem §4.3).
3. **Tài khoản ngân hàng khai trong `src/site.config.ts`**, không trong Sanity.

## 3. Không làm gì (ranh giới)

- **Không** thêm cổng thanh toán, ô nhập thẻ, webhook báo tiền. Site vẫn **không biết** tiền đã
  về hay chưa, vẫn **không có** trạng thái "đã cọc". `ADR-0027` dòng *"thanh toán / đặt cọc
  online — ngoài phạm vi"* và `00-PROJECT_BRIEF` §5 không bị đảo.
- **Không** đổi ô email trên form thành bắt buộc. Đó là đánh đổi tỷ lệ điền form, thuộc quyền
  chủ dự án; SĐT vốn đã bắt buộc nên ZNS phủ được phần lớn khách.
- **Không** thêm Cron Trigger làm mới token trong đợt này (xem §4.7 và §8).
- **Không** thêm lớp xác thực phụ cho trang tra đơn (xem §4.4).
- **Không** động tới `ADR-0007` (nguồn giá), đường nhập giá qua Google Sheet, hay hình dạng
  "tĩnh + route động" ngoài đúng một route mới được ghi ở §4.4.

## 4. Thiết kế

### 4.1 Mẫu tin ZNS — nộp trước tiên, đây là đường găng

Duyệt mẫu mất **2 ngày làm việc** và là thời gian chờ bên ngoài, nối tiếp. Nội dung mẫu ràng
buộc mọi thứ phía sau, nên nó là sản phẩm của thiết kế chứ không của thi công.

**Một mẫu duy nhất cho mọi đơn** — không tách theo hình thức thanh toán. Mục tiêu là báo cho
khách *khi họ đặt tour*, không riêng khách chuyển khoản; một mẫu thì một lần duyệt, và trang
đích tự quyết định có hiện QR hay không.

**Loại mẫu:** Tin giao dịch.

**Nội dung** (≈289 ký tự khi thay hết tham số; hạn mức 400):

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

**Đúng một nút CTA:** nhãn *"Xem chi tiết đơn"* → `https://tourdao.vn/dat-tour/<ma_don>/`.
Domain chính chủ nên nút đầu **miễn phí**. Không thêm nút "Gọi hotline": nút thứ hai tính thêm
tiền mỗi tin, và số điện thoại **bị cấm đặt trong thân tin** nên nó cũng không thay thế được gì.

**Sáu tham số, kèm hạn dài phải khai lúc đăng ký:**

| Tham số | Nguồn | Hạn | Ghi chú |
|---|---|---|---|
| `<ma_don>` | `booking.code` | 14 | `TD-260831-K7QM` |
| `<ten_tour>` | `tour_title` | **60** | **Phải cắt.** `LIMITS.TITLE_MAX` là 200 — để nguyên là vỡ hạn mức 400 |
| `<ngay_khoi_hanh>` | `depart_date` | 10 | `31/08/2026` |
| `<so_khach>` | `pax_json` | 20 | `2 người lớn, 1 trẻ em` |
| `<tong_tien>` | `quoted.total` | 15 | `1.450.000₫` |
| `<hinh_thuc_thanh_toan>` | `payment_method` | 22 | `Chuyển khoản trước` / `Thanh toán khi khởi hành` |

Tên tham số viết thường, nối bằng gạch dưới, không dấu — theo luật đặt tên của Zalo.

**Ba việc của chủ dự án, không phải của code:** logo hai bản (sáng và tối, nền trong suốt, bản
tối là logo âm bản, cùng tỉ lệ); liên kết OA với ZBS Account và **nạp tiền**; nộp mẫu.

**Chưa xác minh:** tham số động nằm trong **đường dẫn** (`/dat-tour/<ma_don>/`) có được duyệt
không, hay Zalo chỉ nhận tham số ở **query string** (`/dat-tour/?ma=<ma_don>`). Hai dạng dựng
được như nhau ở phía code. Nộp thử dạng đường dẫn trước; bị từ chối thì đổi, không sửa gì trong
thiết kế này.

### 4.2 Cấu hình ngân hàng — `src/site.config.ts`

```ts
export const banking = {
  bin: '970436',                          // BIN NAPAS, đúng 6 chữ số
  accountNumber: '...',                   // 1–19 ký tự chữ/số
  accountName: 'CONG TY TNHH TOUR DAO',   // IN HOA, KHÔNG DẤU — theo lệ ngân hàng
} as const
```

> **Ba giá trị trên là KHUÔN, không phải số thật.** `970436` là BIN của Vietcombank, dùng làm ví
> dụ định dạng. Chủ dự án cấp cả ba giá trị thật trước khi thi công §4.3; **không đoán, không
> lấy số của ai khác để chạy thử.** Chưa có số thật thì task §4.3 chưa mở.

Khối chú thích đầu file phải thêm một dòng ghi nhận **nguyên tắc chia đã nới**: từ *"thứ gì đổi
thì URL đổi theo thì nằm ở file này"* thành *"thứ đổi URL, **hoặc** thứ biên tập viên không
được phép chạm"*. Lý do: biên tập viên không được có quyền đổi hướng dòng tiền của khách. Đó là
ranh giới thật của file, và số tài khoản thuộc về nó dù không đổi URL.

### 4.3 Lớp nghiệp vụ — `src/lib/booking/payment-qr.ts`

Một hàm thuần. Nhận mã đơn, tổng tiền, hình thức thanh toán. Trả
`{ imageUrl, addInfo, amount, bin, accountNumber, accountName }` — hoặc **`null` khi
`paymentMethod !== 'transfer'`**. Không mạng, không D1, không Astro; test chạy dưới một giây.
Đúng tiêu chí lớp nghiệp vụ của `ADR-0030` §1.

URL sinh ra:

```
https://img.vietqr.io/image/{bin}-{accountNumber}-compact2.png
  ?amount={total}&addInfo={addInfo}&accountName={accountName}
```

`compact2` in sẵn số tiền và nội dung lên ảnh — khách đối chiếu bằng mắt trước khi quét.

**Nội dung chuyển khoản khác mã đơn ở chỗ gạch nối.** `addInfo` của VietQR tối đa 50 ký tự và
**không nhận ký tự đặc biệt**; mã đơn `TD-260831-K7QM` có gạch nối. Nên `addInfo` là **mã đơn
bỏ gạch nối: `TD260831K7QM`** — 12 ký tự, chỉ chữ và số, vẫn duy nhất, vẫn đọc ra ngày.

Hai hệ quả phải nói rõ ở **mọi** bề mặt: cái khách **thấy** là `TD-260831-K7QM`; cái khách
**gõ** vào nội dung chuyển khoản là `TD260831K7QM`. Và khi bảng điều khiển `ADR-0030` §2 làm
chức năng đối soát, nó phải khớp theo **dạng đã bỏ gạch nối** — cột `code` trong D1 vẫn lưu có
gạch.

**Ảnh QR không bao giờ là đường duy nhất.** Mọi chỗ hiện QR phải in **ngay cạnh ảnh**, dạng chữ
chọn-copy được: tên ngân hàng, số tài khoản, tên chủ tài khoản, số tiền, nội dung chuyển khoản.
Lý do không phải cầu toàn: `img.vietqr.io` là bên thứ ba ngoài tầm kiểm soát, và **phần lớn ứng
dụng email chặn ảnh từ xa theo mặc định**.

**Không PII trong URL.** Chỉ tài khoản công ty, số tiền, mã đơn. `ADR-0030` §5 (*"không có tên
hay số điện thoại khách trong đường dẫn đó"*) thoả nguyên văn; `BK3` không bị đụng ở đây.

### 4.4 Trang `/dat-tour/{mã đơn}`

`src/pages/dat-tour/[code].astro`, `export const prerender = false`. Đọc D1 qua
`getBookingByCode()` — hàm này **đã có sẵn** trong `store.ts` và cho tới nay chưa ai gọi.

**Trang KHÔNG dùng `BaseLayout`, `Header`, `Footer`.** `BaseLayout` gọi `await fetchSiteTheme()`
và `await fetchSiteBranding()`; `Header` gọi `await fetchSiteContact()`. Trên một trang
`prerender = false`, ba lời gọi đó chạy **mỗi lượt xem** — mỗi khách bấm nút trong tin Zalo
thành vài lượt gọi API Sanity. Gói Growth **cho vượt hạn mức không trần, tính $1 mỗi 25k lượt**,
nên đây là đường rò tiền im lặng, chưa kể độ trễ.

Thay vào đó trang tự chứa và `import '../../styles/tokens.css'` — Astro gói lúc dựng, không đụng
Sanity lúc chạy. **Trang dùng token thật, không viết cứng màu.** Nợ của `ADR-0030` §3 không nhân
lên ở đây; nó vẫn đúng hai chỗ cũ là `html.ts` và `notify/format.ts`.

**Luật hiển thị — luật cứng:**

| Hiện | Không hiện |
|---|---|
| Mã đơn, tên tour, ngày khởi hành | Tên khách |
| Số khách, tổng tiền, hình thức thanh toán | Số điện thoại |
| Mã QR + số tài khoản dạng chữ *(chỉ khi `transfer`)* | Email, điểm đón, ghi chú |

Vế phải **đúng bằng** danh sách PII mà `BK3` liệt kê.

Mã đơn dò được — `TD-26mmdd-XXXX`, 31⁴ ≈ 923k tổ hợp mỗi ngày, không gian hữu hạn. Người dò
trúng thấy *"có ai đó đặt tour X ngày Y hết Z đồng"*. Chấp nhận được. **Không thêm lớp xác thực
phụ** (kiểu nhập 4 số cuối SĐT): nút CTA một chạm trong tin Zalo không mang được thử thách như
vậy, thêm vào là phá chính cơ chế đang dựng. Bù bằng **một luật WAF giới hạn tần suất trên
`/dat-tour/*`**, cùng khuôn luật đã có cho `/api/dat-tour` — bước runbook, không phải mã.

Mã không tồn tại → **404 thường**, không phân biệt với mã sai định dạng, không thông điệp nào
tiết lộ mã nào có thật. `<meta name="robots" content="noindex">`, không vào `sitemap.xml`.

**Hình dạng site đổi, phải ghi lại.** `wrangler.toml` đang chú thích nguyên văn *"route
on-demand DUY NHẤT"*; `05-URL_MAP` chưa có `/dat-tour/`. Cả hai phải sửa, kèm một ADR ghi nhận
site chuyển từ "tĩnh + một route động" sang "tĩnh + hai route động".

### 4.5 Khối thành công trên form — `BookingForm.astro`

Đây là bề mặt **mọi khách** nhìn thấy: không phụ thuộc email, không phụ thuộc Zalo, không phụ
thuộc thủ tục nào.

`showDone()` hiện chỉ nhận `code` và `duplicate`; nó cần thêm số tiền và hình thức thanh toán —
trình duyệt đã có sẵn cả hai. **Client và server dùng chung đúng một hàm `buildPaymentQr()`**,
đúng khuôn `BK5` đã đặt cho `quote.ts` (*"tạm tính client và kiểm server dùng một hàm"*). Một
hàm, hai nơi gọi; không có nguồn sự thật thứ hai. **Không đổi hợp đồng JSON của API.**

Khối QR hiện: ảnh VietQR, và **ngay cạnh** là số tài khoản, tên chủ tài khoản, số tiền, nội
dung chuyển khoản dạng chữ chọn-copy được (§4.3). Chỉ hiện khi khách chọn *chuyển khoản trước*.

**Bẫy tiền thật, và luật chặn nó.** Khi đơn là **trùng** (`duplicate: true`), `handler.ts` trả
về **mã đơn CŨ** nhưng `summary.total` lại là tổng của lần nộp **MỚI** (`v.quoted.total`). Hôm
nay đó là một dòng hiển thị lệch; in con số đó lên **mã QR** thì thành **khách chuyển sai số
tiền**. Đây đúng là khoản nợ `ADR-0031` đã ghi sẵn.

> **Luật:** đơn trùng thì **KHÔNG dựng QR** trong khối thành công. Thay vào đó hiện liên kết tới
> `/dat-tour/{mã}` — trang đó đọc số tiền **thật đã lưu trong D1**, nên không bao giờ in sai.

**Đường không-JavaScript** (`html.ts`, `renderBookingPage`): thêm khối chữ tương tự, **không**
nhúng ảnh QR. Trang đó cố ý tối giản và đang là bề mặt viết cứng màu mà `ADR-0030` §3 muốn dọn —
thêm ảnh vào là bồi nợ. Khối chữ đủ để chuyển khoản, kèm liên kết sang `/dat-tour/{mã}`.

### 4.6 Tách nội dung khách khỏi nội dung nhân viên — `notify/format.ts`

`format.ts` hiện sinh **nội dung cho nhân viên**: đủ tên, SĐT, email, điểm đón, ghi chú, mùa đã
áp, và `totalGoc` — con số nội bộ để người gọi mặc cả. **Không gửi cái đó cho khách được.**

- `formatText()` → đổi tên `formatStaffText()`, nội dung giữ nguyên.
- Thêm `formatCustomerText()` / `formatCustomerHtml()`: mã đơn, tour, ngày, số khách, tổng tiền,
  hình thức thanh toán, khối thanh toán §4.3. **Không** `totalGoc`, **không** điểm đón, **không**
  ghi chú.

Đây là *"tách nội dung khỏi trình bày"* của `ADR-0030` §3, nhưng ở trục khác: tách theo **người
nhận**.

### 4.7 Kênh báo tin — `notify/index.ts`, `store.ts`, `notify/zns.ts`, migration `0003`

`Notifier.name` là union đóng `'email' | 'zalo'`; `notifyAll` trả `{ email?, zalo? }` khoá theo
tên đó; `updateNotifyStatus` ghi hai cột có tên sẵn. Thêm kênh chạm **cả ba cùng lúc**.

Mở thành bốn tên: `'email'` (nhân viên), `'zalo'` (bot, nhân viên), `'email-khach'`,
`'zns-khach'`. Migration `0003` thêm hai cột `notify_customer_email`, `notify_zns`.

Luật trạng thái giữ y nguyên khuôn đang chạy: thiếu bí mật là `skipped`, hỏng là `failed:…`,
**không bao giờ ném ra ngoài** — đơn đã nằm trong D1 trước khi bất kỳ notifier nào chạy. Giữ
nguyên dòng `console.error` khi không kênh nào báo được. Khách không điền email → `skipped`,
không phải `failed`.

**Token Zalo OA tự xoay và dùng được đúng một lần.** `access_token` sống **1 giờ**;
`refresh_token` sống **3 tháng** nhưng **dùng được đúng một lần** — mỗi lần làm mới sinh cặp
token mới và **vô hiệu cặp cũ**. Với một Worker không trạng thái, đây là vấn đề thật:

- **Không để token trong `wrangler secret`.** Secret bất biến lúc chạy; token phải ghi đè mỗi
  giờ. Thêm nữa, đêm 29/08 đã có một lần build **xoá sạch secrets** — chuỗi token nằm ở đó thì
  đứt câm.
- **Chỗ đúng là D1**: bảng `zalo_token` đúng một hàng (`CHECK (id = 1)`), cột `access_token`,
  `refresh_token`, `expires_at`, `updated_at`. Không mở hạ tầng mới, hợp `BK2` (*"chỉ ghi D1"*).
- **Có tranh chấp thật.** Hai đơn về gần nhau, hai lần chạy cùng đọc một `refresh_token`, cùng
  gọi làm mới. Cái thứ nhất thắng; cái thứ hai **bị Zalo từ chối vì token đã chết**. Nếu lúc đó
  nó ghi đè D1 bằng kết quả hỏng thì **chuỗi đứt vĩnh viễn**.
  > **Luật:** ghi theo kiểu so-rồi-đổi — `UPDATE … WHERE refresh_token = <cái vừa đọc>`.
  > `changes = 0` nghĩa là người khác đã làm mới → **đọc lại và dùng token của họ**, tuyệt đối
  > không ghi đè.

**Ba biến môi trường mới, đặt bằng `wrangler secret put` — `BK4` cấm `[vars]` trong
`wrangler.toml`:** `ZALO_OA_APP_ID`, `ZALO_OA_SECRET_KEY`, `ZNS_TEMPLATE_ID`. Thiếu bất kỳ biến
nào → notifier trả `skipped`, **không** `failed` — cùng luật với SES và bot Zalo đang chạy.

**Cắt `<ten_tour>` xuống 60 ký tự là việc của notifier ZNS**, trong `notify/zns.ts`, không phải
của `store.ts` hay `schema.ts`: D1 vẫn lưu tên tour đầy đủ, chỉ riêng tin ZNS bị hạn mức 400 nên
chỉ nó phải cắt. Cắt theo ký tự rồi thêm `…` nếu bị cắt.

### 4.8 Bản đồ file

| File | Việc |
|---|---|
| `src/site.config.ts` | thêm khối `banking`; sửa dòng nguyên tắc chia trong chú thích đầu file |
| `src/lib/booking/payment-qr.ts` | **mới** — hàm thuần dựng QR |
| `src/lib/booking/zalo-token.ts` | **mới** — đọc/làm mới token, so-rồi-đổi |
| `src/lib/booking/notify/zns.ts` | **mới** — notifier ZNS tới SĐT khách |
| `src/pages/dat-tour/[code].astro` | **mới** — trang tra đơn, `prerender = false` |
| `migrations/0003_kenh_bao_khach.sql` | **mới** — 2 cột `notify_*`, bảng `zalo_token` |
| `src/lib/booking/notify/format.ts` | `formatText` → `formatStaffText`; thêm hàm nội dung khách |
| `src/lib/booking/notify/index.ts` | mở union `Notifier.name` thành 4; sửa kiểu trả của `notifyAll` |
| `src/lib/booking/notify/ses.ts` | thêm notifier thứ hai gửi cho khách |
| `src/lib/booking/store.ts` | `updateNotifyStatus` ghi 4 cột; hàm đọc/ghi `zalo_token` |
| `src/lib/booking/handler.ts` | đăng ký 4 notifier trong `defaultNotifiers`; thêm 3 biến ZNS vào `BookingEnv` (xem dưới) |
| `src/components/BookingForm.astro` | khối QR trong `.bf__done`; `showDone()` nhận thêm tham số |
| `src/lib/booking/html.ts` | khối chữ thanh toán + liên kết `/dat-tour/{mã}` |
| `src/lib/uiCopy.ts` | nhãn khối QR, đủ 5 ngôn ngữ |
| `wrangler.toml` | sửa chú thích "route on-demand DUY NHẤT" |
| `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md` | thêm `/dat-tour/{code}` và 2 cột + bảng mới |
| `docs/core-specs/04-CONSTRAINTS.md` | sửa `BK3` theo §6 |

## 5. Kiểm thử

Bốn nhóm, không nhóm nào cần mạng:

1. **`payment-qr.test.ts`** — URL đúng khuôn; `addInfo` bỏ gạch nối; trả `null` khi `onboard`;
   số tiền bằng `quoted.total`; ký tự đặc biệt trong tên tài khoản bị chặn.
2. **`notify.test.ts` mở rộng** — bốn notifier, bốn trạng thái, `fetchImpl` giả. Ca quan trọng
   nhất: **nội dung cho khách KHÔNG chứa `totalGoc`, điểm đón, ghi chú** — khẳng định trực tiếp
   trên chuỗi sinh ra, không tin vào việc đọc mã.
3. **`zalo-token.test.ts`** — ca so-rồi-đổi: hai lần chạy song song, cái thua **đọc lại** chứ
   không ghi đè; token hỏng không bao giờ được ghi vào D1.
4. **`dat-tour-page.test.ts`** — mã không tồn tại → 404; **và một ca khẳng định HTML sinh ra
   không chứa tên, SĐT, email, điểm đón, ghi chú của đơn**. Đây là cách duy nhất canh được luật
   §4.4 bằng máy thay vì bằng lời hứa.

Thêm một ca cho §4.5: đơn `duplicate: true` thì khối thành công **không** chứa `img.vietqr.io`.

## 6. Sửa `BK3` — đây là **nới** ràng buộc, chủ dự án đã duyệt

`BK3` hiện ghi *"PII chỉ ở D1 và **hai tin báo**"*. Sau đợt này có bốn tin báo, và quan trọng
hơn: **số điện thoại khách đi sang VNG** làm địa chỉ nhận ZNS, **email khách đi sang AWS SES**
làm người nhận thật thay vì chỉ nằm trong thân thư. Hai chỗ mới mà PII chảy tới.

Theo `04-CONSTRAINTS` §5 đây là **nới** → cần chủ dự án phê chuẩn kèm lý do ghi vào
`DECISIONS.md`. **Đã duyệt trong phiên 2026-08-31.** Bản sửa: `BK3` liệt kê đích danh bốn kênh
và hai bên thứ ba (AWS SES, VNG/Zalo); giữ nguyên mức **fail**; giữ nguyên mọi điều cấm còn lại
— cấm log PII, cấm vào Sanity, cấm vào `prices.yaml`, cấm vào repo.

## 7. Cổng phải xanh trước khi gộp

- `npm run gate` (`astro check` + `gate:all`) — baseline hiện tại là 4 đỏ đã biết, không được
  thêm cái thứ 5.
- Validator hình dạng `banking`, **mức fail**: `bin` đúng 6 chữ số, `accountNumber` 1–19 ký tự
  chữ/số, `accountName` không rỗng và không dấu. Thiếu hoặc sai thì **build đỏ**. Đây là chỗ
  tiền của khách đi qua — hỏng phải hỏng ồn ào, cùng khuôn cổng Turnstile trong `handler.ts`.
- **`dist/_routes.json` sau build phải có `/dat-tour/*` trong `include`.** Hiện `include` chỉ có
  `/_server-islands/*`, `/_image`, `/api/*` — mọi đường khác là asset tĩnh. Adapter Astro được
  **kỳ vọng** tự thêm khi thấy trang `prerender = false`, nhưng đó là kỳ vọng, không phải bằng
  chứng. **Không có dòng này thì trang trả 404 và toàn bộ mục tiêu (1) chết câm.** Giới hạn 100
  luật của Cloudflare còn xa: hiện 34.
- Cổng PII trên HTML trang, gộp trong nhóm test 4 ở §5.

## 8. Vận hành

**Bốn kiểu hỏng, bốn cách chịu.** Đơn đã nằm trong D1 trước khi bất kỳ kênh nào chạy, nên không
kiểu hỏng nào làm mất đơn.

| Hỏng ở đâu | Khách thấy gì | Hệ ghi lại gì |
|---|---|---|
| `img.vietqr.io` chết hoặc bị chặn | Khối chữ cạnh ảnh vẫn đủ để chuyển tay (§4.3) | không gì |
| ZNS hỏng / token đứt / SĐT không có Zalo | Không có tin Zalo; vẫn có khối thành công và thư nếu có email | `notify_zns = failed:…` / `skipped` |
| Khách không điền email | Không có thư | `notify_customer_email = skipped` |
| **Cả bốn kênh im** | Vẫn thấy "sẽ gọi lại xác nhận" | `console.error` — dòng đã có sẵn trong `handler.ts` |

Hàng cuối nguy hiểm nhất và **đã xảy ra thật đêm 29/08**. Đó là lý do bảng điều khiển
`ADR-0030` §2 cần lên sớm.

**Thứ tự thi công.** Đường găng là **nộp mẫu ZNS trước tiên** (§4.1) — 2 ngày chờ duyệt chạy
song song với mọi việc khác. Rồi: cấu hình + hàm QR (§4.2, §4.3) → trang (§4.4) → khối thành
công (§4.5) → kênh báo tin (§4.6, §4.7). Trang phải xong trước khi ZNS bật, vì nút CTA trỏ vào
nó.

**Nghiệm thu tay — bốn bước, theo thứ tự:**

1. Đặt một đơn thật chọn *chuyển khoản trước* → quét QR bằng app ngân hàng → **số tiền và nội
   dung hiện đúng trên màn hình app**, chưa chuyển tiền.
2. Mở `/dat-tour/{mã}` trên điện thoại → đối chiếu bảng §4.4, không trường nào ở cột phải xuất
   hiện.
3. Kiểm tin Zalo tới máy thật, bấm nút CTA, xem có mở đúng trang không.
4. `wrangler d1 execute` đọc bốn cột `notify_*` của đơn đó.

## 9. Còn nợ

- **Chuỗi token sống nhờ lưu lượng.** Site **3 tháng liền không có đơn nào** thì `refresh_token`
  hết hạn và ZNS chết — im lặng. Cách chặn triệt để là Cron Trigger làm mới hằng ngày, nhưng
  adapter Astro tự xuất `default` cho Worker nên gắn `scheduled` phải bọc thêm một lớp quanh
  `dist/_worker.js/index.js` — mong manh. **Chủ dự án chốt chấp nhận rủi ro** trong đợt này;
  bước cấp lại token ghi vào runbook, và bảng điều khiển `ADR-0030` §2 phải lộ cột `notify_zns`.
- **Nợ màu chưa trả.** `html.ts` và `notify/format.ts` vẫn viết cứng `#0C4A6E` và `#96271A` —
  chính là `--c-primary` và `--c-accent-strong` trong `tokens.css`, đúng như `ADR-0030` §3 chẩn
  đoán. Đợt này **không nhân lên** (trang mới dùng token thật) nhưng cũng **không trả**.
- **Đối soát vẫn là việc tay.** Site không biết tiền đã về. Nợ mở của `ADR-0031` — hệ không đo
  được chuyện khách chọn chuyển khoản rồi không chuyển — còn nguyên, và mã QR không thu hẹp nó.
- **`summary.total` của đơn trùng vẫn lệch** trong hợp đồng JSON (§4.5). Đợt này chỉ *tránh*
  bằng cách không dựng QR cho đơn trùng, **không sửa** gốc. Sửa gốc là đổi `handler.ts` để đọc
  lại đơn cũ từ D1 — phạm vi khác, cần quyết định riêng.
