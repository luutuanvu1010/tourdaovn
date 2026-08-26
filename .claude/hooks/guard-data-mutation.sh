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
#
# Nhánh MCP Sanity: dùng danh sách CHO PHÉP (chỉ-đọc), không dùng danh sách
# chặn. Vòng sửa 1 (2026-08-24): reviewer phát hiện danh sách chặn theo tiền tố
# (create_/patch_/delete_/publish_/...) để lọt run_sanity_cli, add_cors_origin,
# cors_origins_delete, generate_image — bất cứ công cụ ghi nào không khớp một
# tiền tố quen thuộc đều lọt qua. Đảo chiều: mặc định CHẶN mọi tool_name bắt
# đầu bằng mcp__Sanity, trừ danh sách chỉ-đọc liệt kê dưới đây. Tool Sanity mới
# xuất hiện sau này mặc định bị chặn thay vì mặc định lọt.
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

# --- Công cụ MCP Sanity: danh sách CHO PHÉP (chỉ-đọc); mặc định CHẶN phần còn lại ---
case "$TOOL" in
  mcp__Sanity*)
    case "$TOOL" in
      mcp__Sanity___get_ui_context|mcp__Sanity__whoami|mcp__Sanity__get_document|\
      mcp__Sanity__get_schema|mcp__Sanity__get_project_studios|mcp__Sanity__get_sanity_rules|\
      mcp__Sanity__query_documents|mcp__Sanity__semantic_search|mcp__Sanity__search_docs|\
      mcp__Sanity__read_docs|mcp__Sanity__list_datasets|mcp__Sanity__list_projects|\
      mcp__Sanity__list_organizations|mcp__Sanity__list_releases|mcp__Sanity__list_sanity_rules|\
      mcp__Sanity__list_workspace_schemas|mcp__Sanity__list_embeddings_indices|\
      mcp__Sanity__cors_origins_list|mcp__Sanity__give_sanity_feedback)
        exit 0
        ;;
      *)
        co_the_ghi || deny "$LY_DO Công cụ bị chặn: $TOOL."
        exit 0
        ;;
    esac
    ;;
esac

# --- Lệnh Bash ---
[ "$TOOL" = "Bash" ] || exit 0
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

# Danh sách lấy từ scripts/package.json — đúng những script đụng dữ liệu thật.
#
# Vòng sửa 2 (2026-08-26, DR-051): trước đây lệnh backfill được chép TÊN CỤ THỂ
# (chỉ có seo-meta), nên lệnh backfill thêm sau đó lọt lưới và ghi thật 211
# document mà hook không hé một tiếng. Đổi sang khớp TIỀN TỐ, để lệnh backfill
# mới mặc định BỊ CHẶN thay vì mặc định lọt — cùng triết lý đảo chiều đã áp cho
# nhánh MCP Sanity ở vòng sửa 1.
#
# Giới hạn đã biết, CỐ Ý giữ: mẫu khớp trên chuỗi lệnh, nên lệnh chỉ NHẮC TỚI
# một đường dẫn mà không chạy nó (git add, sed, cat trên cùng tệp đó) cũng bị
# chặn. Phiền, nhưng lệch về phía fail-closed. Nới ra để phân biệt "chạy" với
# "nhắc tới" là nới một hàng rào an toàn — không đổi khi chưa có lý do mạnh hơn
# sự tiện tay.
#
# Vòng sửa 1: thêm translate (ghi Sanity thật qua scripts/translate/batch.ts,
# chặn không điều kiện bất kể --live hay --dry-run, cờ mở khoá vẫn là đường
# thoát duy nhất); cho phép @<phiên bản> ghim ngay sau `sanity` (npx
# sanity@latest ...); migrate/ và seed/ khớp MỌI đuôi file, có hoặc không tiền
# tố scripts/ (seed/ ghi dữ liệu thật qua client.createOrReplace()).
MAU_GHI='(publish:drafts|publish-drafts\.ts|patch:n5|patch-n5-[a-z0-9-]+\.ts|backfill:[A-Za-z0-9:_-]+|backfill-[A-Za-z0-9_-]+\.ts|(^|[[:space:]])translate([[:space:]/]|$)|(^|[[:space:]])(scripts/)?(migrate|seed)/[A-Za-z0-9_.-]+|sanity(@[^[:space:]]+)?[[:space:]]+documents[[:space:]]+(create|delete|replace)|sanity(@[^[:space:]]+)?[[:space:]]+dataset[[:space:]]+delete)'

if printf '%s' "$CMD" | grep -Eq "$MAU_GHI"; then
  co_the_ghi || deny "$LY_DO"
fi

exit 0
