# Kế hoạch thi hành — Chữa thị giác di động

> **Cho tác nhân thực thi:** SKILL BẮT BUỘC — dùng `superpowers:subagent-driven-development` (khuyến nghị) hoặc `superpowers:executing-plans` để chạy từng Task. Các bước dùng cú pháp checkbox `- [ ]` để theo dõi.

**Mục tiêu:** Rút trang chủ ở khổ 390px từ 19.977px xuống ≤16.000px, phá dải xanh liền ~2.000px, thống nhất nhịp dọc về một giá trị, đưa mọi đích chạm lên 44px, và gộp hai khối tour trùng tiêu đề làm một — không thêm token, không đụng GROQ, không đụng dữ liệu Sanity.

**Kiến trúc:** Bảy thay đổi R1–R7, gần như toàn bộ nằm trong `<style>` của component. Hai ngoại lệ có chủ ý: R6 tách phép chọn tour thành một hàm thuần trong `src/lib/homepage.ts` (kèm test đơn vị), và R2c sửa phần *lý do* của một điều khoản trong `07-DESIGN_TOKENS`. Không có cổng máy nào canh được bề mặt này, nên bằng chứng là bảy phép đo tay K1–K7 chạy bằng **cùng một đoạn script** trước và sau.

**Tech Stack:** Astro 4 (component `.astro` với `<style>` scoped), CSS thuần dùng token từ `src/styles/tokens.css`, `node:test` chạy qua `tsx` cho test đơn vị.

**Spec:** `docs/specs/SPEC-2026-08-29-thi-giac-di-dong.md` (v4, đã duyệt, commit `fe19f9c`)

**Nhánh:** `feat/thi-giac-di-dong`, dựng từ `origin/main` tại `38866f2`

---

## Ràng buộc toàn cục

Áp cho **mọi** Task. Vi phạm một dòng ở đây là hỏng cả đợt, kể cả khi Task đó tự nó chạy đúng.

1. **KHÔNG sửa `src/styles/tokens.css`.** Không thêm token, không đổi giá trị token. (Spec §0 điểm 2)
2. **Chỉ dùng giá trị có sẵn trong thang.** Khoảng cách: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96` (`--s1`…`--s9`). Bo góc: `8 · 12 · 18 · 999`. Cỡ chữ: chỉ các token `--fs-*` đã khai. Một số nằm ngoài thang là nguồn sự thật thứ hai.
3. **Mốc breakpoint của đợt này là `≤640px`, không mốc nào khác.** Không thêm 600/767/900. (Spec R3)
4. **KHÔNG đụng dữ liệu Sanity, KHÔNG đụng `siteSettings` trong Studio, KHÔNG sửa truy vấn GROQ.** (Spec §0 điểm 1 và 3)
5. **KHÔNG thêm dependency.** Không cài headless browser. Đo bằng Chrome sẵn có, theo cách ở Task 1.
6. **Mọi phép đo phải ghi kèm `git rev-parse HEAD` và mtime `dist/index.html`.** Không có hai số đó thì phép đo vô danh — không ai biết nó đo bản nào. Lý do: `GA2` là cổng tươi-cũ duy nhất và nó chỉ so mtime hai file với nhau, nên `gate:all` **xanh được trên `dist/` của nhánh khác**. (Spec §5.2)
7. **Đừng tin số dòng trong tài liệu.** Mỗi Task nêu số dòng để định vị nhanh, nhưng bước đầu tiên luôn là `grep` xác nhận. Spec này đã bị chặn hai lần vì trích sai dòng — một lần suýt bảo xoá nhầm dải số liệu.
8. **Commit sau mỗi Task.** Không gộp hai Task vào một commit.

---

## Bản đồ file

| File | Task | Trách nhiệm sau đợt này |
|---|---|---|
| `docs/evidence/2026-08-29-thi-giac-di-dong/do.js` | 1 | **Tạo.** Đoạn đo K1–K7, dùng y hệt cho cả trước lẫn sau |
| `docs/evidence/2026-08-29-thi-giac-di-dong/truoc.md` | 1 | **Tạo.** Số nền, kèm HEAD + mtime |
| `src/lib/homepage.ts` | 2 | **Sửa.** Thêm hàm thuần `chonTourTrangChu()` |
| `src/lib/__tests__/homepage.test.ts` | 2 | **Tạo.** 4 ca test cho hàm trên |
| `scripts/package.json` | 2 | **Sửa.** Thêm `src/lib/__tests__` vào glob của `test` |
| `src/pages/index.astro` | 2 | **Sửa.** Gọi hàm mới thay cho `.slice(0, 3)` trần |
| `src/components/SiteHome.astro` | 3, 6, 7, 8 | **Sửa.** Gỡ khoá `tours`; nhịp dọc; đích chạm `summary`; hero |
| `src/components/HomeTourGrid.astro` | 3, 4, 5, 6 | **Sửa.** Nhãn về một nguồn; lưới co; đảo vai dải màu; nhịp dọc |
| `src/components/Card.astro` | 4 | **Sửa.** Thẻ ngang ở `≤640px` |
| `src/components/HomeRollupSection.astro` | 4, 6, 7 | **Sửa.** Gỡ hàng rào đè; nhịp dọc; đích chạm |
| `src/components/EntityIndex.astro` | 4 | **Sửa.** Gỡ hàng rào đè |
| `docs/core-specs/07-DESIGN_TOKENS.md` | 5 | **Sửa.** Chỉ phần *lý do* của điều khoản cấm cát làm nền CTA |
| 9 component `Home*` + `Section.astro` + `HomeHubGrid` + `HomeBannerGrid` | 6 | **Sửa.** Một nhịp `--s6` ở `≤640px` |
| `Footer.astro` · `Header.astro` · `FAQ.astro` · `HomeAreaGrid` · `HomeGuideGrid` · `HomeDestinationGrid` | 7 | **Sửa.** Đích chạm 44px |
| `docs/DRIFT_LOG.md` | 3, 5, 9 | **Sửa.** 15 phiếu drift |
| `docs/evidence/2026-08-29-thi-giac-di-dong/sau.md` | 9 | **Tạo.** Số sau, cùng chủ thể đo |

---

## Thứ tự Task và vì sao

Task 1 **phải** đứng đầu: cột "Trước" chỉ có nghĩa khi đo trên `dist/` tại HEAD **trước** mọi thay đổi. Task 2 đứng thứ hai vì nó là Task duy nhất có test máy — dựng bộ test sớm thì các Task sau có chỗ dựa. Task 4 (thẻ) đứng trước Task 6 (nhịp) vì thẻ quyết định phần lớn chiều cao trang, đo nhịp trên trang chưa rút thẻ là đo trên nền sắp đổi.

---

# Task 1: Đo nền và dựng đoạn đo dùng chung

**Files:**
- Create: `docs/evidence/2026-08-29-thi-giac-di-dong/do.js`
- Create: `docs/evidence/2026-08-29-thi-giac-di-dong/truoc.md`

**Interfaces:**
- Consumes: không có
- Produces: đoạn đo `do.js` — Task 9 chạy **y hệt** đoạn này. Không được sửa nó giữa hai lần đo; sửa là hai cột không so được.

**Vì sao Task này tồn tại.** Spec §2 đo trên production, §5 đòi đo trên `dist/`. Hai chủ thể khác nhau thì hiệu số không quy được về R1–R7. Task này đặt lại cột "Trước" cho đúng chủ thể.

- [ ] **Bước 1: Dựng và ghi danh tính bản dựng**

```bash
cd /Users/tuanbao/Documents/Projects/ctytnhhtourdao/tourdaovn
npm run build
git rev-parse HEAD
stat -f '%Sm' -t '%Y-%m-%d %H:%M:%S' dist/index.html
```

Ghi lại hai giá trị cuối — chúng vào đầu file `truoc.md`.

- [ ] **Bước 2: Tạo đoạn đo**

Tạo `docs/evidence/2026-08-29-thi-giac-di-dong/do.js` với đúng nội dung sau. Nó chạy trong console Chrome trên trang đang mở, tự nhúng iframe 390px nên không phụ thuộc kích thước cửa sổ (cách này đã kiểm: resize cửa sổ **không** đổi được viewport trên máy này).

```js
// Đo K1–K7 cho SPEC-2026-08-29-thi-giac-di-dong.
// Dán vào console Chrome. Dùng Y HỆT đoạn này cho cả lần đo trước và sau.
// Tham số: url tương đối cần đo, ví dụ '/' hoặc '/tour/vinh-san-ho/'
window.__do = async function (url) {
  document.getElementById('__probe')?.remove()
  const f = document.createElement('iframe')
  f.id = '__probe'
  f.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px;z-index:2147483647;border:0'
  f.src = url
  document.body.appendChild(f)
  await new Promise(r => { f.onload = r; setTimeout(r, 10000) })
  await new Promise(r => setTimeout(r, 1500))

  const d = f.contentDocument, w = f.contentWindow, de = d.documentElement
  const vh = w.innerHeight, vw = w.innerWidth

  // K4: ba ngoại lệ có tên — đệm 0, R3 không chạm tới chúng
  const LOAI_KHOI_K4 = el =>
    el.tagName === 'SCRIPT' ||
    el.classList.contains('site-home-hero') ||
    (el.tagName === 'DIV' && !el.className)

  const main = d.querySelector('main') || d.body
  const conMain = [...main.children]
  const pad = new Set()
  conMain.filter(el => !LOAI_KHOI_K4(el)).forEach(el => {
    const s = w.getComputedStyle(el)
    pad.add(s.paddingTop); pad.add(s.paddingBottom)
  })

  // K3: CHỈ đếm phần tử đang hiển thị. Nav ẩn ở ≤1023px cao 0, mà 0 < 44.
  const nho = []
  d.querySelectorAll('a,button,summary').forEach(el => {
    if (el.offsetParent === null) return
    const r = el.getBoundingClientRect()
    if (r.height === 0) return
    if (r.height < 44) nho.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().slice(0, 30) + ' h=' + Math.round(r.height))
  })

  const theCao = [...d.querySelectorAll('.card')].map(c => Math.round(c.getBoundingClientRect().height))
  const h2 = [...d.querySelectorAll('h2')].map(h => h.textContent.trim())
  const trung = h2.filter((t, i) => t && h2.indexOf(t) !== i)
  const hero = d.querySelector('.site-home-hero')

  return {
    url, vw, vh,
    K1_caoTrang: de.scrollHeight,
    K2_theCaoNhat: theCao.length ? Math.max(...theCao) : null,
    K2_soThe: theCao.length,
    K3_soDichChamNho: nho.length,
    K3_chiTiet: nho,
    K4_giaTriDem: [...pad].sort(),
    K4_soConMainDaLoc: conMain.filter(el => !LOAI_KHOI_K4(el)).length,
    K5_tranNgang: de.scrollWidth - vw,
    K6_h2Trung: [...new Set(trung)],
    K7_heroPhanTram: hero ? +(hero.getBoundingClientRect().height / vh * 100).toFixed(1) : null,
  }
}
```

- [ ] **Bước 3: Chạy đoạn đo trên bốn trang**

```bash
npm run preview    # phục vụ dist/ ở http://localhost:4321
```

Mở `http://localhost:4321/` trong Chrome, dán `do.js` vào console, rồi chạy:

```js
await __do('/')
await __do('/diem-tham-quan/di-tich-lich-su/')
await __do('/diem-tham-quan/khu-du-lich-hon-mun/')
await __do('/tour/vinh-san-ho/')
```

Ba trang sau là **ba trang duy nhất có lưới 1 thẻ** — K2 phải đo ở đó, đo trang chủ sẽ cho pass giả (spec §5.2).

- [ ] **Bước 4: Ghi `truoc.md`**

Tạo `docs/evidence/2026-08-29-thi-giac-di-dong/truoc.md` theo khuôn:

```markdown
# Số nền — trước R1–R7

- **HEAD lúc dựng:** `<dán git rev-parse HEAD>`
- **mtime `dist/index.html`:** `<dán stat>`
- **Ngày đo:** 2026-08-29
- **Cách đo:** `do.js` cùng thư mục, chạy trong Chrome, iframe 390×844

| Trang | K1 cao | K2 thẻ cao nhất | K3 đích chạm <44 | K4 giá trị đệm | K5 tràn | K6 h2 trùng | K7 hero % |
|---|---|---|---|---|---|---|---|
| `/` | | | | | | | |
| `/diem-tham-quan/di-tich-lich-su/` | | | | | | | |
| `/diem-tham-quan/khu-du-lich-hon-mun/` | | | | | | | |
| `/tour/vinh-san-ho/` | | | | | | | |

**Ghi chú bắt buộc:** ba trang có lưới 1 thẻ đều là `.card-grid` (EntityIndex).
`home-card-grid` (HomeRollupSection) KHÔNG có lưới 1 mục nào, nên nửa R1b dành cho
file đó không có trang nào quan sát được — xem spec §5.2.
```

Điền số thật vào bảng.

- [ ] **Bước 5: Commit**

```bash
git add docs/evidence/2026-08-29-thi-giac-di-dong/
git commit -m "docs(evidence): số nền trước đợt chữa thị giác di động, kèm HEAD và mtime"
```

---

# Task 2: R6a — hàm chọn tour + test đơn vị

**Files:**
- Modify: `src/lib/homepage.ts` (thêm hàm ở cuối, sau `hubCountLabel` ~dòng 300)
- Create: `src/lib/__tests__/homepage.test.ts`
- Modify: `scripts/package.json` (script `test`)
- Modify: `src/pages/index.astro:41`

**Interfaces:**
- Consumes: không có
- Produces: `chonTourTrangChu(allTours, featuredTours)` → `any[]`. Task 3 dựa vào việc hàm này đã nuôi `HomeTourGrid`.

**Vì sao có test.** Nhánh dự phòng (`featuredTours` rỗng) **không bao giờ chạy khi dựng** vì dữ liệu thật không rỗng. Nhìn bản dựng rồi tích ô là pass giả — đó là lý do K8 bị gỡ khỏi bảng K.

- [ ] **Bước 1: Mở glob test cho `src/lib/`**

Sửa `scripts/package.json`, script `test`, thêm đường dẫn thứ tư:

```
tsx --test synthesis/__tests__/*.test.ts audit/__tests__/*.test.ts validators/__tests__/*.test.ts ../src/lib/__tests__/*.test.ts
```

(Đã kiểm: `tsx` chạy được test đặt ở `src/lib/__tests__/` và import được `../homepage.ts`.)

- [ ] **Bước 2: Viết test TRƯỚC khi viết hàm**

Tạo `src/lib/__tests__/homepage.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chonTourTrangChu } from '../homepage.ts'

const a = { _id: 'a', slug: 'tour-a', title: 'A', duration: '8 giờ' }
const b = { _id: 'b', slug: 'tour-b', title: 'B', duration: '6 giờ' }
const c = { _id: 'c', slug: 'tour-c', title: 'C', duration: '7 giờ' }
const d = { _id: 'd', slug: 'tour-d', title: 'D', duration: '9 giờ' }
const kho = [a, b, c, d]

test('featuredTours rỗng thì rơi về ba tour đầu của kho', () => {
  assert.deepEqual(chonTourTrangChu(kho, []), [a, b, c])
})

test('featuredTours vắng hoặc null thì không ném lỗi, vẫn rơi về kho', () => {
  assert.deepEqual(chonTourTrangChu(kho, undefined), [a, b, c])
  assert.deepEqual(chonTourTrangChu(kho, null), [a, b, c])
})

test('phần tử null trong featuredTours bị bỏ, không ném lỗi', () => {
  assert.deepEqual(chonTourTrangChu(kho, [null, { _id: 'c' }]), [c])
})

test('giữ đúng thứ tự biên tập xếp, không theo bảng chữ cái', () => {
  assert.deepEqual(chonTourTrangChu(kho, [{ _id: 'c' }, { _id: 'a' }]), [c, a])
})

test('tour biên tập chọn nhưng không có trong kho đã duyệt thì bị loại', () => {
  assert.deepEqual(chonTourTrangChu(kho, [{ _id: 'khong-co' }, { _id: 'b' }]), [b])
})

test('kho rỗng thì trả mảng rỗng, không ném lỗi', () => {
  assert.deepEqual(chonTourTrangChu([], [{ _id: 'a' }]), [])
})
```

- [ ] **Bước 3: Chạy test, xác nhận nó ĐỎ**

```bash
npm --prefix scripts test 2>&1 | tail -8
```

Kỳ vọng: FAIL với thông báo kiểu `chonTourTrangChu is not a function` hoặc lỗi import. **Nếu nó xanh ngay thì có gì sai — dừng lại và tìm hiểu.**

- [ ] **Bước 4: Viết hàm tối thiểu cho test xanh**

Thêm vào cuối `src/lib/homepage.ts`:

```ts
/**
 * Chọn tour cho khối "Tour nổi bật" trang chủ (SPEC-2026-08-29 R6a).
 *
 * Biên tập chọn trong Studio qua `touristDestination.featuredTours`; dữ liệu thì
 * lấy từ `allTours` — nơi DUY NHẤT có `duration` và đã lọc `reviewStatus`.
 * Lấy giao hai danh sách theo `_id` nên được cả hai: quyền chọn của biên tập, và
 * đủ field cho thẻ. KHÔNG sửa GROQ.
 *
 * Ba toán tử phòng thủ dưới đây là bắt buộc, không phải cho đẹp:
 *  - `?? []`      — `index.astro` CỐ Ý cho `td = null` đi tiếp, chỉ console.warn
 *  - `f?._id`     — GROQ `[]->` trả null cho reference chết
 *  - `.filter()`  — tour biên tập chọn có thể chưa duyệt, nên không có trong kho
 *
 * Rơi về ba tour đầu kho khi biên tập chưa chọn gì. Nhánh đó KHÔNG chạy khi dựng
 * (dữ liệu thật không rỗng) nên nó được canh bằng test đơn vị, không bằng phép đo.
 */
export function chonTourTrangChu(allTours: any[], featuredTours?: any[] | null): any[] {
  const kho = (allTours ?? []).filter(t => t?.slug && t?.title)
  const chon = (featuredTours ?? [])
    .map(f => kho.find(t => t._id === f?._id))
    .filter(Boolean) as any[]
  return chon.length ? chon.slice(0, 3) : kho.slice(0, 3)
}
```

- [ ] **Bước 5: Chạy test, xác nhận XANH**

```bash
npm --prefix scripts test 2>&1 | tail -8
```

Kỳ vọng: `# fail 0`, và tổng số test tăng thêm 6 so với 205 của nền (tức 211).

- [ ] **Bước 6: Nối hàm vào `index.astro`**

Sửa `src/pages/index.astro`. Xác nhận dòng trước đã:

```bash
grep -n "const homeTours\|const homeTourTotal\|import {.*homepage" src/pages/index.astro
```

Đổi dòng `const homeTours = ...` thành:

```ts
const homeTours = chonTourTrangChu(allTours, td?.featuredTours)
```

Thêm `chonTourTrangChu` vào import từ `../lib/homepage`. **Giữ nguyên** dòng `homeTourTotal` — nhãn "Xem tất cả N tour" phải là tổng thật của kho, không phải số tour biên tập chọn.

- [ ] **Bước 7: Dựng, xác nhận không gãy**

```bash
npm run build 2>&1 | tail -5
grep -c 'class="tour-card"' dist/index.html
```

Kỳ vọng: build xanh, và số thẻ tour vẫn là 3 (dữ liệu thật có `featuredTours`, nên đây là nhánh chính chứ không phải nhánh dự phòng).

- [ ] **Bước 8: Commit**

```bash
git add src/lib/homepage.ts src/lib/__tests__/homepage.test.ts scripts/package.json src/pages/index.astro
git commit -m "feat(trang-chu): biên tập chọn tour nổi bật, dữ liệu vẫn lấy từ kho đã duyệt

Lấy giao featuredTours với allTours theo _id: giữ quyền chọn cho biên tập mà
không mất duration, và không phải sửa GROQ. Tour chưa duyệt tự rụng vì kho đã
lọc reviewStatus — bịt một lỗ tiềm ẩn, xem DR-j.

Nhánh dự phòng không chạy khi dựng nên canh bằng 6 ca test đơn vị."
```

---

# Task 3: R6b + R6d + R7 — một khối tour, một nhãn, lưới co theo số thẻ

**Files:**
- Modify: `src/components/SiteHome.astro` (gỡ khoá `tours` khỏi `DEFAULT_SECTIONS`)
- Modify: `src/components/HomeTourGrid.astro` (nhãn về một nguồn; thêm luật `:has()`)
- Modify: `docs/DRIFT_LOG.md` (DR-a, DR-e, DR-n)

**Interfaces:**
- Consumes: `chonTourTrangChu` từ Task 2 — khối `HomeTourGrid` nay đã ăn tour biên tập chọn, nên gỡ khối rollup không còn làm mất nội dung.
- Produces: trang chủ còn đúng một khối tour.

- [ ] **Bước 1: Xác nhận số dòng trước khi sửa**

```bash
grep -n "key: 'tours'" src/components/SiteHome.astro
grep -n "key: 'stats'" src/components/SiteHome.astro
```

⚠ Kỳ vọng: `tours` ở **142**, `stats` ở **141**. **Bản đầu của spec ghi nhầm `:141` cho `tours`** — xoá nhầm dòng đó là xoá dải số liệu, thứ `06` §5.7 gọi là "trụ của trang". Nếu số không khớp, tìm theo chuỗi chứ đừng tin số.

- [ ] **Bước 2: Gỡ khoá `tours` khỏi `DEFAULT_SECTIONS`**

Xoá đúng dòng `  { key: 'tours', hidden: false },`.

- [ ] **Bước 3: Nhãn khối tour về một nguồn**

Trong `src/components/HomeTourGrid.astro`, `COPY.heading` (dòng ~27) đang khai chuỗi `'Tour nổi bật'` riêng, trùng `HOME_COPY.sections.tours` ở `src/lib/homepage.ts:69`. Đổi để đọc kho chữ:

- Thêm `import { HOME_COPY } from '../lib/homepage'`
- Frontmatter dòng ~23 hiện **không** destructure `lang` — thêm vào: `const { tours, lang, indexHref, total } = Astro.props`
- Thay `COPY.heading` ở chỗ render bằng `HOME_COPY[lang].sections.tours`

Ba chuỗi còn lại (`eyebrow`, `sub`, `all`) **để nguyên** — chúng chưa có trong kho chữ, đưa vào là mở rộng phạm vi. Ghi vào §7 spec, liên đới DR-069.

- [ ] **Bước 4: Thêm luật lưới co theo số thẻ (R7)**

Xác nhận trước:

```bash
grep -n "grid-template-columns: repeat(3, 1fr)" src/components/HomeTourGrid.astro
grep -c ":has(" src/components/HomeTourGrid.astro    # kỳ vọng 0
```

Thêm ngay sau khối `.tours-grid`:

```css
  /* Biên tập chọn 1–2 tour là hợp lệ sau R6a. Không có hai luật này thì một thẻ
     nằm trong cột 1/3 bề ngang, hai phần ba trống — đúng thứ EntityIndex.astro:258
     gọi là "một thẻ dọc nằm lẻ loi bên trái, trông như trang lỗi".
     Khuôn chép từ HomeRollupSection.astro:76/:92/:96. Ở đây KHÔNG dùng :global()
     nên không dính lớp bẫy đặc hiệu của DR-062 mà R1b phải xử. */
  .tours-grid:has(> :last-child:nth-child(1)) {
    grid-template-columns: 1fr;
  }

  .tours-grid:has(> :last-child:nth-child(2)) {
    grid-template-columns: repeat(2, 1fr);
  }
```

- [ ] **Bước 5: Dựng và kiểm K6 về 0**

```bash
npm run build 2>&1 | tail -3
node -e "
const h=require('fs').readFileSync('dist/index.html','utf8');
const t=[...h.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map(m=>m[1].trim());
const dup=[...new Set(t.filter((x,i)=>t.indexOf(x)!==i))];
console.log('h2 trùng:', dup.length ? dup : '(không còn)');
console.log('số khối tour:', (h.match(/class=\"home-tours\"/g)||[]).length);
"
```

Kỳ vọng: `h2 trùng: (không còn)`, `số khối tour: 1`.

- [ ] **Bước 6: Ghi ba phiếu drift**

Thêm vào `docs/DRIFT_LOG.md`, theo khuôn các phiếu sẵn có trong file (tiêu đề, **Lệch gì**, **Hệ quả đo được**, **Vì sao lọt**, **Đã xử**):

- **DR-a** — `06` §5.7 vẫn khai `tours` trong thứ tự khối mặc định, viết trước khi `SPEC-2026-08-14` §3.4 thêm `HomeTourGrid`. Sau Task này mã và đặc tả lệch. **Không sửa `06` ở đây** — cần chủ dự án chốt ở tầng đặc tả.
- **DR-e** — `HomeTourGrid` render ngoài `activeSections` (`SiteHome.astro:196`) nên đứng ngoài hợp đồng `06` §5.7 hàng đầu; sau Task này nó là khối tour **duy nhất**, tức biên tập mất quyền tắt và đảo thứ tự khối đó.
- **DR-n** — `ADR-0026` §Quyết định 4 neo ngưỡng đảo bài vào số tour **đã publish**; R6 tách rời publish khỏi **hiển thị**. Không sửa ADR ở đây: `CLAUDE.md` §1 xếp ADR ở tầng 3, spec task ở tầng 6.

- [ ] **Bước 7: Commit**

```bash
git add src/components/SiteHome.astro src/components/HomeTourGrid.astro docs/DRIFT_LOG.md
git commit -m "fix(trang-chu): một khối tour thay vì hai khối cùng tiêu đề

Gỡ khoá 'tours' khỏi DEFAULT_SECTIONS — khối rollup nay thừa vì HomeTourGrid
đã ăn featuredTours. Nhãn về một nguồn (HOME_COPY). Thêm luật lưới co theo số
thẻ để biên tập chọn 1-2 tour không ra thẻ lẻ loi.

Ghi DR-a, DR-e, DR-n."
```

---

# Task 4: R1 — thẻ ngang ở `≤640px`, kèm gỡ hàng rào đè

**Files:**
- Modify: `src/components/Card.astro` (chỉ `<style>`)
- Modify: `src/components/HomeRollupSection.astro` (khối `@media (max-width: 640px)`)
- Modify: `src/components/EntityIndex.astro` (khối `@media (max-width: 640px)`)

**Interfaces:**
- Consumes: không có
- Produces: `.card` ở `≤640px` là lưới `88px 1fr`. Task 6 và 9 đo trên hình dạng này.

⚠ **Task này có hai bẫy đã làm bản trước của spec bị chặn. Đọc hết trước khi gõ.**

- [ ] **Bước 1: Xác nhận hàng rào đè còn nguyên**

```bash
grep -n ":global(\.card" src/components/HomeRollupSection.astro src/components/EntityIndex.astro
grep -n "align-items: stretch" src/components/HomeRollupSection.astro src/components/EntityIndex.astro
grep -n "max-width: 767px\|max-width: 640px" src/components/HomeRollupSection.astro src/components/EntityIndex.astro
```

Kỳ vọng: 8 dòng `:global(.card`, hai dòng `align-items: stretch` ở **luật gốc ngoài media query**, và ở mỗi file khối `≤767` đứng **trước** khối `≤640`.

- [ ] **Bước 2: Thẻ ngang trong `Card.astro`**

Thêm vào cuối `<style>`:

```css
  /* SPEC-2026-08-29 R1 — thẻ ngang ở khổ điện thoại.
     Ảnh 4:3 trên thẻ full-width cho ô ảnh cao 267px, biến mỗi thẻ thành một tấm
     poster; 16 thẻ ăn 6.560px, một phần ba trang chủ. Tỷ lệ 4:3 là tỷ lệ của lưới
     NHIỀU cột — khi lưới sập còn một cột nó thành hệ quả phụ, không phải lựa chọn.
     Vẫn hợp Luật 5 (06 §6): mỗi thẻ một hàng, chiếm trọn bề ngang. */
  @media (max-width: 640px) {
    .card {
      display: grid;
      grid-template-columns: 88px 1fr;
      align-items: start;
    }

    .card-img-wrap {
      width: 88px;
      height: 88px;
      aspect-ratio: 1 / 1;
      border-radius: var(--radius-sm);
      margin: var(--s3) 0 var(--s3) var(--s3);
    }

    .card-body {
      padding: var(--s3);
    }

    .card-summary {
      margin-bottom: var(--s2);
    }
  }
```

- [ ] **Bước 3: Gỡ hàng rào đè trong `HomeRollupSection.astro`**

Trong khối `@media (max-width: 640px)` **đã có sẵn** (khối đứng sau khối `≤767`), thêm:

```css
    /* R1 chỉ thắng ở đây nếu nhắc lại NGUYÊN bộ chọn :has(). Để `.card` trần là
       thua đặc hiệu — (0,2,0) so với (0,5,0) — đúng lỗi DR-062.
       height PHẢI là 88px tường minh, KHÔNG dùng `auto`: align-items:stretch nằm ở
       luật gốc ngoài mọi media query (:83) nên vẫn sống ở đây, và một grid item
       đang stretch mà height:auto thì giãn hết chiều cao hàng, aspect-ratio bị bỏ
       qua — ra đúng cột ảnh 88px cao hết thẻ, y hệt lỗi height:100%. */
    .home-card-grid:has(> :last-child:nth-child(1)) :global(.card) {
      grid-template-columns: 88px 1fr;
      align-items: start;
    }

    .home-card-grid:has(> :last-child:nth-child(1)) :global(.card-img-wrap) {
      height: 88px;
      min-height: 0;
    }
```

⚠ **Khối `≤640` phải đứng SAU khối `≤767` trong file.** Nhắc lại bộ chọn cho ra **hoà** (0,5,0), không phải thắng — nó chạy được nhờ thứ tự nguồn. Ai sắp xếp lại media query trong file này là hỏng lại, im lặng, không cổng nào bắt.

- [ ] **Bước 4: Làm y hệt cho `EntityIndex.astro`**

Cùng nội dung, đổi `.home-card-grid` thành `.card-grid`, đặt trong khối `@media (max-width: 640px)` sẵn có của file đó. Cùng ràng buộc thứ tự.

- [ ] **Bước 5: Dựng và đo K2 trên ba trang có lưới 1 thẻ**

```bash
npm run build && npm run preview
```

Trong Chrome, dán `do.js` rồi chạy:

```js
await __do('/diem-tham-quan/di-tich-lich-su/')
await __do('/diem-tham-quan/khu-du-lich-hon-mun/')
await __do('/tour/vinh-san-ho/')
await __do('/')
```

Kỳ vọng `K2_theCaoNhat ≤ 200` trên cả bốn. **Nếu một trang cho ~400px thì hàng rào đè chưa gỡ đúng** — quay lại Bước 3/4, kiểm thứ tự khối media query.

⚠ Ba trang trên đều là `.card-grid`. **`home-card-grid` không có lưới 1 mục nào** nên nửa Bước 3 **không có trang nào quan sát được**. Ghi thẳng điều này vào `sau.md` ở Task 9 thay vì tính là đã kiểm.

- [ ] **Bước 6: Commit**

```bash
git add src/components/Card.astro src/components/HomeRollupSection.astro src/components/EntityIndex.astro
git commit -m "feat(the): thẻ ngang thumbnail 88px ở khổ điện thoại

Ảnh 4:3 trên thẻ full-width cho ô ảnh 267px; 16 thẻ ăn một phần ba trang chủ.
Kèm gỡ hàng rào :has()+:global() đè .card từ ngoài — không có bước đó thì luật
mới thua đặc hiệu và thẻ vỡ hình đúng cơ chế DR-062."
```

---

# Task 5: R2 + R2c — đảo vai dải màu đậm, sửa lý do trong `07`

**Files:**
- Modify: `src/components/HomeTourGrid.astro` (`<style>` + hai chú thích)
- Modify: `docs/core-specs/07-DESIGN_TOKENS.md` (chỉ phần *lý do*)
- Modify: `docs/DRIFT_LOG.md` (DR-b1, DR-b2, DR-b3, DR-k)

**Interfaces:**
- Consumes: không có
- Produces: `.home-tours` nền sáng. Task 9 đo dải xanh liền trên trạng thái này.

- [ ] **Bước 1: Đổi năm khai báo màu**

Trong `src/components/HomeTourGrid.astro`:

| Bộ chọn | Từ | Sang |
|---|---|---|
| `.home-tours` | `background: var(--c-band-bg)` | `background: var(--c-surface-alt)` |
| `.tours-eyebrow` | `color: var(--c-sand)` | `color: var(--c-primary)` |
| `.tours-heading` | `color: var(--c-band-text)` | `color: var(--c-primary)` |
| `.tours-sub` | `color: var(--c-band-muted)` | `color: var(--c-text-muted)` |
| `.tours-all` | `background: var(--c-sand)` / `color: var(--c-sand-text-strong)` | `background: var(--c-accent)` / `color: var(--c-text-inverse)` |

- [ ] **Bước 2: Sửa hai chú thích nay đã sai**

Chú thích ở dòng ~9 nói khối này lấy nền đậm để *"cắt mạch trắng liền"*. Ở vị trí thật **không có mạch trắng nào để cắt** — nó kẹp giữa hero (đáy gradient là `--c-primary-strong` đặc) và `stats-band` (cũng `--c-primary`), tổng ~2.000px xanh liền. Viết lại cho đúng: vai dải đậm chuyển hẳn về `stats-band`.

Chú thích ở dòng ~154 giải thích nút dùng `--c-sand` vì *"trên nền xanh đậm thì đỏ gạch chìm"*. Nền hết đậm nên lý do hết hiệu lực. Viết lại.

- [ ] **Bước 3: Sửa phần LÝ DO trong `07-DESIGN_TOKENS`**

```bash
grep -n "Không dùng làm nền CTA" docs/core-specs/07-DESIGN_TOKENS.md
```

Điều khoản **giữ nguyên** (chủ dự án đã chốt `07` thắng). Chỉ sửa phần lý do: hiện nó viện *"tương phản với chữ trắng không đạt AA"*, mà nút thật dùng chữ **tối** `--c-sand-text-strong` và đo **6,76:1 — đạt AA**. Lý do đúng là **phân vai màu**: `07` §1 đã giao `--c-accent` cho CTA và nhãn giá, cát cho gạch chân và nút trên nền đậm; cho cát thêm vai CTA là một màu hai vai.

⚠ Đây là sửa **tài liệu tầng 2**, vượt thẩm quyền spec bề mặt. Chủ dự án đã ký 2026-08-29 (spec §9 Q4). Ghi số quyết định vào chỗ sửa.

- [ ] **Bước 4: Chạy cổng tương phản**

```bash
npm --prefix scripts run check:theme
```

Kỳ vọng: `[pass]` ba bộ. ⚠ **Cổng này MÙ với thay đổi vừa rồi** — nó chỉ đọc `tokens.css`, và bốn cặp của nó không cặp nào chạm `--c-surface-alt`. Chạy để chứng minh **không hồi quy bốn cặp nó đọc**, không phải để chứng minh R2. Số tương phản thật của R2 đã tính tay trong spec: `primary/surface-alt` = 8,36 / 6,25 / **4,86**; `text-inverse/accent` = 5,20 / 4,80 / 6,01. Bộ `ngoc-lam` 4,86 là số sát ngưỡng cần canh.

- [ ] **Bước 5: Ghi bốn phiếu drift**

- **DR-b1** — đảo `SPEC-2026-08-14` §3.3 (nút `--c-sand` "để thôi đụng màu với giá"). Chủ dự án chốt `07` §1 thắng.
- **DR-b2** — đảo `SPEC-2026-08-14` §3.4 ("khối này dùng nền `--c-band-bg`… vừa là khối tour vừa là dải màu đầu tiên").
- **DR-b3** — đảo `ADR-0026` Hệ quả > Được gạch 2, trạng thái `accepted`, **tầng 3**.
- **DR-k** — R2 tự tạo ba token mồ côi: `--c-band-bg`/`-text`/`-muted` có đúng ba người đọc, cả ba trong file này, và R2 thay cả ba → còn **0 người đọc**. Ràng buộc toàn cục điểm 1 cấm gỡ chúng khỏi `tokens.css` trong đợt này.

Xác nhận số người đọc bằng:

```bash
grep -rn "c-band-" src/ | grep -v tokens.css
```

- [ ] **Bước 6: Commit**

```bash
git add src/components/HomeTourGrid.astro docs/core-specs/07-DESIGN_TOKENS.md docs/DRIFT_LOG.md
git commit -m "fix(mau): khối tour về nền sáng, vai dải đậm chuyển cho dải số liệu

Hero, khối tour và dải số liệu đều #0C4A6E nên đọc thành một dải liền ~2.000px
ở khổ điện thoại — dải đậm thành nền chính chứ không còn là điểm nhấn.

Kèm sửa phần LÝ DO của điều khoản cấm cát làm nền CTA trong 07: lý do thật là
phân vai màu, không phải tương phản (nút thật đo 6,76 và đang đạt AA).

Ghi DR-b1, DR-b2, DR-b3, DR-k."
```

---

# Task 6: R3 — một nhịp dọc `--s6` ở một mốc `≤640px`

**Files:** 13 file, xem bảng trong Bước 2.

**Interfaces:**
- Consumes: Task 4 (thẻ đã rút) — đo nhịp trên trang chưa rút thẻ là đo trên nền sắp đổi.
- Produces: K4 = 1 sau khi loại ba ngoại lệ có tên.

- [ ] **Bước 1: Ghi lại nhịp hiện tại để so**

```bash
npm run build && npm run preview
```

Chạy `await __do('/')`, ghi `K4_giaTriDem`. Kỳ vọng nhiều hơn một giá trị.

- [ ] **Bước 2: Sửa 13 chỗ**

Mỗi dòng: xác nhận bộ chọn bằng `grep` trước, rồi đặt `padding: var(--s6) 0` trong khối `@media (max-width: 640px)`. Khối nào chưa có thì tạo mới.

| # | File | Bộ chọn | Khối `≤640` đã có? |
|---|---|---|---|
| 1 | `Section.astro` | `.section` | **không** — hiện ở `≤768`, xem Bước 3 |
| 2 | `HomeTourGrid.astro` | `.home-tours` | không, tạo mới |
| 3 | `HomeStatsBand.astro` | `.stats-band` | có |
| 4 | `HomeTrustBar.astro` | `.why-section` | có ở `≤767` — **đổi thành `≤640`** |
| 5 | `HomePartners.astro` | `.partners-section` | có |
| 6 | `HomeTestimonials.astro` | `.tm-section` | có |
| 7 | `HomeGroupQuote.astro` | `.gq-section` | có ở `≤767` — **đổi thành `≤640`** |
| 8 | `HomeGuideGrid.astro` | `.guide-section` | có, đang `--s6 0 --s7` → `--s6 0` |
| 9 | `HomeDestinationGrid.astro` | `.dest-section` | có, đang `--s7 0 --s6` → `--s6 0` |
| 10 | `HomeAreaGrid.astro` | `.area-section` | có, đang `--s7 0 --s6` → `--s6 0` |
| 11 | `SiteHome.astro` | `.editorial-section`, `.home-faq-section`, `.home-safety-section` | có |
| 12 | `HomeHubGrid.astro` | `.hubs-section` | có, đang `--s7 0` → `--s6 0` |
| 13 | `HomeBannerGrid.astro` | `.banner-section` | có, nhưng chưa chạm padding |

⚠ **Bốn khối không xác nhận được bằng phép đo:** `.tm-section`, `.gq-section`, `.banner-section`, `.home-safety-section` render **0 lần** trên trang chủ hôm nay (bị chặn rỗng). Sửa chúng không sai — dữ liệu vào là chúng hiện — nhưng K4 không nhìn thấy. Ghi vào `sau.md`.

- [ ] **Bước 3: Tách khối `@media` của `Section.astro` làm hai**

File này hiện có một khối `≤768` chứa **cả** đệm lẫn cỡ chữ tiêu đề. Tách:

```css
  /* Cỡ chữ tiêu đề mục giữ ở ≤768 — đây là luật về CHỮ, không phải về nhịp. */
  @media (max-width: 768px) {
    .section-title {
      font-size: var(--fs-h4);
    }
  }

  /* Nhịp dọc về một mốc duy nhất ≤640 (SPEC-2026-08-29 R3). Trước đây ba mốc lẫn
     nhau (768/767/640) nên ở viewport 700px .section đã rút còn 24px trong khi
     .why-section vẫn 96px — lệch nhịp ở đúng khổ máy tính bảng nhỏ. */
  @media (max-width: 640px) {
    .section {
      padding: var(--s6) 0;
    }
  }
```

⚠ Đánh đổi đã được chủ dự án chấp nhận: ở 641–768px mọi `.section` trên **mọi trang** nay đệm 48px thay vì 24px. Thoáng hơn, không phải lỗi.

- [ ] **Bước 4: Dựng và đo K4**

```bash
npm run build && npm run preview
```

Chạy `await __do('/')`. Kỳ vọng `K4_giaTriDem` chỉ còn **`["32px"]`**.

Nếu còn giá trị lạ, in ra thủ phạm:

```js
const f=document.getElementById('__probe'), d=f.contentDocument, w=f.contentWindow;
[...d.querySelector('main').children]
  .filter(el=>!(el.tagName==='SCRIPT'||el.classList.contains('site-home-hero')||(el.tagName==='DIV'&&!el.className)))
  .forEach(el=>{const s=w.getComputedStyle(el);
    if(s.paddingTop!=='32px'||s.paddingBottom!=='32px')
      console.log(el.className||el.tagName, s.paddingTop, s.paddingBottom)})
```

- [ ] **Bước 5: Commit**

```bash
git add src/components/
git commit -m "fix(nhip): một nhịp dọc 32px ở một mốc 640px cho mọi khối trang chủ

Trước đây năm giá trị đệm (24/32-48/48-32/48/64/96) ở ba mốc lẫn nhau
(768/767/640), nên ở viewport 700px các khối cạnh nhau lệch nhịp thấy rõ.
Tách khối media của Section.astro: đệm xuống 640, cỡ chữ tiêu đề ở lại 768."
```

---

# Task 7: R4 — đích chạm 44px

**Files:** `HomeRollupSection.astro` · `HomeAreaGrid.astro` · `HomeGuideGrid.astro` · `HomeDestinationGrid.astro` · `Footer.astro` · `FAQ.astro` · `SiteHome.astro` · `Header.astro`

**Interfaces:**
- Consumes: không có
- Produces: K3 = 0.

- [ ] **Bước 1: Liệt kê thủ phạm trên bản dựng hiện tại**

Chạy `await __do('/')` và đọc `K3_chiTiet` — nó in class và chiều cao từng đích chạm dưới ngưỡng. Sửa theo danh sách đó, đừng sửa mò.

- [ ] **Bước 2: Nâng bằng chiều cao tối thiểu, KHÔNG đổi cỡ chữ**

Khuôn dùng chung cho link:

```css
  .home-view-all {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
```

Áp cho: `.home-view-all` (`HomeRollupSection`), `.see-all` (ba file `Home*Grid`), link điều hướng trong `Footer.astro`, `.logo` (`Header.astro` và `Footer.astro`), `.skip-link` (`Header.astro` — **không phải** `BaseLayout.astro`, ở đó grep ra 0 kết quả).

Cho `summary` dùng đệm dọc thay vì `inline-flex` (đổi `display` của `summary` làm mất tam giác mở/đóng mặc định):

```css
  summary {
    padding-block: var(--s3);
  }
```

Áp ở `FAQ.astro` **và** `SiteHome.astro`. ⚠ Sửa hai chỗ là **hợp thức hoá một bản dựng trùng** — `SiteHome.astro:289-297` tự dựng `<details>/<summary>` trong khi `FAQ.astro` tồn tại. Ghi **DR-g** ở Task 9 thay vì im lặng.

**Chữ 14–15px ở những chỗ đó là đúng vai — sai là vùng bấm, không phải chữ.** Không đổi `font-size`.

- [ ] **Bước 3: Dựng và đo K3 về 0**

```bash
npm run build && npm run preview
```

Chạy `await __do('/')`, kỳ vọng `K3_soDichChamNho: 0`.

⚠ Phép đo **chỉ đếm phần tử đang hiển thị** (`offsetParent !== null && height > 0`). Không có bộ lọc đó thì nav ẩn ở `≤1023px` cao 0 sẽ đếm là trượt vĩnh viễn — `Header.astro:405` và `:426` đặt `display: none`.

- [ ] **Bước 4: Commit**

```bash
git add src/components/ src/layouts/
git commit -m "fix(dich-cham): mọi link, nút và summary lên 44px ở khổ điện thoại

32 đích chạm dưới ngưỡng: 'Xem tất cả' 24-25px, link chân trang 21px, summary
FAQ 32px, logo 34px. Nâng bằng min-height và đệm dọc, không đổi cỡ chữ —
chữ ở những chỗ đó đúng vai, sai là vùng bấm."
```

---

# Task 8: R5 — hero về 70–76% màn đầu

**Files:** `src/components/SiteHome.astro` (khối `@media (max-width: 640px)` sẵn có)

**Interfaces:**
- Consumes: không có
- Produces: K7 trong dải 70–76.

- [ ] **Bước 1: Hai khai báo, trong khối `≤640` sẵn có**

```css
    /* SPEC-2026-08-29 R5. Hero chiếm 86% màn đầu (727/844) nên khách không thấy
       hé gì phía dưới — không có tín hiệu nào bảo "còn nữa, cuộn đi".
       42px cho ~13 ký tự/dòng nên tiêu đề ngắt 4 dòng; 32px cho ~17-18 ký tự nên
       còn 3 dòng. Với --lh-display 1,22 thì 4×51 = 205px xuống 3×39 = 117px. */
    .site-home-title {
      font-size: var(--fs-h3);
    }

    /* :339 đặt padding-block: --s9 cho cả trên lẫn dưới; :545 đã hạ riêng dưới
       xuống --s7. Hạ nốt trên cho cân. Đây là kích cỡ hero, KHÔNG phải nhịp dọc
       của R3 — đừng gộp hai thứ vào một bảng. */
    .site-home-inner {
      padding-top: var(--s7);
    }
```

- [ ] **Bước 2: Dựng và đo K7**

```bash
npm run build && npm run preview
```

Chạy `await __do('/')`, kỳ vọng `K7_heroPhanTram` trong khoảng **70–76**.

- [ ] **Bước 3: Nếu rơi ngoài dải — chữa đúng chỗ**

Hai ca hỏng, hai cách chữa khác nhau:

- **Tiêu đề đã 3 dòng nhưng % lệch** → chỉnh `padding-top` (`--s6` hoặc `--s8`), **không** chỉnh cỡ chữ.
- **Tiêu đề vẫn 4 dòng ở 32px** → chỉnh `max-width` từ `19ch` lên `21ch`–`22ch`, **không** hạ cỡ chữ nữa (dưới 32px là tụt khỏi thang).

Lý do tách hai ca: `SiteHome.astro:359` đặt `max-width: 19ch`, và ở 32px thì `19ch` ≈ 334px **hẹp hơn** khung 358px — tức sau R5a chính `19ch` mới là thứ trói số dòng, không phải bề rộng khung. Kiểm số dòng thật:

```js
const f=document.getElementById('__probe'), d=f.contentDocument, w=f.contentWindow;
const h1=d.querySelector('.site-home-title'), cs=w.getComputedStyle(h1);
console.log('cỡ', cs.fontSize, '| cao', Math.round(h1.getBoundingClientRect().height),
            '| số dòng', Math.round(h1.getBoundingClientRect().height / parseFloat(cs.lineHeight)))
```

- [ ] **Bước 4: Commit**

```bash
git add src/components/SiteHome.astro
git commit -m "fix(hero): rút hero trang chủ từ 86% xuống ~70% màn đầu

Tiêu đề 42px ngắt 4 dòng chiếm 205px; xuống 32px còn 3 dòng. Cộng đệm trên
96->48px. Chừa một khoảng hé thấy khối kế tiếp để khách biết còn nội dung."
```

---

# Task 9: Đo lại, ghi bằng chứng, đóng sổ phiếu drift

**Files:**
- Create: `docs/evidence/2026-08-29-thi-giac-di-dong/sau.md`
- Modify: `docs/DRIFT_LOG.md` (9 phiếu còn lại: DR-c, DR-f, DR-g, DR-h, DR-i, DR-j, DR-l, DR-m + mục lỗi production)

**Interfaces:**
- Consumes: tất cả Task trước.
- Produces: bộ bằng chứng mở QA2.

- [ ] **Bước 1: Dựng sạch và ghi danh tính**

```bash
rm -rf dist && npm run build
git rev-parse HEAD
stat -f '%Sm' -t '%Y-%m-%d %H:%M:%S' dist/index.html
```

- [ ] **Bước 2: Chạy `do.js` — ĐÚNG file của Task 1, không sửa gì**

```bash
npm run preview
```

```js
await __do('/')
await __do('/diem-tham-quan/di-tich-lich-su/')
await __do('/diem-tham-quan/khu-du-lich-hon-mun/')
await __do('/tour/vinh-san-ho/')
```

- [ ] **Bước 3: Chạy ba cổng máy**

```bash
npm run gate                      # đã bao gồm astro check, không phải chạy riêng
npm --prefix scripts test
npm --prefix scripts run audit:gate 2>&1 | tail -5
```

Kỳ vọng: `gate` 11/11 xanh + 1 `[gap]` (g2, nợ cũ); test `# fail 0` với 211 ca; `audit:gate` **46 đạt / 23 trượt**, cả 23 là GA6 — **nợ có sẵn, không đổ cho đợt này**.

- [ ] **Bước 4: Viết `sau.md`**

Cùng khuôn `truoc.md`, cộng bảng đối chiếu:

| # | Đo | Trước | Sau | Ngưỡng | Đạt? |
|---|---|---|---|---|---|
| K1 | cao trang chủ @390 | 19.977 | | ≤16.000 | |
| K2 | thẻ cao nhất (3 trang 1-mục) | 447 | | ≤200 | |
| K3 | đích chạm <44 đang hiển thị | 32 | | 0 | |
| K4 | giá trị đệm phân biệt | 5 | | 1 | |
| K5 | tràn ngang | 0 | | 0 | |
| K6 | `<h2>` trùng chuỗi | 1 cặp | | 0 | |
| K7 | hero ÷ màn đầu | 86% | | 70–76% | |

**Ba giới hạn bắt buộc ghi vào `sau.md`, không được im lặng:**

1. **Nửa R1b không có bằng chứng.** Ba trang có lưới 1 thẻ đều là `.card-grid`; `home-card-grid` không có lưới 1 mục nào, nên bản vá cho `HomeRollupSection` không quan sát được trên bản dựng này.
2. **Bốn khối của R3 không xác nhận được:** `.tm-section`, `.gq-section`, `.banner-section`, `.home-safety-section` render 0 lần trên trang chủ hôm nay.
3. **Nhánh dự phòng của R6a không chạy khi dựng.** Nó được canh bằng 6 ca test đơn vị của Task 2, không bằng phép đo.

- [ ] **Bước 5: Ghi tám phiếu drift còn lại**

DR-c (`HomeHero.astro` là mã chết ôm hai token sống) · DR-f (`NearbySection` tự dựng thẻ riêng, sau R1 là thẻ duy nhất còn hình dọc ở di động) · DR-g (bản dựng FAQ thứ hai) · DR-h (số cứng ngoài thang: `HomeHubGrid.astro:93` `72px`, `:174` `10px`) · DR-i (tracking trái `07` §2) · DR-j (cả họ `featured*` không lọc `reviewStatus` — 5 field × 2 trang = 10 ô, R6 đóng 1) · DR-l (trang chủ đa ngôn ngữ mất khối tour sau Task 3 — `[lang]/index.astro:98` không truyền `homeTours`; ngủ yên vì `langs = ['vi']` nhưng bẫy đã lên cò) · DR-m (bất biến "reference deref lên bề mặt sống phải trỏ entity đã duyệt" không cổng nào kiểm, và `ADR-0008` Quyết định 4 làm nó vô hình theo thiết kế).

- [ ] **Bước 6: Ghi lỗi production ngoài phạm vi**

Mở một mục riêng trong `DRIFT_LOG.md` cho thứ **không thuộc đợt này nhưng nặng hơn mọi mục trên**: `containedInPlace` và `mentions` deref không lọc `reviewStatus`, và ở đó hợp đồng **im lặng** nên không đóng được bằng cách viện điều khoản như `featured*`.

Đo lại để phiếu mang số tươi:

```bash
for u in /dia-danh/hon-ba/ /dia-danh/cam-ranh/ /dia-danh/nui-co-tien/; do
  printf '%-28s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' "https://tourdao.vn$u?cb=$RANDOM")"
done
curl -s "https://tourdao.vn/diem-tham-quan/khu-du-lich-kong-forest/?cb=$RANDOM" | grep -o 'href="/dia-danh/[a-z-]*/"'
```

Ghi: 7 trang sống, 5 link vào 404, JSON-LD trỏ URL 404; 67/208 document trong perspective `published` mang `reviewStatus: "draft"`; 2/26 deref có lọc; `cms/schemas/*.ts` có 0 chỗ khai `options.filter`. **Cần quyết định riêng** — lọc trong GROQ, hiện tên không link, hay khoá ô chọn trong Studio.

- [ ] **Bước 7: Commit**

```bash
git add docs/evidence/2026-08-29-thi-giac-di-dong/ docs/DRIFT_LOG.md
git commit -m "docs(evidence): số sau đợt chữa thị giác di động + 9 phiếu drift

Bảy phép đo K1-K7 chạy bằng đúng đoạn do.js của lần đo nền, trên dist/ dựng
tại HEAD, kèm rev và mtime. Ghi rõ ba giới hạn: nửa R1b, bốn khối của R3, và
nhánh dự phòng R6a đều không có trang nào quan sát được.

Kèm một lỗi production ngoài phạm vi: containedInPlace và mentions không lọc
reviewStatus — 7 trang sống, 5 link vào 404."
```

---

## Phụ lục — thứ KHÔNG làm trong đợt này

Ghi ra để tác nhân thực thi không tự tiện mở rộng:

1. **Không dọn breakpoint trôi** (480/600/767/900/1023 so với thang 640/768/1024/1280). Xuyên 40+ file, trộn vào đây thì diff không review được.
2. **Không gỡ `tours` khỏi enum `SECTION_KEYS`** (`cms/schemas/siteSettings.ts:21`) — đụng schema. Hệ quả còn lại: biên tập vẫn bật lại được khối rollup từ Studio.
3. **Không dựng hub bốn cổng** của artboard 1a/1b — đòi `hubs["hub-tour"]`, `hubs["hub-vinpearl"]`, `HOME_COPY.hubDescriptions`, cả ba chưa tồn tại.
4. **Không gỡ ba token `--c-band-*`** dù chúng thành mồ côi — ràng buộc toàn cục điểm 1.
5. **Không sửa `06-BINDING_MAP` §5.7 và không sửa `ADR-0026`** — tầng 2 và tầng 3, ngoài thẩm quyền spec task. Chỉ ghi phiếu.
6. **Không sửa `containedInPlace`/`mentions`** dù chúng đang gây 404 — cần quyết định riêng, hợp đồng im lặng ở đó.
7. **Không đưa `COPY.eyebrow`/`sub`/`all` của `HomeTourGrid` vào `HOME_COPY`** — chỉ `heading` về một nguồn, phần còn lại là mở rộng phạm vi.
