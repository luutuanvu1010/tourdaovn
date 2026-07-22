# ADR-0015 — Dashboard điều khiển: control plane đứng ngoài, đọc-trước-ghi-sau

- Trạng thái: **accepted** (founder duyệt 2026-06-22)
- Ngày: 2026-06-22   Người phê chuẩn: Lưu Tuấn Vũ
- Loại quyết định: cửa hai chiều cho Phase 1 (đảo được); cửa một chiều cho phần ghi Phase 2 (cần phê chuẩn trước khi code)
- Liên quan: CLAUDE.md §4 (tách nguồn sự thật), §8 (hard gate), ADR-0014 (đã loại document action trong Studio), ADR-0008 (publish gate)

## Bối cảnh

Mọi thứ chạy backend, founder chỉ thấy được Sanity Studio và chỉ ở mức entity. Founder muốn một bộ điều khiển trung tâm kiểu wp-admin: nhìn + điều khiển trạng thái entity, module dịch, module cào, SEO/GEO, bật tắt chức năng.

Ràng buộc ép quyết: (1) dự án CỐ Ý tách nguồn sự thật (Sanity = nội dung, booking = giá, git = cấu hình/SEO/feature-flag) — một dashboard "ghi tất" kiểu wp-admin sẽ tạo nguồn sự thật thứ hai, vi phạm §4. (2) ADR-0014 đã loại hướng document action trong Studio (custom action revert trên Sanity v6). Vậy phải quyết: dashboard đặt ở đâu, được ghi gì.

## Quyết định

Dashboard là **control plane đứng NGOÀI** (không nhúng vào Studio), theo nguyên tắc **đọc-trước-ghi-sau** và **không tự ghi đè nguồn sự thật**.

- **Phase 1 (làm ngay):** Cowork artifact CHỈ ĐỌC. Hiển thị trạng thái entity (loại, draft/approved/published, thiếu field/rớt gate), tiến độ dịch từng ngôn ngữ, lịch sử batch. Đọc từ Sanity qua connector. Rủi ro bằng không, không đụng ADR.
- **Phase 2 (sau, cần ADR riêng accepted):** thêm điều khiển. Phân tầng theo rủi ro:
  - Hành động AN TOÀN (không ghi nguồn sự thật) → dashboard chạy trực tiếp: bấm nút gọi `scripts/translate`, `scripts/synthesis`, validator, xem log.
  - Hành động ĐỤNG nguồn sự thật → dashboard chỉ DẪN tới đúng cửa, không tự ghi: duyệt-publish → Studio; đổi SEO/GEO/config/feature-flag → git/PR.

## Lý do

Tách nguồn sự thật là điểm mạnh kiến trúc, không phải thiếu sót — khác WordPress (trộn mọi thứ vào một DB). Giữ nó thì dashboard không được trở thành nguồn ghi thứ hai.

Phase 1 artifact thắng vì: dựng nhanh, đảo được (cửa hai chiều), không thêm hạ tầng phải nuôi, không bề mặt bảo mật mới — hợp một founder. Tách Phase 1/Phase 2 để founder thấy thật mình nhìn gì nhiều nhất TRƯỚC khi cam kết phần ghi tốn công và rủi ro.

## Phương án bị loại

- **Trang Astro `/admin` ngay từ đầu:** thêm một mặt phải nuôi + bảo mật (trang điều khiển ghi-data nằm trong site production là bề mặt tấn công) + build lại mỗi lần đổi. Là đích đến tốt SAU Phase 1, không phải điểm khởi đầu.
- **App ngoài riêng biệt:** mạnh nhất nhưng nặng nhất, quá mức cho quy mô một người lúc này.
- **Document action trong Studio:** đảo ADR-0014 + làm lại thứ vừa hỏng (Sanity v6 revert). Loại.
- **Dashboard ghi-tất kiểu wp-admin:** vi phạm §4 (tách nguồn sự thật), tạo nguồn ghi thứ hai cho giá/SEO/config. Loại.

## Hệ quả

- Ràng buộc: dashboard KHÔNG BAO GIỜ ghi trực tiếp vào Sanity (nội dung), booking (giá), hay cấu hình production. Mọi thay đổi nguồn sự thật đi qua cửa của nó.
- Mở nợ: Phase 2 cần một ADR riêng (đặt cố định ở đâu: artifact vs Astro; cho chạy script nào; cơ chế auth nếu lên Astro). Chưa code phần ghi trước khi ADR đó accepted.
- "Cài đặt SEO/GEO" phần lớn ở code/schema (JSON-LD sinh lúc build) → dashboard hiển thị/dẫn, không sửa tại chỗ. Nếu muốn một số tham số SEO sửa runtime, phải thêm field vào CONTENT_MODEL trước (đi qua hook guard-no-field-outside-model) — không phải việc của dashboard.
- "Bật tắt chức năng" = feature-flag, vẫn nằm ở code/git, dashboard chỉ phản ánh trạng thái.
