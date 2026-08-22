# QA1 — Mockup bước 7, đợt 4B — **VÒNG 2** (kiểm lại sau khi Design sửa)

- **Ngày:** 2026-08-22
- **Vai:** QA độc lập (GOVERNANCE §2.1). Tác nhân này **không** soạn mockup và **không** soạn bản phản hồi đang kiểm.
- **Commit HEAD:** `95560fd` (vòng 1 kiểm ở `dc0ac4c`)
- **Cổng:** QA1 (Design → Code), spec `docs/core-specs/08-QA_CHECKLIST.md` mục A→F, báo cáo theo mục G.
- **Đầu vào đã đọc:** `QA1-mockup-4b.md` (vòng 1) · `PHAN-HOI-QA1-vong-1.md` (Design khai) · 6 mockup ở `docs/design/vong4/` · `06-BINDING_MAP` §0, §1, §3, §3.1, §4.2/4.3/4.4/4.8, §6 · `01-CONTENT_MODEL` (dòng 325, mục 8, I1/I14/I16) · `04-CONSTRAINTS` I1 · `src/styles/tokens.css` · `07-DESIGN_TOKENS` §1, §1b, §2, §3 · `src/lib/uiCopy.ts` · `src/components/NearbySection.astro` · `src/lib/serialize/tour.ts` · `data/prices.yaml`.
- **Kết luận nhanh:** **CHƯA ĐẠT QA1** — **0 lỗi mức Cao** (cả ba lỗi Cao của vòng 1 đã đóng), nhưng còn **4 lỗi Trung bình mở**, trong đó 3 lỗi sửa được ngay trong file và 1 lỗi cần quyết định của Cowork. Chi tiết ở mục 6 và 7.

> Ghi nhận trước khi vào chi tiết: đợt sửa này là thật, không phải lời khai. 6/6 mẫu `grep` mà Design đề nghị soi đều bằng 0; toàn bộ token mới khớp `tokens.css` từng giá trị; tương phản hero sau khi đổi gradient được đo lại và **đạt AA với biên rộng ở cả ba bộ giao diện**. Phần còn lại chủ yếu là hai nửa việc bị bỏ dở và một lỗi markup nhỏ do chính đợt sửa đẻ ra.

---

## 1. Kiểm sáu mẫu `grep` phải bằng 0

Chạy trên đúng 6 file trong phạm vi (`Main`, `DiDong`, `DiaDanh`, `TraiNghiem`, `Tour`, `TourDiDong`):

| Mẫu | Số lần | Kết luận |
|---|---|---|
| `--sticky-h` (không phải `--sticky-bar-h`) | **0** | đạt |
| `-0.015em` | **0** | đạt |
| `rgba(8,47` | **0** | đạt |
| `height:68px` | **0** | đạt |
| `padding:10px 20px` | **0** | đạt |
| `width:36px` | **0** | đạt |
| *(QA thêm)* `rgba(248,250,252,.22)` — nền huy hiệu hero cũ | **0** | đạt |
| *(QA thêm)* `min-height:0` — ghi đè chốt chặn CTA | **0** | đạt |

*Lưu ý để khỏi nhầm khi ai đó `grep` cả thư mục:* `-0.015em` vẫn còn ở `BanDoThongTin.dc.html:35` và `HienTrang.dc.html:37`. Hai file này là **artboard khảo sát của bước trước, ngoài phạm vi đợt 4B** (vòng 1 §1 đã loại). Không tính là sót.

---

## 2. Xác minh từng mục Design khai đã sửa

### 2.1 Ba lỗi mức Cao — **đóng cả ba**

| ID | Khai | Kiểm | Bằng chứng |
|---|---|---|---|
| **F1** | Gỡ nhãn chờ giá của Trải nghiệm | **Đúng — đóng** | `TraiNghiem:129-133`: khối sidebar đầu chỉ còn `<!-- Chưa nối bookingRef → KHÔNG vùng giá, KHÔNG nhãn chờ giá, KHÔNG nút thay thế (06 §0 quyết định nền 3, §6 luật 3) -->` rồi hai nút kênh. Không còn chuỗi "Hỏi giá và giữ chỗ", không còn câu "Giá theo gói lặn…". `grep` "Hỏi giá\|báo giá" trên `TraiNghiem` = 0. Thanh dính `TraiNghiem:86-90` cũng không có vùng giá ✔ |
| **F2** | Thêm khối hành động vào sơ đồ di động Điểm tham quan | **Đúng — đóng** | `DiDong:102`: "**3 · Khối hành động** — vé vào cửa + Đặt vé qua Zalo + hotline; ngay sau Thông tin nhanh (06 §3), CTA còn lặp ở thanh đáy". Khớp đúng chữ của `06` §3 hàng "Khối hành động". Câu cũ "giá chỉ ở thanh đáy" nay là "không chứa giá" (`DiDong:101`) — khớp `06` §3 hàng "Thông tin nhanh" ("không chứa giá") |
| **F3** | 14 chỗ mang cờ `data-placeholder` | **Đúng về thực chất — đóng**, còn một hạt sạn tách ra thành **V1** | `grep data-placeholder` = **14** (Main 3, DiDong 1, Tour 9, TourDiDong 1). **Cả 4 con số giá bị vòng 1 nêu đều có cờ**: 540.000₫ (`Main:126,233`; `DiDong:89`), 650.000₫ (`Tour:106,196,205`; `TourDiDong:68`), 455.000₫ (`Tour:206`), 1.300.000₫ (`Tour:209,210`). Nội dung cờ ghi rõ *"prices.yaml rỗng — số mẫu, không phải giá thật"* — đối chiếu `data/prices.yaml` vẫn rỗng ✔ |

**Về cách gắn cờ.** `08` mục C2 viết là "gắn cờ ⚠ PLACEHOLDER và comment HTML". Design dùng thuộc tính `data-placeholder="…"` thay vì chuỗi ⚠ + comment. QA **chấp nhận** cách này: nó đạt đúng mục đích của C2 (Code không thể nhầm số mẫu là số thật), lại `grep` được và dính liền phần tử thay vì trôi ra ngoài comment. Đây là cải tiến, không phải lệch chuẩn.

**Về ba giá trị Design khai là dữ liệu thật** (`0258 6 250 250`, `08:00 – 16:30`, `56-245/2023/TCDL-GP-LHQT`): QA chấp nhận lập luận "không gắn cờ cho dữ liệu thật, vì cờ sai làm Code tưởng phải thay". Đúng nguyên tắc. Ba giá trị này không phải giá nên không đụng I1.

### 2.2 Lỗi Trung bình Design khai đã sửa (17 mục) — kiểm từng mục

| ID | Kết quả | Bằng chứng dòng |
|---|---|---|
| F4 | **Sửa một nửa** → còn dư, xuống **Thấp** (mục 6.3) | Câu ghi chú không còn đứng riêng, nhưng vẫn nằm **trong thân bài**, chỉ chuyển vào trong ngoặc vuông của chỗ giữ chỗ: `Tour:167` = "[Đoạn văn từ `body`. **Bài không mở lại mục "Lịch trình chi tiết" — từng điểm dừng đã nằm ở khối Lịch trình phía trên (luật 2).**]" |
| F5 | **Đúng** | `Main:246`, `DiaDanh:144`, `TraiNghiem:139` ghim bản đồ nay `fill="var(--c-primary)"`; `Tour:153` dấu "✗" nay `color:var(--c-text-muted)`. Quét cả 6 file: `--c-accent` chỉ còn ở `.btn` và nhãn giá `--c-accent-strong` ✔ đúng 07 §1 "vùng nội dung không dùng accent" |
| **F6 + F13** | **Đúng — và QA đo lại xác nhận đạt** | Xem mục 3 (đo tương phản) |
| F7 | **Đúng** | Tên token đổi đúng: `--sticky-bar-h:56px`, `--header-h:68px` khai ở 4 file desktop và **được dùng** (`Main:64,116,228`; `DiaDanh:60,86,137`; `TraiNghiem:60,86,128`; `Tour:76,102,192`), kể cả `top:calc(var(--header-h) + var(--sticky-bar-h) + var(--s4))`. `--container`/`--container-padding` thay hết `max-width:1200px;padding:0 24px`. Hai file di động không khai bốn token này — **đúng**, di động không có thanh dính dưới header |
| F8 | **Sửa phần lớn** → còn dư, xuống **Thấp** (mục 6.3) | Đã sửa: logo `--fs-card-title` (4 file desktop) / `--fs-h5` (2 file di động); h1 di động `--fs-h4` (`DiDong:68`) và `--fs-h5` (`TourDiDong:55`); huy hiệu dùng `--badge-py/px`; CTA thanh dính `var(--s2) var(--s5)`; `.toc a` `var(--s1) 0`. Còn cứng: `border-radius:2px` (6/6), `margin-top:10px` (`Main:42`, `DiaDanh:34`, `TraiNghiem:34`, `Tour:40`), `padding:12px 20px` (`DiDong:41`, `TourDiDong:33`), `padding:10px var(--s3)` (`Tour:201`), `gap:4px` (đáng lẽ `var(--s1)`) |
| F9 | **Đúng, 6/6** | `letter-spacing:-` = **0** trên cả 6 file; `.sec-title` (`Main:27`, `DiDong:27`, `DiaDanh:24`, `TraiNghiem:24`, `Tour:25`, `TourDiDong:24`) không còn tracking; khối `h1,h2,h3` mỗi file đặt `letter-spacing:0` khớp `tokens.css:239` |
| F10 | **Đúng, 6/6 — kiểm bằng máy** | Mọi chỗ dùng `var(--ls-eyebrow)` đều kèm `var(--lh-eyebrow)` trong cùng khai báo: `Main:176`, `DiDong:43`, `DiaDanh:139`, `TraiNghiem:135`, `Tour:58`, `TourDiDong:35`. Không còn `line-height:1.5` cứng đi kèm |
| F11 | **Chỉ sửa nửa desktop** → nửa di động còn mở, giữ **Trung bình** = **V3** (mục 6.1) | Desktop đạt: `<nav aria-label="Breadcrumb">` bọc `<ol class="crumb">`, đóng đúng chỗ ở `Main:85-90`, `DiaDanh:68`, `TraiNghiem:68`, `Tour:84` (kiểm bằng parser: 0 lỗi lồng thẻ, 0 thẻ chưa đóng). Di động: `DiDong:66` và `TourDiDong:53` vẫn là `<div>` chữ thường, vẫn thiếu "Trang chủ", vẫn nằm **dưới** ảnh hero. Parser đếm `<nav>` ở hai file di động = **0** |
| F12 | **Đúng** | `Tour:60` `.ctr button{width:44px;height:44px}`; `.btn{min-height:44px}` có ở cả 6 file (`Main:55`, `DiDong:41`, `DiaDanh` — file này không có `.btn`, đúng vì Địa danh không CTA —, `TraiNghiem:47`, `Tour:55`, `TourDiDong:33`); `min-height:0` = 0 lần |
| F14 | **Đúng** | `Main:126` và `Tour:106` nay "từ 540.000₫ **/ người**" và "từ 650.000₫ **/ người**", khớp I16 "render trọn nhãn kèm đơn vị" và khớp `TourDiDong:68` |
| F16 | **Sửa một phần** → phần L15 còn mở = **V2** (mục 6.1); phần L12/L16–L19 chuyển nợ, xem mục 4 | Đã sửa: đoạn mở `Main:104` rút còn câu định vị (hết trùng L2/L4/L5); `Tour:167,169` thay đoạn trùng đoạn mở bằng chỗ giữ chỗ (hết L20). **Chưa sửa: L15** — `Main:241` vẫn in "Xác nhận trong giờ làm việc · **giá trọn gói, không phụ thu**" |
| F17 | **Đúng** | `Main:185` không còn mệnh đề "cách trung tâm … 7 km"; khoảng cách chỉ còn một lần ở `Main:104` ("6 km") và `DiDong:69` ("6 km") — hết mâu thuẫn số liệu |
| F18 | **Đúng** | `DiDong:76` "Điện thoại **khu du lịch**" (khớp nguyên văn `06` §3 hàng Điện thoại), `DiDong:74` "Website **chính thức**" — khớp `Main:145,149` |
| F19 | **Đúng** | Entity có giá dùng đúng một nhãn "Đặt vé qua Zalo" (`Main:127,238`; `DiDong:91` và sơ đồ `DiDong:102,118`); entity chưa có giá dùng "Nhắn Zalo" (`TraiNghiem:89,131`). Không còn chỗ nào sơ đồ ghi lệch nhãn với nút thật |
| F20 | **Đúng** | `TraiNghiem:49` và `Tour:57`: `.btn.o{border:1px solid var(--c-primary)}`. Viền `--c-primary` #0C4A6E trên nền trắng = **9,46:1** (07 §1b), vượt xa ngưỡng 3:1 cho ranh giới thành phần |
| F22 | **Đúng phần neo**, nhưng đẻ ra câu hỏi ngưỡng mục lục = **V4** (mục 6.1) | `Tour:163-164` còn hai mục và cả hai có đích thật: `Tour:166` `<h3 id="tt-1">`, `Tour:168` `<h3 id="tt-2">`. Mục "Các trải nghiệm trong tour" đã bỏ ✔ |
| F24 | **Sửa một phần** → còn dư, giữ **Thấp** | `Tour:64` `.pax .p` và `DiDong:88`/`TourDiDong:68` nhãn giá thanh đáy nâng `--fs-xs`(12px) → `--fs-label`(14px). Nhưng 07 §2 `font.size.sm` ghi "15px … **không nhỏ hơn cỡ này trong UI chính**" — 14px vẫn dưới sàn. `--fs-xs` còn gánh `Tour:211` (câu "Giá tạm tính theo bảng giá công bố…") và `Tour:217` (giấy phép, Design chủ động giữ) |

### 2.3 Lỗi Thấp Design khai đã sửa (5 mục)

| ID | Kết quả | Bằng chứng |
|---|---|---|
| F23 (phần `#fff`) | **Đúng** | Quét hex cứng ngoài khối token trên 6 file: chỉ còn `#e8ecef` (nền **bàn vẽ** của artboard, ngoài trang) và bóng `.bar`. `stroke="#fff"`/`fill="#fff"` ở ghim bản đồ = 0; nay dùng `var(--c-card)` |
| F25 | **Đúng** | `TourDiDong:14` khai `--lh-heading:1.16`, dòng 20 dùng `var(--lh-heading)` thay 1.16 cứng |
| F26 | **Đúng phần đang dùng** | Token mới khai đủ và **khớp từng giá trị** `tokens.css` — xem mục 5.1 |
| F27 | **Đúng** | Comment `<!-- decor + config (build): dòng dịch vụ ở chân trang, không phải field Sanity -->` ở `Main:258`, `DiaDanh:163`, `TraiNghiem:156`, `Tour:234`; vòng tròn logo có `<!-- logo: siteSettings.branding.logo (06 §2); vòng tròn này là chỗ giữ chỗ trong mockup -->` ở `Main:67`, `DiaDanh:62`, `TraiNghiem:62`, `Tour:78`. Khớp `06` §1 quy ước `decor` / `config (build)` |
| F29 | **Đúng** | `.crumb li+li::before{color:var(--c-text-muted)}` ở 4 file desktop. #475569 trên trắng = **7,58:1** (07 §1b), thay cho #E2E8F0 ≈ 1,24:1 |

---

## 3. Đo lại tương phản hero sau khi đổi gradient (F6 + F13) — **đạt**

**Gradient mới** (giống hệt ở `Main:98`, `DiaDanh:75`, `TraiNghiem:75`, `Tour:91`):

```
linear-gradient(to top,
  var(--c-primary-strong) 0%,
  color-mix(in srgb, var(--c-primary-strong) 88%, transparent) 45%,
  color-mix(in srgb, var(--c-primary-strong) 70%, transparent) 62%,
  transparent 82%)
```

**F6 đóng.** Cả bốn chặng nay dựng từ **một** token `--c-primary-strong`. Đổi bộ giao diện thì cả dải trượt cùng nhau, không còn chặng nào neo vào `rgba(8,47,73,.55)` cứng. Huy hiệu hero cũng vậy: `background:color-mix(… var(--c-primary-strong) 58%, transparent)`, viền `color-mix(… var(--c-text-inverse) 30%, transparent)` (`Main:101`, `DiaDanh:77`, `TraiNghiem:77`, `Tour:93`).

**F13 đóng.** QA dựng lại vị trí từng khối chữ trong hộp hero 430px (đáy `padding:var(--s7) var(--s5) var(--s5)`), tra alpha của gradient tại đúng độ cao đó, trộn lên nền ảnh, rồi tính tỉ số tương phản WCAG. Đo ở **trường hợp xấu nhất**: mép trên của mỗi khối chữ (nơi màn phủ mỏng nhất), và với nền ảnh **trắng thuần** `#FFFFFF` — sáng hơn cả tông mẫu `#cfe3ee` mà mockup đang vẽ.

| Phần tử | Cỡ | Alpha màn phủ tại chỗ | `bien-sau` | `ngoc-lam` (bộ xấu nhất) | Ngưỡng |
|---|---|---|---|---|---|
| Đoạn mở (`opacity:.92`) | 17px | ≈ 0,95 | **11,3 : 1** | **6,6 : 1** | 4,5 |
| h1 | 46px / 40px | ≈ 0,88 | **9,6 : 1** | ~7 : 1 | 3,0 (chữ lớn) |
| **Chữ trong huy hiệu** | 14px | ≈ 0,78 + nền huy hiệu 0,58 | **10,2 : 1** | **6,1 : 1** | 4,5 |

Vòng 1 đo huy hiệu ở chỗ alpha chỉ ~0,18; nay tại cùng độ cao alpha là ~0,78, lại thêm nền huy hiệu đặc 58 % — đó là lý do con số nhảy vọt. **Cả ba bộ giao diện đều qua AA với biên rộng, kể cả khi ảnh nền trắng hoàn toàn.** Không cần chốt thêm luật scrim; F13 không còn là quyết định bề mặt đang treo.

*Ghi nhận nhỏ, không tính lỗi:* nền huy hiệu so với dải gradient quanh nó chỉ ≈ 1,4:1, và viền sáng 30 % so với nền huy hiệu ≈ 2,4:1 — tức hình dáng viên huy hiệu nhạt, dù **chữ bên trong thì rất rõ**. Là chọn lựa thẩm mỹ, thuộc quyền chủ dự án, không phải ngưỡng AA.

---

## 4. Xét hai chỗ Design từ chối sửa

### 4.1 F15 — ba tên dải cuối trang, và `Main` không có dải → **QA rút lỗi. Lập luận của Design đứng vững.**

Kiểm được từng vế:

- **Ba tên là đúng nguồn.** `src/lib/uiCopy.ts:27` `nearby: 'Gần đây'`; dòng `112` `similarTours: 'Tour tương tự'`; dòng `113` `similarExperiences: 'Trải nghiệm tương tự'`. Đúng ba chuỗi mockup đang in (`DiaDanh:153`, `Tour:224`, `TraiNghiem:146`). Ba tên khác nhau vì **`uiCopy` định nghĩa ba khoá khác nhau**, không phải vì mockup tuỳ hứng.
- **Kiểu tiêu đề là đang chép đúng component.** `src/components/NearbySection.astro`: `.nearby{background:var(--c-surface-alt);padding:var(--s7) 0}`, `.nearby-title{font-family:var(--font-display);font-size:var(--fs-h3);font-weight:var(--fw-700);color:var(--c-text)}`, `.nearby-head{margin-bottom:var(--s6)}` — trùng khít từng token với ba mockup. Không có `.underline`, không `--c-primary`, không fw 800: đó là **hiện trạng của component**, nên khác `.sec-title` là hệ quả, không phải lệch chuẩn của mockup. Muốn đổi thì đổi ở component, đúng như Design nói, và đó là việc của bước 8.
- **`Main` không có dải.** `Main:253` ghi chú tại chỗ, dẫn `06` §0 quyết định nền 2 ("field không bắt buộc mà rỗng thì vùng không render, không placeholder, không khung trống"). Ẩn hẳn khi rỗng là **đúng luật**, không phải thiếu vùng. Sơ đồ di động cũng nhất quán: `DiDong:116` "10 · Gần đây — **ẩn khi rỗng**".

**Kết luận F15: bác lỗi, đóng.** Khoảng trống thật nằm ở chỗ khác và đã có phiếu: `06` chưa có **hàng** cho dải cuối trang (chỉ có câu thứ tự khối ở §3.1 và prop `nearby` ở §7.1) → **N4 giữ nguyên**, thuộc Cowork.

### 4.2 F21 — khung giờ trong lịch trình → **không giữ như lỗi của Design, nhưng cũng không chấp nhận lập luận. Chuyển thành nợ N14.**

Tách làm hai vế, vì Design đúng một vế và trượt vế kia:

**Vế Design đúng:** I1 không cấm hiện thời lượng. `04-CONSTRAINTS:40` định nghĩa I1 là *"Sanity không lưu con số **giá** … cấm pattern **giá** trong field text của entity thương mại"*. Vòng 1 dẫn I1 để chặn khung giờ là **đọc rộng hơn nguyên văn**. QA vòng 2 nhận phần này về mình.

**Vế Design trượt — và đây là vế quyết định:** `01-CONTENT_MODEL:325` khai `itinerary` với *"`durationAtStop` tùy (**ISO 8601**)"*. ISO 8601 duration là `PT45M`, `PT1H30M` — **một khoảng dài**, không có điểm neo trong ngày. "8:00 – 8:45" là **một khung giờ trong ngày**, không phải giá trị hợp lệ của kiểu đó. Nên câu "đây là `durationAtStop` thật trên production" nếu đúng thì **chứng minh dữ liệu production đang lệch kiểu so với `01`**, chứ không hợp thức hoá việc mockup chốt khung giờ thành hợp đồng hiển thị. Và vì `06` §4.8 nói rõ tour "không phải lịch chỗ trống", in sáu khung giờ liên tiếp 8:00 → 15:30 đọc ra đúng một lịch chạy cố định hằng ngày.

Đây **không** phải lỗi Design bịa dữ liệu, nên không giữ là lỗi chặn. Nhưng cũng không thể để Code tự hoà giải: nó chạm cả `01`, cả dữ liệu, cả JSON-LD (`src/lib/serialize/tour.ts:61-63` nối thẳng `durationAtStop` vào ItemList, nên khung giờ sẽ chảy vào structured data). → **N14** (mục 5.3).

---

## 5. Quét lỗi mới do chính đợt sửa đẻ ra

### 5.1 Token vừa thêm có khớp `tokens.css` không — **khớp 100 %**

| Token | Mockup | `tokens.css` | Khớp |
|---|---|---|---|
| `--container` | 1200px (4 file desktop) | 1200px | ✔ |
| `--container-padding` | 24px (4 file desktop) | 24px | ✔ |
| `--lh-eyebrow` | 1.5 (6/6) | 1.5 | ✔ |
| `--badge-py` / `--badge-px` | 2px / 10px (6/6) | 2px / 10px | ✔ |
| `--sticky-bar-h` | 56px (4 file desktop) | 56px | ✔ |
| `--header-h` | 68px (4 file desktop) | 68px | ✔ |
| `--underline-width/height`, `--ls-eyebrow` | 28px / 3px / 0.08em (6/6) | như vậy | ✔ |

Hai file di động không khai `--container*`, `--header-h`, `--sticky-bar-h`: **đúng chủ ý**, di động không dùng bốn thứ đó (`06` §3: di động "không còn thanh nào dưới header"). Kiểm thêm bằng máy: **mọi `--fs-*` viết px vẫn khớp rem×16 của `tokens.css` ở cả 6 file** — đợt sửa không làm lệch thang chữ.

### 5.2 Bốn phép kiểm còn lại theo yêu cầu

| Phép kiểm | Kết quả |
|---|---|
| `<nav>` breadcrumb đóng đúng chỗ? | **Đúng.** Parser HTML chạy 6/6 file: 0 lỗi lồng thẻ, 0 thẻ chưa đóng. `<nav aria-label="Breadcrumb">` ôm trọn `<ol class="crumb">` rồi đóng ngay sau `</ol>` ở cả 4 file desktop |
| Sơ đồ khối di động `DiDong` đánh số liên tục và khớp `06` §3? | **Đúng.** `DiDong:100-117` = 1…11, không nhảy số, không trùng số. Thứ tự: hero → Thông tin nhanh → **Khối hành động** → Điểm nổi bật → Tổng quan → Cách tới nơi → **Bản đồ** → Trải nghiệm tại đây → FAQ → Gần đây → Cập nhật·Footer. Khớp `06` §3 (khối hành động sau Thông tin nhanh) **và** §3.1 (thứ tự mục; "bản đồ ngay sau Cách tới nơi"). `TourDiDong:77-87` = 1…10, cũng khớp (form đứng thứ 3) |
| Chỗ giữ chỗ mới trong thân bài Tour có phá luật "không nội dung độn"? | **Không phá.** `Tour:167,169` là **lỗ hổng khai báo rõ**, không phải chữ độn giả làm nội dung: có `data-placeholder="đoạn văn thật nằm ở \`body\` trong Sanity"`, có ngoặc vuông, có `<code>body</code>` chỉ đúng field nguồn. Đây đúng tinh thần `06` §0 quyết định nền 2 (không dựng khung trống giả) và C2 (không để số/chữ bịa trôi qua như thật). **Nhưng** chỗ giữ chỗ thứ nhất còn cõng theo câu ghi chú biên tập của F4 — xem mục 6.3 |
| `data-placeholder` có gắn nhầm vào dữ liệu thật? | **Không nhầm chỗ nào.** 14 cờ đều rơi vào số mẫu (4 mức giá + ngày mẫu). Đối chiếu ngược: "Cập nhật 21/08/2026" (`Main:222`, `Tour:188`), "20/08/2026" (`DiaDanh:131`), "19/08/2026" (`TraiNghiem:124`) — đều **không** gắn cờ, đúng, vì đó là `_updatedAt` thật; chỉ "Cập nhật 08/2026" ở `Main:236` (ngày cập nhật **giá**) mới mang cờ. Phân biệt này chính xác. **Nhưng** một cờ bị đặt sai vị trí cú pháp — **V1** |

### 5.3 Xét hai nợ mới N11, N12 — **cả hai đúng là việc của tầng trên**

- **N11 (luật 1 của `06` §6) — chấp nhận, nhưng thu hẹp phạm vi.** Nguyên văn luật 1: *"Mỗi **field** hiển thị của trang chi tiết được khai đúng một vùng"*. Luật nói về **field**, không nói về chuỗi ký tự — Design đọc đúng chữ. Siết thành "một chuỗi chỉ được xuất hiện một lần" đúng là **sửa luật**, thuộc Cowork, không phải việc Design tự làm trên mockup. Ba mục thực sự thuộc N11: **L16** (`tripOrigin` ở Thông tin nhanh `Tour:116` vs tên stop 2 `Tour:136` — hai field khác nhau tình cờ cùng tên bến), **L17** (`duration` `Tour:115` vs `durationAtStop` các stop vs FAQ `Tour:181`), **L18** (`touristType` `Tour:117` vs hạng khách của form `Tour:205-206`, vốn ăn từ `paxRates` của `prices.yaml` chứ không từ `touristType`).
- **Hai mục Design xếp nhầm vào N11 → QA tách ra thành N13.** **L12** (`DiaDanh:125` "22.000 đồng") và **L19** (`Tour:184` "70 % giá vé") **không** phải chuyện "hai field trùng giá trị" — chúng là **con số giá nằm trong chữ của `faq`**. Câu hỏi đúng phải hỏi là câu khác: `06` §1 ghi *"Giá không bao giờ là field Sanity"* và I1 cấm *"pattern giá trong field text của entity thương mại"*. Địa danh không phải entity thương mại nên I1 không với tới `DiaDanh:125`, nhưng hệ quả vận hành thì vẫn còn: một mức giá sống ngoài `prices.yaml`, không ai cập nhật, in trên trang **không có vùng giá** (`06` §4.2 "Place không có vùng giá"). Nếu gộp vào N11, Cowork sẽ chỉ trả lời câu hỏi về field và bỏ sót câu hỏi về giá. → **N13**.
- **N12 (token bóng hướng lên) — chấp nhận.** `DiDong:42` và `TourDiDong:34` dùng `box-shadow:0 -4px 16px rgba(15,23,42,.08)`; `tokens.css:133-136` có 4 token bóng và **không token nào đổ lên trên**. Mockup không thể tự đẻ token thứ năm — đó là sửa `07` + `tokens.css`, đúng là việc tầng trên.
- **QA thêm N14** (`durationAtStop` ISO 8601 ↔ khung giờ, mục 4.2) **và N15** (ngưỡng mục lục, mục 6.1 V4).

---

## 6. Bảng lỗi vòng 2 theo khuôn mục G

### Mức **Cao** — không còn

| ID vòng 1 | Trạng thái |
|---|---|
| F1, F2, F3 | **Đã sửa** — bằng chứng ở mục 2.1 |

### 6.1 Mức **Trung bình** — còn mở

| ID | Mục audit | Mô tả | Mức | File | Trạng thái |
|---|---|---|---|---|---|
| **V1** | C2 | **Một cờ placeholder đặt trên thẻ đóng nên bị trình duyệt vứt.** `Tour:201` viết `…</svg data-placeholder="ngày mẫu">31/08/2026`. HTML không cho thuộc tính trên thẻ đóng: parser bỏ nguyên cụm. QA đếm bằng parser: `Tour.dc.html` có **9** lần chuỗi `data-placeholder` nhưng chỉ **8** cờ tồn tại thật trong DOM. Hệ quả: tổng cờ thật là **13/14**, và "31/08/2026" là con số mẫu **duy nhất không được đánh dấu**. Kèm theo là một đoạn markup sai mà Code có thể chép lại | tb | `Tour` | **Chưa sửa** — sửa 1 dòng: đóng `</svg>` rồi đặt cờ lên thẻ bọc ngày |
| **V2** | A2 | **Khẳng định thương mại không có field nguồn, còn sót ở Main.** `Main:241`: "Xác nhận trong giờ làm việc · **giá trọn gói, không phụ thu**". Vòng 1 ghi là L15 ở **hai** entity; Design gỡ ở `TraiNghiem` (kèm F1) nhưng **để nguyên ở `Main`**, và bản phản hồi không nhắc mục này ở cả phần "đã sửa" lẫn phần "ghi nợ". Tra `01-CONTENT_MODEL` không có field nào nuôi câu này; `06` §6 mở đầu bằng *"Mọi field xuất hiện ở đây phải tồn tại trong `01`… không bịa tại đây"*, `08` A2 buộc "không có vùng nào dùng dữ liệu không tồn tại trong 01". Đây lại là **điều khoản giá** — nếu có thật thì chỗ của nó là nhãn đơn vị bên `prices.yaml`, không phải chữ cứng trong template | tb | `Main` | **Chưa sửa** — chưa sửa và cũng chưa ghi nợ |
| **V3** | E, D | **Nửa di động của F11 chưa làm và chưa ghi nợ.** `DiDong:66` và `TourDiDong:53` breadcrumb vẫn là `<div>` chữ thường: không `<nav>`, không `<ol>`, mất mắt "Trang chủ", và nằm **dưới** ảnh hero. Trái `08` mục E ("breadcrumb trong `<nav>`") và `06` §3 v2.1 ("nằm trên dải sáng **phía trên** hero, không đè lên ảnh"). Bản phản hồi ghi phạm vi là "(4 file)" nhưng không nói vì sao hai file kia đứng ngoài — nên mục này rơi khỏi cả hai cửa ra của `GOVERNANCE` 4.3 | tb | `DiDong`, `TourDiDong` | **Chưa sửa** |
| **V4** | A1, A2 | **Mục lục Tour không thoả ngưỡng duy nhất đang có trong `06`.** `06` §3 hàng "Thân bài" v2.1: mục lục "sinh ở build từ **h2** của `body` khi bài có **≥ 3 h2**". `Tour:161-164` chỉ có **2** mục; và ở cả `Main` lẫn `Tour`, tiêu đề trong thân bài được vẽ thành **h3** (`Main:184`, `Tour:166,168`) chứ không phải h2 — nên ngưỡng "≥ 3 h2" không có gì để đếm. Thứ bậc của mockup (h1 → h2 mục → h3 trong bài) là **hợp lý** và đúng `08` mục E; thứ cần sửa nhiều khả năng là chữ trong `06`. Đây là lỗi lộ ra **do chính bản sửa F22**: vòng 1 mục lục trỏ hụt nên chưa ai đếm được, nay neo đã thật thì đếm được và thấy thiếu | tb | `Tour`, `Main` | **Ghi nợ N15** — Code không được tự hoà giải h2/h3 và ngưỡng |

### 6.2 Trung bình đã đóng ở vòng 2

F4 (một phần, phần dư xuống Thấp) · F5 · F6 · F7 · F8 (một phần, phần dư xuống Thấp) · F9 · F10 · F11 (nửa desktop) · F12 · F13 · F14 · F16 (phần L2/L4/L5/L20) · F17 · F18 · F19 · F20 · F22 (phần neo) · F24 (một phần) · **F15 (QA rút lỗi)** · **F21 (chuyển N14)**.

### 6.3 Mức **Thấp** — còn mở (không chặn cổng)

| ID | Mô tả | File |
|---|---|---|
| F4-dư | Câu ghi chú biên tập vẫn nằm trong thân bài, nay gói trong chỗ giữ chỗ: `Tour:167` "…**Bài không mở lại mục "Lịch trình chi tiết" — từng điểm dừng đã nằm ở khối Lịch trình phía trên (luật 2).**" Đề nghị cắt câu thứ hai, để chỗ giữ chỗ chỉ còn "[Đoạn văn từ `body`.]" | `Tour` |
| F8-dư | Còn px cứng đáng lẽ đọc token: `border-radius:2px` (6/6), `margin-top:10px` (4 file), `padding:12px 20px` (2 file di động), `padding:10px var(--s3)` (`Tour:201`), `gap:4px` (đáng lẽ `var(--s1)`) | cả 6 |
| F24-dư | `--fs-label` 14px vẫn dưới sàn 15px của 07 §2 cho giá theo hạng khách và nhãn giá thanh đáy; `Tour:211` vẫn `--fs-xs` cho câu về giá tạm tính | `Tour`, `DiDong`, `TourDiDong` |
| V5 (mới) | `Tour:215` "Hotline: **[hotline Tour Đảo]**" là chỗ giữ chỗ dạng ngoặc vuông nhưng **không** mang `data-placeholder`, lệch quy ước vừa dựng ở F3 | `Tour` |
| V6 (mới) | `DiDong:117` khối 11 ghi "Cập nhật · Footer" nhưng bỏ "Nguồn tham khảo" — `06` §3.1 cho Điểm tham quan có `sameAs` ở "dòng Nguồn tham khảo cạnh Cập nhật", và `Main:223` desktop có in | `DiDong` |
| V7 (mới) | Mỗi trang desktop có 3 `<nav>` (`.nav` header, breadcrumb, `.jump` thanh dính) nhưng chỉ breadcrumb có `aria-label`; hai cái kia không phân biệt được khi duyệt bằng danh sách vùng | 4 desktop |
| F28 | Bậc chữ `.sec-title` theo khổ máy chưa thành luật → Design gộp vào N6, chấp nhận | 2 di động |
| F23-dư | Bóng hướng lên của thanh đáy → N12, chấp nhận | 2 di động |

---

## 7. Chấm lại A → F (tóm tắt; chỉ ghi chỗ đổi so với vòng 1)

| Mục | Vòng 1 | Vòng 2 | Ghi chú |
|---|---|---|---|
| **A1** phủ vùng bắt buộc | Fail | **Pass** | F2 đóng: `DiDong:102` có khối hành động. 4/4 entity desktop và 2/2 di động phủ đủ vùng bắt buộc của `06` §3 + §3.1 |
| **A2** vùng mồ côi | Fail | **Fail (2 chỗ)** | Đóng: F4 (phần chính), F22 (neo), F15 (bác lỗi), F27 (`decor`/`config`). Còn: **V2** (`Main:241` không có field nguồn) và **V4** (mục lục Tour dưới ngưỡng). F21 rời khỏi mục này sang N14 |
| **A3** vùng giá | Fail | **Pass** | F1 đóng (Trải nghiệm hết nhãn chờ), F14 đóng (đủ đơn vị). Địa danh vẫn đúng luật "không giá thì không vùng giá, không nút thay thế". `DiaDanh:125` (giá trong FAQ) chuyển sang **N13**, là câu hỏi vận hành nội dung, không phải vùng giá |
| **A4** loại trang thiếu | Nợ | **Nợ (N2)** | Vẫn 2/4 entity có bản di động. Không đổi |
| **§3.1** một field một vùng | Fail | **Nợ (N11 + N13)** | Luật nói về *field*; ba cặp còn lại là hai field khác nhau trùng giá trị → N11. Hai cặp về giá trong `faq` → N13 |
| **B** màu / chữ / khoảng cách / bo góc | Fail | **Pass** (dư ở mức Thấp) | F7, F8 (phần chính), F9, F10, F25, F26 đóng. Token mới khớp `tokens.css` 100 %; `--fs-*` px vẫn khớp rem×16 6/6. Còn px cứng lặt vặt ở mức Thấp |
| **B** accent | Fail | **Pass** | F5 đóng. Accent chỉ còn ở `.btn` và nhãn giá — đúng 07 §1 |
| **B** sand | Pass | **Pass** | Không đổi |
| **B** ba bộ giao diện | Pass, trừ F6 | **Pass** | F6 đóng: gradient hero dựng hoàn toàn bằng `color-mix` trên một token |
| **C** dữ liệu giả định | Fail | **Pass** (một hạt sạn = V1) | 4/4 mức giá có cờ và nội dung cờ dẫn đúng `prices.yaml` rỗng; cờ không gắn nhầm vào dữ liệu thật. Trừ `Tour:201` |
| **D** nhất quán khung | Pass một phần | **Pass** | F18, F19 đóng; F15 bác lỗi (kiểu dải cuối là chép đúng `NearbySection.astro`); F20 đóng. Còn F28 → N6 |
| **D** di động | Fail | **Pass phần khối, Fail phần breadcrumb** | Thứ tự khối hai file di động khớp `06` §3 + §3.1, đánh số liên tục. Breadcrumb di động vẫn hỏng → **V3** |
| **E** mục tiêu chạm | Fail | **Pass** | F12 đóng: nút đếm 44 × 44, `.btn` khai `min-height:44px`, hết `min-height:0` |
| **E** cỡ chữ tối thiểu | Pass / Nợ | **Pass / Nợ** | Sàn 11px của `08` vẫn đạt; sàn 15px của `07` vẫn chưa (F24-dư), giữ mức Thấp |
| **E** `aria-label` bộ đếm | Pass | **Pass** | `Tour:205-206` giữ nguyên bốn nhãn nút + hai nhãn ô số. Phần `<form>`, `inputmode`, `name` vẫn ở **N1** |
| **E** tương phản | Fail (hero) | **Pass** | Đo lại: đoạn mở 11,3:1 · h1 9,6:1 · huy hiệu 10,2:1 ở `bien-sau`; bộ xấu nhất `ngoc-lam` vẫn 6,1–6,6:1. Xem mục 3 |
| **E** ngữ nghĩa | Fail | **Fail (di động)** | Desktop đóng (4/4 `<nav aria-label="Breadcrumb">`, parser sạch). Di động chưa → **V3**. Thứ bậc h1→h2→h3 đúng 6/6. `prefers-reduced-motion` vẫn vắng nhưng vẫn 0 `transition`/`animation` → **N8** |
| **F** phiếu nợ | Đã lập | **Đã lập** | N1–N10 giữ; thêm N11, N12 (Design), N13, N14, N15 (QA) |

---

## 8. Phiếu nợ sau vòng 2

**Giữ nguyên:** N1 (BookingForm bước 2 + `<form>`), N2 (thiếu artboard di động Địa danh/Trải nghiệm), **N3** (`06` §3 tự mâu thuẫn về breadcrumb của Tour — *vẫn là nợ chặn Code*), N4 (`06` chưa có hàng cho dải cuối trang), N5, N6 (nay gộp cả F28), N7 (drift `tokens.css` ↔ `07`), N8, N9, N10.

**Nhận từ Design:** **N11** (luật 1 nói về field hay về chuỗi — thu hẹp còn L16/L17/L18), **N12** (token bóng hướng lên cho thanh đáy di động).

**QA thêm ở vòng 2:**

| # | Mô tả | Mức | Trang | Xử ở tầng nào |
|---|---|---|---|---|
| **N13** | Con số giá nằm trong chữ của `faq`: `DiaDanh:125` "22.000 đồng" trên entity **không có vùng giá** (`06` §4.2), `Tour:184` "70 % giá vé". `06` §1 ghi "Giá không bao giờ là field Sanity"; I1 chỉ với tới entity thương mại nên Địa danh lọt lưới validator. Cần chốt: biên tập có được viết giá trong `faq` không, và nếu có thì ai chịu trách nhiệm cập nhật khi `prices.yaml` đổi | tb | `DiaDanh`, `Tour` | Cowork + vận hành nội dung |
| **N14** | `01:325` khai `durationAtStop` kiểu **ISO 8601**, nhưng dữ liệu production và mockup (`Tour:135-140`) dùng **khung giờ trong ngày** "8:00 – 8:45". Hai thứ khác kiểu. Ảnh hưởng cả JSON-LD: `src/lib/serialize/tour.ts:61-63` nối thẳng giá trị này vào ItemList. Chốt một trong hai: sửa dữ liệu về đúng ISO 8601 và render thời lượng, **hoặc** sửa `01`/`06` để cho phép khung giờ và nói rõ nó đứng thế nào với "không phải lịch chỗ trống" của §4.8 | tb | `Tour`, `TourDiDong` | Cowork (sửa `01`/`06`) |
| **N15** | `06` §3 v2.1 nói mục lục sinh "từ **h2** của `body`" khi có "**≥ 3 h2**", nhưng mockup vẽ tiêu đề trong bài thành **h3** (h2 đã dành cho tiêu đề mục) và `Tour` chỉ có 2 mục. Cần chốt lại luật theo đúng bậc heading thật bên trong `body`, và xác nhận ngưỡng ≥ 3 | tb | `Tour`, `Main` | Cowork (sửa chữ ở `06` §3) |

---

## 9. Kết luận

**CHƯA ĐẠT QA1** — nhưng cách một bước ngắn, không phải một vòng nữa.

Đối chiếu tiêu chí đậu của `08` mục G:

- [x] **0 lỗi mức Cao** — cả F1, F2, F3 đã đóng, có bằng chứng dòng.
- [ ] **Mọi lỗi Trung bình đã sửa hoặc ghi phiếu nợ có ID** — còn **4 lỗi Trung bình mở**: **V1, V2, V3** chưa sửa và **chưa có phiếu nợ**; **V4** đã có phiếu (**N15**).
- [x] Đủ mockup trong phạm vi đợt 4B (6/6) có mặt trong báo cáo.
- [x] Có chữ ký QA agent và timestamp.

**Vì sao QA không cấp phiếu nợ cho V1, V2, V3 để mở cổng.** Phiếu nợ dành cho thứ **không giải được ở tầng này**. Cả ba mục đều giải được ngay trong file, không cần ai quyết gì thêm, và mỗi mục đều có lời sửa cụ thể ở dưới. Cấp nợ cho chúng là mở cổng bằng thủ tục chứ không phải bằng chất lượng — đúng thứ `08` mục G viết "mặc định của cổng là không đạt nếu không có bằng chứng".

### Phải sửa trước khi Code chạy (3 mục, đều gọn)

1. **V1** — `Tour:201`: đóng `</svg>` cho đúng, rồi đưa `data-placeholder="ngày mẫu"` lên thẻ bọc "31/08/2026". Sau đó `grep` lại phải ra **14 cờ thật trong DOM**, không phải 14 chuỗi.
2. **V2** — `Main:241`: bỏ mệnh đề "giá trọn gói, không phụ thu" (và cân nhắc cả "Xác nhận trong giờ làm việc" — cũng không có field). Nếu chủ dự án muốn giữ, phải là **override có ghi** kèm chỉ rõ nguồn, không phải mặc định của mockup.
3. **V3** — `DiDong:66`, `TourDiDong:53`: dựng breadcrumb di động thành `<nav aria-label="Breadcrumb"><ol class="crumb">…`, thêm lại mắt "Trang chủ", và **đưa lên trên ảnh hero** đúng `06` §3 v2.1. Nếu Design cho rằng di động phải khác desktop thì đó là một quyết định bề mặt cần ghi, không phải im lặng bỏ qua.

### Sau khi ba mục trên xong

Cổng QA1 **mở**: 0 lỗi Cao, lỗi Trung bình còn lại duy nhất là V4 và đã có phiếu **N15**.

### Vẫn chặn Code ở tầng trên, không thuộc Design

**N3** (`06` §3 tự mâu thuẫn về breadcrumb của Tour: cột "Khi rỗng" nói dùng nhánh URL, cột Ghi chú nói "không áp dụng: … tour", §3.1 ghi "—" — mà cả `Tour` lẫn `TourDiDong` đều đang vẽ breadcrumb) và **N15** phải được Cowork chốt trước khi Code dựng `DetailLayout` và mục lục. **N14** nên chốt trước khi Code dựng khối Lịch trình, vì nó kéo theo cả JSON-LD.

### Điểm nên ghi nhận

Đợt sửa này làm thật và làm đúng chỗ khó: gradient hero được dựng lại bằng một token duy nhất nên vừa đóng F6 vừa đóng F13 mà không cần thêm luật scrim — đo ở nền ảnh trắng thuần, bộ giao diện xấu nhất, chữ nhỏ nhất vẫn còn **6,1:1**. Sáu mẫu `grep` sạch tuyệt đối. Token mới khớp `tokens.css` từng giá trị, không đẻ nguồn thứ hai. Hai chỗ Design từ chối sửa thì một chỗ (**F15**) tra ra là Design đúng còn QA vòng 1 sai — `uiCopy.ts:27,112,113` và `NearbySection.astro` chứng minh ba cái tên và kiểu tiêu đề là chép đúng nguồn; chỗ còn lại (**F21**) Design đúng về I1 nhưng trượt ở `01:325`, và đó là loại xung đột phải đưa lên Cowork chứ không phải bắt Design nuốt.

---

*QA agent: Claude (vai QA độc lập, phiên 2026-08-22, vòng 2). Timestamp báo cáo: 2026-08-22. Artifact kiểm ở commit `95560fd`. Báo cáo này không sửa bất kỳ file nào ngoài chính nó.*
