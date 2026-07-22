# ADR-0008 — reviewStatus là cổng publish canonical; không nhận drafts. của Sanity làm cổng thứ hai

- **Trạng thái:** accepted, phê chuẩn 2026-06-14. Founder duyệt nguyên nháp, gồm điểm tinh chỉnh I18/I17 ở Quyết định mục 4.
- **Ngày soạn:** 2026-06-14   **Người soạn:** Claude (Cowork)   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa gần một chiều ở cơ chế phát hành nội dung. Đảo được về kỹ thuật (vẫn có thể thêm luồng drafts. cho preview sau), nhưng vì chạm cách một entity được coi là đã publish nên đi thủ tục ADR theo Governance 3.2.
- **Liên quan:** `DECISIONS.md` 2026-06-14 tối (QĐ2 founder chốt), `AUDIT_REPORT-2026-06-14.md` (V4), `project/01-CONTENT_MODEL.md` I19 (gate quản trị), I18 + I17 (validator quan hệ đếm ref từ draft), ADR-0004 (i18n hybrid), `scripts/seed/seed-trungtam.ts` (`createOrReplace`), `scripts/lib/sanity-client.ts` (`fetchAllDocs`), `scripts/validators/i1-i19.ts` (`validateI19`, `validateI18`), `src/lib/queries/*` (frontend lọc reviewStatus).

## Bối cảnh

Dự án có hai khái niệm "draft" chồng lên nhau cho cùng một việc là chặn nội dung chưa duyệt ra công khai:

1. `reviewStatus` — field trong document (enum draft/approved), là cổng quản trị I19 của dự án. Frontend đã lọc theo nó: mọi query entity trong `src/lib/queries/*` đều có `reviewStatus == "approved"` (Category miễn, khớp ngoại lệ I19). Đây là thứ duy nhất đang chặn render 4 trang draft (audit xác nhận 4 trang trả 404).
2. `drafts.` prefix — cơ chế draft dựng sẵn của Sanity (namespace riêng, document chưa publish sống ở `drafts.<id>`).

Seed cụm trung tâm (`seed-trungtam.ts`) dùng `createOrReplace`, ghi thẳng vào published namespace. Hệ quả: 4 document (`cho-dam`, `nha-tho-nui`, `bao-tang-hai-duong-hoc`, `trung-tam-nha-trang`) sống trong published namespace nhưng mang `reviewStatus: draft`.

Validator I19 (`validateI19`) kiểm `doc.reviewStatus !== 'approved'` rồi báo lỗi, còn `fetchAllDocs` lấy `*[_type in $types]` không lọc reviewStatus. Khi chạy trên dataset hiện tại, validator trả 4 lỗi cho 4 document draft đó (audit V4). Đó là lỗi giả: 4 document này hợp lệ ở trạng thái chưa duyệt, frontend đã giấu chúng đúng. Vấn đề là validator và frontend đang định nghĩa "tập đã publish" khác nhau.

Founder đã chốt hướng xử ở QĐ2 (DECISIONS 2026-06-14 tối). ADR này khóa hướng đó thành bản ghi kiến trúc, làm căn cứ cho gói code gỡ băng.

## Quyết định

1. `reviewStatus` là cổng publish canonical của dự án. Một document được coi là **đã publish** (hiển thị công khai, vào sitemap, crawler đi tới được) khi và chỉ khi `reviewStatus == "approved"`. Category miễn cổng này (founder tuyển là duyệt, ngoại lệ I19 đã có).

2. Không nhận `drafts.` namespace của Sanity làm cổng publish của dự án. Không dựng cổng thứ hai chồng lên `reviewStatus`. Document mang `reviewStatus != "approved"` là nội dung chưa publish hợp lệ, được phép sống trong dataset, không bị tính là "phát hành nội dung chưa duyệt".

3. Renderer và cổng completeness đánh giá **cùng một tập published**: `*[_type in <types> && reviewStatus == "approved"]`. Frontend đã làm đúng tập này; validator phải kéo về cho khớp để hết lệch.

4. Phạm vi bộ lọc reviewStatus áp lên **đối tượng được kiểm completeness** (I19 và họ kiểm "đã publish thì phải đủ field"), không phải vứt bỏ document chưa approved khỏi toàn bộ corpus. Validator quan hệ vốn cố ý đếm reference từ document chưa approved phải tiếp tục thấy đủ corpus:
   - I18 (Organization cần ít nhất một quan hệ vào) đếm cả reference từ Tour/Event/Article còn draft, theo DECISIONS 2026-06-11 (tránh vòng kẹt với I14).
   - I17 (whereToTry là tập con servesSpecialty) kiểm quan hệ giữa các document bất kể trạng thái duyệt.
   Đây là điểm tinh chỉnh cơ chế so với câu chữ "fetchAllDocs lọc reviewStatus" của QĐ2, để không gài regression cho hai quyết định cũ. Founder xác nhận điểm này khi duyệt ADR.

## Lý do

- Dự án đã commit hướng reviewStatus từ trước: toàn bộ query frontend lọc theo nó, gate I19 dựa trên `reviewStatus` + `approvedBy` + `contentProvenance`. Công nhận nó là cổng canonical chỉ là kéo validator về khớp thực tế đã có, không phát minh cơ chế mới.
- Thêm `drafts.` làm cổng nghĩa là hai khái niệm draft song song cho cùng một việc, dễ lệch nhau, và đẻ ra quy trình ba bước thừa (đưa về draft, đổi reviewStatus, rồi Publish) mà Session B việc 3 đang muốn gộp thành một nút duyệt và xuất bản.
- Một field một cổng đơn giản hơn (P11): kiểm được bằng GROQ và validator, không phụ thuộc trạng thái ẩn của Sanity namespace.
- Khớp nút "Duyệt và xuất bản" một bước ở Session B việc 3: set `reviewStatus = approved` + điền `approvedBy` thật là đủ để publish, không cần thao tác namespace riêng.

## Phương án bị loại

- Chuyển seed sang `drafts.` prefix để published chỉ chứa approved (phương án (a) trong câu hỏi audit V4). Loại theo QĐ2: dựng cổng thứ hai chồng lên reviewStatus, hai khái niệm draft dễ lệch, đi ngược nút một bước Session B, và phải sửa cả seed lẫn quy trình duyệt.
- Bỏ field `reviewStatus`, dùng thuần `drafts.` của Sanity làm cổng duy nhất. Loại vì phá I19 (gate completeness dựa reviewStatus) và phá toàn bộ filter frontend đang chạy; công đập đi xây lại lớn, đổi nhiều lớp cùng lúc.
- Lọc `fetchAllDocs` về approved-only ở mức toàn cục (cách đọc hẹp nhất của QĐ2). Đơn giản hơn nhưng làm I18 và I17 mất tầm nhìn vào reference từ document chưa approved, gài regression cho hai quyết định cũ. Loại; thay bằng phạm vi ở Quyết định mục 4.

## Hệ quả

- Code (sau khi ADR duyệt, trong gói gỡ băng): sửa `fetchAllDocs` / `validateI19` để cổng completeness đánh giá tập `reviewStatus == "approved"` (4 lỗi giả biến mất); giữ I18, I17 thấy đủ corpus gồm cả document `reviewStatus == "draft"`. Nếu hai yêu cầu không thể đồng thời thỏa sạch trong cấu trúc hiện tại thì DỪNG và leo thang, không tự chọn cách.
- Dataset hiện có 0 Organization nên I18 chưa gãy thật; nhưng bản sửa phải không gài regression cho khi có Organization (đây là rủi ro latent, ghi rõ để không quên).
- Liên quan V3 (cùng họ siết I19): `approvedBy` phải là tên người đăng nhập Studio thật. Validator nên cảnh báo hoặc loại giá trị giống tên token (ví dụ chuỗi `Editor`). Việc sửa giá trị 5 document hiện tại thành tên thật do founder làm trong Studio (làn song song), không nằm trong gói code.
- `contentProvenance` giữ enum đóng (human, ai-t1, mixed), không đổi.
- Không cần sửa I19 trong `01-CONTENT_MODEL.md` (mô tả gate ở đó đã đúng: publish cần reviewStatus approved). ADR này chỉ khóa cách thi hành validator và `fetchAllDocs` cho khớp ý định, cộng xác nhận `reviewStatus` là cổng canonical thay vì drafts.
- Sau này muốn thêm luồng `drafts.` cho preview build nội dung nháp là cửa hai chiều, được phép, miễn không thay `reviewStatus` làm cổng publish canonical.
