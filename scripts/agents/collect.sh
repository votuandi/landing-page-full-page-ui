#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
root="$repo/../lp-worktrees"
if (($#)); then
  [[ $# == 2 && "$1" == --root && -n "$2" && "$2" != --* ]] || { echo 'Usage: collect [--root <dir>]' >&2; exit 1; }
  root=$2
fi
shopt -s nullglob
files=("$root"/*/.agent-runs/*/codex.pid)
((${#files[@]})) || { echo 'không có'; exit 0; }
for file in "${files[@]}"; do
  run=$(dirname "$file"); wt=$(dirname "$(dirname "$run")"); id=$(basename "$run")
  json=$(node "$repo/scripts/agents/story.mjs" info "$id")
  base=$(printf '%s' "$json" | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).base')
  branch=$(git -C "$wt" branch --show-current); commits=$(git -C "$wt" rev-list --count "$base..HEAD")
  state=done; child=$(tr -d '\r\n' < "$file")
  if [[ "$child" =~ ^[1-9][0-9]*$ ]] && kill -0 "$child" 2>/dev/null; then state=running; fi
  report=—; checks=—
  if [[ -f "$run/codex-report.md" ]]; then
    report=$(node -e 'let t=require("fs").readFileSync(process.argv[1],"utf8"); console.log(t.match(/^(?:##\s+)?Trạng thái\s*:\s*(.+)$/m)?.[1]?.trim() ?? t.match(/^## Trạng thái\s*\r?\n\s*([^\r\n]+)/m)?.[1]?.trim() ?? "—")' "$run/codex-report.md")
  fi
  if [[ -f "$run/verify.json" ]]; then
    checks=$(node -e 'let v=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); console.log(v.ok === true ? "PASS" : v.ok === false ? "FAIL" : "—")' "$run/verify.json")
  fi
  echo "$id | $branch | codex: $state | commit: $commits | report: $report | checks: $checks"
done
