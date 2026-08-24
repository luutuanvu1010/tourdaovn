# Subagent của tourdaovn

Mười agent, chia ba nhóm theo thứ bạn muốn biết.

## Nhóm 1 — kiểm chính bộ kiểm và đường phát hành

| Agent | Trả lời câu hỏi | Chạy gì |
|---|---|---|
| `gate-auditor` | Cổng có thật sự chạy không, hay in `[pass]` cho phép kiểm nó không thực hiện | `npm --prefix scripts run audit:gate` |
| `deploy-verifier` | Bit đang phục vụ khách có đúng là bit vừa dựng không | `npm --prefix scripts run audit:deploy` |
| `doc-reality-auditor` | Tài liệu có đang nói dối về production không | `npm --prefix scripts run audit:doc` |

## Nhóm 2 — kiểm sản phẩm

| Agent | Trả lời câu hỏi | Chạy gì |
|---|---|---|
| `seo-auditor` | Metadata và thẻ ảnh trên `dist/` có đạt không | `npm --prefix scripts run audit:seo` |
| `astro-auditor` | Component vừa viết có giữ đúng token và binding map không | `npm run gate` |
| `ui-auditor` | Trang có vỡ khung hay khó nhìn trên di động không | Chrome + `npm --prefix scripts run check:theme` |
| `contract-checker` | Template có đọc field không tồn tại không | `npm --prefix scripts run audit:spec` |

## Nhóm 3 — làm việc trên mã và dữ liệu

| Agent | Dùng khi |
|---|---|
| `code-reviewer` | Có diff nhiều file, sắp merge, chưa ai báo hỏng |
| `debugger` | Có triệu chứng cụ thể, cần truy nguyên — gồm cả log Worker qua `wrangler tail` |
| `data-reader` | Cần số liệu hoặc mẫu dữ liệu thật, chỉ đọc |

## Bốn hook đi kèm

| Hook | Sự kiện | Chặn gì |
|---|---|---|
| `block-git-add-all.sh` | PreToolUse(Bash) | `git add -A/--all/.`, `git commit -a` |
| `guard-deploy.sh` | PreToolUse(Bash) | Deploy khi còn commit chưa push, hoặc `dist/` cũ hơn `src/` |
| `guard-data-mutation.sh` | PreToolUse(Bash, mcp\_\_Sanity\_\_\*) | Lệnh ghi dữ liệu, trừ khi có cờ `.claude/.cho-phep-ghi-du-lieu` |
| `post-edit-lint.sh` | PostToolUse(Edit/Write) | Không chặn — chạy `astro check` khi file `src/` đổi |

Hook chỉ nạp lúc phiên bắt đầu. Sửa `.claude/settings.json` giữa phiên thì phải khởi động lại mới có tác dụng.

## Ranh giới giữa các agent hay bị chọn nhầm

**`deploy-verifier` so với `debugger`.** `deploy-verifier` trả lời một câu hỏi nhị phân — bit đang chạy có đúng là bit vừa dựng không. `debugger` trả lời một câu hỏi nguyên nhân — vì sao thứ này hỏng — và có thể tự gọi `deploy-verifier` như bước 1 của quy trình truy nguyên. Nghi bản deploy chưa lên thì gọi thẳng `deploy-verifier`; có triệu chứng cần tìm gốc rễ thì gọi `debugger`.

**`astro-auditor` so với `code-reviewer`.** Cả hai đọc mã, khác nhau ở phạm vi và mục đích: `astro-auditor` quét từng component riêng lẻ, chưa ra phán quyết merge; `code-reviewer` duyệt một diff đã gộp và ra kết luận CHẶN/SỬA/HỎI/GHI. Khi người dùng không nói rõ ý định merge, luật mặc định neo vào số file đang thay đổi — từ ba file trở lên thì dùng `code-reviewer` (bỏ sót một phán quyết merge đắt hơn chạy dư một bước), dưới ba file thì dùng `astro-auditor`.

## Giao ước bằng chứng

Mọi agent nhóm 1 và 2 ghi ra `docs/evidence/<ngày>-<tên-agent>/report.json` và `report.md`.

`CLAUDE.md` §6 — *"Mặc định của cổng là không đạt nếu không có bằng chứng"* — và `GOVERNANCE` 5.1 không nhận lời tự khai của tác nhân làm bằng chứng. Nên **câu văn của agent không phải bằng chứng; file `report.json` mới là.** Trích một kết luận mà không trích được file báo cáo là lặp lại đúng lỗi `DR-021`.

Một điểm nữa lấy thẳng từ `DR-021` — `skip` không phải `pass`. Báo cáo có `skip` nghĩa là có bất biến không ai kiểm. Câu kết của mọi agent phải nói ra số `skip`.
