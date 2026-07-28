# GÓI 2 — Gỡ hardcode, mọi nơi đọc từ `site.config.ts`

> **Cách dùng:** mở Claude Code tại thư mục `tourdaovn`, dán toàn bộ nội dung từ dòng
> `---BẮT ĐẦU PROMPT---` trở xuống. Prompt này chạy theo 6 pha, mỗi pha có cổng kiểm.
>
> **Trước khi dán:** mở `src/site.config.ts`, xác nhận `brand.name` và `brand.legalName`
> đúng như anh muốn. Toàn bộ site sẽ lấy tên từ hai dòng đó.

---BẮT ĐẦU PROMPT---

# Nhiệm vụ

Gỡ toàn bộ hardcode thương hiệu và tên miền trong dự án này, cho mọi nơi đọc từ
`src/site.config.ts`. Đây là gói thi hành của **ADR-0021** đã được chủ dự án phê chuẩn.

## Đọc trước khi làm bất cứ việc gì

Đọc theo đúng thứ tự sau, không bỏ qua file nào:

1. `docs/adr/ADR-0021-site-config-nguon-su-that.md` — quyết định kiến trúc anh đang thi hành.
   Đặc biệt Quyết định 2 (hai tầng cấu hình), 6 (phân quyền), 8 (tên site ở code, không ở Sanity).
2. `src/site.config.ts` — nguồn sự thật. Đọc hết, kể cả phần chú thích.
3. `docs/RA-SOAT-PHAM-VI-2026-07-27.md` — báo cáo rà soát, phần 2.5 liệt kê các điểm hardcode.
4. `playbook/CONSTITUTION.md` Điều 3, 4, 5 — luật cao nhất của dự án.

## Luật bắt buộc tuân thủ

Dự án này có hệ thống quản trị riêng. Các điều sau ràng buộc anh:

- **P6 + N7 — một nguồn sự thật.** Không được tạo hằng số thứ hai cho cùng một giá trị.
  Nếu thấy mình sắp viết `const SITE_NAME = ...` ở đâu đó ngoài `site.config.ts`, dừng lại:
  đó chính là lỗi mà gói này đang đi sửa.
- **P8 — mơ hồ cấu trúc thì DỪNG, không tự đoán.** Nếu gặp chỗ không rõ nên lấy giá trị từ
  `site.config` hay từ Sanity, **dừng và hỏi**, đừng tự quyết. Mơ hồ bề mặt (đặt tên biến,
  thứ tự import) thì tự quyết và ghi lại.
- **N3 — không tự ra quyết định kiến trúc.** Gói này chỉ thi hành ADR-0021. Nếu phát hiện cần
  một quyết định mới (ví dụ: cần thêm một trường vào Sanity), **dừng và báo cáo**, đừng tự làm.
- **Điều 8.5 — mặc định từ chối.** Việc chưa có bằng chứng đạt thì coi như chưa xong.
- Trả lời bằng **tiếng Việt**, ngắn gọn, viết cho người không chuyên kỹ thuật.

## Ràng buộc phạm vi

- **KHÔNG đụng vào** `playbook/` (bản pin chỉ đọc).
- **KHÔNG đổi** giá trị trong `site.config.ts` — chỉ đọc từ nó. Nếu thấy giá trị sai, báo cáo.
- **KHÔNG gỡ** khung đa ngữ (`Record<Lang, ...>`). ADR-0021 đã quyết giữ khung, khoá bằng
  `langs` trong config. Đụng vào là vượt phạm vi.
- **KHÔNG xoá** file schema của `restaurant`/`specialty`/`event` — chúng để dormant có chủ đích,
  tránh gãy tham chiếu chéo.
- Mỗi pha là **một commit riêng**. Không gộp.

---

# PHA 0 — Mở lại cổng chất lượng (làm trước tiên)

Cổng kiểm dữ liệu của dự án đang **tắt hoàn toàn**: `scripts/gate.config.ts` có
`publishableTypes: []`, nghĩa là mọi nội dung đều lọt, kể cả bản nháp chưa duyệt.
Đây là vi phạm ADR-0008. Phải bật lại trước khi làm bất cứ việc gì khác, để các pha sau
có cổng thật mà đi qua.

**Việc:**

1. Đọc `scripts/examples/gate.config.tourdao.ts` làm mẫu — nhưng cẩn thận, mẫu này lỗi thời
   (ghi type `author` trong khi schema thật tên `person`). Đừng chép mù.
2. Đọc `cms/schemas/` để biết tên type và tên trường thật.
3. Điền `scripts/gate.config.ts` cho đúng **9 entity đang bật** (lấy danh sách từ
   `enabledEntities` trong `site.config.ts`):
   - `publishableTypes`: 9 entity đó
   - `requiredFields`: trường tối thiểu mỗi type phải có mới được publish
   - `references`: quan hệ phải deref được và đúng type đích
4. Chạy `npm run gate`. Nếu báo lỗi trên dữ liệu thật, **đừng nới cổng cho hết lỗi** —
   báo cáo lỗi đó cho chủ dự án. Cổng bắt được lỗi thật là cổng làm đúng việc.

**Cổng ra pha 0:** `npm run gate` chạy được và cho kết quả có nghĩa (pass, hoặc fail với
lý do cụ thể đã báo cáo). Commit: `pha0: bat lai cong chat luong cho 9 entity`.

---

# PHA 1 — Tên site đọc từ `brand.name`

Có **49 chỗ** viết cứng chuỗi `Nha Trang Travel` (38 trong `src/`, 11 trong `cms/`).
Đây là tên của site cũ mà dự án này fork từ đó — khách đang nhìn thấy nó trên logo,
footer, và khi chia sẻ lên Facebook/Zalo.

**Việc:**

1. `grep -rn "Nha Trang Travel" src/ cms/` để có danh sách đầy đủ.
2. Với mỗi chỗ, thay bằng `brand.name` (hoặc `brand.legalName` ở chỗ cần tên pháp nhân —
   node `Organization` trong JSON-LD và dòng bản quyền footer).
3. Các nhóm cần chú ý:
   - `src/components/Header.astro:48`, `Footer.astro:48` — logo và footer.
   - `Footer.astro:79` — dòng bản quyền hiện ghi cứng `© 2026`. Đổi thành năm hiện tại tính
     lúc build, kết hợp `brand.foundedYear` nếu muốn dạng "2026–2027".
   - `src/layouts/BaseLayout.astro:44` — `og:site_name`, tên hiện khi share.
   - `src/lib/uiCopy.ts` — **20 chỗ** trong 5 khối ngôn ngữ (`homeAria`, `notFoundTitle`,
     mô tả `person`, mô tả `hub-all`). Đây là file dữ liệu tĩnh; nếu không import được
     `site.config` vào đó một cách sạch sẽ, **dừng và báo cáo cách anh định làm** trước khi
     sửa — đừng tự chọn giải pháp phức tạp.
   - `cms/` — 8 file schema có chuỗi `— Ảnh Nha Trang Travel` trong alt ảnh mặc định,
     `BulkGalleryInput.tsx` 2 chỗ, `sanity.config.ts:21` tiêu đề Studio.
     Lưu ý: `cms/` là tiến trình riêng, **kiểm xem có import được `src/site.config.ts` không**.
     Nếu không import sạch được, DỪNG và báo cáo — đừng chép giá trị sang `cms/`, vì đó
     đúng là vi phạm N7 mà gói này đang đi sửa.

**Cổng ra pha 1:** `grep -rn "Nha Trang Travel" src/ cms/` trả về **0 kết quả**
(trừ file tài liệu trong `docs/`). `npm run build` xanh.
Commit: `pha1: ten site doc tu brand.name`.

---

# PHA 2 — Tên miền đọc từ `site.url`

**25 file** đang có mẫu `Astro.site?.toString() || 'https://tourdaovn.vn'`. Tên miền bị chép
25 lần; đổi tên miền là phải sửa 25 chỗ.

**Việc:**

1. `grep -rn "tourdaovn.vn" src/ cms/`.
2. Thay mọi fallback bằng `site.url` từ `site.config.ts`.
   Cân nhắc tạo một helper nhỏ (ví dụ `siteBaseUrl(Astro)`) để 25 chỗ dùng chung một dòng,
   thay vì 25 lần lặp cùng một biểu thức. Nếu làm vậy, đặt helper ở `src/lib/`.
3. `astro.config.mjs` có `site: 'https://tourdaovn.vn'`. Astro đọc file này ở tầng ngoài
   nên có thể không import được `site.config.ts` vào đó. **Kiểm tra thực tế**, đừng đoán:
   - Nếu import được → import.
   - Nếu không → để nguyên và thêm chú thích ở **cả hai file** trỏ về nhau, rồi thêm một
     dòng kiểm lúc build cảnh báo nếu hai giá trị lệch nhau. Báo cáo cách anh chọn.
4. Sửa 3 chỗ trong `cms/` còn trỏ sang website khác:
   - `cms/lib/resolveProductionUrl.ts:1` — `nhatrangtravel.net`. Nút "Xem live" trong Sanity
     đang dẫn khách sang site của người khác.
   - `cms/components/GeoDashboard.tsx:4` — cùng lỗi.
   - `cms/sanity.config.ts:20-21` — `name: 'nhatrang-travel'`, `title: 'Nha Trang Travel Hub'`.
     ⚠️ Đổi `name` có thể ảnh hưởng Studio đang chạy — **kiểm tra trước khi đổi**, nếu không
     chắc thì chỉ đổi `title` và báo cáo.
   - `src/lib/geoKnowledge.ts:304` — link studio trỏ `nhatrang-travel.sanity.studio`,
     phải là `site.studioHost`.

**Cổng ra pha 2:** `grep -rn "tourdaovn.vn\|nhatrangtravel" src/ cms/` chỉ còn kết quả ở
`site.config.ts` (và `astro.config.mjs` nếu đã báo cáo lý do). `npm run build` xanh.
Commit: `pha2: ten mien doc tu site.url`.

---

# PHA 3 — Trang chủ đọc `primaryDestinationSlug`

`src/pages/index.astro:19` và `src/pages/[lang]/index.astro:25` đang fetch **cứng** slug
`'nha-trang'`. Đổi điểm đến chính là trang chủ trắng nội dung, không có cảnh báo nào.

**Việc:**

1. Thay slug cứng bằng `primaryDestinationSlug` từ config.
2. `index.astro:26` còn dòng `destinationHref('nha-trang', lang) || '/nha-trang/'` — sửa cả hai.
3. **Thêm cảnh báo rõ ràng** khi Sanity không trả về document nào cho slug đó: hiện tại nó
   im lặng render trang rỗng. Cho build in ra một cảnh báo nêu đúng slug đang tìm và gợi ý
   kiểm `primaryDestinationSlug`. Đây là sửa đúng loại lỗi "sai im lặng" mà ADR-0021 nhắm tới.
4. `src/pages/index.astro:25-26` còn `metaTitle` và `metaDescription` viết cứng nội dung
   Nha Trang. Tiêu đề lấy từ `brand.name`. Còn **mô tả trang chủ là nội dung, thuộc tầng
   biên tập** — theo ADR-0021 Quyết định 2 nó nên đến từ Sanity. `siteSettings` hiện **chưa có
   trường mô tả**. Thêm một trường vào schema là đổi mô hình dữ liệu → **DỪNG và báo cáo**,
   đừng tự thêm.

**Cổng ra pha 3:** `grep -rn "'nha-trang'" src/` trả về 0. Build xanh. Thử đổi
`primaryDestinationSlug` thành một giá trị sai, xác nhận build in cảnh báo rõ ràng, rồi đổi lại.
Commit: `pha3: trang chu doc primaryDestinationSlug`.

---

# PHA 4 — Dọn hai chỗ khai sai với khách và với máy

1. **`src/components/Header.astro:28-34`** — vẫn render 5 nút VI/EN/ZH/KO/RU. Site chỉ có
   tiếng Việt nên 4 nút kia hiện ở trạng thái xám với tooltip "bản dịch đang chuẩn bị".
   Khách nhìn thấy 4 nút vô nghĩa trên mọi trang.
   → Cho danh sách nút đọc từ `langs` trong `site.config.ts`. Khi chỉ có 1 ngôn ngữ, **ẩn
   hẳn cả cụm chuyển ngôn ngữ**. Đừng xoá code — mai sau bật thêm ngôn ngữ là nó tự hiện lại.

2. **`src/pages/llms.txt.ts:44`** — vẫn khai với AI crawler `translations: en, zh, ko, ru`.
   Sai sự thật. → Sinh từ `langs`.

3. Rà thêm: `grep -rn "'en'\|'zh'\|'ko'\|'ru'" src/pages/ src/components/` xem còn chỗ nào
   khai cứng danh sách ngôn ngữ ngoài `site.config.ts` không.

**Cổng ra pha 4:** chạy `npm run dev`, mở trang chủ, xác nhận **không còn nút ngôn ngữ nào**.
`/llms.txt` chỉ khai tiếng Việt. Commit: `pha4: ngon ngu doc tu config, het nut chet`.

---

# PHA 5 — Dọn Studio cho biên tập viên

Biên tập viên hiện vẫn thấy và vẫn nhập được nội dung cho `restaurant`, `specialty`, `event`
— ba danh mục **không bao giờ hiển thị** trên site. Đây là bẫy làm mất công người khác.

**Việc:**

1. `cms/schemas/index.ts:18-35` — gỡ đăng ký 3 type đó. **Giữ nguyên file schema**, chỉ gỡ
   khỏi danh sách đăng ký.
2. Kiểm xem có document nào của 3 type đó trong Sanity không. Nếu có, **DỪNG và báo cáo số
   lượng** trước khi gỡ — gỡ đăng ký khi còn dữ liệu sẽ làm dữ liệu đó không sửa được nữa.
3. Kiểm cross-reference: có entity đang bật nào trỏ tới 3 type đó không
   (`servesSpecialty`, `whereToTry`...). Nếu có, báo cáo, đừng tự xử lý.
4. Nếu ở Pha 1 anh đã tìm ra cách import `site.config.ts` vào `cms/` sạch sẽ, làm luôn việc
   cho `cms/schemas/index.ts` đọc danh sách từ `enabledEntities`. Nếu chưa, để lại và báo cáo.

**Cổng ra pha 5:** mở Sanity Studio, xác nhận menu không còn Nhà hàng / Đặc sản / Sự kiện.
Commit: `pha5: studio chi hien 9 danh muc dang bat`.

---

# PHA 6 — Kiểm chứng cuối và báo cáo

1. `npm run build` — phải xanh.
2. `npm run gate` — phải xanh, hoặc fail với lý do đã báo cáo ở Pha 0.
3. Chạy lại toàn bộ grep của các pha, dán kết quả làm bằng chứng.
4. So sánh `dist/` trước và sau: **số lượng trang phải không đổi**. Gói này không được thêm
   hay bớt URL nào. Nếu số trang đổi, dừng và tìm nguyên nhân.
5. Mở `dist/index.html`, kiểm mắt thường: `og:site_name`, `<title>`, JSON-LD `Organization`
   đều mang tên mới.

**Báo cáo cuối** — viết vào `docs/GOI-2-KET-QUA.md`, gồm:
- Bảng: mỗi pha / số chỗ đã sửa / bằng chứng grep
- Danh sách những chỗ anh **đã DỪNG và không tự quyết**, kèm câu hỏi cụ thể cho chủ dự án
- Những giả định bề mặt anh đã tự đưa ra (P8 bắt buộc ghi lại)
- Việc còn lại chưa làm trong gói này

# Điều quan trọng nhất

Gói này có **9 điểm mà anh được yêu cầu DỪNG thay vì tự quyết**. Chúng nằm rải trong các pha
và đã đánh dấu rõ. Dừng đúng chỗ ở đây có giá trị hơn làm xong nhanh: dự án này đã một lần
thu hẹp phạm vi bằng cách sửa tay rải rác, và hậu quả chính là gói việc anh đang cầm.

Nếu một pha bị chặn, **làm tiếp pha sau nếu nó độc lập**, và ghi rõ pha nào đang treo.

---KẾT THÚC PROMPT---

## Ghi chú cho chủ dự án

**9 điểm prompt yêu cầu Claude Code dừng lại hỏi anh** — đây là chủ ý, không phải thiếu sót:

| Pha | Điểm dừng | Vì sao |
|---|---|---|
| 0 | Cổng bắt lỗi trên dữ liệu thật | Nới cổng cho hết lỗi là phản tác dụng |
| 1 | `uiCopy.ts` import config | File dữ liệu tĩnh, cách nối không hiển nhiên |
| 1, 5 | `cms/` import được `src/` không | Hai tiến trình riêng; chép giá trị sang là tái phạm N7 |
| 2 | `astro.config.mjs` | Astro đọc ở tầng ngoài, có thể không import được |
| 2 | Đổi `name` trong `sanity.config.ts` | Có thể ảnh hưởng Studio đang chạy |
| 3 | Mô tả trang chủ | Thêm trường vào Sanity = đổi mô hình dữ liệu, cần ADR |
| 5 | Còn dữ liệu trong 3 type gỡ | Gỡ đăng ký khi còn dữ liệu = dữ liệu không sửa được nữa |
| 5 | Cross-reference tới 3 type gỡ | Có thể gãy quan hệ dữ liệu |

**Thứ tự đề xuất:** chạy Pha 0 riêng một phiên (cổng chất lượng đang tắt là rủi ro lớn nhất
hiện nay), rồi Pha 1–2 một phiên, Pha 3–5 một phiên.
