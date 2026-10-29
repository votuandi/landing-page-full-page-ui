# Site admin

CMS từng tenant tại `<slug>.admin.<PLATFORM_DOMAIN>`. E7-S01 cung cấp đăng nhập và phân quyền;
E7-S02 cung cấp khung điều hướng và theme admin riêng. Nội dung các màn hình quản lý thuộc những story tiếp theo.

## Khung và điều hướng

- Root layout áp dụng `adminTheme` từ `@solar/themes`, độc lập với theme tenant. Theme có token light/dark;
  admin hiện dùng light. Theme admin không xuất hiện trong danh sách theme cho khách chọn.
- Route group `(auth)` giữ card căn giữa cho đăng nhập, quên/đặt lại/đổi mật khẩu, magic link, nhận mời và lỗi tenant.
  Route group không thay đổi URL; `/doi-mat-khau` không có menu, kể cả lần đầu bắt buộc đổi mật khẩu.
- Route group `(admin)` dùng `AdminShell` từ `@solar/ui`: sidebar desktop và menu `<details>` trên mobile,
  dùng được khi tắt JavaScript. Skip link trỏ tới `main#noi-dung`; mục hiện tại có `aria-current="page"`.
  Slot banner hiển thị thông báo phiên hỗ trợ; banner bảo trì sẽ được thêm ở E15-S06.
- `lib/nav.ts` lọc menu bằng cả permission hiệu lực và entitlement. Nhóm rỗng bị bỏ; phiên ghost không có nhóm
  "Tài khoản của tôi". `/lead` cần `leadInbox`; `/ten-mien` và `/email` cần `customDomain`.
- `getSiteEntitlements()` chỉ memoize trong request, đọc site qua repository có tenant từ Host, rồi áp dụng
  kill switch nền tảng → override tenant → gói/addon/trial qua `@solar/plans`.
  Mỗi trang tự kiểm `requirePagePermission`; trang có feature còn gọi `requirePageFeature`, trả 404 khi ngoài gói/bị tắt.
- `/noi-dung`, `/media`, `/lead`, `/giao-dien`, `/email` hiện là trang chỗ chờ có guard server.
  Không thêm nội dung quản lý thật vào shell.

## Tổng quan site (E7-S11)

Trang `/` là server component, không cache dữ liệu phiên. Mỗi ô chỉ truy vấn và hiển thị khi có permission tương ứng:
lead (`leads.view`), nội dung mẫu/bản nháp (`pages.view`), media (`media.view`), tên miền (`domains.manage`),
gói (`billing.view`), 10 hoạt động gần nhất (`audit.view`). Link quản lý dùng cùng bộ lọc menu (permission + entitlement).
Viewer không truy vấn số liệu lead. Thống kê lead dùng ngày Việt Nam; 7 ngày gồm hôm nay và 6 ngày trước,
lead quá 24 giờ chỉ tính trạng thái `new`. Media bỏ tệp `failed`, quota áp dụng override còn hiệu lực.
Nội dung mẫu dò cả `data`/`draftData`; bản nháp gồm cấu trúc trang hoặc nội dung section chưa xuất bản.
Lịch hẹn và client mới chờ E16. Test DB đo loader sau warm-up với 10.000 lead, giới hạn 1 giây.

## Trang và section (E7-S04 phần a)

`/trang` liệt kê trang của site từ Host; `/trang/[pageId]` dùng `SectionListEditor` trong `@solar/cms-ui`.
`pages.structure` kết hợp `sectionReorder`/`variantSwitch` quyết định các thao tác sửa bố cục. Gói Cơ bản hoặc
viewer xem danh sách chỉ đọc. Mọi action có permission riêng và kiểm page thuộc site hiện hành.

Lưu nháp gọi `saveDraft`, giữ nội dung theo `sectionId`; chỉ section chưa có nội dung mới nhận defaults.
Xóa chỉ bỏ descriptor, giữ `SectionContent`. Xuất bản cần `pages.publish`, dùng revision vừa lưu và `publishPage`
để tạo phiên bản + invalidation trong transaction. Revision cũ trả 409, yêu cầu tải lại. Preview tạo token một lần,
mở host `<slug>.preview.<PLATFORM_DOMAIN>` qua proxy web (không dùng port 3300 của admin).
Phiên ghost hiện chưa có actor SiteUser/PlatformAdmin trong site realm nên ghi trả 403; cầu nối actor thuộc E15.
Danh mục trang, thumbnail thật và dọn nội dung giữ lại thuộc E7-S13.

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

`/noi-dung` liệt kê collection trong gói cùng số bản ghi; các route `/<collection>`, `/moi`, `/[id]` hỗ trợ tìm kiếm
không dấu, lọc, thêm/sửa, nhân bản, xóa có xác nhận và sắp xếp bằng chuột/bàn phím/nút ↑↓. Form dùng schema chung
`@solar/db/collections`; xung đột slug hiện ngay tại trường đường dẫn. Khi đang tìm/lọc hoặc có trên 500 bản ghi,
sắp xếp bị tắt để không ghi thiếu danh sách. Form section mẫu vẫn ở `/noi-dung/form/<type>`.

Danh mục, thương hiệu và danh mục cha chọn theo tiêu đề trong cùng website; "Không chọn" gỡ liên kết (lưu `null`).
Danh mục cha không cho chọn chính bản ghi đang sửa; bộ lọc danh mục hiện tiêu đề. Sản phẩm chỉ sửa phân khúc tại
"Phân khúc sản phẩm" (cột `segments`); trường `data.segment` cũ được giữ khi lưu.

Mọi trang/action kiểm `content.edit`; collection ngoài gói trả trang 404 hoặc lỗi nghiệp vụ 403 trước repository.
Ghost có quyền `content.edit` được ghi vì collection không có trường actor; audit ghost chi tiết để E15-S07.
Tenant không có `bilingual` không đổi được title EN và giữ bản dịch đã có khi hạ gói. CSV thuộc E7-S14;
chọn media thuộc E8-S05. Fixture e2e có tenant basic riêng `admin-e7-collections-basic`.

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

Dependency dùng phiên bản đã có: Next/React cho app; workspace auth/db cho phiên/RLS, plans cho entitlement, core/ui/tokens/themes
theo kiến trúc; zod validate; ioredis chia sẻ giới hạn đăng nhập. Không thêm thư viện QR/email provider.

## Sửa nội dung section

`/trang/[pageId]/section/[sectionId]` yêu cầu `content.edit`, kiểm section thuộc layout draft của đúng site và gói.
Form đọc draft trước, tự lưu sau 800 ms và cập nhật preview qua `postMessage` có origin cụ thể.
Lỗi dữ liệu cũ hiển thị mặc định kèm thông báo; phiên bản schema chưa khớp chỉ được đọc, cần chạy migration trước.
Chỉ ghi bản nháp; nút xuất bản ở bố cục trang. Khi còn thay đổi chưa lưu, link nội bộ và đóng/tải lại trang có cảnh báo.

Dev khác cổng: admin đặt `TENANT_PUBLIC_PORT=3212`; web đặt `ADMIN_PUBLIC_PORT=3300` và `PREVIEW_SECRET`.
Production dùng HTTPS, không thêm cổng. Bộ e2e admin tự chạy cả hai app, cần DB local và seed như phần kiểm tra.
Lab `/lab/cms-content` dùng lưu giả và iframe mẫu cố định; kiểm độ trễ thực tế nằm trong `tooling/visual/admin.spec.ts`.

## Hộp thư lead (E11-S03)

`/lead` yêu cầu `leads.view` và `leadInbox` (Nâng cao trở lên). Danh sách lọc theo trạng thái, nguồn, ngày Việt Nam,
tên/SĐT; tối đa 100 lead mỗi trang. Tab đang mở kiểm lead mới mỗi 3 giây; ghi chú đang gõ giữ nguyên khi cập nhật.
Chi tiết có nhu cầu, dự toán, giỏ sản phẩm, thời điểm đồng ý và trạng thái gửi kênh. `leads.manage` được sửa trạng thái,
ghi chú, gửi lại job thất bại và xác nhận xóa lead cùng các job chưa hoàn tất. Lead cũ chưa ghi đồng ý hiện “—”.

Gói Cao cấp có `leadAssign` (người phụ trách/chi nhánh cùng tenant) và `leadExport`: GET `/api/lead/csv` dùng cùng bộ lọc,
UTF-8 BOM, CRLF và chống công thức Excel. GET `/api/lead/moi-nhat` chỉ trả dấu mốc thay đổi, không trả nội dung khách hàng.
Trang/API dùng `private, no-store`; audit chỉ chứa ID, tên trường thay đổi hoặc bộ lọc không chứa từ khóa tìm kiếm.
Form website yêu cầu checkbox đồng ý và lưu `data.consentAt` do server cấp.

## CSV sản phẩm

Trang `/noi-dung/san-pham` có tải CSV, chọn file và xem trước từng dòng trước khi xác nhận nhập.
Cần `content.edit` và `catalog`; gói không có `bilingual` chỉ được giữ nguyên tiêu đề tiếng Anh cũ.
API GET `/api/san-pham/csv` tải file `san-pham.csv` với cache `private, no-store`.
File UTF-8 dùng dấu phẩy, tối đa 500 kB và 1000 dòng; một dòng lỗi sẽ chặn toàn bộ file.

## Hồ sơ công ty và giao diện

`/cai-dat` yêu cầu `settings.manage`, dùng SchemaForm trên schema chung `@solar/db/site-profile`.
`/giao-dien` yêu cầu `theme.manage`: theme theo nhóm của gói, preview qua token một lần và cookie httpOnly,
màu primary/secondary/accent (cần `themeOverride`), đường dẫn logo sáng/tối. Màu được kiểm AA trên cả client và server,
đổi theme kiểm lại override đang lưu. Hạ gói giữ theme hiện tại, web bỏ override khi không còn entitlement.
Mọi form gửi phiên bản `updatedAt`; xung đột 409 yêu cầu tải lại.

E7-S15: panel Font chữ chọn font nội dung/tiêu đề từ danh sách self-host khi có `themeOverride`.
Server kiểm family, weight và entitlement cả lúc lưu font lẫn đổi/xem thử theme. Favicon dùng mọi gói,
chọn ảnh PNG/JPEG/WebP/GIF/AVIF ready của tenant; ảnh private đi qua pipeline publish sẵn có.
