# 00 — PROJECT BRIEF (bước 0: định vị và ràng buộc)

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Khuôn PR-FAQ (Working Backwards): cấu trúc 7 mục, ba tầng chặn rủi ro.
Bản v2 viết lại toàn bộ NỘI DUNG cho tourdaovn; giữ nguyên CẤU TRÚC 7 mục.
Bản v1 (nhatrangtravel) xem lịch sử git — không giữ song song để khỏi hai nguồn sự thật.
═══════════════════════════════════════════════════════════════════ -->

> Working Backwards (PR-FAQ): hình dung sản phẩm đã ra mắt thành công, viết thông cáo trước, xây sau. DRI: Lưu Tuấn Vũ.
>
> **Bước 0 là bước của chủ dự án.** `PLAYBOOK` Phần 2: *"quyết định chiến lược là của người"* — Cowork chỉ ghi chép. Mọi mục dưới đây đều truy được về một câu chủ dự án đã nói (2026-08-05 và 2026-08-06). Không mục nào do tác nhân tự nghĩ ra.

- **Phiên bản:** v2.0.1 (v2.0.0 viết lại toàn bộ cho tourdaovn 2026-08-06; v2.0.1 bổ sung kênh đặt qua form 2026-08-21, `QĐ-2026-08-21-01`)   **Trạng thái:** đã chốt — chủ dự án trả lời trọn năm câu 2026-08-06. Bước 0 đóng.
- **Ngày:** v1 (nhatrangtravel) 2026-06-10; v2 soạn 2026-08-06   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Nguồn dữ kiện v2:** phiên làm việc 2026-08-05 — chủ dự án khai sáu dòng dịch vụ và chốt menu; `src/site.config.ts` (thương hiệu, tên miền, ngôn ngữ, danh mục); `siteSettings` trong Sanity (kênh liên hệ); ADR-0021, ADR-0023.
- **Đóng:** DR-006 phần đặc tả.

---

## 1. Thông cáo ra mắt tưởng tượng (1 đoạn)

Chủ dự án chốt 2026-08-06.

> *Công ty TNHH Tour Đảo (tourdao.vn) nhận đặt tour biển đảo Nha Trang cho cả khách lẻ và khách đoàn: tour đảo, lặn biển, vé vào cổng khu vui chơi, phòng khách sạn và resort, cùng xe đưa đón sân bay. Công ty vừa tự vận hành tour của mình, vừa kết nối sản phẩm của đối tác, nên khách gọi một đầu mối là xong cả chuyến. Mỗi chuyến có xe đưa đón tận nơi và hướng dẫn viên đi cùng; giá tốt, thanh toán linh hoạt. Đặt chỗ qua Zalo, người thật trả lời.*

## 2. Khách hàng và nỗi đau

Chủ dự án chốt 2026-08-06: **khách lẻ và khách đoàn**. Site chỉ chạy tiếng Việt (`langs = ['vi']`).

- **Khách lẻ và nhóm nhỏ**: cần biết tour đi những đảo nào, giá bao nhiêu, đón ở đâu, có đáng tin không — trước khi chuyển tiền cho một số điện thoại lạ.
- **Khách đoàn** (công ty, trường, hội nhóm): cần một đầu mối lo trọn gói xe, vé, phòng, hướng dẫn viên, và cần báo giá nhanh.
- **Máy đọc**: search và AI engine cần dữ liệu có cấu trúc để trả lời đúng khi khách hỏi "tour 3 đảo Nha Trang giá bao nhiêu". Site đã có sẵn lớp này (JSON-LD, `llms.txt`, `/ai/*.json`).

Nỗi đau: thông tin tour đảo trôi nổi trên Facebook và các trang trung gian, giá mỗi nơi một kiểu, lịch trình sơ sài, không rõ ai chịu trách nhiệm. Khách đoàn thì phải ghép từ nhiều nhà cung cấp.

## 3. Giải pháp và giá trị khác biệt

**Câu định vị** (chủ dự án chốt 2026-08-06): Tour Đảo là đầu mối trọn gói cho chuyến biển đảo Nha Trang, nhận cả khách lẻ lẫn khách đoàn, tự vận hành phần lõi và kết nối phần còn lại.

**Sáu dòng dịch vụ** chủ dự án khai 2026-08-05:

1. Tham quan biển đảo
2. Tour đảo Nha Trang
3. Tour lặn biển
4. Vé VinWonders Nha Trang
5. Đặt phòng khách sạn 5 sao và resort
6. Đưa đón sân bay

Và **cách khách đặt**: nút "Đặt vé trực tuyến" dẫn thẳng sang Zalo, lấy từ `siteSettings.contact.zaloUrl`. Không có giỏ hàng, không thanh toán trên site.

> **Bổ sung 2026-08-21 (`QĐ-2026-08-21-01`, ADR-0027):** trang chi tiết Tour có thêm **form đặt tour** — chọn ngày, số người theo hạng (người lớn / trẻ em / người cao tuổi), tạm tính, tên và số điện thoại — gửi về email và Zalo của công ty, lưu bản ghi ở Cloudflare D1 kèm mã đơn. Đơn là *yêu cầu đặt*, nhân viên gọi lại xác nhận. Vẫn không giỏ hàng, không thanh toán; Zalo vẫn là kênh tư vấn và là đích của menu "Đặt vé trực tuyến". Spec: `docs/specs/SPEC-2026-08-21-dat-tour.md`.

**Bốn điểm khác biệt** chủ dự án chốt 2026-08-06:

- **Xe đưa đón tận nơi** — không bắt khách tự ra bến.
- **Hướng dẫn viên đi cùng** — có người chịu trách nhiệm suốt chuyến.
- **Giá tốt** — xem ghi chú pháp lý bên dưới.
- **Thanh toán linh hoạt.**

Cộng hai điểm suy ra từ cách vận hành: **một đầu mối cho cả chuyến** (tự vận hành cộng kết nối đối tác), và **đặt qua Zalo, người thật trả lời**.

> ⚠️ **Ghi chú pháp lý — cách viết "giá tốt".** Chủ dự án nói "giá tốt nhất thị trường". Luật Quảng cáo 2012 Điều 8.11 cấm quảng cáo so sánh trực tiếp sản phẩm của mình với sản phẩm cùng loại của tổ chức khác. "Tốt nhất thị trường" đúng hình dạng bị cấm và cần chứng minh được nếu bị hỏi. Trên site viết **"giá tốt"** kèm một cam kết kiểm chứng được (ví dụ không phụ thu, báo giá trọn gói), không dùng dạng so sánh tuyệt đối. Chủ dự án muốn giữ nguyên câu gốc thì cần chấp nhận rủi ro này thành văn.

## 4. FAQ khó nhất

**Tiền đến từ đâu?** Hai nguồn: bán tour công ty tự vận hành, và hoa hồng từ sản phẩm bán lại của đối tác (vé vào cổng, phòng khách sạn, một phần tour). Chủ dự án chốt 2026-08-06.

*Hệ quả lên dữ liệu:* `Organization.orgType` của chính công ty là `travelAgency`. Với sản phẩm bán lại, `Tour.operator` phải trỏ đúng đơn vị vận hành thật, không trỏ về Tour Đảo — nếu không, dữ liệu có cấu trúc sẽ khai sai ai là người vận hành.

**Vì sao khách tin một công ty chưa nghe tên?** Bốn điểm ở §3 là câu trả lời khi khách đã vào site. Site có sẵn chỗ cho tín hiệu tin cậy — giấy phép (`licenseInfo`), tác giả thật, ngày cập nhật — nhưng **chưa có nội dung**; đây là việc nhập liệu, không phải việc code.

**Rủi ro lớn nhất của đợt này là thời gian, không phải kỹ thuật.** Mốc ra mắt 3 ngày (§6) trong khi dataset đang có 9 document và cần 4 sản phẩm hoàn chỉnh. Việc còn lại gần như toàn bộ là nhập nội dung trong Sanity Studio, và đó là việc của chủ dự án chứ không phải của tác nhân.

## 5. Phạm vi

Dữ kiện chắc chắn, đọc từ `src/site.config.ts`.

**Trong phạm vi:**

- Tiếng Việt, một ngôn ngữ (`langs = ['vi']`). Bộ khung đa ngữ còn trong code nhưng đã khoá.
- Chín danh mục đang bật: `place`, `attraction`, `experience`, `hotel`, `resort`, `tour`, `article`, `person`, `organization`.
- Bốn hub: `/kham-pha/`, `/luu-tru/`, `/di-lai/`, `/tat-ca/`.
- Hai trang tĩnh: `/ho-tro/`, `/lien-he/` (ADR-0023).
- Đặt chỗ qua Zalo, **và từ 2026-08-21 qua form đặt tour trên trang chi tiết Tour** (ADR-0027: đơn về email + Zalo, lưu D1); site không xử lý thanh toán.
- Stack Sanity + Astro + Cloudflare (ADR-0001), không đổi.

**Ngoài phạm vi:**

- Ba danh mục đang tắt: `restaurant`, `specialty`, `event`. Schema và code còn, chỉ tắt cờ.
- Mở thêm ngôn ngữ — chỉ sau khi bản tiếng Việt vững.
- Thanh toán trực tuyến, giỏ hàng, quản lý chỗ trống.
- Entity `Transfer` cho đưa đón sân bay — chủ dự án chốt hoãn 2026-08-05 (ND-006), dù đây là một trong sáu dịch vụ.
- Trang lộ trình đón khách `/lo-trinh-don-khach/` — còn ở chế độ phát triển, cờ `devPages` để `false`.

## 6. Tiêu chí thành công đo được

Chủ dự án chốt 2026-08-06.

| Chiều | Ngưỡng | Ghi chú |
|---|---|---|
| Thời điểm ra mắt | **2026-08-10** | dời từ 2026-08-09, chủ dự án chốt 2026-08-06 khi mở rộng phạm vi sang trang chủ và bốn trang chi tiết còn lại |
| Nội dung tại mốc ra mắt | **4 sản phẩm** có trang đầy đủ | hiện có 1 (`tour-3-dao-nha-trang-review-chi-tiet`), cần thêm 3 |
| Chuyển đổi | chưa đặt ngưỡng | đo sau ra mắt, cần công cụ đếm lượt bấm Zalo — chưa có |
| Tìm kiếm | chưa đặt ngưỡng | 3 ngày là quá ngắn để đặt mục tiêu organic |

Chất lượng kỹ thuật đã có ngưỡng ở `04-CONSTRAINTS` §3, không quyết lại: Lighthouse performance ≥ 90, accessibility ≥ 95, JSON-LD hợp lệ 100%.

> **Ghi thẳng:** mốc 3 ngày làm hai chiều "chuyển đổi" và "tìm kiếm" chưa đo được. Đây là ra mắt để có mặt, chưa phải để đạt chỉ tiêu. Nên đặt lại hai ngưỡng đó sau khi site sống được một tháng.

## 7. Ràng buộc đầu vào

Dữ kiện chắc chắn:

- **Thương hiệu:** tên hiển thị "Tour Đảo", pháp nhân "Công ty TNHH Tour Đảo", thành lập 2026. Nguồn duy nhất: `src/site.config.ts` (ADR-0021).
- **Tên miền:** `tourdao.vn`.
- **Ngôn ngữ:** tiếng Việt, viết sentence case, giọng trực diện.
- **Kênh liên hệ:** hotline, Zalo, WhatsApp, email — nguồn duy nhất là `siteSettings.contact` trong Sanity, biên tập viên tự sửa.
- **Stack:** Sanity + Astro + Cloudflare (ADR-0001).
- **Cổng phát hành:** validator đã gỡ khỏi đường tự động (ADR-0022); `reviewStatus == "approved"` trong Sanity là cổng duyệt nội dung tự động duy nhất còn hiệu lực.
- **Ràng buộc dữ liệu:** Sanity không lưu con số giá (I1); giá đi một chiều từ `data/prices.yaml` qua `bookingRef` (ADR-0003, ADR-0007).

- **Thời gian:** ra mắt **2026-08-10**.
- **Địa danh:** luật `I15` (cấm chuỗi "thành phố Nha Trang") **không còn áp dụng** cho tourdaovn — chủ dự án chốt 2026-08-06. Xem `04-CONSTRAINTS` §1.

## 8. Trạng thái bước 0

Chủ dự án đã trả lời cả năm câu ngày 2026-08-06. **Bước 0 đóng**, pha B mở.

Hai việc còn treo, không chặn bước 1:

1. **Câu "giá tốt nhất thị trường"** — xem ghi chú pháp lý ở §3. Site đang viết bản an toàn; chủ dự án muốn giữ câu gốc thì cần chốt thành văn.
2. **Hai ngưỡng chưa đặt ở §6** — đặt lại sau khi site sống một tháng.

---

Điều kiện sang bước 1: chủ dự án duyệt file này. Chưa xong bước 0 thì không đụng bước nào khác.
