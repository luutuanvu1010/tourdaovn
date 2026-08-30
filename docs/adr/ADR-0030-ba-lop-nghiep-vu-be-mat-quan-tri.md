# ADR-0030 — Ba lớp: nghiệp vụ, bề mặt, quản trị

<!-- ═══════════════════════════════════════════════════════════════════
Quyết định RIÊNG của tourdaovn về việc chia hệ thành ba lớp có ranh giới được máy canh.
Cơ chế tái dùng được cho mọi site: (1) nghiệp vụ thuần, không biết mình chạy ở đâu;
(2) một nguồn token sinh ra nhiều dạng bề mặt, kể cả dạng không dùng được biến CSS;
(3) quản trị dựng trên CMS đã có thay vì mở một mặt phẳng điều khiển thứ hai.
Nội dung nghiệp vụ cụ thể (mùa vụ, trạng thái đơn, QR chuyển khoản) là của site này.
═══════════════════════════════════════════════════════════════════ -->

- **Trạng thái:** ĐÃ PHÊ CHUẨN 2026-08-30 (chủ dự án duyệt sau ba vòng sửa: bảng điều khiển
  chuyển vào Studio, trang tính giữ vai nguồn giá duy nhất, mùa vụ là danh sách có thứ tự)
- **Ngày:** 2026-08-30
- **Người soạn:** Claude (qua Cowork) · **Người phê chuẩn:** Lưu Tuấn Vũ
- **Thay thế / bổ sung:** bổ sung `ADR-0027` (module đặt tour); mở một mục mà
  `07-DESIGN_TOKENS` §0.4 đã chừa cửa; không đảo `ADR-0007` (nguồn giá) và không nới `BK1`.

## Bối cảnh

Module đặt tour đã chạy thật trên production từ 2026-08-29: 29 tour có form, đơn vào D1, báo
tin qua email và Zalo. Ngay tuần đầu đã lộ ra rằng hệ **không có chỗ để đặt việc mới**:

- **Nghiệp vụ nằm rải.** Giá chỉ có hai hình dạng (`flat`, `tiers`), không có khái niệm thời
  gian, nên giá mùa vụ không có chỗ khai. Trạng thái đơn chỉ có đúng một giá trị `new` và
  không ai định nghĩa cái tiếp theo.
- **Bề mặt có hai nửa không nối nhau.** `tokens.css` phục vụ web rất tốt — `BookingForm.astro`
  dùng 35 chỗ. Nhưng `notify/format.ts` và `html.ts` viết cứng `#0C4A6E`, `#96271A`, `#F8FAFC`,
  `system-ui`, cỡ chữ 22px, vì **email không hiểu biến CSS** và không có đường nào khác đang
  tồn tại. Đổi màu thương hiệu hôm nay là đổi web, còn thư báo đơn giữ nguyên màu cũ.
- **Quản trị không tồn tại.** Xem đơn phải gõ `wrangler d1 execute`. Truy vấn "đơn chưa báo
  được" có trong SPEC §4.6 nhưng **chưa ai từng chạy** — nghĩa là nếu một đơn không tới tay
  ai, không cơ chế nào phát hiện.

Ba khoảng trống này không độc lập. Giá mùa vụ (nghiệp vụ) phải hiện ra trong thư báo đơn
(bề mặt) và phải đối chiếu được khi nhân viên gọi khách (quản trị).

## Quyết định

### 1. Chia hệ thành ba lớp, ranh giới do validator canh

**Lớp nghiệp vụ** giữ mọi quy tắc kinh doanh và **không được biết** mình chạy trên web, trong
email, hay trong máy chủ. Đầu vào và đầu ra là dữ liệu thuần. Tiêu chí nhận biết lớp này còn
đúng: **mọi quy tắc trong đó kiểm được bằng test chạy dưới một giây, không trình duyệt, không
mạng, không cơ sở dữ liệu.** Phần lớn đã có sẵn và đang thuần: `quote.ts`, `schema.ts`,
`code.ts`, `vn-date.ts`.

**Lớp bề mặt** giữ mọi thứ con người nhìn thấy: trang web, thư báo đơn, tin Zalo, và bảng điều
khiển trong Studio. Một nguồn token sinh ra **hai dạng đầu ra** (§3).

**Lớp quản trị** là nơi người vận hành nhìn và tác động, và **không được đi tắt xuống D1** —
mọi thao tác qua lớp nghiệp vụ, để một quy tắc chỉ tồn tại ở một chỗ.

**Ba luật, mỗi luật một cổng máy:**

| Luật | Cách canh |
|---|---|
| Nghiệp vụ không nhập khẩu bề mặt hay hạ tầng | validator kiểm quan hệ import, cùng khuôn `BK1` đang dùng |
| Bề mặt không chứa quy tắc kinh doanh (không tự tính giá) | validator: thư mục bề mặt không được import module tính giá ngoài hàm dùng chung |
| Quản trị không viết SQL rải rác | validator: chỉ tầng lưu trữ được chứa câu SQL |

Ranh giới không có máy canh sẽ trôi. `notify/format.ts` viết cứng màu **từ ngày đầu** mà không
ai chặn, chính vì chưa có luật nào để chặn.

### 2. Bảng điều khiển là một tab trong Sanity Studio, không phải mặt phẳng thứ hai

Chủ dự án chốt: **ai vào được Sanity CMS thì vào được bảng điều khiển**. Câu đó không phải một
yêu cầu phải đi dựng — nó **tự đúng** nếu bảng điều khiển sống trong chính Studio đã có
(`tourdaovn.sanity.studio`, cấu hình ở `cms/sanity.config.ts`, hiện dùng `structureTool` +
`languageFilter`). Sanity cho phép gắn thêm tab công cụ riêng vào Studio.

Ba thứ được gỡ cùng lúc:

- **Không có cửa một chiều nào phải bước qua.** Bản trước của ADR này cảnh báo rằng thêm trang
  quản trị sẽ khiến site thôi là "trang tĩnh cộng đúng một đường chạy động", và mỗi lần phát
  hành phải tính thêm phần động. **Cảnh báo đó không còn áp dụng** — site giữ nguyên hình dạng.
- **Không dựng hệ xác thực thứ hai.** Không Cloudflare Access, không danh sách email đồng bộ
  tay, không phân quyền song song. Thêm người vào Sanity là họ vào được; bớt đi là mất quyền.
- **Không có trang quản trị nào để lọt lên máy tìm kiếm.** Rủi ro đó biến mất cùng với trang.

**Chỗ duy nhất phải bắc cầu:** đơn nằm trong D1, không nằm trong Sanity. Studio chạy trong
trình duyệt nên phải gọi qua một đường API để lấy đơn. Đường đó nhận danh tính Sanity của
người đang đăng nhập và **hỏi ngược lại Sanity để xác nhận** trước khi trả dữ liệu — vẫn là
"ai vào được Sanity thì vào được", không sinh thêm mật khẩu nào. Đây là đường **đọc D1 duy
nhất** ngoài endpoint nhận đơn; nó thuộc lớp quản trị và tuân luật "không viết SQL rải rác".

**Vòng đầu làm bốn việc:** danh sách đơn · xem chi tiết đủ để gọi khách · đổi trạng thái ·
**danh sách đơn chưa báo tin được**. Việc thứ tư quan trọng hơn vẻ ngoài: đó là đơn của khách
thật đang nằm im mà không ai biết.

**Thiết kế cho nhiều loại dịch vụ ngay từ đầu, nhưng vòng đầu chỉ đổ đơn tour vào.** Chủ dự án
chốt "tour trước, mở dần sau". Nghĩa là bảng đơn và giao diện bảng điều khiển phải mang sẵn
khái niệm *loại dịch vụ*, để sau này thêm vé công viên hay xe đưa đón không phải đập đi làm
lại. Nhưng không dựng trước form cho các loại chưa có.

**Trạng thái đơn là quy tắc nghiệp vụ**, không phải chuyện của bảng điều khiển. Bộ trạng thái
và luật chuyển đổi nằm ở lớp nghiệp vụ; bảng điều khiển chỉ là cái nút bấm. Đây cũng là chỗ
đón nghiệp vụ sau này: huỷ đơn, đổi ngày, ghép đoàn — đều là chuyển trạng thái.

### 3. Giá mùa vụ: một file giá giữ nguyên, mùa thành nội dung biên tập trong Studio

Chủ dự án chốt hai điều tưởng như xung khắc — **"chỉ 01 file giá"** và **"mùa cao điểm quản lý
trong bảng điều khiển"**. Chúng khớp nhau nếu mùa **không phải file nào cả**:

- `data/prices.yaml` **giữ nguyên**: một file, giá gốc theo tour, nhập qua Google Sheet
  (`QĐ-2026-08-26-02`). Không thêm file dữ liệu thứ hai.
- **Mùa là một loại tài liệu trong Sanity**, biên tập ngay trong Studio cùng chỗ với bảng điều
  khiển. Sửa mức phụ thu như sửa một bài viết, bấm Publish, trang dựng lại, giá mới lên.

**Cách này không phá ràng buộc "giá chỉ đọc lúc dựng trang".** Sanity vốn đã được đọc lúc dựng
và Publish vốn đã kích một lần dựng — cơ chế có sẵn, không phát minh gì. `ADR-0007` nguyên vẹn,
`BK1` nguyên vẹn (endpoint vẫn không đọc Sanity, chỉ build đọc).

**Trang tính vẫn là nguồn giá DUY NHẤT.** Studio không giữ một con số tiền nào — nó giữ *quy
tắc nghiệp vụ*: khung thời gian nào, điều chỉnh bao nhiêu phần trăm, áp cho tour nào. Sheet trả
lời "tour này bao nhiêu tiền", Studio trả lời "đi vào dịp này thì cộng trừ thế nào". Xoá sạch dữ
liệu mùa thì giá gốc vẫn nguyên vẹn.

**Mỗi mùa gồm:** tên mùa · từ ngày · đến ngày · **điều chỉnh phần trăm (dương là tăng, âm là
giảm)** · áp cho tour nào (bỏ trống = mọi tour) · trừ ra tour nào. Ngày lễ rời rạc là một mùa có
*từ ngày* = *đến ngày*. Mùa thấp điểm là một mùa có phần trăm âm.

**Cách tính: danh sách CÓ THỨ TỰ, cái trên thắng cái dưới.** Theo **ngày khởi hành** khách chọn,
duyệt danh sách mùa **từ trên xuống**, gặp mùa đầu tiên vừa phủ ngày đó vừa áp được cho tour đó
thì **dùng luôn mùa ấy rồi dừng**. Nhân vào giá từng hạng khách, **làm tròn lên nghìn**. Hạng em
bé giá 0 nhân bao nhiêu vẫn 0.

Mô hình này **thay thế** luật "lấy mức phần trăm cao nhất" của bản đề xuất đầu. Luật cũ sinh ra
từ giả định chỉ có tăng giá; khi có cả giảm thì so số học trở nên mơ hồ — hai khuyến mãi −10% và
−20% thì "cao nhất" là −10%, tức khách được giảm ít hơn, gần như chắc chắn không phải ý ai. Thứ
tự do người biên tập sắp thì luôn xác định, và **sắp lại độ ưu tiên là kéo một dòng trong Studio,
không phải sửa mã**.

Hệ quả: **hai mùa phủ nhau thôi là lỗi, nó thành tính năng.** Khai *Lễ 30/4* nằm trong *Cao điểm
hè* là chuyện bình thường — chỉ cần lễ đứng trên hè. Muốn một đợt khuyến mãi thắng cả dịp lễ thì
kéo nó lên trên cùng.

**Trang nướng sẵn danh sách mùa áp được cho chính tour đó** — vài dòng, rất nhẹ. Khách đổi ngày
thì trình duyệt tự tính lại, không lời gọi mạng nào. Máy chủ vẫn chỉ kiểm nhất quán số học,
không tin giá, vì nhân viên mới là người chốt.

**Đơn ghi lại mùa đã áp và mức bao nhiêu.** Thiếu nó thì ba tháng sau nhìn một đơn 2.483.000₫
sẽ không ai biết vì sao không phải 1.910.000₫ — nhất là khi mùa lúc đó đã sửa.

**Ba điều validator phải chặn:** phần trăm ngoài khoảng hợp lý (một mùa −100% cho tour miễn phí,
hay +500% do gõ nhầm, đều phải đỏ); ngày kết thúc trước ngày bắt đầu; tour được viện dẫn trong
*áp cho* / *trừ ra* không tồn tại trong bảng giá. **Không còn luật nào về chồng lấn** — chồng là
hợp lệ và thứ tự quyết định.

### 4. Bề mặt: một nguồn token, sinh tự động ra dạng dùng được cho thư

`tokens.css` **vẫn là nguồn duy nhất** (`07-DESIGN_TOKENS`). Thêm một bước lúc dựng: đọc
`tokens.css`, lấy tập con token dùng cho thư từ (màu chữ, nền, nhấn, cảnh báo, cỡ chữ cơ bản,
tên font), ghi thành file giá trị thường mà khuôn thư dùng được. File đó **sinh ra, không sửa
tay**.

Chọn sinh tự động thay vì "khai bản sao rồi cho máy kiểm hai bên khớp": bản sao dù có máy canh
vẫn là hai chỗ để quên.

**Mở nhóm token trạng thái.** `07-DESIGN_TOKENS` §0.4 ghi *"không token semantic success/error
— site tĩnh không form, thêm khi cần qua cửa hai chiều"*. Điều kiện đó đã hết hiệu lực: site có
form, có thư báo thành công, có trang báo lỗi, sắp có bảng điều khiển với trạng thái đơn. Đi
đúng cửa tài liệu đã chừa. `html.ts` hiện tự chế hai màu cho hai trạng thái — triệu chứng của
việc thiếu nhóm này.

**Tách nội dung khỏi trình bày.** *Nói gì* (mã đơn, tour, ngày, số người, tạm tính, mùa đã áp)
thuộc nghiệp vụ và giống nhau ở mọi kênh. *Trông thế nào* thuộc bề mặt và khác nhau theo kênh:
email cần HTML nội tuyến, Zalo chỉ nhận chữ thuần, bảng điều khiển dùng giao diện Studio. Tách
ra thì thêm kênh mới chỉ là viết một khuôn trình bày.

**Luật máy canh:** cấm mã màu và cỡ chữ viết cứng trong mọi file bề mặt, trừ file sinh tự động.
Dự án đã có `check:theme` và `check:token-parity`; đây là mở rộng phạm vi chúng sang thư mục
thư từ — nơi hiện chưa có luật nào ngó tới.

### 5. QR chuyển khoản: tiện ích, không ràng buộc

**Không đảo `ADR-0027` dòng "thanh toán / đặt cọc online — ngoài phạm vi".** QR chỉ là mã
chuyển khoản ngân hàng gửi kèm cho tiện. Đơn **vẫn là yêu cầu đặt**, nhân viên vẫn gọi lại xác
nhận, site **không biết** khách đã trả hay chưa và không có trạng thái "đã cọc". Nếu sau này
muốn QR mang nghĩa giữ chỗ thì đó là ADR khác, vì nó kéo theo trạng thái đơn mới, quy tắc hết
hạn, và người đối soát tiền.

**Sinh QR bằng dịch vụ ảnh VietQR** — thư và tin nhúng một đường dẫn ảnh mang sẵn số tiền và mã
đơn, không thêm thư viện nào vào Worker (giữ `ADR-0027` quyết định 7). Đánh đổi đã cân nhắc: số
tài khoản công ty, số tiền và mã đơn đi qua một dịch vụ bên ngoài; **không có tên hay số điện
thoại khách** trong đường dẫn đó (`BK3`).

**Hai nhịp, vì rào cản khác nhau.** Nhịp gần: QR đi kèm tin báo đơn **gửi cho nhân viên** — bot
Zalo hiện đã làm được, không cần thủ tục gì thêm; nhân viên chuyển tiếp cho khách khi gọi, đúng
tinh thần "người thật trả lời" của brief. Nhịp xa: gửi thẳng cho **khách** qua Zalo OA, cần OA
xác thực và mẫu ZNS duyệt trước — chừa sẵn chỗ cắm, nhưng không để tiến độ phụ thuộc.

## Hệ quả

- **Được:** mỗi việc mới có chỗ để đặt; đổi màu thương hiệu một chỗ là đổi cả web lẫn thư; đơn
  không còn nằm im vô hình; mùa vụ sửa được ngay trong Studio không cần đụng kho mã; quyền vào
  bảng điều khiển quản một nơi.
- **Mất:** thêm ba validator phải nuôi; Studio nay có phần đọc dữ liệu ngoài Sanity, nên nâng
  cấp Studio phải kiểm cả tab đó; thêm một đường API đọc D1 phải giữ an toàn.
- **Không còn cửa một chiều nào** trong ADR này — khác với bản đề xuất đầu, vì bảng điều khiển
  chuyển vào Studio.
- **Không đụng:** `ADR-0007` (nguồn giá đọc lúc dựng), `BK1`–`BK5`, đường nhập giá qua Google
  Sheet (`QĐ-2026-08-26-02`), hình dạng "tĩnh + một route động" của site, và tiền đề "đơn là
  yêu cầu đặt" của `ADR-0027`.

## Thứ tự thi công

Ba lớp không làm cùng lúc. Thứ tự theo phụ thuộc dữ liệu:

1. **Nghiệp vụ — giá mùa vụ.** Loại tài liệu mùa trong Sanity, đọc lúc dựng, phép tính, hiện
   trên form và trong thư. Làm trước vì mọi thứ khác dựng trên nó.
2. **Bề mặt — token cho thư, tách nội dung khỏi trình bày.** Cần xong trước khi thư mang thêm
   dòng "mùa đã áp" và mã QR.
3. **Quản trị — tab bảng điều khiển trong Studio, bốn việc.** Tiêu thụ cả hai lớp trên.
4. **QR nhịp gần**, rồi **kênh gửi khách** khi thủ tục OA xong.

Mỗi bước có spec và kế hoạch riêng.

## Câu còn mở

- **Mùa vụ vào Studio thì giá gốc có nên vào theo không?** Hiện giá gốc nhập ở Google Sheet, mùa
  nhập ở Studio — hai nơi cho hai thứ khác nhau, nhưng người nhập phải nhớ cái nào ở đâu. Chưa
  quyết; để dùng thật một thời gian rồi xét, vì gộp về Studio là đảo `QĐ-2026-08-26-02`.
