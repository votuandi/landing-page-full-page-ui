---
name: solar-story-exec
description: Execute a roadmap story from a plan file written by Claude on the branch Claude prepared — implement exactly the plan, run checks, tick AC, and write a report with proposed commits (git is read-only in the Codex sandbox). Use when a prompt says "Dùng skill solar-story-exec", or when asked to implement or fix a story on its branch.
---

# Thực thi story theo plan

Bạn là người thực thi. Plan do Claude viết là hợp đồng: làm đúng plan, đủ AC, không làm thêm.

## Git: chỉ đọc

Sandbox của Codex khóa ghi thư mục `.git`. **Không chạy lệnh git ghi** (`switch`, `checkout -b`, `add`, `commit`, `stash`,
`push`, `reset`). Claude đã tạo branch trước khi gọi bạn và sẽ commit theo mục "Commit đề xuất" trong báo cáo.
Lệnh git chỉ đọc (`git status`, `git diff`, `git log`, `git show origin/template-NN:<path>`) dùng thoải mái.

## Bắt đầu story mới

1. Kiểm tra `git branch --show-current` đúng branch trong prompt; sai → dừng, ghi báo cáo `BLOCKED`.
2. Đọc theo thứ tự: `AGENTS.md`, block story trong file epic (ID trong prompt), file plan.

## Tiếp tục / sửa lỗi

- Prompt có "Tiếp tục" hoặc "Sửa" → đọc thêm `HANDOFF.md` (nếu có), file review/log được nêu.
- Chỉ sửa đúng các lỗi/finding được nêu; mỗi finding một mục trong "Commit đề xuất" nếu tách được
  (`fix(<scope>): <mô tả> [<ID>]`).

## Khi thực thi

- Làm theo "Các bước" của plan, theo thứ tự. Plan sai hoặc thiếu so với code thật → chọn cách đơn giản nhất thỏa AC, ghi
  lý do vào báo cáo mục "Lệch so với plan". Thay đổi lớn (đổi kiến trúc, thêm dependency ngoài danh sách đã duyệt trong
  `AGENTS.md`, sửa schema dùng chung không có trong plan) → **dừng**, ghi `HANDOFF.md` và báo cáo, không tự quyết.
- Tuân thủ mọi quy tắc trong `AGENTS.md` §4 (token, schema, tenant, entitlement). Viết test cho logic mới.
- Skill bổ trợ, bỏ qua nếu chưa cài:
  - `ponytail` mức `full`: viết ít code nhất thỏa AC, ưu tiên code có sẵn, stdlib và tính năng nền tảng. Khi xung đột
    thì `AGENTS.md` §4 và plan thắng, ví dụ token, schema chung, tenant.
  - `test-driven-development` khi viết test.
  - `debugging-and-error-recovery` khi lệnh kiểm tra lỗi mà chưa rõ nguyên nhân.
  - `playwright-cli` để chụp bằng chứng UI khi MCP `playwright` không kết nối được.
- Chia thay đổi thành các commit nhỏ theo bước (ghi trong "Commit đề xuất"): `<type>(<scope>): <mô tả> [<ID>]`.
  Không đưa `.agent-runs/`, `HANDOFF.md`, file `.env*` vào commit nào.
- Không tạo PR, không sửa file của story khác.

## Mode `split` (story giao diện: bạn dựng, Claude làm design pass sau)

- Làm phần trong plan giao cho Codex: schema + fixture, cấu trúc component, dữ liệu, logic, đổi mọi màu/bo góc/font cứng
  sang token (skill `solar-section-variant`, `solar-theme-port`), test. Port template: giữ đúng bố cục và hiệu ứng của
  bản gốc, không tự "làm đẹp" khác đi.
- Không tinh chỉnh thẩm mỹ ngoài bản gốc (khoảng cách, typography, hiệu ứng mới) — để Claude làm ở design pass.
- Báo cáo thêm mục `## Ghi chú cho design pass`: chỗ chưa khớp bản gốc, chỗ cần mắt người (tương phản, ảnh, responsive),
  route/trang để xem.

## Trước khi kết thúc

1. Chạy mọi lệnh kiểm tra trong prompt và plan. Lỗi → sửa rồi chạy lại. Không bỏ qua hoặc vô hiệu test để cho qua.
2. Tick `[x]` các AC đã có bằng chứng trong file epic; AC chưa đạt để nguyên `[ ]`. Không gắn ✅ vào heading.
3. Viết báo cáo vào đường dẫn được nêu trong prompt (mặc định `.agent-runs/<ID>/codex-report.md`):
   ```markdown
   # Báo cáo <ID>
   Trạng thái: DONE | PARTIAL | BLOCKED
   Branch: <branch>
   ## AC → bằng chứng
   | AC | Đạt | Bằng chứng (lệnh/test/file) |
   ## Lệnh kiểm tra
   <lệnh> → PASS/FAIL (dán dòng tóm tắt)
   ## Commit đề xuất
   1. `<type>(<scope>): <mô tả> [<ID>]`
      - path/a.ts
      - path/b.ts
   2. `docs(roadmap): tick AC [<ID>]`
      - roadmap/epics/<file>.md
   ## Lệch so với plan
   ## Việc còn lại / câu hỏi
   ```
   Mọi file đã sửa/tạo/xóa phải nằm trong đúng một commit đề xuất (đối chiếu `git status --porcelain`).
4. Trạng thái `PARTIAL`/`BLOCKED` → ghi thêm `HANDOFF.md` ở gốc repo (không commit).
