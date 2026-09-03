# SPEC — Form đặt chỗ trên trang Trải nghiệm

- **Trạng thái:** **chờ duyệt** — thiết kế chốt trong phiên 2026-09-03/04 qua tám lượt hỏi-đáp
  với chủ dự án; spec này chờ chủ dự án duyệt toàn văn trước khi lập kế hoạch thi công.
- **Ngày soạn:** 2026-09-04   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa **một chiều** ở **hai** chỗ — (1) cột `product_type` thêm vào bảng
  `booking` đang nhận đơn thật (migration `0003`); (2) **đơn vị giá thứ tư `perGroup`** trong lược
  đồ `prices.yaml` (§4.7). Phần còn lại là cửa hai chiều.
- **Sửa trong ngày 2026-09-04:** bản đầu để Phao chuối ngoài phạm vi (giữ Zalo); chủ dự án bác vì
  giữ Zalo nghĩa là khách không đặt được. Xem khung ghi chú cuối §3.2 — **không xoá vết bản cũ**.
- **Bản ghi:** `docs/adr/ADR-0033-dat-cho-cho-trai-nghiem.md` (chờ phê chuẩn). Phiếu
  `QĐ-2026-09-04-01` trong `docs/DECISIONS.md` **chưa viết** — nó được viết khi chủ dự án phê
  chuẩn, không phải bây giờ. Mọi ADR trong repo này đều đi cặp với một phiếu (`ADR-0031` ↔
  `QĐ-2026-08-30-01`); thiếu cặp là thiếu ở QA2, nên ghi ra đây để không phát hiện muộn.
- **Đầu vào đã đọc:** `CLAUDE.md`, `playbook/CONSTITUTION.md`, `ADR-0027`, `ADR-0030`,
  `ADR-0031`, `06-BINDING_MAP` §0 §3 §3.1 §4.8, `04-CONSTRAINTS` §1d, `docs/gia/README.md`,
  `src/components/{TourDetail,ExperienceDetail,BookingForm,DetailLayout}.astro`,
  `src/lib/booking/{quote,schema,store,handler,season}.ts`,
  `src/lib/booking/notify/format.ts`, `src/lib/{resolver,uiCopy,types}.ts`,
  `scripts/validators/{py1-py8,entity-layout-post}.ts`, `scripts/prices-pull.mjs`,
  `data/prices.yaml`, tab `gia` của Google Sheet, dataset Sanity `production` (GROQ).
- **Repo lúc soạn:** nhánh `feat/dat-cho-trai-nghiem` tách từ `main` tại `7ead36f`

---

## 1. Mục tiêu

Khách đang đọc một trang `/trai-nghiem/{slug}` **đặt được ngay tại chỗ** — chọn ngày, số khách,
thấy tạm tính, để lại tên và số điện thoại — bằng **đúng cỗ máy** đang phục vụ 28 trang tour, chứ
không phải một bản chép thứ hai.

## 2. Hiện trạng đo được (2026-09-04)

| Đo | Kết quả |
|---|---|
| Trang `/trai-nghiem/…` đã xuất bản | **8** |
| Trang trải nghiệm có `bookingRef.key` | **0** |
| Dòng giá trong `prices.yaml` gắn vào entity `experience` | **0** |
| Dòng giá `TTB01–TTB08` trong tab `gia` của Sheet | **8** (chủ dự án đã tự nhập) |
| Dòng `TTB` đã chảy vào `prices.yaml` | **0** — `prices:pull` đang bị chặn |

Trang chủ dự án dẫn làm ví dụ, `/trai-nghiem/du-bay-parasailing-keo-bang-cano/`, hiện **không có
giá, không có nút đặt** — chỉ 5 liên kết Zalo (đo bằng `curl`, 2026-09-03).

**Hai lỗi trong Sheet đang chặn cứng `prices:pull`:**

1. Hàng TTB05, `Khoá giá = Fly-board-nha-trang` — chữ **F hoa**. `DANG_KHOA = /^[a-z0-9-]+$/`
   (`prices-pull.mjs:113`) chỉ nhận chữ thường → lỗi ở `:403`.
2. Hàng TTB03 Phao chuối, `Đơn vị = per5pax` — script chỉ nhận `perPax` → lỗi ở `:416`. **Đây không
   phải lỗi gõ**: đó là giá nhóm thật, và §4.7 dạy máy đọc ký hiệu này.

**Một dòng thừa:** TTB01 `lan-bien-hon-tam` (1.300.000). Chủ dự án xác nhận "Lặn biển Hòn Tằm" là
**một khái niệm gom ba trải nghiệm** (bình khí, sea walking, snorkeling), không phải một sản phẩm
bán riêng. Dòng này bị xoá khỏi Sheet.

## 3. Phạm vi

### 3.1 Trong phạm vi — **cả tám trang** mọc form

**Nhóm A — sáu trang `perPax`, một hạng giá** (không cần mở lược đồ gì):

| Trang | Khoá giá | Giá |
|---|---|---|
| `/trai-nghiem/snorkeling-nha-trang/` | `snorkeling-nha-trang` | 400.000 / khách |
| `/trai-nghiem/du-bay-parasailing-keo-bang-cano/` | `du-bay-parasailing-keo-bang-cano` | 600.000 / khách |
| `/trai-nghiem/motor-nuoc-nha-trang-jetski/` | `motor-nuoc-nha-trang-jetski` | 800.000 / khách |
| `/trai-nghiem/di-bo-duoi-day-bien-sea-walker/` | `di-bo-duoi-day-bien-sea-walker` | 1.300.000 / khách |
| `/trai-nghiem/lan-bien-scuba-diving/` | `lan-bien-scuba-diving` | 1.300.000 / khách |
| `/trai-nghiem/fly-board-nha-trang/` | `fly-board-nha-trang` | 1.300.000 / khách |

`priceTableFromEntry()` trả `{ kind: 'flat', perPax: { adult } }`, `availablePaxCodes()` trả
`['adult']` → form hiện **đúng một ô đếm**, nhãn "Số khách".

**Nhóm B — hai trang, MỘT sản phẩm, giá nhóm** (cần đơn vị `perGroup` mới, §4.7):

| Trang | Khoá giá | Giá |
|---|---|---|
| `/trai-nghiem/phao-chuoi/` | `phao-chuoi` | 1.000.000 / lượt, tối đa 5 khách |
| `/trai-nghiem/phao-bay-flying-banana-boat/` | `phao-chuoi` *(cùng khoá)* | 1.000.000 / lượt, tối đa 5 khách |

Chủ dự án xác nhận 2026-09-04 hai trang này là **cùng một hoạt động**. Không có luật nào cấm hai
entity dùng chung một khoá giá (đã kiểm PY3/PY4/PY6), nên trước mắt cả hai trỏ `phao-chuoi`.

> ⚠️ **Hệ quả phải nói ra:** hai URL bán cùng một thứ nay **đều nhận đơn được**. Đơn về sẽ mang hai
> `tour_slug` khác nhau cho cùng một hoạt động, thống kê không cộng được, và khách đặt ở trang nào
> cũng đúng nên không ai phát hiện. Nợ trùng trang (§8 mục 1) vì vậy **nặng thêm** — nó thôi là
> chuyện thẩm mỹ. Không chặn đợt này, nhưng chủ dự án nên gộp sớm.

### 3.2 Ngoài phạm vi, có chủ ý

- **Ô chọn giờ / khung giờ** — không thêm. Khách dặn giờ qua ô Ghi chú.
- **Đổi tên endpoint** `/api/dat-tour` — giữ nguyên.
- **Gộp hai trang trùng** `phao-chuoi` / `phao-bay-flying-banana-boat` — nợ tồn §8 mục 1.
- **Sửa việc PY1–PY8 vắng mặt khỏi `npm run gate`** — nợ tồn §8 mục 6.
- **Giá sàn cộng phụ thu theo đầu người** — chủ dự án xác nhận không phải cách bán của mình.

> **Đổi phạm vi trong ngày 2026-09-04.** Bản đầu của spec này để `phao-chuoi` và
> `phao-bay-flying-banana-boat` **ngoài** phạm vi, giữ Zalo, theo quyết định 2 bản đầu của
> `ADR-0033`. Chủ dự án bác: *"nếu giữ Zalo thì khách không đặt được, nên phải cho phép đặt giống
> như toàn dịch vụ khác."* Đợt này vì vậy **to hơn bản đầu** — thêm §4.7. Ghi lại để người đọc sau
> hiểu vì sao một spec "mở form cho trang có sẵn" lại đụng tới lược đồ giá.

## 4. Đặc tả

### 4.1 Việc dữ liệu — chủ dự án làm, ngoài mã

Ba sửa trong tab `gia`:

| # | Hàng | Sửa | Không sửa thì |
|---|---|---|---|
| 1 | TTB05 | `Fly-board-nha-trang` → `fly-board-nha-trang` | `prices:pull` **chặn cứng** |
| 2 | TTB03 | **giữ nguyên `per5pax`** — nay là ký hiệu hợp lệ, máy đọc thành `perGroup` (§4.7) | trước §4.7: **chặn cứng** |
| 3 | TTB01 | **xoá hàng** `lan-bien-hon-tam` | dòng mồ côi **im lặng hoàn toàn** — xem §4.1b |

### 4.1b PY4 **không chạy** trên đường tự động nào — sự thật phải biết trước khi tin vào cổng

Phát hiện của bản duyệt 2026-09-04, đã tự kiểm lại từng mắt xích:

```
py1-py8.ts:318   PY4 khai level fail
  ← chỉ scripts/validate-constraints.ts:9,88 nạp PY_VALIDATORS
    ← chỉ scripts/package.json:6  "validate"
      ← chỉ package.json:12       "build:strict"
```

Mà: `npm run gate` = `astro check && npm --prefix scripts run gate:all` = `run-gates.mjs post spec`,
và danh sách ở `run-gates.mjs:33-58` gồm 9 validator `post` + 3 meta — **không có `py1-py8`**.
`.githooks/pre-push` chạy đúng `npm run gate`. Cloudflare chạy `build:ci` = `npm run build` =
`astro check && astro build` — **không validator nào**. Trong khi `control-registry.yaml:348-355`
khai PY4 `status: live`.

**Ba hệ quả cho đợt này, không được đọc lướt:**

1. Dòng giá mồ côi **không cảnh báo ở đâu cả** — mã cảnh báo có (`py1-py8.ts:148`) nhưng không ai gọi.
2. **Gắn nhầm `bookingRef.key` trong Studio là lọt hết mọi cổng.** Hai kiểu nhầm, kiểu thứ hai mới
   đáng sợ: trỏ **hụt** → trang im lặng không mọc form (nhìn ra được); trỏ **nhầm sang một dòng có
   thật** → `data/prices.yaml:121` đã có `tour-snorkeling-nha-trang` nằm cạnh khoá mới
   `snorkeling-nha-trang`, gắn nhầm thì **mọi cổng xanh** và trang trải nghiệm hiện **giá của tour**.
   Tiền sai, chạy thật, không ai báo. **"Duyệt `git diff data/prices.yaml`" không bắt được** — diff
   không cho biết Studio đang trỏ vào đâu.
3. Vì vậy kiểm (8) ở §6 là **thứ duy nhất** đứng giữa một khoá gõ nhầm và tiền sai trên trang thật.

**Sửa rẻ nhất:** §7 thêm một bước chạy `npm --prefix scripts run validate` sau khi chủ dự án gắn
khoá. Đó là cách duy nhất để PY4 thật sự nhìn thấy sáu khoá mới. Sửa việc PY4 vắng mặt khỏi
`npm run gate` là **nợ riêng, không phải việc của đợt này** — đụng vào đó là mở phạm vi.

Một việc trong Studio: gắn `bookingRef.key` cho **8 document** `experience` theo hai bảng §3.1 —
lưu ý hai document Phao chuối / Phao bay **cùng trỏ một khoá `phao-chuoi`**.

> **Đây là công tắc thật.** Mã đúng hết mà chưa gắn khoá thì **không trang nào đổi gì** —
> `showBookingForm` đòi cả `priceView?.label` lẫn `priceTable`.

### 4.2 `scripts/prices-pull.mjs` — bỏ qua dòng đơn vị **thật sự lạ**, không chặn cả lượt

> **Đọc §4.7 trước.** Sau §4.7, `per5pax` **không còn là đơn vị lạ** — nó được đọc thành `perGroup`.
> Mục này nói về đơn vị nào đó *khác nữa* mà site chưa hỗ trợ, ví dụ ai đó gõ `perNight`.

Hôm nay `:416` đẩy một dòng vào `loi[]`, và `loi[]` không rỗng thì dừng toàn bộ — 34 dòng đúng
chết theo một ô sai.

**Đổi:** đơn vị khác `perPax` → đẩy vào `canhBao[]` và `continue` (bỏ qua hàng), **không** vào
`loi[]`. Câu cảnh báo phải nêu **tên khoá, số hàng, đơn vị đọc được**, và nói rõ dòng đó **không**
vào `prices.yaml`.

> **`continue` là phần bắt buộc, không phải chi tiết.** Mã hôm nay (`:416-418`) đẩy vào `loi[]` mà
> **không** `continue` — hàng lỗi vẫn chạy tiếp xuống dưới và vào `muc`. Hôm nay điều đó vô hại vì
> `loi[]` không rỗng thì dừng cả lượt; bỏ chặn mà quên `continue` là biến một dòng đơn vị lạ thành
> một dòng **được ghi vào `prices.yaml` như thể nó là `perPax`**. Đúng loại lỗi im lặng tệ nhất.

**Không đổi:** khoá sai dạng (`:403`) **vẫn chặn cứng** — đó là lỗi gõ, không phải một hình giá
site chưa hỗ trợ. Hai thứ này khác nhau, đừng gộp.

**Hệ quả phải kiểm:** dòng bị bỏ qua mà **đã có** trong `prices.yaml` từ trước sẽ rơi vào cổng xoá
khoá. Cả `phao-chuoi` lẫn `lan-bien-hon-tam` đều **chưa từng** ở trong `prices.yaml`, nên đợt này
không chạm cổng đó — nhưng test phải khoá hành vi này lại cho lần sau.

### 4.3 `src/components/ExperienceDetail.astro`

Lặp đúng khuôn `TourDetail.astro`, **không phát minh nhánh mới**:

```
+ import BookingForm from './BookingForm.astro'
+ import { priceTableFromEntry } from '../lib/booking/quote'
+ import { fetchPriceRules, seasonsForKey } from '../lib/queries/seasons'

  const bookingKey = data.bookingRef?.key ?? ''
  const priceTable = priceView && !priceView.isFree && bookingKey
    ? priceTableFromEntry(prices.get(bookingKey)) : null
  const priceRules = await fetchPriceRules()
  const seasons = bookingKey ? seasonsForKey(priceRules.seasons, bookingKey) : []
  const showBookingForm = !!priceView?.label && !!priceTable
  const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? ''
```

Bốn chỗ sửa tiếp trong cùng tệp:

1. **`sidebarSlots`** — `component: showBookingForm ? 'BookingForm' : 'BookingCTA'`, và `visible`
   thêm `showBookingForm ||` ở đầu. Đúng khuôn `TourDetail.astro:135`.
2. **`sidebarFlow={showBookingForm}`** truyền vào `DetailLayout`. **Bắt buộc**, không phải trang
   trí: form cao hơn vùng nhìn ở khổ máy tính, mà `position: sticky` chỉ giữ được khối thấp hơn
   màn hình. Thiếu cờ này thì các ô nhập bước 2 đứng ngoài mép, không cuộn tới được — `DR-104`.
3. **Thanh dính** — `ctaHref={showBookingForm ? '#dat-tour' : (zaloHref || null)}`,
   `ctaLabel` theo cùng điều kiện (`t('bookNow')` / `t('contactZalo')`).
4. **Slot `booking`** — `<BookingForm slot="booking" … productType="experience" />` khi
   `showBookingForm`; các nhánh `BookingCTA` / `ContactChannels` hiện có chuyển thành
   `{!showBookingForm && …}`.

**Không đụng** `DetailLayout.astro`, `Sidebar.astro`, hay `scripts/validators/entity-layout-post.ts`
— đã kiểm `:71`, cổng bố cục chỉ đòi tệp import `DetailLayout`, mà `ExperienceDetail` đã import sẵn.

### 4.4 `src/components/BookingForm.astro` — hai prop mới

```
  productType?: 'tour' | 'experience'   // mặc định 'tour'
  showPickup?: boolean                  // mặc định true
```

- **`showPickup={false}`** ẩn cả cụm `<label>` + `<input name="pickup">` + `<p data-err="pickup">`.
  Trường `pickup` trong payload và D1 **giữ nguyên**, gửi chuỗi rỗng. Không đụng `schema.ts`.
- **`productType`** đi vào một `<input type="hidden" name="productType">` để đơn không JavaScript
  cũng mang được, và vào `payload` của nhánh `fetch`.
- **Nhãn ô đếm** — nới điều kiện đang có:

  ```
  - return isTiers ? t('paxGuests') : t(PAX_KEY[code])
  + return (isTiers || codes.length === 1) ? t('paxGuests') : t(PAX_KEY[code])
  ```

  `paxGuests` đã có sẵn cả 5 ngôn ngữ (`uiCopy.ts:76,289,490,…`) — **không thêm chữ mới**. Luật neo
  vào *số hạng giá*, không vào loại trang, nên tour một hạng cũng hưởng.

> ⚠️ **`DR-102` — cạm bẫy tiền thật.** `initialQuote` dựng ở máy chủ phải khớp **từng tham số** với
> trạng thái mở màn của markup (ngày điền sẵn `minDate`, ô "Chuyển khoản" tick sẵn), vì `update()`
> chạy lại `computeQuote` ngay khi script khởi động. Lệch một tham số là **số tiền nhảy một nhịp**
> ngay khi trang tải xong. Hai prop trên không đụng vào phép tính, nhưng test §6 phải canh.

### 4.5 `productType` xuyên suốt đường ghi

| Tệp | Sửa |
|---|---|
| `src/lib/booking/schema.ts` | `BookingInput` thêm `productType: ProductType`; `parseBookingPayload` đọc, **mặc định `'tour'`** khi thiếu hoặc lạ (đơn cũ, client cũ còn cache); không thêm thông điệp lỗi mới |
| `src/lib/booking/store.ts` | `NewBooking` thêm `productType`; `BookingRow` thêm `product_type`; `insertBooking` thêm `?19`. **`findRecentDuplicate` KHÔNG đổi** — xem ghi chú dưới |
| `src/lib/booking/handler.ts` | `backHref(slug, productType)` → `/trai-nghiem/${slug}/` khi `'experience'`, `/tour/${slug}/` khi `'tour'`; giữ nguyên fallback `'/'` khi slug sai dạng. `reply()` nhận thêm tham số. Hai câu heading *"Đã nhận yêu cầu đặt tour"* → **"Đã nhận yêu cầu đặt chỗ"**; dòng `Tour: ${v.tourTitle}` (`:126`) → nhãn theo loại |
| `src/lib/booking/notify/format.ts` | `formatSubject` `[Đặt tour]` → `[Đặt tour]` / `[Đặt trải nghiệm]` theo loại; `formatText` dòng `Tour: …` → `Tour: …` / `Trải nghiệm: …`; `paxLines` dùng `Khách` thay `Người lớn` khi đơn chỉ có một hạng, khớp nhãn khách đã thấy trên form |
| `src/lib/booking/schema.ts` (`MSG`) | `tourInvalid` giữ **nguyên khoá** (đổi khoá là đổi hợp đồng lỗi), chỉ sửa chữ: *"Thông tin sản phẩm không hợp lệ, hãy tải lại trang."* |

**Không đổi:** tên endpoint, hình dạng `quoted`, `computeQuote`, Turnstile, honeypot, giới hạn tần
suất, `ipHash`, hai notifier, `payment-qr.ts`.

> **Vì sao `findRecentDuplicate` để nguyên** (sửa theo bản duyệt 2026-09-04). Bản đầu của spec này
> thêm `product_type = ?` vào mệnh đề `WHERE`. Đó là **nới cửa chống trùng** đã đặc tả ở
> `SPEC-2026-08-21-dat-tour.md:224` — một sửa đổi có thật, mà spec mới không khai ra là đang sửa.
> Và đợt này **không cần**: cửa chống trùng khoá theo `(phone, slug, departDate)`, nên nó chỉ nhầm
> khi hai loại trang có slug trùng nhau. Đo 2026-09-04 trên `dist/`: **không slug tour nào trùng
> sáu slug trải nghiệm** (gần nhất là `tour-snorkeling-nha-trang` ≠ `snorkeling-nha-trang`). Thêm
> điều kiện bây giờ là trả giá bằng một sửa đổi âm thầm cho một tình huống chưa tồn tại. Khi nào
> có slug trùng thật thì đó là một sửa đổi **có tên**, viết vào spec của đợt đó.

### 4.6 `migrations/0003_product_type.sql`

```sql
ALTER TABLE booking ADD COLUMN product_type TEXT NOT NULL DEFAULT 'tour';
```

`DEFAULT 'tour'` để mọi đơn đã có được gán đúng loại mà không cần script vá. **Bước
`wrangler d1 migrations apply` phải chạy TRƯỚC lần deploy đầu của đợt này** — quên là mọi đơn mới
lỗi 500. Ghi vào runbook, không để trong đầu ai.

### 4.7 Đơn vị giá `perGroup` — cửa một chiều thứ hai của đợt

**Hình dạng trong `prices.yaml`:**

```yaml
phao-chuoi:
  unit: perGroup
  amount: 1000000     # giá MỘT LƯỢT
  maxPax: 5           # số khách tối đa một lượt
```

**Phép tính** (`quote.ts`, dùng chung client/server theo BK5):

```
soLuot = Math.ceil(soKhach / maxPax)
total  = apDieuChinh(amount, mua%, uuDai%) × soLuot
```

Khách **đếm người**, máy quy ra lượt. 3 khách → 1 lượt → 1.000.000. 8 khách → 2 lượt → 2.000.000.

**Bảy tệp phải sửa cùng nhau. Sót một là lệch:**

| Tệp | Sửa | Bẫy |
|---|---|---|
| `scripts/validators/py1-py8.ts` | PY1 `VALID_UNITS` thêm `perGroup`; PY2 đòi `amount` + `maxPax`; PY7 kiểm cả hai là **số nguyên dương**; `ALLOWED_TOP_KEYS.perGroup = {unit, amount, maxPax}` | `maxPax` ≤ 0 phải **fail**, không phải warn — chia cho 0 là `Infinity` lượt |
| `src/lib/types.ts` **và** `scripts/lib/price-loader.ts` | thêm nhánh `{ unit: 'perGroup'; amount: number; maxPax: number }` vào `PriceEntry`, và `perGroup` vào `PriceUnit` | **hai bản chép tay của cùng một kiểu** — `ADR-0027` §Hệ quả đã ghi rõ lệch là lỗi. Sửa cùng lúc, cùng commit |
| `src/lib/resolver.ts` + `src/lib/uiCopy.ts` | `case 'perGroup'` → nhãn mới `perGroupFrom`, **5 ngôn ngữ** | Nhãn **phải nói rõ "một lượt"**. Viết "từ 1.000.000đ" trống không là khách đọc thành giá mỗi người. Gợi ý vi: `1.000.000đ/lượt (tối đa {n} khách)` |
| `src/lib/booking/quote.ts` | `PriceTable` thêm `{ kind: 'group'; amount; maxPax }`; `priceTableFromEntry` nhận `unit === 'perGroup'`; `computeQuote` nhánh mới; `availablePaxCodes` trả `['adult']` | **`perPax` trong `Quote` phải để RỖNG** (`{}`) cho nhánh group. Trả một con số "mỗi người" là dựng lại đúng lỗi đã loại `tiers` vì nó (`ADR-0033` §2). `QuoteLine` cho group mô tả **lượt**, không mô tả hạng khách |
| `src/components/BookingForm.astro` | ô đếm vẫn đếm **người**; dòng tạm tính hiện **số lượt**: `3 khách → 1 lượt × 1.000.000đ` | Tổng **nhảy bậc** khi qua mốc (5 → 6 khách là 1 → 2 lượt, tiền gấp đôi). Phải hiện số lượt **trước** khi khách bấm gửi, không để họ ngạc nhiên. Và `initialQuote` phải khớp trạng thái mở màn — `DR-102` |
| `src/lib/booking/notify/format.ts` | đơn group ghi `Số khách: 3 · 1 lượt × 1.000.000đ` thay vì liệt kê theo hạng | `paxLines()` đọc `quoted.perPax[c]`, mà group để rỗng → nhánh riêng, đừng để nó in dòng cụt |
| `scripts/prices-pull.mjs` | đọc `^per(\d+)pax$` → `perGroup`; `dungKhoi()` dựng thêm `maxPax`; **`giuNguyen` khai lại** | xem hai ô dưới |

**Hai bẫy trong `prices-pull.mjs`, cả hai đều là lỗi im lặng:**

1. **`giuNguyen` (`:646-648`)** hiện khai "ngoài tầm Sheet" = `unit !== 'perPax'`. Để nguyên thì
   dòng `perGroup` vừa sinh ra bị đánh dấu ngoài tầm ở **lần pull kế tiếp** và **chép nguyên văn
   mãi mãi** — chủ dự án sửa giá trong Sheet, chạy pull, **không có gì xảy ra, không ai báo**. Và
   nó nổ **sau** khi đợt này đã nghiệm thu xong, nên không cổng nào của đợt này bắt được.
   **Khai lại:** ngoài tầm Sheet = `perRoomNight` ∪ `perTicket` ∪ (`perPax` có `tiers[]`).
2. **`dungKhoi()` (`:562-579`)** chỉ biết dựng `unit`/`amount`/`paxRates`. Thêm `maxPax` nhưng
   **giữ thứ tự khoá cố định** — hàm này phải tất định, cùng đầu vào ra cùng byte, kẻo mỗi lần pull
   đẻ một diff giả.

**Giới hạn:** `LIMITS.TOTAL_MAX = 30` khách → tối đa 6 lượt. Không thêm giới hạn mới.

**Mùa và ưu đãi 5%:** áp lên **giá một lượt** rồi mới nhân số lượt, đúng thứ tự trong công thức
trên. Chủ dự án xác nhận ưu đãi áp bình thường cho hoạt động trải nghiệm.

## 5. Bản vá đề xuất cho `06-BINDING_MAP` — **không tự sửa, chờ phiếu**

`06-BINDING_MAP` là tài liệu luật; spec này chỉ **đề xuất**.

1. **§3, hàng "Vùng giá cộng CTA đặt"** — câu *"Tour: khối hành động là `BookingForm` (ADR-0027,
   §4.8)"* → *"Tour và Trải nghiệm: khối hành động là `BookingForm` (`ADR-0027`, `ADR-0033`; §4.8,
   §4.4)"*.
2. **§3, hàng "Khối hành động (sidebar)"** — *"Tour thêm đơn vị vận hành, giấy phép và form"* →
   tách rõ: form áp cho **Tour và Trải nghiệm**; đơn vị vận hành và giấy phép vẫn **chỉ Tour**.
3. **§4.4 (Trải nghiệm)** — thêm một hàng, đối xứng với hàng "Form đặt tour" ở §4.8:

   | Vùng giao diện | Dữ liệu nuôi | Bắt buộc? | Khi rỗng thì hiện gì | Ghi chú |
   |---|---|---|---|---|
   | Form đặt chỗ | `prices.yaml` qua `bookingRef` (`amount`); `siteSettings.contact`; `title`, `slug` | chỉ khi có giá | không giá → không form, giữ `ContactChannels` | `BookingForm`, thay `BookingCTA`; **ô "Điểm đón" ẩn** (`ADR-0033` §7); nhãn ô đếm "Số khách" khi bảng giá một hạng; gửi tới `/api/dat-tour` với `productType=experience` |

4. **§3.1, dòng 130 — ô `giá (bookingRef)` cột "Trải nghiệm"**: khai thêm vùng khối hành động cho
   khớp ba mục trên. Ma trận §3.1 là thứ **máy đọc thật** (xem cảnh báo dưới), nên bỏ sót ô này là
   để đặc tả lệch khỏi thứ đang bị canh.

> ⚠️ **Cảnh báo này bản đầu viết SAI, đã sửa theo bản duyệt 2026-09-04.** Bản đầu viết *"sửa `06`
> không làm đổi thứ máy kiểm"* — quá rộng và **sai**. Sự thật hẹp hơn: `DR-027` chỉ đúng với **`g3`**,
> cổng đối chiếu một bản chép tay trong mã. Nhưng **`luat1-post.ts` đọc thẳng file này**:
> `:136` trỏ tới `docs/core-specs/06-BINDING_MAP.md`, `:257-259` parse ma trận **§3.1** và **ném lỗi**
> nếu không đọc được, và `luat1-post` nằm trong nhóm `post` của `run-gates.mjs:33-46` nên chạy thật
> trong `npm run gate` và pre-push.
>
> Đọc đúng là: **`g3` không đọc `06`; `luat1-post` đọc `06` §3.1 và CHỈ §3.1.** Ba sửa ở §3 và §4.4
> không có máy nào canh; sửa thứ tư ở §3.1 thì có. Để nguyên câu cũ là dựng lên đúng **lỗi ngược**
> của `DR-027` — lần này là tưởng máy không canh trong khi nó có canh.

> **Ghi thêm, không phải việc phải làm đợt này:** `BookingForm.astro` **không phát một
> `data-region`/`data-field` nào** (quét `src/components/*.astro`: chỉ `BookingCTA.astro:15` có
> `data-region="action-block" data-field="gia"`). Nên trang nào đổi `BookingCTA` → `BookingForm` thì
> field `gia` **biến mất khỏi tầm nhìn của Luật 1** ở khối hành động. Trang Tour đã như vậy từ
> `ADR-0027`; đợt này nhân thêm sáu trang. Không làm đỏ cổng nào — `luat1-post:400-427` chỉ phán khi
> một field render **quá nhiều vùng** hoặc **sai vùng**, không bao giờ phán vùng đã khai mà không
> render — nhưng là một khoảng mù đang lớn dần, nên ghi ra.

## 6. Nghiệm thu — bằng chứng, không phải lời khẳng định

**Test tự động (bắt buộc, chạy trước khi mở QA2):**

1. `quote.ts` — bảng một hạng: `availablePaxCodes` trả đúng `['adult']`; `computeQuote` với
   `{adult: 3}` ra `amount × 3`; ưu đãi 5% áp đúng và làm tròn lên nghìn.
2. `schema.ts` — `parseBookingPayload` thiếu `productType` → `'tour'`; giá trị lạ → `'tour'`;
   `'experience'` giữ nguyên.
3. `handler.ts` — `backHref` ra `/trai-nghiem/{slug}/` cho `'experience'`, `/tour/{slug}/` cho
   `'tour'`, `'/'` cho slug sai dạng.
4. `store.ts` — `insertBooking` ghi đúng `product_type`, và `findRecentDuplicate` **giữ nguyên hành
   vi cũ** (khoá theo `phone` + `tour_slug` + `departDate`, không xét loại sản phẩm) — canh để lần
   sau không ai âm thầm nới cửa chống trùng đã đặc tả ở `SPEC-2026-08-21-dat-tour.md:224`.
4b. **`perGroup` — nhóm test riêng, đây là chỗ dễ sai tiền nhất:**
   `computeQuote` với `maxPax=5`: 1 khách → 1 lượt → 1.000.000; 5 khách → **vẫn** 1 lượt →
   1.000.000; 6 khách → 2 lượt → 2.000.000; 30 khách → 6 lượt. `quoted.perPax` phải **RỖNG**
   (canh để không ai lén trả một con số "mỗi người" bịa ra). Ưu đãi 5% và mùa áp lên **giá một
   lượt** rồi mới nhân — khoá thứ tự này lại. `maxPax` ≤ 0 phải bị PY7 chặn.
4c. `prices-pull` — `per5pax` đọc ra `{unit:'perGroup', amount, maxPax:5}`; `dungKhoi` dựng lại
   đúng byte cũ khi chạy hai lần; và **`giuNguyen` KHÔNG được nuốt khoá `perGroup`** — đổi giá
   trong Sheet phải chảy vào `prices.yaml` (canh đúng cái bẫy §4.7).
5. **Canh `DR-102`:** dựng `initialQuote` ở máy chủ và chạy `computeQuote` với trạng thái mở màn ở
   client cho **cùng một con số**, trên bảng giá một hạng.
6. `prices-pull` — dòng `per5pax` bị bỏ qua **kèm cảnh báo nêu tên khoá**, và 34 dòng còn lại vẫn
   vào `prices.yaml` bình thường.

**Kiểm tay trên bản dựng (không thay được bằng test):**

7. `npm run build && npm run gate` — **build trước, gate sau**, kẻo đỏ ảo.
8. **Đọc CON SỐ GIÁ trên từng trang trong sáu trang, đối chiếu cột "Giá" của bảng §3.1** — không
   phải chỉ kiểm "có `id="dat-tour"`". Vì PY4 không chạy (§4.1b), đây là **cổng duy nhất** bắt được
   một `bookingRef.key` gắn nhầm sang dòng giá có thật. Kèm: sáu trang §3.1 có `id="dat-tour"`; hai
   trang §3.2 **không** có.
9. Trang trải nghiệm **không** hiện ô "Điểm đón"; trang tour **vẫn hiện**.
10. Ô đếm trên trang trải nghiệm ghi **"Số khách"**.
11. **Hit-test thật, không `element.click()`.** Ba lỗi đã lọt vì kiểm bằng `.click()` và listener
    tự gắn (`7ead36f`, `42805c1`). Ô chọn ngày và nút gửi phải đo bằng `document.elementFromPoint`
    ở toạ độ thật, trên khổ điện thoại.
12. Gửi một đơn thử → D1 có dòng `product_type='experience'`; thư SES tiêu đề `[Đặt trải nghiệm]`;
    trang trả lời không JavaScript có nút quay lại trỏ đúng `/trai-nghiem/{slug}/` (**không 404**).

    > ⚠️ **Đơn này ghi vào D1 PRODUCTION và bắn thư SES THẬT.** `wrangler.toml:16-20` khai đúng một
    > cơ sở D1 và `deploy:preview` dùng chung binding đó — **không có cơ sở preview**. Quy tắc bắt
    > buộc: đặt `Họ tên = "TEST — <ngày>"` và số điện thoại nội bộ để nhân viên nhận thư biết ngay
    > đây là đơn thử; báo trước cho người trực; sau khi kiểm xong **xoá theo `code`**
    > (`wrangler d1 execute tourdao-booking --remote --command "DELETE FROM booking WHERE code='<mã>'"`)
    > và ghi lại mã đơn đã xoá vào báo cáo QA2. Không có bước dọn thì đơn thử nằm lẫn trong số liệu
    > kinh doanh thật.
13. Sau deploy: `deploy-verifier` xác nhận bản đang chạy đúng là bản vừa dựng.

## 7. Thứ tự thi công

0. **Chụp mốc cổng trước khi sửa gì:** `npm run build && npm run gate` trên nhánh sạch, lưu kết
   quả. Đợt này thêm một vùng mới vào trang có ma trận vùng-theo-field bị máy kiểm canh
   (`06` §3.1, tầng B của `luat1-post`), nên phải phân biệt được cổng đỏ **mới** với cổng đỏ **có
   sẵn**. Rẻ bây giờ, đắt về sau.
1. Migration `0003` + `store.ts` + `schema.ts` + test (2, 4) — **đường ghi trước, giao diện sau**.
1b. **`perGroup` (§4.7) — bảy tệp, làm TRONG MỘT commit**: `py1-py8.ts`, `types.ts` **và**
   `price-loader.ts` (hai bản chép tay), `resolver.ts` + `uiCopy.ts`, `quote.ts`,
   `notify/format.ts`, `prices-pull.mjs`. Test (4b, 4c). Tách commit là mở cửa cho hai bản kiểu
   lệch nhau — đúng thứ `ADR-0027` đã cảnh báo.
2. `handler.ts` + `notify/format.ts` + test (3).
3. `prices-pull.mjs` + test (6). Chủ dự án sửa Sheet (§4.1) → `prices:pull` → duyệt
   `git diff data/prices.yaml`.
4. Chủ dự án gắn `bookingRef.key` trong Studio. *(Studio host riêng — gộp mã **không** cập nhật nó;
   mở xem một lần trước bước này.)*
5. **`npm --prefix scripts run validate`** — cách **duy nhất** để PY4 nhìn thấy sáu khoá mới (§4.1b).
6. `BookingForm.astro` + `ExperienceDetail.astro` + test (1, 5); kiểm tay (7–11) → QA2 → chủ dự án
   duyệt gộp.
7. **`npx wrangler d1 migrations apply tourdao-booking --remote`** — lên D1 **production**.
8. **Bằng chứng cột đã có, trước khi đi tiếp:**
   `npx wrangler d1 execute tourdao-booking --remote --command "PRAGMA table_info(booking)"` phải
   thấy `product_type`.
9. `npm run deploy:preview` (`wrangler versions upload`) → **kiểm (12)** trên bản preview.
10. Gộp `main` (auto-deploy, lên thật ngay) → kiểm (13).

> ⚠️ **Ba điều ở đây từng sai trong bản trước, đừng rút gọn lại.**
>
> **(a) `--remote` là bắt buộc, và tên cơ sở cũng vậy.** Thiếu `--remote`, wrangler áp migration lên
> **D1 giả lập cục bộ** và vẫn in "success"; người chạy tưởng xong, gộp `main`, và thủng đúng cửa sổ
> vừa đóng. Tiền lệ của chính dự án viết đúng ở `SPEC-2026-08-30-uu-dai-thanh-toan-truoc.md:276` —
> chép nguyên, đừng viết lại từ trí nhớ. Bước 8 tồn tại vì "success" **không phải** bằng chứng.
>
> **(b) Kiểm (12) chạy ở bước 9, không phải bước 6.** Hai lý do: cột chỉ có sau bước 7; và
> `wrangler.toml:16-20` khai **đúng một** D1 (`BOOKING_DB` → `tourdao-booking`), `deploy:preview` là
> `wrangler versions upload` **cùng Worker, cùng binding** — **không có cơ sở preview**. Nghĩa là
> kiểm (12) ghi một dòng **thật** vào bảng `booking` production và bắn thư SES **thật**. Đó là đánh
> đổi chấp nhận được, nhưng phải biết mình đang làm gì: xem quy tắc đánh dấu và dọn ở §6 kiểm (12).
>
> **(c) Vì sao bước 7 chạy sớm được mà không hỏng bản đang chạy:** thêm cột là thao tác **bồi**, có
> `DEFAULT 'tour'`, và `store.ts:31-33` của bản đang chạy **liệt kê cột theo tên** nên không đọc cột
> mới. Đây cũng là lý do **lùi Worker sau bước 10 vẫn an toàn** — mã cũ không biết cột đó tồn tại.
>
> Bước 3 và 4 là **việc của chủ dự án**. Bước 6 chạy trước hai bước đó vẫn build được, chỉ là chưa
> trang nào đổi gì — hữu ích để tách lỗi mã khỏi lỗi dữ liệu.
>
> **Runbook:** ba bước 7–9 phải vào `BUILD-NOTES.md` như `SPEC-2026-08-30:232` đã làm cho đợt trước.
> Để trong spec thôi là để trong đầu người đọc spec.

## 8. Nợ tồn — DRI chủ dự án

1. **Hai trang một sản phẩm:** `phao-chuoi` và `phao-bay-flying-banana-boat` đều đã xuất bản cho
   cùng một hoạt động. Chưa hại form (cả hai giữ Zalo đợt này), nhưng là nội dung trùng.
2. **Giá nhóm** — mở đơn vị hay không. Quyết định mới, không phải mở rộng `ADR-0033`.
3. **Dòng giá cho Phao bay** nếu muốn bán.
4. **Trang gom "Lặn biển Hòn Tằm"** nếu muốn — việc nội dung, không phải việc giá.
5. **Nợ cũ của `ADR-0027` chưa trả** và nay che thêm sáu trang: trang quản trị đơn sau Cloudflare
   Access; gửi lại khi báo tin hỏng; job dọn dữ liệu 24 tháng; sao lưu D1 và thử phục hồi.
6. **PY1–PY8 vắng mặt khỏi `npm run gate`, pre-push và build Cloudflare** trong khi
   `control-registry.yaml:348-355` khai `status: live` (§4.1b). Đây là **nợ riêng, không phải việc
   của đợt này** — sửa nó là mở phạm vi. Nhưng nó phải được ghi ra: bất kỳ ai trích một dòng cổng
   xanh làm bằng chứng về giá đều đang trích một cổng **không chạy**.
7. **Nợ dịch của form đặt chỗ:** `paxAdult`, `paxGuests`, `bookingPickup`, `bookingSubtotalNote`
   ở zh/ko/ru đang là chuỗi tiếng Anh chưa dịch (`uiCopy.ts:486-490,687-691,888-892`), trong khi
   `bookingPayTransfer` thì dịch đủ. Nợ có sẵn từ trước; đợt này chỉ **chạm vào** nhóm thủng đó,
   không làm nó rộng thêm.

## 9. Rủi ro đã biết

| Rủi ro | Vì sao thật | Chặn bằng |
|---|---|---|
| Quên `d1 migrations apply`, **hoặc chạy nó sau khi gộp `main`** | cột thiếu → mọi đơn mới lỗi 500, **cả tour lẫn trải nghiệm**; gộp `main` là phát hành thật ngay nên cửa sổ này mở ra tức thì | §7 bước 7 đứng **trước** bước 8; kiểm (12) |
| `DR-102` số tiền nhảy một nhịp | đã xảy ra thật một lần | test (5) |
| Kiểm bằng `.click()` | đã để lọt **ba** lỗi tương tác | kiểm (11), hit-test thật |
| Sửa `06-BINDING_MAP` rồi tưởng cổng đã canh | `g3` không đọc file đó (`DR-027`) | cảnh báo cuối §5 |
| Gắn nhầm `bookingRef.key` trong Studio | khoá không bắt buộc trùng slug (`DR-097`) — gắn nhầm sang **một dòng có thật** thì mọi cổng xanh mà trang hiện **giá của tour** (`prices.yaml:121` có `tour-snorkeling-nha-trang` cạnh `snorkeling-nha-trang`). **Máy duy nhất bắt được là PY4, mà PY4 không chạy** (§4.1b). `git diff data/prices.yaml` **không** bắt được — diff không cho biết Studio trỏ vào đâu | §7 bước 5 (`scripts run validate`) là lần duy nhất PY4 nhìn thấy khoá mới; **kiểm (8) đọc con số giá thật trên từng trang** là cổng cuối |
| Chạy `d1 migrations apply` **thiếu `--remote`** | wrangler áp lên D1 giả lập cục bộ và vẫn in "success" → tưởng xong, gộp `main`, thủng đúng cửa sổ 500 vừa đóng | §7 bước 7 chép nguyên lệnh từ `SPEC-2026-08-30:276`; bước 8 đòi `PRAGMA table_info` làm bằng chứng |
| `giuNguyen` nuốt khoá `perGroup` | sau đợt này, chủ dự án sửa giá Phao chuối trong Sheet → `prices:pull` chép nguyên văn dòng cũ, **không ai báo**. Nổ SAU nghiệm thu nên không cổng nào của đợt này bắt | §4.7 bẫy 1 + test (4c) |
| Hai bản chép tay `PriceEntry` lệch nhau | `src/lib/types.ts` và `scripts/lib/price-loader.ts` là hai tệp riêng cùng khai một kiểu; `ADR-0027` đã ghi lệch là lỗi | §7 bước 1b buộc sửa cùng một commit |
| Khách đọc giá `perGroup` thành giá mỗi người | 1.000.000 trần trụi trên trang phao chuối trông y hệt một giá đầu người đắt | nhãn `perGroupFrom` phải mang chữ "lượt" + số khách tối đa; kiểm (8) và (8b) |
| Đơn thử của kiểm (12) nằm lẫn trong số liệu thật | không có D1 preview; đơn thử ghi thẳng production | quy tắc đánh dấu + xoá theo `code` ở §6 kiểm (12) |
