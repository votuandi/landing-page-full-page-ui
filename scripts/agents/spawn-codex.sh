#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
root="$repo/../lp-worktrees"; base_port=3101; install=true; ids=(); stories=(); refs=(); seen=()
die() { echo "! $*" >&2; exit 1; }
usage() { echo 'Usage: spawn-codex <ID…> [--root <dir>] [--base-port <n>] [--no-install]'; }
while (($#)); do
  case "$1" in
    --root|--base-port)
      (($# >= 2)) && [[ -n "$2" && "$2" != --* ]] || { usage; exit 1; }
      if [[ "$1" == --root ]]; then root=$2; else base_port=$2; fi; shift 2 ;;
    --no-install) install=false; shift ;;
    --help|-h) usage; exit 0 ;;
    --*) usage; exit 1 ;;
    *) ids+=("$1"); shift ;;
  esac
done
((${#ids[@]})) || { usage; exit 1; }
[[ "$base_port" =~ ^[0-9]{1,5}$ ]] || die 'Invalid base port'
base_port=$((10#$base_port))
((base_port >= 1 && base_port + ${#ids[@]} - 1 <= 65535)) || die 'Invalid port range'
root=$(realpath -m "$root"); cd "$repo"
# Validate the whole batch before creating directories or writing git.
for id in "${ids[@]}"; do
  for old in "${seen[@]}"; do [[ "$id" != "$old" ]] || die "duplicate: $id"; done
  seen+=("$id")
  json=$(node scripts/agents/story.mjs info "$id") || die "Unknown story: $id"
  mapfile -t s < <(printf '%s' "$json" | node -e 'let s=JSON.parse(require("fs").readFileSync(0,"utf8")); console.log([s.branch,s.base,s.planFile,s.done,s.ready].join("\n"))')
  [[ "${s[3]}" == false ]] || die "$id: done"
  [[ "${s[4]}" == true ]] || die "$id: not ready"
  [[ ! -e "$root/$id" && ! -L "$root/$id" ]] || die "$id: worktree exists"
  ref=${s[1]}; git show-ref --verify --quiet "refs/heads/${s[0]}" && ref=${s[0]}
  git cat-file -e "$ref:${s[2]}" 2>/dev/null || [[ -f "${s[2]}" ]] || git cat-file -e "${s[1]}:${s[2]}" 2>/dev/null || die "$id: missing plan"
  stories+=("$json"); refs+=("$ref")
done
failed=0
for i in "${!ids[@]}"; do
  id=${ids[i]}; wt="$root/$id"; port=$((base_port + i))
  mapfile -t s < <(printf '%s' "${stories[i]}" | node -e 'let s=JSON.parse(require("fs").readFileSync(0,"utf8")); console.log([s.branch,s.base,s.planFile,s.runDir,s.title,s.epicFile,s.mode,s.checks.join("; "),s.codexEffort.exec].join("\n"))')
  if [[ "${refs[i]}" == "${s[0]}" ]]; then
    git worktree add "$wt" "${s[0]}" || { failed=1; continue; }
  else
    git worktree add -b "${s[0]}" "$wt" "${s[1]}" || { failed=1; continue; }
  fi
  if [[ ! -f "$wt/${s[2]}" ]]; then
    mkdir -p "$(dirname "$wt/${s[2]}")"
    if [[ -f "${s[2]}" ]]; then cp "${s[2]}" "$wt/${s[2]}"; else git show "${s[1]}:${s[2]}" > "$wt/${s[2]}"; fi
    git -C "$wt" add -- "${s[2]}" && git -C "$wt" commit -m "docs(plan): $id plan" || { failed=1; continue; }
  fi
  if $install && ! (cd "$wt" && pnpm install --frozen-lockfile); then echo "! $id: install failed" >&2; failed=1; continue; fi
  run="$wt/${s[3]}"; mkdir -p "$run"
  cat > "$run/codex-exec-prompt.md" <<EOF
Dùng skill solar-story-exec.
Story: $id — ${s[4]} (${s[5]}) · Plan: ${s[2]}
Branch (đã checkout): ${s[0]} · Base: ${s[1]} · Mode: ${s[6]}
Lệnh kiểm tra: ${s[7]}; thêm lệnh riêng trong plan.
Skill bổ trợ (nếu có trong .agents/skills): ponytail mức full khi viết code; test-driven-development,
debugging-and-error-recovery khi viết test/sửa lỗi.
Quy tắc AGENTS.md ưu tiên hơn ponytail.
Báo cáo: ${s[3]}/codex-report.md
Dev server (nếu cần): PORT=$port pnpm --filter web dev
Không chạy git ghi.
EOF
  nohup "${CODEX_BIN:-codex}" exec -C "$wt" -s workspace-write -c "model_reasoning_effort=${s[8]}" \
    -c sandbox_workspace_write.network_access=true -o "$run/codex-exec-last.md" \
    "Dùng skill solar-story-exec. Đọc và làm theo ${s[3]}/codex-exec-prompt.md." < /dev/null > "$wt/codex.log" 2>&1 &
  child=$!; printf '%s\n' "$child" > "$run/codex.pid"; printf '%s\n' "$port" > "$run/port"
  echo "✔ $id  $wt  ${s[0]}  port $port  pid $child"
done
exit "$failed"
