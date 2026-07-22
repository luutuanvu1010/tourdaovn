# ADR-0013 — Hoàn thiện i18n field-level cho field rich (object localized)

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
ADR gốc, bất biến — KHÔNG sửa nội dung.
ENGINE: "object localized thuần, không plugin" cho field rich kể cả portable text.
CẦN TỔNG QUÁT HÓA: danh sách 12 entity + tập 5 ngôn ngữ là của nhatrangtravel. Trong
  Core, danh sách entity theo cấu hình module, tập ngôn ngữ theo tham số địa phương. Xem ADR-0020.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** accepted (founder phê chuẩn 2026-06-20)
- **Ngày:** 2026-06-20   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa một chiều (kiến trúc dữ liệu i18n, đụng dữ liệu đã publish)
- **Liên quan:** ADR-0004 (i18n hybrid), `01-CONTENT_MODEL.md` §2.0 và cột "dịch được", `10-I18N_TRANSLATION_PLAN.md`, P3, P4, P6, P11, N1, N5

## Bối cảnh

i18n field-level mới hoàn thiện một phần. Đã là object localized `{vi,en,zh,ko,ru}`: `title`, `slug`, `summary`, `seo` (định nghĩa ở `cms/schemas/baseFields.ts`) trên mọi entity, và `bio`, `jobTitle`, `knowsAbout` của Person (đợt DOT1, `cms/schemas/person.ts`).

Còn phẳng một ngôn ngữ trong schema thật, dù `01-CONTENT_MODEL.md` đánh "dịch được": `body`, `faq`, `highlights`, `keyFacts`, `accessInfo`, `safetyNote`, `seasonNote`, `departureNote`, `originNote`, `season`, `includes`, `excludes`, `touristType`, `amenityFeature`, `businessFacilities`, `onSiteActivities`, `licenseInfo`, `beachAccess`, `servesCuisine`, `howTo`. Tầng GROQ đọc các field này phẳng (`faqFragment`, `bodyFragment`, `highlightsFragment`), không theo ngôn ngữ.

Đây là vết lệch giữa content model và schema thật, đã ghi DRIFT_LOG (2026-06-20). Nó là tiền điều kiện cứng của module dịch (ADR-0014): chưa mở khuôn chứa thì không có chỗ điền en, zh, ko, ru. Theo P3, phải làm tầng cấu trúc này trước, không nhảy cóc.

## Quyết định

Chuyển mọi field "dịch được" còn phẳng của 12 entity field-level (TouristDestination, Place, Attraction, Experience, Restaurant, Hotel, Resort, Tour, Organization, Event, Specialty, Category) sang object localized `{vi,en,zh,ko,ru}`, theo đúng mẫu `baseFields.ts` và `person.ts`. Article giữ document-level i18n, ADR-0004 không đổi. Không dùng plugin.

## Lý do

- Một cơ chế duy nhất cho mọi field, dễ nhớ và dễ bảo trì (P6, P11).
- Mẫu object localized đã chạy thật cho cả string, mảng string và portable text (Person, đợt DOT1), nên không có rủi ro công nghệ mới.
- Đúng errata ADR-0004 đã chốt: "object localized thuần `{vi,en,zh,ko,ru}`, không dùng plugin".
- Không thêm phụ thuộc, tránh lặp lại sự cố ERESOLVE từng gặp với `@sanity/language-filter`.

## Phương án bị loại

- Plugin `@sanity/internationalized-array`: thêm phụ thuộc ngoài; tạo hai cơ chế song song (title kiểu object, body kiểu plugin) trừ khi migrate luôn title và summary; đi ngược errata ADR-0004.
- Hỗn hợp theo loại field (field ngắn dùng object, body dùng cơ chế khác): nhiều cơ chế, khó bảo trì, ngược P6 và P11.
- Dịch lúc build, không lưu vào schema: thuộc phạm vi ADR-0014, đã loại vì ngược governance (không duyệt được, không qua I19).

## Hệ quả

- Sửa schema 12 entity field-level: wrap field rich thành object localized `{vi,en,zh,ko,ru}`.
- GROQ fragments nhận tham số lang, đọc `field.${lang}` với `coalesce(field.${lang}, field.vi)`. Mẫu coalesce đã có ở `entityRefFragment`.
- Serialize và component đọc field theo lang.
- Di trú dữ liệu đã publish: chuyển field phẳng `X` thành `{ vi: X }`, có mốc lùi bằng dataset export, test trên staging, apply cùng deploy schema trong một cửa sổ (N5). Coalesce về vi giữ trang ngoại ngữ không gãy trước khi có bản dịch.
- Kiểm gate I12 từng entity: field bắt buộc trong gate (như `summary`) đã localized; field rich phần lớn là "nên có" hoặc "tùy" nên không vỡ gate. Xác nhận từng entity.
- Cập nhật `01-CONTENT_MODEL.md` ghi chú cơ chế lưu object localized cho field rich (P4: kéo spec và schema về một mối). Đóng vết DRIFT_LOG khi xong.
- Mở đường cho ADR-0014 (module dịch AI) chạy trên nền này.
- Quan hệ ADR-0004: ADR này hiện thực hóa phần field-level cho field rich mà errata ADR-0004 chưa nói chi tiết, không nới lỏng, chỉ làm đủ. Thỏa bánh cóc 9.7.
