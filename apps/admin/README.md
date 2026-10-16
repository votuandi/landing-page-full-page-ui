# Site admin

CMS từng tenant tại `<slug>.admin.<PLATFORM_DOMAIN>`. E7-S01 cung cấp đăng nhập và phân quyền;
khung điều hướng đầy đủ, theme admin và màn hình quản lý nội dung thuộc các story E7 tiếp theo.

## Chạy local

```sh
pnpm install --store-dir D:/.pnpm-store
pnpm --filter admin dev
```

Sao chép `.env.example` thành `.env.local`, đặt `DATABASE_URL` của **app_runtime**, `PLATFORM_DOMAIN=solar.localhost`,
`ADMIN_SESSION_SECRET` ít nhất 32 byte ngẫu nhiên; bật `REDIS_URL` khi chạy nhiều instance.
Không dùng credential app_platform cho app. Database đã migrate và seed bằng tooling `@solar/db`.
Truy cập `http://demo-t15.admin.solar.localhost:3300/dang-nhap` hoặc host tenant tương ứng.
Nếu OS không phân giải `*.localhost`, thêm host vào hosts file trỏ `127.0.0.1`.

Production phải đi qua HTTPS/Caddy, giữ Host gốc và ghi đè các header IP của client. Không public trực tiếp port app.
Cookie production `__Host-site_sid`, HttpOnly/Secure/Lax/Path=/, không có Domain; dev HTTP dùng `site_sid`.
Phiên tuyệt đối 7 ngày, idle 12 giờ. Trang cá nhân không cache; response private/no-store, noindex, cấm iframe.
Next dev có thể ghi đè Cache-Control HTML thành `no-cache, must-revalidate`; API luôn private/no-store.

## Luồng tài khoản

- Tenant lấy từ Host hợp lệ, không lấy từ form hoặc header tenant do client gửi. Host lạ → 404, site ngừng → 403;
  không có form đăng nhập. Cache routing tối đa 60 giây; auth vẫn đọc trạng thái tenant/tài khoản từ DB.
- Next 16 redirect sau Server Action dùng fetch nội bộ và bỏ Host. Proxy cấp context host mã hóa/xác thực 5 phút
  cho lượt fetch đó; Host admin hợp lệ luôn được ưu tiên. Header forwarded/tenant giả không thể đổi tenant.
- Platform, client và cookie storefront không vào được CMS. Permission lấy theo role trừ policy tenant.
  Trang kiểm `requirePagePermission`; action/route kiểm server guard. Phiên buộc đổi mật khẩu
  chỉ được đổi mật khẩu/đăng xuất, không được gọi public action khác để vượt chặn.
- Email/SĐT/username; sai 5 lần khóa 15 phút. TOTP optional, khuyến nghị owner/admin.
  Challenge AES-GCM/HttpOnly/5 phút gắn tenant/purpose; setup gắn session. Không đưa mật khẩu vào HTML/log/localStorage.
  Mã dự phòng hiển thị một lần sau khi bật TOTP.
- Lời mời dùng `SiteToken(invite)` 72 giờ; reset 1 giờ; magic 15 phút. DB lưu SHA-256, consume CAS trong transaction.
  Reset/nhận mời cập nhật mật khẩu, thu hồi mọi audience/session và vô hiệu token còn lại.
  Magic vẫn kiểm TOTP, yêu cầu POST xác nhận để trình quét link email không tự đăng nhập/tiêu token.
- Token và email được ghi cùng transaction vào Outbox `mail.send` (`{to, template, url}`). Gửi email thật thuộc E11-S05;
  không in link/token ra log kể cả dev. Debug local bằng Outbox qua công cụ quản trị DB được cấp quyền.
  Phản hồi yêu cầu link luôn giống nhau, gồm hướng dẫn tài khoản chỉ có SĐT, không tiết lộ email tồn tại.
- `/tai-khoan/khoi-phuc` gợi ý thêm email/SĐT sau đổi mật khẩu; cập nhật/xác minh thông tin thuộc luồng tiếp theo.
  `createAccounts(...).createSiteInvite` là helper server kiểm `users.manage` cho E7-S12.

## Thêm action/route

Export action từ module `use server` qua `action(permission, zodSchema, handler)`.
Handler nhận dữ liệu đã parse và context server `{tenantId, slug, session}`; không tin previous state.
Action trả `{ok, error?, status?, ...}`: `status` là mã nghiệp vụ trong payload, không thay HTTP transport của Next.
Route dùng `route(permission, handler)`, trả HTTP 401/403 thật. Quyền `public` chỉ allowlist cho đăng nhập/khôi phục;
`session` chỉ dành cho đăng xuất. Không export hàm trần, action inline hoặc re-export action.

`src/__tests__/actions.test.ts` quét toàn bộ source, đối chiếu export và metadata từ module thật;
action mới thiếu wrapper/permission hoặc public ngoài allowlist làm test thất bại. Guard không chỉ ẩn menu.

## Kiểm tra

```sh
pnpm --filter admin typecheck
pnpm --filter admin lint
pnpm --filter admin test
pnpm --filter admin lint:tokens
pnpm --filter @solar/visual exec playwright test --config playwright.admin.config.ts --project chromium
```

Integration cần `DATABASE_URL` và `PLATFORM_DATABASE_URL`; thiếu env skip có lý do, không mở connection khi import.
Suite đóng DB trong after/finally. E2E cần seed demo (`SEED_PASSWORD`), fixture tenant riêng `[DỮ LIỆU MẪU]`,
ghi invalidation qua Outbox, setup trước warm-up route và cleanup sau test. E2E dùng `ADMIN_E2E_PLATFORM_DOMAIN`
(mặc định `solar.localhost`; Chromium tự phân giải `*.localhost`). Không dùng miền công khai giả như preview: Chromium
chặn tải JS từ miền công khai trỏ về loopback (Local Network Access) nên trang 403 cần JS hiện trắng. Lệnh trên chỉ chạy config admin.

Dependency dùng phiên bản đã có: Next/React cho app; workspace auth/db cho phiên/RLS, core/ui/tokens/themes
theo kiến trúc; zod validate; ioredis chia sẻ giới hạn đăng nhập. Không thêm thư viện QR/email provider.
