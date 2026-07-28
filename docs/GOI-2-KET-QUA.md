# GÓI 2 — Kết quả gỡ hardcode, mọi nơi đọc từ `site.config.ts`

Ngày thực hiện: 2026-07-28. Thi hành theo `docs/prompts/GOI-2-go-hardcode.md`, thực thi ADR-0021.

Trạng thái tổng thể: **PHA 0–6 đã chạy, 5/6 pha xong trọn vẹn, PHA 5 còn treo 1 việc chờ chủ dự án** (xoá 1 document Sự kiện). Toàn bộ commit đã push lên `origin/main` và deploy lên production (site `https://tourdao.vn`, Studio `https://tourdaovn.sanity.studio`).

---

## 1. Bảng tổng hợp theo pha

| Pha | Việc | Số chỗ sửa | Bằng chứng grep (chạy lại lúc viết báo cáo) | Commit |
|---|---|---|---|---|
| 0 | Bật lại cổng chất lượng (`gate.config.ts`) cho 9 entity | 9 entity: `publishableTypes`, `requiredFields`, `references` | `validate-min.ts` chạy trực tiếp → `validate:min PASS` trên dữ liệu Sanity thật | `56ed30d` |
| 1 | Tên site đọc từ `brand.name`/`brand.legalName` | 49 chỗ (38 `src/`, 11 `cms/`) | `grep -rn "Nha Trang Travel" src/ cms/` → **0 kết quả** | `ba96152` |
| 2 | Tên miền đọc từ `site.url` | 25 chỗ fallback + 3 chỗ `nhatrangtravel.net` trong `cms/` + `astro.config.mjs` import thẳng `site.config.ts` | `grep -rn "tourdaovn.vn\|nhatrangtravel" src/ cms/` → **0 kết quả tuyệt đối** (domain đã đổi hẳn sang giá trị đúng `tourdao.vn`, không chỉ gom về 1 file) | `754e8e5`, `00bacf3`, `a193bd3` |
| 3 | Trang chủ đọc `primaryDestinationSlug` | 2 chỗ fetch cứng `'nha-trang'` + thêm cảnh báo build khi thiếu dữ liệu | `grep -rn "'nha-trang'" src/` → chỉ còn khai báo gốc tại `site.config.ts:179` | `9cb2dab` |
| 4 | Ngôn ngữ đọc từ `langs`, hết nút chết | Header (nút ngôn ngữ), `llms.txt.ts`, + 2 chỗ phát hiện thêm khi rà soát (`ai/index.json.ts`, `[lang]/index.astro`) | `grep -rn "'en'\|'zh'\|'ko'\|'ru'" src/pages/ src/components/` → chỉ còn 2 chỗ type-guard nội bộ (xem mục 3) | `e1c0669` |
| 5 | Dọn Studio | Ẩn Nhà hàng/Đặc sản khỏi menu; gỡ đa ngôn ngữ + Cào dữ liệu khỏi Studio (yêu cầu bổ sung giữa phiên) | Xác minh bằng browser thật (console sạch, DOM chỉ còn field `Vi`) | `ed49de8`, `697dc1e` |
| 6 | Kiểm chứng cuối | — | Xem mục 2–5 dưới đây | (báo cáo này) |

---

## 2. Kiểm chứng cuối (PHA 6)

- **`npm run build`**: xanh (exit 0).
- **`npm run gate`**: FAIL với đúng 1 lý do đã biết và ngoài phạm vi gói này — xem mục 4.4. Cơ chế thật của PHA 0 (`scripts/validate-min.ts`, đọc `gate.config.ts`) chạy riêng: **PASS** trên dữ liệu Sanity thật.
- **Số trang trong `dist/`**: 13 file HTML (`404`, trang chủ, 7 trang danh mục, 3 hub, 1 trang gom). **Không có bản `dist/` chụp trước khi bắt đầu gói này để diff trực tiếp** — đối chiếu thay bằng review code: không có commit nào trong gói này chạm `src/lib/routes.ts` (bảng route) hay đổi giá trị `entities`/`hubs`/`langs` trong `site.config.ts` — 3 nguồn duy nhất quyết định route được sinh ra. Kết luận: số trang không đổi so với trước gói.
- **`dist/index.html` — kiểm mắt thường**:
  - `<title>Tour Đảo</title>` ✓
  - `og:site_name` = `Tour Đảo` ✓
  - JSON-LD `WebSite.name` = `Tour Đảo`, `Organization.name` = `Công ty TNHH Tour Đảo` ✓

---

## 3. Những chỗ đã DỪNG, không tự quyết — kèm câu hỏi cho chủ dự án

| # | Pha | Điểm dừng | Câu hỏi cụ thể |
|---|---|---|---|
| 1 | 0 | `RefRule` trong `gate.config.ts` chỉ nhận 1 type đích, trong khi `containedInPlace`/`venue` cho phép trỏ nhiều type (vd `place` hoặc `touristDestination`) | Có muốn mở rộng cơ chế cổng để kiểm được reference đa-type không? Hiện tại các field này chỉ được kiểm "có/không rỗng", không kiểm "đúng type đích". |
| 2 | 0 | `npm run gate` (định nghĩa trong `package.json`) không hề gọi tới `validate-min.ts`; `.github/workflows/validate.yml` gọi `npm run validate:min` — script này **không tồn tại** trong `scripts/package.json` | Có muốn thêm script `validate:min` và nối nó vào chuỗi `gate` không? Hiện tại cổng thật (đọc `gate.config.ts`) chỉ chạy được nếu gọi trực tiếp `validate-min.ts`, không chạy qua đường chính thức. |
| 3 | 2 | `cms/sanity.config.ts` có `name: 'nhatrang-travel'` (workspace id nội bộ, khác `title` đã đổi) | Có muốn đổi `name` này không? Đã tra `sanity.cli.ts` xác nhận URL Studio thật do `studioHost` quyết định (đã đúng), không phụ thuộc `name` — rủi ro thấp nhưng không kiểm chắc 100% được nếu không deploy thử thật. |
| 4 | 3 | `metaDescription` trang chủ (`src/pages/index.astro`) vẫn viết cứng nội dung "Nha Trang" — đây là nội dung thuộc tầng biên tập (ADR-0021 QĐ2), nhưng `siteSettings` **chưa có trường mô tả trang chủ** | Có muốn thêm trường mô tả vào schema `siteSettings` không? Thêm trường là đổi mô hình dữ liệu, cần quyết định ở tầng đúng, không tự thêm. |
| 5 | 5 | `event` (Sự kiện) có 1 document thật đã duyệt trong Sanity — gỡ đăng ký lúc còn dữ liệu sẽ làm dữ liệu không sửa được nữa qua Studio | Đã hỏi và chủ dự án chọn "xoá document rồi gỡ hẳn" — **đang chờ chủ dự án tự xoá document** (id `7df1650a-5832-4866-8466-9db6942fe713`, "Festival biển Nha Trang Khánh Hoà") vì xoá dữ liệu vĩnh viễn là việc tôi không tự làm. Báo lại khi xong để gỡ đăng ký hoàn toàn. |
| 6 | 5 | `article.ts` (field `about`/`mentions`) và `touristDestination.ts` (field `featuredSpecialties`) vẫn khai tham chiếu tới type `restaurant`/`specialty` | Thử gỡ hẳn 2 type này khỏi `schemaTypes` đã làm Studio vỡ (`SchemaError`, xác minh bằng browser thật). Có muốn tôi gỡ 2 field tham chiếu đó trước (thu hẹp `to:` trong `article.ts`/`touristDestination.ts`), để sau đó gỡ hẳn `restaurant`/`specialty` không? Hiện tại chỉ mới ẩn khỏi menu, chưa gỡ đăng ký thật. |

---

## 4. Giả định bề mặt tự quyết (P8 — cửa hai chiều, đã ghi lại)

1. **PHA 0** — `containedInPlace`/`venue` (reference đa-type): đưa vào `requiredFields` (kiểm không rỗng) nhưng bỏ khỏi `references` (không đoán bừa 1 type rồi báo sai cho dữ liệu hợp lệ).
2. **PHA 1** — Dòng bản quyền footer hiển thị dạng khoảng năm `foundedYear–currentYear` chỉ khi hai năm khác nhau, còn bằng nhau thì hiện một năm.
3. **PHA 2** — Tạo helper `siteBaseUrl()` tại `src/lib/siteUrl.ts` dùng chung cho 25 chỗ, thay vì lặp cùng biểu thức 25 lần (đúng theo gợi ý "cân nhắc tạo helper" của prompt).
4. **PHA 2** — `astro.config.mjs` import thẳng `site.config.ts` (đã kiểm tra thực tế bằng build thử, không đoán) — loại bỏ hoàn toàn khả năng lệch giá trị giữa hai file.
5. **PHA 4** — Rà thêm tìm được 4 chỗ khai cứng danh sách ngôn ngữ; chỉ sửa 2 chỗ "khai sai với máy/route" (`ai/index.json.ts`, `[lang]/index.astro`), **giữ nguyên** 2 chỗ (`uiLang` type-guard trong `Header.astro`/`Footer.astro`) vì bản chất là kiểm kiểu nội bộ, không "khai báo" ngôn ngữ ra với khách hay máy.
6. **PHA 5** — Khi phát hiện gỡ hẳn `restaurant`/`specialty` khỏi `schemaTypes` làm vỡ Studio (cross-reference từ `article.ts`), đã hạ mức từ "gỡ đăng ký" xuống "ẩn khỏi menu, giữ đăng ký kỹ thuật" — ưu tiên Studio chạy được hơn làm đúng chữ nghĩa yêu cầu ban đầu, và báo cáo rõ thay vì âm thầm chọn.
7. **PHA 5 (mở rộng giữa phiên, theo yêu cầu trực tiếp)**: gỡ 2 plugin đa ngôn ngữ + 2 tool/action "Cào dữ liệu" khỏi giao diện Studio — không nằm trong prompt gốc, làm theo chỉ đạo trực tiếp của chủ dự án khi xem Studio thật và thấy các mục ngoài phạm vi. Không xoá code, chỉ ẩn khỏi cấu hình.
8. **Sự cố phát sinh giữa phiên (không phải giả định, mà là lỗi thật đã sửa)**: gỡ plugin `@sanity/language-filter` ở bước 7 làm mất luôn cơ chế ẩn field theo ngôn ngữ (tưởng nhầm đây là 1 phần "giao diện đa ngôn ngữ" cần gỡ, thực ra nó là cơ chế lọc field khác hẳn). Đã đọc source code plugin, phát hiện thêm 1 lỗi thật của chính plugin (mặc định chọn tất cả ngôn ngữ khi chưa có state lưu, và cơ chế nhận diện field dựa trên quy ước tên type "locale*" không khớp với schema dự án) — viết `filterField` riêng thay vì dùng mặc định của plugin. Xác minh bằng browser thật (không đoán).

---

## 5. Việc còn lại, chưa làm trong gói này

1. **Gỡ đăng ký hoàn toàn `event`, `restaurant`, `specialty`** — chờ (a) chủ dự án xoá document Sự kiện, (b) quyết định về 2 field tham chiếu trong `article.ts`/`touristDestination.ts`. Xem mục 3, dòng 5–6.
2. **`metaDescription` trang chủ** — chờ quyết định thêm trường vào `siteSettings`. Xem mục 3, dòng 4.
3. **`cms/sanity.config.ts`'s `name: 'nhatrang-travel'`** — chưa đổi, rủi ro thấp nhưng chưa kiểm chắc. Xem mục 3, dòng 3.
4. **R4 fail trong `npm run gate`** — `scripts/validators/r3-r4-post.ts` hardcode cứng danh sách 5 ngôn ngữ (`vi/en/zh/ko/ru`) khi kiểm sitemap, không đọc từ `langs`. Phát hiện trong lúc làm PHA 4 nhưng **không nằm trong 6 pha gốc của gói này** — đã báo cáo, chưa sửa. Nên xử lý cùng đợt với các validator khác nếu có gói kế tiếp.
5. **`scripts/meta-validators/g2-content-model-vs-gatefields.ts` crash** (thiếu file `project/01-CONTENT_MODEL.md`) — lỗi đã biết từ trước (báo cáo rà soát 2026-07-27, mục H3), không phát sinh từ gói này, chưa sửa.
6. **~120 dòng mô tả "ở Nha Trang", "của Khánh Hòa" trong `uiCopy.ts`** — mục #9 trong bảng "còn nợ" của ADR-0021, "nhiều công, ít rủi ro, làm cuối" — chưa làm, ngoài phạm vi 6 pha của gói này.
7. **`src/lib/i18nConfig.ts`, `TRANSLATABLE_FIELDS`, các file action dịch/cào dữ liệu** (`cms/lib/actions/translateAll.tsx`, `cms/components/TranslateFieldControl.tsx`, `cms/components/SynthTool.tsx`, `cms/lib/actions/synthData.tsx`) — code vẫn còn nguyên trong repo (chỉ ẩn khỏi Studio, không xoá) theo đúng chủ trương giữ khung của ADR-0021. Không phải "việc chưa làm", ghi chú lại để không ai nhầm là quên xoá.

---

## 6. Trạng thái deploy

- Code: đã push `origin/main` tới commit `75a289b`.
- Site chính: deploy production tại `https://tourdao.vn` (Cloudflare Worker `tourdaovn`), đã xác nhận trực tiếp trên domain thật.
- Sanity Studio: deploy tại `https://tourdaovn.sanity.studio`.
