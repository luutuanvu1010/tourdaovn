# Bằng chứng — đo bố cục thật cho Luật 3 (`QĐ-2026-08-25-01`)

Đo ngày **2026-08-25** để thay các con số **ước lượng** trong `QĐ-2026-08-25-01` và `06` §3 hàng Hero
bằng số **đo được**. Trước bản đo này, mọi con số về vị trí thanh dính đều là phép cộng từ CSS —
và phép cộng đầu tiên **sai 18px** vì bỏ sót `line-height` của breadcrumb, sai thêm ~56px nữa vì
giả định tiêu đề luôn một dòng.

## Chạy lại

```
# 1. phục vụ bản dựng trên IPv4 (dev server của Astro chỉ bind IPv6 —
#    Chrome không với tới `localhost:4321`, đó là lý do phải làm bước này)
cd dist && python3 -m http.server 4323 --bind 127.0.0.1

# 2. mở Chrome headless có cổng gỡ lỗi
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --hide-scrollbars --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-prof about:blank

# 3. đo
node do-layout.mjs "http://127.0.0.1:4323/tour/<slug>/" 1366 657
node do-layout.mjs "http://127.0.0.1:4323/tour/<slug>/" 390 844
```

## Hai cái bẫy đã sập, ghi lại để khỏi sập lần nữa

**1. Extension Claude cho Chrome không đo được ở phiên này.** `javascript_tool` chạy trong một ngữ
cảnh khác với tab được khai: `location.pathname` trả `/` trong khi tab đang ở trang tour, và
`resize_window` không đổi `innerWidth`. Ba lần thử đều vậy. Dùng CDP trực tiếp thì đúng ngay.

**2. `--screenshot` kèm `--window-size` KHÔNG dựng đúng layout viewport của thiết bị.** Ảnh chụp
390×844 bằng cách đó cho thấy chữ bị cắt ở mép phải và nút Chat Zalo mất một nửa — trông y như lỗi
tràn ngang. Đo bằng `Emulation.setDeviceMetricsOverride` thì `scrollWidth` = 390, **tràn ngang = 0**.
Ảnh chụp đó là **giả tượng**, và nó suýt thành một phiếu lỗi sai. Muốn ảnh đúng thì phải chụp qua
CDP `Page.captureScreenshot` sau khi đã đặt device metrics.

## Kết quả lần đo

Trang tour, hai đầu biên độ độ dài tiêu đề. Viewport **1366×657** — chiều cao viewport thật của
trình duyệt trên màn 768 sau khi trừ chrome. Lấy 768 là lấy chiều cao **màn hình**, không phải
chiều cao vùng nhìn thấy; sai chỗ đó thì kết luận đảo ngược.

| Trang | Tiêu đề | h1 | Dải breadcrumb | Dải tiêu đề | Ảnh bắt đầu | Thanh dính | Trên màn đầu? |
|---|---|---|---|---|---|---|---|
| `tour/ve-vin-harbour` | 14 ký tự | 46px, **1,14 dòng** | 69px | 100px | 238px | **618 → 675px** | mép trên lọt, mép dưới cắt |
| `tour/hon-tam-tron-goi…` | 65 ký tự | 46px, **2,14 dòng** | 69px | 156px | 294px | **674 → 731px** | **KHÔNG** |

Ở viewport 1366×**768** thì cả hai đều lọt — nên con số phụ thuộc hoàn toàn vào việc lấy chiều cao
màn hay chiều cao viewport.

**14/28 trang tour có tiêu đề trên 45 ký tự**, nên ca hai dòng là **nửa số trang**, không phải ngoại lệ.

### Khổ di động 390×844

| Đo | Giá trị |
|---|---|
| Tràn ngang | **0** (`scrollWidth` = 390) |
| Dải breadcrumb | **128px** — breadcrumb xuống 3 dòng vì mắt cuối là tiêu đề dài |
| Dải tiêu đề | **200px** — h1 32px, **4,2 dòng** |
| Ảnh hero bắt đầu | **397px** — tức **47% màn đầu là chữ** |
| Thanh dính | 725 → 782px, vẫn trong 844 |

`SPEC-2026-08-22-be-mat-vong-5` §3.6 loại phương án "đưa chữ lên trên hero" với lý do *"trên di động
390px ảnh bị đẩy xuống ~160px; màn đầu toàn chữ, mất cú hích cảm xúc"*. Thực tế đo được là **328px**
— **hơn gấp đôi** con số §3.6 lo. Lo ngại đó được xác nhận bằng số, và nặng hơn dự đoán của chính nó.

## Điều làm cả phép đo này thành lý thuyết

`sticky-bar__price` render trên **0 trang** trong bản dựng: `priceLabel` phân giải từ
`data/prices.yaml` qua `bookingRef.key` và hiện không khớp gì. Thanh dính chỉ mang neo mục và nút
"Chat Zalo". Theo `06` §6 Luật 3 thì không có giá thì ẩn vùng giá — nên **hôm nay chưa vi phạm**.
Ngày giá phân giải được thì nửa số trang tour vi phạm ngay. Đây là nợ mở.
