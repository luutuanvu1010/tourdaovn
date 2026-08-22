# AUDIT + KẾ HOẠCH — Thiết kế lại giao diện vòng 4: template trang chi tiết theo Entity Type

- **Trạng thái:** chủ dự án duyệt một phần 2026-08-22 (`QĐ-2026-08-22-01`): **hướng A**, **thang chữ về spec**, **đợt 4A đã thi hành** (xem §8). Còn mở: §6 mục 4, 5, 6; đợt 4B chờ Cowork sửa `06`.
- **Ngày:** 2026-08-21   **Người soạn:** Cowork + Design (một phiên)   **Người duyệt:** Lưu Tuấn Vũ
- **Repo lúc soạn:** `main` tại `1416363`. Site đo trên **production** `https://tourdao.vn` (nội dung live đầy hơn `dist/` local: 15 điểm tham quan, 11 tour, 9 trải nghiệm, 7 địa danh).
- **Đầu vào đã đọc:** `CONSTITUTION` (P2, P4, P6, P8, N1, N7), `GOVERNANCE` §2–§5, `06-BINDING_MAP` v2 §0–§5, `07-DESIGN_TOKENS`, `DESIGN_PATTERNS`, `tokens.css`, `DetailLayout` + 4 template chi tiết (`AttractionDetail`, `PlaceDetail`, `ExperienceDetail`, `TourDetail`), `InfoBar`, `InfoCard`, `Sidebar`, `Card`, `EntityIndex`, `Hero`, `Breadcrumb`, `BaseLayout`, `uiCopy`; `KE-HOACH-THIET-KE-LAI-GIAO-DIEN`, `SPEC-2026-08-14-be-mat-vong-3`, `NHAT-KY-2026-08-06-vong-2`, `DECISIONS` QĐ-08-06-06 → QĐ-08-14-03, `DRIFT_LOG` DR-027 → DR-031; mockup vòng 2 `docs/design/vong2/`.
- **Bằng chứng:** ảnh chụp desktop ở `docs/evidence/2026-08-21-audit-vong-4/` (E2) và số đo DOM chạy bằng script trong trình duyệt trên 10 URL live (E1, kết quả trích nguyên trong §2). Chưa chụp được bản di động và trang chủ — tiện ích trình duyệt ngắt kết nối giữa chừng; phần di động trong §2 suy từ CSS đang chạy, ghi rõ chỗ nào là suy luận.
- **Canvas thiết kế đi kèm:** `docs/design/vong4/` (6 artboard: hiện trạng có chú thích, bản đồ thông tin, mẫu Điểm tham quan desktop + di động, hai hướng bố cục thay thế). Bản xem trực quan: https://claude.ai/code/artifact/65dbacc1-aee2-452c-98e7-3daee75eff5c — là bản **phác để chọn hướng**, chưa phải mockup hi-fi cho QA1.

---

## 0. Một câu chẩn đoán

Site đã qua ba vòng chỉnh bề mặt (token, chữ, màu, trang chủ) nhưng **khung trang chi tiết vẫn đổ cùng một field vào ba vùng** — huy hiệu hero, dải `InfoBar`, thẻ `InfoCard` ở sidebar — nên người đọc thấy "Giờ mở cửa 08:00 – 16:30" hai lần, "Đảo" ba lần, "Cả hai" ba lần trên một màn hình; trong khi thứ khách cần để quyết định — **giá** — thì không trang nào có. Lỗi gốc nằm ở **bản ánh xạ** (một field được phép vào nhiều vùng) chứ không ở màu hay chữ, nên không vòng token nào sửa được nó. Vòng 4 phải sửa ở tầng đó.

---

## 1. Tóm tắt phát hiện, xếp theo mức hại cho người dùng

| # | Phát hiện | Mức | Bằng chứng | Gốc rễ ở đâu |
|---|---|---|---|---|
| F1 | **Một field hiện 2–3 lần trên một màn** (loại, giờ, điện thoại, thời lượng, hình thức, nơi diễn ra) | Cao | §2.1 — đo trên 4 trang | Bản ánh xạ + `DetailLayout` có ba vùng cùng ăn một field |
| F2 | **Không trang nào có giá**; tour rơi về nút "Website chính thức" trỏ về **chính tourdao.vn** | Cao | §2.2 | `data/prices.yaml` rỗng; fallback CTA không loại trừ chính site |
| F3 | **Thân bài là bài SEO dài, có mục riêng trùng mục cấu trúc** ("2. Hướng dẫn lộ trình di chuyển" 1.242 từ đứng cạnh "Cách tới nơi" 29 từ) | Cao | §2.3 | Biên tập + template không có mục lục, không có luật "bài không lặp cấu trúc" |
| F4 | **Sidebar dính bị header che** — hai dòng đầu (Địa chỉ, Giờ) khuất sau thanh dính | TB | §2.4, ảnh `ev-attr-sidebar-clipped` | `Sidebar.astro` `top:16px`, không cộng `--header-h` |
| F5 | **Di động: địa chỉ, giờ, bản đồ, nút đặt nằm cuối trang** sau 1.200 từ | Cao (di động là nơi khách đặt) | §2.5 (suy từ CSS) | `.two-col` 1 cột, sidebar xếp sau nội dung |
| F6 | **Nhãn giá trị vô nghĩa hoặc sai**: "Phí vào cửa: Có thu phí", "Xem / Xem", "Xác minh trên Wikidata" nhưng trỏ Wikipedia, "Hình thức: Cả hai" (danh sách lại ghi "Linh hoạt"), "Giấy phép: Giấy phép kinh doanh…" | TB | §2.6 | `uiCopy` hai bảng nhãn cho một field; template không ẩn giá trị rỗng nghĩa |
| F7 | **Thẻ danh sách hỏng clamp**: dấu "…" ở dòng 2 rồi vẫn lòi dòng 3 khi thẻ không có huy hiệu | TB | ảnh `ev-index-attraction-cards` | `Card.astro` `.card-summary` vừa `-webkit-line-clamp:2` vừa `flex:1` |
| F8 | **Thang chữ lớn hơn spec 6,25 %** ở mọi bậc (body 18,06 px thay vì 17; tiêu đề mục 34 thay vì 32; h1 48,9 thay vì 46) | TB | §2.7 | `html{font-size:var(--fs-base)}` trong khi `--fs-base` tính bằng `rem` → nhân đôi |
| F9 | **Dải `InfoBar` thưa**: 2 ô trải trên lưới 1.200 px; icon là emoji (render khác theo hệ điều hành) | Thấp | ảnh `ev-attr-hero-desktop` | `InfoBar` co số cột nhưng không co bề rộng; 105 chỗ `icon: '…'` emoji |
| F10 | **Hero**: breadcrumb trắng trên ảnh sáng khó đọc; tiêu đề tour 3 dòng; đoạn mở 4 dòng trên ảnh | Thấp–TB | ảnh `ev-attr-hero-desktop` | Overlay gradient chỉ phủ 55 % dưới; không giới hạn độ dài h1 |
| F11 | **Neo & thứ tự mục không nhất quán**: tour thiếu neo cho "Chi tiết" (mục lớn nhất) và "Mùa"; "Điểm nổi bật" đứng sau "Bao gồm" | Thấp | §2.8 | `jumpLinks` khai tay từng template |
| F12 | **Danh sách**: `/tour/` 0/11 thẻ có giá, chip lọc không nhãn, không mô tả nhánh; ảnh tour là banner chữ nhúng; `/kham-pha/` và `/tat-ca/` không h1, trùng nội dung các nhánh | TB | §2.9 | Dữ liệu + `EntityIndex`/`HubIndex` |
| F13 | **Nguồn thứ hai ngoài token**: `theme-color #C2410C` (màu site cũ) trong `BaseLayout` | Thấp | `BaseLayout.astro:72` | Hardcode |
| F14 | **Hai màu nút chính**: trang chủ dùng cát (`HomeTourGrid.astro:159`, theo vòng 3 §3.3), trang chi tiết dùng san hô (`DetailLayout` `.sticky-bar__cta`, `BookingCTA`) — khách đi từ trang chủ vào tour thấy nút đổi màu | Thấp | so hai file | Vòng 3 chỉ đổi CTA trang chủ; `07` §1 vẫn ghi accent là màu CTA |

Những gì **đang đúng và phải giữ**: vùng rỗng ẩn hẳn (không placeholder, không CTA giả); neo chỉ trỏ mục có thật; `InfoBar` co theo số ô; hero mosaic; một nguồn màu/chữ trong `tokens.css`; JSON-LD đầy đủ; thanh dính có Zalo.

---

## 2. Bằng chứng chi tiết

Số đo lấy bằng một script DOM chạy trên production, cửa sổ 1440×900 (viewport 1359×762), ngày 2026-08-21. Script liệt kê: huy hiệu hero, breadcrumb, ô `InfoBar`, dòng `InfoCard`, mục nội dung, và **tự tìm giá trị xuất hiện ở ≥ 2 vùng**.

### 2.1 Cùng một field, nhiều vùng (F1)

| Trang | Giá trị | Hiện ở |
|---|---|---|
| `/diem-tham-quan/khu-du-lich-hon-tam/` | `08:00 - 16:30` | InfoBar "Giờ mở cửa" **và** sidebar "Giờ mở cửa" |
| | `0258 6 250 250` | InfoBar "Điện thoại" **và** sidebar "Điện thoại" |
| `/dia-danh/hon-mun/` | `Đảo` | huy hiệu hero **và** InfoBar "Loại" **và** sidebar "Loại" — **3 lần** |
| | `Nha Trang` | breadcrumb **và** InfoBar "Thuộc" **và** sidebar "Thuộc" — **3 lần** |
| | `08:00 - 16:00` | InfoBar **và** sidebar |
| `/trai-nghiem/lan-bien-scuba-diving/` | `Thể thao biển` | huy hiệu hero **và** sidebar "Loại" |
| | `Đảo Hòn Mun` | breadcrumb **và** sidebar "Diễn ra tại" |
| | `touristType` | InfoBar "Phù hợp: Khám phá" (cắt còn 1) **và** sidebar "Phù hợp: Khám phá, Cảm giác mạnh" — **cùng field, hai cách cắt** |
| `/tour/tour-3-dao-nha-trang-deluxe/` | `Cả hai` | huy hiệu hero **và** InfoBar "Hình thức" **và** sidebar "Hình thức" — **3 lần** |
| | `8:00 - 16:00` | huy hiệu hero **và** InfoBar "Thời lượng" **và** sidebar "Thời lượng" — **3 lần** |
| | `Cảng du lịch Nha Trang` / `Cảng Du Lịch Nha Trang` | InfoBar "Khởi hành" (`departureNote`) **và** sidebar "Xuất phát" (`tripOrigin`) — hai field, một nghĩa, hai cách viết hoa |

**Nguồn trong mã.** `AttractionDetail.astro:72–86`: `infoBarItems` và `sidebarRows` cùng đọc `openingHours`, `telephone`; `heroBadges` đọc `attractionType`. `PlaceDetail.astro`: `infoBarItems` có `type` + `partOf`, `sidebarRows` cũng có `type` + `partOf`. `TourDetail.astro:67–82`: `duration` và `formatLabel` vào cả `heroBadges`, `infoBarItems`, `sidebarRows`.

**Nguồn trong đặc tả.** `06-BINDING_MAP` §3, hàng "Nhãn loại entity": *"nhãn ngắn cạnh tiêu đề **hoặc** trong InfoBar"* — chữ **hoặc**. Code làm **cả hai cộng sidebar**. Đây là lệch spec ↔ code, ghi **DR-032**. Các field còn lại (giờ, điện thoại, thời lượng) bản ánh xạ **không nói** vào vùng nào — tức là bản ánh xạ thiếu một cột "vùng", và đó là lý do mỗi template tự quyết rồi lặp.

### 2.2 Giá (F2)

- `data/prices.yaml` chỉ có 6 dòng chú thích, **không có mục giá nào**. Hệ quả đo được: `/tour/` **0/11** thẻ có `.card-price`; `/trai-nghiem/` 0 thẻ; 4 trang chi tiết đo đều `stickyPrice = ""`.
- Trang tour: khối sidebar `booking-cta` render một nút **"Website chính thức" → `https://tourdao.vn/`** — trỏ về chính site đang đứng. Nguồn: `TourDetail.astro:38–41` (`operatorUrl = data.operator?.url || officialSource`; `operator` là Công ty TNHH Tour Đảo, `url` là tourdao.vn). Đây là CTA không hành động — đúng loại R4 cấm. Ghi **DR-036**.
- Không phải lỗi thị giác, nhưng là lỗi UX nặng nhất trên trang bán hàng: khách không có con số để quyết, và mọi vùng giá + nhãn "từ X" mà mockup vòng 2 vẽ đều chưa từng hiện.

### 2.3 Thân bài nuốt cấu trúc (F3)

| Trang | Mục cấu trúc | Số từ | Thân bài | Số từ | Mục h2 trong thân bài trùng vai |
|---|---|---|---|---|---|
| Hòn Tằm (attraction) | Cách tới nơi | **29** | Tổng quan | **1.242** | "2. Hướng dẫn lộ trình di chuyển đến Hòn Tằm" |
| | Trải nghiệm tại đây | 314 | | | "4. Oanh tạc các trải nghiệm…" · "6. Gợi ý lịch trình 1 ngày" · "3. Ở đâu khi đến" |
| Tour 3 đảo Deluxe | Lịch trình (timeline) | **81** | Chi tiết | **978** | "Lịch trình chi tiết tour 3 đảo Deluxe…" · "Các trải nghiệm trong tour" · "Chính sách hủy" |

Người đọc gặp "cách đi" hai lần với hai độ sâu khác nhau; neo "Cách tới nơi" trên thanh dính dẫn tới 29 từ trong khi hướng dẫn thật nằm giữa bài. Thanh dính không có neo nào vào 7 mục của bài.

### 2.4 Sidebar dính bị che (F4)

Đo: `.site-header` cao **69 px**, `.sticky-bar` cao **61,8 px** (cả hai dính trên) — tổng **131 px** chrome cố định. `Sidebar.astro:37–39`: `position:sticky; top:16px`. Khi cuộn, hai dòng đầu của thẻ thông tin (Địa chỉ, Giờ mở cửa) nằm sau thanh dính. Ảnh `ev-attr-sidebar-clipped.jpg`: dòng đầu nhìn thấy là "Điện thoại". Ghi **DR-033**.

### 2.5 Di động (F5) — suy từ CSS, chưa chụp được

`DetailLayout.astro:246–250`: dưới 1024 px `.two-col` về 1 cột, `content-main` trước, `Sidebar` sau → địa chỉ, giờ, điện thoại, bản đồ, khối đặt chỗ **đứng sau** thân bài (1.242 từ), FAQ, lưới trải nghiệm. `DetailLayout.astro:200–203`: dưới 768 px neo ẩn, thanh dính chỉ còn một nút Zalo căn phải trong dải cao ~62 px, dưới header 68 px → **~130 px / 844 px (15 %) màn hình là chrome cố định**, phần lớn là khoảng trống. `InfoBar` 2 cột. Hero chính 280 px + dải thumbnail 84 px.

Cần một lần chụp thật trước khi chốt số; nhưng thứ tự khối thì chắc vì nó là thứ tự DOM.

### 2.6 Nhãn và giá trị (F6)

| Chỗ | Hiện ra | Vấn đề | Nguồn |
|---|---|---|---|
| Sidebar attraction | "Phí vào cửa: **Có thu phí**" | Không có giá thì "có thu phí" là thông tin rỗng | `AttractionDetail.astro:83` — `isAccessibleForFree ? free : paid` |
| Sidebar attraction/place | "Website chính thức: **Xem**" · "Bản đồ: **Xem**" | Hai link cùng chữ, không cho biết đích | `InfoCard.astro` `displayValue` |
| Sidebar | "**Xác minh trên Wikidata** → Wikidata" | `href` là `vi.wikipedia.org` — nhãn sai nguồn | `sameAs[0]` là Wikipedia |
| Tour chi tiết | "Hình thức: **Cả hai**" | "Cả hai" gì? — danh sách cùng tour ghi "**Linh hoạt**" | `uiCopy.ts:813` (`TOUR_FORMAT_LABELS`) vs `:822` (`TOUR_FORMAT_BADGES`) — hai bảng nhãn cho một giá trị, **N7**. Ghi **DR-035** |
| Tour chi tiết | "Giấy phép: **Giấy phép kinh doanh lữ hành quốc tế số: 56-245/…**" | Nhãn lặp trong giá trị | dữ liệu `licenseInfo` |
| Experience InfoBar | "Phù hợp: **Khám phá**" | Cắt còn 1 trong 2 giá trị, sidebar lại đủ | `ExperienceDetail.astro` `touristType?.[0]` |

### 2.7 Thang chữ lệch spec (F8)

`tokens.css:192–194`: `html { font-size: var(--fs-base) }` với `--fs-base: 1.0625rem` (17 px). Mọi token khác cũng tính bằng `rem`, mà `rem` lúc này = 17 px, nên:

| Token | Spec (`07` §2) | Đo trên site |
|---|---|---|
| body (`--fs-base`) | 17 px | **18,06 px** |
| `--fs-section` | 32 px | **34 px** |
| h1 trang chi tiết (`--fs-hero`) | 46 px | **48,9 px** |
| `--fs-sm` (nhãn, breadcrumb) | 15 px | **15,9 px** |
| h1 trang danh sách (`--fs-h1`) | 42 px | **44,6 px** |

Mọi bậc đều ×1,0625. Không phải lỗi nhìn thấy (thang vẫn đều) nhưng **spec nói một đằng, màn hình một nẻo**, và vòng 3 vừa chỉnh 28→32, 18→21 theo con số spec mà thật ra đang là 34 và 22,3. Ghi **DR-034**. Đi kèm: h2 trong thân bài 27 px đen đậm đứng cạnh tiêu đề mục 34 px xanh — hai hệ tiêu đề trong một cột.

### 2.8 Neo và thứ tự mục (F11)

Tour Deluxe: mục "Chi tiết" (978 từ) và "Mùa nào nên đi" render **không có `id`** và không có neo (`TourDetail.astro` `jumpLinks` chỉ khai itinerary, includes, highlights, faq). Thứ tự mục: Lịch trình → Bao gồm → **Điểm nổi bật** → Chi tiết → Mùa → FAQ. Attraction: Điểm nổi bật (12 từ) → Tổng quan → Cách tới nơi → FAQ → Trải nghiệm. Bốn template bốn thứ tự.

### 2.9 Danh sách và hub (F12, F7)

| URL | Thẻ | Có giá | Có huy hiệu | Ghi chú |
|---|---|---|---|---|
| `/diem-tham-quan/` | 15 | 0 | 7 | Thẻ không huy hiệu lòi dòng 3 (F7). Không lọc theo `attractionType` dù đã có 7 loại |
| `/tour/` | 11 | **0** | 11 ("Linh hoạt"/"Tour ghép") | 9 chip term **không nhãn**, không trạng thái "tất cả"; **không có mô tả nhánh** (`/diem-tham-quan/` thì có); ảnh thẻ là banner chữ nhúng (tiêu đề lặp trong ảnh, phông/màu ngoài hệ) |
| `/trai-nghiem/` | 9 | 0 | — | 2 chip: "Thể thao biển", **"Ẩm thực"** — site không bán ẩm thực |
| `/kham-pha/` | 23 | 0 | — | **Không h1**; = `/diem-tham-quan/` + `/trai-nghiem/` ghép lại |
| `/tat-ca/` | 67 | 0 | — | **Không h1**; cao 14.199 px; gồm cả "Công ty", "Tác giả" |

---

## 3. Nguyên tắc sửa cho vòng 4

Ba luật, ghi vào bản ánh xạ để máy kiểm được, không để trong đầu Design:

1. **Một thông tin — một vùng — một lần.** Mỗi field của entity được khai **đúng một vùng** trên trang chi tiết. Vùng nào cần nhắc lại (ví dụ giá trên thanh dính **và** trong khối hành động) thì phải ghi rõ là ngoại lệ có lý do (giá là thứ duy nhất được lặp, vì nó là quyết định mua).
2. **Cấu trúc giữ khung, bài viết giữ chiều sâu.** Field cấu trúc (`accessInfo`, `itinerary`, `includes`, `openingHours`…) là câu trả lời ngắn, đứng cố định; thân bài không được mở mục cùng tên. Template sinh **mục lục** từ h2 của thân bài để bài dài vẫn điều hướng được.
3. **Giá trước, chữ sau.** Trên màn đầu của entity thương mại phải có giá hoặc nhãn "miễn phí"; không có thì không hiện vùng giá **và cũng không hiện nút thay thế trỏ về chính mình**.

### 3.1 Bản đồ thông tin mới — Điểm tham quan (mẫu cho 4 entity)

| Vùng | Field | Ghi chú |
|---|---|---|
| Dải điều hướng trên hero (nền sáng) | breadcrumb (`containedInPlace`) | **Ra khỏi ảnh** để đọc được |
| Hero | `mainImage` + `gallery`, huy hiệu `attractionType` (**chỉ ở đây**), `title`, `summary` | h1 tối đa 2 dòng ở 1280 px |
| Thanh dính | neo tới mục có thật **+ mục lục thân bài**; giá (lặp có chủ ý); CTA Zalo | Di động: chuyển thành thanh **đáy** chỉ gồm giá + CTA |
| **Thông tin nhanh** (vùng mới, thay cặp `InfoBar` + `InfoCard`) | `openingHours`, giá vé / `isAccessibleForFree`, `address`, `telephone`, `officialSource`, `hasMap` | Mỗi field một ô, **tối đa 6 ô**; ≤ 2 ô thì không trải dải, gộp vào khối bên phải. Di động: ngay dưới hero |
| Khối hành động (sidebar trên) | giá + CTA Zalo + kênh phụ | Không lặp field nào của Thông tin nhanh |
| Bản đồ (sidebar dưới) | `geo` | Giữ; địa chỉ không lặp ở đây |
| Thân bài | `body` + mục lục tự sinh | Luật 2 |
| Điểm nổi bật | `highlights` | Đứng **trước** thân bài, dạng lưới 2 cột (P10) |
| Cách tới nơi | `accessInfo` | Callout; thân bài không có mục cùng tên |
| Trải nghiệm tại đây · FAQ · Gần đây · Cập nhật | rollup, `faq`, nearby, `_updatedAt` | Giữ |
| **Bỏ** | dòng "Xác minh" đổi nhãn theo host (`Wikipedia` / `Wikidata`); "Phí vào cửa: Có thu phí" **ẩn** khi không có giá | |

Bảng đầy đủ cho Place, Experience, Tour nằm ở artboard **Bản đồ thông tin** trong canvas; tinh thần giống nhau: type/duration/format vào **đúng một** trong {huy hiệu hero, Thông tin nhanh}, không vào sidebar nữa; sidebar chỉ còn hành động + bản đồ + (tour) đơn vị vận hành & giấy phép.

---

## 4. Kế hoạch theo đợt

Thứ tự theo giá trị cho khách và chi phí: sửa lỗi thật trước (không cần mockup), rồi khung trang chi tiết, rồi danh sách, rồi dữ liệu. Mỗi đợt qua đúng cổng của `GOVERNANCE` 4.3/4.4.

### Đợt 4A — Sửa lỗi thật, không đổi bố cục (Code, cửa hai chiều, không cần mockup)

| # | Việc | File | Kiểm |
|---|---|---|---|
| A1 | Sidebar dính cộng đủ chiều cao header + thanh dính | `Sidebar.astro` (`top`), `DetailLayout.astro` (xuất `--sticky-bar-h`) | cuộn → dòng "Địa chỉ" còn thấy |
| A2 | Thẻ: bỏ `flex:1` khỏi `.card-summary`, đẩy `margin-top:auto` sang `.card-meta` | `Card.astro` | thẻ không huy hiệu vẫn đúng 2 dòng |
| A3 | Một bảng nhãn `tourFormat`; `both` → một chữ duy nhất (đề xuất "Ghép hoặc riêng") | `uiCopy.ts`, `EntityIndex.astro`, `TourDetail.astro` | danh sách = chi tiết |
| A4 | Không render nút "Website chính thức" khi URL cùng host với site | `TourDetail.astro:38–41` | trang tour không còn link về `/` |
| A5 | Nhãn "Xác minh" theo host của `sameAs[0]`; "Phí vào cửa" chỉ hiện khi miễn phí hoặc có giá; link "Xem" → "Mở bản đồ" / tên miền | `InfoCard.astro`, 4 template | đọc sidebar không còn chữ "Xem" đôi |
| A6 | Neo: mọi `Section` có `heading` tự sinh `id`; thanh dính đọc từ danh sách mục đã render thay vì khai tay | `Section.astro`, `DetailLayout.astro`, 4 template | tour có neo "Chi tiết", "Mùa" |
| A7 | `theme-color` đọc token accent (sinh từ `tokens.css` hoặc `siteTheme`) | `BaseLayout.astro:72` | không còn `#C2410C` |
| A8 | **Quyết rồi mới làm:** thang chữ — (a) `html{font-size:100%}` để mọi token về đúng con số spec (site nhỏ lại 6 %), hoặc (b) sửa `07-DESIGN_TOKENS` ghi con số đang render và giữ nguyên | `tokens.css` hoặc `07` | đo lại 5 bậc ở §2.7 |

Cổng: `astro check` 0/0 · `npm run build` · `check:theme` 3 bộ AA · `gate:all` 9 xanh / 1 đỏ đúng `deferred-gate` · chạy lại script đo DOM: **`duplicates` không đổi** (4A không sửa trùng lặp) nhưng A1–A7 đo được từng dòng.

### Đợt 4B — Khung trang chi tiết v3 (Cowork sửa `06` → Design → QA1 → Code → QA2)

1. **Cowork**: sửa `06-BINDING_MAP` §3 — thêm vùng **Thông tin nhanh**, bỏ chữ "hoặc" ở hàng nhãn loại, thêm cột "vùng" cho mọi field hiển thị của 4 entity (bảng ở artboard Bản đồ thông tin); ghi luật 1–3 của §3 vào §6 "Quy tắc chung". Chủ dự án duyệt.
2. **Design**: mockup hi-fi theo bản đồ mới — desktop + di động cho **Điểm tham quan** (mẫu), rồi áp cho Địa danh, Trải nghiệm, Tour. Bản phác đã có ở canvas vòng 4 (`Main` + `DiDong`); hi-fi sẽ dựng trên bản được chọn.
3. **QA1** theo `08-QA_CHECKLIST` A→F: mọi vùng trên mockup trỏ về field thật; không field nào ở hai vùng (trừ giá); token đúng `tokens.css`.
4. **Code**: `DetailLayout` v3 — `FactStrip.astro` thay `InfoBar` + `InfoCard`; `ActionCard.astro` gom giá/CTA/kênh; `Toc` sinh từ `body`; thứ tự khối di động (hero → thông tin nhanh → nội dung → FAQ → gần đây; thanh đáy giá + CTA); icon SVG 20 px thay emoji (một sprite trong `src/components/icons/`); breadcrumb ra khỏi ảnh. Bốn template chỉ còn khai **dữ liệu**, không khai vùng.
5. **QA2**: cổng như 4A **+** script đo DOM trả `duplicates = []` trên cả 4 trang mẫu **+** ảnh trước/sau desktop và di động (E2) **+** Lighthouse mobile perf ≥ 90, a11y ≥ 95 (`04-CONSTRAINTS` §3; chưa có công cụ — quyết ở §6).

Ước lượng: 1 phiên Cowork + 1 phiên Design + 2 phiên Code. Cửa **một chiều ở chỗ sửa `06`** (bản ánh xạ là hợp đồng), hai chiều ở code.

### Đợt 4C — Danh sách và hub (Code, sau 4B vì dùng thẻ mới)

- Thẻ chuẩn: hàng meta luôn giữ chỗ (huy hiệu hoặc trống) để thẻ đều cao; giá hiện khi có.
- `/tour/`: mô tả nhánh (config); chip term có nhãn "Lọc theo điểm đến" + trạng thái "Tất cả"; lưới giữ 3 cột nhưng thẻ tour có hàng "giá từ" khi `prices.yaml` có.
- `/diem-tham-quan/`: chip lọc theo `attractionType` (7 loại đã có dữ liệu) — cùng cơ chế term của `/tour/`, không filter client.
- `/kham-pha/`, `/tat-ca/`: **cần quyết** (§6): giữ + thêm h1/mô tả, hay `noindex`, hay bỏ khỏi build (ADR-0023 điều hướng theo dòng dịch vụ, hai trang này không ở đâu trong menu).

### Đợt 4D — Dữ liệu và biên tập (chủ dự án / biên tập viên, song song với 4A)

- Nhập `data/prices.yaml` cho 11 tour và trải nghiệm trả phí (mẫu trong file). Đây là việc **mở khoá giá trị lớn nhất** của cả vòng và không cần code.
- Quy ước thân bài: không mở mục trùng tên mục cấu trúc; đưa "cách đi" vào `accessInfo`, "lịch trình" vào `itinerary`. Viết vào `01-CONTENT_MODEL` §2.3/§2.8 phần "Ghi chú biên tập" (Cowork soạn, 1 đoạn).
- Điền `attractionType` cho 8/15 điểm còn trống; gỡ hoặc đổi term "Ẩm thực" khỏi bộ `experienceType`; `licenseInfo` bỏ tiền tố "Giấy phép kinh doanh lữ hành quốc tế số:".
- Ảnh thẻ tour: ảnh thật không chữ (quy ước ảnh ở `06` §5.1 đã có "ảnh kèm alt"; thêm một dòng "không chữ nhúng").

---

## 5. Phương án đã cân, và vì sao chọn Thông tin nhanh + sidebar hành động

| Hướng | Mô tả | Được | Mất | Kết luận |
|---|---|---|---|---|
| **A — Thông tin nhanh dưới hero + sidebar chỉ hành động/bản đồ** (đề xuất, `Main`) | Một dải fact tối đa 6 ô; sidebar gọn | Giải trùng lặp triệt để; di động xếp tự nhiên; ít đổi `DetailLayout` nhất | Dải thưa khi ≤ 2 ô → phải có luật gộp | **Chọn** |
| B — Mọi fact vào sidebar, bỏ dải dưới hero (`HuongB`) | Một cột thông tin bên phải | Đơn giản nhất | Di động: fact rơi xuống cuối (đúng lỗi F5) trừ khi đổi thứ tự DOM; desktop sidebar dài | Loại, trừ khi chủ dự án muốn sidebar là "thẻ hồ sơ" |
| C — Một cột, không sidebar, fact là thẻ ngay dưới tiêu đề (`HuongC`) | Giống bài báo, CTA chỉ ở thanh dính | Di động = desktop; đọc tập trung | Desktop mất bản đồ/hành động "luôn trong tầm mắt"; khác xa bốn trang vừa dựng vòng 2 | Loại cho entity thương mại; **có thể hợp với Địa danh** (không giá, không CTA) |

---

## 6. Cần chủ dự án quyết trước khi đi tiếp

1. **Duyệt chẩn đoán §1–§2** và ba luật §3 (đặc biệt luật 1: giá là field duy nhất được lặp).
2. **Chọn hướng bố cục** A / B / C cho trang chi tiết (xem canvas). Nếu A: có cho phép **Địa danh** dùng C không (không giá, không CTA, sidebar gần như rỗng).
3. **Thang chữ (F8):** về đúng spec (site nhỏ lại ~6 %) hay sửa spec theo màn hình.
4. **`/kham-pha/` và `/tat-ca/`:** giữ có h1, `noindex`, hay bỏ.
5. **Giá:** ai nhập `prices.yaml`, khi nào. Không có giá thì 4B vẫn làm được nhưng vùng giá tiếp tục ẩn và hiệu quả vòng này giảm một nửa.
6. **Công cụ đo QA2:** Lighthouse (đã hẹn từ `KE-HOACH` pha F, QĐ-2026-08-05-09/10) — cho phép dùng `npx lighthouse` hay `unlighthouse` trong QA2 vòng này không. Chưa quyết thì QA2 vòng 4 **không viện dẫn** ngưỡng perf/a11y (đúng ràng buộc QĐ-2026-08-05-08).
7. **DR-032 → DR-038** ở `DRIFT_LOG`: xác nhận là drift thật; cái nào "chấp nhận" thì ghi.
8. **Ảnh tham chiếu `docs/design/giaodiendatve.png`** (đặt vào repo 2026-08-18, chưa gắn với quyết định nào): một khối đặt tour kiểu OTA — giá từ / mã tour / chọn ngày khởi hành kèm giá / bộ đếm người lớn–trẻ em–em bé / tổng cộng / "Đặt tour ngay" + "Tư vấn miễn phí" + hotline. Nếu đây là hướng chủ dự án muốn cho **khối hành động của trang tour**, đợt 4B lấy được ngay **phân cấp** giá → CTA chính → CTA phụ → hotline. Phần **chọn ngày và số người** là tính năng mới: site tĩnh không form (ADR-0001), kênh đặt duy nhất là Zalo (`00` §3), và `CONTENT_MODEL` chưa có lịch khởi hành (I1 cấm coi `departureNote` là lịch chỗ trống) — cần ADR riêng, không thuộc vòng này. Xin một câu: lấy phân cấp thôi, hay mở ADR cho form đặt chỗ.

Duyệt xong §6 thì đợt 4A chạy ngay (không cần mockup), Cowork sửa `06` mở đường cho 4B.

---

## 8. Đợt 4A — đã thi hành 2026-08-22

Thi hành đúng bảng §4 "Đợt 4A" sau `QĐ-2026-08-22-01`. Chưa commit — chờ chủ dự án.

| # | Việc | Đã làm | Bằng chứng trên `dist/` (build 06:51 22/08) |
|---|---|---|---|
| A1 | Sidebar dính dưới header + thanh dính | token `--sticky-bar-h: 56px`; thanh dính cao đúng token; `Sidebar` nhận prop `stickyBar` và dính ở `calc(var(--header-h) + var(--sidebar-offset) + var(--s4))` | `class="sidebar" style="--sidebar-offset:var(--sticky-bar-h)"`; CSS `top:calc(var(--header-h) + var(--sidebar-offset, 0px) + var(--s4))` |
| A2 | Thẻ lòi dòng 3 | `.card-summary` bỏ `flex:1`; `.card-meta` `margin-top:auto` | CSS thẻ không còn `flex:1` ở summary (kiểm bằng mắt khi duyệt) |
| A3 | Một bảng nhãn `tourFormat` | `TOUR_FORMAT_BADGES` xoá; `both` = "Ghép hoặc riêng" | `/tour/`: 10× "Ghép hoặc riêng", 0× "Linh hoạt"; Deluxe: 0× "Cả hai" |
| A4 | CTA tự trỏ | bỏ URL cùng host `site.url` | Deluxe: 0 link `https://tourdao.vn/` trong `booking-btn`; 4 tour còn nút đều trỏ `hontamnhatrang.com` (đơn vị ngoài — đúng) |
| A5 | Nhãn | "Nguồn tham khảo" + giá trị theo host (Wikipedia/Wikidata/tên miền); website hiện tên miền; "Mở bản đồ"; "Có thu phí" bỏ; `touristType` đủ ở InfoBar | Hòn Tằm: `>Wikipedia<`, `Mở bản đồ`, `hontamnhatrang.com`; 0× "Có thu phí" |
| A6 | Neo | `Section` tự sinh `id` từ tiêu đề khi không truyền; tour thêm neo "Chi tiết", "Mùa nào nên đi" | Deluxe: `id="details"`, `id="season"`, `href="#details"`, `href="#season"` |
| A7 | `theme-color` | `themeSurface()` đọc `tokens.css`; phát `--c-surface` của bộ đang bật (giả định bề mặt: nền, không phải accent — ghi ở QĐ) | `<meta name="theme-color" content="#FFFFFF">` |
| A8 | Thang chữ | `html{font-size:100%}`, `body{font-size:var(--fs-base)}` | `html{font-size:100%`; `body{…font-size:var(--fs-base)…}` |

**Cổng sau 4A:** `astro check` 0 lỗi 0 cảnh báo · `npm run build` hoàn tất · `check:theme` 3 bộ AA · `gate:all` **5/10 đỏ** — cả 5 đều là **dữ liệu hoặc nợ cũ**, không phải 4A: `jsonld-post` I6 (3 tour có stop lịch trình trỏ điểm tham quan slug `null` → `@id …/diem-tham-quan/null/`), `r3-r4-post` (R3: `/dia-danh/hon-mun/` và `/tour/ve-hon-tam-seaday-tour/` biến mất khỏi sitemap production mà không có redirect; R4: 42 lỗi hreflang ở bài cẩm nang — `translationGroup` trỏ chéo không đối xứng), `governance-post` S24 (6 trang thiếu người duyệt/nguồn), `control-registry-gate` và `deferred-gate` (ND-004/005). `entity-layout-post` từng đỏ một lần do 4A gắn `style` lên đúng dòng validator dò `<div class="container two-col">` — đã sửa bằng cách chuyển biến sang `Sidebar`. Một cảnh báo `esbuild css minify` (`1fr}}}` ở CSS trang chủ, trước `.facts-section`) **có sẵn trên production** — không do 4A, ghi để ai sửa trang chủ thì xử.

**Hệ quả đo được còn chờ mắt người:** site nhỏ lại ~6 % ở mọi bậc chữ (A8) — chủ dự án xem bản dựng trước khi phát hành.

**Đợt 4B — bước 1 xong, `06` v2.1.0 được duyệt 2026-08-22 (QĐ-2026-08-22-02); bước 2 (Design hi-fi) đang chạy.** `06-BINDING_MAP` lên **v2.1.0**: §3 thêm bốn hàng (Thanh dính, Thông tin nhanh, Khối hành động, Bản đồ) và sửa sáu hàng (Breadcrumb, Thân bài + mục lục, Nhãn loại chỉ ở hero, Xác minh → "Nguồn tham khảo", Điện thoại, Vùng giá là ngoại lệ duy nhất); **§3.1 ma trận field × 4 entity → vùng duy nhất**; một dòng chú dưới §4.2/4.3/4.4/4.8; §6 thêm luật 1–3. Không đổi field nào của `01`. `g3` vẫn 0 fail / 15 warn (đúng baseline §7.1 — hàng mới viết sao cho `g3` không đọc nhầm field delta thành khung chung). Chủ dự án duyệt v2.1 thì mở bước 2 (Design hi-fi theo `Main`/`DiDong` vòng 4) → QA1 → Code `FactStrip`/`DetailLayout` v3.

**Đợt 4B — bước 2 (Design hi-fi) xong 2026-08-22, commit `baed88c`.** Canvas trang "Hi-fi 4B — 4 entity": `Tour` + `TourDiDong` (khối hành động = `BookingForm` ADR-0027 bước 1), `DiaDanh`, `TraiNghiem`; Điểm tham quan dùng `Main` + `DiDong` trang 1. Áp đúng §3.1: Địa danh (2 ô) và Trải nghiệm (1 ô) gộp Thông tin nhanh vào sidebar; Trải nghiệm không giá → không vùng giá, không nút thay thế; tiêu đề tour 66 ký tự hạ về `--fs-h2` (đề xuất luật "> 48 ký tự hạ một bậc"). Giá 650.000₫ / trẻ em 70 % là **mẫu** suy từ FAQ của chính tour; hotline là placeholder. **Bước 3 QA1** do tác nhân QA độc lập chạy, báo cáo ở `docs/evidence/2026-08-22-qa1-vong-4b/QA1-mockup-4b.md`; chủ dự án chốt cổng rồi mới sang bước 4 (Code).

**Đợt 4B — bước 3 (QA1) ĐẠT sau ba vòng, 2026-08-22.** Tác nhân QA độc lập chạy, báo cáo ở `docs/evidence/2026-08-22-qa1-vong-4b/` (ba file: vòng 1, vòng 2, vòng 3) cùng phản hồi của Design.

| Vòng | Kết quả | Design xử |
|---|---|---|
| 1 | **Chưa đạt** — 3 Cao, 19 TB, 7 Thấp, 10 nợ | Sửa 3 Cao + 17/19 TB + 5 Thấp; 2 TB không sửa kèm lý do; nợ mới N11, N12 (commit `95560fd`) |
| 2 | **Chưa đạt** — 0 Cao, 4 TB (V1–V4). QA rút F15 (Design đúng), chuyển F21 thành nợ N14, tách N13 | Sửa V1–V3; V4 giữ vì đã là nợ N15 (commit `e4e1d8a`) |
| 3 | **ĐẠT** — 0 Cao; chỉ V4 mở và đã có phiếu nợ; không lỗi mới; tương phản hero đạt biên rộng (bộ xấu nhất `ngoc-lam`: đoạn mở 6,6:1, huy hiệu 6,1:1) | — |

**Cổng QA1 ĐÃ CHỐT 2026-08-22** (`QĐ-2026-08-22-05` Chốt 0) — `GOVERNANCE` 3.1 đủ cả hai vế. Bước 4 (Code) mở sau khi `06` lên v2.2.

**Đợt 4B — bước 4a (Cowork sửa đặc tả) và 4b (Design sửa mockup) xong 2026-08-22.**

`06-BINDING_MAP` lên **v2.2.0** (commit `44393e7`): §3 tách hàng Breadcrumb làm hai (N3), thêm hàng "Dải liên quan" (N4), sửa hàng Thân bài cho `headingOffset` (N15b); §3.1 đổi hàng `containedInPlace` thành mắt cha; §6 ghi phạm vi luật 1 (N11) và thêm luật 4 (N13). `01-CONTENT_MODEL` lên **v1.0.19** — đúng một ô, `durationAtStop` không còn khai ISO 8601 (Chốt 7).

Hai chỗ lệch khỏi chữ đã duyệt, ghi rõ để chủ dự án rà: (a) hàng "Dải liên quan" khai cho **mọi** entity chi tiết chứ không chỉ Place/Experience/Tour như Chốt 4 ghi — vì mã cho thấy vùng này dùng chung qua `DetailLayout`, chỉ đổi nhãn; (b) bốn hàng rollup có tên riêng ở §3 là **cùng một vùng** dưới nhãn khác, đánh dấu ⚠️ để mở, chưa gộp.

Baseline cảnh báo `g3` **15 → 24** (§7.1 cập nhật): cả 9 cái mới từ đúng hàng N4, cùng nhóm giới hạn công cụ đã ghi (prop `nearby`, không phải `data.<field>`). 0 fail; `astro check` 0 lỗi 0 cảnh báo.

**Design sửa mockup:** `Tour.dc.html` bỏ mục lục (N15a — bài còn 2 tiêu đề, dưới ngưỡng ≥ 3); `Main.dc.html` **giữ** mục lục vì có 5 mục, đạt ngưỡng. Thanh dính neo vào mục (`#hl #lt #bg #ct #mua #faq`), chưa từng trỏ `#tt-1/#tt-2`, nên không hụt neo nào. Luật 4 mới kéo theo hai chỗ chưa nằm trong danh sách sửa ban đầu: `DiaDanh` "22.000 đồng" và `Tour` "70 % giá vé" nay mang ngày cập nhật và tên nguồn ngay tại chỗ.

**Bước 5 — QA1 vòng xác minh ngắn** trên đúng phần đổi, do tác nhân QA độc lập chạy. Chưa chạy.

**Sáu nợ đã gỡ 2026-08-22** (`QĐ-2026-08-22-05`), đề xuất ở `docs/specs/DE-XUAT-2026-08-22-go-N3-N15.md`: **N3** phương án A (tách hàng breadcrumb thành *điều hướng* + *mắt cha*; không sửa dòng code nào) · **N15a** A (giữ ngưỡng ≥ 3 h2, sửa mockup Tour) · **N15b** A (`Body` thêm `headingOffset`, trang chi tiết hạ một cấp; Article giữ nguyên) · **N4** thêm hàng "Dải liên quan" vào §3 · **N11** luật 1 ràng buộc *field*, không ràng buộc chuỗi · **N13** cho phép giá trong `faq` kèm ngày + nguồn + danh sách rà · **N14** đặc tả nhận khung giờ trong ngày, ghi rõ là mốc giờ dự kiến chứ không phải lịch chỗ trống. *(Sửa theo N19: bản đầu của dòng này còn kèm mệnh đề "bắt buộc sửa `serialize/tour.ts:61-63` — structured data đang sai kiểu trên production". Mệnh đề đó đã bị `QĐ-2026-08-22-06` rút ngay trong cùng đợt: `itemData` chỉ nhận `@type`/`@id`/`name`/`geo`/`sameAs`/`description`, không có ô `Duration`, nên nối khung giờ vào `description` là hợp lệ.)*

**Việc dữ liệu lộ ra khi chạy cổng (thêm vào 4D):** sửa `itinerary` của 3 tour đang trỏ điểm tham quan chưa có slug; redirect hoặc khôi phục hai URL R3; người duyệt cho 6 trang S24; `translationGroup` của bài cẩm nang.

## 7. Ngoài phạm vi

- Trang chủ (vừa qua vòng 3, `SPEC-2026-08-14-be-mat-vong-3`) — chỉ ghi nhận: h1 hiện là chuỗi từ khoá "Tour đảo Nha Trang - Vé Vinwonders - Vé Hòn Tằm"; 11 khối; không đề xuất ở vòng này.
- Header/Footer/Logo (vừa xong đợt Hero/Footer 2026-08-14).
- Đổi màu, đổi chữ, đổi token: **không**. Vòng này không thêm một mã màu hay một font nào.
- Mở entity mới, sửa schema Sanity: **không** (trừ ghi chú biên tập ở `01`).
