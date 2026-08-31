# SPEC — Form đặt tour: gọn lại, nền xám, và bảng chi tiết giá

- **Trạng thái:** thiết kế duyệt trong phiên 2026-08-31 (chủ dự án duyệt cả ba mảnh cùng lượt,
  sau hai vòng chỉnh: (a) ghi chú thu thành dấu (i), (b) bỏ giá trùng trong form, thêm nền xám).
  Chưa thi hành.
- **Ngày soạn:** 2026-08-31   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa **hai chiều**. Thuần bề mặt: **không** chạm `src/lib/booking/`,
  **không** chạm endpoint, **không** đổi hợp đồng dữ liệu client↔server.
- **Đầu vào đã đọc:** `src/components/BookingForm.astro` (toàn bộ 808 dòng),
  `src/lib/booking/quote.ts`, `schema.ts` (`buildQuotedPayload`, `parseBookingPayload`,
  `validateBooking`), `handler.ts`, `src/components/DetailLayout.astro` (`sticky-bar`),
  `src/components/Sidebar.astro`, `src/styles/tokens.css`, `docs/DRIFT_LOG.md` DR-102 · DR-104 ·
  DR-105, `docs/adr/ADR-0030`, `ADR-0031`, `SPEC-2026-08-21-dat-tour.md` §7.
- **Repo lúc soạn:** `main` tại `4118209`
- **Anh em cùng đợt:** `SPEC-2026-08-31-hero-entity-cao-them-50px.md`,
  `SPEC-2026-08-31-trang-danh-sach-cong-ty.md`. Ba mảnh **gần độc lập**: không chia sẻ file, nhưng §4.2 của mảnh form bị ràng buộc bởi
  quyết định Luật 3 của mảnh hero — chủ dự án đã chốt **lối A** ngày 31/08, nên ràng buộc này đã gỡ.
  Thứ tự đúng: `QĐ-2026-08-31-03` → mảnh công ty → mảnh form → mảnh hero.

---

## 1. Mục tiêu

Form đặt tour **gọn nhẹ mà vẫn đầy đủ thông tin**, có **nền xám nhẹ**, hiển thị **break-down giá
chi tiết**, và **không lặp lại giá** đã hiện ở thanh dính.

## 2. Phép đo hiện trạng

> **Đo trên production `https://tourdao.vn/tour/tour-3-dao-hon-mun-hon-mun-lang-chai-hon-tam/`,
> cửa sổ 1710×985, ngày 2026-08-31, bằng `getBoundingClientRect()` trong JS.**
> Mọi con số dưới đây phải đọc kèm khổ màn và ngày. DR-105: một con số chép lại mà không kèm
> phép đo sẽ thành số rác ở lần đọc sau.

### 2.1 Chiều cao

| Khối | px |
|---|---|
| **Toàn form `.bf`** | **1237** |
| `[data-step="1"]` | 1132 |
| `[data-step="2"]` (đang đóng) | 0 |
| `.bf__head` (dải "Giá từ" + giá) | **88** |
| Bốn hàng bộ đếm | **459** |
| — Người lớn (không ghi chú) | 75 |
| — Trẻ em / Cao tuổi / Em bé (mỗi hàng) | 128 |
| Khối chọn thanh toán `.bf__pay` + nhãn | **96** |
| Khối `.bf__quote` (Tạm tính) | 106 |

**Vùng nhìn dùng được** = 985 − 69 (`header`, `position: sticky`) − 57 (thanh dính: `--sticky-bar-h` 56px + viền dưới 1px) =
**859px**. Form **vượt 378px**.

Cột phải là `sidebar sidebar--flow`, `position: static` — **bản vá DR-104 còn nguyên**. Form cuộn
theo trang, không có lớp dính nào đè lên nó. Vấn đề còn lại là chiều cao nội tại, không phải cơ
chế dính.

### 2.2 Chi phí từng dòng ghi chú

| Ghi chú | Cao |
|---|---|
| `.bf__pax-note` (khoảng tuổi) × 3 hàng | 50 × 3 = **150** |
| `.bf__note` dưới ô ngày ("Chọn ngày từ 01/09/2026 đến 29/11/2026") | **25** |
| `.bf__note` dưới Tạm tính ("Giá tạm tính theo bảng giá công bố; nhân viên…") | **50** |
| **Tổng** | **225** |

Cấu trúc một hàng bộ đếm: `.bf__pax-name` 32px + `.bf__pax-note` 50px + `.bf__pax-price` 25px
= `.bf__pax-info` 112px, cộng đệm 16px = **128px**. Hàng không ghi chú = 75px.

> DR-104 đã ghi: ghi chú tuổi và hạng "Em bé" là **thay đổi dữ liệu** (biên tập điền qua Google
> Sheet ngày 29–30/08), không phải thay đổi mã. Nên thiết kế phải **ổn định chiều cao khi chữ
> ghi chú dài ra** — đó chính là lý do luật (i) ở §4.1 đúng chứ không chỉ là gọn mắt.

### 2.3 Giá hiển thị hai lần — xác nhận

Quét toàn trang tìm chuỗi `850.000₫/người` trên các node lá:

| Vị trí | y (toạ độ tài liệu) | Trạng thái |
|---|---|---|
| `.sticky-bar__price` (DetailLayout) | 736 | **luôn thấy** — trong thanh dính |
| `.bf__price` (trong `.bf__head`) | 1151 | cuộn theo trang, trôi khỏi màn |

Đúng hai chỗ, không hơn.

### 2.4 Nền hiện tại

| Phần tử | Nền |
|---|---|
| `.bf` | **trong suốt** |
| `.sidebar-card` (cha) | `#FFFFFF` = `--c-card`, đệm 16px |
| `.bf__quote` | `#EAF2F8` = **`--c-surface-alt`** |
| `.bf__input`, `.bf__btn` | `#FFFFFF` = `--c-card` |
| `.bf__btn:hover` | **`--c-surface-alt`** |

Token khoảng cách: `--s1` 4px, `--s2` 8px, `--s3` 12px, `--s4` 16px, `--s5` 24px.

## 3. Hướng đã thử và BỎ — không ai được làm lại

DR-104 ghi rõ: hướng "ghim cụm Tạm tính + nút Đặt tour vào chân dính đáy" **đã thử và bỏ**. Nó
chữa đúng triệu chứng trên máy tính nhưng hỏng hai chỗ, cả hai đo được: (1) trên 390×844 chân
cao 255px nuốt **4 trên 5 ô nhập** của bước 2, và giá hiện **hai lần cùng lúc**; (2) trên máy
tính nó làm lộ nghịch lý *nút gửi hiện suốt trang trong khi ô bắt buộc điền thì không thấy đâu*.

**Bài học ràng buộc spec này: mọi thứ thêm vào phải giảm chiều cao NỘI TẠI, không được chồng
thêm một lớp dính nữa.**

## 4. Thiết kế

### 4.1 Luật (i) — mọi ghi chú rời khỏi dòng riêng

Không ghi chú nào chiếm một dòng chữ nữa. Mỗi ghi chú thu thành một dấu **(i)** đặt cạnh nhãn
của nó, mở ra khi bấm.

Áp cho cả ba nhóm ở §2.2: khoảng tuổi từng hạng khách, khoảng ngày khởi hành, và dòng chú thích
về giá tạm tính. **−225px.**

#### Cơ chế: `<details>`/`<summary>` gốc — **chủ dự án chốt 2026-08-31**

Dấu (i) là `<summary>` của một `<details>`, **không phải** `<button>` + JS.

```html
<details class="bf__note-tip">
  <summary class="bf__note-tip-mark" aria-label="Xem ghi chú"><!-- ⓘ --></summary>
  <p class="bf__note-tip-body" id="bf-date-range">Chọn ngày từ 01/09/2026 đến 29/11/2026</p>
</details>
```

Bốn thứ có được, không cái nào là tình cờ:

1. **Chạy khi tắt JS.** `BookingForm.astro:62-64` có chú thích nguyên văn *"Server dựng sẵn một
   bản để không JS vẫn đọc được phạm vi"*. Một nút `<button>` + JS sẽ **phá** điều khoản đó:
   khách không JS mất hẳn khoảng ngày hợp lệ của ô bắt buộc duy nhất ở bước 1. `<details>` mở
   được không cần JS.
2. **Né hẳn bẫy 1 của DR-102.** Không dùng `hidden` thì không có chuyện CSS scoped 0,2,0 đè
   `[hidden]` 0,1,0.
3. **Trợ năng gốc**: bàn phím, trình đọc màn hình, trạng thái đóng/mở — trình duyệt lo.
4. **Một cơ chế cho cả form**: §4.5 cũng dùng `<details>` cho bảng chi tiết giá.

**Ba ràng buộc bắt buộc:**

- **`aria-describedby` của ô ngày KHÔNG được đổi.** `#bf-date-range` hiện là description của
  `#bf-date`. Giữ `id` trên node chứa chữ, và giữ `aria-describedby="bf-date-range"` trên ô nhập.
  Đặt mô tả lên `<summary>` là ô ngày mất mô tả.
- **`<summary>` sau khi tạo dáng phải giữ vòng tiêu điểm nhìn thấy được**, và bỏ
  `list-style`/marker mặc định cho đúng hình dấu ⓘ.
- **Hộp của dấu ⓘ không được làm hàng cao lên.** Glyph hiện **24×24**; vùng chạm 44px (đúng lệ
  `--tap` 2.75rem của `.bf__btn`, `.bf__pay-opt`) dựng bằng pseudo-element hoặc padding âm,
  **không** ăn vào chiều cao dòng. Bỏ qua điều này là −150px của ghi chú tuổi bị ăn lại.

Không dùng `title=` — không tới được bằng bàn phím, không hiện trên di động; đó là biến ghi chú
thành *mất* chứ không phải *thu gọn*.

**Diễn giải đã chốt với chủ dự án:** "giá" trong yêu cầu *"ẩn tất cả ghi chú (khoảng ngày tháng,
tuổi, giá…)"* nghĩa là **dòng chú thích về giá** (50px ở §2.2), **không phải** đơn giá từng hạng
khách (`.bf__pax-price`, 25px mỗi hàng). Đơn giá là thông tin quyết định mua — **giữ hiện**.
Chủ dự án có quyền đổi ý; giấu nốt được thêm ~100px.

### 4.2 Bỏ trọn `.bf__head` — **−88px**

Xoá khối "Giá từ + giá" khỏi form. Giá vẫn ở `.sticky-bar__price` — thanh **dính**, nên khi đã
cuộn tới nó thì nó ở lại; trong khi giá trong form trôi mất hẳn. Bỏ bản kém hơn, không phải mất
thông tin.

> ⚠ **Sửa một câu của bản nháp đầu.** Bản đầu viết thanh dính *"luôn trên màn hình"*. Sau khi
> chủ dự án chọn **lối A** (`QĐ-2026-08-31-03`), câu đó **sai**: ở viewport 1366 thanh dính nằm ở
> **≈718px** so với mốc màn đầu **657px**, tức **không** trên màn đầu. Nó dính *sau khi* khách
> cuộn tới, không phải hiện sẵn. Đây chính là đánh đổi mà lối A chấp nhận công khai — spec không
> được mô tả nó êm hơn thực tế.

Đã kiểm khổ nhỏ: `@media (max-width: 767px)` trong `DetailLayout.astro` chỉ ẩn
`.sticky-bar__jump`; **`.sticky-bar__price` vẫn hiện**. Không có khổ nào mất giá vì thay đổi này.

Sàn an toàn còn lại nếu thanh dính vắng vì lý do nào đó: **`.bf__pax-price`** (§4.1 giữ) — xem
nghiệm thu 9.

#### ⚠ Sàn ấy KHÔNG tồn tại với bảng giá dạng bậc (`tiers`)

Đã đọc `BookingForm.astro:45–52`:

```ts
function paxAmountLabel(code: PaxCode): string {
  if (priceTable.kind === 'flat') { … }
  return ''          // ← kind === 'tiers'
}
```

Markup là `{paxAmountLabel(code) && <span class="bf__pax-price">…}`, nên với bảng giá `tiers`
thì **không hàng nào có `.bf__pax-price`**. Bỏ `bf__head` trên một tour giá bậc là form
**không còn số tiền nào** cho tới khi khách bấm tăng số người — và bề mặt giá duy nhất còn lại
là thanh dính, đúng bề mặt mà Luật 3 nói đang nằm ngoài màn đầu ở 1366.

**Hôm nay chưa xảy ra — đã đo.** `data/prices.yaml`: **0** lần xuất hiện `tiers` hoặc `maxPax`
trên **29** khoá; mọi mục đều dùng `paxRates` (tức `kind: 'flat'`). Nên sàn `.bf__pax-price` đang
đứng vững trên toàn bộ tour có form.

**Đây là rủi ro ngủ, phải ghi thành luật chứ không để trong đầu ai:** ngày đầu tiên có một tour
khai giá dạng bậc là ngày form đó mất hết giá. Hai lối, quyết khi việc đó tới — **không** làm
trước ở đợt này:

- cho `paxAmountLabel` trả đơn giá của bậc hiện hành thay vì `''`; hoặc
- giữ lại `bf__head` **chỉ** khi `priceTable.kind === 'tiers'`.

Ghi một dòng vào `docs/BACKLOG.md` khi thi hành.

**Được phép bỏ, chiếu theo Luật 1.** `06-BINDING_MAP` §6 Luật 1 cho giá là **ngoại lệ duy nhất**
được xuất hiện ở hai vùng (thanh dính + khối hành động) vì đó là quyết định mua. Ngoại lệ ấy
**cho phép** hai vùng chứ không **bắt buộc** hai vùng, nên rút về một là hợp luật. Đơn giá từng
hạng khách vẫn nằm trong khối hành động, nên khối hành động không mất vai trò giá.

> ✅ **Đã giải quyết 2026-08-31 — chủ dự án chọn lối A** (nới Luật 3, hero +50px mọi khổ).
> Nên §4.2 **giữ nguyên: vẫn bỏ `.bf__head`**. Nhánh "nếu chọn lối C thì cân nhắc giữ lại" không
> còn áp dụng.
>
> Ràng buộc còn lại: mảnh (1) phải viết `QĐ-2026-08-31-03` và sửa `06-BINDING_MAP` §3 hàng Hero
> **trước** khi sửa token. Mảnh (3) **không chờ việc đó** — nó không đụng chiều cao hero, và
> `.bf__price` bị bỏ vốn đã nằm ngoài màn đầu (y = 1151 so với mốc 657).

### 4.3 Khối thanh toán gộp một hàng — **−40px**

Nhãn + 2 dòng radio (96px) → nhãn + một hàng hai nút phân đoạn. **Không** đổi ngữ nghĩa dữ liệu,
chỉ đổi hình dạng.

**Chủ dự án chốt 2026-08-31: KHÔNG chọn sẵn đoạn nào.** Trạng thái ban đầu giữ **y như hôm nay** —
không radio nào `checked`.

Đây không phải chi tiết thẩm mỹ. Ba thứ phụ thuộc vào nó:

| Phụ thuộc | Nếu tự ý chọn sẵn |
|---|---|
| Tạm tính ban đầu (`initialQuote`, không ưu đãi) | số tiền mặc định khách nhìn thấy **đổi** |
| Nhánh `payRequired` trong `openStep2()` — `if (payEls.length && !payEls.some(el => el.checked))` | nhánh báo lỗi "chưa chọn hình thức" thành **chết** |
| Ba luật chéo `ADR-0031` §5 (xem §4.5.2) | máy chủ trả **400** cho đơn thật |

**Bốn ràng buộc bắt buộc — segmented control theo lệ thường LUÔN có một đoạn sáng, nên phải viết
ra rằng ở đây thì không:**

1. **Giữ `<input type="radio">` thật**, chỉ tạo dáng `<label>`. **Không** thay bằng `<button>`.
2. **Mô tả rõ trạng thái "chưa chọn"** trông ra sao — cả hai đoạn đều ở trạng thái nghỉ.
3. Trạng thái `:checked` phải có **dấu hiệu ngoài màu** (viền, hình đánh dấu) — không chỉ nền.
4. Giữ vòng tiêu điểm; giữ vùng chạm **2.75rem** (`.bf__pay-opt` đang có `min-height: 2.75rem`).

**Giữ nhãn `#bf-pay-label` "Hình thức thanh toán".** `role="radiogroup"` đang lấy tên từ nó qua
`aria-labelledby`; bỏ nhãn là nhóm mất tên, phải khai `aria-label` thay thế — và phần tiết kiệm
tụt xuống **dưới 40px**. Nếu người thi hành vẫn muốn bỏ, phải sửa lại ngân sách §4.7 bằng số đo
thật, không giữ con số −40 rồi bỏ nhãn.

### 4.4 Nền xám cho toàn form — và ba hệ quả dây chuyền

`.bf` nhận `background: var(--c-surface-alt)`, `padding: var(--s4)`,
`border-radius: var(--radius-md)`. **+32px** (đệm hai đầu).

**Dùng token, không viết cứng màu** — luật cứng 1 (`CLAUDE.md` §8, P6/N7). `--c-surface-alt` đổi
theo bộ màu (mặc định `#EAF2F8`, ấm `#F5EDE0`, xanh ngọc `#E8F4F2`) nên form tự theo chủ đề.

**Tô vào `.bf`, KHÔNG tô vào `.sidebar-card`.** `Sidebar.astro` dùng chung cho 12 loại trang chi tiết;
đổi nền ở đó là sửa frame chung để phục vụ đúng một loại trang — trái luật cứng 2.

**Phương pháp, không phải danh sách chép tay.** Bản nháp đầu của spec này liệt kê tay "ba hệ quả"
và **bỏ sót một khối** (`.bf__qr`, xem dưới). Danh sách chép tay hỏng lại lần sau, khi ai đó thêm
một khối nền mới. Luật thay thế:

> **Quét mọi khai báo `background:` trong khối `<style>` của `BookingForm.astro`, rồi quyết từng
> cái.** Lệnh: `grep -nE "background:" src/components/BookingForm.astro`.

Kết quả quét ngày 2026-08-31 (`grep -n "c-surface-alt"` ra **3** nơi, không phải 2):

| # | Phần tử | Dòng | Nay | Sau | Vì sao |
|---|---|---|---|---|---|
| 1 | `.bf__quote` | 739 | `--c-surface-alt` | **`--c-card`** | cùng màu form thì khối Tạm tính tan vào nền. Lật ngược còn rõ hơn: bảng giá trắng nổi trên form xám |
| 2 | `.bf__btn:hover` | 735 | `--c-surface-alt` | **token hover thật** — xem cảnh báo dưới | trên form xám thì bấm +/− không có phản hồi |
| 3 | **`.bf__qr`** | **775** | `--c-surface-alt` | **`--c-card`** | **BỎ SÓT Ở BẢN ĐẦU.** Khối mã QR chuyển khoản nằm trong `.bf__done` (`:223`) ⇒ trong chính `<form class="bf">` (`:79`) sắp bị tô xám. Đây là bề mặt khách quét để **trả tiền** — tan vào nền là hỏng đúng chỗ đắt nhất |
| 4 | `.bf__count` | 737 | `transparent` | **quyết rõ** | đang ăn nền trắng `.sidebar-card`; sau khi tô xám thành ô xám kẹp giữa hai nút tròn trắng |
| 5 | `.bf__input` | 712 | `--c-card` | **giữ nguyên** | ô trắng trên nền xám rõ hơn trắng trên trắng — *tốt lên* |

⚠ **Mục 2 — đừng đổi hover thành `--c-card`, đó là no-op.** `.bf__btn` đã có
`background: var(--c-card)` ở trạng thái thường, nên đổi hover sang `--c-card` là **xoá** phản
hồi nền chứ không phải sửa nó; chỉ còn `border-color` vốn đã đổi sẵn. Và **tiêu chí 12 sẽ "đạt"
nhờ cái viền cũ**, tức tiêu chí không bắt được lỗi. Chỉ định một token thật —
`--c-primary-soft` đang dùng cho `.bf__secondary:hover` là ứng viên có sẵn.

### 4.5 Bảng chi tiết giá

```
Tạm tính                          1.140.000 ₫
▸ Xem chi tiết giá                        ← <details>, mặc định ĐÓNG
  ┌────────────────────────────────────────────
  │ Người lớn × 2   523.000 ₫/khách  1.046.000 ₫
  │ Trẻ em    × 1   380.000 ₫/khách    380.000 ₫
  │ ───────────────────────────────────────────
  │ Tạm tính trước ưu đãi            1.426.000 ₫
  │ Ưu đãi trả trước (−5%)            −286.000 ₫
  │ ═══════════════════════════════════════════
  │ Tổng cộng                        1.140.000 ₫
  │ (i) Đơn giá đã gồm phụ thu mùa cao điểm +10%,
  │     làm tròn lên nghìn.
  └────────────────────────────────────────────
```

`<details>` thêm **+24px** (dòng tóm tắt). Mặc định **đóng**, nên chi tiết thêm vào **không** tốn
chiều cao.

#### 4.5.1 Luật chuẩn tắc — bốn mốc chính xác

`apDieuChinh()` áp **cả hai** phần trăm trong một biểu thức rồi mới `Math.ceil` lên nghìn
(ADR-0030 §3, ADR-0031 §3). Nên thang `giá gốc → +mùa → −ưu đãi → tổng` **không tự cộng khớp**.
Chỉ bốn mốc sau là chính xác tuyệt đối, và bảng trên **chỉ được** dựng từ chúng:

| Dòng hiển thị | Nguồn |
|---|---|
| Đơn giá mỗi hạng khách | `quote.lines[].amount` (`= apDieuChinh(gốc, mùa, ưu đãi)`) |
| Thành tiền mỗi hàng | `quote.lines[].subtotal` |
| Tạm tính trước ưu đãi | **`quote.prepay.totalGoc`** |
| Số tiền giảm | **`totalGoc − total`** |
| Tổng cộng | **`quote.total`** |

**Ba luật, viết ra để người sửa sau không phá:**

1. **Giao diện KHÔNG BAO GIỜ nhân.** Mọi số tiền lấy nguyên từ `Quote`. Phần trăm ghi như
   **luật**; số tiền là **số của engine**. `totalGoc − total` chính xác nhưng **không** đúng bằng
   5% của `totalGoc` — làm tròn lên nghìn xảy ra một lần trên từng đơn giá, và phép làm tròn lên
   **không có phép nghịch đảo**.
2. **Không có thang ưu đãi theo từng hạng khách.** `total` là tổng các đơn giá đã chịu cả hai
   phần trăm rồi làm tròn, nên một cột "−5%" theo từng dòng sẽ **không khớp** với
   `totalGoc − total`. Ưu đãi chỉ hiện ở **mức tổng**.
3. **Không ưu đãi → `quote.prepay` VẮNG → không có `totalGoc`.** Hai dòng giữa **biến mất**, chỉ
   còn Tổng cộng. Đây là **luật render**, tuyệt đối không phải tính bù bằng cách nhân ngược.

#### 4.5.2 Không chạm `src/lib/booking/` — khẳng định để người duyệt kiểm được

Bảng ở 4.5 chỉ dùng field **đã có** trên `Quote`: `lines[].amount`, `lines[].count`,
`lines[].subtotal`, `prepay.totalGoc`, `prepay.percent`, `total`, `season.percent`.

Nên:

- `src/lib/booking/quote.ts` — **không sửa**.
- `buildQuotedPayload` chỉ lấy đúng 4 khoá (`perPax`, `total`, `season`, `prepay`) — **payload
  gửi máy chủ giữ nguyên từng byte**.
- `validateBooking` **không tính lại giá** (BK1): `schema.ts:227` gọi `computeQuote` với đúng
  `perPax` do **client gửi**, không đọc `prices.yaml`. Phần này của bảng chi tiết giá **không
  ảnh hưởng**.

  ⚠ **Nhưng "chỉ kiểm `perPax × số khách === total`" là mô tả SAI — bản nháp đầu của spec này
  giản lược quá tay.** `schema.ts:200-257` còn kiểm slug/`bookingRef`/độ dài tiêu đề, ngày
  (bắt buộc / ISO / quá sớm / quá xa), pax (nguyên / không âm / trần từng hạng / `ADULT_MIN` /
  `TOTAL_MAX`), `quotedOk`, liên lạc — và **ba luật chéo ADR-0031 §5** (`:238-240`):

  | Điều kiện | Kết quả |
  |---|---|
  | `prepay` có **mà** `paymentMethod !== 'transfer'` | **400** |
  | **`!prepay` mà `paymentMethod === 'transfer'`** | **400** ← chiều này bản đầu không nêu |
  | `prepay.totalGoc < quoted.total` | **400** |

  Điều này ràng buộc thẳng §4.3: đổi bề mặt sinh ra `paymentMethod` là chạm cặp
  `paymentMethod` ↔ `prepay`. **Máy chủ trả 400 cho CẢ HAI chiều lệch**, nên một cụm nút phân
  đoạn có trạng thái mặc định sai sẽ làm đơn thật bị từ chối. Xem tiêu chí 8b.
- `handler.ts`, `notify/`, `html.ts`, D1 — **không sửa**.

**Nếu sau này ai muốn phụ thu mùa hiện thành SỐ TIỀN cho từng hạng khách** thì mới cần thêm một
field `base` (đơn giá trước mùa) vào `QuoteLine`. Đó là sửa module dùng chung client/server
(BK5), kéo theo bộ test của `quote.ts`. **Ngoài phạm vi spec này**, và không được lặng lẽ gộp
vào — mùa ở đợt này hiện dưới dạng **ghi chú (i)** trên đơn giá.

#### 4.5.3 Số phận hai dòng đang sống — `.bf__season` và `.bf__prepay`

**Bản nháp đầu bỏ quên hai node này**, trong khi §4.5 dựng lại đúng nội dung của chúng. Cả hai
đang render trong ca phổ biến nhất (ưu đãi 5% đang bật + mùa cao điểm):

| Node | Đang in | Trùng với dòng nào của bảng mới |
|---|---|---|
| `.bf__prepay` | `− {p}% · {price} nếu thanh toán khi khởi hành`, `{price}` = `quote.prepay.totalGoc` | **cùng con số** với "Tạm tính trước ưu đãi" |
| `.bf__season` | `{TênMùa} · +{p}%` | **cùng thông tin** với ghi chú (i) về mùa |

**Chốt: gộp vào bảng, XOÁ cả hai `<p>`.** Giữ là in cùng một con số hai lần trong một khối cao
106px. Và ngân sách §4.7 chưa tính chúng, nên giữ lại là ngân sách sai.

#### 4.5.4 Ba luật render còn thiếu ở bản nháp đầu

§4.5.1 mới phủ ca "không ưu đãi". Ba ca còn lại phải khai, nếu không người thi hành đoán:

1. **Không có mùa** (`quote.season` vắng) → ghi chú (i) về mùa **không render**. Không in "+0%".
2. **`quote === null`** — `computeQuote` trả `null` khi vượt bậc hoặc có hạng khách không có giá.
   Hôm nay `[data-total]` hiện `—` và không có `lines`. **`<details>` chi tiết giá phải KHÔNG
   render** trong ca này, không phải render một bảng rỗng. (Ca này gần như chỉ đến từ `tiers`,
   tức cùng rủi ro ngủ đã ghi ở §4.2.)
3. **`<details>` phải nằm NGOÀI vùng `aria-live`.** `.bf__quote` mang `aria-live="polite"` và bị
   `replaceChildren()` mỗi lần bấm +/−. Đặt bảng chi tiết vào trong đó là mỗi lần đổi số khách
   trình đọc màn hình đọc lại **toàn bộ** bảng. Hoặc đặt `<details>` ngoài `.bf__quote`, hoặc
   thu vùng live về đúng `[data-total]`.

#### 4.5.5 Cấm đổi cặp `span`/`strong` trong `.bf__total`

`showDone()` đọc nhãn tạm tính **qua DOM**:
`totalEl.closest('.bf__total')?.querySelector('span')?.textContent`. Tái cấu trúc `.bf__quote` /
`.bf__total` mà đổi cấu trúc con sẽ làm **hỏng lặng lẽ** khối xác nhận sau khi gửi đơn — không
lỗi, không cảnh báo, chỉ là nhãn sai. Giữ nguyên cặp `span` + `strong`, hoặc đổi `showDone()`
sang đọc từ dữ liệu thay vì DOM. Xem nghiệm thu 14b.

### 4.6 Hai bẫy DR-102 đã tính trước

1. **Dùng `<details>` gốc, không dùng `hidden` + JS.** Astro gắn thuộc tính scoped vào selector,
   nên `.bf__step { display: flex }` biên dịch thành đặc hiệu **0,2,0** và **đè**
   `[hidden] { display: none }` mặc định của trình duyệt (**0,1,0**). `<details>` né hẳn bẫy này.
   Nếu vì lý do nào đó vẫn phải dùng `hidden`, thì **liệt kê theo class** (`.bf__x[hidden]`) để
   thành 0,3,0 — **không** viết `[hidden]` trần, vì Astro để nguyên selector không class và biến
   nó thành luật **toàn site**.
2. **CSS scoped không với tới node do JS dựng.** Các dòng trong bảng chi tiết được
   `document.createElement` mỗi lần đổi số khách, nên **không** mang `data-astro-cid-*`. Phải
   `[data-quote-detail] :global(.bf__line)`, đúng cách đã sửa cho `[data-quote-lines]` và
   `[data-done-summary]`. Bỏ qua là tái hiện lỗi *"Người lớn × 1019.550.000₫"* mà chủ dự án đã
   báo ngày 2026-08-29.

### 4.7 Ngân sách chiều cao

| | px |
|---|---|
| Hiện trạng (§2.1) | **1237** |
| §4.1 ghi chú → (i) | −225 |
| §4.2 bỏ `.bf__head` | −88 |
| §4.3 khối thanh toán gộp một hàng | −40 |
| §4.5 dòng tóm tắt `<details>` | +24 |
| §4.4 đệm nền xám | +32 |
| **Dự kiến** | **≈ 940** |

⚠ **Hai dòng của ngân sách này có ĐIỀU KIỆN — không phải hằng số:**

- **−40px (§4.3) chỉ có khi ưu đãi đang bật.** Khối `.bf__pay` chỉ render khi `prepayPercent > 0`,
  và đó là **công tắc Studio đổi được ngoài git** (đã đổi ngoài git ngày 31/08). Tắt ưu đãi thì
  mất luôn −40px **và** hai dòng giữa của bảng §4.5. Vậy **mọi phép đo nghiệm thu phải làm trong
  trạng thái ưu đãi ĐANG BẬT**, và ghi rõ trạng thái công tắc lúc đo.
- **−150px (§4.1) phụ thuộc hộp của dấu ⓘ.** Dựng vùng chạm 44px ăn vào chiều cao dòng là mất
  phần lớn khoản này — xem ràng buộc thứ ba ở §4.1.

**940 vẫn vượt vùng nhìn 859px khoảng 81px. Spec này KHÔNG hứa form lọt trọn một màn** — hứa vậy
là hứa suông. Cột phải đã thôi dính (§2.1) nên form cuộn bình thường; tiêu chí có ý nghĩa mua bán
là cụm quyết định, xem nghiệm thu 2.

## 5. Phạm vi

**Chạm:** `src/components/BookingForm.astro` (markup, `<style>`, `<script>`),
`src/lib/uiCopy.ts` (chuỗi mới: nhãn nút (i), "Xem chi tiết giá", "Tạm tính trước ưu đãi",
"Ưu đãi trả trước", "Tổng cộng" — **đủ 5 ngôn ngữ**, dù hiện chỉ dựng `vi`),
`src/styles/tokens.css` **chỉ nếu** phát sinh token cỡ mới.

**Không chạm:** `src/lib/booking/*`, `src/pages/api/dat-tour.ts`, `DetailLayout.astro`,
`Sidebar.astro`, lược đồ D1, `prices.yaml`.

Đúng một component và một file chuỗi. **Không để spec mọc thêm mặt thứ tư trong lúc thi hành.**

## 6. Nghiệm thu

Mặc định của cổng là **không đạt** nếu không có bằng chứng (`CLAUDE.md` §6). Đo bằng JS, không
chụp màn hình.

**Chiều cao và bố cục**

1. Chiều cao `.bf` tại **1710×985**: từ **1237px** xuống **≤ 1000px**.
2. Cụm **"Số người" → nút "Đặt tour ngay"** nằm **trọn trong 859px**. Đây là tiêu chí chính.
   **Định nghĩa phép đo, để không đọc được hai kiểu:** hiệu `getBoundingClientRect()` —
   đáy `.bf__primary[data-open]` **trừ** đỉnh `#bf-pax-label`. Là **chiều cao cụm**, độc lập vị
   trí cuộn và độc lập chiều cao hero, nên mảnh (1) không ảnh hưởng con số này.
3. Đo lại ở **390×844** — không hồi quy: không ô nhập nào của bước 2 bị che, không khối nào tràn
   ngang khỏi `.sidebar-card`.
4. **Đo ở khổ desktop, không chỉ ≤640px.** `SPEC-2026-08-21-dat-tour.md` §7 mục 13c chỉ kiểm
   ≤640px, và đó chính là lý do DR-104 lọt qua nghiệm thu 14/14.

**Trạng thái trước, không chỉ trạng thái sau** (bài học DR-102)

5. `<details>` chi tiết giá **đóng khi tải trang** — **đo HÌNH HỌC, không đo thuộc tính**:
   `offsetHeight === 0` hoặc `getComputedStyle(el).display === 'none'` trên node **nội dung**.
   **Không** dùng `details.open === false` làm bằng chứng. DR-102 chính là ca thuộc tính **đúng**
   mà render **sai**: JS đặt `hidden = true` thật, khối vẫn cao 702px. Thuộc tính không phải
   bằng chứng về cái mắt nhìn thấy.
6. Mọi ghi chú ⓘ **đóng** khi tải trang — cùng phép đo hình học ở mục 5, trên node chứa chữ.
   Chữ ghi chú **có trong DOM**; mở/đóng được **bằng bàn phím**; và `#bf-date-range` vẫn là
   `aria-describedby` của `#bf-date` (§4.1).
   **6b. Kiểm KHÔNG JS:** tắt JavaScript, tải trang tour — khoảng ngày khởi hành vẫn **đọc được**
   (mở `<details>` ra). Đây là điều khoản `BookingForm.astro:62-64` đã ghi; bản nháp đầu của spec
   suýt phá nó.
   **6c. `git diff`:** mọi selector `[hidden]` mới phải **có class** và phải nằm trong danh sách
   liệt kê ở `BookingForm.astro:206-208`. `[hidden]` trần biến thành luật toàn site (DR-102).
7. Dòng do JS dựng trong bảng chi tiết có `display: flex` và
   `justify-content: space-between` — đo trên node JS dựng, không phải node server dựng.

**Tiền**

8. Mọi số tiền trong bảng khớp `computeQuote` ở **cả hai ca**: có ưu đãi và không ưu đãi. Ca
   không ưu đãi phải chứng minh hai dòng giữa **biến mất** (§4.5.1 luật 3).
9. **Sàn giá:** trên **mọi tour có form** (28 tour, đo lại lúc thi hành), `.bf__pax-price` có mặt
   cho ít nhất hạng "Người lớn". Đây là sàn an toàn cho ca `showStickyBar` false —
   `DetailLayout` chỉ dựng thanh dính khi `jumps.length > 0 || priceLabel || (ctaHref &&
   ctaLabel)`, nên không được cho rằng thanh dính luôn có mặt.
   **9b.** Kiểm lại `grep -c "tiers\|maxPax" data/prices.yaml` vẫn ra **0**. Khác 0 thì §4.2
   phải mở lại **trước khi** bỏ `bf__head` — xem cảnh báo bảng giá bậc ở §4.2.
   **8b. Cặp `paymentMethod` ↔ `prepay` — gửi đơn THẬT ở cả hai ca**, vì máy chủ trả 400 cho
   **cả hai** chiều lệch (§4.5.2): (i) chọn "chuyển khoản trước" → đơn qua, `quoted.prepay` có
   mặt; (ii) chọn "trả khi khởi hành" → đơn qua, `quoted.prepay` vắng. Không tiêu chí nào của
   bản nháp đầu chạm cặp này, trong khi §4.3 đổi đúng bề mặt sinh ra nó.
   **11b.** Đo `.bf__qr` (khối mã QR) khác màu nền `.bf` — bề mặt khách quét để trả tiền.
10. Chuỗi giá xuất hiện **đúng một lần** trên trang tour — cùng phép quét node lá đã dùng ở §2.3.

**Màu**

11. `.bf__quote` và nền `.bf` **khác màu nhau** ở **cả ba bộ màu** (mặc định, ấm, xanh ngọc).
12. `.bf__btn:hover` có thay đổi nhìn thấy được trên nền xám.
13. `git diff` cho thấy **không màu nào viết cứng** trong `BookingForm.astro` — toàn token.

**Hợp đồng dữ liệu**

14. `git diff --stat` chứng minh **không file nào trong `src/lib/booking/` bị sửa**.
15. Bộ test hiện có của module đặt tour vẫn xanh, **không sửa test nào** để nó xanh.

**Cổng**

16. `npm run build` **trước**, rồi `npm run gate` (DR-105: `gate` không tự dựng lại). So **từng
    dòng** bảng tổng kết trước/sau; dòng nào đổi trạng thái thì giải trình dòng đó. Không dùng
    con số "baseline N đỏ" chép từ spec cũ — DR-105 đã ghi con số đó không khớp phép đo nào.
