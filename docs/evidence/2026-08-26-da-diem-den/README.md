# Bằng chứng — Task 8: cổng đầy đủ, bản dựng thật, nghiệm thu

**Ngày chạy:** 2026-08-26 (kế hoạch dự kiến 2026-09-01; hạn mức API Sanity mở lại sớm hơn).
**Việc:** ADR-0028 / `docs/plans/2026-08-26-da-diem-den.md` Task 8.
**Nhánh:** `feat-da-diem-den`.

## Trạng thái: 8/10 bước xong. Bước 5 và 6 CHỜ NGƯỜI.

| Bước | Việc | Kết quả |
|---|---|---|
| 1 | `validate` — bất biến trên dữ liệu thật | **đạt** — 0 fail mới, I20 pass |
| 2 | `npm run gate` — bộ cổng đầy đủ | **đạt có điều kiện** — 4 cổng đỏ, tất cả có sẵn từ trước |
| 3 | `audit:gate` — cổng kiểm chính bộ kiểm | **đạt** — `GA3/I20` đã đóng; ít hơn mốc một fail |
| 4 | `npm run build` + trang chủ không đổi | **đạt** — 4/4/0 giữ nguyên |
| 5 | Chủ dự án tạo Điểm đến thứ hai trong Studio | **CHỜ NGƯỜI** |
| 6 | Dựng lại + nghiệm thu trên trang thật | **chặn bởi bước 5** |
| 7 | Thử hàng rào menu | **đạt** — build dừng đúng chỗ |
| 8 | Ghi bằng chứng | thư mục này |
| 9 | Chốt quyết định | **đã xong từ trước**, xem dưới |
| 10 | Commit | commit chứa thư mục này |

## Đọc nhanh từng bước

**Bước 1.** 11 FAIL — **đúng bộ 11 đã có** trong `DR-044` (`I1 I2 I3 I4 I5 I12 I13 I14 I19 R2 S25`), **0 fail mới**. `I20: pass` với 0 lỗi, vì Task 7 đã nạp bù hết 211 document. Số validator 31 → 32.

**Bước 2.** Bốn cổng đỏ: `r3-r4-post` (R4), `governance-post` (S24), `control-registry-gate`, `deferred-gate`. Đối chiếu `postbuild-status.json` trước/sau cho thấy **I6 và R3 đã ĐỎ→XANH**; R4 vốn đã đỏ (42 lỗi) nay 54 — 100% lỗi nằm ở hreflang của trang `/cam-nang/`, không lỗi nào chạm trang chủ, trang điểm đến, hay field `destination`. Hai cổng còn lại là hệ quả của R4 và của `I16` — mà diff `cc7a2bd..HEAD` trên `control-registry.yaml` **chỉ thêm khối I20, không nhắc I16 dòng nào**. `g1` fail 0 / warn 14 đúng mốc, `g3`/`g4` fail 0.

**Bước 3.** 37 đạt / 27 trượt, so với mốc 24/8 là 35 đạt / 28 trượt. Diff danh sách trượt: `28d27 < GA2` — **không có mục trượt mới**, một mục cũ đã đóng. `GA3/I20` đạt.

**Bước 4 — phép kiểm quan trọng nhất của cả đợt.** Trang chủ giữ nguyên 4 card khu vực, 4 card cẩm nang, 3 card tour, 0 card điểm đến. Nghĩa là mệnh đề lọc `destination._ref == ^._id` của Task 4 khớp đúng dữ liệu Task 7 vừa nạp bù — nếu nạp bù trỏ sai (chẳng hạn vào bản nháp) thì hai khối này đã rỗng.

**Bước 7.** Menu trỏ slug không tồn tại → build dừng với `exit=1` và nêu đúng `/diem-den-khong-ton-tai/`.

**Bước 9 — đã xong từ trước**, ở commit `cc7a2bd`: `ADR-0028` trạng thái `accepted` kèm ngày và người phê chuẩn; `QĐ-2026-08-26-01` trong `docs/DECISIONS.md`; mục ADR-0028 trong `docs/adr/README.md`.

## ⚠ Còn thiếu để nghiệm thu trọn vẹn

**Bước 5 là việc của người, không phải của tác nhân.** Chủ dự án tạo Điểm đến thứ hai trong Studio, tối thiểu: `title.vi`, `slug.vi`, `summary.vi`, `mainImage`, `reviewStatus = approved`. Rồi gán `destination` cho ít nhất một Place và một Article thuộc điểm đến đó.

Chừng nào chưa có, **ba tiêu chí nghiệm thu của spec §7 chưa kiểm được**:

| # | Tiêu chí | Vì sao chưa kiểm được |
|---|---|---|
| 5 | Điểm đến thứ hai có trang trong `dist/` và trong sitemap | chưa có điểm đến thứ hai đủ slug |
| 6 | Khối "Điểm đến khác" **hiện** khi có hai | mới chứng minh được nửa "ẩn khi một" |
| — | Breadcrumb trang điểm đến thứ hai (`DR-048`) | nhánh `Breadcrumb.astro:43` chưa từng chạy trên trang thật |

Dataset hiện có **hai** `touristDestination`, nhưng cái thứ hai — "Tỉnh Khánh Hòa" (`d5b267a3-a771-4cb2-8a50-8733da6372b5`, đã `approved`) — **thiếu cả `slug.vi` lẫn `summary.vi`** (chính nó cũng là một trong các lỗi `S25` của bước 1). Nó không sinh trang và không lọt `otherDestinationsQuery`. Điền slug cho nó là một cách thoả bước 5, nếu đó đúng là điểm đến muốn mở.

## Sai lệch so với kế hoạch

1. **Đảo thứ tự bước 2 và bước 4.** `npm run gate` gồm cổng post-build đọc `dist/`; chạy trước khi dựng là soi bản dựng cũ và cho kết quả sai lệch. Đã dựng trước, rồi mới chạy cổng. Việc này cũng làm `GA2` chuyển sang đạt.
2. **Phép đếm ở bước 4.** Kế hoạch viết `grep -c "area-card" dist/index.html` và mong số 4. `grep -c` đếm **dòng**, mà HTML dựng ra nằm trên một dòng, nên nó luôn trả 1. Đổi sang `grep -o … | wc -l` để đếm lần xuất hiện.
3. **Kỳ vọng "0 fail" ở bước 2 không đạt được nguyên văn** — 4 cổng đỏ, nhưng tất cả đều đã đỏ trước đợt này và không cái nào liên quan tới `destination`. Kế hoạch đã ước lượng thấp nợ cổng có sẵn.
4. **Thư mục bằng chứng** đặt tên theo ngày chạy thật thay vì `2026-09-01-…` như kế hoạch viết sẵn.
