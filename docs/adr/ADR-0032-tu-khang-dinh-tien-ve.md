# ADR-0032 — Site tự khẳng định tiền đã về: sổ cái ngân hàng, khớp theo mã đơn, cửa sổ giữ chỗ 24 giờ

<!-- ═══════════════════════════════════════════════════════════════════
Đây là "ADR khác" mà ADR-0030 §5 đã gọi tên trước và chừa chỗ sẵn. Nó ĐẢO tiền đề
"site không biết tiền đã về" của ADR-0027 / ADR-0030 §5 / 00-PROJECT_BRIEF §5.
Cơ chế tái dùng được cho mọi site: (1) sự thật tiền sống trong SỔ CÁI CHỈ THÊM, không
phải một cột boolean; (2) nhà cung cấp dữ liệu ngân hàng là chi tiết THAY ĐƯỢC sau một
hợp đồng dữ liệu của riêng mình; (3) trạng thái thanh toán và hết hạn là thứ SUY RA lúc
đọc, không phải thứ lưu. Ngân hàng, con số 24 giờ, và câu chữ là của site này.
═══════════════════════════════════════════════════════════════════ -->

- **Trạng thái:** **ĐÃ PHÊ CHUẨN 2026-08-31** — sáu điểm thiết kế chốt lần lượt trong phiên
  brainstorm cùng ngày, toàn văn được chủ dự án duyệt (`QĐ-2026-08-31-02`). Điểm thứ sáu do
  chủ dự án thêm **sau khi đọc bản đề xuất**: phần lõi phải độc lập với việc chọn ngân hàng,
  vì site có thể **thêm hoặc đổi** ngân hàng — xem quyết định 2b
- **Ngày:** soạn và phê chuẩn 2026-08-31   **Người soạn:** Claude (qua Cowork)
  **Người phê chuẩn:** Lưu Tuấn Vũ (chủ dự án)
- **Loại quyết định:** **hỗn hợp.** Phần kỹ thuật là cửa **hai chiều** — gỡ route, xoá bảng
  `bank_txn`, đơn trở lại đúng nghĩa cũ, không dòng dữ liệu nào của đơn đổi nghĩa. Phần
  **không** hai chiều nằm ngoài kho mã: (a) lời hứa với khách — một khi trang tra đơn đã nói
  *"đã nhận đủ tiền"* thì rút lại là rút một cam kết, không phải revert một commit; (b) việc
  giao quyền đọc tài khoản ngân hàng công ty cho một bên thứ ba — đã giao thì không thu hồi
  được phần đã lộ, chỉ ngắt được về sau.
- **Đảo:** `ADR-0027` (*"thanh toán / đặt cọc online — ngoài phạm vi"*, phần **đặt cọc**),
  `ADR-0030` §5 (*"site không biết khách đã trả hay chưa và không có trạng thái đã cọc"*),
  `00-PROJECT_BRIEF` §5 và §3 ở phần **webhook báo tiền**
- **KHÔNG đảo:** `ADR-0031` §2 (`payment_method` là **ý định**, không phải sự thật tiền) —
  xem quyết định 3; `ADR-0007`; `BK1`–`BK5`; `ADR-0030` §4
- **Liên quan:** `ADR-0030` §2 (bảng điều khiển — nợ, chưa có), `04-CONSTRAINTS` §1d,
  `docs/specs/SPEC-2026-08-31-tu-dong-doi-soat-chuyen-khoan.md`,
  `docs/specs/SPEC-2026-08-31-qr-thanh-toan-va-zns.md` §4.3 §4.4

## Bối cảnh

`ADR-0030` §5, phê chuẩn 2026-08-30, viết nguyên văn:

> "site **không biết** khách đã trả hay chưa và không có trạng thái 'đã cọc'. Nếu sau này muốn
> QR mang nghĩa giữ chỗ thì đó là **ADR khác**, vì nó kéo theo trạng thái đơn mới, quy tắc hết
> hạn, và người đối soát tiền."

Ngày 2026-08-31 chủ dự án yêu cầu đúng việc đó: *khách tạo đơn và chuyển khoản thì hệ tự ghi
nhận và biết giao dịch nào đã hoàn tất*. Đây là ADR ấy. Ba hệ quả §5 tiên đoán không được lờ
đi — quyết định 4, 5 và 6 dưới đây là ba câu trả lời cho đúng ba thứ đó.

Bối cảnh kỹ thuật đã có sẵn từ hôm trước, và nó là lý do việc này rẻ hơn tưởng: mã QR VietQR
đang chạy thật trên tourdao.vn đặt **nội dung chuyển khoản là mã đơn bỏ gạch nối**
(`TD260831K7QM`), và chú thích trong `src/lib/booking/payment-qr.ts` đã viết sẵn *"bảng điều
khiển đối soát sau này phải khớp theo DẠNG NÀY"*. Cái móc để nối tiền về với đơn đã nằm sẵn
trong sản phẩm đang chạy; ADR này không phải dựng nó, chỉ phải dùng nó.

### Sự thật về ngân hàng, tra ngày 2026-08-31, không lấy từ trí nhớ

Tài khoản nhận tiền hôm nay là **Techcombank `2502503979`, tài khoản doanh nghiệp**
(`src/site.config.ts`, khối `banking`).

- Tài liệu lập trình của **SePay** (`developer.sepay.vn`, tải nguyên trang về đọc) liệt kê
  **mười** ngân hàng hỗ trợ webhook — ACB, BIDV, MBBank, MSB, KienlongBank, OCB, Sacombank,
  TPBank, VietinBank, VPBank — và kết bằng câu *"Ngân hàng không có trong bảng thì chưa hỗ trợ
  webhook."* **Techcombank không có trong bảng.** Trang blog "API Techcombank" của cùng site là
  bài SEO, không phải danh sách hỗ trợ.
- **payOS** hỗ trợ tài khoản **doanh nghiệp** ở MB, KienlongBank, OCB, BIDV, Shinhan.
  **Không có Techcombank.**
- **Casso** và **Pay2S** đều liệt kê Techcombank ở trang giới thiệu. Casso liên kết bằng
  **thông tin đăng nhập internet banking có quyền ra lệnh**. Pay2S chia hai loại kết nối —
  *OpenAPI* (hợp tác chính thức với ngân hàng) và *Pay2S API* (tự phát triển) — và **không công
  bố ngân hàng nào thuộc loại nào**.
- Techcombank không có sản phẩm API công khai; đường chính thức là gói **BusinessOne Connect**
  của Techcombank Business, phải qua ngân hàng.

Chủ dự án chốt (2026-08-31): **giữ tài khoản Techcombank**, và phạm vi thu hẹp đúng vào *"nhận
webhook bắn tin có biến động số dư"*. Việc chốt nhà cung cấp nào là **thủ tục của chủ dự án**,
không phải quyết định kiến trúc — quyết định 2 giải thích vì sao tách được như vậy.

## Quyết định

### 1. Đảo cái gì, giữ cái gì — nói bằng bảng để không ai đọc rộng ra

| Phát biểu cũ | Nay |
|---|---|
| `ADR-0027`: "thanh toán / đặt cọc online — ngoài phạm vi" | **Đảo phần "đặt cọc".** Site nay **biết** tiền đã về. Vẫn **không** có cổng thanh toán, không ô nhập thẻ, không nhận tiền qua site — tiền vẫn đi thẳng từ ngân hàng của khách vào ngân hàng của công ty |
| `ADR-0030` §5: "site không biết khách đã trả hay chưa" | **Đảo.** Đây chính là "ADR khác" mà §5 dự trù |
| `ADR-0030` §5: "không có trạng thái đã cọc" | **Đảo một nửa.** Có trạng thái **đã thanh toán đủ**; **không** có trạng thái "đã cọc một phần" — quyết định 4 |
| `00-PROJECT_BRIEF` §5: "Thanh toán trực tuyến" | **Giữ nguyên điều cấm.** Site không nhận tiền. Thứ thêm vào là một đường **đọc** biến động số dư |
| `SPEC-2026-08-31` §3: "không webhook báo tiền" | **Đảo.** Câu đó đúng cho đợt QR; đợt này chính là đợt gỡ nó |
| `ADR-0031` §2: `payment_method` là **ý định** | **GIỮ NGUYÊN, không nới một chữ** — quyết định 3 |
| `00-PROJECT_BRIEF` §5: "giỏ hàng, quản lý chỗ trống" | **Giữ nguyên.** Cửa sổ 24 giờ là hạn của một **đơn**, không phải cơ chế giữ ghế trên một sức chứa |

Brief §3 và §5 cần một dòng *"Bổ sung 2026-08-31"* đúng khuôn `QĐ-2026-08-21-01` và
`QĐ-2026-08-30-01` đã làm — nhưng lần này là **đảo một điều cấm**, không phải làm rõ một điều
cấm. Phải viết đúng như vậy, vì hai lần trước đã cẩn thận nói *"không đảo"*, và người đọc sau
sẽ đối chiếu.

### 2. Nhà cung cấp là chi tiết thay được; hợp đồng là `BankTxn` của riêng mình

Ba nhà cung cấp bắn về ba hình dạng JSON khác nhau, nhưng cùng **sáu dữ kiện**: mã giao dịch
của nhà cung cấp, thời điểm ngân hàng ghi nhận, số tài khoản, số tiền, chiều vào/ra, nội dung
chuyển khoản. Đó là toàn bộ thứ hệ này cần.

Nên **`BankTxn` là hợp đồng, không phải payload của ai cả.** Mỗi nhà cung cấp có một hàm chuyển
đổi thuần — không mạng, không D1, nhận JSON thô trả `BankTxn` — đúng khuôn `BK5` mà
`payment-qr.ts` và `quote.ts` đang theo. Đổi nhà cung cấp là thêm một file và đổi một dòng cấu
hình; phần còn lại của hệ không biết nhà cung cấp tên gì.

Vì vậy **câu hỏi "Casso hay Pay2S hay BusinessOne Connect" không chặn thiết kế và không chặn
thi công phần lõi.** Nó chỉ chặn bước xác minh đầu-cuối. Đây là chủ ý, không phải né tránh: nếu
để nhà cung cấp quyết định hình dạng dữ liệu bên trong hệ thì đổi nhà cung cấp thành viết lại.

### 2b. Và cũng độc lập với NGÂN HÀNG: nhiều tài khoản, nhiều nhà cung cấp cùng lúc

Chủ dự án thêm ràng buộc này ngày 2026-08-31: *"phần lõi nên độc lập với việc chọn ngân hàng
gì, vì có thể chúng ta sẽ thêm / đổi ngân hàng."*

Ràng buộc đó **không phải dự phòng cho tương lai xa — nó là điều kiện để đổi ngân hàng an
toàn.** Đơn đã tạo mang mã QR trỏ **tài khoản cũ**; khách quét sau khi công ty đã chuyển sang
tài khoản mới thì tiền vẫn về tài khoản cũ. Hệ chỉ nhận đúng một số tài khoản là **mất dấu cả
một lứa tiền đang trên đường về**, đúng vào ngày chuyển đổi.

Ba chỗ phải mở sẵn, và cả ba đều rẻ vì mở **ngay từ đầu**:

1. **Tập tài khoản nhận tiền, không phải một số.** `banking.accountNumber` vẫn là tài khoản
   **đang in lên QR** — một nguồn duy nhất cho QR, không đụng `payment-qr.ts`. Thêm
   `banking.alsoAccept: readonly string[]` (mặc định rỗng) là **các tài khoản vẫn còn nhận
   tiền nhưng không còn in lên QR**. Đổi ngân hàng = đổi `accountNumber` và đẩy số cũ sang
   `alsoAccept`. Vẫn một khối, vẫn một nguồn sự thật về "tài khoản của công ty".
2. **Nhiều nhà cung cấp cùng lúc.** Thêm ngân hàng thứ hai có thể kéo theo nhà cung cấp thứ
   hai (không ai phủ hết mọi ngân hàng — đó là bài học của chính lần tra này). Nên đường vào
   là `/api/bank-webhook/<nhà cung cấp>`, mỗi nhà cung cấp một bí mật riêng. Một nhà cung cấp
   bị lộ khoá không kéo theo nhà cung cấp kia.
3. **Sổ cái đã đa ngân hàng sẵn.** `bank_txn` lưu cả `provider` lẫn `account_number`, và khoá
   chống trùng là `(provider, provider_txn_id)` chứ không phải `provider_txn_id` một mình.
   Điều này **không phải sửa gì thêm** — quyết định 3 đã ra như vậy trước khi có ràng buộc
   này, và nay hoá ra đó là lý do không cần migration lần hai.

Thứ **không** mở: hệ vẫn chỉ khớp theo **mã đơn**, không theo tài khoản đích. Nhiều tài khoản
không đẻ ra nhiều luật khớp.

### 3. Sự thật tiền sống ở sổ cái riêng; `payment_method` không đổi nghĩa

`ADR-0031` §2 viết cột `payment_method` ghi **ý định của khách**, và viết thêm câu *"ai đọc tên
cột rồi hiểu ngược là hiểu sai, và câu này nằm ở đây để chặn đúng chuyện đó"*.

ADR này **không làm câu đó thành nói dối**. Ba trục tách bạch, mỗi trục một chỗ:

| Trục | Ở đâu | Ai đổi |
|---|---|---|
| Quy trình bán hàng | `booking.status` (`new`→`contacted`→`confirmed`→`cancelled`) | nhân viên |
| **Ý định** thanh toán | `booking.payment_method` | khách, lúc đặt, một lần |
| **Sự thật** tiền | bảng mới `bank_txn`, **chỉ thêm dòng** | ngân hàng, qua webhook |

Và trạng thái thanh toán **không được lưu** ở đâu cả: nó là `SUM(amount)` của các dòng khớp mã
đó, tính lúc đọc. Ba lý do, theo thứ tự quan trọng:

1. **Một sự thật một chỗ** (P6/N7). Một cột `is_paid` cạnh một sổ cái là hai nguồn cho cùng một
   câu, và chúng **sẽ** lệch nhau.
2. **Khớp sai sửa được rẻ.** Sửa `matched_code` của một dòng là xong; không phải đi đồng bộ
   thêm một cột cho khớp.
3. **Không tồn tại đường nào** để một đơn nói "đã trả" trong khi sổ không có đồng nào. Đó là
   thứ duy nhất đáng gọi là bảo đảm ở một hệ dính tới tiền.

Bảng `bank_txn` có `UNIQUE (provider, provider_txn_id)`. Chống ghi trùng phải là **cấu trúc**,
không phải một câu `if` — mọi webhook đều bắn lại khi không nhận được `200`, và SePay ghi rõ
bắn lại tới bảy lần theo dãy Fibonacci.

### 4. Khớp theo MÃ ĐƠN, không bao giờ theo số tiền; và đủ 100% mới khẳng định

Bốn bước, dừng ở bước đầu tiên không qua; không qua thì `matched_code = NULL` và **có người
được báo**, không im lặng:

1. Chuẩn hoá nội dung: bỏ mọi ký tự không phải chữ/số, viết hoa. Ngân hàng chèn thêm chữ
   (`CHUYEN TIEN`, mã `FT26…`, tên người gửi) nên phải **tìm mã ở bất kỳ đâu trong chuỗi**.
2. Bắt mã theo khuôn `TD` + 6 chữ số + 4 ký tự thuộc `CODE_ALPHABET`.
3. Tra đơn theo mã.
4. Đối chiếu số tiền với `quoted_json.total` **đang lưu trong D1 của mã đó**.

**Không đoán theo số tiền, kể cả khi chỉ có một đơn trùng số.** Ưu đãi trả trước 5% kéo rất
nhiều đơn về cùng một tổng; một lần đoán đúng chín lần sẽ dạy người vận hành tin vào lần thứ
mười.

**Đối chiếu với con số trong D1, không phải con số form vừa hiện.** Luật đơn trùng của
`handler.ts` trả **mã cũ** trong khi mọi con số dựng từ lần nộp **mới**, nên một mã có thể ứng
với hai tổng khác nhau — điểm mù đã ghi ở `ADR-0031` "Nợ mở". ADR này **không sửa** điểm mù đó
(ngoài phạm vi), nhưng **không được xây lên trên nó**: nguồn duy nhất để so là `quoted_json`.
Lệch thì vào hàng chờ, người xử.

**Đủ hoặc dư → đã thanh toán. Thiếu → không.** Không có dung sai, và có lý do: phí chuyển khoản
do người gửi trả nên tiền vào đúng số. Dư thì ghi chú để nhân viên hoàn. Nhiều lần chuyển cộng
dồn chạm đủ thì khẳng định tại giao dịch làm tổng chạm ngưỡng — sổ cái cộng được, một cột
boolean thì không.

### 5. Hết hạn 24 giờ là hàm SUY RA lúc đọc, không phải việc chạy theo lịch

```
quá hạn giữ chỗ  =  payment_method = 'transfer'
                    AND chưa đủ tiền
                    AND now > min(created_at + 24h, ngày khởi hành 00:00 giờ VN)
```

Thuần từ dữ liệu đã có. **Không thêm Cron Trigger** — `SPEC-2026-08-31` §3 vừa từ chối thêm
Cron trong đợt trước, và ADR này không cần nó để đảo thêm. Muốn có tin **bắn ra đúng lúc đơn
hết hạn** thì đó mới cần lịch, và đó là đợt sau.

Tiền về **sau** hạn: vẫn ghi sổ, vẫn khớp, gắn nhãn `trả sau hạn`, và **hệ không tự quyết**.
Quá hạn cũng **không** tự tính lại giá: ưu đãi 5% mất hiệu lực là việc nhân viên nói với khách,
không phải việc máy sửa một con số đã lưu trong `quoted_json`.

### 6. Hệ không bao giờ tự huỷ đơn và không bao giờ tự hoàn tiền

Hai việc này cần con người, vĩnh viễn, kể cả khi có bảng quản trị. Đây là ranh giới của cả ADR:
tự động hoá dừng ở chỗ **ghi nhận và khẳng định**; mọi hành động **làm mất tiền của ai đó** —
huỷ chỗ đã trả, chuyển tiền ra — nằm ngoài.

Tương ứng ở tầng dữ liệu: `bank_txn` **chỉ thêm dòng**. Không `DELETE`, không `UPDATE` số tiền.
Sửa duy nhất được phép là `matched_code` và `match_note` — tức sửa **phán đoán của ta**, không
sửa **sự kiện của ngân hàng**.

### 7. Khách biết qua trang tra đơn `/dat-tour/<mã>/`, và trang đó lộ ít nhất có thể

ZNS vẫn chặn ở ba thủ tục Zalo của chủ dự án, nên kênh duy nhất tự chủ được là trang tra đơn —
vốn đã nợ ở `SPEC-2026-08-31` §4.4. Nay nó gánh thêm **sự thật tiền**, nên §4.4 phải được đọc
lại dưới ánh sáng mới:

Mã đơn là `TD-yymmdd-XXXX` với **bốn ký tự ngẫu nhiên trên bảng 31 chữ** → `31⁴ ≈ 923.000` khả
năng mỗi ngày, mà phần ngày **đoán được**. Con số đó đủ khi trang chỉ hiện một *yêu cầu đặt*.
Nó **mỏng hơn** khi trang hiện tiền. Không mở lại quyết định "không có lớp đăng nhập" của §4.4;
thay vào đó **giới hạn thứ trang nói ra**: mã đơn, tên tour, ngày khởi hành, tổng tiền, và một
dòng trạng thái. Không danh sách giao dịch, không số tài khoản người gửi, không số tiền từng
lần, và **không một mẩu PII nào** (`BK3`). Cộng giới hạn tần suất theo IP trên chính route đó.

Dò trúng một mã vẫn phải là chuyện chỉ lộ *một dòng trạng thái của một đơn*, không phải một
cửa sổ nhìn vào sổ sách.

## Phương án bị loại

| Phương án | Vì sao loại |
|---|---|
| **Mở tài khoản doanh nghiệp mới ở ngân hàng có webhook chính thức** (MB, ACB, BIDV, OCB) | Đường chắc chắn nhất về kỹ thuật — nhà cung cấp công bố hỗ trợ, không phải đưa mật khẩu internet banking cho ai. **Chủ dự án chốt 2026-08-31 giữ Techcombank**, đây là quyết định vận hành của chủ tài khoản. Ghi lại để lần sau còn biết đường này từng được cân |
| **Tài khoản ảo (VA) theo từng đơn** | Khớp tuyệt đối theo số tài khoản, xoá sạch lớp lỗi "khách gõ sai nội dung". Nhưng QR phải dựng ở máy chủ **sau một cuộc gọi API**, tức cắm một phụ thuộc bên ngoài **vào đường tạo đơn** — thứ `0001_booking.sql` viết rõ là không được phép hỏng. Và mọi ngân hàng cấp VA đều không phải Techcombank |
| **Cổng thanh toán** (payOS, VNPay, MoMo) | Đảo `00-PROJECT_BRIEF` §5 rộng hơn hẳn — site thành nơi **nhận tiền**, kéo theo hoàn tiền, đối soát cổng, phí giao dịch. Và payOS không hỗ trợ tài khoản doanh nghiệp Techcombank |
| **Lưu trạng thái "đã trả" thành một cột trên `booking`** | Hai nguồn sự thật cho cùng một câu hỏi; sẽ lệch. Xem quyết định 3 |
| **Khớp theo số tiền khi nội dung không có mã** | Ưu đãi 5% kéo nhiều đơn về cùng tổng. Đoán đúng vài lần rồi sai một lần với tiền thật thì tệ hơn không đoán |
| **Cron Trigger để đánh dấu đơn hết hạn** | Không cần: hết hạn suy ra được lúc đọc. Chỉ cần lịch khi muốn **bắn tin ra ngoài** đúng lúc lapse — đợt sau |
| **Đọc thư báo biến động số dư của ngân hàng rồi bóc tách** | Rẻ và không phải giao mật khẩu cho ai. Nhưng buộc phải bóc theo **định dạng thư của đúng một ngân hàng**, và không có gì bảo đảm thư mang một **mã giao dịch ổn định** — mà không có mã ổn định thì không chống được ghi trùng, tức mất đúng bảo đảm quan trọng nhất của quyết định 3. **Chưa tra định dạng thư thật của Techcombank**; nếu đường nhà cung cấp bế tắc thì đây là thứ đáng tra trước tiên |
| **Ứng dụng SePay Mobile đọc thông báo từ app ngân hàng** | Đã tra: ứng dụng đó **hiển thị** giao dịch SePay lấy được qua API cho nhân viên xem, **không phải** đường đưa dữ liệu vào. Không giải được bài toán Techcombank |

## Hệ quả

- **Được:** tiền về là biết ngay, không chờ ai mở app ngân hàng ra dò; khách tự xem được trạng
  thái đơn của mình mà không cần gọi điện; mọi giao dịch có bản gốc lưu lại, cãi nhau với ngân
  hàng có bằng chứng; nhà cung cấp đổi được mà không viết lại hệ.
- **Mất:** một route công khai nữa phải giữ an toàn (trước nay chỉ có `/api/dat-tour`); một
  bảng D1 nữa và một migration phải nhớ chạy **trước** khi merge; một phụ thuộc vận hành vào
  một nhà cung cấp bên ngoài — họ chết thì đối soát về lại thủ công (đúng hiện trạng hôm nay,
  nên là suy giảm chứ không phải sập); và một bề mặt công khai nay nói về tiền.
- **Không đụng:** `payment-qr.ts` (không một dòng — kể cả khi thêm `alsoAccept`, vì QR chỉ đọc
  `accountNumber`), `computeQuote()`, `BK1`–`BK5`, `ADR-0007`,
  nhãn giá, JSON-LD, luật đơn trùng, `booking.status`, `booking.payment_method`.
- **Nợ mở, DRI chủ dự án — CHẶN việc xác minh đầu-cuối:** chưa chốt nhà cung cấp, và **chưa ai
  xác nhận** có nhà cung cấp nào đọc được tài khoản **doanh nghiệp** Techcombank. Phải hỏi
  thẳng Casso và Pay2S hai câu: *có nhận tài khoản doanh nghiệp Techcombank không*, và *kết nối
  bằng cách nào*. Lõi thi công được trước, nhưng **không được tuyên bố tính năng đã chạy** khi
  chưa có một đồng thật đi qua đường đó.
- **Nợ mở, DRI chủ dự án — rủi ro không thuộc kho mã:** nếu đường duy nhất khả thi là giao
  **thông tin đăng nhập internet banking của tài khoản công ty** cho bên thứ ba, đó là quyết
  định về rủi ro tài chính, không phải quyết định kỹ thuật. Cần đọc điều khoản của ngân hàng
  về việc chia sẻ thông tin đăng nhập trước khi làm.
- **Nợ mở:** hàng chờ giao dịch không khớp đi qua **kênh báo tin**, vì chưa có bảng quản trị
  (`ADR-0030` §2 vẫn nợ). Chấp nhận được ở lưu lượng hôm nay; không chấp nhận được khi tin bắt
  đầu trôi. Bảng quản trị nên là **điều kiện của vòng sau**, không phải việc làm nếu rảnh.
- **Nợ mở đã biết, không sửa ở đây:** luật đơn trùng khiến một mã ứng với hai tổng
  (`ADR-0031` "Nợ mở"). ADR này tránh chứ không vá — xem quyết định 4.
