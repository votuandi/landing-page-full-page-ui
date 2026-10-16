# E15 — Console nền tảng cho super admin (`apps/console`)

**Mục tiêu**: đội vận hành quản lý customer (công ty khách), site (tenant), tài khoản site admin, gói, tính năng, permission và cấu hình nền tảng
trong một CMS riêng. Console có tài khoản riêng, không dùng chung với CMS của site (D17), và ghost được vào CMS của mọi site (D18).
**Target epic**: không có đường nào dùng tài khoản realm này để đăng nhập realm kia (bộ test E14-S03); thao tác thường ngày
(tạo site, đổi gói, bật một tính năng, ghost vào site) mỗi việc ≤ 1 phút; mọi thao tác ghi `AuditLog`.
**Phụ thuộc**: E5-S10.

> Phân biệt với E7: E7 là `apps/admin` (CMS site, người dùng là `SiteUser`, chạy ở `<slug>.admin.<platform>`);
> E15 là `apps/console` (người dùng là `PlatformAdmin`, chạy ở `console.<platform>`). Story E7-S09 cũ đã tách sang
> E15-S03 (quản lý tenant) và E15-S07 (ghost login).

---

### E15-S01 · `packages/auth`: hai realm đăng nhập
**Là** dev, **tôi muốn** một thư viện xác thực dùng chung cho `admin` và `console` nhưng hai realm không thể lẫn nhau, **để**
không viết hai lần phần nhạy cảm nhất.
- **Chi tiết**:
  - `createRealm({ name: "site" | "platform", cookieName, secret, sessionTtl, idleTtl, store })` trả về `login`, `logout`,
    `getSession`, `requireSession`, `rotate`. Phiên lưu DB (`SiteSession`/`PlatformSession`), cookie chỉ chứa token ngẫu nhiên;
    DB lưu `sha256(token)`. Cookie `__Host-<realm>_sid; Secure; HttpOnly; SameSite=Lax; Path=/`.
  - Realm ghi vào phiên; `getSession` của realm `site` còn kiểm `session.tenantId === tenantOfHost`.
  - Mật khẩu: `scrypt` (`node:crypto`, N=2^15, so sánh thời gian hằng), chính sách tối thiểu 10 ký tự, chặn 1.000 mật khẩu phổ biến.
  - TOTP RFC 6238 (HMAC-SHA1, 30 s, lệch ±1 bước), mã dự phòng dùng một lần. Không thêm dependency runtime.
  - Rate-limit đăng nhập: theo `(realm, tenantId, identifier)` và theo IP (Redis; không có Redis thì bộ nhớ). Sai 5 lần → khóa
    15 phút. Thông báo lỗi chung "Thông tin đăng nhập không đúng", không tiết lộ tài khoản có tồn tại không.
  - Định danh đăng nhập `parseLoginId(input)`: có `@` → email (trim, chữ thường); chỉ chữ số/`+`/khoảng trắng →
    `normalizeVnPhone`; khớp `^[a-z0-9_]{3,70}$` và có chữ cái → username (D21 §5); còn lại → lỗi.
  - Phiên có `mustChangePassword` chỉ được gọi đổi mật khẩu và đăng xuất; mật khẩu tạm quá `tempPasswordExpiresAt` → từ chối.
  - Danh mục permission + bảng vai trò → permission (`permissions.ts`), hàm `effectivePermissions(role, tenantPolicy, kind)`
    (D17, D19; phiên ghost trừ nhóm `account.security`).
- **AC**:
  - [x] Test: phiên realm `platform` đưa vào `getSession` của realm `site` (và ngược lại) → `null`, kể cả khi token hợp lệ.
  - [x] Test: phiên site của tenant A gửi tới host tenant B → `null`.
  - [x] Test: `parseLoginId` cho `A@X.vn `, `0901 234 567`, `+84901234567`, `84901234567`, `NangLuongSolar_Admin`; đầu vào rác → lỗi.
  - [x] Test: khóa sau 5 lần sai; đếm sai của tenant A không khóa cùng định danh ở tenant B.
  - [x] Test TOTP với vector của RFC 6238.
- Phụ thuộc: E5-S10 · Agent: Codex (review Claude adversarial) · Cỡ: M

### E15-S02 · Khung `apps/console` + đăng nhập super admin
**Là** super admin, **tôi muốn** một CMS riêng của nền tảng, đăng nhập bằng tài khoản riêng có 2FA, **để** tách hẳn
quyền vận hành khỏi tài khoản của khách.
- **Chi tiết**:
  - App Next.js `apps/console` (`console.<platform>`), dùng `packages/ui` + theme admin như `apps/admin`, CSP nonce (D13),
    `X-Robots-Tag: noindex`. Biến `CONSOLE_ALLOWED_IPS` tùy chọn (danh sách CIDR, kiểm ở `proxy.ts`).
  - Đăng nhập email + mật khẩu + **TOTP bắt buộc** (lần đầu bắt buộc thiết lập). Không có trang đăng ký. Tài khoản đầu tiên
    tạo bằng CLI `pnpm console:create-admin` (chạy trong container, đọc mật khẩu từ stdin).
  - Super admin quản lý các super admin khác (thêm, khóa, buộc đặt lại 2FA). Không tự khóa được chính mình hoặc admin cuối cùng.
  - Menu: Tổng quan, Customer, Site, Tài khoản site, Tính năng & quyền, Cấu hình nền tảng, Thống kê, Nhật ký, Super admin.
  - Kết nối DB bằng role `app_platform` (E5-S09) qua `forPlatform()`.
- **AC**:
  - [ ] Đăng nhập console bằng email/mật khẩu của một `SiteUser` (seed dùng cùng email `owner@demo.vn`) → thất bại.
  - [ ] Chưa nhập TOTP → không vào được trang nào ngoài màn hình 2FA.
  - [ ] IP ngoài `CONSOLE_ALLOWED_IPS` → 403 (khi biến được đặt).
  - [ ] Mọi Server Action/route của console gọi `requireSession` của realm `platform` (test liệt kê tự động).
- Phụ thuộc: S01 · Agent: Codex · Cỡ: M

### E15-S03 · Quản lý customer & site
**Là** super admin, **tôi muốn** xem và quản lý mọi customer (công ty khách), site của nền tảng, **để** vận hành và chăm sóc khách.
- **Chi tiết** (thay E7-S09 cũ, trừ phần ghost):
  - Customer: CRUD, gắn nhiều site, ghi chú, liên hệ.
  - Danh sách site: tên, customer, slug, gói + addons, hạn, trạng thái `trial|active|suspended`, tên miền chính + trạng thái
    SSL, dung lượng media, số lead tháng, lần xuất bản gần nhất. Tìm kiếm, lọc theo gói/trạng thái/theme.
  - Chi tiết site: tạo site (wizard E13-S01), tên miền (E9-S01), đổi gói/addons (E6-S03), tạm ngưng/kích hoạt (proxy E5-S03 chặn ngay),
    đổi subdomain (tạo `Domain` mới, cái cũ 308 thêm 90 ngày; CMS chuyển sang `<slug-mới>.admin`; username admin giữ nguyên),
    mở site công khai, nút "Ghost vào CMS" (S07), tab nhật ký.
  - Nhật ký kiểm toán toàn nền tảng: lọc theo site, người thực hiện, hành động, khoảng ngày.
- **AC**:
  - [ ] Mọi thao tác ghi `AuditLog` (`actorType: platform_admin`), có test cho từng action.
  - [ ] Tạm ngưng site → host công khai trả 403 và CMS site từ chối đăng nhập trong ≤ 60 s.
  - [ ] Danh sách 500 site tải ≤ 1 s (phân trang phía server).
- Phụ thuộc: S02, E6-S03 · Agent: Codex · Cỡ: M

### E15-S04 · Quản lý tài khoản site admin từ console
**Là** super admin, **tôi muốn** tạo và hỗ trợ tài khoản quản trị của từng site, **để** bàn giao site và xử lý khi khách quên mật khẩu.
- **Chi tiết**:
  - Theo từng site: danh sách `SiteUser` nhân viên (vai trò, trạng thái, đăng nhập gần nhất, 2FA). Tài khoản `client` chỉ
    hiện số lượng, không hiện danh sách (D20). Tạo owner/admin bằng email hoặc SĐT
    → gửi lời mời (email qua E11-S05; tài khoản chỉ có SĐT → console hiện link mời dùng 1 lần để gửi qua Zalo).
  - Thao tác: gửi lại lời mời, khóa/mở khóa, buộc đặt lại mật khẩu (thu hồi mọi phiên), gỡ 2FA (khi khách mất điện thoại),
    chuyển quyền owner. Console không bao giờ thấy mật khẩu của khách. Riêng "Tạo mật khẩu tạm" (dùng khi bàn giao hoặc
    khách mất quyền truy cập mà tài khoản không có email) sinh mật khẩu ngẫu nhiên, hiện một lần, hết hạn 7 ngày, bắt buộc
    đổi khi đăng nhập (D21 §5), thu hồi mọi phiên cũ.
  - Kiểm trùng tên đăng nhập **trong site** (D17), báo lỗi tiếng Việt rõ ràng.
- **AC**:
  - [ ] Tạo `owner@demo.vn` cho site B khi site A đã có → thành công; tạo trùng trong cùng site → báo trùng.
  - [ ] Buộc đặt lại mật khẩu → phiên đang mở của user đó hết hiệu lực ở request kế tiếp.
  - [ ] Không để site rơi vào trạng thái 0 owner đang hoạt động.
- Phụ thuộc: S02, E7-S01 · Agent: Codex · Cỡ: M

### E15-S05 · Tính năng & permission theo site
**Là** super admin, **tôi muốn** bật/tắt từng tính năng và permission cho một site, **để** tặng dùng thử, xử lý ngoại lệ hợp đồng
hoặc giữ lại quyền tự quản (vd. tên miền do đội vận hành quản lý).
- **Chi tiết**:
  - Ma trận tính năng của site: cột "Theo gói" / "Override" (bật, tắt, mặc định) / "Hiệu lực" / "Hết hạn". Override bắt buộc
    ghi lý do, hạn tùy chọn. Ghi vào `Tenant.featureOverrides`; giới hạn ghi vào `limitOverrides` (D19).
  - Permission: danh sách permission nhóm theo khu vực CMS; tắt một permission → không vai trò nào của site có quyền đó
    (`permissionPolicy.deny`). Chỉ hạ quyền, không nâng quyền.
  - Lưu → `AuditLog` + Outbox invalidate `tenant:<id>` (E6-S03); CMS site đọc lại quyền ở request kế tiếp.
- **AC**:
  - [ ] Bật `shorts` cho site gói Nâng cao kèm hạn → section `shorts` render; quá hạn → tự tắt, không cần thao tác.
  - [ ] Tắt `calculator` cho site gói Cao cấp → section biến mất sau revalidate ≤ 60 s, API tương ứng trả 403, dữ liệu giữ nguyên.
  - [ ] Deny `domains.manage` → owner của site không thấy menu Tên miền và API trả 403.
- Phụ thuộc: S02, E6-S02, E6-S03 · Agent: Codex · Cỡ: M

### E15-S06 · Tính năng & cấu hình toàn nền tảng
**Là** super admin, **tôi muốn** tắt khẩn cấp một tính năng trên toàn nền tảng và sửa cấu hình chung không cần deploy, **để**
xử lý sự cố và vận hành linh hoạt.
- **Chi tiết** (`packages/platform` + bảng `PlatformSetting`, D19):
  - Kill switch theo tính năng (`features.disabled`), chế độ bảo trì CMS site (banner + chỉ đọc), số ngày trial, gói mặc định
    khi tạo site, giá tham khảo email theo tên miền (E11-S04), link affiliate, kênh cảnh báo vận hành.
  - Mỗi key có zod schema + giá trị mặc định trong code; form trong console sinh từ schema (dùng `SchemaForm` của E7-S03).
    Key không có trong code bị bỏ qua và ghi log.
  - Lưu → `AuditLog` (giá trị cũ/mới) + invalidate `platform:settings`; nếu đổi kill switch → thêm `platform:entitlements`.
- **AC**:
  - [ ] Bật kill switch `tiktok` → section TikTok biến mất trên mọi site ≤ 60 s; tắt → hiện lại, override của tenant không vượt được kill switch.
  - [ ] Bật bảo trì → CMS site chỉ đọc (Server Action ghi trả 503 kèm thông báo tiếng Việt); console không bị ảnh hưởng.
  - [ ] Giá trị sai schema → không lưu, báo lỗi theo trường.
- Phụ thuộc: S02, E6-S02, E7-S03 · Agent: Codex · Cỡ: M

### E15-S07 · Ghost login vào CMS site
**Là** super admin, **tôi muốn** vào CMS của bất kỳ site nào với quyền quản trị để hỗ trợ khách, **để** không phải xin mật khẩu của khách.
- **Chi tiết**: theo D18.
  - Console: nút "Ghost vào CMS" → hộp thoại nhập lý do (bắt buộc), nhập lại TOTP nếu lần xác thực gần nhất đã quá 10 phút.
    Tạo `GhostGrant`, chuyển hướng `https://<slug>.admin.<platform>/auth/ghost?token=…`.
  - Admin: route `/auth/ghost` đổi token (dùng 1 lần, hạn 60 s, đúng tenant của host) lấy `SiteSession{kind: "ghost"}` 30 phút.
    Banner cố định có đồng hồ đếm ngược và nút Thoát. Bị chặn các thao tác `account.security`.
  - Mọi `AuditLog` trong phiên ghost có `actorType: platform_admin`, `ghostGrantId`. Console có danh sách phiên ghost đang mở, nút thu hồi.
  - Owner của site thấy mục "Truy cập hỗ trợ" trong nhật ký (ai, lúc nào, lý do).
- **AC**:
  - [ ] Token dùng lại / hết hạn / mở trên host của site khác → 401, không tạo phiên.
  - [ ] Phiên ghost hết hạn sau 30 phút; thu hồi từ console → request kế tiếp ở admin bị đẩy ra trong ≤ 5 s.
  - [ ] Trong phiên ghost: đổi mật khẩu user, gỡ 2FA, chuyển owner → 403.
  - [ ] Sửa tiêu đề hero khi ghost → `AuditLog` ghi đúng super admin + lý do; `PageVersion` ghi `publishedByPlatformAdminId`.
  - [ ] Không có đường nào lấy được phiên ghost nếu không đăng nhập console (test truy cập thẳng `/auth/ghost` không token).
- Phụ thuộc: S03, E7-S01, E7-S02 · Agent: Claude (review Codex adversarial) · Cỡ: M

### E15-S08 · Dashboard & thống kê nền tảng
**Là** chủ dự án, **tôi muốn** thấy nền tảng đang được dùng thế nào, **để** quyết định port/bỏ section, theme và định giá gói.
- **Chi tiết**:
  - Tổng quan: số site theo trạng thái/gói, site mới và site rời đi theo tháng, site sắp hết hạn (14 ngày), tên miền lỗi SSL,
    lead toàn nền tảng theo tuần, dung lượng media.
  - Thống kê sử dụng: section type × variant (số site, số trang đang dùng, bản đã xuất bản), theme, preset gốc, tính năng
    (theo gói và theo override). Bấm vào một ô → danh sách site đang dùng.
  - Số liệu tính bằng truy vấn tổng hợp qua `forPlatform()` (đọc `Page.sections` đã xuất bản), cache 10 phút. Worker chụp
    snapshot hằng ngày vào `PlatformStatDaily` để vẽ xu hướng.
- **Target**: trang thống kê ≤ 2 s với 1.000 site.
- **AC**:
  - [ ] Test: seed 2 site dùng `hero/t15` và 1 site `hero/t12` → ma trận đếm đúng; section `enabled: false` tính riêng.
  - [ ] Số liệu chỉ lấy từ bản đã xuất bản (draft không tính).
- Phụ thuộc: S02, E5-S07 · Agent: Codex · Cỡ: M
