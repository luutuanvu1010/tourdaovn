# 04 — CONSTRAINTS (bước 4: luật hệ thống bất biến)

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Nguồn: nhatrangtravel/project/04-CONSTRAINTS.md · Nhóm A (tái dùng CAO)
Bản thi hành máy-kiểm-được: validator I (bất biến dữ liệu), PY (nguồn giá), R (URL tree),
mô hình fail/warn, ngưỡng chất lượng, bánh cóc. Gần như thuần khuôn.
Phần riêng site cần thay khi copy đi (tìm 🔧 SITE-SPECIFIC):
  - I15 "cấm chuỗi thành phố Nha Trang" → luật địa danh của site (hoặc bỏ nếu không cần).
  - Tiền tệ VND (PY7, PY8) → tiền tệ site.
  - Danh mục "14 entity" → danh mục entity của site.
  - Tham chiếu ADR đánh số (ADR-0003/0006/0007/0019) → ADR của site.
Phần KHÔNG nhãn (mô hình fail/warn, họ validator I1-I19/PY/R về mặt cơ chế, ngưỡng, bánh cóc) = khuôn.
═══════════════════════════════════════════════════════════════════ -->

> Đây là N5 cụ thể hóa cho dự án: các quy tắc không bao giờ được phá, viết sao cho máy kiểm được. Mỗi ràng buộc thiếu cách kiểm là ràng buộc rỗng (Điều 8.2). Cowork soạn, chủ dự án duyệt; vi phạm bất kỳ dòng nào ở đây là lý do hợp lệ để chặn release.
>
> 🔧 **SITE-SPECIFIC:** các mã bất biến (I1-I19), số entity (14), tiền tệ (VND), và luật địa danh (I15) là của nhatrangtravel. Giữ *cơ chế* validator; thay *nội dung* theo site.

- **Trạng thái:** đã duyệt, founder phê chuẩn 2026-06-12
- **Ngày:** soạn 2026-06-11, phê chuẩn 2026-06-12   **Người soạn:** Cowork   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Liên quan:** `01-CONTENT_MODEL.md` v1.0.1 mục 4 (phát biểu đầy đủ 19 bất biến) và mục 2 (13 dòng gate publish), `02-SAD.md` mục 5 (ràng buộc nháp), ADR-0003, ADR-0006, ADR-0007, overlay S2.2 và S2.8, `playbook/governance/CONTROL_GATES.md`, `DECISIONS.md` 2026-06-12 (bản bước 4).

> Ghi chú vận hành 2026-07-08: founder tắt cổng CI nội dung trên Cloudflare qua ADR-0019 để Sanity approve/publish là cổng duyệt nội dung chính. `build:ci` hiện chạy `npm run build`; chuỗi fail-closed đầy đủ giữ ở `npm run build:strict`. Xem `DECISIONS.md` 2026-07-08 và `project/governance/CONTROL_GATES.md`.

## 0. Cách luật chạy

Hai mức enforce, định nghĩa một lần dùng cho mọi bảng dưới:

- **fail**: validator chạy như bước tiền điều kiện trong build (fail-closed theo SAD). Vi phạm thì build dừng, Cloudflare không có artifact để deploy.
- **warn**: build chạy tiếp, vi phạm in thành báo cáo cuối log build để founder rà.

Hai cổng áp dụng theo CONTROL_GATES: **QA2** là cổng trước phát hành (CI trong build); **hook** là cổng trước thực thi (PreToolUse chặn ngay lúc tác nhân soạn thảo, trước khi vi phạm kịp vào repo). Rule có cả hai thì hook bắt sớm, CI bắt chót; CI là tầng quyết định vì hook có thể bị tắt.

Nguồn sự thật của phát biểu bất biến là CONTENT_MODEL mục 4; file này là bản thi hành, không phát biểu lại nghĩa. Hai bên lệch thì CONTENT_MODEL thắng và file này phải sửa theo.

## 1. Bất biến dữ liệu (thi hành I1 đến I19)

| Mã | Thi hành | Validator (E1, máy chạy được) | Mức | Cổng |
|---|---|---|---|---|
| I1 | Sanity không lưu con số giá | quét schema Sanity và dataset: cấm field kiểu number mang nghĩa tiền tệ, cấm pattern giá trong field text của entity thương mại; đối chiếu danh sách field từng entity với CONTENT_MODEL mục 2 | fail | QA2 cộng hook |
| I2 | sameAs cho nhóm bách khoa; officialSource cho Attraction nhóm venue thương mại; geo/address là tùy chọn với mọi entity | validator rẽ nhánh theo `attractionType` và `placeType`, field gate không rỗng | fail | QA2 |
| I3 | Restaurant, Hotel, Resort: officialSource; Organization: url, officialSource; geo/address là tùy chọn với mọi entity | validator rẽ nhánh theo `_type`, field gate không rỗng | fail | QA2 |
| I4 | Article có author trỏ Person tồn tại | required-field cộng ref integrity | fail | QA2 |
| I5 | Event đủ eventType, startDate, location; quá endDate chuyển past, không xóa | required-field cộng ref integrity; job theo ngày so endDate với trạng thái | fail (field); warn (job nhắc chuyển past) | QA2 |
| I6 | Mọi doc publish xuất JSON-LD hợp lệ 100% | schema validator chạy trên toàn bộ output build, 0 lỗi | fail | QA2 |
| I7 | Doc dịch thuộc translationGroup; mỗi language tối đa một lần | GROQ đếm theo (translationGroup, language), không nhóm nào > 1 | fail | QA2 |
| I8 | containedInPlace chỉ trỏ Place hoặc TouristDestination tồn tại; cấm chu trình | ref integrity cộng duyệt đồ thị bắt cycle | fail | QA2 |
| I9 | slug duy nhất theo kiểu i18n của entity | uniqueness check: document-level theo (language, _type); field-level theo (_type, slug từng ngôn ngữ) | fail | QA2 |
| I10 | summary tự đứng như câu trả lời hoàn chỉnh | bán tự động: máy kiểm độ dài và cấu trúc câu, người duyệt nghĩa khi review; không giả vờ máy đo được nghĩa | warn (máy) cộng duyệt người | QA2 |
| I11 | Category là từ vựng đóng | term mới phải thuộc DefinedTermSet đã duyệt trong CONTENT_MODEL; import có term lạ thì chặn | fail | QA2 cộng hook |
| I12 | Cấm publish thiếu field bắt buộc; cấm entity rỗng | required-field validator sinh từ 13 dòng gate publish ở CONTENT_MODEL mục 2, chạy trên mọi doc publish; gồm cả điều kiện kèm trong dòng gate: Article transport-guide cần ít nhất một trong howTo, faq; `imageProvenance` là dữ liệu nội bộ tùy chọn, không còn là điều kiện publish | fail | QA2 |
| I13 | Experience đủ experienceType, venue tồn tại | required-field cộng ref integrity | fail | QA2 |
| I14 | Tour đủ itinerary ≥ 1 stop, operator tồn tại, tourFormat; đơn vị giá perPax | required-field cộng ref integrity; phần đơn vị giá thi hành ở PY3 | fail | QA2 |
| I15 | ~~Cấm chuỗi "thành phố Nha Trang"~~ **ĐÃ GỠ 2026-08-06** — không còn là luật của tourdaovn (chủ dự án chốt ở bước 0, `00-PROJECT_BRIEF` §7). Dòng này vốn tự đánh dấu 🔧 SITE-SPECIFIC là luật địa danh riêng của nhatrangtravel. | — | — | — |
| I16 | Giá render một chiều qua bookingRef; đơn vị giá sống bên nguồn giá; lưu trú kèm ngày cập nhật | thi hành ở bảng PY (PY1, PY2, PY4) và mục 2 điều cấm 4, 5 | fail | QA2 |
| I17 | Specialty đủ specialtyType, sameAs; whereToTry là tập con của chiều servesSpecialty suy ngược | required-field cộng subset check: mọi Restaurant trong whereToTry phải publish và có servesSpecialty chứa chính Specialty đó | fail | QA2 |
| I18 | Organization chỉ publish khi có quan hệ vào | reverse reference quét cả draft: tồn tại Tour.operator, Event.organizer hoặc Article.about trỏ tới | fail | QA2 |
| I19 | Publish cần reviewStatus = approved kèm approvedBy và contentProvenance thuộc enum đóng; Category miễn | required-field cộng kiểm giá trị enum (draft, inReview, approved; human, ai-t1, mixed) | fail | QA2 |
| I20 | Entity đã publish nên khai `destination` — thuộc điểm đến nào | required-field mức cảnh báo trên mười entity ở ADR-0028; thiếu thì document không hiện ở trang điểm đến nào, KHÔNG chặn publish | warn | QA2 |
| I21 | Mục nổi bật của một điểm đến phải thuộc chính điểm đến đó | ref integrity hai phía trên năm ô `featured*` của touristDestination (ADR-0028); trỏ sang điểm đến khác là trang hiện nội dung sai sự thật | fail | QA2 |

## 1b. Validator nguồn giá `prices.yaml` (thi hành I1, I14, I16 theo ADR-0007 và SAD mục 3)

| Mã | Luật | Validator | Mức |
|---|---|---|---|
| PY1 | `unit` thuộc enum đóng perPax, perRoomNight, perTicket | parse YAML, kiểm enum từng dòng | fail |
| PY2 | hình dạng theo unit: perPax có đúng một trong `amount` hoặc `tiers[]` ({maxPax, amount}); perPax có `amount` được kèm `paxRates` tuỳ chọn ({child / senior / infant: {amount, note}}), cấm kèm `tiers` (ADR-0027, 2026-08-21); perRoomNight có `from` cộng `asOf`; perTicket có `tickets[]` ≥ 1 hạng ({name, amount}) | schema check theo unit | fail |
| PY3 | mọi Tour có `bookingRef` thì dòng giá tương ứng phải unit = perPax, bất kể tourFormat (I14, content model v1.0.1) | join dataset Sanity với prices.yaml theo bookingRef | fail |
| PY4 | toàn vẹn tham chiếu hai phía: `bookingRef` trỏ hụt (không có dòng giá) chặn deploy; dòng giá mồ côi (không entity nào trỏ) báo để dọn | join hai phía theo bookingRef | fail (hụt); warn (mồ côi) |
| PY5 | entity thương mại (Experience, Tour, Hotel, Resort, Attraction, Event) thiếu cả `bookingRef` lẫn dấu miễn phí (`isAccessibleForFree`; Event thêm `ticketUrl`) là dấu hiệu quên gắn giá | quét entity publish theo `_type`, kiểm tổ hợp field | warn |
| PY6 | `asOf` của perRoomNight cũ quá 60 ngày so với ngày build (founder chốt 2026-06-11, chặt hơn đề xuất 90) | so ngày lúc build | warn |
| PY7 | file chỉ chứa giá bán công khai VND, số nguyên dương; cấm giá vốn, hoa hồng, dữ liệu khách, khóa bí mật (S2.8 ràng buộc 8) | kiểm kiểu và dấu của amount, from; danh sách khóa cho phép đóng theo lược đồ SAD 3.1, khóa lạ thì fail; `paxRates` chỉ nhận ba khoá con enum đóng với {amount, note}, `amount` hạng phụ là số nguyên ≥ 0 (0 = miễn phí), `note` ≤ 40 ký tự (ADR-0027, 2026-08-21) | fail |
| PY8 | giá vào JSON-LD đúng map SAD 3.3: giá đơn ra Offer; tiers và tickets ra AggregateOffer (lowPrice, highPrice, offerCount); perRoomNight ra Offer price = from; priceCurrency luôn VND; không phát Offer khi không có giá; không phát priceValidUntil khi nguồn giá chưa có dữ liệu hiệu lực | snapshot test trên output JSON-LD của build | fail |

Ghi chú: `bookingRef` không nằm trong gate publish; entity không có bookingRef vẫn publish bình thường, PY4 và PY5 không đụng tới chúng ngoài mức warn của PY5.

## 1c. Validator cây URL (thi hành `05-URL_MAP-and-DB_SCHEMA.md`, thêm 2026-06-12 theo quyền siết tự do của mục 5)

| Mã | Luật | Validator | Mức |
|---|---|---|---|
| R1 | trong một nhánh prefix, slug không trùng giữa term Category công khai và entity cùng nhánh (Experience với bộ experience-type, Tour với bộ tour-type), xét theo từng ngôn ngữ | union slug của term và entity theo nhánh và ngôn ngữ lúc build, có trùng thì fail | fail |
| R2 | trang term chỉ sinh khi có ít nhất 1 entity publish trỏ tới term; không tồn tại CollectionPage term rỗng trong output | đếm entity publish theo term lúc build, dưới ngưỡng thì không sinh trang; quét output bắt trang term rỗng | fail |
| R3 | URL từng tồn tại không được biến mất câm: đổi slug hay gỡ trang phải có dòng xử lý trong `public/_redirects` (301 về nơi thay thế, hoặc 410 khi gỡ hẳn) | so sitemap của production hiện hành với sitemap build mới; URL mất mà không có dòng redirect thì fail | fail |
| R4 | hreflang hai chiều đầy đủ giữa các bản ngôn ngữ của một trang; URL đúng bộ prefix ngôn ngữ của nó (cấm trộn ngôn ngữ trong một cây, S2.5); sitemap chỉ chứa trang thật của build | quét output: cặp hreflang đối xứng, prefix khớp bảng 1.2 của 05, diff sitemap với danh sách trang build | fail |

## 1d. Ràng buộc module đặt tour (thi hành ADR-0027, thêm 2026-08-21)

Endpoint `/api/dat-tour` là đường ghi duy nhất lúc runtime. Nó không phải API giá và không nới điều cấm 2.3. Chi tiết ở `docs/specs/SPEC-2026-08-21-dat-tour.md` §4.11.

| Mã | Luật | Validator | Mức |
|---|---|---|---|
| BK1 | endpoint và form không đọc giá lúc runtime: `src/pages/api/dat-tour.ts` và `src/lib/booking/*` không import `src/lib/prices.ts`, `src/lib/sanity.ts`, `src/lib/resolver.ts`; client không `fetch` giá; tạm tính lấy từ số nướng lúc build | `grep` trong QA2 cộng review | fail |
| BK2 | endpoint không ghi Sanity, không ghi `prices.yaml`, không ghi file; chỉ ghi D1 | review; `wrangler secret list` không có token ghi Sanity | fail |
| BK3 | PII (tên, SĐT, email, điểm đón, ghi chú) chỉ ở D1 và hai tin báo; cấm `console.log` PII; cấm vào Sanity, `prices.yaml`, repo, log | review mã; `git grep` mẫu SĐT | fail |
| BK4 | bí mật chỉ ở `wrangler secret`; `wrangler.toml` không `[vars]`; `.dev.vars`, `.env*` trong `.gitignore` | `git grep` tên biến kèm giá trị; `wrangler secret list` | fail |
| BK5 | tạm tính client và kiểm server dùng một hàm `quote.ts`; lệch `total` → 400 | vitest | fail |

Chưa có dòng trong `docs/governance/control-registry.yaml` vì chưa có executor script; thêm khi có kiểm máy (nợ ghi ở SPEC §8).

## 2. Điều cấm theo stack

1. Cấm `_type` ngoài danh mục 14 entity của CONTENT_MODEL (hệ quả ADR-0006, chặn Transfer và mọi entity tự phát trước thủ tục 5.3). Kiểm: quét dataset và schema Sanity, _type lạ thì fail. Cổng: QA2 cộng hook.
2. Cấm field ngoài CONTENT_MODEL mục 2 (CLAUDE.md mục 8): muốn field mới thì sửa CONTENT_MODEL trước, ghi DECISIONS, rồi mới code. Kiểm: diff schema Sanity với danh mục field đã duyệt, field lạ thì fail. Cổng: QA2 cộng hook.
3. Trang không gọi API giá lúc runtime, không fetch giá phía client; giá chỉ vào trang lúc build (SAD mục 5). Kiểm: audit bundle output không chứa endpoint giá; review code. Mức: fail. Cổng: QA2. Endpoint đặt tour `/api/dat-tour` (ADR-0027, 2026-08-21) không phải API giá: không đọc `prices.yaml` hay Sanity lúc runtime (BK1), chỉ nhận yêu cầu và lưu D1 — điều cấm này không nới.
4. Build không ghi vào `prices.yaml`, không ghi ngược Sanity (S2.2, dòng dữ liệu một chiều). Kiểm: token Sanity cấp cho build chỉ quyền đọc; CI kiểm working tree sạch sau build (build sinh ra ghi đè file nguồn thì diff lộ). Mức: fail. Cổng: QA2.
5. `DECISIONS.md` chỉ thêm, không sửa hay xóa bản ghi cũ; ADR accepted không sửa nội dung (chỉ ADR mới được supersede). Kiểm: git-governance diff guard trên vùng đã có của hai loại file này trong mỗi commit; hook chặn lúc soạn. Mức: fail. Cổng: QA2 cộng hook.
6. Không sửa `playbook/CONSTITUTION.md` từ phiên làm việc dự án (CLAUDE.md mục 6). Kiểm: hook chặn ghi vào đường dẫn playbook; git-governance diff guard. Mức: fail. Cổng: QA2 cộng hook.
7. Cấm dùng `process.cwd()` trong `scripts/`. npm `--prefix` đổi CWD nên `process.cwd()` không còn trỏ về repo root. Mọi script phải xác định repo root từ `import.meta.url` (ESM) hoặc `__dirname` (CJS) — vị trí của chính script file, không phụ thuộc CWD. Kiểm: CI check `bash scripts/check-no-process-cwd.sh` chạy đầu `build:ci`; hook PreToolUse `Write|Edit` trên file trong `scripts/` có chứa chuỗi `process.cwd()`. Mức: fail. Cổng: QA2 cộng hook. (Thêm 2026-06-19 sau incident Cloudflare build #2 fail do `r3-r4-post.ts` dùng `process.cwd()`.)

## 3. Ngưỡng chất lượng dạng số (Điều 6.2)

| Ngưỡng | Giá trị | Cách đo | Mức | Hiệu lực |
|---|---|---|---|---|
| Structured data | 100% doc publish phát JSON-LD hợp lệ, 0 lỗi validator | I6, chạy trên toàn bộ output build | fail | ngay |
| Giá lưu trú tươi | `asOf` không quá 60 ngày | PY6 | warn | ngay khi có dòng perRoomNight đầu tiên |
| Hiệu năng | Lighthouse performance ≥ 90, đo mobile, trên bộ trang đại diện (trang chủ cộng một trang mỗi loại entity có template) | Lighthouse CI trong pipeline | fail | kích hoạt khi có production build đầu tiên |
| Accessibility | Lighthouse accessibility ≥ 95 và axe 0 lỗi mức critical, serious trên cùng bộ trang | Lighthouse CI cộng axe | fail | kích hoạt khi có production build đầu tiên |

Ghi sẵn ngưỡng, hiệu lực theo cột cuối (founder chốt 2026-06-11): không phải ràng buộc rỗng vì điều kiện kích hoạt và cách đo nêu rõ; bật sớm hơn là siết thêm, tự do theo mục 5.

## 4. Ràng buộc bảo mật

Kế thừa toàn bộ S2.8 của overlay (6 control của `playbook/governance/policies/security.md` cộng 2 siết: cô lập chỉ dẫn AI, dữ liệu nhạy cảm và AI). Cụ thể hóa thêm cho seam giá và build:

- Secret scan trong CI (gitleaks hoặc tương đương), phát hiện là fail. Deploy hook Cloudflare và token Sanity sống trong secret store của Cloudflare và CI, cấm xuất hiện trong repo (hệ quả ADR-0007).
- Token Sanity cấp cho build chỉ quyền đọc dataset (đồng thời là cơ chế kiểm của điều cấm 2.4).
- `prices.yaml` chỉ giá bán công khai (S2.8 ràng buộc 8), thi hành bằng PY7.
- GROQ dùng tham số, cấm nối chuỗi từ đầu vào người dùng; chống XSS ở mọi điểm render nội dung động (S2.8). Kiểm: lint cộng review, artifact review là điều kiện cổng QA2.
- Module đặt tour (ADR-0027, 2026-08-21): bí mật Resend, Zalo Bot, Turnstile chỉ ở `wrangler secret`, cấm `[vars]`; PII chỉ ở D1 và tin báo, không log; IP chỉ lưu dạng băm có muối; D1 dùng prepared statement tham số hoá; ba lớp chống lạm dụng (Turnstile, honeypot cộng giới hạn tần suất, luật WAF); `Origin` phải cùng host. Thi hành BK3, BK4.

> **Nới ràng buộc — ghi theo §5.** Gỡ I15 là *nới*, nên cần chủ dự án phê chuẩn kèm lý do ghi vào `DECISIONS.md`. Đã có: chủ dự án chốt 2026-08-06, bản ghi QĐ-2026-08-06-01. Không control nào khác bị hạ mức. Mở rộng lược đồ `prices.yaml` bằng `paxRates` (PY2, PY7, 2026-08-21) là đổi hình dạng khoá, chủ dự án duyệt trong phiên 2026-08-21, bản ghi `QĐ-2026-08-21-01` và `ADR-0027`; mức của PY2/PY7 giữ nguyên fail.

## 5. Quy tắc sửa file này

Thêm ràng buộc hoặc siết mức (warn lên fail, ngưỡng chặt hơn, bật ngưỡng sớm hơn): được tự do. Nới hoặc xóa ràng buộc, hạ mức fail xuống warn, nâng ngưỡng stale, hoãn hiệu lực: cần chủ dự án phê chuẩn kèm lý do ghi vào `DECISIONS.md`, vì nới là mở rủi ro (nguyên tắc bánh cóc).
