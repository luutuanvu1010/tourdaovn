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

---

## QĐ-2026-08-06-01 — Chốt bước 0, và gỡ luật I15

**Chốt.** Chủ dự án trả lời trọn năm câu của `00-PROJECT_BRIEF` §8 ngày 2026-08-06. Bước 0 đóng.

- **Nguồn tiền:** vừa tự vận hành tour, vừa bán lại hưởng hoa hồng. Hệ quả lên dữ liệu: `Tour.operator` của sản phẩm bán lại phải trỏ đơn vị vận hành thật, không trỏ về Tour Đảo.
- **Khách:** khách lẻ và khách đoàn.
- **Khác biệt:** xe đưa đón, hướng dẫn viên đi cùng, giá tốt, thanh toán linh hoạt.
- **Mốc ra mắt:** 2026-08-09, cần 4 sản phẩm có trang đầy đủ.
- **I15:** không còn là luật của tourdaovn.

**Gỡ I15 là nới ràng buộc**, nên theo `04-CONSTRAINTS` §5 cần chủ dự án phê chuẩn kèm lý do ghi ở đây. Lý do: dòng đó tự đánh dấu 🔧 SITE-SPECIFIC là luật địa danh riêng của nhatrangtravel (cải cách hành chính), không áp cho site này. Không control nào khác bị hạ mức. Gỡ I15 cũng bỏ một trong hai câu hỏi mà `QĐ-2026-08-05-08` nêu là điều kiện trả nợ ND-005.

**Một chỗ tác nhân không viết theo nguyên văn.** Chủ dự án nói "giá tốt nhất thị trường". Luật Quảng cáo 2012 Điều 8.11 cấm quảng cáo so sánh trực tiếp với sản phẩm cùng loại của đơn vị khác. Site viết "giá tốt", không dùng dạng so sánh tuyệt đối. Ghi ở `00-PROJECT_BRIEF` §3. Chủ dự án muốn giữ nguyên câu gốc thì cần chốt lại thành văn kèm chấp nhận rủi ro.

**Hai ngưỡng chưa đặt.** Chuyển đổi và tìm kiếm — mốc 3 ngày quá ngắn để đo. Đặt lại sau khi site sống một tháng.

---

## QĐ-2026-08-06-02 — Trang chủ tourdao.vn chuyển tạm sang tourdaonhatrang.com bằng `_redirects`

**Bối cảnh.** Site chưa tới mốc ra mắt 2026-08-09 (`QĐ-2026-08-06-01`) nhưng `tourdao.vn` đã sống và phục vụ bản chưa hoàn thiện. Chủ dự án muốn khách vào trang chủ được đưa sang `tourdaonhatrang.com` cho tới khi công bố.

**Đã thử và thất bại: Page Rules.** Hai lần cấu hình độc lập đều không kích hoạt. Nguyên nhân gốc có tài liệu Cloudflare chống lưng: `tourdao.vn` do Worker phục vụ, và khi request khớp Worker route thì Cloudflare **vô hiệu hoá** 18 Page Rules, trong đó có `Forwarding URL` và `Always Use HTTPS` — bảng hành vi ghi rõ `Client → Worker = Rule Ignored`. Luật không sai; nó không bao giờ được chạy. Bằng chứng độc lập: `http://tourdao.vn/` trả `200` không nâng HTTPS, đúng dự đoán của cùng cơ chế.

**Chốt.** Dùng `public/_redirects`, một dòng, chỉ khớp `/`:

```
/    https://tourdaonhatrang.com/    302
```

File này nằm trong chính lớp phục vụ asset của Workers Static Assets nên không đi qua tầng Rules, không thể bị Worker nuốt. Tài liệu Cloudflare xác nhận *"Redirects are always followed, regardless of whether or not an asset matches the incoming request"* — nên nó thắng `index.html` đang tồn tại ở `/`.

**Vì sao 302, không phải 301.** Đây là trạng thái tạm. 301 bị trình duyệt và Google cache dai, là cửa một chiều. 302 gỡ dòng là hoàn nguyên tức thì.

**Vì sao chỉ trang chủ.** Giữ phạm vi hẹp nhất còn đạt mục tiêu. Trang con vẫn sống, sitemap không đổi.

**Không vi phạm R3/R4.** Validator R3 chỉ fail khi một URL **biến mất khỏi sitemap** (`r3-r4-post.ts` dòng 219–220: `if (newSitemap.has(url)) continue`). Trang chủ vẫn build, vẫn nằm trong `sitemap-vi.xml`, nên vòng lặp bỏ qua. R4 cũng pass vì file `dist/index.html` vẫn tồn tại và hreflang vẫn phát. R3 fetch `/sitemap.xml` của production và fail-closed nếu hỏng — dòng redirect chỉ khớp `/` nên không đụng đường dẫn đó; đã kiểm `https://tourdao.vn/sitemap.xml` trả `200`.

**Ghi drift có chủ đích.** `public/_redirects` cho tới nay là công cụ thi hành R3, header tự khai như vậy. Dòng này **không phải dòng R3** mà là điều hướng hạ tầng tạm thời. Trộn hai mục đích trong một file, nên tách phần trong header và ghi bản quyết định này để truy vết. Không mở nguồn sự thật thứ hai: đây vẫn là file duy nhất giữ mọi luật chuyển hướng của site.

**Vì sao không cần ADR.** Không đổi kiến trúc, không đổi cái gì được kiểm, không đổi cây URL. Là một biện pháp vận hành tạm thời có ngày hết hạn.

**GỠ KHI.** Site công bố, mốc 2026-08-09. Gỡ bằng cách xoá dòng và Phần 2 của header, rồi deploy. Không cần thao tác nào trên dashboard Cloudflare.

**Còn nợ.** `package.json` khai `deploy` bằng `wrangler pages deploy --project-name tourdaovn` trong khi `wrangler.toml` là cấu hình Worker (`[assets]`, không có `pages_build_output_dir`) và `tourdaovn.pages.dev` không phân giải được. Chủ dự án xác nhận production là Worker và deploy hiện hành có cập nhật production. Hai khai báo này vẫn không khớp nhau trên giấy — cần rà riêng, không xử trong đợt này.

---

## QĐ-2026-08-06-03 — Nguồn duy nhất cho field bắt buộc, và trả nợ ND-005

**Chốt (pha B, bước 1).** Chuỗi nguồn sự thật cho "field nào bắt buộc":

`01-CONTENT_MODEL` §2 (đặc tả) → `cms/schemas/*.ts` (thi hành) → `scripts/gate.config.ts` (bản dẫn xuất cho validator).

`shared/gates` **không** giữ bảng field bắt buộc riêng. Đây là câu hỏi mà `QĐ-2026-08-05-08` nêu là điều kiện trả nợ ND-005.

**Vì sao không chép nguyên bảng `gateFields` từ nhatrangtravel.** Bảng đó đòi `sameAs`, `body`, `placeType`, `containedInPlace`… Chép sang là âm thầm áp lại luật chặt của site kia, trái quyết định của chủ dự án ngày 2026-08-04 nới toàn bộ điều kiện bắt buộc sang tuỳ chọn ở cả hai tầng (`01-CONTENT_MODEL` v1.0.12). Đúng cái bẫy mà `QĐ-2026-08-05-08` bảo phải trả lời trước khi chép.

**Phần `conditional` cũng bỏ theo.** Nó mã hoá tính bắt buộc của nhatrangtravel, và những gì nó kiểm đã có validator riêng: sameAs theo nhóm attraction là I2, officialSource là I3, experienceType/venue là I13, itinerary/operator là I14.

**`checkI15` gỡ hẳn** — I15 không còn là luật (`QĐ-2026-08-06-01`).

**Kết quả — ND-005 trả xong.** `npm --prefix scripts run validate` chạy được **lần đầu trong đời repo**: 31 validator, **24 pass**, 2 fail, 2 warn, 3 defer. Trước đó toàn bộ chuỗi chết ngay lúc nhập module vì thiếu `shared/gates`, và 27 trên 31 control không có kiểm máy.

Hai lỗi còn lại là **dữ liệu, không phải code**, chủ dự án sửa trong Studio:
- một `organization` thiếu `summary.vi`
- một `article` thiếu `translationGroup`/`language`

**`deferred-gate` vẫn đỏ nhưng vì lý do khác.** Trước: "thiếu validator-status.json — pre-build validate chưa chạy". Nay: "I16 deferred nhưng registry không khai live post-build executor" — thuộc ND-004, không phải ND-005.

**Không đụng đường phát hành.** `build:ci` vẫn là `npm run build`, không gọi `validate` (ADR-0022). Việc `validate` đỏ vì dữ liệu không chặn production.

---

## QĐ-2026-08-06-04 — Bổ sung `QĐ-2026-08-06-02`: bằng chứng thi hành và quy trình gỡ chuyển hướng

Mục này **bổ sung**, không thay thế `QĐ-2026-08-06-02`. Mục kia đã commit nên không được sửa (`04-CONSTRAINTS` §2.5).

**Đã thi hành.** Deploy 2026-08-06, Worker `tourdaovn`, version `4100e5af-4b82-46be-b0d6-ffa0b13b4f71`. Đo trên production:

| URL | Kết quả |
|---|---|
| `https://tourdao.vn/` | `302` một chặng → `https://tourdaonhatrang.com/` (đích `200`) |
| `http://tourdao.vn/` | `302` → cùng đích |
| `https://tourdao.vn/?fbclid=x` | `302` → `.../?fbclid=x` |
| `https://tourdao.vn/sitemap.xml` | `200` |
| `/lien-he/`, `/nha-trang/`, `/robots.txt` | `200` |

`r3-r4-post.ts` pass trên `dist/` mới. Trang chủ vẫn build ra `dist/index.html` và vẫn nằm trong `sitemap-vi.xml` — đó là lý do R3 không đỏ.

**Lưu ý hành vi.** `_redirects` **giữ nguyên query string**, không có tuỳ chọn tắt (khác Redirect Rules). Vô hại, và có lợi cho việc lần nguồn traffic.

### Quy trình gỡ chuyển hướng — làm thủ công

Mốc dự kiến 2026-08-09 khi site công bố (`QĐ-2026-08-06-01`), nhưng gỡ được bất cứ lúc nào. **Không đụng dashboard Cloudflare.**

**Bước 1.** Trong `public/_redirects`, xoá dòng luật:

```
/    https://tourdaonhatrang.com/    302
```

**Bước 2.** Xoá luôn khối chú thích "Phần 2. Điều hướng tạm thời" ngay phía trên. Giữ nguyên Phần 1 — đó là phần R3, không liên quan.

**Bước 3.** Build và deploy:

```
npm run build
npx wrangler deploy
```

Phải là `npx wrangler deploy`. **Không dùng `npm run deploy`** — xem mục "Còn nợ" dưới.

**Bước 4.** Kiểm chứng:

```
for u in "https://tourdao.vn/" "https://tourdao.vn/sitemap.xml" "https://tourdao.vn/lien-he/" "https://tourdao.vn/nha-trang/"; do printf '%-40s ' "$u"; curl -sS -o /dev/null -m 20 -w '%{http_code}\n' "$u"; done
```

Gỡ xong khi **cả bốn trả `200`**. Nếu `/` còn `302` thì deploy chưa tới đích — kiểm lại đã dùng `npx wrangler deploy` chưa.

**Bước 5.** Không cần purge cache Cloudflare. `cf-cache-status: HIT` trên site này là lớp asset của Worker, không phải cache edge. Trình duyệt thì thử bằng tab ẩn danh hoặc `curl` cho sạch.

**Bước 6.** Ghi mục mới trong sổ này để đóng `QĐ-2026-08-06-02`. Không sửa hai mục cũ.

### Vì sao mọi cách trên dashboard đều thất bại — ghi để khỏi thử lại

`tourdao.vn` do Worker phục vụ. Cloudflare vô hiệu hoá 18 Page Rules khi request khớp Worker route, trong đó có `Forwarding URL` và `Always Use HTTPS`. Bảng chính thức: `Client → Worker = Rule Ignored`.

- **Page Rules** — không bao giờ chạy. Đã thử hai lần, hai cấu hình khác nhau, cùng thất bại.
- **Always Use HTTPS** — bật hay tắt cũng vô nghĩa trên hostname này. Đừng mất công vào SSL/TLS.
- **Redirect Rules** — không kiểm chứng được, mục này không có trong dashboard của tài khoản. Trên lý thuyết chạy được vì `http_request_dynamic_redirect` là phase đầu tiên, trước Worker.

Kết luận vận hành: **mọi nhu cầu chuyển hướng của `tourdao.vn` làm trong `public/_redirects`, không làm trên dashboard.**

### Còn nợ — `npm run deploy` hỏng

`package.json` khai `deploy` là `wrangler pages deploy --project-name tourdaovn`, nhưng Pages project đó **không tồn tại** (tài khoản chỉ có `fastbooking-tourdao` và `nhatrangtravel`). Chạy nó sẽ hỏi "Would you like to create it?" — **chọn Create là sai**, sẽ dựng ra đích deploy thứ hai rỗng không phục vụ `tourdao.vn`.

Đường deploy thật là Worker, qua `npx wrangler deploy`, khớp `wrangler.toml`. Diff đề xuất (`"deploy": "wrangler deploy"`) chưa áp vì chạm đường phát hành, chờ chủ dự án duyệt.

---

## QĐ-2026-08-06-04 — Nền trắng, hướng thị giác biển đảo (giải DR-003)

**Chốt.** Chủ dự án 2026-08-06: nền trang **trắng thuần**, hướng thị giác **biển đảo**.

**Giải DR-003.** `07-DESIGN_TOKENS` §1 khai `color.surface = #FFFFFF`; `08-QA_CHECKLIST` B4 khai `#FBF8F3` và cấm nền trắng thuần. Hai spec cùng tầng, cả hai đã phê chuẩn, nên tác nhân không được hoà giải (`GOVERNANCE` 3.5). Chủ dự án chốt: **`07-DESIGN_TOKENS` thắng**, `08-QA_CHECKLIST` B4 sửa theo.

**Đổi màu, có số tương phản kèm theo** — không chọn theo cảm tính:

| Token | Trước | Sau | Chữ trắng trên nền đó |
|---|---|---|---|
| `--c-surface` | #FBF8F3 kem | **#FFFFFF** | — |
| `--c-accent` | #C2410C cam cháy | **#C0392B** san hô | 5.44 ✓ AA |
| `--c-sea` (mới) | — | **#0E7490** vịnh nông | 5.36 ✓ AA |
| `--c-primary` | #0C4A6E | giữ nguyên | 9.46 ✓ |

Coral sáng #E8654E từng có trong runtime chỉ đạt **3.28 — rớt AA**, nên không dùng làm nền CTA. `--c-sand` giữ nhưng cấm làm nền CTA vì cùng lý do.

**Gỡ toàn bộ token và hoạ tiết đất liền.** `--c-land-rice`, `--c-land-forest`, `--c-land-mist`, `--c-sand-paper`, `--pattern-rice-lines` (vạch ruộng lúa), `--pattern-contour-lines` (đường bình độ đồi núi), `--landscape-page-bg`. Đó là nhận diện của một site du lịch nói chung; công ty bán tour biển đảo. Đóng phần lớn DR-002.

**Bảy chỗ trong component còn trỏ vào token đã gỡ** đã thay hết. CSS không báo lỗi khi biến không tồn tại — nó lặng lẽ mất nền, nên phải quét tay.

**Chưa làm ở đợt này:** font vẫn là Be Vietnam Pro + Plus Jakarta Sans (chưa có lý do đổi), và bố cục chưa động tới. `08-QA_CHECKLIST` §B còn giá trị hardcode ở mục liệt kê, cần rà lại khi Design xuất mockup.

---

## QĐ-2026-08-06-05 — Bộ giao diện chọn được trong Sanity Studio

**Chốt.** Chủ dự án 2026-08-06: muốn tự đổi giao diện theo các bộ đã thiết lập sẵn, không cần lập trình viên.

**Cách làm giữ được một nguồn sự thật.** Studio **chỉ CHỌN** một bộ từ danh sách đóng (`siteSettings.theme`, 3 giá trị); **không nhập được giá trị màu**. Màu vẫn chỉ sống ở `src/styles/tokens.css`, khai ở `07-DESIGN_TOKENS` §1b. Nếu cho nhập màu tự do thì bộ token mất tác dụng và cổng QA không còn gì để đối chiếu — đó là ranh giới không vượt.

**Ba bộ:** `bien-sau` (mặc định, nền trắng + biển sâu + san hô), `cat-bien` (nền kem ấm + cam nắng), `ngoc-lam` (nền trắng + xanh ngọc + hồng san hô). Mỗi bộ chỉ đổi bốn token màu gốc; chữ, khoảng cách, bo góc, bóng giữ nguyên — đổi tông chứ không đổi hệ thống.

**Ngưỡng bắt buộc và cách kiểm.** Mọi bộ phải đạt WCAG AA ≥ 4.5 ở bốn cặp. `npm --prefix scripts run check:theme` đọc thẳng `tokens.css` (không giữ bản chép) và thoát 1 nếu có cặp rớt.

Đã chứng minh **hai chiều**: thêm một bộ dùng coral sáng #E8654E → lệnh báo `3.28 ✗ RỚT AA` và thoát 1; gỡ bộ đó → `[pass] 3 bộ`.

**Giá trị lạ không làm vỡ site.** `fetchSiteTheme()` chỉ nhận ba tên hợp lệ, còn lại rơi về mặc định.

**Chưa làm:** nhóm "đưa thêm nội dung vào Studio" (mô tả site, thanh tin cậy, tiêu đề khối) — việc riêng, chưa chạm ở đợt này.

---

## QĐ-2026-08-06-06 — Mở cổng bước 7, giao Claude Design

**Chốt.** Chủ dự án mở cổng bước 7 ngày 2026-08-06 và giao việc cho Claude Design ngay trong phiên đang chạy, không tách phiên riêng.

**Trạng thái cổng lúc mở, ghi thẳng để sau này truy được.** `06-BINDING_MAP` §7 có bảng bốn điều kiện:

| # | Điều kiện | Lúc mở cổng |
|---|---|---|
| 1 | Mọi loại trang thật đều có bảng ánh xạ | ✅ 22 URL phủ bởi §2–§5.9 |
| 2 | Không bảng nào mô tả loại trang không tồn tại | ✅ ba entity tắt đã sang §8 |
| 3 | Mọi field template truy cập đều được khai | ◐ **15 cảnh báo, 0 lỗi** |
| 4 | Bộ kiểm máy đọc đúng file này | ✅ đạt 2026-08-05, DR-027 đã xử |

Chủ dự án **chấp nhận mở cổng với 15 cảnh báo ở điều kiện 3**. `GOVERNANCE` 4.1 để mặc định của cổng là chặn và mức bằng chứng thuộc quyền chủ dự án — nên đây là quyết định hợp lệ, không phải lách cổng. Chi tiết 15 cảnh báo chia ba nhóm ở `06-BINDING_MAP` §7.1; nhóm lớn nhất (9 cảnh báo, vùng "Phân loại") được nêu đích danh trong prompt để Design quyết dựng hay đề xuất bỏ.

**Thứ tự ưu tiên chủ dự án chốt:** trang tour chi tiết → trang chủ → trang danh sách. Lý do: trang tour là trang chốt đơn, và mốc ra mắt 2026-08-09 chỉ còn ba ngày.

**Ranh giới vai giữ nguyên** (`PLAYBOOK` Phần 2): Design ra mockup và đề xuất token, **không** sửa `src/`, `cms/`, `scripts/`. Dựng thật là bước 8.

**Sản phẩm giao ở:** `docs/design/mockups/` và `docs/design/PHA-F-BAN-GIAO.md`.

---

## QĐ-2026-08-06-07 — Duyệt bốn trang đã dựng theo bàn giao bước 7

**Chốt.** Chủ dự án xem trực tiếp bản build thật (`dist/`) ngày 2026-08-06 và duyệt bốn trang: trang chủ, tour chi tiết, địa điểm chi tiết, liên hệ.

**Ba quyết định nội dung nằm trong đợt này:**

- **Tiêu đề trang chủ** đổi từ tên thương hiệu sang câu định vị *"Một đầu mối cho cả chuyến biển đảo Nha Trang"*. Khai ở `brand.headline` trong `site.config.ts` — một nơi duy nhất.
- **Thanh tin cậy** đổi sang bốn điểm khác biệt chủ dự án chốt ở `00-PROJECT_BRIEF` §3, thay câu của engine gốc.
- **Thứ tự khối trang chủ**: sản phẩm trước, nội dung sau. `tours` từ vị trí 12/14 lên vị trí 2. Đây chỉ là mặc định trong code; `siteSettings.sections` vẫn là nơi chốt thật, chủ dự án đổi được trong Studio.

**Một chỗ tác nhân không viết theo nguyên văn, chủ dự án đã biết và duyệt.** Điểm khác biệt thứ ba viết *"Giá tốt — báo giá trọn gói, không phụ thu"* thay vì *"giá tốt nhất thị trường"*. Căn cứ: Luật Quảng cáo 2012 Điều 8.11 cấm quảng cáo so sánh trực tiếp với sản phẩm cùng loại của đơn vị khác. Ghi ở `00-PROJECT_BRIEF` §3.

**Phạm vi chưa dựng, ghi để không rơi.** Bàn giao bước 7 có bảy loại trang; đợt này dựng bốn. Còn: điểm tham quan, trải nghiệm, cẩm nang, danh sách tour. Và Design **không vẽ** trang Liên hệ — trang đó áp lại pattern card của bàn giao, không có mockup để bám.

**Trạng thái cổng lúc duyệt:** `astro check` 0 lỗi 0 cảnh báo · `npm run build` đi hết · `check:theme` 3 bộ đạt AA · `gate:all` 9 xanh / 1 đỏ đúng `deferred-gate` (ND-004).

---

## QĐ-2026-08-06-08 — Duyệt spec trang chủ, dời mốc ra mắt sang 2026-08-10

**Chốt.** Chủ dự án duyệt `docs/specs/SPEC-2026-08-06-trang-chu-xung-tam.md` ngày 2026-08-06. Cổng QA1 mở.

**Phạm vi mở rộng:** bốn field mới trong `siteSettings` (`stats`, `partners`, `testimonials`, `groupQuote`), bố cục lại trang chủ theo hướng A, và dựng nốt bốn loại trang chi tiết còn lại trong bàn giao bước 7.

**Mốc ra mắt dời từ 2026-08-09 sang 2026-08-10.** `00-PROJECT_BRIEF` §6 và §7 đã cập nhật.

**Đánh giá về thời gian, ghi lại nguyên văn để sau này truy được.** Cowork nêu rõ trước khi chủ dự án quyết: gói này gồm sửa mô hình dữ liệu, một vòng Design, dựng lại trang chủ, dựng nốt bốn trang chi tiết, cộng việc chủ dự án nhập số liệu, logo, đánh giá và ảnh thật — và Cowork **không cho là kịp**. Hai đường đã trình: dời mốc đủ xa, hoặc ra mắt trước rồi làm gói này sau.

Chủ dự án chọn **làm đủ**, và đặt mốc mới hơn mốc cũ **một ngày**. Đây là quyết định của chủ dự án trong thẩm quyền của mình (`GOVERNANCE` 3.1). Ghi lại không phải để bàn lại, mà để nếu mốc trượt thì biết nguyên nhân nằm ở phạm vi chứ không phải ở thi hành.

**Hai quyết định kỹ thuật kèm theo:**

- **Bằng chứng gánh trang, không phải catalogue gánh trang.** Dải số liệu đặt ngay dưới hero và không đọc document tour nào, nên 4 sản phẩm hay 40 cũng không lộ. Đây là lời giải cho bài toán thật: site mới, doanh thu đến từ offline/đại lý/OTA.
- **Đánh giá tự đăng không phát JSON-LD `Review` hay `AggregateRating`.** Google cấm rich snippet tự phục vụ; `I6` là cổng mức `fail`. Đánh giá hiện cho người đọc, dẫn nguồn qua `sourceName`/`sourceUrl`.

---

## QĐ-2026-08-06-09 — Bốn field trang chủ, và luật không serialize đánh giá

**Chốt.** Thêm `stats`, `partners`, `testimonials`, `groupQuote` vào `siteSettings`. Thi hành `SPEC-2026-08-06-trang-chu-xung-tam` đã duyệt.

**Vì sao vào `siteSettings` chứ không mở entity.** Cả bốn là dữ liệu singleton toàn site, không có URL riêng, không cần gate publish. Mở `_type` mới là cửa một chiều (§5.3) và kéo theo họ validator `I`. Ngưỡng đã ghi: `siteSettings` sau đợt này có 11 field cấp đầu; tới field thứ mười lăm thì dừng lại xét tách.

**Đánh giá không serialize.** Google cấm rich snippet đánh giá tự phục vụ. Phát `Review`/`AggregateRating` cho nội dung tự đăng là rủi ro phạt thủ công, mà I6 là cổng mức `fail`. Đánh giá hiện cho người đọc; dẫn nguồn qua `sourceName`/`sourceUrl`.

**`stats.value` là chuỗi.** Kiểu số không diễn tả được "50.000+", "4,9/5", "24/7" — những dạng mà một dải số liệu thật cần.

---

## QĐ-2026-08-06-10 — Bốn token chữ mới, và Lora làm chữ hiển thị

**Chốt.** Chủ dự án duyệt cả bốn token Claude Design đề xuất ở vòng thiết kế thứ hai, cộng font Lora:

| Token | Giá trị | Phạm vi dùng |
|---|---|---|
| `--fs-display` | 3,75rem (60px) | **chỉ** câu định vị ở hero trang chủ |
| `--lh-display` | 1,22 | **chỉ** h1 và số của dải số liệu |
| `--ls-eyebrow` | 0,08em | **chỉ** nhãn chữ hoa, luôn đi kèm `--lh-eyebrow` |
| `--lh-eyebrow` | 1,5 | đi kèm `--ls-eyebrow`, không dùng rời |

**Vì sao cần bậc mới.** Thang chữ trước dừng ở 46px. Trên khung 1200px, 46px là cỡ của một tiêu đề mục chứ không phải cỡ của câu định vị. Về line-height: bản đang chạy ép h1 xuống 1,05–1,06, giá trị nằm ngoài token, và ở cỡ hero nó làm dấu ngã dòng dưới chạm dấu nặng dòng trên. Về eyebrow: chữ hoa tiếng Việt vẫn mang dấu, nên nhãn chữ hoa cần cả giãn ngang lẫn giãn dòng — giãn ngang mà không giãn dòng thì dấu bị dòng trên cắt.

**Lora làm chữ hiển thị.** Bài toán của vòng này là *site mới trông vững như công ty lâu năm khi hàng còn mỏng*. Chữ có chân đổi tông từ "công ty công nghệ" sang "công ty lâu năm". Lora đủ bộ dấu tiếng Việt và là font biến thiên 400–700, nên chỉ thêm 2 file (~47 KB).

**Ba cái giá đã biết và chấp nhận:**

1. **Mất hai bậc weight trên heading.** Lora dừng ở 700; `--fw-800` và `--fw-900` bị trình duyệt kẹp về 700, không có gì để tổng hợp giả. Bù độ "chắc chắn" bằng cỡ chữ, không bằng weight.
2. **Be Vietnam Pro không được xoá.** Nó lùi về vai lớp dự phòng, đứng ngay sau Lora trong `--font-display`, để Lora hỏng thì chữ vẫn rơi về một font có dấu tiếng Việt tử tế.
3. **Cân nặng font lên ~220 KB.** Đây là thay đổi hiệu năng: phải đo lại LCP theo ngưỡng `00-PROJECT_BRIEF` mục 6 trước khi công bố. Chưa đo tại thời điểm chốt.

**Nguồn token vẫn là một.** Bốn giá trị mới sống ở `src/styles/tokens.css` và `07-DESIGN_TOKENS.md` §2, không ở component. Mọi phạm vi dùng ghi trong bảng trên là ràng buộc, không phải gợi ý: `--lh-display` ở cỡ chữ thường làm tiêu đề rời rạc.

---

## QĐ-2026-08-06-11 — Nunito làm chữ cho cả trang, thay Lora

**Chốt.** Một font duy nhất cho toàn site: **Nunito**. Cả `--font-display` lẫn `--font-ui` cùng trỏ nó. Gỡ hẳn Lora và Plus Jakarta Sans.

**Vì sao đổi.** Chủ dự án nhìn bản dựng thật rồi yêu cầu "một phông tiếng Việt phổ thông, mềm mại hơn". Lora vừa chốt sáng cùng ngày (QĐ-2026-08-06-10) đọc ra cứng — chữ có chân hợp toà soạn hơn hợp một công ty bán tour biển. Đây là quyết định thẩm mỹ của người có quyền, sau khi thấy hàng thật; ghi lại để không ai đọc lịch sử rồi tưởng là lật lọng.

**Vì sao Nunito.** Ba điều kiện cùng lúc: bo tròn đầu nét nên mềm thật; nằm trong nhóm chữ được dùng nhiều nhất nên mắt người Việt đã quen; đủ bộ dấu tiếng Việt. Á quân là Mulish — cùng nhóm mềm nhưng tiết chế hơn, đổi mất một dòng.

**Vì sao vẫn giữ hai token chữ dù cùng một font.** `--font-display` và `--font-ui` là hai **vai**, không phải hai giá trị. Gộp làm một thì lần sau muốn đổi riêng chữ tiêu đề sẽ phải tách lại từ đầu.

**Ba hệ quả:**

1. **Lấy lại cấp đậm 800.** Nunito biến thiên 400–800, Lora dừng ở 700. Ba chỗ phải hạ xuống 700 hồi đổi sang Lora nay trả về 800. `--fw-900` vẫn bị kẹp — DR-031 thu hẹp chứ chưa đóng.
2. **Nhẹ đi.** Gỡ Lora và Plus Jakarta Sans vì không còn chỗ nào gọi tới. Thư mục font từ ~220 KB xuống **~104 KB**, thấp hơn cả mốc ~140 KB trước cả hai lần đổi chữ.
3. **Be Vietnam Pro ở lại làm lớp dự phòng duy nhất**, không được xoá.

**Còn nợ.** Chưa đo LCP sau hai lần đổi chữ. Lần này cân nặng giảm nên chiều gió thuận, nhưng vẫn phải đo trước khi công bố.

---

## QĐ-2026-08-14-01 — Ảnh thương hiệu ở Sanity, chữ thương hiệu ở lại config

**Chốt.** Thêm field `branding` vào `siteSettings` (`01-CONTENT_MODEL` §2.15 v1.0.17) cho biên tập viên tự tải lên **logo, favicon, ảnh chia sẻ**, cộng một công tắc ẩn chữ tên site cạnh logo. Cửa hai chiều: không thêm document type, không đổi URL nào.

**Vì sao cần.** Logo đang là khối SVG viết cứng, **chép hai bản** ở `Header.astro` và `Footer.astro`. Đổi logo phải nhờ lập trình viên, và sửa một bản quên bản kia là lệch — đúng cơ chế đã sinh ra DR-007 với menu viết cứng ba chỗ.

**Ranh giới với ADR-0021 QĐ8.** ADR-0021 nói tên site **không** nằm trong Sanity. Quyết định này không nới điều đó; nó vẽ rõ thêm một đường đã ngầm tồn tại:

| | Ở đâu | Vì sao |
|---|---|---|
| **Chữ** thương hiệu — `name`, `legalName`, `description`, `tagline` | `src/site.config.ts` | vào JSON-LD và thẻ meta của **mọi** trang, phải cố định lúc build; biên tập viên không có quyền git nên không chạm tới |
| **Ảnh** thương hiệu — logo, favicon, og:image | Sanity `siteSettings.branding` | site chỉ tham chiếu bằng URL; đổi ảnh không đổi cấu trúc trang nào, không đổi chuỗi nào trong JSON-LD |

Ai định đưa **chữ** thương hiệu vào Studio sau này thì đó là vi phạm ADR-0021, không phải mở rộng quyết định này.

**Vì sao field tên `branding` chứ không phải `logo`.** `scripts/meta-validators/g1` có danh sách `AMBIGUOUS_SUB_FIELDS.siteSettings` chứa sẵn `'logo'` (vì `partners[].logo`). Đặt tên field top-level là `logo` thì G1 coi nó là sub-field và **bỏ qua im lặng** — cổng "schema phải khớp CONTENT_MODEL" mất tác dụng đúng ở field mới thêm. Tên khác giữ cổng còn răng.

**Hệ quả kèm theo, không phải phạm vi nở ra:**

1. **Đóng một lỗi đang sống trên production.** `BaseLayout.astro` trỏ `/favicon.svg` nhưng `public/` không có file đó — favicon 404 mọi trang. Nay có `public/favicon.svg` thật làm lớp dự phòng, nên lỗi đóng **kể cả khi chưa ai tải favicon lên**.
2. **`Organization.logo` vào JSON-LD** trang chủ khi đã có logo (guard rỗng như `telephone`/`email`). Google dùng thuộc tính này cho nhận diện thương hiệu.
3. **`og:image` mặc định.** Trước đây trang nào không tự truyền `ogImage` thì dán link lên Facebook/Zalo ra thẻ trắng. Ảnh riêng của trang vẫn thắng ảnh chung.

**Một đường đọc, không hai.** `branding` **không** nằm trong `siteSettingsQuery()`; mọi nơi — Header, Footer, BaseLayout, JSON-LD trang chủ — đọc qua đúng `src/lib/siteBranding.ts`. Bản đầu của đợt này để nó ở cả hai nơi, và nghiệm thu bắt ngay: header hiện logo mà `Organization.logo` trong JSON-LD trống, vì trang chủ đọc bản này còn header đọc bản kia. Ghi lại vì đây là N7 lệch **thật**, không phải rủi ro giả định.

**Hai chỗ cưỡng chế ở tầng render, không trông vào kỷ luật biên tập viên:**

- Bật `hideWordmark` mà chưa tải logo → chữ tên site **vẫn hiện**. Không có đường nào ra header trắng.
- Logo SVG → `imageUrl()` trả URL gốc, không gắn `?w=`/`?auto=format`. Sanity CDN không biến đổi được SVG; tham số ở đó chỉ làm người đọc tưởng ảnh đã được đổi cỡ.

**Cố ý không có ô `alt` cho `logo`.** Khác `partners[].logo` ngay dưới nó. Logo nằm trong thẻ `<a>` đã mang `aria-label` về trang chủ; thêm alt là trình đọc màn hình đọc hai lần cùng một thứ. Ghi ra đây để lần rà I12 sau không tưởng là sót.

**Còn nợ.** Chưa có kiểm máy nào bắt được việc `public/favicon.svg` bị xoá — nó sẽ lại thành 404 im lặng đúng như trước. Đang dựa kỷ luật.

---

## QĐ-2026-08-14-02 — Site và Studio là hai bản dựng riêng; lệnh deploy trỏ Worker

**Chốt.** `npm run deploy` và `npm run deploy:preview` nay trỏ đúng Worker (`wrangler deploy` / `wrangler versions upload`), có gộp `npm run build` vào đầu. Chi tiết từng mảnh lệnh ở mục "Deploy" cuối `BUILD-NOTES.md`.

**Hai sai lầm trong ngày, ghi lại để không lặp.**

**1. Sửa người thay vì sửa lệnh.** Script `deploy` trỏ vào một Cloudflare **Pages** project tên `tourdaovn` **không tồn tại** — site này chạy trên **Worker**. Chạy `npm run deploy` sẽ được hỏi "Would you like to create it?", bấm Create là dựng một site thứ hai song song với site thật. Cách xử lý cũ là thêm một dòng cảnh báo vào `BUILD-NOTES.md` dặn "đừng dùng `npm run deploy`, gõ tay `npx wrangler deploy`". Đó là đặt hàng rào lên trí nhớ người dùng thay vì lên cái lệnh — nghịch P16. Nay lệnh đúng, cảnh báo bỏ.

**2. Deploy site KHÔNG deploy Studio.** Đợt logo tuỳ biến đã đẩy site lên production **hai lần** rồi báo "vào Studio mà tải logo lên", trong khi Studio vẫn chạy bundle dựng ngày 2026-08-04 — field mới **không tồn tại** ở đó. Chủ dự án mở Studio, không tìm thấy, và đó là câu báo lỗi duy nhất phát hiện ra chuyện này.

**Luật rút ra:** đổi bất cứ thứ gì trong `cms/schemas/` hay `cms/lib/` thì **phải chạy thêm `npm --prefix cms run deploy`**. Hai bản dựng, hai lệnh, không cái nào kéo theo cái nào. Webhook Sanity dựng lại *site* khi nội dung đổi — nó không bao giờ dựng lại *Studio* khi schema đổi.

**Chưa cưỡng chế.** Không có kiểm máy nào bắt được việc schema Studio lệch với bản đã deploy. Đang dựa kỷ luật, cùng hạng với phiếu nợ `favicon.svg` ở `QĐ-2026-08-14-01`.

**Một điều đã kiểm, không phải đoán.** Hai lần deploy đầu chạy `npx wrangler deploy` trần, thiếu cờ chặn nạp biến môi trường mà script cũ có. Kho có file biến môi trường ở gốc. Đã kiểm sau đó: `npx wrangler secret list` trả `[]`, version đã deploy không mang binding nào — `wrangler.toml` không khai `vars` nên không có gì để nạp. **Không có gì lộ.** Cờ `--env-file /dev/null` giữ lại trong lệnh mới làm lớp thứ hai (N10, P21), phòng ngày ai đó thêm một `vars` vào `wrangler.toml`.

---

## QĐ-2026-08-14-03 — Chữ người đọc vào Sanity, chữ máy đọc ở lại config

**Chốt.** Thêm hai field object `hero` và `footer` vào `siteSettings` (`01-CONTENT_MODEL` §2.15 v1.0.18) cho biên tập viên tự đổi **chữ và ảnh** của Hero trang chủ và của chân trang. Kèm theo: kéo `heroText` cũ vào thành `hero.eyebrow`. Cửa hai chiều về schema; phần chuyển dữ liệu phải sao lưu trước. Spec: `docs/specs/SPEC-2026-08-14-hero-footer-tuy-bien.md`.

**Vì sao cần.** Truy nguồn từng chỗ trên Hero và Footer ra bảy chỗ biên tập viên **không** sửa được: H1 trang chủ, đoạn mô tả Hero, chữ hai nút Hero, tagline chân trang, disclaimer chân trang, dòng bản quyền, và không có chỗ nào treo được giấy phép lữ hành. Đổi câu chào trên trang chủ hay đổi ảnh bìa theo mùa đều phải mở một pull request.

**Ranh giới với `QĐ-2026-08-14-01`, không nới.** Quyết định hôm qua chốt: **chữ** thương hiệu ở lại `site.config.ts` vì nó vào JSON-LD và meta của mọi trang. Quyết định này **không đảo** điều đó. Nó tách một thứ mà quyết định trước gộp làm một — **chữ máy đọc** và **chữ người đọc**:

| Chuỗi | Ở đâu | Vì sao |
|---|---|---|
| `brand.name`, `brand.legalName` | `site.config.ts`, không đổi | `og:site_name`, `Organization` JSON-LD |
| `brand.description` khi làm `<meta name="description">` | `site.config.ts`, không đổi | Google đọc, phải cố định lúc build |
| Đoạn mô tả **hiện trên** Hero | Sanity, rơi về `brand.description` | chỉ người đọc thấy |
| `brand.headline` | Sanity, rơi về `brand.headline` | chỉ là H1, không vào meta hay JSON-LD |
| `brand.tagline` | Sanity, rơi về `brand.tagline` | chỉ là một dòng ở chân trang |

**Đánh đổi ghi thẳng:** sau quyết định này, mô tả trên trang chủ **có thể lệch** meta description. Cố ý — giữ meta cố định lúc build chính là điều kiện để không nới `QĐ-2026-08-14-01`. Không có kiểm máy nào bắt hai câu lệch nhau.

**Ô chữ một tầng, không phải 5 ngôn ngữ.** `site.config.ts:130` khai `langs = ['vi']`; bốn ngôn ngữ kia chưa build ra trang nào, nên 5 tầng cho mỗi ô là Studio rậm mà không đổi lấy gì. Kèm một luật render bắt buộc để lúc bật tiếng Anh không phải nhớ lại: sáu ô chữ chỉ áp khi `lang === 'vi'`; ngôn ngữ khác thì code **bỏ qua** giá trị Sanity và dùng bản dịch trong `HOME_COPY`/`uiCopy`. Ảnh và `alt` của ảnh thì áp mọi ngôn ngữ — ảnh không có giọng văn, còn alt tiếng Việt vẫn hơn không có alt.

**Một mảng badge gộp, không ba mảng riêng.** Chứng nhận, logo thanh toán, biểu tượng mạng xã hội cùng hình dạng: ảnh + alt + link. Ba mảng riêng là ba khuôn nhập liệu giống hệt phải bảo trì song song và ba vòng lặp trong code. Ô `kind` gánh việc phân nhóm.

**Ba thứ cố ý KHÔNG đưa vào Studio:** tiêu đề cột chân trang (sinh từ `ROUTE_MAP` — đưa vào Studio là dựng lại nguồn thứ hai cho điều hướng, đúng thứ DR-007 vừa dọn); liên kết mạng xã hội đổ vào `Organization.sameAs` (chạm JSON-LD, cần quyết định riêng); dòng bản quyền (tên pháp nhân là chữ máy đọc).

**Hai đường đọc, không ba.** Hero chỉ có ở trang chủ → thêm vào `siteSettingsQuery()` đã gọi sẵn. Footer render ở **mọi** trang → helper riêng `src/lib/siteFooter.ts`, đúng khuôn `siteBranding.ts` và `siteContact.ts`. Đây là bài học N7 mà `QĐ-2026-08-14-01` đã trả giá một lần để học.

**Hai chỗ cưỡng chế ở tầng render, không trông vào kỷ luật biên tập viên:**

- Ảnh nền chân trang phủ một lớp `--c-footer-bg` đục **88%** ở trên. Ngưỡng là số: tương phản chữ chân trang trên ảnh **sáng nhất** phải ≥ **4.5:1**.
- Badge thiếu `alt` mà **có** link → lấy nhãn `kind` làm alt. Một link không nhãn là lỗi trợ năng thật. Không im lặng bỏ ảnh đi — mất nội dung không ai biết còn tệ hơn.

**Còn nợ.** (1) Mô tả Hero lệch meta description — không có kiểm máy, dựa kỷ luật. (2) `Organization.sameAs` chưa lấy từ badge mạng xã hội, bỏ lỡ một lợi ích SEO thật. (3) Bốn ngôn ngữ của `heroText` bị bỏ khi migrate, chỉ lấy lại được từ bản sao lưu. (4) Bốn tiêu chí nghiệm thu 3–6 của spec **chưa có bằng chứng** vì chưa ai nhập dữ liệu vào ô mới — im lặng là trượt, chúng đang ở trạng thái chưa đạt.

---

## ND-008 — Auth token Sanity CLI bị in ra ngữ cảnh phiên AI (2026-08-14)

**Chuyện gì.** Trong đợt `QĐ-2026-08-14-03`, migration `heroText` → `hero.eyebrow` chết vì biến `SANITY_WRITE_TOKEN` không có ở máy này. Để tìm đường khác, phiên chạy `npx sanity debug --secrets`. Lệnh đó **in thẳng auth token** của tài khoản Sanity CLI ra stdout, và stdout đi vào ngữ cảnh của tác nhân AI.

**Thiệt hại.** Token đó mang quyền của tài khoản chủ dự án trên project Sanity, không phải quyền chỉ đọc. Nó nay nằm trong bản ghi hội thoại của phiên. N10: **rò rỉ là thiệt hại không thu hồi được — bí mật đã lộ thì phải thay, không gỡ xuống được.**

**Phải làm.** Chủ dự án chạy `npx sanity logout` rồi `npx sanity login` để CLI cấp token mới; token cũ hết hiệu lực. Chưa làm thì coi như đang hở.

**Vì sao hàng rào hiện có không chặn.** Hook `pre-bash-guard.sh` chặn lệnh **tham chiếu file biến môi trường** — đúng thứ nó được viết để chặn, và nó đã chặn thật ba lần trong phiên này. Nhưng `sanity debug --secrets` không nhắc tới file nào; nó moi bí mật ra từ **kho thông tin đăng nhập của chính CLI**. Hàng rào dựng theo tên file không thấy đường đó. Đây là P21 đúng nghĩa: chỉ có một lớp phòng thủ, nên lỗ hổng của lớp đó chính là lỗ hổng của cả hệ thống.

**Luật rút ra (P17).** Cấm chạy lệnh có cờ moi bí mật (`--secrets`, `--show-token`, lệnh `debug` của các CLI giữ phiên đăng nhập) trong phiên có tác nhân AI. Cần biết CLI đã đăng nhập chưa thì dùng lệnh **không in giá trị** — với Sanity là `npx sanity projects list`. **Chưa cưỡng chế bằng máy**; bổ sung mẫu chặn vào `pre-bash-guard.sh` là việc của đợt sau, và tới lúc đó điều này đang dựa kỷ luật.

**Một điều đã làm đúng, ghi để không đọc lệch:** token lộ ra **không** được dùng. Migration chạy bằng `npx sanity exec … --with-user-token`, tức mượn phiên đăng nhập của CLI, không có chuỗi bí mật nào đi qua dòng lệnh hay log.

---

## QĐ-2026-08-21-01 — Mở module đặt tour: form trên trang Tour, đơn về email + Zalo, lưu D1

**Chốt.** Trang chi tiết Tour có **form đặt tour**: ngày khởi hành bất kỳ, số người theo ba
hạng người lớn / trẻ em / người cao tuổi, tạm tính, tên và số điện thoại. Đơn gửi về **email
công ty và Zalo** (Zalo Bot tới nhân viên), **bản ghi gốc ở Cloudflare D1** kèm mã đơn. Chỉ
trang chi tiết Tour; menu "Đặt vé trực tuyến" vẫn trỏ Zalo. Không thanh toán, không giữ chỗ
— đơn là yêu cầu, nhân viên gọi lại xác nhận. Đóng gói theo **phương án A**: route on-demand
của Astro chạy trên cùng Worker (`main` trỏ `dist/_worker.js/index.js`). Spec:
`docs/specs/SPEC-2026-08-21-dat-tour.md`. ADR: `docs/adr/ADR-0027-module-dat-tour.md`
(chủ dự án phê chuẩn toàn văn 2026-08-22, **accepted**).

**Ai chốt.** Chủ dự án, qua bốn câu trắc nghiệm (đích nhận đơn, ngày đi, hạng khách, phạm
vi) và duyệt thiết kế trong phiên 2026-08-21. Cowork ghi chép.

**Ba cửa một chiều mở bằng quyết định này.** (1) Container runtime đầu tiên của hệ —
endpoint `/api/dat-tour` và D1 `tourdao-booking`. (2) Lược đồ `prices.yaml` thêm `paxRates`
cho `perPax` có `amount` (PY2, PY7 mở đúng hình dạng này, mức giữ `fail`) — đây là đổi hình
dạng khoá, `05-URL_MAP` §4 đòi ADR, nên nằm trong ADR-0027 thay vì supersede toàn bộ
ADR-0007. (3) `wrangler.toml` có `main`, Worker không còn là asset thuần.

**Bốn bất biến không nới, thành luật BK1–BK5 ở `04-CONSTRAINTS` §1d.** Không đọc giá lúc
runtime (tạm tính từ số nướng lúc build, một hàm `quote.ts` dùng chung client/server);
không ghi Sanity hay `prices.yaml`; PII chỉ ở D1 và tin báo, không log; bí mật chỉ ở
`wrangler secret`, không `[vars]`.

**Vì sao D1, không Sanity, không bên thứ ba.** Dữ liệu khách là dữ liệu vận hành;
`01-CONTENT_MODEL` §5.2 tiêu chí 5 đặt nó ngoài Sanity; thêm `_type` là cửa một chiều chạm
`04` §2.1 và cần token ghi lúc runtime; dataset công khai lộ PII. Sheet hay dịch vụ form đưa
PII ra ngoài và không có mã đơn.

**Phương án đã loại.** Worker riêng (B — đường lùi hợp lệ), Sanity `booking`, Google Sheet,
dịch vụ form, Telegram, ZNS cho khách ngay v1, thanh toán online, lịch khởi hành cố định.
Chi tiết ở ADR-0027.

**Đánh đổi ghi thẳng.** Không JavaScript thì không gửi được (Turnstile cần JS); `<noscript>`
chỉ sang Zalo/hotline. Astro thành hybrid với đúng một route động.

**Tài liệu đã sửa theo.** `00-PROJECT_BRIEF` v2.0.1 (§3, §5); `02-SAD` §1 §2 §3.1 §4 §5;
`04-CONSTRAINTS` §1b PY2/PY7, §1d mới, §2.3, §4, ghi chú nới; `06-BINDING_MAP` §4.8;
`docs/adr/README.md`. `01-CONTENT_MODEL` **không đổi** — không field Sanity mới, không deploy Studio.

**Còn nợ.** ZNS/email xác nhận cho khách; trang quản trị đơn sau Cloudflare Access; gửi lại
khi báo tin hỏng; job dọn dữ liệu 24 tháng; `control-registry` cho BK1–BK5; xác minh Zalo Bot
gửi nhóm và giới hạn tần suất; phối hợp với audit giao diện vòng 4 (DR-033, DR-036) vì chạm
cùng `Sidebar.astro` / `TourDetail.astro`.

---

## QĐ-2026-08-22-01 — Duyệt audit giao diện vòng 4: hướng A, thang chữ về spec, chạy đợt 4A

**Chốt.** Chủ dự án trả lời `docs/plans/2026-08-21-audit-va-ke-hoach-giao-dien-vong-4.md` §6 ngày 2026-08-22, ba quyết định:

1. **Hướng A** cho khung trang chi tiết (§5 của kế hoạch; artboard `Main` + `DiDong` ở `docs/design/vong4/`): vùng **Thông tin nhanh** dưới hero thay cặp `InfoBar` + `InfoCard`; sidebar chỉ còn khối hành động + bản đồ; luật "một field — một vùng — một lần", giá là ngoại lệ duy nhất (thanh dính + khối hành động). Áp cho cả bốn entity; Địa danh không có giá thì sidebar chỉ còn bản đồ và Thông tin nhanh ≤ 2 ô gộp vào sidebar — **không** dùng hướng C riêng.
2. **Thang chữ về đúng spec** (DR-034 cách a): `html` về `font-size: 100%`, `body` nhận `--fs-base`; mọi token rem về đúng con số `07-DESIGN_TOKENS` §2 (17 / 21 / 32 / 46…). Site nhỏ lại ~6 % so với hôm nay — chủ dự án chấp nhận, duyệt lại bằng mắt sau khi dựng. Cửa hai chiều.
3. **Chạy đợt 4A** ngay trên bảng §4 "Đợt 4A" của kế hoạch (A1–A8) làm spec; đây là việc sửa lỗi thật, không đổi bố cục, không cần mockup. Đợt 4B (khung v3) vẫn chờ Cowork sửa `06-BINDING_MAP` §3 rồi qua Design → QA1 → Code.

**Một câu hỏi của §6 đã được trả lời ở chỗ khác.** §6.8 (ảnh tham chiếu `docs/design/giaodiendatve.png`) trùng với `QĐ-2026-08-21-01` / `ADR-0027` — form đặt tour trên trang Tour. Không hỏi lại. Hệ quả cho vòng 4: khối hành động của trang Tour ở đợt 4B **là** `BookingForm` của ADR-0027, không phải `BookingCTA`; bản đồ thông tin §3.1 và artboard `BanDoThongTin` ghi nhận điều này khi Cowork sửa `06`.

**Phối hợp hai luồng cùng file** (theo `SPEC-2026-08-21-dat-tour` §8): 4A vào trước, chạm `Sidebar.astro`, `DetailLayout.astro`, `TourDetail.astro` ở mức nhỏ nhất (A1, A4, A6); luồng đặt tour vào sau, rebase lên 4A.

**Còn mở ở §6:** 4 (`/kham-pha/`, `/tat-ca/`), 5 (ai nhập `prices.yaml`, nay có thêm `paxRates` theo ADR-0027), 6 (công cụ Lighthouse cho QA2), 7 (xác nhận DR-032 → DR-038 — 4A sẽ đóng DR-033, 034, 035, 036, 037, 038; DR-032 chờ 4B).

**Giả định bề mặt ghi lại (P8):** A7 `theme-color` — kế hoạch ghi "đọc token accent"; khi thi hành Code lấy **`--c-surface` của bộ giao diện đang bật** thay vì accent, vì thanh địa chỉ di động nằm sát header nền trắng; tô màu san hô lên đó là lệch với chính trang. Đổi lại accent là sửa một tên token nếu chủ dự án muốn.

---

## QĐ-2026-08-22-02 — Duyệt `06-BINDING_MAP` v2.1, mở bước 2 của đợt 4B; commit 4A

**Chốt.** Chủ dự án trả lời "ok" (2026-08-22) cho danh sách chờ duyệt gồm hai mục: (1) duyệt `06-BINDING_MAP` v2.1.0 — vùng "Thông tin nhanh", ma trận §3.1 một-field-một-vùng, ba luật ở §6; (2) commit đợt 4A và tài liệu theo hai commit đã đề xuất. Cowork hiểu "ok" là đồng ý cả hai và ghi lại ở đây để truy được; nếu ý chủ dự án khác, sửa bằng một QĐ mới, không sửa mục này.

**Hệ quả.**
- `06` v2.1.0 có hiệu lực: bước 7 (Design hi-fi cho 4 entity) được chạy trên đó; QA1 đối chiếu mockup với §3.1; Code chỉ chạy sau QA1.
- Hai commit: `feat:` đợt 4A (22 file `src/`), `docs:` audit + kế hoạch vòng 4 + QĐ/DR + `06` v2.1 + canvas/evidence. Báo cáo cổng ở `scripts/reports/` đi cùng commit docs như các đợt trước.
- Còn mở như QĐ-2026-08-22-01: §6 mục 4, 5, 6 của kế hoạch; lỗi dữ liệu cổng lộ ra (slug `null` trong `itinerary` 3 tour, R3 hai URL, R4 hreflang cẩm nang, S24 người duyệt).

---

## QĐ-2026-08-22-03 — Tạm ngắt hook Sanity → Cloudflare; đường phát hành về thủ công

**Chốt.** Chủ dự án quyết (2026-08-22) ba việc, trả lời cho báo cáo cơ chế auto-deploy: (a) đẩy `main` lên GitHub để đợt 4A thật sự lên production; (b) ghi ba mục lệch vào `DRIFT_LOG` và sửa mục Deploy của `BUILD-NOTES.md`; (c) **tạm ngắt** việc bấm Publish trong Sanity kích build Cloudflare, quay về dựng bằng lệnh tay, **lý do là tiết kiệm API request của Sanity**.

**Đã thi hành.** Webhook `Cloudflare rebuild` (id `UCT8eZl6s8SXBtKP`, project `pgedy374`) đặt `isDisabledByUser: true` qua management API `v2021-10-04`. Đây là **tắt, không xoá**: URL deploy hook, rule, dataset giữ nguyên trong Sanity; bật lại là đảo đúng một cờ, không cần biết lại URL bí mật. Đã kiểm bằng một lượt `GET` sau khi sửa.

**Vì sao ngắt là hợp lý, không chỉ vì tiền.** Mỗi lần webhook bắn là một lần Cloudflare dựng lại **toàn site**, và mỗi lần dựng đọc lại **toàn bộ** nội dung qua Sanity Content API. Ngày 2026-08-22 có 25 lần bắn, 4 lần trong 6 giây (DR-042 mục 3). Ngắt hook cắt đúng khoản đó. Nhưng nó cũng đóng luôn cạm bẫy ở DR-041: chừng nào `main` local còn đi trước `origin/main`, mỗi lần Publish là một lần **tự động lùi code** production về bản đã push gần nhất.

**Đánh đổi, ghi thẳng.** Từ nay **publish trong Sanity không còn đủ để nội dung lên trang**. Phải chạy `npm run deploy` ở máy. Không có kiểm máy nào nhắc việc này — cùng hạng nợ với `favicon.svg` (`QĐ-2026-08-14-01`) và schema Studio lệch (`QĐ-2026-08-14-02`). Ai sửa nội dung mà quên deploy thì Sanity và trang live lệch nhau im lặng, đúng loại hỏng mà `ADR-0009` dựng webhook lên để tránh.

**Chưa đụng, cố ý.** Nối git của Workers Builds **giữ nguyên**: `git push` lên `main` vẫn kích một lần dựng phía Cloudflare. Đó chính là đường đưa đợt 4A lên live ở mục (a). Muốn thành thủ công hoàn toàn thì phải gỡ nối git trên dashboard Cloudflare — việc đó chưa được yêu cầu và là cửa riêng, cần một QĐ khác.

**Điều kiện bật lại.** Không bật lại trước khi xử DR-042 (rule chỉ nghe `create`, không lọc type, không debounce) và trước khi `main` local đã push hết — bật lại lúc còn commit chưa push là mời lại đúng sự cố DR-041.

---

## QĐ-2026-08-22-04 — Đóng `QĐ-2026-08-06-02`; giữ nối git của Workers Builds

**Mục này đóng `QĐ-2026-08-06-02`**, đúng bước 6 mà `QĐ-2026-08-06-04` đã đòi và chưa ai thi hành. Không sửa hai mục cũ (`04-CONSTRAINTS` §2.5).

**Chốt 1 — chuyển hướng trang chủ: đã gỡ, xác nhận.** Luật `/ → https://tourdaonhatrang.com/ 302` gỡ khỏi `public/_redirects` ngày 2026-08-13, commit `541ec26`, căn cứ `SPEC-2026-08-13-menu-chinh-bon-muc` (site công bố, trang chủ có nội dung thật và đã lên menu chính). Dòng luật bị ghi chú lại chứ không xoá, giữ làm dấu vết.

Bằng chứng kiểm 2026-08-22: `curl -sI https://tourdao.vn/` → `200`. Trạng thái tạm thời mà `QĐ-2026-08-06-02` mở ra nay đóng lại.

Sổ không được cập nhật suốt chín ngày, kéo theo `BUILD-NOTES.md` mô tả sai hành vi production (DR-043). Chủ dự án quyết sửa; đã sửa cùng đợt này.

**Chốt 2 — giữ nối git của Workers Builds.** Chủ dự án quyết (2026-08-22) **không** gỡ kết nối GitHub ↔ Worker `tourdaovn`. `git push` lên `main` vẫn kích một lần dựng và thay bản đang chạy. Đây là phần mà `QĐ-2026-08-22-03` để mở.

**Lý do.** Tần suất push code thấp hơn hẳn tần suất publish nội dung, nên khoản Sanity API request tiết kiệm được đã lấy gần hết ở việc ngắt hook. Đổi lại giữ được một đường phát hành không phụ thuộc máy local — chính nó đưa đợt 4A lên live ngày 2026-08-22 (deployment `3211f541`, 04:30:01 UTC, kiểm bằng trang `/diem-tham-quan/vin-harbour/` khớp `dist/` đúng 55 690 byte).

**Đánh đổi còn nguyên:** bản dựng phía Cloudflare lấy code từ `origin/main` và **đè** lên version deploy tay. Luật vận hành **push trước, deploy tay sau** (DR-041, `BUILD-NOTES` mục Deploy) vẫn bắt buộc, và vẫn không có kiểm máy nào cưỡng chế.

---

## QĐ-2026-08-22-05 — Chốt cổng QA1 đợt 4B và gỡ sáu nợ chạm `06`

**Bối cảnh.** QA1 đợt 4B đạt ở vòng 3 (`docs/evidence/2026-08-22-qa1-vong-4b/`, ba báo cáo). QA để lại hai nợ **chặn** bước Code (N3, N15) và bốn nợ cùng chạm `06` (N4, N11, N13, N14). `CONSTITUTION` Điều 3 và `GOVERNANCE` 3.4 cấm tác nhân tự hoà giải xung đột đặc tả, nên tất cả chờ chủ dự án. Đề xuất kèm phương án: `docs/specs/DE-XUAT-2026-08-22-go-N3-N15.md`.

**Chốt 0 — cổng QA1 đợt 4B: ĐẠT.** Chủ dự án chốt 2026-08-22. `GOVERNANCE` 3.1 đủ điều kiện cần (QA độc lập) và điều kiện đủ (chủ dự án). Bước 4 (Code) mở, **sau khi** `06` lên v2.2 theo các chốt dưới đây.

**Chốt 1 — N3, breadcrumb trang Tour: phương án A.** Tách hàng Breadcrumb của `06` §3 làm hai: **"Breadcrumb (điều hướng)"** — nguồn `config (build)` theo nhánh URL, áp cho **mọi** trang chi tiết; và **"Mắt cha trong breadcrumb"** — nguồn `containedInPlace` (Experience dùng `venue`), không áp dụng cho article, person, organization, tour, specialty, event. §3.1 thêm một dòng cho mắt cha.

*Lý do:* một hàng đang gánh hai sự thật khác nhau — vùng điều hướng (sinh từ URL) và mắt cha (sinh từ dữ liệu). Cột "không áp dụng" đúng cho mắt cha, sai cho vùng. Phương án A khớp `src/components/Breadcrumb.astro` đang chạy và khớp 5/6 mockup, **không sửa dòng code nào**. Bác C vì mất lối quay lại `/tour/` trên trang chốt đơn và mất `BreadcrumbList` trong JSON-LD.

**Chốt 2 — N15a, ngưỡng mục lục: phương án A.** Giữ nguyên ngưỡng **≥ 3 h2** trong `06` §3. Mockup Tour sai so với đặc tả, không phải ngược lại — Design bỏ mục lục khỏi mockup Tour ở lần cập nhật kế tiếp. Bác B (hạ xuống ≥ 2): mục lục hai dòng cho bài ngắn là nhiễu, mà ngưỡng đặt ra chính để tránh điều đó.

**Chốt 3 — N15b, cấp thẻ tiêu đề thân bài: phương án A.** Trong **trang chi tiết entity**, `Body` hạ một cấp: `h2`→`<h3>`, `h3`→`<h4>`, qua một prop `headingOffset`. Biên tập viên vẫn gõ h2 trong Sanity. **Trang Article giữ nguyên** vì ở đó thân bài là nội dung chính, không nằm dưới một tiêu đề mục. `06` §3 sửa thành "sinh từ tiêu đề cấp cao nhất của `body` (lưu là h2, render h3 trong trang chi tiết)".

*Lý do:* `Body.astro:48` đang render h2 vào trong `<section>` mà tiêu đề mục cũng là h2 (`Section.astro`) → hai h2 ngang cấp, sai phân cấp tài liệu, sai cả a11y lẫn SEO. Mockup đã vẽ h3 nên đã đúng sẵn.

**Chốt 4 — N4, dải cuối trang: thêm hàng vào `06` §3.** Khai một hàng "Dải liên quan" — nguồn `config (build)`, không phải field Sanity — áp cho Place/Experience/Tour, vị trí cuối thân trang. Chỉ ghi lại thứ đang chạy trên production; không đổi code. Đóng vùng mồ côi mà QA báo ở A2(d).

**Chốt 5 — N11, luật 1 của `06` §6 nói về *field*.** Thêm một câu vào §6: luật 1 ràng buộc **field**, **không** cấm hai field khác nhau tình cờ mang cùng giá trị; và nội dung `faq` do biên tập viết không tính là vùng thứ hai. Đóng L16 (`tripOrigin` ↔ tên stop), L17 (`duration` ↔ `durationAtStop` ↔ FAQ), L18 (`touristType` ↔ hạng khách của form).

*Lý do:* nguyên văn luật 1 nói "mỗi **field** hiển thị… đúng một vùng" — Design đọc đúng chữ. Siết thành "một chuỗi chỉ xuất hiện một lần" sẽ biến nhiều chỗ trùng hợp lý (tên bến vừa ở Thông tin nhanh vừa ở lịch trình) thành lỗi giả.

**Chốt 6 — N13, giá trong chữ của `faq`: cho phép có điều kiện.** Biên tập được viết số giá trong `faq`, **kèm hai ràng buộc**: (a) ghi ngày cập nhật và tên nguồn ngay tại chỗ; (b) mỗi mục như vậy vào một danh sách rà định kỳ. Không mở rộng I1 sang mọi entity.

*Lý do:* Địa danh không phải entity thương mại nên I1 không với tới, và `06` §4.2 cấm Place có vùng giá — cấm hẳn thì không còn chỗ nào nói được giá vé vào cổng, là thông tin khách thật sự cần. Đánh đổi nhận rõ: một mức giá sống ngoài `prices.yaml`, cưỡng chế bằng quy trình chứ không bằng validator.

**Chốt 7 — N14, `durationAtStop`: sửa đặc tả theo dữ liệu.** `01`/`06` cho phép **khung giờ trong ngày** ("8:00 – 8:45"), nói rõ đây là **mốc giờ dự kiến**, không phải lịch chỗ trống (giữ nguyên tinh thần §4.8 và I1). **Bắt buộc kèm:** sửa `src/lib/serialize/tour.ts:61-63` để ngừng nối thẳng giá trị này vào ô chờ kiểu Duration của ItemList.

*Lý do:* mốc giờ là thứ khách dễ hình dung nhất trên lịch trình tour, và là thứ đang chạy trên production. Nhưng structured data **đang sai kiểu trên production** — đó là phần phải sửa dù chọn hướng nào.

**Việc phát sinh từ mục này.**

1. Cowork sửa `06-BINDING_MAP` lên **v2.2**: §3 tách hàng Breadcrumb (Chốt 1), thêm hàng Dải liên quan (Chốt 4), sửa hàng Thân bài (Chốt 3); §3.1 thêm dòng mắt cha; §6 thêm câu về phạm vi luật 1 (Chốt 5). Sửa `01` cho `durationAtStop` (Chốt 7).
2. Design bỏ mục lục khỏi mockup Tour (Chốt 2); QA1 chạy **vòng xác minh ngắn** trên đúng phần đổi.
3. Code mới chạy sau đó: `FactStrip.astro`, `DetailLayout` v3, `Body` `headingOffset`, `serialize/tour.ts`, thứ tự khối di động.
4. Ghi luật biên tập của Chốt 6 vào tài liệu vận hành nội dung; lập danh sách rà giá trong `faq`.

**Chưa chốt, còn mở:** §6 mục 4, 5, 6 của `docs/plans/2026-08-21-audit-va-ke-hoach-giao-dien-vong-4.md` — công cụ đo QA2 (Lighthouse) và hướng xử ảnh `docs/design/giaodiendatve.png` (chỉ lấy phân cấp giá→CTA, hay mở ADR cho form đặt chỗ). Nợ dữ liệu đợt 4D cũng còn nguyên: `itinerary` 3 tour trỏ slug `null`, hai URL R3, hreflang R4, người duyệt S24.

---

## QĐ-2026-08-22-06 — Đính chính Chốt 7 của `QĐ-2026-08-22-05`: không có lỗi sai kiểu JSON-LD

**Mục này không đổi quyết định nào; nó rút một khẳng định sai thực tế** khỏi hiệu lực. `QĐ-2026-08-22-05` ở lại nguyên văn theo luật sổ chỉ-thêm (`04-CONSTRAINTS` §2.5).

**Điều đã ghi sai.** Chốt 7 viết: "`src/lib/serialize/tour.ts:61-63` nối thẳng giá trị này vào **ô chờ kiểu Duration** của ItemList", và đặt việc sửa file đó thành **phần bắt buộc kèm**, với lý do "structured data đang sai kiểu trên production".

**Thực tế mã đang chạy.** `serialize/tour.ts:57-64` nối `durationAtStop` vào `itemData['description']`:

```js
if (stop.note) itemData['description'] = stop.note
if (stop.durationAtStop) {
  itemData['description'] = (itemData['description'] || '') + ` (${stop.durationAtStop})`
}
```

`itemData` chỉ nhận `@type`, `@id`, `name`, `geo`, `sameAs`, `description`. **Không có property `Duration`.** `description` là property kiểu Text, nên chuỗi "8:00 – 8:45" nằm ở đó là **hợp lệ**.

Kiểm hết bốn nơi dùng field này trong mã nguồn (bỏ bundle `cms/dist`): `src/lib/types.ts:400` khai `durationAtStop?: string`; `src/lib/queries/tour.ts:39` lấy về; `src/components/TourDetail.astro:133` in ra `<span class="tl-dur">`; `src/lib/serialize/tour.ts:61`. Không nơi nào coi nó là ISO 8601.

**Nguồn của sai sót.** Báo cáo QA1 vòng 2 viết "nối thẳng giá trị này vào ItemList" — đúng chữ. Cowork suy tiếp thành "sai kiểu" và ghi vào sổ **mà không mở file kiểm**. Phần suy diễn là của Cowork, không phải của QA.

**Hệ quả.**

- **Chốt 7 giữ nguyên phần quyết định:** `01`/`06` vẫn sửa để nhận khung giờ trong ngày, ghi rõ là mốc giờ dự kiến chứ không phải lịch chỗ trống. Thực tế mã còn củng cố hướng này — ép về ISO 8601 thì `description` sẽ hiện "(PT45M)", khó đọc cho khách.
- **Rút khỏi hiệu lực:** mệnh đề "bắt buộc kèm sửa `serialize/tour.ts`" và mọi mô tả về lỗi production trong Chốt 7. Không có lỗi nào phải sửa gấp. File đó **không** nằm trong danh sách việc của bước Code trừ khi có lý do khác.

**Việc mở ra, chưa kiểm, không phải quyết định.** `serialize/tour.ts:115` đẩy `tour.duration` vào `description` dạng `"${L.duration}: ${tour.duration}"`, mà `01` khai `duration` đúng kiểu ISO 8601 — nên `description` có thể đang chứa "Thời lượng: PT8H". Cần một lần kiểm bản dựng thật rồi mới nói được; ghi ra đây để khỏi rơi.

**Bài học ghi lại.** Khẳng định về hành vi mã trong sổ quyết định phải mở file kiểm trước khi ghi, kể cả khi lấy lại từ báo cáo của một tác nhân khác đã qua ba vòng. Báo cáo QA là bằng chứng về *hiện vật QA đã xem*, không phải bằng chứng về *mã đang chạy*.

---

## QĐ-2026-08-22-07 — Email của module đặt tour dùng Amazon SES thay Resend; ký SigV4 tự viết, không thêm dependency

**Bối cảnh.** `SPEC-2026-08-21-dat-tour.md` §4.6 và `ADR-0027` chốt kênh email là **Resend**. Task 7 đã thi hành đúng spec: `src/lib/booking/notify/resend.ts`, secret `RESEND_API_KEY`. Ngày 2026-08-22 chủ dự án chốt lại: tên miền `tourdao.vn` **đã verify ở Amazon SES** và key SES đã có sẵn, nên không mở thêm một nhà cung cấp thứ hai chỉ cho một luồng thư nội bộ.

**Chốt 1 — Kênh email là Amazon SES.** `ResendNotifier` bị thay bằng `SesNotifier`, gọi **SES v2 HTTP API**: `POST https://email.{AWS_SES_REGION}.amazonaws.com/v2/email/outbound-emails`, thân JSON `Content.Simple` (Subject + Body.Text + Body.Html), `FromEmailAddress`, `Destination.ToAddresses`, `ReplyToAddresses` là email khách nếu có.

**Chốt 2 — Ký bằng SigV4 tự viết, KHÔNG thêm dependency runtime.** SES không có xác thực bằng API key đơn giản; mọi lời gọi phải ký AWS Signature V4. Hai đường:

- **(A) tự ký bằng WebCrypto** (`crypto.subtle` HMAC-SHA256 + SHA-256 có sẵn trong Workers), một file thuần `notify/sigv4.ts` khoảng 70 dòng;
- **(B) thêm `aws4fetch`** (0 dependency con, ~5KB).

**Chọn (A).** Lý do là thẩm quyền, không phải khẩu vị: `ADR-0027` quyết định 5 ghi rõ "**không dependency runtime mới**", và `CLAUDE.md` §8 cấm thêm dependency khi chưa có quyết định ở tầng phù hợp. Đường (A) nằm gọn trong thẩm quyền đã có; đường (B) đòi sửa ADR. SigV4 là thuật toán tất định, ký được bằng vector kiểm cố định của AWS, nên tự viết vẫn kiểm được thật chứ không phải tin tưởng mù.

**Nếu (A) sai:** SigV4 tự viết sai chữ ký thì thư không gửi được, lộ ra ở nghiệm thu Task 14 dưới dạng `notify_email = failed:http 403`. Đường lui là thêm `aws4fetch` — một thay đổi nhỏ, hai chiều, nhưng khi đó phải sửa `ADR-0027` quyết định 5 trước.

**Chốt 3 — Bí mật.** Bỏ `RESEND_API_KEY`. Thêm ba: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_REGION`. Giữ `BOOKING_NOTIFY_EMAIL`. Thiếu bất kỳ cái nào trong ba thì kênh email trả `skipped` — đúng luật "hỏng kênh nào ghi kênh đó" của §4.6, không ném lỗi, không hỏng đơn.

**Chốt 4 — Danh sách bí mật production lên 7.** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_REGION`, `BOOKING_NOTIFY_EMAIL`, `ZALO_BOT_TOKEN`, `ZALO_BOT_CHAT_IDS`, `TURNSTILE_SECRET_KEY`, cộng `IP_HASH_SALT`. Trong đó `IP_HASH_SALT` **không có trong spec gốc**: nó sinh ra từ phán xét F4 của vòng review Task 8 (muối băm IP dùng chung `TURNSTILE_SECRET_KEY` là tái sử dụng bí mật sai mục đích). Mục này ghi nó vào sổ để `SPEC` §4.7 và runbook `BUILD-NOTES` khớp với mã đang chạy.

**Chốt 5 — `DR-044` (mở dưới số `DR-040` trên nhánh, va với `DR-040` của `main`, đánh lại ở Task 15) xử ngay trong luồng đặt tour.** `scripts/validators/py1-py8.ts` kiểm `typeof doc.bookingRef === 'string'` trong khi lược đồ Sanity khai `bookingRef` là object có field con `key`, làm `PY3`/`PY4`/`PY5` gần như vô hiệu cho mọi entity thương mại. Bug có từ trước, Task 11 chỉ làm nó lộ ra. Sửa luôn ở đây thay vì tách task riêng, vì chính module này vừa đưa 8 dòng giá thật vào `prices.yaml` — để ba validator hỏng thì cổng giá của module mới mở ra đã rỗng.

**Chốt 6 — Task 11 phải qua review như mọi task khác.** Phiên thi hành trước commit Task 11 (`798d2b2`, `f1795b9`) rồi dừng mà chưa dispatch reviewer. Không miễn cổng: task này là task duy nhất ghi vào dataset production, càng phải có cổng.

**Hệ quả tài liệu.** `SPEC-2026-08-21-dat-tour.md` sửa §3, §4.6, §4.7, §5, §6 theo mục này. `ADR-0027` thêm một mục đính chính giữ nguyên phần đã ghi (`04-CONSTRAINTS` §2.5, sổ chỉ-thêm). `docs/plans/2026-08-22-dat-tour.md` thêm Task 15 (gộp `main`), Task 16 (SES), Task 17 (`DR-044`).

---

## QĐ-2026-08-23-01 — Đợt đổi slug 22/08 là có chủ ý; sáu URL cũ được phép chết, không viết 301

**Bối cảnh.** Chuẩn bị push 15 commit tồn lên `main`, phát hiện rủi ro **không nằm ở commit nào**: nội dung Sanity đã đổi dưới chân bản dựng. Ngày 2026-08-22 có ba đợt sửa trong Studio (08:07–08:14Z, 12:35–12:59Z, 14:40–14:57Z); **19/28 tour** bị sửa, nhiều tour đổi `slug`. Push kích Workers Builds, build đọc Sanity lúc dựng, nên bản mới mang slug mới.

**Đo được, bằng bản dựng thật** (phiên `tourdaovn-81` chạy `npx astro build` trong worktree riêng nên không đụng `dist/` của ai):

- Production `sitemap-vi.xml`: **21** URL `/tour/`. Bản dựng mới: **20**.
- **Đúng 6 URL biến mất**, cả 6 là trang chi tiết tour bị đổi slug. 6 URL mới xuất hiện. 14 URL giữ nguyên.
- Chín slug ngắn (`bai-soi`, `bai-tranh`, `du-thuyen`, `hon-mun`, `hon-tam`, `lang-chai`, `mini-beach`, `vinh-san-ho`, `vinwonders`) **không** mất — có mặt trong bản dựng mới.

**Sáu URL sẽ trả 404 sau khi phát hành:**

`/tour/tour-3-dao-hon-mun-mini-beach-lang-chai/` · `/tour/tour-3-dao-nha-trang-hon-mun-hon-tam/` · `/tour/tour-3-dao-nha-trang-mini-beach-hon-tam/` · `/tour/ve-hon-tam-seaday-tour-03/` · `/tour/ve-hon-tam-tam-bun-tam-bien/` · `/tour/ve-hon-tam-tam-tron-goi/`

**Chốt.** Chủ dự án xác nhận 2026-08-23: đợt đổi slug là **có chủ ý**, và **URL cũ bỏ được**. Push không kèm `public/_redirects`.

**Đây là lệch luật R3 có ý thức.** `04-CONSTRAINTS` §1c: *"một URL đã từng tồn tại KHÔNG được biến mất câm"*. Mục này ghi lại để lần sau tra được vì sao sáu URL đó chết, thay vì ai đó phát hiện rồi coi là sự cố.

**Ánh xạ cũ→mới, ghi lại phòng khi sau này muốn thêm 301.** Truy được nhờ một trùng hợp: `bookingRef.key` của các tour đó lưu chính slug **cũ** (module đặt tour đặt khoá lúc 2026-08-22 07:58Z, trước khi ai đổi slug).

| URL cũ | URL mới | `_id` |
|---|---|---|
| `tour-3-dao-hon-mun-mini-beach-lang-chai` | `tour-3-dao-mini-beach` | `0cab212b` |
| `tour-3-dao-nha-trang-hon-mun-hon-tam` | `tour-3-dao-hon-mun` | `5644d7a5` |
| `tour-3-dao-nha-trang-mini-beach-hon-tam` | `tour-3-dao-vip-nha-trang` | `9ebebf78` |
| `ve-hon-tam-seaday-tour-03` | `ve-hon-tam-tam-bien` | `702a7d9a` |
| `ve-hon-tam-tam-bun-tam-bien` | `tour-hon-tam-tam-bun-tam-bien` | `e2cadbb4` |
| `ve-hon-tam-tam-tron-goi` | `ve-hon-tam-tron-goi` (`41b46261`) — **chủ dự án chọn 2026-08-23**; không suy được từ dữ liệu | — |

**Mức tin của bảng này thấp hơn phần còn lại của mục.** Năm dòng đầu là **suy** từ việc `key` trùng slug cũ, không phải từ một bản ghi "đã đổi tên" trong Sanity. Khớp sitemap production nên đáng tin, nhưng nếu đợt đổi slug đi kèm **gộp hoặc tách nội dung** thì ánh xạ một-đối-một sai. Ai dùng bảng này để viết 301 phải kiểm lại nội dung hai đầu trước.

**Lỗ hổng cổng lộ ra, chưa vá.** `build:ci` = `npm run build` = `astro check && astro build`, **không gọi** `npm --prefix scripts run validate:post` — mà cổng R3 (so sitemap production với sitemap bản dựng) nằm ở đó. Nên Workers Builds **không bao giờ bắt được** URL biến mất; lần này người bắt là một tác nhân, không phải máy. Chưa quyết vá thế nào; ghi ra để khỏi rơi.

**Cảnh báo vận hành kèm theo.** `npm run build` của repo này gãy được vì mạng: 2026-08-22 một build chết giữa chừng do `Socket timed out` khi gọi Sanity API, `dist/` tụt từ 105 trang xuống 2 mà lệnh vẫn kết thúc không báo đỏ. Sau mỗi lần phát hành phải **đếm số trang thật** trên production, không tin dấu tích xanh của Workers Builds. Mốc trước lần push này: **100 URL** trong `sitemap-vi.xml`.

---

## QĐ-2026-08-23-02 — `06-BINDING_MAP` v2.3: đoạn mở rời hero, và Luật 5 cột→hàng ở di động

**Trạng thái:** **chốt 2026-08-24.** Chủ dự án chọn **phương án A kèm chỉnh câu chữ** ở phần xung đột. `06` lên v2.3.0 chính thức. Nhánh `worktree-binding-map-v2-3`, chưa gộp vào `main`.

**Bối cảnh.** Chủ dự án nêu bốn việc bề mặt ngày 2026-08-22. Qua phiên brainstorm, hai trong bốn việc được chốt bằng lựa chọn trực tiếp (ghi ở `SPEC-2026-08-22-be-mat-vong-5` §3.2 và §3.6), nhưng **chưa được ghi vào đặc tả**. Bước 7 (Design) không mở được chặng 2 khi `06` chưa nói điều Design sắp vẽ — đó là "Design đi trước cấu trúc", `CLAUDE.md` §5 chặn. Phiếu này ghi hai quyết định đó thành đặc tả.

**Chốt 1 — `summary` rời hero.** Đoạn mở chuyển từ hero xuống **dải sáng dưới hero, sau thanh dính**, trên Thông tin nhanh. Hero còn **huy hiệu loại + h1**.

Lý do chủ dự án chọn phương án này thay vì đưa lên trên hero: đưa lên trên đẩy ảnh xuống khoảng 160px trên di động, làm màn đầu toàn chữ — mất cú hích cảm xúc của một site du lịch. Đặt sau thanh dính thay vì trước cũng có lý do đo được: chen trước thanh dính đẩy giá và CTA trên desktop tụt thêm ~110px, buộc mở lại Luật 3 "giá trước, chữ sau".

Lợi ích kèm theo, đo được: QA1 đợt 4B vòng 3 đo tương phản đoạn mở **trên ảnh** ở bộ xấu nhất `ngoc-lam` là 6,6:1 — đạt AA nhưng phải dựa vào lớp phủ canh theo từng ảnh. Đưa xuống dải sáng thì rủi ro đó biến mất hẳn.

Sửa ở `06`: §3 hàng "Đoạn mở" và hàng "Hero"; §3.1 ô `summary` cho cả bốn entity; dòng thứ tự khối di động.

**Chốt 2 — Luật 5: ô cạnh nhau trên desktop, mỗi ô một hàng trên di động.** Vùng nào trình bày nhiều ô ngang hàng ở desktop thì ở `≤ 640px` chuyển thành mỗi ô một hàng chiếm hết bề rộng, nhãn trái, giá trị phải. **Lưới thẻ loại trừ** — thẻ mang ảnh và tiêu đề, không phải cặp nhãn/giá trị.

**⚠ Chốt 2 có một xung đột phải chủ dự án gỡ, không phải chuyện hình thức.**

`06` §3 hàng "Thông tin nhanh" (v2.1) đã có một luật di động: *"di động **giữ lưới 2 cột**"*. Câu đó **không tương thích** với Luật 5: lưới 2 cột giữ hai ô cạnh nhau, Luật 5 tách mỗi ô một hàng.

Bản nháp này cho Luật 5 **thay** câu cũ, vì đó là điều chủ dự án chọn khi được xem hai bố cục cạnh nhau. Nhưng hệ quả phải nói rõ:

- `FactStrip.astro` **vừa được sửa ngày 2026-08-23** để theo đúng câu cũ ("giữ lưới 2 cột"), trong đợt sửa của review toàn nhánh nhánh `feat/dong-luat-1` (PR #1).
- Áp Luật 5 nghĩa là **sửa lại CSS của đúng file đó** sau khi PR #1 gộp.
- Chi phí nhỏ — một khối `@media` trong một file — nhưng nó là công làm hai lần, và chủ dự án nên biết trước khi chốt.

**Ba lựa chọn:**

| # | Phương án | Hệ quả |
|---|---|---|
| **A — ĐÃ CHỌN** | Luật 5 thay câu cũ | Sửa lại CSS `FactStrip.astro` một lần sau khi PR #1 gộp |
| B | Giữ "lưới 2 cột", thu Luật 5 lại chỉ áp cho các vùng khác | Mã không phải sửa, nhưng Thông tin nhanh — vùng chính của yêu cầu — lại nằm ngoài luật |
| C | Hoãn Luật 5 sang vòng sau | Chặng 2 của Design vẫn mở được nhờ Chốt 1, nhưng ý (3) chưa được xử |

**Chỉnh câu chữ đi kèm khi chốt A.** Bản nháp ghi *"nhãn trái, giá trị phải"*. Đo 272 ô trên bản dựng thật trước khi chốt cho thấy câu đó tự làm yếu chính mình: nhãn cũng chiếm chỗ ("Website chính thức" đã 18 ký tự), nên chia đôi hàng chỉ cho giá trị ~190–215px — hơn lưới 2 cột chừng 15–25%, không phải gấp đôi. Với `address` 78 ký tự thì vẫn vắt nhiều dòng.

Nên Luật 5 nay **chọn kiểu theo độ dài giá trị**: vừa một dòng thì nhãn trái / giá trị phải; dài hơn một dòng thì nhãn trên / giá trị full-width (~358px). Số đo và lý lẽ ghi ngay trong §6 để lần sau không phải đo lại.

**Số đo dùng để chốt:** trung vị **13 ký tự**; **28% số ô (75/272) dài quá 20 ký tự**; ở 390px lưới 2 cột cho mỗi ô ~170px ≈ 20–24 ký tự. Tức **72% số ô vốn đã vừa khít** — luật này tồn tại cho 28% còn lại, và cho ô địa chỉ.

**Giá phải trả, nói rõ khi chốt:** trang dài thêm ~112px với entity 5 ô (~13% một màn 390×844), và một khối `@media` trong `FactStrip.astro` phải sửa lại sau khi PR #1 gộp.

**Không đổi gì khác.** Không field nào của `01-CONTENT_MODEL` đổi. §3.1 vẫn bốn cột; Organization và Person vẫn không có hàng (DR-046). Luật 1–4 giữ nguyên.

**Kiểm sau khi chốt.** `06` lên v2.3.0 chính thức, rồi mở chặng 2 của `docs/prompts/VONG-5-CLAUDE-DESIGN.md`.

**Một việc mã bắt buộc đi kèm, đã kiểm chứ không đoán.** Chốt 1 đưa vào §3.1 một **tên vùng mới**: `dải đoạn mở`. Bộ kiểm `luat1-post` (nhánh `feat/dong-luat-1`, PR #1) tra tên vùng qua bảng `ALIAS`; `dải đoạn mở` không có trong bảng, không bắt đầu bằng "mục"/"dòng", và không chứa alias nào đã biết — nên `idTuTenVung()` trả `null`, `ktraVungLa()` bắt được, và validator **exit 1 với "§3.1 có tên vùng chưa khai trong ALIAS"** trước khi quét trang nào.

Đó là bộ kiểm **chạy đúng thiết kế**: vùng lạ làm nó đỏ to thay vì bị bỏ qua im lặng. Nhưng nghĩa là chốt phiếu này kéo theo **hai dòng mã**: thêm `'dải đoạn mở': 'summary-band'` vào `ALIAS`, và gắn `data-region="summary-band"` lên dải đoạn mở khi Code dựng nó.

Ghi ra đây để không ai chốt phiếu rồi ngạc nhiên vì cổng đỏ.

---

## QĐ-2026-08-24-01 — "Miễn phí" không phải một mức giá: Điểm tham quan miễn phí bỏ vùng giá

**Trạng thái:** chốt 2026-08-24. `06-BINDING_MAP` lên **v2.3.1** (§3.1). Nhánh `docs/06-v2-3` (PR #2), chưa gộp.

**Bối cảnh.** Chủ dự án nêu từ đầu: trang Chùa Long Sơn *"hiện nhiều mức giá miễn phí"*. Đợt Code đóng Luật 1 (PR #1) đưa con số từ **4 lần xuống 3**, và xoá được lỗi nặng hơn là **hai nhãn khác nhau cho cùng một sự thật** ("Giá vé" ở InfoBar, "Phí vào cửa" ở InfoCard). Nhưng 3 vẫn không phải 1, và `QĐ-2026-08-23-02` đã ghi rõ phần còn lại **không sửa được ở tầng Code** — nó là dư thừa trong chính §3.1.

**Đo được.** 13 trang hiện nhãn miễn phí: **11 Điểm tham quan, 2 Địa danh**, không có Trải nghiệm nào. Trên một trang điểm tham quan miễn phí, "Miễn phí" hiện **3 lần**: `gia` ở thanh dính, `gia` ở khối hành động, `isAccessibleForFree` ở Thông tin nhanh.

**Gốc.** `resolvePrice()` coi `isAccessibleForFree` **là một mức giá** nên bơm nhãn "Miễn phí" vào kênh giá; §3.1 đồng thời cấp cho field đó một ô Thông tin nhanh riêng. Hai kênh, một sự thật.

**Chốt.** Với Điểm tham quan có `isAccessibleForFree` = true: nhãn "Miễn phí" hiện **đúng một lần, ở Thông tin nhanh**; **vùng giá không render** — không thanh dính, không khối hành động. 3 lần → **1 lần**.

**Lý lẽ, và vì sao đây không phải ngoại lệ tuỳ tiện.** Ngoại lệ hai vùng của giá được §6 Luật 1 biện minh bằng đúng một câu: *"vì đó là quyết định mua"*. Một điểm tham quan miễn phí **không có quyết định mua nào** — không vé để bán, không giá để so. Biện minh không với tới nó, nên Luật 1 trở lại mức mặc định.

Đây cũng **không phải lối đi mới**: §4.4 đã chọn nó cho Trải nghiệm từ trước (*"hiện nhãn miễn phí **thay** vùng giá"*), §4.2 cho Địa danh (*"Place không có vùng giá"*). Điểm tham quan là entity **duy nhất** đi kiểu khác; v2.3.1 đưa nó về cùng lối. Nói cách khác, đây là **xoá một ngoại lệ**, không phải thêm một ngoại lệ.

**Một việc chưa quyết, ghi để không rơi.** Hôm nay khối hành động của trang miễn phí render nút **"Đặt vé"** trỏ Zalo — một nút "đặt vé" trên một ngôi chùa miễn phí. Gỡ vùng giá **không** tự gỡ nút đó. Nút liên hệ Zalo vẫn có giá trị trên trang điểm tham quan, nhưng **nhãn phải đổi** (liên hệ / hỏi đường, không phải "đặt vé"). Đó là câu hỏi nhãn và luồng, thuộc bước 7; chưa quyết ở đây.

**Việc mã kéo theo**, gộp cùng ba việc của `QĐ-2026-08-23-02`, làm sau khi PR #1 gộp:

- `AttractionDetail.astro`: khi `isAccessibleForFree` = true thì không truyền `priceLabel` cho thanh dính và không bật slot khối hành động **vì giá**.
- Bộ kiểm `luat1-post` **tự động theo** — nó đọc §3.1 lúc chạy, nên ô `giá` của Điểm tham quan nay mang thêm điều kiện sẽ được phản ánh mà không phải sửa validator. Nhưng **phải kiểm lại**: nếu template vẫn render `gia` khi miễn phí thì tầng B đỏ, đó là bộ kiểm làm đúng việc.

**Không đổi gì khác.** Không field nào của `01-CONTENT_MODEL` đổi. Trải nghiệm, Địa danh, Tour giữ nguyên. Luật 1–5 giữ nguyên câu chữ.
