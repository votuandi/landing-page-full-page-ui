---
name: run-story
description: Playbook chạy trọn một story của roadmap, chia tải cân bằng giữa Claude và Codex — Codex khảo sát/viết nháp plan, Claude chốt plan và tạo branch, Codex hoặc Claude thực thi (story UI chia Codex dựng + Claude design pass), script kiểm tra/commit/PR, rồi reviewer theo routing review PR ở local (issue + case chưa cover AC/yêu cầu, không đăng lên PR) và sửa lặp lại cho tới khi PR merge được — báo người dùng tự merge. Dùng khi người dùng gõ /run-story <STORY-ID|next> hoặc nói "chạy story E1-S01".
argument-hint: "<STORY-ID|next> [--agent claude|codex] [--confirm] [--no-pr] [--force]"
---

# /run-story — playbook một story

Tham số: `$ARGUMENTS`
- `<STORY-ID>` (vd. `E1-S01`) hoặc `next`.
- `--agent claude|codex`: ép người thực thi toàn bộ (bỏ qua mode trong `routing.json`).
- `--confirm`: dừng sau bước plan để người dùng duyệt. `--no-pr`: dừng sau commit. `--force`: chạy dù thiếu phụ thuộc.

## Nguyên tắc tiết kiệm token của Claude

- **Việc đọc nhiều → Codex** (khảo sát code, đọc branch template, viết nháp, dựng code). **Việc cơ học → script**
  (`scripts/agents/run.mjs`). Claude chỉ: chốt plan, design pass giao diện, phán đoán khi có lỗi, điều phối review theo S.reviewer.
- Không đọc log dài: chỉ đọc output tóm tắt của script; mở `checks.log` / `codex-exec.log` khi script báo FAIL, và chỉ
  đọc phần đuôi.
- Không đọc lại toàn bộ file Codex đã sửa; dùng `git diff --stat` và chỉ mở file khi cần phán đoán.
- Lệnh `codex exec` luôn chạy nền (`run_in_background: true`) và chờ thông báo — không poll.
- Báo tiến độ bằng một câu ngắn mỗi bước.

## Skill bổ trợ (E0-S07)

Dùng ở đúng bước ghi bên dưới **nếu skill đã cài** (có trong `.claude/skills` / `.agents/skills`); chưa cài thì bỏ
qua, chạy như cũ và ghi một dòng vào report. Quy tắc `AGENTS.md` (token, schema, tenant, entitlement) luôn ưu tiên hơn.

| Skill | Bước | Dùng để |
|---|---|---|
| `graphify` | 1 (khảo sát) | Có `graphify-out/` → hỏi đồ thị (`graphify query`) để định vị file trước khi Grep/Glob/Read; đồ thị cũ hơn base → `graphify update` trước. Chưa có → bỏ qua (dựng đồ thị lần đầu là việc riêng, không làm trong story) |
| `ponytail`, `ponytail-review` | 3 (thực thi), 6 (review) | Viết ít code nhất cần thiết (mức `full`); review over-engineering trên diff |
| `playwright-cli` | 3 (design pass, bằng chứng UI) | Chụp ảnh/kiểm tra trang khi MCP `playwright` không kết nối được |
| Agent Skills (Addy Osmani): `test-driven-development`, `debugging-and-error-recovery`, `code-simplification`, `performance-optimization`, `security-and-hardening`, `frontend-ui-engineering`, `browser-testing-with-devtools`, `source-driven-development` | 3, 4 | Test, debug khi `verify` FAIL, hiệu năng web, bảo mật (tenant/auth/upload), UI, tra tài liệu gốc. Bộ planning/review/ship của repo này không cài — playbook dưới thay thế |
| OmniRoute: `cli-setup`, `omni-auth`, `omni-mcp` | — | Chưa gắn vào bước nào (dự án chưa chạy gateway OmniRoute) |

## Bước 0 — Chuẩn bị

1. `node scripts/agents/story.mjs info <ID>` (hoặc `next`) → JSON `S`. Dùng `S.mode` (`claude` | `split` | `codex`),
   `S.planMode` (`claude` | `codex-draft`), `S.planBrief`, `S.author`, `S.reviewer`, `S.branch`, `S.base`, `S.planFile`, `S.runDir`,
   `S.codexEffort`, `S.claudeReviewModel`. Khi có `--agent`, cập nhật `S.mode` và `S.author` theo agent ép;
   tính lại reviewer theo reviewPolicy và selfReview (swap nếu trùng author), rồi tính selfReviewConflict theo reviewer cuối.
   Dùng cùng vai trò này khi sinh PR body. Chỉ khi cần để CLI trả đúng vai trò, tạm đặt `authorOverride` của story
   trong `routing.json`; ghi lại giá trị cũ, khôi phục sau khi gọi CLI và trước mọi commit. Không commit thay đổi
   `routing.json` do `--agent`; mỗi lần gọi CLI tiếp theo cần override thì tạm đặt lại và khôi phục như trên.
2. Dừng và báo nếu: `S.done`; `!S.ready` và không `--force` (liệt kê `S.depStatus` chưa xong); `git status --porcelain`
   không rỗng (không tự stash).
3. `git fetch origin`, `git switch <S.base>`, `git pull --ff-only` (nếu base có trên origin).
4. Branch `S.branch` đã tồn tại → lần chạy trước dở. Đã có PR mở cho branch (GitHub MCP `list_pull_requests` với
   `head: <owner>:<S.branch>`) → nhảy thẳng tới **Bước 6** (bỏ qua điều kiện working tree của base). Chưa có PR nhưng
   branch đã push và `<S.runDir>/` có report/commit đã xong → nhảy tới **Bước 5.3** tạo PR. Còn lại → đọc
   `<S.runDir>/` và `HANDOFF.md`, hỏi người dùng tiếp tục hay làm lại.
5. `mkdir -p <S.runDir>`.

Mẫu lệnh Codex (thay `<EFFORT>`, `<OUT>`, `<LOG>`, `<PROMPT>`):
```bash
codex exec -C "$(pwd)" -s <read-only|workspace-write> -c model_reasoning_effort=<EFFORT> \
  -c sandbox_workspace_write.network_access=true -o "<OUT>" "<PROMPT>" < /dev/null > "<LOG>" 2>&1
```

## Bước 1 — Plan (Claude chốt, Codex làm phần đọc)

**`S.planMode == "codex-draft"`** (story logic thường):
1. Codex viết nháp: sandbox `workspace-write`, effort `S.codexEffort.plan`, prompt
   `Dùng skill solar-story-plan, mode draft. Story <ID> (<S.epicFile>). Output: <S.planFile>.`
2. Claude duyệt nháp: kiểm AC nào cũng có bằng chứng, phạm vi đúng, không mâu thuẫn ADR/AGENTS.md, câu hỏi `[chặn]`.
   Sửa trực tiếp chỗ sai (không viết lại cả plan), xóa dòng "Nháp do Codex viết".

**`S.planMode == "claude"`** (mọi story khi `planPolicy: "claude"`; story kiến trúc hoặc UI khi `planPolicy: "budget"`):
1. `S.planBrief == true` → Codex khảo sát: sandbox `workspace-write`, effort `S.codexEffort.plan`, prompt
   `Dùng skill solar-story-plan, mode brief. Story <ID> (<S.epicFile>). Output: <S.runDir>/brief.md.`
   `S.planBrief == false` → **không gọi Codex**; Claude tự khảo sát: đọc story trong epic, plan/ADR liên quan và chỉ
   những file code cần thiết (hỏi `graphify` trước nếu có, rồi Grep/Glob, đọc đoạn cần, không đọc cả cây).
2. Claude viết `S.planFile` theo `roadmap/plans/README.md` (dựa trên brief nếu có).
   Story `split`: thêm mục **"Design pass"** — Claude sẽ tự làm phần nào (bố cục, khoảng cách, hiệu ứng, tương phản,
   responsive), Codex dựng phần nào (schema, fixture, cấu trúc component, đổi màu sang token, logic).

Cả hai trường hợp: câu hỏi `[chặn]` → AskUserQuestion, ghi câu trả lời vào plan. `--confirm` → tóm tắt plan, chờ duyệt.

## Bước 2 — Branch

`git switch -c <S.branch>`; `git add <S.planFile>`; commit `docs(plan): <ID> plan`.
(Sandbox Codex khóa ghi `.git` — Claude luôn tạo branch và commit.)

## Bước 3 — Thực thi theo `S.mode`

**`codex`** và **`split`** — Codex dựng:
1. Ghi `<S.runDir>/codex-exec-prompt.md`:
   ```
   Dùng skill solar-story-exec.
   Story: <ID> — <S.title> (<S.epicFile>) · Plan: <S.planFile>
   Branch (đã checkout): <S.branch> · Base: <S.base> · Mode: <S.mode>
   Lệnh kiểm tra: <S.checks + lệnh riêng trong plan>
   Skill bổ trợ (nếu có trong .agents/skills): ponytail mức full khi viết code; test-driven-development,
   debugging-and-error-recovery khi viết test/sửa lỗi.
   Quy tắc AGENTS.md ưu tiên hơn ponytail.
   Báo cáo: <S.runDir>/codex-report.md
   ```
2. Chạy nền: sandbox `workspace-write`, effort `S.codexEffort.exec`, output `<S.runDir>/codex-exec-last.md`,
   log `<S.runDir>/codex-exec.log`, prompt = nội dung file trên.
3. Đọc phần "Trạng thái", "Lệch so với plan", "Việc còn lại" của `codex-report.md` (không cần đọc cả file).
   `BLOCKED` → giải quyết câu hỏi (hỏi người dùng nếu cần) rồi chạy lại với "Tiếp tục".
4. `node scripts/agents/run.mjs commit <S.runDir>/codex-report.md` → commit theo "Commit đề xuất". Exit 2 (file lạc) →
   xem file đó: thuộc story thì commit kèm message phù hợp `[<ID>]`; không thì để nguyên và báo người dùng.

**`split`** — thêm Claude design pass sau khi Codex dựng xong:
1. Chạy dev server, dùng MCP `playwright` (không kết nối được → skill `playwright-cli`) chụp các trang/section của story
   ở 390px và 1440px (light/dark nếu theme có, ≥ 3 theme với section variant). Story port template: so với branch gốc
   (`git show`/ảnh chụp branch gốc).
2. Dùng skill `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`: chỉ sửa phần trình bày (bố cục, khoảng cách,
   typography, hiệu ứng, tương phản, responsive, a11y) — không viết lại logic/schema của Codex. Lỗi logic → ghi lại để
   Codex sửa (vòng "Tiếp tục").
3. Commit `style(<scope>): design pass … [<ID>]` + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
   Ảnh chụp lưu `<S.runDir>/screenshots/`. Ghi ngắn vào `<S.runDir>/design-pass.md` những gì đã chỉnh.

**`claude`** — Claude làm toàn bộ (story thiết kế UX mới):
1. Thực thi theo plan với các skill giao diện ở trên + `vercel-react-best-practices`, `vercel-composition-patterns`,
   `ponytail` (mức `full`).
2. Kiểm trực quan như design pass; commit theo bước `<type>(<scope>): … [<ID>]` + dòng Co-Authored-By của Claude.
3. Ghi `<S.runDir>/claude-report.md` cùng khung báo cáo của Codex (AC → bằng chứng, Lệnh kiểm tra, Lệch so với plan).

## Bước 4 — Kiểm chứng (script)

`node scripts/agents/run.mjs verify <ID>` → đọc vài dòng tóm tắt.
- PASS → bước 5.
- FAIL → đọc phần đuôi lỗi script in ra. Lỗi do Codex → chạy lại bước 3 (Codex) với prompt
  `Dùng skill solar-story-exec. Tiếp tục story <ID>. Sửa: <tóm tắt> (log: <S.runDir>/checks.log)`, rồi `run.mjs commit`.
  Lỗi khó đoán nguyên nhân → thêm vào prompt "dùng skill debugging-and-error-recovery".
  Lỗi trình bày/design → Claude sửa. Tối đa **2 vòng**; hết vòng → ghi `HANDOFF.md`, dừng, báo người dùng.
- "Ngoài danh sách file của plan" → xem nhanh, hợp lý thì ghi chú vào PR, không thì yêu cầu bỏ.
- AC chưa tick đủ mà bằng chứng có → tick, commit `docs(roadmap): tick AC [<ID>]`.

`--no-pr` → dừng, báo kết quả.

## Bước 5 — Push & PR

1. `git ls-remote --exit-code --heads origin <S.base>` không có → `git push -u origin <S.base>` (báo một dòng).
2. `git push -u origin <S.branch>` (không `--force`; lỗi → báo nguyên văn, dừng).
3. `node scripts/agents/run.mjs pr-body <ID>` → `{title, bodyFile, base, head}`. Tạo PR với nội dung file đó, thử lần
   lượt, cách nào được thì dừng:
   1. GitHub MCP `create_pull_request` (ToolSearch `+github pull request` nếu chưa tải).
   2. `gh pr create --base <base> --head <head> --title "<title>" --body-file <bodyFile>`.
   3. **Giao Codex tạo PR** (không bao giờ bắt người dùng tự tạo): sandbox `workspace-write`, effort `low`,
      out `<S.runDir>/codex-pr.md`, log `<S.runDir>/codex-pr.log`, prompt
      `Tạo pull request trên GitHub cho branch đã push: base <base>, head <head>, tiêu đề "<title>", nội dung đúng
      file <bodyFile>. Dùng gh pr create --base <base> --head <head> --title "<title>" --body-file <bodyFile>; nếu đã
      có PR mở cho head đó thì không tạo mới. Không sửa file, không chạy lệnh git ghi. Dòng cuối in đúng: PR_URL=<url>
      hoặc PR_ERROR=<lỗi nguyên văn>.` Đọc dòng `PR_URL=`/`PR_ERROR=` trong out.
   Cả ba đều lỗi → báo lỗi nguyên văn của từng cách (thường là thiếu quyền/auth GitHub) và dừng; không in link
   `compare` bắt người dùng tự tạo. Ghi `<S.runDir>/pr.json` (`{number, url, createdBy: "mcp"|"gh"|"codex"}`).

4. Chọn nhãn người viết `agent:<S.author>` (split dùng `agent:codex`). Bảo đảm nhãn tồn tại bằng GitHub MCP
   hoặc `gh label list`; tạo nếu thiếu bằng MCP hoặc `gh label create "<nhãn>" --description "Người viết chính"`.
   Sau đó gắn nhãn bằng MCP hoặc `gh pr edit <số> --add-label "<nhãn>"`. Kiểm lại title, labels và reviewer trong body.
   Không thêm workflow có quyền ghi để gắn nhãn. Nếu lỗi quyền, ghi lỗi và phần còn chờ trong report.

## Bước 6 — Review theo routing và sửa tới khi merge được

Gọi skill `pr-review` với số PR và `--reviewer <S.reviewer>`; không gọi Codex cố định. Codex reviewer dùng solar-pr-review ở phiên read-only độc lập; Claude reviewer dùng subagent độc lập, model S.claudeReviewModel, cùng định dạng solar-pr-review, đối chiếu toàn bộ diff với plan/AC/DoD. Ghi verdict, SHA và bằng chứng vào review-r<n>.md. Vòng lặp:
1. **S.reviewer review** toàn bộ PR (`solar-pr-review`): liệt kê mọi issue (Finding P0/P1/P2) và mọi case **chưa cover** AC,
   "Chi tiết"/"Target" của story, plan, DoD. Review **ở local** (`<S.runDir>/review-r<n>.md`), không đăng lên PR;
   báo người dùng danh sách issue + case chưa cover. Có `ponytail-review` → reviewer rà thêm over-engineering trên diff
   (code/abstraction/dependency thừa); loại finding này tối đa P2 trừ khi gây lỗi hoặc vi phạm AGENTS.md.
2. **Người viết S.author sửa** mọi finding P0/P1 + mọi mục chưa cover (trừ `[ngoài agent]`) + lỗi CI; Claude commit
   (`run.mjs commit`), `verify`, push.
3. Chờ CI, quay lại 1. Lặp tới khi PR **merge được**: `VERDICT: APPROVE`, không còn mục chưa cover, CI xanh, không
   conflict với base. Mục `[ngoài agent]` cần CI (vd. AC "chạy trên Windows/Ubuntu") → CI xanh thì Claude tick AC.
4. Dừng sớm, hỏi người dùng khi: finding lặp lại 2 vòng không sửa được, cần quyết định phạm vi/dependency/AC, hoặc quá
   5 vòng sửa.

Claude điều phối, quản lý git và đọc verdict; review Claude dùng subagent độc lập, trừ ngoại lệ vòng sửa nhỏ
đúng điều kiện trong skill pr-review. Sau mỗi vòng sửa, reviewer theo S.reviewer review lại SHA cuối.
Không suy reviewer từ nhãn người viết.

## Bước 7 — Kết thúc

Khi PR merge được (không comment gì lên PR), báo người dùng: link PR, ai làm gì (plan / dựng /
design pass / review), số vòng review–sửa, issue và case chưa cover đã sửa, CI, finding P2 còn lại, và câu chốt
**"PR #<số> sẵn sàng merge — bạn tự merge."** **Không tự merge.** Khi người dùng báo PR đã merge: trên base, gắn ✅ vào heading story + link PR trong
`S.epicFile`, commit `docs(roadmap): <ID> done`, hỏi trước khi push.
