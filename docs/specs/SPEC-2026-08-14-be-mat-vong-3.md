# SPEC — Bề mặt vòng 3: bộ chữ, phân cấp, màu, và tour trên trang chủ

- **Trạng thái:** thiết kế đã được chủ dự án duyệt 2026-08-14 qua bốn màn hình so sánh trực quan.
- **Ngày soạn:** 2026-08-14   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa hai chiều ở phần token (bộ chữ, cỡ, độ đậm, màu — revert bằng một
  commit). **Cửa một chiều ở phần bố cục**: đưa tour lên trang chủ đảo tiền đề của ADR-0024.
- **Supersedes:** `ADR-0024` mục "trang chủ để bằng chứng gánh, không phải catalogue" — cần
  một ADR mới, **không sửa ADR-0024** (nó đã accepted, `STACK-S25-CI` chặn sửa).
- **Repo lúc soạn:** `main` tại `cc38f16`

---

## 1. Bốn vấn đề chủ dự án nêu

1. Chữ đều đều, không phân cấp
2. Phông chữ không hợp ngành
3. Màu nhạt, thiếu điểm nhấn
4. Nhìn không ra công ty du lịch

Ba cái đầu sửa bằng token. Cái thứ tư **không sửa bằng token được** — chẩn đoán ở §2.4.

## 2. Chẩn đoán — bốn dữ kiện đo được, không phải cảm nhận

**2.1 Bộ chữ đã tải nhưng chưa bao giờ hiện ra.** `public/fonts/` có bốn file Be Vietnam Pro
(700, 800, hai bộ ký tự). Nhưng `tokens.css:57-58` đặt:

```css
--font-display: "Nunito", "Be Vietnam Pro", system-ui, sans-serif;
--font-ui:      "Nunito", "Be Vietnam Pro", system-ui, sans-serif;
```

Nunito đứng trước ở **cả hai** biến, nên trình duyệt không bao giờ dùng tới Be Vietnam Pro.
Site đang trả băng thông cho font không dùng.

**2.2 Thang cỡ chữ dồn cục ở khoảng giữa.** `--fs-base` 17px · `--fs-card-title` 18px ·
`--fs-nav` 18px · `--fs-h5` 20px. Bốn bậc nằm trong 3px, nên mắt không phân biệt được cấp.

**2.3 Nền trang và nền khối gần như trùng nhau.** `--c-surface` `#FFFFFF` và
`--c-surface-alt` `#F8FAFC` lệch nhau khoảng 4% độ sáng. Cả trang đọc thành một mảng trắng
liền, không có ranh giới giữa các mục. Vấn đề là **diện tích màu**, không phải thiếu màu.

**2.4 Trang chủ không có khối tour nào.** Thứ tự chín khối hiện tại, đọc từ `dist/index.html`:

```
Hero → Vì sao chọn Tour Đảo → Cẩm nang bản địa → Trải nghiệm nổi bật → Bắt đầu từ đâu?
→ Điểm tham quan nổi bật → Các khu vực nên biết → Tổng quan về Nha Trang → Câu hỏi thường gặp
```

Không khối nào bán tour. Khách vào trang chủ của một công ty bán tour biển đảo phải bấm menu
mới thấy sản phẩm. Đây là hệ quả **có chủ ý** của ADR-0024, quyết khi kho chỉ có **1 tour**.
Nay có **7 tour** — tiền đề của quyết định đó không còn đúng.

## 3. Quyết định

### 3.1 Bộ chữ — Be Vietnam Pro cho tiêu đề, Nunito cho nội dung

```css
--font-display: "Be Vietnam Pro", "Nunito", system-ui, sans-serif;
--font-ui:      "Nunito", "Be Vietnam Pro", system-ui, sans-serif;
```

Chỉ đảo thứ tự ở `--font-display`. **Không tải thêm file nào** — file đã nằm sẵn trong repo.

**Ràng buộc phải kiểm:** `public/fonts/` chỉ có Be Vietnam Pro cấp **700 và 800**.
`tokens.css:203-206` đặt `h1,h2,h3 { font-weight: var(--fw-700) }` và `h4` cũng `--fw-700`,
nên hai cấp này đủ. Nhưng nếu có component nào đặt tiêu đề ở 500/600/900, trình duyệt sẽ
**tổng hợp giả** cấp đó và chữ sẽ méo. Phải rà toàn bộ và, nếu có, kéo về 700 hoặc 800.

### 3.2 Phân cấp — giãn khoảng giữa

| Token | Hiện tại | Mới | Dùng ở |
|---|---|---|---|
| `--fs-section` | 28px | **32px** | tiêu đề mục (`Section.astro`, `HomeAreaGrid`, `HomeGuideGrid`) |
| `--fs-card-title` | 18px | **21px** | tiêu đề thẻ |
| `--fs-sm` | 15px | **14px** | dòng phụ trong thẻ |
| `--fs-base` | 17px | 17px — **không đổi** | nội dung |

Độ đậm: tiêu đề mục lên `--fw-800`, tiêu đề thẻ giữ `--fw-700`, **giá lên `--fw-800` và cỡ
23px** để bật ngang tiêu đề thẻ. Tiêu đề mục thêm `letter-spacing: -0.015em`.

Không đổi `--fs-base`: 17px đang đọc tốt, và đổi nó sẽ kéo theo toàn bộ chiều cao dòng.

### 3.3 Màu — giữ nguyên mọi mã màu, tăng diện tích

**Không thêm và không đổi một mã hex nào.** Thay đổi là cách dùng:

- Khối quan trọng lấy nền `--c-primary` (`#0C4A6E`) thay vì `--c-surface-alt`. Thẻ trắng nổi
  lên trên nền đó. Trang có nhịp trắng – xanh – trắng.
- Nút chính đổi từ `--c-accent` (`#C0392B`) sang `--c-sand` (`#F5A623`) với chữ
  `--c-sand-text-strong` (`#3d2a05`), để nút thôi đụng màu với giá.
- Giá giữ `--c-accent`.

Thêm ba token **tổ hợp** trỏ về màu sẵn có, không phải màu mới:
`--c-band-bg: var(--c-primary)` · `--c-band-text: #FFFFFF` · `--c-band-muted: #c5dcea`.

**Bắt buộc chạy `npm run check:theme`** trước khi chốt — kho có sẵn bộ kiểm tương phản
chữ/nền. Cặp `#F5A623` trên nền `#3d2a05` và `#c5dcea` trên `#0C4A6E` phải đạt ngưỡng.

### 3.4 Bố cục — chèn một khối "Tour nổi bật" ngay dưới hero

**Thêm đúng một khối. Không xoá khối nào, không đảo thứ tự khối nào.**

```
Hero → [Tour nổi bật — MỚI] → Vì sao chọn Tour Đảo → ... (bảy khối còn lại giữ nguyên)
```

- Component mới `HomeTourGrid.astro`, lưới 3 thẻ + link "Xem tất cả 7 tour" → `/tour/`.
- Dữ liệu: `allToursQuery(lang)` — **đúng truy vấn mà trang `/tour/` đang dùng**
  (`RouteDispatch.astro:325`), cắt còn 3 mục đầu. Không viết truy vấn mới.
- `src/pages/index.astro` fetch thêm danh sách này và truyền vào `SiteHome.astro` qua một
  prop mới; `SiteHome` render `HomeTourGrid` ngay sau hero.
- Hero thêm nút phụ "Xem tour" cạnh nút Zalo.
- Khối này dùng nền `--c-band-bg` của §3.3 — nó vừa là khối tour vừa là dải màu đầu tiên.

**Khi không có tour nào:** khối tự ẩn hoàn toàn, không render tiêu đề rỗng. Cùng lối phòng
thủ mà mục `zalo` đang dùng — không có nút chết, không có mục rỗng.

### 3.5 ADR mới thay ADR-0024

Ghi một ADR ghi rõ: tiền đề "catalogue mỏng" của ADR-0024 đã hết hiệu lực khi kho đạt 7 tour;
trang chủ nay gánh **cả** bằng chứng lẫn sản phẩm. Nêu ngưỡng số để lần sau không phải cãi
lại bằng cảm tính. **Không sửa ADR-0024.**

## 4. Phương án đã loại

| Phương án | Loại vì |
|---|---|
| Be Vietnam Pro cho **cả** tiêu đề lẫn nội dung | Repo chỉ có cấp 700/800; phải tải thêm hai file cho cấp 400/500 |
| Bộ chữ mới hoàn toàn (Plus Jakarta Sans) | Thêm bộ chữ thứ ba, phải tự lưu trữ, phải soi kỹ dấu tiếng Việt ở cỡ nhỏ |
| Tương phản kiểu tạp chí (mục 42px, thẻ 24px) | Tên tour dài như "Tour Đảo Khỉ Suối Hoa Lan" sẽ ngắt 3 dòng trên di động — nơi phần lớn khách đặt tour |
| Đổi trục màu sang xanh ngọc + cam nắng | Phải sửa nhiều mã trong `tokens.css` và rà lại mọi thứ gắn với navy, kể cả chân trang và huy hiệu |
| Bày lại trọn trang chủ theo mạch bán hàng | Đảo thứ tự sáu khối và gộp hai khối → phải cập nhật `06-BINDING_MAP` và soi lại từng khối. Để dành vòng sau nếu vòng này chưa đủ |

## 5. Phạm vi thay đổi

| File | Sửa |
|---|---|
| `src/styles/tokens.css` | đảo `--font-display`; `--fs-section` 28→32; `--fs-card-title` 18→21; `--fs-sm` 15→14; thêm 3 token dải màu |
| `src/components/Section.astro` và các `Home*.astro` dùng `--fs-section` | tiêu đề mục lên `--fw-800` + `letter-spacing` |
| component hiển thị giá | giá lên `--fw-800`, cỡ 23px |
| nút chính (CTA) | đổi sang `--c-sand` + `--c-sand-text-strong` |
| `src/components/HomeTourGrid.astro` | **tạo mới** |
| `src/pages/index.astro` | fetch `allToursQuery`, cắt 3, truyền prop |
| `src/components/SiteHome.astro` | nhận prop, render `HomeTourGrid` sau hero; hero thêm nút "Xem tour" |
| `docs/adr/ADR-00xx-*.md` | **tạo mới**, thay tiền đề của ADR-0024 |
| `docs/adr/README.md` | thêm dòng mục lục |

## 6. Nghiệm thu

| Kiểm | Ngưỡng đạt |
|---|---|
| `npx astro build` | exit 0, không dòng `[ERROR]` |
| `npx astro check` | 0 errors, 0 warnings |
| `npm run check:theme` | đạt, không cặp màu nào dưới ngưỡng |
| Tiêu đề trang chủ render bằng Be Vietnam Pro | `--font-display` bắt đầu bằng `"Be Vietnam Pro"` |
| Không tiêu đề nào đặt ở cấp đậm ngoài 700/800 | 0 trường hợp |
| `dist/index.html` có khối tour | có, 3 thẻ, link `/tour/` |
| Khối tour đứng ngay sau hero | đúng vị trí, trước "Vì sao chọn Tour Đảo" |
| Tám khối cũ còn nguyên và đúng thứ tự | 8/8 |
| Không tải thêm file font nào | `public/fonts/` không đổi |

## 7. Ngoài phạm vi

- Bày lại trọn trang chủ (phương án C) — để dành vòng sau nếu vòng này chưa đủ.
- Bố cục trang danh sách và trang chi tiết — vòng này chỉ chạm trang chủ và token toàn cục.
- Nợ R3 hai URL tour Hòn Tằm — chủ dự án đã quyết bỏ qua 2026-08-14.
