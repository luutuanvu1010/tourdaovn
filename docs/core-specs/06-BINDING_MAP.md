# 06 — BINDING MAP (bước 6: khung trang và ánh xạ dữ liệu)

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Nguồn: nhatrangtravel/project/06-BINDING_MAP.md · Nhóm B (khuôn phương pháp giá trị)
Khuôn tái dùng CAO: triết lý "mỗi vùng phải trỏ về field thật, vùng không trỏ được là vẽ bừa",
chính sách vùng rỗng ẩn hẳn (không placeholder/CTA giả), khung chung + delta từng entity,
container policy + hợp đồng layout có validator (entity-layout-post.ts), Hero mosaic pattern.
Phần riêng site cần thay (tìm 🔧 SITE-SPECIFIC):
  - Bảng delta cho entity Nha Trang cụ thể (I-Resort tắm bùn, TouristDestination=Nha Trang).
Phần KHÔNG nhãn (triết lý binding, chính sách vùng rỗng, khung chung+delta, container policy) = khuôn.
═══════════════════════════════════════════════════════════════════ -->

> Tiền điều kiện cứng của mọi việc thiết kế: chưa duyệt file này thì cấm vào bước 7 (N1, cổng Design). Mỗi vùng trên mỗi loại trang khai rõ nó ăn dữ liệu từ đâu; vùng nào không trỏ được về một field thật là vùng vẽ bừa. Cowork soạn, chủ dự án duyệt.
>
> 🔧 **SITE-SPECIFIC:** các bảng delta theo entity cụ thể là của nhatrangtravel. Giữ *triết lý binding + khung chung + container policy*; thay *bảng delta* theo entity của site.

- **Trạng thái:** đã duyệt, founder phê chuẩn toàn văn 2026-06-12 (kèm hai quyết định Q1, Q2 chốt cùng lần phê chuẩn, xem quyết định nền 4 và 5)
- **Ngày:** soạn và phê chuẩn 2026-06-12   **Người soạn:** Cowork   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Liên quan:** `01-CONTENT_MODEL.md` v1.0.2 (nguồn sự thật field), `05-URL_MAP-and-DB_SCHEMA.md` đã duyệt (cây trang), `02-SAD.md` 3.1 (prices.yaml), `04-CONSTRAINTS.md` (I6, I16, PY, R), ADR-0003, ADR-0004, ADR-0007.

## 0. Quyết định nền (founder chốt qua trắc nghiệm 2026-06-12)

1. Tổ chức theo khung chung cộng delta: một bảng khung chung cho các vùng mọi trang chi tiết entity đều có, mỗi loại trang một bảng ngắn chỉ ghi vùng riêng. Cùng triết lý 2.0 và LodgingBase của content model: định nghĩa một lần, không lặp.
2. Chính sách vùng rỗng mặc định toàn file: field không bắt buộc mà rỗng thì vùng không render, không placeholder, không khung trống. Vùng bắt buộc đã có gate chặn từ trước khi publish nên không có trạng thái rỗng trên trang sống. Bảng chỉ ghi cột "Khi rỗng" khi ứng xử khác mặc định.
3. Vùng giá và CTA đặt: entity thương mại publish mà chưa nối bookingRef thì vùng giá và nút đặt không render, trang thuần nội dung, không CTA giả, không nhãn chờ. isAccessibleForFree = true hiện nhãn miễn phí (luật sẵn có 2.4, 2.10). Trỏ hụt không phải trạng thái trang: PY4 chặn từ build.
4. Index nhánh có 0 entity publish không sinh trang; header gỡ link nhánh đó cho tới khi có entity đầu tiên, trang tự mọc khi có dữ liệu, không cần redirect vì chưa từng tồn tại. Cùng tinh thần R2 và completeness over coverage; hệ quả là header điều hướng theo ngôn ngữ chỉ hiện nhánh có dữ liệu. (Q1, chốt cùng phê chuẩn 2026-06-12.)
5. Card Article ở listing hiện nhãn tác giả (author deref Person.title): tín hiệu E-E-A-T hiện từ listing, nhất quán với hộp tác giả trong bài. (Q2, chốt cùng phê chuẩn 2026-06-12.)

## 1. Quy ước đọc bản ánh xạ

- Ba tầng tách rõ theo 01 mục 6: field của entity, rollup suy ở build, trình bày của template. Trong bảng, nguồn ghi `entity.field` là field thật; ghi `rollup (build)` là suy GROQ ngược, cấm lưu thành field (P6); ghi `config (build)` là cấu hình build tập trung (vd map prefix 05 mục 1.2), không phải dữ liệu Sanity; ghi `decor` là phần tử trang trí thuần.
- Vùng vô hình vẫn là vùng: JSON-LD (I6, serialize theo 01 mục 5), meta seo, hreflang (R4) khai trong bảng site-wide, không khai lặp từng trang.
- Field quản trị (reviewStatus, approvedBy, contentProvenance, publishedAt) không render. updatedAt là ngoại lệ: S2.4 buộc hiện cả HTML lẫn JSON-LD.
- imageProvenance không render mặc định phase 1, là dữ liệu quản trị mức entity; nếu Design muốn hiện dòng credit ảnh thì dữ liệu đã sẵn, quyết ở bước 7.
- Giá không bao giờ là field Sanity: mọi vùng giá ăn từ `prices.yaml` qua khóa `bookingRef` (ADR-0007, SAD 3.1), build render trọn nhãn kèm đơn vị (I16).

## 2. Khung site-wide (mọi trang)

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Header điều hướng | config (build): 4 hub cộng các nhánh entity theo 05 mục 1.2 | có | nhánh 0 entity publish không hiện link (quyết định nền 4) | nhãn nhánh theo ngôn ngữ, từ map prefix |
| Chuyển ngôn ngữ | bản dịch tồn tại của trang: field-level theo slug ngôn ngữ có giá trị; Article theo translationGroup (I7) | có | ngôn ngữ chưa có bản dịch không hiện trong switcher | khớp hreflang hai chiều, không link trang chưa tồn tại (R4) |
| Footer | config (build) cộng decor | có | — | không field Sanity phase 1 |
| Kênh liên hệ (sidebar booking + footer) | siteSettings.contact | tùy | field con nào trống thì kênh đó không render; cả 3 kênh sidebar (zaloUrl/hotline/whatsapp) trống thì cả cụm ẩn; footer bớt kênh đó, còn 0 kênh thì bỏ hẳn mục liên hệ | sidebar chỉ render trên Tour, Hotel, Resort, Experience (component ContactChannels); footer render mọi trang; telephone/email cùng nguồn dùng cho Organization JSON-LD trang chủ (guard rỗng §5.1) — thêm v1.0.11 (CONV-01) |
| Meta title, description | seo.metaTitle, seo.metaDescription | nên có | fallback title và summary | trang listing và term sinh từ name, description (2.13) |
| hreflang, canonical | build từ bản dịch tồn tại; canonical host apex, URL có `/` cuối | có | — | 05 mục 1.1, R4 |
| JSON-LD | toàn bộ field theo quy tắc serialize 01 mục 5 và bảng @type 05 mục 2 | có | — | hợp lệ 100% (I6), validator CI |

## 3. Khung chung trang chi tiết entity

Áp cho mọi trang chi tiết. Vùng nào entity không có field tương ứng trong 01 thì vùng đó không tồn tại trên loại trang đó (ghi rõ ở delta khi đáng chú ý). Mặc định vùng rỗng theo quyết định nền 2.

**Hợp đồng layout chung có kiểm máy (2026-06-29):** trang chi tiết entity phải đi qua primitive chung `Hero`, `Section`, `Gallery` hoặc component wrapper chung tương đương như `LodgingDetail`. Khi đổi bố cục chung, màu, token chữ, spacing, pattern trong primitive/token thì các entity kế thừa cùng đổi. `scripts/validators/entity-layout-post.ts` chạy trong `validate:post` để chặn drift: entity detail mới phải được khai báo trong hợp đồng; Hotel/Resort phải delegate qua `LodgingDetail`; các ngoại lệ legacy còn lại phải được ghi danh rõ trước khi được sửa tiếp.

**Container policy (chốt 2026-06-30):** mọi component visible trong detail phải tự bọc `<div class="container">`, hoặc được bọc bởi một primitive đã có container (Hero, Section, FAQ, Gallery). Không element nào được render trần ra ngoài container. Quy tắc này áp cho cả shared component (Breadcrumb, AuthorityMeta, FAQ) lẫn element nội dòng trong detail (.updated, .badge-row, .summary-block...). Guard `entity-layout-post.ts` có tầng containment check riêng để bắt vi phạm — đây là tầng thứ hai sau component selection check.

| Vùng giao diện | Dữ liệu nuôi (entity.field) | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Breadcrumb | containedInPlace deref thành chuỗi cha (build) | có với entity có containedInPlace | entity không có quan hệ cha (Article, Person, Organization, Event, Experience, Specialty, Tour) dùng nhánh URL: tên nhánh theo 05 mục 1.2 | quan hệ là dữ liệu, breadcrumb là trình bày (05 mục 1.1) |
| Hero | title cộng mainImage (kèm alt); gallery đủ 4 ảnh sau khi loại trùng mainImage thì đi qua Hero mosaic | title có (gate); mainImage nên có | thiếu mainImage thì hero thuần chữ; gallery dưới 4 ảnh thì hero ảnh đơn; không ảnh placeholder | desktop đủ 4 gallery: ảnh chính bên trái, gallery 2x2 bên phải kiểu Hotel với 4 ô bằng nhau; mobile: ảnh chính trên, thumbnail strip 4 ô đều dưới; alt bắt buộc khi có ảnh (2.0) |
| Đoạn mở | summary | có (gate, I10) | — | tự đứng được như câu trả lời hoàn chỉnh; nguồn speakable |
| Thân bài | body (portable text) | nên có | ẩn (mặc định) | ảnh inline trong body với Article |
| Gallery | gallery (kèm alt từng ảnh) | nên có với entity có field | ẩn | Không render gallery section rời trên detail; gallery detail phải đi qua Hero mosaic. Article, Person, Organization, Category không có field này |
| Điểm nổi bật | highlights | tùy | ẩn | Event, Organization, Person, Specialty không có field này |
| Hỏi đáp | faq | tùy | ẩn | nuôi FAQPage trong JSON-LD; Person, Organization không có field này |
| Phân loại | category deref Category | tùy | ẩn | chỉ term thuộc bộ có trang công khai render thành link tới trang term; general-category không render (2.13) |
| Ngày cập nhật | updatedAt | có | — | S2.4, hiện cả HTML |
| Vùng giá cộng CTA đặt | prices.yaml qua bookingRef | chỉ entity thương mại | ẩn cả vùng, không CTA giả (quyết định nền 3) | hình dạng nhãn theo entity, xem delta |

## 4. Delta từng loại trang chi tiết

### 4.1 Trang điểm đến `/{destinationSlug}/` (TouristDestination)

Trang TouristDestination giữ vai điều phối điểm đến, nhưng không còn là trang chủ site. Trang chủ `/` dùng SiteHome/WebSite riêng và trỏ vào trang điểm đến, ví dụ `/nha-trang/`. Khung chung áp dụng, cộng:

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Trust bar | config (build) | có | luôn hiện | cam kết hệ thống về nội dung duyệt, dữ liệu có nguồn, cập nhật rõ; không phải CTA marketing |
| Số liệu nhanh | keyFacts | nên có | ẩn | cho người và máy |
| Custom banners | homepageBanners active | tùy | ẩn | tối đa 3 banner, xếp theo priority; toàn card click nếu có linkUrl; không render Offer JSON-LD |
| Khối featured (5 khối) | featuredAttractions, featuredStays, featuredExperiences, featuredSpecialties, featuredTours deref | tùy | khối nào rỗng ẩn khối đó | chỉ trỏ entity đã publish (2.1) |
| Lối vào 4 hub | config (build): 4 hub 05 mục 1.3 | có | — | rollup đếm số entity mỗi hub là tùy chọn Design, dữ liệu sẵn từ build |
| Các khu vực nên biết | rollup (build): Place approved, ưu tiên area, beach, island, landform, ward | tùy | ẩn | tối đa 4 card, URL từ ROUTE_MAP |
| Cẩm nang bản địa | rollup (build): Article approved theo language, ưu tiên transport-guide, itinerary, guide | tùy | ẩn | tối đa 4 card; Article dùng document-level i18n |
| Điểm đến liên quan | relatedDestinations | tùy | ẩn | |
| Lưu ý an toàn | safetyNote | tùy | ẩn | theo mùa |
| Ngày cập nhật nhẹ | updatedAt | có nếu có | ẩn nếu thiếu | trust signal S2.4, hiển thị gần cuối trang, không biến thành banner cảnh báo |
| speakable | build từ summary và faq | có | — | vùng vô hình, S2.4 |

### 4.2 Place `/dia-danh/{slug}`

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Bản đồ, vị trí | geo cộng address; hasMap link ngoài | tùy | ẩn khi thiếu geo/address/hasMap | addressLocality là phường hiện hành (I15) |
| Cách tới nơi | accessInfo | tùy | ẩn | |
| Giờ và vé | openingHours, isAccessibleForFree | tùy | ẩn | chỉ nơi có quản lý; Place không có vùng giá |
| Vùng con | containsPlace rollup (build) | — | ẩn | reverse containedInPlace |
| Trải nghiệm tại đây | rollup (build) từ Experience.venue ngược | — | ẩn | |

### 4.3 Attraction `/diem-tham-quan/{slug}`

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Bản đồ, vị trí | geo cộng address; hasMap | tùy | ẩn khi thiếu geo/address/hasMap | I2 rẽ nhánh theo attractionType; geo/address không phải gate |
| Nguồn chính thức | officialSource | gate với nhóm venue | ẩn với nhóm bách khoa không điền | |
| Giờ và miễn phí | openingHours, isAccessibleForFree | nên có với nơi bán vé | ẩn | |
| Cách tới nơi | accessInfo | tùy | ẩn | |
| Vùng vé vào cửa | prices.yaml qua bookingRef | nên có với nơi bán vé | ẩn cả vùng | giá trực tiếp kèm đơn vị; giá gói hoạt động đi qua Experience (2.3). **Ngoại lệ (chốt 2026-06-12):** venue thương mại có nhiều gói vé (như I-Resort: tắm bùn, tắm thảo dược, spa) dùng dạng "từ X₫" thay giá trực tiếp. |
| Trải nghiệm tại đây | rollup (build) từ Experience.venue ngược | — | ẩn | |
| Sự kiện tại đây | rollup (build) từ Event.location ngược | — | ẩn | |

### 4.4 Experience `/trai-nghiem/{slug}`

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Loại trải nghiệm | experienceType deref Category | có (gate I13) | — | link tới trang term khi term đã có trang (R2); chưa có trang thì hiện chữ không link |
| Diễn ra tại | venue deref | có (gate I13) | — | link trang Attraction, Hotel, Resort hoặc Place |
| Thời lượng | duration | tùy | ẩn | render theo locale ở build |
| Gồm những gì | includes | tùy | ẩn | |
| Phù hợp với | touristType | tùy | ẩn | |
| Vùng giá cộng CTA | prices.yaml qua bookingRef | nên có với trải nghiệm trả phí | ẩn cả vùng; isAccessibleForFree = true hiện nhãn miễn phí thay vùng giá | giá trực tiếp kèm đơn vị kiểu "120k/người" (I16) |

### 4.5 Restaurant `/nha-hang/{slug}`

Không vùng giá: entity Sanity-only, không bookingRef (2.5). Kênh hành động chính là telephone.

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Bản đồ, vị trí | geo cộng address | tùy | ẩn khi thiếu geo/address | |
| Nguồn chính thức | officialSource | có (gate I3) | — | website hoặc fanpage |
| Món đặc sản phục vụ | servesSpecialty deref | nên có | ẩn | link trang Specialty |
| Ẩm thực | servesCuisine | nên có | ẩn | |
| Giờ mở cửa | openingHours | tùy | ẩn | |
| CTA gọi điện | telephone | tùy | ẩn, không CTA giả | |
| Đặt bàn | acceptsReservations | tùy | ẩn | |
| Menu | hasMenu link ngoài | tùy | ẩn | giá nếu có sống ở đó, không lưu (I1) |

### 4.6 Specialty `/dac-san/{slug}`

Không vùng giá, không bookingRef (2.14).

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Loại | specialtyType | có (gate) | — | dish hay product, đổi trình bày không đổi @type |
| Gốc gác | originNote | tùy | ẩn | |
| Mùa ngon | season | tùy | ẩn | |
| Nơi nên thử | whereToTry deref Restaurant | tùy | ẩn | tuyển chọn biên tập 2 đến 3 quán (I17) |
| Ăn ở đâu (đầy đủ) | rollup (build) từ Restaurant.servesSpecialty ngược | — | ẩn | nguồn duy nhất của danh sách đầy đủ |

### 4.7 Hotel `/khach-san/{slug}` và Resort `/resort/{slug}` (LodgingBase)

Một delta chung, khớp 2.0b. Khác nhau chỉ ở ba vùng cuối.

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Bản đồ, vị trí | geo cộng address | tùy | ẩn khi thiếu geo/address | |
| Nguồn chính thức | officialSource | có (gate I3) | — | |
| Hạng sao | starRating | tùy | ẩn | |
| Tiện ích | amenityFeature | tùy | ẩn | |
| Giờ nhận trả phòng | checkinTime, checkoutTime | tùy | ẩn | |
| Số phòng, thú cưng | numberOfRooms, petsAllowed | tùy | ẩn | |
| Ra biển | beachAccess | nên có | ẩn | không suy được từ geo (2.0b) |
| Cách tới nơi | accessInfo | tùy | ẩn | resort đảo, khu xa trung tâm |
| Cách sân bay | suy (build) từ geo | — | ẩn khi thiếu geo | "cách sân bay ~X km", không phải field (2.0b) |
| Vùng giá cộng CTA | prices.yaml qua bookingRef | nên có | ẩn cả vùng | dạng "từ X, cập nhật [ngày]" lấy asOf từ nguồn giá (I16, quyết định nền 9 của 01) |
| Riêng Resort: sát biển, diện tích | beachfront, landArea | tùy | ẩn | |
| Riêng Resort: hoạt động tại chỗ | onSiteActivities | tùy | ẩn | có thể trỏ Experience, render link |

### 4.8 Tour `/tour/{slug}`

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Hành trình (timeline có thứ tự) | itinerary: mỗi stop deref Attraction hoặc Place, hoặc externalStop {name, geo, sameAs}; note; durationAtStop | có ≥1 stop (gate I14) | — | serialize ItemList giữ thứ tự; stop nội vùng link trang entity, externalStop chữ không link |
| Đơn vị vận hành | operator deref Organization | có (gate I14) | — | link `/cong-ty/{slug}`; serialize provider |
| Hình thức tour | tourFormat | có (gate I14) | — | join-in, private hoặc both; nhãn hiển thị cho khách |
| Xuất phát từ | tripOrigin deref | nên có | ẩn | |
| Ngày điển hình | departureNote | tùy | ẩn | không phải lịch chỗ trống (I1) |
| Thời lượng | duration | nên có | ẩn | render theo locale |
| Gồm gì, không gồm gì | includes, excludes | nên có | ẩn từng khối riêng | chỗ phát sinh hiểu lầm nhiều nhất (2.8) |
| Phù hợp với | touristType | tùy | ẩn | |
| Lưu ý mùa | seasonNote | tùy | ẩn | |
| Vùng giá cộng CTA | prices.yaml qua bookingRef | nên có | ẩn cả vùng | perPax mọi hình thức (I14); tour riêng hiện tiers theo cỡ nhóm từ nguồn giá |

### 4.9 Event `/su-kien/{slug-kỳ}`

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Thời gian | startDate, endDate | startDate có (gate I5) | endDate rỗng chỉ hiện startDate | |
| Nhãn trạng thái | eventStatus cộng nhãn đã diễn ra suy (build) từ endDate | tùy | quá endDate hiện nhãn đã diễn ra ở tầng trình bày (I5); JSON-LD giữ nguyên sự thật lịch sử | |
| Diễn ra tại | location deref Place hoặc Attraction | có (gate I5) | — | link trang entity |
| Tổ chức bởi | organizer deref Organization | tùy | ẩn | link `/cong-ty/{slug}` |
| Vùng vé (3 nhánh, đúng thứ tự ưu tiên) | 1 bookingRef qua prices.yaml; 2 ticketUrl link ngoài; 3 isAccessibleForFree nhãn miễn phí | tùy | cả ba rỗng thì ẩn cả vùng | luật 2.10; sự kiện đã qua ẩn CTA vé, giữ nội dung |

### 4.10 Article `/cam-nang/{slug}`

Không gallery (ảnh inline trong body, 2.11). Document-level: mỗi ngôn ngữ một document, switcher theo translationGroup.

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Nhãn chuyên mục | articleType | có (gate) | — | xuất articleSection trong JSON-LD |
| Hộp tác giả | author deref Person: title, mainImage, summary | có (gate I4) | — | link `/tac-gia/{slug}`, tín hiệu E-E-A-T |
| Ngày đăng, ngày sửa | publishedAt, updatedAt | có | — | datePublished, dateModified |
| Mục lục, thời gian đọc | suy (build) từ body | tùy Design | ẩn với bài ngắn | không phải field (N1, P6) |
| Hướng dẫn từng bước | howTo | gate transport-guide: ít nhất một trong howTo, faq | ẩn | serialize HowTo |
| Nói về | about deref | nên có | ẩn | card link tới entity được nói tới |
| Bài liên quan | rollup (build) từ about và category chung | — | ẩn | 2.11 loại có chủ ý relatedArticles field |

### 4.11 Person `/tac-gia/{slug}`

Không có index `/tac-gia/` trong cây 05; trang chỉ đến từ hộp tác giả. Không body, gallery, highlights, faq (2.12). Hero luôn đủ: mainImage trong gate.

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Giới thiệu | bio (portable text) | có (gate) | — | thay vai body |
| Vai trò, am hiểu | jobTitle, knowsAbout | nên có | ẩn | topical authority |
| Hồ sơ bên ngoài | sameAs ≥1, url | sameAs có (gate) | url rỗng ẩn | link hồ sơ thật, E-E-A-T |
| Bài đã viết | rollup (build) từ Article.author ngược | — | ẩn (không xảy ra trên trang sống: Person tồn tại vì Article cần) | |

### 4.12 Organization `/cong-ty/{slug}`

Không gallery, highlights, faq (2.9). Không vùng giá (cấm mọi field giá vốn, I1).

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Logo | logo | nên có | ẩn, hero dùng mainImage hoặc thuần chữ | tách khỏi mainImage (2.9) |
| Loại đơn vị | orgType | có | — | nhãn theo enum |
| Website, nguồn xác minh | url, officialSource | có (gate I3) | — | |
| Văn phòng | geo, address | tùy | ẩn | chỉ khi có văn phòng đón khách thật |
| CTA gọi điện | telephone | tùy | ẩn | |
| Giấy phép | licenseInfo | tùy | ẩn | tín hiệu trust đặc thù VN |
| Tour vận hành | rollup (build) từ Tour.operator ngược | — | ẩn | I18 bảo đảm có ít nhất một quan hệ vào |
| Sự kiện tổ chức | rollup (build) từ Event.organizer ngược | — | ẩn | |

## 5. Trang danh sách

### 5.1 Card chuẩn (pattern dùng chung mọi listing)

| Vùng trong card | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Ảnh | mainImage kèm alt | nên có | card thuần chữ, không ảnh placeholder | |
| Tiêu đề, link | title cộng URL từ slug | có | — | |
| Mô tả ngắn | summary (cắt ở build) | có | — | |
| Nhãn phụ | theo entity: attractionType, experienceType, tourFormat, starRating, eventType cộng startDate, articleType cộng author | tùy | ẩn | một nhãn, không nhồi |
| Nhãn giá | prices.yaml qua bookingRef | chỉ entity thương mại | ẩn | "từ X" với lodging; giá trực tiếp với Experience, Tour; quyết định nền 3 |

### 5.2 Index nhánh entity (`/dia-danh/`, `/diem-tham-quan/`, `/trai-nghiem/`, `/nha-hang/`, `/dac-san/`, `/khach-san/`, `/resort/`, `/tour/`, `/cam-nang/`)

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Tiêu đề, mô tả nhánh | config (build) theo ngôn ngữ | có | — | không phải field entity nào |
| Lưới card | mọi entity publish cùng _type, card 5.1 | có | nhánh 0 entity không sinh trang index (quyết định nền 4) | phase 1 hiện tất, chưa phân trang (05 mục 1.1) |
| Lối lọc theo term | các term có trang (R2) của nhánh | chỉ `/trai-nghiem/` và `/tour/` | ẩn khi chưa term nào đủ R2 | link tới trang term, không phải filter client |
| JSON-LD | CollectionPage cộng ItemList | có | — | I6 |

Thứ tự sắp xếp card là trình bày, Design quyết ở bước 7; dữ liệu đủ cho mọi lựa chọn (publishedAt, updatedAt, title, startDate với Event).

### 5.3 Bốn hub (`/kham-pha/`, `/luu-tru/`, `/am-thuc/`, `/di-lai/`)

Cấu trúc như 5.2, khác nguồn lưới card:

| Hub | Nguồn lưới card (rollup build) | Ghi chú |
|---|---|---|
| `/kham-pha/` | Attraction cộng Experience publish | hai khối hoặc trộn, Design quyết; lối vào nhánh con và term |
| `/luu-tru/` | Hotel cộng Resort publish | lằn ranh theo sản phẩm chính hiện qua nhãn phụ |
| `/am-thuc/` | Restaurant cộng Specialty publish | |
| `/di-lai/` | Article articleType = transport-guide publish | card dùng nhãn phụ author; hub mỏng nhất phase 1 |

### 5.4 Term listing (`/trai-nghiem/{term}`, `/tour/{term}`)

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Tiêu đề | Category.name | có (gate 2.13) | — | |
| Đoạn định nghĩa | Category.description | có (gate 2.13) | — | meta sinh từ đây (2.13) |
| Lưới card | rollup (build): entity publish trỏ term qua experienceType hoặc category | có ≥1 (R2) | trang không sinh khi 0 entity (R2), không có trạng thái rỗng | |
| JSON-LD | CollectionPage cộng ItemList cộng DefinedTerm | có | — | additionalType từ Category.sameAs khi có |

### 5.5 Index sự kiện `/su-kien/`

Như 5.2, riêng lưới card chia hai khối ở build (05 mục 1.1): sắp tới (endDate hoặc startDate chưa qua, xếp startDate tăng dần) và đã diễn ra (xếp startDate giảm dần). Card Event dùng nhãn phụ eventType cộng startDate; card khối đã qua kèm nhãn đã diễn ra.

### 5.6 Trang 404

Toàn trang là config (build) cộng decor: thông điệp, link về `/` và 4 hub. Không field Sanity, không vào sitemap (05 mục 1.3).

## 6. Quy tắc chung

- Mọi field xuất hiện ở đây phải tồn tại trong `01-CONTENT_MODEL.md`. Cần field mới: quay lại sửa content model trước, không bịa tại đây.
- Trạng thái rỗng và trạng thái lỗi là một phần của bản ánh xạ, không phải việc để Design tự nghĩ. Mặc định toàn file theo quyết định nền 2; bảng chỉ ghi ngoại lệ.
- Trạng thái lỗi dữ liệu không tồn tại trên trang sống: gate publish (I12, I19) chặn entity thiếu field bắt buộc, PY4 và họ ref integrity chặn trỏ hụt từ build. Trang chỉ có hai trạng thái: vùng có dữ liệu và vùng ẩn.
- Phần tử trang trí thuần (không mang dữ liệu) ghi rõ `decor` để khỏi tranh cãi.

## 7. Điều kiện mở cổng Design

Chủ dự án xác nhận: mọi loại trang trong cây URL của 05 đều có bảng ánh xạ (16 mẫu URL của 05 mục 1.3 phủ bởi mục 2 đến 5.6), không vùng nào mồ côi dữ liệu. Đã xác nhận khi phê chuẩn 2026-06-12: cổng Design (bước 7) mở.
