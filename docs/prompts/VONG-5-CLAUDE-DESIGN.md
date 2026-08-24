# Prompt bàn giao — Vòng 5: Claude Design

> **Cách dùng:** mở một phiên Claude mới tại thư mục `tourdaovn`, dán toàn bộ nội dung từ
> dòng `---BẮT ĐẦU PROMPT---` trở xuống.
>
> **Soạn:** Cowork, 2026-08-23. **Cập nhật 2026-08-24** sau khi `06` lên v2.3.0
> (`QĐ-2026-08-23-02`) — **cả hai chặng nay đều mở**.
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
4. `docs/core-specs/06-BINDING_MAP.md` **v2.3.0** — §3, §3.1 và §6. Cần cho chặng 2.
5. `docs/core-specs/00-PROJECT_BRIEF.md` mục 6 — ngưỡng Lighthouse, LCP, WCAG.
6. `docs/design/vong4/` — canvas vòng 4, sáu artboard đã qua QA1. Chặng 2 dựng lại từ đây.

## Bối cảnh

**Công ty TNHH Tour Đảo** bán tour biển đảo Nha Trang. Đặt chỗ **qua Zalo**, không giỏ hàng,
không thanh toán trên site.

**Kho nội dung hiện tại — đã khác hẳn các vòng trước.** Đo trên bản dựng 2026-08-23:

| Loại | Số trang |
|---|---|
| Điểm tham quan | 34 |
| Tour | **30** |
| Cẩm nang | 15 |
| Trải nghiệm | 10 |
| Địa danh | 7 |
| Khách sạn | 6 |
| Tổng | **123** |

Các prompt vòng trước mang một ràng buộc lớn: *"dữ liệu RẤT MỎNG, mọi khối phải trông tử tế
với 1 mục"*. **Ràng buộc đó đã hết hiệu lực.** Hồi đó kho có 1 tour; nay có 30. Lưới ba thẻ
không còn nguy cơ để một thẻ lẻ loi. Anh vẫn nên xử lý trạng thái ít mục cho tử tế, nhưng
đừng để nó chi phối bố cục như các vòng trước.

## Vì sao có vòng 5, và vì sao nó khác vòng 3

Chủ dự án nêu ba điều: **chữ không hợp ngành du lịch · cỡ chữ lộn xộn, phân cấp mờ · màu chưa
ra chất du lịch.**

Đúng ba điều đó đã được nêu và đã được xử một lần rồi, tám ngày trước, ở
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
**thân bài là Nunito** (biến thiên 400–800). Tổng thư mục font **108 KB**.

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

- Màn hình: **Chùa Long Sơn** (`/diem-tham-quan/chua-long-son/`). Chọn trang này vì nó có đủ
  mọi vùng: breadcrumb, hero, đoạn mở, Thông tin nhanh, thanh dính, thân bài, khối hành động,
  bản đồ.
- **Ảnh thật lấy từ Sanity của chính trang đó.** Không ô kẻ chéo.
- **Chữ thật của chính bài đó.** Không chữ giả, không Lorem. Tên riêng và dấu tiếng Việt là
  thứ đang được đánh giá — chữ giả sẽ giấu mất chỗ hỏng.
- **Ứng viên A bắt buộc là bộ đang chạy** (Be Vietnam Pro + Nunito), làm mốc so.

Kèm **bảng chi phí**: từng ứng viên, số byte woff2 từng file, tổng thư mục, chênh so với 108 KB.

### Artboard 2 — Thang cỡ mới

- **Tối đa 8 bậc.** Mỗi bậc gắn **đúng một vai**, ghi rõ vai đó là gì.
- Dựng song song ở **390px và 1280px**.
- Nêu rõ bậc nào trong thang mới thay bậc nào trong 14 bậc hiện có, và bậc nào bị bỏ.

### Artboard 3 — Ba bộ màu

- Sắc độ đề xuất cho cả ba bộ: `bien-sau` (mặc định), `cat-bien`, `ngoc-lam`.
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

## Hai thay đổi đặc tả mới ở `06` v2.3 mà chặng 2 phải theo

Đây là điều `06` v2.2 chưa nói và v2.3 vừa chốt (`QĐ-2026-08-23-02`, duyệt 2026-08-24). Đọc
thẳng §3 và §6 của `06`; dưới đây là bản tóm.

**1. Đoạn mở rời hero.** `summary` nay nằm trên **dải sáng dưới hero, sau thanh dính**, trên
Thông tin nhanh — **không còn đè lên ảnh**. Hero còn **huy hiệu loại + h1**.

Lý do: chữ trên ảnh buộc phải canh lớp phủ theo từng ảnh; QA1 đợt 4B đo tương phản đoạn mở
trên ảnh là **6,6:1** ở bộ `ngoc-lam` — đạt AA nhưng mong manh. Xuống dải sáng thì rủi ro đó
biến mất, và anh không phải thiết kế lớp phủ cho từng bức ảnh nữa.

Thứ tự khối di động ở §3.1 nay là: **hero → thanh đáy → đoạn mở → Thông tin nhanh → nội dung**.

**2. Luật 5 — ô cạnh nhau trên desktop, mỗi ô một hàng trên di động.**

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
| **R4** | Font mới phải **self-host được**, đủ subset `vietnamese` + `latin`, ghi số byte woff2 từng file. **Trần: tổng thư mục font ≤ 140 KB** (mốc trước đợt đổi chữ; nay 108 KB) |
| **R5** | Kèm **điều kiện đo LCP trước khi lên live** (LCP ≤ 2500 ms, Lighthouse mobile ≥ 90). Đây là cách đóng nợ đang treo ở `07` §2 |
| **R6** | **Luật 1 của `06`: một thông tin, một vùng, một lần.** Mockup lặp field ra hai vùng là trượt — trừ giá (thanh dính + khối hành động). Nay có bộ kiểm máy: `scripts/validators/luat1-post.ts` |
| **R7** | **Vùng rỗng ẩn hẳn.** Không placeholder, không khung trống, **không CTA giả** |
| **R8** | **Không đổi một field nào của `01-CONTENT_MODEL`**, không sửa `06`, không sửa `07`. Anh **đề xuất**; Cowork ghi vào đặc tả sau khi chủ dự án duyệt |

## Điều anh KHÔNG được làm

- Không sửa bất kỳ file nào trong `docs/core-specs/`.
- Không sửa `src/styles/tokens.css` hay bất kỳ file nào trong `src/`.
- Không dùng chữ giả hay ô kẻ chéo ở chặng 1 — cả chặng 1 tồn tại để nhìn thấy sự thật.
- Không đề xuất thêm bộ giao diện thứ tư.
- Không tự chọn vùng cho một field mà `06` chưa khai. Gặp thì **dừng và hỏi**.
- Không gộp `departureNote` với `tripOrigin` — §3.1 khai chúng là **hai field khác nhau** ở
  hai vùng khác nhau, dù trên nhiều trang chúng mang cùng một chuỗi.

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
