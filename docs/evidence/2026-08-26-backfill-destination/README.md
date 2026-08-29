# Bằng chứng — Task 7: nạp bù field `destination`

**Ngày chạy:** 2026-08-26 (kế hoạch dự kiến 2026-09-01; hạn mức API Sanity mở lại sớm hơn — xem "Sai lệch so với kế hoạch" dưới).
**Việc:** ADR-0028 / `docs/plans/2026-08-26-da-diem-den.md` Task 7.
**Nhánh:** `feat-da-diem-den`. **Không sửa file mã nào** — task này đổi **dữ liệu**.

## Kết quả

`destination` = `seed.nha-trang` đã đặt cho **211/211** document thuộc mười entity (`place`, `attraction`, `experience`, `hotel`, `resort`, `tour`, `article`, `restaurant`, `specialty`, `event`). **0** còn thiếu.

## Các bước và tệp

| Tệp | Bước |
|---|---|
| `buoc-1-dry-run.txt` | Chạy khô. 209 document thiếu, target `seed.nha-trang`. |
| `buoc-3-sao-luu.txt` | Sao lưu trước khi ghi → `backups/backup-2026-08-26-02-04.ndjson`, **1283 document**, 6,2 MB. Kiểm: 0 dòng JSON hỏng, chứa đúng 209 document của mười entity. |
| `buoc-4-live.txt` | Ghi thật lượt 1. Nạp bù 209/209, nhưng phép đếm lại báo **còn thiếu 1** → script `exit(1)` đúng thiết kế. |
| `buoc-4b-live-luot-2.txt` | Ghi thật lượt 2. Nạp bù 2/2. **Còn thiếu: 0**. |
| `buoc-5-kiem-doc-lap.txt` | Kiểm độc lập qua Content API, không tin dòng in của script. |

## Vì sao phải chạy hai lượt

Hai document xuất hiện **trong lúc** lượt 1 đang chạy, nên không có trong danh sách 209 mà lượt 1 đã lấy:

- `drafts.3f05baf2-9df0-4958-abd7-6a0dd1acbc68` — tour "Vé Vinwonders Nha Trang sau 16:00"
- `drafts.c4ee5a81-d768-46e4-9425-baa103aafe42` — tour "Vé Vinwonders tiêu chuẩn + Buffet 350,000 VNĐ"

Đối chiếu với bản sao lưu chụp lúc 02:04 (trước khi ghi): **cả hai đều không có trong đó**, chỉ có bản published tương ứng. Bản published của cả hai đã nhận `destination` ở lượt 1 (`_updatedAt` 02:08:51 và 02:09:09); hai bản nháp thì chưa.

Script dùng `setIfMissing` nên chạy lại không đè giá trị nào — lượt 2 chỉ chạm đúng 2 document đó. Tổng document mười entity vì thế đi từ 209 lên **211**.

Chưa truy được nguyên nhân hai bản nháp sinh ra: có thể ai đó đang mở Studio và sửa nhóm sản phẩm vé Vinwonders, hoặc là hành vi tạo bản nháp của chính Sanity khi document published bị patch. **Không chặn Task 7** — trạng thái cuối đã kiểm là đúng — nhưng đáng để mắt nếu con số lại lệch ở Task 8.

## Sai lệch so với kế hoạch

1. **Ngày.** Kế hoạch đặt Task 7 sau 2026-09-01 vì hạn mức API Sanity. Thực tế 2026-08-26 truy vấn và ghi đều chạy được, không còn `plan_limit_reached`.
2. **Số lượng.** Kế hoạch nêu con số tham chiếu ~57 theo bản sao lưu 2026-08-14 và dặn "lệch nhiều thì dừng và hỏi". Thực tế 209 — **bằng đúng tổng số document** của mười entity, hợp lý vì field mới sinh thì chưa ai có. Chủ dự án xem số và duyệt trước khi chạy `--live`.
3. **Điều kiện tiên quyết #2 sai.** Kế hoạch ghi `.env` không có `SANITY_WRITE_TOKEN`; thực tế có.
4. **Điều kiện tiên quyết #3 CHƯA đạt.** Task 1 chưa merge (PR #11 còn draft), nên schema Studio đang chạy chưa khai `destination`. Dữ liệu đã ghi vẫn đúng — Sanity không đòi schema ở tầng API — nhưng trong Studio, 211 document sẽ hiện `destination` ở mục field ngoài schema cho tới khi triển khai schema mới. Xem cảnh báo dưới.
5. **Thư mục bằng chứng** đặt tên theo ngày chạy thật (`2026-08-26-…`) thay vì `2026-09-01-…` như kế hoạch viết sẵn.

## ⚠ Việc phải làm tiếp

**Triển khai schema Studio** (`npm --prefix cms run deploy`) sớm. Chừng nào Studio đang chạy chưa biết field `destination`, biên tập viên mở một trong 211 document sẽ thấy nó nằm ngoài schema và **có thể bấm gỡ**. Merge PR #11 rồi triển khai schema là đường đóng lại rủi ro này.
