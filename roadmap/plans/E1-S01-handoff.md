# HANDOFF — E1-S01 (tạm dừng)

Tạm dừng 2026-10-08 vì thứ tự sai: phải làm E0 trước. Commit WIP này là trạng thái Codex đang dựng dở
(chưa có `codex-report.md`, chưa review, chưa PR). Xóa file này khi story xong. (HANDOFF.md ở gốc bị gitignore nên ghi ở đây.)

## Đã có (theo log Codex)
- pnpm workspace + `pnpm-lock.yaml` (import từ yarn.lock, đã xóa yarn.lock), `.nvmrc`, `turbo.json`,
  `packages/config` (tsconfig.base, ESLint flat, Tailwind preset, README), root `eslint.config.mjs`, xóa `.eslintrc.json`,
  workflow `.github/workflows/workspace.yml`, README gốc cập nhật.
- Windows/Node 22: `pnpm install --frozen-lockfile` OK; install sạch 19,8 s (store ấm).
- `pnpm turbo run typecheck lint`: 4 task, lượt 2 `FULL TURBO`.
- Đã sửa glob TS/TSX cho flat config (kiểm tương đương với .eslintrc cũ).

## Còn dở
- Next 15.4 + ESLint 8 + flat config: `next build` báo `Invalid Options: useEslintrc, extensions` (build vẫn exit 0
  nhưng lint trong build không chạy đúng) — cần xử lý hoặc ghi rõ.
- Script test trên Node 22 (log `codex-node22-test.log` trong runDir local) chưa chốt.
- Bằng chứng CI Windows + Ubuntu (chỉ có sau khi push/PR).
- `codex-report.md`, tick AC, PR, review.
- Commit này chụp lúc Codex có thể còn đang sửa — kiểm lại `git diff` và chạy lại bộ kiểm trước khi tiếp tục.

## Tiếp tục
1. Rebase branch lên `mono-repo-multi-tenent` (sau khi E0 xong).
2. `codex exec … "Dùng skill solar-story-exec. Tiếp tục story E1-S01. Đọc roadmap/plans/E1-S01-handoff.md." < /dev/null`
3. Theo `/run-story E1-S01` từ bước 3.3. Log chi tiết (local, không commit): `.agent-runs/E1-S01/`.
