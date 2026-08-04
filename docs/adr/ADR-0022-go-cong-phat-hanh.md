# ADR-0022 — Gỡ cổng validator khỏi đường phát hành, đảo ADR-0010 và ADR-0018

<!-- ═══════════ GHI CHÚ CORE (multi-site) ═══════════
Đây là quyết định vận hành RIÊNG của tourdaovn, ngược triết lý fail-closed của Core —
cùng loại với ADR-0019 của nhatrangtravel. Core KHÔNG kế thừa ADR này. Site mới vẫn mặc
định fail-closed theo ADR-0010/0018; site nào muốn gỡ thì tự ghi ADR riêng như file này.
═══════════════════════════════════════════════════ -->

- **Trạng thái:** accepted
- **Ngày:** 2026-08-04   **Người phê chuẩn:** Lưu Tuấn Vũ (founder), chốt trong phiên Cowork 2026-08-04
- **Loại quyết định:** cửa một chiều (mô hình cổng phát hành, cùng lớp quyết định với ADR-0010 và ADR-0018)
- **Supersedes:** ADR-0010 mục 1 và 2; ADR-0018 mục 1 và 2. **Không** đảo ADR-0018 mục 3 (ngưỡng completeness I12 / `checkBodyLength`).
- **Liên quan:** ADR-0008 (reviewStatus là cổng publish), ADR-0009 (auto-deploy), commit `b82cdeb`, `9c358d3`, `f57d65b`, `ddc9441`, `docs/GOI-2-KET-QUA.md` mục 40

## Bối cảnh

Chuỗi sự kiện ngày 2026-08-04 dẫn tới quyết định này:

1. `9c358d3` nới toàn bộ điều kiện bắt buộc sang tuỳ chọn ở **cả hai tầng** — schema Sanity và `scripts/gate.config.ts` — chỉ giữ `title` và `slug`.
2. Build Cloudflare vỡ ở `src/pages/llms.txt.ts`: code hạ nguồn còn giả định `summary` luôn tồn tại, trong khi `compactObject()` xoá hẳn key khi rỗng. Sửa ở `f57d65b`.
3. Rà nguyên nhân gốc phát hiện chuỗi cổng mà README và ADR-0010/0018 mô tả **chưa bao giờ được nối dây**: `.github/workflows/validate.yml` gọi `npm run validate:min` — script không tồn tại trong `scripts/package.json`; `build:ci` thực tế chỉ là `npm run build`. Lỗ hổng này đã được ghi nhận từ GÓI 2 (`docs/GOI-2-KET-QUA.md` mục 40) dưới dạng câu hỏi chờ quyết, chưa ai trả lời.
4. `ddc9441` nối lại chuỗi fail-closed đúng như ADR-0010/0018 đòi, có kiểm chứng hai chiều (thiếu biến → dừng trước build; đủ biến → chạy trọn chuỗi).
5. Sau khi thấy chuỗi hoạt động, founder quyết định không giữ cổng validator trên đường phát hành nữa.

Một dữ kiện phải ghi rõ để ADR này không bị đọc sai về sau: **từ `b82cdeb` (2026-06-29) tới nay, production trên thực tế chưa bao giờ chạy validator.** Cloudflare Pages đặt build command là `npm run build` trong dashboard, đè lên cả `[build] command` của `wrangler.toml`. ADR-0018 khôi phục chuỗi trong `package.json` nhưng không đổi được cấu hình dashboard, nên phần khôi phục đó chưa từng có hiệu lực thật. Quyết định này vì vậy **chốt lại một trạng thái đã tồn tại hai tháng**, không phải tháo một cổng đang vận hành.

## Quyết định

1. `build:ci` (`package.json`) = `npm run build` = `astro check && astro build`. Không validator nào nằm trên đường lên production.
2. **Bỏ** `.github/workflows/validate.yml`. Theo ADR-0010 mục 2, workflow này vốn chỉ là cảnh báo sớm advisory, chưa bao giờ chặn được merge (branch protection bất khả thi trên gói GitHub free + private).
3. **Giữ nguyên toàn bộ validator dưới dạng lệnh gọi tay**: `npm run gate`, `npm run build:strict`, `npm --prefix scripts run validate:min` / `validate:jsonld` / `validate:post`. Gỡ khỏi đường tự động, không xoá năng lực.
4. Không đảo ADR-0018 mục 3: `checkBodyLength`, `MIN_BODY_CHARS`, `BODY_GATED_TYPES` giữ nguyên. Đó là ngưỡng completeness ở tầng dữ liệu, độc lập với chỗ đặt cổng.
5. `reviewStatus == "approved"` trong Sanity (ADR-0008) trở thành cổng duyệt nội dung tự động **duy nhất** còn hiệu lực.

## Lý do

- **Cổng đang chặn nhầm chỗ.** Hai lần deploy vỡ gần nhất đều do code hạ nguồn giả định sai về hình dạng dữ liệu, không phải do dữ liệu sai. Validator V2/V3 đọc Sanity không bắt được loại lỗi đó — thứ bắt được nó là kiểu dữ liệu trung thực trong `src/lib`, không phải cổng CI.
- **Chi phí vận hành thật.** Cổng đòi `SANITY_STUDIO_PROJECT_ID` và `SANITY_READ_TOKEN` đồng bộ ở ba nơi (Cloudflare, GitHub variables/secrets, máy local). Thiếu một chỗ thì hoặc job đỏ, hoặc tệ hơn là PASS giả — `scripts/synthesis/config.ts` có default cứng `'lmgxynxp'` nên cổng lặng lẽ soi nhầm project rồi báo xanh.
- **Cổng tồn tại trên giấy suốt hai tháng mà không ai phát hiện**, kể cả qua một đợt audit và một gói công việc. Bản thân dữ kiện đó cho thấy nó không phải thứ vận hành đang thật sự dựa vào.
- Site một người vận hành, tần suất publish thấp, rollback rẻ (Cloudflare giữ bản build cũ, đổi lại bằng một cú click).

## Phương án đã loại

- **Giữ cổng, chỉ đặt đủ biến môi trường cho hết đỏ**: loại — founder không muốn cổng chặn phát hành. Đây đúng là lý do đã dẫn tới `b82cdeb` lần trước; lần này ghi thành ADR thay vì một dòng trong `DECISIONS.md`.
- **Giữ cổng ở Cloudflare, chỉ bỏ ở GitHub**: loại — GitHub vốn advisory nên bỏ nó không giải quyết gì; giữ Cloudflare thì vẫn nguyên chi phí đồng bộ biến môi trường.
- **Gỡ mà không ghi ADR** (sửa README cho khớp là đủ): loại — đảo một quyết định cửa-một-chiều bằng một dòng chat là đúng sai lầm mà ADR-0018 đã phải đứng ra sửa. Xem CONSTITUTION P5 + N3.

## Hệ quả

- **Tích cực:** phát hành không bị chặn bởi hạ tầng validator chưa nối đủ; hết job đỏ trên Actions; bớt ba chỗ phải giữ biến môi trường đồng bộ; tài liệu thôi mô tả một cổng không tồn tại.
- **Đánh đổi (ghi thẳng, không giảm nhẹ):** đây là đảo lại đúng thứ mà `AUDIT_MERGED-2026-07-06.md` xếp điểm cao nhất (P3·H1 — *"đây là gốc khiến mọi lỗi khác không bị chặn"*). Từ nay dữ liệu sai hoặc thiếu field sẽ lên production và chỉ lộ ra khi có người xem, hoặc khi build vỡ như `llms.txt`.
- **Rủi ro tồn dư đã biết:** các field vừa nới ở `9c358d3` (`mainImage`, `author`, `body`, `itinerary`, `operator`, `venue`, `containedInPlace`, `officialSource`, `sameAs`, `bio`) có thể còn chỗ deref thẳng trong template. Cùng một cơ chế đã làm vỡ `llms.txt` có thể lặp lại. Không còn cổng tự động nào bắt trước — phải rà tay, và `npm run gate` vẫn gọi được để rà.
- **Muốn quay lại:** `git revert` ADR này cùng commit đi kèm, và đổi build command trên Cloudflare Pages về `npm run build:ci`. Bước thứ hai bắt buộc — thiếu nó thì chuỗi trong `package.json` lại chỉ nằm trên giấy như hai tháng vừa rồi.
