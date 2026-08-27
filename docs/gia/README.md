# Bảng giá trên Google Sheet — bố cục chuẩn

> Căn cứ: `QĐ-2026-08-26-02`. Sheet là **bề mặt nhập**, `data/prices.yaml` vẫn là **nguồn sự thật**.
> Đồng bộ **một chiều**, chạy bằng tay: `npm run prices:pull`. Không bao giờ chảy ngược,
> không đọc lúc build, không đọc lúc chạy.

## Sheet

- **Tệp:** mã Sheet **không ghi trong kho** — kho là public và Sheet bật "Xuất bản lên web"
  nên `gviz/tq` đọc được ẩn danh, tức mã Sheet là chìa khoá chứ không phải định danh vô hại.
  Đặt ở `.env` gốc repo: `PRICES_SHEET_ID=<mã>`. Mã nằm trong URL của Sheet:
  `docs.google.com/spreadsheets/d/<mã>/edit`.
- **Quyền:** *bất kỳ ai có đường liên kết → người xem*. Script đọc qua đường xuất công khai của
  Google, không dùng khoá API, không OAuth, không thêm dependency.
- **Tab phải tên là `gia`** (viết thường, không dấu). Script tìm tab theo **tên**, nên thêm tab
  khác (ghi chú, bản nháp, tính toán) không làm hỏng đồng bộ — miễn đừng đổi tên tab `gia`.

⚠ **Sheet này công khai với ai có link.** Giá bán vốn đã hiện trên trang nên chấp nhận được.
**Cấm** để giá vốn, chiết khấu đại lý, hay ghi chú nội bộ về khách vào đây. Cần những thứ đó thì
mở một Sheet thứ hai và **không** nối vào đường đồng bộ.

## Hàng 1 là tiêu đề — 13 cột

| # | Cột | Bắt buộc | Vào `prices.yaml`? | Luật |
|---|---|---|---|---|
| A | `Mã tour` | — | ❌ | Tiền tố `TD`, **tối đa 10 ký tự**. Xem mục dưới |
| B | `Tên tour` | — | ❌ chỉ để người đọc | |
| C | `Khoá giá` | ✅ | ✅ khoá của dòng | Chữ thường, số, gạch ngang. **Định danh ổn định** — xem cảnh báo |
| D | `Đường dẫn` | — | ❌ chỉ để người đọc | Slug tour tương ứng |
| E | `Đơn vị` | ✅ | ✅ `unit` | Luôn `perPax`. Khác đi → `PY3` báo đỏ |
| F | `Giá người lớn` | ✅ | ✅ `amount` | Số nguyên VND |
| G | `Giá trẻ em` | — | ✅ `paxRates.child.amount` | Trống = hạng này không hiện trong form |
| H | `Ghi chú trẻ em` | — | ✅ `paxRates.child.note` | **≤ 40 ký tự**. Ví dụ: `5–11 tuổi` |
| I | `Giá người cao tuổi` | — | ✅ `paxRates.senior.amount` | |
| J | `Ghi chú người cao tuổi` | — | ✅ `paxRates.senior.note` | **≤ 40 ký tự**. Ví dụ: `từ 60 tuổi` |
| K | `Giá em bé` | — | ✅ `paxRates.infant.amount` | Được phép `0` |
| L | `Ghi chú em bé` | — | ✅ `paxRates.infant.note` | **≤ 40 ký tự** |
| M | `Ghi chú nội bộ` | — | ❌ | Script bỏ qua |

**Tiêu đề đọc máy được mà vẫn dễ đọc.** Script chuẩn hoá tiêu đề trước khi khớp: bỏ khoảng trắng
thừa, hạ chữ thường, bỏ dấu. Nên `Giá người lớn`, `giá người lớn `, `GIA NGUOI LON` đều ăn về
cùng một cột. Script tìm cột **theo tiêu đề, không theo vị trí** — chèn thêm cột không làm hỏng.

**Số tiền**: gõ kiểu nào cũng được — `800000`, `800.000`, `800,000`, `800 000`. Script tự bỏ dấu
phân cách. Không cần gõ `đ` hay `VNĐ`.

Ba hạng phụ là **danh sách đóng**: chỉ `child`, `senior`, `infant`. Không thêm hạng mới bằng cách
thêm cột — thêm là `PY7` báo đỏ. Muốn hạng khác là một quyết định ở tầng `ADR-0027`.

## Cột `Mã tour`

Định danh ngắn cho việc kinh doanh — gọi điện, ghi sổ, nói với nhân viên. Tiền tố `TD`, tối đa
10 ký tự. Nhóm theo dòng sản phẩm để nhìn mã là biết loại:

| Dải | Dòng sản phẩm | Đang dùng |
|---|---|---|
| `TD1xx` | Tour đảo, lặn biển | `TD101`–`TD113` |
| `TD2xx` | Vé công viên (VinWonders, Vin Harbour) | `TD201`–`TD209` |
| `TD3xx` | Du thuyền | `TD301`–`TD306` |

**Hiện mã này chỉ sống trong Sheet.** Nó **không** vào `data/prices.yaml`, không hiện trên trang,
không vào đơn đặt. Lý do: `validatePY2` có danh sách khoá đóng, thêm field vào file giá là đổi
lược đồ và cần quyết định riêng. Script vẫn **kiểm định dạng và cảnh báo** nếu gõ sai, nhưng
không chặn.

Muốn mã tour hiện trong thư báo đơn (để nhân viên đối chiếu nhanh) thì đó là việc mở thêm — nói
một tiếng.

## Cảnh báo về cột `Khoá giá` — đã trả giá một lần

`Khoá giá` là **định danh ổn định của một dòng giá**, không phải slug. Nhiều khoá hiện trùng slug
chỉ vì lịch sử.

**Đừng đổi `Khoá giá` khi biên tập đổi slug tour.** Đổi là làm dòng giá mồ côi và tour mất form
đặt. Chuyện này đã xảy ra thật ngày 2026-08-22 — xem `DR-062` trong `docs/DRIFT_LOG.md`.

Khoá này phải khớp với `bookingRef.key` của tour trong Sanity Studio. Lệch một bên là `PY4` báo.

## Cách dùng

**Lần đầu:** mở Sheet → *Tệp → Nhập → Tải lên* → chọn `docs/gia/mau-nhap-gia.csv` →
*Thay thế trang tính hiện tại*. Rồi đổi tên tab thành `gia`.

**Mỗi lần cập nhật giá:**

1. Sửa trong Sheet.
2. Chạy `npm run prices:pull` trong repo.
3. Xem `git diff data/prices.yaml` — script **không tự commit**.
4. Ưng thì commit. Dựng lại site thì giá mới lên.

**Xoá một dòng giá** không tự động: script sẽ liệt kê và **dừng**. Chỉ xoá khi thêm cờ tường minh,
vì xoá một dòng đang được trỏ tới là làm tour đó mất form.

## Tệp trong thư mục này

- `mau-nhap-gia.csv` — ảnh chụp ngày 2026-08-26 để nhập lần đầu: 29 dòng gồm 7 tour đã có giá
  (điền sẵn, sinh thẳng từ `data/prices.yaml`), 21 tour chưa có giá kèm khoá đề xuất, và 1 dòng
  giá mồ côi. Đây là **hạt giống**, không phải nguồn — sau khi Sheet chạy thì `data/prices.yaml`
  và Sheet mới là cặp đang sống.

## Bẫy khi thêm lệnh proxy

`package.json` ở gốc repo chỉ **proxy** sang `scripts/` — `"prices:pull": "npm --prefix scripts run
prices:pull --"` — để người vận hành không phải nhớ script nào nằm ở đâu. Nếu lệnh có nhận tham số
thì dòng proxy **phải kết thúc bằng `--`**. Thiếu nó, tham số bị nuốt qua hai chặng `npm`: chặng
ngoài bỏ mất dấu `--`, chặng trong thấy `--cho-phep-xoa` mà không có `--` đứng trước nên hiểu đó là
tuỳ chọn của chính npm và **nuốt luôn, không báo lỗi** — chỉ ô trần như đường dẫn tệp sống sót.
Hai dòng proxy có sẵn (`validate:git-governance`, `audit:spec`) **không** lộ bẫy này, chỉ vì cả hai
đều không nhận tham số. Nghi ngờ thì đo: một script tạm in `process.argv.slice(2)` là thấy ngay.
