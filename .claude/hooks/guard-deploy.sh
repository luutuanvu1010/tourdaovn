#!/bin/bash
# PreToolUse(Bash) — chặn deploy khi bản dựng chưa chắc lên tới khách.
#
# DR-041 (2026-08-22): wrangler deploy in Success, curl trả 200, nội dung là của
# hai tuần trước. Cloudflare dựng lại từ origin/main khi Sanity Publish bắn hook,
# và bản dựng đó THAY THẾ version đang chạy. main local khi ấy đi trước origin 7
# commit, nên đợt 4A "deploy xong" mà chưa từng lên tới khách. Không có tín hiệu
# hỏng nào. Hook này là tín hiệu đó.
#
# Hook KHÔNG tự fetch: gọi mạng trong hook làm mọi lệnh deploy chậm và có thể
# treo. Thông điệp chặn nhắc người dùng tự fetch.
set -euo pipefail

INPUT=$(cat)
[ "$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')" = "Bash" ] || exit 0
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

# Có phải lệnh deploy không?
printf '%s' "$CMD" | grep -Eq '(wrangler[[:space:]]+(deploy|versions[[:space:]]+upload)|npm[[:space:]]+run[[:space:]]+deploy)' || exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
[ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ] || exit 0
cd "$PROJECT_DIR"

# --- D-A: commit chưa push ---
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "")
if [ -n "$AHEAD" ] && [ "$AHEAD" -gt 0 ] 2>/dev/null; then
  deny "Chặn deploy: còn $AHEAD commit chưa push lên origin/main. Cloudflare dựng site từ origin/main, nên bản deploy tay này sẽ bị đè ngay lần Sanity Publish kế tiếp — đúng cơ chế DR-041 đã làm mất trắng đợt 4A. Chạy: git fetch origin main, rồi git push, rồi deploy lại. Nếu đã push rồi mà vẫn bị chặn thì ref origin/main ở local đang cũ, fetch lại."
fi

# --- D-B: dist/ cũ hơn src/ ---
# Chỉ áp cho lệnh KHÔNG tự build trong cùng chuỗi. npm run deploy đã có
# npm run build ở đầu, chặn nó theo D-B là chặn nhầm.
if ! printf '%s' "$CMD" | grep -Eq '(npm[[:space:]]+run[[:space:]]+build|npm[[:space:]]+run[[:space:]]+deploy)'; then
  if [ ! -f dist/index.html ]; then
    deny "Chặn deploy: không có dist/index.html. Chưa build thì không có gì để tải lên. Chạy npm run build trước."
  fi
  MOI_HON=$(find src -type f \( -name '*.astro' -o -name '*.ts' -o -name '*.css' \) -newer dist/index.html -print -quit 2>/dev/null || true)
  if [ -n "$MOI_HON" ]; then
    deny "Chặn deploy: dist/ cũ hơn src/ — ví dụ $MOI_HON mới hơn dist/index.html. Bản sắp tải lên không chứa thay đổi vừa sửa. Chạy npm run build trước."
  fi
fi

exit 0
