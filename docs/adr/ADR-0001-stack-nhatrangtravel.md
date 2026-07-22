# ADR-0001 — Stack nền tảng nhatrangtravel.net (ghi hồi cố)

- **Trạng thái:** accepted, phê chuẩn hồi cố (ratified retroactively)
- **Ngày:** 2026-06-10   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa một chiều

## Bối cảnh
Stack đã vận hành trước khi có bản ghi quyết định; ADR này ghi hồi cố để trả nợ quản trị (merge spec UNIFIED_FRAMEWORK, Phụ lục C, mục 6). Trong phiên hợp nhất 2026-06-10 phát hiện merge spec ghi stack khác (Cloudflare Workers + Hono + D1 + EmDash); chủ dự án xác nhận bản đúng theo CLAUDE.md của dự án.

Cập nhật cùng ngày khi chuyển ADR về repo dự án: phát hiện repo nhatrangtravel đang chứa code chạy Hono v4 + JSX + Drizzle + D1 (package.json, drizzle/, migrations/) và một CLAUDE.md cũ (v1.1, 2026-05-30) tuyên bố stack đó "đã chốt, không thay đổi". Chủ dự án tái khẳng định lần hai: stack duy nhất của dự án là Sanity + Astro + Cloudflare; toàn bộ code và tài liệu theo hướng Hono + D1 là legacy.

## Quyết định
- Sanity: Content OS, source of truth nội dung.
- Astro 5+: render static-first.
- Cloudflare Pages và Workers: hạ tầng edge.
- Sanity Image CDN: media phase 1.
- Booking system riêng giữ giá và tồn kho; đồng bộ một chiều về site. Sanity không bao giờ ghi ngược sang booking.

## Lý do
- Web định hướng nội dung khớp nhánh "web nội dung → Astro" của cây quyết định Playbook.
- Sanity cho content model có cấu trúc và GROQ, phục vụ trực tiếp nguyên tắc structured-first và GEO-first của dự án.
- Tách giá và tồn kho khỏi CMS giữ đúng một nguồn sự thật cho mỗi loại dữ liệu (P6).
- Edge-first chi phí vận hành thấp, phù hợp quy mô một founder.

## Phương án bị loại
- Hono/JSX trên Workers: nhánh dành cho app động, web nội dung không cần; xuất hiện trong merge spec là lỗi chép từ cây quyết định.
- D1 + EmDash: phương án ghi trong merge spec, loại vì Sanity là content OS theo hợp đồng dự án hiện hành.
- Next.js: tránh theo Playbook trừ khi bắt buộc.
- WordPress: đã dùng cho khanhhoatravel.com.vn; dùng chung sẽ xóa nhòa ranh giới dự án (N4).

## Hệ quả
- Đổi bất kỳ thành phần nền nào là cửa một chiều, bắt buộc ADR mới.
- Module mới chọn công nghệ theo cây quyết định Playbook.
- Mọi tài liệu còn ghi Hono, D1, hay EmDash cho nhatrangtravel.net là lỗi và phải kéo về bản này (P4).
- Code Hono + D1 hiện có trong repo là legacy: cần một kế hoạch di trú hoặc loại bỏ có kiểm soát (dữ liệu trong D1 phải được kiểm kê trước khi bỏ). CLAUDE.md legacy được lưu ở archive/ của repo dự án, chỉ để phục vụ di trú. Đây là khoản nợ quản trị đang mở, hạn xử lý do chủ dự án đặt khi lập kế hoạch di trú.
