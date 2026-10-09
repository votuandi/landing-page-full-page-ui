---
name: pr-review
description: Review PR của một story theo S.reviewer từ scripts/agents/story.mjs; review ở local (không đăng lên PR), liệt kê issue và case chưa cover AC/yêu cầu, giao người viết S.author sửa rồi reviewer review lại cho tới khi PR merge được (CI xanh, không conflict), sau đó báo người dùng tự merge. Dùng khi /run-story tới bước review, hoặc người dùng gõ /pr-review <số PR|STORY-ID>.
argument-hint: "<số PR | STORY-ID> [--reviewer claude|codex]"
---

# /pr-review — review PR của story

Tham số: `$ARGUMENTS`.

## 1. Xác định PR và vai trò

1. Có STORY-ID → tìm PR mở có head `*/<ID>-*` (GitHub MCP `list_pull_requests` hoặc `gh pr list --search "<ID>"`).
   Có số PR → đọc PR, lấy STORY-ID từ tiêu đề `[E\d+-S\d+]`.
2. `node scripts/agents/story.mjs info <ID>` → `S`. Reviewer = `S.reviewer` (tính theo `reviewPolicy` trong
   `scripts/agents/routing.json`); `--reviewer` ghi đè. Người viết = `S.author` (hoặc "Người viết" trong mô tả PR nếu khác).
3. Vòng review `n` = số file `<S.runDir>/review-r*.md` hiện có + 1. Vòng lặp review → sửa chạy cho tới khi PR merge được
   (mục 4); chặn an toàn: `n > 6` (đã 5 vòng sửa) → dừng, báo người dùng.
4. Lấy code: `git fetch origin <branch>`; review trên `origin/<S.base>...origin/<branch>`.

## 2. Thực hiện review

Định dạng kết quả **bắt buộc** theo skill `solar-pr-review` (dòng đầu `VERDICT: APPROVE` hoặc `VERDICT: CHANGES_REQUESTED`).

### Reviewer = codex
Chạy nền, chờ thông báo:
```bash
codex exec -C "$(pwd)" -s read-only -c model_reasoning_effort=<S.codexEffort.review> -o "<S.runDir>/review-r<n>.md" \
  "Dùng skill solar-pr-review. Review PR #<số> — story <ID> (<S.epicFile>), plan <S.planFile>. \
Diff: git diff origin/<S.base>...origin/<branch>. Vòng <n>.<nếu S.selfReviewConflict: Tự review.> \
Liệt kê mọi issue (Finding) và mọi case chưa cover hết AC + yêu cầu của story (mục 'Chưa cover'). \
Rà thêm over-engineering trên diff theo skill ponytail-review nếu có (tối đa P2 trừ khi gây lỗi).\
<nếu CI đỏ: CI đang lỗi: <tên job + đuôi log>.>\
<nếu n>1: Kiểm tra các finding và mục chưa cover của vòng trước trong <S.runDir>/review-r<n-1>.md đã được xử lý chưa.>" \
  < /dev/null > "<S.runDir>/review-r<n>.log" 2>&1
```
Không sửa, không rút gọn kết luận của Codex.

### Reviewer = claude
Luôn review bằng subagent (ngữ cảnh riêng, không làm phình phiên chính, và độc lập với người viết): gọi Agent tool
`subagent_type: general-purpose`, `model: <S.claudeReviewModel>` (mặc định `sonnet` — rẻ hơn, đủ cho review theo AC;
đổi trong `routing.json`), `run_in_background: false`. Prompt chỉ gồm: dùng skill `solar-pr-review`, số PR, branch,
base, đường dẫn story và plan, vòng `n`, file review vòng trước (nếu có), rà over-engineering bằng `ponytail-review`
(nếu đã cài), file UI thì áp thêm `web-design-guidelines`,
và yêu cầu ghi kết quả vào `<S.runDir>/review-r<n>.md` rồi chỉ trả về dòng `VERDICT` + số finding P0/P1/P2.
Không đưa tóm tắt "đã làm gì" của người viết. Phiên chính chỉ đọc kết quả trả về, không đọc lại diff.

## 3. Review ở local — không đăng lên PR

Kết quả review chỉ nằm ở `<S.runDir>/review-r<n>.md`. **Không** đăng review hay comment lên PR (kể cả comment "đã sửa"
hay "sẵn sàng merge"). Báo người dùng trong phiên: dòng `VERDICT`, danh sách tiêu đề issue (P0/P1/P2) và các case chưa
cover.

## 4. Xử lý kết luận

**PR merge được** khi đủ cả 4 điều kiện:
1. `VERDICT: APPROVE` — không còn finding P0/P1, không AC ❌, mục "Chưa cover" trống (hoặc chỉ còn mục `[ngoài agent]`
   đã có bằng chứng, vd. CI).
2. CI xanh trên commit cuối của PR: GitHub MCP `pull_request_read` (`method: get_check_runs` / `get_status`) hoặc
   `gh pr checks <số> --watch`. CI đang chạy → chờ (`gh … --watch`, hoặc ScheduleWakeup/Monitor ~5 phút/lần), không
   poll dày. Mục `[ngoài agent]` cần CI làm bằng chứng → CI xanh thì tick AC đó trong `S.epicFile`, commit
   `docs(roadmap): tick AC [<ID>]`, push.
3. Không conflict với base (`pull_request_read` `method: get` → `mergeable`/`mergeable_state`). Conflict → rebase/merge base
   vào branch (Claude làm, Codex sửa nếu có lỗi), chạy lại `verify`.
4. `node scripts/agents/run.mjs verify <ID>` chỉ còn cảnh báo đã được ghi chú trong PR.

- Đủ 4 điều kiện → báo người dùng (PushNotification nếu có) kèm finding P2 còn lại, và kết thúc. **Không tự merge.** Finding P2 không chặn: liệt kê, không bắt sửa.
- Chưa đủ (`VERDICT: CHANGES_REQUESTED`, CI đỏ hoặc conflict) → người viết sửa các finding P0/P1, mọi mục "Chưa cover"
  không gắn `[ngoài agent]`, và lỗi CI:
  - Người viết Codex (chạy nền, Codex không ghi được `.git` nên Claude commit bằng `node scripts/agents/run.mjs commit <S.runDir>/fix-r<n>-report.md` — xem
    `run-story`):
    ```bash
    git switch <branch>
    codex exec -C "$(pwd)" -s workspace-write -c sandbox_workspace_write.network_access=true \
      -c model_reasoning_effort=<S.codexEffort.exec> \
      -o "<S.runDir>/fix-r<n>.md" "Dùng skill solar-story-exec. Sửa các finding P0/P1 và mọi mục 'Chưa cover' \
    (trừ [ngoài agent]) trong <S.runDir>/review-r<n>.md cho story <ID> trên branch <branch>; mỗi case chưa cover phải \
    có code + test/bằng chứng.<nếu CI đỏ: Sửa lỗi CI: <tên job + đuôi log>.> Không làm thêm việc khác. \
    Chạy lại lệnh kiểm tra trong <S.planFile>. Báo cáo: <S.runDir>/fix-r<n>-report.md" \
      < /dev/null > "<S.runDir>/fix-r<n>.log" 2>&1
    ```
  - Người viết Claude: tự sửa trên branch.
  - Story `split`: finding về trình bày (bố cục, tương phản, responsive, hiệu ứng) → Claude sửa; finding về logic/schema/
    test → Codex sửa như trên.
  - `node scripts/agents/run.mjs verify <ID>` (chỉ đọc tóm tắt), `git push` (ghi SHA commit sửa cho báo cáo cuối).
  - Chờ CI của commit mới, rồi quay lại bước 1 với vòng `n+1` (reviewer theo `S.reviewer` review lại toàn bộ PR).
  - **Ngoại lệ — vòng sửa nhỏ, Claude tự kết luận** khi đủ cả:
    - `S.author = codex` và reviewer là Claude (`S.reviewer = claude`, không bị `--reviewer` ghi đè sang Codex);
    - diff của vòng sửa (`git diff <SHA trước sửa>..HEAD`) chỉ đụng tài liệu (`roadmap/`, `*.md`), cấu hình nhỏ
      (`package.json`, `tsconfig*`, `turbo.json`, eslint/CI config) hoặc lockfile — lockfile không tính vào giới hạn dòng;
    - tổng ≤ ~20 dòng thay đổi (không tính lockfile), không đổi logic/source, không thêm dependency runtime;
    - CI xanh trên commit cuối, không conflict.
    Claude tự đọc diff vòng sửa, đối chiếu từng finding / mục "Chưa cover" của `review-r<n>.md`, ghi kết luận vào
    `<S.runDir>/review-r<n+1>.md` theo định dạng `solar-pr-review` (dòng đầu `VERDICT: …`, ghi "Claude kiểm vòng sửa nhỏ").
    Có điểm nghi ngờ (thay đổi lan rộng, finding chưa rõ đã sửa) → quay về review đầy đủ theo `S.reviewer`.
    Khi `S.author = claude`, không dùng ngoại lệ này; Codex phải review lại theo routing review chéo.
  - Dừng sớm và báo người dùng (kèm ý kiến của Claude: đồng ý / cho rằng finding sai và vì sao) khi: cùng một finding
    "chưa sửa" ở 2 vòng liền; finding cần quyết định của người dùng (phạm vi, dependency, đổi AC); hoặc chạm chặn an toàn
    ở mục 1.3.
- Reviewer báo finding mà người viết cho là sai → không tự bỏ qua: ghi phản biện vào `<S.runDir>/review-r<n>-rebuttal.md`
  và đưa vào prompt review vòng sau; vẫn bất đồng → để người dùng quyết.

## 5. Báo cáo

Một đoạn ngắn: PR, reviewer, số vòng, issue và case chưa cover đã sửa qua các vòng, trạng thái CI, finding P2 còn lại
(nếu có), link PR, và câu chốt **"PR #<số> sẵn sàng merge — bạn tự merge"** (hoặc lý do dừng).
