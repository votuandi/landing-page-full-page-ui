# Cron trong worker

`apps/worker/src/main.ts` dùng `every()`: chạy ngay khi khởi động, đợi hoàn tất rồi hẹn lượt kế tiếp.
Không chồng lượt trong một process; SIGTERM/SIGINT đợi tác vụ đang chạy trước khi đóng DB.

| Công việc | Chu kỳ | Phạm vi |
|---|---|---|
| Override hết hạn | 5 phút | Quét thay đổi quyền, audit + invalidate |
| Gia hạn | 1 giờ | Nhắc hạn / khóa sau ân hạn |
| Section đã gỡ | 6 giờ | Nội dung đã gỡ > 30 ngày |
| Upload quá hạn | 1 giờ | Quarantine > 24 giờ, dọn theo driver row |
| Media mồ côi | 7 ngày | Ready không tham chiếu > 30 ngày |

## Media mồ côi (E8-S06)

Tham chiếu gồm section live/draftData, Page.sections/draftSections cũ có data, mọi PageVersion.snapshot,
collection, site profile và nội dung các bản backup JSON còn giữ trong `MEDIA_BACKUP_DIR`.
Inventory `media[]` của backup không phải tham chiếu. File JSON hỏng hoặc thư mục cấu hình không đọc được dừng cả lượt.
Thư mục backup ở ngoài public, chỉ process vận hành được ghi. Dùng `tenant:export` để tạo bundle;
retention/backup DB vật lý do hạ tầng quản lý, không có endpoint cron công khai.

Lần quét đầu ghi `orphanedAt`, không xóa. Tham chiếu lại xóa dấu mồ côi. Chỉ ready có dấu cũ hơn 30 ngày mới đủ điều kiện.
Mỗi tenant dùng transaction Serializable, ghi `media.orphan_deleted`, invalidate public cùng transaction;
race làm transaction abort sẽ giữ tệp. Sau commit mới xóa gốc/biến thể đúng prefix tenant, đúng `Media.driver`.
Log danh sách trước khi xóa. Lỗi xóa object sau commit cần vận hành xử lý từ log/audit vì row đã xóa;
quét object không có row nằm ngoài story. Cấu hình đủ storage/backup trên worker.

```bash
pnpm media:orphans --dry-run
pnpm media:orphans --dry-run --tenant cong-ty-a
pnpm media:orphans --tenant cong-ty-a
```

Dry-run in JSON `[{tenantId,id,key,orphanedAt}]`, không ghi dấu, không xóa DB hay object.
CLI và worker dùng `PLATFORM_DATABASE_URL` (role `app_platform`), thao tác qua `forPlatform()` + repository tenant.
Không dùng `app_runtime` để quét chéo tenant.

Chuyển kho, checksum, crawler và kiểm 1 GB R2 thật: [storage README](packages/storage/README.md).
