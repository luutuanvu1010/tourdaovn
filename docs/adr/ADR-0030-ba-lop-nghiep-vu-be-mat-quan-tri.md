# ADR-0030 — Ba lớp: nghiệp vụ, bề mặt, quản trị

<!-- ═══════════════════════════════════════════════════════════════════
Quyết định RIÊNG của tourdaovn về việc chia hệ thành ba lớp có ranh giới được máy canh.
Cơ chế tái dùng được cho mọi site: (1) nghiệp vụ thuần, không biết mình chạy ở đâu;
(2) một nguồn token sinh ra nhiều dạng bề mặt, kể cả dạng không dùng được biến CSS;
(3) quản trị không đi tắt xuống hạ tầng. Nội dung nghiệp vụ cụ thể (mùa vụ, trạng thái
đơn, QR chuyển khoản) là của site này.
═══════════════════════════════════════════════════════════════════ -->

- **Trạng thái:** đề xuất, chờ chủ dự án phê chuẩn
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
(bề mặt) và phải đối chiếu được khi nhân viên gọi khách (quản trị). Làm rời từng cái sẽ phải
sửa xuyên tầng ba lần.

## Quyết định

### 1. Chia hệ thành ba lớp, ranh giới do validator canh

**Lớp nghiệp vụ** giữ mọi quy tắc kinh doanh và **không được biết** mình chạy trên web, trong
email, hay trong máy chủ. Đầu vào và đầu ra là dữ liệu thuần. Tiêu chí nhận biết lớp này còn
đúng: **mọi quy tắc trong đó kiểm được bằng test chạy dưới một giây, không trình duyệt, không
mạng, không cơ sở dữ liệu.** Phần lớn đã có sẵn và đang thuần: `quote.ts`, `schema.ts`,
`code.ts`, `vn-date.ts`.

**Lớp bề mặt** giữ mọi thứ con người nhìn thấy: trang web, thư báo đơn, tin Zalo, bảng điều
khiển. Một nguồn token sinh ra **hai dạng đầu ra** (§3).

**Lớp quản trị** là nơi người vận hành nhìn và tác động, và **không được đi tắt xuống D1** —
mọi thao tác qua lớp nghiệp vụ, để một quy tắc chỉ tồn tại ở một chỗ.

**Ba luật, mỗi luật một cổng máy:**

| Luật | Cách canh |
|---|---|
| Nghiệp vụ không nhập khẩu bề mặt hay hạ tầng | validator kiểm quan hệ import, cùng khuôn `BK1` đang dùng |
| Bề mặt không chứa quy tắc kinh doanh (không tự tính giá) | validator: thư mục bề mặt không được import module tính giá ngoài hàm dùng chung |
| Quản trị không viết SQL rải rác | validator: chỉ tầng lưu trữ được chứa câu SQL |

Ranh giới không có máy canh sẽ trôi. `notify/format.ts` viết cứng màu **từ ngày đầu** mà không
ai chặn, chính vì chưa có luật nào để chặn. Đây là lý do chọn phân thư mục có cổng, thay vì
chỉ định nghĩa hợp đồng trên giấy.

### 2. Giá mùa vụ: bảng riêng, phụ thu phần trăm, lấy mức cao nhất

- **Nguồn:** tab `mua` trong Google Sheet → `data/mua-vu.yaml`. **Tách khỏi `prices.yaml`** vì
  file giá có luật "mỗi khoá cấp cao nhất là một `bookingRef`"; chen bảng mùa vào là phá luật
  đó. Hai file, hai vai: `prices.yaml` là **giá gốc theo tour**, `mua-vu.yaml` là **quy tắc
  điều chỉnh theo thời gian**. Không phải hai nguồn cho cùng một thứ.
- **Sáu cột:** Tên mùa · Từ ngày · Đến ngày · Phụ thu % · Áp cho · Trừ ra. Ngày lễ rời rạc là
  một dòng có *Từ ngày* = *Đến ngày*. *Áp cho* trống = mọi tour. *Trừ ra* liệt kê tour được
  miễn — cần cột này vì luật "lấy mức cao nhất" tự nó không diễn tả được ý miễn trừ.
- **Cách tính:** theo **ngày khởi hành** khách chọn, gom mọi dòng mùa phủ ngày đó và áp được
  cho tour đó, **lấy mức phần trăm cao nhất** (không cộng dồn), nhân vào giá từng hạng khách,
  **làm tròn lên nghìn**. Hạng em bé giá 0 nhân bao nhiêu vẫn 0.
- **Không phá `BK1`.** Trang nướng sẵn danh sách mùa áp được cho chính tour đó — vài dòng, rất
  nhẹ. Khách đổi ngày thì trình duyệt tự tính lại, không lời gọi mạng nào. Máy chủ vẫn chỉ
  kiểm nhất quán số học, không tin giá, vì nhân viên mới là người chốt.
- **Đơn ghi lại mùa đã áp và mức bao nhiêu.** Thiếu nó thì ba tháng sau nhìn một đơn 888.000₫
  sẽ không ai biết vì sao không phải 740.000₫ — nhất là khi bảng mùa lúc đó đã sửa.

### 3. Bề mặt: một nguồn token, sinh tự động ra dạng dùng được cho thư

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
email cần HTML nội tuyến, Zalo chỉ nhận chữ thuần, bảng điều khiển dùng giao diện web. Tách ra
thì thêm kênh mới chỉ là viết một khuôn trình bày.

### 4. Quản trị: bốn việc, sau Cloudflare Access

Vòng đầu đúng bốn việc: danh sách đơn · xem chi tiết đủ để gọi khách · đổi trạng thái · **danh
sách đơn chưa báo tin được**. Việc thứ tư quan trọng hơn vẻ ngoài: đó là đơn của khách thật
đang nằm im mà không ai biết.

**Trạng thái đơn là quy tắc nghiệp vụ**, không phải chuyện của trang quản trị. Bộ trạng thái và
luật chuyển đổi nằm ở lớp nghiệp vụ; bảng điều khiển chỉ là cái nút bấm. Đây cũng là chỗ đón
nghiệp vụ sau này: huỷ đơn, đổi ngày, ghép đoàn — đều là chuyển trạng thái.

**Cửa một chiều phải nói rõ:** site hiện là trang tĩnh cộng **đúng một** đường chạy động. Bảng
điều khiển thêm vài đường nữa. Từ lúc đó, mỗi lần phát hành phải tính cả phần động, và khu vực
quản trị **không được lập chỉ mục, không vào sitemap** — một trang quản trị lọt lên máy tìm
kiếm là sự cố thật. Hai lớp bảo vệ: Cloudflare Access ở tầng mạng, `noindex` ở tầng trang.

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
  không còn nằm im vô hình; giá mùa vụ khai một bảng thay vì sửa 29 dòng.
- **Mất:** thêm ba validator phải nuôi; thêm một file dữ liệu (`mua-vu.yaml`) và một tab Sheet;
  site có thêm đường chạy động, nên phát hành phức tạp hơn.
- **Cửa một chiều:** khu vực quản trị. Từ lúc có nó, không quay lại được kiểu "site thuần tĩnh".
- **Không đụng:** `ADR-0007` (nguồn giá đọc lúc dựng), `BK1`–`BK5`, đường nhập giá qua Google
  Sheet (`QĐ-2026-08-26-02`), và tiền đề "đơn là yêu cầu đặt" của `ADR-0027`.

## Thứ tự thi công

Ba lớp không làm cùng lúc. Thứ tự theo phụ thuộc dữ liệu:

1. **Nghiệp vụ — giá mùa vụ.** Đổi lược đồ, nên làm trước; mọi thứ khác dựng trên nó.
2. **Bề mặt — token cho thư, tách nội dung khỏi trình bày.** Cần xong trước khi thư mang thêm
   dòng "mùa đã áp" và mã QR.
3. **Quản trị — bốn việc tối thiểu.** Tiêu thụ cả hai lớp trên.
4. **QR nhịp gần**, rồi **kênh gửi khách** khi thủ tục OA xong.

Mỗi bước có spec và kế hoạch riêng.
