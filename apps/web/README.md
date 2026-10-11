# web

## Phân giải tên miền (E5-S03)

`MULTI_TENANT=1` bật `src/proxy.ts` (Next 16, Node runtime); cần `DATABASE_URL`.
Mặc định tắt tới E5-S04 để site đơn và `/lab` tiếp tục dùng fixture. Dù tắt,
proxy vẫn xóa `x-tenant-id`/`x-site-id` từ client và chặn đường dẫn `/sites/*`.
Route `/sites/[siteId]/[[...path]]` hiện là trang tạm có nhãn, E5-S04 thay renderer.

Chỉ `Host` được dùng để chọn tenant. Caddy/ALB/Cloudflare phải ghi đúng `Host`;
web bỏ qua hoàn toàn `X-Forwarded-Host`/`Forwarded` vì Next proxy không có IP socket
đáng tin để nhận diện upstream. Chuẩn hóa chữ thường, bỏ cổng/dấu chấm cuối,
IDN thành punycode; giữ nguyên `www.`. Không lấy host dự phòng từ URL của Next.
Header nội bộ chỉ được proxy đặt trong **request headers**, không đưa lên response.

Domain chỉ phục vụ khi `verified|active`; domain khác hoặc host lạ trả 404,
tenant `suspended` trả 403 với `Cache-Control: no-store`. Alias trả 308 tới
primary của cùng tenant + site, giữ path/query, dùng HTTPS trong production.
308 có `Cache-Control: public, max-age=300`; ở dev redirect giữ cổng của request.
Resolver lỗi (kể cả thiếu `DATABASE_URL` khi bật) trả 503 `no-store`, log chi tiết ở server
và chỉ gửi thông báo chung cho client. Đường dẫn nội bộ bị chặn cả khi viết hoa (`/SITES/x`).
Trang thường rewrite sang `/sites/<siteId>/…`; `/api/*` giữ route và nhận header
tenant đã phân giải. API vẫn phải tự kiểm membership/entitlements khi các story
tương ứng triển khai; đây là bước xác định tenant của request.

Cache: Map tối đa 10.000 mục, TTL 60 giây (kể cả kết quả âm), gộp truy vấn đang chờ
cùng host → Redis `tenancy:host:<hostname>` → `forPlatform(db).domains.resolve`.
Redis giữ JSON `{ record, expiresAt }`, TTL vật lý 300 giây; `expiresAt` vẫn tính
từ lúc đọc DB và không được gia hạn khi qua instance khác. Nhờ vậy lỡ pub/sub
không kéo dài dữ liệu cũ quá 60 giây. Truy vấn đang chờ bị invalidation sẽ đọc lại.

`REDIS_URL` bật ioredis (đã được AGENTS.md cho phép): hai kết nối riêng cho lệnh
và subscriber, kênh `tenancy:host:invalidate`. Không Redis dùng EventEmitter nội bộ.
Redis lỗi thì đọc DB, log cảnh báo một lần trong resolver; subscriber mất kết nối
hoặc reconnect sẽ xóa Map, không đọc Redis khi subscriber chưa sẵn sàng.
Ứng dụng giữ resolver/pool qua `globalThis` để HMR không tạo pool mới (web ≤ 10).

Sau khi thay primary, status, tenant status hoặc gỡ/chuyển domain, caller phải
`await invalidateHosts(hostnames)` sau khi transaction commit. **Danh sách phải
gồm tất cả host của site bị ảnh hưởng**, kể cả alias mang `primaryHost` cũ; khi
khóa tenant thì gồm tất cả domain của tenant. E8 sẽ nối hàm này vào thao tác admin,
chuyển thành package dùng chung nếu cần. Pub/sub đồng bộ nhiều instance; TTL là
dự phòng khi mất kết nối. Không chuyển tenant bằng cách đổi `tenantId` trực tiếp:
gỡ domain cũ, tạo `pending` với verification token mới, xác minh lại rồi phục vụ.

Kiểm local (DB test đã migrate, Redis 7):

```powershell
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:54329/solar_e5'
$env:REDIS_URL = 'redis://localhost:6379'
pnpm db:seed
pnpm --filter web test:tenant
$env:MULTI_TENANT = '1'
pnpm --filter web dev
curl.exe -H 'Host: t15.localhost' http://localhost:3000/
curl.exe -H 'Host: t12.localhost' http://localhost:3000/lien-he
```

CI job `db` chạy Postgres 16 và Redis 7, cả test DB lẫn `web test:tenant`.
Test Redis thiếu `REDIS_URL` thì skip có lý do; URL có mà lỗi thì test fail.
Test tenant dùng tsx để chạy source ESM của Prisma, giữ nguyên test fixture CommonJS.

Client Prisma chỉ sinh ở task `@solar/db#build` (output `generated/**`); `build`, `typecheck`, `test` qua Turbo
đều chờ task này. Chạy `next build` trực tiếp thì trước đó chạy `pnpm --filter @solar/db generate`.

Nguồn: [Next proxy: Node runtime, matcher, request headers](https://nextjs.org/docs/app/api-reference/file-conventions/proxy),
[ioredis: pub/sub, reconnect, offline queue](https://github.com/redis/ioredis).
Phần kiểm header giả mạo qua Caddy được kiểm tiếp ở E10 khi có `infra/caddy`.
