# E6 — Gói dịch vụ & cờ tính năng

**Mục tiêu**: bảng giá bán hàng và code là một. Tính năng (máy tính chi phí, form "Nhận báo giá", video Shorts…) là cờ
bật/tắt theo gói, kiểm tra phía server.
**Target epic**: đổi gói của một tenant → tính năng tương ứng bật/tắt ≤ 60 s mà không deploy; trang bảng giá sinh từ cùng file.
**Phụ thuộc**: E5-S01.

---

### E6-S01 · Định nghĩa gói trong code
**Là** chủ dự án, **tôi muốn** khai báo 3 gói và tính năng của từng gói ở một chỗ, **để** không bao giờ lệch giữa bán và giao.
- **Chi tiết**: `packages/plans/plans.ts`:
  ```ts
  type Feature = "calculator" | "leadForm" | "quoteForm" | "packages" | "shorts" | "tiktok" | "catalog" | "quoteCart"
    | "dealer" | "branchMap" | "press" | "bilingual" | "blog" | "leadWebhook" | "leadInbox" | "leadExport"
    | "sectionReorder" | "variantSwitch" | "themeOverride" | "builder" | "landingPages" | "customDomain" | "abTest";
  plans = {
    basic:   { themes: ["classic"], features: [...], limits: { domains: 1, mediaGb: 1,  pages: 1,  users: 1 } },
    pro:     { themes: ["classic","pro"], features: [...], limits: { domains: 1, mediaGb: 5,  pages: 3,  users: 3 } },
    premium: { themes: ["classic","pro","signature"], features: [...], limits: { domains: 3, mediaGb: 20, pages: 20, users: 10 } },
  }
  ```
  Ánh xạ section type → feature lấy từ `meta.entitlement` (E3-S01). Gói khớp bảng ở `roadmap/README.md` §4.
  `addons`: mua lẻ một feature (vd. `shorts` cho gói Nâng cao).
- **AC**:
  - [ ] Test: mọi section type có entitlement hợp lệ; mọi feature xuất hiện ở ít nhất một gói.
  - [ ] Bảng Markdown trong README được sinh bằng `pnpm plans:table` (CI kiểm khớp).
- Agent: Claude · Cỡ: S

### E6-S02 · `can()` và `limit()` phía server
**Là** chủ dự án, **tôi muốn** tính năng ngoài gói không chạy dù ai đó sửa cấu hình, **để** không mất doanh thu.
- **Chi tiết**: `can(site, feature)`, `limit(site, key)`, `assertCan()` (ném `EntitlementError` 403). Dùng ở:
  PageRenderer (bỏ section không đủ quyền — không render, không tải chunk), API lead (từ chối `source` thuộc tính năng bị tắt),
  API admin (thêm section, upload vượt dung lượng, thêm tên miền), widget. Trial: toàn bộ tính năng premium 14 ngày.
- **Target**: 100% điểm vào có kiểm tra (danh sách trong test).
- **AC**:
  - [ ] Hạ gói Cao cấp → Nâng cao: section `shorts` biến mất sau revalidate, dữ liệu vẫn giữ nguyên (nâng lại gói là hiện).
  - [ ] Gọi `POST /api/lead` với `source: "quote-cart"` trên tenant không có `quoteCart` → 403.
  - [ ] Upload vượt `mediaGb` → 413 với thông báo tiếng Việt.
- Phụ thuộc: S01, E3-S03 · Agent: Codex · Cỡ: M

### E6-S03 · Đổi gói → revalidate
- **Chi tiết**: super admin đổi `planId`/`addons` → ghi `AuditLog`, revalidate tag `tenant:<id>`, gửi email/Telegram cho
  chủ tenant.
- **AC**: [ ] Thay đổi có hiệu lực ≤ 60 s · [ ] Audit log ghi người đổi, gói cũ, gói mới.
- Phụ thuộc: S02, E5-S05 · Agent: Codex · Cỡ: S

### E6-S04 · UI khóa tính năng trong CMS
**Là** tenant gói thấp, **tôi muốn** thấy tính năng cao cấp bị khóa kèm lời mời nâng cấp, **để** biết mình có thể mua gì.
- **Chi tiết**: thư viện section trong CMS hiện section ngoài gói với biểu tượng khóa, nút "Nâng cấp" mở form yêu cầu
  (tạo lead nội bộ cho đội bán hàng). Theme ngoài nhóm được phép: xem trước được, không áp dụng được.
  Quy tắc khi hạ gói (khớp E6-S02): section/theme đã có từ trước được **giữ nguyên trong cấu hình** với cờ `lockedByPlan`
  (không render, không sửa được, không mất dữ liệu); chỉ **thêm mới** hoặc **bật lại** mục ngoài gói mới bị từ chối.
  Theme ngoài gói sau khi hạ → site dùng theme mặc định của nhóm được phép cho tới khi khách chọn lại.
- **AC**: [ ] Thêm section/theme ngoài gói → server từ chối, UI báo rõ · [ ] Lưu trang có section `lockedByPlan` không thay đổi →
  thành công · [ ] Nâng gói lại → section khóa hiện lại với nguyên dữ liệu.
- Phụ thuộc: S02, E7-S04 · Agent: Claude · Cỡ: S

### E6-S05 · Thanh toán (giai đoạn sau)
- **Chi tiết**: giai đoạn đầu xuất hóa đơn thủ công, super admin gán gói và ngày hết hạn; cron nhắc gia hạn trước 14/7/1 ngày;
  hết hạn + 7 ngày ân hạn → `suspended`. Tích hợp cổng thanh toán VN (PayOS/VNPay) để ở backlog.
- **AC**: [ ] Cron nhắc và chuyển trạng thái chạy đúng (test với đồng hồ giả).
- Phụ thuộc: S03 · Agent: Codex · Cỡ: M
