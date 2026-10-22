#!/usr/bin/env bash
# In ra id lần chạy visual.yml (push, thành công) gần nhất của base dùng làm baseline cho merge-base, hoặc rỗng.
# Không đòi đúng SHA merge-base: commit chỉ đổi tài liệu (vd. "docs(roadmap): … done") không chạy visual.yml, trước đây
# khiến mọi PR sau đó phải dựng lại baseline (chậm, dễ flaky). Lần chạy hợp lệ khi commit của nó là tổ tiên của merge-base
# và giữa hai commit không đổi file nào trong `paths` của visual.yml.
# Dùng: scripts/ci/visual-baseline-run.sh <merge-base>   (cần GH_TOKEN, GITHUB_REPOSITORY, checkout fetch-depth 0)
set -euo pipefail
merge_base=$1
paths=(apps/web packages/config packages/core packages/ui packages/sections packages/themes packages/tokens tooling/visual pnpm-lock.yaml)
gh run list --repo "$GITHUB_REPOSITORY" --workflow visual.yml --branch mono-repo-multi-tenent --event push --status success \
  --limit 30 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' | while read -r id sha; do
  git cat-file -e "$sha^{commit}" 2>/dev/null || continue
  git merge-base --is-ancestor "$sha" "$merge_base" || continue
  if git diff --quiet "$sha" "$merge_base" -- "${paths[@]}"; then echo "$id"; break; fi
done
