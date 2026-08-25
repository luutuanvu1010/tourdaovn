# Bằng chứng — quét Luật 2 trong thân bài

`06` §6 **Luật 2**: *"cấu trúc giữ khung, bài viết giữ chiều sâu. Field cấu trúc
(`accessInfo`, `itinerary`, `includes`, `openingHours`…) là câu trả lời ngắn ở vùng cố định;
`body` không mở mục cùng vai."*

Script đo xem biên tập có mở lại một field cấu trúc thành mục trong thân bài hay không.

## Chạy lại

```
node docs/evidence/2026-08-25-luat2-body/quet-luat2.mjs
```

Đọc `dist/`, không cần mạng, không cần token.

## Kết quả lần đo (2026-08-25)

**12 ca trên 11 trang:** `Phù hợp` 5 · `Địa chỉ` 2 · `Thời lượng` 2 · `Giờ mở cửa` 3.

## Con số này đo ĐÚNG cái gì — đọc trước khi trích dẫn

Nó đo: **nhãn của một ô Thông tin nhanh, xuất hiện lại trong `.body-block`, ngay trước dấu hai chấm,
ở đầu câu hoặc đầu khối.** Không hơn.

**Ba lần đếm sai trước khi ra 12.** Ghi lại vì mỗi lần sai là một bài học khác nhau:

| Lần | Kết quả | Vì sao sai |
|---|---|---|
| 1 | **4** | Làm phẳng HTML rồi gộp mọi khoảng trắng, nên ranh giới thẻ biến mất; chỉ bắt được nhãn đứng sau dấu chấm. Mọi nhãn mở đầu một `h2`/`h3` đều lọt |
| 2 | **12** | Chèn `¶` ở ranh giới thẻ trước khi làm phẳng |
| 3 | **13** | Thêm nhánh cụm ghép (`Giá vé & Giờ mở cửa:`) — đúng, +1 ca thật |
| 4 | **12** | Cắt thân bài bằng **cửa sổ 60.000 ký tự** nên nuốt cả FAQ và chân trang → 1 ca giả (`dia-danh/cang-du-lich-nha-trang`, nhãn nằm trong `faq-answer` ở byte 35370 trong khi `.body-block` bắt đầu ở 20515). Cắt đúng phần tử bằng cách đếm độ sâu `<div>` |

Lần 4 là **đúng lỗi mà `QĐ-2026-08-25-03` đã ghi ở một chỗ khác** — "cửa sổ ký tự không phải phạm vi
phần tử" — lặp lại trong chính script viết ra để kiểm thứ khác. Ghi ra đây để lần sau đọc thấy trước
khi mắc lại.

## Hai chỗ script này MÙ — nó không đo hết Luật 2

**1. Chỉ soi nhãn lấy từ `fact-strip`.** Nên bốn vai mà `06` §6 gọi tên trực tiếp —
`itinerary`, `includes`, `excludes`, `accessInfo` — **không bao giờ bị phát hiện**, vì chúng là
mục nội dung chứ không phải ô Thông tin nhanh.

Ví dụ script này trả 0: `tour/tour-3-dao-hon-mun-hon-mun-lang-chai-hon-tam` render mục
"Lịch trình" (`#itinerary`) và "Bao gồm / Không bao gồm" (`#includes`), trong khi thân bài mở
`<h3>Lịch trình Tour 3 đảo Hòn Mun</h3>`, `<h3>Tour 3 đảo Hòn Mun bao gồm</h3>`,
`<h3>Tour 3 đảo Hòn Mun không bao gồm</h3>` — ba mục cùng vai với ba mục cấu trúc ngay trên cùng trang.

Phép đo rộng hơn (tiêu đề thân bài trùng vai với một mục cấu trúc **thật sự render trên cùng trang**)
cho **khoảng 33 trang / 54 va chạm** — cận trên, vì một số là câu hỏi kiểu FAQ chứ không phải mục.
Con số đó **chưa được xác nhận từng ca**, nên đừng trích như đã chốt.

**2. Bỏ qua toàn bộ trang cẩm nang.** `NHANH` có `'cam-nang'`, nhưng trang cẩm nang không có
`fact-strip` nên `if (!nhan.length) continue` loại hết. Cẩm nang có thể có ca Luật 2 mà script này
không thấy.

**Vậy nên:** trích "12 ca" là *"nhãn Thông tin nhanh bị mở lại có dấu hai chấm trong thân bài"*.
Trích nó như *"12 ca Luật 2"* là nói quá — họ `itinerary`/`includes` lớn hơn và chưa ai đếm cho xong.
