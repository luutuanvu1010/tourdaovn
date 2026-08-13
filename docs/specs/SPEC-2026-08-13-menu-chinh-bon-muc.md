# SPEC — Menu chính bốn mục: Trang chủ, Tour, Kinh nghiệm du lịch, Đặt vé trực tuyến

- **Trạng thái:** thiết kế đã được chủ dự án duyệt 2026-08-13 (phần A–B, rồi C–E). Chưa thi hành.
- **Ngày soạn:** 2026-08-13   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa hai chiều (đổi cấu hình menu và thêm một loại đích, revert được
  bằng một commit); riêng việc gỡ chuyển hướng trang chủ là **cửa một chiều trên thực tế** —
  `/` đã công bố thì không đưa khách trở lại `tourdaonhatrang.com` được nữa mà không gãy niềm tin
- **Vào từ:** yêu cầu trực tiếp của chủ dự án trong phiên 2026-08-13
- **Repo lúc soạn:** `main` tại `a715b49`

---

## 1. Mục tiêu

Menu chính đổi thành đúng bốn mục, theo thứ tự: **Trang chủ · Tour ▾ · Kinh nghiệm du lịch ·
Đặt vé trực tuyến**. "Hỗ trợ" và "Liên hệ" rời khỏi menu chính nhưng vẫn còn lối vào ở chân
trang. Trang chủ thôi chuyển hướng sang `tourdaonhatrang.com`.

## 2. Đầu vào đã đọc

`docs/adr/ADR-0021` (site.config là nguồn sự thật) · `docs/adr/ADR-0023` (cơ chế `nav`, sáu
`kind`) · `docs/adr/ADR-0025` (hai cổng kiểm nav, vừa chốt cùng ngày) ·
`src/site.config.ts` §7 · `src/lib/routes.ts` · `src/components/Header.astro`,
`Footer.astro`, `SiteHome.astro` · `public/_redirects` · `CLAUDE.md` §8 (repo hygiene)

## 3. Hiện trạng và ba ràng buộc phát hiện khi khảo sát

Menu hiện tại: nhóm "Tour & Vé" (một con: Tour đảo Nha Trang), Kinh nghiệm du lịch, Đặt vé
trực tuyến, Hỗ trợ, Liên hệ. Header và Footer đọc **cùng một** mảng `nav`.

Ba ràng buộc buộc thiết kế phải xử, không né được:

**R1 — không có loại đích nào cho trang chủ.** Sáu `kind` của ADR-0023 là
`index | hub | term | detail | static | zalo`. `static` chỉ sinh `/<tên>/` từ
`staticPages = ['ho-tro', 'lien-he']`, không sinh ra `/`.

**R2 — cổng `assertNavTargetsExist` sẽ chặn "Trang chủ".** Cổng tin `staticPages` cộng danh
sách trang động sinh trong `getStaticPaths`. Trang chủ do `src/pages/index.astro` sinh, nằm
ngoài cả hai tập, nên `/` bị coi là "trang KHÔNG TỒN TẠI" và build đỏ.

**R3 — `isActive` trong `Header.astro:31-32` chặn cứng `href !== '/'`.** Câu chặn ấy vô hại
khi chưa mục nào có `href` là `/`. Thêm "Trang chủ" vào thì nó thành ra trang chủ **không bao
giờ được tô sáng**, kể cả khi đang đứng ở trang chủ.

Ngoài ra `SiteHome.astro:33` lấy **mục menu đầu tiên có link** làm nút phụ ở hero. "Trang chủ"
đứng đầu sẽ khiến nút ấy trỏ về chính trang đang đứng. Nút này chỉ render khi chưa điền link
Zalo nên hiện đang ẩn — nhưng để nguyên là cài sẵn một cái bẫy cho ngày ai đó xoá link Zalo.

## 4. Chọn hướng: thêm `kind:'home'` + cờ `footerOnly`, giữ một mảng `nav`

Ba hướng đã cân nhắc:

| Hướng | Được | Loại vì |
|---|---|---|
| **A. `kind:'home'` + cờ `footerOnly`** ← chọn | một nguồn sự thật, header ≠ footer mà không nhân đôi | — |
| B. tách `navHeader` và `navFooter` | đọc là hiểu ngay | bốn mục chung khai hai lần → hai nguồn sự thật, đúng thứ `N7` cấm và đúng thứ ADR-0023 sinh ra để dẹp (`DR-007`) |
| C. Header tự lọc bỏ mọi `kind:'static'` | sửa ít nhất | luật "cái gì không lên header" nằm trong component chứ không trong `site.config.ts`, trái ADR-0021; thêm trang tĩnh muốn lên header thì hết đường |

## 5. Phạm vi thay đổi

### 5.1 `src/site.config.ts`

`NavItem` thêm hai thứ: `kind` nhận thêm giá trị `'home'`, và field tuỳ chọn
`footerOnly?: boolean`. Mảng `nav` viết lại:

```ts
export const nav: NavItem[] = [
  { label: 'Trang chủ',           kind: 'home' },
  { label: 'Tour', children: [
      { label: 'Tour đảo',        kind: 'term',  target: 'tour/tour-dao' },
  ]},
  { label: 'Kinh nghiệm du lịch', kind: 'index', target: 'article' },
  { label: 'Đặt vé trực tuyến',   kind: 'zalo' },

  // Chỉ hiện ở chân trang, không lên menu chính.
  { label: 'Hỗ trợ',  kind: 'static', target: 'ho-tro',  footerOnly: true },
  { label: 'Liên hệ', kind: 'static', target: 'lien-he', footerOnly: true },
]
```

Sáu mục bị ghi chú lại từ đợt trước (Tour Hòn Tằm, Tour Mini Beach, Vé VinWonders,
KongForest, Tắm bùn Tháp Bà, i-Resort) **giữ nguyên trạng thái ghi chú**. Chúng nằm ngoài
phạm vi lần này.

### 5.2 `src/lib/routes.ts`

1. `resolveInternalPath`: `kind:'home'` trả `` `${prefix}/` ``, và được miễn phép kiểm "phải
   có `target`" đúng như `'zalo'` đang được miễn.
2. `resolveNav(lang, zaloUrl, surface)` — `surface: 'header' | 'footer' | 'all'`, mặc định
   `'all'`. `'header'` loại mọi mục có `footerOnly`. Chỉ thêm một bước lọc, không đụng logic
   phân giải.
3. `navInternalPaths()` **giữ `surface: 'all'`**. Cổng phải kiểm cả mục chỉ nằm ở chân trang;
   lọc ở đây sẽ mở một lỗ đúng bằng kích thước phần bị lọc.
4. `assertNavTargetsExist`: thêm `` `${langPrefix(lang)}/` `` vào tập trang được tin, cho mọi
   lang đang bật, kèm chú thích rằng trang chủ do `src/pages/index.astro` sinh — cùng loại
   giới hạn đã ghi sẵn ở đó cho `staticPages`.
5. `ResolvedNavItem` mang thêm `kind`, để Header thôi phải đoán bằng cách so chuỗi `href`.

### 5.3 Ba component

| File | Sửa |
|---|---|
| `Header.astro:27` | `resolveNav(uiLang, contact?.zaloUrl, 'header')` |
| `Header.astro:30-33` | `isActive` dùng `kind`: mục `'home'` so khớp **chính xác** (`currentPath === href`); mục khác giữ `startsWith` |
| `Footer.astro:28` | `resolveNav(uiLang, contact?.zaloUrl, 'footer')`; cách chia `navGroups`/`navFlat` giữ nguyên |
| `SiteHome.astro:33` | bỏ qua mục `kind:'home'` khi tìm nút phụ cho hero |

Chân trang vốn đã có logo trỏ về `/`, nên "Trang chủ" ở footer là lối vào thứ hai cùng đích.
Chủ dự án đã chọn như vậy, giữ đúng.

### 5.4 `public/_redirects`

Đưa vào commit phần chủ dự án đã sửa dở tại máy: ghi chú lại dòng
`/  https://tourdaonhatrang.com/  302`.

Không phát sinh nợ R3: chính `_redirects` đã khai dòng ấy thuộc "Phần 2 — điều hướng tạm
thời, KHÔNG phải R3", gỡ khi site công bố.

## 6. Cách chứng minh đã xong

Kho này không có unit test cho `src/`; cơ chế cưỡng chế là cổng lúc build. Nghiệm thu bằng
build thật và đọc HTML sinh ra, cùng cách đã dùng ở đợt sửa ADR-0025.

| Kiểm | Ngưỡng đạt |
|---|---|
| `npx astro build` | exit 0, không dòng `[ERROR]` nào |
| `npx astro check` | 0 errors, 0 warnings |
| Header trong `dist/index.html` | đúng 4 mục, đúng thứ tự: Trang chủ · Tour · Kinh nghiệm du lịch · Đặt vé trực tuyến |
| Nhóm "Tour" | đúng 1 con, trỏ `/tour/tour-dao/` |
| Footer trong `dist/index.html` | 6 mục, có Hỗ trợ và Liên hệ |
| Header **không** chứa | `/ho-tro/`, `/lien-he/` |
| `dist/index.html` | tồn tại và có nội dung thật (không phải trang chuyển hướng) |
| Tô sáng "Trang chủ" | có `class` active ở `dist/index.html`; **không** có ở `dist/tour/tour-dao/index.html` |
| Cổng `assertNavTargetsExist` | qua, không nới lỏng gì ngoài việc khai `/` là trang được tin |
| Sau khi push | `curl https://tourdao.vn/` trả 200, không còn 302 |

## 7. Phần cố ý để lại, và vì sao

- **Nhóm "Tour" hiện chỉ có một con.** Sanity mới có đúng một `tour-type` là "Tour đảo".
  Menu thả xuống một dòng trông kỳ, nhưng chủ dự án chọn dạng nhóm để mở rộng dần khi có
  thêm loại tour. Không tự ý rút gọn thành link đơn.
- **Sáu mục menu đang ghi chú lại** giữ nguyên, xem §5.1.
- **`/tour/` (danh sách mọi tour) không lên menu.** Hiện nội dung trùng `/tour/tour-dao/` vì
  cả 7 tour đều là tour đảo. Khi có loại tour thứ hai thì cân lại.
- **Hai mục còn treo của ADR-0025** — entity approved thiếu `slug` vẫn rơi im lặng, và
  `ND-002` (organization "Vinpearl" giữ slug hình bài viết) — không thuộc phạm vi lần này.

## 8. Điểm dừng

Thi hành xong §5, chạy đủ §6, báo kết quả kèm bằng chứng. **Không tự push.** Push là phát
hành thật (ADR-0009 auto-deploy từ `main`), và lần này còn kèm việc công bố trang chủ — chờ
chủ dự án gật.
