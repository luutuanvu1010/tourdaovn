# SPEC — Loại điểm tham quan: mở rộng enum bản thể + tầng nhãn phân loại

- **Trạng thái:** **chủ dự án duyệt toàn văn 2026-08-27** (phương án **A + C**).
  Bản ghi: `QĐ-2026-08-27-03` trong `docs/DECISIONS.md`. Bốn điểm dừng ở §11 đã đóng.
- **Ngày soạn:** 2026-08-27   **Người soạn:** Cowork   **Người duyệt:** chủ dự án
- **Loại quyết định:**
  - Thêm giá trị enum `attractionType`, thêm bộ term `attraction-type` → **cửa hai chiều**
    (`01-CONTENT_MODEL` §5.3 và §2.13: *"thêm bộ mới là cửa hai chiều"*).
  - Sửa tập rẽ nhánh của bất biến **I2** (aquarium đổi nhóm; thêm nhánh thứ ba) →
    **gần một chiều**, `DECISIONS` bắt buộc theo §5.3.
  - Bật `hasTerm` cho nhánh `/diem-tham-quan/` → thêm dòng vào `05-URL_MAP`.
- **Đầu vào đã đọc:** `CLAUDE.md`; `01-CONTENT_MODEL` §2.2 §2.3 §2.4 §2.5 §2.7 §2.13 §2.14
  §5.1 §5.2 §5.3 §5.4 §6; `04-CONSTRAINTS` I2 I12 I19 và mục 1c (R1/R2);
  `05-URL_MAP` mục 4, 9, bảng URL và bảng DB; `06-BINDING_MAP` §3.1 dòng "Nhãn loại entity"
  và §5.1; `08-SCHEMA_PLAN` §7.4; `cms/schemas/{attraction,category,place,baseFields}.ts`;
  `src/lib/{types,uiCopy,routes,geoKnowledge,sanity}.ts`;
  `src/lib/serialize/{attraction,place,experience,category,utils}.ts`;
  `src/lib/queries/attraction.ts`; `src/pages/[...path].astro`;
  `src/components/{EntityIndex,HubIndex,AttractionDetail,RouteDispatch}.astro`;
  `shared/gates/index.ts`; `scripts/gate.config.ts`;
  `scripts/synthesis/{classify,output-validator,entity-fields}.ts`,
  `scripts/synthesis/prompts/attraction.ts`; `scripts/meta-validators/{g1,g4}*.ts`;
  và **39 trang `dist/diem-tham-quan/*/index.html`** đã dựng (đo JSON-LD thật).
- **Repo lúc soạn:** `feat-da-diem-den` tại `5c27614`

---

## 1. Mục tiêu

Một điểm tham quan được xếp **đúng bản chất** cho máy đọc, và **mang được nhiều nhãn**
cho người đọc lọc — hai việc khác nhau, hai cơ chế khác nhau, không trộn vào một field.

Đích đo được: **0/39** trang phát `"@type":["TouristAttraction","TouristAttraction"]`
(hiện 17/39), và **0** doc bị gán loại trái bản chất (hiện ~9).

## 2. Vấn đề — đo trên bản dựng hiện tại

Trích `@type` thứ hai trong JSON-LD của cả 39 trang `/diem-tham-quan/`:

| Tình trạng | Số trang | Ghi chú |
|---|---|---|
| `attractionType` **trống** → `["TouristAttraction","TouristAttraction"]` | **17** (44%) | type lặp, vô nghĩa với máy. Xác minh tại `dist/diem-tham-quan/hon-chong/index.html` |
| Gán `theme-park` nhưng **sai bản chất** | **9** | vịnh Nha Trang, vịnh Nha Phú, Ba Hồ, Yang Bay, Bãi Dài, Bãi Tranh, Hòn Sỏi, đảo Hoa Lan–Hòn Heo, Hòn Tằm (gán `mud-spa`) |
| Đúng | **13** | 3 chùa, 1 nhà thờ, 2 di tích, 1 thủy cung, 2 tắm bùn, 3 công viên giải trí, 1 khu phức hợp |

**Nguyên nhân gốc:** enum 9 giá trị hiện tại **không có ô nào** cho ba nhóm chiếm phần lớn
tồn kho nội dung — biển/đảo (9 doc), thiên nhiên (11 doc), làng chài/làng nghề (3 doc).
Người nhập liệu gặp danh sách không có ô đúng nên hoặc bỏ trống, hoặc chọn ô gần nhất.

**Nguyên nhân phụ:** `src/lib/serialize/attraction.ts:40` dùng dạng map nghèo
(`Record<string,string>`) và fallback `?? 'TouristAttraction'` tạo mảng lặp.
`src/lib/serialize/place.ts:21` đã có dạng map đúng (`{type, additionalType}`) — chép mẫu đó.

## 3. Quyết định đã chốt (phiên 2026-08-27)

| # | Quyết định | Hệ quả |
|---|---|---|
| 1 | **Phương án A + C** — mở rộng enum, không thay bảng; danh sách 10 mục của chủ dự án thành **tầng nhãn** | Không di trú kiểu dữ liệu, không mất độ mịn `@type` |
| 2 | Hòn Mun, Dốc Lết, Bãi Dài **giữ là Attraction**, không chuyển sang Place | Thêm `beach`, `island` vào `attractionType` |
| 3 | **Không gộp** `temple`/`church`, `theme-park`/`park` | Giữ `BuddhistTemple`, `Church`, `AmusementPark`, `Park` |
| 4 | "Khác" → **"Điểm thu hút khách"**, phát `@type` **đơn** `TouristAttraction` | Không còn mảng lặp; nhãn trung thực với thứ nó phát ra |
| 5 | Thuỷ cung → **nhóm giấy chính chủ** (`officialSource`) | Đóng drift 3 nơi của `aquarium` |
| 6 | Ô mặc định + làng nghề → **"ít nhất một trong `sameAs` hoặc `officialSource`"** | Nhánh I2 thứ ba; tiền lệ: `04-CONSTRAINTS` I12 dòng Article transport-guide |
| 7 | Tầng nhãn **phải đáp ứng schema.org**, không phải nhãn trang trí | Xem §5 |

Ba mục **Trải nghiệm du lịch**, **Khu nghỉ dưỡng**, **Ẩm thực** đi đường **(a)** — thành
term trong `category`, **không** thành giá trị enum. Lằn ranh entity §2.4 / §2.5 / §2.7
giữ nguyên, không mở ADR.

## 4. Phần A — enum bản thể `attractionType`

Bảng map đóng sau khi sửa. Cột **Nhóm gate** là tập rẽ nhánh mới của **I2**.

| # | value | Nhãn Studio (vi) | `@type` phát ra | `additionalType` | Nhóm gate |
|---|---|---|---|---|---|
| 1 | `historic` | Di tích lịch sử | `[TouristAttraction, LandmarksOrHistoricalBuildings]` | — | bách khoa |
| 2 | `temple` | Chùa | `[TouristAttraction, BuddhistTemple]` | — | bách khoa |
| 3 | `church` | Nhà thờ | `[TouristAttraction, Church]` | — | bách khoa |
| 4 | `museum` | Bảo tàng | `[TouristAttraction, Museum]` | — | bách khoa |
| 5 | `beach` | **Bãi biển** | `[TouristAttraction, Beach]` | — | **một trong hai** |
| 6 | `island` | **Đảo** | `[TouristAttraction, Landform]` | `wikidata.org/wiki/Q23442` | **một trong hai** |
| 7 | `nature` | **Thiên nhiên, sinh thái** | `[TouristAttraction, Landform]` | — | **một trong hai** |
| 8 | `theme-park` | Công viên giải trí | `[TouristAttraction, AmusementPark]` | — | venue |
| 9 | `aquarium` | Thuỷ cung | `[TouristAttraction, Aquarium]` | — | **venue** (đổi) |
| 10 | `mud-spa` | Tắm bùn, suối khoáng | `[TouristAttraction, DaySpa]` | — | venue |
| 11 | `market` | Chợ | `[TouristAttraction, ShoppingCenter]` | — | venue |
| 12 | `park` | Công viên | `[TouristAttraction, Park]` | — | venue |
| 13 | `craft-village` | **Làng chài, làng nghề** | `TouristAttraction` (đơn) | — | **một trong hai** |
| 14 | `general` | **Điểm thu hút khách** | `TouristAttraction` (đơn) | — | **một trong hai** |

**Ba nhóm gate của I2 sau đợt này:**

- **bách khoa** — bắt buộc `sameAs` (Wikidata/Wikipedia): `historic`, `temple`, `church`, `museum`.
- **venue** — bắt buộc `officialSource`: `theme-park`, `aquarium`, `mud-spa`, `market`, `park`.
- **một trong hai** — bắt buộc **có ít nhất một** trong `sameAs` hoặc `officialSource`:
  `beach`, `island`, `nature`, `craft-village`, `general` (sửa theo §15, chốt 2026-08-27). Trống cả hai là **fail** ở QA2; không có ô nào miễn nguồn.

**Điểm cần duyệt riêng — `nature` là chỗ duy nhất tôi gộp.** Nó phủ thác, suối, rừng, vịnh,
núi (11 doc). Gộp vì `Landform` là type cha trung thực của cả năm, tách ra sẽ cho các ô 1–3
doc. Độ mịn lấy lại được ở tầng nhãn qua Wikidata (thác Tà Gụ → QID thác nước) mà không
phải nở enum. Nếu chủ dự án muốn tách, đó là cửa hai chiều, làm sau vẫn được.

**Ràng buộc §5.3 — đã thi hành 2026-08-27.** *"schema.org type lấy từ chuẩn, không tự chế"*.
`Beach` và `Landform` **đã kiểm trên schema.org V30.0 (2026-03-19)** — đúng bản mà §2.2 đã ghi
cho lần kiểm Island. Cây thừa kế: `Thing > Place > CivicStructure > Beach` và
`Thing > Place > Landform` (subtype: BodyOfWater, Continent, Mountain, Volcano).
Ghi chú ngữ nghĩa: chuẩn xếp `Beach` dưới `CivicStructure` chứ không thẳng dưới `Place`.
Ta theo chuẩn, không sửa; và `placeType = beach` ở §2.2 vốn đã phát `Beach`, nên hai nơi nhất quán.

## 5. Phần C — tầng nhãn `attraction-type`, và hợp đồng schema.org của nó

Yêu cầu của chủ dự án: nhãn **không được** là nhãn trang trí, phải ra dữ liệu có cấu trúc.
Cơ chế đã có sẵn và đang chạy (`/trai-nghiem/am-thuc/` phát `CollectionPage` + `DefinedTerm`),
đợt này chỉ mở thêm một bộ.

**Bộ term mới:** `inDefinedTermSet = "attraction-type"` — bộ **công khai** (có `slug`,
có trang listing), cùng hạng với `experience-type` và `tour-type`.

Mười term khởi tạo, đúng danh sách chủ dự án đưa:

**Chốt 2026-08-27:** 11 term, không phải 10 — "Đảo & biển" tách làm hai. Lý do: một nhãn ghép
không có QID sạch, mà `additionalType` chỉ nhận một khái niệm. Nhãn là **đa trị** nên một điểm
vẫn mang được cả hai, không mất gì. QID tra bằng API Wikidata, chủ dự án duyệt cùng ngày.

| termCode | Tên hiển thị | `sameAs` (Wikidata) | Khái niệm |
|---|---|---|---|
| `dao` | Đảo | `Q23442` | island |
| `bien` | Biển | `Q93352` | coast |
| `di-tich-lich-su` | Di tích lịch sử | `Q1081138` | historic site |
| `chua-va-tam-linh` | Chùa & tâm linh | `Q1370598` | structure of worship |
| `cong-vien-khu-vui-choi` | Công viên & khu vui chơi | `Q194195` | amusement park |
| `bao-tang-van-hoa` | Bảo tàng & văn hoá | `Q33506` | museum |
| `thien-nhien-sinh-thai` | Thiên nhiên & sinh thái | `Q179049` | nature reserve |
| `cho-va-am-thuc` | Chợ & ẩm thực | `Q330284` | marketplace |
| `diem-check-in` | Điểm check-in | *(để trống)* | không có khái niệm tương ứng |
| `trai-nghiem-du-lich` | Trải nghiệm du lịch | `Q49389` | tourism |
| `khu-nghi-duong` | Khu nghỉ dưỡng | `Q875157` | resort |

`diem-check-in` để trống `sameAs` là **hợp lệ, không phải thiếu sót**: §5.1 cấm phát property
rỗng hoặc tự chế, nên term không có QID thì đơn giản không góp vào `additionalType`.

**Hợp đồng schema.org của tầng nhãn — ba mặt:**

1. **Trên trang chi tiết Attraction:** `additionalType` nhận **mảng** URL Wikidata gom từ
   `category[]->sameAs` của các term thuộc bộ `attraction-type`. Tiền lệ nguyên vẹn:
   Experience đã làm đúng vậy (`serialize/experience.ts:31`, `01` §2.4). Term không có
   `sameAs` thì **bỏ qua**, không phát chuỗi rỗng (§5.1, I6).
   Khi `attractionType = island`, `additionalType` là hợp của `Q23442` và các QID nhãn.
2. **Trên trang term `/diem-tham-quan/{term}/`:** `CollectionPage` + `DefinedTerm` +
   `ItemList` các Attraction trỏ tới term — đúng khuôn `05-URL_MAP` dòng 81 và `01` §2.13.
   Sinh theo **R2** (chỉ mọc khi có ≥1 entity publish trỏ tới), chống trùng slug theo **R1**.
3. **Trong lớp GEO `/ai/entities.json`:** `topics` phải là **mảng chuỗi termCode**.
   Hiện đang hỏng — xem §7.

**Ranh giới không được vượt:** term **không** quyết `@type`, **không** vào gate publish,
**không** thay `attractionType`. Một Attraction thiếu nhãn vẫn hợp lệ; thiếu `attractionType`
thì rơi về `general` ở tầng hiển thị nhưng vẫn phải qua gate nguồn.

## 6. Thay đổi theo file (mức đặc tả — Code triển khai sau QA1)

### 6.1 Tài liệu luật (làm trước, P4)

| File | Sửa |
|---|---|
| `01-CONTENT_MODEL` §2.3 | enum 9 → 14 giá trị; bảng map `@type` thêm 5 hàng; phát biểu lại **ba** nhóm gate; ghi bản schema.org đã kiểm |
| `01-CONTENT_MODEL` §2.13 | `inDefinedTermSet` thêm `attraction-type`; ghi nó là bộ công khai |
| `01-CONTENT_MODEL` §6 | dòng phiên bản mới, nêu rõ phần nào hai chiều, phần nào gần một chiều |
| `04-CONSTRAINTS` I2 | phát biểu lại: ba nhánh thay vì hai |
| `05-URL_MAP` | thêm dòng `/diem-tham-quan/{term}` — term listing, bộ `attraction-type`, R1 + R2 |
| `06-BINDING_MAP` | dòng "Nhãn loại entity" giữ nguyên (huy hiệu hero, **và chỉ ở đó**); thêm dòng cho chip nhãn ở trang danh sách |
| `docs/DECISIONS.md` | `QĐ-2026-08-27-02` — **bắt buộc** vì I2 đổi tập rẽ nhánh |

### 6.2 Mã nguồn

| File | Sửa |
|---|---|
| `cms/schemas/attraction.ts:39-49` | `options.list` 14 mục |
| `cms/schemas/attraction.ts:52-78` | ba nhóm gate; **sửa mô tả field cho khớp mảng ngay dưới nó** (đang lệch) |
| `cms/schemas/category.ts:37-43` | `inDefinedTermSet` thêm `attraction-type` |
| `src/lib/types.ts:280` | union 14 giá trị |
| `src/lib/serialize/attraction.ts:16-43` | đổi map sang dạng `{type, additionalType}` theo mẫu `place.ts:21`; **bỏ fallback tạo mảng lặp**; gom `additionalType` từ `category` |
| `src/lib/uiCopy.ts:760-766` | 5 giá trị mới × **5 ngôn ngữ** |
| `src/lib/queries/attraction.ts:24` | `category[]->` lấy thêm `sameAs`, `inDefinedTermSet` |
| `src/lib/routes.ts:52` | attraction `hasTerm: false → true` |
| `src/lib/sanity.ts:226` | `scanTerms` nhận thêm `attraction-type` |
| `src/pages/[...path].astro:55` | **thay ternary nhị phân** `experience-type ? experience : tour` bằng bảng map — hiện bộ thứ ba sẽ rơi nhầm vào `tour` |
| `src/lib/geoKnowledge.ts:307` | sửa `topics` (xem §7) |
| `shared/gates/index.ts:57-58` | ba tập; thêm nhánh "một trong hai" trong `checkI2` |
| `scripts/synthesis/classify.ts:11,24-27` | enum 14; bỏ ghi chú drift `aquarium` sau khi đóng |
| `scripts/synthesis/output-validator.ts:8` | đồng bộ ba tập |
| `scripts/synthesis/prompts/attraction.ts:13,26` | mô tả 14 giá trị cho LLM |
| `scripts/synthesis/__tests__/classify.test.ts` | ca kiểm cho 5 giá trị mới + nhánh gate thứ ba |

### 6.3 Dữ liệu

- Xếp lại `attractionType` cho **26 doc** theo bảng §8.
- Bổ sung nguồn cho **2 doc** đang trắng tay: `lang-chai-bich-dam`,
  `ben-du-thuyen-nha-trang` (mỗi doc cần **một** trong `sameAs` / `officialSource`).
- Tạo 10 document `category` bộ `attraction-type`, tra `sameAs` từng term.
- **Sao lưu dataset trước khi chạy bất kỳ script sửa hàng loạt nào** (tiền lệ `_migrate-hero-footer.mjs`).

## 7. Drift phải đóng cùng đợt

| Drift | Hiện trạng | Xử |
|---|---|---|
| `aquarium` xếp 3 nhóm khác nhau ở 3 nơi | Studio đòi `sameAs`; validator CI đòi `officialSource`; synthesis không đòi gì | Chốt **venue** theo QĐ số 5. Chưa có trong `DRIFT_LOG` |
| Mô tả field `officialSource` liệt kê `aquarium` nhưng mảng code ngay dưới thì không | `cms/schemas/attraction.ts:69` vs `:72` | Sửa cùng lúc |
| `topics` trong `/ai/entities.json` là **object**, không phải chuỗi | `geoKnowledge.ts:307` đọc `item.termCode` nhưng `termCode` kiểu `slug` → xuất `{"_type":"slug","current":"kham-pha"}` trên **cả 122 thực thể**. Vị từ kiểu `is string` nói dối, `Boolean(object)` là true nên bộ lọc không chặn | Phải sửa **trước** khi dựa vào `category` làm kênh GEO |
| `01` §2.13 khai `slug` là "slug object localized" nhưng `category.ts:53` là `slug` phẳng, `scanTerms` đọc `slug.current` | Lệch spec/code có sẵn | **Ghi `DRIFT_LOG`**, không sửa trong đợt này (ngoài phạm vi) |

## 8. Bảng đối chiếu 39 doc → giá trị mới

Cột "Hiện" suy từ `@type` thứ hai trong JSON-LD đã dựng. `(trống)` = chưa nhập.

| # | Slug | Hiện | Đề xuất | Ghi chú |
|---|---|---|---|---|
| 1 | `bai-bien-doc-let` | (trống) | `beach` | |
| 2 | `bai-dai-cam-lam` | `theme-park` | `beach` | sai bản chất |
| 3 | `khu-du-lich-bai-tranh` | `theme-park` | `beach` | sai bản chất |
| 4 | `bien-ninh-chu` | (trống) | `beach` | |
| 5 | `khu-du-lich-binh-tien` | (trống) | `beach` | |
| 6 | `khu-du-lich-mini-beach` | (trống) | `beach` | |
| 7 | `dao-ga-nha-trang` | (trống) | `island` | |
| 8 | `khu-du-lich-hon-mun` | (trống) | `island` | đã có Wikipedia |
| 9 | `khu-du-lich-hon-soi` | `theme-park` | `island` | sai bản chất |
| 10 | `khu-du-lich-dao-hoa-lan-hon-heo` | `theme-park` | `island` | sai bản chất |
| 11 | `khu-du-lich-hon-tam` | `mud-spa` | `island` | Hòn Tằm là đảo; tắm bùn thành **nhãn** |
| 12 | `hon-chong` | (trống) | `nature` | đã có Wikipedia |
| 13 | `thac-ta-gu` | (trống) | `nature` | đã có Wikipedia |
| 14 | `khu-du-lich-suoi-tien` | (trống) | `nature` | |
| 15 | `rung-thong-khanh-son` | (trống) | `nature` | |
| 16 | `vinh-vinh-hy` | (trống) | `nature` | |
| 17 | `khu-du-lich-vinh-san-ho` | (trống) | `nature` | |
| 18 | `khu-du-lich-tam-linh-hon-ba` | (trống) | `nature` | duyệt — núi là bản chất, yếu tố tâm linh thành **nhãn** |
| 19 | `vinh-nha-trang` | `theme-park` | `nature` | sai bản chất |
| 20 | `vinh-nha-phu` | `theme-park` | `nature` | sai bản chất |
| 21 | `khu-du-lich-ba-ho` | `theme-park` | `nature` | sai bản chất — suối/thác |
| 22 | `khu-du-lich-yang-bay` | `theme-park` | `nature` | sai bản chất — thác |
| 23 | `lang-chai-bich-dam` | (trống) | `craft-village` | ⚠ **chưa có nguồn nào** |
| 24 | `lang-chai-hon-mieu` | (trống) | `craft-village` | |
| 25 | `lang-nghe-truong-son` | (trống) | `craft-village` | nguồn là trang Tổng cục Du lịch |
| 26 | `ben-du-thuyen-nha-trang` | (trống) | `general` | ⚠ **chưa có nguồn nào** |
| 27 | `cong-vien-giai-tri-vinwonders` | `theme-park` | `theme-park` | giữ |
| 28 | `vin-harbour` | `theme-park` | `theme-park` | giữ |
| 29 | `khu-du-lich-kong-forest` | `theme-park` | `theme-park` | giữ |
| 30 | `khu-du-lich-diamond-bay` | `theme-park` | `theme-park` | duyệt — giữ nguyên |
| 31 | `vien-hai-duong-hoc` | `aquarium` | `aquarium` | giữ; nay cần `officialSource` |
| 32 | `khu-du-lich-i-resort` | `mud-spa` | `mud-spa` | giữ |
| 33 | `khu-du-lich-tam-bun-thap-ba` | `mud-spa` | `mud-spa` | giữ |
| 34 | `chua-long-son` | `temple` | `temple` | giữ |
| 35 | `chua-phap-vien-thanh-son` | `temple` | `temple` | giữ |
| 36 | `chua-suoi-do` | `temple` | `temple` | giữ |
| 37 | `nha-tho-nui` | `church` | `church` | giữ |
| 38 | `thanh-co-dien-khanh` | `historic` | `historic` | giữ |
| 39 | `thap-ba-ponaga` | `historic` | `historic` | giữ |

Phân bố sau đợt: `beach` 6, `island` 5, `nature` 11, `craft-village` 3, `theme-park` 4,
`mud-spa` 2, `temple` 3, `historic` 2, `aquarium` 1, `church` 1, `general` 1;
`market` và `park` chưa có doc — giữ trong bảng map vì đã là giá trị đóng đã công bố.

## 9. Cổng nghiệm thu (QA2)

1. `npm run gate` không thêm mục đỏ mới.
2. **0/39** trang phát `@type` lặp. Lệnh kiểm nêu trong kế hoạch thi hành.
3. Mọi doc `approved` đều qua **I2** ở đúng một trong ba nhánh; không doc nào rơi ra ngoài
   cả ba (đây chính là lỗ hổng đang làm `aquarium` hỏng — cấm tái lập).
4. `g1` và `g4` xanh sau khi `01` và schema đã đồng bộ.
5. `/ai/entities.json`: `topics` là mảng **chuỗi** trên cả 122 thực thể.
6. Trang term `/diem-tham-quan/{term}/` chỉ mọc khi có ≥1 Attraction publish trỏ tới (R2),
   và không trùng slug với trang chi tiết nào (R1).
7. `astro check` sạch; bộ test `scripts/synthesis` xanh.

## 10. Ngoài phạm vi đợt này

- Không chuyển doc nào giữa Attraction và Place.
- Không đụng entity Experience, Resort, Restaurant, Specialty.
- Không tách `nature` thành nhiều giá trị.
- Không sửa drift `slug` localized của Category (chỉ ghi `DRIFT_LOG`).
- Không đổi bố cục trang chi tiết; huy hiệu hero giữ nguyên vai theo `06` §3.1.

## 11. Bốn điểm dừng — đã đóng 2026-08-27

| # | Điểm dừng | Kết quả |
|---|---|---|
| 1 | Bảng 14 giá trị, đặc biệt `nature` gộp năm loại địa hình | **Duyệt** — giữ gộp; tách sau là cửa hai chiều |
| 2 | Mười term ở §5 là **nhãn**, không phải loại | **Duyệt** |
| 3 | `khu-du-lich-tam-linh-hon-ba` và `khu-du-lich-diamond-bay` | **Duyệt** theo đề xuất: `nature` và `theme-park` |
| 4 | `lang-chai-bich-dam`, `ben-du-thuyen-nha-trang` chưa có nguồn nào | **Tiền đề SAI** — đo lại trên dataset: cả hai **có `officialSource`**, qua nhánh một-trong-hai bình thường. Nợ thật là **bốn doc khác**, xem §15 |

## 12. Thứ tự thi hành

Luật trước, code sau (P4). Mỗi bước phải xanh trước khi sang bước kế.

| Bước | Việc | Trạng thái |
|---|---|---|
| 1 | `DECISIONS` — `QĐ-2026-08-27-03` | **xong** |
| 2 | `01-CONTENT_MODEL` §2.3, §2.13, §6 | **xong** |
| 3 | `04-CONSTRAINTS` I2 — ba nhánh | **xong** |
| 4 | `05-URL_MAP` — dòng term `/diem-tham-quan/{term}` | **xong** |
| 5 | `06-BINDING_MAP` — chip nhãn ở trang danh sách | **xong** |
| 6 | `DRIFT_LOG` — drift `slug` localized của Category | **xong** |
| 7 | Schema Sanity: `attraction.ts`, `category.ts` | **xong** |
| 8 | Serialize + kiểu + nhãn + truy vấn | **xong** |
| 9 | Định tuyến term: `routes.ts`, `sanity.ts`, `[...path].astro` | **xong** |
| 10 | Gate: `shared/gates`, `scripts/synthesis`, test | **xong** |
| 11 | Sửa `topics` ở `geoKnowledge.ts` | **xong** |
| 12 | Dữ liệu: 26 doc xếp lại, 10 term, 2 doc bổ sung nguồn | **CHẶN — phải sau bước 12b** |
| **12b** | **Gộp mã vào `main`** — điều kiện bắt buộc trước bước 12, xem §14 | chờ chủ dự án |
| 13 | QA2 theo §9 | sau bước 12 |


## 13. Bằng chứng nghiệm thu tầng mã (2026-08-27)

| Kiểm | Lệnh | Kết quả |
|---|---|---|
| Kiểu | `npx astro check` | **0 lỗi, 0 cảnh báo** (137 file; 47 hint có sẵn từ trước) |
| Test | `npm --prefix scripts test` | **192/192 đạt**, gồm 6 ca mới cho v1.0.19 |
| Cổng đặc tả | `npm --prefix scripts run audit:spec` | **3/3 xanh** (g1, g3, g4); không phát sinh cảnh báo mới cho `attraction.ts` |

Ca kiểm đáng chú ý trong đợt này: *"hợp ba tập gate PHỦ ĐÚNG enum attractionType"* — nó cưỡng chế cơ học điều mà trước v1.0.19 chỉ là quy ước, và là thứ đã để lọt `aquarium`. Thêm một giá trị enum mà quên xếp nhóm gate thì test này đỏ ngay, không đợi tới QA2.

**Chưa kiểm được ở tầng mã:** `@type` thật trên trang đã dựng và trang term — cả hai phụ thuộc dữ liệu ở bước 12. Số 0/39 ở §9 chỉ nghiệm thu được sau khi xếp lại dữ liệu và dựng lại.


## 14. Bước 12 PHẢI đứng sau khi mã lên `main` — học được bằng cách làm hỏng

**Chuyện đã xảy ra (2026-08-27, 07:42–07:5x).** Sau khi sao lưu, chạy `cms/_retype-attractions.mjs`
patch 29 bản ghi. Mỗi lần patch một document `attraction` đã publish là một lần webhook
`Cloudflare rebuild` bắn (bật lại theo `QĐ-2026-08-27-01`, có lọc 15 type trong đó có `attraction`).

Webhook dựng lại production **từ `origin/main`**, không phải từ nhánh đang làm. `main` chưa có
v1.0.19, nên:

| Tầng | Trên `main` | Kết quả với dữ liệu mới |
|---|---|---|
| `uiCopy.ts` | không có nhãn cho `beach`/`island`/`nature`/`craft-village`/`general` | `typeLabel` rơi về **chính mã máy** → huy hiệu hero hiện chữ `craft-village`, `island` cho khách |
| `serialize/attraction.ts` | map thiếu 5 giá trị | `?? 'TouristAttraction'` → vẫn `["TouristAttraction","TouristAttraction"]` |

Đo được trên `https://tourdao.vn/diem-tham-quan/lang-chai-bich-dam/`: huy hiệu là chuỗi
`craft-village`. Đã hoàn nguyên toàn bộ bằng `cms/_revert-attraction-types.mjs` dựa trên
`backups/backup-2026-08-27-07-42.ndjson`; dataset trở lại đúng trạng thái 07:42.

**Vì sao spec ban đầu sai.** §6.1 và §12 xếp thứ tự "luật → mã → dữ liệu" theo nguyên tắc P4,
và điều đó đúng **trong repo**. Nhưng đường phát hành không đi từ repo đang làm mà từ `main`:
với một nhánh chưa gộp, "mã xong" **không** có nghĩa là "mã đang chạy". Dữ liệu là thứ duy nhất
dùng chung giữa nhánh và production, nên nó luôn tới đích trước mã.

**Luật rút ra, áp cho mọi đợt sau:** khi một thay đổi có **cả** phần dữ liệu Sanity **và** phần mã,
và mã còn nằm trên nhánh chưa gộp, thì **cấm chạm dữ liệu production** cho tới khi mã đã ở trên
`main`. Không đủ điều kiện đó thì mọi thao tác dữ liệu phải làm trên dataset khác, hoặc hoãn.

**Điều kiện mở bước 12:** nhánh chứa v1.0.19 đã gộp vào `main` và bản dựng tự động từ `main`
đã lên. Khi đó chạy lại `cms/_retype-attractions.mjs` (bảng map giữ nguyên, đã thử đúng: 29 bản
ghi, 16 đã đúng sẵn, 5 ngoài bảng không đụng).


## 15. Đo lại trên dataset thật — bảng §8 thiếu, và một lằn ranh mới lộ ra

Bảng §8 dựng từ `dist/` (39 trang đã render). Dataset có **53** document `attraction`:
**41 approved đã publish**, còn lại draft. Chênh lệch nằm ở đây:

| Doc | Trạng thái | `attractionType` | Đề xuất | Ghi chú |
|---|---|---|---|---|
| `chua-tu-van-chua-oc` | approved | `temple` | **không đụng** | đã đúng sẵn |
| `lang-gom-bau-truc` | draft | (trống) | `craft-village` | có cả sameAs lẫn officialSource |
| `vinh-ninh-van` | draft | (trống) | `nature` | chưa có nguồn nào |
| `khu-du-lich-dao-khi-hon-lao` | draft | (trống) | `island` | chưa có nguồn nào |
| `Núi Cô Tiên` | **approved** | (trống) | `nature` | ⚠ **không có `slug.vi`** — approved mà không render ra trang nào |

`Núi Cô Tiên` là lỗi dữ liệu độc lập với đợt này: một doc đã duyệt nhưng vô hình.

### Lằn ranh "tự nhiên" so với "có quản lý" cắt ngang `beach`/`island`/`nature`

Chạy thử migration rồi đo, bốn doc trượt I2 — tất cả cùng một hình dạng:

| Doc | Loại mới | `sameAs` | `officialSource` |
|---|---|---|---|
| `rung-thong-khanh-son` | `nature` | không | **có** |
| `dao-ga-nha-trang` | `island` | không | **có** |
| `khu-du-lich-dao-hoa-lan-hon-heo` | `island` | không | **có** |
| `khu-du-lich-mini-beach` | `beach` | không | **có** |

18 trong 22 doc thuộc ba loại này **đã tự có** `sameAs` (Hòn Mun, thác Tà Gụ, Hòn Chồng,
vịnh Nha Trang…) — đó là các địa danh thật, có mục bách khoa. Bốn doc trên là **điểm du lịch
có quản lý dựng trên nền tự nhiên**: có website, không ai viết Wikipedia về chúng.

Gán cứng `beach`/`island`/`nature` vào nhánh bách khoa là giả định rằng "tự nhiên" kéo theo
"có danh tính bách khoa". Dữ liệu nói không. Ba lựa chọn:

| | Cách | Đổi lại |
|---|---|---|
| **a** | Chuyển `beach`/`island`/`nature` sang nhánh **một trong hai** | Bốn doc qua ngay. Địa danh thật vẫn nộp Wikipedia như đang làm (18/22 tự nguyện). Mất sức ép tạo mục Wikidata cho địa danh mới |
| b | Giữ nhánh bách khoa, **tạo/tra `sameAs`** cho bốn doc | Giữ sức ép neo thực thể. Cần người tra, có thể không có mục để tra |
| c | Giữ nguyên, chấp nhận **4 đỏ** ở QA2 | Không tốn công, nhưng `governance-post` thêm đỏ |

**Khuyến nghị: (a).** Cổng không phân biệt được "tự nhiên" với "có quản lý", nên đừng bắt nó
đoán. Nguyên tắc nền — *không đăng thứ không dẫn được nguồn* — vẫn giữ nguyên hiệu lực ở cả
hai đường. Bốn nhóm còn lại (`historic`, `temple`, `church`, `museum`) thì giữ bách khoa
nghiêm ngặt, vì với chúng giả định trên đúng.


## 16. Chốt bổ sung 2026-08-27 — `beach`/`island`/`nature` sang nhánh một trong hai

Chủ dự án duyệt phương án **(a)** ở §15. Ba nhánh I2 sau khi chốt:

| Nhánh | Bắt buộc | Gồm |
|---|---|---|
| Bách khoa | `sameAs` | `historic`, `temple`, `church`, `museum` |
| Venue | `officialSource` | `theme-park`, `aquarium`, `mud-spa`, `market`, `park` |
| Một trong hai | ít nhất một trong hai | `beach`, `island`, `nature`, `craft-village`, `general` |

Bốn doc trượt ở §15 nay qua cổng bằng `officialSource` sẵn có. Không doc nào được miễn nguồn:
hợp ba tập vẫn phủ đúng 14 giá trị enum, và ca kiểm cưỡng chế điều đó vẫn xanh.

Bốn doc ngoài bảng §8 (§15) được đưa vào bảng map của `cms/_retype-attractions.mjs` để lượt
chạy sau khi gộp `main` xử luôn. Riêng `Núi Cô Tiên` **không** đưa vào: nó thiếu `slug.vi`,
và đặt slug là quyết định URL, không phải suy ra được.


## 17. Chốt 2026-08-27 (lượt 3) — Núi Cô Tiên

Doc `approved` nhưng thiếu `slug.vi` nên không render ra trang nào. Chủ dự án chốt: **đặt slug
`nui-co-tien`, loại `nature`**. Doc có `officialSource` nên qua nhánh một-trong-hai.

Đây là việc **sinh một URL mới** trên site, không phải sửa dữ liệu thuần, nên ghi lại rõ ở đây
thay vì để lẫn trong bảng migration.
