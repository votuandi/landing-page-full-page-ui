#!/usr/bin/env bash
# In ra id lần chạy visual.yml (push, thành công) gần nhất của base dùng làm baseline cho merge-base, hoặc rỗng.
# Không đòi đúng SHA merge-base: commit chỉ đổi tài liệu (vd. "docs(roadmap): … done") không chạy visual.yml, trước đây
# khiến mọi PR sau đó phải dựng lại baseline (chậm, dễ flaky). Lần chạy hợp lệ khi commit của nó là tổ tiên của merge-base
# và giữa hai commit không đổi file nào trong `paths` của visual.yml.
# Với artifact `matrix-baseline`: base push không đổi đầu vào matrix thì bỏ qua matrix (không có artifact), nên lần chạy
# hợp lệ khi có artifact đó và giữa hai commit không đổi đầu vào matrix (scripts/ci/checks-map.mjs).
# Dùng: scripts/ci/visual-baseline-run.sh <merge-base> [matrix-baseline]   (cần GH_TOKEN, GITHUB_REPOSITORY, fetch-depth 0)
set -euo pipefail
merge_base=$1 artifact=${2:-}
paths=(apps/web packages/config packages/core packages/ui packages/sections packages/themes packages/tokens packages/presets tooling/visual pnpm-lock.yaml)
gh run list --repo "$GITHUB_REPOSITORY" --workflow visual.yml --branch mono-repo-multi-tenent --event push --status success \
  --limit 50 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' | while read -r id sha; do
  git cat-file -e "$sha^{commit}" 2>/dev/null || continue
  git merge-base --is-ancestor "$sha" "$merge_base" || continue
  if [ "$artifact" = matrix-baseline ]; then
    gh api "repos/$GITHUB_REPOSITORY/actions/runs/$id/artifacts" --jq '.artifacts[].name' | grep -qx matrix-baseline || continue
    git diff --name-only "$sha" "$merge_base" | node scripts/ci/checks-map.mjs --stdin | grep -qx matrix && continue
    echo "$id"; break
  fi
  if git diff --quiet "$sha" "$merge_base" -- "${paths[@]}" ':(exclude)*.md'; then echo "$id"; break; fi
done
