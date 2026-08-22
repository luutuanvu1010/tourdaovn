# QA1 đợt 4B — vòng 4 (vòng xác minh ngắn)

- **Ngày:** 2026-08-22
- **Vai:** QA độc lập (không soạn mockup, không soạn đặc tả đang kiểm)
- **Cổng:** QA1 — Design → Code (`08-QA_CHECKLIST.md`, `GOVERNANCE` §4.3)
- **Commit HEAD đang kiểm:** `effae7f`
- **Mốc so sánh:** `e4e1d8a` (hiện vật vòng 3 đã kiểm)
- **Phạm vi vòng này:** KHÔNG rà lại A→F. Chỉ kiểm phần đổi trong `e4e1d8a..HEAD`, theo sáu việc được giao: (1) mục lục Tour, (2) mục lục Main, (3) luật 4 ở hai chỗ giá trong `faq`, (4) lỗi mới trong đúng file đã đổi, (5) `06` v2.2 khớp `QĐ-2026-08-22-05` từng chốt, (6) `QĐ-2026-08-22-06` có đúng thực tế mã không.

### Commit trong phạm vi

`358795d` · `ab24aa5` · `1c20f17` · `44393e7` · `def5b47` · `6e2d57e` · `effae7f`

### Đầu vào đã đọc

| Loại | File |
|---|---|
| Spec cổng | `docs/core-specs/08-QA_CHECKLIST.md` (đọc trước tiên) |
| Đặc tả mới | `docs/core-specs/06-BINDING_MAP.md` v2.2.0 · `docs/core-specs/01-CONTENT_MODEL.md` v1.0.19 |
| Quyết định | `docs/DECISIONS.md` `QĐ-2026-08-22-05` (dòng 880–930) và `QĐ-2026-08-22-06` (dòng 932–950) |
| Mockup | `docs/design/vong4/Tour.dc.html` · `DiaDanh.dc.html` · `Main.dc.html` · `XemThu.dc.html` · `canvas.json` |
| Mã nguồn | `src/lib/serialize/tour.ts` · `src/components/DetailLayout.astro` · `src/components/RouteDispatch.astro` · `src/components/TourDetail.astro` · `src/lib/types.ts` · `src/lib/queries/tour.ts` · `cms/schemas/tour.ts` |
| Kế hoạch / spec khác trong diff | `docs/plans/2026-08-21-audit-va-ke-hoach-giao-dien-vong-4.md` · `docs/specs/SPEC-2026-08-22-be-mat-vong-5.md` · `docs/specs/DE-XUAT-2026-08-22-go-N3-N15.md` |
| Bằng chứng máy | `scripts/reports/g3-binding-map-vs-template.json` (đọc lại, không chạy lại) |
| Vòng trước | `docs/evidence/2026-08-22-qa1-vong-4b/QA1-mockup-4b.md`, `-vong-2.md`, `-vong-3.md` |

---

## Kết luận nhanh

**ĐẠT.**

| Mức | Số lỗi |
|---|---|
| Cao | **0** |
| Trung bình | **6** (F1–F6) — cả sáu đều đã ghi phiếu nợ có ID |
| Thấp | **5** (F7–F11) |

Sáu việc được giao đều kiểm xong. Hai việc chính của đợt sửa — bỏ mục lục Tour và hình dạng luật 4 — **làm đúng**, kiểm được bằng máy chứ không bằng lời khai. Sáu lỗi Trung bình đều nằm ở tầng **tài liệu**, không ở tầng bề mặt: đặc tả tự khai sai phạm vi thay đổi của chính mình, một quyết định đính chính lại kiểm thiếu một file, và một file kế hoạch còn chỉ việc đã bị rút.

---

## 1. Mockup Tour — mục lục đã bỏ (việc 1)

**Đúng.** `Tour.dc.html:161-164` nay là comment thay cho khối `div.toc` cũ.

Kiểm ngưỡng: `06` §3 hàng "Thân bài" (dòng 75) đòi mục lục **khi bài có ≥ 3 tiêu đề cấp cao nhất** của `body`. Thân bài Tour còn đúng **2** tiêu đề — `Tour.dc.html:165` (`#tt-1`) và `:167` (`#tt-2`). 2 < 3 → bỏ mục lục là **đúng ngưỡng**, khớp `QĐ-2026-08-22-05` Chốt 2 (N15a phương án A: đặc tả đúng, mockup sai).

Kiểm neo hụt (tự đếm, không tin comment): trong `Tour.dc.html` có đúng 7 neo thật — `#hl #lt #bg #ct #mua #faq` (thanh dính, dòng 104) và `#dat-tour`. Cả 7 đều có phần tử mang `id` tương ứng. `#tt-1`/`#tt-2` **không được bất kỳ `href` nào trỏ tới** trước hay sau khi bỏ, nên **không neo nào bị hụt**. Lời khai của Design ở comment là đúng.

Cân bằng thẻ HTML: parser cho 0 lỗi, 0 thẻ hở.

## 2. Mockup Main — mục lục được giữ (việc 2)

**Ngưỡng: đúng. Neo: hỏng.**

- Số mục thật: **5** (`Main.dc.html:177-181`). 5 ≥ 3 → giữ mục lục là đúng ngưỡng.
- Nhưng cả **5 mục đều là `href="#"`**, và **không tiêu đề thân bài nào mang `id`** (toàn file chỉ có 5 `id`: `hl`, `tq`, `cach`, `tn`, `faq` — đều của thanh dính). `06` §3 hàng Thân bài viết rõ mục lục phải "**neo vào từng cái, thanh dính trỏ được**". Vế "neo vào từng cái" chưa có ở Main. → **F5**.
- Thanh dính của Main (`:118`) thì đúng: `#hl #tq #cach #tn #faq` đều có đích.
- Phụ: mục lục liệt kê 5 mục nhưng thân bài chỉ vẽ **1** tiêu đề (`:184`), không có ghi chú rằng phần còn lại đã rút gọn → **F6**.

Lỗi này **có từ trước** `e4e1d8a` (Main không nằm trong đợt sửa), ba vòng trước chưa bắt. Ghi ở đây vì việc 2 yêu cầu kiểm.

## 3. Luật 4 — số giá trong chữ của `faq` (việc 3)

`06` §6 Luật 4 (dòng 371) đòi hai thứ: (a) **ngày cập nhật + tên nguồn ngay tại chỗ**; (b) mỗi mục vào **danh sách rà định kỳ**.

| Chỗ | Hình dạng đang có | Vế (a) | Vế (b) |
|---|---|---|---|
| `DiaDanh.dc.html:125` — "22.000 đồng" | `(cập nhật 08/2026 · nguồn: [biên tập điền])`, bọc `<span data-placeholder=…>` | **đạt hình dạng**; nguồn còn để trống theo quy ước placeholder của mockup | chưa có chỗ thi hành |
| `Tour.dc.html:183` — "70 % giá vé" | `(cập nhật 08/2026 · nguồn: bảng giá prices.yaml)` | **đạt đủ**, có cả tên nguồn | chưa có chỗ thi hành |

Cả hai dùng `var(--c-text-muted)` và `var(--fs-sm)` — không hex cứng, không px cứng, hai token đều có định nghĩa trong chính file. Cờ `data-placeholder` đặt trên **thẻ mở** (không lặp lại lỗi V1 của vòng 2).

Quét toàn bộ 11 mockup `vong4`: **không còn chỗ thứ ba** nào viết số giá trong chữ của `faq` mà thiếu luật 4.

Hai điểm hụt nhỏ: "08/2026" là **tháng**, không phải **ngày** như Luật 4 chữ; và danh sách rà (vế b) chưa tồn tại trong repo → **F9**, **F10**.

## 4. Đợt sửa có đẻ lỗi mới không (việc 4)

Kiểm đúng những file đã đổi trong `e4e1d8a..HEAD`.

- `Tour.dc.html`, `DiaDanh.dc.html`: diff gọn (1 khối bỏ, 2 span thêm), không lan sang vùng khác. Cân bằng thẻ OK. Không hex/px cứng mới.
- `XemThu.dc.html` (artboard mới, 227 dòng): token trùng khít với `Main`/`Tour` (`--font-ui: Nunito`, `--font-display: Be Vietnam Pro`, `--c-accent: #C0392B`) — không tạo nguồn token thứ hai. 10/10 `<img>` có `alt`. 8/8 con số giá đều mang `data-placeholder="prices.yaml rỗng — số mẫu"`, đúng C2. Cân bằng thẻ OK. **Không lỗi Trung bình trở lên.**
- `canvas.json`: trang mới "Xem thử — ảnh thật" trỏ đúng `XemThu.dc.html`; mọi `file` trong canvas đều tồn tại trên đĩa.
- `scripts/reports/g3-*.json`: `summary = {total: 24, fail: 0, warn: 24}`. Tự đếm lại theo nhóm: **9** "Phân loại" + **9** "Dải liên quan" + **6** còn lại (4 rollup + 2 `isAccessibleForFree`). Con số 15 → 24 mà `06` §7.1 khai là **đúng**, và "cả 9 cái mới từ đúng một hàng N4" cũng **đúng**.
- Lỗi mới **thật sự** đẻ ra ở đợt này nằm trong tài liệu: **F3** (`06` khai sai phạm vi đổi của chính nó) và **F4** (`docs/plans/…:275` còn chỉ một việc đã bị `QĐ-2026-08-22-06` rút).

## 5. `06` v2.2 có khớp `QĐ-2026-08-22-05` không (việc 5)

| Chốt | Nợ | Đòi gì | `06` v2.2 làm gì | Khớp? |
|---|---|---|---|---|
| 1 | N3 | Tách hàng Breadcrumb làm hai; §3.1 thêm dòng mắt cha | §3 dòng 71 "Breadcrumb (điều hướng)" nguồn `config (build)`, "có, **mọi** trang chi tiết"; dòng 72 "Mắt cha trong breadcrumb" nguồn `containedInPlace`/`venue`, giữ nguyên danh sách "không áp dụng"; §3.1 dòng 96 đổi ô thành "mắt cha trong breadcrumb", ô Tour ghi rõ "— (Tour không có mắt cha; **vùng** breadcrumb vẫn có)" | **Khớp.** §3.1 sửa ô có sẵn thay vì thêm dòng mới — tương đương về nội dung |
| 2 | N15a | Giữ ngưỡng ≥ 3 | §3 dòng 75 "khi bài có ≥ 3 tiêu đề đó"; ghi rõ "ngưỡng giữ nguyên ở v2.2 (N15a)" | **Khớp** |
| 3 | N15b | `Body` hạ một cấp qua `headingOffset`; Article giữ nguyên | §3 dòng 75 mô tả hạ cấp + prop `headingOffset` + miễn trừ Article; §4.10 dòng 232 nhắc lại phía Article | **Khớp** |
| 4 | N4 | Thêm hàng "Dải liên quan", `config (build)`, **áp cho Place/Experience/Tour** | §3 dòng 90: khai cho "**mọi trang chi tiết**" (9 entity, xác nhận bằng 9 cảnh báo `g3`) | **Rộng hơn chữ đã duyệt** → **F1** |
| 5 | N11 | Luật 1 ràng buộc *field*, không ràng buộc chuỗi | §6 dòng 369, gạch đầu dòng con dưới Luật 1, nguyên văn "ràng buộc **field**, không ràng buộc **chuỗi ký tự**… Đo trùng lặp bằng cách hỏi *field nào nuôi ô này*" | **Khớp** |
| 6 | N13 | Cho phép giá trong `faq` kèm (a) ngày + nguồn, (b) danh sách rà | §6 dòng 371 Luật 4, đủ cả hai vế, có ghi đánh đổi | **Khớp** (thứ tự luật lệch → F7) |
| 7 | N14 | `01`/`06` nhận khung giờ trong ngày, là mốc giờ dự kiến | `01` dòng 326 sửa đúng một ô; `06` §4.8 dòng 209 thêm chú | **Khớp** — phần "bắt buộc sửa `serialize/tour.ts`" đã bị `QĐ-…-06` rút, xem mục 6 |

### 5.1 Đánh giá riêng: hàng "Dải liên quan" viết rộng hơn Chốt 4

Ba câu hỏi được giao, trả lời tách bạch:

**Có chính đáng về mặt sự thật không? — Có.** Tự mở mã kiểm: `DetailLayout.astro:106` render `<NearbySection>` **một lần, ở cấp layout dùng chung**, sau `Sidebar` và là khối cuối cùng; `RouteDispatch.astro:115-190` cấp `nearby` cho **mọi** nhánh detail (place, attraction, experience, restaurant, hotel, resort, tour, event, article, organization). Nói "áp cho Place/Experience/Tour" là mô tả thiếu thực tế đang chạy. Điều kiện rỗng "dưới 1 mục thì không render" cũng khớp `nearby.length > 0`.

**Có ghi minh bạch không? — Một nửa.** Việc mở rộng được khai ở `docs/plans/2026-08-21-…:267` ("hai chỗ lệch khỏi chữ đã duyệt, ghi rõ để chủ dự án rà") và ở commit message. Nhưng **trong chính `06` thì không có câu nào nói hàng này rộng hơn Chốt 4**. Ai chỉ đọc `06` sẽ tưởng đây là chữ đã duyệt. Đặc tả là nguồn sự thật; ghi chú minh bạch phải nằm trong đặc tả, không nằm trong file kế hoạch.

**Có tạo mâu thuẫn mới trong `06` không? — Có một, và người soạn đã tự đánh dấu.** Hàng "Dải liên quan" (dòng 90) tự ghi "⚠️ **Chồng lấn chưa gỡ:** bốn hàng rollup có tên riêng… **là chính vùng này** dưới nhãn khác". Bốn hàng đó thật sự còn nguyên: "Sự kiện tại đây" (§4.3 dòng 168), "Bài đã viết" (§4.11 dòng 247), "Tour vận hành" (§4.12 dòng 261), "Sự kiện tổ chức" (§4.12 dòng 262). Vậy `06` v2.2 đang khai **hai vùng cho cùng một khối render**.

**Nhận định QA:** không tự gộp là **đúng luật** — `CONSTITUTION` Điều 3 và `GOVERNANCE` 3.4 cấm tác nhân tự hoà giải, và đánh dấu ⚠️ để mở là hành xử đúng. Nhưng chồng lấn đang mở này **chưa có ID nợ nào**, nên không có gì bảo đảm nó được nhớ tới. QA cấp ID: **N21**. Ngoài ra ⚠️ ghi sai chỗ — nói bốn hàng đó "ở §3", thực tế chúng ở §4 (**F8**).

## 6. `QĐ-2026-08-22-06` có đúng không (việc 6)

Tự mở `src/lib/serialize/tour.ts`, không tin sổ.

**Phần đính chính: ĐÚNG.** `serialize/tour.ts:57-64` đúng như sổ trích:

```js
if (stop.note) { itemData['description'] = stop.note }
if (stop.durationAtStop) {
  itemData['description'] = (itemData['description'] || '') + ` (${stop.durationAtStop})`
}
```

`itemData` được dựng ở dòng 32-52 và chỉ nhận `@type`, `@id`, `name`, `geo`, `sameAs`, `description`. **Không có property `Duration`** ở đâu trong file. `description` là property kiểu Text → chuỗi "8:00 – 8:45" nằm ở đó là hợp lệ. Vậy khẳng định "structured data đang sai kiểu trên production" của Chốt 7 **là sai**, và việc `QĐ-…-06` rút nó là **đúng**.

**Phần kiểm chứng của đính chính: THIẾU MỘT FILE.** `QĐ-…-06` viết "Kiểm hết **bốn** nơi dùng field này trong mã nguồn (bỏ bundle `cms/dist`)… **Không nơi nào coi nó là ISO 8601**". Tự grep lại toàn repo (trừ `cms/dist`, `node_modules`) ra **năm** nơi:

| # | Nơi | Coi là gì |
|---|---|---|
| 1 | `src/lib/types.ts:400` | `durationAtStop?: string` — trung tính |
| 2 | `src/lib/queries/tour.ts:39` | chỉ lấy về |
| 3 | `src/components/TourDetail.astro:133` | in thẳng vào `<span class="tl-dur">` |
| 4 | `src/lib/serialize/tour.ts:61` | nối vào `description` |
| 5 | **`cms/schemas/tour.ts:54`** | `description: 'ISO 8601, vd PT1H30M'` — **đây là dòng chữ biên tập viên đọc khi nhập liệu** |

Nơi thứ năm **có** coi field này là ISO 8601, và nó là schema Sanity — tức nguồn hướng dẫn trực tiếp cho người nhập. Sau khi `01` v1.0.19 chốt "**không phải ISO 8601**", ô mô tả này thành **drift đặc tả ↔ schema chưa đóng**: biên tập mở Studio ra vẫn được bảo gõ `PT1H30M`. → **F2**, phiếu nợ **N17**.

Bài học mà `QĐ-…-06` tự rút ("phải mở file kiểm trước khi ghi") đúng, nhưng chính lần đính chính đó vẫn kiểm thiếu một file — QA ghi lại để lần sau đếm đủ.

Việc `QĐ-…-06` mở ra và tự ghi "chưa kiểm" (`serialize/tour.ts:115` đẩy `tour.duration` ISO 8601 vào `description`) — QA xác nhận dòng 115 tồn tại đúng như mô tả; sổ đã ghi rõ đó không phải quyết định, nên không tính là lỗi của vòng này.

---

## Bảng lỗi

| ID | Mục audit | Mô tả (kèm file:dòng) | Mức | File | Trạng thái |
|---|---|---|---|---|---|
| **F1** | A2 | `06-BINDING_MAP.md:90` khai hàng "Dải liên quan" cho **mọi trang chi tiết** (9 entity), rộng hơn chữ đã duyệt ở `QĐ-2026-08-22-05` Chốt 4 ("áp cho Place/Experience/Tour"). Mã ủng hộ việc mở rộng (`DetailLayout.astro:106`, `RouteDispatch.astro:115-190`), nhưng **bên trong `06` không có câu nào khai là đã đi rộng hơn** — chỉ ghi ở `docs/plans/…:267` và commit message | Trung bình | `docs/core-specs/06-BINDING_MAP.md` | Phiếu nợ **N16** |
| **F2** | G2.1 | `QĐ-2026-08-22-06` khai "kiểm hết bốn nơi… không nơi nào coi nó là ISO 8601". Thiếu nơi thứ năm: `cms/schemas/tour.ts:54` ghi `description: 'ISO 8601, vd PT1H30M'` cho `durationAtStop`, trong khi `01-CONTENT_MODEL.md:326` (v1.0.19) nay chốt "**không phải ISO 8601**". Drift đặc tả ↔ schema chưa đóng; biên tập vẫn được Studio hướng dẫn gõ `PT1H30M` | Trung bình | `cms/schemas/tour.ts`, `docs/DECISIONS.md` | Phiếu nợ **N17** |
| **F3** | A2 | `06-BINDING_MAP.md:17` và dòng 25 đều khai "**chỉ §3, §3.1, §6 đổi**" ở v2.2. Thực tế còn đổi §4.8 (dòng 209), §4.10 (dòng 232), §7 (dòng 382) và §7.1 (dòng 385-397). Người soát dựa vào câu này sẽ bỏ sót 4 chỗ trong một core spec | Trung bình | `docs/core-specs/06-BINDING_MAP.md` | Phiếu nợ **N18** |
| **F4** | A2 | `docs/plans/2026-08-21-audit-va-ke-hoach-giao-dien-vong-4.md:275` vẫn ghi N14 "**kèm bắt buộc sửa `serialize/tour.ts:61-63`** (structured data đang sai kiểu trên production)". Mệnh đề này đã bị `QĐ-2026-08-22-06` rút khỏi hiệu lực **trong cùng đợt**. File kế hoạch đang chỉ một việc không tồn tại cho bước Code | Trung bình | `docs/plans/2026-08-21-audit-va-ke-hoach-giao-dien-vong-4.md` | Phiếu nợ **N19** |
| **F5** | G3.2 / A2 | `Main.dc.html:177-181` — mục lục 5 mục nhưng **cả 5 đều `href="#"`**, và không tiêu đề thân bài nào mang `id`. `06` §3 hàng Thân bài (dòng 75) đòi "neo vào từng cái". Vế "thanh dính trỏ được" thì đạt (`Main:118` → `#hl #tq #cach #tn #faq` đều có đích). Lỗi có từ trước `e4e1d8a` | Trung bình | `docs/design/vong4/Main.dc.html` | Phiếu nợ **N20** |
| **F6** | A2 | `06-BINDING_MAP.md:90` khai "Dải liên quan" là vùng dùng chung cho mọi trang chi tiết, đồng thời §4.3:168, §4.11:247, §4.12:261-262 vẫn giữ bốn hàng rollup mà chính dòng 90 nói "**là chính vùng này** dưới nhãn khác". Hai vùng cho cùng một khối render. Người soạn đã đánh dấu ⚠️ và để mở — **đúng luật** (`CONSTITUTION` Điều 3), nhưng chồng lấn chưa có ID nào theo dõi | Trung bình | `docs/core-specs/06-BINDING_MAP.md` | Phiếu nợ **N21** |
| **F7** | — | `06-BINDING_MAP.md:368-372` — §6 liệt kê luật theo thứ tự **1, 2, 4, 3**. Luật 4 mới chèn giữa Luật 2 và Luật 3 | Thấp | `docs/core-specs/06-BINDING_MAP.md` | Chưa sửa |
| **F8** | — | `06-BINDING_MAP.md:90` ⚠️ ghi "bốn hàng rollup có tên riêng **ở §3**". Bốn hàng đó ở §4 (dòng 168, 247, 261, 262), không ở §3 | Thấp | `docs/core-specs/06-BINDING_MAP.md` | Chưa sửa |
| **F9** | C2 | `DiaDanh.dc.html:125` — luật 4 đòi "**ngày** cập nhật"; mockup ghi "cập nhật 08/2026" (mức tháng), tên nguồn còn là "[biên tập điền]". Hình dạng đủ và có `data-placeholder` đúng quy ước, nhưng nội dung phải đóng ở tầng biên tập. `Tour.dc.html:183` thì đủ tên nguồn | Thấp | `docs/design/vong4/DiaDanh.dc.html` | Chưa sửa |
| **F10** | C2 | Luật 4 vế (b) đòi "danh sách rà định kỳ"; `QĐ-2026-08-22-05` việc 4 cũng đòi "lập danh sách rà giá trong `faq`". Grep toàn `docs/` — chưa có hiện vật nào. Luật 4 hiện chỉ cưỡng chế được vế (a) | Thấp | — (việc vận hành) | Đã có chỗ theo dõi ở `QĐ-2026-08-22-05` việc 4 |
| **F11** | A2 | `Main.dc.html:175-184` — mục lục liệt kê 5 mục nhưng thân bài chỉ vẽ 1 tiêu đề (`:184`), không ghi chú rằng phần còn lại đã rút gọn. Người đọc mockup không tự kiểm được ngưỡng ≥ 3 từ chính thân bài | Thấp | `docs/design/vong4/Main.dc.html` | Chưa sửa |

---

## Phiếu nợ mới (tiếp dãy N1–N15)

| # | Mô tả | Mức | Trang / file liên quan | Sẽ sửa khi |
|---|---|---|---|---|
| **N16** | Hàng "Dải liên quan" của `06` §3 khai rộng hơn chữ Chốt 4 (mọi trang chi tiết, thay vì Place/Experience/Tour). Mã ủng hộ, nhưng chưa được chủ dự án phê chuẩn bằng chữ, và bản thân `06` không khai là đã đi rộng hơn. Cần: chủ dự án phê chuẩn phạm vi rộng, và `06` ghi một câu truy vết ngay tại hàng đó | tb | `06-BINDING_MAP.md:90` | Chủ dự án chốt; Cowork ghi vào `06` v2.3 |
| **N17** | `cms/schemas/tour.ts:54` còn mô tả `durationAtStop` là "ISO 8601, vd PT1H30M", ngược với `01` v1.0.19. `QĐ-2026-08-22-06` khai đã kiểm hết mã nhưng bỏ sót file này. Cần: sửa chuỗi mô tả trong schema, hoặc mở một mục đính chính thứ hai | tb | `cms/schemas/tour.ts`, `01-CONTENT_MODEL.md:326` | Bước Code (thay chuỗi mô tả, không đổi kiểu field) |
| **N18** | `06` v2.2 tự khai "chỉ §3, §3.1, §6 đổi" nhưng §4.8, §4.10, §7, §7.1 cũng đổi. Cần sửa dòng phiên bản và dòng "Đổi gì ở v2.2" cho khớp diff thật | tb | `06-BINDING_MAP.md:17,25` | Lần chạm `06` kế tiếp |
| **N19** | `docs/plans/…-vong-4.md:275` còn ghi N14 kèm "bắt buộc sửa `serialize/tour.ts:61-63`" — đã bị `QĐ-2026-08-22-06` rút. Cần thêm một câu đính chính ngay tại chỗ để bước Code không nhặt việc ma | tb | `docs/plans/2026-08-21-audit-va-ke-hoach-giao-dien-vong-4.md` | Lần chạm file kế hoạch kế tiếp |
| **N20** | Mục lục `Main.dc.html` có 5 mục nhưng 5 neo chết (`href="#"`), tiêu đề thân bài không có `id`. `06` §3 đòi "neo vào từng cái". Cần: Design gắn `id` cho tiêu đề và trỏ neo, hoặc `06` nói rõ mockup được để neo trống | tb | `docs/design/vong4/Main.dc.html:177-181` | Chặng dựng lại mockup (vòng 5) hoặc một sửa nhỏ trước đó |
| **N21** | Chồng lấn `06` tự đánh dấu ⚠️ và chưa gỡ: hàng "Dải liên quan" (§3) và bốn hàng rollup có tên riêng (§4.3, §4.11, §4.12) mô tả cùng một khối render. Gộp hay giữ tách là quyết định của chủ dự án — QA **không** chọn bên | tb | `06-BINDING_MAP.md:90, 168, 247, 261, 262` | Chủ dự án chốt, rồi `06` v2.3 |

Sáu nợ **N3, N4, N11, N13, N14, N15** của các vòng trước: QA xác nhận **đã đóng ở tầng đặc tả** đúng như `QĐ-2026-08-22-05` chốt, trừ phần dư ghi ở N16/N17/N21 trên đây. Các nợ **N1, N2, N5–N10, N12** không thuộc phạm vi vòng này, giữ nguyên.

---

## Checklist tiêu chí đậu (mục G của `08-QA_CHECKLIST.md`)

- [x] **0 lỗi mức Cao** — kiểm sáu việc được giao, không phát hiện lỗi chặn cổng.
- [x] **Mọi lỗi Trung bình đã sửa hoặc ghi phiếu nợ có ID** — 6/6 lỗi Trung bình (F1–F6) đều có phiếu nợ N16–N21.
- [x] **4 mockup hiện tại đều có mặt trong báo cáo** — vòng này là vòng xác minh ngắn, không rà lại toàn bộ; bốn mockup của đợt 4B đã có mặt đầy đủ ở báo cáo vòng 1–3 tại cùng thư mục. Vòng này kiểm và ghi tên: `Tour.dc.html`, `DiaDanh.dc.html`, `Main.dc.html`, `XemThu.dc.html` (artboard mới) — tức toàn bộ mockup có thay đổi trong `e4e1d8a..HEAD`.
- [x] **Báo cáo có chữ ký của QA agent** — xem cuối file.

**Tiêu chí trượt** (bất kỳ lỗi Cao nào chưa sửa) — **không kích hoạt**.

---

## Ghi chú ngoài phạm vi (không tính vào bảng lỗi)

- `docs/specs/SPEC-2026-08-22-be-mat-vong-5.md` là đề xuất cho `06` **v2.3**, không phải hiện vật của cổng QA1 đợt 4B. Đã đọc lướt để kiểm va chạm: §0 đã tự đổi tên "Luật 4" thành "Luật 5" cho khỏi trùng số với Luật 4 mới của v2.2, và đã đo lại trùng vùng ở tầng field theo N11 — hai chỗ này **không mâu thuẫn** với `06` v2.2.
- `prefers-reduced-motion` vẫn vắng ở 11/11 mockup — đã là nợ **N8** từ vòng 1, không lặp lại ở đây.
- Không mockup nào có dòng credit ảnh (`08` mục C1). Đây là hệ quả của override 2026-06-30 trong `01` (`imageProvenance` là dữ liệu nội bộ tùy chọn, ẩn khỏi layout biên tập, ra khỏi gate I12) — nhất quán trên cả 11 file, không phải lỗi mới.

---

*QA agent: Claude (vai QA độc lập, phiên 2026-08-22, vòng 4). Timestamp báo cáo: 2026-08-22. Hiện vật kiểm ở commit `effae7f` (so với mốc `e4e1d8a`). Báo cáo này không sửa bất kỳ file nào ngoài chính nó — không chạm mockup, không chạm đặc tả, không commit.*
