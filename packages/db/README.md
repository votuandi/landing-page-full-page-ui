# @solar/db

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
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/solar_e5'
pnpm --filter @solar/db db:deploy
pnpm db:seed
pnpm db:seed
pnpm --filter @solar/db test
```

Linux/macOS: export cùng `DATABASE_URL` trước các lệnh trên. Prisma 7 không tự nạp `.env`;
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

`Tenant`, `User`, `PlatformAdmin`, `Plan` thuộc nền tảng. Mọi bảng khác có FK `tenantId` và unique
`(tenantId, id)`. `Outbox`/`AuditLog` cho phép `tenantId = null` cho việc nền tảng.
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

Ứng dụng dùng `forTenant(db, tenantId)` từ `@solar/db`; nhận đủ 21 delegate tenant
(`project`, `page`, `sectionContent`, `media`…), mỗi delegate có `list`, `first`, `get`,
`count`, `create`, `update`, `delete`. Tenant phải là UUID. Repository tự gắn tenant,
loại bỏ `tenantId`/`tenant` khỏi dữ liệu ghi; filter AND/OR của caller không thể bỏ scope.
`get(id)` ngoài tenant hoặc sai định dạng UUID trả `null` (UUID sai không gửi truy vấn),
`update(id, data)`/`delete(id)` ngoài tenant trả `{ count: 0 }`.

```ts
const repo = forTenant(db, tenantId);
const projects = await repo.project.list({ where: { status: "published" } });
await db.$transaction(async (tx) => {
  await forTenant(tx, tenantId).project.update(projectId, { title: { vi: "Tiêu đề mới" } });
});
```

Create/update SectionContent (cả data/draftData) và sáu collection có schema dùng
`collectRefs` từ `@solar/sections`, rồi kiểm ID media/collection thuộc tenant trước khi ghi.
Ảnh tĩnh giữ quy tắc ở trên; tên collection lạ bị từ chối. Đây chỉ là kiểm tham chiếu,
không thay thế validation nội dung của CMS. Khi cần ghi nhiều bước nguyên tử, truyền transaction
client vào repository; kiểm ref dùng đúng client đó.

`createDb` ném `MissingTenantError` ở mọi môi trường nếu model tenant thiếu scope;
raw SQL cũng bị chặn. Outbox/AuditLog cần scope tường minh (`tenantId: null` cho tác vụ nền tảng).
Filter tenant chỉ nhận chuỗi không rỗng, `{ equals: chuỗi }`, `{ in: chuỗi[] }` không rỗng;
Outbox/AuditLog còn nhận `null`/`{ equals: null }`. Toán tử hoặc thuộc tính khác bị từ chối.
Tenant trong dữ liệu ghi là chuỗi (hoặc `null` ở bảng tùy chọn), hoặc `tenant.connect.id`;
không nhận object filter/field operator. Update/updateMany và hai nhánh upsert không được đổi tenant:
tenant ghi tường minh phải khớp mọi tenant trong where; upsert.create phải có tenant cùng where.
Các model Plan/Tenant/User/PlatformAdmin giữ thao tác nền tảng. Client nội bộ không scope
không được export. `forPlatform(db).domains.findByHostname(hostname)` là ngoại lệ tra host
được kiểm soát, nhận client gốc từ `createDb`, không nhận transaction client.
ESLint cấm import tĩnh, `require()` và `import()` với đường dẫn literal tới Prisma/pg/generated client ngoài `packages/db`.

### Phân giải tên miền

`forPlatform(db).domains.resolve(hostname)` trả `HostRecord | null`: chỉ các trường
định tuyến, trạng thái tenant và `primaryHost` của cùng tenant + site có trạng thái
`verified|active`. Tra cứu qua một lời gọi Prisma có relation select, dùng client
nội bộ của `createDb`; không mở scope cho truy vấn nội dung. Các kiểu `HostRecord`,
`DomainStatus`, `TenantStatus` export từ `@solar/db`. Proxy kiểm trạng thái domain
và tenant trước khi phục vụ, kể cả chứng chỉ TLS vẫn còn hạn.

Chuyển domain sang tenant khác: gỡ bản ghi cũ, tạo bản ghi `pending` với
`verificationToken` mới rồi xác minh lại (API E8 triển khai). Invalidate toàn bộ
host bị ảnh hưởng sau commit; đổi primary phải invalidate cả alias của site.
Chi tiết cache và ranh giới `Host` ở [web/README](../../apps/web/README.md).

## Giới hạn đã biết

- Model nền tảng `Tenant`/`User` có thể `include`/`select` relation tới bảng tenant mà query extension
  không guard truy vấn relation đó; chỉ dùng trong thao tác nền tảng có kiểm quyền. RLS thuộc E5-S09.
- `Page.sections`/`draftSections` chỉ chứa descriptor `{ id, type, variant, enabled, anchor, layout }`,
  không chứa data/ref nên không rút ref riêng. `PageVersion.snapshot` là bản chụp nội dung đã kiểm khi ghi
  SectionContent; repository chưa kiểm ref độc lập khi ghi trực tiếp snapshot. E7 phải giữ ranh giới này
  khi thêm schema/luồng ghi CMS.
- `Site.widgets/profile/seo/themeOverrides`, `data` của faq/brand/certificate/pressItem/service/productCategory
  và `Media.variants` chưa có schema Zod, nên chưa kiểm ref JSONB. E7 CMS phải thêm schema và gọi `collectRefs`
  khi ghi; hiện chỉ SectionContent và sáu collection có `collectionSchemas` được kiểm.
- Outbox/AuditLog dùng `null` cho việc nền tảng; guard kiểm scope tường minh, không kiểm quyền gọi.
  Kiểm ref rồi ghi chưa tự tạo transaction; truyền transaction client nếu cần nhiều bước nguyên tử.
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

ERD: [ERD.md](./ERD.md). Test ERD yêu cầu tài liệu khớp schema.
