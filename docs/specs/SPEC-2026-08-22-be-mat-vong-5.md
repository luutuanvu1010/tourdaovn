# SPEC — Bề mặt vòng 5: chữ, thang cỡ, màu, và bố cục di động của trang chi tiết

- **Trạng thái:** nháp, **chờ chủ dự án duyệt**. Hướng đã chốt qua năm câu hỏi trong phiên brainstorm 2026-08-22; giá trị cụ thể chưa chốt và cố ý chưa điền.
- **Sửa đổi 2026-08-24 (`QĐ-2026-08-24-02`):** §6 thêm hạng mục giao nộp thứ mười hai (nhãn nút trên trang miễn phí) và sửa mốc font; §7 **R8 thu hẹp** (không bỏ), thêm **R9**, R4 đổi sang đơn vị byte payload; §2.6 sửa số đo thư mục font.
- **Ngày soạn:** 2026-08-22   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa hai chiều ở phần token (chữ, cỡ, màu — revert bằng một commit). **Cửa một chiều ở `06-BINDING_MAP` v2.3**: đổi vùng của `summary` và thêm Luật 5 kéo theo mockup và code phải dựng lại. **Cửa một chiều ở V0b**: thêm một cổng vào `gate:all` và buộc component gắn `data-field`/`data-region` — gỡ ra sau này là gỡ một hàng rào.
- **Repo lúc soạn:** khởi thảo tại `ab24aa5`; **soát lại tại `6e2d57e`** sau khi một phiên song song phát hành `06` v2.2.0 (`44393e7`) và chốt cổng QA1 đợt 4B (`1c20f17`) — xem §0.
- **Liên quan:** `SPEC-2026-08-14-be-mat-vong-3` (vòng trước, cùng bốn than phiền), `docs/plans/2026-08-21-audit-va-ke-hoach-giao-dien-vong-4.md` (vòng 4 đang dở), `06-BINDING_MAP` **v2.2.0** (`QĐ-2026-08-22-05`), `07-DESIGN_TOKENS` (đã duyệt 2026-06-12, bổ sung 2026-08-06)

---

## 0. Điều đã đổi dưới chân spec này trong lúc soạn

Spec này khởi thảo lúc `main` ở `ab24aa5`. Trong cùng buổi, **một phiên Claude khác** (`session_01Jk4vyPPGJpHsWpRcMbwwZK`) chạy song song trên đợt 4B và đã phát hành ba thứ chồng lên nền của spec:

| Commit | Đổi gì | Ảnh hưởng tới spec này |
|---|---|---|
| `1c20f17` | Chủ dự án **chốt cổng QA1 đợt 4B** và gỡ sáu nợ (`QĐ-2026-08-22-05`): N3, N4, N11, N13, N14, N15a, N15b | V0a **không còn bị chặn** — §4 đã sửa |
| `44393e7` | `06-BINDING_MAP` lên **v2.2.0**; `01-CONTENT_MODEL` lên v1.0.19 | Mọi thay đổi của spec này nay nhắm **v2.3**, không phải v2.2 |
| `def5b47` | Design sửa mockup Tour (N15a) và hai chỗ giá trong `faq` (N13) | Không xung đột; nhưng xem hai mục dưới |

**Hai va chạm thật, đã xử:**

**a. Tên "Luật 4" đã có chủ.** `06` v2.2 §6 đặt **Luật 4 (N13)** cho "số giá viết trong chữ phải có hạn dùng". Luật cột→hàng của spec này vì vậy đổi tên thành **Luật 5 (v2.3)** ở §5.1. Nếu không đổi, hai luật khác nhau mang cùng số trong cùng một tài liệu — đúng loại nguồn sự thật thứ hai mà `CLAUDE.md` §5 bắt dừng.

**b. Cách đo trùng lặp của bản nháp đầu sai so với N11.** `06` v2.2 bổ sung phạm vi Luật 1: *"luật này ràng buộc **field**, không ràng buộc **chuỗi ký tự** … Đo trùng lặp bằng cách hỏi *field nào nuôi ô này*, không bằng cách so chuỗi trên trang."* Bản nháp đầu đo bằng cách so chuỗi. Đã đo lại ở tầng field — §2.1 mục "Đo lại theo N11".

## 1. Bốn điều chủ dự án nêu, và vì sao vòng này không lặp lại vòng 3

Chủ dự án nêu bốn việc:

1. Phông chữ thuần tiếng Việt chuẩn, bộ kích thước và màu sắc phù hợp với trang du lịch.
2. Trang chi tiết mọi entity: mô tả không nằm trong phạm vi hero, đưa xuống dưới hoặc lên trên, tương tự breadcrumb.
3. Ưu tiên di động: chuyển hiển thị cột trên desktop thành hiển thị hàng trên di động.
4. Rà trùng lặp ánh xạ dữ liệu — ví dụ Chùa Long Sơn hiện nhiều mức giá miễn phí.

**Ba trong bốn điều này đã được nêu và đã được xử một lần rồi.** `SPEC-2026-08-14-be-mat-vong-3` §1 chép lại đúng chữ của chủ dự án tám ngày trước: *"Chữ đều đều, không phân cấp / Phông chữ không hợp ngành / Màu nhạt, thiếu điểm nhấn / Nhìn không ra công ty du lịch."* Vòng đó đã thi hành (commit `59cab03`).

Vòng 3 chọn hướng đóng khung, và ghi rõ lý do loại các hướng rộng hơn ở §4 của nó:

| Vòng 3 làm gì | Vòng 3 loại gì, vì sao |
|---|---|
| Đảo thứ tự `--font-display` để Be Vietnam Pro (đã có sẵn trong repo) thực sự được dùng cho tiêu đề | **Bộ chữ mới hoàn toàn** — loại vì "thêm bộ chữ thứ ba, phải tự lưu trữ, phải soi kỹ dấu tiếng Việt ở cỡ nhỏ" |
| Giãn bốn bậc cỡ đang dồn trong 3px | **Tương phản kiểu tạp chí** (mục 42px, thẻ 24px) — loại vì tên tour dài ngắt 3 dòng trên di động |
| Tăng **diện tích** màu: khối quan trọng lấy nền `--c-primary`, nút chính đổi sang `--c-sand` | **Không thêm và không đổi một mã hex nào** (§3.3, nguyên văn). Đổi trục màu — loại vì "phải sửa nhiều mã trong `tokens.css`" |

**Tám ngày sau, chủ dự án nêu lại ba trong bốn điều đó.** Đây là dữ kiện, không phải cảm nhận: hướng đóng khung của vòng 3 đã chạy hết và chưa giải được vấn đề. Vòng 5 vì vậy được phép mở đúng ba cánh cửa mà vòng 3 đóng lại — ứng viên chữ mới, thang cỡ dựng lại từ đầu, và sửa mã hex — nhưng mở **kèm bằng chứng**, không mở tự do (§3.3).

Vòng 3 cũng đã tự ghi sẵn lối thoát này ở §4: *"Bày lại trọn trang chủ theo mạch bán hàng — để dành vòng sau nếu vòng này chưa đủ."* Vòng này chưa đủ. Nhưng bố cục trang chủ vẫn **ngoài phạm vi** vòng 5 (§9) vì chủ dự án nêu bốn điều về trang chi tiết, không về trang chủ.

## 2. Chẩn đoán — bảy dữ kiện đo được

### 2.1 Ý (4) không phải một trang hỏng — 44/58 trang chi tiết đang lặp vùng

Chủ dự án viết "**kiểm tra lại** việc trùng lặp ánh xạ dữ liệu trên trang, **ví dụ** … Chùa Long Sơn". Chữ "kiểm tra lại" và "ví dụ" là đúng: đã quét toàn bộ, và ca Chùa Long Sơn nằm trong hai kiểu **ít gặp nhất** trong chín kiểu lặp.

**Phương pháp.** Tải cả 58 trang chi tiết từ `sitemap-vi.xml` ngày 2026-08-22, tách giá trị của bốn vùng theo class ổn định (`.info-value` = `InfoBar`, `.info-row-value` = `InfoCard`, `.sticky-bar__price` = thanh dính, `.booking-price-value` = `BookingCTA`), rồi đếm mỗi *giá trị* xuất hiện ở mấy vùng. Script và kết quả đầy đủ: `docs/evidence/2026-08-22-trung-vung-truoc-4B/`.

**Kết quả sơ bộ: 44/58 trang (76 %) có ít nhất một giá trị hiện ở hơn một vùng.** Phép đo này so chuỗi; xem mục "Đo lại theo N11" ngay dưới để có con số đúng ở tầng field.

| Loại trang | Trang lặp / tổng |
|---|---|
| Điểm tham quan | **20 / 21** |
| Địa danh | 6 / 7 |
| Trải nghiệm | 7 / 10 |
| Tour | 11 / 20 |

Chín kiểu lặp, đếm theo số trang:

| Nhãn hiển thị | Số trang | Các vùng lặp |
|---|---|---|
| Giờ mở cửa | **22** | `InfoBar` + `InfoCard` |
| Điện thoại | **20** | `InfoBar` + `InfoCard` |
| Thời lượng | **18** | `InfoBar` + `InfoCard` |
| Hình thức | 11 | `InfoBar` + `InfoCard` |
| Phù hợp | 7 | `InfoBar` + `InfoCard` |
| Loại | 6 | `InfoBar` + `InfoCard` |
| Thuộc | 6 | `InfoBar` + `InfoCard` |
| **Giá vé / Phí vào cửa** | 5 | `InfoBar` + `InfoCard` + thanh dính + `BookingCTA` |
| Khởi hành / Xuất phát | 5 | `InfoBar` + `InfoCard` |

### Đo lại theo N11 — hỏi field, không so chuỗi

Bảng trên đếm **giá trị trùng**. `06` v2.2 (N11) nói rõ đó không phải phép đo đúng: Luật 1 ràng buộc *field*. Đã đo lại bằng cách đọc thẳng `infoBarItems` và `sidebarRows` của từng `*Detail.astro` và so **biểu thức field**, không so chuỗi hiển thị (script: `docs/evidence/2026-08-22-trung-vung-truoc-4B/quet-field-trung-vung.py`).

**Kết quả: 15 cặp field-trùng-vùng, ở 6 template.**

| Template | Field nuôi cả `InfoBar` lẫn `InfoCard` |
|---|---|
| `AttractionDetail` | `openingHours`, `telephone` |
| `PlaceDetail` | `placeType`, `openingHours`, `containedInPlace` |
| `ExperienceDetail` | `duration`, `touristType` |
| `TourDetail` | `duration`, `tourFormat` |
| `RestaurantDetail` | `servesCuisine`, `openingHours`, `telephone` |
| `SpecialtyDetail` | `specialtyType`, `originNote`, `season` |

**Một dương tính giả bị loại.** "Khởi hành / Xuất phát" là **hai field khác nhau** — `departureNote` ở `InfoBar`, `tripOrigin` ở `InfoCard` — tình cờ cùng mang chuỗi "Cảng du lịch Nha Trang". N11 nêu đúng ví dụ này. **Không** vi phạm Luật 1.

**Số trang không đổi: vẫn 44/58**, vì mọi trang dính dương tính giả đó đều còn ít nhất một cặp thật (`duration`, `tourFormat`).

**Và một ca mà phép đo tự động bỏ sót — đây chính là luận cứ cho V0b.** Ca giá của Chùa Long Sơn *không* lọt vào bảng 15 cặp, vì `InfoBar` đọc `priceView` còn `InfoCard` đọc `data.isAccessibleForFree` — hai **biểu thức** khác nhau của **cùng một field**, do `resolver.ts:25-26` biến `isAccessibleForFree` thành `label = "Miễn phí"`. So biểu thức không thấy; so chuỗi thì thấy nhưng lại dính dương tính giả. **Không phép đo tĩnh nào đúng cả hai chiều** — chỉ có cách để chính component khai `data-field` mình đang render, rồi đếm trên HTML đã dựng. Đó là §5.4.

**Ca chủ dự án bắt được là ca nặng nhất, nhưng ít gặp nhất (5/58 trang, ngang với "Khởi hành / Xuất phát").** Trên `/diem-tham-quan/chua-long-son/` chuỗi "Miễn phí" ra **bốn vùng**, và tệ hơn "lặp bốn lần": **hai nhãn khác nhau cho cùng một sự thật** — "Giá vé" ở `InfoBar`, "Phí vào cửa" ở `InfoCard`. Khách đọc ra hai khoản phí cùng bằng không, không phải một khoản in hai lần. Cùng lỗi ấy ở Tour: "Khởi hành" và "Xuất phát" là hai nhãn cho một field.

**Gốc không nằm ở `isAccessibleForFree`, cũng không nằm ở `AttractionDetail.astro`.** Tám trong chín kiểu lặp là cặp `InfoBar` + `InfoCard` in lại **cùng một bộ field** — đúng DR-032. Mọi trang chi tiết đều dựng cả hai vùng đó qua `DetailLayout`, nên lỗi không phải của một template mà của **cặp vùng**.

**Đặc tả đã đóng việc này ở tầng chữ.** `06` §3.1 (v2.1, giữ nguyên ở v2.2) khai mỗi field đúng một vùng (`isAccessibleForFree` của Điểm tham quan → "Thông tin nhanh, chỉ khi true"), §6 Luật 1 viết "một thông tin, một vùng, một lần", ngoại lệ duy nhất là **giá** (thanh dính + khối hành động), và `InfoBar` cùng `InfoCard` **không còn là vùng**. Vùng mới "Thông tin nhanh" thay cả cặp.

Nên đây là việc của **Code đợt 4B bước 4**, không phải việc của Design. Đưa vào prompt Design là sai vai theo `CLAUDE.md` §3. Nhưng sửa code thôi thì chưa đóng được gốc — xem §2.7.

### 2.2 `tokens.css` chạy ngược với `07-DESIGN_TOKENS` §2

`07` §2 khai:

```
font.family.heading = "Nunito", "Be Vietnam Pro", system-ui, sans-serif
```

`src/styles/tokens.css:71` chạy thật:

```css
--font-display: "Be Vietnam Pro", "Nunito", system-ui, sans-serif;
```

Ngược nhau. Nguồn: `SPEC-2026-08-14-be-mat-vong-3` §3.1 đảo thứ tự có chủ ý và **đúng**, nhưng `07` chưa được cập nhật theo. Nghĩa là **nguồn token duy nhất của dự án đang mô tả sai thứ đang chạy** — vi phạm chính câu mở đầu của `07`. Ghi thành phiếu drift (§4, V1).

Hệ quả thực tế hôm nay: **tiêu đề là Be Vietnam Pro** (chỉ có cấp 700/800 trong `public/fonts/`), **thân bài là Nunito** (biến thiên 400–800).

### 2.3 Thang cỡ chạy thật 14 bậc, `07` khai 8

`07` §2 khai `font.size.scale` = "17 / 22 / 26 / 32 / 40 / 42 / 46 / 60" — tám bậc.

`tokens.css` dòng 80–104 định nghĩa **mười bốn** bậc: 11 · 12 · 14 · 15 · 17 · 18 · 20 · 21 · 26 · 32 · 40 · 42 · 46 · 60. Bậc 22px trong đặc tả không tồn tại trong mã (đã hạ về 20px, có ghi chú tại dòng 90).

Bốn bậc nằm sát nhau trong khoảng 15–21px (15 · 17 · 18 · 20 · 21) là đúng loại lỗi mà vòng 3 §2.2 đã chẩn đoán và đã cố giãn — giãn xong vẫn còn năm bậc trong 6px. Đây là căn cứ đo được cho than phiền "cỡ chữ lộn xộn, phân cấp mờ". Ghi thành phiếu drift (§4, V1).

### 2.4 Đoạn mở đang nằm trên ảnh, và đó là nguồn rủi ro tương phản

`src/components/DetailLayout.astro:62` render `summary` vào `slot="overlay"` của `Hero` — tức chữ đè lên ảnh. `06` §3.1 khai đúng như vậy (`summary` → hero cho cả bốn entity), nên **code không sai spec**; muốn đổi thì phải sửa spec trước.

QA1 đợt 4B vòng 3 đo tương phản đoạn mở trên ảnh ở bộ xấu nhất `ngoc-lam`: **6,6:1** — đạt AA nhưng phải dựa vào lớp phủ. Đưa đoạn mở khỏi ảnh thì rủi ro đó biến mất hẳn, không phải canh lớp phủ theo từng ảnh nữa.

### 2.5 Hai entity chưa từng được vẽ ở khổ di động

Canvas vòng 4 có sáu artboard trang chi tiết: `Main` + `DiDong` (Điểm tham quan), `Tour` + `TourDiDong`, `DiaDanh`, `TraiNghiem`. **Địa danh và Trải nghiệm chỉ có bản desktop 1280.** Một yêu cầu về di động không thể nghiệm thu trên hai trang chưa từng có bản di động.

### 2.6 Nợ LCP đang treo

`07` §2 mục "Nợ có chủ ý" ghi: *"chưa đo LCP sau hai lần đổi chữ."* Bộ chữ đã đổi hai lần trong ngày 2026-08-06 (`QĐ-2026-08-06-10` chốt Lora, `QĐ-2026-08-06-11` thay bằng Nunito ngay trong ngày), rồi đổi vai lần nữa ở vòng 3 ngày 14/08. Thư mục font **đo lại 2026-08-24: 6 file, 89.196 byte payload = 87,1 KB** (`QĐ-2026-08-24-02`), giảm từ ~220 KB; con số ~104 KB ghi ở `07` §2 và `QĐ-2026-08-06-11` là bản ghi của thời điểm đó, giữ nguyên. Ngưỡng của `00-PROJECT_BRIEF` §6: LCP ≤ 2500 ms, Lighthouse mobile ≥ 90.

Đề xuất bộ chữ thứ tư mà không đóng nợ này là mở nợ chồng nợ.

### 2.7 Gốc: Luật 1 là luật duy nhất trong `06` không có bộ kiểm máy

Câu hỏi phải trả lời không phải "vì sao Chùa Long Sơn hiện bốn lần Miễn phí", mà **"vì sao 76 % trang lặp vùng mà không cổng nào đỏ, và điều gì ngăn nó quay lại sau khi Code sửa"**.

`06` §3.1 tự khai câu trả lời, nguyên văn:

> *"Cột này không phải cột 'Dữ liệu nuôi' nên bộ kiểm `g3` không đọc; nó là hợp đồng cho bước 7 và bước 8."*

Đối chiếu với những gì đang chạy:

| Bộ kiểm | Kiểm gì | Có bắt được lặp vùng không |
|---|---|---|
| `g3-binding-map-vs-template` | field khai trong `06` **có được template render không**; field template dùng mà `06` không khai | **Không.** Kiểm *có/không*, không kiểm *mấy lần* |
| `entity-layout-post` | entity detail có đi qua primitive chung; Hotel/Resort có delegate; mọi element có nằm trong container | **Không.** Kiểm chọn component và bao bọc, không kiểm field |
| `i1-i19`, `py1-py8`, `r1-r4` | gate publish, ref integrity, redirect, hreflang | **Không.** Không đụng tầng trình bày |

Không bộ kiểm nào đếm số vùng của một field. Luật 2 và Luật 3 cũng vậy, nhưng chúng ít bị vi phạm im lặng hơn vì hệ quả nhìn thấy ngay; Luật 1 thì lặp một dòng ở sidebar không ai để ý cho tới khi có người đọc kỹ một trang.

**Hệ quả: Luật 1 hiện chỉ được thi hành bằng mắt người, ở QA1, và chỉ trên mockup — không trên HTML đã dựng.** Mockup 4B qua QA1 sạch Luật 1; production thì 44/58 trang vi phạm. Hai thứ đó không mâu thuẫn, vì **không có cổng nào nối chúng lại**.

Nên phương án "Code sửa `AttractionDetail.astro` và `DetailLayout`" chữa được 44 trang hôm nay và **không ngăn được trang thứ 59**. Entity mới, delta mới, hay một lần refactor `DetailLayout` là drift quay lại, im lặng như lần này. Đóng gốc nghĩa là **đưa Luật 1 xuống tầng máy kiểm** — hiện vật V0b ở §4, hợp đồng ở §5.4.

## 3. Quyết định đã chốt trong phiên brainstorm 2026-08-22

**Sáu** quyết định của chủ dự án (3.1–3.6). Ghi lại để bước sau không phải đoán lại. *(Sửa 2026-08-24: dòng này trước ghi "năm câu hỏi, năm câu trả lời" — số đếm cũ, sót lại từ trước khi 3.6 được thêm. §4 và prompt vòng 5 đều đã ghi "sáu"; nay thống nhất.)*

**3.1 — Tách theo vai.** Bốn ý thuộc ba vai; không gộp vào một prompt Design. Ý (1) và (3) đi Design; ý (2) đi đường sửa `06`; ý (4) đi Code.

**3.2 — "Cột → hàng" nghĩa là: ô cạnh nhau trên desktop thành mỗi ô một hàng chiếm hết bề rộng trên di động**, nhãn trái, giá trị phải. Không phải "lưới thẻ thành dải ngang cuộn", cũng không phải "hai cột nội dung+sidebar xếp chồng" (thứ này code đã làm sẵn tại `max-width: 900px`).

**3.3 — Vấn đề của chữ và màu là thẩm mỹ và phân cấp, không phải lỗi dấu kỹ thuật.** Chủ dự án chọn ba triệu chứng: chữ không hợp ngành du lịch, cỡ chữ lộn xộn phân cấp mờ, màu chưa ra chất du lịch. **Không** chọn "dấu tiếng Việt xấu/lỗi". Nghĩa là: không có lỗi dựng dấu phải sửa; việc là chọn lại bộ chữ và bộ màu cho đúng ngành.

**3.4 — Mức tự do của Design: có kiểm soát, đề xuất kèm bằng chứng.** Design được đề xuất 2–3 ứng viên chữ mới và sửa sắc độ ba bộ màu, nhưng mỗi đề xuất phải kèm artboard dựng bằng chữ thật và ảnh thật của site, số byte woff2 từng file, và bảng WCAG AA bốn cặp × ba bộ. Chủ dự án chốt bằng mắt trên bản dựng thật. **Không** chọn hướng đóng khung (chỉ 2 font đã có), cũng **không** chọn hướng mở (Design tự dựng bộ nhận diện mới).

**3.5 — Trình tự: Code 4B đi trước, vòng 5 chạy song song ở tầng đặc tả.** Không gộp 4B vào vòng 5, không chạy hai prompt Design song song.

**3.6 — Đoạn mở đặt ở dải sáng dưới hero, sau thanh dính.** Không lên trên hero (đẩy ảnh xuống ~160px trên di động), không chen giữa hero và thanh dính (đẩy giá xuống sâu thêm ~110px trên desktop, phải mở lại Luật 3). Hero sau đó còn **huy hiệu loại + h1**.

## 4. Hiện vật, vai, và cổng

| # | Hiện vật | Vai | Cổng | Chặn bởi |
|---|---|---|---|---|
| **V0a** | Phiếu Code đợt 4B, gồm ý (4): thay cặp `InfoBar` + `InfoCard` bằng vùng **Thông tin nhanh** theo `06` §3.1, đóng cả **chín** kiểu lặp ở §2.1 — không chỉ ca giá của Chùa Long Sơn | Code | QA2 | ~~chốt cổng QA1 4B, chốt N3/N15~~ — **đã chốt 2026-08-22** (`QĐ-2026-08-22-05`, `1c20f17`). Không còn bị chặn |
| **V0b** | **Bộ kiểm Luật 1** (§5.4): validator hậu dựng đếm số vùng mỗi field, đỏ khi > 1 ngoài ngoại lệ đã khai. Kèm việc gắn `data-field` / `data-region` vào component vùng | Code | QA2 · vào `gate:all` | V0a **hoặc** chạy cùng V0a |
| **V1** | Hai phiếu drift: font-stack ngược (§2.2), thang 14 bậc vs 8 bậc khai (§2.3) | Cowork | ~~ghi vào `DRIFT_LOG.md`~~ — **xong 2026-08-24: `DR-050` + `DR-051`** | — |
| **V2** | `06-BINDING_MAP` **v2.3** (§5) | Cowork | chủ dự án chốt + QĐ mới | — |
| **V3** | Prompt bàn giao Design vòng 5 (§6) | Cowork | ~~tự kiểm P1–P6~~ — **xong 2026-08-24: đạt 6/6**, khối QA ở cuối `docs/prompts/VONG-5-CLAUDE-DESIGN.md` | ~~V1 + V2~~ — cả hai đã xong |
| **V4** | Mockup vòng 5 (§6) | Design | QA1 do tác nhân độc lập chạy | V3 |
| **V5** | `07-DESIGN_TOKENS` **v2** — điền giá trị chủ dự án đã chọn | Cowork | chủ dự án chốt + QĐ | V4 |
| **V6** | Code vòng 5 | Code | QA2 | V5 |

**V0b là đề xuất của Cowork, chưa phải quyết định của chủ dự án.** Sáu quyết định ở §3 do chủ dự án chốt trong phiên brainstorm; V0b ra đời sau, khi yêu cầu "sửa root reason" dẫn tới cuộc quét ở §2.1 và chẩn đoán ở §2.7. Nó thêm một cổng vào `gate:all` và buộc mọi component vùng gắn thuộc tính — cửa một chiều, nên phải được chốt riêng, không đi kèm theo cùng V0a.

**Vì sao thang cỡ do Design đề xuất chứ không do Cowork dọn.** V1 chỉ *ghi* rằng con số chạy thật lệch con số khai. Chọn tám bậc nào là quyết định thẩm mỹ, thuộc bước 7; `07` §0 ghi "Design đề xuất, chủ dự án duyệt (vai A ở RACI)".

**Vì sao `07` tách làm hai lượt (V1 rồi V5).** Chủ dự án đã chọn mức tự do "Design đề xuất kèm bằng chứng" (§3.4), nên không thể chốt giá trị font trước khi Design dựng ba ứng viên. Viết `07` v2 ngay bây giờ thì hoặc bịa giá trị, hoặc để chỗ trống — cả hai đều trượt cổng theo `CLAUDE.md` §6.

## 5. `06-BINDING_MAP` v2.3 sửa gì

### 5.1 Luật 5 — ô cạnh nhau trên desktop, mỗi ô một hàng trên di động

Thêm vào §6:

> **Luật 5 (v2.3) — ô cạnh nhau trên desktop, mỗi ô một hàng trên di động.** Mọi vùng trình bày nhiều ô ngang hàng ở desktop — Thông tin nhanh, khối hành động, dòng meta, thẻ thông tin — ở `≤ 640px` chuyển thành **mỗi ô một hàng chiếm hết bề rộng**, nhãn bên trái, giá trị bên phải. Cấm bóp cột: không ô nào được hẹp hơn 100% bề rộng vùng chứa, trừ khi nội dung của nó ngắn hơn một dòng.
>
> **Loại trừ: lưới thẻ không thuộc luật này.** Thẻ Tour, Gần đây, Trải nghiệm tại đây mang ảnh và tiêu đề, không phải cặp nhãn/giá trị. Chúng xếp chồng dọc, mỗi thẻ một khối, như hiện nay. Luật 5 chỉ áp cho vùng dữ liệu dạng nhãn/giá trị.

Loại trừ này phải viết ra. Không viết thì Design sẽ áp Luật 5 lên lưới thẻ và biến thẻ có ảnh thành dòng nhãn/giá trị.

Ngưỡng `640px` lấy theo breakpoint đang dùng trong `PriceDisplay.astro` và họ component cùng nhóm, không mở breakpoint mới.

### 5.2 Đoạn mở rời hero

Sửa ba chỗ, cho **cả bốn** entity:

| Chỗ | v2.2 (đang hiệu lực) | v2.3 |
|---|---|---|
| §3 hàng "Đoạn mở" | *(ngầm hiểu trong hero)* | dải sáng **dưới hero, sau thanh dính**, trên Thông tin nhanh |
| §3.1 ma trận, dòng `summary` | `hero` × 4 entity | `dải đoạn mở` × 4 entity |
| §3.1 dòng thứ tự khối di động | hero → Thông tin nhanh → … | hero → thanh dính → **đoạn mở** → Thông tin nhanh → … |

Hàng "Hero" ở §3 sửa theo: trên ảnh còn **huy hiệu loại + h1**, không còn đoạn mở.

Giữ nguyên: `summary` vẫn là nguồn `speakable` (§3 hàng speakable, S2.4) và vẫn là gate I10. Đổi **vùng hiển thị**, không đổi field, không đổi `01-CONTENT_MODEL`.

### 5.3 Luật 3 không phải mở lại

Luật 3 "giá trước, chữ sau" đòi màn đầu của entity thương mại có giá hoặc nhãn miễn phí. Với lựa chọn §3.6, thanh dính giữ nguyên vị trí ngay dưới hero, nên giá không tụt xuống dòng nào. Trên di động, §3.1 vốn đã khai "thanh đáy giá + CTA luôn thấy" — thanh đáy không phụ thuộc vị trí đoạn mở.

**Ghi rõ trong v2.3 rằng Luật 3 đã được kiểm và không đổi**, để QA1 không phải suy lại.

### 5.4 Làm §3.1 đọc được bằng máy — hợp đồng cho bộ kiểm Luật 1

Đây là phần đóng gốc §2.7. `06` v2.3 phải bổ sung ba thứ để một validator đọc được §3.1, thay vì để nó là bảng chỉ người đọc.

**a. Đặt tên định danh cho từng vùng.** §3 hiện gọi vùng bằng tên tiếng Việt tự do ("Thông tin nhanh", "thanh dính", "khối hành động"). v2.3 thêm một cột hoặc một bảng phụ gán mỗi vùng một `id` ổn định:

| Vùng | `id` |
|---|---|
| huy hiệu hero | `hero-badge` |
| breadcrumb | `breadcrumb` |
| dải đoạn mở | `summary-band` |
| Thông tin nhanh | `fact-strip` |
| thanh dính | `sticky-bar` |
| khối hành động | `action-block` |
| thẻ bản đồ | `map-card` |
| mục thân bài | `section-<tên mục>` |

**b. Khai ngoại lệ thành dữ liệu, không thành câu văn.** Luật 1 hiện ghi ngoại lệ bằng văn xuôi ("hiện chỉ có giá"). v2.3 khai thành bảng máy đọc được: field `giá` → `["sticky-bar", "action-block"]`. Thêm ngoại lệ về sau là thêm một dòng, và validator tự nới theo — không phải sửa mã validator.

**c. Buộc component gắn nhãn vùng.** Mỗi component vùng render `data-region="<id>"`, mỗi ô dữ liệu render `data-field="<tên field trong 01>"`. Không có hai thuộc tính này thì không có cách nào đếm vùng trên HTML đã dựng mà không đoán qua class — mà class thì đổi theo mỗi lần sửa CSS.

**Bộ kiểm V0b khi đó làm đúng ba việc:**

1. Đọc §3.1 của `06` (thẳng từ Markdown, như `g3` đã làm từ 2026-08-05 sau DR-027 — **không chép tay bảng vào mã**).
2. Quét `dist/**/*.html`, gom `(field, region)` theo từng trang.
3. Đỏ khi một `field` xuất hiện ở nhiều hơn một `region` mà cặp đó không có trong bảng ngoại lệ; đỏ khi `field` render ở `region` khác với vùng §3.1 khai.

Thêm vào `gate:all`. **Ba mốc nghiệm thu, cả ba phải đạt** — nếu không, bộ kiểm sai chứ không phải trang sạch:

1. Chạy trên bản dựng **trước** V0a: đỏ ở **44 trang**, phủ đủ **15 cặp** field ở §2.1.
2. Bắt được ca `isAccessibleForFree` của Điểm tham quan — ca mà cả so-chuỗi lẫn so-biểu-thức đều đo sai (§2.1). Đây là bài kiểm thật của thiết kế `data-field`.
3. **Không** đỏ ở cặp `departureNote` / `tripOrigin` — hai field khác nhau trùng chuỗi. Đỏ ở đây là vi phạm N11, tức bộ kiểm đang so chuỗi trá hình.

Sau V0a phải **xanh** cả ba.

**Vì sao đọc §3.1 chứ không chép tay.** DR-027 đã ghi đúng bài học này: trước 2026-08-05, `g3` mang tên bản ánh xạ nhưng bảng trong mã là bản chép tay và `BINDING_MAP_PATH` chưa từng được mở — sửa `06` không làm đổi gì máy kiểm, nên tài liệu và bộ kiểm thành hai nguồn sự thật song song (N7, P6). V0b không được lặp lại lỗi đó.

## 6. Prompt bàn giao Design vòng 5 chứa gì

Prompt chia **hai chặng trong cùng một phiên Design, có cổng ở giữa**.

### Chặng 1 — quyết bề mặt (3 artboard)

Design chưa đụng vào sáu trang. Giao ba thứ để chủ dự án chốt bằng mắt:

| Artboard | Nội dung | Ràng buộc |
|---|---|---|
| **Ba ứng viên chữ** | Cùng một màn hình Chùa Long Sơn dựng ba lần, ba bộ chữ khác nhau | **Ảnh thật lấy từ Sanity** và **chữ thật của chính bài đó** — không chữ giả, không ô kẻ chéo. Ứng viên A bắt buộc là bộ đang chạy (Be Vietnam Pro + Nunito) để làm mốc so |
| **Thang cỡ mới** | ≤ 8 bậc, mỗi bậc gắn đúng một vai | Dựng song song ở 390px và 1280px. Phải nêu bậc nào thay bậc nào trong 14 bậc hiện có |
| **Ba bộ màu** | Sắc độ đề xuất cho `bien-sau`, `cat-bien`, `ngoc-lam` | Bảng AA bốn cặp × ba bộ. Sửa bộ nào thì sửa cả ba, không bỏ bộ nào |

Kèm **bảng chi phí font**: từng ứng viên, số byte woff2 từng file, tổng payload, chênh so với **89.196 byte (87,1 KB)** hiện tại — mốc đo lại 2026-08-24, tính bằng byte payload chứ không phải `du` (`QĐ-2026-08-24-02`).

**Cổng: chủ dự án chốt chữ, thang, màu.** Rồi mới sang chặng 2.

### Chặng 2 — áp vào trang (8 artboard)

Bốn entity × desktop 1280 + di động 390, theo bộ đã chốt và theo `06` v2.3:

| Entity | Desktop | Di động |
|---|---|---|
| Điểm tham quan | dựng lại từ `Main` | dựng lại từ `DiDong` |
| Tour | dựng lại từ `Tour` | dựng lại từ `TourDiDong` |
| Địa danh | dựng lại từ `DiaDanh` | **mới — chưa từng có** |
| Trải nghiệm | dựng lại từ `TraiNghiem` | **mới — chưa từng có** |

Mỗi artboard chặng 2 kèm **bảng đối chiếu vùng ↔ dòng nào trong `06` v2.3**. Vùng không đối chiếu được là vùng phải bỏ.

**Hạng mục thứ mười hai — nhãn nút trên trang điểm tham quan miễn phí** (thêm 2026-08-24, `QĐ-2026-08-24-02`). `QĐ-2026-08-24-01` gỡ vùng giá khỏi trang miễn phí nhưng **không** gỡ nút "Đặt vé" trỏ Zalo còn lại — một nút đặt vé trên một ngôi chùa miễn phí. Đó là câu hỏi nhãn và luồng, thuộc bước 7. Design đề xuất **chữ và vị trí**; chủ dự án chốt. Biên của đề xuất:

- Nhãn **"Đặt vé" bị loại** trên trang miễn phí — không có vé để đặt.
- `06` §6 **Luật 3** cấm "nút thay thế trỏ về chính site" khi không có giá. Nút Zalo trỏ **ra ngoài** site nên không vướng; một nút trỏ về trang khác của tourdao.vn thì vướng.
- **R7** cấm CTA giả: nút phải dẫn tới hành động có thật (mở Zalo), không phải nút trang trí cho cân bố cục.

**Vì sao tách hai chặng.** Gộp lại thì Design phải dựng 8 artboard × 3 ứng viên chữ = 24 bản, phần lớn vứt đi. Tách ra thì chủ dự án chốt chữ trên một màn hình rồi mới trả giá cho tám bản.

### Ranh giới phạm vi trong prompt

**Token áp toàn site; bố cục chỉ đụng trang chi tiết entity.** Đổi bộ chữ thì trang chủ, header, footer đổi theo — không tránh được, vì `07` là nguồn duy nhất. Nhưng Design **không** được vẽ lại bố cục trang chủ, header, hay footer trong vòng này: ba thứ đó vừa qua đợt riêng ngày 2026-08-14, và kế hoạch vòng 4 §7 để chúng ngoài phạm vi.

## 7. Ràng buộc cứng — vi phạm là trượt QA1

| # | Ràng buộc | Căn cứ |
|---|---|---|
| **R1** | Không tạo nguồn token thứ hai. Giá trị mới là **đề xuất trong bảng**, không viết thẳng vào `tokens.css`, không hardcode màu vào mockup | `07` mở đầu; `CLAUDE.md` §5 |
| **R2** | Cả ba bộ giao diện phải cùng dùng được. Sửa sắc độ thì sửa cho cả ba | `07` §1b |
| **R3** | WCAG AA ≥ 4,5 ở bốn cặp × ba bộ. `--c-sand` cấm làm nền cho chữ trắng (chỉ đạt 3,28). Kiểm bằng `npm --prefix scripts run check:theme` | `07` §1; `04-CONSTRAINTS` §3 |
| **R4** | Font mới phải self-host được, đủ subset `vietnamese` + `latin`, ghi số byte woff2 từng file. **Trần: tổng payload `.woff2` ≤ 140 KB** — mốc trước đợt đổi chữ; nay đang **89.196 byte = 87,1 KB** trên 6 file (`QĐ-2026-08-24-02`). Mốc và trần đều tính bằng **byte payload**, không phải `du` | `07` §2; `QĐ-2026-08-24-02` |
| **R5** | Kèm điều kiện **đo LCP trước khi lên live** (LCP ≤ 2500 ms, Lighthouse mobile ≥ 90). Đây là cách đóng nợ đang treo ở `07` §2 | `00-PROJECT_BRIEF` §6 |
| **R6** | Luật 1: một thông tin, một vùng, một lần. Mockup lặp field ra hai vùng là trượt — trừ giá | `06` §6 |
| **R7** | Vùng rỗng ẩn hẳn. Không placeholder, không khung trống, không CTA giả | `06` quyết định nền 2 và 3 |
| **R8** | **Khối có số mục phụ thuộc dữ liệu phải tử tế với 1 mục.** Áp cho mọi dải/lưới sinh từ truy vấn liên quan (Gần đây, Trải nghiệm tại đây, Dải liên quan) và mọi listing của nhánh dưới 12 entity (Khách sạn 6, Địa danh 7, Trải nghiệm 9, Resort 0). **Không** còn áp cho lưới thẻ Tour và Điểm tham quan — hai nhánh đã đủ dày (23 và 36). Ít mục thì **thu khối lại**, không độn placeholder cho đầy hàng | `00-PROJECT_BRIEF`; **thu hẹp theo `QĐ-2026-08-24-02`** (bản gốc: "mọi khối tử tế với 1 mục", prompt Pha F) |
| **R9** | Không đổi một field nào của `01-CONTENT_MODEL`; không sửa `06-BINDING_MAP`, không sửa `07-DESIGN_TOKENS`. Design **đề xuất**; Cowork ghi vào đặc tả sau khi chủ dự án duyệt | `CLAUDE.md` §3 (ranh vai Design); `QĐ-2026-08-24-02` |

**Ghi chú sửa đổi (2026-08-24, `QĐ-2026-08-24-02`).** R8 **thu hẹp chứ không bỏ**. Prompt vòng 5 bản `9a9d06f` tuyên bố ràng buộc này "đã hết hiệu lực" rồi chiếm chỗ R8 bằng nội dung nay là R9 — prompt không có thẩm quyền huỷ ràng buộc cứng của spec (`CLAUDE.md` §1). Căn cứ đo và lý lẽ đầy đủ ở `QĐ-2026-08-24-02`; tóm tắt: kho đã dày ở Tour (23) và Điểm tham quan (36), nhưng `/resort/` vẫn có **0** entity và các dải liên quan vẫn có thể chỉ 1 mục.

## 8. Phương án đã loại

| Phương án | Loại vì | Ai loại |
|---|---|---|
| Một prompt Design ôm cả bốn ý | Design đi trước cấu trúc, và Design không được sửa `06` hay chạm code. `CLAUDE.md` §3 và `GOVERNANCE` 4.2 — QA1 sẽ trả lại | Chủ dự án, §3.1 |
| Hoãn vòng 5 tới khi đóng xong vòng 4 | Chậm hơn mức cần; ý (4) đã có đường đi riêng qua V0a + V0b | Chủ dự án, §3.1 |
| Gộp đợt 4B vào vòng 5 | Bug giá trùng sống thêm nguyên một vòng thiết kế; đợt đã qua QA1 sau ba vòng bị mở lại | Chủ dự án, §3.5 |
| Hai prompt Design song song (token trước, bố cục sau) | QA1 phải chạy hai lượt, và mockup token sẽ lệch ngay khi bố cục đổi | Chủ dự án, §3.5 |
| Đóng khung: chỉ dùng hai font đã có | Đúng hướng vòng 3 đã chạy và chưa giải được "chữ không hợp ngành" (§1) | Chủ dự án, §3.4 |
| Mở: Design tự dựng bộ nhận diện mới | Phải viết lại phần lớn `07`, dựng lại toàn bộ mockup 4B vừa qua QA1, chạy lại QA1 từ đầu | Chủ dự án, §3.4 |
| Đoạn mở lên trên hero, cùng dải breadcrumb | Trên di động 390px ảnh bị đẩy xuống ~160px; màn đầu toàn chữ, mất cú hích cảm xúc của site du lịch | Chủ dự án, §3.6 |
| Đoạn mở chen giữa hero và thanh dính | Đẩy giá và CTA trên desktop tụt thêm ~110px, phải mở lại Luật 3 | Chủ dự án, §3.6 |
| Chỉ sửa `AttractionDetail.astro` cho hết ca Chùa Long Sơn | Chữa 5/58 trang và bỏ sót 39 trang còn lại; và không có bộ kiểm thì trang thứ 59 lặp lại im lặng (§2.7) | Cowork, §2.1 |
| Sửa cả 44 trang nhưng không làm bộ kiểm V0b | Đóng hiện trạng, không đóng gốc. Luật 1 vẫn là luật duy nhất trong `06` không có máy kiểm; drift quay lại ở lần refactor `DetailLayout` kế tiếp | Cowork, §2.7 |
| Lưới thẻ thành dải ngang cuộn trên di động | Không phải điều chủ dự án muốn; và với 4 tour thì dễ thành dải một thẻ lơ lửng | Chủ dự án, §3.2 |

## 9. Ngoài phạm vi vòng 5

- **Bố cục trang chủ, header, footer.** Token đổi thì ba thứ này đổi theo, nhưng không vẽ lại bố cục. Việc "bày lại trọn trang chủ theo mạch bán hàng" mà vòng 3 §4 để dành vẫn còn để dành.
- **Mở entity mới, sửa schema Sanity.** Không.
- **Thêm bộ giao diện thứ tư.** Không. Ba bộ hiện có được sửa sắc độ, không thêm bộ.
- **Dark mode, token semantic success/error, font mono.** Vẫn thiếu có chủ ý theo `07` §0 mục 4.
- **Năm cổng đang đỏ ở `gate:all`** (`jsonld-post` I6, `r3-r4-post`, `governance-post` S24, `control-registry-gate`, `deferred-gate`). Đều là nợ dữ liệu hoặc nợ cũ, đã xếp vào đợt 4D.

## 10. Rủi ro và nợ

**R-1 — Vòng 5 có thể lặp lại kết cục của vòng 3.** Vòng 3 sửa token rồi chủ dự án vẫn không hài lòng. Cách vòng 5 phòng: chặng 1 bắt Design dựng **ảnh thật + chữ thật** và bắt chủ dự án chốt **trước khi** dựng tám artboard. Vòng 3 không có bước này — nó chốt giá trị token trên bảng số rồi mới dựng.

**R-2 — Đổi chữ lần thứ tư.** Be Vietnam Pro → Lora → Nunito (cả hai trong ngày 06/08) → đảo vai (14/08) → nay có thể là bộ mới. Cách phòng: R4 đặt trần byte, R5 bắt đo LCP trước khi lên live, và ứng viên A luôn là bộ đang chạy để chủ dự án thấy rõ mình đang đánh đổi cái gì.

**R-3 — `06` v2.3 làm sáu mockup 4B lỗi thời.** Sáu mockup đó vừa đạt QA1 sau ba vòng. Sau v2.3 chúng sai ở vùng đoạn mở. Chấp nhận có chủ ý: chặng 2 dựng lại toàn bộ, và QA1 vòng 5 chạy trên bản mới. Bằng chứng QA1 4B **không bị xoá** — nó vẫn là bằng chứng của thứ đã kiểm tại `e4e1d8a`.

**R-4 — V0a phụ thuộc hai quyết định chưa chốt.** Code 4B không chạy được cho tới khi chủ dự án chốt cổng QA1 4B và chốt N3/N15 (`docs/specs/DE-XUAT-2026-08-22-go-N3-N15.md`). Nếu hai việc đó kẹt, 44 trang lặp vùng kẹt theo. Đây là lý do §3.5 xếp V0a đi trước.

**R-5 — V0b có thể bị hoãn vì "đằng nào V0a cũng sửa xong rồi".** Đây đúng là cách drift quay lại: 44 trang sạch thì áp lực làm bộ kiểm biến mất, và trang thứ 59 lặp lại im lặng. Cách phòng: V0b có mốc nghiệm thu đo được ở §5.4 (chạy trên bản dựng **trước** V0a phải đỏ đúng 44 trang), nên nó phải được viết **trước hoặc cùng lúc** với V0a — sau V0a thì không còn gì để đối chứng bộ kiểm.

**Nợ mở ra, chưa xử, ghi để khỏi rơi.** `SPEC-2026-08-14-be-mat-vong-3` §3.3 đổi nút chính từ `--c-accent` sang `--c-sand`, trong khi `07` §1 viết "Quy tắc dùng accent: accent chỉ xuất hiện ở vùng hành động và nhãn giá". Nút chính **là** vùng hành động nhưng nay không mang màu accent — quy tắc "hai accent hai vùng" của `07` có thể đã lệch so với thứ đang chạy. Chưa kiểm bản dựng, nên đây là **việc phải kiểm**, không phải phiếu drift. Kiểm trong lượt V1.
