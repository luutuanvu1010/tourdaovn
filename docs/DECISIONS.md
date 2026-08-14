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
