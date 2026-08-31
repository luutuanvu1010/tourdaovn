# Kế hoạch thi hành — Hero +50px · `/cong-ty/` · Form đặt tour

> **Cho tác nhân thi hành:** dùng `superpowers:subagent-driven-development` (khuyến nghị) hoặc
> `superpowers:executing-plans` để chạy từng Task. Các bước dùng cú pháp checkbox `- [ ]`.

**Mục tiêu:** Ba thay đổi bề mặt chủ dự án yêu cầu ngày 2026-08-31 — hero trang chi tiết cao thêm
50px, mở trang danh sách `/cong-ty/`, và làm gọn form đặt tour kèm bảng chi tiết giá — thi hành
theo đúng thứ tự đã chốt, không mảnh nào vượt cổng của mảnh khác.

**Kiến trúc:** Thuần tầng giao diện và tài liệu. Con số vào `src/styles/tokens.css`; bố cục chung
ở `DetailLayout`/`PageHead` **không đụng**; dữ liệu riêng ở component entity. Một thay đổi truy
vấn GROQ (thêm `summary`). **Không chạm `src/lib/booking/`, không chạm endpoint, không đổi lược
đồ D1.**

**Tech stack:** Astro 5 (component `.astro`, CSS scoped), Sanity GROQ, Cloudflare Workers,
Vitest (`@cloudflare/vitest-pool-workers`, chạy trong miniflare).

**Spec:**
- `docs/specs/SPEC-2026-08-31-hero-entity-cao-them-50px.md`
- `docs/specs/SPEC-2026-08-31-trang-danh-sach-cong-ty.md`
- `docs/specs/SPEC-2026-08-31-form-dat-tour-gon-va-chi-tiet-gia.md`

---

## Ràng buộc toàn cục

Mọi Task đều ngầm mang các ràng buộc này. Đọc một lần, áp cho tất cả.

1. **Thứ tự bắt buộc, không đảo:** Task 1 (phiếu `QĐ-2026-08-31-03`) → Task 2–3 (`/cong-ty/`) →
   Task 4–8 (form) → Task 9 (hero). **Task 9 không được chạy trước Task 1.**

2. **Giá trị giao diện đi vào `src/styles/tokens.css`, KHÔNG viết cứng trong component.**
   `CLAUDE.md` §8 luật cứng 1 (P6/N7). `grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" ` trên file vừa
   sửa phải **rỗng**.

3. **Không sửa `src/components/DetailLayout.astro`, `PageHead.astro`, `Sidebar.astro`,
   `Card.astro`.** Đó là frame chung / primitive dùng chung (luật cứng 2). Kế hoạch này không có
   Task nào cần chúng; nếu thấy "cần", **dừng và hỏi** — đó là dấu hiệu phạm vi đã nở.

4. **`npm run build` TRƯỚC, rồi mới `npm run gate`.** DR-105: `gate` = `astro check &&
   gate:all`, **không có `astro build`**. Chạy `gate` trên `dist/` cũ sinh **đỏ ảo**. So bảng
   tổng kết **từng dòng** trước/sau, **không đếm tổng số đỏ**.

5. **Không trích dòng `[pass]` của cổng G1 làm bằng chứng** — nó so với bảng chép cứng trong mã,
   không đọc `01-CONTENT_MODEL`.

6. **Test mới phải nằm trong `test/**/*.test.ts`.** `vitest.config.ts` khai
   `include: ['test/**/*.test.ts']` — file trong `src/lib/__tests__/` **KHÔNG được `npm test`
   chạy**. Đặt nhầm chỗ là test xanh giả.

7. **Đo giao diện bằng JS DOM (`getBoundingClientRect`), không chụp màn hình.** Chụp màn hình
   trên site này hay treo.

8. **Không `git push`.** Push lên `main` kích hoạt Workers Builds dựng và **đè** bản deploy. Kế
   hoạch này chỉ commit cục bộ; phát hành là quyết định riêng của chủ dự án.

9. **Mỗi Task kết thúc bằng một commit.** Thông điệp tiếng Việt không dấu, theo lệ repo
   (`feat(...)`, `fix(...)`, `docs(...)`, `refactor(...)`).

---

## Bản đồ file

| File | Trách nhiệm | Task |
|---|---|---|
| `docs/DECISIONS.md` | phiếu `QĐ-2026-08-31-03` | 1 |
| `docs/core-specs/06-BINDING_MAP.md` | §3 hàng Hero — ngoại lệ Luật 3 mới | 1 |
| `src/lib/queries/organization.ts` · `hotel.ts` · `resort.ts` | thêm `summary` vào truy vấn danh sách | 2 |
| `test/queries/listing-summary.test.ts` | **tạo mới** — canh hợp đồng "truy vấn danh sách phải lấy summary" | 2 |
| `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md` | khai `/cong-ty/` là index nhánh | 3 |
| `src/lib/routes.ts` | cờ `hasIndex` + chú thích quanh dòng 241 | 3 |
| `src/components/BookingForm.astro` | toàn bộ thay đổi form (markup + `<style>` + `<script>`) | 4–8 |
| `src/lib/uiCopy.ts` | chuỗi mới cho bảng chi tiết giá và nhãn ⓘ | 8 |
| `src/styles/tokens.css` | năm giá trị hero + khối chú thích 186–188 | 9 |
| `docs/core-specs/07-DESIGN_TOKENS.md` | bốn hàng `layout.hero.entity.*` | 9 |
| `docs/core-specs/KIEN-TRUC-TEMPLATE.md` | §4 năm giá trị + tiền đề ví dụ | 9 |
| `docs/BACKLOG.md` | ba khoản nợ phát sinh | 3, 5, 9 |

---

## Task 1 — Phiếu `QĐ-2026-08-31-03` và sửa `06-BINDING_MAP`

**Vì sao đi trước mọi thứ:** `06-BINDING_MAP` §3 hàng Hero đặt điều kiện *"phải xét lại TRƯỚC khi
vùng giá render trên bất kỳ trang nào"*, tiền đề là `sticky-bar__price` render trên **0 trang**.
Giá đang render thật. Sửa token trước khi ghi phiếu là làm sâu thêm một ngoại lệ chưa ai xét lại.

**Files:**
- Modify: `docs/DECISIONS.md` (thêm phiếu mới ở cuối)
- Modify: `docs/core-specs/06-BINDING_MAP.md:17` (nhật ký phiên bản) và `:74` (hàng Hero)

**Interfaces:**
- Produces: mã phiếu `QĐ-2026-08-31-03` — Task 9 viện dẫn nó ở tiêu chí tiền đề.

- [ ] **Bước 1: Xác nhận điều kiện thật sự đã bị kích hoạt (đừng tin kế hoạch, tự đo)**

```bash
curl -s "https://tourdao.vn/tour/tour-3-dao-hon-mun-hon-mun-lang-chai-hon-tam/" \
  | grep -o 'class="sticky-bar__price"[^>]*>[^<]*' | head -1
```

Kỳ vọng: in ra một dòng có `data-field="gia"` và một số tiền (ví dụ `850.000₫/người`).
Nếu **rỗng**: dừng lại, báo chủ dự án — tiền đề của cả Task này đã đổi.

- [ ] **Bước 2: Đo vị trí thanh dính ở 1366×768 — số "TRƯỚC" cho phiếu**

Mở trang trên trong Chrome ở cửa sổ 1366×768, chạy trong console:

```js
const s = document.querySelector('.sticky-bar');
JSON.stringify({
  vp: [innerWidth, innerHeight],
  heroH: Math.round(document.querySelector('.hero-shell').getBoundingClientRect().height),
  stickyTop: Math.round(s.getBoundingClientRect().top + scrollY),
})
```

Ghi lại con số `stickyTop`. Kỳ vọng ≈ **668**. Ghi số **thật đo được**, không chép 668 nếu máy
trả số khác — con số của phiếu phải là số đo, không phải số chép.

- [ ] **Bước 3: Viết phiếu vào `docs/DECISIONS.md`**

Thêm vào cuối file, theo đúng khuôn các phiếu khác:

```markdown
## QĐ-2026-08-31-03 — Nới Luật 3: chấp nhận thanh dính mang giá rơi khỏi màn đầu ở 1366

**Bối cảnh.** `QĐ-2026-08-28-03` chấp nhận chiều cao hero 430px là **ngoại lệ Luật 3 có ghi
phiếu**, kèm đúng một điều kiện: *"Chưa thành vi phạm sống vì `sticky-bar__price` render trên
**0 trang**. Điều kiện bắt buộc: phải xét lại TRƯỚC khi vùng giá render trên bất kỳ trang nào."*

**Điều kiện đã bị kích hoạt, và chưa ai thi hành việc xét lại.** Đo 2026-08-31 trên production:
`.sticky-bar__price` render thật trên trang tour (`data-region="sticky-bar" data-field="gia"`,
giá trị `850.000₫/người`). Không phiếu nào giữa `QĐ-2026-08-28-03` và hôm nay chạm hàng Hero của
`06-BINDING_MAP` — kiểm bằng nhật ký phiên bản `06:17` (v2.10.0 → v2.13.0 đều là mục khác) và
`grep "Luật 3"` toàn bộ `DECISIONS.md` / `DRIFT_LOG.md` / `core-specs/` / `adr/`.

**Chốt (chủ dự án, 2026-08-31): nới Luật 3.** Hero trang chi tiết entity cao thêm 50px ở mọi khổ
(`SPEC-2026-08-31-hero-entity-cao-them-50px.md`). Chấp nhận thanh dính mang giá **không** còn
trên màn đầu ở viewport 1366.

**Hệ quả nhận rõ, không giấu.** Ở 1366 thanh dính từ **<SỐ ĐO TRƯỚC>px** lên **<SỐ ĐO SAU>px**;
mốc màn đầu là **657px** (chiều cao viewport thật của trình duyệt trên màn 768, sau khi trừ
chrome). Áp cho **mọi** tiêu đề, không riêng tiêu đề hai dòng. Đây là **vi phạm Luật 3 được chấp
nhận có chủ ý**, không còn là "chưa thành vi phạm".

**Điều kiện "0 trang" của `QĐ-2026-08-28-03` XOÁ HẲN.** Nó đã hết hiệu lực; giữ lại trong `06` là
bẫy cho người đọc sau.

**Cái gì đỡ cho quyết định này.** Giá vẫn có mặt hai chỗ: thanh dính (dính lại sau khi cuộn tới)
và `.bf__pax-price` — đơn giá từng hạng khách trong form đặt tour. Không trang nào mất giá.

**Nợ kèm theo.** `SPEC-…-form-dat-tour…` §4.2 ghi một rủi ro ngủ: với bảng giá dạng bậc
(`kind: 'tiers'`) thì `.bf__pax-price` không render, nên tour giá bậc sẽ chỉ còn thanh dính.
Hôm nay `data/prices.yaml` có **0/29** khoá dùng `tiers`. Vào `docs/BACKLOG.md` là **B-020**.
```

Thay `<SỐ ĐO TRƯỚC>` bằng số ở Bước 2. `<SỐ ĐO SAU>` để **nguyên placeholder** — Task 9 bước
cuối quay lại điền. Ghi rõ trong phiếu: *"số SAU điền sau khi thi hành, xem Task 9"*.

- [ ] **Bước 4: Sửa `06-BINDING_MAP.md:74` — hàng Hero**

Trong ô mô tả của hàng `Hero`, tìm đoạn:

> ⚠ **NGOẠI LỆ LUẬT 3 CÓ GHI PHIẾU.** … Chưa thành vi phạm sống vì `sticky-bar__price` render
> trên **0 trang** — thanh chỉ mang CTA. **Điều kiện bắt buộc: phải xét lại TRƯỚC khi vùng giá
> render trên bất kỳ trang nào.**

Thay bằng:

> ⚠ **NGOẠI LỆ LUẬT 3 CÓ GHI PHIẾU — `QĐ-2026-08-31-03` (2026-08-31).** Điều kiện "0 trang" của
> `QĐ-2026-08-28-03` **đã hết hiệu lực và bị xoá**: giá render thật trên thanh dính từ 2026-08-31.
> Chủ dự án đã xét lại và **chấp nhận** thanh dính mang giá không còn trên màn đầu ở 1366 (đo
> **<SỐ ĐO SAU>px** so với mốc **657px**), đổi lấy hero cao thêm 50px. Đây là vi phạm Luật 3
> **được chấp nhận có chủ ý**, không phải "chưa thành vi phạm".

Đồng thời **chưa** sửa các con số chiều cao ở hàng này — Task 9 làm, cùng lượt với `tokens.css`.

- [ ] **Bước 5: Ghi nhật ký phiên bản `06-BINDING_MAP.md:17`**

Nối vào cuối chuỗi nhật ký: `; **v2.14.0 duyệt 2026-08-31, QĐ-2026-08-31-03** — nới Luật 3, xoá
điều kiện "0 trang" của ngoại lệ hero (§3 hàng Hero)`. Sửa số phiên bản ở đầu dòng 17 thành
`v2.14.0`.

- [ ] **Bước 6: Kiểm không còn dấu vết điều kiện cũ**

```bash
grep -rn "0 trang" docs/core-specs/06-BINDING_MAP.md
```

Kỳ vọng: chỉ còn dòng **nói rằng nó đã bị xoá**, không còn dòng nào phát biểu nó như điều kiện
đang hiệu lực.

- [ ] **Bước 7: Commit**

```bash
git add docs/DECISIONS.md docs/core-specs/06-BINDING_MAP.md
git commit -m "docs(quyet-dinh): QD-2026-08-31-01 noi Luat 3 cho hero cao them 50px"
```

---

## Task 2 — Ba truy vấn danh sách lấy `summary` (chữa 10 thẻ rỗng đang sống)

**Files:**
- Modify: `src/lib/queries/organization.ts:39-47` (`allOrganizationsQuery`)
- Modify: `src/lib/queries/hotel.ts:55-64` (`allHotelsQuery`)
- Modify: `src/lib/queries/resort.ts:58-68` (`allResortsQuery`)
- Create: `test/queries/listing-summary.test.ts`

**Interfaces:**
- Consumes: không có (Task độc lập đầu tiên của nhánh `/cong-ty/`)
- Produces: ba truy vấn trả thêm khoá `summary: string | null`. `toListing()` trong
  `RouteDispatch.astro:89` đã đọc `e.summary` sẵn — **không** phải sửa gì ở đó.

- [ ] **Bước 1: Đo đường nền — xác nhận lỗi đang sống**

```bash
for u in /khach-san/ /resort/ /tour/; do
  tong=$(curl -s "https://tourdao.vn$u" | grep -o '<p class="card-summary"' | wc -l)
  co=$(curl -s "https://tourdao.vn$u" | perl -0777 -ne 'print scalar(() = /<p class="card-summary"[^>]*>\s*\S.*?<\/p>/gs)')
  echo "$u  tong=$tong  co-chu=$co"
done
```

Kỳ vọng: `/khach-san/ tong=10 co-chu=0`, `/tour/ tong=28 co-chu=28`. Ghi lại — đây là "trước".

> ⚠ Phải dùng `[^>]*` trong biểu thức. Astro chèn `data-astro-cid-*` vào thẻ, nên
> `grep '<p class="card-summary"></p>'` trả **0** kể cả khi mọi thẻ đều rỗng.

- [ ] **Bước 2: Viết test thất bại**

Tạo `test/queries/listing-summary.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { allOrganizationsQuery } from '../../src/lib/queries/organization'
import { allHotelsQuery } from '../../src/lib/queries/hotel'
import { allResortsQuery } from '../../src/lib/queries/resort'
import { allToursQuery } from '../../src/lib/queries/tour'

// Hợp đồng: mọi truy vấn danh sách phải lấy `summary`, vì `Card.astro` render
// <p class="card-summary"> KHÔNG kiểm rỗng — thiếu field là đẻ ra một <p> rỗng
// trên URL công khai (R7 "vùng rỗng ẩn hẳn"). Đo 2026-08-31: /khach-san/ có
// 10 thẻ, cả 10 rỗng.
describe('truy vấn danh sách lấy summary', () => {
  const truyVan = {
    organization: allOrganizationsQuery,
    hotel: allHotelsQuery,
    resort: allResortsQuery,
    tour: allToursQuery,
  }

  for (const [ten, fn] of Object.entries(truyVan)) {
    it(`${ten} có "summary": summary.<lang>`, () => {
      expect(fn('vi')).toContain('"summary": summary.vi')
    })
    it(`${ten} nội suy đúng ngôn ngữ, không chép cứng vi`, () => {
      expect(fn('en')).toContain('"summary": summary.en')
      expect(fn('en')).not.toContain('summary.vi')
    })
  }
})
```

- [ ] **Bước 3: Chạy test, xác nhận ĐỎ**

```bash
npm test -- test/queries/listing-summary.test.ts
```

Kỳ vọng: **FAIL** 6 trên 8 assertion — `organization`, `hotel`, `resort` đỏ; `tour` xanh (nó đã
có sẵn `summary`, đóng vai nhóm đối chứng chứng minh test đọc đúng thứ nó tưởng).

- [ ] **Bước 4: Sửa ba truy vấn**

Trong cả ba file, thêm **đúng một dòng** ngay sau dòng `"slug": …`, khớp vị trí và cách viết của
`allToursQuery` (`src/lib/queries/tour.ts:79`):

`src/lib/queries/organization.ts` — trong `allOrganizationsQuery`:

```groq
    "slug": slug.${lang}.current,
    "summary": summary.${lang},
    ${mainImageFragment()},
```

`src/lib/queries/hotel.ts` — trong `allHotelsQuery`: chèn cùng một dòng vào cùng vị trí.
`src/lib/queries/resort.ts` — trong `allResortsQuery`: chèn cùng một dòng vào cùng vị trí.

**Không** đổi gì khác trong ba hàm: giữ nguyên `starRating`, `beachfront`, `geo`, `orgType`.

- [ ] **Bước 5: Chạy test, xác nhận XANH**

```bash
npm test -- test/queries/listing-summary.test.ts
```

Kỳ vọng: **PASS** 8/8.

- [ ] **Bước 6: Dựng rồi kiểm bản dựng cục bộ**

```bash
npm run build
for u in khach-san resort; do
  tong=$(grep -o '<p class="card-summary"' "dist/$u/index.html" | wc -l)
  co=$(perl -0777 -ne 'print scalar(() = /<p class="card-summary"[^>]*>\s*\S.*?<\/p>/gs)' "dist/$u/index.html")
  echo "$u  tong=$tong  co-chu=$co"
done
```

Kỳ vọng: `tong` bằng `co-chu` ở cả hai — không thẻ nào rỗng nữa.

- [ ] **Bước 7: Commit**

```bash
git add src/lib/queries/organization.ts src/lib/queries/hotel.ts src/lib/queries/resort.ts test/queries/listing-summary.test.ts
git commit -m "fix(danh-sach): truy van organization/hotel/resort lay summary, het the rong"
```

---

## Task 3 — Mở `/cong-ty/`

**Files:**
- Modify: `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md` (§1.3, thêm một hàng trên dòng 96)
- Modify: `src/lib/routes.ts:75` (cờ) và `:241-242` (chú thích)
- Modify: `docs/BACKLOG.md` (nợ `/tac-gia/`)

**Interfaces:**
- Consumes: Task 2 — `allOrganizationsQuery` nay có `summary`, nếu không thì 3 thẻ ra rỗng.
- Produces: URL `/cong-ty/` tồn tại; `autoRouteLinks('vi')` trả thêm một mục `Công ty`.

- [ ] **Bước 1: Sửa spec TRƯỚC (spec là nguồn sự thật, code là dẫn xuất — `CLAUDE.md` §2)**

Trong `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md` §1.3, thêm một hàng **ngay trên** dòng 96
(hàng `/cong-ty/{slug}`), theo đúng khuôn các nhánh khác:

```
| `/cong-ty/` | index nhánh | Organization | CollectionPage |
```

- [ ] **Bước 2: Lật cờ**

`src/lib/routes.ts:75`, hàng `organization`: `hasIndex: false` → `hasIndex: true`.
**Không** đổi gì khác trên dòng đó — `segments`, `labels`, `hasTerm` giữ nguyên.

- [ ] **Bước 3: Sửa chú thích thành sai ngay sau bước 2**

`src/lib/routes.ts:241-242`, khối chú thích của `autoRouteLinks()` đang ghi:

> `person` và `organization` không lên vì khai `hasIndex: false` — không có trang danh sách để
> trỏ tới.

Sửa thành:

> `person` không lên vì khai `hasIndex: false` — không có trang danh sách để trỏ tới.
> (`organization` đã có `/cong-ty/` từ `QĐ-2026-08-31`.)

- [ ] **Bước 4: Dựng và kiểm bốn thứ**

```bash
npm run build
test -f dist/cong-ty/index.html && echo "OK trang ton tai"
perl -0777 -ne 'print scalar(() = /<p class="card-summary"[^>]*>\s*\S.*?<\/p>/gs), "\n"' dist/cong-ty/index.html   # ky vong 3
grep -c 'href="/cong-ty/' dist/cong-ty/index.html                                    # the tro ve chi tiet
grep -c '<loc>https://tourdao.vn/cong-ty/</loc>' dist/sitemap-vi.xml                 # ky vong 1
grep -c 'href="/cong-ty/"' dist/cong-ty/cong-ty-tnhh-tour-dao/index.html             # breadcrumb, ky vong >=1
```

Kỳ vọng: trang tồn tại; **3** thẻ có tóm tắt; `/cong-ty/` có trong sitemap; breadcrumb của trang
chi tiết nay trỏ tới một trang **có thật** (trước đây trỏ 404).

- [ ] **Bước 5: Kiểm menu chính KHÔNG đổi**

```bash
git diff --stat src/site.config.ts
```

Kỳ vọng: **rỗng**. Chân trang tự sinh từ `autoRouteLinks()`; menu chính là quyết định biên tập,
ngoài phạm vi. Nếu build đỏ ở `assertNavTargetsExist` thì có ai đó đã khai menu — dừng và hỏi.

- [ ] **Bước 6: Ghi nợ `/tac-gia/`**

Thêm vào `docs/BACKLOG.md`:

Khuôn theo lệ file (`### B-0NN — Tiêu đề · trạng thái`); số kế tiếp sau `B-019` và `B-020`:

```markdown
### B-021 — `/tac-gia/` trỏ breadcrumb vào 404 · `mở`

`Breadcrumb.astro:43-52` đẩy crumb nhánh **không kiểm `hasIndex`**, nên mọi trang
`/tac-gia/{slug}/` mang liên kết tới `/tac-gia/` (404) và đẩy URL đó vào JSON-LD
`BreadcrumbList`. Y hệt ca `organization` đã chữa ngày 31/08 bằng
`SPEC-2026-08-31-trang-danh-sach-cong-ty.md`. Chữa bằng cách mở `/tac-gia/` (bật `hasIndex`)
hoặc cho `Breadcrumb` kiểm `hasIndex`. Cố ý KHÔNG gộp vào đợt 31/08 để giữ phạm vi.
```

- [ ] **Bước 7: Cổng và commit**

```bash
npm run build && npm run gate
```

So bảng tổng kết **từng dòng** với lần chạy trước Task 2. Dòng nào đổi trạng thái thì giải trình
dòng đó. Không đếm tổng số đỏ.

```bash
git add docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md src/lib/routes.ts docs/BACKLOG.md
git commit -m "feat(cong-ty): mo trang danh sach /cong-ty/ cho Organization"
```

---

## Task 4 — Ghi chú form thu thành ⓘ bằng `<details>`

**Files:**
- Modify: `src/components/BookingForm.astro` — markup dòng ~118–150 (ô ngày, hàng bộ đếm),
  dòng ~179 (ghi chú tạm tính), và khối `<style>` từ dòng ~705

**Interfaces:**
- Consumes: không
- Produces: class CSS `.bf__tip`, `.bf__tip-mark`, `.bf__tip-body` — Task 8 dùng lại
  `.bf__tip-body` cho ghi chú mùa trong bảng chi tiết giá.

- [ ] **Bước 1: Đo đường nền**

Mở `https://tourdao.vn/tour/tour-3-dao-hon-mun-hon-mun-lang-chai-hon-tam/` ở 1710×985, console:

```js
const f = document.querySelector('form.bf'), H = e => e ? Math.round(e.getBoundingClientRect().height) : null;
JSON.stringify({
  formH: H(f),
  paxRows: [...f.querySelectorAll('.bf__pax')].map(e => H(e)),
  notes: [...f.querySelectorAll('.bf__note, .bf__pax-note')].map(e => H(e)),
})
```

Kỳ vọng ≈ `formH: 1237`, `paxRows: [75,128,128,128]`. Ghi lại.

- [ ] **Bước 2: Dựng primitive ⓘ trong markup**

Ba chỗ dùng chung một hình dạng. Mẫu (ô ngày):

```astro
<label class="bf__label" for="bf-date">
  {t('bookingDepartDate')}
  <details class="bf__tip">
    <summary class="bf__tip-mark" aria-label={t('bookingShowNote')}>i</summary>
    <p class="bf__tip-body" id="bf-date-range" data-date-range-text>{dateRangeText}</p>
  </details>
</label>
<input id="bf-date" class="bf__input" type="date" name="departDate" required
       min={minDate} max={maxDate} aria-describedby="bf-date-range" />
```

Ba ràng buộc **bắt buộc**, bỏ cái nào cũng hỏng đúng thứ nó chống:

1. **`id="bf-date-range"` ở lại trên node chứa CHỮ**, và `aria-describedby="bf-date-range"` ở lại
   trên `<input>`. Đặt lên `<summary>` là ô ngày mất mô tả.
2. **Giữ `data-date-range-text`** — script dòng ~633 cập nhật nội dung dòng này.
3. **Dùng `<details>`, KHÔNG dùng `<button>` + `hidden`.** Lý do ở Bước 6.

Làm tương tự cho `.bf__pax-note` (ghi chú tuổi, đặt cạnh `.bf__pax-name`) và cho ghi chú tạm tính
(`bookingSubtotalNote`, đặt cạnh nhãn "Tạm tính").

- [ ] **Bước 3: CSS**

Thêm vào `<style>`:

```css
  /* `<details>` là phần tử KHỐI. Để dấu ⓘ nằm cùng dòng với nhãn mà không đẩy
     chiều cao hàng, cả `<details>` lẫn `<summary>` phải khai inline-* rõ ràng. */
  .bf__tip { display: inline; }
  .bf__tip-mark {
    /* MỘT khai báo duy nhất — đừng tách `position` ra rule thứ hai, ::before
       cần khối chứa được lập ngay tại đây */
    position: relative;
    display: inline-flex; align-items: center; justify-content: center;
    width: 1.25rem; height: 1.25rem; margin-inline-start: var(--s1);
    border: 1px solid var(--c-border); border-radius: var(--radius-pill);
    font-size: var(--fs-sm); font-weight: var(--fw-600);
    color: var(--c-text-muted); cursor: pointer; vertical-align: middle;
    list-style: none;
  }
  .bf__tip-mark::-webkit-details-marker { display: none; }
  .bf__tip-mark::before {
    /* vùng chạm 44px KHÔNG ăn vào chiều cao dòng — nếu không, −150px của
       ghi chú tuổi bị chính nút ⓘ ăn lại */
    content: ''; position: absolute; width: 2.75rem; height: 2.75rem;
    left: 50%; top: 50%; transform: translate(-50%, -50%);
  }
  .bf__tip-mark:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
  .bf__tip-body {
    display: block; margin: var(--s2) 0 0;
    font-size: var(--fs-sm); color: var(--c-text-muted);
  }
```

**Không** viết cứng màu hay cỡ — mọi giá trị là token.

- [ ] **Bước 4: Xoá CSS chết**

Bỏ `.bf__pax-note` khỏi `<style>` nếu không còn markup nào dùng. Giữ `.bf__note` — nó còn dùng
chỗ khác (`bf__done`).

- [ ] **Bước 5: Đo lại — kiểm chiều cao giảm đúng ~225px**

Chạy lại đoạn JS ở Bước 1 trên bản dựng cục bộ (`npm run build && npx astro preview`).
Kỳ vọng: `paxRows` về **[75, ~78, ~78, ~78]**, `formH` giảm còn **≈ 1012**.

- [ ] **Bước 6: Kiểm ba thứ mà bước này tồn tại để bảo vệ**

```bash
# 6a. KHÔNG có [hidden] tran nao moi
git diff src/components/BookingForm.astro | grep -n '^\+.*\[hidden\]' || echo "OK khong them [hidden]"
```

**6b. Kiểm KHÔNG JS.** Tắt JavaScript trong Chrome (DevTools → Settings → Debugger → Disable
JavaScript), tải lại trang tour. Kỳ vọng: bấm được vào ⓘ và **đọc được** khoảng ngày khởi hành.
`BookingForm.astro:62-64` có chú thích *"Server dựng sẵn một bản để không JS vẫn đọc được phạm
vi"* — đây là điều khoản bước này phải giữ, không phải phá.

**6c. Kiểm trạng thái ĐÓNG bằng HÌNH HỌC, không bằng thuộc tính** (bài học DR-102 — thuộc tính
đúng mà render sai):

```js
[...document.querySelectorAll('.bf__tip-body')].map(e => e.offsetHeight)
```

Kỳ vọng: **toàn 0**. Không dùng `details.open === false` làm bằng chứng.

- [ ] **Bước 7: Commit**

```bash
git add src/components/BookingForm.astro
git commit -m "refactor(dat-tour): ghi chu form thu thanh nut i bang details, giam 225px"
```

---

## Task 5 — Bỏ khối `.bf__head` (giá trùng)

**Files:**
- Modify: `src/components/BookingForm.astro` — markup dòng 112–115, `<style>` dòng ~707–709
- Modify: `docs/BACKLOG.md`

**Interfaces:**
- Consumes: không
- Produces: prop `priceLabel` của `BookingForm` thành không dùng — **giữ nguyên prop**, xem Bước 4.

- [ ] **Bước 1: Xác nhận giá đang hiện hai lần**

```js
const t = document.querySelector('.bf__price').textContent.trim();
[...document.querySelectorAll('body *')]
  .filter(e => !e.children.length && e.textContent.trim().includes(t))
  .map(e => ({ cls: e.className, y: Math.round(e.getBoundingClientRect().top + scrollY) }))
```

Kỳ vọng: đúng **2** phần tử — `sticky-bar__price` (y≈736) và `bf__price` (y≈1151).

- [ ] **Bước 2: Xoá markup và CSS**

Xoá trọn khối ở `BookingForm.astro:112-115`:

```astro
  <div class="bf__head">
    <span class="bf__eyebrow">{t('priceFrom')}</span>
    <strong class="bf__price">{priceLabel}</strong>
  </div>
```

Xoá `.bf__head`, `.bf__eyebrow`, `.bf__price` khỏi `<style>`.

- [ ] **Bước 3: Kiểm sàn giá còn nguyên**

```bash
npm run build
grep -c 'class="bf__pax-price"' dist/tour/tour-3-dao-hon-mun-hon-mun-lang-chai-hon-tam/index.html
```

Kỳ vọng **≥ 1**. `.bf__pax-price` là sàn an toàn khi thanh dính vắng; mất nó thì bước này không
được lên.

Quét toàn bộ tour có form:

```bash
for f in $(grep -rl 'class="bf ' dist --include=index.html); do
  n=$(grep -c 'class="bf__pax-price"' "$f")
  [ "$n" -eq 0 ] && echo "THIEU GIA: $f"
done; echo "quet xong"
```

Kỳ vọng: không dòng `THIEU GIA` nào.

- [ ] **Bước 4: KHÔNG xoá prop `priceLabel`**

`TourDetail.astro:213` vẫn truyền `priceLabel` xuống `BookingForm`. Giữ nguyên prop và lời gọi —
xoá nó là chạm thêm một file ngoài phạm vi Task này. Ghi nợ vào `docs/BACKLOG.md`:

```markdown
### B-022 — prop `priceLabel` của `BookingForm` thành thừa · `mở`

Sau khi bỏ `.bf__head` (`SPEC-2026-08-31-form-dat-tour…` §4.2), prop này không còn nơi dùng;
`TourDetail.astro:213` vẫn truyền. Cố ý giữ để đợt 31/08 không nở sang `TourDetail.astro`.
Dọn khi có dịp chạm file đó.
```

- [ ] **Bước 5: Kiểm giá nay xuất hiện đúng MỘT lần**

Lặp lại đoạn JS ở Bước 1 trên bản dựng cục bộ. Kỳ vọng: **1** phần tử (`sticky-bar__price`).

- [ ] **Bước 6: Commit**

```bash
git add src/components/BookingForm.astro docs/BACKLOG.md
git commit -m "fix(dat-tour): bo khoi gia trung trong form, giu gia o thanh dinh"
```

---

## Task 6 — Khối thanh toán gộp một hàng

**Files:**
- Modify: `src/components/BookingForm.astro` — markup dòng ~154–165, `<style>` `.bf__pay*`

**Interfaces:**
- Consumes: không
- Produces: không đổi tên trường, giá trị, hay ngữ nghĩa. `paymentMethod` vẫn là
  `<input type="radio" name="paymentMethod">` với hai giá trị `transfer` | `onboard`.

- [ ] **Bước 1: Đọc ràng buộc trước khi gõ — ba thứ phụ thuộc trạng thái ban đầu**

| Phụ thuộc | Nếu tự ý chọn sẵn một đoạn |
|---|---|
| `initialQuote` (tạm tính ban đầu, không ưu đãi) | số tiền mặc định khách thấy **đổi** |
| `openStep2()`: `if (payEls.length && !payEls.some(el => el.checked))` | nhánh báo lỗi "chưa chọn" thành **chết** |
| `validateBooking` `schema.ts:238-240` | máy chủ trả **400** cho đơn thật |

**Chủ dự án chốt: KHÔNG chọn sẵn đoạn nào.** Segmented control theo lệ thường luôn có một đoạn
sáng — ở đây thì **không**, và đó là chủ ý.

- [ ] **Bước 2: Đổi hình dạng, giữ nguyên ngữ nghĩa**

Giữ `<p class="bf__label" id="bf-pay-label">` và `role="radiogroup" aria-labelledby="bf-pay-label"`
**y nguyên** — bỏ nhãn là nhóm mất tên và phần tiết kiệm tụt dưới 40px.

Giữ `<input type="radio">` thật, chỉ tạo dáng `<label>`. **Không** thay bằng `<button>`.

```css
  .bf__pay { flex-direction: row; gap: var(--s2); }
  .bf__pay-opt {
    flex: 1; justify-content: center; min-height: 2.75rem;
    border: 1px solid var(--c-border); border-radius: var(--radius-md);
    padding: var(--s2) var(--s3); cursor: pointer;
  }
  .bf__pay-opt:has(:checked) {
    border-color: var(--c-primary); border-width: 2px;   /* dấu hiệu NGOÀI màu */
    background: var(--c-primary-soft);
  }
  .bf__pay-opt:has(:focus-visible) { outline: 2px solid var(--c-primary); outline-offset: 2px; }
```

- [ ] **Bước 3: Kiểm trạng thái ban đầu là "chưa chọn"**

```js
[...document.querySelectorAll('input[name="paymentMethod"]')].map(e => e.checked)
```

Kỳ vọng: **`[false, false]`**. Đây là tiêu chí chống đúng lỗi Bước 1 mô tả.

- [ ] **Bước 4: Kiểm nhánh báo lỗi còn sống**

Trên bản dựng cục bộ: chọn ngày, để nguyên 1 người lớn, **không** chọn hình thức thanh toán, bấm
"Đặt tour ngay". Kỳ vọng: hiện báo lỗi ở `[data-err="paymentMethod"]`, **không** mở bước 2.

- [ ] **Bước 5: Đo chiều cao**

```js
Math.round(document.querySelector('.bf__pay').getBoundingClientRect().height)
  + Math.round(document.querySelector('#bf-pay-label').getBoundingClientRect().height)
```

Kỳ vọng ≈ **56** (từ 96). Nếu ra khác, **sửa ngân sách §4.7 của spec bằng số đo thật**, đừng giữ
con số −40 rồi thôi.

- [ ] **Bước 6: Commit**

```bash
git add src/components/BookingForm.astro
git commit -m "refactor(dat-tour): khoi thanh toan gop mot hang, khong chon san"
```

---

## Task 7 — Nền xám cho form

**Files:**
- Modify: `src/components/BookingForm.astro` — `<style>`

**Interfaces:**
- Consumes: Task 5, 6 (markup đã ổn định)
- Produces: `.bf` có nền `--c-surface-alt`; `.bf__quote` và `.bf__qr` lật sang `--c-card`.

- [ ] **Bước 1: Quét — đừng chép danh sách, hãy quét**

```bash
grep -nE "background:" src/components/BookingForm.astro
```

Bản nháp đầu của spec liệt kê tay "ba hệ quả" và **bỏ sót `.bf__qr`**. Quét rồi quyết **từng
dòng** một.

- [ ] **Bước 2: Sửa năm khai báo**

```css
  /* nền form — token, không viết cứng; đổi theo bộ màu (bien-sau / cat-bien / ngoc-lam) */
  .bf { background: var(--c-surface-alt); padding: var(--s4); border-radius: var(--radius-md); }

  /* lật ngược: bảng giá TRẮNG nổi trên form xám */
  .bf__quote { background: var(--c-card); … }

  /* khối QR khách quét để TRẢ TIỀN — tan vào nền là hỏng đúng chỗ đắt nhất */
  .bf__qr { background: var(--c-card); … }

  /* --c-card là nền THƯỜNG của .bf__btn, nên dùng nó cho hover là xoá phản hồi, không phải sửa */
  .bf__btn:hover:not(:disabled) { background: var(--c-primary-soft); border-color: var(--c-primary); }

  /* đang là transparent: trên form xám thành ô xám kẹp giữa hai nút tròn trắng */
  .bf__count { background: var(--c-card); border-radius: var(--radius-md); }
```

- [ ] **Bước 3: Kiểm không màu nào viết cứng**

```bash
grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/BookingForm.astro || echo "OK toan token"
```

Kỳ vọng: **rỗng**.

- [ ] **Bước 4: Kiểm khác màu ở CẢ BA bộ màu**

```js
const bf = getComputedStyle(document.querySelector('.bf')).backgroundColor;
const q  = getComputedStyle(document.querySelector('.bf__quote')).backgroundColor;
JSON.stringify({ bf, q, khac: bf !== q })
```

Kỳ vọng `khac: true`. Lặp lại sau khi đổi bộ màu sang `cat-bien` và `ngoc-lam` (đổi thuộc tính
theme trên `<html>` trong DevTools). Cả ba bộ đều phải `true`.

- [ ] **Bước 5: Kiểm khối QR**

Gửi thử một đơn trên bản dựng cục bộ để khối `.bf__done` hiện ra, rồi:

```js
const qr = getComputedStyle(document.querySelector('.bf__qr')).backgroundColor;
JSON.stringify({ qr, bf: getComputedStyle(document.querySelector('.bf')).backgroundColor })
```

Kỳ vọng: hai màu **khác nhau**.

- [ ] **Bước 6: Kiểm hover thật sự đổi**

`:hover` **không** kích được bằng JS. Rê chuột lên nút `+` và quan sát: nền phải đổi, không chỉ
viền. (Đây là mục duy nhất trong kế hoạch không đo được bằng script — nói rõ thay vì giả vờ.)

- [ ] **Bước 7: Commit**

```bash
git add src/components/BookingForm.astro
git commit -m "feat(dat-tour): nen xam cho form, lat bang gia va khoi QR sang trang"
```

---

## Task 8 — Bảng chi tiết giá

**Files:**
- Modify: `src/components/BookingForm.astro` — markup `.bf__quote`, `<script>` hàm dựng lại tạm tính
- Modify: `src/lib/uiCopy.ts` — chuỗi mới, **đủ 5 ngôn ngữ**

**Interfaces:**
- Consumes: Task 4 (`.bf__tip-body`), Task 7 (`.bf__quote` nay nền trắng)
- Produces: không có API mới. **Không chạm `src/lib/booking/`** — mọi field cần đã có trên `Quote`.

- [ ] **Bước 1: Thêm chuỗi vào `uiCopy.ts`**

Năm khoá mới, **cả 5 ngôn ngữ**. Chuẩn tham chiếu: các khoá `booking*` hiện có ở `zh/ko/ru` đang
là **tiếng Anh** — theo đúng lệ đó, đừng tự dịch.

```ts
bookingShowNote:      { vi: 'Xem ghi chú', en: 'Show note', zh: 'Show note', ko: 'Show note', ru: 'Show note' },
bookingPriceDetail:   { vi: 'Xem chi tiết giá', en: 'Price breakdown', zh: 'Price breakdown', ko: 'Price breakdown', ru: 'Price breakdown' },
bookingBeforeDiscount:{ vi: 'Tạm tính trước ưu đãi', en: 'Before discount', zh: 'Before discount', ko: 'Before discount', ru: 'Before discount' },
bookingDiscountLine:  { vi: 'Ưu đãi trả trước', en: 'Prepay discount', zh: 'Prepay discount', ko: 'Prepay discount', ru: 'Prepay discount' },
bookingGrandTotal:    { vi: 'Tổng cộng', en: 'Total', zh: 'Total', ko: 'Total', ru: 'Total' },
bookingSeasonNote:    { vi: 'Đơn giá đã gồm phụ thu mùa {name} +{p}%, làm tròn lên nghìn.',
                        en: 'Unit price includes {name} season surcharge +{p}%, rounded up to the nearest thousand.',
                        zh: 'Unit price includes {name} season surcharge +{p}%, rounded up to the nearest thousand.',
                        ko: 'Unit price includes {name} season surcharge +{p}%, rounded up to the nearest thousand.',
                        ru: 'Unit price includes {name} season surcharge +{p}%, rounded up to the nearest thousand.' },
```

**Sáu** khoá, không phải năm. `bookingSeasonNote` là khuôn có hai chỗ thay (`{name}`, `{p}`) —
theo đúng lệ `bookingPayNote` hiện có. Bước 4 thay chỗ bằng `quote.season.name` và
`quote.season.percent`; **không** tự nhân hay tự làm tròn gì trong khuôn này.

- [ ] **Bước 1b: Nướng chuỗi vào `data-*` — script KHÔNG gọi được `t()`**

> ⚠ **Đây là chỗ dễ sai nhất của Task này.** Khối `<script>` ở `BookingForm.astro:282` là một
> **module riêng**: nó không thấy `const t = uiCopy(lang)` ở frontmatter (dòng 32). Mọi chuỗi
> phải đi qua `data-*` trên `<form>`. Xem lệ có sẵn: markup dòng 99
> `data-pay-note-text={t('bookingPayNote')}` → script dòng 310
> `const payNoteText = form.dataset.payNoteText || ''`.
>
> Viết `t('bookingBeforeDiscount')` hay `t.bookingBeforeDiscount` trong script đều ra
> **`undefined` in ra giữa bảng tiền**.

Thêm vào thẻ `<form>` (cạnh các `data-*` đang có):

```astro
  data-price-detail-text={t('bookingPriceDetail')}
  data-before-discount-text={t('bookingBeforeDiscount')}
  data-discount-line-text={t('bookingDiscountLine')}
  data-grand-total-text={t('bookingGrandTotal')}
  data-season-note-tpl={t('bookingSeasonNote')}
```

Và đọc ra ở đầu khối script, cạnh `payNoteText`:

```ts
    const beforeDiscountText = form.dataset.beforeDiscountText || ''
    const discountLineText   = form.dataset.discountLineText || ''
    const grandTotalText     = form.dataset.grandTotalText || ''
    const seasonNoteTpl      = form.dataset.seasonNoteTpl || ''
```

`bookingPriceDetail` và `bookingShowNote` chỉ dùng trong markup (`<summary>`, `aria-label`) nên
gọi thẳng `t('…')` được — **không** cần `data-*`.

- [ ] **Bước 2: Markup — `<details>` NGOÀI vùng `aria-live`**

`.bf__quote` mang `aria-live="polite"` và bị `replaceChildren()` mỗi lần bấm +/−. Đặt bảng chi
tiết vào trong đó là mỗi lần đổi số khách trình đọc màn hình đọc lại **toàn bộ** bảng.

Đặt `<details data-quote-detail>` **sau** `</div>` đóng `.bf__quote`:

```astro
  <details class="bf__detail" data-quote-detail>
    <summary class="bf__detail-sum">{t('bookingPriceDetail')}</summary>
    <div class="bf__detail-body" data-detail-lines></div>
  </details>
```

- [ ] **Bước 3: CSS — `:global()` là BẮT BUỘC, không phải tuỳ chọn**

```css
  .bf__detail-sum { font-size: var(--fs-sm); color: var(--c-primary); cursor: pointer; }
  /* Các dòng dưới do JS dựng bằng createElement nên KHÔNG mang data-astro-cid-*.
     Viết `.bf__line { … }` trần thì dòng JS dựng mất flex — số dán liền tiền,
     kiểu "Người lớn × 1019.550.000₫" (lỗi thật, DR-102). */
  [data-detail-lines] :global(.bf__line) {
    display: flex; justify-content: space-between; gap: var(--s3);
    font-size: var(--fs-sm); color: var(--c-text-muted);
  }
  [data-detail-lines] :global(.bf__line--total) {
    padding-top: var(--s2); border-top: 1px solid var(--c-border);
    font-weight: var(--fw-700); color: var(--c-text);
  }
```

- [ ] **Bước 4: Script — bốn mốc chính xác, giao diện KHÔNG BAO GIỜ nhân**

Trong hàm dựng lại tạm tính, sau khi có `quote`:

```ts
const box = form.querySelector('[data-detail-lines]') as HTMLElement
const wrap = form.querySelector('[data-quote-detail]') as HTMLDetailsElement
// Luật render 2: quote null (vượt bậc / hạng không có giá) → KHÔNG dựng bảng rỗng
if (!quote) { wrap.hidden = true; box.replaceChildren(); return }
wrap.hidden = false

const rows: [string, string][] = quote.lines.map(l =>
  [`${paxLabel(l.code)} × ${l.count}`, formatPrice(l.subtotal, lang)])

// Luật render 3: KHÔNG ưu đãi → quote.prepay VẮNG → không có totalGoc.
// Hai dòng giữa biến mất. Đây là luật render, TUYỆT ĐỐI không tính bù bằng nhân ngược:
// làm tròn lên nghìn không có phép nghịch đảo.
if (quote.prepay) {
  rows.push([beforeDiscountText, formatPrice(quote.prepay.totalGoc, lang)])
  rows.push([`${discountLineText} (−${quote.prepay.percent}%)`,
             `−${formatPrice(quote.prepay.totalGoc - quote.total, lang)}`])
}
rows.push([grandTotalText, formatPrice(quote.total, lang)])
```

Dựng từng dòng bằng `createElement('div')` + `className = 'bf__line'` (dòng cuối thêm
`bf__line--total`), hai `<span>` con.

Ghi chú mùa, chỉ khi **có** mùa (luật render 1 — không in "+0%"):

```ts
if (quote.season) { /* thêm .bf__tip-body: "Đơn giá đã gồm phụ thu mùa <tên> +<p>%, làm tròn lên nghìn." */ }
```

> **Luật chuẩn tắc — viết ra để người sửa sau không phá.** `apDieuChinh()` áp **cả hai** phần
> trăm trong một biểu thức rồi mới `Math.ceil` lên nghìn. Nên `totalGoc − total` chính xác nhưng
> **không** đúng bằng `percent`% của `totalGoc`. Phần trăm ghi như **luật**; số tiền là **số của
> engine**. Không có thang ưu đãi theo từng hạng khách.

- [ ] **Bước 5: Xoá hai dòng nay trùng**

`.bf__season` in `"{TênMùa} · +{p}%"` — trùng ghi chú mùa mới. `.bf__prepay` in
`"− {p}% · {totalGoc} nếu thanh toán khi khởi hành"` — **cùng con số** với dòng "Tạm tính trước
ưu đãi". Xoá cả hai `<p>` và CSS của chúng; xoá luôn code script cập nhật chúng.

- [ ] **Bước 6: KHÔNG đổi cặp `span`/`strong` trong `.bf__total`**

`showDone()` đọc nhãn qua DOM: `totalEl.closest('.bf__total')?.querySelector('span')?.textContent`.
Đổi cấu trúc con là **hỏng lặng lẽ** khối xác nhận sau khi gửi — không lỗi, chỉ là nhãn sai.

```bash
git diff src/components/BookingForm.astro | grep -n 'bf__total' || echo "OK khong cham bf__total"
```

- [ ] **Bước 7: Kiểm số tiền khớp engine ở CẢ HAI ca**

```bash
npm test -- test/booking/quote.test.ts
```

Kỳ vọng: **PASS**, và `git diff --stat src/lib/booking/` phải **rỗng** — bảng chi tiết dựng được
mà không sửa module dùng chung.

Trên bản dựng cục bộ, ca **có** ưu đãi (chọn "chuyển khoản trước"): mở bảng, kiểm
`Tạm tính trước ưu đãi − số giảm = Tổng cộng` khớp từng đồng.
Ca **không** ưu đãi (chọn "trả khi khởi hành"): mở bảng, kiểm **hai dòng giữa biến mất**.

- [ ] **Bước 8: Kiểm trạng thái ĐÓNG bằng hình học**

```js
document.querySelector('[data-detail-lines]').offsetHeight
```

Kỳ vọng: **0** khi tải trang. Không dùng `details.open === false` làm bằng chứng (DR-102).

- [ ] **Bước 9: Đo chiều cao cuối và cụm quyết định**

```js
const f = document.querySelector('form.bf');
const btn = f.querySelector('.bf__primary[data-open]');
const lab = f.querySelector('#bf-pax-label');
JSON.stringify({
  formH: Math.round(f.getBoundingClientRect().height),
  cum: Math.round(btn.getBoundingClientRect().bottom - lab.getBoundingClientRect().top),
})
```

Kỳ vọng: `formH ≤ 1000` (từ 1237), `cum ≤ 859`. **`cum` là tiêu chí chính** — nó là chiều cao
cụm, độc lập vị trí cuộn và độc lập chiều cao hero.

> Đo trong trạng thái **ưu đãi ĐANG BẬT** và ghi rõ điều đó. Công tắc ưu đãi đổi được ngoài git
> qua Studio; tắt nó thì mất −40px của Task 6 **và** hai dòng giữa của bảng.

- [ ] **Bước 10: Gửi đơn THẬT ở cả hai chiều — máy chủ trả 400 cho CẢ HAI chiều lệch**

`schema.ts:238-240` có ba luật chéo `ADR-0031` §5. Hai chiều đều làm hỏng đơn thật:

| Điều kiện | Kết quả |
|---|---|
| `prepay` có **mà** `paymentMethod !== 'transfer'` | **400** |
| `!prepay` **mà** `paymentMethod === 'transfer'` | **400** |
| `prepay.totalGoc < quoted.total` | **400** |

Trên bản dựng cục bộ, gửi **hai đơn thật**:

- **(i)** chọn *"chuyển khoản trước"* → đơn phải **qua**, và `quoted.prepay` **có mặt** trong
  payload (xem tab Network, request `POST /api/dat-tour`).
- **(ii)** chọn *"trả khi khởi hành"* → đơn phải **qua**, và `quoted.prepay` **vắng**.

Không bước nào trong Task 6 hay Task 8 chạm cặp này ngoài bước này, trong khi Task 6 đổi đúng bề
mặt sinh ra `paymentMethod`. Bỏ bước này là đổi một cụm nút rồi để đơn thật bị từ chối.

- [ ] **Bước 11: Kiểm hồi quy di động 390×844**

Chỉnh cửa sổ 390×844, mở bước 2 (điền ngày + số khách + hình thức, bấm "Đặt tour ngay"):

```js
const f = document.querySelector('form.bf');
JSON.stringify({
  tranNgang: f.scrollWidth > f.clientWidth,
  oBiChe: [...f.querySelectorAll('[data-step="2"] .bf__input')]
    .filter(e => e.getBoundingClientRect().width === 0).length,
  formW: Math.round(f.getBoundingClientRect().width),
  cardW: Math.round(document.querySelector('.sidebar-card').getBoundingClientRect().width),
})
```

Kỳ vọng: `tranNgang: false`, `oBiChe: 0`, `formW ≤ cardW`. DR-104 ghi rõ hướng chân dính đã bị bỏ
vì nuốt 4/5 ô nhập ở đúng khổ này — bước này canh để không tái diễn theo đường khác.

- [ ] **Bước 12: Cổng và commit**

```bash
npm run build && npm run gate
```

So từng dòng với lần chạy ở Task 3.

```bash
git add src/components/BookingForm.astro src/lib/uiCopy.ts
git commit -m "feat(dat-tour): bang chi tiet gia dung tu engine, go hai dong trung"
```

---

## Task 9 — Hero +50px

**Tiền đề:** Task 1 đã xong. Không có `QĐ-2026-08-31-03` thì **dừng** — sửa token trước phiếu là
làm sâu thêm một ngoại lệ chưa ai xét lại.

**Files:**
- Modify: `src/styles/tokens.css:182-189` (**gồm cả khối chú thích 186–188**)
- Modify: `docs/core-specs/07-DESIGN_TOKENS.md:139-142`
- Modify: `docs/core-specs/KIEN-TRUC-TEMPLATE.md` §4
- Modify: `docs/core-specs/06-BINDING_MAP.md:74` (các con số chiều cao)
- Modify: `docs/DECISIONS.md` (điền số đo SAU vào phiếu Task 1)

**Interfaces:**
- Consumes: `QĐ-2026-08-31-03` từ Task 1
- Produces: không có API; một dòng token đổi là **12 loại trang chi tiết** cộng trang điểm đến.

- [ ] **Bước 1: Sửa năm giá trị — cả năm, không riêng cái nào**

`src/styles/tokens.css`:

| Dòng | Token | Nay | Sau |
|---|---|---|---|
| 182 | `--hero-entity-h-min` | `330px` | `380px` |
| 183 | `--hero-entity-h-max` | `430px` | `480px` |
| 184 | `--hero-entity-h-tablet` | `390px` | `440px` |
| 185 | `--hero-entity-h-mobile` | `290px` | `340px` |
| 189 | số giữa | `calc(30vw + 50px)` | `calc(30vw + 100px)` |

Cơ sở: `clamp(a+50, x+50, b+50) = clamp(a,x,b) + 50` với mọi `x`. Hai con số trói ở hai dải khác
nhau (điểm giao vw = 1266,67): số giữa trói **1024–1266px**, trần trói **≥1267px**. Chỉ dời một
cái là một dải đứng yên.

**Tuyệt đối không chạm `--hero-min-h` / `--hero-min-h-mobile`** — hai token đó của `HomeHero`,
hero **trang chủ**.

- [ ] **Bước 2: Viết lại khối chú thích `tokens.css:186-188`**

Bỏ qua bước này là **tự mâu thuẫn trong một file**: dòng 189 sẽ đọc `calc(30vw + 100px)` còn ba
dòng ngay trên nó khẳng định số giữa *"phải là"* `calc(30vw + 50px)`.

```css
  /* Số giữa phải là `calc(30vw + 100px)`, KHÔNG phải `30vw`: nâng riêng trần
     480 lên cao hơn chỉ cho +4px ở 1280 và +30px ở 1366, vì ở dải ≥1267px thì
     TRẦN mới là số đang trói (điểm giao: 30vw + 100 = 480 ⇒ vw = 1266,67).
     Đã đo, xem QĐ-2026-08-31-03. */
```

- [ ] **Bước 3: `07-DESIGN_TOKENS.md` — bốn hàng, không phải một**

Dòng 139 `layout.hero.entity.max` 430px→480px; 140 `.min` 330px→380px; 141 `.tablet` 390px→440px;
142 `.mobile` 290px→340px. Dòng 140 còn chép công thức — đổi sang `calc(30vw + 100px)`.

**Giữ nguyên con số "+4px ở 1280 và +30px ở 1366"** — đã kiểm: vì số giữa **và** trần cùng dịch
50px nên hiệu giữa chúng không đổi (1280: 484 vs 480 ⇒ +4; 1366: 509,8 vs 480 ⇒ +29,8).

- [ ] **Bước 4: `KIEN-TRUC-TEMPLATE.md` §4 — sửa cụm thiếu tiền đề**

Cập nhật năm giá trị. Và cụm *"Nâng trần 380→430"*: nó **thiếu tiền đề**, không sai số học —
+4/+30 đúng chính xác cho 380→430 **khi số giữa là `30vw` trần** (công thức v2.5). Khôi phục tiền
đề bị rơi, viết theo giá trị hiện hành.

> ⚠ **KHÔNG "sửa" ba chỗ sau — chúng đang ĐÚNG** vì có kèm mệnh đề *"vì 30vw mới là số đang
> trói"*: `docs/DECISIONS.md:2118`, `docs/core-specs/06-BINDING_MAP.md:74`, và khối chú thích
> `tokens.css` cũ (Bước 2 đã thay bằng bản mới).

- [ ] **Bước 5: `06-BINDING_MAP.md:74` — các con số chiều cao**

`clamp(330px, calc(30vw + 50px), 430px)` → `clamp(380px, calc(30vw + 100px), 480px)`;
`390px` → `440px`; `290px` → `340px`. Phần ngoại lệ Luật 3 đã sửa ở Task 1, **không** sửa lại.

- [ ] **Bước 6: Cổng token**

```bash
npm --prefix scripts run check:token-parity
```

Kỳ vọng: **xanh**.

> ⚠ Cổng này canh **4 giá trị phẳng** (`check-token-parity.mjs:55-58`) nhưng **KHÔNG** canh
> `--hero-entity-h` — chú thích dòng 54 ghi rõ *"bộ chuẩn hoá cắt ở dấu ngoặc đầu tiên"*. Nghĩa
> là **số giữa `calc(30vw + 100px)` không có cổng nào canh**. Quên sửa nó ở `07` vẫn in xanh.
> Bước 7 mới là thứ bắt được.

- [ ] **Bước 7: Đo DOM ở SÁU khổ**

```bash
npm run build && npx astro preview
```

Với mỗi khổ **1710, 1366, 1280, 1024, 900, 390**, chỉnh cửa sổ rồi chạy:

```js
Math.round(document.querySelector('.hero-shell').getBoundingClientRect().height)
```

Kỳ vọng đúng: **480 / 480 / 480 / 407 / 440 / 340**.

**1366 và 1280 là bắt buộc** — cả lập luận Luật 3 lẫn ví dụ "+4px/+30px" đứng trên đúng hai khổ
đó.

- [ ] **Bước 8: Đo trên hai loại entity khác nhau cộng trang điểm đến**

Lặp Bước 7 (chỉ khổ 1710) trên một trang `tour`, một trang `diem-tham-quan`, và một trang điểm
đến (`/nha-trang/`). Cả ba phải ra **480**. Đây là bằng chứng token phủ hết, không phải trùng hợp
một trang.

- [ ] **Bước 9: Đo thanh dính ở 1366×768 — số "SAU" cho phiếu**

```js
const s = document.querySelector('.sticky-bar');
Math.round(s.getBoundingClientRect().top + scrollY)
```

Kỳ vọng ≈ **718**. **Điền số thật đo được** vào chỗ `<SỐ ĐO SAU>` ở `QĐ-2026-08-31-03` và ở
`06-BINDING_MAP:74`. Đây là con số trung tâm của cả đợt — không đo nó là nghiệm thu nửa dễ rồi
bỏ ngỏ đúng nửa đang tranh chấp.

- [ ] **Bước 10: Kiểm không chạm hero trang chủ**

```bash
git diff src/styles/tokens.css | grep -n 'hero-min-h' || echo "OK khong cham HomeHero"
```

- [ ] **Bước 11: Cổng, doc-reality-auditor, commit**

```bash
npm run build && npm run gate
```

So từng dòng với lần chạy ở Task 8.

Chạy agent `doc-reality-auditor` — `KIEN-TRUC-TEMPLATE.md` được canh bằng agent này chứ không
bằng validator, và §4 vừa bị sửa.

```bash
git add src/styles/tokens.css docs/core-specs/07-DESIGN_TOKENS.md \
        docs/core-specs/KIEN-TRUC-TEMPLATE.md docs/core-specs/06-BINDING_MAP.md docs/DECISIONS.md
git commit -m "feat(hero): nang chieu cao hero trang chi tiet them 50px o moi kho"
```

---

## Nghiệm thu toàn đợt

Chạy sau Task 9, trước khi báo với chủ dự án rằng đợt này xong.

- [ ] `npm run build && npm run gate` — so **từng dòng** với đường nền ghi ở Task 3. Dòng nào đổi
      trạng thái thì giải trình dòng đó.
- [ ] `npm test` — toàn bộ xanh, **không sửa test nào** để nó xanh.
- [ ] `git diff --stat src/lib/booking/` — **rỗng**. Đây là khẳng định trung tâm của spec form.
- [ ] `git diff --stat src/components/DetailLayout.astro src/components/PageHead.astro src/components/Sidebar.astro src/components/Card.astro` — **rỗng**. Không frame chung nào bị chạm.
- [ ] `grep -rn "0 trang" docs/core-specs/06-BINDING_MAP.md` — không còn dòng nào phát biểu điều
      kiện cũ như đang hiệu lực.
- [ ] Ba số đo cuối, ghi vào bản ghi phiên: chiều cao form (kỳ vọng ≤1000), cụm quyết định (≤859),
      thanh dính ở 1366 (≈718).
- [ ] **KHÔNG `git push`.** Phát hành là quyết định riêng của chủ dự án — push lên `main` kích
      hoạt Workers Builds dựng và đè bản deploy đang chạy.

---

# PHỤ LỤC A — Sửa đổi phạm vi giữa chừng (chủ dự án, 2026-08-31, sau Task 4)

> **Phụ lục này ĐÈ LÊN các bước tương ứng ở trên.** Chỗ nào mâu thuẫn thì theo phụ lục.
> Task 1–4 đã thi hành xong theo bản gốc và **không bị ảnh hưởng**.

## A.1 Task 5 — thêm việc: ẩn HẾT đơn giá từng hạng khách

Ngoài việc bỏ `.bf__head` (bản gốc §4.2), Task 5 nay **ẩn luôn `.bf__pax-price`** ở mọi hạng
khách. Sau Task 5, trong form **không còn con số đơn giá nào**; khách thấy giá qua **Tạm tính**
và bảng **Chi tiết giá** (Task 8).

Ước giảm thêm: 25px × 4 hàng = **−100px**.

### ⚠ Việc bắt buộc đi kèm: bổ sung phiếu `QĐ-2026-08-31-03`

Phiếu đó **đã commit**, và nó viện chính đơn giá làm lý do nới Luật 3 được:

> *"Cái gì đỡ cho quyết định này. Giá vẫn có mặt hai chỗ: thanh dính (dính lại sau khi cuộn tới)
> và `.bf__pax-price` — đơn giá từng hạng khách trong form đặt tour. Không trang nào mất giá."*

Câu đó **thành sai** khi Task 5 xong. Task 5 phải ghi một đoạn bổ sung vào phiếu (không sửa
đoạn cũ — ghi thêm, để còn thấy lý lẽ đã đổi ra sao):

- Ngày 2026-08-31, sau khi phiếu được chốt, chủ dự án yêu cầu **ẩn luôn đơn giá từng hạng khách**.
- Nên "cái gì đỡ" nay còn **hai** thứ, không phải hai thứ cũ: **thanh dính** (vẫn mang giá), và
  **Tạm tính + bảng Chi tiết giá** trong form (cập nhật theo số khách khách chọn).
- Nhận rõ hệ quả: ở viewport 1366, **màn đầu không còn con số giá nào** — thanh dính đã ở dưới
  mốc 657px theo chính phiếu này, và trong form giá chỉ xuất hiện sau khi khách chọn số người.
  Đây là đánh đổi được chấp nhận có chủ ý, không phải sơ suất.

### Tiêu chí nghiệm thu thay đổi

- **Bỏ** tiêu chí 9 cũ ("`.bf__pax-price` có mặt trên mọi tour có form") — nó nay **ngược** với
  yêu cầu. Thay bằng: `grep -c 'class="bf__pax-price"'` trên trang tour đã dựng phải ra **0**.
- **Bỏ** tiêu chí 9b về bảng giá dạng bậc: rủi ro đó (tour `tiers` không có `.bf__pax-price`)
  **tan biến** vì nay không hạng nào có đơn giá hiển thị. Ghi một dòng vào `docs/BACKLOG.md`
  **B-020** rằng khoản nợ này đã khép trước khi mở, kèm lý do.
- **Giữ** tiêu chí 10: chuỗi giá xuất hiện đúng một lần trên trang tour (chỉ còn ở thanh dính).

### Số hiệu BACKLOG đổi

`B-022` **đã bị một mạch làm việc khác lấy** (tự động đối soát chuyển khoản, commit `1360503`).
Khoản nợ `priceLabel` của Task 5 dùng **`B-023`**.

## A.2 Task 6 — ẩn dòng tiêu đề, giữ hai lựa chọn, đổi nhãn

**Ẩn dòng tiêu đề "Hình thức thanh toán"** (`#bf-pay-label`) khỏi phần nhìn thấy. **Hai lựa chọn
vẫn hiện và vẫn chọn được** — chủ dự án xác nhận 2026-08-31.

⚠ **Không được xoá tên cho trợ năng.** `role="radiogroup"` đang lấy tên từ `#bf-pay-label` qua
`aria-labelledby`. Hai cách hợp lệ, chọn một:
- giữ phần tử nhưng ẩn bằng lớp chỉ-đọc-màn-hình (không dùng `display:none`, vì thế là ẩn cả với
  trình đọc màn hình); hoặc
- xoá phần tử và thay bằng `aria-label={t('bookingPayLabel')}` trên chính nhóm radio.

**Đổi nhãn** trong `src/lib/uiCopy.ts`, khoá `bookingPayTransfer`:
- `vi`: `'Chuyển khoản trước — giảm {x}%'` → **`'Chuyển khoản - ưu đãi {x}%'`**
- `en`/`zh`/`ko`/`ru`: đổi tương ứng theo lệ file (các khoá `booking*` ở `zh`/`ko`/`ru` hiện dùng
  bản tiếng Anh — theo đúng lệ đó, đừng tự dịch sang tiếng Trung/Hàn/Nga).

Giữ nguyên `bookingPayOnboard`. Giữ nguyên giá trị dữ liệu `transfer` / `onboard`.

Ước giảm: tiêu đề **−24px**, cộng phần gộp một hàng của bản gốc.

## A.3 Task 7 — nền form dùng đúng công thức module Bao gồm/Chưa bao gồm

Chủ dự án yêu cầu nền form **giống module Bao gồm/Chưa bao gồm**. Đó là `.inc-ex-card`
(`src/components/TourDetail.astro:259-264`):

```css
background: var(--c-surface-alt);
border: 1px solid var(--c-border);
border-radius: var(--radius-md);
padding: var(--s5);
```

Khác bản gốc §4.4 ở **hai điểm**: có **viền**, và đệm **`--s5` (24px)** chứ không phải `--s4`.
Nên chi phí chiều cao là **+48px**, không phải +32px. Bốn khối màu phải sửa kèm (`.bf__quote`,
`.bf__qr` → `--c-card`; `.bf__btn:hover` → token hover thật; `.bf__count`) giữ nguyên như bản gốc.

## A.4 Sửa một tiêu chí sai trong bản gốc — `<details>` đóng

Bản gốc bảo đo `offsetHeight === 0` để chứng minh `<details>` đóng. **Sai trên Chrome hiện nay:**
Chrome ẩn nội dung `<details>` đóng bằng `::details-content` / `content-visibility`, không phải
`display: none`, nên `offsetHeight` vẫn khác 0 dù đóng thật. Phát hiện khi thi hành Task 4.

Thay bằng **`el.checkVisibility()` phải ra `false`**, cộng một phép thử sống: mở ra thì form cao
lên, đóng lại thì thấp xuống đúng bằng chừng ấy. Vẫn **không** dùng `details.open === false` làm
bằng chứng — lý do DR-102 giữ nguyên: thuộc tính đúng không chứng minh được render đúng.

## A.5 Ngân sách chiều cao — tính lại

| | px |
|---|---|
| Hiện trạng ban đầu | 1237 |
| Task 4 (ghi chú → ⓘ) — **đã đo thật** | −225 → **1012** |
| Task 5: bỏ `.bf__head` | −88 |
| Task 5: ẩn đơn giá 4 hàng (**mới**) | −100 |
| Task 6: ẩn dòng tiêu đề (**mới**) | −24 |
| Task 6: gộp một hàng | −40 |
| Task 7: đệm `--s5` hai đầu (**đổi**) | +48 |
| Task 8: dòng tóm tắt `<details>` | +24 |
| Task 8: xoá `.bf__season` + `.bf__prepay` | −50 |
| **Dự kiến** | **≈ 782** |

**Đây là thay đổi có ý nghĩa: 782px LỌT vùng nhìn 859px.** Bản gốc dự kiến 940px và spec đã nói
thẳng là không hứa lọt. Với bốn mục mới của chủ dự án thì mục tiêu đó **thành khả thi** — nên
tiêu chí 1 nâng từ "≤1000px" lên **"≤850px"**, và tiêu chí 2 (cụm quyết định lọt 859px) gần như
đương nhiên đạt. Vẫn phải **đo**, không suy.
