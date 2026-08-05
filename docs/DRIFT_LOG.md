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

**Trạng thái:** mở. Phát hiện 2026-08-06 khi Claude Design dựng mockup pha F; Cowork đã kiểm chứng lại.

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
