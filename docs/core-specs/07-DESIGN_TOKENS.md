# 07 — DESIGN TOKENS (bước 7: bề mặt và hệ thị giác)

<!-- ═══════════════════════════════════════════════════════════════════
CORE SPEC · Nguồn: nhatrangtravel/project/07-DESIGN_TOKENS.md · Nhóm B (khuôn + dữ liệu site)
Khuôn tái dùng: cấu trúc bộ token, quy tắc "hai accent hai vùng" (hành động vs nội dung),
reduced-motion, quy tắc đổi token (cửa hai chiều vs rebrand), dual-font approach.
⚠️ Bản chất token LÀ ĐỂ MỖI SITE ĐIỀN. Mọi GIÁ TRỊ dưới đây là của nhatrangtravel.
Phần riêng site (tìm 🔧 SITE-SPECIFIC): mọi mã màu, tên font, "triết lý cảnh quan Khánh Hoà".
Phần KHÔNG nhãn (cấu trúc bộ token, quy tắc hai-accent, quy tắc đổi token) = khuôn.
═══════════════════════════════════════════════════════════════════ -->

> Nguồn token duy nhất của dự án: mọi giá trị giao diện trong code phải sinh từ đây, hardcode ngoài nguồn token là vi phạm P6/N7 và bị fitness function chặn (CONTROL_GATES tầng 1). Design đề xuất, chủ dự án duyệt (vai A ở RACI).
>
> 🔧 **SITE-SPECIFIC:** mọi giá trị màu, font, và "triết lý cảnh quan Khánh Hoà" là của nhatrangtravel. Giữ *khung token + quy tắc*; thay *toàn bộ giá trị* theo bản sắc site mới.

- **Trạng thái:** đã duyệt, founder phê chuẩn toàn văn 2026-06-12; bổ sung triết lý cảnh quan Khánh Hoà 2026-06-30
- **Ngày:** soạn và phê chuẩn 2026-06-12   **Người soạn:** Claude Design (qua Cowork)   **Người phê chuẩn:** Lưu Tuấn Vũ
- **Liên quan:** `06-BINDING_MAP.md` đã duyệt (vùng giao diện mà token phục vụ), `00-PROJECT_BRIEF.md` mục 6 (Lighthouse mobile ≥ 90, LCP ≤ 2500 ms, CLS ≤ 0,1, WCAG AA).

## 0. Quyết định nền (founder chốt qua trắc nghiệm 2026-06-12)

1. Hướng màu: xanh biển sâu làm primary, accent cát ấm san hô chỉ dành cho CTA và nhãn giá. Nền màu phục vụ chữ và ảnh, không tranh sân khấu với ảnh thật của Nha Trang; CTA nổi vì là màu ấm duy nhất trên nền lạnh. Bổ sung 2026-06-30: bản sắc Khánh Hoà không chỉ là biển; thiết kế phải cho phép ảnh và motif gợi thêm đồng lúa, đầm phá, chân núi và rừng, nhưng không mở thêm palette brand mới khi chưa rebrand. Loại: xanh ngọc nhiệt đới (giống OTA, contrast khó), trung tính editorial (lạnh, thiếu bản sắc), cam san hô làm primary (mệt mắt khi phủ toàn site).
2. Hệ chữ phase 1.1 (cập nhật 2026-06-29): giữ hai font self-host hiện có để không thêm tải mạng hay font chưa có file. Be Vietnam Pro dùng cho heading/display; Plus Jakarta Sans dùng cho body/UI. Điều chỉnh độ dễ đọc tiếng Việt bằng token: chữ nền lớn hơn, line-height thoáng hơn, bỏ letter-spacing âm, heading bớt nặng. Nếu muốn body chuyển hẳn sang Be Vietnam Pro mềm hơn, cần bổ sung woff2 weight 400/500 trước rồi mới đổi token.
3. Tông bề mặt: bo vừa, card và ảnh 12px, nút và nhãn 8px. Cân giữa thẩm quyền và thân thiện cho site nặng card. Loại: bo nhỏ 2-4px (khô, cứng với ảnh biển), bo lớn 16-24px (trôi về thẩm mỹ OTA).
4. Phạm vi phase 1 (Design tự khóa theo nguyên tắc completeness): không dark mode; không token semantic success/error (site tĩnh không form, thêm khi cần qua cửa hai chiều); không font mono. Thiếu có chủ ý, không phải sót.

## 1. Màu

Mọi cặp màu chữ trên nền dưới đây đã kiểm WCAG AA (≥ 4,5:1 với chữ thường).

| Token | Giá trị | Dùng cho |
|---|---|---|
| color.primary | #0C4A6E | heading, link, nhãn nhánh ở header, viền focus; chữ trắng trên nền này đạt AA |
| color.primary.strong | #082F49 | hover và active của link, nền footer, nền header đậm nếu mockup chọn |
| color.primary.soft | #F0F7FC | nền khối nhấn nhẹ (hỏi đáp, số liệu nhanh, lưu ý an toàn) với chữ text |
| color.accent | #C0392B | san hô — nút CTA đặt, CTA gọi điện; chữ trắng đạt 5.44 (AA) |
| color.accent.strong | #96271A | hover của CTA; chữ nhãn giá trên nền accent.soft |
| color.accent.soft | #FEF2F0 | nền nhãn giá trên card và vùng giá ("từ X, cập nhật [ngày]") |
| color.surface | #FFFFFF | nền trang mặc định — **chủ dự án chốt 2026-08-06, giải DR-003**; `08-QA_CHECKLIST` B4 phải sửa theo |
| color.surface.alt | #F8FAFC | nền xen kẽ khối, nền card trên nền trắng |
| color.sea | #0E7490 | ngọc lam vịnh nông — nhãn tự nhiên, tiện ích, trạng thái thành công; chữ trắng đạt 5.36 (AA) |
| color.sand | #F5A623 | cát biển — nhãn ấm, gạch chân trang trí. **Không dùng làm nền CTA**: tương phản với chữ trắng không đạt AA |
| color.text | #0F172A | chữ chính trên surface và surface.alt |
| color.text.muted | #475569 | mô tả ngắn trên card, ngày cập nhật, nhãn phụ, breadcrumb |
| color.text.inverse | #F8FAFC | chữ trên primary, primary.strong, accent |
| color.border | #E2E8F0 | viền card, viền bảng, kẻ phân vùng |

Quy tắc dùng accent: accent chỉ xuất hiện ở vùng hành động và nhãn giá (binding map 5.1, các vùng giá cộng CTA ở mục 4). Vùng nội dung không dùng accent. Đây là cách giữ luật "không CTA giả" của 06 ở tầng thị giác: thấy màu ấm là có hành động thật.

**Quy tắc cảnh quan biển đảo** (chủ dự án chốt hướng thị giác 2026-08-06, thay quy tắc cảnh quan cũ):

- `color.primary` là **biển sâu** — vai trò tin cậy, heading, link.
- `color.sea` là **vịnh nông** — tự nhiên, tiện ích, trạng thái thành công.
- `color.sand` là **cát** — nhãn ấm và chi tiết trang trí. Không làm nền CTA.
- `color.accent` là **san hô** — chỉ xuất hiện ở vùng hành động và nhãn giá.

**Cấm token và hoạ tiết đất liền.** Không thêm màu hay hoạ tiết gợi ruộng lúa, đồng bằng, núi rừng, đường bình độ. Bản v1 có `--c-land-rice`, `--c-land-forest`, `--pattern-rice-lines`, `--pattern-contour-lines` — đó là bộ nhận diện của một site du lịch Nha Trang nói chung, không phải của một công ty bán tour biển đảo. Đã gỡ (DR-002).

**Nền trang là trắng thuần**, không gradient phủ toàn trang. Ảnh thật của biển và đảo là thứ mang màu; nền phải lùi lại để ảnh nổi lên.

## 2. Chữ

| Token | Giá trị | Dùng cho |
|---|---|---|
| font.family.heading | "Be Vietnam Pro", system-ui, sans-serif | heading mọi cấp |
| font.family.body | "Plus Jakarta Sans", system-ui, -apple-system, sans-serif | body, card, nhãn, breadcrumb, meta, nav |
| font.weight | 500, 600, 700, 800, 900 | body 500; nhãn, nút, nhãn phụ card 600; heading chung 700; display đặc biệt 800/900 khi thật cần |
| font.size.base | 17px (1.0625rem) | body; không nhỏ hơn 17px trên nội dung chính |
| font.size.scale | 1,2-1,25 | bậc thang runtime: 17 / 22 / 26 / 32 / 40 / 42 / 46 |
| font.size.sm | 15px (0.9375rem) | nhãn phụ card, breadcrumb, ngày cập nhật; không nhỏ hơn cỡ này trong UI chính |
| font.size.label | 14px (0.875rem) | nhãn, chip, meta ngắn |
| font.size.badge | 12px (0.75rem) | badge ngắn; không dùng cho đoạn văn |
| line-height | 1,16 heading; 1,68 body | tối ưu đọc tiếng Việt có dấu, tránh dòng quá đặc |
| letter-spacing | 0 | không dùng tracking âm cho heading tiếng Việt |
| measure | tối đa 70ch | cột chữ thân bài Article và đoạn mở; ảnh và bảng được tràn rộng hơn |

Tải font hiện tại: self-host woff2 trên Cloudflare cùng origin. File đang có: Be Vietnam Pro 700/800 và Plus Jakarta Sans 500/600/700, đều có latin + vietnamese subset. `font-display: swap`, preload Be Vietnam Pro 700 và Plus Jakarta Sans 500. Không gọi Google Fonts runtime. Nợ có chủ ý: chưa có Be Vietnam Pro 400/500 nên chưa chuyển body sang Be Vietnam Pro toàn site; thêm font weight mới là thay đổi hiệu năng cần QA LCP.

## 3. Khoảng cách, bo góc, bóng

| Token | Giá trị | Dùng cho |
|---|---|---|
| space.scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px | mọi margin, padding, gap sinh từ thang này |
| space.section | 48 mobile / 96 desktop | nhịp dọc giữa các vùng trang chi tiết |
| container.max | 1200px | khung nội dung; thân bài Article hẹp hơn theo measure 70ch |

| Token | Giá trị | Dùng cho |
|---|---|---|
| radius.sm | 8px | nút, input tìm kiếm nếu có, nhãn giá |
| radius.md | 12px | card, ảnh trong card, gallery, khối nhấn |
| radius.pill | 999px | nhãn phụ card (attractionType, eventType...), nhãn miễn phí |

| Token | Giá trị | Dùng cho |
|---|---|---|
| shadow.card | 0 1px 3px rgba(15, 23, 42, 0.08) | card ở trạng thái nghỉ |
| shadow.raised | 0 4px 12px rgba(15, 23, 42, 0.10) | card hover, khối nổi |
| shadow.overlay | 0 12px 32px rgba(15, 23, 42, 0.16) | menu ngôn ngữ, lớp phủ duy nhất phase 1 |

## 4. Breakpoint

Mobile-first, bốn mốc, min-width:

| Token | Giá trị | Quy tắc co giãn |
|---|---|---|
| bp.sm | 640px | lưới card 1 cột lên 2 cột |
| bp.md | 768px | header gọn chuyển header đầy đủ |
| bp.lg | 1024px | lưới card lên 3 cột; sidebar mục lục Article nếu mockup chọn |
| bp.xl | 1280px | container chạm max 1200px, không thêm cột |

Số cột là quy tắc mặc định cho lưới card 5.1; mockup được chỉnh trong phạm vi mốc này, không thêm mốc mới.

## 5. Chuyển động

| Token | Giá trị | Dùng cho |
|---|---|---|
| motion.fast | 150ms | hover link, nút, card |
| motion.base | 250ms | mở menu ngôn ngữ, accordion hỏi đáp |
| motion.easing | cubic-bezier(0.2, 0, 0, 1) | mọi transition |

Quy tắc: `prefers-reduced-motion: reduce` tắt mọi transition và animation (về 0ms). Cấm animation tự chạy (carousel tự trượt, ảnh nền chuyển động): vừa hại LCP và CLS, vừa vô nghĩa với máy đọc.

## Quy tắc đổi token

Đổi giá trị token là cửa hai chiều (đổi nhanh, có duyệt). Đổi cấu trúc token hoặc thêm hệ màu mới là rebrand, cần chủ dự án phê chuẩn (ARTIFACT_OWNERSHIP).
