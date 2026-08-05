# SPEC — Pha C: cây URL và menu theo dòng dịch vụ

- **Trạng thái:** nháp v2, chờ chủ dự án duyệt cổng QA1. **Chưa sửa một dòng code nào.**
- **Ngày soạn:** 2026-08-05 (v1 sáng, v2 sau khi chủ dự án chốt menu thật)   **Người soạn:** Cowork
- **Bước PLAYBOOK:** 5 — Cấu trúc IA và schema (`05-URL_MAP + DB_SCHEMA`)
- **Loại quyết định:** cửa **một chiều** ở phần URL (`04-CONSTRAINTS` R3, mức `fail`)
- **Repo lúc soạn:** `main` tại `cb4dcbc`

---

## 1. Menu chốt

Chủ dự án chốt 2026-08-05:

```
Tour & Vé ▾          Kinh nghiệm du lịch    Đặt vé trực tuyến    Hỗ trợ    Liên hệ
  Tour đảo Nha Trang
  Tour Hòn Tằm
  Tour Mini Beach
  Vé VinWonders
  KongForest
  Tắm bùn Tháp Bà
  i-Resort
```

Bốn quyết định kèm theo:

1. **"Đặt vé trực tuyến" là nút Zalo, không phải trang.** Lấy tham số từ
   `siteSettings.contact.zaloUrl`.
2. **Vẫn bán phòng khách sạn và resort** — nhưng menu không có mục cho nó. Xem §7.
3. **"Kinh nghiệm du lịch"** là nhãn của mục `article`. Xem §4.2 về đường dẫn.
4. Hub cũ (Khám phá / Lưu trú / Đi lại) rời khỏi menu, **giữ nguyên URL**.

---

## 2. Ánh xạ menu vào mô hình dữ liệu

| Mục | `kind` | Đích | Mô hình có sẵn? |
|---|---|---|---|
| Tour & Vé ▾ | *nhóm* | 7 mục con | ⚠️ Header chưa có menu thả xuống |
| ├ Tour đảo Nha Trang | `detail` | `tour` | ✅ |
| ├ Tour Hòn Tằm | `detail` | `tour` | ✅ |
| ├ Tour Mini Beach | `detail` | `tour` | ✅ |
| ├ Vé VinWonders | `detail` | `attraction` + `bookingRef` | ✅ |
| ├ KongForest | `detail` | `attraction` + `bookingRef` | ✅ |
| ├ Tắm bùn Tháp Bà | `detail` | `attraction` + `bookingRef` | ✅ |
| └ i-Resort | `detail` | `attraction` + `bookingRef` | ✅ |
| Kinh nghiệm du lịch | `index` | `article` → `/cam-nang/` | ✅ |
| Đặt vé trực tuyến | `zalo` | `siteSettings.contact.zaloUrl` | ✅ dữ liệu đã có |
| Hỗ trợ | `static` | `/ho-tro/` | ⚠️ cần một field mới, §3 |
| Liên hệ | `static` | `/lien-he/` | ✅ dữ liệu đã có |

**Vì sao bảy sản phẩm chia hai entity.** `tour` có `itinerary`, `operator`, `tourFormat` —
đúng cho thứ bán theo chuyến. `attraction` có `bookingRef` và `isAccessibleForFree` — đúng
cho thứ bán theo vé vào cổng. Cả hai đều đã publish được, không cần entity mới.

Hòn Tằm hiện đã có một `attraction` (`khu-du-lich-hon-tam`). "Tour Hòn Tằm" là một document
`tour` **riêng**, không thay thế nó — tour gồm cả đưa đón lẫn vé, địa điểm thì vẫn là địa
điểm. Hai trang, hai vai, trỏ vào nhau.

---

## 3. Hai trang tĩnh: đường nhẹ, không cần entity mới

### 3.1 Vì sao không thêm entity `page`

Bản nháp v1 đề xuất thêm entity `page`. **Bỏ đề xuất đó.** Sau khi biết "Đặt vé trực tuyến"
chỉ là nút Zalo, số trang tĩnh cần dựng còn đúng hai, và repo đã có khuôn rẻ hơn:

`src/pages/[pickupRoutePath].astro` sinh trang `/lo-trinh-don-khach/` thẳng từ
`siteSettings.pickupPoints`. Không entity, không document, biên tập viên vẫn sửa được trong
Studio.

Cân hai đường:

| | Thêm entity `page` | Sinh từ `siteSettings` |
|---|---|---|
| Thủ tục | ADR + chủ dự án phê chuẩn (`01-CONTENT_MODEL` §5.3) | Sửa CONTENT_MODEL §2.15 + ghi `DECISIONS` (`04-CONSTRAINTS` §2.2) |
| Loại quyết định | **cửa một chiều** | cửa hai chiều |
| Đụng | `_type` mới → chạm điều cấm §2.1, gate `I` phải sửa theo | thêm field vào singleton đã có |
| Khi cần nhiều trang tĩnh về sau | hợp lý hơn | phải mở lại |

Chọn đường thứ hai cho đợt này. Nếu sau này cần thêm Điều khoản, Chính sách hoàn huỷ, Về
chúng tôi… thì lúc đó mở entity `page` là đúng lúc, và ADR sẽ có căn cứ thật thay vì suy
đoán trước.

### 3.2 `/lien-he/` — không cần field mới

Toàn bộ dữ liệu đã nằm trong `siteSettings.contact`: `hotline`, `zaloUrl`, `whatsapp`,
`email`. Cộng `brand.legalName` từ `site.config.ts`.

JSON-LD phát `ContactPage`. Đây là lý do không mượn `article`: mượn sẽ phát `Article` cho
một trang liên hệ, làm bẩn đúng lớp dữ liệu có cấu trúc mà site này đang đầu tư.

### 3.3 `/ho-tro/` — cần đúng một field mới

Chủ dự án chốt 2026-08-05: "Hỗ trợ" gồm **cả ba** — hướng dẫn đặt tour, chính sách
huỷ/hoàn, và câu hỏi thường gặp.

Thêm vào `siteSettings` đúng **một** field `support`, ba phần con. Cả ba đều dùng lại khuôn
đã có trong repo, không phát minh hình dạng mới:

| Phần | Kiểu | Khuôn dùng lại | JSON-LD |
|---|---|---|---|
| `bookingGuide` — hướng dẫn đặt tour | `array of { step, text }` | y hệt `article.howTo` (`cms/schemas/article.ts:114`) | `HowTo` + `HowToStep`, theo `serialize/article.ts:117` |
| `cancellationPolicy` — chính sách huỷ/hoàn | portable text | khuôn `body`, render bằng `Body.astro` | không phát riêng, nằm trong nội dung trang |
| `faq` — câu hỏi thường gặp | `array of faqItem` | `faqItem` đã là kiểu dùng chung đã đăng ký | `FAQPage`, theo `faqPageToLd()` |

**Một ngôn ngữ, không dựng khuôn 5 ngôn ngữ.** Tiền lệ gần nhất trong chính `siteSettings`
là `pickupPoints` (CONTENT_MODEL §2.15 v1.0.13) — khai chuỗi thẳng, không bọc object đa ngữ.
`support` theo đúng nó, khớp `langs = ['vi']`. Bọc sẵn 5 ngôn ngữ cho một site chạy một
ngôn ngữ chính là hình dạng đã sinh ra DR-012 và DR-024.

**Thứ tự ba phần hiển thị trên trang là quyết định bề mặt, thuộc pha F**, không chốt ở đây.
Spec này chỉ khai dữ liệu có gì.

> **Thứ tự thao tác bắt buộc** (`04-CONSTRAINTS` §2.2): sửa `01-CONTENT_MODEL` §2.15 trước →
> ghi `DECISIONS` → rồi mới sửa `cms/schemas/siteSettings.ts` và code. Làm ngược là đúng
> điều cấm số 2 của mục 2.

---

## 4. Cây URL

### 4.1 URL mới

| URL | Nguồn | Ghi chú |
|---|---|---|
| `/tour/<slug>/` × 3 | `tour` | 2 chưa có document |
| `/diem-tham-quan/<slug>/` × 4 | `attraction` | 4 chưa có document |
| `/ho-tro/` | `siteSettings.support` | trang mới |
| `/lien-he/` | `siteSettings.contact` | trang mới |

### 4.2 `/cam-nang/` giữ nguyên đường dẫn

**Giả định tôi đang đi theo, anh bác thì tôi sửa:** nhãn menu đổi thành "Kinh nghiệm du
lịch", **đường dẫn giữ `/cam-nang/`**.

Lý do: nhãn và đường dẫn không bắt buộc phải trùng nhau, mà `/cam-nang/` đã có bài lên
Google. Đổi segment là quyết định SEO một chiều, đổi nhãn thì không mất gì. Muốn đổi cả
đường dẫn thành `/kinh-nghiem-du-lich/` thì chỉ là một dòng trong `ROUTE_TABLE` cộng một
dòng 301 — làm lúc nào cũng được, nhưng không nên gộp vào đợt này cho đỡ lẫn nguyên nhân
nếu thứ hạng biến động.

### 4.3 Chuyển hướng 301

**Repo chưa có `public/_redirects`.** Phải tạo mới. Với menu này, **hiện chưa có dòng nào** —
không URL nào đang tồn tại bị đổi nghĩa hay biến mất.

(Bản v1 có một dòng cho `lan-bien`. Menu mới không dùng trang danh mục "Lặn biển" nữa, nên
document `experience` giữ nguyên slug `lan-bien` và **không cần đổi gì**. Đây là chỗ menu
thật đơn giản hoá được so với bản nháp.)

Vẫn tạo file rỗng kèm chú thích, để pha sau có sẵn chỗ và R3 có cái để so.

### 4.4 URL không đổi

Toàn bộ 20 URL hiện có giữ nguyên, gồm cả ba hub rời khỏi menu (`/kham-pha/`, `/luu-tru/`,
`/di-lai/`) và `/tat-ca/`. **Pha C không xoá URL nào.** Gỡ khỏi menu là quyết định điều
hướng; xoá URL là quyết định SEO — việc thứ hai chưa cần làm.

---

## 5. Khai menu trong `site.config.ts`

Trả DR-007, đúng nếp `ADR-0021`.

```ts
export const nav = [
  {
    label: 'Tour & Vé',
    children: [
      { label: 'Tour đảo Nha Trang', kind: 'detail', target: 'tour/…' },
      { label: 'Tour Hòn Tằm',       kind: 'detail', target: 'tour/…' },
      { label: 'Tour Mini Beach',    kind: 'detail', target: 'tour/…' },
      { label: 'Vé VinWonders',      kind: 'detail', target: 'attraction/…' },
      { label: 'KongForest',         kind: 'detail', target: 'attraction/…' },
      { label: 'Tắm bùn Tháp Bà',    kind: 'detail', target: 'attraction/…' },
      { label: 'i-Resort',           kind: 'detail', target: 'attraction/…' },
    ],
  },
  { label: 'Kinh nghiệm du lịch', kind: 'index',  target: 'article' },
  { label: 'Đặt vé trực tuyến',   kind: 'zalo' },
  { label: 'Hỗ trợ',              kind: 'static', target: 'ho-tro' },
  { label: 'Liên hệ',             kind: 'static', target: 'lien-he' },
] as const
```

Sáu `kind`: `index` · `hub` · `term` · `detail` · `static` · `zalo`.

`zalo` không mang `target`: nó đọc `siteSettings.contact.zaloUrl` lúc build. Chưa đặt số
Zalo trong Studio thì mục này **không render** — không có nút chết.

`hub` và `term` chưa dùng trong menu này, nhưng giữ trong bộ `kind` vì `/luu-tru/` (§7) và
các danh mục về sau sẽ cần.

### 5.1 Bộ kiểm chống menu trỏ vào chỗ trống — mức `fail`

Thêm vào bộ kiểm chống lệch đã dựng sẵn ở `src/lib/routes.ts`:

> Mọi `target` trong `nav` phải trỏ tới một trang mà lần build này **thực sự sinh ra**.

Đây là siết thêm, tự do theo `04-CONSTRAINTS` §5.

**Hệ quả trực tiếp, phải nói rõ:** với dữ liệu hôm nay, khai đủ bảy mục con là **build đỏ
ngay**, vì sáu sản phẩm chưa có document. Đó là hành vi đúng — nhưng nó có nghĩa menu phải
lên **theo từng đợt**, khai tới đâu có hàng tới đó. Xem §6.

---

## 6. Nội dung: ràng buộc thật của đợt này

Đo trên `dist/` sau build, không ước lượng.

| Mục menu | Document cần | Đang có |
|---|---|---|
| Tour đảo Nha Trang | 1 | **1** (slug `tour-3-dao-nha-trang-review-chi-tiet` — `ND-002` đã nghi nhập nhầm khuôn bài viết) |
| Tour Hòn Tằm | 1 | 0 |
| Tour Mini Beach | 1 | 0 |
| Vé VinWonders | 1 | 0 |
| KongForest | 1 | 0 |
| Tắm bùn Tháp Bà | 1 | 0 |
| i-Resort | 1 | 0 |
| Kinh nghiệm du lịch | ≥1 | 1 |
| Hỗ trợ | field `support` | chưa có |
| Liên hệ | `contact` | đã có |

**6 trên 7 sản phẩm chưa tồn tại.** Cấu trúc thì dựng được ngay và không phụ thuộc điều
này; nhưng menu chỉ hiện đủ khi có hàng, và pha F sẽ thiết kế trên dữ liệu mỏng nếu tới lúc
đó vẫn vậy.

**Đề nghị chia hai nhịp:**

- **Nhịp 1 (làm được ngay):** dựng cơ chế `nav`, hai trang tĩnh, bộ kiểm §5.1. Menu khai 4
  mục: Tour & Vé (chỉ Tour đảo Nha Trang), Kinh nghiệm du lịch, Đặt vé trực tuyến, Hỗ trợ,
  Liên hệ.
- **Nhịp 2:** chủ dự án nhập 6 sản phẩm còn lại vào Studio, mỗi lần xong một cái thì thêm
  một dòng vào `nav`. Không cần lập trình viên.

---

## 7. Khách sạn và resort — khoảng trống đã biết

Chủ dự án xác nhận vẫn bán phòng, nhưng menu chốt không có mục cho nó. Và hiện `/khach-san/`,
`/resort/`, `/luu-tru/` đều **0 document**, đang hiện khối "chưa có nội dung".

Không tự thêm mục menu mà chủ dự án không yêu cầu. Ba đường, để chủ dự án chọn khi có nội
dung:

1. Thêm mục thứ sáu "Khách sạn & Resort" → `/luu-tru/` (hub đã có sẵn, gom cả hai).
2. Đưa vào nhóm "Tour & Vé" — nhưng nhóm đó đang là danh sách sản phẩm cụ thể, thêm một
   mục dạng danh sách vào sẽ lệch khuôn.
3. Không lên menu chính; vào từ khối trang chủ và chân trang.

**Cho tới lúc đó:** `/luu-tru/` vẫn sống, vẫn vào sitemap, chỉ không có lối vào từ menu.
Ghi thành phiếu nợ để không rơi mất.

---

## 8. File sẽ đụng

| File | Phạm vi |
|---|---|
| `src/site.config.ts` | Thêm khối `nav` (§5). Không đụng `entities`, `hubs`, `langs`. |
| `src/lib/routes.ts` | Hàm phân giải `nav` → URL; bộ kiểm §5.1. |
| `src/components/Header.astro` | Bỏ mảng hardcode dòng 24; đọc `nav`; **thêm menu thả xuống** cho nhóm có `children`. |
| `src/components/Footer.astro` | Bỏ hai mảng hardcode dòng 32–33. |
| `src/lib/homepage.ts` | Gỡ `quickLinks` lặp năm lần theo ngôn ngữ. |
| `src/pages/ho-tro.astro`, `src/pages/lien-he.astro` | **Tạo mới**, khuôn `[pickupRoutePath].astro`. |
| `src/lib/queries/siteSettings.ts` | Chiếu thêm `support`. |
| `cms/schemas/siteSettings.ts` | Thêm field `support` — **sau khi** CONTENT_MODEL đã sửa. |
| `docs/core-specs/01-CONTENT_MODEL.md` | §2.15 thêm `support`. **Làm trước code** (§2.2). |
| `docs/core-specs/05-URL_MAP-and-DB_SCHEMA.md` | Viết lại: host `tourdao.vn`, bỏ 4 nhánh đã tắt, thêm `tat-ca`, `ho-tro`, `lien-he`, một cột ngôn ngữ. Đóng DR-004. |
| `public/_redirects` | Tạo mới, hiện rỗng kèm chú thích. |

**Không đụng:** `06-BINDING_MAP` (pha E), màu sắc và bố cục (pha F), `scripts/`, và bất kỳ
entity nào trong `cms/schemas/` ngoài `siteSettings`.

---

## 9. Cách chứng minh đã xong

| | Bằng chứng |
|---|---|
| **BC-1** (E1) | `npm run build` đi hết. Danh sách URL trước/sau: 20 URL cũ còn nguyên, thêm `/ho-tro/` và `/lien-he/`. |
| **BC-2** (E1) | `gate:all` giữ 9 xanh / 1 đỏ. **R1–R4 phải xanh.** |
| **BC-3** (E1) | Bộ kiểm §5.1 chứng minh **hai chiều**: khai một `target` chưa có document thì build **dừng** kèm thông báo chỉ đúng chỗ; khai đúng thì đi hết. Thiếu chiều "dừng" thì phép kiểm coi như chưa tồn tại — bài học DR-020, DR-021. |
| **BC-4** (E1) | Xoá `zaloUrl` trong Studio → mục "Đặt vé trực tuyến" biến mất khỏi menu, build vẫn đi hết. Không có nút chết. |
| **BC-5** (E1) | `grep` chứng minh không còn danh sách điều hướng hardcode nào ở `Header.astro`, `Footer.astro`, `homepage.ts`. Đóng DR-007 phần code. |
| **BC-6** (E1) | JSON-LD: `/lien-he/` phát `ContactPage`; `/ho-tro/` phát `FAQPage` khi có hỏi–đáp và `HowTo` khi có hướng dẫn đặt tour. `jsonld-post` (I6) xanh — đây là cổng `fail`, không phải hình thức. |
| **BC-7** (E1) | Ba phần của `support` độc lập nhau: để trống `bookingGuide` thì trang vẫn dựng, chỉ mất khối đó và mất node `HowTo`; tương tự với hai phần kia. Chạy được nhờ kiểu đã khai thật ở gói dữ liệu thiếu (`114010a`). |
| **BC-8** (E2) | Menu render đúng, nhóm "Tour & Vé" mở ra được bằng bàn phím lẫn chuột. |

---

## 10. Phần cố ý để lại

- **Nội dung 6 sản phẩm** — việc của chủ dự án trong Studio, xem §6.
- **Khách sạn & resort trên menu** — §7, chờ có nội dung.
- **Entity `Transfer`** (đưa đón sân bay) — đã hoãn.
- **Entity `page`** — chưa cần, xem §3.1. Mở lại khi số trang tĩnh vượt hai.
- **Slug `tour-3-dao-nha-trang-review-chi-tiet`** — nghi nhập nhầm (`ND-002`). Đổi thì cần
  301, nên gộp vào một đợt dọn slug riêng chứ không lẫn vào đây.
- **`06-BINDING_MAP`** — trang `/ho-tro/`, `/lien-he/` và menu nhóm đều cần bảng ánh xạ mới.
  Đó là pha E, và cổng cứng bắt pha E xong mới sang được pha F.
- **Đa ngôn ngữ** — `nav` khai một ngôn ngữ, khớp `langs = ['vi']`. Không dựng sẵn khuôn 5
  ngôn ngữ; đó đúng là lỗi DR-012 và DR-024 đã phải đi sửa hai lần.

---

## 11. Điểm dừng

**Dừng, chờ chủ dự án duyệt cổng QA1** (`GOVERNANCE` 4.2).

Mọi câu hỏi mở đã được trả lời. Còn đúng ba mục cần chữ ký:

1. **§3 — đường nhẹ thay cho entity `page`.** Sinh hai trang tĩnh từ `siteSettings` theo
   khuôn `/lo-trinh-don-khach/`, thay vì mở một `_type` mới. Đổi một cửa một chiều thành
   cửa hai chiều.
2. **§4.2 — giữ đường dẫn `/cam-nang/`, chỉ đổi nhãn** thành "Kinh nghiệm du lịch". Đây là
   giả định tôi đang đi theo; bác thì sửa một dòng `ROUTE_TABLE` cộng một dòng 301.
3. **§6 — chia hai nhịp.** Nhịp 1 dựng cơ chế và khai những mục đã có hàng; nhịp 2 chủ dự án
   nhập từng sản phẩm rồi thêm dòng vào `nav`, không cần lập trình viên.

Duyệt xong thì Code chạy được, theo đúng thứ tự thao tác ở §3.3 (CONTENT_MODEL trước, code
sau).

### Ghi chú bàn giao

Hai phiếu nợ nên được ghi vào `DECISIONS.md` khi duyệt spec này — sổ chỉ thêm, và ghi vào là
việc của chủ dự án:

- **Đưa đón sân bay / entity `Transfer`** — đã hoãn 2026-08-05.
- **Khách sạn & resort chưa có lối vào từ menu** — §7, ba đường đã nêu, chờ có nội dung.
