# web

## Phân giải tên miền (E5-S03)

`MULTI_TENANT=1` bật `src/proxy.ts` (Next 16, Node runtime); cần `DATABASE_URL` của role `app_runtime` (E5-S09).
Mặc định tắt để site đơn và `/lab` tiếp tục dùng fixture. Dù tắt,
proxy vẫn xóa `x-tenant-id`/`x-site-id` từ client và chặn đường dẫn `/sites/*`.
Route `/sites/[siteId]/[[...path]]` render nội dung published từ DB (E5-S04).

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
$env:DATABASE_URL = 'postgresql://app_runtime:<secret>@localhost:54329/solar_e5'
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

## Render published từ DB (E5-S04)

`dev` và `build` của web tạm dùng `--webpack`. Graph module tenant/DB/section trên Turbopack 16.3.8
đã tạo URL preload trong react-loadable-manifest cho chunk không được xuất ra, cả dev lẫn production.
Browser kiểm đúng hai host và giữ assertion không có console/page errors; bản Webpack qua cùng kiểm tra.
Khôi phục mặc định Turbopack sau khi lỗi manifest này được xử lý và browser suite qua.

Metadata tạm chờ hoàn tất trước khi gửi HTML (`htmlLimitedBots: /.*/`). Next 16.3.8 đã để canonical của trang danh sách
cùng canonical mới sau điều hướng client sang detail, kể cả chờ 20 giây; tắt streaming metadata làm test qua với
đúng một canonical. Đánh đổi là metadata phải đọc DB xong trước response; khôi phục streaming khi lỗi này được sửa
và case điều hướng trong tenant suite qua. [Cấu hình Next htmlLimitedBots](https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots).

`MULTI_TENANT=1` bật phân giải Host và render nội dung published từ PostgreSQL. Mặc định vẫn chạy bản t15/lab cũ.
Proxy xóa header nội bộ do client gửi, đặt tenant/site đã phân giải và rewrite vào `sites/[siteId]`.
Đường dẫn công khai `/sites/*` bị chặn. Các truy vấn nội dung dùng repository bắt buộc tenantId;
Site, Page và SectionContent còn được giới hạn theo site/page. Draft không được render công khai.

Chạy `pnpm --filter @solar/db db:deploy`, `pnpm db:seed`, rồi bật `DATABASE_URL`, tùy chọn `REDIS_URL`,
`MULTI_TENANT=1` và `pnpm --filter web dev`. Hai host seed là `t15.localhost` (premium) và `t12.localhost` (pro).
`TENANT_PUBLIC_PORT` chỉ dùng cho canonical HTTP trong dev, ví dụ `3211`; production dùng HTTPS và primaryHost.

### SEO theo tenant (E5-S08)

- `/robots.txt`, `/sitemap.xml` của mỗi host do `app/sites/[siteId]/{robots.txt,sitemap.xml}/route.ts` sinh từ dữ liệu
  published của chính tenant; URL luôn ở primaryHost.
- JSON-LD: Organization + LocalBusiness (chi nhánh) ở mọi trang, Product + BreadcrumbList ở chi tiết sản phẩm,
  BreadcrumbList ở chi tiết tin/công trình/giải pháp/chính sách, FAQPage ở `/cam-nang`.
- `NOINDEX_DOMAINS` (phân tách dấu phẩy, vd. `preview.solarweb.vn`): primaryHost là domain đó hoặc subdomain của nó →
  meta `noindex`, robots không có `Sitemap`, `/sitemap.xml` 404. Chỉ liệt kê hậu tố preview: subdomain nền tảng
  (`<slug>.solarweb.vn`) đang là tên miền chính của site thì **được index** (D21); host phụ đã 308 về tên miền chính.
- Cấu trúc trang (E5-S11): route `/ve-chung-toi`, `/giai-phap`, `/cong-trinh/*`, `/san-pham`, `/tin-tuc`, `/cam-nang`
  chỉ mở khi loại trang có trong `Site.pageTypes` và gói cho phép (`routeEnabled`, danh mục `PAGE_TYPES` của
  `@solar/presets`); không mở → 404 và không vào sitemap. Trang chủ, `/lien-he`, `/chinh-sach/*` luôn có; slug landing
  theo bản ghi `Page`. Quyền = gói + `addons` của tenant (`siteCanUse`).
- Slug cũ: `Site.seo.redirects` (`[{ from: "/product/:slug", to: "/san-pham/:slug" }]`) → 308. Redirect toàn cục trong
  `next.config.ts` chỉ áp khi `MULTI_TENANT` tắt.

Các route: home/landing published (slug nhiều segment), sản phẩm, chi tiết công trình, giải pháp, tin tức,
cẩm nang, chính sách, về chúng tôi và liên hệ. Theme/override/font/chrome/widget/SEO lấy từ site;
header/footer lấy từ home cùng site và chỉ render một lần. Collection rỗng giữ rỗng.
Schema lỗi dùng defaults của section/widget và log định danh; lỗi I/O/module được cô lập.
Media UUID hiển thị placeholder tới E8; asset path/HTTPS đã kiểm được dùng trực tiếp.

Adapter kiểm schema từng record trước khi hydrate: record lỗi bị bỏ riêng và log `recordId`, không làm mất record tốt.
Cột DB là nguồn chính cho segment/kind/rating/primary; Product thiếu Brand/Category published vẫn hiển thị với nhãn trung tính.
Giỏ tra toàn bộ SKU published, độc lập query trưng bày của widget. Datasheet, đơn vị giá, savings, CTA và form dịch vụ
dùng dữ liệu tenant; service `data.segment` chọn công trình liên quan, `data.steps` tùy chọn thay quy trình mặc định.

Locale tenant đọc cookie `solar-locale` và kiểm với `Site.locales`; không hợp lệ thì dùng defaultLocale được phép.
Nút VI/EN cập nhật cookie rồi `router.refresh()` để DTO, server slots, chrome/widget và metadata đổi cùng nhau, kể cả
tải lại hoặc điều hướng client. Metadata detail ưu tiên ảnh record, fallback ảnh SEO site; description fallback SEO →
profile → tên site. Theme switch chỉ hiện khi theme hỗ trợ dark và profile bật switcher.
Nguồn: [Next cookies](https://nextjs.org/docs/app/api-reference/functions/cookies),
[Next router.refresh](https://nextjs.org/docs/app/api-reference/functions/use-router).

Hook section/widget hiện tra features của **gói cơ sở** bằng `@solar/plans`; không cộng addons/trial/limits.
Gating quyền đầy đủ của route/metadata/CTA/provider/API thuộc E6-S02. Nhánh API legacy giữ hành vi hiện có.
Robots/sitemap tenant tạm trả 404 tới E5-S08. Chưa có ISR/shared content cache/revalidate/preview;
React cache chỉ gộp đọc trong request. Root đọc headers khiến legacy cũng render động; E5-S05/S06 xử lý cache.

### API lead tenant (E11-S01)

`POST /api/lead` trên host tenant (`lib/tenant/leadIntake.ts`): tenant/site lấy từ header proxy (resolve theo host), không
đọc từ body. Hợp đồng t15 giữ nguyên (`name`, `phone` di động VN, `source`, `estimate`, `items`, `province`, `businessType`,
`page`…), thêm:

| Trường / điều kiện | Kết quả |
|---|---|
| `website` có giá trị (honeypot), hoặc `elapsedMs` thiếu / < 3000 (form gửi số ms từ lúc mount) | `200 {ok:true}`, **không lưu** |
| > 10 request/phút theo IP (`x-forwarded-for` đầu tiên) hoặc > 5 lần/10 phút theo SĐT | `429` + `Retry-After` |
| Tính năng của `source`/payload ngoài gói (E6-S02) | `403` |
| Có `TURNSTILE_SECRET_KEY` mà `turnstileToken` / `cf-turnstile-response` sai | `400` (đặt cả `TURNSTILE_SITE_KEY` để layout tenant phát `<meta name="turnstile-site-key">` và form hiện widget) |
| Hợp lệ | Lưu `Lead` + mỗi kênh `LeadIntegration` đang bật một job `Outbox{topic:"lead.deliver"}` trong **cùng transaction**, rồi `200 {ok:true,id}`; lỗi DB → `503` |

Bộ đếm rate-limit dùng Redis (`REDIS_URL`, dùng chung giữa các bản `web`); Redis lỗi → đếm trong bộ nhớ của tiến trình,
không chặn lead. Lỗi đọc site/DB → `503`. Việc gửi tới kênh do `apps/worker` làm (xem README ở đó).

Kiểm thử: `pnpm --filter web test:tenant` (đặt DATABASE_URL và REDIS_URL để integration không skip).
Sau seed chạy `pnpm --filter @solar/visual exec playwright test --config playwright.tenant.config.ts`.
Suite tự chạy một Next dev port 3211 và kiểm hostname thật, metadata, route matrix, giỏ, anchor, JS off,
header giả mạo, cùng ảnh chụp desktop/mobile. CI lưu ảnh/log/trace trong artifact `tenant-browser-evidence`.

E5-S09: process web chỉ nhận credential app_runtime; không truyền PLATFORM_DATABASE_URL/MIGRATION_DATABASE_URL.
Resolver công khai vẫn `forPlatform(db).domains.resolve`, qua `resolve_tenant_host` SECURITY DEFINER với allowlist HostRecord,
không audit từng lookup (ngoại lệ D3). Repository nội dung tự mở transaction + context tenant; include Tenant chỉ đọc đúng id.
Browser fixture chạy riêng bằng PLATFORM_DATABASE_URL; cấu hình Playwright loại credential vận hành khỏi process Next.
