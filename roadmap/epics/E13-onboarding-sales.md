# E13 — Khởi tạo site & quy trình bán hàng

**Mục tiêu**: từ lúc khách chốt gói đến lúc site chạy trên tên miền riêng ≤ 30 phút thao tác; khách tiềm năng tự xem demo
mọi preset và so sánh gói.
**Target epic**: tạo tenant mới từ preset ≤ 2 phút; 15 site demo phục vụ từ nền tảng; trang bảng giá sinh từ `packages/plans`.
**Phụ thuộc**: E4-S01…S10 (không gồm E4-S11 — story lưu trữ branch chạy sau E13-S04), E5, E6, E15-S03. Chính sách tạo site: D21.

---

### E13-S01 · Wizard tạo site: subdomain, gói, theme, tài khoản admin
**Là** super admin, **tôi muốn** tạo site mới theo một quy trình cố định trong console, **để** giao site cho khách nhanh và
không sai chính sách gói.
- **Chi tiết** (`apps/console`, D21):
  1. **Customer**: chọn có sẵn hoặc tạo mới (tên công ty, người liên hệ, email/SĐT).
  2. **Subdomain**: nhập `nang-luong-solar` → chuẩn hóa (bỏ dấu, chữ thường, khoảng trắng → `-`) → kiểm định dạng, danh sách
     dành riêng, còn trống (debounce 300 ms). Xem trước `nang-luong-solar.<platform>`, `nang-luong-solar.admin.<platform>`,
     tài khoản `nangluongsolar_admin`.
  3. **Gói**: gói + addons + trạng thái `trial` (ngày hết hạn) hoặc `active`. Đặt gói trước theme vì nhóm theme phụ thuộc gói.
  4. **Theme**: lưới preset được phép theo gói (thumbnail, "Xem thử" mở site demo E13-S04). Chọn preset = chọn theme +
     cấu trúc/section mặc định của preset.
  5. **Thông tin cơ bản**: tên hiển thị, logo, hotline, Zalo, địa chỉ, email liên hệ; màu chính chỉ khi có `themeOverride`.
  6. **Xem lại & tạo**: một transaction tạo `Tenant`, `Site`, `Domain` subdomain (chính, `active`), `Page` + `SectionContent`
     từ `applyPlanToPreset` (E5-S11) với tên công ty, menu sinh từ cấu trúc, `SiteUser` owner `…_admin` + mật khẩu tạm,
     `AuditLog`, Outbox revalidate. Có idempotency key: bấm hai lần không tạo hai site.
  7. **Bàn giao**: hiện URL site, URL CMS, tên đăng nhập, mật khẩu tạm (**một lần**, nút sao chép, phải tick "Đã lưu" mới
     đóng được), in/tải "Phiếu bàn giao" PDF không chứa mật khẩu.
  - Gói Cơ bản đi thẳng từ bước 5 sang bước 6; gói có `pageStructure` thêm các bước của E13-S06.
  - Dữ liệu mẫu được gắn cờ `[DỮ LIỆU MẪU]` và CMS nhắc thay trước khi xuất bản.
- **AC**:
  - [ ] Wizard xong → site chạy tại `<slug>.<platform>` ≤ 2 phút, CMS ở `<slug>.admin.<platform>` đăng nhập được bằng
        `…_admin` + mật khẩu tạm, và bị bắt đổi mật khẩu ngay.
  - [ ] Subdomain trùng / dành riêng / sai định dạng → không qua được bước 2, báo lý do tiếng Việt.
  - [ ] Gói Cơ bản: chỉ chọn được preset Classic; site tạo ra không có section/trang ngoài gói (`validateSiteStructure` qua).
  - [ ] Mật khẩu tạm không xuất hiện trong log, `AuditLog`, phản hồi API sau màn hình bàn giao, hay Phiếu bàn giao.
  - [ ] Checklist "Trước khi xuất bản" liệt kê mọi trường còn dữ liệu mẫu (giá, giấy phép, đánh giá, số liệu — như mục
        "Cần xác minh" trong README t15).
- Phụ thuộc: E5-S11, E15-S02, E15-S03 · Agent: Claude · Cỡ: L

### E13-S02 · Import từ site cũ (khách đang dùng template branch)
- **Chi tiết**: script chuyển dữ liệu của khách đang chạy branch template (file `site.config.ts`, `src/data/*.ts`, ảnh trong
  `public/`) thành tenant: map sang schema section + collection, upload ảnh qua `packages/storage`, giữ slug và thêm redirect 308.
- **AC**: [ ] Site import khớp site cũ (ảnh chụp so sánh, không mất trang trong sitemap) · [ ] Báo cáo trường không map được.
- Phụ thuộc: S01, E7-S07 · Agent: Codex · Cỡ: L

### E13-S03 · Trang bảng giá & so sánh gói
- **Chi tiết**: trang marketing của nền tảng (là một tenant đặc biệt dùng chính hệ thống section) có bảng gói sinh từ
  `packages/plans` (tính năng, giới hạn, nhóm theme), FAQ, form đăng ký tư vấn.
- **AC**: [ ] Đổi `plans.ts` → bảng giá cập nhật sau deploy, không sửa nội dung tay.
- Phụ thuộc: E6-S01 · Agent: Claude · Cỡ: S

### E13-S04 · Thư viện demo 15 preset
**Là** khách tiềm năng, **tôi muốn** xem demo thật của từng mẫu và thử đổi theme/variant, **để** chọn mẫu phù hợp.
- **Chi tiết**: 15 tenant demo `template-NN.<platform>` (thay các bản deploy branch cũ), thanh demo (học từ `NEXT_PUBLIC_DEMO_MODE`
  của t15) cho phép thử theme khác, bật/tắt section, đổi variant — chỉ lưu trong trình duyệt; nút "Dùng mẫu này" → form tư vấn
  ghi sẵn preset.
- **AC**: [ ] Thay đổi của khách xem demo không ghi vào DB · [ ] Demo reset mỗi đêm.
- Phụ thuộc: E4-S01…S10, S01 · Agent: Codex · Cỡ: M

### E13-S05 · Hướng dẫn trong CMS (onboarding)
- **Chi tiết**: checklist bước đầu (logo → thông tin liên hệ → thay dữ liệu mẫu → thêm 3 dự án → kênh nhận lead → tên miền →
  email tên miền) với tiến độ %; tooltip ngắn; video hướng dẫn 1–2 phút mỗi bước.
- **AC**: [ ] Tenant mới thấy checklist; hoàn thành ẩn đi · [ ] Thử nghiệm với 3 khách thật, ghi lại điểm vướng.
- Phụ thuộc: E7 · Agent: Claude · Cỡ: S

### E13-S06 · Wizard: chọn cấu trúc trang & section theo gói
**Là** super admin, **tôi muốn** chọn trang và section cho từng trang ngay lúc tạo site gói Nâng cao/Cao cấp, **để** bàn
giao site đúng bố cục khách đã chốt khi bán.
- **Chi tiết** (thêm vào wizard E13-S01, giữa bước 5 và 6; chỉ hiện khi có `pageStructure`):
  - **Cấu trúc**: danh mục trang (D21 §2) dạng danh sách có công tắc; trang bắt buộc khóa bật; trang ngoài gói hiện khóa +
    lý do; trang landing thêm được khi có `landingPages`, đếm theo limit `pages`.
  - **Section từng trang**: dùng lại trình sửa danh sách section của E7-S04 (bật/tắt, kéo sắp xếp, đổi variant, thêm từ
    thư viện theo gói, `maxPerPage`). Thành phần dùng chung của `admin` và `console` đặt ở `packages/cms-ui`.
  - Mọi bước gọi `validateSiteStructure` ở server; nút "Khôi phục theo preset" cho từng trang.
- **AC**:
  - [ ] Gói Nâng cao: bỏ trang Giới thiệu, thêm section `faq` vào trang chủ → site tạo ra đúng như chọn, `/ve-chung-toi` 404.
  - [ ] Gửi thẳng API tạo site với trang/section ngoài gói (bỏ qua UI) → 422 kèm danh sách lỗi.
  - [ ] Đổi gói ở bước 3 sau khi đã chọn cấu trúc → mục ngoài gói mới bị đánh dấu và phải xử lý trước khi tạo.
- Phụ thuộc: S01, E7-S04 · Agent: Codex · Cỡ: M

