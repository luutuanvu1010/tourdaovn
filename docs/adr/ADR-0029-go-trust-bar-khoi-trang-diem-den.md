# ADR-0029 — Gỡ vùng "Trust bar" khỏi trang điểm đến; khối bốn điểm khác biệt chỉ còn ở trang chủ

- **Trạng thái:** **accepted** — chủ dự án quyết trong phiên 2026-08-28 (xem `QĐ-2026-08-28-01`).
- **Ngày:** soạn và phê chuẩn 2026-08-28   **Người phê chuẩn:** Lưu Tuấn Vũ (chủ dự án)
- **Loại quyết định:** cửa **hai chiều**. Không đụng schema, không đụng dữ liệu, không migration.
  Gỡ một vùng giao diện và một hàng đặc tả; muốn dựng lại thì thêm lại được, chi phí bằng lần gỡ.
- **Supersedes:** không. **Xoá** hàng "Trust bar" trong `06-BINDING_MAP` §4.1 và tên khối đó
  trong danh sách của §5.7. Phần còn lại của cả hai mục giữ nguyên hiệu lực.
- **Liên quan:** `06-BINDING_MAP` §4.1 §5.7 (nâng v2.6.0 → v2.7.0), `ADR-0028` (đa điểm đến),
  `src/components/TouristDestinationHub.astro`, `src/components/HomeTrustBar.astro`,
  `src/lib/homepage.ts`, `DR-076`

## Bối cảnh

Ngay trên mục "Tổng quan về {tên điểm đến}", trang điểm đến hiện một dải bốn ô: *Xe đưa đón tận
nơi*, *Hướng dẫn viên đi cùng*, *Giá tốt*, *Thanh toán linh hoạt*. Chủ dự án hỏi bốn giá trị đó
là tham chiếu hay viết cứng.

Chúng viết cứng: `src/lib/homepage.ts:53-58`, lặp cho năm ngôn ngữ (dòng 53, 95, 137, 179, 221).
`HomeTrustBar.astro` không đọc Sanity, chỉ nhận prop `items`. Studio có khoá `trustBar` trong
`siteSettings.sections` nhưng đó là **nút bật/tắt khối**, không phải chỗ nhập chữ.

Viết cứng ở đây **không sai đặc tả** — cả hai hàng chi phối vùng này đều khai nguồn là
`config (build)`. Cái sai nằm chỗ khác, và nặng hơn.

### Một component, một nguồn chữ, hai hàng đặc tả ngược nhau

| Hàng | Trang | Đặc tả đòi | Mã | Khớp? |
|---|---|---|---|---|
| §5.7 "Vì sao chọn" | trang chủ | bốn điểm khác biệt — lập luận bán hàng | `SiteHome.astro:204`, có heading, đi qua cổng `activeSections` | ✔ |
| §4.1 "Trust bar" | điểm đến | cam kết hệ thống về nội dung duyệt, dữ liệu có nguồn, cập nhật rõ — **"không phải CTA marketing"** | `TouristDestinationHub.astro:146`, không heading, render vô điều kiện | ✘ |

Trang điểm đến mượn nguyên khối bán hàng của trang chủ để lấp ô mà đặc tả dành cho tín hiệu tin
cậy. Hai hàng đòi hai thứ trái ngược, mà mã chỉ có một khối và một mảng chữ.

Thêm một lệch nhỏ đi kèm: trên trang chủ khối này chịu sự điều khiển của `siteSettings.sections`,
còn trên trang điểm đến nó render vô điều kiện — biên tập viên thấy nút `trustBar` trong Studio
nhưng nút đó không tác động tới trang điểm đến.

### Số đo quyết định

Bản dựng 2026-08-28, cả bốn trang điểm đến đang xuất bản:

| | nha-trang | ninh-thuan | da-lat | tinh-khanh-hoa |
|---|---|---|---|---|
| Khối bán hàng (`.why-section`) | 1 | 1 | 1 | 1 |
| "Xác minh dữ liệu: Wikidata" (`HomeMetaBar`) | 0 | 0 | 0 | 0 |
| "Cập nhật lần cuối" | 0 | 0 | 0 | 0 |
| `AuthorityMeta` | 0 | 0 | 0 | 0 |

`HomeMetaBar` chỉ render khi `sameAs` có URL wikidata/wikipedia — các document chưa có.
`AuthorityMeta` chỉ chạy ở nhánh `kind === 'detail'` (`RouteDispatch.astro:438`), trang điểm đến
không thuộc nhánh đó.

**Ba cam kết mà hàng §4.1 gọi tên đạt con số không trên mọi trang điểm đến.** Hàng đó khai
"bắt buộc / luôn hiện" và chưa bao giờ được thi hành; ô của nó bị bốn lời hứa bán tour chiếm chỗ.

## Phương án đã cân

**A — Gỡ hẳn vùng khỏi trang điểm đến.** ✅ **Chọn.**

**B — Giữ ô, thay ruột bằng ba cam kết thật.** Loại. Cả ba cam kết là **dữ liệu per-document**
(`reviewStatus`/`approvedBy`, `sameAs`, `updatedAt`), không phải `config (build)` — tức cột "Dữ
liệu nuôi" của hàng §4.1 khai sai nguồn ngay từ đầu. Và ba thứ đó đã có vùng riêng là
`HomeMetaBar` và `AuthorityMeta`; dựng thêm một vùng nữa cho cùng field là đúng thứ **Luật 1** cấm.

**C — Đưa bốn mục lên Sanity.** Loại. Đi ngược cả hai hàng khai `config (build)`, và
`HomeTrustBar.astro` ghi rõ đây là *"định vị, đổi theo chiến lược chứ không theo biên tập"*.

## Quyết định

1. **Gỡ `<HomeTrustBar>` khỏi `TouristDestinationHub.astro`.** Trang điểm đến đi thẳng từ đoạn mở
   sang "Tổng quan về {tên}".
2. **Xoá hàng "Trust bar" khỏi `06-BINDING_MAP` §4.1**, và xoá tên khối đó khỏi danh sách "Các
   khối nội dung" của §5.7. Nâng `06` lên **v2.7.0**.
3. **Giữ NGUYÊN toàn bộ module "Vì sao chọn Tour Đảo" trên trang chủ** — `SiteHome.astro:204`,
   `HOME_COPY.trustItems`, `HomeTrustBar.astro`, khoá `trustBar` trong `siteSettings.sections`.
   Không đổi một chữ nào trong bốn mục. Đây là yêu cầu minh thị của chủ dự án.
4. `HomeTrustBar` từ nay có **đúng một nơi dùng** và **đúng một hàng đặc tả**: §5.7, trang chủ.

## Hệ quả

**Được.**
- Hết chuyện CTA marketing đứng ở ô đặc tả dành cho cam kết hệ thống.
- Mã và đặc tả khớp nhau mà không đẻ thêm vùng mới.
- Đặc tả hết một hàng "bắt buộc" chưa bao giờ được thi hành — hàng như vậy làm cổng và người đọc
  tin rằng vùng đó có, trong khi nó không có.
- Trang điểm đến bớt một dải mà biên tập viên không tắt được.

**Mất.**
- Ý "cam kết hệ thống" không còn hàng nào chở trong `06` §4.1. Chấp nhận được vì số đo cho thấy ý
  đó **hiện đang bằng không**; gỡ hàng là ghi nhận sự thật, không phải đánh mất thứ đang có.
- Trang điểm đến ngắn đi một dải. Không có khối nào thế chỗ — theo **R7**, vùng rỗng ẩn hẳn chứ
  không dựng khung thay thế.

**Không quyết ở đây.**
- Nội dung bốn mục trên trang chủ. Đó là §5.7, ngoài phạm vi ADR này.
- Đưa `HomeTrustBar` ra khỏi tên gọi "Home*" hay không. Đổi tên là việc dọn dẹp riêng.

## Việc kéo theo, tách phiếu

Nếu vẫn muốn tín hiệu tin cậy thật trên trang điểm đến thì **không thiếu chỗ mà thiếu dữ liệu**.
Hai vùng đã có sẵn, đang tắt:

1. Mở `AuthorityMeta` cho `kind === 'destination'` trong `RouteDispatch.astro` — một dòng route.
2. Nạp `sameAs` (URL wikidata) cho bốn document `touristDestination` — việc dữ liệu, để
   `HomeMetaBar` render được.

Cố ý **không** gộp vào lượt này: đó là thêm tính năng, còn ADR này chỉ gỡ một vùng sai chỗ.
