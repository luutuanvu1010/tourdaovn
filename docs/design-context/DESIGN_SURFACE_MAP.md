# BẢN ĐỒ BỀ MẶT — file nào quyết định hiển thị

> **Mục đích:** tài liệu vận hành. Trả lời đúng một câu hỏi — *muốn đổi một thứ trên màn hình
> thì sờ vào file nào* — và dùng làm danh mục tham chiếu khi bàn giao cho tác nhân Design.
>
> **Đây KHÔNG phải nguồn sự thật.** Code là nguồn; file này là bản chỉ đường, và nó **sẽ lệch**
> khi thêm component. Mỗi mục dưới đây kèm **lệnh kiểm lại**. Nghi ngờ thì chạy lệnh, đừng tin
> bảng. Tiền lệ: `DR-043` — một tài liệu ở thư mục gốc báo sai trạng thái suốt chín ngày.
>
> **Soạn:** Cowork, 2026-08-24, đo tại `d31eef3`. **Bổ trợ cho** `COMPONENT_INVENTORY.md`
> cùng thư mục (file đó sinh tự động từ code bằng `npm run gen:design-context`; file này viết
> tay và nói về *tầng lớp*, không lặp lại danh sách props).

---

## 1. Tầng token — sửa ở đây là đổi toàn site

| File | Nắm gì |
|---|---|
| `src/styles/tokens.css` (258 dòng) | **Nguồn token duy nhất.** Màu, chữ, 15 token cỡ, spacing, radius, shadow, motion, breakpoint |
| `src/layouts/BaseLayout.astro` (172 dòng) | **Chỗ nạp chữ.** Bốn `@font-face` (dòng 121–152), một dòng `preload`, `<meta name="theme-color">`, class `.container` |
| `public/fonts/` | 6 file `.woff2`, **89.196 byte payload** |
| `src/lib/siteTheme.ts` (59 dòng) | Đọc `siteSettings.theme` từ Sanity → gắn `data-theme` lên `<html>`; `themeSurface()` nuôi thẻ `theme-color` |

**Ba bộ giao diện** định nghĩa ngay trong `tokens.css`: `:root` là `bien-sau` (mặc định),
`:root[data-theme='cat-bien']` dòng 169, `:root[data-theme='ngoc-lam']` dòng 179. Sửa sắc độ
phải sửa cả ba — không bộ nào được bỏ.

**Đổi bộ chữ là việc hai file, không phải một.** `tokens.css` khai *dùng* font nào
(`--font-display`, `--font-ui`); `BaseLayout.astro` khai *nạp* file nào (`@font-face` +
`preload`). Sửa một bên thì hoặc chữ không đổi, hoặc tải file không ai dùng.

```
# kiểm lại
sed -n '160,185p' src/styles/tokens.css      # ba bộ giao diện
grep -n "@font-face" -A 4 src/layouts/BaseLayout.astro
find public/fonts -name "*.woff2" -exec ls -l {} \;
```

---

## 2. Tầng cấu trúc — khung trang

| File | Nắm gì |
|---|---|
| `src/components/DetailLayout.astro` | **Khung chung mọi trang chi tiết**: thứ tự vùng, hero, sidebar. File then chốt của bố cục trang chi tiết |
| `Hero.astro` · `FactStrip.astro` · `Sidebar.astro` · `Breadcrumb.astro` · `Section.astro` | Các vùng mà `06` §3 khai tên |
| `AttractionDetail` · `TourDetail` · `PlaceDetail` · `ExperienceDetail` · `ArticleDetail` · `LodgingDetail` · `HotelDetail` · `ResortDetail` | Delta từng loại trang theo `06` §4 |
| `Card.astro` · `EntityIndex.astro` · `TermIndex.astro` · `HubIndex.astro` · `NearbySection.astro` · `EmptyState.astro` | Listing và các dải liên quan — **đây là nơi R8 sống** |
| `SiteHome.astro` + 14 component `Home*` | Trang chủ |
| `Header.astro` · `Footer.astro` · `SiteLogo.astro` | Chrome site-wide |
| `BookingCTA.astro` · `PriceDisplay.astro` · `ContactCTA.astro` | Khối hành động và giá |
| `MapView.astro` · `RouteMap.astro` · `Gallery.astro` · `FAQ.astro` | Vùng nội dung chuyên biệt |
| `src/pages/` — 8 file `.astro` | Định tuyến; `[...path].astro` gánh gần hết |

**CSS nằm rải, không tập trung — số này quan trọng khi ước lượng công.**
**58 trên 61** component có `<style>` riêng của nó. Chỉ bốn file không có: `ResortDetail`,
`HotelDetail`, `AuthorityMeta`, `RouteDispatch`. Nghĩa là **không có một file CSS nào sửa một
chỗ ăn cả site**. Đổi token xong vẫn phải rà từng component xem chỗ nào hardcode đè lên token.

```
# kiểm lại
ls src/components/*.astro | wc -l
grep -rl "<style" src/components/ src/layouts/ | wc -l
grep -rL "<style" src/components/ src/layouts/     # bốn file không có style
```

---

## 3. Tầng chữ nghĩa và cấu hình

| File | Nắm gì |
|---|---|
| `src/site.config.ts` (24 KB) | `brand`, `site`, `entities`, `hubs`, `nav`, `staticPages`; entity nào bật/tắt. **Nơi duy nhất khai tên site** (ADR-0021 QĐ8) |
| `src/lib/uiCopy.ts` (1.108 dòng) | Toàn bộ nhãn giao diện |
| `src/lib/siteBranding.ts` · `siteContact.ts` · `siteFooter.ts` | Logo, kênh liên hệ, nội dung footer |
| `src/lib/homepage.ts` | `HOME_COPY` — chữ của trang chủ |

**Nhãn CTA có hai nguồn, đừng nhầm.** Việc đổi nhãn nút trên trang miễn phí (hạng mục 12 của
Design vòng 5) phải nói rõ mình đổi cái nào:

| Nguồn | Giá trị | Ai dùng |
|---|---|---|
| `uiCopy.ts:53` `bookTicket` | **"Đặt vé"** | `AttractionDetail.astro:165` truyền cho `BookingCTA` — **đây là nút đang bị nghi vấn** |
| `uiCopy.ts:829` `PRICE_CTA_LABELS.attraction` | "Mua vé" | `PriceDisplay.astro`, component khác |
| `uiCopy.ts:62` `contactZalo` | "Chat Zalo" | `AttractionDetail.astro:97` — nhãn liên hệ **đã có sẵn** trong kho chữ |

```
# kiểm lại
grep -n "bookTicket\|contactZalo" src/lib/uiCopy.ts
grep -n "ctaLabel" src/components/AttractionDetail.astro
```

---

## 4. Tầng đặc tả và cổng kiểm

| File | Nắm gì |
|---|---|
| `docs/core-specs/06-BINDING_MAP.md` v2.3.1 | Vùng nào chứa field nào; Luật 1–5 |
| `docs/core-specs/07-DESIGN_TOKENS.md` | Bản **mô tả** token — hiện **đang lệch mã**, xem `DR-050` và `DR-051` |
| `docs/design-context/COMPONENT_INVENTORY.md` | Danh sách component + props, **sinh từ code** |
| `docs/design/vong4/` | 11 file `.dc.html`; sáu artboard trang chi tiết là nền của Design vòng 5 chặng 2 |
| `scripts/check-theme-contrast.mjs` | Bộ kiểm tương phản — cổng của R3 |
| `scripts/validators/luat1-post.ts` | Bộ kiểm Luật 1 — cổng của R6 |

**Thứ tự thẩm quyền khi hai bên nói khác nhau:** `06`/`07` là đặc tả, `tokens.css` và component
là mã. Đặc tả thắng về *ý định*; mã thắng về *thứ đang chạy*. Lệch thì ghi phiếu drift, không
âm thầm chọn một bên (`CLAUDE.md` mục 8).

```
# kiểm lại
npm --prefix scripts run check:theme
npm run gen:design-context      # sinh lại COMPONENT_INVENTORY.md
```

---

## 5. Hai việc đang mở, ảnh hưởng thẳng tới bề mặt

**a. `07` §2 mô tả sai bộ chữ và thang cỡ đang chạy** — `DR-050`, `DR-051`. Tiêu đề thật là
Be Vietnam Pro (không phải Nunito như `07` khai); thang chạy 14 giá trị phân biệt trong khi
`07` khai 8, năm bậc chen trong 6px. Cả hai để **mở** có chủ ý, đóng ở lượt V5 sau khi chủ dự
án chốt bộ chữ.

**b. Hai file font 800 ship lên nhưng chưa từng được khai** — `DR-052`.
`public/fonts/be-vietnam-pro-latin-viet-800.woff2` (13.380 B) và `-vietnamese-800.woff2`
(5.144 B) nằm trong thư mục và lên `dist/`, nhưng cả bốn `@font-face` ở `BaseLayout.astro`
chỉ khai `font-weight: 700` cho Be Vietnam Pro. Grep toàn `src/` ra **0** chỗ nhắc hai file đó.

Hai hệ quả: **18.524 byte — 21% ngân sách font — tải lên mà không trình duyệt nào dùng**; và
≥12 component xin `--fw-800`/`--fw-900` trên `--font-display` sẽ bị bôi đậm giả trên dấu tiếng
Việt vì mặt chữ 800 không được khai. Khác `DR-031` (thời Lora kẹp 400–700) — đây là **thiếu
khai cho file đã có sẵn**.

```
# kiểm lại
grep -rn "pro-latin-viet-800\|pro-vietnamese-800" src/ | wc -l     # kỳ vọng 0
grep -n "font-weight" src/layouts/BaseLayout.astro
```
