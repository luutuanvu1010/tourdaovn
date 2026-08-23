#!/bin/bash
# PreToolUse(Bash) — chặn `git add` gom cả cây làm việc.
#
# Vì sao: máy này chạy nhiều phiên Claude trên cùng một working dir. `git add -A`
# gom cả file phiên khác đang viết dở vào commit của mình. Đã xảy ra thật.
# Cách đúng: liệt kê từng đường dẫn.
#
# Heuristic best-effort, không phải trình phân tích cú pháp shell. Nó soi mệnh đề
# đầu tiên sau mỗi dấu ngắt (; && || |) nên `echo "git add -A"` không bị chặn.
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

LY_DO_ADD="git add gom cả cây bị chặn. Working dir này dùng chung với phiên Claude khác, -A/--all/. sẽ nuốt file phiên khác đang viết dở. Liệt kê đường dẫn cụ thể: git add <file1> <file2>."
LY_DO_COMMIT="git commit -a bị chặn vì nó tự stage mọi file đã track, kể cả file phiên khác đang sửa. Dùng git add <đường dẫn cụ thể> rồi git commit -m."

# Tách theo dấu ngắt, xét từng mệnh đề riêng. Dùng here-string chứ không dùng
# pipe: pipe đẩy vòng lặp vào subshell và biến gán trong đó mất khi ra ngoài.
VERDICT=""
while IFS= read -r MENH_DE; do
  CLAUSE=$(printf '%s' "$MENH_DE" | sed 's/^[[:space:]]*//')

  case "$CLAUSE" in
    git\ add\ *)
      if printf '%s' "$CLAUSE" | grep -Eq -- '(^|[[:space:]])(-A|--all|\.|:/)([[:space:]]|$)'; then
        VERDICT="ADD"
        break
      fi
      ;;
    git\ commit\ *)
      if printf '%s' "$CLAUSE" | grep -Eq -- 'commit[[:space:]]+-[a-zA-Z]*a[a-zA-Z]*([[:space:]]|$)'; then
        VERDICT="COMMIT"
        break
      fi
      if printf '%s' "$CLAUSE" | grep -Eq -- '(^|[[:space:]])--all([[:space:]]|$)'; then
        VERDICT="COMMIT"
        break
      fi
      ;;
  esac
done <<< "$(printf '%s' "$CMD" | tr ';|&' '\n')"

case "$VERDICT" in
  ADD) deny "$LY_DO_ADD" ;;
  COMMIT) deny "$LY_DO_COMMIT" ;;
esac

exit 0
