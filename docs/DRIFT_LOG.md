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

## DR-044 — `06` §3.1 chưa khai vùng cho bốn entity còn lại

**Trạng thái:** mở (phần "bổ sung vào §3.1" vẫn chờ Cowork/chủ dự án — xem
cập nhật 2026-08-23 bên dưới cho phần đã dồn vùng xong). Phát hiện 2026-08-23,
Task 7 (đóng Luật 1).

**Cập nhật 2026-08-23 (cùng ngày, sau ruling của chủ dự án ở DR-045):**
`LodgingDetail` cũng đã dồn về `FactStrip` — không còn là trường hợp "chưa
dồn" như ghi ban đầu bên dưới. Chi tiết cách xử lý (đo trên build thay vì
trên nguồn, trần `max` tuỳ biến) ở DR-045.

Ma trận §3.1 (v2.2, đọc thẳng bằng `luat1-post.ts`) chỉ khai bốn entity: Điểm
tham quan, Địa danh, Trải nghiệm, Tour. `restaurant`, `specialty`, `event`,
`hotel`/`resort` không có hàng nào, nên tầng B (sai vùng, bật ở Task 8) sẽ
không đối chiếu được cho chúng — chỉ tầng A (lặp vùng) áp được, và tầng A chỉ
đếm được số vùng, không biết vùng nào "đúng".

Đã dồn về một vùng `FactStrip` khi đóng Luật 1 (2026-08-23) cho ba trong bốn
entity — `RestaurantDetail`, `SpecialtyDetail`, `EventDetail` — để không lặp
vùng, dù cả ba không render trang nào trong `dist/` hiện tại (không có route
`/nha-hang/`, `/dac-san/`, `/su-kien/`) nên đây là việc dọn nhất quán mã
nguồn, không phải sửa lỗi hiển thị cho người dùng. `LodgingDetail`
(khách sạn — 6 trang, có render) **chưa** dồn được; xem DR-045 vì sao.

"Vùng nào cho field nào" ở bốn entity này vẫn là quyết định nằm trong từng
template chứ chưa phải của bản ánh xạ `06`. Cần bổ sung vào §3.1 ở một lượt
sửa `06` sau, do Cowork đề xuất và qua cổng duyệt — không phải việc của vai
Code.

---

## DR-045 — `LodgingDetail` không dồn được vào `FactStrip`: hơn 6 field, component có trần cứng

**Trạng thái:** **đã xử 2026-08-23**, cùng ngày phát hiện — chủ dự án ra ba
ruling, xem "Cập nhật — ruling và cách xử" ở cuối mục này. Nguyên văn phần mở
đầu bên dưới giữ làm bản ghi (đây là lý do Task 7 dừng lại và báo cáo, không
phải mô tả sai).

Phát hiện 2026-08-23, Task 7.

`FactStrip.astro` (đã chốt, Task 7 không được sửa) tự cắt còn tối đa 6 ô hiển
thị (`facts.filter(f => f.visible).slice(0, 6)`), đúng theo hợp đồng "tối đa
6 ô" của `06` §3 — hợp đồng đó viết cho bốn entity có hàng ở §3.1, nơi số
field tối đa đã được thiết kế vừa 6 (Điểm tham quan: 5).

`LodgingDetail` không có hàng ở §3.1 (xem DR-044), và bộ field nó đang render
qua cặp `InfoBar` + `InfoCard` cũ rộng hơn nhiều: tối thiểu 9 field duy nhất
cho khách sạn (`starRating`, `beachAccess`, `checkinTime`, `address`,
`checkoutTime`, `numberOfRooms`, `petsAllowed`, `geo` (khoảng cách sân bay),
`officialSource` — chưa tính `sameAs` đã có vùng riêng, và chưa tính
`beachfront`/`landArea`/`onSiteActivities` chỉ resort mới có, có thể lên tới
12). Gộp thẳng vào `facts` rồi để `FactStrip` tự cắt sẽ **âm thầm xoá** 3+
field khỏi 6 trang khách sạn thật — đúng loại lỗi "vùng biến mất, cổng vẫn
xanh" mà cả việc đóng Luật 1 này được lập ra để chặn (xem cảnh báo trong
`task-7-brief.md` và bằng chứng `hop-dong-fact-strip.md`).

Task 7 **không tự chọn** một trong các hướng xử lý (nhận 6 và mất 3+ field;
dựng thêm một khối `data-region="fact-strip"` thứ hai ngoài component để
không bị cắt; giảm bớt field trước khi vào `facts`; sửa `FactStrip.astro` để
nó tự cuộn/xem thêm) — mỗi hướng đổi hành vi hiển thị hoặc đổi hợp đồng của
một component đã chốt, vượt phạm vi quyết định của vai Code. `LodgingDetail`
**giữ nguyên** cặp `InfoBar` + `InfoCard` cũ (18 vi phạm lặp vùng không đổi,
không tệ thêm so với trước Task 7), và do đó `InfoBar.astro`/`InfoCard.astro`
**chưa xoá được** — cả hai vẫn là primitive thật đang dùng, không chỉ tồn tại
vì quên dọn. `entity-layout-post.ts` giữ nguyên, chưa đổi 'InfoBar' thành
'FactStrip', vì lý do tương tự: đổi tên trong khi Lodging còn dùng thật sẽ mô
tả sai hiện trạng.

Cần quyết định ở tầng Cowork/chủ dự án: chấp nhận hướng nào trong bốn hướng
trên (hoặc hướng khác), rồi Task 8 (hoặc một task riêng) thực thi.

---

### Cập nhật — ruling và cách xử (2026-08-23)

Chủ dự án ra ba ruling sau khi đọc mục trên:

1. **Số liệu ban đầu đo sai chỗ.** Ước tính "9–12 field" đếm số khai báo
   `field:` trong mã nguồn (`infoBarItems` + `sidebarRows`), không đếm số ô
   THẬT SỰ render. Đo lại trên `dist/khach-san/*/index.html` (6 trang, kiểm
   độc lập bằng `grep -o 'data-field="[a-zA-Z]*"'` trước khi tin, không chỉ
   nhận số của chủ dự án) — union `data-field` trên cả 6 trang là đúng **6**:
   `beachAccess, checkinTime, checkoutTime, numberOfRooms, petsAllowed,
   starRating`. Không trang nào vượt 6. `address`, `geo` (khoảng cách sân
   bay), `officialSource` khai trong mã nhưng cả 6 khách sạn thật hiện có đều
   không có dữ liệu nên `visible:false`, không render — không phải field bị
   cắt, là field vốn không có gì để hiện. Không có resort nào render (3
   document resort trong Sanity đều thiếu field, không lên trang) nên
   `beachfront`/`landArea`/`onSiteActivities` chưa từng xuất hiện trên build.
2. **Nhưng nằm đúng ở trần 6 mà cắt câm là lỗi thật của `FactStrip.astro`** —
   một field nữa xuất hiện sau này (resort có dữ liệu, hoặc khách sạn thêm
   `address`) sẽ biến mất không dấu vết. Chủ dự án gỡ hạn chế "không sửa
   `FactStrip.astro`" **chỉ cho hai thay đổi**: (a) prop `max` tuỳ biến, mặc
   định vẫn 6; (b) `console.warn` lúc build khi số ô hiển thị vượt `max`, nêu
   rõ field nào bị cắt. Đã làm — xem diff `src/components/FactStrip.astro`.
3. **Chỉ `InfoBar.astro` bị xoá, không phải cả hai.** `InfoCard.astro` còn
   sống — `ArticleDetail`, `OrganizationDetail`, `PersonDetail` (ngoài phạm
   vi việc đóng Luật 1, không có hàng ở §3.1) vẫn import và render nó qua
   slot `info` của `DetailLayout`. Xoá `InfoCard.astro` sẽ vỡ ba trang đó.
   Ghi riêng ở DR-046.

**Cách xử:** `LodgingDetail.astro` gộp `infoBarItems` + `sidebarRows` cũ
thành một mảng `facts` duy nhất (9 field cho hotel, tới 12 cho resort đủ ba
field riêng — giữ nguyên TOÀN BỘ field từng khai trong mã, không chỉ 6 field
đang thật sự render, để không cắt oan khi dữ liệu tương lai đủ hơn), loại
`gia` (giá không bao giờ vào `facts`) và `sameAs` (chuyển sang prop
`DetailLayout`, dùng lại đường đã xây ở Task 6). Truyền
`factsMax={facts.length}` xuống `DetailLayout` → `FactStrip`, tức trần bằng
đúng số field khai báo — không ô nào bị cắt bởi component, kể cả khi tương
lai có đủ dữ liệu resort. Cảnh báo `console.warn` mới của `FactStrip` vẫn là
lưới an toàn nếu sau này ai thêm field vào mảng mà quên nâng `factsMax`.

`InfoBar.astro` đã xoá (`git rm`) sau khi xác minh lại — không phải tin theo
chủ dự án — mọi tham chiếu còn lại trong `src/` chỉ là comment, không phải
import/render (`grep -rn "InfoBar" src/` trước khi xoá). `InfoCard.astro`
giữ nguyên. `entity-layout-post.ts` cập nhật: đổi `'InfoBar'` → `'FactStrip'`
trong danh sách primitive tầng 1 và hợp đồng tầng 3 (đổi tên biến
`ENTITIES_WITH_INFOBAR`/`ENTITIES_WITHOUT_INFOBAR` thành
`ENTITIES_WITH_FACTSTRIP`/`ENTITIES_WITHOUT_FACTSTRIP` cho nhất quán), giữ
nguyên dòng `'src/components/InfoCard.astro'` trong danh sách primitive vì
file đó còn thật.

Kết quả đo trên `dist/` sau khi convert: xem `task-7-report.md` mục "Fix
round — Lodging convert theo ruling".

---

## DR-046 — `InfoCard.astro` còn sống cho ba template ngoài phạm vi đóng Luật 1

**Trạng thái:** mở (có chủ đích — không phải quên dọn).

Kế hoạch đóng Luật 1 (Task 5–7) chỉ bao trùm sáu entity có/không có hàng ở
`06` §3.1 dùng cặp `InfoBar`/`InfoCard`: Điểm tham quan, Địa danh, Trải
nghiệm, Tour, Nhà hàng, Đặc sản, Sự kiện, Khách sạn — tất cả nay đã chuyển
sang `FactStrip` (`InfoBar.astro` xoá ở Task 7 fix round, 2026-08-23). Ba
template KHÔNG nằm trong phạm vi này — `ArticleDetail.astro`,
`OrganizationDetail.astro`, `PersonDetail.astro` — vẫn `import InfoCard from
'./InfoCard.astro'` và render `<InfoCard slot="info" rows={sidebarRows}
lang={lang} />` bên trong `DetailLayout`. Xác nhận bằng
`grep -rn "import InfoCard\|<InfoCard" src/` (2026-08-23): đúng ba file này,
không file nào khác.

Xoá `InfoCard.astro` bây giờ sẽ vỡ ba template đó (mất hẳn vùng info hiện
đang render tác giả/tổ chức/liên hệ). `DetailLayout.astro` giữ nguyên
`<slot name="info" slot="info" />` (đường forward cho `InfoCard`) và prop
`infoBarItems?: unknown[]` (kiểu lỏng, không còn phụ thuộc `InfoBar.astro`)
chỉ để ba template này khỏi vỡ kiểu khi còn truyền `infoBarItems={[]}` — xem
comment tại chỗ trong `DetailLayout.astro`.

Ba entity này (Bài viết, Tổ chức, Người) không có hàng ở `06` §3.1 (đúng như
`restaurant`/`specialty`/`event`/`hotel` trước khi Task 7 xử — xem DR-044),
và Luật 1 tầng A (lặp vùng) không bắt lỗi gì ở chúng vì `InfoCard` là vùng
DUY NHẤT chúng dùng (không có `InfoBar` đi kèm để lặp). Nên việc này không
phải một vi phạm Luật 1 đang mở — chỉ là một loose end: `InfoCard.astro`
không còn là một nửa của cặp trùng lặp nữa, nhưng vẫn là một component "cũ"
sống sót ngoài kế hoạch dọn dẹp hiện tại. Cần một quyết định riêng (có thể là
Task 8 mở rộng, hoặc một task khác) nếu muốn ba template này cũng chuyển
sang `facts`/`FactStrip`, hoặc chấp nhận `InfoCard.astro` là primitive lâu
dài cho nhóm entity phi-địa-lý (Article/Organization/Person) — quyết định đó
chưa có, ghi lại ở đây để không rơi mất.

**Cập nhật Task 8 (2026-08-23) — tầng B của `luat1-post.ts` làm lộ đúng gap
này bằng máy, không phải drift mới.** Bật tầng B (SAI VÙNG — field render ở
vùng khác vùng §3.1 khai) cho ra 15 vi phạm thật trên 5 trang, toàn bộ đều là
Organization/Person: `cong-ty/cong-ty-co-phan-hon-tam-bien-nha-trang` (5:
`address`, `telephone`, `officialSource`, `licenseInfo`, `sameAs`),
`cong-ty/cong-ty-co-phan-vinpearl` (4: thiếu `officialSource`),
`cong-ty/cong-ty-tnhh-tour-dao` (4: thiếu `sameAs`), `tac-gia/ho-dac-duy` (1:
`sameAs`), `tac-gia/nguyen-phu-hai` (1: `sameAs`) — tất cả đọc ra `SAI VUNG:
info-card`. Lý do kỹ thuật: `docMaTran()` trong `luat1-post.ts` gộp vùng theo
TÊN field, không theo entity/cột — nên khi `OrganizationDetail.astro`/
`PersonDetail.astro` dùng lại đúng tên field mà §3.1 đã khai vùng cho Điểm
tham quan/Địa danh/Tour (`address`, `telephone`, `officialSource`,
`licenseInfo`, `sameAs`), tầng B đọc nhầm thành "field này có vùng đã khai"
và đỏ khi thấy chúng ở `info-card` — dù `info-card` là vùng hợp lệ (duy nhất)
cho hai entity chưa nằm trong phạm vi đóng Luật 1. Đây KHÔNG phải một vi
phạm Luật 1 mới (Luật 1 vẫn giữ đúng: mỗi field một vùng, không lặp) — nó là
tầng B đang thiếu trục entity để phân biệt "field X ở entity đã khai" với
"field trùng tên ở entity chưa có hàng trong §3.1". Thêm trục đó là mở rộng
parser, ngoài phạm vi Task 8 (xem comment đầu `luat1-post.ts`). Task 8 KHÔNG
sửa `src/components/**` và KHÔNG entity-hoá validator để ép xanh — giữ
`luat1-post.ts` đỏ thật trên 5 trang này, ghi vào bằng chứng nghiệm thu
(`docs/evidence/2026-08-22-trung-vung-truoc-4B/luat1-sau-khi-sua-xanh.txt`).
Quyết định vẫn treo y như đoạn trên: nếu chủ dự án chốt Organization/Person
chuyển sang `FactStrip`/`facts`, gap này tự đóng cùng lúc; nếu chốt giữ
`InfoCard` làm primitive lâu dài, tầng B cần trục entity để hết báo nhầm.

**Cập nhật thứ hai, cùng ngày — controller chốt: 15 vi phạm ở trên là ĐỎ
GIẢ do defect của validator, không phải một phát hiện Luật 1 thật, và đã
vá.** `docMaTran()` gộp vùng cho phép theo TÊN field trên toàn bộ ma trận
§3.1, không tách theo cột entity — đây là defect có sẵn từ bản review Task 2
(deferred minor: "the allowed region count is a union across entity columns
rather than the per-entity cell"), tầng A chịu được vì chỉ ĐẾM số vùng, tầng
B thì không vì nó SO SÁNH đúng-sai vùng cụ thể. Đã vá trong `luat1-post.ts`:
`docMaTran()` nay trả thêm `theoEntity` (Field → entity key → đúng vùng của
CỘT đó) và `entityCoCot` (tập entity có cột thật trong §3.1); hàm mới
`entityCuaTrang()` suy entity của một trang từ segment URL đầu, tra qua
`ROUTE_MAP` (`src/lib/routes.ts` — theo đúng tiền lệ import từ `src/` mà
`scripts/meta-validators/g3-binding-map-vs-template.ts` đã đặt, không tự
liệt tiền tố URL bằng tay). Tầng B nay chỉ phán một trang khi entity của
trang đó CÓ cột trong §3.1 — Organization và Person (không có cột) nằm
ngoài thẩm quyền tầng B, nên 15 vi phạm ở trên KHÔNG còn xuất hiện. Xác
minh tầng B vẫn sống (không phải "hết đỏ vì thôi không kiểm nữa"): tạm đổi
`data-region="fact-strip"` thành `"breadcrumb"` trên
`dist/diem-tham-quan/chua-long-son/index.html` (entity `attraction`, CÓ cột
trong §3.1) — tầng B bắt đúng 5 vi phạm `SAI VUNG: breadcrumb`
(`openingHours`, `address`, `telephone`, `isAccessibleForFree`,
`officialSource`); phục hồi file gốc, xác nhận giống hệt bằng `diff`, chạy
lại về `[pass]`. Câu hỏi chính sách ở đoạn trên (Organization/Person có nên
chuyển sang `FactStrip` không) vẫn treo — DR-046 vẫn ở trạng thái mở — chỉ
riêng phần "tầng B báo nhầm" đã đóng.

---

## DR-047 — Tầng B của `luat1-post.ts` không tách được các mục nội dung, chỉ tách được id vùng

**Trạng thái:** chấp nhận (giới hạn đã biết, ghi lại để không ai đọc tầng B
rộng hơn biên thật của nó).

Task 8 (2026-08-23) bật tầng B (SAI VÙNG) của `luat1-post.ts`: field render ở
vùng khác vùng §3.1 khai thì đỏ, kể cả khi không lặp. Nhưng `idTuTenVung()`
trong file đó gom TẤT CẢ các ô §3.1 mở đầu bằng "mục" hoặc "dòng" — tức
`highlights`, `body`, `accessInfo`, `faq`, `seasonNote`, `includes`,
`excludes`, `itinerary`, `sameAs`, và rollup `experiences` — về một id ngắn
DUY NHẤT là `'section'`. HTML cũng không tách data-region riêng cho từng mục
nội dung (chỉ có `data-region="section"` chung, xem `DetailLayout.astro:138`
cho `sameAs`). Hệ quả: tầng B phân biệt được field render ở `fact-strip` khi
§3.1 khai `hero-badge` (id khác nhau), nhưng KHÔNG phân biệt được field
render ở mục "Câu hỏi thường gặp" khi §3.1 khai mục "Nguồn tham khảo" — cả
hai đều chỉ là `'section'`. Một field cho sai mục nội dung này sang mục nội
dung khác (trong số 9 field kể trên) sẽ lọt qua tầng B mà không hiện đỏ.

Đây không phải một lỗi tầng B viết sai — nó là biên thật của những gì tầng B
đo được với id vùng hiện có. Không vá trong đợt này: mở rộng `idTuTenVung()`
(và data-region trong HTML) để tách id cho từng mục nội dung là việc khác
phạm vi Task 8 — chờ §3.1 được sửa để gán id riêng cho từng mục (đề xuất đó
đang chờ chủ dự án duyệt bản sửa spec, chưa có ở thời điểm ghi entry này).
Xem comment đầu `scripts/validators/luat1-post.ts` cho chi tiết kỹ thuật;
entry này là bản ghi chính thức để giới hạn không rơi mất khi có người sau
này đọc tầng B và tưởng nó bắt hết mọi kiểu sai vùng.

---

## DR-048 — Bốn vùng §3.1 chưa từng gắn `data-region`, để lọt C1 và I1 qua tám vòng review

**Trạng thái:** chấp nhận (giới hạn đã biết, sibling của DR-047 — cùng chủ đề
"tầng B không bắt hết mọi kiểu sai vùng", khác nguyên nhân kỹ thuật).

Review toàn nhánh (2026-08-23) phát hiện: bên cạnh giới hạn bucket `'section'`
đã ghi ở DR-047, `luat1-post.ts` còn một giới hạn thứ hai mà comment đầu file
CHƯA từng khai. ALIAS trong file đó đọc được TÁM id vùng ngắn từ §3.1
(`hero-badge`, `hero`, `breadcrumb`, `fact-strip`, `sticky-bar`,
`action-block`, `map-card`, `footer-meta`). Đối chiếu với
`grep -rhoE 'data-region="[a-z-]+"' src/components/*.astro` chạy thật trên
kho hôm nay: chỉ NĂM id có mặt trong HTML — `action-block`, `fact-strip`,
`sticky-bar`, `map-card` (thẻ bản đồ; vá xong trong cùng đợt sửa ghi entry
này, xem C1 bên dưới), và bucket `'section'`. BỐN id còn lại — `hero`,
`hero-badge`, `breadcrumb`, `footer-meta` — KHÔNG component nào từng gắn.
(Lệnh grep trên thật ra trả về SÁU id, không phải năm: `info-card` cũng có
mặt, nhưng đó là id cũ của `InfoCard.astro` — Article/Organization/Person,
ngoài từ vựng ALIAS/§3.1 hoàn toàn, không tính vào con số ở đây.)

Hệ quả: bốn hàng §3.1 sau nằm HOÀN TOÀN ngoài thẩm quyền của cả tầng A lẫn
tầng B, dù field có cột hợp lệ trong ma trận:

| Hàng §3.1 | Vùng khai (id chưa gắn) |
|---|---|
| `attractionType` · `placeType` · `experienceType` · `tourFormat` (nhãn loại entity) | `hero-badge` |
| `summary` | `hero` |
| `containedInPlace` · `venue` (mắt cha) | `breadcrumb` |
| `_updatedAt` · `updatedAt` | `footer-meta` |

Không có thẻ `data-region` nào bọc các vùng này trong HTML, nên `docTrang()`
trong `luat1-post.ts` không có gì để gán cho field render ở đó — field đó
biến mất khỏi cả bộ đếm tầng A lẫn phép so sánh tầng B, dù render thật trên
trang. Đây chính là lỗ đã để lọt hai phát hiện thật của cùng đợt review này:

- **C1** — `hasMap` bị bỏ rơi hoàn toàn (không render ở đâu, kể cả thẻ bản đồ)
  trên 37 trang suốt tám vòng review task. Đã vá trong đợt sửa này (chuyển
  `hasMap` vào thẻ bản đồ, gắn `data-region="map-card" data-field="hasMap"`),
  nên `map-card` nay chuyển sang cột "có gắn thẻ" ở trên.
- **I1** — `duration` lặp sang huy hiệu hero (`hero-badge`) trên 19 trang
  Trải nghiệm/Tour, cạnh bản Thông tin nhanh đã đúng vùng. Huy hiệu hero
  không mang `data-region`/`data-field` nên tầng A/B đều không thấy cặp lặp.
  Đã vá trong đợt sửa này (bỏ `duration` khỏi `heroBadges`).

Cả hai field đứng cạnh một vùng CHƯA GẮN THẺ (`hero-badge`) — không phải
trùng hợp: đây chính xác là loại lỗi mà giới hạn này dự đoán trước sẽ lọt.

Không vá trong đợt này: gắn `data-region`/`data-field` cho bốn vùng còn lại
(`Hero.astro`, `Breadcrumb.astro`, và dòng "Cập nhật" cuối nội dung trong
`DetailLayout.astro`) là việc khác phạm vi — mỗi vùng cần xác nhận cách field
đang render ở đó trước khi gắn thẻ (rủi ro tương tự các phát hiện của Task 1
khi gắn thẻ cho vùng cũ), không phải việc cơ học một dòng. Ghi giới hạn trung
thực ở đây và trong comment đầu `scripts/validators/luat1-post.ts` — không tự
vá, không tự nhận tầng B "bắt hết".

---

## DR-049 — `06` v2.3 chuyển `summary` khỏi hero, nhưng mã vẫn render nó trong hero

**Trạng thái:** **ĐÓNG 2026-08-24** — `QĐ-2026-08-24-05`. (Trước đó: mở, cố ý chờ Design chặng 2. Không phải sót.)

> **Đóng thế nào.** Design chặng 2 giao mockup (project `fca38485`) → QA1 bắt hai chỗ lệch với `06` v2.3 → chủ dự án chốt phương án A → Code dựng. `DetailLayout.astro` nay có `.summary-band` **sau thanh dính**, gắn `data-region="summary-band"` và `data-field="summary"`; `summary` đã gỡ khỏi `slot="overlay"` của `Hero`. Kèm theo, `title` cũng rời lớp phủ xuống `.title-band` — `06` lên **v2.4.0**.
>
> **Kiểm:** thứ tự vùng trong `<body>` là hero → title-band → sticky-bar → summary-band → fact-strip; `slot="overlay"` còn **0** phần tử chữ; `luat1-post` **pass — 137 trang, 0 field lặp vùng, 0 field sai vùng**; `BM-ORPHAN-REGION` và `BM-EMPTY-REGION` pass; `astro check` 0 lỗi.
>
> **Điều phiếu này dự đoán đúng.** Phiếu viết *"`summary` chưa bao giờ được gắn `data-field`, nên `luat1-post` không thấy"* và xếp nó vào khoảng mù của `DR-048`. Nay vùng đã gắn thẻ, nên đây là **lần đầu tiên tầng B của cổng canh được đoạn mở**. Ba vùng còn lại của `DR-048` — `hero`, `hero-badge`, `breadcrumb`, `footer-meta` — vẫn chưa nối; `DR-048` giữ nguyên trạng thái mở.
>
> **Một mục mới mở ra từ đây:** `.title-band` **chưa** gắn `data-region` và `title` chưa vào ma trận §3.1, nên cổng chưa canh dải tiêu đề. Lý do và điều kiện gắn: xem `QĐ-2026-08-24-05` mục "Còn mở".

`06` §3 hàng "Đoạn mở" và §3.1 (v2.3.0, `QĐ-2026-08-23-02`) khai `summary` nằm ở **dải sáng dưới hero, sau thanh dính**. `src/components/DetailLayout.astro` vẫn render nó vào `slot="overlay"` của `Hero` — tức vẫn đè lên ảnh.

**Vì sao không sửa luôn trong đợt này.** Vùng `dải đoạn mở` **chưa tồn tại trong mã**. Dựng nó bây giờ buộc Code phải tự bịa bề mặt cho một dải mà **Design chặng 2 sinh ra để quyết** — và chặng 1 (chữ, thang cỡ, màu) còn chưa chạy. Thang cỡ và bảng màu sắp đổi ở vòng 5, nên dải dựng hôm nay là **công chắc chắn phải làm lại**. Đó là Code đi trước Design, ngược chiều `PLAYBOOK`.

**Vì sao cổng không bắt được nó.** `summary` chưa bao giờ được gắn `data-field`, nên `luat1-post` không thấy. Đây là một trong bốn vùng chưa gắn thẻ đã khai ở **DR-048** — và là ví dụ cụ thể cho thấy DR-048 không phải chuyện hình thức: một drift thật đang sống trong đúng khoảng mù đó.

`ALIAS` của `luat1-post` **đã** biết `'dải đoạn mở' → 'summary-band'` (thêm 2026-08-24) nên cổng không đỏ vì tên vùng lạ. Nhưng đó là một id **đã khai, chưa nối** — cùng nhóm với `hero`, `hero-badge`, `breadcrumb`, `footer-meta` ở DR-048.

**Đóng khi nào:** Design chặng 2 giao bề mặt cho dải đoạn mở → QA1 → Code dựng dải, gắn `data-region="summary-band"` và `data-field="summary"`, gỡ `summary` khỏi hero overlay. Lúc đó tầng B của cổng mới canh được vùng này.

---

## DR-050 — `07` §2 mô tả ngược bộ chữ đang chạy: tiêu đề là Be Vietnam Pro, không phải Nunito

**Trạng thái:** mở. Phiếu V1 của `SPEC-2026-08-22-be-mat-vong-5` §2.2, viết 2026-08-24.

`07-DESIGN_TOKENS` §2 khai **hai** dòng family giống hệt nhau, Nunito đứng trước:

```
font.family.heading = "Nunito", "Be Vietnam Pro", system-ui, sans-serif
font.family.body    = "Nunito", "Be Vietnam Pro", system-ui, sans-serif
```

`src/styles/tokens.css:71-72` chạy:

```css
--font-display: "Be Vietnam Pro", "Nunito", system-ui, sans-serif;
--font-ui:      "Nunito", "Be Vietnam Pro", system-ui, sans-serif;
```

Dòng `body` khớp. **Dòng `heading` ngược.** Hệ quả thật hôm nay: **tiêu đề dựng bằng Be Vietnam Pro**, thân bài bằng Nunito.

**Mã không sai — đặc tả chưa theo.** `SPEC-2026-08-14-be-mat-vong-3` §3.1 đảo thứ tự **có chủ ý và đúng** (vòng 3 chọn hướng đóng khung: dùng font đã có sẵn trong repo thay vì thêm bộ thứ ba). `07` chưa được cập nhật theo. Đây là **nguồn token duy nhất của dự án đang mô tả sai thứ đang chạy** — vi phạm chính câu mở đầu của `07`.

**Lệch không dừng ở một ô bảng; nó làm hỏng cả mạch văn của §2.** Ba câu dưới đây trong `07` §2 nay đều sai hoặc gây hiểu nhầm:

| Câu trong `07` §2 | Vì sao nay sai |
|---|---|
| *"Một chữ cho cả trang: Nunito"* (tiêu đề tiểu mục) | Không còn đúng: hai vai dùng hai chữ khác nhau |
| Mục 3: *"Be Vietnam Pro là lớp dự phòng duy nhất. Không được xoá — Nunito hỏng thì chữ rơi về…"* | Be Vietnam Pro nay là chữ **chính** của tiêu đề, không phải lớp dự phòng. Câu này khiến người đọc tưởng có thể thay nó mà chỉ mất fallback |
| Mục 2: *"Lấy lại được cấp đậm 800. Nunito biến thiên 400–800"* | Đúng cho thân bài, nhưng tiêu đề nay chạy Be Vietnam Pro — trong `public/fonts/` bộ này **chỉ có file 700 và 800**, không biến thiên. Đã đối chiếu `tokens.css:77-79`: chú thích ở đó đã biết điều này (*"--font-display đều khai độ đậm, và đều là 700 hoặc 800"*), nên **mã nhất quán**; chỉ `07` là chưa |

**Phiếu này làm một dòng của DR-002 hết đúng.** DR-002 mục "Khớp đúng" liệt kê *"hai font family"* nằm trong nhóm khớp. Câu đó đúng lúc DR-002 viết (2026-08-05) và sai từ 2026-08-14. Không sửa DR-002 — nó là bản ghi của thời điểm nó; ghi chéo ở đây là đủ vết.

**Hai nợ cùng sống trong `07` §2, đã xử ở tầng số nhưng chưa xử ở tầng chữ** (`QĐ-2026-08-24-02`):

- *"Thư mục font từ ~220 KB xuống ~104 KB"* — đo lại 2026-08-24: **6 file, 89.196 byte payload = 87,1 KB**. Con số ~104 KB giữ làm bản ghi lịch sử.
- *"Nợ có chủ ý: chưa đo LCP sau **hai** lần đổi chữ"* — thực tế **ba** lần: Be Vietnam Pro → Lora → Nunito (cả hai trong ngày 2026-08-06) → đảo vai 2026-08-14.

**Vì sao không sửa `07` ngay bây giờ.** Vòng 5 chặng 1 đang cho Design đề xuất **bộ chữ mới**, và chủ dự án chốt bằng mắt trên bản dựng thật. Viết lại `07` §2 hôm nay là viết cho một bộ chữ có thể bị thay trong vài ngày tới. `SPEC-2026-08-22-be-mat-vong-5` §4 đã xếp việc này thành **V5** (`07-DESIGN_TOKENS` v2, sau khi chủ dự án chốt), tách khỏi **V1** (phiếu này — chỉ *ghi* rằng có lệch).

**Đóng khi nào:** V5 viết lại `07` §2 theo bộ chữ chủ dự án chốt ở cuối chặng 1 — kể cả khi kết quả là **giữ nguyên bộ đang chạy**, vì lúc đó vẫn phải sửa hai dòng family, ba câu văn ở bảng trên, và hai nợ số ở trên.

---

## DR-051 — `07` §2 khai thang cỡ 8 bậc, `tokens.css` chạy 14 giá trị phân biệt

**Trạng thái:** mở. Phiếu V1 của `SPEC-2026-08-22-be-mat-vong-5` §2.3, viết 2026-08-24.

`07-DESIGN_TOKENS` §2 khai `font.size.scale` = *"bậc thang runtime: 17 / 22 / 26 / 32 / 40 / 42 / 46 / 60"* — **tám** bậc.

`src/styles/tokens.css:80-104` định nghĩa **15 token cỡ chữ**, mang **14 giá trị phân biệt** (`--fs-section` và `--fs-h3` cùng bằng 32px):

`11 · 12 · 14 · 15 · 17 · 18 · 20 · 21 · 26 · 32 · 40 · 42 · 46 · 60`

**Ba kiểu lệch, không phải một:**

1. **Thiếu hẳn đầu nhỏ.** Dòng `scale` của `07` bắt đầu từ 17px, bỏ trọn bốn bậc 11 · 12 · 14 · 15. Ba trong bốn bậc đó *có* dòng riêng ở chỗ khác trong `07` (`font.size.sm` 15, `font.size.label` 14, `font.size.badge`), nên **chính `07` tự mâu thuẫn với `07`**: dòng `scale` nói thang có 8 bậc, các dòng khác trong cùng bảng khai thêm bậc mà `scale` không có. Bậc **11px** thì không có dòng nào cả.
2. **Bậc 22px không tồn tại trong mã.** `--fs-h5` = 20px, chú thích ngay tại `tokens.css:90` tự ghi *"được đẩy lên từ 22px"*.
3. **`font.size.badge` khai 12px, token tên `badge` chạy 11px.** `--fs-badge: 0.6875rem` = 11px; 12px là `--fs-xs`. Đang dùng ở ít nhất 7 chỗ (`Card.astro`, `HomeHero.astro` ×4, `NearbySection.astro`, `Footer.astro`) — tức 11px là cỡ chữ nhỏ nhất trên site, chạy trên tiếng Việt có dấu, mà đặc tả không biết.

**Hai trong ba kiểu trên DR-002 đã ghi rồi — phiếu này không nhận công phát hiện lại.** DR-002 (2026-08-05) đã có đúng hai dòng: `font.size.badge` 12px vs 11px, và `font.size.scale` bậc 22 vs 20px; và liệt kê `--fs-xs`, `--fs-card-title`, `--fs-nav`, `--fs-section`, `--fs-hero` trong nhóm *"token có trong code, không có dòng nào trong spec"*.

**Cái mới của phiếu này là phép cộng, không phải từng ô.** DR-002 ghi các mảnh rời và xếp chúng vào ba nhóm hình thức (lệch giá trị / thừa trong code / thiếu trong code). Chưa ai cộng lại và hỏi *thang này có bao nhiêu bậc, và mắt có phân biệt được không*. Cộng xong ra con số đáng kể:

**Năm bậc chen trong 6px: 15 · 17 · 18 · 20 · 21.**

Đây là **căn cứ đo được** cho than phiền của chủ dự án *"cỡ chữ lộn xộn, phân cấp mờ"* — và nó nặng hơn vẻ ngoài, vì vòng 3 đã cố giãn đúng chỗ này một lần rồi. Chú thích tại `tokens.css:83-85` ghi nguyên văn chẩn đoán của vòng 3: *"Thang cũ dồn cục ở khoảng giữa: nội dung 17, tiêu đề thẻ 18, chữ menu 18, tiêu đề nhỏ 20 — bốn bậc trong 3px nên mắt không phân biệt được cấp. Đây là gốc của 'chữ đều đều, không phân cấp'."* Vòng 3 đẩy tiêu đề thẻ 18 → 21. **Giãn xong vẫn còn năm bậc trong 6px** — tức hướng đóng khung của vòng 3 đã chạy hết mà chưa giải được vấn đề. Đó là lý lẽ trung tâm của vòng 5.

**Một lỗi số đếm trong spec, sửa để khỏi lan.** `SPEC-2026-08-22-be-mat-vong-5` §2.3 viết *"Bốn bậc nằm sát nhau trong khoảng 15–21px"* rồi liệt kê **năm** giá trị và hai câu sau lại nói *"vẫn còn năm bậc trong 6px"*. Số đúng là **năm**. Prompt vòng 5 đã ghi "năm"; phiếu này ghi "năm".

**Vì sao không sửa `07` ngay bây giờ.** Giống DR-050: chọn tám bậc nào là **quyết định thẩm mỹ thuộc bước 7**, không phải việc dọn dẹp của Cowork — `07` §0 ghi *"Design đề xuất, chủ dự án duyệt"*. Chặng 1 artboard 2 tồn tại đúng để trả lời câu đó, và nó bắt Design nêu rõ bậc nào trong thang mới thay bậc nào trong 14 bậc hiện có, bậc nào bỏ. V1 chỉ *ghi* rằng con số chạy thật lệch con số khai.

**Đóng khi nào:** V5 viết lại `font.size.*` của `07` §2 theo thang chủ dự án chốt ở cuối chặng 1 — tối đa 8 bậc, mỗi bậc gắn đúng một vai (spec §6, R-list chặng 1). Lúc đóng phải xử luôn cả ba kiểu lệch ở trên, kể cả bậc 11px chưa từng được khai.

---

## DR-052 — Hai file Be Vietnam Pro 800 ship lên nhưng chưa từng được khai `@font-face`

**Trạng thái:** **đóng một phần 2026-08-24** — còn mở hai mục. Phát hiện 2026-08-24 khi quét kho lập `docs/design-context/DESIGN_SURFACE_MAP.md`. Không thuộc phiếu V1 nào; đây là lệch **mã ↔ mã**, không phải mã ↔ đặc tả.

> **Đã sửa (2026-08-24, `BaseLayout.astro`).** Thêm **hai khối `@font-face` cấp 800** cho Be Vietnam Pro (latin-viet và vietnamese) — bốn khối thành sáu. Bôi đậm giả trên ≥12 component chấm dứt. **Đính chính 2026-08-25:** bản đầu của dòng này ghi "không tải thêm một byte nào" — **sai, và sai ngược với phép đo ở chính phiếu này**: thân phiếu khai rõ hai file "không trình duyệt nào tải chúng vì không có luật CSS nào trỏ tới". Khai `@font-face` xong thì chúng **bắt đầu** được tải: **+18.524 byte**, đưa một trang tiếng Việt dùng cả hai cấp từ 70.672 lên 89.196 byte. Vẫn dưới trần R4 140 KB. Ba câu chú thích khai ngược ở đầu khối `<style is:global>` đã viết lại. Kiểm: `grep` bản dev server phát ra cho **2** khai `font-weight: 800` và cả hai tên file 800 trên cả trang chủ lẫn trang chi tiết; `astro check` 0 lỗi 0 cảnh báo.
>
> **Còn mở, không sửa trong lượt này:**
> 1. **Preload.** `BaseLayout.astro` vẫn preload đúng một file — Nunito latin-viet, tức chữ thân bài; chữ tiêu đề vẫn không được preload. Phiếu này tự ghi *"chưa đo, nên là việc phải kiểm, không phải kết luận"*, nên chưa đụng. Đóng cùng lượt **R5** sau khi đo LCP thật. Chú thích ở dòng preload đã sửa cho khỏi khai sai.
> 2. **`--fw-900`.** Vẫn còn trong `tokens.css` và `.hubs-title` vẫn dùng. Không mặt chữ nào có cấp đó; trình duyệt kẹp về 800 — nay là 800 **thật** chứ không còn là 800 tổng hợp giả, nên tác hại đã giảm. Gỡ token là đụng `07`, thuộc lượt V5.

`public/fonts/` chứa **6** file `.woff2`. `src/layouts/BaseLayout.astro` khai **4** `@font-face` (dòng 121–152) — và grep toàn `src/` cho **0** kết quả với hai tên file còn lại:

| File | Byte | Có `@font-face`? |
|---|---|---|
| `nunito-latin-viet-var.woff2` | 39.152 | ✅ `font-weight: 400 800` |
| `nunito-vietnamese-var.woff2` | 13.040 | ✅ `font-weight: 400 800` |
| `be-vietnam-pro-latin-viet-700.woff2` | 13.348 | ✅ `font-weight: 700` |
| `be-vietnam-pro-vietnamese-700.woff2` | 5.132 | ✅ `font-weight: 700` |
| **`be-vietnam-pro-latin-viet-800.woff2`** | **13.380** | ❌ **không** |
| **`be-vietnam-pro-vietnamese-800.woff2`** | **5.144** | ❌ **không** |

**Hai hệ quả, cả hai đều thật.**

**1. 18.524 byte chết — 21% ngân sách font.** Hai file lên `public/` và lên `dist/fonts/`, tốn băng thông triển khai, và **không trình duyệt nào tải chúng** vì không có luật CSS nào trỏ tới. Đây là con số đáng kể so với trần R4 của vòng 5 (140 KB payload): gỡ hai file là lấy lại 21% mà không mất gì đang hiển thị.

**2. Cấp đậm 800 của tiêu đề là bôi đậm giả.** Sau `SPEC-2026-08-14-be-mat-vong-3` §3.1, `--font-display` là **Be Vietnam Pro** (xem `DR-050`). Ít nhất **12 component** xin `--fw-800` hoặc `--fw-900` — `Card`, `HomeHero`, `HomeTourGrid`, `HomeHubGrid`, `EntityIndex`, `HomeAreaGrid`, `DetailLayout`, `Footer`, `HomeGroupQuote`, `HomeGuideGrid`, `HomeStatsBand`, `Section`. Mặt chữ 800 **có trên đĩa nhưng không được khai**, nên trình duyệt chỉ thấy một mặt 700 và phải **tổng hợp giả** cấp đậm hơn. Bôi đậm giả làm dày nét không đều, và trên dấu tiếng Việt ở cỡ nhỏ thì dấu bị bết — đúng vùng than phiền *"chữ không hợp ngành du lịch"* mà vòng 5 đang xử.

**Khác `DR-031`, đừng gộp.** `DR-031` là thời Lora: font **chỉ có** 400–700, mã xin 800/900 nên trình duyệt kẹp xuống — thiếu **mặt chữ**. Đây là thiếu **lời khai** cho mặt chữ đã có sẵn trên đĩa. Cách xử ngược nhau: `DR-031` phải hạ mã hoặc đổi font; phiếu này chỉ cần thêm hai khối `@font-face`.

**Ba câu chú thích trong `BaseLayout.astro:115-120` nay cũng sai**, cùng loại với ba câu ở `07` §2 mà `DR-050` ghi:

> *"Nunito — MỘT chữ cho cả trang"* · *"Be Vietnam Pro ở lại làm **lớp dự phòng duy nhất**"* · *"Font biến thiên 400–800: một file phủ mọi cấp đậm, nên chỉ 2 file"*

Be Vietnam Pro nay là chữ **chính** của tiêu đề, không phải lớp dự phòng; và "chỉ 2 file" mô tả Nunito, trong khi thư mục có 6.

**Một nợ hiệu năng đi kèm, thuộc R5 vòng 5.** `BaseLayout.astro:111-113` preload đúng **một** file — `nunito-latin-viet-var.woff2` — kèm chú thích *"Một font cho cả trang nên chỉ còn một dòng preload. Cả tiêu đề lẫn thân bài đều chờ đúng file này."* Câu đó sai từ 2026-08-14: **tiêu đề chờ Be Vietnam Pro, và file đó không được preload**. H1 trong hero nhiều khả năng là phần tử LCP, nên đây là ứng viên trực tiếp cho nợ LCP đang treo ở `07` §2. Chưa đo, nên ghi là **việc phải kiểm**, không phải kết luận.

**Vì sao không sửa ngay.** Ba lối xử — (a) thêm hai `@font-face` 800, (b) gỡ hai file 800 và hạ mã xuống 700, (c) đổi bộ chữ luôn — thì lối (c) đang được cân ở **Design vòng 5 chặng 1**, và chủ dự án chốt bằng mắt. Sửa (a) hay (b) hôm nay có thể thành công bỏ đi trong vài ngày. Đây là **quyết định đánh đổi giữa byte và độ đậm**, thuộc tầng token — không phải việc dọn dẹp.

**Đóng khi nào:** cùng lượt **V5** với `DR-050`/`DR-051`. Sau khi chủ dự án chốt bộ chữ ở cuối chặng 1, chọn một trong ba lối trên, sửa `BaseLayout.astro` (khối `@font-face` + dòng preload + ba câu chú thích), rồi **đo LCP** để đóng luôn nợ R5. Nếu kết quả chặng 1 là **giữ nguyên bộ đang chạy** thì phiếu này vẫn phải xử — nó không tự tiêu.

---

## DR-053 — `07` §0 cho phép motif đất liền, `07` §1 cấm; hai câu trong cùng một file

**Trạng thái:** mở. Phát hiện 2026-08-24 khi đo kho ảnh cho `QĐ-2026-08-24-03`. Đây là lệch **đặc tả ↔ đặc tả**, trong **cùng một tài liệu** — khác họ với `DR-050`/`DR-051` (đặc tả ↔ mã).

`07-DESIGN_TOKENS` nói hai câu ngược nhau về cùng một chuyện — hoạ tiết và ảnh được gợi tới cảnh quan nào:

| Chỗ | Ngày | Nguyên văn |
|---|---|---|
| **§0 mục 1** | bổ sung **2026-06-30** | *"bản sắc Khánh Hoà không chỉ là biển; thiết kế phải cho phép **ảnh và motif gợi thêm đồng lúa, đầm phá, chân núi và rừng**, nhưng không mở thêm palette brand mới khi chưa rebrand"* |
| **§1** | chốt **2026-08-06** | *"**Cấm token và hoạ tiết đất liền.** Không thêm màu hay hoạ tiết gợi ruộng lúa, đồng bằng, núi rừng, đường bình độ."* |

**Câu ở §1 tự khai mình là bản thay thế** — nó mở đầu bằng *"Quy tắc cảnh quan biển đảo (chủ dự án chốt hướng thị giác 2026-08-06, **thay quy tắc cảnh quan cũ**)"*. Nhưng quy tắc cũ **không bị gỡ khỏi §0**; nó vẫn nằm đó, vẫn đọc như luật đang hiệu lực, và §0 là mục **"Quyết định nền (founder chốt)"** — tức là mục có thẩm quyền cao nhất trong tài liệu.

**Chồng lấn thật nằm ở chữ "motif".** §1 cấm *token và hoạ tiết*; §0 cho phép *ảnh và motif*. "Hoạ tiết" và "motif" là cùng một thứ, nên hai câu trực tiếp mâu thuẫn ở đó. Còn về **ảnh**, §1 không nói gì cả — nên hiện tại **không có luật nào** trả lời được câu hỏi "ảnh của site được phép chụp cảnh gì".

**Vì sao phiếu này không phải chuyện chữ nghĩa.** `QĐ-2026-08-24-03` vừa đưa **chuẩn chất ảnh (13b)** thành hạng mục giao nộp của Design vòng 5 chặng 1. Design sẽ phải dựa vào `07` để biết biên — và `07` đang đưa ra hai biên khác nhau. Thêm nữa, dự án Claude Design đã **tự viết một chuẩn ảnh thứ ba** trong `readme.md` của nó (*"ảnh biển đảo thật, nắng trưa…"*), không truy về được câu nào trong hai câu trên. Ba nguồn cho một câu hỏi.

**Vì sao không sửa ngay.** Sửa nghĩa là chọn một trong hai, mà đó là **quyết định định vị thương hiệu**, không phải dọn dẹp: Tour Đảo bán tour biển đảo (`00-PROJECT_BRIEF` §3), nhưng kho ảnh đang lên sóng có `attraction/thac-ta-gu` (thác), `attraction/khu-du-lich-yang-bay` (rừng), `attraction/khu-du-lich-ba-ho` (suối) — tức **nội dung đất liền đã có thật trên site**. Cấm ảnh đất liền là bỏ những trang đó khỏi bản sắc thị giác; cho phép là mở lại hướng mà `DR-002` đã gỡ. Chủ dự án chốt, không phải Cowork chốt.

**Đóng khi nào:** cùng lượt **V5**, ở cổng cuối chặng 1, cùng lúc chủ dự án chốt hạng mục **13b**. Câu chốt được ghi vào `07` §1 thành một câu duy nhất về **cả ảnh lẫn hoạ tiết**, và câu ở §0 mục 1 được sửa hoặc đánh dấu là bản ghi lịch sử. Đóng luôn nguồn thứ ba: hoặc chép câu đã chốt vào `readme.md` của dự án Design, hoặc gỡ đoạn đó khỏi đấy.

---

## DR-054 — `07` §0 khai chữ nội dung là Plus Jakarta Sans, mã chạy Nunito

**Trạng thái:** mở. Phát hiện 2026-08-24, cùng lượt rà với `DR-053`. **Không trùng `DR-050`** — xem mục cuối.

`07-DESIGN_TOKENS` §0 mục 2, nguyên văn:

> *"Hệ chữ phase 1.1 (cập nhật 2026-06-29): giữ hai font self-host hiện có… Be Vietnam Pro dùng cho heading/display; **Plus Jakarta Sans dùng cho body/UI**."*

Mã đang chạy: `src/styles/tokens.css:72` khai `--font-ui: "Nunito", "Be Vietnam Pro", system-ui, sans-serif`. Bộ chữ này bị thay ngày **2026-08-06** (`QĐ-2026-08-06-11`, thay Lora bằng Nunito) — tức câu ở §0 đã sai **18 ngày**.

**Mã còn tự ghi rằng nó đã gỡ bộ chữ đó.** Grep `src/` cho đúng **một** kết quả với "Jakarta", và đó là một câu chú thích ở `BaseLayout.astro:120`:

> *"Lora và Plus Jakarta Sans đã gỡ: không còn chỗ nào gọi tới chúng."*

Nghĩa là hai tài liệu nói ngược nhau **một cách tường minh**: mã khai đã gỡ, `07` §0 khai đang dùng. Đây không phải chuyện tài liệu chậm cập nhật một cách mơ hồ — có người đã ghi lại việc gỡ, chỉ là ghi ở mã chứ không ghi ở đặc tả.

**Vì sao đây là phiếu riêng chứ không phải phần của `DR-050`.** `DR-050` ghi *"`07` **§2** mô tả ngược bộ chữ đang chạy"* — nó bắt đúng §2, mục *"Chữ"*. §0 là mục khác: **"Quyết định nền (founder chốt qua trắc nghiệm 2026-06-12)"**, và trong thứ tự đọc của tài liệu nó đứng **trước** §2. Người đọc `07` từ đầu gặp câu sai ở §0 trước khi gặp câu sai ở §2, và hai câu sai theo hai kiểu khác nhau:

| Phiếu | Mục | Sai thế nào |
|---|---|---|
| `DR-050` | §2 | Khai **Nunito cho tiêu đề**; thật ra tiêu đề là Be Vietnam Pro — đảo vai giữa hai bộ đang có |
| **`DR-054`** | **§0 mục 2** | Khai **Plus Jakarta Sans cho nội dung**; đó là **một bộ chữ thứ ba không tồn tại trong repo** |

Khác nhau về hệ quả: sửa `DR-050` là đảo lại hai tên đã có; sửa phiếu này là **xoá tên một bộ chữ chưa từng được ship**. Gộp hai phiếu thì lúc đóng sẽ sót một trong hai chỗ — đúng kiểu sót đã xảy ra: `DR-050` viết ngày 2026-08-24 và **không ai để ý §0 cũng sai**.

**Vì sao không sửa ngay.** Cùng lý do với `DR-050`/`DR-051`/`DR-052`: **Design vòng 5 chặng 1 đang cân ba ứng viên chữ**, và chủ dự án chốt bằng mắt trên bản dựng thật. Sửa `07` hôm nay để khai đúng Nunito, rồi vài ngày nữa chốt bộ khác, là sửa hai lần. Nhưng phiếu **không tự tiêu** kể cả khi chặng 1 chốt giữ nguyên bộ đang chạy — câu ở §0 vẫn phải viết lại, vì "Plus Jakarta Sans" sai ở mọi kết cục.

**Đóng khi nào:** cùng lượt **V5** với `DR-050`, `DR-051`, `DR-052`. Khi Cowork ghi bộ chữ đã chốt vào `07`, phải sửa **cả §0 mục 2 lẫn §2** trong cùng một lần, và đối chiếu lại `BaseLayout.astro` — ba chỗ, một nguồn.

---

## DR-055 — Ảnh trong thân bài không có chỗ khai `alt`: 561 khối, 0 khối có alt

**Trạng thái:** mở. Phát hiện 2026-08-25 khi review `QĐ-2026-08-25-03`. Đây là lệch **schema ↔ đặc tả**: `06` đòi một thứ mà schema Sanity không có chỗ chứa.

`06` §3 hàng "Hero" khai *"alt bắt buộc khi có ảnh (2.0)"*, và I12 chặn publish khi `logo` đối tác thiếu alt. Nhưng ảnh **trong thân bài** thì không có field `alt` để mà thiếu:

| Đo trên `production`, tài liệu đã duyệt | Số |
|---|---|
| Tài liệu có ảnh trong `body` | **66** |
| **Tổng khối ảnh trong `body`** | **561** |
| Khối ảnh có `alt` | **0** |
| Khối ảnh có `caption` | **0** |

Nguyên nhân ở schema: `body` khai ảnh bằng `{ type: 'image' }` trần, không có khối `fields`. So sánh `mainImage` và `gallery` — hai chỗ đó khai `alt` tử tế, nên `mainImageFragment()` chiếu được và I12 chấm được.

**Vì sao phiếu này sinh ra HÔM NAY chứ không sớm hơn.** Trước `QĐ-2026-08-25-03`, ảnh trong thân bài **không render ra** (truy vấn không deref `asset->`, xem phiếu đó). Không có `<img>` nào thì không có `alt` nào để thiếu. Bản vá làm ảnh hiện lên — và cùng lúc đưa **561 ảnh không nhãn** lên trang. Đây là **nợ có sẵn bị bản vá làm lộ ra**, không phải nợ do bản vá tạo ra; nhưng hệ quả với người dùng trình đọc màn hình thì là mới.

**Không sửa được ở tầng mã.** `Body.astro` đã đọc `block.alt` (`alt={block.alt || ''}`) — nó sẽ dùng ngay khi field tồn tại. Biên tập viên **không có ô để nhập**. Sửa là thêm `fields: [{ name: 'alt', … }]` vào khối image của `body` trong schema, rồi nhập liệu cho 561 khối.

**Kèm theo: `<figcaption>` là mã chết có chủ ý.** `Body.astro` render `<figcaption>` khi khối ảnh có `caption`; không khối nào có, nên `dist/` có **0** thẻ. Giữ lại vì nó sẽ chạy đúng ngay khi schema thêm field, và vì gỡ rồi thêm lại là hai lần sửa. Ghi ra đây để lần sau không ai tưởng nó đang hoạt động.

**Quan hệ với các nợ ảnh đang có.** `SPEC-2026-08-22-be-mat-vong-5` §9 khai ba việc ảnh **V-A** (thay ảnh dưới mốc), **V-B** (rà ảnh dùng lại), **V-C** (bù `alt` — 26 ảnh, `mainImage` và `gallery`). Phiếu này **KHÔNG** thuộc V-C: V-C là nhập liệu vào field đã có, còn đây là **thêm field**. Nên nó đứng cạnh V-A/V-B/V-C, không nằm trong.

**Đóng khi nào:** thêm field `alt` (và cân nhắc `caption`) vào khối image của `body` trong `cms/schemas/`, deploy schema, rồi nhập liệu. Cần phiếu quyết định vì đụng `01-CONTENT_MODEL` và schema — `06` §6 khai rõ: *"Mọi field xuất hiện ở đây phải tồn tại trong `01-CONTENT_MODEL.md`. Cần field mới: quay lại sửa content model trước, không bịa tại đây."*

---

## DR-056 — Cổng sớm `pre-push` chưa từng chạy: hook thiếu bit thực thi, git bỏ qua trong im lặng

**Trạng thái:** **đã sửa 2026-08-25** trong cùng đợt phát hiện. Ghi lại vì cách nó ẩn mình đáng biết.

`.githooks/pre-push` tồn tại từ ADR-0010 Quyết định 4 và chạy `npm run gate`, fail thì chặn push. `scripts/install-hooks.sh` đặt `core.hooksPath=.githooks` và in *"✓ Git hooks trong .githooks/ sẽ chạy từ clone này"*.

Câu đó **sai**. Đo được:

```
$ git ls-files -s .githooks/pre-push
100644 86d6489c...        ← mode 644, KHÔNG executable
$ grep -c chmod scripts/install-hooks.sh
0
```

**Git bỏ qua hook không executable và vẫn để `git push` thành công**, chỉ in một dòng `hint:` lẫn giữa output:

> `hint: The '.githooks/pre-push' hook was ignored because it's not set as executable.`

Không mã lỗi, không cảnh báo, `push` trả về 0. Ai không đọc kỹ dòng `hint` sẽ tin rằng cổng đã chạy và đã xanh.

**Phạm vi: mọi clone.** Bit thực thi được **git lưu trong index**, nên `100644` là trạng thái của repo chứ không phải của một máy. Bất kỳ ai từng chạy `install-hooks.sh` đều nhận một hàng rào không hoạt động. Cổng sớm ở máy vì thế **chưa từng chặn một lần push nào** kể từ khi được dựng.

**Cách phát hiện.** 2026-08-25, đẩy nhánh `feat/be-mat-vong-5-va-ra-bo-cuc` với **năm cổng đang đỏ** (R3, R4, S24-AUTHORITY, control-registry, deferred). Push **thành công**. Kỳ vọng là bị chặn — chính khoảng cách giữa kỳ vọng và kết quả làm lộ dòng `hint`. Nếu hôm đó cổng xanh thì lỗi này còn ẩn tiếp.

**Đã sửa.**
1. `git update-index --chmod=+x .githooks/pre-push` → mode `100755` vào index, có hiệu lực cho mọi clone sau.
2. `scripts/install-hooks.sh` thêm `chmod +x .githooks/*` và sửa câu thông báo, để clone cũ chạy lại script là được vá.

**Bài học ghi lại, vì nó lặp với `DR-048`.** Cả hai là **cổng tồn tại nhưng không nhìn thấy gì**: `DR-048` là bốn vùng chưa gắn `data-region` nên `luat1-post` mù; đây là hook chưa executable nên git mù. Trong cả hai ca, bảng điều khiển báo xanh vì **không có ai kiểm**, chứ không phải vì đã kiểm và đạt. `CLAUDE.md` §6 viết *"mặc định của cổng là không đạt nếu không có bằng chứng"* — hai phiếu này là hai kiểu bằng chứng giả khác nhau.

**Hệ quả còn mở, không sửa ở đây.** Hook nay chạy thật, nên **lần push tới sẽ bị chặn** bởi năm cổng đỏ đang có. Chúng là nợ dữ liệu đã xếp đợt 4D (`SPEC-2026-08-22-be-mat-vong-5` §9), không phải nợ của đợt này — nhưng từ nay chúng chặn đường phát hành thật sự, chứ không còn chỉ nằm trong báo cáo.

---

## DR-057 — R4 hreflang không phải nợ dữ liệu: một vị từ GROQ so `null` bị bốn phiếu quyết định và spec §9 dán nhãn sai suốt nhiều tuần

**Trạng thái:** **đã sửa 2026-08-25** (`fetchArticleAlternateSlugs`, `src/lib/sanity.ts:266-305`). Ghi lại vì cách phân loại sai kéo dài nhiều đợt là điều đáng biết, không chỉ bản thân lỗi.

`fetchArticleAlternateSlugs` dựng vị từ `translationGroup._ref == *[_id == $id][0].translationGroup._ref` để tìm bản dịch cùng nhóm. Không có bài nào trong `production` đã gắn field `translationGroup`, nên vế trái luôn `null`. Vế phải cũng `null` vì cùng lý do. GROQ so `null == null` là **đúng**, nên vị từ khớp mọi bài đã duyệt, không chỉ bài cùng nhóm. Vòng lặp bên dưới gán `alternates[language]` theo thứ tự kết quả trả về, cái cuối thắng — nên mỗi bài (trừ bài "thắng" cuối cùng) nhận một `vi`/`x-default` alternate trỏ sang **một bài khác**, gây vừa thiếu hreflang self vừa hreflang không đối xứng.

**Số đo, 2026-08-25.**

| Đo | Kết quả |
|---|---|
| Bài đã duyệt có `translationGroup` (`production`) | **0** |
| Bài đã duyệt đủ điều kiện đối chiếu (`slug` + `language`) | **18** |
| Dòng lỗi `R4` trước sửa (`gate:all`) | **51**, trên **18** trang `/cam-nang/` |
| Dòng lỗi `R4` sau sửa | **0** |

**Vì sao cổng bắt đúng triệu chứng mà không ai sửa root cause suốt nhiều tuần.** `R4` (`r3-r4-post.ts`) đã đỏ đúng cách kể từ khi có nội dung `/cam-nang/` — đây không phải cổng mù kiểu `DR-048`/`DR-056`, nó báo lỗi thật, đúng trang, đúng ngôn ngữ. Nhưng **bốn phiếu quyết định** và **spec §9** đọc "R4 còn đỏ" rồi xếp chung nó vào nhóm "nợ dữ liệu đợt 4D" mà không mở lại truy vấn để hỏi vì sao:

1. `QĐ-2026-08-22-02` — *"lỗi dữ liệu cổng lộ ra (... R4 hreflang cẩm nang, S24 người duyệt)"*.
2. `QĐ-2026-08-22-05` — *"Nợ dữ liệu đợt 4D cũng còn nguyên: ... hreflang R4, người duyệt S24"*.
3. `QĐ-2026-08-24-05` — *"Cổng đỏ còn lại | R3, R4, ... đều là nợ dữ liệu URL/hreflang/metadata tác giả trên trang cẩm nang, khớp đúng danh sách spec §9 khai"*.
4. `QĐ-2026-08-25-01` — *"45/45 lỗi R4 đều ở `/cam-nang/`, không lỗi nào chạm template đã sửa. Khớp danh sách nợ spec §9"*.

Và `SPEC-2026-08-22-be-mat-vong-5` §9: *"Năm cổng đang đỏ ở `gate:all`... Đều là nợ dữ liệu hoặc nợ cũ, đã xếp vào đợt 4D."* Số lỗi R4 còn được theo dõi qua từng đợt (45 → 42 ở `QĐ-2026-08-25-02`, quy cho nội dung Sanity đổi giữa hai lần dựng) — nhưng luôn ở mức "đếm và ghi nhận", chưa lần nào ở mức "đọc thông điệp lỗi và hỏi vị từ nào tạo ra nó". Nếu R4 thật sự là nợ dữ liệu (thiếu bản dịch), việc gắn `translationGroup` cho 18 bài mới là việc phải làm — không ai làm việc đó, vì nhãn "nợ dữ liệu" ngụ ý "chờ biên tập viên nhập liệu", trong khi lỗi thật nằm trong bốn dòng GROQ.

**Bài học.** Một cổng đỏ lâu ngày, có bằng chứng, có số đo, có tên hạng mục "nợ dữ liệu" đi kèm — vẫn có thể là lỗi logic đội lốt nợ dữ liệu. Nhãn tồn tại càng lâu và càng được nhiều phiếu quyết định lặp lại, nó càng có vẻ đáng tin mà không ai còn kiểm lại. `CLAUDE.md` §6: *"mặc định của cổng là không đạt nếu không có bằng chứng"* — áp cho cả việc phân loại một cổng đỏ: dán nhãn "nợ dữ liệu" cũng cần bằng chứng (đo tận vị từ/truy vấn tạo ra lỗi), không phải suy ra từ việc cổng đỏ nhiều đợt liên tiếp.
