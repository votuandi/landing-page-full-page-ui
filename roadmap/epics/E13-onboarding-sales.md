# E13 — Khởi tạo site & quy trình bán hàng

**Mục tiêu**: từ lúc khách chốt gói đến lúc site chạy trên tên miền riêng ≤ 30 phút thao tác; khách tiềm năng tự xem demo
mọi preset và so sánh gói.
**Target epic**: tạo tenant mới từ preset ≤ 2 phút; 15 site demo phục vụ từ nền tảng; trang bảng giá sinh từ `packages/plans`.
**Phụ thuộc**: E4-S01…S10 (không gồm E4-S11 — story lưu trữ branch chạy sau E13-S04), E5, E6, E7-S09.

---

### E13-S01 · Tạo tenant từ preset
**Là** nhân viên vận hành, **tôi muốn** tạo site mới bằng vài bước, **để** giao site cho khách nhanh.
- **Chi tiết**: wizard (super admin, sau này cho khách tự đăng ký): tên công ty → chọn gói → chọn preset (lọc theo gói) →
  nhập thông tin cơ bản (logo, màu chính, hotline, Zalo, địa chỉ) → tạo `Tenant`, `Site`, `Page home` từ preset, `SectionContent`
  từ `defaults`/fixture đã thay tên công ty, subdomain `<slug>.<platform>`, user owner + email mời.
  Dữ liệu mẫu được gắn cờ `[DỮ LIỆU MẪU]` và CMS nhắc thay trước khi xuất bản.
- **AC**:
  - [ ] Wizard xong → site chạy tại subdomain ≤ 2 phút.
  - [ ] Checklist "Trước khi xuất bản" liệt kê mọi trường còn dữ liệu mẫu (giá, giấy phép, đánh giá, số liệu — như mục
        "Cần xác minh" trong README t15).
- Agent: Claude · Cỡ: M

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
