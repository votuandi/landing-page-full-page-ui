#!/usr/bin/env bash
# Gọi Codex cho một story, giữ context giữa các lượt bằng `codex exec resume`.
#   bash scripts/agents/codex.sh <runDir> <name> <effort> <prompt-file> [new|resume|review]
#     new     phiên mới (workspace-write), lưu session id vào <runDir>/codex-session.txt — lượt dựng code đầu tiên
#     resume  (mặc định) nối tiếp phiên đã lưu: Codex còn nhớ plan, code đã viết, lý do quyết định; không có phiên đã
#             lưu, phiên quá dài hoặc resume lỗi → tự chạy phiên mới
#     review  phiên mới read-only, không lưu session (reviewer phải độc lập với người viết)
# Kết quả: <runDir>/<name>.md (tin nhắn cuối), <runDir>/<name>.log (log). Chạy nền và chờ thông báo; chỉ đọc <name>.md.
set -uo pipefail
run_dir=$1 name=$2 effort=$3 prompt_file=$4 mode=${5:-resume}
session_file="$run_dir/codex-session.txt" out="$run_dir/$name.md" log="$run_dir/$name.log"
max_resumes=${CODEX_MAX_RESUMES:-4} # phiên quá dài làm mỗi lượt đắt hơn khởi động lại
mkdir -p "$run_dir"
# Giữ log lượt trước (<name>.1.log, .2.log, …): run.mjs skills đối chiếu skill trên mọi lượt, không chỉ lượt cuối.
if [ -s "$log" ]; then n=1; while [ -e "$run_dir/$name.$n.log" ]; do n=$((n + 1)); done; mv "$log" "$run_dir/$name.$n.log"; fi
common=(-c "model_reasoning_effort=$effort" -c sandbox_workspace_write.network_access=true -o "$out")

fresh() { # sandbox, save?
  codex exec -C "$(pwd)" -s "$1" "${common[@]}" - < "$prompt_file" > "$log" 2>&1
  local status=$?
  if [ "$2" = save ]; then
    local id; id=$(grep -m1 '^session id:' "$log" | cut -d' ' -f3)
    [ -n "$id" ] && printf '%s 0\n' "$id" > "$session_file"
  fi
  return $status
}

case "$mode" in
  new) fresh workspace-write save ;;
  review) fresh read-only nosave ;;
  resume)
    read -r id count < "$session_file" 2>/dev/null || id=""
    if [ -z "$id" ] || [ "${count:-0}" -ge "$max_resumes" ]; then
      echo "codex.sh: không resume (phiên: ${id:-chưa có}, đã resume ${count:-0} lần) → phiên mới" >&2
      fresh workspace-write save; exit $?
    fi
    codex exec resume "$id" -c 'sandbox_mode="workspace-write"' "${common[@]}" - < "$prompt_file" > "$log" 2>&1
    status=$?
    if [ $status -ne 0 ]; then
      echo "codex.sh: resume $id lỗi (exit $status) → phiên mới" >&2
      fresh workspace-write save; exit $?
    fi
    printf '%s %s\n' "$id" $(( ${count:-0} + 1 )) > "$session_file" ;;
  *) echo "mode phải là new|resume|review" >&2; exit 2 ;;
esac
