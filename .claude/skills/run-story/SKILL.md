---
name: run-story
description: Playbook chạy trọn một story của roadmap, chia tải cân bằng giữa Claude và Codex — Codex khảo sát/viết nháp plan, Claude chốt plan và tạo branch, Codex hoặc Claude thực thi (story UI chia Codex dựng + Claude design pass), script kiểm tra/commit/PR, rồi reviewer theo routing review PR ở local (issue + case chưa cover AC/yêu cầu, không đăng lên PR) và sửa lặp lại cho tới khi PR merge được — báo người dùng tự merge. Dùng khi người dùng gõ /run-story <STORY-ID|next> hoặc nói "chạy story E1-S01".
argument-hint: "<STORY-ID|next> [--agent claude|codex] [--confirm] [--no-pr] [--force]"
---

# /run-story — playbook một story

Tham số: `$ARGUMENTS`
- `<STORY-ID>` (vd. `E1-S01`) hoặc `next`.
- `--agent claude|codex`: ép người thực thi toàn bộ (bỏ qua mode trong `routing.json`).
  - `--agent claude` = **chế độ chỉ Claude**: cả phiên không gọi Codex ở bất kỳ bước nào. Plan: Claude tự khảo sát
    (`S.planMode = "claude"`, `S.planBrief = false`). Thực thi: mode `claude`. PR: bỏ cách 3 (Codex tạo PR). Review và
    sửa: reviewer = Claude (subagent), người sửa = Claude. Bỏ qua "Việc đọc nhiều → Codex" ở dưới.
  - `--agent codex`: Codex thực thi toàn bộ; plan/review theo `routing.json` như bình thường.
- `--confirm`: dừng sau bước plan để người dùng duyệt. `--no-pr`: dừng sau commit. `--force`: chạy dù thiếu phụ thuộc.

## Nguyên tắc tiết kiệm token của Claude

- **Việc đọc nhiều → Codex** (khảo sát code, đọc branch template, viết nháp, dựng code). **Việc cơ học → script**
  (`scripts/agents/run.mjs`). Claude chỉ: chốt plan, design pass giao diện, phán đoán khi có lỗi, điều phối review theo S.reviewer.
- Không đọc log dài: chỉ đọc output tóm tắt của script; mở `checks.log` / `codex-exec.log` khi script báo FAIL, và chỉ
  đọc phần đuôi.
- Không đọc lại toàn bộ file Codex đã sửa; dùng `git diff --stat` và chỉ mở file khi cần phán đoán.
- Lệnh Codex (`scripts/agents/codex.sh`) luôn chạy nền (`run_in_background: true`) và chờ thông báo — không poll.
  Lượt sửa của cùng story dùng `resume` (giữ context), không mở phiên mới.
- Báo tiến độ bằng một câu ngắn mỗi bước.
- Sửa code bằng Edit/Write theo đoạn; không dùng script python/sed có escape phức tạp để sửa code (dễ hỏng, tốn lượt).
- Build web và chạy e2e **một lần ở cuối** mỗi vòng thực thi/sửa, không sau mỗi chỉnh nhỏ. Chỉ in đuôi log khi lỗi.
- Không đổi branch giữa chừng để "thử" script; kiểm tra script ngay trên branch đang làm.
- Không tự viết script chụp ảnh/probe trình duyệt: MCP `playwright` → lỗi thì `playwright-cli` → bằng chứng lâu dài thì
  spec trong `tooling/visual`.

## Skill (E0-S07, cập nhật sau retro E7-S03)

Cột "Bắt buộc" = phải load skill ở bước đó và ghi vào report mục `## Skill đã dùng` (`run.mjs verify` cảnh báo khi
thiếu `ponytail`/`codegraph`). Quy tắc `AGENTS.md` (token, schema, tenant, entitlement) luôn ưu tiên hơn mọi skill.

| Skill | Bước | Bắt buộc | Dùng để |
|---|---|---|---|
| `codegraph` (CLI + MCP `codegraph`) | 0, 1, 4.5, 6 | ✔ | `codegraph sync`; `explore`/`node` để định vị code; `impact <symbol>` để soát nơi bị ảnh hưởng khi sửa (tự review, vòng sửa). Index local `.codegraph/`, telemetry tắt |
| `graphify` | 1 | khi cần | Câu hỏi kiến trúc dính tài liệu/ADR; `S.graphs.graphify` báo `stale` → `python -m graphify update .` trước |
| `ponytail` | 3, vòng sửa | ✔ | Viết ít code nhất thỏa AC (mức `full`) |
| `ponytail-review` | 4.5, 6 | ✔ | Rà over-engineering trên diff (tối đa P2) |
| `test-driven-development` | 3, vòng sửa | ✔ | Bảng "Case biên & bất biến" → test viết trước; mỗi finding một test tái hiện FAIL trước |
| `verification-before-completion` (obra/superpowers) | 4, 5, 7 | ✔ | Chỉ báo "qua/xong/flaky" khi đã chạy lệnh và thấy output; ghi đúng tên test |
| `receiving-code-review` (obra/superpowers) | 6 | ✔ | Thẩm định finding trước khi sửa; sửa theo bất biến, không sửa mù; sai → rebuttal |
| `debugging-and-error-recovery` | 4, CI đỏ | khi lỗi | Lỗi chưa rõ nguyên nhân |
| `playwright-cli` | 3 (design pass) | khi MCP lỗi | Chụp/kiểm trang thay MCP `playwright` |
| `webapp-testing` (anthropics) | 3 | khi cần | Viết spec e2e Playwright trong `tooling/visual` |
| `frontend-design` (anthropics), `ui-ux-pro-max`, `design-system`, `web-design-guidelines` | 3 (design pass, `claude`) | ✔ story UI | Bố cục, typography, tương phản, a11y, rà theo Web Interface Guidelines |
| `design-taste-frontend`, `redesign-existing-projects` (Leonxlnx/taste-skill) | 3 (design pass trang công khai `apps/web`) | ✔ section/theme | Checklist "AI tells", critique, `inspect.mjs`; bảng màu/font của skill phải đổi thành token trong `packages/themes`. **Không** dùng cho `apps/admin`/`apps/console` (skill ghi rõ không cho dashboard). Không dùng `assets.mjs` (tải ảnh mạng) |
| `vercel-react-best-practices`, `vercel-composition-patterns` | 3 | story component | Viết component |
| `security-and-hardening` | 3, 4.5 | story tenant/auth/upload | Soát bảo mật |
| `skill-creator` (anthropics) | — | khi sửa skill | Sửa/đánh giá skill `solar-*` của dự án |
| Khác (Addy Osmani): `code-simplification`, `performance-optimization`, `frontend-ui-engineering`, `browser-testing-with-devtools`, `source-driven-development` | 3, 4 | khi cần | Đơn giản hóa, hiệu năng, UI, DevTools, tra tài liệu gốc |
| OmniRoute: `cli-setup`, `omni-auth`, `omni-mcp` | — | — | Chưa dùng (dự án chưa chạy gateway OmniRoute) |

## Bước 0 — Chuẩn bị

1. `node scripts/agents/story.mjs info <ID>` (hoặc `next`) → JSON `S`. Dùng `S.mode` (`claude` | `split` | `codex`),
   `S.planMode` (`claude` | `codex-draft`), `S.planBrief`, `S.author`, `S.reviewer`, `S.branch`, `S.base`, `S.planFile`, `S.runDir`,
   `S.codexEffort`, `S.claudeReviewModel`. Khi có `--agent`, cập nhật `S.mode` và `S.author` theo agent ép;
   tính lại reviewer theo reviewPolicy và selfReview (swap nếu trùng author), rồi tính selfReviewConflict theo reviewer cuối.
   Riêng `--agent claude`: `S.mode = "claude"`, `S.author = "claude"`, `S.planMode = "claude"`, `S.planBrief = false`,
   `S.reviewer = "claude"` (không swap sang Codex), `S.selfReviewConflict = true` (review chạy chế độ "Tự review",
   PR body ghi cảnh báo).
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
5. `mkdir -p <S.runDir>`. **Kiểm môi trường một lần**: `docker info >/dev/null` (Windows lỗi → thêm đúng một lệnh
   `wsl --status`). Lỗi → báo người dùng một dòng nguyên nhân (vd. `HCS_E_HYPERV_NOT_INSTALLED` = bật Virtual Machine
   Platform/Hyper-V rồi khởi động lại) và đi tiếp phần không cần DB; không tự chẩn đoán nhiều lượt (E6-S04 mất ~10′).
6. Đồ thị code theo `S.graphs`: chạy lệnh trong `S.graphs.codegraph` (`codegraph sync` hoặc `codegraph init -y`, đặt
   `CODEGRAPH_TELEMETRY=0`); `S.graphs.graphify` là `stale: …` → chạy nền lệnh đó (chỉ cần khi story có câu hỏi kiến
   trúc/tài liệu).

Gọi Codex qua `scripts/agents/codex.sh` (ghi prompt vào file trước, chạy nền):
```bash
bash scripts/agents/codex.sh <S.runDir> <name> <EFFORT> <prompt-file> [new|resume|review]
```
- `new`: lượt dựng code đầu tiên của story — lưu session id vào `<S.runDir>/codex-session.txt`.
- `resume` (mặc định): mọi lượt sau của **cùng người viết** trong story (sửa theo verify/review/CI, "Tiếp tục", bổ sung
  skill) — `codex exec resume` giữ context (plan đã đọc, code đã viết), không đọc lại từ đầu. Tự về phiên mới khi chưa có
  phiên, đã resume `CODEX_MAX_RESUMES` (4) lần hoặc resume lỗi. Prompt resume ngắn: chỉ nêu việc mới + file review/log.
- `review`: phiên mới read-only, không lưu session — reviewer luôn độc lập với người viết.
- Kết quả `<S.runDir>/<name>.md`, log `<S.runDir>/<name>.log`.

## Bước 1 — Plan (Claude chốt, Codex làm phần đọc)

**`S.planMode == "codex-draft"`** (story logic thường):
1. Codex viết nháp: sandbox `workspace-write`, effort `S.codexEffort.plan`, prompt
   `Dùng skill solar-story-plan, mode draft. Story <ID> (<S.epicFile>). Output: <S.planFile>. Skill plan: <S.skills.plan>.`
2. Claude duyệt nháp: kiểm AC nào cũng có bằng chứng, phạm vi đúng, không mâu thuẫn ADR/AGENTS.md, câu hỏi `[chặn]`.
   Sửa trực tiếp chỗ sai (không viết lại cả plan), xóa dòng "Nháp do Codex viết".

**`S.planMode == "claude"`** (mọi story khi `planPolicy: "claude"`; story kiến trúc hoặc UI khi `planPolicy: "budget"`):
1. `S.planBrief == true` → Codex khảo sát: sandbox `workspace-write`, effort `S.codexEffort.plan`, prompt
   `Dùng skill solar-story-plan, mode brief. Story <ID> (<S.epicFile>). Output: <S.runDir>/brief.md. Skill plan: <S.skills.plan>.`
   `S.planBrief == false` → **không gọi Codex**; Claude tự khảo sát theo mục "Khảo sát code" của `solar-story-plan`:
   `codegraph explore`/`node`/`impact` trước (graphify cho câu hỏi kiến trúc), rồi mới Grep/Glob, đọc đoạn cần, không
   đọc cả cây. Soát **hạ tầng tái dùng** (helper, lab route `apps/web /lab/*`, spec `tooling/visual`, script).
2. Claude viết `S.planFile` theo `roadmap/plans/README.md` (dựa trên brief nếu có), **≤ ~8 KB**. **Năm mục bắt buộc**:
   "Yêu cầu → test" (mỗi gạch đầu dòng của AC, "Chi tiết", "Target" của story — và hành vi của template gốc khi port —
   thành một dòng có ví dụ input → kết quả mong đợi và tên test; đây là nguồn chính của finding "chưa cover"), "Hạ tầng tái
   dùng", **"Dữ liệu có sẵn chịu ảnh hưởng"** (quy tắc/validator/fallback mới chạy trên dữ liệu nào đang có: preset JSON,
   seed demo, fixture e2e, bản ghi DB cũ — `codegraph impact` không thấy file dữ liệu; mỗi dòng → một test trong
   `packages/db/src/__tests__/conformance.test.ts`), "Case biên & bất biến" (lấy từ
   `.agents/skills/solar-pr-review/checklists.md` theo loại story — mỗi dòng một test), "Cách kiểm chứng" (unit / tương
   tác / e2e; **bộ e2e lấy từ bảng** `printf '%s\n' <file dự kiến sửa> | node scripts/ci/checks-map.mjs --stdin`, không
   chọn theo trí nhớ; trang cần DB → lab route). Ghi các truy vấn
   `codegraph`/`graphify` đã dùng. Kiểm **ngưỡng tách story** (cỡ L, > 30 file, ≥ 3 khối độc lập) → hỏi người dùng tách.
   Story `split`: thêm mục **"Design pass"** — Claude sẽ tự làm phần nào (bố cục, khoảng cách, hiệu ứng, tương phản,
   responsive), Codex dựng phần nào (schema, fixture, cấu trúc component, đổi màu sang token, logic).

Cả hai trường hợp: câu hỏi `[chặn]` → AskUserQuestion, ghi câu trả lời vào plan. `--confirm` → tóm tắt plan, chờ duyệt.

## Bước 2 — Branch

`git switch -c <S.branch>`; `git add <S.planFile>`; commit `docs(plan): <ID> plan`.
(Sandbox Codex khóa ghi `.git` — Claude luôn tạo branch và commit.)

## Bước 3 — Thực thi theo `S.mode`

**`codex`** và **`split`** — Codex dựng:
0. Claude chạy `bash scripts/local-ci.sh up` (một lần mỗi phiên, ~20 s) và kiểm `.agent-runs/_codex-env/` còn (thiếu →
   dựng lại theo README trong thư mục đó) — để Codex không tự tải Postgres/pnpm/codegraph (mất ~25 phút mỗi story).
1. Ghi `<S.runDir>/codex-exec-prompt.md`:
   ```
   Dùng skill solar-story-exec.
   Story: <ID> — <S.title> (<S.epicFile>) · Plan: <S.planFile>
   Branch (đã checkout): <S.branch> · Base: <S.base> · Mode: <S.mode>
   Lệnh kiểm tra: <S.checks + lệnh riêng trong plan>
   Loại story: <S.kind><nếu S.architecture: , kiến trúc>
   Skill bắt buộc: <S.skills.exec, cách nhau dấu phẩy> (ponytail mức full; bảng "Case biên & bất biến" → test viết trước;
   codegraph là CLI, không có SKILL.md — chạy `codegraph explore|impact <symbol>`)
   Skill tự review: <S.skills.selfReview> · Skill khi sửa: <S.skills.fix>
   Môi trường đã dựng sẵn — không bootstrap: `. .agent-runs/_codex-env/environment.ps1` (pnpm, codegraph) · Env DB: .env.ci.local
   Phạm vi test: trong vòng code chỉ test file/package đang sửa; full turbo tối đa 2 lần; log ra file, chỉ đọc đuôi.
   Trước khi báo DONE: tự review theo bước 4.5 của run-story (checklists.md + skill tự review), ghi mục "## Tự review".
   Quy tắc AGENTS.md ưu tiên hơn mọi skill.
   Báo cáo: <S.runDir>/codex-report.md (có "## Case biên → test", "## Skill đã dùng", "## Tự review") — ghi dần sau mỗi
   bước của plan (mục "Lệnh kiểm tra" kèm đường dẫn log), để lượt bị ngắt chỉ làm tiếp, không chạy lại từ đầu.
   ```
2. Chạy nền: `bash scripts/agents/codex.sh <S.runDir> codex-exec <S.codexEffort.exec> <S.runDir>/codex-exec-prompt.md new`
   (kết quả `codex-exec.md`, log `codex-exec.log`, session lưu cho các lượt sửa sau).
3. Đọc phần "Trạng thái", "Lệch so với plan", "Việc còn lại" của `codex-report.md` (không cần đọc cả file).
   `BLOCKED` → giải quyết câu hỏi (hỏi người dùng nếu cần) rồi chạy lại với "Tiếp tục" (`codex.sh … resume`).
   `node scripts/agents/run.mjs skills <ID>` → `missing` (skill bắt buộc Codex chưa mở) hoặc `claimedNotOpened` (ghi đã
   dùng mà log không thấy) khác rỗng → chạy lại Codex (`resume`) với "Tiếp tục story <ID>. Mở và áp dụng skill <danh sách> lên phần
   đã làm, sửa nếu lệch, cập nhật report".
4. `node scripts/agents/run.mjs commit <S.runDir>/codex-report.md` → commit theo "Commit đề xuất". Exit 2 (file lạc) →
   xem file đó: thuộc story thì commit kèm message phù hợp `[<ID>]`; không thì để nguyên và báo người dùng.

**`split`** — thêm Claude design pass sau khi Codex dựng xong:
1. Chạy trang thật, dùng MCP `playwright` (không kết nối được → skill `playwright-cli`; không tự viết script) chụp các
   trang/section của story ở 390px và 1440px (light/dark nếu theme có, ≥ 3 theme với section variant). Story port
   template: so với branch gốc (`git show`/ảnh chụp branch gốc). **Trang cần DB/đăng nhập** (admin, console) và component
   trong `packages/*` → dựng trang lab trong `apps/web /lab/<tên>` (chặn bằng `LAB_ENABLED` như các lab khác) + spec
   trong `tooling/visual` (config `playwright.sections.config.ts` hoặc tương tự): hydrate/console sạch, axe WCAG A/AA,
   390/1440 không tràn, bàn phím, reduced motion. Không dùng harness SSR tạm làm bằng chứng.
2. Dùng skill `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`; trang công khai (`apps/web`, section, theme)
   thêm `design-taste-frontend` / `redesign-existing-projects` (checklist "AI tells", critique — màu/font đề xuất phải
   thành token trong `packages/themes`). Chỉ sửa phần trình bày (bố cục, khoảng cách, typography, hiệu ứng, tương phản,
   responsive, a11y) — không viết lại logic/schema của Codex. Lỗi logic → ghi lại để Codex sửa (vòng "Tiếp tục").
3. `node scripts/agents/run.mjs stale <S.base>` — design pass đổi chữ/aria mà spec/test cũ còn tìm → sửa spec ngay
   (E7-S07). Rồi chạy lại các e2e trong "Kiểm local bắt buộc" có trang vừa chỉnh.
   Commit `style(<scope>): design pass … [<ID>]` + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
   Ảnh chụp lưu `<S.runDir>/screenshots/`. Ghi ngắn vào `<S.runDir>/design-pass.md` những gì đã chỉnh.

**`claude`** — Claude làm toàn bộ (story thiết kế UX mới):
1. Load skill `solar-story-exec` và làm đúng quy tắc của nó như Codex (TDD theo bảng case biên, ponytail mức `full`,
   codegraph, verification-before-completion) + skill giao diện ở trên + `vercel-react-best-practices`,
   `vercel-composition-patterns`. Áp dụng cả khi Claude thực thi thay Codex (Codex hết quota) ở mode `codex`/`split`.
2. Kiểm trực quan như design pass; commit theo bước `<type>(<scope>): … [<ID>]` + dòng Co-Authored-By của Claude.
3. Ghi `<S.runDir>/claude-report.md` cùng khung báo cáo của `solar-story-exec` (AC → bằng chứng, Case biên → test,
   Lệnh kiểm tra, Skill đã dùng, Tự review, Lệch so với plan).

## Bước 4 — Kiểm chứng (script)

`node scripts/agents/run.mjs verify <ID>` → đọc vài dòng tóm tắt.
Rồi **chạy hết "Kiểm local bắt buộc"** mà `verify` in ra (bảng `scripts/ci/checks-map.mjs`, cùng bảng CI dùng; không
tự chọn bớt — E6-S04 bỏ `e2e tenant` → CI đỏ, mất ~55′): `bash scripts/local-ci.sh up` (một lần mỗi phiên) rồi từng lệnh,
chạy nền, một lần ở cuối mỗi vòng thực thi/sửa. Ghi kết quả + SHA vào report "Lệnh kiểm tra" (reviewer đối chiếu).
`verify` FAIL vì "Chữ đã xóa khỏi source nhưng test vẫn dùng" → sửa spec/test. Lỗi môi trường (thiếu DB, port) → sửa môi
trường rồi chạy lại, không đẩy sang CI. Lỗi chỉ có trên Windows, CI Ubuntu qua: `tenant.spec › robots…` (ENOTFOUND
`*.localhost` của API request), preview webkit/firefox (local chạy `--project chromium`) — ghi vào report, không chặn.
- PASS → bước 5.
- FAIL → đọc phần đuôi lỗi script in ra. Lỗi do Codex → chạy lại Codex bằng `codex.sh … resume` với prompt
  `Dùng skill solar-story-exec. Tiếp tục story <ID>. Sửa: <tóm tắt> (log: <S.runDir>/checks.log). Skill khi sửa:
  <S.skills.fix>`, rồi `run.mjs commit`.
  Lỗi khó đoán nguyên nhân → thêm vào prompt "dùng skill debugging-and-error-recovery".
  Lỗi trình bày/design → Claude sửa. Tối đa **2 vòng**; hết vòng → ghi `HANDOFF.md`, dừng, báo người dùng.
- "Ngoài danh sách file của plan" → xem nhanh, hợp lý thì ghi chú vào PR, không thì yêu cầu bỏ.
- AC chưa tick đủ mà bằng chứng có → tick, commit `docs(roadmap): tick AC [<ID>]`.
- Dòng `⚠` (plan thiếu mục bắt buộc, report thiếu "Skill đã dùng"/"Case biên → test"/"Tự review") → bổ sung trước
  bước 5; không bổ sung được thì ghi lý do vào PR.

## Bước 4.5 — Tự review đối kháng (trước khi push)

Mục tiêu: chặn lỗi trước vòng review đắt. Người viết tự làm trên diff `<S.base>...HEAD` (vòng sửa: diff của vòng đó):
1. Đi từng mục của `.agents/skills/solar-pr-review/checklists.md` theo loại story (ui / logic / tenant / e2e) và bảng
   "Case biên & bất biến" của plan: mỗi mục áp dụng → chỉ ra test chứng minh (tên test) hoặc viết thêm test (TDD).
2. `codegraph impact <symbol>` cho mọi symbol công khai đã sửa → nơi gọi còn đúng, có test. Impact không thấy **dữ
   liệu**: quy tắc/validator/fallback mới → có dòng trong `packages/db/src/__tests__/conformance.test.ts` chạy nó trên mọi
   preset, seed demo và fixture (E7-S04 preset t08, E6-S04 seed t12).
3. Skill `ponytail-review` trên diff: code/abstraction/dependency thừa → bỏ.
4. Với mỗi file đổi, tìm ít nhất một kịch bản làm nó sai (input biên, async, tenant khác, SSR/hydrate, tắt JS) và
   chứng minh không xảy ra.
5. Ghi mục `## Tự review` vào report (checklist → test, impact đã soát, chỗ đã sửa thêm). Sửa phát sinh → commit,
   chạy lại `run.mjs verify`.
Codex là người viết → làm bước này trong cùng lượt `solar-story-exec` (prompt đã yêu cầu); Claude chỉ kiểm mục
`## Tự review` có đủ không (đọc mục đó, không đọc lại diff).

`--no-pr` → dừng, báo kết quả.

## Bước 5 — Push & PR

1. `git ls-remote --exit-code --heads origin <S.base>` không có → `git push -u origin <S.base>` (báo một dòng).
2. `git push -u origin <S.branch>` (không `--force`; lỗi → báo nguyên văn, dừng).
3. `node scripts/agents/run.mjs pr-body <ID>` → `{title, bodyFile, base, head}`. Tạo PR với nội dung file đó, thử lần
   lượt, cách nào được thì dừng:
   1. GitHub MCP `create_pull_request` (ToolSearch `+github pull request` nếu chưa tải).
   2. `gh pr create --base <base> --head <head> --title "<title>" --body-file <bodyFile>`.
   3. **Giao Codex tạo PR** — bỏ qua khi `--agent claude` (cách 1 và 2 đều lỗi → báo lỗi nguyên văn, dừng)
      (không bao giờ bắt người dùng tự tạo): sandbox `workspace-write`, effort `low`,
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

Gọi skill `pr-review` với số PR và `--reviewer <S.reviewer>` (`--agent claude` → thêm `--claude-only`); không gọi Codex cố định. Codex reviewer dùng solar-pr-review ở phiên read-only độc lập; Claude reviewer dùng subagent độc lập, model S.claudeReviewModel, cùng định dạng solar-pr-review, đối chiếu toàn bộ diff với plan/AC/DoD. Ghi verdict, SHA và bằng chứng vào review-r<n>.md. Vòng lặp:
1. **S.reviewer review** (`solar-pr-review`). **Vòng 1** (effort `S.codexEffort.review`): soát cả PR, liệt kê *mọi*
   finding P0/P1/P2 và *mọi* case **chưa cover** AC, "Chi tiết"/"Target", plan (bảng case biên), DoD, checklist.
   **Vòng > 1** (effort `S.codexEffort.reReview`): chỉ `git diff <SHA vòng trước>..HEAD` — kiểm mục vòng trước, hồi
   quy do bản sửa, P0 mới; không mở mục mới khác (xem "Vòng 1 và các vòng sau" của `solar-pr-review`). Ghi SHA mỗi
   vòng vào `<S.runDir>/review-shas.json`. Review **ở local** (`<S.runDir>/review-r<n>.md`), không đăng lên PR; báo
   người dùng danh sách issue + case chưa cover. Over-engineering (`ponytail-review`) tối đa P2 trừ khi gây lỗi hoặc vi
   phạm AGENTS.md.
2. **Người viết S.author sửa** mọi finding P0/P1 + mọi mục chưa cover (trừ `[ngoài agent]`) + lỗi CI, theo quy tắc sửa
   của `solar-story-exec` (`receiving-code-review` → bất biến → test tái hiện FAIL trước → sửa → toàn bộ test package
   xanh → `codegraph impact` → tự review bước 4.5 trên diff vòng sửa). Bản sửa nhỏ (≤ ~30 dòng, rõ cách sửa, không đổi
   thiết kế) → Claude sửa trực tiếp thay vì khởi động một phiên Codex. Claude commit (`run.mjs commit`), `verify`, kiểm local (`scripts/local-ci.sh db` / `e2e <config>` như bước 4), rồi mới push.
   **Gộp push**: mỗi push = một vòng CI ~20′. Sửa tài liệu/roadmap/README phát sinh trong lúc chờ → gộp vào lần push sửa
   kế tiếp hoặc commit cuối cùng trước khi báo người dùng; không push riêng một commit tài liệu khi CI đang chạy.
3. Chờ CI, quay lại 1. Lặp tới khi PR **merge được**: `VERDICT: APPROVE`, không còn mục chưa cover, CI xanh, không
   conflict với base. Mục `[ngoài agent]` cần CI (vd. AC "chạy trên Windows/Ubuntu") → CI xanh thì Claude tick AC.
4. Dừng sớm, hỏi người dùng khi: finding lặp lại 2 vòng không sửa được, cần quyết định phạm vi/dependency/AC, hoặc quá
   5 vòng sửa. **Vòng 2** mà một finding còn "sửa một phần" hoặc bản sửa sinh P1 mới cùng chỗ → không vá tiếp: Claude
   gọi tên bất biến, liệt kê mọi nơi áp dụng (`codegraph callers`), viết bảng test cho cả lớp lỗi rồi mới giao sửa
   (một commit thiết kế lại có test).
5. **CI đỏ**: đối chiếu danh sách flaky đã biết trong `tooling/visual/README.md`. Chạy lại job lỗi một lần; vẫn đỏ →
   chạy đúng test đó trên base (`VISUAL_WEB_ROOT` trỏ worktree base, chép `packages/db/generated`) để phân biệt hồi quy
   và flaky. Kết luận flaky phải có log của base; ghi đúng tên test và dòng (`verification-before-completion`). Flaky mới
   → thêm vào danh sách.

Claude điều phối, quản lý git và đọc verdict; review Claude dùng subagent độc lập, trừ ngoại lệ vòng sửa nhỏ
đúng điều kiện trong skill pr-review. Sau mỗi vòng sửa, reviewer theo S.reviewer review lại SHA cuối.
Không suy reviewer từ nhãn người viết.

## Bước 7 — Kết thúc

Khi PR merge được (không comment gì lên PR), báo người dùng: link PR, ai làm gì (plan / dựng /
design pass / review), số vòng review–sửa, issue và case chưa cover đã sửa, CI, finding P2 còn lại, và câu chốt
**"PR #<số> sẵn sàng merge — bạn tự merge."** **Không tự merge.** Khi người dùng báo PR đã merge: trên base, gắn ✅ vào heading story + link PR trong
`S.epicFile`, commit `docs(roadmap): <ID> done`, hỏi trước khi push.
