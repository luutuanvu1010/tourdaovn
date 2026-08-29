#!/bin/bash
# PostToolUse(Edit|Write) — chạy astro check sau khi file trong src/ đổi.
#
# KHÔNG chặn: PostToolUse chạy sau khi file đã ghi, chặn ở đó vô nghĩa. Hook trả
# systemMessage để lỗi kiểu hiện ra ngay thay vì dồn tới lúc build.
#
# Chống dội 60 giây: một loạt Edit liên tiếp chỉ tốn một lần kiểm.
set -euo pipefail

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')
case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
[ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ] || exit 0

# Chỉ quan tâm file mã nguồn trong src/.
case "$FILE_PATH" in
  "$PROJECT_DIR"/src/*.astro|"$PROJECT_DIR"/src/*.ts|"$PROJECT_DIR"/src/*.tsx) ;;
  *) exit 0 ;;
esac

DAU="$PROJECT_DIR/.claude/.last-astro-check"
# Đã chạy trong vòng 60 giây thì thôi. find -newermt cần mốc thời gian; dùng
# -mmin -1 cho đơn giản và đủ chính xác.
if [ -f "$DAU" ] && [ -n "$(find "$DAU" -mmin -1 -print -quit 2>/dev/null || true)" ]; then
  exit 0
fi

[ -f "$PROJECT_DIR/package.json" ] || exit 0
cd "$PROJECT_DIR"
touch "$DAU"

# astro check trả khác 0 khi có lỗi. Không để set -e giết hook.
OUT=$(npm run check 2>&1) && CODE=0 || CODE=$?

if [ "$CODE" -ne 0 ]; then
  # Chỉ lấy phần cuối cho gọn; toàn bộ output nằm trong log của npm.
  TOM_TAT=$(printf '%s' "$OUT" | tail -n 40)
  jq -n --arg msg "astro check đỏ sau khi sửa $FILE_PATH:

$TOM_TAT" '{systemMessage: $msg}'
fi

exit 0
