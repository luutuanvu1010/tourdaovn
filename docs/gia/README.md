# Bảng giá trên Google Sheet — bố cục chuẩn

> Căn cứ: `QĐ-2026-08-26-02`. Sheet là **bề mặt nhập**, `data/prices.yaml` vẫn là **nguồn sự thật**.
> Đồng bộ **một chiều**, chạy bằng tay: `npm run prices:pull`. Không bao giờ chảy ngược,
> không đọc lúc build, không đọc lúc chạy.

## Sheet

- **Tệp:** `PRICES_SHEET_ID_TRONG_ENV`
- **Quyền:** *bất kỳ ai có đường liên kết → người xem*. Script đọc qua đường xuất công khai của
  Google, không dùng khoá API, không OAuth, không thêm dependency.
- **Tab phải tên là `gia`** (viết thường, không dấu). Script tìm tab theo **tên**, nên thêm tab
  khác (ghi chú, bản nháp, tính toán) không làm hỏng đồng bộ — miễn đừng đổi tên tab `gia`.

⚠ **Sheet này công khai với ai có link.** Giá bán vốn đã hiện trên trang nên chấp nhận được.
**Cấm** để giá vốn, chiết khấu đại lý, hay ghi chú nội bộ về khách vào đây. Cần những thứ đó thì
mở một Sheet thứ hai và **không** nối vào đường đồng bộ.

## Hàng 1 là tiêu đề — giữ nguyên đúng 12 tên cột này

| # | Cột | Bắt buộc | Vào `prices.yaml`? | Luật |
|---|---|---|---|---|
| A | `khoa` | ✅ | ✅ khoá của dòng | Chữ thường, số, gạch ngang. **Định danh ổn định** — xem cảnh báo dưới |
| B | `ten_tour` | — | ❌ chỉ để người đọc | Tên tour cho dễ tra |
| C | `slug_tour` | — | ❌ chỉ để người đọc | Đường dẫn tour tương ứng |
| D | `don_vi` | ✅ | ✅ `unit` | Luôn là `perPax`. Khác đi → `PY3` báo đỏ |
| E | `gia_nguoi_lon` | ✅ | ✅ `amount` | Số nguyên VND, **không dấu chấm, không "đ"** |
| F | `gia_tre_em` | — | ✅ `paxRates.child.amount` | Trống = hạng này không hiện trong form |
| G | `ghi_chu_tre_em` | — | ✅ `paxRates.child.note` | **≤ 40 ký tự**. Ví dụ: `5–11 tuổi` |
| H | `gia_cao_tuoi` | — | ✅ `paxRates.senior.amount` | |
| I | `ghi_chu_cao_tuoi` | — | ✅ `paxRates.senior.note` | **≤ 40 ký tự**. Ví dụ: `từ 60 tuổi` |
| J | `gia_em_be` | — | ✅ `paxRates.infant.amount` | Được phép `0` |
| K | `ghi_chu_em_be` | — | ✅ `paxRates.infant.note` | **≤ 40 ký tự** |
| L | `ghi_chu_noi_bo` | — | ❌ | Ghi chú cho người, script bỏ qua |

Ba hạng phụ là **danh sách đóng**: chỉ `child`, `senior`, `infant`. Không thêm hạng mới bằng cách
thêm cột — thêm là `PY7` báo đỏ. Muốn hạng khác là một quyết định ở tầng `ADR-0027`.

## Cảnh báo về cột `khoa` — đã trả giá một lần

`khoa` là **định danh ổn định của một dòng giá**, không phải slug. Nhiều khoá hiện trùng slug chỉ
vì lịch sử.

**Đừng đổi `khoa` khi biên tập đổi slug tour.** Đổi là làm dòng giá mồ côi và tour mất form đặt.
Chuyện này đã xảy ra thật ngày 2026-08-22 — xem `DR-062` trong `docs/DRIFT_LOG.md`.

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

- `mau-nhap-gia.csv` — ảnh chụp ngày 2026-08-26 để nhập lần đầu: 8 dòng giá đang có (điền sẵn)
  + 21 tour chưa có giá (để trống). Đây là **hạt giống**, không phải nguồn — sau khi Sheet chạy
  thì `data/prices.yaml` và Sheet mới là cặp đang sống.
