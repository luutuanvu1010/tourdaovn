# ADR-0025 — Trang danh mục con khoá vào `slug`, và hai cổng chặn category thiếu slug

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
Cơ chế là khuôn TÁI DÙNG cho mọi site: khi một trang được sinh ra từ một field TUỲ CHỌN,
phải có cổng chặn, nếu không trang ấy biến mất câm. Nội dung cụ thể (category "Tour đảo",
mục menu "Tour đảo Nha Trang") là của riêng tourdaovn. Core kế thừa CƠ CHẾ, không kế thừa
NỘI DUNG.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** accepted
- **Ngày:** 2026-08-13   **Người phê chuẩn:** Lưu Tuấn Vũ (founder)
- **Loại quyết định:** cửa một chiều ở phần URL trang danh mục con (đã vào sitemap);
  cửa hai chiều ở phần hai cổng kiểm
- **Supersedes:** không. Bổ sung cho ADR-0023 (cơ chế `nav` và sáu `kind`)
- **Liên quan:** ADR-0021 (site.config là nguồn sự thật), ADR-0023,
  `cms/schemas/category.ts`, `src/lib/sanity.ts`, `src/lib/routes.ts`,
  `src/pages/[...path].astro`, `src/site.config.ts` mục 7,
  `Buglog/err.log` (log build hỏng 2026-08-13)

## Bối cảnh

Build production chết ngày 2026-08-13 với thông báo của chính cổng `assertNavTargetsExist`
(ADR-0023): menu trỏ tới `/tour/tour-3-dao-nha-trang-review-chi-tiet/`, trang đó không tồn
tại. Truy nguyên cho thấy **hai lớp lỗi chồng nhau**, không phải một.

**Lớp một — menu trỏ vào một tour cụ thể.** Mục "Tour đảo Nha Trang" khai
`kind: 'detail'`, gắn cứng vào slug của đúng một document tour. Ngày 05-08 build còn sinh ra
trang ấy (`Buglog/1.log`). Trong tuần sau đó slug của tour được đổi trong Studio thành
`tour-3-dao-nha-trang`, còn chuỗi cũ rơi sang một document `organization`. Code không đổi
một dòng nào giữa hai lần build — biến duy nhất đã đổi là nội dung.

Ý định thật của mục menu này không phải một tour, mà là **mọi tour có `tour-type` là "Tour
đảo"**. Tức đúng `kind: 'term'` mà ADR-0023 đã khai, chỉ là khai sai lúc dựng.

**Lớp hai — trang danh mục con chưa từng tồn tại.** Sửa lớp một xong thì menu vẫn không có
chỗ để trỏ tới, vì `fetchAllTerms` lọc `defined(slug.current)` ngay trong GROQ. Trong
`cms/schemas/category.ts`, `termCode` là field **bắt buộc** còn `slug` (nhóm SEO) là field
**tuỳ chọn**. Cả năm category thuộc hai bộ term đều bỏ trống `slug`, nên bộ lọc ấy loại sạch
— không trang, không cảnh báo, không ai biết. Category "Tour đảo" có thật, đã publish, có 7
tour trỏ vào, mà trang danh mục của nó chưa bao giờ được sinh ra.

Ba truy vấn cùng khoá vào `slug.current`: `fetchAllTerms`, `categoryBySlugQuery`,
`toursByTypeQuery`. Nên câu hỏi phải trả lời là: khoá vào `slug` hay khoá vào `termCode`.

## Quyết định

**1. Trang danh mục con khoá vào `slug`, không khoá vào `termCode`.** Giữ nguyên ba truy
vấn. Điền `slug` cho category trong Studio là việc bắt buộc khi muốn có trang danh mục.

**2. Hai field giữ đúng hai vai, không nhập một.** `termCode` là khoá nội bộ ổn định, không
đổi khi sửa tên hiển thị. `slug` là URL công khai, đổi được vì SEO mà không phá tham chiếu
nội bộ. Đây là chủ ý sẵn có của schema, ADR này chỉ chốt lại thay vì để nó ngầm.

**3. Thêm cổng mức `fail`: `assertNavTermsHaveSlug`.** Mục menu `kind: 'term'` trỏ vào một
category CÓ THẬT nhưng chưa điền `slug` thì build DỪNG, và thông báo chỉ đúng ô đang thiếu ở
document nào. Gọi trong `getStaticPaths`, trước `assertNavTargetsExist`.

**4. Thêm báo cáo mức `warn`: `reportTermSlugGaps`.** Liệt kê mọi category term-set còn trống
`slug` ra cuối log build. Build vẫn chạy. Đây là báo cáo mô tả hiện trạng, không phải danh
sách bắt buộc.

**5. `fetchAllTerms` thôi lọc câm.** Thay bằng `scanTerms()` trả về hai nhóm tách bạch: cái
đã điền slug (có trang) và cái chưa (không có trang). `fetchAllTerms` giữ nguyên chữ ký cho
`sitemap.ts` và `[lang]/[...path].astro`, chỉ còn là lớp mỏng gọi `scanTerms().terms`.

**6. Mục menu sửa thành `{ kind: 'term', target: 'tour/tour-dao' }`.**

## Vì sao quyết như vậy

**Vì sao khoá `slug` chứ không khoá `termCode`.** `termCode` bắt buộc nên khoá vào nó thì
trang luôn có, không cần cổng nào — nghe hấp dẫn đúng lúc đang chữa cháy. Nhưng nó gộp hai
vai vào một field: đổi URL danh mục vì SEO sẽ phải đổi khoá nội bộ, kéo theo mọi tham chiếu.
Đó là đánh đổi một lần cho tiện lấy một ràng buộc vĩnh viễn. Sai lầm ở đây không nằm ở chỗ
chọn `slug`; nó nằm ở chỗ dựng một trang trên field tuỳ chọn mà **không rào**.

**Vì sao cổng `fail` phải hẹp.** Bản đầu định chặn cứng mọi category term-set thiếu slug.
Nhưng cả bốn category `experience-type` còn lại đều đang trống, nên rào ấy sẽ ép đẻ ra bốn
trang chưa ai yêu cầu, trong đó `/trai-nghiem/khach-san/` còn đá với entity Khách sạn đang ở
`/khach-san/`. Cổng chặn cái chưa được yêu cầu là cổng sẽ bị vô hiệu hoá. Nên chặn cứng đúng
phần đang bị menu trỏ vào, phần còn lại chuyển sang `warn`.

**Vì sao cần cổng thứ hai khi đã có `assertNavTargetsExist`.** Cổng cũ chỉ biết "trang không
tồn tại" nên nó đoán sai bệnh: nó bảo chủ dự án đi nhập nội dung, trong khi nội dung đã đủ
và cái thiếu chỉ là một ô trong category. Chẩn đoán sự cố này mất một vòng vì đúng câu đoán
sai đó. Thông báo lỗi cũng là một mặt giao tiếp; sai thì tốn công thật.

## Phương án đã loại

**Đổi ba truy vấn sang `termCode.current`.** Không cần nhập liệu, không cần cổng nào. Loại
vì gộp khoá nội bộ với URL công khai (lý do ở trên), và vì nó chữa triệu chứng "trang không
sinh ra" chứ không chữa bệnh "trang treo vào field tuỳ chọn mà không ai canh".

**Bắt buộc `slug` ở schema (`validation: Rule.required()`).** Đúng hướng nhưng loại ở đợt
này: sửa schema bắt buộc một field đang trống trên 5 document sẽ làm chúng thành invalid
trong Studio ngay lập tức, và ép xử cả bốn category `experience-type` chưa nằm trong phạm vi.
Giữ làm hướng siết về sau, khi bốn category kia đã có chỗ dùng.

**Giữ `kind: 'detail'`, chỉ đổi slug cho khớp tour mới.** Loại vì đó là chữa đúng triệu
chứng đã gây ra sự cố: menu vẫn gắn cứng vào một document, và sẽ vỡ lại y hệt ở lần đổi slug
kế tiếp. Ý định của mục menu vốn là một danh mục, không phải một tour.

## Hệ quả

**Được:**

- `/tour/tour-dao/` tồn tại, liệt kê **7/7 tour đã publish** — toàn bộ tour của site hiện
  đều mang `tour-type` "Tour đảo". Đã vào `sitemap-vi.xml`.
- Menu không còn gắn cứng vào một document. Đổi slug một tour không làm vỡ build nữa; thêm
  một tour mới vào category là nó tự lên trang danh mục, không phải sửa `site.config.ts`.
- Câu báo lỗi nay chỉ đúng ô thiếu ở document nào, thay vì đoán chung chung.

**Mất và phải chấp nhận:**

- Muốn có trang danh mục con thì bắt buộc điền `slug` trong Studio. Quên thì cổng `fail`
  chặn nếu menu đang trỏ vào, và `warn` nhắc nếu không.
- Bốn category `experience-type` (Khách sạn, Ẩm thực, Cẩm nang du lịch, Resort) vẫn chưa có
  trang danh mục con. Đây là hiện trạng đã biết, in ở mức `warn` mỗi lần build.

**Còn treo, chưa quyết:**

- **Entity approved mà thiếu `slug` vẫn rơi im lặng.** `toListing`
  (`RouteDispatch.astro:84`) bỏ mọi mục không có slug — không link chết, nhưng cũng không ai
  biết nó vắng mặt. Đây đúng cùng một hình dạng lỗi mà ADR này vừa chặn ở tầng category,
  chưa chặn ở tầng entity. Ứng viên cho một báo cáo `warn` cùng kiểu.
- **`ND-002` chưa đóng.** Document `organization` tên "Vinpearl" vẫn mang slug
  `tour-3-dao-nha-trang-review-chi-tiet`, sinh ra `/cong-ty/tour-3-dao-nha-trang-review-chi-tiet/`.
  Nghi nhập nhầm từ 06-08, cần chủ dự án xác nhận trước khi đổi — đổi thì phát sinh dòng R3.
