# SPEC — Logo tuỳ biến trong Site Settings

- **Trạng thái:** thiết kế đã được chủ dự án duyệt 2026-08-14, thi hành ngay trong phiên.
- **Ngày soạn:** 2026-08-14   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa hai chiều (thêm một field object vào `siteSettings`, không thêm
  document type, không đổi URL nào — `01-CONTENT_MODEL` §5.3). Revert bằng một commit.
- **Bản ghi:** `QĐ-2026-08-14-01` trong `docs/DECISIONS.md`
- **Repo lúc soạn:** `main` tại `59cab03`

---

## 1. Mục tiêu

Biên tập viên **tự đổi được logo trong Sanity Studio**, không phải nhờ lập trình viên.

## 2. Vấn đề

Bốn thứ, cùng một gốc — nhận diện thương hiệu chưa bao giờ được đặc tả:

1. **Logo là SVG viết cứng, chép hai bản** — `src/components/Header.astro:57` và
   `src/components/Footer.astro:48`. Đổi logo phải sửa code; sửa một bản quên bản kia là
   header và chân trang lệch nhau mà không cổng nào bắt. Đúng cơ chế đã sinh ra DR-007.
2. **Favicon 404 trên mọi trang.** `src/layouts/BaseLayout.astro:40-41` trỏ `/favicon.svg`,
   `public/` không có file đó. Lỗi này đang sống trên production.
3. **`Organization` JSON-LD không có `logo`** (`src/pages/index.astro:54`) — Google khuyến
   nghị có cho nhận diện thương hiệu.
4. **Không có ảnh chia sẻ mặc định.** `BaseLayout` nhận prop `ogImage` nhưng chỉ vài trang
   truyền; những trang còn lại dán lên Facebook/Zalo ra thẻ trắng.

## 3. Thiết kế

### 3.1 Ranh giới chữ / ảnh

`ADR-0021` QĐ8 nói tên site **không** nằm trong Sanity. Spec này không nới điều đó — nó vẽ
rõ một đường: **chữ** thương hiệu ở `src/site.config.ts` (vào JSON-LD và meta mọi trang,
phải cố định lúc build), **ảnh** thương hiệu ở Sanity (chỉ tham chiếu bằng URL). Bảng đầy đủ
ở `QĐ-2026-08-14-01`.

### 3.2 Field mới

`siteSettings.branding` — object, bốn ô, **không ô nào bắt buộc**:

| Ô | Kiểu | Vai |
|---|---|---|
| `logo` | image (SVG/PNG/WebP) | dấu hiệu ở header và chân trang. **Không có `alt`** — xem §3.5 |
| `hideWordmark` | boolean | ẩn chữ tên site cạnh logo, khi ảnh đã có sẵn chữ |
| `favicon` | image (PNG/SVG) vuông ≥512 | biểu tượng tab trình duyệt |
| `ogImage` | image 1200×630, có `alt` | ảnh chia sẻ mặc định |

Tên field là `branding`, **không phải `logo`** — lý do ở §3.6.

### 3.3 Lớp dự phòng là file thật

Không ô nào trống làm vỡ trang, và lớp dự phòng không phải chuỗi rỗng mà là hình thật:

- `src/components/SiteLogo.astro` giữ khối SVG mặc định (chính khối đang nằm trong Header
  và Footer, dời vào một chỗ);
- `public/favicon.svg` là file mới, cùng hình, màu lấy từ bộ mặc định "Biển sâu" trong
  `tokens.css`. **Đóng lỗi favicon 404 vô điều kiện** — kể cả khi Sanity chưa có gì.

Dataset trống thì site dựng **đúng như trước** đợt sửa này.

### 3.4 Hai chỗ cưỡng chế ở tầng render

Không trông vào việc biên tập viên nhớ:

- Bật `hideWordmark` mà chưa tải logo → chữ tên site **vẫn hiện**. Không có đường nào ra
  cụm thương hiệu trắng trơn.
- Logo SVG → `imageUrl()` trả URL gốc, không tham số. Sanity CDN không biến đổi được SVG;
  gắn `?w=` vào chỉ làm người đọc tưởng ảnh đã được đổi cỡ. Cần phân biệt được thì truy vấn
  phải deref `mimeType` — xem `BRANDING_PROJECTION` trong `src/lib/queries/siteSettings.ts`.

### 3.5 Một đường đọc, không hai

`branding` **không** nằm trong `siteSettingsQuery()`. Nó chỉ được đọc qua
`src/lib/siteBranding.ts` — Header, Footer, BaseLayout và cả JSON-LD trang chủ đều gọi cùng
một hàm, cùng một cache module-level.

Bản đầu của đợt này để nó ở **cả hai** nơi, và nghiệm thu bắt được hậu quả ngay: header hiện
logo mà `Organization.logo` trong JSON-LD trống, vì trang chủ đọc bản trong
`siteSettingsQuery()` còn header đọc bản kia. Hai đường đọc cho cùng một giá trị là đúng thứ
N7 cấm — và ở đây nó lệch ngay lần thử đầu, không phải "có thể lệch sau này".

### 3.6 Cố ý không có `alt` cho `logo`

Khác `partners[].logo` ngay dưới nó trong cùng schema. Logo nằm trong thẻ `<a>` đã mang
`aria-label` "về trang chủ"; thêm alt là trình đọc màn hình đọc hai lần cùng một thứ. Ghi ra
để lần rà I12 sau không tưởng là sót. `ogImage` thì **có** `alt` — đó là ảnh nội dung, và
`og:image:alt` là thẻ thật.

### 3.7 Vì sao tên field là `branding`

`scripts/meta-validators/g1` có `AMBIGUOUS_SUB_FIELDS.siteSettings` chứa sẵn `'logo'` (vì
`partners[].logo`). Đặt tên field top-level là `logo` thì G1 coi nó là sub-field và **bỏ qua
im lặng** — cổng "schema Sanity phải khớp CONTENT_MODEL" mất răng đúng ở field vừa thêm.
Đây là loại hỏng tệ nhất: cổng vẫn xanh, vẫn báo pass, mà không kiểm gì.

### 3.8 File chạm

| Tầng | File |
|---|---|
| Spec | `01-CONTENT_MODEL.md` §2.15 (v1.0.17), `06-BINDING_MAP.md` §2, `DECISIONS.md` |
| Studio | `cms/schemas/siteSettings.ts`, `cms/lib/fieldLabels.ts` |
| Cổng | `scripts/meta-validators/g1-content-model-vs-schema.ts` (thêm sub-field mới) |
| Dữ liệu | `src/lib/types.ts`, `src/lib/queries/siteSettings.ts`, `src/lib/siteBranding.ts` (mới), `src/lib/sanity-image.ts` |
| Bề mặt | `src/components/SiteLogo.astro` (mới), `Header.astro`, `Footer.astro`, `src/layouts/BaseLayout.astro`, `public/favicon.svg` (mới) |
| JSON-LD | `src/pages/index.astro`, `src/pages/[lang]/index.astro` |

## 4. Tiêu chí nghiệm thu

Đặt trước khi làm, kiểm được bằng hành vi quan sát được:

1. `npm run check` — 0 lỗi.
2. `npm --prefix scripts run audit:spec` — g1, g3, g4 pass. g1 đỏ nghĩa là schema và
   CONTENT_MODEL lệch nhau, tức spec chưa được cập nhật.
3. `npm run build` rồi `npm run gate` — post-validator xanh, gồm `jsonld-post` (I6).
4. **Ca rỗng:** dataset chưa có `branding` → header và chân trang hiện **đúng hình như
   trước** đợt sửa; `/favicon.svg` tải 200 (trước đây 404).
5. **Ca đủ:** tải logo, favicon, ảnh chia sẻ trong Studio → header/chân trang hiện logo mới;
   `<link rel="icon">` trỏ `cdn.sanity.io`; `og:image` có mặt; JSON-LD `Organization` có `logo`.
6. **Ca SVG:** logo `.svg` → URL trong HTML **không** có `?w=`, ảnh vẫn hiện.
7. **Ca người dùng sai:** bật `hideWordmark` mà không có logo → chữ tên site vẫn hiện.

## 5. Còn nợ

Không có kiểm máy nào bắt việc `public/favicon.svg` bị xoá — nó sẽ lại thành 404 im lặng
đúng như trước. Đang dựa kỷ luật, ghi vào `QĐ-2026-08-14-01`.
