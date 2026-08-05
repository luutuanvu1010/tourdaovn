# GÓI BÀN GIAO — Pha F (bước 7) cho Claude Design

> **File này tự chứa.** Prompt và mọi tài liệu đầu vào đã gộp vào đây, không cần mở repo.
> Dán hoặc tải file này lên phiên Claude Design là đủ.
>
> Đóng gói: Cowork, 2026-08-06. Repo `tourdaovn`.

## Mục lục

1. Prompt nhiệm vụ  ← đọc trước
2. `06-BINDING_MAP.md` — bản ánh xạ vùng giao diện ↔ dữ liệu (**quan trọng nhất**)
3. `07-DESIGN_TOKENS.md` — bộ token, gồm §1b ba bộ giao diện
4. `00-PROJECT_BRIEF.md` — định vị, khách hàng, điểm khác biệt
5. `tokens.css` — token đang chạy thật
6. `COMPONENT_INVENTORY.md` — 54 component đang có

---

# 1. PROMPT NHIỆM VỤ

# Vai của anh: Design (bước 7)

Anh làm **bề mặt**. Xuất mockup và đề xuất token. Anh **không** viết code sản phẩm, không
quyết kiến trúc, không chạm dữ liệu.

## Cổng cứng — kiểm trước khi làm bất cứ việc gì

`PLAYBOOK` Phần 1 và `GOVERNANCE` 4.2: **chưa có `06-BINDING_MAP` đã duyệt thì cấm vào
bước 7.** File có ở `docs/core-specs/06-BINDING_MAP.md`, phiên bản **v2.0.0**, viết lại
ngày 2026-08-05.

Mở §7 của file đó ra đọc trước. Nó có bảng bốn điều kiện mở cổng, và **ghi rõ điều kiện nào
chưa đạt**. Nếu chủ dự án chưa xác nhận mở cổng với trạng thái đó, anh **dừng và hỏi**,
không tự cho là đã mở.

## Đọc trước khi làm

Theo thứ tự:

1. `docs/core-specs/06-BINDING_MAP.md` — **quan trọng nhất**. Mỗi vùng giao diện ăn dữ liệu
   từ field nào. Vùng nào không trỏ được về một field thật là vùng vẽ bừa.
2. `docs/core-specs/07-DESIGN_TOKENS.md` — bộ token hiện hành, gồm **§1b: ba bộ giao diện
   chọn được**.
3. `docs/core-specs/00-PROJECT_BRIEF.md` — định vị, khách hàng, bốn điểm khác biệt.
4. `docs/design-context/COMPONENT_INVENTORY.md` — 54 component đang có.
5. `src/styles/tokens.css` — token đang chạy thật.

## Bối cảnh — đọc kỹ, đây là chỗ mockup hay sai nhất

**Công ty TNHH Tour Đảo** bán tour biển đảo Nha Trang cho khách lẻ và khách đoàn. Sáu dòng
dịch vụ: tour đảo, lặn biển, vé vào cổng khu vui chơi, khách sạn và resort, đưa đón sân bay.
Đặt chỗ **qua Zalo**, không có giỏ hàng, không thanh toán trên site.

Bốn điểm khác biệt: xe đưa đón tận nơi, hướng dẫn viên đi cùng, giá tốt, thanh toán linh hoạt.

### ⚠ Dữ liệu đang RẤT MỎNG — đây là ràng buộc số một

Đo trên bản build thật ngày 2026-08-06:

| Khối | Số mục thật |
|---|---|
| Tour | **1** |
| Trải nghiệm | **1** |
| Cẩm nang | **1** |
| Địa danh | **1** |
| Điểm tham quan | **1** |
| Khách sạn, Resort | **0** |

Mốc ra mắt là 2026-08-09 với mục tiêu **4 sản phẩm**.

**Hệ quả bắt buộc lên thiết kế:** mọi khối phải trông tử tế với **1 mục**, không chỉ với 6–8
mục. Lưới 3 cột có một thẻ nằm lẻ loi là hỏng. Anh phải khai rõ mỗi khối hiển thị ra sao ở
**1 mục, 2–3 mục, và 4+ mục**.

Đây là lỗi kinh điển của mockup: vẽ lưới đầy thẻ đẹp, dựng thật thì rỗng. Nếu mockup của anh
chỉ đúng khi có nhiều dữ liệu, nó chưa dùng được.

## Việc cần làm

Ba loại trang, theo đúng thứ tự ưu tiên:

1. **Trang chủ `/`** — xem `06-BINDING_MAP` §5.7. Thứ tự khối do `siteSettings.sections`
   quyết, nên anh đề xuất thứ tự chứ không cố định nó.
2. **Trang tour chi tiết `/tour/<slug>/`** — `06-BINDING_MAP` §3 (khung chung) cộng §4.8
   (delta Tour). Đây là trang chốt đơn, quan trọng nhất về chuyển đổi.
3. **Trang danh sách `/tour/`** — §5.1 (card chuẩn) và §5.2.

Với mỗi trang, giao:

- Mockup (HTML tĩnh hoặc mô tả bố cục đủ chi tiết để dựng lại được).
- Bảng đối chiếu: **mỗi vùng trên mockup ↔ dòng nào trong `06-BINDING_MAP`**. Vùng không đối
  chiếu được là vùng phải bỏ.
- Trạng thái rỗng và trạng thái ít dữ liệu của từng khối.

## Ràng buộc cứng — vi phạm là trượt QA

**R1 — Không tạo nguồn token thứ hai.** Màu, chữ, khoảng cách chỉ sống ở
`07-DESIGN_TOKENS.md` và `src/styles/tokens.css`. Muốn giá trị mới thì **đề xuất**, chủ dự
án duyệt, rồi mới thêm vào token. Cấm viết giá trị màu thẳng vào mockup.

**R2 — Ba bộ giao diện phải cùng dùng được.** `bien-sau` (mặc định), `cat-bien`, `ngoc-lam`
— xem `07-DESIGN_TOKENS` §1b. Mockup không được phụ thuộc vào một bộ cụ thể. Nếu một bố cục
chỉ đẹp với nền trắng mà vỡ với nền kem, đó là bố cục sai.

**R3 — Tương phản WCAG AA.** Mọi cặp chữ trên nền ≥ 4.5. `04-CONSTRAINTS` §3 đặt ngưỡng
Lighthouse accessibility ≥ 95 ở mức `fail`. Có lệnh kiểm: `npm --prefix scripts run check:theme`.
Màu `--c-sand` **cấm làm nền cho chữ trắng** — chỉ đạt 3.28.

**R4 — Vùng rỗng thì ẩn hẳn.** `06-BINDING_MAP` quyết định nền 2 và 3: không placeholder,
không khung trống, **không CTA giả**. Chưa có giá thì không vẽ nút đặt.

**R5 — Không bịa field.** Mọi vùng phải trỏ về một field có trong `01-CONTENT_MODEL`. Cần
dữ liệu mới thì **dừng và báo**, không tự thêm.

**R6 — Đặt chỗ đi qua Zalo.** Không thiết kế luồng thanh toán, giỏ hàng, chọn ngày, đếm chỗ
trống. Những thứ đó không tồn tại.

## Cấm

- Quyết kiến trúc, đổi cây URL, đổi mô hình dữ liệu.
- Chạm dữ liệu trong Sanity.
- Sửa code sản phẩm trong `src/`. Bước 7 chỉ ra mockup và đề xuất token; dựng thật là bước 8.
- Thêm font mới, thư viện mới, framework mới.
- Thiết kế trang cho ba danh mục đang tắt: nhà hàng, đặc sản, sự kiện.

## Gặp mơ hồ thì DỪNG và hỏi

Không tự đoán, không "tuỳ anh quyết". Cụ thể, ba chỗ đã biết là mơ hồ:

1. **Vùng "Phân loại"** — `06-BINDING_MAP` §3 khai vùng này cho mọi trang chi tiết, nhưng
   **không template nào đang render nó** (9 trong 15 cảnh báo của `g3`). Anh quyết dựng nó
   trong mockup hay đề xuất bỏ dòng đó khỏi binding map — nhưng phải **nói ra**, không lặng
   lẽ chọn.
2. **Bố cục cho 1 mục** — nếu anh thấy một khối không thể trông tử tế với 1 mục, nói ra
   thay vì vẽ đại.
3. **Font** — hiện là Be Vietnam Pro và Plus Jakarta Sans. Muốn đổi thì đề xuất kèm lý do,
   chủ dự án quyết.

## Cổng ra

Giao xong thì **dừng, chờ chủ dự án duyệt QA1** (`GOVERNANCE` 4.3). Điều kiện ra:

- Mọi vùng trên mockup đối chiếu được về một dòng trong `06-BINDING_MAP`.
- Mỗi khối có khai trạng thái 1 mục / vài mục / nhiều mục.
- Không giá trị màu hay cỡ chữ nào nằm ngoài token.
- Ba bộ giao diện đều dùng được.

**Không tự mở cổng sang bước 8.** Chủ dự án chốt.

## Ràng buộc thời gian

Mốc ra mắt **2026-08-09**. Nếu phải chọn, ưu tiên **trang tour chi tiết** trước trang chủ:
đó là trang chốt đơn. Thà giao hai trang chắc còn hơn ba trang dở.

> **Ghi chú về đường dẫn.** Prompt trên nhắc tới đường dẫn file trong repo. Nội dung những
> file đó đã có sẵn ở mục 2–6 bên dưới; không cần mở repo để đọc.

---

# 2. `docs/core-specs/06-BINDING_MAP.md`

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

- **Phiên bản:** v2.0.0   **Trạng thái:** nháp pha E, chờ chủ dự án duyệt lại (bản v1 phê chuẩn 2026-06-12 mô tả một site khác — xem DR-005)
- **Ngày:** v1 soạn và phê chuẩn 2026-06-12; v2 soạn 2026-08-05   **Người soạn:** Cowork   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Liên quan:** `01-CONTENT_MODEL.md` v1.0.14 (nguồn sự thật field), `05-URL_MAP-and-DB_SCHEMA.md` (cây trang), `02-SAD.md` 3.1 (prices.yaml), `04-CONSTRAINTS.md` (I6, I16, PY, R), `src/site.config.ts` (phạm vi site, ADR-0021), ADR-0003, ADR-0004, ADR-0007, ADR-0023 (điều hướng).

> **Đổi gì ở v2.** Đóng DR-005 (khai loại trang không tồn tại, thiếu loại trang đang chạy), DR-007 phần đặc tả, DR-011 (`organization.sameAs`). Bốn entity `restaurant`, `specialty`, `event` đang tắt ở `site.config.ts` nên bảng của chúng chuyển xuống phụ lục §8. Thêm bảng cho trang chủ, hai trang tĩnh, trang lộ trình. §7 viết lại cho đúng sự thật.
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
| Breadcrumb | `containedInPlace` deref thành chuỗi cha (build) | có với entity có `containedInPlace` | dùng nhánh URL: tên nhánh theo 05 mục 1.2 | quan hệ là dữ liệu, breadcrumb là trình bày (05 mục 1.1). không áp dụng: article, person, organization, experience, tour, specialty, event |
| Hero | `title` cộng `mainImage` (kèm alt); `gallery` đủ 4 ảnh sau khi loại trùng `mainImage` thì đi qua Hero mosaic | title có (gate); mainImage nên có | thiếu mainImage thì hero thuần chữ; gallery dưới 4 ảnh thì hero ảnh đơn; không ảnh placeholder | desktop đủ 4 gallery: ảnh chính bên trái, gallery 2x2 bên phải kiểu Hotel với 4 ô bằng nhau; mobile: ảnh chính trên, thumbnail strip 4 ô đều dưới; alt bắt buộc khi có ảnh (2.0) |
| Đoạn mở | `summary` | có (gate, I10) | — | tự đứng được như câu trả lời hoàn chỉnh; nguồn speakable |
| Thân bài | `body` (portable text) | nên có | ẩn (mặc định) | ảnh inline trong body với Article. không áp dụng: person (dùng `bio` thay vai, xem §4.11) |
| Gallery | `gallery` (kèm alt từng ảnh) | nên có với entity có field | ẩn | Không render gallery section rời trên detail; gallery detail phải đi qua Hero mosaic. không áp dụng: article, person, organization |
| Điểm nổi bật | `highlights` | tùy | ẩn | không áp dụng: organization, person, article |
| Hỏi đáp | `faq` | tùy | ẩn | nuôi FAQPage trong JSON-LD. không áp dụng: person, organization |
| Phân loại | `category` deref Category | tùy | ẩn | chỉ term thuộc bộ có trang công khai render thành link tới trang term; general-category không render (2.13) |
| Nhãn loại entity | `placeType`, `attractionType`, `experienceType`, `specialtyType`, `orgType`, `articleType`, `tourFormat` — mỗi entity nhiều nhất một field | tùy | ẩn | không áp dụng: hotel, resort, person, touristDestination | nhãn ngắn cạnh tiêu đề hoặc trong InfoBar; cùng field nuôi nhãn phụ của card 5.1, không khai lại |
| Xác minh dữ liệu | `sameAs` | tùy | ẩn cả dòng, không hiện nhãn trống | link hồ sơ Wikidata/Wikipedia đầu tiên trong mảng; tín hiệu E-E-A-T. Là nguồn `sameAs` trong JSON-LD. không áp dụng: article, experience, tour |
| Điện thoại | `telephone` | tùy | ẩn, không CTA giả | không áp dụng: place, experience, tour, article, person, touristDestination, hotel, resort |
| Ngày cập nhật | `updatedAt`, `_updatedAt` | có | — | S2.4, hiện cả HTML. `_updatedAt` là dấu thời gian hệ thống của Sanity, dùng khi `updatedAt` biên tập chưa đặt |
| Vùng giá cộng CTA đặt | `prices.yaml` qua khóa `bookingRef` | chỉ entity thương mại | ẩn cả vùng, không CTA giả (quyết định nền 3) | hình dạng nhãn theo entity, xem delta. không áp dụng: place, article, person, organization |

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

Thứ tự và ẩn/hiện từng khối do `siteSettings.sections` quyết (biên tập viên kéo thả trong Studio); thiếu `sections` thì dùng `DEFAULT_SECTIONS` trong code.

| Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
|---|---|---|---|---|
| Thứ tự và bật/tắt khối | `siteSettings.sections` | tùy | dùng DEFAULT_SECTIONS trong code | `key` là enum đóng; `hidden` chỉ để tắt khối đã có dữ liệu |
| Hero: lời chào | `siteSettings.heroText` theo ngôn ngữ | tùy | dùng SITE_COPY trong code | |
| Hero: ảnh nền | `mainImage` của touristDestination | nên có | nền thuần màu | |
| Hero: nút chính | config (build): `destinationHref` | có | — | trỏ trang điểm đến |
| Hero: nút phụ | config (build): mục đầu tiên của `nav` | có | ẩn khi `nav` rỗng | ADR-0023 — không hardcode hub |
| Các khối nội dung | như §4.1 (trust bar, banner, hub grid, areas, guides, featured, faq, safety) | tùy | khối rỗng tự ẩn dù `hidden = false` | empty guard là cổng cứng, xem §4.1 |
| JSON-LD | `WebSite` cộng `Organization`; `telephone`/`email` từ `siteSettings.contact` | có | field liên hệ trống thì không phát thuộc tính đó | guard rỗng §5.1 |

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



---

# 3. `docs/core-specs/07-DESIGN_TOKENS.md`

# 07 — DESIGN TOKENS (bước 7: bề mặt và hệ thị giác)

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Nguồn: nhatrangtravel/project/07-DESIGN_TOKENS.md · Nhóm B (khuôn + dữ liệu site)
Khuôn tái dùng: cấu trúc bộ token, quy tắc "hai accent hai vùng" (hành động vs nội dung),
reduced-motion, quy tắc đổi token (cửa hai chiều vs rebrand), dual-font approach.
⚠️ Bản chất token LÀ ĐỂ MỖI SITE ĐIỀN. Mọi GIÁ TRỊ dưới đây là của nhatrangtravel.
Phần riêng site (tìm 🔧 SITE-SPECIFIC): mọi mã màu, tên font, "triết lý cảnh quan Khánh Hoà".
Phần KHÔNG nhãn (cấu trúc bộ token, quy tắc hai-accent, quy tắc đổi token) = khuôn.
═══════════════════════════════════════════════════════════════════ -->

> Nguồn token duy nhất của dự án: mọi giá trị giao diện trong code phải sinh từ đây, hardcode ngoài nguồn token là vi phạm P6/N7 và bị fitness function chặn (CONTROL_GATES tầng 1). Design đề xuất, chủ dự án duyệt (vai A ở RACI).
>
> 🔧 **SITE-SPECIFIC:** mọi giá trị màu, font, và "triết lý cảnh quan Khánh Hoà" là của nhatrangtravel. Giữ *khung token + quy tắc*; thay *toàn bộ giá trị* theo bản sắc site mới.

- **Trạng thái:** đã duyệt, founder phê chuẩn toàn văn 2026-06-12; bổ sung triết lý cảnh quan Khánh Hoà 2026-06-30
- **Ngày:** soạn và phê chuẩn 2026-06-12   **Người soạn:** Claude Design (qua Cowork)   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Liên quan:** `06-BINDING_MAP.md` đã duyệt (vùng giao diện mà token phục vụ), `00-PROJECT_BRIEF.md` mục 6 (Lighthouse mobile ≥ 90, LCP ≤ 2500 ms, CLS ≤ 0,1, WCAG AA).

## 0. Quyết định nền (founder chốt qua trắc nghiệm 2026-06-12)

1. Hướng màu: xanh biển sâu làm primary, accent cát ấm san hô chỉ dành cho CTA và nhãn giá. Nền màu phục vụ chữ và ảnh, không tranh sân khấu với ảnh thật của Nha Trang; CTA nổi vì là màu ấm duy nhất trên nền lạnh. Bổ sung 2026-06-30: bản sắc Khánh Hoà không chỉ là biển; thiết kế phải cho phép ảnh và motif gợi thêm đồng lúa, đầm phá, chân núi và rừng, nhưng không mở thêm palette brand mới khi chưa rebrand. Loại: xanh ngọc nhiệt đới (giống OTA, contrast khó), trung tính editorial (lạnh, thiếu bản sắc), cam san hô làm primary (mệt mắt khi phủ toàn site).
2. Hệ chữ phase 1.1 (cập nhật 2026-06-29): giữ hai font self-host hiện có để không thêm tải mạng hay font chưa có file. Be Vietnam Pro dùng cho heading/display; Plus Jakarta Sans dùng cho body/UI. Điều chỉnh độ dễ đọc tiếng Việt bằng token: chữ nền lớn hơn, line-height thoáng hơn, bỏ letter-spacing âm, heading bớt nặng. Nếu muốn body chuyển hẳn sang Be Vietnam Pro mềm hơn, cần bổ sung woff2 weight 400/500 trước rồi mới đổi token.
3. Tông bề mặt: bo vừa, card và ảnh 12px, nút và nhãn 8px. Cân giữa thẩm quyền và thân thiện cho site nặng card. Loại: bo nhỏ 2-4px (khô, cứng với ảnh biển), bo lớn 16-24px (trôi về thẩm mỹ OTA).
4. Phạm vi phase 1 (Design tự khóa theo nguyên tắc completeness): không dark mode; không token semantic success/error (site tĩnh không form, thêm khi cần qua cửa hai chiều); không font mono. Thiếu có chủ ý, không phải sót.

## 1. Màu

Mọi cặp màu chữ trên nền dưới đây đã kiểm WCAG AA (≥ 4,5:1 với chữ thường).

| Token | Giá trị | Dùng cho |
|---|---|---|
| color.primary | #0C4A6E | heading, link, nhãn nhánh ở header, viền focus; chữ trắng trên nền này đạt AA |
| color.primary.strong | #082F49 | hover và active của link, nền footer, nền header đậm nếu mockup chọn |
| color.primary.soft | #F0F7FC | nền khối nhấn nhẹ (hỏi đáp, số liệu nhanh, lưu ý an toàn) với chữ text |
| color.accent | #C0392B | san hô — nút CTA đặt, CTA gọi điện; chữ trắng đạt 5.44 (AA) |
| color.accent.strong | #96271A | hover của CTA; chữ nhãn giá trên nền accent.soft |
| color.accent.soft | #FEF2F0 | nền nhãn giá trên card và vùng giá ("từ X, cập nhật [ngày]") |
| color.surface | #FFFFFF | nền trang mặc định — **chủ dự án chốt 2026-08-06, giải DR-003**; `08-QA_CHECKLIST` B4 phải sửa theo |
| color.surface.alt | #F8FAFC | nền xen kẽ khối, nền card trên nền trắng |
| color.sea | #0E7490 | ngọc lam vịnh nông — nhãn tự nhiên, tiện ích, trạng thái thành công; chữ trắng đạt 5.36 (AA) |
| color.sand | #F5A623 | cát biển — nhãn ấm, gạch chân trang trí. **Không dùng làm nền CTA**: tương phản với chữ trắng không đạt AA |
| color.text | #0F172A | chữ chính trên surface và surface.alt |
| color.text.muted | #475569 | mô tả ngắn trên card, ngày cập nhật, nhãn phụ, breadcrumb |
| color.text.inverse | #F8FAFC | chữ trên primary, primary.strong, accent |
| color.border | #E2E8F0 | viền card, viền bảng, kẻ phân vùng |

Quy tắc dùng accent: accent chỉ xuất hiện ở vùng hành động và nhãn giá (binding map 5.1, các vùng giá cộng CTA ở mục 4). Vùng nội dung không dùng accent. Đây là cách giữ luật "không CTA giả" của 06 ở tầng thị giác: thấy màu ấm là có hành động thật.

**Quy tắc cảnh quan biển đảo** (chủ dự án chốt hướng thị giác 2026-08-06, thay quy tắc cảnh quan cũ):

- `color.primary` là **biển sâu** — vai trò tin cậy, heading, link.
- `color.sea` là **vịnh nông** — tự nhiên, tiện ích, trạng thái thành công.
- `color.sand` là **cát** — nhãn ấm và chi tiết trang trí. Không làm nền CTA.
- `color.accent` là **san hô** — chỉ xuất hiện ở vùng hành động và nhãn giá.

**Cấm token và hoạ tiết đất liền.** Không thêm màu hay hoạ tiết gợi ruộng lúa, đồng bằng, núi rừng, đường bình độ. Bản v1 có `--c-land-rice`, `--c-land-forest`, `--pattern-rice-lines`, `--pattern-contour-lines` — đó là bộ nhận diện của một site du lịch Nha Trang nói chung, không phải của một công ty bán tour biển đảo. Đã gỡ (DR-002).

**Nền trang là trắng thuần**, không gradient phủ toàn trang. Ảnh thật của biển và đảo là thứ mang màu; nền phải lùi lại để ảnh nổi lên.

## 1b. Bộ giao diện chọn được (thêm 2026-08-06)

Chủ dự án chọn bộ đang bật trong Sanity Studio (`siteSettings.theme`). **Studio chỉ chọn, không nhập giá trị màu** — nên đây vẫn là một nguồn sự thật: bảng dưới đây.

Mỗi bộ chỉ đổi bốn token màu gốc; toàn bộ chữ, khoảng cách, bo góc, bóng giữ nguyên. Đổi bộ là đổi tông, không phải đổi hệ thống.

| Bộ | `surface` | `primary` | `accent` | `text` | Cảm giác |
|---|---|---|---|---|---|
| `bien-sau` **(mặc định)** | #FFFFFF | #0C4A6E | #C0392B | #0F172A | biển sâu, trắng sạch |
| `cat-bien` | #FDFAF5 | #155E75 | #B45309 | #1C1917 | cát ấm, nắng chiều |
| `ngoc-lam` | #FFFFFF | #0F766E | #BE123C | #0F172A | nước nông, trong |

**Ngưỡng bắt buộc.** Mọi bộ phải đạt WCAG AA ở bốn cặp: chữ chính trên nền, chữ mờ trên nền, chữ trắng trên `primary`, chữ trắng trên `accent` — tất cả ≥ 4.5.

Đo được, không phải lời hứa: `npm --prefix scripts run check:theme` chạy lại bảng này và **thoát 1 nếu có cặp nào rớt**. Thêm bộ mới mà quên kiểm thì lệnh đó đỏ.

| Bộ | chữ/nền | chữ mờ/nền | trắng/primary | trắng/accent |
|---|---|---|---|---|
| `bien-sau` | 17.85 | 7.58 | 9.46 | 5.44 |
| `cat-bien` | 16.80 | 7.33 | 7.27 | 5.02 |
| `ngoc-lam` | 17.85 | 7.58 | 5.47 | 6.29 |

Thêm bộ mới: thêm một dòng ở đây, một khối `:root[data-theme="..."]` trong `tokens.css`, một giá trị vào enum ở `cms/schemas/siteSettings.ts`, rồi chạy `check:theme`.

## 2. Chữ

| Token | Giá trị | Dùng cho |
|---|---|---|
| font.family.heading | "Be Vietnam Pro", system-ui, sans-serif | heading mọi cấp |
| font.family.body | "Plus Jakarta Sans", system-ui, -apple-system, sans-serif | body, card, nhãn, breadcrumb, meta, nav |
| font.weight | 500, 600, 700, 800, 900 | body 500; nhãn, nút, nhãn phụ card 600; heading chung 700; display đặc biệt 800/900 khi thật cần |
| font.size.base | 17px (1.0625rem) | body; không nhỏ hơn 17px trên nội dung chính |
| font.size.scale | 1,2-1,25 | bậc thang runtime: 17 / 22 / 26 / 32 / 40 / 42 / 46 |
| font.size.sm | 15px (0.9375rem) | nhãn phụ card, breadcrumb, ngày cập nhật; không nhỏ hơn cỡ này trong UI chính |
| font.size.label | 14px (0.875rem) | nhãn, chip, meta ngắn |
| font.size.badge | 12px (0.75rem) | badge ngắn; không dùng cho đoạn văn |
| line-height | 1,16 heading; 1,68 body | tối ưu đọc tiếng Việt có dấu, tránh dòng quá đặc |
| letter-spacing | 0 | không dùng tracking âm cho heading tiếng Việt |
| measure | tối đa 70ch | cột chữ thân bài Article và đoạn mở; ảnh và bảng được tràn rộng hơn |

Tải font hiện tại: self-host woff2 trên Cloudflare cùng origin. File đang có: Be Vietnam Pro 700/800 và Plus Jakarta Sans 500/600/700, đều có latin + vietnamese subset. `font-display: swap`, preload Be Vietnam Pro 700 và Plus Jakarta Sans 500. Không gọi Google Fonts runtime. Nợ có chủ ý: chưa có Be Vietnam Pro 400/500 nên chưa chuyển body sang Be Vietnam Pro toàn site; thêm font weight mới là thay đổi hiệu năng cần QA LCP.

## 3. Khoảng cách, bo góc, bóng

| Token | Giá trị | Dùng cho |
|---|---|---|
| space.scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px | mọi margin, padding, gap sinh từ thang này |
| space.section | 48 mobile / 96 desktop | nhịp dọc giữa các vùng trang chi tiết |
| container.max | 1200px | khung nội dung; thân bài Article hẹp hơn theo measure 70ch |

| Token | Giá trị | Dùng cho |
|---|---|---|
| radius.sm | 8px | nút, input tìm kiếm nếu có, nhãn giá |
| radius.md | 12px | card, ảnh trong card, gallery, khối nhấn |
| radius.pill | 999px | nhãn phụ card (attractionType, eventType...), nhãn miễn phí |

| Token | Giá trị | Dùng cho |
|---|---|---|
| shadow.card | 0 1px 3px rgba(15, 23, 42, 0.08) | card ở trạng thái nghỉ |
| shadow.raised | 0 4px 12px rgba(15, 23, 42, 0.10) | card hover, khối nổi |
| shadow.overlay | 0 12px 32px rgba(15, 23, 42, 0.16) | menu ngôn ngữ, lớp phủ duy nhất phase 1 |

## 4. Breakpoint

Mobile-first, bốn mốc, min-width:

| Token | Giá trị | Quy tắc co giãn |
|---|---|---|
| bp.sm | 640px | lưới card 1 cột lên 2 cột |
| bp.md | 768px | header gọn chuyển header đầy đủ |
| bp.lg | 1024px | lưới card lên 3 cột; sidebar mục lục Article nếu mockup chọn |
| bp.xl | 1280px | container chạm max 1200px, không thêm cột |

Số cột là quy tắc mặc định cho lưới card 5.1; mockup được chỉnh trong phạm vi mốc này, không thêm mốc mới.

## 5. Chuyển động

| Token | Giá trị | Dùng cho |
|---|---|---|
| motion.fast | 150ms | hover link, nút, card |
| motion.base | 250ms | mở menu ngôn ngữ, accordion hỏi đáp |
| motion.easing | cubic-bezier(0.2, 0, 0, 1) | mọi transition |

Quy tắc: `prefers-reduced-motion: reduce` tắt mọi transition và animation (về 0ms). Cấm animation tự chạy (carousel tự trượt, ảnh nền chuyển động): vừa hại LCP và CLS, vừa vô nghĩa với máy đọc.

## Quy tắc đổi token

Đổi giá trị token là cửa hai chiều (đổi nhanh, có duyệt). Đổi cấu trúc token hoặc thêm hệ màu mới là rebrand, cần chủ dự án phê chuẩn (ARTIFACT_OWNERSHIP).


---

# 4. `docs/core-specs/00-PROJECT_BRIEF.md`

# 00 — PROJECT BRIEF (bước 0: định vị và ràng buộc)

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Khuôn PR-FAQ (Working Backwards): cấu trúc 7 mục, ba tầng chặn rủi ro.
Bản v2 viết lại toàn bộ NỘI DUNG cho tourdaovn; giữ nguyên CẤU TRÚC 7 mục.
Bản v1 (nhatrangtravel) xem lịch sử git — không giữ song song để khỏi hai nguồn sự thật.
═══════════════════════════════════════════════════════════════════ -->

> Working Backwards (PR-FAQ): hình dung sản phẩm đã ra mắt thành công, viết thông cáo trước, xây sau. DRI: Lưu Tuấn Vũ.
>
> **Bước 0 là bước của chủ dự án.** `PLAYBOOK` Phần 2: *"quyết định chiến lược là của người"* — Cowork chỉ ghi chép. Mọi mục dưới đây đều truy được về một câu chủ dự án đã nói (2026-08-05 và 2026-08-06). Không mục nào do tác nhân tự nghĩ ra.

- **Phiên bản:** v2.0.0 (viết lại toàn bộ cho tourdaovn)   **Trạng thái:** đã chốt — chủ dự án trả lời trọn năm câu 2026-08-06. Bước 0 đóng.
- **Ngày:** v1 (nhatrangtravel) 2026-06-10; v2 soạn 2026-08-06   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Nguồn dữ kiện v2:** phiên làm việc 2026-08-05 — chủ dự án khai sáu dòng dịch vụ và chốt menu; `src/site.config.ts` (thương hiệu, tên miền, ngôn ngữ, danh mục); `siteSettings` trong Sanity (kênh liên hệ); ADR-0021, ADR-0023.
- **Đóng:** DR-006 phần đặc tả.

---

## 1. Thông cáo ra mắt tưởng tượng (1 đoạn)

Chủ dự án chốt 2026-08-06.

> *Công ty TNHH Tour Đảo (tourdao.vn) nhận đặt tour biển đảo Nha Trang cho cả khách lẻ và khách đoàn: tour đảo, lặn biển, vé vào cổng khu vui chơi, phòng khách sạn và resort, cùng xe đưa đón sân bay. Công ty vừa tự vận hành tour của mình, vừa kết nối sản phẩm của đối tác, nên khách gọi một đầu mối là xong cả chuyến. Mỗi chuyến có xe đưa đón tận nơi và hướng dẫn viên đi cùng; giá tốt, thanh toán linh hoạt. Đặt chỗ qua Zalo, người thật trả lời.*

## 2. Khách hàng và nỗi đau

Chủ dự án chốt 2026-08-06: **khách lẻ và khách đoàn**. Site chỉ chạy tiếng Việt (`langs = ['vi']`).

- **Khách lẻ và nhóm nhỏ**: cần biết tour đi những đảo nào, giá bao nhiêu, đón ở đâu, có đáng tin không — trước khi chuyển tiền cho một số điện thoại lạ.
- **Khách đoàn** (công ty, trường, hội nhóm): cần một đầu mối lo trọn gói xe, vé, phòng, hướng dẫn viên, và cần báo giá nhanh.
- **Máy đọc**: search và AI engine cần dữ liệu có cấu trúc để trả lời đúng khi khách hỏi "tour 3 đảo Nha Trang giá bao nhiêu". Site đã có sẵn lớp này (JSON-LD, `llms.txt`, `/ai/*.json`).

Nỗi đau: thông tin tour đảo trôi nổi trên Facebook và các trang trung gian, giá mỗi nơi một kiểu, lịch trình sơ sài, không rõ ai chịu trách nhiệm. Khách đoàn thì phải ghép từ nhiều nhà cung cấp.

## 3. Giải pháp và giá trị khác biệt

**Câu định vị** (chủ dự án chốt 2026-08-06): Tour Đảo là đầu mối trọn gói cho chuyến biển đảo Nha Trang, nhận cả khách lẻ lẫn khách đoàn, tự vận hành phần lõi và kết nối phần còn lại.

**Sáu dòng dịch vụ** chủ dự án khai 2026-08-05:

1. Tham quan biển đảo
2. Tour đảo Nha Trang
3. Tour lặn biển
4. Vé VinWonders Nha Trang
5. Đặt phòng khách sạn 5 sao và resort
6. Đưa đón sân bay

Và **cách khách đặt**: nút "Đặt vé trực tuyến" dẫn thẳng sang Zalo, lấy từ `siteSettings.contact.zaloUrl`. Không có giỏ hàng, không thanh toán trên site.

**Bốn điểm khác biệt** chủ dự án chốt 2026-08-06:

- **Xe đưa đón tận nơi** — không bắt khách tự ra bến.
- **Hướng dẫn viên đi cùng** — có người chịu trách nhiệm suốt chuyến.
- **Giá tốt** — xem ghi chú pháp lý bên dưới.
- **Thanh toán linh hoạt.**

Cộng hai điểm suy ra từ cách vận hành: **một đầu mối cho cả chuyến** (tự vận hành cộng kết nối đối tác), và **đặt qua Zalo, người thật trả lời**.

> ⚠️ **Ghi chú pháp lý — cách viết "giá tốt".** Chủ dự án nói "giá tốt nhất thị trường". Luật Quảng cáo 2012 Điều 8.11 cấm quảng cáo so sánh trực tiếp sản phẩm của mình với sản phẩm cùng loại của tổ chức khác. "Tốt nhất thị trường" đúng hình dạng bị cấm và cần chứng minh được nếu bị hỏi. Trên site viết **"giá tốt"** kèm một cam kết kiểm chứng được (ví dụ không phụ thu, báo giá trọn gói), không dùng dạng so sánh tuyệt đối. Chủ dự án muốn giữ nguyên câu gốc thì cần chấp nhận rủi ro này thành văn.

## 4. FAQ khó nhất

**Tiền đến từ đâu?** Hai nguồn: bán tour công ty tự vận hành, và hoa hồng từ sản phẩm bán lại của đối tác (vé vào cổng, phòng khách sạn, một phần tour). Chủ dự án chốt 2026-08-06.

*Hệ quả lên dữ liệu:* `Organization.orgType` của chính công ty là `travelAgency`. Với sản phẩm bán lại, `Tour.operator` phải trỏ đúng đơn vị vận hành thật, không trỏ về Tour Đảo — nếu không, dữ liệu có cấu trúc sẽ khai sai ai là người vận hành.

**Vì sao khách tin một công ty chưa nghe tên?** Bốn điểm ở §3 là câu trả lời khi khách đã vào site. Site có sẵn chỗ cho tín hiệu tin cậy — giấy phép (`licenseInfo`), tác giả thật, ngày cập nhật — nhưng **chưa có nội dung**; đây là việc nhập liệu, không phải việc code.

**Rủi ro lớn nhất của đợt này là thời gian, không phải kỹ thuật.** Mốc ra mắt 3 ngày (§6) trong khi dataset đang có 9 document và cần 4 sản phẩm hoàn chỉnh. Việc còn lại gần như toàn bộ là nhập nội dung trong Sanity Studio, và đó là việc của chủ dự án chứ không phải của tác nhân.

## 5. Phạm vi

Dữ kiện chắc chắn, đọc từ `src/site.config.ts`.

**Trong phạm vi:**

- Tiếng Việt, một ngôn ngữ (`langs = ['vi']`). Bộ khung đa ngữ còn trong code nhưng đã khoá.
- Chín danh mục đang bật: `place`, `attraction`, `experience`, `hotel`, `resort`, `tour`, `article`, `person`, `organization`.
- Bốn hub: `/kham-pha/`, `/luu-tru/`, `/di-lai/`, `/tat-ca/`.
- Hai trang tĩnh: `/ho-tro/`, `/lien-he/` (ADR-0023).
- Đặt chỗ qua Zalo; site không xử lý thanh toán.
- Stack Sanity + Astro + Cloudflare (ADR-0001), không đổi.

**Ngoài phạm vi:**

- Ba danh mục đang tắt: `restaurant`, `specialty`, `event`. Schema và code còn, chỉ tắt cờ.
- Mở thêm ngôn ngữ — chỉ sau khi bản tiếng Việt vững.
- Thanh toán trực tuyến, giỏ hàng, quản lý chỗ trống.
- Entity `Transfer` cho đưa đón sân bay — chủ dự án chốt hoãn 2026-08-05 (ND-006), dù đây là một trong sáu dịch vụ.
- Trang lộ trình đón khách `/lo-trinh-don-khach/` — còn ở chế độ phát triển, cờ `devPages` để `false`.

## 6. Tiêu chí thành công đo được

Chủ dự án chốt 2026-08-06.

| Chiều | Ngưỡng | Ghi chú |
|---|---|---|
| Thời điểm ra mắt | **2026-08-09** (3 ngày kể từ 2026-08-06) | |
| Nội dung tại mốc ra mắt | **4 sản phẩm** có trang đầy đủ | hiện có 1 (`tour-3-dao-nha-trang-review-chi-tiet`), cần thêm 3 |
| Chuyển đổi | chưa đặt ngưỡng | đo sau ra mắt, cần công cụ đếm lượt bấm Zalo — chưa có |
| Tìm kiếm | chưa đặt ngưỡng | 3 ngày là quá ngắn để đặt mục tiêu organic |

Chất lượng kỹ thuật đã có ngưỡng ở `04-CONSTRAINTS` §3, không quyết lại: Lighthouse performance ≥ 90, accessibility ≥ 95, JSON-LD hợp lệ 100%.

> **Ghi thẳng:** mốc 3 ngày làm hai chiều "chuyển đổi" và "tìm kiếm" chưa đo được. Đây là ra mắt để có mặt, chưa phải để đạt chỉ tiêu. Nên đặt lại hai ngưỡng đó sau khi site sống được một tháng.

## 7. Ràng buộc đầu vào

Dữ kiện chắc chắn:

- **Thương hiệu:** tên hiển thị "Tour Đảo", pháp nhân "Công ty TNHH Tour Đảo", thành lập 2026. Nguồn duy nhất: `src/site.config.ts` (ADR-0021).
- **Tên miền:** `tourdao.vn`.
- **Ngôn ngữ:** tiếng Việt, viết sentence case, giọng trực diện.
- **Kênh liên hệ:** hotline, Zalo, WhatsApp, email — nguồn duy nhất là `siteSettings.contact` trong Sanity, biên tập viên tự sửa.
- **Stack:** Sanity + Astro + Cloudflare (ADR-0001).
- **Cổng phát hành:** validator đã gỡ khỏi đường tự động (ADR-0022); `reviewStatus == "approved"` trong Sanity là cổng duyệt nội dung tự động duy nhất còn hiệu lực.
- **Ràng buộc dữ liệu:** Sanity không lưu con số giá (I1); giá đi một chiều từ `data/prices.yaml` qua `bookingRef` (ADR-0003, ADR-0007).

- **Thời gian:** ra mắt 2026-08-09, ba ngày kể từ khi chốt brief.
- **Địa danh:** luật `I15` (cấm chuỗi "thành phố Nha Trang") **không còn áp dụng** cho tourdaovn — chủ dự án chốt 2026-08-06. Xem `04-CONSTRAINTS` §1.

## 8. Trạng thái bước 0

Chủ dự án đã trả lời cả năm câu ngày 2026-08-06. **Bước 0 đóng**, pha B mở.

Hai việc còn treo, không chặn bước 1:

1. **Câu "giá tốt nhất thị trường"** — xem ghi chú pháp lý ở §3. Site đang viết bản an toàn; chủ dự án muốn giữ câu gốc thì cần chốt thành văn.
2. **Hai ngưỡng chưa đặt ở §6** — đặt lại sau khi site sống một tháng.

---

Điều kiện sang bước 1: chủ dự án duyệt file này. Chưa xong bước 0 thì không đụng bước nào khác.


---

# 5. `src/styles/tokens.css`

```css
/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS — thi hành docs/core-specs/07-DESIGN_TOKENS.md
   Nguồn token duy nhất cho mọi component. 0 hardcoded value bên ngoài file này.

   v2 (2026-08-06) — hướng thị giác BIỂN ĐẢO, chủ dự án chốt:
     • nền trang TRẮNG THUẦN (giải DR-003; 07-DESIGN_TOKENS thắng 08-QA_CHECKLIST)
     • accent đổi sang san hô #C0392B — chữ trắng đạt 5.44, qua AA
     • gỡ toàn bộ token và hoạ tiết ĐẤT LIỀN: ruộng lúa, đồi núi, đường bình độ.
       Đó là nhận diện của một site du lịch nói chung, không phải công ty tour đảo.
   Tham chiếu cũ "DESIGN.md" đã gỡ — file đó chưa bao giờ tồn tại (DR-008).
   ═══════════════════════════════════════════════════════════════ */

:root {
  /* §1 Color — bảng màu biển đảo */
  --c-primary:        #0C4A6E;
  --c-primary-strong: #082F49;
  --c-primary-soft:   #F0F7FC;
  --c-accent:         #C0392B;   /* san hô — CTA, nhãn giá */
  --c-accent-strong:  #96271A;
  --c-accent-soft:    #FEF2F0;
  --c-sand:           #F5A623;
  --c-sand-soft:      #FBE3B3;
  --c-surface:        #FFFFFF;   /* nền trang — trắng thuần */
  --c-surface-alt:    #F8FAFC;   /* khối xen kẽ */
  --c-card:           #FFFFFF;
  --c-text:           #0F172A;
  --c-text-muted:     #475569;
  --c-text-inverse:   #F8FAFC;
  --c-border:         #E2E8F0;
  --c-coral:          #E8654E;
  --c-sea:            #0E7490;   /* ngọc lam vịnh nông */
  --c-green:          #0E7490;   /* bí danh cũ, giữ để không gãy component */
  --c-green-soft:     #DCFCE7;
  --c-green-text:     #166534;
  --c-sand-border:    #e9d3a4;
  --c-sand-text:      #5a4109;
  --c-sand-text-strong: #3d2a05;
  --c-footer-bg:      #0E1A23;
  --c-footer-text:    #9aa9b2;
  --c-footer-border:  #233642;
  --c-footer-muted:   #7d8b95;
  /* Hero fallback + overlay */
  --c-hero-fallback-top:    #d4d9ce;
  --c-hero-fallback-bottom: #b8c4b0;
  --c-hero-fallback-top-teal:    #ceddd9;
  --c-hero-fallback-bottom-teal: #a8c8b8;
  --c-hero-overlay-light:   rgba(255,255,255,.18);

  /* §2 Typography — Vietnamese-readable, token-first */
  --font-display: "Be Vietnam Pro", system-ui, sans-serif;
  --font-ui:      "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
  --fw-500: 500; --fw-600: 600; --fw-700: 700; --fw-800: 800; --fw-900: 900;
  --fs-badge: 0.6875rem;  /* 11px */
  --fs-xs:   0.75rem;     /* 12px */
  --fs-label: 0.875rem;   /* 14px */
  --fs-sm:    0.9375rem;  /* 15px */
  --fs-base:  1.0625rem;  /* 17px */
  --fs-card-title: 1.125rem; /* 18px — card title, nav link */
  --fs-nav:   1.125rem;   /* 18px — nav link, footer heading */
  --fs-h5:    1.25rem;    /* 20px — được đẩy lên từ 22px, khớp hub name */
  /* ── Shared component tokens (trích từ DESIGN.md §5) ── */
  --underline-width: 28px;
  --underline-height: 3px;
  --badge-py: 2px;
  --badge-px: 10px;
  --card-lift: -3px;
  --fs-h4:    1.625rem;   /* 26px */
  --fs-section: 1.75rem;  /* 28px — section heading trong multi-section layout */
  --fs-h3:    2rem;       /* 32px */
  --fs-h2:    2.5rem;     /* 40px */
  --fs-h1:    2.625rem;   /* 42px */
  --fs-hero:  2.875rem;   /* 46px — override hero homepage */
  --lh-heading: 1.16;
  --lh-body:    1.68;

  /* §3 Spacing */
  --s1: 4px;   --s2: 8px;   --s3: 12px;
  --s4: 16px;  --s5: 24px;  --s6: 32px;
  --s7: 48px;  --s8: 64px;  --s9: 96px;

  /* §3.2 Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-pill: 999px;

  /* §3.3 Shadow */
  --shadow-card:    0 1px 3px rgba(15,23,42,0.08);
  --shadow-raised:  0 6px 24px -8px rgba(0,91,150,.15), 0 2px 6px rgba(26,32,44,.05);
  --shadow-lg:      0 16px 48px -12px rgba(0,91,150,.22), 0 4px 12px rgba(26,32,44,.06);
  --shadow-overlay: 0 12px 32px rgba(15,23,42,0.16);

  /* §4 Layout */
  --container: 1200px;
  --container-editorial: 800px;
  --container-padding: 24px;
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;

  /* §6 Motion */
  --m-fast:  180ms;
  --m-base:  300ms;
  --m-ease:  ease;

  /* Component token */
  --header-h: 68px;
  --hero-min-h: 480px;
  --hero-min-h-mobile: 360px;
  --card-img-h: 200px;
}

/* ═══ BỘ GIAO DIỆN CHỌN ĐƯỢC — 07-DESIGN_TOKENS §1b ═══
   Chủ dự án chọn trong Sanity Studio (siteSettings.theme); BaseLayout gắn
   data-theme lên <html>. Không có bộ nào thì :root ở trên là "bien-sau".
   Mỗi bộ CHỈ đổi bốn token màu gốc — chữ, khoảng cách, bo góc giữ nguyên.
   Mọi bộ phải qua WCAG AA: npm --prefix scripts run check:theme */

:root[data-theme='cat-bien'] {
  --c-surface:        #FDFAF5;
  --c-primary:        #155E75;
  --c-accent:         #B45309;
  --c-text:           #1C1917;
  --c-text-muted:     #57534E;
  --c-primary-strong: #0E4A5C;
  --c-accent-strong:  #92400E;
}

:root[data-theme='ngoc-lam'] {
  --c-surface:        #FFFFFF;
  --c-primary:        #0F766E;
  --c-accent:         #BE123C;
  --c-text:           #0F172A;
  --c-text-muted:     #475569;
  --c-primary-strong: #0B5A54;
  --c-accent-strong:  #9F1239;
}

/* ── Reset ── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: var(--fs-base);
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-ui);
  font-weight: var(--fw-500);
  line-height: var(--lh-body);
  color: var(--c-text);
  background: var(--c-surface);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

main {
  position: relative;
  isolation: isolate;
}

/* v2: đã gỡ lớp hoạ tiết phủ toàn trang (đường bình độ + vệt cát).
   Nền trắng để ảnh biển đảo thật là thứ mang màu — 07-DESIGN_TOKENS §1. */
img {
  max-width: 100%;
  display: block;
}

a {
  color: inherit;
  text-decoration: none;
}

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: var(--fw-700);
  line-height: var(--lh-heading);
  margin: 0;
  letter-spacing: 0;
}

h4 {
  font-family: var(--font-display);
  font-weight: var(--fw-700);
  line-height: 1.15;
  margin: 0;
}

p {
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}

```


---

# 6. `docs/design-context/COMPONENT_INVENTORY.md`

# Danh mục component — Tour Đảo

> File sinh tự động bởi `scripts/gen-component-inventory.mjs`. Không sửa tay.
> Sinh lại: `npm run gen:design-context`

Hợp đồng API của thư viện component đang chạy production. Mỗi mục là interface
`Props` nguyên văn trong code, không diễn giải lại.

## Primitive dùng chung (27)

### AuthorityMeta

`src/components/AuthorityMeta.astro`

```ts
export interface Props {
  data: {
    _updatedAt?: string
    updatedAt?: string
    approvedBy?: string
    contentProvenance?: 'human' | 'ai-t1' | 'mixed'
    officialSource?: string
    sameAs?: string[]
    author?: { title?: string; url?: string; sameAs?: string[] }
  }
  lang: Lang
}
```

### Body

`src/components/Body.astro`

```ts
export interface Props {
  blocks: any[] | undefined
  class?: string
}
```

### BookingCTA

`src/components/BookingCTA.astro`

```ts
export interface Props {
  /** Nhãn giá; bỏ trống ở variant fallback (chỉ có nút trỏ nguồn chính thức). */
  priceText?: string
  ctaUrl?: string
  ctaLabel: string
  asOf?: string
}
```

### Breadcrumb

`src/components/Breadcrumb.astro`

```ts
export interface Props {
  containedInPlace?: EntityRef
  entityType: string
  lang: Lang
  hubEntity?: string
  currentTitle?: string
  inverse?: boolean
}
```

### Card

`src/components/Card.astro`

```ts
export interface Props {
  title: string;
  summary: string;
  href: string;
  image?: string;
  imageAlt?: string;
  badge?: string;
  badgeVariant?: 'default' | 'author' | 'free' | 'past';
  priceLabel?: string;
  authorLabel?: string;
}
```

### ContactCTA

`src/components/ContactCTA.astro`

```ts
export interface Props {
  telephone: string
  lang: Lang
}
```

### ContactChannels

`src/components/ContactChannels.astro`

```ts
export interface Props {
  contact?: SiteContact | null
  lang: Lang
}
```

### DetailLayout

`src/components/DetailLayout.astro`

```ts
export interface Props {
  title: string
  lang: Lang
  entityType: string
  image?: string | ImageAsset
  gallery?: ImageAsset[]
  containedInPlace?: EntityRef
  infoBarItems?: InfoBarItem[]
  sidebarSlots: Slot[]
  nearbyTitle: string
  nearby: NearbyEntity[]
  updatedAt: string
}
```

Type phụ trợ:

```ts
export interface InfoBarItem {
  icon: string
  label: string
  value: string
  visible: boolean
} // khai ở InfoBar.astro
export interface Slot {
  name: string
  component: 'BookingCTA' | 'InfoCard' | 'Map' | 'Article' | 'custom'
  visible: boolean
  props: Record<string, any>
} // khai ở Sidebar.astro
```

### EmptyState

`src/components/EmptyState.astro`

```ts
export interface Props {
  entityType: string
  lang: Lang
  message?: string
}
```

### FAQ

`src/components/FAQ.astro`

```ts
export interface Props {
  faq: FAQItem[]
  heading?: string
  lang?: Lang
  contained?: boolean
}
```

### Footer

`src/components/Footer.astro`

```ts
export interface Props {
  lang?: string
}
```

### Gallery

`src/components/Gallery.astro`

```ts
export interface Props {
  images: ImageAsset[]
  lang?: Lang
}
```

### Header

`src/components/Header.astro`

```ts
export interface Props {
  currentPath?: string;
  lang?: string;
  /**
   * Map ngôn ngữ → URL bản dịch CÓ THẬT cho trang hiện tại. Ngôn ngữ vắng trong map =
   * chưa có bản dịch (track QĐ3) → render disable, KHÔNG link chết (audit G5, prompt R5).
   */
  alternates?: Record<string, string>;
}
```

### Hero

`src/components/Hero.astro`

```ts
export interface Props {
  image?: string | ImageAsset
  gallery?: ImageAsset[]
  imageAlt?: string
}
```

### InfoBar

`src/components/InfoBar.astro`

```ts
export interface Props {
  items: InfoBarItem[]
}
```

Type phụ trợ:

```ts
export interface InfoBarItem {
  icon: string
  label: string
  value: string
  visible: boolean
}
```

### InfoCard

`src/components/InfoCard.astro`

```ts
export interface Props {
  rows: InfoRow[]
  lang?: Lang
}
```

Type phụ trợ:

```ts
export interface InfoRow {
  icon: string
  label: string
  value: string
  href?: string
  visible: boolean
}
```

### MapView

`src/components/MapView.astro`

```ts
export interface Props {
  geo: { lat: number; lng: number }
  title: string
  height?: number
  markers?: { lat: number; lng: number; title: string }[]
}
```

### NearbySection

`src/components/NearbySection.astro`

```ts
export interface Props {
  title: string
  entities: NearbyEntity[]
  viewAllUrl?: string
  lang?: Lang
}
```

### PriceDisplay

`src/components/PriceDisplay.astro`

```ts
export interface Props {
  bookingRef?: { key?: string }
  isAccessibleForFree?: boolean
  entityType: string
  lang: Lang
}
```

### RouteDispatch

`src/components/RouteDispatch.astro`

```ts
export interface Props {
  kind: 'detail' | 'index' | 'hub' | 'term' | 'destination' | 'notfound'
  entity: string
  slug?: string
  lang: Lang
}
```

### RouteMap

`src/components/RouteMap.astro`

```ts
export interface Props {
  points: PickupPoint[]
  height?: number
}
```

### Section

`src/components/Section.astro`

```ts
export interface Props {
  heading?: string
  id?: string
  contained?: boolean
}
```

### Sidebar

`src/components/Sidebar.astro`

```ts
export interface Props {
  slots: Slot[]
}
```

Type phụ trợ:

```ts
export interface Slot {
  name: string
  component: 'BookingCTA' | 'InfoCard' | 'Map' | 'Article' | 'custom'
  visible: boolean
  props: Record<string, any>
}
```

### SiteHome

`src/components/SiteHome.astro`

```ts
export interface Props {
  td: TouristDestinationResult | null
  lang: Lang
  destinationHref: string
  config: SiteSettingsResult | null
}
```

### SkeletonCard

`src/components/SkeletonCard.astro`

```ts
export interface Props {
  count?: number
}
```

### TouristDestinationHub

`src/components/TouristDestinationHub.astro`

```ts
export interface Props extends TouristDestinationHubProps {}
```

### WaveDivider

`src/components/WaveDivider.astro`

```ts
export interface Props {
  fill?: string     // CSS color value, mặc định --c-primary
  flip?: boolean    // lật ngược wave (dùng cho top của hubs section)
  opacity?: number  // opacity của wave, mặc định 0.08
  noSecond?: boolean // bỏ wave thứ hai (đường mờ hơn)
}
```

## Template entity detail (13)

### ArticleDetail

`src/components/ArticleDetail.astro`

```ts
export interface Props {
  data: ArticleResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### AttractionDetail

`src/components/AttractionDetail.astro`

```ts
export interface Props {
  data: AttractionResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### EventDetail

`src/components/EventDetail.astro`

```ts
export interface Props {
  data: EventResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### ExperienceDetail

`src/components/ExperienceDetail.astro`

```ts
export interface Props {
  data: ExperienceResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
  contact?: SiteContact | null
}
```

### HotelDetail

`src/components/HotelDetail.astro`

```ts
export interface Props {
  data: HotelResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
  contact?: SiteContact | null
}
```

### LodgingDetail

`src/components/LodgingDetail.astro`

```ts
export interface Props {
  data: HotelResult | ResortResult
  entityType: 'hotel' | 'resort'
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
  contact?: SiteContact | null
}
```

### OrganizationDetail

`src/components/OrganizationDetail.astro`

```ts
export interface Props {
  data: OrganizationResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### PersonDetail

`src/components/PersonDetail.astro`

```ts
export interface Props {
  data: PersonResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### PlaceDetail

`src/components/PlaceDetail.astro`

```ts
export interface Props {
  data: PlaceResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### ResortDetail

`src/components/ResortDetail.astro`

```ts
export interface Props {
  data: ResortResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
  contact?: SiteContact | null
}
```

### RestaurantDetail

`src/components/RestaurantDetail.astro`

```ts
export interface Props {
  data: RestaurantResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### SpecialtyDetail

`src/components/SpecialtyDetail.astro`

```ts
export interface Props {
  data: SpecialtyResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
}
```

### TourDetail

`src/components/TourDetail.astro`

```ts
export interface Props {
  data: TourResult
  lang: Lang
  nearby?: import('../lib/types').NearbyEntity[]
  contact?: SiteContact | null
}
```

## Trang danh sách (5)

### EntityIndex

`src/components/EntityIndex.astro`

```ts
export interface Props {
  entities: ListingEntity[]
  entityType: string
  lang: Lang
  title: string
  description: string
  terms?: { name: string; slug: string }[]
  totalCount?: number
  prices?: Map<string, PriceEntry>
}
```

Type phụ trợ:

```ts
interface ListingEntity {
  title: string
  summary: string
  slug: string
  image?: string
  imageAlt?: string
  attractionType?: string
  experienceType?: string
  servesCuisine?: string[]
  specialtyType?: string
  starRating?: number
  tourFormat?: string
  articleType?: string
  bookingRef?: { key?: string }
  author?: { title: string }
}
```

### EventIndex

`src/components/EventIndex.astro`

```ts
export interface Props {
  upcoming: EventEntity[]
  past: EventEntity[]
  lang: Lang
  prices?: Map<string, PriceEntry>
}
```

Type phụ trợ:

```ts
interface EventEntity {
  title: string
  summary: string
  slug: string
  image?: string
  imageAlt?: string
  eventType: string
  startDate: string
  bookingRef?: { key?: string }
}
```

### HubIndex

`src/components/HubIndex.astro`

```ts
export interface Props {
  sections: HubSection[]
  lang: Lang
  prices?: Map<string, PriceEntry>
}
```

Type phụ trợ:

```ts
interface HubSection {
  title: string
  description?: string
  entityType: string
  entities: ListingEntity[]
  href?: string
}
interface ListingEntity {
  title: string
  summary: string
  slug: string
  image?: string
  imageAlt?: string
  attractionType?: string
  experienceType?: string
  servesCuisine?: string[]
  specialtyType?: string
  starRating?: number
  tourFormat?: string
  articleType?: string
  bookingRef?: { key?: string }
  author?: { title: string }
} // khai ở EntityIndex.astro
```

### TermIndex

`src/components/TermIndex.astro`

```ts
export interface Props {
  term: TermData
  entities: ListingEntity[]
  entityType: 'experience' | 'tour'
  lang: Lang
  prices?: Map<string, PriceEntry>
}
```

Type phụ trợ:

```ts
interface TermData {
  name: string
  description: string
  slug: string
  sameAs?: string
}
interface ListingEntity {
  title: string
  summary: string
  slug: string
  image?: string
  imageAlt?: string
  attractionType?: string
  experienceType?: string
  servesCuisine?: string[]
  specialtyType?: string
  starRating?: number
  tourFormat?: string
  articleType?: string
  bookingRef?: { key?: string }
  author?: { title: string }
} // khai ở EntityIndex.astro
```

### TourIndex

`src/components/TourIndex.astro`

```ts
export interface Props {
  tours: TourEntity[]
  terms: { name: string; slug: string }[]
  lang: Lang
  title?: string
  description?: string
  prices?: Map<string, PriceEntry>
}
```

Type phụ trợ:

```ts
interface TourEntity {
  title: string
  summary: string
  slug: string
  image?: string
  imageAlt?: string
  tourFormat?: string
  bookingRef?: { key?: string }
}
```

## Trang chủ (9)

### HomeAreaGrid

`src/components/HomeAreaGrid.astro`

```ts
export interface Props {
  places?: HomepagePlaceCard[]
  lang: Lang
  heading: string
  viewAllLabel: string
  viewAllHref?: string
}
```

### HomeBannerGrid

`src/components/HomeBannerGrid.astro`

```ts
export interface Props {
  banners?: HomepageBanner[]
  lang: Lang
}
```

### HomeFacts

`src/components/HomeFacts.astro`

```ts
export interface Props {
  facts?: KeyFact[]
}
```

### HomeGuideGrid

`src/components/HomeGuideGrid.astro`

```ts
export interface Props {
  articles?: HomepageArticleCard[]
  lang: Lang
  heading: string
  viewAllLabel: string
  viewAllHref?: string
}
```

### HomeHero

`src/components/HomeHero.astro`

```ts
export interface Props {
  title: string
  summary?: string
  image?: string | ImageAsset
  imageAlt?: string
  eyebrow?: string
  imageCredit?: string
  stampText?: string
  stampYear?: string
}
```

### HomeHubGrid

`src/components/HomeHubGrid.astro`

```ts
export interface Props {
  lang: Lang
  hubCounts?: Record<string, number>
}
```

### HomeMetaBar

`src/components/HomeMetaBar.astro`

```ts
export interface Props {
  // Sanity trả null cho field mảng chưa đặt, không trả undefined, nên default
  // của destructuring không đỡ được. Hợp đồng phải nói rõ là nhận cả null.
  sameAs?: string[] | null
  updatedLabel?: string
  lang: Lang
}
```

### HomeRollupSection

`src/components/HomeRollupSection.astro`

```ts
export interface Props {
  heading: string
  items?: HomeCard[]
  lang: Lang
  viewAllLabel: string
  viewAllHref?: string
  badgeLabel?: string
}
```

Type phụ trợ:

```ts
type HomeCard = EntityRef | HomepagePlaceCard | HomepageArticleCard
```

### HomeTrustBar

`src/components/HomeTrustBar.astro`

```ts
export interface Props {
  items: Array<{ icon: string; title: string; description: string }>
}
```

## Module cần đính kèm để giải hết type

Các `Props` trên tham chiếu type định nghĩa ở những module sau. Đính kèm chúng
cùng inventory, nếu không thì hợp đồng API còn type treo.

- `src/lib/types.ts`

## Tổng kết

| Nhóm | Số component |
|---|---|
| Primitive dùng chung | 27 |
| Template entity detail | 13 |
| Trang danh sách | 5 |
| Trang chủ | 9 |
| **Tổng** | **54** |
