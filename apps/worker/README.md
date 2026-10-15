# worker

Tiến trình Node (không Next) xử lý bảng `Outbox` theo D14: request chỉ ghi DB + job trong cùng transaction, worker làm
tác dụng phụ (gửi lead, revalidate cache, cron gói/gia hạn). Chạy: `pnpm --filter worker start` với
`PLATFORM_DATABASE_URL` (vai trò `app_platform`, pool `POOL_BUDGET.worker`).

## Vòng lặp (`src/loop.ts`)

- `runOnce` lấy job đến hạn bằng `UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED)` (`forPlatform(db).outbox.claim`):
  nhiều worker không bao giờ nhận cùng một job. Job được giữ bằng **lease** 60 s (`runAt` = hết lease); worker chết giữa chừng
  → hết lease, worker khác lấy lại. Thời điểm hết lease (`runAt`) là mã lease: mỗi lần claim đẩy nó lên, nên worker cũ tỉnh
  lại không ghi đè được job đã bị lấy lại (kể cả sau "Gửi lại"). Một job lỗi khi ghi trạng thái không làm batch dừng giữa chừng.
- Lỗi → retry lũy thừa 30 s, 1 phút, 2 phút … tối đa 6 h (±10%); quá 24 h kể từ lúc tạo → trạng thái `failed` (= **dead**),
  ghi `AuditLog` `outbox.dead` và log `[outbox] dead`. `PermanentError` (kênh chưa hỗ trợ, lead đã xóa) → dead ngay.
  Topic có `maxAgeMs: Infinity` thì không bao giờ dead.
- "Gửi lại": `forPlatform(db).outbox.resend({ tenantId, id, actor })` đưa job dead về `pending` với cửa sổ retry 24 h mới
  (`createdAt` = lúc gửi lại; giá trị cũ + số lần thử nằm trong AuditLog `outbox.resend`). Dead/resend và AuditLog ghi cùng transaction.
- `startWorker` poll mỗi giây (batch đầy thì poll tiếp ngay), dừng sạch khi SIGTERM/SIGINT.

## Topic

| Topic | Tạo bởi | Xử lý |
|---|---|---|
| `lead.deliver` | `createLead` (`@solar/db`), một job / lead × kênh, khóa `lead.deliver:<leadId>:<integrationId>` | `createLeadDeliver({ senders })`; sender nhận `idempotencyKey = <leadId>:<integrationId>` |

**Số lần gửi**: kênh có `supportsIdempotency: true` (bỏ qua key đã nhận) → **đúng 1 lần**; kênh không hỗ trợ → **ít nhất
1 lần** (worker chết sau khi gửi mà trước khi đánh dấu xong → gửi lại sau khi hết lease). Sender thật theo kênh (giải mã
config, chặn SSRF) thuộc E11-S02; hiện kênh chưa có sender sẽ dead ngay với lỗi "chưa hỗ trợ kênh".

Kiểm thử: `pnpm --filter worker test` (đặt `DATABASE_URL` + `PLATFORM_DATABASE_URL` để test Postgres không skip).

## Cache invalidation (E5-S05)

Topic `invalidate` gọi `POST /api/revalidate` tới mọi URL trong `WEB_REVALIDATE_URLS` (phân tách dấu phẩy).
Đặt `REVALIDATE_SECRET` giống web; không đưa secret vào URL. Mỗi request/attempt tạo nonce mới, ký HMAC-SHA256 raw JSON,
đính `x-idempotency-key` của job. Timeout 10 giây, không đi theo redirect. Mọi URL phải trả 2xx mới hoàn tất.

Topic có `maxAgeMs: Infinity`: web tắt rồi bật lại vẫn nhận invalidation. Job trễ >5 phút log cảnh báo mỗi lần thất bại.
Retry theo backoff E11-S01. Khi dùng cache bộ nhớ, URL phải trỏ từng tiến trình web; URL load balancer không bảo đảm
xóa hết replica. Redis/shared cache triển khai ở E10-S03. Xem [hợp đồng cache](../../packages/cache/README.md).

## Đổi gói và override hết hạn (E6-S03)

- `notify.plan-changed`: được tạo cùng transaction đổi gói/audit; `createNotify({ notifier })` chuyển tenant, kind,
  payload và `idempotencyKey` ổn định cho adapter. Payload khác tenant bị từ chối vĩnh viễn; lỗi adapter đi qua retry outbox.
  Các topic `notify.*` mới phải đăng ký trong `main.ts` trước khi worker nhận chúng.
- Adapter mặc định `createLogNotifier` tìm SiteUser `owner` theo tenant (email/contactPhone) và chỉ log `[notify]` metadata
  (owner ID, có kênh liên hệ hay không), không log địa chỉ/số điện thoại. **Chưa gửi email/Telegram**; adapter thật ở E11-S02.
  Adapter thật cần dùng idempotency key để tránh gửi trùng khi worker chết sau khi gửi.
- Cron `override-expiry` gọi `forPlatform(db).tenants.scanExpiredOverrides({ now })` ngay khi khởi động và mỗi 5 phút sau
  khi hoàn tất; không chồng lượt, lỗi được log rồi thử ở chu kỳ tiếp theo. Khóa outbox theo tenant/thời điểm hết hạn bảo đảm
  nhiều worker/lần quét không tạo trùng. Quét bù 24 giờ, không xóa override; ghi audit hệ thống cùng transaction enqueue.
- SIGTERM/SIGINT chờ cả batch outbox và cron đang chạy trước khi đóng pool. `every(ms, task)` dùng lại cho cron tiếp theo.

Test Postgres đổi gói/audit/rollback/expiry ở `packages/db/src/__tests__/tenantPlan.int.test.ts`; chuỗi cache → đổi gói →
worker → signed revalidation → quyền mới ở `apps/web/src/lib/tenant/__tests__/revalidate.int.test.ts`.
Đặt `DATABASE_URL` + `PLATFORM_DATABASE_URL`, migrate/sync plans và seed theme `t15.localhost`; thiếu env thì test int skip.

## Gia hạn thủ công (E6-S05)

`startBillingCron` gọi `forPlatform(db).billing.run({ now })` ngay lúc khởi động và mỗi giờ sau lượt trước;
không chồng lượt, lỗi được log rồi thử lại ở chu kỳ tiếp theo. SIGTERM/SIGINT chờ cả billing đang chạy.
`notify.renewal` và `notify.suspended` dùng chung `createNotify`/adapter owner với `notify.plan-changed`.

Nhắc mốc nhỏ nhất trong 14/7/1 ngày còn lại, không nhắc sau khi hết hạn. Hết hạn + 7 ngày ân hạn thì khóa
và enqueue invalidation gồm tag tenant và mọi hostname. Transaction/row lock bảo vệ đổi gói đồng thời;
khóa outbox theo tenant, expiry ISO và milestone chống sinh trùng qua nhiều worker/lượt quét.
Ngày hết hạn null không bị billing xử lý. Xem [thanh toán thủ công](../../packages/plans/README.md#thanh-toán-thủ-công-e6-s05).

Test đồng hồ giả cron giờ/notification chạy offline trong worker. `packages/db/src/__tests__/billing.int.test.ts`
kiểm mốc nhắc, ân hạn, audit, host invalidation, gia hạn, no-op và chạy đồng thời trên Postgres;
`DATABASE_URL` + `PLATFORM_DATABASE_URL` phải trỏ DB đã migrate/sync plans. Test rollback bằng trigger cần thêm
`TEST_OWNER_DATABASE_URL` (app_owner); không mock Prisma đã extend. Thiếu env tương ứng thì skip và chưa tính là bằng chứng AC.
