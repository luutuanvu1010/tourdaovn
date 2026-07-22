# ADR-0007 — Nguồn giá phase 1 là prices.yaml trong repo; hai trigger build

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
ADR gốc, bất biến — KHÔNG sửa nội dung.
ENGINE: prices.yaml + price loader/resolver/validator + hai trigger build (git push,
  Sanity webhook), map giá sang JSON-LD Offer/AggregateOffer.
CẦN TỔNG QUÁT HÓA: priceCurrency cứng VND và enum unit (perPax/perRoomNight/perTicket)
  là của nhatrangtravel. Trong Core: currency là tham số địa phương (SGD, USD...); tập
  pricing-unit là tham số loại hình (nhà hàng có thể có unit khác tour). Xem ADR-0020.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** accepted, phê chuẩn 2026-06-11. ADR này đóng mệnh đề để mở "phase 1 nguồn này có thể tối giản (file, sheet, hoặc DB nhẹ); dạng cụ thể chốt ở bước 2 SAD" trong ADR-0003; phần còn lại của ADR-0003 giữ nguyên hiệu lực.
- **Ngày:** 2026-06-11   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa một chiều ở seam dữ liệu giá. Bản thân việc chọn YAML thay vì sheet là đảo được về kỹ thuật, nhưng thay nguồn phía sau `bookingRef` đã được ADR-0003 xếp là cửa một chiều cần ADR, nên chốt dạng nguồn đi cùng thủ tục đó.
- **Liên quan:** ADR-0003 (seam giá một chiều), ADR-0001 (Cloudflare), `project/02-SAD.md` đã duyệt 2026-06-11, `project/01-CONTENT_MODEL.md` v1.0.1 (I1, I14, I16), `DECISIONS.md` ba bản 2026-06-11 (bước 2 SAD, soát kiến trúc, phê chuẩn SAD), overlay S2.8 ràng buộc 8.

## Bối cảnh

ADR-0003 mở seam giá một chiều nhưng để mở dạng nguồn giá phase 1, chờ bước 2 SAD chốt. Bước 2 đã chạy xong: founder chốt 7 lựa chọn qua trắc nghiệm, Cowork soát kiến trúc độc lập đóng thêm 4 điểm (trong đó có trigger build nội dung mà ADR-0003 không bàn tới), founder phê chuẩn SAD ngày 2026-06-11. ADR này hoàn tất thủ tục cửa một chiều, khóa các quyết định đã duyệt thành bản ghi kiến trúc, làm căn cứ cho 04-CONSTRAINTS.

## Quyết định

1. Nguồn giá phase 1 là một file `prices.yaml` đặt trong repo của site. Định dạng YAML, chỉ chứa giá bán công khai bằng VND. Cấm giá vốn, hoa hồng, dữ liệu khách và khóa bí mật trong file này (S2.8 ràng buộc 8).
2. Khóa nối là `bookingRef` dạng chuỗi: khóa cấp cao nhất trong file, trùng giá trị field `bookingRef` bên Sanity. Đây là cây cầu duy nhất giữa hai nguồn sự thật, chỉ trỏ một chiều từ Sanity sang nguồn giá.
3. Đơn vị giá là enum đóng ba giá trị: perPax (`amount` đơn hoặc `tiers[]` theo `maxPax` cho tour riêng), perRoomNight (`from` cộng `asOf` bắt buộc, I16), perTicket (`tickets[]` ít nhất một hạng). Mọi Tour tính perPax bất kể `tourFormat` (I14, content model v1.0.1). Lược đồ chi tiết kèm ví dụ ở SAD mục 3.1.
4. Build đọc một chiều: loader đọc file một lần lúc build, resolver ghép theo `bookingRef`, renderer định dạng VND. Giá vào JSON-LD bằng Offer hoặc AggregateOffer theo SAD mục 3.3, `priceCurrency` luôn VND. Trang không gọi API giá lúc runtime, build không bao giờ ghi vào `prices.yaml`.
5. Validator nguồn giá chạy fail-closed như bước tiền điều kiện trong build: `bookingRef` trỏ hụt làm build fail và chặn deploy; dòng giá mồ côi chỉ cảnh báo; entity thương mại thiếu cả `bookingRef` lẫn dấu miễn phí chỉ cảnh báo. Chi tiết thi hành ở 04-CONSTRAINTS.
6. Hai trigger build, cả hai một chiều và dựng tĩnh: git push cho giá và code; webhook Sanity gọi deploy hook Cloudflare khi publish nội dung.

## Lý do

- YAML trong repo: sửa giá là một commit, lịch sử git là audit log miễn phí, không thêm phụ thuộc ngoài nào. Sheet cần mạng và API lúc build, cấu trúc sheet đổi ngầm không ai bắt; DB cần hạ tầng khi chưa có hệ booking. Khớp triết lý site tĩnh đọc nhiều ghi ít.
- YAML thắng CSV vì dữ liệu có lồng (`tiers`, `tickets`), thắng JSON vì sửa tay an toàn hơn và ghi chú được.
- `bookingRef` khóa mờ giữ seam sạch: khi booking đầy đủ xuất hiện, chỉ đổi loader và resolver, không đụng nội dung Sanity hay entity. Kế thừa nguyên lý ADR-0003.
- Webhook trigger đóng lỗ hổng vận hành: không có nó, nội dung publish ở Sanity không lên trang cho tới lần push kế tiếp. Webhook giữ nội dung tươi mà vẫn thuần tĩnh, không mở API runtime.
- Fail-closed vì validator chạy song song có ngày lọt: build fail thì Cloudflare không có artifact để deploy, an toàn là trạng thái mặc định.

## Phương án bị loại

- Google Sheet: thêm phụ thuộc ngoài, rủi ro mạng lúc build, đổi cấu trúc sheet không dấu vết, audit kém git.
- Booking DB ngay phase 1: chưa có hệ booking vận hành, dựng DB chỉ để chứa vài chục dòng giá là ngược tối giản.
- CSV (phẳng, không chứa được vé nhiều hạng và tiers) và JSON (sửa tay dễ sai dấu phẩy, không ghi chú được).
- Build nội dung theo lịch hoặc bấm tay: trễ hơn webhook, founder chọn tươi; gom build tay chỉ cân nhắc lại nếu quota build thành vấn đề (cửa hai chiều).
- Validator chạy song song ngoài build: deploy có ngày lọt qua, ngược văn hóa gate chặt CI enforce.

## Hệ quả

- 04-CONSTRAINTS thi hành validator nguồn giá thành CI: enum `unit`, I14 perPax, `asOf` bắt buộc perRoomNight, `tickets` cho perTicket, toàn vẹn tham chiếu hai phía (trỏ hụt fail, mồ côi cảnh báo), cảnh báo thiếu giá ở entity thương mại, rule map Offer và AggregateOffer. Ngưỡng giá cũ stale `asOf` (đề xuất 90 ngày) chốt ở đó.
- Đường dẫn file cụ thể (ví dụ `data/prices.yaml`) và Astro loader là chi tiết lúc dựng site, cửa hai chiều, không cần ADR.
- Khi nâng lên booking đầy đủ, thay `prices.yaml` bằng booking DB phía sau `bookingRef` là cửa một chiều, cần ADR mới trỏ về ADR này và ADR-0003 (hệ quả ADR-0003 giữ nguyên).
- Webhook Sanity cần cấu hình deploy hook ở Cloudflare khi dựng site; secret của hook không nằm trong repo (S2.8).
