# 00 — PROJECT BRIEF (bước 0: định vị và ràng buộc)

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Khuôn PR-FAQ (Working Backwards): cấu trúc 7 mục, ba tầng chặn rủi ro.
Bản v2 viết lại toàn bộ NỘI DUNG cho tourdaovn; giữ nguyên CẤU TRÚC 7 mục.
Bản v1 (nhatrangtravel) xem lịch sử git — không giữ song song để khỏi hai nguồn sự thật.
═══════════════════════════════════════════════════════════════════ -->

> Working Backwards (PR-FAQ): hình dung sản phẩm đã ra mắt thành công, viết thông cáo trước, xây sau. DRI: Lưu Tuấn Vũ.
>
> **Bước 0 là bước của chủ dự án.** `PLAYBOOK` Phần 2: *"quyết định chiến lược là của người"* — Cowork chỉ ghi chép. Mọi mục dưới đây hoặc truy được về một câu chủ dự án đã nói, hoặc được đánh dấu **[CHỜ QUYẾT]**. Không mục nào do tác nhân tự nghĩ ra.

- **Phiên bản:** v2.0.0 (viết lại toàn bộ cho tourdaovn)   **Trạng thái:** nháp, chờ chủ dự án điền phần [CHỜ QUYẾT] và duyệt
- **Ngày:** v1 (nhatrangtravel) 2026-06-10; v2 soạn 2026-08-06   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Nguồn dữ kiện v2:** phiên làm việc 2026-08-05 — chủ dự án khai sáu dòng dịch vụ và chốt menu; `src/site.config.ts` (thương hiệu, tên miền, ngôn ngữ, danh mục); `siteSettings` trong Sanity (kênh liên hệ); ADR-0021, ADR-0023.
- **Đóng:** DR-006 phần đặc tả.

---

## 1. Thông cáo ra mắt tưởng tượng (1 đoạn)

**[CHỜ QUYẾT]** — cần chủ dự án viết hoặc duyệt. Bản nháp dưới đây dựng từ dữ kiện đã có, chưa phải quyết định:

> *Công ty TNHH Tour Đảo (tourdao.vn) là nơi khách đặt trực tiếp tour biển đảo Nha Trang với một đầu mối duy nhất: tour đảo, lặn biển, vé vào cổng các khu vui chơi, phòng khách sạn và resort, và xe đưa đón sân bay. Khác với việc gom mảnh từ nhiều nơi rồi tự lo phần còn lại, mỗi sản phẩm ở đây có lịch trình rõ, giá rõ, điểm đón rõ, và một số Zalo trả lời thật. Nội dung cẩm nang trên site không phải để đọc cho vui mà để khách biết mình đang mua gì trước khi bấm đặt.*

Ba chỗ trong đoạn trên cần chủ dự án xác nhận vì tôi đang suy: **"đặt trực tiếp"** (hay còn qua đại lý?), **"một đầu mối duy nhất"** (có phải điểm khác biệt anh muốn nhấn?), và **giọng** (đang viết trực diện, hướng khách lẻ).

## 2. Khách hàng và nỗi đau

**[CHỜ QUYẾT]** — ba câu hỏi ở §8.

Dữ kiện chắc chắn: site chỉ chạy **tiếng Việt** (`langs = ['vi']`), nên khách mục tiêu là người Việt hoặc người đọc được tiếng Việt.

Nháp, chờ xác nhận:

- **Khách lẻ và nhóm nhỏ đi Nha Trang**: cần biết tour nào đi những đảo nào, giá bao nhiêu, đón ở đâu, có đáng tin không — trước khi chuyển tiền cho một số điện thoại lạ.
- **Máy đọc**: search engine và AI engine cần dữ liệu có cấu trúc để trả lời đúng khi khách hỏi "tour 3 đảo Nha Trang giá bao nhiêu". Site đã đầu tư sẵn lớp này (JSON-LD, `llms.txt`, `/ai/*.json`).

Nỗi đau, nháp:

- Thông tin tour đảo Nha Trang trôi nổi trên Facebook và các trang trung gian; giá mỗi nơi một kiểu, lịch trình mô tả sơ sài, không rõ ai chịu trách nhiệm.
- Khách không phân biệt được đơn vị vận hành thật với người bán lại, nên ngại đặt trước.

## 3. Giải pháp và giá trị khác biệt

**[CHỜ QUYẾT]** phần câu định vị.

Dữ kiện chắc chắn — **sáu dòng dịch vụ** chủ dự án khai 2026-08-05:

1. Tham quan biển đảo
2. Tour đảo Nha Trang
3. Tour lặn biển
4. Vé VinWonders Nha Trang
5. Đặt phòng khách sạn 5 sao và resort
6. Đưa đón sân bay

Và **cách khách đặt**: nút "Đặt vé trực tuyến" dẫn thẳng sang Zalo, lấy từ `siteSettings.contact.zaloUrl`. Không có giỏ hàng, không thanh toán trên site.

Nháp ba giá trị cốt lõi, chờ xác nhận:

- **Một đầu mối cho cả chuyến**: tour, vé, phòng, xe đón — không phải ghép từ bốn nơi.
- **Đặt qua Zalo, người thật trả lời**: hợp thói quen khách Việt, không bắt điền form dài.
- **Nói rõ mình bán gì**: mỗi sản phẩm có trang riêng với lịch trình, giá và điểm đón, thay vì một bài quảng cáo chung.

## 4. FAQ khó nhất

**[CHỜ QUYẾT] — toàn bộ mục này.** Đây là chỗ chỉ chủ dự án trả lời được, và cũng là chỗ brief cũ sai nặng nhất (nó trả lời cho một dự án khác). Bốn câu cần trả lời:

1. **Tiền đến từ đâu?** Bán tour do mình vận hành, hay ăn hoa hồng bán lại của đơn vị khác, hay cả hai? Câu này quyết cách viết trang sản phẩm và cả `Organization.orgType` trong dữ liệu.
2. **Cạnh tranh với ai, thắng ở đâu?** Đối thủ thật là các trang tour Nha Trang khác, hay là Facebook, hay là OTA lớn?
3. **Vì sao khách tin một công ty họ chưa nghe tên?** Hiện site có sẵn chỗ cho tín hiệu tin cậy — giấy phép (`licenseInfo`), tác giả thật, ngày cập nhật — nhưng chưa có nội dung.
4. **Một người có giữ nổi nhịp không?** Hiện dataset có **9 document**; menu chốt cần ít nhất 7 sản phẩm. Nhịp nhập liệu là ràng buộc thật của đợt này.

## 5. Phạm vi

Dữ kiện chắc chắn, đọc từ `src/site.config.ts`.

**Trong phạm vi:**

- Tiếng Việt, một ngôn ngữ (`langs = ['vi']`). Bộ khung đa ngữ còn trong code nhưng đã khoá.
- Chín danh mục đang bật: `place`, `attraction`, `experience`, `hotel`, `resort`, `tour`, `article`, `person`, `organization`.
- Bốn hub: `/kham-pha/`, `/luu-tru/`, `/di-lai/`, `/tat-ca/`.
- Hai trang tĩnh: `/ho-tro/`, `/lien-he/` (ADR-0023).
- Đặt chỗ qua Zalo; site không xử lý thanh toán.
- Stack Sanity + Astro + Cloudflare (ADR-0001), không đổi.

**Ngoài phạm vi:**

- Ba danh mục đang tắt: `restaurant`, `specialty`, `event`. Schema và code còn, chỉ tắt cờ.
- Mở thêm ngôn ngữ — chỉ sau khi bản tiếng Việt vững.
- Thanh toán trực tuyến, giỏ hàng, quản lý chỗ trống.
- Entity `Transfer` cho đưa đón sân bay — chủ dự án chốt hoãn 2026-08-05 (ND-006), dù đây là một trong sáu dịch vụ.
- Trang lộ trình đón khách `/lo-trinh-don-khach/` — còn ở chế độ phát triển, cờ `devPages` để `false`.

## 6. Tiêu chí thành công đo được

**[CHỜ QUYẾT] — toàn bộ mục này cần con số của chủ dự án.**

`CONSTITUTION` Điều 6.2: ngưỡng phải là số kiểm được, không phải tính từ. *"Nhanh" không phải ngưỡng.* Tác nhân **không được** tự đặt mục tiêu kinh doanh, nên tôi để trống thay vì bịa.

Bốn chiều cần một con số mỗi chiều:

| Chiều | Câu hỏi | Giá trị |
|---|---|---|
| Nội dung | Bao nhiêu sản phẩm có trang đầy đủ tại mốc ra mắt? | **[CHỜ QUYẾT]** |
| Chuyển đổi | Bao nhiêu lượt bấm sang Zalo mỗi tháng thì coi là đạt? | **[CHỜ QUYẾT]** |
| Tìm kiếm | Bao nhiêu phiên organic mỗi tháng, sau bao lâu? | **[CHỜ QUYẾT]** |
| Thời điểm | Mốc ra mắt là ngày nào? | **[CHỜ QUYẾT]** |

Riêng chất lượng kỹ thuật **đã có ngưỡng số** ở `04-CONSTRAINTS` §3, không cần quyết lại: Lighthouse performance ≥ 90, accessibility ≥ 95, JSON-LD hợp lệ 100%.

## 7. Ràng buộc đầu vào

Dữ kiện chắc chắn:

- **Thương hiệu:** tên hiển thị "Tour Đảo", pháp nhân "Công ty TNHH Tour Đảo", thành lập 2026. Nguồn duy nhất: `src/site.config.ts` (ADR-0021).
- **Tên miền:** `tourdao.vn`.
- **Ngôn ngữ:** tiếng Việt, viết sentence case, giọng trực diện.
- **Kênh liên hệ:** hotline, Zalo, WhatsApp, email — nguồn duy nhất là `siteSettings.contact` trong Sanity, biên tập viên tự sửa.
- **Stack:** Sanity + Astro + Cloudflare (ADR-0001).
- **Cổng phát hành:** validator đã gỡ khỏi đường tự động (ADR-0022); `reviewStatus == "approved"` trong Sanity là cổng duyệt nội dung tự động duy nhất còn hiệu lực.
- **Ràng buộc dữ liệu:** Sanity không lưu con số giá (I1); giá đi một chiều từ `data/prices.yaml` qua `bookingRef` (ADR-0003, ADR-0007).

**[CHỜ QUYẾT]:** nguồn lực và thời gian — vẫn một mình chủ dự án cộng Claude? Ngân sách API còn như cũ? Mốc thời gian nào?

## 8. Việc cần chủ dự án làm để đóng bước 0

1. **Duyệt hoặc viết lại §1** — thông cáo một đoạn. Xác nhận ba chỗ tôi đang suy.
2. **Xác nhận §2** — khách lẻ hay đoàn, nội địa hay có cả khách nước ngoài đọc tiếng Việt.
3. **Trả lời bốn câu ở §4** — đặc biệt câu 1 (nguồn tiền), vì nó quyết cách viết trang sản phẩm.
4. **Cho bốn con số ở §6.**
5. **Quyết `I15`** — luật "cấm chuỗi *thành phố Nha Trang*" trong `04-CONSTRAINTS` §1 còn là luật của tourdaovn không. Dòng đó tự đánh dấu 🔧 SITE-SPECIFIC. Câu này đang chặn việc trả nợ ND-005.

Xong 5 mục trên thì bước 0 đóng, và pha B (`01-CONTENT_MODEL`) mở.

---

Điều kiện sang bước 1: chủ dự án duyệt file này. Chưa xong bước 0 thì không đụng bước nào khác.
