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

- [ADR-0023](ADR-0023-dieu-huong-theo-dong-dich-vu.md) — **Điều hướng theo dòng dịch vụ**,
  và hai trang tĩnh sinh từ `siteSettings`. Cơ chế `nav` khai trong `site.config` (tám `kind`,
  kiểm lúc build) là khuôn tái dùng được; nội dung menu là của riêng site này.
- [ADR-0024](ADR-0024-trang-chu-de-bang-chung-ganh.md) — **Trang chủ để bằng chứng gánh, không
  phải catalogue**. Khuôn tái dùng: khi catalogue mỏng, chuyển gánh nặng thuyết phục sang dữ
  liệu singleton không phụ thuộc số lượng sản phẩm. Kèm luật cứng: đánh giá tự đăng KHÔNG
  serialize ra JSON-LD.
- [ADR-0025](ADR-0025-trang-danh-muc-con-khoa-vao-slug.md) — **Trang danh mục con khoá vào
  `slug`**, không khoá vào `termCode`, kèm hai cổng chặn category thiếu slug. Khuôn tái dùng:
  trang sinh ra từ một field TUỲ CHỌN thì phải có cổng, nếu không nó biến mất câm. Bổ sung
  cho ADR-0023.
- [ADR-0026](ADR-0026-trang-chu-ganh-ca-san-pham.md) — **Trang chủ gánh cả sản phẩm**, không
  chỉ bằng chứng; supersede ADR-0024 mục catalogue (phần luật JSON-LD của ADR-0024 vẫn hiệu
  lực). Khuôn tái dùng: quyết định dựa trên trạng thái dữ liệu phải khai NGƯỠNG SỐ để biết
  khi nào nó hết hiệu lực.
- [ADR-0027](ADR-0027-module-dat-tour.md) — **Module đặt tour**: container runtime đầu tiên
  (route on-demand `/api/dat-tour` trên cùng Worker + D1), báo tin email + Zalo Bot, và mở
  rộng lược đồ `prices.yaml` bằng `paxRates` (sửa ADR-0007 phần perPax). Accepted 2026-08-22.
  Khuôn tái dùng: *đơn* tách khỏi *giá* và *nội dung*, không lớp
  nào ghi chéo; bản ghi gốc ở D1, báo tin hỏng không hỏng đơn.
- [ADR-0028](ADR-0028-da-diem-den.md) — **TouristDestination là N**, và mọi entity khai mình
  thuộc điểm đến nào qua field `destination`. Accepted 2026-08-26. Khuôn tái dùng: cardinality
  của entity trụ là tham số chứ không phải hằng; quan hệ `* → touristDestination` là cạnh
  phẳng, độc lập với chuỗi `containedInPlace` và không suy ra nhau. Việc site này giữ Nha Trang
  ở `/` là cấu hình (`primaryDestinationSlug`), không phải luật engine.
- [ADR-0030](ADR-0030-ba-lop-nghiep-vu-be-mat-quan-tri.md) — chia hệ thành **ba lớp**: nghiệp
  vụ (quy tắc kinh doanh thuần, kiểm được không cần trình duyệt/mạng/CSDL), bề mặt (một nguồn
  token sinh cả CSS lẫn dạng dùng được cho email), quản trị (**một tab trong Sanity Studio**,
  không mở mặt phẳng điều khiển thứ hai). Mỗi ranh giới có một validator canh. Đề xuất
  2026-08-30. Khuôn tái dùng: (a) ranh giới không có máy canh sẽ trôi — `notify/format.ts` viết
  cứng màu từ ngày đầu vì chưa có luật nào chặn; (b) dựng quản trị trên CMS đã có thì thừa
  hưởng luôn hệ người dùng của nó và tránh được cửa một chiều "site thôi thuần tĩnh".

- [ADR-0033](ADR-0033-vung-dang-nhap-doi-tac.md) — **Vùng đăng nhập đối tác**: giá kín theo
  vai, đơn nhiều dịch vụ, mặt phẳng danh tính thứ hai. **Đề xuất 2026-08-31, chờ phê chuẩn.**
  Nới điều cấm 2.3 và `BK1` ở phạm vi hẹp (chỉ `/doi-tac/*`), gỡ "không giỏ hàng" của brief §5
  trong vùng đăng nhập, và bước qua cửa một chiều mà ADR-0030 §2 từng mừng vì tránh được —
  site thôi là "tĩnh cộng đúng một đường động". KHÔNG đảo ADR-0007 hay ADR-0030 §3: `prices.yaml`
  vẫn là nguồn giá duy nhất, chiết khấu là *quy tắc* chứ không phải *giá*. Khuôn tái dùng:
  (a) dữ liệu kín quyết định kiến trúc render, nên phải nới ràng buộc CÓ MÃ chứ không lách bằng
  tên file; (b) CMS có dataset đọc công khai thì bỏ gì vào đó cũng là xuất bản — nơi ở của dữ
  liệu phải ĐO chứ không suy; (c) danh tính đối tác ngoài tổ chức khác danh tính người vận hành,
  gộp lại là cấp sai quyền.

## ADR gốc KHÔNG mang vào Core (và vì sao)

- **ADR-0005** (Specialty đặc sản) — entity gắn ẩm thực Nha Trang; trong Core là *module
  tùy chọn* của preset du lịch, không phải lõi bắt buộc. Bản thân ADR-0005 vẫn là mẫu tốt
  cho quy trình đăng ký một module (xem ADR-0020).
- **ADR-0006** (Transfer deferred) — quyết định theo trạng thái dữ liệu tuyến Nha Trang.
- **ADR-0019** (nới cổng Cloudflare) — quyết định vận hành riêng nhatrangtravel, ngược triết
  lý fail-closed. Core mặc định fail-closed (ADR-0010/0018); site nào muốn nới tự ghi ADR riêng.
