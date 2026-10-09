@AGENTS.md

# Riêng cho Claude Code

- Quy ước dự án nằm trong `AGENTS.md` (đã import ở trên) — sửa ở đó, không chép sang đây.
- MCP của dự án (`.mcp.json`): `next-devtools` (lỗi build/runtime, route của dev server đang chạy), `context7`
  (tài liệu thư viện đúng phiên bản), `playwright` (mở trang, chụp ảnh, kiểm tra theme/section).
- Plugin Codex (`codex@openai-codex`, khai báo trong `.claude/settings.json`): chạy `/codex:setup` một lần, sau đó
  `/codex:review` hoặc `/codex:adversarial-review` để Codex rà soát, `/codex:rescue` để giao việc cho Codex.
  Không có plugin thì dùng trực tiếp `codex review` / `codex exec` theo skill `solar-agent-collab`.
- Skills nên dùng: `frontend-design` + `ui-ux-pro-max` khi làm theme/section mới, `web-design-guidelines` khi review UI,
  `vercel-react-best-practices` + `vercel-composition-patterns` khi viết component, `next-cache-components-adoption`
  khi làm ISR/cache (E5), `webapp-testing` cho e2e, `solar-section-variant` / `solar-theme-port` khi port template.
- Skill bổ trợ (E0-S07; bước nào dùng skill nào xem bảng trong `run-story`):
  - `graphify`: khảo sát code khi viết plan.
  - `ponytail`: viết code. `ponytail-review`: rà over-engineering lúc review.
  - `playwright-cli`: chụp ảnh khi MCP `playwright` lỗi.
  - `test-driven-development` / `debugging-and-error-recovery`: test, và debug khi verify FAIL.
  - `security-and-hardening`: tenant/auth/upload. `performance-optimization`: Core Web Vitals.
  - `source-driven-development`: tra tài liệu gốc.
  - `code-simplification`, `frontend-ui-engineering`, `browser-testing-with-devtools`: khi cần.
  - OmniRoute (`cli-setup`, `omni-auth`, `omni-mcp`): chưa dùng, lý do ở D16.
- Trước khi bắt đầu một story: đọc file epic tương ứng trong `roadmap/epics/`, xác nhận phụ thuộc đã xong.
