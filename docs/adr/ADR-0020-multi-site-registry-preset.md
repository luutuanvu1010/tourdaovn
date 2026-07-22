# ADR-0020 — Core đa-site: module registry, preset loại hình, tham số địa phương

- **Trạng thái:** deferred (hoãn). Chủ dự án chọn **đường A — fork-and-edit** (2026-07-22):
  dựng site mới bằng cách copy engine và sửa các bảng cấu hình có sẵn, KHÔNG viết lớp cơ
  chế registry/preset. ADR này giữ lại làm **hướng nâng cấp tương lai** nếu số site nhiều
  lên và việc chép-tay bản vá engine giữa các site trở nên tốn kém. Runbook đường A:
  `SETUP-NEW-SITE.md`.
- **Ngày:** 2026-07-22   **Người soạn:** Cowork   **Người phê chuẩn:** (chủ dự án)
- **Loại quyết định:** cửa một chiều (định hình kiến trúc lõi dùng lại cho nhiều site)

> Vì sao hoãn: engine nhatrangtravel đã viết theo kiểu "engine đọc bảng cấu hình", nên bản
> thân nó đã đủ để dựng site mới bằng fork-and-edit — sửa `ROUTE_MAP`, `schemaTypes`,
> `DETAIL`, tham số ngôn ngữ/tiền tệ, xóa module thừa. Xây registry là code mới, có nguy cơ
> over-engineering cho một founder làm vài site. Đường A dùng lại code cũ nguyên trạng, chạy
> được ngay. Đổi sang B khi chi phí chép-tay vượt chi phí xây registry.
- **Kế thừa:** ADR-0001 (stack), ADR-0002 (mô hình entity), ADR-0003/0007 (seam giá),
  ADR-0004/0013/0014 (i18n + dịch), ADR-0008/0009/0010/0012/0018 (governance + cổng).
  Bối cảnh Core hai lớp: `playbook/` (luật) + engine (fork từ nhatrangtravel).

## Bối cảnh

nhatrangtravel là một site đơn: một địa phương (Nha Trang), một tập ngôn ngữ (vi/en/zh/ko/ru),
một danh mục 14 entity cố định. Engine của nó được viết kỷ luật theo kiểu "engine đọc bảng
cấu hình" nên phần gắn Nha Trang tụ về vài bảng (ROUTE_MAP, TYPE_LD_MAP, DETAIL/INDEX_QUERY/
HUB_PARTS_CONFIG, schemaTypes) chứ không rải trong logic.

Core cần phục vụ **nhiều loại doanh nghiệp** (khách sạn đơn lẻ, nhà hàng, công ty du lịch —
mỗi loại cần bộ entity khác nhau) và **nhiều địa phương** (Đà Lạt, Đà Nẵng, Quy Nhơn,
Singapore... thay cho Nha Trang). Không có ADR cũ nào nói về việc một engine phục vụ nhiều
site với danh mục module và địa phương khác nhau — vì nhatrangtravel không cần.

## Quyết định

Core **không gỡ** module nào. Giữ đủ 14 module entity như một **thư viện dùng chung**, và
thêm một lớp cấu hình để mỗi site chọn module nào bật và khai địa phương của mình. Ba thành phần:

1. **Module registry.** Mỗi entity type là một *module descriptor* khai một chỗ đủ mọi thứ
   của nó: schema Sanity, query GROQ, component detail, serializer JSON-LD, route
   (segment/label theo ngôn ngữ), bộ invariant. Các bảng mà engine đọc (ROUTE_MAP,
   schemaTypes, DETAIL/INDEX_QUERY, tập validator) **sinh ra từ danh sách module đang bật**,
   không viết tay lặp ở nhiều tầng. Đây là hợp nhất về một nguồn sự thật (P6, N7).

2. **Site config + preset.** Mỗi site có một file cấu hình duy nhất khai: địa phương (tên,
   domain), tiền tệ, tập ngôn ngữ, và danh sách module bật — hoặc chọn một **preset** dựng
   sẵn theo loại hình (ví dụ "khách sạn đơn lẻ" bật Hotel+Article+Person+Organization;
   "nhà hàng" bật Restaurant+Specialty+Article; "công ty du lịch" bật gần hết). Dựng site
   mới = sửa đúng file này, engine và registry không đụng.

3. **Tham số địa phương.** Mọi hằng số gắn Nha Trang thành tham số do site config cấp:
   tập ngôn ngữ (ADR-0004/0013), tiền tệ + pricing-unit (ADR-0007), địa danh, tri thức
   địa lý. Engine không nhắc tên site nào.

## Ranh giới cửa một chiều vs hai chiều (quan trọng — tránh mâu thuẫn ADR-0002)

ADR-0002 chốt "thêm/bớt entity là cửa một chiều cần ADR". Cơ chế preset không được phép
lách luật đó. Phân biệt tường minh:

- **Định nghĩa một entity type mới** trong Core (viết schema, gate, serialize, đăng ký vào
  registry) là **cửa một chiều cấp-Core, cần ADR mới**. Giữ nguyên tinh thần ADR-0002 và
  ADR-0005 (ADR-0005 làm mẫu quy trình đăng ký một module: audit field → cập nhật model →
  ADR trỏ về khung §5.1/§5.2).
- **Bật/tắt một entity mà Core đã định nghĩa** cho một site cụ thể là **cấu hình cửa hai
  chiều**: đảo lại rẻ, không cần ADR, chỉ sửa site config. Đây là điều ADR-0006 cảnh báo
  (đừng để "thi hành" biến thành "thiết kế mới không qua duyệt" — P8): bật/tắt là thi hành,
  định nghĩa mới là thiết kế.

## Lý do

- Kế thừa được ~60% số file (và nhiều hơn về công sức thật: seam giá, routing, JSON-LD
  builder, cơ chế validator, i18n) thay vì viết lại. Đúng mục tiêu "dùng lại code đã viết".
- Registry gom bảng entity về một nguồn (P6, N7) — sửa hiện trạng nhatrangtravel là các
  bảng này đang lặp ở nhiều tầng, dễ lệch.
- Preset biến "dựng site mới" thành việc sửa một file, phù hợp founder solo.
- Tôn trọng mọi ADR engine đã accepted; chỉ *nới* danh mục entity từ "cố định" sang "cấu
  hình", không phá luật nào.

## Phương án bị loại

- **Gỡ sạch entity thành lõi trống** (mỗi site tự viết lại schema/query/component): loại vì
  phí chính tài sản cần tái dùng; một khách sạn Đà Lạt phải dựng lại từ số không.
- **Giữ nguyên nhatrangtravel, copy-sửa cho mỗi site**: loại vì tạo N bản engine trôi dạt
  khỏi nhau, vi phạm N7 và mô hình hai tầng (ADR-0003 governance nói chung).
- **Kế thừa ADR-0019 (nới cổng)**: loại. 0019 là quyết định vận hành riêng nhatrangtravel,
  ngược triết lý fail-closed (ADR-0010/0018). Core mặc định fail-closed; site nào muốn nới
  tự ghi ADR riêng của site đó.

## Hệ quả

- Cần một `site.config.ts` (hoặc tương đương) làm nguồn sự thật cấu hình per-site, và một
  lớp registry sinh các bảng engine từ danh sách module bật.
- `validate-constraints` và các validator chỉ chạy invariant của module đang bật.
- Sanity Studio chỉ hiện schema của module bật.
- Mở nợ: bóc các bảng đang viết tay (ROUTE_MAP, TYPE_LD_MAP, DETAIL...) về registry là công
  việc kỹ thuật nhiều bước, phải giữ engine build được sau mỗi bước. Ghi backlog, làm theo
  tầng, kiểm build từng bước.
- Preset là dữ liệu, không phải code cứng: thêm preset mới (ví dụ "spa/resort") là cửa hai chiều.

## Liên quan

- Kế thừa: ADR-0001, 0002, 0003, 0004, 0007, 0008, 0009, 0010, 0012, 0013, 0014, 0018.
- Không kế thừa: ADR-0005, 0006 (module tùy chọn, không lõi), ADR-0019 (ngược fail-closed).
- Đặc tả engine liên quan: `docs/core-specs/01-CONTENT_MODEL.md`, `05-URL_MAP`, `08-SCHEMA_PLAN`.
