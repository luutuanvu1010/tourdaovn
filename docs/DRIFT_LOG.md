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

**Trạng thái:** mở — rà lại 2026-08-25, thu hẹp từ 8 xuống **6** mục lệch giá trị. (Trước đó: "mở, sẽ tự tiêu khi viết lại bộ token cho tourdaovn." Bộ token đã được viết lại qua nhiều đợt; phiếu không tự tiêu theo.)

**Đo lại 2026-08-25.** Bảng "Lệch giá trị" tám dòng dưới đây nay còn **sáu** dòng sống:

| Token | `07-DESIGN_TOKENS` | `tokens.css` | 2026-08-25 |
|---|---|---|---|
| `color.surface` | `#FFFFFF` (07:39) | `#FFFFFF` (css:23) | ✅ khớp — `QĐ-2026-08-06-04` |
| `color.surface.alt` | `#EAF2F8` (07:40) | `#EAF2F8` (css:24) | ✅ khớp — `QĐ-2026-08-25-04` đổi cả hai bên |
| `font.size.badge` | 12px | `--fs-badge: 0.6875rem` = 11px (css:80) | ❌ còn — `check:token-parity` in VÀNG |
| `font.size.scale` bậc 22 | 22px | `--fs-h5: 1.25rem` = 20px (css:90) | ❌ còn — nay nằm trong phạm vi `DR-051` |
| `shadow.raised` | `0 4px 12px rgba(15, 23, 42, 0.10)` (07:149) | `0 6px 24px -8px rgba(0,91,150,.15), 0 2px 6px rgba(26,32,44,.05)` (css:134) | ❌ còn |
| `motion.fast` | 150ms (07:169) | `--m-fast: 180ms` (css:148) | ❌ còn |
| `motion.base` | 250ms (07:170) | `--m-base: 300ms` (css:149) | ❌ còn |
| `motion.easing` | `cubic-bezier(0.2, 0, 0, 1)` (07:171) | `--m-ease: ease` (css:150) | ❌ còn |

**Bốn dòng cuối bảng không có cổng nào canh.** `npm --prefix scripts run check:token-parity` **không so** `shadow.*` và `motion.*` — nó bỏ qua chúng trong im lặng rồi vẫn in `XANH`. Đó là `DR-059`, mở cùng ngày. Nghĩa là bốn mục đó chỉ sống trong phiếu này, không bộ kiểm nào đỏ vì chúng.

**Mục "Token có trong code, không có dòng nào trong spec" — nhóm cảnh quan đất liền đã gỡ.** `QĐ-2026-08-06-04` (`docs/DECISIONS.md:522`) gỡ `--c-land-rice`, `--c-land-forest`, `--c-land-mist`, `--c-sand-paper`, `--pattern-rice-lines`, `--pattern-contour-lines`, `--landscape-page-bg`, và tự ghi *"Đóng phần lớn DR-002"*. Kiểm 2026-08-25: `grep -rn -- "--c-land-\|--pattern-rice\|--pattern-contour\|--landscape-page-bg\|--c-sand-paper" src/` → **0 kết quả**. Các nhóm còn lại (nền thẻ, footer, hero fallback, bậc chữ thêm, token component) **chưa đo lại ở lượt này** — đếm cho đúng cần một phép quét hai chiều mà `check:token-parity` chưa làm được (xem `DR-059`).

**Mục "Token có trong spec, không thành biến trong code" — hai trong ba đã hết là lệch.** `measure` và `letter-spacing` nay được khai **cố ý** ở `KHONG_CO_BIEN` (`scripts/check-token-parity.mjs:54-59`), kèm lý do từng mục. Mục thứ ba, `space.section`, không nằm trong danh sách đó — nó rơi vào đúng khoảng mù của `DR-059`.

**Không gộp vào `DR-051` ở đây.** Hai dòng `font.size.badge` và `font.size.scale` bậc 22 trùng phạm vi với `DR-051`. Gộp phiếu là một quyết định, và `DR-051` đang là phiếu V1 chờ vòng 5 viết lại `07`. Ghi chéo để không ai sửa hai nơi rồi tưởng là hai việc.

**Nguyên văn phần dưới giữ làm bản ghi** — các con số trong đó là của lượt đo 2026-08-05, đọc kèm bảng trên.

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

**Trạng thái:** mở phần "Kèm theo" — **đóng một nửa 2026-08-25**: phần xung đột màu nền **ĐÓNG** từ 2026-08-06; phần §B của `08` chấm bài bằng đáp án nhatrangtravel **CÒN MỞ**, và nay lệch nặng hơn lúc viết phiếu. (Trước đó: "mở, cần chủ dự án hoà giải" — thực tế đã hoà giải từ 2026-08-06, chỉ sổ này chưa cập nhật.)

**Phần đã đóng — xung đột nền.** `QĐ-2026-08-06-04` (`docs/DECISIONS.md:505-509`): chủ dự án chốt **nền trắng thuần**; `07-DESIGN_TOKENS` thắng, `08-QA_CHECKLIST` B4 sửa theo. Hai file đã phản ánh:

- `07-DESIGN_TOKENS.md:39` — `color.surface | #FFFFFF | nền trang mặc định — **chủ dự án chốt 2026-08-06, giải DR-003**`.
- `08-QA_CHECKLIST.md:71` — nay đòi `#FFFFFF`; dòng 74 ghi nguyên văn *"**DR-003 đã giải 2026-08-06.** … Chủ dự án chốt **nền trắng**; `07-DESIGN_TOKENS` thắng, mục này sửa theo."*

Chỉ **nền chính** đã phản ánh. Dòng 72 ngay bên dưới thì chưa — xem bảng phần còn mở.

**Phần còn mở — §B vẫn là đáp án của một dự án khác.** Chính `QĐ-2026-08-06-04` đã hoãn phần này chứ không đóng: `docs/DECISIONS.md:526` — *"`08-QA_CHECKLIST` §B còn giá trị hardcode ở mục liệt kê, cần rà lại khi Design xuất mockup."* Đo 2026-08-25:

| `08-QA_CHECKLIST` | Đòi | Đang chạy | Lệch |
|---|---|---|---|
| dòng 52 (§B1) | accent cam `#C2410C` | `--c-accent: #C0392B` (css:18); và **đổi theo bộ giao diện**: `#B45309` ở `cat-bien` (css:172), `#BE123C` ở `ngoc-lam` (css:191) | ❌ sai hai đời — đổi giá trị (`QĐ-2026-08-06-04`) rồi thành ba giá trị theo bộ (`QĐ-2026-08-06-05`). Một hex cứng không còn mô tả nổi thứ đang chạy |
| **dòng 72 (§B4)** | khối xen kẽ `--c-surface-alt` = **`#F8FAFC`** | `--c-surface-alt: #EAF2F8` (css:24), theo `07`:40 — **`QĐ-2026-08-25-04`** đổi từ `#F8FAFC` vì giá trị cũ chỉ cách nền trắng **1,046** nên khối xen kẽ đọc thành một mảng trắng liền; nay **1,132** | ❌ **thêm 2026-08-25 (vòng sửa 1).** Trong core-specs đây là **nơi duy nhất** còn khẳng định giá trị cũ, và trước lượt rà này **không phiếu nào ghi**. Hai gói prompt bàn giao (`PHA-F-…:602/881`, `PHA-F2-…:602/881`) cũng còn `#F8FAFC` nhưng là bản chụp lưu trữ, không phải luật đang hiệu lực |
| dòng 58 (§B2) | sand `#F5A623` | `--c-sand: #F5A623` (css:21) | ✅ còn đúng |
| dòng 64 (§B3) | coral `#E8654E` | `--c-coral: #E8654E` (css:30) | ✅ còn đúng |
| dòng 79 (§B5) | body, label, badge dùng `--font-ui` (**Plus Jakarta Sans**) | `--font-ui: "Nunito", "Be Vietnam Pro", system-ui` (css:72). Plus Jakarta Sans **đã gỡ hẳn** khỏi kho — `07`:126 *"Gỡ hẳn Lora và Plus Jakarta Sans vì không còn chỗ nào gọi tới"*; `public/fonts/` chỉ còn Nunito + Be Vietnam Pro | ❌ cổng đang chấm bài bằng một font không còn tồn tại trong repo |
| dòng 78 (§B5) | heading dùng `--font-display` (**Be Vietnam Pro**), weight 700-900 | `--font-display: "Be Vietnam Pro", "Nunito", …` (css:71) | ◐ khớp **mã**, nhưng ngược `07`:101 (khai Nunito đứng trước) — đó là `DR-050`, không phải phiếu này. Vế "weight 700-900" thì `07`:103 đã khai 900 vô tác dụng (`DR-031`) |

Nói cách khác: trong bốn giá trị nhatrangtravel phiếu này nêu, **hai vẫn trùng giá trị đang chạy** (sand, coral), **một đã hết hiệu lực** (`#FBF8F3`, đóng cùng phần trên), và **một sai nặng hơn trước** (`#C2410C`). Bộ chữ thì `08` §B5 đang khai một font đã bị gỡ khỏi kho.

**Dòng 72 là loại khác, và đáng lo hơn.** Bốn mục trên là di sản chép từ nhatrangtravel — biết trước là lệch. Dòng 72 thì **từng đúng**: nó khớp `07` cho tới `QĐ-2026-08-25-04` hôm nay. Nghĩa là `08` không được cập nhật cùng lượt với `07` và `tokens.css`, và không cổng nào bắt — `check:token-parity` chỉ so `07` với CSS, chưa bao giờ đọc `08`. Đây đúng cơ chế mà chính phiếu này cảnh báo ở phần "Kèm theo", nay tự tái diễn bằng một quyết định mới.

**Không sửa ở đây.** `08-QA_CHECKLIST` là core spec đã phê chuẩn; sửa §B đụng R9 và cần chủ dự án duyệt (`CLAUDE.md` §1). Lượt rà này chỉ ghi nhận. **Điều kiện đóng nốt:** một quyết định viết lại §B1 theo cơ chế bộ giao diện (không hex cứng), §B4 dòng 72 theo giá trị `07` hiện hành, và §B5 theo bộ chữ thật.

- `07-DESIGN_TOKENS.md` §1: `color.surface = #FFFFFF`, "nền trang mặc định".
- `08-QA_CHECKLIST.md` dòng 71: "`body` background = `--c-surface` (#FBF8F3)"; dòng 73: "Không có vùng nào dùng nền trắng thuần cho body".

Đây là xung đột cùng tầng, không phải code lệch spec. Cả hai đều là core spec đã phê chuẩn. Không tác nhân nào được hoà giải bằng suy đoán, theo `GOVERNANCE` 3.5.

Kèm theo: `08-QA_CHECKLIST` §B hardcode màu và font của nhatrangtravel (`#C2410C`, `#F5A623`, `#E8654E`, `#FBF8F3`, "Be Vietnam Pro", "Plus Jakarta Sans") cùng các class cụ thể. Nếu không viết lại §B khi đổi bộ token, QA sẽ chấm bài bằng đáp án của dự án khác.

---

## DR-004 — `05-URL_MAP` mô tả một site khác

**Trạng thái:** mở — rà lại 2026-08-25: **y nguyên, không mục nào tự tiêu.** (Trước đó: "mở, xử ở pha C." Pha C đã qua; phiếu thì không.)

**Đo 2026-08-25** trên `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md` (140 dòng, chưa từng có bản v2):

| Mục của phiếu | Kiểm | Kết quả |
|---|---|---|
| Canonical host | dòng 37 | vẫn `https://nhatrangtravel.net` |
| Prefix `am-thuc`, `nha-hang`, `dac-san`, `su-kien` | dòng 47, 52, 53, 57 (bảng §1.2) | vẫn còn cả bốn |
| Thiếu `tat-ca` | `grep -c "tat-ca"` toàn file | **0** — hub thứ tư đang chạy vẫn không có dòng nào |
| Năm cột ngôn ngữ | dòng 8, 26, 41 | vẫn năm, trong khi `src/site.config.ts:130` khai `langs = ['vi']` |

**Vì sao không tự tiêu, dù `06` đã lên v2.** `06-BINDING_MAP` được viết lại và tự khai đóng `DR-005` (`06`:21), nhưng `05` chưa có bản tương ứng: nó vẫn mang khối `CORE SPEC · Nguồn: nhatrangtravel/project/05-URL_MAP-and-DB_SCHEMA.md` ở dòng 4 và nhãn `🔧 SITE-SPECIFIC` ở dòng 15 — tức bản gốc chưa qua khâu thay phần riêng. Sửa `06` không làm `05` đúng theo.

**Cần gì để quyết.** Một quyết định phê chuẩn `05` v2 cho tourdaovn: canonical host `tourdao.vn`, bảng §1.2 rút về một cột `vi`, bỏ bốn nhánh đang tắt, thêm `tat-ca`. Đây là core spec đã phê chuẩn nên không tác nhân nào sửa được bằng một lượt rà sổ (`CLAUDE.md` §1, R9).

- Canonical host khai `https://nhatrangtravel.net`. Site chạy `tourdao.vn`.
- Bảng prefix §1.2 còn `am-thuc`, `nha-hang`, `dac-san`, `su-kien`. Bốn nhánh này đã tắt trong `src/site.config.ts`.
- Thiếu `tat-ca` (hub-all), là hub thứ tư đang thật sự chạy.
- Năm cột ngôn ngữ trong khi `langs = ['vi']`.

Ở chỗ này code đúng hơn spec: `ROUTE_TABLE` trong `src/lib/routes.ts` phản ánh đúng phạm vi hiện tại.

---

## DR-005 — `06-BINDING_MAP` khai loại trang không tồn tại và thiếu loại trang đang chạy

**Trạng thái:** **ĐÓNG 2026-08-25** — đã giải ở `06-BINDING_MAP` v2 (soạn 2026-08-05, v2.0.0 duyệt 2026-08-06 theo `QĐ-2026-08-06-06`); sổ này chưa cập nhật suốt từ đó. Bằng chứng trực tiếp: `docs/core-specs/06-BINDING_MAP.md:21` — *"**Đổi gì ở v2.** Đóng DR-005 (khai loại trang không tồn tại, thiếu loại trang đang chạy)…"*. (Trước đó: "mở, xử ở pha E.")

**Kiểm từng gạch đầu dòng của phiếu, 2026-08-25 — không nhận lời tự khai của `06` làm bằng chứng duy nhất:**

| Mục của phiếu | Kiểm trên `06-BINDING_MAP.md` | Kết quả |
|---|---|---|
| §5.3 tên "Bốn hub" nhưng liệt `/am-thuc/` | dòng 298 | `### 5.3 Bốn hub (/kham-pha/, /luu-tru/, /di-lai/, /tat-ca/)`. `grep -c "am-thuc"` toàn file = **0** |
| §4.5 Restaurant, §4.6 Specialty, §4.9 Event mô tả entity đang tắt | §4 không còn ba mục này; chuyển xuống §8.1 (dòng 423), §8.2 (438), §8.3 (450) dưới đề "Phụ lục — entity đang tắt" (417) | ✅ |
| §5.5 index sự kiện | dòng 320 | *"Đã chuyển xuống phụ lục §8 — entity `event` đang tắt trong `src/site.config.ts`."* |
| Không có bảng riêng cho trang chủ `/` | dòng 326 | `### 5.7 Trang chủ / (SiteHome)` |
| `/lo-trinh-don-khach/` không có bảng ánh xạ | dòng 362 | `### 5.9 Trang lộ trình đón khách /lo-trinh-don-khach/` |
| §7 tuyên bố sai "16 mẫu URL" | dòng 393 | Câu đó đã bị rút, và bản mới **nêu đích danh phiếu này**: *"Bản v1 tuyên bố '16 mẫu URL đều có bảng ánh xạ' — câu đó khi ấy vừa thừa vừa thiếu (DR-005), nên v2 viết lại thành danh sách kiểm được thay vì một lời khẳng định."* |

**Không kéo theo `DR-004`.** `05-URL_MAP` vẫn mô tả một site khác; hai phiếu tách bạch, đóng phiếu này không đóng phiếu kia.

**Một cảnh báo hiệu lực giữ nguyên, không thuộc phiếu này.** `06`:29 vẫn ghi bộ kiểm máy `g3` không đọc thẳng file này (`DR-027`), nên `g3` xanh không phải bằng chứng cho `06` đúng. Kết luận đóng ở trên dựa trên đọc file, không dựa trên `g3`.

- §5.3 tên là "Bốn hub" và liệt `/am-thuc/`. Hub thứ tư thật là `/tat-ca/`, không có dòng nào trong file.
- §4.5 Restaurant, §4.6 Specialty, §4.9 Event, §5.5 index sự kiện: mô tả bốn loại trang thuộc entity đang tắt.
- Không có bảng riêng cho trang chủ `/`. Trang chủ hiện là loại trang riêng với component `SiteHome`.
- `/lo-trinh-don-khach/` không có bảng ánh xạ.
- §7 tuyên bố "mọi loại trang trong cây URL của 05 đều có bảng ánh xạ, 16 mẫu URL". Câu này hiện sai, vừa thừa vừa thiếu.

---

## DR-006 — `00-PROJECT_BRIEF` là của nhatrangtravel, và sai đã rò xuống code

**Trạng thái:** mở một chuỗi ở `src/lib/homepage.ts` — **đóng một nửa 2026-08-25**: phần đặc tả **ĐÓNG**, hai trong ba chỗ mã **ĐÓNG**; chỗ thứ ba còn sống, nhưng tính chất của nó đã đổi. (Trước đó: "mở, xử ở pha A.")

**Phần đã đóng — đặc tả.** `docs/core-specs/00-PROJECT_BRIEF.md:16` ghi thẳng: *"**Đóng:** DR-006 phần đặc tả."* Bản v2.0.0 viết lại toàn bộ nội dung cho tourdaovn 2026-08-06 (`00`:13-14), và khối đầu file khai rõ *"Bản v1 (nhatrangtravel) xem lịch sử git — không giữ song song để khỏi hai nguồn sự thật"* (`00`:6) — tức không để lại nguồn thứ hai.

**Phần đã đóng — hai trong ba chỗ mã.**

| Chỗ phiếu nêu | Kiểm 2026-08-25 |
|---|---|
| `src/components/SiteHome.astro:36` — "Cổng thông tin du lịch Nha Trang…" | `grep -rn "Cổng thông tin du lịch Nha Trang" src/` → **0 kết quả** |
| `src/pages/index.astro:37` — cùng chuỗi trong meta description | dòng 47 nay là `const metaDescription = brand.description` |

Nguồn duy nhất nay là `src/site.config.ts:94-96`, và chú thích ngay trên nó (`site.config.ts:85-88`) ghi đúng lý do: *"ĐÂY LÀ NƠI DUY NHẤT: trước đây câu này bị chép ở 3 file khác nhau và lệch nhau (DR-006)."* Nội dung lấy theo `00-PROJECT_BRIEF` §1 và §3 — đúng chiều thẩm quyền.

**Phần còn mở — một chuỗi, nhưng không còn là cùng một lỗi.** `src/lib/homepage.ts:57` vẫn là `overview: 'Tổng quan về Nha Trang'` (phiếu ghi dòng 59; mã đã dịch chuyển). Cái sai mà phiếu này cảnh báo — *"site đang tự giới thiệu sai bản chất doanh nghiệp"* — thì **không còn**: đây là tiêu đề mục tổng quan điểm đến, và điểm đến chính đúng là Nha Trang. Cái còn lại là **tên điểm đến viết cứng trong copy** trong khi điểm đến vốn là cấu hình. Nợ đó đã có chỗ đứng riêng từ trước: `docs/GOI-2-KET-QUA.md:68` xếp nó vào mục #9 bảng "còn nợ" của `ADR-0021` (*"~120 dòng mô tả 'ở Nha Trang', 'của Khánh Hòa' trong `uiCopy.ts` … nhiều công, ít rủi ro, làm cuối"*).

**Cần gì để đóng nốt.** Một trong hai, và cần người quyết: (a) dọn mục #9 của `ADR-0021` rồi đóng phiếu này; hoặc (b) chốt rằng phần copy đó thuộc hẳn nợ `ADR-0021` và đóng `DR-006` ngay bây giờ. Lượt rà này **không** tự chọn — để mở một dòng rẻ hơn đóng nhầm.

Brief tự khai "gần như toàn bộ nội dung là của nhatrangtravel, cần viết lại khi dựng site khác". Nhưng sai này không dừng ở tài liệu, nó đang hiển thị cho người dùng:

- `src/components/SiteHome.astro:36` — "Cổng thông tin du lịch Nha Trang…"
- `src/pages/index.astro:37` — cùng chuỗi, trong meta description
- `src/lib/homepage.ts:59` — "Tổng quan về Nha Trang"

Trong khi `src/site.config.ts` khai `brand.legalName = 'Công ty TNHH Tour Đảo'`. Site đang tự giới thiệu sai bản chất doanh nghiệp.

---

## DR-007 — Menu điều hướng hardcode, lệch hợp đồng đã duyệt

**Trạng thái:** **ĐÓNG 2026-08-25** — đã giải bởi `ADR-0023` (điều hướng theo dòng dịch vụ) và `06-BINDING_MAP` v2; sổ này chưa cập nhật. (Trước đó: "mở, xử ở pha E và G.")

**Bằng chứng ở tầng quyết định.**

- `docs/adr/ADR-0023-dieu-huong-theo-dong-dich-vu.md:102` — *"**Tích cực.** Điều hướng có một nguồn sự thật duy nhất, đóng DR-007 và phiếu nợ đã ghi ở…"*
- `docs/DECISIONS.md:243` — *"**Ba việc trả kèm.** DR-007 (điều hướng hardcode ba chỗ)…"*
- `docs/core-specs/06-BINDING_MAP.md:21` — *"Đóng … DR-007 phần đặc tả."*

**Bằng chứng ở tầng mã — cả ba chỗ phiếu nêu, đo 2026-08-25.**

| Chỗ phiếu nêu | Kiểm |
|---|---|
| `Header.astro:24` — `['hub-kham-pha','hub-luu-tru','hub-di-lai']` | dòng 24 nay là chú thích *"Menu đọc từ `nav` trong site.config.ts — nguồn duy nhất (ADR-0023, DR-007)"*; mảng cứng không còn |
| `Footer.astro:32-33` — `['attraction','experience','tour']` và `['hotel','resort']` | dòng 29 *"Chân trang đọc cùng một `nav` với menu chính (ADR-0023, DR-007)"*; dòng 32 `const navItems = resolveNav(uiLang, contact?.zaloUrl, 'footer')`. Hai mảng cứng không còn |
| `src/lib/homepage.ts` — `quickLinks` lặp năm lần | `grep -rn "quickLinks" src/` → **0 kết quả** |

`nav` sống ở `src/site.config.ts:288` và được phân giải qua `resolveNav` / `autoRouteLinks` trong `src/lib/routes.ts:211-235`, đọc `ROUTE_MAP` — không nơi nào chép lại danh sách. Bản đối chứng mà phiếu nêu (`HomeHubGrid.astro` đọc config) nay là cách làm chung: `HomeHubGrid.astro:14-15` — *"Hub nào hiện ở đây do src/site.config.ts quyết định, không khai lại tại chỗ"* → `const hubEntities = navHubs`.

Dòng mà phiếu trích ở `01-CONTENT_MODEL.md` nay là **ghi chú giải quyết**, không còn là phiếu nợ: dòng 568 — *"Điều hướng có nguồn riêng là `ROUTE_MAP` (ADR-0023, DR-007)."*

**Còn lại quanh hub, nhưng KHÔNG thuộc phiếu này** — ghi ra để không ai đọc phiếu đóng rồi tưởng đã dọn sạch: `HomeHubGrid.astro:17-20` viết cứng ba khoá hub để chọn màu nền icon, và `HOME_COPY` giữ `hubDescriptions` cho năm ngôn ngữ trong khi `langs = ['vi']`. Cả hai là **trình bày và copy**, không phải hợp đồng điều hướng — `06` §2 chỉ khai "Header điều hướng | config (build)", và hợp đồng đó nay đã được giữ.

`06-BINDING_MAP` §2 khai "Header điều hướng | config (build)". Code hardcode ở ba chỗ:

- `src/components/Header.astro:24` — `['hub-kham-pha','hub-luu-tru','hub-di-lai']`
- `src/components/Footer.astro:32-33` — `['attraction','experience','tour']` và `['hotel','resort']`
- `src/lib/homepage.ts` — `quickLinks` lặp lại năm lần, mỗi ngôn ngữ một lần

Bản đối chứng cách làm đúng đã có trong repo: `src/components/HomeHubGrid.astro:5` đọc `navHubs` từ `site.config.ts`.

`01-CONTENT_MODEL.md` dòng 567 đã tự ghi nhận đây là phiếu nợ chưa xử, vi phạm quy tắc một nguồn sự thật R3.

---

## DR-008 — `DESIGN.md` được hai file luật trích dẫn nhưng không tồn tại

**Trạng thái:** mở — phép kiểm mà kế hoạch khai **đã chạy 2026-08-25 và KHÔNG sạch**. `docs/plans/2026-08-25-dong-no-ky-thuat.md:539` hẹn *"kiểm bằng `grep -rn "DESIGN.md" docs/ src/`. Nếu 0 kết quả thì đóng"* — kết quả là **12 trích dẫn còn sống trên 6 file**, trong đó có **đúng hai dòng luật** đã sinh ra phiếu này. Không đóng.

**Lệnh trong kế hoạch quét thiếu, nên số đếm phải nêu rõ phạm vi.** `grep -rn "DESIGN.md" docs/ src/` **không chạm `playbook/`** — mà `GOVERNANCE.md` nằm ở đó. Chạy đúng lệnh ấy sẽ bỏ sót chính hai dòng luật là lý do phiếu tồn tại. Phạm vi thật đã quét: `playbook/ src/ docs/core-specs/`; quy tắc đếm: **bỏ những dòng chỉ kể lại chuyện DR-008** (bản thân sổ này, `docs/plans/`, và các dòng ghi "đã gỡ"). Số ra:

| File | Dòng | Số |
|---|---|---|
| `playbook/GOVERNANCE.md` | 98, 109 | 2 — **hai dòng luật** |
| `docs/core-specs/DESIGN_PATTERNS.md` | 10, 20, 49 | 3 |
| `docs/core-specs/08-QA_CHECKLIST.md` | 110, 118, 225 | 3 |
| `playbook/ai/PROMPT_FACTORY.md` | 158 | 1 |
| `src/styles/tokens.css` | 91 | 1 |
| `src/components/MapView.astro` | 5 | 1 |

Không tính `docs/core-specs/README.md:48` — dòng đó **mô tả việc cố ý bỏ** `DESIGN.md` ra ngoài bộ core-specs, không trỏ tới nó như một nguồn. (Lượt rà đầu ghi "11 trên 7 file"; đếm lại ở vòng sửa 1 theo quy tắc trên ra **12 trên 6**.) (Trước đó: "mở, xử ở pha F." Pha F đã qua; phiếu thì không.)

**Đo 2026-08-25** — `grep -rnE "(^|[^A-Za-z0-9-])DESIGN\.md" docs/ src/ playbook/`, đã loại tên file `*-CLAUDE-DESIGN.md` / `*-BAN-GIAO-DESIGN.md` và các câu tự nói về phiếu này:

| File | Dòng | Loại |
|---|---|---|
| `playbook/GOVERNANCE.md` | 98 | **luật** — điều kiện vào QA1 vẫn đòi *"Mockup đã xuất; BINDING_MAP và DESIGN.md đã duyệt"* |
| `playbook/GOVERNANCE.md` | 109 | **luật** — điều kiện ra QA2 mục (5) vẫn là *"không hardcode token ngoài DESIGN.md"* |
| `playbook/ai/PROMPT_FACTORY.md` | 158 | luật — P1 liệt `DESIGN.md` trong "4 file" |
| `docs/core-specs/08-QA_CHECKLIST.md` | 110, 118, 225 | core spec — bắt đối chiếu "DESIGN.md §5" và "§5.10" |
| `docs/core-specs/DESIGN_PATTERNS.md` | 10, 20, 49 | core spec — vẫn dẫn `project/DESIGN.md` |
| `src/styles/tokens.css` | 91 | **mã** — *"Shared component tokens (trích từ DESIGN.md §5)"* |
| `src/components/MapView.astro` | 5 | **mã** — *"DESIGN.md §5.9: height 320px, radius md"* |

**Trong bốn "tham chiếu chết" phiếu này nêu, mới vá được một — và vá chưa trọn file.** `tokens.css` dòng 2 đã sửa: dòng 10 nay ghi *"Tham chiếu cũ 'DESIGN.md' đã gỡ — file đó chưa bao giờ tồn tại (DR-008)"*. Nhưng **chính file đó còn dòng 91**, nên câu "đã gỡ" ở dòng 10 hiện không đúng cho cả file — một câu nói dối nhỏ nằm ngay trong bản vá. `DESIGN_PATTERNS.md` 10/20/49 chưa động tới. Phép quét lần này còn lộ thêm hai chỗ phiếu chưa từng đếm: `08-QA_CHECKLIST.md` (3 dòng) và `MapView.astro`.

**Lệch tên ở tầng luật vẫn nguyên:** `playbook/PLAYBOOK.md:24` gọi artifact bước 7 là `DESIGN_TOKENS + mockup`; `playbook/GOVERNANCE.md:98` gọi là `DESIGN.md`. Hai tên cho một thứ, đúng như phiếu ghi từ đầu.

**Cần gì để quyết.** Một quyết định ở tầng `GOVERNANCE` / `PLAYBOOK` chốt **một** tên cho artifact bước 7 — thứ thực tế đang tồn tại là `07-DESIGN_TOKENS.md` cộng mockup — rồi sửa 11 chỗ trên theo. Đây là sửa luật gốc: `CLAUDE.md` §5 bắt dừng và xin quyết định ở đúng tầng, lượt rà sổ này không có thẩm quyền đó.

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

**Trạng thái:** **xử 2/3 và đã bật lại hook 2026-08-27** (`QĐ-2026-08-27-01`). Lệch 1 (chỉ nghe `create`) và lệch 2 (`dataset: "*"`, không lọc type) đã sửa: nay `on: [create, update, delete]`, `dataset: production`, và bộ lọc nêu đúng 15 type có render trang — loại 5 type hệ thống (`sanity.imageAsset`, `system.schema`, `system.group`, `system.retention`, `sanity.canvas.link`) vốn mỗi cái đều đang kích một lần dựng toàn site. **Lệch 3 (debounce) còn mở, cố ý** — `ADR-0009` mục 4 cho phép MVP bỏ qua, và rủi ro chi phí đã giảm mạnh nhờ `QĐ-2026-08-25-06` chuyển bản dựng sang xô CDN 1M. Xem lại nếu CDN vượt ~50%.

Phát hiện 2026-08-22, khi hook đang tắt (`QĐ-2026-08-22-03`).

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

**Trạng thái:** **ĐÓNG** 2026-08-29 (`QĐ-2026-08-29-03`). `InfoCard.astro` đã xoá; slot `info` của `DetailLayout`, prop `infoBarItems`, và nhánh `'InfoCard'` trong `Sidebar` đều đã gỡ. `ENTITIES_WITHOUT_FACTSTRIP` nay **rỗng** — mọi entity detail đi qua `FactStrip`. Xác minh bản dựng: **0 trang** còn `class="info-card"`.

**Cập nhật 2026-08-29 (`QĐ-2026-08-29-02`): phần Bài viết ĐÃ ĐÓNG.** Chủ dự án yêu cầu trang Bài viết dùng chung khung với mọi entity khác. Đo trên trang thật cho thấy đây là chỗ lệch khung **cuối cùng** của Bài viết: `/cam-nang/…` render `info-card`, còn `/diem-tham-quan/…` render `fact-strip`; hero, breadcrumb, dải tiêu đề, đoạn mở, thanh dính và hộp tác giả thì đã chung từ trước. `ArticleDetail` nay truyền `facts` cho `DetailLayout` và không còn `InfoCard`. Chuyển đổi gần như cơ học vì kiểu `Fact` của `FactStrip` đúng bằng `{field, icon, label, value, visible}` mà `sidebarRows` vốn có. `ArticleDetail.astro` đã chuyển sang `ENTITIES_WITH_FACTSTRIP` trong `entity-layout-post.ts` để sổ hợp đồng khai đúng thực tế.

**`InfoCard.astro` và slot `info` của `DetailLayout` KHÔNG được xoá** — hai template còn lại vẫn dùng. Đoạn dưới đây giữ nguyên văn bản gốc, đọc là mô tả tình trạng TRƯỚC 2026-08-29.

**Trạng thái gốc khi ghi phiếu:** mở (có chủ đích — không phải quên dọn).

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

---

## DR-058 — Đổi slug bài đã phát hành không kèm redirect: URL cũ mất câm, `R3` bắt được

**Trạng thái:** đã sửa 2026-08-25 (một dòng 301 trong `public/_redirects`).

Bài `0ab6d35f-30c6-4d50-8a60-814333d354b8` (cẩm nang bến tàu du lịch Nha Trang) bị đổi slug ngay trong Sanity Studio lúc `2026-08-25T04:45:45Z` — **sau** bản deploy production `03:43:51Z` — bỏ đuôi `-cap-nhat-2026`. Trang mới dựng đúng trong `dist/` với slug mới, nhưng URL cũ vẫn còn trong sitemap production (vì sitemap production được sinh ra trước lần đổi slug) và không ai để lại dòng chuyển hướng. Nếu deploy tiếp mà không vá, URL cũ sẽ trả **404** với bất kỳ ai còn giữ liên kết cũ (kết quả tìm kiếm đã lập chỉ mục, liên kết đã chia sẻ...).

Đây đúng là việc `R3` (`04-CONSTRAINTS §1c`, thực thi ở `scripts/validators/r3-r4-post.ts:184`) sinh ra để chặn: *"một URL đã từng tồn tại KHÔNG được biến mất câm."* Cổng đã hoạt động đúng thiết kế — đỏ đúng lúc, đúng URL, không phải cổng mù kiểu `DR-048`/`DR-056`.

**Số đo, 2026-08-25 — `node scripts/validators/r3-r4-post.ts` (chạy từ `scripts/`).**

| Đo | Trước | Sau |
|---|---|---|
| `R3` | **FAIL — 1 lỗi**: `URL "https://tourdao.vn/cam-nang/tron-bo-cam-nang-ben-tau-du-lich-nha-trang-gia-ve-lich-trinh-and-dich-vu-cap-nhat-2026/" trong sitemap production cũ biến mất, không có redirect trong public/_redirects` | **pass** |
| `R4` | pass | pass (không đụng) |

**Đã vá:** thêm một dòng 301 vào `public/_redirects`, Phần 1 (khu vực dành riêng cho dòng R3):

```
/cam-nang/tron-bo-cam-nang-ben-tau-du-lich-nha-trang-gia-ve-lich-trinh-and-dich-vu-cap-nhat-2026/    /cam-nang/tron-bo-cam-nang-ben-tau-du-lich-nha-trang-gia-ve-lich-trinh-and-dich-vu/    301
```

Đoạn chú thích cũ ở Phần 1 ghi *"Hiện chưa có dòng R3 nào"* — câu đó đã sai kể từ khi thêm dòng trên, nên được sửa lại cho khớp thực tế cùng lúc, không để lại một câu nói dối trong file.

**Bài học.** Đổi slug của nội dung **đã phát hành** là một quyết định **cửa một chiều** đối với URL công khai — không đối xứng với việc đổi slug bản nháp, vốn không ai tham chiếu từ ngoài. Một khi trang đã lên sitemap và có thể đã được index, việc đổi slug ở Sanity Studio (một hệ soạn nội dung, không đi qua cùng review với thay đổi mã) không tự động kèm theo redirect — biên tập viên không có bước nào nhắc họ điều đó. `R3` là hàng rào đúng chỗ vì nó chạy sau build, so sánh với sitemap production thật, nên bắt được đúng khoảng trống này bất kể nó phát sinh từ mã hay từ nội dung. Nhưng hàng rào bắt được sau khi việc đã xảy ra — nó không ngăn ai đổi slug mà không nghĩ tới URL cũ. Nợ này lặp lại được: bất kỳ lần đổi slug nào sau phát hành cũng cần một dòng redirect đi kèm, và hiện không có cơ chế nào ở tầng Sanity Studio nhắc việc đó tại thời điểm đổi.

---

## DR-059 — `check:token-parity` in "XANH" trong khi bỏ qua 16 trên 45 token nó vừa đọc, và 4 trong số đó đang lệch thật

**Trạng thái:** mở. Phát hiện 2026-08-25 khi rà lại `DR-002`. Đây là lệch **cổng ↔ thứ cổng khai là đã kiểm** — cùng họ với `DR-048` và `DR-056`, không phải lệch mã ↔ đặc tả.

`scripts/check-token-parity.mjs` (soạn 2026-08-24) tự khai ở đầu file là bộ đối sánh `07-DESIGN_TOKENS` ↔ `tokens.css`, và kết bằng `XANH — không có lệch mới ngoài những mục đã có phiếu.` (dòng 161). Câu đó đọc như "đã so hết những gì vừa đọc". Nó chưa so hết.

**Cơ chế.** Vòng lặp chính suy tên biến CSS theo đúng hai đường: tra bảng `ANH_XA` (10 mục), hoặc suy cơ học cho token bắt đầu bằng `color.` (dòng 123). Token nào không thuộc hai đường đó nhận `bienCss = null`, và dòng ngay dưới là `if (!bienCss) continue` (dòng 124) — **bỏ qua trong im lặng**. Nó không vào `doDo` (đỏ), không vào `vang`, và không cả vào `thieuBien` — bucket "07 khai mà không thấy biến" ở dòng 127 chỉ chạy khi `bienCss` đã có giá trị. Cả ba bucket in ra được đều nằm **sau** cái `continue`.

Đối lập với `KHONG_CO_BIEN` (dòng 54-59): đó cũng là loại trừ, nhưng **có khai tên, có ghi lý do từng mục**. Khoảng mù ở đây thì không ai khai gì cả.

**Số đo 2026-08-25.** Chạy lại đúng logic của bộ kiểm trên hai file thật:

| Đo | Kết quả |
|---|---|
| Dòng bộ kiểm đọc được từ bảng `07` | **46** (chính nó in ra) — trong đó **1** là hàng tiêu đề `Token`, nên **45** token thật |
| Bị `KHONG_CO_BIEN` loại, **có khai lý do** | 5 |
| Bị `continue` loại, **trong im lặng** | **16** |
| Thật sự được đối chiếu | **24** |
| Trong 16 mục bị bỏ qua, số mục đang **lệch thật** | **4** |

Mười sáu mục bị bỏ qua: `space.scale`, `space.section`, `container.max`, `radius.sm`, `radius.md`, `radius.pill`, `shadow.card`, `shadow.raised`, `shadow.overlay`, `bp.sm`, `bp.md`, `bp.lg`, `bp.xl`, `motion.fast`, `motion.base`, `motion.easing`.

Bốn mục đang lệch thật — cả bốn đã có tên trong `DR-002` từ 2026-08-05 và chưa mục nào được sửa:

| Token | `07-DESIGN_TOKENS` | `tokens.css` |
|---|---|---|
| `shadow.raised` | `0 4px 12px rgba(15, 23, 42, 0.10)` (07:149) | `0 6px 24px -8px rgba(0,91,150,.15), 0 2px 6px rgba(26,32,44,.05)` (css:134) |
| `motion.fast` | `150ms` (07:169) | `--m-fast: 180ms` (css:148) |
| `motion.base` | `250ms` (07:170) | `--m-base: 300ms` (css:149) |
| `motion.easing` | `cubic-bezier(0.2, 0, 0, 1)` (07:171) | `--m-ease: ease` (css:150) |

**Mười hai mục còn lại: đã đo nốt ở vòng sửa 1 (2026-08-25).** Lượt đầu để ngỏ vì không muốn đóng khung chúng là "chắc khớp" — đúng thứ lỗi phiếu này mô tả. Nay đo tay từng mục, đối chiếu `07` với `tokens.css`:

| Mục | `07` | `tokens.css` | |
|---|---|---|---|
| `radius.sm` / `md` / `pill` | 8px · 12px · 999px (142-144) | 8px · 12px · 999px (127, 128, 130) | ✅ |
| `shadow.card` | `0 1px 3px rgba(15, 23, 42, 0.08)` (148) | `0 1px 3px rgba(15,23,42,0.08)` (133) | ✅ |
| `shadow.overlay` | `0 12px 32px rgba(15, 23, 42, 0.16)` (150) | `0 12px 32px rgba(15,23,42,0.16)` (136) | ✅ |
| `container.max` | 1200px (138) | 1200px (139) | ✅ |
| `bp.sm` / `md` / `lg` / `xl` | 640 · 768 · 1024 · 1280 (158-161) | 640 · 768 · 1024 · 1280 (142-145) | ✅ |
| `space.scale`, `space.section` | mô tả thang, không phải một giá trị | — | **không so được** |

Vậy **"4 lệch trong 16" là con số đủ**, không phải mức sàn. Mười mục so được đều khớp; hai mục còn lại không có dạng so trực tiếp.

**Một chi tiết cho ai sửa bộ kiểm:** hai dòng shadow khớp về **giá trị** nhưng khác về **khoảng trắng** trong `rgba(...)`. So chuỗi trần sẽ báo đỏ oan cả hai. Bộ kiểm phải chuẩn hoá khoảng trắng trước khi so, nếu không việc vá dòng 124 sẽ đổi một lỗi im lặng lấy hai lỗi giả.

**Vì sao ghi riêng thay vì nhét vào `DR-002`.** `DR-002` là lệch **token**; phiếu này là lệch **bằng chứng**. Bộ kiểm được dựng đúng vì `DR-050`/`DR-051` *"lọt qua nhiều vòng review vì không cổng nào đỏ"* (chú thích đầu `check-token-parity.mjs`) — rồi chính nó để lọt bốn mục cùng loại. `CLAUDE.md` §6: *"mặc định của cổng là không đạt nếu không có bằng chứng"*. Ở đây cổng in một chữ XANH cho 16 mục chưa hề được kiểm; ai đọc dòng đó sẽ tin `07` và `tokens.css` chỉ còn hai chỗ lệch.

**Nhẹ hơn `DR-056` một bậc, và nói ra chỗ nhẹ đó.** Bộ kiểm này **không** nằm trong `gate:all` — chú thích của chính nó ghi rõ thêm một cổng vào gate là cửa một chiều, phải chủ dự án chốt. Nên nó chưa từng cho một lần merge nào qua oan. Nhưng nó là thứ người ta chạy tay để trả lời câu "07 còn lệch mã ở đâu", và với câu hỏi đó nó đang trả lời thiếu.

**Không sửa ở đây.** Sửa gồm hai phần, cả hai vượt phạm vi một lượt rà sổ:

1. Khai thêm ánh xạ cho `shadow.*`, `motion.*`, `radius.*`, `space.*`, `container.*`, `bp.*`. Tên không cơ học (`motion.fast` → `--m-fast`, `container.max` → `--container`) nên phải khai tay — đúng chỗ mà chú thích của file đã cảnh báo là *"nơi DR-050 nấp suốt mười ngày"*.
2. Đổi nhánh `continue` ở dòng 124 thành một bucket in ra được, để mục chưa khai ánh xạ **hiện lên** thay vì biến mất.

Việc (2) quan trọng hơn (1): không có nó thì lần thêm token tiếp theo lại tạo một khoảng mù mới, và bộ kiểm lại in XANH.

---

## DR-060 — Ba media query của `/nha-trang/` viết bằng `var()` nên chết im lặng; trang giữ nguyên số cột máy tính trên điện thoại

**Trạng thái:** **đã xử 2026-08-25** (`src/components/TouristDestinationHub.astro`). Phát hiện khi chủ dự án yêu cầu refactor `/nha-trang/` cho ưu tiên di động.

**Lỗi.** Ba trong bốn media query của `TouristDestinationHub.astro` viết điều kiện bằng custom property:

```css
@media (max-width: var(--bp-lg)) { … }   /* dòng 1001 */
@media (max-width: var(--bp-md)) { … }   /* dòng 1022 */
@media (max-width: var(--bp-sm)) { … }   /* dòng 1044 */
```

**`var()` không dùng được trong điều kiện media query.** Custom property được giải ở tầng tính giá trị của phần tử, còn điều kiện media query được đánh giá trước đó và không gắn với phần tử nào. Trình duyệt coi cả at-rule là không hợp lệ và **bỏ nguyên khối** — không cảnh báo, không lỗi build, không cổng nào đỏ. Ba khối ấy chết từ lúc viết.

**Chỉ khối thứ tư (`max-width: 480px`, dòng 1037) là hợp lệ**, và nó chỉ xử `.trust-grid` với `.facts-grid`. Mọi lưới khác giữ nguyên số cột máy tính xuống tới màn hình nhỏ nhất.

**Đo trên trang thật `https://tourdao.vn/nha-trang/`, khung 390×844 (CDP, `Emulation.setDeviceMetricsOverride`):**

| Lưới | Cột | Bề rộng mỗi ô |
|---|---|---|
| `.hubs-grid` | **4** | 106 · 110 · 96 · **0px** — một trong bốn lối vào hub bị bóp mất hẳn |
| `.rollup-grid` | **4** | 77,5px |
| `.feature-grid--attractions` | **3** | ~102px |
| `.feature-grid--experiences` | **3** | 141 · 77 · 91px (thang `2fr 1fr 1fr` giữ nguyên) |
| `.article-grid` | 2 | 171px |
| `.trust-grid`, `.facts-grid` | 1 | 358px ✅ (nhờ khối 480px hợp lệ) |

Không tràn ngang (`scrollWidth` = 390) — các lưới **bị bóp** chứ không tràn, nên lỗi không lộ ra bằng thanh cuộn ngang. Đó là lý do nó sống sót qua các lượt kiểm trước.

**Vi phạm Luật 5** (`06` §6: lưới nhiều cột trên máy tính phải thành hàng trải hết bề ngang ở ≤640px). Không cổng nào canh Luật 5 trên trang điểm đến.

**Đã sửa.** Thay bằng giá trị px thật, đúng bằng `--bp-lg/md/sm` trong `tokens.css:142-144`: `1024px` · `768px` · `640px`. Kèm chú thích tại chỗ nói rõ vì sao không được dùng `var()`, để lần sau không ai viết lại như cũ. **Không đổi một giá trị bố cục nào** — thang mà tác giả viết ra vốn đã đầy đủ ba tầng (≤1024 bốn cột về hai; ≤768 lưới thẻ về một; ≤640 lưới hub và feature về một), chỉ là cả ba đều chết.

**Đo lại sau khi sửa, cùng khung 390×844, cùng script:** `hubs-grid`, `rollup-grid`, `article-grid`, `feature-grid--attractions`, `feature-grid--experiences` — **tất cả 1 cột, 358px**. Ô 0px biến mất. Trang cao 8596px → 12015px, đúng như phải thế khi thẻ thôi bị bóp cạnh nhau mà xếp chồng. `gate:all` không đỏ thêm cổng nào.

**Phạm vi.** `grep -rn "@media[^{]*var(" src/` → chỉ file này, không lan sang component nào khác.

**Bài học.** CSS không hợp lệ **hỏng im lặng**. Không như TypeScript hay GROQ, không có gì báo cho ta biết — bản dựng vẫn thành công, cổng vẫn xanh, trang vẫn hiện. Muốn bắt loại lỗi này thì phải **đo thứ đã dựng ra**, không phải đọc thứ đã viết vào. Ở đây bằng chứng quyết định là `grep "@media[^{]*var(" dist/_astro/*.css` cho **3 kết quả** — CSS đã phát hành còn nguyên `var()`, tức trình duyệt thật đang vứt chúng.

**Còn nợ, không thuộc phiếu này.** Khối `640px` đặt `.feature-grid--stays` về **2 cột** chứ không phải 1 (~171px mỗi thẻ ở 390px). Đó là ý tác giả viết rõ, không phải lỗi `var()`, và lưới đó không render trên `/nha-trang/` nên chưa lộ. Trang điểm đến nào có mục lưu trú sẽ dính. Xử cùng lúc đồng bộ bố cục.

**Nợ lớn hơn mà phiếu này chạm vào.** `06` §4.1 khai trang điểm đến *"khung chung áp dụng"*, và §5.7 khai khối nội dung trang chủ là *"như §4.1"* — tức một bộ khối cho cả hai. Mã thì có **hai bản**: trang chủ dùng `SiteHome.astro` (532 dòng, ghép 12 component `Home*`), `/nha-trang/` dùng `TouristDestinationHub.astro` (1091 dòng, tự vẽ lại toàn bộ, không dùng `DetailLayout`/`Breadcrumb`/`Hero`/`FactStrip`/`Section` nào). `/nha-trang/` không có `crumb-band`, `title-band`, `summary-band`, `fact-strip` — trang chi tiết có đủ cả bốn. Chính vì tự vẽ lại mà nó có riêng ba media query hỏng này. Đồng bộ về bộ `Home*` là **thi hành đặc tả đang có**, không phải quyết định kiến trúc mới — nhưng là một diff lớn, chủ dự án đã chốt làm ở vòng riêng có bản xem trước.

---

## DR-061 — Trang điểm đến và trang chủ dựng cùng một bộ khối bằng hai bản mã khác nhau, lệch từ ngày fork

**Trạng thái:** **đã xử 2026-08-25** (`src/components/TouristDestinationHub.astro`, 1091 → 390 dòng). Chủ dự án duyệt cùng ngày, xem `QĐ-2026-08-25-05`.

**Đặc tả nói gì.** `06` §4.1 khai trang điểm đến: *"**Khung chung áp dụng**, cộng:"* rồi liệt kê các khối riêng. §5.7 dòng 346 khai khối nội dung trang chủ là *"**như §4.1**"*. Tức một bộ khối cho cả hai trang.

**Mã làm gì.** Hai bản:

| | `SiteHome.astro` | `TouristDestinationHub.astro` |
|---|---|---|
| Dòng | 532 | **1091** |
| Cách dựng | ghép 12 component `Home*` | tự vẽ toàn bộ markup + CSS |
| Vùng cấu trúc chung | — | **không có** `crumb-band`, `title-band`, `summary-band` |

Cả hai render **cùng bộ khoá** `copy.sections.*` từ `src/lib/homepage.ts` — cùng vốn từ nội dung, khác cách vẽ. Chín trên mười hai khối ánh xạ một-đối-một vào component đã có sẵn; riêng năm lưới `attractions`/`experiences`/`stays`/`specialties`/`tours` đều là cùng một `HomeRollupSection`.

**Không ai viết tay sai khung ở đây — lệch có từ ngày fork.** `git log --diff-filter=A` cho cả hai file trả về **cùng một commit** `d7bac08` (2026-07-22, *"fork engine Core"*). Bộ `Home*` đã tồn tại từ giây phút đầu và hub ngay từ đầu đã không dùng. Lệch này **thừa kế theo bản fork**, không phải quyết định ở dự án này.

**Cái sai thật: khoảng cách bị nới ra qua từng vòng bề mặt.**

| | `SiteHome` | `TouristDestinationHub` |
|---|---|---|
| Tổng commit sau fork | 13 | 8 |
| Vòng bề mặt đã nhận | vòng 2, vòng 3, Site Settings, **vòng 5** | chỉ vòng 3 (`59cab03`) |

Vòng 5 — đúng vòng làm mobile-first — đụng **17 file nguồn** và **không có file này**. Đó không phải sơ suất: `SPEC-2026-08-22-be-mat-vong-5` §9 và dòng 379 ghi thẳng *"Design **không** được vẽ lại bố cục trang chủ, header, hay footer trong vòng này"*, vì bốn điều chủ dự án nêu hồi đó là về trang chi tiết. **Một ranh giới phạm vi vạch có chủ đích, rồi không ai quay lại gỡ.**

**Hệ quả đo được.** Vì tự vẽ lại nên hub có riêng ba media query hỏng của `DR-060` — chúng cũng sinh ra ở `d7bac08` và **chết suốt 34 ngày**. Đồng bộ về bộ `Home*` xoá luôn cả lớp lỗi đó chứ không chỉ vá một lần.

**Đã sửa.** Hub nay ghép từ chính các component trang chủ dùng: `HomeTrustBar`, `HomeHubGrid`, `HomeBannerGrid`, `HomeRollupSection` ×5, `HomeAreaGrid`, `HomeGuideGrid`, `HomeFacts`, cộng `Breadcrumb` + `Hero` + `Section` + `FAQ` + `HomeMetaBar`. Chỉ còn CSS cho ba thứ không có component chung: lưới hai cột mục Tổng quan, khối Điểm đến liên quan, cụm tham chiếu cuối trang.

**Bốn thay đổi bố cục thấy được, chủ dự án đã duyệt** — chi tiết ở `QĐ-2026-08-25-05`.

**Còn nợ, cố ý không làm trong đợt này.** `HomeHero.astro` nay **không còn ai gọi** (hub là consumer duy nhất; `SiteHome` có hero riêng và chỉ nhắc tên nó trong một chú thích ở dòng 363). Xoá một component là quyết định riêng, chưa làm. `06` §4.1 nên có thêm hàng khai rõ ba dải quanh hero cho trang điểm đến thay vì để chúng thừa hưởng ngầm qua câu *"khung chung áp dụng"* — sửa `06` đụng R9, cần phiếu riêng.

**Bài học.** Fork mang theo cả nợ của dự án gốc, và nợ đó **không thuộc về ai** cho tới khi có người nhận. Ba vòng bề mặt đi qua file này mà không ai mở nó ra, vì mỗi vòng đều có một câu "ngoài phạm vi" hợp lý. Ranh giới phạm vi cần một ngày hết hạn, không thì nó thành nơi nợ đọng lại.

---

## DR-062 — `:has()` đè media query trong `HomeRollupSection`: khối 2 hoặc 3 mục không bao giờ đổ về một cột

**Trạng thái:** **đã xử 2026-08-25** (`src/components/HomeRollupSection.astro`). Lỗi **có sẵn từ trước**, không do đợt refactor tạo ra; refactor chỉ làm nó lộ ra.

**Lỗi.** Component chọn số cột theo số thẻ bằng `:has()`, rồi thu hẹp theo bề ngang bằng media query nhắm bộ chọn trần:

```css
.home-card-grid:has(> :last-child:nth-child(3)) { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 640px) { .home-card-grid { grid-template-columns: 1fr; } }
```

**Độ đặc hiệu, không phải thứ tự.** `:has()` lấy độ đặc hiệu của đối số bên trong, nên bộ chọn trên là **(0,3,0)**; `.home-card-grid` trần chỉ **(0,1,0)**. Đặc hiệu cao thắng bất kể đứng trước hay sau và bất kể nằm trong media query hay không. Ba khối thu hẹp **không bao giờ áp được** cho khối có đúng 2 hoặc 3 mục.

**Vì sao sống lâu.** Khối **4 mục trở lên** không khớp luật `:has()` nào (chỉ có nhánh cho 1, 2, 3) nên rơi đúng xuống media query và thu bình thường. Hai lưới cạnh nhau cho hai kết quả khác hẳn — người xem dễ kết luận "lưới này thu được, chắc lưới kia cũng thế".

**Đo trên production, khung 390×844, CDP:**

| Trang | Khối | Trước | Sau |
|---|---|---|---|
| `/` (trang chủ) | rollup 3 mục | **3 cột · ô 119px** | 1 cột · 358px |
| `/nha-trang/` | Trải nghiệm nổi bật (3 mục) | *(xem ghi chú)* | 1 cột · 358px |

**Ghi chú về hàng thứ hai — sửa sau review 2026-08-25.** Bản đầu của phiếu này ghi `/nha-trang/`
"trước: 3 cột · ô 119px". **Sai, và sai theo cách dễ tin.** Hub cũ chưa từng import
`HomeRollupSection`, không có `.home-card-grid` nào, nên lỗi `:has()` không với tới nó; `DR-060`
ngay trên cùng sổ này còn ghi lưới đó đo được **1 cột, 358px** sau bản vá `ab03f1b` đã ở `main`.
Con số 119px là thật, nhưng nó đo ở **trạng thái giữa chừng** của nhánh refactor — sau khi hub
chuyển sang `HomeRollupSection`, trước khi vá độ đặc hiệu. Trạng thái đó **chưa bao giờ lên
production**. Giữ hàng lại vì nó là bằng chứng cơ chế; sửa cột "trước" để không đọc thành một
lỗi từng chạy thật.

Chỉ **trang chủ** mới dính lỗi này trên production, và **từ trước đợt refactor** — không phải hồi
quy. Vi phạm **Luật 5** (`06` §6).

**Đã sửa.** Ba khối media query nay nhắc lại các bộ chọn `:has()` để đạt đủ độ đặc hiệu. Số cột thật = nhỏ hơn giữa *(số mục)* và *(mức bề ngang cho phép)*: ≤1024px trần 3 cột, ≤768px trần 2 (phải hạ khối 3 mục), ≤640px trần 1 (phải hạ cả khối 2 và 3 mục).

**Bài học.** `:has()` mang độ đặc hiệu của thứ nằm trong nó, nên nó **âm thầm vô hiệu hoá** mọi luật sau viết bằng bộ chọn đơn giản hơn — kể cả luật trong media query. Cùng họ với `DR-060`: CSS không hợp lệ hoặc bị đè thì **hỏng im lặng**, bản dựng vẫn xanh. Bắt được chỉ bằng cách **đo thứ đã dựng ra**, không phải đọc thứ đã viết vào.

---

## DR-063 — `FAQPage.speakable` trỏ vào bộ chọn cũng khớp đoạn mở, trên MỌI trang có FAQ

**Trạng thái:** mở, phát hiện 2026-08-25 khi review nhánh `feat/dong-bo-trang-diem-den`. **Không sửa trong nhánh đó** — đây là lệch toàn hệ thống, sửa lệch trên đúng một trang sẽ tạo ra bất đối xứng mới.

**Đường đi.** JSON-LD của trang chi tiết và trang điểm đến đều gắn `speakable` vào `subjectOf` → **`FAQPage`**, với `cssSelector: ["[data-speakable]"]`. Kiểm bằng cách đi cây JSON-LD trong `dist/`:

| Trang | Nơi `speakable` treo |
|---|---|
| `dia-danh/dao-hon-mun/` | `subjectOf` → `FAQPage` |
| `trai-nghiem/cano-keo-du-bay/` | `subjectOf` → `FAQPage` |
| `nha-trang/` | `subjectOf` → `FAQPage` |

Cả ba trang đều có **5** phần tử mang `data-speakable`: bốn `.faq-answer` và **một `.detail-summary`**.

**Vì sao đáng ngờ.** Bộ chọn của `FAQPage` khớp trúng cả đoạn mở, mà đoạn mở **không phải câu trả lời nào** của FAQ đó. Trợ lý giọng nói đọc theo khai báo này sẽ đọc một đoạn không thuộc cặp hỏi–đáp nào.

**Vì sao KHÔNG phải lỗi của nhánh refactor.** Reviewer nêu mục này như một lỗi mới do nhánh tạo ra ("bản cũ không hề phát thẻ này"). Vế đó đúng với **hub cũ**, nhưng sai về hệ thống: `DetailLayout.astro:180` đã gắn `data-speakable` lên đoạn mở từ trước, và `06` §4.1 khai thẳng *"speakable | build từ `summary` và `faq`"*. Nhánh refactor **khớp đúng nếp trang chi tiết**; nó không tạo lệch mới mà chỉ làm lệch sẵn có phủ thêm một trang.

**Ba lối đi, chưa chọn.**
1. Tách bộ chọn: `FAQPage.speakable` chỉ nhận `.faq-answer`, còn đoạn mở treo dưới `WebPage`/`mainEntityOfPage`.
2. Bỏ `data-speakable` khỏi đoạn mở trên mọi trang, chấp nhận `06` §4.1 chỉ còn nuôi speakable bằng `faq`.
3. Kết luận rằng cách khai hiện tại chấp nhận được và ghi nó thành chữ trong `06`.

Lối (1) hợp `06` §4.1 nhất vì nó giữ được cả `summary` lẫn `faq` làm nguồn. Cần một phiếu quyết định và một lượt sửa `src/lib/serialize/`, ngoài phạm vi đợt này.

**Bài học.** Reviewer bắt đúng **hiện tượng** nhưng quy sai **phạm vi** — cùng loại nhầm mà `DR-061` mô tả ở chiều ngược lại. Trước khi ghi một lệch là "do nhánh này gây ra", phải kiểm xem các trang KHÔNG thuộc nhánh có lệch y hệt không. Ở đây một lệnh đếm trên hai trang chi tiết là đủ.

## DR-064 — `control-registry.yaml` khai bộ kiểm pre-build "chưa từng chạy được", trong khi nó chạy và 11 validator đang đỏ

**Trạng thái:** **đã xử phần văn xuôi 2026-08-24** (commit `2a62297`, nhánh `feat-bo-kiem-tu-dong`). Phần khai `live`/`gap` của 27 control **còn mở** — chờ chủ dự án quyết, xem `ND-009`.

Phần đầu `docs/governance/control-registry.yaml` (soạn 2026-08-05) khai bốn điều. Kiểm ngày 2026-08-24 thì **cả bốn đều sai với hiện tại**:

| Sổ nói | Thực tế 2026-08-24 |
|---|---|
| `scripts/validators/i1-i19.ts:10` nhập `../../shared/gates/index.js`, "thư mục `shared/` không tồn tại trong repo này" | `shared/gates/index.ts` và `types.ts` tồn tại, vào git ở commit `b73326c` ngày **2026-08-06** — một ngày sau khi sổ được soạn |
| "bộ kiểm ràng buộc pre-build của dự án chưa từng chạy được ở tourdaovn" | `npm --prefix scripts run validate` chạy được |
| "chỉ 4 trên 31 control chạy được", 27 khai `gap` | 31 validator chạy |
| Evidence của 27 control: "chưa có — sẽ là `scripts/reports/validator-status.json` ... khi ND-005 trả xong" | File đó tồn tại và được ghi mỗi lần chạy |

Kết quả chạy thật:

```
Validator: 31 (0 stub, 3 defer)
Pass: 15    FAIL: 11    WARN: 2
[report] Ghi scripts/reports/validator-status.json (overall=fail)
```

**Hệ quả thật, không phải chuyện chữ nghĩa: 11 ràng buộc dữ liệu đang bị vi phạm mà không ai nhìn** — vì sổ nói bộ kiểm không chạy được, nên không ai chạy nó. Danh sách: `I1`, `I2`, `I3`, `I4`, `I5`, `I12`, `I13`, `I14`, `I19`, `R2`, `S25-FIVE-LANGUAGE-COVERAGE`. Vài ví dụ cụ thể — hotel publish thiếu `slug` (`I12`), Tour thiếu `itinerary` ≥1 chặng (`I14`), Article thiếu `author` (`I4`), Category "Ẩm thực" có 0 experience publish trỏ tới (`R2`).

Đây là lỗi dữ liệu, không phải lỗi mã. `DR-024` đã dự báo đúng: *"Chưa nổ vì chuỗi pre-build đang chết theo ND-005; sẽ nổ hàng loạt ngay khi ND-005 trả xong."* ND-005 trả xong lúc nào không ai ghi lại, nên tiếng nổ diễn ra trong im lặng.

**Vì sao không cổng nào bắt được.** `control-registry-gate` kiểm control khai `live` có trỏ tới bộ thực thi có thật không. Nó **không kiểm chiều ngược**: control khai `gap` mà thực ra đang chạy. Cùng loại điểm mù với `DR-021`, chỉ khác chiều — `DR-021` là "khai đã kiểm mà chưa kiểm", cái này là "khai chưa kiểm mà đã kiểm và đang đỏ".

Đã thêm `GA6` trong `scripts/audit/gate-audit.ts` để bắt đúng chiều này: control khai `gap` mà file bằng chứng của nó tồn tại và có mục mang đúng `id` thì trượt. Chạy thử: `audit:gate` đi từ 34 đạt/1 trượt lên **34 đạt/28 trượt**, bắt đủ cả 27 control. **Cảnh báo:** bản `GA6` hiện tại có lỗi Critical chưa vá — xem `ND-009`.

**Gốc rễ đi kèm, cùng họ với `DR-043`.** Sổ ghi lúc **phát hiện**, không phải lúc **đóng**. Trong phiên 2026-08-24 tôi trích ba tiền đề từ `DRIFT_LOG` và cả ba đều đã lỗi thời: `DR-015` (thư mục `shared/`), `DR-043` (gốc rễ đã đóng ở `QĐ-2026-08-22-04`), và một con số trang. Không mục nào sai lúc viết; chúng chỉ không được cập nhật lúc thực tế đổi.

---

## DR-065 — Mô tả trang danh mục còn gắn cứng "Nha Trang"

**Trạng thái:** mở, **hoãn có chủ ý**. Phát hiện 2026-08-26 khi soạn `SPEC-2026-08-26-da-diem-den` §8. Hoãn theo quyết định chủ dự án cùng phiên (`QĐ-2026-08-26-01` chốt 5).

`src/lib/uiCopy.ts:893-1108` — `INDEX_COPY` (893), `HUB_COPY` (966), `HUB_PART_COPY` (1000) và `fallbackDescription` (1099) mô tả các trang danh mục **toàn site** bằng cụm "tại Nha Trang"; 37 dòng trong file chứa tên riêng đó. Sau ADR-0028 các trang danh mục vẫn gom chung mọi điểm đến, nên ngay khi điểm đến thứ hai có nội dung, những mô tả này **thành sai sự thật**: `/khach-san/` sẽ liệt kê khách sạn Phú Quốc dưới thẻ meta "Khách sạn tại Nha Trang".

Không sửa trong đợt này vì đây là `<meta description>` của những trang **đang xếp hạng trên Google**. Đổi hàng loạt là một quyết định SEO riêng, không phải hệ quả kỹ thuật của ADR-0028.

## DR-066 — Trang danh mục chưa lọc được theo điểm đến

**Trạng thái:** mở, **cố ý không làm**. Phát hiện 2026-08-26. Nguồn: `QĐ-2026-08-26-01` chốt 1.

ADR-0028 chọn hướng A: điểm đến thứ hai có trang trụ riêng, còn các trang danh mục (`/tour/`, `/khach-san/`…) **vẫn gom chung toàn site**. Chưa có đường nào để khách xem "chỉ tour Phú Quốc" — không `/tour/?diem-den=…`, không `/‹diem-den›/tour/`.

Field `destination` thêm ở ADR-0028 đã đặt sẵn dữ liệu cho việc đó. Mở ra là một đợt riêng, đụng `ROUTE_MAP` trong `src/site.config.ts` và bảng địa chỉ ở `05-URL_MAP-and-DB_SCHEMA.md`.

## DR-067 — `brand.description` / `headline` / `tagline` nói riêng về Nha Trang

**Trạng thái:** mở, **hoãn có chủ ý**. Phát hiện 2026-08-26. Cùng loại quyết định với `DR-065`.

`src/site.config.ts:94-106` — `description` (94), `headline` (103), `tagline` (106) đều mang tên riêng "Nha Trang". `description` là `<meta description>` mặc định của **mọi** trang trong site (`QĐ-2026-08-14-03` khoá nó thành hằng lúc build, `hero.summary` trong Studio không đè được).

Site có nhiều điểm đến thì ba chuỗi này mô tả thiếu. Sửa là quyết định thương hiệu cộng SEO, không phải hệ quả kỹ thuật.

## DR-068 — Breadcrumb của trang điểm đến thứ hai chưa từng được kiểm bằng trang thật

**Trạng thái:** **đã đóng 2026-08-27** — kiểm xong trên trang thật sau khi có điểm đến thứ hai (Ninh Thuận). Kết quả **khác dự đoán, theo hướng tốt**; xem "Kết quả kiểm" ở cuối mục. Phát hiện 2026-08-26.

`src/components/Breadcrumb.astro:43` đã có nhánh riêng cho `touristDestination` (`if (entityType !== 'touristDestination')`), viết từ trước đợt này. Nhưng dataset mới chỉ có **một** TouristDestination có slug (`seed.nha-trang`), nên nhánh đó chưa bao giờ chạy trên một trang điểm đến **không phải trang chủ**.

Lần đầu kiểm được là Task 8 bước 6 của `docs/plans/2026-08-26-da-diem-den.md`, sau khi chủ dự án nhập điểm đến thứ hai trong Studio.

**Kết quả kiểm (2026-08-27, điểm đến thứ hai là Ninh Thuận).** Tiền đề của mục này sai một nửa: trang điểm đến **không hề render breadcrumb**, vì `TouristDestinationHub.astro` không dùng component đó. Hợp lý — trang điểm đến nằm ngay dưới trang chủ, chuỗi "Trang chủ › Ninh Thuận" không thêm thông tin gì.

Nhánh `entityType !== 'touristDestination'` ở `Breadcrumb.astro:43` thực ra được kích hoạt ở **trang chi tiết**, qua chuỗi `containedInPlace`. Kiểm trên `dist/dia-danh/deo-vinh-hy/index.html`:

```
1. Trang chủ    https://tourdao.vn/
2. Địa danh     https://tourdao.vn/dia-danh/
3. Ninh Thuận   https://tourdao.vn/ninh-thuan/     ← trỏ đúng điểm đến mới
4. Đèo Vĩnh Hy  (mục hiện tại, không link)
```

Đúng cả trong JSON-LD `BreadcrumbList` lẫn HTML hiển thị. Không phải sửa gì.

Bằng chứng: `docs/evidence/2026-08-26-da-diem-den/buoc-6-nghiem-thu-trang-that.txt`.

## DR-069 — Chữ trong `HOME_COPY` bản en/zh/ko/ru còn tên riêng "Nha Trang"

**Trạng thái:** mở, **chưa gây hại**. Phát hiện 2026-08-26.

`src/lib/homepage.ts` giữ `HOME_COPY` cho năm ngôn ngữ. Task 6 của đợt này đã đổi `sections.overview` thành hàm nhận tên điểm đến, nên tiêu đề tổng quan hết gắn cứng. Nhưng các chuỗi **khác** trong bốn bản en/zh/ko/ru vẫn còn tên riêng "Nha Trang" / "芽庄" / "나트랑" / "Нячанг".

Chưa render vì `src/site.config.ts:130` khai `langs = ['vi']` — bốn bản kia không có trang nào. Phải soát lại **trước** khi mở thêm ngôn ngữ, nếu không mỗi ngôn ngữ mở ra là một lần rò tên riêng lên trang thật.

## DR-070 — `GA3` đóng cứng `postbuild-status.json`, nên mọi control `live` chặng pre-build trượt vĩnh viễn

**Trạng thái:** **đã xử 2026-08-26**, nhánh `feat-da-diem-den`. Phát hiện khi thêm control `I20` (ADR-0028).

`GA3` trong `scripts/audit/gate-audit.ts` lặp qua **mọi** control khai `live` và đối chiếu với `scripts/reports/postbuild-status.json` — không nhìn `stage`. Nhưng hai chặng ghi hai file khác nhau: bộ kiểm pre-build (`scripts/validate-constraints.ts:150`) ghi `validator-status.json`, bộ kiểm post-build ghi `postbuild-status.json`. Hai file cùng hình dạng `items: [{id, status}]`.

Hệ quả: **một control `live` ở `stage: pre-build` không bao giờ qua được `GA3`** — bộ kiểm của nó không ghi vào file mà `GA3` đọc, nên chạy bao nhiêu lần cũng vô ích.

Vì sao tới giờ chưa ai thấy: bốn control `live` trước đó (`I6`, `PY8`, `R3`, `R4`) **đều** là post-build. `I20` là control `live` đầu tiên ở chặng pre-build, và nó dẫm ngay vào điểm mù.

Điểm nguy hiểm nằm ở chỗ thông điệp lỗi *nghe như* một việc sửa được: "khai live nhưng không có mục nào trong postbuild-status.json". Người đọc sẽ đi chạy lại bộ kiểm — và không có gì thay đổi. Kế hoạch thi công `docs/plans/2026-08-26-da-diem-den.md` Task 8 Bước 3 đã hứa đúng như vậy: "bước 1 vừa sinh `validator-status.json` có mục `I20`, nên control khai `live` giờ đã có bằng chứng thật". Lời hứa đó **sai** với bản `GA3` cũ.

**Đã sửa.** Tách `GA3` thành hàm thuần `kiemLiveCoTrongBaoCao`, tra báo cáo theo `stage` qua bảng `BAO_CAO_THEO_STAGE`; `stage` lạ hoặc thiếu thì `skip` kèm lý do chứ không đoán. Dùng lại đúng vị từ `dangChayThatTrongBaoCao` mà `GA6` đang dùng — cùng câu hỏi "file này có mục mang id này không", chỉ khác chiều kết luận. Sáu test hồi quy trong `scripts/audit/__tests__/gate-audit.test.ts`, gồm một ca chốt: control pre-build **không** được tính là đạt chỉ vì id của nó tình cờ có mặt trong `postbuild-status.json`.

Cùng họ với `DR-021` và `DR-064`: cổng nói một câu nghe như sự thật, mà phép kiểm đằng sau không làm được điều nó tự nhận.

## DR-071 — Hàng rào chặn ghi dữ liệu chép tay tên lệnh, nên lệnh mới mặc định LỌT

**Trạng thái:** **đã xử 2026-08-26**, nhánh `feat-da-diem-den`. Phát hiện ngay sau khi Task 7 (ADR-0028) ghi thật 211 document.

`guard-data-mutation.sh` giữ một biểu thức `MAU_GHI` chép tay từ `scripts/package.json`. Với họ lệnh nạp bù, nó chép **tên cụ thể** của đúng một lệnh đang có lúc soạn. Lệnh nạp bù thêm sau đó — sinh ra trong chính đợt này — **không khớp mẫu nào**, nên chạy thẳng với `--live` và ghi 211 document mà hook không hé một tiếng.

Cờ `.claude/.cho-phep-ghi-du-lieu` có được tạo trước khi chạy, theo đúng kế hoạch. Nhưng **cờ ấy không phải thứ đã cho phép lệnh chạy** — lệnh vốn không bị chặn. Đây mới là điểm đáng sợ: quy trình *trông như* đã qua một cổng kiểm soát, trong khi cổng ấy không hề đóng. Cùng họ với `DR-021`, `DR-064`, `DR-070`.

**Hàng rào còn lộn ngược ở chiều kia.** Mẫu khớp trên **chuỗi lệnh**, nên lệnh chỉ *nhắc tới* một đường dẫn mà không chạy nó cũng bị chặn: trong phiên này `git add` một tệp và `sed -n` đọc một tệp đều bị chặn, và đến lượt chính lệnh vá hook cũng bị chặn vì phần chú thích của nó có nhắc đường dẫn. Vậy là hàng rào chặn thứ vô hại và để lọt thứ nguy hiểm.

**Đã sửa — chỉ một chiều, có chủ ý.** Đổi từ khớp tên cụ thể sang khớp **tiền tố**, để lệnh nạp bù mới mặc định **bị chặn** thay vì mặc định lọt. Cùng triết lý đảo chiều mà vòng sửa 1 đã áp cho nhánh MCP Sanity (danh sách cho phép thay cho danh sách chặn).

Chiều over-blocking **cố ý giữ nguyên**: phân biệt "chạy một tệp" với "nhắc tới một tệp" bằng regex trên chuỗi lệnh là việc dễ làm sai, và làm sai theo hướng nới một hàng rào an toàn. Phiền tay không phải lý do đủ mạnh.

**Kiểm.** Bơm 12 lệnh mẫu qua chính hook: bảy lệnh ghi — gồm một lệnh nạp bù *chưa từng tồn tại* — đều CHẶN; năm lệnh chỉ đọc (`test`, `audit:gate`, `npm run build`, `git status`, triển khai Studio) đều lọt. Chạy với cờ đã xoá.

**Nợ còn lại.** Mẫu vẫn là danh sách chép tay cho các họ lệnh khác (`patch:n5`, `publish:drafts`, `translate`). Cách chữa tận gốc là sinh mẫu từ chính `scripts/package.json` lúc chạy, thay vì chép. Chưa làm — cần quyết định riêng, vì nó cho hook đọc file trong repo và đổi hành vi theo nội dung file đó.

## DR-072 — Đặc tả khai TouristDestination là N, điều hướng Studio vẫn khai là 1

**Trạng thái:** **đã xử 2026-08-26**, nhánh `feat-da-diem-den`. Phát hiện khi chủ dự án thử làm Task 8 bước 5 và không tìm thấy nút tạo điểm đến mới.

`cms/lib/structure.ts` khai mục menu "Điểm đến" bằng `S.document().documentId('seed.nha-trang')` — ghim cứng đúng một document. Bấm vào là mở thẳng form Nha Trang: **không danh sách, không nút tạo mới**. Chín entity còn lại đều dùng `S.documentTypeListItem(...)` và vì thế đều tạo mới được.

ADR-0028 đã đổi cardinality **1 → N** ở `01-CONTENT_MODEL` §2, schema đã có field `destination` trên mười entity, hạ tầng định tuyến vốn đã lặp qua mọi điểm đến đã duyệt (`src/pages/[...path].astro`), và 211 document đã nạp bù xong. Nhưng khâu cuối — **lối vào để người nhập liệu tạo điểm đến thứ hai** — thì không ai đụng tới.

Hệ quả: mục tiêu đã duyệt của ADR-0028 (*"Chủ dự án nhập một document Điểm đến thứ hai trong Sanity Studio và được ngay một trang `/‹slug›/`"*) **không thực hiện được**, dù mọi tầng phía dưới đã sẵn sàng. Kế hoạch thi công `docs/plans/2026-08-26-da-diem-den.md` không liệt kê `cms/lib/structure.ts` trong bản đồ file, nên Task 8 bước 5 yêu cầu một việc mà Studio không cho làm.

Đây cũng là lý do document `touristDestination` thứ hai đã có trong dataset — "Tỉnh Khánh Hòa" (`d5b267a3-a771-4cb2-8a50-8733da6372b5`, đã `approved`) — **không với tới được qua menu**, và vì thế thiếu cả `slug.vi` lẫn `summary.vi` mà không ai thấy.

**Đã sửa.** Thay khối singleton bằng `S.documentTypeListItem('touristDestination')`, đúng khuôn chín entity kia. Không đặc cách, không ghim cứng `_id` nào: điểm đến trụ là **cấu hình** (`primaryDestinationSlug` trong `src/site.config.ts`), không phải một vị trí đặc biệt trong menu — đúng tinh thần ADR-0028. Chỉ còn `siteSettings` giữ `documentId` ghim cứng, và đó là singleton thật.

**Bài học chung.** Đổi cardinality của một entity không chỉ là đổi con số trong đặc tả và thêm field. Nó chạm ít nhất bốn tầng: content model, schema, truy vấn/định tuyến, **và lối vào nhập liệu**. Ba tầng đầu có cổng máy kiểm (g1, g3, g4, astro check); tầng thứ tư không có cổng nào, nên nó im lặng cho tới khi có người thật ngồi xuống nhập liệu.

## DR-073 — Hook `pre-push` chặn mọi push vì hai cổng đỏ mà chính `main` cũng mắc

**Trạng thái:** **thu hẹp còn một nửa 2026-08-27** (`QĐ-2026-08-27-02`). `deferred-gate` ĐÃ XANH — hai chỗ khai sai trong `control-registry.yaml` đã sửa (`I16` là `deferred` chứ không `gap`; `PY1`/`PY2`/`PY4` chạy thật và xanh nên là `live`). `npm run gate` từ 2/11 đỏ xuống **1/11**. **Còn `governance-post` (S24)** — sáu lỗi dữ liệu trên bốn trang, cần chủ dự án điền `approvedBy` / `contentProvenance` / nguồn hoặc tác giả; máy không được tự điền vì đó là bản ghi về việc con người đã duyệt và đã viết. Chừng nào chưa điền, push vẫn phải `--no-verify`. Danh sách chính xác bốn trang và field thiếu ghi ở `QĐ-2026-08-27-02`.

Phát hiện 2026-08-27 khi push nhánh `feat-da-diem-den` sau lần gộp `origin/main`.

`.githooks/pre-push` (dựng ở `DR-056`, vốn chưa từng chạy vì thiếu bit thực thi) nay chạy thật: nó gọi `npm run gate` và **huỷ push nếu bất kỳ cổng nào đỏ**. Ý định đúng — cổng sớm ở máy tốt hơn phát hiện muộn.

Nhưng repo hiện có **hai cổng đỏ thường trực** mà không nhánh nào đóng được bằng mã:

| Cổng | Lỗi | Bản chất |
|---|---|---|
| `governance-post` | `S24-AUTHORITY-HTML`, 6 lỗi trên 4 trang: thiếu `approvedBy`, thiếu nguồn xác minh hoặc tác giả, thiếu `contentProvenance` hợp lệ | **dữ liệu** — phải sửa trong Studio, không sửa được bằng commit |
| `deferred-gate` | `I16: deferred nhưng registry không khai live post-build executor` | **quản trị** — `I16` khai `gap`/`pre-build` trong `control-registry.yaml`, mà validator xếp nó `deferred`. Đóng nó là trả lời câu hỏi "27 dòng `gap`" mà chính file registry đang treo chờ chủ dự án |

Đã xác minh **cả hai có sẵn trên `main`**, không phải do nhánh này gây ra: mục `I16` trong `control-registry.yaml` của `main` giống hệt bản đã gộp, và `git diff origin/main..HEAD` trên file đó **không có dòng nào nhắc I16**; sáu lỗi S24 nằm trên bốn trang cũ, không trang nào thuộc nội dung mới.

Nghĩa là **`main` cũng không tự push được qua chính hook của nó**. Hook nghiêm hơn hiện trạng thật của repo.

**Hệ quả đã thấy.** Push nhánh này phải dùng `--no-verify`. Đó là một hàng rào an toàn bị vô hiệu bằng tay — và một khi đã quen tay, nó vô hiệu cho mọi lần push sau, kể cả lần đáng ra phải chặn.

**Đáng ghi thêm:** lần gộp này làm cổng **tốt lên**, không xấu đi — từ 4 đỏ xuống 2. `r3-r4-post` (R4 hreflang) chuyển xanh nhờ bản sửa của `main` (`DR-057`), `control-registry-gate` cũng xanh.

**Hướng xử, cần chủ dự án quyết:** (a) điền dữ liệu còn thiếu cho 4 document để đóng S24; (b) trả lời câu hỏi "27 dòng `gap`" để đóng `deferred-gate`; hoặc (c) cho hook phân biệt "nợ có sẵn" với "lỗi mới do lần push này gây ra" — chỉ chặn loại thứ hai. Cách (c) khó làm đúng và dễ nới nhầm, nên (a)+(b) là đường sạch hơn.

## DR-074 — "Xem trang live" không bao giờ hiện trên Article, và trỏ vào 404 cho ba entity khác

**Trạng thái:** **đã xử 2026-08-27**, nhánh `feat-da-diem-den`. Phát hiện khi chủ dự án yêu cầu rà lại nút "Xem trang live" trong Studio.

`cms/sanity.config.ts` gắn `ViewLiveAction` cho **mọi** schemaType trừ `category`, nên nhìn từ cấu hình thì nút đã phủ hết. Khoảng trống nằm trong `cms/lib/resolveProductionUrl.ts`: hàm này trả `null` thì nút **im lặng biến mất**, không báo gì.

**Lỗi 1 — Article không bao giờ có nút.** Hàm đọc `doc.slug?.vi?.current` cho **mọi** type. Nhưng Article dùng i18n **cấp document** (ADR-0004) và lưu slug ở `slug.current`, không phải `slug.vi.current`. Đo trên dữ liệu thật: một Article có `slug.current = "snorkeling-lan-dau-can-biet-gi"` và `slug.vi.current = null`. Nên hàm trả `null` cho **toàn bộ** Article, và nút chưa từng xuất hiện trên loại nội dung được sản xuất nhiều nhất.

**Lỗi 2 — ba entity trỏ vào trang không tồn tại.** Hàm giữ một bảng `SEGMENT_MAP` **chép tay**, khai `restaurant → /nha-hang/`, `specialty → /dac-san/`, `event → /su-kien/`. Đối chiếu với `ROUTE_MAP`: cả ba **không có route nào**, và `dist/` không có thư mục nào tên như vậy. Bấm nút trên một Event đã duyệt là mở thẳng vào 404. Hiện có 1 Event, 0 Restaurant, 0 Specialty — nên mới chỉ một document dính.

**Gốc rễ chung: nguồn sự thật thứ hai.** `ROUTE_MAP` trong `src/lib/routes.ts` là nguồn duy nhất cho địa chỉ URL, và nó **đã lọc sẵn theo route đang bật**. `SEGMENT_MAP` là bản chép tay của nó, và như mọi bản chép tay, nó trôi. Cùng loại bệnh với `g1`/`g4` (chép tay bảng field) và với `MAU_GHI` của hook (`DR-071`).

**Đã sửa.** Bỏ hẳn `SEGMENT_MAP`; suy segment từ `ROUTE_MAP`, nên type không có route tự trả `null` thay vì dựng URL ma. Chọn chỗ đọc slug theo `getDocI18nTypes()` — cùng danh sách mà Studio đang dùng để cấu hình i18n, không khai thêm một danh sách nữa.

**Kiểm.** Chạy chính hàm đó trên mẫu thật của 11 type: `article`, `place`, `person`, `touristDestination`, `tour`, `hotel`, `organization` đều ra URL; `event`, `restaurant`, `specialty`, `category` trả `null` (nút không hiện) thay vì trỏ 404. Hai URL của document **đã duyệt** đối chiếu ngược vào `dist/`: `/cam-nang/tron-bo-cam-nang-ben-tau-…/` và `/dia-danh/ben-cang-da-chong/` đều tồn tại thật. Bundle Studio dựng lại không còn chuỗi `nha-hang`.

**Đính chính 2026-08-27.** Bản đầu của mục này ghi *"câu hỏi thật — Sự kiện có nên có trang riêng không — chưa ai trả lời"*. **Sai.** Câu trả lời đã có sẵn trong `src/site.config.ts`, ngay trên ba công tắc đang tắt: *"Ba mục dưới thuộc engine gốc (site du lịch Nha Trang), site này không dùng. Code và schema vẫn còn để không gãy tham chiếu chéo."* `restaurant`, `specialty`, `event` **cố ý không có trang** — và `ROUTE_TABLE` cũng không có dòng nào cho chúng, nên bật công tắc thôi cũng không sinh ra route.

Nghĩa là nút "Xem trang live" không hiện trên Event **là hành vi đúng**, không phải nợ. Bản sửa của mục này (suy segment từ `ROUTE_MAP`) tình cờ làm đúng ngay: type không có route thì trả `null`.

**Nợ thật còn lại, nhỏ hơn nhiều:** dataset có **1 document `event` đã duyệt** cho một entity mà site cố ý không dùng. Dữ liệu chết, không hại gì, nhưng nó là lý do khiến tôi tưởng đây là câu hỏi mở. Xoá hay giữ là việc của chủ dự án.

---

## DR-075 — `Category.slug` khai là "slug object localized" trong đặc tả, thực tế là slug phẳng

**Trạng thái:** **mở**, cố ý không sửa trong đợt `QĐ-2026-08-27-03` (ngoài phạm vi).

Phát hiện 2026-08-27 khi mở bộ term `attraction-type`, lúc đọc đường đi của `slug` từ đặc tả xuống mã.

`01-CONTENT_MODEL` §2.13 khai:

| Field | Kiểu | Bất biến |
|---|---|---|
| slug | **slug object localized** | URL trang listing theo term; **I9** |

Thực tế mã:

| Nơi | Khai / đọc | Khớp đặc tả? |
|---|---|---|
| `cms/schemas/category.ts:53` | `type: 'slug'` — **phẳng**, một giá trị | ✘ |
| `src/lib/sanity.ts:228` (`scanTerms`) | `"slug": slug.current` — đọc phẳng | ✘ (nhất quán với schema, lệch đặc tả) |
| `src/lib/serialize/category.ts:17` | `category.slug ?? category.termCode` | ✘ |

**Hệ quả thật.** Trang term **không có bản đa ngôn ngữ**: `/trai-nghiem/tam-bun` tồn tại, `/en/experiences/mud-bath` thì không, vì không có chỗ nào lưu slug tiếng Anh của term. I9 (khóa duy nhất theo `(_type, slug từng ngôn ngữ)`) trên Category **hiện không có gì để kiểm** — nó rỗng chứ không phải đạt.

**Vì sao chưa vỡ ra.** `src/site.config.ts` khai `langs = ['vi']`, nên phần đa ngôn ngữ chưa được yêu cầu. Drift này sẽ thành lỗi thật vào đúng lúc bật ngôn ngữ thứ hai — cùng thời điểm với các món i18n khác, không sớm hơn.

**Vì sao không sửa cùng `QĐ-2026-08-27-03`.** Sửa kiểu `slug` của Category chạm **mọi** term đang có của hai bộ `experience-type` và `tour-type`, tức chạm URL đang chạy và đang được Google lập chỉ mục — rủi ro khác hẳn và không liên quan tới việc mở bộ term mới. Bộ `attraction-type` mở ra theo **đúng khuôn đang có** (slug phẳng), nên không làm drift nặng thêm, chỉ làm nó rộng thêm một bộ.

**Điều kiện phải xử:** trước khi bật ngôn ngữ thứ hai trong `langs`. Khi xử, phải quyết một lượt cho cả ba bộ term, kèm di trú dữ liệu và bản đồ chuyển hướng cho URL term hiện có.

## DR-076 — Hero trang điểm đến đánh rơi `gallery`, nên không trang nào vào được mosaic

**Trạng thái:** **đóng** 2026-08-28. Sửa cùng lượt phát hiện.

Phát hiện 2026-08-28 khi đối chiếu bố cục hero của `/nha-trang/` với khung chung của các entity khác.

**Lệch gì.** `TouristDestinationHub.astro` gọi `<Hero>` mà **không truyền `gallery`**, trong khi `DetailLayout.astro` — khung chung của mọi trang chi tiết — có truyền. Không có prop đó thì `Hero.astro` tính `hasGallery = galleryItems.length === 4` luôn ra `false`, nên trang điểm đến **không bao giờ** vào được biến thể `.hero-block--mosaic`.

**Đặc tả nói gì.** `06-BINDING_MAP` §4.1 khai trang điểm đến là *"khung chung áp dụng, cộng"*, tức §3 áp cho nó. §3 hàng Hero: *"`gallery` đủ 4 ảnh sau khi loại trùng `mainImage` thì đi qua Hero mosaic"*. §3 hàng Gallery: *"gallery detail phải đi qua Hero mosaic"*, loại trừ **`article, person, organization`** — `touristDestination` **không** nằm trong danh sách loại trừ.

**Dữ liệu không thiếu, chỉ bị bỏ rơi ở tầng template.**

| Tầng | Trạng thái trước khi sửa |
|---|---|
| GROQ `queries/touristDestination.ts` | có `${galleryFragment()}` |
| Kiểu `lib/types.ts` | có `gallery?: ImageAsset[] \| null` |
| Sanity, doc `nha-trang` | `mainImage` + 4 ảnh gallery, không ảnh nào trùng ảnh chính |
| `TouristDestinationHub.astro` | chuỗi `gallery` **không xuất hiện lần nào** |

Cả 5 điểm đến approved đều đủ điều kiện mosaic (Đà Lạt 4, Ninh Thuận 4, Lâm Đồng 4, Khánh Hòa 14, Nha Trang 4). Không trang nào từng render được nó.

**Đo được** (bản dựng, Chrome, viewport 1366, trước khi sửa):

| Trang | ảnh chính | lưới gallery |
|---|---|---|
| `/nha-trang/` | **1366**×380 | **không có** |
| `/diem-tham-quan/bai-bien-doc-let/` | 735×380 | 627×380, 4 ô |

Khung ngoài của hero trùng khít từng pixel ở hai trang — lệch nằm hẳn **bên trong** hero, không phải lệch vị trí.

**Gốc của cái sai.** Chú thích ngay tại chỗ gọi dẫn §3.1 hàng *Nhãn loại entity* (`không áp dụng: … touristDestination`) rồi kết luận *"trang này không có huy hiệu, nên hero còn đúng một tấm ảnh"*. Hàng đó chi phối **lớp phủ**, không chi phối **thành phần ảnh**. `hasOverlay={false}` là đúng; suy tiếp sang bỏ `gallery` là sai. Chú thích đã viết lại để câu suy luận hỏng không tái sinh.

**Vì sao không cổng nào bắt được — hai khoảng mù chồng nhau.**

1. `entity-layout-post.ts` quét tự động **chỉ file kết thúc bằng `Detail.astro`**, nên `TouristDestinationHub.astro` nằm ngoài toàn bộ sổ hợp đồng layout (13 file ghi danh, không có nó).
2. `HERO_MOSAIC_CONTRACT` chỉ đọc `Hero.astro`, tức chỉ kiểm Hero **có cài** mosaic. Nó chưa bao giờ kiểm nơi gọi **có truyền** `gallery`.

Một caller đánh rơi prop thì mọi cổng vẫn xanh.

**Đã xử.**

- `TouristDestinationHub.astro`: truyền `gallery={td?.gallery}`; viết lại chú thích.
- `entity-layout-post.ts`: thêm **tầng 4 — Hero caller contract**. Mọi file render `<Hero>` phải ghi danh trong `HERO_CALLERS`, và mỗi thẻ `<Hero>` phải có prop `gallery`. Bộ cắt thẻ đếm ngoặc nhọn chứ không cắt ở `>` đầu tiên, vì `hasOverlay={badgeList.length > 0}` có `>` nằm trong biểu thức.

**Bằng chứng cổng biết đỏ** (chạy 2026-08-28): gỡ lại prop `gallery` → `[FAIL] … <Hero> thiếu prop gallery`, mã thoát **1**; thêm một component mới render `<Hero>` chưa ghi danh → `[FAIL] … chưa khai trong HERO_CALLERS`; khôi phục → `[pass]`, mã thoát **0**.

**Xác nhận sau sửa:** `dist/nha-trang/index.html` và `dist/ninh-thuan/index.html` đều ra `hero-block hero-block--mosaic` với 4 ô; đo trên trình duyệt ở 1366: ảnh chính 735×380 + lưới 627×380 — trùng hình dạng trang chi tiết.

## DR-077 — Hai danh sách bộ term không khớp nhau, nên trang term attraction xuất bản ra 404

**Trạng thái:** **đóng** 2026-08-28.

Phát hiện 2026-08-28 khi chạy lại bộ cổng sau dựng: 4/8 cổng đỏ, tất cả quy về đúng hai trang.

**Lệch gì.** Có HAI danh sách bộ term, ở hai nơi, và chúng không khớp:

| Nơi | Phủ bộ nào |
|---|---|
| `src/pages/[...path].astro` (sinh đường dẫn, qua `TERM_SET_ENTITY`) | experience-type, tour-type, **attraction-type** |
| `src/lib/queries/category.ts` (`categoryBySlugQuery`) | experience-type, tour-type — **thiếu attraction-type** |

Đường dẫn vẫn sinh ra, nhưng truy vấn trả `null`, `RouteDispatch` bật `notFound`, và trang 404 **được xuất bản như một trang thật**.

**Hệ quả đo được** (bản dựng 2026-08-28, trước khi sửa): `/diem-tham-quan/di-tich-lich-su/` và `/diem-tham-quan/thien-nhien-sinh-thai/` ra `<title>Không tìm thấy trang</title>`, không JSON-LD, không meta description. Bốn cổng đỏ vì chúng: `jsonld-post` (I6 + SEO), `governance-post` (S24-UPDATED-HTML, S24-AUTHORITY-HTML), và hai cổng phụ thuộc `control-registry-gate`, `deferred-gate`.

**Vì sao lọt.** `RouteDispatch.astro` đã nối đủ nhánh attraction từ trước — có `attractionsByTermQuery`, có chốt R2 "term chưa có entity nào trỏ tới thì trang không tồn tại". Chỉ mỗi bộ lọc trong truy vấn là chưa mở. Không cổng nào đối chiếu **hai danh sách bộ term** với nhau; cổng chỉ soi trang đã dựng, mà trang 404 vẫn là một file HTML hợp lệ nên chỉ đỏ ở tầng nội dung, không chỉ ra nguyên nhân.

**Vì sao báo cáo đã commit vẫn xanh.** `scripts/reports/postbuild-status.json` ở `d85f113` ghi `ranAt: 2026-08-27T09:05` và tất cả pass. Hai trang này chỉ mọc ra khi có Attraction mang nhãn mới — tức sau lượt migration, muộn hơn lần chạy cổng cuối. Bản dựng xanh không bảo chứng cho dữ liệu nạp sau nó.

**Đã xử.** `categoryBySlugQuery` thêm `"attraction-type"`. Kèm chú thích tại chỗ nêu rõ ràng buộc: danh sách này phải phủ đúng mọi khoá của `TERM_SET_ENTITY`.

**Xác nhận sau sửa:** hai trang ra trang term thật — `/di-tich-lich-su/` 8 card, `/thien-nhien-sinh-thai/` 15 card; JSON-LD có `CollectionPage`, `DefinedTerm`, `ItemList`, `TouristAttraction`; có meta description. Bộ cổng sau dựng **8/8 xanh**.

**Nợ còn lại (không đóng ở đây).** `RouteDispatch.astro` vẫn ép kiểu `entityType={entity as 'experience' | 'tour'}` khi gọi `TermIndex`, trong khi runtime nay truyền cả `'attraction'`. Ép kiểu đó chính là thứ che nhánh attraction khỏi mắt TypeScript. Hệ quả nhìn thấy được: `TermIndex` chỉ tính nhãn phụ cho experience và tour, nên card ở trang term attraction không hiện nhãn loại dù `toListings` đã mang sẵn `attractionType`. Không có cổng nào đối chiếu hai danh sách bộ term với nhau — đó mới là chỗ đáng dựng lưới.

## DR-078 — `06` §5.7 vẫn khai `tours` trong thứ tự khối mặc định, đặc tả và mã lệch sau khi gỡ khoá

**Nhãn nội bộ trong SPEC-2026-08-29: DR-a**

**Trạng thái:** mở. Phát hiện 2026-08-29, cùng lượt gỡ khoá `tours` khỏi `DEFAULT_SECTIONS` (đợt "thị giác di động", Task 3).

**Lệch gì.** `06-BINDING_MAP` §5.7 liệt kê `tours` trong thứ tự khối mặc định của trang chủ — viết trước khi `SPEC-2026-08-14-be-mat-vong-3` §3.4 thêm khối `HomeTourGrid` (khối "biên tập chọn", đứng ngoài `activeSections`). Task này gỡ dòng `{ key: 'tours', hidden: false }` khỏi `DEFAULT_SECTIONS` trong `SiteHome.astro:139-148` — khối rollup nó điều khiển nay thừa, vì `HomeTourGrid` đã ăn `featuredTours` qua `chonTourTrangChu` (Task 2). `06` §5.7 không được sửa cùng lượt — ràng buộc toàn cục của đợt cấm việc đó trong Task này.

**Hệ quả đo được.** `06` §5.7 và `DEFAULT_SECTIONS` trong mã nay liệt kê khác nhau: `06` còn `tours`, mã thì không. Nhánh `case 'tours':` trong switch render (`SiteHome.astro:282`, gọi `HomeRollupSection` với `td?.featuredTours`) thành mã chết — không phần tử nào của `activeSections` còn trỏ tới nó, nhưng nhánh vẫn đứng nguyên trong file.

**Vì sao lọt.** Ràng buộc toàn cục của đợt cấm sửa `06-BINDING_MAP` trong Task này — hai tầng thẩm quyền khác nhau (`CLAUDE.md` §1: `06`/`GOVERNANCE` trên spec task). Không có cổng nào đối chiếu danh sách khối trong `DEFAULT_SECTIONS` với danh sách khối liệt kê ở `06` §5.7.

**Đã xử.** Chưa. Cần chủ dự án chốt ở tầng đặc tả: sửa `06` §5.7 để bỏ `tours` khỏi thứ tự khối rollup mặc định (ghi chú nó đã tách thành khối biên tập chọn cố định), hoặc quyết định khác.

## DR-079 — `HomeTourGrid` render ngoài `activeSections`, nên sau Task này nó là khối tour duy nhất mà biên tập không tắt/đảo được

**Nhãn nội bộ trong SPEC-2026-08-29: DR-e**

**Trạng thái:** mở. Phát hiện 2026-08-29.

**Lệch gì.** `SiteHome.astro:195` gọi `<HomeTourGrid>` ngay trong markup, ngoài vòng `activeSections.map(...)` — khối duy nhất trong danh sách hàng đầu trang chủ không đi qua cơ chế bật/tắt và đảo thứ tự bằng `siteSettings.sections` mà `06` §5.7 khai là hợp đồng chung. Việc này có từ khi `HomeTourGrid` được thêm (`SPEC-2026-08-14` §3.4), không phải do Task này tạo ra.

**Hệ quả đo được.** Trước Task này, trang chủ có hai khối "Tour nổi bật": một do `HomeTourGrid` (ngoài `activeSections`, luôn hiện, vị trí cố định ngay sau hero), một do nhánh rollup `case 'tours'` (trong `activeSections`, biên tập tắt/đảo được qua Studio). Sau Task này (gỡ khoá `tours` khỏi `DEFAULT_SECTIONS`), chỉ còn khối `HomeTourGrid` — tức khối tour **duy nhất** trên trang chủ nay nằm hoàn toàn ngoài tầm điều khiển của `siteSettings.sections`. Biên tập mất quyền tắt khối tour hoặc đổi vị trí nó tương đối với các khối khác qua Studio.

**Vì sao lọt.** `HomeTourGrid` được viết như một khối cố định có chủ đích (dải màu đậm đầu tiên của trang, xem chú thích đầu file component) — không nằm trong phạm vi cơ chế `activeSections` ngay từ đầu. Task này chỉ được giao gỡ khoá rollup thừa; đưa `HomeTourGrid` vào `activeSections` là thay đổi kiến trúc, ngoài phạm vi spec Task này.

**Đã xử.** Chưa. Cần quyết định ở tầng đặc tả: đưa `HomeTourGrid` vào cơ chế `activeSections` (tốn công tái cấu trúc), hoặc ghi nhận chính thức trong `06` rằng khối tour là khối cố định, không thuộc hợp đồng bật/tắt của §5.7.

## DR-080 — `ADR-0026` neo ngưỡng đảo bài vào số tour đã publish, R6 lại tách hiển thị khỏi publish

**Nhãn nội bộ trong SPEC-2026-08-29: DR-n**

**Trạng thái:** mở. Phát hiện 2026-08-29.

**Lệch gì.** `ADR-0026` §Quyết định 4 (`docs/adr/ADR-0026-trang-chu-ganh-ca-san-pham.md:53`) khai: *"Nếu số tour đã publish rơi xuống dưới 3, khối này mất ý nghĩa (lưới 3 thẻ không đầy một hàng) và nên cân nhắc quay về tinh thần ADR-0024."* Tiền đề của quyết định này là khối tour hiển thị = tất cả tour đã publish (rollup toàn kho), nên đếm publish cũng là đếm hiển thị. Đợt R6 (Task 2, hàm `chonTourTrangChu`; Task này, R6b/R6d/R7) tách khối hiển thị khỏi rollup toàn kho: `HomeTourGrid` nay hiển thị theo `featuredTours` — danh sách biên tập chọn tay — không còn suy trực tiếp từ tổng số document `tour` đã publish.

**Hệ quả đo được.** Điều kiện kích hoạt ngưỡng của `ADR-0026` (đếm tour đã publish trong kho) và điều kiện thực tế điều khiển hiển thị (độ dài `featuredTours` sau `chonTourTrangChu`) nay là hai đại lượng độc lập. Kho có thể có N tour publish (N ≥ 3 hoặc N < 3) trong khi trang chủ hiển thị M tour biên tập chọn (M cố định theo lựa chọn biên tập, không tự đổi theo N) — luật lưới co theo số thẻ mà Task này thêm (R7, `:has()` trong `HomeTourGrid.astro`) xử đúng vấn đề hình ảnh mà `ADR-0026` §4 nêu (lưới không đầy hàng), nhưng bằng cơ chế khác hẳn ngưỡng publish mà ADR đã ghi.

**Vì sao lọt.** R6 giải quyết một vấn đề khác (biên tập kiểm soát tour nổi bật thay vì auto-rollup toàn kho theo `publishedAt`) mà không có bước đối chiếu ngược lại tiền đề đã chốt của `ADR-0026`. `CLAUDE.md` §1 xếp ADR ở tầng 3, spec của Task này ở tầng 6 — Task này không có thẩm quyền sửa ADR.

**Đã xử.** Chưa. Cần chủ dự án chốt ở tầng ADR: viết lại `ADR-0026` §Quyết định 4 để ngưỡng neo vào `featuredTours.length` thay vì tổng số tour đã publish, hoặc xác nhận đây là hai cơ chế cố ý độc lập (ngưỡng ADR nói về việc CÓ nên duy trì khối tour hay không khi kho cạn; R7 nói về cách khối đó tự thích ứng hình ảnh khi đang hiển thị) và không cần hoà giải.

## DR-090 — Task 5 đảo lại `SPEC-2026-08-14` §3.3: nút "Xem tất cả" quay về `--c-accent`, không còn `--c-sand`

**Nhãn nội bộ trong SPEC-2026-08-29: DR-b1**

**Trạng thái:** đã xử 2026-08-29, có chủ ý. Chủ dự án chốt `07-DESIGN_TOKENS` §1 thắng (`QĐ-2026-08-29-06`).

**Lệch gì.** `SPEC-2026-08-14-be-mat-vong-3.md` §3.3 khai: *"Nút chính đổi từ `--c-accent` (`#C0392B`) sang `--c-sand` (`#F5A623`) với chữ `--c-sand-text-strong` (`#3d2a05`), để nút thôi đụng màu với giá."* Đây là quyết định **có chủ ý** ở thời điểm spec được duyệt — né luật *"Không dùng làm nền CTA"* của `07-DESIGN_TOKENS` §1 bằng cách đổi chữ nút sang tối màu thay vì trắng, vì lý do gốc của `07` viện dẫn khi đó là *"tương phản với chữ trắng không đạt AA"* — và nút thật không dùng chữ trắng nên đọc như thoát được luật.

`HomeTourGrid.astro` `.tours-all` (Task này, Bước 1) đổi ngược lại: `background: var(--c-accent)`, `color: var(--c-text-inverse)` — đúng như trước khi `SPEC-2026-08-14` can thiệp.

**Vì sao đảo.** Task 5 sửa lại **lý do** trong `07-DESIGN_TOKENS` §1 (xem diff dòng khai `color.sand`): lý do thật không phải tương phản (nút `--c-sand` + `--c-sand-text-strong` đo **6,76:1**, đạt AA) mà là **phân vai màu** — `07` §1 đã giao `--c-accent` cho CTA và nhãn giá, cát cho gạch chân và nút trên nền đậm. Điều khoản *"Không dùng làm nền CTA"* giữ nguyên, không nới; SPEC §3.3 đổi màu nút để né luật đó mới là thứ lệch, không phải luật. Chủ dự án chốt trực tiếp `07` thắng qua `QĐ-2026-08-29-06` — đây là quyết định ở đúng tầng (chủ dự án), không phải suy ra từ thứ tự thẩm quyền mặc định của `CLAUDE.md` §1 (danh sách đó không liệt tên `07-DESIGN_TOKENS.md`).

**Đã xử.** Rồi — code khớp `07` §1 (điều khoản, không phải bản SPEC §3.3 cũ). `SPEC-2026-08-14` §3.3 **không được sửa** theo ràng buộc toàn cục của Task này; phiếu này là bản ghi chính thức của việc đảo, không phải một khoản nợ chờ xử thêm.

## DR-091 — Task 5 đảo lại `SPEC-2026-08-14` §3.4: khối tour thôi là "dải màu đầu tiên"

**Nhãn nội bộ trong SPEC-2026-08-29: DR-b2**

**Trạng thái:** đã xử 2026-08-29, có chủ ý. `QĐ-2026-08-29-06`.

**Lệch gì.** `SPEC-2026-08-14-be-mat-vong-3.md` §3.4 khai: *"Khối này dùng nền `--c-band-bg` của §3.3 — nó vừa là khối tour vừa là dải màu đầu tiên."* Đây là tiền đề thiết kế gốc: `HomeTourGrid` được giao hai vai cùng lúc — khối bán tour VÀ dải màu đậm mở đầu nhịp trang.

Task 5 (Bước 1) đổi `.home-tours { background: var(--c-band-bg) }` thành `background: var(--c-surface-alt)`. Khối tour thôi mang vai "dải màu đầu tiên".

**Hệ quả đo được.** Trước Task này, ba khối đầu trang chủ (hero, `HomeTourGrid`, `stats-band`) đều nền `--c-primary`/tổ hợp trỏ về nó, đọc thành một dải xanh liền ~2.000px ở khổ điện thoại (xem chú thích đầu `HomeTourGrid.astro`, viết lại ở Task này). Sau Task này, nhịp trang là đậm (hero) / sáng (`HomeTourGrid`) / đậm (`stats-band`) / sáng — vai "dải đậm đầu tiên" chuyển hẳn cho `stats-band`, không còn ai giữ chung hai vai.

**Vì sao đảo.** Tiền đề của `SPEC-2026-08-14` §3.4 đúng ở thời điểm chỉ có hai khối đậm liền kề; nó không tính tới việc `stats-band` (khối số liệu) cũng dùng cùng token `--c-primary`, biến ba khối liên tiếp thành một mảng. Task 5 sửa hệ quả thị giác này bằng cách tách vai — không đổi mã màu nào, chỉ đổi khối nào giữ vai nào (đúng khuôn ràng buộc toàn cục: không sửa `tokens.css`). Một Task khác cùng đợt ("thị giác di động") sẽ đo lại dải xanh trên trạng thái mới này bằng số.

**Đã xử.** Rồi — code không còn khớp câu "vừa là khối tour vừa là dải màu đầu tiên" của `SPEC-2026-08-14` §3.4. Spec đó **không được sửa** theo ràng buộc toàn cục của Task này; phiếu này là bản ghi chính thức của việc đảo.

## DR-092 — Task 5 đảo lại `ADR-0026` Hệ quả › Được, gạch đầu dòng 2

**Nhãn nội bộ trong SPEC-2026-08-29: DR-b3**

**Trạng thái:** mở — Task này không có thẩm quyền đóng. Phát hiện và đảo tại code 2026-08-29, `QĐ-2026-08-29-06`.

**Lệch gì.** `ADR-0026-trang-chu-ganh-ca-san-pham.md` (**Trạng thái: accepted**), mục Hệ quả › Được, gạch đầu dòng thứ hai: *"Khối tour cũng là dải màu đậm đầu tiên của trang, cắt mạch trắng liền — xem `SPEC-2026-08-14-be-mat-vong-3` §3.3."* ADR ghi đây là một **lợi ích đã đạt được** của quyết định thêm `HomeTourGrid`.

Sau Task 5, khối tour không còn nền đậm (xem `DR-091`, nhãn nội bộ `DR-b2`) — lợi ích này không còn đúng với code đang chạy. ADR vẫn đứng nguyên văn, không sửa, theo ràng buộc toàn cục của Task này (không chạm `ADR-0026*`).

**Hệ quả đo được.** `ADR-0026` là ADR **tầng 3** theo thứ tự thẩm quyền `CLAUDE.md` §1 — cao hơn spec bề mặt (tầng 6) mà Task 5 thực thi. Task 5 không có quyền sửa ADR để khớp lại; nó chỉ có quyền ghi phiếu drift. Nghĩa là tài liệu tầng 3 nay mô tả sai một hệ quả thị giác đã bị chính một Task tầng thấp hơn đảo — hợp lệ về thẩm quyền (chủ dự án đã ký `QĐ-2026-08-29-06` cho phép đảo ở tầng bề mặt) nhưng để lại một câu sai sự thật trong một tài liệu `accepted`.

**Vì sao không sửa cùng lượt.** Ràng buộc toàn cục của Task 5: *"KHÔNG sửa … `docs/adr/ADR-0026*`. … việc của bạn là ghi phiếu drift, không phải sửa chúng."* Sửa nội dung ADR là quyết định ở tầng ADR (đổi mô tả một hệ quả đã ghi trong hồ sơ accepted), không phải việc của một Task thực thi bề mặt.

**Đã xử.** Chưa, và Task này không đóng được. Cần chủ dự án chốt ở tầng ADR: sửa gạch đầu dòng 2 của mục Hệ quả › Được (gỡ câu "dải màu đậm đầu tiên", hoặc ghi chú nó đã hết hiệu lực từ `QĐ-2026-08-29-06` và trỏ sang `stats-band`), hoặc xác nhận giữ nguyên làm bản ghi lịch sử tại thời điểm ADR được chấp thuận.

## DR-093 — Task 5 làm ba token `--c-band-bg`/`-text`/`-muted` thành mồ côi, còn 0 người đọc, nhưng không được gỡ khỏi `tokens.css` trong đợt này

**Nhãn nội bộ trong SPEC-2026-08-29: DR-k**

**Trạng thái:** mở. Phát hiện 2026-08-29, cùng lượt Task 5.

**Lệch gì.** `tokens.css` khai ba token tổ hợp `--c-band-bg: var(--c-primary)`, `--c-band-text: #FFFFFF`, `--c-band-muted: #c5dcea` (thêm theo `SPEC-2026-08-14` §3.3, phục vụ đúng `HomeTourGrid.astro`). Trước Task 5, cả ba có đúng **ba người đọc**, cả ba đều trong `HomeTourGrid.astro`:

```
src/components/HomeTourGrid.astro:73:    background: var(--c-band-bg);
src/components/HomeTourGrid.astro:92:    color: var(--c-band-text);
src/components/HomeTourGrid.astro:99:    color: var(--c-band-muted);
```

Task 5 (Bước 1) thay cả ba dòng này bằng `--c-surface-alt` / `--c-primary` / `--c-text-muted`. Đo lại sau khi sửa:

```
grep -rn "c-band-" src/ | grep -v tokens.css
```

→ **0 kết quả.** Ba token vẫn khai trong `tokens.css:43-45`, nhưng không còn nơi nào trong `src/` đọc chúng.

**Hệ quả đo được.** `tokens.css` nay có ba token sống nhưng vô dụng — không phá gì (chúng không được ai gọi nên không ảnh hưởng render), nhưng là rác kiến trúc: người đọc `07-DESIGN_TOKENS` hoặc `tokens.css` sau này sẽ thấy `--c-band-*` và tưởng có nơi dùng, phải tự tra mới biết là mồ côi.

**Vì sao không gỡ luôn.** Ràng buộc toàn cục của Task 5 điểm 1: *"KHÔNG sửa `src/styles/tokens.css`, không thêm token, không đổi giá trị token."* Gỡ ba dòng khai báo là sửa `tokens.css`, ngoài phạm vi Task này dù có lý do chính đáng.

**Đã xử.** Chưa. Việc cần làm ở lượt sau: xác nhận lại `grep -rn "c-band-" src/ | grep -v tokens.css` vẫn ra 0 kết quả (đề phòng một Task khác trong cùng đợt lỡ thêm người đọc mới), rồi gỡ ba dòng `--c-band-bg`/`-text`/`-muted` khỏi `tokens.css` và khỏi bảng token tương ứng trong `07-DESIGN_TOKENS.md` (nếu có liệt kê) qua một Task riêng có quyền chạm `tokens.css`.

## DR-081 — `HomeHero.astro` là mã chết, ôm hai token sống mà không component nào khác đọc

**Nhãn nội bộ trong SPEC-2026-08-29: DR-c**

**Trạng thái:** mở. Phát hiện 2026-08-29, đợt "thị giác di động" (Task 9, đo lại cuối đợt).

**Lệch gì.** `src/components/HomeHero.astro` không được import ở bất kỳ file nào khác trong `src/` (xác nhận bằng `grep -rn "HomeHero" src --include="*.astro"` — chỉ một kết quả là chú thích trong chính `SiteHome.astro:378`, không phải import). Nó là người đọc duy nhất của hai token `--hero-min-h` / `--hero-min-h-mobile`, và tự khai `padding: 72px 0` / `80px` (`HomeHero.astro:130-131`) — số cứng ngoài thang khoảng cách. Hero trang chủ **thật sự đang chạy** là khối trong `SiteHome.astro`, hardcode `min-height: 560px` (`:315`) và `520px` (`:541`), độc lập hoàn toàn với `HomeHero.astro`.

**Hệ quả đo được.** Hai bề mặt hero cùng tồn tại trong `src/components/`: một là mã chết (`HomeHero.astro`) giữ hai token sống làm chúng trông như đang được dùng, một là mã đang chạy (`SiteHome.astro`) với số cứng riêng không đi qua token nào. Người đọc sau `07-DESIGN_TOKENS` gặp `--hero-min-h*` sẽ tưởng có nơi dùng thật.

**Vì sao lọt.** R5c (Task 3) cân nhắc nối `--hero-min-h-mobile` vào `.site-home-hero` rồi quyết định KHÔNG làm — lý do ghi trong `SPEC-2026-08-29 §…`: nối vào sẽ tạo hai vai cho một token, vì token đó thuộc về mã chết. Quyết định đúng cho phạm vi Task đó, nhưng để lại `HomeHero.astro` nguyên trạng vì gỡ file là ngoài phạm vi R5c.

**Đã xử.** Chưa. Cần quyết định ở tầng đặc tả: gỡ hẳn `HomeHero.astro` (và hai token `--hero-min-h*` nếu không còn người đọc nào khác), hoặc nối nó vào `SiteHome.astro` để hero trang chủ có một bản dựng duy nhất.

## DR-082 — `NearbySection.astro` tự dựng thẻ riêng, sau R1 là thẻ duy nhất còn hình dọc ở di động

**Nhãn nội bộ trong SPEC-2026-08-29: DR-f**

**Trạng thái:** mở. Phát hiện 2026-08-29.

**Lệch gì.** `NearbySection.astro:33-46` không import `Card.astro` — nó tự dựng cấu trúc thẻ riêng (`.nearby-card`, `.nearby-card-img`, `.nearby-card-body`, `.nearby-card-title`, xác nhận bằng đọc trực tiếp file). R1 (đợt "thị giác di động") đổi mọi thẻ dùng `Card.astro` từ dọc sang ngang ở di động; `NearbySection` không đi qua `Card.astro` nên không nhận thay đổi đó.

**Hệ quả đo được.** Sau R1, trên mọi trang chi tiết entity có khối "Gần đây", thẻ trong khối đó **giữ nguyên bố cục dọc** trong khi mọi thẻ khác trên cùng trang (dựng bằng `Card.astro`, qua `.card-grid`) đã chuyển ngang ở di động — một trang có hai kiểu thẻ khác hình dạng ở cùng khổ màn hình.

**Vì sao lọt.** Đặc tả R1 (v1 của kế hoạch) kê nhầm cả hai chiều: thiếu bốn loại trang (`AttractionDetail`, `EventIndex`, `PlaceDetail`, `TourIndex`) khỏi danh sách cần sửa, đồng thời liệt kê thừa `NearbySection` như thể nó dùng `Card.astro`. Không có cổng nào đối chiếu "danh sách component tự nhận là dùng `Card`" với "danh sách component thật sự import `Card`".

**Đã xử.** Chưa. Cùng họ với `DR-061` (hai bản mã dựng cùng một loại khối, lệch từ ngày fork). Việc cần làm: đưa `NearbySection` qua `Card.astro`, hoặc xác nhận có chủ đích giữ nó khác biệt và ghi lại lý do.

## DR-083 — `SiteHome.astro` tự dựng `<details>/<summary>` cho FAQ dù `FAQ.astro` đã tồn tại — bản dựng FAQ thứ hai

**Nhãn nội bộ trong SPEC-2026-08-29: DR-g**

**Trạng thái:** mở. Phát hiện 2026-08-29.

**Lệch gì.** `src/components/FAQ.astro` tồn tại như component FAQ dùng chung. `SiteHome.astro:289-297` (nhánh `case 'faq':` trong switch render khối) không gọi `FAQ.astro` — nó tự dựng `<details><summary>{item.question}</summary><p>{item.answer}</p></details>` trực tiếp trong markup.

**Hệ quả đo được.** Hai bản dựng FAQ độc lập cùng sống trong `src/`: `FAQ.astro` (dùng ở các trang khác) và bản tự dựng trong `SiteHome.astro`. Sửa cấu trúc, style, hay hành vi accessibility (N7) cho FAQ phải nhớ sửa cả hai chỗ — Task 9 gặp đúng cảnh báo này khi rà spec (xem ghi chú "sửa cả hai chỗ là hợp thức hoá một bản dựng trùng").

**Vì sao lọt.** `SiteHome.astro` là file lâu đời nhất trong nhóm trang chủ, viết trước khi `FAQ.astro` được tách thành component dùng chung; không có bước dọn lại chỗ gọi cũ khi tách component.

**Đã xử.** Chưa. Việc cần làm: thay nhánh `case 'faq':` trong `SiteHome.astro` bằng lời gọi `<FAQ>`, kiểm lại props hai bên khớp nhau trước khi đổi.

## DR-084 — Số cứng ngoài thang khoảng cách: `HomeHubGrid.astro:93` (`72px`) và `:174` (`10px`)

**Nhãn nội bộ trong SPEC-2026-08-29: DR-h**

**Trạng thái:** mở. Phát hiện 2026-08-29.

**Lệch gì.** `tokens.css:3` tuyên bố "0 hardcoded value bên ngoài file này" cho khoảng cách. `HomeHubGrid.astro:93` khai `padding: 72px 0;` và `:174` khai `padding: 4px 10px;` — cả hai không khớp giá trị nào trong thang khoảng cách hiện có (`--s1`…`--s9` hay tương đương). Cùng họ với số cứng `72px`/`80px` trong `HomeHero.astro:130-131` (xem `DR-081`).

**Hệ quả đo được.** Hai điểm khoảng cách trong `HomeHubGrid.astro` không đi qua token — đổi thang khoảng cách toàn site sau này sẽ không chạm hai điểm này, tạo lệch âm thầm.

**Vì sao lọt.** Không có cổng cơ giới quét toàn `src/` để bắt số cứng ngoài thang khoảng cách (khác với token màu, vốn có `check:token-parity` dù chính nó cũng có nợ, xem `DR-059`).

**Đã xử.** Chưa. Việc cần làm: đổi hai số cứng này sang token gần nhất trong thang, hoặc nếu 72px/10px có chủ đích riêng (không phải rãnh/đệm chung) thì ghi rõ lý do miễn trừ.

## DR-085 — Tracking (letter-spacing) trái `07-DESIGN_TOKENS` §2 ở nhiều heading

**Nhãn nội bộ trong SPEC-2026-08-29: DR-i**

**Trạng thái:** mở. Phát hiện 2026-08-29.

**Lệch gì.** `HomeTourGrid.astro:83` khai `letter-spacing: 0.12em` cho một eyebrow — thang khai `--ls-eyebrow: 0.08em` (`tokens.css:126`) và bắt buộc đi kèm `--lh-eyebrow: 1.5` (`tokens.css:131`, chú thích: chữ hoa tiếng Việt vẫn mang dấu nên cần line-height cao hơn kèm tracking dương, nếu không dấu bị dòng trên cắt). `HomeTourGrid.astro:83` dùng tracking dương ngoài thang mà không kèm `--lh-eyebrow`. Cộng thêm nhiều chỗ tracking **âm** trên heading tiếng Việt — xác nhận trực tiếp ba ví dụ: `Card.astro:134` (`-0.01em`), `HomeTourGrid.astro:92` (`-0.015em`), `Section.astro:56` (`-0.015em`) — đặc tả đợt này ghi nhận tổng cộng 7 chỗ thuộc họ này trên toàn `src/` (chưa liệt kê lại đủ 7 ở đây).

**Hệ quả đo được.** Tracking âm trên chữ có dấu tiếng Việt có nguy cơ làm dấu chồng lên ký tự liền kề, đặc biệt ở cỡ chữ nhỏ trên di động — rủi ro thị giác trực tiếp, không chỉ lệch token.

**Vì sao lọt.** Không có cổng kiểm `letter-spacing` âm trên heading tiếng Việt; token parity hiện chỉ theo dõi giá trị token đã khai, không theo dõi việc dùng số cứng thay token ở thuộc tính này.

**Đã xử.** Chưa. Việc cần làm: rà toàn bộ 7 điểm, đổi về `--ls-eyebrow` kèm `--lh-eyebrow` cho trường hợp eyebrow, và xác nhận có nên tiếp tục dùng tracking âm nào trên heading tiếng Việt không.

## DR-086 — Cả họ field `featured*` không lọc `reviewStatus` khi deref lên trang chủ và trang điểm đến — 10 ô, R6c mới đóng 1

**Nhãn nội bộ trong SPEC-2026-08-29: DR-j**

**Trạng thái:** mở. Phát hiện 2026-08-29 (mở rộng từ 1 field lên 10 ô ở v3 của đặc tả đợt này).

**Lệch gì.** `src/lib/queries/touristDestination.ts:108-112` deref **năm** field bằng `entityRefFragment(lang)` (`src/lib/queries/fragments.ts:90`) không lọc `reviewStatus`: `featuredAttractions`, `featuredStays`, `featuredExperiences`, `featuredSpecialties`, `featuredTours` — xác nhận trực tiếp bằng đọc file, cả năm dòng liền kề đều gọi `${entityRefFragment(lang)}` mà không có mệnh đề `select(...)` hay điều kiện `reviewStatus` đi kèm. Năm field này deref lên **hai** trang: trang chủ và `TouristDestinationHub.astro:150-167` → **10 ô**. R6 (Task 2, hàm `chonTourTrangChu`) đóng đúng **1 ô** ("tour × trang chủ") bằng cơ chế lọc riêng ở tầng chọn hiển thị, không sửa GROQ; **chín ô còn lại vẫn hở**. Hợp đồng đã khai luật rõ ràng (`01-CONTENT_MODEL §2.1`: "chỉ trỏ entity đã publish"; `06-BINDING_MAP:155`) nên đây là drift, không phải chỗ thiếu quyết định. Khuôn thi hành đã có sẵn trong cùng codebase: `src/lib/queries/event.ts:29` và `tour.ts:41` dùng `select(… reviewStatus == "approved" …)`. Lệch ngay trong cùng file `touristDestination.ts`: `:56` (`homepagePlaces`) và `:78` (`homepageArticles`) **có** lọc `reviewStatus == "approved"`, chỉ năm field `featured*` là không.

**Hệ quả đo được.** Chín trong mười ô còn có thể lọt entity `draft`/chưa duyệt lên bề mặt sống (trang chủ, trang điểm đến) qua các field `featuredAttractions`/`featuredStays`/`featuredExperiences`/`featuredSpecialties` (cả hai trang) và `featuredTours` (riêng trang điểm đến — trang chủ đã đóng qua R6).

**Vì sao lọt.** `entityRefFragment` là fragment dùng chung, viết như một tiện ích deref tổng quát, không tự mang điều kiện `reviewStatus` — người viết mỗi query phải tự thêm `select()` khi cần lọc, và bốn trong năm field `featured*` (`homepagePlaces`/`homepageArticles` là ngoại lệ đã lọc đúng) chưa được thêm. Cùng họ với lỗi production `DR-089` (`containedInPlace`/`mentions`), nhưng khác ở chỗ họ `featured*` có hợp đồng khai rõ để viện dẫn, còn `DR-089` là hợp đồng im lặng.

**Đã xử.** Chưa. R6c chỉ đóng 1/10 vì phạm vi Task đó là chọn tour hiển thị trang chủ, không phải sửa GROQ toàn diện. Việc cần làm: thêm `select(reviewStatus == "approved" || _type == "category" ...)` (khuôn của `event.ts`/`tour.ts`) vào cả năm field `featured*`, tại cả hai nơi gọi.

## DR-087 — Trang chủ đa ngôn ngữ mất khối tour sau R6b — bẫy ngủ yên, đã lên cò

**Nhãn nội bộ trong SPEC-2026-08-29: DR-l**

**Trạng thái:** mở. Phát hiện 2026-08-29.

**Lệch gì.** `src/pages/[lang]/index.astro:98` render `<SiteHome td={td} lang={lang} destinationHref={destinationUrl} config={config} />` — **không truyền** prop `homeTours`. `SiteHome.astro:34` mặc định `homeTours = []` khi prop không được truyền. `HomeTourGrid.astro:33` tự ẩn khối khi `tours.length === 0` (`{tours.length > 0 && (...)}`). Xác nhận cả ba điểm bằng đọc trực tiếp file.

**Hệ quả đo được.** Nếu route `[lang]/` sinh ra trang, trang chủ ngôn ngữ đó sẽ có **0** khối tour — không lỗi, không cảnh báo, chỉ đơn giản khối biến mất. R6b (đợt "thị giác di động") gỡ nhánh rollup `tours` khỏi `activeSections` cho phiên bản tiếng Việt nhưng không rà việc `[lang]/index.astro` có đường dữ liệu riêng cho `homeTours` hay không.

**Vì sao lọt.** Bẫy hiện đang **ngủ yên**: `langs = ['vi']` (`site.config`) nên `nonDefaultLangs` rỗng, `getStaticPaths` trả mảng rỗng, route `[lang]/` không sinh trang nào trong `dist/` hôm nay — không có URL sống nào để đo hay để cổng bắt được. Nhưng chú thích tại chỗ trong chính file (`[lang]/index.astro:15`) ghi rõ: route này "tự bật lại khi thêm ngôn ngữ" — nghĩa là bẫy đã lên cò, chỉ chờ `langs` có phần tử thứ hai.

**Đã xử.** Chưa. Việc cần làm trước khi bật ngôn ngữ thứ hai: truyền `homeTours`/`homeTourTotal` vào `<SiteHome>` trong `[lang]/index.astro`, lấy từ cùng nguồn `chonTourTrangChu` mà trang chủ mặc định dùng.

## DR-088 — Bất biến "reference deref lên bề mặt sống phải trỏ entity đã duyệt" không cổng nào kiểm, và `ADR-0008` làm nó vô hình theo thiết kế

**Nhãn nội bộ trong SPEC-2026-08-29: DR-m**

**Trạng thái:** mở. Phát hiện 2026-08-29.

**Lệch gì.** `scripts/validate-constraints.ts:52-54` khai `FULL_CORPUS_VALIDATORS = new Set(['I1','I4','I7','I8','I13','I14','I15','I17','I18','I-FAQ-TYPE'])` — các validator này cố ý chạy trên **toàn corpus, kể cả document nháp** (`reviewStatus !== 'approved'`), theo `ADR-0008` §Quyết định 4: validator quan hệ/ref-integrity và điều cấm cần thấy đủ corpus để bắt tham chiếu hỏng ngay cả khi trỏ tới draft. Nhưng hệ quả là: không validator nào trong bộ này, và không validator nào ngoài bộ này, thật sự kiểm bất biến "field deref lên một **bề mặt sống** (trang đã publish) phải trỏ entity **đã duyệt**" — đây là bất biến khác với "tham chiếu không hỏng" (ref-integrity) mà `FULL_CORPUS_VALIDATORS` đang kiểm. `g1`/`g3`/`g4` (bộ cổng meta) cũng không phủ: `g3` không parse cột ghi chú review trong `06-BINDING_MAP`, `g4` chỉ xét field có tồn tại trong schema hay không, không xét điều kiện lọc lúc deref.

**Hệ quả đo được.** `DR-086` (9/10 ô hở `reviewStatus`) là một biểu hiện CỤ THỂ của bất biến này bị vi phạm, nhưng không có cổng nào tự phát hiện được nó — Task 9 tìm ra bằng cách đọc trực tiếp `touristDestination.ts`, không bằng một `[fail]` từ bộ kiểm. Nếu không có lượt rà thủ công này, lớp lỗi này vô hình vĩnh viễn.

**Vì sao lọt.** `ADR-0008` Quyết định 4 là quyết định có chủ đích (không lọc toàn cục ở `fetchAllDocs`, để giữ khả năng bắt ref-integrity hỏng trên draft) — nhưng tác dụng phụ của quyết định đó là che luôn lớp lỗi "deref hiện draft lên bề mặt sống", vì không có validator thứ hai bù lại khoảng trống này. Mở lại `ADR-0008` là việc tầng ADR (tầng 3), không phải việc sửa mã ở tầng Task.

**Đã xử.** Chưa. Cần quyết định ở tầng ADR: hoặc viết thêm một validator mới chuyên kiểm "deref lên bề mặt sống trỏ entity đã duyệt" (khác nhiệm vụ với `FULL_CORPUS_VALIDATORS`), hoặc mở rộng phạm vi `g4`/`g3` để phủ điều kiện lọc lúc deref, không chỉ field có tồn tại.

---

## DR-089 — ⚠ LỖI PRODUCTION ĐANG SỐNG, ngoài phạm vi đợt "thị giác di động" nhưng nặng hơn mọi phiếu trên: `containedInPlace`/`mentions` deref không lọc `reviewStatus`, hợp đồng im lặng nên không đóng được bằng cách viện điều khoản

**Trạng thái:** mở. Phát hiện và ghi trong `SPEC-2026-08-29-thi-giac-di-dong.md §7` mục 7; Task 9 đo lại 2026-08-29 để phiếu mang số tươi (khác `DR-086`/`DR-j`: đây là lỗi **đang gây 404 trên site thật hôm nay**, không phải rủi ro tiềm ẩn).

**Lệch gì.** Cùng họ với `DR-086` (field `featured*` deref không lọc `reviewStatus`), nhưng ở đây là hai field khác: `containedInPlace` và `mentions`. Khác biệt quan trọng: họ `featured*` có hợp đồng khai rõ ("chỉ trỏ entity đã publish", `01-CONTENT_MODEL §2.1`, `06-BINDING_MAP:155`) nên có căn cứ để viện dẫn khi đóng phiếu; `containedInPlace`/`mentions` **không có hợp đồng khai lọc nào** (im lặng) — nghĩa là không thể đóng phiếu này bằng cách chỉ ra một điều khoản đã có rồi thi hành đúng điều khoản đó, như cách `DR-086` có thể làm. Cần một quyết định nội dung mới (lọc ở đâu, theo cơ chế nào), không chỉ một bản vá kỹ thuật.

**Đo lại 2026-08-29 (Task 9), dùng đúng bộ lệnh của brief:**

```
/dia-danh/hon-ba/            404
/dia-danh/cam-ranh/          404
/dia-danh/nui-co-tien/       404
```

```
curl -s "https://tourdao.vn/diem-tham-quan/khu-du-lich-kong-forest/?cb=$RANDOM" | grep -o 'href="/dia-danh/[a-z-]*/"'
→ href="/dia-danh/hon-ba/"
```

Khớp đúng mẫu xác minh đã ghi trong `SPEC-2026-08-29 §7` mục 7 — lỗi vẫn sống, chưa ai sửa kể từ khi spec ghi nhận.

**Số liệu bối cảnh (từ `SPEC-2026-08-29 §7` mục 7, không đo lại toàn bộ trong Task 9 — phạm vi đo lại của Task 9 chỉ là ba lệnh `curl` và một lệnh `grep` ở trên):**
- **7 trang sống, 5 link vào 404**, cộng JSON-LD (`containedInPlace`) trỏ thẳng vào URL 404 — ví dụ `"containedInPlace":{"@id":"https://tourdao.vn/dia-danh/hon-ba/", ...}`.
- **67/208** document trong perspective `published` mang `reviewStatus: "draft"`.
- **2/26** deref trong `src/lib/queries/` có lọc `reviewStatus`.
- `cms/schemas/*.ts` có **0** chỗ khai `options.filter` — ô chọn reference trong Sanity Studio vẫn mời biên tập chọn document chưa duyệt cho các field này.

**Hệ quả đo được.** Người dùng thật bấm vào các link tự sinh từ `containedInPlace`/`mentions` trên trang sống và gặp 404. Máy tìm kiếm đọc JSON-LD cũng thấy `@id` trỏ vào URL 404 — hại SEO kỹ thuật trực tiếp, không chỉ hại trải nghiệm.

**Vì sao lọt.** Cùng nguyên nhân kỹ thuật với `DR-086`/`DR-088` (deref chung không tự lọc `reviewStatus`, người viết từng query phải tự thêm), nhưng ở đây còn thiếu cả hợp đồng khai báo — không ai từng quyết định `containedInPlace`/`mentions` có phải lọc hay không, nên không có điều khoản nào để thi hành hay để một cổng đối chiếu.

**Đã xử.** Chưa — và **không sửa trong đợt "thị giác di động"** (ràng buộc toàn cục điểm 6 của Task 9: không sửa `containedInPlace`/`mentions` dù đang gây 404, cần quyết định riêng). **Cần quyết định riêng, ở tầng nội dung/kiến trúc:** lọc trong GROQ (thêm `select(reviewStatus == "approved" ...)`, khuôn có sẵn ở `event.ts`/`tour.ts`), hiện tên không kèm link cho entity chưa duyệt, hoặc khoá ô chọn reference trong Studio bằng `options.filter`. Việc trước mắt độc lập với quyết định trên: 67 document `draft` đang lẫn trong `published` perspective là dữ liệu cần rà lại, không phải lỗi mã.


---

## DR-094 — Breadcrumb và link "Mở bản đồ" dưới 44px trên trang chi tiết entity — vùng chưa từng được đặc tả nhắm tới, không phải mã lệch đặc tả

**Trạng thái:** mở. Phát hiện 2026-08-29 khi Task 9 (đợt "thị giác di động") đo K3 ngoài trang chủ để đối chiếu R1b; chủ dự án xác nhận phạm vi và yêu cầu mở phiếu riêng (vòng sửa 1 của Task 9).

**Lệch gì.** `.breadcrumb-item a` (`Breadcrumb.astro:84`, thẻ `<a href={crumb.href}>{crumb.label}</a>` không mang class riêng) và `.map-card-link` (`AttractionDetail.astro:171`, link "Mở bản đồ") đều **không khai `min-height`** trong CSS của chúng (`Breadcrumb.astro:125-128`, `AttractionDetail.astro:184-192`). Ở khổ điện thoại, cả hai co về chiều cao nội dung chữ — dưới ngưỡng 44px.

**Đo được.** Đo lại 2026-08-29 trên `dist/` tại HEAD `b2a88e5` (`do.js`, iframe 390×844):

| Trang | Số đích chạm <44px |
|---|---|
| `/diem-tham-quan/di-tich-lich-su/` | 2 (`a. h=25` ×2) |
| `/diem-tham-quan/khu-du-lich-hon-mun/` | 5 (`a. h=25` ×4, `a.map-card-link h=25` ×1) |
| `/tour/vinh-san-ho/` | 2 (`a. h=25` ×2) |

Giảm từ 24/27/24 (đo nền `truoc.md`) xuống 2/5/2 — phần lớn nhờ hiệu ứng phụ của các sửa khác trong đợt này, không phải một sửa nhắm trực tiếp vào hai component này. **Chưa về 0.**

**Bổ sung 2026-08-29 (đợt sửa sau review toàn nhánh) — thêm một lớp nữa.** `a.term-pill` (`EntityIndex.astro`, lối lọc theo term trên trang danh sách; định nghĩa `.term-pill` không khai `min-height`) cũng dưới 44px. Đo trên `/tour/`: **41px**, **9** đích chạm dưới ngưỡng. Khác hai lớp đã ghi ở trên (`breadcrumb-item a`, `.map-card-link`) ở chỗ nó nằm trên trang **danh sách** (`EntityIndex.astro`), không phải trang **chi tiết** — tức vùng "chưa từng được đặc tả nhắm tới" ở phiếu này rộng hơn tiêu đề ban đầu ghi, không chỉ trang chi tiết entity.

**Dữ liệu lịch sử liên quan.** Task 7 (R4, cùng đợt) đã tình cờ phát hiện đúng lớp vấn đề này khi đo thêm để xác minh `FAQ.astro`: báo cáo Task 7 (`task-7-report.md`, mục "Điểm nghi ngại còn lại") ghi nhận **11 đích chạm nhỏ khác trên một trang chi tiết `/diem-tham-quan/...`** (`a. h=25/26`, `a.astro-nmbp33ka h=24`, `a.map-card-link h=25`), nêu rõ "không thuộc 8 file trong phạm vi Task 7", không sửa, và đề nghị "Task khác (nếu R4 mở rộng sang trang chi tiết) biết chỗ cần nhắm". Task 9 nay xác nhận lại phát hiện đó bằng phép đo độc lập trên bản dựng cuối, khoanh đúng danh tính hai component gây ra.

**Vì sao lọt — và vì sao đây KHÔNG PHẢI drift theo nghĩa thông thường của sổ này.** `DRIFT_LOG.md` dòng 3 định nghĩa drift là "đặc tả và sản phẩm không khớp nhau". Không `docs/core-specs/` hay `docs/adr/` nào khai một hợp đồng "mọi đích chạm trên mọi trang phải ≥44px" (`grep -rln "44px" docs/core-specs/ docs/adr/` → 0 kết quả). R4 của `SPEC-2026-08-29-thi-giac-di-dong.md` (§2.5, "32 đích chạm dưới 44px") tự giới hạn phạm vi vào các thành phần trang chủ — toàn bộ danh sách 32 đích chạm liệt kê đều là `.home-view-all`/`.see-all`/link chân trang/`summary` FAQ/`.logo`/`.skip-link`, và Task 7 (thi hành R4) chỉ đụng 8 file trang chủ/layout dùng chung, xác nhận qua `Chạy await __do('/')` ở Bước 1. `Breadcrumb.astro` và `AttractionDetail.astro`/`PlaceDetail.astro` **không có mặt** trong danh sách file của bất kỳ Task nào trong toàn kế hoạch `docs/plans/2026-08-29-thi-giac-di-dong.md`. Nói cách khác: đây không phải chỗ đặc tả hứa một điều rồi mã không làm đúng — đây là **một vùng mà không đặc tả nào của đợt này từng nhắm tới**, nên không có "hứa" nào để lệch. Ghi phiếu vì hệ quả thị giác/khả năng bấm là thật và đo được, và vì hai component này dùng chung site-wide nên nhiều khả năng lặp trên mọi trang chi tiết entity khác, không chỉ ba trang đo ở đây.

**Chưa xử.** Cần một quyết định **ở tầng đặc tả trước khi có Task sửa**: 44px là chuẩn chỉ áp cho trang chủ (như R4 đã làm), hay là chuẩn toàn site (áp cả breadcrumb, map-card-link, và mọi đích chạm khác trên trang chi tiết/index)? Nếu chọn toàn site: cần một lượt quét đích chạm <44px trên đại diện đủ các loại trang (không chỉ ba trang lưới 1 thẻ), không chỉ hai component đã nêu ở đây.

---

## DR-095 — ⚠ LỖI ĐANG SỐNG, ngoài phạm vi mọi Task: `NearbySection.astro` dính đúng cơ chế `DR-062`, đang chạy trên ít nhất 4 trang production

**Trạng thái:** mở. Phát hiện 2026-08-29, lượt review toàn nhánh `feat/thi-giac-di-dong`, khi đối chiếu khuôn `:has()` mà `Card.astro`/`EntityIndex.astro`/`HomeRollupSection.astro` dùng với các component lưới khác trong repo dùng cùng khuôn. **Ngoài phạm vi mọi Task của đợt "chữa thị giác di động"** — chỉ ghi phiếu, không sửa (xem "Vì sao không sửa ở đây" dưới).

**Lệch gì.** `NearbySection.astro:95-96` (ngoài mọi media query) khai:

```css
.nearby-grid:has(> :last-child:nth-child(2)) { grid-template-columns: repeat(2, 1fr); }
.nearby-grid:has(> :last-child:nth-child(3)) { grid-template-columns: repeat(3, 1fr); }
```

— `:has()` lấy độ đặc hiệu của đối số bên trong nên hai luật này đặc hiệu cao. `:171-175` thu hẹp ở khổ điện thoại bằng bộ chọn trần:

```css
@media (max-width: 640px) {
  .nearby-grid { grid-template-columns: 1fr; }
}
```

— đặc hiệu thấp hơn, thua. **Đúng cơ chế `DR-062`:** khối có đúng 2 hoặc 3 mục không bao giờ đổ về một cột ở `≤640px`; khối 1 mục hoặc ≥4 mục không khớp luật `:has()` nào (chỉ có nhánh cho 2 và 3) nên vẫn rơi xuống media query và thu bình thường — đó là lý do lưới bên cạnh trông đúng còn lưới 2-3 mục thì không, và vì sao lỗi khó bị nhận ra bằng mắt khi lướt qua nhiều trang.

**Đo được**, khung 390px, trên bản dựng hiện tại:

| Trang | số mục | `.nearby-grid` computed |
|---|---|---|
| `/diem-tham-quan/khu-du-lich-bai-tranh/` | 2 | `167px 167px` |
| `/diem-tham-quan/khu-du-lich-mini-beach/` | 2 | 2 cột |
| `/diem-tham-quan/lang-chai-hon-mieu/` | 2 | 2 cột |
| `/khach-san/sunkiss-hotel/` | 3 | **`103.3px × 3`** |
| `/diem-tham-quan/vinh-nha-trang/` | 1 | `358px` ✓ (đối chứng — 1 mục không khớp luật `:has()` nào nên thu đúng) |

Ba thẻ 103px cạnh nhau trên màn 390px, mỗi thẻ mang ảnh 4:3 và tiêu đề cắt 2 dòng — vi phạm **Luật 5** (`06` §6: mỗi thẻ một hàng, chiếm trọn bề ngang ở khổ điện thoại). Hôm nay có vẻ hiếm gặp (lưới phổ biến nhất là ≥4 mục lân cận), nhưng **đây không phải trường hợp dựng riêng để minh hoạ** — bốn trang trên là ví dụ thật đo được trên bản dựng hiện tại; bất kỳ entity nào có đúng 2 hoặc 3 lân cận cùng loại thì trang chi tiết của nó dính lỗi.

**`DR-062` tự đóng bằng một câu nay không còn đúng.** `DR-062` (dòng 1571 sổ này) viết: *"Chỉ **trang chủ** mới dính lỗi này trên production, và **từ trước đợt refactor** — không phải hồi quy."* Câu đó đúng tại thời điểm `DR-062` được ghi và đóng (2026-08-25) — lượt vá khi đó chỉ sửa `HomeRollupSection.astro`. `NearbySection.astro` dùng đúng khuôn `:has()` lỗi, chưa từng được vá theo khuôn ba media query nhắc lại đầy đủ bộ chọn (như `HomeRollupSection.astro:157-163` hay `EntityIndex.astro` sau đợt sửa này) — cơ chế y hệt, tệp khác, chưa ai đụng tới. "Đã xử" của `DR-062` chỉ đóng đúng một tệp, không đóng cơ chế; câu tổng kết phạm vi của nó cần đọc lại là "đã đúng tại thời điểm đó", không phải "còn đúng hôm nay".

**Vì sao không sửa ở đây.** `NearbySection.astro` không nằm trong danh sách file của bất kỳ Task nào trong kế hoạch `docs/plans/2026-08-29-thi-giac-di-dong.md`, và đợt sửa sau review này (mục A–J) chỉ được giao đúng phạm vi lượt review đã nêu — mục I của lượt review nói rõ "KHÔNG sửa `NearbySection.astro`". Sửa ở đây là mở rộng phạm vi ngoài spec đã duyệt (`CLAUDE.md` §5).

**Đã xử.** Chưa. Việc cần làm ở một Task riêng có phạm vi bao gồm `NearbySection.astro`: nhắc lại nguyên bộ chọn `:has(> :last-child:nth-child(2))` và `:has(> :last-child:nth-child(3))` bên trong khối `@media (max-width: 640px)` (`:171-175`), đúng khuôn đã dùng ở `HomeRollupSection.astro:157-163` và `EntityIndex.astro`.
