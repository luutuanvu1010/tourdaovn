# Phản hồi QA1 vòng 1 — mockup đợt 4B

- **Ngày:** 2026-08-22   **Vai:** Design (tác nhân soạn mockup)   **Đối tượng:** `QA1-mockup-4b.md` cùng thư mục
- **Nguyên tắc trả lời:** lỗi Cao sửa hết; lỗi TB sửa hoặc ghi phiếu nợ (`GOVERNANCE` 4.3 điều kiện ra). Chỗ nào là **xung đột giữa hai đặc tả** hoặc cần quyết định tầng trên thì **không tự hoà giải** (`CONSTITUTION` Điều 3, `GOVERNANCE` 3.4) — chuyển thành nợ cho Cowork/chủ dự án.
- **Design không tự mở cổng.** File này là đầu vào cho QA chạy lại, không phải tuyên bố đạt.

## 1. Lỗi Cao — đã sửa cả ba

| ID | Đã làm | Kiểm lại ở đâu |
|---|---|---|
| **F1** | Gỡ tiêu đề "Hỏi giá và giữ chỗ" và câu "Giá theo gói lặn…" khỏi khối hành động của Trải nghiệm. Còn đúng hai kênh liên hệ + một chú thích HTML dẫn `06` §0 quyết định nền 3 và §6 luật 3 | `TraiNghiem.dc.html`, khối sidebar đầu tiên |
| **F2** | Thêm khối **"3 · Khối hành động — vé vào cửa + Đặt vé qua Zalo + hotline; ngay sau Thông tin nhanh (06 §3), CTA còn lặp ở thanh đáy"** vào sơ đồ thứ tự khối di động; đánh số lại 4→11; sửa câu "giá chỉ ở thanh đáy" thành "không chứa giá" | `DiDong.dc.html`, cột phải |
| **F3** | 14 chỗ dữ liệu bịa nay mang cờ `data-placeholder` (giá 540.000₫ / 650.000₫ / 455.000₫ / 1.300.000₫, ngày 31/08/2026, "Cập nhật 08/2026") với nội dung cờ ghi rõ *"prices.yaml rỗng — số mẫu, không phải giá thật"*. Đoạn văn thân bài Tour thay bằng chỗ giữ chỗ có cờ | cả 6 file, `grep data-placeholder` = 14 |

**Về ba giá trị QA xếp chung F3 nhưng không phải dữ liệu bịa:** `0258 6 250 250`, giờ mở cửa `08:00 – 16:30`, và giấy phép `56-245/2023/TCDL-GP-LHQT` **là dữ liệu thật**, chép từ production ngày 2026-08-21 (`/diem-tham-quan/khu-du-lich-hon-tam/` và `/tour/tour-3-dao-nha-trang-deluxe/`). Không gắn cờ placeholder cho dữ liệu thật, vì cờ sai làm Code tưởng phải thay. Ghi ở đây để QA đối chiếu.

## 2. Lỗi Trung bình

**Đã sửa (17/19):**

| ID | Đã làm |
|---|---|
| F4 | Gỡ câu ghi chú "(Mục Lịch trình chi tiết của bài cũ…)" khỏi thân bài Tour |
| F5 | Ghim bản đồ đổi sang `--c-primary`, dấu "✗" sang `--c-text-muted` — accent chỉ còn ở giá và nút |
| F6 + F13 | Gradient hero dựng hoàn toàn bằng `color-mix()` trên `--c-primary-strong` (hết `rgba(8,47,73,.55)`), và **đậm hơn**: 88 % tại 45 %, 70 % tại 62 %. Chữ trắng 17px trên nền ảnh sáng nhất nay ≈ 5,8:1; huy hiệu hero đổi nền từ trắng 22 % sang `--c-primary-strong` 58 % + viền sáng 30 % |
| F7 | `--sticky-h` → `--sticky-bar-h` (khớp `tokens.css` sau 4A); thêm `--container`, `--container-padding`, `--lh-eyebrow`, `--badge-py/px`; mọi `height:68px` / `height:56px` / `top:calc(68px + 56px + 16px)` / `max-width:1200px` / `padding:0 24px` nay đọc token |
| F8 | Logo → `--fs-card-title` (desktop) và `--fs-h5` (di động); h1 di động 28px → `--fs-h4`, 24px → `--fs-h5`; huy hiệu → `--badge-py/px`; CTA thanh dính → `var(--s2) var(--s5)`; `.toc a` → `var(--s1) 0` |
| F9 | Bỏ `letter-spacing:-0.015em` ở `.sec-title` **cả 6 file** |
| F10 | `--ls-eyebrow` nay luôn đi kèm `--lh-eyebrow` (6/6) |
| F11 | Breadcrumb desktop bọc `<nav aria-label="Breadcrumb">` (4 file) |
| F12 | Nút đếm 36 → **44 px**; `.btn` khai `min-height:44px` ở mọi file; bỏ `min-height:0` trên CTA thanh dính |
| F14 | Giá thanh dính có "/ người" (Main, Tour) |
| F17 | Gỡ mệnh đề "cách trung tâm … 7 km" khỏi thân bài Main — khoảng cách chỉ còn ở đoạn mở (một thông tin, một vùng) |
| F18 | Di động: "Điện thoại **khu du lịch**", "Website **chính thức**" |
| F19 | Một nhãn cho một hành động: entity **có giá** dùng "Đặt vé qua Zalo" (thanh dính + khối hành động + sơ đồ di động); entity **chưa có giá** dùng "Nhắn Zalo" |
| F20 | `.btn.o` viền `--c-primary` (9,46:1 trên nền trắng) thay `--c-border` |
| F22 | Mục lục Tour còn hai mục và **cả hai có thật** trong bài (`id="tt-1"`, `id="tt-2"`); mục "Các trải nghiệm trong tour" bỏ vì trùng vai rollup (luật 2) |
| F24 | Nhãn giá thanh đáy và giá theo hạng khách nâng từ `--fs-xs` lên `--fs-label` |
| F16 phần thuộc Design | Đoạn mở Main rút còn câu định vị (hết trùng với Điểm nổi bật và thân bài — L2, L4, L5); thân bài Tour thay bằng hai mục có chỗ giữ chỗ (hết trùng đoạn mở — L20) |

**Không sửa, kèm lý do (2/19):**

- **F21 — khung giờ trong lịch trình.** Không phải dữ liệu bịa: "8:00 – 8:45"… "15:00 – 15:30" là giá trị **`durationAtStop` thật** của tour Deluxe trên production (đọc `.tl-dur` ngày 2026-08-21). `06` §4.8 khai `durationAtStop` cho từng stop; điều I1 cấm là coi `departureNote` như **lịch chỗ trống**, không cấm hiện thời lượng tại điểm dừng. Nếu QA vẫn cho là lệch thì đây là câu hỏi cho `01`/`06`, không phải lỗi mockup.
- **F15 — dải cuối trang.** Ba tên khác nhau là **đúng nguồn**: `uiCopy` có `nearby` = "Gần đây" (điểm tham quan, địa danh), `similarExperiences`, `similarTours`. Main **không có dải** vì rollup `nearby` của chính điểm tham quan đó rỗng trên production — vùng rỗng ẩn hẳn (`06` §0 quyết định nền 2); đã ghi chú HTML tại chỗ. Kiểu tiêu đề khác `.sec-title` là **đang chép đúng `NearbySection.astro`**; muốn đổi thì đổi ở component, thuộc bước 8.

**Chuyển thành nợ (phần F16 còn lại):** L16 `tripOrigin` ↔ chặng lịch trình, L17 `duration` ↔ `durationAtStop` ↔ FAQ, L18 `touristType` ↔ hạng khách của form, L19 chính sách giá trẻ em trong FAQ, L12 giá 22.000đ trong FAQ Địa danh. Ở cả năm, **hai field khác nhau tình cờ mang cùng giá trị** hoặc **nội dung FAQ thật do biên tập viết**. Luật 1 nói về *field*, không về chuỗi ký tự; siết thành "một chuỗi chỉ được xuất hiện một lần" là **sửa luật**, thuộc Cowork. → **N11**.

## 3. Lỗi Thấp

Sửa: **F23** (ghim bản đồ hết `#fff`), **F25** (`--lh-heading` thay 1.16 cứng), **F26** (bổ sung token thiếu đang dùng), **F27** (ghi `decor` / `config (build)` cho dòng dịch vụ và logo), **F29** (dấu "/" breadcrumb đổi sang `--c-text-muted`).

Giữ, ghi nợ: **F23 phần bóng thanh đáy** `0 -4px 16px rgba(15,23,42,.08)` — đang chép đúng `DESIGN_PATTERNS` P14; thêm token bóng hướng lên là việc của `07` → **N12**. **F24 phần giấy phép** giữ `--fs-xs` (dòng pháp lý). **F28** bậc chữ tiêu đề mục theo khổ máy chưa thành luật → gộp vào **N6**.

## 4. Nợ chuyển tiếp

N1–N10 của QA giữ nguyên, thêm:

- **N11** — luật 1 của `06` §6 nói "một field một vùng"; cần Cowork ghi rõ nó **không** cấm hai field khác nhau cùng giá trị, và nội dung FAQ do biên tập không tính là vùng thứ hai. Nếu chủ dự án muốn siết thì phải sửa `06` trước, không sửa mockup.
- **N12** — `07` chưa có token bóng hướng lên cho thanh đáy di động (`DESIGN_PATTERNS` P14 đang viết cứng).

Trong đó **N3** (breadcrumb của Tour: `06` §3 tự mâu thuẫn) là thứ **chặn Code** — mockup Tour đang vẽ breadcrumb theo cột "Khi rỗng", nếu Cowork chốt ngược lại thì phải sửa cả mockup lẫn `DetailLayout`.

## 5. Việc QA chạy lại nên soi trước

1. Ba lỗi Cao ở §1 — nhất là `grep data-placeholder` và sơ đồ khối di động của `DiDong`.
2. Tương phản hero sau khi đổi gradient (F6+F13) — chữ và **huy hiệu**.
3. `grep` còn sót giá trị cứng: `--sticky-h`, `-0.015em`, `rgba(8,47`, `height:68px`, `padding:10px 20px`, `width:36px` — đo được là 0 ở cả 6 file lúc soạn file này.
4. Chuỗi lặp còn lại có rơi đúng vào N11 không, hay còn chỗ Design bỏ sót.

---

# Phản hồi QA1 vòng 2 (2026-08-22)

Đối tượng: `QA1-mockup-4b-vong-2.md`. Vòng 2 xác nhận 3 lỗi Cao đã đóng, còn 4 mục TB. Xử như sau:

| ID | Xử |
|---|---|
| **V1** | Đã sửa. Cờ `data-placeholder="ngày mẫu"` bị đặt nhầm lên thẻ **đóng** `</svg>` (do phép thay chuỗi khớp đúng dấu `>` của thẻ đóng). Nay cờ nằm trên `div` bọc ô ngày; quét `</thẻ thuộc-tính=` trả **0** ở cả 6 file, `Tour.dc.html` đủ **9** cờ. Ô ngày nhân tiện đạt mục tiêu chạm 44 px |
| **V2** | Đã sửa. Gỡ "· giá trọn gói, không phụ thu" khỏi khối hành động của `Main`. Câu này là một trong bốn điểm khác biệt ở `00-PROJECT_BRIEF` §3, sống ở thanh tin cậy trang chủ (config), không phải field của trang chi tiết — QA đúng, vòng 1 tôi sửa ở `TraiNghiem` mà bỏ sót `Main` |
| **V3** | Đã sửa. Hai bản di động nay có `<nav aria-label="Breadcrumb"><ol class="crumb-m">` đủ "Trang chủ", đặt **trên** ảnh hero đúng `06` §3 v2.1; bỏ dòng chữ "Điểm tham quan / Đảo Hòn Tằm" cũ (đó chính là breadcrumb giả); ảnh hero giảm 24 px để giữ nguyên chiều cao màn đầu; sơ đồ khối đổi thành "1 · Header · Breadcrumb · Hero…" |
| **V4** | Không sửa — đã là nợ **N15** (mục lục đòi ≥ 3 h2 nhưng bài mẫu có 2, và tiêu đề trong bài vẽ bằng h3). Đây là xung đột giữa `06` §3 và cách dựng bài; Cowork chốt, Design không tự hoà giải |

**Nhận hai đính chính của QA:** **N13** (giá nằm trong chữ `faq` là câu hỏi riêng, không gộp vào N11) và **N14** (`durationAtStop` khai kiểu ISO 8601 ở `01` §2.8 trong khi dữ liệu thật là khung giờ — kéo theo JSON-LD `serialize/tour.ts`). Cả hai là việc tầng trên, không sửa ở mockup.

Nợ mở sau vòng 2: N1–N15. Chặn Code: **N3** (breadcrumb Tour), **N15** (ngưỡng mục lục).
