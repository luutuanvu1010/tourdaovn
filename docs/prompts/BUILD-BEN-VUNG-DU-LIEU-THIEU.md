# Build đừng vỡ vì dữ liệu thiếu

> **Cách dùng:** mở Claude Code tại thư mục `tourdaovn`, dán toàn bộ nội dung từ dòng
> `---BẮT ĐẦU PROMPT---` trở xuống.
>
> **Bối cảnh soạn prompt này:** viết ngày 2026-08-05, ngay sau đợt vá 10 lỗi từ
> `/code-review` (commit `720d6c5`…`1e00745`). Phần khảo sát trong prompt là số đo thật
> ở thời điểm đó, không phải ước lượng. Nếu mở phiên sau ngày đó khá lâu, hãy đo lại
> trước khi tin.

---BẮT ĐẦU PROMPT---

# Nhiệm vụ

Làm cho `npm run build` không bao giờ vỡ vì dữ liệu trong Sanity thiếu field. Người
nhập nội dung bỏ trống một ô thì trang phải vẫn dựng được — thiếu thì không hiển thị
phần đó, hoặc báo cảnh báo, chứ không được ném lỗi chặn cả build.

**Việc đầu tiên của anh là soạn spec, không phải sửa code.** Xem mục "Điểm dừng" ở cuối.

## Đọc trước khi làm bất cứ việc gì

Theo `CLAUDE.md` §4, đây là task đặc tả. Đọc đúng thứ tự:

1. `playbook/CONSTITUTION.md`
2. `playbook/GOVERNANCE.md` — phần cổng QA1 và role boundary
3. `docs/core-specs/04-CONSTRAINTS.md`
4. `docs/DECISIONS.md` — đặc biệt `ADR-0022` (validator đã bị gỡ khỏi đường phát hành)
5. `docs/DRIFT_LOG.md` — `DR-006`, `DR-011`, `DR-020`
6. Hai commit đã sửa đúng loại lỗi này: `git show 278b287` và `git show f57d65b`

## Nguyên nhân đã xác định, đừng đi tìm lại

Hai lần build vỡ trong lịch sử repo có **cùng một hình dạng**, và cả hai đều lọt qua
`astro check`:

- `278b287` — `HomeMetaBar` vỡ ở bước prerender `/nha-trang/`: `Cannot read properties
  of null (reading 'find')`. Document không có field `sameAs`; GROQ chiếu thẳng field
  đó nên trả `null`; component nhận bằng `const { sameAs = [] }`, mà default của
  destructuring **chỉ kích hoạt với `undefined`**, không đỡ được `null`.
- `f57d65b` — `llms.txt` vỡ vì `compactObject()` xoá hẳn key khi object rỗng, trong khi
  kiểu lại khai field đó bắt buộc.

Gốc chung: **GROQ trả `null` cho field không tồn tại, còn codebase khai kiểu là
`undefined`.** Một chữ khác nhau, và nó vô hiệu hoá hai lớp phòng vệ cùng lúc. Vì kiểu
nói dối nên `astro check` báo xanh và lỗi chỉ nổ lúc prerender.

## Diện lộ, đo ngày 2026-08-05

- **14 component** dùng khuôn `= []` trong destructuring props — đúng khuôn đã làm vỡ
  `HomeMetaBar`.
- **13 khai báo** dạng `?: T[]` trong `src/components/*.astro` (11 ở cấp đầu của
  `Props`), tức `T[] | undefined`, trong khi caller đưa `null`. Cộng **12 tham số hàm**
  khai `T[] | undefined` — cùng lời nói dối, khác vị trí.
- **210 lượt gọi** `.map / .find / .filter / .length / .join / .slice` trong components,
  nằm trên hai lớp trên.
- Cửa vào dữ liệu **hẹp**: 17 lời gọi `.fetch(` ngoài `src/lib/sanity.ts`, nằm trong 4
  file — 12 ở `src/components/RouteDispatch.astro`, 2 ở `src/pages/index.astro`, 2 ở
  `src/pages/[lang]/index.astro`, 1 ở `src/pages/[pickupRoutePath].astro`. Chỉ 6 file
  chạm tới `getClient`.

Hãy đo lại mấy con số này trước khi dựa vào chúng.

## Hai hướng đã cân, cần anh chọn và lập luận

**Hướng A — chuẩn hoá tại cửa.** Một hàm bọc duy nhất ở tầng fetch, đổi `null` thành
`undefined` (hoặc thành `[]` cho field mảng) ngay khi dữ liệu vào. Làm vậy thì 14 cái
`= []` và 20 khai báo `?:` đang có **tự khắc thành đúng**, không phải sờ vào 61 file
`.astro`. Sửa ở một chỗ.

**Hướng B — khai kiểu cho đúng sự thật.** Cho `| null` vào kiểu ở biên dữ liệu, để
`astro check` bắt mọi chỗ truy cập không phòng vệ. Triệt để hơn vì biến lỗi-lúc-build
thành lỗi-lúc-biên-dịch, nhưng sẽ nổ ra một loạt lỗi phải xử một lần.

Người soạn prompt này nghiêng về A, nhưng **không chốt**. Anh đọc code rồi lập luận
lại; nếu thấy A có lỗ hổng thì nói ra.

Lưu ý một cái bẫy: hướng A che `null` đi thì cũng che luôn tín hiệu "dữ liệu đang
thiếu". Spec phải trả lời được: thiếu field thì ai biết, biết bằng cách nào.

## Ranh giới

- **Đây KHÔNG phải việc nới cổng kiểm.** Không hạ `fail` xuống `warn`, không tắt
  validator nào. Mức của control lấy từ `VALIDATOR_LEVELS` trong module thi hành và
  đã chép vào `docs/governance/control-registry.yaml`; đổi mức là quyết định ở tầng
  `04-CONSTRAINTS`, không thuộc gói này.
- **Không tạo nguồn sự thật thứ hai.** `src/site.config.ts` vẫn là nơi duy nhất khai
  phạm vi site (`ADR-0021`).
- **Không đổi kiến trúc** ngoài phạm vi spec được duyệt. Phát hiện cần quyết định mới
  thì dừng và báo.
- Trả lời bằng **tiếng Việt**, viết cho người không chuyên kỹ thuật.

## Điểm dừng

Soạn spec xong thì **DỪNG và chờ chủ dự án duyệt**. Chưa sửa một dòng code nào trước
cổng QA1. Spec cần có:

1. Chọn hướng nào, vì sao, và hướng kia hỏng ở đâu.
2. Danh sách file sẽ đụng, kèm phạm vi thay đổi từng file.
3. Cách chứng minh đã xong — cụ thể là dựng được cảnh dữ liệu thiếu và cho thấy build
   vẫn đi hết, chứ không phải câu "đã kiểm xong". `GOVERNANCE` mặc định cổng là **không
   đạt** nếu không có bằng chứng.
4. Thiếu field thì ai biết và biết bằng cách nào.
5. Phần nào cố ý để lại, và vì sao.

## Trạng thái repo lúc bàn giao

`main` ở `1e00745`, đã push. `check:cwd` xanh, `astro check` 0 lỗi 0 cảnh báo,
`npm run build` đi hết, `npm --prefix scripts run gate:all` 9/10 xanh.

Cái còn đỏ là `deferred-gate`, đỏ vì `ND-005` mà chủ dự án đã chốt hoãn sau pha B. Đó
là trạng thái đã biết và chấp nhận, **không phải việc của gói này**. Đừng đi sửa nó.
