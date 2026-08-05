# ADR-0023 — Điều hướng theo dòng dịch vụ, và trang tĩnh sinh từ `siteSettings`

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
Quyết định RIÊNG của tourdaovn về cách khai điều hướng. Cơ chế `nav` (khai menu trong
site.config, sáu `kind`, kiểm lúc build) là khuôn tái dùng được cho mọi site. Nội dung menu
và hai trang tĩnh là của riêng site này. Core kế thừa CƠ CHẾ, không kế thừa NỘI DUNG.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** accepted
- **Ngày:** 2026-08-05   **Người phê chuẩn:** Lưu Tuấn Vũ (founder)
- **Loại quyết định:** cửa một chiều ở phần điều hướng công khai (URL và menu đã lên
  Google); cửa hai chiều ở phần chỗ lưu nội dung trang tĩnh
- **Supersedes:** không. Bổ sung cho ADR-0021 (site.config là nguồn sự thật)
- **Liên quan:** ADR-0002 và ADR-0006 (mô hình entity, thủ tục thêm entity),
  ADR-0021, `04-CONSTRAINTS` §1c (R1–R4) và §2.2, `01-CONTENT_MODEL` §2.15 và §5.3,
  `DRIFT_LOG` DR-004, DR-005, DR-007,
  `docs/specs/SPEC-pha-C-cay-url-theo-dich-vu.md`

## Bối cảnh

Site được dựng từ engine `nhatrangtravel`, một cổng thông tin du lịch. Điều hướng vì vậy
tổ chức theo **chủ đề du lịch**: ba hub Khám phá / Lưu trú / Đi lại, hardcode ở
`Header.astro:24`.

Nhưng chủ thể là **Công ty TNHH Tour Đảo**, một doanh nghiệp bán dịch vụ. Sáu dòng dịch vụ:
tham quan biển đảo, tour đảo Nha Trang, tour lặn biển, vé VinWonders, đặt phòng khách sạn 5
sao và resort, đưa đón sân bay.

Ba dữ kiện dẫn tới quyết định này:

1. **Menu không bán gì.** `/tour/` — dòng sản phẩm chính — không có mặt trên menu chính, và
   đứng thứ 12 trong 14 khối trang chủ, sau cả `specialties` là danh mục đã tắt.
2. **Điều hướng hardcode ba chỗ** (`Header.astro:24`, `Footer.astro:32-33`,
   `homepage.ts` `quickLinks` lặp năm lần), lệch hợp đồng `06-BINDING_MAP` §2 vốn khai
   "Header điều hướng | config (build)". Ghi ở DR-007. `01-CONTENT_MODEL` §2.15 cũng đã tự
   ghi nhận đây là phiếu nợ chưa xử khi bàn tới chỗ đặt link cho trang lộ trình đón khách.
3. **Menu mà founder chốt có ba mục không có chỗ trong mô hình dữ liệu**: "Đặt vé trực
   tuyến", "Hỗ trợ", "Liên hệ". Repo không có cơ chế trang tĩnh nào, và 14 entity đều là
   entity du lịch.

## Quyết định

**1. Điều hướng khai trong `site.config.ts`, không hardcode trong component.**

Thêm khối `nav`. `Header.astro`, `Footer.astro`, `homepage.ts` đọc từ đó. Đây là hệ quả
trực tiếp của ADR-0021 áp cho điều hướng, và trả DR-007.

**2. Sáu `kind` cho một mục điều hướng:** `index` (trang danh sách một entity) · `hub` (gom
nhiều entity) · `term` (trang danh mục con) · `detail` (một document cụ thể) · `static`
(trang tĩnh) · `zalo` (liên kết ngoài, đọc `siteSettings.contact.zaloUrl`).

Mục có `children` thành nhóm thả xuống.

**3. Mọi `target` phải trỏ tới một trang mà lần build đó thực sự sinh ra.** Kiểm lúc build,
mức `fail`. Đây là siết thêm, tự do theo `04-CONSTRAINTS` §5.

**4. Menu tổ chức theo dòng dịch vụ.** Ba hub cũ rời khỏi menu chính nhưng **giữ nguyên
URL** — gỡ khỏi menu là quyết định điều hướng, xoá URL là quyết định SEO, và việc thứ hai
không làm ở đây.

**5. Trang tĩnh sinh từ `siteSettings`, không mở entity mới.** `/lien-he/` đọc
`siteSettings.contact` (dữ liệu đã có). `/ho-tro/` đọc một field mới `siteSettings.support`.
Theo khuôn `/lo-trinh-don-khach/` đã có.

**6. Không mở entity `page` ở đợt này.** Mở lại khi số trang tĩnh vượt hai.

## Lý do

- **Cấu trúc phải phản ánh việc kinh doanh, không phản ánh engine gốc.** Hiến pháp P1:
  định vị chốt trước, cấu trúc theo sau. Điều hướng theo chủ đề du lịch là di sản của một
  site khác, không phải quyết định của site này.
- **`kind: 'detail'` cho phép hoãn phân loại.** Menu founder chốt liệt bảy sản phẩm cụ thể
  theo tên. Hôm nay chúng là bảy liên kết thẳng; mai nếu gom thành danh mục "vé vào cổng"
  thì đổi `kind` trên một dòng, không đụng cơ chế.
- **Kiểm lúc build biến một lỗi im lặng thành lỗi ồn ào.** Không có nó, bật một mục menu
  khi chưa có document sẽ lên production rồi khách bấm vào trang trắng. Có nó, build dừng
  trên máy lập trình viên. Cùng triết lý với `astro check` ở gói dữ liệu thiếu
  (`114010a`): đẩy lỗi lên sớm nhất có thể.
- **Sinh trang tĩnh từ `siteSettings` rẻ hơn mở entity, và đảo ngược được.** Thêm `_type`
  là cửa một chiều theo `01-CONTENT_MODEL` §5.3, chạm điều cấm `04-CONSTRAINTS` §2.1, kéo
  theo cả họ validator `I` phải sửa. Thêm field vào một singleton đã có chỉ cần thủ tục
  §2.2. Với đúng hai trang, cái giá của entity không mua được gì.
- **Không mượn `article` cho trang tĩnh.** JSON-LD sẽ phát `Article` cho một trang liên hệ,
  trong khi schema.org có `ContactPage`. Site này đầu tư vào dữ liệu có cấu trúc (I6 là cổng
  `fail`, có `llms.txt` và `/ai/*.json`); làm bẩn nó để tiết kiệm một field là đổi sai chiều.

## Phương án đã loại

- **Thêm entity `page`:** loại cho đợt này. Đúng hướng khi có nhiều trang tĩnh, nhưng hôm
  nay có hai, và nó là cửa một chiều. Mở khi có căn cứ thật thay vì suy đoán trước.
- **Trang tĩnh viết cứng thành `.astro`:** loại. Biên tập viên không sửa được, và nội dung
  chính sách thì phải sửa được mà không cần lập trình viên.
- **Giữ ba hub, chỉ thêm Tour vào menu:** loại. Founder đã cân và chọn menu theo dòng dịch
  vụ; giữ hub là giữ cách phân loại của site khác.
- **Xoá URL ba hub cũ:** loại. Chúng đang ở trong sitemap. Gỡ khỏi menu đủ để đổi hành vi
  điều hướng mà không động tới SEO. Xoá là quyết định riêng, cần R3 và bảng 301.
- **Menu khai đủ bảy sản phẩm ngay:** loại — sáu trên bảy chưa có document, và quyết định 3
  sẽ làm đỏ build. Khai theo nhịp, tới đâu có hàng tới đó.

## Hệ quả

**Tích cực.** Điều hướng có một nguồn sự thật duy nhất, đóng DR-007 và phiếu nợ đã ghi ở
`01-CONTENT_MODEL` §2.15. Thêm một sản phẩm vào menu là thêm một dòng, không cần lập trình
viên. Menu trỏ vào chỗ trống trở thành lỗi build thay vì lỗi khách hàng gặp.

**Đánh đổi, ghi thẳng.**

- Ba hub cũ mất lối vào từ menu. Vẫn ở trong sitemap và vẫn nhận liên kết nội bộ, nhưng
  lưu lượng vào chúng sẽ giảm. Đây là chủ ý.
- **Khách sạn và resort không có mục nào trên menu**, dù vẫn là dịch vụ đang bán. Hiện cả
  `/khach-san/`, `/resort/`, `/luu-tru/` đều 0 document nên chưa lộ ra; khi có nội dung thì
  phải quyết chỗ đặt. Ghi thành phiếu nợ.
- Quyết định 3 khiến menu **không thể khai trước nội dung**. Đây là tính năng, không phải
  lỗi, nhưng nó buộc thứ tự làm việc: nhập liệu trước, khai menu sau.
- `siteSettings` phình thêm. Tới trang tĩnh thứ ba nên dừng lại xét entity `page` thay vì
  tiếp tục thêm field.

**Muốn quay lại:** gỡ khối `nav` khỏi `site.config.ts` và trả ba component về danh sách
hardcode. URL không đổi nên không có gì để hoàn tác ở phía SEO. Đó là lý do quyết định này
được cố ý giữ ở phần đảo ngược được nhiều nhất có thể.
