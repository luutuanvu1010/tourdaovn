# ADR-0034 — Thẻ Chi tiết của form đặt chỗ: ba dòng tiền, nút "Chi tiết" theo giá gốc; `QuoteLine` mang `goc`/`subtotalGoc`

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
Quyết định RIÊNG của tourdaovn, nhưng ba cơ chế tái dùng được: (1) khối tiền của một form bán
hàng chỉ nói ba điều — trước giảm, giảm, phải trả — và mọi phân rã đứng sau một nút gập, không
in một con số dưới hai tên; (2) giao diện KHÔNG BAO GIỜ nhân tiền — muốn hiện một số mới thì
bộ tính giá phải trả sẵn, dù chỉ là tách tổng thành từng dòng; (3) trạng thái hiển thị phụ
thuộc dữ liệu (kẻ đường hay không) đi bằng lớp CSS do server đặt và JS lật, không bằng :empty
hay :has() khi framework scope CSS và giữ text node trắng. Nhãn, con số và tên lớp là của site này.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** **accepted** — chủ dự án chốt qua ba lượt duyệt trong phiên 2026-09-04 → 2026-09-05
  (`QĐ-2026-09-05-01`): duyệt thiết kế ba phần theo khuyến nghị; xem trước rồi yêu cầu ba chỉnh
  (nút Chi tiết quay lại, đổi hai nhãn); xem trước lần hai rồi chốt "Chi tiết" + thân theo giá gốc.
- **Ngày:** soạn 2026-09-05   **Người soạn:** Claude (Code)   **Người phê chuẩn:** Lưu Tuấn Vũ (chủ dự án)
- **Bản ghi:** `QĐ-2026-09-05-01` trong `docs/DECISIONS.md`
- **Loại quyết định:** cửa **hai chiều**. Bề mặt form là hai chiều hiển nhiên. Hai trường thêm vào
  `QuoteLine` là **thuần bổ sung**: không đổi `total`/`perPax`/`season`/`prepay`/`group`, không đổi
  payload gửi máy chủ, không đổi cách máy chủ kiểm — rút lại chỉ là xoá hai trường và hai chỗ đọc.
- **Supersedes:** `SPEC-2026-08-31-form-dat-tour-gon-va-chi-tiet-gia.md` §4.5 (hình dạng khối Tạm
  tính + bảng gập) và điều khoản §4.5.2 *"thêm field vào QuoteLine là ngoài phạm vi"* — điều khoản
  đó nay được thi hành đúng như nó dự tính. `ADR-0031` §4 (`prepay.totalGoc`) **giữ nguyên**, ADR
  này chỉ tách con số ấy theo dòng.
- **Liên quan:** `ADR-0027` (module đặt tour), `ADR-0031` (ưu đãi thanh toán trước, phép
  `apDieuChinh`), `ADR-0033` (form trên trang Trải nghiệm, giá `perGroup`), `04-CONSTRAINTS` §1d
  BK1–BK5, `docs/DRIFT_LOG.md` DR-102, `docs/specs/SPEC-2026-09-04-form-dat-cho-ba-phan.md` (§1–§9,
  kèm số đo nghiệm thu)

## Bối cảnh

Sau đợt 31/08 (`SPEC-2026-08-31`), bước 1 của form có **hai khối tiền chồng nhau**: thẻ "Tạm tính"
in từng hạng khách rồi tổng, và ngay dưới là nút gập "Xem chi tiết giá" in lại từng hạng khách,
cộng thêm Tạm tính trước ưu đãi, Ưu đãi, Tổng cộng. Đo trên production 04/09 với 1 người lớn + 1
trẻ em: số người in **ba lần** (bộ đếm, thẻ, bảng), con số 1.374.000₫ mang **hai tên** ("Tạm tính"
và "Tổng cộng"), số tiền lên mã QR để khách chuyển lại được gọi là "tạm" kèm dấu ⓘ "nhân viên
xác nhận trước khi thanh toán", và hiệu quả của nút "Chuyển khoản − ưu đãi 5%" nằm trong bảng
đang gập. Chủ dự án nêu đúng hai điểm đầu và yêu cầu bố cục ba phần: Số lượng → Phương thức thanh
toán → Chi tiết.

Khi nút Chi tiết quay lại (05/09), chủ dự án chốt thân nút in **giá gốc trước khuyến mại** theo
kiểu "5 × Người lớn". Bộ tính giá lúc đó chỉ có tổng trước ưu đãi (`prepay.totalGoc`, `ADR-0031`),
không có thành tiền trước ưu đãi cho từng dòng — mà luật của module là **giao diện không tự nhân**
(spec 31/08 §4.5.1 luật 1: làm tròn lên nghìn không có phép nghịch đảo, nhân ở giao diện là in
một số máy chủ không bao giờ tính ra).

## Quyết định

1. **Bước 1 của form có đúng ba phần sau ô ngày:** Số lượng (giữ nguyên) → Phương thức thanh toán
   (giữ nguyên) → **Chi tiết**: một thẻ trắng duy nhất, luôn mở. Tên ba phần vẫn ẩn thị giác như
   quyết định 31/08; thẻ trắng đủ tách phần ba.

2. **Thẻ Chi tiết nói ba điều, theo thứ tự:** `Tạm tính` (tổng trước ưu đãi, đã áp mùa =
   `prepay.totalGoc`) → `Ưu đãi trả trước (−p%)` (= `totalGoc − total`) → **`Tổng tiền`** (=
   `quote.total`, số đi lên mã QR). Không ưu đãi (khách chọn "Thanh toán khi khởi hành", hoặc công
   tắc tắt) → hai dòng đầu **vắng**, chỉ còn Tổng tiền, **không kẻ đường** trên nó. Đây là luật
   render, tuyệt đối không tính bù. Nhãn "Tạm tính"/"Tổng tiền" là chữ chủ dự án chốt 05/09.

3. **Nút "Chi tiết" đứng cuối thẻ**, là `<details>` gốc, mặc định đóng. Thân nút là **đúng phần
   không có ở ba dòng trên**: thành tiền từng hạng khách theo **giá gốc trước ưu đãi, đã áp mùa**,
   viết "2 × Người lớn · 1.700.000₫"; với bảng giá nhóm là dòng lượt "6 khách → 2 lượt ×
   1.000.000₫ · 2.000.000₫"; và ghi chú mùa nếu có. **Bất biến đọc được:** các dòng trong thân
   cộng lại **bằng Tạm tính**. Không lặp Tạm tính / Ưu đãi / Tổng tiền vào thân. `quote === null`
   → nút `hidden`, không mở ra bảng rỗng.

4. **`QuoteLine` mang thêm `goc` và `subtotalGoc`** (`src/lib/booking/quote.ts`): `goc =
   apDieuChinh(giá gốc, mùa, 0)` — cùng hàm đang cộng dồn `totalGoc`, chỉ tách theo dòng;
   `subtotalGoc = goc × count` (count là số người, hoặc số lượt với bảng nhóm). Cả ba nhánh
   `flat`/`tiers`/`group` cùng nhận. **Bất biến:** `Σ subtotalGoc === prepay.totalGoc`; không ưu
   đãi thì `goc === amount`. `buildQuotedPayload` vẫn lấy đúng bốn khoá cũ — **payload gửi máy chủ
   giữ nguyên từng byte**; `validateBooking` không đọc `lines`. Khoá bằng test
   (`test/booking/quote.test.ts`: bốn `toEqual` hình dạng dòng cập nhật, bốn ca mới).

5. **Biên nhận sau khi gửi soi gương thẻ:** từng hạng theo giá gốc → Tạm tính → Ưu đãi → Tổng
   tiền, để dòng "2 × Người lớn" không mang hai con số ở hai nơi. `quote` được **chốt trước
   `await fetch`** và truyền vào `showDone`, cùng lý do với `tongDaGui` đã có.

6. **Gỡ:** khối `.bf__quote` cũ và dấu ⓘ "nhân viên xác nhận"; ba khoá copy `bookingSubtotal`,
   `bookingSubtotalNote` (chữ "tạm" cũ) — `bookingPriceDetail` giữ, đổi thành "Chi tiết".

7. **Luật kỹ thuật đi kèm** (đều đo được, xem chú thích trong `<style>` của `BookingForm.astro`):
   - Đường kẻ trên Tổng tiền đi theo lớp `bf__sum--co-dong`, **server đặt lúc dựng, JS lật trong
     `update()` theo số con vừa dựng** — không `:empty` (Astro giữ text node trắng giữa các thẻ,
     đã thấy trong HTML server), không `:has()` (phụ thuộc cách Astro gắn scope vào `*`).
   - Mọi lớp gắn vào node do `createElement` dựng (`bf__line`, `bf__sum-note`) nhắm qua
     `:global()`; `hidden` của nút liệt kê theo class `.bf__detail[hidden]` — hai bẫy DR-102.
   - `aria-live="polite" aria-atomic` chỉ ở **dòng Tổng tiền**, không ở cả thẻ.
   - Nhãn và số dòng Tổng tiền cùng `--fs-base`/700: "Tổng tiền" 84px + gap 12 + số xấu nhất
     "30.000.000₫" 112px = 208px < lòng thẻ 240px. **Đổi nhãn dòng này phải đo lại** — nhãn
     "Cần thanh toán" (136px) từng làm hàng gãy hai dòng.

## Lý do

- **Một con số một tên.** Khách nhìn thấy đúng ba con số có nghĩa với họ; phân rã theo hạng khách
  đứng sau một cú bấm, và khi mở ra thì **cộng lại bằng dòng đầu** — đọc như một hoá đơn.
- **Giá gốc trong thân, không phải giá đã trừ.** Chủ dự án chốt. Về logic cũng đúng hơn: ưu đãi
  áp ở mức tổng (`ADR-0031` §3 làm tròn một lần trên từng đơn giá), một cột "−5%" theo dòng sẽ
  **không khớp** `totalGoc − total`; in giá gốc theo dòng rồi trừ một lần ở tổng là cách duy nhất
  mà mọi số trên thẻ cộng/trừ khớp nhau.
- **Thêm trường vào bộ tính giá thay vì nhân ở giao diện.** Đây là đường spec 31/08 §4.5.2 đã
  dự tính. Phương án ngược lại — giao diện gọi `apDieuChinh(gốc, mùa, 0)` từ `data-price-table` —
  chạy được nhưng dựng **nguồn thứ hai** cho cùng một phép ngay trong client, và một ngày nào đó
  hai nguồn lệch nhau ở làm tròn.

## Phương án bị loại

- **Giữ dòng "hạng × n" luôn hiện trong thẻ** (như 31/08): đó chính là trùng lặp chủ dự án chỉ ra.
- **Bỏ hẳn nút Chi tiết** (bản 04/09): chủ dự án xem trước rồi yêu cầu lại nút. Khách mất chỗ xem
  trẻ em rẻ hơn người lớn bao nhiêu.
- **Ghi chú lượt đứng rời dưới Tổng tiền** (bản 04/09 → 05/09 sáng): khi nút Chi tiết quay lại,
  dòng lượt vào thân nút để không in hai nơi.
- **Nhãn "Cần thanh toán" / "Tổng số tiền"** (bản 04/09): chủ dự án đổi thành "Tổng tiền" / "Tạm
  tính". Kéo theo: nhãn ngắn nên bỏ được mẹo hạ cỡ chữ nhãn.
- **Giao diện tự tính giá gốc** bằng `apDieuChinh` phía client: loại vì lý do trên.
- **`:empty` / `:has()` cho đường kẻ:** loại vì không tất định trên Astro, xem quyết định 7.

## Hệ quả

- **Chiều cao thẻ** (dev 1688×1066, `getBoundingClientRect`): 173px đóng / 206px mở với 1 người
  lớn; 239px mở với 1 NL + 1 TE; 97px khi thanh toán khi khởi hành; 231px mở với phao chuối 6 khách.
  So với production trước đợt: 155px gập / 331px mở. Ổn định 41px cho dòng Tổng tiền tới số tám
  chữ số.
- **Không đổi:** hợp đồng client↔server, D1, thông báo, endpoint, `Sidebar.astro`,
  `DetailLayout.astro`, `tokens.css`. Cổng: build + gate 47 pass / 0 fail; vitest 208/208; astro
  check 0 lỗi; astro-auditor 5/5 trên bản 04/09.
- **Chưa đo sống, ghi để không ai tưởng đã đo:** biên nhận sau khi gửi đơn thật; khổ điện thoại
  (lệnh đổi cỡ cửa sổ Chrome không ăn trên máy chủ dự án — sổ nhớ đã ghi).
- **Nợ mở:** không có. Lần sau đổi nhãn dòng Tổng tiền hoặc thêm hạng khách có tên dài, đo lại
  bề rộng theo quyết định 7.
