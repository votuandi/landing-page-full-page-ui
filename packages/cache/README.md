# @solar/cache

Hợp đồng `cached(fn, { keyParts, tags, mode? })` trả Promise dữ liệu; `invalidate(tags)` xóa mọi entry mang ít nhất một tag.
`cacheKey({ siteId, locale, mode, parts })` mã hóa mảng JSON có thứ tự, tránh ghép chuỗi gây trùng khóa.
Luôn dùng ID site, locale, chế độ và đầy đủ tham số nghiệp vụ trong khóa. `mode: "draft"` gọi thẳng hàm, không đọc/ghi cache.
Các loader công khai chỉ đọc dữ liệu published. Không đưa cookie, session, dữ liệu cá nhân vào cache dùng chung.

Tag hợp lệ: `tenant:<uuid>`, `tenant:<uuid>:site`, `tenant:<uuid>:page:<slug>` (slug trang chủ rỗng),
`tenant:<uuid>:collection:<name>`; ngoại lệ toàn nền tảng `platform:settings`, `platform:entitlements`.
Dùng helper `tenantTag`, `siteTag`, `pageTag`, `collectionTag`. Tên collection là tên repository (ví dụ `product`, `post`).
Cache không tự tạo quan hệ tag: mọi entry tenant phải gắn tenant tag; khi xuất bản page mới/đổi slug, thêm site tag
để xóa danh sách trang và cả page tag cũ/mới. Sửa cấu hình/quyền tenant cần tenant tag và hosts khi ảnh hưởng phân giải host.

`createMemoryCache({ maxEntries = 5000, ttlMs = 86400000, now? })` có TTL, LRU, single-flight và không giữ lỗi.
Invalidation xóa cả entry đang chờ; promise cũ chỉ trả về cho caller cũ và không ghi lại cache. Caller đến sau invalidation
đọc mới ngay. Entry identity thay cho bảng timestamp mỗi tag, tránh giữ vô hạn metadata invalidation.
Singleton trên `globalThis` giữ qua HMR. `react.cache` bên ngoài chỉ dedupe trong một request.

## Xuất bản và revalidate

Trong `withTenantTransaction(db, tenantId, async repo => ...)`, ghi nội dung rồi gọi
`await enqueueInvalidate(repo, [pageTag(tenantId, slug)])` từ `@solar/db`. Job và nội dung commit/rollback cùng nhau.
`invalidationJob(tags, { hosts? })` tạo topic `invalidate`, khóa idempotency UUID mới cho mỗi lần xuất bản.
Worker gửi raw JSON `{ tags, hosts?, nonce, ts }`, HMAC-SHA256 hex qua `x-signature`, idempotency key qua
`x-idempotency-key`. `signRevalidate`/`verifyRevalidate` dùng chung; không ghi secret/chữ ký vào log.

Web xác thực HMAC, timestamp ±5 phút, nonce một lần (TTL 10 phút), giới hạn 120 request/IP/phút và body 64 KiB.
Nonce dùng Redis SET NX PX khi có REDIS_URL (Redis lỗi → 503, worker retry), bộ nhớ khi không có Redis.
Endpoint xóa cache dữ liệu rồi gọi `revalidateTag(tag, { expire: 0 })`: request tiếp theo đọc mới ngay.
Không dùng profile `max` vì có thể phục vụ bản cũ. HTTP 503/mất kết nối được worker thử lại với nonce mới.

## Cache Redis dùng chung (E10-S03)

Có `REDIS_URL`: cache dữ liệu giữ object JS (kể cả Date) trong L1 TTL/LRU/single-flight của từng tiến trình; mỗi hit
kiểm dấu thời gian tag bền vững trong Redis. Không serialize dữ liệu nghiệp vụ. Hai kết nối ioredis (command + subscriber)
được tạo lười ở lần gọi published `cached`/`invalidate` đầu tiên, dùng chung với handler qua `Symbol.for("solar.cache.redis")`.
Import package ở worker/db và đọc draft không mở kết nối Redis.

Next dùng `cacheHandlers.default` cho `"use cache"`: stream được lưu dưới hash `uc:<sha256(key)>`, metadata giữ thời điểm
**bắt đầu** render do Next cung cấp. Không cấu hình `cacheHandler` ISR/route: route tenant động không đi qua incremental
cache; các route tĩnh build sẵn vẫn dùng handler mặc định và không cần render lại. Handler ESM JS nạp trực tiếp trên
Node 20/22, không có bước build/dist. Next tracing đưa handler và dependency vào standalone (kiểm qua Docker smoke).

Invalidation ghi `tag:<tag>:invalidatedAt` đơn điệu bằng Lua, TTL 8 ngày (dài hơn expire tối đa 24 giờ), rồi publish.
Mọi entry có thời điểm bắt đầu ≤ dấu tag đều bị loại, kể cả render đang chạy dở ghi xong sau invalidation. Pub/sub chỉ
xóa L1 sớm; close/error/ready và subscribe lại xóa toàn bộ L1. Mỗi lần command ready, `INFO server` xác định floor bằng
thời điểm Redis khởi động: entry trước floor bị loại kể cả tag clocks không có trong bản RDB khôi phục. Các máy cần NTP,
lệch đồng hồ tối đa 1 giây; clock invalidation cộng biên 1 giây nên render trong biên này có thể bị thực hiện lại.

Handler giành khóa `SET NX PX 15000` theo hash key. Entry quá revalidate nhưng chưa expire/vô hiệu vẫn có thể phục vụ
trong khi một instance render nền; các instance khác nhận revalidate nới để tránh render trùng. Cold/invalid miss chờ
entry mới mỗi 50 ms, tối đa 5 giây rồi fallback render; render kéo dài quá lease hoặc timeout có thể trùng. Nhả khóa
bằng Lua so token, không nhả lease của instance khác. Stream lỗi bị bỏ, stream của caller vẫn đọc được.

Redis lỗi: đọc dữ liệu gọi trực tiếp loader, handler miss/set bỏ qua, cảnh báo tối đa một lần/phút không chứa URL/secret.
Invalidation vẫn ném lỗi để endpoint trả 503 và worker retry; không xác nhận xuất bản khi dấu tag chưa ghi được.
Không có `REDIS_URL`: data cache dùng bộ nhớ, handler dùng mặc định của Next. Redis cần private network/auth, không public.

Có Redis dùng chung, `WEB_REVALIDATE_URLS` chỉ cần một endpoint bất kỳ (có thể qua load balancer).
Không có Redis, cache bộ nhớ nằm trong từng tiến trình: phải liệt kê endpoint của **mọi tiến trình web**,
không dùng một URL load balancer chọn ngẫu nhiên replica. Worker chỉ hoàn tất khi tất cả URL trả 2xx.
Retry không có hạn tuổi; sau 5 phút log cảnh báo mỗi lần thất bại. Backoff tối đa 6 giờ theo outbox E11-S01:
SLA 60 giây áp dụng khi web/worker hoạt động, không phải trong thời gian gián đoạn kéo dài.
Cache Components thuộc E5-S06.

Kiểm tra: `pnpm --filter @solar/cache typecheck`, `lint`, `test`. Integration test tự skip khi thiếu `REDIS_URL`,
dùng key/tag UUID riêng để không chạm dữ liệu hay test khác; pub/sub test chỉ kill subscriber do chính test tạo.
`AC3 real restart` chỉ chạy khi có `REDIS_RESTART_CMD` (ví dụ `docker restart solar-local-redis`), cần Redis test riêng.
Package có script test để Turborepo phát hiện. Dependency runtime ioredis 5.10.0 dùng hợp đồng Redis/stream/khóa này,
cùng phiên bản đã có ở web/worker; không thêm build tool hay thư viện cache khác.
