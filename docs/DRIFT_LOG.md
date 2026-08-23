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

**Trạng thái:** **đã xử 2026-08-06** ở pha B, xem `QĐ-2026-08-06-03`. Chép `shared/gates` từ nhatrangtravel, gỡ bảng `gateFields` trùng (chuyển sang đọc `gate.config.ts`), gỡ `checkI15`. `validate` chạy được lần đầu: 24/31 pass. Hai lỗi còn lại là dữ liệu, không phải code.

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

---

## DR-017 — Sổ đăng ký viết `postbuild`, cổng đọc `post-build`

**Trạng thái:** đã xử 2026-08-05 sau `/code-review`. Sửa 33 dòng `stage:` trong sổ, và đóng từ vựng `stage` ở `control-registry-gate.ts`.

`docs/governance/control-registry.yaml` khai `stage: postbuild` (và `prebuild`); cả hai cổng tiêu thụ so với chuỗi có gạch nối. Hệ quả hai chiều:

- `control-registry-gate.ts:189` lọc `control.stage !== 'post-build'` rồi `continue`, nên vòng đối chiếu với `postbuild-status.json` bỏ qua cả 31 control. Cổng in `[pass] Registry coherent` kể cả khi I6 đang `fail` trong báo cáo. Đã dựng lại đúng cảnh này để xác nhận: đổi I6 thành `fail`, cổng cũ vẫn xanh, cổng đã sửa đỏ với `I6: post-build report tồn tại nhưng chưa pass`.
- `deferred-gate.ts:88` là mặt trái: một control khai đúng `live` post-build vẫn bị đẩy vào lỗi `deferred nhưng registry không khai live post-build executor`, tức chặn nhầm một build hợp lệ.

Cách viết có gạch nối là bên đúng: `ADR-0018`, chú thích trong các validator, và cả hai cổng đều dùng nó. Sổ là bên mới soạn nên sổ đổi.

Phần chống tái phát: chỉ đổi chính tả thì cái bẫy còn nguyên — một lần gõ sai nữa lại cho ra cổng xanh giả. Nên `control-registry-gate` bây giờ có `VALID_STAGES` và bắt cả `stage` của control lẫn của pipeline. Kiểm chứng: gõ lại `postbuild` vào một dòng, cổng đỏ ngay với `stage không hợp lệ`.

Đây là cùng một họ với DR-016. Lần trước sổ khai `live` cho control không chạy được; lần này sổ khai đúng nhưng cổng không đọc nổi. Cả hai đều cho ra một dòng `[pass]` không có gì đứng sau. `CLAUDE.md` §6 nói cổng không bằng chứng thì mặc định là không đạt — một cổng in `pass` cho phép kiểm mà nó không thực hiện được là vi phạm điều đó, không phải chuyện nhỏ về chính tả.

---

## DR-018 — `jsonld-post` không biết `NewsArticle`

**Trạng thái:** đã xử 2026-08-05 sau `/code-review`. `DETAIL_ENTITY_TYPES.article` thành `['Article', 'NewsArticle']`.

`src/lib/serialize/article.ts:16` map `articleType: news → NewsArticle`, và `05-URL_MAP` dòng 120 khai đúng như vậy. Nhưng `DETAIL_ENTITY_TYPES.article` trong `scripts/validators/jsonld-post.ts` chỉ liệt kê `Article`, nên mọi bài `news` sẽ bị I6 báo `thiếu top-level schema chính Article`.

Chưa có bài `news` nào trong dataset nên lỗi chưa nổ. Kiểm chứng bằng trang giả: chép một trang `/cam-nang/` có sẵn, đổi `@type` gốc thành `NewsArticle`, chạy `jsonld-post`. Danh sách cũ cho ra đúng dòng lỗi trên; danh sách mới không còn dòng nào thuộc loại đó. Đã xoá trang giả sau khi kiểm.

Hai ghi chú:

- Đây là cùng một lỗi vừa được vá cho `organization` ở commit `10d4ac8` (thiếu `TravelAgency`). Bảng `DETAIL_ENTITY_TYPES` là bản chép tay của các `*_TYPE_MAP` bên `src/lib/serialize/`, và chép tay thì lệch. Đã rà cả năm bảng còn lại: `attraction` an toàn nhờ serializer luôn phát kèm `TouristAttraction` và cổng chỉ đòi khớp một loại; `place` và `event` khớp đủ. Nhưng cơ chế thì vẫn là chép tay — nếu muốn hết hẳn họ lỗi này, `DETAIL_ENTITY_TYPES` phải sinh từ chính các `*_TYPE_MAP` chứ không chép. Chưa làm, ngoài phạm vi đợt vá này.
- Vì `validate:post` nối bằng `&&` (DR-013), một bài `news` đủ để chặn toàn bộ sáu validator sau nó.

---

## DR-019 — Chuỗi `&&` làm cổng sau không bao giờ chạy

**Trạng thái:** đã xử 2026-08-05 sau `/code-review`, theo QĐ-2026-08-05-11.

`npm run gate` là `astro check && validate:post && audit:spec`. `deferred-gate` đứng cuối `validate:post` và luôn thoát 1 vì thiếu `validator-status.json` (ND-005). Hệ quả: `audit:spec` chưa từng chạy trong cổng, tức `g1`/`g3` vừa được sửa ở pha 0 không được cổng gọi tới lần nào. Lời trong commit `ae8db92` — "hạ tầng kiểm chứng từ chết thành chạy được" — đúng với việc gọi tay từng file, không đúng với `npm run gate`.

Chuỗi `audit:spec` có cùng hình dạng: `g1` thoát 1 khi có drift mức `fail` thì `g3`/`g4` không chạy, mà `scripts/reports/g3-*.json` và `g4-*.json` vẫn giữ nội dung cũ nói "pass". Đây đúng là điều DR-001 mô tả cho `g2`, chỉ khác chỗ.

Đã thay bằng `scripts/run-gates.mjs`. Phần chưa xử: `deferred-gate` vẫn đỏ, và sẽ còn đỏ tới khi ND-005 trả xong. Khác biệt là bây giờ nó đỏ một mình chứ không kéo theo chín cái kia.

---

## DR-020 — `check:cwd` chưa từng xanh, nên `build:strict` chưa từng chạy

**Trạng thái:** đã xử 2026-08-05. Phát hiện ngoài danh sách của `/code-review`, lộ ra vì chạy thử cổng.

`scripts/check-no-process-cwd.sh` cấm `process.cwd()` trong `scripts/`. `scripts/validate-min.ts:100` dùng đúng thứ bị cấm: `join(process.cwd(), '..', 'dist')`. Dòng này có từ commit fork `d7bac08`, tức cổng này đỏ suốt đời repo.

Hệ quả nặng hơn vẻ ngoài: `build:strict` mở đầu bằng `npm run check:cwd`, nối bằng `&&`. Nên `build:strict` — chuỗi fail-closed mà `ADR-0018` mô tả là đường phát hành nghiêm ngặt — chưa từng đi qua nổi dòng đầu tiên. Không ai phát hiện vì `ADR-0022` đã chuyển đường phát hành thật sang `build:ci` = `npm run build`.

Đã sửa: xác định `dist/` từ `import.meta.url`. Kiểm chứng: `npm run check:cwd` xanh lần đầu; `validate:jsonld` vẫn PASS khi gọi qua `npm --prefix scripts`, và cũng PASS khi gọi thẳng từ repo root — bản cũ ở CWD đó sẽ đi tìm `dist/` ở thư mục cha của repo.

Ghi lại vì đây là bài học thứ ba cùng loại với DR-015 và DR-016: một cổng tồn tại trong `package.json` không có nghĩa là nó từng chạy. Muốn biết thì phải gọi nó.

---

## DR-021 — Cổng in `[pass]` cho phép kiểm nó không chạy được

**Trạng thái:** đã xử 2026-08-05 sau `/code-review`.

`control-registry-gate` có một vòng đối chiếu registry với `CONTROL_GATES.md`. File đó không tồn tại ở `docs/governance/`, nên `documentedLiveIds()` trả tập rỗng, vòng lặp chạy 0 lần, và cổng vẫn in `[pass] Registry coherent: 31 controls`. Khoản nợ đã có phiếu ND-004; cái chưa xử là **cổng không nói ra**.

Vì sao không phải chuyện nhỏ: `CLAUDE.md` §6 nói mặc định của cổng là không đạt nếu không có bằng chứng. Một dòng `[pass]` trơn có thể bị trích làm bằng chứng QA2 cho một bất biến mà cổng chưa từng kiểm. Bản thân sổ đăng ký cũng ghi giới hạn này ở DR-015, nhưng ghi trong tài liệu thì người đọc output không thấy.

Đã sửa: cổng gom danh sách phép kiểm bị bỏ, in từng dòng `[skip]` kèm lý do, và dòng kết thúc nói rõ có bao nhiêu phép kiểm không chạy được. `[pass]` bây giờ có phạm vi.

Tác dụng phụ đáng kể: ngay lần chạy đầu sau khi sửa, cổng tự phơi ra DR-022 bằng dòng `[skip] đối chiếu post-build cho R3, R4`. Không ai phải đi tìm.

---

## DR-022 — `R3`/`R4` khai `live` bằng bằng chứng không tồn tại

**Trạng thái:** đã xử 2026-08-05 sau `/code-review`.

`control-registry.yaml` khai R3/R4 `status: live`, `evidence: scripts/reports/postbuild-status.json mục R3/R4`. Nhưng `r3-r4-post.ts` không ghi file báo cáo nào — chỉ `jsonld-post.ts` ghi, và nó chỉ ghi I6, PY8, SEO. Bằng chứng được trích dẫn không bao giờ tồn tại.

Vòng đối chiếu trong cổng thì có dòng `if (!postStatus.has(control.id)) continue`, nên hai control này bị bỏ qua lặng lẽ: R3 hay R4 đỏ cũng không ai biết qua cổng.

Đã sửa hai lớp:

- `r3-r4-post.ts` ghi kết quả vào `postbuild-status.json`, kiểu chèn-đè theo `id` chứ không ghi đè cả file — vì `jsonld-post.ts` ghi cùng file và chạy trước trong chuỗi. Báo cáo bây giờ có đủ năm mục: I6, PY8, SEO, R3, R4. Kiểm chứng: đặt R3 thành `fail`, cổng đỏ đúng dòng `R3: post-build report tồn tại nhưng chưa pass`.
- Cổng kiểm luôn `evidence` của mọi control `live`: nếu chuỗi đó trỏ vào một đường dẫn không tồn tại thì đỏ. Trước đây `evidence` chỉ bị kiểm "không rỗng". Kiểm chứng: giấu `postbuild-status.json` đi, cổng đỏ bốn dòng cho I6, PY8, R3, R4.

Còn 27 control `gap` khai `evidence: scripts/reports/validator-status.json mục ...`, một file không tồn tại và sẽ không tồn tại tới khi ND-005 trả xong. Đã đổi thành `"chưa có — sẽ là ... khi ND-005 trả xong"` để câu chữ nói đúng thì hiện tại.

---

## DR-023 — Bất biến `g2` không có ai kiểm, và không ai nói ra

**Trạng thái:** đã xử phần "nói ra" 2026-08-05. Bản thân khoảng trống vẫn mở, nợ ND-001.

`g2` bị gỡ khỏi `audit:spec` theo QĐ-2026-08-05-03. Không validator nào khác so field bắt buộc trong `01-CONTENT_MODEL.md` §2 với bảng enforcement trong `scripts/gate.config.ts`: `g1` chỉ so content model với `cms/schemas`, `g4` không có đường thoát 1 nào. Nên một field khai bắt buộc trong content model mà vắng trong enforcement sẽ trôi qua mọi cổng.

Khoảng trống này là quyết định đã chốt, không phải lỗi. Lỗi là `audit:spec` chạy xong in ba dòng `[pass]` rồi im, khiến người đọc output tin rằng bất biến kia đang được canh.

Đã sửa: `run-gates.mjs` mang một danh sách `gaps` cho mỗi nhóm, in dòng `[gap]` sau bảng tổng kết, và dòng kết thúc nói rõ có bao nhiêu bất biến không ai kiểm. Cùng kỷ luật với các dòng `[skip]` ở DR-021.

Cũng đã sửa đường dẫn spec trong `g2-content-model-vs-gatefields.ts` (`project/01-CONTENT_MODEL.md` → `docs/core-specs/`) dù file đang tắt, để lúc trả nợ ND-001 không phải dò lại đúng cái lỗi đã biết. Đường dẫn `shared/gates/index.ts` thì để nguyên, kèm chú thích: chọn giữa khôi phục `shared/gates` hay trỏ về `gate.config.ts` chính là nội dung của ND-001, không tự quyết ở trong file.

---

## DR-024 — Hai validator nữa còn hardcode 5 ngôn ngữ

**Trạng thái:** đã xử 2026-08-05 sau `/code-review`.

DR-012 vá `r3-r4-post.ts` cho đọc `langs` từ `site.config`, và QĐ-2026-08-05-05 ghi bất biến này là đã khôi phục. Nhưng cùng dòng hardcode còn ở hai chỗ khác:

- `scripts/validators/r1-r4.ts:16` — nuôi `validateS25FiveLanguageCoverage`, đăng ký mức `fail`. Trên site vi-only, mỗi document field-level-i18n thiếu title/slug/summary cho bốn ngôn ngữ tắt, tức 15 lỗi mỗi doc, cộng 4 lỗi mỗi `translationGroup` của Article. Chưa nổ vì chuỗi pre-build đang chết theo ND-005; sẽ nổ hàng loạt ngay khi ND-005 trả xong.
- `scripts/validators/geo-knowledge-post.ts:15` — file này đã `import { site }` sẵn mà vẫn đếm theo 5. Hệ quả nhẹ hơn nhưng vẫn sai: `urlsByLanguage` báo bốn ngôn ngữ với số 0, và `missingLanguages` đếm theo mẫu số 5.

Đã sửa cả hai theo đúng khuôn của `r3-r4-post.ts`: giữ `ALL_LANGS` làm tập khả dĩ để dựng kiểu, lọc ra `LANGS` theo `langs` trong `site.config` (ADR-0021). Kiểm chứng: `geo-knowledge-status.json` đổi từ năm khoá ngôn ngữ xuống còn `{"vi": 8}`; `r1-r4.ts` biên dịch sạch, không chạy được là vì ND-005 chứ không phải vì bản vá.

Bài học: QĐ-2026-08-05-05 khai một bất biến đã khôi phục trong khi mới vá một trong ba nơi. Khi vá loại lỗi "hardcode thứ đã có nguồn sự thật", phải grep hết mọi nơi khai lại giá trị đó rồi mới ghi vào sổ quyết định.

---

## DR-025 — Bản kiểm kê component mang nhầm thương hiệu

**Trạng thái:** đã xử 2026-08-05 sau `/code-review`.

`scripts/gen-component-inventory.mjs:216` hardcode `'# Danh mục component — Nha Trang Travel'`, nên file vừa commit ở `docs/design-context/COMPONENT_INVENTORY.md` mở đầu bằng tên công ty khác. `ADR-0021` QĐ8 nói thẳng: `site.config.ts` là nơi duy nhất khai tên site, không nơi nào trong code được viết lại. DR-006 vốn đã là drift mở về đúng chuyện rò tên nhatrangtravel ra sản phẩm.

Nặng hơn vẻ ngoài vì DR-010 chỉ định file này là đầu vào bắt buộc của prompt giao cho Claude Design ở pha F — dòng ngữ cảnh đầu tiên mà tác nhân thiết kế đọc sẽ khai sai tên khách hàng.

Đã sửa: script `import { brand } from '../src/site.config.ts'`, tiêu đề lấy `brand.name`. Vì nay nhập file `.ts`, npm script `gen:design-context` chạy qua tsx. Sinh lại: tiêu đề thành `# Danh mục component — Tour Đảo`, và diff toàn file đúng một dòng — cũng là bằng chứng script sinh ra kết quả ổn định.

---

## DR-026 — Thông báo lỗi chỉ sang thư mục không tồn tại

**Trạng thái:** đã xử 2026-08-05 sau `/code-review`.

Commit `ae8db92` đổi đường đọc sổ đăng ký sang `docs/governance/` nhưng để nguyên câu báo lỗi cũ: `control-registry-gate.ts:52` và `deferred-gate.ts:35` vẫn nói `thiếu project/governance/control-registry.yaml`. Ai gặp lỗi sẽ đi tạo file ở một thư mục mà repo này không có, rồi cổng vẫn đỏ.

Đã sửa: `control-registry-gate` dựng câu báo từ chính `REGISTRY_PATH` nên không thể lệch lần nữa; `deferred-gate` sửa chuỗi. Kiểm chứng bằng cách giấu sổ đăng ký đi: thông báo ra đúng `thiếu docs/governance/control-registry.yaml`.

Hai chú thích còn nhắc `project/governance/` thì giữ, vì chúng đang giải thích chính lịch sử này.

---

## DR-027 — `g3` chưa từng đọc `06-BINDING_MAP.md`

**Trạng thái:** mở, phát hiện 2026-08-05 khi mở pha E.

`g3-binding-map-vs-template.ts` là bộ kiểm máy duy nhất cho hợp đồng "code có khớp bản ánh xạ không". Nó khai `BINDING_MAP_PATH` ở dòng 17 — và **không dùng biến đó ở bất kỳ đâu**. `readFileSync` duy nhất trong file là để đọc template `.astro` (dòng 162).

Thứ nó đối chiếu là một **bản chép tay** nằm trong chính mã validator, dòng 37–38 ghi rõ: *"BINDING_MAP data sources per entity — Manually extracted from BINDING_MAP §3 (common frame) + §4 (deltas)"*.

Hệ quả, xếp theo độ nặng:

1. `06-BINDING_MAP.md` và `g3` là **hai nguồn sự thật song song cho cùng một thứ** — vi phạm N7 và P6.
2. Sửa bản ánh xạ không làm đổi bất kỳ điều gì máy kiểm. Pha E nếu chỉ sửa markdown thì cổng vẫn kiểm bảng cũ.
3. Cổng cứng "chưa duyệt `06-BINDING_MAP` thì cấm vào bước 7" mất phần lớn hiệu lực máy: nó dựa vào một bộ kiểm không đọc tài liệu mà nó mang tên.
4. Biến `BINDING_MAP_PATH` không dùng khiến người đọc mã tin rằng validator có đọc file.

**Cùng họ với DR-016, DR-020, DR-021, DR-022** — một cổng tồn tại và trông như đang kiểm, nhưng kiểm thứ khác với thứ nó tuyên bố. Đây là lần thứ năm cùng một hình dạng.

**Ghi chú đo được.** `g1-content-model-vs-schema.ts` có cùng khuôn: nó cũng chép cứng bảng field thay vì đọc `01-CONTENT_MODEL.md`. Đã lộ ra ngày 2026-08-05 khi thêm field `support` — sửa CONTENT_MODEL xong g1 vẫn đỏ cho tới khi sửa tay cả bản chép trong validator.

**Điều kiện xử.** Cần chủ dự án quyết cơ chế: (a) chấp nhận hai bản, sửa tay cả hai mỗi lần — rẻ ngay, bảo đảm lệch về sau; (b) cho `g3` đọc thẳng bảng trong markdown, dùng dấu backtick quanh tên field làm tín hiệu máy đọc được, bản ánh xạ thành nguồn duy nhất; (c) tách dữ liệu ánh xạ ra một file cấu trúc mà cả tài liệu lẫn validator cùng đọc.

---

## DR-028 — `LodgingDetail` đọc field không tồn tại, che bằng `as any`

**Trạng thái:** mở, phát hiện 2026-08-05 bởi chính `g3` sau khi nó bắt đầu đọc bản ánh xạ thật.

`src/components/LodgingDetail.astro:49`:

```
const priceView = resolvePrice(data.bookingRef?.key, entityType, (data as any).isAccessibleForFree, prices, lang)
```

`HotelResult` và `ResortResult` trong `src/lib/types.ts` **không khai** `isAccessibleForFree`, và `01-CONTENT_MODEL` §2.6, §2.7 cũng không có field đó cho lưu trú. Ép `as any` làm trình biên dịch im, nên `astro check` xanh trong khi template đọc một field không tồn tại.

Không vỡ lúc chạy: giá trị là `undefined` và `resolvePrice` chịu được. Nhưng đây đúng hình dạng mà gói "build đừng vỡ vì dữ liệu thiếu" (`114010a`) đi xử — kiểu nói dối, chỉ khác là lần này nói dối bằng `as any` thay vì bằng `?:`.

**Vì sao lâu nay không ai thấy.** `g3` trước đây đối chiếu một bản chép tay và không đọc `06-BINDING_MAP.md` (DR-027), nên vùng này không nằm trong tầm kiểm. Bắt được ngay trong lần đầu `g3` đọc tài liệu thật.

**Điều kiện xử.** Cần quyết ở tầng nội dung: lưu trú có khái niệm "miễn phí" không. Nếu không thì bỏ tham số đó khỏi lời gọi; nếu có thì thêm field vào `01-CONTENT_MODEL` §2.0b theo thủ tục §2.2. Không thuộc phạm vi pha E.

---

## DR-029 — Site chưa bao giờ hiện đúng font đã duyệt

**Trạng thái:** **đã xử 2026-08-06.** Chủ dự án chốt **tự host**. Tải 10 file `.woff2` (2 subset `latin` + `vietnamese`, đúng 5 cấp đậm mà `@font-face` khai) vào `public/fonts/`, tổng ~140 KB. Kiểm chữ ký `wOF2` cả 10 file; `dist/` nay có đủ 10. Giấy phép OFL 1.1, ghi ở `public/fonts/README.md`. Nguyên văn phần dưới giữ lại làm bản ghi lịch sử.

**Trạng thái cũ:** mở. Phát hiện 2026-08-06 khi Claude Design dựng mockup pha F; Cowork đã kiểm chứng lại.

`src/layouts/BaseLayout.astro` khai **10 khối `@font-face`** trỏ `/fonts/*.woff2`. Nhưng:

- thư mục `public/fonts/` **không tồn tại**
- bản build ra `dist/` có **0 file `.woff2`**

Nên trình duyệt không tải được font nào và rơi thẳng về `system-ui`. `07-DESIGN_TOKENS` §2 khai `font.family.heading` là "Be Vietnam Pro" và `font.family.body` là "Plus Jakarta Sans" — **site chưa từng hiện bằng hai font đó**.

Không ai thấy vì `@font-face` hỏng không gây lỗi build, không gây lỗi console đáng chú ý, và bản dự phòng `system-ui` trông vẫn chấp nhận được.

**Hệ quả lên pha F:** mọi mockup và mọi ảnh chụp màn hình từ trước tới nay đều đang hiện bằng font hệ thống, không phải font trong spec. Duyệt thẩm mỹ trên bản đó là duyệt một thứ khác với thứ spec mô tả.

**Điều kiện xử.** Chủ dự án chọn một: (a) đưa file `.woff2` vào `public/fonts/` — cần cân nhắc giấy phép và dung lượng, và ảnh hưởng ngưỡng Lighthouse ở `04-CONSTRAINTS` §3; (b) chính thức nhận `system-ui` là font của site và sửa `07-DESIGN_TOKENS` §2 cho khớp sự thật. Không thuộc phạm vi pha F.

---

## DR-030 — Trang lưu trú rỗng vẫn được sinh, trái quyết định nền 4

**Trạng thái:** mở. Phát hiện 2026-08-06 cùng đợt với DR-029.

`06-BINDING_MAP` quyết định nền 4 khai: *"Index nhánh có 0 entity publish không sinh trang; header gỡ link nhánh đó cho tới khi có entity đầu tiên."*

Thực tế `/khach-san/`, `/resort/` và `/luu-tru/` đều có **0 document** nhưng vẫn được sinh, vẫn nằm trong sitemap, và vẫn hiện khối "chưa có nội dung".

Đây là lệch giữa đặc tả và code, không phải lệch dữ liệu. Sửa thuộc bước 8 (pha G): `[...path].astro` phải bỏ qua nhánh có 0 entity, và `sitemap.ts` bỏ theo.

Liên quan `ND-007` (khách sạn và resort chưa có lối vào từ menu) — cùng gốc là chưa có nội dung, nhưng ND-007 là quyết định điều hướng còn DR-030 là lỗi thi hành.

---

## DR-031 — Mười sáu chỗ vẫn xin cấp đậm 800/900 mà Lora không có

**Trạng thái:** **thu hẹp còn một chỗ, 2026-08-06.** Chữ đổi từ Lora sang Nunito trong cùng ngày (QĐ-2026-08-06-11). Nunito biến thiên **400–800**, nên mười lăm chỗ xin `--fw-800` nay **chạy đúng** — không còn lệch. Ba chỗ đã hạ xuống `--fw-700` cũng trả về `--fw-800`.

Còn đúng **một** chỗ lệch: `HomeHubGrid.hubs-title` xin `--fw-900`, mà Nunito dừng ở 800 nên trình duyệt kẹp xuống. Sửa là đổi một dòng thành `--fw-800`; để lại vì chưa rõ có đổi chữ lần nữa không.

Nguyên văn phần dưới giữ lại làm bản ghi lịch sử.

**Trạng thái cũ:** mở. Phát hiện 2026-08-06 ngay sau khi đổi chữ hiển thị sang Lora (QĐ-2026-08-06-10).

Lora là font biến thiên **400–700**. Mọi khai báo `font-weight: var(--fw-800)` hay `var(--fw-900)` đi cùng `font-family: var(--font-display)` nay bị trình duyệt kẹp về 700 — CSS không tổng hợp giả cấp đậm khi đã có 700 thật. Nghĩa là mã nguồn nói 800/900 còn màn hình hiện 700.

Đây là lệch giữa mã và thứ thật sự render, không phải lỗi thị giác: trang vẫn đúng như đã duyệt, chỉ có mã đang nói một điều không còn đúng.

Mười sáu chỗ còn lại, đều là `--fw-800` trừ hai chỗ ghi rõ:

`DetailLayout.sticky-bar__price` · `EntityIndex.entity-title` · `FAQ.faq-heading` · `Footer .foot-brand .logo` · `Header .logo` · `HomeGroupQuote .gq-copy h2` · `HomeHero.hero-title` · `HomeHubGrid.hubs-title` (**900**) · `HomeHubGrid.hub-name` · `HomePartners h2` · `HomeTestimonials h2` · `HomeTestimonials.tm-mark` · `HomeTrustBar h2` · `Section.section-title` · `SiteHome.editorial-section-heading` · `SiteHome .home-faq-section h2` · `SiteHome .home-safety-section h2` · `TermIndex.term-heading` · `TourIndex.tour-title`

Ba chỗ **đã** hạ xuống `--fw-700` trong cùng đợt (`site-home-title`, `detail-title`, `stat-value`) chỉ vì đang sửa đúng những quy tắc đó cho `--lh-display`. Không phải chọn một bên — phần còn lại để lại đây chờ quyết.

**Vì sao không tự quét hết.** Hạ cả mười sáu chỗ xuống `--fw-700` làm mã trung thực, nhưng nếu sau này quay lại Be Vietnam Pro thì tiêu đề sẽ nhẹ hơn bản đã duyệt và phải sửa lại từng chỗ. Đây là đánh đổi ở tầng token, không phải việc dọn dẹp.

**Điều kiện xử.** Chủ dự án chọn một: (a) hạ cả mười sáu chỗ xuống `--fw-700` cho mã khớp thứ render; (b) giữ nguyên và chấp nhận mã nói một đằng render một nẻo, đổi lại giữ được đường lùi về Be Vietnam Pro; (c) khai một token ngữ nghĩa kiểu "cấp đậm nhất mà chữ hiển thị có" để cả hai font cùng đúng — cách này sạch nhất nhưng là token mới, phải duyệt.

---

## DR-032 — Một field đổ vào ba vùng trên trang chi tiết, trái chữ "hoặc" của `06` §3

**Trạng thái:** mở. Phát hiện 2026-08-21, audit giao diện vòng 4 (`docs/plans/2026-08-21-audit-va-ke-hoach-giao-dien-vong-4.md` §2.1).

`06-BINDING_MAP` §3 hàng "Nhãn loại entity" khai *"nhãn ngắn cạnh tiêu đề **hoặc** trong InfoBar"*. Code làm cả hai cộng thêm sidebar: `PlaceDetail.astro` đưa `placeType` vào `heroBadges`, `infoBarItems` và `sidebarRows`; `TourDetail.astro:67–82` đưa `tourFormat` và `duration` vào cả ba. Đo trên production: `/dia-danh/hon-mun/` hiện "Đảo" ba lần, `/tour/tour-3-dao-nha-trang-deluxe/` hiện "Cả hai" và "8:00 - 16:00" ba lần; `/diem-tham-quan/khu-du-lich-hon-tam/` hiện giờ mở cửa và điện thoại hai lần (InfoBar + InfoCard).

Phần còn lại của bản ánh xạ (giờ, điện thoại, thời lượng, nơi diễn ra) **không khai vùng** — nên mỗi template tự quyết và lặp. Lệch hai chiều: code vượt spec ở hàng nhãn loại, spec thiếu cột "vùng" ở các hàng khác.

**Điều kiện xử.** Sửa ở tầng `06` trước (thêm vùng "Thông tin nhanh", thêm cột vùng cho mọi field hiển thị), rồi kéo code về. Thuộc đợt 4B của kế hoạch vòng 4. Không tự sửa code trước khi `06` đổi.

---

## DR-033 — Sidebar dính bị header và thanh dính che

**Trạng thái:** **đã xử 2026-08-22** (đợt 4A, QĐ-2026-08-22-01). Token mới `--sticky-bar-h: 56px`; `DetailLayout` ép thanh dính cao đúng token và truyền `stickyBar` cho `Sidebar`; `Sidebar` dính ở `top: calc(var(--header-h) + var(--sidebar-offset, 0px) + var(--s4))`. Bằng chứng trên `dist/`: `class="sidebar" style="--sidebar-offset:var(--sticky-bar-h)"` và CSS `top:calc(var(--header-h) + var(--sidebar-offset, 0px) + var(--s4))`. Nguyên văn phần dưới giữ làm bản ghi.

**Trạng thái cũ:** mở. Phát hiện 2026-08-21.

`Sidebar.astro:37–39`: `position: sticky; top: 16px`. Trên trang chi tiết, header (đo 69 px) và `.sticky-bar` (đo 61,8 px, `DetailLayout.astro` `top: var(--header-h)`) cùng dính phía trên, tổng 131 px. Khi cuộn, hai dòng đầu của `InfoCard` (Địa chỉ, Giờ mở cửa) nằm sau thanh dính. Ảnh: `docs/evidence/2026-08-21-audit-vong-4/ev-attr-sidebar-clipped.jpg`.

Lỗi thi hành, không phải lệch spec. Sửa ở đợt 4A: `top` phải cộng `--header-h` và chiều cao thanh dính (xuất thành biến từ `DetailLayout`).

---

## DR-034 — Thang chữ render lớn hơn `07-DESIGN_TOKENS` 6,25 % ở mọi bậc

**Trạng thái:** **đã xử 2026-08-22** — chủ dự án chọn cách (a) (QĐ-2026-08-22-01): `html { font-size: 100% }`, `body { font-size: var(--fs-base) }`. Bằng chứng trên `dist/`: `html{font-size:100%` và `body{…font-size:var(--fs-base)…}`. Con số trong `07-DESIGN_TOKENS` §2 nay là con số render thật; cần chủ dự án nhìn lại bản dựng vì site nhỏ đi ~6 %. Nguyên văn phần dưới giữ làm bản ghi.

**Trạng thái cũ:** mở. Phát hiện 2026-08-21.

`tokens.css:192–194` đặt `html { font-size: var(--fs-base) }` với `--fs-base: 1.0625rem`. Root thành 17 px, và vì mọi token cỡ chữ cũng tính bằng `rem`, chúng nhân thêm 17/16. Đo trên production: body **18,06 px** (spec 17), `--fs-section` **34 px** (spec 32), h1 trang chi tiết **48,9 px** (spec 46), `--fs-sm` **15,9 px** (spec 15), `--fs-h1` **44,6 px** (spec 42).

Không phải lỗi nhìn thấy — thang vẫn đều — nhưng `07` §2 và chú thích trong `tokens.css` đang ghi những con số không còn đúng trên màn hình; vòng 3 chỉnh 28→32 và 18→21 theo con số spec trong khi thật ra là 34 và 22,3.

**Điều kiện xử.** Chủ dự án chọn: (a) `html { font-size: 100% }` để mọi token về đúng spec — site nhỏ lại ~6 %, phải duyệt lại bằng mắt; (b) giữ nguyên màn hình, sửa `07` và chú thích ghi con số đang render. Cửa hai chiều, nhưng phải quyết **trước** khi đo lại bất kỳ thứ gì về cỡ chữ.

---

## DR-035 — Hai bảng nhãn cho một giá trị `tourFormat`

**Trạng thái:** **đã xử 2026-08-22** (đợt 4A). Còn một bảng `TOUR_FORMAT_LABELS`; `both` → "Ghép hoặc riêng"; `TOUR_FORMAT_BADGES` xoá, bốn nơi dùng (`EntityIndex`, `HubIndex`, `TourIndex`, `TermIndex`) đọc chung bảng. Bằng chứng trên `dist/`: `/tour/` 10 lần "Ghép hoặc riêng", 0 lần "Linh hoạt"; trang Deluxe 0 lần "Cả hai". Nguyên văn phần dưới giữ làm bản ghi.

**Trạng thái cũ:** mở. Phát hiện 2026-08-21.

`src/lib/uiCopy.ts:813` (`TOUR_FORMAT_LABELS`) dịch `both` thành "Cả hai"; `:822` (`TOUR_FORMAT_BADGES`) dịch cùng giá trị thành "Linh hoạt". Danh sách `/tour/` hiện "Linh hoạt", trang chi tiết cùng tour hiện "Cả hai" — một sự thật, hai chữ, trái P6/N7. "Cả hai" đứng một mình trong huy hiệu hero không có nghĩa.

Sửa ở đợt 4A: một bảng, một chữ (đề xuất "Ghép hoặc riêng"), hai nơi cùng đọc.

---

## DR-036 — CTA dự phòng của trang tour trỏ về chính site

**Trạng thái:** **đã xử 2026-08-22** (đợt 4A). `TourDetail` bỏ qua URL cùng host với `site.url` khi chọn CTA dự phòng. Bằng chứng trên `dist/`: trang Deluxe không còn `href="https://tourdao.vn/"` trong `booking-btn`; 4 trang tour còn nút "Website chính thức" đều trỏ `hontamnhatrang.com` (đơn vị vận hành ngoài — đúng). Gốc sâu (không có giá) vẫn thuộc đợt 4D / ADR-0027. Nguyên văn phần dưới giữ làm bản ghi.

**Trạng thái cũ:** mở. Phát hiện 2026-08-21.

`TourDetail.astro:38–41`: khi tour chưa có giá, nút "Website chính thức" trỏ `data.operator?.url || officialSource`. Đơn vị vận hành của mọi tour là Công ty TNHH Tour Đảo, `url` là `https://tourdao.vn/` — nên trên production mọi trang tour có một nút **"Website chính thức" → trang chủ của chính nó**. Vì `data/prices.yaml` rỗng nên nhánh này đang bật ở **11/11** tour.

Đây là nút không hành động, đúng loại R4 và `06` quyết định nền 3 cấm. Sửa ở đợt 4A: không render khi URL cùng host với `site.url`. Gốc sâu hơn — không có giá — thuộc đợt 4D.

---

## DR-037 — `theme-color` hardcode màu của site cũ ngoài nguồn token

**Trạng thái:** **đã xử 2026-08-22** (đợt 4A). `siteTheme.ts` thêm `themeSurface(theme)` đọc thẳng `tokens.css` (không chép hex); `BaseLayout` phát `theme-color` = `--c-surface` của bộ đang bật — lấy nền chứ không lấy accent vì thanh địa chỉ di động nằm sát header nền trắng (giả định bề mặt, ghi ở QĐ-2026-08-22-01). Bằng chứng trên `dist/index.html`: `<meta name="theme-color" content="#FFFFFF">`. Nguyên văn phần dưới giữ làm bản ghi.

**Trạng thái cũ:** mở. Phát hiện 2026-08-21.

`src/layouts/BaseLayout.astro:72`: `<meta name="theme-color" content="#C2410C" />`. `#C2410C` là accent của nhatrangtravel; accent hiện hành là `#C0392B` (`tokens.css`), và còn đổi theo bộ giao diện (`cat-bien` `#B45309`, `ngoc-lam` `#BE123C`). `07-DESIGN_TOKENS` mở đầu: *"hardcode ngoài nguồn token là vi phạm P6/N7"*. Thanh địa chỉ di động đang tô màu của dự án khác.

Sửa ở đợt 4A: đọc từ token/bộ giao diện đang bật.

---

## DR-038 — Thẻ danh sách: clamp 2 dòng nhưng vẫn lòi dòng 3

**Trạng thái:** **đã xử 2026-08-22** (đợt 4A). `.card-summary` bỏ `flex:1`, `.card-meta` nhận `margin-top:auto`. Chưa có ảnh sau (trình duyệt chưa chụp lại được); kiểm bằng mắt khi duyệt bản dựng. Nguyên văn phần dưới giữ làm bản ghi.

**Trạng thái cũ:** mở. Phát hiện 2026-08-21.

`Card.astro` `.card-summary` vừa `display:-webkit-box; -webkit-line-clamp:2; overflow:hidden` vừa `flex:1`. Khi thẻ không có huy hiệu/giá (hàng meta rỗng), `flex:1` kéo ô mô tả cao hơn hai dòng, trình duyệt vẽ dấu "…" ở dòng 2 **và** vẫn hiện dòng 3 phía dưới. Thấy ngay ở `/diem-tham-quan/`, thẻ "Hòn Chồng Hòn Vợ" (ảnh `ev-index-attraction-cards.jpg`): 8/15 thẻ không huy hiệu nên chiều cao không đều.

Sửa ở đợt 4A: bỏ `flex:1` khỏi `.card-summary`, đẩy `margin-top:auto` sang `.card-meta`.

---

## DR-039 — `bookingRef.key` của 8 tour chứa chuỗi giá thay vì khoá

**Trạng thái:** đã xử 2026-08-22 — giá chuyển sang `data/prices.yaml`, `bookingRef.key` thôi
chứa chuỗi giá; xem `QĐ-2026-08-21-01`. Lúc chạy, script đặt khoá = slug cho 16 document
(8 tour approved + 8 nháp; kế hoạch dự kiến 14 — xem `task-11-report.md`).

**Đính chính cùng ngày:** câu "khoá = slug" mô tả *thời điểm chạy*, không phải một bất biến.
Chủ dự án sửa nội dung trong Studio sau đó (đổi slug nhiều tour, thêm tour mới), nên tới tối
2026-08-22 chỉ còn 1 document có `key == slug`. **Đây không phải hỏng:** `resolvePrice()` đọc
thẳng `bookingRef.key` rồi tra `prices.yaml`, không suy khoá lại từ slug — 7/8 dòng giá vẫn
trỏ đúng. Khoá là **định danh ổn định**, không buộc bằng slug; xem `DR-045`.

`01-CONTENT_MODEL` §2.8: `bookingRef` là con trỏ tới dòng giá, "không lưu số, I1, I16".
Dataset production có 8 document `tour` approved (và 6 bản nháp của chúng) mang
`bookingRef.key` dạng `"Người lớn: 850.000 VNĐ | Trẻ em: 600.000 VNĐ"`. Hệ quả: (1) vi phạm
I1 — con số giá nằm trong Sanity; (2) `resolvePrice()` không tra được dòng nào trong
`data/prices.yaml` (file đang trống) nên không tour nào hiện giá; PY4 sẽ báo trỏ hụt nếu
chạy. Không cổng nào bắt vì validator đã rời đường phát hành (ADR-0022).

Xử ở kế hoạch `docs/plans/2026-08-22-dat-tour.md` Task 11: khoá = slug tiếng Việt của tour,
con số chuyển sang `data/prices.yaml` (`amount` + `paxRates`). Không sửa mục này; đóng bằng
một dòng "đã xử" khi Task 11 xong.

---

## DR-040 — Đường phát hành tự động là Workers Builds, tài liệu ghi Cloudflare Pages

**Trạng thái:** **đã xử 2026-08-22** ở `BUILD-NOTES.md` (mục Deploy nay mô tả đúng chuỗi thật). Còn **mở** ở `README.md:66`, `SETUP-NEW-SITE.md:109–111`, `ADR-0009`, `ADR-0022` mục "Muốn quay lại" — đó là văn bản lõi/multi-site, sửa phải có quyết định riêng.

`tourdao.vn` do **Cloudflare Worker** `tourdaovn` phục vụ, và Worker đó **có nối git**: GitHub App `cloudflare-workers-and-pages` đặt check-run tên `Workers Builds: tourdaovn` trên `luutuanvu1010/tourdaovn`, lần gần nhất `success` ngày 2026-08-14 (build `dbdf066a…`, account `381557e4…`). Không có Pages project nào tên `tourdaovn` — đã ghi ở `QĐ-2026-08-14-02`.

Nhưng mọi tài liệu mô tả đường tự động đều viết **Cloudflare Pages**, và `ADR-0009` thì viết cho `nhatrangtravel` chứ không phải site này. Hệ quả thực tế: `BUILD-NOTES.md` — file người vận hành thật sự mở ra khi deploy — **không hề nhắc** rằng site có đường tự động. Đọc nó xong sẽ tưởng `npm run deploy` là đường duy nhất, và không hiểu vì sao bản deploy tay biến mất (xem DR-041).

---

## DR-041 — Bấm Publish trong Sanity dựng lại từ `origin/main`, đè lên bản deploy tay

**Trạng thái:** **đã xử 2026-08-22** theo `QĐ-2026-08-22-03` — ngắt hook + đẩy `main`. Cơ chế vẫn còn nguyên, sẽ trở lại nếu bật hook lại mà chưa push.

Webhook Sanity không mang nội dung; nó chỉ bấm chuông, rồi Cloudflare **clone `origin/main` trên GitHub** và dựng từ đó. Máy local không tham gia. Nên bất cứ commit nào chưa push đều không có mặt trong bản dựng do Publish kích, và bản dựng đó **thay thế** version đang chạy — kể cả version vừa `wrangler deploy` bằng tay.

Đã xảy ra thật ngày 2026-08-22. Lúc phát hiện: `main` local đi trước `origin/main` **7 commit** (`origin/main` = `1416363`, ngày 2026-08-14), trong đó có `472610a` = toàn bộ đợt 4A. Webhook bắn **25 lần**, tất cả `200`, cụm gần nhất 03:02–03:04 UTC; version production mới nhất tạo 03:06:55 UTC. Đối chiếu `https://tourdao.vn/diem-tham-quan/vin-harbour/` (đã phá cache) với `dist/` cùng lúc:

| Dấu hiệu | Production | `dist/` local |
|---|---|---|
| `--sticky-bar-h` (DR-033) | không có | có |
| "Có thu phí" (4A đã bỏ) | **còn** | đã bỏ |
| `theme-color` (DR-037) | `#C2410C` cứng | `#FFFFFF` từ token |

Chỉ có hai đường đưa bit lên Worker này: tải tay từ `dist/`, hoặc build phía Cloudflare từ git. Bản đang chạy không khớp `dist/` (kể cả `dist/` của hai worktree — cả hai đều không có `dist/`), nên nó đến từ đường thứ hai. Đợt 4A đã "deploy xong" mà chưa từng lên tới khách.

Cạm bẫy nằm ở chỗ **không có tín hiệu hỏng nào**: `wrangler deploy` in `Success`, `curl` trả `200`, chỉ nội dung là của hai tuần trước.

---

## DR-042 — Webhook Sanity lệch `ADR-0009` mục 3 và 4

**Trạng thái:** mở. Phát hiện 2026-08-22. Hook đang tắt (`QĐ-2026-08-22-03`) nên chưa gây hại; phải xử **trước** khi bật lại.

Cấu hình thật của hook `Cloudflare rebuild` (id `UCT8eZl6s8SXBtKP`, tạo 2026-07-27), đọc bằng management API `v2021-10-04`:

```
dataset: "*"        rule: { on: ["create"], filter: "!(_id in path(\"drafts.**\"))" }
url: https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/1017098…   (URL đầy đủ là bí mật, không chép vào kho — 04-CONSTRAINTS)
```

Ba chỗ lệch:

1. **Chỉ nghe `create`.** `ADR-0009` mục 3 đòi "create/update/delete". Sửa một trang đã publish rồi publish lại là `update` — theo cấu hình này thì **không kích build**. Nghĩa là hook vừa bắn quá nhiều lần cho việc không cần (DR-041), vừa có thể **không bắn** đúng lúc cần nhất.
2. **`dataset: "*"`, không lọc type.** `ADR-0009` mục 3 đòi "lọc theo các type có render trang". Mọi document ở mọi dataset đều kích một lần dựng toàn site.
3. **Không có debounce.** `ADR-0009` mục 4 dự trù một Worker gom sự kiện (im 120 giây mới bắn), và tự ghi "MVP có thể bỏ qua". Thực tế vẫn là MVP: 4 lần bắn trong 6 giây (02:55:17→23 UTC). Mỗi lần dựng lại là một lượt đọc **toàn bộ** nội dung qua Sanity Content API — đây chính là khoản API request mà `QĐ-2026-08-22-03` cắt.

---

## DR-043 — `BUILD-NOTES.md` báo chuyển hướng trang chủ "ĐANG BẬT" chín ngày sau khi đã gỡ

**Trạng thái:** **đã xử 2026-08-22**. Mục đổi tên thành "ĐÃ GỠ", ghi ngày + commit + bằng chứng kiểm; khối "Cách gỡ" bỏ; giữ lại phần "vì sao không dùng Page Rules" vì cơ chế đó còn đúng cho mọi lần chuyển hướng sau.

Luật `/ → https://tourdaonhatrang.com/ 302` gỡ khỏi `public/_redirects` ngày **2026-08-13** (commit `541ec26`, căn cứ `SPEC-2026-08-13-menu-chinh-bon-muc`). Tới **2026-08-22**, `BUILD-NOTES.md` vẫn mở đầu bằng "**ĐANG BẬT**" và "**Trạng thái: đang chạy trên production** từ 2026-08-06", kèm nguyên một quy trình bốn bước "Cách gỡ" cho thứ đã gỡ.

Kiểm thực tế cùng ngày: `curl -sI https://tourdao.vn/` trả `200`, không `302`.

Đây là loại lệch nguy hiểm hơn vẻ ngoài: file này là thứ người vận hành mở ra khi deploy, và nó đang mô tả **hành vi production sai**. Ai đọc để trả lời "trang chủ tourdao.vn có chuyển hướng không" sẽ trả lời sai.

**Gốc rễ đi kèm:** `QĐ-2026-08-06-04` **bước 6** đòi "ghi mục mới trong sổ để đóng `QĐ-2026-08-06-02`". Bước đó **chưa từng được thi hành** — không có mục nào trong `DECISIONS.md` đóng `QĐ-2026-08-06-02`. Code đổi, sổ không đổi, nên `BUILD-NOTES` không có tín hiệu nào để phải cập nhật theo. Đóng ở `QĐ-2026-08-22-04`.

---

## DR-044 — `PY3`/`PY4`/`PY5` so sai kiểu `bookingRef`, ba validator giá gần như vô hiệu

**Trạng thái:** đã xử 2026-08-22 — Task 17 sửa `validatePY3`/`validatePY4`/`validatePY5`
(`scripts/validators/py1-py8.ts`) đọc `bookingRef?.key` qua một hàm dùng chung `refKey()` thay
vì `typeof doc.bookingRef === 'string'`; xem
`.superpowers/sdd/2026-08-22-dat-tour/task-17-report.md`. Chạy lại `npm --prefix scripts run
validate` sau sửa: `PY4` từ 8 mục "mồ côi" giả xuống còn **1** (dòng `ve-hon-tam-tam-tron-goi`
— mồ côi thật, xem `DR-045`); `PY5` từ 79 xuống **72** lỗi (7 tour có `bookingRef.key` hợp lệ
nay được nhận đúng, còn tour `8dda44cb` thiếu `bookingRef` thật vẫn bị báo — đúng như `DR-045`
dự đoán); `PY3` vẫn `[pass]` nhưng nay kiểm thật thay vì luôn luôn bỏ qua. `I1` không đổi (119
lỗi cả trước lẫn sau lần chạy của Task 17) — không thuộc phạm vi sửa này.

Phát hiện 2026-08-22, khi Task 11 (module đặt tour,
`docs/plans/2026-08-22-dat-tour.md`) thêm 8 dòng giá thật vào `data/prices.yaml` và chạy
`npm run validate` để đối chiếu.

`scripts/validators/py1-py8.ts`: `validatePY3` (~dòng 99-104) và `validatePY4` (~dòng 118-133)
đọc `doc.bookingRef` rồi kiểm `typeof doc.bookingRef === 'string'` — coi `bookingRef` là một
field CHUỖI. Nhưng schema Sanity thật (`cms/schemas/tour.ts` dòng 136, và tương tự ở
`lodgingBase.ts`, `attraction.ts`, `experience.ts`, `event.ts`) định nghĩa `bookingRef` là
`type: 'object'` với field con `key` — khớp với mọi component frontend
(`src/components/TourDetail.astro`, `HubIndex.astro`, `EntityIndex.astro`, …, đều đọc
`data.bookingRef?.key`). Vì vậy `typeof doc.bookingRef === 'string'` **luôn luôn false** với dữ
liệu thật, bất kể `bookingRef.key` có đúng hay không — bug có từ trước Task 11, Task 11 không
gây ra nó, chỉ làm nó lộ ra lần đầu.

Bằng chứng: sau khi Task 11 chuyển đúng cả 16 document (8 tour + 8 nháp) sang
`bookingRef.key = slug.vi.current` (xác nhận bằng truy vấn Sanity trực tiếp, khớp 100%), chạy
`npm run validate` vẫn cho:
- `PY4` báo "mồ côi" — `prices.yaml: dòng "<khoá>" không có entity nào trỏ bookingRef (PY4)`
  cho cả 8 khoá mới, dù cả 8 tour đều có `bookingRef.key` đúng.
- `PY5` báo cả 8 tour "thiếu cả bookingRef lẫn isAccessibleForFree", dù `bookingRef.key` hợp lệ.

Trước Task 11 bug không hiện vì `data/prices.yaml` từng trống (0 dòng), nên vòng lặp "mồ côi"
của PY4 không có gì để lặp; PY3 âm thầm bỏ qua mọi tour ở mọi thời điểm vì điều kiện
`typeof === 'string'` luôn sai, bất kể nội dung `bookingRef.key`.

Không sửa ở đây — nằm ngoài phạm vi 3 file của Task 11
(`data/prices.yaml`, `cms/_migrate-bookingref-keys.mjs`, `docs/DRIFT_LOG.md`). Cần một task
riêng: sửa `validatePY3`/`validatePY4`/`validatePY5` đọc `doc.bookingRef?.key` thay vì
`typeof doc.bookingRef === 'string'`. Xem
`.superpowers/sdd/2026-08-22-dat-tour/task-11-report.md` mục "Lệch so với brief" để có bằng
chứng chi tiết (lệnh chạy, output đầy đủ).

---

## DR-045 — `bookingRef.key` rời khỏi slug sau đợt sửa nội dung 2026-08-22; một dòng giá mồ côi, một tour mất giá

**Trạng thái:** mở. Phát hiện 2026-08-22 khi review Task 11 của module đặt tour truy vấn lại
dataset production.

Task 11 (07:58Z) đặt `bookingRef.key = slug.vi.current` cho 16 document. Sau đó có ba đợt sửa
nội dung trong Studio: 08:07–08:14Z (thêm khoảng 7 tour vé VinWonders / Vin Harbour, không
document nào có `bookingRef`), 12:35–12:59Z (đổi slug bốn tour cũ, thêm ba tour mới),
14:40–14:57Z (tách nhóm Hòn Tằm). Kết quả đo lúc tối 2026-08-22 (`perspective: raw`):
**44** document `tour`, **10** có `bookingRef.key`, **1** có `key == slug`.

**Không phải hỏng, và không được "sửa" bằng cách chạy lại script.** `resolvePrice()`
(`src/lib/resolver.ts`) đọc thẳng `bookingRef.key` rồi tra `data/prices.yaml`; nó không suy
khoá lại từ slug. Khoá trong `prices.yaml` là slug *cũ*, và `bookingRef.key` vẫn giữ đúng giá
trị cũ đó, nên 7/8 dòng giá vẫn trỏ đúng. Chạy lại `cms/_migrate-bookingref-keys.mjs` sẽ đặt
khoá = slug *mới* và biến cả 7 liên kết đang sống thành mồ côi. Đề xuất "chạy lại cho khớp"
trong báo cáo review Task 11 vì vậy bị bác.

**Bài học ghi lại.** Lấy slug làm *giá trị* của khoá là gắn hai thứ có vòng đời khác nhau:
slug đổi theo biên tập, khoá phải đứng yên theo dòng giá. `01-CONTENT_MODEL` §2.8 chỉ đòi
`bookingRef` là con trỏ tới dòng giá — **không** đòi nó bằng slug. Luật đọc đúng là: khoá là
định danh ổn định, phải khớp một dòng trong `prices.yaml`, không buộc bằng slug.

**Hai việc còn lại, thuộc chủ dự án, chưa quyết:**

1. Dòng giá `ve-hon-tam-tam-tron-goi` trong `data/prices.yaml` **mồ côi** — không document nào
   trỏ tới (đã đếm: 0).
2. Tour `Tour Hòn Tằm trọn gói: Cano 2 chiều - Tắm bùn - Tắm biển - Buffet`
   (`8dda44cb`, slug `tour-hon-tam-tron-goi`) **không có `bookingRef`** nên không có giá và sẽ
   không có form đặt tour. Nhiều khả năng dòng giá mồ côi ở trên là dành cho nó, nhưng tên
   không khớp nên không tự nối được.

Task 17 sửa `PY4`/`PY5` sẽ khiến cổng validator tự báo cả hai mục này thay vì im lặng như hiện nay.

---

## DR-046 — Đổi slug hàng loạt 2026-08-22 làm 6 URL `/tour/` sắp biến mất, `_redirects` không có dòng R3 nào

**Trạng thái:** mở. Phát hiện 2026-08-23 khi luồng đặt tour dựng lại site để đối chiếu dữ liệu.
Không thuộc phạm vi module đặt tour; ghi ở đây để không rơi, người quyết là chủ dự án.

`04-CONSTRAINTS` §1c luật R3: một URL đã từng tồn tại **không được biến mất câm** — đổi đường dẫn
thì phải có một dòng 301 trong `public/_redirects`, gỡ hẳn thì 410.

Đợt biên tập nội dung 2026-08-22 (xem `DR-045`) đổi slug nhiều tour. So `sitemap-vi.xml` của
production với một bản `astro build` chạy trên nội dung Sanity hiện tại:

- production: **21** URL `/tour/`; bản dựng mới: **20**; giữ nguyên **14**; **mất 6**; mới **6**.
- Sáu URL sẽ mất: `tour-3-dao-hon-mun-mini-beach-lang-chai`, `tour-3-dao-nha-trang-hon-mun-hon-tam`,
  `tour-3-dao-nha-trang-mini-beach-hon-tam`, `ve-hon-tam-seaday-tour-03`,
  `ve-hon-tam-tam-bun-tam-bien`, `ve-hon-tam-tam-tron-goi`.
- Sáu URL mới: `tour-3-dao-hon-mun`, `tour-3-dao-mini-beach`, `tour-3-dao-nha-trang`,
  `tour-hon-tam-tam-bun-tam-bien`, `ve-hon-tam-tam-bien`, `ve-hon-tam-tron-goi`.
- Chín slug ngắn (`bai-soi`, `bai-tranh`, `du-thuyen`, `hon-mun`, `hon-tam`, `lang-chai`,
  `mini-beach`, `vinh-san-ho`, `vinwonders`) nằm trong nhóm **giữ nguyên** — không mất.
- `public/_redirects` hiện có **0** dòng R3 (chính file tự ghi "Hiện chưa có dòng R3 nào").

**Cổng lẽ ra bắt được nhưng sẽ không bắt.** Cổng so sitemap nằm ở `npm --prefix scripts run
validate:post`. Đường dựng tự động chạy `build:ci`, mà `build:ci` = `npm run build` =
`astro check && astro build` — **không gọi** `validate:post`. Nên nếu đẩy lên mà không chạy tay
thì R3 vỡ im lặng.

**Năm trong sáu cặp cũ → mới truy được**, nhờ một sự tình cờ: Task 11 của module đặt tour đặt
`bookingRef.key` = slug vào 2026-08-22 07:58Z, *trước* khi ai đổi slug, nên `key` hiện là một
bản ghi của slug cũ:

| Slug cũ (`bookingRef.key`) | Slug mới | `_id` |
|---|---|---|
| `tour-3-dao-hon-mun-mini-beach-lang-chai` | `tour-3-dao-mini-beach` | `0cab212b` |
| `tour-3-dao-nha-trang-hon-mun-hon-tam` | `tour-3-dao-hon-mun` | `5644d7a5` |
| `tour-3-dao-nha-trang-mini-beach-hon-tam` | `tour-3-dao-vip-nha-trang` | `9ebebf78` |
| `ve-hon-tam-seaday-tour-03` | `ve-hon-tam-tam-bien` | `702a7d9a` |
| `ve-hon-tam-tam-bun-tam-bien` | `tour-hon-tam-tam-bun-tam-bien` | `e2cadbb4` |

Cặp thứ sáu `ve-hon-tam-tam-tron-goi` **không suy được** — không document nào còn mang nó làm
slug lẫn làm `bookingRef.key`. Đây cũng chính là dòng giá mồ côi ở `DR-045`.

**Cảnh báo về độ tin của bảng trên:** năm cặp là *suy* từ việc `key` trùng slug cũ, không phải từ
một bản ghi "đã đổi tên" trong Sanity. Nó khớp với sitemap production, nhưng nếu đợt đổi slug có
**gộp hoặc tách** tour thì 301 một-đối-một là sai. Chủ dự án phải nhìn qua trước khi viết
`_redirects`.
