# Pha F — bàn giao bước 7 (Design)

> Artifact bước 7 theo `PLAYBOOK` Phần 1: **mockup + đề xuất token**. Không phải code sản phẩm.
> Giao xong thì dừng, chờ chủ dự án duyệt QA1 (`GOVERNANCE` 4.3). Không tự mở cổng sang bước 8.

- **Phiên bản:** v1.0.0 **Ngày:** 2026-08-06 **Người soạn:** Claude Design
- **Người duyệt:** Lưu Tuấn Vũ — **chưa duyệt**
- **Cổng vào:** chủ dự án xác nhận mở cổng bước 7 ngày 2026-08-06, chấp nhận trạng thái 15 cảnh báo `g3` (0 lỗi) ghi ở `06-BINDING_MAP` §7.1.

**Đầu vào đã đọc:** `06-BINDING_MAP.md` v2.0.0 (§2, §3, §4.8, §5.1, §5.2, §5.7, §4.1, §7) ·
`07-DESIGN_TOKENS.md` (§1, §1b, §2, §3, §4, §5) · `00-PROJECT_BRIEF.md` v2.0.0 ·
`COMPONENT_INVENTORY.md` (54 component) · `src/styles/tokens.css` · `src/site.config.ts` ·
`data/prices.yaml` · bản build thật trong `dist/` (dữ liệu thật của 8 document đang publish).

---

## 1. Giao gì, đặt ở đâu

| File | Là gì |
|---|---|
| `docs/design/mockups/tour-detail.html` | **Ưu tiên 1** — trang tour chi tiết `/tour/{slug}/`. Trang chốt đơn. |
| `docs/design/mockups/home.html` | **Ưu tiên 2** — trang chủ `/`. |
| `docs/design/mockups/tour-index.html` | **Ưu tiên 3** — trang danh sách `/tour/`. |
| `docs/design/mockups/_pattern.css` | Phần **thiết kế**: khung, thẻ, lưới thích ứng, hộp đặt chỗ, hành trình, nhãn. Bước 8 dịch file này sang component Astro đang có. |
| `docs/design/mockups/_shell.css`, `_shell.js` | **Khung xem thử, không thuộc thiết kế.** Ba công tắc để kiểm bằng mắt. Bước 8 không dựng lại. |

Mở bằng cách bấm đúp vào file `.html` (chạy trên `file://` được, không cần server).

**Không file nào trong `src/`, `cms/`, `scripts/` bị sửa.** Kiểm bằng `git status`.

### Nguồn token: không có nguồn thứ hai

Ba trang đều `<link rel="stylesheet" href="../../../src/styles/tokens.css">` — nạp thẳng file token
đang chạy production. Mockup **không chép lại** một giá trị token nào. Đổi `tokens.css` là mockup đổi theo.

Đã kiểm bằng máy: không mã hex, không `rgb()`, không `font-size` bằng số trong `_pattern.css` và ba
trang. Còn lại là số cấu trúc thuần (viền `1px`, đường nối `2px`, cột `340px`) — cùng loại số mà
component thật đang dùng.

Quy ước: chỗ nào viết `var(--x, giá-trị)` là **token đang đề xuất, chưa tồn tại**; giá trị sau dấu
phẩy chỉ để xem thử. Có đúng 4 chỗ, liệt ở §5.

---

## 2. Cách xem — ba công tắc trên thanh đen

1. **Bộ giao diện** — `Biển sâu` / `Cát biển` / `Ngọc lam`. Gắn `data-theme` lên `<html>` đúng cách
   `BaseLayout` đang làm thật (`07-DESIGN_TOKENS` §1b). Đây là bằng chứng cho điều kiện ra "ba bộ đều dùng được".
2. **Số mục** — `0 / 1 / 2 / 3 / 4 / 6`. Cắt số thẻ trong mọi khối cùng lúc. Đây là bằng chứng cho
   ràng buộc dữ liệu mỏng. **Mặc định mở ở mốc 1** vì đó là sự thật hôm nay.
3. **Nhãn binding** — bật nhãn `§x.y · field` trên từng vùng. Vùng nào không có nhãn là vùng phải bỏ.

Ở mốc `0`, các khối có cờ `data-hide-when-empty` **biến mất hoàn toàn** — không khung trống, không
dòng "đang cập nhật", không CTA giả. Đó là R4 và quyết định nền 2 của `06`, xem được bằng mắt.

---

## 3. Bảng đối chiếu: mỗi vùng ↔ một dòng trong `06-BINDING_MAP`

### 3.1 Trang tour chi tiết `/tour/{slug}/`

| # | Vùng trên mockup | Dòng trong binding map | Dữ liệu nuôi | Trạng thái thật hôm nay |
|---|---|---|---|---|
| 1 | Header điều hướng | §2 · Header điều hướng | config(build) `nav` | có |
| 2 | Breadcrumb trong hero | §3 · Breadcrumb | nhánh URL (tour không có `containedInPlace`) | có |
| 3 | Ảnh hero + tiêu đề | §3 · Hero | `title` + `mainImage` | có — 2 ảnh (<4) nên **ảnh đơn**, không mosaic |
| 4 | Nhãn cạnh tiêu đề | §3 · Nhãn loại entity | `tourFormat` | có (`both` → "Linh hoạt") |
| 5 | Thanh thông tin nhanh | §4.8 · tourFormat, departureNote, seasonNote | 3 field | có 3 ô |
| 6 | — ô "Thời lượng" | §4.8 · duration | `duration` | **ẩn** — field đang chứa chuỗi `ISO 8601`, xem §7 |
| 7 | — ô "Giá từ" | §3 · Vùng giá cộng CTA | `prices.yaml` qua `bookingRef` | **ẩn** — không có `bookingRef`, `prices.yaml` trống |
| 8 | Đoạn mở | §3 · Đoạn mở | `summary` | có (nội dung đang là từ khoá SEO, xem §7) |
| 9 | Hành trình (timeline) | §4.8 · itinerary | `itinerary[]` | có **1 chặng** |
| 10 | Gồm gì / không gồm gì | §4.8 · includes, excludes | 2 mảng | có (5 / 2 mục) |
| 11 | Điểm nổi bật | §3 · Điểm nổi bật | `highlights` | tuỳ, ẩn khi rỗng |
| 12 | Chi tiết chương trình | §3 · Thân bài | `body` | có |
| 13 | Mùa thích hợp | §4.8 · seasonNote | `seasonNote` | có |
| 14 | Câu hỏi thường gặp | §3 · Hỏi đáp | `faq` | có |
| 15 | Ngày cập nhật | §3 · Ngày cập nhật | `_updatedAt` | có (S2.4 buộc hiện) |
| 16 | Hộp "Nhận báo giá qua Zalo" | §2 · Kênh liên hệ (sidebar booking) | `siteSettings.contact` | có 3 kênh |
| 17 | Hộp giá + nút "Đặt tour" | §3 · Vùng giá cộng CTA | `prices.yaml` | **ẩn hôm nay**; hình dạng đúng để ở cuối trang mockup |
| 18 | Bảng thông tin phụ | §4.8 · operator, tourFormat, tripOrigin, touristType | 4 field | có |
| 19 | Thanh hành động cố định (mobile) | §2 · Kênh liên hệ | `siteSettings.contact` | có — **cùng một hàng binding với #16**, không phải CTA mới |
| 20 | Tour tương tự | rollup(build) qua prop `nearby` | Tour publish khác | **0 mục → cả section ẩn** |
| 21 | Footer | §2 · Footer | config(build) | có |

**Vùng đã bỏ khỏi mockup, có lý do:**

- **Nút "Website chính thức"** (đang có trong `TourDetail.astro` khi chưa có giá): **không có dòng nào
  trong binding map cho phép**. Nó cũng đẩy khách ra khỏi site ở đúng trang chốt đơn, trong khi
  `operator` của tour tự vận hành chính là Tour Đảo. Đề xuất bỏ — xem câu hỏi Q3.
- **Vùng "Phân loại"** (§3): xem quyết định ở §6 Q1.
- **Vùng "Xác minh dữ liệu"** (§3 `sameAs`): §3 ghi rõ *không áp dụng: tour*.
- **Vùng "Điện thoại"** (§3 `telephone`): §3 ghi rõ *không áp dụng: tour*.
- **Gallery rời**: §3 cấm gallery section rời trên detail; gallery đi qua Hero mosaic, mà tour này chưa đủ 4 ảnh.

### 3.2 Trang chủ `/`

| # | Vùng trên mockup | Dòng trong binding map | Dữ liệu nuôi | Trạng thái thật |
|---|---|---|---|---|
| 1 | Hero — dòng nhỏ trên tiêu đề | §5.7 · Hero: lời chào | `brand.name` (config build) | có |
| 2 | Hero — h1 | §5.7 · Hero: lời chào | `siteSettings.heroText` | **đề xuất đổi vai**, xem Q4 |
| 3 | Hero — đoạn dưới | §5.7 · (config build) | `brand.description` | có |
| 4 | Hero — ảnh nền | §5.7 · Hero: ảnh nền | `touristDestination.mainImage` | có; thiếu ảnh thì nền thuần `--c-primary` |
| 5 | Hero — nút chính | §5.7 · Hero: nút phụ (mục `nav`) | mục `kind:'zalo'` | **đề xuất đổi vai**, xem Q5 |
| 6 | Hero — nút phụ | §5.7 · Hero: nút chính | `destinationHref` | như trên |
| 7 | "Tour đang nhận đặt" | §4.1 · Khối featured — `featuredTours` | deref Tour publish | **1 mục** |
| 8 | Bốn điểm khác biệt | §4.1 · Trust bar | config(build) | có — **đề xuất đổi nội dung**, xem Q2 |
| 9 | Lối vào hub | §4.1 · Lối vào 4 hub | config(build) + rollup đếm | 2 hub hiện, hub Lưu trú ẩn vì 0 mục |
| 10 | "Trải nghiệm trong vịnh" | §4.1 · `featuredExperiences` | deref | 1 mục |
| 11 | "Điểm tham quan có bán vé" | §4.1 · `featuredAttractions` | deref | 1 mục |
| 12 | "Kinh nghiệm trước khi đi" | §4.1 · Cẩm nang bản địa (rollup Article) | rollup(build) | 1 mục |
| 13 | "Nơi ở gần biển" | §4.1 · `featuredStays` | deref | **0 mục → cả section ẩn** |
| 14 | "Các đảo và khu vực nên biết" | §4.1 · Các khu vực nên biết (rollup Place) | rollup(build) | 1 mục |
| 15 | "Về Nha Trang" | §4.1 · thân bài điểm đến | `touristDestination.body` | có |
| 16 | Số liệu nhanh | §4.1 · Số liệu nhanh | `keyFacts` | có 4 mục |
| 17 | Câu hỏi thường gặp | §4.1 · (faq của điểm đến) | `faq` | tuỳ |
| 18 | Banner tuỳ biến | §4.1 · Custom banners | `homepageBanners` | 0 → **không vẽ trong mockup** |
| 19 | Lưu ý an toàn | §4.1 · Lưu ý an toàn | `safetyNote` | 0 → không vẽ |

Khối `specialties` trong `DEFAULT_SECTIONS`: entity `specialty` **đang tắt** ở `site.config.ts` nên
vĩnh viễn rỗng. Đề xuất bỏ khỏi `DEFAULT_SECTIONS` (việc bước 8).

**Thứ tự khối là đề xuất, không phải quyết định** — §5.7 nói rõ thứ tự do `siteSettings.sections` quyết:

> hero → **tours** → trustBar → hubGrid → experiences → attractions → guides → stays → areas →
> **editorialBody** → faq → safety

Khác bản đang chạy ở hai chỗ: `tours` nhảy từ áp chót lên vị trí 2 (site bán tour mà sản phẩm nằm
dưới cả đặc sản); `editorialBody` — bài dài về Nha Trang — lùi xuống dưới sản phẩm.

### 3.3 Trang danh sách `/tour/`

| # | Vùng trên mockup | Dòng trong binding map | Trạng thái thật |
|---|---|---|---|
| 1 | Tiêu đề + mô tả nhánh | §5.2 · Tiêu đề, mô tả nhánh (config build) | có |
| 2 | Lối lọc theo term | §5.2 · Lối lọc theo term | **0 term đủ R2 → ẩn**; giữ trong mockup để bước 8 biết hình dạng |
| 3 | Lưới card | §5.2 · Lưới card + §5.1 · Card chuẩn | 1 mục |
| 4 | — ảnh card | §5.1 · Ảnh | có; thiếu ảnh thì **thẻ thuần chữ**, không khung placeholder |
| 5 | — tiêu đề, link | §5.1 · Tiêu đề, link | có |
| 6 | — mô tả ngắn | §5.1 · Mô tả ngắn | có |
| 7 | — nhãn phụ | §5.1 · Nhãn phụ (`tourFormat`) | có, **một nhãn, không nhồi** |
| 8 | — nhãn giá | §5.1 · Nhãn giá | **ẩn** — chưa có `bookingRef` |
| 9 | Dòng đếm "N tour" | trình bày (Design quyết, §5.2) | có |
| 10 | JSON-LD CollectionPage | §5.2 · JSON-LD | vùng vô hình, giữ nguyên |

Thứ tự sắp xếp card §5.2 để Design quyết: **đề xuất `updatedAt` giảm dần**, vì dữ liệu đang mỏng và
tour mới nhập cần lên đầu. Đổi được sau, không phải cửa một chiều.

---

## 4. Trạng thái 1 mục / vài mục / nhiều mục — ràng buộc số một

### 4.1 Một quy tắc lưới duy nhất, dùng chung ba trang

Viết bằng `:has()` trong `_pattern.css`, **không cần JS**, nên bước 8 dựng lại được nguyên vẹn.

| Số mục | Bố cục | Vì sao |
|---|---|---|
| **0** | Cả section ẩn hẳn | R4 + quyết định nền 2. Không placeholder, không CTA giả |
| **1** | **Thẻ spotlight nằm ngang** — ảnh trái 5/12, chữ phải 7/12, chiếm trọn chiều rộng; tiêu đề lên `--fs-h4`, mô tả lên `--fs-base` | Một thẻ dọc đứng lẻ trong lưới 3 cột là hỏng. Đây là trạng thái **thật** của gần như mọi khối hôm nay |
| **2** | 2 cột từ `bp-sm` | hàng đầy |
| **3** | 3 cột từ `bp-lg`, 2 cột ở `bp-sm` | hàng đầy ở desktop |
| **4** | **2×2**, không phải 3+1 | 3+1 để lại một thẻ lẻ ở hàng hai |
| **5+** | 3 cột; hàng cuối lẻ **chỉ chấp nhận ở trang danh sách** | Trang danh sách có dòng đếm "N tour" nên hàng lẻ đọc ra là "hết danh sách". Khối trang chủ không có dòng đếm nên hàng lẻ đọc ra là "thiếu" → **cắt còn 3 hoặc 4 mục** kèm link "Xem tất cả" (§4.1 đã cho phép "tối đa 4 card") |

Mobile: mọi khối 1 cột, thẻ trở về dạng dọc.

### 4.2 Khai theo từng khối

| Khối | 0 mục | 1 mục | 2–3 mục | 4+ mục |
|---|---|---|---|---|
| Tour đang nhận đặt (chủ) | ẩn cả khối | spotlight ngang | 2–3 cột | cắt 4, link "Xem tất cả" |
| Trải nghiệm / Điểm tham quan / Cẩm nang / Khu vực (chủ) | ẩn cả khối | spotlight ngang | 2–3 cột | cắt 4, link "Xem tất cả" |
| Nơi ở gần biển (chủ) | **ẩn — đúng trạng thái hôm nay** | spotlight ngang | 2–3 cột | cắt 4 |
| Lối vào hub (chủ) | ẩn ô hub có 0 entity; hết ô thì ẩn cả khối | 1 ô chiếm 1/3, không kéo giãn | 2–3 ô | tối đa 4 ô |
| Bốn điểm khác biệt (chủ) | không xảy ra — config(build), luôn đủ 4 | — | — | 4 ô cố định, 2×2 ở tablet |
| Số liệu nhanh (chủ) | ẩn | 1 ô, không kéo giãn hết hàng | 2–3 ô | 4 ô |
| Hỏi đáp (chủ + tour) | ẩn cả khối | 1 accordion, mở sẵn | xếp dọc | xếp dọc |
| Lưới card `/tour/` | trang không sinh ra (quyết định nền 4) | spotlight ngang | 2–3 cột | 3 cột, hàng cuối lẻ chấp nhận |
| Lối lọc term `/tour/` | ẩn cả cụm | 1 pill — chấp nhận được, nó là bộ lọc chứ không phải nội dung | pill xếp ngang | pill xuống dòng |
| Hành trình (tour) | không xảy ra — gate I14 buộc ≥1 chặng | 1 chặng: **chấm tròn, KHÔNG kéo đường nối** đi xuống hư không | đường nối giữa các chặng | như 2–3 |
| Gồm / không gồm (tour) | ẩn cả khối | 1 cột (khối còn lại ẩn riêng) | 2 cột | 2 cột |
| Điểm nổi bật (tour) | ẩn | 1 dòng | danh sách dọc | danh sách dọc |
| Thanh thông tin nhanh (tour) | ẩn cả thanh | 1 ô trải rộng | cột chia theo **số ô có thật** | tối đa 4 cột |
| Kênh liên hệ (tour) | cả 3 kênh trống → ẩn cả cụm (§2) | 1 kênh | xếp dọc | xếp dọc |
| Tour tương tự (tour) | **ẩn — đúng trạng thái hôm nay** | spotlight ngang | 2–3 cột | 3 cột |

---

## 5. Token đề xuất — 4 mục, không tự thêm

`07-DESIGN_TOKENS` "Quy tắc đổi token": đổi **giá trị** là cửa hai chiều có duyệt; đổi **cấu trúc**
hoặc thêm hệ màu là rebrand. Bốn mục dưới đây là **thêm token có sẵn cấu trúc**, không phải hệ màu mới.

| # | Token đề xuất | Giá trị đề xuất | Vì sao cần | Chỗ đang dùng dự phòng |
|---|---|---|---|---|
| 1 | `--tap-min` | `48px` | Vùng bấm tối thiểu. Hôm nay `SiteHome` dùng `44px`, chỗ khác không khai — hai số cho một thứ. Ngưỡng a11y ≥ 95 của `04-CONSTRAINTS` §3 phụ thuộc mục này | `_pattern.css`: `.btn`, `.channel` |
| 2 | `--focus-ring-w` | `3px` | `07` §1 nói `color.primary` dùng cho "viền focus" nhưng không có token độ dày. Không có token thì mỗi component tự đặt | `_pattern.css`: `a/button/summary:focus-visible` |
| 3 | `--action-bar-h` | `76px` | Thanh hành động cố định trên mobile cần một số để trừ đáy trang, nếu không nội dung cuối bị che | `_pattern.css`: `body.has-actionbar` |
| 4 | **Bốn token nền theo bộ giao diện** | thêm `--c-surface-alt`, `--c-card`, `--c-primary-soft`, `--c-accent-soft` vào hai khối `:root[data-theme='cat-bien']` và `:root[data-theme='ngoc-lam']` | `07` §1b nói "mỗi bộ chỉ đổi bốn token màu gốc", nhưng bốn token nền phụ thì **không** đổi theo. Kết quả: bộ `cat-bien` có nền trang kem `#FDFAF5` còn thẻ và dải xen kẽ vẫn trắng lạnh — trông như hai loại giấy trên cùng một trang | không dùng dự phòng; mockup chấp nhận hiện trạng để chủ dự án nhìn thấy vấn đề |

Mục 4 **không** phải lỗi tương phản (chữ tối trên nền gần trắng, vẫn ≥ 15). Nó là lỗi thẩm mỹ. Đề
xuất giá trị cụ thể chờ chủ dự án cho hướng, vì đó là quyết định bản sắc chứ không phải kỹ thuật.

**Không đề xuất đổi font.** Xem Q6 — có việc phải xử trước.

### 5.1 Cặp màu đã dùng, đối chiếu ngưỡng WCAG AA

Chỉ dùng cặp đã có số đo trong `07` §1b, hoặc cặp suy ra an toàn từ đó:

| Cặp | Dùng ở | bien-sau | cat-bien | ngoc-lam |
|---|---|---|---|---|
| `text` / `surface` | thân bài, tiêu đề | 17.85 | 16.80 | 17.85 |
| `text-muted` / `surface`, `surface-alt` | mô tả card, meta | 7.58 | 7.33 | 7.58 |
| `text-inverse` / `primary`, `primary-strong` | hero, footer | ≥ 9.46 | ≥ 7.27 | ≥ 5.47 |
| `text-inverse` / `accent` | nút CTA | 5.44 | 5.02 | 6.29 |
| `primary` / `primary-soft` | nhãn, tên hub, số liệu | ~8.9 | ~6.9 | ~5.1 |
| `accent-strong` / `accent-soft` | nhãn giá | ~8 | ~7.7 | ~8.3 |
| `sea` / `primary-soft` | nhãn tự nhiên, dấu ✓ | ~5.0 | ~5.0 | ~5.0 |

`--c-sand` chỉ dùng làm **gạch chân trang trí** dưới tiêu đề section và ô đánh dấu trust bar —
**không có chữ nào nằm trên nền sand**, đúng R3 (`sand` với chữ trắng chỉ đạt 3.28).

Chữ trắng trong hero luôn nằm ở **dải dưới** của lớp phủ, nơi lớp phủ đạt 62–100% `primary-strong`.
Không đặt chữ ở dải trên (8%) vì ở đó tương phản phụ thuộc vào ảnh.

Chạy lại số của ba bộ: `npm --prefix scripts run check:theme`.

---

## 6. Câu hỏi cần chủ dự án trả lời — Design DỪNG, không tự đoán

### Q1 — Vùng "Phân loại" (`category`) ở §3: dựng hay bỏ?

**Đây là mục prompt bàn giao yêu cầu nói ra, không được lặng lẽ chọn.**

**Quyết định của Design: không dựng vùng "Phân loại" như một vùng riêng trên trang chi tiết.** Ba lý do:

1. Dữ liệu thật ủng hộ điều đó. Giá trị `category` duy nhất đang có trên tour là
   `cam-nang-du-lich` — một general-category không có trang công khai. Chính §3 ghi:
   *"general-category không render (2.13)"*. Dựng vùng này lên hôm nay chỉ ra được một chữ không link.
2. `category` đã có chỗ đứng có ích: §5.2 "Lối lọc theo term" trên `/tour/` và `/trai-nghiem/`, và
   nó chỉ hiện khi term đủ R2. Đó mới là nơi phân loại giúp khách đi tiếp.
3. §3 đã có sẵn một dòng khác làm đúng việc "cái này là loại gì" trên trang chi tiết: **Nhãn loại
   entity** (`tourFormat`, `experienceType`…). Hai vùng phân loại trên một trang là nhiễu.

**Đề nghị chủ dự án chốt một trong hai:**

- **(a)** Sửa dòng "Phân loại" ở §3 thành: *"chỉ render khi term thuộc bộ có trang công khai (R2); hôm
  nay 0 term đủ điều kiện nên vùng ẩn ở mọi trang chi tiết"* — 9 cảnh báo `g3` chuyển từ "chưa xử"
  sang "trạng thái mong đợi". **Design nghiêng về phương án này**: giữ cửa mở cho khi có term thật.
- **(b)** Bỏ hẳn dòng đó khỏi §3, giao `category` cho §5.2 — 9 cảnh báo biến mất luôn.

Cả hai đều là **sửa `06-BINDING_MAP`**, tức artifact bước 6. Design không tự sửa.

### Q2 — Bốn điểm khác biệt chưa có chỗ trong mô hình dữ liệu

`00-PROJECT_BRIEF` §3 chốt bốn điểm khác biệt (xe đưa đón tận nơi, hướng dẫn viên đi cùng, giá tốt,
thanh toán linh hoạt). **Không field nào trong `01-CONTENT_MODEL` chứa chúng.** R5 cấm bịa field.

Chỗ duy nhất hợp lệ là **trust bar** (§4.1, `config (build)`) — nội dung của nó sống trong code
(`HOME_COPY.trustItems`), không phải Sanity. Hôm nay bốn mục đó vẫn là câu của engine gốc:
*"không quảng cáo, không PR"*, *"liên kết Wikidata, OSM, gov.vn"*, *"biên tập viên người địa phương
kiểm duyệt"* — cam kết của một site tra cứu du lịch, không phải của một công ty bán tour.

**Xin chốt:** đổi nội dung bốn mục trust bar sang bốn điểm khác biệt ở `00` §3? Mockup đang vẽ theo
phương án này. Cách viết đã né dạng so sánh tuyệt đối theo ghi chú pháp lý của `00` §3: viết
**"Giá tốt, báo giá trọn gói"** kèm cam kết kiểm chứng được, **không** viết "giá tốt nhất thị trường".

### Q3 — Bỏ nút "Website chính thức" trên trang tour?

Khi tour chưa có giá, `TourDetail.astro` hiện nút trỏ `operator.url`. Nút này **không đối chiếu được
về dòng nào trong binding map**, và với tour công ty tự vận hành thì nó trỏ vòng về chính tourdao.vn.
Đề xuất bỏ, để cụm Zalo/hotline (§2) làm hành động duy nhất. Xin xác nhận.

### Q4 — Tiêu đề h1 trang chủ

Hôm nay h1 = `brand.name` = "Tour Đảo", còn `siteSettings.heroText` nằm ở dòng nhỏ phía trên.
Một h1 chỉ có tên thương hiệu không nói được site bán gì — vừa yếu cho khách vừa yếu cho tìm kiếm.

**Đề xuất đổi vai hai dòng đã có, không thêm field:** h1 ← `siteSettings.heroText` (biên tập viên tự
sửa trong Studio), dòng nhỏ ← `brand.name`. Mockup đang vẽ theo phương án này. Chạm §5.7 nên xin chốt.

### Q5 — Nút chính ở hero trang chủ

§5.7 pin nút chính vào `destinationHref` (đi `/nha-trang/`) và nút phụ vào mục đầu của `nav`. Trên
một site đặt tour qua Zalo, nút màu accent — theo `07` §1 là "màu của hành động" — lại dẫn sang trang
giới thiệu điểm đến, còn hành động thật (Zalo) thì là nút phụ.

**Đề xuất đảo vai:** nút chính ← mục `kind:'zalo'` của `nav` (đã có sẵn cơ chế tự ẩn khi thiếu
`zaloUrl`, không sinh nút chết); nút phụ ← `destinationHref`. Mockup vẽ theo phương án này.
Chạm §5.7 nên xin chốt.

### Q6 — Font: **file font đang không tồn tại trên site thật**

`07` §2 chép rằng font được self-host và *"File đang có: Be Vietnam Pro 700/800 và Plus Jakarta Sans
500/600/700"*. Kiểm bằng máy: `BaseLayout.astro` khai 10 khối `@font-face` trỏ `/fonts/*.woff2`, còn
**`public/fonts/` không tồn tại và bản build `dist/` không có một file `.woff2` nào**. Nghĩa là site
đang chạy hoàn toàn bằng `system-ui`, chưa bao giờ hiện đúng font đã duyệt.

Vì vậy **Design không đề xuất đổi font** — câu hỏi "có đổi font không" chưa trả lời được khi font đã
duyệt còn chưa từng chạy. **Xin chốt:** đưa đủ file `woff2` vào `public/fonts/` (việc bước 8, có ảnh
hưởng LCP nên cần QA hiệu năng), hay chính thức nhận `system-ui` làm hệ chữ và sửa `07` §2 cho khớp?

### Q7 — Không có giá tại mốc ra mắt 2026-08-09?

`data/prices.yaml` chỉ có phần ghi chú, **0 khoá giá**; tour duy nhất không có `bookingRef`. Theo
quyết định nền 3, hệ quả là trang tour **không có vùng giá và không có nút đặt** — trang thuần nội
dung, chốt đơn bằng Zalo. Mockup đã thiết kế cho đúng trạng thái đó và nó vẫn tử tế.

**Xin xác nhận** đây là chủ ý cho mốc 08-09, hay sẽ nhập giá trước? Nếu nhập, hình dạng hộp có giá đã
vẽ sẵn ở cuối `tour-detail.html`, bước 8 không phải nghĩ thêm.

---

## 7. Lệch phát hiện được khi đọc — ghi lại, **không sửa**

Design không chạm `src/`. Bốn mục dưới đây thuộc bước 8 hoặc thuộc việc nhập liệu, ghi ra để không ai
phải tìm lại.

| # | Lệch | Bằng chứng | Thuộc về |
|---|---|---|---|
| L1 | Trang index rỗng vẫn được sinh, trái quyết định nền 4 của `06` ("nhánh 0 entity không sinh trang index") | `dist/khach-san/index.html`, `dist/resort/index.html`, `dist/luu-tru/index.html` đều tồn tại và in "Chưa có khách sạn nào" | bước 8 |
| L2 | Font 404 — 10 khối `@font-face` trỏ `/fonts/*.woff2`, không có file nào | `public/` chỉ có `_redirects` và `.assetsignore`; `find dist -name '*.woff2'` rỗng | bước 8, xem Q6 |
| L3 | `Tour.duration` chứa chuỗi `ISO 8601` thay vì thời lượng thật; `summary` là hai dòng từ khoá SEO (`"tour 3 đảo nha trang / review tour 3 đảo nha trang"`); `itinerary` chỉ 1 chặng trong khi thân bài mô tả 3 chặng | JSON-LD trên `/tour/tour-3-dao-nha-trang-review-chi-tiet/` | **nhập liệu — việc của chủ dự án trong Studio**, không phải code |
| L4 | h1 của tour là tiêu đề SEO 76 ký tự (*"Tour 3 Đảo Nha Trang: Lịch Trình Chi Tiết, Giá Vé & Kinh Nghiệm Đi Mới Nhất"*), và thân bài chứa H2 trùng vai với heading của template ("Lịch trình tour 3 đảo Nha Trang 1 ngày" nằm trong `body`, cạnh section "Hành trình") | cùng nguồn | nhập liệu |

Mockup vẽ theo **nội dung đúng nên có** (h1 "Tour 3 đảo Nha Trang", summary là một đoạn mở thật) để
chủ dự án thấy trang trông ra sao khi nội dung đã sửa. Bố cục không phụ thuộc vào việc đó.

---

## 8. Tự kiểm bốn điều kiện cổng ra (`GOVERNANCE` 4.3)

| # | Điều kiện ra | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Mọi vùng trên mockup đối chiếu được về một dòng trong `06-BINDING_MAP` | **đạt** | §3 — ba bảng, 21 + 19 + 10 vùng, mỗi vùng một dòng. Vùng không đối chiếu được đã bị bỏ và ghi lý do (nút "Website chính thức", vùng "Phân loại") |
| 2 | Mỗi khối khai trạng thái 1 mục / vài mục / nhiều mục | **đạt** | §4.2 — 16 khối, cộng mốc 0 mục. Bật được bằng mắt qua công tắc "Số mục" |
| 3 | Không giá trị màu hay cỡ chữ nào nằm ngoài token | **đạt** | Mockup `link` thẳng `src/styles/tokens.css`; grep không ra hex, `rgb()`, hay `font-size` bằng số. 4 chỗ `var(--x, dự-phòng)` đều là token đang đề xuất, liệt ở §5 |
| 4 | Ba bộ giao diện đều dùng được | **đạt, có một điểm thẩm mỹ** | Công tắc "Bộ giao diện" đổi `data-theme` như thật. Không bố cục nào phụ thuộc một bộ. Điểm thẩm mỹ: bốn token nền phụ chưa đổi theo bộ — §5 mục 4 |

**Không tự mở cổng sang bước 8.** Chờ chủ dự án duyệt QA1 và trả lời Q1–Q7.

---

## 9. Bàn giao cho bước 8 — dựng gì, không dựng gì

**Dựng:** `_pattern.css` là đặc tả bề mặt. Dịch sang component đã có trong `COMPONENT_INVENTORY`,
**không thêm component mới**:

| Phần trong `_pattern.css` | Component đích |
|---|---|
| `.hero`, `.hero__scrim`, `.hero__title` | `Hero.astro`, `DetailLayout.astro` |
| `.infobar` (số cột theo số ô thật) | `InfoBar.astro` |
| `.grid` + `.card` + quy tắc `:has()` | `Card.astro`, `EntityIndex.astro`, `TourIndex.astro`, `HomeRollupSection.astro` |
| `.booking`, `.channel` | `BookingCTA.astro`, `ContactChannels.astro`, `Sidebar.astro` |
| `.factlist` | `InfoCard.astro` |
| `.timeline`, `.stop` | `TourDetail.astro` |
| `.faq` | `FAQ.astro` |
| `.trust` | `HomeTrustBar.astro` |
| `.hub` | `HomeHubGrid.astro` |
| `.actionbar` | **mới** — thanh hành động mobile; xin chủ dự án duyệt trước vì là bề mặt mới, dù dùng lại đúng hàng binding §2 |

**Không dựng:** `_shell.css`, `_shell.js`, thanh `.mk-chrome`, `.mk-header`, `.mk-footer`,
thuộc tính `data-bind`, `data-density`, `data-hide-when-empty`, khối `.mk-note`. Toàn bộ là khung xem thử.

**Không dựng khi chưa có quyết định:** mọi thứ gắn với Q1–Q7.
