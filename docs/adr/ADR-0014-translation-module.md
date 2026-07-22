# ADR-0014 — Module dịch AI điền bản dịch vào Sanity

- **Trạng thái:** accepted (founder phê chuẩn 2026-06-20; 5 quyết định phụ đã chốt)
- **Ngày:** 2026-06-20   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Loại quyết định:** phần cơ chế là cửa hai chiều (đổi provider hoặc script được); phần provenance và cổng duyệt chạm governance nên ghi DECISIONS
- **Liên quan:** ADR-0013 (tiền điều kiện), ADR-0004, `09-STEP9_PLAN.md` §3.5, `10-I18N_TRANSLATION_PLAN.md`, I6, I19, P6, N7

## Bối cảnh

Sau khi ADR-0013 mở khuôn chứa đa ngữ cho field rich, cần điền nội dung en, zh, ko, ru. Founder chốt dịch cả 5 ngôn ngữ bằng AI (Step 9 câu 15), provenance mặc định ai-t1 (câu 13). Cần một module dịch riêng tuân thủ governance, không phá một nguồn sự thật.

## Quyết định

- AI điền bản dịch vào chính document Sanity (lưu lại, duyệt được), không dịch lúc build.
- Kích hoạt bằng script batch chạy local: đọc document có bản vi đã duyệt, gọi AI dịch các field localized, ghi vào draft Sanity.
- Một `reviewStatus` cho cả document: founder duyệt vi sâu, lướt bản dịch, approve một lần là cả 5 ngôn ngữ lên cùng.
- Provider cấu hình được, chuỗi ưu tiên mặc định DeepSeek, rồi OpenAI, rồi Anthropic (Claude). Mỗi entity dịch cả en, zh, ko, ru trong một lượt.

## Lý do

- Bản dịch là nội dung thật, giữ một nguồn sự thật trong Sanity (P6, N7), qua đúng cổng duyệt I19 và JSON-LD I6, truy vết provenance được.
- Script batch hợp nếp seed script sẵn có và workflow batch 5-8 entity mỗi đợt, tránh vùng custom document action vừa revert vì Sanity v6 còn vướng.
- Một cổng cho mỗi document hợp schema hiện tại (`reviewStatus` là field shared) và phù hợp founder solo.

## Phương án bị loại

- Dịch lúc build, không lưu: bản dịch không duyệt được, không qua I19, build chậm và tốn phí mỗi lần, không truy vết provenance. Ngược governance.
- Nút dịch trong Studio: đụng vùng custom document action vừa revert (Sanity v6), rủi ro hơn script chạy ngoài.
- Tự động qua webhook khi vi chuyển approved: thêm hạ tầng (worker hoặc endpoint), khó kiểm soát chi phí và thời điểm, thêm một điểm hỏng.
- Tách trạng thái duyệt theo ngôn ngữ: đổi schema quản trị, validator I19 phức tạp hơn, nặng cho một người.

## Hệ quả

- Thêm thư mục `scripts/translate/` theo nếp seed scripts. Cần secret `SANITY_WRITE_TOKEN` và `ANTHROPIC_API_KEY`, founder giữ.
- Dịch portable text phải bảo toàn cấu trúc block và mark, chỉ dịch text trong span. Đây là điểm kỹ thuật rủi ro nhất, cần test riêng.
- Mỗi ngôn ngữ vẫn qua completeness và JSON-LD hợp lệ trước publish.
- Quyết định phụ đã chốt 2026-06-20: provider cấu hình được, mặc định DeepSeek rồi OpenAI rồi Anthropic; dịch cả 4 ngôn ngữ một lượt mỗi entity; thứ tự entity theo cụm đang làm, xương sống GEO (TouristDestination, Place, Attraction) trước; `contentProvenance` theo nguồn bản vi (vi người viết là mixed, vi ai-t1 là ai-t1); review sâu vi, lướt 4 bản dịch (Step 9 §3.5).
- Cả ba provider là AI bên thứ ba, phải đăng ký AI System Registry (S2.6) và tuân S2.8. Nội dung public nên không vướng dữ liệu nhạy cảm.
