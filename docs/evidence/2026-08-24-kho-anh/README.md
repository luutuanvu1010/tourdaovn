# Bằng chứng — kho ảnh của các trang đang lên sóng

Đo ngày **2026-08-24** để nuôi `QĐ-2026-08-24-03` (hạng mục ảnh vào `SPEC-2026-08-22-be-mat-vong-5`).
Mọi con số trong phiếu đó truy về đúng hai script ở đây.

## Chạy lại

```
node docs/evidence/2026-08-24-kho-anh/do-anh.mjs .env
node docs/evidence/2026-08-24-kho-anh/doi-chieu-dist.mjs . .env
node docs/evidence/2026-08-24-kho-anh/kiem-phong-anh.mjs
```

Script đọc `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, `SANITY_READ_TOKEN` từ file `.env`
được truyền vào. **Không** ghi token ra đâu cả; `.env` vẫn nằm ngoài git.

## Hai script làm gì

| File | Đo gì |
|---|---|
| `do-anh.mjs` | Kho ảnh của 6 loại entity: thiếu ảnh, thiếu `alt`, độ phân giải so với mốc từng vai, hướng khung, ảnh dùng lại |
| `doi-chieu-dist.mjs` | Đối chiếu slug "lên sóng" theo Sanity với thư mục thật trong `dist/` — dùng để giải thích chênh lệch số trang |
| `kiem-phong-anh.mjs` | Sanity CDN có phóng ảnh lên khi `?w=` vượt cỡ gốc không, và phí bao nhiêu byte. Không cần token |

Kết quả lần đo: `ket-qua-anh.txt`, `ket-qua-doi-chieu.txt`, `ket-qua-phong-anh.txt`.

## Ba điều phải biết khi đọc lại số

**1. "Lên sóng" nghĩa là gì.** Bộ lọc chép đúng `src/lib/sanity.ts:162`:
`reviewStatus == "approved" && defined(slug.vi.current) && defined(title.vi)`.
Tài liệu đã phát hành nhưng còn `reviewStatus: "draft"` **không** tính — chúng không ra trang.

**2. Mốc phân giải lấy từ mã, không tự đặt.** Ba mốc trong `do-anh.mjs` là ba con số mà chính
component đang truyền cho `imageUrl()`:

| Mốc | Nơi khai |
|---|---|
| 1800px | `SiteHome.astro:121`, `HomeHero.astro:27`, `Footer.astro:57` |
| 1200px | `Hero.astro:20` — hero trang chi tiết |
| 640px | `Hero.astro:29` ô mosaic, `Card.astro` thẻ lưới |

Ảnh hẹp hơn mốc thì Sanity CDN **vẫn phóng lên** — đây là chỗ dễ đoán sai nên đã đo bằng
`kiem-phong-anh.mjs`, tải thật và đọc kích thước pixel từ header file:

| Ca | Gốc | Mã xin | CDN trả về | Byte đang tải | Byte nếu xin đúng cỡ gốc | Phí |
|---|---|---|---|---|---|---|
| `attraction/thac-ta-gu` | 399×501 | `w=1200` | **1200×1507** | 283.013 | 59.279 | **+223.734 (+377%)** |
| Hero **trang chủ** | 1280×720 | `w=1800` | **1800×1013** | 232.531 | 164.493 | **+68.038 (+41%)** |

Nghĩa là ảnh dưới mốc bị trả giá **hai lần**: vừa mềm vì không có thêm chi tiết nào để hiện,
vừa **nặng hơn cả ảnh gốc** vì CDN nội suy lên rồi nén lại. Riêng hero trang chủ phí **68.038
byte** — bằng **76% toàn bộ ngân sách font của site** (89.196 byte, `QĐ-2026-08-24-02`) — và nó
gần như chắc chắn là phần tử LCP, tức đụng thẳng **R5**.

**3. Số của phiếu này và số của `QĐ-2026-08-24-02` khác nhau, cả hai đều đúng.** `QĐ-2026-08-24-02`
đếm trên bản dựng `dist/` lúc **09:37 ngày 2026-08-24** (Tour 23, Khách sạn 6). Phiếu này đọc Sanity
**sau giờ đó** (Tour 27, Khách sạn 10). `ket-qua-doi-chieu.txt` chỉ đích danh **10 tài liệu được
duyệt sau giờ dựng** — 6 tour du thuyền và 4 khách sạn. Đo lại vào lúc khác thì con số sẽ lại khác;
**luôn ghi mốc đo kèm con số.**
