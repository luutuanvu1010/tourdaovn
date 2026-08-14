# SPEC — Hero và Footer tuỳ biến trong Site Settings

- **Trạng thái:** thiết kế đã được chủ dự án duyệt 2026-08-14, thi hành ngay trong phiên.
- **Ngày soạn:** 2026-08-14   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa hai chiều (thêm hai field object vào `siteSettings`, không thêm
  document type, không đổi URL nào — `01-CONTENT_MODEL` §5.3). Riêng việc **chuyển**
  `heroText` thành `hero.eyebrow` có sửa dữ liệu, nên phải sao lưu trước khi chạy (§3.7).
- **Bản ghi:** `QĐ-2026-08-14-03` trong `docs/DECISIONS.md`
- **Repo lúc soạn:** `main` tại `d733890`

---

## 1. Mục tiêu

Biên tập viên **tự đổi được chữ và ảnh của Hero trang chủ và của chân trang** trong Sanity
Studio, không phải nhờ lập trình viên và không phải build lại site.

## 2. Vấn đề

Truy nguồn từng chỗ đang hiện trên Hero và Footer, ra một bức tranh lệch:

| Chỗ hiện | Nguồn hôm nay | Biên tập viên sửa được không |
|---|---|---|
| Eyebrow Hero | `siteSettings.heroText` | được |
| H1 Hero | `brand.headline` (`src/site.config.ts:103`) | **không** |
| Mô tả Hero | `brand.description` (`site.config.ts:94`) | **không** |
| Ảnh nền Hero | `touristDestination.mainImage` | được, nhưng đổi luôn ảnh trang điểm đến |
| Chữ hai nút Hero | `HOME_COPY` / `SITE_COPY` viết cứng | **không** |
| Tagline chân trang | `brand.tagline` qua `uiCopy.ts:149` | **không** |
| Disclaimer chân trang | `uiCopy.ts:156` viết cứng | **không** |
| Dòng bản quyền | `brand.legalName` | **không** |
| Ảnh ở chân trang | chỉ có logo, không còn ảnh nào khác | — |

Hệ quả: một công ty du lịch muốn đổi câu chào trên trang chủ, đổi ảnh bìa theo mùa, hay
treo giấy phép lữ hành ở chân trang đều phải mở một pull request.

## 3. Thiết kế

### 3.1 Ranh giới với `QĐ-2026-08-14-01`, không nới

`QĐ-2026-08-14-01` chốt hôm qua: **chữ** thương hiệu ở lại `src/site.config.ts` vì nó vào
JSON-LD và thẻ meta của mọi trang, phải cố định lúc build. Spec này **không đảo** điều đó.
Nó tách một thứ mà quyết định trước gộp làm một: **chữ máy đọc** và **chữ người đọc**.

| Chuỗi | Ở đâu sau spec này | Vì sao |
|---|---|---|
| `brand.name`, `brand.legalName` | `site.config.ts`, không đổi | `og:site_name`, `Organization` JSON-LD |
| `brand.description` dùng làm `<meta name="description">` | `site.config.ts`, không đổi | Google đọc |
| Đoạn mô tả **hiện trên** Hero | Sanity, rơi về `brand.description` | chỉ người đọc thấy |
| `brand.headline` | Sanity, rơi về `brand.headline` | chỉ là H1, không vào meta hay JSON-LD |
| `brand.tagline` | Sanity, rơi về `brand.tagline` | chỉ là dòng chữ ở chân trang |

Sau spec này, mô tả trang chủ có thể **khác** meta description. Đó là đánh đổi có chủ ý,
không phải sơ suất: giữ meta cố định lúc build là điều kiện để không nới `QĐ-2026-08-14-01`.
Ghi vào §5 để lần sau ai đọc thấy hai câu lệch nhau thì biết là cố tình.

### 3.2 Field `hero`

`siteSettings.hero` — object collapsible, **không ô nào bắt buộc**:

| Ô | Kiểu | Để trống thì |
|---|---|---|
| `eyebrow` | string | rơi về `HOME_COPY[lang].heroEyebrow` |
| `heading` | string | rơi về `brand.headline` |
| `summary` | text (3 dòng) | rơi về `brand.description` |
| `image` | image (hotspot) | rơi về `touristDestination.mainImage` như hôm nay |
| `imageCredit` | string | không hiện dòng ghi nguồn |
| `ctaPrimaryLabel` | string | rơi về `HOME_COPY[lang].heroBookCta` |
| `ctaSecondaryLabel` | string | rơi về `SITE_COPY[lang].destinationCta` |

**Cố ý không có `alt` cho `image`.** Markup hiện tại đã `alt=""` vì đó là ảnh trang trí —
nội dung của Hero nằm ở H1 ngay trên nó. Thêm alt là bắt trình đọc màn hình đọc hai lần
cùng một ý. Cùng lý do đã bỏ `alt` khỏi `branding.logo` (`SPEC-2026-08-14-logo-tuy-bien` §3.6).

**Đích đến của hai nút không đưa vào Studio.** Nút chính vẫn là `contact.zaloUrl`, nút phụ
vẫn là trang điểm đến. Spec này mở chữ trên nút, không mở điều hướng — điều hướng có nguồn
riêng là `ROUTE_MAP` (ADR-0023, DR-007).

### 3.3 Field `footer`

`siteSettings.footer` — object collapsible, **không ô nào bắt buộc**:

| Ô | Kiểu | Để trống thì |
|---|---|---|
| `tagline` | text (2 dòng) | rơi về `uiCopy(lang).footerTagline` |
| `disclaimer` | text (2 dòng) | rơi về `uiCopy(lang).footerDisclaimer` |
| `backgroundImage` | image (hotspot) | nền màu `--c-footer-bg` như hôm nay |
| `badges[]` | array | không hiện dải nào |

Mỗi phần tử `badges[]`:

| Ô | Kiểu | Ghi chú |
|---|---|---|
| `kind` | string, danh sách đóng, **bắt buộc** | `chung-nhan` / `thanh-toan` / `mang-xa-hoi` |
| `image` | image | ảnh của huy hiệu |
| `alt` | string | bắt buộc khi có ảnh — đúng quy ước `partners[].logo` |
| `url` | url, chỉ `http`/`https` | để trống thì ảnh không thành link |

**Một mảng gộp, không ba mảng riêng.** Chứng nhận, logo thanh toán và biểu tượng mạng xã
hội có cùng hình dạng dữ liệu: ảnh + alt + link. Ba mảng riêng là ba khuôn nhập liệu giống
hệt nhau phải bảo trì song song, và code phải viết ba vòng lặp. Ô `kind` gánh việc phân
nhóm, biên tập viên vẫn kéo thả sắp thứ tự tự do trong nhóm của mình.

**Ba thứ cố ý không đưa vào Studio:**

1. **Tiêu đề cột chân trang** (`footerServices`, `footerBrowse`, `footerAboutUs`) — các cột
   này sinh tự động từ `ROUTE_MAP`. Đưa tiêu đề vào Studio là dựng lại nguồn thứ hai cho
   điều hướng, đúng thứ DR-007 vừa dọn xong.
2. **Liên kết mạng xã hội đổ vào `Organization.sameAs`** — vượt khỏi "chữ và ảnh", chạm vào
   thứ Google đọc. Ghi thành nợ ở §5, không làm trong spec này.
3. **Dòng bản quyền** (`brand.legalName` + `brand.foundedYear`) — tên pháp nhân là chữ máy
   đọc theo §3.1.

### 3.4 Luật ngôn ngữ: sáu ô chữ là tiếng Việt

Chủ dự án chốt các ô mới là **một tầng**, không phải object 5 ngôn ngữ như `heroText` cũ.
Lý do: `src/site.config.ts:130` khai `langs = ['vi']`, bốn ngôn ngữ kia chưa build ra trang
nào, nên 5 tầng cho mỗi ô là Studio rậm mà không đổi lấy gì.

Kèm theo là một luật render bắt buộc, viết ra ngay để lúc bật tiếng Anh không phải nhớ lại:

> Sáu ô chữ (`hero.eyebrow`, `hero.heading`, `hero.summary`, hai nhãn nút, `footer.tagline`,
> `footer.disclaimer`) chỉ áp khi `lang === 'vi'`. Với ngôn ngữ khác, code **bỏ qua** giá trị
> Sanity và dùng bản dịch trong `HOME_COPY` / `uiCopy`.

Ảnh và `badges[].alt` thì áp cho **mọi** ngôn ngữ: ảnh không có giọng văn, còn một dòng alt
tiếng Việt vẫn hơn một ảnh không có alt.

### 3.5 Hai đường đọc, không ba

- **Hero** chỉ có trên trang chủ → thêm field vào `siteSettingsQuery()` mà `index.astro` đã
  gọi sẵn. Không thêm đường đọc mới.
- **Footer** nằm trong `BaseLayout`, render ở **mọi** trang → không đi nhờ `config` của trang
  chủ được. Thêm `src/lib/siteFooter.ts` với `fetchSiteFooter()`, cache module-level, đúng
  khuôn `fetchSiteBranding()` và `fetchSiteContact()`.

Đây chính là lý do `queries/siteSettings.ts` đã ghi sẵn trong comment cho `BRANDING_PROJECTION`:
để field ở cả hai nơi thì trang chủ đọc bản này, trang khác đọc bản kia, và hai đường lệch
nhau — N7 cấm đúng chuyện đó.

### 3.6 Cưỡng chế ở tầng render

**Tương phản chữ trên ảnh nền chân trang.** Ảnh phủ `object-fit: cover`; **trên** nó một lớp
`var(--c-footer-bg)` đục **88%**; chữ nằm trên cùng. Màu chữ chân trang được chọn để tương
phản với nền đặc, giữ 88% màu đó thì tỉ lệ gần như không đổi. Ngưỡng nghiệm thu là số:
tương phản chữ chân trang trên ảnh nền **sáng nhất** phải **≥ 4.5:1** (WCAG AA, chữ thường).

**Ảnh badge thiếu `alt`.** Không im lặng bỏ ảnh đi — mất nội dung mà không ai biết là tệ hơn.
Luật: có `url` thì lấy nhãn tiếng Việt của `kind` làm alt (một link không nhãn là lỗi trợ
năng thật); không có `url` thì `alt=""`, coi như trang trí.

**Badge thiếu `image`.** Không render phần tử đó.

### 3.7 Chuyển `heroText` thành `hero.eyebrow`

Có đúng **một** document `siteSettings` (`_id == "siteSettings"`), nên đây là một lệnh patch
trên một document, cùng hạng với đám `cms/_fix-*.mjs` đã có trong repo.

Thứ tự bắt buộc:

1. `node cms/_export-backup.mjs` — sao lưu trước khi đụng dữ liệu.
2. `node cms/_migrate-hero-footer.mjs` — đọc `heroText.vi`, ghi vào `hero.eyebrow`, rồi
   `unset` `heroText`. Chạy cho cả `siteSettings` và `drafts.siteSettings`.
3. Script phải **không đè** nếu `hero.eyebrow` đã có giá trị, và phải in ra rõ nó làm gì.

**Bốn ngôn ngữ kia của `heroText` bị bỏ.** `langs = ['vi']` nên chúng không lên trang nào;
bản sao lưu ở bước 1 là chỗ lấy lại nếu cần. Kèm theo: gỡ `'heroText'` khỏi
`TRANSLATABLE_FIELDS` trong `cms/lib/i18nConfig.ts`.

### 3.8 Vì sao gom vào object thay vì thêm field phẳng

`siteSettings` đã có 12 field cấp cao nhất. Thêm 11 ô phẳng nữa là một danh sách 23 mục
không nhóm, và ô Hero mới sẽ nằm cách `heroText` cũ vài chục dòng — biên tập viên phải nhớ
"Hero có ở hai chỗ". Gom vào `hero` và `footer` rồi kéo `heroText` vào cùng thì mở một nhóm
là thấy đủ, không sót ô nào ở nơi khác.

### 3.9 File chạm

| File | Việc |
|---|---|
| `cms/schemas/siteSettings.ts` | thêm `hero`, `footer`; gỡ `heroText` |
| `cms/lib/i18nConfig.ts` | gỡ `'heroText'` khỏi `TRANSLATABLE_FIELDS` |
| `cms/_migrate-hero-footer.mjs` | **mới** — chuyển dữ liệu §3.7 |
| `src/lib/queries/siteSettings.ts` | thêm hình chiếu `hero`; thêm `FOOTER_PROJECTION` |
| `src/lib/siteFooter.ts` | **mới** — `fetchSiteFooter()` |
| `src/lib/types.ts` | `SiteHero`, `SiteFooter`, `SiteFooterBadge`; sửa `SiteSettingsResult` |
| `src/components/SiteHome.astro` | nối 7 ô Hero + lớp dự phòng |
| `src/components/Footer.astro` | nối tagline, disclaimer, ảnh nền, dải badge |
| `src/components/FooterBadges.astro` | **mới** |
| `docs/core-specs/01-CONTENT_MODEL.md` | §2.15 lên v1.0.18 |
| `docs/DECISIONS.md` | `QĐ-2026-08-14-03` |

## 4. Tiêu chí nghiệm thu

Kiểm được, đặt ra trước khi thi công:

1. `npm run build` xanh (`astro check` không lỗi kiểu).
2. **Để trống toàn bộ ô mới → trang chủ và chân trang hiện y hệt trước spec này.** Đây là
   tiêu chí quan trọng nhất: lớp dự phòng phải gánh đủ, không ô nào để trống làm vỡ trang.
3. Nhập `hero.heading` → H1 trang chủ đổi theo; `<meta name="description">` **không** đổi.
4. Nhập `hero.image` → ảnh nền Hero đổi; ảnh trang `/nha-trang/` **không** đổi.
5. Thêm 3 badge khác `kind` → chân trang hiện 3 nhóm đúng thứ tự chứng nhận → thanh toán →
   mạng xã hội; xoá hết badge → không còn dải nào, không còn đường kẻ mồ côi.
6. Bật `footer.backgroundImage` bằng một ảnh sáng → đo tương phản chữ chân trang ≥ 4.5:1.
7. Sau migration: `heroText` không còn trong document; eyebrow trên trang chủ vẫn đúng chữ cũ.
8. Studio deploy xong, mở `tourdao.sanity.studio` thấy hai nhóm "Hero trang chủ" và
   "Chân trang"; `heroText` không còn.

## 5. Còn nợ

- **Mô tả Hero và meta description có thể lệch nhau.** Cố ý, theo §3.1 — điều kiện để không
  nới `QĐ-2026-08-14-01`. Không có kiểm máy nào bắt việc hai câu lệch. Đang dựa kỷ luật.
- **`Organization.sameAs` chưa lấy từ `badges[kind == 'mang-xa-hoi'].url`.** Bỏ lỡ một lợi
  ích SEO thật. Để lại vì nó chạm JSON-LD, cần một quyết định riêng.
- **Schema Studio lệch bản đã deploy không có kiểm máy nào bắt.** Cùng hạng nợ với
  `QĐ-2026-08-14-01`. Đang dựa kỷ luật: sửa schema thì phải chạy `npm --prefix cms run deploy`.
- **Bốn ngôn ngữ của `heroText` bị bỏ khi migrate.** Chỉ lấy lại được từ bản sao lưu §3.7.
