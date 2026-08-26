# SPEC — Nhiều điểm đến trên một site

- **Trạng thái:** thiết kế duyệt trong phiên 2026-08-26 (hướng A). Toàn văn spec và `ADR-0028`
  **chưa** phê chuẩn — chờ chủ dự án đọc.
- **Ngày soạn:** 2026-08-26   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa **một chiều** ở đúng một chỗ — cardinality của `TouristDestination`
  trong `01-CONTENT_MODEL` §2 đổi từ **1** sang **N**, kéo theo một quan hệ mới
  (`* → touristDestination`) trong mô hình dữ liệu. Ghi ở `ADR-0028`. Mọi phần còn lại
  (khối trang chủ, loại đích menu, chữ nghĩa) là cửa hai chiều.
- **Bản ghi:** `docs/adr/ADR-0028-da-diem-den.md` (nháp); `QĐ-2026-08-26-01` sẽ ghi vào
  `docs/DECISIONS.md` khi phê chuẩn.
- **Đầu vào đã đọc:** `CLAUDE.md`, `01-CONTENT_MODEL` §2 §2.1 §5 §6, `ADR-0020`, `ADR-0021`,
  `ADR-0023`, `QĐ-2026-08-25-01`, `docs/SO-TAY-HAN-MUC-SANITY.md`,
  `cms/schemas/{touristDestination,baseFields,lodgingBase,place,attraction,tour,article,index}.ts`,
  `src/site.config.ts`, `src/lib/{routes,sitemap,homepage,uiCopy,sanity}.ts`,
  `src/lib/queries/touristDestination.ts`, `src/pages/[...path].astro`, `src/pages/index.astro`,
  `src/components/{RouteDispatch,TouristDestinationHub,SiteHome,HomeAreaGrid,Breadcrumb}.astro`,
  `scripts/gate.config.ts`, `scripts/validate-min.ts`, `scripts/validators/i1-i19.ts`,
  `scripts/meta-validators/{g1,g4}*.ts`, `backups/backup-2026-08-14-06-42.ndjson`
- **Repo lúc soạn:** `feat-bo-kiem-tu-dong` tại `fd3c2de`

---

## 1. Mục tiêu

Chủ dự án nhập một document **Điểm đến** thứ hai trong Sanity Studio (ví dụ Phú Quốc) và
được ngay một trang `/phu-quoc/` **cùng cấu trúc với trang Nha Trang**, hiển thị **nội dung
của chính nó** chứ không phải nội dung Nha Trang. Khách ở trang chủ có lối vào thấy được.

Trang chủ `/` **không đổi vai**: vẫn là Nha Trang.

## 2. Vấn đề

### 2.1 Hạ tầng định tuyến đã có, không phải xây lại

`src/pages/[...path].astro:73-80` (khối ghi chú `B11-DOT2`) đã lặp qua **mọi**
`touristDestination` có `reviewStatus == "approved"` và sinh một trang cho mỗi cái;
`src/lib/sitemap.ts:86-88` đã đưa hết vào sitemap; `RouteDispatch.astro` nhận
`kind: 'destination'` và render `TouristDestinationHub.astro` — chính là layout của trang
Nha Trang hôm nay. Thêm document thứ hai là `/<slug>/` **tự mọc ra**, có cả JSON-LD.

Nên "thừa hưởng cấu trúc" theo nghĩa **khuôn trang** đã đúng sẵn. Cái sai nằm ở **dữ liệu
đổ vào khuôn**.

### 2.2 Bốn chỗ còn dính cứng Nha Trang

| # | Chỗ | Hậu quả nếu thêm điểm đến hôm nay |
|---|---|---|
| 1 | `src/lib/queries/touristDestination.ts` — `homepagePlaces` là `*[_type == "place" && …]`, `homepageArticles` là `*[_type == "article" && …]`, **không lọc theo điểm đến** | Trang Phú Quốc hiện đúng 4 địa danh và 4 bài cẩm nang của Nha Trang |
| 2 | `src/lib/homepage.ts` — `sections.overview` là chuỗi `'Tổng quan về Nha Trang'` (5 ngôn ngữ), dùng ở `SiteHome.astro:209` và `TouristDestinationHub.astro` | Trang Phú Quốc có tiêu đề khối "Tổng quan về Nha Trang" |
| 3 | `cms/schemas/touristDestination.ts:78-86` — mô tả `containedInPlaceRef` chỉ đích danh Khánh Hoà | Biên tập viên nhập Phú Quốc đọc hướng dẫn sai |
| 4 | **Không entity con nào có đường trỏ về điểm đến.** `place`/`attraction`/`hotel`/`resort`/`restaurant` có `containedInPlace` (trỏ Place *hoặc* TouristDestination); `tour` không có ô vị trí nào; `article` chỉ có `about[]` | Không có cách nào lọc nội dung theo điểm đến |

Về mục 4, `containedInPlace` **không dùng được** làm đường suy ra điểm đến: trong bản sao lưu
`backups/backup-2026-08-14-06-42.ndjson` (14/8) chỉ **1/12 Place** và **1/18 Attraction** có
khai ô đó, và `tour` — dòng sản phẩm chính, 11 document — không có ô nào cả. Dùng nó nghĩa là
phải nhập bù thủ công gần như toàn bộ, rồi vẫn không phủ được Tour.

### 2.3 Cardinality trong đặc tả đang là 1

`01-CONTENT_MODEL.md:42` khai:

```
| TouristDestination | TouristDestination | Chính Nha Trang, container địa lý gốc | 1 | Sanity |
```

Đổi con số này là sửa mô hình nội dung ở tầng gốc. Theo `CLAUDE.md` §5 đây là điểm dừng bắt
buộc: phải có ADR, không tự hoà giải.

## 3. Ba quyết định đầu vào (chủ dự án chốt 2026-08-26)

1. **Trang chủ `/` vẫn là Nha Trang.** Điểm đến khác là trang anh em `/‹slug›/` cùng cấu
   trúc. Các trang danh mục (`/tour/`, `/khach-san/`, …) **vẫn gom chung toàn site**, chưa
   tách theo điểm đến trong đợt này.
2. **Gắn nội dung bằng một ô "Điểm đến" trên mọi entity**, chạy script nạp bù dữ liệu cũ về
   Nha Trang. Không dùng chuỗi `containedInPlace`, không chuyển sang chọn tay.
3. **Lối vào là khối "Điểm đến khác" trên trang chủ + một mục menu.**

Ba điểm chốt thêm trong cùng phiên:

4. **Không đặt `initialValue` mặc định.** Một mặc định im lặng sẽ gán nhãn Nha Trang cho nội
   dung Phú Quốc mà không ai thấy. Thiếu ô này là **warn**, không **fail** — trang vẫn lên,
   chỉ không xuất hiện ở trang điểm đến nào.
5. **Hoãn sửa ~30 dòng meta description trong `src/lib/uiCopy.ts`** ("Khách sạn tại Nha
   Trang"…). Đó là mô tả của các trang danh mục toàn site đang xếp hạng trên Google; sửa là
   quyết định SEO riêng. Ghi nợ, không im lặng bỏ qua (§8).
6. **Bản nháp ADR-0028 do Cowork soạn**, chủ dự án phê chuẩn.

## 4. Thiết kế

### 4.1 Field `destination` — khai một chỗ, dùng mười nơi

Thêm vào `cms/schemas/baseFields.ts` một export **riêng**, không nhét vào
`baseFieldsBeforeGallery`/`baseFieldsAfterGallery`:

```ts
export const destinationField = defineField({
  name: 'destination', type: 'reference',
  group: 'viTri',
  to: [{ type: 'touristDestination' }],
  title: 'Điểm đến',
  description: 'Nội dung này thuộc điểm đến nào. Để trống thì nó không xuất hiện ở trang điểm đến nào.',
})
```

**Vì sao là export riêng, không nhét vào `baseFields*`:** chính `touristDestination.ts` cũng
dùng hai mảng đó (`cms/schemas/touristDestination.ts:29,55`). Nhét vào đấy là cho Điểm đến
một ô trỏ vào chính nó — vô nghĩa và mở đường cho chu trình.

Gắn vào **mười** type. Bảy type đang bật cộng ba type còn đăng ký:

| Type | File sửa | Ghi chú |
|---|---|---|
| place | `cms/schemas/place.ts` | |
| attraction | `cms/schemas/attraction.ts` | |
| experience | `cms/schemas/experience.ts` | |
| tour | `cms/schemas/tour.ts` | khác `tripOrigin` (điểm xuất phát) về nghĩa |
| article | `cms/schemas/article.ts` | file này **không** dùng `baseFieldsBeforeGallery`, thêm trực tiếp |
| hotel, resort | `cms/schemas/hotel.ts`, `cms/schemas/resort.ts` | **không** qua `lodgingBase.ts` — xem ghi chú dưới |
| restaurant, specialty, event | ba file tương ứng | đang tắt/ẩn nhưng còn đăng ký schema (xem `cms/schemas/index.ts`) |

**Vì sao `hotel`/`resort` không đi qua `lodgingBase.ts`** dù đó là chỗ `containedInPlace` đang
nằm: `g1` nhận diện field dùng chung bằng **cờ trong `SCHEMA_CONFIG`**, mỗi nguồn chung là một
cờ riêng (`usesBaseBefore`, `usesLodgingBase`…). Cho mười entity nhận field qua cùng một đường
nghĩa là `g1` chỉ phải học **một** cờ mới; tách hai type ra một đường riêng là hai cờ, và một
ngoại lệ nữa cho người sau phải nhớ.

**Không gắn** cho `person` và `organization`: tác giả và pháp nhân không thuộc về một điểm đến.
**Không gắn** cho `category` và `siteSettings`.

Ô này **tuỳ chọn** ở tầng Studio, đúng quy ước đã chốt 2026-08-04 ghi ở `baseFields.ts:22-27`
(mọi field tuỳ chọn trừ `title.vi` và `slug.vi`).

### 4.2 Nạp bù dữ liệu cũ

`scripts/migrate/backfill-destination.ts`, cùng khuôn với
`scripts/migrate/retarget-contained-in-place.ts` đã có.

- Đối tượng: mọi document thuộc mười type ở §4.1, **cả draft lẫn published**, mà chưa có
  `destination`.
- Hành vi: `patch(...).setIfMissing({ destination: { _type: 'reference', _ref: <id Nha Trang> } })`.
  Dùng `setIfMissing` nên chạy lại nhiều lần không hại (idempotent).
- `<id Nha Trang>` **không viết cứng**: tra bằng `*[_type=="touristDestination" && slug.vi.current == $slug][0]._id`
  với `$slug = primaryDestinationSlug` đọc từ `src/site.config.ts:227`. Không tìm thấy → dừng,
  không đoán.
- Bắt buộc có `--dry-run` **mặc định bật**; muốn ghi thật phải truyền `--apply`. In số đếm theo
  từng type trước và sau.
- Khối lượng dự kiến (theo bản sao lưu 14/8): 12 place + 18 attraction + 5 experience + 11 tour
  + 3 article + 5 hotel + 2 resort + 1 event = **57 document**. Con số thật phải đọc lại lúc
  chạy, bản sao lưu đã hai tuần.

Thêm dòng `"backfill:destination"` vào `scripts/package.json`.

### 4.3 Cổng: thiếu `destination` là warn, trỏ sai là fail

Hai tầng khác nhau, đừng lẫn:

**Toàn vẹn tham chiếu — fail.** Thêm vào `scripts/gate.config.ts`:

```ts
references: {
  place:      [{ field: 'destination', to: 'touristDestination' }],
  attraction: [{ field: 'destination', to: 'touristDestination' }],
  … (thêm experience, hotel, resort, tour, article)
}
```

**Bảy type, không phải chín.** `publishableTypes` có chín type nhưng `person` và
`organization` không có ô `destination` (§4.1). Ba type còn lại ở §4.1 — `restaurant`,
`specialty`, `event` — không nằm trong `publishableTypes` nên không có luật nào ở đây.

`scripts/validate-min.ts:74` có `if (r == null) continue` — nên luật này **bỏ qua khi ô trống**
và chỉ bắt khi ô có mà trỏ sai type hoặc trỏ vào `_id` không tồn tại. Đúng nghĩa "kiểm toàn
vẹn, không kiểm completeness" mà `gate.config.ts:56-62` đã tự phát biểu.

**Thiếu ô — warn.** `GateConfig` không có nấc `warn` (chỉ `requiredFields` mức fail). Nấc warn
có sẵn ở bộ bất biến: `scripts/validators/i1-i19.ts:472-478` khai `VALIDATOR_LEVELS` với `I10:
'warn'`. Nên thêm một bất biến mới **I20**, mức `warn`:

> I20 — Entity thuộc mười type ở §4.1 và đã `approved` thì nên có `destination`. Thiếu thì
> document không xuất hiện ở trang điểm đến nào.

Đăng ký vào `VALIDATORS`, `VALIDATOR_LEVELS` (mức `warn`), và bảng bất biến trong
`01-CONTENT_MODEL.md` §6.

### 4.4 Truy vấn: hai khối tự động lọc theo điểm đến

`src/lib/queries/touristDestination.ts`, thêm đúng một mệnh đề vào mỗi khối:

```groq
"homepagePlaces": *[_type == "place" && reviewStatus == "approved"
                    && defined(slug.${lang}.current)
                    && destination._ref == ^._id ] | order(…)[0...4]{…}

"homepageArticles": *[_type == "article" && reviewStatus == "approved"
                      && language == "${lang}" && defined(slug.current)
                      && destination._ref == ^._id ] | order(…)[0...4]{…}
```

`^` trong GROQ trỏ ra phạm vi cha, tức chính document Điểm đến đang chiếu. **Phải xác minh
bằng một truy vấn thật** trước khi merge — không suy luận suông (§6 nói vì sao hiện chưa chạy
được).

Thêm một truy vấn mới trong cùng file cho khối §4.5:

```ts
export function otherDestinationsQuery(lang: string): string   // approved, _id != $currentId
```

**Thứ tự thi hành là ràng buộc cứng.** Nạp bù (§4.2) phải xong và xác minh
`count(*[_type in [...] && !defined(destination)]) == 0` **trước** khi đổi truy vấn. Đổi truy
vấn trước là trang chủ Nha Trang rỗng hai khối ngay lần build kế tiếp.

### 4.5 Khối "Điểm đến khác" trên trang chủ

Một khoá section mới `destinations`, đi qua đúng cơ chế section đã có:

| Nơi | Việc |
|---|---|
| `cms/schemas/siteSettings.ts:4-24` | thêm `{ title: '🌏 Điểm đến khác', value: 'destinations' }` — enum đóng 19 → **20** khoá |
| `src/components/SiteHome.astro:134-151` | thêm `{ key: 'destinations', hidden: false }` vào `DEFAULT_SECTIONS`, đặt sau `hubGrid` |
| `src/components/SiteHome.astro:187-` | thêm một `case 'destinations'` |
| `src/components/HomeDestinationGrid.astro` | **file mới**, sao khuôn `HomeAreaGrid.astro` (grid 4 card, `imageUrl`, empty guard) |
| `src/lib/homepage.ts` | thêm `sections.destinations` cho **cả 5 ngôn ngữ** |
| `src/pages/index.astro` | fetch `otherDestinationsQuery`, truyền xuống `SiteHome` |
| `src/lib/types.ts` | kiểu cho card điểm đến |

**Empty guard là bắt buộc**, đúng luật `01-CONTENT_MODEL.md:587`: chỉ có một điểm đến thì
khối tự ẩn. Hệ quả có chủ ý — bật tính năng này lên production hôm nay **không đổi gì trên
màn hình** cho tới khi có document thứ hai được duyệt.

Khối này **không** dùng `relatedDestinations` (field đã có trên `touristDestination`): field đó
là `{name, url}` tự do, dùng để trỏ ra **ngoài site**, còn khối này liệt kê điểm đến **trong**
site và cần ảnh, tóm tắt, đường dẫn nội bộ. Hai vai khác nhau, giữ cả hai.

### 4.6 Loại đích menu thứ tám: `kind: 'destination'`

`src/site.config.ts` hiện khai bảy loại đích (`NavKind`, dòng 259). Thêm loại thứ tám để khai
được một mục menu trỏ tới trang điểm đến:

```ts
export type NavKind = 'home' | 'index' | 'hub' | 'term' | 'detail' | 'static' | 'zalo' | 'destination'
```

`src/lib/routes.ts` — `resolveInternalPath` thêm một nhánh, đặt cạnh nhánh `'static'`:

```ts
if (item.kind === 'destination') return `${prefix}/${target}/`
```

Không cần tự kiểm slug có tồn tại không: `assertNavTargetsExist`
(`src/pages/[...path].astro:83`) đã đối chiếu mọi mục menu với danh sách trang **thật sự sinh
ra ở lần build này** và ném lỗi mức fail. Khai menu trỏ tới điểm đến chưa nhập nội dung thì
build **dừng trên máy**, đúng triết lý đã ghi ở `site.config.ts:244-246`.

Cũng cập nhật bảng "BẢY LOẠI ĐÍCH" trong khối chú thích `site.config.ts:248-266` → **TÁM**.

### 4.7 Chữ nghĩa: `sections.overview` thành hàm

`src/lib/homepage.ts` — `HOME_COPY[lang].sections.overview` đổi từ `string` sang
`(name: string) => string`:

```ts
vi: { … overview: (name) => `Tổng quan về ${name}`, … }
en: { … overview: (name) => `About ${name}`, … }
```

Sửa 5 ngôn ngữ trong kiểu `HOME_COPY` và 2 chỗ gọi: `SiteHome.astro:209` và khối overview
trong `TouristDestinationHub.astro`. Tên truyền vào là `td.title` (đã theo ngôn ngữ).

`cms/schemas/touristDestination.ts:78-86` — mô tả `containedInPlaceRef` bỏ cụm "tỉnh Khánh
Hoà (I15)", viết lại thành câu chung cho mọi điểm đến.

### 4.8 Hai meta-validator phải sửa theo, nếu không cổng nói dối

Cả `g1` và `g4` **chép tay** danh sách field, không đọc động:

- `scripts/meta-validators/g1-content-model-vs-schema.ts:364` bắt field bằng regex
  `defineField({ name: 'x'` **trong từng file schema**. Field đến từ một `import` + spread thì
  regex không thấy → g1 báo drift `in_content_model_not_in_schema` (mức warn) cho cả mười type.
  Cách sửa **theo đúng tiền lệ có sẵn**: g1 đã xử lý `lodgingBase.ts` bằng một hằng
  `LODGING_BASE` (dòng 28) cộng cờ `usesLodgingBase` trong `SCHEMA_CONFIG` (dòng 318-333).
  Làm y hệt: thêm hằng `DESTINATION_FIELD = ['destination']` và cờ `usesDestination` cho mười
  type.
- `scripts/meta-validators/g4-groq-field-validity.ts:29-` giữ bảng field hợp lệ chép từ
  CONTENT_MODEL. Thêm `destination` vào bảng của mười type, nếu không truy vấn mới ở §4.4 bị
  báo là gọi field ảo.

Không sửa hai chỗ này thì cổng vẫn xanh/vàng nhưng **nói sai về thực tế** — đúng loại lỗi mà
`gate-auditor` sinh ra để bắt.

### 4.9 Tài liệu phải sửa

`g1` **fail** khi schema có field mà `01-CONTENT_MODEL.md` §2 không khai. Nên phần này nằm
trong phạm vi, không phải dọn dẹp thêm.

| File | Sửa gì |
|---|---|
| `docs/core-specs/01-CONTENT_MODEL.md` | dòng 42: cardinality `1` → `N`; thêm dòng `destination` vào **mười** bảng entity §2.x; §2.1 mở đầu (dòng 120-122) nói rõ trang trụ là **mỗi** điểm đến; dòng 583 enum section 19 → 20 khoá; dòng 589 ("luôn đọc từ `touristDestination` Nha Trang"); §6 bảng bất biến thêm **I20**; §5 sơ đồ quan hệ thêm cạnh `* → TouristDestination` |
| `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md` | mẫu URL `/‹destinationSlug›/` là **N** trang, không phải một |
| `docs/core-specs/06-BINDING_MAP.md` | binding khối `destinations` mới + field `destination` |
| `docs/adr/ADR-0028-da-diem-den.md` | **file mới** — nháp kèm spec này |
| `docs/adr/README.md` | một dòng trong mục ADR mới |
| `docs/DECISIONS.md` | `QĐ-2026-08-26-01` khi phê chuẩn |
| `docs/DRIFT_LOG.md` | phiếu nợ §8 |

`I15` **không** phải sửa: `scripts/validators/i1-i19.ts:314-317` cho thấy nó đã gỡ cho
tourdaovn theo `QĐ-2026-08-06-01` và hiện là hàm rỗng. Chỉ có phần **văn xuôi** ở
`01-CONTENT_MODEL.md:685` mô tả nó theo giọng riêng Nha Trang là cần viết lại cho chung.

### 4.10 Bản đồ file

**Mới (4):**
```
cms/schemas/… (không có file mới — destinationField nằm trong baseFields.ts)
src/components/HomeDestinationGrid.astro
scripts/migrate/backfill-destination.ts
docs/adr/ADR-0028-da-diem-den.md
docs/specs/SPEC-2026-08-26-da-diem-den.md   ← file này
```

**Sửa (26 file mã/schema/script + 6 file tài liệu):**
```
cms/schemas/baseFields.ts          + destinationField
cms/schemas/{place,attraction,experience,hotel,resort,tour,article,restaurant,specialty,event}.ts
cms/schemas/touristDestination.ts  mô tả containedInPlaceRef
cms/schemas/siteSettings.ts        SECTION_KEYS 19 → 20
src/site.config.ts                 NavKind + bảng chú thích 7 → 8 loại đích
src/lib/routes.ts                  resolveInternalPath nhánh 'destination'
src/lib/homepage.ts                sections.overview thành hàm; + sections.destinations (5 ngôn ngữ)
src/lib/queries/touristDestination.ts   lọc 2 khối + otherDestinationsQuery
src/lib/queries/index.ts           export truy vấn mới
src/lib/types.ts                   kiểu card điểm đến
src/pages/index.astro              fetch + truyền xuống
src/components/SiteHome.astro      DEFAULT_SECTIONS + case + overview(name)
src/components/TouristDestinationHub.astro   overview(name)
scripts/gate.config.ts             references cho 7 type (publishable trừ person, organization)
scripts/validators/i1-i19.ts       + I20 mức warn
scripts/meta-validators/g1-…ts     DESTINATION_FIELD + usesDestination
scripts/meta-validators/g4-…ts     + destination vào bảng field
scripts/package.json               + backfill:destination
docs/core-specs/{01,05,06}…md, docs/adr/README.md, docs/DECISIONS.md, docs/DRIFT_LOG.md
```

## 5. Kiểm thử

Dự án không có test đơn vị cho `src/lib` — kiểm chứng đi bằng cổng và bằng trang thật. Bốn
lớp, theo thứ tự:

1. **`npm --prefix scripts run validate`** — bộ I/R/PY trên dữ liệu thật. Kỳ vọng: I20 in
   warn cho document chưa nạp bù, **0 fail mới**.
2. **`npm run gate`** (`astro check` + `gate:all`, gồm g1/g3/g4) — kỳ vọng **0 fail**, và số
   drift warn của g1 **không tăng** so với `scripts/reports/g1-content-model-vs-schema.json`
   hiện tại (14 warn). Tăng nghĩa là §4.8 làm chưa xong.
3. **`npm run build`** — kỳ vọng dựng đủ trang, `assertNavTargetsExist` không ném.
4. **Trang thật.** Tạo một Điểm đến nháp thứ hai trong Studio, duyệt, dựng lại, rồi mở
   `/‹slug›/` và đối chiếu: hai khối tự động phải hiện nội dung **của nó**, không phải của Nha
   Trang; tiêu đề khối overview phải mang tên nó.

Kiểm hồi quy bắt buộc cho trang chủ: sau khi nạp bù, `/` phải giữ **nguyên** 4 card khu vực và
4 card cẩm nang như trước. Lệch là dấu hiệu nạp bù sót.

## 6. Vận hành — rào cản phải vượt trước khi thi hành

**Quota API Sanity đã cạn.** Truy vấn thử lúc soạn spec này trả `plan_limit_reached`. Theo
`QĐ-2026-08-25-01`, hạn mức là 250.000 request/tháng, **reset 00:00 UTC ngày 1** — tức
**2026-09-01**, và rơi về Free không làm đổi hạn mức đó.

Hệ quả cụ thể:

- Script nạp bù (§4.2) gọi API → **chưa chạy được**.
- `npm run build` đọc Sanity lúc dựng → **chưa chạy được**.
- Nên §5 lớp 1, 3, 4 và việc xác minh cú pháp `^._id` ở §4.4 **đều bị chặn tới 1/9**.

Việc **làm được ngay**: toàn bộ sửa schema, sửa mã, sửa validator, sửa tài liệu, và §5 lớp 2
phần g1/g3/g4 (ba validator này đọc file trong repo, không gọi Sanity).

**Auto-deploy đang bật.** Theo bản ghi vận hành, đẩy lên `main` là Workers Builds tự dựng và
đè bản deploy tay. Đợt này làm trên nhánh riêng, không đẩy thẳng `main`. Thêm một lý do nữa:
mỗi lần dựng lại đốt hạn mức Sanity, mà `QĐ-2026-08-25-01` đã chỉ ra 157 lần dựng trong tháng
8 chính là nguyên nhân cạn quota.

## 7. Tiêu chí nghiệm thu

1. Studio hiện ô **Điểm đến** ở nhóm "Vị trí & liên kết" trên đủ mười type; `touristDestination`
   **không** có ô đó.
2. `count(*[_type in [<mười type>] && !defined(destination)]) == 0` sau khi nạp bù.
3. `npm run gate` **0 fail**; g1 warn ≤ 14 (mức hiện tại).
4. `npm run build` xanh; `/` giữ nguyên nội dung như trước đợt này.
5. Điểm đến thứ hai duyệt trong Studio → `/‹slug›/` có mặt trong `dist/`, trong sitemap, và
   hiển thị nội dung của chính nó.
6. Khối "Điểm đến khác" **ẩn** khi chỉ có một điểm đến, **hiện** khi có hai.
7. Khai một mục menu `kind: 'destination'` trỏ tới slug không tồn tại → `npm run build` **dừng**.
8. `01-CONTENT_MODEL.md` không còn dòng nào khai cardinality TouristDestination là 1.

## 8. Còn nợ (ghi để không rơi)

1. **~30 dòng meta description trong `src/lib/uiCopy.ts`** — `INDEX_COPY`, `HUB_COPY`,
   `HUB_PART_COPY`, `fallbackDescription` (dòng 895-1102) đều gắn cứng "tại Nha Trang" /
   "in Nha Trang". Các trang danh mục là **toàn site**, nên khi Phú Quốc có nội dung thì mô tả
   này thành sai sự thật. Hoãn theo quyết định §3.5 — cần một quyết định SEO riêng vì đang là
   meta description của trang đã xếp hạng.
2. **Lọc trang danh mục theo điểm đến** (`/tour/?diem-den=…` hoặc `/‹diem-den›/tour/`) — hướng
   A cố ý không làm. Field `destination` ở §4.1 đã đặt sẵn đường; mở ra là một đợt riêng, đụng
   `ROUTE_MAP` và `05-URL_MAP`.
3. **`brand.description`, `brand.headline`, `brand.tagline`** (`src/site.config.ts:95-106`) nói
   riêng về Nha Trang và là meta của **mọi** trang. Cùng loại quyết định với nợ 1.
4. **Breadcrumb của trang điểm đến thứ hai** — `Breadcrumb.astro:43` đã có nhánh riêng cho
   `touristDestination`, chưa kiểm bằng trang thật vì chưa có document thứ hai.
5. **Chữ trong `HOME_COPY` — đã soát, phần lớn an toàn.** `trustItems` và `hubDescriptions`
   bản **vi** trung tính, không nhắc Nha Trang, nên `TouristDestinationHub` render chúng trên
   trang Phú Quốc vẫn đúng. Hai chỗ có tên riêng thì không rơi vào trang điểm đến:
   `HomeTourGrid.astro:28` ("Khởi hành hằng ngày từ Nha Trang") chỉ dùng ở `SiteHome`, và các
   bản **en/zh/ko/ru** có tên riêng thì chưa render vì `site.config.ts` khai `langs = ['vi']`.
   Ghi lại ở đây để lần mở thêm ngôn ngữ không quên soát.
