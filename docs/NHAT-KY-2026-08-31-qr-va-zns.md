# Nhật ký phiên — QR chuyển khoản và ZNS gửi khách

**Ngày:** 2026-08-31 · **Vai:** Cowork · **Nhánh:** `main` · **Kết quả:** một spec, chưa một dòng mã.

## Đang cần gì

**Hai thứ chặn, cả hai chỉ chủ dự án làm được:**

1. **Ba giá trị tài khoản ngân hàng** (`bin`, `accountNumber`, `accountName`). Chưa có thì
   `SPEC-2026-08-31` §4.2 và §4.3 **không mở**. Số trong spec là khuôn, không phải số thật.
2. **Ba thủ tục Zalo:** liên kết OA với ZBS Account → nạp tiền → **nộp mẫu tin**. Nội dung mẫu
   đã soạn sẵn ở `SPEC-2026-08-31` §4.1, chép vào bảng quản trị OA là xong.

**Nộp mẫu tin là việc gấp nhất.** Duyệt mất 2 ngày làm việc, là chờ bên ngoài và nối tiếp — mỗi
giờ hoãn cộng thẳng vào ngày ZNS chạy được. Mọi task khác chạy song song được.

## Đã làm

- `docs/specs/SPEC-2026-08-31-qr-thanh-toan-va-zns.md` — **bản 2**, sáu mục chủ dự án duyệt lần
  lượt. Chưa qua QA1.
- `docs/BACKLOG.md` — **mới**, gom 10 mục nợ kỹ thuật và ý tưởng, mỗi mục có bằng chứng.
- Bản 1 sai 7 chỗ, hai agent review bắt được, đã sửa hết — bảng đối chiếu ở spec §10.

## Ba điều tra được, đừng tra lại

- **Ảnh trong mẫu ZNS là TĨNH**, đóng băng lúc đăng ký. QR riêng từng đơn **không** nhúng vào
  thân tin được → phải qua nút CTA mang URL động.
- **Nút CTA phải trỏ domain chính chủ** → `/dat-tour/{mã}/` trên tourdao.vn là **bắt buộc**,
  không trỏ thẳng `img.vietqr.io` được. Đây là route động **thứ hai** của site.
- **Token Zalo OA:** access 1 giờ, refresh 3 tháng nhưng **dùng được đúng một lần**. Lưu D1,
  ghi kiểu so-rồi-đổi; kẻ thua đọc lại, không ghi đè.

## Hai xung đột đã gỡ, không còn nợ quyết định

- Nội dung chuyển khoản `TEN_SĐT` đụng `ADR-0030` §5. Chủ dự án chốt dùng **mã đơn** — mục đích
  vốn là đối chiếu tiền về, mã đơn làm tốt hơn. `BK3` không bị đụng.
- `BK3` vẫn phải nới (SĐT khách sang VNG, email khách sang SES). **Đã duyệt trong phiên**, còn
  phải viết QĐ vào `DECISIONS.md` khi thi công.

## Trạng thái production, đo trực tiếp hôm nay

Ưu đãi thanh toán trước **ĐANG BẬT ở 5%**; ô chọn ngày `max="2026-11-29"` (đúng 90 ngày);
Turnstile chạy thật. Nghiệm thu tay §7 của đợt trước **chưa thấy dấu vết ai làm** → `B-009`.

## Bước kế

Có ba số tài khoản → `writing-plans`. Chưa có → nộp mẫu ZNS trước, rồi lập kế hoạch cho §4.4–§4.7
(trang, khối thành công, tách nội dung, kênh báo tin) vì bốn phần đó không phụ thuộc số tài khoản.

---

# Phiên chiều 31/08 — thi công nửa QR

**Vai:** Code · **Nhánh:** `docs/ra-soat-dat-tour-2026-08-31` · **Kết quả:** QR chạy được, chưa push.

Chủ dự án cấp ba giá trị tài khoản (Techcombank · 250 250 3979 · CÔNG TY TNHH TOUR ĐẢO) và ra
chỉ thị làm QR trong Module Booking, kèm **một yêu cầu mới không có trong bản 2: tải QR xuống**.
Ba giá trị đó chính là thứ chặn §4.2/§4.3, nên nửa QR mở. Nửa ZNS vẫn chặn ở ba thủ tục Zalo.

## Đã làm

| File | Việc |
|---|---|
| `src/site.config.ts` | khối `banking` (4 trường, thêm `bankName`); sửa 3 chỗ chú thích đầu file |
| `src/lib/booking/payment-qr.ts` | **mới** — `buildPaymentQr()`, hàm thuần |
| `src/components/BookingForm.astro` | khối QR + nút tải + nút chép; `showDone()` chữ ký mới; luật đơn trùng |
| `src/lib/booking/handler.ts` | khối chữ tài khoản + luật đơn trùng cho đường không-JS |
| `src/lib/uiCopy.ts` | 12 nhãn × 5 ngôn ngữ |
| `scripts/validators/banking-shape.ts` | **mới** — cổng hình dạng, đã đăng ký vào `gate:all` |
| `test/booking/payment-qr.test.ts` | **mới** — 8 ca |
| `test/booking/handler.test.ts` | +3 ca cho bề mặt tiền đường không-JS |

`src/lib/booking/html.ts` **không đổi một ký tự** — xem `DR-106` để biết vì sao lệch bản đồ file.

## Bằng chứng cổng

- `npx vitest run` → **12 file, 159 ca xanh** trước khi thêm; **162 ca** sau khi thêm 3 ca đơn trùng.
- `npm run build` → xanh, exit 0.
- `npm run gate` sau khi dựng → **12/12 xanh**, gồm `banking-shape` mới. Một `[gap]` khai báo (g2, nợ ND-001).
- `dist/_routes.json` **không đổi**: 3 include + 30 exclude = 33. Đợt này không thêm route.
- Khối QR có mặt trong **28/28** trang tour có form; `.bf__qr[data-astro-cid-…][hidden]` có
  trong CSS đã dựng (thiếu luật này là khối hiện thường trực — đúng cơ chế `DR-102`).
- Bundle script khách **11,2 KB**; tree-shaking loại sạch phần còn lại của `site.config`
  (`primaryDestinationSlug`, `studioHost`, `foundedYear`, nav, hubs đều **0** lần xuất hiện).
- Công tắc `prepayPercent` đang **bật 5%** trên cả 28 trang — không có nó thì không đơn nào có QR.

**Hai cổng đã chứng minh là biết đỏ, không chỉ biết in `[pass]`:**

- `banking-shape.ts`: thử 7 giá trị sai (bin 5 số, bin có chữ O, số TK có khoảng trắng, số TK 20
  ký tự, tên có dấu, tên viết thường, `bankName` rỗng) → **đỏ cả 7**, xanh với giá trị thật.
- Ca "đơn trùng": tạm gỡ luật trong `handler.ts` → test **đỏ** đúng chỗ,
  `expected … not to contain '2.000.000'` — tức nó thật sự canh con số tiền của lần nộp mới
  đứng cạnh mã đơn cũ.
- Ràng buộc **cặp `bin` ↔ `bankName`**: đổi `bin` sang `970436` mà quên sửa nhãn → **đỏ**; đổi
  sang một BIN chưa khai (`970422`) → **đỏ** kèm hướng dẫn; sửa cả hai cho khớp → **xanh**.

## Hai điểm review bắt được, đã sửa

1. **`bankName` từng chỉ được canh bằng chú thích.** Ban đầu tôi viết *"đổi `bin` thì đổi luôn
   dòng này"* rồi để validator chỉ kiểm "không rỗng". Đó đúng thứ `CLAUDE.md` cấm — *"ranh giới
   bảo đảm bằng cấu trúc, không bằng lời nhắc"*. Ca hỏng thật: đổi sang Vietcombank, quên nhãn →
   **ảnh QR in logo Vietcombank** (VietQR suy từ `bin`) trong khi **khối chữ in "Techcombank"**;
   khách thấy hai ngân hàng và dừng. Nay `banking-shape.ts` giữ bảng `BIN_DA_DUNG` và bắt cặp;
   BIN lạ cũng đỏ, buộc người đổi ngân hàng phải sửa validator một cách có chủ ý.
2. **`loading="lazy"` trên ảnh QR là cho `npm run audit:seo`, KHÔNG phải cho `npm run gate`** —
   `seo-auditor` không nằm trong `gate:all`, nên thuộc tính này không mua được gì trong chuỗi
   cổng đang chạy. Giữ vì nó vô hại (ảnh không có `src` trong HTML tĩnh nên không phát yêu cầu
   nào; lúc `showDone` chạy thì khối đã được `done.focus()` kéo vào vùng nhìn, nên tải ngay).
   Chống giật khung đã do `width`/`height` nội tại và `decoding="async"` lo, không phải do nó.

## Ba chỗ bản 2 nói chưa đúng, đã đo lại

1. `compact2` **không** in nội dung chuyển khoản lên ảnh (chỉ tên/số TK/số tiền). Khối chữ cạnh
   ảnh vì thế là bắt buộc, không phải tuỳ chọn.
2. Baseline cổng **không phải 4 đỏ** — xem `DR-105`, và quan trọng hơn: `npm run gate` không tự
   dựng lại, chạy nó trên `dist/` cũ sinh đỏ ảo.
3. BIN trong khuôn là Vietcombank; Techcombank là `970407` (tra `api.vietqr.io/v2/banks`).

## Số tài khoản — chủ dự án đã xác nhận 31/08

> **`2502503979` đúng, chủ dự án xác nhận.** Không còn là cổng chặn. Phần dưới giữ lại để nói
> rõ **biên của cổng**, không phải để nghi ngờ con số.
>
> Cổng chỉ kiểm được HÌNH DẠNG, không kiểm được danh tính tài khoản.
> `banking-shape` chỉ kiểm hình dạng: `2502503979` đúng 10 chữ số nên nó cho qua, kể cả khi một
> chữ số bị chép sai. Ảnh QR dựng được **cũng không phải bằng chứng** — VietQR vẽ lại đúng tham
> số ta đưa vào. Cách duy nhất: **quét mã bằng app ngân hàng thật và đọc TÊN THỤ HƯỞNG app hiện
> ra.** Làm cùng đơn nghiệm thu đầu tiên (§8 bước 1). (`SPEC` §11.2)

## Chưa làm (nửa ZNS, vẫn chặn)

§4.1 mẫu ZNS · §4.4 trang `/dat-tour/{mã}/` · §4.6 tách nội dung khách/nhân viên · §4.7 kênh
báo tin + token + migration `0003`. Hệ quả thấy được ngay: ca **đơn trùng** hiện chỉ có mã đơn
và câu "đã ghi nhận trước đó", chưa có liên kết "xem số tiền đã lưu" vì trang §4.4 chưa có.
