# DRIFT LOG — sổ ghi lệch chuẩn

> Ghi mọi chỗ đặc tả và sản phẩm không khớp nhau, hoặc hai đặc tả không khớp nhau. Ghi để có vết, không phải để hoà giải. Hoà giải là quyết định, và quyết định thì ghi ở `DECISIONS.md`. Căn cứ: `GOVERNANCE` 6.2, `CONSTITUTION` P4.
>
> Nguyên tắc: phát hiện drift thì ghi lại, không âm thầm chọn một bên.

Quy ước mã: `DR-<số>`. Trạng thái: mở, đã xử, hoặc chấp nhận.

---

## DR-001 — Meta-validator đọc thư mục `project/` không tồn tại

**Trạng thái:** đã xử 2026-08-05.

`g1`, `g2`, `g3` khai `resolve(REPO_ROOT, 'project', ...)`. Ở tourdaovn spec sống ở `docs/core-specs/`; `project/` và `shared/` không tồn tại. Hệ quả: `npm run audit:spec` ném `ENOENT` ngay validator đầu, kéo theo `npm run gate` chết. `g3`, bộ kiểm code khớp `06-BINDING_MAP`, chưa từng chạy được trên repo này.

Xử theo QĐ-2026-08-05-02 (g1, g3) và QĐ-2026-08-05-03 (g2, tắt, phiếu nợ ND-001).

---

## DR-002 — Token trong code lệch `07-DESIGN_TOKENS.md`

**Trạng thái:** mở, sẽ tự tiêu khi viết lại bộ token cho tourdaovn.

`07-DESIGN_TOKENS.md` phê chuẩn 2026-06-12 khai khoảng 30 dòng token. `src/styles/tokens.css` có khoảng 90 biến. Ba loại lệch.

### Lệch giá trị, cùng một token

| Token trong spec | Spec đã duyệt | `tokens.css` | Ghi chú |
|---|---|---|---|
| `color.surface` | `#FFFFFF` | `#FBF8F3` | Spec ghi "nền trang mặc định". Code dùng nền kem |
| `color.surface.alt` | `#F8FAFC` | `#F5F1EA` | |
| `font.size.badge` | 12px | `--fs-badge: 0.6875rem` = 11px | Spec nói "badge ngắn, không dùng cho đoạn văn" |
| `font.size.scale` bậc 22 | 17 / **22** / 26 / 32 / 40 / 42 / 46 | `--fs-h5: 1.25rem` = 20px | Chú thích trong code tự ghi "được đẩy lên từ 22px" |
| `shadow.raised` | `0 4px 12px rgba(15,23,42,0.10)` | `0 6px 24px -8px rgba(0,91,150,.15), 0 2px 6px rgba(26,32,44,.05)` | Đổi cả cấu trúc bóng, không chỉ giá trị |
| `motion.fast` | 150ms | 180ms | |
| `motion.base` | 250ms | 300ms | |
| `motion.easing` | `cubic-bezier(0.2, 0, 0, 1)` | `ease` | |

### Token có trong code, không có dòng nào trong spec

Khoảng 40 biến. Nhóm chính:

- **Màu cảnh quan Khánh Hoà:** `--c-sand`, `--c-sand-soft`, `--c-sand-paper`, `--c-sand-border`, `--c-sand-text`, `--c-sand-text-strong`, `--c-coral`, `--c-green`, `--c-green-soft`, `--c-green-text`, `--c-land-rice`, `--c-land-forest`, `--c-land-mist`, `--landscape-page-bg`, `--pattern-rice-lines`, `--pattern-contour-lines`. Spec §1 có nhắc "color.sand gợi cát" trong văn xuôi quy tắc cảnh quan, nhưng không có dòng nào trong bảng token.
- **Nền thẻ và footer:** `--c-card`, `--c-footer-bg`, `--c-footer-text`, `--c-footer-border`, `--c-footer-muted`.
- **Hero fallback:** `--c-hero-fallback-top`, `--c-hero-fallback-bottom`, hai biến `-teal`, `--c-hero-overlay-light`.
- **Bậc chữ thêm:** `--fs-xs`, `--fs-card-title`, `--fs-nav`, `--fs-section`, `--fs-hero`.
- **Token component:** `--underline-width`, `--underline-height`, `--badge-py`, `--badge-px`, `--card-lift`, `--header-h`, `--hero-min-h`, `--hero-min-h-mobile`, `--card-img-h`.
- **Khác:** `--radius-lg`, `--shadow-lg`, `--container-padding`.

### Token có trong spec, không thành biến trong code

- `measure` tối đa 70ch. Code dùng `--container-editorial: 800px` thay thế, không cùng đơn vị.
- `letter-spacing: 0`. Không có biến, để mặc định.
- `space.section` 48 mobile / 96 desktop. Không có biến riêng, dùng lại `--s7` và `--s9`.

### Khớp đúng

12 token màu còn lại, hai font family, năm bậc `--fw-*`, `--fs-base`, `--fs-sm`, `--fs-label`, hai `--lh-*`, toàn bộ thang `--s1..--s9`, `--radius-sm/md/pill`, `--shadow-card`, `--shadow-overlay`, `--container`, cả bốn breakpoint.

---

## DR-003 — Hai đặc tả đã duyệt mâu thuẫn nhau về màu nền

**Trạng thái:** mở, cần chủ dự án hoà giải.

- `07-DESIGN_TOKENS.md` §1: `color.surface = #FFFFFF`, "nền trang mặc định".
- `08-QA_CHECKLIST.md` dòng 71: "`body` background = `--c-surface` (#FBF8F3)"; dòng 73: "Không có vùng nào dùng nền trắng thuần cho body".

Đây là xung đột cùng tầng, không phải code lệch spec. Cả hai đều là core spec đã phê chuẩn. Không tác nhân nào được hoà giải bằng suy đoán, theo `GOVERNANCE` 3.5.

Kèm theo: `08-QA_CHECKLIST` §B hardcode màu và font của nhatrangtravel (`#C2410C`, `#F5A623`, `#E8654E`, `#FBF8F3`, "Be Vietnam Pro", "Plus Jakarta Sans") cùng các class cụ thể. Nếu không viết lại §B khi đổi bộ token, QA sẽ chấm bài bằng đáp án của dự án khác.

---

## DR-004 — `05-URL_MAP` mô tả một site khác

**Trạng thái:** mở, xử ở pha C.

- Canonical host khai `https://nhatrangtravel.net`. Site chạy `tourdao.vn`.
- Bảng prefix §1.2 còn `am-thuc`, `nha-hang`, `dac-san`, `su-kien`. Bốn nhánh này đã tắt trong `src/site.config.ts`.
- Thiếu `tat-ca` (hub-all), là hub thứ tư đang thật sự chạy.
- Năm cột ngôn ngữ trong khi `langs = ['vi']`.

Ở chỗ này code đúng hơn spec: `ROUTE_TABLE` trong `src/lib/routes.ts` phản ánh đúng phạm vi hiện tại.

---

## DR-005 — `06-BINDING_MAP` khai loại trang không tồn tại và thiếu loại trang đang chạy

**Trạng thái:** mở, xử ở pha E.

- §5.3 tên là "Bốn hub" và liệt `/am-thuc/`. Hub thứ tư thật là `/tat-ca/`, không có dòng nào trong file.
- §4.5 Restaurant, §4.6 Specialty, §4.9 Event, §5.5 index sự kiện: mô tả bốn loại trang thuộc entity đang tắt.
- Không có bảng riêng cho trang chủ `/`. Trang chủ hiện là loại trang riêng với component `SiteHome`.
- `/lo-trinh-don-khach/` không có bảng ánh xạ.
- §7 tuyên bố "mọi loại trang trong cây URL của 05 đều có bảng ánh xạ, 16 mẫu URL". Câu này hiện sai, vừa thừa vừa thiếu.

---

## DR-006 — `00-PROJECT_BRIEF` là của nhatrangtravel, và sai đã rò xuống code

**Trạng thái:** mở, xử ở pha A.

Brief tự khai "gần như toàn bộ nội dung là của nhatrangtravel, cần viết lại khi dựng site khác". Nhưng sai này không dừng ở tài liệu, nó đang hiển thị cho người dùng:

- `src/components/SiteHome.astro:36` — "Cổng thông tin du lịch Nha Trang…"
- `src/pages/index.astro:37` — cùng chuỗi, trong meta description
- `src/lib/homepage.ts:59` — "Tổng quan về Nha Trang"

Trong khi `src/site.config.ts` khai `brand.legalName = 'Công ty TNHH Tour Đảo'`. Site đang tự giới thiệu sai bản chất doanh nghiệp.

---

## DR-007 — Menu điều hướng hardcode, lệch hợp đồng đã duyệt

**Trạng thái:** mở, xử ở pha E và G.

`06-BINDING_MAP` §2 khai "Header điều hướng | config (build)". Code hardcode ở ba chỗ:

- `src/components/Header.astro:24` — `['hub-kham-pha','hub-luu-tru','hub-di-lai']`
- `src/components/Footer.astro:32-33` — `['attraction','experience','tour']` và `['hotel','resort']`
- `src/lib/homepage.ts` — `quickLinks` lặp lại năm lần, mỗi ngôn ngữ một lần

Bản đối chứng cách làm đúng đã có trong repo: `src/components/HomeHubGrid.astro:5` đọc `navHubs` từ `site.config.ts`.

`01-CONTENT_MODEL.md` dòng 567 đã tự ghi nhận đây là phiếu nợ chưa xử, vi phạm quy tắc một nguồn sự thật R3.

---

## DR-008 — `DESIGN.md` được hai file luật trích dẫn nhưng không tồn tại

**Trạng thái:** mở, xử ở pha F.

`GOVERNANCE` 4.3 (điều kiện vào QA1) và 4.4 (điều kiện ra QA2 mục 5) đều đòi `DESIGN.md`. File không tồn tại trong repo. `docs/core-specs/README.md` giải thích vì sao: "để lại, quá riêng, bản sắc Nha Trang".

Bốn tham chiếu chết: `DESIGN_PATTERNS.md` dòng 10, 20, 49 và `src/styles/tokens.css` dòng 2, đều dẫn `project/DESIGN.md`.

Thêm một lệch tên ở tầng luật: `PLAYBOOK` Phần 1 gọi artifact bước 7 là `DESIGN_TOKENS + mockup`, `GOVERNANCE` gọi là `DESIGN.md`. Hai tên cho một thứ.

---

## DR-012 — `r3-r4-post` hardcode 5 ngôn ngữ

**Trạng thái:** đã xử 2026-08-05, xem QĐ-2026-08-05-05.

Validator khai `const LANGS = ['vi','en','zh','ko','ru']` ngay cạnh dòng đã nhập `site` từ `src/site.config`. Site chạy `langs = ['vi']`. Hệ quả: R4 luôn fail 8 lỗi, đòi bốn sitemap con không tồn tại và không nên tồn tại.

Lỗi này bị che suốt vì `jsonld-post` chết trước trong chuỗi `&&`.

---

## DR-013 — Chuỗi `validate:post` che lỗi phía sau

**Trạng thái:** chấp nhận, đây là thiết kế fail-closed.

`validate:post` nối bảy validator bằng `&&`. Validator đầu fail thì sáu cái sau không chạy. Trong đợt pha 0 ngày 2026-08-05, mỗi lần sửa một lỗi lại lộ ra một lỗi mới chưa ai từng thấy, theo thứ tự: I6 → R4 → S24-AUTHORITY → robots.txt → hai gate registry.

Ghi lại vì đây là bài học vận hành: "validate:post đỏ" trước nay chỉ có nghĩa là "validator đầu tiên đỏ", không có nghĩa là chỉ có một lỗi. Số lỗi thật chỉ biết được sau khi sửa hết lần lượt.

Kết quả sau pha 0: `jsonld-post`, `r3-r4-post`, `geo-knowledge-post`, `entity-layout-post` xanh. Còn `governance-post` (ND-002) và hai gate registry (ND-003).

---

## DR-014 — `entity-layout-post` xanh, hợp đồng layout còn nguyên

**Trạng thái:** ghi nhận, không phải drift.

Ghi lại vì có ý nghĩa cho đợt thiết kế lại: validator khoá hợp đồng layout chung báo `13 detail rules, 0 legacy exceptions declared` và `InfoBar contract: 8 with, 3 without`. Đây là validator sẽ đau nhất khi đổi bố cục, và nó đang lành. Mốc để so sau khi thiết kế lại.

---

## DR-009 — `I6` đang đỏ trước khi đợt thiết kế lại bắt đầu

**Trạng thái:** đã xử 2026-08-05, xem QĐ-2026-08-05-04.

Cập nhật: khi chạy lại trên bản build mới, lỗi là **hai** trang chứ không phải một. Nguyên nhân không phải dữ liệu mà là validator: danh sách @type hợp lệ cho `organization` chỉ có `Organization`, thiếu `TravelAgency`, trong khi cả hai spec và serializer đều khai `TravelAgency` là hợp lệ theo `orgType`.

`scripts/reports/postbuild-status.json`, chạy 2026-08-04T08:34:10Z:

```
I6 fail: cong-ty/cong-ty-tnhh-tour-dao/index.html: thiếu top-level schema chính Organization
```

`GOVERNANCE` 4.4 điều kiện ra QA2 mục 1 là "JSON-LD validator 100% xanh". Nếu không xử trước, đợt thiết kế lại bị chặn ở cổng cuối vì một lỗi không do nó gây ra.

---

## DR-015 — `shared/gates` mất tích, kéo sập cả bộ kiểm ràng buộc

**Trạng thái:** mở, phiếu nợ ND-005. Đây là drift nặng nhất phát hiện trong pha 0.

`scripts/validators/i1-i19.ts` dòng 10 nhập `../../shared/gates/index.js`. Thư mục `shared/` không tồn tại. `validate-constraints.ts` dòng 8 nhập `i1-i19.js`, nên `npm --prefix scripts run validate` chết bằng `ERR_MODULE_NOT_FOUND` trước khi kiểm được gì.

Hệ quả: 27 trên 31 control không có kiểm máy. Chỉ I6, PY8, R3, R4 còn sống, cả bốn đều ở tầng post-build.

Đây cũng là nguyên nhân gốc của DR-001 mục `g2`: cùng một module mất tích.

Ghi nhận thêm một giới hạn của công cụ: `control-registry-gate` vẫn báo `Registry coherent` vì nó chỉ kiểm bản đồ có mạch lạc không, tức executor có tồn tại và có nằm trong pipeline đã khai. Nó không kiểm pipeline có khởi động nổi không. Một sổ đăng ký khai toàn `live` vẫn qua được cổng dù không control nào chạy. Đó là lý do 27 dòng phải khai `gap` bằng tay sau khi chạy thử thật.

---

## DR-016 — Sổ đăng ký suýt nói dối, và cách bắt được

**Trạng thái:** đã xử 2026-08-05, ghi lại làm bài học.

Bản `control-registry.yaml` đầu tiên khai cả 31 control là `live`, vì đã kiểm được ba điều: id có trong `04-CONSTRAINTS`, hàm validator tồn tại thật trong module, và module nằm trong pipeline. Cả ba đều đúng, và kết luận vẫn sai — vì không ai chạy thử pipeline.

Chạy thử `npm --prefix scripts run validate` mới lộ DR-015. Sổ được sửa lại thành 4 `live` và 27 `gap`.

Bài học ghi vào đây để lần sau khỏi lặp: với một artifact khai "cái này đang được thi hành", đọc mã là chưa đủ. Phải chạy.

---

## DR-010 — `gen-component-inventory.mjs` ghi ra thư mục không tồn tại

**Trạng thái:** đã xử 2026-08-05. Đổi đường ra sang `docs/design-context/`, gỡ tham chiếu spec chết. Chạy lần đầu thành công: 54 component, 886 dòng. Giữ script chứ không xoá vì bản kiểm kê là một đầu vào bắt buộc của prompt giao cho Claude Design ở pha F.

Script ghi output vào `project/design-context/COMPONENT_INVENTORY.md`. Thư mục `project/` không tồn tại và không nằm trong `.gitignore`. Không tìm thấy file output nào trong repo, nên script chưa từng chạy ở đây. Chú thích đầu script còn dẫn `docs/superpowers/specs/2026-07-13-design-context-pack-design.md`, cũng không tồn tại.

Có npm script `gen:design-context` trỏ tới nó.

---

## DR-011 — `g3` báo `organization` truy cập field không có trong binding map

**Trạng thái:** mở, phát hiện mới ngày 2026-08-05.

Lần đầu chạy được `g3` sau khi sửa DR-001, nó báo:

```
[WARN] Template truy cập data.sameAs nhưng field này không có trong BINDING_MAP cho organization — dữ liệu không được đặc tả
```

Đây đúng là loại drift mà `g3` sinh ra để bắt, và nó nằm im suốt thời gian validator không chạy được. Baseline đầy đủ: 0 dòng fail, 91 dòng cảnh báo, lưu ở `docs/evidence/2026-08-05-baseline/`.

Ghi chú: cùng field `sameAs` đã làm gãy build ngày 2026-08-05 ở một chỗ khác (`HomeMetaBar` nhận `null`, xem commit `278b287`). Hai việc khác nhau, nhưng cùng cho thấy `sameAs` là chỗ đặc tả và code chưa gặp nhau.
