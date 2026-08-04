# Architecture Decision Records (ADR)

Quyết định kiến trúc của Core. **14 ADR nền** kế thừa nguyên từ nhatrangtravel (bản gốc,
bất biến — ghi lại quyết định engine đã accepted), cộng **ADR-0020** mới cho cơ chế đa-site.

Mỗi ADR bất biến sau khi accepted. Muốn đổi thì viết ADR mới thay thế (ghi "superseded by
ADR-XXXX"), không sửa ADR cũ. Theo P5 + N3 của Hiến pháp: quyết định kiến trúc không có ADR
là vi phạm, bị chặn ở cổng.

## Cách đọc trong bối cảnh Core đa-site

Các ADR nền vốn viết cho nhatrangtravel (một site). Trong Core, chúng vẫn là luật engine,
nhưng vài ADR có hằng số cứng cần thành tham số — được đánh dấu bằng khối **GHI CHÚ CORE**
ở đầu file. ADR-0020 là chỗ quy định cơ chế tham số hóa đó.

## ADR nền — kế thừa từ nhatrangtravel (bất biến)

Nhóm engine (giữ nguyên, tái dùng mọi site):

- [ADR-0001](ADR-0001-stack-nhatrangtravel.md) — Stack: Sanity + Astro + Cloudflare
- [ADR-0003](ADR-0003-price-source-seam.md) — Seam giá một chiều (bookingRef)
- [ADR-0008](ADR-0008-reviewstatus-publish-gate.md) — reviewStatus là cổng publish
- [ADR-0009](ADR-0009-autodeploy-git-build.md) — Auto-deploy git build + webhook
- [ADR-0010](ADR-0010-release-gate-cloudflare-canonical.md) — Cổng phát hành Cloudflare canonical
  — *mục 1–2 superseded by ADR-0022 ở tourdaovn; vẫn là mặc định của Core*
- [ADR-0012](ADR-0012-pretooluse-hook.md) — PreToolUse hook machine-level
- [ADR-0014](ADR-0014-translation-module.md) — Module dịch AI
- [ADR-0015](ADR-0015-dashboard-control-plane.md) — Dashboard control plane
- [ADR-0016](ADR-0016-dashboard-phase2-command-relay.md) — Dashboard command relay

Nhóm cần tổng quát hóa (có GHI CHÚ CORE — nguyên tắc engine, hằng số thành tham số):

- [ADR-0002](ADR-0002-entity-model-nhatrangtravel.md) — Mô hình entity (danh mục → cấu hình)
- [ADR-0004](ADR-0004-i18n-hybrid.md) — i18n hybrid (ngôn ngữ → tham số địa phương)
- [ADR-0007](ADR-0007-price-source-yaml.md) — prices.yaml (currency/unit → tham số)
- [ADR-0013](ADR-0013-i18n-field-level-rich-fields.md) — i18n field rich (entity/ngôn ngữ → cấu hình)
- [ADR-0018](ADR-0018-khoi-phuc-cong.md) — Khôi phục cổng fail-closed (ngưỡng → tham số)
  — *mục 1–2 superseded by ADR-0022 ở tourdaovn; mục 3 (`checkBodyLength`) vẫn hiệu lực*

## ADR mới của Core

- [ADR-0020](ADR-0020-multi-site-registry-preset.md) — **Core đa-site**: module registry +
  preset loại hình + tham số địa phương. **Hoãn (deferred)** — chủ dự án chọn đường A
  fork-and-edit (dùng lại code cũ, không viết cơ chế mới). ADR giữ làm hướng nâng cấp tương
  lai. Cách dựng site hiện hành: `SETUP-NEW-SITE.md`.

## ADR riêng của tourdaovn (Core KHÔNG kế thừa)

- [ADR-0022](ADR-0022-go-cong-phat-hanh.md) — **Gỡ cổng validator khỏi đường phát hành**,
  supersede ADR-0010 mục 1–2 và ADR-0018 mục 1–2. Quyết định vận hành riêng, ngược triết lý
  fail-closed của Core — cùng loại với ADR-0019 của nhatrangtravel. Site mới vẫn mặc định
  fail-closed theo ADR-0010/0018.

## ADR gốc KHÔNG mang vào Core (và vì sao)

- **ADR-0005** (Specialty đặc sản) — entity gắn ẩm thực Nha Trang; trong Core là *module
  tùy chọn* của preset du lịch, không phải lõi bắt buộc. Bản thân ADR-0005 vẫn là mẫu tốt
  cho quy trình đăng ký một module (xem ADR-0020).
- **ADR-0006** (Transfer deferred) — quyết định theo trạng thái dữ liệu tuyến Nha Trang.
- **ADR-0019** (nới cổng Cloudflare) — quyết định vận hành riêng nhatrangtravel, ngược triết
  lý fail-closed. Core mặc định fail-closed (ADR-0010/0018); site nào muốn nới tự ghi ADR riêng.
