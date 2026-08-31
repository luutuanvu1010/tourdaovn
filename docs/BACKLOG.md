# BACKLOG — ý tưởng và nợ kỹ thuật

> Sổ gom việc **chưa** có spec và **chưa** ai cam kết làm. Khác ba sổ đã có:
> `DECISIONS.md` ghi việc đã quyết, `DRIFT_LOG.md` ghi chỗ hai tài liệu lệch nhau,
> `docs/specs/` ghi việc đã đặc tả xong. Vào đây là thứ biết rồi nhưng chưa tới lượt.
>
> **Luật:** mỗi mục phải có **bằng chứng** (file:dòng, hoặc lệnh và kết quả). Không ghi cảm giác.
> Mục nào lên spec thì xoá khỏi đây và trỏ sang spec.

Mã: `B-<số>`. Trạng thái: `mở` · `đang làm` · `đã đóng`.

---

## Nợ kỹ thuật

### B-001 — `html.ts` viết cứng sáu mã màu và một cỡ chữ · `mở`

`src/lib/booking/html.ts:7` `#0C4A6E`/`#96271A`, `:9` `#F8FAFC`/`#0F172A`, `:10` `#fff`/`#E2E8F0`,
`:11` `font-size:22px`. Vi phạm luật `ADR-0030` §4 (`:170`): cấm mã màu **và cỡ chữ** viết cứng.

Nặng hơn trùng lặp: hai mã ở `:7` chỉ bằng `--c-primary`/`--c-accent-strong` **với bộ token mặc
định**. `src/styles/tokens.css` có hai bộ đè (`:204`/`:209`, `:223`/`:228`) — nên trang này
**sai màu** khi site đổi bộ token, không chỉ lặp.

### B-002 — `notify/format.ts` viết cứng cỡ chữ và font · `mở`

`src/lib/booking/notify/format.ts:75` `font-size:15px`, `font-family:system-ui,sans-serif`.
**Không có mã màu nào** — nợ ở đây khác loại với `B-001`. Cùng luật `ADR-0030` §4.

`B-001` và `B-002` là thứ `ADR-0030` §4 gọi là *"lớp 2 — bề mặt"*, và ADR đó xếp nó **trước** mã
QR trong thứ tự thi công. Đợt QR (`SPEC-2026-08-31`) đã vượt hàng và ghi nhận là không trả nợ.

### B-003 — `summary.total` của đơn trùng là tổng lần nộp MỚI, kèm mã đơn CŨ · `mở`

`src/lib/booking/handler.ts:211–213`: nhánh `if (dup)` trả `code: dup` (mã cũ) nhưng
`summary: { …, total: v.quoted.total }` (payload vừa nộp). Đường không-JS lộ trực tiếp hơn:
`lines: summaryLines(v, dup)` in `Tạm tính: <tổng mới>` ngay dưới mã cũ.

`ADR-0031:191–202` đã ghi sẵn khoản nợ này. `SPEC-2026-08-31` §4.5 chỉ **tránh** (đơn trùng không
dựng QR, không in dòng tiền), **không sửa gốc**. Sửa gốc = `handler.ts` đọc lại đơn cũ từ D1.

### B-004 — `BK1`–`BK5` không có validator máy nào · `mở`

`grep -rn "BK1\|BK2\|BK3\|BK4\|BK5" scripts/` → **0 kết quả**.
`docs/governance/control-registry.yaml` **không có dòng `BK` nào** (chỉ `I1–I21`, `PY1–PY8`,
`R1–R4`). `04-CONSTRAINTS.md:98` tự thừa nhận: *"Chưa có dòng trong control-registry.yaml vì
chưa có executor script"*.

Nghĩa là năm ràng buộc **mức fail** của module đặt tour hiện được canh bằng *"`grep` trong QA2
cộng review"* (`04-CONSTRAINTS.md:92`) — tức bằng người, mỗi lần một khác.

### B-005 — `05-URL_MAP` §2 khẳng định hệ không có DB nào ngoài Sanity và `prices.yaml` · `mở`

`docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md:130` nguyên văn: *"Không có DB nào khác: hai nguồn
duy nhất của hệ là Sanity dataset và `prices.yaml` (P6, S2.7)."* Sai từ `ADR-0027` — D1
`tourdao-booking` có thật, đang chạy production. File đó không có mục nào về bảng `booking`.

Sửa đúng cách là **đảo một phát biểu P6/S2.7**, phạm vi lớn hơn một dòng. Cần ghi `DR-` trong
`DRIFT_LOG.md` trước, rồi quyết ở tầng ADR.

### B-006 — Chuỗi token Zalo OA đứt nếu 3 tháng không có đơn nào · `mở`

`refresh_token` sống 3 tháng và **dùng được đúng một lần**; `SPEC-2026-08-31` §4.7 làm mới
**lười** (chỉ khi có đơn). Không có đơn suốt 3 tháng thì ZNS chết **im lặng**.

Cách chặn: Cron Trigger làm mới hằng ngày. Vướng: adapter Astro tự xuất `default` cho Worker nên
gắn `scheduled` phải bọc một lớp quanh `dist/_worker.js/index.js`. Chủ dự án **chốt chấp nhận
rủi ro** trong đợt này (`SPEC-2026-08-31` §9).

---

## Việc đã có quyết định, chưa tới lượt

### B-007 — Bảng điều khiển đơn đặt trong Sanity Studio · `mở`

`ADR-0030` §2, đã phê chuẩn 2026-08-30, chưa thi công. Hiện xem đơn phải gõ
`wrangler d1 execute`. Truy vấn *"đơn chưa báo được"* có trong `SPEC-2026-08-21-dat-tour` §4.6
nhưng **chưa ai từng chạy** — không cơ chế nào phát hiện đơn không tới tay ai.

Cấp thiết hơn sau đợt QR: `SPEC-2026-08-31` thêm hai cột `notify_customer_email`, `notify_zns`,
và cả `B-006` lẫn `B-003` đều lấy bảng này làm nơi quan sát.

### B-008 — Sinh token cho thư từ một nguồn `tokens.css` · `mở`

`ADR-0030` §4. Là điều kiện `B-001` và `B-002` cần để trả nợ mà không tạo nguồn thứ hai.

---

## Cần xác nhận, không phải làm

### B-009 — Nghiệm thu tay ưu đãi thanh toán trước · `mở`

`SPEC-2026-08-30-uu-dai-thanh-toan-truoc` §7 đòi nghiệm thu tay; **không tìm thấy dấu vết ai đã
làm**. Tính năng đã BẬT thật trên production (đo 2026-08-31: HTML trang tour có
`Chuyển khoản trước — giảm 5%`). Không có test tự động nào chạm tầng giao diện của nó.

### B-010 — Khoá gọi ZNS: `templateId` hay `template_id` · `mở`

Hai kiểu cùng lưu hành trong tài liệu Zalo (ZBS Template Message API dùng camelCase; ZNS v2 cũ
dùng snake_case). Kiểm bằng **một lời gọi thật** lúc đăng ký mẫu, mất 5 phút. Ghi ở
`SPEC-2026-08-31` §4.7 như chỗ duy nhất chấp nhận xác nhận muộn.
