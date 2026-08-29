# SPEC — Chữa thị giác di động: hình dạng thẻ, nhịp dọc, dải màu, đích chạm

- **Trạng thái:** nháp **v4**, **chờ chủ dự án duyệt**. Bốn câu chặn QA1 ở §9 **đã có quyết định** 2026-08-29.
  - **v1** — bị QA nội bộ CHẶN 4 mục.
  - **v2** — viết lại theo 4 phán quyết đó cộng 5 phát hiện của kiểm cổng. Vẫn bị CHẶN **2** mục mới: R1b reset sai giá trị, R6a mã giả ném lỗi lúc build.
  - **v3** — đóng 2 mục CHẶN của v2; viết lại §5.2 (bỏ K8, sửa tập đếm K2/K3/K4); mở rộng DR-j từ 1 field lên **10 ô**; thêm DR-k/l/m; ghi một **lỗi production đang sống** vào §7.
  - **v4 (bản này)** — bốn quyết định của §9: thêm **R7** (lưới tour co theo số thẻ), **R6a-bis** (tách hàm + test đơn vị 4 ca), **R2c** (sửa lý do trong `07` §1), **DR-n** (ngưỡng `ADR-0026`).
- **Đã qua ba lượt review độc lập** (code-reviewer ×2, gate-auditor ×2, contract-checker ×1). Mọi số đo trong file này đã được kiểm chéo ít nhất một lần bởi tác nhân không phải người soạn.
- **Ngày soạn:** 2026-08-29   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** **cửa hai chiều** ở R1/R3/R4/R5 (thuần `<style>`, revert bằng một commit). **R2 và R6 KHÔNG thuần hai chiều** — R2 đảo ba điều khoản đã duyệt; R6 đổi luồng dữ liệu (nhưng **không** đụng GROQ, xem R6c). Bản v1 khai sai chỗ này ("cửa hai chiều toàn bộ", "chỉ `<style>`"); đã sửa.
- **Nhánh:** `feat/thi-giac-di-dong`, dựng từ `origin/main` tại **`38866f2`**
- **Đầu vào thiết kế:** Claude Design project `17d9bdbf-0058-4cb7-bd7e-69e95f24efb1`, file `Trang chủ mới.dc.html`. **Chỉ lấy hai artboard "Mobile 390px — thẻ ngang".** Hai artboard desktop 1a/1b loại ở §4.1.
- **Liên quan:** `06-BINDING_MAP` **v2.13.0** §5.7 và §6 Luật 5, `07-DESIGN_TOKENS` §1–§4, `SPEC-2026-08-14-be-mat-vong-3` §3.3–3.4, `ADR-0026`, `DR-062`

---

## 0. Phạm vi

Chủ dự án chốt: **chữa thị giác, giữ nguyên cấu trúc.** Ba cánh cửa đóng:

1. **Không thêm dữ liệu, không thêm entity, không thêm hub.** Artboard 1a/1b đòi `hubs["hub-tour"]`, `hubs["hub-vinpearl"]`, `HOME_COPY.hubDescriptions` — bảng ánh xạ của chính file thiết kế ghi cả ba **CHƯA CÓ**. `CLAUDE.md` §5: Design không đi trước cấu trúc.
2. **Không thêm token, không thêm giá trị ngoài thang.** Mọi số trong spec này đã có trong `src/styles/tokens.css`.
3. **Không đụng `siteSettings` trong Studio.** Hôm nay `siteSettings.sections` trống nên chạy `DEFAULT_SECTIONS`.

### 0.1 Hai chỗ phạm vi ĐÃ ĐƯỢC NỚI, chủ dự án chốt 2026-08-29

Bản v1 tuyên bố "không đụng dữ liệu, chỉ `<style>`". **Hai quyết định dưới đây phá tuyên bố đó**, và spec ghi ra thay vì để nó chìm:

| Nới gì | Vì sao |
|---|---|
| **R2 đảo ba điều khoản đã duyệt** | `07` §1 (tầng 2) cấm sand làm nền CTA, chỏi `SPEC-2026-08-14` §3.3 (tầng 6). `CLAUDE.md` §5 gọi đây là hard stop; đã hỏi, chủ dự án chốt **`07` thắng**. Kéo theo **ba** phiếu drift, không phải một. |
| **R6 đổi luồng dữ liệu** | Hai khối tour ăn hai nguồn khác nhau (§2.7), nên "gỡ trùng" của v1 là **mất nội dung**. Chủ dự án chốt phương án gộp thật: chọn tour theo `td.featuredTours` nhưng lấy dữ liệu từ `allTours` đã có sẵn. Sửa gọn trong `index.astro` (~5 dòng); **không chạm GROQ, không đổi prop nào** (R6a, R6c). |

---

## 1. Việc được giao

> "Điều chỉnh lại giao diện và tối ưu thị giác, đặc biệt là trên thiết bị di động."

Bốn câu đã hỏi và đã chốt: phạm vi = chữa thị giác giữ cấu trúc · thẻ di động = thẻ ngang thumbnail 88px, áp mọi chỗ dùng `Card` · màu nút khối tour = `07` thắng, đổi `--c-accent` · khối tour trùng = trỏ `HomeTourGrid` vào `featuredTours`.

---

## 2. Chẩn đoán

**Phương pháp.** Đo DOM bằng JavaScript trong iframe 390×844 nhúng vào `https://tourdao.vn/`, 2026-08-29. Không chụp màn hình — Chrome treo khi chụp trên site này.

> ⚠ **Lệch chủ thể đo, chưa xử.** Số "Trước" dưới đây đo trên **production**, dựng từ `origin/main`. Nhánh này cũng dựng từ `origin/main` — nhưng production có thể chạy một build cũ hơn `38866f2`. **Trước khi mở QA2 phải đo lại toàn bộ cột "Trước" trên `dist/` dựng tại HEAD của nhánh này** (§5). Số dưới đây là chẩn đoán, chưa phải baseline của cổng.

### 2.1 Trang chủ cao 19.977px ở khổ 390px

≈ 23,7 màn. 15 khối. **Tràn ngang bằng 0** — khung không vỡ; bệnh là chiều dài và nhịp.

### 2.2 16 thẻ ăn một phần ba trang

`.card` đo **358×397–447px**, mỗi thẻ ôm `.card-img-wrap` `aspect-ratio: 4 / 3` (`Card.astro:97`) cao **267px**. 16 thẻ × ~410px ≈ **6.560px**. Cộng 3 `.tour-card` ở 358×384px.

Ảnh 4:3 là tỷ lệ của lưới nhiều cột. Khi lưới sập còn một cột, tỷ lệ đó biến mỗi thẻ thành một tấm poster — hệ quả phụ, không phải lựa chọn.

### 2.3 Dải xanh liền khoảng 2.000px

| Khối | Cao | Nguồn nền |
|---|---|---|
| `.site-home-hero` | 727px | ảnh + gradient `SiteHome.astro:333`, kết thúc `--c-primary-strong` **alpha 1** ở mép dưới |
| `.home-tours` | 1.480px | `HomeTourGrid.astro:73` `--c-band-bg` → `tokens.css:43` = `--c-primary` |
| `.stats-band` | 350px | `HomeStatsBand.astro:41` `--c-primary` |

Gradient hero không sáng lên ở đáy nên ba khối đọc thành **một dải liền**.

`HomeTourGrid.astro:9` ghi lý do lấy nền đậm: *"cắt mạch trắng liền"*. Ở vị trí thật **không có mạch trắng nào để cắt** — nó kẹp giữa hai khối đậm.

### 2.4 Năm nhịp dọc ở cùng một khổ

**Đây không phải bản kiểm kê đầy đủ** — v1 trình bày như thể là, và bỏ sót năm khối. Bảng đầy đủ ở R3.

Giá trị phân biệt đo được ở ≤640px: **24 · 32/48 · 48/32 · 48 · 64 · 96**. `Section.astro:72-74` đã có quy ước đúng (`--s7` desktop → `--s5` ≤768). Mười hai khối tự khai CSS riêng không theo nó; hai khối giữ `--s9` (96px) trên màn 390px.

### 2.5 32 đích chạm dưới 44px

| Nhóm | Đo | Vị trí |
|---|---|---|
| `.home-view-all` | 73×**25** | `HomeRollupSection.astro:53` (CSS `:115`) |
| `.see-all` | 75×**24** | `HomeAreaGrid:38`, `HomeGuideGrid:49`, `HomeDestinationGrid:41` |
| Link chân trang | ~**21** | `Footer.astro` |
| `summary` FAQ | 324×**32** | `SiteHome.astro:289-297`, `FAQ.astro` |
| `.logo` | 180×**34** / 358×**34** | `Header.astro`, `Footer.astro` |
| `.skip-link` | 160×**41** | **`Header.astro:54`** (CSS `:231`) — v1 ghi nhầm `BaseLayout.astro`, ở đó grep ra 0 kết quả |

### 2.6 `h1` trang chủ 205px trên bốn dòng

`SiteHome.astro:356` khai `clamp(var(--fs-h1), 5vw, var(--fs-display))`. Ở 390px thì `5vw` = 19,5px nên **sàn thắng**: render **42px**, ~13 ký tự/dòng, ngắt 4 dòng. Cộng `.site-home-inner` `padding-block: --s9` (`:339`) và `--s7` dưới ở ≤640 (`:545`) → hero **727px = 86% màn đầu**.

Số hạng giữa của clamp **chết dưới ~840px viewport** — sàn 42px luôn thắng. Đây là lỗi riêng của clamp, R5a chỉ vá bằng override ≤640 nên 641–840px vẫn 42px (ghi §7).

### 2.7 Hai khối "Tour nổi bật" ăn HAI NGUỒN KHÁC NHAU

**Đây là chỗ bản v1 sai nặng nhất.** v1 gọi đây là "trùng lặp" và tự cấp ngoại lệ cho §0. Mã bác bỏ:

| | `HomeTourGrid` | rollup `{ key: 'tours' }` |
|---|---|---|
| Nguồn | `index.astro:41` `allTours.filter(…).slice(0, 3)` | `SiteHome.astro:284-285` `td.featuredTours` |
| Truy vấn | `tour.ts:75` `*[_type=="tour" && reviewStatus=="approved"] \| order(title.vi asc)` | `touristDestination.ts:112` `featuredTours[]->` |
| **Ai chọn** | **máy** — ba tour đầu bảng chữ cái | **biên tập** — mảng reference trong Studio |
| Tắt/đảo từ Studio? | **KHÔNG** — render vô điều kiện ở `SiteHome.astro:196`, ngoài `activeSections` | có |

Gỡ rollup là cắt **con đường duy nhất** `featuredTours` tới trang chủ. Tour biên tập chọn mà không nằm trong top-3 chữ cái thì biến mất.

Nhãn thì đúng là trùng: `HomeTourGrid.astro:27` khai riêng `heading: 'Tour nổi bật'`, `homepage.ts:69` `sections.tours` cùng chuỗi — **hai nguồn một nhãn**.

**Drift phụ, nặng hơn:** `HomeTourGrid` đứng **ngoài** `activeSections`, tức ngoài hợp đồng `06` §5.7 hàng đầu ("Thứ tự và bật/tắt khối do `siteSettings.sections` quyết"). Nó đã đứng ngoài từ `SPEC-2026-08-14`; sau R6 nó thành khối tour **duy nhất**. Xem DR-e.

### 2.8 `HomeHero.astro` là mã chết ôm hai token sống

**v1 khẳng định sai** rằng *"không component nào đọc `--hero-min-h`/`--hero-min-h-mobile`"*. Sự thật: `HomeHero.astro:63` và `:195` đọc cả hai — nhưng `grep -rn "HomeHero" src/` chỉ ra **một** kết quả ngoài chính file, là một dòng chú thích ở `SiteHome.astro:379`. **Không component nào import `HomeHero`.**

Hero trang chủ thật là `.site-home-hero` trong `SiteHome.astro`, hardcode `min-height: 560px` (`:315`) và `520px` (`:541`). Xem DR-c.

---

## 3. Bảy thay đổi

### R1 — Thẻ ngang ở `≤640px`

**R1a — `Card.astro` (chỉ `<style>`).** Dưới 640px `.card` thành lưới `88px 1fr`; `.card-img-wrap` → `width/height: 88px`, `aspect-ratio: 1/1`; `.card-body` cột phải, `padding: var(--s3)`; `.card-title` giữ `--fs-card-title`; `.card-summary` giữ 2 dòng cắt; `.card-meta` giữ `margin-top: auto`.

**R1b — GỠ HÀNG RÀO ĐÈ. Không có bước này thì R1a hỏng im lặng.**

`HomeRollupSection.astro:80-89` và `EntityIndex.astro:265-274` ghi đè `.card` **từ bên ngoài** bằng `:has()` + `:global()`:

```css
.home-card-grid:has(> :last-child:nth-child(1)) :global(.card-img-wrap) {
  height: 100%; min-height: 240px;
}
```

Khối `@media (max-width: 767px)` của chúng (`HomeRollupSection:101-106`, `EntityIndex:293-298`) reset `grid-template-columns: 1fr` và `min-height: 0` — nhưng **không reset `height: 100%`**.

Độ đặc hiệu: luật `:has()` ≈ **(0,5,0)**; luật R1a viết trong `Card.astro` sau khi Astro gắn scope ≈ **(0,2,0)**. Đặc hiệu cao thắng bất kể thứ tự. Hệ quả trên **mọi khối 1 mục** ở ≤640: `grid-template-columns: 1fr` thắng `88px 1fr`, `height: 100%` thắng `height: 88px` → một cột ảnh rộng 88px cao hết thẻ, nằm **trên** phần chữ. Thẻ vỡ hình.

Đây đúng cơ chế **`DR-062`**, và `HomeRollupSection.astro:128-138` đã dán sẵn bài học đó tại chỗ. Bản v1 không nhắc DR-062 lần nào.

**Việc:** trong khối `≤640px` của **cả hai** file, nhắc lại **nguyên** bộ chọn `:has()` và đặt:

```css
.home-card-grid:has(> :last-child:nth-child(1)) :global(.card) {
  grid-template-columns: 88px 1fr;
  align-items: start;              /* KHÔNG bỏ dòng này — xem cảnh báo dưới */
}
.home-card-grid:has(> :last-child:nth-child(1)) :global(.card-img-wrap) {
  height: 88px;                    /* KHÔNG dùng `auto` — xem cảnh báo dưới */
  min-height: 0;
}
```

> ⚠ **Hai cái bẫy, cả hai đều làm R1b tái tạo đúng con bug nó sinh ra để chữa.**
>
> **Bẫy 1 — `height: auto` KHÔNG đủ.** `align-items: stretch` nằm ở luật **gốc, ngoài mọi media query** (`HomeRollupSection.astro:83`, `EntityIndex.astro:268`) nên nó sống nguyên ở ≤640. Một grid item đang `stretch` mà đặt `height: auto` thì **giãn hết chiều cao hàng**, và `aspect-ratio: 1/1` bị bỏ qua vì chiều cao đã thành xác định. Ra đúng cột ảnh 88px cao hết thẻ — y hệt lỗi `height: 100%`, chỉ đổi từ khoá. Phải là **`height: 88px` tường minh**, và reset `align-items` về `start`.
>
> **Bẫy 2 — R1b thắng bằng THỨ TỰ NGUỒN, không phải đặc hiệu.** Nhắc lại nguyên bộ chọn cho ra **hoà** (0,5,0) chứ không thắng. Nó chạy được **chỉ vì** khối `≤640` nằm **sau** khối `≤767` trong cùng file (`HomeRollupSection` :155 sau :100; `EntityIndex` :301 sau :292). **Ràng buộc bắt buộc: khối `≤640` phải đứng SAU khối `≤767`.** Ai sắp xếp lại media query trong hai file này là hỏng lại, im lặng, không cổng nào bắt.

**R1c — phạm vi thật.** Tám file import `Card.astro`, đo bằng `grep -rln "^import Card from" src/`, **giống hệt nhau ở worktree và `origin/main`**:

```
AttractionDetail · EntityIndex · EventIndex · HomeRollupSection
HubIndex · PlaceDetail · TermIndex · TourIndex
```

v1 kê **sai cả hai chiều**: thiếu `AttractionDetail`, `EventIndex`, `PlaceDetail`, `TourIndex`; thừa `NearbySection` — file đó **không import `Card`**, nó tự dựng `.nearby-card` (`NearbySection.astro:33-46`). Nghĩa là sau R1, thẻ "Gần đây" trên mọi trang chi tiết **giữ hình dọc** trong khi mọi thẻ khác thành ngang. Không sửa ở đây (ngoài phạm vi), ghi DR-f.

**Thẩm quyền của R1 — nói cho đúng.** `06:392` Luật 5 cấm bóp cột; `06:395` loại trừ *"lưới thẻ không thuộc luật này"*. R1 **không vi phạm** Luật 5. Nhưng loại trừ cắt hai chiều: nó cũng **không cấp thẩm quyền** cho R1. Căn cứ thật của R1 chỉ là artboard thiết kế — tầng 6/7 của `CLAUDE.md` §1. Đây là quyết định thẩm mỹ của chủ dự án, không phải suy ra từ luật.

**Ước tính:** thẻ ~410px → **~155px** (chiều cao do chữ quyết: tiêu đề 1–2 dòng ~50 + tóm tắt 2 dòng ~46 + meta ~26 + đệm 24). 16 thẻ → **cắt ~4.100px**.

**Khác artboard có chủ ý:** artboard bỏ tóm tắt; spec giữ, vì `HomeRollupSection.astro:34` lọc `card.item.summary` làm điều kiện render.

### R2 — Đảo vai dải màu đậm

**Căn cứ — viết lại hoàn toàn.** Bản v1 viện *"`--c-sand` trên nền sáng chỉ đạt 3,28:1 — dưới AA"*. **Sai.** Số 3,28 là của `--c-text-inverse` **trên** `--c-sand` (`HomeStatsBand.astro:39`), không phải của nút. Nút thật là `--c-sand-text-strong` `#3d2a05` trên `--c-sand` `#F5A623` (`HomeTourGrid.astro:159-160`) = **6,76:1, ĐẠT AA**. Vi phạm mà v1 lấy làm lý do **không tồn tại**.

Căn cứ có hiệu lực: **`07-DESIGN_TOKENS` §1 — "`color.sand` … Không dùng làm nền CTA".** `HomeTourGrid.astro:159` đang đặt sand làm nền một CTA.

Điều này chỏi `SPEC-2026-08-14` §3.3 (*"Nút chính đổi từ `--c-accent` sang `--c-sand` … để nút thôi đụng màu với giá"*, duyệt 2026-08-14). Hai tầng tài liệu mâu thuẫn = `CLAUDE.md` §5 hard stop. **Đã hỏi; chủ dự án chốt `07` thắng** (tầng 2 trên tầng 6). Đánh đổi nhận rõ: nút và nhãn giá lại cùng `--c-accent`, đúng thứ §3.3 muốn tránh.

**Việc (`HomeTourGrid.astro`, `<style>` + chú thích):**

| Bộ chọn | Từ | Sang |
|---|---|---|
| `.home-tours` | `var(--c-band-bg)` | `var(--c-surface-alt)` |
| `.tours-eyebrow` | `--c-sand` | `--c-primary` |
| `.tours-heading` | `--c-band-text` | `--c-primary` |
| `.tours-sub` | `--c-band-muted` | `--c-text-muted` |
| `.tours-all` | `--c-sand` / `--c-sand-text-strong` | `--c-accent` / `--c-text-inverse` |

Sửa luôn chú thích `:9-10` và `:154-155` — hai chú thích đó nêu lý do nay hết hiệu lực.

**Không đụng `.stats-band`.** Cặp `--c-primary` + `--c-text-inverse` đã đo AA cả ba bộ (9,46 / 7,27 / 5,47); `HomeStatsBand.astro:38-39` ghi rõ *"Cấm đổi sang --c-sand"*. Vai dải đậm chuyển hẳn về khối này.

**R2c (Q4) — sửa LÝ DO trong `07-DESIGN_TOKENS` §1, giữ nguyên luật.**

`07` §1 cấm cát làm nền CTA và ghi lý do *"tương phản với chữ trắng không đạt AA"*. Nút thật dùng chữ **tối** (`--c-sand-text-strong`) và đo **6,76:1 — đạt AA**. Tức lý do không với tới ca này, chỉ câu chữ với tới.

Luật **giữ nguyên** (chủ dự án đã chốt `07` thắng). Nhưng phần lý do phải viết lại cho khớp phạm vi: cát không làm nền CTA vì **phân vai màu** — `07` §1 đã giao `--c-accent` cho CTA và nhãn giá, cát cho gạch chân và nút trên nền đậm. Cho cát thêm vai CTA là **một màu hai vai**, đúng thứ bộ luật tồn tại để chặn.

⚠ Đây là sửa **tài liệu tầng 2**, vượt thẩm quyền của một spec bề mặt. Chủ dự án đã ký 2026-08-29 (§9 Q4). Không sửa thì lượt rà sau sẽ đo được 6,76, thấy lý do sai, và đề nghị đảo ngược đúng chỗ này.

⚠ **Hệ quả R2 tự sinh: ba token mồ côi.** `--c-band-bg` / `--c-band-text` / `--c-band-muted` (`tokens.css:43-45`) có **đúng ba người đọc trong toàn `src/`**, cả ba ở `HomeTourGrid.astro:73`, `:92`, `:99` — và R2 thay cả ba. Sau R2 chúng còn **0 người đọc**. §0 điểm 2 cấm đụng `tokens.css` nên không gỡ được trong đợt này. Ghi **DR-k**, nếu không lượt rà sau sẽ bắt được ba token chết do chính spec này tạo ra.

**Bằng chứng tương phản — cổng KHÔNG chứng minh được, phải tính tay.** `scripts/check-theme-contrast.mjs:14` chỉ đọc `src/styles/tokens.css`; bốn cặp ở `:42-47` đối với `c-surface`/`c-primary`/`c-accent`, **không cặp nào chạm `c-surface-alt`** — chính là nền mới. Mà §0 điểm 2 cấm đụng `tokens.css`, nên output của nó sau R2 giống hệt trước R2. Tính tay, ba bộ:

```
primary / surface-alt    bien-sau 8,36 · cat-bien 6,25 · ngoc-lam 4,86  ← sát ngưỡng
text-muted / surface-alt          6,70 ·          6,57 ·          6,73
text-inverse / accent             5,20 ·          4,80 ·          6,01
```

Đều qua AA 4,5. **`ngoc-lam` 4,86 là số cần canh** nếu sau này ai đó chỉnh sắc độ.

### R3 — Một nhịp dọc cho di động

**Chốt `--s6` (32px)** trên/dưới cho mọi **khối cấp trang** ở `≤640px`.

**Định nghĩa "khối cấp trang"** (v1 để trống nên K4 không có tập đếm): mọi phần tử là **con trực tiếp của `<main>`** trên trang chủ đã dựng. Đếm được bằng một dòng JS, không phải bằng cảm nhận.

| # | File | Bộ chọn | `@media` sẵn có | Việc |
|---|---|---|---|---|
| 1 | `Section.astro:40` | `.section` | `:72` ≤768 → `--s5` `:74` | **tách làm hai**: luật đệm chuyển xuống khối `≤640` mới (`--s6`); khối `≤768` giữ lại **chỉ** `.section-title { font-size: --fs-h4 }` (`:77-78`) — đó là luật về chữ, không phải về nhịp |
| 2 | `HomeTourGrid.astro:72` | `.home-tours` | không có ≤640 | **thêm** rule |
| 3 | `HomeStatsBand.astro:40` | `.stats-band` | `:96` ≤640 | thêm padding |
| 4 | `HomeTrustBar.astro:43` | `.why-section` | `:117` ≤767 | thêm padding |
| 5 | `HomePartners.astro:49` | `.partners-section` | `:127` ≤640 | thêm padding |
| 6 | `HomeTestimonials.astro:56` | `.tm-section` | `:154` ≤640 | thêm padding |
| 7 | `HomeGroupQuote.astro:38` | `.gq-section` | `:89` ≤767 | thêm padding |
| 8 | `HomeGuideGrid.astro:77` | `.guide-section` | `:220-222` `--s6 0 --s7` | → `--s6 0` |
| 9 | `HomeDestinationGrid.astro:65` | `.dest-section` | `:169-170` `--s7 0 --s6` | → `--s6 0` |
| 10 | `HomeAreaGrid.astro:62` | `.area-section` | `:181-183` `--s7 0 --s6` | → `--s6 0` |
| 11 | `SiteHome.astro:418`, `:481`, `:516` | `.editorial-section`, `.home-faq-section`, `.home-safety-section` | `:539` ≤640 | thêm padding |
| 12 | **`HomeHubGrid.astro:91`** | **`.hubs-section`** | `:191-193` `--s7 0` | → `--s6 0` |
| 13 | **`HomeBannerGrid.astro:88-89`** | **`.banner-section`** `--s8` | `:179` ≤640 (không chạm padding) | **thêm** — v1 bỏ sót, khối đang sống (`DEFAULT_SECTIONS` có `banners`) |

**`.site-home-inner` KHÔNG nằm trong bảng này** (v1 xếp nó vào, sai chỗ). Đệm bên trong hero không phải nhịp giữa các mục — nó là **kích cỡ hero**, một quyết định thẩm mỹ riêng. Chuyển sang **R5b**.

Dòng 12 của v1 để cột bộ chọn trống bằng chữ "khối ngoài" — file còn có `.hubs-wave-top:82` và `.hubs-wave-bottom:87`, tác nhân sau phải đoán. Đã ghi tên thật.

**MỘT MỐC DUY NHẤT CHO ĐỆM: `≤640px`. Chủ dự án chốt 2026-08-29.**

Trước đó ba mốc lẫn nhau: ≤768 (`Section.astro`), ≤767 (`HomeTrustBar`, `HomeGroupQuote`), ≤640 (còn lại). Hệ quả đo được: ở viewport **700px**, `.section` đã rút còn 24px trong khi `.why-section` vẫn 96px và `.editorial-section` vẫn 64px — lệch nhịp ở đúng khổ máy tính bảng nhỏ và điện thoại xoay ngang. K4 đo ở 390px nên cổng vẫn xanh trong khi mục tiêu hỏng ở 700px.

**Việc thật nhỏ hơn tưởng.** Hai khối ≤767 (`HomeTrustBar:117`, `HomeGroupQuote:89`) **hiện không có luật đệm nào** — chúng chỉ đổi lưới. Nên luật đệm được **thêm mới** ở `≤640`, không phải chuyển từ 767 sang. **Chỉ một file phải sửa khác đi là `Section.astro`** (dòng 1 của bảng): tách khối `≤768` làm hai — đệm xuống `≤640`, cỡ chữ tiêu đề ở lại `≤768`.

**Đánh đổi, nhận rõ:** ở 641–768px mọi `.section` trên **mọi trang** đệm 48px thay vì 24px như hôm nay. Thoáng hơn, không phải lỗi. Đây là chỗ đáng bác nếu thấy tablet đang vừa mắt.

**Giá phải trả:** `Section.astro` 24→32 ăn ra **21 file** (`grep -rln "Section.astro" src/`), tức mọi trang. Cộng ~80px cho trang chủ. Đây là chỗ đáng bác nếu thấy không đáng.

**R3 làm nặng nợ §4.5:** dòng 2 thêm `@media ≤640` vào `HomeTourGrid` vốn đã có ≤900 (`:169`) và ≤600 (`:173`) — ba mốc một file, hai trong đó ngoài thang `07` §4.

### R4 — Đích chạm 44px

`min-height: 44px` + `inline-flex/align-items: center` (link) hoặc đệm dọc (`summary`). **Không đổi cỡ chữ.**

`HomeRollupSection` `.home-view-all` (`:115`) · `HomeAreaGrid`/`HomeGuideGrid`/`HomeDestinationGrid` `.see-all` · `Footer.astro` link điều hướng · `FAQ.astro` và `SiteHome.astro:289-297` `summary` · `Header.astro`/`Footer.astro` `.logo` · `Header.astro:231` `.skip-link`.

⚠ Sửa `summary` ở **cả** `FAQ.astro` lẫn `SiteHome.astro` là hợp thức hoá một bản dựng trùng — `SiteHome` tự dựng `<details>/<summary>` trong khi `FAQ.astro` tồn tại. Ghi DR-g thay vì im lặng.

### R5 — Rút hero trang chủ về 70–76% màn đầu

**Mục tiêu, nói bằng thứ đo được:** hero hiện chiếm **86% màn đầu** (727/844). Khách mở trang không thấy hé gì phía dưới nên không có tín hiệu "còn nữa, cuộn đi". Đích: **70–76%**, chừa một khoảng hé thấy khối kế tiếp.

Cả hai bước dưới đây nằm trong `@media (max-width: 640px)` sẵn có (`SiteHome.astro:539`).

**R5a — cỡ chữ tiêu đề.**

```css
.site-home-title { font-size: var(--fs-h3); }   /* 42px → 32px */
```

Ở 390px, 42px cho ~13 ký tự/dòng nên tiêu đề production ngắt **4 dòng**; 32px cho ~17–18 ký tự/dòng nên còn **3 dòng**. Với `--lh-display` 1,22 thì một dòng 42px cao 51px, một dòng 32px cao 39px: 4×51 = 205px xuống 3×39 = 117px, **cắt ~88px**.

Chọn `--fs-h3` chứ không `--fs-h2` (40px): 40px chỉ bớt ~2px/dòng ở 390px, không đổi số dòng. ⚠ `--fs-section` (`tokens.css:109`) và `--fs-h3` (`:112`) **cùng `2rem`** — hai token một giá trị, hai vai (họ `DR-051`). Dùng `--fs-h3` vì đây là `h1`, không phải tiêu đề mục; v1 biện minh bằng cỡ của `Section.astro` là lẫn hai token.

**R5b — đệm trên của ruột hero.**

```css
.site-home-inner { padding-top: var(--s7); }    /* 96px → 48px */
```

`SiteHome.astro:339` đặt `padding-block: var(--s9)` cho cả trên lẫn dưới; `:545` đã hạ riêng dưới xuống `--s7` ở ≤640, còn trên vẫn 96px. Rút trên về `--s7` cho cân với dưới, **cắt 48px**.

Đây **không** phải luật nhịp dọc của R3 — nó là kích cỡ hero. Xếp riêng để K4 không phải khai ngoại lệ, và để lần sau ai chỉnh hero không phải lần theo bảng nhịp.

**Cộng lại:** 727 − 88 − 48 ≈ **591px ≈ 70% màn đầu**. ⚠ Con số này là **phép tính, chưa phải phép đo** — số dòng của tiêu đề phụ thuộc chuỗi thật trong Sanity. **Phải đo lại trên `dist/` sau khi dựng** (K7 ở §5).

⚠ **Ràng buộc thật sự cai quản số dòng là `max-width: 19ch`, không phải bề rộng khung.** `SiteHome.astro:359` đặt `max-width: 19ch` cho `.site-home-title`. Khung ở 390px rộng **358px** (`BaseLayout.astro` đặt `padding-inline: --s4` = 16px dưới 480px; 390 − 32 = 358 — trùng đúng bề rộng `.card` đo ở §2.2, xác nhận chéo). Vậy:

| Cỡ chữ | `19ch` xấp xỉ | Cái nào trói |
|---|---|---|
| 42px (hôm nay) | ~437px > 358 | **khung** trói |
| 32px (sau R5a) | ~334px < 358 | **`19ch`** trói |

Tức sau R5a hộp chữ hẹp lại thêm ~24px so với giả định "tỷ lệ thuận" của phép tính trên. Kết luận 3 dòng nhiều khả năng vẫn đúng, nhưng **lý lẽ phải neo vào `19ch`**, không vào bề rộng khung.

**Hai ca hỏng, hai cách chữa khác nhau:**
- Hero rơi ngoài dải 70–76% nhưng tiêu đề đã 3 dòng → chỉnh `padding-top`, **không** chỉnh cỡ chữ.
- Tiêu đề **vẫn 4 dòng** ở 32px → chỉnh `max-width` lên 21–22ch, **không** hạ cỡ chữ nữa (dưới 32px là tụt khỏi thang).

**R5c — điều v1 định làm mà nay GỠ.** v1 định nối `.site-home-hero` ≤640 vào token `--hero-min-h-mobile` (360px). Bỏ: token đó thuộc `HomeHero.astro` — mã chết (§2.8) — nối vào sẽ tạo hai vai cho một token. Số cứng `min-height` 560/520 (`SiteHome.astro:315`, `:541`) để nguyên, ghi **DR-c**. Ở di động chúng không quyết chiều cao gì cả: nội dung hero đã cao gấp rưỡi 520px.

### R6 — Gộp hai khối tour làm một

Chủ dự án chốt phương án gộp thật, không phải gỡ.

**R6a — biên tập chọn tour, dữ liệu vẫn lấy từ `allTours`. Sửa gọn trong MỘT file.**

`index.astro` đã có sẵn cả hai đầu: `td` (`:23`, mang `featuredTours`) và `allTours` (`:40`, mang `duration`). Nên phép giao làm ngay tại `:41`, **không thêm prop nào, không sửa `SiteHome.astro:196`, không sửa chữ ký `HomeTourGrid`**:

```ts
const approved = allTours.filter(t => t.slug && t.title)   // truy vấn đã lọc reviewStatus
const chon = (td?.featuredTours ?? [])                     // ?? — KHÔNG bỏ
  .map(f => approved.find(t => t._id === f?._id))           // f?. — KHÔNG bỏ
  .filter(Boolean)                                          // .filter — KHÔNG bỏ
const homeTours = chon.length ? chon.slice(0, 3) : approved.slice(0, 3)
```

> ⚠ **Ba toán tử phòng thủ trên là bắt buộc, không phải cho đẹp.** Bản nháp trước viết `td.featuredTours` trần và **ném lỗi lúc build** ở ba ca có thật:
>
> | Ca | Vì sao có thật |
> |---|---|
> | `td === null` | `index.astro:25-32` **cố ý** cho `td` null đi tiếp — chỉ `console.warn`, không `throw`. `SiteHome.astro:284` cũng dùng `td?.featuredTours?.length`. Viết trần là biến một suy giảm êm thành **build sập** |
> | `featuredTours` vắng hoặc `null` | field khai **tùy**, `cms/schemas/touristDestination.ts:288` không có validation |
> | phần tử `null` trong mảng | GROQ `[]->` trả `null` cho reference chết |

Giữ `.slice(0, 3)` để không đổi bố cục lưới. `homeTourTotal` (`:42`) **giữ nguyên** — nhãn "Xem tất cả N tour" phải là tổng thật, không phải số tour biên tập chọn.

**R6a-bis (Q3) — tách thành hàm thuần, kèm test đơn vị.** Nhánh dự phòng (`featuredTours` rỗng → `slice(0,3)`) **không bao giờ chạy khi dựng** vì dữ liệu thật không rỗng. Nhìn bản dựng rồi tích ô là **pass giả** — đó là lý do K8 đã bị gỡ khỏi bảng K (§5.2).

Việc: đưa phép chọn ra khỏi `index.astro` thành một hàm thuần trong `src/lib/homepage.ts` (nơi đã chứa `entityHref`, `indexHref`), rồi viết test đơn vị. Bộ chạy đã có sẵn: `scripts/package.json` khai `tsx --test synthesis/__tests__/*.test.ts audit/__tests__/*.test.ts validators/__tests__/*.test.ts`; hai test mẫu đang chạy là `validators/__tests__/i20.test.ts` và `i21.test.ts`.

**Bốn ca test bắt buộc** — đúng bốn ca đã làm mã giả bản trước ném lỗi hoặc vỡ bố cục:

| Ca | Kỳ vọng |
|---|---|
| `td = null` | trả `allTours.slice(0,3)`, **không throw** |
| `featuredTours` vắng / `null` / `[]` | trả `allTours.slice(0,3)`, **không throw** |
| `featuredTours` chứa phần tử `null` (ref chết) | bỏ phần tử đó, không throw |
| `featuredTours = [c, a]` | trả `[c, a]` đúng thứ tự biên tập, **không** theo bảng chữ cái |

⚠ Giá phải trả, ghi rõ: R6a từ "~5 dòng trong `index.astro`" thành **một hàm export + một file test**. Vẫn nhỏ, nhưng không còn là sửa một chỗ.

**R6b — gỡ `{ key: 'tours', hidden: false }` khỏi `DEFAULT_SECTIONS`.** Dòng **`SiteHome.astro:142`**.

> ⚠⚠ **Bản v1 ghi `:141`. Dòng `:141` là `{ key: 'stats' }` — dải số liệu, thứ `06` §5.7 gọi là "trụ của trang".** Một tác nhân Code thi hành đúng chữ v1 sẽ xoá nhầm khối đó. Kiểm lại bằng `grep -n "key: 'tours'" src/components/SiteHome.astro` trước khi sửa, đừng tin số dòng trong tài liệu.

**R6c — `duration` không có trong `featuredTours`. Đã chốt cách xử.** `HomeTourGrid.astro:59` render `{tour.duration && …}`. `touristDestination.ts:112` dùng `entityRefFragment` (`fragments.ts:90-98`) trả **`_id, _type, title, slug, summary, mainImage` — không có `duration`**. Guard `&&` nghĩa là dòng thời lượng **biến mất im lặng**, không báo lỗi.

**Chốt: KHÔNG đụng GROQ. Lấy giao của hai danh sách trang chủ đã có.** Chủ dự án chốt 2026-08-29.

`index.astro:40` đã fetch `allToursQuery` và giữ trong `allTours`. Truy vấn đó (`tour.ts:74-85`) trả **`_id, _type, title, slug, summary, mainImage, tourFormat, duration, bookingRef`** — **có `duration`**. `featuredTours` trả `_id`. Hai đầu khớp nhau bằng `_id`, nên chọn tour theo ý biên tập mà vẫn giữ nguyên hình dạng dữ liệu `HomeTourGrid` đang đọc:

```
thứ tự ưu tiên = featuredTours (theo đúng thứ tự biên tập xếp)
  → lấy từ allTours theo _id
  → rỗng thì rơi về allTours.slice(0, 3) như hôm nay
```

Ba cái được, không phải một:

1. **Giữ `duration`** — không mất dòng thời lượng.
2. **Không đụng truy vấn** → không cần `g4`, không cần `contract-checker`, không mở rủi ro hợp đồng dữ liệu. Khoảng 5 dòng TypeScript.
3. **Bịt một lỗ TIỀM ẨN về trạng thái duyệt.** `touristDestination.ts:112` `featuredTours[]->` **không lọc `reviewStatus`**, và `HomeRollupSection.astro:34` chỉ lọc `href && title && summary`. `allTours` đã lọc `reviewStatus == "approved"` (`tour.ts:75`) nên phép giao loại tour nháp đi.

   ⚠ **Nói cho đúng mức: lỗ này ĐANG TIỀM ẨN, chưa chảy.** Nha Trang có trỏ tới một tour nháp (`Tour lái xe địa hình ATV`), nhưng tour đó **cũng chưa có slug**, nên `entityHref` trả `undefined` (`homepage.ts:276`) và bộ lọc `card.href` gạt nó. **Không cổng duyệt nào chặn — chỉ là may.** Biên tập điền slug mà quên đổi trạng thái là tour nháp tự lên trang chủ.

   ⚠ **Và R6c chỉ bịt 1 trong 10 ô.** `touristDestination.ts:108-112` deref **năm** field `featured*` — `featuredAttractions`, `featuredStays`, `featuredExperiences`, `featuredSpecialties`, `featuredTours` — qua cùng `entityRefFragment` không lọc, trên **hai** trang (trang chủ và `TouristDestinationHub.astro:150-167`). R6c đóng ô "tour × trang chủ"; chín ô kia còn nguyên. Xem DR-j và §7.

   ✅ **Đây KHÔNG phải luật tự nghĩ ra — hợp đồng đã khai.** `01-CONTENT_MODEL` §2.1 hàng `featured*`: *"chỉ trỏ entity đã publish"*; `06-BINDING_MAP:155` nhắc lại; I19 định nghĩa publish = `reviewStatus` approved. Khuôn thi hành cũng đã có sẵn trong repo: `event.ts:29` viết `select(organizer->reviewStatus == "approved" => …, null)`. Tức đây là **drift có tên, đóng được**, không phải tính năng mới.

Hai lối đã loại: **(i)** cho `featuredTours` projection riêng có `duration` — được việc nhưng đụng GROQ và không lọc trạng thái duyệt; **(ii)** chấp nhận mất dòng thời lượng — mất thông tin bán hàng khách hỏi đầu tiên.

⚠ **Hệ quả phải kiểm khi thi hành:** tour biên tập chọn nhưng **chưa duyệt** sẽ biến mất khỏi trang chủ thay vì hiện lên. Đúng ý định, nhưng nếu `featuredTours` toàn tour chưa duyệt thì phép giao ra rỗng → phải rơi về `slice(0, 3)`, **không** để khối rỗng.

**R6d — nhãn về một nguồn.** `HomeTourGrid.astro:27` đọc `HOME_COPY[lang].sections.tours` thay vì khai chuỗi riêng. Chạm frontmatter, và `:23` hiện **không destructure `lang`** — phải thêm.

**Không sửa `06` §5.7 ở đây** — ghi DR-a, để chủ dự án chốt ở tầng đặc tả.

**Giới hạn còn lại:** `tours` vẫn trong enum `SECTION_KEYS` (`cms/schemas/siteSettings.ts:21`), biên tập bật lại được khối rollup từ Studio và trùng lặp quay lại. Gỡ khỏi enum là đụng schema, ngoài §0. Ghi §7.

### R7 — Lưới tour co theo số thẻ (Q1)

**File:** `src/components/HomeTourGrid.astro` (chỉ `<style>`)

`HomeTourGrid.astro:104-106` khai `grid-template-columns: repeat(3, 1fr)` và **không có luật `:has()` nào** — grep cả file: **0**. Hôm nay không sao vì `homeTours` luôn bằng `min(3, kho)`. **Sau R6a thì biên tập chạm tới được**: chọn 1 tour là một thẻ nằm trong cột 1/3 bề ngang, hai phần ba còn lại trống. Chính mã của dự án gọi tên hiện tượng này ở `EntityIndex.astro:258-259`: *"một thẻ dọc nằm lẻ loi bên trái, trông như trang lỗi"*.

**Việc: chép khuôn đã có sẵn**, không phát minh gì mới. `HomeRollupSection.astro:76`, `:92`, `:96` đã làm đúng chuyện này:

```css
.tours-grid:has(> :last-child:nth-child(1)) { grid-template-columns: 1fr; }
.tours-grid:has(> :last-child:nth-child(2)) { grid-template-columns: repeat(2, 1fr); }
```

✅ **Rủi ro thấp hơn hẳn R1b.** Hai luật này nằm **trong phạm vi của chính component**, không dùng `:global()`, không với sang file khác — nên **không** dính lớp bẫy đặc hiệu của `DR-062` mà R1b phải xử. Đó là khác biệt đáng ghi: cùng dùng `:has()`, nhưng `:has()` + `:global()` xuyên component mới là chỗ nguy hiểm.

⚠ **Không đo được bằng K1–K7.** Cùng lý do như nhánh dự phòng R6a: dữ liệu thật hiện cho 3 tour, nên bản dựng không có ca 1–2 mục để quan sát. Ca này thuộc **test đơn vị của R6a-bis** (hàm chọn trả 1 phần tử) cộng một lần dựng thử tay với `featuredTours` một mục — ghi rõ thay vì để tưởng đã kiểm.

**Phương án đã loại: bù cho đủ 3 từ `allTours`.** Biên tập chọn 1 tour mà trang hiện 3, hai cái không ai chọn — phá đúng quyền mà R6 vừa trao. Loại.

---

## 4. Phương án đã loại

**4.1 Dựng artboard 1a/1b** — đòi dữ liệu chưa tồn tại (§0 điểm 1).
**4.2 Giữ thẻ dọc, rút ảnh 4:3 → 16:9** — cắt ~1.060px thay vì ~4.100px; trang vẫn ~19.000px.
**4.3 Thẻ ngang chỉ ở trang chủ** — cùng `Card.astro` ra hai hình dạng tuỳ chỗ đứng.
**4.4 Làm sáng `.stats-band` thay vì `.home-tours`** — 350px so với 1.480px; để lại 2.207px xanh liền.
**4.5 Dọn breakpoint trôi** — 480/600/767/900/1023 so với thang 640/768/1024/1280. Xuyên 40+ file, trộn vào đây thì diff không review được. Xem §7.
**4.6 Chỉ đổi nhãn một khối tour** (đủ cho K6, rẻ nhất) — loại vì để lại hai lưới tour cách nhau một dải số liệu, và không giải được chuyện `featuredTours` chỉ có một đường ra.

---

## 5. Cách kiểm — điều kiện mở QA2

> **Bản v1 của mục này hỏng nặng và đã bị kiểm cổng bác.** Ghi lại nguyên trạng để không ai lặp: v1 viện dẫn ba cổng máy như thể chúng canh được thay đổi này. Thực tế **không cổng nào có thẩm quyền trên bề mặt R1–R7**.

### 5.1 Cổng máy — nói đúng cái chúng làm được

| Lệnh | Trạng thái | Canh được gì cho đợt này |
|---|---|---|
| `npm run gate` | ⚠ v1 ghi `npm run gate:all` — **script đó không tồn tại ở `package.json` gốc**, exit 1. Tên đúng là `gate` | Chống hồi quy **nơi khác**. Không canh được bố cục trang chủ. **Đã bao gồm `astro check`** — không phải chạy riêng |
| `npm --prefix scripts run check:theme` | có thật, **mù với R2** | Xem dưới |

**`check:theme` mù với đúng thứ R2 đổi.** `check-theme-contrast.mjs:14` đọc **đúng một file**: `tokens.css`. Bốn cặp ở `:42-47` chỉ dùng `c-text`, `c-surface`, `c-primary`, `c-accent` — **không cặp nào chạm `--c-surface-alt`**, chính là nền mới của R2. Mà §0 điểm 2 cấm đụng `tokens.css`, nên output sau R2 giống hệt trước R2.

Chạy nó để chứng minh **không hồi quy 4 cặp nền/chữ mà nó đọc** — không phải "không hồi quy token" nói chung. Kèm một cảnh báo: ngay cặp `trắng / accent` cũng **không đọc token** — script dùng hằng chuỗi `#FFFFFF` trong khi site render `--c-text-inverse` = `#F8FAFC`.

*Bằng chứng chạy được cho chữ "mù": output của `check:theme` giống hệt **từng chữ số** qua 7 commit, trong đó có một diff **36 dòng vào chính `tokens.css`** — phần đổi là token chiều cao hero, không phải 4 cặp màu nó đọc.*

**Bốn cổng KHÔNG có thẩm quyền trên bố cục trang chủ:**
- `luat1-post` quét mọi `index.html`, nhưng `dist/index.html` có **0** `data-region` và **0** `data-field`. Nên `duLieu` rỗng và **cả tầng A lẫn tầng B đều không chạy** — không riêng tầng B. Nó **không thể đỏ vì trang chủ** dù R6 làm gì.
- `g3` chỉ ánh xạ 12 `*Detail.astro`; `SiteHome`/`HomeTourGrid` ngoài tầm.
- `governance-post` (`:142` `isDetailPage` trả `false` cho `index.html`) và `jsonld-post` (`:90` trả `null`) loại trang chủ có chủ đích.

**Hai cổng CÓ đi qua `dist/index.html`, đừng nói cả `gate:all` bỏ qua trang chủ:**
- `r3-r4-post` — `filePathToUrl()` ánh xạ `index.html` → `/`; trang chủ **bắt buộc** có trong `sitemap-vi.xml` và mang `hreflang` self + `x-default`.
- `geo-knowledge-post` — `htmlPathToUrlPath()` ánh xạ `index.html` → `/`; trang chủ vào diện phủ `ai/index.json`, `entities.json`, `llms.txt`.

Cả hai chỉ phán trên **trục URL / sitemap / hreflang / bề mặt AI**, không phán gì về bố cục. R1–R7 không đổi URL nào nên chúng sẽ xanh — nhưng chúng **có** việc, và nếu R6 vô tình đổi cấu trúc trang thì đây là hai cổng lên tiếng.

**`g4` và `contract-checker` — làm rõ để không nhoè.** R6 không đụng GROQ nên `g4` **không có gì mới để bắt**; nó vẫn chạy trong `npm run gate`, chỉ là không phải bằng chứng cho R6. `contract-checker` **không phải cổng** — nó là subagent, và thứ nó chạy là `npm --prefix scripts run audit:spec`.

**Baseline, đo lại trên nền mới `38866f2` (số không đổi so với nền cũ):** `audit:gate` **46 đạt / 23 trượt / 0 skip**, và **23/23 đúng là GA6** (`control-registry.yaml` khai `gap` cho control đã chạy thật — `DR-022`). `gate:all` **11/11 xanh + 1 `[gap]`** (g2, tắt theo QĐ-2026-08-05-03). `astro check` **0 lỗi / 0 cảnh báo / 45 gợi ý** trên 138 file. Nợ có sẵn, không đổ cho đợt này.

### 5.2 Bảy phép đo K1–K7 — ĐO TAY, không có cổng máy

`grep -rlniE "scrollHeight|getBoundingClientRect|puppeteer|playwright"` trên `scripts/` → **0 file**. Không headless browser trong dependency. `control-registry.yaml` không có control nào khớp homepage/contrast/44/mobile/padding/scroll.

**Bắt buộc:** script đo dán vào `docs/evidence/2026-08-29-thi-giac-di-dong/`, và **cột "Trước" đo lại trên `dist/` dựng tại HEAD nhánh này** — không dùng số production của §2.

> ⚠ **Câu trên là luật KHÔNG CÓ NGƯỜI THI HÀNH, và điều đó đã chứng minh được.** `gate:all` vừa trả 11/11 xanh trên một `dist/` dựng từ nhánh **khác** (`fix-lo-hong-cong`, mtime `08:19`). `GA2` là cổng tươi-cũ **duy nhất** và nó chỉ so mtime `postbuild-status.json` với mtime `dist/index.html` — hai file cũ **cùng nhau** nên nó pass. `grep` `git rev-parse` trong toàn `scripts/validators/` và `gate-audit.ts` → **0 kết quả**.
>
> **Nên evidence phải ghi thứ bác bỏ được:** `git rev-parse HEAD` tại thời điểm dựng, **cộng** mtime `dist/index.html`. Không có hai số đó thì mọi phép đo K1–K7 là vô danh — không ai biết nó đo bản nào.

| # | Đo (viewport 390 × `innerHeight`, `dist/` tại HEAD) | Ngưỡng đạt |
|---|---|---|
| K1 | `documentElement.scrollHeight` trang chủ | ≤ 16.000px |
| K2 | `.card` cao nhất trên **ba trang đặt tên dưới** (bắt R1b) | ≤ 200px |
| K3 | Số `a\|button\|summary` **đang hiển thị** cao < 44px | 0 |
| K4 | Số giá trị `padding-top`/`bottom` phân biệt trên con trực tiếp của `<main>`, **trừ ba ngoại lệ đặt tên dưới** | 1 |
| K5 | `scrollWidth - innerWidth` | 0 |
| K6 | Số `<h2>` trùng chuỗi trên trang chủ | 0 |
| K7 | Chiều cao `.site-home-hero` ÷ `innerHeight` (R5) | 70–76% |

**K2 — ba trang phải đo, đặt tên vì đếm được.** Quét 162 trang đã dựng, đúng **ba** lưới có 1 thẻ:

```
/diem-tham-quan/di-tich-lich-su/   /diem-tham-quan/khu-du-lich-hon-mun/   /tour/vinh-san-ho/
```

⚠ **Cả ba là `.card-grid` (EntityIndex). `home-card-grid` (HomeRollupSection) KHÔNG có lưới 1 mục nào** — histogram nhỏ nhất là 2. Nghĩa là **một nửa R1b — bản vá cho `HomeRollupSection.astro:101-106` — không có trang nào để quan sát.** Nửa đó ship không bằng chứng. Phải khai ra, hoặc dựng một trang mẫu. Không được im lặng rồi tính là đã kiểm.

⚠ Ba trang này do dữ liệu Sanity quyết. Biên tập thêm một mục là K2 mất chỗ đo — ghi lại ngày đo cùng số đo.

**K3 — tập đếm phải khai, nếu không trượt vĩnh viễn.** `Header.astro:405` và `:426` đặt `display: none` ở `@media (max-width: 1023px)`; ở 390px các phần tử đó cao 0, mà `0 < 44` nên đếm mù sẽ luôn trượt. Trang chủ đã dựng có 78 `<a>` + 1 `<button>` + 3 `<summary>` = 82 ứng viên, trong khi cột "Trước" ghi 32 — chênh lệch đó chính là bộ lọc chưa được khai. **Chỉ đếm phần tử đang hiển thị: `offsetParent !== null && getBoundingClientRect().height > 0`.**

**K4 — ngưỡng là 1 nhưng phải trừ ba ngoại lệ có tên.** Bản trước đặt ngưỡng "1, hoặc 2 nếu `.site-home-inner` được khai ngoại lệ" — **sai hai lần**: `.site-home-inner` là **cháu** của `<main>`, không nằm trong tập đo; và tập đo thật chứa ba phần tử đệm 0 mà R3 không chạm. Đo trên `dist/index.html`: `<main>` có **16 con trực tiếp**. Ba cái phải loại đích danh:

| Loại ra | Vì sao |
|---|---|
| `<script>` (con #1) | không phải khối trình bày |
| `section.site-home-hero` (con #2) | **không khai padding** (`SiteHome.astro:313-320`) → computed `0px`. Đệm hero nằm ở `.site-home-inner`, là cháu. R5b sửa chỗ đó |
| `<div>` trần bọc `HomeHubGrid` (con #10) | không có class, đệm 0. `.hubs-section` mà R3 dòng 12 sửa nằm **bên trong** nó |

Trừ ba cái đó thì 13 con còn lại phải cùng một giá trị `32px` → K4 = 1.

⚠ **Bốn dòng bảng R3 không xác nhận được bằng K4.** Grep `dist/index.html`: `.tm-section` **0**, `.gq-section` **0**, `.banner-section` **0**, `.home-safety-section` **0** — bốn khối này bị chặn rỗng nên không render. Sửa chúng không sai (dữ liệu vào là chúng hiện), nhưng cổng **không** xác nhận được. Ghi ra thay vì để người đọc tưởng 13 dòng đều đã kiểm.

**K8 đã bị GỠ khỏi bảng.** Nó không phải phép đo viewport mà là **khẳng định phủ nhánh**: "`featuredTours` rỗng" là điều kiện **dữ liệu**, không quan sát được trên một trang đã dựng. Dữ liệu thật hiện **không rỗng**, nên người dựng sẽ thấy 3 tour, tích K8, mà **chưa bao giờ chạy nhánh dự phòng** — pass giả rõ nhất trong cả bộ. Cách kiểm đúng là một test đơn vị trên hàm chọn của R6a (`npm --prefix scripts test` đã chạy `tsx --test`). Xem câu hỏi mở §9.

---

## 6. Phiếu drift phải mở

| Phiếu | Nội dung |
|---|---|
| **DR-a** | `06` §5.7 khai `tours` trong thứ tự khối mặc định, viết trước khi `SPEC-2026-08-14` §3.4 thêm `HomeTourGrid`. Sau R6 mã và đặc tả lệch. |
| **DR-b1** | R2 đảo `SPEC-2026-08-14` §3.3 (nút `--c-sand` "để thôi đụng màu với giá"). Chủ dự án chốt `07` §1 thắng. |
| **DR-b2** | R2 đảo `SPEC-2026-08-14` §3.4 (*"khối này dùng nền `--c-band-bg`… vừa là khối tour vừa là dải màu đầu tiên"*). |
| **DR-b3** | R2 đảo `ADR-0026` Hệ quả>Được gạch 2 (trạng thái `accepted`, tầng 3 — **trên** spec task). |
| **DR-c** | `HomeHero.astro` **không được file nào import** — mã chết, và là người đọc duy nhất của `--hero-min-h`/`--hero-min-h-mobile`. Chứa `padding: 72px/80px` (`:130-131`) ngoài thang. Gỡ file hay nối lại? Hero trang chủ thật vẫn hardcode 560/520 (`SiteHome.astro:315`, `:541`). |
| **DR-e** | `HomeTourGrid` render ngoài `activeSections` (`SiteHome.astro:196`) nên đứng ngoài hợp đồng `06` §5.7 hàng đầu. Sau R6 nó là khối tour **duy nhất** — biên tập mất quyền tắt/đảo. |
| **DR-f** | `NearbySection.astro:33-46` tự dựng `.nearby-card` thay vì dùng `Card.astro`, trên mọi trang chi tiết. Sau R1 nó là thẻ duy nhất còn hình dọc ở di động. Cùng họ `DR-061`. |
| **DR-g** | `SiteHome.astro:289-297` tự dựng `<details>/<summary>` trong khi `FAQ.astro` tồn tại — bản dựng FAQ thứ hai, N7. |
| **DR-h** | Số cứng ngoài thang khoảng cách: `HomeHubGrid.astro:93` `72px`, `:174` `10px`; `HomeHero.astro:130-131`. `tokens.css:3` tuyên bố *"0 hardcoded value bên ngoài file này"*. |
| **DR-i** | Tracking trái `07` §2: `HomeTourGrid.astro:81` `letter-spacing: 0.12em` (thang khai `--ls-eyebrow` 0,08em, và bắt buộc kèm `--lh-eyebrow`). Cộng 7 chỗ tracking âm trên heading tiếng Việt gồm `Card.astro:134`, `HomeTourGrid.astro:90`, `Section.astro:56`. |
| **DR-j** | **Cả họ `featured*` không lọc `reviewStatus`, không riêng tour.** `touristDestination.ts:108-112` deref **năm** field (`featuredAttractions`, `featuredStays`, `featuredExperiences`, `featuredSpecialties`, `featuredTours`) qua `entityRefFragment` (`fragments.ts:90-98`) không lọc, trên **hai** trang (trang chủ + `TouristDestinationHub.astro:150-167`) = **10 ô**; R6c đóng 1. Hợp đồng ĐÃ khai luật (`01` §2.1 *"chỉ trỏ entity đã publish"*, `06:155`) nên đây là drift, không phải thiếu quyết định. Khuôn thi hành có sẵn: `event.ts:29`, `tour.ts:41` dùng `select(… reviewStatus == "approved" …)`. Lệch ngay trong cùng file: `touristDestination.ts:56` (`homepagePlaces`) và `:78` (`homepageArticles`) **có** lọc. |
| **DR-k** | **R2 tự tạo ba token mồ côi.** `--c-band-bg`/`-text`/`-muted` (`tokens.css:43-45`) có đúng ba người đọc, cả ba ở `HomeTourGrid.astro:73`/`:92`/`:99`, và R2 thay cả ba → còn **0 người đọc**. §0 điểm 2 cấm đụng `tokens.css` nên không gỡ được trong đợt này. Cùng họ DR-c. |
| **DR-l** | **Trang chủ đa ngôn ngữ mất sạch khối tour sau R6b.** `src/pages/[lang]/index.astro:98` render `<SiteHome>` **không truyền** `homeTours`; `SiteHome.astro:34` mặc định `[]`; `HomeTourGrid.astro:33` tự ẩn. R6b gỡ rollup `tours` → homepage `en/zh/ko/ru` còn **0** khối tour. Ngủ yên hôm nay (`langs = ['vi']`, `dist/` không có bốn ngôn ngữ) nhưng `[lang]/index.astro:15` ghi rõ nó *"tự bật lại khi thêm ngôn ngữ"* — **bẫy đã lên cò**. |
| **DR-m** | **Bất biến "reference deref lên bề mặt sống phải trỏ entity đã duyệt" KHÔNG cổng nào kiểm** — và `ADR-0008` Quyết định 4 làm nó **vô hình theo thiết kế**: `validate-constraints.ts:52-54` khai `FULL_CORPUS_VALIDATORS` = `I1, I4, I7, I8, I13, I14, I15, I17, I18, I-FAQ-TYPE` chạy trên toàn corpus **kể cả nháp**. `g1`/`g3`/`g4` cũng không phủ (g3 không parse cột ghi chú, g4 chỉ xét field tồn tại). Mở lại `ADR-0008` là việc tầng ADR, không phải sửa mã. |
| **DR-n** | **`ADR-0026` §Quyết định 4 neo ngưỡng đảo bài vào số tour ĐÃ PUBLISH (`< 3`).** R6 tách rời số publish khỏi số **hiển thị**: kho 30 tour mà biên tập chọn 1 thì trang chủ trông đúng như "catalogue mỏng" ADR-0024 lo, nhưng ngưỡng **không kích hoạt** vì nó đếm kho. Spec này **không sửa ADR** — `CLAUDE.md` §1 xếp ADR ở tầng 3, spec task ở tầng 6. Cái hại thị giác đã được R7 chặn; phiếu này là việc dọn giấy tờ ở tầng ADR. |
| **Ghi vào DR-051** | `--fs-section` và `--fs-h3` cùng `2rem` (`tokens.css:109`, `:112`) — hai vai một giá trị. |

---

## 7. Ngoài phạm vi — nợ ghi lại

1. Breakpoint trôi (§4.5).
2. Enum `sections` trong `cms/schemas/siteSettings.ts:21` vẫn có `tours`.
3. Sáu lưới thẻ gần giống nhau — `06` §5.7 nói trang chủ phải để *"bằng chứng gánh trang, không phải catalogue"*; hôm nay đang là catalogue. Quyết định nội dung, chủ dự án chọn không mở đợt này.
4. Hub bốn cổng (§4.1).
5. `--fw-900` không có mặt chữ thật; `.hubs-title` đang dùng.
6. Số hạng giữa của `clamp` ở `SiteHome.astro:356` chết dưới ~840px; R5 chỉ vá ≤640 nên 641–840px vẫn `h1` 42px.
7. **⚠ LỖI PRODUCTION ĐANG SỐNG, ngoài phạm vi đợt này nhưng nặng hơn mọi mục ở trên.** `containedInPlace` và `mentions` cũng deref không lọc `reviewStatus`, và **ở đó hợp đồng im lặng** nên không đóng được bằng cách viện điều khoản như `featured*`. Đo trên site thật 2026-08-29: **7 trang sống, 5 link vào 404**, cộng JSON-LD trỏ vào URL 404. Xác minh mẫu:

   ```
   /diem-tham-quan/khu-du-lich-kong-forest/  →  href="/dia-danh/hon-ba/"      → 404
   /diem-tham-quan/chua-tu-van-chua-oc/      →  href="/dia-danh/cam-ranh/"    → 404
   /cam-nang/ngam-hoang-hon-nha-trang-.../   →  href="/dia-danh/nui-co-tien/" → 404
   JSON-LD: "containedInPlace":{"@id":"https://tourdao.vn/dia-danh/hon-ba/", ...}
   ```

   Bối cảnh: **67/208** document trong perspective `published` mang `reviewStatus: "draft"`; **2/26** deref có lọc; `cms/schemas/*.ts` có **0** chỗ khai `options.filter` nên ô chọn reference trong Studio vẫn mời biên tập chọn document chưa duyệt. **Cần phiếu riêng và quyết định riêng** (lọc trong GROQ / hiện tên không link / khoá ô chọn) — không nhét vào đợt chữa thị giác này.
8. `HomeTourGrid` vẫn hardcode tiếng Việt ở `COPY.eyebrow`/`sub`/`all` (`:26`, `:28`, `:29`); R6d chỉ nối `heading` về `HOME_COPY`. Liên đới DR-069.

---

## 8. Kết quả dự kiến

| | Trước (production, chờ đo lại trên `dist/`) | Sau |
|---|---|---|
| Chiều cao trang chủ @390px | 19.977px | ~15.200px (−24%) |
| `.card` cao nhất | 447px | ~155px |
| **Hero ÷ màn đầu** | **727px = 86%** | **~591px ≈ 70%** |
| Dải xanh liền | ~2.000px | ~950px (hero), rồi đứt |
| Nhịp dọc di động | 5 giá trị | 1 (32px), một mốc `≤640` |
| Đích chạm < 44px | 32 | 0 |
| `<h2>` trùng chuỗi | 1 cặp | 0 |
| Tour trang chủ do ai chọn | máy (bảng chữ cái) | **biên tập**, rơi về máy khi trống |
| Tour chưa duyệt lọt trang chủ | có thể (tiềm ẩn) | không — **1 trong 10 ô**, xem DR-j |
| Token mới thêm · truy vấn GROQ bị đụng | — | **0 · 0** |
| File tài liệu tầng 2 phải sửa | — | **1** (`07` §1, chỉ phần lý do — R2c) |
| Test đơn vị phải viết | — | **1 file, 4 ca** (R6a-bis) |
| Phiếu drift phải mở | — | **15** |

**Mọi số cột "Sau" là phép tính, chưa phải phép đo.** K1–K7 ở §5 là chỗ chúng được xác nhận hoặc bị bác — và §5.2 nói rõ **bốn** phép đo đó có giới hạn phải khai trước khi dùng làm bằng chứng.

---

## 9. Bốn câu đã quyết — chủ dự án chốt 2026-08-29

Bốn câu do QA nội bộ nêu ở lượt review v2, nay đã có quyết định. Nội dung đã gộp vào các mục tương ứng; giữ mục này làm bản ghi quyết định.

| Câu | Chốt | Gộp vào |
|---|---|---|
| **Q1** — biên tập chọn 1–2 tour thì lưới 3 cột để thẻ lẻ loi | **Lưới co theo số thẻ.** Chép khuôn `:has()` đã có ở `HomeRollupSection.astro:76`/`:92`/`:96` sang `HomeTourGrid` | **R7** (mới) |
| **Q2** — `ADR-0026` neo ngưỡng vào số tour trong kho, R6 tách kho khỏi số hiện | **Chỉ ghi phiếu drift, KHÔNG sửa ADR ở đây.** `CLAUDE.md` §1: ADR là tầng 3, spec task là tầng 6 — spec không được sửa ADR | **DR-n** |
| **Q3** — nhánh dự phòng của R6a không bao giờ được chạy khi dựng | **Tách hàm thuần + test đơn vị.** Bộ chạy đã có: `scripts/package.json` khai `tsx --test` trên ba thư mục | **R6a** |
| **Q4** — `07` §1 cấm cát làm nền CTA bằng một lý do không với tới nút này | **Giữ luật, sửa lý do.** Lý do thật là **phân vai màu**, không phải tương phản | **R2c** (mới) |
