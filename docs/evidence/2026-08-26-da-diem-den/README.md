# Bằng chứng — Task 8: cổng đầy đủ, bản dựng thật, nghiệm thu

**Ngày chạy:** 2026-08-26 (kế hoạch dự kiến 2026-09-01; hạn mức API Sanity mở lại sớm hơn).
**Việc:** ADR-0028 / `docs/plans/2026-08-26-da-diem-den.md` Task 8.
**Nhánh:** `feat-da-diem-den`.

## Trạng thái: 10/10 bước XONG (bước 1–4, 7–10 chạy 2026-08-26; bước 5–6 ngày 2026-08-27).

| Bước | Việc | Kết quả |
|---|---|---|
| 1 | `validate` — bất biến trên dữ liệu thật | **đạt** — 0 fail mới, I20 pass |
| 2 | `npm run gate` — bộ cổng đầy đủ | **đạt có điều kiện** — 4 cổng đỏ, tất cả có sẵn từ trước |
| 3 | `audit:gate` — cổng kiểm chính bộ kiểm | **đạt** — `GA3/I20` đã đóng |
| 4 | `npm run build` + trang chủ không đổi | **đạt** — 4/4/0 giữ nguyên |
| 5 | Chủ dự án tạo Điểm đến thứ hai trong Studio | **đạt** — Ninh Thuận, 1 Place + 1 Article |
| 6 | Dựng lại + nghiệm thu trên trang thật | **đạt** — xem `buoc-6-nghiem-thu-trang-that.txt` |
| 7 | Thử hàng rào menu | **đạt** — build dừng đúng chỗ |
| 8 | Ghi bằng chứng | thư mục này |
| 9 | Chốt quyết định | **đã xong từ trước**, xem dưới |
| 10 | Commit | commit chứa thư mục này |

**Bước 5 chỉ làm được sau khi vá `DR-052`** — điều hướng Studio khai `touristDestination` là singleton ghim cứng `seed.nha-trang`, không có nút tạo mới. Kế hoạch không liệt kê `cms/lib/structure.ts`, nên khâu cuối để *nhập được* điểm đến thứ hai bị bỏ sót dù mọi tầng dưới đã sẵn sàng.

## Đọc nhanh từng bước

**Bước 1.** 11 FAIL — **đúng bộ 11 đã có** trong `DR-044` (`I1 I2 I3 I4 I5 I12 I13 I14 I19 R2 S25`), **0 fail mới**. `I20: pass` với 0 lỗi, vì Task 7 đã nạp bù hết 211 document. Số validator 31 → 32.

**Bước 2.** Bốn cổng đỏ: `r3-r4-post` (R4), `governance-post` (S24), `control-registry-gate`, `deferred-gate`. Đối chiếu `postbuild-status.json` trước/sau cho thấy **I6 và R3 đã ĐỎ→XANH**; R4 vốn đã đỏ (42 lỗi) nay 54 — 100% lỗi nằm ở hreflang của trang `/cam-nang/`, không lỗi nào chạm trang chủ, trang điểm đến, hay field `destination`. Hai cổng còn lại là hệ quả của R4 và của `I16` — mà diff `cc7a2bd..HEAD` trên `control-registry.yaml` **chỉ thêm khối I20, không nhắc I16 dòng nào**. `g1` fail 0 / warn 14 đúng mốc, `g3`/`g4` fail 0.

**Bước 3.** 37 đạt / 27 trượt, so với mốc 24/8 là 35 đạt / 28 trượt. Diff danh sách trượt: `28d27 < GA2` — **không có mục trượt mới**, một mục cũ đã đóng. `GA3/I20` đạt.

**Bước 4 — phép kiểm quan trọng nhất của cả đợt.** Trang chủ giữ nguyên 4 card khu vực, 4 card cẩm nang, 3 card tour, 0 card điểm đến. Nghĩa là mệnh đề lọc `destination._ref == ^._id` của Task 4 khớp đúng dữ liệu Task 7 vừa nạp bù — nếu nạp bù trỏ sai (chẳng hạn vào bản nháp) thì hai khối này đã rỗng.

**Bước 7.** Menu trỏ slug không tồn tại → build dừng với `exit=1` và nêu đúng `/diem-den-khong-ton-tai/`.

**Bước 9 — đã xong từ trước**, ở commit `cc7a2bd`: `ADR-0028` trạng thái `accepted` kèm ngày và người phê chuẩn; `QĐ-2026-08-26-01` trong `docs/DECISIONS.md`; mục ADR-0028 trong `docs/adr/README.md`.

## Tám tiêu chí nghiệm thu của spec §7

| # | Tiêu chí | Kết quả |
|---|---|---|
| 1 | Studio hiện ô "Điểm đến" trên đủ mười type; `touristDestination` không có | **đạt** — bundle Studio có 1 khai báo + 10 lần dùng `destinationField` |
| 2 | `count(… && !defined(destination)) == 0` | **đạt** — Task 7, 211/211 |
| 3 | `npm run gate` 0 fail; g1 warn ≤ 14 | **một phần** — g1 warn 14 đạt; 4 cổng đỏ đều có sẵn từ trước đợt |
| 4 | `npm run build` xanh; `/` giữ nguyên nội dung | **đạt** — 4/4/3 giữ nguyên |
| 5 | Điểm đến thứ hai có trang trong `dist/` và trong sitemap | **đạt** — `/ninh-thuan/` + `sitemap-vi.xml` |
| 6 | Khối "Điểm đến khác" ẩn khi một, hiện khi hai | **đạt** — `dest-card` 0 → 1 |
| 7 | Menu trỏ slug không tồn tại → build dừng | **đạt** — exit 1, nêu đúng đường dẫn |
| 8 | `01-CONTENT_MODEL` không còn khai cardinality là 1 | **đạt** — Task 1, đổi thành `N (ADR-0028)` |

Cộng thêm `DR-048` (breadcrumb) đã kiểm xong và đóng.

**Tiêu chí 3 là cái duy nhất không đạt nguyên văn.** Bốn cổng đỏ — `r3-r4-post` (R4 hreflang bài viết), `governance-post` (S24 thiếu người duyệt), `control-registry-gate` (hệ quả của R4), `deferred-gate` (về I16) — **đều đã đỏ trước đợt này** và không cái nào liên quan tới `destination`. Kế hoạch ước lượng thấp nợ cổng có sẵn.

## Sai lệch so với kế hoạch

1. **Đảo thứ tự bước 2 và bước 4.** `npm run gate` gồm cổng post-build đọc `dist/`; chạy trước khi dựng là soi bản dựng cũ và cho kết quả sai lệch. Đã dựng trước, rồi mới chạy cổng. Việc này cũng làm `GA2` chuyển sang đạt.
2. **Phép đếm ở bước 4.** Kế hoạch viết `grep -c "area-card" dist/index.html` và mong số 4. `grep -c` đếm **dòng**, mà HTML dựng ra nằm trên một dòng, nên nó luôn trả 1. Đổi sang `grep -o … | wc -l` để đếm lần xuất hiện.
3. **Kỳ vọng "0 fail" ở bước 2 không đạt được nguyên văn** — 4 cổng đỏ, nhưng tất cả đều đã đỏ trước đợt này và không cái nào liên quan tới `destination`. Kế hoạch đã ước lượng thấp nợ cổng có sẵn.
4. **Thư mục bằng chứng** đặt tên theo ngày chạy thật thay vì `2026-09-01-…` như kế hoạch viết sẵn.
