# Quyết định kiến trúc (ADR rút gọn)

Trạng thái: **Đề xuất** cho tới khi story liên quan được duyệt. Đổi quyết định → sửa file này trong PR riêng.

## D1. pnpm + Turborepo, hai app `web` và `admin`
- **Chọn**: pnpm workspaces (cài nhanh, chặt phụ thuộc ma) + Turborepo (cache task, `--filter`).
- **Hai app**: `web` chỉ render site công khai — không kéo editor, dnd, form CMS vào bundle; `admin` chạy ở
  `admin.<platform>` với cookie/phiên riêng, dễ khóa IP/WAF.
- **Loại**: Nx (nặng cho đội nhỏ); một app có route `/admin` (lẫn bundle, khó tách bảo mật); yarn workspaces (repo
  đang dùng yarn nhưng pnpm hỗ trợ workspace tốt hơn, Turborepo khuyến nghị).
- **Cập nhật 15/10/2026 (D17)**: thêm app thứ ba `console` cho super admin. `admin` = CMS của site khách, chạy ở
  `<slug>.admin.<platform>`; `console` = CMS nền tảng ở `console.<platform>`. Ba app, ba bundle, hai realm đăng nhập.

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

## D17. Hai CMS, hai realm tài khoản (15/10/2026)
Yêu cầu: CMS cho site admin và CMS cho super admin. Tài khoản của hai bên không dùng chéo được. Tên đăng nhập (email hoặc
SĐT) chỉ unique trong một site; hai site được có tài khoản trùng tên đăng nhập.
- **"Site" = tenant.** Mỗi tenant có đúng 1 `Site` (ràng buộc unique `Site.tenantId`, E5-S10). Mọi ranh giới tài khoản dùng
  `tenantId`. Một công ty có nhiều website → một `Customer` (khách hàng của nền tảng) có nhiều tenant. Tên `client` dành cho
  vai trò khách hàng cuối của site (D20), không dùng cho entity nền tảng.
- **Hai bảng tài khoản, không có bảng `User` chung**:
  - `SiteUser` (bảng tenant): `tenantId`, `email?`, `phone?` (dạng `0…` của `normalizeVnPhone`), `username?` (D21),
    `passwordHash`, `role`, `status`, `totpSecret?`. Unique `(tenantId, email)`, `(tenantId, phone)`, `(tenantId, username)`;
    có ít nhất một định danh (CHECK).
    Thay `User` + `Membership` của E5-S01.
  - `PlatformAdmin` (bảng nền tảng, không có `tenantId`): `email` unique toàn hệ thống, `passwordHash`, `totpSecret`
    bắt buộc. Bỏ liên kết tới `User`.
  - Cùng một người, cùng email ở hai realm là **hai tài khoản độc lập**, mật khẩu riêng. Không có trường hay bảng nào
    nối hai realm, nên không thể dùng tài khoản realm này đăng nhập realm kia.
- **Phiên tách hẳn**: `SiteSession` (tenant) và `PlatformSession`. Cookie `__Host-` (host-only, không đặt `Domain`) với tên
  riêng, secret ký riêng (`ADMIN_SESSION_SECRET`, `CONSOLE_SESSION_SECRET`). Cookie của `a.admin.<platform>` trình duyệt
  không gửi sang `b.admin.<platform>`. Nếu bị chép tay, server vẫn từ chối vì `session.tenantId` ≠ tenant của host.
- **Tenant xác định trước khi đăng nhập, bằng host**: `admin` nhận `<slug>.admin.<platform>` → tra `Tenant.slug` → tenant.
  Form đăng nhập chỉ tìm `SiteUser` trong tenant đó (đi cùng RLS `SET LOCAL app.tenant_id`, E5-S09). Không có bộ chọn tenant.
- **Slug dành riêng**: `admin`, `console`, `preview`, `www`, `api`, `media`, `sites`, `app`, `mail`, `static`, `status`
  không được dùng làm `Tenant.slug`, vì slug là subdomain.
- **Vai trò site**: `owner|admin|editor|staff|viewer` (nhân viên, vào được CMS) và `client` (khách hàng cuối, chỉ dùng
  site công khai, D20). Vai trò ánh xạ sang danh mục permission trong code (`packages/auth/permissions.ts`).
  Quyền hiệu lực = quyền của vai trò ∩ chính sách permission của tenant (super admin tắt được, D19) ∩ tính năng của gói.
- **Audience của phiên**: `SiteSession.audience admin|storefront`. Phiên `admin` chỉ cấp cho vai trò nhân viên, ở
  `<slug>.admin.<platform>`. Phiên `storefront` cấp trên tên miền công khai của site cho mọi `SiteUser` đang hoạt động,
  nhưng chỉ mang quyền `storefront.*`, kể cả khi người đăng nhập là owner. Hai loại phiên không đổi cho nhau được.
- **Thư viện**: `packages/auth` dùng chung cho hai app, không thêm dependency runtime: mật khẩu `scrypt` của `node:crypto`,
  TOTP (RFC 6238) tự viết bằng HMAC, phiên lưu DB và cache Redis 60 s.
- **Loại**:
  - Một bảng `User` toàn cục + `Membership`: email phải unique toàn hệ thống, trái yêu cầu.
  - Một app có hai khu `/admin` và `/console`: dùng chung cookie và bundle, khó khóa riêng console (IP allowlist, 2FA bắt buộc).
  - Admin theo đường dẫn `admin.<platform>/<slug>`: cookie dùng chung host, phải tự cô lập theo path.
  - CMS trên tên miền khách `khach.vn/admin`: trộn với site công khai (CSP, cache, cookie). Để backlog, dạng `admin.khach.vn`.

## D18. Ghost login (super admin vào CMS site)
- Console tạo `GhostGrant` (`platformAdminId`, `tenantId`, `reason` bắt buộc, `tokenHash`, token hết hạn 60 s, dùng 1 lần),
  rồi chuyển hướng tới `https://<slug>.admin.<platform>/auth/ghost?token=…`. Trước đó yêu cầu nhập lại TOTP nếu lần xác thực
  gần nhất đã quá 10 phút.
- `admin` đổi token lấy `SiteSession{kind: "ghost", ghostGrantId}` (không có `siteUserId`), thời hạn 30 phút, không gia hạn.
  Quyền = `owner`, trừ các quyền bảo mật tài khoản (đổi/đặt lại mật khẩu, 2FA, chuyển quyền owner, xóa tài khoản).
- Banner cố định "Đang ghost: <tên admin> — còn mm:ss — Thoát". Mỗi thao tác ghi `AuditLog` với
  `actorType: "platform_admin"`, `actorId`, `ghostGrantId`. Owner của site thấy các lượt truy cập hỗ trợ trong nhật ký.
- Console thu hồi grant → phiên ghost hết hiệu lực ở request kế tiếp (kiểm grant mỗi request, cache ≤ 5 s).
- **Loại**: đăng nhập bằng tài khoản `SiteUser` dùng chung "support@…" trong mỗi tenant (lộ mật khẩu, không biết ai làm);
  console tự gọi API admin thay người dùng (phải nhân đôi mọi kiểm quyền).

## D19. Tính năng hiệu lực = nền tảng × tenant × gói
- Thứ tự phân giải trong `can(site, feature)` (E6-S02):
  1. Tắt toàn nền tảng (`PlatformSetting["features.disabled"]`, kill switch) → `false`.
  2. Override của tenant (`Tenant.featureOverrides[feature] = { on, until?, reason }`, chưa hết hạn) → `on`.
  3. Gói + `addons` + trial → như D8.
- `limit()` tương tự với `Tenant.limitOverrides`. Permission của tenant (`Tenant.permissionPolicy.deny[]`) chỉ được hạ quyền,
  không được nâng quyền.
- Cấu hình nền tảng nằm ở bảng `PlatformSetting(key, value JSONB)`, mỗi key có zod schema + giá trị mặc định trong code
  (`packages/platform`). Cache tag `platform:settings`.
- Trang của mọi tenant gắn thêm tag `platform:entitlements`. Đổi kill switch → invalidate tag đó (hiếm khi dùng,
  chấp nhận render lại toàn bộ). Đổi override của một tenant → invalidate `tenant:<id>` (E6-S03).

## D20. Tài khoản client (khách hàng cuối của site)
Yêu cầu: khách hàng của khách hàng đăng nhập được trên site công khai để dùng giỏ hàng, đặt lịch dịch vụ, nhưng không mở
được CMS, không xem dashboard.
- **Cùng bảng `SiteUser`, vai trò `client`** (D17): một tên đăng nhập là một người trong site. Nhân viên muốn tự đặt lịch thì
  đăng nhập site công khai bằng chính tài khoản của mình, và phiên đó chỉ có quyền `storefront.*`.
- **Đăng nhập ở `apps/web`**, trên tên miền chính của site (`/dang-nhap`, `/dang-ky`, `/quen-mat-khau`, `/tai-khoan/*`). Các
  trang này render động, `noindex`, không có trong sitemap. Cookie `__Host-sid` host-only, phiên `audience: storefront`.
  Đăng nhập CMS bằng tài khoản `client` → từ chối.
- **Định danh**:
  - Tự đăng ký bằng email, xác minh qua link (E11-S05). SĐT nhập lúc đăng ký lưu ở `contactPhone` và **chưa** dùng để đăng nhập.
  - Trường `phone` (định danh đăng nhập, unique theo site) chỉ được đặt khi SĐT đã xác minh: nhân viên site tạo tài khoản
    tại quầy, hoặc OTP SMS/Zalo ZNS (backlog). Nhờ vậy không ai chiếm trước được SĐT của người khác trong site.
- **Không làm hỏng cache công khai**: trang ISR/`"use cache"` không bao giờ đọc cookie. Phần cá nhân hóa (nút tài khoản ở
  header, giỏ đồng bộ, lịch sử) là client island gọi `/api/me` với `Cache-Control: private, no-store`, hoặc nằm trong trang
  động `/tai-khoan/*`. Khách chưa đăng nhập vẫn dùng giỏ báo giá và đặt lịch như cũ (khách vãng lai, nhập SĐT).
- **Gói**: thêm feature `clientAccounts` (tài khoản khách hàng) và `booking` (đặt lịch dịch vụ) vào `packages/plans`.
  Đề xuất: `booking` cho gói Nâng cao trở lên, `clientAccounts` cho gói Cao cấp. Tắt `clientAccounts` → các trang tài khoản
  trả 404, phiên storefront đang mở bị từ chối, dữ liệu vẫn giữ.
- Tài khoản `client` không tính vào giới hạn `users` của gói (giới hạn đó chỉ tính nhân viên). Console chỉ hiện **số lượng**
  client của mỗi site, không hiện danh sách (giảm phạm vi dữ liệu cá nhân theo Nghị định 13/2023).
- **Loại**:
  - Bảng riêng `SiteClient`: một email có thể là hai người trong cùng site, và phải nhân đôi luồng đăng nhập.
  - Đăng nhập client qua `<slug>.admin.<platform>`: đưa khách cuối vào domain quản trị, khác tên miền họ đang mua hàng.

## D21. Tạo site từ console & mức tùy biến theo gói (16/10/2026)
Yêu cầu: super admin tạo site theo một quy trình chuẩn (subdomain → gói → theme → cấu trúc trang → section), gói thấp chỉ
được chọn theme. Site có ngay địa chỉ `<subdomain>.<platform>`, sau đó gắn tên miền thật làm tên miền chính. Mỗi site có sẵn
tài khoản `<subdomain-bỏ-gạch>_admin` với mật khẩu tạm, bắt buộc đổi ở lần đăng nhập đầu.

**1. Mức tùy biến theo gói.** Cùng một hàm kiểm (`validateSiteStructure(config, entitlements)` trong `packages/presets`)
dùng cho wizard ở console, CMS (E7-S04), builder (E12) và API. Super admin không tạo được cấu hình mà khách không được sửa;
cần ngoại lệ thì bật override cho site trước (E15-S05).

| Bước | Cơ bản | Nâng cao | Cao cấp |
|---|---|---|---|
| Subdomain, gói | có | có | có |
| Theme (chọn preset) | nhóm Classic | Classic + Pro | mọi nhóm |
| Cấu trúc trang (`pageStructure`) | cố định = trang của preset, lọc theo gói | chọn trang trong danh mục được phép | như Nâng cao |
| Section từng trang (`sectionReorder`, `variantSwitch`) | cố định theo preset, lọc theo gói | bật/tắt, sắp xếp, đổi variant, thêm section trong gói | như Nâng cao, variant của mọi template |
| Trang landing (`landingPages`, limit `pages`) | — | xem điểm cần chốt (b) | ≤ 19 landing (+ home = 20) |
| Màu/font riêng (`themeOverride`) | — | — | có |

"Lọc theo gói": section/trang có `entitlement` ngoài gói bị bỏ khỏi cấu hình lúc tạo. Khi hạ gói về sau thì giữ lại với cờ
`lockedByPlan` (E6-S04), không xóa.

**2. Danh mục trang** (`packages/presets/pages.ts`). Mỗi loại trang khai báo `slug`, `required`, `entitlement?`, kiểu
(`page` có section / `collection` danh sách + chi tiết / `policy`). Preset khai báo section mặc định cho từng trang nó có.

| Trang | Slug | Bắt buộc | Entitlement |
|---|---|---|---|
| Trang chủ | `/` | có | — |
| Giới thiệu | `/ve-chung-toi` | — | — |
| Dịch vụ / giải pháp | `/giai-phap` (+ chi tiết) | — | — |
| Dự án | `/cong-trinh/[slug]` | — | — |
| Sản phẩm | `/san-pham` (+ chi tiết) | — | `catalog` |
| Tin tức, cẩm nang | `/tin-tuc`, `/cam-nang` | — | `blog` |
| Liên hệ | `/lien-he` | có | — |
| Chính sách | `/chinh-sach/[slug]` | có | — |
| Đặt lịch | `/dat-lich` | — | `booking` (E16) |

Trang không có trong cấu trúc site, hoặc bị khóa theo gói, trả 404 và không vào sitemap. Menu header/footer lúc tạo site
sinh từ cấu trúc đã chọn.

**3. Subdomain.** `Tenant.slug` = subdomain: nhãn DNS `^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$` (3–63 ký tự), không chứa `--` (tránh `xn--`),
không thuộc danh sách dành riêng (D17), unique toàn hệ thống. Wizard kiểm còn trống theo thời gian thực. Tạo site sinh:
- `Domain{hostname: "<slug>.<platform>", isPrimary: true, status: active}` (cert wildcard, E9-S02);
- CMS ở `<slug>.admin.<platform>`.
Khi chưa có tên miền thật, subdomain nền tảng là tên miền chính và **được index** (sửa quy tắc `noindex` của E5-S08: chỉ
host nền tảng không phải chính và host preview mới `noindex`).

**4. Gắn tên miền thật** (E9-S01, E9-S04). Super admin nhập tên miền ở console (vd. `nang-luong-solar.net`). Hệ thống tự thêm
apex + `www`, hướng dẫn DNS, chờ `active` (DNS + TLS đã chạy), rồi mới cho đặt làm chính. Đổi chính → `nang-luong-solar.minwysoft.com`
và host phụ trả 308 về tên miền thật. Không bao giờ đổi chính sang tên miền chưa `active`.

**5. Tài khoản admin tự tạo.** Thêm định danh `username` cho `SiteUser` (`^[a-z0-9_]{3,70}$`, phải có chữ cái để không
lẫn với SĐT). Tạo site → `SiteUser{username: slug.replace(/-/g, "") + "_admin", role: owner, mustChangePassword: true}`,
vd. `nangluongsolar_admin`. Mật khẩu tạm 16 ký tự ngẫu nhiên (`crypto.randomBytes`), chỉ lưu hash, hiện **một lần** trên
màn hình bàn giao của console, hết hạn sau 7 ngày (quá hạn → super admin tạo lại ở E15-S04). Lần đăng nhập đầu: mọi trang
chuyển tới màn hình đổi mật khẩu, kèm gợi ý thêm email để tự khôi phục mật khẩu về sau.

**Điểm đã chốt** (16/10/2026, chủ sản phẩm đồng ý theo đề xuất):
- (a) Trang Sản phẩm cần `catalog` (chỉ Cao cấp). Preset Classic t01 có section `products` nên site Cơ bản từ t01 sẽ mất
  section này. Đề xuất: giữ như hiện tại. Phương án khác: thêm feature `productList` (danh sách đơn giản, không giỏ báo giá)
  cho Cơ bản/Nâng cao.
- (b) Gói Nâng cao có limit `pages: 3` nhưng không có `landingPages`, nên limit này không dùng được. Đề xuất: mở
  `landingPages` cho Nâng cao (home + 2 landing), builder vẫn chỉ Cao cấp.
- **Loại**:
  - Wizard bỏ qua kiểm theo gói: site tạo ra có cấu hình khách không sửa được, và lần lưu đầu sẽ lỗi.
  - Tên đăng nhập admin là email của khách: nhiều khách chưa có email công ty lúc bàn giao.
  - Gửi mật khẩu qua email/Zalo dạng chữ thường: lộ trong hộp thư. Thay bằng hiện một lần + bắt buộc đổi.

