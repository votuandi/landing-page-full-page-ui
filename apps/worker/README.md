# worker

Tiến trình Node (không Next) xử lý bảng `Outbox` theo D14: request chỉ ghi DB + job trong cùng transaction, worker làm
tác dụng phụ (gửi lead, sau này revalidate cache, cron gói/gia hạn). Chạy: `pnpm --filter worker start` với
`PLATFORM_DATABASE_URL` (vai trò `app_platform`, pool `POOL_BUDGET.worker`).

## Vòng lặp (`src/loop.ts`)

- `runOnce` lấy job đến hạn bằng `UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED)` (`forPlatform(db).outbox.claim`):
  nhiều worker không bao giờ nhận cùng một job. Job được giữ bằng **lease** 60 s (`runAt` = hết lease); worker chết giữa chừng
  → hết lease, worker khác lấy lại. `attempts` là mã lease: worker cũ tỉnh lại không ghi đè được job đã bị lấy lại.
- Lỗi → retry lũy thừa 30 s, 1 phút, 2 phút … tối đa 6 h (±10%); quá 24 h kể từ lúc tạo → trạng thái `failed` (= **dead**),
  ghi `AuditLog` `outbox.dead` và log `[outbox] dead`. `PermanentError` (kênh chưa hỗ trợ, lead đã xóa) → dead ngay.
  Topic có `maxAgeMs: Infinity` thì không bao giờ dead.
- "Gửi lại": `forPlatform(db).outbox.resend({ tenantId, id, actor })` đưa job dead về `pending` (hộp thư lead E11-S03).
- `startWorker` poll mỗi giây (batch đầy thì poll tiếp ngay), dừng sạch khi SIGTERM/SIGINT.

## Topic

| Topic | Tạo bởi | Xử lý |
|---|---|---|
| `lead.deliver` | `createLead` (`@solar/db`), một job / lead × kênh, khóa `lead.deliver:<leadId>:<integrationId>` | `createLeadDeliver({ senders })`; sender nhận `idempotencyKey = <leadId>:<integrationId>` |

**Số lần gửi**: kênh có `supportsIdempotency: true` (bỏ qua key đã nhận) → **đúng 1 lần**; kênh không hỗ trợ → **ít nhất
1 lần** (worker chết sau khi gửi mà trước khi đánh dấu xong → gửi lại sau khi hết lease). Sender thật theo kênh (giải mã
config, chặn SSRF) thuộc E11-S02; hiện kênh chưa có sender sẽ dead ngay với lỗi "chưa hỗ trợ kênh".

Kiểm thử: `pnpm --filter worker test` (đặt `DATABASE_URL` + `PLATFORM_DATABASE_URL` để test Postgres không skip).
