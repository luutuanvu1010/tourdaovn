# KIẾN TRÚC TEMPLATE — sửa gì thì sửa ở đâu

> Bản đồ file cho tầng giao diện. Mục đích hẹp và rõ: **trả lời "muốn đổi X thì mở file nào"** trong một lần đọc, cho cả người và cho tác nhân AI.
>
> File này **không tạo luật mới**. Luật ở `06-BINDING_MAP` (vùng nào ăn field nào) và `07-DESIGN_TOKENS` (giá trị token). Đây chỉ là bản đồ trỏ đường.

- **Phiên bản:** v1.0.0   **Trạng thái:** soạn 2026-08-29 theo yêu cầu chủ dự án, sau đợt gộp khung `QĐ-2026-08-29-02` và `QĐ-2026-08-29-03`
- **Ngày:** 2026-08-29   **Người soạn:** Cowork   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Liên quan:** `06-BINDING_MAP.md` (hợp đồng vùng ↔ field), `07-DESIGN_TOKENS.md` (nguồn token), `02-SAD.md` §2, `scripts/validators/entity-layout-post.ts` (cổng canh)

> **File này canh bằng `doc-reality-auditor`, KHÔNG bằng validator.** Phần lớn nội dung dưới đây là phán đoán bằng lời, không phải giá trị so được bằng chuỗi; một cổng chỉ đối chiếu được một danh sách rồi in `[pass]` sẽ tạo tin cậy giả. Danh sách sáu điểm phải đối chiếu nằm trong `.claude/agents/doc-reality-auditor.md`, mục "Phạm vi thứ hai". Chủ dự án chốt 2026-08-29.
>
> Chạy sau khi đổi cấu trúc template, đổi token hero, hoặc thêm/bớt entity type.

---

## 1. Ba tầng — bảng tra nhanh

| Muốn đổi gì | Mở file nào | Ghi chú |
|---|---|---|
| **Thông số**: chiều cao hero, cỡ chữ, màu, khoảng cách, bo góc, bề rộng khung, chiều cao header/thanh dính | `src/styles/tokens.css` | **Nguồn token DUY NHẤT.** Giá trị giao diện viết cứng ngoài file này là vi phạm P6/N7 (`07` mở đầu) |
| **Đầu trang** (breadcrumb, tiêu đề, byline, hero, đoạn mở) của MỌI trang trừ trang chủ | `src/components/PageHead.astro` | Frame chung tầng 1, xem §2.0 |
| **Bố cục trang chi tiết**: lưới hai cột, thanh dính, hàng Cập nhật | `src/components/DetailLayout.astro` | Frame chung tầng 2, xem §2 |
| **Vỏ trang**: `<head>`, header, footer, font, meta/SEO, hreflang | `src/layouts/BaseLayout.astro` | Áp cho **mọi** trang, kể cả trang danh sách |
| **Dữ liệu riêng của một loại entity**: facts nào, jump link nào, sidebar có gì, JSON-LD | `src/components/{Entity}Detail.astro` | Xem §3 |
| **Một khối dùng lại**: hero, dải thông tin nhanh, thẻ, mục có tiêu đề | primitive ở §2.2 | Sửa một chỗ, mọi trang theo |

**Quy tắc một câu:** con số vào `tokens.css`, bố cục chung vào `DetailLayout.astro`, dữ liệu riêng vào file template của entity. Không đảo ba thứ đó cho nhau.

---

## 2.0 Frame chung tầng 1: `src/components/PageHead.astro`

Đầu trang của **mọi loại trang trừ trang chủ** — 6 loại, thêm `DetailLayout`:

```
{breadcrumb?}  →  title-band ( h1 + gạch chân? + byline? )  →  <slot/>  →  summary-band?
```

`<slot/>` nhận thứ nằm giữa dải tiêu đề và đoạn mở: trang chi tiết đưa **hero + thanh dính** vào đó; trang điểm đến đưa **hero + dòng ghi công ảnh**; trang danh sách không đưa gì.

Hai biến thể khai rõ, không giả vờ giống nhau:

| `variant` | Dùng cho | Hình dạng |
|---|---|---|
| `detail` | `DetailLayout`, `TouristDestinationHub` | nền phẳng `--c-surface`, tiêu đề co giãn `clamp(--fs-h3, 4.2vw, --fs-hero)` |
| `index` | `EntityIndex`, `TourIndex`, `TermIndex`, `EventIndex`, `HubIndex` | nền `--c-surface-alt` + viền dưới, tiêu đề `--fs-h1`, có gạch chân, mô tả `--fs-h5` |

**Slot `meta` — dòng byline, KHÔNG nền.** Chữ nhỏ ngay dưới `h1`. Trang cẩm nang dùng cho *chuyên mục · tác giả · ngày đăng*; trang nhãn dùng cho *số kết quả*. Không viền, không hộp, không chiếm dải riêng — chủ dự án chốt 2026-08-29.

**Không áp cho `SiteHome`.** Trang chủ không có breadcrumb, và `h1` của nó là câu định vị thương hiệu chứ không phải tên trang.

## 2. Frame chung tầng 2: `src/components/DetailLayout.astro`

### 2.1 Thứ tự khối nó quyết định

```
PageHead ( crumb-band → title-band → [ Hero → sticky-bar ] → summary-band )
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
| `PageHead.astro` | Đầu trang dùng chung — xem §2.0 |
| `Breadcrumb.astro` | Dải điều hướng, sinh từ cây URL chứ không từ field entity. Gọi qua `PageHead`, không gọi thẳng |
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
--hero-entity-h-min:    380px   /* sàn */
--hero-entity-h-max:    480px   /* trần — đổi ở đây */
--hero-entity-h-tablet: 440px   /* 769–1023px */
--hero-entity-h-mobile: 340px   /* ≤768px */
--hero-entity-h: clamp(min, calc(30vw + 100px), max)
```

Đổi một dòng là **13 loại trang chi tiết cộng trang điểm đến** đổi theo, phủ cả ba biến thể hero. Đã đo, xem `QĐ-2026-08-31-03`.

**⚠ Hai bẫy có thật:**

1. **`--hero-min-h` và `--hero-min-h-mobile` KHÔNG phải hero này.** Chúng của `HomeHero.astro` — hero **trang chủ**, component khác, chiều cao khác. Tên chỉ khác thứ tự từ.
2. **Nâng riêng một số không cho thêm đều ở mọi khổ.** Điểm giao ở `30vw + 100 = 480` ⇒ vw = 1266,67: dải **1024–1266px** thì **số giữa** trói (số giữa < trần, `--hero-entity-h` bằng đúng số giữa); dải **≥1267px** thì **trần** trói (số giữa vượt trần, bị cắt về trần) — **1280 và 1366 đều nằm trong dải trần-trói này**, không phải dải số-giữa-trói. Nâng riêng **trần** (giữ nguyên số giữa) chỉ cho **+4px ở 1280** và **+30px ở 1366**, vì số giữa ở hai khổ đó (484px và 509,8px) đã vượt trần sẵn — nới trần chỉ thả `--hero-entity-h` lên tới đúng mức số giữa cho phép, không lên hết mức trần mới. Ngược lại, nâng riêng **số giữa** (giữ nguyên trần) thì dải ≥1267px **đứng yên**, vì trần vẫn cắt y nguyên. Muốn cao thêm ở **mọi** khổ thì phải dịch **cả năm giá trị** cùng lúc — đúng như `QĐ-2026-08-31-03` đã làm.

---

## 5. Trang không đi qua `DetailLayout`

Sáu loại trang dưới đây **không** dùng `DetailLayout` (chúng không có hai cột, thanh dính hay Thông tin nhanh) nhưng **đều dùng `PageHead`** từ `QĐ-2026-08-29-04`:

`TouristDestinationHub` · `EntityIndex` · `TourIndex` · `EventIndex` · `HubIndex` · `TermIndex`

`EventIndex` và `HubIndex` trước đó **không có `h1` nào**; nay có, nhận `title`/`description` từ `RouteDispatch`.

**Đúng một trang đứng ngoài tất cả: `SiteHome`.** Trang chủ không có breadcrumb, và `h1` của nó là câu định vị thương hiệu. Nó vẫn dùng chung `tokens.css` và các primitive.

## 6. Cổng canh tầng này

`scripts/validators/entity-layout-post.ts`, bốn tầng:

| Tầng | Chặn gì |
|---|---|
| 1 — Component selection | Entity detail mới chưa ghi danh, hoặc không đi qua frame chung |
| 2 — Container containment | Element render trần ra ngoài `.container` |
| 3 — FactStrip contract | Entity khai có `FactStrip` mà thiếu đường dẫn tới nó |
| 4 — Hero caller contract | File render `<Hero>` chưa ghi danh, hoặc gọi `<Hero>` mà **thiếu prop `gallery`** |

Chạy tay: `npm --prefix scripts run validate:post`. Đối chiếu token với `07`: `npm --prefix scripts run check:token-parity`.
