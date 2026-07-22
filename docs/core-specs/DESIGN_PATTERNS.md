# DESIGN PATTERNS — Nha Trang Travel

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Nguồn: nhatrangtravel/project/DESIGN_PATTERNS.md · Nhóm B (component library hiếm — code thật)
Khuôn tái dùng: 5 luật nền (container-first, token-first, spacing system, hai accent, dual font),
17 pattern UI thực dùng cho bất kỳ site du lịch nào (booking card sticky, timeline tour,
author box, summary block, hero mosaic...).
Phần riêng site cần thay (tìm 🔧 SITE-SPECIFIC):
  - Giá trị token cứng trong code mẫu (màu, font), nội dung ví dụ Nha Trang.
  - Đường dẫn tham chiếu (src/styles/tokens.css, project/DESIGN.md, project/06-BINDING_MAP.md)
    trỏ vào repo nhatrangtravel; trong Core, binding tương ứng ở docs/core-specs/06-BINDING_MAP.md.
Phần KHÔNG nhãn (5 luật nền, cấu trúc 17 pattern) = khuôn.
═══════════════════════════════════════════════════════════════════ -->

> Catalog pattern thiết kế cho mọi trang entity detail. Mỗi pattern = nguyên lý + code mẫu thật từ repo + biến thể được phép. Dùng như cẩm nang khi sáng tạo giao diện mới: chọn pattern, tuỳ chỉnh trong khung, không phát minh lại.
>
> 🔧 **SITE-SPECIFIC:** giá trị token trong code mẫu và nội dung Nha Trang là ví dụ. Giữ *5 luật nền + 17 pattern*; thay *giá trị token + nội dung* theo site.
>
> **Ngày:** 2026-06-30
> **Nguồn token:** `src/styles/tokens.css` (27 token CSS), `project/DESIGN.md` (27 token design)
> **Nguồn luật:** `project/06-BINDING_MAP.md` (container policy, bố cục vùng), `scripts/validators/entity-layout-post.ts` (containment guard)

---

## 0. Nguyên lý nền — 5 luật bất biến

Mọi sáng tạo giao diện trong dự án này phải tuân 5 luật. Vi phạm một luật = pattern không hợp lệ.

### L0 — Container first

Mọi element visible trong trang detail phải nằm trong `<div class="container">`. Không element trần. Container có `max-width: 1200px` và `padding: 16px` hai bên — nó là khung chứa duy nhất.

```
Sai:  <div class="hero">...</div>            ← không container
Đúng: <div class="container"><div class="hero">...</div></div>
```

Component tự bọc container hoặc được bọc bởi primitive đã có container (Hero, Section, FAQ, Gallery). Chi tiết: `06-BINDING_MAP.md` mục Container policy.

### L1 — Token-first, không hardcode

Mọi giá trị spacing, màu, font, radius, shadow phải qua token CSS. Không `padding: 20px`, không `color: #333`, không `border-radius: 8px` — chỉ `var(--s5)`, `var(--c-text)`, `var(--radius-md)`.

```
Sai:  margin-top: 32px; color: #0C4A6E;
Đúng: margin-top: var(--s6); color: var(--c-primary);
```

Danh sách token đầy đủ ở `tokens.css` và `DESIGN.md`.

### L2 — Spacing system (4-8-12-16-24-32-48-64-96)

Chỉ dùng 9 bậc spacing từ `--s1` (4px) đến `--s9` (96px). Không tự chế khoảng cách. Khoảng cách giữa các section lớn dùng `--s7` (48px) hoặc `--s8` (64px). Padding nội bộ dùng `--s4` (16px) đến `--s6` (32px).

### L3 — Hai accent, hai vùng

Cam (`--c-accent`) chỉ ở vùng hành động: nút CTA, nhãn giá, booking. Sand (`--c-sand`) chỉ ở vùng nội dung: underline, marker, badge, icon. Không lẫn. Không sand trên nút. Không cam trong body text.

### L4 — Typography dual font

Display: "Be Vietnam Pro" cho heading (h1-h4, hero, section title). UI: "Plus Jakarta Sans" cho body, label, badge, navigation. Không dùng display font cho body text và ngược lại.

---

## 1. Pattern catalog

Mỗi pattern có: tên, mô tả khái niệm, code mẫu thật từ repo, biến thể được phép, và ghi chú về token.

---

### P1 — Hero boxed / mosaic (có ảnh / gallery / không ảnh)

**Khái niệm:** Hero nằm trong container, không tràn viền. Ba biến thể: ảnh đơn (gradient overlay + chữ nổi), ảnh + gallery mosaic (ảnh chính bên trái, gallery 2x2 bên phải), và không ảnh (gradient nền + pattern landscape).

**Component:** `<Hero>` — `src/components/Hero.astro`

**API:**
```astro
<Hero
  image={data.mainImage}        <!-- ImageAsset | string | undefined -->
  gallery={data.gallery}        <!-- ImageAsset[] | undefined -->
  imageAlt="Toàn cảnh tháp"     <!-- optional -->
>
  <h1 slot="overlay">Tháp Bà Ponagar</h1>
</Hero>
```

**Biến thể được phép:**
- Hero ảnh đơn -> ảnh full-width object-fit cover, overlay title/breadcrumb qua slot.
- Hero có đủ 4 ảnh gallery -> media mosaic kiểu Hotel desktop: ảnh chính bên trái, gallery 2x2 bên phải với 4 ô bằng nhau; mobile: ảnh chính trên, thumbnail strip 4 ô đều dưới.
- Hero có 1-3 ảnh gallery sau khi loại ảnh trùng mainImage -> dùng biến thể ảnh đơn, không span ô, không placeholder và không render gallery section rời.
- Hero không ảnh -> tự render gradient nền.
- Gallery detail không render thành section rời; phải đi qua Hero mosaic và guard `entity-layout-post.ts`.

**Token sử dụng:** `--c-primary-strong`, `--c-text-inverse`, `--c-card`, `--radius-lg`, `--fs-hero`, `--font-display`, `--s1`

**Code CSS gốc (trong Hero.astro):**
```css
.hero-block {
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.hero-block--mosaic .hero-media-grid {
  grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr);
  gap: var(--s1);
}
.hero-gallery-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}
```

---

### P2 — Section có heading + underline

**Khái niệm:** Mỗi vùng nội dung lớn được gói trong một section. Section tự mang container và heading kèm sand underline. Slot bên trong là nội dung tự do.

**Component:** `<Section>` — `src/components/Section.astro`

**API:**
```astro
<Section heading="Chi tiết">
  <p>Nội dung ở đây...</p>
</Section>

<!-- Không heading -->
<Section>
  <div class="author-box">...</div>
</Section>
```

**Biến thể được phép:**
- Có heading → render sand underline
- Không heading → chỉ render container + slot
- Heading i18n: `heading={lang === 'vi' ? 'Chi tiết' : 'Details'}`

**Token sử dụng:** `--s7` (padding), `--s5` (mobile), `--fs-h3`, `--c-sand`, `--font-display`

---

### P3 — Card grid (2 cột / responsive)

**Khái niệm:** Grid card dùng cho danh sách entity liên quan (about, whereToTry, location cards). Card có icon + text, border nhẹ, hover nâng.

**Code mẫu (từ ArticleDetail about cards):**
```astro
<div class="about-grid">
  {entities.map(entity => (
    <a href={entity.url} class="about-card">
      <div class="about-icon">
        <svg width="22" height="22">...</svg>
      </div>
      <div class="about-body">
        <h4>{entity.title}</h4>
        {entity.summary && <p>{entity.summary}</p>}
      </div>
    </a>
  ))}
</div>
```

**CSS:**
```css
.about-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--s4);
  max-width: 800px;
}

.about-card {
  display: flex;
  align-items: center;
  gap: var(--s4);
  padding: var(--s4);
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  transition: transform var(--m-fast) var(--m-ease), box-shadow var(--m-fast) var(--m-ease);
}

.about-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-raised);
  border-color: transparent;
}

.about-icon {
  width: 48px; height: 48px;
  border-radius: var(--radius-md);
  background: var(--c-primary-soft);
  color: var(--c-primary);
  display: flex; align-items: center; justify-content: center;
}

@media (max-width: 640px) {
  .about-grid { grid-template-columns: 1fr; }
}
```

**Biến thể được phép:**
- 1 cột (mobile), 2 cột (desktop) — mặc định
- 3 cột khi màn rộng >1024px
- Card không link (div thay a)
- Icon to hơn (64px) cho card nổi bật

---

### P4 — Badge / pill

**Khái niệm:** Nhãn phân loại nhỏ, tròn viền, dùng cho entity type, category, cuisine, trạng thái.

**Code mẫu:**
```astro
<span class="badge badge-default">{typeLabel}</span>
<span class="badge badge-sand">{cuisine}</span>
```

**CSS:**
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--s1);
  padding: var(--s1) var(--s3);
  border-radius: var(--radius-pill);
  font-size: var(--fs-badge);
  font-weight: var(--fw-600);
  font-family: var(--font-ui);
}

.badge-default  { background: var(--c-primary-soft); color: var(--c-primary); }
.badge-sand     { background: var(--c-sand-soft);    color: var(--c-sand-text); }
.badge-inverse  { background: var(--c-hero-overlay-light); color: var(--c-text-inverse); backdrop-filter: blur(6px); }
.badge-upcoming { background: var(--c-primary-soft); color: var(--c-primary); }
.badge-past     { background: var(--c-surface-alt);  color: var(--c-text-muted); }
```

**Biến thể được phép:**
- Có icon bên trái
- Link thay span (badge bấm được)
- Màu mới: chỉ thêm qua token, không hardcode hex

---

### P5 — Meta row (icon + text)

**Khái niệm:** Dòng thông tin bổ trợ dạng icon SVG + label + value, xếp ngang, responsive wrap.

**Code mẫu (từ EventDetail):**
```astro
<div class="event-meta">
  <div class="event-meta-item">
    <svg width="22" height="22">...</svg>
    <div>
      <strong>{lang === 'en' ? 'Time' : 'Thời gian'}</strong>
      <span>{formatDate(data.startDate)}</span>
    </div>
  </div>
  <div class="event-meta-item">
    <svg width="22" height="22">...</svg>
    <div>
      <strong>{lang === 'en' ? 'Location' : 'Địa điểm'}</strong>
      <span>{data.location.title}</span>
    </div>
  </div>
</div>
```

**CSS:**
```css
.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s4);
}

.event-meta-item {
  display: flex;
  align-items: center;
  gap: var(--s3);
  padding: var(--s3) var(--s4);
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  font-size: var(--fs-sm);
}

.event-meta-item svg { color: var(--c-primary); }
.event-meta-item strong { color: var(--c-text); font-weight: var(--fw-600); }
.event-meta-item span { color: var(--c-text-muted); }
```

**Biến thể được phép:**
- 2-4 item mỗi dòng
- Label + value xếp dọc (như hiện tại) hoặc ngang
- Icon bên trái (mặc định) hoặc trên

---

### P6 — Timeline dọc

**Khái niệm:** Hành trình có đánh số, đường kẻ dọc gradient, mỗi điểm dừng có dot tròn + nội dung.

**Code mẫu (từ TourDetail itinerary):**
```astro
<div class="timeline">
  {stops.map((stop, i) => (
    <div class="tl-stop">
      <div class="tl-dot">{i + 1}</div>
      <div>
        <div class="tl-time">{stop.duration}</div>
        <div class="tl-title">
          <a href={stop.url}>{stop.title}</a>
        </div>
        <div class="tl-desc">{stop.note}</div>
      </div>
    </div>
  ))}
</div>
```

**CSS:**
```css
.timeline {
  position: relative;
  padding-left: var(--s6);
}

.timeline::before {
  content: "";
  position: absolute;
  left: 17px; top: 6px; bottom: 6px;
  width: 2px;
  background: linear-gradient(180deg, var(--c-primary), var(--c-green));
  opacity: 0.3;
}

.tl-dot {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--c-card);
  border: 2px solid var(--c-primary);
  color: var(--c-primary);
  font-family: var(--font-display);
  font-weight: var(--fw-800);
  display: flex; align-items: center; justify-content: center;
}

.tl-title { font-family: var(--font-display); font-weight: var(--fw-800); }
.tl-title a { color: var(--c-primary); }
```

**Biến thể được phép:**
- Timeline không link (text thuần)
- Dot đổi màu theo trạng thái (completed = green, current = primary, upcoming = muted)
- Đường kẻ đổi màu gradient

---

### P7 — Stats bar (quick facts)

**Khái niệm:** Thanh thông tin ngang 2-4 cột, mỗi cột là icon + label + value. Dùng cho quick facts của tour, key facts trang chủ.

**Code mẫu (từ TourDetail facts):**
```astro
<div class="facts">
  {facts.map(f => (
    <div class="fact">
      <div class="ficon">{f.icon}</div>
      <div>
        <div class="flbl">{f.label}</div>
        <div class="fval">{f.val}</div>
      </div>
    </div>
  ))}
</div>
```

**CSS:**
```css
.facts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.fact {
  padding: var(--s4);
  display: flex; gap: var(--s3); align-items: center;
  border-right: 1px solid var(--c-border);
}
.fact:last-child { border-right: 0; }

.ficon {
  width: 40px; height: 40px;
  border-radius: var(--radius-sm);
  background: var(--c-primary-soft);
  color: var(--c-primary);
  display: flex; align-items: center; justify-content: center;
}

.flbl { font-size: var(--fs-badge); color: var(--c-text-muted); text-transform: uppercase; }
.fval { font-size: var(--fs-sm); font-weight: var(--fw-700); color: var(--c-text); }

@media (max-width: 768px) {
  .facts { grid-template-columns: repeat(2, 1fr); }
}
```

**Biến thể được phép:**
- 2, 3, hoặc 4 cột
- Không border-right giữa các cột
- Icon emoji thay SVG

---

### P8 — CTA button (primary / outline)

**Khái niệm:** Nút hành động — chỉ dùng accent cam. Hai biến thể: primary (nền cam, chữ trắng) và outline (viền, chữ tối).

**CSS:**
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s2);
  padding: var(--s3) var(--s5);
  border: none;
  border-radius: var(--radius-pill);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
  font-weight: var(--fw-600);
  cursor: pointer;
  text-decoration: none;
  transition: all var(--m-fast) var(--m-ease);
}

.btn-pri {
  background: var(--c-accent);
  color: var(--c-text-inverse);
}
.btn-pri:hover { background: var(--c-accent-strong); transform: translateY(-1px); }

.btn-outline {
  background: transparent;
  color: var(--c-text);
  border: 1px solid var(--c-border);
}
.btn-outline:hover { border-color: var(--c-primary); color: var(--c-primary); }
```

**Biến thể được phép:**
- Full-width (`width: 100%`) cho mobile sticky bar
- Có icon SVG bên trái
- Disabled state (`opacity: 0.5; pointer-events: none`)

**Cấm:** Sand trên nút. Cam trên nút trong vùng nội dung thuần (không phải CTA).

---

### P9 — Callout box (sand paper)

**Khái niệm:** Hộp thông tin nổi bật với nền giấy vàng nhạt, viền sand — dùng cho tip, note, cảnh báo nhẹ, access info.

**Code mẫu (từ PlaceDetail access info):**
```astro
<div class="info-callout">
  <p><strong>Đường bộ:</strong> Đi theo đường Trần Phú...</p>
</div>
```

**CSS:**
```css
.info-callout {
  background: var(--c-sand-paper);
  border: 1px solid var(--c-sand-border);
  border-radius: var(--radius-lg);
  padding: var(--s4) var(--s5);
  font-size: var(--fs-sm);
  line-height: 1.6;
  color: var(--c-sand-text);
}

.info-callout strong { color: var(--c-sand-text-strong); }
```

**Biến thể được phép:**
- Có icon cảnh báo bên trái
- Màu nền khác: primary-soft (xanh nhạt) cho thông tin trung tính

---

### P10 — Highlights grid (2 cột, dot marker)

**Khái niệm:** Danh sách điểm nổi bật dạng grid 2 cột với sand dot marker.

**Code mẫu (từ PlaceDetail):**
```astro
<ul class="hl-grid">
  {highlights.map(h => (
    <li><span class="hl-marker"></span>{h}</li>
  ))}
</ul>
```

**CSS:**
```css
.hl-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--s3);
  list-style: none;
}

.hl-grid li {
  display: flex; gap: var(--s3); align-items: flex-start;
  padding: var(--s3) var(--s4);
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  font-size: var(--fs-sm);
}

.hl-marker {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--c-sand);
  flex: none;
  margin-top: 6px;
}

@media (max-width: 768px) {
  .hl-grid { grid-template-columns: 1fr; }
}
```

---

### P11 — Date block (event / countdown style)

**Khái niệm:** Hiển thị ngày tháng dạng lịch — số to, tháng bên dưới.

**Code mẫu (từ EventDetail):**
```astro
<div class="date-block">
  <div class="date-range">
    <div class="date-box">
      <div class="day">{formatDay(data.startDate)}</div>
      <div class="month">{formatMonth(data.startDate, lang)}</div>
    </div>
    {data.endDate && (
      <>
        <span class="date-arrow">→</span>
        <div class="date-box">
          <div class="day">{formatDay(data.endDate)}</div>
          <div class="month">{formatMonth(data.endDate, lang)}</div>
        </div>
      </>
    )}
  </div>
</div>
```

**CSS:**
```css
.date-block {
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  padding: var(--s5);
}

.date-box .day {
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-weight: var(--fw-900);
  color: var(--c-primary-strong);
  line-height: 1;
}

.date-box .month {
  font-size: var(--fs-label);
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
```

---

### P12 — Source link chip (pill style)

**Khái niệm:** Link nguồn tham khảo dạng pill — dùng cho officialSource, sameAs, URL.

**Code mẫu (từ OrganizationDetail):**
```astro
<a href={data.url} class="src-chip" target="_blank" rel="noopener">
  <svg width="16" height="16">...</svg>
  Website chính thức
</a>
```

**CSS:**
```css
.src-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--s2);
  padding: var(--s2) var(--s4);
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-pill);
  font-size: var(--fs-sm);
  font-weight: var(--fw-600);
  color: var(--c-primary);
  transition: all var(--m-fast) var(--m-ease);
  text-decoration: none;
}

.src-chip:hover {
  border-color: var(--c-primary);
  background: var(--c-primary-soft);
}
```

---

### P13 — Booking card (sticky sidebar)

**Khái niệm:** Card đặt tour/event dạng sidebar phải, sticky khi scroll. Gồm: giá to, form chọn ngày/số lượng, nút CTA cam full-width, trust badges.

**Code mẫu (từ TourDetail):**
```astro
<aside class="col-right">
  <div class="booking">
    <div class="book-price-row">
      <span class="book-price">1.200.000₫</span>
      <span class="book-unit">/ khách</span>
    </div>
    <!-- date select + guest qty -->
    <a href="#booking" class="btn btn-primary">Đặt tour</a>
    <div class="book-trust">
      <div><svg>...</svg>Xác nhận tức thì qua email</div>
      <div><svg>...</svg>Huỷ miễn phí trước 48 giờ</div>
    </div>
  </div>
</aside>
```

**Layout two-column:**
```css
.two-col {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--s7);
  align-items: start;
}

.col-right {
  position: sticky;
  top: calc(var(--header-h) + var(--s5));
}

@media (max-width: 1023px) {
  .two-col { grid-template-columns: 1fr; }
  .col-right { position: static; order: -1; }
}
```

**Booking card CSS:**
```css
.booking {
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  padding: var(--s5);
  box-shadow: var(--shadow-raised);
}

.book-price {
  font-family: var(--font-display);
  font-size: var(--fs-display-sm);
  font-weight: var(--fw-900);
  color: var(--c-primary-strong);
}

.btn-primary {
  background: var(--c-accent);
  color: var(--c-text-inverse);
  width: 100%;
}
.btn-primary:hover { background: var(--c-accent-strong); transform: translateY(-1px); }
```

**Biến thể được phép:**
- Không có booking card (two-col--full: grid 1 cột)
- Mobile: sticky bar dưới cùng thay vì sidebar

---

### P14 — Mobile sticky bar

**Khái niệm:** Khi không có sidebar booking, hiện thanh sticky dưới cùng trên mobile với giá + nút CTA.

**Code mẫu (từ TourDetail):**
```astro
<div class="mobile-book">
  <div class="mb-price">
    {priceView.label}
    <small>/ khách</small>
  </div>
  <a href="#booking" class="btn btn-primary">Đặt tour</a>
</div>
```

**CSS:**
```css
.mobile-book {
  display: none;  /* ẩn trên desktop */
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 40;
  background: var(--c-card);
  border-top: 1px solid var(--c-border);
  padding: var(--s3) var(--s4);
  box-shadow: 0 -4px 16px rgba(0,0,0,.08);
  align-items: center;
  gap: var(--s3);
}

@media (max-width: 1023px) {
  .mobile-book { display: flex; }
}
```

---

### P15 — Author box (avatar + text)

**Khái niệm:** Hộp tác giả cho Article detail — avatar tròn bên trái, tên + mô tả bên phải.

**Code mẫu (từ ArticleDetail):**
```astro
<div class="author-box">
  <div class="author-avatar">
    {authorImg ? <img src={authorImg} alt={name} /> : <span class="avatar-placeholder">{name[0]}</span>}
  </div>
  <div class="author-info">
    <h4><a href={authorUrl}>{name}</a></h4>
    {summary && <p>{summary}</p>}
  </div>
</div>
```

**CSS:**
```css
.author-box {
  display: flex; gap: var(--s4); align-items: center;
  padding: var(--s4);
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.author-avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), var(--c-primary-strong));
  overflow: hidden;
}

.avatar-placeholder {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%;
  color: var(--c-text-inverse);
  font-family: var(--font-display);
  font-weight: var(--fw-700);
}
```

---

### P16 — Summary block

**Khái niệm:** Đoạn mở đầu trang detail — chữ lớn hơn body, font UI, max-width giới hạn.

**Code mẫu:**
```astro
<div class="container">
  <div class="summary-block">{data.summary}</div>
</div>
```

**CSS:**
```css
.summary-block {
  font-size: var(--fs-h5);
  max-width: 70ch;
  line-height: var(--lh-body);
  font-weight: var(--fw-500);
  font-family: var(--font-ui);
  padding: var(--s5) 0;
}
```

**Biến thể:** Trong PlaceDetail/AttractionDetail, summary được bọc trong `.summary-section > .container` với `padding: var(--s7) 0` và border-bottom.

---

### P17 — TOC (table of contents)

**Khái niệm:** Mục lục bài viết dạng card, tự sinh từ h2/h3 trong body.

**Code mẫu (từ ArticleDetail):**
```astro
<div class="toc">
  <div class="toc-title">Trong bài này</div>
  <ol>
    {items.map(item => (
      <li style={item.level === 3 ? 'padding-left:var(--s4)' : ''}>
        <a href={`#${item.id}`}>{item.text}</a>
      </li>
    ))}
  </ol>
</div>
```

**CSS:**
```css
.toc {
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  padding: var(--s5);
  max-width: var(--measure);
  box-shadow: var(--shadow-card);
}

.toc-title {
  font-size: var(--fs-sm);
  font-weight: var(--fw-700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toc a { color: var(--c-primary); font-weight: var(--fw-500); }
.toc a:hover { color: var(--c-primary-strong); text-decoration: underline; }
```

---

## 2. Cách dùng catalog này

**Khi tạo entity detail mới:**
1. Bắt đầu với `<Hero>` + `<Breadcrumb>` + `<Section>` — đây là xương sống bắt buộc
2. Chọn pattern từ catalog cho từng vùng dữ liệu: có timeline không (P6)? có card grid không (P3)? có meta row không (P5)?
3. Mỗi pattern copy CSS từ catalog — không viết lại
4. Kết thúc với `.updated` + `<AuthorityMeta>` trong container
5. Chạy `validate:post` — guard sẽ bắt nếu thiếu container hoặc primitive

**Khi tuỳ chỉnh pattern:**
- Được đổi số cột grid (2→3), đổi kích thước icon, thêm animation nhẹ
- Được thêm màu mới nếu bổ sung vào tokens.css trước
- Không được bỏ container wrapper
- Không được hardcode giá trị thay token
- Không được trộn accent cam vào vùng nội dung

**Khi phát minh pattern mới:**
- Viết vào file này, kèm code mẫu thật và token sử dụng
- Cập nhật guard nếu pattern có element mới cần containment check
- Ghi DECISIONS.md
