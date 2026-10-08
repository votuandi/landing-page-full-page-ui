---
name: run-story
description: Playbook chạy trọn một story của roadmap — Claude lên plan và tạo branch, Codex (story logic) hoặc Claude (story UI/UX) thực thi, Claude kiểm tra, commit, push, tạo PR, rồi review chéo theo chẵn/lẻ số story. Dùng khi người dùng gõ /run-story <STORY-ID|next> hoặc nói "chạy story E1-S01".
argument-hint: "<STORY-ID|next> [--agent claude|codex] [--confirm] [--no-pr]"
---

# /run-story — playbook một story

Tham số: `$ARGUMENTS`
- `<STORY-ID>` (vd. `E1-S01`) hoặc `next` (story chưa xong đầu tiên đã đủ phụ thuộc).
- `--agent claude|codex`: ép người thực thi (bỏ qua `scripts/agents/routing.json`).
- `--confirm`: dừng sau bước plan để người dùng duyệt.
- `--no-pr`: dừng sau commit (không push, không PR, không review).
- `--force`: chạy dù phụ thuộc chưa xong.

Mọi file tạm của lần chạy nằm trong `.agent-runs/<ID>/` (đã `.gitignore`). Báo tiến độ cho người dùng bằng một câu ngắn
ở đầu mỗi bước ("Bước 3/7: Codex đang thực thi plan…").

## Bước 0 — Chuẩn bị

1. `node scripts/agents/story.mjs info <ID>` (hoặc `next`) → lưu JSON (gọi là `S`). Từ đây dùng `S.author`, `S.reviewer`,
   `S.branch`, `S.base`, `S.planFile`, `S.runDir`, `S.checks`, `S.epicFile`, `S.selfReviewConflict`.
   `--agent` ghi đè `S.author`; khi đó tính lại reviewer: `S.parity == "odd" ? "codex" : "claude"`.
2. Dừng và báo người dùng nếu:
   - `S.done` là true (story đã xong).
   - `S.ready` là false và không có `--force` → liệt kê phụ thuộc chưa xong từ `S.depStatus`.
   - `git status --porcelain` không rỗng (cây làm việc bẩn) → yêu cầu commit/stash trước. Không tự stash.
3. `git fetch origin` rồi `git switch <S.base>` và `git pull --ff-only` (nếu base đã có trên origin).
4. Nếu branch `S.branch` đã tồn tại (local hoặc origin) → lần chạy trước còn dở: đọc `.agent-runs/<ID>/` và `HANDOFF.md`
   nếu có, hỏi người dùng tiếp tục hay làm lại. Không xóa branch khi chưa được đồng ý.
5. `mkdir -p <S.runDir>`.

## Bước 1 — Claude lên plan (luôn do Claude làm)

1. Đọc story trong `S.epicFile` (toàn bộ block: Chi tiết, Target, AC), phần đầu epic, `AGENTS.md`, các ADR liên quan trong
   `roadmap/02-decisions.md`, và code hiện có mà story sẽ chạm (Grep/Read). Story port template thì đọc file nguồn bằng
   `git show origin/template-NN:<path>`. Nếu cần tài liệu thư viện: MCP `context7`.
2. Viết `S.planFile` theo khung ở `roadmap/plans/README.md`. Yêu cầu:
   - Mỗi AC ánh xạ tới bước cụ thể và **bằng chứng** sẽ thu (lệnh test, output, ảnh chụp).
   - Liệt kê file sẽ tạo/sửa/xóa; "Ngoài phạm vi" ghi rõ thứ không được đụng.
   - Lệnh kiểm tra cuối = `S.checks` + lệnh riêng của story.
   - Plan đủ để một agent không có ngữ cảnh làm theo được; không viết code hoàn chỉnh trong plan (chỉ chữ ký hàm/kiểu
     khi cần chốt giao diện).
3. "Câu hỏi mở" có mục chặn (cần quyết định kinh doanh, chọn giữa hai phương án kiến trúc ngang nhau) → hỏi người dùng
   bằng AskUserQuestion, ghi câu trả lời vào plan. Câu hỏi có mặc định hợp lý → tự chọn, ghi lý do.
4. `--confirm` → hiển thị tóm tắt plan (mục tiêu, file, rủi ro) và chờ người dùng duyệt.

## Bước 2 — Thực thi

### 2a. `S.author == "codex"` (story logic)

Sandbox của Codex trên Windows khóa ghi `.git` (đã kiểm chứng: `git switch`, `git add`, `git commit` đều bị từ chối, kể cả
với `--add-dir .git`). Vì vậy **Claude tạo branch và commit**, Codex chỉ sửa file và đề xuất cách chia commit.

1. `git switch -c <S.branch>`; commit plan: `docs(plan): <ID> plan`.
2. Ghi prompt vào `<S.runDir>/codex-exec-prompt.md`:
   ```
   Dùng skill solar-story-exec.
   Story: <ID> — <S.title> (<S.epicFile>)
   Plan: <S.planFile> · Branch (đã tạo, đang checkout): <S.branch> · Base: <S.base>
   Lệnh kiểm tra bắt buộc: <S.checks + lệnh riêng trong plan>
   Báo cáo: <S.runDir>/codex-report.md
   ```
3. Chạy nền (Bash `run_in_background: true`), chờ thông báo hoàn tất — không poll:
   ```bash
   codex exec -C "$(pwd)" -s workspace-write -c sandbox_workspace_write.network_access=true \
     -o "<S.runDir>/codex-exec-last.md" "$(cat <S.runDir>/codex-exec-prompt.md)" \
     > "<S.runDir>/codex-exec.log" 2>&1
   ```
4. Đọc `<S.runDir>/codex-report.md` (và `codex-exec-last.md` nếu thiếu report).
5. Commit theo mục "Commit đề xuất": với từng mục, `git add -- <các file>` rồi `git commit` với đúng message, thêm dòng
   cuối `Co-Authored-By: Codex <noreply@openai.com>`. File thay đổi không nằm trong mục nào → xem xét: thuộc story thì đưa
   vào commit hợp lý nhất và ghi chú trong PR; không thuộc (rác, file tạm) → không commit, báo người dùng.
   Không commit `.agent-runs/`, `HANDOFF.md`, `.env*`.

### 2b. `S.author == "claude"` (story UI/UX)

1. `git switch -c <S.branch>`; commit plan: `docs(plan): <ID> plan`.
2. Tự thực thi theo plan, dùng skill: `frontend-design`, `ui-ux-pro-max`, `solar-section-variant`, `solar-theme-port`,
   `vercel-react-best-practices`, `vercel-composition-patterns` (tùy story). Không làm ngoài phạm vi plan.
3. Kiểm tra trực quan bằng MCP `playwright` (hoặc skill `webapp-testing`): 390px và 1440px, light/dark nếu theme có dark,
   ít nhất 3 theme khi là section variant. Lưu ảnh vào `<S.runDir>/screenshots/`. Chạy `web-design-guidelines` trên file đã sửa.
4. Commit theo từng bước logic: `<S.commitType>(<scope>): <mô tả> [<ID>]`, cuối message có dòng
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
5. Ghi `<S.runDir>/claude-report.md` cùng khung với báo cáo Codex (AC → bằng chứng).

## Bước 3 — Claude kiểm chứng (không tin báo cáo, tự chạy lại)

1. `git branch --show-current` phải là `S.branch`; `git log <S.base>..HEAD --oneline` có commit; mọi commit có `[<ID>]`.
2. Chạy lại từng lệnh trong `S.checks` + lệnh riêng của plan. Lưu output vào `<S.runDir>/checks.log`.
3. `git diff --stat <S.base>...HEAD`: file nằm ngoài danh sách của plan → xem có hợp lý không.
4. Đối chiếu từng AC với bằng chứng. AC chưa đạt hoặc check lỗi:
   - Author Codex: chạy lại 2a bước 3–5 với prompt `Dùng skill solar-story-exec. Tiếp tục story <ID> trên branch
     <S.branch>. Sửa các lỗi sau: <tóm tắt + đường dẫn checks.log>`. Tối đa **2 vòng**.
   - Author Claude: tự sửa, tối đa 2 vòng.
   - Hết vòng vẫn lỗi → ghi `HANDOFF.md` (không commit), dừng, báo người dùng lỗi cụ thể.
5. Đảm bảo AC đã tick `[x]` trong `S.epicFile` (chỉ AC có bằng chứng) và heading story **chưa** gắn ✅ (gắn ✅ khi merge).
   Thiếu thì commit `docs(roadmap): tick AC [<ID>]`.

`--no-pr` → dừng ở đây, báo kết quả.

## Bước 4 — Push

1. Base phải có trên origin: `git ls-remote --exit-code --heads origin <S.base>`; nếu chưa có → `git push -u origin <S.base>`
   (báo người dùng một dòng).
2. `git push -u origin <S.branch>`. Push lỗi (xác thực, bị từ chối) → dừng, báo nguyên văn lỗi. Không dùng `--force`.

## Bước 5 — Tạo PR

- Tiêu đề: `<S.commitType>(<scope>): <S.title> [<ID>]` (≤ 72 ký tự, cắt tiêu đề nếu dài).
- Nội dung: theo `.github/pull_request_template.md`, điền: link story, link plan, người viết (`S.author`), reviewer
  (`S.reviewer`), cảnh báo tự review nếu `S.selfReviewConflict`, bảng AC → bằng chứng, output check tóm tắt, ảnh chụp
  (story UI: liệt kê đường dẫn trong `.agent-runs`, hoặc tải lên nếu công cụ cho phép). Dòng cuối:
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Công cụ, theo thứ tự ưu tiên:
  1. GitHub MCP connector: `create_pull_request` (owner/repo lấy từ `git remote get-url origin`), `base = S.base`.
     Tải công cụ bằng ToolSearch `+github pull request` nếu chưa có.
  2. `gh pr create --base <S.base> --head <S.branch> --title … --body-file <S.runDir>/pr-body.md`.
  3. Không có cả hai → in link `https://github.com/<owner>/<repo>/compare/<S.base>...<S.branch>?expand=1` và nội dung PR
     cho người dùng tự tạo; dừng playbook ở đây (bước review cần số PR).
- Ghi số PR vào `<S.runDir>/pr.json`.

## Bước 6 — Review chéo

Gọi skill `pr-review` với số PR (nó tự chọn reviewer theo chẵn/lẻ và xử lý vòng sửa lỗi).

## Bước 7 — Kết thúc

Báo người dùng (ngắn): link PR, người viết → reviewer, kết quả review cuối (APPROVE / còn vấn đề), số vòng sửa, việc người
dùng cần làm (merge thủ công; sau khi merge chạy `/run-story next`). **Không tự merge.**
Sau khi PR được merge (người dùng báo), commit trên base: gắn ✅ vào heading story + link PR trong `S.epicFile`.
