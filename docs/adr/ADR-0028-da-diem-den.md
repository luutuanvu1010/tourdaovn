# ADR-0028 — TouristDestination là N, và mọi entity khai mình thuộc điểm đến nào

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
Quyết định này TỔNG QUÁT HOÁ một hằng số của engine gốc, không phải quyết định riêng của
tourdaovn. nhatrangtravel viết mô hình với đúng một TouristDestination ("Nha Trang") vì site
đó phục vụ một điểm đến. Cơ chế ở đây tái dùng được cho mọi site: (1) cardinality của entity
trụ là tham số, không phải hằng; (2) quan hệ `* → touristDestination` là một cạnh phẳng, độc
lập với chuỗi địa lý `containedInPlace`; (3) trang chủ site và trang điểm đến trụ là hai vai
tách rời, nối bằng `primaryDestinationSlug`. Việc site này giữ Nha Trang ở `/` là cấu hình,
không phải luật engine.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** **proposed** — nháp soạn 2026-08-26 theo yêu cầu chủ dự án trong cùng phiên.
  **Chưa phê chuẩn.**
- **Ngày:** soạn 2026-08-26   **Người phê chuẩn:** _(chờ)_ Lưu Tuấn Vũ (chủ dự án)
- **Loại quyết định:** cửa **một chiều** ở hai điểm — (1) cardinality `TouristDestination`
  trong `01-CONTENT_MODEL` §2 đổi từ **1** sang **N**; (2) thêm một quan hệ mới
  `* → touristDestination` vào mô hình dữ liệu, tức thêm một field vào mười entity và nạp bù
  toàn bộ dữ liệu đang có. Cửa hai chiều ở khối trang chủ, loại đích menu, và chữ nghĩa.
- **Supersedes:** không. **Nới** phát biểu "TouristDestination = 1" trong `ADR-0002` (mô hình
  entity) — phần còn lại của ADR-0002 giữ nguyên hiệu lực.
- **Liên quan:** `ADR-0002` (mô hình entity), `ADR-0020` (multi-site registry — **phương án bị
  loại**, xem dưới), `ADR-0021` (site.config là nguồn sự thật), `ADR-0023` (điều hướng khai
  một chỗ), `01-CONTENT_MODEL` §2 §2.1 §5 §6, `05-URL_MAP` §2, `06-BINDING_MAP`,
  `QĐ-2026-08-25-01` (gói cước Sanity), `docs/specs/SPEC-2026-08-26-da-diem-den.md`

## Bối cảnh

Chủ dự án yêu cầu (2026-08-26) thêm được điểm đến ngoài Nha Trang vào CMS, và các điểm đến đó
**thừa hưởng toàn bộ cấu trúc trang chi tiết** giống Nha Trang.

Kiểm tra thực trạng cho ba dữ kiện:

1. **Khuôn trang đã đa điểm đến sẵn.** `src/pages/[...path].astro:73-80` lặp qua mọi
   `touristDestination` đã duyệt và sinh một trang cho mỗi cái; `src/lib/sitemap.ts:86`
   đưa hết vào sitemap; `RouteDispatch.astro` render chúng bằng `TouristDestinationHub.astro`
   — chính là layout của trang Nha Trang. Hạ tầng định tuyến không phải xây lại.
2. **Dữ liệu thì không.** Trang điểm đến có hai khối tự động — "Các khu vực nên biết" và
   "Cẩm nang bản địa" — mà truy vấn của chúng
   (`src/lib/queries/touristDestination.ts`) quét **toàn bộ** dataset, không lọc theo điểm
   đến. Điểm đến thứ hai sẽ hiện nội dung Nha Trang.
3. **Không có đường nào để lọc.** Không entity con nào khai mình thuộc điểm đến nào. Chuỗi
   địa lý `containedInPlace` có tồn tại và trỏ được tới `touristDestination`, nhưng trong bản
   sao lưu 2026-08-14 chỉ **1/12 Place** và **1/18 Attraction** khai ô đó, còn `tour` —
   dòng sản phẩm chính, 11 document — **không có ô vị trí nào**.

Hai thứ ép phải quyết bằng ADR chứ không thể chỉ viết spec:

- `01-CONTENT_MODEL.md:42` khai cardinality `TouristDestination` là **1**, và §5 mô tả nó là
  "container địa lý gốc". Đổi con số đó là sửa mô hình nội dung ở tầng gốc, thứ mà `CLAUDE.md`
  §5 và `GOVERNANCE` liệt kê là điểm dừng bắt buộc.
- Thêm một quan hệ vào mô hình dữ liệu và nạp bù 57 document là hành động **không lùi được
  bằng một commit revert** — dữ liệu đã ghi thì phải xoá bằng script khác.

## Quyết định

1. **Cardinality `TouristDestination` là N, không phải 1.** `01-CONTENT_MODEL` §2 sửa theo.
   Mỗi document Điểm đến đã duyệt là một trang trụ `/‹slug›/` đầy đủ, mang **cùng một khuôn**
   `TouristDestinationHub`.

2. **Thêm một field `destination` — reference tới `touristDestination`** — vào **mười** entity:
   `place`, `attraction`, `experience`, `hotel`, `resort`, `tour`, `article`, `restaurant`,
   `specialty`, `event`. Không thêm cho `person`, `organization`, `category`, `siteSettings`,
   và **không** cho chính `touristDestination`.

   Field này **tuỳ chọn** ở tầng Studio, đúng quy ước đã chốt 2026-08-04 (mọi field tuỳ chọn
   trừ `title.vi` và `slug.vi`). Không đặt `initialValue`.

3. **Quan hệ này phẳng và độc lập với `containedInPlace`.** `containedInPlace` trả lời "nằm
   trong đơn vị chứa **trực tiếp** nào" và có thứ bậc; `destination` trả lời "thuộc **điểm
   đến** nào" và không có thứ bậc. Hai đường tồn tại song song, phục vụ hai vai — giống hệt
   cách `containedInPlace` và `containedInPlaceRef` đã song song từ trước (`01-CONTENT_MODEL`
   §5). **Không** suy `destination` ra từ chuỗi `containedInPlace`, và **không** ép hai đường
   phải nhất quán với nhau.

4. **Thiếu `destination` là `warn`, không phải `fail`.** Thêm bất biến **I20** ở mức `warn`
   trong `scripts/validators/i1-i19.ts`. Trỏ sai type hoặc trỏ vào `_id` không tồn tại vẫn là
   `fail`, qua `references` trong `scripts/gate.config.ts` — đó là kiểm toàn vẹn, khác kiểm
   completeness.

5. **Trang chủ `/` giữ nguyên vai trang Nha Trang.** Không đổi thành cổng chọn điểm đến. Nối
   giữa "trang chủ site" và "điểm đến trụ" vẫn là `primaryDestinationSlug` trong
   `src/site.config.ts` — nghĩa là quyền đổi điểm đến trụ nằm ở git, không nằm trong Studio,
   đúng ranh giới `ADR-0021` đã dựng.

6. **Các trang danh mục (`/tour/`, `/khach-san/`, …) vẫn gom chung toàn site** trong đợt này.
   Field `destination` đặt sẵn đường để lọc về sau, nhưng mở ra là một quyết định riêng vì nó
   đụng `ROUTE_MAP` và `05-URL_MAP`.

## Lý do

**Vì sao thêm field mới thay vì dùng `containedInPlace` đã có.** Về mô hình, suy điểm đến từ
chuỗi địa lý là cách "đúng" hơn — không thêm dữ liệu dư. Nhưng nó đòi ba thứ mà hôm nay không
có: dữ liệu chuỗi phải đầy đủ (thực tế 2/30 document khai), mọi entity phải nằm trong chuỗi đó
(Tour không có ô vị trí nào), và mỗi lần đọc phải duyệt ngược nhiều cấp trong GROQ. Chọn cách
"đúng" ở đây nghĩa là nhập bù thủ công gần như toàn bộ dataset **trước khi** tính năng chạy
được, và vẫn không phủ được dòng sản phẩm chính. Một cạnh phẳng thì nạp bù bằng script được
trong một lần chạy.

**Vì sao là N chứ không phải "một site một điểm đến".** `ADR-0020` đã dựng cơ chế đa-site, nên
"mỗi điểm đến một site" là phương án có sẵn hạ tầng. Nó bị loại vì lý do vận hành, không phải
kỹ thuật — xem dưới.

**Vì sao không đặt `initialValue` mặc định là Nha Trang.** Mặc định làm biên tập viên nhập nội
dung Phú Quốc mà không đổi ô này sẽ gán nhãn sai, và **không có tín hiệu nào** báo cho ai biết:
document vẫn publish, vẫn lên trang danh mục, chỉ nằm nhầm trang điểm đến. Ô trống thì I20 kêu.
Sai lộ ra ồn ào tốt hơn sai lặng lẽ.

**Vì sao `warn` chứ không `fail`.** Bộ cổng của dự án đang có 27 control `status: gap` và 11
validator đỏ vì dữ liệu thật (`DR-044`). Thêm một điều kiện `fail` mới lúc này là chặn publish
mọi nội dung chưa nạp bù — bao gồm cả nội dung đang chờ lên. `warn` cho phép nạp bù dần mà
không dựng thêm một hàng rào nữa trước mặt biên tập viên.

**Vì sao trang chủ không đổi vai.** Đổi `/` thành cổng chọn điểm đến là bỏ trang đang xếp hạng
cho cụm từ khoá Nha Trang. Chi phí SEO đó chỉ đáng trả khi đã có ít nhất hai điểm đến với nội
dung thật, mà hôm nay mới có một.

## Phương án bị loại

**Mỗi điểm đến một site riêng (`ADR-0020`).** Hạ tầng đã có, schema không phải đụng, không có
cửa một chiều nào. Loại vì nó nhân đôi chi phí vận hành cho một lợi ích chưa cần: thêm một
dataset Sanity, một tên miền, một đường phát hành, một bộ cổng phải chạy song song — trong khi
`QĐ-2026-08-25-01` vừa ghi nhận dự án **đã cạn hạn mức API Sanity** của tháng 8 với **một**
site. Phương án này vẫn để ngỏ nếu sau này một điểm đến lớn tới mức cần thương hiệu riêng.

**Chọn tay trên trang Điểm đến (`featuredPlaces[]`, `featuredArticles[]`).** Ít việc nhất,
không migrate, đúng khuôn `featured*` đã có. Loại vì hai lẽ: nó **đổi hành vi hiện hành của
trang Nha Trang** (hai khối đang tự động sẽ thành phải nhập tay), và nó không để lại đường nào
để về sau biết một tour hay một khách sạn thuộc điểm đến nào — tức không giải quyết gốc, chỉ
che chỗ hở đang thấy.

**Suy từ `containedInPlace`.** Xem "Lý do" ở trên.

## Hệ quả

**Chấp nhận:**

- Có **hai** đường mô tả vị trí trên cùng một document (`containedInPlace` và `destination`),
  và không có kiểm máy nào bắt hai đường mâu thuẫn. Đây là hệ quả đã lường của quyết định 3.
  Nếu về sau chuỗi địa lý được nhập đầy đủ, có thể thêm một validator đối chiếu — nhưng đó là
  quyết định khác, không gộp vào đây.
- 57 document (số theo bản sao lưu 14/8) bị một script ghi vào. Không lùi được bằng revert.
- `01-CONTENT_MODEL` §2 mất tính "một điểm đến" vốn là giả định ngầm của nhiều đoạn văn xuôi
  trong đặc tả; phải soát lại các đoạn đó, không chỉ sửa con số ở bảng.

**Kéo theo, bắt buộc làm cùng:**

- Hai meta-validator `g1` và `g4` chép tay danh sách field, sẽ **nói sai** nếu không cập nhật
  cùng lúc (chi tiết ở spec §4.8). Cổng nói dối còn tệ hơn cổng không có.
- Enum `sections` trong `siteSettings` mở từ 19 lên 20 khoá; `NavKind` từ 7 lên 8 loại đích.
  Cả hai là enum đóng có kiểm, nên phải sửa đồng thời ở schema, ở đặc tả, và ở mã.

**Bị chặn tới 2026-09-01:** hạn mức API Sanity đã cạn (`QĐ-2026-08-25-01`, reset 00:00 UTC
ngày 1). Script nạp bù và `npm run build` đều gọi Sanity nên chưa chạy được. Phần sửa mã, sửa
schema, sửa validator và sửa tài liệu làm được ngay.

**Không đổi:** URL của mọi trang đang có; vai trang chủ; ranh giới quyền giữa git và Studio
(`ADR-0021`); nguồn điều hướng một chỗ (`ADR-0023`).
