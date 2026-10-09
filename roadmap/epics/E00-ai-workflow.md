# E0 — Môi trường làm việc AI (Claude Code + Codex)

**Mục tiêu**: hai agent làm việc song song trên cùng repo với cùng quy ước, cùng công cụ, review chéo nhau.
**Target epic**: 100% PR có review của agent còn lại; agent mới vào dự án chạy được lệnh kiểm tra trong ≤ 10 phút.
**Trạng thái**: S01–S04 đã làm trong commit khởi tạo branch `mono-repo-multi-tenent`.

---

### E0-S01 · Quy ước chung cho hai agent ✅
**Là** chủ dự án, **tôi muốn** một file quy ước duy nhất mà cả Codex và Claude Code đều đọc, **để** hai agent không viết code theo hai kiểu.
- **Chi tiết**: `AGENTS.md` (Codex đọc tự động) là nguồn; `CLAUDE.md` chỉ `@AGENTS.md` + phần riêng Claude.
- **Target**: 0 quy tắc bị lặp giữa hai file.
- **AC**:
  - [x] `AGENTS.md` có: mô tả dự án, cấu trúc đích, lệnh, quy tắc token/schema/tenant/entitlement, phân vai, DoD.
  - [x] `CLAUDE.md` import `AGENTS.md`, chỉ thêm MCP/plugin/skills của Claude.
- Agent: Claude · Cỡ: S

### E0-S02 · MCP server dùng chung ✅
**Là** agent, **tôi muốn** đọc lỗi Next.js đang chạy, tra tài liệu đúng phiên bản và điều khiển trình duyệt, **để** tự kiểm tra kết quả thay vì đoán.
- **Chi tiết**: `.mcp.json` (Claude Code, bọc `cmd /c` cho Windows) và `.codex/config.toml` (Codex, dự án đã trusted)
  cùng khai báo `next-devtools`, `context7`, `playwright`.
- **Target**: `codex mcp list` và `/mcp` trong Claude Code đều thấy 3 server.
- **AC**:
  - [x] Hai file cấu hình có cùng danh sách server.
  - [x] `codex mcp list` trong thư mục dự án hiện `next-devtools`, `context7`, `playwright` trạng thái enabled.
  - [ ] Sau E1: thêm MCP `postgres` (chỉ đọc, DB dev) cho cả hai agent.
- Agent: Claude · Cỡ: S

### E0-S03 · Skills cho full-stack và giao diện ✅
**Là** agent, **tôi muốn** có sẵn hướng dẫn chuyên sâu về thiết kế giao diện, React/Next.js và kiểm thử, **để** code đạt chuẩn mà không cần nhắc.
- **Chi tiết**: cài bằng `npx skills add … -a claude-code -a codex` (khóa phiên bản trong `skills-lock.json`), bản copy ở
  `.agents/skills` (Codex) và `.claude/skills` (Claude):
  `frontend-design`, `webapp-testing` (Anthropic) · `vercel-react-best-practices`, `vercel-composition-patterns`,
  `web-design-guidelines` (Vercel) · `next-cache-components-adoption`, `next-dev-loop` (Next.js) ·
  `ui-ux-pro-max`, `design-system` (UI UX Pro Max).
  Skill riêng: `solar-section-variant`, `solar-theme-port` (+ `token-map.md`), `solar-agent-collab`.
- **Target**: mọi story port section/theme đều chỉ cần trỏ tới skill, không viết lại hướng dẫn.
- **AC**:
  - [x] Skill có ở cả hai thư mục, không dùng symlink (Windows `core.symlinks=false`).
  - [x] Script trong skill bên ngoài đã được rà (không gọi mạng/shell ngoài mục đích mô tả).
  - [ ] Cập nhật skill bằng `npx skills update -p` mỗi tháng, chép lại sang `.claude/skills`.
- Agent: Claude · Cỡ: S

### E0-S04 · Plugin Codex trong Claude Code ✅
**Là** dev dùng Claude Code, **tôi muốn** gọi Codex review/giao việc ngay trong phiên, **để** không chuyển cửa sổ.
- **Chi tiết**: `.claude/settings.json` khai báo marketplace `openai/codex-plugin-cc` và bật `codex@openai-codex`.
- **AC**:
  - [x] Mở Claude Code ở repo → được hỏi cài plugin; sau `/codex:setup` dùng được `/codex:review`, `/codex:rescue`.
  - [x] Danh sách quyền cho phép sẵn các lệnh kiểm tra (`yarn/pnpm typecheck|lint|test|build`, `codex exec|review`).
- Agent: Claude · Cỡ: S

### E0-S05 · Quy trình story → branch → review chéo · PR [#5](https://github.com/votuandi/landing-page-full-page-ui/pull/5) (AC3 chờ lượt B)
**Là** chủ dự án, **tôi muốn** mỗi story đi qua cùng một quy trình, **để** biết chính xác trạng thái và ai chịu trách nhiệm.
- **Chi tiết**: template PR `.github/pull_request_template.md` (story ID, AC tick, bằng chứng, agent viết, agent review);
  CI chặn PR nếu thiếu story ID trong tiêu đề; nhãn `agent:codex` / `agent:claude`.
- **Target**: 100% PR có story ID và review chéo.
- **AC**:
  - [x] PR template tồn tại và có checklist DoD từ `AGENTS.md` §7.
  - [x] Job CI `pr-meta` fail khi tiêu đề PR không khớp `\[E\d+-S\d+\]`. (PR [#5](https://github.com/votuandi/landing-page-full-page-ui/pull/5): `pr-meta` pass với tiêu đề có ID; nhánh fail chứng minh bằng `scripts/agents/pr-meta.test.mjs`)
  - [ ] Thử nghiệm: 1 story do Codex làm (worktree + `codex exec`), Claude review; 1 story ngược lại — ghi lại thời gian
        và vướng mắc vào `skills/solar-agent-collab`.
- Ghi chú: chủ dự án quyết định **không** đặt `pr-meta` thành required check — job chỉ báo đỏ, không chặn merge.
  Lượt B của AC3: E1-S07 (hoặc story logic cỡ S kế tiếp) chạy `--agent claude`, Codex review.
- Phụ thuộc: E1-S01 · Agent: Claude · Cỡ: S

### E0-S06 · Chạy song song nhiều Codex cho story cơ học
**Là** chủ dự án, **tôi muốn** giao nhiều story port section cho Codex chạy song song, **để** rút ngắn E4.
- **Chi tiết**: script `scripts/agents/spawn-codex.ps1 <story-id…>` tạo worktree + branch mỗi story, chạy
  `codex exec` nền, ghi log `../lp-worktrees/<id>/codex.log`; script `collect.ps1` liệt kê branch đã có commit + kết quả
  test. Tùy chọn dùng Codex cloud (`codex cloud`) cho story không cần môi trường Windows.
- **Target**: chạy ≥ 4 story đồng thời không xung đột file.
- **AC**:
  - [ ] Hai script chạy trên Windows PowerShell 7 và bash.
  - [ ] Mỗi worktree độc lập (`node_modules` riêng qua `pnpm install --frozen-lockfile`, cổng dev khác nhau).
  - [ ] Tài liệu trong `solar-agent-collab`.
- Ghi chú: **hoãn tới khi bắt đầu E4** (2026-10-09) — E0 là setup quy trình, chưa cần chạy song song; làm gọn khi
  thật sự cần (vd. 2 script mỏng `spawn-codex.ps1`/`.sh`, không Node core/test suite riêng). Bản dựng dở của lần
  chạy trước giữ ở `.agent-runs/E0-S06/draft/` (local, không commit) để tham khảo.
- Phụ thuộc: E1-S01, E2, E3-S01…S04 (giống E4, để story chỉ sẵn sàng khi E4 bắt đầu) · Agent: Codex · Cỡ: M
