# Menu chính bốn mục — Kế hoạch thi hành

> **Cho tác nhân thi hành:** SKILL BẮT BUỘC — dùng `superpowers:subagent-driven-development`
> (khuyến nghị) hoặc `superpowers:executing-plans` để chạy từng task. Các bước dùng cú pháp
> checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Menu chính còn đúng bốn mục (Trang chủ · Tour ▾ · Kinh nghiệm du lịch · Đặt vé
trực tuyến), "Hỗ trợ" và "Liên hệ" lui về chân trang, và trang chủ thôi chuyển hướng sang
`tourdaonhatrang.com`.

**Kiến trúc:** Giữ đúng **một** mảng `nav` trong `src/site.config.ts` làm nguồn sự thật
(ADR-0021, ADR-0023). Thêm loại đích thứ bảy `kind: 'home'` cho trang chủ, và một cờ tuỳ chọn
`footerOnly` đánh dấu mục chỉ hiện ở chân trang. `resolveNav()` nhận thêm tham số `surface` để
Header và Footer lấy hai lát cắt khác nhau từ cùng một mảng.

**Nguồn:** `docs/specs/SPEC-2026-08-13-menu-chinh-bon-muc.md` (đã duyệt 2026-08-13)

**Tech stack:** Astro 5 + TypeScript, Sanity client, build ra Cloudflare Workers static assets.

## Ràng buộc toàn cục

- **Không có test đơn vị cho `src/`.** Vòng đỏ→xanh của mọi task dùng `npx astro build` và
  HTML trong `dist/` làm phép thử. **Không dựng hạ tầng test mới** — nằm ngoài spec đã duyệt.
- **Ngưỡng đạt của mọi task:** `npx astro build` exit 0, không một dòng `[ERROR]`.
- **`npx astro check` phải giữ nguyên 0 errors, 0 warnings.** 44 hint là hiện trạng sẵn có,
  không tính là hồi quy.
- **Không tự push.** Push là phát hành thật (ADR-0009 auto-deploy từ `main`) và lần này còn
  kèm việc công bố trang chủ. Dừng ở commit, chờ chủ dự án.
- **Không đụng** sáu mục menu đang bị ghi chú lại trong `site.config.ts` (Tour Hòn Tằm, Tour
  Mini Beach, Vé VinWonders, KongForest, Tắm bùn Tháp Bà, i-Resort).
- **Nhánh làm việc:** `feat/menu-chinh-bon-muc` (đã tạo, spec đã commit tại `bd3ce64`).
- Chú thích viết tiếng Việt, theo đúng giọng các file xung quanh.

## Bản đồ file

| File | Trách nhiệm | Task |
|---|---|---|
| `src/site.config.ts` | khai `NavKind`, `NavItem`, và mảng `nav` — nguồn sự thật của menu | 1 |
| `src/lib/routes.ts` | phân giải mục menu thành đường dẫn, lọc theo bề mặt, và hai cổng kiểm | 1, 2 |
| `src/components/Header.astro` | render menu chính, đánh dấu mục đang mở | 2, 3 |
| `src/components/Footer.astro` | render menu chân trang | 2 |
| `src/components/SiteHome.astro` | nút phụ ở hero, lấy từ mục menu đầu tiên | 3 |
| `public/_redirects` | gỡ chuyển hướng tạm của trang chủ | 4 |

---

### Task 1: Loại đích `home`, và cổng phải biết trang chủ tồn tại

Task này chứng minh ràng buộc **R2** của spec là thật: thêm "Trang chủ" vào menu mà không khai
`/` là trang được tin thì cổng `assertNavTargetsExist` chặn build. Bước 4 là bước đỏ bắt buộc —
**không được bỏ qua**, vì nó là bằng chứng cổng đang thực sự canh chứ không phải chạy suông.

**Files:**
- Modify: `src/site.config.ts` (`NavKind` ~dòng 265, `NavItem` ~dòng 267-276, `nav` ~dòng 278-300)
- Modify: `src/lib/routes.ts` (`resolveInternalPath` ~dòng 133-177, `assertNavTargetsExist` ~dòng 225-250)

**Interfaces:**
- Produces: `NavKind` thêm giá trị `'home'`; `NavItem.footerOnly?: boolean`. Task 2 dùng
  `footerOnly`; Task 3 dùng `'home'`.

- [ ] **Bước 1: Thêm `'home'` vào `NavKind` và `footerOnly` vào `NavItem`**

Trong `src/site.config.ts`, đổi:

```ts
export type NavKind = 'index' | 'hub' | 'term' | 'detail' | 'static' | 'zalo'
```

thành:

```ts
export type NavKind = 'home' | 'index' | 'hub' | 'term' | 'detail' | 'static' | 'zalo'
```

và thêm field cuối cùng vào `interface NavItem`, ngay sau `children`:

```ts
  /** Danh sách con — mục này thành menu thả xuống. */
  children?: NavItem[]
  /** Chỉ hiện ở chân trang, không lên menu chính. Mặc định là hiện cả hai nơi. */
  footerOnly?: boolean
```

Đồng thời thêm một dòng vào bảng sáu loại đích trong khối chú thích ngay phía trên (khoảng
dòng 252-263), giữ đúng cách căn cột đang có:

```
//   'home'      KHÔNG có target — trang chủ của site
```

- [ ] **Bước 2: Cho `resolveInternalPath` biết loại `'home'`**

Trong `src/lib/routes.ts`, hàm `resolveInternalPath`. Sau dòng `if (item.kind === 'zalo') return null`
và **trước** khối `const bad = ...`, chèn:

```ts
  const prefix = langPrefix(lang)
  // Trang chủ không có `target`: đích của nó là gốc site, không phải một document.
  // Miễn phép kiểm "phải có target" đúng như 'zalo' đang được miễn.
  if (item.kind === 'home') return `${prefix}/`
```

và **xoá** dòng `const prefix = langPrefix(lang)` cũ nằm ngay dưới đó, để không khai hai lần.

- [ ] **Bước 3: Viết lại mảng `nav`**

Trong `src/site.config.ts`, thay toàn bộ `export const nav: NavItem[] = [...]` bằng:

```ts
export const nav: NavItem[] = [
  { label: 'Trang chủ', kind: 'home' },
  {
    label: 'Tour',
    children: [
      { label: 'Tour đảo', kind: 'term', target: 'tour/tour-dao' },

      // ── CHƯA CÓ NỘI DUNG ─────────────────────────────────────────────
      //  Nhập document trong Sanity Studio rồi bỏ dấu // ở đầu dòng tương
      //  ứng, sửa lại phần sau dấu / cho khớp đường dẫn thật.
      //
      // { label: 'Tour Hòn Tằm',    kind: 'detail', target: 'tour/tour-hon-tam' },
      // { label: 'Tour Mini Beach', kind: 'detail', target: 'tour/tour-mini-beach' },
      // { label: 'Vé VinWonders',   kind: 'detail', target: 'attraction/vinwonders-nha-trang' },
      // { label: 'KongForest',      kind: 'detail', target: 'attraction/kongforest' },
      // { label: 'Tắm bùn Tháp Bà', kind: 'detail', target: 'attraction/tam-bun-thap-ba' },
      // { label: 'i-Resort',        kind: 'detail', target: 'attraction/i-resort' },
    ],
  },
  { label: 'Kinh nghiệm du lịch', kind: 'index', target: 'article' },
  { label: 'Đặt vé trực tuyến',   kind: 'zalo' },

  // Hai mục dưới chỉ hiện ở chân trang — menu chính giữ đúng bốn mục bán hàng.
  { label: 'Hỗ trợ',  kind: 'static', target: 'ho-tro',  footerOnly: true },
  { label: 'Liên hệ', kind: 'static', target: 'lien-he', footerOnly: true },
]
```

Giữ nguyên khối chú thích "Trang danh mục con…" đang nằm trên mục Tour đảo nếu nó còn phù hợp;
nếu không, gộp ý vào chú thích mới.

- [ ] **Bước 4: Chạy build — PHẢI ĐỎ**

```bash
cd ~/Documents/projects/ctytnhhtourdao/tourdaovn && npx astro build
```

Kỳ vọng: **exit 1**, dừng ở `getStaticPaths`, với thông báo:

```
[site.config] Menu đang trỏ tới trang KHÔNG TỒN TẠI:
  • /
```

Nếu build xanh ở bước này thì cổng đang không canh — dừng lại và báo, đừng đi tiếp.

- [ ] **Bước 5: Khai `/` là trang được tin**

Trong `src/lib/routes.ts`, hàm `assertNavTargetsExist`, ngay sau vòng `for (const key of staticPages)`,
chèn:

```ts
  // Trang chủ do `src/pages/index.astro` sinh, nằm ngoài cả `staticPages` lẫn danh sách
  // trang động, nên cũng thuộc diện "được TIN là có" như chú thích trên. Không khai ở đây
  // thì mục menu `kind: 'home'` bị chính cổng này báo là trang không tồn tại.
  for (const lang of langs) have.add(norm(`${langPrefix(lang)}/`))
```

- [ ] **Bước 6: Chạy build — phải XANH**

```bash
npx astro build && echo "exit=$?"
npx astro check 2>&1 | tail -4
```

Kỳ vọng: build exit 0; `astro check` cho `0 errors`, `0 warnings`.

- [ ] **Bước 7: Commit**

```bash
git add src/site.config.ts src/lib/routes.ts
git commit -m "feat: them kind:'home' va co footerOnly cho nav

Menu chinh doi thanh bon muc: Trang chu, Tour, Kinh nghiem du lich,
Dat ve truc tuyen. Ho tro va Lien he mang co footerOnly.

assertNavTargetsExist phai khai \`/\` la trang duoc tin — trang chu do
src/pages/index.astro sinh, nam ngoai staticPages lan danh sach trang
dong. Da chung minh bang buoc do: chua khai thi build dung voi
'Menu dang tro toi trang KHONG TON TAI: /'.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Lọc theo bề mặt — Header và Footer lấy hai lát cắt khác nhau

**Files:**
- Modify: `src/lib/routes.ts` (`ResolvedNavItem` ~dòng 110-118, `resolveNav` ~dòng 183-200)
- Modify: `src/components/Header.astro:27`
- Modify: `src/components/Footer.astro:28`

**Interfaces:**
- Consumes: `NavItem.footerOnly` (Task 1)
- Produces: `resolveNav(lang, zaloUrl?, surface?)` với `surface: NavSurface = 'all'`;
  `ResolvedNavItem.kind: NavKind | null`. Task 3 dùng `.kind`.

- [ ] **Bước 1: Thêm `kind` vào `ResolvedNavItem` và tham số `surface` vào `resolveNav`**

Trong `src/lib/routes.ts`, thêm vào `interface ResolvedNavItem`, ngay sau `label`:

```ts
  /** Loại đích đã khai. `null` với mục chỉ là nhóm chứa con. */
  kind: NavKind | null
```

`NavKind` phải được import — bổ sung vào khối `import { ... } from '../site.config'` ở đầu file:

```ts
  type NavItem,
  type NavKind,
```

Thêm kiểu bề mặt ngay trên `resolveNav`:

```ts
/** Nơi menu được render. Header và chân trang lấy hai lát cắt khác nhau của cùng một `nav`. */
export type NavSurface = 'header' | 'footer' | 'all'
```

Rồi đổi `resolveNav` thành:

```ts
export function resolveNav(
  lang: Lang,
  zaloUrl?: string | null,
  surface: NavSurface = 'all',
): ResolvedNavItem[] {
  const walk = (items: NavItem[]): ResolvedNavItem[] =>
    items.flatMap(item => {
      if (item.kind === 'zalo' && !zaloUrl) return []
      if (surface === 'header' && item.footerOnly) return []
      const children = item.children?.length ? walk(item.children) : []
      if (item.children?.length && children.length === 0) return []
      const internalPath = resolveInternalPath(item, lang)
      return [{
        label: item.label,
        kind: item.kind ?? null,
        href: item.kind === 'zalo' ? (zaloUrl ?? null) : internalPath,
        internalPath,
        children,
      }]
    })
  return walk(nav)
}
```

`navInternalPaths()` **không đổi** — nó gọi `resolveNav(lang, 'https://zalo.me/placeholder')`
với `surface` mặc định `'all'`. Cổng phải kiểm cả mục chỉ nằm ở chân trang; lọc ở đó sẽ mở một
lỗ đúng bằng kích thước phần bị lọc.

- [ ] **Bước 2: Header lấy lát `'header'`**

`src/components/Header.astro` dòng 27:

```ts
const navItems = resolveNav(uiLang, contact?.zaloUrl, 'header')
```

- [ ] **Bước 3: Footer lấy lát `'footer'`**

`src/components/Footer.astro` dòng 28:

```ts
const navItems = resolveNav(uiLang, contact?.zaloUrl, 'footer')
```

Cách chia `navGroups` / `navFlat` ở hai dòng dưới **giữ nguyên**, không sửa.

- [ ] **Bước 4: Build và kiểm HTML sinh ra**

```bash
npx astro build && echo "exit=$?"

python3 - <<'PY'
import re, pathlib
h = pathlib.Path('dist/index.html').read_text()
for tag in ('header', 'footer'):
    m = re.search(rf'<{tag}.*?</{tag}>', h, re.S)
    links = [(a, re.sub(r'<[^>]+>', '', b).strip())
             for a, b in re.findall(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', m.group(0), re.S)]
    print(f'--- {tag.upper()} ---')
    for href, text in links:
        if text: print(f'  {href:<52} {text}')
PY
```

Kỳ vọng:
- HEADER có đúng bốn mục có nhãn menu: `/` Trang chủ · `/tour/tour-dao/` Tour đảo ·
  `/cam-nang/` Kinh nghiệm du lịch · link Zalo Đặt vé trực tuyến. (Nhóm "Tour" là thẻ
  `<button>`/`<span>`, không phải `<a>`, nên không hiện trong danh sách này — đúng như hiện
  hành.) Ngoài ra còn link `#main-content` "Bỏ qua điều hướng" và logo trỏ `/`.
- HEADER **không** chứa `/ho-tro/` hay `/lien-he/`.
- FOOTER **có** cả `/ho-tro/` và `/lien-he/`.

- [ ] **Bước 5: Commit**

```bash
git add src/lib/routes.ts src/components/Header.astro src/components/Footer.astro
git commit -m "feat: resolveNav loc theo be mat, header khac footer

Header lay lat 'header' (bo muc footerOnly), Footer lay lat 'footer'.
Van mot mang \`nav\` duy nhat — khong nhan doi thanh hai danh sach.

navInternalPaths giu surface 'all': cong phai kiem ca muc chi nam o
chan trang.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Tô sáng trang chủ, và gỡ bẫy ở nút hero

**Files:**
- Modify: `src/components/Header.astro:30-33` (`isActive`)
- Modify: `src/components/SiteHome.astro:33-35` (`firstNavItem`)

**Interfaces:**
- Consumes: `ResolvedNavItem.kind` (Task 2)

- [ ] **Bước 1: Xác nhận lỗi trước khi sửa**

```bash
grep -c 'href="/"[^>]*class="[^"]*active' dist/index.html
```

Kỳ vọng: **`0`** — trang chủ đang không được tô sáng dù đang đứng ở trang chủ. Nguyên nhân là
câu chặn `href !== '/'` trong `isActive`, viết từ thời chưa mục nào có `href` là `/`.

- [ ] **Bước 2: Sửa `isActive` dùng `kind` thay vì đoán bằng chuỗi**

`src/components/Header.astro`, thay cả hàm:

```ts
/** Mục đang mở? Dùng cho cả mục lẻ lẫn nhóm có con. */
function isActive(item: { kind: string | null; href: string | null; children: { kind: string | null; href: string | null }[] }): boolean {
  // Trang chủ so khớp CHÍNH XÁC: `startsWith('/')` đúng với mọi đường dẫn, nên dùng nó ở
  // đây sẽ tô sáng "Trang chủ" trên khắp site.
  const hit = (i: { kind: string | null; href: string | null }) =>
    i.href !== null && (i.kind === 'home' ? currentPath === i.href : currentPath.startsWith(i.href))
  return hit(item) || item.children.some(hit)
}
```

Rồi đổi hai chỗ gọi trong phần template (dòng ~61 và ~80) từ
`isActive(item.href, item.children)` thành `isActive(item)`.

- [ ] **Bước 3: Build và kiểm tô sáng ở hai trang**

```bash
npx astro build && echo "exit=$?"
echo -n "trang chu (mong doi 1): "; grep -c 'href="/"[^>]*class="[^"]*active' dist/index.html
echo -n "trang tour  (mong doi 0): "; grep -c 'href="/"[^>]*class="[^"]*active' dist/tour/tour-dao/index.html
```

Kỳ vọng: `1` ở trang chủ, `0` ở trang danh mục tour.

- [ ] **Bước 4: Gỡ bẫy ở `SiteHome.astro`**

Nút phụ ở hero lấy mục menu đầu tiên có link. "Trang chủ" nay đứng đầu, nên nút ấy sẽ trỏ về
chính trang đang đứng. Đổi:

```ts
const firstNavItem = resolveNav(lang, config?.contact?.zaloUrl)
  .flatMap(item => (item.children.length > 0 ? item.children : [item]))
  .find(item => item.href && item.kind !== 'home')
```

**Lưu ý khi nghiệm thu:** nút này chỉ render khi `!zaloUrl` (dòng ~143), mà link Zalo đang có,
nên **không quan sát được trong HTML sinh ra**. Nghiệm thu bằng đọc mã và build xanh. Không tự
xoá link Zalo để thử — đó là dữ liệu production.

- [ ] **Bước 5: Commit**

```bash
git add src/components/Header.astro src/components/SiteHome.astro
git commit -m "fix: to sang trang chu dung cach, va go bay o nut hero

isActive chan cung \`href !== '/'\` tu thoi chua muc nao co href la '/',
nen them Trang chu vao thi no khong bao gio duoc to sang. Nay hoi thang
\`kind\`: muc 'home' so khop chinh xac, muc khac giu startsWith.

SiteHome lay muc menu dau tien co link lam nut phu o hero. Trang chu nay
dung dau nen nut do se tro ve chinh trang dang dung. Bo qua kind 'home'.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Gỡ chuyển hướng trang chủ, và chạy trọn bảng nghiệm thu

**Files:**
- Modify: `public/_redirects` (chủ dự án đã sửa dở tại máy, chưa commit)

- [ ] **Bước 1: Xác nhận nội dung đang sửa dở**

```bash
git diff public/_redirects
```

Kỳ vọng đúng một dòng đổi:

```diff
-/    https://tourdaonhatrang.com/    302
+#/    https://tourdaonhatrang.com/    302
```

Nếu khác, dừng và báo — đừng tự đoán ý.

- [ ] **Bước 2: Cập nhật khối chú thích cho khớp thực tế**

Trong `public/_redirects`, khối "Phần 2 — Điều hướng tạm thời", đổi dòng
`# GỠ KHI: site công bố. Mốc ra mắt 2026-08-09 theo QĐ-2026-08-06-01.` thành:

```
# ĐÃ GỠ 2026-08-13: site công bố, trang chủ phục vụ nội dung thật và đã lên menu
# chính. Giữ dòng đã ghi chú lại làm dấu vết, không xoá hẳn.
```

Không phát sinh nợ R3: chính khối này đã khai dòng ấy thuộc "Phần 2 — điều hướng tạm thời,
KHÔNG phải R3".

- [ ] **Bước 3: Chạy trọn bảng nghiệm thu §6 của spec**

```bash
npx astro build > /tmp/build-final.log 2>&1; echo "build exit=$?"
grep -c "\[ERROR\]" /tmp/build-final.log
npx astro check 2>&1 | tail -4
test -s dist/index.html && echo "index.html: co noi dung"
echo -n "header co /ho-tro/ (mong doi 0): "
python3 -c "
import re,pathlib
h=pathlib.Path('dist/index.html').read_text()
m=re.search(r'<header.*?</header>',h,re.S)
print(m.group(0).count('/ho-tro/'))
"
echo -n "footer co /ho-tro/ (mong doi >=1): "
python3 -c "
import re,pathlib
h=pathlib.Path('dist/index.html').read_text()
m=re.search(r'<footer.*?</footer>',h,re.S)
print(m.group(0).count('/ho-tro/'))
"
```

Kỳ vọng: build exit 0; `0` dòng `[ERROR]`; check `0 errors, 0 warnings`; `index.html` có nội
dung; header đếm `/ho-tro/` ra `0`; footer ra `>= 1`.

- [ ] **Bước 4: Commit**

```bash
git add public/_redirects
git commit -m "feat: go chuyen huong tam cua trang chu

tourdao.vn/ thoi day khach sang tourdaonhatrang.com. Trang chu nay phuc
vu noi dung that va da co mat tren menu chinh.

Khong phat sinh no R3: dong nay thuoc 'Phan 2 — dieu huong tam thoi,
KHONG phai R3' theo chinh chu thich trong file.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Bước 5: DỪNG — báo cáo, không push**

Báo cáo gồm: kết quả từng dòng bảng nghiệm thu §6, danh sách commit đã tạo, và nhắc rằng push
là hành động công bố trang chủ ra thực tế. Chờ chủ dự án quyết.

---

## Tự rà kế hoạch

**Phủ spec:** §5.1 → Task 1 bước 1+3. §5.2 điểm 1 → Task 1 bước 2; điểm 2 → Task 2 bước 1;
điểm 3 → Task 2 bước 1 (ghi rõ không đổi); điểm 4 → Task 1 bước 5; điểm 5 → Task 2 bước 1.
§5.3 → Task 2 bước 2-3 và Task 3 bước 2+4. §5.4 → Task 4. §6 → Task 4 bước 3. §7 → ràng buộc
toàn cục (không đụng sáu mục ghi chú). §8 → Task 4 bước 5.

**Chỗ trống:** không còn "TBD"/"TODO"; mọi bước sửa mã đều có khối mã thật.

**Nhất quán kiểu:** `NavKind` (thêm `'home'`) · `NavItem.footerOnly` · `NavSurface` ·
`resolveNav(lang, zaloUrl?, surface?)` · `ResolvedNavItem.kind` — tên dùng ở Task 2, 3 khớp
đúng tên khai ở Task 1, 2.
