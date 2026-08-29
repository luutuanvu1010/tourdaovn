#!/bin/bash
# PreToolUse(Bash) — chặn `git add` gom cả cây làm việc.
#
# Vì sao: máy này chạy nhiều phiên Claude trên cùng một working dir. `git add -A`
# gom cả file phiên khác đang viết dở vào commit của mình. Đã xảy ra thật.
# Cách đúng: liệt kê từng đường dẫn.
#
# Heuristic best-effort, không phải trình phân tích cú pháp shell. Nó soi mệnh đề
# đầu tiên sau mỗi dấu ngắt (; && || |) nên `echo "git add -A"` không bị chặn.
#
# Mỗi mệnh đề được nén mọi dãy khoảng trắng (dấu cách, tab) về một dấu cách
# trước khi so khớp, để `git  add -A` hay `git<TAB>add<TAB>-A` không lọt qua
# vì pattern case chỉ khớp đúng một dấu cách literal.
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
LY_DO_ADD_U="git add -u/--update bị chặn. Khác với -A (gom cả file mới), -u/--update gom mọi file ĐÃ TRACK đang có sửa đổi trên toàn cây — working dir này dùng chung với phiên Claude khác nên sẽ nuốt sửa đổi của phiên khác. Liệt kê đường dẫn cụ thể: git add <file1> <file2>."
LY_DO_COMMIT="git commit -a bị chặn vì nó tự stage mọi file đã track, kể cả file phiên khác đang sửa. Dùng git add <đường dẫn cụ thể> rồi git commit -m."

# Tách theo dấu ngắt, xét từng mệnh đề riêng. Dùng here-string chứ không dùng
# pipe: pipe đẩy vòng lặp vào subshell và biến gán trong đó mất khi ra ngoài.
VERDICT=""
while IFS= read -r MENH_DE; do
  # Nén mọi dãy khoảng trắng (dấu cách, tab) về một dấu cách rồi mới cắt hai
  # đầu, để pattern case bên dưới (chỉ khớp đúng một dấu cách literal) không
  # bị nhiều dấu cách hay tab giữa các từ vô hiệu hoá.
  CLAUSE=$(printf '%s' "$MENH_DE" | tr -s '[:space:]' ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  case "$CLAUSE" in
    git\ add\ *)
      if printf '%s' "$CLAUSE" | grep -Eq -- '(^|[[:space:]])(-A|--all|\.|:/)([[:space:]]|$)'; then
        VERDICT="ADD"
        break
      fi
      if printf '%s' "$CLAUSE" | grep -Eq -- '(^|[[:space:]])(-u|--update)([[:space:]]|$)'; then
        VERDICT="ADD_U"
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
  ADD_U) deny "$LY_DO_ADD_U" ;;
  COMMIT) deny "$LY_DO_COMMIT" ;;
esac

exit 0
