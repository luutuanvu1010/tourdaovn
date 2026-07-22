# ADR-0009 — Auto-deploy: Cloudflare Pages build-from-git + Sanity webhook

- Trạng thái: accepted
- Ngày: 2026-06-16
- Liên quan: ADR-0001 (stack), ADR-0003/0007 (price seam), 09-STEP9_PLAN, SETUP-autodeploy.md

## Bối cảnh

Tới hết Bước 8, Cloudflare Pages chạy chế độ direct-upload: build local rồi `wrangler pages deploy dist`. Mỗi lần publish nội dung trong Sanity, founder phải chạy tay `npm run build && npm run deploy`. Site là static-first nên nội dung không tự lên live. Vào pha nội dung (publish liên tục, batch 5-8 entity), thao tác tay này là ma sát lớn và dễ quên, dẫn tới lệch giữa Sanity và trang live.

Ràng buộc phải giữ:

- Cổng fail-closed: không entity nào thiếu completeness hoặc JSON-LD hỏng được lên production. Hiện validator chạy trong GitHub Actions khi push git. Nhưng publish nội dung không tạo commit, nên nếu build do publish kích mà không chạy validator thì gate bị bỏ qua.
- Token Sanity (Viewer) đã lộ nhiều lần, đang nợ rotate.

## Quyết định

1. Chuyển Cloudflare Pages project `nhatrangtravel` từ direct-upload sang build-from-git, nối với repo GitHub `luutuanvu1010/nhatrangtravel`, production branch `main`, build output `dist`.
2. Build command trên Cloudflare là `npm run build:ci`, một script mới chạy validator trước rồi mới build. Validator fail thì build fail, không deploy. Gate fail-closed áp cho cả build do push git lẫn build do webhook publish kích.
3. Tạo một Deploy Hook trên Cloudflare Pages. Cấu hình Sanity webhook bắn vào hook đó khi document publish (create/update/delete trên dataset production), lọc theo các type có render trang.
4. Debounce: chèn một Cloudflare Worker giữa Sanity và Deploy Hook, gom các webhook sát nhau thành một lần gọi hook (alarm Durable Object, reset mỗi lần có sự kiện, bắn sau khoảng lặng 120 giây). MVP có thể bỏ qua Worker và bắn thẳng, chấp nhận build xếp hàng.
5. Set env build trên Cloudflare: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET=production`, `SANITY_READ_TOKEN` (token Viewer mới sau rotate), `NODE_VERSION=20`.
6. Gộp rotate token vào đúng bước này: tạo token Viewer mới, set vào Cloudflare build env + secret GitHub `SANITY_READ_TOKEN`, revoke token cũ.

## Phương án đã loại

- Giữ deploy tay: đúng cái cần bỏ.
- GitHub Actions dựng + deploy (Sanity webhook → repository_dispatch → Actions chạy build + wrangler): linh hoạt, log rõ, nhưng thêm secret `CLOUDFLARE_API_TOKEN`, giữ wrangler trong CI, và tách nguồn sự thật build khỏi Cloudflare. Để dành làm phương án B nếu build-from-git vướng.
- Bắn webhook thẳng không debounce: đơn giản nhưng publish batch 5-8 gây build xếp hàng tốn quota. Giữ làm MVP, nâng lên Worker debounce sau.

## Hệ quả

- Tích cực: publish trong Sanity là đủ để lên live, hết thao tác tay. Gate fail-closed vẫn nguyên nhờ `build:ci`. Rotate token đóng nợ bảo mật.
- Đánh đổi: build chạy trên hạ tầng Cloudflare nên phải đảm bảo môi trường build (Node 20, cài deps cả `scripts/`). Thời gian từ publish tới live là thời gian build (vài phút), không tức thì như SSR. Token sống trong env Cloudflare, cần quản trị quyền dự án.
- Rủi ro: nếu validator fail trên một publish, build fail và nội dung không lên, đúng thiết kế fail-closed, founder cần đọc log build để sửa. Direct-upload (`npm run deploy`) vẫn giữ làm đường thoát hiểm khi cần deploy khẩn.

## Rollback

Trong Cloudflare Pages, gỡ kết nối git, quay về direct-upload, dùng lại `npm run deploy`. Vô hiệu Sanity webhook. Token và secret giữ nguyên.
