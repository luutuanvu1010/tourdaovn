# SPEC — Trang chủ xứng tầm, và dựng nốt trang chi tiết

- **Trạng thái:** **đã duyệt** — chủ dự án chốt 2026-08-06. Code chạy được.
- **Ngày soạn:** 2026-08-06   **Người soạn:** Cowork   **Người duyệt:** Lưu Tuấn Vũ
- **Bước PLAYBOOK:** 1 (mô hình nội dung) → 6 (binding map) → 7 (thiết kế) → 8 (thực thi)
- **Loại quyết định:** cửa hai chiều — thêm field vào singleton đã có, không mở entity mới
- **Repo lúc soạn:** `main` tại `ab30472`

---

## 1. Vấn đề

Chủ dự án 2026-08-06: *"Trang chủ vẫn còn rất xấu, chưa xứng tầm với một công ty du lịch có doanh thu 7 triệu đô la một năm."*

## 2. Bối cảnh — ba dữ kiện đổi cách giải bài

Hỏi ra mới rõ, và cả ba đều quan trọng:

**Doanh thu không đến từ site này.** Công ty làm 7 triệu đô/năm qua **offline, đại lý và OTA**. `tourdao.vn` là kênh mới. Nên bài toán **không phải** "khoe catalogue lớn" — catalogue trên site thật sự chỉ có 4 sản phẩm lúc ra mắt.

**Bài toán thật:** làm sao một site mới trông vững như một công ty lâu năm, khi hàng trên site còn mỏng.

**Bằng chứng thì có đủ.** Chủ dự án xác nhận có sẵn và dùng được ngay: số giấy phép lữ hành, năm thành lập, số khách đã phục vụ, logo đối tác (OTA, hãng tàu, khách sạn, đại lý), **ảnh thật từ chuyến đi**, đánh giá khách thật kèm điểm số trên OTA, và giải thưởng.

**Gu chủ dự án chốt:** *"chắc chắn và nhiều số liệu, kiểu công ty lớn."*

Ba dữ kiện này dẫn thẳng tới một kết luận: **bằng chứng gánh trang, không phải catalogue gánh trang.** Dải số liệu, logo đối tác và đánh giá không phụ thuộc số lượng tour — nên chúng làm việc được ngay cả khi site mới có 4 sản phẩm.

## 3. Hướng đã chọn — A, và vì sao hai hướng kia hỏng

**Hướng A — bằng chứng gánh, tour đi sau.** Đã chọn.

```
1 Hero                  ảnh thật + câu định vị + 2 CTA
2 Dải số liệu           12 năm · 50.000 khách · giấy phép     ← trụ của trang
3 Tour đang bán
4 Vì sao chọn Tour Đảo  4 điểm khác biệt
5 Logo đối tác
6 Đánh giá khách
7 Cẩm nang
8 Báo giá đoàn
```

Dải số liệu đặt ngay dưới hero là thứ làm một site mới trông như công ty lâu năm, và nó **không đọc một document tour nào** — nên 1 hay 40 tour cũng không lộ. Tới khối 3, khách đã tin rồi.

**Hướng B — tour gánh, bằng chứng chen vào.** Loại. Hợp với site đã có catalogue dày; với 4 sản phẩm thì hỏng ngay khối thứ hai — đúng cái chủ dự án đang thấy xấu.

**Hướng C — tách hai luồng khách lẻ / khách đoàn ngay ở hero.** Loại phần chia đôi hero: làm loãng thông điệp, và nhánh khách lẻ trông nghèo khi chỉ có 4 sản phẩm. **Giữ phần khách đoàn** dưới dạng khối 8 ở cuối trang — không bỏ rơi nhóm khách đem lại tiền lớn.

## 4. Bốn khối mới không có chỗ chứa dữ liệu

Đây là phát hiện chi phối cả gói.

| Khối | Nguồn hiện có | Trạng thái |
|---|---|---|
| Hero | `touristDestination.mainImage`, `brand.headline`, `siteSettings.heroText` | ✅ |
| **Dải số liệu** | — | 🛑 |
| Tour đang bán | `touristDestination.featuredTours` | ✅ |
| Vì sao chọn | `HOME_COPY.trustItems` — đang cứng trong code | ◐ |
| **Logo đối tác** | — | 🛑 |
| **Đánh giá khách** | — | 🛑 |
| Cẩm nang | `touristDestination.homepageArticles` | ✅ |
| **Báo giá đoàn** | — | 🛑 |

`siteSettings` hiện chỉ có sáu field mang nội dung: `sections`, `heroText`, `contact`, `pickupPoints`, `support`, `theme` — cộng `title` chỉ dùng hiển thị trong Studio, thành 7 field cấp đầu.

**Bốn khối làm nên "chất công ty lớn" thì không khối nào có nơi chứa.** Đây đúng hình dạng đã gặp hai lần trong phiên: "Đặt vé trực tuyến" và "Đưa đón sân bay". Bài học giống nhau: sửa `01-CONTENT_MODEL` trước, không code trước rồi hợp thức hoá sau (`04-CONSTRAINTS` §2.2, điều cấm 2).

## 5. Bốn field mới

Tất cả vào `siteSettings` — dữ liệu toàn site, một bản duy nhất, đúng khuôn `support` (v1.0.14).

```
stats[]        { value: string, label: string, note?: string }
partners[]     { name: string, logo: image (alt bắt buộc), url?: string }
testimonials[] { quote: text, authorName: string, authorNote?: string,
                 sourceName?: string, sourceUrl?: string }
groupQuote     { heading?: string, text?: string, ctaLabel?: string }
```

**`stats.value` là chuỗi, không phải số.** Để nhập được "50.000+", "4,9/5", "24/7" — những dạng mà kiểu số không diễn tả nổi.

**`partners.logo` bắt buộc có alt**, theo đúng luật ảnh hiện hành (I12). Không có `url` thì logo không thành link — không link chết.

**`groupQuote` không khai số liên hệ riêng.** Nút dùng lại `contact.zaloUrl`; khai lần thứ hai là tạo nguồn sự thật thứ hai (N7).

**Vì sao vẫn là `siteSettings` chứ không mở entity mới.** Cả bốn đều là dữ liệu singleton toàn site, không có URL riêng, không cần gate publish. Mở `_type` mới là cửa một chiều (`01-CONTENT_MODEL` §5.3) và kéo theo cả họ validator `I`. Ghi chú ngưỡng: `siteSettings` hiện có 7 field cấp đầu; sau đợt này là 11 — tới field thứ mười lăm thì dừng lại xét tách, đừng để nó thành cái thùng chứa mọi thứ.

## 6. Một ràng buộc bắt buộc: không phát JSON-LD đánh giá

**Đánh giá tự đăng KHÔNG xuất `Review` hay `AggregateRating`.**

Google cấm rich snippet đánh giá tự phục vụ — nội dung doanh nghiệp tự đăng về chính mình. Phát ra là rủi ro phạt thủ công, mà `I6` (JSON-LD hợp lệ 100%) đang là cổng mức `fail`.

Nên: đánh giá **hiện cho người đọc**, không xuất dữ liệu có cấu trúc. `sourceName` và `sourceUrl` để dẫn nguồn trung thực ("Đánh giá trên TripAdvisor" kèm link) — khác hẳn với tự khai.

Muốn có sao vàng trên kết quả tìm kiếm thì phải lấy từ nguồn thứ ba qua API. Việc riêng, ngoài gói này.

## 7. Thứ tự thi hành — không đảo được

| # | Việc | Bước | File |
|---|---|---|---|
| 1 | Thêm 4 field vào §2.15 | 1 | `01-CONTENT_MODEL.md` |
| 2 | Ghi bản ghi quyết định | — | `DECISIONS.md` |
| 3 | Schema Sanity, query, kiểu | 8 | `cms/schemas/siteSettings.ts`, `queries/siteSettings.ts`, `lib/types.ts` |
| 4 | Khai 4 khối mới vào §5.7 | 6 | `06-BINDING_MAP.md` |
| 5 | Soạn prompt bàn giao | 7 | `docs/prompts/` |
| 6 | Design vẽ | 7 | Claude Design |
| 7 | Dựng code | 8 | `SiteHome.astro` cộng component mới |

Bước 1–4 là điều kiện để bước 5 không rỗng. Đưa prompt cho Design khi chưa có field là để nó vẽ dải số liệu đẹp rồi tới lúc dựng mới phát hiện không có nơi nhập "50.000 khách" — sửa hai vòng.

`g1` chép cứng bảng field trong mã validator, nên bước 3 phải sửa cả `scripts/meta-validators/g1-content-model-vs-schema.ts`, nếu không cổng đỏ. Xem DR-027.

## 8. Phạm vi

**Trong phạm vi:**

- Bốn field mới và bốn khối mới trên trang chủ.
- Bố cục lại trang chủ theo hướng A.
- **Dựng nốt bốn loại trang chi tiết** còn lại trong bàn giao bước 7: điểm tham quan, trải nghiệm, cẩm nang, danh sách tour. Chủ dự án chốt 2026-08-06 làm luôn, không để sau.
- Khối "Vì sao chọn" chuyển từ cứng trong code sang đọc `siteSettings` — cùng lý do với ba khối kia.

**Ngoài phạm vi:**

- Lấy đánh giá từ API bên thứ ba.
- Entity `Transfer` (ND-006), lối vào menu cho khách sạn (ND-007), `as any` ở `LodgingDetail` (DR-028), trang lưu trú rỗng vẫn sinh (DR-030).
- Nhập nội dung — việc của chủ dự án trong Studio.

## 9. Cách chứng minh đã xong

| | Bằng chứng |
|---|---|
| **BC-1** (E1) | `astro check` 0 lỗi, `npm run build` đi hết, `gate:all` giữ 9 xanh / 1 đỏ đúng `deferred-gate`. |
| **BC-2** (E1) | `check:theme` — cả ba bộ giao diện vẫn đạt AA sau khi thêm khối mới. |
| **BC-3** (E1) | **Guard rỗng hai chiều:** để trống `stats` trong Studio → khối không render, trang vẫn dựng; điền → khối hiện. Làm tương tự với `partners`, `testimonials`, `groupQuote`. Bốn khối độc lập nhau. |
| **BC-4** (E1) | `jsonld-post` (I6) xanh, và **grep output build xác nhận không có `"@type": "Review"` hay `"AggregateRating"`** — chứng minh ràng buộc §6 được giữ, không chỉ nói. |
| **BC-5** (E1) | `g3` không tăng cảnh báo: bốn khối mới đều khai trong `06-BINDING_MAP` §5.7 và đều được template đọc. |
| **BC-6** (E2) | Chủ dự án xem bản build thật, ở cả ba bộ giao diện, ở trạng thái **có dữ liệu** và **trống dữ liệu**. |

## 10. Phần cố ý để lại

- **Nội dung.** Gói này tạo chỗ chứa, không nhập dữ liệu. Trang chủ chỉ "xứng tầm" khi chủ dự án đã nhập số liệu, logo, đánh giá và ảnh thật.
- **Ảnh thật.** Chủ dự án xác nhận có kho ảnh. Gói này không xử lý việc tải lên và tối ưu ảnh; nếu ảnh nặng thì ngưỡng Lighthouse ≥ 90 ở `04-CONSTRAINTS` §3 sẽ là chỗ vỡ đầu tiên.
- **Giải thưởng và chứng nhận.** Có trong danh sách bằng chứng nhưng chưa có khối riêng ở hướng A. Nếu cần thì gộp vào dải số liệu hoặc khối đối tác, quyết ở bước 7.

## 11. Hệ quả về thời gian, ghi thẳng

Mốc ra mắt cũ là **2026-08-09** (`00-PROJECT_BRIEF` §6). Gói này gồm sửa mô hình dữ liệu, một vòng Design, dựng lại trang chủ, dựng nốt bốn trang chi tiết — cộng việc chủ dự án nhập số liệu, logo, đánh giá và ảnh.

Cowork đã nêu rõ hai đường: dời mốc, hoặc ra mắt trước rồi làm gói này sau. **Chủ dự án chọn làm đủ.** Nên **mốc 2026-08-09 không còn giữ được**, và `00-PROJECT_BRIEF` §6 phải cập nhật khi có mốc mới.

Đây không phải cảnh báo lại — đây là ghi cho khớp, để sổ không nói một đằng thực tế một nẻo.

## 12. Điểm dừng

**Dừng, chờ chủ dự án duyệt cổng QA1** (`GOVERNANCE` 4.2: chưa qua QA1 thì Code không chạy).

Cả ba mục đã được chủ dự án chốt 2026-08-06:

1. ✅ Hình dạng bốn field ở §5.
2. ✅ Ràng buộc §6 — không phát JSON-LD đánh giá.
3. ✅ Mốc ra mắt mới: **2026-08-10**. `00-PROJECT_BRIEF` §6 đã cập nhật.

Cổng QA1 mở. Thi hành theo đúng thứ tự §7.
