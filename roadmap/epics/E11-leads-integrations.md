# E11 — Lead, tích hợp & email theo tên miền

**Mục tiêu**: mọi form (dự toán, "Nhận báo giá", giỏ báo giá, popup, đại lý, liên hệ) gửi lead về đúng tenant, lưu lại,
chuyển tới kênh khách chọn; bán kèm email theo tên miền (Zoho Mail / Google Workspace) thay vì tự host.
**Target epic**: 0 lead bị mất (lưu DB trước, gửi kênh sau, có retry); khách nhận thông báo lead ≤ 30 s; ≥ 30% tenant
gói Nâng cao trở lên dùng email theo tên miền qua link đối tác sau 6 tháng.
**Phụ thuộc**: E5-S02, E6-S02.

---

### E11-S01 · API lead đa tenant
**Là** tenant, **tôi muốn** mọi lead từ site của tôi được lưu và không lẫn với khách khác, **để** không bỏ lỡ khách hàng.
- **Chi tiết**: giữ hợp đồng của t15 (`POST /api/lead`: họ tên, SĐT di động VN, honeypot, `source`, `estimate`, `items`,
  `province`, `businessType`, `page`). Tenant xác định từ host (không tin trường gửi lên). Kiểm entitlement theo `source`.
  Chống spam: honeypot + thời gian điền tối thiểu + rate-limit theo IP/SĐT (Redis) + Turnstile tùy chọn.
  **Transactional outbox** (D14): ghi `Lead` và các bản ghi `Outbox{type:"lead.deliver", channel}` trong **cùng transaction**;
  worker (container `worker`, E10-S02) lấy job bằng `FOR UPDATE SKIP LOCKED`, gửi với idempotency key `leadId:channel`, retry lũy
  thừa tới 24 h, rồi chuyển `dead` + cảnh báo; nút "Gửi lại" trong hộp thư lead. Story này sở hữu bảng `Outbox` + vòng lặp worker
  dùng chung cho revalidate (E5-S05) và xử lý media (E8).
- **AC**:
  - [ ] Test: lead gửi lên host tenant A chỉ xuất hiện ở A.
  - [ ] Inject lỗi: kill worker giữa lúc gửi, queue/Redis sập, adapter trả 500 → sau khi hồi phục mọi lead được gửi đúng 1 lần
        tới mỗi kênh (kênh hỗ trợ idempotency) hoặc ít nhất 1 lần (kênh không hỗ trợ — ghi rõ).
  - [ ] Crash ngay sau khi trả 200 cho trình duyệt → lead vẫn có trong DB và outbox.
  - [ ] 20 request/phút từ cùng IP → 429.
- Agent: Codex · Cỡ: M

### E11-S02 · Kênh nhận lead theo tenant
- **Chi tiết**: chuyển `lib/leads/*` của t15 thành `packages/leads`, cấu hình trong DB (mã hóa): email (Resend/SES/SMTP),
  Telegram (bot của nền tảng + chat id khách, hướng dẫn `/start`), Zalo OA (backlog), webhook (Zapier/Make/n8n/CRM, có ký
  HMAC), Google Sheets (Apps Script `scripts/lead-google-apps-script.gs`). Nút "Gửi thử".
  URL webhook/Sheets do tenant nhập: chỉ `https`, phân giải DNS rồi chặn IP nội bộ/loopback/link-local/metadata (169.254.169.254),
  không tự theo redirect sang host khác, kiểm lại IP lúc kết nối (chống DNS rebinding), timeout 10 s, giới hạn kích thước phản hồi.
- **AC**: [ ] Mỗi kênh có test với mock · [ ] Kênh theo gói (webhook/Sheets từ gói Nâng cao) ·
  [ ] Webhook trỏ `http://127.0.0.1`, `http://169.254.169.254`, host phân giải ra IP nội bộ, hoặc redirect sang chúng → bị từ chối.
- Phụ thuộc: S01, E10-S05 · Agent: Codex · Cỡ: M

### E11-S03 · Hộp thư lead trong CMS
**Là** nhân viên kinh doanh của tenant, **tôi muốn** xem, lọc và cập nhật trạng thái lead, **để** chăm sóc khách kịp thời.
- **Chi tiết**: danh sách lead (nguồn, phân khúc, tỉnh, kết quả dự toán, sản phẩm trong giỏ), trạng thái
  `mới|đã liên hệ|báo giá|chốt|hủy`, ghi chú, gán người phụ trách/chi nhánh (gói Cao cấp), xuất CSV (gói Cao cấp),
  thống kê theo nguồn/tuần. Dữ liệu cá nhân: chỉ owner/editor xem; xóa lead theo yêu cầu (tuân thủ Nghị định 13/2023 về
  bảo vệ dữ liệu cá nhân — có checkbox đồng ý trên form).
- **AC**: [ ] Lead mới hiện ≤ 5 s không cần tải lại · [ ] Xuất CSV đúng UTF-8 mở được bằng Excel.
- Phụ thuộc: S01, E7-S02 · Agent: Claude · Cỡ: M

### E11-S04 · Email theo tên miền (Zoho Mail / Google Workspace)
**Là** tenant, **tôi muốn** có email `ten@congty.vn` mà không phải tự lo máy chủ mail, **để** chuyên nghiệp; **là** chủ dự án, **tôi muốn** hưởng hoa hồng/phí cài đặt.
- **Chi tiết**: trang "Email theo tên miền": so sánh Zoho Mail và Google Workspace (giá tham khảo, cập nhật được bởi super admin),
  nút đăng ký qua link đối tác (affiliate/reseller) có gắn mã theo tenant, hoặc nút "Nhờ cài hộ" (tạo yêu cầu dịch vụ, phí cài
  đặt). Sau khi khách có tài khoản: hiển thị bản ghi MX, SPF, DKIM, DMARC cần thêm theo nhà cung cấp; nút "Kiểm tra" tra DNS
  và báo từng bản ghi đúng/sai; cảnh báo xung đột (hai SPF). Không chạy mail server trên hạ tầng nền tảng.
- **Target**: khách tự cấu hình xong DNS email ≤ 15 phút.
- **AC**:
  - [ ] Kiểm tra DNS phát hiện thiếu DKIM / SPF trùng.
  - [ ] Super admin xem danh sách tenant đã bấm link đối tác và trạng thái (để đối soát hoa hồng).
- Phụ thuộc: E9-S01 · Agent: Claude · Cỡ: M

### E11-S05 · Email gửi đi từ nền tảng
- **Chi tiết**: email hệ thống (mời thành viên, magic link, thông báo lead, cảnh báo tên miền) gửi qua Resend hoặc Amazon SES từ
  tên miền nền tảng có SPF/DKIM/DMARC; tùy chọn gói Cao cấp: gửi thông báo lead "thay mặt" tên miền khách (xác minh domain ở nhà cung cấp gửi).
- **AC**: [ ] Email hệ thống vào hộp thư chính Gmail (mail-tester ≥ 9/10).
- Phụ thuộc: E10-S05 · Agent: Codex · Cỡ: S
