# ADR-0021 — `site.config.ts` là nguồn sự thật duy nhất về phạm vi site; tách hai tầng cấu hình theo người sửa

- **Trạng thái:** **accepted**, phê chuẩn 2026-07-27. Chủ dự án duyệt nguyên tắc hai tầng, bổ sung mô hình phân quyền (Quyết định 6), chốt xoá hẳn hub Ẩm thực (Quyết định 7), và yêu cầu trả nợ N7 ngay thay vì gia hạn.
- **Ngày soạn:** 2026-07-27   **Người soạn:** Claude (Cowork)   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa **hai chiều** ở phần cơ chế (gỡ ra chỉ cần trả lại hằng số cứng), nhưng **cửa một chiều** ở phần nguyên tắc (một khi tuyên bố "đây là nguồn sự thật", mọi việc sau đều dựa vào lời hứa đó). Vì chạm mô hình cấu hình và hợp đồng giữa các phần nên đi thủ tục ADR theo GOVERNANCE 3.2.
- **Liên quan:** `docs/RA-SOAT-PHAM-VI-2026-07-27.md` (báo cáo rà soát dẫn tới quyết định này), Hiến pháp P6 + N7 (một nguồn sự thật), P11 (đơn giản hơn thông minh), Điều 8.5 (mặc định từ chối), ADR-0002 (mô hình entity — danh mục thành cấu hình), ADR-0004 + ADR-0013 (i18n), ADR-0020 (Core đa-site, đang deferred).

---

## Bối cảnh

Site `tourdaovn` được dựng bằng cách fork engine Core (vốn hỗ trợ đa ngữ và nhiều entity) rồi thu hẹp lại: chỉ tiếng Việt, chỉ 9 entity. Việc thu hẹp đã làm bằng cách **sửa tay rải rác ở từng nơi**.

Rà soát ngày 2026-07-27 cho thấy hậu quả của cách làm đó:

1. **Không có nơi nào trả lời được câu hỏi "site này gồm những gì".** Bật hoặc tắt một danh mục phải sửa 6–8 chỗ: `src/lib/routes.ts` → `src/lib/sanity.ts` (`FIELD_LEVEL_TYPES`) → `src/components/RouteDispatch.astro` (3 bảng) → `cms/schemas/index.ts` → `src/lib/uiCopy.ts` → các endpoint AI.

2. **Đã lệch thật.** Bảng đường dẫn bị chép làm 3 nơi (`routes.ts`, `serialize/utils.ts:27-41`, `cms/lib/entityTypes.ts:67-177`) và đã lệch: bài viết là `cam-nang` ở web nhưng `bai-viet` ở CMS. Đây đúng là điều P6 cảnh báo: hai bản của cùng một thứ chắc chắn lệch theo thời gian.

3. **Sai im lặng.** `hub-am-thuc` có đủ nội dung 5 ngôn ngữ, có query, có icon và màu — nhưng thiếu một dòng trong `ROUTE_MAP` nên không có URL. Không có gì báo lỗi; hub chỉ đơn giản là không tồn tại. `restaurant`/`specialty`/`event` vẫn được truy vấn Sanity ở **mỗi lần build**, kết quả bị nuốt im lặng tại `src/pages/[...path].astro:38-39`.

4. **Người quản trị bị khoá ngoài.** `cms/schemas/siteSettings.ts` **không có trường tên thương hiệu**. Muốn đổi tên site phải sửa code ở 4 nơi (`Header.astro:48`, `Footer.astro:48,79`, `BaseLayout.astro:44`, `SiteHome.astro:34-70`). Một việc thuần biên tập lại đòi một lần deploy.

Vấn đề gốc không phải "code viết ẩu" mà là **thiếu một tầng cấu hình được tuyên bố**. Không có tầng đó thì mỗi lần thay đổi phạm vi lại là một đợt sửa lặt vặt, và mỗi đợt sửa lặt vặt lại đẻ ra một chỗ lệch mới.

---

## Quyết định

### 1. `src/site.config.ts` là nguồn sự thật duy nhất về phạm vi site

Mọi câu trả lời cho "site này gồm những gì" chỉ sống ở đúng một nơi: danh mục nào bật, hub nào bật, ngôn ngữ nào chạy, tên miền là gì, điểm đến chính là gì. Các file khác **đọc từ đó, không được tự khai lại**.

### 2. Cấu hình tách làm hai tầng, chia theo NGƯỜI SỬA — không chia theo loại dữ liệu

| Tầng | Nội dung | Sống ở đâu | Ai sửa | Hiệu lực |
|---|---|---|---|---|
| **Tầng cấu trúc** | danh mục, hub, ngôn ngữ, tên miền | `src/site.config.ts` | lập trình viên | sau khi build lại |
| **Tầng biên tập** | tên site, mô tả, liên hệ, điểm đến chính, nội dung | Sanity `siteSettings` | người quản trị | ~2 phút, tự động |

**Ranh giới phân chia:** thứ gì mà đổi nó thì **URL đổi theo** (buộc phải build lại, ảnh hưởng SEO, cần cân nhắc chuyển hướng 301) thì thuộc tầng cấu trúc. Thứ gì chỉ là **chữ nghĩa hiển thị** thì thuộc tầng biên tập.

Ranh giới này được chọn vì nó khớp với hậu quả thật, không phải vì tiện cho lập trình viên. Một người quản trị đổi tên site thì không ai gặp rủi ro; một người quản trị tắt nhầm danh mục "Khách sạn" thì hàng trăm URL biến mất khỏi Google. Cái thứ hai phải đi qua tay người biết mình đang làm gì.

### 3. Không bao giờ khai trùng — cấu hình lọc, bảng địa chỉ không tự quyết

`ROUTE_MAP` trong `routes.ts` **thôi giữ vai trò công tắc**. Nó chỉ còn trả lời "mục này nằm ở đường dẫn nào". Công tắc bật/tắt nằm ở `site.config.ts`; `ROUTE_MAP` xuất ra là bảng gốc **đã được lọc** theo công tắc đó.

Đây là điểm mấu chốt để không vi phạm N7: hai file cùng nhắc tới `hotel`, nhưng chúng trả lời hai câu hỏi khác nhau (*có bật không?* và *ở đâu?*), không phải hai bản của cùng một sự thật.

### 4. Có máy kiểm, mặc định từ chối

`assertRouteConfigConsistency()` chạy lúc build và **chặn build** khi phát hiện lệch, theo Hiến pháp Điều 8.5 ("không có bằng chứng đạt thì coi như chưa đạt; im lặng là trượt"):

- Bật một mục trong `site.config` nhưng quên khai đường dẫn → **build DỪNG**. (Đây chính là lỗi đã xảy ra với `hub-am-thuc`, nay không thể tái diễn im lặng.)
- Khai đường dẫn cho một mục chưa hề có trong `site.config` → **build DỪNG**.

Không dựa vào kỷ luật người viết. Bằng chứng là artifact, không phải lời khai (Điều 8.2).

### 5. File cấu hình phải đọc được bởi người không lập trình

`site.config.ts` viết bằng tiếng Việt, mỗi mục kèm đường dẫn kết quả, kèm cảnh báo hậu quả, và có bảng "sửa ở đâu" ngay đầu file. Đây là yêu cầu bắt buộc, không phải trang trí — theo P11, chi phí đọc hiểu lặp lại lớn hơn chi phí viết một lần, và người đọc lại file này sáu tháng sau có thể là chủ dự án chứ không phải lập trình viên.

### 6. Phân quyền: tầng cấu trúc thuộc riêng chủ dự án

Chủ dự án bổ sung khi phê chuẩn:

| Vai | Được làm | Không được làm |
|---|---|---|
| **Chủ dự án** | Sửa `site.config.ts`: bật/tắt danh mục, thêm/bớt ngôn ngữ, đổi tên miền | — |
| **Biên tập viên** (được mời vào Sanity Studio) | Nhập và sửa nội dung mọi danh mục; sửa `siteSettings`: lời chào, kênh liên hệ, ẩn/hiện khối trang chủ | Bật/tắt danh mục; thêm ngôn ngữ |

**Ranh giới này được bảo đảm bằng cấu trúc, không bằng lời nhắc.** `site.config.ts` sống trong git và chỉ vào site qua một lần build; biên tập viên không có quyền git cũng không có quyền deploy, nên không tồn tại đường nào chạm tới nó từ trong Studio. Đây là ranh giới thật, không phải quy ước xã giao.

**Ràng buộc phái sinh — bắt buộc:** `siteSettings` trong Sanity **không được chứa bất kỳ công tắc bật/tắt danh mục hay ngôn ngữ nào**. Thêm một công tắc như vậy vào Studio là vi phạm quyết định này, vì nó mở đúng cái cửa mà mô hình phân quyền đang đóng. Trường `sections[].hidden` hiện có chỉ ẩn/hiện khối trên trang chủ, không tạo hay xoá URL — nằm trong phạm vi cho phép.

### 7. Xoá hẳn hub Ẩm thực; nội dung ẩm thực viết dưới dạng Article

Chủ dự án chốt: không bật lại `hub-am-thuc`. Xoá hẳn khỏi mọi nơi, gồm 15 dòng nội dung 5 ngôn ngữ trong `uiCopy.ts`. Bài viết về ẩm thực từ nay là bài Cẩm nang (`article`), không có hub riêng và không có entity `restaurant`/`specialty`.

Hệ quả kèm theo: `src/pages/ai/reading-guide.json.ts` trước đây chỉ cho AI crawler ba đường dẫn `/am-thuc/`, `/dac-san/`, `/nha-hang/` — cả ba đều không tồn tại. Đã sửa để trỏ về `/cam-nang/` và nói rõ site không có entity nhà hàng hay đặc sản.

### 8. Tên site và tên pháp nhân sống trong `site.config.ts`, KHÔNG trong Sanity

> Điểm này **thay thế** dự kiến ban đầu ở mục "Còn nợ #1" (đưa tên site sang `siteSettings`). Chủ dự án chốt hướng ngược lại khi phê chuẩn. ADR-0021 chưa được commit vào git khi sửa, nên đây là hoàn thiện bản nháp chứ không phải sửa một ADR đã phát hành (docs/adr/README.md).

`brand.name` và `brand.legalName` là nguồn sự thật duy nhất cho tên site. **Không nơi nào trong code được viết lại tên này** — kể cả logo, footer, `og:site_name`, JSON-LD, hay tiêu đề trang 404.

Lý do đặt ở code chứ không ở Sanity, dù trước đó ADR này lập luận ngược lại:

- Tên site xuất hiện trong **JSON-LD node `Organization`** và thẻ meta ở **mọi trang**. Nó là một phần của định danh site đối với Google, không phải một dòng chữ hiển thị. Đổi nó giữa chừng mà không rà lại toàn bộ dữ liệu có cấu trúc là rủi ro SEO, không phải việc biên tập.
- Khớp mô hình phân quyền ở Quyết định 6: biên tập viên **không đổi được** tên site. Nếu để trong `siteSettings`, họ đổi được — mâu thuẫn với chính quyết định vừa chốt.
- Tên site đổi vài năm một lần. Bắt nó đi qua một lần build không phải là phiền hà đáng kể.

Ranh giới ở Quyết định 2 vẫn giữ nguyên và câu này làm rõ nó: **định danh site** thuộc tầng cấu trúc; **nội dung site** thuộc tầng biên tập. Lời chào trang chủ, mô tả, kênh liên hệ vẫn ở Sanity như cũ.

---

## Lý do

- **P6 + N7 là lý do trực tiếp.** Đã có bằng chứng lệch thật (`cam-nang` vs `bai-viet`), không phải rủi ro giả định.
- **Sai im lặng đắt hơn sai ồn ào.** `hub-am-thuc` chết mà không ai biết trong nhiều tuần. Một máy kiểm chặn build rẻ hơn nhiều so với việc phát hiện muộn.
- **Đúng thứ tự tầng (Điều 3.3).** Báo cáo rà soát tìm ra ~207 điểm hardcode. Vá từng điểm là "vá ở đáy" — đúng thứ Điều 3.3 cấm. Dựng tầng cấu hình trước rồi để thay đổi chảy xuống mới là sửa ở tầng đúng.
- **Trả quyền cho người quản trị.** Việc thuần biên tập không được đòi một lần deploy. Đây cũng là điều kiện để chủ dự án không phụ thuộc vào lập trình viên cho việc hằng ngày.
- **Không phát minh cơ chế mới.** Quyết định này chỉ đưa về đúng tinh thần ADR-0002 ("danh mục → cấu hình") vốn đã được duyệt, chứ không mở hướng mới. ADR-0020 (đa-site registry) vẫn deferred, không bị đụng tới.

---

## Phương án bị loại

**A. Sửa từng điểm hardcode, không dựng tầng cấu hình.** Nhanh hơn trước mắt và không cần ADR. Loại vì: vi phạm Điều 3.3 (vá ở đáy), và ~207 điểm sửa tay chắc chắn đẻ ra chỗ lệch mới. Lần thu hẹp phạm vi trước đã làm đúng theo cách này và kết quả là báo cáo rà soát hôm nay.

**B. Đưa tất cả vào Sanity, không có file config.** Người quản trị toàn quyền, không cần lập trình viên. Loại vì: bật/tắt một danh mục làm hàng trăm URL biến mất — đây là quyết định có hậu quả SEO không đảo ngược rẻ, không nên đặt sau một cái nút bấm trong Studio. Ngoài ra Astro build tĩnh cần biết cấu trúc route lúc build, không thể đợi dữ liệu runtime.

**C. Giữ `ROUTE_MAP` làm nguồn sự thật, thêm cột `enabled`.** Ít file hơn. Loại vì: `ROUTE_MAP` là bảng kỹ thuật (5 ngôn ngữ × segment × label mỗi dòng), không ai không-lập-trình đọc nổi; và nó không chứa được ngôn ngữ, tên miền, thương hiệu — sẽ vẫn phải có nơi thứ hai cho những thứ đó.

**D. Dùng biến môi trường (`.env`).** Loại vì: `.env` không vào git nên không có dấu vết thay đổi (vi phạm P5), không kèm được chú thích, và không kiểm kiểu được.

---

## Hệ quả

### Đã làm trong gói này

- Tạo `src/site.config.ts`.
- `src/lib/routes.ts`: `ROUTE_MAP` nay là bảng đã lọc; thêm `assertRouteConfigConsistency()` chặn build khi lệch.
- `src/lib/sanity.ts`: `FIELD_LEVEL_TYPES` đọc từ config → thôi truy vấn 3 danh mục chết ở mỗi lần build.
- `src/lib/sitemap.ts`: `LANGS` đọc từ config.
- `src/components/RouteDispatch.astro`: hub và các phần trong hub lọc theo config → hết mục rỗng.
- `src/components/HomeHubGrid.astro`, `TouristDestinationHub.astro`: danh sách hub đọc từ config, thôi khai tay.
- **Xoá hẳn hub Ẩm thực** (Quyết định 7): 15 dòng trong `uiCopy.ts`, khối trong `RouteDispatch.astro`, icon và màu ở 2 component, và 3 đường dẫn chết trong `reading-guide.json.ts`. Nhãn trong `cms/schemas/siteSettings.ts` sửa "4 hub" → "3 hub".
- **Trả xong nợ N7** (Quyết định 8 dưới đây).

### Đã trả nợ N7 ngay trong gói này

Chủ dự án yêu cầu trả ngay thay vì gia hạn tới 2026-08-15. Đã làm:

- `src/lib/serialize/utils.ts`: xoá `TYPE_PATH_MAP` (bản chép 14 dòng). Nay tra thẳng từ `ROUTE_MAP`; chỉ giữ lại `OFF_ROUTE_PATHS` với đúng 2 mục **không** nằm trong bảng route (`touristDestination` ở gốc site, `category` là trang listing theo thẻ). Hai mục này không phải bản chép — bảng route không hề chứa chúng.
- `cms/lib/entityTypes.ts`: xoá hẳn trường `routeSegment` (11 giá trị + khai báo interface). Kiểm tra cho thấy trường này **chưa từng được dùng ở đâu** — nó là dữ liệu chết đã lệch (`bai-viet` trong khi web dùng `cam-nang`). Xoá đúng hơn là bắc cầu import giữa hai tiến trình, theo P11.

Kết quả: chỉ còn **một** bảng đường dẫn trong toàn dự án, tại `src/lib/routes.ts`.

```yaml
exception_id: EXC-2026-001
dieu_khoan_bi_be: "N7"
pham_vi: "src/lib/serialize/utils.ts, cms/lib/entityTypes.ts"
nguoi_duyet: "Lưu Tuấn Vũ"
cach_tra_no: "utils.ts tra từ ROUTE_MAP; entityTypes.ts xoá trường routeSegment không ai dùng."
dieu_kien_dong: "grep không còn bảng slug thứ hai; tsc sạch; slug bài viết thống nhất."
trang_thai: "closed"
ngay_dong: "2026-07-27"
```

### Còn nợ, phải trả ở gói sau (ghi ra để không thành nợ ẩn — Điều 6.1)

| # | Việc | Quy mô đã đo |
|---|---|---|
| 1 | Mọi nơi đọc tên site từ `brand.name` | **49 chỗ** viết cứng "Nha Trang Travel" (38 trong `src/`, 11 trong `cms/`) |
| 2 | Mọi nơi đọc tên miền từ `site.url` | **25 file** có fallback `\|\| 'https://tourdaovn.vn'` |
| 3 | Trang chủ đọc `primaryDestinationSlug` | 2 chỗ fetch cứng slug `'nha-trang'` |
| 4 | Sửa 3 nơi trong `cms/` còn trỏ `nhatrangtravel.net` | `resolveProductionUrl.ts:1`, `GeoDashboard.tsx:4`, `sanity.config.ts:20-21` |
| 5 | Ẩn 4 nút ngôn ngữ ở Header; sửa `llms.txt` khai sai 4 bản dịch | 2 chỗ lộ ra ngoài |
| 6 | Điền `scripts/gate.config.ts` cho 9 entity đang bật | Cổng chất lượng đang **tắt hoàn toàn** — ưu tiên cao nhất |
| 7 | Gỡ `restaurant`/`specialty`/`event` khỏi `cms/schemas/index.ts` | Biên tập viên vẫn nhập được nội dung không bao giờ hiển thị |
| 8 | `cms/schemas/index.ts` đọc danh sách entity từ config | Studio chạy tiến trình riêng, cần kiểm cách chia sẻ file giữa hai bên |
| 9 | Thay ~120 dòng mô tả "ở Nha Trang", "của Khánh Hòa" trong `uiCopy.ts` | Nhiều công, ít rủi ro — làm cuối |

Kế hoạch thi hành chi tiết: [`docs/prompts/GOI-2-go-hardcode.md`](../prompts/GOI-2-go-hardcode.md).

### Rủi ro

- **Config và bảng địa chỉ vẫn là hai file.** Máy kiểm bắt được lệch, nhưng vẫn phải sửa hai nơi khi thêm một danh mục mới. Chấp nhận: bù lại được tính đọc được (mục Quyết định 5), và máy kiểm khiến lệch không thể im lặng.
- **Tắt một danh mục = mất URL.** Cảnh báo đã ghi ngay trong file config. Cần bổ sung quy trình khai chuyển hướng 301 — chưa có, ghi vào việc cần làm.
- **Giá trị thương hiệu trong config hiện là bản nháp do máy điền** (`Tour Đảo`, `Công ty TNHH Tour Đảo`). Chủ dự án phải xác nhận trước khi gói sau gỡ hardcode. Đây là giả định bề mặt được ghi lại theo P8, không phải quyết định.

### Cách đảo ngược

Xoá `src/site.config.ts`, trả 4 file kia về hằng số cứng như commit `c40774a`. Không có dữ liệu nào bị đổi, không có URL nào đổi trong gói này (9 entity + 4 hub bật giữ nguyên như trước). Chi phí đảo ngược: một lần revert.

---

## Chủ dự án đã chốt (2026-07-27)

1. ✅ **Duyệt** nguyên tắc hai tầng (Quyết định 2).
2. ✅ **Phân quyền**: tầng cấu trúc chỉ chủ dự án; biên tập viên nhập dữ liệu và sửa `siteSettings`, không bật/tắt danh mục, không thêm ngôn ngữ → đã ghi thành Quyết định 6.
3. ✅ **Xoá hẳn** hub Ẩm thực; nội dung ẩm thực viết dưới dạng Article → Quyết định 7.
4. ✅ **Trả nợ N7 ngay**, không gia hạn → EXC-2026-001 đóng cùng ngày.

## Còn chờ chủ dự án

- **Tên hiển thị chính thức** của site và **tên pháp nhân** đầy đủ. Hiện `site.config.ts` để bản nháp `Tour Đảo` / `Công ty TNHH Tour Đảo`. Đây là chốt chặn của gói tiếp theo (gỡ hardcode thương hiệu).
