# @solar/env

Schema Zod cho web/admin/worker/console. `loadEnv(schema)` chạy trước khi mở DB;
cấu hình sai in tên biến + thông báo cố định rồi thoát 1, không in giá trị.
Biến rỗng coi như thiếu. Web single-site không cần DB; multi-tenant cần role
`app_runtime`. Admin dùng `app_runtime`; worker/console dùng `app_platform`
qua `PLATFORM_DATABASE_URL`. Console có `CONSOLE_SESSION_SECRET` riêng (E15).
Next gọi trong instrumentation Node, bỏ qua build và edge.

## Mã hóa và xoay khóa

Import `encryptSecret`, `decryptSecret`, `needsRotation` từ `@solar/env/secrets`
(chỉ Node). Không đưa module này vào client/edge. `APP_ENCRYPTION_KEY` là danh sách
base64 chuẩn, mỗi khóa 32 byte, cách nhau bằng dấu phẩy; khóa đầu dùng để ghi.
Sinh khóa riêng bằng `openssl rand -base64 32`, lưu trong kho bí mật.
Không dùng giá trị minh họa làm khóa thật. Thiếu khóa chỉ lỗi khi dùng helper;
có khóa sai định dạng sẽ lỗi ngay startup.

Format: `v1.<kid>.<iv base64url>.<ciphertext+tag base64url>`. AES-256-GCM,
IV ngẫu nhiên 12 byte, tag 16 byte; kid là 8 hex đầu SHA-256 của khóa.
Giải mã từ chối ciphertext sai hoặc khóa đã bị loại.

1. Đưa khóa mới lên đầu `APP_ENCRYPTION_KEY=mới,cũ` trên mọi instance/worker/CLI.
2. Chạy `pnpm --filter @solar/db secrets:rotate` với `PLATFORM_DATABASE_URL`
   của role `app_platform`. Script chạy qua repository, audit `secrets.rotate`
   chỉ chứa số lượng. Giá trị cũ không đúng format giữ nguyên và đếm `skipped`;
   envelope v1 sai xác thực/thiếu khóa thì dừng với lỗi cố định.
3. Kiểm số `rotated`, `skipped`, xử lý các dòng cũ; chạy lại phải `rotated=0`.
4. Sau khi mọi instance và dữ liệu đã dùng khóa mới, loại khóa cũ. Giữ khóa cũ
   trong kho backup riêng nếu backup còn ciphertext dùng khóa đó.

Không log khóa, plaintext, ciphertext hoặc URL DB. Sender tích hợp sẽ dùng helper
ở E11-S02. Package DB chỉ nhận callback rotate, không import runtime mã hóa.
