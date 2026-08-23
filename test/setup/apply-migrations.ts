import { applyD1Migrations, env } from 'cloudflare:test'

// Chạy trước MỖI FILE test — không phải trước mỗi `it()`.
//
// KHÔNG có isolatedStorage theo từng `it()` ở @cloudflare/vitest-pool-workers@0.22 (bản cài
// trong repo này): `WorkersPoolOptionsSchema` (dist/pool/index.d.mts) không có trường đó, và
// thực nghiệm xác nhận D1 GIỮ trạng thái giữa các `it()` trong cùng một file — một `it()`
// insert xong thì `it()` sau vẫn thấy hàng đó.
//
// Nên mỗi file test phải tự lo cô lập, bằng một trong hai cách đang dùng:
//   - dọn bảng trong `beforeEach` (test/booking/handler.test.ts), khi các ca CỐ Ý dùng lại
//     cùng phone/tour/ngày/IP;
//   - hoặc cho mỗi ca một fixture rời nhau — `code`/`phone`/`ipHash` riêng
//     (test/booking/store.test.ts).
//
// Chú thích cũ ở đây ("isolatedStorage mặc định nên mỗi test một D1 sạch") là SAI; hai file
// trên đã phải viết đoạn dài để cải chính nó. Sửa ở vòng review toàn nhánh 2026-08-23.
await applyD1Migrations(env.BOOKING_DB, env.TEST_MIGRATIONS)
