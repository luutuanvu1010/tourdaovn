# Core specs — đặc tả gốc lấy từ nhatrangtravel

Thư mục này chứa các tài liệu đặc tả **đã điền, đã nghiên cứu kỹ** ở dự án gốc
nhatrangtravel, đưa vào Core làm gốc để dựng site du lịch mới. Khác với
`playbook/templates/` (bản rỗng chờ điền), đây là bản **có nội dung thật** — dùng làm
mẫu tham chiếu chất lượng cao.

## Quan hệ với các lớp khác

- `playbook/` — lớp luật chung (Hiến pháp, GOVERNANCE, quy trình). Bất biến, chỉ-đọc.
- `playbook/templates/` — khuôn rỗng theo 9 bước. Dùng khi muốn viết đặc tả từ đầu.
- `docs/core-specs/` (thư mục này) — đặc tả đã điền của nhatrangtravel, đã đánh dấu phần
  riêng site. Dùng khi muốn kế thừa cả nội dung, không viết lại từ số không.
- `docs/adr/` — quyết định kiến trúc của lớp engine code.

## Quy ước nhãn

Nội dung được giữ **nguyên đầy đủ** (kể cả ví dụ Nha Trang, vì ví dụ thật giúp hiểu).
Chỗ nào **riêng của nhatrangtravel, cần thay khi dựng site mới** thì đánh dấu:

> 🔧 **SITE-SPECIFIC:** [mô tả cái cần thay cho site mới]

Khi copy Core đi dựng site mới: đọc lướt tìm mọi nhãn `SITE-SPECIFIC`, thay bằng dữ liệu
của site mình. Phần không có nhãn là khuôn tái dùng, giữ nguyên.

Mỗi file có một **header Core** ở đầu ghi: nguồn, mức tái dùng (A/B), và tóm tắt phần
riêng site cần lược.

## Phân nhóm (theo mức tái dùng)

**Nhóm A — tái dùng cao, phần riêng rất mỏng:**

- `02-SAD.md` — kiến trúc seam giá một chiều (Sanity nội dung + prices.yaml giá).
- `04-CONSTRAINTS.md` — luật hệ thống máy-kiểm-được (validator I/PY/R, ngưỡng, bánh cóc).
- `08-QA_CHECKLIST.md` — spec cổng QA (audit binding/token/schema/interactive).
- `08-SCHEMA_PLAN.md` — blueprint dịch content-model sang schema Sanity.

**Nhóm B — khuôn mạnh nhưng trộn dữ liệu site, đánh dấu kỹ:**

- `01-CONTENT_MODEL.md` — mô hình entity/field, gate completeness, 19 bất biến.
- `05-URL_MAP-and-DB_SCHEMA.md` — cây URL i18n, slug/redirect/hreflang.
- `06-BINDING_MAP.md` — ánh xạ vùng giao diện → field dữ liệu.
- `10-I18N_TRANSLATION_PLAN.md` — i18n field-level + module dịch AI.
- `00-PROJECT_BRIEF.md` — khuôn PR-FAQ định vị dự án.
- `07-DESIGN_TOKENS.md` — khung design token (giá trị để mỗi site tự điền).
- `DESIGN_PATTERNS.md` — catalog pattern UI có code thật.

**Để lại (không đưa vào, quá riêng):** `DESIGN.md` (bản sắc Nha Trang), các file
`AUDIT_*`, `HOMEPAGE_*`, `LOOP-*`, `*EVIDENCE*`, `DRIFT_LOG` (log phiên).
