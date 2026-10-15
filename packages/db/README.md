# @solar/db

## Migration section (E3-S09)

`migrateSectionRow(row)` từ `@solar/db` nâng cả `data` và `draftData` trước khi parse,
giữ draft null và không ghi DB khi đọc. E5-S04/E7 dùng helper này khi tải nội dung.
Repository `sectionContent.create` điền version hiện hành khi không truyền `schemaVersion`.
Khi `sectionContent.update` nhận `data` hoặc `draftData`, payload được coi là version hiện hành;
repository chỉ nâng trường cũ cần giữ lại, ghi một version chung; payload đầy đủ có thể thay
JSON cũ bị hỏng. `type` là bất biến sau create (chặn bằng kiểu API và runtime).
Row hiện hành chỉ ghi trường gửi lên. Khi nâng version, repository ghi có điều kiện trên
version và JSON đã đọc, đọc lại rồi thử lại nếu có cập nhật đồng thời (tối đa 5 lần, sau đó báo lỗi để lưu lại).
`Prisma.DbNull` xóa draft về SQL NULL; row future-version giữ version đang lưu. Luôn truyền
JSON đầy đủ đã migrate khi sửa nội dung; giữ key lạ để không mất trường của app mới trong rolling deploy.

```sh
pnpm sections:migrate --dry-run
pnpm sections:migrate
pnpm sections:migrate --file /absolute/path/backup.json --dry-run
pnpm sections:migrate --file /absolute/path/backup.json
```

DB cần `PLATFORM_DATABASE_URL`. Script duyệt từng tenant qua builder repository nội bộ có filter/ref guard, đọc lô 100 bản ghi theo id,
nâng `SectionContent.data`/`draftData` và `PageVersion.snapshot`; chỉ ghi bản ghi thay đổi.
Dry-run in tenant, bảng, type, version và số lượng, không ghi dữ liệu. Chạy lần hai báo 0 thay đổi.
Backup là snapshot hoặc mảng snapshot theo README sections; `--file` không cần DB,
đường dẫn tương đối tính từ `packages/db` do pnpm filter. Ghi qua file tạm cùng thư mục rồi rename;
backup có lỗi giữ nguyên toàn bộ file. Lỗi báo id bản ghi hoặc index snapshot, tiếp tục xử lý,
exit 1 cuối lượt (exit 0 khi không lỗi). Dữ liệu lỗi cần sửa trước khi chạy lại.

Chạy lượt ghi DB trong cửa sổ bảo trì/deploy khi CMS đã ngừng ghi: script không khóa lạc quan
theo `revision`, nên ghi đồng thời có thể bị ghi đè. Luôn backup trước lượt ghi DB.

Prisma **7.10.0**, Postgres **16**. Client sinh bằng `prisma-client` vào `generated/` (không commit).
`prisma.config.ts` giữ cấu hình CLI; runtime dùng `@prisma/adapter-pg` và driver `pg`.
Yêu cầu Node ≥ 20.19 (CI dùng Node 22). Tham khảo [hướng dẫn Prisma 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7).

## Lệnh

Từ gốc workspace:

```sh
pnpm --filter @solar/db generate
pnpm --filter @solar/db typecheck
pnpm --filter @solar/db lint
pnpm --filter @solar/db test
pnpm --filter @solar/db db:erd
```

`generate`, validate schema, ERD và test không có DB chạy được khi không đặt `DATABASE_URL`.
Test tích hợp ghi/xóa dữ liệu: dùng DB test riêng đã migrate. Thiếu URL thì test tích hợp skip có lý do;
URL có nhưng không kết nối được thì test lỗi, không skip. Turbo không cache test DB.

PowerShell với Postgres 16 đã chạy:

```powershell
$env:DATABASE_URL = 'postgresql://app_runtime:<secret>@localhost:5432/solar_e5'
$env:MIGRATION_DATABASE_URL = 'postgresql://app_owner:<secret>@localhost:5432/solar_e5'
$env:PLATFORM_DATABASE_URL = 'postgresql://app_platform:<secret>@localhost:5432/solar_e5'
pnpm --filter @solar/db db:deploy
pnpm db:seed
pnpm db:seed
pnpm --filter @solar/db test
```

Linux/macOS: export các credential tương ứng trước các lệnh trên. Prisma 7 không tự nạp `.env`;
đặt biến môi trường trong shell/CI. Tạo migration mới bằng `pnpm --filter @solar/db db:migrate --name <name>`.
Khi không có DB, sinh SQL từ schema (vẫn cần kiểm `db:deploy` trên Postgres thật trước khi duyệt):

```sh
pnpm --filter @solar/db exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --output prisma/migrations/<timestamp>_init/migration.sql
```

Job CI `db` tạo Postgres 16 sạch, deploy migration, seed hai lần và chạy test tích hợp.
Kiểm image standalone thuộc E10-S01.

## Client và pool

```ts
import { createDb, POOL_BUDGET } from "@solar/db";
const db = createDb({ pool: POOL_BUDGET.web });
// App giữ instance riêng và đóng bằng await db.$disconnect() khi dừng.
```

URL mặc định từ `process.env.DATABASE_URL`; có thể truyền `url` rõ ràng. `pool` bắt buộc, nguyên dương.
Ngân sách: web ≤ 10/instance, admin ≤ 5/instance, worker ≤ 5/instance.
Tổng pool của **mọi instance** phải `< max_connections − 20` để chừa kết nối vận hành.
Package không tạo singleton hay tự kết nối khi import. Runtime dependencies: `@prisma/client` cho runtime
client sinh mã, `@prisma/adapter-pg` cho adapter bắt buộc ở Prisma 7, `pg` cho kết nối/pool Postgres.

## Tenant và khóa ghép

`Tenant`, `Plan`, `Customer`, `PlatformAdmin`, `PlatformSession`, `GhostGrant`, `PlatformSetting` thuộc nền tảng
(không có cột `tenantId`; `GhostGrant` trỏ tenant bằng `targetTenantId`). Mọi bảng khác có FK `tenantId` và unique
`(tenantId, id)`. Mỗi tenant có đúng một `Site` (`@@unique([tenantId])`, D17). `Outbox`/`AuditLog` cho phép `tenantId = null` cho việc nền tảng.
FK giữa bảng tenant luôn `(tenantId, xxxId) → (tenantId, id)`; cập nhật khóa cha bị `Restrict`
để không tự lan truyền việc đổi tenant. Collection slug unique theo tenant; page slug theo tenant + site;
hostname domain và media key unique toàn cục. ID UUIDv7 sinh ở Prisma Client.

`createDb()` trả client có query extension kiểm nested writes trước khi gọi Prisma, kể cả trong transaction.
Khi connect tới category/media/page hoặc model tenant khác, dùng selector ghép cùng tenant:

```ts
await db.product.create({ data: {
  slug: "san-pham", title: { vi: "Sản phẩm" }, tenant: { connect: { id: tenantId } },
  category: { connect: { tenantId_id: { tenantId, id: categoryId } } },
} });
```

Selector chỉ `{ id }`, tenant khác hoặc thiếu tenant đang ghi sẽ ném `CrossTenantRefError`.
Guard kiểm `connect`, `connectOrCreate.where`, `set` (kể cả mảng), kế thừa tenant khi nested create/createMany,
và kiểm cả hai nhánh upsert cùng nested update. Tenant ghi rõ ở data/where/parent phải khớp nhau;
`tenant.connect.id` cũng phải khớp. Dưới `tenant.update`, tenant cha lấy từ `where.id`.
Các trường JSON không bị duyệt như relation. Quan hệ toàn cục tới User/Plan dùng selector bình thường.
Danh sách relation trong `src/tenantGuard.ts` được test đối chiếu schema khi thêm quan hệ mới.
Hàm thuần `assertNoCrossTenantConnect` export để test không cần DB; kiểu client mở rộng là `Db`.
Query extension theo [Prisma query extensions](https://www.prisma.io/docs/orm/v7/prisma-client/client-extensions/query).

`Domain.hostname` cần lưu chữ thường, đúng host, không cổng; `User.email` chữ thường; `Media.key`
phải do server tạo dạng `tenants/<tenantId>/…`. Các phép chuẩn hóa này thuộc repository/resolver/storage
ở story tiếp theo; schema này định nghĩa kiểu dữ liệu và ràng buộc FK/unique.

Ref trong JSON không được FK bảo vệ: gọi `assertRefsBelongToTenant(db, tenantId, refs)` khi ghi.
Hàm hỗ trợ client hoặc transaction client, gom đủ ID thiếu vào `CrossTenantRefError.missing`,
không truy vấn UUID sai định dạng, bỏ qua media ID ảnh tĩnh `/images/…` (không bỏ qua `//host/…`).
RLS thuộc E5-S09.

## Repository

Ứng dụng dùng `forTenant(db, tenantId)` từ `@solar/db`; nhận đủ 25 delegate có scope tenant
(`project`, `page`, `sectionContent`, `media`…), mỗi delegate có `list`, `first`, `get`,
`count`, `create`, `update`, `delete`. Tenant phải là UUID. Repository tự gắn tenant,
loại bỏ `tenantId`/`tenant` khỏi dữ liệu ghi; filter AND/OR của caller không thể bỏ scope.
`get(id)` ngoài tenant hoặc sai định dạng UUID trả `null` (UUID sai không gửi truy vấn),
`update(id, data)`/`delete(id)` ngoài tenant trả `{ count: 0 }`.

```ts
const repo = forTenant(db, tenantId);
const projects = await repo.project.list({ where: { status: "published" } });
await withTenantTransaction(db, tenantId, async (repo) => {
  await repo.project.update(projectId, { title: { vi: "Tiêu đề mới" } });
});
```

Create/update SectionContent (cả data/draftData) và sáu collection có schema dùng
`collectRefs` từ `@solar/sections`, rồi kiểm ID media/collection thuộc tenant trước khi ghi.
Ảnh tĩnh giữ quy tắc ở trên; tên collection lạ bị từ chối. Đây chỉ là kiểm tham chiếu,
không thay thế validation nội dung của CMS. Khi cần ghi nhiều bước nguyên tử, dùng `withTenantTransaction`; kiểm ref và ghi luôn cùng connection.

`createDb` ném `MissingTenantError` ở mọi môi trường nếu model tenant thiếu scope;
raw SQL cũng bị chặn. Outbox/AuditLog cần scope tường minh (`tenantId: null` cho tác vụ nền tảng).
Filter tenant chỉ nhận chuỗi không rỗng, `{ equals: chuỗi }`, `{ in: chuỗi[] }` không rỗng;
Outbox/AuditLog còn nhận `null`/`{ equals: null }`. Toán tử hoặc thuộc tính khác bị từ chối.
Tenant trong dữ liệu ghi là chuỗi (hoặc `null` ở bảng tùy chọn), hoặc `tenant.connect.id`;
không nhận object filter/field operator. Update/updateMany và hai nhánh upsert không được đổi tenant:
tenant ghi tường minh phải khớp mọi tenant trong where; upsert.create phải có tenant cùng where.
Plan chỉ đọc ở runtime; Tenant chỉ đọc trong tenant context; các bảng nền tảng cần platform credential. Client nội bộ không scope
không được export. `forPlatform(runtimeDb).domains.resolve(hostname)` là ngoại lệ bootstrap công khai,
chỉ gọi `resolve_tenant_host` SECURITY DEFINER. Runtime không có delegate bảng nền tảng.
`forPlatform(createPlatformDb({ pool: 2 }))` nhận credential `PLATFORM_DATABASE_URL` riêng (bắt buộc, không fallback).
Audit bắt buộc kèm actor/reason của API console hoãn tới E15-S02; không coi client platform là bằng chứng xác thực actor.

### Phân giải tên miền

`forPlatform(db).domains.resolve(hostname)` trả `HostRecord | null`: chỉ các trường
định tuyến, trạng thái tenant và `primaryHost` của cùng tenant + site có trạng thái
`verified|active`. Tra cứu qua function
SQL SECURITY DEFINER do `app_platform` sở hữu; không mở scope cho truy vấn nội dung. Các kiểu `HostRecord`,
`DomainStatus`, `TenantStatus` export từ `@solar/db`. Proxy kiểm trạng thái domain
và tenant trước khi phục vụ, kể cả chứng chỉ TLS vẫn còn hạn.

Chuyển domain sang tenant khác: gỡ bản ghi cũ, tạo bản ghi `pending` với
`verificationToken` mới rồi xác minh lại (API E8 triển khai). Invalidate toàn bộ
host bị ảnh hưởng sau commit; đổi primary phải invalidate cả alias của site.
Chi tiết cache và ranh giới `Host` ở [web/README](../../apps/web/README.md).

## Giới hạn đã biết

- Runtime không đọc được bảng nền tảng; relation Tenant chỉ thấy tenant trong context. RLS không thay permission/auth.
- `Page.sections`/`draftSections` chỉ chứa descriptor `{ id, type, variant, enabled, anchor, layout }`,
  không chứa data/ref nên không rút ref riêng. `PageVersion.snapshot` là bản chụp nội dung đã kiểm khi ghi
  SectionContent; repository chưa kiểm ref độc lập khi ghi trực tiếp snapshot. E7 phải giữ ranh giới này
  khi thêm schema/luồng ghi CMS.
- `Site.widgets/profile/seo/themeOverrides`, `data` của faq/brand/certificate/pressItem/service/productCategory
  và `Media.variants` chưa có schema Zod, nên chưa kiểm ref JSONB. E7 CMS phải thêm schema và gọi `collectRefs`
  khi ghi; hiện chỉ SectionContent và sáu collection có `collectionSchemas` được kiểm.
- Outbox/AuditLog dùng `null` cho việc nền tảng; guard kiểm scope tường minh, không kiểm quyền gọi.
  Kiểm ref và ghi cùng transaction; dùng `withTenantTransaction` để gom nhiều thao tác nguyên tử.
  Luật lint đường dẫn literal chưa kiểm module được tính động từ biến.

## Seed demo

Seed `demo-t15` (premium) và `demo-t12` (pro), tên tenant/site có `[DỮ LIỆU MẪU]`.
Mỗi tenant có một site, domain `t15.localhost`/`t12.localhost`, trang home slug rỗng,
revision 1 và snapshot `PageVersion`. `Page.sections` chỉ giữ descriptor; dữ liệu và schemaVersion
nằm trong `SectionContent`, kể cả section disabled. Snapshot có `sections` và `contents`.
`Page.publishedAt` cùng `revision` đánh dấu bản xuất bản; Page không có cột status riêng.

Cả hai tenant dùng toàn bộ dữ liệu t15 từ `apps/web/src/data/*`: products/category/brand,
projects, posts, stories, testimonials, FAQ. Slug cố ý trùng giữa tenant; title localizable `{ vi }`,
nội dung gốc giữ trong JSON `data` (gồm chi tiết, specs, đường dẫn ảnh tĩnh). FAQ question/answer là `{ vi }`.
Việc ánh xạ JSON gốc sang DTO renderer thuộc repository. Seed không tạo Media hay User/mật khẩu.

Seed dùng upsert theo khóa tự nhiên, tìm lại site demo theo tenant + preset, chạy transaction theo tenant.
Chạy lại cập nhật dữ liệu demo, không nhân bản; đây không phải công cụ đồng bộ nội dung khách hàng.
Plans tạm có features rỗng/limits `{}`; khi plan đã tồn tại, seed giữ cấu hình features/limits (E6-S01).
Nếu hostname demo đã thuộc tenant khác, seed báo lỗi và rollback tenant đó.

Có `SEED_PASSWORD` thì seed thêm tài khoản demo (E5-S10): mỗi tenant có owner `owner@demo.vn` / `0901234567` /
`demo<id>_admin` (mật khẩu `<SEED_PASSWORD>-t15` hoặc `-t12`), và `khach@demo.vn` là `client` ở t15, `staff` ở t12;
`PlatformAdmin` `owner@demo.vn` (mật khẩu `<SEED_PASSWORD>-platform`). Thiếu biến thì bỏ qua tài khoản, vẫn seed nội dung.

ERD: [ERD.md](./ERD.md). Test ERD yêu cầu tài liệu khớp schema.

## Tài khoản (E5-S10, D17–D21)

Hai realm không có bảng/khóa nối nhau:

- `SiteUser` (bảng tenant): đăng nhập bằng `email`, `phone` hoặc `username`, mỗi trường unique **theo tenant**; tenant khác
  được trùng. CHECK trong DB: có ít nhất một định danh; email đã `lower(btrim)`; phone dạng `normalizeVnPhone` (`0…`);
  username `^[a-z0-9_]{3,70}$` và có chữ cái. Chuẩn hóa trước khi ghi (`normalizeVnPhone`, `toLowerCase`).
  `role`: `owner|admin|editor|staff|viewer|client`. `SiteSession` (`audience admin|storefront`, `kind user|ghost` — ghost chỉ
  `admin`, CHECK), `SiteToken` (lời mời, xác minh email, đặt lại mật khẩu, magic link).
- `PlatformAdmin` (email unique toàn hệ thống), `PlatformSession`, `GhostGrant`, `PlatformSetting`, `Customer`.
- `passwordHash`/`totpSecret` của `SiteUser` và `PlatformAdmin` bị **omit mặc định** ở client; lấy hash phải truyền
  `omit: { passwordHash: false }`. `forTenant(id).siteUser|siteSession|siteToken` theo tenant như các bảng khác;
  `forPlatform(platformDb)` có `customer`, `platformAdmin`, `platformSession`, `ghostGrant`, `platformSetting`.
- `Tenant.slug` (= subdomain) có CHECK định dạng nhãn DNS 3–63 ký tự, không `--`, không thuộc danh sách dành riêng;
  danh sách giữ khớp `RESERVED_TENANT_SLUGS` của `@solar/core` (test `schema.test.ts`).
- `AuditLog` ghi `actorType` + `actorId` (không FK để nhật ký sống lâu hơn tài khoản), `ghostGrantId` khi ghost.
  `PageVersion` ghi `publishedBySiteUserId` (khóa ghép) hoặc `publishedByPlatformAdminId`.

## Đồng bộ gói E6-S01

`@solar/plans/plans.ts` là nguồn quyền sản phẩm. `syncPlans(db)` nội bộ chạy một transaction
upsert đúng basic/pro/premium với tên VI, features có thứ tự ổn định, limits bốn key và syncedAt.
Lỗi rollback cả đợt; không xóa Plan lạ, không đổi Tenant.planId/addons/status hoặc nội dung.
Plan DB là bản đồng bộ, không dùng SQL để override quyền; E6-S02 đọc định nghĩa code khi kiểm quyền.
Nhóm theme ở code, không cần Prisma migration.

```sh
pnpm --filter @solar/db plans:sync
```

Chạy CLI này trong deploy sau migrate với PLATFORM_DATABASE_URL; pool 2 và disconnect trong finally.
Seed demo gọi cùng helper trước khi tạo nội dung nên không còn quyền rỗng. **Không dùng db:seed
trên tenant khách để đồng bộ gói**: seed là công cụ dựng demo. Demo t12 vẫn pro theo scope S01;
E5-S04 xử lý sự khác biệt nhóm theme Signature. Test Postgres kiểm drift, idempotence, giữ tenant/addons,
Plan lạ, rollback thật và seed hai lần giữ danh tính nội dung/quyền khớp code.

## RLS và vận hành (E5-S09)

- `DATABASE_URL`: chỉ `app_runtime`, không sở hữu bảng, không superuser/BYPASSRLS/membership owner/platform.
  `createDb` kiểm session/current role và đặc quyền trước SQL nghiệp vụ. Truy vấn Prisma trực tiếp có filter vẫn không
  tự đặt context; ứng dụng dùng `forTenant` hoặc `withTenantTransaction` (import từ `@solar/db`).
- Mỗi operation repository tự mở transaction, `set_config('app.tenant_id', id, true)` trước query, bao gồm ref check và
  optimistic section migration. Context hết ở commit/rollback; repo nhận từ callback không dùng được sau khi kết thúc.
  `forTenant(tx, id)` không còn được hỗ trợ. Không gọi HTTP/Redis trong callback.
- 25 bảng có tenantId và `Tenant` bật ENABLE + FORCE; thiếu/rỗng context SELECT/UPDATE/DELETE không thấy dòng nào,
  INSERT bị policy chặn. Plan chỉ đọc. Tenant chỉ đọc đúng id. AuditLog runtime chỉ SELECT/INSERT của tenant;
  null tenant thuộc platform, không được runtime đọc/ghi. Platform không UPDATE/DELETE AuditLog.
- Operator Postgres 16 chạy `psql -v ON_ERROR_STOP=1 -f packages/db/scripts/provision-roles.sql` bằng superuser trên DB
  kiểm thử/local, cấp `APP_OWNER_PASSWORD`, `APP_RUNTIME_PASSWORD`, `APP_PLATFORM_PASSWORD` từ môi trường. Script có inventory
  ownership cho DB cũ, không đưa secret vào migration. Sau đó `pnpm --filter @solar/db db:deploy` dùng
  `MIGRATION_DATABASE_URL` bắt buộc. Shadow DB cũng phải provision role/schema tương ứng. Managed DB production cần E10
  xác nhận quyền tạo role, chuyển ownership/membership trước rollout. Không chạy runtime bằng owner để né RLS.
- Seed, plans-sync, sections-migrate và browser fixture là tác vụ platform. Các process web/admin chỉ nhận DATABASE_URL;
  CI browser xóa platform/migration/test-owner/seed secret khỏi môi trường server. Tổng pool worker hai credential ≤ 5.
- Bootstrap host không ghi AuditLog từng lookup; trả đúng hostname/tenantId/siteId/status/isPrimary/tenantStatus/primaryHost
  và chỉ primary cùng tenant/site. Ngoại lệ D3 đã chốt, không có `resolve_admin_tenant`; slug admin để E7-S01.
- `redeemGhostGrant(db, tenantId, rawToken)` dùng SHA-256, consume nguyên tử qua `redeem_ghost_grant`, tạo session ghost/admin
  và lưu hash session token trong cùng transaction. Token sai/hết hạn/đã dùng/thu hồi, actor disabled hoặc tenant suspended
  trả lỗi chung; lỗi tạo session rollback consume. Các DateTime Prisma là UTC; SQL so sánh hạn ở UTC dù session timezone khác.
  Đây chỉ là primitive: auth/TOTP/permission, ghost audit và kiểm revokedAt trên request tiếp theo (cache ≤ 5s) thuộc E15-S03.
- Hai function SECURITY DEFINER có owner app_platform, search_path pg_catalog/pg_temp, bảng định danh public và không EXECUTE
  cho PUBLIC. Không dùng credential platform cho bootstrap public.
- Test DB dùng runtime thật để assert; PLATFORM_DATABASE_URL setup fixture, TEST_OWNER_DATABASE_URL chỉ cleanup/benchmark
  và kiểm FORCE owner. `RLS_REQUIRED=1` làm CI db job lỗi nếu thiếu bất kỳ credential hoặc SEED_PASSWORD; unit offline được skip DB.
- `pnpm --filter @solar/db exec tsx scripts/rls-bench.ts` tạo hai schema clone riêng, 20×1000 Product/SiteUser, 100 warmup và
  1000 mẫu xen kẽ cho get/list/join/login. EXPLAIN ANALYZE BUFFERS TIMING OFF loại chi phí bấm giờ từng node; gate mỗi median
  execution tăng ≤ 10% HOẶC ≤ 0,02 ms tuyệt đối (hai ngưỡng đều inclusive), không nới theo wall time.
  `RLS_BENCH_OUTPUT` lưu JSON raw samples/plans; wall autocommit/transaction báo
  riêng cho pg round trips và production repository builder qua Prisma (baseline autocommit / RLS transaction). Script exit 1 khi bất kỳ workload vượt gate; không chạy trong test.
