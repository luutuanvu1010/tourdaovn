# 05 — URL MAP và DB SCHEMA (bước 5: cấu trúc IA và schema)

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Nguồn: nhatrangtravel/project/05-URL_MAP-and-DB_SCHEMA.md · Nhóm B (khuôn + dữ liệu site)
Khuôn tái dùng CAO: nguyên tắc cây URL (canonical không prefix, ngôn ngữ khác prefix một cấp),
nhánh phẳng không phân cấp, slug bất biến + redirect, hreflang hai chiều + x-default, hub đa entity.
Phần riêng site cần thay (tìm 🔧 SITE-SPECIFIC):
  - Bảng prefix 5 ngôn ngữ (vi/en/zh/ko/ru) và mọi segment tiếng Việt (kham-pha, luu-tru,
    diem-tham-quan...) → PHẦN RIÊNG NHẤT, phải thành config theo ngôn ngữ + danh mục của site.
Phần KHÔNG nhãn (nguyên tắc cấu trúc URL, slug/redirect/hreflang về mặt cơ chế) = khuôn.
═══════════════════════════════════════════════════════════════════ -->

> Cây địa chỉ và xương dữ liệu, chốt trước khi nghĩ tới khung trang (P1, P3). Cowork soạn, chủ dự án duyệt.
>
> 🔧 **SITE-SPECIFIC:** bảng prefix 5 ngôn ngữ và mọi segment URL tiếng Việt là của nhatrangtravel. Giữ *nguyên tắc* cấu trúc; thay *bảng ngôn ngữ + segment* theo site (nên đưa vào ROUTE_MAP/config).

- **Trạng thái:** đã duyệt, founder phê chuẩn toàn văn 2026-06-12 (gồm hai quyết định kèm ở cuối 1.1)
- **Ngày:** soạn và phê chuẩn 2026-06-12   **Người soạn:** Cowork   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Liên quan:** `01-CONTENT_MODEL.md` v1.0.1 (I9, mục 1, 2.13, mục 3), `02-SAD.md` (3.1 lược đồ prices.yaml), `04-CONSTRAINTS.md` (bảng I, PY và R), ADR-0004 (i18n hybrid), ADR-0007 (nguồn giá), overlay S2.4 và S2.5.
- Nền là 11 quyết định founder chốt qua trắc nghiệm trong phiên 2026-06-12, chi tiết và phương án đã loại ở `DECISIONS.md` cùng ngày.

## 1. Cây URL

### 1.1 Nguyên tắc đã chốt

1. Tiếng Việt là canonical và sống ở root, không prefix. Bốn ngôn ngữ còn lại prefix một cấp: `/en/`, `/zh/`, `/ko/`, `/ru/`. Không trộn ngôn ngữ trong một cây (S2.5); trang chủ ngôn ngữ là bản dịch trang trụ (`/en/`, `/zh/`...).
2. Prefix nhánh nội dung dịch trọn theo từng ngôn ngữ (bảng 1.2). zh, ko, ru dùng chữ bản ngữ cho cả prefix lẫn slug; chấp nhận percent-encode khi copy link, đổi lại URL tự nhiên với người đọc bản ngữ và đúng hướng dịch trọn.
3. Mỗi entity một nhánh phẳng riêng, không phân cấp theo `containedInPlace`: đổi quan hệ cha không vỡ URL; breadcrumb render từ `containedInPlace` ở tầng trình bày, quan hệ là dữ liệu chứ không phải địa chỉ. Nhánh phẳng khớp một-một với I9 (slug duy nhất theo _type) nên trang entity không thể va chạm URL.
4. Term listing (Category bộ experience-type và tour-type, 2.13) sống chung nhánh với entity tương ứng, cũng phẳng: `/trai-nghiem/tam-bun` là trang term, `/trai-nghiem/lan-bien-hon-mun` là trang Experience. URL trang từ khóa chủ lực ngắn nhất; va chạm slug giữa term và entity chặn bằng R1 (04 mục 1c).
5. Bốn hub đa entity cấp 1 nhắm bốn intent lớn: chơi gì, ở đâu, ăn gì, đi lại (bảng 1.3). CollectionPage rollup suy ở build, không phải field (khớp 2.1).
6. Event mỗi kỳ một document: slug kỳ bắt buộc kèm năm (`festival-bien-2026`, khớp startDate là danh tính). URL bất biến trọn đời, quá endDate không redirect, không dời; trang gắn nhãn đã diễn ra ở tầng trình bày (I5). Index `/su-kien/` chia hai khối sắp tới và đã qua ở build.
7. Slug bất biến sau publish. Buộc phải đổi (sai chính tả...) thì đổi được nhưng bắt buộc kèm dòng 301 trong `public/_redirects` (Cloudflare Pages); R3 kiểm URL cũ có lối đi mới cho qua build.
8. Index hết: mọi trang publish đều index, phase 1 không có loại trang noindex (preview chặn bằng auth, general-category không sinh trang). Listing phase 1 hiện tất, chưa phân trang (graph 8 đến 30 entity mỗi nhánh); khi cần phân trang sau này, trang từ 2 trở đi vẫn index với canonical tự trỏ.
9. Trang term chỉ sinh khi có ít nhất 1 entity publish trỏ tới (R2); dưới ngưỡng thì trang chưa tồn tại, không vào sitemap và hreflang, không phải gãy link. Term vẫn tuyển trước được, trang tự mọc khi có dữ liệu (completeness over coverage).
10. hreflang đầy đủ hai chiều giữa mọi bản ngôn ngữ của một trang; x-default trỏ bản vi. Sitemap tách theo ngôn ngữ (`sitemap-vi.xml`, `sitemap-en.xml`...), chỉ chứa trang thật của build (R4).

Hai quyết định kèm, chốt cùng phê chuẩn toàn văn 2026-06-12: canonical host là `https://nhatrangtravel.net` (apex; www redirect 301 về apex); URL dạng thư mục có `/` cuối theo build format directory của Astro, bản thiếu `/` redirect về bản có.

### 1.2 Bảng prefix theo ngôn ngữ

Bộ prefix là cấu hình build tập trung một file. Cột zh, ko, ru founder duyệt 2026-06-12 qua trắc nghiệm: dùng chữ bản ngữ cho prefix và slug, khớp hướng dịch trọn từng ngôn ngữ.

| Nhánh | vi (root) | en | zh | ko | ru |
|---|---|---|---|---|---|
| Hub chơi gì | kham-pha | things-to-do | 玩乐 | 즐길거리 | развлечения |
| Hub ở đâu | luu-tru | where-to-stay | 住宿 | 숙소 | проживание |
| Hub ăn gì | am-thuc | food | 美食 | 먹거리 | еда |
| Hub đi lại | di-lai | getting-around | 交通 | 교통 | транспорт |
| Place | dia-danh | places | 地点 | 장소 | места |
| Attraction | diem-tham-quan | attractions | 景点 | 명소 | достопримечательности |
| Experience | trai-nghiem | experiences | 体验 | 체험 | впечатления |
| Restaurant | nha-hang | restaurants | 餐厅 | 맛집 | рестораны |
| Specialty | dac-san | specialties | 特产 | 특산품 | деликатесы |
| Hotel | khach-san | hotels | 酒店 | 호텔 | отели |
| Resort | resort | resorts | 度假村 | 리조트 | курорты |
| Tour | tour | tours | 旅行团 | 투어 | туры |
| Event | su-kien | events | 活动 | 이벤트 | события |
| Article | cam-nang | guides | 攻略 | 가이드 | гайды |
| Person | tac-gia | authors | 作者 | 작가 | авторы |
| Organization | cong-ty | companies | 公司 | 회사 | компании |

Tên `cong-ty` là lựa chọn founder (câu 6, phiên 2026-06-12).

### 1.3 Bảng mẫu URL

Cột mẫu dùng cây vi làm ví dụ; ngôn ngữ khác thay prefix ngôn ngữ cộng segment theo 1.2, cấu trúc giữ nguyên.

| Mẫu URL | Loại trang | Entity nguồn | Ghi chú (canonical, redirect) |
|---|---|---|---|
| `/` | trang chủ site | WebSite / cấu hình build | bản ngôn ngữ ở `/en/`, `/zh/`...; x-default = `/`; không phải trang entity |
| `/{destinationSlug}/` | trang điểm đến | TouristDestination | **một trang cho MỖI** TouristDestination đã duyệt (ADR-0028), ví dụ `/nha-trang/`, `/phu-quoc/`; bản ngôn ngữ ở `/en/nha-trang/`, `/zh/nha-trang/`... Slug trùng với một segment trong ROUTE_MAP thì bị bỏ qua kèm cảnh báo `[B11]` (`src/pages/[...path].astro:71-74`) |
| `/diem-den/` | trang danh sách điểm đến | TouristDestination approved | CollectionPage. Liệt kê MỌI điểm đến đã duyệt có `slug.vi`; card trỏ về **trang gốc** `/{destinationSlug}/`, **không** phải `/diem-den/{slug}/`. Đây là entry DUY NHẤT trong `ROUTE_MAP` có danh sách và chi tiết ở hai nhánh URL khác nhau — giữ chi tiết ở gốc vì `/nha-trang/` đang xếp hạng, dời nó là quyết định SEO riêng. Thi hành: `touristDestination` bị loại khỏi `fieldLevelEntities` (`src/site.config.ts`) nên `fetchAllSlugs` không sinh trang dưới segment này |
| `/kham-pha/` | hub rollup chơi gì | Attraction cộng Experience (suy ở build) | CollectionPage |
| `/luu-tru/` | hub rollup ở đâu | Hotel cộng Resort | CollectionPage |
| `/am-thuc/` | hub rollup ăn gì | Restaurant cộng Specialty | CollectionPage |
| `/di-lai/` | hub rollup đi lại | Article articleType=transport-guide | CollectionPage |
| `/dia-danh/` | index nhánh | Place | CollectionPage |
| `/dia-danh/{slug}` | chi tiết | Place | |
| `/diem-tham-quan/`, `/diem-tham-quan/{slug}` | index và chi tiết | Attraction | |
| `/trai-nghiem/` | index nhánh | Experience | CollectionPage |
| `/trai-nghiem/{term}` | term listing | Category bộ experience-type | CollectionPage cộng ItemList; sinh theo R2; chống trùng theo R1 |
| `/trai-nghiem/{slug}` | chi tiết | Experience | cùng nhánh với term, R1 |
| `/nha-hang/`, `/nha-hang/{slug}` | index và chi tiết | Restaurant | |
| `/dac-san/`, `/dac-san/{slug}` | index và chi tiết | Specialty | |
| `/khach-san/`, `/khach-san/{slug}` | index và chi tiết | Hotel | |
| `/resort/`, `/resort/{slug}` | index và chi tiết | Resort | |
| `/tour/` | index nhánh | Tour | CollectionPage |
| `/tour/{term}` | term listing | Category bộ tour-type | như term Experience, R1 và R2 |
| `/tour/{slug}` | chi tiết | Tour | |
| `/su-kien/` | index sự kiện | Event | chia hai khối sắp tới và đã qua ở build |
| `/su-kien/{slug-kỳ}` | chi tiết một kỳ | Event | slug kèm năm, URL bất biến, quá hạn không redirect (I5) |
| `/cam-nang/`, `/cam-nang/{slug}` | index và chi tiết | Article | document-level: mỗi ngôn ngữ một document, nhóm qua translationGroup (I7) |
| `/tac-gia/{slug}` | hồ sơ tác giả | Person | url đích cho author trong JSON-LD (E-E-A-T, 2.11) |
| `/cong-ty/{slug}` | hồ sơ đơn vị vận hành | Organization | url đích cho provider và organizer; I18 chặn org mồ côi |
| `/404` | trang lỗi | | không vào sitemap |

### 1.4 Quy tắc slug (quy ước bắt buộc của template)

- Nguồn sinh duy nhất là field slug trong Sanity (I9). Build không tự chế slug, không sửa tay hai nơi; URL đầy đủ = prefix ngôn ngữ (trừ vi) cộng segment nhánh theo 1.2 cộng slug theo ngôn ngữ.
- vi và en: chữ Latin thường không dấu, nối bằng gạch ngang. zh, ko, ru: chữ bản ngữ, không khoảng trắng.
- Khóa duy nhất theo kiểu i18n (I9): entity field-level theo (_type, slug từng ngôn ngữ); Article document-level theo (language, _type); term Category có slug chỉ khi thuộc bộ công khai (2.13).
- Slug bất biến sau publish; đổi phải kèm 301 trong `public/_redirects`, R3 kiểm.
- Slug kỳ Event bắt buộc kèm năm. Quy ước đặt: slug chuỗi cộng năm (`festival-bien-2026`).

## 2. Schema dữ liệu

Nguồn sự thật của field là `01-CONTENT_MODEL.md` mục 2; bảng dưới không định nghĩa lại field nào (P6, câu 11 phiên 2026-06-12), chỉ khai mặt lưu trữ: tên document type, kiểu i18n, khóa, gate trỏ về 01, @type xuất ra.

| Entity | Document type Sanity | i18n (ADR-0004) | Khóa duy nhất (I9) | Gate publish | @type xuất (JSON-LD) |
|---|---|---|---|---|---|
| TouristDestination | touristDestination | field-level | (_type, slug ngôn ngữ) | 01 mục 2.1 cộng I19 | TouristDestination |
| Place | place | field-level | (_type, slug ngôn ngữ) | 01 mục 2.2 cộng I19 | theo placeType (bảng map 2.2) |
| Attraction | attraction | field-level | (_type, slug ngôn ngữ) | 01 mục 2.3 cộng I19 | [TouristAttraction, type theo attractionType] |
| Experience | experience | field-level | (_type, slug ngôn ngữ) | 01 mục 2.4 cộng I19 | TouristAttraction cộng additionalType |
| Restaurant | restaurant | field-level | (_type, slug ngôn ngữ) | 01 mục 2.5 cộng I19 | Restaurant |
| Hotel | hotel | field-level | (_type, slug ngôn ngữ) | 01 mục 2.0b và 2.6 cộng I19 | Hotel |
| Resort | resort | field-level | (_type, slug ngôn ngữ) | 01 mục 2.0b và 2.7 cộng I19 | Resort |
| Tour | tour | field-level | (_type, slug ngôn ngữ) | 01 mục 2.8 cộng I19 | TouristTrip |
| Organization | organization | field-level | (_type, slug ngôn ngữ) | 01 mục 2.9 cộng I18, I19 | TravelAgency hoặc Organization theo orgType |
| Event | event | field-level | (_type, slug ngôn ngữ) | 01 mục 2.10 cộng I19 | theo eventType (bảng map 2.10) |
| Article | article | document-level | (language, _type) | 01 mục 2.11 cộng I19 | NewsArticle khi news, còn lại Article |
| Person | person | field-level | (_type, slug ngôn ngữ) | 01 mục 2.12 cộng I19 | Person |
| Category | category | field-level | termCode; slug chỉ bộ công khai | 01 mục 2.13, miễn I19 | DefinedTerm |
| Specialty | specialty | field-level | (_type, slug ngôn ngữ) | 01 mục 2.14 cộng I19 | Product cộng additionalType |

Nguồn giá: file `prices.yaml` trong repo, lược đồ ở SAD 3.1 (khóa cấp cao nhất là bookingRef, unit enum đóng ba giá trị, hình dạng theo unit), thi hành PY1 đến PY8 (04 mục 1b). Đường dẫn đề xuất `data/prices.yaml`, chốt khi dựng site (món treo giữ nguyên, SAD mục 6).

Không có DB nào khác: hai nguồn duy nhất của hệ là Sanity dataset và `prices.yaml` (P6, S2.7). Build là tầng hợp nhất, không sở hữu dữ liệu.

## 3. Quan hệ và toàn vẹn

- Khóa tham chiếu giữa entity là reference Sanity (bảng quan hệ ở 01 mục 3). bookingRef là khóa mờ dạng chuỗi nối một chiều sang `prices.yaml` (ADR-0007).
- Xóa cha thì con ra sao: Sanity mặc định chặn xóa document đang được reference; mọi trỏ hụt lọt qua (xóa ép, sửa tay dataset) bị CI bắt bằng họ validator ref integrity (I4, I5, I8, I13, I14, I17, I18) và PY4, mức fail nên build dừng trước khi lên trang.
- Bất biến kiểm bằng script: bảng I1 đến I19 (04 mục 1), PY1 đến PY8 (04 mục 1b), R1 đến R4 cho cây URL (04 mục 1c, thêm trong phiên bước 5 theo quyền siết tự do của 04 mục 5).
- Term công khai chưa có entity trỏ tới (R2) không phải lỗi dữ liệu, chỉ là trang chưa sinh; không cảnh báo.

## 4. Di trú

- Schema Sanity: field hay entity mới đi thủ tục CONTENT_MODEL trước rồi mới code (04 mục 2, điều cấm 1 và 2). Thay đổi cấu trúc trên dữ liệu đã có document thật đi qua migration script đánh số trong repo, chạy có log; migration phá hủy dữ liệu là cửa một chiều, cần ADR.
- Lược đồ `prices.yaml`: đổi hình dạng khóa hay enum unit là cửa một chiều, ADR mới supersede ADR-0007.
- Cây URL là API công khai của site, di trú URL coi trọng như di trú schema: đổi segment prefix sau khi ngôn ngữ đó đã sống phải kèm bảng redirect 301 toàn nhánh và ghi DECISIONS; đổi slug lẻ theo R3; URL Event không bao giờ di trú (bất biến trọn đời, 1.1 mục 6).
