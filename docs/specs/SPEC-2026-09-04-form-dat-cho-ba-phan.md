# SPEC — Form đặt chỗ: gom về ba phần, bỏ Tạm tính và bảng gập

- **Trạng thái:** thiết kế duyệt trong phiên 2026-09-04 (chủ dự án chốt "chọn theo khuyến nghị"
  cho cả hai điểm mở ở §5). Thi hành ngay trong phiên.
- **Ngày soạn:** 2026-09-04   **Người soạn:** Claude (Code)   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa **hai chiều**. Thuần bề mặt: **không** chạm `src/lib/booking/`,
  **không** chạm endpoint, **không** đổi hợp đồng dữ liệu client↔server. Cùng loại với
  `SPEC-2026-08-31-form-dat-tour-gon-va-chi-tiet-gia.md` và nối tiếp nó.
- **Đầu vào đã đọc:** `src/components/BookingForm.astro` (toàn bộ), `src/lib/booking/quote.ts`,
  `src/lib/uiCopy.ts` (khối booking*), `docs/core-specs/KIEN-TRUC-TEMPLATE.md`,
  `SPEC-2026-08-31-form-dat-tour-gon-va-chi-tiet-gia.md` §4.5, `docs/DRIFT_LOG.md` DR-102.
- **Nhánh lúc soạn:** `feat/dat-cho-trai-nghiem`

---

## 1. Mục tiêu

Sau ô ngày, form còn đúng **ba phần**: Số lượng → Phương thức thanh toán → Chi tiết. Phần Chi
tiết là **một thẻ duy nhất, luôn mở**, chỉ nói ba điều: tổng số tiền, ưu đãi, cần thanh toán.
Không in lại số người, không có hai tên cho một con số, không có nút gập.

## 2. Phép đo hiện trạng

> Đo trên production `https://tourdao.vn/tour/tour-3-dao-hon-mun-hon-mun-lang-chai-hon-tam/`,
> cửa sổ 1688×1066, ngày 2026-09-04, chọn 1 người lớn + 1 trẻ em, mở "Xem chi tiết giá",
> bằng `getBoundingClientRect()`.

| Khối | Cao | Nội dung in ra |
|---|---|---|
| `.bf__quote` (Tạm tính) | 131px | Người lớn × 1 808.000₫ · Trẻ em × 1 566.000₫ · Tạm tính ⓘ 1.374.000₫ |
| `.bf__detail` (mở) | 200px | Người lớn × 1 808.000₫ · Trẻ em × 1 566.000₫ · Tạm tính trước ưu đãi 1.445.000₫ · Ưu đãi trả trước (−5%) −71.000₫ · Tổng cộng 1.374.000₫ |

Năm điểm chưa hợp lý, đều đọc được từ bảng trên:

1. **Số người in ba lần**: bộ đếm, khối Tạm tính, bảng Chi tiết.
2. **Một con số hai tên**: "Tạm tính 1.374.000₫" và "Tổng cộng 1.374.000₫" là cùng một số.
3. **"Tạm tính" tự làm yếu chính nó**: số này đi thẳng lên mã QR để khách chuyển tiền, mà gọi là
   "tạm" kèm ⓘ "nhân viên xác nhận trước khi thanh toán".
4. **Hai vỏ cho một ý**: thẻ trắng rồi một dòng gập ngay dưới, cùng nội dung.
5. **Nhân và quả tách nhau**: nút "Chuyển khoản - ưu đãi 5%" ở trên, số tiền giảm nằm trong
   bảng đang gập.

## 3. Thiết kế

### 3.1 Bố cục ba phần

```
[ Ngày khởi hành ]                      ← giữ nguyên
─ Số lượng ────────────────────────     ← giữ nguyên (nhãn vẫn ẩn thị giác, §5.2)
─ Phương thức thanh toán ──────────     ← giữ nguyên
─ Chi tiết ────────────────────────     ← MỘT thẻ trắng, luôn mở
  Tổng số tiền                 1.445.000₫
  Ưu đãi trả trước (−5%)         −71.000₫
  ──────────────────────────────────────
  Cần thanh toán               1.374.000₫
  (ghi chú mùa, chữ mờ, chỉ khi có mùa)
[ Đặt chỗ ngay ]
```

### 3.2 Luật render của thẻ Chi tiết

Mọi con số lấy **nguyên** từ `Quote`, không nhân ở giao diện (kế thừa §4.5.1 spec 31/08):

| Dòng (theo thứ tự trên xuống) | Nguồn | Khi nào hiện |
|---|---|---|
| Tổng số tiền | `quote.prepay.totalGoc` | chỉ khi `quote.prepay` có |
| Ưu đãi trả trước (−p%) | `quote.prepay.totalGoc − quote.total` | chỉ khi `quote.prepay` có |
| Cần thanh toán | `quote.total` | luôn; `quote === null` thì in `—` |
| Ghi chú lượt "{n} khách → {m} lượt × {price}" | `lines[0]` có `unit === 'luot'` | chỉ bảng giá `group`. Không trùng bộ đếm: nó giải thích vì sao tiền nhân đôi ở khách thứ `maxPax + 1`. **Đứng dưới Cần thanh toán**, vì `{price}` là giá lượt **đã áp ưu đãi** (`lines[0].amount`): 2 lượt × 950.000₫ = 1.900.000₫ khớp Cần thanh toán, không khớp Tổng số tiền 2.000.000₫ (đo trên dev 04/09) |
| Ghi chú mùa | `quote.season` | chỉ khi có mùa; dấu `+` chèn có điều kiện |

Đường kẻ trên Cần thanh toán chỉ vẽ khi có dòng phía trên nó; một dòng đứng một mình thì
không kẻ. Nhãn Cần thanh toán ở `--fs-sm`, số ở `--fs-base`: lòng thẻ 240px không chứa nổi nhãn
ở `--fs-base` cạnh số bảy chữ số (đo 249px, vỡ dòng) — xem chú thích trong `<style>`.

Hệ quả: chọn "Thanh toán khi khởi hành", hoặc ưu đãi đang tắt, thẻ chỉ còn dòng **Cần thanh
toán**. Đây là luật render đã có, **không** tính bù bằng nhân ngược.

### 3.3 Gỡ

- `.bf__quote` cùng các dòng "hạng × n", nhãn Tạm tính và dấu ⓘ của nó.
- `<details class="bf__detail">` "Xem chi tiết giá" cùng thân bảng.
- Ba khoá copy không còn ai dùng: `bookingSubtotal`, `bookingSubtotalNote`, `bookingPriceDetail`
  (cả 5 ngôn ngữ, vì `Record<UIKey, string>` ép đủ khoá).
- Thuộc tính `data-subtotal-label` trên `<form>`.

### 3.4 Đổi nhãn

| Khoá | Cũ | Mới (vi) | Mới (en/zh/ko/ru — giữ lệ tiếng Anh sẵn có) |
|---|---|---|---|
| `bookingBeforeDiscount` | Tạm tính trước ưu đãi | **Tổng số tiền** | Total amount |
| `bookingGrandTotal` | Tổng cộng | **Cần thanh toán** | Amount due |

### 3.5 Khối xác nhận sau khi gửi (`showDone`)

- Dòng tổng đang mang nhãn "Tạm tính" đọc từ DOM (`.bf__total-label`) → đổi sang đọc
  `data-grand-total-text` ("Cần thanh toán"). Đây là cách spec 31/08 §4.5.5 đã gợi: đọc từ dữ
  liệu, không từ DOM.
- Các dòng theo hạng khách **giữ** ở đây: lúc này bộ đếm đã ẩn nên không trùng, và đó là biên
  nhận.

### 3.6 Trợ năng

- `aria-live="polite"` + `aria-atomic="true"` đặt trên **đúng dòng Cần thanh toán** (nhãn + số),
  không trên cả thẻ: mỗi lần bấm +/− trình đọc màn hình đọc "Cần thanh toán 1.374.000₫", không đọc
  lại cả bảng (kế thừa §4.5.4 luật 3 spec 31/08).
- Không dùng `hidden` cho phần tử nào mới; các dòng/ghi chú do JS dựng lại bằng
  `replaceChildren()` (né bẫy 1 DR-102), và CSS nhắm qua `:global()` (né bẫy 2 DR-102).

## 4. Không chạm

- `src/lib/booking/quote.ts`, `schema.ts`, `handler.ts`, endpoint, D1, thông báo.
- Các `<input type="hidden" name="quoted.*">` và `buildQuotedPayload` — payload gửi máy chủ
  giữ nguyên từng byte.
- `Sidebar.astro`, `DetailLayout.astro`, `tokens.css` — không cần token mới; mọi giá trị dùng
  token đã có.
- Ô ngày, bộ đếm, hai nút thanh toán, nút Đặt chỗ, khối QR.

## 5. Hai điểm mở đã chốt 2026-09-04

1. **Bỏ hẳn dòng thành tiền từng hạng khách trong form.** Chủ dự án chọn bỏ, đúng bố cục ba
   phần. Khách thấy giá từng hạng ở màn xác nhận sau khi gửi, và "Giá từ …/người" ở thanh dính.
2. **Tên ba phần giữ ẩn thị giác** (quyết định 31/08 giữ nguyên). Thẻ trắng đủ tách phần ba.

## 6. Nghiệm thu

Đo DOM trên dev server bằng JS, ghi kết quả vào báo cáo cuối phiên:

| # | Ca | Phải thấy |
|---|---|---|
| 1 | Tour 3 đảo, mặc định (1 người lớn, chuyển khoản) | thẻ có 3 dòng: Tổng số tiền · Ưu đãi (−5%) · Cần thanh toán; **không** còn chuỗi "× 1", "Tạm tính", "Xem chi tiết giá" trong bước 1 |
| 2 | Đổi sang "Thanh toán khi khởi hành" | thẻ còn 1 dòng Cần thanh toán, số bằng Tổng số tiền ở ca 1 |
| 3 | Trải nghiệm giá nhóm (phao chuối), 6 khách | có dòng "6 khách → 2 lượt × …", Cần thanh toán = 2 × giá lượt |
| 4 | Chiều cao phần Chi tiết | thấp hơn 155px của hiện trạng (131 + 24 dòng gập) |
| 5 | `npm run build`, `npm run gate`, `npm test` | xanh |
| 6 | Khối xác nhận sau gửi | không gửi đơn thật; kiểm bằng đọc mã `showDone` + `astro check`. Ghi rõ là **chưa đo sống** |

## 7. Kết quả nghiệm thu — 2026-09-04

> Đo trên dev server `localhost:4399`, cửa sổ 1688×1066, bằng `getBoundingClientRect()` qua JS.
> Phép đo ở khổ điện thoại **chưa làm**: lệnh đổi cỡ cửa sổ Chrome không ăn (viewport vẫn báo 1688).
> Ở khổ đó cột phụ rộng bằng màn nên thẻ rộng hơn 240px — rủi ro vỡ dòng thấp hơn khổ đã đo, không cao hơn.

| # | Ca | Đo được | Kết quả |
|---|---|---|---|
| 1 | Tour 3 đảo, 1 người lớn, chuyển khoản | Tổng số tiền 850.000₫ · Ưu đãi trả trước (−5%) −42.000₫ · Cần thanh toán 808.000₫. Thẻ **139px**, lớp `bf__sum--co-dong`, kẻ 1px trên dòng tổng. Bước 1 **không** còn "× 1", "Tạm tính", "Xem chi tiết giá" | đạt |
| 2 | Đổi sang "Thanh toán khi khởi hành" | Chỉ còn Cần thanh toán 850.000₫ (= Tổng số tiền ca 1). Thẻ **64px**, không lớp `--co-dong`, không kẻ, không margin | đạt |
| 3 | Phao chuối, 6 khách, chuyển khoản | Tổng số tiền 2.000.000₫ · Ưu đãi −100.000₫ · Cần thanh toán 1.900.000₫ · ghi chú "6 khách → 2 lượt × 950.000₫" **dưới** dòng tổng (2 × 950.000 = 1.900.000). Đổi sang khởi hành: Cần thanh toán 2.000.000₫ · "6 khách → 2 lượt × 1.000.000₫". Thẻ 173px / 97px | đạt |
| 4 | Chiều cao thẻ so với hiện trạng 155px (131 + 24) | 139px ở ca 1; **ổn định 139px** với 1.374.000₫ (1 NL + 1 TE) và với 16.726.000₫ (20 NL + 1 TE, chạm trần). Trước khi hạ nhãn xuống `--fs-sm`, ca 1.374.000₫ đo **171px** vì nhãn gãy hai dòng — đã sửa, xem §3.2 | đạt |
| 5 | `npm test` · `npx astro check` · `npm run build && npm run gate` | 204/204 test xanh · 0 lỗi · build exit 0, gate 47 `[pass]` / 0 `[fail]` | đạt |
| 6 | Khối xác nhận sau gửi | **Chưa đo sống** (không gửi đơn thật). Kiểm bằng đọc mã: `showDone` dùng `grandTotalText` thay cho đọc DOM; `astro check` 0 lỗi; `dist/` trang tour có `bf__sum--co-dong` và "Cần thanh toán" | đạt-với-ghi-chú |

Bằng chứng phụ: `dist/tour/tour-3-dao-hon-mun-hon-mun-lang-chai-hon-tam/index.html` sau build không còn chuỗi
"Tạm tính" hay "Xem chi tiết giá". Server HTML xác nhận Astro **giữ nguyên text node trắng** giữa các thẻ
(`<div class="bf__sum-total" …> <span>`), nên lối `:empty` bị loại là đúng — hai lớp trạng thái là lối tất định.

## 8. Bổ sung 2026-09-05 — chủ dự án chốt sau khi xem trước

Ba yêu cầu, nguyên văn: *"bổ sung lại nút chi tiết giá, thay văn bản 'Cần thanh toán' bằng 'Tổng
tiền', và thay 'Tổng số tiền' thành 'Tạm tính'"*.

### 8.1 Nhãn

| Khoá | 04/09 | **05/09 (vi)** | en/zh/ko/ru |
|---|---|---|---|
| `bookingBeforeDiscount` | Tổng số tiền | **Tạm tính** | Subtotal |
| `bookingGrandTotal` | Cần thanh toán | **Tổng tiền** | Total |
| `bookingPriceDetail` | (đã gỡ) | **Xem chi tiết giá** — khôi phục | Price breakdown |

`bookingSubtotal` và `bookingSubtotalNote` (chữ "Tạm tính" cũ kèm ⓘ) **vẫn gỡ**: "Tạm tính" nay là
nhãn của dòng trước ưu đãi, không phải tên của tổng.

### 8.2 Nút "Xem chi tiết giá" — nằm TRONG thẻ, cuối thẻ

```
  Tạm tính                     1.445.000₫
  Ưu đãi trả trước (−5%)         −71.000₫
  ──────────────────────────────────────
  Tổng tiền                    1.374.000₫
  ▸ Xem chi tiết giá                       ← <details>, mặc định đóng
    Người lớn × 1                 808.000₫
    Trẻ em × 1                    566.000₫
    (ghi chú mùa, chỉ khi có mùa)
```

Thân bảng là **đúng phần không có ở ba dòng trên**: thành tiền từng hạng khách (hoặc dòng lượt
"{n} khách → {m} lượt × {giá}" với bảng giá nhóm) và ghi chú mùa. **Không** lặp Tạm tính / Ưu đãi /
Tổng tiền vào thân — đó là cái trùng lặp đã gỡ 04/09.

Hệ quả cho bảng giá nhóm: ghi chú lượt từng đứng dưới dòng tổng (§3.2) nay **chuyển vào thân
chi tiết** dưới dạng dòng có thành tiền ("6 khách → 2 lượt × 950.000₫ · 1.900.000₫"), không in hai
nơi. Khách muốn biết vì sao tiền nhân đôi thì mở nút — cùng khoảng cách một cú bấm với mọi hạng
khách khác.

Kỹ thuật: `<details>` gốc, đặt trong `.bf__sum` được vì `aria-live` chỉ nằm ở dòng Tổng tiền (§3.6).
`hidden` khi `quote === null` (không mở ra bảng rỗng), liệt kê `.bf__detail[hidden]` theo class —
bẫy 1 DR-102. Lớp `bf__sum--co-ghi-chu` và vùng `.bf__sum-notes` bị gỡ vì không còn gì đứng dưới
dòng tổng ngoài nút.

### 8.3 Cỡ chữ nhãn Tổng tiền trở về `--fs-base`

Lý do hạ xuống `--fs-sm` ở §3.2 là nhãn "Cần thanh toán" dài 136px. "Tổng tiền" đo **84px** ở
`--fs-base`/700; cộng gap 12 và số xấu nhất "30.000.000₫" 112px là **208px < 240px**. Bỏ luật
`.bf__sum-total span`; nhãn và số cùng cỡ như dòng tổng cũ. Đổi nhãn dòng này lần sau phải đo lại.

### 8.4 Nghiệm thu 05/09 (dev 1688×1066, JS đo DOM)

| Ca | Đo được | Kết quả |
|---|---|---|
| Tour 3 đảo, 1 NL, chuyển khoản | Tạm tính 850.000₫ · Ưu đãi −42.000₫ · Tổng tiền 808.000₫ · nút đóng. Thẻ 173px. Mở nút: "Người lớn × 1 808.000₫", thẻ 206px | đạt |
| 1 NL + 1 TE, mở nút | Tạm tính 1.445.000₫ · −71.000₫ · Tổng tiền 1.374.000₫ · thân: Người lớn × 1 808.000₫, Trẻ em × 1 566.000₫. Thẻ 239px | đạt |
| Khởi hành | Chỉ Tổng tiền 850.000₫ + nút. Thẻ 97px, không kẻ | đạt |
| Phao chuối 6 khách | Tạm tính 2.000.000₫ · −100.000₫ · Tổng tiền 1.900.000₫; mở nút: "6 khách → 2 lượt × 950.000₫ 1.900.000₫". Khởi hành: Tổng tiền 2.000.000₫; thân "… × 1.000.000₫ 2.000.000₫" | đạt |
| Chiều cao so với 04/09 | +34px khi đóng (139 → 173) vì thêm dòng nút; so với production 155px (gập) thì cao hơn 18px | ghi nhận |
| `npx astro check` · `npm test` · `npm run build && npm run gate` | 0 lỗi · 204/204 · lần 1 đổ vì Sanity API ngắt kết nối giữa lúc dựng trang (không phải mã), lần 2 build xong, gate 47 `[pass]` / 0 `[fail]` | đạt |

## 9. Bổ sung 2026-09-05 (lần 2) — nhãn "Chi tiết", thân theo giá gốc

Chủ dự án chốt sau khi xem trước §8, nguyên văn: *"Thay 'Xem chi tiết giá' thành 'Chi tiết'. Đồng thời
phần giá người lớn, trẻ em, người cao tuổi ở đây là giá gốc (trước khuyến mại); hiển thị kiểu: 5 x
người lớn …"*.

### 9.1 Ba thay đổi bề mặt

| Chỗ | Trước | Sau |
|---|---|---|
| `bookingPriceDetail` | Xem chi tiết giá | **Chi tiết** (en/zh/ko/ru: Details) |
| Dòng trong thân | "Người lớn × 2 · thành tiền ĐÃ trừ ưu đãi" | **"2 × Người lớn · thành tiền TRƯỚC ưu đãi, đã áp mùa"** |
| Dòng lượt (giá nhóm) | "6 khách → 2 lượt × 950.000₫ · 1.900.000₫" | **"6 khách → 2 lượt × 1.000.000₫ · 2.000.000₫"** |

Hệ quả đọc: các dòng trong thân **cộng lại đúng bằng Tạm tính**; Ưu đãi trừ ở mức tổng; Tổng tiền là
số cuối. Chọn "Thanh toán khi khởi hành" thì thân vẫn là giá gốc và bằng Tổng tiền.

### 9.2 Chạm bộ tính giá — vì sao và chạm đến đâu

`Quote.lines[]` chỉ mang `amount`/`subtotal` **đã trừ ưu đãi**; tổng trước ưu đãi chỉ có ở mức tổng
(`prepay.totalGoc`). Muốn in thành tiền gốc từng dòng mà **không cho giao diện tự nhân** (§3.2 luật 1,
spec 31/08 §4.5.1 luật 1) thì bộ tính giá phải trả sẵn — đúng đường spec 31/08 §4.5.2 đã dự tính
("khi cần mới thêm field vào QuoteLine").

Thêm vào `QuoteLine` ở `src/lib/booking/quote.ts` hai trường **thuần bổ sung**:

| Trường | Nghĩa | Nguồn |
|---|---|---|
| `goc` | đơn giá **trước** ưu đãi, **đã** áp mùa | `apDieuChinh(gốc, mùa, 0)` — cùng hàm đang cộng dồn `totalGoc` |
| `subtotalGoc` | `goc × count` (count = số người, hoặc số lượt với bảng nhóm) | cùng phép, tách theo dòng |

Bất biến: `Σ subtotalGoc === prepay.totalGoc`; không ưu đãi thì `goc === amount`. Cả ba nhánh
`flat` / `tiers` / `group` cùng nhận. **Không đổi** `total`, `perPax`, `season`, `prepay`, `group`;
`buildQuotedPayload` vẫn chỉ lấy bốn khoá cũ nên **payload gửi máy chủ giữ nguyên từng byte**, và
`validateBooking` không đọc `lines`. §4 "Không chạm `src/lib/booking/`" của spec này nay có **một ngoại
lệ được ghi rõ**: `quote.ts`, thuần thêm trường, có test.

Test `test/booking/quote.test.ts`: bốn `toEqual` về hình dạng dòng cập nhật thêm hai trường; thêm
bốn test mới (flat + ưu đãi, mùa + ưu đãi, không ưu đãi, perGroup + ưu đãi). Viết đỏ trước, xanh sau:
8 đỏ → 208/208 xanh.

### 9.3 Biên nhận sau khi gửi soi gương thẻ

`showDone` nay in: từng hạng theo giá gốc → Tạm tính → Ưu đãi → Tổng tiền (không ưu đãi thì vắng hai
dòng giữa), để dòng "2 × Người lớn" không mang hai con số ở hai nơi. Kèm một sửa nhỏ cùng tinh thần
với chốt `tongDaGui`: **chốt luôn `quote` trước `await fetch`** và truyền vào `showDone`, thay vì đọc
lại biến ngoài sau khi máy chủ trả lời.

### 9.4 Nghiệm thu 05/09 lần 2 (dev 1688×1066, JS đo DOM)

| Ca | Đo được | Kết quả |
|---|---|---|
| Tour 3 đảo, 1 NL, nút mở | nhãn nút "Chi tiết"; thân "1 × Người lớn 850.000₫"; Tạm tính 850.000₫ · −42.000₫ · Tổng tiền 808.000₫; thẻ 206px | đạt |
| 2 NL + 1 TE, nút mở | thân "2 × Người lớn 1.700.000₫", "1 × Trẻ em 595.000₫" — cộng 2.295.000₫ **= Tạm tính** 2.295.000₫; Ưu đãi −113.000₫; Tổng tiền 2.182.000₫; thẻ 239px | đạt |
| 2 NL + 1 TE, khởi hành | thân giữ giá gốc, Tổng tiền 2.295.000₫; thẻ 164px | đạt |
| Phao chuối 6 khách, nút mở | thân "6 khách → 2 lượt × 1.000.000₫ 2.000.000₫" = Tạm tính 2.000.000₫; Ưu đãi −100.000₫; Tổng tiền 1.900.000₫; thẻ 231px. Khởi hành: Tổng tiền 2.000.000₫, thẻ 156px | đạt |
| `npx astro check` · `npm test` | 0 lỗi · 208/208 | đạt |
| `npm run build && npm run gate` | build xong, gate 47 `[pass]` / 0 `[fail]`; `dist/` trang tour có nhãn "Chi tiết" và dòng "1 × Người lớn" | đạt |
