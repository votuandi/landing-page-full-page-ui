# AGENTS.md — hướng dẫn chung cho Codex và Claude Code

File này là **nguồn duy nhất** cho quy ước dự án. `CLAUDE.md` import file này; Codex đọc trực tiếp.
Kế hoạch refactor đầy đủ (epic, user story, AC): [`roadmap/README.md`](roadmap/README.md).

## 1. Dự án là gì

Nền tảng website cho công ty điện mặt trời Việt Nam (lắp đặt, EPC, phân phối thiết bị). Hiện có 15 template,
mỗi template nằm trên một branch riêng (`minwy`, `template-2` … `template-15`). Branch `mono-repo-multi-tenent`
gom tất cả về **một codebase, nhiều theme, nhiều khách (tenant)**:

- **Theme** = design tokens (CSS variables): màu, font, bo góc, kính (glass), bóng đổ, tốc độ animation.
- **Section** = khối nội dung (hero, calculator, lead-form, projects, shorts…), mỗi loại có nhiều **variant** (`t08`, `t12`…)
  và **một schema dữ liệu dùng chung** cho mọi variant.
- **Preset** = theme + danh sách section sắp sẵn (thứ trước đây gọi là "template").
- **Site (tenant)** = preset đã được khách tùy biến + nội dung + tên miền + gói dịch vụ (feature flags).

Điểm bắt đầu của branch này là `template-15` (Next.js 15 App Router, React 19, TS strict, Tailwind 3 dùng token,
`node:test`). `template-15` là bản tham chiếu: token hóa hoàn toàn, có test, gộp tính năng 13 + 14.

## 2. Cấu trúc đích (sau Epic E1)

```
apps/web        Next.js: render site công khai theo tên miền (proxy/middleware → tenant), ISR
apps/admin      Next.js: CMS, quản lý section, media, lead, tên miền, builder (gói Premium)
packages/tokens   schema token + sinh CSS variables + Tailwind preset (không có màu mặc định của Tailwind)
packages/themes   t01-minwy, t02 … t15: token set + font + motion của từng template
packages/ui       primitive dùng chung (Button, Card, Dialog, Media, carousel, reveal) — chỉ đọc token
packages/sections <type>/schema.ts + <type>/<variant>.tsx + registry
packages/presets  preset JSON của từng template
packages/core     logic nghiệp vụ thuần: solarCalculator, price, phone, quoteCart, segment
packages/db       Prisma schema + client có ràng buộc tenant
packages/storage  driver lưu media: local (SSD VPS) | s3 | r2
packages/leads    adapter gửi lead (webhook, Google Sheets, Telegram) cấu hình theo tenant
packages/plans    gói dịch vụ → entitlements (cờ tính năng + giới hạn)
infra/            docker, caddy (on-demand TLS), aws
roadmap/          kế hoạch, epic, story — cập nhật trạng thái khi làm xong story
```

## 3. Lệnh

Trước E1 (repo một app, yarn): `yarn dev` · `yarn typecheck` · `yarn lint` · `yarn test` · `yarn build`.
Sau E1 (pnpm + Turborepo): `pnpm dev --filter web` · `pnpm turbo run typecheck lint test build`.
Chỉ báo "xong" khi typecheck + lint + test đều qua trên phần bị ảnh hưởng. `build` chỉ bắt buộc ở story cuối
của mỗi epic (`"buildPolicy": "epic-last"` trong `scripts/agents/routing.json`; CI vẫn build mọi PR).

## 4. Quy tắc bắt buộc

**Token, không hard-code.**
- Trong `packages/sections`, `packages/ui`, `apps/*`: cấm mã màu (`#0E7C3A`, `rgb(…)`), class tùy ý về màu/font/bo góc/bóng
  (`bg-[#…]`, `text-[#…]`, `rounded-[28px]`, `shadow-[…]`), và màu mặc định của Tailwind (`bg-white`, `text-slate-500`).
  Chỉ dùng class sinh từ token (`bg-bg-elevated`, `text-fg-muted`, `bg-primary`, `rounded-card`, `shadow-lg`…).
- Ngoại lệ duy nhất: file token trong `packages/themes/*`. Màu thương hiệu bên thứ ba (logo Zalo, Facebook) đặt trong
  `packages/ui/brand-icons` với chú thích lý do.
- Một section đặt sang theme khác phải tự đổi màu/font/bo góc theo theme đó mà không sửa code.

**Schema theo loại section, không theo variant.**
- Mỗi `packages/sections/<type>/schema.ts` export một zod schema + giá trị mặc định. Mọi variant của type đó nhận đúng
  props sinh từ schema. Không thêm trường riêng cho một variant; nếu cần, thêm trường tùy chọn vào schema chung.
- Đổi variant hoặc đổi theme không được làm mất nội dung.
- Thay đổi schema phải kèm migration dữ liệu (`packages/sections/<type>/migrations.ts`) và tăng `schemaVersion`.

**Tenant isolation.**
- Mọi truy vấn dữ liệu nội dung đi qua repository có `tenantId` bắt buộc; không gọi Prisma trực tiếp từ route/page.
- Cache tag luôn có tiền tố tenant: `tenant:<id>`, `tenant:<id>:page:<slug>`, `tenant:<id>:collection:<name>`.
- Khóa lưu media có tiền tố `tenants/<tenantId>/`. Không bao giờ dùng đường dẫn do người dùng gửi lên làm khóa.
- Mỗi API admin kiểm tra membership của user với tenant trước khi đọc/ghi.

**Tính năng theo gói.** Section/tính năng có thu phí phải khai báo entitlement trong `packages/plans` và kiểm tra bằng
`can(site, "calculator")` ở cả server render lẫn API — không chỉ ẩn ở UI.

**Khác.**
- Nội dung hiển thị mặc định tiếng Việt, hỗ trợ VI/EN qua trường localizable (`{ vi, en? }`).
- Không thêm dependency runtime nếu chưa ghi lý do trong PR. Đã chấp thuận cho kế hoạch: `zod`, `@prisma/client`,
  `@aws-sdk/client-s3`, `sharp`, `@dnd-kit/*` (hoặc `@measured/puck` sau khi spike E12 chốt), `ioredis`.
- Hiệu ứng tôn trọng `prefers-reduced-motion`; nội dung vẫn hiện khi tắt JavaScript.
- Dữ liệu mẫu (tên công ty hư cấu, số liệu) phải gắn nhãn `[DỮ LIỆU MẪU]` như các template hiện có.
- Không sửa file trong `.agents/skills/*` cài từ bên ngoài (quản lý bằng `npx skills update`); skill riêng của dự án
  nằm trong `.agents/skills/` với tiền tố `solar-`.

## 5. Lấy code từ các branch template

Các template **không merge** vào branch này. Lấy từng file bằng `git show origin/template-NN:<path>` rồi chuyển thành
section variant / theme theo skill `solar-section-variant` và `solar-theme-port`. Bảng tra section ↔ template:
[`roadmap/01-template-analysis.md`](roadmap/01-template-analysis.md).

## 6. Phối hợp Claude Code ↔ Codex

Mỗi story chạy bằng playbook **`/run-story <ID|next>`** trong Claude Code (skill `.claude/skills/run-story`):

1. **Plan** → `roadmap/plans/<ID>.md`, theo `"planPolicy"` trong `scripts/agents/routing.json`. Hiện tại `claude`:
   Claude tự khảo sát và viết plan cho mọi story; Codex chỉ implement và không viết plan/brief. Lựa chọn khác `budget`:
   story logic thường Codex viết nháp, Claude duyệt; story kiến trúc (`architecture`) và story UI Codex khảo sát (brief),
   Claude viết plan (skill `solar-story-plan`).
2. **Thực thi** theo mode trong `routing.json`:
   - `claudeFull` (thiết kế UX mới): Claude làm toàn bộ.
   - `split` (port template, section variant, màn hình CMS theo mẫu): Codex dựng, Claude làm design pass.
   - còn lại: Codex làm toàn bộ (skill `solar-story-exec`).
   Sandbox Codex khóa ghi `.git`, nên Claude tạo branch và commit theo "Commit đề xuất" của Codex (`Co-Authored-By: Codex`).
3. Việc cơ học chạy bằng `scripts/agents/run.mjs` (`verify`, `commit`, `pr-body`), Claude chỉ đọc tóm tắt; rồi push, tạo PR.
   Claude không tạo được PR (GitHub MCP / `gh` lỗi) → giao Codex tạo PR. Không bao giờ để người dùng tự tạo PR.
4. **Review** theo `"reviewPolicy"` trong `routing.json`. Hiện tại `claude`: Claude review mọi story bằng subagent
   (model `claudeReviewModel`, mặc định Sonnet) để tiết kiệm quota Codex; với `selfReview: "swap"`, story do Claude viết
   (`--agent claude`) vẫn sang Codex review. Lựa chọn khác: `codex-except-architecture` (Codex review mọi story trừ 15 story
   `architecture` do Claude review), `codex` (Codex review tất cả), `parity` (lẻ → Codex, chẵn → Claude). Khi agent
   review code chính nó viết (`selfReview: "allow"`), skill `solar-pr-review` chạy chế độ "Tự review" và PR ghi cảnh báo. Skill `pr-review`, định dạng `solar-pr-review`.
   **Cân tải**: `"budget"` trong `routing.json` — `balanced` (mặc định), `claude-saver` khi Claude sắp hết quota,
   `codex-saver` khi Codex sắp hết. Xem tỷ lệ: `node scripts/agents/story.mjs load`.
5. Review liệt kê issue + case chưa cover AC/yêu cầu của story. Finding P0/P1 và case chưa cover → người viết sửa,
   review lại, lặp tới khi PR merge được (APPROVE, CI xanh, không conflict; chặn an toàn 5 vòng) rồi báo người dùng.
   **Không agent nào tự merge.**

Skill bổ trợ, dùng nếu đã cài trong `.agents/skills` (lý do chọn/bỏ: ADR D16):
- Plan: `graphify`, gọi `python -m graphify query "<câu hỏi>"` để định vị file trước khi đọc.
- Thực thi: `ponytail` mức `full`, viết ít code nhất; `AGENTS.md` §4 ưu tiên hơn.
- Test và debug: `test-driven-development`, và `debugging-and-error-recovery` khi lệnh kiểm tra lỗi.
- Bằng chứng UI: `playwright-cli` khi MCP `playwright` lỗi.
- Review: `ponytail-review` rà over-engineering, tối đa P2.
- Theo việc: `security-and-hardening` (tenant/auth/upload), `performance-optimization`, `source-driven-development`,
  `code-simplification`, `frontend-ui-engineering`, `browser-testing-with-devtools`.
- OmniRoute (`cli-setup`, `omni-auth`, `omni-mcp`): chưa dùng tới khi dự án chạy gateway.

Tra cứu nhanh: `node scripts/agents/story.mjs list --todo` (trạng thái, người làm, reviewer), `… info <ID>`, `… next`.

- Branch: `<type>/<STORY-ID>-<slug>` (vd. `feat/E3-S02-kieu-du-lieu-nen`), tách khỏi `mono-repo-multi-tenent`.
  Playbook chạy tuần tự trong cây làm việc chính; chạy song song thì dùng git worktree riêng.
- Debug Next.js chạy thật: MCP `next-devtools`, `playwright` — agent nào đang làm story thì dùng.
- Commit theo Conventional Commits có scope là package hoặc story: `feat(sections): … [E3-S02]`.
- Khi xong story: tick AC trong file epic tương ứng ở `roadmap/epics/` và ghi link PR.

## 7. Định nghĩa hoàn thành (DoD) cho mọi story

1. Mọi AC của story đạt, có bằng chứng (test, ảnh chụp, log).
2. `typecheck`, `lint`, `test` qua (`build` ở story cuối epic, xem §3); không còn vi phạm luật token (`pnpm lint:tokens` sau E2).
3. Có test cho logic mới (unit với `node:test`/vitest; e2e Playwright cho luồng người dùng).
4. Đã được review theo `reviewPolicy` (§6), mọi finding P0/P1 đã xử lý.
5. Tài liệu (README package, roadmap) cập nhật nếu hành vi thay đổi.
