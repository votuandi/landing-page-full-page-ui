# E8 — Lưu trữ media: SSD VPS / S3 / R2

**Mục tiêu**: ảnh và video của khách lưu được ở SSD của VPS, AWS S3 hoặc Cloudflare R2 — đổi bằng biến môi trường,
code ứng dụng không biết driver nào đang chạy.
**Target epic**: chuyển toàn bộ media một tenant từ local sang R2 bằng một lệnh, site không gián đoạn; ảnh phục vụ qua CDN
dạng AVIF/WebP đúng kích thước; LCP ảnh hero ≤ 2,5 s trên 4G.
**Phụ thuộc**: E5-S01.

---

### E8-S01 · Interface `StorageDriver` + driver local và S3
**Là** dev, **tôi muốn** một API lưu file duy nhất, **để** deploy VPS hay AWS không phải sửa code.
- **Chi tiết**: `packages/storage`:
  ```ts
  interface StorageDriver {
    put(key, body, { contentType, cacheControl }): Promise<void>;
    delete(key): Promise<void>;  list(prefix): AsyncIterable<string>;  head(key): Promise<Meta | null>;
    publicUrl(key): string;      signedUploadUrl?(key, opts): Promise<{ url, fields? }>;
  }
  ```
  `local` (thư mục `STORAGE_LOCAL_ROOT`, URL `MEDIA_PUBLIC_BASE`, ghi file nguyên tử: tạm → rename), `s3` (`@aws-sdk/client-s3`,
  dùng cho AWS S3, Cloudflare R2 qua `S3_ENDPOINT`, MinIO cho dev). Chọn bằng `STORAGE_DRIVER=local|s3`.
  Khóa luôn `tenants/<tenantId>/<yyyy>/<mm>/<uuid>.<ext>` — không dùng tên file người dùng.
- **AC**:
  - [ ] Cùng bộ test hợp đồng (contract test) chạy qua cho `local` và `s3` (MinIO trong CI).
  - [ ] Không có import `fs` ngoài driver local.
- Agent: Codex · Cỡ: M

### E8-S02 · Upload an toàn
**Là** tenant, **tôi muốn** tải ảnh/video lên nhanh và an toàn, **để** cập nhật nội dung dễ dàng.
- **Chi tiết**: kiểm MIME bằng magic bytes (không tin phần mở rộng), giới hạn kích thước theo loại (ảnh 15 MB, video 200 MB,
  PDF 20 MB), chặn SVG có script (sanitize hoặc cấm SVG từ khách), xóa EXIF GPS.
  **Vùng cách ly**: mọi upload (presigned S3/R2 hoặc stream local) ghi vào `quarantine/<tenantId>/<uuid>` — không public;
  worker kiểm tra → chuyển sang khóa public `tenants/<tenantId>/…` và đặt `status=ready`; lỗi → xóa. Upload dở > 24 h bị dọn.
  **Hạn mức nguyên tử**: trước khi cấp presigned URL, đặt chỗ (`reservedBytes`) trong transaction có khóa hàng theo tenant;
  hoàn tất/hủy thì trả chỗ → nhiều upload đồng thời không vượt `mediaGb`.
  Media gắn với nội dung nháp có `visibility=private` (phục vụ qua route có kiểm quyền / signed URL ngắn hạn), chỉ chuyển public
  khi nội dung được xuất bản. Khóa UUID không được coi là cơ chế phân quyền.
- **AC**:
  - [ ] File `.jpg` thực chất là HTML bị từ chối; file trong quarantine không truy cập được qua URL public.
  - [ ] Upload video 200 MB qua presigned không đi qua server Next.js.
  - [ ] 10 upload đồng thời sát hạn mức → tổng không vượt `mediaGb`.
  - [ ] Media private của tenant B không đọc được khi biết khóa (test E14-S03).
  - [ ] Dung lượng đã dùng hiển thị đúng trong admin.
- Phụ thuộc: S01, E6-S02, E7-S01 · Agent: Codex (review Claude adversarial) · Cỡ: L

### E8-S03 · Biến thể ảnh & phân phối
- **Chi tiết**: sau upload, `sharp` tạo `w640/w1280/w1920` AVIF + WebP, lưu `variants` trong `Media`; `<Media>` của
  `packages/ui` chọn `srcset`; dùng `images.loader` tùy biến cho `next/image` trỏ thẳng file đã tối ưu (không tốn CPU tối ưu
  lúc chạy). Cache-Control `public, max-age=31536000, immutable` (khóa có uuid). Ảnh có `focal` để crop đúng chủ thể.
- **Target**: ảnh hero trang chủ ≤ 200 KB ở 1280px.
  Giới hạn khi xử lý (sharp/ffmpeg): tối đa 50 megapixel, timeout 30 s/ảnh, 10 phút/video, giới hạn RAM/CPU của container worker.
- **AC**: [ ] Lighthouse không báo "properly size images" ở trang chủ seed · [ ] Xử lý ảnh chạy nền (outbox/queue), UI hiển thị trạng thái ·
  [ ] Ảnh "decompression bomb" bị từ chối, worker không chết.
- Phụ thuộc: S01 · Agent: Codex · Cỡ: M

### E8-S04 · Video
- **Chi tiết**: video Shorts ưu tiên nhúng YouTube/TikTok/Bunny Stream (rẻ, có adaptive streaming); video tự host (gói Cao cấp)
  lưu nguyên file + poster tự sinh (ffmpeg trong worker) — ghi rõ giới hạn băng thông trong gói.
- **AC**: [ ] Shorts với `provider=file` phát được từ local và R2 · [ ] Poster sinh tự động.
- Phụ thuộc: S03 · Agent: Codex · Cỡ: M

### E8-S05 · Thư viện media trong CMS
- **Chi tiết**: lưới ảnh, tìm theo tên/alt, lọc loại, kéo thả upload nhiều file, sửa alt (bắt buộc với ảnh nội dung), chọn
  điểm focal, xem nơi đang dùng; xóa ảnh đang dùng → cảnh báo danh sách chỗ dùng.
- **AC**: [ ] Không xóa được media đang được tham chiếu nếu không xác nhận · [ ] Alt trống hiện cảnh báo SEO.
- Phụ thuộc: S02, E7-S02 · Agent: Claude · Cỡ: M

### E8-S06 · Dọn media mồ côi & chuyển driver
- **Chi tiết**: cron tuần (học từ `CRON.md` của develop) liệt kê media không được tham chiếu > 30 ngày — tham chiếu tính cả
  `draftData`, `draftSections`, `PageVersion` và bản backup còn giữ → xóa; lệnh
  `pnpm storage:migrate --tenant <id> --from local --to s3` sao chép, kiểm checksum, cập nhật `driver`, revalidate.
- **AC**: [ ] Chuyển 1 GB media sang R2 không có ảnh vỡ (crawler kiểm 0 lỗi 404) · [ ] Dry-run in danh sách trước khi xóa.
- Phụ thuộc: S01 · Agent: Codex · Cỡ: M
