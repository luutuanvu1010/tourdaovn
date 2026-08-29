# Số nền — trước R1–R7

- **HEAD lúc dựng:** `78151e2ff6382e3d2f50207b6b054eb3a6612613`
- **mtime `dist/index.html`:** `2026-08-29 11:09:49`
- **Ngày đo:** 2026-08-29
- **Cách đo:** `do.js` cùng thư mục, chạy trong Chrome, iframe 390×844

**Ghi chú về cách phục vụ `dist/`:** brief chỉ định `npm run preview`, nhưng lệnh này
(`astro preview`) không hỗ trợ adapter `@astrojs/cloudflare` với `output: 'static'` —
lỗi `The @astrojs/cloudflare adapter does not support the preview command`. Đã thử
`npx wrangler dev` (không thêm dependency mới, wrangler đã có sẵn ở devDependencies)
nhưng `[build] command` trong `wrangler.toml` tự kích hoạt một lần build lại `dist/`,
làm mtime đã ghi trước đó vô nghĩa (và giữa chừng process bị dừng khiến `dist/index.html`
bị xoá tạm thời). Đã build lại sạch (`npm run build`, cùng HEAD, mtime mới) và phục vụ
`dist/` bằng `python3 -m http.server 4321` — công cụ hệ thống có sẵn trên máy, không phải
dependency của dự án, không kích hoạt build. Bốn trang đều trả 200 trước khi đo. Việc thay
`npm run preview` → `python3 -m http.server` chỉ là cách phục vụ tĩnh `dist/`, không đổi
`do.js`, không đổi nội dung `dist/`.

| Trang | K1 cao | K2 thẻ cao nhất | K3 đích chạm <44 | K4 giá trị đệm | K5 tràn | K6 h2 trùng | K7 hero % |
|---|---|---|---|---|---|---|---|
| `/` | 20242 | 447 (16 thẻ) | 32 | 24px, 32px, 48px, 64px, 96px | 0 | Tour nổi bật | 86.2 |
| `/diem-tham-quan/di-tich-lich-su/` | 2180 | 385 (1 thẻ) | 24 | 0px, 24px, 48px | 0 | (không) | (không có hero) |
| `/diem-tham-quan/khu-du-lich-hon-mun/` | 9209 | 423 (1 thẻ) | 27 | 0px, 12px, 16px, 24px, 32px, 48px | 0 | (không) | (không có hero) |
| `/tour/vinh-san-ho/` | 2190 | 462 (1 thẻ) | 24 | 0px, 24px, 48px | 0 | (không) | (không có hero) |

**Ghi chú bắt buộc:** ba trang có lưới 1 thẻ đều là `.card-grid` (EntityIndex).
`home-card-grid` (HomeRollupSection) KHÔNG có lưới 1 mục nào, nên nửa R1b dành cho
file đó không có trang nào quan sát được — xem spec §5.2.

**Ghi chú số liệu — quan sát thô, không phải phán quyết pass/fail:**
- K3 (đích chạm nhỏ hơn 44px): danh sách đầy đủ từng phần tử (`K3_chiTiet`) nằm trong
  kết quả JSON gốc lúc đo, dán trong log của Task này, chưa qua phân tích nguyên nhân —
  không suy đoán ở đây vì chưa kiểm cấu trúc DOM/CSS thật của từng phần tử.
- K6 (h2 trùng): chỉ có "Tour nổi bật" trùng ở trang chủ; ba trang lưới 1 thẻ không có
  h2 trùng.
- K7 (hero %): chỉ trang chủ có `.site-home-hero`; ba trang còn lại trả `null` vì
  không có phần tử `.site-home-hero` — đúng như kỳ vọng cho trang chi tiết entity.
