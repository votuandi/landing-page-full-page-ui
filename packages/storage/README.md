# @solar/storage

API lưu media dùng chung cho SSD local, AWS S3, Cloudflare R2 và MinIO. Chỉ dùng trong tiến trình Node trên server.

```ts
import { mediaKey, storageFromEnv } from "@solar/storage";

const storage = storageFromEnv();
// tenantId phải lấy từ tenant đã xác thực; ext do server chọn sau kiểm MIME.
const key = mediaKey(tenantId, "jpg");
await storage.put(key, bytes, {
  contentType: "image/jpeg",
  cacheControl: "public, max-age=31536000, immutable",
});
const metadata = await storage.head(key); // { size, contentType? } hoặc null
const bytes = await storage.get(key); // Uint8Array hoặc null; lỗi quyền/kết nối vẫn ném tiếp.
const url = storage.publicUrl(key);
for await (const objectKey of storage.list(`tenants/${tenantId}/`)) {
  // Xử lý từng khóa, không cần nạp toàn bộ danh sách vào RAM.
}
await storage.delete(key); // Idempotent khi khóa không tồn tại.
```

`StorageDriver.put` nhận `Uint8Array`; `list` là async iterable theo tiền tố **chuỗi**, ví dụ `tenants/a` cũng khớp
`tenants/ab/file.jpg`. Chưa có object thì `head` trả null; lỗi quyền hoặc kết nối vẫn ném tiếp.
`signedUploadUrl` chỉ là phương thức tùy chọn trong interface, chưa có implementation (E8-S02).

## Biến môi trường

| Biến | Giá trị |
|---|---|
| `STORAGE_DRIVER` | `local` (mặc định) hoặc `s3` |
| `MEDIA_PUBLIC_BASE` | Bắt buộc: URL HTTP(S) gốc phục vụ media/CDN, có thể có path; bỏ slash cuối khi ghép khóa |
| `STORAGE_LOCAL_ROOT` | Bắt buộc cho local; thư mục do ops quản lý, cùng filesystem với `.tmp` bên trong |
| `S3_BUCKET` | Bắt buộc cho s3 |
| `S3_REGION` | Mặc định `auto`; AWS dùng region bucket, R2 dùng `auto`, MinIO test dùng `us-east-1` |
| `S3_ENDPOINT` | Tùy chọn: endpoint R2/MinIO; AWS có thể bỏ trống |
| `S3_FORCE_PATH_STYLE` | Tùy chọn `true`/`false`; đặt `true` cho MinIO |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Đi cặp; thiếu cả hai dùng credential chain mặc định của SDK/IAM role |

Lỗi cấu hình chỉ liệt kê tên biến thiếu/sai; không đưa giá trị, secret hay URL có credentials vào thông báo.
`publicUrl` dùng `MEDIA_PUBLIC_BASE` cho cả hai driver; không tự suy domain bucket từ endpoint API.

## Khóa và giới hạn

`mediaKey(tenantId, ext, now?)` sinh `tenants/<uuid>/<yyyy>/<mm>/<randomUUID>.<ext>` theo UTC.
Tenant phải là UUID, ext hạ chữ thường và chỉ gồm 1–8 ký tự chữ/số. Không nhận tên file của người dùng.

Mọi method kiểm `assertKey` trước I/O: chỉ cho ký tự ASCII chữ/số và `._/-`; chặn khóa rỗng, slash đầu, backslash,
segment rỗng/`.`/`..`. Riêng `list` cho prefix rỗng và slash cuối. Local kiểm thêm containment trong root.
Driver là API cấp thấp cho caller tin cậy: caller phải dùng `mediaKey` và giới hạn thao tác đúng tenant; validation
đường dẫn không thay kiểm quyền. UUID không phải cơ chế cấp quyền đọc file.

Local ghi nguyên tử bằng `.tmp/<uuid>` rồi rename sang đích; đồng thời ghi cùng khóa sẽ có một bản hoàn chỉnh thắng.
`list` bỏ thư mục bắt đầu bằng dấu chấm (bao gồm `.tmp`) và không duyệt symlink; khóa trả về luôn dùng `/`.
Root chỉ do ops quản lý: không đặt symlink trong root, không dùng thư mục ẩn làm namespace media.
Local không lưu metadata `contentType`/`cacheControl`: static server suy MIME từ đuôi và cấu hình Cache-Control ở Caddy.
Chưa thêm route phục vụ file local; `MEDIA_PUBLIC_BASE` phải trỏ đến static server/CDN đã cấu hình.

Upload stream, presigned upload, quarantine/visibility, hạn mức và xác minh MIME thuộc E8-S02; tối ưu ảnh thuộc E8-S03.

## Kiểm tra

```sh
pnpm --filter @solar/storage typecheck
pnpm --filter @solar/storage lint
pnpm --filter @solar/storage test
bash scripts/local-ci.sh storage
```

Contract chung chạy local và S3. `storage` tự dựng MinIO test trên `127.0.0.1:${LOCAL_MINIO_PORT:-59000}`, tạo bucket
trong fixture, chạy test với `STORAGE_REQUIRE_S3=1`. `up` cũng dựng MinIO; `down` xóa cả ba container.
MinIO ghim `bitnamilegacy/minio:2025.4.22` (`minio/minio` đã gỡ khỏi Docker Hub); credentials `minioadmin` chỉ dùng cho container test loopback.

Không có `STORAGE_S3_TEST_ENDPOINT` thì suite S3 skip có lý do. Đặt `STORAGE_REQUIRE_S3=1` mà thiếu endpoint thì test
fail để CI không báo xanh khi bỏ sót MinIO. Có endpoint thì lỗi kết nối không bị skip. Có thể đặt
`STORAGE_S3_TEST_BUCKET`, `STORAGE_S3_TEST_ACCESS_KEY_ID`, `STORAGE_S3_TEST_SECRET_ACCESS_KEY` cho bucket test riêng;
fixture xóa object trong prefix UUID riêng của lượt chạy, không xóa bucket.

Dependency runtime: `@aws-sdk/client-s3` dùng API S3 tương thích R2/MinIO; `zod` kiểm cấu hình và UUID, đã được duyệt ở AGENTS.md.
API tham khảo: [AWS SDK v3 S3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html),
[HeadObject](https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html),
[ListObjectsV2](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html), [Zod refinements](https://zod.dev/api#refinements).
# Upload an toàn (E8-S02)

Upload dùng khóa server sinh `quarantine/<tenantId>/<uuid>`. Worker kiểm bytes rồi ghi
`private/<tenantId>/yyyy/mm/<uuid>.<ext>`; chỉ xuất bản mới ghi `tenants/<tenantId>/…`.
`publicUrl` từ chối mọi prefix khác `tenants/`. GET private đi qua admin, kiểm phiên/quyền/tenant,
trả `private, no-store` và `nosniff`. Không coi UUID là quyền truy cập.

S3/MinIO: áp dụng [public-read-policy.json](./public-read-policy.json), thay `BUCKET` bằng tên bucket.
Tắt mọi public ACL/policy khác. CORS chỉ cho origin admin đã cấu hình PUT với Content-Type.
Presigned PUT có hiệu lực 900 s, ký Content-Type và Content-Length; trình duyệt tự đặt Content-Length.
Video 200 MB đi thẳng bucket, không qua Next. R2 không dùng presigned POST.

R2: giữ bucket private, tắt `r2.dev` và không nối trực tiếp public custom domain vào bucket chung.
Public access của R2 mở toàn bộ bucket, không phải policy S3 theo prefix.
MEDIA_PUBLIC_BASE phải trỏ tới CDN/Cloudflare Worker chỉ cho GET/HEAD khóa `tenants/`, trả 403 cho prefix khác;
Worker đọc bucket qua R2 binding. Presigned PUT vẫn đi thẳng S3 API endpoint.
Nguồn: https://developers.cloudflare.com/r2/buckets/public-buckets/.

Local: thư mục root phải ở ngoài Next public. Caddy chỉ phục vụ prefix public:

```caddy
handle_path /media/tenants/* {
  root * /srv/solar/media/tenants
  header X-Content-Type-Options nosniff
  file_server
}
handle /media/* {
  respond 403
}
```

Không cấu hình file_server cho toàn bộ STORAGE_LOCAL_ROOT. Worker cron thu hồi upload quá 24 h.
Crash giữa put và promote có thể để lại object không tham chiếu; E8-S06 dọn các object đó.
Sharp bỏ metadata mặc định, không gọi keepMetadata/withMetadata.
Reservation là cận trên cho file client gửi, không phải trần output sharp. Khi ảnh sạch nở kích thước,
promote khóa Tenant và kiểm `used - reserved + actual` cùng trần loại, rồi lưu size thực; thiếu quota thì reject và dọn file.
Media được tham chiếu lúc publish vẫn đang scan sẽ có job publish chờ/retry. Chỉ khử trùng job đang pending/processing;
lần publish sau có thể tạo job mới khi job cũ done/failed. Các writer live và restore cũng enqueue theo refs hiện hành.
Nguồn: https://sharp.pixelplumbing.com/api-output/ và
https://github.com/aws/aws-sdk-js-v3/tree/main/packages/s3-request-presigner.
