# ADR-0003 — Nguồn giá một chiều và hiển thị giá phase 1

- **Trạng thái:** accepted, phê chuẩn 2026-06-10
- **Ngày:** 2026-06-10   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa một chiều (mở một seam dữ liệu giá)
- **Liên quan:** `project/01-CONTENT_MODEL.md` v0.3.0 (bookingRef, I1, I16), brief mục 5, S2.2, N5

## Bối cảnh

Founder băn khoăn: trải nghiệm như lặn biển có giá thật, không hiện giá thì không phản ánh đúng thực tế; và giá loại này ổn định, ít đổi. Trong khi đó S2.2 và N5 cấm nhập giá thủ công vào Sanity, và brief để hiển thị giá ngoài phạm vi phase 1 (chờ đồng bộ booking).

Mấu chốt là tách hai thứ đang bị gộp: lưu giá trong Sanity (bị cấm) và hiển thị giá trên site (không bị cấm). Luật chỉ chặn cái thứ nhất. Vì giá ổn định, nuôi giá ở một nơi duy nhất ngoài Sanity là rẻ, nên có thể hiện giá ngay mà vẫn giữ luật.

## Quyết định

- Giá sống ở một nguồn giá riêng ngoài Sanity, một nguồn sự thật cho giá (P6). Phase 1 nguồn này có thể tối giản (file, sheet, hoặc DB nhẹ); dạng cụ thể chốt ở bước 2 SAD. Về sau hợp nhất vào booking đầy đủ.
- Entity thương mại trong Sanity (Experience, Tour, Hotel, Resort) giữ `bookingRef` trỏ tới sản phẩm bên nguồn giá. Sanity không lưu con số giá.
- Site render giá lúc build, đọc một chiều từ nguồn giá theo bookingRef. Site không bao giờ ghi ngược nguồn giá.
- Hiển thị giá được kéo vào phase 1 (sửa scope brief mục 5). Giá ổn định (trải nghiệm, tour, vé) hiện trực tiếp. Giá lưu trú biến động hiện dạng "từ X, cập nhật [ngày]" kèm ngày rõ ràng, không cam kết con số đặt phòng thời điểm.
- Gõ con số giá thẳng vào doc Sanity vẫn cấm tuyệt đối (N5 áp trên dữ liệu phát hành, hạng tuyệt đối 5.8).

## Lý do

- Tách lưu khỏi hiện cho phép hiện giá mà không phá một nguồn sự thật (P6, N7).
- Premise của founder rằng giá ổn định làm nguồn giá rẻ bảo trì, nên đây là đường rẻ chứ không phải gánh nặng.
- Giữ seam sạch: khi booking đầy đủ xuất hiện, chỉ cần đổi nguồn phía sau bookingRef, không phải gỡ giá khỏi nội dung.
- Phục vụ thực tế tìm kiếm: người dùng cần thấy giá để quyết định.

## Phương án bị loại

- Gõ giá thẳng vào Sanity: vi phạm N5 hạng tuyệt đối, hàn giá dính vào nội dung, sau này gỡ rất đau.
- Hiện dải $-$$$$ gõ tay: nửa vời, vẫn nhập tay, và không cho con số thật founder muốn.
- Hoãn toàn bộ giá tới khi có booking đầy đủ: không phản ánh thực tế, founder bác.

## Hệ quả

- Content model v0.3 thêm field bookingRef cho bốn entity thương mại, sửa bất biến I1, thêm I16.
- Bước 2 SAD phải chốt dạng nguồn giá tối giản và cơ chế đọc một chiều lúc build.
- Giá lưu trú cần một trường ngày cập nhật (as-of) ở nguồn giá để render đúng dạng "từ X, cập nhật [ngày]".
- Khi nâng lên booking đầy đủ (đặt phòng, tồn kho), hợp nhất nguồn giá tối giản vào booking là cửa một chiều, cần ADR cập nhật.
