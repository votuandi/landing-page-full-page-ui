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
  2b. **Quét cùng loại**: `codegraph callers`/`impact` + grep tìm *mọi* chỗ cùng mẫu lỗi (mọi caller, mọi locale, mọi
     variant, mọi dữ liệu seed/preset). Sửa hết trong vòng này. Finding "sửa một phần" ở vòng sau là lỗi phổ biến nhất
     (E5-S04, E7-S03).
  3. Viết test tái hiện **trước** (phải FAIL trên code cũ), dạng bảng phủ cả lớp lỗi (finding + các chỗ tìm được ở 2b),
     thêm vào file test hồi quy của story
     (`<package>/src/__tests__/<id>-regression.test.ts(x)` hoặc file test chính đã có), rồi mới sửa.
  4. `codegraph impact <symbol đã sửa>` → nơi gọi khác có cần test không.
  5. Chạy lại **toàn bộ** test của package (không chỉ test mới): mọi test của các vòng trước phải còn xanh.
  6. Báo cáo mỗi finding: `Bất biến` · `Nơi đã soát (2b)` · `Test (tên)` · `RED→GREEN`.

## Khi thực thi

- Làm theo "Các bước" của plan, theo thứ tự. Plan sai hoặc thiếu so với code thật → chọn cách đơn giản nhất thỏa AC, ghi
  lý do vào báo cáo mục "Lệch so với plan". Thay đổi lớn (đổi kiến trúc, thêm dependency ngoài danh sách đã duyệt trong
  `AGENTS.md`, sửa schema dùng chung không có trong plan) → **dừng**, ghi `HANDOFF.md` và báo cáo, không tự quyết.
- Tuân thủ mọi quy tắc trong `AGENTS.md` §4 (token, schema, tenant, entitlement). Viết test cho logic mới.
- **Skill**: prompt ghi `Skill bắt buộc:` (mặc định `ponytail` mức `full`, `verification-before-completion`, `codegraph`;
  story UI thêm `vercel-react-best-practices`, `vercel-composition-patterns`; story kiến trúc thêm `security-and-hardening`),
  `Skill tự review:` (`ponytail-review`), `Skill khi sửa:` (`receiving-code-review`). Mở `.agents/skills/<tên>/SKILL.md`
  một lần trước bước dùng skill bắt buộc (`run.mjs skills` đối chiếu log). Skill khác (debug, e2e, section, theme…) chỉ mở
  khi thật sự gặp việc đó — không đọc "cho đủ". `codegraph` là CLI: `sync`, `explore`/`node`, `impact`.
- **TDD theo plan**: viết test cho mỗi dòng bảng "Yêu cầu → test" và "Case biên & bất biến" **trước** khi viết code, tên
  test khớp plan; dòng nào không làm được → "Lệch so với plan". Test kiểm *yêu cầu* (input → output mong đợi trong
  plan), không kiểm lại cách mình hiện thực.
- **Môi trường dựng sẵn — không bootstrap**: Claude đã chạy `bash scripts/local-ci.sh up` (Postgres 16 + Redis, role,
  migrate, seed) và đưa dòng `Env DB:` trong prompt (đường dẫn file `.env.ci.local`). Nạp bằng `set -a; . ./.env.ci.local; set +a`
  (PowerShell: đọc từng dòng vào `$env:`). **Không tự tải/cài Postgres, pnpm, codegraph, trình duyệt, chứng chỉ, proxy.**
  Thiếu công cụ → ghi `BLOCKED` một dòng nêu thiếu gì, không tự dựng.
- **Phạm vi test — chỉ code mới của story** (quyết định 23/10/2026): chạy test của file/package đang sửa
  (`node --test <file>`, `pnpm --filter <pkg> test|typecheck|lint`). Không chạy full suite/regression — Claude chạy
  regression theo nhịp (`S.regression`). Mọi lệnh dài ghi ra file
  (`… > <runDir>/<tên>.log 2>&1; tail -n 30 <runDir>/<tên>.log`), chỉ đọc đuôi/tóm tắt — không để output vào ngữ cảnh.
- **Codex trong sandbox không chạy**: `pnpm turbo …` (kéo `@solar/db:build` → `prisma generate` lỗi EPERM, xóa dở
  Prisma client — E7-S14 mất ~30′), `prisma generate`, `next dev`/dev server, Playwright/`local-ci.sh e2e`. Tiến trình
  sandbox để lại giữ cổng mà Claude không tắt được. Cần typecheck toàn repo hoặc e2e → ghi "chờ Claude chạy" trong report.
- E2E: viết spec trong `tooling/visual`, mỗi test mới/sửa tự đủ dữ liệu (tenant fixture có thể trống — tạo qua chính luồng
  đang test hoặc fixture). Claude chạy riêng test đó (`-g '<tên test>'`) trước khi push. Không tự dựng proxy/HTTPS/server.
- Sửa bằng công cụ sửa file theo đoạn (không chạy script python/sed có escape phức tạp cho code).
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
3. Viết báo cáo vào đường dẫn được nêu trong prompt (mặc định `.agent-runs/<ID>/codex-report.md`). **Ghi dần**: tạo
   khung ngay khi bắt đầu, cập nhật sau mỗi bước của plan (lệnh đã chạy + đường dẫn log) — lượt bị ngắt (máy khởi động
   lại, hết quota) thì lượt sau đọc report và làm tiếp, không chạy lại turbo/impact từ đầu. "Lệnh kiểm tra" gồm cả các bộ
   `printf '%s\n' $(git diff --name-only <base>...HEAD) | node scripts/ci/checks-map.mjs --stdin` liệt kê (chạy được
   trong sandbox thì chạy, không thì ghi "Claude chạy"). Trong "Commit đề xuất", mỗi file một dòng `- path`; mọi file
   mới/đổi phải nằm trong một nhóm:
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
