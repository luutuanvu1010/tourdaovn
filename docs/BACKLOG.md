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

### B-024 — Module tài khoản đối tác: brainstorm xong, spec xong, **chặn ở phê chuẩn** · `mở`

Phiên 2026-08-31. Chủ dự án yêu cầu đăng nhập / đăng ký / phân quyền, và đơn nhiều dịch vụ với
giá khác nhau theo vai (đại lý · hướng dẫn viên · nhân viên kinh doanh · khách).

> **Ngoại lệ có chủ ý** với luật của sổ này: giữ lại đúng vì đã có spec mà **chưa ai cam kết**
> **làm** — loại việc dễ rơi mất nhất. `B-022` (nhánh đối soát) giữ lại vì cùng lý do.

**Đã có, không phải làm lại:** `docs/adr/ADR-0033-vung-dang-nhap-doi-tac.md` (đề xuất, chờ phê
chuẩn) và `docs/specs/SPEC-2026-08-31-tai-khoan-doi-tac.md` — bảy điểm chủ
dự án chốt, 13 mục thiết kế, migration, bộ test, cổng nghiệm thu, và §7 liệt kê nợ luật.

**Bảy điểm đã chốt** (đừng hỏi lại): giá theo vai **kín** với khách lẻ · khai bằng **% riêng từng
dịch vụ** nên `prices.yaml` giữ nguyên vai trò nguồn giá duy nhất · **một hệ tài khoản mới** cho
cả ba vai, không dính Sanity · đối tác **tự chốt đơn**, trả từng đơn, **không công nợ** · kiến
trúc **PA-1** (cây `/doi-tac/*` render giá ở máy chủ, trang công khai không sửa dòng nào) ·
**một bảng đơn duy nhất** `sale_order` + `sale_order_item`, chuyển cả luồng đặt tour công khai
sang · **SĐT khách cuối bắt buộc**.

**Chặn thật, không phải thiếu người** — ba khoản **nới** ràng buộc cần chủ dự án phê chuẩn kèm
lý do ghi `DECISIONS.md` (`04-CONSTRAINTS` §5), cộng một ADR chờ phê chuẩn:

| # | Khoản | Hiện trạng |
|---|---|---|
| 1 | `ADR-0033` — vùng đăng nhập đối tác, **bổ sung** `ADR-0027` và `ADR-0030` (điều cấm 2.5: không sửa ADR đã duyệt) | **đã soạn** 31/08, chờ phê chuẩn |
| 2 | Nới **điều cấm 2.3** — vùng `/doi-tac/*` được render giá ở máy chủ; trang công khai vẫn không gọi API giá | chờ phê chuẩn |
| 3 | Nới **`BK1`** — `/doi-tac/*` đọc bảng giá gốc sinh lúc dựng **và** đọc `role_rate` từ D1 lúc chạy | chờ phê chuẩn |
| 4 | Gỡ *"không giỏ hàng"* ở `00-PROJECT_BRIEF` §5, chỉ trong phạm vi vùng đăng nhập | chờ phê chuẩn |

**Một câu hỏi CÒN MỞ, phải chốt ở QA1:** ưu đãi trả trước loại theo **dòng** hay theo **người**?
Spec §7b trình bày cả hai cùng hệ quả lên `quoted_json` và lên khâu đối soát của `ADR-0032`;
khuyến nghị của Cowork là **theo người**. Không tự chọn.

**Phát hiện phụ, có giá trị độc lập với module này** — dataset Sanity `production` là
`aclMode: public`, đọc được **không cần token**:

```
curl "https://pgedy374.api.sanity.io/v2022-03-07/data/query/production?query=*%5B_id%3D%3D%22bangGiaMuaVu%22%5D%5B0%5D"
→ 200  {"result":{"_id":"bangGiaMuaVu","batUuDai":true,"phanTramUuDai":5,…}}
```

`projectId` in sẵn trong mọi URL ảnh `cdn.sanity.io/images/pgedy374/production/…`, nên **ai đọc
một trang tour cũng đọc được cả dataset**, gồm cả bản `draft`. Đây là lý do bảng % chiết khấu
theo vai **đã bị chuyển khỏi Sanity sang bảng `role_rate` trong D1** giữa lúc soạn spec — bản
đầu để trong Studio và đã sai. Cần lập phiếu `DR-` riêng (cấp số lúc ghi; `B-018` đã xếp
`DR-107`–`DR-109`, cao nhất đã lập phiếu là `DR-106`). Có siết ACL hay không là quyết định
tầng ADR, ngoài phạm vi spec này.

**Thứ tự thi công khi mở lại** (spec §5, đừng đảo): migration `0003` + chuyển luồng đặt tour
công khai sang bảng mới **trước tiên**, lúc 170 test đang xanh làm lưới → lớp nghiệp vụ tài
khoản → `role_rate` + bước sinh giá gốc → cây `/doi-tac/*` → tab duyệt trong Studio →
validator `AU1`–`AU6`.

**Đừng làm mất ba thứ đã kiểm ngày 2026-08-31:** `dist/.assetsignore` chứa đúng `_worker.js` và
`_routes.json` nên bundle Worker không phục vụ công khai (toàn bộ §4.4 đứng trên dòng đó) ·
`data/prices.yaml` có 29 dòng, **tất cả** `unit: perPax`, nên vòng đầu không cần engine giá mới ·
`npm test` = 170 test / 13 file xanh, là lưới nghiệm thu cho bước chuyển bảng.

**Rủi ro nếu để lâu:** spec neo vào `handler.ts`, `quote.ts`, `store.ts` và bảng `booking` ở
trạng thái hôm nay. `B-003`, `B-012`, `B-013` đều nằm đúng những file đó — ai chữa mấy mục ấy
trước thì phải rà lại §4.6 và §4.8 của spec.

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
