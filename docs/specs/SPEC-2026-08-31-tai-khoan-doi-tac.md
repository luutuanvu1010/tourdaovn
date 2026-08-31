# SPEC — Tài khoản đối tác: đăng nhập, phân quyền theo vai, đơn nhiều dịch vụ

- **Ngày:** 2026-08-31   **Soạn:** Claude (qua Cowork)   **Duyệt QA1:** *(chờ)*
- **Quyết định chi phối:** `ADR-0033` (`docs/adr/ADR-0033-vung-dang-nhap-doi-tac.md` — **đề xuất 2026-08-31, chờ phê chuẩn**; bổ sung `ADR-0027` và `ADR-0030`),
  `ADR-0030` §1 §2 §3, `ADR-0031` §2 §3, `ADR-0027`
- **Ràng buộc:** `04-CONSTRAINTS` §1d `BK1`–`BK5`, §2 điều cấm 1 2 3, §4 bảo mật
- **Nhánh gốc:** `main`; soạn trên `be-mat/2026-08-31-hero-congty-form` tại `e4829fe`

> ## ⛔ Spec này KHÔNG được thi công cho tới khi ba khoản nới ràng buộc ở §7 được phê chuẩn
>
> Nó **nới** hai ràng buộc mức `fail` và **gỡ** một dòng phạm vi trong brief. `04-CONSTRAINTS`
> §5 nói rõ: nới thì cần chủ dự án phê chuẩn kèm lý do ghi vào `DECISIONS.md`. Đọc §7 trước
> khi đọc §4.

## 1. Mục tiêu

Đại lý du lịch, hướng dẫn viên và nhân viên kinh doanh có tài khoản riêng trên `tourdao.vn`.
Đăng nhập rồi thì **thấy giá của vai mình** — thấp hơn giá công khai — và **tạo được một đơn
gồm nhiều dịch vụ** thay vì mỗi lần một tour như form công khai hiện nay.

Mức giá theo vai là **thông tin kín với khách lẻ**. Đó là điều kiện định hình toàn bộ thiết kế
bên dưới: không con số giá vai nào được phép đi ra khỏi Worker dưới dạng dữ liệu máy đọc được.

## 2. Bảy điểm chủ dự án chốt (phiên brainstorm 2026-08-31)

1. **Giá theo vai là KÍN** với khách lẻ. Ba bảng giá theo ba vai.
2. **Khai bằng phần trăm, riêng từng dịch vụ** — không phải bảng giá net cứng. Hệ quả:
   `data/prices.yaml` **giữ nguyên** vai trò nguồn giá duy nhất; phần trăm vai là *quy tắc*
   sống trong Studio, đúng khuôn `bangGiaMuaVu` mà `ADR-0030` §3 đã dựng.
3. **Một hệ tài khoản mới cho cả ba vai**, không dính Sanity. Bản ghi ở D1.
4. **Đối tác tự chốt đơn** — không cần nhân viên gọi lại xác nhận. Trả từng đơn.
   **Không công nợ, không hạn mức, không kỳ chốt sổ.**
5. **Kiến trúc PA-1:** một cây `/doi-tac/*` chạy động, render giá ở máy chủ. Trang công khai
   **không sửa một dòng nào**. Không API giá, không fetch giá phía client.
6. **Một bảng đơn duy nhất** — `sale_order` + `sale_order_item`; chuyển luôn luồng đặt tour
   công khai sang đó.
7. **SĐT khách cuối bắt buộc** trên đơn đối tác, và **ưu đãi trả trước không cộng dồn** với
   giá vai.

## 3. Không làm gì (ranh giới)

- **Không sửa trang công khai.** `TourDetail.astro`, `BookingForm.astro`, nhãn giá, JSON-LD,
  `_redirects`, sitemap: không chạm. Ngoại lệ duy nhất là §4.6 — đường ghi D1 của
  `handler.ts` đổi bảng đích, hành vi nhìn từ ngoài không đổi.
- **Không công nợ.** Không sổ nợ, không hạn mức, không đối soát theo kỳ. Đó là kế toán, và
  nếu sau này cần thì là một dự án riêng.
- **Không giỏ hàng cho khách lẻ.** Giỏ chỉ tồn tại sau khi đăng nhập.
- **Không quên mật khẩu vòng này.** Nhân viên đặt lại trong Studio.
- **Không đa ngôn ngữ** cho `/doi-tac/*`. Tiếng Việt.
- **Không thanh toán trực tuyến.** `ADR-0032` đang đi đường riêng của nó; spec này không đụng.
- **Không RBAC tổng quát.** Hai trục, đúng như §4.9.
- **Không màn quản trị thứ hai.** Ai cần xem toàn bộ đơn thì vào bảng điều khiển Studio —
  `ADR-0030` §2 đã đặt chỗ, dựng thêm một cái nữa ở `/doi-tac/` là làm đúng thứ ADR đó từ chối.

## 4. Thiết kế

### 4.1 Hình dạng site: cây thứ hai chạy động

`astro.config.mjs` **không đổi** (`output: 'static'`). Mỗi trang trong `src/pages/doi-tac/`
khai `export const prerender = false`, đúng khuôn `src/pages/api/dat-tour.ts:6` đang dùng.
Adapter tự thêm `/doi-tac/*` vào `dist/_routes.json`; mọi trang khác vẫn là asset tĩnh phục vụ
trước Worker.

Đây là chỗ site thôi là *"trang tĩnh cộng đúng một đường chạy động"*. Đó là **cửa một chiều**
và phải được `ADR-0033` ghi thẳng ra, không giấu trong một mục kỹ thuật.

### 4.2 Ba lớp và ranh giới máy canh

Theo `ADR-0030` §1:

| Lớp | Thư mục | Luật |
|---|---|---|
| Nghiệp vụ | `src/lib/taikhoan/`, `src/lib/donhang/` (trừ `store.ts`) | Không import Astro / Sanity / D1. Test chạy dưới 1 giây, không mạng, không DB. |
| Bề mặt | `src/pages/doi-tac/*`, `src/components/doitac/*` | Không tự tính giá. Màu và cỡ chữ lấy từ `src/styles/tokens.css`. |
| Lưu trữ | `src/lib/donhang/store.ts` | Chỉ nơi này chứa chuỗi SQL. Prepared statement tham số hoá. |

Ranh giới nào không có máy canh sẽ trôi — `notify/format.ts` viết cứng cỡ chữ từ ngày đầu
(`B-002`) chính vì chưa có luật nào chặn. Bốn validator ở §4.12 là để không lặp lại.

### 4.3 Quy tắc % vai sống ở **D1**, KHÔNG ở Sanity

> **Bản trước của spec này để bảng % vai trong Studio và ĐÃ SAI.** Phép đo dưới đây bác nó.

**Phép đo, 2026-08-31.** Dataset `production` của dự án `pgedy374` có `aclMode: public`
(`mcp Sanity list_datasets`) — và đó là **dataset duy nhất** của dự án. Truy vấn không kèm
token trả về **HTTP 200** kèm nguyên văn tài liệu quy tắc giá:

```
curl "https://pgedy374.api.sanity.io/v2022-03-07/data/query/production?query=*%5B_id%3D%3D%22bangGiaMuaVu%22%5D%5B0%5D"
→ 200  {"result":{"_id":"bangGiaMuaVu","batUuDai":true,"phanTramUuDai":5,"muaVu":[…]}}
```

`projectId` không phải bí mật: nó nằm trong mọi URL ảnh `cdn.sanity.io/images/pgedy374/production/…`
của mọi trang đã dựng. Nghĩa là **bất kỳ ai đọc một trang tour cũng đọc được toàn bộ dataset.**

Bảng mùa vụ ở Sanity là **đúng**, vì mùa vụ vốn công khai — nó đã nằm trong `data-seasons` của
trang tour. Chiết khấu vai thì không. Sanity vì vậy **bị loại** cho dữ liệu kín.

**Ba đường đã cân và loại:**

| Đường | Vì sao loại |
|---|---|
| Dataset thứ hai đặt `private` | Thêm chi phí gói, thêm một workspace Studio, và thêm một ACL nữa để quên bật. Bí mật đứng trên một công tắc người phải nhớ. |
| Lật `production` sang `private` | Ảnh phục vụ thẳng từ `cdn.sanity.io` trong HTML tĩnh sẽ cần URL ký. Gãy toàn site để giấu một bảng phần trăm. |
| Cloudflare secret chứa JSON | Sửa mức chiết khấu phải qua CLI, không phải người vận hành làm được. Và `DR-101` ghi nhận build tự động từ `main` **đã từng xoá sạch** toàn bộ `wrangler secret` của Worker. |

**Chọn: một bảng trong D1.**

```sql
CREATE TABLE role_rate (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  uu_tien    INTEGER NOT NULL,     -- nhỏ hơn THẮNG; thay cho thứ tự mảng của bangGiaMuaVu
  role       TEXT NOT NULL,        -- dai-ly | huong-dan-vien | nhan-vien
  phan_tram  INTEGER NOT NULL,     -- 0..90, số DƯƠNG là GIẢM
  ap_cho     TEXT,                 -- JSON mảng khoá giá; NULL = mọi dịch vụ
  tru_ra     TEXT,                 -- JSON mảng khoá giá, thắng ap_cho
  ghi_chu    TEXT,
  updated_at TEXT NOT NULL,
  updated_by TEXT                  -- email người sửa trong Studio
);
CREATE INDEX idx_role_rate_uu_tien ON role_rate(uu_tien);
```

Ba cái được cùng lúc:

1. **D1 kín theo cấu tạo.** Không endpoint công khai, không ACL nào để quên bật. Bí mật đứng
   trên kiến trúc chứ không trên một ô cấu hình.
2. **Vẫn sửa trong Studio.** Đúng cái tab đã phải dựng cho việc duyệt tài khoản (§4.11), qua
   đúng cầu API của `ADR-0030` §2. Người vận hành không học thêm công cụ nào.
3. **Đổi mức chiết khấu có hiệu lực NGAY**, không cần dựng lại trang — vì `/doi-tac/*` chạy
   động và đọc bảng lúc nhận yêu cầu.

Luật ưu tiên giữ nguyên tinh thần `ADR-0030` §3: sắp theo `uu_tien` tăng dần, lấy dòng đầu tiên
vừa khớp `role` vừa áp được cho khoá giá đó rồi **dừng**. Hai dòng phủ nhau là hợp lệ.
Bảng rỗng ⇒ mọi vai trả giá công khai — mặc định an toàn.

**Không có `bangGiaTheoVai` trong Sanity.** Không thêm loại tài liệu nào, nên điều cấm 2.1
không bị đụng tới và hook Sanity không phải sửa.

### 4.4 Đường giá gốc vào Worker: một bước sinh lúc dựng

**Vấn đề.** `src/lib/prices.ts:12` đọc `prices.yaml` bằng `readFileSync`. Cái đó chạy được lúc
**dựng trang**, nhưng **không** chạy được trong Worker lúc nhận yêu cầu — Workers không có
`fs`. Mà `/doi-tac/*` chạy lúc nhận yêu cầu và cần giá gốc.

**Cách giải.** Một bước sinh mã, thuần cục bộ:

```
npm run gen:gia-goc
  ├── đọc  data/prices.yaml            (29 dòng, tất cả perPax)
  └── ghi  src/generated/gia-goc.ts    (module TS, nhập tĩnh)
```

**Phần kín KHÔNG đi qua đây.** Sau §4.3, bước sinh này chỉ chở **giá công khai** — thứ vốn đã
in trên mọi trang tour. Không gọi mạng, không token, không bí mật, kết quả tất định.

`package.json` — chạy như tiền bước của **cả ba** lệnh, vì cả ba đều cần file tồn tại:

```
"build": "npm run gen:gia-goc && astro check && astro build"
"check": "npm run gen:gia-goc && astro check"
"gate":  "npm run gen:gia-goc && astro check && npm --prefix scripts run gate:all"
```

Thiếu tiền bước ở `check` và `gate` thì kho vừa clone về chạy hai lệnh đó sẽ đỏ vì thiếu import
— một cái bẫy chỉ lộ ra với người mới.

**File sinh ra không vào git** (`.gitignore`: `src/generated/`). Không phải vì bí mật — nó công
khai — mà để không có bản sao chép cứng nào của `prices.yaml` trôi khỏi nguồn. Đây **không phải
nguồn sự thật thứ hai** (P6): quan hệ của nó với `prices.yaml` giống hệt quan hệ của `dist/` với
`src/`.

**Bước sinh phải ĐỎ TO khi hỏng, không được im lặng.** Build dừng nếu `prices.yaml` không đọc
được, parse hỏng, hoặc **sinh ra 0 dòng giá**. Không có trạng thái "chạy xong mà rỗng": một
bảng giá rỗng trong Worker nghĩa là mọi đơn đối tác báo giá sai, mà trang vẫn dựng xanh và
không ai biết trong nhiều tuần.

**Bảng sinh ra nằm trong `dist/_worker.js`, không phục vụ công khai.** Đã kiểm 2026-08-31:
`dist/.assetsignore` chứa đúng hai dòng `_worker.js` và `_routes.json`. Kiểm lại dòng này sau
mọi lần nâng adapter.

### 4.5 D1: `migrations/0003_partner_va_sale_order.sql`

Tên bảng dùng `sale_order` chứ không `order`: `ORDER` là từ khoá SQL, phải bọc nháy ở mọi câu
lệnh — một cái bẫy gõ nhầm không đáng rước.

Migration này tạo **năm** bảng: bốn bảng dưới đây cộng `role_rate` đã khai ở §4.3.

```sql
CREATE TABLE partner (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT NOT NULL UNIQUE,        -- DT-0001
  created_at    TEXT NOT NULL,               -- ISO 8601 UTC
  email         TEXT NOT NULL UNIQUE,        -- định danh đăng nhập, đã hạ chữ thường
  phone         TEXT NOT NULL,               -- chuẩn hoá 0xxxxxxxxx như booking.phone
  full_name     TEXT NOT NULL,
  org_name      TEXT,                        -- NULL với HDV cá nhân
  role          TEXT,                        -- NULL cho tới khi được duyệt
  status        TEXT NOT NULL DEFAULT 'cho-duyet',
  pass_hash     TEXT NOT NULL,               -- pbkdf2$<vòng>$<muối b64>$<băm b64>
  approved_at   TEXT,
  approved_by   TEXT,                        -- email người duyệt trong Studio
  note          TEXT,                        -- gồm vai NGUYỆN VỌNG người đăng ký tự khai
  last_login_at TEXT
);
CREATE INDEX idx_partner_status ON partner(status);

CREATE TABLE partner_session (
  id          TEXT PRIMARY KEY,              -- SHA-256 CỦA token, không phải token
  partner_id  INTEGER NOT NULL REFERENCES partner(id),
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  revoked_at  TEXT,
  ip_hash     TEXT,
  user_agent  TEXT
);
CREATE INDEX idx_session_partner ON partner_session(partner_id);

CREATE TABLE sale_order (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  code           TEXT NOT NULL UNIQUE,       -- TD-yymmdd-XXXX, giữ nguyên khuôn code.ts
  created_at     TEXT NOT NULL,
  partner_id     INTEGER REFERENCES partner(id),   -- NULL = khách lẻ trên trang công khai
  role_at_order  TEXT NOT NULL DEFAULT 'khach',    -- vai LÚC ĐẶT, đóng băng
  customer_name  TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT,
  pickup         TEXT,
  note           TEXT,
  quoted_json    TEXT NOT NULL,
  total          INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'onboard',
  status         TEXT NOT NULL DEFAULT 'moi',
  lang           TEXT NOT NULL DEFAULT 'vi',
  source         TEXT NOT NULL DEFAULT 'web',
  notify_email   TEXT,
  notify_zalo    TEXT,
  ip_hash        TEXT,
  user_agent     TEXT
);
CREATE INDEX idx_order_created ON sale_order(created_at);
CREATE INDEX idx_order_phone   ON sale_order(phone);
CREATE INDEX idx_order_partner ON sale_order(partner_id);

CREATE TABLE sale_order_item (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES sale_order(id),
  line_no       INTEGER NOT NULL,
  service_type  TEXT NOT NULL,               -- tour|attraction|experience|lodging|event
  service_slug  TEXT NOT NULL,
  service_title TEXT NOT NULL,
  booking_ref   TEXT,                        -- khoá giá
  depart_date   TEXT NOT NULL,               -- YYYY-MM-DD
  pax_json      TEXT NOT NULL,
  quoted_json   TEXT NOT NULL,               -- perPax, tên mùa, % vai, ưu đãi
  subtotal      INTEGER NOT NULL,
  UNIQUE(order_id, line_no)
);
CREATE INDEX idx_item_order ON sale_order_item(order_id);
```

**Hai cột mang toàn bộ sức nặng bảo mật của module.** `partner.role` **chỉ người duyệt đặt
được**, không bao giờ lấy từ form đăng ký. `partner.status` là cổng đăng nhập; mặc định
`cho-duyet` nên tài khoản mới vô dụng cho tới khi có người gật.

**`partner_session.id` là băm của token, không phải token.** Rò cơ sở dữ liệu không thành rò
phiên đăng nhập. Cùng lý do `booking.ip_hash` không lưu IP thô.

**`role_at_order` đóng băng có chủ đích.** Đại lý bị hạ vai sang HDV tháng sau thì đơn cũ
**không** đổi giá theo. Đơn là bản ghi lịch sử, không phải phép tính chạy lại.

**`service_type` là chỗ `ADR-0030` §2 đã dặn chừa sẵn:** *"bảng đơn phải mang sẵn khái niệm
loại dịch vụ, để sau này thêm vé công viên hay xe đưa đón không phải đập đi làm lại."*

### 4.6 Chuyển đơn cũ và chuyển luồng đặt tour công khai

Cùng migration `0003`, sau phần `CREATE`:

```sql
INSERT INTO sale_order (code, created_at, partner_id, role_at_order, customer_name, phone,
  email, pickup, note, quoted_json, total, payment_method, status, lang, source,
  notify_email, notify_zalo, ip_hash, user_agent)
SELECT code, created_at, NULL, 'khach', customer_name, phone,
  email, pickup, note, quoted_json,
  CAST(json_extract(quoted_json, '$.total') AS INTEGER),
  payment_method, status, lang, source, notify_email, notify_zalo, ip_hash, user_agent
FROM booking;

INSERT INTO sale_order_item (order_id, line_no, service_type, service_slug, service_title,
  booking_ref, depart_date, pax_json, quoted_json, subtotal)
SELECT o.id, 1, 'tour', b.tour_slug, b.tour_title, b.booking_ref, b.depart_date,
  b.pax_json, b.quoted_json, CAST(json_extract(b.quoted_json, '$.total') AS INTEGER)
FROM booking b JOIN sale_order o ON o.code = b.code;
```

**Bảng `booking` KHÔNG bị xoá trong đợt này.** Nó thành chỉ-đọc; một migration sau mới bỏ hẳn,
khi chủ dự án đã yên tâm. Mã đơn `TD-…` giữ nguyên nên khách tra mã cũ vẫn ra.

`handler.ts` đổi đích ghi: `insertBooking()` thành `insertOrder()` — một `sale_order` cộng đúng
một `sale_order_item` với `service_type = 'tour'`, trong một `db.batch()` để hai bảng không
lệch nhau khi có lỗi giữa chừng. **Hành vi nhìn từ ngoài không đổi:** cùng payload, cùng mã
đơn, cùng thư báo, cùng phản hồi. 170 test hiện có là lưới nghiệm thu — bước này phải làm cho
chúng xanh lại mà **không sửa kỳ vọng của test nào**, trừ những test đọc thẳng bảng `booking`
trong `test/booking/store.test.ts`.

Làm bước này **trước tiên**, lúc chưa có hệ nào khác đang chao đảo.

### 4.7 Lớp nghiệp vụ: `src/lib/taikhoan/`

Thuần, không import Astro / Sanity / D1.

**`matkhau.ts`** — PBKDF2-HMAC-SHA256 qua WebCrypto. Workers không có argon2 hay scrypt gốc;
PBKDF2 là lựa chọn đúng của nền tảng này. Muối ngẫu nhiên 16 byte riêng từng tài khoản,
≥ 100.000 vòng, so sánh **thời gian hằng** (`crypto.subtle.timingSafeEqual` không có trong
Workers → tự viết vòng XOR toàn chuỗi, không thoát sớm). Chuỗi lưu:
`pbkdf2$<vòng>$<muối b64>$<băm b64>` — mang theo số vòng để sau này nâng được mà không phải
bắt mọi người đổi mật khẩu.

**`phien.ts`** — sinh token 32 byte ngẫu nhiên, trả về `{ token, id }` với `id = SHA-256(token)`.
Chỉ `token` vào cookie, chỉ `id` vào D1. Kiểm phiên: `expires_at > now` và `revoked_at IS NULL`
và `partner.status = 'hoat-dong'`.

**`vai.ts`** — enum đóng `dai-ly | huong-dan-vien | nhan-vien | khach`, cộng hàm hợp lệ hoá.
Một chỗ duy nhất định nghĩa tập vai.

### 4.8 Lớp nghiệp vụ: giá theo vai

Thêm **một thừa số** vào `apDieuChinh()` của `src/lib/booking/quote.ts:46`, **không** thêm một
tầng làm tròn:

```
giá = ceil( gốc × (100+mùa) × (100−vai) × (100−trảTrước) / 10⁶ / 1000 ) × 1000
```

Chú thích hiện có trong `apDieuChinh` đã cảnh báo đúng cái bẫy này: điều kiện thoát sớm phải
canh **cả ba** biến, không phải hai. Bỏ sót một biến là mở lại lỗi làm tròn âm thầm mọi giá gốc
không phải bội số nghìn.

**Hai file, ranh giới dứt khoát** — đừng để tác nhân thi công phải đoán:

| File | Giữ gì | Ai gọi |
|---|---|---|
| `src/lib/booking/quote.ts` | **phép tính**. `apDieuChinh` nhận thêm tham số `vaiPct` (mặc định `0`); `computeQuote` nhận thêm `opts.vaiPercent`. Không biết vai nào là vai nào. | cả trang công khai lẫn `/doi-tac/*` |
| `src/lib/donhang/quote-vai.ts` | **phép tra**. Nhận `(vai, khoáGiá)`, duyệt bảng sinh lúc dựng theo thứ tự ưu tiên, trả về một con số phần trăm. Không tính tiền. | **chỉ** `/doi-tac/*` |

**Bundle công khai không rò gì.** `quote.ts` đi vào trình duyệt của khách lẻ như hiện nay, nhưng
nó chỉ mang thêm *một tham số luôn bằng 0* ở đường công khai — không mang bảng vai, không mang
phép tra. Bảng phần trăm sống trong `quote-vai.ts`, mà `AU1` cấm mọi thứ ngoài `/doi-tac/*`
import. Đây là lý do phép tính và phép tra phải nằm ở hai file khác nhau.

**Năm luật:**

1. **Không khai quy tắc = không giảm.** Dịch vụ nào không có dòng phần trăm cho vai đó thì vai
   đó trả **giá công khai**. Thiếu dữ liệu ra giá cao, không bao giờ ra giá thấp, không bao giờ
   ra lỗi.
2. **Mùa vẫn áp cho đối tác.** Cao điểm là chi phí thật, không phải khuyến mãi cho khách lẻ.
3. **Ưu đãi trả trước không cộng dồn với giá vai** (chủ dự án chốt). Cụ thể, xét **theo từng
   dòng đơn**: dòng nào có phần trăm vai > 0 thì `trảTrước = 0` cho dòng đó. Dòng nào phần trăm
   vai = 0 thì ưu đãi trả trước áp bình thường — nhờ vậy đối tác **không bao giờ trả đắt hơn**
   khách lẻ ở dịch vụ chưa khai quy tắc.
4. **Hạng vé 0 đồng vẫn 0.** Em bé miễn phí nhân bao nhiêu phần trăm vẫn miễn phí.
5. **Máy chủ tính lại, không tin số gửi lên.** `BK5` mở rộng: `total` lệch thì 400. Với giá kín
   thì đây không còn là chống gõ nhầm — đó là chống người ta gửi thẳng `role=dai-ly` vào thân
   yêu cầu. **Vai lấy từ phiên đã ký, cấm đọc từ thân yêu cầu hay query string** (`AU4`).

**Một lỗ hổng ngược, và cách canh nó.** Luật 3 xét theo dòng nên đối tác không bao giờ tệ hơn
khách lẻ *khi không có quy tắc*. Nhưng nếu có quy tắc mà phần trăm vai **nhỏ hơn** phần trăm ưu
đãi trả trước đang bật — ví dụ vai −3% trong khi ưu đãi −5% — thì đối tác trả **đắt hơn** khách
lẻ chọn chuyển khoản trước. Không sửa ngầm. `AU5` cảnh báo **lúc chạy**, vào log Worker, để người vận hành nhìn thấy
và tự quyết.

### 4.9 Cây `/doi-tac/*`

| Đường | Việc |
|---|---|
| `/doi-tac/dang-ky` | Form đăng ký. `noindex`. |
| `/doi-tac/dang-nhap` | Email + mật khẩu. `noindex`. |
| `/doi-tac/` | Trang chính sau đăng nhập: chọn dịch vụ (một danh sách tìm kiếm được, 29 mục) |
| `/doi-tac/gio-hang` | Giỏ: thêm, sửa số khách, đổi ngày, xoá dòng, xem tổng |
| `/doi-tac/dat` | Khai khách cuối, gửi đơn (POST) |
| `/doi-tac/don` | Đơn **mình đã tạo** |
| `/doi-tac/don/[ma]` | Chi tiết một đơn của mình |
| `/doi-tac/dang-xuat` | POST, ghi `revoked_at` |

**Phân quyền: hai trục, không hơn.**

| Trục | Nội dung |
|---|---|
| **Vai → giá** | Vai chỉ đổi *con số*, không mở thêm chức năng nào |
| **Sở hữu** | Mỗi người chỉ thấy đơn **mình tạo**. Không ngoại lệ trong `/doi-tac/*`. |

Không có vai "quản trị" trong vùng đối tác. `nhan-vien` ở đây **chỉ là một mức giá**, không
phải một cấp quyền; nhân viên cần quyền điều hành thì được cấp qua Sanity. Hai việc tách bạch.

**Giỏ hàng sống ở đâu.** Trong một **cookie riêng đã ký** — `td_gio`, `Path=/doi-tac`,
`SameSite=Lax`, ký HMAC bằng cùng secret với phiên. Không phải `sessionStorage`, và lý do là
một ràng buộc chứ không phải khẩu vị: giá vai chỉ được tính ở máy chủ (§4.8 luật 5), nên máy
chủ **phải đọc được giỏ ở mọi lượt tải**, kể cả lượt điều hướng GET. `sessionStorage` thì máy
chủ không với tới.

Cookie chỉ mang **khoá giá, ngày đi, số khách theo hạng** — không mang một con số tiền nào.
Tiền luôn được tính lại từ bảng sinh lúc dựng, nên giả mạo cookie chỉ đổi được *đặt gì*, không
đổi được *giá bao nhiêu*. Chữ ký để bắt sửa tay, không phải để giữ bí mật.

Không bảng giỏ trong D1: giỏ chưa gửi không phải dữ liệu công ty cần giữ. Cookie giới hạn 4KB
— quá 12 dòng thì trang báo "giỏ đã đầy, gửi đơn này rồi tạo đơn tiếp". Đổi máy là mất giỏ,
chấp nhận, và nói rõ trên giao diện.

**Giá vai không rời khỏi Worker.** Trang render HTML đã có sẵn con số. Không endpoint giá,
không JSON giá, không thuộc tính `data-` mang bảng giá vai. Đối tác xem được giá của **chính
mình**, không xem được bảng phần trăm của bất kỳ vai nào, kể cả vai mình.

Hệ quả cho giỏ: mỗi lần đổi số khách hay đổi ngày là **một lượt tải lại từ máy chủ**, không
tính lại trong trình duyệt như form công khai đang làm. Chậm hơn, và đó là cái giá của giá kín.

### 4.10 Đăng ký và duyệt

**Đăng ký.** Dùng lại nguyên ba lớp chống lạm dụng của `ADR-0027`: Turnstile (secret đã có và
đang chạy), honeypot, giới hạn tần suất theo `ip_hash`. `Origin` phải cùng host.

Người đăng ký khai tên, email, SĐT, đơn vị, mật khẩu, và **vai mong muốn — chỉ là nguyện vọng**,
ghi vào `note`, **không đụng cột `role`**. Bản ghi vào D1 với `status = 'cho-duyet'`,
`role = NULL`. Tài khoản ở trạng thái đó đăng nhập không được.

Công ty nhận tin báo qua email và Zalo, dùng lại `src/lib/booking/notify/`.

**Đăng nhập.** Giới hạn tần suất theo `ip_hash` cộng email để chống dò mật khẩu. Sai mật khẩu
và không tồn tại tài khoản trả **cùng một thông báo**, cùng khoảng thời gian — không để trang
đăng nhập thành máy dò xem email nào có tài khoản.

**Cookie phiên:** `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/doi-tac`. Cái `Path` đáng chú ý:
cookie phiên **không bao giờ được gửi kèm khi tải trang công khai**. Rẻ, và cắt hẳn một họ rủi ro.

Hết hạn **7 ngày tuyệt đối**, không gia hạn trượt. Đăng xuất và khoá tài khoản đều ghi
`revoked_at`, có hiệu lực **ngay lượt tải sau** vì mỗi yêu cầu đọc lại phiên từ D1.

**CSRF:** `Origin` cùng host cộng `SameSite=Lax`. Đủ cho form POST.

### 4.11 Tab duyệt trong Studio

Đi qua **cầu API của `ADR-0030` §2** — đường nhận danh tính Sanity của người đang đăng nhập và
hỏi ngược lại Sanity để xác nhận. Không sinh đường quản trị mới, không mật khẩu thứ hai.

Vòng đầu làm **năm** việc: **danh sách chờ duyệt** · xem hồ sơ · **chọn vai rồi duyệt** (ghi
`role`, `status='hoat-dong'`, `approved_at`, `approved_by`) · **khoá tài khoản**
(`status='tam-khoa'` cộng ghi `revoked_at` mọi phiên đang mở) · **sửa bảng `role_rate`**
(thêm, sửa, xoá, đổi `uu_tien`; ghi `updated_at` và `updated_by`).

Việc thứ tư quan trọng hơn vẻ ngoài: đó là cái nút duy nhất chặn được một tài khoản đang lấy
giá sai. Việc thứ năm là chỗ `ADR-0030` §3 đã hứa — *"sắp lại độ ưu tiên là kéo một dòng trong
Studio, không phải sửa mã"* — nay áp cho vai thay vì mùa.

**Quyền sửa `role_rate` là quyền đổi giá bán.** Ai vào được Studio là đổi được. Chấp nhận, vì
đó đúng bằng quyền họ đã có với `bangGiaMuaVu` từ `ADR-0030`; nhưng `updated_by` phải ghi để
truy được, không phải để trang trí.

### 4.12 Ràng buộc mới `AU1`–`AU6`

Siết thêm, nên `04-CONSTRAINTS` §5 cho phép thêm tự do — **nhưng phải có executor script ngay
trong đợt này.** Không lặp lại `B-004`, nơi `BK1`–`BK5` mang mức `fail` mà
`grep -rn "BK1" scripts/` trả về **0 kết quả**, tức năm ràng buộc chặn-phát-hành đang được canh
bằng mắt người.

| Mã | Luật | Validator | Mức |
|---|---|---|---|
| `AU1` | Mọi thứ ngoài `src/pages/doi-tac/` và `src/lib/donhang/` cấm import `quote-vai.ts` và cấm đọc bảng `role_rate` | quét quan hệ import cộng quét chuỗi `role_rate`, cùng khuôn `BK1` | fail |
| `AU2` | Chỉ `src/lib/donhang/store.ts` chứa chuỗi SQL | quét chuỗi `SELECT`/`INSERT`/`UPDATE`/`DELETE`/`CREATE TABLE` ngoài file đó | fail |
| `AU3` | Mật khẩu và token phiên chỉ tồn tại dạng băm; cấm `console.log`; cấm vào Sanity, repo, log | quét mã cộng `git grep` mẫu | fail |
| `AU4` | Vai lấy từ phiên đã ký; cấm đọc `role` từ thân yêu cầu, query string, hay cookie | quét mã trong `src/pages/doi-tac/` | fail |
| `AU5` | Phần trăm vai của một dịch vụ nhỏ hơn phần trăm ưu đãi trả trước đang bật ⇒ đối tác đắt hơn khách lẻ | so hai con số lúc đọc `role_rate` trong `/doi-tac/*`, in cảnh báo vào log Worker | **warn** |
| `AU6` | **Không dữ liệu kín nào được đưa vào Sanity.** Cấm thêm loại tài liệu hay field mang chiết khấu, giá vốn, hoa hồng, hay thông tin tài khoản đối tác | quét `cms/schemas/` theo danh sách từ khoá; kèm một ca đỏ | fail |

Cả **sáu** phải có dòng trong `docs/governance/control-registry.yaml`.

`AU6` sinh trực tiếp từ phép đo ở §4.3: dataset công khai nghĩa là **mọi thứ vào Sanity là
xuất bản**. Luật đó phải có máy canh, vì người sau sẽ không tự nhớ.

### 4.13 Bản đồ file

**Mới**

```
migrations/0003_partner_va_sale_order.sql     # 5 bảng, gồm role_rate
scripts/gen-gia-goc.mjs                       # thuần cục bộ, không mạng
scripts/validators/au-post.ts                 # AU1..AU4, AU6
src/generated/gia-goc.ts                      # SINH RA, .gitignore, CHỈ giá công khai
src/lib/taikhoan/{matkhau,phien,vai}.ts
src/lib/donhang/{gio,quote-vai,store}.ts   # quote-vai = phép TRA, không phải phép tính
src/pages/doi-tac/{index,dang-ky,dang-nhap,gio-hang,dat,dang-xuat}.astro
src/pages/doi-tac/don/{index,[ma]}.astro
src/components/doitac/*.astro
```

**Sửa**

```
package.json                    # gen:gia-goc thành tiền bước của build, check VÀ gate
.gitignore                      # + src/generated/
astro.config.mjs                # KHÔNG ĐỔI
src/lib/booking/quote.ts        # + thừa số vai trong apDieuChinh
src/lib/booking/handler.ts      # đổi đích ghi sang sale_order + sale_order_item
cms/sanity.config.ts            # + tab duyệt tài khoản (KHÔNG thêm schema nào)
docs/governance/control-registry.yaml   # + AU1..AU6
docs/core-specs/04-CONSTRAINTS.md       # + §1e AU1..AU6; sửa §2 điều cấm 3 (§7)
```

**Không chạm:** `TourDetail.astro`, `BookingForm.astro`, `data/prices.yaml`, `resolver.ts`,
`src/lib/queries/seasons.ts`, `_redirects`, sitemap, JSON-LD.

## 5. Kiểm thử

Viết test **trước** ở mọi bước có lớp nghiệp vụ thuần.

| Vùng | Phải có |
|---|---|
| `matkhau.ts` | băm rồi kiểm đúng/sai; hai lần băm cùng mật khẩu ra hai chuỗi khác nhau (muối); chuỗi hỏng không ném mà trả false |
| `phien.ts` | token ≠ id; phiên hết hạn bị từ chối; `revoked_at` bị từ chối ngay; `status ≠ hoat-dong` bị từ chối |
| `quote.ts` (phép tính) | công thức bốn thừa số; **một lần làm tròn**; `vaiPct=0` cho đúng kết quả như hôm nay trên cả 29 khoá giá; hạng 0 đồng vẫn 0 |
| `quote-vai.ts` (phép tra) | thứ tự ưu tiên trên-thắng-dưới; `apCho` trống = mọi dịch vụ; `truRa` thắng `apCho`; không khớp quy tắc nào ⇒ trả `0`, không ném |
| luật 3 (không cộng dồn) | xét **theo từng dòng**: dòng có vai > 0 thì trảTrước = 0; dòng vai = 0 thì ưu đãi áp bình thường; đơn trộn hai loại dòng ra đúng tổng |
| `gio` | cộng nhiều dòng; xoá dòng; `line_no` liên tục sau khi xoá; cookie `td_gio` sai chữ ký bị bỏ, coi như giỏ rỗng, **không** ném lỗi ra mặt người dùng; giỏ quá 12 dòng bị chặn |
| `store.ts` | ghi đơn nhiều dòng trong một `batch`; lỗi giữa chừng không để lại đơn cụt |
| **chuyển bảng** | **170 test hiện có phải xanh lại**, chỉ `store.test.ts` được sửa kỳ vọng |
| migration `0003` | chạy trên bản sao dữ liệu thật: số dòng `sale_order` = số dòng `booking`; mọi `code` khớp; `total` khớp `json_extract(quoted_json,'$.total')` |
| `role_rate` (store) | `uu_tien` nhỏ hơn thắng; `tru_ra` thắng `ap_cho`; `ap_cho` NULL = mọi dịch vụ; bảng rỗng ⇒ trả `0` |
| `gen:gia-goc` | thiếu `prices.yaml` ⇒ **thoát khác 0**; YAML hỏng ⇒ thoát khác 0; parse ra **0 dòng** ⇒ thoát khác 0 (không được im lặng) |
| `AU1`–`AU6` | mỗi validator có một ca **đỏ** cố ý, chứng minh nó thật sự bắt |

Ca đỏ cố ý là điều kiện bắt buộc. Một validator chưa từng đỏ là một validator chưa ai biết có
chạy hay không. Bằng chứng gần nhất trong chính kho này là `B-004` (`docs/BACKLOG.md`):
`grep -rn "BK1\|BK2\|BK3\|BK4\|BK5" scripts/` trả về **0 kết quả**, và
`docs/governance/control-registry.yaml` không có dòng `BK` nào — tức năm ràng buộc mức `fail`
của module đặt tour đang được canh bằng mắt người. `AU1`–`AU6` không được đi vào vết đó.

## 6. Cổng phải xanh trước khi gộp

0. **Chứng minh sớm nhất, làm trước mọi thứ khác:** một trang vứt đi `/doi-tac/ping.astro` với
   `prerender = false`, dựng và phục vụ thật, trả về dấu thời gian đổi theo mỗi lượt tải. Bằng
   chứng hiện có cho `prerender = false` dưới `output: 'static'` là `api/dat-tour.ts` — một
   **endpoint `.ts`**, không phải trang `.astro`. Tám trang mới đứng trên giả định đó; xác nhận
   nó mất vài phút, còn phát hiện nó sai ở cuối đợt thì mất cả đợt.
1. `npm test` — xanh, và **số test tăng**, không chỉ không giảm
2. `npm run build` **rồi mới** `npm run gate` — chạy ngược thứ tự này sinh đỏ ảo (`DR-105`)
3. `AU1`–`AU6` chạy thật, có kết quả in ra, kèm bằng chứng ca đỏ
4. `git grep` không thấy mật khẩu thô, token phiên, hay `src/generated/` trong chỉ mục git
5. Sau deploy: `deploy-verifier` — *"Success" của wrangler không có nghĩa asset đã lên*
6. Kiểm bằng tay trên production: tài khoản `cho-duyet` **không** đăng nhập được; tài khoản bị
   khoá mất quyền **ngay lượt tải sau**; trang công khai `view-source` **không** chứa một con số
   giá vai nào
7. **Kiểm rò bằng đúng đường của kẻ tấn công:** `curl` không token vào Sanity với mọi `_type`
   mới — phải không trả về dữ liệu kín nào. `AU6` canh mã, cổng này canh thực tế.

Cổng 6 và 7 là hai cổng duy nhất chứng minh mục tiêu §1 đã đạt. Không có chúng thì mọi cái còn
lại chỉ chứng minh mã chạy được.

### 6b. Thứ tự thao tác lúc phát hành — bắt buộc theo đúng thứ tự này

§4.6 chép `booking` sang `sale_order`. Đơn nào tới **giữa lúc chạy migration và lúc bản mới
lên** vẫn được mã cũ ghi vào `booking` và sẽ **không bao giờ** sang bảng mới. Phép kiểm "số dòng
bằng nhau" ở §5 **phát hiện** được, nhưng không **sửa** được.

1. Ghi lại mốc thời gian `T` (UTC) ngay trước bước 2
2. `wrangler d1 migrations apply` — tạo bảng, chép lô đầu
3. `npm run deploy` — mã mới bắt đầu ghi thẳng vào `sale_order`
4. **Chạy lô vét:** đúng hai câu `INSERT … SELECT` của §4.6, thêm `WHERE b.created_at >= T`
   và `AND b.code NOT IN (SELECT code FROM sale_order)`
5. **Rồi mới** khẳng định `COUNT(booking) = COUNT(sale_order)`

Bỏ bước 4 là mất đơn của khách thật, trong im lặng.

## 7. Nợ luật phải trả TRƯỚC khi có dòng code nào

| # | Việc | Loại | Trạng thái |
|---|---|---|---|
| 1 | `ADR-0033` — vùng đăng nhập đối tác; **bổ sung** `ADR-0027` và `ADR-0030`, không sửa chúng (điều cấm 2.5) | ADR mới | **đã soạn, chờ phê chuẩn** |
| 2 | Nới **điều cấm 2.3** (`04-CONSTRAINTS` §2): thêm ngoại lệ *"vùng `/doi-tac/*` được render giá ở máy chủ; trang công khai vẫn không gọi API giá và không fetch giá phía client"* | **nới** — cần phê chuẩn | **chờ** |
| 3 | Nới **`BK1`** (§1d): trang trong `/doi-tac/*` được đọc bảng giá gốc sinh lúc dựng **và** đọc `role_rate` từ D1 lúc chạy. `BK1` cho `src/lib/booking/*` và `api/dat-tour.ts` **giữ nguyên** | **nới** — cần phê chuẩn | **chờ** |
| 4 | Gỡ *"không giỏ hàng"* ở `00-PROJECT_BRIEF` §5 — chỉ trong phạm vi vùng đăng nhập | **nới** — cần phê chuẩn | **chờ** |
| 5 | `QĐ-2026-08-31-04` trong `DECISIONS.md` ghi ba khoản nới trên kèm lý do | bản ghi | **chờ** |
| 6 | Phiếu `DR-` cho `05-URL_MAP` §2 — vẫn khẳng định *"Không có DB nào khác"*; **năm** bảng mới làm vết lệch đó rộng thêm (`B-005`) | drift | **chờ** |
| 7 | `04-CONSTRAINTS` §1e mới cho `AU1`–`AU6` | siết — tự do | **chờ** |
| 8 | Phiếu `DR-` cho **dataset Sanity `production` đọc được không cần token** (`aclMode: public`, đo 2026-08-31). Không do spec này sinh ra, nhưng đây là chỗ đầu tiên phát hiện; phải vào sổ để người sau không lặp lại đúng lỗi đã bị bác ở §4.3 | drift | **chờ** |

> **Đừng cấp số `DR-` sẵn ở đây.** `B-018` đã xếp `DR-107`, `DR-108`, `DR-109` cho ba việc khác
> và tự cảnh báo *"số `DR-*` đã va bốn lần ở luồng này — grep cả `main` lẫn nhánh đang sống
> trước khi cấp"*. Cao nhất đã lập phiếu trong `DRIFT_LOG.md` là `DR-106` (đo 2026-08-31). Cấp
> số lúc **ghi phiếu**, không phải lúc soạn spec.

### 7b. Một câu hỏi CÒN MỞ, phải chốt ở QA1 trước khi code

**Ưu đãi trả trước loại theo DÒNG hay theo NGƯỜI?** §4.8 luật 3 hiện chọn *theo dòng*. Cách đọc
đó có một hệ quả chưa xử lý:

- `sale_order.payment_method` là **một cột cho cả đơn**, và hình dạng `quoted_json` của
  `ADR-0031` (`prepay: { percent, totalGoc }`) mang **một** phần trăm cho cả đơn.
- Một đơn có dòng A (có giá vai, không ưu đãi) và dòng B (không quy tắc, có ưu đãi) thì
  **không tồn tại** một phần trăm ưu đãi cấp đơn nào đúng cả.
- `ADR-0032` khớp tiền chuyển khoản theo **tổng đơn**, nên một tổng không giải thích được ở cấp
  đơn sẽ làm khó khâu đối soát.

Lời chủ dự án là *"có giá vai thì thôi ưu đãi"*. Đọc **theo người** — *đối tác không nhận ưu đãi
trả trước, chấm hết* — hợp câu chữ hơn và giữ `quoted_json` nguyên hình dạng cũ.

Cách đọc theo dòng được chọn để tránh trường hợp đối tác trả đắt hơn khách lẻ. Nhưng `AU5` cần
có **dù chọn cách nào**, và `AU5` mới là thứ thật sự canh trường hợp đó — nên cách đọc theo
dòng **không mua thêm được gì** ngoài phần phức tạp nó mang vào.

**Khuyến nghị của Cowork: đọc theo NGƯỜI.** Cần chủ dự án xác nhận ở QA1. Nếu chốt theo người
thì §4.8 luật 3 rút gọn còn một câu và `quoted_json` không đổi.

**Khoản 3 đáng đọc kỹ.** Cách sai là đặt tên file khác — một `api/dat-hang.ts` đọc giá sẽ thoả
mãn `BK1` về mặt câu chữ vì `BK1` chỉ đích danh `src/pages/api/dat-tour.ts` và
`src/lib/booking/*`. Nó vi phạm về mặt tinh thần, và `B-004` đã ghi rằng `BK1`–`BK5` không có
validator máy nào — nên **không ai bắt được**. Nới thẳng, ghi rõ, có mã.

## 8. Còn nợ / rủi ro đã biết

- **`B-003` chạm vào đây.** `handler.ts:211–213` trả mã đơn cũ kèm tổng tiền mới ở nhánh đơn
  trùng. §4.6 chuyển bảng nhưng **không sửa gốc**. Sửa gốc = đọc lại đơn cũ từ D1; vẫn nợ.
- **`B-001`/`B-002` sẽ có bạn mới.** `src/components/doitac/*` phải dùng token ngay từ dòng đầu,
  vì `ADR-0030` §4 cấm mã màu và cỡ chữ viết cứng, và hai khoản nợ kia sinh ra đúng vì không ai
  chặn ở ngày đầu.
- **Giỏ mất khi đổi máy.** Chấp nhận có ý thức (§4.9). Nếu đối tác kêu, đó là lúc cân nhắc bảng
  giỏ trong D1 — không phải bây giờ.
- **Mỗi thao tác trong giỏ là một lượt tải lại.** Cái giá của giá kín. Nếu chậm tới mức khó
  dùng thì đường thoát **không** phải là gửi giá xuống trình duyệt, mà là giảm số lượt tải.
- **Không có quên mật khẩu.** Nhân viên đặt lại trong Studio. Sẽ thành phiền khi số tài khoản
  lớn lên; đó là lúc viết spec cho nó.
- **`AU5` chỉ mức `warn`.** Nếu người biên tập bỏ qua cảnh báo thì đối tác thật sự trả đắt hơn
  khách lẻ. Nâng lên `fail` là siết, làm được bất cứ lúc nào — chưa làm ngay vì chưa biết tần
  suất thật.
- **Kiểm lại `.assetsignore` sau mọi lần nâng adapter.** Bảng giá **gốc** trong bundle Worker
  đứng trên một dòng trong file đó (§4.4). Bảng **kín** không còn đứng ở đó nữa — nó ở D1 (§4.3).
- **Dataset Sanity công khai là một sự thật rộng hơn spec này.** `production` có
  `aclMode: public`; bất kỳ ai có `projectId` — in sẵn trong mọi URL ảnh của mọi trang — đọc
  được toàn bộ nội dung, gồm cả bản `draft` chưa xuất bản. Spec này chỉ **tránh** nó bằng `AU6`,
  không chữa. Có siết ACL hay không là quyết định riêng ở tầng ADR, ngoài phạm vi ở đây. Lập
  phiếu `DR-` để không ai quên — cấp số lúc ghi, xem cảnh báo va số ở §7.
