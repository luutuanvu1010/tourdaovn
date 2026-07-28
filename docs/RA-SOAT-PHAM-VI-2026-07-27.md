# Rà soát phạm vi dự án tourdaovn so với khung Core

Ngày 27/07/2026. Phạm vi rà soát: (1) chỉ tiếng Việt, (2) chỉ vài entity, (3) chrome site,
(4) hardcode, (5) hợp đồng dữ liệu Frontend ↔ Code.

---

## Phần 1 — Câu hỏi lớn: đã có hợp đồng dữ liệu chưa?

**Đã có, và khá bài bản — nhưng đứt ở khúc giữa và một phần đang hỏng.**

Hợp đồng tồn tại ở 5 tầng:

| Tầng | Nơi | Tình trạng |
|---|---|---|
| Luật quy trình | `playbook/PLAYBOOK.md` — chưa có BINDING_MAP thì cấm sang bước thiết kế | Còn hiệu lực |
| Ánh xạ vùng ↔ field | `docs/core-specs/06-BINDING_MAP.md` (295 dòng, 16 loại trang) | Đầy đủ |
| Luật giao diện | `docs/core-specs/DESIGN_PATTERNS.md` (5 luật L0–L4 + 17 pattern), `07-DESIGN_TOKENS.md` | Đầy đủ |
| Hợp đồng kiểu | `src/lib/types.ts` — 14 interface (`TourResult`, `ArticleResult`…) | Đầy đủ |
| Lớp dịch dữ liệu | `src/lib/serialize/` (18 file) | Đầy đủ |
| Máy canh gác | `scripts/validators/entity-layout-post.ts` + `scripts/meta-validators/g1..g4` | **Một phần hỏng** |

Điểm mạnh đáng ghi nhận: **cả 55 component đều khai báo Props có kiểu**, không component nào
nhận dữ liệu tự do. Design token là một nguồn duy nhất (`src/styles/tokens.css`), quét toàn bộ
component **không tìm thấy mã màu viết tay nào** (trừ 1 chỗ `BaseLayout.astro:32`).

### 4 chỗ hở của hợp đồng

**H1 — Cửa vào dữ liệu không kiểm (nghiêm trọng nhất).**
`RouteDispatch.astro:195,269-270` dùng `any`; `sanity.ts:81` `fetchOne` không khai kiểu trả về.
Dữ liệu từ Sanity đi qua một cái cửa "any" rồi mới vào component đã gõ kiểu chặt.
→ *Hợp đồng chặt hai đầu, đứt ở giữa. Máy không thực sự kiểm được dữ liệu có khớp hợp đồng không.*

**H2 — Query và type chỉ đứng cạnh nhau, không buộc vào nhau.**
`src/lib/queries/article.ts:10,97` import type rồi re-export, không dùng làm kiểu trả về.
Sửa truy vấn mà quên sửa `types.ts` thì không ai báo.

**H3 — Máy kiểm binding đang trỏ vào hư không.**
`scripts/meta-validators/g3-binding-map-vs-template.ts:16` đọc thư mục `project/`;
`g1`, `g2` đọc `project/` và `shared/`. **Cả hai thư mục không tồn tại trong repo này.**
→ Lệnh `npm run audit:spec` gần như chắc chắn gãy. Thêm nữa g3 chép tay bảng binding vào code
(dòng 37-40 ghi rõ "Manually extracted") nên nó kiểm bản chép, không kiểm tài liệu gốc.

**H4 — Hợp đồng chỉ phủ 12 trang chi tiết.**
Trang chủ, 4 hub, trang danh sách, trang term không có guard layout.
`EntityIndex.astro:20-35` còn tự chế kiểu `ListingEntity` riêng thay vì dùng type chung
— tức là có **hợp đồng thứ hai chạy song song**.

### Cổng chất lượng đang TẮT

`scripts/gate.config.ts:24-28` — `publishableTypes: []`, `requiredFields: {}`, `references: {}`
đều **rỗng**. Đây là trạng thái mặc định của lõi (lõi chưa có entity). Nhưng site này đã có 9
entity mà chưa điền → validator warn rồi bỏ qua, **mọi nội dung đều lọt cổng**, kể cả bản nháp
chưa duyệt. Đây là vi phạm ADR-0008 (reviewStatus publish gate).

---

## Phần 2 — Phạm vi thực tế so với ý định

### 2.1 Entity — không có công tắc, phải sửa 6-8 chỗ

**Đang bật (9 entity + 4 hub)**, khai ở `src/lib/routes.ts:12-24`:
place, attraction, experience, hotel, resort, tour, article, person, organization
+ hub `kham-pha / luu-tru / di-lai / all`.

**Dormant (còn file, không ra trang): restaurant, specialty, event.** Vẫn sống ở 5 nơi:

- `cms/schemas/index.ts:18-35` — vẫn đăng ký trong Studio. **Biên tập viên vẫn nhập được nội
  dung sẽ không bao giờ hiển thị.**
- `src/lib/queries/index.ts:13-14,22` + `src/lib/serialize/index.ts:27-28,35` — vẫn export.
- `src/lib/sanity.ts:31-34` — `FIELD_LEVEL_TYPES` vẫn hỏi Sanity về 3 type này **mỗi lần build**;
  kết quả bị nuốt im lặng ở `src/pages/[...path].astro:38-39`.
- `RouteDispatch.astro:195-207, 216-217` — vẫn nạp component + query.

**Kết luận:** bật/tắt một entity hiện phải sửa `routes.ts` → `sanity.ts` → `RouteDispatch` (3 bảng)
→ `cms/schemas/index.ts` → `uiCopy.ts` → endpoint AI. Không có nơi duy nhất.

### 2.2 Lỗi cấu trúc: hub Ẩm thực bị chết nửa vời

`hub-am-thuc` có đủ nội dung 5 ngôn ngữ (`uiCopy.ts:966-1092`), có cấu hình query
(`RouteDispatch.astro:233`), có icon và màu (`HomeHubGrid.astro:18,25`) — nhưng **không có
trong ROUTE_MAP** → không có URL, người dùng không vào được. Cần quyết: bật lại hay xóa hẳn.

### 2.3 Bảng slug bị chép làm 3 nơi — đã lệch thật

| Nơi | Vai trò |
|---|---|
| `src/lib/routes.ts` | bản chuẩn — bài viết = `cam-nang` |
| `src/lib/serialize/utils.ts:27-41` | bản chép, dùng cho JSON-LD |
| `cms/lib/entityTypes.ts:67-177` | bản chép phía CMS — bài viết = `bai-viet` ❌ **lệch** |

### 2.4 i18n — đã khóa đúng chỗ, nhưng lộ ra ngoài 2 điểm

Khóa hiệu lực: `sitemap.ts:5` `LANGS = ['vi']`, `astro.config.mjs:10-14` `locales: ['vi']`.
Route `src/pages/[lang]/` trả `langs = []` → build sinh 0 trang. SEO an toàn (hreflang tự trỏ đúng).

Hai điểm khách/máy vẫn thấy:
1. `Header.astro:28-34` vẫn render 5 nút VI/EN/ZH/KO/RU; 4 nút kia xám với tooltip
   "bản dịch đang chuẩn bị". **Khách thật nhìn thấy 4 nút vô nghĩa trên mọi trang.**
2. `src/pages/llms.txt.ts:44` vẫn khai với AI crawler *"translations: en, zh, ko, ru"* — sai sự thật.

Chi phí thật của khung đa ngữ: `uiCopy.ts` dài 1119 dòng với 5 bộ ngôn ngữ; `homepage.ts` tương tự.
**Khoảng 4/5 lượng chữ là chữ chết** — mỗi câu mới phải viết 5 lần.

**Khuyến nghị:** KHÔNG gỡ hẳn. `Record<Lang, ...>` đụng 31 chỗ trong 11 file, gỡ ra là đợt sửa
lớn không thu lại giá trị. Giữ khung, khóa bằng một cờ duy nhất, sửa ngay 2 điểm lộ ra ngoài.

### 2.5 Hardcode — tổng hợp

| Nhóm | Số chỗ | Ổ tập trung |
|---|---|---|
| "Nha Trang" còn sót | **~207** (172 src + 35 cms) | `uiCopy.ts` (120), `SiteHome.astro` (9), 2 trang index (13) |
| Domain/tên site viết cứng | 25 trong src + 3 domain **sai** trong cms | fallback `\|\| 'https://tourdaovn.vn'` rải 25 file |
| Danh sách entity/hub lặp | ~15 bảng trùng nhau | `routes.ts`, `RouteDispatch`, `serialize/utils.ts`, `sanity.ts`, `cms/lib/entityTypes.ts` |
| Chữ Việt cứng trong `.astro` | ~50 chuỗi | `SiteHome.astro` (35) |
| Điện thoại/email/Zalo | **0 vấn đề** ✅ | `siteContact.ts` + `ContactChannels.astro` là hình mẫu chuẩn |
| Màu/khoảng cách cứng | **1** | `BaseLayout.astro:32` |

**8 điểm hiển thị SAI thương hiệu cho người dùng ngay lúc này:**

1. `Header.astro:48` — logo hiện chữ **"Nha Trang Travel"** trên mọi trang
2. `Footer.astro:48,79` — footer + `© 2026 Nha Trang Travel` (năm cũng viết cứng)
3. `BaseLayout.astro:44` — `og:site_name` = "Nha Trang Travel" → tên hiện khi share Facebook/Zalo
4. `SiteHome.astro:34-70` — khối `SITE_COPY` 5 ngôn ngữ, toàn nội dung Nha Trang
5. `index.astro:25-26,38,48` — tiêu đề SEO + JSON-LD trang chủ ghi Nha Trang
6. `index.astro:19` — trang chủ **fetch cứng slug `'nha-trang'`**; đổi điểm đến là trang chủ trắng
7. `cms/lib/resolveProductionUrl.ts:1` — nút "Xem live" trong Sanity dẫn sang `nhatrangtravel.net`
8. `uiCopy.ts:891-1092` — 120 dòng mô tả danh mục kết thúc bằng "ở Nha Trang", "của Khánh Hòa"

---

## Phần 3 — Đề xuất: một công tắc thay vì sửa lặt vặt

### Bước 1 — Tạo `src/site.config.ts` làm nguồn sự thật duy nhất

```ts
export const SITE = {
  brand:    { name: '...', legalName: '...', foundedYear: 2026 },
  url:      'https://tourdaovn.vn',        // gỡ 25 fallback rải rác
  studioHost: 'tourdaovn',
  primaryDestination: 'slug-diem-den',      // gỡ hardcode 'nha-trang'
  langs:    ['vi'] as const,                // một công tắc ngôn ngữ duy nhất
  entities: ['place','attraction','experience','hotel','resort',
             'tour','article','person','organization'] as const,
  hubs:     ['kham-pha','luu-tru','di-lai','all'] as const,
}
```

Rồi để 6 nơi sau **đọc từ đây** thay vì tự khai: `routes.ts`, `sanity.ts` (FIELD_LEVEL_TYPES),
`RouteDispatch.astro` (3 bảng), `sitemap.ts`, `cms/schemas/index.ts`, `Header/Footer/BaseLayout`.

### Bước 2 — Chuyển phần biên tập được sang CMS

`cms/schemas/siteSettings.ts` hiện **chưa có trường tên thương hiệu** → tên site bắt buộc phải
sửa trong code. Nên bổ sung: tên site, mô tả site, điểm đến chính (reference), tên pháp nhân.
Để biên tập viên tự sửa, không cần lập trình viên.

### Bước 3 — Vá 3 chỗ hở hợp đồng

- Gỡ `any` ở `RouteDispatch.astro` — buộc kiểu qua một `EntityResult` union
- Buộc query trả đúng type ở `src/lib/queries/*`
- Sửa hoặc gỡ `meta-validators/g1,g2,g3` đang trỏ `project/`, `shared/` không tồn tại

### Bước 4 — Bật lại cổng chất lượng

Điền `scripts/gate.config.ts` cho 9 entity đang bật. (Mẫu `scripts/examples/gate.config.tourdao.ts:19`
lỗi thời — ghi type `author` trong khi schema thật tên `person`.)

### Bước 5 — Quyết định dứt điểm 3 việc còn treo

1. `hub-am-thuc`: bật lại (thêm vào ROUTE_MAP) hay xóa hẳn?
2. restaurant/specialty/event: gỡ khỏi `cms/schemas/index.ts` để biên tập viên không nhập nhầm?
3. `geoKnowledge.ts` (14KB dữ liệu Nha Trang): thay bằng dữ liệu thật hay để rỗng?

### Thứ tự làm đề xuất

| Ưu tiên | Việc | Lý do |
|---|---|---|
| 🔴 Ngay | 8 điểm sai thương hiệu (Phần 2.5) | Khách đang nhìn thấy "Nha Trang Travel" |
| 🔴 Ngay | Ẩn 4 nút ngôn ngữ ở Header + sửa `llms.txt` | Lộ ra ngoài, dễ sửa |
| 🟠 Tuần này | Bước 1 — `site.config.ts` | Nền cho mọi việc sau |
| 🟠 Tuần này | Bước 4 — bật cổng chất lượng | Đang tắt hoàn toàn, rủi ro publish nháp |
| 🟡 Sau | Bước 2, 3 — CMS + vá hợp đồng | Cần nhưng không chặn |
| 🟢 Cuối | uiCopy 120 dòng + dọn dormant | Nhiều công, ít rủi ro |
