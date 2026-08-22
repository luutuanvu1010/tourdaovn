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

- **Phiên bản:** v2.1.0   **Trạng thái:** v2.0.0 là bản mở cổng bước 7 ngày 2026-08-06 (QĐ-2026-08-06-06); **v2.1.0 (đợt 4B) duyệt 2026-08-22, QĐ-2026-08-22-02** — chỉ §3, §3.1, §6 và bốn dòng chú ở §4 đổi
- **Ngày:** v1 soạn và phê chuẩn 2026-06-12; v2 soạn 2026-08-05; v2.1 soạn 2026-08-22   **Người soạn:** Cowork   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Liên quan:** `01-CONTENT_MODEL.md` v1.0.14 (nguồn sự thật field), `05-URL_MAP-and-DB_SCHEMA.md` (cây trang), `02-SAD.md` 3.1 (prices.yaml), `04-CONSTRAINTS.md` (I6, I16, PY, R), `src/site.config.ts` (phạm vi site, ADR-0021), ADR-0003, ADR-0004, ADR-0007, ADR-0023 (điều hướng).

> **Đổi gì ở v2.** Đóng DR-005 (khai loại trang không tồn tại, thiếu loại trang đang chạy), DR-007 phần đặc tả, DR-011 (`organization.sameAs`). Bốn entity `restaurant`, `specialty`, `event` đang tắt ở `site.config.ts` nên bảng của chúng chuyển xuống phụ lục §8. Thêm bảng cho trang chủ, hai trang tĩnh, trang lộ trình. §7 viết lại cho đúng sự thật.
>
> **Đổi gì ở v2.1 (đợt 4B, QĐ-2026-08-22-01).** Đóng DR-032 ở tầng đặc tả: mỗi field hiển thị của trang chi tiết được khai **đúng một vùng** (ma trận §3.1); vùng mới **Thông tin nhanh** thay cặp `InfoBar` + `InfoCard`; khung chung thêm ba vùng đang có trong code mà chưa có hàng (thanh dính, khối hành động, bản đồ); nhãn loại chỉ còn ở hero (bỏ chữ "hoặc"); thân bài có mục lục; luật 1–3 vào §6. Với Tour, khối hành động là `BookingForm` (ADR-0027). Không đổi field nào của `01`.
>
> **Cảnh báo hiệu lực (DR-027).** Bộ kiểm máy `g3` **không đọc file này** — nó đối chiếu một bản chép tay nằm trong chính mã validator. Sửa file này không làm đổi thứ máy kiểm cho tới khi cơ chế được xử. Đừng coi `g3` xanh là bằng chứng file này đúng.

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
- **Quy ước tên field (thêm v2).** Mọi tên field Sanity trong cột "Dữ liệu nuôi" viết trong dấu backtick, ví dụ `geo`. Chữ ngoài backtick là văn xuôi giải thích, không phải tên field. Quy ước này để một bộ kiểm máy có thể đọc thẳng bảng ở đây thay vì giữ bản chép thứ hai (DR-027).
- **Vùng không áp dụng cho một entity** ghi ở cột "Ghi chú" theo đúng khuôn `không áp dụng: <entity>, <entity>` để máy đọc được, thay vì viết thành câu.

## 2. Khung site-wide (mọi trang)

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Header điều hướng | config (build): khối `nav` trong `src/site.config.ts` | có | mục `kind: 'zalo'` chưa có `zaloUrl` thì tự ẩn; mục trỏ tới trang không tồn tại làm **dừng build** | ADR-0023. Sáu loại đích: index, hub, term, detail, static, zalo. Mục có `children` thành nhóm thả xuống. Đây là nguồn duy nhất — Header, Footer và nút phụ ở hero trang chủ đều đọc từ đó (đóng DR-007) |
| Chuyển ngôn ngữ | bản dịch tồn tại của trang: field-level theo slug ngôn ngữ có giá trị; Article theo translationGroup (I7) | có | ngôn ngữ chưa có bản dịch không hiện trong switcher | khớp hreflang hai chiều, không link trang chưa tồn tại (R4) |
| Footer | config (build) cộng decor | có | — | không field Sanity phase 1 |
| Logo header và chân trang | `siteSettings.branding.logo`; chữ tên site vẫn từ config (build): `brand.name` | có | chưa tải logo → khối SVG mặc định trong `SiteLogo.astro`, đúng hình như trước 2026-08-14 | **một component `SiteLogo.astro` cho cả hai nơi** — trước đây SVG chép hai bản ở Header và Footer, đúng loại trùng lặp đã sinh ra DR-007. `branding.hideWordmark` ẩn chữ cạnh logo, **chỉ có hiệu lực khi đã có logo** — thêm v1.0.17 |
| Favicon | `siteSettings.branding.favicon` | có | `/favicon.svg` trong `public/` — file thật, không phải đường dẫn treo | trước 2026-08-14 hai thẻ `<link>` trỏ vào file không tồn tại, favicon 404 mọi trang mà không cổng nào bắt. `apple-touch-icon` cần ảnh raster; favicon SVG hoặc trống thì rơi về file dự phòng — thêm v1.0.17 |
| Ảnh chia sẻ mặc định (`og:image`) | `siteSettings.branding.ogImage` | tùy | trang không có ảnh riêng và chưa tải ảnh chung → **không phát** thẻ `og:image`, thẻ Twitter hạ về `summary` | prop `ogImage` của từng trang THẮNG ảnh chung (ảnh riêng của một tour sát nội dung hơn); `og:image:alt` phát theo alt của ảnh chung — thêm v1.0.17 |
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
| Breadcrumb | `containedInPlace` deref thành chuỗi cha (build); Experience dùng `venue` làm cha | có với entity có `containedInPlace` hoặc `venue` | dùng nhánh URL: tên nhánh theo 05 mục 1.2 | quan hệ là dữ liệu, breadcrumb là trình bày (05 mục 1.1). **v2.1:** nằm trên dải sáng **phía trên** hero, không đè lên ảnh; là nơi **duy nhất** hiện cha (không lặp ở Thông tin nhanh hay sidebar). không áp dụng: article, person, organization, tour, specialty, event |
| Hero | `title` cộng `mainImage` (kèm alt); `gallery` đủ 4 ảnh sau khi loại trùng `mainImage` thì đi qua Hero mosaic | title có (gate); mainImage nên có | thiếu mainImage thì hero thuần chữ; gallery dưới 4 ảnh thì hero ảnh đơn; không ảnh placeholder | desktop đủ 4 gallery: ảnh chính bên trái, gallery 2x2 bên phải kiểu Hotel với 4 ô bằng nhau; mobile: ảnh chính trên, thumbnail strip 4 ô đều dưới; alt bắt buộc khi có ảnh (2.0) |
| Đoạn mở | `summary` | có (gate, I10) | — | tự đứng được như câu trả lời hoàn chỉnh; nguồn speakable |
| Thân bài | `body` (portable text) | nên có | ẩn (mặc định) | ảnh inline trong body với Article. **v2.1:** có **mục lục** sinh ở build từ h2 của `body` khi bài có ≥ 3 h2 (neo vào từng h2, thanh dính trỏ được); biên tập **không mở mục trùng vai field cấu trúc** (cách đi → `accessInfo`, lịch trình → `itinerary`, bao gồm → `includes`, trải nghiệm → rollup) — luật 2 ở §6. không áp dụng: person (dùng `bio` thay vai, xem §4.11) |
| Gallery | `gallery` (kèm alt từng ảnh) | nên có với entity có field | ẩn | Không render gallery section rời trên detail; gallery detail phải đi qua Hero mosaic. không áp dụng: article, person, organization |
| Điểm nổi bật | `highlights` | tùy | ẩn | không áp dụng: organization, person, article |
| Hỏi đáp | `faq` | tùy | ẩn | nuôi FAQPage trong JSON-LD. không áp dụng: person, organization |
| Phân loại | `category` deref Category | tùy | ẩn | chỉ term thuộc bộ có trang công khai render thành link tới trang term; general-category không render (2.13) |
| Nhãn loại entity | `placeType`, `attractionType`, `experienceType`, `specialtyType`, `orgType`, `articleType`, `tourFormat` — mỗi entity nhiều nhất một field | tùy | ẩn | **v2.1:** huy hiệu trong hero cạnh tiêu đề và **chỉ ở đó** — không vào Thông tin nhanh, không vào sidebar (trước ghi "hoặc InfoBar", code làm cả ba: DR-032). `experienceType` link tới trang term khi có (R2). Cùng field nuôi nhãn phụ của card 5.1, không khai lại. `tourFormat` dùng **một** bảng nhãn (DR-035). không áp dụng: hotel, resort, person, touristDestination |
| Xác minh dữ liệu | `sameAs` | tùy | ẩn cả dòng, không hiện nhãn trống | link hồ sơ Wikidata/Wikipedia đầu tiên trong mảng; tín hiệu E-E-A-T. Là nguồn `sameAs` trong JSON-LD. **v2.1:** dòng "Nguồn tham khảo" đứng cạnh Ngày cập nhật ở cuối nội dung, giá trị là nhãn theo host (Wikipedia / Wikidata / tên miền) — không nằm trong sidebar. không áp dụng: article, experience, tour |
| Điện thoại | `telephone` | tùy | ẩn, không CTA giả | **v2.1:** một ô trong Thông tin nhanh, nhãn "Điện thoại <loại nơi>" (ví dụ "Điện thoại khu du lịch") để không lẫn với hotline của site trong khối hành động. không áp dụng: place, experience, tour, article, person, touristDestination, hotel, resort |
| Ngày cập nhật | `updatedAt`, `_updatedAt` | có | — | S2.4, hiện cả HTML. `_updatedAt` là dấu thời gian hệ thống của Sanity, dùng khi `updatedAt` biên tập chưa đặt |
| Vùng giá cộng CTA đặt | `prices.yaml` qua khóa `bookingRef` | chỉ entity thương mại | ẩn cả vùng, không CTA giả (quyết định nền 3); không có giá thì **không** nút thay thế trỏ về chính site (DR-036) | hình dạng nhãn theo entity, xem delta. **v2.1:** giá là **field duy nhất được lặp**, đúng hai nơi: thanh dính và khối hành động — không vào Thông tin nhanh. Tour: khối hành động là `BookingForm` (ADR-0027, §4.8). không áp dụng: place, article, person, organization |
| Thanh dính (dưới header) | neo tới các mục **thật sự render** (kể cả mục lục thân bài); giá (lặp có chủ ý); CTA chính | có khi trang có ≥ 1 neo, giá hoặc CTA | không có gì để hiện thì không render | **thêm v2.1**, hợp thức hoá thứ code đã có. Cao đúng token `--sticky-bar-h`; sidebar dính dưới nó (DR-033). Di động: ẩn neo, và thay bằng **thanh đáy** chỉ gồm giá + CTA — không còn thanh nào dưới header |
| Thông tin nhanh | các field ngắn của entity theo ma trận §3.1 — giờ mở cửa, địa chỉ, điện thoại, website chính thức, "miễn phí" khi đúng, thời lượng, phù hợp với, khởi hành | tùy | ô rỗng không render; 0 ô thì không có vùng | **thêm v2.1**, thay cặp InfoBar + InfoCard. Mỗi field **đúng một ô**, tối đa 6 ô, icon SVG, **không chứa giá**; ≤ 2 ô thì không trải dải ngang — desktop gộp vào cạnh bản đồ ở sidebar, di động giữ lưới 2 cột. Desktop: dưới thanh dính; di động: ngay dưới tiêu đề. Component `FactStrip.astro` |
| Khối hành động (sidebar) | giá + CTA Zalo (siteSettings.contact.zaloUrl) + hotline; Tour thêm đơn vị vận hành, giấy phép và form — field khai ở §4.8 | chỉ entity thương mại | không giá và không kênh thì không render | **thêm v2.1.** Không lặp field nào của Thông tin nhanh. Di động: nằm sau Thông tin nhanh; CTA còn lặp ở thanh đáy. không áp dụng: place, article, person, organization |
| Bản đồ (sidebar) | `geo` để vẽ; `hasMap` là link "Mở Google Maps" trong cùng thẻ | tùy | thiếu `geo` thì không vẽ; chỉ có `hasMap` thì hiện một link | **thêm v2.1.** `hasMap` **không** vào Thông tin nhanh. Di động: ngay sau "Cách tới nơi", không ở cuối trang. không áp dụng: article, person, tour |

### 3.1 Ma trận vùng theo entity (thêm v2.1 — nguồn cho FactStrip và cho Design)

Mỗi ô ghi **vùng duy nhất** field được hiện trên trang chi tiết. "—" là entity không có field. Cột này không phải cột "Dữ liệu nuôi" nên bộ kiểm `g3` không đọc; nó là hợp đồng cho bước 7 và bước 8. Giá (`bookingRef` → `prices.yaml`) là ngoại lệ duy nhất: thanh dính + khối hành động.

| Field | Điểm tham quan | Địa danh | Trải nghiệm | Tour |
|---|---|---|---|---|
| `attractionType` · `placeType` · `experienceType` · `tourFormat` | huy hiệu hero | huy hiệu hero | huy hiệu hero (link term) | huy hiệu hero |
| `containedInPlace` · `venue` | breadcrumb | breadcrumb | breadcrumb (`venue`) | — |
| `summary` | hero | hero | hero | hero |
| `openingHours` | Thông tin nhanh | Thông tin nhanh | — | — |
| `address` | Thông tin nhanh | Thông tin nhanh | — | — |
| `telephone` | Thông tin nhanh | — | — | — |
| `officialSource` | Thông tin nhanh (tên miền) | — | — | — |
| `isAccessibleForFree` | Thông tin nhanh, chỉ khi true | Thông tin nhanh, chỉ khi true | thanh dính + khối hành động (nhãn "Miễn phí" thay giá) | — |
| `duration` | — | — | Thông tin nhanh | Thông tin nhanh |
| `touristType` | — | — | Thông tin nhanh (đủ danh sách) | Thông tin nhanh |
| `tripOrigin` | — | — | — | Thông tin nhanh ("Khởi hành") |
| `departureNote` | — | — | — | ghi chú trong khối hành động |
| `operator` · `licenseInfo` | — | — | — | khối hành động (`BookingForm`); `licenseInfo` không lặp tiền tố "Giấy phép" |
| `seasonNote` | — | — | — | mục "Mùa nào nên đi" |
| `includes` · `excludes` | — | — | mục "Bao gồm" | mục "Bao gồm / Không bao gồm" |
| `itinerary` | — | — | — | mục "Lịch trình" (timeline); thân bài không lặp |
| `highlights` | mục, trước thân bài | mục, trước thân bài | mục, trước thân bài | mục, trước lịch trình |
| `body` | mục "Tổng quan" + mục lục | mục "Chi tiết" + mục lục | mục "Chi tiết" + mục lục | mục "Chi tiết" + mục lục |
| `accessInfo` | mục "Cách tới nơi" — nơi duy nhất nói đường đi | mục "Cách tới nơi" | — | — |
| rollup `experiences` | mục "Trải nghiệm tại đây" | mục "Trải nghiệm tại đây" | — | — |
| `faq` | mục | mục | mục | mục |
| `geo` · `hasMap` | thẻ bản đồ | thẻ bản đồ | thẻ bản đồ (chỉ `geo`) | — |
| `sameAs` | dòng "Nguồn tham khảo" cạnh Cập nhật | dòng "Nguồn tham khảo" | — | — |
| giá (`bookingRef`) | thanh dính + khối hành động | — | thanh dính + khối hành động | thanh dính + `BookingForm` |
| `_updatedAt` · `updatedAt` | cuối nội dung | cuối nội dung | cuối nội dung | cuối nội dung |

Thứ tự mục nội dung thống nhất: Điểm nổi bật → (Tour: Lịch trình → Bao gồm) → Tổng quan/Chi tiết → Cách tới nơi → (Trải nghiệm tại đây) → Mùa nào nên đi → Câu hỏi thường gặp → Cập nhật · Nguồn. Thứ tự khối di động: hero → Thông tin nhanh → nội dung theo thứ tự trên, bản đồ ngay sau Cách tới nơi → Gần đây; thanh đáy giá + CTA luôn thấy.

## 4. Delta từng loại trang chi tiết

### 4.1 Trang điểm đến `/{destinationSlug}/` (TouristDestination)

Trang TouristDestination giữ vai điều phối điểm đến, nhưng không còn là trang chủ site. Trang chủ `/` dùng SiteHome/WebSite riêng và trỏ vào trang điểm đến, ví dụ `/nha-trang/`. Khung chung áp dụng, cộng:

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Trust bar | config (build) | có | luôn hiện | cam kết hệ thống về nội dung duyệt, dữ liệu có nguồn, cập nhật rõ; không phải CTA marketing |
| Số liệu nhanh | `keyFacts` | nên có | ẩn | cho người và máy |
| Custom banners | `homepageBanners` active | tùy | ẩn | tối đa 3 banner, xếp theo priority; toàn card click nếu có linkUrl; không render Offer JSON-LD |
| Khối featured (5 khối) | `featuredAttractions`, `featuredStays`, `featuredExperiences`, `featuredSpecialties`, `featuredTours` deref | tùy | khối nào rỗng ẩn khối đó | chỉ trỏ entity đã publish (2.1) |
| Lối vào 4 hub | config (build): 4 hub 05 mục 1.3 | có | — | rollup đếm số entity mỗi hub là tùy chọn Design, dữ liệu sẵn từ build |
| Các khu vực nên biết | rollup (build): Place approved, ưu tiên area, beach, island, landform, ward | tùy | ẩn | tối đa 4 card, URL từ ROUTE_MAP |
| Cẩm nang bản địa | rollup (build): Article approved theo `language`, ưu tiên transport-guide, `itinerary`, guide | tùy | ẩn | tối đa 4 card; Article dùng document-level i18n |
| Điểm đến liên quan | `relatedDestinations` | tùy | ẩn | |
| Lưu ý an toàn | `safetyNote` | tùy | ẩn | theo mùa |
| Ngày cập nhật nhẹ | `updatedAt` | có nếu có | ẩn nếu thiếu | trust signal S2.4, hiển thị gần cuối trang, không biến thành banner cảnh báo |
| speakable | build từ `summary` và `faq` | có | — | vùng vô hình, S2.4 |

### 4.2 Place `/dia-danh/{slug}`

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Bản đồ, vị trí | `geo` cộng `address`; `hasMap` link ngoài | tùy | ẩn khi thiếu geo/address/hasMap | addressLocality là phường hiện hành (I15) |
| Cách tới nơi | `accessInfo` | tùy | ẩn | |
| Giờ và vé | `openingHours`, `isAccessibleForFree` | tùy | ẩn | chỉ nơi có quản lý; Place không có vùng giá |
| Vùng con | containsPlace rollup (build) | — | ẩn | reverse containedInPlace |
| Trải nghiệm tại đây | rollup (build) từ `Experience.venue` ngược, GROQ chiếu ra `experiences` | — | ẩn | |

*Vùng hiển thị của từng field ở trang này theo ma trận §3.1 (v2.1): nhãn loại chỉ ở hero, cha chỉ ở breadcrumb, field ngắn vào Thông tin nhanh, giá chỉ ở thanh dính + khối hành động; InfoBar và InfoCard không còn là vùng.*

### 4.3 Attraction `/diem-tham-quan/{slug}`

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Bản đồ, vị trí | `geo` cộng `address`; `hasMap` | tùy | ẩn khi thiếu geo/address/hasMap | I2 rẽ nhánh theo attractionType; geo/address không phải gate |
| Nguồn chính thức | `officialSource` | gate với nhóm venue | ẩn với nhóm bách khoa không điền | |
| Giờ và miễn phí | `openingHours`, `isAccessibleForFree` | nên có với nơi bán vé | ẩn | |
| Cách tới nơi | `accessInfo` | tùy | ẩn | |
| Vùng vé vào cửa | prices.yaml qua `bookingRef` | nên có với nơi bán vé | ẩn cả vùng | giá trực tiếp kèm đơn vị; giá gói hoạt động đi qua Experience (2.3). **Ngoại lệ (chốt 2026-06-12):** venue thương mại có nhiều gói vé (như I-Resort: tắm bùn, tắm thảo dược, spa) dùng dạng "từ X₫" thay giá trực tiếp. |
| Trải nghiệm tại đây | rollup (build) từ `Experience.venue` ngược, GROQ chiếu ra `experiences` | — | ẩn | |
| Sự kiện tại đây | rollup (build) từ Event.`location` ngược | — | ẩn | |

*Vùng hiển thị của từng field ở trang này theo ma trận §3.1 (v2.1): nhãn loại chỉ ở hero, cha chỉ ở breadcrumb, field ngắn vào Thông tin nhanh, giá chỉ ở thanh dính + khối hành động; InfoBar và InfoCard không còn là vùng.*

### 4.4 Experience `/trai-nghiem/{slug}`

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Loại trải nghiệm | `experienceType` deref Category | có (gate I13) | — | link tới trang term khi term đã có trang (R2); chưa có trang thì hiện chữ không link |
| Diễn ra tại | `venue` deref | có (gate I13) | — | link trang Attraction, Hotel, Resort hoặc Place |
| Thời lượng | `duration` | tùy | ẩn | render theo locale ở build |
| Gồm những gì | `includes` | tùy | ẩn | |
| Phù hợp với | `touristType` | tùy | ẩn | |
| Vị trí trên bản đồ | `geo` | tùy | ẩn | Experience không có `address`; chỉ toạ độ, dùng cho bản đồ nhỏ và JSON-LD |
| Vùng giá cộng CTA | `prices.yaml` qua `bookingRef`; `isAccessibleForFree` | nên có với trải nghiệm trả phí | ẩn cả vùng; isAccessibleForFree = true hiện nhãn miễn phí thay vùng giá | giá trực tiếp kèm đơn vị kiểu "120k/người" (I16) |

*Vùng hiển thị của từng field ở trang này theo ma trận §3.1 (v2.1): nhãn loại chỉ ở hero, cha chỉ ở breadcrumb, field ngắn vào Thông tin nhanh, giá chỉ ở thanh dính + khối hành động; InfoBar và InfoCard không còn là vùng.*

### 4.7 Hotel `/khach-san/{slug}` và Resort `/resort/{slug}` (LodgingBase)

Một delta chung, khớp 2.0b. Khác nhau chỉ ở ba vùng cuối.

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Bản đồ, vị trí | `geo` cộng `address` | tùy | ẩn khi thiếu geo/address | |
| Nguồn chính thức | `officialSource` | có (gate I3) | — | |
| Hạng sao | `starRating` | tùy | ẩn | |
| Tiện ích | `amenityFeature` | tùy | ẩn | |
| Giờ nhận trả phòng | `checkinTime`, `checkoutTime` | tùy | ẩn | |
| Số phòng, thú cưng | `numberOfRooms`, `petsAllowed` | tùy | ẩn | |
| Ra biển | `beachAccess` | nên có | ẩn | không suy được từ geo (2.0b) |
| Cách tới nơi | `accessInfo` | tùy | ẩn | resort đảo, khu xa trung tâm |
| Cách sân bay | suy (build) từ `geo` | — | ẩn khi thiếu geo | "cách sân bay ~X km", không phải field (2.0b) |
| Vùng giá cộng CTA | `prices.yaml` qua `bookingRef` | nên có | ẩn cả vùng | dạng "từ X, cập nhật [ngày]" lấy asOf từ nguồn giá (I16, quyết định nền 9 của 01) |
| Riêng Resort: sát biển, diện tích | `beachfront`, `landArea` | tùy | ẩn | chỉ Resort có field; `LodgingDetail` chặn bằng `isResort` lúc chạy |
| Riêng Resort: hoạt động tại chỗ | `onSiteActivities` | tùy | ẩn | có thể trỏ Experience, render link; `LodgingDetail` chặn bằng `isResort` lúc chạy |

### 4.8 Tour `/tour/{slug}`

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Hành trình (timeline có thứ tự) | `itinerary`: mỗi stop deref Attraction hoặc Place, hoặc `externalStop` {name, `geo`, `sameAs`}; note; `durationAtStop` | có ≥1 stop (gate I14) | — | serialize ItemList giữ thứ tự; stop nội vùng link trang entity, externalStop chữ không link |
| Đơn vị vận hành | `operator` deref Organization | có (gate I14) | — | link `/cong-ty/{slug}`; serialize provider |
| Hình thức tour | `tourFormat` | có (gate I14) | — | join-in, private hoặc both; nhãn hiển thị cho khách |
| Xuất phát từ | `tripOrigin` deref | nên có | ẩn | |
| Ngày điển hình | `departureNote` | tùy | ẩn | không phải lịch chỗ trống (I1) |
| Thời lượng | `duration` | nên có | ẩn | render theo locale |
| Gồm gì, không gồm gì | `includes`, `excludes` | nên có | ẩn từng khối riêng | chỗ phát sinh hiểu lầm nhiều nhất (2.8) |
| Phù hợp với | `touristType` | tùy | ẩn | |
| Lưu ý mùa | `seasonNote` | tùy | ẩn | |
| Vùng giá cộng CTA | `prices.yaml` qua `bookingRef` | nên có | ẩn cả vùng | perPax mọi hình thức (I14); tour riêng hiện tiers theo cỡ nhóm từ nguồn giá |
| Form đặt tour | `prices.yaml` qua `bookingRef` (`amount`, `paxRates`, hoặc `tiers`); `siteSettings.contact` (`zaloUrl`, `hotline`); `title`, `slug` của tour | chỉ khi có giá | không giá → không form, giữ `ContactChannels` (quyết định nền 3) | component `BookingForm`, thay `BookingCTA` trên Tour; tạm tính tính từ số nướng lúc build; gửi tới `/api/dat-tour` (ADR-0027); vùng ghi duy nhất của site, không phải field Sanity; nút Zalo và hotline guard rỗng như §2 — thêm 2026-08-21 |

*Vùng hiển thị của từng field ở trang này theo ma trận §3.1 (v2.1): nhãn loại chỉ ở hero, cha chỉ ở breadcrumb, field ngắn vào Thông tin nhanh, giá chỉ ở thanh dính + khối hành động; InfoBar và InfoCard không còn là vùng.*

### 4.10 Article `/cam-nang/{slug}`

Không gallery (ảnh inline trong body, 2.11). Document-level: mỗi ngôn ngữ một document, switcher theo translationGroup.

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Nhãn chuyên mục | `articleType` | có (gate) | — | xuất articleSection trong JSON-LD |
| Hộp tác giả | `author` deref Person: title, `mainImage`, `summary` | có (gate I4) | — | link `/tac-gia/{slug}`, tín hiệu E-E-A-T |
| Ngày đăng, ngày sửa | `publishedAt`, `updatedAt` | có | — | datePublished, dateModified |
| Mục lục, thời gian đọc | suy (build) từ `body` | tùy Design | ẩn với bài ngắn | không phải field (N1, P6) |
| Hướng dẫn từng bước | `howTo` | gate transport-guide: ít nhất một trong howTo, faq | ẩn | serialize HowTo |
| Nói về | `about` deref | nên có | ẩn | card link tới entity được nói tới |
| Có nhắc tới | `mentions` deref | tùy | ẩn | nhẹ hơn `about`: entity được nhắc nhưng không phải chủ đề bài |
| Bài liên quan | rollup (build) từ `about` và `category` chung | — | ẩn | 2.11 loại có chủ ý relatedArticles field |

### 4.11 Person `/tac-gia/{slug}`

Không có index `/tac-gia/` trong cây 05; trang chỉ đến từ hộp tác giả. Không body, gallery, highlights, faq (2.12). Hero luôn đủ: mainImage trong gate.

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Giới thiệu | `bio` (portable text) | có (gate) | — | thay vai body |
| Vai trò, am hiểu | `jobTitle`, `knowsAbout` | nên có | ẩn | topical authority |
| Hồ sơ bên ngoài | `sameAs` ≥1, url | sameAs có (gate) | url rỗng ẩn | link hồ sơ thật, E-E-A-T |
| Bài đã viết | rollup (build) từ Article.`author` ngược | — | ẩn (không xảy ra trên trang sống: Person tồn tại vì Article cần) | |

### 4.12 Organization `/cong-ty/{slug}`

Không gallery, highlights, faq (2.9). Không vùng giá (cấm mọi field giá vốn, I1).

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Logo | `logo` | nên có | ẩn, hero dùng mainImage hoặc thuần chữ | tách khỏi mainImage (2.9) |
| Loại đơn vị | `orgType` | có | — | nhãn theo enum |
| Website, nguồn xác minh | url, `officialSource` | có (gate I3) | — | |
| Văn phòng | `geo`, `address` | tùy | ẩn | chỉ khi có văn phòng đón khách thật |
| CTA gọi điện | `telephone` | tùy | ẩn | |
| Giấy phép | `licenseInfo` | tùy | ẩn | tín hiệu trust đặc thù VN |
| Tour vận hành | rollup (build) từ Tour.`operator` ngược | — | ẩn | I18 bảo đảm có ít nhất một quan hệ vào |
| Sự kiện tổ chức | rollup (build) từ Event.`organizer` ngược | — | ẩn | |

## 5. Trang danh sách

### 5.1 Card chuẩn (pattern dùng chung mọi listing)

| Vùng trong card | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Ảnh | mainImage kèm alt | nên có | card thuần chữ, không ảnh placeholder | |
| Tiêu đề, link | title cộng URL từ slug | có | — | |
| Mô tả ngắn | summary (cắt ở build) | có | — | |
| Nhãn phụ | theo entity: attractionType, experienceType, tourFormat, starRating, eventType cộng startDate, articleType cộng author | tùy | ẩn | một nhãn, không nhồi |
| Nhãn giá | prices.yaml qua bookingRef | chỉ entity thương mại | ẩn | "từ X" với lodging; giá trực tiếp với Experience, Tour; quyết định nền 3 |

### 5.2 Index nhánh entity (`/dia-danh/`, `/diem-tham-quan/`, `/trai-nghiem/`, `/khach-san/`, `/resort/`, `/tour/`, `/cam-nang/`)

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Tiêu đề, mô tả nhánh | config (build) theo ngôn ngữ | có | — | không phải field entity nào |
| Lưới card | mọi entity publish cùng _type, card 5.1 | có | nhánh 0 entity không sinh trang index (quyết định nền 4) | phase 1 hiện tất, chưa phân trang (05 mục 1.1) |
| Lối lọc theo term | các term có trang (R2) của nhánh | chỉ `/trai-nghiem/` và `/tour/` | ẩn khi chưa term nào đủ R2 | link tới trang term, không phải filter client |
| JSON-LD | CollectionPage cộng ItemList | có | — | I6 |

Thứ tự sắp xếp card là trình bày, Design quyết ở bước 7; dữ liệu đủ cho mọi lựa chọn (publishedAt, updatedAt, title, startDate với Event).

### 5.3 Bốn hub (`/kham-pha/`, `/luu-tru/`, `/di-lai/`, `/tat-ca/`)

Cấu trúc như 5.2, khác nguồn lưới card:

| Hub | Nguồn lưới card (rollup build) | Ghi chú |
|---|---|---|
| `/kham-pha/` | `attraction` cộng `experience` publish | hai khối hoặc trộn, Design quyết; lối vào nhánh con và term |
| `/luu-tru/` | `hotel` cộng `resort` publish | lằn ranh theo sản phẩm chính hiện qua nhãn phụ |
| `/di-lai/` | `article` có `articleType = transport-guide` publish | card dùng nhãn phụ author; hub mỏng nhất phase 1 |
| `/tat-ca/` | mọi entity đang bật, publish | trang gom toàn bộ; **không** hiện ở lưới hub trang chủ (`navHubs` loại `hub-all`) |

### 5.4 Term listing (`/trai-nghiem/{term}`, `/tour/{term}`)

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Tiêu đề | Category.name | có (gate 2.13) | — | |
| Đoạn định nghĩa | Category.description | có (gate 2.13) | — | meta sinh từ đây (2.13) |
| Lưới card | rollup (build): entity publish trỏ term qua experienceType hoặc category | có ≥1 (R2) | trang không sinh khi 0 entity (R2), không có trạng thái rỗng | |
| JSON-LD | CollectionPage cộng ItemList cộng DefinedTerm | có | — | additionalType từ Category.sameAs khi có |

### 5.5 Index sự kiện `/su-kien/`

Đã chuyển xuống phụ lục §8 — entity `event` đang tắt trong `src/site.config.ts`.

### 5.6 Trang 404

Toàn trang là config (build) cộng decor: thông điệp, link về `/` và 4 hub. Không field Sanity, không vào sitemap (05 mục 1.3).

### 5.7 Trang chủ `/` (SiteHome)

Trang chủ **không** phải trang entity. Nó là loại trang riêng, component `SiteHome`, phát JSON-LD `WebSite` cộng `Organization` (01 mục 5.1). Nội dung lấy từ document `touristDestination` khai ở `primaryDestinationSlug`, cộng `siteSettings`.

Thứ tự và ẩn/hiện từng khối do `siteSettings.sections` quyết (biên tập viên kéo thả trong Studio); thiếu `sections` thì dùng `DEFAULT_SECTIONS` trong code. Thứ tự mặc định trong code theo hướng A của `SPEC-2026-08-06-trang-chu-xung-tam`: **bằng chứng gánh trang, không phải catalogue gánh trang** — hero, dải số liệu, tour, vì sao chọn, đối tác, đánh giá, cẩm nang, báo giá đoàn.

Lý do: doanh thu công ty đến từ offline/đại lý/OTA, site là kênh mới với 4 sản phẩm lúc ra mắt. Dải số liệu đặt ngay dưới hero **không đọc document tour nào**, nên 4 hay 40 sản phẩm cũng không lộ.

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Thứ tự và bật/tắt khối | `siteSettings.sections` | tùy | dùng DEFAULT_SECTIONS trong code | `key` là enum đóng; `hidden` chỉ để tắt khối đã có dữ liệu |
| Hero: lời chào | `siteSettings.heroText` theo ngôn ngữ | tùy | dùng SITE_COPY trong code | |
| Hero: ảnh nền | `mainImage` của touristDestination | nên có | nền thuần màu | |
| Hero: nút chính | config (build): `destinationHref` | có | — | trỏ trang điểm đến |
| Hero: nút phụ | config (build): mục đầu tiên của `nav` | có | ẩn khi `nav` rỗng | ADR-0023 — không hardcode hub |
| Dải số liệu | `siteSettings.stats[]`: `value`, `label`, `note` | tùy | mảng rỗng hoặc thiếu → khối không render | trụ của trang; **không đọc document tour nào** nên số lượng tour không ảnh hưởng |
| Logo đối tác | `siteSettings.partners[]`: `name`, `logo`, `url` | tùy | ẩn khối | `logo` bắt buộc có alt (I12); thiếu `url` thì logo là ảnh tĩnh, không phải link chết |
| Đánh giá khách | `siteSettings.testimonials[]`: `quote`, `authorName`, `authorNote`, `sourceName`, `sourceUrl` | tùy | ẩn khối | **KHÔNG serialize ra JSON-LD** — Google cấm rich snippet tự phục vụ, xem QĐ-2026-08-06-09 |
| Báo giá đoàn | `siteSettings.groupQuote`: `heading`, `text`, `ctaLabel` | tùy | ẩn khối | nút đọc `contact.zaloUrl`, không khai số thứ hai |
| Vì sao chọn | config (build) | tùy | ẩn khối | bốn điểm khác biệt; xem việc 12 của kế hoạch 2026-08-06 |
| Các khối nội dung | như §4.1 (trust bar, banner, hub grid, areas, guides, featured, faq, safety) | tùy | khối rỗng tự ẩn dù `hidden = false` | empty guard là cổng cứng, xem §4.1 |
| JSON-LD | `WebSite` cộng `Organization`; `telephone`/`email` từ `siteSettings.contact`, `logo` từ `siteSettings.branding.logo` | có | field liên hệ trống thì không phát thuộc tính đó; chưa tải logo thì không phát `logo` | guard rỗng §5.1; `logo` thêm v1.0.17 — Google dùng cho nhận diện thương hiệu |

### 5.8 Trang tĩnh `/ho-tro/` và `/lien-he/`

Sinh từ `siteSettings`, không phải entity (ADR-0023, QĐ-2026-08-05-13). Không có gate publish vì không phải content entity.

| Trang | Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|---|
| `/lien-he/` | Danh sách kênh | `siteSettings.contact`: `hotline`, `zaloUrl`, `whatsapp`, `email` | tùy | kênh nào trống thì dòng đó ẩn; **cả bốn trống** thì hiện một dòng "đang cập nhật", không để khung trống | JSON-LD `ContactPage` |
| `/lien-he/` | Tên pháp nhân | config (build): `brand.legalName` | có | — | không lấy từ Sanity (ADR-0021) |
| `/ho-tro/` | Hướng dẫn đặt tour | `siteSettings.support.bookingGuide[]`: `step`, `text` | tùy | ẩn khối, không phát `HowTo` | đánh số bước ở tầng trình bày |
| `/ho-tro/` | Chính sách huỷ và hoàn | `siteSettings.support.cancellationPolicy` (portable text) | tùy | ẩn khối | render bằng `Body` |
| `/ho-tro/` | Câu hỏi thường gặp | `siteSettings.support.faq[]` | tùy | ẩn khối, không phát `FAQPage` | dùng primitive `FAQ` chung |
| `/ho-tro/` | Trạng thái rỗng | — | — | cả ba phần trống thì hiện một dòng mời liên hệ trực tiếp cộng cụm `ContactChannels` | không để trang trắng |

### 5.9 Trang lộ trình đón khách `/lo-trinh-don-khach/`

**Đang ở chế độ phát triển** — cờ `devPages['lo-trinh-don-khach']` trong `src/site.config.ts` để `false`, nên bản production không sinh trang. Bảng khai sẵn để khi bật cờ không phải quay lại bước 6.

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Bản đồ lộ trình | `siteSettings.pickupPoints[]` có `geo` | tùy | không có điểm nào đủ toạ độ thì không render bản đồ | đường nối vẽ theo đúng thứ tự mảng |
| Bảng giờ đón | `pickupPoints[]`: `stopName`, `stopAddress`, `pickupTime`, `pickupNote` | tùy | 0 điểm thì nói rõ đang cập nhật, không để khung trống | điểm `hidden = true` loại khỏi cả bản đồ lẫn bảng |
| CTA gọi điện | `siteSettings.contact.hotline` | tùy | ẩn | |
| JSON-LD | `WebPage` | có | — | cố ý **không** dùng `Trip`: lộ trình đón là khâu vận hành, không phải tour bán được (I1, I6) |

## 6. Quy tắc chung

- Mọi field xuất hiện ở đây phải tồn tại trong `01-CONTENT_MODEL.md`. Cần field mới: quay lại sửa content model trước, không bịa tại đây.
- Trạng thái rỗng và trạng thái lỗi là một phần của bản ánh xạ, không phải việc để Design tự nghĩ. Mặc định toàn file theo quyết định nền 2; bảng chỉ ghi ngoại lệ.
- Trạng thái lỗi dữ liệu không tồn tại trên trang sống: gate publish (I12, I19) chặn entity thiếu field bắt buộc, PY4 và họ ref integrity chặn trỏ hụt từ build. Trang chỉ có hai trạng thái: vùng có dữ liệu và vùng ẩn.
- Phần tử trang trí thuần (không mang dữ liệu) ghi rõ `decor` để khỏi tranh cãi.
- **Luật 1 (v2.1) — một thông tin, một vùng, một lần.** Mỗi field hiển thị của trang chi tiết được khai đúng một vùng (§3.1). Nhắc lại ở vùng thứ hai phải ghi thành ngoại lệ có lý do; hiện chỉ có **giá** (thanh dính + khối hành động) vì đó là quyết định mua. Template chỉ khai dữ liệu, không tự chọn vùng; `g3` và review QA1 đối chiếu theo §3.1.
- **Luật 2 (v2.1) — cấu trúc giữ khung, bài viết giữ chiều sâu.** Field cấu trúc (`accessInfo`, `itinerary`, `includes`, `openingHours`…) là câu trả lời ngắn ở vùng cố định; `body` không mở mục cùng vai. Bài dài điều hướng bằng mục lục sinh từ h2, không bằng cách lặp mục.
- **Luật 3 (v2.1) — giá trước, chữ sau.** Màn đầu của entity thương mại phải có giá hoặc nhãn "miễn phí"; không có thì ẩn vùng giá **và** không hiện nút thay thế trỏ về chính site (quyết định nền 3 + DR-036).

## 7. Điều kiện mở cổng Design

Cổng bước 7 chỉ mở khi **cả bốn** điều kiện dưới đây đúng. Bản v1 tuyên bố "16 mẫu URL đều có bảng ánh xạ" — câu đó khi ấy vừa thừa vừa thiếu (DR-005), nên v2 viết lại thành danh sách kiểm được thay vì một lời khẳng định.

| # | Điều kiện | Trạng thái 2026-08-05 |
|---|---|---|
| 1 | Mọi loại trang site **thực sự sinh ra** đều có bảng ánh xạ | ✅ 22 URL của build hiện tại phủ bởi §2–§5.9 |
| 2 | Không bảng nào mô tả loại trang không tồn tại | ✅ `restaurant`, `specialty`, `event` chuyển xuống §8 |
| 3 | Mọi field template truy cập đều được khai ở đây | ◐ **15 cảnh báo còn lại**, 0 lỗi — xem §7.1 |
| 4 | Bộ kiểm máy của cổng đọc đúng file này | ✅ **đạt 2026-08-05** — `g3` nay parse thẳng bảng ở đây; DR-027 đã xử |

### 7.1 Baseline 15 cảnh báo còn lại (đo 2026-08-05)

Không cảnh báo nào ở mức `fail`. Ghi ra đây để lần sau đo được là tăng hay giảm, thay vì mỗi lần lại đếm từ đầu.

| Nhóm | Số | Bản chất |
|---|---|---|
| Vùng "Phân loại" (`category`) câm ở cả 9 entity | 9 | Bản ánh xạ khai vùng phân loại trên mọi trang chi tiết, **không template nào render `data.category`**. Hoặc Design dựng vùng này ở bước 7, hoặc bỏ hàng đó khỏi §3. Là quyết định bề mặt, để pha F. |
| Vùng rollup câm: "Sự kiện tại đây", "Tour vận hành", "Sự kiện tổ chức", "Bài đã viết" | 4 | Dữ liệu vào template qua prop `nearby` của `RouteDispatch` chứ không qua `data.<field>`, nên bộ dò tĩnh của `g3` không thấy. Giới hạn công cụ, không phải vùng thiếu. Hai trong bốn thuộc `event` đang tắt. |
| `isAccessibleForFree` trên hotel và resort | 2 | Phát hiện thật — xem DR-028: template đọc field không tồn tại, che bằng `as any`. Cần quyết ở tầng nội dung. |

**Điều kiện 4 đã đạt**, nên từ nay "g3 xanh" là bằng chứng thật cho điều kiện 3 — trong giới hạn ghi ở bảng trên. Chủ dự án chốt có mở cổng bước 7 với 15 cảnh báo này hay không; `GOVERNANCE` 4.1 để mặc định của cổng là chặn, và mức bằng chứng thuộc quyền chủ dự án.

## 8. Phụ lục — entity đang tắt

Ba entity dưới đây **đang tắt** trong `src/site.config.ts` mục 3: không có URL, không vào sitemap, không sinh trang. Bảng ánh xạ giữ lại nguyên văn vì schema Sanity và code serialize vẫn còn (để không gãy tham chiếu chéo), nên bật lại chỉ là đổi một cờ chứ không phải soạn lại bước 6.

**Không tính vào điều kiện mở cổng Design** ở §7 chừng nào cờ còn tắt.

### 8.1 Restaurant `/nha-hang/{slug}`

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

### 8.2 Specialty `/dac-san/{slug}`

Không vùng giá, không bookingRef (2.14).

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Loại | specialtyType | có (gate) | — | dish hay product, đổi trình bày không đổi @type |
| Gốc gác | originNote | tùy | ẩn | |
| Mùa ngon | season | tùy | ẩn | |
| Nơi nên thử | whereToTry deref Restaurant | tùy | ẩn | tuyển chọn biên tập 2 đến 3 quán (I17) |
| Ăn ở đâu (đầy đủ) | rollup (build) từ Restaurant.servesSpecialty ngược | — | ẩn | nguồn duy nhất của danh sách đầy đủ |

### 8.3 Event `/su-kien/{slug-kỳ}`

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Thời gian | startDate, endDate | startDate có (gate I5) | endDate rỗng chỉ hiện startDate | |
| Nhãn trạng thái | eventStatus cộng nhãn đã diễn ra suy (build) từ endDate | tùy | quá endDate hiện nhãn đã diễn ra ở tầng trình bày (I5); JSON-LD giữ nguyên sự thật lịch sử | |
| Diễn ra tại | location deref Place hoặc Attraction | có (gate I5) | — | link trang entity |
| Tổ chức bởi | organizer deref Organization | tùy | ẩn | link `/cong-ty/{slug}` |
| Vùng vé (3 nhánh, đúng thứ tự ưu tiên) | 1 bookingRef qua prices.yaml; 2 ticketUrl link ngoài; 3 isAccessibleForFree nhãn miễn phí | tùy | cả ba rỗng thì ẩn cả vùng | luật 2.10; sự kiện đã qua ẩn CTA vé, giữ nội dung |

### 8.4 Index sự kiện `/su-kien/`

Như 5.2, riêng lưới card chia hai khối ở build (05 mục 1.1): sắp tới (endDate hoặc startDate chưa qua, xếp startDate tăng dần) và đã diễn ra (xếp startDate giảm dần). Card Event dùng nhãn phụ eventType cộng startDate; card khối đã qua kèm nhãn đã diễn ra.

