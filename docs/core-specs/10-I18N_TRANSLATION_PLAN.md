# 10 — Kế hoạch hoàn thiện i18n và module dịch AI

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Nguồn: nhatrangtravel/project/10-I18N_TRANSLATION_PLAN.md · Nhóm B (khuôn i18n giá trị)
Khuôn tái dùng: object localized {lang} cho field rich kể cả portable text, coalesce fallback
về ngôn ngữ gốc, quy trình di trú an toàn (export mốc lùi → migrate flat→.vi → deploy đồng bộ),
module dịch AI provider-agnostic (DeepSeek/OpenAI/Anthropic) với provenance ai-t1, gate duyệt.
i18n là phần khó nhất của multi-site → khuôn này rất giá trị.
Phần riêng site cần thay (tìm 🔧 SITE-SPECIFIC):
  - 5 ngôn ngữ cứng vi/en/zh/ko/ru, số entity cụ thể, tên file schema, ngày phiên.
Phần KHÔNG nhãn (cơ chế localized, coalesce, quy trình di trú, module dịch) = khuôn.
═══════════════════════════════════════════════════════════════════ -->

> Khung kế hoạch cho việc số 3 của Bước 9 (xem `09-STEP9_PLAN.md` §8): đưa hai thứ vào hệ thống đúng cách, gồm hoàn thiện i18n field-level và module dịch AI. Tài liệu này là khung để sinh ADR, không phải ADR. Chốt qua phỏng vấn trắc nghiệm với founder ngày 2026-06-20.
>
> 🔧 **SITE-SPECIFIC:** bộ 5 ngôn ngữ vi/en/zh/ko/ru là của nhatrangtravel. Giữ *cơ chế i18n + module dịch*; thay *danh sách ngôn ngữ* theo site.

- **Trạng thái:** nháp khung, chờ founder duyệt để tách thành ADR thật và bản ghi `DECISIONS.md`.
- **Người soạn:** Cowork (tác nhân điều phối). **Người duyệt:** Lưu Tuấn Vũ.
- **Kế thừa ràng buộc:** CONSTITUTION v2.2.0 (P1, P3, P4, P6, P11, N1, N5, N7), ADR-0004 (i18n hybrid), `01-CONTENT_MODEL.md` v1.0.1, WORKFLOW (batch + QA gate).

## 0. Một dòng

FAQ tiếng Việt đã chạy xong; việc thật còn lại là hoàn thiện i18n field-level cho các field rich (tiền điều kiện), rồi dựng module dịch AI điền en, zh, ko, ru vào Sanity, qua đúng cổng duyệt.

## 1. Bối cảnh và phát hiện

FAQ không phải việc dựng mới. Field `faq` đã có trong content model và trong schema (mảng question/answer), có hàm serialize `faqPageToLd` xuất FAQPage JSON-LD, có component `FAQ.astro`. Về tính năng, FAQ tiếng Việt coi như xong.

Phát hiện chính (2026-06-20): i18n field-level mới hoàn thiện một phần. Đã là object localized `{vi,en,zh,ko,ru}`:

- `title`, `slug`, `summary`, `seo` (metaTitle, metaDescription) ở mọi entity, định nghĩa tại `cms/schemas/baseFields.ts`.
- `bio`, `jobTitle`, `knowsAbout` của Person, làm trong đợt DOT1 (2026-06-17), định nghĩa tại `cms/schemas/person.ts`.

Còn phẳng một ngôn ngữ trong schema thật, dù content model đánh "dịch được":

- `body`, `faq`, `highlights`, `keyFacts`, `accessInfo`, `safetyNote`, `seasonNote`, `departureNote`, `originNote`, `season`, `includes`, `excludes`, `touristType`, `amenityFeature`, `onSiteActivities`, `licenseInfo`, `beachAccess`, `servesCuisine`, `howTo`.

Tầng GROQ xác nhận: `baseFieldsFragment` đọc `title.${lang}`, `summary.${lang}` theo ngôn ngữ, nhưng `faqFragment`, `bodyFragment`, `highlightsFragment` đọc field phẳng, không theo ngôn ngữ. Nếu chạy dịch ngay, trang ngoại ngữ sẽ có tiêu đề và tóm tắt dịch nhưng thân bài và FAQ vẫn tiếng Việt, vì schema chưa có chỗ chứa.

Đây là vết lệch giữa `01-CONTENT_MODEL.md` (đánh "dịch được") và schema thật (phẳng), cần ghi DRIFT_LOG. Hệ quả: module dịch có tiền điều kiện cứng là mở khuôn chứa đa ngữ trước (P3, không nhảy cóc tầng).

Điểm thuận lợi: cơ chế object localized đã chạy thật cho mọi kiểu field, gồm cả portable text (`bio` của Person). Person là mẫu tham chiếu, nhân ra 12 entity field-level còn lại, không phải phát minh lại.

## 2. Quyết định đã chốt (phỏng vấn trắc nghiệm 2026-06-20)

| # | Quyết định | Chốt | Căn cứ |
|---|---|---|---|
| 1 | Phạm vi "2 thứ" | i18n-completion + module dịch. FAQ vi đã xong, FAQ đa ngữ nằm trong i18n-completion | phát hiện mục 1 |
| 2 | Trình tự | Hai ADR tuần tự: ADR i18n trước, ADR module dịch sau | P1, P3 |
| 3 | Cơ chế lưu đa ngữ | Object localized `{vi,en,zh,ko,ru}`, không plugin | đồng nhất title/summary, errata ADR-0004, P6, P11 |
| 4 | Phạm vi field migrate | Tất cả field dịch được, một đợt migration | hết lệch content model vs schema, ít đụng dữ liệu publish nhiều lần |
| 5 | Nơi bản dịch sống | Điền vào Sanity, có người duyệt | P6, gate I19, provenance ai-t1 |
| 6 | Kích hoạt dịch | Script batch chạy từ máy | hợp nếp seed script, tránh custom action vừa revert (CHECKLIST 2026-06-20) |
| 7 | Cổng duyệt bản dịch | Một `reviewStatus` cho cả document, 5 ngôn ngữ lên cùng | hợp schema hiện tại, founder solo |

## 3. ADR A (nháp): hoàn thiện i18n field-level

Bối cảnh: như mục 1.

Quyết định: chuyển mọi field "dịch được" của 12 entity field-level còn lại sang object localized `{vi,en,zh,ko,ru}`, theo đúng mẫu `baseFields.ts` và `person.ts`. Article giữ document-level i18n (ADR-0004 không đổi, mỗi ngôn ngữ một document, field tự nhiên thuộc ngôn ngữ của document). Category dịch `name`, `description`.

Phạm vi field: lấy từ `cms/lib/i18nConfig.ts` TRANSLATABLE_FIELDS, trừ phần đã localized (title, summary, slug, seo, và bio/jobTitle/knowsAbout của Person). Áp cho 12 entity field-level (TouristDestination, Place, Attraction, Experience, Restaurant, Hotel, Resort, Tour, Organization, Event, Specialty, Category). Không áp Article.

Hệ quả:

- Sửa schema 12 entity: wrap field rich thành object localized.
- GROQ fragments (`faqFragment`, `bodyFragment`, `highlightsFragment`, và tương tự) nhận tham số lang, đọc `field.${lang}` với `coalesce(field.${lang}, field.vi)`. Mẫu coalesce đã có sẵn ở `entityRefFragment`.
- Serialize và component đọc field theo lang.
- Di trú dữ liệu publish (mục 6).
- Kiểm lại các gate I12: field bắt buộc trong gate (vd `summary`) đã localized; field rich phần lớn là "nên có" hoặc "tùy" nên không vỡ gate. Xác nhận từng entity.

Loại quyết định: cửa một chiều (kiến trúc dữ liệu i18n, đụng dữ liệu đã publish). Founder duyệt. Quan hệ ADR-0004: ADR A hiện thực hóa phần field-level cho field rich mà errata ADR-0004 chưa nói chi tiết, không nới lỏng, chỉ làm đủ. Thỏa bánh cóc 9.7.

## 4. ADR B (nháp): module dịch AI

Bối cảnh: sau khi khuôn chứa đa ngữ sẵn sàng, cần điền en, zh, ko, ru.

Quyết định:

- Nguồn dịch: AI qua Claude API (đề xuất, chốt ở mục 7). Provenance bản dịch ai-t1 (Step 9 câu 13).
- Kích hoạt: script batch chạy local. Đọc document có bản vi đã duyệt, gọi API dịch các field localized, ghi vào draft Sanity (cần write token).
- Chèn vào gate: bản dịch nằm trong cùng document, qua một `reviewStatus`. Founder duyệt vi sâu, lướt bản dịch, approve một lần là cả 5 ngôn ngữ lên. Mỗi ngôn ngữ vẫn xuất JSON-LD hợp lệ (I6) ở build.

Hệ quả:

- Thêm thư mục `scripts/translate/` theo nếp seed scripts.
- Cần secret `SANITY_WRITE_TOKEN` và `ANTHROPIC_API_KEY`, founder giữ.
- Không dịch lúc build (đã loại), không lưu bản dịch ở hai nơi (P6, N7).
- Dịch portable text phải bảo toàn cấu trúc block và mark, chỉ dịch text trong span, không làm vỡ structure. Đây là điểm kỹ thuật rủi ro nhất của script, cần test riêng.

Loại quyết định: phần cơ chế phần lớn là cửa hai chiều (đổi provider hoặc script được); phần provenance và gate chạm governance nên ghi DECISIONS.

## 5. Kế hoạch thực thi theo đợt và QA gate

Theo WORKFLOW: mỗi đợt một prompt, QA gate giữa các đợt, prompt đợt sau chỉ sinh khi đợt trước đạt QA.

| Đợt | Nội dung | Cổng đậu |
|---|---|---|
| 0 | Founder duyệt khung này, Cowork tách ADR A, ADR B, ghi DECISIONS + DRIFT_LOG | founder duyệt |
| 1 | ADR A phần code: wrap field 12 entity thành object localized; sửa GROQ, serialize, component đọc `field.${lang}` coalesce về vi. Chưa di trú | astro check 0 lỗi, build xanh, QA agent G2, trang vi không đổi |
| 2 | ADR A phần dữ liệu: script di trú flat sang `.vi` cho document hiện có; test trên export trước, rồi apply cùng deploy schema | dataset audit, trang vi không đổi, trang ngoại ngữ fallback về vi |
| 3 | ADR B thử nghiệm: script dịch một entity (vd một Place cụm Biển & đảo), founder review, publish | JSON-LD 5 ngôn ngữ hợp lệ, review đạt |
| 4 | ADR B diện rộng: batch 5-8 entity mỗi đợt theo thứ tự cụm | mỗi đợt qua completeness + JSON-LD + review |

## 6. Di trú dữ liệu đã publish (N5, cẩn trọng)

Vấn đề: khoảng 10 entity đã publish đang giữ `body`, `faq`, `highlights` phẳng (vi). Schema mới đòi object. Lệch là vỡ cả Studio lẫn build. N5 tuyệt đối với dữ liệu đã phát hành.

Quy trình an toàn:

1. Export dataset (`sanity dataset export`) làm mốc lùi.
2. Viết script di trú: với mỗi document field-level, chuyển field phẳng `X` thành `{ vi: X }` cho mọi field trong phạm vi; chạm cả bản draft lẫn published.
3. Test trên dataset clone hoặc import sang dataset staging, verify.
4. Apply migration cùng deploy schema mới và build đọc-theo-lang trong một cửa sổ, tránh khoảng schema lệch dữ liệu.
5. Verify: trang vi y nguyên; trang en, zh, ko, ru render fallback vi (coalesce), không trống không vỡ.

Coalesce về vi là chốt an toàn: sau di trú nhưng trước khi dịch, trang ngoại ngữ hiện nội dung vi, không gãy.

## 7. Quyết định phụ (đã chốt 2026-06-20)

- Provider dịch: cấu hình được, chuỗi ưu tiên mặc định DeepSeek, rồi OpenAI, rồi Anthropic (Claude). Khớp quyết định ngân sách 2026-06-10 (không khóa cứng một nhà). Cả ba là AI bên thứ ba, đăng ký AI System Registry S2.6 và tuân S2.8.
- Thứ tự ngôn ngữ: dịch cả 4 (en, zh, ko, ru) một lượt mỗi entity.
- Thứ tự entity: theo cụm đang đổ nội dung; trong cụm ưu tiên xương sống GEO (TouristDestination, Place, Attraction) trước nhóm thương mại.
- Rule `contentProvenance`: theo nguồn bản vi. vi do người viết thì document là "mixed"; vi là ai-t1 thì document là "ai-t1".
- Độ sâu review: founder duyệt vi sâu, lướt 4 bản dịch en/zh/ko/ru (Step 9 §3.5).

## 8. Vướng governance cần ghi

- DRIFT_LOG: thêm vết "content model đánh field dịch được nhưng schema để phẳng" (phát hiện 2026-06-20), đóng khi ADR A xong.
- DECISIONS: bản ghi cho ADR A (cơ chế object localized cho field rich, phạm vi, di trú) và ADR B (module dịch, provider, provenance).
- `01-CONTENT_MODEL.md`: không đổi nghĩa field (vẫn "dịch được"), thêm ghi chú cơ chế lưu object localized cho field rich, đồng bộ errata ADR-0004 (P4: spec là nguồn sự thật, kéo schema về spec).
- ADR-0004: ADR A bổ sung chi tiết hiện thực field-level cho field rich, không đổi quyết định gốc hybrid. Trỏ tham chiếu chéo.
- Đối chiếu điều cấm: không bề mặt trước cấu trúc (làm schema trước UI, N1); không phá bất biến publish (di trú có mốc lùi và coalesce, N5); một nguồn sự thật (dịch lưu trong Sanity, không build-time, N7).

## 9. Việc tiếp theo

1. Founder duyệt khung này.
2. Cowork tách ADR A, ADR B (nháp), bản ghi DECISIONS, vết DRIFT_LOG.
3. Founder chốt các quyết định phụ mục 7.
4. Sinh prompt Đợt 1 cho Claude Code theo WORKFLOW.
