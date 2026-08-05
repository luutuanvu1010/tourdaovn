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
