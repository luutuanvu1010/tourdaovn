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

## QĐ-2026-08-05-07 — Sổ đăng ký control sống ở `docs/governance/`

**Chốt.** Tạo `docs/governance/control-registry.yaml`. Trỏ `control-registry-gate.ts` và `deferred-gate.ts` về `docs/governance/` thay vì `project/governance/`.

**Vì sao `docs/` chứ không phải `playbook/`.** `playbook/` là bản sao khuôn chung, `docs/` là artifact của dự án này. Sổ đăng ký mô tả bộ thực thi cụ thể của tourdaovn nên thuộc `docs/`.

**Cách soạn.** Đọc mã nguồn, không đọc tài liệu. `level` lấy từ `VALIDATOR_LEVELS`, `PY_VALIDATOR_LEVELS`, `R_VALIDATOR_LEVELS` trong chính các module thi hành, vì bảng trong `04-CONSTRAINTS` là ý định còn mã là thực tế. Đã đối chiếu: cả 19 validator I, 8 PY và R1/R2 đều tồn tại thật dưới dạng hàm.

**Kết quả.** `control-registry-gate` báo `Registry coherent: 31 controls`.

---

## ND-003 — Đã đóng, thay bằng ND-004 và ND-005

Phiếu nợ soạn `control-registry.yaml` đã hoàn thành 2026-08-05, xem QĐ-2026-08-05-07. Nhưng việc soạn nó phơi ra hai khoản nợ mới, ghi riêng bên dưới.

---

## ND-004 — Chưa có `CONTROL_GATES.md` cấp dự án, vòng đối chiếu chéo là no-op

**Trạng thái.** Mở.

`control-registry-gate` có một vòng đối chiếu: mọi id được `CONTROL_GATES.md` đánh dấu ✅ live phải có mặt trong sổ đăng ký và không được là `gap`. Bản `CONTROL_GATES.md` duy nhất trong repo nằm ở `playbook/governance/`, dài 32 dòng, là khuôn chung mô tả khái niệm ba tầng cổng, và **không có dấu ✅ nào**. Nên `documentedLiveIds()` trả tập rỗng và vòng này hiện không kiểm gì.

Ngoài ra chín gate sau đang chạy thật nhưng chưa vào sổ vì id của chúng không xuất phát từ `04-CONSTRAINTS` và chưa có tài liệu nguồn: `STACK-S23`, `BM-ORPHAN-REGION`, `BM-EMPTY-REGION`, `S24-UPDATED-HTML`, `S24-AUTHORITY-HTML`, `S25-FIVE-LANGUAGE-COVERAGE`, `I-FAQ-TYPE`, và hai gate `geo-knowledge`, `entity-layout`.

**Điều kiện trả nợ.** Soạn `docs/governance/CONTROL_GATES.md` cấp dự án, khai từng control là live, delegated, hay advisory. Đây là việc của tầng quản trị, không suy ra được từ mã.

---

## ND-005 — Bộ kiểm ràng buộc pre-build chưa từng chạy được

**Trạng thái.** Mở. Đây là khoản nặng nhất phát hiện trong pha 0.

**Sự việc.** `npm --prefix scripts run validate` chết ngay lúc nhập module:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '<repo>/shared/gates/index.js'
  imported from scripts/validators/i1-i19.ts
```

`scripts/validators/i1-i19.ts` dòng 10 nhập `../../shared/gates/index.js`. Thư mục `shared/` không tồn tại trong repo này. `validate-constraints.ts` nhập `i1-i19.js` ở dòng 8 nên toàn bộ pipeline chết theo, kéo cả `py1-py8.ts` và `r1-r4.ts`.

**Hệ quả.** 27 trên 31 control không có kiểm máy: toàn bộ I1–I5, I7–I19, PY1–PY7, R1, R2. Chỉ bốn control post-build còn sống là I6, PY8, R3, R4.

**Vì sao lâu nay không ai thấy.** ADR-0022 (2026-08-04) đã gỡ validator khỏi đường phát hành tự động, nên `npm run build` xanh mà không ai chạy `validate`. Và `npm run build:strict` — chuỗi duy nhất có gọi `validate` — cũng chết ở đó nhưng ít khi được chạy.

**Liên quan ND-001.** Cùng một nguyên nhân gốc: `shared/gates` mất tích. `g2` cũng nhập từ đó. Trả được nợ này thì ND-001 nhiều khả năng tự trả theo.

**Điều kiện trả nợ.** Cần chủ dự án quyết một trong hai: khôi phục `shared/gates/index.ts` từ nhatrangtravel nếu nó còn ở đó; hoặc viết lại phần helper entity-local mà `i1-i19.ts` cần, dựa trên `scripts/gate.config.ts`. Cả hai đều là sửa cơ chế cổng, ngoài phạm vi đợt thiết kế lại giao diện.

**Cảnh báo cho cổng QA2.** Trước khi trả nợ này, câu "mọi bất biến dữ liệu đều xanh" không có bằng chứng máy. Đừng dùng nó làm điều kiện ra.

---

## QĐ-2026-08-05-08 — Hoãn khôi phục `shared/gates` tới sau pha B

**Chốt.** Không chép `shared/gates` trong đợt này. ND-005 giữ nguyên trạng thái mở.

**Vì sao hoãn thay vì làm ngay.** Chép sang bây giờ buộc phải quyết ngay hai thứ mà chính pha A và pha B sẽ trả lời: `I15` có còn là luật của tourdaovn không (bước 0), và giữa `gateFields` trong `shared/gates` với `scripts/gate.config.ts` thì cái nào là nguồn duy nhất cho field bắt buộc (bước 1). Làm trước hai câu đó là chép rồi phải sửa lại. Làm sau là chép một lần, đúng luôn.

**Cái giá đã cân và chấp nhận.** 27 bất biến dữ liệu không có kiểm máy trong suốt đợt thiết kế lại. Chấp nhận được vì đợt này đụng bề mặt chứ không đụng mô hình dữ liệu, và đúng những validator phục vụ bề mặt thì đang sống và xanh: `entity-layout-post`, `BM-ORPHAN-REGION`, `BM-EMPTY-REGION`, `S24-UPDATED-HTML`, `S24-AUTHORITY-HTML`, `I6`, `R3`, `R4`.

**Ràng buộc kèm theo.** Cho tới khi ND-005 được trả, cấm dùng câu "mọi bất biến dữ liệu đều xanh" làm điều kiện ra của QA2. Điều kiện ra chỉ được viện dẫn đúng những control đang `live` trong `docs/governance/control-registry.yaml`.

**Ai chốt.** Chủ dự án, 2026-08-05.

---

## QĐ-2026-08-05-09 — Ảnh baseline do chủ dự án chụp tay

**Chốt.** Việc 0.6 do chủ dự án tự chụp, không thêm dependency, không dùng tiện ích Chrome.

**Vì sao không dùng tiện ích Chrome.** Đã thử năm lần trên hai cấu hình, kể cả sau khi cấp quyền `localhost` và chọn đúng trình duyệt. Điều hướng và đổi kích thước cửa sổ chạy được, nhưng mọi lệnh chụp đều trả `Script injection timed out after 5000ms`, kể cả trên trang `/404.html` gần như không có script. Không phải do trang.

**Vì sao chưa cài playwright.** Nó sẽ được quyết ở pha F, nơi nó trả cả hai món: vòng so trang đã code với mockup đã duyệt, và đo Lighthouse cho QA2 vốn hiện cũng không có công cụ. Thêm phụ thuộc bây giờ chỉ để chụp chín tấm ảnh là trả giá sớm mà nhận ít.

**Ai chốt.** Chủ dự án, 2026-08-05.

---

## QĐ-2026-08-05-10 — Bỏ hẳn việc 0.6, thay thế QĐ-2026-08-05-09

**Chốt.** Không chụp ảnh baseline. Xoá `docs/evidence/2026-08-05-baseline/screenshots/`. Việc 0.6 đóng, không chuyển thành phiếu nợ.

**Thay thế** QĐ-2026-08-05-09 (ảnh baseline do chủ dự án chụp tay). Mục cũ giữ nguyên văn theo luật sổ chỉ thêm.

**Vì sao đổi ý.** Lý do cấp bách mà tác nhân đưa ra ban đầu là sai. Tác nhân khai rằng bộ ảnh "trước" chỉ chụp được trước khi động vào code, nên phải làm ngay ở pha 0. Sai: mọi thứ đều trong git, bất cứ lúc nào cũng `git checkout` về commit trước rồi build và chụp. Không có gì mất đi.

**Yêu cầu E2 vẫn được đáp ứng.** `GOVERNANCE` dòng 110 đòi E2 cho visual regression, nhưng dòng 132 định nghĩa E2 là "screenshot diff, diff PR, render preview" — ba cách, không riêng screenshot. Dự án đã có `npm run deploy:preview` dựng bản preview Cloudflare, tức đã có sẵn một dạng E2 hợp lệ.

**Giá trị còn lại của bộ ảnh, đã cân và thấy mỏng.** Làm mốc bắt hồi quy thì vô dụng vì đợt này thay đổi toàn bộ có chủ ý. Làm đầu vào cho Claude Design thì `docs/design-context/COMPONENT_INVENTORY.md` và bản site đang chạy đã phục vụ. Bắt thay đổi ngoài ý muốn ở pha G thì có giá trị, nhưng mốc "trước" khi đó phải là trạng thái ngay trước pha G, không phải hôm nay.

**Việc thật sự đáng làm, dời sang pha F hoặc G.** Vòng lặp có giá trị là so trang đã code với **mockup đã duyệt**, không phải so với giao diện cũ sắp bị vứt. Quyết công cụ ở pha F, nơi playwright trả cả món đó lẫn Lighthouse cho QA2.

**Ai chốt.** Chủ dự án, 2026-08-05.

---

## ND-001 — g2 không có kiểm máy cho bất biến field bắt buộc

**Trạng thái.** Mở.

**Nội dung nợ.** `g2` bị tắt theo QĐ-2026-08-05-03. Không có gì kiểm chéo giữa `01-CONTENT_MODEL.md` §2 và enforcement thật về việc field nào bắt buộc trên mỗi entity. Nếu hai nguồn lệch, entity thiếu field có thể được publish, hoặc entity đủ field bị chặn oan, mà không ai biết.

**Điều kiện trả nợ.** Cần một trong hai: mở rộng `scripts/gate.config.ts` để diễn tả được gate có điều kiện rồi port `g2` sang; hoặc viết lại `g2` cho hình dạng hiện có và chấp nhận nó chỉ kiểm phần không điều kiện, với điều kiện phải khai rõ trong output là nó không kiểm điều kiện.

**Không nên gộp vào đợt thiết kế lại giao diện.** Đây là sửa cơ chế cổng, khác tầng với bề mặt.

---

## QĐ-2026-08-05-11 — Chuỗi validator chạy hết rồi mới quyết đỏ/xanh

**Quyết định.** Thay chuỗi `&&` trong `validate:post` và `audit:spec` bằng một runner gom kết quả: `scripts/run-gates.mjs`. Nó chạy hết mọi validator, in output của từng cái, rồi in bảng tổng kết và thoát 1 nếu có bất kỳ cái nào đỏ. Thêm `gate:all` chạy cả hai nhóm; `npm run gate` gọi nó.

**Đây không phải nới cổng.** Một validator đỏ vẫn làm cả lệnh đỏ, mức `fail` không đổi, không control nào bị hạ xuống `warn`. Thay đổi duy nhất là từ "dừng ở lỗi đầu tiên" sang "báo đủ mọi lỗi". Nói cho gọn: cùng một kết luận, nhiều thông tin hơn.

**Vì sao cần.** `deferred-gate` nằm cuối `validate:post` và luôn đỏ vì ND-005 chưa trả. Với chuỗi `&&`, `npm run gate` chết ở đó, nên `audit:spec` không bao giờ chạy — hai meta-validator `g1`/`g3` vừa sửa ở pha 0 không được cổng gọi tới lần nào. Cùng hình dạng ở chuỗi `audit:spec`: `g1` đỏ thì `g3`/`g4` im, mà file báo cáo cũ của chúng vẫn nằm trong `scripts/reports/` nói "pass" — đúng cái bẫy DR-001 mô tả.

**Cái giá.** Không đáng kể. Đo trên máy chủ dự án: mười validator chạy hết mất khoảng 2 giây. Chuỗi `&&` hôm nay chỉ nhanh hơn vì nó bỏ cuộc sớm.

**Bằng chứng.** Trước: `npm run gate` in một dòng `thiếu validator-status.json` rồi thoát 1. Sau: bảng mười dòng, 9 xanh và 1 đỏ ở `deferred-gate`, và `audit:spec` thật sự chạy. Đã kiểm cả mã thoát: có cái đỏ trả 1, toàn xanh trả 0, tên nhóm sai trả 2.

**Ai chốt.** Chủ dự án, 2026-08-05, sau `/code-review` trên sáu commit pha 0.

---

## QĐ-2026-08-05-12 — Điều hướng theo dòng dịch vụ, khai trong `site.config.ts`

**Chốt.** Menu chính tổ chức theo dòng dịch vụ công ty bán, khai trong khối `nav` ở
`src/site.config.ts`. Ba hub cũ (Khám phá / Lưu trú / Đi lại) rời khỏi menu, **giữ nguyên
URL**. Chi tiết kiến trúc ở `ADR-0023`; spec thi hành ở
`docs/specs/SPEC-pha-C-cay-url-theo-dich-vu.md`.

**Menu chốt.** Tour & Vé (nhóm thả xuống: Tour đảo Nha Trang, Tour Hòn Tằm, Tour Mini
Beach, Vé VinWonders, KongForest, Tắm bùn Tháp Bà, i-Resort) · Kinh nghiệm du lịch · Đặt vé
trực tuyến · Hỗ trợ · Liên hệ.

**Vì sao.** Site dựng từ engine `nhatrangtravel` nên điều hướng tổ chức theo chủ đề du
lịch, trong khi chủ thể là một doanh nghiệp bán dịch vụ. `/tour/` — dòng sản phẩm chính —
không có mặt trên menu và đứng thứ 12 trên 14 khối trang chủ, sau cả `specialties` là danh
mục đã tắt.

**Ba việc trả kèm.** DR-007 (điều hướng hardcode ba chỗ). Phiếu nợ "chỗ đặt link" mà
`01-CONTENT_MODEL` §2.15 tự ghi nhận khi bàn trang lộ trình đón khách. Và hợp đồng
`06-BINDING_MAP` §2 vốn khai "Header điều hướng | config (build)".

**Giữ `/cam-nang/`.** Nhãn menu đổi thành "Kinh nghiệm du lịch", đường dẫn không đổi. Nhãn
và đường dẫn không bắt buộc trùng nhau, mà `/cam-nang/` đã có bài lên Google; đổi segment là
quyết định SEO một chiều, tách ra làm riêng nếu cần.

**Ai chốt.** Chủ dự án, 2026-08-05.

---

## QĐ-2026-08-05-13 — Trang tĩnh sinh từ `siteSettings`, chưa mở entity `page`

**Chốt.** `/lien-he/` và `/ho-tro/` sinh từ `siteSettings`, theo khuôn `/lo-trinh-don-khach/`
đã có. Thêm đúng một field `support` (ba phần: `bookingGuide`, `cancellationPolicy`, `faq`).
`/lien-he/` không cần field mới. **Không** mở entity `page` ở đợt này.

**Vì sao không mở entity.** Thêm `_type` là cửa một chiều theo `01-CONTENT_MODEL` §5.3, chạm
điều cấm `04-CONSTRAINTS` §2.1, kéo theo họ validator `I` phải sửa. Thêm field vào một
singleton đã có chỉ cần thủ tục §2.2 và đảo ngược được. Với đúng hai trang, cái giá của
entity không mua được gì.

**Vì sao không mượn `article`.** JSON-LD sẽ phát `Article` cho một trang liên hệ, trong khi
schema.org có `ContactPage`. Site này đầu tư vào dữ liệu có cấu trúc (I6 là cổng `fail`, có
`llms.txt` và `/ai/*.json`); làm bẩn nó để tiết kiệm một field là đổi sai chiều.

**Ngưỡng mở lại.** Tới trang tĩnh thứ ba thì dừng thêm field, xét entity `page` — lúc đó ADR
sẽ có căn cứ thật thay vì suy đoán trước.

**Thứ tự thao tác đã tuân.** `01-CONTENT_MODEL` §2.15 sửa trước (v1.0.14), rồi bản ghi này,
rồi mới tới `cms/schemas/` và code. Đúng `04-CONSTRAINTS` §2.2 điều cấm 2.

**Ai chốt.** Chủ dự án, 2026-08-05.

---

## QĐ-2026-08-05-14 — Mục điều hướng phải trỏ vào trang có thật, mức `fail`

**Chốt.** Thêm phép kiểm lúc build: mọi `target` trong `nav` phải trỏ tới một trang mà lần
build đó **thực sự sinh ra**. Vi phạm thì build dừng.

**Đây là siết thêm, không phải nới**, nên tự do theo `04-CONSTRAINTS` §5. Không control nào
bị hạ mức, không cổng nào bị bỏ.

**Vì sao cần.** Sáu trên bảy sản phẩm trong menu chốt chưa có document trong Sanity. Không
có phép kiểm này thì khai một mục menu quá sớm sẽ lên production rồi khách bấm vào trang
trắng. Có nó, build dừng ngay trên máy. Cùng triết lý với gói dữ liệu thiếu (`114010a`): đẩy
lỗi lên sớm nhất có thể, và biến lỗi im lặng thành lỗi ồn ào.

**Hệ quả về thứ tự làm việc, đã cân và chấp nhận.** Menu **không thể khai trước nội dung**.
Nhập liệu trước, khai menu sau. Đây là tính năng, không phải hạn chế.

**Ai chốt.** Chủ dự án, 2026-08-05.

---

## ND-006 — Đưa đón sân bay chưa có chỗ trong mô hình dữ liệu

**Trạng thái.** Mở, chờ chủ dự án.

Đưa đón sân bay là một trong sáu dòng dịch vụ công ty bán, nhưng không có entity nào chứa
được nó. `ADR-0002`, `ADR-0006` và `01-CONTENT_MODEL` dòng 57 đều chốt vận tải không phải
entity ở phase 1, xử bằng `Article articleType=transport-guide`. `04-CONSTRAINTS` §2.1 thi
hành ở mức `fail`.

**Điều kiện kích hoạt đã đủ.** `01-CONTENT_MODEL` dòng 57 đặt điều kiện mở entity `Transfer`
là "có booking cộng dữ liệu tuyến thật". Công ty nay bán đưa đón thật, và
`siteSettings.pickupPoints` cùng trang `/lo-trinh-don-khach/` đã tồn tại trong repo (đang
tắt ở `devPages`).

**Điều kiện trả nợ.** Chủ dự án quyết một trong ba: mở entity `Transfer` (cửa một chiều,
cần ADR); bật trang lộ trình đã có và coi đó là đủ; hoặc giữ dạng bài Cẩm nang. Chủ dự án
chốt hoãn 2026-08-05, không thuộc phạm vi pha C.

---

## ND-007 — Khách sạn và resort không có lối vào từ menu

**Trạng thái.** Mở, chờ có nội dung.

Chủ dự án xác nhận vẫn bán phòng khách sạn 5 sao và resort, nhưng menu chốt ở
`QĐ-2026-08-05-12` không có mục nào cho nó. Hiện chưa lộ ra vì `/khach-san/`, `/resort/` và
`/luu-tru/` đều **0 document**, đang hiện khối "chưa có nội dung".

**Vì sao không tự thêm.** Menu do chủ dự án chốt; thêm một mục không được yêu cầu là tác
nhân tự mở rộng phạm vi (`GOVERNANCE` 3.6).

**Ba đường khi có nội dung.** (1) Thêm mục "Khách sạn & Resort" → `/luu-tru/`, hub đã có sẵn
và gom cả hai. (2) Đưa vào nhóm "Tour & Vé" — nhưng nhóm đó đang là danh sách sản phẩm cụ
thể, thêm một mục dạng danh sách vào sẽ lệch khuôn. (3) Không lên menu chính, vào từ khối
trang chủ và chân trang.

Cho tới lúc đó `/luu-tru/` vẫn sống và vẫn trong sitemap, chỉ không có lối vào từ menu.

---

## QĐ-2026-08-05-15 — `g3` đọc thẳng `06-BINDING_MAP.md`, đóng DR-027

**Chốt.** `g3-binding-map-vs-template.ts` parse thẳng bảng trong `06-BINDING_MAP.md` thay vì giữ bản chép tay trong mã. Bản ánh xạ thành nguồn duy nhất cho hợp đồng "code khớp đặc tả bề mặt".

Chủ dự án chọn hướng 1 trong ba hướng đã trình, 2026-08-05.

**Hai quy ước máy đọc được**, khai ở `06-BINDING_MAP` §1:
- tên field Sanity viết trong dấu backtick ở cột "Dữ liệu nuôi"; chữ ngoài backtick là văn xuôi
- vùng không áp dụng cho entity nào ghi theo khuôn `không áp dụng: <entity>, <entity>`

**Kèm theo.** `g3` bỏ qua entity đang tắt trong `site.config.ts` — template của chúng còn trong repo để không gãy tham chiếu, nhưng không thuộc hợp đồng đang hiệu lực; bảng ánh xạ của chúng cũng nằm ở phụ lục §8. Bộ dò field mở rộng để thấy dạng ép kiểu `(data as ResortResult).beachfront`, nếu không sẽ báo câm nhầm cho vùng có render thật.

**Vì sao không cần ADR.** Quyết định này không đổi **cái gì được kiểm**, chỉ làm cho phép kiểm đọc đúng tài liệu mà nó vốn mang tên. Là sửa một khiếm khuyết, không phải chọn kiến trúc mới, và theo `04-CONSTRAINTS` §5 thì siết thêm là tự do. Bản ghi này đủ để truy vết.

**Bằng chứng hai chiều.** Bỏ một dòng khai báo khỏi bảng markdown → `g3` sinh thêm 6 cảnh báo (15 lên 21). Trả lại → về đúng 15. Trước khi sửa, thí nghiệm ngược đã chứng minh chiều còn lại: khai bù đủ field vào markdown mà `g3` vẫn ra đúng 40 cảnh báo không đổi.

**Kết quả.** 40 cảnh báo đo trên bản chép cũ → **15 cảnh báo đo trên tài liệu thật**, 0 lỗi. Baseline 15 ghi ở `06-BINDING_MAP` §7.1 để lần sau đo được tăng hay giảm.

**Còn nợ.** `g1-content-model-vs-schema.ts` có đúng cùng khuôn — vẫn chép cứng bảng field thay vì đọc `01-CONTENT_MODEL.md`. Chưa xử trong đợt này.
