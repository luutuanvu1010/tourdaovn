# Font tự host

Be Vietnam Pro và Plus Jakarta Sans, tải từ Google Fonts ngày 2026-08-06.
Cả hai phát hành theo **SIL Open Font License 1.1** — được phép nhúng và phân phối
lại kèm sản phẩm, kể cả thương mại. Bản quyền thuộc các tác giả gốc.

- Be Vietnam Pro — https://fonts.google.com/specimen/Be+Vietnam+Pro
- Plus Jakarta Sans — https://fonts.google.com/specimen/Plus+Jakarta+Sans

**Vì sao tự host thay vì gọi CDN Google** (chủ dự án chốt 2026-08-06):
- không phụ thuộc bên thứ ba lúc render, không có request rời khỏi tên miền
- tránh chia sẻ IP người dùng với Google, hợp `S2.8` phần dữ liệu và AI
- kiểm soát được `font-display` và thứ tự tải, phục vụ ngưỡng Lighthouse ≥ 90

Chỉ tải đúng hai subset cần dùng: `latin` (đặt tên `-latin-viet-`) và `vietnamese`.
Tổng 10 file, ~140 KB. Thêm cân nặng khác thì phải cân lại ngưỡng hiệu năng.

Tên file phải khớp đúng `@font-face` trong `src/layouts/BaseLayout.astro`.
Đổi tên ở một bên mà quên bên kia là font 404 trở lại — xem `DRIFT_LOG` DR-029.
