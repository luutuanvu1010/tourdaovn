# Nhật ký phiên — QR chuyển khoản và ZNS gửi khách

**Ngày:** 2026-08-31 · **Vai:** Cowork · **Nhánh:** `main` · **Kết quả:** một spec, chưa một dòng mã.

## Đang cần gì

**Hai thứ chặn, cả hai chỉ chủ dự án làm được:**

1. **Ba giá trị tài khoản ngân hàng** (`bin`, `accountNumber`, `accountName`). Chưa có thì
   `SPEC-2026-08-31` §4.2 và §4.3 **không mở**. Số trong spec là khuôn, không phải số thật.
2. **Ba thủ tục Zalo:** liên kết OA với ZBS Account → nạp tiền → **nộp mẫu tin**. Nội dung mẫu
   đã soạn sẵn ở `SPEC-2026-08-31` §4.1, chép vào bảng quản trị OA là xong.

**Nộp mẫu tin là việc gấp nhất.** Duyệt mất 2 ngày làm việc, là chờ bên ngoài và nối tiếp — mỗi
giờ hoãn cộng thẳng vào ngày ZNS chạy được. Mọi task khác chạy song song được.

## Đã làm

- `docs/specs/SPEC-2026-08-31-qr-thanh-toan-va-zns.md` — **bản 2**, sáu mục chủ dự án duyệt lần
  lượt. Chưa qua QA1.
- `docs/BACKLOG.md` — **mới**, gom 10 mục nợ kỹ thuật và ý tưởng, mỗi mục có bằng chứng.
- Bản 1 sai 7 chỗ, hai agent review bắt được, đã sửa hết — bảng đối chiếu ở spec §10.

## Ba điều tra được, đừng tra lại

- **Ảnh trong mẫu ZNS là TĨNH**, đóng băng lúc đăng ký. QR riêng từng đơn **không** nhúng vào
  thân tin được → phải qua nút CTA mang URL động.
- **Nút CTA phải trỏ domain chính chủ** → `/dat-tour/{mã}/` trên tourdao.vn là **bắt buộc**,
  không trỏ thẳng `img.vietqr.io` được. Đây là route động **thứ hai** của site.
- **Token Zalo OA:** access 1 giờ, refresh 3 tháng nhưng **dùng được đúng một lần**. Lưu D1,
  ghi kiểu so-rồi-đổi; kẻ thua đọc lại, không ghi đè.

## Hai xung đột đã gỡ, không còn nợ quyết định

- Nội dung chuyển khoản `TEN_SĐT` đụng `ADR-0030` §5. Chủ dự án chốt dùng **mã đơn** — mục đích
  vốn là đối chiếu tiền về, mã đơn làm tốt hơn. `BK3` không bị đụng.
- `BK3` vẫn phải nới (SĐT khách sang VNG, email khách sang SES). **Đã duyệt trong phiên**, còn
  phải viết QĐ vào `DECISIONS.md` khi thi công.

## Trạng thái production, đo trực tiếp hôm nay

Ưu đãi thanh toán trước **ĐANG BẬT ở 5%**; ô chọn ngày `max="2026-11-29"` (đúng 90 ngày);
Turnstile chạy thật. Nghiệm thu tay §7 của đợt trước **chưa thấy dấu vết ai làm** → `B-009`.

## Bước kế

Có ba số tài khoản → `writing-plans`. Chưa có → nộp mẫu ZNS trước, rồi lập kế hoạch cho §4.4–§4.7
(trang, khối thành công, tách nội dung, kênh báo tin) vì bốn phần đó không phụ thuộc số tài khoản.
