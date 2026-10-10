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
  Bổ sung ở E0-S07 (cùng cách cài): `playwright-cli`, `ponytail`, `ponytail-review`, `graphify`, 8 skill của
  `addyosmani/agent-skills`, OmniRoute (`cli-setup`, `omni-auth`, `omni-mcp`). Lý do chọn/bỏ: ADR D16.
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

### E0-S05 · Quy trình story → branch → review chéo ✅ · PR [#5](https://github.com/votuandi/landing-page-full-page-ui/pull/5)
**Là** chủ dự án, **tôi muốn** mỗi story đi qua cùng một quy trình, **để** biết chính xác trạng thái và ai chịu trách nhiệm.
- **Chi tiết**: template PR `.github/pull_request_template.md` (story ID, AC tick, bằng chứng, agent viết, agent review);
  CI chặn PR nếu thiếu story ID trong tiêu đề; nhãn `agent:codex` / `agent:claude`.
- **Target**: 100% PR có story ID và review chéo.
- **AC**:
  - [x] PR template tồn tại và có checklist DoD từ `AGENTS.md` §7.
  - [x] Job CI `pr-meta` fail khi tiêu đề PR không khớp `\[E\d+-S\d+\]`. (PR [#5](https://github.com/votuandi/landing-page-full-page-ui/pull/5): `pr-meta` pass với tiêu đề có ID; nhánh fail chứng minh bằng `scripts/agents/pr-meta.test.mjs`)
  - ~~Thử nghiệm: 1 story do Codex làm (worktree + `codex exec`), Claude review; 1 story ngược lại — ghi lại thời gian
    và vướng mắc vào `skills/solar-agent-collab`.~~ Bỏ khỏi AC (2026-10-09): lượt A đã chạy trong PR #5; lượt B
    (Claude viết → Codex review) diễn ra tự nhiên khi có story chạy `--agent claude`, không cần story riêng.
- Ghi chú: chủ dự án quyết định **không** đặt `pr-meta` thành required check — job chỉ báo đỏ, không chặn merge.
  E0 là setup quy trình cho agent, không tốn effort chạy thử nghiệm riêng.
- Phụ thuộc: E1-S01 · Agent: Claude · Cỡ: S

### E0-S06 · Chạy song song nhiều Codex cho story cơ học ✅ · PR [#24](https://github.com/votuandi/landing-page-full-page-ui/pull/24)
**Là** chủ dự án, **tôi muốn** giao nhiều story port section cho Codex chạy song song, **để** rút ngắn E4.
- **Chi tiết**: script `scripts/agents/spawn-codex.ps1 <story-id…>` tạo worktree + branch mỗi story, chạy
  `codex exec` nền, ghi log `../lp-worktrees/<id>/codex.log`; script `collect.ps1` liệt kê branch đã có commit + kết quả
  test. Tùy chọn dùng Codex cloud (`codex cloud`) cho story không cần môi trường Windows.
- **Target**: chạy ≥ 4 story đồng thời không xung đột file.
- **AC**:
  - [x] Hai script chạy trên Windows PowerShell 7 và bash. (2026-10-10, codex giả: lô 4 story mỗi shell, nhánh lỗi exit 1)
  - [x] Mỗi worktree độc lập (`node_modules` riêng qua `pnpm install --frozen-lockfile`, cổng dev khác nhau).
    Lô pwsh: 4 lần install riêng (26–63s), cổng 3201–3204; lô bash: cổng 3101–3104, 4 codex chạy đồng thời.
  - [x] Tài liệu trong `solar-agent-collab` (mục "Chạy song song").
- Ghi chú: làm gọn — 2 cặp script mỏng `.ps1`/`.sh`, không Node core/test suite riêng (bản dựng dở cũ bị bỏ).
- Phụ thuộc: E1-S01, E2, E3-S01…S04 (giống E4, để story chỉ sẵn sàng khi E4 bắt đầu) · Agent: Codex · Cỡ: M

### E0-S07 · Bổ sung skill: Playwright CLI, Ponytail, Graphify, Agent Skills, OmniRoute ✅ · PR [#9](https://github.com/votuandi/landing-page-full-page-ui/pull/9)
**Là** chủ dự án, **tôi muốn** agent có thêm công cụ kiểm tra trình duyệt, chống over-engineering, bản đồ codebase và
quy trình kỹ thuật chuẩn, **để** story chạy nhanh hơn, tốn ít token hơn và code gọn hơn.
- **Chi tiết**: cài như E0-S03 (`npx skills add <nguồn> -a claude-code -a codex`, khóa trong `skills-lock.json`, bản copy
  ở `.agents/skills` + `.claude/skills`, không symlink). Nguồn:
  - `microsoft/playwright-cli` — điều khiển trình duyệt qua CLI (chụp ảnh, kiểm tra theme/section, e2e); dự phòng khi MCP
    `playwright` không kết nối được.
  - `DietrichGebert/ponytail` — viết ít code nhất cần thiết (ưu tiên code có sẵn, stdlib, tính năng nền tảng);
    `/ponytail-review` rà over-engineering trên diff.
  - `safishamsi/graphify` (Graphify-Labs) — đồ thị tri thức của repo để khảo sát khi viết plan thay vì đọc file thô.
    Cần Python + `uv` (`uv tool install graphifyy` → `graphify install`); thư mục output đưa vào `.gitignore`.
  - `addyosmani/agent-skills` — chỉ chọn các skill không trùng playbook dự án (vd. test, debug, hiệu năng web, đơn giản
    hóa code); **không** dùng `/plan`, `/review`, `/ship` thay cho `run-story` / `pr-review`.
  - `diegosouzapw/OmniRoute` — router nhiều nhà cung cấp LLM; chỉ có tác dụng khi chạy gateway OmniRoute. Cài để sẵn,
    không gắn vào bước nào của story cho tới khi dự án dùng gateway.
- **Áp dụng vào quy trình story** (sửa đúng chỗ, không chép quy tắc sang nhiều file). Playbook `run-story` đã có
  bảng "Skill bổ trợ" gắn từng skill vào bước (2026-10-09, chạy như cũ khi skill chưa cài); story này làm phần còn lại:
  - Plan (`solar-story-plan`): khảo sát bằng graphify trước khi đọc file.
  - Thực thi (`solar-story-exec`): tuân theo ponytail ở mức `lite`/`full` — không trái với quy tắc token/schema/tenant.
  - Design pass + bằng chứng AC UI: dùng Playwright CLI để chụp ảnh khi MCP `playwright` lỗi.
  - Review (`pr-review`, `solar-pr-review`): thêm mục kiểm tra over-engineering theo ponytail; finding loại này tối đa P2
    trừ khi gây lỗi.
  - `CLAUDE.md` (mục "Skills nên dùng") và `AGENTS.md` thêm một dòng "khi nào dùng" cho từng skill mới.
- **Target**: `/run-story` của story kế tiếp tự gọi các skill trên ở đúng bước mà không cần nhắc.
- **AC**:
  - [x] 5 nguồn có trong `skills-lock.json`; skill có ở cả `.agents/skills` và `.claude/skills`, không symlink
    (`--copy`, 2026-10-09). Đã cài 15 skill: `playwright-cli` · `ponytail`, `ponytail-review` · `graphify` ·
    Agent Skills: `test-driven-development`, `debugging-and-error-recovery`, `code-simplification`,
    `performance-optimization`, `security-and-hardening`, `frontend-ui-engineering`, `browser-testing-with-devtools`,
    `source-driven-development` · OmniRoute: `cli-setup`, `omni-auth`, `omni-mcp`. CLI kèm theo cài ở máy dev:
    `npm i -g @playwright/cli`, `pip install --user graphifyy` (0.9.82).
  - [x] Script trong các skill mới đã được rà: chỉ `graphify` có file ngoài `.md` — `skills add` chép cả package Python
    (5,4 MB) vì `SKILL.md` nằm ở gốc package; đã cắt còn `SKILL.md` + `references/` (Claude: bản `skill-windows.md` vì
    `python3` trên Windows là lối tắt Microsoft Store; Codex: `skill-codex.md`). Hash trong `skills-lock.json` vì thế
    không khớp bản đã cắt; `npx skills update` sẽ chép lại cả package → cắt lại. Các skill khác chỉ có markdown; lệnh
    mạng trong đó (`npm i -g`, `pip install`, `curl` tới `localhost:20128` của OmniRoute) đúng mục đích mô tả.
  - [x] `graphify` chạy được trên repo (Windows), output nằm trong `.gitignore`; `playwright-cli` chụp được trang `yarn dev`.
    `python -m graphify update .` 1320 node (`.graphifyignore` loại bản copy skill), `graphify-out/` bị ignore; repo đã
    sang pnpm nên chụp `pnpm dev` ở 390/1440px (2026-10-09).
  - [x] `run-story` trỏ tới skill mới ở đúng bước (bảng "Skill bổ trợ").
  - [x] `solar-story-plan`, `solar-story-exec`, `pr-review`, `solar-pr-review`, `CLAUDE.md`, `AGENTS.md` trỏ tới skill
    mới ở đúng bước như trên; tên skill trong bảng của `run-story` khớp tên thư mục đã cài.
  - [x] Danh sách skill trong E0-S03 + bảng quyết định `roadmap/02-decisions.md` ghi lý do chọn/bỏ từng skill của
    `agent-skills` và lý do OmniRoute chưa gắn vào quy trình.
- Phụ thuộc: E0-S03 · Agent: Codex · Cỡ: S
