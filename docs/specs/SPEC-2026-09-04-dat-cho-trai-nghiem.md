# SPEC — Form đặt chỗ trên trang Trải nghiệm

- **Trạng thái:** **chờ duyệt** — thiết kế chốt trong phiên 2026-09-03/04 qua tám lượt hỏi-đáp
  với chủ dự án; spec này chờ chủ dự án duyệt toàn văn trước khi lập kế hoạch thi công.
- **Ngày soạn:** 2026-09-04   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa **một chiều** ở đúng một chỗ — cột `product_type` thêm vào bảng
  `booking` đang nhận đơn thật (migration `0003`). Phần còn lại là cửa hai chiều.
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
2. Hàng TTB03 Phao chuối, `Đơn vị = per5pax` — script chỉ nhận `perPax` → lỗi ở `:416`.

**Một dòng thừa:** TTB01 `lan-bien-hon-tam` (1.300.000). Chủ dự án xác nhận "Lặn biển Hòn Tằm" là
**một khái niệm gom ba trải nghiệm** (bình khí, sea walking, snorkeling), không phải một sản phẩm
bán riêng. Dòng này bị xoá khỏi Sheet.

## 3. Phạm vi

### 3.1 Trong phạm vi — sáu trang mọc form

| Trang | Khoá giá | Giá |
|---|---|---|
| `/trai-nghiem/snorkeling-nha-trang/` | `snorkeling-nha-trang` | 400.000 |
| `/trai-nghiem/du-bay-parasailing-keo-bang-cano/` | `du-bay-parasailing-keo-bang-cano` | 600.000 |
| `/trai-nghiem/motor-nuoc-nha-trang-jetski/` | `motor-nuoc-nha-trang-jetski` | 800.000 |
| `/trai-nghiem/di-bo-duoi-day-bien-sea-walker/` | `di-bo-duoi-day-bien-sea-walker` | 1.300.000 |
| `/trai-nghiem/lan-bien-scuba-diving/` | `lan-bien-scuba-diving` | 1.300.000 |
| `/trai-nghiem/fly-board-nha-trang/` | `fly-board-nha-trang` | 1.300.000 |

Cả sáu là `perPax` **chỉ có giá người lớn** — không `paxRates`, không `tiers`. `priceTableFromEntry()`
trả `{ kind: 'flat', perPax: { adult } }`, `availablePaxCodes()` trả `['adult']` → form hiện **đúng
một ô đếm**.

### 3.2 Ngoài phạm vi, có chủ ý

- **`phao-chuoi`** — giá nhóm `per5pax`, `prices.yaml` không có đơn vị nào chở được (`ADR-0033` §2).
  Giữ Zalo.
- **`phao-bay-flying-banana-boat`** — chưa có dòng giá trong Sheet. Giữ Zalo.
- **Đơn vị giá nhóm** — không mở đợt này.
- **Ô chọn giờ / khung giờ** — không thêm. Khách dặn giờ qua ô Ghi chú.
- **Đổi tên endpoint** `/api/dat-tour` — giữ nguyên.
- **Gộp hai trang trùng** `phao-chuoi` / `phao-bay-flying-banana-boat` — nợ tồn §8.

## 4. Đặc tả

### 4.1 Việc dữ liệu — chủ dự án làm, ngoài mã

Ba sửa trong tab `gia`:

| # | Hàng | Sửa | Không sửa thì |
|---|---|---|---|
| 1 | TTB05 | `Fly-board-nha-trang` → `fly-board-nha-trang` | `prices:pull` **chặn cứng** |
| 2 | TTB03 | *(giữ nguyên `per5pax`)* — mã sẽ bỏ qua kèm cảnh báo, xem §4.2 | trước §4.2: **chặn cứng** |
| 3 | TTB01 | **xoá hàng** `lan-bien-hon-tam` | PY4 cảnh báo (không chặn build) |

Một việc trong Studio: gắn `bookingRef.key` cho **6 document** `experience` theo bảng §3.1.

> **Đây là công tắc thật.** Mã đúng hết mà chưa gắn khoá thì **không trang nào đổi gì** —
> `showBookingForm` đòi cả `priceView?.label` lẫn `priceTable`.

### 4.2 `scripts/prices-pull.mjs` — bỏ qua dòng đơn vị lạ, không chặn cả lượt

Hôm nay `:416` đẩy một dòng vào `loi[]`, và `loi[]` không rỗng thì dừng toàn bộ — 34 dòng đúng
chết theo một ô sai.

**Đổi:** đơn vị khác `perPax` → đẩy vào `canhBao[]` và `continue` (bỏ qua hàng), **không** vào
`loi[]`. Câu cảnh báo phải nêu **tên khoá, số hàng, đơn vị đọc được**, và nói rõ dòng đó **không**
vào `prices.yaml`.

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
| `src/lib/booking/store.ts` | `NewBooking` thêm `productType`; `BookingRow` thêm `product_type`; `insertBooking` thêm `?19`; `findRecentDuplicate` thêm điều kiện `product_type = ?` |
| `src/lib/booking/handler.ts` | `backHref(slug, productType)` → `/trai-nghiem/${slug}/` khi `'experience'`, `/tour/${slug}/` khi `'tour'`; giữ nguyên fallback `'/'` khi slug sai dạng. `reply()` nhận thêm tham số. Hai câu heading *"Đã nhận yêu cầu đặt tour"* → **"Đã nhận yêu cầu đặt chỗ"**; dòng `Tour: ${v.tourTitle}` (`:126`) → nhãn theo loại |
| `src/lib/booking/notify/format.ts` | `formatSubject` `[Đặt tour]` → `[Đặt tour]` / `[Đặt trải nghiệm]` theo loại; `formatText` dòng `Tour: …` → `Tour: …` / `Trải nghiệm: …`; `paxLines` dùng `Khách` thay `Người lớn` khi đơn chỉ có một hạng, khớp nhãn khách đã thấy trên form |
| `src/lib/booking/schema.ts` (`MSG`) | `tourInvalid` giữ **nguyên khoá** (đổi khoá là đổi hợp đồng lỗi), chỉ sửa chữ: *"Thông tin sản phẩm không hợp lệ, hãy tải lại trang."* |

**Không đổi:** tên endpoint, hình dạng `quoted`, `computeQuote`, Turnstile, honeypot, giới hạn tần
suất, `ipHash`, hai notifier, `payment-qr.ts`.

### 4.6 `migrations/0003_product_type.sql`

```sql
ALTER TABLE booking ADD COLUMN product_type TEXT NOT NULL DEFAULT 'tour';
```

`DEFAULT 'tour'` để mọi đơn đã có được gán đúng loại mà không cần script vá. **Bước
`wrangler d1 migrations apply` phải chạy TRƯỚC lần deploy đầu của đợt này** — quên là mọi đơn mới
lỗi 500. Ghi vào runbook, không để trong đầu ai.

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

> ⚠️ Nhắc lại cảnh báo `DR-027` đã ghi ở đầu `06`: cổng máy `g3` **không đọc** file này mà đối
> chiếu một bản chép tay trong mã validator. Sửa `06` **không** làm đổi thứ máy kiểm. Đừng trích
> `g3` xanh làm bằng chứng bản vá này đã có hiệu lực.

## 6. Nghiệm thu — bằng chứng, không phải lời khẳng định

**Test tự động (bắt buộc, chạy trước khi mở QA2):**

1. `quote.ts` — bảng một hạng: `availablePaxCodes` trả đúng `['adult']`; `computeQuote` với
   `{adult: 3}` ra `amount × 3`; ưu đãi 5% áp đúng và làm tròn lên nghìn.
2. `schema.ts` — `parseBookingPayload` thiếu `productType` → `'tour'`; giá trị lạ → `'tour'`;
   `'experience'` giữ nguyên.
3. `handler.ts` — `backHref` ra `/trai-nghiem/{slug}/` cho `'experience'`, `/tour/{slug}/` cho
   `'tour'`, `'/'` cho slug sai dạng.
4. `store.ts` — đơn `experience` và đơn `tour` **cùng slug, cùng số điện thoại, cùng ngày**
   **không** bị coi là trùng nhau.
5. **Canh `DR-102`:** dựng `initialQuote` ở máy chủ và chạy `computeQuote` với trạng thái mở màn ở
   client cho **cùng một con số**, trên bảng giá một hạng.
6. `prices-pull` — dòng `per5pax` bị bỏ qua **kèm cảnh báo nêu tên khoá**, và 34 dòng còn lại vẫn
   vào `prices.yaml` bình thường.

**Kiểm tay trên bản dựng (không thay được bằng test):**

7. `npm run build && npm run gate` — **build trước, gate sau**, kẻo đỏ ảo.
8. Sáu trang §3.1 có `id="dat-tour"`; hai trang §3.2 **không** có.
9. Trang trải nghiệm **không** hiện ô "Điểm đón"; trang tour **vẫn hiện**.
10. Ô đếm trên trang trải nghiệm ghi **"Số khách"**.
11. **Hit-test thật, không `element.click()`.** Ba lỗi đã lọt vì kiểm bằng `.click()` và listener
    tự gắn (`7ead36f`, `42805c1`). Ô chọn ngày và nút gửi phải đo bằng `document.elementFromPoint`
    ở toạ độ thật, trên khổ điện thoại.
12. Gửi một đơn thật trên bản preview → D1 có dòng `product_type='experience'`; thư SES tiêu đề
    `[Đặt trải nghiệm]`; trang trả lời không JavaScript có nút quay lại trỏ đúng
    `/trai-nghiem/{slug}/` (**không 404**).
13. Sau deploy: `deploy-verifier` xác nhận bản đang chạy đúng là bản vừa dựng.

## 7. Thứ tự thi công

0. **Chụp mốc cổng trước khi sửa gì:** `npm run build && npm run gate` trên nhánh sạch, lưu kết
   quả. Đợt này thêm một vùng mới vào trang có ma trận vùng-theo-field bị máy kiểm canh
   (`06` §3.1, tầng B của `luat1-post`), nên phải phân biệt được cổng đỏ **mới** với cổng đỏ **có
   sẵn**. Rẻ bây giờ, đắt về sau.
1. Migration `0003` + `store.ts` + `schema.ts` + test (2, 4) — **đường ghi trước, giao diện sau**.
2. `handler.ts` + `notify/format.ts` + test (3).
3. `prices-pull.mjs` + test (6). Chủ dự án sửa Sheet (§4.1) → `prices:pull` → duyệt
   `git diff data/prices.yaml`.
4. Chủ dự án gắn `bookingRef.key` trong Studio.
5. `BookingForm.astro` + `ExperienceDetail.astro` + test (1, 5).
6. Kiểm tay (7–12) → QA2 → chủ dự án duyệt gộp.
7. **`wrangler d1 migrations apply` lên D1 production — TRƯỚC khi gộp `main`.**
8. Gộp `main` (auto-deploy, lên thật ngay) → kiểm (13).

> ⚠️ **Bước 7 phải đứng trước bước 8, không được đảo.** Gộp `main` là phát hành thật ngay
> (Workers Builds). Gộp trước rồi mới chạy migration là mở một cửa sổ mà máy chủ đã hỏi cột
> `product_type` trong khi cột chưa tồn tại — **mọi đơn trong cửa sổ đó lỗi 500, cả tour lẫn trải
> nghiệm**, đúng rủi ro §9 hàng 1. Thêm cột là thao tác **bồi**, có `DEFAULT 'tour'`, nên chạy sớm
> **không** ảnh hưởng bản đang chạy: mã cũ không đọc cột đó.
>
> Bước 3 và 4 là **việc của chủ dự án**. Bước 5 chạy trước hai bước đó vẫn build được, chỉ là chưa
> trang nào đổi gì — hữu ích để tách lỗi mã khỏi lỗi dữ liệu.

## 8. Nợ tồn — DRI chủ dự án

1. **Hai trang một sản phẩm:** `phao-chuoi` và `phao-bay-flying-banana-boat` đều đã xuất bản cho
   cùng một hoạt động. Chưa hại form (cả hai giữ Zalo đợt này), nhưng là nội dung trùng.
2. **Giá nhóm** — mở đơn vị hay không. Quyết định mới, không phải mở rộng `ADR-0033`.
3. **Dòng giá cho Phao bay** nếu muốn bán.
4. **Trang gom "Lặn biển Hòn Tằm"** nếu muốn — việc nội dung, không phải việc giá.
5. **Nợ cũ của `ADR-0027` chưa trả** và nay che thêm sáu trang: trang quản trị đơn sau Cloudflare
   Access; gửi lại khi báo tin hỏng; job dọn dữ liệu 24 tháng; sao lưu D1 và thử phục hồi.

## 9. Rủi ro đã biết

| Rủi ro | Vì sao thật | Chặn bằng |
|---|---|---|
| Quên `d1 migrations apply`, **hoặc chạy nó sau khi gộp `main`** | cột thiếu → mọi đơn mới lỗi 500, **cả tour lẫn trải nghiệm**; gộp `main` là phát hành thật ngay nên cửa sổ này mở ra tức thì | §7 bước 7 đứng **trước** bước 8; kiểm (12) |
| `DR-102` số tiền nhảy một nhịp | đã xảy ra thật một lần | test (5) |
| Kiểm bằng `.click()` | đã để lọt **ba** lỗi tương tác | kiểm (11), hit-test thật |
| Sửa `06-BINDING_MAP` rồi tưởng cổng đã canh | `g3` không đọc file đó (`DR-027`) | cảnh báo cuối §5 |
| Gắn nhầm `bookingRef.key` trong Studio | khoá không bắt buộc trùng slug (`DR-097`) — gắn nhầm là **hiện sai giá** | duyệt `git diff data/prices.yaml`; kiểm (8) đối chiếu từng trang với bảng §3.1 |
