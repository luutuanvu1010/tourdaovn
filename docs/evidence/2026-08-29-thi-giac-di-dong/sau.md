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
  Đây đều là thẻ `<a>` không có class (hoặc `map-card-link`), có khả năng là breadcrumb/liên kết trong nội dung, không phải đối tượng của R3 — không suy đoán nguyên nhân ở đây, chỉ ghi số đo. **Cam kết "K3 32 → 0" trong tóm tắt đợt chỉ áp cho trang chủ** (khớp `truoc.md` dòng trang chủ = 32, và bảng đối chiếu Bước 4 của brief chỉ có một dòng K3 cho trang chủ) — ba trang lưới 1 thẻ có K3 riêng, không nằm trong cam kết đó và trước đây đã khác 0 (24/27/24 ở `truoc.md`).
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

## Câu hỏi mở cần quyết định ở đúng tầng — KHÔNG tự chọn một bên

Tin nhắn giao việc cho Task 9 nói có **bảy** phiếu drift ghi bằng nhãn chữ cái cần đổi số: `DR-a, DR-e, DR-n, DR-b1, DR-b2, DR-b3, DR-k`. Nhưng cả `task-9-brief.md` (Bước 5a) lẫn `docs/plans/2026-08-29-thi-giac-di-dong.md` (dòng 978–986, hai tài liệu khớp nhau) chỉ đổi số **ba** phiếu: `DR-a → DR-078`, `DR-e → DR-079`, `DR-n → DR-080`. Không tài liệu kế hoạch nào cấp số cho `DR-b1`, `DR-b2`, `DR-b3`, `DR-k` — và nếu chúng cần số, dải `DR-081…088` đã bị Bước 5 dùng hết cho `DR-c/f/g/h/i/j/l/m`, nên không có dải trống nào để gán.

Task này **giữ nguyên** `DR-b1`, `DR-b2`, `DR-b3`, `DR-k` với nhãn chữ cái như hiện có trong `DRIFT_LOG.md` (dòng ~1933–1973) — đây là lựa chọn an toàn, không phá huỷ gì, và khớp với văn bản kế hoạch cụ thể duy nhất đang có. Nhưng bốn phiếu này tiếp tục vi phạm quy ước `DR-<số>` mà chính `DRIFT_LOG.md` dòng 7 tự khai. **Cần chủ dự án xác nhận:** có đổi số bốn phiếu này không, và nếu có thì đổi thành số nào (dải mới, không đụng `081–088` đã cấp)?

## Ba cổng máy

| Cổng | Kỳ vọng | Đo được |
|---|---|---|
| `npm run gate` | 11/11 xanh + 1 `[gap]` (g2) | **11/11 `[pass]` + 1 `[gap]` (g2, QĐ-2026-08-05-03, nợ ND-001)** ✅ |
| `npm --prefix scripts test` | `# fail 0`, 211 ca | **`# tests 211`, `# pass 211`, `# fail 0`** ✅ |
| `npm --prefix scripts run audit:gate` | 46 đạt / 23 trượt, cả 23 là GA6 | **46 đạt, 23 trượt, 0 không kiểm được — toàn bộ 23 trượt đều thuộc nhóm `GA6/*`** (bằng chứng: `docs/evidence/2026-08-29-gate-auditor/report.json`) ✅ |
