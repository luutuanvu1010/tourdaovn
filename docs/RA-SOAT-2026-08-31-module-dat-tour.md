# Rà soát toàn module đặt tour — 2026-08-31

- **Phạm vi:** `src/lib/booking/**`, `src/pages/api/dat-tour.ts`, `src/components/BookingForm.astro`,
  `migrations/`, `data/prices.yaml`, `src/lib/queries/seasons.ts` + tài liệu chi phối.
- **Nhánh:** `main` tại `4f5c7fe`, cây sạch. **Chỉ đọc — không sửa file sản phẩm nào.**
- **Cách làm:** 4 kiểm toán viên song song (giá / máy chủ / bề mặt / tài liệu) + kiểm trên
  trình duyệt thật + đối chiếu cấu hình production.
- **Đầu vào đã đọc:** `SPEC-2026-08-21-dat-tour`, `SPEC-2026-08-30-uu-dai-thanh-toan-truoc`,
  `ADR-0027/0030/0031`, `04-CONSTRAINTS` §1d, `06-BINDING_MAP` §4.8, `KIEN-TRUC-TEMPLATE`,
  `DECISIONS`, `DRIFT_LOG`, `HANDOFF-2026-08-29`.

## 0. Cổng máy — trạng thái

| Cổng | Kết quả |
|---|---|
| `npx vitest run` | **151/151 xanh** |
| `npx astro check` | **0 errors, 0 warnings** (45 hints) |
| `wrangler d1 migrations list --remote` | **✅ No migrations to apply** — cả `0001` và `0002` đã áp production |
| `wrangler secret list` | **đúng 8 tên**, không có `BOOKING_ALLOW_NO_TURNSTILE` (đạt SPEC §7 mục 7) |
| BK1–BK5 (grep tay) | **cả 5 ĐẠT** |
| Trình duyệt thật 360/390/640px | **0 tràn ngang**, 0 lỗi console, 28/28 tour có giá render form hợp lệ |

## 1. Phát hiện xếp theo mức

> **Hai trục, đừng lẫn.** Mức dưới đây xếp theo *hậu quả nếu chạm*. Còn theo trục *đã chạm hay
> chưa*: **#3 và #4 nằm trên đường vận hành bình thường** — không cần ai gõ sai gì; **#1 và #2
> hôm nay chưa chạm** — cần một lỗi nhập liệu (ô số trong Studio) hoặc một giá không bội 1000
> từ Google Sheet mới kích hoạt.

### CHẶN — 1 mục

**#1 — `percent` mùa không kẹp biên lúc chạy, và `npm run deploy` không chạy validator nào.**

- `src/lib/queries/seasons.ts:34` chỉ lọc `typeof r.percent === 'number'`. Ngay dòng dưới
  (`:37-38`) `prepayPercent` **đã** được kẹp `0 < p ≤ 50` — hai trường cùng loại, hai mức phòng thủ.
- Biên `-90…200` chỉ tồn tại ở `scripts/validators/mua-vu.ts:21`, đăng ký trong
  `scripts/validate-constraints.ts:11` → chỉ chạy qua `npm --prefix scripts run validate`
  (`build:strict`, `gate`). `package.json` `deploy` = `build` = `astro check && astro build`.
  Không có CI (`ls .github` → không tồn tại).
- Hệ quả đo được: `percent: -100` → `perPax = 0`, `total = 0`, **đơn được nhận 201** (bán tour 0₫);
  `percent: -101` → `total = -8000` → **400 câm cho mọi khách**. Gõ `-90` thay `-9` là bán
  800.000 thành 80.000, mọi cổng vẫn xanh.
- Đường vào là ô số trong Sanity Studio — biên tập gõ tay.

> Hôm nay dữ liệu đang đúng (một mùa "Quốc Khánh" +15%). Đây là **thiếu lan can**, không phải
> site đang hỏng.

### NẶNG — 4 mục

**#2 — `apDieuChinh` bất đối xứng → 400 oan không có lối thoát.** `quote.ts:48` trả sớm
(`if (!seasonPct && !prepayPct) return amount`) nên `khongUuDai()` **không làm tròn**, còn
`nhan()` làm tròn LÊN. Khi **không mùa** + **có ưu đãi** + giá không bội 1000 →
`totalGoc < total` → `schema.ts:240` trả 400.

Kiểm chứng (chạy thật, đi hết đường client → JSON → `validateBooking`):

```
gốc=90.950 + ưu đãi 1% → total=91.000  totalGoc=90.950 → 400 "Tạm tính không khớp…"
gốc=12.345 + ưu đãi 1% → total=13.000  totalGoc=12.345 → 400
```

Khách bị bảo "hãy tải lại trang và thử lại" — tải lại vẫn hỏng, vòng lặp không thoát.
Chưa chạm hôm nay vì **29/29 dòng giá đều bội 1000**, nhưng `data/prices.yaml:1` tự ghi là
file **sinh ra từ Google Sheet** và PY7 không đòi bội 1000.

**#3 — Đơn đã huỷ vẫn chặn đơn mới.** `store.ts:44` không lọc `status`. Chuỗi thật: khách huỷ →
nhân viên đặt `status='cancelled'` bằng tay (SPEC §4.5) → khách đặt lại đúng tour+ngày trong 24h
→ nhận **200 kèm mã đơn đã huỷ**, không `INSERT`, không báo tin. Nhân viên không bao giờ biết.
SPEC §4.4 hàng "trùng" không nói gì về `status` → khe hở của SPEC, cần chủ dự án phán.

**#4 — Turnstile hỏng mạng → 400 dẫn khách vào ngõ cụt, và hỏng CÂM.** `turnstile.ts:32-34` bắt
CẢ lỗi mạng LẪN lỗi `res.json()` (siteverify trả 5xx) rồi trả `ok:false` → `handler.ts:188` trả
400 `MSG.turnstileFailed` = *"Xác minh không thành công, vui lòng thử lại."* Đây là **thông điệp
lỗi duy nhất không nhắc kênh dự phòng** (so `MSG.serverError`: *"…hoặc nhắn Zalo"*). Cloudflare
siteverify hỏng từng phần = **mọi** đơn trên site bị 400, khách được bảo thử lại vô hạn.

Nặng hơn: nhánh này **không ghi `console.error` nào**, nên `wrangler tail` và bảng điều khiển
không thấy gì. Cổng cấu hình 503 đã được xử lý đúng cách đó (`handler.ts:163`), nhánh này thì
chưa — đúng thứ mà `DR-099` đặt ra để tránh: *hỏng ồn ào, không hỏng câm*.

**#5 — Chuỗi tiếng Việt cứng trong component.** `BookingForm.astro:62`
`const dateRangeTpl = 'Chọn ngày từ {min} đến {max}'`; `grep dateRange src/lib/uiCopy.ts` → rỗng.
Chuỗi này tới thẳng khách (`:115`) và qua `data-date-range` vào script (`:291-293`). Đúng lớp lỗi
mà `a265115` đã sửa một lần; mang vào lại ở `2eb3dad` (2026-08-30).

### NHẸ / GHI NHẬN — chọn lọc

| Mục | file:line |
|---|---|
| `letter-spacing: 0.04em` viết cứng, lệch token `--ls-eyebrow: 0.08em` đang có (P6/N7) | `BookingForm.astro:573` vs `tokens.css:126` |
| `gap: 2px` viết cứng, thang token bắt đầu ở `--s1: 4px` | `BookingForm.astro:594` |
| `MSG.dateTooFar` viết cứng chữ "90 ngày", tách rời `LIMITS.MAX_DAYS_AHEAD` | `schema.ts:23` vs `:12` |
| `quoted.season.percent` không chặn biên (trong khi `prepay.percent` chặn `0<p≤50`) | `schema.ts:148` vs `:159` |
| `prepay.percent`/`totalGoc` không ép `Number.isInteger` như spec đòi | `schema.ts:159` |
| Zalo nuốt lý do lỗi thật (`void failed(e)`) — lần hỏng đầu sẽ mù hoàn toàn | `zalo.ts:29-35` |
| `updateNotifyStatus` là 2 câu UPDATE rời, không `batch()` | `store.ts:56-63` |
| `isUniqueViolation` bắt MỌI vi phạm UNIQUE, không riêng `booking.code` | `store.ts:24-27` |
| Cửa sổ ngày tính một lần lúc init; tab mở qua nửa đêm giờ VN giữ `min` cũ | `BookingForm.astro:286-288` |
| Lúc gửi, `pax` đọc tươi còn `quoted` dùng cache — BK5 đúng nhờ mọi đường đều nhớ gọi `update()` | `BookingForm.astro:515-516` |

### Lỗ hổng cổng và nợ

- **BK1–BK5 không có cổng máy nào.** `grep BK docs/governance/control-registry.yaml` → 0 kết quả.
  Năm luật mức `fail` chỉ được canh bằng review/grep tay. `04-CONSTRAINTS` §1d tự khai điều này.
- **`07-DESIGN_TOKENS` tuyên bố có fitness function chặn giá trị cứng — thực tế không có.**
  `scripts/check-token-parity.mjs` chỉ đối chiếu `07` ↔ `tokens.css`, không đọc component, và tự
  khai *"KHÔNG nằm trong `gate:all`"*.
- **Thiếu ca test then chốt:** không có ca đi **hết đường** `computeQuote(mùa + ưu đãi)` →
  `buildQuotedPayload` → JSON → `validateBooking`. Sáu ca luật chéo `schema.test.ts:287-325`
  đều **tự dựng sẵn** `quoted` — đúng thứ chính file đó cảnh báo ở `:188`. Đây là lý do #2 lọt.
- **Nợ chưa trả:** nhãn `zh`/`ko`/`ru` của ~25 khoá `booking*` cũ vẫn nguyên tiếng Anh
  (`uiCopy.ts` khối `:383`, `:563`, `:743`); Zalo Bot gửi nhóm / giới hạn tần suất chưa xác minh,
  chưa ghi DR nào.

### Drift tài liệu (ghi lại, không tự chọn bên — `CLAUDE.md` §8)

| # | Nội dung | Đề nghị số |
|---|---|---|
| a | SPEC §4.4 dòng 242-244 còn ghi muối `ip_hash` là `TURNSTILE_SECRET_KEY`, trái §4.7 và trái mã (`handler.ts:194`). Bản sửa F4 ghi *"Sửa ở §3, §4.6, §4.7, §5, §6"* — §4.4 vắng mặt | `DR-105` |
| b | `04-CONSTRAINTS:129` và `02-SAD:58` còn gọi tên **Resend**; `notify/resend.ts` đã xoá từ `QĐ-2026-08-22-07` | `DR-106` |
| c | `06-BINDING_MAP` §4.8 chưa ghi danh 3 vùng: dòng mùa (`:172`), dòng ưu đãi (`:173`), nhóm hai nút thanh toán (`:150-160`). Nguồn có thật — là thiếu ghi danh, không phải vẽ vùng không nguồn | `DR-107` |
| d | Cụm SPEC gốc lỗi thời: §4.4 (payload thiếu `season`/`prepay`/`paymentMethod`), §4.5 (bảng thiếu `payment_method`), §4.12 (còn `notify/resend.ts`; thiếu `season.ts`, `vn-date.ts`, `html.ts`, `turnstile.ts`, `format.ts`, `0002_*.sql`), §5 (còn ca "+366 → lỗi") | `DR-108` |
| e | `BUILD-NOTES:76-80` "Thứ tự bắt buộc" chưa rà lại sau khi `DR-101` khép | `DR-109` |
| f | `DR-104` dòng trạng thái ghi *"đang sửa"* nhưng thân phiếu ghi ĐÃ LÀM, và sửa có thật trong cây (`Sidebar.astro:28`, `TourDetail.astro:133`, commit `83425df`) | sửa dòng trạng thái |
| g | `HANDOFF-2026-08-29` mâu thuẫn SPEC §4b về cùng sự kiện. **Đã xác định bằng git:** HANDOFF viết 15:21 (`ba781d9`), SPEC §4b viết **20:02** (`a0b43d4`) — sau 4h41. Trạng thái THẬT là SPEC §4b, và cấu hình production hôm nay xác nhận (8 secrets, 2 migration đã áp). HANDOFF tự tuyên *"Đọc file này TRƯỚC"* → bẫy cho phiên sau | rút hoặc gắn nhãn cũ |

> **Số `DR-*` đã va bốn lần** ở luồng này (`HANDOFF` bẫy #7). Grep cả `main` lẫn nhánh đang sống
> trước khi cấp. Lớn nhất hiện tại: `DR-104`.

## 2. Đã kiểm trên trình duyệt thật — không thấy vấn đề

Dựng `dist/` (fresh 06:45) rồi đo trong khung 360 / 390 / 640px:

- **0 tràn ngang** ở cả ba bề rộng (`scrollWidth === clientWidth`, 0 phần tử vượt biên).
- **Nút +/− đúng 44×44px** (bản vá `f466a4c` còn nguyên); nút chính 294×50; nhãn hai nút thanh
  toán 294×44.
- **Chuỗi mùa + ưu đãi khớp hết đường.** Ngày 01/09 (trong mùa +15%), 1 NL + 1 TE, chọn chuyển
  khoản: form hiện 809.000 / 470.000, "Tạm tính 1.279.000₫"; payload gửi lên có đủ
  `season {Quốc Khánh, 15}` và `prepay {5, totalGoc: 1.346.000}`; `validateBooking` **ĐẠT**.
  Khớp đúng ví dụ chứng minh của ADR-0031 (430.000 +15% −5% → 470.000).
- **Cửa sổ 90 ngày chính xác:** form ghi "Chọn ngày từ 01/09/2026 đến 29/11/2026";
  +90 ngày ĐẠT, +91 ngày TRƯỢT.
- **Hai nút thanh toán:** `role="radiogroup"` + `aria-labelledby`, không nút nào `checked` (đúng
  spec §2.5); chưa chọn mà gửi → **chặn tại client**, hiện *"Chọn hình thức thanh toán."* và đưa
  tiêu điểm vào nhóm.
- **Tiêu điểm:** mở bước 2 → ô Họ và tên; "Quay lại" → về nút "Đặt tour ngay".
- **Em bé 0₫ hiện "Miễn phí"** đúng SPEC §4.2 luật 3.
- **Honeypot** `.bf__hp` có `aria-hidden="true"` + `tabindex="-1"` + off-screen — đủ lớp.
- **28/28 tour có giá** render form với `data-price-table` hợp lệ; 0 lỗi console.

**Lỗi thị giác §4b đã đóng.** Ghi chú cuối SPEC §4b (*dòng breakdown đọc liền thành
"Người lớn × 21.080.000₫"*) là **hiện tượng của `textContent`, không phải của mắt**: hai `<span>`
nằm trong `.bf__line { display:flex; justify-content:space-between }` (`:global()` từ `f8733da`,
xác nhận trong CSS dựng thật). Đo được: span trái 49→141px, span phải 232→311px — cách nhau 91px
ở bề rộng 360. Phần còn treo chỉ là **ký tự ngăn cách** `—` mà SPEC §4.3 viết trong khuôn mẫu.

## 3. Chưa kết luận được ở đây

- Ô `<input type="date">` trên **iOS Safari thật** — bản vá `cae3194` còn nguyên trong nguồn và
  trong CSS dựng, nhưng chính commit đó viết hoa *"Blink KHÔNG áp sàn này"*. Cần iPhone thật.
- **Lighthouse a11y** sau khi thêm `radiogroup` (`1b29401`) — đợt 2026-08-29 đạt 99, nhưng đo
  **trước** hai nút thanh toán.
- Nút radio ở 360px có bị bóp khi nhãn xuống 2 dòng không (`.bf__pay-opt` thiếu `flex: none`
  trên `input`) — suy từ CSS, chưa đo trên Safari iOS.

## 4. Đề xuất phương án

### Nhóm A — sửa mã, không cần quyết định mới (một task, phạm vi hẹp)

1. Kẹp `percent` mùa ngay trong `fetchPriceRules` (`seasons.ts`), **cùng chỗ và cùng kiểu** đã
   kẹp `prepayPercent`: bỏ hoặc kẹp mùa ngoài `-90…200`. Không dựa vào cổng thủ công. *(#1)*
2. Sửa bất đối xứng `apDieuChinh`: khi `uuDai > 0` thì `khongUuDai` phải làm tròn cùng thang, để
   `totalGoc` không bao giờ thấp hơn `total`. *(#2)*
3. Đưa `dateRangeTpl` vào `uiCopy.ts` (5 ngôn ngữ, khoá `bookingDateRange`). *(#5)*
4. `MSG.dateTooFar` nội suy từ `LIMITS.MAX_DAYS_AHEAD` thay vì viết cứng "90 ngày".
5. Ba ca test mới: (a) round-trip **mùa + ưu đãi** đi hết đường tới `validateBooking`;
   (b) bất biến `totalGoc ≥ total` quét toàn bộ `prices.yaml` × dải mùa × dải ưu đãi;
   (c) `percent` mùa ngoài biên không lọt tới `computeQuote`.

### Nhóm B — cần chủ dự án quyết trước khi sửa

6. **#3 đơn đã huỷ chặn đơn mới** — thêm `AND status <> 'cancelled'` vào truy vấn trùng? Việc này
   nên gộp với câu **đang treo** ở `HANDOFF` mục 1 (nhánh trùng trả mã cũ kèm tóm tắt yêu cầu
   MỚI): cả hai cùng một chỗ mã, quyết một lần thì sửa một lần. `getBookingByCode` đã có sẵn
   trong `store.ts:65`, chưa nơi nào dùng.
7. **#4 Turnstile hỏng hạ tầng** — tách khỏi lỗi xác minh: trả 503 `MSG.serverError` (có nhắc
   Zalo), hay chỉ đổi câu chữ `turnstileFailed` để luôn có kênh dự phòng?
8. **Token `letter-spacing`** — quy `.bf__eyebrow` về `--ls-eyebrow` sẽ **đổi hiển thị**
   (0.04 → 0.08em). Cần chủ dự án duyệt thẩm mỹ, không sửa máy móc.

### Nhóm C — dọn nợ cổng và tài liệu (làm sau, không chặn khách)

9. Cấp `DR-105`…`DR-109` theo bảng drift; sửa dòng trạng thái `DR-104`; rút hoặc gắn nhãn cũ cho
   `HANDOFF-2026-08-29`.
10. Thêm dòng `BK1`–`BK5` vào `control-registry.yaml` kèm executor (grep là đủ cho BK1/BK4) —
    đóng lỗ hổng "năm luật `fail` không cổng nào canh".
11. Mở một token đích chạm (44px) rồi quy `BookingForm`, `Header`, `Footer`, `FAQ` về một mối —
    đây là backlog đã ghi ở sổ tiến độ, không phải vi phạm mới.

**Thứ tự đề nghị: B (hai câu hỏi) → A → C.** Nghịch với thứ tự đánh số, và có lý do: **hai lỗi
đang nằm trên đường vận hành bình thường (#3, #4) đều rơi vào nhóm B** — chúng cần chủ dự án
quyết trước vì SPEC im lặng về `status` và về cách phân biệt lỗi hạ tầng với lỗi xác minh. Trả
lời hai câu #6 và #7 là việc **đầu tiên**, không phải cuối cùng. Nhóm A sửa được ngay sau đó
(hoặc song song — khác file); nhóm C không chặn khách.
