# ADR-0002 — Mô hình entity nền tảng nhatrangtravel.net

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
ADR gốc, bất biến — KHÔNG sửa nội dung. Ghi chú này chỉ nói cách Core diễn giải lại.
ENGINE (giữ nguyên, tái dùng mọi site): khung serialize §5.1, entity-test §5.2, quy tắc
  mỗi entity map một @type schema.org, gate completeness theo họ.
CẦN TỔNG QUÁT HÓA: "danh mục 13/14 entity" là của nhatrangtravel. Trong Core, danh mục
  entity KHÔNG cố định — nó do site config + preset loại hình cấp (ADR-0020). Việc *định
  nghĩa* một entity type mới vẫn là cửa một chiều cần ADR cấp-Core; việc *bật/tắt* một
  entity Core-đã-định-nghĩa cho một site là cấu hình cửa hai chiều. Xem ADR-0020.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** accepted, phê chuẩn 2026-06-10
- **Ngày:** 2026-06-10   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa một chiều (đổi entity về sau cần ADR mới)
- **Liên quan:** `project/01-CONTENT_MODEL.md` v0.2.0, `DECISIONS.md` 2026-06-10

## Bối cảnh

Bước 1 content model định nghĩa danh mục entity. Đổi, thêm, bỏ một entity type là cửa một chiều vì nó lan ra schema Sanity, GROQ, cấu trúc URL, JSON-LD và validator CI. Theo CONSTITUTION Điều 7.2 và mục 5 của content model, quyết định này cần một ADR, không chỉ một dòng chat.

Bản v0.1 chốt 8 entity. Trong phiên rà soát cùng ngày, founder phản biện và bổ sung tri thức ngành (tour, trải nghiệm, khách sạn, resort, vận tải) cùng một dữ kiện hành chính 2025. Qua bốn vòng đối thoại có tra cứu schema.org, danh mục được sửa lên v0.2 gồm 13 entity type.

## Quyết định

Danh mục 13 entity type, mỗi cái map sang một schema.org @type (chi tiết ở content model v0.2 mục 1): TouristDestination, Place, Attraction, Experience, Restaurant, Hotel, Resort, Tour, Organization, Event, Article, Person, Category.

Các quyết định cấu trúc kèm theo:

- Experience là entity nối, hiện thực hóa quan hệ nhiều-nhiều giữa loại trải nghiệm (Category, bộ experience-type) và điểm đến (Attraction, Hotel, Resort, Place). Giữ nội dung ở Sanity, giá ở booking.
- Hotel và Resort tách hai entity trên một base chung LodgingBase, vì là hai subtype tường minh của schema.org LodgingBusiness và khác search intent, nhưng chia sẻ field để không trôi.
- Tour map schema.org/TouristTrip, chỉ giữ mặt nội dung, không giá.
- Organization thu về đúng vai đơn vị vận hành (lữ hành, vận tải, lặn, DMC), bỏ orgType lodgingBusiness vì đã có Hotel và Resort.
- Vận tải không phải entity. Xử bằng Article articleType=transport-guide kèm HowTo hoặc FAQPage. Nâng lên entity Transfer sau khi có booking và dữ liệu tuyến thật, đó là cửa hai chiều.
- TouristDestination Nha Trang là điểm đến, không phải đơn vị hành chính. containedInPlace trỏ tỉnh Khánh Hòa mới (đã nhập Ninh Thuận 2025), bỏ cấp thành phố. Cấm chuỗi "thành phố Nha Trang" (bất biến I15).
- schema.org là đích serialize, không phải nguồn sự thật. Nguồn sự thật là content model. Khi không type nào vừa, model theo nhu cầu rồi serialize qua type gần nhất cộng additionalType; cấm property bịa dưới namespace schema.org.

## Lý do

- Tour, Experience, Hotel, Resort là nội dung thật founder có và có search intent rõ, nên đậu bài test entity (mục 5.2 content model), không phải entity rỗng.
- Quan hệ nhiều-nhiều của trải nghiệm (tắm bùn ở nhiều điểm, một điểm nhiều trải nghiệm) không biểu diễn được bằng facet phẳng, nên cần entity nối.
- Hotel và Resort là hai schema.org type tường minh, dùng đúng subtype mở khóa starRating, amenityFeature và cho AI tín hiệu rõ hơn (tài liệu schema.org hotels).
- Vận tải không có type thông tin sạch trong schema.org; BusTrip là chuyến cụ thể gắn đặt vé, ép dùng sẽ lệch ngữ nghĩa và kéo về booking. Article cộng HowTo/FAQPage là định dạng tối ưu cho intent tìm kiếm thông tin di chuyển.
- Cải cách hành chính 2025 bỏ cấp huyện và xóa "thành phố Nha Trang"; thương hiệu du lịch không trùng ranh giới hành chính nào, nên TouristDestination là model đúng, không chỉ tiện.

## Phương án bị loại

- Giữ 8 entity v0.1: loại vì bỏ tour, trải nghiệm, lưu trú vốn là nội dung có search value cao.
- Gộp Hotel và Resort một entity Lodging dùng field lodgingType: loại theo phản biện founder, vì hai type schema.org tường minh và khác search intent; giữ base chung là đủ chống trôi.
- Experience là facet phẳng trên Attraction: loại vì không biểu diễn sạch nhiều-nhiều và trùng venue.
- Experience là entity với giá trong Sanity: loại vì vi phạm S2.2; giá thuộc booking.
- Entity Transfer/Route structured ngay phase 1: loại vì chưa đủ dữ liệu nhà xe và lịch thật, dễ thành entity mỏng.
- Coi schema.org là giới hạn cứng cho việc model: loại vì schema.org là đích xuất có cơ chế mở rộng, không phải nguồn sự thật.

## Hệ quả

- Đổi, thêm, bỏ entity về sau là cửa một chiều, cần ADR mới.
- Bất biến I1 đến I15 là nháp cho `project/04-CONSTRAINTS.md`, sẽ do CI enforce.
- Booking phải cấp giá và tồn kho cho Experience, Tour, Hotel, Resort qua đồng bộ một chiều khi có spec; trước đó các entity này publish được ở mặt nội dung mà không có giá.
- Entity Transfer là khoản mở có chủ ý, kích hoạt khi có booking và dữ liệu tuyến.
- Khung serialize 5.1 và bài test entity 5.2 trở thành luật chung cho mọi lần thêm bớt entity sau này.
