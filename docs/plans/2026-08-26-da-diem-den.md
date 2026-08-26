# Kế hoạch thi công — Nhiều điểm đến trên một site

> **Cho tác nhân thi hành:** KỸ NĂNG BẮT BUỘC — dùng `superpowers:subagent-driven-development`
> (khuyến nghị) hoặc `superpowers:executing-plans` để thi hành từng task một. Các bước dùng
> cú pháp checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Chủ dự án nhập một document Điểm đến thứ hai trong Sanity Studio và được ngay một
trang `/‹slug›/` cùng khuôn với trang Nha Trang, hiển thị nội dung của chính nó.

**Kiến trúc:** Thêm một cạnh phẳng `destination` (reference tới `touristDestination`) lên mười
entity, nạp bù toàn bộ dữ liệu cũ về Nha Trang bằng script, rồi thêm đúng một mệnh đề lọc vào
hai truy vấn tự động đang quét toàn dataset. Hạ tầng định tuyến đa điểm đến đã có sẵn
(`src/pages/[...path].astro:73-80`), không xây lại. Trang chủ `/` giữ nguyên vai trang Nha Trang.

**Công nghệ:** Sanity (schema + GROQ), Astro 5 (SSG), TypeScript, tsx cho script và test.

**Spec:** `docs/specs/SPEC-2026-08-26-da-diem-den.md`
**ADR:** `docs/adr/ADR-0028-da-diem-den.md` (trạng thái `proposed`)

---

## Ràng buộc toàn cục

Mọi task đều nằm dưới các luật này. Đọc trước khi bắt đầu bất kỳ task nào.

1. **Nhánh.** Làm trên nhánh riêng, **không đẩy thẳng `main`**. Đẩy lên `main` là Workers
   Builds tự dựng, đè bản deploy tay, và đốt hạn mức API Sanity.
2. **Quota Sanity cạn tới 2026-09-01.** Reset 00:00 UTC ngày 1 (`QĐ-2026-08-25-01`). Mọi lệnh
   gọi Sanity — gồm `npm run build` và script nạp bù — **thất bại với `plan_limit_reached`**
   cho tới lúc đó. Task 1-6 làm được ngay; Task 7-8 phải chờ.
3. **Thứ tự cứng: Task 7 (nạp bù dữ liệu) phải xong trước khi bất kỳ bản dựng nào chạy mã của
   Task 4.** Ngược lại là trang chủ Nha Trang rỗng hai khối.
4. **Hook chặn ghi dữ liệu.** Lệnh Bash chạm script sửa dữ liệu Sanity bị chặn tới khi tạo cờ:
   `touch .claude/.cho-phep-ghi-du-lieu` (tự hết hiệu lực sau 30 phút). Chỉ tạo cờ ở Task 7.
5. **Mọi field của entity là tuỳ chọn**, trừ `title.vi` và `slug.vi` (quy ước chốt 2026-08-04,
   ghi ở `cms/schemas/baseFields.ts:22-27`). Không thêm `validation: Rule.required()` mới.
6. **Không dùng `git add -A`** — hook chặn. Luôn `git add` từng đường dẫn cụ thể.
7. **Mười entity** trong mọi task nghĩa là chính xác: `place`, `attraction`, `experience`,
   `hotel`, `resort`, `tour`, `article`, `restaurant`, `specialty`, `event`. **Không** gồm
   `touristDestination`, `person`, `organization`, `category`, `siteSettings`.
8. **Bảy entity publishable** nghĩa là mười entity trên giao với `GATE.publishableTypes`:
   `place`, `attraction`, `experience`, `hotel`, `resort`, `tour`, `article`.
9. Chạy lệnh của thư mục `scripts/` bằng `npm --prefix scripts run <tên>`.

---

## Bản đồ file

**Tạo mới (3):**

| File | Trách nhiệm |
|---|---|
| `src/components/HomeDestinationGrid.astro` | Lưới card "Điểm đến khác" trên trang chủ. Chỉ trình bày, tự ẩn khi rỗng. |
| `scripts/migrate/backfill-destination.ts` | Việc một lần: gán `destination` = điểm đến trụ cho dữ liệu cũ. |
| `scripts/validators/__tests__/i20.test.ts` | Test đơn vị cho bất biến I20. |

**Sửa — nhóm schema Sanity (12):** `cms/schemas/baseFields.ts` (thêm `destinationField`),
mười file entity, `cms/schemas/siteSettings.ts` (enum section 19 → 20).

**Sửa — nhóm mã site (9):** `src/site.config.ts`, `src/lib/routes.ts`, `src/lib/homepage.ts`,
`src/lib/types.ts`, `src/lib/queries/touristDestination.ts`, `src/lib/queries/index.ts`,
`src/pages/index.astro`, `src/components/SiteHome.astro`,
`src/components/TouristDestinationHub.astro`.

**Sửa — nhóm cổng (5):** `scripts/gate.config.ts`, `scripts/validators/i1-i19.ts`,
`scripts/meta-validators/g1-content-model-vs-schema.ts`,
`scripts/meta-validators/g4-groq-field-validity.ts`, `scripts/package.json`.

**Sửa — nhóm tài liệu (7):** `docs/core-specs/01-CONTENT_MODEL.md`,
`docs/core-specs/04-CONSTRAINTS.md`, `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md`,
`docs/core-specs/06-BINDING_MAP.md`, `docs/governance/control-registry.yaml`,
`docs/DECISIONS.md`, `docs/DRIFT_LOG.md`.

---

# NHÓM A — làm được ngay, không cần Sanity API

## Task 1: Field `destination` trên mười entity, và hai meta-validator theo kịp

Cổng `g1` **fail** khi schema có field mà `01-CONTENT_MODEL` §2 không khai, và `g1` bắt field
bằng regex trên **từng file schema** nên không thấy field nhập từ file khác. Nên schema, hai
meta-validator, và đặc tả phải đi cùng một task — tách ra là cổng đỏ giữa chừng.

**Files:**
- Sửa: `cms/schemas/baseFields.ts` (cuối file)
- Sửa: `cms/schemas/{place,attraction,experience,hotel,resort,tour,article,restaurant,specialty,event}.ts`
- Sửa: `cms/schemas/touristDestination.ts:78-86` (mô tả `containedInPlaceRef`)
- Sửa: `scripts/meta-validators/g1-content-model-vs-schema.ts:311-333`
- Sửa: `scripts/meta-validators/g4-groq-field-validity.ts:48-111`
- Sửa: `docs/core-specs/01-CONTENT_MODEL.md`

**Interfaces:**
- Sản xuất: `export const destinationField` trong `cms/schemas/baseFields.ts` — một
  `defineField` reference tên `destination`, `to: [{ type: 'touristDestination' }]`,
  `group: 'viTri'`. Task 3 và Task 7 dựa vào **tên field là `destination`**; Task 4 dựa vào
  nó đọc được bằng GROQ dưới dạng `destination._ref`.

- [ ] **Bước 1: Ghi lại số drift g1 hiện tại làm mốc**

```bash
cd /Users/tuanbao/Documents/Projects/ctytnhhtourdao/tourdaovn
node -e "const r=require('./scripts/reports/g1-content-model-vs-schema.json');console.log(JSON.stringify(r.summary))"
```

Kỳ vọng: `{"total":14,"fail":0,"warn":14}`. Ghi con số này lại — bước 8 so với nó.

- [ ] **Bước 2: Thêm `destinationField` vào `cms/schemas/baseFields.ts`**

Chèn **sau** khối `export const baseFieldsAfterGallery = [...]` và **trước**
`export const baseFields = [...]` ở cuối file:

```ts
// Cạnh phẳng "nội dung này thuộc điểm đến nào" (ADR-0028). CỐ Ý không nằm trong
// baseFieldsBeforeGallery/AfterGallery: chính touristDestination cũng dùng hai mảng đó,
// nhét vào đấy là cho Điểm đến một ô trỏ vào chính nó.
//
// Khác containedInPlace: containedInPlace trả lời "nằm trong đơn vị chứa TRỰC TIẾP nào"
// và có thứ bậc; field này trả lời "thuộc điểm đến nào" và phẳng. Hai đường song song,
// không suy ra nhau, không có kiểm máy nào bắt chúng phải khớp.
export const destinationField = defineField({
  name: 'destination', type: 'reference',
  group: 'viTri',
  to: [{ type: 'touristDestination' }],
  title: 'Điểm đến',
  description:
    'Nội dung này thuộc điểm đến nào. Để trống thì nó không xuất hiện ở trang điểm đến nào ' +
    '(vẫn lên trang danh mục bình thường).',
})
```

Không đặt `initialValue` — lý do ở `ADR-0028` mục "Lý do".

- [ ] **Bước 3: Nhập và chèn field vào mười file entity**

Với **chín** file `place.ts`, `attraction.ts`, `experience.ts`, `hotel.ts`, `resort.ts`,
`tour.ts`, `restaurant.ts`, `specialty.ts`, `event.ts` — sửa dòng import sẵn có thành:

```ts
import { baseFieldsAfterGallery, baseFieldsBeforeGallery, baseGroups, destinationField } from './baseFields'
```

rồi chèn `destinationField,` vào mảng `fields`, **ngay sau** `...baseFieldsAfterGallery,`.
Ví dụ với `hotel.ts:12-17`:

```ts
  fields: [
    ...baseFieldsBeforeGallery,
    lodgingGalleryField,
    ...baseFieldsAfterGallery,
    destinationField,
    ...lodgingBaseFields
  ],
```

Với `article.ts` — file này **chỉ** nhập `baseGroups`, không dùng hai mảng base:

```ts
import { baseGroups, destinationField } from './baseFields'
```

rồi chèn `destinationField,` vào mảng `fields`, ngay trước `defineField({ name: 'about', …})`
(hiện ở `article.ts:83`) để nó nằm cạnh các field nhóm `viTri`.

**Không sửa `lodgingBase.ts`.** Cho `hotel` và `resort` nhận field qua chính file của chúng,
giống tám entity kia — một luật cho cả mười, và `g1` không phải học thêm một ngoại lệ nữa.

- [ ] **Bước 4: Sửa mô tả `containedInPlaceRef` trong `touristDestination.ts`**

Thay khối `description` ở `cms/schemas/touristDestination.ts:82-86` bằng:

```ts
      description:
        'Trỏ tỉnh/thành chứa điểm đến này qua Wikidata URL. ' +
        'Nếu đã tạo Place cấp Tỉnh tương ứng thì ô này chỉ còn để xuất JSON-LD; ' +
        'chuỗi điều hướng đi theo Place.containedInPlace.'
```

Cũng đổi `title` của field từ `'Nằm trong tỉnh (URL Wikidata)'` thành
`'Nằm trong tỉnh/thành (URL Wikidata)'`.

- [ ] **Bước 5: Dạy `g1` biết field dùng chung này**

Trong `scripts/meta-validators/g1-content-model-vs-schema.ts`, thêm hằng ngay dưới
`const LODGING_GALLERY = 'gallery'` (dòng 35):

```ts
// Field dùng chung khai ở baseFields.ts rồi nhập vào từng entity (ADR-0028). Cùng cơ chế
// với LODGING_BASE: regex bên dưới chỉ quét từng file schema nên không thấy field nhập vào.
const DESTINATION_FIELD = ['destination']
```

Sửa `type SchemaConfig` (dòng 311-316) — thêm một khoá **tuỳ chọn** để mười ba entry còn lại
không phải sửa:

```ts
type SchemaConfig = {
  usesBaseBefore: boolean
  usesBaseAfter: boolean
  usesLodgingBase: boolean
  usesLodgingGallery: boolean
  usesDestination?: boolean
}
```

Trong `SCHEMA_CONFIG` (dòng 318-333) thêm `usesDestination: true` vào **đúng mười** entry:
`place`, `attraction`, `experience`, `restaurant`, `specialty`, `hotel`, `resort`, `tour`,
`event`, `article`. Ví dụ:

```ts
  place: { usesBaseBefore: true, usesBaseAfter: true, usesLodgingBase: false, usesLodgingGallery: false, usesDestination: true },
```

**Không** thêm cho `touristDestination`, `organization`, `person`, `category`.

Trong `buildSchemaFieldSet` (dòng 386-400), thêm một dòng ngay sau dòng `usesLodgingGallery`:

```ts
    if (config.usesDestination) DESTINATION_FIELD.forEach(f => allFields.add(f))
```

- [ ] **Bước 6: Dạy `g4` biết field này hợp lệ**

Trong `scripts/meta-validators/g4-groq-field-validity.ts`, thêm `'destination'` vào **đúng
mười** mảng trong `ENTITY_FIELDS`: `place`, `attraction`, `experience`, `restaurant`,
`specialty`, `hotel`, `resort`, `tour`, `event`, `article`. Ví dụ với `tour` (dòng 93-98):

```ts
  tour: [
    'itinerary', 'operator', 'tourFormat', 'tripOrigin',
    'departureNote', 'duration', 'includes', 'excludes',
    'touristType', 'seasonNote', 'bookingRef',
    'body', 'gallery', 'highlights', 'faq', 'destination',
  ],
```

**Không** thêm vào `COMMON_FIELDS.common` — làm thế là hợp lệ hoá field cho cả
`touristDestination`, `person`, `organization`, tức cổng thôi bắt được truy vấn sai ở ba type đó.

- [ ] **Bước 7: Cập nhật `01-CONTENT_MODEL.md`**

Bốn sửa đổi:

**(a) Cardinality — dòng 42.** Đổi:

```
| TouristDestination | TouristDestination | Chính Nha Trang, container địa lý gốc | 1 | Sanity |
```

thành:

```
| TouristDestination | TouristDestination | Điểm đến trụ, container gốc của một vùng nội dung | N (ADR-0028) | Sanity |
```

**(b) Tiêu đề §2.1 — dòng 120.** Đổi `### 2.1 TouristDestination (Nha Trang)` thành
`### 2.1 TouristDestination (điểm đến trụ)`, và trong đoạn văn ngay dưới, đổi cụm
"Trang TouristDestination ở `/{destinationSlug}/` giữ vai điều phối điểm đến" thành
"**Mỗi** TouristDestination đã duyệt có một trang `/{destinationSlug}/` giữ vai điều phối điểm
đến đó, dùng chung một khuôn; trang chủ site `/` là một vai riêng, trỏ tới điểm đến trụ khai ở
`primaryDestinationSlug`".

**(c) Dòng 589.** Đổi "Featured picks KHÔNG nằm trong siteSettings — luôn đọc từ
`touristDestination` Nha Trang (single source of truth)." thành "… luôn đọc từ
`touristDestination` **của điểm đến đang render** — với trang chủ `/` thì đó là điểm đến trụ
khai ở `primaryDestinationSlug` (single source of truth)."

**(d) Một dòng field mới vào mười bảng §2.x.** Dùng **đúng** chuỗi này cho cả mười:

```
| destination | reference đến TouristDestination | tùy | không | I20 (warn). Cạnh phẳng "thuộc điểm đến nào", độc lập với chuỗi containedInPlace và không suy ra nhau (ADR-0028) | người |
```

Chèn ngay sau dòng `containedInPlace` nếu bảng đó có, còn không thì đặt cuối bảng trước dòng
`imageProvenance`.

- [ ] **Bước 8: Chạy hai meta-validator, đối chiếu với mốc bước 1**

```bash
npm --prefix scripts run audit:spec
node -e "const r=require('./scripts/reports/g1-content-model-vs-schema.json');console.log('g1',JSON.stringify(r.summary))"
node -e "const r=require('./scripts/reports/g4-groq-field-validity.json');console.log('g4',JSON.stringify(r.summary))"
```

Kỳ vọng: `g1` **fail = 0** và **warn = 14** (đúng bằng mốc bước 1 — không tăng). `g4`
**fail = 0**.

Nếu `g1` warn tăng lên 24: bước 5 làm chưa xong, `usesDestination` thiếu ở một hoặc nhiều
entry. Nếu `g1` **fail > 0**: bước 7(d) thiếu bảng nào đó — thông điệp lỗi in tên entity.

- [ ] **Bước 9: Kiểm Studio dựng được**

```bash
npm --prefix cms run build 2>&1 | tail -20
```

Kỳ vọng: dựng xong không `SchemaError`. Lỗi kiểu `Unknown type: touristDestination` nghĩa là
một entity nào đó nhập `destinationField` mà `touristDestination` chưa đăng ký — kiểm
`cms/schemas/index.ts`.

- [ ] **Bước 10: Commit**

```bash
git add cms/schemas/baseFields.ts cms/schemas/place.ts cms/schemas/attraction.ts \
  cms/schemas/experience.ts cms/schemas/hotel.ts cms/schemas/resort.ts cms/schemas/tour.ts \
  cms/schemas/article.ts cms/schemas/restaurant.ts cms/schemas/specialty.ts \
  cms/schemas/event.ts cms/schemas/touristDestination.ts \
  scripts/meta-validators/g1-content-model-vs-schema.ts \
  scripts/meta-validators/g4-groq-field-validity.ts \
  docs/core-specs/01-CONTENT_MODEL.md
git commit -m "feat(cms): field destination trên mười entity + cardinality N

ADR-0028. g1/g4 cập nhật theo cùng lúc để cổng không nói sai."
```

---

## Task 2: Bất biến I20 mức warn, và luật toàn vẹn reference

Hai tầng khác nhau: **thiếu** ô là `warn` (bất biến I20); **trỏ sai** là `fail` (luật
`references` trong `gate.config.ts`, tự bỏ qua khi ô trống nhờ `validate-min.ts:74`).

**Files:**
- Tạo: `scripts/validators/__tests__/i20.test.ts`
- Sửa: `scripts/validators/i1-i19.ts`
- Sửa: `scripts/gate.config.ts`
- Sửa: `scripts/package.json` (glob của `test`)
- Sửa: `docs/core-specs/04-CONSTRAINTS.md` (bảng I)
- Sửa: `docs/core-specs/01-CONTENT_MODEL.md` (bảng bất biến §6)
- Sửa: `docs/governance/control-registry.yaml`

**Interfaces:**
- Tiêu thụ: tên field `destination` từ Task 1.
- Sản xuất: `export function validateI20(docs: any[]): ValidatorResult` trong
  `scripts/validators/i1-i19.ts`, và khoá `I20` trong `VALIDATORS` + `VALIDATOR_LEVELS`.

- [ ] **Bước 1: Viết test cho I20 (test đỏ trước)**

Tạo `scripts/validators/__tests__/i20.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateI20 } from '../i1-i19.js'

const withDest = {
  _id: 'a', _type: 'tour', reviewStatus: 'approved',
  destination: { _type: 'reference', _ref: 'seed.nha-trang' },
}
const withoutDest = { _id: 'b', _type: 'tour', reviewStatus: 'approved' }
const notInScope = { _id: 'c', _type: 'person', reviewStatus: 'approved' }
const destItself = { _id: 'd', _type: 'touristDestination', reviewStatus: 'approved' }

test('I20: entity trong phạm vi có destination thì pass', () => {
  const r = validateI20([withDest])
  assert.equal(r.passed, true)
  assert.deepEqual(r.errors, [])
})

test('I20: entity trong phạm vi thiếu destination thì báo lỗi, nêu _id và _type', () => {
  const r = validateI20([withoutDest])
  assert.equal(r.passed, false)
  assert.equal(r.errors.length, 1)
  assert.match(r.errors[0], /\bb\b/)
  assert.match(r.errors[0], /tour/)
  assert.match(r.errors[0], /I20/)
})

test('I20: type ngoài phạm vi không bị bắt', () => {
  assert.equal(validateI20([notInScope]).passed, true)
  assert.equal(validateI20([destItself]).passed, true)
})

test('I20: chỉ bắt document đã approved', () => {
  const draft = { ...withoutDest, _id: 'e', reviewStatus: 'draft' }
  assert.equal(validateI20([draft]).passed, true)
})

test('I20: reference rỗng (_ref trống) tính là thiếu', () => {
  const empty = { ...withoutDest, _id: 'f', destination: { _type: 'reference', _ref: '' } }
  assert.equal(validateI20([empty]).passed, false)
})
```

- [ ] **Bước 2: Mở glob test cho thư mục validators**

Trong `scripts/package.json`, đổi dòng `"test"` thành:

```json
"test": "tsx --test synthesis/__tests__/*.test.ts audit/__tests__/*.test.ts validators/__tests__/*.test.ts",
```

- [ ] **Bước 3: Chạy test, xác nhận nó ĐỎ**

```bash
npm --prefix scripts test 2>&1 | tail -20
```

Kỳ vọng: hỏng với thông báo kiểu `validateI20 is not a function` hoặc lỗi import. Đỏ vì đúng
lý do — chưa có hàm — chứ không phải vì sai đường dẫn.

- [ ] **Bước 4: Viết `validateI20`**

Trong `scripts/validators/i1-i19.ts`, chèn ngay **trước** khối `// ── Dispatch map ──`:

```ts
// ── I20: Entity đã publish nên khai mình thuộc điểm đến nào (ADR-0028) ──
// Mức warn có chủ ý: thiếu ô này KHÔNG làm hỏng trang nào — document vẫn lên trang danh
// mục bình thường, chỉ không xuất hiện ở trang điểm đến nào. Đặt fail ở đây là chặn publish
// mọi nội dung chưa nạp bù, gồm cả nội dung đang chờ lên.

const I20_SCOPE = new Set([
  'place', 'attraction', 'experience', 'hotel', 'resort',
  'tour', 'article', 'restaurant', 'specialty', 'event',
])

export function validateI20(docs: any[]): ValidatorResult {
  const errors: string[] = []
  for (const doc of docs) {
    if (!I20_SCOPE.has(doc._type)) continue
    if (doc.reviewStatus !== 'approved') continue
    if (!refId(doc.destination)) {
      errors.push(`${doc._id}: ${doc._type} đã publish nhưng thiếu destination — không hiện ở trang điểm đến nào (I20)`)
    }
  }
  return { passed: errors.length === 0, errors }
}
```

`refId` đã được nhập sẵn ở đầu file (`scripts/validators/i1-i19.ts:7`) và trả chuỗi rỗng cho
reference rỗng — đúng ca test ở bước 1.

Đăng ký vào hai bảng ở cuối file:

```ts
export const VALIDATORS: Record<string, …> = {
  …
  I19: (docs) => validateI19(docs),
  I20: (docs) => validateI20(docs),
  'I-FAQ-TYPE': (docs) => validateI_FAQ_TYPE(docs)
}

export const VALIDATOR_LEVELS: Record<string, 'fail' | 'warn'> = {
  …
  I16: 'fail', I17: 'fail', I18: 'fail', I19: 'fail', I20: 'warn',
  'I-FAQ-TYPE': 'fail'
}
```

**Không** thêm `I20` vào `FULL_CORPUS_VALIDATORS` ở `scripts/validate-constraints.ts:52` —
đây là gate completeness, chạy trên tập approved là đúng.

- [ ] **Bước 5: Chạy test, xác nhận XANH**

```bash
npm --prefix scripts test 2>&1 | tail -20
```

Kỳ vọng: 5 test của `i20.test.ts` pass, và không test cũ nào hỏng.

- [ ] **Bước 6: Thêm luật toàn vẹn reference vào `gate.config.ts`**

Trong `scripts/gate.config.ts`, mở rộng `references`:

```ts
  references: {
    // experienceType trỏ đúng một type đích (category) → kiểm được trọn vẹn.
    experience: [
      { field: 'experienceType', to: 'category' },
      { field: 'destination', to: 'touristDestination' },
    ],
    // operator trỏ đúng một type đích (organization) → kiểm được trọn vẹn.
    tour: [
      { field: 'operator', to: 'organization' },
      { field: 'destination', to: 'touristDestination' },
    ],
    // author trỏ đúng một type đích (person) → kiểm được trọn vẹn.
    article: [
      { field: 'author', to: 'person' },
      { field: 'destination', to: 'touristDestination' },
    ],
    // destination trỏ đúng một type đích → kiểm được trọn vẹn, không vướng vấn đề
    // "một trong N type" mà containedInPlace mắc phải (xem chú thích đầu file).
    // Luật này KHÔNG kiểm ô trống: validate-min.ts bỏ qua reference null. Thiếu ô là
    // việc của I20 mức warn.
    place:      [{ field: 'destination', to: 'touristDestination' }],
    attraction: [{ field: 'destination', to: 'touristDestination' }],
    hotel:      [{ field: 'destination', to: 'touristDestination' }],
    resort:     [{ field: 'destination', to: 'touristDestination' }],
  },
```

Bảy type, không phải mười: `restaurant`, `specialty`, `event` không nằm trong
`publishableTypes` nên không có luật nào ở đây.

- [ ] **Bước 7: Khai I20 vào `04-CONSTRAINTS.md` bảng I**

Thêm một dòng ngay sau dòng `I19` (hiện ở `docs/core-specs/04-CONSTRAINTS.md:58`):

```
| I20 | Entity đã publish nên khai `destination` — thuộc điểm đến nào | required-field mức cảnh báo trên mười entity ở ADR-0028; thiếu thì document không hiện ở trang điểm đến nào, KHÔNG chặn publish | warn | QA2 |
```

Và thêm dòng tương ứng vào bảng bất biến trong `01-CONTENT_MODEL.md` §6 (cạnh dòng I18 ở
dòng ~760):

```
| I20 | Entity đã publish nên khai destination | required-field mức warn | ADR-0028 |
```

- [ ] **Bước 8: Khai control I20 vào `control-registry.yaml`**

Thêm vào mục `controls`, ngay sau khối `I19`:

```yaml
  # I20 là control MỚI (ADR-0028), sinh ra đã chạy thật nên khai `live` ngay — khác 27 dòng
  # `gap` phía trên vốn là nợ lịch sử. Khai `gap` cho một control đang chạy sẽ bị GA6 bắt.
  - id: I20
    source: docs/core-specs/04-CONSTRAINTS.md#I20
    level: warn
    stage: pre-build
    executor: scripts/validators/i1-i19.ts
    pipeline: prebuild-validate
    status: live
    evidence: scripts/reports/validator-status.json
```

- [ ] **Bước 9: Chạy cổng kiểm chính bộ kiểm**

```bash
npm --prefix scripts run audit:gate 2>&1 | tail -30
```

Kỳ vọng: **0 fail**. Nếu ra `GA1/I20` ("khai live nhưng thiếu bằng chứng") thì đó là vì
`validator-status.json` chưa có mục I20 — file đó chỉ sinh khi `validate` chạy thật, mà
`validate` gọi Sanity nên đang bị chặn. **Trường hợp này chấp nhận được ở Task 2**: ghi lại,
và Bước 3 của Task 8 sẽ đóng nó. Mọi fail khác thì phải sửa ngay.

- [ ] **Bước 10: Commit**

```bash
git add scripts/validators/i1-i19.ts scripts/validators/__tests__/i20.test.ts \
  scripts/gate.config.ts scripts/package.json \
  docs/core-specs/04-CONSTRAINTS.md docs/core-specs/01-CONTENT_MODEL.md \
  docs/governance/control-registry.yaml
git commit -m "feat(gate): bất biến I20 (warn) + toàn vẹn ref destination

Thiếu destination là warn; trỏ sai type là fail. Hai tầng tách bạch."
```

---

## Task 3: Script nạp bù — viết và test, chưa chạy thật

Chỉ viết và kiểm bằng test đơn vị. **Chạy thật là Task 7**, sau khi quota Sanity mở lại.

**Files:**
- Tạo: `scripts/migrate/backfill-destination.ts`
- Sửa: `scripts/package.json`

**Interfaces:**
- Tiêu thụ: tên field `destination` (Task 1); `primaryDestinationSlug` từ `src/site.config.ts`.
- Sản xuất: lệnh `npm --prefix scripts run backfill:destination` (mặc định khô) và
  `… -- --live` (ghi thật). Task 7 gọi đúng hai lệnh này.

- [ ] **Bước 1: Viết script**

Tạo `scripts/migrate/backfill-destination.ts`, theo đúng khuôn
`scripts/migrate/retarget-contained-in-place.ts` đã có (dry-run là mặc định, `--live` mới ghi):

```ts
// scripts/migrate/backfill-destination.ts
//
// Việc MỘT LẦN (ADR-0028): gán `destination` = điểm đến trụ cho mọi document cũ thuộc mười
// entity mà chưa có ô đó. Dùng setIfMissing nên chạy lại nhiều lần không hại.
//
// Chạy:
//   npm --prefix scripts run backfill:destination            (khô, không ghi)
//   npm --prefix scripts run backfill:destination -- --live  (ghi thật)

import { createClient } from '@sanity/client'
import { config as dotenvConfig } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { primaryDestinationSlug } from '../../src/site.config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenvConfig({ path: resolve(__dirname, '../..', '.env'), quiet: true })

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const writeToken = process.env.SANITY_WRITE_TOKEN || ''
const readToken = process.env.SANITY_READ_TOKEN || ''
const live = process.argv.includes('--live')
const dryRun = !live

export const BACKFILL_TYPES = [
  'place', 'attraction', 'experience', 'hotel', 'resort',
  'tour', 'article', 'restaurant', 'specialty', 'event',
]

/** Gom số đếm theo _type để in bảng trước/sau. Tách ra để test được mà không gọi mạng. */
export function countByType(docs: Array<{ _type: string }>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const d of docs) out[d._type] = (out[d._type] ?? 0) + 1
  return out
}

if (!projectId) { console.error('Thiếu SANITY_STUDIO_PROJECT_ID trong .env'); process.exit(1) }
if (live && !writeToken) {
  console.error('Thiếu SANITY_WRITE_TOKEN — token đọc không patch được.')
  console.error('Chạy: SANITY_WRITE_TOKEN=<token> npm --prefix scripts run backfill:destination -- --live')
  process.exit(1)
}

const client = createClient({
  projectId, dataset, apiVersion: '2026-06-01',
  token: live ? writeToken : writeToken || readToken || undefined,
  useCdn: false, perspective: 'raw',
})

async function main() {
  console.log('Nạp bù field destination (ADR-0028)')
  console.log(`Project: ${projectId}  Dataset: ${dataset}`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`)
  console.log(`Điểm đến trụ (site.config): ${primaryDestinationSlug}\n`)

  const target = await client.fetch<{ _id: string } | null>(
    `*[_type == "touristDestination" && slug.vi.current == $slug][0]{_id}`,
    { slug: primaryDestinationSlug },
  )
  if (!target) {
    console.error(`Không tìm thấy TouristDestination có slug.vi = "${primaryDestinationSlug}". Dừng để không đoán bừa.`)
    process.exit(1)
  }
  console.log(`Target: ${target._id}\n`)

  const docs = await client.fetch<Array<{ _id: string; _type: string }>>(
    `*[_type in $types && !defined(destination)]{_id, _type} | order(_type asc, _id asc)`,
    { types: BACKFILL_TYPES },
  )

  if (docs.length === 0) {
    console.log('Không còn document nào thiếu destination. OK.')
    return
  }

  const before = countByType(docs)
  console.log(`Thiếu destination: ${docs.length} document`)
  for (const [type, n] of Object.entries(before).sort()) console.log(`  ${type.padEnd(14)} ${n}`)

  const patchValue = { _type: 'reference', _ref: target._id }

  if (dryRun) {
    console.log('\nDRY-RUN: chưa ghi gì. Patch mẫu:')
    console.log(JSON.stringify({ destination: patchValue }, null, 2))
    console.log('\nKhi đã duyệt, chạy:')
    console.log('  npm --prefix scripts run backfill:destination -- --live')
    return
  }

  let patched = 0
  for (const doc of docs) {
    await client.patch(doc._id).setIfMissing({ destination: patchValue }).commit()
    patched++
    console.log(`  ✓ ${doc._type} ${doc._id}`)
  }

  const left = await client.fetch<number>(
    `count(*[_type in $types && !defined(destination)])`, { types: BACKFILL_TYPES },
  )
  console.log(`\nLIVE: đã nạp bù ${patched}/${docs.length}. Còn thiếu: ${left} (phải là 0).`)
  if (left !== 0) process.exit(1)
}

main().catch((err) => {
  console.error('Nạp bù thất bại:', err.message)
  process.exit(1)
})
```

Ba điểm cố ý:
- **`setIfMissing`, không `set`** — chạy lại không đè giá trị ai đó đã sửa tay.
- **Truy vấn `!defined(destination)` trên `perspective: 'raw'`** — quét cả draft lẫn published.
- **Không viết cứng `seed.nha-trang`** — tra qua `primaryDestinationSlug`, một nguồn sự thật.

- [ ] **Bước 2: Thêm lệnh vào `scripts/package.json`**

Ngay sau dòng `"backfill:seo-meta"`:

```json
"backfill:destination": "node --import ./node_modules/tsx/dist/esm/index.mjs migrate/backfill-destination.ts",
```

- [ ] **Bước 3: Kiểm script gọi được và dừng đúng chỗ**

```bash
npm --prefix scripts run backfill:destination 2>&1 | head -20
```

Kỳ vọng **hôm nay**: in ba dòng đầu (`Nạp bù field destination`, `Project:`, `Mode: DRY-RUN`)
rồi chết ở truy vấn với `plan_limit_reached`. Đó là **kết quả đúng** ở giai đoạn này — nó chứng
minh script nhập được `primaryDestinationSlug`, dựng được client, và tới đúng bước gọi mạng.

Nếu chết **trước** ba dòng đó (lỗi import, lỗi cú pháp) thì phải sửa ngay.

- [ ] **Bước 4: Commit**

```bash
git add scripts/migrate/backfill-destination.ts scripts/package.json
git commit -m "feat(migrate): script nạp bù destination (chưa chạy)

Dry-run mặc định, --live mới ghi. setIfMissing nên idempotent.
Chạy thật chờ quota Sanity mở lại 2026-09-01."
```

---

## Task 4: Truy vấn lọc theo điểm đến

> ⚠️ **Mã của task này không được lên bản dựng nào trước khi Task 7 chạy xong.** Nó đổi hai
> khối trang chủ từ "quét toàn dataset" sang "lọc theo điểm đến"; dữ liệu chưa nạp bù thì
> trang chủ Nha Trang rỗng hai khối.

**Files:**
- Sửa: `src/lib/queries/touristDestination.ts`
- Sửa: `src/lib/queries/index.ts`
- Sửa: `src/lib/types.ts`

**Interfaces:**
- Tiêu thụ: field `destination` (Task 1).
- Sản xuất:
  - `export function otherDestinationsQuery(lang: string): string` — truy vấn nhận tham số
    `$currentId: string`, trả `DestinationCard[]`.
  - `export interface DestinationCard` trong `src/lib/types.ts` với các khoá
    `_id: string; _type: 'touristDestination'; title: string; slug: string; summary?: string; mainImage?: ImageAsset`.
  Task 5 dùng **đúng** hai tên này.

- [ ] **Bước 1: Thêm mệnh đề lọc vào hai khối tự động**

Trong `src/lib/queries/touristDestination.ts`, hàm `touristDestinationBySlugQuery`:

`"homepagePlaces"` — thêm điều kiện vào cuối bộ lọc:

```groq
    "homepagePlaces": *[_type == "place" && reviewStatus == "approved"
      && defined(slug.${lang}.current)
      && destination._ref == ^._id] | order(
```

`"homepageArticles"` — tương tự:

```groq
    "homepageArticles": *[_type == "article" && reviewStatus == "approved"
      && language == "${lang}" && defined(slug.current)
      && destination._ref == ^._id] | order(
```

`^` trỏ ra phạm vi cha, tức chính document Điểm đến đang được chiếu. Phần `order(…)` và
`[0...4]{…}` giữ **nguyên xi**, không đụng.

Cũng sửa chú thích đầu file (dòng 13): "GROQ query lấy TouristDestination (Nha Trang) theo
slug" → "GROQ query lấy TouristDestination theo slug".

- [ ] **Bước 2: Thêm `otherDestinationsQuery`**

Chèn vào cùng file, ngay trước `export function allDestinationSlugsQuery()`:

```ts
/**
 * Các điểm đến KHÁC đang publish — cho khối "Điểm đến khác" ở trang chủ (ADR-0028).
 * Nhận `$currentId` để tự loại điểm đến đang render khỏi danh sách.
 */
export function otherDestinationsQuery(lang: string): string {
  return `*[
    _type == "touristDestination" &&
    reviewStatus == "approved" &&
    _id != $currentId &&
    defined(slug.${lang}.current)
  ] | order(title.${lang} asc)[0...4]{
    _id, _type,
    "title": coalesce(title.${lang}, title.vi),
    "slug": coalesce(slug.${lang}.current, slug.vi.current),
    "summary": coalesce(summary.${lang}, summary.vi),
    ${mainImageFragment()}
  }`
}
```

- [ ] **Bước 3: Xuất truy vấn mới**

Trong `src/lib/queries/index.ts`, thêm `otherDestinationsQuery` vào danh sách re-export cạnh
`touristDestinationBySlugQuery`.

- [ ] **Bước 4: Thêm kiểu `DestinationCard`**

Trong `src/lib/types.ts`, ngay sau `HomepageArticleCard` (dòng 150):

```ts
/** Card điểm đến trên trang chủ — khối "Điểm đến khác" (ADR-0028). */
export interface DestinationCard extends EntityRef {
  _type: 'touristDestination'
}
```

`EntityRef` (dòng 125-132) đã có đủ `_id`, `title`, `slug`, `summary?`, `mainImage?` — không
khai lại.

- [ ] **Bước 5: Kiểu và cổng g4**

```bash
npx astro check 2>&1 | tail -20
npm --prefix scripts run audit:spec 2>&1 | tail -10
node -e "const r=require('./scripts/reports/g4-groq-field-validity.json');console.log('g4',JSON.stringify(r.summary))"
```

Kỳ vọng: `astro check` **0 error**; `g4` **fail = 0**. `g4 fail > 0` với thông báo nhắc
`destination` nghĩa là Task 1 bước 6 sót một entity.

- [ ] **Bước 6: Commit**

```bash
git add src/lib/queries/touristDestination.ts src/lib/queries/index.ts src/lib/types.ts
git commit -m "feat(query): hai khối tự động lọc theo destination + otherDestinationsQuery

KHÔNG deploy trước khi nạp bù dữ liệu xong — xem kế hoạch Task 7."
```

---

## Task 5: Khối "Điểm đến khác" trên trang chủ

**Files:**
- Tạo: `src/components/HomeDestinationGrid.astro`
- Sửa: `cms/schemas/siteSettings.ts:4-24`
- Sửa: `src/components/SiteHome.astro`
- Sửa: `src/pages/index.astro`
- Sửa: `src/lib/homepage.ts`
- Sửa: `docs/core-specs/01-CONTENT_MODEL.md:583`
- Sửa: `docs/core-specs/06-BINDING_MAP.md`

**Interfaces:**
- Tiêu thụ: `otherDestinationsQuery`, `DestinationCard` (Task 4); `destinationHref` từ
  `src/lib/homepage.ts` (đã có, dòng ~).
- Sản xuất: `HomeDestinationGrid.astro` với `Props { destinations?: DestinationCard[]; lang: Lang; heading: string }`.

- [ ] **Bước 1: Tạo `src/components/HomeDestinationGrid.astro`**

Sao khuôn `HomeAreaGrid.astro` — cùng lưới 4 card, cùng token, nhưng dùng `destinationHref`
thay vì `entityHref('place', …)` và **không có** link "Xem tất cả" (không có trang index điểm đến):

```astro
---
// HomeDestinationGrid — lưới card "Điểm đến khác" trên trang chủ (ADR-0028).
// Tự ẩn khi rỗng: chỉ có một điểm đến thì khối này không render gì.
// Cùng token và cùng hình dạng card với HomeAreaGrid — cố ý, để trang chủ không có
// hai ngôn ngữ thị giác cho cùng một loại khối.

import { destinationHref } from '../lib/homepage'
import { imageUrl } from '../lib/sanity-image'
import type { DestinationCard, Lang } from '../lib/types'

export interface Props {
  destinations?: DestinationCard[]
  lang: Lang
  heading: string
}

const { destinations = [], lang, heading } = Astro.props

const cards = destinations
  .map(d => ({
    ...d,
    href: destinationHref(d.slug, lang),
    image: imageUrl(d.mainImage, { width: 400 }),
  }))
  .filter(c => c.href && c.title && c.summary)
  .slice(0, 4)
---

{cards.length > 0 && (
  <section class="dest-section">
    <div class="container">
      <div class="section-header">
        <div class="section-header-left">
          <h2 class="section-title">{heading}</h2>
          <span class="section-underline" aria-hidden="true"></span>
        </div>
      </div>
      <div class="dest-grid">
        {cards.map(card => (
          <a href={card.href!} class="dest-card">
            <div class="dest-img-wrap">
              {card.image ? (
                <img src={card.image} alt={card.mainImage?.alt || card.title} loading="lazy" class="dest-img" />
              ) : (
                <div class="dest-img-fallback" aria-hidden="true"></div>
              )}
            </div>
            <div class="dest-body">
              <h3 class="dest-name">{card.title}</h3>
              <p class="dest-desc line-clamp-2">{card.summary}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
)}

<style>
  .dest-section { padding: var(--s8) 0 var(--s7); }

  .section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: var(--s5);
  }

  .section-title {
    font-family: var(--font-display);
    font-size: var(--fs-section);
    letter-spacing: -0.015em;
    font-weight: var(--fw-800);
    color: var(--c-primary);
    line-height: 1.2;
    margin-bottom: var(--s2);
  }

  .section-underline {
    display: block;
    width: var(--underline-width);
    height: var(--underline-height);
    background: var(--c-sand);
    border-radius: 2px;
  }

  .dest-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--s4);
  }

  .dest-card {
    background: var(--c-card);
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--c-border);
    box-shadow: var(--shadow-card);
    transition: box-shadow var(--m-fast) var(--m-ease);
    color: inherit;
    text-decoration: none;
  }

  .dest-card:hover { box-shadow: var(--shadow-raised); }

  .dest-img-wrap {
    aspect-ratio: 3/2;
    overflow: hidden;
    background: var(--c-primary-soft);
  }

  .dest-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--m-base) var(--m-ease);
  }

  .dest-card:hover .dest-img { transform: scale(1.05); }

  .dest-img-fallback { width: 100%; height: 100%; }

  .dest-body { padding: var(--s4); }

  .dest-name {
    font-family: var(--font-display);
    font-weight: var(--fw-700);
    font-size: var(--fs-sm);
    color: var(--c-text);
    margin-bottom: var(--s1);
    line-height: 1.3;
  }

  .dest-desc {
    font-weight: var(--fw-500);
    font-size: var(--fs-label);
    color: var(--c-text-muted);
    line-height: 1.55;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (max-width: 1024px) {
    .dest-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 640px) {
    .dest-section { padding: var(--s7) 0 var(--s6); }
    .dest-grid { grid-template-columns: 1fr; }
    .section-title { font-size: var(--fs-h4); }
  }
</style>
```

**Chỉ dùng biến token**, không màu/khoảng cách viết cứng — `07-DESIGN_TOKENS` là nguồn duy nhất.

- [ ] **Bước 2: Thêm nhãn khối vào `HOME_COPY` — cả năm ngôn ngữ**

Trong `src/lib/homepage.ts`, thêm khoá `destinations` vào `sections` của **cả năm** khối ngôn
ngữ (kiểu `HOME_COPY` khai `sections` tường minh nên thiếu một ngôn ngữ là `astro check` đỏ):

```ts
// vi
destinations: 'Điểm đến khác',
// en
destinations: 'Other destinations',
// zh
destinations: '其他目的地',
// ko
destinations: '다른 여행지',
// ru
destinations: 'Другие направления',
```

Thêm cả vào khai báo kiểu ở đầu `HOME_COPY` (khối `sections: { … }`), cạnh
`relatedDestinations`.

- [ ] **Bước 3: Mở enum section trong Studio 19 → 20**

Trong `cms/schemas/siteSettings.ts`, thêm vào `SECTION_KEYS` ngay sau dòng `hubGrid`:

```ts
  { title: '🌏 Điểm đến khác', value: 'destinations' },
```

- [ ] **Bước 4: Nối vào `SiteHome.astro`**

Ba sửa đổi:

(a) Nhập component, cạnh các `Home*` khác:
```ts
import HomeDestinationGrid from './HomeDestinationGrid.astro'
```

(b) Thêm prop — trong `export interface Props`, sau `homeTourTotal`:
```ts
  /** Điểm đến khác cho khối "Điểm đến khác". Rỗng thì khối tự ẩn. */
  otherDestinations?: DestinationCard[]
```
và nhập kiểu: sửa dòng import types thành
`import type { Lang, TouristDestinationResult, SiteSettingsResult, DestinationCard } from '../lib/types'`;
sửa dòng destructure thành
`const { td, lang, destinationHref, config, homeTours = [], homeTourTotal = 0, otherDestinations = [] } = Astro.props`.

(c) Thêm vào `DEFAULT_SECTIONS`, ngay sau dòng `{ key: 'hubGrid', hidden: false },`:
```ts
  { key: 'destinations', hidden: false },
```
và thêm một `case` vào `switch`, ngay sau `case 'hubGrid':`:
```ts
      case 'destinations':
        return otherDestinations.length ? (
          <HomeDestinationGrid destinations={otherDestinations} lang={lang} heading={copy.sections.destinations} />
        ) : null
```

- [ ] **Bước 5: Nạp dữ liệu ở `src/pages/index.astro`**

Sửa dòng import queries thành:
```ts
import { touristDestinationBySlugQuery, siteSettingsQuery, otherDestinationsQuery } from '../lib/queries'
```

Thêm ngay sau khối tính `homeTourTotal`:
```ts
// Điểm đến khác cho khối "Điểm đến khác" (ADR-0028). `td` có thể null (đã cảnh báo ở trên),
// khi đó truyền chuỗi rỗng để GROQ vẫn nhận đủ tham số thay vì undefined.
const otherDestinations = td
  ? (await client.fetch<any[]>(otherDestinationsQuery(lang), { currentId: td._id })) ?? []
  : []
```

Và truyền xuống `<SiteHome …>`: thêm thuộc tính `otherDestinations={otherDestinations}`.

- [ ] **Bước 6: Cập nhật đặc tả**

`docs/core-specs/01-CONTENT_MODEL.md:583` — đổi "string enum đóng 19 giá trị" thành "string
enum đóng 20 giá trị" và thêm `destinations` vào danh sách liệt kê, ngay sau `hubGrid`. Thêm
một câu ngay dưới danh sách:

> Khoá `destinations` thêm ở ADR-0028 — khối liệt kê các TouristDestination **khác** đang
> publish. Empty guard áp dụng như mọi section: một điểm đến thì khối không render.

`docs/core-specs/06-BINDING_MAP.md` — **hai** sửa đổi.

(a) §5.7 (bảng trang chủ, bắt đầu ở dòng 322): thêm một dòng ngay **trên** dòng
`| Các khối nội dung |`:

```
| Điểm đến khác | rollup (build): TouristDestination approved khác điểm đến trụ | tùy | ẩn khối | tối đa 4 card; URL là `/{slug}/`, không qua ROUTE_MAP; chỉ có một điểm đến thì khối không render (ADR-0028) |
```

(b) §4.1 (bảng trang điểm đến, dòng 132-144): hai dòng rollup hiện khai nguồn là "Place
approved" và "Article approved" chung chung — giờ chúng đã lọc theo điểm đến, phải nói đúng.
Đổi ô "Dữ liệu nuôi" của hai dòng:

```
| Các khu vực nên biết | rollup (build): Place approved **có `destination` trỏ chính điểm đến này**, ưu tiên area, beach, island, landform, ward | tùy | ẩn | tối đa 4 card, URL từ ROUTE_MAP |
| Cẩm nang bản địa | rollup (build): Article approved theo `language` **có `destination` trỏ chính điểm đến này**, ưu tiên transport-guide, `itinerary`, guide | tùy | ẩn | tối đa 4 card; Article dùng document-level i18n |
```

- [ ] **Bước 7: Kiểu, cổng binding, và Studio**

```bash
npx astro check 2>&1 | tail -20
npm --prefix scripts run audit:spec 2>&1 | tail -10
node -e "const r=require('./scripts/reports/g3-binding-map-vs-template.json');console.log('g3',JSON.stringify(r.summary))"
npm --prefix cms run build 2>&1 | tail -5
```

Kỳ vọng: `astro check` **0 error**; `g3` **fail = 0**; Studio dựng xong.

- [ ] **Bước 8: Commit**

```bash
git add src/components/HomeDestinationGrid.astro src/components/SiteHome.astro \
  src/pages/index.astro src/lib/homepage.ts cms/schemas/siteSettings.ts \
  docs/core-specs/01-CONTENT_MODEL.md docs/core-specs/06-BINDING_MAP.md
git commit -m "feat(home): khối \"Điểm đến khác\", tự ẩn khi chỉ có một điểm đến"
```

---

## Task 6: Loại đích menu `destination`, và tiêu đề overview theo tên điểm đến

**Files:**
- Sửa: `src/site.config.ts` (khối chú thích mục 7 + `NavKind`)
- Sửa: `src/lib/routes.ts:142-185`
- Sửa: `src/lib/homepage.ts`
- Sửa: `src/components/SiteHome.astro:209`
- Sửa: `src/components/TouristDestinationHub.astro`
- Sửa: `docs/DRIFT_LOG.md`
- Sửa: `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md`

**Interfaces:**
- Sản xuất: `NavKind` có thêm giá trị `'destination'`; `HOME_COPY[lang].sections.overview`
  đổi kiểu từ `string` sang `(name: string) => string`.

- [ ] **Bước 1: Thêm `'destination'` vào `NavKind`**

Trong `src/site.config.ts`, đổi dòng 259:

```ts
export type NavKind = 'home' | 'index' | 'hub' | 'term' | 'detail' | 'static' | 'zalo' | 'destination'
```

Trong khối chú thích ngay trên (dòng 248-266), đổi tiêu đề `BẢY LOẠI ĐÍCH  (\`kind\`)` thành
`TÁM LOẠI ĐÍCH  (\`kind\`)` và thêm một dòng vào bảng, sau dòng `'static'`:

```
//   'destination' đường dẫn của một Điểm đến        'phu-quoc'
```

- [ ] **Bước 2: Xử lý loại đích mới trong `routes.ts`**

Trong `src/lib/routes.ts`, hàm `resolveInternalPath`, chèn **ngay sau** khối `if (item.kind === 'static')`:

```ts
  if (item.kind === 'destination') {
    // Không tự kiểm slug có thật hay không tại đây: assertNavTargetsExist đối chiếu mọi
    // mục menu với danh sách trang mà LẦN BUILD NÀY thực sự sinh ra, nên khai trỏ tới điểm
    // đến chưa nhập nội dung là build dừng ngay trên máy, kèm đúng đường dẫn sai.
    return `${prefix}/${target}/`
  }
```

Cũng sửa thông điệp lỗi ở dòng 155 — đang ghi "Xem bảng sáu loại đích" (đã sai từ trước, giờ
là tám):

```ts
  if (!item.kind) bad('thiếu `kind`. Xem bảng tám loại đích ở site.config.ts mục 7.')
```

- [ ] **Bước 3: `sections.overview` thành hàm nhận tên điểm đến**

Trong `src/lib/homepage.ts`, sửa khai báo kiểu của `HOME_COPY` — trong khối `sections: {…}`,
đổi `overview: string` thành:

```ts
    /** Nhận tên điểm đến đang render — trang Phú Quốc không được mang tiêu đề Nha Trang. */
    overview: (name: string) => string
```

Rồi sửa giá trị ở **cả năm** ngôn ngữ:

```ts
vi: … overview: (name) => `Tổng quan về ${name}`,
en: … overview: (name) => `About ${name}`,
zh: … overview: (name) => `关于${name}`,
ko: … overview: (name) => `${name} 소개`,
ru: … overview: (name) => `О направлении ${name}`,
```

- [ ] **Bước 4: Sửa hai chỗ gọi**

`src/components/SiteHome.astro:209` — đổi:

```astro
            <h2 class="editorial-section-heading">{copy.sections.overview}</h2>
```

thành:

```astro
            <h2 class="editorial-section-heading">{copy.sections.overview(td.title)}</h2>
```

(`td` đã được kiểm không null ngay trên, ở dòng `if (!td) return null`.)

`src/components/TouristDestinationHub.astro` — trong khối overview, đổi:

```astro
            <h2 class="section-title">{copy.sections.overview}</h2>
```

thành:

```astro
            <h2 class="section-title">{copy.sections.overview(title)}</h2>
```

(`title` là hằng đã tính ở đầu file: `const title = td?.title || ''`.)

- [ ] **Bước 5: Cập nhật `05-URL_MAP`**

Trong `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md`, đổi dòng 71:

```
| `/{destinationSlug}/` | trang điểm đến | TouristDestination | ví dụ `/nha-trang/`; bản ngôn ngữ ở `/en/nha-trang/`, `/zh/nha-trang/`... |
```

thành:

```
| `/{destinationSlug}/` | trang điểm đến | TouristDestination | **một trang cho MỖI** TouristDestination đã duyệt (ADR-0028), ví dụ `/nha-trang/`, `/phu-quoc/`; bản ngôn ngữ ở `/en/nha-trang/`, `/zh/nha-trang/`... Slug trùng với một segment trong ROUTE_MAP thì bị bỏ qua kèm cảnh báo `[B11]` (`src/pages/[...path].astro:75-78`) |
```

- [ ] **Bước 6: Sửa dòng đếm `kind` đã lỗi thời trong `docs/adr/README.md`**

Mục ADR-0023 đang ghi "Cơ chế `nav` khai trong `site.config` (sáu `kind`, kiểm lúc build)".
Con số đó đã sai từ trước (thực tế là bảy), và bước 1 vừa nâng lên tám. Đổi `sáu \`kind\``
thành `tám \`kind\``.

- [ ] **Bước 7: Ghi năm phiếu nợ vào `DRIFT_LOG.md`**

Chép **cả năm** mục ở `docs/specs/SPEC-2026-08-26-da-diem-den.md` §8 vào `docs/DRIFT_LOG.md`
theo khuôn các mục `DR-0xx` đang có. Tóm tắt để không phải mở spec:

1. **Mô tả trang danh mục còn gắn cứng "Nha Trang".** `src/lib/uiCopy.ts:895-1102`
   (`INDEX_COPY`, `HUB_COPY`, `HUB_PART_COPY`, `fallbackDescription`) mô tả các trang danh mục
   **toàn site** bằng cụm "tại Nha Trang". Điểm đến thứ hai có nội dung là các mô tả này thành
   sai sự thật. Hoãn theo quyết định phiên 2026-08-26 — đây là meta description của trang đang
   xếp hạng, sửa là quyết định SEO riêng.
2. **Lọc trang danh mục theo điểm đến** (`/tour/?diem-den=…` hoặc `/‹diem-den›/tour/`) — hướng
   A cố ý không làm. Field `destination` đã đặt sẵn đường; mở ra là đợt riêng, đụng `ROUTE_MAP`
   và `05-URL_MAP`.
3. **`brand.description` / `headline` / `tagline`** (`src/site.config.ts:95-106`) nói riêng về
   Nha Trang và là thẻ meta của **mọi** trang. Cùng loại quyết định với nợ 1.
4. **Breadcrumb của trang điểm đến thứ hai** — `Breadcrumb.astro:43` đã có nhánh riêng cho
   `touristDestination`, chưa kiểm bằng trang thật vì chưa có document thứ hai. Task 8 bước 6
   là lần đầu kiểm được.
5. **Chữ trong `HOME_COPY` bản en/zh/ko/ru còn tên riêng "Nha Trang"** — chưa render vì
   `site.config.ts` khai `langs = ['vi']`. Phải soát lại khi mở thêm ngôn ngữ.

- [ ] **Bước 8: Kiểm kiểu và cổng**

```bash
npx astro check 2>&1 | tail -20
npm --prefix scripts run audit:spec 2>&1 | tail -10
```

Kỳ vọng: **0 error**. Bỏ sót một chỗ gọi `copy.sections.overview` sẽ ra lỗi kiểu
`Type '(name: string) => string' is not assignable to type 'string'` — đó chính là cái lưới an
toàn, sửa nốt chỗ nó chỉ.

- [ ] **Bước 9: Commit**

```bash
git add src/site.config.ts src/lib/routes.ts src/lib/homepage.ts \
  src/components/SiteHome.astro src/components/TouristDestinationHub.astro \
  docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md docs/adr/README.md docs/DRIFT_LOG.md
git commit -m "feat(nav): loại đích menu 'destination' + tiêu đề overview theo tên điểm đến"
```

---

# NHÓM B — chờ quota Sanity mở lại (từ 2026-09-01)

## Task 7: Chạy nạp bù thật

**Điều kiện tiên quyết — kiểm đủ ba thứ trước khi bắt đầu:**

1. Đã qua 00:00 UTC ngày 2026-09-01 (quota reset).
2. Có `SANITY_WRITE_TOKEN`. File `.env` hiện **không có** biến này — token đọc không patch
   được. Chủ dự án lấy token ghi ở https://www.sanity.io/manage/project/pgedy374/api.
3. Task 1 đã merge (field `destination` đã có trong schema đã deploy lên Studio).

**Files:** không sửa file nào. Task này đổi **dữ liệu**, và dữ liệu không revert được bằng git.

- [ ] **Bước 1: Xác nhận quota đã mở**

```bash
npm --prefix scripts run backfill:destination 2>&1 | head -25
```

Kỳ vọng: chạy qua được truy vấn, in `Target: <id>` rồi bảng số đếm theo type. Còn thấy
`plan_limit_reached` thì **dừng ở đây**, chưa tới lúc.

- [ ] **Bước 2: Đọc kỹ bảng dry-run**

Con số tham chiếu theo bản sao lưu 2026-08-14: place 12, attraction 18, experience 5, tour 11,
article 3, hotel 5, resort 2, event 1 — **tổng 57**. Số thật sẽ khác vì dữ liệu đã trôi hai
tuần và bảng này đếm cả draft.

Lệch nhiều (ví dụ 200+, hoặc 0) thì **dừng và hỏi chủ dự án**, đừng chạy `--live`.

- [ ] **Bước 3: Sao lưu trước khi ghi**

Dùng đúng script sao lưu đã có của dự án — nó xuất NDJSON vào `backups/` với tên gắn ngày giờ:

```bash
cd cms && node _export-backup.mjs && cd ..
ls -lt backups/ | head -3
```

Kỳ vọng: một file `backups/backup-<ngày>-<giờ>.ndjson` mới, và dòng in
`Backup <N> document → ...` với `N` ở cỡ vài trăm.

Không có bản sao lưu mới thì **không chạy bước 4**.

- [ ] **Bước 4: Mở cờ hook rồi chạy thật**

```bash
touch .claude/.cho-phep-ghi-du-lieu
SANITY_WRITE_TOKEN=<token> npm --prefix scripts run backfill:destination -- --live
```

Kỳ vọng: in một dòng `✓` mỗi document, rồi dòng cuối `Còn thiếu: 0 (phải là 0)`. Script tự
`exit(1)` nếu còn sót.

- [ ] **Bước 5: Kiểm độc lập, không tin dòng in của chính script**

```bash
npm --prefix scripts exec -- tsx -e "
import {createClient} from '@sanity/client';
import {config} from 'dotenv';
config({path:'../.env',quiet:true});
const c=createClient({projectId:process.env.SANITY_STUDIO_PROJECT_ID,dataset:'production',apiVersion:'2026-06-01',token:process.env.SANITY_READ_TOKEN,useCdn:false,perspective:'raw'});
const t=['place','attraction','experience','hotel','resort','tour','article','restaurant','specialty','event'];
console.log('còn thiếu destination:', await c.fetch('count(*[_type in \$t && !defined(destination)])',{t}));
"
```

Kỳ vọng: `còn thiếu destination: 0`.

- [ ] **Bước 6: Ghi bằng chứng**

Tạo `docs/evidence/2026-09-01-backfill-destination/` chứa toàn văn output của bước 1, 4, 5.
Cổng QA2 mặc định là **không đạt** khi không có bằng chứng — một câu "đã chạy xong" không tính.

- [ ] **Bước 7: Xoá cờ hook**

```bash
rm -f .claude/.cho-phep-ghi-du-lieu
```

---

## Task 8: Cổng đầy đủ, bản dựng thật, và nghiệm thu trên trang thật

**Điều kiện tiên quyết:** Task 7 xong, đã xác minh còn thiếu = 0.

**Files:**
- Sửa: `docs/adr/ADR-0028-da-diem-den.md` (proposed → accepted, sau khi chủ dự án phê chuẩn)
- Sửa: `docs/DECISIONS.md` (thêm `QĐ-2026-08-26-01`)
- Tạo: `docs/evidence/2026-09-01-da-diem-den/`

- [ ] **Bước 1: Bộ bất biến trên dữ liệu thật**

```bash
npm --prefix scripts run validate 2>&1 | tail -40
```

Kỳ vọng: **0 fail mới** so với trước đợt này, và `I20` xuất hiện ở mức `warn` với **0 lỗi**
(vì Task 7 đã nạp bù hết). I20 còn lỗi nghĩa là có document `approved` lọt lưới nạp bù.

- [ ] **Bước 2: Bộ cổng đầy đủ**

```bash
npm run gate 2>&1 | tail -40
```

Kỳ vọng: **0 fail**. g1 warn ≤ 14.

- [ ] **Bước 3: Đóng nốt `GA1/I20` nếu Task 2 bước 9 còn treo**

```bash
npm --prefix scripts run audit:gate 2>&1 | tail -20
```

Kỳ vọng: **0 fail**. Bước 1 vừa sinh `scripts/reports/validator-status.json` có mục `I20`, nên
control khai `live` giờ đã có bằng chứng thật.

- [ ] **Bước 4: Dựng thật, và kiểm trang chủ KHÔNG đổi**

```bash
npm run build 2>&1 | tail -20
grep -c "area-card" dist/index.html
grep -c "guide-card\|dest-card" dist/index.html
```

Kỳ vọng: build xanh; `dist/index.html` vẫn có **4** card khu vực đúng như trước đợt này; **0**
card `dest-card` (mới có một điểm đến nên khối tự ẩn — empty guard hoạt động).

Trang chủ mất card khu vực nghĩa là mệnh đề `^._id` ở Task 4 không chạy đúng như dự đoán —
dừng, truy nguyên, đừng deploy.

- [ ] **Bước 5: Chủ dự án tạo Điểm đến thứ hai trong Studio**

Việc của người, không phải của tác nhân. Tối thiểu cần: `title.vi`, `slug.vi`, `summary.vi`,
`mainImage`, `reviewStatus = approved`. Rồi gán `destination` cho ít nhất một Place và một
Article của điểm đến đó, để hai khối tự động có dữ liệu mà kiểm.

- [ ] **Bước 6: Dựng lại và nghiệm thu trên trang thật**

```bash
npm run build 2>&1 | tail -10
ls dist/<slug-diem-den-moi>/index.html
grep -c "dest-card" dist/index.html
grep -o "Tổng quan về [^<]*" dist/<slug-diem-den-moi>/index.html
grep -c "<loc>.*<slug-diem-den-moi>" dist/sitemap-vi.xml
```

Kỳ vọng: trang mới tồn tại trong `dist/`; trang chủ giờ có card `dest-card`; tiêu đề overview
mang **tên điểm đến mới**, không phải "Nha Trang"; sitemap có nó.

Kiểm bằng mắt cuối cùng: mở `dist/<slug>/index.html`, xác nhận khối "Các khu vực nên biết" và
"Cẩm nang bản địa" hiện nội dung **của điểm đến mới**, không phải của Nha Trang.

- [ ] **Bước 7: Thử hàng rào menu**

Thêm tạm vào `nav` trong `src/site.config.ts`:

```ts
  { label: 'Thử', kind: 'destination', target: 'diem-den-khong-ton-tai' },
```

```bash
npm run build 2>&1 | tail -20
```

Kỳ vọng: build **DỪNG** với thông điệp của `assertNavTargetsExist` nêu đúng đường dẫn sai.
Rồi **xoá dòng thử đó đi** và dựng lại cho xanh.

- [ ] **Bước 8: Ghi bằng chứng**

Tạo `docs/evidence/2026-09-01-da-diem-den/` chứa output các bước 1, 2, 3, 4, 6, 7.

- [ ] **Bước 9: Chốt quyết định**

Sau khi chủ dự án phê chuẩn:
- `docs/adr/ADR-0028-da-diem-den.md`: `proposed` → `accepted`, điền ngày và người phê chuẩn.
- `docs/adr/README.md`: thêm một mục vào phần "ADR riêng của tourdaovn", sau ADR-0027:

```markdown
- [ADR-0028](ADR-0028-da-diem-den.md) — **TouristDestination là N**, và mọi entity khai mình
  thuộc điểm đến nào. Khuôn tái dùng: cardinality của entity trụ là tham số chứ không phải
  hằng; quan hệ `* → touristDestination` là cạnh phẳng, độc lập với chuỗi `containedInPlace`.
  Việc site này giữ Nha Trang ở `/` là cấu hình, không phải luật engine.
```

- `docs/DECISIONS.md`: thêm `QĐ-2026-08-26-01` theo khuôn các mục có sẵn — bối cảnh, câu hỏi,
  chốt, ai chốt, hệ quả đã lường.

- [ ] **Bước 10: Commit**

```bash
git add docs/adr/ADR-0028-da-diem-den.md docs/adr/README.md docs/DECISIONS.md \
  docs/evidence/2026-09-01-da-diem-den/
git commit -m "docs: ADR-0028 accepted + QĐ-2026-08-26-01 + bằng chứng nghiệm thu"
```

---

## Tiêu chí nghiệm thu (đối chiếu spec §7)

| # | Tiêu chí | Kiểm ở |
|---|---|---|
| 1 | Studio hiện ô "Điểm đến" trên đủ mười type; `touristDestination` không có | Task 1 bước 9 + kiểm mắt trong Studio |
| 2 | `count(… && !defined(destination)) == 0` | Task 7 bước 5 |
| 3 | `npm run gate` 0 fail; g1 warn ≤ 14 | Task 8 bước 2 |
| 4 | `npm run build` xanh; `/` giữ nguyên nội dung | Task 8 bước 4 |
| 5 | Điểm đến thứ hai có trang trong `dist/` và trong sitemap | Task 8 bước 6 |
| 6 | Khối "Điểm đến khác" ẩn khi một, hiện khi hai | Task 8 bước 4 và bước 6 |
| 7 | Menu trỏ slug không tồn tại → build dừng | Task 8 bước 7 |
| 8 | `01-CONTENT_MODEL` không còn khai cardinality là 1 | Task 1 bước 7(a) |
