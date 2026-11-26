# Runbook vận hành

Chỉ người có quyền vận hành thực hiện. Không in secret, token, URL kết nối có mật khẩu vào log.
Các ví dụ tenant dưới đây là [DỮ LIỆU MẪU]; thay bằng tenant đã được xác nhận trước thao tác.

## Deploy

Triệu chứng: cần đưa phiên bản mới lên hoặc health lỗi sau triển khai.

Kiểm: xác định commit SHA đã qua CI và image GHCR tag SHA từ workflow images.
Đọc [hướng dẫn image](../infra/docker/README.md) về runtime env, UID 1001, volume và smoke.
DB app dùng app_runtime; migration dùng role owner riêng qua `MIGRATION_DATABASE_URL`.

Xử lý: trước khi thay image, chạy `pnpm --filter @solar/db db:deploy` với kết nối owner;
không dùng owner cho runtime, không chạy migration khi container khởi động. Thay image bằng đúng tag SHA đã kiểm chứng,
giữ Host gốc qua proxy. Admin cần `ADMIN_SESSION_SECRET`, `PLATFORM_DOMAIN`; web multi-tenant cần `MULTI_TENANT=1`.

Xác nhận: `/api/health` của web/admin trả 200 (DB/role + Redis), mở site theo domain thật và trang đăng nhập CMS.
503 là chưa đạt; xem log dịch vụ, kiểm DB/Redis và biến runtime, không công khai cổng app trực tiếp.

Compose VPS/Caddy:
> Chưa có — E10-S02

AWS:
> Chưa có — E10-S04

CD tự động:
> Chưa có — E10-S08

## Rollback

Triệu chứng: lỗi ứng dụng sau deploy trong khi DB/Redis vẫn sẵn sàng.

Kiểm: so sánh SHA đang chạy và SHA tốt trước đó; đọc migration mới để xác nhận image cũ còn tương thích schema.

Xử lý: chạy lại image tag SHA tốt trước đó khi schema tương thích. Migration chỉ tiến, không xóa lịch sử hoặc tự đảo SQL.
Nếu không tương thích ngược, dừng rollback image, giữ chế độ kiểm soát truy cập tại hạ tầng và chuẩn bị bản sửa tiến
hoặc khôi phục DB đã được kiểm chứng cùng image tương ứng. Không khôi phục đè DB đang nhận ghi khi chưa có kế hoạch
bảo toàn dữ liệu mới và cửa sổ dừng ghi.

Xác nhận: health 200, đọc nội dung và đăng nhập CMS thành công trên phiên bản đã chọn.

Backup/restore DB vật lý:
> Chưa có — E10-S06

## Khôi phục

Triệu chứng: cần lấy lại nội dung tenant hoặc tạo bản sao từ bundle.

Kiểm: đọc [hợp đồng backup tenant](../packages/db/README.md#sao-lưu--khôi-phục-tenant-e7-s10),
xác nhận tenant nguồn, bundle và media còn giữ, gói đích, quyền platform. Bundle không thay thế backup DB vật lý.

Xử lý: dùng `pnpm --filter @solar/db tenant:export --tenant demo-t15 --out ./demo-t15.json` để xuất;
`pnpm --filter @solar/db tenant:restore ./demo-t15.json --slug clone-t15 --plan premium` tạo tenant đích.
Đặt bundle ngoài public, giữ `MEDIA_BACKUP_DIR` khớp nơi lưu backup còn giữ; làm đúng quy tắc media trong README DB.

Xác nhận: đối chiếu báo cáo restore, nội dung, media và gói tenant đích; kiểm website sau khi cấu hình domain hợp lệ.
Khôi phục DB vật lý thuộc hạ tầng:
> Chưa có — E10-S06

## Tên miền lỗi

Triệu chứng: domain trả 404/403, vào sai site hoặc không phân giải.

Kiểm: phân biệt DNS/SSL với HTTP ứng dụng. Kiểm bản ghi Domain, host chuẩn hóa và tenant/site sở hữu qua công cụ DB
được cấp quyền; không lấy tenant từ form/header do client gửi. Host lạ trả 404, site ngừng có thể trả 403.
Kiểm `/api/health` độc lập host tenant trước; đọc [routing web](../apps/web/README.md).

Xử lý: sửa cấu hình host qua repository/tooling được cấp quyền, kiểm trạng thái site/gói, vô hiệu cache host khi thay routing
và cache tenant bằng tag `tenant:<id>` qua luồng invalidation hiện có. Không xóa cache tenant khác.

Xác nhận: host đúng mở đúng nội dung tenant, host lạ vẫn bị từ chối; health 200.
Quy trình xác minh DNS/SSL và quản lý tên miền:
> Chưa có — E9-S01..S05

## Cache/ISR

Triệu chứng: CMS đã xuất bản nhưng website còn nội dung cũ.

Kiểm: phân biệt nháp với published; xem job `invalidate` trong Outbox, worker và cấu hình
`WEB_REVALIDATE_URLS`, `REVALIDATE_SECRET` dùng chung web/worker. Xem [cache](../packages/cache/README.md#xuất-bản-và-revalidate).

Xử lý: khôi phục worker/kết nối web/Redis trước; worker retry lỗi 503 bằng nonce mới. Revalidate dùng HMAC,
timestamp và nonce, không gửi curl thiếu chữ ký hoặc ghi secret/chữ ký vào log. Dùng luồng enqueue invalidation
có sẵn với tag tenant chính xác; không đưa cookie hay dữ liệu cá nhân vào cache dùng chung.

Xác nhận: job hoàn tất và request kế tiếp thấy nội dung published mới trên các instance web.

## Cron/worker

Triệu chứng: lead/email chưa gửi, invalidation chậm hoặc tác vụ dọn không chạy.

Kiểm: tiến trình worker, `PLATFORM_DATABASE_URL` role app_platform, kết nối DB/Redis và trạng thái Outbox.
Đối chiếu retry/dead với [worker](../apps/worker/README.md) và lịch [CRON.md](../CRON.md).

Xử lý: chạy `pnpm --filter worker start` với env tương ứng; thiếu cấu hình sender thì bổ sung theo
[runbook mail](../infra/mail/README.md). Không gửi lại job auth đã xóa payload; tạo yêu cầu mới từ luồng tài khoản.
Job lead lỗi có thể “Gửi lại” trong CMS sau khi sửa nguyên nhân; kênh không hỗ trợ idempotency có thể gửi trùng.
Không chạy xóa media thủ công trước khi kiểm tham chiếu và backup.

Xác nhận: job đến hạn được xử lý, không còn lỗi lặp; lead thử đến đúng kênh và nội dung public cập nhật.
Cảnh báo tập trung:
> Chưa có — E10-S07
