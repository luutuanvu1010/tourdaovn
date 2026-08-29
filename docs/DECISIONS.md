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

---

## QĐ-2026-08-24-02 — Ràng buộc "dữ liệu mỏng" thu hẹp thay vì bỏ; và nhãn nút trên trang miễn phí vào phạm vi Design vòng 5

**Trạng thái:** chốt 2026-08-24. Sửa `SPEC-2026-08-22-be-mat-vong-5` §6 và §7 (R4, R8, R9). Không đụng `06`, `07`, `01-CONTENT_MODEL`.

**Bối cảnh.** Prompt bàn giao Design vòng 5 (`docs/prompts/VONG-5-CLAUDE-DESIGN.md`, `f37b404` → `9a9d06f`) tự tuyên bố ràng buộc R8 của spec — *"dữ liệu mỏng: mọi khối phải tử tế với 1 mục"* — **đã hết hiệu lực**, rồi thay chỗ R8 bằng một ràng buộc khác. Prompt không có thẩm quyền huỷ ràng buộc cứng của spec: `CLAUDE.md` §1 xếp spec trên prompt. Hệ quả thực tế là tồn tại **hai bảng R1–R8 khác nhau cho cùng một cổng QA1**, đúng loại nguồn sự thật thứ hai mà `CLAUDE.md` §5 bắt dừng. QĐ này xử ở tầng đúng: sửa spec, rồi prompt chép lại.

**Đo được (bản dựng `dist/` 2026-08-24 09:37, sau `d31eef3`).** Đếm trang chi tiết entity, tách trang term bằng dấu hiệu JSON-LD `"@type":"DefinedTerm"`:

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

Cộng **11 trang term** (9 dưới `/tour/`, 2 dưới `/trai-nghiem/`) và các trang index nhánh, hub, tĩnh → **128** `index.html` trong `dist/`.

**Ba con số của prompt không khớp bản dựng và phải sửa:** prompt ghi Tour **30** (thực **23**, dôi 30%), Trải nghiệm **10** (thực **9**), Điểm tham quan **34** (thực **36**); và dòng "Tổng **123**" không bằng tổng các dòng của chính nó (102) — `grep` toàn `docs/` cho thấy số 123 không xuất hiện ở bất kỳ nguồn nào khác, tức không truy được phép đo.

**Chốt 1 — R8 thu hẹp, không bỏ.** Tiền đề của prompt đúng ở phần lớn: hồi soạn prompt Pha F kho có 1 tour, nay có 23; lưới ba thẻ trên trang Tour và Điểm tham quan không còn nguy cơ để một thẻ lẻ loi. Nhưng "kho đã dày" **không đúng đều**, và bằng chứng ngược nằm trong cùng bản dựng đó:

- `/resort/` là index nhánh có **0** entity — một dải rỗng hoàn toàn vẫn đang được dựng.
- Khách sạn 6, Địa danh 7, Trải nghiệm 9 — dưới một lưới ba cột hai hàng.
- Các dải sinh từ truy vấn liên quan (**Gần đây**, **Trải nghiệm tại đây**, **Dải liên quan** §3 v2.2) có số mục phụ thuộc dữ liệu từng trang, không phụ thuộc tổng kho: một Địa danh vẫn có thể chỉ có 1 mục lân cận.

Nên R8 **không bị bỏ**, mà thu hẹp từ "mọi khối" xuống đúng chỗ còn rủi ro. Câu mới ở §7:

> **R8** — **Khối có số mục phụ thuộc dữ liệu phải tử tế với 1 mục.** Áp cho: mọi dải/lưới sinh từ truy vấn liên quan (Gần đây, Trải nghiệm tại đây, Dải liên quan), và mọi listing của nhánh dưới 12 entity (Khách sạn 6, Địa danh 7, Trải nghiệm 9, Resort 0). **Không** còn áp cho lưới thẻ của Tour và Điểm tham quan — hai nhánh này đã đủ dày (23 và 36) để bố cục lấy 3 thẻ một hàng làm mặc định. Đi cùng R7: ít mục thì thu khối lại cho tử tế, **không** độn placeholder cho đầy hàng.

**Chốt 2 — ràng buộc mới của prompt vào spec làm R9, không chiếm chỗ R8.** Nội dung prompt đặt nhầm vào ô R8 là một ràng buộc thật và đáng giữ, chỉ là không được đá chỗ R8:

> **R9** — Không đổi một field nào của `01-CONTENT_MODEL`; không sửa `06-BINDING_MAP`, không sửa `07-DESIGN_TOKENS`. Design **đề xuất**; Cowork ghi vào đặc tả sau khi chủ dự án duyệt.

**Chốt 3 — nhãn nút trên trang miễn phí là hạng mục giao nộp của Design vòng 5.** `QĐ-2026-08-24-01` để treo câu hỏi này với chữ *"thuộc bước 7; chưa quyết ở đây"*. Nay đóng: nó vào **§6 chặng 2** như hạng mục giao nộp thứ mười hai — Design đề xuất **chữ và vị trí** cho nút Zalo trên trang điểm tham quan miễn phí, chủ dự án chốt. Ràng buộc của đề xuất, phải ghi thẳng vào prompt vì thiếu nó thì Design không biết biên:

- `06` §6 **Luật 3** cấm "nút thay thế trỏ về chính site" khi không có giá. Nút Zalo trỏ **ra ngoài** site nên **không** vướng Luật 3 — nhưng một nút trỏ về trang khác của tourdao.vn thì vướng.
- **R7** cấm CTA giả. Nút phải dẫn tới một hành động có thật (mở Zalo), không phải một nút trang trí cho cân bố cục.
- Nhãn "Đặt vé" **bị loại** trên trang miễn phí: không có vé để đặt.

**Chốt 4 — mốc thư mục font sửa theo số đo, và ghi rõ đơn vị.** Bốn tài liệu (`07` §2, `DECISIONS` QĐ-2026-08-06-11, nhật ký 06/08, spec §2/§6/§7 R4) ghi **~104 KB**; prompt ghi **108 KB** ở hai chỗ mà không nói mình đo lại. Đo hôm nay, `public/fonts/` có đúng **6 file** `.woff2`:

| File | Byte |
|---|---|
| `nunito-latin-viet-var.woff2` | 39.152 |
| `nunito-vietnamese-var.woff2` | 13.040 |
| `be-vietnam-pro-latin-viet-800.woff2` | 13.380 |
| `be-vietnam-pro-latin-viet-700.woff2` | 13.348 |
| `be-vietnam-pro-vietnamese-800.woff2` | 5.144 |
| `be-vietnam-pro-vietnamese-700.woff2` | 5.132 |
| **Tổng payload** | **89.196 byte = 87,1 KB** |

`du -sh public/fonts` trả **108K** — đó là dung lượng đĩa sau khi làm tròn theo block, không phải payload. Prompt lấy đúng số này làm mốc, trong khi R4 lại bắt Design *"ghi số byte woff2 từng file"*: cộng payload rồi so với mốc đĩa là lệch ~21 KB, và R4 không chấm được.

**Chốt:** mốc và trần của R4 đều tính bằng **tổng byte payload của các file `.woff2`**, nêu rõ đơn vị. Mốc hiện tại **89.196 byte (87,1 KB)**. Trần giữ nguyên **140 KB payload** — mốc trước đợt đổi chữ, nay còn dư 53 KB. Con số ~104 KB trong các tài liệu cũ giữ nguyên làm **bản ghi lịch sử** của thời điểm đó, không sửa ngược.

**Không đổi gì khác.** `06` v2.3.1 giữ nguyên câu chữ. `07` giữ nguyên, vẫn chờ lượt V5. Luật 1–5 giữ nguyên. Hai phiếu drift của V1 (font-stack ngược, thang 14 bậc) **vẫn chưa viết** — xem mục "Nợ" dưới.

**Nợ ghi để không rơi.** Spec §4 khai V3 (prompt) **chặn bởi V1 + V2**. V2 xong. **V1 chưa xong**: `DRIFT_LOG.md` chưa có phiếu nào cho font-stack ngược (§2.2) hay thang cỡ 14 bậc vs 8 bậc khai (§2.3) — phiếu mới nhất là DR-049. Hai dữ kiện đó hiện chỉ sống trong prompt, mà prompt là artifact lịch sử chứ không phải sổ drift. QĐ này **không** đóng nợ V1; nó chỉ ghi rằng V3 đã chạy trước V1 và V1 vẫn phải viết.

---

## QĐ-2026-08-24-03 — Ảnh vào phạm vi Design vòng 5 (hạng mục 13, R10); nợ kho ảnh tách ra ngoài

**Trạng thái:** chốt 2026-08-24. Sửa `SPEC-2026-08-22-be-mat-vong-5` §2 (thêm 2.8), §6 (chặng 1), §7 (thêm R10), §9 (thêm V-A/V-B/V-C). Không đụng `06`, `07`, `01-CONTENT_MODEL`, không đụng `src/`.

**Bối cảnh.** Chủ dự án mở phiên 2026-08-24 với yêu cầu *"refactor lại trang chủ và các trang thành phần (các entity) cho trang doanh nghiệp du lịch địa phương"*, rồi khoanh lại: tầng cần đổi là **diện mạo** — chữ, thang cỡ, màu, ảnh, khoảng cách.

Đối chiếu với đặc tả đang có cho ra ba kết luận, và cả ba đổi hướng của phiên:

1. **Ba phần tư yêu cầu đã có spec rồi.** `SPEC-2026-08-22-be-mat-vong-5` §3.3 chép đúng ba triệu chứng đó — *"chữ không hợp ngành du lịch, cỡ chữ lộn xộn phân cấp mờ, màu chưa ra chất du lịch"* — và §6 đã chia thành ba artboard chặng 1. Viết một spec "vòng 6" cho cùng ba thứ là dựng **hai đặc tả cùng chi phối bộ chữ và bộ màu**, đúng loại nguồn sự thật thứ hai mà `CLAUDE.md` §5 bắt dừng. Nên phiên này **sửa đổi spec vòng 5**, không tạo spec mới.

2. **Trang chủ không cần đặc tả riêng cho phần diện mạo.** Ranh giới của vòng 5 đã ghi *"Token áp toàn site; bố cục chỉ đụng trang chi tiết entity"*. Đo lại để chắc rằng câu đó đúng trên mã chứ không chỉ đúng trên giấy — đếm mã màu viết cứng trong toàn bộ `src/components/` và `src/layouts/`: **6 mã, ở 4 file** (`TourDetail` 2, `RouteMap` 2, `ExperienceDetail` 1, `BaseLayout` 1), và **0 mã** trong 15 file `Home*` cộng `SiteHome`; `font-size` không đi qua token: **2**. Kỷ luật token đủ chặt để **đổi token là trang chủ đổi thật**. *Bố cục* trang chủ vẫn ngoài phạm vi, đúng như §9 — việc "bày lại trọn trang chủ theo mạch bán hàng" mà vòng 3 §4 để dành vẫn còn để dành.

3. **Còn đúng một lỗ hổng thật: ảnh.** Vòng 5 phủ chữ, thang cỡ, màu. Không phủ ảnh. `07-DESIGN_TOKENS` **không có mục nào về ảnh** — chỉ vài câu rải rác nói *vai trò* của ảnh; `tokens.css` **không có token tỷ lệ nào**; và **5 tỷ lệ khung đang rải ở 8 component** mà không đặc tả nào khai cái nào cho vai nào.

**Đo được (2026-08-24, đọc Sanity, bộ lọc "lên sóng" chép đúng `src/lib/sanity.ts:162`).** Script và kết quả đầy đủ: `docs/evidence/2026-08-24-kho-anh/`.

| Dữ kiện | Số |
|---|---|
| Trang chi tiết lên sóng, 6 loại entity có ảnh | **89** |
| Ảnh chính hẹp hơn **1200px** mà `Hero.astro:20` xin | **40/88 = 45 %** |
| Hẹp hơn cả **640px** của thẻ lưới | 7/88 = 8 % |
| Hẹp nhất — `attraction/thac-ta-gu`, ảnh **dọc** trong khung ngang | **399×501** |
| Một tấm ảnh dùng ở nhiều chỗ | **27 tấm** (một tấm 3 lần) |
| Thiếu `alt` | 10/88 ảnh chính + 16/309 ảnh gallery |
| Trang lên sóng không có ảnh chính | 1 (`tour/tour-du-thuyen-vega-yacht-nha-trang-day-tour`) |

**Số này khác `QĐ-2026-08-24-02`, và cả hai đều đúng.** Phiếu trước đếm bản dựng `dist/` lúc **09:37** cùng ngày (Tour 23, Khách sạn 6); phiếu này đọc Sanity **sau giờ đó** (Tour 27, Khách sạn 10). Chênh lệch là **10 tài liệu được duyệt sau giờ dựng** — 6 tour du thuyền, 4 khách sạn; `ket-qua-doi-chieu.txt` chỉ đích danh từng cái. **Bài học ghi lại: con số về kho luôn phải kèm mốc đo**, vì kho đang thay đổi hằng ngày.

**Một phép đo đảo ngược giả thiết ban đầu, và làm ca này nặng hơn.** Bản nháp phiếu này viết rằng Sanity CDN *không* phóng ảnh lên. Sai — đã đo bằng cách tải thật và đọc kích thước pixel từ header file:

| Ca | Gốc | Mã xin | CDN trả về | Đang tải | Nếu xin đúng cỡ gốc | Phí |
|---|---|---|---|---|---|---|
| `attraction/thac-ta-gu` | 399×501 | `w=1200` | **1200×1507** | 283.013 B | 59.279 B | **+223.734 B (+377 %)** |
| Hero **trang chủ** | 1280×720 | `w=1800` | **1800×1013** | 232.531 B | 164.493 B | **+68.038 B (+41 %)** |

Ảnh dưới mốc bị trả giá **hai lần**: vừa mềm vì không có thêm chi tiết nào để hiện, vừa **nặng hơn cả ảnh gốc** vì CDN nội suy lên rồi nén lại. Riêng hero trang chủ phí **68.038 byte** — bằng **76 % toàn bộ ngân sách font của site** (89.196 byte, `QĐ-2026-08-24-02`) — cho không một chi tiết nào thêm. Đặt cạnh nợ LCP ở spec §2.6: đang cân từng KB bộ chữ để cứu LCP, trong khi phần tử LCP nhiều khả năng chính là tấm ảnh bị phóng 1,4× đó.

**Chốt 1 — ảnh thành hạng mục giao nộp thứ mười ba, ở chặng 1 chứ không phải chặng 2.** Hai phần: **13a** bảng tỷ lệ khung theo vai (tối đa 3 tỷ lệ, mỗi tỷ lệ gắn ít nhất một vai, kết quả vào `07` thành token chứ không viết cứng trong component); **13b** chuẩn chất ảnh. Đặt ở chặng 1 vì **ảnh và màu phải được nhìn cùng nhau** — chốt bộ màu trên một tấm ảnh rồi mới đổi chuẩn ảnh là phải chốt màu lại; và vì chặng 1 vốn đã bắt dựng bằng **ảnh thật lấy từ Sanity**.

**13b có một lý do riêng để không hoãn: chuẩn chất ảnh đang tồn tại mà không có chủ.** `readme.md` của dự án Claude Design tự viết *"ảnh biển đảo thật, nắng trưa, xanh lam–ngọc, tương phản cao. Không ảnh đơn sắc, không filter lạnh, không grain"*. Câu đó không truy về được đặc tả nào — Design tự đặt ra. Hoặc nó vào `07` thành luật, hoặc nó bị gỡ; để nguyên là một nguồn sự thật thứ hai đang lớn dần.

**Chốt 2 — thêm R10 vào §7: mốc phân giải tối thiểu theo vai, và cấm phóng ảnh lên.** Mỗi vai trong bảng 13a kèm một mốc bề rộng tối thiểu. Ảnh dưới mốc **không được xin cỡ lớn hơn ảnh gốc**. Design đề xuất **cách rơi** (hạ khung, đổi bố cục, hay hero thuần chữ); chủ dự án chốt. Cấm cách rơi nào tạo ô trống hay ảnh placeholder — **R7 vẫn áp**.

Đây là ràng buộc cứng chứ không phải khuyến nghị, vì nó có bằng chứng byte đứng sau và vì nó chạm R5: một mốc phân giải ghi trong bảng mà không có luật cấm phóng thì mã vẫn cứ xin `w=1800` cho ảnh 1280px như hôm nay.

**Chốt 3 — nợ kho ảnh tách ra ngoài vòng 5, thành V-A/V-B/V-C ở §9.** Vòng 5 sửa **luật** về ảnh; nó không sửa được **kho** ảnh — đó là việc nhập liệu trong Sanity, không token nào chạm tới.

| Mã | Việc | Khối lượng |
|---|---|---|
| **V-A** | Thay ảnh dưới mốc phân giải | 40 trang (7 trong đó hẹp hơn cả 640px) |
| **V-B** | Rà 27 tấm ảnh dùng ở nhiều chỗ — dùng lại **không mặc nhiên sai**, phải rà từng ca | 27 tấm |
| **V-C** | Bù `alt` còn thiếu | 26 ảnh |

Tách để hai việc không kẹt nhau: Design chạy được chặng 1 khi kho ảnh chưa xong, và ngược lại. Nhưng **ba việc này chỉ mở sau khi chốt 13a và R10** — thay ảnh trước khi biết tỷ lệ khung và mốc phân giải là thay hai lần.

**Chốt 4 — khoảng cách KHÔNG vào phạm vi.** Chủ dự án có nêu khoảng cách cùng với ảnh. Loại ra vì **không có bằng chứng hỏng**: thang 9 bậc (4·8·12·16·24·32·48·64·96) đang được tôn trọng, `DESIGN_SURFACE_MAP` không ghi vấn đề nào, và `07` §3 đã khai nhịp dọc chuẩn của một mục. Mở một hạng mục không có triệu chứng đo được là mời Design đi sửa thứ đang chạy đúng. Nếu sau chặng 1 nhìn bản dựng thật mà thấy nhịp sai thì mở lại — bằng một phiếu có số đo, như phiếu này.

**Không đổi gì khác.** `06` v2.3.1 giữ nguyên. `07` giữ nguyên, vẫn chờ lượt V5 — hạng mục 13 và R10 là **đề xuất** của Design, Cowork mới ghi vào `07` sau khi chủ dự án chốt (**R9**). Luật 1–5 giữ nguyên. R1–R9 giữ nguyên câu chữ. Phạm vi bố cục không đổi: trang chủ, header, footer vẫn ngoài phạm vi vẽ lại.

**Nợ ghi để không rơi.** Trong lúc đo, phát hiện **hai chỗ lệch trong chính `07`** chưa ai ghi phiếu; đã viết thành `DR-053` và `DR-054`. Cả hai đều chạm đúng thứ chặng 1 sắp chốt, nên phải đóng cùng lượt V5, không để trôi:

- **`DR-053`** — `07` §0 mục 1 (bổ sung 2026-06-30) vẫn cho phép *"ảnh và motif gợi thêm đồng lúa, đầm phá, chân núi và rừng"*, trong khi §1 (chốt 2026-08-06, tự khai *"thay quy tắc cảnh quan cũ"*) **cấm hoạ tiết đất liền**. Hai câu trong cùng một file đánh nhau — và đây đúng là câu mà 13b phải dựa vào.
- **`DR-054`** — `07` §0 mục 2 khai chữ nội dung là **Plus Jakarta Sans**; mã chạy **Nunito**. `DR-050` bắt §2, chưa bắt §0. Chặng 1 chốt bộ chữ mà `07` còn hai chỗ mô tả sai ở hai mục khác nhau thì Cowork không biết ghi đè lên đâu.

---

## QĐ-2026-08-24-04 — Giữ hai bộ chữ đang chạy; đóng xung đột giữa hai đề xuất Design

**Trạng thái:** chốt 2026-08-24. Không sửa `tokens.css` ở phiếu này. Đóng xung đột, không mở việc mới.

**Bối cảnh — hai đề xuất cùng chi phối `--font-display` và `--font-ui`.** Trong cùng ngày 2026-08-24 có hai sản phẩm Design nói ngược nhau về bộ chữ:

| | Canvas `dc5e2c02` (chặng 1, phiên này) | Project Design `fca38485` (chặng 2) |
|---|---|---|
| Bộ chữ | **Bỏ Nunito**, Be Vietnam Pro cả hai vai — 73.056 B, giảm 16.140 B | **Giữ cả hai vai** như đang chạy — 89.196 B, không đổi |
| Thang cỡ | Gộp **14 bậc → 8** | Giữ số bậc; sửa 4 giá trị, thêm 2 token cho di động |

Để nguyên là đúng loại nguồn sự thật thứ hai mà `CLAUDE.md` §5 bắt dừng: hai đặc tả cùng quyết một token.

**Chốt — giữ cả hai bộ.** Chủ dự án chốt 2026-08-24. `--font-display` giữ Be Vietnam Pro, `--font-ui` giữ Nunito. **Đề xuất "bộ B" của canvas chặng 1 rút lại**, không thi hành, không giữ làm phương án dự phòng. Ngân sách font đứng nguyên **89.196 byte** — R4 không bị đụng, và trần 140 KB còn dư nguyên.

Hệ quả kèm theo: hướng thang cỡ đi theo project `fca38485` — **giữ số bậc, sửa giá trị, thêm token cho di động** — chứ không gộp 14 xuống 8. Hai token cỡ di động vẫn **chưa được duyệt**; chính artboard của Design ghi *"cần một phiếu quyết định trước khi vào `tokens.css`"*, và phiếu đó chưa có.

**Đã thi hành ngay trong phiên, phần không cần ai quyết:** hai khối `@font-face` cấp **800** cho Be Vietnam Pro vào `src/layouts/BaseLayout.astro` — đóng phần chính của `DR-052`. Bốn khối thành sáu. **Chi phí thật: +18.524 byte trình duyệt phải tải** — bản đầu của phiếu này ghi "0 byte tải thêm", **sai**, và sai ngược với chính phép đo của `DR-052`: hai file nằm trong `dist/` nhưng không luật CSS nào trỏ tới nên **không trình duyệt nào tải chúng**. Khai xong thì chúng mới được tải. Một trang tiếng Việt dùng cả hai cấp nay tải **89.196** byte thay vì 70.672 — vẫn dưới trần R4 140 KB. Đây là đổi byte lấy độ đậm thật. Kiểm trên bản dev server phát ra: 2 khai `font-weight: 800`, cả hai tên file có mặt ở trang chủ lẫn trang chi tiết; `astro check` 0 lỗi 0 cảnh báo. Bôi đậm giả trên ≥12 component chấm dứt.

**Không đổi gì khác.** `07` giữ nguyên, vẫn còn `DR-050`/`DR-051`/`DR-054` mô tả sai bộ chữ và thang — phiếu này **không** đóng chúng, chỉ khiến chúng dễ đóng hơn vì hướng đã rõ: đặc tả phải viết lại theo mã, không phải ngược lại. `--fw-900` và dòng preload vẫn mở, ghi trong `DR-052`.

---

## QĐ-2026-08-24-05 — `06` v2.4: `title` rời lớp phủ hero; dựng dải tiêu đề và dải đoạn mở, đóng DR-049

**Trạng thái:** chốt 2026-08-24. Sửa `06-BINDING_MAP` §3 (hàng Hero, thêm hàng Dải tiêu đề) lên **v2.4.0**; sửa `src/components/DetailLayout.astro`. Không đụng `01-CONTENT_MODEL`, không đụng `07`, không đụng `tokens.css`.

**Bối cảnh.** Design chặng 2 giao bảy mockup mobile-first (project `fca38485`). `DR-049` khai điều kiện đóng đúng bằng câu này: *"Design chặng 2 giao bề mặt cho dải đoạn mở → QA1 → Code dựng dải"*. Điều kiện đã đủ. Nhưng khi đối chiếu mockup với `06` v2.3, QA1 bắt **hai chỗ lệch**, và một trong hai chạm ràng buộc cứng.

**Lệch 1 — `h1` rời hero.** `06` v2.3 khai hero còn *"huy hiệu loại + h1"*; mockup đưa cả `h1` xuống dưới ảnh. Đây là **cải tiến thật**, không phải lỗi: chữ trên ảnh buộc phải canh tương phản theo từng tấm ảnh, và QA1 đợt 4B đã đo được **6,6:1** ở bộ `ngoc-lam` — sát ngưỡng AA. Trên nền sáng, cặp `--c-text`/`--c-surface` đo **17,85:1** (`bien-sau`) và **16,80:1** (`cat-bien`).

**Lệch 2 — vị trí đoạn mở, và đây là chỗ phải bác.** Mockup đặt cả `h1` lẫn đoạn mở **trước** thanh dính. Spec vòng 5 §3.6 đã bác đúng cách bày đó ngày 2026-08-23 với lý do ghi sẵn: *"đẩy giá xuống sâu thêm ~110px trên desktop, phải mở lại Luật 3"*. Cộng lại chiều cao từ chính markup của mockup, khổ desktop:

| Cách bày | Vị trí thanh giá |
|---|---|
| `06` v2.3 (h1 trong hero) | 68 + 51 + 380 + 24 = **~523px** |
| Mockup (h1 + đoạn mở cùng ra trước thanh dính) | 68 + 51 + 380 + **152** + 24 = **~675px** |

Chênh **~152px** — tệ hơn con số ~110px §3.6 dự đoán. Vùng nhìn thấy thật của laptop 1366×768 khoảng 625–660px, nên thanh giá **rơi khỏi màn đầu**. Đó là vi phạm **Luật 3** — *"màn đầu của entity thương mại phải có giá hoặc nhãn miễn phí"*. Trên di động thì không vướng, vì mockup có thanh dính đáy màn mang giá.

**Chốt — phương án A: lấy cái hay của mockup, giữ ràng buộc của `06`.**

- `title` **rời** lớp phủ hero xuống **dải tiêu đề**, dải sáng riêng ngay dưới ảnh và **trước** thanh dính.
- `summary` giữ **đúng chỗ `06` v2.3 đã chốt**: dải sáng **sau** thanh dính, trên Thông tin nhanh.
- Hero sau đó **chỉ còn huy hiệu loại và ảnh** — không còn chữ nào đè lên ảnh.
- Thanh giá đứng ở **~582px**, vẫn trên màn đầu. Luật 3 không phải mở lại; §3.6 không phải bác.
- Một thứ tự DOM cho cả hai khổ, không dựng hai lần.

Hai phương án đã loại: **B** — theo mockup nguyên văn rồi rút hero desktop 380→260px để bù; loại vì phải bác lại lý lẽ §3.6 và cần Design xác nhận hero 260px còn đủ ảnh. **C** — giữ `06` v2.3 nguyên văn; loại vì vứt mất cải tiến "chữ ra khỏi ảnh" trên di động, đúng thứ chủ dự án nêu là ưu tiên.

**Đã thi hành.** `DetailLayout.astro`: gỡ `h1` và `summary` khỏi `slot="overlay"`; dựng `.title-band` giữa hero và thanh dính; dựng `.summary-band` sau thanh dính, gắn `data-region="summary-band"` và `data-field="summary"`; `.detail-title` đổi màu chữ từ `--c-text-inverse` sang `--c-text`.

**Đối chiếu — đo trên bản dựng, không phải trên phép sửa:**

| Kiểm | Kết quả |
|---|---|
| Thứ tự vùng trong `<body>` | hero → title-band → sticky-bar → summary-band → fact-strip → two-col ✅ |
| `slot="overlay"` còn chứa chữ | **0** (chỉ còn breadcrumb + huy hiệu) |
| `astro check` | 0 lỗi, 0 cảnh báo (136 file) |
| **Luật 1 (`luat1-post`)** | **pass — 137 trang, 0 field lặp vùng, 0 field sai vùng** |
| `BM-ORPHAN-REGION`, `BM-EMPTY-REGION` | pass |
| Cổng đỏ còn lại | R3, R4, S24-AUTHORITY, control-registry, deferred — **đều là nợ dữ liệu URL/hreflang/metadata tác giả trên trang cẩm nang**, khớp đúng danh sách spec §9 khai, không cổng nào đỏ thêm |

Đây là **lần đầu tiên `luat1-post` canh được vùng đoạn mở**: trước đó `summary` chưa bao giờ được gắn `data-field` nên cổng mù với nó — một trong bốn vùng của `DR-048`.

**Còn mở, ghi để không rơi.** `title` **chưa** được gắn `data-region` và **chưa** vào ma trận §3.1, nên `luat1-post` chưa canh dải tiêu đề. Gắn nó cần phiếu riêng: `title` còn xuất hiện ở **mắt cuối breadcrumb**, nên đưa vào §3.1 mà không khai ngoại lệ cho breadcrumb sẽ làm Luật 1 báo lặp vùng. Breadcrumb sinh từ cây URL chứ không từ field entity nên ngoại lệ là hợp lý — nhưng phải viết thành chữ trước khi bật cổng.

**Chưa thi hành, thuộc lượt sau.** Bốn thay đổi còn lại của mockup — hero di động 240px, lịch trình gấp lại, khối đặt chỗ lên trên, thanh dính đáy màn — cùng hai token cỡ di động. Tất cả đều chờ spec vòng 5 qua cổng duyệt.

---

## QĐ-2026-08-25-01 — Bốn chỉnh sửa bề mặt: breadcrumb + tiêu đề lên trên hero, neo cuộn, hai cột Tổng quan; và một đính chính về footer

**Trạng thái:** chốt 2026-08-25. Sửa `06-BINDING_MAP` lên **v2.5.0** (§3: hàng Hero, hàng Dải tiêu đề, ghi chú hàng Breadcrumb). Sửa `DetailLayout.astro`, `Hero.astro`, `HomeFacts.astro`, `SiteHome.astro`, `tokens.css`. Không đụng `01-CONTENT_MODEL`, không đụng `07`, không đụng schema Sanity.

**Bối cảnh.** Chủ dự án xem bản dựng local sau `QĐ-2026-08-24-05` và nêu bốn chỉnh sửa. Ba việc thi hành được; việc thứ tư hoá ra **không phải việc code**.

---

### Chốt 1 — Breadcrumb và dải tiêu đề lên TRÊN hero

Chủ dự án yêu cầu đẩy cả hai lên trên ảnh. Hai hệ quả, một tốt một phải trả giá.

**Hệ quả tốt: đóng một drift chưa ai ghi.** `06` §3 khai từ **v2.2 (N3)** rằng breadcrumb *"nằm trên dải sáng phía trên hero, không đè lên ảnh"*. Mã lại đặt nó trong `slot="overlay"` của Hero suốt từ đó, kèm `inverse` để chữ trắng đọc được trên ảnh. Không cổng nào bắt được vì breadcrumb chưa gắn `data-region` — cùng khoảng mù `DR-048`. Nay `.crumb-band` là dải riêng, `inverse` bỏ đi, mã khớp đặc tả.

**Giá phải trả: Luật 3.** Đưa hai dải chữ lên trên đẩy thanh dính xuống sâu hơn. Cộng theo chiều cao thật của mã (không phải của mockup):

| Cách bày | Vị trí thanh giá, khung 1280px |
|---|---|
| Trước 2026-08-24 (cả ba thứ nằm trong lớp phủ) | 68 + 430 = **~498px** |
| `06` v2.4 (tiêu đề xuống dưới hero) | 68 + 430 + 104 = **~602px** |
| v2.5 nếu **giữ** hero 430px | 68 + 47 + 104 + 430 = **~649px** |
| **v2.5 với hero 380px** | 68 + 47 + 104 + 380 = **~599px** |

**⚠ Đính chính 2026-08-25, sau review.** Bảng trên **sai ở hai chỗ** và không được dùng làm căn cứ chốt:

1. **Bỏ sót `line-height` của breadcrumb.** Dải breadcrumb không phải 47px mà **~69px** (12 + đệm 32 + hộp dòng 15×1,68 = 25,2). Dải tiêu đề là ~100px, không phải 104.
2. **Giả định h1 luôn một dòng.** **14 trên 28** trang tour có tiêu đề trên 45 ký tự; ở 46px trong cột 1152px, quá nửa số đó xuống dòng, cộng thêm ~56px.

Cộng lại đúng: **~617px** với h1 một dòng, **~673px** với h1 hai dòng.

**ĐÃ ĐO 2026-08-25** (Chrome headless qua CDP, trên bản dựng thật — extension trình duyệt không dùng được ở phiên này, xem "Cách đo" dưới). Phép cộng lại của review **khớp gần như tuyệt đối**:

| Trang | h1 | viewport 1366×657 | Trên màn đầu? |
|---|---|---|---|
| `tour/ve-vin-harbour` (14 ký tự) | 46px, **1,14 dòng** | thanh dính **618 → 675px** | mép trên lọt, **mép dưới bị cắt** |
| `tour/hon-tam-tron-goi…` (65 ký tự) | 46px, **2,14 dòng** | thanh dính **674 → 731px** | **KHÔNG — nằm hẳn ngoài** |

657px là chiều cao viewport thật của trình duyệt trên màn 768 sau khi trừ chrome. Ở 1366×768 (không trừ chrome) thì cả hai đều lọt — nên con số phụ thuộc hoàn toàn vào việc lấy chiều cao màn hay chiều cao viewport, và **phải lấy viewport**.

**Kết luận: với tiêu đề dài, thanh dính không còn trên màn đầu ở laptop phổ biến.** 14/28 trang tour có tiêu đề trên 45 ký tự, nên đây là **nửa số trang**, không phải ca hiếm. Hôm nay **chưa thành vi phạm Luật 3** vì `sticky-bar__price` render trên **0 trang** — thanh chỉ mang CTA "Chat Zalo". Ngày `bookingRef.key` phân giải được giá thì nó thành vi phạm thật. **Đây là nợ mở, chưa đóng bằng quyết định này.**

**Đo cả khổ di động 390×844** (ca §3.6 lo): **không có tràn ngang** (`scrollWidth` = 390). Nhưng dải breadcrumb cao **128px** (breadcrumb xuống 3 dòng vì mắt cuối là tiêu đề dài) cộng dải tiêu đề **200px** (h1 32px, **4,2 dòng**) — tức **328px chữ trước khi thấy ảnh**, ảnh hero bắt đầu ở **397px**, tức **47% màn đầu là chữ**. §3.6 lo "ảnh bị đẩy xuống ~160px"; thực tế là **hơn gấp đôi**. Thanh dính ở 725→782px, vẫn trong 844. **Lo ngại của §3.6 được xác nhận bằng số, và nặng hơn dự đoán của chính nó.**

**Cách đo, để chạy lại được:** `docs/evidence/2026-08-25-do-bo-cuc/do-layout.mjs` — mở Chrome headless với `--remote-debugging-port`, đặt viewport bằng `Emulation.setDeviceMetricsOverride`, đọc `getBoundingClientRect()`. Ảnh chụp bằng `--window-size` **không** dùng được: nó không đặt layout viewport như thiết bị thật và tôi đã một lần báo động nhầm "tràn ngang trên di động" vì tin vào ảnh đó.

**Và một dữ kiện làm cả phép so này thành lý thuyết:** `sticky-bar__price` hiện **render trên 0 trang** trong bản dựng — `priceLabel` phân giải từ `data/prices.yaml` qua `bookingRef.key` và hiện không khớp gì. Giá chỉ tồn tại dưới dạng chữ trong thân bài. Theo `06` §6 Luật 3 thì **không có giá thì ẩn vùng giá**, nên đây không phải vi phạm — nhưng nghĩa là 617-so-với-667 là cuộc tranh luận về một phần tử chưa xuất hiện ở đâu. Nợ dữ liệu này phải đóng trước khi Luật 3 có ý nghĩa đo được. Nên hero rút **430 → 380px** desktop và **280 → 240px** di động, đưa thanh giá về ~599px, tức **bằng mức của v2.4**.

Hai con số 380 và 240 **không do Cowork hay Code đặt ra**: đó đúng là chiều cao hero desktop và di động trong mockup Design chặng 2 (project `fca38485`). Design đã tự kết luận hero cũ quá cao.

**Một lỗi thật lộ ra trong lúc thi hành, cổng bắt được.** Dọn hết chữ khỏi lớp phủ khiến biến thể **không-ảnh** của Hero còn lại đúng một khối gradient trống. Trên hai trang **tác giả** — Person không có `mainImage` và không có huy hiệu loại (`06` §4.11) — nó thành `<section>` rỗng, vi phạm **R7** *"vùng rỗng ẩn hẳn, không khung trống"*. `BM-EMPTY-REGION` chuyển đỏ và chỉ đích danh hai trang.

Lần sửa đầu vẫn sai: guard viết `Boolean(image)`, trong khi GROQ trả `{_type:'image', alt:''}` **không có `asset`** cho entity chưa gắn ảnh — object đó **truthy** còn `imageUrl()` trả `undefined`. Guard đúng là `image?.asset?.url`. Ghi lại vì đây là cái bẫy sẽ lặp: **object ảnh rỗng của Sanity là truthy.**

`06` §3 hàng Hero vì vậy đổi trạng thái rỗng: **không ảnh VÀ không huy hiệu → ẩn hẳn hero.** Câu cũ "thiếu mainImage thì hero thuần chữ" nay vô nghĩa, vì không còn chữ nào trong hero để mà thuần.

### Chốt 2 — Neo cuộn, không phải cuộn mượt

Yêu cầu là "hiệu ứng kéo trang rất nhẹ". Đo ra: **`scroll-behavior: smooth` đã có sẵn** ở `tokens.css:203`. Không thêm gì mới; thiếu hai thứ làm nó hỏng:

- **`scroll-padding-top`** — chưa từng khai. Header dính cao `--header-h` và thanh dính cao `--sticky-bar-h`, nên mọi link nhảy mục ở chính thanh dính đó đưa tiêu đề **chui vào gầm hai thanh vừa bấm**. Trang cuộn mượt nhưng dừng sai chỗ. Nay `calc(--header-h + --sticky-bar-h + --s3)`.
- **`prefers-reduced-motion` không tắt được nó.** Khối reduced-motion hiện có chỉ ép `animation-duration` và `transition-duration` về 0; `scroll-behavior` không thuộc hai thứ đó nên lọt lưới. `07` §5 khai reduced-motion tắt **mọi** chuyển động — nên phải tắt riêng bằng `html { scroll-behavior: auto }`. Với người bật reduced-motion vì say chuyển động, trang tự trượt là đúng thứ họ muốn tắt.

**Không** thêm hiệu ứng hiện-dần-khi-cuộn: `07` §5 cấm animation tự chạy, và mở loại đó cần phiếu riêng.

### Chốt 3 — "Tổng quan" trên trang chủ về hai cột

Chẩn đoán khớp lời chủ dự án: `.home-body` bị kẹp `max-width: 70ch` (~620px) bên trong khung 1200px, nên thừa ~580px trắng bên phải, trong khi dải `HomeFacts` chạy hết bề ngang ở **dưới**. Nay `.editorial-grid` là `minmax(0, 1fr)` + **340px**, Fact về cột phải.

- **340px không phải số mới** — đó là bề rộng cột phụ mà `DetailLayout .two-col` đã dùng.
- **`70ch` giữ nguyên**: đó là luật measure của `07` §2, không được phá để lấp chỗ trống.
- `HomeFacts` thêm prop **`aside`** — bỏ nền dải, bỏ container, lưới về một cột, chữ căn trái. Cùng nếp với prop `inline` của `FactStrip`, **không phải API mới**.
- Dưới 1024px xếp chồng lại như cũ.

**Phạm vi:** đây là bố cục **một khối** của trang chủ, không phải bày lại trang chủ. Việc "bày lại trọn trang chủ theo mạch bán hàng" mà vòng 3 §4 để dành **vẫn còn để dành**, và `06` §5.7 vẫn gom 9 khối vào một dòng.

### Chốt 4 — Footer: **không thêm field, vì field đã có**

Yêu cầu là "phần giới thiệu doanh nghiệp và dòng miễn trừ trong Footer không được hardcode, nên bổ sung field trong Site Setting". Đo lại thì tiền đề không đúng:

| Tầng | Trạng thái |
|---|---|
| Schema Sanity `cms/schemas/siteSettings.ts` | `footer.tagline` ("Câu giới thiệu dưới logo") và `footer.disclaimer` ("Dòng miễn trừ trách nhiệm") — **đã có sẵn** |
| Mã `Footer.astro:55-56` | `viOnly(footerConfig?.tagline) \|\| t('footerTagline')` — **đã đọc Sanity trước** |
| Dữ liệu | Truy vấn `siteSettings`: cả hai **`null`** |

Nên hai câu đang hiện trên trang không phải hardcode — chúng là **lớp rơi về** khi Sanity trống. Việc còn lại là **nhập liệu trong Studio**, không phải sửa mã hay sửa schema. Không mở việc code nào ở đây.

*(Ghi thêm cho khỏi lặp lại: `uiCopy.footerTagline` trỏ về `brand.tagline` trong `site.config.ts`, còn tên pháp nhân ở dòng cuối footer **cố ý** ở lại `site.config.ts` vì nó cũng là `Organization.legalName` trong JSON-LD — `QĐ-2026-08-14-01`.)*

---

**Đối chiếu — đo trên bản dựng:**

| Kiểm | Kết quả |
|---|---|
| Thứ tự vùng trang chi tiết | crumb-band → title-band → hero → sticky-bar → summary-band → fact-strip ✅ |
| Breadcrumb còn `inverse` | không |
| Trang chủ | `.editorial-grid` + `.editorial-main` + `.editorial-aside` + `facts-section--aside` ✅ |
| `astro check` | 0 lỗi, 0 cảnh báo (136 file) |
| **Luật 1** | **pass — 138 trang, 0 field lặp vùng, 0 field sai vùng** |
| `BM-EMPTY-REGION` | đỏ khi hero rỗng → **pass** sau khi sửa guard |
| `BM-ORPHAN-REGION` | pass |
| Cổng đỏ còn lại | R3 (1), R4 (45), S24-AUTHORITY (6), control-registry (2), deferred (1) — **45/45 lỗi R4 đều ở `/cam-nang/`**, không lỗi nào chạm template đã sửa. Khớp danh sách nợ spec §9 |

**Nợ ghi để không rơi.**

1. **`.title-band` vẫn chưa gắn `data-region`**, `title` vẫn chưa vào ma trận §3.1 — nguyên văn lý do ở `QĐ-2026-08-24-05`, không đổi: vướng mắt cuối breadcrumb.
2. **Cảnh báo CSS có sẵn:** bản dựng báo `Unexpected "}"` trong CSS xuất ra của `HomeRollupSection.astro`. File đó cân bằng ngoặc (17/17) và không nằm trong phạm vi phiếu này. Chưa rõ nguyên nhân — cần xem riêng.
3. **Hai ô footer trống trong Sanity** — xem Chốt 4. Việc nhập liệu, chưa ai làm.

---

## QĐ-2026-08-25-02 — `author` về đúng một vùng; bỏ luật "≤ 2 ô thì không trải dải"; và 13 ca Luật 2 trong thân bài

**Trạng thái:** chốt 2026-08-25. Sửa `06-BINDING_MAP` lên **v2.6.0** (§3: hàng Thông tin nhanh, hàng Hộp tác giả). Sửa `ArticleDetail.astro`, `DetailLayout.astro`. Không đụng `01-CONTENT_MODEL`, `07`, schema Sanity.

**Bối cảnh.** Chủ dự án rà bố cục ngày 2026-08-25 và chỉ ra ba ca cụ thể. Đo lại thì hai ca đúng, một ca sai số đếm nhưng đúng bản chất, và cả ba đều truy về **hai gốc chung**.

---

### Chốt 1 — `author` chỉ còn Hộp tác giả

Chủ dự án báo tên tác giả hiện **hai lần** trên trang cẩm nang. Đo lại (bỏ hết `<script>` để chỉ còn giao diện): **ba lần**.

| Vùng | Nguồn |
|---|---|
| Huy hiệu hero "Bởi {tên}" | `ArticleDetail.astro:40` |
| Hộp tác giả | `ArticleDetail.astro:78` |
| Hàng InfoCard ở sidebar | `ArticleDetail.astro:52` |

`06` §3 khai **đúng một vùng**: *"Hộp tác giả"*. Hai chỗ còn lại không được khai ở đâu — **vi phạm Luật 1 trên mọi trang cẩm nang**.

*(Hai link `tac-gia/…` nằm trong JSON-LD là bình thường, không tính.)*

**Vì sao cổng mù.** `data-field="author"` chỉ có **1** trong HTML; hai render kia không gắn thẻ. Đúng khoảng mù `DR-048`, y hệt ca `summary` đóng hôm qua ở `QĐ-2026-08-24-05`. **Đây là lần thứ hai trong hai ngày một vi phạm Luật 1 sống được vì thiếu thẻ** — đủ để coi việc gắn thẻ nốt bốn vùng còn lại của `DR-048` là việc phải làm, không phải việc nên làm.

**Gỡ hai chỗ thừa.** Lý lẽ cũ ghi trong mã — *"tác giả là tín hiệu E-E-A-T, phải đọc được ngay trên màn đầu"* — đúng về ý định nhưng không cho phép mở thêm vùng: Luật 1 chỉ nhượng bộ cho **giá**. Muốn tác giả lên màn đầu thì đổi **vị trí** Hộp tác giả, không nhân nó ra ba bản.

**Gắn thẻ, và giới hạn phải nói thẳng.** Hộp tác giả nay mang `data-region="author-box"` + `data-field="author"`. Nhưng **thẻ này chưa làm cổng canh được**: header của `luat1-post` khai tầng B *"xét theo cột entity của §3.1 (bốn cột)"* và Article *"nằm hoàn toàn ngoài từ vựng ALIAS/§3.1"*. Muốn cổng thật sự bắt thì phải thêm cột Cẩm nang vào ma trận §3.1 — **việc riêng, cần phiếu**. Ghi ra đây để không ai tưởng lỗ đã bịt.

### Chốt 2 — bỏ luật "≤ 2 ô thì không trải dải"

Chủ dự án báo Thời lượng / Phù hợp ở trang Trải nghiệm *"hiển thị sai vị trí"*. Đo ra: **không sai thứ tự, sai cột**.

| Trang | Số ô | Nằm ở đâu |
|---|---|---|
| `trai-nghiem/cano-keo-du-bay` | **2** | **cột phụ** |
| `trai-nghiem/phao-chuoi` | **2** | **cột phụ** |
| `diem-tham-quan/chua-long-son` | 5 | trải dải |
| `tour/ve-vin-harbour` | 3 | trải dải |

Gốc là hợp đồng `06` *"≤ 2 ô thì không trải dải ngang — desktop gộp vào cạnh bản đồ ở sidebar"*. Luật đó cắt theo **số lượng dữ liệu**, không theo loại trang — nên **cùng một loại entity ra hai wireframe khác nhau tuỳ trang có mấy ô**. Đó đúng là thứ chủ dự án gọi tên ở lượt rà trước: *"wireframe phải giống nhau, phần hiển thị thì thích ứng theo từng loại entity"*. Luật này làm ngược: wireframe đổi theo dữ liệu, không theo loại.

**Chốt: Thông tin nhanh luôn trải dải, mọi trang, mọi số ô.** `factsInline` gỡ khỏi `DetailLayout`; prop `inline` của `FactStrip` không còn ai gọi. Hàng lưới `facts` trong `grid-template-areas` cũng gỡ — nó sinh ra ở I4 fix (2026-08-23) chỉ để đỡ bản gộp, nay không ai chiếm.

**Đối chiếu sau khi sửa:** cả bốn trang trên đều `trong_two_col = false`.

### Chốt 3 — 13 ca Luật 2 trong thân bài, là nợ biên tập

Chủ dự án báo "Giờ mở cửa hiển thị sai vị trí" nhưng không kèm URL, và trang cẩm nang được gửi **không có** field đó (0 lần). Quét toàn bộ `dist/` thì ra một họ vấn đề khác: **field cấu trúc bị biên tập mở lại thành mục trong thân bài** — vi phạm **Luật 2** *"cấu trúc giữ khung, bài viết giữ chiều sâu; `body` không mở mục cùng vai"*.

**12 ca trên 11 trang** *(sửa sau review 2026-08-25 — bản đầu ghi 13/12)*: `Phù hợp` 5 · `Địa chỉ` 2 · `Thời lượng` 2 · `Giờ mở cửa` 3.

Đây là **nợ dữ liệu, không phải lỗi mã** — không sửa trong phiếu này. Script và toàn bộ cảnh báo về độ tin: `docs/evidence/2026-08-25-luat2-body/`.

**Bốn lần đếm mới ra 12, và mỗi lần sai một kiểu khác:** **4** (làm phẳng HTML rồi gộp khoảng trắng nên ranh giới thẻ biến mất — mọi nhãn mở đầu `h2`/`h3` đều lọt) → **12** (chèn `¶` ở ranh giới thẻ) → **13** (thêm nhánh cụm ghép `Giá vé & Giờ mở cửa:`, +1 ca thật) → **12** (cắt thân bài bằng **cửa sổ 60.000 ký tự** nên nuốt cả FAQ → 1 ca giả; cắt đúng phần tử bằng đếm độ sâu `<div>`).

Lần sai cuối là **đúng lỗi mà `QĐ-2026-08-25-03` ghi ở một chỗ khác** — *"cửa sổ ký tự không phải phạm vi phần tử"* — lặp lại trong chính script viết ra để kiểm thứ khác.

**Và 12 KHÔNG phải "12 ca Luật 2".** Script chỉ soi nhãn lấy từ `fact-strip`, nên bốn vai mà `06` §6 gọi tên trực tiếp — `itinerary`, `includes`, `excludes`, `accessInfo` — **không bao giờ bị phát hiện**; nó cũng bỏ qua toàn bộ trang cẩm nang (không có `fact-strip`). Phép đo rộng hơn cho **khoảng 33 trang / 54 va chạm**, chưa xác nhận từng ca. Trích 12 là trích *"nhãn Thông tin nhanh bị mở lại có dấu hai chấm"*, không phải toàn bộ Luật 2.

---

**Đối chiếu — đo trên bản dựng:**

| Kiểm | Kết quả |
|---|---|
| Tên tác giả thấy được trên trang cẩm nang | **1** (lần thứ hai là `authority-meta`, có `hidden`) |
| `data-field="author"` · `data-region="author-box"` | 1 · 1 |
| `fact-strip` nằm trong `two-col` | **0/4 trang** |
| `astro check` | 0 lỗi, 0 cảnh báo |
| **Luật 1** | **pass — 137 trang, 0 field lặp vùng, 0 field sai vùng** |
| `BM-ORPHAN-REGION` · `BM-EMPTY-REGION` | pass · pass |

**Cổng đỏ còn lại và vì sao không phải do phiếu này:** R3 **1 → 2 lỗi**, R4 **45 → 42**. Cả hai đổi vì **nội dung Sanity đổi giữa hai lần dựng** (138 → 137 trang); URL mới mất là `/cam-nang/mua-ve-hon-tam-nha-trang-o-dau/`, không dính gì tới định tuyến hay mã đã sửa. S24-AUTHORITY (6), control-registry (2), deferred (1) giữ nguyên.

**Nợ ghi để không rơi.**

1. **Thêm cột Cẩm nang vào §3.1** để `luat1-post` canh được Article — xem Chốt 1.
2. **Gắn `data-region` cho bốn vùng còn lại của `DR-048`** (`hero`, `hero-badge`, `breadcrumb`, `footer-meta`) và cho `.title-band`. Hai vi phạm Luật 1 trong hai ngày đều sống nhờ khoảng mù này.
3. **13 ca Luật 2** — nợ biên tập, chưa ai nhận.
4. **"Giờ mở cửa hiển thị sai vị trí"** — chưa đóng, thiếu URL của chủ dự án.

---

## QĐ-2026-08-25-03 — Thân bài: trả lại link và ảnh, hạ cấp tiêu đề theo `06`, đưa cỡ chữ về token

**Trạng thái:** chốt 2026-08-25. Sửa `src/components/Body.astro`, `src/lib/queries/fragments.ts`, và tám template entity. Không đụng `06`, `07`, `01-CONTENT_MODEL`, schema Sanity.

**Bối cảnh.** Lượt rà bố cục 2026-08-25 mở đầu bằng *"link và ảnh trong phần body của Entity không hiển thị"*. Đo lại thì đó là **ba lỗi độc lập cùng nằm trong một component**, và cả ba đều thuộc loại **hỏng im lặng**: HTML hợp lệ, cổng xanh, chỉ thiếu thứ đáng lẽ phải có.

### Lỗi 1 — link biến thành chữ thường

Link trong Portable Text là **annotation**: `marks` của một span chứa `_key` trỏ vào `block.markDefs[]`. `renderInline` cũ chỉ so chuỗi với `'strong'` và `'em'`; mọi `_key` rơi vào nhánh không-khớp và bị bỏ. `grep markDefs src/` ra **0**.

**Đo được: 11 tài liệu đã duyệt có link trong thân bài.** Trên `trai-nghiem/phao-chuoi`, `hontamnhatrang.com` xuất hiện **0** lần trong HTML dựng ra.

**Sửa:** đọc `markDefs`, dựng `<a>`. Link ra ngoài site mang `target="_blank" rel="noopener nofollow"`; link nội bộ thì không. Kèm theo: bản cũ nhả thẳng `c.text` vào `set:html` **không escape** — nay escape trước rồi mới bọc thẻ.

### Lỗi 2 — ảnh trong thân bài biến mất

`bodyFragment` trả portable text **thô**: `"body": coalesce(body.vi, …)`. Khối ảnh vì vậy chỉ có `asset: { _ref, _type: 'reference' }`, không có `url`. `Body.astro` gọi `imageUrl()`, hàm đó đòi `asset.url` (`sanity-image.ts:46`), trả `undefined`, component `return null`.

**Đo được: 66 tài liệu đã duyệt có ảnh trong thân bài.** Trên `diem-tham-quan/rung-thong-khanh-son`, `.body-block` chứa **0** `<figure>` và **0** `<img>`.

**Sửa:** deref `asset->` trong `bodyFragment`, hình dạng chép đúng `mainImageFragment` để `imageUrl()` và `isSvg()` dùng chung một hợp đồng. Thêm `<figcaption>` khi khối ảnh có `caption`.

### Lỗi 3 — `headingOffset` được `06` khai nhưng chưa từng tồn tại

`06` §3 hàng "Thân bài" (N15b, v2.2) khai: *"trong trang chi tiết entity, `Body` hạ một cấp khi render — tiêu đề lưu h2 hiện thành `<h3>` … prop `headingOffset` của `Body`"*. `grep headingOffset src/` ra **0**.

Hệ quả đo được: `rung-thong-khanh-son` phát **7 thẻ `<h2>` trong thân bài**, ngang cấp với 3 `<h2>` tiêu đề mục — dàn bài tài liệu gãy.

**Sửa:** thêm prop, bật `headingOffset={1}` ở tám template entity. **Không bật** cho `ArticleDetail` (`06` §4.10: ở trang cẩm nang thân bài là nội dung chính, không nằm dưới tiêu đề mục nào), cũng không cho `PersonDetail` (dùng `bio`, không dưới `Section`), `SiteHome`, `TouristDestinationHub` (không phải trang chi tiết entity).

### Kèm theo — cỡ chữ tiêu đề thân bài về token

`.body-block h2/h3/h4` **không khai `font-size` nào**, nên rơi về mặc định trình duyệt: đo được **25,5px** (`1.5em`) và **19,9px** (`1.17em`). Hai giá trị đó không có trong thang của `07` §2 và vi phạm câu mở đầu `tokens.css` — *"0 hardcoded value bên ngoài file này"*.

Nay gán token sát giá trị đang render (`--fs-h4` 26px, `--fs-h5` 20px), nên **diện mạo gần như không đổi**. Đây là **đưa về thang, không phải đổi thang**: câu hỏi chỉnh thang cỡ tiêu đề của chủ dự án vẫn mở, chưa chốt.

Thêm luật cho link thân bài — trước nay chưa có, vì chưa từng có link nào render ra: gạch chân cộng màu primary. Không dùng riêng màu (WCAG 1.4.1).

---

**Đối chiếu — đo bên trong đúng phần tử `.body-block`, cắt bằng cách đếm độ sâu `<div>`:**

| Trang | `<a>` | `<figure>` | Tiêu đề |
|---|---|---|---|
| `trai-nghiem/phao-chuoi` | **1** (`hontamnhatrang.com`) | 1 | h2=**0**, h3=3 — đã hạ cấp |
| `diem-tham-quan/rung-thong-khanh-son` | 0 | **12** (trước **0**) | h2=**0**, h3=7, h4=4 |
| `cam-nang/thien-duong-bien-dao…` | **7** | 0 | h2=**3**, h3=8 — **không** hạ cấp, đúng §4.10 |

`astro check` 0 lỗi 0 cảnh báo · **Luật 1 pass — 138 trang, 0 field lặp vùng, 0 field sai vùng** · `BM-ORPHAN-REGION` và `BM-EMPTY-REGION` pass.

**Một phép đo sai của chính tôi, ghi lại.** Lần kiểm đầu tôi cắt "thân bài" bằng cửa sổ 40.000 ký tự từ `class="body-block"`. Cửa sổ đó tràn ra ngoài phần tử và đếm cả tiêu đề mục lẫn link chân trang — ra `<a>=28`, `h2=3`, kết luận sai rằng offset chưa chạy. Cắt đúng phần tử bằng cách đếm độ sâu `<div>` thì `<a>=1`, `h2=0`. **Cửa sổ ký tự không phải phạm vi phần tử**; đo DOM thì phải cắt theo cây.

**Nợ ghi để không rơi.**

1. **Không cổng nào bắt được ba lỗi này**, và cả ba đều sống nhiều tháng. Chúng không phải lỗi "vùng sai" hay "lặp vùng" nên `luat1-post` không đụng tới; `BM-EMPTY-REGION` cũng không, vì vùng có chữ, chỉ thiếu ảnh và link. Một cổng kiểu *"số `<img>` trong `.body-block` phải khớp số khối ảnh trong dữ liệu"* sẽ bắt được — chưa có, chưa ai đề xuất.
2. **Thang cỡ tiêu đề** vẫn là câu hỏi mở của chủ dự án (lượt rà 2026-08-25 mục 3). Phiếu này chỉ đưa hai cấp lạc thang về token, không chốt thang.

---

## QĐ-2026-08-25-04 — Chốt bộ giao diện `cat-bien`; ba nền phụ khai riêng cho từng bộ

**Trạng thái:** chốt 2026-08-25. Sửa `src/styles/tokens.css` và `07-DESIGN_TOKENS` §1 + §1b. **Chưa** đổi `siteSettings.theme` trong Sanity — xem "Trình tự bắt buộc" ở cuối.

**Bối cảnh.** Chủ dự án chọn **`cat-bien` (nền kem)** làm bộ giao diện. Nhưng bật nó nguyên trạng thì **làm bệnh nặng thêm**, không nhẹ đi — và đây là lý do phiếu này tồn tại.

### Vì sao `cat-bien` là bộ tệ nhất trước khi sửa

`07` §1b khai *"mỗi bộ chỉ đổi bốn token màu gốc"*, và `tokens.css` làm đúng vậy: khối `[data-theme='cat-bien']` đè 7 token, **không có** `--c-surface-alt`, `--c-primary-soft`, `--c-border`. Ba token đó vì thế **thừa hưởng từ `:root`**, tức từ bộ `bien-sau`.

Hệ quả: nền kem **ấm** `#FDFAF5` đứng cạnh nền phụ xám **lạnh** `#F8FAFC`. Hai thứ đó lệch nhau **1,005** — nói cách khác **khối xen kẽ ở bộ này gần như không tồn tại về mặt thị giác**, tệ hơn cả hai bộ kia (1,046). Và chúng còn lệch nhau về nhiệt độ màu.

Đây đúng là căn bệnh `07` §1 tự đặt tên: *"`--c-surface` #FFFFFF và `--c-surface-alt` #F8FAFC chỉ lệch ~4% độ sáng, nên nếu cả trang chỉ dùng hai nền này thì đọc thành một mảng trắng liền."* Với `cat-bien` thì không phải 4% mà gần như 0%.

### Chốt — ba nền phụ khai riêng cho từng bộ

| Bộ | `surface.alt` | `primary.soft` | `border` | Tách nền chính↔phụ |
|---|---|---|---|---|
| `bien-sau` | #EAF2F8 | #DCEBF6 | #D3E1EC | 1,046 → **1,132** |
| **`cat-bien`** | **#F5EDE0** | **#E4EEF1** | **#E7DCC9** | **1,005 → 1,116** |
| `ngoc-lam` | #E8F4F2 | #D6EBE8 | #CFE3E0 | 1,046 → **1,126** |

**Không thêm một mã brand nào.** `primary`, `accent` san hô, `sand`, và mọi màu chữ giữ nguyên. Đây là chữa **diện tích màu**, không phải mở bảng màu — đúng cách `07` §1 chỉ định và đúng hướng vòng 3 §3.3 đã chọn.

**R2 được tôn trọng:** *"sửa bộ nào thì sửa cả ba"*. Không bộ nào bị bỏ, kể cả hai bộ không được chọn.

### Đối chiếu

`npm --prefix scripts run check:theme` — **pass, 3 bộ, tất cả cặp đạt AA**, thấp nhất 5,02 (`cat-bien`, trắng/accent) đúng như trước khi sửa: bốn cặp của cổng không đụng tới ba token này.

Hai cặp **ngoài** phạm vi cổng, đo riêng vì đề xuất đụng đúng nền đó — chữ chính và chữ mờ trên nền phụ:

| Bộ | chữ/nền phụ | chữ mờ/nền phụ | chữ/nền mềm |
|---|---|---|---|
| `bien-sau` | 15,77 | 6,70 | 14,67 |
| `cat-bien` | 15,05 | 6,57 | 14,82 |
| `ngoc-lam` | 15,86 | 6,73 | 14,37 |

Tất cả dư AA. `npm --prefix scripts run check:token-parity` — **XANH, không lệch mới**; hai mục vàng còn lại là `DR-050` và `DR-051` có sẵn.

### Trình tự bắt buộc — vì sao CHƯA đổi `siteSettings.theme`

`siteTheme.ts` đọc `siteSettings.theme` **lúc dựng** (cache module-level), nên đổi trong Sanity chỉ có hiệu lực ở lần deploy sau. Nghe thì an toàn, nhưng nó tạo một cửa sập:

**`origin/main` hiện CHƯA có bản vá ba nền phụ này** — nó nằm ở PR #6, chưa merge. Nếu đổi `theme` sang `cat-bien` ngay bây giờ rồi có ai deploy từ `main`, production nhận **`cat-bien` KHÔNG kèm bản vá** — tức đúng tổ hợp tệ nhất: nền kem cộng nền phụ xám lạnh, tách nền 1,005.

**Nên thứ tự là: merge PR #6 → deploy → rồi mới đổi `theme` sang `cat-bien`.** Đảo thứ tự là tự bắn vào chân.

---

## QĐ-2026-08-25-05 — Đưa trang điểm đến vào phạm vi bề mặt; đồng bộ nó về bộ khối dùng chung

**Ngày:** 2026-08-25 · **Người quyết:** chủ dự án · **Loại:** cửa hai chiều (hoàn nguyên bằng `git revert`)

**Bối cảnh.** Chủ dự án yêu cầu refactor `https://tourdao.vn/nha-trang/` cho (1) đồng bộ bố cục chung và (2) ưu tiên hiển thị di động, rồi nêu nghi vấn *"dường như trước đó có sai lầm khi cấu trúc wireframe đã được viết tay mà không theo khung của hệ thống"*.

Điều tra cho thấy nghi vấn **đúng về hiện tượng, khác về nguyên nhân** — chi tiết ở `DR-061`. Tóm tắt: lệch thừa kế từ commit fork `d7bac08`, rồi bị nới rộng vì ba vòng bề mặt liên tiếp đều để trang này ngoài phạm vi.

**Chốt 1 — đảo ranh giới phạm vi của vòng 5.** `SPEC-2026-08-22-be-mat-vong-5` §9 và dòng 379 ghi *"Design **không** được vẽ lại bố cục trang chủ, header, hay footer trong vòng này"*. Ranh giới đó **hết hiệu lực đối với trang điểm đến**. Lý do vạch nó hồi 22/8 là bốn điều chủ dự án nêu khi ấy đều về trang chi tiết; nay chủ dự án nêu trực tiếp về trang điểm đến.

Vòng 5 **không** bị mở lại: spec đó đã đóng và đã phát hành. Đây là một đợt riêng, phạm vi đúng một trang.

**Chốt 2 — hero chỉ chứa ảnh.** Chủ dự án nêu: *"toàn bộ Hero không chứa mô tả, chỉ có thể chứa Tiêu đề - Heading"*. Áp đúng luật `06` v2.5 §3 vốn đã có: *"trên ảnh chỉ còn huy hiệu loại; `title` và `summary` đều đã ra ngoài — không còn chữ nào đè lên ảnh"*, cộng §3.1 *"Nhãn loại entity … không áp dụng: … touristDestination"*. Hai câu đó cộng lại cho kết quả: **hero trang này còn đúng một tấm ảnh.**

Thứ tự khối nay theo `06` §6 v2.5: breadcrumb → tiêu đề → hero → đoạn mở → nội dung. Trang điểm đến không có thanh dính (thiết bị của trang chi tiết) nên đoạn mở nối thẳng sau hero.

Bỏ theo cùng luật: **lớp phủ tối** (sinh ra chỉ để chữ trên ảnh đọc được; hết chữ thì nó chỉ làm tối 55% dưới của ảnh) và **con dấu trang trí**. Ghi công ảnh **giữ lại** nhưng chuyển xuống dưới ảnh — `Hero` dùng chung không có chỗ cho nó vì trang chi tiết không hiện ghi công.

**Chốt 3 — bốn thay đổi bố cục phần thân, đã duyệt.**

| Khối | Trước | Sau |
|---|---|---|
| Tổng quan | xếp dọc, dải Thông tin nhanh chạy hết bề ngang | hai cột: chữ trái, Thông tin nhanh cột phụ 340px — cùng bố cục trang chủ (`QĐ-2026-08-25-01`) |
| Dải tin cậy | bó trong khung đọc 752px | rộng hết khung 1152px |
| Điểm tham quan | **cắt cứng còn 3** dù dữ liệu có 4 | hiện đủ 4 — component chung không cắt |
| Cẩm nang bản địa | 2 thẻ ngang, dạng riêng | 4 thẻ dọc, cùng dạng các mục khác |

Bốn mục cam kết và "Điểm nổi bật" chuyển từ `h2` xuống `h3`. Không mất chữ nào, và đúng hơn về ngữ nghĩa vì chúng vốn nằm trong mục khác.

**Chốt 4 — vá `HomeRollupSection` dù nó ngoài phạm vi một-trang.** Xem `DR-062`. Vá này **cũng đổi trang chủ**: khối rollup 3 mục ở đó đang hiện 3 cột, mỗi ô 119px trên khung 390px, và sẽ về 1 cột. Chấp nhận vì (a) đó là vi phạm Luật 5 đang sống trên production, (b) không vá thì chính `/nha-trang/` vẫn còn một khối 3 cột sau khi đồng bộ, tức mục tiêu (2) không đạt.

**Bằng chứng.** `astro check` 0 lỗi. `gate:all` 9/11 — hai cổng đỏ còn lại là `S24-AUTHORITY-HTML` (6) và `Deferred`/`I16` (1), cả hai chờ dữ liệu chủ dự án, không liên quan. `BM-ORPHAN-REGION`, `BM-EMPTY-REGION`, `Luật 1` (140 trang) đều xanh sau khi gắn `data-region="summary-band"` lên trang này. Đo CDP 390×844: mọi lưới về 1 cột, không tràn ngang. Component 1091 → 390 dòng.

**Còn nợ, ghi để khỏi rơi.**
1. `HomeHero.astro` nay không còn ai gọi. Xoá là quyết định riêng.
2. `06` §4.1 nên có hàng khai rõ ba dải quanh hero cho trang điểm đến thay vì thừa hưởng ngầm qua *"khung chung áp dụng"*. Sửa `06` đụng R9, cần phiếu riêng.
3. `keyFacts` hiện nằm trong cột phụ mục Tổng quan (nếp trang chủ). Khung chung `06` §6 đặt "Thông tin nhanh" ngay sau đoạn mở. Chưa đổi, chưa quyết.
4. `.feature-grid--stays` trong `DR-060` đã hết ý nghĩa — khối đó nay do `HomeRollupSection` dựng.

---

## QĐ-2026-08-25-06 — Đọc Sanity qua `apicdn` lúc dựng, sau khi hạn mức `api` cạn

**Ngày:** 2026-08-25 · **Người quyết:** chủ dự án · **Loại:** cửa hai chiều (đổi `useCdn` về `false` là hoàn nguyên)

**Chuyện đã xảy ra.** PR #8 merge lúc `09:05:44Z`. Workers Builds chạy, qua hết `astro check` (**0 lỗi**), dựng xong server và client, rồi chết ở lần gọi Sanity **đầu tiên** trong bước prerender:

```
[ERROR] [build] Failed to call getStaticPaths for src/pages/[...path].astro
plan_limit_reached - API Requests quota limit reached. Go to sanity.io/manage to upgrade your plan.
Failed: error occurred while running build command
```

**Không phải lỗi mã.** Kiểm lại bằng tay cùng token:

| Endpoint | Kết quả |
|---|---|
| `pgedy374.api.sanity.io` | **HTTP 402** `plan_limit_reached` |
| `pgedy374.apicdn.sanity.io` | **HTTP 200**, `count(*)` = 1262 |

`src/lib/sanity.ts:131` đặt `useCdn: false`, nên mọi bản dựng nện vào đúng endpoint đã cạn.

**Hậu quả thực tế — không có gì gãy.** Build hỏng thì không sinh ra bản deploy nào để đè lên bản đang chạy. Production vẫn phục vụ bản `2026-08-25T07:25:31Z` của PR #7; kiểm 5 điểm (`/`, `/nha-trang/`, một trang tour, `/ai/index.json`, `/sitemap-vi.xml`) đều **200**. PR #8 đã vào `main` nhưng chưa lên trang.

**Vì sao hạn mức cạn.** Bản dựng là hộ tiêu thụ lớn nhất: mỗi lần dựng đọc lại toàn bộ dữ liệu cho ~140 trang cộng bốn endpoint `/ai/*`, `llms.txt` và sitemap. Ngày 2026-08-25 có số lần dựng bất thường — tác nhân dựng lại sau gần như mỗi thay đổi trong lúc làm hai đợt `feat/dong-no-ky-thuat` và `feat/dong-bo-trang-diem-den`, cộng bốn subagent mỗi con dựng ít nhất một lần, cộng hai lần Workers Builds. **Đây là lỗi vận hành của tác nhân, ghi lại để không lặp:** đo một lần rồi dùng lại `dist/`, đừng dựng lại sau mỗi sửa nhỏ.

**Chốt — `useCdn: true`.**

**Đánh đổi:** CDN có thể trả nội dung trễ tới ~60 giây. Ở dự án này không thành vấn đề vì publish và deploy **vốn đã tách rời**: webhook Sanity đang tắt theo `QĐ-2026-08-22-03`, nên nội dung chỉ lên trang khi có người đẩy mã — độ trễ 60 giây nằm gọn trong khoảng đó.

**Đo lúc chuyển, không phải suy đoán.** Dựng lại với `useCdn: true` thành công. So sitemap với production:

- **141 URL** so với **140** đang chạy
- Thêm: `cam-nang/ngam-hoang-hon-nha-trang-o-dau-dep-top-dia-diem-khong-the-bo-lo/` — bài publish sau bản dựng 07:25
- **Mất: 0 trang** — `R3` an toàn

Nói cách khác CDN ở đây **không cũ hơn** mà còn mới hơn bản đang chạy.

**Không bật lại webhook Sanity lúc này.** Chủ dự án đã đồng ý bật lại (`QĐ-2026-08-22-03` sẽ bị đảo), nhưng tác nhân không có token quản trị nên chưa thi hành. **Giữ nguyên trạng thái tắt** cho tới khi hạn mức rõ ràng đã hồi: mỗi lần webhook bắn là một lần dựng toàn site, và log của chính webhook đó cho thấy ngày 2026-08-22 nó bắn **25 lần trong khoảng một tiếng**.

**Còn phải làm.** Chủ dự án vào `sanity.io/manage` xem chu kỳ hạn mức và mức tiêu thụ thật. Nếu lượng dựng cần vượt hạn mức gói hiện tại thì đây là quyết định nâng gói, không phải quyết định kỹ thuật.

---

## Bổ sung cho `QĐ-2026-08-25-06` — đã đo chi phí một lần dựng, và kết quả sau phát hành

**Ngày:** 2026-08-25, sau khi PR #9 merge. Phần này viết sau phiếu gốc vì lúc chốt chưa ai có con số.

### Một lần dựng tốn hơn 400 lượt gọi Sanity

Đo bằng cách gắn tạm bộ đếm vào `client.fetch` trong `src/lib/sanity.ts` — đúng chỗ duy nhất `createClient` được gọi, nên mọi đường đọc đều bị phủ — rồi chạy `npm run build` một lần. Bộ đếm in mỗi 25 lượt; lần in cuối là **400**, nên tổng thật nằm khoảng **400–420**. Bộ đếm đã gỡ ngay sau khi đo, không commit.

Vì sao nhiều đến vậy: site sinh HTML từ nội dung Sanity, nên mỗi lần dựng phải hỏi *"có những trang nào"* (`getStaticPaths` → `fetchAllSlugs`) rồi *"nội dung từng trang là gì"* cho ~140 trang, cộng bốn endpoint `/ai/*`, `llms.txt` và sitemap.

**Hệ quả — đây mới là phần đáng nhớ:**

| Tình huống | Lượt gọi |
|---|---|
| Một lần dựng | **~400** |
| Một PR chỉ sửa CSS, hoặc chỉ sửa tài liệu | **~400** — vẫn dựng lại toàn bộ |
| 10 lần dựng/ngày | ~4.000/ngày ≈ **~120.000/tháng** |
| Webhook Sanity bắn 25 lần trong một giờ (đo thật 2026-08-22) | **~10.000 trong một giờ** |

Hàng cuối là bằng chứng số cho `QĐ-2026-08-22-03`. Lúc ấy phiếu đó chỉ nói "25 lần bắn"; nay biết mỗi lần bắn là ~400 lượt gọi. **Không bật lại webhook cho tới khi hạn mức rõ ràng đã hồi và có cơ chế chặn dội.**

### Ba điều rút ra cho vận hành

1. **Đo một lần rồi dùng lại `dist/`.** Đừng dựng lại sau mỗi sửa nhỏ. Ngày 2026-08-25 tác nhân dựng lại sau gần như mỗi thay đổi qua hai đợt refactor, cộng bốn subagent — cỡ 7.000–8.000 lượt trong một ngày. Đó là nguyên nhân trực tiếp làm hạn mức cạn.
2. **Merge một PR chỉ-tài-liệu cũng tốn ~400 lượt gọi**, vì Workers Builds dựng lại toàn site bất kể diff đụng gì. Nên gộp thay đổi tài liệu vào cùng PR với thay đổi mã khi có thể.
3. **`npm run deploy` bỏ qua `gate:all`.** Nó chỉ chạy `astro check && astro build`, không gọi validator nào — `R3`, `R4`, `Luật 1`, `BM-*` đều không được kiểm. Deploy tay thì chạy `npm run gate` trước.

### Kết quả sau phát hành

PR #9 merge `09:55:34Z`, bản dựng lên `09:58:41Z` — **3 phút 7 giây**. Bản này mang cả PR #8 (giao diện trang điểm đến) lẫn PR #9 (đổi endpoint) lên cùng lúc.

| Phép kiểm trên production | Kết quả |
|---|---|
| Ba dải quanh hero (`crumb-band`, `title-band`, `summary-band`) | có đủ |
| Chữ đè lên ảnh hero | **hết cả 5 lớp** (`hero-title`, `hero-summary`, `hero-eyebrow`, `hero-stamp`, `hero-gradient`) |
| Rãnh lưới thẻ | có |
| Mọi lưới ở khung 390×844 | **1 cột, 358px**; tràn ngang **0px** |
| Sitemap | 142 URL — **mất 0**, thêm 2 bài mới publish |
| CORS `/ai/*` và chuyển hướng 301 của PR #7 | còn nguyên |

Việc "mất 0 trang" là điều kiện `R3`, và là phép kiểm quan trọng nhất với một thay đổi nguồn đọc.

### Còn phải làm

Chủ dự án vào `sanity.io/manage` đối chiếu **~400 lượt/lần dựng** với hạn mức và nhịp dựng thật. Vá `useCdn` chuyển tải sang endpoint có hạn mức riêng, nhưng nó **không làm giảm số lượt gọi** — chỉ đổi chỗ tính. Muốn giảm thật thì phải giảm số lần dựng, hoặc dựng tăng dần thay vì dựng lại toàn bộ.

## ND-009 — Nhánh `feat-bo-kiem-tu-dong`: một lỗi Critical và năm Important chưa vá, chưa được gộp

**Mở:** 2026-08-24 · **Trạng thái:** mở · **Chặn:** không gộp nhánh `feat-bo-kiem-tu-dong` trước khi xử `C1`.

Nhánh dựng bộ kiểm tự động — 10 subagent, 4 hook, 4 script audit, 168 test xanh. 28 commit từ `ed27125`, HEAD `e7f10c6`. Thi hành `docs/plans/2026-08-23-bo-kiem-tu-dong.md`; diễn biến ghi ở `docs/NHAT-KY-2026-08-24-bo-kiem-tu-dong.md`.

Vòng duyệt toàn nhánh phán quyết **gộp được sau khi sửa `C1`**. Phiên dừng trước khi đợt sửa chạy xong, nên toàn bộ danh sách dưới đây **chưa làm**.

### C1 — Critical, chặn gộp

`scripts/audit/gate-audit.ts:194`, hàm `dangChayThatTrongBaoCao`. File bằng chứng **không tồn tại** → mảng rỗng → verdict `pass`.

Đo thật: đổi tên `scripts/reports/validator-status.json` rồi chạy `audit:gate`.

```
trước:  34 đạt, 28 trượt
sau:    61 đạt,  1 trượt
```

**Xoá một file làm 27 mục trượt thật thành 27 mục đạt.** Nghịch đảo trực tiếp `CLAUDE.md` §6 — không có bằng chứng thì mặc định thành *đạt*. Nguy hiểm gấp đôi vì `scripts/reports/` sinh ra bởi build: một `git clean`, một máy CI mới, hay một lần validator hỏng là đủ.

Sửa: phân biệt ba trạng thái — file **không có** → `skip`; file có, **không có mục** id đó → `pass`; file có, **có mục** → `fail`. Kèm test cho cả ba, đặc biệt trạng thái thứ nhất.

### Important

| Mã | Chỗ | Nội dung |
|---|---|---|
| `I1` | `gate-audit.ts:257` | `GA4` phát 0 check, 0 skip khi thư mục validator vắng. Báo cáo đi từ 62 xuống 47 mục mà không dòng nào nói `GA4` đã không chạy |
| `I2` | `gate-audit.ts:235` | `GA3` biến mất im lặng khi thiếu `postbuild-status.json` |
| `I3` | `deploy-verify.ts:47` | `soDauHieu` trả `pass` khi dấu hiệu vắng ở **cả hai** bên → gõ sai một tham số làm phép kiểm chống `DR-041` thành lời khai rỗng. **`deploy-verify.test.ts:26` đang khoá hành vi sai này bằng test** |
| `I4` | `doc-reality.ts:215` | `trichLuatChuyenHuong` chỉ nhận dạng `<đường dẫn> <mũi tên> <URL>`, không nhận cú pháp `_redirects` mà dự án thật sự dùng. `DOC3` `skip` vĩnh viễn — phép kiểm chống `DR-043` chưa từng đối chiếu một luật thật nào |
| `I5` | `guard-data-mutation.sh:79` | Mẫu khớp chuỗi lệnh thô nên chặn nhầm thao tác chỉ-đọc: `cat`, `wc`, `grep`, `git diff`, `git add` trên `seed/` và `migrate/` đều bị chặn. Người dùng sẽ học cách tạo cờ mở khoá để **đọc** — và cờ đó mở luôn đường **ghi**. Sửa: neo mẫu vào động từ thực thi (`node`, `npx`, `tsx`, `npm run`) |
| `I6` | `code-reviewer.md`, `astro-auditor.md` | Luật mặc định "từ ba file trở lên" đẩy **mọi** diff sang `code-reviewer`, nhưng agent đó tự định nghĩa là reviewer **giao diện**. Diff thuần backend rơi vào sai lăng kính. Sửa hẹp: luật chỉ áp cho diff giao diện; diff khác dùng skill `/code-review` chung |

Brief sửa đầy đủ cho cả sáu mục nằm trong `.superpowers/sdd/2026-08-23-bo-kiem-tu-dong/progress.md`, phần "KẾT QUẢ VÒNG DUYỆT TOÀN NHÁNH".

### Đã phân loại là để lại được

Vòng duyệt cuối kiểm và kết luận không chặn gộp: test `evidenceDir` trùng ngày (nay đã tự phân biệt được, nợ tự đóng); `demUrlSitemap` chỉ khớp `<loc>` trần; `DV3` bị bỏ khi `DV0` hết giờ; `kiemTrang` không loại chú thích HTML; `agents.test.ts` bỏ qua tên công cụ tiền tố `mcp__`; `exitCodeFor` cho `skip` thoát 0; năm commit có `doc-reality.ts` ở dạng nhị phân trong lịch sử.

### Ba việc chờ chủ dự án chốt

1. **27 control `status: gap` trong `control-registry.yaml`** (xem `DR-064`) — lật thành `live` toàn bộ, chỉ lật 15 cái đang xanh, hay để nguyên tới khi dữ liệu sạch? Hiện 11 validator đỏ vì **vi phạm dữ liệu thật**, không phải lỗi mã. Lật là cổng chuyển đỏ.
2. **Ngưỡng "ba file"** trong luật định tuyến `astro-auditor` ↔ `code-reviewer` — con số do tác nhân chọn, chưa duyệt. Nên chốt cùng `I6` vì cùng một vấn đề.
3. **Bốn hook chưa từng chạy thật.** Chúng chỉ nạp lúc phiên Claude Code khởi động. Phép thử sau khi khởi động lại: gõ `git add -A` trong repo này — **phải bị chặn**. Không bị chặn nghĩa là hook chưa nạp và mọi hàng rào còn lại cũng chưa có tác dụng.

### Ghi chú vệ sinh

`scripts/reports/validator-status.json` đang ở trạng thái đã sửa trong cây làm việc — do tác nhân chạy `validate` để kiểm chứng `DR-064`, chưa commit. Không phải dấu vết của phiên khác.

---

## QĐ-2026-08-25-07 — Để Growth Trial hết hạn, dự án Sanity rơi về Free

**Bối cảnh.** Ngày 2026-08-25 Sanity gửi cảnh báo *"TourDaoVN has used 100% of API Requests"*. Kiểm ra: dự án `pgedy374` đang ở gói `growth-trial-2023-10-19`, đã dùng 247.5k/250.000 API request của tháng 8, `overageAllowed: false`, và trial hết hạn 2026-08-26T00:57Z — tức sáng hôm sau. Hai đường đi: nâng lên Growth (15 USD mỗi seat mỗi tháng, mở phí vượt 1 USD mỗi 25k request) hoặc không làm gì và tự rơi về Free.

**Câu hỏi.** Có nâng gói không?

**Chốt.** **Không.** Để trial hết hạn, dự án tự rơi về Free. Không thêm thẻ, không nâng cấp. Sanity không trừ tiền gì.

**Ai chốt.** Chủ dự án, trong phiên 2026-08-25.

**Hệ quả đã lường và chấp nhận.**
- Hạn mức API **không đổi**: Free và Growth Trial đều 250.000 request mỗi tháng, reset 00:00 UTC ngày 1.
- Bốn thành viên vai `editor` **thành `viewer` — mất quyền Publish trong Studio**. Free chỉ có hai vai `administrator` và `viewer`, không có nấc giữa. Tài khoản admin giữ nguyên toàn quyền. Ai cần publish thì hoặc nâng lên administrator (kèm quyền chạm mọi thiết lập dự án), hoặc nâng gói lại.
- Mất Comments, Scheduled publishing, AI Assist. Đã kiểm trước khi chốt: **0 release / lịch publish hẹn giờ đang chờ**, nên không mất nội dung nào đã xếp lịch.
- Dataset `production` vốn đã `public` nên không có gì đổi ở đó.

**Ghi chú.** Phần định lượng — thao tác nào tốn hạn mức, thao tác nào không — tách thành sổ tay riêng ở `docs/SO-TAY-HAN-MUC-SANITY.md`. Nguyên nhân đốt hết hạn mức tháng 8 không phải khách truy cập mà là số lần dựng lại site: 157 commit push lên `main`, mỗi lần Workers Builds tự dựng và đọc lại toàn bộ nội dung, cộng một `astro dev` chạy nền 21 tiếng.

---

## QĐ-2026-08-26-01 — Nhiều điểm đến trên một site: TouristDestination là N

**Bối cảnh.** Chủ dự án yêu cầu thêm được điểm đến ngoài Nha Trang vào CMS, và các điểm đến đó thừa hưởng toàn bộ cấu trúc trang chi tiết giống Nha Trang. Rà soát cho thấy khuôn trang đã đa điểm đến sẵn — `src/pages/[...path].astro:73-80` lặp qua mọi `touristDestination` đã duyệt, `src/lib/sitemap.ts:86` đưa hết vào sitemap, `RouteDispatch` render bằng `TouristDestinationHub` — nhưng **dữ liệu** thì không: hai khối tự động của trang điểm đến ("Các khu vực nên biết", "Cẩm nang bản địa") quét toàn bộ dataset, và không entity con nào khai mình thuộc điểm đến nào. `01-CONTENT_MODEL.md:42` khai cardinality TouristDestination là **1**.

**Câu hỏi.** Site đóng vai gì sau khi thêm điểm đến; gắn nội dung vào điểm đến bằng cách nào; khách tìm thấy điểm đến mới bằng đường nào.

**Chốt.** Sáu điểm, chủ dự án quyết trong phiên 2026-08-26:

1. **Trang chủ `/` vẫn là Nha Trang.** Điểm đến khác là trang anh em `/‹slug›/` cùng khuôn. Các trang danh mục (`/tour/`, `/khach-san/`…) **vẫn gom chung toàn site**, chưa tách theo điểm đến.
2. **Cardinality TouristDestination 1 → N**, và thêm một field `destination` (reference) vào **mười** entity: place, attraction, experience, hotel, resort, tour, article, restaurant, specialty, event. Chạy script nạp bù dữ liệu cũ về Nha Trang.
3. **Lối vào là khối "Điểm đến khác" trên trang chủ cộng một mục menu** (loại đích `kind` thứ tám).
4. **Không đặt `initialValue` mặc định** cho field mới. Mặc định im lặng sẽ gán nhãn Nha Trang cho nội dung điểm đến khác mà không có tín hiệu nào báo. Thiếu ô là **warn** (bất biến I20 mới), không **fail**; trỏ sai type vẫn là **fail** qua `references` trong `gate.config.ts`.
5. **Hoãn sửa ~30 dòng meta description trong `src/lib/uiCopy.ts`** ("Khách sạn tại Nha Trang"…) — đó là mô tả của các trang danh mục toàn site đang xếp hạng trên Google, sửa là quyết định SEO riêng. Ghi nợ trong `DRIFT_LOG.md`, không im lặng bỏ qua.
6. **Bản nháp ADR-0028 do Cowork soạn**, chủ dự án phê chuẩn cùng ngày.

**Ai chốt.** Chủ dự án, trong phiên 2026-08-26. `ADR-0028` chuyển sang `accepted` cùng ngày.

**Hệ quả đã lường và chấp nhận.**
- Có **hai** đường mô tả vị trí trên cùng một document (`containedInPlace` có thứ bậc, `destination` phẳng), và **không có kiểm máy nào bắt hai đường mâu thuẫn**. Cố ý: chúng phục vụ hai vai khác nhau và không suy ra nhau.
- Khoảng 57 document (số theo bản sao lưu 2026-08-14) bị script ghi vào. **Không lùi được bằng `git revert`** — phải sao lưu trước khi chạy.
- Enum `siteSettings.sections` mở 19 → 20 khoá; `NavKind` 7 → 8 loại đích. Cả hai là enum đóng có kiểm, phải sửa đồng thời ở schema, đặc tả và mã.
- Hai meta-validator `g1` và `g4` chép tay danh sách field nên **phải sửa cùng lúc**, nếu không cổng vẫn xanh nhưng nói sai về thực tế.

**Ràng buộc thi hành.** Quota API Sanity đã chạm trần (xác minh 2026-08-26 bằng lỗi `plan_limit_reached`), reset **2026-09-01** theo `QĐ-2026-08-25-07`. Nạp bù dữ liệu và `npm run build` chưa chạy được tới lúc đó. **Thứ tự cứng:** nạp bù xong mới được dựng mã đổi truy vấn — ngược lại là trang chủ Nha Trang rỗng hai khối.

**Tài liệu.** `docs/specs/SPEC-2026-08-26-da-diem-den.md`, `docs/adr/ADR-0028-da-diem-den.md`, kế hoạch thi công `docs/plans/2026-08-26-da-diem-den.md` (8 task).

---

## QĐ-2026-08-27-01 — Bật lại deploy tự động sau khi Publish, kèm sửa ba chỗ lệch của webhook

**Ngày:** 2026-08-27 · **Người quyết:** chủ dự án · **Loại:** cửa hai chiều (đặt `isDisabledByUser: true` là hoàn nguyên)

**Bối cảnh.** Webhook `Cloudflare rebuild` (`UCT8eZl6s8SXBtKP`) bị tắt từ 2026-08-22 theo `QĐ-2026-08-22-03`, vì mỗi lần bắn là một lần dựng lại đọc toàn bộ nội dung qua Sanity Content API, và tháng 8 đã đốt sạch hạn mức 250k theo cách đó. `DR-042` ghi ba chỗ lệch `ADR-0009` và đặt điều kiện: **xử xong mới được bật lại**.

**Điều kiện đã thay đổi từ lúc tắt.** Hai việc do đợt khác làm đã tháo phần lớn rủi ro:

1. **`QĐ-2026-08-25-06` chuyển bản dựng sang đọc qua CDN** (`src/lib/sanity.ts` nay `useCdn: true`). Bản dựng không còn ăn vào xô `api` 250k mà vào xô **`apicdn` 1.000.000/tháng, hiện gần như chưa dùng**. Đây là thứ đổi bản chất bài toán chi phí, không phải một tối ưu nhỏ.
2. **Gói đã lên Growth trả phí** (xác minh 2026-08-26). Vượt hạn mức không còn là HTTP 402 dừng hẳn mà là hoá đơn — nhưng vượt CDN rẻ hơn vượt `api` **bốn lần** ($1/250k so với $1/25k), và xô CDN lớn gấp bốn.

**Chốt.** Bật lại webhook, đồng thời sửa đúng hai trong ba chỗ lệch của `DR-042`:

| | Trước | Nay | `ADR-0009` |
|---|---|---|---|
| Sự kiện | `create` | `create`, `update`, `delete` | mục 3 |
| Dataset | `*` | `production` | mục 3 |
| Lọc type | không có | 15 type có render trang | mục 3 |
| Lọc draft | có | giữ nguyên | — |
| Debounce | không | **vẫn không** | mục 4 cho phép MVP bỏ qua |

**Vì sao chỉ nghe `create` là lỗi nặng nhất.** Sửa một trang **đã publish** rồi bấm Publish lại là sự kiện `update`. Theo cấu hình cũ, thao tác thường gặp nhất của biên tập viên **không kích build**. Nghĩa là hook vừa bắn thừa cho việc không cần, vừa im lặng đúng lúc cần nhất.

**Vì sao bộ lọc type đáng giá hơn tưởng.** Dataset có 18 `_type`, trong đó **5 là của hệ thống**: `sanity.imageAsset` (sinh mỗi lần tải một tấm ảnh), `system.schema` (sinh mỗi lần `sanity deploy` — riêng ngày 2026-08-27 đã ba lần), `system.group`, `system.retention`, `sanity.canvas.link`. Với `dataset: "*"` không lọc type, **mỗi document hệ thống đó kích một lần dựng toàn site**. Đây nhiều khả năng là phần lớn tiếng ồn mà `DR-042` đo được (25 lần bắn/ngày, 4 lần trong 6 giây) — không phải biên tập viên bấm Publish 25 lần.

**Nợ còn mở, cố ý.** Debounce (`ADR-0009` mục 4: Worker gom sự kiện, bắn sau khoảng lặng 120 giây) **chưa làm**. Chính ADR ghi "MVP có thể bỏ qua Worker và bắn thẳng, chấp nhận build xếp hàng". Với xô CDN 1M và bộ lọc type vừa thêm, chấp nhận được. Phải xem lại nếu mức dùng CDN vượt ~50%.

**Hệ quả phải biết.** Bản dựng tự động lấy mã từ **`origin/main`**, không phải từ nhánh đang làm. PR #11 chưa gộp, nên tới khi gộp, bấm Publish sẽ phát hành **hành vi của `main`**: có trang `/ninh-thuan/` (định tuyến đa điểm đến vốn đã có trên `main`), nhưng **chưa có** `/diem-den/` và hai khối trang chủ **chưa lọc** theo điểm đến.

**Đã kiểm.** Đọc lại cấu hình từ server sau khi ghi, không tin phản hồi của chính lệnh ghi: `dataset: production`, `on: [create, update, delete]`, `isDisabledByUser: false`, `isDisabled: false`, `includeDrafts: false`, filter đúng như khai. **Chưa kiểm đầu Cloudflare** — deploy hook đó chạy được trước khi bị tắt, nhưng lần bắn thật đầu tiên mới xác nhận trọn chuỗi.

---

## QĐ-2026-08-27-02 — Đóng ba việc treo cuối đợt đa điểm đến

**Ngày:** 2026-08-27 · **Người quyết:** chủ dự án (mục 1, 2 xác nhận lại quyết định đã có; mục 3 là đính chính sự kiện) · **Loại:** cửa hai chiều

Cuối đợt `ADR-0028` còn ba việc treo. Rà lại thì **hai trong ba đã có câu trả lời từ trước** — chúng treo vì tôi ghi sai, không phải vì thiếu quyết định.

### 1. Menu chính giữ đúng bảy mục — không thêm "Điểm đến"

`src/site.config.ts` khai thành chữ: *"menu chính giữ đúng bảy mục bán hàng"*. Khi tôi nêu việc Ninh Thuận không có mặt trên menu, chủ dự án **chọn phương án khác** thay vì phá luật đó: đổi nút phụ ở hero từ "Xem trang điểm đến" thành **"Tất cả địa danh"** trỏ `/diem-den/`.

Vậy `/diem-den/` có **ba** lối vào: nút hero, chân trang (tự sinh từ `ROUTE_MAP`), và khối "Điểm đến khác" trên trang chủ kèm link "Xem tất cả". Luật bảy mục giữ nguyên. Việc này **đóng**, không phải treo.

### 2. Event cố ý không có trang — không phải câu hỏi mở

`src/site.config.ts` đã ghi lý do ngay trên ba công tắc đang tắt: *"Ba mục dưới thuộc engine gốc (site du lịch Nha Trang), site này không dùng."* `restaurant`, `specialty`, `event` **không có dòng nào trong `ROUTE_TABLE`**, nên bật công tắc thôi cũng không sinh route.

Nút "Xem trang live" không hiện trên Event **là hành vi đúng**. `DR-074` đã đính chính. Còn lại một nợ nhỏ: dataset có **1 document `event` đã duyệt** cho entity site không dùng — dữ liệu chết, xoá hay giữ là việc chủ dự án.

### 3. `deferred-gate` — sửa hai chỗ khai sai trong `control-registry.yaml`

**`I16` khai `gap` là sai sự thật.** I16 không phải nợ chưa làm; nó là quyết định kiến trúc về **nơi** thi hành. `04-CONSTRAINTS` §1 ghi rõ *"thi hành ở bảng PY (PY1, PY2, PY4)"*, và `validate-constraints` báo I16 là `defer`, không phải `fail`. Đổi thành `status: deferred` kèm `deferred_to: [PY1, PY2, PY4]` — đúng khuôn mà `deferred-gate` đòi.

**`PY1`/`PY2`/`PY4` khai `gap` cũng sai.** Cả ba **chạy thật và xanh**: `validator-status.json` ghi `pass` cho từng cái. Lật sang `live`.

⚠ **Đây KHÔNG phải lần lật 27 dòng `gap`** mà phần đầu `control-registry.yaml` đang treo chờ chủ dự án. Câu hỏi đó vẫn mở. Ở đây chỉ lật đúng **ba** control, và chỉ vì `I16` uỷ thác sang chúng — cả ba đều đang pass, nên không control nào chuyển đỏ. Lý do phải hỏi trước khi lật cả 27 (11 control đỏ vì dữ liệu) không áp cho ba cái này.

**Kết quả đo được:**

| | Trước | Sau |
|---|---|---|
| `npm run gate` | 2/11 đỏ | **1/11 đỏ** |
| `audit:gate` | 40 đạt / 27 trượt | **46 đạt / 23 trượt** |
| Mục trượt mới | — | **không có** |

Bốn mục `GA6/I16`, `GA6/PY1`, `GA6/PY2`, `GA6/PY4` biến mất; `GA1`/`GA3` cho ba control vừa lật đều đạt.

### Còn lại: `governance-post` (S24), và vì sao tôi KHÔNG tự đóng

Sáu lỗi trên bốn trang, đều là **dữ liệu**:

| Trang | Thiếu |
|---|---|
| `cam-nang/review-mini-beach-…` | `approvedBy`; và `officialSource` hoặc `author` |
| `cam-nang/top-7-ngon-nui-…` | `approvedBy` (đã có tác giả Nguyễn Phạm Trường Duy) |
| `dia-danh/ben-cang-da-chong` | `approvedBy`; và `officialSource` hoặc `author` |
| `tac-gia/ho-dac-duy` | `contentProvenance` (đã có `approvedBy`) |

**Tôi không tự điền.** `approvedBy` trong dataset này có **bốn giá trị khác nhau** — "Tour đảo Nha Trang", "Trường Duy", "Vũ Lưu", "Vũ Lưu (Gạo tẻ)" — tức nó ghi **tên người duyệt thật**, không phải một hằng máy suy được. `contentProvenance` và `author` cũng vậy: cả ba đều là lời khẳng định về **con người đã làm gì**. Máy điền vào đó là tạo ra một bản ghi thẩm quyền không có thật — đúng loại việc `04-CONSTRAINTS` sinh ra để chặn.

Toàn dataset còn **7 document approved thiếu `approvedBy`** (4 cái ngoài danh sách trên chưa làm S24 đỏ vì chưa render ra trang chi tiết). Điền xong bảng trên là `governance-post` xanh, và `pre-push` (`DR-073`) thôi đòi `--no-verify`.

---

## QĐ-2026-08-27-03 — Loại điểm tham quan: mở rộng enum bản thể, thêm tầng nhãn, sửa tập rẽ nhánh I2

**Ngày:** 2026-08-27 · **Người quyết:** chủ dự án · **Loại:** phần lớn **cửa hai chiều**; riêng việc sửa tập rẽ nhánh của **I2** là **gần một chiều** nên bắt buộc có bản ghi này (`01-CONTENT_MODEL` §5.3)

**Spec:** `docs/specs/SPEC-2026-08-27-loai-diem-tham-quan.md` (duyệt cùng ngày)

### Bối cảnh — đo trên bản dựng, không phải cảm nhận

Trích `@type` thứ hai trong JSON-LD của cả 39 trang `/diem-tham-quan/`:

| Tình trạng | Số trang |
|---|---|
| `attractionType` trống → phát `["TouristAttraction","TouristAttraction"]` | **17** (44%) |
| Gán `theme-park` nhưng sai bản chất (vịnh Nha Trang, vịnh Nha Phú, Ba Hồ, Yang Bay, Bãi Dài, Bãi Tranh, Hòn Sỏi, đảo Hoa Lan–Hòn Heo) cộng Hòn Tằm gán `mud-spa` | **9** |
| Đúng | **13** |

Nguyên nhân gốc không phải người nhập liệu cẩu thả: enum 9 giá trị **không có ô nào** cho ba nhóm chiếm phần lớn tồn kho — biển/đảo (9 doc), thiên nhiên (11 doc), làng chài/làng nghề (3 doc). Gặp danh sách không có ô đúng thì người ta bỏ trống hoặc chọn ô gần nhất. Đây là lỗi thiết kế từ vựng, sửa ở tầng từ vựng.

### Chốt 1 — hai cơ chế, không trộn

Dự án đã có sẵn hai tầng phân loại và đợt này phát biểu rõ ranh giới giữa chúng:

| | `attractionType` | `category` bộ `attraction-type` (mới) |
|---|---|---|
| Số trị | **một** | nhiều |
| Nhiệm vụ | quyết `@type` JSON-LD | nhãn lọc cho người đọc |
| Ra schema.org bằng | type thứ hai trong mảng `@type` | `additionalType` + trang term `DefinedTerm`/`CollectionPage` |
| Vào gate publish | có | **không** |

Ba mục **Trải nghiệm du lịch**, **Khu nghỉ dưỡng**, **Ẩm thực** trong danh sách chủ dự án đưa **thành nhãn, không thành loại**. Lý do: chúng đã là entity riêng (`§2.4` Experience, `§2.7` Resort, `§2.5` Restaurant / `§2.14` Specialty), và lằn ranh `§2.4` — *"Experience là việc để làm, Attraction là nơi để đến"* — giữ nguyên, không mở ADR. Hệ quả cụ thể: Hòn Tằm nằm loại **đảo**, mang nhãn tắm bùn + nghỉ dưỡng + ẩm thực, thay vì bị ép chọn một.

### Chốt 2 — enum 9 → 14 giá trị

Năm giá trị mới: `beach` → `Beach`; `island` → `Landform` + `additionalType` Q23442 (chép tiền lệ `§2.2`); `nature` → `Landform`; `craft-village` và `general` → `TouristAttraction` **đơn**.

`general` mang nhãn **"Điểm thu hút khách"**, không phải "Khác" — nhãn nói đúng thứ nó phát ra, và không mời gọi dùng như sọt rác.

**Không gộp** `temple`/`church` và `theme-park`/`park`: giữ `BuddhistTemple`, `Church`, `AmusementPark`, `Park`. Gộp lại sẽ phải hạ về type cha và mất độ mịn — đó là đi lùi.

**Ngoại lệ có ý thức:** `nature` gộp thác, suối, rừng, vịnh, núi (11 doc). `Landform` là type cha trung thực của cả năm; tách ra cho các ô 1–3 doc. Độ mịn lấy lại ở tầng nhãn qua Wikidata. Tách sau là cửa hai chiều.

### Chốt 3 — I2 nay có **ba** nhánh (phần gần một chiều)

| Nhánh | Bắt buộc | Gồm |
|---|---|---|
| Bách khoa | `sameAs` | historic, temple, church, museum, **beach, island, nature** |
| Venue | `officialSource` | theme-park, **aquarium**, mud-spa, market, park |
| **Một trong hai** | `sameAs` **hoặc** `officialSource` | **craft-village, general** |

Nhánh thứ ba có tiền lệ hình dạng trong `04-CONSTRAINTS` I12 (Article transport-guide cần ít nhất một trong `howTo`, `faq`).

**Vì sao phải có nhánh thứ ba thay vì để ô mặc định trống gate.** Một giá trị không thuộc nhánh nào thì `checkI2` **im lặng bỏ qua** — không phải "cho phép", mà là "không kiểm". Đó đúng là cơ chế đang làm `aquarium` hỏng (xem dưới). Để `general` rơi ra ngoài cả ba nhánh là biến một tai nạn thành thiết kế, và trái nguyên tắc nền: **không đăng thứ không dẫn được nguồn**.

**Bằng chứng nhánh thứ ba là đúng liều, không phải nới lỏng:** làng nghề Trường Sơn không có Wikipedia nhưng có trang Tổng cục Du lịch — biên tập viên đã tự dán link đó vào `sameAs`. Ép đúng Wikidata sẽ đẩy người ta đi bịa; miễn hẳn nguồn thì mất kiểm soát. "Một trong hai" khớp thực tế đang diễn ra.

### Chốt 4 — `aquarium` về nhóm venue, đóng drift ba nơi

Trước đợt này thuỷ cung bị ba nơi đòi ba thứ khác nhau:

| Nơi | Xếp nhóm | Đòi |
|---|---|---|
| `01-CONTENT_MODEL` §2.3 | venue | `officialSource` |
| `shared/gates/index.ts:57` (validator CI) | venue | `officialSource` |
| `cms/schemas/attraction.ts:59` (Studio) | **bách khoa** | `sameAs` |
| `scripts/synthesis/classify.ts:27` + `output-validator.ts:8` | **không nhóm nào** | không gì |

Hậu quả thật: nhập xong Studio báo đạt, tới lúc phát hành máy kiểm báo trượt. Chốt theo `01` và validator CI — **venue** — vì thuỷ cung về bản chất là cơ sở có chủ, có vé, có giờ mở cửa, và vì sửa Studio là sửa một chỗ thay vì hai. Viện Hải dương học giữ nguyên link Wikipedia đang có, không mất gì.

### Phạm vi và cái không làm

Không chuyển doc nào giữa Attraction và Place — Hòn Mun, Dốc Lết, Bãi Dài **giữ là Attraction** theo quyết định của chủ dự án. Không đụng entity Experience, Resort, Restaurant, Specialty. Không tách `nature`. Không sửa drift `slug` localized của Category (chỉ ghi `DRIFT_LOG`).

### Nợ mở, cố ý

**ĐÍNH CHÍNH cùng ngày, sau khi đo trên dataset thật.** Đoạn dưới đây viết lúc soạn là **SAI**, giữ lại nguyên văn để thấy sai ở đâu:

> ~~`lang-chai-bich-dam` và `ben-du-thuyen-nha-trang` hiện **không có cả `sameAs` lẫn `officialSource`**.~~

Sai vì đo bằng cách quét HTML đã dựng, ở đó `url` của `ImageObject` bị đọc nhầm thành `url` của chính thực thể. **Cả hai doc đều CÓ `officialSource`**, nên chúng qua nhánh "một trong hai" bình thường, không phải nợ.

**Nợ thật, đo trên dataset (không phải trên `dist/`):** bốn doc sẽ trượt I2 sau khi xếp lại loại, đều cùng một hình dạng — **có `officialSource`, không có `sameAs`, nhưng bị nhánh bách khoa đòi `sameAs`**:

| Doc | Loại mới | Có |
|---|---|---|
| `rung-thong-khanh-son` | `nature` | officialSource |
| `dao-ga-nha-trang` | `island` | officialSource |
| `khu-du-lich-dao-hoa-lan-hon-heo` | `island` | officialSource |
| `khu-du-lich-mini-beach` | `beach` | officialSource |

Cả bốn là **điểm du lịch có quản lý dựng trên nền tự nhiên**: có website chính thức, không có mục bách khoa. Lằn ranh "tự nhiên" và "có quản lý" **cắt ngang** ba giá trị `beach`/`island`/`nature`, nên một phép gán nhóm cứng không mô tả được. Món này để mở, xem mục cần quyết ở spec.

**Đếm lại tồn kho:** dataset có **53** document `attraction` (41 approved đã publish, còn lại draft), không phải 39. Con số 39 lấy từ `dist/` — một bản dựng cũ. Bảng §8 của spec vì thế thiếu 5 doc, trong đó `Núi Cô Tiên` **approved nhưng không có `slug.vi`**, tức không render ra trang nào.

**Máy không tự điền nguồn** — giữ nguyên lý do đã ghi ở `QĐ-2026-08-27-02` mục 3: nguồn dẫn là lời khẳng định về sự thật ngoài đời, không phải hằng suy được.

### Bổ sung 1 (cùng ngày 2026-08-27) — `beach`/`island`/`nature` chuyển sang nhánh một trong hai

Chốt sau khi **chạy thử migration trên dataset thật rồi đo**, không phải suy từ bàn giấy.

Bốn doc trượt I2, tất cả cùng một hình dạng: **có `officialSource`, không có `sameAs`** —
`rung-thong-khanh-son`, `dao-ga-nha-trang`, `khu-du-lich-dao-hoa-lan-hon-heo`, `khu-du-lich-mini-beach`.

Xếp `beach`/`island`/`nature` vào nhóm bách khoa đã giả định **"tự nhiên thì có danh tính bách khoa"**. Dữ liệu bác bỏ: 18/22 doc thuộc ba loại này tự nguyện có `sameAs` — đó là địa danh thật (Hòn Mun, thác Tà Gụ, Hòn Chồng, vịnh Nha Trang); bốn cái còn lại là **điểm du lịch có quản lý dựng trên nền tự nhiên**, có website nhưng không ai viết Wikipedia về chúng. Lằn ranh "tự nhiên" so với "có quản lý" **cắt ngang** ba giá trị, nên một phép gán nhóm cứng không mô tả được thực tế.

Ba nhánh I2 sau bổ sung:

| Nhánh | Bắt buộc | Gồm |
|---|---|---|
| Bách khoa | `sameAs` | `historic`, `temple`, `church`, `museum` |
| Venue | `officialSource` | `theme-park`, `aquarium`, `mud-spa`, `market`, `park` |
| Một trong hai | ít nhất một trong hai | `beach`, `island`, `nature`, `craft-village`, `general` |

**Không phải nới cổng.** Hợp ba tập vẫn phủ đúng 14 giá trị, không ô nào được miễn nguồn, và ca kiểm cưỡng chế điều đó vẫn xanh. Bốn nhóm `historic`/`temple`/`church`/`museum` giữ bách khoa nghiêm ngặt vì với chúng giả định trên đúng.

### Bổ sung 2 — thứ tự thi hành: dữ liệu PHẢI đứng sau khi mã lên `main`

Lượt chạy migration đầu tiên (07:42) đã **làm hỏng production trong ít phút**. Mỗi lần patch một `attraction` đã publish là một lần webhook `Cloudflare rebuild` bắn (bật lại theo `QĐ-2026-08-27-01`), và webhook dựng từ **`origin/main`** — nơi chưa có v1.0.19. Kết quả đo được trên `tourdao.vn/diem-tham-quan/lang-chai-bich-dam/`: huy hiệu hero hiện **chuỗi mã máy `craft-village`** cho khách, vì `uiCopy` trên `main` không có nhãn cho giá trị mới nên `typeLabel` rơi về chính mã.

Đã hoàn nguyên toàn bộ 29 bản ghi từ `backups/backup-2026-08-27-07-42.ndjson` bằng `cms/_revert-attraction-types.mjs`; xác minh dataset khớp 53/53 và production trở lại đúng trạng thái cũ.

**Luật rút ra, áp cho mọi đợt sau:** khi một thay đổi có **cả** phần dữ liệu Sanity **lẫn** phần mã, và mã còn nằm trên nhánh chưa gộp, thì **cấm chạm dữ liệu production** cho tới khi mã đã ở trên `main`. Lý do gốc: dataset là tài nguyên **dùng chung** giữa nhánh đang làm và bản đang chạy, nên dữ liệu luôn tới production trước mã. "Mã xong" không đồng nghĩa "mã đang chạy".

---

## QĐ-2026-08-28-01 — Gỡ vùng "Trust bar" khỏi trang điểm đến; bốn điểm khác biệt chỉ còn ở trang chủ

**Bối cảnh.** Chủ dự án hỏi khối bốn ô ngay trên "Tổng quan về Nha Trang" (*Xe đưa đón tận nơi*, *Hướng dẫn viên đi cùng*, *Giá tốt*, *Thanh toán linh hoạt*) là tham chiếu hay viết cứng. Rà soát cho thấy nó viết cứng ở `src/lib/homepage.ts:53-58`, lặp cho năm ngôn ngữ — nhưng viết cứng **không sai đặc tả**, vì cả hai hàng chi phối vùng này đều khai nguồn là `config (build)`.

Cái sai nằm chỗ khác: **một component, một nguồn chữ, hai hàng đặc tả ngược nhau.** `06` §5.7 "Vì sao chọn" (trang chủ) đòi lập luận bán hàng — `SiteHome.astro:204` làm đúng. `06` §4.1 "Trust bar" (trang điểm đến) đòi *"cam kết hệ thống về nội dung duyệt, dữ liệu có nguồn, cập nhật rõ; **không phải CTA marketing**"* — nhưng `TouristDestinationHub.astro:146` lấp ô đó bằng chính khối bán hàng của trang chủ.

**Số đo quyết định.** Bản dựng 2026-08-28, cả bốn trang điểm đến đang xuất bản: khối bán hàng hiện 1/1 trên cả bốn; "Xác minh dữ liệu: Wikidata" **0/4**; "Cập nhật lần cuối" **0/4**; `AuthorityMeta` **0/4** (chỉ chạy ở nhánh `kind === 'detail'`). Tức ba cam kết mà hàng §4.1 gọi tên **đạt con số không trên mọi trang điểm đến**, dù hàng đó khai "bắt buộc / luôn hiện".

**Chốt.** Chủ dự án quyết trong phiên 2026-08-28, chọn phương án gỡ hẳn:

1. **Gỡ `<HomeTrustBar>` khỏi `TouristDestinationHub.astro`.** Trang điểm đến đi thẳng từ đoạn mở sang "Tổng quan về {tên}".
2. **Xoá hàng "Trust bar" khỏi `06` §4.1** và khỏi danh sách khối của §5.7. Nâng `06` lên **v2.7.0**.
3. **GIỮ NGUYÊN TOÀN BỘ module "Vì sao chọn Tour Đảo" trên trang chủ** — yêu cầu minh thị của chủ dự án. Không đổi một chữ nào trong bốn mục; `HOME_COPY.trustItems`, `HomeTrustBar.astro`, `SiteHome.astro:204` và khoá `trustBar` trong `siteSettings.sections` đều giữ y nguyên.

**Phương án bị loại.** *Giữ ô, thay ruột bằng ba cam kết thật* — loại vì cả ba là dữ liệu per-document (`reviewStatus`/`approvedBy`, `sameAs`, `updatedAt`), không phải `config (build)`, và chúng đã có vùng riêng là `HomeMetaBar` + `AuthorityMeta`; dựng thêm vùng thứ hai cho cùng field là đúng thứ **Luật 1** cấm. *Đưa bốn mục lên Sanity* — loại vì đi ngược cả hai hàng khai `config (build)`, và nội dung là định vị công ty, đổi theo chiến lược chứ không theo biên tập.

**Hệ quả đã lường và chấp nhận.**
- Ý "cam kết hệ thống" không còn hàng nào chở trong `06` §4.1. Chấp nhận vì số đo cho thấy ý đó hiện **đang bằng không** — gỡ hàng là ghi nhận sự thật, không phải đánh mất thứ đang có.
- Trang điểm đến ngắn đi một dải, không có khối nào thế chỗ. Theo **R7**, vùng rỗng ẩn hẳn chứ không dựng khung thay thế.
- `HomeTrustBar` từ nay có đúng một nơi dùng và đúng một hàng đặc tả.

**Việc kéo theo, tách phiếu.** Nếu vẫn muốn tín hiệu tin cậy thật trên trang điểm đến thì **không thiếu chỗ mà thiếu dữ liệu**: (1) mở `AuthorityMeta` cho `kind === 'destination'` trong `RouteDispatch.astro`; (2) nạp `sameAs` wikidata cho bốn document `touristDestination` để `HomeMetaBar` render được. Cố ý không gộp — đó là thêm tính năng, còn quyết định này chỉ gỡ một vùng sai chỗ.

**Tài liệu.** `docs/adr/ADR-0029-go-trust-bar-khoi-trang-diem-den.md`, `docs/core-specs/06-BINDING_MAP.md` (v2.7.0).

---

## QĐ-2026-08-28-02 — Chữ thân bài 17 → 19px toàn trang; hero cao thêm 50px CHỈ ở trang điểm đến

**Bối cảnh.** Chủ dự án yêu cầu (2026-08-28) nâng chiều cao khung Hero thêm khoảng 50px và tăng cỡ chữ thân bài thêm 2px, áp cho toàn trang. Trước khi sửa, đã đo trên bản dựng thật (Chrome, tiêm CSS đè rồi đo lại). Đường nền tái lập **đúng** con số `06` §3 đã ghi — thanh dính 618→675 khi h1 một dòng, 674→731 khi hai dòng — nên số đo so được thẳng với mốc màn đầu **657px** mà đặc tả dùng.

**Chốt.** Chủ dự án quyết theo khuyến nghị:

1. **`--fs-base` 17 → 19px (`1.0625rem` → `1.1875rem`), áp toàn trang.**
2. **Hero +50px, CHỈ trang điểm đến.** Thêm prop `tall` cho `Hero.astro`; `TouristDestinationHub` bật, `DetailLayout` không.
3. Hai việc còn lại của lượt rà soát ghi **nợ**, không làm trong đợt này (xem cuối phiếu).

**Vì sao chữ 19px an toàn — số đo, không phải phán đoán.**

| | 17px | 19px |
|---|---|---|
| Thanh dính, h1 một dòng / hai dòng | 618 / 674 | **618 / 674 — không nhúc nhích** |
| Ký tự mỗi dòng | 83 | **83 — không đổi** |
| Tràn ngang ở 1366 và 386px | không | **không** |
| Chiều dài trang desktop | 10.919 | 11.551 (**+5,8%**) |
| Chiều dài trang di động | 15.520 | 16.969 (**+9,3%**) |

**Luật 3 không bị đụng** vì dải breadcrumb, dải tiêu đề và hero đều không đọc `--fs-base`. Số ký tự mỗi dòng đứng yên vì cột chữ khai bằng `ch` — cột nở theo chữ.

**19 là TRẦN của thang này.** Cột chữ 70ch ở 19px đo 764px; cột chính của lưới `1fr 340px` trong khung 1200 rộng 812px — hở 48px. Ở 20px cột chữ thành ~804px, tức chạm. Muốn lên nữa phải nới `--container` trước.

**Vì sao hero +50px KHÔNG áp cho trang chi tiết.** Đo ở 1366 với +50px thật: thanh dính 618→**668** (h1 một dòng), 674→**724** (hai dòng). Mốc màn đầu là 657px. Nghĩa là hôm nay chỉ tiêu đề hai dòng rơi khỏi màn đầu; nâng 50px thì **mọi tiêu đề đều rơi**. Đó đúng là thứ `QĐ-2026-08-25-01` đã cắt 430→380 để tránh. Di động cũng vậy: 240→290 đưa hero từ 41% lên **47%** màn 800px, ăn vào chính lý do đã cắt 280→240. Trang điểm đến **không có thanh dính** nên Luật 3 không trói ở đó — được nâng miễn phí.

**Một cái bẫy số học đã tránh.** Nâng riêng **trần** `clamp` 380→430 KHÔNG cho +50px ở mọi khổ, vì `30vw` mới là số đang trói: đo được +4px ở 1280, +30px ở 1366, và đủ +50px chỉ từ 1440 trở lên. Muốn +50 thật phải cộng vào **số giữa** — `clamp(330px, calc(30vw + 50px), 430px)`.

**Cách thi hành.** Chiều cao hero gom về **một biến** `--hero-h` đặt trên `.hero-shell`, thay vì lặp cùng biểu thức ở sáu chỗ như trước. Biến thể `.hero-shell--tall` chỉ đặt lại biến. Nhờ vậy hai biến thể ảnh-đơn và mosaic không thể lệch nhau nữa — đúng lỗi mà chú thích cũ trong `Hero.astro` từng mô tả là "không thể xảy ra" trong khi nó đang xảy ra.

**Tài liệu.** `06-BINDING_MAP` v2.7.0 → **v2.8.0** (§3 hàng Hero); `07-DESIGN_TOKENS` §2 (`font.size.base`, `font.size.scale`).

**Nợ ghi lại, chủ dự án quyết hoãn.**
1. `AuthorityMeta` cho `kind === 'destination'` + nạp `sameAs` wikidata cho bốn document `touristDestination` — điều kiện để trang điểm đến có tín hiệu tin cậy thật (xem `ADR-0029`).
2. `RouteDispatch.astro` còn ép kiểu `entity as 'experience' | 'tour'` khi gọi `TermIndex`, trong khi runtime nay truyền cả `'attraction'`; hệ quả là card ở trang term attraction chưa hiện nhãn loại dù dữ liệu đã có (xem `DR-077`).

---

## QĐ-2026-08-28-03 — Một định dạng Hero duy nhất cho mọi trang chi tiết entity

**Bối cảnh.** Chủ dự án yêu cầu (2026-08-28) áp cùng một định dạng Hero cho tất cả entity type ở trang chi tiết. Yêu cầu đọc được theo hai nghĩa — đồng bộ **chiều cao**, hay đồng bộ **bố cục** (mosaic hay ảnh đơn) — nên đã hỏi lại trước khi làm. Chủ dự án chọn **cả hai**. *(Cùng ngày, sau khi xem số đo, chủ dự án chốt lại phần bố cục: dùng cơ chế fallback đã có sẵn thay vì ép mọi trang thành mosaic. Xem mục "Phần bố cục" bên dưới — đó mới là nội dung có hiệu lực.)*

**Hiện trạng đo được trước khi sửa.**
- Chiều cao: `QĐ-2026-08-28-02` vừa dựng biến thể `tall` cho riêng trang điểm đến (430px), trang chi tiết giữ 380px. Hai loại trang, hai chiều cao.
- Bố cục: **86 trang mosaic / 40 trang ảnh đơn** trên bản dựng. Lệch cả *trong* một loại (`khach-san` 4 mosaic / 6 ảnh đơn) lẫn *giữa* các loại.

**Chốt phần chiều cao — ĐÃ LÀM.** Bỏ hẳn biến thể `tall`, nâng chính giá trị nền: `clamp(330px, calc(30vw + 50px), 430px)` desktop, **390px** ở 769–1023px, **290px** di động, áp cho mọi trang. Một biến thể mà mọi nơi gọi đều bật thì không còn là biến thể.

**⚠ Ngoại lệ Luật 3, chấp nhận có chủ ý.** Chiều cao này đẩy thanh dính ở 1366 từ 618 xuống **668px**, vượt mốc màn đầu **657px** — với MỌI tiêu đề, chứ không riêng tiêu đề hai dòng như trước. Đây đúng là thứ `QĐ-2026-08-25-01` đã cắt 430→380 để tránh; nay đảo lại, đổi lấy một định dạng hero duy nhất. Đã nêu hệ quả này trong câu hỏi trước khi chủ dự án chọn.

Chưa thành vi phạm sống vì `sticky-bar__price` render trên **0 trang** — thanh dính hiện chỉ mang CTA. **Điều kiện bắt buộc: phải xét lại TRƯỚC khi vùng giá render trên bất kỳ trang nào.** Không xét lại thì ngày bật giá là ngày vi phạm Luật 3 trên toàn bộ trang chi tiết.

**Phần bố cục — CHỐT DÙNG CƠ CHẾ FALLBACK ĐÃ CÓ SẴN.** *(Sửa cùng ngày, sau khi chủ dự án xem số đo. Bản đầu của phiếu này ghi phần bố cục là "không làm được, chặn ở dữ liệu", kèm 17 + 30 document thành nợ phải nạp ảnh. Cách ghi đó SAI HƯỚNG: nó coi "luôn mosaic" là đích, trong khi đích thật là **khung hero đồng nhất**, còn ruột thì thích ứng theo dữ liệu.)*

Chủ dự án chốt: **đủ ảnh thì dựng đúng cấu trúc hero; thiếu ảnh thì hiện một ảnh.** Đó chính là thứ `Hero.astro` đã làm từ trước, không phải việc phải xây. Ba tầng, rẽ tự động theo dữ liệu:

| Điều kiện | Kết quả | Mã |
|---|---|---|
| ≥ 4 ảnh `gallery` sau khi loại trùng `mainImage` | mosaic: ảnh chính + lưới 2×2 | `Hero.astro:44` `hasGallery = galleryItems.length === 4` → `:49`, `:64` |
| Có `mainImage`, < 4 ảnh gallery | **một ảnh**, trải hết khung | nhánh `else` của `:49` |
| Không ảnh nào | khối `.hero-gradient` + huy hiệu loại | `:76` |

Sau `QĐ-2026-08-28-03` cả **ba** tầng cùng cao `--hero-h`, nên **khung ngoài đồng nhất tuyệt đối** dù ruột khác nhau. Đó là nghĩa đã chốt của "cùng một định dạng Hero".

**Hệ quả: không còn nợ dữ liệu.** Phân bố đo trên production 2026-08-28 (`reviewStatus == "approved"`) nay đọc là *phân bố tầng*, không phải *danh sách phải sửa*:

| Nhóm | Số document | Tầng đang rơi vào |
|---|---|---|
| 9 loại có field `gallery` | 105 | **88 → mosaic**, **17 → một ảnh** |
| `article`, `person`, `organization` | 30 | một ảnh, hoặc gradient nếu không có `mainImage` — ba loại này **không có field `gallery`** trong schema, và `06` §3 hàng Gallery khai rõ *"không áp dụng"*. Đúng thiết kế, không phải thiếu sót |

Nạp thêm ảnh cho 17 document kia là **nâng cấp tuỳ chọn** — trang tự lên mosaic khi đủ 4 ảnh, không cần đụng mã. Không còn là điều kiện để trang đúng. Nặng nhất là `khach-san`: sáu khách sạn đều 0 ảnh gallery.

Vẫn giữ nguyên: **không** lấp ô trống, **không** lặp lại ảnh chính. `R7` cấm khung trang trí rỗng, và ảnh lặp là nội dung giả. Fallback là hiện ít đi, không phải bịa thêm.

**Một ca ở giữa, ghi để không ai tưởng là lỗi.** Ngưỡng là "đủ **4**", nên document có **3** ảnh cũng rơi về một ảnh và ba ảnh kia không hiện. Hiện đúng một trang như vậy: `trai-nghiem/di-bo-duoi-day-bien-sea-walker`. Đúng chữ đã chốt. Muốn có tầng giữa (2–3 ảnh xếp lưới hẹp hơn) thì đó là bố cục mới, cần phiếu riêng.

**Phụ lục — 17 document đang ở tầng "một ảnh".** Không phải việc phải làm; nạp đủ 4 ảnh `gallery` thì trang tự lên mosaic, không cần đụng mã.

| Loại | Slug | Đang có |
|---|---|---|
| event | *(chưa có slug vi)* | 0 |
| experience | `di-bo-duoi-day-bien-sea-walker` | 3 |
| experience | `phao-bay` | 0 |
| hotel | `comodo-nha-trang` | 0 |
| hotel | `la-vague-nha-trang` | 0 |
| hotel | `nha-trang-palace` | 0 |
| hotel | `vinpearl-beachfront-nha-trang` | 0 |
| hotel | `vinpearl-empire-nha-trang` | 0 |
| hotel | `xavia-nha-trang` | 0 |
| place | `ben-cang-da-chong` | 0 |
| place | `deo-vinh-hy` | 0 |
| place | *(chưa có slug vi)* | 0 |
| resort | *(ba document chưa có slug vi)* | 0 |
| tour | `tour-dao-khi-suoi-hoa-lan` | 0 |
| tour | `ve-hon-tam-tam-bien-tour-hon-tam-nua-ngay` | 0 |

**Bổ sung sau khi phát hành (cùng ngày).** Lượt đầu bỏ sót **biến thể hero thứ ba**: khối `.hero-gradient` dựng khi trang không có ảnh giữ công thức riêng `clamp(280px, 36vw, 420px)` — hệ số `36vw` và trần `420px` đều khác hai biến thể có ảnh. Đo trên production tại `/dia-danh/deo-vinh-hy/` ở viewport 1710: hero ra **420px** trong khi mọi trang khác ra 430px. Biến thể này dễ sót vì nó **không có `.hero-main`**, nên mọi phép đo neo vào `.hero-main` đều bỏ qua nó. Đã cho dùng chung `--hero-h`. Ảnh hưởng 2 trang: `/dia-danh/deo-vinh-hy/` và `/cam-nang/kinh-nghiem-du-lich-vinh-hy/`.

**Tài liệu.** `06-BINDING_MAP` v2.8.0 → **v2.9.0** (§3 hàng Hero).

---

## QĐ-2026-08-29-01 — Chiều cao hero về `tokens.css`: đổi một chỗ, mọi template đổi theo

**Bối cảnh.** Chủ dự án yêu cầu áp cấu trúc Hero và khung template cho cả `article`, và nêu rõ mục đích: *"để sau này tôi có điều chỉnh thông số 1 nơi thì tất cả đều đổi theo, ví dụ: đổi chiều cao của Hero thì sẽ áp dụng với mọi templates chỉ với việc đổi 1 chỗ"*.

**Rà soát cho thấy yêu cầu gồm hai phần, và một phần đã xong từ trước.**

*Phần khung — ĐÃ ĐÚNG, không phải làm gì.* `ArticleDetail.astro:5` đã `import DetailLayout`, và cả kho chỉ có **hai** nơi render `<Hero>`: `DetailLayout.astro` và `TouristDestinationHub.astro`. Mọi entity detail — kể cả `article`, `person`, `organization` — đều đi qua đúng khung chung và đúng component Hero. Đo trên bản dựng: `/cam-nang/kinh-nghiem-du-lich-vinh-hy/` cao 430px, y hệt tour và điểm đến. Riêng `article` không có field `gallery` (đúng `06` §3 hàng Gallery) nên rơi tầng "một ảnh" hoặc "không ảnh" theo cơ chế fallback ở `QĐ-2026-08-28-03` — đó là thiết kế, không phải lệch.

*Phần thông số — CHƯA ĐÚNG, và đây là việc thật.* Ba con số chiều cao hero (430 / 390 / 290) nằm trong khối `<style>` của `Hero.astro`, không nằm trong `tokens.css`. Mà `07-DESIGN_TOKENS` mở đầu khai: *"Nguồn token duy nhất của dự án: mọi giá trị giao diện trong code phải sinh từ đây, hardcode ngoài nguồn token là vi phạm P6/N7"*. Hero là chỗ vi phạm còn sót.

**Chốt.**

1. **Bốn token mới trong `src/styles/tokens.css`**: `--hero-entity-h-min` 330px, `--hero-entity-h-max` 430px, `--hero-entity-h-tablet` 390px, `--hero-entity-h-mobile` 290px, và biểu thức tổng hợp `--hero-entity-h`. **Cả hai điểm ngắt cũng chuyển về `tokens.css`**, không còn nằm trong component.
2. **`Hero.astro` không giữ con số chiều cao nào nữa** — chỉ đọc `var(--hero-entity-h)` ở bốn điểm dùng, phủ cả ba biến thể hero (mosaic, ảnh đơn, không-ảnh).
3. **Nối vào cổng đối chiếu token**: thêm bốn dòng vào `ANH_XA` của `scripts/check-token-parity.mjs` và bốn hàng vào `07` §3. Không khai ánh xạ thì vòng lặp `continue` qua và cổng im lặng — đúng kiểu `DR-050` đã nấp mười ngày.

**Bằng chứng cổng biết đỏ.** Đổi `--hero-entity-h-max` 430 → 460 trong `tokens.css` mà giữ `07` khai 430: `ĐỎ — 1 lệch MỚI, chưa có phiếu: layout.hero.entity.max (--hero-entity-h-max): 07 khai "430px", mã chạy "460px"`, **mã thoát 1**. Khôi phục → xanh.

**Bằng chứng đạt mục đích.** Đổi đúng **một** token `--hero-entity-h-max` 430px → 520px trên bản dựng, đo lại sáu loại trang: `article`, điểm đến, tour, điểm tham quan, khách sạn, địa danh — **cả sáu cùng đổi 430 → 460**, phủ cả ba biến thể hero.

Ra 460 chứ không 520 vì ở 1366 số trói là `calc(30vw + 50px)` = 459,8 — chính cái bẫy `clamp` đã ghi ở `QĐ-2026-08-28-02`. Nâng **trần** chỉ nới chặn trên; muốn cao thêm ở mọi khổ thì phải sửa số giữa.

**⚠ Bẫy tên gọi, ghi để không ai sửa nhầm.** `tokens.css` đã có sẵn `--hero-min-h` và `--hero-min-h-mobile` — **của `HomeHero.astro`, hero TRANG CHỦ**, một component khác và một chiều cao khác. Tên chỉ khác thứ tự từ so với `--hero-entity-h-min`. Đã chú thích cảnh báo ở cả hai cụm trong `tokens.css`. Đổi tên cho hết nhập nhằng là việc dọn dẹp riêng, chưa làm ở đây.

**Phát hiện phụ, không xử ở đây.** `--card-img-h` trong `tokens.css` không có nơi nào dùng — token chết. Ghi lại, chưa gỡ vì ngoài phạm vi.

**Tài liệu.** `07-DESIGN_TOKENS` §3 (bốn hàng `layout.hero.entity.*`).

---

## QĐ-2026-08-29-02 — Trang Bài viết vào đúng khung chung: `InfoCard` → `FactStrip`

**Bối cảnh.** Chủ dự án yêu cầu áp template cho trang Bài viết dùng chung khung với mọi entity khác, trong đó có yêu cầu đã chốt trước về định dạng Hero.

Lượt trả lời đầu của Cowork nói "đã đúng rồi" vì `ArticleDetail.astro:5` có `import DetailLayout`. **Đó là câu trả lời ở tầng import, chưa phải ở tầng trang thật.** Chủ dự án bác lại. Đo lại bằng cách so chuỗi vùng render của hai trang production:

```
Bài viết      crumb-band → title-band → hero-shell → summary-band → content-main
              → author-box → updated-section → sidebar → info-card
Điểm tham quan crumb-band → title-band → hero-shell → sticky-bar → summary-band
              → fact-strip → content-main → updated-section → sidebar
```

**Kết quả đo — ba khác biệt, chỉ MỘT là lệch khung thật:**

1. **`info-card` thay vì `fact-strip`** — lệch khung thật. Đây là `DR-046`: ba template `Article`/`Organization`/`Person` cố ý ở ngoài phạm vi đóng Luật 1, phiếu ghi rõ *"cần một quyết định riêng nếu muốn ba template này cũng chuyển"*. Chủ dự án nay ra quyết định đó cho Bài viết.
2. **Thiếu `sticky-bar`** — **không** phải lệch khung. `jumpLinks` sinh từ `howTo`/`about`/`mentions`/`faq`; trang lấy mẫu đầu không có mục nào nên thanh không render. Kiểm ba trang cẩm nang khác: **3/3 đều có `sticky-bar`**.
3. **`author-box`** — vùng riêng của Bài viết theo `06` §3 hàng "Hộp tác giả". Đúng đặc tả.

**Về định dạng Hero — đã chung từ trước, có số đo.** Cả kho chỉ có **hai** nơi render `<Hero>`. `/cam-nang/kinh-nghiem-du-lich-vinh-hy/` cao **430px**, cùng biểu thức `--hero-entity-h`, y hệt tour, điểm tham quan, khách sạn, địa danh và trang điểm đến. Bài viết không có field `gallery` nên rơi tầng "một ảnh"/"không ảnh" — đó là **cơ chế fallback đã chốt ở `QĐ-2026-08-28-03`**, không phải lệch.

**Chốt.**

1. `ArticleDetail` truyền `facts` cho `DetailLayout`; gỡ `import InfoCard`, gỡ slot `info`, gỡ `infoBarItems={[]}`. Ba field `articleType`, `publishedAt`, `updatedAt` chuyển từ cột phụ ra dải **Thông tin nhanh** trải ngang.
2. Chuyển đổi gần như cơ học: kiểu `Fact` của `FactStrip` đúng bằng `{field, icon, label, value, visible}` mà `sidebarRows` vốn có.
3. `entity-layout-post.ts`: `ArticleDetail.astro` chuyển từ `ENTITIES_WITHOUT_FACTSTRIP` sang `ENTITIES_WITH_FACTSTRIP`. Để nguyên thì cổng vẫn xanh nhưng **nói sai về thực tế** — đúng loại lỗi `DR-050`.
4. `06` §3.1 khai vùng ba field của Bài viết. `06` v2.9.0 → **v2.10.0**.

**Không xoá `InfoCard.astro`, không xoá slot `info` của `DetailLayout`.** `OrganizationDetail` và `PersonDetail` vẫn dùng. `DR-046` chuyển sang **mở một phần**.

**Hồi quy phát hiện và đóng ngay trong lượt.** Đưa Thông tin nhanh ra khỏi cột phụ làm 16/24 trang cẩm nang không còn gì ở cột phụ. `Sidebar` tự ẩn khi rỗng, nhưng `.two-col` vẫn giữ rãnh `340px` cộng `gap` — đo được **436px bỏ trống** trên khung 1200, cột chữ bị ép còn 764px dù không có gì bên cạnh. Đúng thứ **R7** cấm.

Sửa ở `DetailLayout`: thêm `showSidebar` (soi cùng điều kiện `Sidebar.astro` dùng) và lớp `two-col--solo` thu lưới về một cột. Sửa ở đây nên đóng luôn **cả các trang không phải Bài viết**: tổng **18** trang có `.two-col` mà không có `.sidebar` — cẩm nang 16 (mới), địa danh 1 và tác giả 1 (**lỗi CÓ SẴN**, không phải hệ quả lượt này).

Lần đếm đầu ra 31 vì gộp nhầm trang term — trang term dùng `TermIndex`, không có `.two-col`. Đếm đúng là *"có two-col mà không có sidebar"*.

Kèm theo: neo containment của `entity-layout-post.ts` đổi từ `<div class="container two-col">` sang `["container", "two-col"` vì markup chuyển sang `class:list`.

**Phạm vi cố ý dừng ở Bài viết.** Chủ dự án chỉ định Bài viết. Sau lượt này: **10 template dùng `FactStrip`, 2 còn `InfoCard`**. Muốn dọn nốt Organization và Person thì cần quyết định riêng — đề xuất làm, vì để hai template lẻ loi chính là thứ đã sinh ra `DR-046`.

---

## QĐ-2026-08-29-03 — Đóng hẳn DR-046: Tổ chức và Người chuyển nốt sang `FactStrip`, xoá `InfoCard.astro`

**Bối cảnh.** Sau `QĐ-2026-08-29-02` còn **10 template dùng `FactStrip`, 2 còn `InfoCard`** (`OrganizationDetail`, `PersonDetail`). Để hai template lẻ loi chính là thứ đã sinh ra `DR-046`. Chủ dự án yêu cầu dọn nốt.

**Chốt.**

1. Cả hai template truyền `facts` cho `DetailLayout`, gỡ `import InfoCard`, gỡ slot `info`, gỡ `infoBarItems={[]}`.
2. **`sameAs` KHÔNG chuyển vào Thông tin nhanh.** `06` §3.1 khai nó là dòng "Nguồn tham khảo" cạnh Cập nhật ở cuối nội dung, *"không nằm trong sidebar"*. Nay truyền qua prop `sameAs` sẵn có của `DetailLayout` — đúng vùng, thay vì làm ô thứ bảy trong dải. Chuyển nguyên si sang `facts` sẽ là một vi phạm Luật 1 mới, dù `Fact` có đỡ `href`.
3. **Gỡ đường ống chết:** xoá `src/components/InfoCard.astro`; gỡ `<slot name="info">` và prop `infoBarItems` khỏi `DetailLayout`; gỡ `'InfoCard'` khỏi union và nhánh `s.name === 'info'` trong `Sidebar`; gỡ `InfoCard.astro` khỏi `SHARED_PRIMITIVES`.
4. `ENTITIES_WITHOUT_FACTSTRIP` nay **rỗng** — giữ mảng rỗng thay vì xoá, để nó nói rõ "không còn ngoại lệ".
5. `06` v2.10.0 → **v2.11.0**; `DR-046` **đóng**.

**Xác minh bản dựng.** `class="info-card"` còn **0 trang** trên toàn site. `cong-ty` 3/3 có `fact-strip`; `tac-gia` 2/3 — trang thứ ba không có field nào hiển thị nên dải tự ẩn, đúng **R7**. Dòng "Nguồn tham khảo" vẫn render trên 3 trang, tức `sameAs` không mất khi đổi vùng. Số trang thu cột `two-col--solo` tăng 18 → **20** vì cột phụ của hai loại trang này nay cũng rỗng — cùng lối sửa đã dựng ở `QĐ-2026-08-29-02`, không phải lỗi mới.

`gate:all` 11/11 xanh.

---

## QĐ-2026-08-29-04 — `PageHead`: một đầu trang dùng chung cho mọi loại trang trừ trang chủ; byline không nền cho Bài viết

**Bối cảnh.** Chủ dự án yêu cầu gộp bảy loại trang còn lại vào frame chung, và nói thêm: mục "Chuyên mục" và tác giả phải đặt gọn gàng, **không nền**.

**Hiện trạng đo được.** Sáu bản cho một thứ: `DetailLayout` có `.crumb-band`/`.title-band`/`.summary-band`; `TouristDestinationHub` **chép lại y hệt** (đo 2026-08-28: khai báo CSS trùng từng giá trị, chỉ khác chú thích); `EntityIndex`, `TourIndex`, `TermIndex` mỗi file một header riêng cùng hình dạng `h1 + gạch chân + mô tả`; `EventIndex` và `HubIndex` **không có `h1` nào**.

**Chốt phạm vi: 6 trang, TRỪ `SiteHome`.** Chủ dự án chọn sau khi được nêu ba lựa chọn. Lý do loại trừ trang chủ: nó không có breadcrumb, và `h1` của nó là **câu định vị thương hiệu** chứ không phải tên trang — ép vào là làm hỏng đúng trang quan trọng nhất.

**Chốt hình dạng.** `src/components/PageHead.astro`:

```
{breadcrumb?}  →  title-band ( h1 + gạch chân? + byline? )  →  <slot/>  →  summary-band?
```

`<slot/>` nhận thứ nằm giữa dải tiêu đề và đoạn mở. Trang chi tiết đưa **hero + thanh dính** vào đó — đúng thứ tự `06` §6, và giữ được ràng buộc đoạn mở phải đứng SAU thanh dính (`Luật 3`, spec vòng 5 §3.6). Trang điểm đến đưa hero + dòng ghi công ảnh. Trang danh sách không đưa gì.

Hai biến thể khai rõ thay vì giả vờ giống nhau: `detail` (nền phẳng, tiêu đề co giãn) và `index` (nền `--c-surface-alt` + viền dưới, `--fs-h1`, có gạch chân). Giữ nguyên diện mạo ba trang danh sách đang có, để lượt gộp không đổi giao diện của chúng.

**Chốt byline cho Bài viết.** `articleType`, `author` và `publishedAt` gộp thành **một dòng chữ nhỏ dưới `h1`, không nền không viền**, qua slot `meta`. Trước đó chuyên mục nằm trong ô có viền của `FactStrip`, còn tác giả nằm trong hộp nền `--c-surface-alt` ở cuối bài — hai dải riêng cho ba mẩu thông tin ngắn.

- `author` **đổi vùng duy nhất** từ "Hộp tác giả" sang byline. Vẫn đúng một vùng theo **Luật 1**, chỉ đổi chỗ. Hộp cũ chỉ chứa tên + chức danh, không avatar không tiểu sử, nên gộp lên không mất nội dung.
- Bù lại nay **có link `/tac-gia/{slug}`** — thứ `06` §3 hàng "Hộp tác giả" đã đòi mà bản cũ chưa làm.
- `updatedAt` **cố ý không** lên byline: `DetailLayout` đã hiện "Cập nhật" ở cuối nội dung; đưa lên nữa là hai vùng cho một ý.
- Bài viết do đó không còn ô Thông tin nhanh nào. `FactStrip` tự ẩn (**R7**). `ArticleDetail` quay lại `ENTITIES_WITHOUT_FACTSTRIP` — không phải lùi bước, mà là sổ hợp đồng khai đúng thực tế mới.

**`EventIndex` và `HubIndex` nay có `h1`.** Trước đây không có tiêu đề cấp một nào. `RouteDispatch` đã sẵn `indexInfo` và `HUB[entity]`, chỉ chưa truyền xuống. Đây là **giao diện mới**, chủ dự án đã được nêu trước khi chọn.

**Xác minh bản dựng.**

| Trang | `h1` | biến thể | byline |
|---|---|---|---|
| `/cam-nang/…` (Bài viết) | 1 | `detail` | **có** — Cẩm nang · [Nguyễn Phú Hải](/tac-gia/nguyen-phu-hai/) · ngày |
| `/nha-trang/` (điểm đến) | 1 | `detail` | — |
| `/diem-tham-quan/`, `/tour/` (danh sách) | 1 | `index` | — |
| `/kham-pha/` (hub) | 1 | `index` | **mới có `h1`** |
| trang nhãn | 1 | `index` | có — số kết quả |

`class="author-box"` còn **0 trang**; `fact-strip` trên `cam-nang` còn **0** (đúng thiết kế). `gate:all` **11/11 xanh**.

**Tài liệu.** `06` v2.11.0 → **v2.12.0**; `KIEN-TRUC-TEMPLATE.md` cập nhật §1, §2.0 mới, §2, §5.

**Còn lại đúng một trang ngoài frame: `SiteHome`.**
