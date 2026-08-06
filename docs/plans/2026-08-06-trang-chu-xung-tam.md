# Kế hoạch thi hành — Trang chủ xứng tầm, và dựng nốt trang chi tiết

> **Cho tác nhân thực thi:** dùng `superpowers:subagent-driven-development` hoặc
> `superpowers:executing-plans` để chạy từng việc một. Các bước dùng ô đánh dấu `- [ ]`.

**Mục tiêu:** Trang chủ trông vững như một công ty lâu năm dù catalogue trên site còn mỏng, bằng cách để **bằng chứng gánh trang** thay vì catalogue; và dựng nốt bốn loại trang chi tiết còn lại theo bàn giao bước 7.

**Cách tiếp cận:** Thêm bốn field vào `siteSettings` (dải số liệu, logo đối tác, đánh giá khách, khối báo giá đoàn) rồi dựng bốn component tương ứng, tất cả theo khuôn guard rỗng đã dùng suốt dự án. Bốn trang chi tiết còn lại nối vào `DetailLayout` đã mở rộng ở đợt trước, không cần primitive mới.

**Công nghệ:** Astro 5 + Sanity + Cloudflare. TypeScript `strict`. Không thêm phụ thuộc nào.

**Nguồn:** `docs/specs/SPEC-2026-08-06-trang-chu-xung-tam.md` (đã duyệt 2026-08-06).

---

## Ràng buộc toàn cục

Áp cho **mọi việc** dưới đây. Không lặp lại trong từng việc.

- **Thứ tự bắt buộc** (`04-CONSTRAINTS` §2.2 điều cấm 2): sửa `01-CONTENT_MODEL` **trước**, ghi `DECISIONS`, **rồi** mới chạm `cms/schemas/` và code. Làm ngược là vi phạm.
- **Không mã màu, cỡ chữ, khoảng cách nào ngoài token.** Chỉ dùng biến CSS trong `src/styles/tokens.css`. Cần giá trị mới thì dừng và hỏi.
- **Ba bộ giao diện phải cùng dùng được:** `bien-sau`, `cat-bien`, `ngoc-lam`. Bố cục chỉ đẹp với một bộ là bố cục sai.
- **Tương phản WCAG AA ≥ 4.5.** `--c-sand` **cấm** làm nền cho chữ trắng — chỉ đạt 3.28.
- **Vùng rỗng ẩn hẳn.** Không placeholder, không khung trống, không CTA giả (`06-BINDING_MAP` quyết định nền 2 và 3).
- **Kiểu khai thật:** field mảng từ GROQ khai `T[] | null`, không phải `T[]`. Xử bằng `?? []` hoặc phép kiểm chân trị. **Cấm `!` và cấm `as`** để dập tắt null.
- **Không tạo nguồn sự thật thứ hai.** Số liên hệ chỉ ở `siteSettings.contact`; màu chỉ ở `tokens.css`; điều hướng chỉ ở `site.config.ts` khối `nav`.
- **`g1` chép cứng bảng field trong mã validator.** Đổi `01-CONTENT_MODEL` thì phải sửa cả `scripts/meta-validators/g1-content-model-vs-schema.ts`, nếu không cổng đỏ (DR-027).
- **Cổng phải giữ nguyên trạng:** `gate:all` 9 xanh / 1 đỏ, và cái đỏ phải đúng là `deferred-gate`. Đỏ thêm bất cứ gì khác là hồi quy.

### Chu trình kiểm của dự án này

Dự án **không có** framework test đơn vị cho `.astro`. Chu trình kiểm thật, dùng suốt các đợt trước, là:

```bash
npm run check                          # astro check — 0 lỗi 0 cảnh báo
npm run build                          # phải đi tới "Complete!"
node scripts/check-theme-contrast.mjs  # 3 bộ đạt AA
npm --prefix scripts run gate:all      # 9 xanh / 1 đỏ
grep ... dist/...                      # khẳng định trên HTML ĐÃ DỰNG
```

Bước "kiểm" trong mọi việc dưới đây là các lệnh này cộng một phép grep cụ thể trên `dist/`. **Khẳng định phải đo trên output thật, không phải trên mã nguồn.**

---

## Cấu trúc file

**Tạo mới**

| File | Trách nhiệm |
|---|---|
| `src/components/HomeStatsBand.astro` | Dải số liệu — đọc `siteSettings.stats` |
| `src/components/HomePartners.astro` | Lưới logo đối tác — đọc `siteSettings.partners` |
| `src/components/HomeTestimonials.astro` | Đánh giá khách — đọc `siteSettings.testimonials` |
| `src/components/HomeGroupQuote.astro` | Khối báo giá đoàn — đọc `siteSettings.groupQuote` + `contact.zaloUrl` |
| `docs/prompts/PHA-F2-TRANG-CHU.md` | Prompt bàn giao vòng Design thứ hai |

**Sửa**

| File | Sửa gì |
|---|---|
| `docs/core-specs/01-CONTENT_MODEL.md` | §2.15 thêm 4 field, changelog v1.0.16 |
| `docs/core-specs/06-BINDING_MAP.md` | §5.7 thêm 4 khối |
| `docs/DECISIONS.md` | nối bản ghi (chỉ thêm, không sửa) |
| `cms/schemas/siteSettings.ts` | 4 field mới |
| `src/lib/queries/siteSettings.ts` | chiếu 4 field |
| `src/lib/types.ts` | kiểu cho 4 field |
| `scripts/meta-validators/g1-content-model-vs-schema.ts` | đồng bộ tên field |
| `src/components/SiteHome.astro` | thứ tự khối hướng A, nối 4 component mới |
| `src/lib/homepage.ts` | `trustItems` đọc từ `siteSettings` |
| `src/components/AttractionDetail.astro` | nối `DetailLayout` mở rộng |
| `src/components/ExperienceDetail.astro` | như trên |
| `src/components/ArticleDetail.astro` | như trên |
| `src/components/EntityIndex.astro` | lưới thích ứng theo số mục |

---

## Sắp xếp theo pha

| Pha | Việc | Chặn bởi |
|---|---|---|
| **A** — trang chi tiết | 1–3 | không gì. Bàn giao Design đã có sẵn cả bốn màn hình |
| **B** — tầng dữ liệu | 4–6 | không gì. Chạy song song pha A được |
| **C** — vòng Design | 7 | pha B xong |
| **D** — khối trang chủ | 8–12 | pha C xong |

Pha A **không** chờ Design: bàn giao bước 7 đã vẽ `Attraction detail`, `Experience detail`, `Article detail`, `Tour index`. Bốn khối mới của trang chủ thì **chưa được vẽ** — màn `Home` trong bàn giao chỉ có hero, thanh tin cậy, tour, lưới hub. Nên pha C là vòng Design thật, không bỏ được.

---

# PHA A — Bốn trang chi tiết còn lại

## Việc 1: Trang điểm tham quan và trải nghiệm

**File**
- Sửa: `src/components/AttractionDetail.astro`
- Sửa: `src/components/ExperienceDetail.astro`

**Giao diện**
- Dùng: `DetailLayout` với các prop đã có từ đợt trước — `badges`, `summary`, `jumpLinks`, `priceLabel`, `ctaHref`, `ctaLabel`; `Section` và `FAQ` nhận `id`.
- Sinh ra: không có gì cho việc sau dùng.

**Khuôn tham chiếu:** `src/components/PlaceDetail.astro` đã làm đúng hình dạng này ở commit `a7bd9cb`. Đọc nó trước.

- [ ] **Bước 1: Ghi lại mốc trước khi sửa**

```bash
npm run build >/dev/null 2>&1
grep -c "detail-badge" dist/diem-tham-quan/khu-du-lich-hon-tam/index.html
```
Kỳ vọng: `0` — trang chưa có phù hiệu hero.

- [ ] **Bước 2: Thêm phù hiệu, tóm tắt và neo cho AttractionDetail**

Trong phần `---` ở đầu file, sau dòng tính `typeLabel`, thêm:

```ts
// Phù hiệu hero: loại điểm tham quan (§3 "Nhãn loại entity", `attractionType`).
const heroBadges = [typeLabel].filter((x): x is string => !!x)

// Neo chỉ trỏ tới mục THẬT SỰ render — khối vắng mà vẫn để neo là link chết.
const jumpLinks = [
  { id: 'highlights', label: t('highlights'), on: !!data.highlights?.length },
  { id: 'details', label: t('details'), on: !!data.body?.length },
  { id: 'access', label: t('howToGetThere'), on: !!data.accessInfo?.length },
  { id: 'experiences', label: t('experiencesHere'), on: !!data.experiences?.length },
  { id: 'faq', label: t('faqHeading'), on: !!data.faq?.length },
].filter(x => x.on).map(x => ({ href: `#${x.id}`, label: x.label }))
```

Trong thẻ `<DetailLayout`, thêm ngay sau dòng mở thẻ:

```astro
  badges={heroBadges}
  summary={data.summary}
  jumpLinks={jumpLinks}
```

Xoá dòng `<div class="summary-block">{data.summary}</div>` — tóm tắt đã lên hero, để lại là hiện hai lần.

Gắn `id` cho từng `Section` tương ứng, ví dụ:

```astro
<Section heading={t('highlights')} contained={false} id="highlights">
```

và cho FAQ:

```astro
<FAQ faq={data.faq} lang={lang} contained={false} id="faq" />
```

- [ ] **Bước 3: Làm y hệt cho ExperienceDetail**

Khác ba chỗ:
- `heroBadges` lấy từ `data.experienceType?.name` thay vì `typeLabel`.
- Danh sách neo là: `includes` (`t('includes')`), `highlights`, `details`, `faq`. Experience **không có** `accessInfo` và `experiences`.
- Experience có vùng giá, nên truyền thêm:

```astro
  priceLabel={priceView?.label ?? null}
  ctaHref={contact?.zaloUrl || null}
  ctaLabel={contact?.zaloUrl ? t('contactZalo') : null}
```

- [ ] **Bước 4: Kiểm — mọi neo phải có đích thật**

```bash
npm run check 2>&1 | grep -E "^- "
npm run build >/dev/null 2>&1 && echo BUILD_OK
python3 - <<'PY'
import re
for p in ['dist/diem-tham-quan/khu-du-lich-hon-tam/index.html',
          'dist/trai-nghiem/lan-bien/index.html']:
    h = open(p, encoding='utf-8').read()
    ids = set(re.findall(r'<section[^>]*\bid="([^"]+)"', h))
    nav = re.search(r'sticky-bar__jump.*?</nav>', h, re.S)
    hrefs = re.findall(r'href="#([a-z]+)"', nav.group(0)) if nav else []
    bad = [a for a in hrefs if a not in ids]
    print(p.split('/')[1], '| neo:', hrefs, '| chết:', bad or 'không')
    assert not bad, f'LINK CHET tren {p}: {bad}'
    assert 'detail-badge' in h, 'thieu phu hieu hero'
    assert 'detail-summary' in h, 'thieu tom tat hero'
print('OK')
PY
```
Kỳ vọng: `0 errors`, `BUILD_OK`, cột "chết" là `không`, in `OK`.

> **Lưu ý về thứ tự thuộc tính.** Astro render `class` trước `id`, nên regex tìm `<section id=` sẽ trượt. Dùng đúng mẫu `<section[^>]*\bid=` như trên. Lỗi này đã xảy ra một lần ở đợt trước.

- [ ] **Bước 5: Kiểm cổng**

```bash
node scripts/check-theme-contrast.mjs | tail -1
git checkout -- scripts/reports/ 2>/dev/null
npm --prefix scripts run gate:all 2>&1 | grep "đỏ:"
```
Kỳ vọng: `[pass] 3 bộ`, và `1/10 đỏ: validators/deferred-gate.ts`.

- [ ] **Bước 6: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add src/components/AttractionDetail.astro src/components/ExperienceDetail.astro
git commit -m "feat: trang diem tham quan va trai nghiem theo ban giao buoc 7

Noi vao DetailLayout da mo rong: phu hieu, tom tat len hero, thanh dinh co neo.
Experience them vung gia va CTA Zalo.

Da kiem tren HTML that: moi neo deu co section id tuong ung, khong link chet."
```

---

## Việc 2: Trang cẩm nang

**File**
- Sửa: `src/components/ArticleDetail.astro`

**Giao diện**
- Dùng: `DetailLayout` (`badges`, `summary`, `jumpLinks`), `Section` và `FAQ` nhận `id`.
- Sinh ra: không có gì.

**Khác ba trang kia:** Article **không có** `gallery` (ảnh nằm trong `body`), **không có** `containedInPlace` nên không có breadcrumb theo địa lý, và **có** hộp tác giả (`author`) là tín hiệu E-E-A-T bắt buộc theo `06-BINDING_MAP` §4.10.

- [ ] **Bước 1: Thêm phù hiệu, tóm tắt và neo**

Trong phần `---`:

```ts
// Phù hiệu hero: chuyên mục bài (§4.10 `articleType`) và tên tác giả.
const heroBadges = [
  articleTypeLabel,
  data.author?.title ? `Bởi ${data.author.title}` : null,
].filter((x): x is string => !!x)

const jumpLinks = [
  { id: 'howto', label: t('howTo'), on: !!data.howTo?.length },
  { id: 'about', label: t('aboutEntity'), on: !!data.about?.length },
  { id: 'mentions', label: t('mentions'), on: !!data.mentions?.length },
  { id: 'faq', label: t('faqHeading'), on: !!data.faq?.length },
].filter(x => x.on).map(x => ({ href: `#${x.id}`, label: x.label }))
```

> `articleTypeLabel` đã có sẵn trong file. Nếu tên biến khác, dùng đúng tên đang có — **không** đổi tên biến sẵn có, đó là mở rộng phạm vi.

Nối vào `<DetailLayout`:

```astro
  badges={heroBadges}
  summary={data.summary}
  jumpLinks={jumpLinks}
```

Xoá dòng hiển thị `data.summary` trong thân bài. Gắn `id` cho các `Section` và `FAQ` tương ứng bốn neo trên.

- [ ] **Bước 2: Kiểm**

```bash
npm run check 2>&1 | grep -E "^- "
npm run build >/dev/null 2>&1 && echo BUILD_OK
python3 - <<'PY'
import re
p = 'dist/cam-nang/tour-3-dao-nha-trang-lich-trinh-chi-tiet/index.html'
h = open(p, encoding='utf-8').read()
ids = set(re.findall(r'<section[^>]*\bid="([^"]+)"', h))
nav = re.search(r'sticky-bar__jump.*?</nav>', h, re.S)
hrefs = re.findall(r'href="#([a-z]+)"', nav.group(0)) if nav else []
bad = [a for a in hrefs if a not in ids]
assert not bad, f'LINK CHET: {bad}'
assert h.count('detail-summary') == 1, 'tom tat hien hai lan hoac khong hien'
print('neo:', hrefs, '| OK')
PY
```

- [ ] **Bước 3: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add src/components/ArticleDetail.astro
git commit -m "feat: trang cam nang theo ban giao buoc 7

Phu hieu hero mang chuyen muc va ten tac gia (tin hieu E-E-A-T, 06 §4.10).
Article khong co gallery nen hero la anh don — dung khuon san co."
```

---

## Việc 3: Trang danh sách theo lưới thích ứng

**File**
- Sửa: `src/components/EntityIndex.astro`

**Giao diện**
- Dùng: token khoảng cách và bo góc trong `tokens.css`.
- Sinh ra: không có gì.

**Vì sao cần:** `/tour/` hiện có **1 mục**. Lưới nhiều cột để một thẻ dọc nằm lẻ loi — đúng lỗi mà `HomeRollupSection` đã sửa ở commit `a7bd9cb`. Áp lại cùng luật.

- [ ] **Bước 1: Xem luật đã dùng ở trang chủ**

```bash
grep -n "has(> :last-child" -A4 src/components/HomeRollupSection.astro | head -20
```

- [ ] **Bước 2: Thêm luật lưới thích ứng**

Tìm khối CSS đặt `grid-template-columns` cho lưới card trong `EntityIndex.astro`, thêm ngay sau nó:

```css
  /* ── Lưới thích ứng theo SỐ MỤC THẬT ──
     /tour/ đang có 1 mục. Lưới nhiều cột để một thẻ dọc nằm lẻ loi bên trái,
     trông như trang lỗi. Cùng luật đã dùng ở HomeRollupSection. */

  .card-grid:has(> :last-child:nth-child(1)) {
    grid-template-columns: 1fr;
  }

  .card-grid:has(> :last-child:nth-child(1)) :global(.card) {
    display: grid;
    grid-template-columns: minmax(0, 42%) 1fr;
    align-items: stretch;
  }

  .card-grid:has(> :last-child:nth-child(1)) :global(.card-img-wrap) {
    height: 100%;
    min-height: 240px;
  }

  .card-grid:has(> :last-child:nth-child(2)) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 767px) {
    .card-grid:has(> :last-child:nth-child(1)) :global(.card) {
      grid-template-columns: 1fr;
    }
    .card-grid:has(> :last-child:nth-child(1)) :global(.card-img-wrap) {
      min-height: 0;
    }
  }
```

> Nếu class lưới trong file không phải `.card-grid`, dùng đúng tên đang có. Kiểm bằng `grep -n 'class="card-grid"' src/components/EntityIndex.astro`.

- [ ] **Bước 3: Kiểm luật có vào CSS đã dựng**

```bash
npm run build >/dev/null 2>&1 && echo BUILD_OK
grep -rl "last-child:nth-child(1)" dist/_astro/*.css | head -2
```
Kỳ vọng: `BUILD_OK` và ít nhất một file CSS.

> **Cẩn thận:** đừng chỉ grep file CSS đầu tiên tìm thấy trong HTML. Astro tách nhiều bundle; luật có thể nằm ở bundle khác. Dùng `grep -rl` trên cả thư mục như trên. Lỗi này đã xảy ra một lần.

- [ ] **Bước 4: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add src/components/EntityIndex.astro
git commit -m "feat: trang danh sach dung luoi thich ung theo so muc

/tour/ dang co 1 muc. Ap lai luat da dung o HomeRollupSection: 1 muc -> the nam
ngang tron chieu rong; 2 muc -> 2 cot. Viet bang :has(), khong JS."
```

---

# PHA B — Tầng dữ liệu cho trang chủ

## Việc 4: Khai bốn field vào CONTENT_MODEL và ghi DECISIONS

**File**
- Sửa: `docs/core-specs/01-CONTENT_MODEL.md`
- Sửa: `docs/DECISIONS.md`

**Giao diện**
- Sinh ra: tên và hình dạng bốn field mà việc 5 phải khớp đúng: `stats[]`, `partners[]`, `testimonials[]`, `groupQuote`.

**Đây là cổng.** `04-CONSTRAINTS` §2.2 điều cấm 2: sửa đặc tả trước, code sau. Làm ngược là vi phạm, và `g1` sẽ bắt.

- [ ] **Bước 1: Thêm bốn dòng vào bảng field §2.15**

Chèn ngay sau dòng `| theme | ... |`:

```markdown
| stats | array object | tùy | không | dải số liệu trang chủ; `value` là CHUỖI để nhập được "50.000+", "4,9/5"; mảng rỗng hoặc thiếu → khối không render | founder |
| partners | array object | tùy | không | logo đối tác; `logo` bắt buộc có alt (I12); thiếu `url` thì logo không thành link | founder |
| testimonials | array object | tùy | không | đánh giá khách; **KHÔNG** serialize ra JSON-LD, xem ghi chú dưới bảng | founder |
| groupQuote | object | tùy | không | khối báo giá đoàn cuối trang chủ; nút dùng lại `contact.zaloUrl`, không khai số thứ hai | founder |
```

- [ ] **Bước 2: Thêm mô tả field con, ngay trước đoạn mô tả `support`**

```markdown
Field `stats[]`, `partners[]`, `testimonials[]`, `groupQuote` (thêm v1.0.16 — trang chủ xứng tầm, SPEC-2026-08-06):

- `stats[]`: `value` (string), `label` (string), `note` (string, tùy). `value` cố ý là chuỗi chứ không phải số — kiểu số không diễn tả được "50.000+", "4,9/5", "24/7".
- `partners[]`: `name` (string), `logo` (image, **alt bắt buộc**), `url` (url, tùy). Không có `url` thì logo render thành ảnh tĩnh, không phải link chết.
- `testimonials[]`: `quote` (text), `authorName` (string), `authorNote` (string, tùy), `sourceName` (string, tùy), `sourceUrl` (url, tùy).
- `groupQuote`: `heading` (string, tùy), `text` (text, tùy), `ctaLabel` (string, tùy). **Không** có field số điện thoại hay link — nút đọc `contact.zaloUrl`.

Bốn phần độc lập nhau: phần nào trống thì khối đó không render, trang vẫn dựng (guard rỗng §5.1).

**Ràng buộc bắt buộc — đánh giá KHÔNG serialize.** `testimonials` **không** xuất `Review` hay `AggregateRating` trong JSON-LD. Google cấm rich snippet đánh giá tự phục vụ, tức nội dung doanh nghiệp tự đăng về chính mình; phát ra là rủi ro phạt thủ công, mà I6 là cổng mức `fail`. Đánh giá hiện cho người đọc, dẫn nguồn trung thực qua `sourceName` và `sourceUrl`. Muốn có sao vàng trên kết quả tìm kiếm thì phải lấy từ nguồn thứ ba qua API — việc riêng.

Dữ liệu trung lập ngôn ngữ, theo đúng tiền lệ `contact` (v1.0.11), `pickupPoints` (v1.0.13) và `support` (v1.0.14).
```

- [ ] **Bước 3: Cập nhật số phiên bản và changelog**

Đổi dòng header `- **Phiên bản:** v1.0.15` thành `v1.0.16`, và thêm vào cuối danh sách changelog, ngay trước dòng bắt đầu bằng `Mỗi bảng field có cột "dịch được"`:

```markdown
- v1.0.16 (2026-08-06): thêm bốn field vào siteSettings (§2.15) — `stats`, `partners`, `testimonials`, `groupQuote` — phục vụ trang chủ theo `SPEC-2026-08-06-trang-chu-xung-tam`. Bối cảnh: doanh thu công ty đến từ offline/đại lý/OTA, site là kênh mới với 4 sản phẩm lúc ra mắt, nên trang chủ phải để BẰNG CHỨNG gánh thay vì catalogue. Ràng buộc kèm theo: `testimonials` KHÔNG serialize ra JSON-LD (Google cấm rich snippet tự phục vụ, I6 là cổng fail). Không thêm document type mới nên là cửa hai chiều theo §5.3. Bản ghi DECISIONS cùng ngày.
```

- [ ] **Bước 4: Ghi DECISIONS**

Nối vào **cuối** `docs/DECISIONS.md` (sổ chỉ thêm, cấm sửa mục cũ):

```markdown

---

## QĐ-2026-08-06-09 — Bốn field trang chủ, và luật không serialize đánh giá

**Chốt.** Thêm `stats`, `partners`, `testimonials`, `groupQuote` vào `siteSettings`. Thi hành `SPEC-2026-08-06-trang-chu-xung-tam` đã duyệt.

**Vì sao vào `siteSettings` chứ không mở entity.** Cả bốn là dữ liệu singleton toàn site, không có URL riêng, không cần gate publish. Mở `_type` mới là cửa một chiều (§5.3) và kéo theo họ validator `I`. Ngưỡng đã ghi: `siteSettings` sau đợt này có 11 field cấp đầu; tới field thứ mười lăm thì dừng lại xét tách.

**Đánh giá không serialize.** Google cấm rich snippet đánh giá tự phục vụ. Phát `Review`/`AggregateRating` cho nội dung tự đăng là rủi ro phạt thủ công, mà I6 là cổng mức `fail`. Đánh giá hiện cho người đọc; dẫn nguồn qua `sourceName`/`sourceUrl`.

**`stats.value` là chuỗi.** Kiểu số không diễn tả được "50.000+", "4,9/5", "24/7" — những dạng mà một dải số liệu thật cần.
```

- [ ] **Bước 5: Kiểm — g1 phải đỏ đúng lúc này**

```bash
git checkout -- scripts/reports/ 2>/dev/null
npm --prefix scripts run audit:spec 2>&1 | grep -E "siteSettings|WARN.*stats" | head -6
```
Kỳ vọng: `g1` báo **WARN** cho bốn field mới ("có trong CONTENT_MODEL nhưng KHÔNG có trong schema"). Đây là **đúng** — đặc tả đang đi trước thi hành, và WARN không làm đỏ cổng. Nếu ra FAIL thì đã làm ngược thứ tự.

- [ ] **Bước 6: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add docs/core-specs/01-CONTENT_MODEL.md docs/DECISIONS.md
git commit -m "docs: CONTENT_MODEL v1.0.16 — bon field trang chu

stats, partners, testimonials, groupQuote vao siteSettings §2.15.
Rang buoc kem theo: testimonials KHONG serialize ra JSON-LD, vi Google cam rich
snippet danh gia tu phuc vu va I6 la cong muc fail.

Dac ta di truoc thi hanh dung thu tu 04-CONSTRAINTS §2.2."
```

---

## Việc 5: Schema Sanity, truy vấn, kiểu, và đồng bộ g1

**File**
- Sửa: `cms/schemas/siteSettings.ts`
- Sửa: `src/lib/queries/siteSettings.ts`
- Sửa: `src/lib/types.ts`
- Sửa: `scripts/meta-validators/g1-content-model-vs-schema.ts`

**Giao diện**
- Dùng: tên field từ việc 4.
- Sinh ra: kiểu `SiteStat`, `SitePartner`, `SiteTestimonial`, `SiteGroupQuote`, và bốn thuộc tính mới trên `SiteSettingsResult`. Việc 8–11 dựa vào đúng những tên này.

- [ ] **Bước 1: Thêm bốn field vào schema Sanity**

Trong `cms/schemas/siteSettings.ts`, chèn trước khối `defineField` của `support`:

```ts
    // CONTENT_MODEL §2.15 v1.0.16 — dải số liệu trang chủ.
    defineField({
      name: 'stats',
      title: 'Dải số liệu (trang chủ)',
      description:
        'Con số làm bằng chứng: số năm hoạt động, số khách đã phục vụ, số chuyến/năm. ' +
        'Để trống toàn bộ thì khối không hiện.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Con số',
              type: 'string',
              description: 'Viết đúng như muốn hiện: 50.000+, 12, 4,9/5, 24/7.',
            }),
            defineField({ name: 'label', title: 'Nhãn', type: 'string', description: 'Ví dụ "khách đã phục vụ".' }),
            defineField({ name: 'note', title: 'Ghi chú nhỏ', type: 'string' }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        },
      ],
    }),
    // CONTENT_MODEL §2.15 v1.0.16 — logo đối tác.
    defineField({
      name: 'partners',
      title: 'Đối tác (trang chủ)',
      description: 'Logo OTA, hãng tàu, khách sạn, đại lý. Để trống thì khối không hiện.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Tên đối tác', type: 'string' }),
            defineField({
              name: 'logo',
              title: 'Logo',
              type: 'image',
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Mô tả ảnh (alt)',
                  type: 'string',
                  description: 'Bắt buộc khi có ảnh — người dùng trình đọc màn hình cần nó.',
                }),
              ],
            }),
            defineField({
              name: 'url',
              title: 'Liên kết',
              type: 'url',
              description: 'Để trống thì logo không thành link.',
              validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
            }),
          ],
          preview: { select: { title: 'name', media: 'logo' } },
        },
      ],
    }),
    // CONTENT_MODEL §2.15 v1.0.16 — đánh giá khách.
    // KHÔNG serialize ra JSON-LD: Google cấm rich snippet đánh giá tự phục vụ.
    defineField({
      name: 'testimonials',
      title: 'Đánh giá khách (trang chủ)',
      description:
        'Hiện cho người đọc. Cố ý KHÔNG xuất dữ liệu có cấu trúc cho Google — ' +
        'đánh giá tự đăng mà xuất ra là rủi ro bị phạt.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'quote', title: 'Nội dung đánh giá', type: 'text', rows: 4 }),
            defineField({ name: 'authorName', title: 'Tên khách', type: 'string' }),
            defineField({ name: 'authorNote', title: 'Ghi chú về khách', type: 'string', description: 'Ví dụ "Đoàn 24 khách, tháng 6/2026".' }),
            defineField({ name: 'sourceName', title: 'Nguồn', type: 'string', description: 'Ví dụ "TripAdvisor". Để trống nếu thu trực tiếp.' }),
            defineField({
              name: 'sourceUrl',
              title: 'Liên kết nguồn',
              type: 'url',
              validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
            }),
          ],
          preview: { select: { title: 'authorName', subtitle: 'quote' } },
        },
      ],
    }),
    // CONTENT_MODEL §2.15 v1.0.16 — khối báo giá đoàn.
    defineField({
      name: 'groupQuote',
      title: 'Khối báo giá đoàn (trang chủ)',
      description: 'Khối cuối trang chủ dành cho khách đoàn. Nút dùng lại Liên kết Zalo ở mục Kênh liên hệ.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'heading', title: 'Tiêu đề', type: 'string' }),
        defineField({ name: 'text', title: 'Mô tả', type: 'text', rows: 3 }),
        defineField({ name: 'ctaLabel', title: 'Chữ trên nút', type: 'string' }),
      ],
    }),
```

- [ ] **Bước 2: Chiếu bốn field trong GROQ**

Trong `src/lib/queries/siteSettings.ts`, thêm vào phần chiếu, sau `support { ... }`:

```groq
    ,
    stats[] { value, label, note },
    partners[] {
      name,
      logo { _type, asset->{ _id, url }, hotspot, "alt": alt },
      url
    },
    testimonials[] { quote, authorName, authorNote, sourceName, sourceUrl },
    groupQuote { heading, text, ctaLabel }
```

- [ ] **Bước 3: Khai kiểu**

Trong `src/lib/types.ts`, thêm ngay trước `export interface SiteSettingsResult {`:

```ts
/** Một ô trong dải số liệu. `value` là CHUỖI — xem CONTENT_MODEL §2.15 v1.0.16. */
export interface SiteStat {
  value?: string
  label?: string
  note?: string
}

export interface SitePartner {
  name?: string
  logo?: ImageAsset
  url?: string
}

/** Đánh giá khách. KHÔNG serialize ra JSON-LD — xem QĐ-2026-08-06-09. */
export interface SiteTestimonial {
  quote?: string
  authorName?: string
  authorNote?: string
  sourceName?: string
  sourceUrl?: string
}

export interface SiteGroupQuote {
  heading?: string
  text?: string
  ctaLabel?: string
}
```

Và thêm bốn dòng vào `SiteSettingsResult`, ngay sau `support`:

```ts
  stats: SiteStat[] | null
  partners: SitePartner[] | null
  testimonials: SiteTestimonial[] | null
  groupQuote: SiteGroupQuote | null
```

> Khai `| null` chứ không phải `?:` — GROQ trả `null` cho field vắng mặt, không trả `undefined`. Đây là luật đã chốt ở commit `114010a`.

- [ ] **Bước 4: Đồng bộ g1**

`g1` chép cứng bảng field, không đọc markdown (DR-027). Trong `scripts/meta-validators/g1-content-model-vs-schema.ts`:

Thêm vào khối `siteSettings` của `CONTENT_MODEL_ENTITY_FIELDS`:

```ts
    // bốn field trang chủ thêm v1.0.16 (SPEC-2026-08-06)
    stats: { required: false },
    partners: { required: false },
    testimonials: { required: false },
    groupQuote: { required: false },
```

Thêm vào `SUB_FIELD_IGNORE` các field con chưa có trong danh sách:

```ts
  // siteSettings.stats[] / partners[] / testimonials[] / groupQuote (v1.0.16)
  'authorName', 'authorNote', 'sourceName', 'sourceUrl', 'ctaLabel', 'quote', 'heading',
```

> `value`, `label`, `name`, `url`, `logo`, `text` đã có sẵn trong danh sách bỏ qua hoặc trong `AMBIGUOUS_SUB_FIELDS`. Kiểm trước khi thêm trùng: `grep -n "'value'\|'label'" scripts/meta-validators/g1-content-model-vs-schema.ts`.

- [ ] **Bước 5: Kiểm — g1 phải XANH trở lại**

```bash
npm run check 2>&1 | grep -E "^- "
git checkout -- scripts/reports/ 2>/dev/null
npm --prefix scripts run audit:spec 2>&1 | grep -E "^\[pass\]|^\[FAIL" | tail -4
```
Kỳ vọng: `astro check` `0 errors`, và `g1` ở trạng thái `[pass]`.

- [ ] **Bước 6: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add cms/schemas/siteSettings.ts src/lib/queries/siteSettings.ts src/lib/types.ts scripts/meta-validators/g1-content-model-vs-schema.ts
git commit -m "feat: bon field trang chu trong schema, truy van va kieu

Thi hanh CONTENT_MODEL v1.0.16. Kieu khai T[] | null chu khong phai ?: — GROQ tra
null cho field vang mat.

g1 chep cung bang field trong ma validator (DR-027) nen phai dong bo ca hai cho."
```

---

## Việc 6: Khai bốn khối vào BINDING_MAP §5.7

**File**
- Sửa: `docs/core-specs/06-BINDING_MAP.md`

**Giao diện**
- Dùng: tên field từ việc 5.
- Sinh ra: hợp đồng vùng ↔ dữ liệu mà việc 8–11 phải khớp, và mà `g3` đọc thẳng.

**`g3` nay đọc file này thật** (đã sửa ở `fcf804b`), nên khai sai là cổng báo ngay. Quy ước máy đọc: tên field trong dấu backtick ở cột "Dữ liệu nuôi".

- [ ] **Bước 1: Thêm bốn hàng vào bảng §5.7**

Chèn vào bảng của `### 5.7 Trang chủ`, sau hàng "Hero: nút phụ":

```markdown
| Dải số liệu | `siteSettings.stats[]`: `value`, `label`, `note` | tùy | mảng rỗng hoặc thiếu → khối không render | trụ của trang; **không đọc document tour nào** nên số lượng tour không ảnh hưởng |
| Logo đối tác | `siteSettings.partners[]`: `name`, `logo`, `url` | tùy | ẩn khối | `logo` bắt buộc có alt (I12); thiếu `url` thì logo là ảnh tĩnh, không phải link chết |
| Đánh giá khách | `siteSettings.testimonials[]`: `quote`, `authorName`, `authorNote`, `sourceName`, `sourceUrl` | tùy | ẩn khối | **KHÔNG serialize ra JSON-LD** — Google cấm rich snippet tự phục vụ, xem QĐ-2026-08-06-09 |
| Báo giá đoàn | `siteSettings.groupQuote`: `heading`, `text`, `ctaLabel` | tùy | ẩn khối | nút đọc `contact.zaloUrl`, không khai số thứ hai |
| Vì sao chọn | `siteSettings.whyUs[]` hoặc config (build) | tùy | ẩn khối | bốn điểm khác biệt; xem việc 12 |
```

> Hàng cuối để sẵn cho việc 12. Nếu việc 12 không chuyển `whyUs` sang Sanity thì sửa hàng này thành `config (build)` cho khớp — **không** để bảng nói một đằng code một nẻo.

- [ ] **Bước 2: Cập nhật ghi chú thứ tự khối trong §5.7**

Ngay dưới bảng, sửa đoạn nói về thứ tự thành:

```markdown
Thứ tự và ẩn/hiện từng khối do `siteSettings.sections` quyết. Thứ tự mặc định trong code theo hướng A của `SPEC-2026-08-06-trang-chu-xung-tam`: **bằng chứng gánh trang, không phải catalogue gánh trang** — hero, dải số liệu, tour, vì sao chọn, đối tác, đánh giá, cẩm nang, báo giá đoàn.

Lý do: doanh thu công ty đến từ offline/đại lý/OTA, site là kênh mới với 4 sản phẩm lúc ra mắt. Dải số liệu đặt ngay dưới hero **không đọc document tour nào**, nên 4 hay 40 sản phẩm cũng không lộ.
```

- [ ] **Bước 3: Kiểm — g3 không tăng cảnh báo**

```bash
git checkout -- scripts/reports/ 2>/dev/null
npm --prefix scripts run audit:spec >/dev/null 2>&1
python3 -c "
import json; d=json.load(open('scripts/reports/g3-binding-map-vs-template.json',encoding='utf-8'))
print(json.dumps(d['summary'], ensure_ascii=False))
assert d['summary']['fail']==0, 'g3 co drift muc fail'
assert d['summary']['warn']<=15, f\"canh bao tang: {d['summary']['warn']} > 15\"
print('OK')"
```
Kỳ vọng: `fail: 0`, `warn` không vượt 15 (mốc đã ghi ở `06-BINDING_MAP` §7.1), in `OK`.

> `g3` chỉ đọc §3 và §4.x, không đọc §5.x, nên bốn hàng này chưa vào tầm kiểm của nó. Phép kiểm trên là để **bảo đảm không hồi quy**, không phải để xác nhận bốn hàng mới đúng.

- [ ] **Bước 4: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add docs/core-specs/06-BINDING_MAP.md
git commit -m "docs: BINDING_MAP §5.7 khai bon khoi moi cua trang chu

Dai so lieu, logo doi tac, danh gia khach, bao gia doan — moi khoi tro ve field
that trong siteSettings, ten field trong backtick theo quy uoc §1.

Ghi ro thu tu huong A va ly do: dai so lieu khong doc document tour nao."
```

---

# PHA C — Vòng Design cho trang chủ

## Việc 7: Soạn prompt bàn giao Design

**File**
- Tạo: `docs/prompts/PHA-F2-TRANG-CHU.md`

**Giao diện**
- Dùng: `06-BINDING_MAP` §5.7 sau việc 6.
- Sinh ra: mockup trang chủ, đầu vào cho việc 8–12.

**Vì sao cần vòng Design mới.** Bàn giao bước 7 hiện có (`docs/design/BAN-GIAO-PHA-F.dc.html`) đã vẽ bảy loại trang, nhưng màn `Home` trong đó **chỉ có** hero, thanh tin cậy, tour, lưới hub. Bốn khối mới chưa được vẽ.

- [ ] **Bước 1: Soạn prompt**

Nội dung bắt buộc phải có, theo khuôn `docs/prompts/PHA-F-CLAUDE-DESIGN.md` đã qua kiểm P1–P6:

1. **Vai và cổng cứng** — Design làm bước 7; `06-BINDING_MAP` đã duyệt; không sửa `src/`, `cms/`, `scripts/`.
2. **Bối cảnh, nêu thẳng** — doanh thu 7 triệu đô/năm đến từ **offline, đại lý, OTA**; site là kênh mới; catalogue lúc ra mắt là **4 sản phẩm**. Bài toán: *site mới trông vững như công ty lâu năm khi hàng còn mỏng*.
3. **Gu chủ dự án chốt** — "chắc chắn và nhiều số liệu, kiểu công ty lớn".
4. **Bố cục A đã duyệt**, 8 khối đúng thứ tự, kèm bảng khối ↔ field ở `06-BINDING_MAP` §5.7.
5. **Bằng chứng có thật** — giấy phép, năm thành lập, số khách, logo đối tác, ảnh thật từ chuyến đi, đánh giá kèm điểm OTA, giải thưởng. Design được phép thiết kế ô cho tất cả những thứ này.
6. **Ràng buộc** — ba bộ giao diện đều dùng được; AA ≥ 4.5; `--c-sand` cấm làm nền chữ trắng; vùng rỗng ẩn hẳn; không mã màu ngoài token; đặt chỗ chỉ qua Zalo.
7. **Vẫn phải vẽ trạng thái ít dữ liệu** — khối tour ở mốc **1 mục** và **4 mục**. Dải số liệu ở **3** và **5** ô.
8. **Không phát JSON-LD đánh giá** — nêu rõ để Design không thiết kế sao vàng gợi ý rich snippet.
9. **Gặp mơ hồ thì DỪNG và hỏi**, không tự quyết.
10. **Cổng ra** — chờ chủ dự án duyệt QA1, không tự mở sang bước 8.
11. **Khối tự kiểm P1–P6** ở cuối file.

- [ ] **Bước 2: Tự kiểm P1–P6**

Đọc lại prompt vừa viết, trả lời ĐẠT/TRƯỢT cho từng tiêu chí theo `playbook/ai/PROMPT_FACTORY.md` §3. Trượt cái nào thì sửa rồi kiểm lại từ đầu. Ghi bảng kết quả vào cuối file.

- [ ] **Bước 3: Đóng gói tự chứa**

Gộp prompt cộng `06-BINDING_MAP`, `07-DESIGN_TOKENS`, `00-PROJECT_BRIEF`, `tokens.css` vào một file để đưa sang Claude Design mà không cần mở repo.

```bash
ls -la docs/prompts/PHA-F2-TRANG-CHU.md
```

> **Cạm bẫy đã gặp:** khi gộp, đừng tách chuỗi bằng `split('---BẮT ĐẦU PROMPT---')` — dấu mốc đó xuất hiện **hai lần** (một lần trong câu hướng dẫn, một lần là mốc thật), nên `split()[1]` lấy nhầm đoạn và **mất trọn phần prompt**. Tách theo dòng, và thêm phép chặn: đoạn tách ra phải chứa tiêu đề vai và dài hơn 3000 ký tự, không thì dừng chứ đừng ghi file lỗi.

- [ ] **Bước 4: Commit và bàn giao**

```bash
git add docs/prompts/PHA-F2-TRANG-CHU.md
git commit -m "docs: prompt ban giao vong Design thu hai cho trang chu

Ban giao buoc 7 hien co da ve bay loai trang nhung man Home chi co hero, thanh
tin cay, tour, luoi hub — bon khoi moi chua duoc ve.

Da tu kiem P1-P6."
```

**DỪNG.** Đưa file cho Claude Design. Việc 8–12 chỉ chạy sau khi có mockup và chủ dự án duyệt QA1.

---

# PHA D — Bốn khối trang chủ

> Cả bốn việc dưới đây theo **cùng một khuôn**: một component mới, guard rỗng, nối vào `SiteHome`, chứng minh hai chiều. Đọc việc 8 kỹ; việc 9–11 nói rõ chỗ khác.

## Việc 8: Dải số liệu

**File**
- Tạo: `src/components/HomeStatsBand.astro`
- Sửa: `src/components/SiteHome.astro`

**Giao diện**
- Dùng: `SiteStat` từ việc 5; `config` đã có sẵn trong props của `SiteHome`.
- Sinh ra: khoá section `'stats'` dùng trong `DEFAULT_SECTIONS`.

- [ ] **Bước 1: Tạo component**

```astro
---
// Dải số liệu — 06-BINDING_MAP §5.7. Nguồn duy nhất: siteSettings.stats.
//
// Đây là trụ của trang chủ: nó KHÔNG đọc một document tour nào, nên site có 4
// hay 40 sản phẩm thì khối này vẫn đầy. Đó là lý do nó tồn tại.
import type { SiteStat } from '../lib/types'

export interface Props {
  stats?: SiteStat[] | null
}

const { stats } = Astro.props
// Ô thiếu cả `value` lẫn `label` là ô rỗng — bỏ, không render ô trắng.
const items = (stats ?? []).filter(s => s.value || s.label)
---

{items.length > 0 && (
  <section class="stats-band">
    <div class="container stats-grid">
      {items.map(stat => (
        <div class="stat">
          {stat.value && <span class="stat-value">{stat.value}</span>}
          {stat.label && <span class="stat-label">{stat.label}</span>}
          {stat.note && <span class="stat-note">{stat.note}</span>}
        </div>
      ))}
    </div>
  </section>
)}

<style>
  .stats-band {
    background: var(--c-primary);
    color: var(--c-text-inverse);
    padding: var(--s7) 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--s6);
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: var(--s1);
    text-align: center;
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: var(--fs-h1);
    font-weight: var(--fw-800);
    line-height: 1.05;
  }

  .stat-label {
    font-size: var(--fs-base);
    font-weight: var(--fw-600);
  }

  .stat-note {
    font-size: var(--fs-label);
    opacity: 0.82;
  }

  @media (max-width: 767px) {
    .stats-grid { gap: var(--s5); }
    .stat-value { font-size: var(--fs-h3); }
  }
</style>
```

> Nền dùng `--c-primary` với chữ `--c-text-inverse`. Cả ba bộ giao diện đều đạt AA ở cặp này — đã đo: 9.46 / 7.27 / 5.47. Đừng đổi sang `--c-sand`, cặp đó chỉ đạt 3.28.

- [ ] **Bước 2: Nối vào SiteHome**

Thêm import ở đầu file `SiteHome.astro`:

```astro
import HomeStatsBand from './HomeStatsBand.astro'
```

Thêm nhánh vào `switch (section.key)`:

```astro
      case 'stats':
        return <HomeStatsBand stats={config?.stats} />
```

Thêm `{ key: 'stats', hidden: false },` vào `DEFAULT_SECTIONS`, **ngay sau `hero`** — đây là vị trí 2 của hướng A.

- [ ] **Bước 3: Thêm khoá vào danh sách chọn trong Studio**

Trong `cms/schemas/siteSettings.ts`, thêm vào `SECTION_KEYS`:

```ts
  { title: '📊 Dải số liệu', value: 'stats' },
```

> Bỏ bước này thì biên tập viên không sắp xếp được khối, và `sections` có giá trị `stats` sẽ nằm ngoài enum đóng.

- [ ] **Bước 4: Kiểm — chứng minh HAI CHIỀU**

Guard rỗng phải chứng minh cả chiều ẩn lẫn chiều hiện. Chiều "ẩn" là chiều dễ tưởng đúng mà không kiểm.

```bash
npm run check 2>&1 | grep -E "^- "
npm run build >/dev/null 2>&1 && echo BUILD_OK
echo "── chiều ẨN (siteSettings.stats hiện đang trống) ──"
grep -c "stats-band" dist/index.html
```
Kỳ vọng: `0 errors`, `BUILD_OK`, và `0` — khối không render khi chưa có dữ liệu, **trang vẫn dựng**.

```bash
echo "── chiều HIỆN ──"
```
Nhập 3 ô số liệu trong Sanity Studio, rồi:

```bash
npm run build >/dev/null 2>&1
python3 -c "
import re
h = open('dist/index.html', encoding='utf-8').read()
n = len(re.findall(r'class=\"stat\"', h))
assert n == 3, f'ky vong 3 o, dem duoc {n}'
assert 'stats-band' in h
print('chiều HIỆN: OK,', n, 'ô')"
```

> Nếu chưa nhập được dữ liệu vào Studio thì **dừng lại và báo**, đừng đánh dấu việc này xong. Guard chưa chứng minh chiều hiện thì coi như chưa chứng minh.

- [ ] **Bước 5: Kiểm cổng và tương phản**

```bash
node scripts/check-theme-contrast.mjs | tail -1
git checkout -- scripts/reports/ 2>/dev/null
npm --prefix scripts run gate:all 2>&1 | grep "đỏ:"
```

- [ ] **Bước 6: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add src/components/HomeStatsBand.astro src/components/SiteHome.astro cms/schemas/siteSettings.ts
git commit -m "feat: dai so lieu tren trang chu

Tru cua huong A: khoi nay KHONG doc document tour nao, nen 4 hay 40 san pham thi
no van day. Do la cach site moi trong vung khi hang con mong.

Nen dung --c-primary voi chu inverse — ca ba bo giao dien deu dat AA (9.46 /
7.27 / 5.47). Khong dung --c-sand, cap do chi dat 3.28.

Da chung minh hai chieu: trong -> khoi khong render, trang van dung; co du lieu
-> dung so o."
```

---

## Việc 9: Logo đối tác

**File**
- Tạo: `src/components/HomePartners.astro`
- Sửa: `src/components/SiteHome.astro`, `cms/schemas/siteSettings.ts`

**Giao diện**
- Dùng: `SitePartner` từ việc 5, `imageUrl` từ `src/lib/sanity-image`.
- Sinh ra: khoá section `'partners'`.

**Khác việc 8 ở ba chỗ:** có ảnh nên phải có `alt`; mục có `url` thành `<a>`, mục không có thành `<div>` — **không** bọc `<a>` rỗng; và ảnh phải `loading="lazy"` vì khối nằm dưới màn hình đầu.

- [ ] **Bước 1: Tạo component**

```astro
---
// Logo đối tác — 06-BINDING_MAP §5.7. Nguồn: siteSettings.partners.
import type { SitePartner } from '../lib/types'
import { imageUrl } from '../lib/sanity-image'

export interface Props {
  partners?: SitePartner[] | null
  heading?: string
}

const { partners, heading = 'Đối tác' } = Astro.props

// Không có logo thì không có gì để hiện — bỏ, đừng render ô trống mang tên.
const items = (partners ?? [])
  .map(p => ({ ...p, src: imageUrl(p.logo, { width: 240 }) }))
  .filter(p => !!p.src)
---

{items.length > 0 && (
  <section class="partners">
    <div class="container">
      <h2 class="partners-heading">{heading}</h2>
      <div class="partners-grid">
        {items.map(p => {
          const img = (
            <img
              src={p.src}
              alt={p.logo?.alt || p.name || ''}
              loading="lazy"
              width="160"
              height="64"
            />
          )
          return p.url
            ? <a class="partner" href={p.url} target="_blank" rel="noopener">{img}</a>
            : <div class="partner">{img}</div>
        })}
      </div>
    </div>
  </section>
)}

<style>
  .partners { padding: var(--s7) 0; }

  .partners-heading {
    font-size: var(--fs-section);
    margin-bottom: var(--s5);
  }

  .partners-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--s5);
    align-items: center;
  }

  .partner {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--s4);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    background: var(--c-card);
    min-height: 88px;
  }

  .partner img {
    max-width: 100%;
    height: auto;
    object-fit: contain;
  }

  a.partner { transition: border-color var(--m-fast) var(--m-ease); }
  a.partner:hover { border-color: var(--c-primary); }
</style>
```

- [ ] **Bước 2: Nối vào SiteHome và Studio**

Import, thêm `case 'partners':` trả `<HomePartners partners={config?.partners} />`, thêm `{ key: 'partners', hidden: false },` vào `DEFAULT_SECTIONS` **sau `whyUs`**, và thêm `{ title: '🤝 Logo đối tác', value: 'partners' }` vào `SECTION_KEYS`.

- [ ] **Bước 3: Kiểm hai chiều, cộng kiểm alt**

```bash
npm run check 2>&1 | grep -E "^- "
npm run build >/dev/null 2>&1 && echo BUILD_OK
grep -c "class=\"partners\"" dist/index.html
```
Kỳ vọng chiều ẩn: `0`.

Sau khi nhập 2 đối tác (một có `url`, một không) vào Studio:

```bash
npm run build >/dev/null 2>&1
python3 -c "
import re
h = open('dist/index.html', encoding='utf-8').read()
block = re.search(r'<section class=\"partners\".*?</section>', h, re.S).group(0)
imgs = re.findall(r'<img[^>]*>', block)
assert len(imgs) == 2, f'ky vong 2 logo, dem duoc {len(imgs)}'
for i in imgs:
    assert re.search(r'alt=\"[^\"]+\"', i), f'THIEU ALT: {i[:80]}'
    assert 'loading=\"lazy\"' in i, 'thieu loading=lazy'
assert block.count('<a class=\"partner\"') == 1, 'muc khong co url khong duoc boc thanh link'
print('OK — 2 logo, deu co alt, 1 link 1 khong')"
```

- [ ] **Bước 4: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add src/components/HomePartners.astro src/components/SiteHome.astro cms/schemas/siteSettings.ts
git commit -m "feat: khoi logo doi tac tren trang chu

Muc co url thanh <a>, muc khong co thanh <div> — khong boc link rong.
Alt bat buoc theo I12; anh lazy vi khoi nam duoi man hinh dau.
Da kiem tren HTML that: du alt, du lazy, dung so link."
```

---

## Việc 10: Đánh giá khách

**File**
- Tạo: `src/components/HomeTestimonials.astro`
- Sửa: `src/components/SiteHome.astro`, `cms/schemas/siteSettings.ts`

**Giao diện**
- Dùng: `SiteTestimonial` từ việc 5.
- Sinh ra: khoá section `'testimonials'`.

**Việc này mang một rủi ro riêng.** Ràng buộc "không serialize" dễ bị vi phạm về sau bởi người không biết lý do. Nên bước kiểm ở đây **phải grep output build**, không chỉ đọc mã.

- [ ] **Bước 1: Tạo component**

```astro
---
// Đánh giá khách — 06-BINDING_MAP §5.7. Nguồn: siteSettings.testimonials.
//
// ⚠️ KHÔNG serialize ra JSON-LD. Không phát Review, không phát AggregateRating.
// Google cấm rich snippet đánh giá tự phục vụ — nội dung doanh nghiệp tự đăng về
// chính mình. Phát ra là rủi ro phạt thủ công, mà I6 là cổng mức fail.
// Xem QĐ-2026-08-06-09. Ai định thêm JSON-LD ở đây thì đọc bản ghi đó trước.
import type { SiteTestimonial } from '../lib/types'

export interface Props {
  testimonials?: SiteTestimonial[] | null
  heading?: string
}

const { testimonials, heading = 'Khách nói gì' } = Astro.props

// Không có nội dung đánh giá thì không có gì để hiện.
const items = (testimonials ?? []).filter(x => !!x.quote)
---

{items.length > 0 && (
  <section class="testimonials">
    <div class="container">
      <h2 class="testimonials-heading">{heading}</h2>
      <div class="testimonials-grid">
        {items.map(x => (
          <figure class="testimonial">
            <blockquote class="testimonial-quote">{x.quote}</blockquote>
            <figcaption class="testimonial-meta">
              {x.authorName && <span class="testimonial-author">{x.authorName}</span>}
              {x.authorNote && <span class="testimonial-note">{x.authorNote}</span>}
              {x.sourceName && (
                x.sourceUrl
                  ? <a class="testimonial-source" href={x.sourceUrl} target="_blank" rel="noopener">{x.sourceName}</a>
                  : <span class="testimonial-source">{x.sourceName}</span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
)}

<style>
  .testimonials {
    padding: var(--s7) 0;
    background: var(--c-surface-alt);
  }

  .testimonials-heading {
    font-size: var(--fs-section);
    margin-bottom: var(--s5);
  }

  .testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--s5);
  }

  .testimonial {
    display: flex;
    flex-direction: column;
    gap: var(--s4);
    padding: var(--s5);
    background: var(--c-card);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    margin: 0;
  }

  .testimonial-quote {
    margin: 0;
    font-size: var(--fs-base);
    line-height: var(--lh-body);
    color: var(--c-text);
  }

  .testimonial-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: var(--fs-sm);
  }

  .testimonial-author { font-weight: var(--fw-700); }
  .testimonial-note { color: var(--c-text-muted); }
  .testimonial-source { color: var(--c-primary); }
  a.testimonial-source:hover { text-decoration: underline; }
</style>
```

- [ ] **Bước 2: Nối vào SiteHome và Studio**

Import, `case 'testimonials':`, thêm vào `DEFAULT_SECTIONS` **sau `partners`**, và `{ title: '💬 Đánh giá khách', value: 'testimonials' }` vào `SECTION_KEYS`.

- [ ] **Bước 3: Kiểm — ràng buộc không serialize phải ĐO ĐƯỢC**

```bash
npm run build >/dev/null 2>&1 && echo BUILD_OK
python3 - <<'PY'
import re, json, pathlib
bad = []
for p in pathlib.Path('dist').rglob('index.html'):
    h = p.read_text(encoding='utf-8')
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        if re.search(r'"@type"\s*:\s*"(Review|AggregateRating)"', block):
            bad.append(str(p))
assert not bad, f'VI PHAM: phat JSON-LD danh gia o {bad}'
print('OK — khong trang nao phat Review hay AggregateRating')
PY
git checkout -- scripts/reports/ 2>/dev/null
npm --prefix scripts run validate:post 2>&1 | grep -E "jsonld-post"
```
Kỳ vọng: in `OK`, và `jsonld-post` ở trạng thái `[pass]`.

- [ ] **Bước 4: Kiểm guard hai chiều**

Chiều ẩn: `grep -c "class=\"testimonials\"" dist/index.html` → `0`.
Chiều hiện: nhập 2 đánh giá, build lại, đếm `figure class="testimonial"` phải bằng 2.

- [ ] **Bước 5: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add src/components/HomeTestimonials.astro src/components/SiteHome.astro cms/schemas/siteSettings.ts
git commit -m "feat: khoi danh gia khach tren trang chu

KHONG serialize ra JSON-LD — khong Review, khong AggregateRating. Google cam rich
snippet danh gia tu phuc vu; phat ra la rui ro phat thu cong, ma I6 la cong muc
fail. Ly do ghi ngay dau file de nguoi sau khong vo tinh them vao.

Da kiem bang cach quet MOI trang trong dist: khong trang nao phat hai @type do."
```

---

## Việc 11: Khối báo giá đoàn

**File**
- Tạo: `src/components/HomeGroupQuote.astro`
- Sửa: `src/components/SiteHome.astro`, `cms/schemas/siteSettings.ts`

**Giao diện**
- Dùng: `SiteGroupQuote` và `SiteContact` từ `src/lib/types`.
- Sinh ra: khoá section `'groupQuote'`.

**Khác ba việc trên:** khối này cần **hai** nguồn — nội dung từ `groupQuote`, nút từ `contact.zaloUrl`. Chưa điền Zalo thì khối vẫn hiện nội dung nhưng **không có nút**, không phải nút chết.

- [ ] **Bước 1: Tạo component**

```astro
---
// Khối báo giá đoàn — 06-BINDING_MAP §5.7. Khối cuối trang chủ.
//
// Hai nguồn: nội dung từ siteSettings.groupQuote, nút từ siteSettings.contact.
// Cố ý KHÔNG khai số liên hệ riêng ở groupQuote — khai lần thứ hai là tạo nguồn
// sự thật thứ hai (N7).
import type { SiteGroupQuote, SiteContact } from '../lib/types'

export interface Props {
  groupQuote?: SiteGroupQuote | null
  contact?: SiteContact | null
}

const { groupQuote, contact } = Astro.props

const heading = groupQuote?.heading
const text = groupQuote?.text
const ctaLabel = groupQuote?.ctaLabel
const zaloUrl = contact?.zaloUrl

// Không có chữ nào thì không có khối. Nút thiếu link thì bỏ nút, giữ nội dung.
const hasContent = !!(heading || text)
const showCta = !!(zaloUrl && ctaLabel)
---

{hasContent && (
  <section class="group-quote">
    <div class="container group-quote__inner">
      <div class="group-quote__text">
        {heading && <h2 class="group-quote__heading">{heading}</h2>}
        {text && <p class="group-quote__body">{text}</p>}
      </div>
      {showCta && (
        <a class="group-quote__cta" href={zaloUrl} target="_blank" rel="noopener">{ctaLabel}</a>
      )}
    </div>
  </section>
)}

<style>
  .group-quote {
    padding: var(--s8) 0;
    background: var(--c-primary-soft);
  }

  .group-quote__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--s6);
  }

  .group-quote__text {
    display: flex;
    flex-direction: column;
    gap: var(--s3);
    max-width: 62ch;
  }

  .group-quote__heading {
    font-size: var(--fs-h3);
    color: var(--c-primary-strong);
  }

  .group-quote__body {
    font-size: var(--fs-base);
    line-height: var(--lh-body);
    color: var(--c-text);
  }

  .group-quote__cta {
    flex-shrink: 0;
    padding: var(--s4) var(--s6);
    border-radius: var(--radius-pill);
    background: var(--c-accent);
    color: var(--c-text-inverse);
    font-size: var(--fs-base);
    font-weight: var(--fw-700);
    transition: background var(--m-fast) var(--m-ease);
  }

  .group-quote__cta:hover { background: var(--c-accent-strong); }
</style>
```

- [ ] **Bước 2: Nối vào SiteHome và Studio**

`case 'groupQuote':` trả `<HomeGroupQuote groupQuote={config?.groupQuote} contact={config?.contact} />`. Thêm vào `DEFAULT_SECTIONS` ở **vị trí cuối cùng**, và `{ title: '📩 Báo giá đoàn', value: 'groupQuote' }` vào `SECTION_KEYS`.

- [ ] **Bước 3: Kiểm ba trạng thái**

```bash
npm run build >/dev/null 2>&1 && echo BUILD_OK
grep -c "group-quote" dist/index.html
```
Kỳ vọng khi `groupQuote` trống: `0`.

Sau khi nhập `heading` và `text` **nhưng chưa có** `ctaLabel`:

```bash
npm run build >/dev/null 2>&1
python3 -c "
h = open('dist/index.html', encoding='utf-8').read()
assert 'group-quote__heading' in h, 'thieu tieu de'
assert 'group-quote__cta' not in h, 'nut hien du thieu ctaLabel — nut chet'
print('OK — co noi dung, khong nut')"
```

Sau khi thêm `ctaLabel`: build lại, `group-quote__cta` phải xuất hiện và `href` phải bằng đúng `contact.zaloUrl`.

- [ ] **Bước 4: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add src/components/HomeGroupQuote.astro src/components/SiteHome.astro cms/schemas/siteSettings.ts
git commit -m "feat: khoi bao gia doan cuoi trang chu

Hai nguon: noi dung tu groupQuote, nut tu contact.zaloUrl. Khong khai so lien he
rieng — khai lan thu hai la tao nguon su that thu hai (N7).

Da kiem ba trang thai: trong -> an han; co noi dung khong co nhan nut -> hien noi
dung KHONG hien nut; du ca hai -> hien nut tro dung zaloUrl."
```

---

## Việc 12: Bốn điểm khác biệt vào Sanity, và chốt thứ tự hướng A

**File**
- Sửa: `docs/core-specs/01-CONTENT_MODEL.md` (§2.15, field `whyUs`)
- Sửa: `docs/DECISIONS.md`
- Sửa: `cms/schemas/siteSettings.ts`, `src/lib/queries/siteSettings.ts`, `src/lib/types.ts`
- Sửa: `scripts/meta-validators/g1-content-model-vs-schema.ts`
- Sửa: `src/components/HomeTrustBar.astro`, `src/components/SiteHome.astro`, `src/lib/homepage.ts`
- Sửa: `docs/core-specs/06-BINDING_MAP.md` (hàng "Vì sao chọn" ở §5.7)

**Giao diện**
- Dùng: khuôn `stats` từ việc 8.
- Sinh ra: thứ tự `DEFAULT_SECTIONS` cuối cùng của hướng A.

**Vì sao gộp chung một việc.** Chuyển `trustItems` sang Sanity và chốt thứ tự khối là hai mặt của cùng một thay đổi: sau khi có đủ tám khối, `DEFAULT_SECTIONS` mới đặt được đúng. Tách ra thì có một lần build trung gian với thứ tự sai.

- [ ] **Bước 1: Khai `whyUs` — CONTENT_MODEL trước, đúng thứ tự**

Thêm dòng vào bảng §2.15 và mô tả field con, theo đúng khuôn việc 4:

```
whyUs[]: { icon?: string, title: string, description?: string }
```

Cập nhật changelog thành v1.0.17. Ghi bản ghi `QĐ-2026-08-06-10` vào cuối `DECISIONS.md`, nêu rõ: bốn điểm khác biệt trước đây cứng trong `HOME_COPY.trustItems` ở `src/lib/homepage.ts`, biên tập viên không sửa được; nay chuyển sang `siteSettings` để chủ dự án tự đổi.

- [ ] **Bước 2: Schema, truy vấn, kiểu, g1**

Theo đúng khuôn việc 5. Kiểu:

```ts
export interface SiteWhyUs {
  icon?: string
  title?: string
  description?: string
}
```

và `whyUs: SiteWhyUs[] | null` trên `SiteSettingsResult`.

- [ ] **Bước 3: `HomeTrustBar` đọc từ Sanity, có bản dự phòng**

Đổi `HomeTrustBar` để nhận `items` từ `siteSettings.whyUs`; nếu rỗng thì dùng `HOME_COPY[lang].trustItems` như cũ.

```astro
const list = (items ?? []).filter(x => x.title)
const finalItems = list.length > 0 ? list : fallback
```

> Giữ bản dự phòng chứ **không** xoá `trustItems` khỏi `homepage.ts` ở bước này. Xoá ngay là để trang chủ trống khối khi chủ dự án chưa kịp nhập. Ghi phiếu nợ dọn sau khi Studio đã có dữ liệu.

- [ ] **Bước 4: Chốt thứ tự hướng A**

`DEFAULT_SECTIONS` trong `SiteHome.astro` thành đúng tám khối, đúng thứ tự:

```ts
const DEFAULT_SECTIONS = [
  { key: 'hero', hidden: false },
  { key: 'stats', hidden: false },
  { key: 'tours', hidden: false },
  { key: 'trustBar', hidden: false },
  { key: 'partners', hidden: false },
  { key: 'testimonials', hidden: false },
  { key: 'guides', hidden: false },
  { key: 'groupQuote', hidden: false },
]
```

> Các khoá cũ (`hubGrid`, `areas`, `attractions`, `experiences`, `stays`, `editorialBody`, `banners`, `faq`, `safety`) **giữ nguyên trong `switch`** — chủ dự án bật lại được qua `siteSettings.sections`. Chỉ đổi mặc định, không xoá năng lực.

- [ ] **Bước 5: Sửa hàng "Vì sao chọn" ở BINDING_MAP §5.7**

Đổi thành `siteSettings.whyUs[]` cho khớp code. Bảng nói một đằng code một nẻo là đúng thứ `g3` sinh ra để bắt.

- [ ] **Bước 6: Kiểm — thứ tự thật trên HTML đã dựng**

```bash
npm run check 2>&1 | grep -E "^- "
npm run build >/dev/null 2>&1 && echo BUILD_OK
python3 - <<'PY'
import re
h = open('dist/index.html', encoding='utf-8').read()
marks = [
    ('hero',        r'site-home-hero'),
    ('stats',       r'class="stats-band"'),
    ('tours',       r'rollup'),
    ('trustBar',    r'trust'),
    ('partners',    r'class="partners"'),
    ('testimonials',r'class="testimonials"'),
    ('groupQuote',  r'class="group-quote"'),
]
pos = [(n, h.find(re.search(p, h).group(0))) for n, p in marks if re.search(p, h)]
print('thứ tự thật:', ' → '.join(n for n, _ in sorted(pos, key=lambda x: x[1])))
order = [n for n, _ in sorted(pos, key=lambda x: x[1])]
assert order == [n for n, _ in marks if n in order], f'THU TU SAI: {order}'
print('OK')
PY
```
Kỳ vọng: thứ tự in ra khớp hướng A, in `OK`. Khối chưa có dữ liệu sẽ vắng — đó là đúng.

- [ ] **Bước 7: Kiểm cổng lần cuối**

```bash
npm run check 2>&1 | grep -E "^- "
node scripts/check-theme-contrast.mjs | tail -1
git checkout -- scripts/reports/ 2>/dev/null
npm --prefix scripts run gate:all 2>&1 | grep "đỏ:"
```
Kỳ vọng: `0 errors`, `[pass] 3 bộ`, `1/10 đỏ: validators/deferred-gate.ts`.

- [ ] **Bước 8: Commit**

```bash
git checkout -- scripts/reports/ 2>/dev/null
git add docs/ cms/ src/ scripts/
git commit -m "feat: bon diem khac biet vao Sanity, chot thu tu huong A

whyUs chuyen tu HOME_COPY.trustItems (cung trong code, bien tap vien khong sua
duoc) sang siteSettings. Giu ban du phong: Studio chua co du lieu thi dung ban
trong code, khong de khoi trong.

DEFAULT_SECTIONS thanh dung tam khoi huong A: hero, so lieu, tour, vi sao chon,
doi tac, danh gia, cam nang, bao gia doan. Cac khoa cu giu nguyen trong switch —
chu du an bat lai duoc qua siteSettings.sections, khong xoa nang luc.

Da kiem thu tu tren HTML da dung, khong phai tren ma nguon."
```

---

## Tự soát kế hoạch

**Phủ spec.** Đối chiếu từng mục của `SPEC-2026-08-06-trang-chu-xung-tam`:

| Mục spec | Việc phủ |
|---|---|
| §3 hướng A, 8 khối | 8, 9, 10, 11, 12 |
| §5 bốn field | 4, 5 |
| §6 không serialize đánh giá | 4 (khai), 5 (schema), 10 (thi hành + đo) |
| §7 thứ tự thi hành | pha B → C → D, đúng thứ tự |
| §8 bốn trang chi tiết còn lại | 1, 2, 3 |
| §8 "Vì sao chọn" sang siteSettings | 12 |
| §9 BC-1 đến BC-6 | rải trong bước kiểm của từng việc |

Không mục nào của spec thiếu việc phủ.

**Chỗ bỏ ngỏ.** Không có "TBD", không có "xử lý lỗi cho phù hợp", không có "viết test cho phần trên". Mọi bước có mã đều kèm mã thật.

**Nhất quán tên.** `SiteStat`, `SitePartner`, `SiteTestimonial`, `SiteGroupQuote`, `SiteWhyUs` khai ở việc 5 và 12, dùng đúng tên đó ở việc 8–12. Khoá section `stats`, `partners`, `testimonials`, `groupQuote`, `trustBar` nhất quán giữa `DEFAULT_SECTIONS`, `switch`, và `SECTION_KEYS`.

**Điều kiện ngoài tầm kế hoạch.** Việc 8–12 có bước "nhập dữ liệu vào Studio" mà **chỉ chủ dự án làm được** — token của tác nhân chỉ có quyền đọc. Việc nào chưa chứng minh được chiều "hiện" thì **không đánh dấu xong**, phải báo lại.
