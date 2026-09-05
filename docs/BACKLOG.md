# BACKLOG — ý tưởng và nợ kỹ thuật

> Sổ gom việc **chưa** có spec và **chưa** ai cam kết làm. Khác ba sổ đã có:
> `DECISIONS.md` ghi việc đã quyết, `DRIFT_LOG.md` ghi chỗ hai tài liệu lệch nhau,
> `docs/specs/` ghi việc đã đặc tả xong. Vào đây là thứ biết rồi nhưng chưa tới lượt.
>
> **Luật:** mỗi mục phải có **bằng chứng** (file:dòng, hoặc lệnh và kết quả). Không ghi cảm giác.
> Mục nào lên spec thì xoá khỏi đây và trỏ sang spec.

Mã: `B-<số>`. Trạng thái: `mở` · `đang làm` · `đã đóng`.

---

## Nợ kỹ thuật

### B-001 — `html.ts` viết cứng sáu mã màu và một cỡ chữ · `mở`

`src/lib/booking/html.ts:7` `#0C4A6E`/`#96271A`, `:9` `#F8FAFC`/`#0F172A`, `:10` `#fff`/`#E2E8F0`,
`:11` `font-size:22px`. Vi phạm luật `ADR-0030` §4 (`:170`): cấm mã màu **và cỡ chữ** viết cứng.

Nặng hơn trùng lặp: hai mã ở `:7` chỉ bằng `--c-primary`/`--c-accent-strong` **với bộ token mặc
định**. `src/styles/tokens.css` có hai bộ đè (`:204`/`:209`, `:223`/`:228`) — nên trang này
**sai màu** khi site đổi bộ token, không chỉ lặp.

### B-002 — `notify/format.ts` viết cứng cỡ chữ và font · `mở`

`src/lib/booking/notify/format.ts:75` `font-size:15px`, `font-family:system-ui,sans-serif`.
**Không có mã màu nào** — nợ ở đây khác loại với `B-001`. Cùng luật `ADR-0030` §4.

`B-001` và `B-002` là thứ `ADR-0030` §4 gọi là *"lớp 2 — bề mặt"*, và ADR đó xếp nó **trước** mã
QR trong thứ tự thi công. Đợt QR (`SPEC-2026-08-31`) đã vượt hàng và ghi nhận là không trả nợ.

### B-003 — `summary.total` của đơn trùng là tổng lần nộp MỚI, kèm mã đơn CŨ · `mở`

`src/lib/booking/handler.ts:211–213`: nhánh `if (dup)` trả `code: dup` (mã cũ) nhưng
`summary: { …, total: v.quoted.total }` (payload vừa nộp). Đường không-JS lộ trực tiếp hơn:
`lines: summaryLines(v, dup)` in `Tạm tính: <tổng mới>` ngay dưới mã cũ.

`ADR-0031:191–202` đã ghi sẵn khoản nợ này. `SPEC-2026-08-31` §4.5 chỉ **tránh** (đơn trùng không
dựng QR, không in dòng tiền), **không sửa gốc**. Sửa gốc = `handler.ts` đọc lại đơn cũ từ D1.

### B-004 — `BK1`–`BK5` không có validator máy nào · `mở`

`grep -rn "BK1\|BK2\|BK3\|BK4\|BK5" scripts/` → **0 kết quả**.
`docs/governance/control-registry.yaml` **không có dòng `BK` nào** (chỉ `I1–I21`, `PY1–PY8`,
`R1–R4`). `04-CONSTRAINTS.md:98` tự thừa nhận: *"Chưa có dòng trong control-registry.yaml vì
chưa có executor script"*.

Nghĩa là năm ràng buộc **mức fail** của module đặt tour hiện được canh bằng *"`grep` trong QA2
cộng review"* (`04-CONSTRAINTS.md:92`) — tức bằng người, mỗi lần một khác.

### B-005 — `05-URL_MAP` §2 khẳng định hệ không có DB nào ngoài Sanity và `prices.yaml` · `mở`

`docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md:130` nguyên văn: *"Không có DB nào khác: hai nguồn
duy nhất của hệ là Sanity dataset và `prices.yaml` (P6, S2.7)."* Sai từ `ADR-0027` — D1
`tourdao-booking` có thật, đang chạy production. File đó không có mục nào về bảng `booking`.

Sửa đúng cách là **đảo một phát biểu P6/S2.7**, phạm vi lớn hơn một dòng. Cần ghi `DR-` trong
`DRIFT_LOG.md` trước, rồi quyết ở tầng ADR.

### B-006 — Chuỗi token Zalo OA đứt nếu 3 tháng không có đơn nào · `mở`

`refresh_token` sống 3 tháng và **dùng được đúng một lần**; `SPEC-2026-08-31` §4.7 làm mới
**lười** (chỉ khi có đơn). Không có đơn suốt 3 tháng thì ZNS chết **im lặng**.

Cách chặn: Cron Trigger làm mới hằng ngày. Vướng: adapter Astro tự xuất `default` cho Worker nên
gắn `scheduled` phải bọc một lớp quanh `dist/_worker.js/index.js`. Chủ dự án **chốt chấp nhận
rủi ro** trong đợt này (`SPEC-2026-08-31` §9).

---

## Việc đã có quyết định, chưa tới lượt

### B-007 — Bảng điều khiển đơn đặt trong Sanity Studio · `mở`

`ADR-0030` §2, đã phê chuẩn 2026-08-30, chưa thi công. Hiện xem đơn phải gõ
`wrangler d1 execute`. Truy vấn *"đơn chưa báo được"* có trong `SPEC-2026-08-21-dat-tour` §4.6
nhưng **chưa ai từng chạy** — không cơ chế nào phát hiện đơn không tới tay ai.

Cấp thiết hơn sau đợt QR: `SPEC-2026-08-31` thêm hai cột `notify_customer_email`, `notify_zns`,
và cả `B-006` lẫn `B-003` đều lấy bảng này làm nơi quan sát.

### B-008 — Sinh token cho thư từ một nguồn `tokens.css` · `mở`

`ADR-0030` §4. Là điều kiện `B-001` và `B-002` cần để trả nợ mà không tạo nguồn thứ hai.

---

### B-022 — Tự động đối soát chuyển khoản: ADR đã duyệt, spec đã xong, **hoãn thi công** · `mở`

Chủ dự án **ghi nợ toàn bộ kế hoạch ngày 2026-08-31**, ngay sau khi duyệt. Không mở việc cho Code.

> Đây là **ngoại lệ có chủ ý** với luật của sổ này (*"mục nào lên spec thì xoá khỏi đây và trỏ
> sang spec"*). Giữ lại đúng vì nó **đã có spec mà vẫn không ai làm** — loại việc dễ rơi mất
> nhất, vì nhìn từ `docs/specs/` thì tưởng đang chạy.

**Đã có, không phải làm lại:** `docs/adr/ADR-0032-tu-khang-dinh-tien-ve.md` (ĐÃ PHÊ CHUẨN,
`QĐ-2026-08-31-02`) · `docs/specs/SPEC-2026-08-31-tu-dong-doi-soat-chuyen-khoan.md` (sáu câu
chốt, ba mục thiết kế đã duyệt, QA1 §11 chỉ còn một mục chưa tick).

**Phạm vi đã đặc tả, mở được ngay khi có người:** migration `0004_bank_txn.sql` (sổ cái chỉ-thêm,
khoá `(provider, provider_txn_id)`) · luật khớp theo mã đơn trong nội dung chuyển khoản ·
endpoint `/api/bank-webhook/<nhà cung cấp>` · trang tra đơn `/dat-tour/<mã>/` · báo tin nhân
viên và khách. Năm phần này **không phụ thuộc ngân hàng lẫn nhà cung cấp** (`ADR-0032` quyết
định 2 và 2b) — đó là lý do chúng làm được trước, và cũng là lý do hoãn không làm hỏng gì.

**Chặn thật, không phải thiếu người:** chưa ai xác nhận nhà cung cấp nào đọc được tài khoản
**doanh nghiệp** Techcombank. Bằng chứng tra 31/08: `developer.sepay.vn/vi/sepay-webhooks/tai-khoan-ngan-hang`
liệt kê **10 ngân hàng** (ACB, BIDV, MBBank, MSB, KienlongBank, OCB, Sacombank, TPBank,
VietinBank, VPBank) và kết bằng *"Ngân hàng không có trong bảng thì chưa hỗ trợ webhook"* —
**không có Techcombank**; payOS cho tài khoản doanh nghiệp là MB/KienlongBank/OCB/BIDV/Shinhan,
cũng không có. Năm câu phải hỏi nhà cung cấp: spec §10.

**Mở lại khi** (a) có câu trả lời của Casso/Pay2S/Techcombank, **hoặc** (b) công ty thêm/đổi
sang một ngân hàng trong danh sách được hỗ trợ — spec đã mở sẵn đường đó bằng
`banking.alsoAccept` (§4.2b), nên đổi ngân hàng **không** làm hỏng đơn đã phát QR cũ.

**Đừng làm mất:** `payment-qr.ts` đã đặt nội dung chuyển khoản là mã đơn bỏ gạch nối
(`TD260831K7QM`) và đang chạy thật. Cái móc để nối tiền về với đơn **đã nằm trong sản phẩm**;
ai mở lại việc này thì không phải dựng nó.

## Cần xác nhận, không phải làm

### B-009 — Nghiệm thu tay ưu đãi thanh toán trước · `mở`

`SPEC-2026-08-30-uu-dai-thanh-toan-truoc` §7 đòi nghiệm thu tay; **không tìm thấy dấu vết ai đã
làm**. Tính năng đã BẬT thật trên production (đo 2026-08-31: HTML trang tour có
`Chuyển khoản trước — giảm 5%`). Không có test tự động nào chạm tầng giao diện của nó.

### B-010 — Khoá gọi ZNS: `templateId` hay `template_id` · `mở`

Hai kiểu cùng lưu hành trong tài liệu Zalo (ZBS Template Message API dùng camelCase; ZNS v2 cũ
dùng snake_case). Kiểm bằng **một lời gọi thật** lúc đăng ký mẫu, mất 5 phút. Ghi ở
`SPEC-2026-08-31` §4.7 như chỗ duy nhất chấp nhận xác nhận muộn.

---

## Từ đợt rà soát toàn module đặt tour 2026-08-31

> Nguồn: `docs/RA-SOAT-2026-08-31-module-dat-tour.md` (commit `4f720de`). Bốn kiểm toán viên
> song song + kiểm trên trình duyệt thật + đối chiếu cấu hình production. Mọi cổng máy đều xanh
> lúc rà soát: vitest 151/151, `astro check` 0 errors, đúng 8 secret, hai migration đã áp D1 thật,
> `BK1`–`BK5` đều đạt.
>
> **Rà soát này chưa xong và sẽ còn tiếp** — xem `B-019` cho phần chưa kết luận được, và mục
> "Vòng sau" ở cuối.

### B-011 — `percent` mùa không kẹp biên lúc chạy, và `npm run deploy` không chạy validator nào · `mở`

`src/lib/queries/seasons.ts:34` chỉ lọc `typeof r.percent === 'number'`. Ngay dòng dưới (`:37-38`)
`prepayPercent` **đã** được kẹp `0 < p ≤ 50` — hai trường cùng loại, hai mức phòng thủ.

Biên `-90…200` chỉ tồn tại ở `scripts/validators/mua-vu.ts:21`, đăng ký ở
`scripts/validate-constraints.ts:11` → chỉ chạy qua `npm --prefix scripts run validate`
(`build:strict`, `gate`). `package.json` `deploy` = `build` = `astro check && astro build`.
`ls .github` → không tồn tại, không có CI.

Đo được: `percent: -100` → `perPax = 0`, `total = 0`, **đơn vẫn được nhận 201** (bán tour 0₫);
`-101` → `total = -8000` → **400 câm cho mọi khách**. `-90` gõ nhầm thay `-9` là bán 800.000
thành 80.000, mọi cổng vẫn xanh. Đường vào là ô số trong Studio — biên tập gõ tay.

Chữa đúng chỗ: kẹp ngay trong `fetchPriceRules`, cùng kiểu đã kẹp `prepayPercent`. Không dựa
vào cổng thủ công.

### B-012 — `apDieuChinh` bất đối xứng → 400 không có lối thoát · `mở`

`src/lib/booking/quote.ts:48` trả sớm (`if (!seasonPct && !prepayPct) return amount`) nên
`khongUuDai()` **không làm tròn**, còn `nhan()` làm tròn LÊN. Khi **không mùa** + **có ưu đãi** +
giá không bội 1000 → `totalGoc < total` → `schema.ts:240` trả 400.

Chạy thật, đi hết đường client → JSON → `validateBooking`:

```
gốc=90.950 + ưu đãi 1% → total=91.000  totalGoc=90.950 → 400 "Tạm tính không khớp…"
gốc=12.345 + ưu đãi 1% → total=13.000  totalGoc=12.345 → 400
```

Khách bị bảo *"hãy tải lại trang và thử lại"* — tải lại vẫn hỏng, vòng lặp không thoát.
Chưa chạm hôm nay vì **29/29 dòng giá đều bội 1000**, nhưng `data/prices.yaml:1` tự ghi là file
**sinh ra từ Google Sheet**, và PY7 (`py1-py8.ts:262`) chỉ đòi số nguyên dương, không đòi bội 1000.

### B-013 — Truy vấn trùng không lọc `status`: đơn đã huỷ vẫn chặn đơn mới · `mở`

`src/lib/booking/store.ts:44`:
`SELECT code FROM booking WHERE phone=?1 AND tour_slug=?2 AND depart_date=?3 AND created_at>=?4`
— không có mệnh đề `status`.

Khách huỷ → nhân viên đặt `status='cancelled'` bằng tay (`SPEC-2026-08-21` §4.5) → khách đặt lại
đúng tour/ngày **trong 24h** → nhận 200 kèm **mã đơn đã huỷ**, không `INSERT`, không báo tin.
Nhân viên không bao giờ biết.

**Khác `B-003`, đừng gộp.** `B-003` nói về *nội dung* phản hồi trùng (tổng mới kèm mã cũ); mục
này nói về *điều kiện* nào tính là trùng. Cùng nằm ở `handler.ts:211-214` nên nên **quyết một
lần, sửa một lần**. `SPEC-2026-08-21` §4.4 hàng "trùng" im lặng về `status` → cần chủ dự án phán,
không tự chọn.

### B-014 — Turnstile: lỗi hạ tầng bị gộp với lỗi xác minh, và hỏng CÂM · `mở`

`src/lib/booking/turnstile.ts:32-34` bắt CẢ lỗi mạng LẪN lỗi `res.json()` (siteverify trả 5xx)
rồi trả `ok:false` → `handler.ts:188` trả 400 `MSG.turnstileFailed` =
*"Xác minh không thành công, vui lòng thử lại."*

Đây là **thông điệp lỗi duy nhất không nhắc kênh dự phòng** (so `MSG.serverError` ở
`schema.ts:39`: *"…hoặc nhắn Zalo"*). Cloudflare siteverify hỏng từng phần = **mọi** đơn trên
site bị 400, khách được bảo thử lại vô hạn.

Nặng hơn: nhánh này **không ghi `console.error` nào**, nên `wrangler tail` và bảng điều khiển
không thấy gì. Cổng cấu hình 503 đã được xử lý đúng cách đó (`handler.ts:163`); nhánh này thì
chưa — trái đúng ý `DR-099` đặt ra: *hỏng ồn ào, không hỏng câm*.

### B-015 — `BookingForm.astro` còn chuỗi tiếng Việt cứng và hai giá trị lệch token · `mở`

- `:62` `const dateRangeTpl = 'Chọn ngày từ {min} đến {max}'`;
  `grep dateRange src/lib/uiCopy.ts` → **rỗng**. Chuỗi này tới thẳng khách (`:115`) và qua
  `data-date-range` vào script (`:291-293`). Đúng lớp lỗi mà `a265115` đã sửa một lần; mang vào
  lại ở `2eb3dad` (2026-08-30).
- `:573` `letter-spacing: 0.04em` trong khi `tokens.css:126` đã có `--ls-eyebrow: 0.08em` cho
  đúng loại nhãn chữ hoa này. Quy về token sẽ **đổi hiển thị** → cần chủ dự án duyệt thẩm mỹ.
- `:594` `gap: 2px`; thang token bắt đầu ở `--s1: 4px` (`tokens.css:134`).
- Cùng loại nhưng khác file: `schema.ts:23` `MSG.dateTooFar` viết cứng chữ *"90 ngày"*, tách rời
  `LIMITS.MAX_DAYS_AHEAD` ở `:12` — dù chú thích ngay trên khẳng định hằng là *"nguồn DUY NHẤT"*.

Khác `B-001`/`B-002` (là `html.ts` và `notify/format.ts`). Ba file, cùng một luật `ADR-0030` §4.

### B-016 — Thiếu ca test đi hết đường mùa + ưu đãi · `mở`

Không có ca nào chạy `computeQuote(mùa + ưu đãi)` → `buildQuotedPayload` → JSON →
`parseBookingPayload` → `validateBooking`. Sáu ca luật chéo `test/booking/schema.test.ts:287-325`
**tự dựng sẵn** `quoted` (`:290`, `:299`, `:314`, `:322`) — đúng thứ chính file đó cảnh báo ở
`:188`. Ca round-trip thật chỉ có cho **mùa** (`:196`), không có cho **ưu đãi**.

Đây là lý do `B-012` lọt qua 151 ca test. Ba ca cần thêm: round-trip mùa+ưu đãi; bất biến
`totalGoc ≥ total` quét toàn `prices.yaml` × dải mùa × dải ưu đãi; `percent` mùa ngoài biên
không lọt tới `computeQuote` (canh `B-011`).

### B-017 — `07-DESIGN_TOKENS` tuyên bố có cổng máy chặn giá trị cứng — không có · `mở`

`07` mở đầu tuyên bố giá trị cứng *"bị fitness function chặn (CONTROL_GATES tầng 1)"*. Thực tế
`scripts/check-token-parity.mjs` chỉ đối chiếu `07` ↔ `tokens.css`, **không đọc component nào**,
và chú thích `:21-23` tự khai *"KHÔNG nằm trong `gate:all`"*. `grep` giá trị cứng trong
`r1-r4.ts` / `r3-r4-post.ts` / `entity-layout-post.ts` → rỗng.

Nghĩa là luật cứng số 1 của tầng giao diện (`CLAUDE.md` §8) và mục 5 của cổng QA2 hiện chỉ được
canh bằng người. Cùng họ với `B-004`, khác đối tượng.

### B-018 — Năm phiếu `DR-` cho drift tài liệu module đặt tour, chưa cấp số · `mở`

Chi tiết và trích nguyên văn ở `RA-SOAT-2026-08-31` §1 mục "Drift tài liệu". Tóm tắt:

| Nội dung | Đề nghị |
|---|---|
| `SPEC-2026-08-21` §4.4 dòng 242-244 còn ghi muối `ip_hash` là `TURNSTILE_SECRET_KEY`, trái §4.7 và trái `handler.ts:194` | `DR-105` |
| `04-CONSTRAINTS:129` và `02-SAD:58` còn gọi tên **Resend**; `notify/resend.ts` đã xoá từ `QĐ-2026-08-22-07` | `DR-106` |
| `06-BINDING_MAP` §4.8 chưa ghi danh dòng mùa (`BookingForm.astro:172`), dòng ưu đãi (`:173`), nhóm hai nút thanh toán (`:150-160`) | `DR-107` |
| Cụm `SPEC-2026-08-21` lỗi thời: §4.4 payload thiếu `season`/`prepay`/`paymentMethod`; §4.5 bảng thiếu `payment_method`; §4.12 còn `notify/resend.ts` và thiếu 6 file; §5 còn ca "+366 → lỗi" | `DR-108` |
| `BUILD-NOTES:76-80` "Thứ tự bắt buộc" chưa rà lại sau khi `DR-101` khép | `DR-109` |

Thêm hai việc rẻ, không cần phiếu: `DR-104` dòng trạng thái ghi *"đang sửa"* nhưng thân phiếu ghi
ĐÃ LÀM và sửa có thật trong cây (`Sidebar.astro:28`, `TourDetail.astro:133`, commit `83425df`);
và `HANDOFF-2026-08-29` cần rút hoặc gắn nhãn cũ — nó tự tuyên *"Đọc file này TRƯỚC khi đọc bất
cứ gì khác"* nhưng viết lúc 15:21 (`ba781d9`), trước `SPEC` §4b lúc **20:02** (`a0b43d4`), nên ba
dòng "❌ chưa" của nó đã sai từ lâu (đo 2026-08-31: đủ 8 secret, hai migration đã áp).

**Số `DR-*` đã va bốn lần** ở luồng này. Grep cả `main` lẫn nhánh đang sống trước khi cấp.
Lớn nhất lúc rà soát: `DR-104`.

### B-019 — Hai hạng mục chưa kết luận được, cần thiết bị thật · `mở`

- **Ô `<input type="date">` trên iOS Safari.** Bản vá `cae3194` còn nguyên trong nguồn
  (`BookingForm.astro:591-592`) và trong CSS dựng, nhưng chính commit đó viết hoa
  *"Blink KHÔNG áp sàn này — nên đừng nghiệm thu bản vá này bằng Chrome."* Cần iPhone thật.
- **Lighthouse a11y sau khi thêm nhóm radio thanh toán** (`1b29401`). Đợt 2026-08-29 đạt 99,
  nhưng đo **trước** thay đổi đó. `SPEC-2026-08-21` §7 mục 8 đòi ≥ 95.
- Kèm theo, mức nhẹ: `.bf__pay-opt` (`:617`) không khai `flex: none` cho `input`, nhãn dài xuống
  hai dòng có thể bóp chấm tròn ở 360px. Suy từ CSS, chưa đo trên Safari iOS.

### Vòng sau — việc rà soát module đặt tour còn tiếp

Đợt 2026-08-31 **đã phủ**: logic giá (`quote`/`season`/`schema`/`vn-date`), luồng máy chủ
(`handler`/`store`/`code`/`turnstile`/`notify`), bề mặt `BookingForm.astro`, và độ khớp tài liệu.
Đo trên trình duyệt thật ở 360/390/640px: 0 tràn ngang, 0 lỗi console, 28/28 tour có giá render
form hợp lệ, chuỗi mùa+ưu đãi khớp từ client tới máy chủ.

**Chưa phủ, để vòng sau:**

- Tầng QR chuyển khoản và ZNS (`SPEC-2026-08-31`) — viết sau đợt rà soát này, chưa ai soát.
- `notify/sigv4.ts` mới chỉ đối chiếu vector AWS; chưa soát trong điều kiện xoay khoá IAM.
- Đường `tiers` đi qua `validateBooking` — hiện `prices.yaml` **0 dòng `tiers`** nên latent,
  nhưng máy chủ coi mọi thứ là `flat` (`schema.ts:227`) và không có ca test nào.
- Nhãn `zh`/`ko`/`ru`: ~25 khoá `booking*` cũ vẫn nguyên tiếng Anh (`uiCopy.ts` khối `:383`,
  `:563`, `:743`). Nghịch lý: 5 khoá `bookingPay*` **mới nhất** lại là khoá duy nhất được dịch
  thật, vì `SPEC-2026-08-30` §4.6 buộc "cả 5 ngôn ngữ".
- Zalo Bot **gửi nhóm** và **giới hạn tần suất** — `SPEC-2026-08-21` §8 giao phải xác minh và ghi
  `DRIFT_LOG` nếu khác giả định. `grep` trong `DRIFT_LOG.md` → 0 kết quả. Chưa ai làm.
- Tải và đồng thời: chưa đo hành vi khi hai đơn cùng SĐT tới cùng lúc (đường `findRecentDuplicate`
  không có khoá).

### B-020 — Rủi ro `.bf__pax-price` mất ở bảng giá dạng bậc: đóng ngay lúc mở · `đã đóng`

Số hiệu đặt trước bởi `QĐ-2026-08-31-03` (`docs/DECISIONS.md`, đoạn "Nợ kèm theo"): với bảng
giá `kind: 'tiers'`, `.bf__pax-price` không render, nên tour dùng bảng giá bậc sẽ chỉ còn giá ở
thanh dính, không còn đơn giá trong form — trong khi tour `kind: 'flat'` vẫn còn. Lúc đặt số,
`data/prices.yaml` có **0/29** khoá dùng `tiers` nên rủi ro còn ngủ, chưa ai chạm.

Task 5 (cùng ngày 2026-08-31, xem "Bổ sung cho `QĐ-2026-08-31-03`" trong `DECISIONS.md`) bỏ
`.bf__pax-price` khỏi **mọi** hạng khách — không riêng `tiers` — vì chủ dự án chốt ẩn hết đơn
giá từng hạng trong form, bất kể loại bảng giá. Giả định làm nền cho rủi ro này ("`flat` còn
đơn giá, `tiers` thì không, nên hai loại lệch nhau") không còn đúng: sau Task 5 **không loại
bảng giá nào** hiển thị đơn giá trong form nữa, nên không còn gì để lệch. Đóng lại đúng lúc mở,
không phải bỏ quên — kiểm bằng `grep -c 'class="bf__pax-price"' dist/tour/*/index.html` (mọi
tour, không riêng tour giá bậc) ra 0.

### B-023 — prop `priceLabel` của `BookingForm` thành thừa · `mở`

Task 5 bỏ khối `.bf__head` — nơi duy nhất `priceLabel` được render trong `BookingForm.astro`.
Prop vẫn khai ở `Props` (`:23`) và vẫn được destructure (`:31`), nhưng từ đây không còn nơi
dùng trong file. `TourDetail.astro:213` vẫn truyền `priceLabel={priceView!.label}` xuống. Cố ý
giữ nguyên prop và lời gọi — xoá là chạm thêm một file ngoài phạm vi Task 5. Dọn khi có dịp chạm
`TourDetail.astro`.

Cùng gốc: khoá `priceFrom` trong `src/lib/uiCopy.ts` (5 ngôn ngữ) chỉ được `t('priceFrom')` gọi
ở đúng chỗ `.bf__head` vừa xoá, nay cũng mồ côi. Dọn cùng lúc với prop `priceLabel` — cả hai đều
cần chạm `TourDetail.astro` (hoặc chỗ gọi `BookingForm` với `priceLabel`) để xác nhận không còn
nơi nào khác cần nhãn "Giá từ" trước khi xoá khoá dịch.

### B-021 — `/tac-gia/` trỏ breadcrumb vào 404 · `mở`

`Breadcrumb.astro:43-52` đẩy crumb nhánh **không kiểm `hasIndex`**, nên mọi trang
`/tac-gia/{slug}/` mang liên kết tới `/tac-gia/` (404) và đẩy URL đó vào JSON-LD
`BreadcrumbList`. Y hệt ca `organization` đã chữa ngày 31/08 bằng
`SPEC-2026-08-31-trang-danh-sach-cong-ty.md`. Chữa bằng cách mở `/tac-gia/` (bật `hasIndex`)
hoặc cho `Breadcrumb` kiểm `hasIndex`. Cố ý KHÔNG gộp vào đợt 31/08 để giữ phạm vi.

### B-024 — JSON-LD của giá nhóm phát giá TRẦN, không nói đó là giá cả nhóm · `mở`

`src/lib/resolver.ts:83-92` nhánh `perGroup` phát `offers: [{ price: entry.amount, priceCurrency:
'VND' }]` — không gì đánh dấu 1.000.000₫ là giá **một lượt tối đa 5 khách**. Máy đọc (Google) có
thể hiển thị nó như giá đầu người.

**Đã kích hoạt, không còn là rủi ro tương lai:** `phao-chuoi` chạy thật từ 2026-09-04 21:08. Kiểm:
`curl -s https://tourdao.vn/trai-nghiem/phao-chuoi/ | grep -o '"price":1000000'`.

Nghịch lý đáng ghi: nhãn cho **người** đọc đã nói rõ (`1.000.000₫/lượt · tối đa 5 khách`,
`uiCopy.ts:1147`) — chỉ bề mặt **máy** đọc là trần. Sửa cần quyết định về schema.org
(`eligibleQuantity` hay `priceSpecification`), là thiết kế chứ không phải vá cơ giới → cần ADR
hoặc phiếu. Xem `ADR-0033` §Hệ quả.

### B-025 — `PY1`–`PY8` khai `live` nhưng không chạy trên đường tự động nào · `mở`

Chuỗi đã truy từng mắt: `scripts/validators/py1-py8.ts:318` khai PY4 mức fail ← chỉ
`scripts/validate-constraints.ts:9,88` nạp `PY_VALIDATORS` ← chỉ `scripts/package.json:6`
(`validate`) ← chỉ `package.json:12` (`build:strict`).

Mà `npm run gate` = `astro check && run-gates.mjs post spec`, và danh sách ở
`scripts/run-gates.mjs:33-58` **không có** `py1-py8`. `.githooks/pre-push` chạy đúng `npm run gate`.
Cloudflare chạy `build:ci` = `astro check && astro build`. Trong khi `control-registry.yaml:348-355`
khai PY4 `status: live`.

Hậu quả đo được ngày 2026-09-04: gắn `bookingRef.key` **trỏ nhầm sang một dòng giá có thật** thì
mọi cổng xanh mà trang hiện giá của sản phẩm khác. `data/prices.yaml` đang có
`tour-snorkeling-nha-trang` nằm cạnh `snorkeling-nha-trang` — đúng cặp dễ nhầm.
`git diff data/prices.yaml` **không** bắt được: diff không cho biết Studio trỏ vào đâu.

Cùng đường vắng mặt: `npm test` (vitest, 204 ca) cũng không nằm trong `gate` lẫn pre-push.

### B-026 — hai trang bán cùng một sản phẩm, nay CẢ HAI nhận đơn được · `mở`

`/trai-nghiem/phao-chuoi/` và `/trai-nghiem/phao-bay-flying-banana-boat/` là **một hoạt động**
(chủ dự án xác nhận 2026-09-04), cùng trỏ khoá `phao-chuoi`, và từ 21:08 cả hai đều có form.

Đo: `curl -s https://tourdao.vn/trai-nghiem/phao-bay-flying-banana-boat/ | grep -c 'id="dat-tour"'`
→ 1. Đơn về mang hai `tour_slug` khác nhau cho cùng một hoạt động → thống kê không cộng được, và
khách đặt ở trang nào cũng đúng nên không ai phát hiện.

Trước 2026-09-04 đây chỉ là nội dung trùng; nay là **dữ liệu đơn hàng phân mảnh**. Chữa bằng cách
gộp hai document trong Studio (giữ một, gỡ xuất bản một) — việc nội dung, không phải việc mã.

### B-027 — bản dịch form đặt chỗ thủng loang lổ ở zh/ko/ru · `mở`

`src/lib/uiCopy.ts`: `bookingPayTransfer` dịch đủ 5 thứ tiếng (`:100,313,514,715,916`), nhưng
`paxAdult`, `paxGuests`, `bookingPickup`, `bookingSubtotalNote` ở zh/ko/ru vẫn là **chuỗi tiếng
Anh** (`:486-490,687-691,888-892`).

Nợ có sẵn từ trước đợt 2026-09-04; đợt đó chỉ **chạm vào** nhóm thủng (nhãn ô đếm đổi sang
`paxGuests`), không làm rộng thêm. Khách Trung/Hàn/Nga đọc form thấy nửa tiếng mình nửa tiếng Anh.

### B-028 — `PY7` không tự chặt, phụ thuộc `PY2` chạy cùng · `mở`

`scripts/validators/py1-py8.ts:303-312` nhánh `perGroup` chỉ xét sai kiểu **khi giá trị đã là
số** (`typeof a === 'number' && …`). Nên `maxPax: "5"` (chuỗi) **lọt PY7**, chỉ bị chặn ở PY2
(`:98-103`). Cổng tổng vẫn chặn được vì cả hai ở mức fail — nhưng đó là **độ chặt hợp thành**,
không phải PY7 đứng một mình.

Ba đơn vị giá cũ cũng viết y hệt — không phải khuyết tật riêng của `perGroup`. Rủi ro: ai tách
chạy riêng PY7 (gỡ lỗi, hoặc một cổng khác chỉ gọi PY7) sẽ tưởng nó đủ. Cùng chỗ: thiếu test cho
`unit: 'PerGroup'` sai hoa/thường (cơ chế đã chặn đúng qua `Set.has`, chỉ thiếu ca canh).

### B-029 — hai `Record<ProductType,string>` trùng giá trị ở hai module · `mở`

`src/lib/booking/notify/format.ts` (`NHAN_LOAI`) và `src/lib/booking/handler.ts` (`NHAN_TRANG`)
khai hai bảng tra **giá trị giống hệt nhau** cho cùng một kiểu `ProductType`. Nên gom về
`schema.ts` — nơi `ProductType` đã sống.

Cùng nhóm dọn tên, đều do brief chép sẵn nên không phải lỗi người thi công:
- `src/lib/booking/schema.ts:53` `docProductType` — "doc" không tự giải thích, khác quy ước
  `str`/`int`/`pick`/`clean` cùng file.
- `src/lib/booking/html.ts:6` tham số `backLabel` chỉ chứa danh từ trần ("tour"/"trải nghiệm"),
  template ghép `Về trang ${backLabel}` — tên gợi ý sai, dễ khiến người gọi sau truyền cả cụm.

### B-030 — `git commit` gom cả index khi hai phiên dùng chung thư mục · `mở`

`.githooks` có `block-git-add-all.sh` chặn `git add -A`/`--all`/`.`, nhưng **`git commit` vẫn gom
toàn bộ index** bất kể cờ nào. Xảy ra thật ngày 2026-09-04: commit `7a07fa4` (chỉ định `git add`
đúng một file) cuốn theo hai file một phiên Claude khác đang stage —
`docs/evidence/2026-09-04-ra-soat-tu-dong-hoa/report.{json,md}`. Kiểm:
`git show --stat 7a07fa4` ra 3 file thay vì 1.

Chữa được ở ba mức, chưa quyết mức nào: (a) tài liệu — soi `git status` trước mỗi commit; (b) hook
`pre-commit` cảnh báo khi index chứa file ngoài phạm vi lệnh `add` gần nhất; (c) đổi quy ước sang
`git commit -o <path>` (chỉ commit đường dẫn nêu tên, bỏ qua index).

Cùng gốc rủi ro thư mục dùng chung: ngày 2026-09-04 một migration D1 (`0003_product_type`) được áp
lên **remote production** lúc 09:46 mà phiên điều phối không hề gọi `wrangler` — không truy được
tác nhân nào chạy. Vô hại lần này (thao tác bồi, `DEFAULT 'tour'`, 7 đơn cũ nguyên vẹn), nhưng cho
thấy điểm dừng của phiên điều phối **không chặn được tác nhân con**: brief giao subagent cần cấm
rõ `wrangler … --remote`, `d1 execute`, `deploy`, chứ không chỉ im lặng không nhắc.
