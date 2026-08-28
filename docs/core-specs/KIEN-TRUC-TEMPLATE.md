# KIẾN TRÚC TEMPLATE — sửa gì thì sửa ở đâu

> Bản đồ file cho tầng giao diện. Mục đích hẹp và rõ: **trả lời "muốn đổi X thì mở file nào"** trong một lần đọc, cho cả người và cho tác nhân AI.
>
> File này **không tạo luật mới**. Luật ở `06-BINDING_MAP` (vùng nào ăn field nào) và `07-DESIGN_TOKENS` (giá trị token). Đây chỉ là bản đồ trỏ đường.

- **Phiên bản:** v1.0.0   **Trạng thái:** soạn 2026-08-29 theo yêu cầu chủ dự án, sau đợt gộp khung `QĐ-2026-08-29-02` và `QĐ-2026-08-29-03`
- **Ngày:** 2026-08-29   **Người soạn:** Cowork   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Liên quan:** `06-BINDING_MAP.md` (hợp đồng vùng ↔ field), `07-DESIGN_TOKENS.md` (nguồn token), `02-SAD.md` §2, `scripts/validators/entity-layout-post.ts` (cổng canh)

---

## 1. Ba tầng — bảng tra nhanh

| Muốn đổi gì | Mở file nào | Ghi chú |
|---|---|---|
| **Thông số**: chiều cao hero, cỡ chữ, màu, khoảng cách, bo góc, bề rộng khung, chiều cao header/thanh dính | `src/styles/tokens.css` | **Nguồn token DUY NHẤT.** Giá trị giao diện viết cứng ngoài file này là vi phạm P6/N7 (`07` mở đầu) |
| **Bố cục trang chi tiết**: thứ tự dải, lưới hai cột, thanh dính, hàng Cập nhật | `src/components/DetailLayout.astro` | Frame chung, xem §2 |
| **Vỏ trang**: `<head>`, header, footer, font, meta/SEO, hreflang | `src/layouts/BaseLayout.astro` | Áp cho **mọi** trang, kể cả trang danh sách |
| **Dữ liệu riêng của một loại entity**: facts nào, jump link nào, sidebar có gì, JSON-LD | `src/components/{Entity}Detail.astro` | Xem §3 |
| **Một khối dùng lại**: hero, dải thông tin nhanh, thẻ, mục có tiêu đề | primitive ở §2.2 | Sửa một chỗ, mọi trang theo |

**Quy tắc một câu:** con số vào `tokens.css`, bố cục chung vào `DetailLayout.astro`, dữ liệu riêng vào file template của entity. Không đảo ba thứ đó cho nhau.

---

## 2. Frame chung: `src/components/DetailLayout.astro`

### 2.1 Thứ tự khối nó quyết định

```
crumb-band  →  title-band  →  Hero  →  sticky-bar  →  summary-band
→  FactStrip  →  two-col ( content-main + Sidebar )  →  NearbySection
```

Mọi trang chi tiết ra đúng thứ tự này. Muốn đổi thứ tự cho **tất cả** entity thì sửa đúng file này, một chỗ.

Hai hành vi tự động đã cài sẵn, đừng dựng lại ở template con:

- `showStickyBar` — không có neo, không có giá, không có CTA thì **không render** thanh dính.
- `showSidebar` — cột phụ rỗng thì lưới thu về một cột (`two-col--solo`), không để rãnh 340px trống. Đây là **R7** ("vùng rỗng ẩn hẳn"), đóng ở `QĐ-2026-08-29-02`.

### 2.2 Primitive dùng chung

| File | Vai |
|---|---|
| `Hero.astro` | Ảnh đầu trang. **Ba biến thể tự chọn theo dữ liệu**: đủ 4 ảnh gallery → mosaic 2 cột; có ảnh chính nhưng thiếu → một ảnh; không ảnh nào → khối gradient. Cả ba cùng chiều cao. Xem §4 |
| `FactStrip.astro` | Dải "Thông tin nhanh". **Cả 13 entity đều dùng** — không còn ngoại lệ từ `QĐ-2026-08-29-03` |
| `Sidebar.astro` | Cột phụ 340px: khối đặt chỗ, bản đồ, liên quan |
| `Breadcrumb.astro` | Dải điều hướng, sinh từ cây URL chứ không từ field entity |
| `NearbySection.astro` | Dải "Gần đây" cuối trang |
| `Section.astro` · `Card.astro` · `FAQ.astro` · `Body.astro` | Mục có tiêu đề, thẻ, câu hỏi thường gặp, thân bài |

---

## 3. Mười ba Entity Type — mỗi loại một file

Tất cả đều **tham chiếu** về frame chung. Không file nào tự vẽ bố cục.

**Đi thẳng qua `DetailLayout` (11):**

`AttractionDetail` · `PlaceDetail` · `ExperienceDetail` · `TourDetail` · `EventDetail` · `RestaurantDetail` · `SpecialtyDetail` · `ArticleDetail` · `OrganizationDetail` · `PersonDetail` · `LodgingDetail`

**Uỷ quyền (2):**

`HotelDetail` → `LodgingDetail` → `DetailLayout`
`ResortDetail` → `LodgingDetail` → `DetailLayout`

Mỗi file chỉ khai bốn thứ: **facts** (ô Thông tin nhanh), **jumpLinks** (neo cho thanh dính), **sidebarSlots** (cột phụ có gì), và **JSON-LD**. Bố cục thì nhận từ frame.

### 3.1 Thêm một Entity Type mới

1. Tạo `src/components/{Ten}Detail.astro`, `import DetailLayout`.
2. Ghi danh vào `scripts/validators/entity-layout-post.ts` — thêm vào `DETAIL_RULES` và `ENTITIES_WITH_FACTSTRIP`.
3. Khai vùng ↔ field ở `06-BINDING_MAP` §4.
4. Nối route ở `src/components/RouteDispatch.astro` và `src/lib/routes.ts`.

**Bỏ bước 2 thì build đỏ** — cổng quét mọi file `*Detail.astro` và chặn file chưa ghi danh. Đó là cố ý.

---

## 4. Hero — nơi hay bị sửa nhầm nhất

**Chiều cao khai ở `tokens.css`, KHÔNG khai trong `Hero.astro`.** File component không giữ con số nào; nó chỉ đọc biến.

```css
--hero-entity-h-min:    330px   /* sàn */
--hero-entity-h-max:    430px   /* trần — đổi ở đây */
--hero-entity-h-tablet: 390px   /* 769–1023px */
--hero-entity-h-mobile: 290px   /* ≤768px */
--hero-entity-h: clamp(min, calc(30vw + 50px), max)
```

Đổi một dòng là **13 loại trang chi tiết cộng trang điểm đến** đổi theo, phủ cả ba biến thể hero. Đã đo, xem `QĐ-2026-08-29-01`.

**⚠ Hai bẫy có thật:**

1. **`--hero-min-h` và `--hero-min-h-mobile` KHÔNG phải hero này.** Chúng của `HomeHero.astro` — hero **trang chủ**, component khác, chiều cao khác. Tên chỉ khác thứ tự từ.
2. **Nâng riêng trần không cho thêm đúng ngần ấy px.** Ở phần lớn khổ màn, số đang trói là `calc(30vw + 50px)` chứ không phải trần. Nâng trần 380→430 chỉ cho **+4px ở 1280** và **+30px ở 1366**. Muốn cao thêm ở mọi khổ thì sửa **số giữa**.

---

## 5. Trang KHÔNG đi qua `DetailLayout`

Bảy loại trang có khung riêng:

`SiteHome` (trang chủ) · `TouristDestinationHub` (điểm đến) · `EntityIndex` · `TourIndex` · `EventIndex` · `HubIndex` · `TermIndex`

Chúng **vẫn dùng chung `tokens.css` và primitive** — đổi `--hero-entity-h` thì trang điểm đến cũng đổi theo. Nhưng **thứ tự dải và lưới thì mỗi loại tự khai**.

Nói thẳng: hiện có **một** frame chung cho trang chi tiết, **chưa** có một frame chung cho mọi loại trang. Gộp bảy loại kia vào một frame là việc lớn, cần phiếu riêng.

---

## 6. Cổng canh tầng này

`scripts/validators/entity-layout-post.ts`, bốn tầng:

| Tầng | Chặn gì |
|---|---|
| 1 — Component selection | Entity detail mới chưa ghi danh, hoặc không đi qua frame chung |
| 2 — Container containment | Element render trần ra ngoài `.container` |
| 3 — FactStrip contract | Entity khai có `FactStrip` mà thiếu đường dẫn tới nó |
| 4 — Hero caller contract | File render `<Hero>` chưa ghi danh, hoặc gọi `<Hero>` mà **thiếu prop `gallery`** |

Chạy tay: `npm --prefix scripts run validate:post`. Đối chiếu token với `07`: `npm --prefix scripts run check:token-parity`.
