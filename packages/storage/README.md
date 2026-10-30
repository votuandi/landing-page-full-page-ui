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
| `MEDIA_PUBLIC_BASE` | URL HTTP(S) media/CDN dùng fallback khi base riêng của driver thiếu/rỗng; có thể có path |
| `MEDIA_PUBLIC_BASE_LOCAL` / `MEDIA_PUBLIC_BASE_S3` | Base riêng ưu tiên theo driver; trống dùng `MEDIA_PUBLIC_BASE`; mỗi driver được dùng phải resolve được một base hợp lệ |
| `MEDIA_BACKUP_DIR` | Worker/CLI: thư mục JSON `tenant:export` còn giữ, ở ngoài public; phải đặt khi có backup cần bảo vệ |
| `STORAGE_LOCAL_ROOT` | Bắt buộc cho local; thư mục do ops quản lý, cùng filesystem với `.tmp` bên trong |
| `S3_BUCKET` | Bắt buộc cho s3 |
| `S3_REGION` | Mặc định `auto`; AWS dùng region bucket, R2 dùng `auto`, MinIO test dùng `us-east-1` |
| `S3_ENDPOINT` | Tùy chọn: endpoint R2/MinIO; AWS có thể bỏ trống |
| `S3_FORCE_PATH_STYLE` | Tùy chọn `true`/`false`; đặt `true` cho MinIO |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Đi cặp; thiếu cả hai dùng credential chain mặc định của SDK/IAM role |

Lỗi cấu hình chỉ liệt kê tên biến thiếu/sai; không đưa giá trị, secret hay URL có credentials vào thông báo.
`publicUrl` ưu tiên base riêng theo driver, fallback `MEDIA_PUBLIC_BASE` khi biến riêng thiếu/rỗng;
không tự suy domain bucket từ endpoint API. Xem mẫu env ở `apps/web/.env.example`, `apps/admin/.env.example`;
worker dùng cùng cấu hình storage và cần đặt `MEDIA_BACKUP_DIR` tới thư mục backup đang giữ.

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

Contract chung chạy local và S3. `storage` tự dựng MinIO test trên `127.0.0.1:${LOCAL_MINIO_PORT:-49000}`, tạo bucket
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
Crash giữa put và promote có thể để lại object không có row; quét object không có row nằm ngoài E8-S06.
Sharp bỏ metadata mặc định, không gọi keepMetadata/withMetadata.

### Biến thể ảnh (E8-S03)

Job nền `media.scan` làm sạch ảnh rồi tạo sáu biến thể AVIF (quality 50) / WebP (quality 75),
theo các mốc w640/w1280/w1920, không phóng to. `Media.variants` lưu mảng `{ key, format, width, height, size }`;
width/height là kích thước thực, còn hậu tố w là mốc yêu cầu. GIF động/ảnh nhiều trang giữ bản gốc đã làm sạch,
không sinh biến thể. File private và biến thể dùng `private, no-store`.

Worker giới hạn sharp 50 megapixel, hạn chót chung 30 giây cho cả ảnh và các biến thể,
`sharp.concurrency(1)` / `sharp.cache(false)`. Ảnh không an toàn/quá hạn bị reject và dọn output;
lỗi storage vẫn được retry. Giới hạn tài nguyên container thuộc E10.

Publish chép gốc và biến thể sang `tenants/<tenantId>/…`, CAS cập nhật khóa/visibility/variants cùng lúc,
rồi dọn bản private (retry tiếp tục dọn nếu crash sau CAS). Khóa giữ UUID và dùng
`public, max-age=31536000, immutable`. JSON variants cũ không khớp schema được giữ nguyên;
backup/restore vẫn sao media bằng khóa, không lưu URL trong variants.

Quota chỉ tính dung lượng bản gốc đã làm sạch; biến thể không cộng quota. Pipeline chỉ tạo tối đa sáu biến thể
với chiều rộng không quá 1920 px; số pixel đầu vào vẫn bị chặn như trên. Phân phối srcset/loader/focal thuộc E8-S07.
Reservation là cận trên cho file client gửi, không phải trần output sharp. Khi ảnh sạch nở kích thước,
promote khóa Tenant và kiểm `used - reserved + actual` cùng trần loại, rồi lưu size thực; thiếu quota thì reject và dọn file.
Media được tham chiếu lúc publish vẫn đang scan sẽ có job publish chờ/retry. Chỉ khử trùng job đang pending/processing;
lần publish sau có thể tạo job mới khi job cũ done/failed. Các writer live và restore cũng enqueue theo refs hiện hành.
Nguồn: https://sharp.pixelplumbing.com/api-output/ và
https://github.com/aws/aws-sdk-js-v3/tree/main/packages/s3-request-presigner.

### Video tự host (E8-S04)

Chỉ gói Cao cấp có `videoUpload`: **200 MB/video, tối đa 10 phút**. Worker dùng ffprobe kiểm video thật,
ffmpeg lấy khung ở `min(1, duration / 2)` giây, tạo sáu poster AVIF/WebP cùng UUID/prefix với video.
File video giữ nguyên bytes; `Media.width/height` là kích thước video, quota chỉ tính file gốc.
Publish sao cả video và poster sang public rồi enqueue invalidate tag `tenant:<id>`; retry phục hồi lỗi ghi outbox sau publish.
Web chỉ resolve `source.provider=file` + Media UUID nếu ready/public/video của đúng tenant, khóa ở `tenants/<id>/`;
UUID chưa resolve bị bỏ, video tùy chọn bị bỏ mà vẫn giữ nội dung cha. Không phát video private ở preview.

Băng thông phát tính vào **CDN/VPS của nền tảng**; `mediaGb` chỉ giới hạn lưu trữ, chưa đo/giới hạn băng thông mỗi tenant.
Ưu tiên nhúng YouTube/TikTok/Bunny Stream khi cần adaptive streaming hoặc nhiều lượt xem; chưa transcode/HLS.
Local production phục vụ bằng Caddy như trên (hỗ trợ Range); S3/R2 cần policy public-read chỉ cho `tenants/`.
E2E tenant dùng `tooling/visual/media-server.mjs` ở cổng 3212 (GET/HEAD, Range 206, nosniff, chặn private/quarantine).

### Driver hỗn hợp, migration và retention (E8-S06)

`Tenant.storageDriver` chọn driver upload mới; null dùng `STORAGE_DRIVER` (mặc định local).
Đọc/scan/publish/xóa chọn driver theo `Media.driver`, nên các tenant hoặc các row cùng tenant có thể ở kho khác nhau.
`storageFor(kind)` chỉ kiểm cấu hình driver đó. URL ưu tiên `MEDIA_PUBLIC_BASE_LOCAL` / `MEDIA_PUBLIC_BASE_S3`,
fallback `MEDIA_PUBLIC_BASE`; khi chạy hỗn hợp hãy cấu hình hai base riêng.

Sau deploy migration và generate client, cấu hình cả local lẫn S3/R2 cho CLI, worker, admin và web.
Nạp biến môi trường DB platform; dùng slug tenant:

```bash
pnpm storage:migrate --tenant cong-ty-a --from local --to s3 --dry-run
pnpm storage:migrate --tenant cong-ty-a --from local --to s3
node scripts/media-crawl.mjs https://cong-ty-a.example/ https://cong-ty-a.example/du-an
```

CLI in `{copied,bytes,skipped,remaining}`; dry-run không ghi DB/object. Lệnh thật đổi driver upload mới trước,
chép gốc và biến thể từng row ready, đọc lại kiểm SHA-256 rồi mới đổi driver row và enqueue `tenant:<id>`.
Nguồn luôn giữ để URL CDN cũ vẫn chạy. Lỗi thiếu tệp/checksum giữ driver nguồn trên row đó; row đã chuyển vẫn dùng được.
Sửa lỗi rồi chạy lại. `remaining > 0` nghĩa là cần chạy lại; upload quarantine đang xử lý được chuyển sau khi ready.
Giữ cấu hình cả hai driver đến khi upload cũ hoàn tất; chờ outbox invalidate trước crawler.
R2 dùng `S3_ENDPOINT`, `S3_BUCKET`, cặp khóa và CDN base chặn private/quarantine như phần policy ở trên.

Kiểm 1 GB R2 thật khi triển khai: chọn tenant thử có ≥ 1 GB gốc/biến thể, ghi tổng byte nguồn, chạy dry-run rồi migrate;
lưu JSON kết quả và crawler trên mọi trang công khai sau invalidation. Yêu cầu `remaining=0`, crawler `failures=[]`,
media private vẫn cần quyền, local giữ nguyên để khôi phục. MinIO kiểm giao thức thay R2, không chứng minh băng thông R2 thật.

Cron tuần và `pnpm media:orphans --dry-run [--tenant slug]` tính live, nháp, descriptor cũ, mọi version và nội dung backup
còn giữ trong `MEDIA_BACKUP_DIR` (file JSON `tenant:export`; thư mục không public).
Lần đầu chỉ đặt `orphanedAt`; tham chiếu lại thì xóa dấu. Chỉ ready mồ côi hơn 30 ngày mới xóa row và khóa thuộc tenant.
Dry-run in `[{tenantId,id,key,orphanedAt}]`, không đánh dấu/xóa. Backup hỏng dừng cả lượt trước mọi mutation.
Inventory `media[]` không tự bảo vệ media mà nội dung backup không dùng.
Restore đọc driver từng row nguồn, ghi driver đích; thiếu tệp không dùng bỏ row và đếm `skipped`, thiếu tệp đang dùng thì dừng.
Xem [cron](../../CRON.md). Không xóa nguồn sau migration hoặc quét object không có row.
