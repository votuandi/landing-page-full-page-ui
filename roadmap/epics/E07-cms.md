# E7 — CMS quản trị nội dung (`apps/admin`)

**Mục tiêu**: khách tự quản lý nội dung, thứ tự và bật/tắt section, media, lead; super admin quản lý tenant.
**Target epic**: khách không rành kỹ thuật sửa xong tiêu đề hero + thêm 1 dự án trong ≤ 5 phút (thử với 3 người dùng thật);
CMS chỉ hiện form của section có trong cấu hình.
**Phụ thuộc**: E5-S01…S05, E3 (schema), E6-S02.

---

### E7-S01 · Đăng nhập & phân quyền
**Là** chủ doanh nghiệp, **tôi muốn** đăng nhập và mời nhân viên với quyền hạn chế, **để** an toàn.
- **Chi tiết**: email + mật khẩu (argon2/bcrypt) và magic link; phiên cookie httpOnly; vai trò `owner|editor|viewer` theo tenant;
  `platform_admin` cho đội vận hành. Một user thuộc nhiều tenant → bộ chọn tenant. Học từ luồng JWT của branch `develop`
  (`api/auth/*`) nhưng không lưu JWT trong localStorage. Rate-limit đăng nhập, khóa 15 phút sau 5 lần sai.
- **AC**:
  - [ ] Editor không vào được trang Tên miền, Gói, Thành viên.
  - [ ] Mọi Server Action kiểm membership (test cho từng action).
  - [ ] 2FA TOTP tùy chọn cho owner.
- Agent: Claude · Cỡ: L

### E7-S02 · Khung admin & điều hướng
- **Chi tiết**: layout admin dùng `packages/ui` + theme admin riêng (không theo theme tenant); menu: Tổng quan, Trang & Section,
  Nội dung (các collection), Media, Lead, Giao diện, Tên miền, Email theo tên miền, Thành viên, Gói. Mobile dùng được.
- **AC**: [ ] Lighthouse a11y ≥ 95 cho các trang admin chính · [ ] Menu ẩn mục ngoài quyền/ngoài gói (vẫn kiểm server).
- Phụ thuộc: S01 · Agent: Claude · Cỡ: M

### E7-S03 · Form tự sinh từ schema zod
**Là** dev, **tôi muốn** không phải viết tay form cho 28 section, **để** thêm section mới là có form ngay.
- **Chi tiết**: `<SchemaForm schema={…} value onChange/>` duyệt zod: string/number/boolean/enum, `localized` (tab VI/EN —
  EN chỉ khi có `bilingual`), `mediaRef` (mở thư viện media), `link` (chọn trang/neo/tel/Zalo/calculator), `richText`
  (editor tối giản: đậm, nghiêng, link, danh sách), mảng (thêm/xóa/kéo sắp xếp), object lồng, `collectionQuery`.
  Validate inline bằng chính schema; thông báo lỗi tiếng Việt.
- **Target**: 28/28 type có form dùng được không cần code riêng (cho phép override widget theo trường).
- **AC**:
  - [ ] Form của `calculator` cho sửa bảng giá điện, đơn giá/kWp, hệ số sản lượng; nhập sai kiểu bị chặn.
  - [ ] Test round-trip cho 28 type: fixture → form → submit không chỉnh sửa → dữ liệu ra bằng đúng dữ liệu vào (deep equal).
- Phụ thuộc: E3-S02 · Agent: Claude · Cỡ: L

### E7-S04 · Màn hình sắp xếp & bật/tắt section
**Là** tenant gói Nâng cao, **tôi muốn** kéo đổi thứ tự, bật/tắt và đổi variant section, **để** bố cục trang theo ý tôi.
- **Chi tiết**: danh sách section của trang (tên, variant, thumbnail, công tắc), kéo thả (dnd-kit, có bàn phím), menu
  "Đổi kiểu hiển thị" liệt kê variant cùng type (ảnh thumbnail chụp sẵn với theme hiện tại), "Thêm section" từ thư viện
  (khóa theo gói, E6-S04), xóa (dữ liệu giữ 30 ngày). Gói Cơ bản: chỉ sửa nội dung, không sắp xếp.
- **AC**:
  - [ ] Đổi variant hero t08 → t15: nội dung giữ nguyên, preview cập nhật.
  - [ ] Thao tác lưu vào draft; "Xuất bản" mới revalidate.
  - [ ] Ràng buộc `maxPerPage` (vd. chỉ 1 calculator) được kiểm cả client và server.
- Phụ thuộc: S03, E5-S07 · Agent: Claude · Cỡ: M

### E7-S05 · Sửa nội dung section kèm xem trước
- **Chi tiết**: chia đôi màn hình: form (S03) bên trái, iframe preview (draft mode trên `<slug>.preview.<platform>` — xem
  E5-S07, không dùng tên miền khách để tránh vấn đề cookie bên thứ ba) bên phải; cuộn tới
  section đang sửa; cập nhật preview khi lưu nháp (debounce 800 ms).
- **AC**: [ ] Từ lúc gõ đến lúc preview cập nhật ≤ 2 s · [ ] Rời trang khi chưa lưu → cảnh báo.
- Phụ thuộc: S03, S04 · Agent: Claude · Cỡ: M

### E7-S06 · Quản lý collection
**Là** tenant, **tôi muốn** thêm/sửa sản phẩm, dự án, video Shorts, bài viết, FAQ, đánh giá, chi nhánh, chứng chỉ, thương hiệu, báo chí, dịch vụ, **để** các section tự cập nhật.
- **Chi tiết**: CRUD chung sinh từ schema collection (`packages/db/collections/*.ts` zod); danh sách có tìm kiếm, lọc, sắp xếp
  kéo thả, nhân bản, trạng thái nháp/xuất bản, slug tự sinh không dấu và kiểm trùng; sản phẩm có giá/giá giảm (quy tắc
  `packages/core/price`), nhiều ảnh, thông số; video có `provider` youtube/tiktok/file/bunny; nhập/xuất CSV cho sản phẩm.
- **AC**:
  - [ ] Lưu dự án → revalidate tag `collection:projects` (trang chủ + trang dự án cập nhật).
  - [ ] Collection ngoài gói (vd. sản phẩm khi không có `catalog`) bị ẩn và API từ chối.
- Phụ thuộc: S03, E5-S05 · Agent: Codex · Cỡ: L

### E7-S07 · Thông tin công ty & cấu hình chung
- **Chi tiết**: tương đương `site.config.ts` của t15 nhưng trong DB: thương hiệu, pháp lý, chi nhánh (lat/lng, hotline),
  Zalo, mạng xã hội, số liệu, điểm đánh giá, cam kết, popup, giờ gọi lại, top bar, mega menu, ngôn ngữ.
- **AC**: [ ] Import một file `site.config.ts` của t14/t15 vào tenant bằng script `pnpm import:site-config` (dùng cho E13).
- Phụ thuộc: S03 · Agent: Codex · Cỡ: M

### E7-S08 · Giao diện: chọn theme & override
**Là** tenant, **tôi muốn** chọn theme và đổi màu chính/logo/font trong giới hạn, **để** đúng nhận diện thương hiệu.
- **Chi tiết**: lưới theme được phép theo gói (preview thumbnail + "Xem thử" toàn trang qua preview); gói Cao cấp: color picker
  cho `primary`, `secondary`, `accent` có kiểm tương phản (E2-S05) và gợi ý màu đạt chuẩn; chọn font trong danh sách cho phép;
  logo sáng/tối, favicon (sinh `icon.png`, `apple-icon.png`).
- **AC**: [ ] Màu không đạt AA bị từ chối kèm gợi ý · [ ] Đổi theme giữ nguyên toàn bộ nội dung section.
- Phụ thuộc: E2-S05, S02 · Agent: Claude · Cỡ: M

### E7-S09 · Super admin: quản lý tenant
- **Chi tiết**: danh sách tenant (gói, hạn, dung lượng, số lead tháng, trạng thái tên miền), tạo tenant từ preset (E13-S01),
  đổi gói, tạm ngưng, "đăng nhập thay" (impersonate có audit, banner cảnh báo), xem audit log.
- **AC**: [ ] Mọi thao tác ghi `AuditLog` · [ ] Impersonate hết hạn sau 30 phút.
- Phụ thuộc: S01, E6-S03 · Agent: Codex · Cỡ: M

### E7-S10 · Sao lưu & khôi phục theo tenant
- **Chi tiết**: học từ branch `develop` (backup JSON + zip media, lịch sử backup). Xuất toàn bộ dữ liệu một tenant
  (JSON + danh sách media) và khôi phục vào tenant mới (dùng cho nhân bản site, chuyển máy chủ). Backup toàn DB ở E10-S06.
- **AC**: [ ] Xuất → khôi phục sang tenant mới cho site giống hệt (ảnh chụp so khớp) · [ ] Chỉ owner thực hiện được.
- Phụ thuộc: E8-S01 · Agent: Codex · Cỡ: M
