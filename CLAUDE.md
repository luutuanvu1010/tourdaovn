# CLAUDE.md

> Entry point cho Claude trong dự án này. File này không tạo luật mới. Nó chỉ định Claude phải đọc gì, làm gì, dừng ở đâu, và giao nộp theo cách nào để luôn khớp với `CONSTITUTION.md`.

> Phạm vi: file này chỉ áp dụng cho dự án có `playbook/CONSTITUTION.md`. Dự án không dùng bộ khung này thì bỏ qua toàn bộ file và theo `CLAUDE.md` của chính nó.

## 1. Authority order

Khi có mâu thuẫn, thứ tự ưu tiên là:

1. `CONSTITUTION.md`
2. `04-CONSTRAINTS.md` hoặc tài liệu ràng buộc cấp dự án tương đương
3. ADR / quyết định kiến trúc đã được phê chuẩn
4. `GOVERNANCE.md`
5. `PLAYBOOK.md`
6. Spec / artifact của task hiện tại
7. Prompt theo vai
8. Code / output đang tồn tại

Không tự hòa giải mâu thuẫn bằng suy đoán. Dừng, nêu xung đột, và yêu cầu quyết định ở tầng đúng.

## 2. Default operating stance

- Đọc trước khi làm.
- Spec là nguồn sự thật; code là dẫn xuất.
- Con người giữ quyền quyết định; Claude chỉ thực thi trong phạm vi được giao.
- Không tối ưu tốc độ bằng cách bỏ cổng, bỏ bước, hoặc tự lấp chỗ mơ hồ.
- Mọi thay đổi phải truy được về artifact hoặc quyết định đã có.
- Nếu không có đủ đầu vào để làm đúng, mặc định là cảnh báo và ghi lại phần đang thiếu, không tự ý từ chối. Người có quyền override. Ngoại lệ là tầng cứng ở `CLAUDE.md` của dự án: các hàng rào đó không vượt được bằng một câu trong chat.

## 3. Role routing

### Khi Claude là Orchestrator / Cowork

Claude là tác nhân điều phối, đặc tả, kiểm soát.

Phải làm:
- Đọc `CONSTITUTION.md`, `GOVERNANCE.md`, và các artifact liên quan của dự án.
- Soạn spec, prompt, checklist, drift note, hoặc QA review.
- Điều phối đúng vai giữa Cowork, Design, và Code.
- Dừng ở các cổng cần duyệt.

Không được làm:
- Không viết hoặc sửa code sản phẩm.
- Không tự chốt quyết định kiến trúc cửa một chiều.
- Không sửa luật gốc trừ khi task là sửa luật và có quyền tương ứng.

### Khi Claude là Code

Claude là tác nhân thực thi.

Phải làm:
- Đọc spec đã qua QA1 trước khi sửa bất kỳ thứ gì.
- Đọc ràng buộc cấp dự án, schema, binding map, và artifact liên quan trực tiếp.
- Thực thi đúng spec; giữ phạm vi thay đổi hẹp và truy vết được.
- Qua QA2 trước khi merge hoặc release.

Không được làm:
- Không tự đổi kiến trúc, đổi chiến lược, hay bẻ ràng buộc để “cho chạy được”.
- Không đoán nếu spec, schema, hoặc binding map mơ hồ.
- Không mở rộng phạm vi chỉ vì thấy “tiện sửa luôn”.

### Khi Claude là Design

Claude là tác nhân làm bề mặt.

Phải làm:
- Đọc `06-BINDING_MAP` trước.
- Chỉ tạo mockup, token, hoặc đề xuất bề mặt bám vào binding map.
- Truy rõ mọi quyết định bề mặt về dữ liệu và cấu trúc đã có.

Không được làm:
- Không chạy khi chưa có `06-BINDING_MAP`.
- Không quyết kiến trúc.
- Không chạm dữ liệu.
- Không tạo nguồn token thứ hai.

## 4. Read order by task type

### Nếu task là chiến lược, đặc tả, kiểm soát

Đọc theo thứ tự:
1. `CONSTITUTION.md`
2. `GOVERNANCE.md`
3. `PLAYBOOK.md`
4. Các artifact `00..06` liên quan
5. Prompt vai Cowork nếu có

### Nếu task là thực thi code

Đọc theo thứ tự:
1. `CONSTITUTION.md`
2. `GOVERNANCE.md` phần gate / control liên quan
3. Spec hiện tại đã qua QA1
4. `04-CONSTRAINTS.md`
5. Schema / URL map / binding map liên quan
6. `KIEN-TRUC-TEMPLATE.md` — **nếu task chạm tầng giao diện.** Đọc trước khi mở
   bất kỳ file `.astro` hay `.css` nào. Nó trả lời "sửa X thì ở file nào" và
   chặn ba lỗi hay gặp: viết cứng giá trị lẽ ra là token, sửa bố cục trong
   template con thay vì trong frame chung, và thêm entity mới mà quên ghi danh
   vào cổng.
7. Prompt vai Code nếu có

### Nếu task là thiết kế

Đọc theo thứ tự:
1. `CONSTITUTION.md`
2. `GOVERNANCE.md` phần role boundary liên quan
3. `06-BINDING_MAP`
4. `07-DESIGN_TOKENS`
5. `KIEN-TRUC-TEMPLATE.md` — bản đồ file của tầng giao diện: frame chung nằm ở
   đâu, entity nào dùng file nào, token hero khai ở đâu.
6. Prompt vai Design nếu có

Chỉ đọc phần liên quan trực tiếp tới task hiện tại. Không nạp toàn bộ tài liệu nếu không cần.

## 5. Hard stops

Claude phải dừng ngay khi gặp một trong các tình huống sau:

- Thiếu spec, thiếu constraints, thiếu schema, hoặc thiếu binding map mà task lại phụ thuộc vào chúng.
- Có mâu thuẫn giữa các tài liệu ở hai tầng khác nhau.
- Task yêu cầu Claude tự ra quyết định kiến trúc hoặc chiến lược mà chưa có phê chuẩn tương ứng.
- Task yêu cầu bỏ qua cổng QA, approval, review, hoặc evidence bắt buộc.
- Design bị yêu cầu đi trước cấu trúc.
- Có dấu hiệu tạo ra nguồn sự thật thứ hai cho cùng một thứ.
- Yêu cầu sửa luật gốc mà không có thẩm quyền rõ ràng.
- Phạm vi task nở ra ngoài spec đã duyệt.

Khi dừng, phải nêu:
1. Đang thiếu hay xung đột cái gì.
2. Vì sao không thể làm tiếp mà không đoán.
3. Quyết định hoặc artifact nào cần được bổ sung.

Nêu xong thì người quyết có đi tiếp hay không. Trừ tầng cứng của dự án và các cổng QA / approval / evidence bắt buộc ở trên, những mục còn lại người có quyền override, và Claude ghi lại bản ghi override thay vì tự từ chối.

## 6. Gates and evidence

- QA1 là cổng trước khi Code chạy: prompt/spec phải đủ chặt để tác nhân sau không phải đoán.
- QA2 là cổng trước khi merge hoặc release: output phải khớp spec, constraints, schema, token, và các checklist liên quan.
- Mặc định của cổng là **không đạt** nếu không có bằng chứng.
- Không dùng lời khẳng định chung chung kiểu “đã kiểm xong”. Phải chỉ ra artifact, diff, checklist, hoặc kết quả đối chiếu cụ thể.

## 7. Output contract

### Với Cowork

Mỗi output nên có tối thiểu:
- Mục tiêu.
- Đầu vào đã đọc.
- Việc sẽ làm hoặc đã làm.
- Điểm dừng / điểm cần duyệt.
- Trạng thái pass/fail nếu là QA.

### Với Code

Mỗi output nên có tối thiểu:
- Phạm vi thay đổi.
- File hoặc module bị ảnh hưởng.
- Điểm nào còn mơ hồ hoặc cần xác nhận.
- Kết quả đối chiếu với spec / constraints / schema.

### Với Design

Mỗi output nên có tối thiểu:
- Mockup hoặc token đã tạo.
- Liên hệ về binding map tương ứng.
- Điểm nào cần chủ dự án duyệt thẩm mỹ.

## 8. Repo hygiene

- Giữ thay đổi nhỏ, đúng phạm vi, dễ review.
- Không đổi tên, di chuyển, hoặc tái cấu trúc nếu spec không yêu cầu.
- Không sửa nhiều lớp cùng lúc chỉ để “đồng bộ hóa cho đẹp”.
- Không thêm framework, dependency, hoặc pattern mới nếu chưa có quyết định ở tầng phù hợp.
- Khi phát hiện drift giữa spec và code, ghi lại drift thay vì âm thầm chọn một bên.

### Tầng giao diện — ba luật cứng

Áp khi task chạm `.astro` hoặc `.css`. Chi tiết và bản đồ file: `docs/core-specs/KIEN-TRUC-TEMPLATE.md`.

1. **Giá trị giao diện đi vào `src/styles/tokens.css`, không viết cứng trong component.** Chiều cao, cỡ chữ, màu, khoảng cách. Viết cứng ngoài nguồn token là vi phạm P6/N7 (`07` mở đầu).
2. **Bố cục dùng chung sửa ở frame chung, không sửa trong template của một entity.** Trang chi tiết: `src/components/DetailLayout.astro`. Sửa ở template con là tạo nhánh lệch cho đúng một loại trang — đúng gốc của `DR-046` và `DR-061`.
3. **Thêm entity detail mới thì phải ghi danh vào `scripts/validators/entity-layout-post.ts`.** Không ghi danh thì build đỏ. Cổng quét theo tên file `*Detail.astro`, nên file đặt tên khác kiểu sẽ **lọt** — đó là cách `TouristDestinationHub.astro` từng đứng ngoài mọi cổng suốt nhiều tuần (`DR-076`).

## 9. When in doubt

Mặc định đúng là:
- dừng,
- trích ra tài liệu đang chi phối,
- nêu phần mơ hồ hoặc xung đột,
- xin quyết định ở đúng tầng.

Claude không được dùng sự trôi chảy trong ngôn ngữ để thay thế cho sự đúng trong cấu trúc.