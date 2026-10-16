# @solar/auth

Thư viện xác thực dùng ở server cho hai realm riêng: `site` (SiteUser/SiteSession) và
`platform` (PlatformAdmin/PlatformSession). Không có UI đăng nhập hay luồng đổi ghost grant.
Entry `@solar/auth` không import Prisma; adapter PostgreSQL nằm ở `@solar/auth/db`.
Không tạo DB/Redis ở module scope. App tạo client khi cần, giữ pool trong vòng đời app và đóng khi dừng;
test phải đóng bằng `$disconnect()`/`quit()` trong `after`/`finally`.

## Cấu hình

```ts
import { createRealm, createLoginLimiter, redisCounter } from "@solar/auth";
import { siteStore, platformStore } from "@solar/auth/db";
import type { Db, PlatformDb } from "@solar/db";

// Gọi trong factory của app sau khi có client. Không đọc env hoặc mở kết nối khi import.
export function siteAuth(db: Db) {
  return createRealm({
    name: "site",
    secret: process.env.ADMIN_SESSION_SECRET!,
    sessionTtl: 7 * 24 * 60 * 60 * 1000,
    idleTtl: 30 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    store: siteStore(db, { audience: "admin" }),
  });
}
export function consoleAuth(db: PlatformDb) {
  return createRealm({
    name: "platform",
    secret: process.env.CONSOLE_SESSION_SECRET!,
    sessionTtl: 8 * 60 * 60 * 1000,
    idleTtl: 30 * 60 * 1000,
    store: platformStore(db),
  });
}
// Khi app đã sở hữu Redis client:
// const limiter = createLoginLimiter({ primary: redisCounter(redis) });
// Truyền limiter vào createRealm; app giữ nguyên instance giữa các request.
```

Hai secret phải độc lập, mỗi secret ít nhất 32 byte ngẫu nhiên. Thiếu/ngắn → lỗi khi gọi `createRealm`.
TTL và thời gian trong TOTP dùng **milliseconds**; `totp` option `step` dùng seconds.
Production dùng cookie `__Host-site_sid`/`__Host-platform_sid`, `Secure; HttpOnly; SameSite=Lax; Path=/`,
không có `Domain`. `secure: false` dành cho HTTP localhost: tên cookie bỏ `__Host-`.
`cookieOptions()` cho tên/options để app đọc cookie; kết quả `login`/`rotate` có `cookie` gồm cả `value`.
App chỉ gửi phần `cookie` qua Set-Cookie và dữ liệu phiên đã lọc; không trả token trong JSON.
Cookie là `<random token>.<HMAC-SHA256(realm:token)>`; DB chỉ giữ SHA-256 của token.
MAC sai bị từ chối trước khi đọc DB. Đổi secret sẽ vô hiệu toàn bộ cookie của realm tương ứng.

## API phiên

- `login({ identifier, password, totp?, tenantId?, ip, userAgent })` trả `{ ok: true, cookie, session }`
  hoặc `{ ok: false, reason, message, retryAfterSec? }`. Realm platform chỉ nhận email.
  `parseLoginId` chuẩn hóa email, di động Việt Nam, username (3–70 ký tự theo D21 và CHECK DB);
  lỗi ném `InvalidLoginIdError`.
- `getSession(cookieValue, { tenantOfHost? })` trả phiên đã lọc hoặc `null`.
  Realm site luôn cần tenant do server phân giải từ host; không lấy tenant từ form/body của người dùng.
  Store site cố định audience: cookie storefront không mở phiên admin, role client không vào admin.
  Mỗi lần đọc kiểm tài khoản/tenant còn hoạt động, thời hạn tuyệt đối và idle; touch tối đa mỗi phút.
- `loginWithToken({ accountId, tenantId?, totp?, ip, userAgent }, consume)` chỉ dùng từ server sau khi tra
  token ngẫu nhiên bằng hash, đúng tenant/purpose/expiry. Không nhận `accountId` trực tiếp từ trình duyệt.
  `consume()` phải chiếm token nguyên tử và trả `false` nếu hết hạn/đã dùng. Realm kiểm tài khoản,
  audience, thời hạn mật khẩu tạm và TOTP như đăng nhập mật khẩu; chỉ cấp phiên sau khi consume thành công.
  Khi trả `totp_required`, token chưa dùng để app có thể hỏi mã qua challenge HttpOnly ngắn hạn.
- `requireSession(cookieValue, { tenantOfHost?, allowMustChange? })` ném `UnauthenticatedError` (401)
  hoặc `MustChangePasswordError` (403). Chỉ route đổi mật khẩu dùng `allowMustChange: true`.
- `logout(cookieValue, { tenantOfHost? })` xóa phiên; app xóa cookie với cùng tên/path.
- `rotate(cookieValue, { tenantOfHost? })` trả cookie/phiên mới. Hash token được thay nguyên tử trên
  cùng row, thời hạn tuyệt đối giữ nguyên; cookie cũ hết hiệu lực ngay cả khi hai yêu cầu đổi token đồng thời.
- `revokeAll(accountId, { tenantId?, except? })` dành cho caller server đã kiểm quyền;
  site bắt buộc `tenantId`, `except` là session id. Thu hồi cả audience admin và storefront của user.

`session` chỉ có id, realm, tenant/account id, kind, audience, role, mustChangePassword, permissions, expiresAt.
Không có password hash, TOTP secret, backup hash, token hash. Các API bảo mật nhận **chính object phiên**
do realm trả về trong request hiện tại; không serialize rồi dựng lại object từ client. Mỗi thao tác vẫn
đọc lại phiên/account/policy để kiểm thu hồi và quyền, không tin snapshot cũ.

## Mật khẩu và TOTP

- `hashPassword`/`verifyPassword`: scrypt async N=32768, r=8, p=1, key 32 byte, salt ngẫu nhiên 16 byte,
  định dạng tương thích seed `scrypt$N$r$p$salt$hash`, base64url. Hash sai định dạng trả false.
  `dummyVerify` chạy một scrypt cho tài khoản không tồn tại. Không ghi password/hash vào log.
- `checkPasswordPolicy(password, { identifiers })`: 10–128 ký tự, không trùng định danh và không nằm
  trong danh sách chặn (không phân biệt hoa thường). 1.000 mục đầu từ
  [SecLists](https://github.com/danielmiessler/SecLists/blob/master/Passwords/Common-Credentials/10k-most-common.txt),
  thêm mật khẩu tiếng Việt và chuỗi phổ biến; giấy phép MIT ở `COMMON_PASSWORDS_LICENSE.txt`.
- `changePassword(session, { current, next })`: kiểm current (trừ phiên buộc đổi), kiểm policy, lưu hash,
  xóa cờ buộc đổi/thời hạn mật khẩu tạm, thu hồi phiên khác, đổi token phiên hiện tại. Trả `{ cookie, session }`.
  Mật khẩu tạm hết hạn bị từ chối cả khi đăng nhập lẫn khi đọc phiên.
- `beginTotp(session)` trả `{ secret, uri }`, chưa lưu DB; app giữ secret trong bước xác nhận thiết lập.
- `enableTotp(session, secret, code)` xác nhận mã 6 số, lưu secret và backup hashes,
  thu hồi phiên khác/đổi token, trả `{ codes, cookie, session }`. Chỉ hiển thị `codes` một lần.
  Không cho ghi đè cấu hình TOTP đang bật; cần tắt trước.
- `disableTotp(session, code)` cần mã TOTP hoặc mã dự phòng, xóa secret/hashes, thu hồi phiên khác/đổi token.
- `generateTotpSecret`, `totp`, `verifyTotp`, `otpauthUri`, `generateBackupCodes`, `consumeBackupCode`
  là primitive dùng độc lập. TOTP theo [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238), SHA1, 30 giây, ±1 bước.
  Backup code 40 bit ngẫu nhiên, dạng `xxxx-xxxx`; lưu SHA-256, tiêu thụ nguyên tử bằng compare-and-swap.

Phiên `mustChangePassword` chỉ đổi mật khẩu/đăng xuất; phiên ghost không gọi được API đổi mật khẩu/TOTP/rotate.
Ghost chỉ được đọc từ phiên đã có; bridge DB `isGhostSessionActive` kiểm đúng tenant, grant đã dùng,
chưa thu hồi, chưa hết hạn phiên, admin/tenant còn hoạt động. Hạn token redeem 60 giây không làm hết hạn
phiên ghost đã đổi thành công. Tạo/redeem ghost thuộc E15-S07.

## Permission và giới hạn đăng nhập

`PERMISSIONS`, `PERMISSION_LABELS`, `PERMISSION_GROUPS`, `ROLE_PERMISSIONS` khai báo quyền CMS.
`effectivePermissions({ role, audience, kind, policy })` chỉ trừ quyền theo `policy.deny` (quyền hoặc nhóm),
không có allow/upgrade. Ghost có quyền owner trừ `account.security`; client không có quyền admin;
storefront chỉ có `storefront.*`. `hasPermission(set, permission)` dùng trong guard của app;
app phải kiểm quyền cho mọi action/route. Realm platform trả set rỗng: console kiểm realm/guard riêng.

`createLoginLimiter` mặc định sai 5 lần → khóa 15 phút từ lần sai cuối, theo `(realm, tenant, identifier)`;
thêm giới hạn 30 lần sai/15 phút/IP/realm. Check không tăng bộ đếm; success chỉ xóa lỗi định danh.
Khóa Redis không chứa email/IP thô (SHA-256), Lua tăng/TTL nguyên tử. Counter memory dự phòng phản chiếu
lỗi cục bộ để Redis ngắt không xóa khóa đang có. App dùng Redis chung khi chạy nhiều instance;
package chỉ nhận client cấu trúc `{ eval(...) }`, không sở hữu hay tự mở kết nối.

## Kiểm tra

```sh
pnpm --filter @solar/auth typecheck
pnpm --filter @solar/auth lint
pnpm --filter @solar/auth test
```

Test dùng `node:test` + tsx. Test DB chỉ skip khi thiếu `DATABASE_URL`/`PLATFORM_DATABASE_URL`;
đặt URL nhưng DB lỗi thì test fail. Cần database test đã migrate với `app_runtime` và `app_platform`
tách quyền đúng theo README `@solar/db`. Tenant/account mẫu được dọn và cả hai pool đóng trong `after`.
Dependencies chỉ dùng workspace core/db và `zod` sẵn trong lockfile để parse permission policy;
không thêm thư viện crypto/auth bên ngoài.
