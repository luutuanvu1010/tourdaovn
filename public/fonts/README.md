# Font tự host

**Nunito** làm chữ cho cả trang, **Be Vietnam Pro** làm lớp dự phòng. Tải từ
Google Fonts ngày 2026-08-06. Cả hai phát hành theo **SIL Open Font License 1.1**
— được phép nhúng và phân phối lại kèm sản phẩm, kể cả thương mại. Bản quyền
thuộc các tác giả gốc.

- Nunito — https://fonts.google.com/specimen/Nunito
- Be Vietnam Pro — https://fonts.google.com/specimen/Be+Vietnam+Pro

**Vì sao tự host thay vì gọi CDN Google** (chủ dự án chốt 2026-08-06):
- không phụ thuộc bên thứ ba lúc render, không có request rời khỏi tên miền
- tránh chia sẻ IP người dùng với Google, hợp `S2.8` phần dữ liệu và AI
- kiểm soát được `font-display` và thứ tự tải, phục vụ ngưỡng Lighthouse ≥ 90

Chỉ tải đúng hai subset cần dùng: `latin` (đặt tên `-latin-viet-`) và `vietnamese`.
Tổng 6 file, **~104 KB**. Thêm cân nặng khác thì phải cân lại ngưỡng hiệu năng.

**Nunito là chữ của cả trang từ 2026-08-06** (QĐ-2026-08-06-11) — cả tiêu đề lẫn
thân bài. Nó là font **biến thiên 400–800**, nên một file phủ mọi cấp đậm: chỉ 2
file, và `@font-face` khai `font-weight: 400 800` chứ không khai từng bậc.

**Không xoá file Be Vietnam Pro.** Nó không phải font chính nhưng đứng ngay sau
Nunito trong cả hai token chữ làm lớp dự phòng: Nunito hỏng thì chữ rơi về một font
vẫn dựng dấu tiếng Việt tử tế, không rơi thẳng về `system-ui`.

**Lora và Plus Jakarta Sans đã gỡ.** Lora vào rồi ra trong cùng ngày 2026-08-06 —
chữ có chân đọc ra cứng. Plus Jakarta Sans ra vì Nunito đảm luôn vai thân bài.
Không còn chỗ nào trong mã gọi tới hai font đó.

Tên file phải khớp đúng `@font-face` trong `src/layouts/BaseLayout.astro`.
Đổi tên ở một bên mà quên bên kia là font 404 trở lại — xem `DRIFT_LOG` DR-029.
