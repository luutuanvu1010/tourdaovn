# QA1 — Mockup bước 7, đợt 4B — **VÒNG 3** (xác minh ngắn)

- **Ngày:** 2026-08-22
- **Vai:** QA độc lập (GOVERNANCE §2.1). Tác nhân này không soạn mockup và không soạn bản phản hồi đang kiểm.
- **Commit HEAD:** `e4e1d8a` — *"design: sua V1-V3 theo QA1 vong 2"* (vòng 2 kiểm ở `95560fd`, vòng 1 ở `dc0ac4c`)
- **Cổng:** QA1 (Design → Code). Tiêu chí đậu theo `08-QA_CHECKLIST.md` mục G.
- **Phạm vi vòng này:** **không** kiểm lại toàn bộ A→F. Chỉ xác minh bốn việc: V1, V2, V3 đã sửa thật chưa, và đợt sửa có đẻ lỗi mới không.
- **Đầu vào đã đọc:** `QA1-mockup-4b-vong-2.md` (mục V1–V4 + kết luận) · `PHAN-HOI-QA1-vong-1.md` phần *"Phản hồi QA1 vòng 2"* · 6 mockup ở `docs/design/vong4/` · `git diff 95560fd..e4e1d8a` · `06-BINDING_MAP` §3 hàng Breadcrumb · `08-QA_CHECKLIST` mục E.

## Kết luận nhanh

**ĐẠT QA1.** 0 lỗi mức Cao. V1, V2, V3 **đã đóng, có bằng chứng bằng máy**. Lỗi Trung bình còn mở duy nhất là **V4**, đã có phiếu nợ **N15**. Đợt sửa **không đẻ lỗi mới** ở mức Trung bình trở lên.

Cổng mở về phía Design. Việc còn lại nằm ở tầng trên: **N3** và **N15** phải được Cowork chốt **trước khi Code dựng `DetailLayout` và mục lục**.

> Ghi nhận: diff của đợt này đúng 4 file, 28 dòng (`git diff --stat 95560fd..e4e1d8a`). Không có sửa lan, không đổi tên, không thêm pattern mới — đúng §8 repo hygiene.

---

## 1. V1 — cờ `data-placeholder` trên thẻ đóng → **ĐÓNG**

| Phép kiểm | Kết quả |
|---|---|
| Quét 6 file tìm thuộc tính đặt trên thẻ đóng, regex `</[a-zA-Z][a-zA-Z0-9]*\s[^>]*>` | **0 lần** |
| Đếm cờ trong `Tour.dc.html`: chuỗi thô so với thuộc tính thật trong DOM (parser `html.parser`) | chuỗi thô **9** = DOM **9** — hết chênh lệch của vòng 2 (9 chuỗi / 8 DOM) |
| Tổng cờ 6 file, DOM | **14** = Main 3 · DiDong 1 · DiaDanh 0 · TraiNghiem 0 · Tour 9 · TourDiDong 1 — bằng đúng số chuỗi thô |
| "31/08/2026" có được đánh dấu không | **Có.** `Tour:201` nay là `<div data-placeholder="ngày mẫu" …>…</svg>31/08/2026</div>` — cờ nằm trên `div` bọc, `</svg>` đóng đúng |

Chỗ sửa còn nhân tiện đóng hai mục nhỏ khác: `padding:10px var(--s3)` → `padding:var(--s2) var(--s3)` (bớt một px cứng của F8-dư) và thêm `min-height:44px` cho ô ngày (mục tiêu chạm).

**Đối chiếu 14 cờ với nội dung nằm dưới** (trích bằng parser, không đọc mắt):

| Rơi vào | Số cờ |
|---|---|
| Bốn mức giá mẫu — 540.000₫ ×3, 650.000₫ ×4, 455.000₫, 1.300.000₫ ×2 | 10 |
| Ngày mẫu — "Cập nhật 08/2026" (`Main:236`), "31/08/2026" (`Tour:201`) | 2 |
| Chỗ giữ chỗ thân bài — `Tour:167,169` | 2 |

Không cờ nào rơi vào dữ liệu thật. Kiểm ngược: `0258 6 250 250`, `56-245/2023/TCDL-GP-LHQT`, `08:00 – 16:30`, "Cập nhật 21/08/2026" (`Main:222`, `Tour:188`), "20/08/2026" (`DiaDanh:131`), "19/08/2026" (`TraiNghiem:124`) — **không dòng nào mang cờ**. Phân biệt "ngày cập nhật giá" (có cờ) với `_updatedAt` (không cờ) vẫn giữ nguyên và vẫn đúng.

## 2. V2 — "giá trọn gói, không phụ thu" → **ĐÓNG**

`grep -n 'trọn gói\|phụ thu' *.dc.html` trên **cả thư mục** `docs/design/vong4/` (không chỉ 6 file trong phạm vi) = **0 lần**.

`Main:241` nay còn `<span class="note">Xác nhận trong giờ làm việc</span>`. QA vòng 2 có đề nghị cân nhắc bỏ cả mệnh đề này; Design giữ lại. **Chấp nhận** — đây là câu về quy trình vận hành, không phải điều khoản giá, nên không chạm A2 theo cùng một cách, và không có gì để Code hiểu nhầm thành field. Nếu Cowork muốn siết thì đó là quyết định nội dung, không phải lỗi cổng.

Lời khai của Design ("câu này sống ở thanh tin cậy trang chủ theo `00-PROJECT_BRIEF` §3, không phải field trang chi tiết") **không cần dùng đến** để đóng V2: chuỗi đã biến mất khỏi mockup, thế là đủ. QA không xác minh vế `00` §3 vì nó nằm ngoài phạm vi vòng này.

## 3. V3 — breadcrumb di động → **ĐÓNG**

| Yêu cầu | `DiDong` | `TourDiDong` |
|---|---|---|
| `<nav aria-label="Breadcrumb">` | `:66` ✔ (parser đọc ra `aria-label='Breadcrumb'`) | `:54` ✔ |
| Danh sách **có thứ tự** `<ol>` | `:67` `<ol class="crumb-m">` ✔ | `:55` ✔ |
| Đủ mắt "Trang chủ" | ✔ — Trang chủ / Điểm tham quan / Đảo Hòn Tằm / **Khu Du Lịch Hòn Tằm** (4 mắt) | ✔ — Trang chủ / Tour / **Tour 3 đảo Nha Trang Deluxe** (3 mắt) |
| Nằm **trên** ảnh hero | ✔ — `<nav>` đứng ngay sau `.hdr`, trước `div.ph` hero; có `border-bottom` làm dải sáng, đúng `06` §3 hàng Breadcrumb v2.1 *"nằm trên dải sáng phía trên hero, không đè lên ảnh"* | ✔ — cùng cấu trúc |
| Dòng breadcrumb giả cũ đã bỏ | ✔ — diff xoá `<div …>Điểm tham quan / Đảo Hòn Tằm</div>` khỏi khối tiêu đề | ✔ — diff xoá `<div …>Tour</div>` |
| Sơ đồ khối cập nhật theo | ✔ — khối 1 nay "Header · **Breadcrumb** · Hero · …" | ✔ — cùng vậy |

Parser HTML chạy 6/6 file: **0 lỗi lồng thẻ, 0 thẻ chưa đóng, 0 thuộc tính thiếu nháy**. `08` mục E dòng 132 (*"breadcrumb trong `<nav>`"*) nay đạt **6/6**, không còn 4/6.

### 3.1 Chiều cao màn đầu 390 × 844 — **còn đủ chỗ**

Tính bằng chênh lệch, không bằng ước lượng tổng (nên không phụ thuộc vào sai số đo font):

**Đợt sửa lấy đi:** ảnh hero −24 px · dòng breadcrumb giả cũ −20,16 px (`--fs-xs` 12 px × `--lh-body` 1,68) · một `gap:var(--s2)` của khối tiêu đề −8 px = **−52,16 px**.
**Đợt sửa thêm vào:** `<nav>` = `var(--s2)` trên + `var(--s2)` dưới + `border-bottom` 1 px + dòng chữ 20,16 px = **+37,16 px** (một dòng).

| File | Cân đối | Kết luận |
|---|---|---|
| `TourDiDong` | −52,16 + 37,16 = **−15,0 px** | Màn đầu **rộng hơn** bản đã qua vòng 2 15 px. Breadcrumb 3 mắt đo được ≈ 282 px trên 358 px lòng trong → chắc chắn một dòng |
| `DiDong` | −15,0 px nếu crumb một dòng; **+5,2 px** nếu xuống hai dòng | Breadcrumb 4 mắt đo được ≈ 381 px trên 358 px lòng trong → **nhiều khả năng xuống 2 dòng**. Trường hợp xấu nhất màn đầu chỉ chật thêm ~5 px so với bản đã đạt ở vòng 2 |

Cả hai file đều **không xấu đi quá 5 px**, và `.crumb-m` đã khai `flex-wrap:wrap` nên việc xuống dòng là hành vi đã lường trước chứ không phải vỡ khung. Không tính lỗi. Ghi nhận ở mức quan sát: nếu chủ dự án muốn breadcrumb di động luôn một dòng, cách chuẩn là rút gọn mắt giữa hoặc cho cuộn ngang — nhưng đó là quyết định bề mặt, không phải yêu cầu của cổng.

## 4. Lỗi mới do đợt sửa đẻ ra — **không có, ở mức Trung bình trở lên**

| Phép kiểm | Kết quả |
|---|---|
| HTML hợp lệ 6/6 | **Đạt.** Parser: 0 lỗi lồng thẻ, 0 thẻ chưa đóng, 0 thẻ đóng lạc. Quét thuộc tính không nháy = 0 |
| CSS mới `.crumb-m` có dùng token không | **Đạt, 100 %.** `gap:var(--s1)` · `font-size:var(--fs-xs)` · `color:var(--c-text-muted)` · `margin-right:var(--s1)`; `<nav>` dùng `padding:var(--s2) var(--s4)` và `1px solid var(--c-border)`. **Không một px cứng, không một hex cứng.** Cấu trúc song song đúng `.crumb` desktop (chỉ khác `--fs-xs` thay `--fs-sm` và `--s1` thay `--s2` — thu nhỏ hợp lý cho 390 px) |
| `data-placeholder` có gắn nhầm vào dữ liệu thật | **Không.** 14/14 rơi đúng chỗ — xem bảng ở mục 1 |
| Sơ đồ khối di động còn khớp không | **Khớp.** `DiDong` 1…11 liên tục, `TourDiDong` 1…10 liên tục, không nhảy số, không trùng số; thứ tự khối không đổi so với vòng 2 (vẫn khớp `06` §3 + §3.1), chỉ khối 1 được viết lại cho khớp artboard |

### Ba quan sát mức **Thấp** (không chặn cổng, gộp vào sổ nợ Thấp sẵn có)

| # | Mô tả | File |
|---|---|---|
| V8 | `.crumb-m` dùng `--fs-xs` 12 px. Sàn 11 px của `08` mục E **đạt**; sàn 15 px của `07` §2 (`font.size.sm` — *"không nhỏ hơn cỡ này trong UI chính"*) thì không. Cùng loại với **F24-dư** đang mở, thêm một chỗ | 2 di động |
| V9 | Mắt breadcrumb di động là `<a>` cao ~20 px — dưới mục tiêu chạm 44 px. `08` mục E **không** liệt kê mục tiêu chạm nên đây không phải vi phạm checklist; ghi lại để chủ dự án biết khi duyệt bề mặt | 2 di động |
| V10 | `<ol class="crumb-m">` có `list-style:none` → VoiceOver/Safari bỏ ngữ nghĩa danh sách. **Không phải lỗi mới** — `.crumb` desktop đã vậy từ vòng 2 và QA vòng 2 đã cho qua. Ghi cho Code biết khi dựng component thật (cách chuẩn: thêm `<li>` role hoặc `::before{content:""}`) | 6/6 |

Ba mục V5, V6, V7 của vòng 2 (mức Thấp) **vẫn mở, không đổi** — vòng này không kiểm lại.

---

## 5. Chấm lại theo `08` mục G

- [x] **0 lỗi mức Cao** — F1, F2, F3 đóng từ vòng 2, vòng này không phát sinh mới.
- [x] **Mọi lỗi Trung bình đã sửa hoặc ghi phiếu nợ có ID** — V1, V2, V3 **đã sửa, có bằng chứng bằng máy**; V4 có phiếu **N15**. Không còn lỗi Trung bình nào vừa chưa sửa vừa chưa có nợ.
- [x] Đủ 6/6 mockup trong phạm vi đợt 4B có mặt trong báo cáo.
- [x] Có chữ ký QA agent và timestamp.

**→ Cổng QA1 ĐẠT.** Design hết việc ở đợt 4B.

---

## 6. Sổ nợ mở sau vòng 3 — N1 → N15

Không nợ nào được đóng ở vòng này (vòng 3 chỉ xác minh V1–V3, không xét nợ). Danh sách để Cowork / chủ dự án xử:

### 6.1 **Chặn Code** — phải chốt trước khi Code chạy

| # | Mô tả | Chặn cái gì | Tầng xử |
|---|---|---|---|
| **N3** | `06` §3 tự mâu thuẫn về Breadcrumb của Tour: cột "Khi rỗng" nói dùng nhánh URL, cột Ghi chú nói *"không áp dụng: … tour"*, §3.1 ghi "—". **Phạm vi nay rộng thêm:** trước là 4 file desktop, sau đợt sửa V3 thì `TourDiDong` cũng vẽ breadcrumb → **5/6 file vẽ breadcrumb cho Tour trong khi `06` nói không áp dụng**. Design áp luật nhất quán là đúng, nhưng mâu thuẫn ở `06` vì thế càng phải chốt | `DetailLayout` / `Breadcrumb.astro` | Cowork sửa `06` §3 |
| **N15** | `06` §3 v2.1 nói mục lục sinh *"từ **h2** của `body`"* khi có *"≥ 3 h2"*, nhưng mockup vẽ tiêu đề trong bài bằng **h3** (h2 đã dành cho tiêu đề mục) và `Tour` chỉ có 2 mục. Thứ bậc của mockup đúng `08` mục E; thứ cần sửa nhiều khả năng là chữ ở `06` | mục lục + `DetailLayout` | Cowork sửa `06` §3 |

**Nên chốt sớm, chặn một khối cụ thể:**

| # | Mô tả | Chặn cái gì | Tầng xử |
|---|---|---|---|
| **N14** | `01:325` khai `durationAtStop` kiểu **ISO 8601**, dữ liệu thật và mockup (`Tour:135-140`) dùng **khung giờ trong ngày**. Kéo theo JSON-LD: `src/lib/serialize/tour.ts:61-63` nối thẳng giá trị này vào ItemList | khối Lịch trình + structured data | Cowork sửa `01`/`06`, hoặc sửa dữ liệu |
| **N1** | `BookingForm` mới có bước 1. Chưa có bước 2, honeypot, Turnstile, trạng thái lỗi, `<noscript>`; `id="dat-tour"` đang trên `div` chứ chưa phải `<form method="post" action="/api/dat-tour">` | `BookingForm.astro` | Cowork + SPEC §4.3 |

### 6.2 Không chặn Code, nhưng chủ dự án phải chốt

| # | Mô tả | Mức |
|---|---|---|
| **N2** | Địa danh và Trải nghiệm chưa có artboard di động; thứ tự khối di động đang phải suy từ `DiDong` | tb |
| **N4** | `06` chưa có **hàng** cho dải cuối trang ("Gần đây" / "tương tự"); chỉ có câu thứ tự ở §3.1 và prop `nearby` ở §7.1 | tb |
| **N7** | Drift `tokens.css` ↔ `07-DESIGN_TOKENS` (`--radius-lg`, `--shadow-raised`, `--fs-badge`, `--fs-xs`, thứ tự `--font-display`, giá trị motion). Mockup bám `tokens.css` là **đúng nguồn**; nợ thuộc về `07` | tb |
| **N11** | Luật 1 của `06` §6 nói về **field** hay về **chuỗi**? Ba cặp còn lại (L16 `tripOrigin`, L17 `duration`/`durationAtStop`, L18 `touristType`) là hai field khác nhau tình cờ trùng giá trị | tb |
| **N12** | `tokens.css` không có token bóng **hướng lên**; thanh đáy di động đang dùng `0 -4px 16px rgba(15,23,42,.08)` cứng. Cần thêm token ở `07` + `tokens.css` | tb |
| **N13** | Con số giá nằm trong chữ của `faq`: `DiaDanh:125` "22.000 đồng" trên entity **không có vùng giá**, `Tour:184` "70 % giá vé". Cần chốt biên tập có được viết giá trong `faq` không, và ai cập nhật khi `prices.yaml` đổi | tb |
| **N5** | §3.1 chưa định vị mục "Bao gồm" của Trải nghiệm trong thứ tự thống nhất | thấp |
| **N6** | Luật *"tiêu đề > 48 ký tự hạ một bậc"* và bậc chữ `.sec-title` theo khổ máy (gộp F28) chưa có trong `07` | thấp |
| **N8** | `prefers-reduced-motion` vắng 6/6 (`08` mục E). Chưa phát sinh vì 0 `transition`/`animation`; khối reset đã có trong `tokens.css` | thấp |
| **N9** | Ảnh là `div.ph` nên chưa kiểm được `alt` — dời sang cổng QA2 | thấp |
| **N10** | Dưới bộ `cat-bien`, `--c-surface-alt` và `--c-primary-soft` vẫn lạnh; dải "Gần đây" và huy hiệu sẽ lệch tông. Chủ dự án xem bản thật rồi quyết | thấp |

---

## 7. Điểm nên ghi nhận

Ba mục V1–V3 được sửa **đúng chỗ, đúng cách, không lan**: 28 dòng diff trên 4 file, CSS mới không một px cứng, và mỗi lỗi đều để lại dấu vết kiểm được bằng máy chứ không phải bằng lời khai. V1 vốn là lỗi khó thấy nhất — cờ đặt trên thẻ đóng thì `grep` vẫn đếm ra nhưng trình duyệt thì vứt — nay đếm bằng parser cho ra **9 = 9** ở `Tour` và **14 = 14** trên toàn bộ, tức số chuỗi và số thuộc tính thật đã trùng khớp. V3 làm thêm phần không ai bắt: rút hero 24 px để bù chỗ cho breadcrumb, nên màn đầu 390 × 844 không những không vỡ mà còn rộng hơn ở `TourDiDong`.

Việc còn lại **không thuộc Design**. Hai phiếu **N3** và **N15** đều là chữ ở `06` tự mâu thuẫn với chính nó; Code không được tự hoà giải, và Design cũng không được — đúng như `CLAUDE.md` §5 hard stop *"có mâu thuẫn giữa các tài liệu ở hai tầng khác nhau"*.

---

*QA agent: Claude (vai QA độc lập, phiên 2026-08-22, vòng 3). Timestamp báo cáo: 2026-08-22. Artifact kiểm ở commit `e4e1d8a`. Báo cáo này không sửa bất kỳ file nào ngoài chính nó.*
