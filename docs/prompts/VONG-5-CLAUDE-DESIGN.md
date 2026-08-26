# Prompt bàn giao — Vòng 5: Claude Design

> **Cách dùng:** mở một phiên Claude mới tại thư mục `tourdaovn`, dán toàn bộ nội dung từ
> dòng `---BẮT ĐẦU PROMPT---` trở xuống.
>
> **Soạn:** Cowork, 2026-08-23. **Cập nhật 2026-08-24** sau khi `06` lên **v2.3.1**
> (`QĐ-2026-08-23-02` + `QĐ-2026-08-24-01`) — **cả hai chặng nay đều mở**.
>
> **Sửa lần 2, 2026-08-24 (`QĐ-2026-08-24-02`), sau tự kiểm P1–P6:** bản trước tự tuyên bố
> ràng buộc R8 của spec "đã hết hiệu lực" rồi chiếm chỗ R8 — prompt không có thẩm quyền huỷ
> ràng buộc cứng của spec. Đã sửa ở tầng đúng: R8 **thu hẹp** trong spec, nội dung cũ thành
> **R9**. Cùng lượt: sửa bảng kho nội dung (ba dòng sai, tổng không khớp), sửa mốc thư mục
> font (sai đơn vị), thêm cổng ra chặng 2, thêm câu chặn mơ hồ, và **thêm khối P1–P6 ở cuối**.
>
> **Nơi đặt trong kho:** `docs/prompts/VONG-5-CLAUDE-DESIGN.md`

---BẮT ĐẦU PROMPT---

# Vai của anh: Design (bước 7)

Anh làm **bề mặt**. Xuất mockup và **đề xuất** token. Anh **không** viết code sản phẩm, không
quyết kiến trúc, không chạm dữ liệu, không sửa đặc tả.

## Việc này chia hai chặng, có cổng ở giữa

Cả hai chặng đều đã mở. Nhưng **làm chặng 1 trước, dừng lại, báo, chờ chủ dự án chốt chữ và
màu** — rồi mới sang chặng 2. Lý do ở cuối prompt, và nó là lý do quan trọng nhất trong này.

Đọc hết cả hai chặng trước khi bắt đầu.

## Đọc trước khi làm, theo thứ tự

1. `docs/specs/SPEC-2026-08-22-be-mat-vong-5.md` — **quan trọng nhất**. §1 nói vì sao vòng 3
   đã thử và chưa đủ; §3 là sáu quyết định chủ dự án đã chốt; §6 là hình dạng việc của anh;
   §7 là ràng buộc.
2. `docs/core-specs/07-DESIGN_TOKENS.md` — bộ token hiện hành, gồm **§1b: ba bộ giao diện
   chọn được**. Lưu ý §2 đang **lệch** so với mã đang chạy — xem "Ba drift" bên dưới.
3. `src/styles/tokens.css` — token chạy thật. Đây mới là sự thật; `07` là bản mô tả.
4. `docs/core-specs/06-BINDING_MAP.md` **v2.3.1** — §3, §3.1 và §6. Cần cho **cả hai** chặng: v2.3.1 đổi thứ có mặt trên chính màn hình tham chiếu của chặng 1.
5. `docs/core-specs/00-PROJECT_BRIEF.md` mục 6 — ngưỡng Lighthouse, LCP, WCAG.
6. `docs/design/vong4/` — canvas vòng 4, sáu artboard đã qua QA1. Chặng 2 dựng lại từ đây.
7. `docs/design-context/COMPONENT_INVENTORY.md` — **danh sách 61 component đang có và props
   của chúng**, sinh tự động từ code (`npm run gen:design-context`, chạy lại 2026-08-24).
   Đọc để biết bề mặt nào **đã có sẵn** thay vì vẽ lại từ đầu. Nếu anh định đề xuất một khối
   mới, tra ở đây trước xem nó đã tồn tại dưới tên khác chưa.
8. `docs/design-context/DESIGN_SURFACE_MAP.md` — file nào quyết định hiển thị, chia bốn tầng
   (token · cấu trúc · chữ nghĩa · đặc tả và cổng kiểm). Cần khi anh phải nói **đề xuất của
   mình rơi vào file nào**. Đặc biệt mục 3: nhãn CTA có **hai nguồn**, và hạng mục 12 phải
   nói rõ đổi cái nào.

## Bối cảnh

**Công ty TNHH Tour Đảo** bán tour biển đảo Nha Trang. Đặt chỗ **qua Zalo**, không giỏ hàng,
không thanh toán trên site.

**Kho nội dung hiện tại — đã khác hẳn các vòng trước.** Đo trên bản dựng `dist/` **2026-08-24
09:37** (sau `d31eef3`). Trang term tách ra bằng dấu hiệu JSON-LD `"@type":"DefinedTerm"`, nên
bảng này là **trang chi tiết entity**, không lẫn trang danh mục:

| Loại | Trang chi tiết |
|---|---|
| Điểm tham quan | **36** |
| Tour | **23** |
| Cẩm nang | 15 |
| Trải nghiệm | **9** |
| Địa danh | 7 |
| Khách sạn | 6 |
| Tác giả | 3 |
| Công ty | 3 |
| **Tổng trang chi tiết** | **102** |

Cộng **11 trang term** (9 dưới `/tour/`, 2 dưới `/trai-nghiem/`) và các trang index nhánh, hub,
tĩnh → **128** `index.html` trong `dist/`.

**Ràng buộc "dữ liệu mỏng" nay thu hẹp, không mất** (`QĐ-2026-08-24-02`). Các prompt vòng
trước mang câu *"dữ liệu RẤT MỎNG, mọi khối phải trông tử tế với 1 mục"*. Hồi đó kho có **1**
tour; nay có **23**, và Điểm tham quan có **36** — với hai nhánh này lưới ba thẻ không còn
nguy cơ để một thẻ lẻ loi, nên anh **được** lấy 3 thẻ một hàng làm mặc định.

Nhưng kho **không dày đều**, và đây là chỗ ràng buộc cũ vẫn sống (xem **R8**):

- `/resort/` là index nhánh có **0** entity — một dải rỗng hoàn toàn vẫn đang được dựng.
- Khách sạn **6**, Địa danh **7**, Trải nghiệm **9** — chưa đầy một lưới ba cột hai hàng.
- Các dải sinh từ truy vấn liên quan — **Gần đây**, **Trải nghiệm tại đây**, **Dải liên quan**
  — có số mục phụ thuộc dữ liệu **từng trang**, không phụ thuộc tổng kho. Một Địa danh vẫn có
  thể chỉ có 1 mục lân cận.

## Vì sao có vòng 5, và vì sao nó khác vòng 3

Chủ dự án nêu **bốn** việc (spec §1). Chúng chia cho ba vai, và **cả bốn đều có mặt trong
prompt này** — đừng đọc phần dưới như thể chỉ có ba:

| # | Chủ dự án nêu | Đi đâu |
|---|---|---|
| 1 | Phông chữ, bộ cỡ, màu hợp trang du lịch | **Chặng 1** — cả ba artboard |
| 2 | Mô tả không nằm trong hero, đưa xuống dưới | **Chặng 2** — `06` v2.3 đoạn mở rời hero |
| 3 | Ưu tiên di động: cột trên desktop → hàng trên di động | **Chặng 2** — Luật 5 |
| 4 | Rà trùng lặp ánh xạ (Chùa Long Sơn nhiều mức giá miễn phí) | **Code**, đã xong ở `06` v2.3.1 — anh chỉ cần **không vẽ lại vùng giá** trên trang miễn phí |

Phần còn lại của mục này nói về **ý (1)**. Chủ dự án tách nó thành ba triệu chứng (spec §3.3):
**chữ không hợp ngành du lịch · cỡ chữ lộn xộn, phân cấp mờ · màu chưa ra chất du lịch.**

Đúng ba triệu chứng đó đã được nêu và đã được xử một lần rồi, tám ngày trước, ở
`SPEC-2026-08-14-be-mat-vong-3`. Vòng đó chọn hướng **đóng khung** và ghi rõ lý do loại các
hướng rộng hơn:

- **Bộ chữ mới hoàn toàn** — loại vì *"thêm bộ chữ thứ ba, phải tự lưu trữ, phải soi kỹ dấu
  tiếng Việt ở cỡ nhỏ"*
- **Đổi trục màu** — loại vì *"phải sửa nhiều mã trong `tokens.css`"*; vòng đó chốt
  *"không thêm và không đổi một mã hex nào"*, chỉ tăng **diện tích** màu

Nó đã thi hành. Rồi chủ dự án nêu lại y hệt.

**Kết luận rút ra, và đây là giấy phép của anh:** hướng đóng khung đã chạy hết và chưa giải
được vấn đề. Vòng 5 được phép mở đúng ba cánh cửa mà vòng 3 đóng lại — **ứng viên chữ mới,
thang cỡ dựng lại từ đầu, và sửa mã hex** — nhưng mở **kèm bằng chứng**, không mở tự do.

## Ba drift anh phải biết trước khi đề xuất

**1. `07` §2 mô tả sai bộ chữ đang chạy.**

`07` §2 khai `font.family.heading` = `"Nunito", "Be Vietnam Pro", …`. `src/styles/tokens.css`
chạy **ngược lại**:

```css
--font-display: "Be Vietnam Pro", "Nunito", system-ui, sans-serif;
--font-ui:      "Nunito", "Be Vietnam Pro", system-ui, sans-serif;
```

Nguồn: `SPEC-2026-08-14-be-mat-vong-3` §3.1 đảo thứ tự **có chủ ý và đúng**, nhưng `07` chưa
cập nhật theo. Nên thực tế hôm nay: **tiêu đề là Be Vietnam Pro** (chỉ có cấp 700/800),
**thân bài là Nunito** (biến thiên 400–800).

Tổng thư mục font, **đo lại 2026-08-24** (`QĐ-2026-08-24-02`): 6 file `.woff2`, **89.196 byte
payload = 87,1 KB**. Ghi rõ đơn vị vì nó quyết định R4 chấm được hay không — `du -sh
public/fonts` trả `108K`, nhưng đó là dung lượng đĩa sau khi làm tròn theo block, **không**
phải payload. Bản trước của prompt này lấy nhầm số `du` làm mốc; mọi so sánh của anh phải là
**byte payload đấu byte payload**.

| File | Byte |
|---|---|
| `nunito-latin-viet-var.woff2` | 39.152 |
| `nunito-vietnamese-var.woff2` | 13.040 |
| `be-vietnam-pro-latin-viet-800.woff2` | 13.380 |
| `be-vietnam-pro-latin-viet-700.woff2` | 13.348 |
| `be-vietnam-pro-vietnamese-800.woff2` | 5.144 |
| `be-vietnam-pro-vietnamese-700.woff2` | 5.132 |
| **Tổng** | **89.196** |

Con số **~104 KB** ghi ở `07` §2 và `QĐ-2026-08-06-11` là bản ghi của thời điểm đó, giữ nguyên
làm lịch sử — đừng dùng nó làm mốc so.

**2. Thang cỡ chạy thật có 14 bậc, `07` khai 8.**

Chạy thật: `11 · 12 · 14 · 15 · 17 · 18 · 20 · 21 · 26 · 32 · 40 · 42 · 46 · 60`.
Năm bậc nằm trong khoảng 15–21px. Đây là căn cứ đo được cho than phiền "phân cấp mờ" — và
vòng 3 đã cố giãn nó một lần rồi mà vẫn còn năm bậc chen trong 6px.

**3. Nợ chưa đóng: chưa đo LCP sau ba lần đổi chữ.**

Be Vietnam Pro → Lora → Nunito (hai quyết định trong cùng ngày 2026-08-06) → đảo vai
(2026-08-14). `07` §2 ghi rõ nợ này. Đề xuất bộ chữ thứ tư mà không đóng nợ là chồng nợ.

---

# CHẶNG 1 — Quyết bề mặt

Ba artboard. **Không** đụng tới sáu trang chi tiết.

### Artboard 1 — Ba ứng viên chữ

Dựng **cùng một màn hình** ba lần, ba bộ chữ khác nhau.

- Màn hình: **Chùa Long Sơn** (`/diem-tham-quan/chua-long-son/`). Chọn trang này vì chủ dự án
  đã nêu đích danh nó, và vì nó có nhiều vùng: breadcrumb, hero, đoạn mở, Thông tin nhanh,
  thanh dính, thân bài, bản đồ.
- **Nhưng nó KHÔNG có vùng giá, và đó là có chủ ý.** `06` v2.3.1 (`QĐ-2026-08-24-01`) chốt:
  điểm tham quan miễn phí thì nhãn "Miễn phí" hiện **đúng một lần ở Thông tin nhanh**, không
  thanh dính giá, không khối hành động giá. Đừng vẽ vùng giá lên màn hình này.
- **Ảnh thật lấy từ Sanity của chính trang đó.** Không ô kẻ chéo.
- **Chữ thật của chính bài đó.** Không chữ giả, không Lorem. Tên riêng và dấu tiếng Việt là
  thứ đang được đánh giá — chữ giả sẽ giấu mất chỗ hỏng.
- **Ứng viên A bắt buộc là bộ đang chạy** (Be Vietnam Pro + Nunito), làm mốc so.

Kèm **bảng chi phí**: từng ứng viên, số byte woff2 từng file, tổng payload, chênh so với
**89.196 byte (87,1 KB)** — mốc đo byte payload, không phải `du`. Trần R4 là **140 KB payload**.

### Artboard 2 — Thang cỡ mới

- **Tối đa 8 bậc.** Mỗi bậc gắn **đúng một vai**, ghi rõ vai đó là gì.
- Dựng song song ở **390px và 1280px**.
- Nêu rõ bậc nào trong thang mới thay bậc nào trong 14 bậc hiện có, và bậc nào bị bỏ.

### Artboard 3 — Ba bộ màu

- Sắc độ đề xuất cho cả ba bộ: `bien-sau` (mặc định), `cat-bien`, `ngoc-lam`.

**Một sự thật anh phải biết trước khi làm artboard này, nếu không nó sẽ thiếu mất nửa vấn đề.**

`07` §1 định nghĩa `--c-accent` là màu **chỉ xuất hiện ở vùng hành động và nhãn giá**. Nhưng
đo trên bản dựng thật ngày 2026-08-24: `data/prices.yaml` **toàn chú thích, không có một giá
thật nào**, nên **không trang nào trên site render một con số giá**. Mọi nhãn giá đang hiện
đều là chữ "Miễn phí" — và sau v2.3.1 thì cả những trang đó cũng thôi có vùng giá.

Nghĩa là **màu accent hiện không đánh giá được từ dữ liệu thật**, dù nó là màu mang tính
quyết định nhất của bộ (nó là màu ấm duy nhất trên nền lạnh, theo `07` §0 mục 1).

Nên artboard này phải có thêm **một khối giá + CTA dựng bằng giá MẪU**, đánh dấu rõ là mẫu
theo đúng quy ước canvas vòng 4 (`data-placeholder`, và ghi chú nói rõ con số là tham khảo).
Không có nó thì anh đang chọn màu mà không nhìn thấy chỗ màu đó sống.

- Kèm **bảng WCAG AA bốn cặp × ba bộ**: chữ chính trên nền, chữ mờ trên nền, chữ trắng trên
  `primary`, chữ trắng trên `accent`. Tất cả phải ≥ 4.5.

**Rồi dừng lại và báo.** Chủ dự án chốt chữ, thang, màu. Chặng 2 làm sau đó.

---

# CHẶNG 2 — Áp vào trang

**Tám artboard**: bốn entity × desktop 1280 + di động 390.

| Entity | Desktop | Di động |
|---|---|---|
| Điểm tham quan | dựng lại từ `Main.dc.html` | dựng lại từ `DiDong.dc.html` |
| Tour | dựng lại từ `Tour.dc.html` | dựng lại từ `TourDiDong.dc.html` |
| Địa danh | dựng lại từ `DiaDanh.dc.html` | **mới — chưa từng có** |
| Trải nghiệm | dựng lại từ `TraiNghiem.dc.html` | **mới — chưa từng có** |

Hai bản di động cuối là mới hoàn toàn. Yêu cầu của chủ dự án là **ưu tiên di động**, mà hai
entity đó chưa từng được vẽ ở 390px — nên đừng coi chúng là phụ.

## Ba thay đổi đặc tả mới ở `06` v2.3.x mà chặng 2 phải theo

Đây là điều `06` v2.2 chưa nói và v2.3 vừa chốt (`QĐ-2026-08-23-02`, duyệt 2026-08-24). Đọc
thẳng §3 và §6 của `06`; dưới đây là bản tóm.

**1. Đoạn mở rời hero.** `summary` nay nằm trên **dải sáng dưới hero, sau thanh dính**, trên
Thông tin nhanh — **không còn đè lên ảnh**. Hero còn **huy hiệu loại + h1**.

Lý do: chữ trên ảnh buộc phải canh lớp phủ theo từng ảnh; QA1 đợt 4B đo tương phản đoạn mở
trên ảnh là **6,6:1** ở bộ `ngoc-lam` — đạt AA nhưng mong manh. Xuống dải sáng thì rủi ro đó
biến mất, và anh không phải thiết kế lớp phủ cho từng bức ảnh nữa.

Thứ tự khối di động ở §3.1 nay là: **hero → thanh đáy → đoạn mở → Thông tin nhanh → nội dung**.

**2. Miễn phí không phải một mức giá (v2.3.1).** Điểm tham quan có `isAccessibleForFree` =
true thì nhãn "Miễn phí" hiện **đúng một lần ở Thông tin nhanh**; **vùng giá không render**.

Lý do ghi trong §3.1: ngoại lệ hai vùng của giá được §6 Luật 1 biện minh bằng *"vì đó là
quyết định mua"* — một điểm tham quan miễn phí không có quyết định mua nào. Đây là **xoá một
ngoại lệ**, không phải thêm: §4.4 đã chọn lối đó cho Trải nghiệm và §4.2 cho Địa danh từ
trước; Điểm tham quan là entity duy nhất đi kiểu khác.

**Một việc chưa quyết, thuộc bước 7 — tức thuộc anh.** Trang miễn phí hiện vẫn render nút
**"Đặt vé"** trỏ Zalo: một nút đặt vé trên một ngôi chùa miễn phí. Gỡ vùng giá không tự gỡ
nút đó. Nút liên hệ Zalo vẫn có giá trị, nhưng **nhãn phải đổi** — liên hệ, hỏi đường, hay
gì đó đúng hơn. Đề xuất chữ và vị trí cho nó; chủ dự án chốt.

Đây là **hạng mục giao nộp thứ mười hai**, đã vào spec §6 theo `QĐ-2026-08-24-02`. Ba biên của
đề xuất — đọc trước khi vẽ, vì thiếu chúng thì đề xuất sẽ trượt R7 hoặc Luật 3:

- Nhãn **"Đặt vé" bị loại** trên trang miễn phí. Không có vé để đặt.
- `06` §6 **Luật 3** cấm *"nút thay thế trỏ về chính site"* khi không có giá. Nút Zalo trỏ
  **ra ngoài** site nên **không** vướng Luật 3. Nhưng nếu anh đề xuất một nút trỏ về trang
  khác của tourdao.vn thì nó vướng — đừng đề xuất.
- **R7** cấm CTA giả. Nút phải dẫn tới một hành động có thật (mở Zalo), không phải một nút
  trang trí để cân bố cục sau khi vùng giá biến mất.

**3. Luật 5 — ô cạnh nhau trên desktop, mỗi ô một hàng trên di động.**

> Mọi vùng trình bày nhiều ô ngang hàng ở desktop — Thông tin nhanh, khối hành động, dòng
> meta, thẻ thông tin — ở `≤ 640px` chuyển thành **mỗi ô một hàng chiếm hết bề rộng**. Cấm
> bóp cột: không ô nào được hẹp hơn 100% bề rộng vùng chứa.
>
> **Trong một hàng, chọn kiểu theo độ dài giá trị.** Giá trị vừa một dòng thì **nhãn trái,
> giá trị phải**. Giá trị dài quá một dòng thì **nhãn trên, giá trị full-width bên dưới**, vì
> chia đôi hàng sẽ bóp giá trị lại đúng thứ luật này định gỡ.
>
> **Loại trừ: lưới thẻ không thuộc luật này.** Thẻ Tour, Gần đây, Trải nghiệm tại đây mang
> ảnh và tiêu đề, không phải cặp nhãn/giá trị. Chúng xếp chồng dọc, mỗi thẻ một khối.

**Số đo đứng sau luật này**, đo trên 272 ô của bản dựng thật — dùng nó để quyết bố cục thay
vì ước lượng:

| | |
|---|---|
| Độ dài trung vị | **13 ký tự** |
| Ô dài quá 20 ký tự | **75/272 — 28%** |
| Dài nhất | `address` **78 ký tự**, `touristType` 44 |
| Bề rộng một ô ở lưới 2 cột, 390px | ~170px ≈ 20–24 ký tự |

Nghĩa là **72% số ô vốn đã vừa khít lưới 2 cột** — luật này tồn tại cho 28% còn lại và cho ô
địa chỉ. Đừng thiết kế như thể mọi ô đều dài.

## Ranh giới phạm vi

**Token áp toàn site; bố cục chỉ đụng trang chi tiết entity.**

Đổi bộ chữ thì trang chủ, header, footer đổi theo — không tránh được, vì `07` là nguồn duy
nhất. Nhưng anh **không** vẽ lại bố cục trang chủ, header, hay footer trong vòng này. Ba thứ
đó vừa qua đợt riêng ngày 2026-08-14.

## Ràng buộc cứng — vi phạm là trượt QA1

| # | Ràng buộc |
|---|---|
| **R1** | **Không tạo nguồn token thứ hai.** Giá trị mới là **đề xuất trong bảng**, không viết thẳng vào `tokens.css`, không hardcode màu vào mockup |
| **R2** | **Cả ba bộ giao diện phải cùng dùng được.** Sửa sắc độ thì sửa cho cả ba. Bố cục chỉ đẹp với nền trắng mà vỡ với nền kem là bố cục sai |
| **R3** | **WCAG AA ≥ 4,5** ở bốn cặp × ba bộ. `--c-sand` **cấm** làm nền cho chữ trắng (chỉ đạt 3,28). Kiểm bằng `npm --prefix scripts run check:theme` |
| **R4** | Font mới phải **self-host được**, đủ subset `vietnamese` + `latin`, ghi số byte woff2 từng file. **Trần: tổng payload `.woff2` ≤ 140 KB** (mốc trước đợt đổi chữ). Nay đang **89.196 byte = 87,1 KB** trên 6 file. Mốc và trần đều tính bằng **byte payload**, không phải `du` |
| **R5** | Kèm **điều kiện đo LCP trước khi lên live** (LCP ≤ 2500 ms, Lighthouse mobile ≥ 90). Đây là cách đóng nợ đang treo ở `07` §2 |
| **R6** | **Luật 1 của `06`: một thông tin, một vùng, một lần.** Mockup lặp field ra hai vùng là trượt — trừ giá (thanh dính + khối hành động). Nay có bộ kiểm máy: `scripts/validators/luat1-post.ts` |
| **R7** | **Vùng rỗng ẩn hẳn.** Không placeholder, không khung trống, **không CTA giả** |
| **R8** | **Khối có số mục phụ thuộc dữ liệu phải tử tế với 1 mục.** Áp cho mọi dải/lưới sinh từ truy vấn liên quan (Gần đây, Trải nghiệm tại đây, Dải liên quan) và mọi listing của nhánh dưới 12 entity (Khách sạn 6, Địa danh 7, Trải nghiệm 9, **Resort 0**). **Không** còn áp cho lưới thẻ Tour và Điểm tham quan. Ít mục thì **thu khối lại** cho tử tế; đi cùng R7, **không** độn placeholder cho đầy hàng |
| **R9** | **Không đổi một field nào của `01-CONTENT_MODEL`**, không sửa `06`, không sửa `07`. Anh **đề xuất**; Cowork ghi vào đặc tả sau khi chủ dự án duyệt |

## Điều anh KHÔNG được làm

**Cấm tự quyết định kiến trúc. Gặp mơ hồ → DỪNG, hỏi.** Câu này áp cho mọi chỗ trong prompt,
không riêng ca field/vùng ở dưới. Nếu spec, `06`, `07` hay prompt này không nói đủ để anh làm
mà không đoán — đừng đoán, đừng chọn cái "hợp lý nhất", đừng lấp bằng quy ước của dự án khác.
Dừng lại, nêu đang thiếu gì, hỏi.

- Không sửa bất kỳ file nào trong `docs/core-specs/`.
- Không sửa `src/styles/tokens.css` hay bất kỳ file nào trong `src/`.
- Không dùng chữ giả hay ô kẻ chéo ở chặng 1 — cả chặng 1 tồn tại để nhìn thấy sự thật.
- Không đề xuất thêm bộ giao diện thứ tư.
- Không tự chọn vùng cho một field mà `06` chưa khai. Gặp thì **dừng và hỏi**.
- Không gộp `departureNote` với `tripOrigin` — §3.1 khai chúng là **hai field khác nhau** ở
  hai vùng khác nhau, dù trên nhiều trang chúng mang cùng một chuỗi.

## Hai cổng — anh dừng ở đâu, ai mở

| Cổng | Sau việc gì | Ai mở | Anh làm gì |
|---|---|---|---|
| **Cổng giữa** | Xong 3 artboard chặng 1 | **Chủ dự án** chốt chữ, thang cỡ, màu | Dừng hẳn, báo, **chờ**. Không tự sang chặng 2 |
| **QA1 vòng 5** | Xong 8 artboard + hạng mục 12 của chặng 2 | **Tác nhân QA độc lập** chạy (spec §4, V4), rồi chủ dự án chốt | Nộp kèm bằng chứng ở mục "Giao nộp". Anh **không** tự tuyên bố mình đạt |

Hai điều về cổng QA1, vì chúng quyết định anh soạn bằng chứng thế nào:

- **Người kiểm không phải anh, và không nhận lời tự khai làm bằng chứng** (`GOVERNANCE` 5.1).
  Câu "đã kiểm tương phản rồi" không tính; bảng số đo kèm lệnh đã chạy mới tính.
- **Im lặng là trượt.** Mục nào trong R1–R9 anh không đưa được bằng chứng thì mục đó trượt,
  không phải "coi như đạt vì không ai phản đối".

## Giao nộp

Mỗi output kèm tối thiểu:

- Mockup hoặc token đã tạo.
- Liên hệ về `07-DESIGN_TOKENS` (chặng 1) hoặc **bảng đối chiếu vùng ↔ dòng nào trong `06`
  v2.3** (chặng 2). Vùng không đối chiếu được là vùng phải bỏ.
- Điểm nào cần chủ dự án duyệt thẩm mỹ.
- Với mọi đề xuất token: **giá trị cũ → giá trị mới → lý do**, dạng bảng.

## Một lời cuối về cách làm — đọc kỹ chỗ này

Vòng 3 chốt giá trị token **trên bảng số** rồi mới dựng. Chủ dự án nhìn bản thật thì không
ưng, và tám ngày sau nêu lại đúng ba than phiền cũ. Đó là lý do vòng 5 tồn tại.

Chặng 1 tồn tại để đảo thứ tự đó: **dựng bằng ảnh thật và chữ thật trước, chốt sau.** Cổng
giữa hai chặng cũng vì thế — chốt chữ trên một màn hình rồi mới trả giá cho tám artboard,
thay vì dựng 8 × 3 bản rồi vứt đi phần lớn.

Nếu anh thấy mình đang đề xuất một con số mà chưa dựng ra để nhìn — đó là lúc dừng lại và
dựng.

---KẾT THÚC PROMPT---

---

# Khối QA prompt — P1–P6

> Đặt **sau** `---KẾT THÚC PROMPT---` có chủ ý: đây là bằng chứng **về** prompt, không phải
> thứ Design phải đọc. Vẫn nằm trong cùng file theo `PROMPT_FACTORY` §7 (*"khối QA là một phần
> của prompt — không phải file riêng"*), chỉ không nằm trong phần được dán đi.
>
> **Người chạy:** Cowork · **Ngày:** 2026-08-24 · **Bản được chấm:** sau sửa lần 2
> (`QĐ-2026-08-24-02`) · **Cổng:** spec §4, V3

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| **P1 — Đầu vào đủ** | ✅ *(lượt 1 chấm nhầm ✅ khi đang thiếu — xem ghi chú dưới bảng)* | **Tám** đầu vào có thứ tự, mỗi cái trỏ **section cụ thể** (spec §1/§3/§6/§7; `07` §1b/§2; `06` §3/§3.1/§6; `00` mục 6), không có câu "đọc những gì liên quan". Đã kiểm cả sáu đường dẫn tồn tại. **Ba dữ kiện sai của bản trước đã sửa:** bảng kho nội dung (3 dòng sai + tổng 123 không khớp tổng dòng và không truy được nguồn) nay đo lại trên `dist/` 2026-08-24 09:37 kèm phương pháp tách trang term; mốc thư mục font (108 KB — số `du`, sai đơn vị so với chính R4) nay là **89.196 byte payload** kèm bảng 6 file |
| **P2 — Ràng buộc cứng** | ✅ | R1–R9 khớp 1:1 với spec §7 sau `QĐ-2026-08-24-02`. Mỗi R truy được: R1→`07` mở đầu + `CLAUDE.md` §5; R2→`07` §1b; R3→`07` §1 + `04-CONSTRAINTS` §3; R4→`07` §2 + QĐ mới; R5→`00` §6; R6→`06` §6 Luật 1; R7→`06` quyết định nền 2–3; R8→`00` + QĐ mới; R9→`CLAUDE.md` §3 |
| **P3 — Phạm vi rõ** | ✅ | "Ranh giới phạm vi" tách token (toàn site) khỏi bố cục (chỉ trang chi tiết entity); mục "Điều anh KHÔNG được làm" liệt kê 6 điều cấm cụ thể; hai chặng có bảng hạng mục đếm được (3 + 8 + 1). Không có câu "làm thêm nếu thấy cần". Hạng mục thứ 12 (nhãn nút trang miễn phí) trước đây là phạm vi nở ra ngoài spec §6 — nay đã vào spec §6 theo QĐ mới, kèm ba biên (Luật 3, R7, loại nhãn "Đặt vé") |
| **P4 — Cấm tự quyết** | ✅ | Câu chặn chung *"Cấm tự quyết định kiến trúc. Gặp mơ hồ → DỪNG, hỏi"* mở đầu mục "Điều anh KHÔNG được làm", ghi rõ áp cho mọi chỗ. Bản trước chỉ có bản hẹp một ca (field chưa khai vùng) — ca đó vẫn giữ làm ví dụ cụ thể |
| **P5 — Cổng ra** | ✅ | Mục "Hai cổng" khai đủ hai cổng, ai mở, Design làm gì. Cổng giữa: chủ dự án chốt chữ/thang/màu, Design **chờ**. QA1 vòng 5: **tác nhân độc lập** chạy (spec §4, V4) — bản trước không nhắc ai chạy. Kèm hai câu của `GOVERNANCE` 5.1: không nhận lời tự khai, im lặng là trượt |
| **P6 — Không tạo luật** | ✅ | Prompt không còn tạo, đổi, hay huỷ ràng buộc nào. **Đây là mục trượt của bản trước:** nó tuyên bố R8 của spec "đã hết hiệu lực" rồi thay bằng nội dung khác, tạo hai bảng R1–R8 khác nhau cho cùng cổng QA1 (`CLAUDE.md` §5, nguồn sự thật thứ hai). Đã xử ở tầng đúng: sửa spec §7 qua `QĐ-2026-08-24-02`, prompt chép lại. Trích dẫn Luật 5 đã đối chiếu nguyên văn `06` §6 dòng 383–387 — khớp, kể cả mục loại trừ lưới thẻ và số đo 272 ô |

**Ghi chú P1 — lượt kiểm thứ nhất chấm sai, ghi lại thay vì sửa lặng.** Lượt 1 (2026-08-24)
chấm P1 ✅ với sáu đầu vào. Sai: prompt **thiếu `docs/design-context/COMPONENT_INVENTORY.md`**,
mà chú thích trong `scripts/gen-component-inventory.mjs` khai đúng chữ rằng file đó *"là đầu
vào **bắt buộc** của prompt giao cho Claude Design"*. Người kiểm đối chiếu danh sách đọc với
spec §6 — nơi không liệt kê đầu vào — nên không thấy thiếu. **Bài học cho lượt sau: P1 phải
đối chiếu với những gì tồn tại trong `docs/design-context/`, không chỉ với những gì spec nhắc.**

Phát hiện khi quét kho trả lời một câu hỏi khác của chủ dự án. Đã sửa: thêm mục 7 và 8 vào
danh sách đọc, và **sinh lại `COMPONENT_INVENTORY.md`** — bản trong kho đã lệch 179 dòng thêm /
34 dòng xoá so với code, vì `FactStrip` đổi ngày 23/08 mà chưa ai chạy lại script.

**Kết luận P1–P6: ĐẠT 6/6** (sau khi vá P1).

## Hai blocker của spec §4 — cả hai đã xong

Spec §4 khai V3 (prompt này) **chặn bởi V1 + V2**. Chấm riêng:

| Blocker | Trạng thái | Bằng chứng |
|---|---|---|
| **V2** — `06-BINDING_MAP` v2.3 | ✅ xong | `06` v2.3.1, `QĐ-2026-08-23-02` + `QĐ-2026-08-24-01` |
| **V1** — hai phiếu drift (font-stack ngược §2.2, thang 14 bậc vs 8 bậc khai §2.3) ghi vào `DRIFT_LOG.md` | ✅ xong 2026-08-24 | **DR-050** (bộ chữ) và **DR-051** (thang cỡ) |

Trước 2026-08-24 mục này trượt: hai dữ kiện drift chỉ sống trong mục "Ba drift" của chính
prompt này, mà prompt là **artifact lịch sử** (`PROMPT_FACTORY` §6), không phải sổ drift —
`CLAUDE.md` §8 bắt ghi drift lại chứ không âm thầm chọn một bên. Nay đã có vết riêng, và cả
hai phiếu đều khai **"đóng khi nào"** trỏ về V5, nên vòng 5 đổi chữ xong thì `07` §2 có đường
để đóng thay vì trôi.

Hai phiếu ghi rõ chúng **không** phát hiện lại thứ `DR-002` đã ghi (badge 11 vs 12px, bậc 22
không tồn tại); cái mới là **phép cộng** — 14 giá trị phân biệt trên 15 token, và **năm bậc
chen trong 6px** sau khi vòng 3 đã giãn một lần. DR-050 còn ghi chéo rằng nó làm một dòng
"Khớp đúng" của DR-002 (*"hai font family"*) hết đúng kể từ 2026-08-14.

**Kết luận cổng V3: ĐỦ ĐIỀU KIỆN MỞ.** P1–P6 đạt 6/6, V1 và V2 đều xong. Phần còn lại là
việc của chủ dự án: bàn giao prompt cho Design.
