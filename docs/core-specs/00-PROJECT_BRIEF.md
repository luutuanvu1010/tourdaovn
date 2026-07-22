# 00 — PROJECT BRIEF (bước 0: định vị và ràng buộc)

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Nguồn: nhatrangtravel/project/00-PROJECT_BRIEF.md · Nhóm B (khuôn + dữ liệu site)
Khuôn PR-FAQ (Working Backwards): cấu trúc 7 mục, khái niệm structured-first/GEO-first/
"completeness over coverage", ba tầng chặn rủi ro. Đây là mẫu đã điền — dùng làm gương.
⚠️ Gần như TOÀN BỘ NỘI DUNG là của nhatrangtravel. Khi dựng site mới, giữ CẤU TRÚC, viết lại NỘI DUNG.
Phần riêng site (tìm 🔧 SITE-SPECIFIC): tên site, domain, thị trường/ngôn ngữ, số entity, ngân sách, tên founder.
═══════════════════════════════════════════════════════════════════ -->

> Working Backwards (PR-FAQ): hình dung sản phẩm đã ra mắt thành công, viết thông cáo trước, xây sau. DRI: Lưu Tuấn Vũ. Dựng từ ROADMAP, PROJECT_OVERLAY và 4 quyết định founder ngày 2026-06-10. Founder duyệt 2026-06-10: chốt con số mục 6 và ngân sách mục 7. Bước 0 hoàn tất.
>
> 🔧 **SITE-SPECIFIC:** đây là brief đã điền của nhatrangtravel. Toàn bộ nội dung (tên, domain, thị trường, ngôn ngữ, con số) là ví dụ. Giữ *cấu trúc PR-FAQ 7 mục*, viết lại *nội dung* cho site mới.

## 1. Thông cáo ra mắt tưởng tượng (1 đoạn)

Tháng 9/2026, Nha Trang Travel (nhatrangtravel.net) ra mắt bản canonical tiếng Việt: một hub du lịch lấy nội dung làm gốc, nơi mỗi địa điểm, điểm tham quan và bài viết về Nha Trang đều có dữ liệu structured sạch để cả người lẫn máy đọc được. Khác với thông tin phân mảnh trên OTA và group Facebook, mỗi entity ở đây gắn nguồn kiểm chứng (sameAs tới Wikidata hoặc Wikipedia), có tác giả thật và ngày cập nhật, xuất ra JSON-LD schema.org hợp lệ, nên search engine và AI engine như Claude, Gemini, OpenAI có thể trích dẫn trực tiếp. Giá phòng và tour không gõ tay mà đồng bộ một chiều từ hệ booking riêng, nên không bao giờ cũ. Lý do tin được: hub chọn đầy đủ thay vì phủ rộng, thà ít entity mà mỗi cái đứng vững còn hơn một graph rỗng chạy theo số lượng.

## 2. Khách hàng và nỗi đau

Người dùng chính, gồm cả máy:

- Khách du lịch (tiếng Việt trước, sau mở sang en, zh, ko, ru theo cơ cấu khách): cần thông tin Nha Trang đáng tin và cập nhật để quyết định đi, ăn, ở.
- Chính quyền và đối tác địa phương: cần một nguồn có thẩm quyền để dẫn, thay cho thông tin trôi nổi.
- Máy đọc: search engine crawler và AI engine (Claude, Gemini, OpenAI) cần nội dung structured để hiểu và trích dẫn đúng.

Hiện họ đau ở đâu:

- Thông tin Nha Trang phân mảnh giữa OTA, blog cá nhân và group Facebook; chất lượng lẫn lộn, giá thường cũ.
- Không có nguồn canonical tiếng Việt vừa đầy đủ, vừa có thẩm quyền, vừa máy đọc được; AI engine buộc phải ghép từ nguồn tạp nên dễ sai.
- Người dùng tự chắp vá từ TripAdvisor, Google và Facebook, mất thời gian mà vẫn không chắc đúng.

## 3. Giải pháp và giá trị khác biệt

Một câu định vị: Nha Trang Travel là nguồn sự thật structured-first và GEO-first về Nha Trang, phục vụ đồng thời người dùng, search engine và AI engine.

Ba giá trị cốt lõi:

- Structured-first: mọi entity xuất JSON-LD schema.org sạch, máy trích dẫn được, không phải bãi chữ.
- Thẩm quyền kiểm chứng được: sameAs tới Wikidata hoặc Wikipedia, tác giả thật, ngày cập nhật, giá đồng bộ một chiều từ booking.
- Completeness over coverage: ưu tiên entity đầy đủ thay vì phủ số lượng; graph thưa bị coi là phản giá trị.

## 4. FAQ khó nhất

Tiền đến từ đâu? Hoa hồng từ hệ booking riêng qua đồng bộ một chiều. Đợt đầu không ép doanh thu; nội dung và độ phủ GEO là tài sản tích lũy, hoa hồng đến khi traffic và niềm tin đủ lớn. Rủi ro phụ thuộc một nguồn doanh thu là có thật, nhưng đa dạng hóa (hợp tác địa phương, lead) để sau, nằm ngoài phạm vi đợt đầu.

Làm sao cạnh tranh với TripAdvisor, Agoda, Google? Không thi độ phủ, sẽ thua. Thắng ở chỗ OTA lớn không tối ưu: nội dung structured-first, canonical tiếng Việt, có thẩm quyền địa phương, trả lời thẳng intent. Mục tiêu là được AI engine và search dẫn nguồn, không phải lớn hơn OTA.

Nếu nội dung đầy đủ mà không người hay máy nào dẫn thì sao? Đây là rủi ro số một đã nhận diện. Chặn bằng ba lớp: một golden set truy vấn mẫu đo việc được AI dẫn nguồn ngay từ đầu, coi như tín hiệu sống; cổng QA2 AI-readability bắt đoạn mở đầu mỗi trang tự đứng được như một câu trả lời hoàn chỉnh; nếu sau mốc 6 tháng vẫn không có tín hiệu dẫn nguồn thì dừng mở rộng và soát lại giả định GEO trước khi đổ thêm công.

Một người có giữ nổi nhịp không? Vì rủi ro này nên chọn completeness over coverage và mốc ra mắt hẹp, một số entity giới hạn đạt gate thay vì phủ rộng. Claude là đòn bẩy sinh nội dung ở tier T1 có người duyệt. Nếu nhịp đuối, thu hẹp số entity, không hạ chuẩn completeness.

## 5. Phạm vi

Trong phạm vi (đợt đầu, mốc ~3 tháng):

- Nội dung canonical tiếng Việt trên nền Sanity + Astro + Cloudflare (ADR-0001).
- Các entity lõi đạt completeness gate: Place, Attraction, Article, đủ sameAs, author và JSON-LD hợp lệ.
- Tối ưu GEO/SEO cho cả ba đối tượng đọc; 100% trang entity có JSON-LD qua validator.

Ngoài phạm vi (quan trọng không kém, đợt đầu):

- Mở rộng đa ngôn ngữ en, zh, ko, ru, chỉ sau khi bản tiếng Việt vững (S2.5).
- Chatbot tư vấn, thuộc T2, cần golden set trước khi public.
- Tích hợp booking hiển thị giá, chỉ sau khi đồng bộ một chiều có spec. Sửa scope 2026-06-10 (founder): hiển thị giá read-only từ một nguồn giá một chiều được kéo vào phase 1; đặt phòng và tồn kho vẫn để sau. Sanity không lưu con số giá, chỉ trỏ qua bookingRef. Xem DECISIONS và ADR-0003.
- Mọi nguồn doanh thu ngoài hoa hồng booking.
- khanhhoatravel.com.vn và hệ booking là dự án độc lập (S2.7), không gộp chung.

## 6. Tiêu chí thành công đo được

Founder chốt theo đề xuất ngày 2026-06-10 (Điều 6.2 yêu cầu số, không tính từ).

- Tại mốc ra mắt (~3 tháng): ≥ 30 entity canonical tiếng Việt đạt completeness gate, 100% JSON-LD hợp lệ qua validator (S2.3).
- Được AI dẫn nguồn (6 tháng sau ra mắt): trong golden set 20 truy vấn mẫu về Nha Trang trên Claude, Gemini, ChatGPT, hub được trích dẫn ở ≥ 6 truy vấn.
- Traffic organic (6 tháng sau ra mắt): ≥ 5.000 phiên organic mỗi tháng.
- Thứ hạng search (6 tháng sau ra mắt): vào top 10 cho ≥ 10 cụm từ mục tiêu tiếng Việt, ví dụ "du lịch Nha Trang", "ăn gì ở Nha Trang".
- Chất lượng kỹ thuật luôn giữ (S2.3): Lighthouse mobile ≥ 90, LCP ≤ 2500 ms, CLS ≤ 0,1, WCAG AA.

## 7. Ràng buộc đầu vào

- Thời gian: công khai bản đầu canonical tiếng Việt trong khoảng 3 tháng kể từ 2026-06-10, tức quanh tháng 9/2026.
- Nguồn lực: một founder (Lưu Tuấn Vũ) cộng tác với Claude; ngân sách 500.000đ cho API key AI (Claude và/hoặc DeepSeek bản mới nhất) phục vụ pipeline sinh nội dung tier T1.
- Pháp lý và bảo mật: theo SECURITY_BASELINE S2.8, cô lập chỉ dẫn AI khỏi dữ liệu; không đưa giá vốn, thông tin khách hay API key vào prompt gửi dịch vụ bên thứ ba khi chưa có ADR.
- Thương hiệu và ngôn ngữ: domain nhatrangtravel.net; tiếng Việt canonical; viết sentence case, giọng trực diện theo CLAUDE.md mục 7.
- Stack đã chốt: Sanity + Astro + Cloudflare (ADR-0001), không đổi trong đợt đầu.
- Ranh giới dữ liệu: độc lập với khanhhoatravel.com.vn và hệ booking; giá đi một chiều từ booking về site (S2.7).

---
Điều kiện sang bước 1: chủ dự án tự duyệt file này. Chưa xong bước 0 thì không đụng bước nào khác.
