# ADR-0012 — PreToolUse hook: tầng enforce machine-level cho hard gate

- Trạng thái: **accepted** (founder duyệt 2026-06-18)
- Ngày: 2026-06-18
- Liên quan: CLAUDE.md §9 (hard gate), ADR-0010 (pre-push hook), ADR-0011 (validation unified gate)
- Đề xuất: Cowork. Duyệt: founder.

## Bối cảnh

CLAUDE.md v2.2 là tầng enforce duy nhất cho hard gate (§9). Có 3 lỗ hổng không thể vá bằng cách viết CLAUDE.md tốt hơn:

1. **Session interrupt**: context bị reset, "cảnh báo còn treo" mất hoàn toàn.
2. **Bypass trực tiếp**: người dùng gõ lệnh vào Claude Code terminal, bỏ qua Cowork — CLAUDE.md không được đọc.
3. **Summarization trong session dài**: Claude Code đôi khi không đọc toàn bộ CLAUDE.md.

PreToolUse hook chạy trước mỗi tool call của Claude Code, không phụ thuộc session context, không phụ thuộc Claude có "nhớ" rule hay không. Đây là tầng machine-enforced thật sự đầu tiên của dự án.

## Cơ chế kỹ thuật (Claude Code v2.1.177+)

Hook định nghĩa trong `.claude/settings.json` (project-local):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "python3 .claude/hooks/guard-no-manual-price.py" }]
      }
    ]
  }
}
```

- Input qua stdin: JSON `{ "tool_name": "...", "tool_input": { ... } }`
- Output stdout JSON với `hookSpecificOutput.permissionDecision`: `"allow"` hoặc `"deny"`
- Exit 0 = allow; exit 2 = deny (block tool call, lý do gửi về Claude)
- `matcher`: string tên tool, pipe-separated cho nhiều tool

## Quyết định

### 1. Scope: project-local `.claude/`

Hook đặt trong `.claude/settings.json` của repo, không phải global `~/.claude/`. Lý do: chỉ áp dụng cho repo này, không ảnh hưởng project khác, dễ rollback bằng git.

### 2. Activate ngay sau test pass

Founder đã chốt: Cowork bật luôn sau khi test thủ công pass (không chờ ADR review riêng). ADR này ghi hồi cố ngay sau khi activate.

### 3. Phân loại rule theo khả năng hook

**Nhóm A — hookable ngay (phiên này):**

| Rule CLAUDE.md §9 | Hook | Script |
|---|---|---|
| Không nhập giá thủ công vào Sanity | `guard-no-manual-price.py` | Detect `name: 'price'` trong Write/Edit đến `cms/schemas/`, `cms/components/`, `studio/` |

**Nhóm B — hookable nhưng phức tạp (phiên sau):**

| Rule | Thách thức |
|---|---|
| Không tạo field ngoài CONTENT-MODEL.md | Cần parse TypeScript + so sánh với Markdown list |
| Không publish entity chưa đủ gate | Cần đọc file schema + kiểm tra field list |
| Không xóa/đổi nghĩa DECISIONS.md | Cần so sánh nội dung trước/sau (hook chỉ thấy new_string, không thấy file gốc) |

**Nhóm C — không hookable theo cơ chế này:**

| Rule | Lý do |
|---|---|
| Routing table §2 (phân loại yêu cầu) | Cần LLM judgment, hook script không làm được |
| Cảnh báo còn treo trong session | Cần session context, hook không có |
| Override L1/L2 | Cần semantic understanding |

### 4. Fallback / disable nhanh

Cách disable hook mà không xóa code:
```bash
# Tắt tạm: đổi tên file hoặc comment out command trong settings.json
# Hoặc: claude --safe-mode (skip tất cả hooks)
# Hoặc: git checkout .claude/settings.json (revert về settings không có hook)
```

### 5. Không thay thế các cổng đã có

Hook này là phòng thủ bổ sung. Các cổng sau vẫn giữ nguyên (N2/N6):
- Pre-push hook (ADR-0010)
- GitHub Actions validate (ADR-0010)
- Cloudflare build:ci fail-closed (ADR-0009/0010)
- CLAUDE.md §9 (session-level)

## Hệ quả

- Tích cực: hard gate A1 hoạt động kể cả khi CLAUDE.md không được đọc; bắt bypass trực tiếp từ terminal.
- Đánh đổi: mỗi Write/Edit đều chạy Python script (~10ms) — không đáng kể.
- Rủi ro false positive: đã kiểm 5 test case (block/allow/edge×3), 0 false positive. Nếu xảy ra: `--safe-mode` hoặc `git push --no-verify` bypass hook.
- Giới hạn: hook chỉ phủ Write và Edit; Bash command tạo file trực tiếp (`echo ... > cms/schemas/x.ts`) không bị bắt — cần hook Bash riêng ở nhóm B nếu cần thiết.

## Phương án đã loại

- Global `~/.claude/`: rộng hơn nhưng ảnh hưởng project khác, không rollback được bằng git repo.
- Shell script thay Python: nhanh hơn nhưng regex và JSON parsing phức tạp hơn, khó maintain.
- Chỉ dùng CLAUDE.md: không phủ bypass trực tiếp và session interrupt — không đủ.

## Triển khai

- `.claude/hooks/guard-no-manual-price.py` — Guard A1 (giá thủ công)
- `.claude/settings.json` — cấu hình hook project-local
- Test: 5 case pass (case 1 block, case 2 allow, case 3a/3b/3c edge)
- Phiên sau: Guard B1 (field ngoài CONTENT-MODEL), Guard B2 (DECISIONS.md protect)
