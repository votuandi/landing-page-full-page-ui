# Quyết định kiến trúc (ADR rút gọn)

Trạng thái: **Đề xuất** cho tới khi story liên quan được duyệt. Đổi quyết định → sửa file này trong PR riêng.

## D1. pnpm + Turborepo, hai app `web` và `admin`
- **Chọn**: pnpm workspaces (cài nhanh, chặt phụ thuộc ma) + Turborepo (cache task, `--filter`).
- **Hai app**: `web` chỉ render site công khai — không kéo editor, dnd, form CMS vào bundle; `admin` chạy ở
  `admin.<platform>` với cookie/phiên riêng, dễ khóa IP/WAF.
- **Loại**: Nx (nặng cho đội nhỏ); một app có route `/admin` (lẫn bundle, khó tách bảo mật); yarn workspaces (repo
  đang dùng yarn nhưng pnpm hỗ trợ workspace tốt hơn, Turborepo khuyến nghị).

## D2. Next.js 16
- Lý do: `proxy.ts` (thay `middleware.ts`) chạy Node runtime → truy vấn Redis/DB khi phân giải tenant; `cacheComponents`
  + `"use cache"` + `cacheTag` cho cache theo tenant; `revalidateTag(tag, profile)` / `updateTag` trong Server Action.
- Nâng ở E1-S03 trên baseline t15, có test hồi quy ảnh. Nếu vướng, tạm giữ 15.4 với ISR `revalidateTag` (API tương đương)
  — các story E5 viết theo lớp `packages/cache` để đổi được.
- **Kết quả E1-S03: giữ Next 16.** `next 16.3.8` (Turbopack) + React 19.2.8, `eslint-config-next 16.3.8` (flat config gốc).
  Build không cảnh báo deprecation; MCP `get_errors` sạch trên 12 route; ảnh hồi quy 48/48 khớp baseline;
  Lighthouse trang chủ (mobile, trung vị 3 lần) Perf 84 → 85, A11y 94, BP 100, SEO 100 (LCP 3,8 → 4,1 s, TBT 178 → 138 ms;
  theo dõi LCP ở E14). `cacheComponents` chưa bật (E5-S06).
- Không chạy `npx @next/codemod upgrade`: codemod không xử lý tốt pnpm workspace, và code không có pattern cần chuyển
  (`middleware`, `unstable_*`, `next lint`, `experimental.turbopack`, parallel route); params async đã có từ Next 15.
- Điều chỉnh đi kèm: `images.qualities: [70, 75]` (Next 16 chỉ cho 75), `<html data-scroll-behavior="smooth">`,
  `agentRules: false` (không sinh `apps/web/AGENTS.md`); `SectionReveal` đặt độ trễ stagger bằng `<style>` riêng thay vì
  ghi `style` vào phần tử chưa hydrate (lỗi hydration mismatch React 19.2 báo). Ba luật React Compiler mới của
  `react-hooks` v7 (`refs`, `set-state-in-effect`, `immutability`) để `warn` — code cũ còn 55 chỗ vi phạm (`apps/web` 51,
  `packages/ui` 4), sửa ở story riêng rồi trả về `error`.

## D3. Postgres + Prisma, shared schema
- Một database, mọi bảng nội dung có `tenantId` (index kép `(tenantId, …)`). Truy cập qua `packages/db` →
  `forTenant(tenantId)` trả về repository đã gắn điều kiện.
- Khóa ngoại ghép `(tenantId, id)` để bản ghi không thể tham chiếu dữ liệu tenant khác (E5-S01).
- Lớp 2: Postgres RLS (`ENABLE` + `FORCE`, role runtime không sở hữu bảng) với `SET LOCAL app.tenant_id` trong transaction
  (E5-S09) — bắt lỗi khi dev quên repository.
- **Loại**: database-per-tenant (vận hành nặng, migration ×N); schema-per-tenant (Prisma hỗ trợ kém).
- Nội dung section: cột `data JSONB` kiểm bằng zod khi ghi; collection có cấu trúc (Product, Project, Post, Story…)
  là bảng riêng để lọc/sắp xếp/SEO.

## D4. Token qua CSS variables + Tailwind preset thay bảng màu
- Theme sinh `:root{--c-primary: 21 128 61; …}` (và khối dark) ở server, inline vào `<head>` của từng tenant —
  không cần build CSS riêng mỗi theme. Tailwind chỉ biết tên token → một file CSS cho mọi theme.
- Override của khách (màu chính, logo, font trong danh sách cho phép) gộp lên token theme lúc render.
- Lint `lint:tokens` (regex + ESLint rule) chặn màu cứng trong `packages/sections`, `packages/ui`, `apps/*`.

## D5. zod cho schema section
- Một nguồn cho: kiểu TS của props, kiểm dữ liệu khi ghi, giá trị mặc định, **form CMS tự sinh** (đọc metadata
  `.describe()` / `meta({ widget })`), JSON Schema cho builder.

## D6. Storage driver
- `interface StorageDriver { put, get, delete, list, signedUploadUrl?, publicUrl }`; cài `local` (thư mục trên SSD,
  Caddy phục vụ), `s3` (AWS S3, Cloudflare R2, MinIO — khác `endpoint`).
- Ảnh: tạo biến thể (webp/avif, 3 kích thước) bằng `sharp` khi upload; trang dùng loader `next/image` trỏ CDN.

## D7. Tên miền & SSL
- **VPS**: Caddy `on_demand_tls` + `ask https://web/api/domains/allow?domain=` → chỉ cấp cert cho tên miền có trong DB
  và đã xác minh. Miễn phí, tự gia hạn.
- **AWS hoặc khi cần CDN/WAF**: Cloudflare for SaaS (Custom Hostnames) — 100 hostname đầu miễn phí, sau đó khoảng
  $0,1/hostname/tháng; API tạo hostname khi khách thêm tên miền.
- **Tên miền gốc (apex) với Cloudflare for SaaS**: bản ghi A trỏ thẳng VPS/ALB sẽ đi vòng qua Cloudflare. Chỉ hỗ trợ apex khi
  DNS của khách có CNAME flattening (vd. khách dùng Cloudflare DNS) hoặc khi bật Apex Proxying (điều kiện gói/chi phí riêng).
  Mặc định: `www` làm tên miền chính, apex chuyển hướng về `www` (dịch vụ redirect của nhà đăng ký hoặc qua Caddy trên VPS).
  Origin chỉ nhận traffic từ Cloudflare (Authenticated Origin Pulls / danh sách IP).
- `ask` chỉ quyết định có xin chứng chỉ hay không; việc chặn phục vụ tên miền đã gỡ nằm ở tầng HTTP (proxy, E5-S03).
- Khách tự đứng tên tên miền (mua tại nhà đăng ký của khách); nền tảng chỉ hướng dẫn trỏ CNAME/A và kiểm tra.

## D8. Entitlements
- `packages/plans/plans.ts`: `{ basic, pro, premium }` → `features: Set<Feature>`, `limits: {domains, mediaGb, pages,…}`,
  `themes: ThemeGroup[]`. `can(site, feature)` dùng ở render, API, CMS. Site có thể có `addons` (mua lẻ tính năng).

## D9. Email theo tên miền
- Không tự host mail server. Trang "Email theo tên miền" trong admin: chọn Zoho Mail / Google Workspace, link affiliate,
  hiển thị bản ghi MX/SPF/DKIM/DMARC cần thêm, nút kiểm tra DNS. Dịch vụ cài hộ = phí cài đặt.

## D10. Builder
- Gói Cao cấp: thao tác trên cây section (thêm/xóa/kéo thả/đổi variant/sửa props) với preview trực tiếp trong iframe
  (draft mode). Spike 3 ngày so sánh **Puck** (`@measured/puck`, MIT, cấu hình component + field sẵn) với tự xây bằng
  **dnd-kit** + form từ zod. Tiêu chí: đọc được schema zod, bundle admin, khả năng khóa theo entitlement.

## D11. Cache dùng chung nhiều instance
- Next.js chạy ≥ 2 instance (VPS: 2 container; AWS: ECS nhiều task) → cấu hình cache handler dùng Redis để
  `revalidateTag` có hiệu lực ở mọi instance. Không có Redis (dev) → cache bộ nhớ.

## D13. CSP tương thích trang tĩnh
- Nonce theo request buộc render động → mất ISR/PPR. Vì vậy `apps/web` dùng CSP tĩnh trong header: `script-src 'self'` +
  **hash** của các inline script cố định (script chống nhấp nháy dark mode, JSON-LD dùng `type="application/ld+json"` không cần
  hash), `style-src 'self' 'unsafe-inline'` (CSS biến theme inline; rủi ro thấp vì không cho phép script), `frame-src` theo danh
  sách provider video. `apps/admin` (luôn động) dùng nonce.

## D14. Lệnh bất đồng bộ đi qua outbox
- Mọi tác dụng phụ sau khi ghi DB (revalidate cache, gửi lead tới kênh, xử lý ảnh) được ghi vào bảng `Outbox` trong cùng
  transaction, worker xử lý với idempotency key và retry. Không gọi trực tiếp "ghi DB rồi gọi mạng" trong request.

## D15. Test logic nghiệp vụ bằng node:test
- **Chọn**: giữ `node:test` cho `@solar/core`, biên dịch TypeScript sang CommonJS trước khi chạy. Không thêm test runner
  hay dependency runtime; các assert dự toán và giỏ báo giá hiện có được giữ nguyên sau khi chuyển package.
- `test` in coverage với `--experimental-test-coverage` (Node 20+). `test:coverage` dùng `--test-coverage-lines=85` và
  loại `.test-dist/__tests__/**` (test + fixture), bắt buộc ở CI Node 22 (cờ ngưỡng cần Node ≥ 22.8).
- **Loại**: Vitest ở E1-S05 — chưa có nhu cầu mà node:test không đáp ứng, tránh thêm dependency theo D12.

## D12. Không đổi stack UI
- Giữ quy ước các template: không thư viện UI/animation lớn. Cho phép thêm: `zod`, `sharp`, `@aws-sdk/client-s3`,
  `ioredis`, `@dnd-kit/*` hoặc `@measured/puck` (admin), `@playwright/test` (dev).

## D16. Skill bổ trợ cho agent (E0-S07)
- **Chọn**:
  - `playwright-cli`: chụp ảnh và kiểm trang khi MCP `playwright` lỗi.
  - `ponytail`, `ponytail-review`: viết ít code nhất, và rà over-engineering lúc review (tối đa P2).
  - `graphify`: đồ thị AST của repo để khảo sát khi viết plan, đọc ít file thô hơn. Gọi `python -m graphify`.
    `.graphifyignore` loại các bản copy skill.
  - Từ `addyosmani/agent-skills`, chọn 8/25 skill bổ sung đúng chỗ playbook chưa có:
    - `test-driven-development`, `debugging-and-error-recovery`: viết test, và sửa khi `verify` FAIL.
    - `security-and-hardening`: tenant, auth, upload.
    - `performance-optimization`: Core Web Vitals của site công khai.
    - `source-driven-development`: tra tài liệu gốc, đi cùng context7.
    - `code-simplification`, `frontend-ui-engineering`, `browser-testing-with-devtools`: dùng khi cần.
- **Bỏ** 17 skill còn lại của `agent-skills`:
  - Trùng playbook `run-story` / `pr-review` / `solar-story-*`, hoặc trùng quy ước trong `AGENTS.md`:
    `spec-driven-development`, `planning-and-task-breakdown`, `incremental-implementation`, `code-review-and-quality`,
    `shipping-and-launch`, `git-workflow-and-versioning`, `ci-cd-and-automation`, `documentation-and-adrs`,
    `using-agent-skills`, `context-engineering`. Hai bộ quy trình song song sẽ làm agent chọn sai.
  - Hỏi đáp với người dùng, trái với chế độ chạy tự động theo plan: `idea-refine`, `interview-me`,
    `doubt-driven-development`, `constraint-driven-development`.
  - Chưa có đối tượng để áp dụng:
    - `api-and-interface-design`: API admin ở E6+, dùng chung `vercel-composition-patterns`.
    - `observability-and-instrumentation`: chưa chạy production.
    - `deprecation-and-migration`: migration schema đã có quy ước riêng ở §4.
  - Xét lại khi tới epic tương ứng.
- **OmniRoute** (`cli-setup`, `omni-auth`, `omni-mcp`): cài để sẵn nhưng không gắn vào bước nào. Skill chỉ có tác dụng
  khi chạy gateway OmniRoute (`localhost:20128`). Dự án đang gọi Claude Code và Codex trực tiếp, cân tải bằng `budget`
  trong `routing.json`. Gắn vào quy trình khi có story dựng gateway.
