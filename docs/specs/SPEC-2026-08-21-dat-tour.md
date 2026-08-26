# SPEC — Module đặt tour trên trang chi tiết Tour

- **Trạng thái:** thiết kế duyệt trong phiên 2026-08-21 (phương án A); toàn văn spec và
  ADR-0027 chủ dự án phê chuẩn 2026-08-22. Kế hoạch thi hành: `docs/plans/2026-08-22-dat-tour.md`.
- **Ngày soạn:** 2026-08-21   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa **một chiều** ở ba chỗ — (1) mở container runtime đầu tiên của
  hệ (endpoint nhận đơn + D1), (2) đổi hình dạng lược đồ `prices.yaml` (thêm `paxRates`),
  (3) `wrangler.toml` có `main`, tức Worker không còn là asset thuần. Cả ba ghi ở
  `ADR-0027`. Phần giao diện form là cửa hai chiều.
- **Bản ghi:** `QĐ-2026-08-21-01` trong `docs/DECISIONS.md`; `docs/adr/ADR-0027-module-dat-tour.md`
- **Bản sửa 2026-08-22 theo `QĐ-2026-08-22-07`:** kênh email đổi từ **Resend** sang **Amazon SES**
  (ký SigV4 tự viết, không thêm dependency); thêm bí mật `IP_HASH_SALT` sinh từ phán xét F4 của
  vòng review Task 8. Sửa ở §3, §4.6, §4.7, §5, §6. Phần còn lại giữ nguyên.
- **Đầu vào đã đọc:** `playbook/CONSTITUTION.md`, `GOVERNANCE.md` §2–4, `00-PROJECT_BRIEF`
  §3 §5, `01-CONTENT_MODEL` §2.8 §2.15 §5.3, `02-SAD`, `04-CONSTRAINTS` §1b §2 §4,
  `05-URL_MAP` §2 §4, `06-BINDING_MAP` §0 §2 §3 §4.8, `ADR-0003`, `ADR-0007`, `ADR-0021`,
  `ADR-0023`, `src/components/TourDetail.astro`, `BookingCTA.astro`, `ContactChannels.astro`,
  `DetailLayout.astro`, `Sidebar.astro`, `src/lib/{prices,resolver,types,uiCopy}.ts`,
  `scripts/validators/py1-py8.ts`, `scripts/lib/price-loader.ts`, `wrangler.toml`,
  `astro.config.mjs`, `dist/_worker.js/` (adapter đã sinh), ảnh `docs/design/giaodiendatve.png`.
- **Repo lúc soạn:** `main` tại `1416363`

---

## 1. Mục tiêu

Khách đang đọc một trang tour **đặt được ngay tại chỗ**: chọn ngày, số người theo hạng, thấy
tạm tính, để lại tên và số điện thoại. Công ty nhận đơn **tức thì** qua email và Zalo, có
**bản ghi gốc** kèm mã đơn để gọi lại xác nhận. Không thanh toán trên site, không giữ chỗ —
đơn là *yêu cầu đặt*, nhân viên chốt.

## 2. Vấn đề

Hôm nay trang `/tour/{slug}` có slot `booking` trong sidebar gồm `BookingCTA` (chỉ nhãn giá,
nút "Đặt tour" **không có href** nên không render) và `ContactChannels` (Zalo / gọi /
WhatsApp). Khách muốn đặt phải rời trang sang Zalo và tự gõ lại tên tour, ngày, số người.
Công ty không có bản ghi nào ngoài lịch sử chat.

Ba điều kiến trúc đang chi phối:

1. **Site thuần tĩnh, chưa có đường ghi nào lúc runtime.** Sanity chỉ đọc lúc build bằng
   token chỉ đọc; giá đi một chiều từ `data/prices.yaml`; `wrangler.toml` không có `main`,
   Worker chỉ phục vụ asset. `02-SAD` §1 đã ghi "Booking đầy đủ (tương lai)" là container
   sẽ mở sau, cửa một chiều.
2. **Giá là một số/khách.** `perPax` có `amount` hoặc `tiers[]` theo cỡ nhóm. Ảnh minh hoạ
   có ba hạng khách; chủ dự án chốt ba hạng **người lớn / trẻ em / người cao tuổi**.
   `04-CONSTRAINTS` PY2/PY7 khoá chặt danh sách khoá nên thêm hạng là sửa lược đồ, ADR.
3. **Không có field lịch khởi hành**, và `01-CONTENT_MODEL` §2.8 nói rõ "lịch thật thuộc
   booking, không ở Sanity". Chủ dự án chốt tour chạy **hằng ngày**, khách chọn ngày bất kỳ.

Phát hiện thêm khi lập kế hoạch (2026-08-22, DR-039): `data/prices.yaml` **trống**, và 8 tour
approved đang chứa **chuỗi giá** trong `bookingRef.key` ("Người lớn: 850.000 VNĐ | Trẻ em:
600.000 VNĐ") — trái I1 và trái nghĩa khoá. Kế hoạch Task 11 chuyển khoá = slug và đưa số sang
`prices.yaml` (`amount` + `paxRates`); không chuyển thì không tour nào có form.

## 3. Bốn quyết định đầu vào (chủ dự án chốt 2026-08-21)

| Câu hỏi | Chốt | Hệ quả thiết kế |
|---|---|---|
| Đơn gửi về đâu | **Email + thông báo Zalo**; bản ghi gốc ở **Cloudflare D1** | **Amazon SES** cho email (`QĐ-2026-08-22-07`; spec gốc ghi Resend); **Zalo Bot API** báo cho nhân viên (không phải ZNS cho khách — pha 2) |
| Ngày khởi hành | **Hằng ngày**, chọn ngày bất kỳ | `<input type="date">`, không khai lịch |
| Hạng khách | **Người lớn, trẻ em, người cao tuổi** | `prices.yaml` thêm `paxRates` tuỳ chọn theo dòng giá; hạng không khai thì không hiện |
| Phạm vi | **Chỉ trang chi tiết Tour** | form trong sidebar `/tour/{slug}`; menu "Đặt vé trực tuyến" vẫn trỏ Zalo |

Cách hiểu đã nêu và được duyệt: "thông báo Zalo" là báo **cho công ty**; đơn là yêu cầu,
không phải đơn hàng chốt.

## 4. Thiết kế

### 4.1 Kiến trúc: container *Booking intake* trên chính Worker hiện có

```
prices.yaml ──(build)──► BookingForm.astro trong sidebar /tour/{slug}
                          (giá nướng vào data-attr; JS tính tạm tính; không gọi API giá)
                                   │  POST /api/dat-tour  (JSON)
                                   ▼
            Route on-demand của Astro (prerender = false) chạy trên Worker:
            validate → Turnstile siteverify → chống trùng → INSERT D1 `booking` → 201 {ok, code}
                                   │  ctx.waitUntil
                                   ├─► Amazon SES  → hộp thư công ty
                                   └─► Zalo Bot API → từng chat_id nhân viên
```

- **Đóng gói:** `src/pages/api/dat-tour.ts` với `export const prerender = false`. Adapter
  `@astrojs/cloudflare` **đã** sinh `dist/_worker.js/index.js` cho mọi build; spec này chỉ
  bật nó lên bằng `main = "./dist/_worker.js/index.js"` trong `wrangler.toml`. Toàn bộ trang
  còn lại vẫn prerender tĩnh như hôm nay; asset vẫn được phục vụ trước, Worker chỉ chạy khi
  không có asset khớp (mặc định của Workers Static Assets).
- **Vì sao không Worker riêng (phương án B):** cùng một thiết kế dữ liệu, nhưng B thêm một
  entry build thứ hai và lặp hằng số (nhãn hạng khách, định dạng). A dùng lại type, `uiCopy`,
  `locals.runtime.env`, và adapter đã có. Chủ dự án chọn A.
- **Vì sao D1, không Sanity, không Google Sheet, không dịch vụ form:** dữ liệu khách là dữ
  liệu vận hành, không phải nội dung; `01-CONTENT_MODEL` §5.2 tiêu chí 5 và §2.8 đặt nó
  **ngoài** Sanity; thêm `_type` là cửa một chiều chạm `04-CONSTRAINTS` §2.1 và kéo token
  ghi vào runtime; dataset Sanity công khai sẽ lộ PII. Sheet/dịch vụ form đưa PII ra bên
  thứ ba và không có mã đơn, không có Zalo Bot. D1 nằm cùng tài khoản Cloudflare, miễn phí
  ở quy mô này, truy vấn được bằng SQL, và sao lưu bằng `wrangler d1 export`.

**Bốn bất biến giữ nguyên, ghi thành luật BK ở §4.11:** trang không đọc giá lúc runtime
(tạm tính từ số đã nướng lúc build, endpoint chỉ **lưu** giá tham khảo); endpoint không ghi
Sanity và không ghi `prices.yaml`; token Sanity của build vẫn chỉ đọc; D1 là bản ghi gốc,
báo tin hỏng **không** làm hỏng đơn.

### 4.2 Lược đồ giá: `paxRates` (sửa ADR-0007, cửa một chiều)

```yaml
tour-3-dao:
  unit: perPax
  amount: 550000               # = giá NGƯỜI LỚN. Giữ nguyên nghĩa cũ: nhãn "Giá từ", JSON-LD Offer không đổi
  paxRates:                    # tuỳ chọn. Khoá đóng: child | senior | infant
    child:  { amount: 350000, note: "5–11 tuổi" }
    senior: { amount: 450000, note: "từ 60 tuổi" }
```

Luật:

| # | Luật | Thi hành |
|---|---|---|
| 1 | `paxRates` chỉ hợp lệ khi `unit: perPax` **và** có `amount`; cấm cùng `tiers` | PY2 |
| 2 | Khoá con thuộc enum đóng `child`, `senior`, `infant`; khoá lạ → fail | PY7 (`ALLOWED_TOP_KEYS.perPax` thêm `paxRates`; thêm `ALLOWED_PAX_CODES`, `ALLOWED_PAX_RATE_KEYS = {amount, note}`) |
| 3 | `amount` của hạng phụ là **số nguyên ≥ 0** (0 = miễn phí, hiện "Miễn phí"); `amount` người lớn vẫn phải > 0 | PY7 |
| 4 | `note` là chuỗi ≤ 40 ký tự, chỉ để hiện cạnh tên hạng; không vào JSON-LD | PY7 kiểm kiểu và độ dài |
| 5 | Thứ tự hiện trên form **cố định**: người lớn → trẻ em → người cao tuổi → em bé, bất kể thứ tự trong YAML | render |
| 6 | Không có `paxRates.adult` — người lớn luôn là `amount`; ghi chú độ tuổi người lớn v1 không có | — |

`PriceEntry` (`src/lib/types.ts` **và** `scripts/lib/price-loader.ts`, hai bản phải giống
nhau) thêm biến thể:

```ts
export type PaxCode = 'adult' | 'child' | 'senior' | 'infant'
export type PaxRate = { amount: number; note?: string }
| { unit: 'perPax'; amount: number; paxRates?: Partial<Record<Exclude<PaxCode,'adult'>, PaxRate>> }
```

`resolvePrice()`, nhãn giá, `applyPriceToJsonLd()` **không đổi**: Offer vẫn là `amount`.
Giá hạng phụ là dữ liệu cho form, không vào JSON-LD (không có property sạch, `01` §5.1).

### 4.3 Giao diện: `BookingForm.astro` trong slot `booking`

**Điều kiện render.** Chỉ khi `priceView` khác `null` (tour có `bookingRef` trỏ đúng dòng
giá). Tour không giá **giữ nguyên như hôm nay** — `ContactChannels`, không form, không CTA
giả (`06-BINDING_MAP` quyết định nền 3). `BookingCTA` thôi dùng ở Tour (giữ file cho
entity khác). **Khi form render, `ContactChannels` không render trong slot booking** — nút Zalo
và hotline đã nằm trong thẻ; WhatsApp còn ở chân trang (`06` §2).

**Bố cục một thẻ, hai bước, một `<form>` duy nhất** (`id="dat-tour"`, `method="post"`,
`action="/api/dat-tour"`):

| Vùng | Dữ liệu nuôi | Ứng xử |
|---|---|---|
| Đầu thẻ "Giá từ **X**/người" | `priceView.label` | như `BookingCTA` hôm nay |
| Ngày khởi hành | `<input type="date" name="departDate">` | `min` = ngày mai (giờ Việt Nam), `max` = +365 ngày; bắt buộc |
| Số người | một hàng bộ đếm cho **mỗi hạng có giá**: người lớn (luôn có, `amount`), rồi hạng trong `paxRates` | người lớn 1–20, hạng khác 0–20, tổng ≤ 30; vượt → chữ gợi ý "Đoàn lớn? Nhắn Zalo để báo giá riêng" và khoá nút "+" |
| Tour `tiers` (tour riêng theo cỡ nhóm) | một bộ đếm "Số khách" | tạm tính = `amount` của bậc có `maxPax` nhỏ nhất ≥ tổng khách, nhân tổng khách; vượt bậc cao nhất → gợi ý Zalo. Gửi lên dưới `pax.adult` = tổng khách (các hạng khác 0), `quoted.perPax.adult` = `amount` của bậc đã chọn |
| Tạm tính | tính bằng JS từ `data-*` nướng lúc build | dòng theo hạng "Người lớn × 2 — 1.100.000₫" + dòng **"Tạm tính"** (không dùng chữ "Tổng cộng"); dưới là chú thích "Giá tạm tính theo bảng giá công bố; nhân viên xác nhận trước khi thanh toán." |
| Nút **"Đặt tour ngay"** (chính) | — | mở bước 2 ngay trong thẻ, chuyển tiêu điểm vào ô họ tên |
| Nút **"Tư vấn miễn phí"** (phụ) | `siteSettings.contact.zaloUrl` | không có `zaloUrl` thì không render nút |
| Dòng "Hotline: …" | `siteSettings.contact.hotline` | `tel:`; không có thì ẩn |
| **Bước 2** | `name`* (2–80), `phone`* (SĐT Việt Nam), `email` (tuỳ), `pickup` "Điểm đón: khách sạn hoặc địa chỉ" (tuỳ, ≤ 200), `note` (tuỳ, ≤ 1000), ô honeypot `website` ẩn bằng CSS, widget Turnstile | nút **"Gửi yêu cầu đặt tour"**; khi gửi đổi thành "Đang gửi…" và khoá |
| Thành công | JSON `code` | thay thân thẻ bằng: "Đã nhận yêu cầu đặt tour" · "Mã đơn **TD-…**" · tóm tắt ngày/số người/tạm tính · "Tour Đảo sẽ gọi lại xác nhận trong giờ làm việc. Cần gấp, nhắn Zalo." + nút Zalo |
| Lỗi kiểm | JSON `fields` | hiện lỗi tiếng Việt ngay dưới ô sai, `aria-live="polite"` |
| Lỗi mạng / 5xx | — | "Chưa gửi được. Vui lòng thử lại, hoặc nhắn Zalo / gọi hotline." giữ nguyên dữ liệu đã nhập |
| `<noscript>` | — | "Cần bật JavaScript để gửi yêu cầu. Hoặc nhắn Zalo / gọi hotline." (Turnstile cần JS, xem §4.6) |

**Không có "Mã tour"** như trong ảnh: model không có field, không vẽ vùng không có nguồn
(`06-BINDING_MAP` §0). Mã **đơn** do hệ sinh mới là thứ khách cần giữ.

**Thanh dính (mobile).** CTA đổi từ Zalo sang neo `#dat-tour` với nhãn `t('bookTour')` —
form là hành động chính, Zalo vẫn nằm trong thẻ. `DetailLayout` bỏ `target="_blank"` /
`rel` khi `ctaHref` bắt đầu bằng `#` (hôm nay gắn cứng cho Zalo).

**Trợ năng.** Bộ đếm là hai `<button type="button">` với `aria-label` "Bớt người lớn" /
"Thêm người lớn" và một `<input type="number" inputmode="numeric" name="pax.adult">` ở
giữa (không JS vẫn gõ số được); nhãn ô ngày gắn `<label for>`; vùng lỗi `aria-live`; vùng
thành công `role="status"`; mở bước 2 thì đưa tiêu điểm vào ô đầu; màu và cỡ chữ dùng token
hiện có (`--c-primary`, `--c-accent`, `--c-accent-soft`, `--radius-md`, `--radius-pill`,
`--fs-*`), **không** giá trị cứng mới (cổng QA2 mục 5).

**Copy mới trong `uiCopy.ts`** (vi bắt buộc, en để dự phòng; các ngôn ngữ khác rơi về en):
`bookingTitle`, `bookingDepartDate`, `bookingPax`, `paxAdult`, `paxChild`, `paxSenior`,
`paxInfant`, `paxGuests` (cho `tiers`), `bookingSubtotal`, `bookingSubtotalNote`,
`bookingLargeGroupHint`, `bookingBookNow`, `bookingFreeConsult`, `bookingHotline`,
`bookingName`, `bookingPhone`, `bookingEmail`, `bookingPickup`, `bookingNote`,
`bookingSubmit`, `bookingSending`, `bookingSuccessTitle`, `bookingCode`,
`bookingSuccessBody`, `bookingError`, `bookingNoScript`, cùng thông điệp lỗi từng ô.

**Client script.** Một `<script>` trong `BookingForm.astro` import `src/lib/booking/quote.ts`
(Astro bundle TS cho client) — **cùng một hàm tính tạm tính** dùng ở server để kiểm, không
viết hai bản. Không framework, không dependency client mới. Turnstile nạp **lười** khi mở
bước 2 (`challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`), chế độ managed,
để không đụng Lighthouse của trang tour.

### 4.4 Endpoint `POST /api/dat-tour`

Hợp đồng vào (JSON; `application/x-www-form-urlencoded` cũng nhận, cùng tên trường, `pax.adult`…):

```json
{
  "tourSlug": "tour-3-dao-nha-trang", "tourTitle": "Tour 3 đảo Nha Trang", "bookingRef": "tour-3-dao",
  "departDate": "2026-09-05",
  "pax": { "adult": 2, "child": 1, "senior": 0, "infant": 0 },
  "quoted": { "perPax": { "adult": 550000, "child": 350000 }, "total": 1450000, "quotedAt": "2026-08-21T02:00:00Z" },
  "name": "Nguyễn Văn A", "phone": "0905 123 456", "email": "", "pickup": "KS Mường Thanh", "note": "",
  "turnstileToken": "…", "website": ""
}
```

Kiểm, theo thứ tự, dừng ở lỗi đầu tiên của mỗi trường (mọi thông điệp tiếng Việt):

| Trường | Luật |
|---|---|
| phương thức / nguồn | chỉ `POST`; `Origin` (nếu có) phải trùng `Host` của chính request (same-origin, nên bản `deploy:preview` trên host khác vẫn chạy), khác → 403; không CORS |
| `tourSlug`, `bookingRef` | `/^[a-z0-9-]{1,120}$/`; `tourTitle` ≤ 200 ký tự |
| `departDate` | `YYYY-MM-DD`; ≥ ngày mai và ≤ +365 ngày theo `Asia/Ho_Chi_Minh` |
| `pax` | số nguyên; `adult` 1–20; `child`/`senior`/`infant` 0–20; tổng ≤ 30 |
| `quoted` | số nguyên ≥ 0; `total` ≤ 1.000.000.000; server tính lại `Σ count × perPax` bằng đúng `quote.ts`, lệch `total` → 400 (kiểm nhất quán, **không** phải tin giá) |
| `name` | 2–80 ký tự sau khi cắt khoảng trắng |
| `phone` | bỏ mọi ký tự không phải số; `+84`/`84` đầu → `0`; phải khớp `/^0\d{9,10}$/`; lưu dạng đã chuẩn hoá |
| `email` | tuỳ; nếu có: ≤ 120, khớp biểu thức email đơn giản |
| `pickup` ≤ 200, `note` ≤ 1000 | cắt khoảng trắng hai đầu |
| `website` (honeypot) | phải rỗng; **không rỗng → trả 200 `{ok:true, code:"TD-…"}` giả, không lưu, không báo** (không mách bot) |
| `turnstileToken` | `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` với `TURNSTILE_SECRET_KEY`; không đạt → 400 "Xác minh không thành công, thử lại"; **cổng cấu hình chạy TRƯỚC mọi tác dụng phụ** — thiếu `TURNSTILE_SECRET_KEY` mà không có `BOOKING_ALLOW_NO_TURNSTILE === '1'` → **503**, không đọc thân yêu cầu, không chạm D1, không gọi mạng; nhánh "bỏ qua kiểm, ghi `console.warn` một lần" chỉ còn tồn tại **khi có cờ dev đó** (xem `DR-064`, `docs/DRIFT_LOG.md`) |
| tần suất | cùng `ip_hash` có ≥ 5 đơn trong 10 phút → 429 "Bạn vừa gửi nhiều yêu cầu, vui lòng thử lại sau ít phút" |
| trùng | cùng `phone` + `tour_slug` + `depart_date` trong 24 giờ → **không tạo mới**, trả 200 `{ok:true, code:<mã cũ>, duplicate:true}`, không báo lại |

Mã đơn: `TD-` + `yymmdd` (giờ Việt Nam) + `-` + 4 ký tự từ bảng `ABCDEFGHJKMNPQRSTUVWXYZ23456789`
(bỏ 0/O/1/I/L); cột `code` UNIQUE; trùng thì sinh lại, tối đa 5 lần.

Trả về: `201 {ok:true, code, summary}`; `400 {ok:false, error:"validation", fields:{tên_ô:"thông điệp"}, message}`;
`403`, `405`,
`413 {ok:false, message:"Dữ liệu gửi lên quá lớn"}` (thân yêu cầu vượt 16 KB — hai lớp kiểm trong
`readBody`: `content-length` rồi byte thật của thân; có từ trước lượt sửa 503 bên dưới, không
phải phần mới), `429`,
`500 {ok:false, message:"Chưa gửi được, vui lòng thử lại hoặc nhắn Zalo"}`,
`503 {ok:false, message:"Chưa gửi được, vui lòng thử lại hoặc nhắn Zalo"}` (cổng cấu hình thiếu
`TURNSTILE_SECRET_KEY`, chạy trước `readBody` — xem hàng `turnstileToken` ở trên và `DR-064`).
Nếu `Accept` không có `application/json` (form gửi không JS): trả **trang HTML tối giản**
cùng nội dung (tên site, mã đơn hoặc thông điệp lỗi, nút Zalo, liên kết về tour) —
không tạo trang tĩnh `/cam-on/` nào, không đụng sitemap.

Đầu vào JSON giới hạn 16 KB. `quoted.quotedAt` là thời điểm **build** (ISO), nướng trong
`data-*` của form — để biết đơn nhìn bảng giá vintage nào. `ip_hash` = SHA-256 của
`CF-Connecting-IP` + muối là `TURNSTILE_SECRET_KEY` (thiếu secret, chỉ ở dev, thì muối là
chuỗi cố định `dev`); không lưu IP thô. `user_agent` cắt 200 ký tự.

### 4.5 D1: cơ sở `tourdao-booking`, bảng `booking`

`migrations/0001_booking.sql` (thư mục `migrations/` ở gốc, `wrangler d1 migrations`):

```sql
CREATE TABLE booking (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT NOT NULL UNIQUE,        -- TD-yymmdd-XXXX
  created_at    TEXT NOT NULL,               -- ISO 8601 UTC
  tour_slug     TEXT NOT NULL,
  tour_title    TEXT NOT NULL,
  booking_ref   TEXT,
  depart_date   TEXT NOT NULL,               -- YYYY-MM-DD
  pax_json      TEXT NOT NULL,               -- {"adult":2,"child":1,...}
  quoted_json   TEXT NOT NULL,               -- {"perPax":{...},"total":1450000,"quotedAt":"..."}
  customer_name TEXT NOT NULL,
  phone         TEXT NOT NULL,               -- đã chuẩn hoá 0xxxxxxxxx
  email         TEXT,
  pickup        TEXT,
  note          TEXT,
  lang          TEXT NOT NULL DEFAULT 'vi',
  source        TEXT NOT NULL DEFAULT 'web',
  status        TEXT NOT NULL DEFAULT 'new', -- new | contacted | confirmed | cancelled
  notify_email  TEXT,                        -- sent | failed:<lý do> | skipped
  notify_zalo   TEXT,
  ip_hash       TEXT,
  user_agent    TEXT
);
CREATE INDEX idx_booking_created ON booking(created_at);
CREATE INDEX idx_booking_phone   ON booking(phone);
```

`status` đổi bằng tay (`wrangler d1 execute` hoặc dashboard) ở v1. Không có bảng thứ hai.

### 4.6 Báo tin: hai notifier, hỏng không hỏng đơn

`src/lib/booking/notify/index.ts` khai giao diện `Notifier { name; send(booking): Promise<'sent'|'skipped'|{failed:string}> }`.
Endpoint gọi `ctx.waitUntil(Promise.allSettled([...]))` **sau khi** đã INSERT và đã trả
201, rồi `UPDATE booking SET notify_email=?, notify_zalo=?`. Thiếu secret của kênh nào thì
kênh đó `skipped`, không ném lỗi.

- **`SesNotifier`** (`QĐ-2026-08-22-07`; spec gốc ghi `ResendNotifier`) — `POST
  https://email.{AWS_SES_REGION}.amazonaws.com/v2/email/outbound-emails`, thân JSON dạng
  `Content.Simple`: `Subject.Data`, `Body.Text.Data`, `Body.Html.Data` (charset `UTF-8`),
  `FromEmailAddress: "Tour Đảo <dat-tour@tourdao.vn>"` (tên miền phải verify ở SES),
  `Destination.ToAddresses: BOOKING_NOTIFY_EMAIL` tách dấu phẩy, `ReplyToAddresses`: email khách
  nếu có. Tiêu đề: `[Đặt tour] TD-260905-7K3Q · Tour 3 đảo · 05/09/2026 · 3 khách`. Thân: văn bản
  thuần + HTML đơn giản, đủ mọi trường và tạm tính.
- **Ký SES: `notify/sigv4.ts` tự viết, không dependency.** SES không nhận API key đơn giản; mọi
  lời gọi phải ký AWS Signature V4. Một hàm thuần `signRequest({ method, url, headers, body,
  accessKeyId, secretAccessKey, region, service, now })` → trả về headers đã có `Authorization`,
  `x-amz-date`, `x-amz-content-sha256`. Dựng bằng `crypto.subtle` (HMAC-SHA256 + SHA-256) có sẵn
  trong Workers. Tất định theo `now` nên kiểm được bằng vector cố định — xem §5. Lý do không dùng
  `aws4fetch`: `ADR-0027` quyết định 5 cấm dependency runtime mới; đổi ý thì phải sửa ADR trước.
- **`ZaloBotNotifier`** — `POST https://bot-api.zaloplatforms.com/bot{ZALO_BOT_TOKEN}/sendMessage`
  (tên miền theo tài liệu chính thức `bot.zapps.me/docs`; SDK cộng đồng còn dùng
  `bot-api.zapps.me` — khai base URL thành một hằng số để đổi được một chỗ), body JSON
  `{chat_id, text}`, gửi tới **từng** `chat_id` trong `ZALO_BOT_CHAT_IDS`
  (danh sách phân tách dấu phẩy). Tin ngắn ≤ 1.000 ký tự, cùng nội dung tiêu đề email cộng
  SĐT và điểm đón. Bot tạo qua OA "Zalo Bot Manager" trong ứng dụng Zalo; nhân viên mở bot
  và nhắn một tin, rồi `getUpdates` để đọc `chat_id` (việc một lần, §6).
  **Điểm phải xác minh khi bắt tay làm** (tài liệu công khai không nói): bot có gửi vào
  nhóm không, giới hạn tần suất. Nếu không gửi nhóm được thì gửi từng người — thiết kế đã
  là danh sách `chat_id` nên không đổi mã.
- **Cố ý chưa có:** gửi lại khi hỏng, ZNS xác nhận cho khách, email bản sao cho khách.
  Ghi ở §8. Đơn "chưa báo được" vẫn truy vấn được: `SELECT code FROM booking WHERE notify_email NOT IN ('sent') AND notify_zalo NOT IN ('sent')`.

### 4.7 Bí mật và cấu hình

| Tên | Loại | Ở đâu | Dùng cho |
|---|---|---|---|
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_REGION` | secret | `wrangler secret put` | ký SigV4 và chọn điểm cuối SES; thiếu một trong ba → kênh email `skipped` (`QĐ-2026-08-22-07`; spec gốc ghi `RESEND_API_KEY`) |
| `BOOKING_NOTIFY_EMAIL` | secret (để khỏi vào repo, đổi không cần deploy) | `wrangler secret put` | hộp thư nhận đơn, một hoặc nhiều địa chỉ phân tách dấu phẩy — **kênh nội bộ**, tách khỏi `siteSettings.contact.email` là kênh công khai; hai địa chỉ có thể trùng |
| `ZALO_BOT_TOKEN`, `ZALO_BOT_CHAT_IDS` | secret | `wrangler secret put` | Zalo Bot |
| `TURNSTILE_SECRET_KEY` | secret | `wrangler secret put` | siteverify |
| `IP_HASH_SALT` | secret | `wrangler secret put` | muối băm IP cho bộ đếm tần suất. **Không có trong spec gốc** — sinh từ phán xét F4 vòng review Task 8: dùng chung `TURNSTILE_SECRET_KEY` làm muối là tái dụng bí mật sai mục đích. Thiếu thì `ipHash = null` (mất đếm tần suất ở dev, không băm bằng muối đoán được) |
| `PUBLIC_TURNSTILE_SITE_KEY` | biến build (công khai) | `.env` máy dev và biến build Cloudflare | widget; thiếu lúc build → `BookingForm` không render widget và `astro build` in một dòng cảnh báo; production **phải** có cả site key lẫn secret. Hai đường hỏng khác nhau, **cả hai đều ồn ào, không cái nào hỏng câm** (`DR-064`): thiếu **secret** → cổng cấu hình chặn ngay, mọi đơn bị **503**, không đọc thân, không chạm D1, không gọi mạng; thiếu **site key** mà vẫn có secret → widget không render nên client không gửi token, mọi đơn bị **400** `missing-token` |
| `BOOKING_DB` | binding D1 | `wrangler.toml` | bảng `booking` |

Cục bộ: `.dev.vars` (thêm vào `.gitignore`) cho `astro dev` và vitest; `platformProxy` của
adapter (bật mặc định ở v12) cấp D1 cục bộ cho `astro dev`. **Không** khai `[vars]` nào trong
`wrangler.toml` — giữ đúng lớp phòng thủ `--env-file /dev/null` ở `QĐ-2026-08-14-02`.

`wrangler.toml` sau spec:

```toml
name = "tourdaovn"
main = "./dist/_worker.js/index.js"
compatibility_date = "2026-06-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "./dist"
binding = "ASSETS"
not_found_handling = "404-page"

[[d1_databases]]
binding = "BOOKING_DB"
database_name = "tourdao-booking"
database_id = "<điền sau khi wrangler d1 create>"
migrations_dir = "migrations"

[build]
command = "npm run build:ci"
```

Kiểu `Env` cho `locals.runtime.env`: khai tay `interface Env` toàn cục trong `src/env.d.ts`, kiểu
`D1Database` lấy bằng `import type` từ `@cloudflare/workers-types` (thêm làm devDependency).
**Không** dùng `wrangler types`: runtime types nó sinh ra xung đột với lib DOM mà Astro đang bật;
adapter cũng chỉ `import type` từ workers-types (`dist/utils/handler.d.ts`). Chỉ **tên** binding/secret,
không giá trị. (Sửa 2026-08-22 khi lập kế hoạch; thay cho câu "chạy `wrangler types`" ở bản đầu.)

### 4.8 Xem và quản lý đơn (v1)

Email + Zalo là hộp thư đến; D1 là sổ. Xem bằng dashboard Cloudflare → D1 → `tourdao-booking`,
hoặc `npx wrangler d1 execute tourdao-booking --remote --command "SELECT code, created_at, tour_title, depart_date, customer_name, phone, status FROM booking ORDER BY id DESC LIMIT 50"`.
Xuất sao lưu: `npx wrangler d1 export tourdao-booking --remote --output backups/booking-YYYY-MM-DD.sql`
(`backups/` đã trong `.gitignore`). Trang quản trị sau Cloudflare Access là **nợ** (§8).

### 4.9 Dữ liệu cá nhân

Tên, SĐT, email, điểm đón chỉ nằm ở D1 và trong hai tin báo. **Không** vào log Worker
(`console.log` chỉ in mã đơn và trạng thái báo tin), không vào Sanity, không vào
`prices.yaml`, không vào repo. IP chỉ lưu dạng băm có muối. Lưu **24 tháng**; job dọn tự
động là nợ (§8), tới lúc đó dọn tay bằng một câu `DELETE` theo `created_at`. Sao lưu D1
theo `playbook/governance/policies/security.md` ("sao lưu định kỳ, thử phục hồi một lần").

### 4.10 Chống lạm dụng, ba lớp

1. **Turnstile** (cùng nhà Cloudflare, miễn phí, không tài khoản mới) — bắt buộc ở production.
2. **Honeypot + giới hạn tần suất trong endpoint** (§4.4) — lớp thứ hai, không phụ thuộc JS.
3. **Luật WAF Rate Limiting** trên `/api/dat-tour` (10 yêu cầu / 10 giây / IP; gói miễn phí
   có 1 luật) — lớp hạ tầng, cấu hình tay ở dashboard, ghi ở runbook §6.

Đánh đổi ghi thẳng: không JS thì **không gửi được** (Turnstile cần JS). Form vẫn hiện và
`<noscript>` chỉ sang Zalo / hotline. Chấp nhận vì đây là lớp chặn bot thật, và kênh thay
thế luôn có.

### 4.11 Luật mới và luật sửa (ghi vào `04-CONSTRAINTS`)

| Mã | Luật | Kiểm | Mức |
|---|---|---|---|
| PY2 (sửa) | thêm hình dạng `paxRates` theo §4.2 luật 1 | `py1-py8.ts` | fail |
| PY7 (sửa) | danh sách khoá perPax thêm `paxRates`; khoá con enum đóng; `amount` hạng phụ ≥ 0 | `py1-py8.ts` | fail |
| BK1 | endpoint và form **không đọc giá lúc runtime**: `src/pages/api/dat-tour.ts` và `src/lib/booking/*` không import `src/lib/prices.ts`, `src/lib/sanity.ts`, `src/lib/resolver.ts`; client không `fetch` giá | `grep` trong QA2 + review | fail |
| BK2 | endpoint **không ghi** Sanity, không ghi `prices.yaml`, không ghi file nào; chỉ ghi D1 | review; `wrangler secret list` không có token ghi Sanity | fail |
| BK3 | PII (tên, SĐT, email, điểm đón, ghi chú) chỉ ở D1 và hai tin báo; cấm `console.log` PII; cấm vào Sanity/`prices.yaml`/repo | review mã; `git grep` mẫu SĐT trong repo | fail |
| BK4 | bí mật chỉ ở `wrangler secret`; `wrangler.toml` không `[vars]`; `.dev.vars` và `.env*` gitignore | `git grep` tên biến kèm giá trị; `wrangler secret list` | fail |
| BK5 | tạm tính client và kiểm server dùng **một** hàm `quote.ts`; lệch thì 400 | vitest | fail |

`04-CONSTRAINTS` §2 điều cấm 3 ("trang không gọi API giá lúc runtime") giữ nguyên — endpoint
đặt tour **không phải** API giá; ghi chú một dòng để người đọc sau không tưởng là nới.

### 4.12 Bản đồ file

| File | Việc |
|---|---|
| `data/prices.yaml` | (dữ liệu) dòng giá tour thật có `paxRates` — **chủ dự án nhập** |
| `src/lib/types.ts`, `scripts/lib/price-loader.ts` | biến thể `PriceEntry` có `paxRates`; `PaxCode`, `PaxRate` |
| `scripts/validators/py1-py8.ts` | PY2, PY7 theo §4.2 |
| `src/lib/booking/quote.ts` | **mới** — tính dòng và tạm tính từ `{amount, paxRates}` hoặc `tiers` + `pax`; thuần, dùng cả client lẫn server |
| `src/lib/booking/schema.ts` | **mới** — kiểu payload, `validateBooking()` thuần theo §4.4, chuẩn hoá SĐT |
| `src/lib/booking/code.ts` | **mới** — sinh mã đơn |
| `src/lib/booking/store.ts` | **mới** — INSERT/SELECT D1 (prepared statement, tham số hoá) |
| `src/lib/booking/notify/{index,resend,zalo}.ts` | **mới** — §4.6 |
| `src/lib/booking/handler.ts` | **mới** — `handleBooking(request, env, ctx)`: toàn bộ luồng §4.4, không phụ thuộc Astro để test được |
| `src/pages/api/dat-tour.ts` | **mới** — `prerender = false`; 5 dòng gọi `handleBooking` |
| `src/components/BookingForm.astro` | **mới** — §4.3 |
| `src/components/TourDetail.astro` | thay `BookingCTA` bằng `BookingForm` khi có giá; truyền `paxRates`/`tiers`, `contact`, `title`, `slug`, `bookingRef`; thanh dính trỏ `#dat-tour` |
| `src/components/DetailLayout.astro` | bỏ `target="_blank"` khi `ctaHref` là neo `#` |
| `src/components/Sidebar.astro` | kiểu `Slot.component` thêm `'BookingForm'` |
| `src/lib/uiCopy.ts` | nhãn §4.3 |
| `src/env.d.ts` | khai `interface Env` toàn cục (binding D1 + 5 secret) |
| `wrangler.toml` | §4.7 |
| `migrations/0001_booking.sql` | §4.5 |
| `.gitignore` | `.dev.vars` |
| `package.json`, `vitest.config.ts` | `vitest` ^4.1, `@cloudflare/vitest-pool-workers` ^0.22, `@cloudflare/workers-types` (dev); script `test` |
| `test/booking/*.test.ts`, `test/setup/apply-migrations.ts`, `test/env.d.ts`, `scripts/validators/__tests__/py-paxrates.test.ts` | §5 — `test/` ở gốc, ngoài `include` của `tsconfig.json` nên `astro check` không quét |
| `docs/core-specs/02-SAD.md` | §1 §2 §4 §5 thêm container và dòng dữ liệu đơn |
| `docs/core-specs/04-CONSTRAINTS.md` | §1b PY2/PY7; §1d BK1–BK5; §4 bảo mật |
| `docs/core-specs/06-BINDING_MAP.md` | §4.8 thêm vùng "Form đặt tour" |
| `docs/core-specs/00-PROJECT_BRIEF.md` | ghi chú §3 §5: thêm kênh form, Zalo vẫn là kênh phụ |
| `docs/adr/ADR-0027-module-dat-tour.md`, `docs/adr/README.md` | ADR và mục lục |
| `docs/DECISIONS.md` | `QĐ-2026-08-21-01` |
| `BUILD-NOTES.md` | mục "Module đặt tour — việc một lần" (chép §6 khi thi hành) |

**Không chạm:** `cms/` (không field Sanity mới → **không** deploy Studio), `01-CONTENT_MODEL`,
`05-URL_MAP` (không URL mới trong sitemap; `/api/*` không phải trang), `site.config.ts` `nav`.

## 5. Kiểm thử

Dựng hạ tầng test tối thiểu ở gốc repo: `vitest` + `@cloudflare/vitest-pool-workers`
(D1 chạy trong miniflare; `applyD1Migrations` trong setup). Test đặt ở thư mục `test/` gốc
(ngoài `include` của `tsconfig.json`); cấu hình vitest **không** trỏ `wrangler.toml` (vì `main`
của nó chỉ có sau khi build) mà khai thẳng binding D1 và cờ tương thích. Đây là dependency dev mới, được
phép theo ADR-0027. Test gọi thẳng `handleBooking()` với `env.BOOKING_DB` từ `cloudflare:test`,
không cần build Astro; `fetch` ra SES/Zalo/Turnstile được **stub** trong test.

| Nhóm | Ca bắt buộc |
|---|---|
| `quote.ts` | 2 người lớn + 1 trẻ em (550k/350k) = 1.450.000; hạng không có giá không tính; `tiers` chọn đúng bậc; vượt bậc → null |
| `schema.ts` | SĐT `0905 123 456`, `+84905123456`, `84905123456` → `0905123456`; `0123` → lỗi; ngày hôm nay → lỗi; ngày +366 → lỗi; adult 0 → lỗi; tổng 31 → lỗi; `total` lệch → lỗi; mọi thông điệp tiếng Việt |
| `code.ts` | đúng định dạng; 1.000 mã không chứa `0 O 1 I L` |
| `handler.ts` | hợp lệ → 201 + dòng D1; honeypot → 200 giả, không dòng; Turnstile hỏng → 400; 6 đơn/10 phút cùng IP → 429; trùng phone+tour+ngày → trả mã cũ, không INSERT; notifier ném lỗi → vẫn 201, cột `notify_*` = `failed:…`; `Accept: text/html` → HTML |
| `sigv4.ts` | vector kiểm cố định của AWS (`aws-sig-v4-test-suite`, khoá `AKIDEXAMPLE`): cùng đầu vào → đúng chuỗi `Authorization` đã biết; đổi một byte thân → đổi chữ ký; `now` cố định nên tất định |
| `ses.ts` | đủ ba khoá → `sent` khi 200, `failed:http 403` khi 403; thiếu `AWS_SECRET_ACCESS_KEY` → `skipped` và **không** gọi mạng; thân JSON đúng hình dạng `Content.Simple` |
| `py1-py8` | `paxRates` hợp lệ → xanh; `paxRates.baby` → PY7 fail; `paxRates` cùng `tiers` → PY2 fail; `child.amount: -1` → PY7 fail; **`DR-061`:** tour có `bookingRef.key` trỏ đúng dòng giá → PY4 **không** báo mồ côi và PY5 **không** báo thiếu |

## 6. Vận hành: việc một lần (chép vào `BUILD-NOTES.md` khi thi hành)

1. `npx wrangler d1 create tourdao-booking` → dán `database_id` vào `wrangler.toml`.
2. `npx wrangler d1 migrations apply tourdao-booking --remote`.
3. Amazon SES (`QĐ-2026-08-22-07`; spec gốc ghi Resend): tên miền `tourdao.vn` đã verify sẵn.
   Xác nhận tài khoản đã **ra khỏi sandbox** (trong sandbox SES chỉ gửi được tới địa chỉ đã
   verify — nếu chưa ra thì verify luôn địa chỉ trong `BOOKING_NOTIFY_EMAIL`). Tạo IAM user chỉ
   có quyền `ses:SendEmail` → `wrangler secret put AWS_ACCESS_KEY_ID`,
   `wrangler secret put AWS_SECRET_ACCESS_KEY`, `wrangler secret put AWS_SES_REGION` (vùng đã
   verify tên miền, ví dụ `ap-southeast-1`); `wrangler secret put BOOKING_NOTIFY_EMAIL`.
4. Zalo: trong ứng dụng Zalo tìm OA **Zalo Bot Manager** → "Create bot" → nhận token qua
   tin nhắn → `wrangler secret put ZALO_BOT_TOKEN`. Mỗi nhân viên trực mở bot, nhắn một
   tin; chạy `GET https://bot-api.zaloplatforms.com/bot<TOKEN>/getUpdates` đọc `chat_id` →
   `wrangler secret put ZALO_BOT_CHAT_IDS` (phân tách dấu phẩy).
5. Turnstile: dashboard Cloudflare → Turnstile → thêm site `tourdao.vn` (managed) → site key
   vào `.env` và biến build Cloudflare (`PUBLIC_TURNSTILE_SITE_KEY`), secret →
   `wrangler secret put TURNSTILE_SECRET_KEY`.
5b. `wrangler secret put IP_HASH_SALT` — một chuỗi ngẫu nhiên đủ dài, sinh tại chỗ
   (`openssl rand -hex 32`), không dùng lại bí mật nào khác.
6. WAF: Security → Rate limiting rules → `/api/dat-tour`, 10 yêu cầu / 10 giây / IP, chặn.
7. `npm run deploy:preview` → gửi một đơn thật theo §7 → `npm run deploy`.

Mọi lệnh `wrangler` giữ tiền tố `env -u CLOUDFLARE_API_TOKEN -u CF_API_TOKEN` như script
deploy (`QĐ-2026-08-14-02`). Cấm `wrangler secret put` từ file chứa giá trị; gõ tay khi được hỏi.

## 7. Tiêu chí nghiệm thu

Kiểm được, đặt ra trước khi thi công. Im lặng là trượt.

1. `npm run build` xanh; `astro check` 0 errors; `npm test` xanh (mọi ca §5).
2. Tour **có** giá: HTML trong `dist/` có `<form id="dat-tour">`, đủ bộ đếm theo đúng số hạng
   trong `paxRates` (+ người lớn), nút Zalo chỉ khi có `zaloUrl`. Tour **không** giá: không
   có form, `ContactChannels` y hệt trước spec.
3. Trên trình duyệt: 2 người lớn + 1 trẻ em với 550.000/350.000 → "Tạm tính 1.450.000₫";
   bộ đếm không xuống dưới 1 người lớn, không vượt 20/hạng, 30/đơn.
4. Gửi một đơn hợp lệ trên bản `deploy:preview`: nhận 201 và mã `TD-yymmdd-XXXX`; D1 có đúng
   một dòng; email tới hộp thư cấu hình trong 1 phút; tin Zalo tới bot trong 1 phút.
5. Thiếu SĐT → 400 kèm lỗi tiếng Việt dưới ô; điền honeypot → 200 và **không** có dòng D1;
   gửi 6 đơn trong 10 phút cùng IP → lần 6 nhận 429; gửi lại cùng SĐT/tour/ngày → nhận lại
   mã cũ, D1 không thêm dòng.
6. Tắt JavaScript: thấy dòng `<noscript>` kèm Zalo/hotline; bấm gửi nhận trang HTML báo
   lỗi có nút Zalo. `curl -I https://tourdao.vn/khong-ton-tai/` vẫn 404 trang riêng (`main`
   không phá `not_found_handling`).
7. BK1: `grep -l "lib/prices\|lib/sanity\|lib/resolver" src/pages/api src/lib/booking` rỗng.
   BK4: `git grep -n "re_\|ZALO_BOT_TOKEN=\|TURNSTILE_SECRET_KEY="` rỗng; `wrangler secret list`
   phải là **đúng 8 tên sau, không thừa không thiếu** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
   `AWS_SES_REGION`, `BOOKING_NOTIFY_EMAIL`, `ZALO_BOT_TOKEN`, `ZALO_BOT_CHAT_IDS`,
   `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT`). "5 tên" là con số của bản spec đầu, trước khi
   `QĐ-2026-08-22-07` đổi một khoá nhà cung cấp email thành ba biến `AWS_*` và trước khi F4 tách
   `IP_HASH_SALT` ra. **`BOOKING_ALLOW_NO_TURNSTILE` không được có mặt trong danh sách này** — nó
   là cửa thoát chỉ dành cho dev (`.dev.vars`), và nếu lọt vào `wrangler secret list` nghĩa là ai
   đó đã đặt nó trên production, vô hiệu hoá cổng cấu hình 503 mà `DR-064` ghi lại. Đây là cổng
   máy DUY NHẤT canh được rủi ro đó — ba lớp bảo vệ còn lại chỉ là chữ trong chú thích.
8. Lighthouse mobile trang tour có form: performance ≥ 90, accessibility ≥ 95 (`04` §3).
9. `npm --prefix scripts run validate` (hoặc gọi tay `py1-py8`) với `prices.yaml` có
   `paxRates` → xanh; thêm khoá lạ → fail đúng mã PY7.
10. `npm run audit:spec` không đỏ hơn baseline (G1/G3/G4).
11. **`_worker.js` không lộ ra ngoài.** `curl -I https://<preview>/_worker.js/index.js` phải
    trả **404** (kiểm luôn `/_routes.json`). `public/.assetsignore` đã loại hai đường dẫn này
    khỏi lần tải asset lên, nhưng tới trước tiêu chí này **không có cổng nào canh việc đó còn
    đúng** — một lần đổi adapter hay đổi `directory` của `[assets]` là mã Worker thành asset
    tĩnh tải về được, kèm mọi thứ nướng trong đó.
12. **`_redirects` còn hiệu lực sau khi `wrangler.toml` có `main`.** Luật **R3** của
    `04-CONSTRAINTS` §1c (URL đã từng tồn tại không được biến mất câm) đứng hoàn toàn trên file
    này, mà từ ADR-0027 site có Worker chạy trước asset — phải chứng minh Worker không nuốt mất
    nó. Cách kiểm: thêm một dòng thử vào `public/_redirects`
    (`/kiem-redirect-tam  /  301`), `npm run deploy:preview`,
    `curl -sI https://<preview>/kiem-redirect-tam` phải trả **301** kèm `location: /`, rồi
    **gỡ dòng đó ra** và deploy lại. Không để dòng thử ở lại.
13. **Bốn hạng mục phải kiểm trên trình duyệt thật** (Task 12 không kiểm được vì extension
    không kết nối; chúng nằm trong mục "điều còn lo ngại" của báo cáo task đó, chỗ không ai đọc
    lại, nên đưa lên đây thì mới thành cổng):
    a. **Bấm bộ đếm số người** — dấu +/− đổi số thật, không xuống dưới 1 người lớn, không vượt
       20 mỗi hạng, không vượt 30 một đơn, và dòng "Tạm tính" đổi theo ngay.
    b. **Mở bước 2 và đưa tiêu điểm** — bấm "Đặt tour" thì phần thông tin khách hiện ra và
       tiêu điểm nhảy vào ô Họ và tên; bấm "Quay lại" thì tiêu điểm về đúng nút "Đặt tour".
    c. **Giao diện ≤ 640px** — trên bề rộng 360px và 640px: không tràn ngang, bộ đếm không vỡ
       hàng, nút bấm đủ lớn để chạm, thanh dính không che nút gửi.
    d. **Tắt JavaScript bằng DevTools** — thấy dòng `<noscript>` kèm Zalo/hotline; bấm gửi thì
       nhận **trang HTML** báo lỗi có nút Zalo (không phải JSON thô, không phải trang trắng).
14. **Xoá dòng đơn thử khỏi D1 production sau khi nghiệm thu.** `npm run deploy:preview` dùng
    **chung D1 thật** — không có cơ sở riêng cho bản thử — nên mọi đơn gửi ở mục 4 và mục 5 là
    dòng thật trong bảng `booking`. Xong nghiệm thu thì xoá theo mã đơn đã ghi lại:

    ```
    env -u CLOUDFLARE_API_TOKEN -u CF_API_TOKEN npx wrangler d1 execute tourdao-booking \
      --remote --env-file /dev/null --command "DELETE FROM booking WHERE code IN ('TD-…','TD-…')"
    ```

    Rồi `SELECT COUNT(*) FROM booking` phải về **0** trước khi mở cho khách thật. Xoá theo mã,
    **không** `DELETE FROM booking` trần.

## 8. Còn nợ (ghi để không rơi)

- **ZNS xác nhận cho khách** và **email bản sao cho khách** — cần OA xác thực và mẫu tin;
  pha 2, có thể thêm như một `Notifier` thứ ba không đổi luồng.
- **Trang quản trị đơn** (danh sách, đổi `status`) sau Cloudflare Access — v1 dùng dashboard/`wrangler`.
- **Gửi lại khi báo tin hỏng** — v1 chỉ ghi trạng thái; truy vấn đơn chưa báo được ở §4.6.
- **Job dọn dữ liệu 24 tháng** (Cron Trigger) — v1 dọn tay.
- **Zalo Bot gửi nhóm / giới hạn tần suất** — xác minh ở task đầu của kế hoạch; nếu khác giả
  định thì ghi `DRIFT_LOG`.
- **`control-registry.yaml`** chưa có dòng cho BK1–BK5 (kiểm bằng review/grep, không có
  executor script); thêm khi có kiểm máy.
- **Lịch khởi hành cố định**, **mã tour hiển thị**, **đa ngôn ngữ cho form** — ngoài phạm vi
  theo ba quyết định §3; mở lại là quyết định mới.
- **Nhãn `zh`/`ko`/`ru` của form đang chép nguyên tiếng Anh** (kiểu `Record<UIKey,string>` buộc đủ
  khoá; site chạy `langs = ['vi']`). Dịch khi mở ngôn ngữ mới.
- **Phối hợp với audit giao diện vòng 4** (`docs/plans/2026-08-21-audit-va-ke-hoach-giao-dien-vong-4.md`,
  đang chờ duyệt cùng ngày): DR-033 (sidebar dính bị header và thanh dính che) và DR-036
  (CTA dự phòng trang tour) chạm đúng `Sidebar.astro`, `DetailLayout.astro`, `TourDetail.astro`.
  Hai luồng sửa cùng file phải **nối tiếp**, không song song; luồng nào vào sau rebase lên
  luồng trước.
