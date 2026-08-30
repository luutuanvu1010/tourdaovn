# ADR-0031 — Ưu đãi thanh toán trước: quy tắc giá thứ hai, neo vào lựa chọn của khách

<!-- ═══════════════════════════════════════════════════════════════════
Quyết định RIÊNG của tourdaovn về một khoản giảm giá có điều kiện. Cơ chế tái dùng được cho
mọi site: (1) mọi quy tắc cộng trừ giá sống cùng một chỗ trong CMS, tách khỏi nguồn giá;
(2) điều kiện neo vào LỰA CHỌN quan sát được của khách, không neo vào sự thật mà hệ không
có cách biết; (3) đơn ghi lại cả con số đã giảm lẫn con số nếu không giảm. Mức phần trăm,
kênh chuyển khoản, và câu chữ là của site này.
═══════════════════════════════════════════════════════════════════ -->

- **Trạng thái:** **ĐÃ PHÊ CHUẨN 2026-08-30** — năm điểm thiết kế chốt trong phiên brainstorm
  cùng ngày, toàn văn được chủ dự án duyệt sau khi đọc lại ADR và spec (`QĐ-2026-08-30-01`)
- **Ngày:** soạn và phê chuẩn 2026-08-30   **Người soạn:** Claude (qua Cowork)
  **Người phê chuẩn:** Lưu Tuấn Vũ (chủ dự án)
- **Loại quyết định:** cửa **hai chiều** ở mọi điểm — tắt công tắc trong Studio là tính năng
  biến mất sạch khỏi mọi trang; cột D1 thêm vào có giá trị mặc định nên đơn cũ không đổi nghĩa
- **Bổ sung:** `ADR-0030` §3 (cùng lớp quy tắc giá) — **không** đảo, **không** nới
- **Liên quan:** `ADR-0027` (module đặt tour, "đơn là yêu cầu đặt"), `ADR-0030` §1 §2 §5,
  `ADR-0007` (nguồn giá), `04-CONSTRAINTS` §1d `BK1`–`BK5`, `01-CONTENT_MODEL` §2.16,
  `docs/specs/SPEC-2026-08-30-uu-dai-thanh-toan-truoc.md`

## Bối cảnh

Giá mùa vụ lên `main` ngày 2026-08-30 (`6342262`). Nó dựng xong một bộ máy mà trước đó hệ
không có: **một quy tắc khai trong Studio, đọc lúc dựng trang, gấp phần trăm vào đơn giá từng
hạng khách, và ghi lại vào đơn vì sao ra con số đó.**

Chủ dự án muốn thêm một khoản khuyến mại: **khách chọn thanh toán trước bằng chuyển khoản thì
được giảm x% trên mỗi khách**, x khai trong CMS.

Yêu cầu này rơi đúng lên một lằn ranh vừa được vẽ. `ADR-0030` §5, phê chuẩn cùng ngày, viết:

> "site **không biết** khách đã trả hay chưa và không có trạng thái 'đã cọc'. Nếu sau này muốn
> QR mang nghĩa giữ chỗ thì đó là **ADR khác**, vì nó kéo theo trạng thái đơn mới, quy tắc hết
> hạn, và người đối soát tiền."

Câu tiếng Việt "giảm giá khi khách đặt **và thanh toán trước**" đọc thẳng ra là điều kiện neo
vào **tiền đã về** — tức đúng cái "ADR khác" §5 gọi tên. Chủ dự án chốt (2026-08-30) rằng
không phải: điều kiện neo vào **lựa chọn** của khách trên form. Phân biệt đó là toàn bộ lý do
ADR này ngắn được, và là thứ dễ bị đọc ngược nhất khi nhìn lại sau vài tháng.

## Quyết định

### 1. Ưu đãi là quy tắc giá thứ hai, sống cùng chỗ với mùa vụ

`data/prices.yaml` **giữ nguyên** — nguồn giá vẫn là trang tính Google Sheet
(`QĐ-2026-08-26-02`), Studio vẫn không giữ một con số tiền nào. Ưu đãi là **quy tắc**, đúng
loại thứ mà `ADR-0030` §3 đã giao cho Studio.

Nó được khai trong **chính tài liệu `bangGiaMuaVu`**, thêm hai ô:

| Ô | Kiểu | Ràng buộc |
|---|---|---|
| `batUuDai` | boolean | công tắc; tắt là biến mất khỏi mọi form |
| `phanTramUuDai` | number | 0–50, chặn ở Studio |

**Một con số toàn site**, không theo tour, không có khung thời gian chạy. Tài liệu đổi tiêu đề
từ *"Giá theo mùa"* thành *"Quy tắc giá"*: nó nay trả lời hai câu, không phải một.

Vì sao gộp chứ không mở tài liệu thứ hai: `ADR-0030` §3 đặt ra sự phân vai *trang tính trả lời
"bao nhiêu tiền", Studio trả lời "cộng trừ thế nào"*. Ưu đãi là câu thứ hai. Để chung thì Studio
có **đúng một chỗ** trả lời câu đó. Đổi tiêu đề rẻ vì loại tài liệu này vừa lên `main` cùng
ngày, biên tập chưa dùng thật buổi nào.

### 2. Điều kiện là LỰA CHỌN của khách, không phải sự thật thanh toán

Trên form có **hai nút chọn, bắt buộc chọn một**, không nút nào được chọn sẵn:

- *Chuyển khoản trước — giảm x%*
- *Thanh toán khi khởi hành*

Chọn cái đầu thì giá giảm **ngay trên form**. Đơn ghi lại lựa chọn đó. **Site không bao giờ
biết tiền đã về hay chưa** — nhân viên gọi lại xác nhận và tự đối soát ngân hàng, đúng như mọi
đơn hôm nay.

**Vì vậy ADR này không bước qua `ADR-0030` §5.** Không trạng thái đơn mới, không quy tắc hết
hạn giữ giá, không người đối soát trong hệ. Cột `payment_method` ghi **ý định của khách**,
không phải sự thật thanh toán — ai đọc tên cột rồi hiểu ngược là hiểu sai, và câu này nằm ở
đây để chặn đúng chuyện đó.

Không chọn nút bắt buộc **mặc định bật**: bỏ tick thì giá tăng lên trước mắt khách — cảm giác bị
đội giá — và sinh ra một đống đơn khai "sẽ chuyển khoản" mà khách không hề định thế.

**Vì sao đây không phải điều `00-PROJECT_BRIEF` cấm.** Brief §5 cấm nguyên văn *"Thanh toán trực
tuyến, giỏ hàng, quản lý chỗ trống"*, và §3 chốt *"Không có giỏ hàng, không thanh toán trên
site"*. Cả hai câu cấm một **cơ chế**: site nhận tiền. Ưu đãi này không thêm cơ chế nào — khách
chuyển khoản qua ngân hàng của chính họ, không có cổng thanh toán, không có ô nhập thẻ, không có
webhook báo tiền về, và site không lưu một dữ kiện tài chính nào ngoài số tiền tạm tính vốn đã
hiện trên form từ 2026-08-29. Thứ ADR này thêm là một **điều khoản giá**, cùng loại với giá mùa
vụ: một con số đổi theo một điều kiện quan sát được. Brief §3 vì vậy cần một dòng *"Bổ sung"*
ghi nhận ô chọn mới, đúng như `QĐ-2026-08-21-01` đã làm khi form đặt tour ra đời — không cần đảo
điều cấm nào.

### 3. Ưu đãi luôn áp, chồng lên giá mùa, một phép nhân và một lần làm tròn

Mùa neo vào **ngày khởi hành**; ưu đãi neo vào **lựa chọn thanh toán**. Hai trục khác nhau nên
không tranh nhau: cả hai cùng áp.

Phép tính gộp thành **một** biểu thức trong `computeQuote()` — hàm mà cả trình duyệt lẫn máy chủ
đang dùng chung (`BK5`):

```
giá = ceil( gốc × (100 + %mùa) × (100 − %ưu đãi) / 10000 / 1000 ) × 1000
```

**Làm tròn lên nghìn đúng một lần**, ở cuối. Áp hai bước rồi làm tròn hai lần thì khách chịu
thiệt 1.000₫/người vì một chi tiết cài đặt: `430.000 × 1,15` → 494.500, làm tròn thành 495.000,
rồi `× 0,95` → 470.250, làm tròn thành **471.000**; trong khi gộp một lần ra 469.775 → **470.000**.
Quét 63 cặp (9 mức giá đang có trong `data/prices.yaml` × 7 mức mùa thực tế, ưu đãi 5%) thì
**6 cặp lệch**, và lệch **luôn về phía bất lợi cho khách** — làm tròn lên hai lần thì không bao
giờ ra số nhỏ hơn. Không phần trăm nào khác 0 thì trả lại **nguyên giá gốc**, không làm tròn —
dòng bảo vệ này đã có sẵn cho mùa vụ và nay phải canh cả hai phần trăm.

> **Đính chính 2026-08-30** (cùng ngày phê chuẩn, trước khi thi công): bản đầu của mục này lấy
> ví dụ `730.000 · +20% · −5%` và ghi 832.000 so với 833.000. Bộ số đó **sai** — cả hai cách đều
> ra 833.000, nên nó không chứng minh được điều đang cần chứng minh. Quyết định không đổi; ví dụ
> thay bằng bộ số đã kiểm bằng máy ở trên. Ghi lại thay vì sửa lặng để người đọc sau biết con số
> nào đã được kiểm và kiểm bằng cách nào.

Hạng em bé giá 0 nhân bao nhiêu vẫn 0.

### 4. Đơn ghi hai thứ: ý định ở một cột, lý do ở `quoted_json`

- **Cột mới `payment_method`** (`transfer` | `onboard`, mặc định `onboard`), migration
  `0002_payment_method.sql`, có chỉ mục. Cột riêng chứ không nhét vào `quoted_json` vì bảng điều
  khiển vòng đầu (`ADR-0030` §2) sẽ phải lọc theo nó — lọc trên cột có chỉ mục, lọc trong JSON là
  quét cả bảng; và ý định của khách không phải một thành phần của báo giá.
- **`quoted.prepay = { percent, totalGoc }`** trong `quoted_json`, song song với `quoted.season`
  đã có. `totalGoc` là **tổng nếu khách không chọn chuyển khoản** (đã gồm mùa). Nó tồn tại vì
  chuyện khách chọn rồi không chuyển **sẽ** xảy ra, và khi đó nhân viên phải đọc được con số
  thay thế ngay trong đơn, không tính nhẩm ngược qua một phép làm tròn lên.

Đơn cũ nhận `onboard` — đúng sự thật lịch sử: trước tính năng này không đơn nào chọn chuyển khoản.

### 5. "Bắt buộc chọn" là luật của FORM, không phải của máy chủ

`BK1` cấm endpoint đọc Sanity, nên **máy chủ không biết công tắc ưu đãi đang bật hay tắt**. Nó
không có cách nào phân biệt "khách bỏ qua ô bắt buộc" với "site đang tắt ưu đãi nên không có ô
nào". Ép máy chủ đòi trường đó là ép nó đoán.

Nên:

- Vắng `paymentMethod` → máy chủ hiểu là `onboard`. Hợp đồng vẫn đóng.
- Máy chủ canh **một luật chéo**: có `quoted.prepay` thì `paymentMethod` **phải** là `transfer`.
  Một đơn khai "thanh toán khi khởi hành" mà vẫn mang giá đã giảm là mâu thuẫn tự thân — nhân
  viên đọc sẽ không biết tin ô nào. Lệch → 400.
- Phép kiểm `total === Σ(perPax × count)` **không đổi một dòng**: ưu đãi đã gấp vào `perPax`.
  `BK5` nguyên vẹn, `BK1` nguyên vẹn.

Khác mùa vụ ở đúng một chỗ, và là chủ ý: mùa khai hỏng thì **bỏ qua im lặng**; ưu đãi khai hỏng
mà `paymentMethod = transfer` thì **báo lỗi**. Vì một đơn không được phép mang giá đã giảm mà
không có dòng nào giải thích tại sao.

**Ưu đãi không phải hàng rào an ninh.** Ai sửa payload cũng chỉ tự khai một con số mà nhân viên
sẽ chốt lại khi gọi — y hệt mùa vụ hôm nay. Máy chủ kiểm **nhất quán số học**, không kiểm **đúng
giá**, đúng bản chất "yêu cầu đặt" của `ADR-0027`.

### 6. Chỉ hiện trong form; nhãn giá và JSON-LD giữ giá đầy đủ

Nhãn *"Giá từ…"* trên thẻ tour, hero, và `Offer` trong JSON-LD **không đổi một chữ**. Ưu đãi chỉ
xuất hiện khi khách đã mở form đặt tour. Giá công bố ra ngoài không phải giá có điều kiện — vừa
tránh rủi ro với rich result của Google, vừa không phải chạm tầng `resolver` và khuôn nhãn giá,
nơi ảnh hưởng tới **mọi** loại trang chứ không riêng tour.

## Phương án bị loại

| Phương án | Vì sao loại |
|---|---|
| **Neo vào tiền đã về thật** | đúng cái `ADR-0030` §5 gọi là "ADR khác": kéo theo trạng thái đơn mới, quy tắc hết hạn, người đối soát ngân hàng, và buộc lớp quản trị phải xong trước. Chủ dự án chốt không đi đường này ở vòng đầu |
| **Hàm riêng áp *sau* `computeQuote()`** | hai khái niệm tách file đọc sạch hơn, nhưng **làm tròn hai lần** (khách thiệt tới 1.000₫/người) và có **hai chỗ cùng dựng `perPax`** — đúng loại lệch mà Task 6 của mùa vụ vừa vấp: mùa tính đúng ở trình duyệt nhưng không bao giờ tới máy chủ |
| **Chỉ ghi ý định, không đổi con số trên form** | rẻ nhất, không migration, nhưng khách bấm vào ô ghi "giảm x%" mà giá không nhúc nhích — gần như không đẩy được đơn chuyển khoản nào |
| **Mỗi tour một mức riêng** (khai trong tài liệu Tour) | 29 tour là 29 chỗ phải nhớ sửa, và đi ngược nguyên tắc `ADR-0030` §3 là quy tắc giá sống tập trung, không rải vào từng entity |
| **Có khung thời gian chạy đợt khuyến mại** | trang tĩnh dựng lúc nào thì chốt lúc đó; đợt hết hạn giữa đêm không tự biết, phải thêm cơ chế dựng lại theo lịch. Chủ dự án chọn công tắc tay |
| **Đổi luôn nhãn giá khắp site** | phải sửa tầng `resolver` và khuôn nhãn giá (đụng mọi loại trang), và khai giá có điều kiện trong JSON-LD là rủi ro với rich result |
| **Ô tick mặc định BẬT** | bỏ tick thì giá tăng trước mắt khách; và sinh đơn khai "sẽ chuyển khoản" mà khách không định thế |
| **Ưu đãi không áp trong mùa tăng giá** | giữ được biên mùa cao điểm, nhưng khách tick ô mà giá không đổi sẽ thắc mắc, và luật thành hai tầng ngoại lệ phải giải thích |

## Hệ quả

- **Được:** một câu chữ khuyến mại có thật đằng sau con số; đơn ghi đủ để dựng lại vì sao ra giá
  đó, kể cả sau khi quy tắc đã sửa; tắt là tắt sạch, không phải sửa mã.
- **Mất:** thêm một cột D1 và một migration phải chạy khi phát hành; `computeQuote()` nay gánh
  hai khái niệm nên chú thích thứ tự phép tính là bắt buộc, không phải trang trí;
  `01-CONTENT_MODEL` §2.16 và cổng `g1` phải cập nhật cùng lúc với schema.
- **Không đụng:** `ADR-0007` (nguồn giá đọc lúc dựng), `BK1`–`BK5`, `ADR-0030` §5 (site không
  biết tiền đã về), tiền đề "đơn là yêu cầu đặt" của `ADR-0027`, nhãn giá và JSON-LD.
- **Nợ mở, DRI chủ dự án:** hệ **không đo được** chuyện khách chọn chuyển khoản rồi không
  chuyển. Đó là điểm mù cho tới khi bảng điều khiển `ADR-0030` §2 có mặt và thêm bộ lọc để đếm.
  Nếu tỷ lệ đó cao thì tính năng này đang cho không x%. Đếm được nó nên là **điều kiện của vòng
  sau**, không phải việc làm nếu rảnh.
- **Nợ mở, DRI chủ dự án (ghi thêm 2026-08-30, sau rà soát cuối nhánh):** đường de-duplicate
  của endpoint (trùng tour + ngày + số điện thoại trong 24h) trả về **mã đơn đã lưu** nhưng
  dựng tóm tắt xác nhận trên màn hình từ **payload vừa nộp**. Khách nộp lần đầu chọn *"Thanh
  toán khi khởi hành"* — nhân viên đã nhận báo với dòng "Thanh toán: Khi khởi hành" — rồi trong
  24h nộp lại đổi sang *"Chuyển khoản trước"*: màn hình khách hiện tổng **đã giảm**, nhưng dòng
  lưu trong D1 vẫn là đơn cũ, `payment_method = onboard`, giá gốc, và **không có thông báo thứ
  hai** đi ra. Nhân viên gọi lại theo báo cũ sẽ nói ngược với điều khách vừa thấy trên form.
  Hành vi de-duplicate **có từ trước tính năng này** (đổi số khách rồi nộp lại trong 24h đã
  từng lệch tổng so với đơn lưu theo đúng cách này); ưu đãi chỉ thêm một trục lệch vào một điểm
  mù đã có sẵn, và sửa đường de-duplicate là đổi hành vi chưa ai duyệt — ngoài phạm vi ADR này,
  **chưa sửa**. Giảm nhẹ hiện có: `x` là một con số **toàn site** (§1), nên nhân viên biết mức
  ưu đãi đang áp và có thể tự áp đúng khi gọi lại, bất kể dòng lưu ghi gì.
- **Ranh giới không nới:** `00-PROJECT_BRIEF` §5 "không thanh toán, không giỏ hàng, không quản lý
  chỗ trống" còn nguyên. Ai muốn ưu đãi này mang nghĩa giữ chỗ là quyết định mới.
