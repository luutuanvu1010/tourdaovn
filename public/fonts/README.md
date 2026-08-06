# Font tự host

Lora, Be Vietnam Pro và Plus Jakarta Sans, tải từ Google Fonts ngày 2026-08-06.
Cả ba phát hành theo **SIL Open Font License 1.1** — được phép nhúng và phân phối
lại kèm sản phẩm, kể cả thương mại. Bản quyền thuộc các tác giả gốc.

- Lora — https://fonts.google.com/specimen/Lora
- Be Vietnam Pro — https://fonts.google.com/specimen/Be+Vietnam+Pro
- Plus Jakarta Sans — https://fonts.google.com/specimen/Plus+Jakarta+Sans

**Vì sao tự host thay vì gọi CDN Google** (chủ dự án chốt 2026-08-06):
- không phụ thuộc bên thứ ba lúc render, không có request rời khỏi tên miền
- tránh chia sẻ IP người dùng với Google, hợp `S2.8` phần dữ liệu và AI
- kiểm soát được `font-display` và thứ tự tải, phục vụ ngưỡng Lighthouse ≥ 90

Chỉ tải đúng hai subset cần dùng: `latin` (đặt tên `-latin-viet-`) và `vietnamese`.
Tổng 12 file, ~220 KB. Thêm cân nặng khác thì phải cân lại ngưỡng hiệu năng.

**Lora là font chữ hiển thị từ 2026-08-06** (QĐ-2026-08-06-10). Nó là font **biến
thiên 400–700**, nên một file phủ cả ba weight cần dùng — chỉ 2 file thay vì 6, và
`@font-face` khai `font-weight: 400 700` chứ không khai từng bậc.

**Không xoá file Be Vietnam Pro.** Nó không còn là font chính nhưng vẫn đứng ngay
sau Lora trong `--font-display` làm lớp dự phòng: Lora hỏng thì chữ rơi về một font
vẫn có dấu tiếng Việt tử tế, không rơi thẳng về `system-ui`.

Tên file phải khớp đúng `@font-face` trong `src/layouts/BaseLayout.astro`.
Đổi tên ở một bên mà quên bên kia là font 404 trở lại — xem `DRIFT_LOG` DR-029.
