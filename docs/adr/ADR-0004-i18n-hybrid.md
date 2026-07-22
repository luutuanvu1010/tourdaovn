# ADR-0004 — Kiến trúc i18n hybrid

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
ADR gốc, bất biến — KHÔNG sửa nội dung.
ENGINE: nguyên tắc hybrid (field-level cho entity dữ liệu, document-level cho Article),
  cơ chế object localized, coalesce fallback.
CẦN TỔNG QUÁT HÓA: tập 5 ngôn ngữ {vi,en,zh,ko,ru} là của nhatrangtravel. Trong Core,
  tập ngôn ngữ là THAM SỐ ĐỊA PHƯƠNG do site config cấp (Singapore = en/zh; Đà Nẵng =
  vi/en/ko...). Xem ADR-0020.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** accepted, phê chuẩn 2026-06-10
- **Ngày:** 2026-06-10   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Loại quyết định:** cửa một chiều (kiến trúc dữ liệu i18n)
- **Liên quan:** PROJECT_OVERLAY S2.5, `01-CONTENT_MODEL.md`, P6, N7

## Bối cảnh

Overlay S2.5 chốt i18n document-level cho mọi entity. Tài liệu Sanity xác nhận document-level buộc nhân bản mọi field qua từng ngôn ngữ, nguyên văn "không có lựa chọn nào khác ngoài localize tất cả field". Nghĩa là field bất biến theo ngôn ngữ (geo, sameAs, containedInPlace, priceRef) bị chép năm bản cho năm ngôn ngữ, sửa một chỗ phải sửa năm, chắc chắn lệch. Đây là hai nguồn sự thật, phạm P6 và N7. Founder yêu cầu phân tích kỹ trước khi chốt.

## Quyết định

Hybrid theo entity:
- Entity nặng dữ liệu (Place, TouristDestination, Hotel, Resort, Attraction, Experience, Restaurant, Transfer, Tour, Event, Person, Organization, Specialty, Category) dùng field-level i18n: một doc mỗi entity, field bất biến lưu một lần, chỉ field chữ (title, summary, body, seo) mang nhiều ngôn ngữ.
- Article dùng document-level i18n: mỗi ngôn ngữ một doc, vì nội dung khác nhau toàn phần và cần xuất bản độc lập từng ngôn ngữ.
- Cả hai vẫn ra URL theo prefix ngôn ngữ và hreflang đầy đủ, vì site build tĩnh bằng Astro render một doc thành nhiều trang ngôn ngữ.

## Lý do

- P6 và N7: field bất biến chỉ tồn tại một nguồn ở field-level, hết nhân bản.
- Founder solo: field-level cho một doc mỗi entity thay vì năm, ít chỗ sửa, nhẹ bảo trì.
- Build tĩnh: nỗi lo field-level mất URL hay hreflang không xảy ra.
- Article hợp document-level vì content-heavy và workflow dịch sau, xuất bản tiếng Việt trước.

## Phương án bị loại

- Document-level đồng nhất (overlay cũ): phạm P6 vì nhân bản field bất biến.
- Document-level cộng core đồng nhất: P6 đạt nhưng nhiều doc nhất (1 core cộng 5 ngôn ngữ) và GROQ phải join, không hợp người làm một mình.
- Field-level đồng nhất cho cả Article: một cơ chế nhưng Article dài hơi nằm trong field đa ngôn ngữ thì cồng kềnh khi biên tập.

## Hệ quả

- Cài hai plugin Sanity: internationalized-array cho field-level, document-internationalization cho Article.
- Mỗi bảng entity trong content model thêm cột "dịch được" để khai field nào dịch, field nào bất biến.
- Sửa overlay S2.5 từ document-level thuần sang hybrid.
- translationGroup chỉ áp cho nhóm document-level (Article); ở field-level các bản dịch nằm trong cùng doc.
- Bản dịch bằng AI vẫn tối thiểu T1, người duyệt trước khi phát hành (S2.5 giữ nguyên).

## Đính chính 2026-06-16 (errata, không đổi quyết định gốc)

Dòng đầu §Hệ quả ("Cài hai plugin Sanity: internationalized-array cho field-level...") là dự đoán hiện thực SAI, đánh dấu **superseded**. Cơ chế field-level thực tế đang chạy là **object localized thuần `{vi,en,zh,ko,ru}`** định nghĩa ở `cms/schemas/baseFields.ts`, KHÔNG dùng plugin `internationalized-array` (chưa từng cài). Plugin UX là `@sanity/language-filter`. Phần `documentInternationalization` cho Article vẫn đúng. Quyết định gốc (hybrid: field-level cho entity, document-level cho Article) KHÔNG đổi. Nguồn: AF-05 (AUDIT_REPORT-2026-06-16), khớp CONTENT_MODEL §2.2. Founder duyệt 2026-06-16.
