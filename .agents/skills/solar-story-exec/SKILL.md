---
name: solar-story-exec
description: Execute a roadmap story from a plan file written by Claude on the branch Claude prepared — implement exactly the plan, run checks, tick AC, and write a report with proposed commits (git is read-only in the Codex sandbox). Use when a prompt says "Dùng skill solar-story-exec", or when asked to implement or fix a story on its branch.
---

# Thực thi story theo plan

Bạn là người thực thi (Codex, hoặc Claude khi thực thi thay). Plan là hợp đồng: làm đúng plan, đủ AC, không làm thêm.
Áp dụng cho **cả Claude** khi Claude tự thực thi (mode `claude`, Codex hết quota): cùng quy tắc, cùng khung báo cáo.

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
- **Sửa finding review (skill `receiving-code-review`, `test-driven-development`)** — mỗi finding:
  1. Thẩm định: tái hiện được không? Sai thì ghi phản biện vào `<runDir>/review-r<n>-rebuttal.md`, không sửa mù.
  2. Gọi tên **bất biến** bị vi phạm (vd. "metadata link sống sót qua mọi thao tác", không phải "case xóa link đầu"),
     và sửa theo bất biến đó — sửa hẹp cho đúng một kịch bản là nguồn gốc của chuỗi "sửa gây lỗi mới".
  3. Viết test tái hiện **trước** (phải FAIL trên code cũ), thêm vào file test hồi quy của story
     (`<package>/src/__tests__/<id>-regression.test.ts(x)` hoặc file test chính đã có), rồi mới sửa.
  4. `codegraph impact <symbol đã sửa>` → nơi gọi khác có cần test không.
  5. Chạy lại **toàn bộ** test của package (không chỉ test mới): mọi test của các vòng trước phải còn xanh.

## Khi thực thi

- Làm theo "Các bước" của plan, theo thứ tự. Plan sai hoặc thiếu so với code thật → chọn cách đơn giản nhất thỏa AC, ghi
  lý do vào báo cáo mục "Lệch so với plan". Thay đổi lớn (đổi kiến trúc, thêm dependency ngoài danh sách đã duyệt trong
  `AGENTS.md`, sửa schema dùng chung không có trong plan) → **dừng**, ghi `HANDOFF.md` và báo cáo, không tự quyết.
- Tuân thủ mọi quy tắc trong `AGENTS.md` §4 (token, schema, tenant, entitlement). Viết test cho logic mới.
- **Bảng "Case biên & bất biến" của plan**: viết test cho từng dòng **trước** khi viết code (TDD); tên test khớp cột
  "Test sẽ chứng minh". Không làm được dòng nào → ghi "Lệch so với plan".
- **Dùng skill như Claude** (skill cài trong `.agents/skills`). Danh sách lấy từ prompt: dòng `Skill bắt buộc:`,
  `Skill tự review:`, `Skill khi sửa:` và `Skill theo việc:` (sinh từ `S.skills` trong `scripts/agents/routing.json`;
  prompt không có → `node scripts/agents/story.mjs info <ID>` và đọc trường `skills`).
  - **Mở `.agents/skills/<tên>/SKILL.md` bằng một lệnh đọc file trước bước dùng skill đó** và làm theo; không làm theo
    trí nhớ hay chỉ mô tả của skill. Mỗi skill bắt buộc mở ít nhất một lần trong phiên. `codegraph` là CLI (không có
    SKILL.md): chạy `codegraph sync`, rồi `explore`/`node` để định vị code, `impact` cho symbol đã sửa.
  - Skill bắt buộc (mặc định khi prompt không ghi): `ponytail` mức `full` trước khi viết code (xung đột thì `AGENTS.md`
    §4 và plan thắng); `test-driven-development` khi viết test; `codegraph`; `verification-before-completion` trước
    khi ghi `DONE`; story UI thêm `vercel-react-best-practices`, `vercel-composition-patterns`; story kiến trúc thêm
    `security-and-hardening`. Tự review: `ponytail-review`. Sửa finding: `receiving-code-review`.
  - Skill theo việc: gặp đúng tình huống ghi trong `Skill theo việc:` (vd. lỗi chưa rõ → `debugging-and-error-recovery`,
    viết e2e → `webapp-testing`, chụp UI khi MCP lỗi → `playwright-cli`, tenant/auth/upload → `security-and-hardening`,
    câu hỏi kiến trúc → `graphify`) thì mở SKILL.md rồi làm. Không tự viết script chụp ảnh riêng.
  - `node scripts/agents/run.mjs skills <ID>` đối chiếu log của bạn: skill bắt buộc chưa mở hoặc ghi "đã dùng" mà log
    không thấy mở đều bị cảnh báo khi verify.
- Tiết kiệm token: sửa bằng công cụ sửa file theo đoạn (không chạy script python/sed có escape phức tạp cho code);
  không in log dài (chỉ đuôi khi lỗi); build/e2e chạy một lần ở cuối, không sau mỗi chỉnh nhỏ.
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
   Chạy e2e trong `tooling/visual` có thể ghi đè ảnh trong `roadmap/evidence/` → nếu story không cố ý cập nhật evidence,
   khôi phục (`git checkout -- roadmap/evidence`) trước khi báo cáo.
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
   ## Case biên → test
   | # (theo plan) | Test | PASS |
   ## Skill đã dùng
   | Skill | Bước | Đã làm gì (cụ thể) |
   Mỗi skill đã mở SKILL.md một dòng; skill bắt buộc bỏ qua → ghi lý do. Không ghi skill chưa mở.
   ## Lệch so với plan
   ## Việc còn lại / câu hỏi
   ```
   Mọi file đã sửa/tạo/xóa phải nằm trong đúng một commit đề xuất (đối chiếu `git status --porcelain`).
4. Trạng thái `PARTIAL`/`BLOCKED` → ghi thêm `HANDOFF.md` ở gốc repo (không commit).
