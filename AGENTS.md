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
Chỉ báo "xong" khi typecheck + lint + test + build đều qua trên phần bị ảnh hưởng.

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

| Việc | Agent chính | Agent rà soát |
|---|---|---|
| Kiến trúc, ADR, chia story, thiết kế schema/token | Claude Code | Codex (`codex review`, adversarial) |
| Triển khai story đã có AC rõ, port section/theme cơ học, viết test | Codex (`codex exec` / Codex cloud) | Claude Code (`/code-review`) |
| UI/UX, chất lượng giao diện (skill `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`) | Claude Code | Codex |
| Debug Next.js chạy thật (MCP `next-devtools`, `playwright`) | Agent đang làm story | — |

- Mỗi story một branch `feat/<STORY-ID>-<slug>` (vd. `feat/E3-S02-hero-schema`), tách khỏi `mono-repo-multi-tenent`.
  Hai agent làm song song thì dùng git worktree riêng, không sửa chung một branch.
- **Người viết không tự duyệt**: code do Codex viết thì Claude review và ngược lại. Chi tiết: skill `solar-agent-collab`.
- Commit theo Conventional Commits có scope là package hoặc story: `feat(sections): … [E3-S02]`.
- Khi xong story: tick AC trong file epic tương ứng ở `roadmap/epics/` và ghi link PR.

## 7. Định nghĩa hoàn thành (DoD) cho mọi story

1. Mọi AC của story đạt, có bằng chứng (test, ảnh chụp, log).
2. `typecheck`, `lint`, `test`, `build` qua; không còn vi phạm luật token (`pnpm lint:tokens` sau E2).
3. Có test cho logic mới (unit với `node:test`/vitest; e2e Playwright cho luồng người dùng).
4. Đã được agent còn lại review, mọi góp ý mức "correctness" đã xử lý.
5. Tài liệu (README package, roadmap) cập nhật nếu hành vi thay đổi.
