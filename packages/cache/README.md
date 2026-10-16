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

## Giới hạn triển khai

Cache bộ nhớ nằm trong từng tiến trình. `WEB_REVALIDATE_URLS` phải liệt kê endpoint của **mọi tiến trình web**,
không dùng một URL load balancer có thể chọn ngẫu nhiên replica. Worker chỉ hoàn tất khi tất cả URL trả 2xx.
Retry không có hạn tuổi; sau 5 phút log cảnh báo mỗi lần thất bại. Backoff tối đa 6 giờ theo outbox E11-S01:
SLA 60 giây áp dụng khi web/worker hoạt động, không phải trong thời gian gián đoạn kéo dài.
E10-S03 thay bằng cache Redis/shared Next cache theo cùng hợp đồng. Cache Components thuộc E5-S06.

Kiểm tra: `pnpm --filter @solar/cache typecheck`, `lint`, `test`. Package có script test để Turborepo phát hiện.
