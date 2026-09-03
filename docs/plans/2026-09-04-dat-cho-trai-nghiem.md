# Kế hoạch thi công — Form đặt chỗ trên trang Trải nghiệm

> **Cho tác nhân thi hành:** SKILL BẮT BUỘC — dùng `superpowers:subagent-driven-development`
> (khuyến nghị) hoặc `superpowers:executing-plans` để chạy từng task. Các bước dùng ô đánh dấu
> `- [ ]`.

**Mục tiêu:** Khách đọc một trang `/trai-nghiem/{slug}` đặt được ngay tại chỗ, bằng đúng cỗ máy
đang phục vụ 28 trang tour — không phải một bản chép thứ hai.

**Kiến trúc:** Tham số hoá, không nhân bản. `BookingForm` nhận thêm hai prop; đường ghi runtime
học một trường `productType` thay vì đoán loại trang từ slug; lược đồ giá mở thêm đơn vị thứ tư
`perGroup` cho sản phẩm bán theo lượt. Không component mới, không endpoint mới, không dependency
runtime mới.

**Công nghệ:** Astro 5 + adapter Cloudflare, Cloudflare D1, Sanity (đọc lúc build),
`data/prices.yaml` sinh từ Google Sheet, vitest + `@cloudflare/vitest-pool-workers` (D1 thật trong
miniflare), `node:test` cho validator trong `scripts/`.

**Spec:** `docs/specs/SPEC-2026-09-04-dat-cho-trai-nghiem.md`
**ADR:** `docs/adr/ADR-0033-dat-cho-cho-trai-nghiem.md` (accepted)
**Phiếu:** `QĐ-2026-09-04-01` — **bản ghi override** điểm dừng cứng `CLAUDE.md` §5
**Nhánh:** `feat/dat-cho-trai-nghiem`

---

## Ràng buộc toàn cục

Mọi task đều mang ngầm những điều dưới đây. Vi phạm một điều là task **không đạt**, kể cả khi test
xanh.

1. **BK1 — không đọc giá lúc runtime.** `src/pages/api/dat-tour.ts` và `src/lib/booking/*` **không
   được import** `src/lib/prices.ts`, `src/lib/sanity.ts`, `src/lib/resolver.ts`. Client không
   `fetch` giá. Tạm tính chỉ từ số nướng lúc build. (`04-CONSTRAINTS:92`)
2. **BK2 — endpoint chỉ ghi D1.** Không ghi Sanity, không ghi `prices.yaml`, không ghi file.
3. **BK3 — PII chỉ ở D1 và hai tin báo.** Cấm `console.log` tên / SĐT / email / điểm đón / ghi chú.
4. **BK4 — bí mật chỉ ở `wrangler secret`.** Không `[vars]`. **Không ghi mã Google Sheet vào
   repo** (repo công khai; `PRICES_SHEET_ID` ở `.env`).
5. **BK5 — client và server dùng CHUNG `computeQuote`.** Đây là bất biến quan trọng nhất của đợt.
6. **`DR-102` — tạm tính dựng ở máy chủ phải khớp TỪNG THAM SỐ với trạng thái mở màn của markup.**
   Lệch một tham số là số tiền nhảy một nhịp ngay khi trang tải xong. Đã xảy ra thật một lần.
7. **`DR-097` — khoá giá KHÔNG bắt buộc trùng slug.** Đừng suy khoá từ slug ở bất kỳ đâu.
8. **Kiểm tương tác phải hit-test thật.** `element.click()` và listener tự gắn **không** kiểm được
   tương tác thật — ba lỗi đã lọt vì vậy (`7ead36f`, `42805c1`). Dùng `document.elementFromPoint`
   ở toạ độ thật.
9. **Giá trị giao diện đi vào `src/styles/tokens.css`**, không viết cứng trong component
   (`CLAUDE.md` §8).
10. **Chạy `npm run build` TRƯỚC `npm run gate`** — ngược lại là cổng đỏ ảo.
11. **`git add` phải liệt kê đường dẫn cụ thể.** Hook chặn `-A`/`--all`/`.` vì thư mục làm việc
    dùng chung với phiên Claude khác.
12. **PY1–PY8 KHÔNG chạy trong `npm run gate`** (`run-gates.mjs:33-58` không có `py1-py8`) dù
    `control-registry.yaml:348-355` khai `live`. Muốn PY chạy phải gọi
    `npm --prefix scripts run validate`. **Đừng trích cổng xanh làm bằng chứng về giá.**

**Hai cửa một chiều của đợt này:** cột `product_type` (Task 1) và đơn vị `perGroup` (Task 4–7).

---

## Bản đồ tệp

| Tệp | Trách nhiệm | Task |
|---|---|---|
| `migrations/0003_product_type.sql` | **tạo** — thêm cột, `DEFAULT 'tour'` | 1 |
| `src/lib/booking/schema.ts` | kiểu `ProductType`, đọc từ payload, mặc định `'tour'` | 1 |
| `src/lib/booking/store.ts` | ghi cột mới; **`findRecentDuplicate` KHÔNG đổi** | 1 |
| `src/lib/booking/handler.ts` | `backHref` theo loại; ba câu chữ khách thấy | 2 |
| `src/lib/booking/notify/format.ts` | nhãn thư/tin theo loại; dòng đơn giá nhóm | 3, 5 |
| `src/lib/types.ts` | `PriceEntry` thêm nhánh `perGroup` — **bản chép 1/2** | 4 |
| `scripts/lib/price-loader.ts` | `PriceEntry` thêm nhánh `perGroup` — **bản chép 2/2** | 4 |
| `scripts/validators/py1-py8.ts` | PY1 enum, PY2 hình dạng, PY7 số, tập khoá đóng | 4 |
| `src/lib/booking/quote.ts` | `PriceTable` thêm `kind: 'group'`; phép quy lượt | 5 |
| `src/lib/resolver.ts` | `case 'perGroup'` → nhãn | 6 |
| `src/lib/uiCopy.ts` | `perGroup` + `bookingGroupNote`, **5 ngôn ngữ** | 6 |
| `scripts/prices-pull.mjs` | đọc `per5pax`; dựng khối `maxPax`; **khai lại `giuNguyen`** | 7 |
| `src/components/BookingForm.astro` | hai prop mới; nhãn ô đếm; dòng số lượt | 10 |
| `src/components/ExperienceDetail.astro` | dựng form trên trang Trải nghiệm | 11 |
| `BUILD-NOTES.md` | ba bước phát hành vào runbook | 12 |

**Tệp test:** `test/booking/{schema,store,handler,notify,quote}.test.ts`,
`scripts/validators/__tests__/py-pergroup.test.ts` (mới, theo khuôn `py-paxrates.test.ts`).

> **Đọc `§4.7` của spec đòi "bảy tệp perGroup sửa TRONG MỘT commit".** Kế hoạch này tách thành
> Task 4–7 vì mỗi task có chu kỳ test riêng. Ý định của spec vẫn được giữ **ở tầng nhánh**: không
> task `perGroup` nào được gộp lên `main` một mình, cả nhánh gộp một lần (Task 13). Chỗ ràng buộc
> thật sự — hai bản chép tay của `PriceEntry` — nằm **gọn trong Task 4, một commit**. Đây là cách
> đọc có chủ ý, nêu ra để chủ dự án bác nếu thấy sai.

---

## Task 0: Chụp mốc cổng trước khi sửa gì

**Tệp:** không sửa tệp nào.

**Interfaces:**
- Tiêu thụ: —
- Sản xuất: tệp mốc `docs/evidence/2026-09-04-dat-cho-trai-nghiem/gate-baseline.txt`

Đợt này thêm một vùng mới vào trang có ma trận vùng-theo-field **bị máy canh** (`06` §3.1, tầng B
của `luat1-post`). Không có mốc thì không phân biệt được cổng đỏ **mới** với cổng đỏ **có sẵn**.

- [ ] **Bước 1: Xác nhận đang ở đúng nhánh và cây sạch**

```bash
git branch --show-current   # phải in: feat/dat-cho-trai-nghiem
git worktree list           # phải chỉ có MỘT worktree
```

- [ ] **Bước 2: Dựng rồi chạy cổng, lưu nguyên văn**

```bash
mkdir -p docs/evidence/2026-09-04-dat-cho-trai-nghiem
npm run build && npm run gate 2>&1 | tee docs/evidence/2026-09-04-dat-cho-trai-nghiem/gate-baseline.txt
```

Kỳ vọng: **ghi lại đúng thứ nó in ra**, kể cả khi có đỏ. Đỏ có sẵn không phải lý do dừng — nó là
lý do phải có tệp này.

- [ ] **Bước 3: Chạy hai bộ test, lưu mốc**

```bash
npm test 2>&1 | tee -a docs/evidence/2026-09-04-dat-cho-trai-nghiem/gate-baseline.txt
npm --prefix scripts run test 2>&1 | tee -a docs/evidence/2026-09-04-dat-cho-trai-nghiem/gate-baseline.txt
```

- [ ] **Bước 4: Commit mốc**

```bash
git add docs/evidence/2026-09-04-dat-cho-trai-nghiem/gate-baseline.txt
git commit -m "chore(dat-cho): chup moc cong truoc khi thi cong dat cho trai nghiem"
```

---

## Task 1: Cột `product_type` — migration, store, schema

**Tệp:**
- Tạo: `migrations/0003_product_type.sql`
- Sửa: `src/lib/booking/schema.ts`, `src/lib/booking/store.ts`
- Test: `test/booking/schema.test.ts`, `test/booking/store.test.ts`

**Interfaces:**
- Tiêu thụ: —
- Sản xuất:
  - `export type ProductType = 'tour' | 'experience'` (từ `schema.ts`)
  - `BookingInput.productType: ProductType`, `BookingValid.productType: ProductType`
  - `NewBooking.productType: ProductType`, `BookingRow.product_type: string`

> `vitest.config.ts` gọi `readD1Migrations(join(here,'migrations'))`, nên migration mới **tự động**
> được áp cho D1 trong miniflare. Không sửa `vitest.config.ts`.

- [ ] **Bước 1: Tạo migration**

```sql
-- migrations/0003_product_type.sql
-- ADR-0033 quyết định 6: đường ghi runtime học loại sản phẩm thay vì đoán từ slug.
-- DEFAULT 'tour' để mọi đơn đã có được gán đúng loại mà không cần script vá.
-- Thao tác BỒI: mã đang chạy liệt kê cột theo tên (store.ts) nên không đọc cột này.
ALTER TABLE booking ADD COLUMN product_type TEXT NOT NULL DEFAULT 'tour';
```

- [ ] **Bước 2: Viết test thất bại cho `schema.ts`**

Thêm vào cuối `test/booking/schema.test.ts`:

```ts
describe('productType', () => {
  it('thiếu productType → mặc định "tour" (client cũ còn cache)', () => {
    const input = parseBookingPayload({ tourSlug: 'x', pax: { adult: 1 } })
    expect(input.productType).toBe('tour')
  })
  it('giá trị lạ → "tour", không ném lỗi', () => {
    expect(parseBookingPayload({ productType: 'hotel' }).productType).toBe('tour')
    expect(parseBookingPayload({ productType: 123 }).productType).toBe('tour')
  })
  it('"experience" giữ nguyên', () => {
    expect(parseBookingPayload({ productType: 'experience' }).productType).toBe('experience')
  })
})
```

- [ ] **Bước 3: Chạy test, xác nhận ĐỎ**

```bash
npx vitest run test/booking/schema.test.ts -t productType
```

Kỳ vọng: FAIL — `productType` là `undefined`.

- [ ] **Bước 4: Sửa `schema.ts`**

Thêm ngay dưới `export type PaymentMethod`:

```ts
/** Loại sản phẩm của đơn (ADR-0033 §6). Quyết định đường quay lại và nhãn tin báo. */
export type ProductType = 'tour' | 'experience'
const PRODUCT_TYPES = new Set<string>(['tour', 'experience'])
/** Không có / lạ → 'tour'. KHÔNG ném lỗi: đơn từ client cũ còn cache phải đi tiếp được. */
function docProductType(v: unknown): ProductType {
  const s = str(v)
  return PRODUCT_TYPES.has(s) ? (s as ProductType) : 'tour'
}
```

Thêm `productType: ProductType` vào `BookingInput`, và trong `parseBookingPayload` thêm:

```ts
  const productType = docProductType(pick(r, 'productType'))
```

rồi đưa `productType` vào object trả về.

- [ ] **Bước 5: Chạy test, xác nhận XANH**

```bash
npx vitest run test/booking/schema.test.ts
```

- [ ] **Bước 6: Viết test thất bại cho `store.ts`**

Thêm vào `test/booking/store.test.ts`:

```ts
it('ghi và đọc lại product_type', async () => {
  const b = nb({ code: 'TD-260905-PT01', phone: '0900000101', ipHash: 'pt1', productType: 'experience' })
  await insertBooking(env.BOOKING_DB, b)
  const row = await getBookingByCode(env.BOOKING_DB, 'TD-260905-PT01')
  expect(row?.product_type).toBe('experience')
})

it('findRecentDuplicate GIỮ NGUYÊN hành vi cũ: KHÔNG xét loại sản phẩm', async () => {
  // Canh để lần sau không ai âm thầm nới cửa chống trùng đã đặc tả ở
  // SPEC-2026-08-21-dat-tour.md:224. Cùng slug + SĐT + ngày là trùng, bất kể loại.
  const chung = { tourSlug: 'trung-slug', departDate: '2026-09-09', phone: '0900000102' }
  await insertBooking(env.BOOKING_DB, nb({ ...chung, code: 'TD-260905-PT02', ipHash: 'pt2', productType: 'tour' }))
  const dup = await findRecentDuplicate(env.BOOKING_DB, chung.phone, chung.tourSlug, chung.departDate, '2000-01-01T00:00:00Z')
  expect(dup).toBe('TD-260905-PT02')
})
```

Thêm `productType: 'tour',` vào object mặc định của hàm `nb()`.

- [ ] **Bước 7: Chạy test, xác nhận ĐỎ**

```bash
npx vitest run test/booking/store.test.ts -t product_type
```

Kỳ vọng: FAIL — `NewBooking` chưa có `productType`.

- [ ] **Bước 8: Sửa `store.ts`**

- `import type { PaymentMethod, ProductType, Quoted } from './schema'`
- `NewBooking` thêm `productType: ProductType`
- `BookingRow` thêm `product_type: string`
- `insertBooking`: thêm `product_type` vào danh sách cột, `?19` vào `VALUES`, và `b.productType`
  vào `.bind(...)` **đúng thứ tự cuối cùng**
- **`findRecentDuplicate` không đụng một chữ.**

- [ ] **Bước 9: Chạy toàn bộ test booking**

```bash
npx vitest run test/booking/
```

Kỳ vọng: PASS toàn bộ.

- [ ] **Bước 10: Commit**

```bash
git add migrations/0003_product_type.sql src/lib/booking/schema.ts src/lib/booking/store.ts \
        test/booking/schema.test.ts test/booking/store.test.ts
git commit -m "feat(dat-cho): cot product_type — migration 0003, schema, store

findRecentDuplicate GIU NGUYEN: them product_type vao WHERE la NOI cua
chong trung da dac ta o SPEC-2026-08-21:224, va do dist/ thi khong slug
tour nao trung 6 slug trai nghiem. Co test canh."
```

---

## Task 2: `handler.ts` — đường quay lại và ba câu chữ khách thấy

**Tệp:**
- Sửa: `src/lib/booking/handler.ts` (`:62-68`, `:126`, `:210`, `:285`), `src/lib/booking/schema.ts` (`MSG.tourInvalid`)
- Test: `test/booking/handler.test.ts`

**Interfaces:**
- Tiêu thụ: `ProductType` từ Task 1
- Sản xuất: `backHref(slug: string, pt: ProductType): string`

- [ ] **Bước 1: Viết test thất bại**

```ts
describe('backHref theo loại sản phẩm', () => {
  it('experience → /trai-nghiem/{slug}/, KHÔNG phải 404', async () => {
    const res = await postForm({ productType: 'experience', tourSlug: 'du-bay-parasailing-keo-bang-cano' })
    const html = await res.text()
    expect(html).toContain('/trai-nghiem/du-bay-parasailing-keo-bang-cano/')
    expect(html).not.toContain('/tour/du-bay-parasailing-keo-bang-cano/')
  })
  it('tour → /tour/{slug}/ như cũ', async () => {
    const res = await postForm({ productType: 'tour', tourSlug: 'tour-hon-tam-tron-goi' })
    expect(await res.text()).toContain('/tour/tour-hon-tam-tron-goi/')
  })
  it('slug sai dạng → "/" bất kể loại', async () => {
    const res = await postForm({ productType: 'experience', tourSlug: 'CÓ DẤU CÁCH' })
    expect(await res.text()).toContain('href="/"')
  })
})
```

> `postForm` là helper đã có trong `handler.test.ts`. Đọc đầu tệp và **dùng lại đúng helper đang
> có**; nếu tên khác thì theo tên đang có, đừng tạo helper thứ hai.

- [ ] **Bước 2: Chạy test, xác nhận ĐỎ**

```bash
npx vitest run test/booking/handler.test.ts -t backHref
```

Kỳ vọng: FAIL — đơn `experience` vẫn trả `/tour/...`.

- [ ] **Bước 3: Sửa `handler.ts`**

```ts
// Tiền tố đường dẫn theo loại sản phẩm (ADR-0033 §6). KHÔNG suy từ slug: slug không mang
// loại, và hai nhánh URL có thể đẻ ra slug trùng nhau về sau.
const TIEN_TO: Record<ProductType, string> = { tour: '/tour/', experience: '/trai-nghiem/' }

function backHref(slug: string, pt: ProductType): string {
  return /^[a-z0-9-]{1,120}$/.test(slug) ? `${TIEN_TO[pt]}${slug}/` : '/'
}
```

`reply()` nhận thêm tham số `pt: ProductType` và chuyển xuống `backHref`. Sửa **mọi** lời gọi
`reply(...)` trong tệp — có 8 chỗ; biến cục bộ `tourSlug` đã có sẵn ở `:160`, thêm cạnh nó
`let productType: ProductType = 'tour'` và gán tại `:205` cùng chỗ gán `tourSlug`.

- [ ] **Bước 4: Sửa ba câu chữ khách nhìn thấy**

- `:210` và `:285`: `'Đã nhận yêu cầu đặt tour'` → `'Đã nhận yêu cầu đặt chỗ'`
- `:126`: `` `Tour: ${v.tourTitle}` `` → `` `${v.productType === 'tour' ? 'Tour' : 'Trải nghiệm'}: ${v.tourTitle}` ``
- `schema.ts` `MSG.tourInvalid` — **giữ nguyên tên khoá** (đổi khoá là đổi hợp đồng lỗi), sửa chữ
  thành `'Thông tin sản phẩm không hợp lệ, hãy tải lại trang.'`

- [ ] **Bước 5: Chạy test, xác nhận XANH**

```bash
npx vitest run test/booking/handler.test.ts
```

- [ ] **Bước 6: Commit**

```bash
git add src/lib/booking/handler.ts src/lib/booking/schema.ts test/booking/handler.test.ts
git commit -m "fix(dat-cho): backHref theo loai san pham — khach trai nghiem khong con roi vao 404"
```

---

## Task 3: `notify/format.ts` — nhãn thư và tin Zalo theo loại

**Tệp:**
- Sửa: `src/lib/booking/notify/format.ts` (`:17`, `:34`)
- Test: `test/booking/notify.test.ts`

**Interfaces:**
- Tiêu thụ: `NewBooking.productType` từ Task 1
- Sản xuất: — (chỉ đổi chuỗi)

- [ ] **Bước 1: Viết test thất bại**

```ts
it('đơn trải nghiệm: tiêu đề [Đặt trải nghiệm], thân thư ghi "Trải nghiệm:"', () => {
  const b = nb({ productType: 'experience', tourTitle: 'Dù bay parasailing' })
  expect(formatSubject(b)).toContain('[Đặt trải nghiệm]')
  expect(formatText(b)).toContain('Trải nghiệm: Dù bay parasailing')
  expect(formatText(b)).not.toContain('Tour: Dù bay parasailing')
})
it('đơn tour giữ nguyên nhãn cũ', () => {
  const b = nb({ productType: 'tour', tourTitle: 'Tour 3 đảo' })
  expect(formatSubject(b)).toContain('[Đặt tour]')
  expect(formatText(b)).toContain('Tour: Tour 3 đảo')
})
```

> `nb()` trong `notify.test.ts` cũng phải thêm `productType: 'tour'` vào mặc định.

- [ ] **Bước 2: Chạy test, xác nhận ĐỎ**

```bash
npx vitest run test/booking/notify.test.ts -t 'trải nghiệm'
```

- [ ] **Bước 3: Sửa `format.ts`**

```ts
// Nhân viên đọc thư phải biết ngay đơn thuộc loại sản phẩm gì (ADR-0033 §6).
const NHAN_LOAI: Record<ProductType, string> = { tour: 'tour', experience: 'trải nghiệm' }
const NHAN_DONG: Record<ProductType, string> = { tour: 'Tour', experience: 'Trải nghiệm' }
```

`formatSubject`: `` `[Đặt ${NHAN_LOAI[b.productType]}] ${b.code} · …` ``
`formatText` dòng đầu: `` `Đơn đặt ${NHAN_LOAI[b.productType]} mới — ${b.code}` ``
`formatText` dòng thứ hai: `` `${NHAN_DONG[b.productType]}: ${b.tourTitle}` ``

- [ ] **Bước 4: Chạy test, xác nhận XANH**

```bash
npx vitest run test/booking/notify.test.ts
```

- [ ] **Bước 5: Commit**

```bash
git add src/lib/booking/notify/format.ts test/booking/notify.test.ts
git commit -m "feat(dat-cho): nhan thu/tin bao theo loai san pham"
```

---

## Task 4: `perGroup` — kiểu dữ liệu (HAI bản chép) và validator

> ⚠️ **`src/lib/types.ts` và `scripts/lib/price-loader.ts` là HAI bản chép tay của cùng một kiểu.**
> `ADR-0027` §Hệ quả ghi rõ: lệch hai bản là lỗi. Sửa **cùng một commit**, không tách.

**Tệp:**
- Sửa: `src/lib/types.ts` (`:2`, `:10-13`), `scripts/lib/price-loader.ts` (`:4`, `:10-13`),
  `scripts/validators/py1-py8.ts` (`:4`, `:6-9`, PY2, PY7)
- Tạo test: `scripts/validators/__tests__/py-pergroup.test.ts`

**Interfaces:**
- Tiêu thụ: —
- Sản xuất: `{ unit: 'perGroup'; amount: number; maxPax: number }` là một nhánh hợp lệ của
  `PriceEntry` ở **cả hai** tệp; `VALID_UNITS` gồm `'perGroup'`.

- [ ] **Bước 1: Viết test thất bại**

Tạo `scripts/validators/__tests__/py-pergroup.test.ts`, theo khuôn `py-paxrates.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validatePY1, validatePY2, validatePY7 } from '../py1-py8.js'

const m = (e: any) => new Map([['phao-chuoi', e]])
const hopLe = { unit: 'perGroup', amount: 1000000, maxPax: 5 }

test('PY1: perGroup thuộc enum đơn vị', () => {
  assert.equal(validatePY1(m(hopLe)).passed, true)
})

test('PY2: perGroup phải có amount và maxPax', () => {
  assert.equal(validatePY2(m(hopLe)).passed, true)
  assert.equal(validatePY2(m({ unit: 'perGroup', amount: 1000000 })).passed, false)
  assert.equal(validatePY2(m({ unit: 'perGroup', maxPax: 5 })).passed, false)
})

test('PY2: perGroup KHÔNG được kèm khoá lạ (tập khoá đóng)', () => {
  const r = validatePY2(m({ ...hopLe, paxRates: { child: { amount: 1 } } }))
  assert.equal(r.passed, false)
})

test('PY7: maxPax <= 0 phải FAIL — chia cho 0 ra vô số lượt', () => {
  assert.equal(validatePY7(m({ ...hopLe, maxPax: 0 })).passed, false)
  assert.equal(validatePY7(m({ ...hopLe, maxPax: -1 })).passed, false)
  assert.equal(validatePY7(m({ ...hopLe, maxPax: 2.5 })).passed, false)
})

test('PY7: amount phải là số nguyên dương VND', () => {
  assert.equal(validatePY7(m({ ...hopLe, amount: 0 })).passed, false)
  assert.equal(validatePY7(m({ ...hopLe, amount: 1000.5 })).passed, false)
  assert.equal(validatePY7(m(hopLe)).passed, true)
})
```

- [ ] **Bước 2: Chạy test, xác nhận ĐỎ**

```bash
npm --prefix scripts run test 2>&1 | grep -A3 pergroup
```

Kỳ vọng: FAIL — PY1 báo `perGroup` không thuộc enum.

- [ ] **Bước 3: Sửa HAI bản chép của `PriceEntry`**

Trong **cả** `src/lib/types.ts` **và** `scripts/lib/price-loader.ts`:

```ts
export type PriceUnit = 'perPax' | 'perRoomNight' | 'perTicket' | 'perGroup'
```

và thêm nhánh vào union `PriceEntry`:

```ts
  // ADR-0033 §2: một giá cho cả nhóm, tối đa maxPax khách. `amount` là giá MỘT LƯỢT,
  // KHÔNG phải giá mỗi người — đừng nhân với số khách.
  | { unit: 'perGroup'; amount: number; maxPax: number }
```

- [ ] **Bước 4: Sửa `py1-py8.ts`**

```ts
export const VALID_UNITS = new Set(['perPax', 'perRoomNight', 'perTicket', 'perGroup'])
const ALLOWED_TOP_KEYS: Record<string, Set<string>> = {
  perPax: new Set(['unit', 'amount', 'tiers', 'paxRates']),
  perRoomNight: new Set(['unit', 'from', 'asOf']),
  perTicket: new Set(['unit', 'tickets']),
  perGroup: new Set(['unit', 'amount', 'maxPax']),        // ADR-0033
}
```

Trong `validatePY2`, thêm nhánh cạnh nhánh `perTicket`:

```ts
    } else if (entry.unit === 'perGroup') {
      if (typeof (entry as any).amount !== 'number') {
        errors.push(`${key}: perGroup thiếu amount (PY2)`)
      }
      if (typeof (entry as any).maxPax !== 'number') {
        errors.push(`${key}: perGroup thiếu maxPax (PY2)`)
      }
    }
```

Trong `validatePY7`, thêm nhánh:

```ts
    } else if (entry.unit === 'perGroup') {
      const a = raw.amount
      if (typeof a === 'number' && (!Number.isInteger(a) || a <= 0)) {
        errors.push(`${key}: amount=${a} không phải số nguyên dương VND (PY7)`)
      }
      // maxPax <= 0 là FAIL, không phải warn: soLuot = ceil(n / maxPax) sẽ ra Infinity.
      const mp = raw.maxPax
      if (typeof mp === 'number' && (!Number.isInteger(mp) || mp <= 0)) {
        errors.push(`${key}: maxPax=${mp} phải là số nguyên dương (PY7)`)
      }
    }
```

**Không đụng PY3** — tour vẫn buộc `perPax`; không tour nào dùng `perGroup`.

- [ ] **Bước 5: Chạy test, xác nhận XANH**

```bash
npm --prefix scripts run test
```

- [ ] **Bước 6: Kiểm hai bản chép KHỚP nhau**

```bash
diff <(sed -n '/export type PriceUnit/,/^$/p' src/lib/types.ts) \
     <(sed -n '/export type PriceUnit/,/^$/p' scripts/lib/price-loader.ts)
```

Kỳ vọng: **không có dòng khác nhau** ở phần union. Có khác là chưa xong bước 3.

- [ ] **Bước 7: Commit**

```bash
git add src/lib/types.ts scripts/lib/price-loader.ts scripts/validators/py1-py8.ts \
        scripts/validators/__tests__/py-pergroup.test.ts
git commit -m "feat(gia): don vi thu tu perGroup — kieu du lieu (HAI ban chep) va PY1/PY2/PY7

ADR-0033 §2. maxPax <= 0 la FAIL chu khong phai warn: soLuot = ceil(n/maxPax)
se ra Infinity. Hai ban chep tay cua PriceEntry sua cung mot commit theo
canh bao cua ADR-0027."
```

---

## Task 5: `quote.ts` — phép quy lượt

**Tệp:**
- Sửa: `src/lib/booking/quote.ts`
- Test: `test/booking/quote.test.ts`

**Interfaces:**
- Tiêu thụ: nhánh `perGroup` của `PriceEntry` (Task 4)
- Sản xuất:
  - `PriceTable` thêm `{ kind: 'group'; amount: number; maxPax: number }`
  - `QuoteLine` thêm trường tuỳ chọn `unit?: 'luot'`
  - `priceTableFromEntry` nhận `unit === 'perGroup'`

- [ ] **Bước 1: Viết test thất bại**

```ts
const group: PriceTable = { kind: 'group', amount: 1000000, maxPax: 5 }

describe('computeQuote — perGroup', () => {
  it('1 khách = 1 lượt = 1.000.000', () => {
    expect(computeQuote(group, { adult: 1, child: 0, senior: 0, infant: 0 })?.total).toBe(1000000)
  })
  it('5 khách VẪN 1 lượt = 1.000.000 (giá nhóm, không nhân đầu người)', () => {
    expect(computeQuote(group, { adult: 5, child: 0, senior: 0, infant: 0 })?.total).toBe(1000000)
  })
  it('6 khách = 2 lượt = 2.000.000 (tiền nhảy bậc)', () => {
    expect(computeQuote(group, { adult: 6, child: 0, senior: 0, infant: 0 })?.total).toBe(2000000)
  })
  it('30 khách = 6 lượt', () => {
    const q = computeQuote(group, { adult: 30, child: 0, senior: 0, infant: 0 })
    expect(q?.total).toBe(6000000)
    expect(q?.lines[0]).toEqual({ code: 'adult', count: 6, amount: 1000000, subtotal: 6000000, unit: 'luot' })
  })
  it('perPax phải RỖNG — không bịa ra một con số "mỗi người"', () => {
    // Đây chính là lỗi đã loại `tiers` vì nó (quote.ts:82 trả perPax:{adult}).
    expect(computeQuote(group, { adult: 3, child: 0, senior: 0, infant: 0 })?.perPax).toEqual({})
  })
  it('0 khách → null', () => {
    expect(computeQuote(group, { adult: 0, child: 0, senior: 0, infant: 0 })).toBeNull()
  })
  it('maxPax <= 0 → null, không chia cho 0', () => {
    expect(computeQuote({ kind: 'group', amount: 1000000, maxPax: 0 }, { adult: 3, child: 0, senior: 0, infant: 0 })).toBeNull()
  })
  it('ưu đãi 5% áp lên GIÁ MỘT LƯỢT rồi mới nhân số lượt', () => {
    // 1.000.000 − 5% = 950.000; 2 lượt = 1.900.000. KHÔNG phải 2.000.000 − 5%.
    const q = computeQuote(group, { adult: 6, child: 0, senior: 0, infant: 0 }, { prepayPercent: 5, prepay: true })
    expect(q?.total).toBe(1900000)
    expect(q?.prepay).toEqual({ percent: 5, totalGoc: 2000000 })
  })
})

describe('priceTableFromEntry — perGroup', () => {
  it('đọc được dòng perGroup', () => {
    expect(priceTableFromEntry({ unit: 'perGroup', amount: 1000000, maxPax: 5 }))
      .toEqual({ kind: 'group', amount: 1000000, maxPax: 5 })
  })
  it('thiếu maxPax hoặc maxPax <= 0 → null (không đoán)', () => {
    expect(priceTableFromEntry({ unit: 'perGroup', amount: 1000000 })).toBeNull()
    expect(priceTableFromEntry({ unit: 'perGroup', amount: 1000000, maxPax: 0 })).toBeNull()
  })
  it('availablePaxCodes: chỉ một ô đếm', () => {
    expect(availablePaxCodes(group)).toEqual(['adult'])
  })
})
```

- [ ] **Bước 2: Chạy test, xác nhận ĐỎ**

```bash
npx vitest run test/booking/quote.test.ts -t perGroup
```

- [ ] **Bước 3: Sửa `quote.ts`**

```ts
export type PriceTable =
  | { kind: 'flat'; perPax: Partial<Record<PaxCode, number>> & { adult: number }; notes?: Partial<Record<PaxCode, string>> }
  | { kind: 'tiers'; tiers: { maxPax: number; amount: number }[] }
  // ADR-0033 §2: một giá cho cả nhóm. `amount` là giá MỘT LƯỢT.
  | { kind: 'group'; amount: number; maxPax: number }

/** `unit: 'luot'` → `count` đếm LƯỢT, không đếm người. Chỉ nhánh group dùng. */
export type QuoteLine = { code: PaxCode; count: number; amount: number; subtotal: number; unit?: 'luot' }
```

Trong `computeQuote`, đặt nhánh mới **ngay trước** nhánh `tiers`:

```ts
  if (table.kind === 'group') {
    // maxPax <= 0 thì ceil(n/0) = Infinity — chặn ở đây, đừng để nó thành số tiền.
    if (!Number.isInteger(table.maxPax) || table.maxPax <= 0) return null
    const soLuot = Math.ceil(n / table.maxPax)
    const amount = nhan(table.amount)
    return kem({
      lines: [{ code: 'adult', count: soLuot, amount, subtotal: amount * soLuot, unit: 'luot' }],
      total: amount * soLuot,
      // RỖNG có chủ ý: không có "giá mỗi người" nào tồn tại cho dòng giá này. Trả một con số
      // ở đây là dựng lại đúng lỗi đã khiến `tiers` bị loại khỏi vai giá nhóm (ADR-0033 §2).
      perPax: {},
    }, khongUuDai(table.amount) * soLuot)
  }
```

`availablePaxCodes`:

```ts
export function availablePaxCodes(table: PriceTable): PaxCode[] {
  if (table.kind === 'tiers' || table.kind === 'group') return ['adult']
  return PAX_ORDER.filter(c => typeof table.perPax[c] === 'number')
}
```

`priceTableFromEntry` — thêm **trước** dòng `if (e.unit !== 'perPax') return null`:

```ts
  if (e.unit === 'perGroup') {
    const amount = e.amount, maxPax = e.maxPax
    if (typeof amount !== 'number') return null
    if (typeof maxPax !== 'number' || !Number.isInteger(maxPax) || maxPax <= 0) return null
    return { kind: 'group', amount, maxPax }
  }
```

- [ ] **Bước 4: Chạy test, xác nhận XANH**

```bash
npx vitest run test/booking/quote.test.ts
```

- [ ] **Bước 4b: LỖI CHẶN — máy chủ phải kiểm được đơn nhóm**

`schema.ts:230-235` dựng lại `{ kind: 'flat', perPax: quotedPerPax }` để kiểm nhất quán (BK5). Với
`perGroup`, `quoted.perPax` **rỗng có chủ ý** → `quotedOk` là `false` → **mọi đơn Phao chuối bị từ
chối** bằng `MSG.quotedMismatch`. Form dựng đẹp, khách bấm gửi, máy chủ chặn.

Viết test này TRƯỚC, xác nhận nó đỏ:

```ts
it('đơn nhóm KHÔNG bị quotedMismatch — server dựng lại bảng group để kiểm', () => {
  const r = validateBooking(parseBookingPayload({
    tourSlug: 'phao-chuoi', tourTitle: 'Phao chuối', bookingRef: 'phao-chuoi',
    departDate: todayVN(), productType: 'experience',
    pax: { adult: 6 },
    quoted: { perPax: {}, total: 2000000, quotedAt: new Date().toISOString(),
              group: { amount: 1000000, maxPax: 5 } },
    paymentMethod: 'onboard', name: 'Nguyễn Văn A', phone: '0905123456',
  }))
  expect(r.ok).toBe(true)
})
it('đơn nhóm khai tổng sai vẫn bị chặn', () => {
  const r = validateBooking(parseBookingPayload({ /* như trên nhưng total: 1000000 */ }))
  expect(r.ok).toBe(false)
})
```

> Đọc `schema.ts` để lấy **đúng tên** hàm kiểm (`validateBooking` hay tên khác) và đúng các trường
> bắt buộc; dùng tên đang có, đừng tạo hàm thứ hai.

Sửa `Quoted` trong `schema.ts`:

```ts
  /** Có mặt ⇔ đơn dùng bảng giá nhóm. Server dựng lại bảng từ đây để kiểm nhất quán (BK5). */
  group?: { amount: number; maxPax: number }
```

`buildQuotedPayload` nhận thêm bảng giá và thêm khoá `group` khi `kind === 'group'`. Chỗ kiểm:

```ts
  const bang: PriceTable = input.quoted.group
    ? { kind: 'group', amount: input.quoted.group.amount, maxPax: input.quoted.group.maxPax }
    : { kind: 'flat', perPax: quotedPerPax }
  const q = computeQuote(bang, input.pax)
```

và nhánh `quotedOk` cho đơn nhóm kiểm `amount`/`maxPax` là số nguyên dương thay vì kiểm
`perPax.adult`.

> **BK5 nghĩa hẹp hơn nhiều người tưởng.** Máy chủ kiểm các con số khách gửi lên có **tự nhất
> quán** không — nó **không** kiểm chúng khớp `prices.yaml`, vì BK1 cấm nó đọc `prices.yaml` lúc
> runtime. Đúng giá là việc của nhân viên khi gọi xác nhận. Đây là thiết kế `ADR-0027`, không phải
> lỗ hổng mới.

- [ ] **Bước 5: Sửa `notify/format.ts` cho đơn nhóm**

`paxLines()` đọc `b.quoted.perPax[c]`, mà nhánh group để rỗng → sẽ in dòng cụt. Thêm nhánh riêng
**trước** vòng lặp hiện có:

```ts
// Đơn giá nhóm: quoted.perPax rỗng có chủ ý (ADR-0033 §2), nên không liệt kê theo hạng.
// Nhân viên cần thấy CẢ số khách lẫn số lượt.
function groupLine(b: NewBooking): string | null {
  const l = (b.quoted as any).lines?.[0]
  if (!l || l.unit !== 'luot') return null
  return `Số khách: ${totalGuests(b)} · ${l.count} lượt × ${formatPrice(l.amount, 'vi')}`
}
```

> **Kiểm trước khi viết:** `Quoted` (`schema.ts`) hiện **không** mang `lines`. Nếu đúng vậy thì
> **đừng** thêm `lines` vào `Quoted` — thay vào đó suy số lượt từ dữ liệu đã có:
> `soLuot = quoted.total / <giá một lượt>` không an toàn khi có mùa/ưu đãi. Cách đúng và rẻ:
> `paxLines()` nhận thêm tham số `soLuot` do `formatText` tính từ `totalGuests(b)` và một trường
> `maxPax` **thêm vào `Quoted`** — `Quoted` là bản ghi "vì sao ra con số này", nên `maxPax` thuộc
> về đó. Thêm `maxPax?: number` vào `Quoted` và vào `buildQuotedPayload`, kèm test ở Task 1 style.

- [ ] **Bước 6: Chạy toàn bộ test booking**

```bash
npx vitest run test/booking/
```

- [ ] **Bước 7: Commit**

```bash
git add src/lib/booking/quote.ts src/lib/booking/schema.ts src/lib/booking/notify/format.ts \
        test/booking/quote.test.ts test/booking/notify.test.ts
git commit -m "feat(gia): computeQuote quy so khach ra so luot cho perGroup

5 khach VAN 1 luot; 6 khach thanh 2 luot. perPax de RONG co chu y —
tra mot con so 'moi nguoi' o day la dung lai dung loi da khien tiers bi
loai khoi vai gia nhom."
```

---

## Task 6: Nhãn giá `perGroup` — `resolver.ts` + `uiCopy.ts` (5 ngôn ngữ)

**Tệp:**
- Sửa: `src/lib/resolver.ts` (thêm `case`), `src/lib/uiCopy.ts` (`PRICE_LABEL_TEMPLATES` × 5)
- Test: `src/lib/__tests__/` theo khuôn đang có (chạy bằng `npm --prefix scripts run test`)

**Interfaces:**
- Tiêu thụ: nhánh `perGroup` của `PriceEntry` (Task 4)
- Sản xuất: `PRICE_LABEL_TEMPLATES[lang].perGroup(price: string, maxPax: number): string`

> **Đây là chỗ dễ hỏng nhất về chữ nghĩa của cả đợt.** Nhãn phải nói rõ **giá một lượt**. Một con
> số trần trụi "1.000.000đ" trên trang phao chuối trông y hệt một giá đầu người đắt.

- [ ] **Bước 1: Viết test thất bại**

```ts
test('perGroup: nhãn nói rõ một lượt và số khách tối đa', () => {
  const prices = new Map([['phao-chuoi', { unit: 'perGroup', amount: 1000000, maxPax: 5 }]])
  const v = resolvePrice('phao-chuoi', 'experience', undefined, prices as any, 'vi')
  assert.match(v!.label, /lượt/)
  assert.match(v!.label, /5/)
  assert.equal(v!.offers[0].price, 1000000)
  assert.equal(v!.isFree, false)
})
```

- [ ] **Bước 2: Chạy test, xác nhận ĐỎ**

```bash
npm --prefix scripts run test
```

Kỳ vọng: FAIL — `resolvePrice` rơi vào `default: return null`.

- [ ] **Bước 3: Thêm khuôn chữ vào `uiCopy.ts`, đủ 5 ngôn ngữ**

Thêm vào khai báo kiểu của `PRICE_LABEL_TEMPLATES`:

```ts
  perGroup: (price: string, maxPax: number) => string
```

và vào **cả năm** khối ngôn ngữ:

```ts
  // vi
  perGroup: (p, n) => `${p}/lượt · tối đa ${n} khách`,
  // en
  perGroup: (p, n) => `${p}/ride · up to ${n} guests`,
  // zh
  perGroup: (p, n) => `${p}/次 · 最多 ${n} 人`,
  // ko
  perGroup: (p, n) => `${p}/회 · 최대 ${n}명`,
  // ru
  perGroup: (p, n) => `${p}/заезд · до ${n} гостей`,
```

- [ ] **Bước 4: Thêm `case` vào `resolver.ts`**

Đặt cạnh `case 'perTicket'`:

```ts
    case 'perGroup': {
      return {
        label: tpl.perGroup(formatPrice(entry.amount, lang), entry.maxPax),
        offers: [{ price: entry.amount, priceCurrency: 'VND' }],
        isFree: false,
      }
    }
```

- [ ] **Bước 5: Chạy test, xác nhận XANH**

```bash
npm --prefix scripts run test
```

- [ ] **Bước 6: Commit**

```bash
git add src/lib/resolver.ts src/lib/uiCopy.ts src/lib/__tests__/
git commit -m "feat(gia): nhan gia perGroup — noi ro 'mot luot' va so khach toi da, du 5 ngon ngu

Mot con so tran trui tren trang phao chuoi trong y het mot gia dau nguoi dat."
```

---

## Task 7: `prices-pull.mjs` — đọc `per5pax`, dựng `maxPax`, khai lại `giuNguyen`

**Tệp:**
- Sửa: `scripts/prices-pull.mjs` (`:91`, `:403-418`, `:562-579`, `:646-648`)
- Test: `scripts/validators/__tests__/` — thêm ca vào tệp mới `prices-pull-pergroup.test.ts`

**Interfaces:**
- Tiêu thụ: nhánh `perGroup` của `PriceEntry` (Task 4)
- Sản xuất: `prices.yaml` có khối `perGroup` hợp lệ

> **BA bẫy trong task này, tất cả đều là lỗi im lặng.** Bẫy 1 (bước 2b) làm `npm test` **ghi đè
> `data/prices.yaml`**; bẫy 2 (bước 5) làm giá nhóm **đóng băng** sau khi nghiệm thu xong; bẫy 3
> (bước 8) làm một lệnh "chạy thử" **kéo giá một tour lùi 200.000đ**. Đọc cả ba trước khi gõ dòng
> nào.
>
> **Phát hiện ở vòng rà 2026-09-04** (`docs/evidence/2026-09-04-ra-soat-task7-prices-pull/`) — bản
> đầu của Task 7 dính cả ba.

- [ ] **Bước 1: Viết test thất bại**

Tệp `scripts/validators/__tests__/prices-pull-pergroup.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { docDonVi, DON_VI_TU_SHEET } from '../../prices-pull.mjs'

test('per5pax đọc thành perGroup maxPax 5', () => {
  assert.deepEqual(docDonVi('per5pax'), { unit: 'perGroup', maxPax: 5 })
  assert.deepEqual(docDonVi('per12pax'), { unit: 'perGroup', maxPax: 12 })
})
test('perPax vẫn là perPax', () => {
  assert.deepEqual(docDonVi('perPax'), { unit: 'perPax' })
})
test('đơn vị thật sự lạ → null (gọi bên ngoài sẽ cảnh báo và bỏ qua)', () => {
  assert.equal(docDonVi('perNight'), null)
  assert.equal(docDonVi('per0pax'), null)   // maxPax 0 vô nghĩa
})
test('giuNguyen KHÔNG được nuốt perGroup', () => {
  // perGroup SINH RA TỪ Sheet, nên nó phải nằm TRONG tập "Sheet sinh ra được".
  assert.equal(DON_VI_TU_SHEET.has('perGroup'), true)
  assert.equal(DON_VI_TU_SHEET.has('perPax'), true)
  assert.equal(DON_VI_TU_SHEET.has('perRoomNight'), false)
})
test('mặc-định-an-toàn: đơn vị lạ chưa ai nghĩ ra vẫn được GIỮ NGUYÊN', () => {
  // Đây là tính chất luật cũ (`unit !== perPax`) có mà một danh sách liệt kê sẽ đánh mất.
  assert.equal(DON_VI_TU_SHEET.has('perNight'), false)
})
```

- [ ] **Bước 2: Chạy test, xác nhận ĐỎ — VÀ ĐỎ ĐÚNG LÝ DO**

```bash
npm --prefix scripts run test 2>&1 | grep -A3 'prices-pull-pergroup'
```

Kỳ vọng: đỏ vì **`docDonVi is not a function`** hoặc lỗi import. **Phải grep đúng chuỗi đó.**
Thấy `Thiếu PRICES_SHEET_ID`, thấy lỗi CSV, hoặc thấy tiến trình chết mà **không có kết quả test
nào** → đó là một loại hỏng KHÁC, xem bước 2b. Đừng coi "nó đỏ" là đã xong bước này.

- [ ] **Bước 2b: LỖI CHẶN — `import` tệp này CHẠY nguyên đường đồng bộ giá**

`chay()` được gọi ở **tầng module** (`:872`), không hàng rào. Nên `import '../../prices-pull.mjs'`
từ một tệp test sẽ: đọc `.env`, **gọi Google Sheet thật**, và `renameSync` **đè
`data/prices.yaml`** — từ trong `npm test`. Ba kết cục, kết cục thứ ba là kết cục sau Task 8:

| Khi nào | Chuyện gì xảy ra |
|---|---|
| Hôm nay (Sheet còn 2 lỗi) | `exit(1)` ở `:695` — tiến trình chết **trước khi test nào chạy** |
| Yaml tình cờ khớp Sheet | `return` sớm → tệp test **XANH** sau khi vừa gọi mạng ra Google |
| **Sau Task 8** (Sheet sạch) | **`data/prices.yaml` bị ghi đè từ trong `npm test`** |

Nghiệm thu ở Task 7 **không thể** lộ ra kết cục thứ ba. Đúng loại lỗi nổ sau nghiệm thu.

**Sửa — MỘT thay đổi, ba mẩu, làm cùng lúc:**

```js
// Chỉ chạy đường CLI khi tệp này được gọi thẳng. Import từ test thì chỉ nạp hàm.
const LA_CLI = process.argv[1] != null && resolve(process.argv[1]) === import.meta.filename
```

1. Thêm hằng trên (Node ở repo này là v22, `import.meta.filename` dùng được).
2. **Dời NGUYÊN khối `if (!MA_SHEET) { … process.exit(1) }` từ `:75-80` xuống dòng đầu `chay()`**,
   giữ y từng chữ. Không dời thì máy không có `.env` (CI, clone mới) vẫn `exit(1)` ngay lúc import.
3. Cuối tệp: `if (LA_CLI) { chay().catch((e) => { … }) }` — bọc khối đang có, không đổi thân nó.

> ⚠️ **Đừng làm hàng rào VÀ tách `docDonVi` sang tệp riêng cùng lúc.** Hai chỗ ở cho cùng một hàm
> là nguồn sự thật thứ hai — `CLAUDE.md` §5 cấm thẳng. Tách tệp là phương án hợp lệ *thay cho* hàng
> rào, nhưng nó để nguyên quả mìn "tệp này không import an toàn được" cho người import kế tiếp.

- [ ] **Bước 3: Tách hàm đọc đơn vị và export để test được**

Trong `prices-pull.mjs`, cạnh `DON_VI_BAT_BUOC`:

```js
const DANG_DON_VI_NHOM = /^per(\d+)pax$/

/**
 * Đọc ô `Đơn vị` của Sheet. Trả null nếu site chưa hỗ trợ đơn vị đó.
 * `per5pax` là ký hiệu CHỦ DỰ ÁN TỰ DÙNG trước khi có ai đặc tả (ADR-0033 §3) — giữ nguyên
 * ký hiệu ấy thay vì thêm một cột "Số khách mỗi lượt" vào bảng 13 cột. Chuỗi này không rời
 * khỏi biên Sheet: trong yaml nó thành hai khoá tường minh `unit` + `maxPax`.
 */
export function docDonVi(s) {
  if (s === DON_VI_BAT_BUOC) return { unit: 'perPax' }
  const m = DANG_DON_VI_NHOM.exec(s)
  if (m) {
    const maxPax = parseInt(m[1], 10)
    if (Number.isInteger(maxPax) && maxPax > 0) return { unit: 'perGroup', maxPax }
  }
  return null
}

/**
 * Đơn vị mà Sheet SINH RA ĐƯỢC. Tập ĐÓNG, đối chiếu được với `docDonVi` ngay trên.
 *
 * Vì sao khai theo chiều này chứ không liệt kê "thứ Sheet không chở được": luật cũ
 * `unit !== 'perPax'` bảo vệ được cả những đơn vị CHƯA AI NGHĨ RA. Liệt kê thứ-không-chở-được là
 * một tập MỞ phải nuôi mãi mãi — quên một cái thì dòng đó thành "của Sheet", vắng mặt trong Sheet,
 * và rơi vào đường xoá. Khai theo chiều "Sheet sinh ra được" giữ lại tính chất mặc-định-an-toàn.
 */
export const DON_VI_TU_SHEET = new Set(['perPax', 'perGroup'])
```

- [ ] **Bước 4: Dùng hàm mới ở vòng đọc hàng (`:416`)**

Thay khối `if (donVi !== DON_VI_BAT_BUOC) { loi.push(...) }` bằng:

```js
    const dv = docDonVi(donVi)
    if (!dv) {
      // CẢNH BÁO chứ không chặn: một ô Đơn vị lạ không được kéo 34 dòng vô can cùng chết.
      // `continue` là BẮT BUỘC — mã cũ push vào loi[] mà không continue, hàng lỗi vẫn chạy
      // tiếp xuống dưới và vào `muc`. Bỏ chặn mà quên continue là ghi một dòng đơn vị lạ vào
      // prices.yaml NHƯ THỂ nó là perPax.
      canhBao.push(`Hàng ${soHang} (${khoa}): Đơn vị = "${donVi}" chưa được hỗ trợ — BỎ QUA, dòng này KHÔNG vào prices.yaml.`)
      continue
    }
```

Và ở chỗ dựng `entry` (`:476`):

```js
    const entry = dv.unit === 'perGroup'
      ? { unit: 'perGroup', amount: soTien, maxPax: dv.maxPax }
      : { unit: DON_VI_BAT_BUOC, amount: soTien }
```

> **Hỏi ở vòng rà: "khoá MỚI có đơn vị lạ thì chỉ còn một dòng `⚠` trên stdout — cố ý hay sót?"**
> **Cố ý, và hỏng theo chiều đóng.** Khoá *đã có* trong yaml mà rơi khỏi Sheet thì vẫn vào đường
> xoá và dừng ồn ào như cũ. Khoá *mới* bị bỏ qua thì hậu quả là: entity trỏ vào một khoá không tồn
> tại → `resolvePrice` trả `null` → **trang không mọc form**. Không có tiền sai, chỉ có tính năng
> vắng mặt — nhìn ra được ở kiểm tay Task 12 bước 1. Đổi lại là 34 dòng đúng không chết theo một ô
> sai, đúng `ADR-0033` §4.
>
> **Nhưng phải làm cảnh báo to hơn một dòng lẫn trong stdout:** dòng bỏ qua phải xuất hiện trong
> **khối tổng kết cuối** của `prices:pull` (chỗ script liệt kê những thứ cần chú ý), không chỉ ở
> chỗ nó xảy ra. Người chạy đọc phần cuối, không đọc giữa.

Với `perGroup`, **bốn cột giá theo hạng phải TRỐNG** — giá nhóm không có hạng khách. Ngay sau đó:

```js
    if (dv.unit === 'perGroup' && Object.keys(paxRates).length > 0) {
      loi.push(`Hàng ${soHang} (${khoa}): đơn vị nhóm không nhận giá theo hạng khách — xoá các cột giá trẻ em / người cao tuổi / em bé.`)
      continue
    }
```

- [ ] **Bước 5: Khai lại `giuNguyen` (`:646-648`)**

```js
  // ĐỌC KỸ: định nghĩa cũ là `unit !== 'perPax'`, và nó SAI kể từ khi có perGroup.
  // perGroup sinh ra TỪ Sheet; xếp nó vào "ngoài tầm" là chép nguyên văn nó mãi mãi —
  // chủ dự án sửa giá Phao chuối trong Sheet, chạy pull, KHÔNG CÓ GÌ XẢY RA và KHÔNG AI BÁO.
  // Lỗi này nổ SAU khi đợt này nghiệm thu xong, nên không cổng nào của đợt bắt được.
  const giuNguyen = new Set(
    khoiCu.map((k) => k.khoa).filter((k) => {
      const e = giaCu[k]
      if (!e) return false
      if (!DON_VI_TU_SHEET.has(e.unit)) return true   // Sheet không sinh ra được → giữ nguyên
      return e.unit === 'perPax' && Array.isArray(e.tiers) && e.tiers.length > 0
    })
  )
```

- [ ] **Bước 6: Dựng khối yaml cho `perGroup` (`dungKhoi`, `:562`)**

```js
function dungKhoi(khoa, entry) {
  const dong = [`${khoa}:`, `  unit: ${entry.unit}`, `  amount: ${entry.amount}`]
  // Thứ tự khoá CỐ ĐỊNH — hàm này phải tất định, cùng đầu vào ra cùng byte, kẻo mỗi lần
  // pull đẻ một diff giả và `git diff data/prices.yaml` mất tác dụng làm bước duyệt.
  if (entry.unit === 'perGroup') dong.push(`  maxPax: ${entry.maxPax}`)
  ...
```

- [ ] **Bước 7: Chạy test, xác nhận XANH — và xác nhận test KHÔNG ghi vào nguồn sự thật**

```bash
npm --prefix scripts run test
git diff --quiet data/prices.yaml || echo "✖ TEST VỪA GHI VÀO NGUỒN SỰ THẬT VỀ GIÁ"
```

Dòng thứ hai là thứ **duy nhất** bắt được kết cục thứ ba của bước 2b trước khi nó lọt. Nó phải im.

- [ ] **Bước 8: Đo TẤT ĐỊNH — và trả lại ngay, vì lệnh này GHI THẬT**

> ⚠️ **`--tu-tep` KHÔNG phải chạy khô.** Nó chỉ đổi nguồn đọc; đường ghi (`renameSync`, `:849`)
> vẫn chạy. `--giup` in đúng ba cờ, **không có cờ chạy khô nào**.
>
> ⚠️ **Và CSV hạt giống đã LỆCH so với giá thật:** `docs/gia/mau-nhap-gia.csv:8` ghi
> `tour-hon-tam-tron-goi` là **540.000**, còn `data/prices.yaml:27` là **740.000**. Chạy lệnh dưới
> mà quên bước trả lại là **lặng lẽ kéo giá một tour lùi 200.000đ**, rồi Bước 9 commit nó.

```bash
npm run prices:pull -- --tu-tep docs/gia/mau-nhap-gia.csv > /tmp/lan1.txt 2>&1
cp data/prices.yaml /tmp/lan1.yaml
git checkout -- data/prices.yaml                       # TRẢ LẠI NGAY

npm run prices:pull -- --tu-tep docs/gia/mau-nhap-gia.csv > /tmp/lan2.txt 2>&1
diff /tmp/lan1.yaml data/prices.yaml && echo "✓ tất định"
git checkout -- data/prices.yaml                       # TRẢ LẠI LẦN HAI
git diff --quiet data/prices.yaml && echo "✓ cây sạch, không kéo lùi giá tour nào"
```

> Diff của lần 1 **không phải sự thật về giá** — nó chỉ để đo tính tất định của `dungKhoi()`.
> Đừng đọc nó như một bảng giá, và đừng commit nó.

- [ ] **Bước 9: Commit**

```bash
git add scripts/prices-pull.mjs scripts/validators/__tests__/prices-pull-pergroup.test.ts
git commit -m "feat(gia): prices-pull doc per5pax; khai lai giuNguyen de khong dong bang gia nhom

Hai bay, ca hai deu la loi im lang:
1. thieu `continue` sau khi bo chan -> dong don vi la duoc ghi vao yaml
   NHU THE no la perPax
2. giuNguyen = 'unit !== perPax' -> dong perGroup vua sinh bi danh dau
   ngoai tam Sheet va chep nguyen van MAI MAI; sua gia trong Sheet khong
   con tac dung, khong ai bao, va no NO SAU khi dot nay nghiem thu xong"
```

---

## Task 8: **Việc của chủ dự án** — sửa Sheet, kéo giá, chạy PY

**Tệp:** `data/prices.yaml` (sinh ra, không sửa tay)

**Interfaces:**
- Tiêu thụ: Task 7
- Sản xuất: 8 khoá `TTB` trong `data/prices.yaml`

- [ ] **Bước 1: Chủ dự án sửa ba chỗ trong tab `gia`**

| Hàng | Sửa |
|---|---|
| TTB05 | `Fly-board-nha-trang` → `fly-board-nha-trang` (chữ thường) |
| TTB03 | **giữ nguyên `per5pax`** — nay đã hợp lệ |
| TTB01 | **xoá hàng** `lan-bien-hon-tam` (là khái niệm gom nhóm, không phải sản phẩm) |

- [ ] **Bước 2: Kéo giá**

```bash
npm run prices:pull
```

Kỳ vọng: không lỗi; 8 khoá `TTB` mới nối vào cuối `data/prices.yaml`; `phao-chuoi` có
`unit: perGroup` + `maxPax: 5`.

- [ ] **Bước 3: Duyệt diff BẰNG MẮT**

```bash
git diff data/prices.yaml
```

Kiểm từng con số khớp bảng §3.1 của spec. **Lưu ý: diff này KHÔNG cho biết Studio đang trỏ vào
đâu** — đó là việc của Task 9 và kiểm tay ở Task 12.

- [ ] **Bước 4: Commit**

```bash
git add data/prices.yaml
git commit -m "chore(gia): keo 8 dong gia trai nghiem tu Sheet; phao-chuoi la perGroup"
```

---

## Task 9: **Việc của chủ dự án** — gắn `bookingRef.key` trong Studio, rồi chạy PY4

**Tệp:** không sửa tệp nào trong repo (dữ liệu Sanity).

- [ ] **Bước 1: Mở Studio một lần trước khi gắn**

Studio host riêng — **gộp mã không cập nhật nó**. Xác nhận trường `bookingRef.key` có mặt
(`cms/schemas/experience.ts:76-81`).

- [ ] **Bước 2: Gắn khoá cho 8 document `experience`**

| Document | `bookingRef.key` |
|---|---|
| Snorkeling Nha Trang | `snorkeling-nha-trang` |
| Dù bay (parasailing kéo bằng cano) | `du-bay-parasailing-keo-bang-cano` |
| Motor nước Nha Trang (Jetski) | `motor-nuoc-nha-trang-jetski` |
| Đi bộ dưới đáy biển - Sea Walker | `di-bo-duoi-day-bien-sea-walker` |
| Lặn biển - Scuba diving | `lan-bien-scuba-diving` |
| Fly Board Nha Trang | `fly-board-nha-trang` |
| Phao chuối | `phao-chuoi` |
| Phao bay (Flying Banana Boat) | `phao-chuoi` ← **cùng khoá, cố ý** |

- [ ] **Bước 3: Chạy PY — đường DUY NHẤT để PY4 nhìn thấy 8 khoá mới**

```bash
npm --prefix scripts run validate
```

Kỳ vọng: PY4 **không báo trỏ hụt**. Nếu có dòng mồ côi thì đó là cảnh báo, không chặn.

> ⚠️ **PY4 không nằm trong `npm run gate` và không nằm trong build Cloudflare.** Bước này là lần
> duy nhất nó chạy. Bỏ bước này thì một khoá gõ nhầm **sang một dòng giá có thật** sẽ lọt hết mọi
> cổng và trang trải nghiệm hiện **giá của tour** — `data/prices.yaml` đang có
> `tour-snorkeling-nha-trang` nằm ngay cạnh `snorkeling-nha-trang`.

---

## Task 10: `BookingForm.astro` — hai prop mới, nhãn ô đếm, dòng số lượt

**Tệp:**
- Sửa: `src/components/BookingForm.astro`
- Test: kiểm tay ở Task 12 (component Astro, không có test đơn vị trong repo này)

**Interfaces:**
- Tiêu thụ: `ProductType` (Task 1), `PriceTable` kind `group` (Task 5), `uiCopy` (Task 6)
- Sản xuất: prop `productType?: ProductType`, prop `showPickup?: boolean`

- [ ] **Bước 1: Thêm hai prop**

```ts
export interface Props {
  ...
  /** Quyết định đường quay lại và nhãn tin báo (ADR-0033 §6). */
  productType?: import('../lib/booking/schema').ProductType
  /** Trang Trải nghiệm ẩn ô Điểm đón: khách tự ra bãi, không có đón (ADR-0033 §9). */
  showPickup?: boolean
}
```

Trong destructure: `productType = 'tour', showPickup = true`.

- [ ] **Bước 2: Đưa `productType` vào form, chịu được cả đường không JavaScript**

Thêm ngay cạnh các input ẩn đang có:

```astro
<input type="hidden" name="productType" value={productType} />
```

Và trong script, thêm `productType` vào object payload của nhánh `fetch` — đọc từ chính input ẩn
(`form.productType.value`), **không** nướng lại giá trị vào script, để một nguồn duy nhất.

- [ ] **Bước 3: Ẩn ô Điểm đón khi `showPickup === false`**

Bọc cụm ba dòng `:302-304`:

```astro
{showPickup && (
  <>
    <label class="bf__label" for="bf-pickup">{t('bookingPickup')}</label>
    <input id="bf-pickup" class="bf__input" type="text" name="pickup" maxlength={LIMITS.PICKUP_MAX} />
    <p class="bf__err" data-err="pickup" aria-live="polite"></p>
  </>
)}
```

Trong script, `val('pickup')` phải chịu được ô không tồn tại → trả `''`. Kiểm hàm `val()` hiện có;
nếu nó `document.getElementById(...).value` thẳng thì thêm guard, **không** đổi chữ ký.

- [ ] **Bước 4: Nới điều kiện nhãn ô đếm**

```ts
function paxLabel(code: PaxCode): string {
  // Bảng giá một hạng thì "Người lớn" đứng một mình, không có hạng nào bên cạnh để đối chiếu,
  // đọc lạc nghĩa trên trang jetski hay fly board. Luật neo vào SỐ HẠNG GIÁ, không vào loại
  // trang — nên tour nào sau này chỉ có một hạng cũng hưởng (ADR-0033 §8).
  return (isTiers || codes.length === 1) ? t('paxGuests') : t(PAX_KEY[code])
}
```

`paxGuests` đã có sẵn cả 5 ngôn ngữ — **không thêm chữ mới**.

- [ ] **Bước 5: Hiện SỐ LƯỢT cho bảng giá nhóm**

Thêm khuôn chữ vào `uiCopy.ts` (5 ngôn ngữ), vi:

```ts
  bookingGroupNote: '{n} khách → {m} lượt × {price}',
```

Trong khối tạm tính, khi `priceTable.kind === 'group'`, render dòng này từ `quote.lines[0]`
(`count` là số lượt, `amount` là giá một lượt).

> ⚠️ **Tiền NHẢY BẬC ở mốc `maxPax`.** 5 khách → 1 lượt; 6 khách → 2 lượt, tiền **gấp đôi**. Dòng
> này phải hiện **trước** khi khách bấm gửi, không để họ ngạc nhiên ở bước 2.

- [ ] **Bước 6: Canh `DR-102` — trạng thái mở màn**

`initialQuote` ở frontmatter phải khớp **từng tham số** với markup mở màn: ngày điền sẵn `minDate`,
ô "Chuyển khoản" tick sẵn. Với bảng giá nhóm, `emptyPax()` là 1 người lớn → 1 lượt. Xác nhận số
render ở server và số sau khi script chạy **giống nhau**.

- [ ] **Bước 7: Dựng và kiểm không lỗi biên dịch**

```bash
npm run build
```

- [ ] **Bước 8: Commit**

```bash
git add src/components/BookingForm.astro src/lib/uiCopy.ts
git commit -m "feat(dat-cho): BookingForm nhan productType + showPickup; nhan 'So khach'; hien so luot"
```

---

## Task 11: `ExperienceDetail.astro` — dựng form trên trang Trải nghiệm

**Tệp:**
- Sửa: `src/components/ExperienceDetail.astro`
- Test: kiểm tay ở Task 12

**Interfaces:**
- Tiêu thụ: mọi thứ ở Task 5, 6, 10
- Sản xuất: — (trang cuối cùng)

> Lặp **đúng khuôn** `TourDetail.astro`. Không phát minh nhánh mới. Đã kiểm
> `entity-layout-post.ts:70-74`: cổng bố cục chỉ đòi tệp import `DetailLayout`, mà tệp này đã có —
> **không phải sửa cổng**.

- [ ] **Bước 1: Thêm import và tính bảng giá**

```ts
import BookingForm from './BookingForm.astro'
import { priceTableFromEntry } from '../lib/booking/quote'
import { fetchPriceRules, seasonsForKey } from '../lib/queries/seasons'
```

```ts
const bookingKey = data.bookingRef?.key ?? ''
const priceTable = priceView && !priceView.isFree && bookingKey
  ? priceTableFromEntry(prices.get(bookingKey)) : null
const priceRules = await fetchPriceRules()
const seasons = bookingKey ? seasonsForKey(priceRules.seasons, bookingKey) : []
const showBookingForm = !!priceView?.label && !!priceTable
const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? ''
```

- [ ] **Bước 2: Sửa `sidebarSlots` và thêm `sidebarFlow`**

```ts
    { name: 'booking', component: showBookingForm ? 'BookingForm' : 'BookingCTA',
      visible: showBookingForm || !!priceView?.label || hasContactChannel, props: {} },
```

Truyền vào `DetailLayout`: `sidebarFlow={showBookingForm}`.

> **`sidebarFlow` là bắt buộc, không phải trang trí.** Form cao hơn vùng nhìn ở khổ máy tính, mà
> `position: sticky` chỉ giữ được khối thấp hơn màn hình. Thiếu cờ này thì các ô nhập bước 2 đứng
> ngoài mép, không cách nào cuộn tới — `DR-104`.

- [ ] **Bước 3: Thanh dính neo tới form**

```ts
const stickyHref = showBookingForm ? '#dat-tour' : (zaloHref || null)
const stickyLabel = showBookingForm ? t('bookNow') : (zaloHref ? t('contactZalo') : null)
```

Truyền `ctaHref={stickyHref}` và `ctaLabel={stickyLabel}` thay cho hai dòng hiện tại.

- [ ] **Bước 4: Slot `booking`**

```astro
{showBookingForm && priceTable && (
  <BookingForm
    slot="booking"
    lang={lang}
    tourSlug={data.slug}
    tourTitle={data.title}
    bookingRef={bookingKey}
    priceLabel={priceView!.label}
    priceTable={priceTable}
    seasons={seasons}
    prepayPercent={priceRules.prepayPercent}
    contact={contact}
    turnstileSiteKey={turnstileSiteKey}
    productType="experience"
    showPickup={false}
  />
)}
{!showBookingForm && priceView?.label && <BookingCTA slot="booking" priceText={priceView.label} ctaLabel={t('bookNow')} />}
{!showBookingForm && hasContactChannel && <ContactChannels slot="booking" contact={contact} lang={lang} />}
```

- [ ] **Bước 5: Dựng và chạy cổng**

```bash
npm run build && npm run gate
```

So với `docs/evidence/2026-09-04-dat-cho-trai-nghiem/gate-baseline.txt`. Đỏ **mới** thì dừng và
truy nguyên; đỏ **có sẵn** thì ghi lại, không sửa lan.

- [ ] **Bước 6: Commit**

```bash
git add src/components/ExperienceDetail.astro
git commit -m "feat(dat-cho): trang Trai nghiem dung BookingForm — 8 trang dat duoc"
```

---

## Task 12: Kiểm tay, runbook, và bản vá `06-BINDING_MAP`

**Tệp:**
- Sửa: `BUILD-NOTES.md`
- **Chờ phiếu:** `docs/core-specs/06-BINDING_MAP.md`

- [ ] **Bước 0: Bằng chứng cho BK1–BK5 — bốn dòng này thay chỗ cho câu "đã review"**

```bash
# BK1 — phải trả 0. Đây là cạm bẫy CÓ THẬT của đợt này: thi công backHref bằng cách tra
# loại entity qua resolver.ts/prices.ts thay vì đọc productType trong payload là PHÁ BK1.
grep -rn "lib/prices\|lib/sanity\|lib/resolver" src/pages/api/dat-tour.ts src/lib/booking/
```

- **BK2:** đọc diff, xác nhận không thêm đích ghi nào ngoài cột D1.
- **BK3:** ô "Điểm đón" là PII (`04-CONSTRAINTS:94`); ẩn ô mà vẫn gửi rỗng là **thu ít hơn**.
- **BK4:** không chạm bí mật; mã Google Sheet không vào repo.
- **BK5:** `npm test` — **chạy tay**. Nó KHÔNG nằm trong `npm run gate` và KHÔNG nằm trong
  `.githooks/pre-push` (đã kiểm: cả hai chỉ chạy `run-gates.mjs`).

```bash
npm test && npm --prefix scripts run test
```

- [ ] **Bước 1: Đọc CON SỐ GIÁ trên từng trang**

```bash
for s in snorkeling-nha-trang du-bay-parasailing-keo-bang-cano motor-nuoc-nha-trang-jetski \
         di-bo-duoi-day-bien-sea-walker lan-bien-scuba-diving fly-board-nha-trang \
         phao-chuoi phao-bay-flying-banana-boat; do
  printf "%-40s " "$s"
  grep -o 'id="dat-tour"' "dist/trai-nghiem/$s/index.html" | head -1
  grep -oE '[0-9]{1,3}(\.[0-9]{3})+ ?đ' "dist/trai-nghiem/$s/index.html" | head -1
done
```

Đối chiếu **từng con số** với bảng §3.1 của spec. **Vì PY4 không chạy tự động, đây là cổng duy
nhất** đứng giữa một khoá gõ nhầm và tiền sai trên trang thật.

- [ ] **Bước 2: Kiểm hai trang giá nhóm nói rõ "lượt"**

Hai trang `phao-chuoi` và `phao-bay-flying-banana-boat` phải hiện **giá một lượt kèm số khách tối
đa**, không phải một con số trần trụi dễ đọc nhầm thành giá mỗi người.

- [ ] **Bước 3: Kiểm tiền nhảy bậc — HIT-TEST THẬT**

Mở `/trai-nghiem/phao-chuoi/` trong Chrome ở khổ điện thoại. Gõ 5 khách → **1.000.000đ**. Gõ 6
khách → **2.000.000đ** và form **phải nói rõ "2 lượt"**.

> ⚠️ `element.click()` và listener tự gắn **không** kiểm được tương tác thật — ba lỗi đã lọt vì
> vậy. Dùng `document.elementFromPoint` ở toạ độ thật.

- [ ] **Bước 4: Kiểm ô Điểm đón**

Trang trải nghiệm **không** có ô "Điểm đón"; trang tour **vẫn có**.

- [ ] **Bước 5: Ghi ba bước phát hành vào `BUILD-NOTES.md`**

Theo đúng cách `SPEC-2026-08-30-uu-dai-thanh-toan-truoc.md:232` đã làm cho đợt trước. Để trong
spec thôi là để trong đầu người đọc spec.

- [ ] **Bước 6: Bản vá `06-BINDING_MAP` — XIN PHIẾU, KHÔNG TỰ SỬA**

Bốn chỗ đề xuất nằm ở **spec §5**. `06` là tài liệu luật; `QĐ-2026-09-04-01` ghi rõ *"file luật
chưa sửa, cần một phiếu riêng khi thi hành"*. Trình bản vá cho chủ dự án, **dừng ở đây** cho tới
khi có phiếu.

> ⚠️ `luat1-post.ts:136,257-259` **đọc thẳng** `06` §3.1 và **ném lỗi** nếu không parse được. Sửa
> §3.1 sai hình là **build đỏ**. (`g3` thì không đọc `06` — `DR-027` chỉ đúng với `g3`.)

- [ ] **Bước 7: Commit**

```bash
git add BUILD-NOTES.md
git commit -m "docs(runbook): ba buoc phat hanh cua dot dat cho trai nghiem"
```

---

## Task 13: Phát hành — **thứ tự này KHÔNG được đảo**

- [ ] **Bước 1: Áp migration lên D1 PRODUCTION**

```bash
npx wrangler d1 migrations apply tourdao-booking --remote
```

> ⚠️ **Thiếu `--remote` là áp lên D1 giả lập cục bộ và vẫn in "success"** — người chạy tưởng xong,
> gộp `main`, và thủng đúng cửa sổ 500. Câu lệnh trên chép nguyên từ tiền lệ
> `SPEC-2026-08-30-uu-dai-thanh-toan-truoc.md:276`.

- [ ] **Bước 2: BẰNG CHỨNG cột đã có — "success" không phải bằng chứng**

```bash
npx wrangler d1 execute tourdao-booking --remote --command "PRAGMA table_info(booking)"
```

Phải thấy `product_type`. Không thấy thì **dừng**, đừng đi tiếp.

- [ ] **Bước 3: Dựng bản preview**

```bash
npm run deploy:preview
```

- [ ] **Bước 4: Gửi một đơn thử**

Trên bản preview, gửi một đơn từ `/trai-nghiem/du-bay-parasailing-keo-bang-cano/`. Kiểm: D1 có
dòng `product_type='experience'`; thư SES tiêu đề `[Đặt trải nghiệm]`; trang trả lời không
JavaScript có nút quay lại trỏ đúng `/trai-nghiem/{slug}/` — **không 404**.

> ⚠️ **Đơn này ghi vào D1 PRODUCTION và bắn thư SES THẬT.** `wrangler.toml:16-20` khai đúng một cơ
> sở D1 và `deploy:preview` dùng chung binding đó — **không có cơ sở preview**. Bắt buộc: đặt
> `Họ tên = "TEST — <ngày>"`, dùng số điện thoại nội bộ, **báo trước cho người trực**.

- [ ] **Bước 5: Dọn đơn thử**

```bash
npx wrangler d1 execute tourdao-booking --remote --command "DELETE FROM booking WHERE code='<mã đơn thử>'"
```

Ghi mã đơn đã xoá vào báo cáo QA2. Không dọn thì đơn thử nằm lẫn trong số liệu kinh doanh thật.

- [ ] **Bước 6: Chủ dự án duyệt gộp, rồi gộp `main`**

```bash
git checkout main && git merge --no-ff feat/dat-cho-trai-nghiem
git push origin main
```

Gộp `main` là **auto-deploy, lên thật ngay** (Workers Builds).

- [ ] **Bước 7: Xác minh bản đang chạy đúng là bản vừa dựng**

Dùng agent `deploy-verifier`. "Success" của wrangler **không** có nghĩa asset đã lên; phá cache
khi kiểm HTML.

---

## Nợ tồn sau đợt này — DRI chủ dự án

1. **Hai trang một sản phẩm** (`phao-chuoi` / `phao-bay-flying-banana-boat`) nay **đều nhận đơn
   được**. Đơn về mang hai `tour_slug` cho cùng một hoạt động, thống kê không cộng được. Thôi là
   chuyện thẩm mỹ.
2. **PY1–PY8 vắng mặt khỏi `npm run gate`, pre-push và build Cloudflare** trong khi registry khai
   `live`. Ảnh hưởng **mọi** dòng giá, không riêng đợt này.
3. **Nợ dịch form đặt chỗ:** `paxAdult`, `paxGuests`, `bookingPickup`, `bookingSubtotalNote` ở
   zh/ko/ru là chuỗi tiếng Anh chưa dịch.
4. **Nợ cũ `ADR-0027`:** trang quản trị đơn sau Cloudflare Access; gửi lại khi báo tin hỏng; job
   dọn dữ liệu 24 tháng; sao lưu D1 và thử phục hồi.
