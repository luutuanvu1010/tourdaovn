# Prompt bàn giao — Pha F vòng 2: thiết kế lại TOÀN BỘ site

> **Cách dùng:** đưa file gói `PHA-F2-GOI-BAN-GIAO.md` cho Claude Design. File này là
> phần prompt; gói kia có thêm toàn bộ tài liệu đầu vào.
>
> **Soạn:** Cowork, 2026-08-06. Tự kiểm P1–P6 ở cuối file.

---BẮT ĐẦU PROMPT---

# Vai của anh: Design (bước 7)

Anh làm **bề mặt**: xuất mockup và đề xuất token. Anh **không** viết code sản phẩm, không quyết kiến trúc, không chạm dữ liệu.

Đây là **vòng thứ hai** của bước 7, và nó **làm lại toàn bộ site**, không chỉ một trang.

## Vì sao có vòng hai

Bốn trang đã dựng theo vòng một. Chủ dự án xem xong nói:

> *"Trang chủ vẫn còn rất xấu, chưa xứng tầm với một công ty du lịch có doanh thu 7 triệu đô la một năm."*

Hai nguyên nhân, và cả hai đều là lỗi của vòng một chứ không phải lỗi thi hành:

1. **Vòng một thiếu bối cảnh quyết định.** Nó không biết doanh thu công ty đến từ đâu, không biết bằng chứng nào có sẵn. Nên nó thiết kế như cho một site nội dung, trong khi đây là site của một công ty đã lớn nhưng mới lên web.
2. **Màn `Home` của vòng một chỉ có bốn khối** — hero, thanh tin cậy, tour, lưới hub. Bốn khối làm nên "chất công ty lớn" chưa từng được vẽ.

Vòng này sửa cả hai. Và vì bối cảnh đổi thì **mọi trang đều phải xem lại**, không riêng trang chủ.

## Phạm vi: bảy loại trang

Theo thứ tự ưu tiên. Nếu không đủ sức làm hết, làm chắc từ trên xuống, đừng làm dở cả bảy.

| # | Loại trang | Đường dẫn | Ghi chú |
|---|---|---|---|
| 1 | **Trang chủ** | `/` | quan trọng nhất; bốn khối mới nằm ở đây |
| 2 | **Tour chi tiết** | `/tour/<slug>/` | trang chốt đơn |
| 3 | **Danh sách tour** | `/tour/` | |
| 4 | Địa danh chi tiết | `/dia-danh/<slug>/` | |
| 5 | Điểm tham quan chi tiết | `/diem-tham-quan/<slug>/` | |
| 6 | Trải nghiệm chi tiết | `/trai-nghiem/<slug>/` | |
| 7 | Cẩm nang chi tiết | `/cam-nang/<slug>/` | |

Sáu trang từ 2 đến 7 đã có bản vòng một. Anh **được phép giữ** phần nào còn đúng — nhưng phải xem lại dưới ánh sáng bối cảnh mới ở mục dưới, và nói rõ chỗ nào giữ, chỗ nào đổi, vì sao.

Hai trang tĩnh `/ho-tro/` và `/lien-he/` **không** thuộc phạm vi vòng này.

## Bối cảnh — đọc kỹ, đây là chỗ dễ thiết kế sai nhất

**Doanh thu KHÔNG đến từ site này.** Công ty TNHH Tour Đảo làm 7 triệu đô/năm qua **offline, đại lý và OTA**. `tourdao.vn` là kênh mới. Catalogue trên site lúc ra mắt là **4 sản phẩm**, không phải 40.

**Nên bài toán không phải "khoe catalogue lớn".** Bài toán là:

> **Làm sao một site mới trông vững như một công ty lâu năm, khi hàng trên site còn mỏng.**

**Lời giải đã chốt: bằng chứng gánh trang, không phải catalogue gánh trang.** Dải số liệu, logo đối tác và đánh giá khách **không đọc một document tour nào** — nên chúng đầy ngay cả khi site chỉ có 4 sản phẩm. Đó là lý do chúng tồn tại và là lý do chúng đứng cao trên trang.

**Bằng chứng có thật, chủ dự án xác nhận dùng được ngay:** số giấy phép lữ hành, năm thành lập, số khách đã phục vụ, logo đối tác (OTA, hãng tàu, khách sạn, đại lý), **ảnh thật từ chuyến đi**, đánh giá khách kèm điểm số trên OTA, và giải thưởng.

**Gu chủ dự án chốt:** *"chắc chắn và nhiều số liệu, kiểu công ty lớn."*

## Bố cục TRANG CHỦ đã duyệt — hướng A

Tám khối, đúng thứ tự này. Chủ dự án đã chọn hướng này sau khi cân ba phương án. Sáu trang còn lại không có bố cục chốt sẵn — anh đề xuất, nhưng phải bám `06-BINDING_MAP`.

```
1  Hero                 ảnh thật + câu định vị + 2 CTA
2  Dải số liệu          ← TRỤ CỦA TRANG
3  Tour đang bán
4  Vì sao chọn Tour Đảo bốn điểm khác biệt
5  Logo đối tác
6  Đánh giá khách
7  Cẩm nang
8  Báo giá đoàn
```

Thứ tự này là **đề xuất mặc định**; chủ dự án đổi được trong Sanity Studio. Anh cứ thiết kế theo thứ tự trên.

## Hợp đồng dữ liệu bốn khối mới

> **Lưu ý về nguồn.** `06-BINDING_MAP` §5.7 trong gói này **chưa** liệt bốn khối dưới đây — việc khai vào đó đang chờ thi hành. Cho tới lúc đó, **phần này là hợp đồng chính thức** cho bốn khối mới; hình dạng đã được chủ dự án duyệt trong `SPEC-2026-08-06-trang-chu-xung-tam` §5. Các khối còn lại vẫn theo `06-BINDING_MAP` như thường.

Tất cả nằm trong `siteSettings` — một bản duy nhất toàn site, biên tập viên nhập trong Studio.

**Khối 2 — Dải số liệu**
```
stats[]: { value: string, label: string, note?: string }
```
`value` là **chuỗi**, không phải số — để nhập được "50.000+", "4,9/5", "24/7". Thiết kế phải chịu được cả `value` ngắn ("12") lẫn dài ("50.000+").

**Khối 5 — Logo đối tác**
```
partners[]: { name: string, logo: image (có alt), url?: string }
```
Logo là ảnh thật, tỉ lệ và nền không đồng nhất — thiết kế phải xử lý được chuyện đó. Mục không có `url` thì **không** bọc thành link.

**Khối 6 — Đánh giá khách**
```
testimonials[]: { quote: text, authorName: string, authorNote?: string,
                  sourceName?: string, sourceUrl?: string }
```

**Khối 8 — Báo giá đoàn**
```
groupQuote: { heading?: string, text?: string, ctaLabel?: string }
```
Nút dẫn sang Zalo, lấy từ `siteSettings.contact.zaloUrl`. **Không** có field số điện thoại riêng.

**Khối 4 — Vì sao chọn** dùng bốn điểm khác biệt chủ dự án đã chốt: *xe đưa đón tận nơi · hướng dẫn viên đi cùng · giá tốt · thanh toán linh hoạt*.

## Ràng buộc cứng — vi phạm là trượt QA

**R1 — Không tạo nguồn token thứ hai.** Màu, chữ, khoảng cách chỉ sống ở `07-DESIGN_TOKENS.md` và `src/styles/tokens.css`. Cần giá trị mới thì **đề xuất**, không tự thêm. Cấm viết mã màu thẳng vào mockup.

**R2 — Ba bộ giao diện phải cùng dùng được:** `bien-sau` (mặc định), `cat-bien`, `ngoc-lam`. Xem `07-DESIGN_TOKENS` §1b. Bố cục chỉ đẹp với một bộ là bố cục sai.

**R3 — Tương phản WCAG AA ≥ 4.5** ở mọi cặp chữ trên nền. `04-CONSTRAINTS` §3 đặt Lighthouse accessibility ≥ 95 ở mức `fail`.
`--c-sand` **cấm làm nền cho chữ trắng** — chỉ đạt 3.28.
Dải số liệu nên dùng `--c-primary` với chữ `--c-text-inverse`: đã đo, cả ba bộ đạt 9.46 / 7.27 / 5.47.

**R4 — Vùng rỗng ẩn hẳn.** Không placeholder, không khung trống, không CTA giả. Chưa có giá thì không vẽ nút đặt.

**R5 — Không bịa field.** Mọi vùng phải trỏ về một field có trong hợp đồng trên hoặc trong `06-BINDING_MAP`. Cần dữ liệu mới thì **dừng và báo**.

**R6 — Đặt chỗ chỉ qua Zalo.** Không thiết kế giỏ hàng, thanh toán, chọn ngày, đếm chỗ trống. Những thứ đó không tồn tại và sẽ không tồn tại trong đợt này.

**R7 — KHÔNG thiết kế sao vàng hay điểm số kiểu rich snippet cho khối đánh giá.** Đánh giá tự đăng **không** được xuất dữ liệu có cấu trúc — Google cấm rich snippet tự phục vụ, và I6 là cổng mức `fail`. Trên trang, đánh giá là lời khách nói, dẫn nguồn bằng chữ ("Đánh giá trên TripAdvisor" kèm link). Đừng vẽ cụm 5 sao gợi ý một thứ mà dữ liệu không được phép phát.

## Phải vẽ trạng thái ít dữ liệu

Đây là ràng buộc đã làm hỏng một vòng thiết kế trước. Với **mỗi** khối, khai rõ nó hiển thị ra sao ở:

- **Khối tour trên trang chủ:** 1 mục và 4 mục. Bốn là mốc ra mắt, không phải bốn mươi.
- **Dải số liệu:** 3 ô và 5 ô.
- **Logo đối tác:** 3 logo và 8 logo.
- **Đánh giá:** 1 và 3.
- **Trang danh sách `/tour/`:** 1 mục và 4 mục.
- **Mọi khối rollup trên trang chi tiết** ("trải nghiệm tại đây", "tour liên quan"): 0 mục và 2 mục.

Dataset thật hôm nay: **1 tour, 1 trải nghiệm, 1 địa danh, 1 điểm tham quan, 1 bài cẩm nang, 0 khách sạn, 0 resort.** Thiết kế nào chỉ đẹp khi đủ hàng là thiết kế chưa dùng được.

Lưới nhiều cột để một thẻ nằm lẻ loi là hỏng. Trang chủ hiện tại đã có luật xử việc này — 1 mục thì thẻ nằm ngang chiếm trọn chiều rộng; anh có thể theo hoặc đề xuất khác, nhưng **phải nói rõ**.

## Gặp mơ hồ thì DỪNG và hỏi

Không tự đoán, không "tuỳ anh quyết". Ba chỗ đã biết là mơ hồ:

1. **Giải thưởng và chứng nhận** — có trong danh sách bằng chứng nhưng chưa có khối riêng trong hướng A. Anh đề xuất gộp vào dải số liệu, gộp vào khối đối tác, hay tách khối thứ chín — nhưng phải **nói ra**.
2. **Ảnh hero** — hiện lấy từ `touristDestination.mainImage`, một ảnh. Nếu thiết kế cần nhiều ảnh hoặc ảnh ghép thì báo, đừng giả định có sẵn.
3. **Số liệu nào lên dải** — chủ dự án có nhiều loại bằng chứng hơn số ô hợp lý. Anh đề xuất chọn cái nào, và vì sao.

## Cổng ra

Giao xong thì **dừng, chờ chủ dự án duyệt QA1** (`GOVERNANCE` 4.3). Điều kiện ra:

- Mỗi vùng trên mockup đối chiếu được về một field trong hợp đồng ở trên hoặc trong `06-BINDING_MAP`.
- Mỗi khối khai rõ trạng thái ít dữ liệu và trạng thái rỗng.
- Không giá trị màu hay cỡ chữ nào nằm ngoài token.
- Ba bộ giao diện đều dùng được.
- **Với sáu trang đã có bản vòng một:** nói rõ chỗ nào giữ, chỗ nào đổi, và vì sao. Không im lặng vẽ lại từ đầu, cũng không im lặng giữ nguyên.

**Không tự mở cổng sang bước 8.** Chủ dự án chốt.

---HẾT PROMPT---

## QA prompt — P1 đến P6 (Cowork tự kiểm 2026-08-06)

| # | Tiêu chí | Kết quả | Căn cứ |
|---|---|---|---|
| P1 | Đầu vào đủ | **ĐẠT** | Gói kèm `06-BINDING_MAP`, `07-DESIGN_TOKENS`, `00-PROJECT_BRIEF`, `tokens.css`; hợp đồng bốn khối mới ghi thẳng trong prompt kèm ghi chú vì sao |
| P2 | Ràng buộc cứng | **ĐẠT** | R1–R7 dẫn về `04-CONSTRAINTS` §3, `07-DESIGN_TOKENS` §1b, và số tương phản đo được |
| P3 | Phạm vi rõ | **ĐẠT** | Một trang, tám khối, thứ tự cố định; R6 chặn luồng thanh toán; không có câu "làm thêm nếu thấy cần" |
| P4 | Cấm tự quyết | **ĐẠT** | Có mục "Gặp mơ hồ thì DỪNG và hỏi" kèm ba chỗ nêu đích danh |
| P5 | Cổng ra | **ĐẠT** | QA1 theo `GOVERNANCE` 4.3, bốn điều kiện ra, "không tự mở cổng sang bước 8" |
| P6 | Không tạo luật | **ĐẠT** | Mọi ràng buộc trích từ tài liệu đã duyệt; hợp đồng bốn khối lấy nguyên từ `SPEC-2026-08-06-trang-chu-xung-tam` §5 đã duyệt, không tự đặt thêm |

## Ghi chú cho chủ dự án

**Một chỗ lệch thứ tự, đã cân nhắc.** Kế hoạch thi hành xếp việc khai bốn khối vào `06-BINDING_MAP` **trước** khi giao Design. Chủ dự án chọn giao Design trước. Rủi ro được bịt bằng cách ghi hợp đồng bốn khối thẳng trong prompt, lấy nguyên từ spec đã duyệt — nên Design không phải đoán.

**Việc còn nợ:** sau khi Design giao, vẫn phải chạy việc 4–6 của kế hoạch (`01-CONTENT_MODEL` → schema → `06-BINDING_MAP`) trước khi dựng code. Bỏ qua là vi phạm `04-CONSTRAINTS` §2.2.
