# ADR-0026 — Trang chủ gánh cả sản phẩm, không chỉ bằng chứng

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
Khuôn TÁI DÙNG: một quyết định dựa trên trạng thái dữ liệu ("catalogue mỏng") phải khai
NGƯỠNG SỐ để biết khi nào nó hết hiệu lực. Không có ngưỡng thì quyết định sống mãi bằng
quán tính, kể cả khi tiền đề đã sai. Nội dung cụ thể (7 tour, khối "Tour nổi bật") là của
riêng tourdaovn.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** accepted
- **Ngày:** 2026-08-14   **Người phê chuẩn:** Lưu Tuấn Vũ (founder)
- **Loại quyết định:** cửa một chiều ở phần thứ tự khối trang chủ (đã lên production, khách
  và Google đã thấy); cửa hai chiều ở phần token bề mặt
- **Supersedes:** `ADR-0024` mục "trang chủ để bằng chứng gánh, không phải catalogue".
  Phần còn lại của ADR-0024 — nhất là luật cứng **đánh giá tự đăng KHÔNG serialize ra
  JSON-LD** — vẫn nguyên hiệu lực.
- **Liên quan:** `docs/specs/SPEC-2026-08-14-be-mat-vong-3.md`, ADR-0021, ADR-0023, ADR-0025

## Bối cảnh

ADR-0024 quyết rằng trang chủ để **bằng chứng** gánh chứ không phải catalogue. Lý do khi ấy
đúng: kho chỉ có **một** tour có trang đầy đủ, nên bày catalogue sẽ phơi ra sự trống trải, và
chuyển gánh nặng thuyết phục sang dữ liệu singleton (số liệu, đối tác, đánh giá) là nước đi
khôn ngoan.

Hệ quả là trang chủ có chín khối và **không khối nào bán tour**:

```
Hero → Vì sao chọn Tour Đảo → Cẩm nang bản địa → Trải nghiệm nổi bật → Bắt đầu từ đâu?
→ Điểm tham quan nổi bật → Các khu vực nên biết → Tổng quan về Nha Trang → Câu hỏi thường gặp
```

Đến 2026-08-14, kho đã có **7 tour** đã publish, đều có slug và trang chi tiết thật. Chủ dự
án nhìn site và nói "nhìn không ra công ty du lịch". Truy nguyên cho thấy đó không phải cảm
nhận về màu hay chữ: khách vào trang chủ của một công ty bán tour biển đảo phải bấm menu mới
thấy sản phẩm.

**Tiền đề của ADR-0024 đã hết hiệu lực, nhưng chính ADR-0024 không khai ngưỡng nào để biết
lúc nào thì hết.** Đó là lỗ hổng mà ADR này đóng lại.

## Quyết định

**1. Trang chủ gánh cả sản phẩm lẫn bằng chứng.** Chèn một khối "Tour nổi bật" ngay sau
hero, lưới 3 thẻ, kèm link "Xem tất cả N tour" đọc số thật từ dữ liệu.

**2. Chèn, không bày lại.** Không xoá khối nào, không đảo thứ tự khối nào trong tám khối cũ.
Phương án bày lại trọn theo mạch bán hàng đã được cân nhắc và loại ở vòng này — nó đảo thứ
tự sáu khối và buộc cập nhật `06-BINDING_MAP`, đắt hơn nhiều so với phần nó thêm được.

**3. Khối tự ẩn khi không có tour.** Cùng lối phòng thủ mà mục `zalo` đang dùng: không nút
chết, không tiêu đề rỗng. Nghĩa là quyết định này an toàn ngay cả khi kho tour về 0.

**4. Ngưỡng để đảo lại.** Nếu số tour đã publish rơi xuống **dưới 3**, khối này mất ý nghĩa
(lưới 3 thẻ không đầy một hàng) và nên cân nhắc quay về tinh thần ADR-0024. Ghi con số ở đây
để lần sau không phải cãi bằng cảm tính — đúng thứ ADR-0024 đã thiếu.

## Vì sao quyết như vậy

**Vì sao không giữ ADR-0024.** Giữ nó nghĩa là để một quyết định sống bằng quán tính sau khi
tiền đề đã sai. Nguyên nhân gốc không phải ADR-0024 sai lúc viết — nó đúng lúc viết. Nguyên
nhân là **nó không khai ngưỡng số**, nên không ai biết lúc nào nó hết đúng. ADR này sửa cả
quyết định lẫn cái lỗ hổng đã sinh ra tình huống.

**Vì sao chèn thay vì bày lại.** Bày lại trọn cho mạch bán hàng tốt hơn, nhưng nó trộn hai
biến: nếu sau đợt này chủ dự án vẫn thấy chưa ưng, chèn-một-khối cho phép biết ngay là do
thiếu sản phẩm trên trang chủ hay do thứ tự các khối. Bày lại trọn thì không tách được.

## Hệ quả

**Được:**
- Khách thấy sản phẩm trong màn hình đầu, không phải bấm menu.
- Khối tour cũng là dải màu đậm đầu tiên của trang, cắt mạch trắng liền — xem
  `SPEC-2026-08-14-be-mat-vong-3` §3.3.
- Mọi ADR sau, khi dựa trên trạng thái dữ liệu, đều phải khai ngưỡng số. Đây là phần khuôn
  tái dùng được cho Core.

**Mất và phải chấp nhận:**
- Trang chủ dài thêm một khối; người dùng di động phải cuộn thêm để tới "Vì sao chọn Tour
  Đảo".
- Trang chủ nay phụ thuộc một truy vấn Sanity nữa (`allToursQuery`). Sanity hỏng thì khối
  này rỗng và tự ẩn, trang vẫn dựng — nhưng đó là một điểm phụ thuộc mới.

**Còn treo:**
- Bày lại trọn trang chủ theo mạch bán hàng — để dành vòng sau nếu vòng này chưa đủ.
