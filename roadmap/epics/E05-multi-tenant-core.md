# E5 — Lõi multi-tenant: dữ liệu, phân giải tên miền, render, ISR

**Mục tiêu**: một bản deploy `apps/web` phục vụ nhiều khách; tên miền truy cập quyết định tenant; nội dung từ Postgres;
trang được cache tĩnh và làm mới khi khách lưu.
**Target epic**: 2 tenant khác theme/nội dung chạy cùng instance; trang đã cache TTFB p75 ≤ 200 ms; lưu nội dung →
trang mới ≤ 60 s ở mọi instance; 0 rò dữ liệu giữa tenant (bộ test E14-S03).
**Phụ thuộc**: E1, E3-S01…S03 (renderer với fixture). E10-S03 (Redis) **không** chặn epic này: E5-S05 định nghĩa hợp đồng
cache + bản bộ nhớ, E10-S03 cài bản Redis theo hợp đồng đó.

> Lưu ý Next.js: thư mục bắt đầu bằng `_` là *private folder*, không tạo route. Vì vậy route tenant đặt ở
> `app/sites/[siteId]/…` và proxy chặn truy cập trực tiếp `/sites/*` từ bên ngoài.

---

### E5-S01 · Mô hình dữ liệu tenant
**Là** dev, **tôi muốn** schema Postgres cho nền tảng nhiều khách, **để** mọi tính năng sau xây trên một nền thống nhất.
- **Chi tiết** (`packages/db/prisma/schema.prisma`):
  - Nền tảng: `Tenant` (tên, trạng thái `trial|active|suspended`, `planId`, `addons[]`), `User`, `Membership`
    (`role: owner|editor|viewer`), `PlatformAdmin`, `Domain` (`hostname` unique — lưu **chính xác** host, `www` và apex là
    hai bản ghi; `isPrimary`, `status pending|verified|active|error|removed`, `verificationToken`, `verifiedAt`,
    `sslProvider caddy|cloudflare`, `cfHostnameId?`).
  - Site: `Site` (`tenantId`, `themeId`, `themeOverrides JSONB`, `locales[]`, `widgets JSONB`, `seo JSONB`),
    `Page` (`siteId`, `slug`, `kind home|landing|system`, `sections JSONB` = `{id,type,variant,enabled,layout}`[],
    `draftSections JSONB?`, `revision Int`), `PageVersion` (snapshot khi xuất bản), `SectionContent` (`siteId`, `pageId`,
    `sectionId` — UUID sinh mới khi nhân bản trang, `type`, `schemaVersion`, `data JSONB`, `draftData JSONB?`, `revision`).
  - Collection: `Product`, `ProductCategory`, `Project`, `Story` (video), `Post`, `Faq`, `Testimonial`, `Branch`,
    `Certificate`, `Brand`, `PressItem`, `Service` — `tenantId`, `slug` unique theo tenant, `status draft|published`,
    `order`, trường localizable JSONB.
  - Khác: `Media` (`tenantId`, `key`, `driver`, `visibility public|private`, `status quarantine|ready|failed`, `mime`, `size`,
    `width`, `height`, `variants JSONB`, `alt`), `Lead`, `Outbox` (E11-S01), `LeadIntegration` (cấu hình mã hóa),
    `AuditLog`, `Plan` (đồng bộ từ code).
  - **Ràng buộc cùng tenant**: mọi bảng tenant có unique `(tenantId, id)`; khóa ngoại giữa bảng tenant là khóa ghép
    `(tenantId, xxxId) → (tenantId, id)` để bản ghi của A không thể trỏ tới category/media của B. Tham chiếu nằm trong JSONB
    (`mediaRef`, `collectionQuery.ids`) được kiểm khi ghi bằng hàm `assertRefsBelongToTenant`.
  - Prisma 7: `prisma.config.ts`, driver adapter `@prisma/adapter-pg` + `pg`, client sinh vào `packages/db/generated`;
    ngân sách connection pool: web ≤ 10/instance, admin ≤ 5, worker ≤ 5 (tổng < `max_connections` − 20).
  - Tham khảo model của branch `develop` (`CompanyInfo`, `Office`, `Product`, `Project`, `Service`, `News`) để không thiếu trường.
- **Target**: schema hỗ trợ đủ dữ liệu của 15 preset mà không cần bảng riêng theo template.
- **AC**:
  - [ ] Migration đầu tiên chạy trên Postgres 16 sạch; `prisma migrate deploy` + seed chạy được trong image standalone (E10-S01).
  - [ ] Seed `pnpm db:seed` tạo 2 tenant demo (t15, t12) với dữ liệu từ `src/data/*` của t15, **cố ý trùng slug** giữa 2 tenant.
  - [ ] Test: tạo `Product` của A với `categoryId` của B → lỗi khóa ngoại; nested `connect` chéo tenant → lỗi.
  - [ ] ERD xuất ra `packages/db/ERD.md`.
- Agent: Claude (review Codex adversarial) · Cỡ: L

### E5-S02 · Repository bắt buộc tenant
**Là** dev, **tôi muốn** không thể truy vấn dữ liệu nội dung mà quên `tenantId`, **để** loại bỏ cả một lớp lỗi rò dữ liệu.
- **Chi tiết**: `forTenant(tenantId)` trả về `{ projects: { list, get, … }, … }` đã gắn `where: { tenantId }`, và khi ghi tự
  gán `tenantId` + chạy `assertRefsBelongToTenant`; Prisma Client Extension chặn query trên model tenant thiếu `tenantId`
  (ném lỗi ở dev/test). ESLint cấm import client Prisma ngoài `packages/db`.
- **AC**:
  - [ ] Test: `prisma.project.findMany()` không có tenantId trong code ứng dụng → lỗi.
  - [ ] Test: `update`/`delete` theo id của B qua repository A → không ảnh hưởng bản ghi (0 dòng).
  - [ ] Mọi page/route dùng repository.
- Phụ thuộc: S01 · Agent: Codex · Cỡ: M

### E5-S03 · Phân giải tenant theo tên miền (`proxy.ts`)
**Là** khách truy cập `nangluongxanh.vn`, **tôi muốn** thấy đúng site của công ty đó, **để** tên miền riêng hoạt động.
- **Chi tiết**:
  - **Ranh giới tin cậy**: chỉ tin `Host` (Caddy/ALB/Cloudflare ghi đè đúng); bỏ qua `X-Forwarded-Host` từ client trừ khi
    đến từ proxy tin cậy (danh sách IP); proxy luôn **xóa rồi đặt lại** header nội bộ `x-tenant-id`, `x-site-id`.
  - Chuẩn hóa tối thiểu (chữ thường, bỏ cổng, IDN → punycode) nhưng **không bỏ `www.`**: tra đúng hostname trong bảng
    `Domain` qua cache 2 tầng (bộ nhớ 60 s → Redis → DB). Bản ghi không phải chính → 308 về `primaryHost`.
  - Rewrite tới `/sites/[siteId]/[[...path]]`; request ngoài trực tiếp tới `/sites/*` → 404.
  - Domain `removed`/tenant `suspended` → chặn ở tầng HTTP (không phụ thuộc chứng chỉ còn hạn). Chuyển tên miền sang tenant
    khác bắt buộc xác minh lại (token mới).
  - Subdomain nền tảng (`<slug>.minwysoft.com`) cũng là một `Domain`. Host lạ → 404 trang nền tảng.
- **Target**: chi phí phân giải p95 ≤ 5 ms khi trúng cache bộ nhớ.
- **AC**:
  - [ ] Test: 3 host → 3 tenant; host không tồn tại → 404; `www.` không phải chính → 308; `/sites/x` từ ngoài → 404.
  - [ ] Test giả mạo: gửi `x-tenant-id`, `X-Forwarded-Host` của tenant B qua Caddy tới host A → vẫn ra A.
  - [ ] Đổi tên miền chính / gỡ tên miền → cache phân giải bị xóa qua Redis pub/sub ≤ 5 s (TTL 60 s là chặn trên khi pub/sub lỡ).
- Phụ thuộc: S01 · Agent: Claude · Cỡ: M

### E5-S04 · Render site từ DB
**Là** tenant, **tôi muốn** site hiển thị nội dung tôi nhập trong CMS với theme tôi chọn, **để** không cần dev.
- **Chi tiết**: `app/sites/[siteId]/layout.tsx` nạp `Site` → `themeToCss` + font + widget + header/footer;
  `[[...path]]/page.tsx` ánh xạ path → `Page` (home, landing) hoặc trang hệ thống (danh sách/chi tiết collection —
  slug tiếng Việt như t15: `/san-pham`, `/cong-trinh/[slug]`, `/giai-phap`, `/tin-tuc`, `/cam-nang`, `/chinh-sach/[slug]`,
  `/ve-chung-toi`, `/lien-he`). Dữ liệu section đọc qua repository, kiểm schema (parse lỗi → dùng defaults + log).
- **AC**:
  - [ ] Hai tenant seed hiển thị khác theme, khác nội dung trên cùng instance, kể cả ở slug trùng nhau.
  - [ ] Mọi trang của t15 có bản tương đương dưới `sites`.
  - [ ] `generateMetadata` theo tenant (title, description, OG image, canonical = primaryHost).
- Phụ thuộc: S02, S03, E3-S03 · Agent: Claude · Cỡ: L

### E5-S05 · Hợp đồng cache, tag & revalidate khi lưu
**Là** tenant, **tôi muốn** bấm "Lưu & xuất bản" là site cập nhật trong một phút, **để** tự chủ nội dung.
- **Chi tiết**:
  - `packages/cache` định nghĩa hợp đồng: `cached(fn, { keyParts, tags })` + `invalidate(tags)`; bản cài bộ nhớ ở story này,
    bản Redis ở E10-S03.
  - **Khóa cache** (không chỉ tag) luôn gồm `siteId`, `locale`, `mode published|draft` và tham số nghiệp vụ → hai tenant cùng
    slug không bao giờ đụng khóa. Draft không bao giờ đi vào cache công khai.
  - **Tag**: `tenant:<id>`, `tenant:<id>:site`, `tenant:<id>:page:<slug>`, `tenant:<id>:collection:<name>`.
  - **Ngữ nghĩa**: admin xuất bản → ghi DB + bản ghi `Outbox{type:"invalidate", tags}` trong **cùng transaction** → worker gọi
    `POST web/api/revalidate` (HMAC, idempotency key) → web gọi `revalidateTag(tag, { expire: 0 })` (hết hạn ngay, request
    kế tiếp render mới — không dùng profile `"max"` vốn cho phép trả bản cũ). Thất bại → retry tới khi thành công, cảnh báo sau 5 phút.
  - Trang render theo yêu cầu (on-demand ISR), thời hạn dự phòng 24 h.
- **Target**: p95 thời gian từ "Lưu" đến HTML mới ≤ 60 s; chỉ trang liên quan bị làm mới.
- **AC**:
  - [ ] Test e2e: sửa tiêu đề hero ở admin → `curl` trang chủ thấy tiêu đề mới ≤ 60 s; trang `/lien-he` không bị render lại.
  - [ ] Test: hai tenant cùng slug, gọi xen kẽ A/B/A/B trên cùng instance → mỗi host luôn đúng dữ liệu của mình.
  - [ ] Tag của A không làm mới trang của B.
  - [ ] Tắt web lúc xuất bản → khi web lên lại, outbox vẫn revalidate (không mất lệnh).
  - [ ] Endpoint revalidate từ chối chữ ký sai/nonce dùng lại, có rate-limit.
- Phụ thuộc: S04, E11-S01 (bảng Outbox + worker; có thể làm trước phần outbox ở story này) · Agent: Claude · Cỡ: M

### E5-S06 · Bật Cache Components (Next 16)
**Là** dev, **tôi muốn** dùng `"use cache"` + `cacheTag`, **để** cache theo dữ liệu thay vì theo route, phần động (giỏ, form) stream riêng.
- **Chi tiết**: theo skill `next-cache-components-adoption`; layout tenant và section tĩnh dùng `"use cache"` +
  `cacheLife` + tag; đối số của hàm cache luôn có `siteId`, `locale` (đúng khóa ở S05); phần phụ thuộc request (draft mode,
  giỏ) nằm trong `<Suspense>`. Chính sách CSP phải tương thích render tĩnh (E14-S04 — không dùng nonce theo request).
- **AC**: [ ] `next build` không còn route "blocking" ngoài danh sách đã duyệt · [ ] TTFB không kém S05 · [ ] Test cùng slug ở S05 vẫn qua.
- Phụ thuộc: S05, E1-S03 · Agent: Codex (review Claude) · Cỡ: M

### E5-S07 · Draft, preview & xuất bản nhất quán
**Là** tenant, **tôi muốn** xem trước thay đổi trước khi xuất bản, **để** không làm hỏng site đang chạy.
- **Chi tiết**:
  - Preview **luôn chạy trên subdomain nền tảng** `<slug>.preview.<platform>` (cùng site với `admin.<platform>`), không chạy
    trên tên miền khách → cookie Draft Mode `SameSite=Lax` hoạt động trong iframe admin, không phụ thuộc cookie bên thứ ba.
  - Vào preview qua `/api/preview?token=` (token ký, gắn `siteId`, hết hạn 10 phút, dùng 1 lần, sai host → từ chối).
  - Xuất bản = 1 transaction: kiểm `revision` (khóa lạc quan), chép `draftSections` + mọi `draftData` của trang → bản chính,
    tạo `PageVersion`, ghi Outbox invalidate. Hai người sửa cùng lúc → người lưu sau nhận cảnh báo xung đột (không ghi đè ngầm).
- **AC**:
  - [ ] Iframe preview hoạt động trên Chrome, Safari, Firefox mới nhất (có test Playwright WebKit).
  - [ ] Token hết hạn / dùng lại / sai host → 401.
  - [ ] Không bao giờ có trạng thái "bố cục mới + nội dung cũ" (test xuất bản xen kẽ hai tab).
- Phụ thuộc: S05 · Agent: Claude · Cỡ: M

### E5-S08 · SEO theo tenant
**Là** tenant, **tôi muốn** sitemap, robots, JSON-LD, canonical đúng tên miền của tôi, **để** lên Google.
- **Chi tiết**: `sitemap.ts`, `robots.ts` theo host; JSON-LD `Organization`/`LocalBusiness` từ thông tin công ty + chi nhánh,
  `Product`, `FAQPage`, `BreadcrumbList`; redirect 308 slug cũ (danh sách trong t15 `next.config.ts`) cấu hình được theo tenant.
  Subdomain nền tảng và subdomain preview → `noindex`; canonical về tên miền chính.
- **AC**: [ ] Sitemap tenant A không chứa URL tenant B · [ ] Rich Results Test qua cho trang chủ và trang sản phẩm.
- Phụ thuộc: S04 · Agent: Codex · Cỡ: M

### E5-S09 · Row-Level Security (lớp bảo vệ thứ hai)
**Là** chủ dự án, **tôi muốn** Postgres tự chặn đọc/ghi chéo tenant, **để** an toàn cả khi code có lỗi.
- **Chi tiết**:
  - Role tách biệt: `app_owner` (sở hữu bảng, chạy migration), `app_runtime` (web/admin/worker — không sở hữu bảng, không
    `BYPASSRLS`), `app_platform` (tác vụ nền tảng có kiểm soát). Bật `ENABLE` **và** `FORCE ROW LEVEL SECURITY` trên mọi bảng tenant.
  - Policy `USING` và `WITH CHECK`: `tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid` — thiếu setting
    trả `NULL` → 0 dòng, không ném lỗi.
  - Repository mở transaction và `SET LOCAL app.tenant_id` (chỉ sống trong transaction → connection trả về pool không mang
    tenant cũ). Không dùng `SET` phiên.
- **AC**:
  - [ ] Với role `app_runtime`: SELECT/INSERT/UPDATE/DELETE chéo tenant đều bị chặn; không đặt `app.tenant_id` → 0 dòng.
  - [ ] Test pool: transaction tenant A commit/rollback, rồi truy vấn không đặt tenant trên cùng connection → 0 dòng.
  - [ ] Overhead ≤ 10% thời gian truy vấn.
- Phụ thuộc: S02 · Agent: Codex (review Claude adversarial) · Cỡ: M
