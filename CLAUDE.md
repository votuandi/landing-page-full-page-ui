@AGENTS.md

# Riêng cho Claude Code

- Quy ước dự án nằm trong `AGENTS.md` (đã import ở trên) — sửa ở đó, không chép sang đây.
- MCP của dự án (`.mcp.json`): `next-devtools` (lỗi build/runtime, route của dev server đang chạy), `context7`
  (tài liệu thư viện đúng phiên bản), `playwright` (mở trang, chụp ảnh, kiểm tra theme/section), `codegraph` (đồ thị code
  local: `codegraph_explore`, symbol/caller/impact — cần CLI `npm i -g @colbymchenry/codegraph` và `codegraph init -y`).
- Plugin Codex (`codex@openai-codex`, khai báo trong `.claude/settings.json`): chạy `/codex:setup` một lần, sau đó
  `/codex:review` hoặc `/codex:adversarial-review` để Codex rà soát, `/codex:rescue` để giao việc cho Codex.
  Không có plugin thì dùng trực tiếp `codex review` / `codex exec` theo skill `solar-agent-collab`.
- Skills nên dùng: `frontend-design` + `ui-ux-pro-max` khi làm theme/section mới, `web-design-guidelines` khi review UI,
  `vercel-react-best-practices` + `vercel-composition-patterns` khi viết component, `next-cache-components-adoption`
  khi làm ISR/cache (E5), `webapp-testing` cho e2e, `solar-section-variant` / `solar-theme-port` khi port template.
- Skill bổ trợ (E0-S07, D22; bước nào dùng skill nào và skill nào **bắt buộc** xem bảng trong `run-story`):
  - `codegraph`: định vị code, `impact` khi sửa (bắt buộc). `graphify`: câu hỏi kiến trúc dính tài liệu.
  - `ponytail`: viết code. `ponytail-review`: rà over-engineering lúc tự review và review.
  - `test-driven-development`, `verification-before-completion`, `receiving-code-review`: viết test trước, chỉ báo
    xong khi có output, sửa theo review có thẩm định. `debugging-and-error-recovery`: debug khi verify FAIL.
  - `playwright-cli`: chụp ảnh khi MCP `playwright` lỗi (không tự viết script). `webapp-testing`: spec e2e.
  - Design pass trang công khai: `design-taste-frontend`, `redesign-existing-projects` (cùng `frontend-design`,
    `ui-ux-pro-max`). Sửa skill `solar-*`: `skill-creator`.
  - `security-and-hardening`: tenant/auth/upload. `performance-optimization`: Core Web Vitals.
  - `source-driven-development`: tra tài liệu gốc.
  - `code-simplification`, `frontend-ui-engineering`, `browser-testing-with-devtools`: khi cần.
  - OmniRoute (`cli-setup`, `omni-auth`, `omni-mcp`): chưa dùng, lý do ở D16.
- Trước khi bắt đầu một story: đọc file epic tương ứng trong `roadmap/epics/`, xác nhận phụ thuộc đã xong.
