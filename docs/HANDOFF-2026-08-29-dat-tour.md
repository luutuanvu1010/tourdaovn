# Handoff — module đặt tour, chuyển phiên 2026-08-29

> Cho phiên làm việc kế tiếp (Cowork hoặc Code). Đọc file này TRƯỚC khi đọc bất cứ gì khác
> của luồng đặt tour. Sổ tiến độ chi tiết nằm ở `.superpowers/sdd/2026-08-22-dat-tour/progress.md`
> — nhưng thư mục đó **bị gitignore và đã mất trắng một lần** (worktree bị gỡ 23→26/08), nên
> file handoff này là bản ghi được git giữ; sổ kia chỉ là phụ.

## Mọi thứ nằm ở đâu

| Thứ | Vị trí |
|---|---|
| Worktree | `~/Documents/Projects/ctytnhhtourdao/tourdaovn-dat-tour/` (đã dời ra khỏi `.claude/worktrees/` sau vụ mất sổ) |
| Nhánh | `worktree-feat+dat-tour`, HEAD `be54316`, **45 commit** riêng so với merge-base |
| Repo chính | `~/Documents/Projects/ctytnhhtourdao/tourdaovn/` — đang ở nhánh KHÁC (`feat-da-diem-den`), có file dở của luồng khác, **đừng commit gì ở đó** |
| Sao lưu | `~/Documents/Projects/ctytnhhtourdao/tourdaovn-dat-tour-BACKUP-20260829-1519.bundle` (2,9 MB, "complete history") |
| Sao lưu CŨ 26/08 | **nên xoá** — chứa lịch sử TRƯỚC khi `filter-branch` gỡ mã Google Sheet khỏi repo; giữ nó là giữ lại thứ đã cố xoá. Việc xoá là của chủ dự án |

**Nhánh CHƯA push, CHƯA gộp.** Cổng `pre-push` của repo đang đỏ **toàn cục** vì `deferred-gate`
chờ nợ `ND-005` (xem `control-registry.yaml` mục I16) — không nhánh nào push được, không phải
lỗi của nhánh này. Đừng `--no-verify`. Bundle là bản sao lưu thay thế.

**`main` đã đi thêm ~86 commit** kể từ lần gộp thứ ba (`62bc5a4`). Trước khi gộp nhánh này về
`main` sẽ cần **gộp `main` vào lần thứ tư** — tiền lệ ba lần trước đều va số `DR-*` (lần ba va
BỐN số một lúc, phải dời `DR-044..047` của nhánh thành `DR-061..064`; lần bốn va tiếp — main cũng đã cấp 061..064 — nên dời lần nữa thành `DR-096..099`). Khi gộp: so danh sách
`DR-*` hai bên TRƯỚC, đừng tìm-thay mù, và nhớ hai lần trước chỉ 2–4 file xung đột thật.

## Trạng thái: 15/17 task xong

- Task 1–12, 15, 16, 17 ✅ (mỗi task đã qua review riêng + 1 review toàn nhánh + 1 lượt sửa + re-review).
- **Task 13 dở** — bước 1 (D1) + 8 (runbook) xong; còn lại là **cổng người**, xem bảng dưới.
- **Task 14 (nghiệm thu 14 tiêu chí, SPEC §7) chưa chạy** — bị chặn cho tới khi đủ 8 bí mật.

Cổng máy lúc bàn giao: `npx vitest run` **82/82** · `npx astro check` 0 errors / 0 warnings ·
`cd scripts && npx tsx --test validators/__tests__/py-paxrates.test.ts` 10/10 · cây sạch.

### Task 13 — việc người, trạng thái từng bước

| Việc | Trạng thái |
|---|---|
| D1 `tourdao-booking` (`554d340d-…`, APAC) + migration | ✅ đã tạo thật, bảng rỗng |
| Amazon SES: hết sandbox, có IAM user + vùng | ✅ chủ dự án xác nhận 29/08 |
| Turnstile: có Site Key + Secret Key | ✅ |
| WAF rate limiting `/api/dat-tour` | ✅ chủ dự án tự làm |
| `PUBLIC_TURNSTILE_SITE_KEY` vào Workers Build Variables | ✅ |
| `PUBLIC_TURNSTILE_SITE_KEY` vào **`.env` cục bộ** | ❌ **chưa** — thiếu nó thì build tay không render widget → mọi đơn 400 |
| Zalo: bot đã tạo, **`chat_id` chưa lấy** | ❌ — xem bẫy getUpdates dưới |
| **8 bí mật** (`wrangler secret put`) | ❌ `secret list` = `[]` (đo 29/08) |

**Endpoint hiện trả 503 cho mọi đơn** (cổng cấu hình fail-closed, `DR-099`) — đúng thiết kế,
an toàn cho tới khi đặt xong bí mật.

Sau khi đặt bí mật, **đếm phải ra ĐÚNG 8 tên, không tên nào khác**. Cấm tuyệt đối
`BOOKING_ALLOW_NO_TURNSTILE` xuất hiện trên production — nó vô hiệu hoá cổng chống bot; cổng
máy duy nhất canh nó là SPEC §7 mục 7.

## Câu đang chờ CHỦ DỰ ÁN (đừng tự quyết)

1. **Nhánh trùng đơn trả mã cũ** (SPEC §4.4 yêu cầu nguyên văn) — rà soát 29/08 thêm bối cảnh:
   phản hồi trùng hiện **tóm tắt của yêu cầu MỚI** kèm mã CŨ (`handler.ts:213`), nên khách gửi
   lại để đổi số người sẽ tưởng thay đổi đã lưu trong khi D1 giữ số cũ. `getBookingByCode` có
   sẵn trong `store.ts`, chưa nơi nào dùng — vừa khớp nếu chọn "hiện tóm tắt đơn ĐÃ LƯU".
2. **6 tour du thuyền**: chủ dự án nói bán CẢ theo người LẪN theo chuyến (charter). Lược đồ giá
   chưa có đơn vị charter, form chỉ hiểu `perPax`. Đề xuất đang treo: mở `perPax` trước, charter
   ghi backlog. Chưa chốt.
3. **Ghi chú độ tuổi** trẻ em / cao tuổi: trống toàn bộ trong `prices.yaml` — khách thấy
   "Trẻ em 560.000₫" mà không biết mấy tuổi. Điền qua Sheet.
4. Dòng giá mồ côi `ve-hon-tam-tam-tron-goi`: đã chốt "để validator báo" — đừng xoá, đừng tự nối.

## Đường nhập giá (QĐ-2026-08-26-02)

Google Sheet = bề mặt nhập; `data/prices.yaml` = nguồn sự thật; `npm run prices:pull` đồng bộ
một chiều (script `scripts/prices-pull.mjs`, chạy validator thật trước khi ghi, ghi tạm rồi
rename, xoá phải có cờ `--cho-phep-xoa`).

- **Mã Sheet KHÔNG được ghi vào repo** — repo public. Đặt `PRICES_SHEET_ID=<mã>` trong `.env`.
  Một phiên khác đã phải `filter-branch` xoá mã này khỏi lịch sử (28/08) vì tôi lỡ viết cứng.
- **Sheet đang RỖNG** (đo 29/08, cả gviz lẫn export, mọi tên tab thử đều 0 byte) — nghi chủ dự
  án import vào một bảng tính khác. Cần đối chiếu lại ID trong URL trước khi làm gì tiếp.
- Tab phải tên `gia`; bố cục 13 cột + mẫu: `docs/gia/README.md` + `docs/gia/mau-nhap-gia.csv`.
- 28 tour đã xuất bản, **7 có giá** (form hiện đúng 7 trang), 21 chưa.

## Bẫy đã trả giá — đọc trước khi giẫm lại

1. **Zalo `getUpdates`**: là `POST` (không phải GET), và là **long polling — cái tai đang nghe,
   không phải hộp thư**: phải chạy vòng lặp nghe TRƯỚC rồi nhắn cho bot TRONG LÚC nghe;
   `{"ok":false,…,"error_code":408}` = "30 giây không có tin", KHÔNG phải lỗi cấu hình. Runbook
   đã sai HAI lần liên tiếp về chuyện này (commit `7630e1f`, `69453cd`) — lệnh chuẩn nằm ở
   kế hoạch Task 13 bước 3.
2. **Truy vấn "đơn chưa báo được" phải có `COALESCE`** (`be54316`): cột `notify_*` là `NULL`
   khi tác vụ nền chết trước khi ghi, và `NULL <> 'sent'` không phải TRUE — đơn tệ nhất tàng
   hình. Đã sửa SPEC §4.6 + BUILD-NOTES; đừng "đơn giản hoá" mất.
3. **Dòng proxy npm có tham số phải kết thúc bằng `--`** — không thì cờ dạng `--x` bị nuốt
   **không báo lỗi** qua hai chặng npm. Ghi ở cuối `docs/gia/README.md`.
4. **Hook `guard-data-mutation`**: mọi lệnh ghi Sanity bị chặn trừ khi CHỦ DỰ ÁN tự tạo cờ
   `.claude/.cho-phep-ghi-du-lieu` ở **repo chính** (hết hạn 30 phút). Tác nhân không bao giờ
   tự tạo cờ — ba lớp luật cùng cấm.
5. **Hook chặn deploy quét cả chuỗi lệnh**: commit message chứa chữ "deploy" trong heredoc sẽ
   bị chặn nhầm → viết message ra file rồi `git commit -F <file>`.
6. **`.superpowers/` không được git giữ** — mất là mất. Điều gì đáng sống qua phiên thì ghi vào
   `docs/` (như file này) hoặc nhật ký `docs/NHAT-KY-*.md`.
7. **Số `DR-*` và `QĐ-*` va liên tục giữa các luồng song song** — trước khi đặt số mới, grep cả
   `main` lẫn các nhánh đang sống.

## Tài liệu chi phối (đọc theo thứ tự khi làm tiếp)

1. File này → 2. `docs/plans/2026-08-22-dat-tour.md` Task 13 + 14 (các dòng **Trạng thái** dưới
mỗi tiêu đề task đáng tin hơn ô tick) → 3. `docs/specs/SPEC-2026-08-21-dat-tour.md` §4.4–4.7, §6,
§7 (14 tiêu chí) → 4. `BUILD-NOTES.md` mục "Module đặt tour" (thứ tự bắt buộc + đường lùi gỡ
`main` khỏi `wrangler.toml`) → 5. `docs/DECISIONS.md`: `QĐ-2026-08-22-07` (SES), `QĐ-2026-08-26-02`
(Sheet) → 6. `docs/DRIFT_LOG.md`: `DR-096`…`DR-099` → 7. Nhật ký
`docs/NHAT-KY-2026-08-26-dat-tour-va-duong-gia.md` (14 mục nợ, phán quyết, bài học).

## Việc kế tiếp, đúng thứ tự

1. Chủ dự án: `.env` site key → lấy `chat_id` Zalo (vòng lặp nghe) → đặt 8 bí mật → đếm đủ 8.
2. Chủ dự án: kiểm lại ID Sheet, import bảng giá, điền giá 21 tour + ghi chú tuổi.
3. Phiên kế: `npm run prices:pull` → xem diff → commit; rồi **Task 14** — dựng preview
   (`npm run` lệnh preview trong `package.json`), nghiệm thu đủ 14 tiêu chí SPEC §7, **xoá đơn
   thử khỏi D1 production**, ghi kết quả vào SPEC.
4. Gộp `main` lần 4 → gộp nhánh về `main` (chủ dự án bấm) → xử lý push khi `ND-005` được trả.
