---
name: run-story
description: Playbook chạy trọn một story của roadmap, chia tải cân bằng giữa Claude và Codex — Codex khảo sát/viết nháp plan, Claude chốt plan và tạo branch, Codex hoặc Claude thực thi (story UI chia Codex dựng + Claude design pass), script kiểm tra/commit/PR, review theo reviewPolicy (mặc định Codex review, Claude review story kiến trúc). Dùng khi người dùng gõ /run-story <STORY-ID|next> hoặc nói "chạy story E1-S01".
argument-hint: "<STORY-ID|next> [--agent claude|codex] [--confirm] [--no-pr] [--force]"
---

# /run-story — playbook một story

Tham số: `$ARGUMENTS`
- `<STORY-ID>` (vd. `E1-S01`) hoặc `next`.
- `--agent claude|codex`: ép người thực thi toàn bộ (bỏ qua mode trong `routing.json`).
- `--confirm`: dừng sau bước plan để người dùng duyệt. `--no-pr`: dừng sau commit. `--force`: chạy dù thiếu phụ thuộc.

## Nguyên tắc tiết kiệm token của Claude

- **Việc đọc nhiều → Codex** (khảo sát code, đọc branch template, viết nháp, dựng code). **Việc cơ học → script**
  (`scripts/agents/run.mjs`). Claude chỉ: chốt plan, design pass giao diện, phán đoán khi có lỗi, review story chẵn.
- Không đọc log dài: chỉ đọc output tóm tắt của script; mở `checks.log` / `codex-exec.log` khi script báo FAIL, và chỉ
  đọc phần đuôi.
- Không đọc lại toàn bộ file Codex đã sửa; dùng `git diff --stat` và chỉ mở file khi cần phán đoán.
- Lệnh `codex exec` luôn chạy nền (`run_in_background: true`) và chờ thông báo — không poll.
- Báo tiến độ bằng một câu ngắn mỗi bước.

## Bước 0 — Chuẩn bị

1. `node scripts/agents/story.mjs info <ID>` (hoặc `next`) → JSON `S`. Dùng `S.mode` (`claude` | `split` | `codex`),
   `S.planMode` (`claude` | `codex-draft`), `S.author`, `S.reviewer`, `S.branch`, `S.base`, `S.planFile`, `S.runDir`,
   `S.codexEffort`, `S.claudeReviewModel`. `--agent` → `S.mode = <agent>` (codex) hoặc `claude`.
2. Dừng và báo nếu: `S.done`; `!S.ready` và không `--force` (liệt kê `S.depStatus` chưa xong); `git status --porcelain`
   không rỗng (không tự stash).
3. `git fetch origin`, `git switch <S.base>`, `git pull --ff-only` (nếu base có trên origin).
4. Branch `S.branch` đã tồn tại → lần chạy trước dở: đọc `<S.runDir>/` và `HANDOFF.md`, hỏi người dùng tiếp tục hay làm lại.
5. `mkdir -p <S.runDir>`.

Mẫu lệnh Codex (thay `<EFFORT>`, `<OUT>`, `<LOG>`, `<PROMPT>`):
```bash
codex exec -C "$(pwd)" -s <read-only|workspace-write> -c model_reasoning_effort=<EFFORT> \
  -c sandbox_workspace_write.network_access=true -o "<OUT>" "<PROMPT>" > "<LOG>" 2>&1
```

## Bước 1 — Plan (Claude chốt, Codex làm phần đọc)

**`S.planMode == "codex-draft"`** (story logic thường):
1. Codex viết nháp: sandbox `workspace-write`, effort `S.codexEffort.plan`, prompt
   `Dùng skill solar-story-plan, mode draft. Story <ID> (<S.epicFile>). Output: <S.planFile>.`
2. Claude duyệt nháp: kiểm AC nào cũng có bằng chứng, phạm vi đúng, không mâu thuẫn ADR/AGENTS.md, câu hỏi `[chặn]`.
   Sửa trực tiếp chỗ sai (không viết lại cả plan), xóa dòng "Nháp do Codex viết".

**`S.planMode == "claude"`** (story kiến trúc hoặc UI):
1. Codex khảo sát: sandbox `workspace-write`, effort `S.codexEffort.plan`, prompt
   `Dùng skill solar-story-plan, mode brief. Story <ID> (<S.epicFile>). Output: <S.runDir>/brief.md.`
2. Claude viết `S.planFile` theo `roadmap/plans/README.md`, dựa trên brief; chỉ mở file code khi brief không đủ.
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
   Báo cáo: <S.runDir>/codex-report.md
   ```
2. Chạy nền: sandbox `workspace-write`, effort `S.codexEffort.exec`, output `<S.runDir>/codex-exec-last.md`,
   log `<S.runDir>/codex-exec.log`, prompt = nội dung file trên.
3. Đọc phần "Trạng thái", "Lệch so với plan", "Việc còn lại" của `codex-report.md` (không cần đọc cả file).
   `BLOCKED` → giải quyết câu hỏi (hỏi người dùng nếu cần) rồi chạy lại với "Tiếp tục".
4. `node scripts/agents/run.mjs commit <S.runDir>/codex-report.md` → commit theo "Commit đề xuất". Exit 2 (file lạc) →
   xem file đó: thuộc story thì commit kèm message phù hợp `[<ID>]`; không thì để nguyên và báo người dùng.

**`split`** — thêm Claude design pass sau khi Codex dựng xong:
1. Chạy dev server, dùng MCP `playwright` chụp các trang/section của story ở 390px và 1440px (light/dark nếu theme có,
   ≥ 3 theme với section variant). Story port template: so với branch gốc (`git show`/ảnh chụp branch gốc).
2. Dùng skill `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`: chỉ sửa phần trình bày (bố cục, khoảng cách,
   typography, hiệu ứng, tương phản, responsive, a11y) — không viết lại logic/schema của Codex. Lỗi logic → ghi lại để
   Codex sửa (vòng "Tiếp tục").
3. Commit `style(<scope>): design pass … [<ID>]` + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
   Ảnh chụp lưu `<S.runDir>/screenshots/`. Ghi ngắn vào `<S.runDir>/design-pass.md` những gì đã chỉnh.

**`claude`** — Claude làm toàn bộ (story thiết kế UX mới):
1. Thực thi theo plan với các skill giao diện ở trên + `vercel-react-best-practices`, `vercel-composition-patterns`.
2. Kiểm trực quan như design pass; commit theo bước `<type>(<scope>): … [<ID>]` + dòng Co-Authored-By của Claude.
3. Ghi `<S.runDir>/claude-report.md` cùng khung báo cáo của Codex (AC → bằng chứng, Lệnh kiểm tra, Lệch so với plan).

## Bước 4 — Kiểm chứng (script)

`node scripts/agents/run.mjs verify <ID>` → đọc vài dòng tóm tắt.
- PASS → bước 5.
- FAIL → đọc phần đuôi lỗi script in ra. Lỗi do Codex → chạy lại bước 3 (Codex) với prompt
  `Dùng skill solar-story-exec. Tiếp tục story <ID>. Sửa: <tóm tắt> (log: <S.runDir>/checks.log)`, rồi `run.mjs commit`.
  Lỗi trình bày/design → Claude sửa. Tối đa **2 vòng**; hết vòng → ghi `HANDOFF.md`, dừng, báo người dùng.
- "Ngoài danh sách file của plan" → xem nhanh, hợp lý thì ghi chú vào PR, không thì yêu cầu bỏ.
- AC chưa tick đủ mà bằng chứng có → tick, commit `docs(roadmap): tick AC [<ID>]`.

`--no-pr` → dừng, báo kết quả.

## Bước 5 — Push & PR

1. `git ls-remote --exit-code --heads origin <S.base>` không có → `git push -u origin <S.base>` (báo một dòng).
2. `git push -u origin <S.branch>` (không `--force`; lỗi → báo nguyên văn, dừng).
3. `node scripts/agents/run.mjs pr-body <ID>` → `{title, bodyFile, base, head}`. Tạo PR với nội dung file đó:
   GitHub MCP `create_pull_request` (ToolSearch `+github pull request` nếu chưa tải) → hoặc `gh pr create --body-file` →
   hoặc in link `compare` cho người dùng tự tạo và dừng. Ghi `<S.runDir>/pr.json`.

## Bước 6 — Review

Gọi skill `pr-review` với số PR.

## Bước 7 — Kết thúc

Báo ngắn: link PR, ai làm gì (plan / dựng / design pass / review), kết luận review, số vòng sửa, việc người dùng cần làm
(merge thủ công). **Không tự merge.** Khi người dùng báo PR đã merge: trên base, gắn ✅ vào heading story + link PR trong
`S.epicFile`, commit `docs(roadmap): <ID> done`, hỏi trước khi push.
