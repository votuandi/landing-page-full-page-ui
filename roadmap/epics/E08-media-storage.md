# E8 — Lưu trữ media: SSD VPS / S3 / R2

**Mục tiêu**: ảnh và video của khách lưu được ở SSD của VPS, AWS S3 hoặc Cloudflare R2 — đổi bằng biến môi trường,
code ứng dụng không biết driver nào đang chạy.
**Target epic**: chuyển toàn bộ media một tenant từ local sang R2 bằng một lệnh, site không gián đoạn; ảnh phục vụ qua CDN
dạng AVIF/WebP đúng kích thước; LCP ảnh hero ≤ 2,5 s trên 4G.
**Phụ thuộc**: E5-S01.

---

### E8-S01 · Interface `StorageDriver` + driver local và S3 ✅ · PR [#58](https://github.com/votuandi/landing-page-full-page-ui/pull/58)
**Là** dev, **tôi muốn** một API lưu file duy nhất, **để** deploy VPS hay AWS không phải sửa code.
- **Chi tiết**: `packages/storage`:
  ```ts
  interface StorageDriver {
    put(key, body, { contentType, cacheControl }): Promise<void>;
    delete(key): Promise<void>;  list(prefix): AsyncIterable<string>;  head(key): Promise<Meta | null>;
    publicUrl(key): string;      signedUploadUrl?(key, opts): Promise<{ url, fields? }>;
    get(key): Promise<Uint8Array | null>;  // E7-S10 (PR #59): đọc file để sao media khi khôi phục tenant
  }
  ```
  `local` (thư mục `STORAGE_LOCAL_ROOT`, URL `MEDIA_PUBLIC_BASE`, ghi file nguyên tử: tạm → rename), `s3` (`@aws-sdk/client-s3`,
  dùng cho AWS S3, Cloudflare R2 qua `S3_ENDPOINT`, MinIO cho dev). Chọn bằng `STORAGE_DRIVER=local|s3`.
  Khóa luôn `tenants/<tenantId>/<yyyy>/<mm>/<uuid>.<ext>` — không dùng tên file người dùng.
- **AC**:
  - [x] Cùng bộ test hợp đồng (contract test) chạy qua cho `local` và `s3` (MinIO trong CI).
  - [x] Không có import `fs` ngoài driver local.
- Agent: Codex · Cỡ: M

### E8-S02 · Upload an toàn ✅ · PR [#60](https://github.com/votuandi/landing-page-full-page-ui/pull/60)
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
  - [x] File `.jpg` thực chất là HTML bị từ chối; file trong quarantine không truy cập được qua URL public.
  - [x] Upload video 200 MB qua presigned không đi qua server Next.js.
  - [x] 10 upload đồng thời sát hạn mức → tổng không vượt `mediaGb`.
  - [x] Media private của tenant B không đọc được khi biết khóa (test E14-S03).
  - [x] Dung lượng đã dùng hiển thị đúng trong admin.
- Phụ thuộc: S01, E6-S02, E7-S01 · Agent: Codex (review Claude adversarial) · Cỡ: L

### E8-S03 · Biến thể ảnh & phân phối ✅ · PR [#62](https://github.com/votuandi/landing-page-full-page-ui/pull/62)
- **Chi tiết**: sau upload, `sharp` tạo `w640/w1280/w1920` AVIF + WebP, lưu `variants` trong `Media`; khóa biến thể đi cùng
  file gốc khi xuất bản, Cache-Control `public, max-age=31536000, immutable` (khóa có uuid).
  Phần phân phối (`<Media>` srcset, loader, focal, Lighthouse) tách sang E8-S07 (24/10/2026, plan quá ngưỡng 30 file).
- **Target**: ảnh hero trang chủ ≤ 200 KB ở 1280px (biến thể w1280).
  Giới hạn khi xử lý (sharp): tối đa 50 megapixel, timeout 30 s/ảnh, `sharp.concurrency(1)`; giới hạn RAM/CPU container → E10,
  10 phút/video → S04.
- **AC**:
  - [x] Xử lý ảnh chạy nền (outbox/queue), UI hiển thị trạng thái — job `media.scan`; e2e `admin.spec.ts` › "media status".
  - [x] Ảnh "decompression bomb" bị từ chối, worker không chết — worker `mediaScan.test.ts`: "decompression bomb rejected, worker survives".
- Phụ thuộc: S01 · Agent: Codex · Cỡ: M

### E8-S04 · Video ✅ · PR [#63](https://github.com/votuandi/landing-page-full-page-ui/pull/63)
- **Chi tiết**: video Shorts ưu tiên nhúng YouTube/TikTok/Bunny Stream (rẻ, có adaptive streaming); video tự host (gói Cao cấp)
  lưu nguyên file + poster tự sinh (ffmpeg trong worker) — ghi rõ giới hạn băng thông trong gói.
- **AC**: [x] Shorts với `provider=file` phát được từ local và R2 — e2e `tenant.spec.ts` › "shorts self-hosted video plays" (local, Range), worker `mediaScan.int.test.ts` › "s3 video publish serves range" (MinIO thay R2; R2 thật kiểm khi triển khai) · [x] Poster sinh tự động — worker `mediaScan.test.ts` + `mediaScan.int.test.ts` (ffmpeg thật, sáu biến thể AVIF/WebP).
- Phụ thuộc: S03 · Agent: Codex · Cỡ: M

### E8-S05 · Thư viện media trong CMS ✅ · PR [#64](https://github.com/votuandi/landing-page-full-page-ui/pull/64)
- **Chi tiết**: lưới ảnh, tìm theo tên/alt, lọc loại, kéo thả upload nhiều file, sửa alt (bắt buộc với ảnh nội dung), chọn
  điểm focal, xem nơi đang dùng; xóa ảnh đang dùng → cảnh báo danh sách chỗ dùng.
- **AC**: [x] Không xóa được media đang được tham chiếu nếu không xác nhận · [x] Alt trống hiện cảnh báo SEO.
- **Bằng chứng**: `packages/db/src/__tests__/mediaLibrary.int.test.ts` (xác nhận, FK, tenant, race 409),
  `apps/admin/src/__tests__/mediaLibrary.test.ts` (SEO); spec `media library: …` và `media status` trong
  `tooling/visual/admin.spec.ts` (upload kéo thả, alt, focal, nơi dùng, xóa 409/xác nhận, axe 390/1440, tắt JS, viewer).
- Phụ thuộc: S02, E7-S02 · Agent: Claude · Cỡ: M

### E8-S06 · Dọn media mồ côi & chuyển driver ✅ · PR [#65](https://github.com/votuandi/landing-page-full-page-ui/pull/65)
- **Chi tiết**: cron tuần (học từ `CRON.md` của develop) liệt kê media không được tham chiếu > 30 ngày — tham chiếu tính cả
  `draftData`, `draftSections`, `PageVersion` và bản backup còn giữ → xóa; lệnh
  `pnpm storage:migrate --tenant <id> --from local --to s3` sao chép, kiểm checksum, cập nhật `driver`, revalidate.
- **Quyết định** (25/10/2026): driver hỗn hợp theo tenant — `Tenant.storageDriver`, runtime đọc theo `Media.driver` từng row.
- **AC**: [ ] Chuyển 1 GB media sang R2 không có ảnh vỡ (crawler kiểm 0 lỗi 404) — `[ngoài agent]`: MinIO `storageMigrate.int`
  + e2e `tenant.spec.ts` › "media crawl has no 404" đã qua; R2 thật 1 GB chạy lúc triển khai theo `packages/storage/README.md`
  · [x] Dry-run in danh sách trước khi xóa — `mediaOrphans.int.test.ts` (dry-run, CLI exit 1 khi tenant lỗi), worker `mediaOrphans.test.ts`.
- **Bằng chứng**: db `mediaOrphans.int` (30 ngày, race khóa hàng, nháp/version/backup), `mediaRetention`, `storageMigrate(.int)`
  (MinIO, checksum, idempotent), `conformance` (15 preset + seed), worker `mediaOrphans`, storage `config`; crawler
  `scripts/media-crawl.mjs`.
- Phụ thuộc: S01 · Agent: Codex · Cỡ: M

### E8-S07 · Phân phối ảnh biến thể
- **Chi tiết** (tách từ S03): apps/web đổi `MediaRef` UUID (Media `ready` + `public` của đúng tenant) thành URL công khai khi
  render trang; `<Media>` của `packages/ui` dựng `<picture>` AVIF + WebP với `srcset` từ biến thể qua `loader` theo từng ảnh
  (`getImageProps`) — không bật `images.loader: "custom"` toàn cục vì nó tắt `/_next/image` của ảnh tĩnh. Các section dùng
  `next/image` trực tiếp đi cùng đường đó. Ảnh có `focal` để crop đúng chủ thể (`object-position`). Media chuyển public →
  worker enqueue invalidate tag tenant.
- **Target**: ảnh hero trang chủ ≤ 200 KB ở 1280px, không tốn CPU tối ưu ảnh lúc chạy cho media đã upload.
- **AC**: [x] Lighthouse không báo "properly size images" ở trang chủ seed — Lighthouse 12.8.2 `uses-responsive-images`
  score 1 (t15/t12, mobile + desktop) + e2e `tenant.spec.ts` › "homepage images properly sized" (heuristic Lighthouse,
  cuộn cả trang) · [x] Ảnh upload hiển thị bằng biến thể đúng kích thước, không qua `/_next/image` — e2e `tenant.spec.ts` ›
  "uploaded image uses variants", web `media.test.ts`, ui `mediaUrl.test.ts`, sections `Media.test.tsx`; Target ≤ 200 KB
  @1280 — worker `mediaScan.int.test.ts`.
- Phụ thuộc: S03 · Agent: Codex · Cỡ: M
