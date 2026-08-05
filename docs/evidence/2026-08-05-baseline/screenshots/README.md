# Ảnh baseline giao diện trước khi thiết kế lại

Chụp ngày 2026-08-05, trước khi bất kỳ thay đổi bề mặt nào được thực hiện.
Đây là biên bản lưu diện mạo cũ, không phải mốc so sánh để bắt lỗi: đợt này
thiết kế lại từ đầu nên mọi trang sẽ khác đi có chủ ý.

Quy ước: cửa sổ 1440 x 900, chụp phần đầu trang. Tên file theo bảng dưới.

Phục vụ bằng: `cd dist && python3 -m http.server 8765`

| Loại trang | Địa chỉ | Tên file |
|---|---|---|
| Trang chủ | http://localhost:8765/ | 01-trang-chu.png |
| Điểm đến tổng | http://localhost:8765/nha-trang/ | 02-diem-den.png |
| Index entity | http://localhost:8765/dia-danh/ | 03-index-dia-danh.png |
| Detail địa danh | http://localhost:8765/dia-danh/hon-mun/ | 04-detail-dia-danh.png |
| Detail tour (có giá) | http://localhost:8765/tour/tour-3-dao-nha-trang-review-chi-tiet/ | 05-detail-tour.png |
| Detail bài viết | http://localhost:8765/cam-nang/tour-3-dao-nha-trang-lich-trinh-chi-tiet/ | 06-detail-bai-viet.png |
| Hub chủ đề | http://localhost:8765/kham-pha/ | 07-hub.png |
| Hub tổng | http://localhost:8765/tat-ca/ | 08-hub-tong.png |
| Trang 404 | http://localhost:8765/404.html | 09-404.png |

Chín loại này phủ hết các khuôn trang trong cây URL hiện tại. 21 trang thật
còn lại đều là bản sao của một trong chín khuôn với dữ liệu khác.
