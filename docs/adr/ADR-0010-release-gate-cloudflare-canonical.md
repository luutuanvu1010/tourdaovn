# ADR-0010 — Cổng phát hành production: Cloudflare build:ci canonical, GitHub validate advisory

- Trạng thái: accepted
- Ngày: 2026-06-16   Người phê chuẩn: Lưu Tuấn Vũ
- Loại quyết định: cửa một chiều (mô hình cổng phát hành)
- Liên quan: ADR-0009 (auto-deploy), GOVERNANCE §4.4, CONSTITUTION N2/N6 + bánh cóc 9.4, AF-08 (AUDIT_REPORT-2026-06-16)
- Đề xuất: Cowork (track browser, xác minh dashboard). Duyệt: founder.

## Bối cảnh

Nhiều phiên bàn giao lặp lại task "bật branch protection trên GitHub yêu cầu check `validate`" như cổng chặn merge vào main. Audit 2026-06-16 (AF-08, có subagent kiểm + Cowork lái dashboard) cho thấy:

- Branch protection KHÔNG bật được trên repo này: gói GitHub free + private, API trả 403. Nên check `validate-constraints` chỉ advisory, không chặn được push thẳng main.
- Cổng fail-closed THẬT của production nằm ở Cloudflare Pages `build:ci`: validator chạy trước `astro build`, fail thì không deploy. Xác minh dashboard: build command = `npm run build:ci`; commit `fd3033e` qua cổng này XANH rồi mới live.

## Quyết định

1. Cloudflare Pages `build:ci` là **cổng phát hành production canonical**. Không artifact nào lên `nhatrangtravel.net` mà không qua validator của `build:ci`. Áp cho cả build do git push lẫn do webhook publish (ADR-0009).
2. GitHub Actions `validate-constraints` giữ vai **cảnh báo sớm advisory**: chạy trên push để lộ lỗi sớm, không phải cổng chặn merge.
3. **Bỏ** task "bật branch protection" khỏi mọi checklist và handoff. Bất khả thi trên gói hiện tại, và không cần vì cổng prod thật ở Cloudflare.
4. **Thêm** một git `pre-push` hook chạy validator local trước khi push lên main, làm cổng sớm ở máy (zero cost, không đổi gói hay repo).

## Phương án đã loại

- Chuyển repo sang public để bật branch protection miễn phí: loại lúc này (chưa muốn công khai source), để ngỏ nếu sau cần cổng tầng GitHub.
- Nâng gói GitHub (Pro/Team) cho branch protection private: loại (tốn phí, không cần vì Cloudflare đã là cổng thật).
- Giữ task "bật branch protection": loại — bất khả thi, gây ảo giác có cổng GitHub trong khi không có.

## Hệ quả

- Tích cực: mô hình cổng khớp thực tế; hết bàn giao task bất khả thi; thêm cổng local pre-push siết sớm. Production vẫn fail-closed nhờ `build:ci`.
- Đánh đổi: một commit chưa-validate có thể nằm trên main, nhưng sẽ không lên prod nếu fail `build:ci`. Pre-push hook bịt phần lớn ở local.
- Bánh cóc (9.4/N6): KHÔNG nới cổng thật. Branch protection chưa từng hoạt động nên bỏ là bỏ kỳ vọng bất khả thi; `build:ci` giữ nguyên, pre-push hook là siết thêm.

## Rollback

Nếu sau này có branch protection (đổi repo public hoặc nâng gói), thêm nó như cổng bổ sung, không thay `build:ci`. Pre-push hook gỡ bằng xóa file hook.
