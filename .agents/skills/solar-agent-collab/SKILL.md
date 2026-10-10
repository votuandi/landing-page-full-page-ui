---
name: solar-agent-collab
description: How Claude Code and Codex split, hand off and cross-review work in this repo. Use when delegating a story to the other agent, asking it for a review, picking up work the other agent started, or deciding which agent should take a story.
---

# Phối hợp Claude Code ↔ Codex

Một story — một branch — một PR. Chạy `/run-story <ID>` theo AGENTS.md §6.
Nguồn phân vai là scripts/agents/routing.json; đọc `node scripts/agents/story.mjs info <ID>`
để lấy S.author, S.mode, S.reviewer và selfReviewConflict cuối. selfReview=swap đổi reviewer
khi trùng author; không suy vai trò theo chẵn/lẻ nếu policy khác parity.
`--agent` phải cập nhật author và tính lại reviewer; PR body dùng cùng vai trò này.
`--agent claude` là chế độ chỉ Claude: plan, thực thi, tạo PR, review (subagent, "Tự review") và sửa đều do Claude,
không gọi Codex trong phiên đó.

## Chọn agent

Lấy phân vai từ `story.mjs info <ID>` theo routing hiện tại: mode `codex` giao Codex thực thi;
`claude` giao Claude làm toàn bộ; `split` giao Codex dựng và Claude làm design pass.
Plan theo S.planMode/S.planBrief (planPolicy=claude: Claude tự viết plan, Codex chỉ implement),
reviewer theo S.reviewer; Claude chốt plan và quản lý git.
Khi ép `--agent`, dùng quy trình override tạm thời của run-story, không commit thay đổi routing.json.

## Giao việc

Claude chuẩn bị plan, worktree/branch và cài pnpm --frozen-lockfile riêng. Codex thực thi
bằng solar-story-exec, git chỉ đọc và xuất báo cáo với Commit đề xuất. Claude commit bằng run.mjs.
Ví dụ chạy từ Claude Code, thay ID/branch/path bằng story thật:

```bash
git worktree add ../lp-E3-S04 -b feat/E3-S04-calculator-schema mono-repo-multi-tenent
cd ../lp-E3-S04
pnpm install --frozen-lockfile
mkdir -p .agent-runs/E3-S04
codex exec -C . -s workspace-write -o .agent-runs/E3-S04/codex-exec-last.md \
  "Dùng skill solar-story-exec. Story E3-S04. Plan roadmap/plans/E3-S04.md. Branch đã checkout. Báo cáo .agent-runs/E3-S04/codex-report.md. Không chạy git ghi." \
  > .agent-runs/E3-S04/codex-exec.log 2>&1
node scripts/agents/run.mjs commit .agent-runs/E3-S04/codex-report.md
```

Claude chạy codex exec nền và chờ thông báo. Chạy tuần tự; công việc song song cần worktree
và node_modules riêng. Không giao Codex tự commit trong sandbox khóa .git.

### Chạy song song

Dùng cho nhiều story cơ học mode `codex`, plan đã viết và phụ thuộc đã xong; Claude chạy ngoài sandbox Codex.
Từ gốc repo, bash: `bash scripts/agents/spawn-codex.sh <ID…> --root ../lp-worktrees --base-port 3101`;
PowerShell 7: `pwsh -NoProfile -File scripts/agents/spawn-codex.ps1 <ID…> --root ../lp-worktrees --base-port 3101`.
Mỗi story có worktree/branch, `node_modules` và log `codex.log` riêng; cổng tăng từ 3101.
Lô chạy đồng thời tiếp theo dùng `--base-port` khác; chỉ dùng `--no-install` khi không cần cài dependency.
Thu kết quả: `bash scripts/agents/collect.sh --root ../lp-worktrees` hoặc
`pwsh -NoProfile -File scripts/agents/collect.ps1 --root ../lp-worktrees` (chỉ đọc, không chạy checks).
Khi Codex xong, Claude vào từng worktree chạy `node scripts/agents/run.mjs commit .agent-runs/<ID>/codex-report.md`,
rồi `node scripts/agents/run.mjs verify <ID>` → push/PR/review theo run-story Bước 3.4–6.
`collect` đọc trạng thái checks từ `verify.json` sau lệnh verify; chưa verify thì hiển thị `—`.
Sau khi PR merge: `git worktree remove ../lp-worktrees/<ID>`.
Windows báo "Filename too long" khi xóa (`node_modules` sâu) → giữ root ngắn hoặc `git config core.longpaths true`.
`codex cloud` là tùy chọn cho story không cần Windows; không tự động hóa trong hai script.

## Review chéo và PR

Reviewer lấy từ S.reviewer. Codex dùng solar-pr-review trong phiên read-only độc lập;
Claude dùng subagent độc lập, model S.claudeReviewModel, cùng định dạng solar-pr-review.
Đối chiếu toàn bộ diff với plan/AC/Chi tiết/Target/DoD. Ghi verdict, SHA cuối, finding và case chưa cover.
Checklist review theo AGENTS.md §4 và §7: token/schema/migration; tenantId, cache tag và media key;
membership admin; entitlement phía server/API; dependency; reduced motion và nội dung khi tắt JavaScript;
test/bằng chứng cho AC và các kiểm tra DoD.
Người viết sửa P0/P1 và case thiếu, Claude commit/push, reviewer review lại SHA cuối.
Nhãn agent:codex / agent:claude chỉ người viết chính (split: Codex); reviewer ghi trong body.
Playbook bảo đảm nhãn tồn tại rồi gắn bằng MCP/gh sau tạo PR. Không tự merge.

Job pr-meta kiểm story ID trong title trên mọi PR kể cả edited, dùng PR_TITLE.
Workflow fail chưa chứng minh merge bị chặn: required check cần xác nhận riêng;
không tự sửa ruleset/branch protection. Bằng chứng local ignored cần đính kèm/tóm tắt trong PR.

## Bàn giao giữa chừng

Ghi HANDOFF.md tại gốc worktree (không commit): đã làm gì, còn gì, checks lỗi và quyết định đã chốt.
Agent nhận việc đọc trước, xóa khi xong. Claude quản lý mọi thao tác git ghi.

## Thử nghiệm E0-S05

Chỉ ghi số liệu quan sát thật, múi giờ Asia/Saigon; AC3 chờ đủ hai chiều.

| Lượt | Story / worktree / branch | SHA đầu / base | Người viết → reviewer | Thời gian | Checks / review / PR / CI | Vướng mắc |
|---|---|---|---|---|---|---|
| A | E0-S05; D:/Workspace/Projects/lp-E0-S05; chore/E0-S05-quy-trinh-story-branch-review | 55da2a331f42b73f2cb96c15cd5897bec31e50cf / 92e3ac11a2f21d5d083a393608e7451f47de4947 | Codex → Claude (chờ review) | Bắt đầu quan sát 2026-10-09 09:43:03 +07:00; kết thúc triển khai/check 2026-10-09 09:50:00 +0700; 417.4s từ mốc quan sát; review/tổng chờ | Turbo exit 0 (13.85s), lint exit 0 (12.97s), 16 test mới pass; verdict/SHA cuối/PR/CI/vòng sửa chờ; log codex exec do Claude giữ | Sandbox khóa ghi .agents/skills; cần Claude đồng bộ bản skill |
| B | Chờ story logic cỡ S kế tiếp, ngoài PR này | Chờ | Claude → Codex | Chờ | Chờ | /run-story <ID> --agent claude; bổ sung bằng PR docs sau |

Bài học lượt A: fixture CLI thật kiểm title dài/routing không thay thế review và CI thật.
Claude bổ sung thời gian thực thi/check/review/tổng, exit code, số vòng sửa, SHA cuối,
verdict và URL PR/CI từ .agent-runs/E0-S05/codex-report.md và log thực tế.
