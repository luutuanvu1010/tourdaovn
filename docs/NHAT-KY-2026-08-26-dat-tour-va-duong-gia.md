# Nhật ký phiên — đóng module đặt tour, và mở đường nhập giá từ Sheet

**Ngày:** 2026-08-22 → 2026-08-26 · **Vai:** Cowork (điều phối) · **Nhánh:** `worktree-feat+dat-tour`
**Thi hành:** `docs/plans/2026-08-22-dat-tour.md` (17 task) · **Chưa gộp, chưa push, chưa lên production**

Ghi lại thứ tự thật sự xảy ra, các chỗ rẽ hướng, và cả những chỗ tôi làm sai rồi phải quay lại.
Bản ghi có cấu trúc nằm ở `QĐ-2026-08-22-07`, `QĐ-2026-08-26-02`, và `DR-096`→`DR-099`.

---

## 1. Kết quả

**15/17 task xong.** Task 13 dở 2/9 bước, Task 14 chưa bắt đầu — cả hai chặn ở cổng người.

| | |
|---|---|
| Commit riêng của nhánh | 41 |
| Test tự động | 75 → **82** (10 file) |
| `astro check` | 0 errors / 0 warnings / 47 hints |
| Tour có ô đặt / tổng đã xuất bản | **7 / 28** |
| Vòng review đã qua | 17 review task + 1 review toàn nhánh + 3 re-review |

**Hạ tầng thật đã dựng:** D1 `tourdao-booking` (`554d340d-…`, vùng APAC), bảng `booking` và hai
index đã tạo và kiểm bằng `sqlite_master`. **Chưa đặt bí mật nào** — `wrangler secret list` = `[]`.

**Đường ghi runtime đầu tiên của site đã chạy thật một lần**: Task 12 gửi một đơn qua `astro dev`
+ D1 cục bộ, nhận 201, đọc lại được dòng `TD-260823-98N8`. Trước đó mọi bằng chứng chỉ là vitest
với `fetch` stub.

**Đường nhập giá** (`QĐ-2026-08-26-02`): Google Sheet là bề mặt nhập, `data/prices.yaml` vẫn là
nguồn sự thật, `npm run prices:pull` đồng bộ một chiều. Script chạy validator thật của repo trên
nội dung sắp ghi, ghi tạm rồi đổi tên, và dừng thay vì xoá.

---

## 2. Bốn lỗ hổng thật mà quy trình review bắt được

Đây là phần đáng giá nhất của phiên, và không cái nào lộ ra từ việc chạy test.

**Endpoint tự tụt xuống chế độ không có lớp chặn nào, và im lặng.** Thiếu
`TURNSTILE_SECRET_KEY` → bỏ qua kiểm bot; thiếu `IP_HASH_SALT` → nhảy qua toàn bộ bộ đếm tần
suất. Cả hai không phát một tín hiệu nào. Bằng chứng không phải suy đoán: chính Task 12 từng
`curl` POST **không mang token nào** và nhận 201. Tôi đã đọc con số `TD-260823-98N8` đó như bằng
chứng "đường ghi chạy được"; reviewer đọc cùng con số và thấy nó chứng minh thêm rằng đường ghi
chạy được **kể cả khi không có gì bảo vệ**. Nay chặn hẳn ở production, cửa thoát tường minh cho
dev — `DR-099`.

**Ba validator giá đã hỏng từ trước dự án này.** `PY3`/`PY4`/`PY5` kiểm
`typeof doc.bookingRef === 'string'` trong khi lược đồ Sanity khai `bookingRef` là object có
`.key` — điều kiện **luôn false** với dữ liệu thật. Chúng luôn báo "không có gì sai", kể cả khi
có. Việc thêm 8 dòng giá thật làm nó lộ ra. Sửa xong, cổng lập tức chỉ ra hai chỗ thật: một dòng
giá mồ côi và một tour quên gắn giá — `DR-096`.

**Khoá giá bằng slug mục trong vài giờ.** Task 11 đặt `bookingRef.key = slug` lúc 07:58Z; cùng
ngày có ba đợt biên tập đổi slug, và tới tối chỉ còn 1/10 document có `key == slug`. Reviewer đề
nghị "chạy lại script cho khớp" — **tôi bác**: script đặt khoá = slug *hiện tại*, mà khoá trong
`prices.yaml` là slug *cũ*, nên chạy lại sẽ biến 7 liên kết đang sống thành mồ côi hết. Luật
đúng: khoá là **định danh ổn định**, không buộc bằng slug — `DR-097`.

**Sáu URL `/tour/` chết sau đợt đổi slug.** Phát hiện trước khi phát hành, báo phiên đang chuẩn
bị push; họ dừng lại và đưa lên chủ dự án. Chốt: đổi slug là có chủ ý, sáu URL cũ được phép chết
(`QĐ-2026-08-23-01`). Lỗ hổng cổng lộ ra và **chưa vá**: `build:ci` không gọi `validate:post`, nên
đường dựng tự động không bao giờ bắt được URL biến mất — `DR-098`.

---

## 3. Những chỗ tôi làm sai

Năm lỗi, cùng một dạng: **tôi sửa một bản của một sự thật rồi quên bản còn lại.**

1. Sửa `SPEC` và `DECISIONS` sang Amazon SES nhưng **quên chính runbook Task 13** — chỗ duy nhất
   sẽ bị làm theo nguyên văn. *Implementer Task 16 bắt.*
2. Sửa "đủ 5 bí mật" → 8 trong kế hoạch, **quên bản trong `SPEC` §7**. Cổng nghiệm thu đó sẽ PASS
   với bộ bí mật sai — tức gật đầu cho đúng cái lỗ vừa bắt. *Agent sửa bắt, ngoài phạm vi được giao.*
3. Ra phán quyết đổi hành vi (400 → 503) nhưng **không ghi drift**, để `SPEC` mô tả hợp đồng cũ ở
   ba chỗ. `SPEC` đứng trên mã, nên người sau sẽ đi "sửa" mã về 400. *Re-reviewer bắt.*
4. Viết `amount ≥ 0` trong brief khi `PY7` thật sự bắt `> 0`. *Implementer theo cổng chứ không
   theo tôi — đúng thứ tự thẩm quyền.*
5. Ghi tài liệu là `npm run prices:pull` khi lệnh thật dài hơn. *Implementer bắt.* Cách sửa hoá ra
   không phải sửa tài liệu mà là thêm dòng proxy — và việc đó lộ ra một bẫy khác (xem dưới).

Hai lỗi khác không cùng dạng:

6. Ghi "đồng hồ không tiêm được vào notifier SES" như một **nợ**. Reviewer cuối bác: đó **không
   phải nợ mà là đúng** — SigV4 đòi dấu thời gian lệch dưới 5 phút, nên đồng hồ thật an toàn hơn
   một mốc cố định năm 2026 từ test. Tôi ghi nhầm một điểm mạnh thành điểm yếu.
7. Suốt phiên nói "đã vào repo" mà không nói **nhánh nào, thư mục nào**. Với hai luồng chạy song
   song, câu đó thiếu nghĩa — chủ dự án không tìm được file.

---

## 4. Ba cái bẫy phát hiện dọc đường

**Dấu `--` không truyền qua đường proxy npm.** `package.json` gốc proxy sang `scripts/`. Chuỗi đứt
ở **hai** chặng: chặng ngoài nuốt `--`, chặng trong thấy `--tu-tep` không có `--` đứng trước nên
tưởng là tuỳ chọn của chính npm và nuốt nốt. Nguy hiểm không đều: `--tu-tep` hỏng **ồn ào**, còn
`--cho-phep-xoa` **bốc hơi không dấu vết** — người vận hành sẽ tưởng script bướng rồi có thể đi
xoá tay trong `prices.yaml`, đúng thứ cổng xoá được dựng ra để ngăn. Hai dòng proxy sẵn có không
lộ bẫy chỉ vì chúng không nhận tham số. Đã ghi cảnh báo ở `docs/gia/README.md`.

**Sổ drift va số bốn lần.** Hai luồng cùng ghi vào một sổ đánh số tuần tự mà không khoá dải. Lần
này cả hai bên đều dùng `DR-044`→`DR-047` cho tám chuyện khác nhau; bốn mục của nhánh phải dời
sang `DR-096`→`DR-099`, kéo theo sửa tham chiếu chéo ở 7 file — trong khi 21 chỗ trỏ tới số **của
`main`** phải giữ nguyên. Một lần `sed` toàn repo là hỏng cả hai bên.

**Sổ tiến độ SDD mất trắng.** Thư mục worktree bị gỡ trong khoảng 23→26/08; `.superpowers/` bị
gitignore nên đi theo. Mất 31 phán quyết, bảng phân loại nợ, và báo cáo của 17 task. Còn lại là
lịch sử git và bảng phán quyết đã giao chủ dự án trong hội thoại. Đã dựng lại sổ với dòng đầu ghi
rõ bản cũ mất gì.

---

## 5. Nợ kỹ thuật

### Chặn phát hành

| # | Nợ | Ghi chú |
|---|---|---|
| 1 | **7 bước cổng người của Task 13** | SES (sandbox, vùng, IAM user) · Zalo bot · Turnstile widget · **8 bí mật gõ tay** · site key vào build · WAF · commit đóng task |
| 2 | **Task 14 — nghiệm thu 14 tiêu chí** | Chặn sau Task 13 bước 5. Không có bí mật thật thì endpoint trả 503 cho mọi đơn |

⚠ **Bước 4 của mục 1 là chỗ dễ hỏng nhất:** thiếu một bí mật thì **hỏng câm**. Phải
`wrangler secret list` đếm đủ **đúng 8 tên, không có tên nào khác** — đặc biệt không được có
`BOOKING_ALLOW_NO_TURNSTILE`, vì đặt nó lên production là vô hiệu hoá cổng bảo vệ vừa dựng.

### Chờ chủ dự án quyết

| # | Nợ | Vì sao cần người |
|---|---|---|
| 3 | **6 tour du thuyền: bán theo người hay theo chuyến?** | Chặn nhóm sản phẩm lớn nhất chưa có giá. Nếu theo chuyến thì `perPax` không mô tả đúng và form hai bước cũng không hợp |
| 4 | **21/28 tour chưa có dòng giá** | Không phải lỗi mã — mã làm đúng luật "không giá thì không form". Là thiếu dữ liệu |
| 5 | **Dòng giá mồ côi `ve-hon-tam-tam-tron-goi`** | Xoá hay gắn cho một tour? `DR-097` |
| 6 | **Nhánh trùng trả về mã đơn cũ** | Ai biết một SĐT có thể xác nhận người đó đã đặt tour X ngày Y chưa. Là **yêu cầu nguyên văn của SPEC** §4.4, không phải lỗi thi hành |
| 7 | **Bảng giá không dòng nào ghi độ tuổi** | Khách thấy "Trẻ em 560.000₫" mà không biết mấy tuổi. Chỗ điền đã dựng sẵn |

### Mở, không chặn

| # | Nợ | Ghi chú |
|---|---|---|
| 8 | `DR-098` — cổng R3 không chạy trên đường dựng tự động | `build:ci` không gọi `validate:post`. Lần này người bắt là một tác nhân, không phải máy |
| 9 | `wrangler.toml` `[build]` làm `npm run deploy` dựng site **hai lần** | Mỗi lần gọi ra Sanity. Một vòng nghiệm thu = 4 lần dựng. Là lỗi của SPEC được thi hành trung thành |
| 10 | Test validator `PY` nằm **ngoài** `npm test` | Con số "82 test" không bao gồm chúng |
| 11 | Bốn Minor của `prices:pull` | `\r` sống sót trong ô có ngoặc kép · chưa có chế độ `--thu` · chưa parse lại văn bản vừa dựng trước khi ghi · trùng khoá chỉ bắt giữa các hàng có giá |
| 12 | Hai dòng `console warning` trong output test | Hiện trạng từ Task 8, đánh đổi có chủ ý đã ghi tại chỗ |
| 13 | Mã tour chảy xuống tới thư báo đơn | Phác thảo sáu bước ở `SPEC` §8. Chi phí thật nằm ở việc mở lược đồ giá, không ở việc thêm một cột |
| 14 | Bốn hạng mục trình duyệt thật của Task 12 | Chưa kiểm được vì extension không kết nối. Đã đưa vào `SPEC` §7 để thành cổng thay vì nằm trong mục "lo ngại" của một báo cáo |

---

## 6. Điều đáng mang sang lần sau

**Cổng chỉ có giá trị bằng thứ nó thật sự kiểm.** Ba validator giá "xanh" suốt nhiều tháng vì
chúng so sai kiểu dữ liệu. Một cổng nghiệm thu suýt PASS với bộ bí mật sai vì con số trong nó
không được cập nhật. Cổng nói "đạt" mà không ai hỏi *đạt cái gì* thì tệ hơn không có cổng.

**Đừng lấy một thứ hay đổi làm định danh cho thứ phải đứng yên.** Khoá giá bằng slug mục trong
vài giờ. Bài học đã ghi thẳng vào đầu `data/prices.yaml` để người sửa tiếp theo đọc thấy trước
khi kịp lặp lại.

**Bằng chứng phải dán nguyên văn, không chép tay.** Một báo cáo chép tay output test làm mất dấu
tiếng Việt — vô hại lần này, nhưng `CLAUDE.md` §6 lấy bằng chứng làm mặc định của cổng.

**Một con số có thể chứng minh hai điều trái ngược.** `TD-260823-98N8` vừa chứng minh đường ghi
chạy được, vừa chứng minh nó chạy được khi không có gì bảo vệ. Tôi chỉ đọc ra vế đầu.
