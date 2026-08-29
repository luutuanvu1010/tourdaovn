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
| color.primary.soft | **#DCEBF6** | nền khối nhấn nhẹ (hỏi đáp, số liệu nhanh, lưu ý an toàn) với chữ text. **v2026-08-25 (`QĐ-2026-08-25-04`): đẩy ra xa trắng, từ #F0F7FC** |
| color.accent | #C0392B | san hô — nút CTA đặt, CTA gọi điện; chữ trắng đạt 5.44 (AA) |
| color.accent.strong | #96271A | hover của CTA; chữ nhãn giá trên nền accent.soft |
| color.accent.soft | #FEF2F0 | nền nhãn giá trên card và vùng giá ("từ X, cập nhật [ngày]") |
| color.surface | #FFFFFF | nền trang mặc định — **chủ dự án chốt 2026-08-06, giải DR-003**; `08-QA_CHECKLIST` B4 phải sửa theo |
| color.surface.alt | **#EAF2F8** | nền xen kẽ khối, nền card trên nền trắng. **v2026-08-25 (`QĐ-2026-08-25-04`): từ #F8FAFC.** Giá trị cũ chỉ cách nền trắng **1,046** nên khối xen kẽ đọc thành một mảng trắng liền — đúng bệnh "thiếu diện tích màu" mà §1 mô tả. Nay **1,132** |
| color.sea | #0E7490 | ngọc lam vịnh nông — nhãn tự nhiên, tiện ích, trạng thái thành công; chữ trắng đạt 5.36 (AA) |
| color.sand | #F5A623 | cát biển — nhãn ấm, gạch chân trang trí. **Không dùng làm nền CTA**: phân vai màu — `color.accent` đã giữ vai CTA và nhãn giá, cát giữ vai gạch chân và nút trên nền đậm; cho cát thêm vai CTA là một màu hai vai (`QĐ-2026-08-29-06`, sửa lý do — điều khoản giữ nguyên; số đo được: `--c-text-inverse` trên `--c-sand` chỉ **3,28:1**, dưới AA — xem `HomeStatsBand.astro:38-39`) |
| color.text | #0F172A | chữ chính trên surface và surface.alt |
| color.text.muted | #475569 | mô tả ngắn trên card, ngày cập nhật, nhãn phụ, breadcrumb |
| color.text.inverse | #F8FAFC | chữ trên primary, primary.strong, accent |
| color.border | **#D3E1EC** | viền card, viền bảng, kẻ phân vùng. **v2026-08-25 (`QĐ-2026-08-25-04`): từ #E2E8F0**, nhuốm cùng sắc với nền phụ mới |

Quy tắc dùng accent: accent chỉ xuất hiện ở vùng hành động và nhãn giá (binding map 5.1, các vùng giá cộng CTA ở mục 4). Vùng nội dung không dùng accent. Đây là cách giữ luật "không CTA giả" của 06 ở tầng thị giác: thấy màu ấm là có hành động thật.

**Quy tắc cảnh quan biển đảo** (chủ dự án chốt hướng thị giác 2026-08-06, thay quy tắc cảnh quan cũ):

- `color.primary` là **biển sâu** — vai trò tin cậy, heading, link.
- `color.sea` là **vịnh nông** — tự nhiên, tiện ích, trạng thái thành công.
- `color.sand` là **cát** — nhãn ấm và chi tiết trang trí. Không làm nền CTA.
- `color.accent` là **san hô** — chỉ xuất hiện ở vùng hành động và nhãn giá.

**Cấm token và hoạ tiết đất liền.** Không thêm màu hay hoạ tiết gợi ruộng lúa, đồng bằng, núi rừng, đường bình độ. Bản v1 có `--c-land-rice`, `--c-land-forest`, `--pattern-rice-lines`, `--pattern-contour-lines` — đó là bộ nhận diện của một site du lịch Nha Trang nói chung, không phải của một công ty bán tour biển đảo. Đã gỡ (DR-002).

**Nền trang là trắng thuần**, không gradient phủ toàn trang. Ảnh thật của biển và đảo là thứ mang màu; nền phải lùi lại để ảnh nổi lên.

## 1b. Bộ giao diện chọn được (thêm 2026-08-06)

Chủ dự án chọn bộ đang bật trong Sanity Studio (`siteSettings.theme`). **Studio chỉ chọn, không nhập giá trị màu** — nên đây vẫn là một nguồn sự thật: bảng dưới đây.

Mỗi bộ đổi bốn token màu gốc **cộng ba nền phụ** (`QĐ-2026-08-25-04`); toàn bộ chữ, khoảng cách, bo góc, bóng giữ nguyên. Đổi bộ là đổi tông, không phải đổi hệ thống.

| Bộ | `surface` | `primary` | `accent` | `text` | Cảm giác |
|---|---|---|---|---|---|
| `bien-sau` **(mặc định)** | #FFFFFF | #0C4A6E | #C0392B | #0F172A | biển sâu, trắng sạch |
| `cat-bien` | #FDFAF5 | #155E75 | #B45309 | #1C1917 | cát ấm, nắng chiều |
| `ngoc-lam` | #FFFFFF | #0F766E | #BE123C | #0F172A | nước nông, trong |

**Ba nền phụ, thêm 2026-08-25 (`QĐ-2026-08-25-04`).** Trước đó chỉ `:root` khai chúng, nên `cat-bien` và `ngoc-lam` **thừa hưởng nền phụ của `bien-sau`** — và với `cat-bien` thì đó là một nền xám **lạnh** đứng cạnh nền kem **ấm**, chỉ cách nhau **1,005**. Khối xen kẽ ở bộ đó gần như không tồn tại về mặt thị giác. Nay mỗi bộ tự khai, nhuốm đúng sắc của chính nó:

| Bộ | `surface.alt` | `primary.soft` | `border` | Tách nền chính↔phụ |
|---|---|---|---|---|
| `bien-sau` | #EAF2F8 | #DCEBF6 | #D3E1EC | 1,046 → **1,132** |
| `cat-bien` | #F5EDE0 | #E4EEF1 | #E7DCC9 | **1,005 → 1,116** |
| `ngoc-lam` | #E8F4F2 | #D6EBE8 | #CFE3E0 | 1,046 → **1,126** |

Không thêm một mã brand nào: `primary`, `accent`, `sand`, chữ đều giữ nguyên. Đây là chữa **diện tích màu** (§1 "Bệnh đã chữa và đừng tái phát"), không phải mở bảng màu.

Chữ trên nền phụ mới, đo lại — hai cặp này **nằm ngoài** bốn cặp mà `check-theme-contrast.mjs` chấm, thêm ở đây vì đề xuất đụng đúng nền đó: `bien-sau` 15,77 / 6,70 · `cat-bien` 15,05 / 6,57 · `ngoc-lam` 15,86 / 6,73. Tất cả dư AA.

**Ngưỡng bắt buộc.** Mọi bộ phải đạt WCAG AA ở bốn cặp: chữ chính trên nền, chữ mờ trên nền, chữ trắng trên `primary`, chữ trắng trên `accent` — tất cả ≥ 4.5.

Đo được, không phải lời hứa: `npm --prefix scripts run check:theme` chạy lại bảng này và **thoát 1 nếu có cặp nào rớt**. Thêm bộ mới mà quên kiểm thì lệnh đó đỏ.

| Bộ | chữ/nền | chữ mờ/nền | trắng/primary | trắng/accent |
|---|---|---|---|---|
| `bien-sau` | 17.85 | 7.58 | 9.46 | 5.44 |
| `cat-bien` | 16.80 | 7.33 | 7.27 | 5.02 |
| `ngoc-lam` | 17.85 | 7.58 | 5.47 | 6.29 |

Thêm bộ mới: thêm một dòng ở đây, một khối `:root[data-theme="..."]` trong `tokens.css`, một giá trị vào enum ở `cms/schemas/siteSettings.ts`, rồi chạy `check:theme`.

## 2. Chữ

| Token | Giá trị | Dùng cho |
|---|---|---|
| font.family.heading | "Nunito", "Be Vietnam Pro", system-ui, sans-serif | heading mọi cấp |
| font.family.body | "Nunito", "Be Vietnam Pro", system-ui, sans-serif | body, card, nhãn, breadcrumb, meta, nav |
| font.weight | 500, 600, 700, 800, 900 | body 500; nhãn, nút, nhãn phụ card 600; heading 700; chữ hiển thị 800. **900 không có tác dụng**: Nunito dừng ở 800, trình duyệt kẹp xuống — xem DR-031 |
| font.size.base | **19px (1.1875rem)** | body; không nhỏ hơn 19px trên nội dung chính. Nâng từ 17px theo `QĐ-2026-08-28-02`. **ĐÃ ĐO trước khi đổi** (Chrome, bản dựng, 2026-08-28): thanh dính không nhúc nhích (618→675 và 674→731 y hệt ở 17 lẫn 19px, vì dải breadcrumb/tiêu đề/hero đều không đọc token này, nên **Luật 3** không bị đụng); số ký tự mỗi dòng không đổi (83) vì cột chữ khai bằng `ch`; không tràn ngang ở 1366 lẫn 386px. Giá phải trả: trang dài thêm ~5,8% desktop, ~9,3% di động. **19 là TRẦN của thang này** — cột chữ 70ch ở 19px đo 764px so với cột chính 812px của lưới `1fr 340px` trong khung 1200; ở 20px thành ~804px, tức chạm. Muốn lên nữa phải nới `--container` trước |
| font.size.scale | 1,2-1,25 | bậc thang runtime: **19** / 22 / 26 / 32 / 40 / 42 / 46 / 60 (bậc đầu nâng từ 17, `QĐ-2026-08-28-02`) |
| font.size.display | 60px (3,75rem) | **chỉ** câu định vị ở hero trang chủ. Trên khung 1200px, 46px là cỡ của một tiêu đề mục chứ không phải cỡ của câu định vị. Cấm dùng cho heading khác |
| font.size.sm | 15px (0.9375rem) | nhãn phụ card, breadcrumb, ngày cập nhật; không nhỏ hơn cỡ này trong UI chính |
| font.size.label | 14px (0.875rem) | nhãn, chip, meta ngắn |
| font.size.badge | 12px (0.75rem) | badge ngắn; không dùng cho đoạn văn |
| line-height | 1,16 heading; 1,68 body | tối ưu đọc tiếng Việt có dấu, tránh dòng quá đặc |
| line-height.display | 1,22 | **chỉ** chữ hiển thị lớn: h1 và số của dải số liệu. Ở cỡ hero, 1,16 vẫn làm dấu ngã dòng dưới chạm dấu nặng dòng trên. Cấm dùng ở cỡ thường — 1,22 ở cỡ nhỏ làm tiêu đề rời rạc |
| letter-spacing | 0 | không dùng tracking âm cho heading tiếng Việt |
| letter-spacing.eyebrow | 0,08em | **chỉ** nhãn chữ hoa. Chữ hoa tiếng Việt vẫn mang dấu nên nhãn chữ hoa cần giãn ngang. Phải đi kèm `line-height.eyebrow`, không dùng rời |
| line-height.eyebrow | 1,5 | đi kèm `letter-spacing.eyebrow`: giãn ngang mà không giãn dòng thì dấu bị dòng trên cắt |
| measure | tối đa 70ch | cột chữ thân bài Article và đoạn mở; ảnh và bảng được tràn rộng hơn |

Tải font hiện tại: self-host woff2 trên Cloudflare cùng origin. File đang có: **Nunito biến thiên 400–800** và Be Vietnam Pro 700/800, đều có latin + vietnamese subset. `font-display: swap`, preload đúng một file (Nunito latin). Không gọi Google Fonts runtime.

**Một chữ cho cả trang: Nunito (duyệt 2026-08-06, QĐ-2026-08-06-11).** Lý do chủ dự án nêu: cần một chữ tiếng Việt **phổ thông và mềm mại hơn**. Nunito bo tròn đầu nét nên mềm, và nằm trong nhóm chữ được dùng nhiều nhất nên mắt người Việt đã quen — không thấy lạ. Đủ bộ dấu tiếng Việt.

Bốn điều cần biết:

1. **Hai token vẫn tách làm hai.** `font.family.heading` và `font.family.body` hôm nay cùng trỏ Nunito, nhưng không gộp làm một: chúng là hai **vai**, và đổi vai này không được kéo theo vai kia.
2. **Lấy lại được cấp đậm 800.** Nunito biến thiên 400–800, trong khi Lora dừng ở 700. Ba chỗ phải hạ xuống 700 hồi đổi sang Lora nay trả về 800. Chỉ `--fw-900` là vẫn bị kẹp.
3. **Be Vietnam Pro là lớp dự phòng duy nhất.** Không được xoá — Nunito hỏng thì chữ rơi về một font vẫn dựng dấu tiếng Việt tử tế thay vì rơi thẳng về `system-ui`.
4. **Nhẹ đi đáng kể.** Gỡ hẳn Lora và Plus Jakarta Sans vì không còn chỗ nào gọi tới. Thư mục font từ ~220 KB xuống **~104 KB**, thấp hơn cả mốc ~140 KB trước đợt đổi chữ. Vẫn cần đo lại LCP theo ngưỡng `00-PROJECT_BRIEF` mục 6, nhưng lần này chiều gió thuận.

Bản ghi lịch sử: vòng thiết kế thứ hai từng chốt Lora (QĐ-2026-08-06-10) rồi thay ngay trong ngày sau khi chủ dự án nhìn bản thật — chữ có chân đọc ra cứng, không hợp một công ty bán tour biển.

Nợ có chủ ý: chưa đo LCP sau hai lần đổi chữ.

## 3. Khoảng cách, bo góc, bóng

| Token | Giá trị | Dùng cho |
|---|---|---|
| space.scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px | mọi margin, padding, gap sinh từ thang này |
| space.section | 48 mobile / 96 desktop | nhịp dọc giữa các vùng trang chi tiết |
| container.max | 1200px | khung nội dung; thân bài Article hẹp hơn theo measure 70ch |
| layout.hero.entity.max | 430px | **trần** chiều cao hero của trang chi tiết entity và trang điểm đến. Nguồn duy nhất là `--hero-entity-h-max` trong `tokens.css`; `Hero.astro` không giữ con số nào. Đổi ở đây là mọi loại trang đổi theo, cả ba biến thể hero (mosaic, ảnh đơn, không-ảnh). ⚠ Khác `--hero-min-h` — token đó của `HomeHero`, hero **trang chủ** |
| layout.hero.entity.min | 330px | **sàn** của cùng biểu thức. Số giữa là `calc(30vw + 50px)`, không phải `30vw` — nâng riêng trần chỉ cho +4px ở 1280 và +30px ở 1366 (`QĐ-2026-08-28-02`) |
| layout.hero.entity.tablet | 390px | khoảng 769–1023px, giá trị phẳng |
| layout.hero.entity.mobile | 290px | ≤768px, giá trị phẳng |

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
