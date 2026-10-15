# E16 — Tài khoản client & đặt lịch dịch vụ trên site công khai

**Mục tiêu**: khách hàng của khách hàng (vai trò `client`, D20) đăng ký/đăng nhập ngay trên site công khai, giỏ báo giá gắn
với tài khoản, đặt lịch dịch vụ (khảo sát, lắp đặt, bảo trì, vệ sinh tấm pin) và xem lại lịch sử. Client không vào được CMS,
không xem dashboard. Site admin quản lý client và lịch hẹn trong CMS.
**Target epic**: trang công khai vẫn là static/ISR sau khi bật đăng nhập (kiểm output `next build`); đăng ký → đặt lịch đầu
tiên ≤ 2 phút trên mobile; 0 trang cache chứa dữ liệu cá nhân (bộ test E14-S03).
**Phụ thuộc**: E5-S10, E15-S01, E6-S02.

> Khách vãng lai vẫn dùng được giỏ báo giá và đặt lịch (nhập SĐT) như hiện tại. Tài khoản thêm phần lưu giỏ, điền sẵn
> thông tin và xem lịch sử, không chặn luồng chuyển đổi.

---

### E16-S01 · Đăng ký & đăng nhập client trên site công khai
**Là** khách hàng của một công ty điện mặt trời, **tôi muốn** tạo tài khoản trên website của họ, **để** lưu giỏ báo giá và
theo dõi lịch hẹn.
- **Chi tiết** (theo D20, dùng `packages/auth` realm `site`, `audience: storefront`):
  - Thêm feature `clientAccounts` vào `packages/plans` (gói đề xuất ở D20), chạy lại `pnpm plans:table`.
  - Route động trong `apps/web` (`app/sites/[siteId]/…`): `/dang-nhap`, `/dang-ky`, `/xac-minh-email`, `/quen-mat-khau`,
    `/tai-khoan` (hồ sơ, đổi mật khẩu, đăng xuất các thiết bị, xóa tài khoản). `noindex`, không vào sitemap, chỉ trên
    tên miền chính (host khác đã 308 ở E5-S03).
  - Đăng ký bằng email + mật khẩu + tên + SĐT liên hệ (`contactPhone`), checkbox đồng ý xử lý dữ liệu cá nhân (Nghị định 13/2023).
    Tài khoản `unverified` cho tới khi bấm link xác minh (E11-S05, gửi với tên site). Đăng nhập bằng email, hoặc SĐT nếu
    `phone` đã được xác minh.
  - Header (`site-header` các variant `t15`, `minwy`) thêm `AccountMenu` client island: gọi `/api/me` (`private, no-store`)
    → "Đăng nhập" hoặc tên + menu. Chỉ hiện khi `can(site, "clientAccounts")`; không đổi schema header.
  - Chống spam đăng ký: rate-limit theo IP + honeypot. Turnstile/captcha để backlog.
  - Tắt `clientAccounts` → các route trên trả 404, `/api/me` trả khách vãng lai, phiên storefront bị từ chối.
- **AC**:
  - [ ] `next build`: trang chủ, trang sản phẩm, dịch vụ vẫn là static/ISR; chỉ `/dang-nhap`, `/tai-khoan/*`, `/api/*` là động.
  - [ ] Test: render trang chủ khi đang đăng nhập → HTML trả về (và entry cache) không chứa tên/email người dùng.
  - [ ] Owner của site đăng nhập ở `/dang-nhap` → được phiên storefront; dùng cookie đó gọi API admin → 401.
  - [ ] Client đăng ký ở site A dùng email đã có ở site B → thành công (tài khoản riêng); trùng email trong site A → báo đã tồn tại
        kèm link quên mật khẩu.
  - [ ] Tài khoản chưa xác minh không đặt lịch/lưu giỏ bằng tài khoản được (vẫn dùng luồng khách vãng lai).
  - [ ] Xóa tài khoản → thu hồi phiên, ẩn danh lịch sử (giữ lead/lịch hẹn cho site nhưng bỏ liên kết tài khoản).
- Phụ thuộc: E15-S01, E11-S05, E6-S02 · Agent: Codex (review Claude adversarial) · Cỡ: L

### E16-S02 · Giỏ báo giá gắn tài khoản
**Là** client, **tôi muốn** giỏ báo giá của tôi còn nguyên khi đổi thiết bị, **để** không phải chọn lại sản phẩm.
- **Chi tiết**:
  - Bảng `Cart` (`tenantId`, `siteUserId` unique theo tenant, `items JSONB` kiểm bằng schema giỏ của `packages/core/quoteCart`,
    `updatedAt`). Đăng nhập → gộp giỏ localStorage vào giỏ server (cộng số lượng, giữ giá theo bản ghi sản phẩm hiện tại).
  - Widget `quote-cart` giữ nguyên hành vi khách vãng lai; khi có phiên thì đồng bộ qua `/api/cart` (`no-store`).
  - Gửi yêu cầu báo giá → `Lead` (`source: quote-cart`) thêm `siteUserId?` (khóa ghép cùng tenant), điền sẵn tên/SĐT/địa chỉ.
  - `/tai-khoan/bao-gia`: lịch sử yêu cầu báo giá và trạng thái lead (chỉ trạng thái, không hiện ghi chú nội bộ).
- **AC**:
  - [ ] Thêm sản phẩm trên điện thoại → đăng nhập trên máy tính thấy cùng giỏ.
  - [ ] Gộp giỏ không nhân đôi khi đăng nhập lại nhiều lần (test idempotent).
  - [ ] Tenant không có `quoteCart` → API giỏ trả 403 (E6-S02).
- Phụ thuộc: S01, E11-S01 · Agent: Codex · Cỡ: M

### E16-S03 · Đặt lịch dịch vụ
**Là** khách hàng, **tôi muốn** chọn dịch vụ và ngày giờ mong muốn để công ty đến khảo sát/lắp đặt/bảo trì, **để** không phải gọi điện.
- **Chi tiết**:
  - Thêm feature `booking` vào `packages/plans` (gói đề xuất ở D20).
  - Collection `Service` thêm trường tùy chọn `booking: { enabled, durationMinutes?, leadTimeDays, slots: ("morning"|"afternoon")[] }`
    (migration + `schemaVersion` theo AGENTS.md §4).
  - Section type mới `booking` (`packages/sections/booking/schema.ts`, `meta.entitlement: "booking"`, variant `t15` và
    `minwy`, theo skill `solar-section-variant`) + nút "Đặt lịch" trên trang chi tiết dịch vụ.
  - Bảng `Booking` (`tenantId`, `siteUserId?`, `serviceId`, `date`, `slot`, `contactName`, `contactPhone`, `address`,
    `province`, `note`, `status requested|confirmed|rescheduled|done|cancelled`, `assignedSiteUserId?`, `staffNote`).
    Khách vãng lai đặt được (nhập SĐT); client đã xác minh được điền sẵn và xem lịch sử ở `/tai-khoan/lich-hen`.
  - Tạo lịch → Outbox → kênh lead của tenant (E11-S02) + email xác nhận cho client có email. Client hủy được lịch còn `requested`.
- **Target**: form đặt lịch hoàn tất ≤ 60 s trên mobile 390 px.
- **AC**:
  - [ ] Ngày trước `leadTimeDays`, slot không bật, dịch vụ không cho đặt → server từ chối, báo lỗi tiếng Việt.
  - [ ] Client A không xem/hủy được lịch của client B (404).
  - [ ] Section `booking` đổi theme/variant không mất nội dung; tenant không có `booking` → section không render, API 403.
  - [ ] Hoạt động khi tắt JavaScript (form POST thường, AGENTS.md §4).
- Phụ thuộc: S01, E11-S02, E7-S06 · Agent: Codex · Cỡ: L

### E16-S04 · Quản lý client & lịch hẹn trong CMS site
**Là** owner/nhân viên của site, **tôi muốn** xem danh sách khách có tài khoản và xử lý lịch hẹn, **để** phục vụ khách đúng hẹn.
- **Chi tiết**:
  - Menu "Khách hàng": danh sách client (tên, email, SĐT, ngày đăng ký, số lịch hẹn/yêu cầu báo giá), tìm kiếm, khóa/mở,
    gửi link đặt lại mật khẩu, tạo tài khoản tại quầy bằng SĐT (đặt `phone` đã xác minh), xóa theo yêu cầu (Nghị định 13/2023).
  - Menu "Lịch hẹn": dạng danh sách + lịch tuần, lọc theo trạng thái/dịch vụ/tỉnh, đổi trạng thái, đổi ngày (gửi thông báo
    cho client), gán nhân viên phụ trách, ghi chú nội bộ.
  - Permission mới: `clients.view`, `clients.manage`, `bookings.view`, `bookings.manage` (vào bảng vai trò của `packages/auth`;
    super admin tắt được theo E15-S05).
- **AC**:
  - [ ] Vai trò `viewer` xem được lịch hẹn nhưng không đổi trạng thái (server 403).
  - [ ] Đổi ngày lịch hẹn → client thấy ngày mới ở `/tai-khoan/lich-hen` và nhận email (nếu có email).
  - [ ] Danh sách 10.000 client tải ≤ 1 s (phân trang phía server).
- Phụ thuộc: S02, S03, E7-S02 · Agent: Codex · Cỡ: M
