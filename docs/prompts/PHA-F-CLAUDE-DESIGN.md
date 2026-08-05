# Prompt bàn giao — Pha F (bước 7): Claude Design

> **Cách dùng:** mở một phiên Claude mới tại thư mục `tourdaovn`, dán toàn bộ nội dung từ
> dòng `---BẮT ĐẦU PROMPT---` trở xuống.
>
> **Soạn:** Cowork, 2026-08-06. Đã tự kiểm P1–P6, xem §QA cuối file.

---BẮT ĐẦU PROMPT---

# Vai của anh: Design (bước 7)

Anh làm **bề mặt**. Xuất mockup và đề xuất token. Anh **không** viết code sản phẩm, không
quyết kiến trúc, không chạm dữ liệu.

## Cổng cứng — kiểm trước khi làm bất cứ việc gì

`PLAYBOOK` Phần 1 và `GOVERNANCE` 4.2: **chưa có `06-BINDING_MAP` đã duyệt thì cấm vào
bước 7.** File có ở `docs/core-specs/06-BINDING_MAP.md`, phiên bản **v2.0.0**, viết lại
ngày 2026-08-05.

Mở §7 của file đó ra đọc trước. Nó có bảng bốn điều kiện mở cổng, và **ghi rõ điều kiện nào
chưa đạt**. Nếu chủ dự án chưa xác nhận mở cổng với trạng thái đó, anh **dừng và hỏi**,
không tự cho là đã mở.

## Đọc trước khi làm

Theo thứ tự:

1. `docs/core-specs/06-BINDING_MAP.md` — **quan trọng nhất**. Mỗi vùng giao diện ăn dữ liệu
   từ field nào. Vùng nào không trỏ được về một field thật là vùng vẽ bừa.
2. `docs/core-specs/07-DESIGN_TOKENS.md` — bộ token hiện hành, gồm **§1b: ba bộ giao diện
   chọn được**.
3. `docs/core-specs/00-PROJECT_BRIEF.md` — định vị, khách hàng, bốn điểm khác biệt.
4. `docs/design-context/COMPONENT_INVENTORY.md` — 54 component đang có.
5. `src/styles/tokens.css` — token đang chạy thật.

## Bối cảnh — đọc kỹ, đây là chỗ mockup hay sai nhất

**Công ty TNHH Tour Đảo** bán tour biển đảo Nha Trang cho khách lẻ và khách đoàn. Sáu dòng
dịch vụ: tour đảo, lặn biển, vé vào cổng khu vui chơi, khách sạn và resort, đưa đón sân bay.
Đặt chỗ **qua Zalo**, không có giỏ hàng, không thanh toán trên site.

Bốn điểm khác biệt: xe đưa đón tận nơi, hướng dẫn viên đi cùng, giá tốt, thanh toán linh hoạt.

### ⚠ Dữ liệu đang RẤT MỎNG — đây là ràng buộc số một

Đo trên bản build thật ngày 2026-08-06:

| Khối | Số mục thật |
|---|---|
| Tour | **1** |
| Trải nghiệm | **1** |
| Cẩm nang | **1** |
| Địa danh | **1** |
| Điểm tham quan | **1** |
| Khách sạn, Resort | **0** |

Mốc ra mắt là 2026-08-09 với mục tiêu **4 sản phẩm**.

**Hệ quả bắt buộc lên thiết kế:** mọi khối phải trông tử tế với **1 mục**, không chỉ với 6–8
mục. Lưới 3 cột có một thẻ nằm lẻ loi là hỏng. Anh phải khai rõ mỗi khối hiển thị ra sao ở
**1 mục, 2–3 mục, và 4+ mục**.

Đây là lỗi kinh điển của mockup: vẽ lưới đầy thẻ đẹp, dựng thật thì rỗng. Nếu mockup của anh
chỉ đúng khi có nhiều dữ liệu, nó chưa dùng được.

## Việc cần làm

Ba loại trang, theo đúng thứ tự ưu tiên:

1. **Trang chủ `/`** — xem `06-BINDING_MAP` §5.7. Thứ tự khối do `siteSettings.sections`
   quyết, nên anh đề xuất thứ tự chứ không cố định nó.
2. **Trang tour chi tiết `/tour/<slug>/`** — `06-BINDING_MAP` §3 (khung chung) cộng §4.8
   (delta Tour). Đây là trang chốt đơn, quan trọng nhất về chuyển đổi.
3. **Trang danh sách `/tour/`** — §5.1 (card chuẩn) và §5.2.

Với mỗi trang, giao:

- Mockup (HTML tĩnh hoặc mô tả bố cục đủ chi tiết để dựng lại được).
- Bảng đối chiếu: **mỗi vùng trên mockup ↔ dòng nào trong `06-BINDING_MAP`**. Vùng không đối
  chiếu được là vùng phải bỏ.
- Trạng thái rỗng và trạng thái ít dữ liệu của từng khối.

## Ràng buộc cứng — vi phạm là trượt QA

**R1 — Không tạo nguồn token thứ hai.** Màu, chữ, khoảng cách chỉ sống ở
`07-DESIGN_TOKENS.md` và `src/styles/tokens.css`. Muốn giá trị mới thì **đề xuất**, chủ dự
án duyệt, rồi mới thêm vào token. Cấm viết giá trị màu thẳng vào mockup.

**R2 — Ba bộ giao diện phải cùng dùng được.** `bien-sau` (mặc định), `cat-bien`, `ngoc-lam`
— xem `07-DESIGN_TOKENS` §1b. Mockup không được phụ thuộc vào một bộ cụ thể. Nếu một bố cục
chỉ đẹp với nền trắng mà vỡ với nền kem, đó là bố cục sai.

**R3 — Tương phản WCAG AA.** Mọi cặp chữ trên nền ≥ 4.5. `04-CONSTRAINTS` §3 đặt ngưỡng
Lighthouse accessibility ≥ 95 ở mức `fail`. Có lệnh kiểm: `npm --prefix scripts run check:theme`.
Màu `--c-sand` **cấm làm nền cho chữ trắng** — chỉ đạt 3.28.

**R4 — Vùng rỗng thì ẩn hẳn.** `06-BINDING_MAP` quyết định nền 2 và 3: không placeholder,
không khung trống, **không CTA giả**. Chưa có giá thì không vẽ nút đặt.

**R5 — Không bịa field.** Mọi vùng phải trỏ về một field có trong `01-CONTENT_MODEL`. Cần
dữ liệu mới thì **dừng và báo**, không tự thêm.

**R6 — Đặt chỗ đi qua Zalo.** Không thiết kế luồng thanh toán, giỏ hàng, chọn ngày, đếm chỗ
trống. Những thứ đó không tồn tại.

## Cấm

- Quyết kiến trúc, đổi cây URL, đổi mô hình dữ liệu.
- Chạm dữ liệu trong Sanity.
- Sửa code sản phẩm trong `src/`. Bước 7 chỉ ra mockup và đề xuất token; dựng thật là bước 8.
- Thêm font mới, thư viện mới, framework mới.
- Thiết kế trang cho ba danh mục đang tắt: nhà hàng, đặc sản, sự kiện.

## Gặp mơ hồ thì DỪNG và hỏi

Không tự đoán, không "tuỳ anh quyết". Cụ thể, ba chỗ đã biết là mơ hồ:

1. **Vùng "Phân loại"** — `06-BINDING_MAP` §3 khai vùng này cho mọi trang chi tiết, nhưng
   **không template nào đang render nó** (9 trong 15 cảnh báo của `g3`). Anh quyết dựng nó
   trong mockup hay đề xuất bỏ dòng đó khỏi binding map — nhưng phải **nói ra**, không lặng
   lẽ chọn.
2. **Bố cục cho 1 mục** — nếu anh thấy một khối không thể trông tử tế với 1 mục, nói ra
   thay vì vẽ đại.
3. **Font** — hiện là Be Vietnam Pro và Plus Jakarta Sans. Muốn đổi thì đề xuất kèm lý do,
   chủ dự án quyết.

## Cổng ra

Giao xong thì **dừng, chờ chủ dự án duyệt QA1** (`GOVERNANCE` 4.3). Điều kiện ra:

- Mọi vùng trên mockup đối chiếu được về một dòng trong `06-BINDING_MAP`.
- Mỗi khối có khai trạng thái 1 mục / vài mục / nhiều mục.
- Không giá trị màu hay cỡ chữ nào nằm ngoài token.
- Ba bộ giao diện đều dùng được.

**Không tự mở cổng sang bước 8.** Chủ dự án chốt.

## Ràng buộc thời gian

Mốc ra mắt **2026-08-09**. Nếu phải chọn, ưu tiên **trang tour chi tiết** trước trang chủ:
đó là trang chốt đơn. Thà giao hai trang chắc còn hơn ba trang dở.

---HẾT PROMPT---

## QA prompt — P1 đến P6 (Cowork tự kiểm 2026-08-06)

| # | Tiêu chí | Kết quả | Căn cứ |
|---|---|---|---|
| P1 | Đầu vào đủ | **ĐẠT** | Liệt 5 tài liệu theo thứ tự, nêu rõ cái nào quan trọng nhất |
| P2 | Ràng buộc cứng | **ĐẠT** | R1–R6 dẫn về `06-BINDING_MAP` quyết định nền 2/3, `04-CONSTRAINTS` §3, và số tương phản đo được |
| P3 | Phạm vi rõ | **ĐẠT** | Ba loại trang có thứ tự ưu tiên; mục Cấm liệt 5 điều; không có câu "làm thêm nếu thấy cần" |
| P4 | Cấm tự quyết | **ĐẠT** | Có mục "Gặp mơ hồ thì DỪNG và hỏi", kèm ba chỗ mơ hồ đã biết được nêu đích danh |
| P5 | Cổng ra | **ĐẠT** | Chỉ rõ QA1 theo `GOVERNANCE` 4.3, bốn điều kiện ra, và "không tự mở cổng sang bước 8" |
| P6 | Không tạo luật | **ĐẠT** | Mọi ràng buộc đều trích từ tài liệu đã có; không đặt cổng mới, không đổi thẩm quyền |

## Ghi chú cho chủ dự án

**Một xung đột tên ở tầng luật, chưa xử (DR-008).** `GOVERNANCE` 4.3 đòi artifact tên
`DESIGN.md`; `PLAYBOOK` Phần 1 gọi artifact bước 7 là `DESIGN_TOKENS + mockup`. Hai tên cho
một thứ, và `DESIGN.md` chưa bao giờ tồn tại trong repo. Prompt này đi theo `PLAYBOOK`. Muốn
đóng hẳn thì sửa `GOVERNANCE` cho khớp — việc ở tầng luật, không thuộc pha F.

**Cổng vào bước 7 cần anh xác nhận.** `06-BINDING_MAP` §7 có bảng bốn điều kiện; điều kiện 3
còn 15 cảnh báo `g3` (0 lỗi). Anh chốt mở cổng với trạng thái đó hay đòi xử trước.
