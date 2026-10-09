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
