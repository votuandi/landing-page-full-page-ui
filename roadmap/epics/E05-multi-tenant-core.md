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

### E5-S01 · Mô hình dữ liệu tenant ✅ · PR [#31](https://github.com/votuandi/landing-page-full-page-ui/pull/31)
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
    - Postgres 16 sạch: deploy + seed hai lần đã qua; bộ test DB qua 32/32, không skip. Phần image standalone kiểm ở E10-S01.
  - [x] Seed `pnpm db:seed` tạo 2 tenant demo (t15, t12) với dữ liệu từ `src/data/*` của t15, **cố ý trùng slug** giữa 2 tenant.
  - [x] Test: tạo `Product` của A với `categoryId` của B → lỗi khóa ngoại; nested `connect` chéo tenant → lỗi.
  - [x] ERD xuất ra `packages/db/ERD.md`.
  - Bằng chứng: `packages/db/src/__tests__/{tenant.int,tenantGuard,seed.int,erd,schema}.test.ts`; typecheck/lint/test package qua.
    PR/review: chờ Claude tạo PR và review theo routing.
- Agent: Claude (review Codex adversarial) · Cỡ: L

### E5-S02 · Repository bắt buộc tenant ✅ · PR [#32](https://github.com/votuandi/landing-page-full-page-ui/pull/32)
**Là** dev, **tôi muốn** không thể truy vấn dữ liệu nội dung mà quên `tenantId`, **để** loại bỏ cả một lớp lỗi rò dữ liệu.
- **Chi tiết**: `forTenant(tenantId)` trả về `{ projects: { list, get, … }, … }` đã gắn `where: { tenantId }`, và khi ghi tự
  gán `tenantId` + chạy `assertRefsBelongToTenant`; Prisma Client Extension chặn query trên model tenant thiếu `tenantId`
  (ném lỗi ở dev/test). ESLint cấm import client Prisma ngoài `packages/db`.
- **AC**:
  - [x] Test: `prisma.project.findMany()` không có tenantId trong code ứng dụng → lỗi.
  - [x] Test: `update`/`delete` theo id của B qua repository A → không ảnh hưởng bản ghi (0 dòng).
  - [x] Mọi page/route dùng repository.
  - Bằng chứng E5-S02: `tenantScope.test.ts`, `repository.int.test.ts` chạy trên PostgreSQL 16.13;
    `prismaBoundary.test.ts` kiểm ESLint cấm Prisma/pg/generated ngoài `packages/db`. `apps/*` chưa đọc DB
    (đang dùng fixture, chuyển ở S04), không có import Prisma/`createDb`; ranh giới repository đã sẵn sàng.
    Typecheck/lint/test toàn workspace và lint token qua; PR/review chờ Claude.
- Phụ thuộc: S01 · Agent: Codex · Cỡ: M

### E5-S03 · Phân giải tenant theo tên miền (`proxy.ts`) ✅ · PR [#33](https://github.com/votuandi/landing-page-full-page-ui/pull/33)
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
  - [x] Test: 3 host → 3 tenant; host không tồn tại → 404; `www.` không phải chính → 308; `/sites/x` từ ngoài → 404.
  - [ ] Test giả mạo: gửi `x-tenant-id`, `X-Forwarded-Host` của tenant B qua Caddy tới host A → vẫn ra A.
    - Proxy unit + curl HTTP thật đã kiểm header giả mạo ra A; phần qua Caddy kiểm lại ở E10 khi có `infra/caddy`, theo plan E5-S03.
  - [x] Đổi tên miền chính / gỡ tên miền → cache phân giải bị xóa qua Redis pub/sub ≤ 5 s (TTL 60 s là chặn trên khi pub/sub lỡ).
  - Bằng chứng E5-S03: `apps/web/src/lib/tenant/__tests__/*`, `packages/db/src/__tests__/domainResolve.int.test.ts`;
    PostgreSQL 16, Redis 7.4.11 thật; pub/sub đổi primary/gỡ host, reconnect và cold-start invalidation đều qua.
    Curl ba host + 308/404/403 + giả mạo qua; khóa tenant → Redis invalidate → HTTP 403 trong 107 ms.
    Bản production sau một lần build cũng qua toàn bộ curl (308 HTTPS; khóa tenant → 403 trong 58 ms).
    TTL tổng snapshot DB ≤ 60 s cả qua Redis; p95 10.000 lần trúng bộ nhớ < 0,01 ms.
    PR [#33](https://github.com/votuandi/landing-page-full-page-ui/pull/33): review vòng 1 yêu cầu sửa CI build Prisma
    và bổ sung test nhánh lỗi/redirect; bằng chứng sửa và kiểm tra tại `.agent-runs/E5-S03/fix-r1-report.md`.
    Chờ review lại và CI; merge sau PR E5-S02 #32.
- Phụ thuộc: S01 · Agent: Claude · Cỡ: M

### E5-S04 · Render site từ DB ✅ · PR [#36](https://github.com/votuandi/landing-page-full-page-ui/pull/36)
**Là** tenant, **tôi muốn** site hiển thị nội dung tôi nhập trong CMS với theme tôi chọn, **để** không cần dev.
- **Chi tiết**: `app/sites/[siteId]/layout.tsx` nạp `Site` → `themeToCss` + font + widget + header/footer;
  `[[...path]]/page.tsx` ánh xạ path → `Page` (home, landing) hoặc trang hệ thống (danh sách/chi tiết collection —
  slug tiếng Việt như t15: `/san-pham`, `/cong-trinh/[slug]`, `/giai-phap`, `/tin-tuc`, `/cam-nang`, `/chinh-sach/[slug]`,
  `/ve-chung-toi`, `/lien-he`). Dữ liệu section đọc qua repository, kiểm schema (parse lỗi → dùng defaults + log).
- **AC**:
  - [x] Hai tenant seed hiển thị khác theme, khác nội dung trên cùng instance, kể cả ở slug trùng nhau.
  - [x] Mọi trang của t15 có bản tương đương dưới `sites`.
  - [x] `generateMetadata` theo tenant (title, description, OG image, canonical = primaryHost).
  - Bằng chứng E5-S04: `apps/web/src/lib/tenant/__tests__/*`, seed hai lần trên PostgreSQL 16;
    `tooling/visual/tenant.spec.ts` qua 5/5: A/B/A/B, ma trận mọi route seed, filter/quick-view/giỏ,
    anchor, JS off, metadata và header giả mạo; primary alias 308 qua HTTP. Báo cáo/bằng chứng:
    `.agent-runs/E5-S04/codex-report.md`. Web tạm dùng Webpack vì Turbopack xuất manifest preload chunk thiếu;
    production hai host và legacy/lab qua browser với 0 lỗi. PR và review Claude chờ sau commit.
  - Sửa review r1 trên [PR #36](https://github.com/votuandi/landing-page-full-page-ui/pull/36): adapter/giỏ/nội dung/VI-EN,
    isolation và fallback đã có regression tests; browser 9/9, DB 101/101, tenant 43/43 (0 skip), visual/lab 64/64
    với baseline đúng merge-base. Chi tiết và commit đề xuất: `.agent-runs/E5-S04/fix-r1-report.md`; review r2/CI sau commit.
  - Sửa review r2: nhãn filter/giá EN, chặn control catalog trước hydration; tách route theo tenant/collection,
    thêm metadata fallback qua dispatcher và keyboard/overflow 390/1440. Matrix probe đủ 30 type trên t15 ở bốn
    project: 129/129, so 344 ô với exact base; shard cân tải 57/57 trong 2,9 phút. Full matrix 15 theme và CI/review
    sau commit vẫn cần xác nhận; báo cáo `.agent-runs/E5-S04/fix-r2-report.md` ghi phạm vi kiểm chứng cụ thể.
  - Sửa review r3: nối locale giá qua section/quick-view/widget giỏ và giá ngắn packages; thêm case đổi VI→EN/reload.
    Hai diff CI của variant t10 được khoanh vùng vào widget shell ngoài ô; harness loại nguồn nhiễu và từ chối cache
    ảnh theo cơ chế cũ. Base→base và base→HEAD cho đúng hai ô qua 10/10 mỗi lượt; bằng chứng, giới hạn và kiểm tra
    cuối trong `.agent-runs/E5-S04/fix-r3-report.md`. CI/review sau commit và nhánh phát hành baseline base còn chờ.
- Phụ thuộc: S02, S03, E3-S03 · Agent: Claude · Cỡ: L

### E5-S05 · Hợp đồng cache, tag & revalidate khi lưu ✅ · PR [#41](https://github.com/votuandi/landing-page-full-page-ui/pull/41)
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
  - [x] Test e2e: sửa tiêu đề hero ở admin → `curl` trang chủ thấy tiêu đề mới ≤ 60 s; trang `/lien-he` không bị render lại.
  - [x] Test: hai tenant cùng slug, gọi xen kẽ A/B/A/B trên cùng instance → mỗi host luôn đúng dữ liệu của mình.
  - [x] Tag của A không làm mới trang của B.
  - [x] Tắt web lúc xuất bản → khi web lên lại, outbox vẫn revalidate (không mất lệnh).
  - [x] Endpoint revalidate từ chối chữ ký sai/nonce dùng lại, có rate-limit.
- Bằng chứng E5-S05: `packages/cache/src/__tests__/cache.test.ts` (tenant A/B, draft, TTL/LRU, single-flight,
  render chậm, HMAC), web `revalidate.test.ts` (401/400/409/429/503, body limit, nonce), worker `invalidate.test.ts`
  (web lỗi hai lần rồi thành công, nonce mới, retry Infinity). Typecheck/lint/unit test cache/db/web/worker qua;
  web lint 0 error, 52 warning. Test tích hợp `revalidate.int.test.ts` đã viết, skip vì thiếu
  `DATABASE_URL` + `PLATFORM_DATABASE_URL`: PASS ở lượt test cuối chuỗi (PostgreSQL 16 cục bộ, 15/10/2026).
  E2E runtime thật (`next start` MULTI_TENANT + `apps/worker`): ghi hero t15 + outbox trong 1 transaction → `curl` trang chủ
  thấy tiêu đề mới sau 261 ms, job `invalidate` `done` lần 1; đối chứng: sửa DB không invalidate → vẫn bản cache; t12 không đổi.
  Tắt web lúc xuất bản → job `pending` (retry), bật web lại → `done` ở lần 3, trang hiện bản mới. Bước "sửa ở admin" giả lập
  bằng script ghi DB (admin E7 chưa có). Test Redis nonce chỉ chạy trên CI.
- PR: #41 (gộp E11-S01, E5-S05, E6-S03, E6-S05).
- Phụ thuộc: S04, E11-S01 (bảng Outbox + worker; có thể làm trước phần outbox ở story này) · Agent: Claude · Cỡ: M

### E5-S06 · Bật Cache Components (Next 16)
**Là** dev, **tôi muốn** dùng `"use cache"` + `cacheTag`, **để** cache theo dữ liệu thay vì theo route, phần động (giỏ, form) stream riêng.
- **Chi tiết**: theo skill `next-cache-components-adoption`; layout tenant và section tĩnh dùng `"use cache"` +
  `cacheLife` + tag; đối số của hàm cache luôn có `siteId`, `locale` (đúng khóa ở S05); phần phụ thuộc request (draft mode,
  giỏ) nằm trong `<Suspense>`. Chính sách CSP phải tương thích render tĩnh (E14-S04 — không dùng nonce theo request).
  Trang tenant gắn thêm `PAGE_TAGS` (`platform:entitlements`, export ở `apps/web/src/lib/tenant/entitlements.ts`, E6-S02/D19).
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
  - [x] Iframe preview hoạt động trên Chrome, Safari, Firefox mới nhất (có test Playwright WebKit) — CI job `db`
        run [38890672533](https://github.com/votuandi/landing-page-full-page-ui/actions/runs/38890672533): `playwright.preview.config.ts` chromium/webkit/firefox xanh.
  - [x] Token hết hạn / dùng lại / sai host → 401.
  - [x] Không bao giờ có trạng thái "bố cục mới + nội dung cũ" (test xuất bản xen kẽ hai tab).
  - Bằng chứng E5-S07: `packages/db/src/__tests__/{publish.int,preview.int}.test.ts` trên Postgres thật
    (revision CAS, rollback, snapshot + Outbox, token hash/expiry/replay/tenant); web `publishSnapshot.int.test.ts`
    xen 20 lần publish vào giữa hai lượt đọc layout/content, tất cả khớp snapshot RepeatableRead.
    PR [#42](https://github.com/votuandi/landing-page-full-page-ui/pull/42), fix r2: preview local Chromium 2/2 và
    WebKit Windows 2/2 (iframe nháp, reload, public giữ bản chính, token sai/đã dùng/hết hạn, cookie chéo tenant).
    Path xấu trả 400 mà không đốt token; cùng token với `/` trả 307, dùng lại trả 401.
    Preview/admin e2e dùng `E2E_PLATFORM_DOMAIN=solar.example.com`: hậu tố PSL `com` tránh libsoup coi hai host
    `*.solar.localhost` là third-party. Cookie ứng dụng vẫn Lax. WebKit local dùng proxy DNS giữ nguyên Host/cookie;
    CI ánh xạ `/etc/hosts`. Firefox local không tạo được tab do sandbox Windows; AC đa trình duyệt chờ CI Linux.
    `next dev` ghi đè Cache-Control HTML, proxy/entry có kiểm no-store. Chờ Claude review/CI cuối PR gộp.
- Phụ thuộc: S05 · Agent: Claude · Cỡ: M

### E5-S08 · SEO theo tenant ✅ · PR [#37](https://github.com/votuandi/landing-page-full-page-ui/pull/37)
**Là** tenant, **tôi muốn** sitemap, robots, JSON-LD, canonical đúng tên miền của tôi, **để** lên Google.
- **Chi tiết**: `sitemap.ts`, `robots.ts` theo host; JSON-LD `Organization`/`LocalBusiness` từ thông tin công ty + chi nhánh,
  `Product`, `FAQPage`, `BreadcrumbList`; redirect 308 slug cũ (danh sách trong t15 `next.config.ts`) cấu hình được theo tenant.
  Subdomain nền tảng và subdomain preview → `noindex`; canonical về tên miền chính.
- **AC**: [x] Sitemap tenant A không chứa URL tenant B · [ ] Rich Results Test qua cho trang chủ và trang sản phẩm
  (`[ngoài agent]`: JSON-LD đã có test trường bắt buộc + e2e; chạy Google Rich Results Test thật sau khi deploy tên miền công khai). PR #37.
- Phụ thuộc: S04 · Agent: Codex · Cỡ: M

### E5-S09 · Row-Level Security (lớp bảo vệ thứ hai) ✅ · PR [#39](https://github.com/votuandi/landing-page-full-page-ui/pull/39)
**Là** chủ dự án, **tôi muốn** Postgres tự chặn đọc/ghi chéo tenant, **để** an toàn cả khi code có lỗi.
- **Chi tiết**:
  - Role tách biệt: `app_owner` (sở hữu bảng, chạy migration), `app_runtime` (web/admin/worker — không sở hữu bảng, không
    `BYPASSRLS`), `app_platform` (tác vụ nền tảng có kiểm soát). Bật `ENABLE` **và** `FORCE ROW LEVEL SECURITY` trên mọi bảng tenant.
  - Policy `USING` và `WITH CHECK`: `tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid` — thiếu setting
    trả `NULL` → 0 dòng, không ném lỗi.
  - Repository mở transaction và `SET LOCAL app.tenant_id` (chỉ sống trong transaction → connection trả về pool không mang
    tenant cũ). Không dùng `SET` phiên.
  - Bảng tài khoản (D17, sau S10): `SiteUser`, `SiteSession` là bảng tenant, có policy như trên. `admin` đăng nhập bằng
    cách lấy tenant từ host, `SET LOCAL app.tenant_id`, rồi mới tìm `SiteUser`.
  - Bảng nền tảng (`PlatformAdmin`, `PlatformSession`, `GhostGrant`, `PlatformSetting`, `Customer`): `REVOKE` toàn bộ quyền của
    `app_runtime`. Chỉ `app_platform` (dùng bởi `apps/console` và worker) được truy cập, và chỉ qua `forPlatform()` (S10).
    Riêng việc đổi ghost token lấy phiên ở `admin` gọi hàm `SECURITY DEFINER` `redeem_ghost_grant(token, tenant_id)`,
    không cấp quyền đọc bảng.
- **AC**:
  - [x] Với role `app_runtime`: SELECT/INSERT/UPDATE/DELETE chéo tenant đều bị chặn; không đặt `app.tenant_id` → 0 dòng.
  - [x] Test pool: transaction tenant A commit/rollback, rồi truy vấn không đặt tenant trên cùng connection → 0 dòng.
  - [x] Median execution time mỗi workload tăng ≤ 10% HOẶC ≤ 0,02 ms tuyệt đối.
  - [x] Role `app_runtime` đọc `PlatformAdmin`/`PlatformSession` → lỗi quyền; đọc `SiteUser` của tenant B khi đã đặt tenant A → 0 dòng.
- Bằng chứng triển khai E5-S09: Postgres 16.15 local, credential app_runtime thật; `rls.int.test.ts` kiểm CRUD thiếu
  filter, context thiếu/rỗng, PID pool commit/rollback/SQL abort, FORCE 26 bảng, platform ACL và ghost bridge.
  `tenantTransaction.test.ts` kiểm rollback nội dung/outbox/audit, reference trong cùng tx, A/B đồng thời, credential sai,
  pool một connection, client registry qua reload và ghost race/session failure. DB 117/117, 0 skip;
  `pnpm turbo run typecheck lint test` 34/34; upgrade ba migration cũ giữ 57 section và checksum.
  AC overhead đạt theo tiêu chí chủ dự án chốt 15/10/2026: EXPLAIN ANALYZE median get +45,45% (+0,005 ms),
  login +41,67% (+0,005 ms), list +8,75% (+0,026 ms), join +10,00% (+0,036 ms); benchmark exit 0.
  Lượt cập nhật gate: DB 117/117, 0 skip; typecheck/lint PASS. Claude adversarial review/PR chờ sau bàn giao.
  Chi tiết `.agent-runs/E5-S09/codex-report.md` (`bench-overhead-or.log`, `benchmark-overhead-or.json`).
- Phụ thuộc: S02, S10 · Agent: Codex (review Claude adversarial) · Cỡ: M

### E5-S10 · Tài khoản theo tenant & tách tài khoản nền tảng (nâng cấp S01/S02) ✅ · PR [#38](https://github.com/votuandi/landing-page-full-page-ui/pull/38)
**Là** chủ dự án, **tôi muốn** tài khoản CMS của site và tài khoản super admin là hai loại riêng, tên đăng nhập chỉ unique trong
một site, **để** làm được hai CMS (E7, E15) mà không phải sửa lại mô hình dữ liệu sau này.
Story nâng cấp phần đã làm ở S01/S02 theo D17–D19. Chưa có dữ liệu production (seed không tạo user), nên không cần
chuyển dữ liệu: thêm migration mới, không sửa migration `init`.
- **Chi tiết** (`packages/db`):
  - Bỏ `User`, `Membership`, `MembershipRole`. Thêm `SiteUser` (`tenantId`, `email?`, `phone?`, `name`, `passwordHash?` —
    `null` khi chưa nhận lời mời, `role SiteRole owner|admin|editor|staff|viewer|client` (D20), `status
    invited|unverified|active|locked|disabled`, `source invite|signup|console`, `emailVerifiedAt?`, `contactPhone?`
    (SĐT chưa xác minh, không dùng đăng nhập), `username?` (D21), `mustChangePassword`, `tempPasswordExpiresAt?`,
    `totpSecret?`, `lastLoginAt?`, `failedLogins`, `lockedUntil?`).
    Unique `(tenantId, email)`, `(tenantId, phone)`, `(tenantId, username)`, CHECK có ít nhất một trong
    `email`/`phone`/`username`; CHECK `username ~ '^[a-z0-9_]{3,70}$'` và chứa chữ cái. Email lưu dạng chữ
    thường đã trim, SĐT lưu dạng `0…` của `normalizeVnPhone` (`packages/core`).
  - `SiteSession` (`tenantId`, `siteUserId?`, `kind user|ghost`, `audience admin|storefront` (D17), `ghostGrantId?`,
    `tokenHash` unique, `expiresAt`, `lastSeenAt`, `ip`, `userAgent`) và `SiteToken` (`tenantId`, `siteUserId`,
    `purpose invite|verify_email|reset_password|magic_link`, `tokenHash`, `expiresAt`, `usedAt?`).
    CHECK: `kind = ghost` thì `audience = admin`.
  - `PlatformAdmin` thành bảng độc lập: `email` unique, `name`, `passwordHash`, `totpSecret`, `status`, `lastLoginAt`.
    Thêm `PlatformSession`, `GhostGrant` (D18), `PlatformSetting` (`key` PK, `value JSONB`, `updatedById`), `Customer`
    (`name`, `taxCode?`, `contactName`, `contactEmail?`, `contactPhone?`, `address?`, `note?`, `status`).
  - `Tenant`: thêm `customerId?`, `featureOverrides JSONB {}`, `limitOverrides JSONB {}`, `permissionPolicy JSONB {}`
    (schema zod trong `packages/plans`, D19). `Site.tenantId` thêm unique (1 tenant = 1 site, D17).
  - Người thực hiện: `AuditLog` đổi `actorUserId` → `actorType site_user|platform_admin|system`, `actorId?`, `ghostGrantId?`.
    `PageVersion.publishedBy` → `publishedBySiteUserId?` (khóa ghép cùng tenant) + `publishedByPlatformAdminId?` (khi ghost).
  - Slug dành riêng + định dạng subdomain (D21 §3): `RESERVED_TENANT_SLUGS` + `assertTenantSlug()` trong `packages/core`,
    và hàm `adminUsernameFor(slug)` (`nang-luong-solar` → `nangluongsolar_admin`). Tạo/đổi tenant gọi `assertTenantSlug`;
    thêm test để slug trong seed không trùng danh sách.
  - Repository: `forTenant(id).siteUser` / `.siteSession` / `.siteToken` (client omit `passwordHash`, `totpSecret` mặc định;
    E7-S12/E16-S04 tự lọc nhân viên/client theo `role`). `forPlatform()` thêm delegate cho bảng nền tảng; truy vấn tổng hợp
    chéo tenant ở E15-S08, ghi `AuditLog` bắt buộc kèm actor ở E15-S02. Cập nhật `tenantScope`, `tenantGuard`.
  - Seed: mỗi tenant demo có `owner@demo.vn` **cùng email** + `0901234567` cùng SĐT, mật khẩu khác nhau. Thêm một
    `PlatformAdmin` cũng dùng `owner@demo.vn` để chứng minh hai realm tách nhau. Tenant A có thêm client `khach@demo.vn`;
    tenant B có nhân viên `khach@demo.vn` (cùng email, khác vai trò). Mật khẩu seed đọc từ biến môi trường,
    không ghi cứng.
  - Cập nhật `ERD.md`, `packages/db/README.md`.
- **Target**: 0 bảng hoặc khóa ngoại nối `SiteUser` với `PlatformAdmin`; mọi bảng tenant mới đi qua `tenantGuard`.
- **AC**:
  - [x] Test: hai tenant cùng tạo `SiteUser` email `a@x.vn` → thành công; cùng tenant tạo trùng email hoặc trùng SĐT
        (kể cả khác cách viết `090…`/`+8490…`, khác hoa thường) → lỗi unique.
  - [x] Test: `assertTenantSlug` từ chối `-abc`, `abc-`, `a`, `xn--abc`, `Nang_Luong`, slug dành riêng; nhận `nang-luong-solar`.
  - [x] Test: tạo `SiteUser` không email, không SĐT, không username → lỗi CHECK; tạo `SiteSession` `kind: ghost` với `audience: storefront` → lỗi CHECK.
  - [x] Test: `forTenant(A).siteUsers.get(idCủaB)` → `null`; `SiteSession` của A không trỏ được tới `SiteUser` của B (khóa ghép).
  - [x] Test: tạo tenant slug `admin`/`console`/`preview` → lỗi; tạo `Site` thứ hai cho cùng tenant → lỗi unique.
  - [x] Migration mới chạy trên DB đã có `init` + seed cũ; `prisma migrate deploy` + seed chạy 2 lần liên tiếp vẫn qua.
  - [x] Typecheck/lint/test toàn workspace qua; `apps/web` không đổi hành vi (`tooling/visual/tenant.spec.ts` vẫn qua).
  - Bằng chứng E5-S10 (Postgres 16.10 portable, Docker không chạy được trên máy vì hypervisor tắt):
    `packages/db/src/__tests__/accounts.int.test.ts` (unique theo tenant, CHECK định danh/ghost, chéo tenant, omit secret,
    slug dành riêng, Site thứ hai), `schema.test.ts` (CHECK khớp `RESERVED_TENANT_SLUGS`), `packages/core` `tenantSlug.test.ts`;
    `@solar/db` 113/113 không skip (thêm: đọc lồng qua customer/plan/ghostGrant bị chặn, grant chỉ mở phiên ở tenant đích,
    FK ghép token/PageVersion khi tạo và cập nhật, mọi tổ hợp CHECK phiên, mật khẩu đúng theo realm, seed thiếu
    `SEED_PASSWORD`). Nâng cấp thật: DB dựng bằng code base (`init` + seed cũ) → deploy hai migration mới: số bản ghi và md5
    dữ liệu section giữ nguyên, `pageTypes` backfill đủ 9 loại, schema khớp DB, seed ×2 (`.agent-runs/E5-S10/upgrade.log`). `pnpm turbo run typecheck lint test build` 35/35
    (`.agent-runs/E5-S11/checks2.log`); `tooling/visual/tenant.spec.ts` 27/28, test còn lại lỗi DNS `*.localhost` của Node trên
    Windows (robots/sitemap kiểm lại bằng curl `Host:`), CI Linux chạy đủ. Fixture trình duyệt dùng tenant `review-t15` riêng.
- Phụ thuộc: S01, S02 · Agent: Codex (review Claude adversarial) · Cỡ: M

### E5-S11 · Cấu trúc trang theo danh mục & preset nhiều trang (nâng cấp E4/E5-S04/E5-S08) ✅ · PR [#38](https://github.com/votuandi/landing-page-full-page-ui/pull/38)
**Là** chủ dự án, **tôi muốn** cấu trúc trang của site (có những trang nào) là dữ liệu được kiểm theo gói, **để** wizard
tạo site (E13) và CMS (E7) chọn trang/section theo cùng một chính sách (D21).
Story nâng cấp phần đã làm: preset hiện chỉ có section của trang chủ + `subpages`, seed dựng trang con bằng danh sách cứng
(`seed-data.ts`), route `san-pham`/`giai-phap`/`tin-tuc` luôn mở với mọi site, subdomain nền tảng luôn `noindex`.
- **Chi tiết**:
  - `packages/presets/pages.ts`: danh mục trang theo D21 §2 (`slug`, `required`, `entitlement?`, kiểu, collection liên quan).
  - Schema preset: giữ `sections` (trang chủ) và `subpages` (route demo `/lab`), thêm `pages?: PageTypeId[]` (thiếu = mọi
    loại trang, trang bắt buộc luôn có); section của trang hệ thống lấy từ `sections` mặc định trong danh mục. Không phải
    sửa 15 file preset; test schema của E4 vẫn qua.
  - `validateSiteStructure(config, entitlements)` + `applyPlanToPreset(preset, entitlements)` (lọc trang/section ngoài gói,
    D21 §1). Feature mới `pageStructure` (Nâng cao, Cao cấp) trong `packages/plans`; chạy lại `pnpm plans:table`.
    Áp dụng quyết định (a)/(b) của D21 nếu đã chốt.
  - `Site.pageTypes String[]` (site cũ được đặt đủ mọi loại trang trong migration để không đổi hành vi).
    `resolveRoute` của `apps/web` chỉ mở route của trang có trong cấu trúc và không bị khóa theo gói; còn lại 404.
    Sitemap theo cùng điều kiện.
  - `isNoindexHost` đọc `NOINDEX_DOMAINS` (chỉ hậu tố preview, thay `PLATFORM_DOMAINS`): subdomain nền tảng đang là tên
    miền chính → được index; host nền tảng không phải chính → 308 (đã có); `*.preview.<platform>` → luôn `noindex`.
  - Seed dùng `applyPlanToPreset` + `PAGE_TYPES` thay danh sách trang cứng; t12 (gói Nâng cao) có addon `catalog` để giữ
    route sản phẩm của demo; quyền của site = gói + `addons`.
- **AC**:
  - [x] Site không có trang Sản phẩm trong cấu trúc → `/san-pham` và `/san-pham/<slug>` trả 404, không có trong sitemap.
  - [x] `applyPlanToPreset(t15, basic)` không còn section/trang có entitlement ngoài gói Cơ bản; `validateSiteStructure`
        từ chối cấu hình thiếu trang bắt buộc hoặc có trang ngoài gói.
  - [x] Hai tenant seed render y như trước (`tooling/visual/tenant.spec.ts` qua, ảnh hồi quy khớp).
  - [x] Site chỉ có subdomain nền tảng → không có `noindex`; thêm tên miền chính khác → subdomain 308.
  - Bằng chứng E5-S11: `apps/web/src/lib/tenant/__tests__/routes.test.ts` (`routeEnabled`), `seo.test.ts` (sitemap bỏ trang
    ngoài cấu trúc/gói, `NOINDEX_DOMAINS`), `packages/presets` test cấu trúc (16/16); web tenant 49 qua (2 skip Redis).
    Server dev thật: bỏ `products` khỏi `pageTypes` của t12 → `/san-pham`, `/san-pham/<slug>` 404, sitemap 0 URL sản phẩm,
    t15 vẫn 200. Spec trình duyệt tenant 27/28 (lỗi DNS môi trường như S10). So ảnh trước/sau: code base + DB cũ so với code
    mới + cùng DB sau migration và seed lại, 2 tenant × 8 route × 390/1440 = 32/32 khớp (ngưỡng 0,2% điểm ảnh, che
    video/iframe/canvas; `.agent-runs/E5-S11/compare.log`, spec `compare.spec.ts`). Landing theo gói: hạ t12 xuống Cơ bản →
    `/uu-dai/nang-luong` 404 và ra khỏi sitemap, `/about-us` vẫn 308 (`.agent-runs/E5-S11/landing-check.log`).
- Phụ thuộc: S04, S08, E6-S01 · Agent: Codex (review Claude adversarial) · Cỡ: M

