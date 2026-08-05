# 08-QA_CHECKLIST.md — Spec cổng QA1

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Nguồn: nhatrangtravel/project/08-QA_CHECKLIST.md · Nhóm A (tái dùng CAO)
Quy trình QA độc lập + audit binding/token/schema/interactive. Quy trình gần như site-agnostic.
Phần riêng site cần thay khi copy đi (tìm 🔧 SITE-SPECIFIC):
  - Giá trị màu cụ thể (#C2410C cam, #F5A623 sand, #E8654E coral, #FBF8F3 nền kem).
  - Tên font (Be Vietnam Pro, Plus Jakarta Sans).
  - Danh mục entity thương mại + "6 entity có bookingRef".
Phần KHÔNG nhãn (quy trình QA, audit orphan/coverage, audit field schema, OG/interactive) = khuôn.
═══════════════════════════════════════════════════════════════════ -->

> **Cổng:** QA1 — Design → Code. **Vai:** QA (kiểm chứng độc lập). **Nguồn quyền:** GOVERNANCE.md §4.3. Chạy sau mỗi lần xuất mockup. Agent QA không được là agent đã soạn mockup.
>
> 🔧 **SITE-SPECIFIC:** mọi giá trị màu (mục B) và tên font là token của nhatrangtravel. Giữ *cấu trúc audit token*; thay *giá trị* theo `07-DESIGN_TOKENS` của site.

---

## A. Audit binding map — mọi vùng phải có nguồn dữ liệu

### A1. Kiểm tra phủ (coverage)

Với mỗi loại trang được mockup, rà từng vùng trong bảng tương ứng của 06-BINDING_MAP.md:

- [ ] Mọi vùng **bắt buộc** (có đánh dấu "có" trong cột Bắt buộc?) — có mặt trong mockup không?
- [ ] Mọi vùng **nên có** — nếu mockup không hiện, có ghi chú lý do không?
- [ ] Mọi vùng **tùy** — nếu rỗng, đã ẩn hẳn (không placeholder) không?

### A2. Kiểm tra vùng mồ côi (orphan)

- [ ] Mỗi phần tử giao diện trong mockup — tra ngược được về một dòng trong 06-BINDING_MAP.md không?
- [ ] Nếu có vùng chỉ là decor (wave divider, stamp, search bar giả...), đã ghi rõ `config (build)` hoặc `decor` chưa?
- [ ] Không có vùng nào dùng dữ liệu không tồn tại trong 01-CONTENT_MODEL.md.

### A3. Kiểm tra vùng giá

- [ ] Entity thương mại (Tour, Experience, Hotel, Resort, Attraction bán vé, Event bán vé) — vùng giá + CTA có mặt không?
- [ ] Entity không thương mại (Place, Article, Person, Organization, Specialty, Restaurant) — KHÔNG có vùng giá.
- [ ] Hotel/Resort: giá dạng "từ X, cập nhật [ngày]" (I16, quyết định nền 9 của 01).
- [ ] Tour/Experience: giá trực tiếp kèm đơn vị (vd: "550.000₫/người").
- [ ] Entity chưa nối bookingRef: vùng giá ẨN HẲN, không CTA giả (quyết định nền 3 của 06).

### A4. Kiểm tra các loại trang còn thiếu

- [ ] Đã mockup đủ các loại trang ưu tiên cao chưa? Ưu tiên: Homepage, Place, Tour, Hotel, Article, Attraction, Experience.
- [ ] Nếu thiếu loại trang nào, đã ghi phiếu nợ chưa?

---

## B. Audit token — accent, màu, chữ

### B1. Accent cam (#C2410C)

- [ ] Accent cam CHỈ xuất hiện ở: nút CTA, nhãn giá, vùng giá trang chi tiết, nút gọi điện.
- [ ] KHÔNG có accent cam ở: heading, body text, badge, section title, highlight, FAQ, breadcrumb, timeline marker.
- [ ] Mọi `.btn-primary`, `.price-tag`, `.book-price` dùng đúng `--c-accent`.

### B2. Accent sand (#F5A623)

- [ ] Sand CHỈ xuất hiện ở: section underline, timeline dot, highlight marker, badge nền (với chữ tối), icon decorative.
- [ ] KHÔNG có sand ở: nút, CTA, chữ trên nền sáng (ratio 1.91:1 fail AA).
- [ ] Mọi `.sec-title::before`, `.hl-marker`, `.tl-stop.featured .tl-dot` dùng đúng `--c-sand`.

### B3. Coral (#E8654E)

- [ ] Coral dùng cho stamp, decorative fill — KHÔNG làm chữ trên nền kem (ratio 3.1:1 fail AA).
- [ ] Nếu có coral text, nó nằm trên nền tối (primary-strong, primary).

### B4. Nền trang

- [ ] `body` background = `--c-surface` (#FFFFFF).
- [ ] Khối xen kẽ dùng `--c-surface-alt` (#F8FAFC), không dùng nền kem.

> **DR-003 đã giải 2026-08-06.** Mục này trước đây đòi nền kem #FBF8F3 và cấm nền trắng thuần, mâu thuẫn với `07-DESIGN_TOKENS` §1. Chủ dự án chốt **nền trắng**; `07-DESIGN_TOKENS` thắng, mục này sửa theo.

### B5. Typography

- [ ] Heading (h1-h5) dùng `--font-display` (Be Vietnam Pro), weight 700-900.
- [ ] Body, label, badge dùng `--font-ui` (Plus Jakarta Sans), weight 500-700.
- [ ] Không có font nào khác ngoài hai font này.

### B6. Giá trị token cứng

- [ ] Mọi giá trị màu trong HTML đều tham chiếu `var(--c-*)` — không có hex cứng ngoài `:root`.
- [ ] Mọi giá trị spacing dùng `var(--s*)` — không có px cứng ngoài `:root`.
- [ ] Mọi radius dùng `var(--radius-*)`.

---

## C. Audit credit ảnh và dữ liệu giả định

### C1. Image credit

- [ ] Mọi trang có ảnh chính (hero hoặc gallery chính) — có dòng credit từ imageProvenance không?
- [ ] Credit format: "Ảnh: [tên] — [mô tả], [năm]", font 11px italic, color text.muted.

### C2. Dữ liệu không có nguồn

- [ ] Có rating stars, review count, "bestseller", số liệu thống kê nào không trỏ về field 01 không?
- [ ] Nếu có, đã gắn cờ ⚠ PLACEHOLDER và comment HTML giải thích chưa?
- [ ] Có con số giá nào hardcode không qua prices.yaml không? (Tất cả giá trong mockup phải có comment "từ prices.yaml" hoặc được gắn cờ placeholder.)

---

## D. Audit nhất quán giữa các trang

### D1. Cấu trúc trang

- [ ] Breadcrumb hiển thị nhất quán (cùng font, cùng màu, cùng separator).
- [ ] Hero pattern nhất quán: nếu dùng gallery làm visual chính (Tour, Hotel), phải ghi chú trong DESIGN.md §5.10.
- [ ] Section divider nhất quán: tất cả dùng cùng một pattern (border-top hay border-bottom, cùng màu).

### D2. Component reuse

- [ ] Button dùng chung CSS class `.btn` — không có button style riêng cho từng trang.
- [ ] Card dùng chung CSS class `.card` — không có card style riêng.
- [ ] Badge dùng chung CSS class `.badge` — không badge style riêng.
- [ ] Nếu một trang có component variant, variant đó có mặt trong DESIGN.md §5 không?

### D3. Responsive

- [ ] Tất cả các trang có media query cho 1023px, 768px, 480px không?
- [ ] Trên mobile, phần tử quan trọng (giá, CTA, heading) vẫn readable không?
- [ ] Gallery Airbnb collapse về 1 ảnh trên mobile (768px).

---

## E. Audit accessibility

- [ ] `prefers-reduced-motion: reduce` có mặt trong mọi file mockup không?
- [ ] Alt text cho ảnh (dù là placeholder) có mặt không?
- [ ] HTML semantic: breadcrumb trong `<nav>`, heading có thứ bậc đúng.
- [ ] Không có text nhỏ hơn 11px (badge là floor).

---

## F. Phiếu nợ sau audit

Sau mỗi đợt audit, ghi lại những thứ chưa sửa được:

| # | Mô tả | Mức | Trang liên quan | Sẽ sửa khi |
|---|---|---|---|---|
| | Các lỗi chưa fix được | cao/tb/thấp | | |

---

## G. Báo cáo QA1 (đầu ra bắt buộc)

Sau khi audit, xuất báo cáo dạng bảng. Đây là bằng chứng E2/E3 cho cổng QA1.

| Cột | Nội dung |
|---|---|
| ID | Số thứ tự lỗi (F1, F2...) |
| Mục audit | A1, A2, B1... (trỏ về mục trong checklist này) |
| Mô tả | Lỗi cụ thể, kèm dòng code hoặc vùng bị ảnh hưởng |
| Mức | **Cao** (chặn cổng — phải sửa trước khi qua QA1) / **Trung bình** (cần sửa hoặc ghi phiếu nợ) / **Thấp** (nên sửa, không chặn cổng) |
| File | Mockup nào bị ảnh hưởng |
| Trạng thái | Chưa sửa / Đã sửa / Phiếu nợ (kèm ID phiếu nợ) |

**Tiêu chí đậu QA1:**
- [ ] 0 lỗi mức Cao
- [ ] Mọi lỗi Trung bình đã sửa hoặc ghi phiếu nợ có ID
- [ ] 4 mockup hiện tại (Homepage, Place, Tour, Hotel) đều có mặt trong báo cáo
- [ ] Báo cáo có chữ ký của QA agent (tên agent + timestamp)

**Tiêu chí trượt QA1:** Bất kỳ lỗi Cao nào chưa sửa → cổng không mở. Code không chạy.

---

## G2. Audit code artifact (schema `.ts`, component `.astro`)

Áp khi artifact QA1 là code (không phải mockup HTML). Cùng cổng QA1, cùng quy trình spawn agent độc lập. Phần này bổ sung cho A→F — khi audit mockup thì dùng A→F, khi audit code thì dùng G2.

### G2.1. Audit phủ field — mọi field phải có nguồn trong CONTENT_MODEL

- [ ] Mỗi `defineField` trong file `.ts` — tra ngược được về một dòng trong `01-CONTENT_MODEL.md` không?
- [ ] Có field nào bịa không? (có trong `.ts` nhưng không có trong CONTENT_MODEL)
- [ ] Có field nào thiếu không? (có trong CONTENT_MODEL cột Bắt buộc = "có" nhưng thiếu trong `.ts`)
- [ ] Kiểu dữ liệu trong `.ts` có khớp mapping trong `08-SCHEMA_PLAN.md` §2 không? (string → string, enum → options.list, portable text → array of block...)

### G2.2. Audit enum — mọi enum phải đóng

- [ ] Mọi enum dùng `options.list` — không có `type: 'string'` tự do cho field enum
- [ ] Số giá trị trong `options.list` khớp CONTENT_MODEL không?
- [ ] Tên value khớp chính tả CONTENT_MODEL không? (dấu gạch ngang, viết hoa)

### G2.3. Audit reference — target type phải khớp quan hệ

- [ ] Mọi `reference` có `to: [{type: '...'}]` khớp bảng quan hệ trong CONTENT_MODEL §3 không?
- [ ] Không reference nào thiếu target type
- [ ] Không reference nào thừa target type ngoài CONTENT_MODEL

### G2.4. Audit i18n — đúng chiến lược document-level vs field-level

- [ ] Article: có field `language` + `translationGroup`, KHÔNG dùng plugin field-level
- [ ] 13 entity còn lại: field dịch là object localized `{vi,en,zh,ko,ru}` theo `baseFields`, KHÔNG plugin; `@sanity/language-filter` lo UX (KHÔNG phải `document-internationalization`, KHÔNG phải `internationalized-array`)
- [ ] Field không dịch (geo, sameAs, enum, reference) KHÔNG bọc localized (không thành object ngôn ngữ)

### G2.5. Audit bookingRef — đúng entity

- [ ] Chỉ 6 entity có bookingRef: Attraction, Experience, Hotel, Resort, Tour, Event
- [ ] Các entity khác TUYỆT ĐỐI không có bookingRef

### G2.6. Audit ràng buộc prompt — R1–R7

- [ ] R1: 0 field ngoài CONTENT_MODEL
- [ ] R2: Enum đóng (options.list)
- [ ] R3: i18n đúng chiến lược
- [ ] R4: Validation gate publish — field bắt buộc có `Rule.required()`
- [ ] R5: Reference target khớp quan hệ
- [ ] R6: bookingRef đúng entity
- [ ] R7: baseFields và lodgingBase dùng spread (không copy-paste)

---

## H. Tích hợp vào workflow

File này là spec của cổng QA1 (GOVERNANCE.md §4.3). Quy trình:

**Mockup HTML:** `Xuất mockup → QA agent → Audit A→F → Báo cáo G → Sửa lỗi → Cổng QA1 mở`

**Code artifact (.ts, .astro):** `Viết code → QA agent → Audit G2 → Báo cáo G → Sửa lỗi → Cổng QA1 mở`
```

File này cũng có thể dùng làm prompt cho một agent audit độc lập — giao file mockup + 06-BINDING_MAP + DESIGN.md, yêu cầu agent điền checklist này.

Để đưa vào CLAUDE.md: thêm một dòng ở mục 6 (Nghi thức phiên làm việc): "Sau mỗi lần xuất mockup, chạy `project/08-QA_CHECKLIST.md` — Claude tự audit hoặc spawn agent audit độc lập."

---

## G3. Audit interactive behavior và cross-cutting concerns

Áp sau G2, trước khi push. Audit hành vi thực tế của UI — những thứ static analysis không bắt được. Có thể tự audit hoặc spawn agent độc lập.

### G3.1. Interactive elements — mọi nút/control phải hoạt động

- [ ] Mọi `<button>` — bấm vào có phản ứng gì không? Nếu có `aria-label`, hành vi có khớp label không?
- [ ] Mobile menu (hamburger) — bấm vào mở được không, chọn link có đóng menu không, bấm Escape có đóng không?
- [ ] `<details>`/`<summary>` — mở/đóng được không?
- [ ] Form (nếu có) — submit có handler không?
- [ ] Không có nút chết (hiển thị như interactive nhưng không làm gì).

### G3.2. Fragment ID — mọi `href="#id"` phải có target

- [ ] Mọi `href="#..."` — grep ngược xem có phần tử nào mang `id` tương ứng không?
- [ ] Skip link — target có tồn tại và là phần tử chứa nội dung chính không?

### G3.3. Social preview — mọi trang phải có OG tags

- [ ] Mọi trang có `<meta property="og:title">` không?
- [ ] Mọi trang có `<meta property="og:description">` (nếu có description) không?
- [ ] Mọi trang có `<meta property="og:url">` không?
- [ ] Trang nào có ảnh chính — có `og:image` không?
- [ ] Có `<meta name="twitter:card">` không?

### G3.4. Cross-component contract — component này không assume component kia

- [ ] Fragment ID trong component A có target trong component B không?
- [ ] CSS class dùng chung (`.container`, `.card`) — không bị redefine khác padding/margin giữa các file?
- [ ] Token CSS dùng trong component có được định nghĩa trong `tokens.css` không?

### G3.5. Responsive sanity check

- [ ] Ở mobile (< 768px): nội dung chính có readable không, không có overflow ngang?
- [ ] Navigation có thể truy cập được ở mọi breakpoint không?
- [ ] Không có text bị cắt, ảnh bị méo ở breakpoint nào?

### G3.6. Config file — không có SPA pattern trong SSG project

- [ ] `wrangler.toml` không có `/* → /index.html 200`
- [ ] `_redirects` / `_headers` (nếu có) không chứa SPA catch-all
