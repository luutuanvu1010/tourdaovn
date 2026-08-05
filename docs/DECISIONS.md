# DECISIONS — sổ quyết định

> Sổ chỉ thêm, không sửa, không xoá. Một quyết định đã ghi thì ở lại nguyên văn; đổi ý thì ghi một mục mới supersede mục cũ, không sửa mục cũ. Căn cứ: `04-CONSTRAINTS` §2.5, `GOVERNANCE` 6.2.
>
> Mục nào đủ lớn để đổi cách vận hành lâu dài thì phải lên ADR trong `docs/adr/`, không dừng ở đây. Sổ này dành cho quyết định vận hành và phiếu nợ.

Quy ước mã: `QĐ-<ngày>-<số>` cho quyết định, `ND-<số>` cho phiếu nợ.

---

## QĐ-2026-08-05-01 — Uỷ quyền sửa hạ tầng kiểm chứng trước cổng QA1

**Bối cảnh.** Đợt thiết kế lại giao diện cần cổng QA1 và QA2 hoạt động. Nhưng `npm run audit:spec` đang chết vì ba meta-validator đọc thư mục `project/` không tồn tại ở repo này. Kéo theo `npm run gate` cũng chết. Nghĩa là `g3`, bộ kiểm "code có khớp `06-BINDING_MAP` không", chưa từng chạy được.

**Câu hỏi.** Sửa validator có tính là "Code chạy khi chưa qua QA1" theo `GOVERNANCE` 4.2 không?

**Chốt.** Không tính. Đây là sửa hạ tầng kiểm chứng, không phải sửa sản phẩm. Cùng loại với quyền dùng để bảo vệ kiểm soát ở `GOVERNANCE` 7.2.

**Ai chốt.** Chủ dự án, qua việc duyệt kế hoạch có chứa pha 0 ngày 2026-08-05.

**Phạm vi được phép.** Chỉ `scripts/meta-validators/*.ts` và mục `audit:spec` trong `scripts/package.json`. Không đụng `src/`, không đụng `cms/`.

**Ghi chú.** `GOVERNANCE` 3.6 cấm tác nhân tự nới quyền bằng diễn giải, nên quyết định này được ghi thành văn thay vì để trong hội thoại.

---

## QĐ-2026-08-05-02 — Sửa đường dẫn spec trong g1 và g3

**Chốt.** Đổi `resolve(REPO_ROOT, 'project', ...)` thành `resolve(REPO_ROOT, 'docs', 'core-specs', ...)` ở `g1-content-model-vs-schema.ts` và `g3-binding-map-vs-template.ts`.

**Vì sao.** `project/` là quy ước thư mục của nhatrangtravel. Ở tourdaovn spec sống ở `docs/core-specs/`. Đây là sửa đường dẫn thuần, không đổi ngữ nghĩa kiểm tra nào.

**Kết quả kiểm chứng.** Sau khi sửa, `g1`, `g3`, `g4` chạy được và không có drift mức fail. Baseline lưu tại `docs/evidence/2026-08-05-baseline/`.

Xem `DRIFT_LOG.md` mục DR-001.

---

## QĐ-2026-08-05-03 — Tắt g2 khỏi chuỗi audit:spec

**Chốt.** Gỡ `g2-content-model-vs-gatefields.ts` khỏi chuỗi `audit:spec`. File giữ lại, không xoá. Ghi phiếu nợ ND-001.

**Vì sao không trỏ sang `scripts/gate.config.ts`.** Hai file khác hình dạng, không phải khác đường dẫn. `g2` đọc `gateFields: Record<string, GateDef>` có `conditional` và `conditionalExpression`. `GATE.requiredFields` chỉ là `Record<string, string[]>` phẳng, không diễn tả được điều kiện. Port sang sẽ làm phần kiểm gate có điều kiện lặng lẽ thành vô hiệu. Một validator xanh mà kiểm ít hơn trước nguy hiểm hơn một validator tắt hẳn, vì nó tạo ra niềm tin sai.

**Đánh đổi đã chấp nhận.** Bất biến "CONTENT_MODEL và enforcement khớp nhau về field bắt buộc" hiện không có kiểm máy. Đổi lại, `g3` chạy được, và `g3` là bộ kiểm mà đợt thiết kế lại cần nhất.

**Ai chốt.** Chủ dự án, 2026-08-05.

---

## QĐ-2026-08-05-04 — Đồng bộ danh sách @type hợp lệ cho organization trong I6

**Chốt.** Thêm `TravelAgency` vào `DETAIL_ENTITY_TYPES.organization` trong `scripts/validators/jsonld-post.ts`.

**Vì sao validator sai chứ không phải code.** `01-CONTENT_MODEL.md` dòng 50, 375, 381 và `05-URL_MAP` dòng 118 đều khai @type của Organization là "TravelAgency hoặc Organization theo `orgType`". `ORG_TYPE_MAP` trong `src/lib/serialize/organization.ts` thi hành đúng vậy. Chỉ danh sách trong validator là chưa đồng bộ. Cùng loại lỗi đã được xử trước đó cho `event`, nơi validator liệt đủ subtype kèm chú thích đồng bộ.

**Kết quả.** I6 chuyển từ fail sang pass.

---

## QĐ-2026-08-05-05 — R4 đọc danh sách ngôn ngữ từ site.config

**Chốt.** `scripts/validators/r3-r4-post.ts` giữ bảng prefix đủ 5 ngôn ngữ nhưng lọc danh sách ngôn ngữ đang bật qua `langs` nhập từ `src/site.config.ts`.

**Vì sao.** ADR-0021 chốt `site.config.ts` là nguồn sự thật duy nhất về phạm vi site, gồm ngôn ngữ. Validator trước đây hardcode cả 5 nên đòi `sitemap-en/zh/ko/ru` trên một site `vi`-only và luôn fail 8 lỗi. File này vốn đã nhập `site` từ cùng module, chỉ là bỏ sót `langs`.

**Kết quả.** R4 chuyển từ fail sang pass. Hành vi bắt lỗi không nới: một trang lạc ở `/en/` vẫn bị `langForPath` trả `null` và bị bắt.

---

## QĐ-2026-08-05-06 — robots.txt sinh build-time bằng endpoint

**Chốt.** Thêm `src/pages/robots.txt.ts`, không phải `public/robots.txt` tĩnh.

**Vì sao.** Site không có robots.txt nào. Đây là thiếu sót thật, không phải validator đòi hỏi vô lý. Chọn endpoint vì dòng `Sitemap:` phải mang tên miền thật, mà tên miền là `site.url` trong `site.config.ts`. File tĩnh sẽ buộc hardcode tên miền lần thứ hai, phá quy tắc một nguồn sự thật. Cùng khuôn với `llms.txt.ts` và `sitemap.xml.ts`.

**Nội dung.** Mở toàn bộ, trỏ tới sitemap index. Không chặn AI crawler: site này chủ động mời chúng qua `llms.txt` và `/ai/*.json`, và `05-URL_MAP` mục 1.1 quyết định nền 8 khai "mọi trang publish đều index".

**Lưu ý phạm vi.** Đây là sửa code sản phẩm trước cổng QA1, rộng hơn phạm vi QĐ-2026-08-05-01. Được chủ dự án cho phép 2026-08-05 khi chọn "đi hết, làm xanh toàn bộ" cho pha 0.

**Kết quả.** `geo-knowledge-post` chuyển từ fail sang pass.

---

## ND-002 — `contentProvenance` trống trên document Công ty TNHH Tour Đảo

**Trạng thái.** Mở, chờ chủ dự án.

`governance-post` gate `S24-AUTHORITY-HTML` fail vì trang `/cong-ty/cong-ty-tnhh-tour-dao/` không có `data-content-provenance`. Nguyên nhân là dữ liệu, không phải code: document trong Sanity có `contentProvenance: null`.

**Vì sao tác nhân không tự điền.** `cms/schemas/baseFields.ts` dòng 152 khai rõ đây là chủ ý: "`contentProvenance` thì KHÔNG tự điền, thiếu nó là fail cổng". Trường này tồn tại để một con người tuyên bố nguồn gốc nội dung. Tác nhân điền hộ là vô hiệu hoá đúng thứ control đó sinh ra để bảo vệ. Ngoài ra `.env` chỉ có token đọc.

**Việc cần làm.** Chủ dự án mở Sanity Studio, đặt `contentProvenance` cho document "Công ty TNHH Tour Đảo" thành một trong `human`, `ai-t1`, `mixed`.

**Phát hiện kèm theo, cần bạn xem.** Có một document `organization` tên "TNHH Tour đảo Nha Trang" mang slug `tour-3-dao-nha-trang-review-chi-tiet`. Slug này trùng khuôn slug của bài viết và tour, không giống slug một công ty, và đang sinh ra trang `/cong-ty/tour-3-dao-nha-trang-review-chi-tiet/`. Nghi là nhập nhầm, cần chủ dự án xác nhận.

---

## ND-001 — g2 không có kiểm máy cho bất biến field bắt buộc

**Trạng thái.** Mở.

**Nội dung nợ.** `g2` bị tắt theo QĐ-2026-08-05-03. Không có gì kiểm chéo giữa `01-CONTENT_MODEL.md` §2 và enforcement thật về việc field nào bắt buộc trên mỗi entity. Nếu hai nguồn lệch, entity thiếu field có thể được publish, hoặc entity đủ field bị chặn oan, mà không ai biết.

**Điều kiện trả nợ.** Cần một trong hai: mở rộng `scripts/gate.config.ts` để diễn tả được gate có điều kiện rồi port `g2` sang; hoặc viết lại `g2` cho hình dạng hiện có và chấp nhận nó chỉ kiểm phần không điều kiện, với điều kiện phải khai rõ trong output là nó không kiểm điều kiện.

**Không nên gộp vào đợt thiết kế lại giao diện.** Đây là sửa cơ chế cổng, khác tầng với bề mặt.
