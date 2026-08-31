# ADR-0033 — Vùng đăng nhập đối tác: giá kín theo vai, đơn nhiều dịch vụ, và mặt phẳng danh tính thứ hai

<!-- ═══════════════════════════════════════════════════════════════════
Đây là ADR mở một VÙNG ĐỘNG THỨ HAI trên một site vốn là "tĩnh cộng đúng một đường động".
Cơ chế tái dùng được cho mọi site: (1) dữ liệu KÍN quyết định kiến trúc render, không phải
ngược lại — giá kín buộc phải render ở máy chủ, và điều đó phải được nới ràng buộc một cách
CÓ MÃ chứ không lách bằng tên file; (2) một CMS có dataset đọc công khai thì mọi thứ bỏ vào
đó là XUẤT BẢN, nên nơi ở của dữ liệu phải được ĐO chứ không suy; (3) danh tính đối tác
ngoài tổ chức là một mặt phẳng khác với danh tính người vận hành, và gộp chúng là cấp quyền
sai. Ba vai, mức phần trăm, và tên bảng là của site này.
═══════════════════════════════════════════════════════════════════ -->

- **Trạng thái:** **ĐỀ XUẤT** — bảy điểm thiết kế được chủ dự án chốt lần lượt trong phiên
  brainstorm 2026-08-31; **toàn văn chờ chủ dự án đọc lại và phê chuẩn**
- **Ngày:** soạn 2026-08-31   **Người soạn:** Claude (qua Cowork)
  **Người phê chuẩn:** *(chờ)* Lưu Tuấn Vũ (chủ dự án)
- **Loại quyết định:** **hỗn hợp** — xem §Hệ quả để biết phần nào một chiều
- **Đảo:** `00-PROJECT_BRIEF` §5 phần *"không giỏ hàng"* (chỉ trong vùng đăng nhập) ·
  `04-CONSTRAINTS` §2 điều cấm 3 (**nới**, không xoá) · `04-CONSTRAINTS` §1d `BK1`
  (**nới**, không xoá) · `ADR-0030` §2 câu *"không dựng hệ xác thực thứ hai"*
  (chỉ ở phạm vi người **ngoài** công ty — xem quyết định 1)
- **KHÔNG đảo:** `ADR-0003` và `ADR-0007` (nguồn giá) · `ADR-0030` §1 (ba lớp) ·
  `ADR-0030` §3 (*"chỉ 01 file giá"*) · `ADR-0031` §2 (`payment_method` là **ý định**) ·
  `ADR-0032` (không đụng tới) · `04-CONSTRAINTS` §2 điều cấm 1 và 2 (không thêm `_type`
  hay field Sanity nào) · `BK2`–`BK5`
- **Liên quan:** `docs/specs/SPEC-2026-08-31-tai-khoan-doi-tac.md` ·
  `docs/BACKLOG.md` `B-024` (trạng thái thi công) · `B-004` (vì sao `AU1`–`AU6` phải có
  validator máy ngay) · `B-005` (`05-URL_MAP` §2 còn nói hệ không có DB nào khác)

## Bối cảnh

Ngày 2026-08-31 chủ dự án yêu cầu: *"module chuyên quản lý cho việc quản lý tài khoản: đăng
nhập, đăng ký, phân quyền khi truy cập website. Khi hướng dẫn viên hoặc nhân viên của công ty
đăng nhập thì có thể tạo đơn hàng bao gồm một hoặc nhiều dịch vụ với các mức giá khác nhau tuỳ
thuộc vào vai trò."*

Hệ hôm nay không có chỗ nào để đặt việc đó:

- **Không có khái niệm người dùng.** Site chưa từng có đăng nhập. `ADR-0030` §2 đã cố ý **từ
  chối** dựng xác thực, và giải pháp của nó — *"ai vào được Sanity CMS thì vào được bảng điều
  khiển"* — chỉ đúng với **người vận hành nội bộ**.
- **Giá chỉ có một mức.** `data/prices.yaml` là giá bán công khai; `PY7` cấm thẳng *"giá vốn,
  hoa hồng"* nằm trong đó. Không có chỗ nào khai giá cho một nhóm người mua cụ thể.
- **Đơn chỉ chứa đúng một tour.** Bảng `booking` (`migrations/0001_booking.sql`) có
  `tour_slug`, `tour_title`, `depart_date` ở **cấp đơn**. Không có dòng đơn.
- **Và brief cấm giỏ hàng.** `00-PROJECT_BRIEF` §5: *"không thanh toán trực tuyến, **không giỏ
  hàng**, không quản lý chỗ trống"* — tái khẳng định gần nhất ngày 2026-08-30 (`ADR-0031`).

Chủ dự án chốt **giá theo vai là KÍN với khách lẻ**. Chính câu đó, chứ không phải phần đăng
nhập, mới là thứ định hình toàn bộ ADR này. Giá kín thì không được nướng vào trang tĩnh, mà
không nướng vào trang tĩnh thì phải tính ở máy chủ — tức là đúng thứ điều cấm 2.3 đang cấm.

### Phép đo đã đảo một thiết kế giữa chừng, không lấy từ trí nhớ

Bản đầu của thiết kế đặt bảng phần trăm chiết khấu vào Sanity Studio, theo đúng tiền lệ mùa vụ
của `ADR-0030` §3. Phép đo ngày 2026-08-31 bác nó:

```
mcp Sanity list_datasets pgedy374  →  chỉ MỘT dataset: production, aclMode: public

curl "https://pgedy374.api.sanity.io/v2022-03-07/data/query/production?query=*%5B_id%3D%3D%22bangGiaMuaVu%22%5D%5B0%5D"
→ 200  {"result":{"_id":"bangGiaMuaVu","batUuDai":true,"phanTramUuDai":5,"muaVu":[…]}}
```

Không kèm token. Và `projectId` không phải bí mật — nó in sẵn trong mọi URL ảnh
`cdn.sanity.io/images/pgedy374/production/…` của mọi trang đã dựng.

**Nghĩa là: bất kỳ ai đọc một trang tour cũng đọc được toàn bộ dataset, gồm cả bản `draft` chưa
xuất bản.** Bỏ bảng chiết khấu vào Studio chính là đăng nó lên internet công cộng.

Bảng mùa vụ ở Sanity vẫn **đúng**, vì mùa vụ vốn công khai — nó đã nằm trong `data-seasons` của
trang tour rồi. Sự bất đối xứng nằm ở chỗ *nội dung*, không ở chỗ *cơ chế*.

## Quyết định

### 1. Mặt phẳng danh tính thứ hai, và vì sao `ADR-0030` §2 không cấm nó

`ADR-0030` §2 viết *"không dựng hệ xác thực thứ hai"*. Câu đó **giữ nguyên giá trị trong phạm
vi của nó**: bề mặt **quản trị nội bộ**. Lý lẽ của nó là người vận hành **đã có** tài khoản
Sanity, nên mọi hệ xác thực thêm đều là thừa.

Lý lẽ ấy không với tới đại lý và hướng dẫn viên ngoài công ty. Họ không có tài khoản Sanity, và
**cấp cho họ là cấp quyền ghi CMS** — tức mở quyền sửa nội dung site cho người ngoài tổ chức để
đổi lấy việc họ xem được giá. Đó là cấp sai quyền, không phải tiết kiệm một hệ.

Nên: **một hệ tài khoản mới, dùng chung cho cả ba vai** (`dai-ly`, `huong-dan-vien`,
`nhan-vien`), không dính Sanity. Chủ dự án chốt phương án này thay vì phương án lai (nhân viên
dùng Sanity, người ngoài dùng hệ mới), vì hai đường đăng nhập là hai chỗ phân quyền.

Hệ quả về ranh giới, phải nói rõ để không ai đọc rộng ra: **`nhan-vien` trong vùng đối tác chỉ
là một MỨC GIÁ, không phải một cấp quyền.** Nhân viên cần quyền điều hành thì vẫn được cấp qua
Sanity. Bảng điều khiển đơn vẫn ở Studio đúng như `ADR-0030` §2. **Không có màn quản trị thứ
hai ở `/doi-tac/`.**

**Bản ghi tài khoản nằm ở D1, không ở Sanity.** Điều cấm 2.1 cấm `_type` ngoài danh mục 14
entity, nên đây không phải lựa chọn mà là hệ quả — cộng thêm §Bối cảnh cho thấy để mã băm mật
khẩu và PII trong một dataset đọc công khai là sai chỗ ở mức nghiêm trọng hơn nhiều.

### 2. Giá kín ⇒ render ở máy chủ ⇒ nới điều cấm 2.3, ở mức hẹp nhất phát biểu được

Điều cấm 2.3 hiện nay: *"Trang không gọi API giá lúc runtime, không fetch giá phía client; giá
chỉ vào trang lúc build."*

Ba đường đã cân:

| Đường | Vì sao |
|---|---|
| Nướng giá vai vào trang tĩnh | **Loại.** Lộ biên lợi nhuận cho bất kỳ ai xem nguồn trang. Phá thẳng yêu cầu "kín". |
| Trang công khai + API giá, client gọi sau khi đăng nhập | **Loại.** Xoá luôn vế đang bảo vệ 100% lưu lượng thật. Giá vai đi qua mạng vào trình duyệt trên một trang ai cũng mở được. |
| **Một cây `/doi-tac/*` render giá ở máy chủ** | **Chọn.** |

Chọn đường thứ ba nghĩa là câu nới phát biểu được ở mức hẹp nhất:

> **Trang công khai vẫn không gọi API giá và không fetch giá phía client. Vùng `/doi-tac/*`,
> chỉ mở cho phiên đã xác thực, được render giá ở máy chủ.**

Vế đầu — thứ bảo vệ toàn bộ lưu lượng khách lẻ — **nguyên vẹn**. Không endpoint giá, không JSON
giá, không thuộc tính `data-` mang bảng giá vai. Giá vai không bao giờ rời khỏi Worker dưới
dạng dữ liệu máy đọc được; nó đi vào HTML đã render cho đúng phiên đó.

**`BK1` nới kèm, và nới thẳng chứ không lách.** `BK1` chỉ đích danh `src/pages/api/dat-tour.ts`
và `src/lib/booking/*`. Một file mới tên khác đọc giá sẽ thoả mãn `BK1` **về câu chữ** và vi
phạm nó **về tinh thần** — mà `B-004` đã ghi: `grep -rn "BK1" scripts/` trả về **0 kết quả**,
`control-registry.yaml` không có dòng `BK` nào, nên **không ai bắt được**. Cách lách đó bị từ
chối ở đây một cách có chủ ý. `BK1` cho `src/lib/booking/*` và `api/dat-tour.ts` **giữ nguyên**.

**Và brief phải sửa theo.** `00-PROJECT_BRIEF` §5 *"không giỏ hàng"* được gỡ **chỉ trong phạm vi
vùng đăng nhập**. Khách lẻ trên trang công khai vẫn không có giỏ; form đặt tour hiện tại không
đổi một dòng. *"Không thanh toán trực tuyến"* và *"không quản lý chỗ trống"* của §5 **giữ
nguyên**.

### 3. Dữ liệu kín không vào Sanity — vì dataset đọc được không cần token

Theo phép đo ở §Bối cảnh:

- **Quy tắc % theo vai sống ở bảng `role_rate` trong D1**, không ở Studio.
- **Giá gốc** (công khai) vẫn từ `data/prices.yaml`, nướng vào bundle Worker bằng một bước sinh
  mã thuần cục bộ lúc dựng — không gọi mạng, không token.

`ADR-0007` và `ADR-0030` §3 **nguyên vẹn**: `prices.yaml` vẫn là **nguồn giá duy nhất**, và
Studio vẫn không giữ một con số tiền nào. Chiết khấu theo vai là *quy tắc*, không phải *giá* —
đúng cùng một câu mà `ADR-0030` §3 đã nói về mùa vụ, chỉ đổi nơi ở vì đổi mức bí mật.

Ba cái được cùng lúc khi để ở D1: bí mật đứng trên **kiến trúc** chứ không trên một ô ACL ai đó
phải nhớ bật · vẫn sửa được trong **đúng tab Studio** đã phải dựng cho việc duyệt tài khoản,
qua đúng cầu API của `ADR-0030` §2 · và đổi mức chiết khấu **có hiệu lực ngay**, không cần dựng
lại trang.

**`AU6` sinh ra từ đây:** cấm mọi dữ liệu kín đi vào Sanity, có validator máy canh. Luật này
phải có máy giữ, vì người sau sẽ không tự nhớ rằng dataset đọc được không cần token.

> **Ngoài phạm vi ADR này:** có siết ACL của `production` hay không. Lật sang `private` kéo theo
> URL ký cho ảnh `cdn.sanity.io` đang phục vụ thẳng trong HTML tĩnh — phạm vi lớn hơn hẳn, và là
> quyết định riêng. ADR này chỉ **tránh** vấn đề, không chữa. Cần lập phiếu `DR-` riêng.

### 4. Một bảng đơn duy nhất, mang sẵn khái niệm loại dịch vụ

`sale_order` + `sale_order_item` thay `booking`, và **luồng đặt tour công khai chuyển sang ghi
vào đó luôn**. Đơn khách lẻ là đơn có `partner_id = NULL` và đúng một dòng.

Chủ dự án chọn phương án này thay vì để hai bảng song song, vì hai bảng là hai nguồn sự thật cho
cùng một khái niệm "đơn" (va P6), và bảng điều khiển ở Studio sẽ phải đọc hai chỗ rồi trộn.

Đây cũng là chỗ `ADR-0030` §2 đã dặn chừa sẵn: *"bảng đơn và giao diện bảng điều khiển phải mang
sẵn khái niệm loại dịch vụ, để sau này thêm vé công viên hay xe đưa đón không phải đập đi làm
lại."* `sale_order_item.service_type` là cột đó.

**`role_at_order` đóng băng vai lúc đặt.** Đại lý bị hạ vai tháng sau thì đơn cũ không đổi giá
theo. Đơn là bản ghi lịch sử, không phải phép tính chạy lại.

Bảng `booking` **không bị xoá** trong đợt này; nó thành chỉ-đọc, và một migration sau mới bỏ
hẳn. Mã đơn `TD-…` giữ nguyên nên khách tra mã cũ vẫn ra.

### 5. Đối tác tự chốt đơn; không công nợ

Đơn đối tác **không cần nhân viên gọi lại xác nhận** — đại lý đặt 20 đơn một ngày không muốn
nghe 20 cuộc gọi. Bộ trạng thái đơn và luật ai được tự chốt nằm ở **lớp nghiệp vụ**, đúng
`ADR-0030` §2 (*"trạng thái đơn là quy tắc nghiệp vụ, không phải chuyện của bảng điều khiển"*).

**Trả tiền từng đơn. Không công nợ, không hạn mức, không kỳ chốt sổ.** Chủ dự án chốt loại bỏ
hẳn khỏi phạm vi: đó là kế toán, không còn là đặt chỗ, và nếu cần thì là một ADR khác.

**Ưu đãi thanh toán trước không cộng dồn với giá vai.** `ADR-0031` §3 giữ nguyên cho khách lẻ.

**SĐT khách cuối bắt buộc** trên đơn đối tác — tài xế và hướng dẫn viên gọi thẳng khách khi đón
trễ, đi vòng qua đại lý là thêm một khâu lúc đang cần nhanh. Chủ dự án chốt, biết rằng đổi lại
là site giữ thêm PII của người không phải khách trực tiếp của mình. `BK3` áp nguyên.

### 6. Phân quyền là hai trục, không phải một hệ RBAC

| Trục | Nội dung |
|---|---|
| **Vai → giá** | Vai chỉ đổi *con số*, không mở thêm chức năng nào |
| **Sở hữu** | Mỗi người chỉ thấy đơn **mình tạo**. Không ngoại lệ trong `/doi-tac/*`. |

Không vai trò lồng nhau, không ma trận quyền, không nhóm. Yêu cầu của chủ dự án đọc kỹ thì chỉ
có hai trục này; dựng sẵn một hệ tổng quát là dựng thứ chưa ai cần và phải nuôi mãi.

**Vai lấy từ phiên đã ký, không bao giờ từ thân yêu cầu** (`AU4`). `BK5` mở rộng: máy chủ tính
lại và `total` lệch thì 400 — với giá kín thì đây không còn là chống gõ nhầm, mà là chống người
ta gửi thẳng `role=dai-ly` lên.

### 7. Ràng buộc mới `AU1`–`AU6` phải có validator máy **ngay trong đợt này**

`AU1` ranh giới import · `AU2` chỉ tầng lưu trữ chứa SQL · `AU3` mật khẩu và token chỉ dạng băm ·
`AU4` vai lấy từ phiên · `AU5` cảnh báo khi % vai nhỏ hơn % ưu đãi trả trước (`warn`) ·
`AU6` không dữ liệu kín vào Sanity.

Thêm ràng buộc là **siết**, nên `04-CONSTRAINTS` §5 cho phép tự do. Nhưng điều kiện kèm theo là
điều kiện cứng: **mỗi mã phải có executor script và một ca đỏ cố ý chứng minh nó thật sự bắt.**

Lý do nằm trong chính kho này. `B-004`: `BK1`–`BK5` mang mức `fail` mà `grep -rn "BK1" scripts/`
→ **0 kết quả**, `control-registry.yaml` không có dòng `BK` nào (đo lại 2026-08-31, vẫn đúng).
Năm ràng buộc chặn-phát-hành đang được canh bằng mắt người. Một ràng buộc không có máy canh là
một câu văn, không phải một cổng.

## Phương án bị loại

| Phương án | Vì sao loại |
|---|---|
| **Giá vai là % công khai** (đăng rõ "đại lý giảm 10%") | Rẻ hơn hẳn về mặt luật — không nới ràng buộc nào. Chủ dự án chốt giá vai là **kín**, nên không dùng được. |
| **Bảng giá net cứng từng vai từng dịch vụ** | Là **nguồn giá thứ hai**: va `ADR-0030` §3 (*"chỉ 01 file giá"*), va P6, và `PY7` cấm `prices.yaml` chứa giá vốn nên nó phải ở chỗ khác. Chủ dự án chốt khai bằng **%**. |
| **Phủ giá vai lên trang công khai bằng API sau đăng nhập** | Nới điều cấm 2.3 rộng nhất có thể; giá vai vào trình duyệt trên trang ai cũng mở được. Rẻ hơn đúng một lần lúc dựng, đắt mãi sau ở chỗ khó lấy lại nhất: một dòng ràng buộc đã bị gỡ. |
| **Cấp tài khoản Sanity cho đại lý và HDV** | Cấp quyền **ghi CMS** cho người ngoài tổ chức, cộng chi phí ghế. Sai loại quyền. |
| **Nhân viên dùng Sanity, người ngoài dùng hệ mới** | Giữ `ADR-0030` §2 nguyên vẹn hơn, nhưng thành hai đường đăng nhập và hai chỗ phân quyền. Chủ dự án chọn một hệ. |
| **Quy tắc % vai trong Sanity Studio** | Đã soạn rồi bị **phép đo bác** — dataset `aclMode: public`, đọc được không cần token. Xem §Bối cảnh. |
| **Dataset Sanity thứ hai đặt `private`** | Thêm chi phí gói, thêm workspace Studio, thêm một ACL nữa để quên bật. Bí mật đứng trên một công tắc người phải nhớ. |
| **Lật `production` sang `private`** | Ảnh phục vụ thẳng từ `cdn.sanity.io` trong HTML tĩnh sẽ cần URL ký. Gãy toàn site để giấu một bảng phần trăm. |
| **Cloudflare secret chứa JSON quy tắc** | Sửa mức chiết khấu phải qua CLI, người vận hành không làm được. Và `DR-101` ghi nhận build tự động từ `main` **đã từng xoá sạch** toàn bộ `wrangler secret` của Worker. |
| **Hai bảng đơn song song** | Hai nguồn sự thật cho khái niệm "đơn" (va P6); bảng điều khiển phải đọc hai chỗ; nợ gộp loại này hiếm khi được trả. |
| **Công nợ / hạn mức / chốt sổ theo kỳ** | Là kế toán, không phải đặt chỗ. Sinh cả một hệ thống con thứ năm. Chủ dự án loại khỏi phạm vi. |
| **Giỏ hàng cho cả khách lẻ** | Động vào module đang chạy thật trên 28 tour, và gỡ *"không giỏ hàng"* ở phạm vi rộng hơn hẳn mức cần. |

## Hệ quả

**Phần một chiều — bốn thứ, nói rõ để không ai tưởng gỡ ra là xong:**

1. **Site thôi là *"trang tĩnh cộng đúng một đường chạy động"*.** `ADR-0030` §2 từng mừng vì
   *"không có cửa một chiều nào phải bước qua… site giữ nguyên hình dạng"*. ADR này bước qua
   đúng cửa đó. Từ đây mỗi lần phát hành phải tính thêm một vùng động, và mỗi sự cố phải hỏi
   thêm "vùng đăng nhập có sao không".
2. **Chuyển bảng đơn.** Sau khi luồng công khai ghi vào `sale_order` và `booking` bị bỏ, quay
   lại là một migration ngược trên dữ liệu khách thật.
3. **Lời hứa thương mại.** Đã cấp giá đại lý cho ai đó thì rút lại là rút một cam kết, không
   phải revert một commit.
4. **PII của khách cuối do đại lý giao.** Đã nhận thì không "chưa nhận" lại được.

**Phần hai chiều:** gỡ cây `/doi-tac/*`, xoá `partner`, `partner_session`, `role_rate`, khôi
phục điều cấm 2.3 và `BK1` — không dòng dữ liệu nào của đơn đổi nghĩa.

**Bốn hệ quả vận hành nhận rõ, không giấu:**

- **Mỗi thao tác trong giỏ là một lượt tải lại từ máy chủ.** Đó là cái giá của giá kín: trình
  duyệt không được cầm bảng giá nên không tính lại tại chỗ được như form công khai. Nếu chậm tới
  mức khó dùng, đường thoát **không** phải là gửi giá xuống trình duyệt, mà là giảm số lượt tải.
- **Quyền sửa `role_rate` là quyền đổi giá bán.** Ai vào được Studio là đổi được. Chấp nhận, vì
  đó đúng bằng quyền họ đã có với `bangGiaMuaVu` từ `ADR-0030`; nhưng `updated_by` phải ghi.
- **`05-URL_MAP` §2 lệch nặng thêm.** Nó vẫn khẳng định *"Không có DB nào khác: hai nguồn duy
  nhất của hệ là Sanity dataset và `prices.yaml`"* (`B-005`). Bốn bảng nữa làm vết lệch đó rộng
  ra. Cần phiếu `DR-`.
- **Không có quên mật khẩu vòng đầu.** Nhân viên đặt lại trong Studio. Sẽ thành phiền khi số tài
  khoản lớn lên.

## Thứ tự thi công

Chi tiết ở `SPEC-2026-08-31-tai-khoan-doi-tac` §5. Điểm cốt ở đây là **bước 1 phải đứng trước**:
chuyển luồng đặt tour công khai sang bảng mới **lúc 170 test đang xanh làm lưới**, chưa có hệ
nào khác đang chao đảo. Làm sau là làm trong lúc còn phải giữ thăng bằng thêm một hệ mới.

Sau đó: lớp nghiệp vụ tài khoản → `role_rate` và bước sinh giá gốc → cây `/doi-tac/*` → tab
duyệt trong Studio → validator `AU1`–`AU6`.

## Câu còn mở

**Ưu đãi trả trước loại theo DÒNG hay theo NGƯỜI?** Chủ dự án nói *"có giá vai thì thôi ưu
đãi"*. Spec §4.8 luật 3 hiện cài **theo dòng**, nhưng cách đó va vào ba chỗ:
`sale_order.payment_method` là một cột cho cả đơn · hình dạng `quoted_json` của `ADR-0031`
(`prepay: { percent, totalGoc }`) mang một phần trăm cho cả đơn · `ADR-0032` khớp tiền chuyển
khoản theo **tổng đơn**.

Đọc **theo người** — *đối tác không nhận ưu đãi trả trước, chấm hết* — hợp câu chữ hơn và giữ
`quoted_json` nguyên hình dạng. Lý do ban đầu chọn theo dòng là tránh trường hợp đối tác trả đắt
hơn khách lẻ; nhưng `AU5` cần có **dù chọn cách nào** và chính `AU5` mới canh trường hợp đó.

**Khuyến nghị: theo NGƯỜI.** Chốt ở QA1 trước khi có dòng code nào.
