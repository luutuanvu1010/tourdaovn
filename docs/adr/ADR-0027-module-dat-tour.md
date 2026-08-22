# ADR-0027 — Module đặt tour: container runtime đầu tiên, và giá theo hạng khách

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
Quyết định RIÊNG của tourdaovn về việc mở đường ghi lúc runtime. Cơ chế tái dùng được cho
mọi site: (1) tách ba lớp "nội dung (Sanity) / giá (prices.yaml) / đơn (D1)" và không cho
lớp nào ghi chéo; (2) endpoint nhận đơn không đọc giá lúc runtime, chỉ lưu giá tham khảo;
(3) báo tin là notifier cắm thêm, hỏng không hỏng đơn; (4) `paxRates` là khuôn giá theo
hạng khách cho perPax. Kênh báo cụ thể (Resend, Zalo Bot) và ba hạng khách là của site này.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** **accepted** — thiết kế duyệt trong phiên 2026-08-21, toàn văn phê chuẩn
  2026-08-22 (xem `QĐ-2026-08-21-01`)
- **Ngày:** soạn 2026-08-21, phê chuẩn 2026-08-22   **Người phê chuẩn:** Lưu Tuấn Vũ (chủ dự án)
- **Loại quyết định:** cửa **một chiều** ở ba điểm: mở container runtime (endpoint + D1);
  đổi hình dạng lược đồ `prices.yaml` (thêm `paxRates`); `wrangler.toml` có `main`. Cửa hai
  chiều ở giao diện form và kênh báo tin.
- **Supersedes:** `ADR-0007` **phần lược đồ `perPax`** (bổ sung `paxRates`); phần còn lại của
  ADR-0007 (nguồn giá là `prices.yaml`, hai trigger build) giữ nguyên hiệu lực.
- **Liên quan:** `ADR-0001` (stack), `ADR-0003` (seam giá một chiều), `ADR-0021`,
  `ADR-0023`, `00-PROJECT_BRIEF` §3 §5, `01-CONTENT_MODEL` §2.8 §5.2, `02-SAD` §1 §2 §4,
  `04-CONSTRAINTS` §1b §1d §2 §4, `06-BINDING_MAP` §4.8,
  `docs/specs/SPEC-2026-08-21-dat-tour.md`

## Bối cảnh

Site là một hệ **đọc nhiều, ghi không**: Sanity đọc lúc build bằng token chỉ đọc, giá đọc
từ `data/prices.yaml` lúc build, Worker chỉ phục vụ asset tĩnh (`wrangler.toml` không có
`main`). `00-PROJECT_BRIEF` §3 chốt "đặt chỗ qua Zalo, không giỏ hàng, không thanh toán".
`02-SAD` §1 đã để sẵn một ô "Booking đầy đủ (tương lai)", cửa một chiều.

Chủ dự án yêu cầu (2026-08-21) một **form đặt tour đơn giản** trên trang chi tiết Tour:
chọn ngày, số người theo hạng, tạm tính, để lại tên và số điện thoại; công ty nhận đơn qua
**email và Zalo**; có bản ghi gốc. Bốn quyết định đầu vào chủ dự án chốt cùng ngày: đơn
về email + Zalo, bản ghi ở D1; ngày khởi hành bất kỳ (tour chạy hằng ngày); ba hạng khách
người lớn / trẻ em / người cao tuổi; chỉ trang chi tiết Tour.

Ba thứ ép phải quyết bằng ADR chứ không thể chỉ viết spec:

1. Đây là **đường ghi đầu tiên lúc runtime** của hệ — một container mới theo C4, và `main`
   vào `wrangler.toml` đổi cách phát hành (GOVERNANCE 3.2).
2. Giá theo hạng khách **không có chỗ** trong lược đồ `prices.yaml` hiện hành; PY2/PY7 khoá
   chặt danh sách khoá; `05-URL_MAP` §4 nói đổi hình dạng là cửa một chiều, ADR mới.
3. Dữ liệu khách là **PII** — phải chốt nó sống ở đâu để không rơi vào Sanity (dataset công
   khai), `prices.yaml` (S2.8 cấm) hay bên thứ ba.

## Quyết định

1. **Mở container *Booking intake*** bằng một route on-demand của Astro,
   `src/pages/api/dat-tour.ts` (`prerender = false`), chạy trên **chính Worker hiện có**:
   `wrangler.toml` thêm `main = "./dist/_worker.js/index.js"` — file adapter
   `@astrojs/cloudflare` đã sinh sẵn ở mọi build — và `[assets] binding = "ASSETS"`. Mọi
   trang khác vẫn prerender tĩnh; asset vẫn được phục vụ trước.
2. **Bản ghi gốc ở Cloudflare D1** (`tourdao-booking`, bảng `booking`), không ở Sanity,
   không ở `prices.yaml`, không ở bên thứ ba. Đơn là *yêu cầu đặt*: không thanh toán,
   không giữ chỗ, nhân viên gọi lại xác nhận.
3. **Báo tin bằng hai notifier cắm thêm**: email qua Resend tới hộp thư công ty, và Zalo
   Bot API tới `chat_id` của nhân viên. Chạy sau khi đã lưu và đã trả lời khách
   (`ctx.waitUntil`); kênh hỏng ghi trạng thái vào dòng đơn, **không** làm hỏng đơn.
4. **Lược đồ giá thêm `paxRates`** cho `perPax` có `amount`: khoá con enum đóng
   `child | senior | infant`, mỗi khoá `{amount ≥ 0, note ≤ 40 ký tự}`; cấm kèm `tiers`.
   `amount` vẫn là giá người lớn, nhãn và JSON-LD không đổi. PY2/PY7 mở theo đúng hình dạng
   này, không mở hơn.
5. **Bốn bất biến thành luật máy kiểm** (`04-CONSTRAINTS` §1d BK1–BK5): endpoint và form
   không đọc giá lúc runtime (tạm tính từ số nướng lúc build, một hàm `quote.ts` dùng
   chung client/server); endpoint không ghi Sanity hay `prices.yaml`; PII chỉ ở D1 và tin
   báo, không log; bí mật chỉ ở `wrangler secret`, không `[vars]`.
6. **Chống lạm dụng ba lớp**: Turnstile (bắt buộc ở production), honeypot + giới hạn tần
   suất + chống trùng trong endpoint, luật WAF rate limiting trên `/api/dat-tour`. Đánh đổi
   chấp nhận: không JavaScript thì không gửi được, `<noscript>` chỉ sang Zalo/hotline.
7. **Dependency mới chỉ ở dev**: `vitest` + `@cloudflare/vitest-pool-workers` để test
   endpoint với D1 trong miniflare. Không dependency runtime mới — Resend, Zalo Bot,
   Turnstile gọi bằng `fetch` thuần.
8. **Brief §3/§5 bổ sung**, không đảo: Zalo vẫn là kênh tư vấn và kênh của menu "Đặt vé
   trực tuyến"; form là kênh đặt thêm trên trang Tour. Không giỏ hàng, không thanh toán.

## Lý do

- **Ba lớp dữ liệu, không lớp nào ghi chéo.** Nội dung ở Sanity (đọc lúc build), giá ở
  `prices.yaml` (đọc lúc build), đơn ở D1 (ghi lúc runtime). `01-CONTENT_MODEL` §5.2 tiêu
  chí 5 và §2.8 đã đặt "mặt đặt chỗ" ngoài Sanity từ bước 1; ADR này chỉ cho nó một chỗ ở
  thật thay vì để treo. Không có đường ghi nào mới vào hai lớp cũ, nên ba bất biến của seam
  giá (`02-SAD` §4) còn nguyên.
- **Dùng lại thứ đã có trước khi thêm thứ mới** (P11). Adapter đã sinh `_worker.js`; D1
  cùng tài khoản Cloudflare; Turnstile cùng nhà. Một route on-demand là mức tăng nhỏ nhất
  để có một endpoint, nhỏ hơn một Worker riêng hay một dịch vụ ngoài.
- **Bản ghi gốc tách khỏi kênh báo** vì kênh báo là thứ hỏng nhiều nhất (API hết hạn,
  token đổi, hộp thư đầy). Đơn phải sống sót kể cả khi cả hai kênh cùng chết; D1 là chỗ
  đó. Cùng triết lý "biến lỗi im lặng thành lỗi ồn ào" của `QĐ-2026-08-05-14`: đơn chưa báo
  được vẫn truy vấn ra được.
- **`paxRates` mở đúng một khe, không mở cửa.** Khoá con là enum đóng, chỉ đi cùng
  `amount`, không chạm `tiers`, không chạm nhãn hay JSON-LD. Validator vẫn fail với mọi
  khoá lạ — PY7 không yếu đi, chỉ biết thêm ba chữ.
- **Không đọc giá lúc runtime** là điều kiện để `04-CONSTRAINTS` §2 điều cấm 3 còn đúng
  nguyên văn. Tạm tính chỉ là con số khách nhìn thấy lúc build; server kiểm **nhất quán**
  (cùng hàm), không kiểm **đúng giá** — đúng giá là việc của nhân viên khi xác nhận, khớp
  bản chất "yêu cầu đặt".

## Phương án bị loại

| Phương án | Vì sao loại |
|---|---|
| **Worker riêng** `worker/index.ts` với `run_worker_first = ["/api/*"]` | cùng thiết kế dữ liệu nhưng thêm một entry build, lặp hằng số và nhãn; chủ dự án chọn dùng lại worker adapter đã sinh. Vẫn là đường lùi hợp lệ nếu route on-demand gây rắc rối cho `astro build` |
| **Document `booking` trong Sanity** để xem trong Studio | thêm `_type` là cửa một chiều chạm `04` §2.1 và họ validator I; cần token **ghi** ở runtime trong khi build chỉ có token đọc; dataset công khai lộ PII; trộn dữ liệu vận hành vào lớp nội dung — đúng điều `01` §5.2 tiêu chí 5 cấm |
| **Google Sheet qua Apps Script** | PII ra bên thứ ba, URL webhook là bí mật yếu, không mã đơn, không test được |
| **Dịch vụ form (Formspree, Tally…) / không backend** | không D1, không mã đơn, không Zalo Bot — trái câu trả lời 1 của chủ dự án; Zalo không hỗ trợ điền sẵn nội dung tin ổn định |
| **Telegram bot** thay Zalo | rẻ và chắc, nhưng chủ dự án chọn Zalo vì đó là kênh công ty đang dùng |
| **ZNS / Zalo OA gửi cho khách** ngay v1 | cần OA xác thực, duyệt mẫu tin, trả phí; tin tư vấn OA chỉ miễn phí trong 48 giờ tương tác — không hợp để báo cho nhân viên. Để pha 2 như một notifier thứ ba |
| **Thanh toán / đặt cọc online** | brief §3 §5 cấm; ngoài phạm vi |
| **Lịch khởi hành cố định** (như ảnh tham khảo) | chủ dự án chốt tour chạy hằng ngày; lịch cố định là dữ liệu booking thật, mở sau nếu cần |

## Hệ quả

- **Astro thành "hybrid" với đúng một route động.** `dist/_worker.js` từ nay được deploy.
  Nghiệm thu phải kiểm `not_found_handling` và trang 404 còn đúng sau khi có `main`.
- **Phát hành đổi cách**: `wrangler.toml` có `main` và binding D1; secret phải được đặt
  trước lần deploy đầu; `wrangler d1 migrations apply` là một bước mới trong runbook.
  Studio **không** đổi (không field Sanity mới).
- **Validator PY2/PY7, type `PriceEntry`** (cả `src/lib/types.ts` lẫn
  `scripts/lib/price-loader.ts`) phải cập nhật cùng lúc — hai bản chép tay, lệch là lỗi.
- **Nợ mở, DRI chủ dự án**: ZNS/email xác nhận cho khách; trang quản trị đơn sau Cloudflare
  Access; gửi lại khi báo tin hỏng; job dọn dữ liệu 24 tháng; dòng `control-registry` cho
  BK1–BK5 khi có kiểm máy; sao lưu D1 định kỳ và thử phục hồi một lần (`security.md`).
- **Một điểm chưa xác minh**: Zalo Bot có gửi vào nhóm không và giới hạn tần suất — tài liệu
  công khai không nói. Thiết kế gửi theo danh sách `chat_id` nên khác giả định cũng không
  đổi mã; ghi `DRIFT_LOG` nếu lệch.
- **Ranh giới không nới**: `00-PROJECT_BRIEF` §5 "không thanh toán, không giỏ hàng, không
  quản lý chỗ trống" còn nguyên. Ai muốn thêm tồn kho hay đặt cọc là quyết định mới, không
  phải mở rộng ADR này.

---

## Đính chính 2026-08-22 — kênh email là Amazon SES, không phải Resend (`QĐ-2026-08-22-07`)

Mục này không đảo quyết định nào; nó thay tên một nhà cung cấp và làm rõ ranh giới của
quyết định 7. Phần trên ở lại nguyên văn theo luật sổ chỉ-thêm (`04-CONSTRAINTS` §2.5).

**Quyết định 3 đọc lại là:** email qua **Amazon SES** (SES v2 HTTP API) tới hộp thư công ty.
Tên miền `tourdao.vn` đã verify ở SES từ trước, nên không mở thêm nhà cung cấp thứ hai chỉ
cho một luồng thư nội bộ. Hình dạng `Notifier` và luật "kênh hỏng ghi trạng thái, không hỏng
đơn" không đổi — chỉ thân request và cách xác thực đổi.

**Quyết định 7 vẫn giữ: không dependency runtime mới.** SES khác Resend ở chỗ không nhận API
key đơn giản; mọi lời gọi phải ký AWS Signature V4. Chữ ký được dựng bằng `crypto.subtle`
(HMAC-SHA256 + SHA-256) có sẵn trong Workers, trong một file thuần `notify/sigv4.ts`, chứ
**không** thêm `aws4fetch` hay SDK AWS nào. Câu "gọi bằng `fetch` thuần" trong quyết định 7
vì vậy vẫn đúng: vẫn là `fetch`, chỉ thêm header đã ký.

**Ranh giới của đính chính này.** Nếu SigV4 tự viết tỏ ra không đáng tin ở nghiệm thu Task 14,
đường lui là thêm `aws4fetch` — nhưng đó là **sửa quyết định 7**, cần một mục ADR mới, không
phải một dòng trong báo cáo task.
