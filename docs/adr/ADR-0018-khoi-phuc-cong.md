# ADR-0018 — Khôi phục cổng phát hành fail-closed, đảo `b82cdeb`

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
ADR gốc, bất biến — KHÔNG sửa nội dung.
ENGINE: nguyên tắc fail-closed + "đảo cửa-một-chiều phải qua ADR" + completeness cần
  ngưỡng độ dài body kiểm được. Core LẤY mô hình này (0010+0018) làm mặc định phát hành.
CẦN TỔNG QUÁT HÓA: hằng MIN_BODY_CHARS=400 và BODY_GATED_TYPES là tham số của site.
LƯU Ý: ADR-0019 (nới cổng Cloudflare) là quyết định vận hành RIÊNG nhatrangtravel, ngược
  triết lý fail-closed — Core KHÔNG kế thừa 0019. Site mới mặc định fail-closed. Xem ADR-0020.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** accepted
- **Ngày đề xuất:** 2026-07-07   **Ngày accept:** 2026-07-07   **Người phê chuẩn:** Lưu Tuấn Vũ (founder), duyệt qua phiên Cowork 2026-07-07
- **Supersedes:** quyết định `DECISIONS.md` 2026-06-29 "Nới tạm Cloudflare deploy gate"; khôi phục hiệu lực ADR-0010
- **Loại quyết định:** cửa một chiều (mô hình cổng phát hành, cùng lớp quyết định với ADR-0010)
- **Liên quan:** ADR-0010 (release-gate-cloudflare-canonical, accepted), commit `b82cdeb` (29-06, "chore(deploy): relax Cloudflare build gate"), `DECISIONS.md` mục 2026-06-29, `AUDIT_MERGED-2026-07-06.md` mục 3 (P3·H1) và mục 4 (P2·Bước 5 rủi ro #3)

## Bối cảnh

Commit `b82cdeb` (2026-06-29) đổi `build:ci` từ chuỗi validator fail-closed đầy đủ (`check:cwd` + `validate` + `build` + `validate:post`) xuống chỉ còn `npm run build`, với lý do "Sanity publish là cổng duyệt nội dung chính, Cloudflare không nên chặn lần hai". Thay đổi này được ghi vào `DECISIONS.md` nhưng KHÔNG đi qua ADR, trong khi nó đảo ngược trực tiếp quyết định cửa-một-chiều đã `accepted` ở ADR-0010 ("Cloudflare Pages `build:ci` là cổng phát hành production canonical... Không artifact nào lên `nhatrangtravel.net` mà không qua validator của `build:ci`").

Audit `AUDIT_MERGED-2026-07-06.md` xếp đây là phát hiện điểm cao nhất (18 điểm, P3·H1): "đây là gốc khiến mọi lỗi khác không bị chặn". Từ 29-06 tới nay, Cloudflare chỉ chạy `astro build`, tức 7 validator `validate:post` (JSON-LD, R3/R4, governance, geo, entity-layout, registry, deferred-gate) và toàn bộ `validate` pre-build không còn nằm trên đường lên production thật — chỉ chạy khi có người chủ động gọi `npm run build:strict` hoặc `npm run gate`.

Cùng đợt audit cũng ghi nhận kẽ hở liên quan: completeness gate (I12) không kiểm độ dài nội dung — cho phép document đủ field nhưng gần như rỗng ruột lọt qua (ví dụ thực tế: body 22 từ ở Hòn Tằm, body rỗng ở Bắc Nha Trang).

## Quyết định

1. `build:ci` (`package.json`) trỏ về `build:strict` — khôi phục nguyên trạng chuỗi fail-closed mà ADR-0010 đã chốt: `check:cwd` → cài deps `scripts/` → `validate` (pre-build) → `astro build` → `validate:post` (7 validator post-build).
2. `wrangler.toml` `[build] command` trỏ về `npm run build:ci` (không đổi tên biến, chỉ khôi phục để Cloudflare thực sự chạy chuỗi trên thay vì `npm run build` trần).
3. Thêm ngưỡng completeness mới vào I12: `checkBodyLength` trong `shared/gates/index.ts` (dùng chung Node + browser theo mẫu các `checkIx` khác, P6/N7), hằng số `MIN_BODY_CHARS = 400` và `BODY_GATED_TYPES = {article, place, attraction, experience, tour}` tách riêng ở đầu module. Chỉ kiểm publish (tập `reviewStatus=approved` đã lọc sẵn ở `validate-constraints.ts`), không chặn draft.

## Lý do

- ADR-0010 vẫn `accepted`, chưa từng bị supersede đúng thủ tục. `b82cdeb` sửa hành vi mà lẽ ra cần một ADR đảo (Điều 7.2, cửa một chiều), không phải một dòng `DECISIONS.md`. Giữ nguyên tắc: đảo quyết định kiến trúc cửa một chiều cần đi qua ADR, không lách bằng nhật ký quyết định.
- Rủi ro thực tế đã xảy ra đúng như ADR-0010 cảnh báo: từ 29-06, ít nhất 2 document (Hòn Tằm, Bắc Nha Trang) có nội dung gần rỗng vẫn publish được vì không có gate nào trên đường Cloudflare chặn lại.
- Ngưỡng body đi kèm vì cùng một lớp rủi ro ("cổng completeness không đủ chặt") — không thêm cổng mới tách rời khỏi mục tiêu khôi phục fail-closed của ADR này.

## Phương án bị loại

- Giữ nguyên `build:ci` nới (trạng thái từ `b82cdeb`) và chỉ thêm ngưỡng body vào `build:strict`: loại — không giải quyết gốc rễ H1 (Cloudflare vẫn không chặn được gì), audit xếp đây là ưu tiên cao nhất đúng vì lý do này.
- Sửa thẳng `b82cdeb` bằng `git revert` tự động không qua ADR: loại — đảo một quyết định kiến trúc cửa một chiều là thẩm quyền founder (CLAUDE.md §2 tầng cứng), Code không tự quyết.
- Mở rộng `BODY_GATED_TYPES` ra toàn bộ entity có `body`: loại ở phạm vi ADR này — giữ đúng 5 type audit đã nêu ví dụ cụ thể, tránh đoán thêm phạm vi chưa được xác nhận.

## Hệ quả

- Tích cực: Cloudflare `build:ci` lại là cổng phát hành production thật, khớp ADR-0010; kẽ hở "đủ field nhưng rỗng ruột" bị chặn thêm bởi ngưỡng body.
- Đánh đổi: Sanity publish có thể bị Cloudflare từ chối lần hai nếu nội dung chưa đạt gate (đúng mô hình ADR-0010 đã chấp nhận, ngược lại chủ đích của `b82cdeb`). Founder cần quay lại xử lý các document bị I12/I12-body chặn (kể cả Hòn Tằm, Bắc Nha Trang) trước khi chúng publish lại được.
- Nợ cần founder quyết khi duyệt ADR này: `project/governance/control-registry.yaml` (STACK-S24, STACK-S27) và các doc vận hành bị `b82cdeb` sửa (`README.md`, `project/SETUP-autodeploy.md`, `project/enterprise-docs/BUILD_AND_DEPLOY_RUNBOOK.md`, `project/governance/CONTROL_GATES.md`, `project/04-CONSTRAINTS.md`) vẫn còn mô tả trạng thái "nới tạm 2026-06-29" — cần một lượt sửa tài liệu riêng sau khi ADR này được accept, ngoài phạm vi FIX-01.
