# Số sau — sau R1–R7 (Task 9)

- **HEAD lúc dựng:** `b2a88e5a16307f06a37880024113ff67faedf8d1`
- **mtime `dist/index.html`:** `2026-08-29 13:55:58`
- **Ngày đo:** 2026-08-29
- **Cách đo:** `do.js` cùng thư mục, y hệt lần đo nền (xác nhận `git diff 605f5bb -- docs/evidence/2026-08-29-thi-giac-di-dong/do.js` rỗng), chạy trong Chrome, iframe 390×844. Phục vụ `dist/` bằng `cd dist && python3 -m http.server 4321` — cùng cách Task 1 dùng, không dùng `npm run preview` (không chạy được với adapter Cloudflare) và không dùng `wrangler dev` (tự dựng lại `dist/`, làm sai mtime).

| Trang | K1 cao | K2 thẻ cao nhất | K3 đích chạm <44 | K4 giá trị đệm | K5 tràn | K6 h2 trùng | K7 hero % |
|---|---|---|---|---|---|---|---|
| `/` | 14941 | 139 (12 thẻ) | 0 | 32px | 0 | (không) | 70.1 |
| `/diem-tham-quan/di-tich-lich-su/` | 2277 | 114 (1 thẻ) | 2 | 0px, 24px, 48px | 0 | (không) | (không có hero) |
| `/diem-tham-quan/khu-du-lich-hon-mun/` | 9383 | 165 (1 thẻ) | 5 | 0px, 12px, 16px, 24px, 32px, 48px | 0 | (không) | (không có hero) |
| `/tour/vinh-san-ho/` | 2311 | 216 (1 thẻ) | 2 | 0px, 24px, 48px | 0 | (không) | (không có hero) |

**Ghi chú số liệu — quan sát thô, không phải phán quyết pass/fail:**
- K3 trên ba trang lưới 1 thẻ KHÔNG về 0 (2, 5, 2). Chi tiết từng phần tử:
  `di-tich-lich-su`: `["a. h=25","a. h=25"]`;
  `khu-du-lich-hon-mun`: `["a. h=25","a. h=25","a. h=25","a. h=25","a.map-card-link h=25"]`;
  `vinh-san-ho`: `["a. h=25","a. h=25"]`.

  **Danh tính đã xác nhận bằng đọc mã, không suy đoán:** thẻ `<a>` không class là `<Breadcrumb>` (`src/components/Breadcrumb.astro:84`: `<a href={crumb.href}>{crumb.label}</a>`, CSS `.breadcrumb-item a` ở `:125-128` không khai `min-height`). `a.map-card-link` là link "Mở bản đồ" (`AttractionDetail.astro:171`, CSS `.map-card-link` ở `:184-192` cũng không khai `min-height`).

  **Đây KHÔNG phải một lời hứa của R4 bị bỏ sót.** Đối chiếu `docs/plans/2026-08-29-thi-giac-di-dong.md` dòng 42-49 (bảng file bị đụng theo Task) và Task 7 (dòng 772-830): danh sách file R4 sửa là `HomeRollupSection.astro`, `HomeAreaGrid/HomeGuideGrid/HomeDestinationGrid.astro`, `Footer.astro`, `FAQ.astro`, `SiteHome.astro`, `Header.astro` — **`Breadcrumb.astro` và `AttractionDetail.astro`/`PlaceDetail.astro` không có mặt**, và Bước 1 của Task 7 tự giới hạn phạm vi bằng chính lệnh đo (`Chạy await __do('/')` — chỉ trang chủ). "32 đích chạm" ở §2.5 spec cũng toàn là thành phần trang chủ (`.home-view-all`, `.see-all`, footer nav, `summary` FAQ, `.logo`, `.skip-link`). Không `core-specs/` hay `adr/` nào khai một hợp đồng "44px trên mọi trang" (`grep -rln "44px" docs/core-specs/ docs/adr/` → 0 kết quả) — nên đây không phải drift theo định nghĩa của `DRIFT_LOG.md` dòng 3 (đặc tả và sản phẩm không khớp), mà là một **khoảng trống chưa từng được đặc tả nhắm tới**, có khả năng lặp lại trên mọi trang chi tiết entity khác (không chỉ ba trang đo ở đây, vì `Breadcrumb`/`.map-card-link` dùng chung).

  **Cam kết "K3 32 → 0" trong tóm tắt đợt chỉ áp cho trang chủ** (khớp `truoc.md` dòng trang chủ = 32, khớp §8 "Kết quả dự kiến" của spec dùng đúng số 32, và mọi dòng khác trong bảng đối chiếu Bước 4 của Task 9 — trừ K2 được gắn nhãn rõ — đều là số riêng của trang chủ). **Chủ dự án xác nhận (vòng sửa 1): phán quyết đúng là K3 có phạm vi trang chủ — K3 = 0 trên trang chủ là ĐẠT, không phải nửa vời.** Ba trang lưới 1 thẻ có K3 riêng, không nằm trong cam kết đó và trước đây đã khác 0 (24/27/24 ở `truoc.md`), nay còn 2/5/2 — phát hiện này nay có phiếu riêng, **`DR-094`** trong `docs/DRIFT_LOG.md`, để không chết trong báo cáo.
- K6 (h2 trùng): trang chủ hết trùng ("Tour nổi bật" ở `truoc.md` nay chỉ còn 0 h2 trùng). Ba trang lưới 1 thẻ tiếp tục không có h2 trùng, như `truoc.md`.
- K7 (hero %): chỉ trang chủ có `.site-home-hero`; ba trang còn lại trả `null`, đúng như `truoc.md`.

## Hai phép đo ngoài `do.js` (đo riêng, không sửa `do.js`)

**K2b — `getComputedStyle(...).height` của `.card-img-wrap`, ba trang lưới 1 thẻ:**

| Trang | `.card-img-wrap` height |
|---|---|
| `/diem-tham-quan/di-tich-lich-su/` | `88px` |
| `/diem-tham-quan/khu-du-lich-hon-mun/` | `88px` |
| `/tour/vinh-san-ho/` | `88px` |

Cả ba **đúng 88px** — đạt ngưỡng R1b sắc bén. (Trang chủ, ngoài yêu cầu đo, cũng có 12/12 `.card-img-wrap` = 88px — không phải bằng chứng cho `home-card-grid` 1-mục vì lưới ở đó không có mục đơn, xem giới hạn 1 dưới đây.)

**Đệm ngang `.site-home-inner` (viewport 390px, trang chủ):**

```json
{ "paddingLeft": "16px", "paddingRight": "16px" }
```

Khác 0, đúng kỳ vọng 16px ở khổ ≤480px. Đệm ngang của `.container` không bị đè mất bởi shorthand `padding`. (Số này khớp với phép kiểm bẫy 1 mà Task 8 đã đo cùng giá trị 16px/16px trên bản dựng của nó — nay đo lại độc lập trên bản dựng cuối, cùng kết quả.)

## Bảng đối chiếu Trước/Sau

| # | Đo | Trước | Sau | Ngưỡng | Đạt? |
|---|---|---|---|---|---|
| K1 | cao trang chủ @390 | 20242 | **14941** | ≤16.000 | ✅ |
| K2 | thẻ cao nhất (3 trang 1-mục) | 462 | **216** | ≤220 (R-08) | ✅ (sát ngưỡng, dư 4px) |
| K2b | `.card-img-wrap` computed height (3 trang 1-mục) | — | **88px cả ba** | đúng 88px | ✅ |
| K3 | đích chạm <44 đang hiển thị (trang chủ) | 32 | **0** | 0 | ✅ |
| K4 | giá trị đệm phân biệt (trang chủ) | 5 (`24,32,48,64,96px`) | **1 (`32px`)** | 1 | ✅ |
| K5 | tràn ngang (cả 4 trang) | 0 | **0** | 0 | ✅ |
| K6 | `<h2>` trùng chuỗi (trang chủ) | 1 cặp ("Tour nổi bật") | **0** | 0 | ✅ |
| K7 | hero ÷ màn đầu (trang chủ) | 86.2% | **70.1%** | 70–76% | ✅ (sát mép dưới) |
| — | Đệm ngang `.site-home-inner` (trang chủ, 390px) | — | **16px / 16px** | khác 0 | ✅ |

**Ghi chú số K1 "Trước":** brief Task 9, bảng mẫu ở Bước 4, gõ sẵn `19977` cho ô "Trước" của K1 — số này **không khớp** `truoc.md` (20242) lẫn tóm tắt đầu nhiệm vụ ("K1 20.242 → ~15.076"). Dùng `truoc.md` làm số nền theo đúng chỉ định của brief ("Số nền để đối chiếu nằm ở `truoc.md`"), không dùng số gõ tay trong bảng mẫu — ghi lại chênh lệch này để không im lặng bỏ qua.

## Ba giới hạn bắt buộc — không im lặng cho đẹp

1. **Nửa R1b không có bằng chứng.** Ba trang có lưới 1 thẻ đo K2b ở trên đều là `.card-grid` (EntityIndex). `home-card-grid` (dựng bởi `HomeRollupSection.astro`) hôm nay có ba lưới trên trang chủ với **3, 5, 4** mục — **không lưới nào có đúng 1 mục** (đo trực tiếp bằng `document.querySelectorAll('[class*="card-grid"]')` trên `dist/` build tại HEAD `b2a88e5`). Vì vậy bản vá R1b áp cho `HomeRollupSection.astro` không có trang nào trên dữ liệu thật hiện nay để quan sát hành vi 1-mục của nó.
2. **Bốn khối của R3 không xác nhận được.** `.tm-section`, `.gq-section`, `.banner-section`, `.home-safety-section` đo được **0 lần xuất hiện** trên trang chủ hôm nay (đếm trực tiếp bằng `querySelectorAll` trên cùng bản dựng). R3 không được K1–K7 hay bất kỳ phép đo nào ở đây xác nhận cho bốn khối này.
3. **Nhánh dự phòng của R6a không chạy khi dựng.** Dữ liệu thật (63 tour trong dataset) không rỗng nên nhánh dự phòng của hàm chọn tour không có cơ hội chạy trên `dist/`. Nó được canh bằng 6 ca test đơn vị của Task 2 (nằm trong 211 ca `npm --prefix scripts test` xanh), không bằng phép đo trên trang thật.

## Câu hỏi mở — ĐÃ TRẢ LỜI ở vòng sửa 1

Bản đầu của `sau.md` nêu câu hỏi mở: brief chỉ cấp số cho ba phiếu chữ cái (`DR-a/e/n → 078-080`), không cấp số cho bốn phiếu còn lại (`DR-b1/b2/b3/k`), và dải `081-088` đã dùng hết nên không có chỗ tự đoán số. Đã báo lên thay vì tự chọn một bên.

**Chủ dự án xác nhận (vòng sửa 1, R-12):** đây là lỗ trong kế hoạch (quên bốn phiếu này khi cấp dải số) — không phải quyết định có chủ ý để giữ nhãn chữ cái. Đã cấp số:

| Đang là | Đổi thành |
|---|---|
| `DR-b1` | `DR-090` |
| `DR-b2` | `DR-091` |
| `DR-b3` | `DR-092` |
| `DR-k` | `DR-093` |

Đã đổi tại chỗ trong `DRIFT_LOG.md`, giữ nguyên nội dung, mỗi phiếu thêm dòng `Nhãn nội bộ trong SPEC-2026-08-29: DR-b1` (tương ứng). Xác nhận `docs/DRIFT_LOG.md` không còn nhãn chữ cái nào: `grep -oE "^## DR-[0-9a-z]+" docs/DRIFT_LOG.md | grep -v "DR-[0-9]"` → rỗng.

**Phiếu mới, R-13:** phát hiện K3 trên ba trang lưới 1 thẻ (xem ghi chú số liệu K3 ở trên) nay có phiếu riêng — **`DR-094`** — theo đúng phán quyết của chủ dự án: K3 có phạm vi trang chủ (mốc "32 → 0" đạt, không phải nửa vời), nhưng phát hiện breadcrumb/`.map-card-link` dưới 44px trên trang chi tiết là thật và đáng có phiếu để không chết trong báo cáo.

## Ba cổng máy

| Cổng | Kỳ vọng | Đo được |
|---|---|---|
| `npm run gate` | 11/11 xanh + 1 `[gap]` (g2) | **11/11 `[pass]` + 1 `[gap]` (g2, QĐ-2026-08-05-03, nợ ND-001)** ✅ |
| `npm --prefix scripts test` | `# fail 0`, 211 ca | **`# tests 211`, `# pass 211`, `# fail 0`** ✅ |
| `npm --prefix scripts run audit:gate` | 46 đạt / 23 trượt, cả 23 là GA6 | **46 đạt, 23 trượt, 0 không kiểm được — toàn bộ 23 trượt đều thuộc nhóm `GA6/*`** ✅ (lệnh trên tự ghi `docs/evidence/2026-08-29-gate-auditor/report.json` mỗi lần chạy — file này **không nằm trong phạm vi commit** của Task 9 theo brief Bước 7, nên không dẫn nó làm bằng chứng cố định; số liệu tái lập được bằng cách chạy lại đúng lệnh trên `dist/` tại HEAD `b2a88e5`) |
