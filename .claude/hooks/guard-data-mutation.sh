#!/bin/bash
# PreToolUse(Bash + mcp__Sanity__*) — chặn lệnh ghi dữ liệu ngoài ý muốn.
#
# Vì sao chặn cho MỌI agent chứ không riêng data-reader: JSON vào hook không có
# trường nào cho biết đang chạy trong subagent nào (chỉ có session_id,
# transcript_path, cwd, permission_mode, hook_event_name, tool_name, tool_input).
# Nên không khoá riêng một subagent được. Khoá chung chặt hơn, không lỏng hơn:
# mutation vào Sanity nguy hiểm bất kể ai gọi.
#
# Mở khoá: tạo .claude/.cho-phep-ghi-du-lieu trong dự án. Cờ hết hiệu lực sau 30
# phút — một cờ bỏ quên là một cổng mở vĩnh viễn.
set -euo pipefail

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')

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

LY_DO="Chặn ghi dữ liệu. Lệnh này sửa hoặc xoá nội dung trong Sanity. Nếu đây đúng là việc muốn làm, tạo cờ rồi chạy lại: touch .claude/.cho-phep-ghi-du-lieu — cờ tự hết hiệu lực sau 30 phút."

co_the_ghi() {
  PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
  [ -n "$PROJECT_DIR" ] || return 1
  CO="$PROJECT_DIR/.claude/.cho-phep-ghi-du-lieu"
  [ -f "$CO" ] || return 1
  # find -mmin -30: cờ được sửa trong vòng 30 phút gần đây.
  [ -n "$(find "$CO" -mmin -30 -print -quit 2>/dev/null || true)" ] || return 1
  return 0
}

# --- Công cụ MCP Sanity ---
case "$TOOL" in
  mcp__Sanity__create_*|mcp__Sanity__patch_*|mcp__Sanity__delete_*|mcp__Sanity__publish_*|\
  mcp__Sanity__unpublish_*|mcp__Sanity__discard_*|mcp__Sanity__update_*|mcp__Sanity__version_*|\
  mcp__Sanity__deploy_*|mcp__Sanity__dataset_assets_upload)
    co_the_ghi || deny "$LY_DO Công cụ bị chặn: $TOOL."
    exit 0
    ;;
esac

# --- Lệnh Bash ---
[ "$TOOL" = "Bash" ] || exit 0
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

# Danh sách lấy từ scripts/package.json — đúng những script đụng dữ liệu thật.
MAU_GHI='(publish:drafts|publish-drafts\.ts|patch:n5|patch-n5-[a-z0-9-]+\.ts|backfill:seo-meta|backfill-seo-meta\.ts|scripts/migrate/|(^|[[:space:]])migrate/[a-z0-9-]+\.ts|sanity[[:space:]]+documents[[:space:]]+(create|delete|replace)|sanity[[:space:]]+dataset[[:space:]]+delete)'

if printf '%s' "$CMD" | grep -Eq "$MAU_GHI"; then
  co_the_ghi || deny "$LY_DO"
fi

exit 0
