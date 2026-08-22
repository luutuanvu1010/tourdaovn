# QA1 — Mockup bước 7, đợt 4B (vòng 4 giao diện tourdao.vn)

- **Ngày:** 2026-08-22
- **Vai:** QA độc lập (GOVERNANCE §2.1). Tác nhân này **không** soạn mockup đang kiểm.
- **Commit HEAD:** `dc0ac4c`
- **Cổng:** QA1 (Design → Code), spec `docs/core-specs/08-QA_CHECKLIST.md` mục A→F, báo cáo theo mục G.
- **Kết luận nhanh:** **CHƯA ĐẠT QA1** — 3 lỗi mức Cao. Chi tiết ở mục 6.

---

## 1. Phạm vi

**Artifact kiểm** (Design Component `.dc.html`, markup trong `<x-dc>`, token khai ở `<helmet><style>`), thư mục `docs/design/vong4/`:

| File | Entity | Khổ |
|---|---|---|
| `Main.dc.html` | Điểm tham quan (Attraction) | desktop 1280 |
| `DiDong.dc.html` | Điểm tham quan | di động 390 |
| `DiaDanh.dc.html` | Địa danh (Place) | desktop 1280 |
| `TraiNghiem.dc.html` | Trải nghiệm (Experience) | desktop 1280 |
| `Tour.dc.html` | Tour | desktop 1280 |
| `TourDiDong.dc.html` | Tour | di động 390 |

**Tài liệu chi phối đã đọc:** `08-QA_CHECKLIST` A→G · `06-BINDING_MAP` §3 (các hàng v2.1), **§3.1 ma trận vùng theo entity**, §4.2/4.3/4.4/4.8, §6 luật 1–3 · `src/styles/tokens.css` (nguồn token thật) · `07-DESIGN_TOKENS` §1, §1b, §2, §3 · `SPEC-2026-08-21-dat-tour` §4.3 · `data/prices.yaml` · `docs/plans/2026-08-21-audit-va-ke-hoach-giao-dien-vong-4.md` §8 (bối cảnh đợt 4B).

**Ngoài phạm vi:** `BanDoThongTin`, `HienTrang`, `HuongB`, `HuongC` (artboard khảo sát của bước trước); mục G2 (code artifact) và G3 (interactive/OG) — chưa áp vì artifact là mockup.

---

## 2. Bảng kết quả A → F

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| **A1 — phủ vùng bắt buộc** | **Fail** (1 chỗ) | Desktop: 4/4 entity phủ đủ vùng bắt buộc của `06` §3 + §3.1. Di động Tour phủ đủ (`TourDiDong:78-79` có "Thông tin nhanh" rồi "Form đặt tour"). **Di động Điểm tham quan thiếu "Khối hành động"**: `DiDong:100-117` liệt kê 10 khối, không có khối nào sau Thông tin nhanh mang giá + Zalo + hotline; `DiDong:101` còn ghi thẳng "giá chỉ ở thanh đáy", trái `06` §3 hàng "Khối hành động" ("Di động: nằm sau Thông tin nhanh; CTA còn lặp ở thanh đáy") → **F2**. |
| **A2 — vùng mồ côi** | **Fail** | (a) `Tour:169` in một câu ghi chú biên tập ra thân bài → **F4**; (b) `Tour:135-140` hiện khung giờ đồng hồ ("8:00 – 8:45"…) mà `01/06` chỉ có `durationAtStop`, và `departureNote` được `06` §4.8 ghi rõ "không phải lịch chỗ trống (I1)" → **F21**; (c) `Tour:164-165` mục lục trỏ "Các trải nghiệm trong tour", "Chính sách hủy đặt chỗ" — không có mục tương ứng trong bài, cũng không có field nguồn → **F22**; (d) dải cuối trang ("Gần đây"/"tương tự") không có hàng trong `06` §3–§3.1, chỉ có câu thứ tự khối di động ở §3.1 và prop `nearby` ở §7.1 → **F15 + N4**; (e) `Main:241`, `TraiNghiem:131` "giá trọn gói, không phụ thu" — khẳng định thương mại không có field → **F16d**; (f) dải chân trang "Tour · Vé · Phòng · Xe đưa đón" và vòng tròn logo chưa đánh dấu `decor`/`config` → **F27**. |
| **A3 — vùng giá** | **Fail** | Đúng: Địa danh không vùng giá, thanh dính chỉ có neo, không nút thay thế (`DiaDanh:86-90`, `DiaDanh:137-147`) ✔. Sai: **Trải nghiệm chưa có giá nhưng vẫn hiện nhãn chờ giá** (`TraiNghiem:130-131` "Hỏi giá và giữ chỗ" + "Giá theo gói lặn và số người — nhắn Zalo để được báo giá…") trái `06` §0 quyết định nền 3 ("không CTA giả, **không nhãn chờ**") và §6 luật 3 → **F1**. Thêm: `DiaDanh:125` in giá "22.000 đồng" trong FAQ của entity **không có vùng giá** (`06` §4.2) → **F16f**. Thiếu đơn vị ở thanh dính: `Main:126` "từ 540.000₫", `Tour:106` "từ 650.000₫" trong khi I16 buộc "trọn nhãn kèm đơn vị", và `TourDiDong:68` lại có "/ người" → **F14**. |
| **A4 — loại trang còn thiếu** | **Nợ** | Đủ 4 entity của §3.1 ở desktop. Chỉ 2/4 có bản di động (Điểm tham quan, Tour); **Địa danh và Trải nghiệm chưa có artboard di động** → **N2**. |
| **§3.1 — mỗi field đúng một vùng** | **Fail** | Xem bảng lặp ở mục 3. Vi phạm rõ nhất: Tour lặp `tripOrigin` (Thông tin nhanh + lịch trình), `duration` (Thông tin nhanh + lịch trình + FAQ), `touristType` (Thông tin nhanh + hàng số người của form), chính sách giá trẻ em (form + FAQ). |
| **B — token màu/cỡ chữ/khoảng cách/bo góc** | **Fail** | Khối `:root` của 6 file khớp giá trị `tokens.css` ở mọi token có khai; **mọi `--fs-*` viết px đều bằng rem×16** (11/12/14/15/17/21/18/20/26/32/32/40/42/46 — đúng 100%). Sai ở: tên token `--sticky-h` ≠ `--sticky-bar-h` của `tokens.css` và của đợt 4A (**F7**); token khai xong không dùng, viết px cứng thay (`Main:64,116,228`); hex/rgba cứng ngoài token (**F6**, **F23**); cỡ chữ ngoài thang (**F8**); tracking âm bị 07 §2 cấm (**F9**); `--ls-eyebrow` tách khỏi `--lh-eyebrow` (**F10**). |
| **B — accent** | **Fail** | Accent ngoài vùng hành động/giá: ghim bản đồ `fill="var(--c-accent)"` (`Main:246`, `DiaDanh:144`, `TraiNghiem:140`) và dấu "✗" của "Không bao gồm" (`Tour:153`) → **F5**. Các chỗ còn lại đúng: `.btn` nền accent, nhãn giá `--c-accent-strong` (`Main:233`, `Tour:210`). |
| **B — sand** | **Pass** | `--c-sand` chỉ ở gạch chân mục (`.underline`) và chấm điểm nổi bật (`.hl i`); `--c-sand-soft` làm nền callout với chữ `--c-sand-text` (#5a4109 trên #FBE3B3 = **7.62:1**, đạt AA). Không chỗ nào sand làm nền CTA. |
| **B — ba bộ giao diện** | **Pass, trừ F6** | 6/6 file khai đủ `bien-sau` (`:root`) + `[data-theme='cat-bien']` + `[data-theme='ngoc-lam']` đúng giá trị `tokens.css`. `.btn` chỉ ăn `var(--c-accent)` + `var(--c-text-inverse)` → **không phụ thuộc bộ** ✔ (trắng/accent: 5.44 / 5.02 / 6.29 theo 07 §1b; dùng `--c-text-inverse` #F8FAFC nên thực đo thấp hơn ~0,1 nhưng vẫn ≥ 4,5). Ngoại lệ duy nhất là gradient hero trộn `var(--c-primary-strong)` với `rgba(8,47,73,.55)` cứng → đổi bộ thì hai chặng lệch màu (**F6**). |
| **C — dữ liệu giả định** | **Fail** | `grep` "PLACEHOLDER \| ⚠ \| prices.yaml \| placeholder" trên 6 file = **0 lần**. `data/prices.yaml` hiện **rỗng** (chỉ còn dòng chú thích mẫu), trong khi mockup in 540.000₫ (`Main:126,233`; `DiDong:89`), 650.000₫ (`Tour:106,196,205`; `TourDiDong:68`), 455.000₫ (`Tour:206`), 70 % (`Tour:184`) như số thật. Chưa đánh dấu còn có: hotline (`Tour:215` "[hotline Tour Đảo]" — dạng ngoặc vuông, chưa phải cờ), điện thoại `0258 6 250 250`, giấy phép `56-245/2023/TCDL-GP-LHQT`, ngày `31/08/2026`, "Cập nhật 08/2026", giờ mở cửa. Kế hoạch §8 có ghi "giá … là **mẫu**; hotline là placeholder" nhưng ghi ở **plan**, không ở artifact mà Code đọc → **F3**. Ảnh: 0 thẻ `<img>`, mọi ảnh là `div.ph` kẻ chéo → chưa kiểm được `alt` (**N9**), nền ô kẻ chéo ghi nhận riêng ở mục 4. |
| **D — nhất quán khung** | **Pass một phần** | 4/4 desktop đúng khung header → breadcrumb (dải sáng trên hero) → hero mosaic → thanh dính → Thông tin nhanh (≤ 2 ô thì gộp sidebar: `DiaDanh` 2 ô, `TraiNghiem` 1 ô ✔) → hai cột → dải cuối → footer. **Thứ tự mục đúng §3.1** ở cả 4: `Main` Điểm nổi bật→Tổng quan→Cách tới nơi→Trải nghiệm tại đây→FAQ→Cập nhật·Nguồn; `Tour` Điểm nổi bật→Lịch trình→Bao gồm→Chi tiết→Mùa nào nên đi→FAQ ✔. Lệch: tên và kiểu dải cuối (**F15**), nhãn CTA (**F19**), nhãn ô Thông tin nhanh trên di động (**F18**), biến thể `.btn.o` chưa có hồ sơ (**F20**), `.sec-title` di động đổi bậc chữ không ghi luật (**F28**), vị trí mục "Bao gồm" của Trải nghiệm chưa được §3.1 định (**N5**). |
| **D — di động** | **Fail** (Điểm tham quan) | `TourDiDong:77-87` đúng `06` §3.1: hero → Thông tin nhanh → **form đặt tour** → nội dung → dải cuối, thanh đáy giá + CTA `#dat-tour` ✔. `DiDong:100-117` đúng thứ tự nội dung và có bản đồ ngay sau "Cách tới nơi" ✔ nhưng thiếu khối hành động (**F2**); breadcrumb di động rơi xuống **dưới** ảnh và mất "Trang chủ" (`DiDong:66`, `TourDiDong:53`) (**F11**). |
| **E — mục tiêu chạm** | **Fail** (1 chỗ) | `.btn` di động khai `min-height:44px` ✔ (`DiDong:41`, `TourDiDong:33`); `.btn` Tour ✔ (`Tour:55`). Nút đếm số người **36 × 36 px** (`Tour:60`) < 44 → **F12**. CTA thanh dính đạt ~45,2 px nhưng chỉ nhờ `line-height` kế thừa, và `Tour:107` còn ghi đè `min-height:0` → mất chốt chặn (**F12b**). |
| **E — cỡ chữ tối thiểu** | **Pass** (theo 08) / **Nợ** (theo 07) | Nhỏ nhất là `--fs-badge` 11px, đúng sàn của 08 mục E ✔. Nhưng `--fs-xs` 12px đang gánh thông tin thương mại: giá từng hạng (`Tour:64,206`), nhãn giá thanh đáy (`DiDong:88`, `TourDiDong:68`), giấy phép (`Tour:217`) — 07 §2 ghi "không nhỏ hơn 15px trong UI chính" → **F24**. |
| **E — `aria-label` bộ đếm** | **Pass** | `Tour:205-206`: `aria-label="Bớt người lớn"/"Thêm người lớn"/"Bớt trẻ em"/"Thêm trẻ em"` và `aria-label` cho hai ô số → khớp SPEC §4.3 "Trợ năng". Thiếu `inputmode="numeric"`, `name="pax.adult"` và thẻ `<form>` bọc (id đang nằm trên `div`, `Tour:193`) → ghi **N1**. |
| **E — tương phản** | **Fail** (hero) | Trắng trên `--c-primary` (`Tour:194`) = 9,46 / 7,27 / 5,47 theo 07 §1b ✔. Trắng trên `--c-accent` (`.btn`) = 5,44 / 5,02 / 6,29 ✔. Chân trang #9aa9b2 trên #0E1A23 = 7,34 ✔. **Chữ hero trên ảnh không có nền bảo đảm**: gradient `to top, primary-strong 0%, rgba(8,47,73,.55) 40%, transparent 68%` — tại chặng 40 % phủ lên tông ảnh mẫu #cfe3ee cho ~**4,0:1** với chữ 17px (dưới 4,5), còn huy hiệu 14px nằm ở ~59 % nơi alpha chỉ ~0,18 → **F13**. |
| **E — ngữ nghĩa** | **Fail** | Breadcrumb là `<ol class="crumb">` trần trong `<div>`, **không bọc `<nav>`** (`Main:85`, `DiaDanh:68`, `TraiNghiem:68`, `Tour:84`); di động chỉ là `<div>` chữ thường (`DiDong:66`, `TourDiDong:53`) → **F11**. Thứ bậc h1 → h2 → h3 đúng ở cả 6 file ✔. `prefers-reduced-motion` vắng 6/6 nhưng cả 6 file **0 `transition`, 0 `animation`** nên chưa phát sinh → **N8**. |
| **F — phiếu nợ** | Đã lập | Mục 5. |

---

## 3. Giá trị xuất hiện ở ≥ 2 vùng (§3.1 luật 1)

Ngoại lệ được phép: **giá** (thanh dính + khối hành động) và **CTA** lặp ở thanh dính/thanh đáy. Mọi dòng dưới đây nằm ngoài ngoại lệ đó.

| # | Giá trị | Các vùng | File · dòng | Nhận định |
|---|---|---|---|---|
| L1 | `title` của trang | breadcrumb + h1 hero | `Main:89,103`; `DiaDanh:68,78`; `TraiNghiem:68,78`; `Tour:84,94` | Quy ước breadcrumb, chấp nhận — ghi để đủ danh sách |
| L2 | "Tắm bùn" / "tắm bùn khoáng" | huy hiệu hero + đoạn mở + điểm nổi bật | `Main:101,104,164` | **Trùng nội dung hero ↔ điểm nổi bật** |
| L3 | "làn nước trong xanh" | đoạn mở + thân bài | `Main:104,183` | Trùng nội dung |
| L4 | "bãi cát trắng dài" ↔ "Bãi biển đẹp nhất" | đoạn mở + điểm nổi bật | `Main:104,166` | Trùng nội dung |
| L5 | "khu nghỉ dưỡng sinh thái" ↔ "Resort nghỉ dưỡng" ↔ "dịch vụ nghỉ dưỡng cao cấp" | đoạn mở + điểm nổi bật + thân bài | `Main:104,165,183` | Trùng nội dung 3 vùng |
| L6 | Khoảng cách đảo | đoạn mở "6 km" vs thân bài "7 km" | `Main:104,185`; `DiDong:69` | **Mâu thuẫn số liệu** → F17 |
| L7 | "15 phút" đi cano | Cách tới nơi + FAQ | `Main:194,215` | Luật 2: field cấu trúc đã trả lời, FAQ lặp vai |
| L8 | "Đảo Hòn Tằm" (cha) | breadcrumb + ô Địa chỉ | `Main:88,141` | §3 "breadcrumb là nơi duy nhất hiện cha"; giá trị `address` vốn chứa tên — ghi nhận |
| L9 | Điểm nổi bật ↔ thân bài (Địa danh) | 3 cặp: bảo tồn / nước trong / hệ sinh thái | `DiaDanh:98-101` vs `107-108` | Trùng nội dung |
| L10 | Cách đi đảo | Cách tới nơi + FAQ | `DiaDanh:113,126` | Luật 2 |
| L11 | Vai trò rollup trải nghiệm | mục "Trải nghiệm tại đây" + FAQ | `DiaDanh:116-119,127` | Luật 2 |
| L12 | **"22.000 đồng"** | FAQ của entity **không có vùng giá** | `DiaDanh:125` | → F16f |
| L13 | Điểm nổi bật ↔ FAQ (Trải nghiệm) | "Quay phim, chụp ảnh"/"Dễ dàng tham gia" | `TraiNghiem:100,102` vs `120,121` | Trùng nội dung |
| L14 | "Hòn Mun" (venue) | breadcrumb + thân bài | `TraiNghiem:68,109` | Cha lặp ngoài breadcrumb |
| L15 | "giá trọn gói, không phụ thu" | khối hành động của 2 entity | `Main:241`; `TraiNghiem:131` | Không có field nguồn |
| L16 | **"Cảng Du Lịch Nha Trang"** (`tripOrigin`) | Thông tin nhanh + lịch trình chặng 2 | `Tour:116,136` | **Vi phạm luật 1** |
| L17 | **"8:00 – 16:00"** (`duration`) | Thông tin nhanh + lịch trình + FAQ | `Tour:115,135-140,181`; `TourDiDong:59` | **Vi phạm luật 1** |
| L18 | **"Người lớn, Trẻ em"** (`touristType`) | Thông tin nhanh + hàng số người của form | `Tour:117,205-206` | **Vi phạm luật 1**; giá trị còn giống hạng khách hơn `touristType` (so với `TraiNghiem:137` "Khám phá, Cảm giác mạnh") |
| L19 | Chính sách giá trẻ em | form (455.000₫) + FAQ (70 %) | `Tour:206,184` | Giá xuất hiện ở vùng thứ ba |
| L20 | Đoạn mở ↔ thân bài (Tour) | gần như nguyên văn | `Tour:95` vs `168` | Trùng nội dung nặng nhất |
| L21 | "tắm biển, thư giãn" | điểm nổi bật + ghi chú chặng 3, 5 | `Tour:127,137,139` | Trùng nội dung |
| L22 | Tiêu đề tour | h1 + mục lục + h3 thân bài | `Tour:94,163,167` | Mục lục lặp là quy ước; h3 gần trùng h1 |

---

## 4. Chữ đọc như ghi chú cho người thiết kế/dev (yêu cầu bổ sung)

| File · dòng | Nguyên văn | Nhận định |
|---|---|---|
| `Tour:169` | "(Mục "Lịch trình chi tiết" của bài cũ không còn ở đây — từng điểm dừng đã vào ghi chú của lịch trình phía trên, theo luật 2.)" | **Nằm trong thân bài của màn hi-fi** → phải gỡ (F4) |
| `Tour:215` | "Hotline: **[hotline Tour Đảo]**" | Chỗ giữ chỗ dạng ngoặc vuông lộ ra mặt trang |
| `Main:240`, `TraiNghiem:133` | "Gọi hotline Tour Đảo" | Nhãn thay số máy; SPEC §4.3 định dạng "Hotline: …" kèm `tel:` |
| `DiDong:53`, `DiDong:98`, `TourDiDong:44`, `TourDiDong:75` | "Màn đầu · 390 × 844 · thanh đáy dính", "Cả trang · thứ tự khối trên di động", "Tour · màn đầu … trỏ #dat-tour" | Nhãn artboard — chấp nhận, đã tách bằng `.lbl` |
| `DiDong:100-117`, `TourDiDong:77-87` | "1 · Header · Hero …" → "10 · …", kèm chú "— ẩn khi rỗng", "— thẻ ngang ảnh trái", "giá chỉ ở thanh đáy", "(ADR-0027: CTA di động trỏ #dat-tour)" | Sơ đồ thứ tự khối, **không phải màn hình**. Chấp nhận nhưng Code phải hiểu đây là spec, không phải copy |
| `DiDong:119` | "So với hiện trạng (suy từ CSS đang chạy; đo desktop: header 69 + thanh dính 62 = 131 px chrome cố định phía trên)…" | Ghi chú so sánh hiện trạng |
| `TourDiDong:89` | "Form đứng ngay sau Thông tin nhanh (06 §3 …). Không có giá → không form, thay bằng kênh Zalo/hotline (quyết định nền 3)." | Trích dẫn spec trên artboard |

**Ghi nhận riêng theo yêu cầu — nền ô kẻ chéo placeholder ảnh** (không tính là hex cứng vi phạm): `#cfe3ee`, `#c9e0ea`, `#d9e8ef`, `#d4e6e1`, `#e3e9ef`, `#cfe0ea`, `#dbe9e4` cùng `rgba(15,23,42,.06/.12)` của `.ph`; `#e8ecef` là nền bàn vẽ của artboard.

---

## 5. Phiếu nợ (mục F)

| # | Mô tả | Mức | Trang liên quan | Sẽ xử khi |
|---|---|---|---|---|
| N1 | `BookingForm` mới vẽ **bước 1**. Chưa có bước 2 (họ tên, SĐT, email, điểm đón, ghi chú, honeypot `website`, Turnstile), trạng thái thành công / lỗi kiểm / lỗi mạng / `<noscript>` theo SPEC §4.3; `id="dat-tour"` đang nằm trên `div` chứ chưa phải `<form method="post" action="/api/dat-tour">` | tb | `Tour` | Trước khi Code dựng `BookingForm.astro` |
| N2 | Địa danh và Trải nghiệm chưa có artboard di động; thứ tự khối di động của hai entity đang phải suy từ `DiDong` | tb | `DiaDanh`, `TraiNghiem` | Bổ sung ở bước 7 hoặc chốt "dùng chung khung `DiDong`" |
| N3 | `06` §3 mâu thuẫn nội bộ về Breadcrumb cho Tour: cột "Khi rỗng" nói dùng nhánh URL, cột Ghi chú nói "không áp dụng: … tour", §3.1 ghi "—". Cả 4 mockup đều vẽ breadcrumb | tb | 4 file desktop | Cowork chốt, không để Code tự hoà giải |
| N4 | `06` chưa có hàng cho dải cuối trang ("Gần đây" / "tương tự"); chỉ có câu thứ tự khối ở §3.1 và prop `nearby` ở §7.1 | tb | `DiaDanh`, `TraiNghiem`, `Tour` | Cùng lượt sửa `06` với N3 |
| N5 | §3.1 chưa định vị mục "Bao gồm" của Trải nghiệm trong thứ tự thống nhất (Tour có, Trải nghiệm không) | thấp | `TraiNghiem` | Cùng N4 |
| N6 | Luật đề xuất "tiêu đề > 48 ký tự hạ một bậc" (đang áp ở `Tour:87,94` — h1 dùng `--fs-h2`) chưa có trong `07` | thấp | `Tour`, `TourDiDong` | Chủ dự án duyệt vào `07` trước khi Code |
| N7 | Drift `tokens.css` ↔ `07-DESIGN_TOKENS`: `--radius-lg:18px` (07 §3 không có), `--shadow-raised` khác giá trị 07 §3, `--fs-badge` 11px vs 07 §2 "badge 12px", `--fs-xs` không có trong 07, thứ tự `--font-display` khác 07 §2, motion 180/300ms + `ease` vs 07 §5 150/250ms + cubic-bezier. **Mockup bám `tokens.css` là đúng nguồn**; nợ thuộc về `07` | tb | mọi file | Cập nhật `07` cho khớp `tokens.css` |
| N8 | `prefers-reduced-motion` vắng 6/6 (08 mục E). Hiện chưa phát sinh vì 0 `transition`/`animation`; khối reset đã có sẵn trong `tokens.css` | thấp | mọi file | Code giữ nguyên khối reset |
| N9 | Ảnh là `div.ph` nên chưa kiểm được `alt` (`06` §3: "alt bắt buộc khi có ảnh") | thấp | mọi file | Cổng QA2 |
| N10 | Dưới bộ `cat-bien` (nền kem ấm), `--c-surface-alt` #F8FAFC và `--c-primary-soft` #F0F7FC vẫn lạnh; dải "Gần đây" và huy hiệu sẽ lệch tông. Do 07 §1b chỉ đổi 4 token, không phải lỗi mockup — nhưng mockup dùng hai token đó làm mảng lớn | thấp | `DiaDanh`, `TraiNghiem`, `Tour` | Chủ dự án xem bản thật ở bộ `cat-bien` |

---

## 6. Bảng lỗi theo khuôn mục G

### Mức **Cao** — chặn cổng

| ID | Mục audit | Mô tả | Mức | File | Trạng thái |
|---|---|---|---|---|---|
| **F1** | A3, B1 | **Nhãn chờ giá trên entity chưa có giá.** Khối hành động mang tiêu đề "Hỏi giá và giữ chỗ" và câu "Giá theo gói lặn và số người — nhắn Zalo để được báo giá trọn gói, không phụ thu." (`TraiNghiem:130-131`). `06` §0 quyết định nền 3 buộc: chưa nối `bookingRef` thì "vùng giá và nút đặt không render, trang thuần nội dung, **không CTA giả, không nhãn chờ**"; §6 luật 3 và DR-036 nhắc lại. Kênh Zalo/hotline (`ContactChannels`) được phép giữ — thứ phải gỡ là **tiêu đề và câu thay giá**. Kế hoạch §8 tự khai "Trải nghiệm không giá → không vùng giá, không nút thay thế", tức artifact lệch chính lời khai của nó | Cao | `TraiNghiem` | Chưa sửa |
| **F2** | A1, D | **Di động Điểm tham quan thiếu Khối hành động.** `DiDong:100-117` liệt kê 10 khối, không khối nào là giá + Zalo + hotline sau Thông tin nhanh; `DiDong:101` ghi "giá chỉ ở thanh đáy". `06` §3 hàng "Khối hành động": "Di động: nằm sau Thông tin nhanh; CTA còn lặp ở thanh đáy" — và `TourDiDong:79` làm đúng điều đó. Hệ quả nếu Code làm theo: trang Điểm tham quan trên di động mất hẳn kênh hotline và ô "Vé vào cửa" | Cao | `DiDong` | Chưa sửa |
| **F3** | C2 | **0/6 file đánh dấu dữ liệu giả định.** `grep` "PLACEHOLDER/⚠/prices.yaml/placeholder" = 0 lần. `data/prices.yaml` đang **rỗng** (chỉ còn mẫu chú thích) trong khi mockup in 540.000₫ (`Main:126,233`; `DiDong:89`), 650.000₫ (`Tour:106,196,205`; `TourDiDong:68`), 455.000₫ (`Tour:206`), 70 % (`Tour:184`) như số thật; kèm hotline, `0258 6 250 250`, giấy phép `56-245/2023/TCDL-GP-LHQT`, `31/08/2026`, "Cập nhật 08/2026", giờ mở cửa. 08 mục C2 buộc "**Tất cả** giá trong mockup phải có comment 'từ prices.yaml' hoặc được gắn cờ placeholder". Ghi ở `docs/plans/…§8` không thay được: Code đọc artifact | Cao | cả 6 | Chưa sửa |

### Mức **Trung bình**

| ID | Mục audit | Mô tả | Mức | File | Trạng thái |
|---|---|---|---|---|---|
| F4 | A2 | Ghi chú biên tập in thành nội dung trang, nằm trong thân bài: "(Mục "Lịch trình chi tiết" của bài cũ không còn ở đây … theo luật 2.)" (`Tour:169`) | tb | `Tour` | Chưa sửa |
| F5 | B1 | Accent ngoài vùng hành động/giá: ghim bản đồ `fill="var(--c-accent)"` (`Main:246`, `DiaDanh:144`, `TraiNghiem:140`) và dấu "✗" (`Tour:153`). 07 §1: "Vùng nội dung không dùng accent" | tb | 4 file | Chưa sửa |
| F6 | B6, §1b | Gradient hero trộn `var(--c-primary-strong)` với `rgba(8,47,73,.55)` cứng (`Main:98`, `DiaDanh:75`, `TraiNghiem:75`, `Tour:91`) → sang `cat-bien`/`ngoc-lam` hai chặng lệch màu; kèm `rgba(248,250,252,.22)` cứng ở huy hiệu hero | tb | 4 file | Chưa sửa |
| F7 | B6 | Token khai xong không dùng: `--sticky-h` (tên còn sai — `tokens.css` và đợt 4A dùng `--sticky-bar-h`), `--header-h`; chiều cao viết cứng `height:68px` / `height:56px` / `top:calc(68px + 56px + 16px)` (`Main:64,116,228` và 3 file tương tự). Tương tự với `--container` 1200px và `--container-padding` 24px — có token, mockup vẫn viết `max-width:1200px;padding:0 24px` | tb | 4 desktop | Chưa sửa |
| F8 | B6 | Cỡ/khoảng cách ngoài thang: logo `font-size:22px` (4 file desktop), h1 di động `28px` (`DiDong:68`) và `24px` (`TourDiDong:55`) — thang 07 §2 là 17/21/26/32/40/42/46; `padding:2px 10px` ở `.badge` dù `tokens.css` có `--badge-py`/`--badge-px`; `padding:10px 20px` (CTA thanh dính), `padding:3px 0`, `margin-top:10px`, `border-radius:2px` | tb | cả 6 | Chưa sửa |
| F9 | B5 | `.sec-title { letter-spacing:-0.015em }` ở **cả 6 file** (`Main:27`, `DiDong:27`, `DiaDanh:24`, `TraiNghiem:24`, `Tour:25`, `TourDiDong:24`). 07 §2: `letter-spacing = 0`, "không dùng tracking âm cho heading tiếng Việt"; `tokens.css` đặt `letter-spacing:0` cho h1–h3 | tb | cả 6 | Chưa sửa |
| F10 | B6 | `--ls-eyebrow` dùng kèm `line-height:1.5` viết cứng thay vì `--lh-eyebrow` (token có trong `tokens.css`, 6/6 file không khai): `Main:176`, `DiDong:43`, `DiaDanh:139`, `TraiNghiem:136`, `Tour:58`, `TourDiDong:35`. 07 §2: "phải đi kèm `line-height.eyebrow`, không dùng rời" | tb | cả 6 | Chưa sửa |
| F11 | E | Breadcrumb không bọc `<nav>` (`Main:85`, `DiaDanh:68`, `TraiNghiem:68`, `Tour:84`); bản di động chỉ là `<div>` chữ, mất "Trang chủ" và mất cấu trúc danh sách (`DiDong:66`, `TourDiDong:53`), lại nằm **dưới** ảnh hero trong khi `06` §3 v2.1 ghi "nằm trên dải sáng phía trên hero" | tb | cả 6 | Chưa sửa |
| F12 | E | Nút đếm số người `36 × 36 px` (`Tour:60`) dưới ngưỡng 44; `Tour:107` ghi đè `min-height:0` lên CTA thanh dính, chiều cao 45,2px chỉ còn phụ thuộc `line-height` kế thừa; `.btn` của `Main:55`, `TraiNghiem:47`, `DiaDanh` không khai `min-height` | tb | `Tour`, `Main`, `TraiNghiem` | Chưa sửa |
| F13 | E | Chữ hero trên ảnh không có nền bảo đảm. Với gradient `transparent 68% → rgba(8,47,73,.55) 40% → primary-strong 0%` phủ tông ảnh mẫu #cfe3ee: chữ trắng 17px tại chặng 40 % ≈ **4,0:1** (< 4,5); huy hiệu 14px nằm ở ~59 % nơi alpha ≈ 0,18 → thấp hơn nữa. Cần chốt luật nền chữ hero (scrim đặc dưới khối chữ hoặc ngưỡng độ sáng ảnh) | tb | `Main`, `DiaDanh`, `TraiNghiem`, `Tour` | Chưa sửa |
| F14 | A3 | Giá ở thanh dính thiếu đơn vị: "từ 540.000₫" (`Main:126`), "từ 650.000₫" (`Tour:106`) trong khi I16 buộc render trọn nhãn kèm đơn vị và `TourDiDong:68` có "/ người" | tb | `Main`, `Tour` | Chưa sửa |
| F15 | A2, D1 | Dải cuối trang ba tên khác nhau và một chỗ vắng: "Gần đây" (`DiaDanh:153`), "Trải nghiệm tương tự" (`TraiNghiem:147`), "Tour tương tự" (`Tour:224`), **không có** ở `Main`. Kiểu tiêu đề cũng khác `.sec-title` (không gạch chân, `--c-text`, fw 700 thay vì `--c-primary` fw 800) | tb | 4 desktop | Chưa sửa |
| F16 | §3.1 luật 1 | Lặp giá trị giữa các vùng — xem bảng mục 3, đáng kể nhất: L16 `tripOrigin`, L17 `duration`, L18 `touristType`, L19 giá trẻ em ở FAQ, L20 đoạn mở ↔ thân bài của Tour, L12 giá 22.000đ trên entity không có vùng giá, L15 "giá trọn gói, không phụ thu" không có field | tb | cả 6 | Chưa sửa |
| F17 | C2 | Mâu thuẫn số liệu trong cùng một trang: "cách đất liền khoảng 6 km" (`Main:104`) vs "cách trung tâm … khoảng 7 km" (`Main:185`) | tb | `Main`, `DiDong` | Chưa sửa |
| F18 | D1 | Nhãn ô Thông tin nhanh trên di động bỏ định ngữ: "Điện thoại" (`DiDong:76`) thay vì "Điện thoại khu du lịch" (`Main:145`) — `06` §3 ghi rõ nhãn phải kèm loại nơi "để không lẫn với hotline của site"; "Website" (`DiDong:74`) vs "Website chính thức" (`Main:149`) | tb | `DiDong` | Chưa sửa |
| F19 | D1 | Một hành động, ba nhãn: "Chat Zalo" (`Main:127`, `TraiNghiem:89,132`), "Đặt vé qua Zalo" (`Main:238`, `DiDong:91`), sơ đồ lại ghi "Chat Zalo" cho đúng nút "Đặt vé qua Zalo" đó (`DiDong:117`) | tb | `Main`, `DiDong`, `TraiNghiem` | Chưa sửa |
| F20 | D2 | Biến thể nút viền `.btn.o` (`TraiNghiem:49`, `Tour:57`) chưa có hồ sơ component dùng chung; viền `--c-border` trên nền trắng ≈ **1,24:1**, dưới ngưỡng 3:1 cho ranh giới thành phần giao diện | tb | `TraiNghiem`, `Tour` | Chưa sửa |
| F21 | A2 | Lịch trình hiện khung giờ đồng hồ "8:00 – 8:45" … "15:00 – 15:30" (`Tour:135-140`) mà model chỉ có `durationAtStop`; `06` §4.8 ghi `departureNote` "không phải lịch chỗ trống (I1)" | tb | `Tour` | Chưa sửa |
| F22 | A2 | Mục lục trỏ hai mục không tồn tại trong bài: "Các trải nghiệm trong tour" (vai của rollup, luật 2) và "Chính sách hủy đặt chỗ" (không có field) (`Tour:164-165`) | tb | `Tour` | Chưa sửa |

### Mức **Thấp**

| ID | Mục audit | Mô tả | Mức | File | Trạng thái |
|---|---|---|---|---|---|
| F23 | B6 | Màu cứng ngoài token: `stroke="#fff"`/`fill="#fff"` ở ghim bản đồ (`Main:246`, `DiaDanh:144`, `TraiNghiem:140`); bóng `0 -4px 16px rgba(15,23,42,.08)` của thanh đáy (`DiDong:42`, `TourDiDong:34`) không thuộc bộ shadow token | thấp | 5 file | Chưa sửa |
| F24 | E | `--fs-xs` 12px gánh thông tin thương mại (giá hạng `Tour:64,206`; nhãn giá thanh đáy `DiDong:88`, `TourDiDong:68`; giấy phép `Tour:217`) — 07 §2 đặt sàn UI chính ở 15px | thấp | `Tour`, `DiDong`, `TourDiDong` | Chưa sửa |
| F25 | B6 | `TourDiDong:20` viết cứng `line-height:1.16` vì file không khai `--lh-heading` | thấp | `TourDiDong` | Chưa sửa |
| F26 | B6 | Khối `:root` thiếu so với `tokens.css`: `--fs-display`, `--fw-*`, `--lh-eyebrow`, `--badge-py/px`, `--card-lift`, `--shadow-lg`, `--shadow-overlay`, `--container*`, `--bp-*`, `--m-*`, `--hero-min-h*`, `--card-img-h`, `--c-coral`, `--c-footer-muted`, `--c-hero-fallback-*`. Không sai giá trị, nhưng là gốc của F7/F8/F10 | thấp | cả 6 | Chưa sửa |
| F27 | A2 | Dải chân trang "Tour · Vé · Phòng · Xe đưa đón" và vòng tròn logo chưa ghi `decor` / `config (build)` | thấp | 4 desktop | Chưa sửa |
| F28 | D1 | `.sec-title` di động dùng `--fs-h4` (`DiDong:27`, `TourDiDong:24`) còn desktop dùng `--fs-section`; bậc chữ theo khổ máy chưa được ghi thành luật | thấp | 2 file di động | Chưa sửa |
| F29 | E | Dấu phân cách breadcrumb "/" tô `--c-border` #E2E8F0 trên nền trắng (≈ 1,24:1) — gần như không thấy (`Main:37` và 3 file tương tự) | thấp | 4 desktop | Chưa sửa |

---

## 7. Kết luận

**Chưa đạt QA1.** Tiêu chí đậu của `08-QA_CHECKLIST` mục G đòi **0 lỗi mức Cao**; báo cáo này ghi **3 lỗi Cao**, **19 lỗi Trung bình**, **7 lỗi Thấp**, **10 phiếu nợ**.

Điểm nên ghi nhận: khung chung của 4 entity đã thống nhất, **thứ tự mục đúng §3.1** ở cả bốn trang, quy tắc gộp Thông tin nhanh khi ≤ 2 ô được áp đúng, Địa danh đã đúng luật "không giá thì không vùng giá và không nút thay thế", `BookingForm` bước 1 bám sát SPEC §4.3 kể cả `aria-label` bộ đếm và chữ "Tạm tính", và **mọi `--fs-*` viết px đều khớp rem×16 của `tokens.css`**, ba bộ giao diện khai đủ với CTA không phụ thuộc bộ.

### Phải sửa trước khi Code chạy (chặn cổng)

1. **F1** — `TraiNghiem:130-131`: gỡ tiêu đề "Hỏi giá và giữ chỗ" và câu "Giá theo gói lặn và số người — nhắn Zalo để được báo giá trọn gói, không phụ thu."; giữ nguyên hai nút kênh liên hệ. Nếu chủ dự án muốn giữ, phải là **override có ghi**, không phải mặc định của mockup.
2. **F2** — `DiDong:100-117`: chèn khối hành động (giá "Vé vào cửa" + Zalo + hotline) ngay sau khối 2 "Thông tin nhanh", đúng như `TourDiDong:79`; sửa câu "giá chỉ ở thanh đáy" ở `DiDong:101`.
3. **F3** — thêm cờ vào chính artifact cho mọi con số chưa có nguồn: comment HTML "⚠ PLACEHOLDER — chưa có dòng trong `data/prices.yaml`" cạnh 540.000₫ / 650.000₫ / 455.000₫ / 70 %, và cạnh hotline, `0258 6 250 250`, số giấy phép, `31/08/2026`, "Cập nhật 08/2026", giờ mở cửa.

### Nên sửa cùng lượt (rẻ, cùng file, chặn drift sang code)

**F9** (bỏ `letter-spacing:-0.015em`, 6 file, 1 dòng/file) · **F10** (khai và dùng `--lh-eyebrow`) · **F7** (đổi `--sticky-h` → `--sticky-bar-h` và dùng token thay px cứng — nếu để nguyên, Code sẽ đẻ ra token thứ hai cùng nghĩa) · **F5** (bỏ accent khỏi ghim bản đồ và dấu "✗") · **F4** (gỡ câu ghi chú khỏi thân bài Tour) · **F14** (thêm "/ người" vào giá thanh dính) · **F11** (bọc breadcrumb trong `<nav>`).

**F13** cần một quyết định bề mặt, không phải một sửa nhỏ: chốt luật nền chữ hero rồi mới dựng `Hero`.

**N3, N4, N5** là mâu thuẫn/thiếu ở `06`, thuộc quyền Cowork — QA không tự hoà giải, ghi lại để chủ dự án chốt trước bước 4.

---

*QA agent: Claude (vai QA độc lập, phiên 2026-08-22). Timestamp báo cáo: 2026-08-22. Artifact kiểm ở commit `dc0ac4c`. Báo cáo này không sửa bất kỳ file nào ngoài chính nó.*
