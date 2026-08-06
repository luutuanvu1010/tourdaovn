# ADR-0024 — Trang chủ để bằng chứng gánh, không phải catalogue

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
Quyết định RIÊNG của tourdaovn về cách bố cục trang chủ. Cái tái dùng được cho site khác là
KHUÔN: "khi catalogue mỏng, chuyển gánh nặng thuyết phục sang dữ liệu singleton không phụ
thuộc số lượng sản phẩm", cộng luật cấm serialize đánh giá tự đăng. Bốn field cụ thể và thứ
tự khối là của riêng site này. Core kế thừa KHUÔN và LUẬT, không kế thừa nội dung.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** accepted
- **Ngày:** 2026-08-06   **Người phê chuẩn:** Lưu Tuấn Vũ (founder)
- **Loại quyết định:** cửa hai chiều — không mở document type mới, gỡ là trả về trạng thái cũ
- **Supersedes:** không. Bổ sung cho ADR-0023 (điều hướng theo dòng dịch vụ)
- **Liên quan:** `docs/specs/SPEC-2026-08-06-trang-chu-xung-tam.md`,
  `01-CONTENT_MODEL` §2.15 v1.0.16 và §5.3, `06-BINDING_MAP` §5.7,
  `04-CONSTRAINTS` §2.2 và I6, `DECISIONS` QĐ-2026-08-06-09,
  `DRIFT_LOG` DR-030

## Bối cảnh

Công ty có doanh thu thật, đến từ **offline, đại lý và OTA**. Website là kênh mới, chưa
mang doanh thu. Đo trên bản build ngày 2026-08-06, catalogue có: **1 tour, 1 trải nghiệm,
1 điểm tham quan, 1 địa danh, 1 bài cẩm nang, 0 khách sạn**. Mốc ra mắt 2026-08-09 với mục
tiêu 4 sản phẩm.

Đây là một mâu thuẫn cụ thể, không phải chuyện thẩm mỹ: **công ty lớn, catalogue mỏng.**

Trang chủ trước đợt này dựng theo lối cổng thông tin — hero, rồi lần lượt các khối rollup
đọc từ `touristDestination`: tour nổi bật, trải nghiệm nổi bật, khách sạn nổi bật, khu vực,
cẩm nang. Mọi khối đều đọc số lượng document. Khi mỗi loại có một document, trang chủ tự
khai báo rằng công ty này gần như không có gì để bán.

Guard rỗng làm đúng việc của nó — khối rỗng thì ẩn — nên hậu quả không phải là lưới vỡ, mà
là **một trang chủ ngắn và trống**. Càng đúng luật càng lộ.

## Quyết định

**1. Trang chủ đặt bằng chứng lên trước catalogue.**

Thứ tự mặc định trong `DEFAULT_SECTIONS`: hero → dải số liệu → tour → vì sao chọn → đối tác
→ đánh giá → cẩm nang → báo giá đoàn.

Điểm mấu chốt là **vị trí thứ hai**. Dải số liệu đứng ngay dưới hero và **không đọc một
document nội dung nào** — nó đọc `siteSettings`. Bốn hay bốn mươi sản phẩm thì khối này vẫn
đầy như nhau. Cùng lý do đó áp cho đối tác, đánh giá và báo giá đoàn.

Thứ tự này chỉ là **mặc định trong code**. `siteSettings.sections` vẫn là nơi chốt thứ tự
thật, và bốn khoá mới đã vào enum để biên tập viên kéo thả được.

**2. Bốn nguồn bằng chứng vào `siteSettings`, không mở entity mới.**

`stats`, `partners`, `testimonials`, `groupQuote`. Cả bốn là dữ liệu singleton toàn site:
không có URL riêng, không cần gate publish, không tham gia sitemap. Mở `_type` mới cho chúng
là cửa một chiều theo §5.3 và kéo theo cả họ validator `I`.

Ngưỡng đã ghi: `siteSettings` sau đợt này có 11 field cấp đầu. Tới field thứ mười lăm thì
dừng lại xét tách, đừng tiếp tục thêm.

**3. Đánh giá khách KHÔNG serialize ra JSON-LD.**

`testimonials` không phát `Review`, không phát `AggregateRating`, và giao diện không vẽ sao
vàng. Đây là ràng buộc cứng, không phải mặc định có thể đổi bằng cấu hình.

**4. Bốn điểm khác biệt ở lại tầng cấu hình build.**

Khối "Vì sao chọn" đọc `HOME_COPY` trong `src/lib/homepage.ts`, không đọc Sanity. Đó là
**định vị**, đổi theo chiến lược chứ không theo biên tập.

## Vì sao quyết như vậy

**Vì sao dải số liệu chứ không phải thêm sản phẩm giả.** Cách nhanh nhất để trang chủ trông
đầy là dựng tour mẫu. Nhưng sản phẩm không bán được mà vẫn có trang là nói dối khách và
nói dối cả Google — và nó tự sinh ra nợ dọn dẹp. Bằng chứng về công ty thì đúng ngay cả khi
catalogue còn mỏng, vì nó nói về một sự thật khác: công ty đã hoạt động thật.

**Vì sao cấm serialize đánh giá.** Google cấm rich snippet đánh giá tự phục vụ — tức nội
dung doanh nghiệp tự đăng về chính mình. Phát `Review`/`AggregateRating` cho nội dung tự
đăng là rủi ro phạt thủ công, mà I6 (dữ liệu có cấu trúc hợp lệ) là cổng mức `fail`. Đổi
lấy vài ngôi sao trên kết quả tìm kiếm bằng nguy cơ mất toàn bộ rich result là đổi tồi.

Đánh giá vẫn hiện cho **người đọc**, và dẫn nguồn trung thực qua `sourceName`/`sourceUrl`.
Muốn sao vàng thật thì phải lấy từ nguồn thứ ba qua API — việc riêng, không thuộc đợt này.

**Vì sao `stats.value` là chuỗi chứ không phải số.** Kiểu số không diễn tả được `50.000+`,
`4,9/5`, `24/7` — đúng những dạng mà một dải số liệu thật cần. Đây là chỗ mà kiểu chặt hơn
lại làm dữ liệu nghèo đi.

**Vì sao không mở entity `testimonial`.** Cám dỗ là rõ: đánh giá trông giống một entity có
tác giả, ngày tháng, nguồn. Nhưng nó không có URL, không cần index, không có trang riêng, và
không ai đi tìm nó bằng tìm kiếm. Cho nó một `_type` là trả toàn bộ chi phí của một entity
để lấy về một danh sách.

## Hệ quả

**Tích cực.** Trang chủ không còn phụ thuộc số lượng sản phẩm để trông tử tế. Khối chốt đơn
cho khách đoàn nằm ở đuôi trang thay vì không tồn tại. Bốn nguồn bằng chứng do chủ dự án tự
sửa trong Studio, không cần lập trình viên.

**Đánh đổi, ghi thẳng.**

- **Trang chủ giờ phụ thuộc việc nhập liệu.** Trước đây nó tự đầy theo catalogue; nay nếu
  `siteSettings` trống thì năm khối liên tiếp cùng ẩn và trang còn ngắn hơn trước. Đây đúng
  là trạng thái tại thời điểm viết ADR này.
- **Bằng chứng là tuyên bố công khai.** Số khách, số năm, giấy phép — sai là vi phạm Luật
  Quảng cáo Điều 8, chứ không chỉ là lỗi hiển thị. Trách nhiệm xác minh thuộc chủ dự án;
  hệ thống không kiểm được điều này.
- **`siteSettings` phình tiếp.** ADR-0023 đã cảnh báo ngưỡng ở trang tĩnh thứ ba; đợt này
  thêm bốn field nữa. Ngưỡng mới ghi ở quyết định 2.
- **Bốn điểm khác biệt không sửa được từ Studio.** Đổi chúng cần lập trình viên và một lần
  deploy. Chủ ý — nhưng nếu định vị bắt đầu đổi thường xuyên thì đây là chỗ phải xét lại.

**Muốn quay lại:** gỡ bốn khoá khỏi `DEFAULT_SECTIONS` và `SECTION_KEYS`, xoá bốn component.
Field trong Sanity để lại cũng vô hại vì không ai đọc. Không có URL nào sinh ra hay mất đi
nên phía SEO không có gì phải hoàn tác — đó là lý do quyết định này được giữ ở phần đảo ngược
được.

## Chưa quyết, còn treo

- **Vùng "Phân loại"** mà `06-BINDING_MAP` §3 khai cho mọi trang chi tiết vẫn chưa có template
  nào dựng — 15 cảnh báo `g3`. Bỏ hàng đó khỏi bản ánh xạ hay dựng nó, chưa chốt.
- **`partners[].kind`** để tách hàng chứng nhận và giải thưởng: Claude Design giả định có
  field này ở mockup vòng hai; nó không tồn tại và cố ý chưa thêm.
- **Trang lưu trú rỗng vẫn được sinh** (DR-030) — cùng gốc "chưa có nội dung", nhưng là lỗi
  thi hành chứ không phải quyết định bố cục.
