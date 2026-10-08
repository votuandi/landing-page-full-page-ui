---
name: solar-agent-collab
description: How Claude Code and Codex split, hand off and cross-review work in this repo. Use when delegating a story to the other agent, asking it for a review, picking up work the other agent started, or deciding which agent should take a story.
---

# Phối hợp Claude Code ↔ Codex

Nguyên tắc: **một story — một branch — một agent viết — agent còn lại review.** Bảng phân vai ở `AGENTS.md` §6.

## Giao việc

Đầu vào luôn là một story trong `roadmap/epics/*.md` (có ID, Chi tiết, Target, AC). Không giao việc mơ hồ.

Từ Claude Code sang Codex:
```bash
git worktree add ../lp-E3-S04 -b feat/E3-S04-calculator-schema mono-repo-multi-tenent
codex exec --cd ../lp-E3-S04 "Thực hiện story E3-S04 trong roadmap/epics/E03-sections.md. \
Tuân thủ AGENTS.md. Chạy typecheck/lint/test trước khi kết thúc. Commit với message 'feat(sections): ... [E3-S04]'."
```
Hoặc trong Claude Code: `/codex:rescue <mô tả story>` (plugin `codex@openai-codex`, chạy nền; xem `/codex:status`).

Từ Codex sang Claude Code:
```bash
claude -p "Review branch feat/E3-S04-calculator-schema so với mono-repo-multi-tenent theo AGENTS.md và AC của E3-S04." \
  --permission-mode plan
```

## Review chéo

- Claude review code Codex viết: trong Claude Code chạy `/code-review` trên branch, đối chiếu từng AC.
- Codex review code Claude viết: `codex review --base mono-repo-multi-tenent` hoặc `/codex:review` /
  `/codex:adversarial-review` (cho thay đổi kiến trúc, bảo mật, tenant isolation, cache).
- Checklist review bắt buộc: (1) đủ AC, (2) không hard-code màu/font/bo góc, (3) mọi truy vấn có `tenantId`,
  (4) cache tag có tiền tố tenant, (5) entitlement kiểm tra phía server, (6) có test.

## Bàn giao giữa chừng

Agent dừng giữa story phải để lại `HANDOFF.md` ở gốc worktree (không commit lên branch chính): đã làm gì, còn gì,
lệnh kiểm tra đang lỗi, quyết định đã chốt. Agent nhận việc đọc file này trước, xóa khi xong.

## Chọn agent

- Story nhiều file nhưng cơ học (port 20 section, đổi hex → token, sinh fixture, viết test) → Codex, chạy song song
  nhiều worktree.
- Story cần quyết định thiết kế/kiến trúc, chạm nhiều package, hoặc cần thẩm mỹ giao diện → Claude Code.
- Spike/so sánh phương án (Puck vs dnd-kit, Caddy vs Cloudflare for SaaS) → cả hai làm độc lập, so kết quả.
