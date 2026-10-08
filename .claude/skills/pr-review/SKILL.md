---
name: pr-review
description: Review chéo một PR của story theo quy tắc chẵn/lẻ — story lẻ (S01, S03…) do Codex review, story chẵn (S02, S04…) do Claude Code review; đăng review lên PR, giao người viết sửa lỗi blocking, review lại tối đa 2 vòng. Dùng khi /run-story tới bước review, hoặc người dùng gõ /pr-review <số PR|STORY-ID>.
argument-hint: "<số PR | STORY-ID> [--reviewer claude|codex]"
---

# /pr-review — review chéo theo chẵn/lẻ

Tham số: `$ARGUMENTS`.

## 1. Xác định PR và vai trò

1. Có STORY-ID → tìm PR mở có head `*/<ID>-*` (GitHub MCP `list_pull_requests` hoặc `gh pr list --search "<ID>"`).
   Có số PR → đọc PR, lấy STORY-ID từ tiêu đề `[E\d+-S\d+]`.
2. `node scripts/agents/story.mjs info <ID>` → `S`. Reviewer = `S.reviewer` (lẻ → codex, chẵn → claude, theo
   `scripts/agents/routing.json`); `--reviewer` ghi đè. Người viết = `S.author` (hoặc "Người viết" trong mô tả PR nếu khác).
3. Vòng review `n` = số file `<S.runDir>/review-r*.md` hiện có + 1. `n > 3` → dừng, báo người dùng (đã quá 2 vòng sửa).
4. Lấy code: `git fetch origin <branch>`; review trên `origin/<S.base>...origin/<branch>`.

## 2. Thực hiện review

Định dạng kết quả **bắt buộc** theo skill `solar-pr-review` (dòng đầu `VERDICT: APPROVE` hoặc `VERDICT: CHANGES_REQUESTED`).

### Reviewer = codex
Chạy nền, chờ thông báo:
```bash
codex exec -C "$(pwd)" -s read-only -o "<S.runDir>/review-r<n>.md" \
  "Dùng skill solar-pr-review. Review PR #<số> — story <ID> (<S.epicFile>), plan <S.planFile>. \
Diff: git diff origin/<S.base>...origin/<branch>. Vòng <n>.<nếu n>1: Kiểm tra các finding của vòng trước trong <S.runDir>/review-r<n-1>.md đã được sửa chưa.>" \
  > "<S.runDir>/review-r<n>.log" 2>&1
```
Không sửa, không rút gọn kết luận của Codex.

### Reviewer = claude
- Người viết là Codex → Claude tự review trong phiên này theo skill `solar-pr-review` (có thể dùng thêm skill
  `code-review` cho phần correctness, `web-design-guidelines` cho file UI).
- Người viết là Claude (tự review do quy tắc chẵn/lẻ) → **không** review trong ngữ cảnh đã viết code: gọi Agent tool
  (`subagent_type: general-purpose`) với prompt chỉ gồm: skill `solar-pr-review`, số PR, branch, base, đường dẫn story và
  plan, vòng `n`, và yêu cầu ghi kết quả vào `<S.runDir>/review-r<n>.md`. Không đưa tóm tắt "đã làm gì" của người viết.
Ghi kết quả vào `<S.runDir>/review-r<n>.md`.

## 3. Đăng review lên PR

- Nội dung: `### 🤖 <Codex|Claude Code> review — vòng <n>` + (nếu reviewer trùng người viết)
  `> ⚠️ Người viết tự review theo quy tắc chẵn/lẻ — review chạy ở phiên độc lập.` + nguyên văn file review.
- Công cụ: GitHub MCP `pull_request_review_write` (`method: create`, `event: COMMENT` — PR do chính tài khoản này tạo nên
  GitHub không cho APPROVE/REQUEST_CHANGES) hoặc `gh pr review <số> --comment --body-file …`.
  Không có công cụ → in nội dung để người dùng dán.

## 4. Xử lý kết luận

- `VERDICT: APPROVE` (không còn finding P0/P1) → comment PR: `✅ Sẵn sàng merge — chờ chủ dự án.` Kết thúc.
  Finding P2 không chặn: liệt kê trong báo cáo cuối, không bắt sửa.
- `VERDICT: CHANGES_REQUESTED` → người viết sửa **chỉ** các finding P0/P1:
  - Người viết Codex (chạy nền, Codex không ghi được `.git` nên Claude commit theo "Commit đề xuất" như bước 2a.5 của
    `run-story`):
    ```bash
    git switch <branch>
    codex exec -C "$(pwd)" -s workspace-write -c sandbox_workspace_write.network_access=true \
      -o "<S.runDir>/fix-r<n>.md" "Dùng skill solar-story-exec. Sửa các finding P0/P1 trong <S.runDir>/review-r<n>.md \
    cho story <ID> trên branch <branch>. Không làm thêm việc khác. Chạy lại lệnh kiểm tra trong <S.planFile>. \
    Báo cáo: <S.runDir>/fix-r<n>-report.md" \
      > "<S.runDir>/fix-r<n>.log" 2>&1
    ```
  - Người viết Claude: tự sửa trên branch.
  - Claude chạy lại `S.checks`, `git push`, comment PR liệt kê finding đã sửa (kèm SHA commit).
  - Quay lại bước 1 với vòng `n+1`. Sau 2 vòng sửa mà vẫn `CHANGES_REQUESTED` → dừng, báo người dùng các finding còn lại
    và ý kiến của Claude (đồng ý / cho rằng finding sai và vì sao).
- Reviewer báo finding mà người viết cho là sai → không tự bỏ qua: ghi phản biện vào comment PR, để reviewer xét ở vòng
  sau; vẫn bất đồng → để người dùng quyết.

## 5. Báo cáo

Một đoạn ngắn: PR, reviewer, số vòng, kết luận cuối, finding còn lại (nếu có), link PR.
