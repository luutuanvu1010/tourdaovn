# ADR-0016 — Dashboard Phase 2: mô hình "ra lệnh, Cowork chạy hộ" (command relay)

- Trạng thái: **accepted** (founder duyệt 2026-06-23)
- Ngày: 2026-06-23   Người phê chuẩn: Lưu Tuấn Vũ
- Loại quyết định: cửa hai chiều (đảo được — không thêm hạ tầng cố định)
- Liên quan: ADR-0015 (control plane đứng ngoài, đọc-trước-ghi-sau), CLAUDE.md §4 (tách nguồn), §8 (hard gate)

## Bối cảnh

ADR-0015 chốt Phase 1 (artifact chỉ đọc) và hẹn Phase 2 (điều khiển) cần ADR riêng. Founder muốn Phase 2 "đúng nghĩa": bao quát nội dung+gate, chạy module (dịch/synthesis/validate), deploy+hạ tầng, SEO/GEO.

Ràng buộc kỹ thuật ép quyết: artifact Cowork bị cô lập (sandbox), chỉ gọi được connector MCP, KHÔNG chạy được `npx tsx scripts/...` hay git/wrangler trên máy founder. Vậy "nút bấm chạy script" trong artifact không thể tự thực thi. Tay phải chạm vào máy thật nằm ở Cowork (chạy qua bash) hoặc một backend Astro (nặng, phải lo auth + secret LLM).

## Quyết định

Phase 2 theo mô hình **command relay**: dashboard là mặt kính + bảng nút; mỗi nút gọi `sendPrompt(<câu lệnh chuẩn>)` để gửi một yêu cầu rõ ràng vào chat Cowork; Cowork (Claude) nhận, chạy lệnh thật qua bash trên repo, báo kết quả. Dashboard KHÔNG tự chạy script, KHÔNG tự ghi nguồn sự thật.

Phân tầng hành động giữ nguyên ADR-0015:
- ĐỌC (Sanity) → dashboard tự lấy qua connector.
- CHẠY an toàn (dịch/synthesis/validate, dry-run mặc định) → nút sendPrompt → Cowork chạy.
- ĐỤNG nguồn sự thật (publish, đổi config/SEO, deploy) → nút sendPrompt mô tả việc, Cowork thực thi qua đúng cửa (Sanity API/Studio, git/PR, wrangler) sau khi xác nhận.

## Lý do

Command relay thắng vì: không thêm hạ tầng cố định phải nuôi, không mở endpoint/secret LLM ra ngoài, không bề mặt tấn công mới — đảo được bất cứ lúc nào (cửa hai chiều). Founder solo: Cowork vốn đã là lớp chạy-hộ tin cậy, tái dùng nó rẻ hơn dựng backend. `--dry-run` mặc định của các script là van an toàn sẵn có: nút mặc định chạy dry-run, `--live` là hành động có chủ đích.

## Phương án bị loại

- **Trang Astro /admin có backend chạy script:** phải lo auth (trang điều khiển công khai = nguy hiểm), quản secret LLM ở runtime, build lại mỗi lần đổi. Nặng, để dành khi nhu cầu vượt khả năng command relay.
- **Artifact tự chạy script:** bất khả thi kỹ thuật (sandbox cô lập).
- **Dashboard ghi thẳng Sanity/config:** vi phạm §4 (ADR-0015 đã loại).

## Hệ quả

- Dashboard Phase 2 dùng được kể cả khi chưa nối thêm connector nào: phần đọc qua Sanity MCP, phần chạy/deploy qua sendPrompt + Cowork.
- Phụ thuộc: nút điều khiển chỉ hoạt động khi mở dashboard TRONG phiên Cowork (sendPrompt cần khung chat). Ngoài Cowork nó suy biến về dashboard chỉ-đọc — chấp nhận được.
- Validator không lưu file kết quả → dashboard không hiển thị tĩnh trạng thái gate mới nhất; phải qua nút "chạy validator". Nợ nhỏ: nếu sau muốn badge gate luôn cập nhật, cho validator ghi 1 file JSON kết quả rồi dashboard đọc (chưa làm).
- Mở đường Phase 3 (nếu cần): chuyển các lệnh hay dùng thành scheduled task để chạy định kỳ, không cần bấm tay.
