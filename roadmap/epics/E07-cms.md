# E7 — CMS quản trị nội dung của site (`apps/admin`)

**Mục tiêu**: khách tự quản lý nội dung, thứ tự và bật/tắt section, media, lead, tài khoản nhân viên; xem dashboard của site.
CMS chạy ở `<slug>.admin.<platform>`, chỉ nhận tài khoản `SiteUser` của đúng site đó (D17). Super admin dùng CMS riêng (E15)
và chỉ vào được CMS site bằng ghost login (E15-S07).
**Target epic**: khách không rành kỹ thuật sửa xong tiêu đề hero + thêm 1 dự án trong ≤ 5 phút (thử với 3 người dùng thật);
CMS chỉ hiện form của section có trong cấu hình.
**Phụ thuộc**: E5-S01…S05, E5-S10, E3 (schema), E6-S02, E15-S01.

> E7-S09 cũ ("Super admin: quản lý tenant") đã tách sang E15-S03 và E15-S07.

---

### E7-S01 · Đăng nhập site admin & phân quyền theo site ✅ · PR [#42](https://github.com/votuandi/landing-page-full-page-ui/pull/42)
**Là** chủ doanh nghiệp, **tôi muốn** đăng nhập CMS của site mình bằng email hoặc số điện thoại và mời nhân viên với quyền
hạn chế, **để** an toàn.
- **Chi tiết** (dùng `packages/auth` của E15-S01, realm `site`):
  - `apps/admin` nhận host `<slug>.admin.<platform>` → `Tenant` (slug không tồn tại hoặc tenant `suspended` → trang lỗi,
    không có form đăng nhập). Không có bộ chọn tenant: một người làm cho hai site có hai tài khoản riêng.
  - Một ô "Email, số điện thoại hoặc tên đăng nhập" + mật khẩu; tìm `SiteUser` **chỉ trong tenant của host**.
    Tài khoản `mustChangePassword` (vd. `…_admin` vừa bàn giao, D21 §5) → mọi trang chuyển tới màn hình đổi mật khẩu,
    sau đó gợi ý thêm email/SĐT để tự khôi phục. Magic link cho tài khoản có
    email. Quên mật khẩu: tài khoản có email → link đặt lại; tài khoản chỉ có SĐT → owner/admin của site hoặc super admin
    (E15-S04) tạo link đặt lại. OTP SMS/Zalo ZNS để backlog.
  - Nhận lời mời (`SiteInvite`, hạn 72 h, dùng 1 lần) → đặt mật khẩu → `active`.
  - Vai trò `owner|admin|editor|staff|viewer` → permission (`packages/auth/permissions.ts`); quyền hiệu lực trừ thêm
    `permissionPolicy` của tenant (D19). Kiểm ở mọi Server Action/route bằng `requirePermission("…")`, không chỉ ẩn menu.
  - 2FA TOTP tùy chọn cho owner/admin (super admin có thể bắt buộc qua permission policy về sau).
  - Học từ luồng JWT của branch `develop` (`api/auth/*`) nhưng không lưu JWT trong localStorage.
- **AC**:
  - [x] Seed: `owner@demo.vn` ở tenant A và B là hai tài khoản, mật khẩu khác nhau; đăng nhập ở `a.admin…` bằng mật khẩu của B → thất bại.
  - [x] Email/mật khẩu của `PlatformAdmin` (cùng `owner@demo.vn`) → thất bại ở mọi host admin.
  - [x] Tài khoản vai trò `client` (đúng mật khẩu) → không vào được CMS, không có route/API admin nào trả dữ liệu (D20).
  - [x] Chép cookie phiên của host A sang host B → 401.
  - [x] Đăng nhập bằng `0901234567` và `+84901234567` cùng ra một tài khoản.
  - [x] `nangluongsolar_admin` đăng nhập bằng mật khẩu tạm → chỉ vào được màn hình đổi mật khẩu (Server Action khác → 403);
        mật khẩu tạm quá 7 ngày → từ chối, hướng dẫn liên hệ hỗ trợ.
  - [x] Editor không vào được trang Tên miền, Gói, Tài khoản & nhân viên (UI ẩn + server 403).
  - [x] Mọi Server Action kiểm permission (test liệt kê tự động, fail khi có action mới chưa khai báo permission).
  - [x] 2FA TOTP tùy chọn cho owner.
- Phụ thuộc: E15-S01 · Agent: Claude · Cỡ: L

Bằng chứng E7-S01: admin 16/16 test (PostgreSQL/RLS thật), auth 25/25, E2E admin Chromium 4/4;
typecheck/lint/token lint qua. Report: `.agent-runs/E7-S01/codex-report.md`. PR gộp: chờ Claude tạo và review/CI.

### E7-S02 · Khung admin & điều hướng ✅ · PR [#44](https://github.com/votuandi/landing-page-full-page-ui/pull/44)
- **Chi tiết**: layout admin dùng `packages/ui` + theme admin riêng (không theo theme tenant), dùng chung với `apps/console`;
  menu: Tổng quan (S11), Trang & Section, Nội dung (các collection: sản phẩm, dịch vụ, dự án…), Media, Lead, Giao diện,
  Tên miền, Email theo tên miền, Tài khoản & nhân viên (S12), Gói. Mobile dùng được. Chừa sẵn vị trí banner cho phiên ghost
  (E15-S07) và banner bảo trì (E15-S06).
- **AC**: [x] Lighthouse a11y ≥ 95 cho các trang admin chính · [x] Menu ẩn mục ngoài quyền/ngoài gói/bị super admin tắt (vẫn kiểm server).
- Phụ thuộc: S01 · Agent: Claude · Cỡ: M

### E7-S03 · Form tự sinh từ schema zod ✅ · PR [#45](https://github.com/votuandi/landing-page-full-page-ui/pull/45)
**Là** dev, **tôi muốn** không phải viết tay form cho 28 section, **để** thêm section mới là có form ngay.
- **Chi tiết**: `<SchemaForm schema={…} value onChange/>` duyệt zod: string/number/boolean/enum, `localized` (tab VI/EN —
  EN chỉ khi có `bilingual`), `mediaRef` (mở thư viện media), `link` (chọn trang/neo/tel/Zalo/calculator), `richText`
  (editor tối giản: đậm, nghiêng, link, danh sách), mảng (thêm/xóa/kéo sắp xếp), object lồng, `collectionQuery`.
  Validate inline bằng chính schema; thông báo lỗi tiếng Việt.
- **Target**: 28/28 type có form dùng được không cần code riêng (cho phép override widget theo trường).
- **AC**:
  - [x] Form của `calculator` cho sửa bảng giá điện, đơn giá/kWp, hệ số sản lượng; nhập sai kiểu bị chặn.
  - [x] Test round-trip cho 28 type: fixture → form → submit không chỉnh sửa → dữ liệu ra bằng đúng dữ liệu vào (deep equal).
- Phụ thuộc: E3-S02 · Agent: Claude · Cỡ: L

### E7-S04 · Màn hình sắp xếp & bật/tắt section ✅ · PR [#47](https://github.com/votuandi/landing-page-full-page-ui/pull/47)
**Là** tenant gói Nâng cao, **tôi muốn** kéo đổi thứ tự, bật/tắt và đổi variant section, **để** bố cục trang theo ý tôi.
- **Chi tiết**: danh sách section của trang (tên, variant, thumbnail, công tắc), kéo thả (dnd-kit, có bàn phím), menu
  "Đổi kiểu hiển thị" liệt kê variant cùng type, "Thêm section" từ thư viện (khóa theo gói, E6-S04), xóa (nội dung
  giữ lại). Gói Cơ bản: chỉ sửa nội dung, không sắp xếp. Kiểm bằng `validateSiteStructure` (E5-S11), cùng hàm với
  wizard tạo site. Trình sửa danh sách section đặt ở `packages/cms-ui` để wizard (E13-S06) dùng lại.
  Đã tách (17/10/2026): thumbnail ở story này là ô giữ chỗ; danh sách trang theo danh mục, thumbnail chụp sẵn và dọn
  dữ liệu 30 ngày chuyển sang E7-S13. Hero không có variant t08 → AC1 kiểm bằng t12 → t15.
- **AC**:
  - [x] Đổi variant hero t12 → t15 (hero không có t08): nội dung giữ nguyên, preview cập nhật.
  - [x] Thao tác lưu vào draft; "Xuất bản" mới revalidate.
  - [x] Ràng buộc `maxPerPage` (vd. chỉ 1 calculator) được kiểm cả client và server.
  Bằng chứng phần a: `sectionEditor.int.test.ts` (variant/content, Outbox, giữ nội dung khi xóa),
  `pageSections.test.ts` (quyền/site/revision/cấu trúc), `cms-sections.spec.ts` (7 ca browser, axe, 390/1440 sáng/tối).
  Chờ Claude design pass, review và tạo PR; E7-S13 giữ phạm vi phần b.
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
  `packages/core/price`), nhiều ảnh, thông số; video có `provider` youtube/tiktok/file/bunny.
  Đã tách (18/10/2026): nhập/xuất CSV cho sản phẩm chuyển sang E7-S14.
- **AC**:
  - [x] Lưu dự án → revalidate tag `collection:projects` (trang chủ + trang dự án cập nhật). Tag thật `tenant:<id>:collection:project`; bằng chứng `apps/web/.../collectionWrite.int.test.ts` › "saving a published project revalidates home and project page".
  - [x] Collection ngoài gói (vd. sản phẩm khi không có `catalog`) bị ẩn và API từ chối. (E7-S06: unit `apps/admin/src/__tests__/collections.test.ts`; e2e đã viết, chờ Claude chạy.)
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

### E7-S10 · Sao lưu & khôi phục theo tenant
- **Chi tiết**: học từ branch `develop` (backup JSON + zip media, lịch sử backup). Xuất toàn bộ dữ liệu một tenant
  (JSON + danh sách media) và khôi phục vào tenant mới (dùng cho nhân bản site, chuyển máy chủ). Backup toàn DB ở E10-S06.
- **AC**: [ ] Xuất → khôi phục sang tenant mới cho site giống hệt (ảnh chụp so khớp) · [ ] Chỉ owner (hoặc super admin qua console) thực hiện được.
  Bản xuất **không** chứa `SiteUser`/mật khẩu/phiên; khôi phục vào tenant mới không mang theo tài khoản.
- Phụ thuộc: E8-S01 · Agent: Codex · Cỡ: M

### E7-S11 · Dashboard của site
**Là** chủ doanh nghiệp, **tôi muốn** mở CMS là thấy ngay tình hình site, **để** biết việc cần làm hôm nay.
- **Chi tiết**: trang Tổng quan: lead mới (hôm nay/7 ngày, theo nguồn), lead chưa xử lý quá 24 h, trang/section còn
  `[DỮ LIỆU MẪU]` (checklist E13-S01), bản nháp chưa xuất bản, dung lượng media/giới hạn gói, trạng thái tên miền + SSL,
  gói + ngày hết hạn, lịch hẹn sắp tới và client mới (khi có `booking`/`clientAccounts`, E16), hoạt động gần đây (AuditLog của site, gồm cả "Truy cập hỗ trợ" của E15-S07). Mỗi ô chỉ hiện khi user
  có permission tương ứng.
- **AC**: [ ] Tải ≤ 1 s với 10.000 lead · [ ] Viewer chỉ thấy ô được phép, không lộ số liệu lead.
- Phụ thuộc: S02, E11-S01 · Agent: Claude · Cỡ: M

### E7-S12 · Tài khoản & nhân viên của site
**Là** owner/admin của site, **tôi muốn** thêm nhân viên, gán vai trò, khóa hoặc gỡ tài khoản, **để** tự quản lý người được vào CMS.
- **Chi tiết**: trang này chỉ quản lý nhân viên; tài khoản `client` quản lý ở E16-S04. Danh sách `SiteUser` nhân viên (tên, email/SĐT, vai trò, trạng thái, đăng nhập gần nhất, 2FA); mời bằng email hoặc SĐT
  (tài khoản chỉ có SĐT → link mời dùng 1 lần để gửi qua Zalo); đổi vai trò, khóa/mở, gỡ (thu hồi mọi phiên); xem phiên
  đang mở của mình và đăng xuất các thiết bị khác. Giới hạn `users` của gói (chỉ đếm nhân viên) kiểm bằng `limit()` (E6-S02).
  Đổi một `client` thành nhân viên (hoặc ngược lại) chỉ owner làm được, có xác nhận.
  Kiểm trùng tên đăng nhập trong site (D17). Admin không nâng ai lên owner, không sửa owner; chỉ owner chuyển quyền owner.
- **AC**:
  - [ ] Mời vượt giới hạn `users` của gói → server từ chối, UI báo rõ và gợi ý nâng gói.
  - [ ] Không gỡ/khóa được owner cuối cùng; admin không đổi được vai trò của owner (test server).
  - [ ] Gỡ user → phiên đang mở của user đó hết hiệu lực ở request kế tiếp.
- Phụ thuộc: S01, S02, E6-S02, E11-S05 · Agent: Codex · Cỡ: M

### E7-S13 · Danh mục trang, thumbnail variant & dọn section đã xóa
**Là** tenant gói Nâng cao, **tôi muốn** bật/tắt trang theo danh mục và chọn kiểu hiển thị qua ảnh xem trước, **để**
dựng cấu trúc site đúng ý. (Tách từ E7-S04.)
- **Chi tiết**: danh sách trang của site: bật/tắt trang theo danh mục (cần `pageStructure`, D21), kiểm bằng
  `validateSiteStructure`. Thumbnail variant chụp sẵn theo theme (script Playwright qua lab `/lab/sections/[type]`,
  ảnh tĩnh), thay ô giữ chỗ trong menu "Đổi kiểu hiển thị" và thư viện section. Nội dung section đã xóa khỏi trang giữ
  30 ngày rồi worker dọn (không dọn nội dung còn trong `PageVersion` gần nhất).
- **AC**:
  - [ ] Tắt trang `ve-chung-toi` khi có `pageStructure` → lưu được, trang trả 404 sau xuất bản; không có → server từ chối.
  - [ ] Menu đổi kiểu hiện thumbnail đúng theme hiện tại của site.
  - [ ] Nội dung section xóa quá 30 ngày bị worker dọn; chưa tới 30 ngày khôi phục được.
- Phụ thuộc: S04 · Agent: Claude · Cỡ: M

### E7-S14 · Nhập/xuất CSV sản phẩm
**Là** tenant gói có `catalog`, **tôi muốn** nhập và xuất danh sách sản phẩm bằng CSV, **để** cập nhật hàng loạt giá và
thông số mà không sửa từng bản ghi. (Tách từ E7-S06.)
- **Chi tiết**: xuất CSV (UTF-8 BOM, mở được bằng Excel) theo schema `product` dùng chung của E7-S06; nhập: xem trước
  từng dòng (thêm mới / cập nhật theo slug / lỗi kèm lý do tiếng Việt), chỉ ghi khi người dùng xác nhận, ghi trong một
  transaction và invalidate `collection:product` một lần. Giới hạn kích thước file và số dòng.
- **AC**:
  - [ ] Xuất → nhập lại không chỉnh sửa → dữ liệu không đổi (round-trip).
  - [ ] File có dòng lỗi → không ghi dòng nào, báo đúng dòng và cột lỗi.
- Phụ thuộc: S06 · Agent: Codex · Cỡ: S
