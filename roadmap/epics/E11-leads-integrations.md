# E11 — Lead, tích hợp & email theo tên miền

**Mục tiêu**: mọi form (dự toán, "Nhận báo giá", giỏ báo giá, popup, đại lý, liên hệ) gửi lead về đúng tenant, lưu lại,
chuyển tới kênh khách chọn; bán kèm email theo tên miền (Zoho Mail / Google Workspace) thay vì tự host.
**Target epic**: 0 lead bị mất (lưu DB trước, gửi kênh sau, có retry); khách nhận thông báo lead ≤ 30 s; ≥ 30% tenant
gói Nâng cao trở lên dùng email theo tên miền qua link đối tác sau 6 tháng.
**Phụ thuộc**: E5-S02, E6-S02.

---

### E11-S01 · API lead đa tenant ✅ · PR [#41](https://github.com/votuandi/landing-page-full-page-ui/pull/41)
**Là** tenant, **tôi muốn** mọi lead từ site của tôi được lưu và không lẫn với khách khác, **để** không bỏ lỡ khách hàng.
- **Chi tiết**: giữ hợp đồng của t15 (`POST /api/lead`: họ tên, SĐT di động VN, honeypot, `source`, `estimate`, `items`,
  `province`, `businessType`, `page`). Tenant xác định từ host (không tin trường gửi lên). Kiểm entitlement theo `source`.
  Chống spam: honeypot + thời gian điền tối thiểu + rate-limit theo IP/SĐT (Redis) + Turnstile tùy chọn.
  **Transactional outbox** (D14): ghi `Lead` và các bản ghi `Outbox{type:"lead.deliver", channel}` trong **cùng transaction**;
  worker (container `worker`, E10-S02) lấy job bằng `FOR UPDATE SKIP LOCKED`, gửi với idempotency key `leadId:channel`, retry lũy
  thừa tới 24 h, rồi chuyển `dead` + cảnh báo; nút "Gửi lại" trong hộp thư lead. Story này sở hữu bảng `Outbox` + vòng lặp worker
  dùng chung cho revalidate (E5-S05) và xử lý media (E8).
- **AC**:
  - [x] Test: lead gửi lên host tenant A chỉ xuất hiện ở A.
  - [x] Inject lỗi: kill worker giữa lúc gửi, queue/Redis sập, adapter trả 500 → sau khi hồi phục mọi lead được gửi đúng 1 lần
        tới mỗi kênh (kênh hỗ trợ idempotency) hoặc ít nhất 1 lần (kênh không hỗ trợ — ghi rõ).
  - [x] Crash ngay sau khi trả 200 cho trình duyệt → lead vẫn có trong DB và outbox.
  - [x] 20 request/phút từ cùng IP → 429.
- PR: #41 (gộp E5-S05, E6-S03, E6-S05). Bằng chứng: `apps/worker/README.md`, `leadIntake.int.test.ts`, `outbox.int.test.ts`, `leads.int.test.ts`.
- Agent: Codex · Cỡ: M

### E11-S02 · Kênh nhận lead theo tenant ✅ · PR [#71](https://github.com/votuandi/landing-page-full-page-ui/pull/71)
- **Chi tiết**: chuyển `lib/leads/*` của t15 thành `packages/leads`, cấu hình trong DB (mã hóa): email (Resend/SES/SMTP),
  Telegram (bot của nền tảng + chat id khách, hướng dẫn `/start`), Zalo OA (backlog), webhook (Zapier/Make/n8n/CRM, có ký
  HMAC), Google Sheets (Apps Script `scripts/lead-google-apps-script.gs`). Nút "Gửi thử".
  URL webhook/Sheets do tenant nhập: chỉ `https`, phân giải DNS rồi chặn IP nội bộ/loopback/link-local/metadata (169.254.169.254),
  không tự theo redirect sang host khác, kiểm lại IP lúc kết nối (chống DNS rebinding), timeout 10 s, giới hạn kích thước phản hồi.
- **Chuyển từ E11-S01 (review PR #41, người dùng chốt 15/10/2026)**: e2e Playwright bật Turnstile (widget giả + khóa test
  Cloudflare cho Siteverify trên CI) trên 3 form — token vào request, `503 → reset widget → token mới → 200`, giữ dữ liệu form.
- **AC**: [x] Mỗi kênh có test với mock · [x] Kênh theo gói (webhook/Sheets từ gói Nâng cao) ·
  [x] Webhook trỏ `http://127.0.0.1`, `http://169.254.169.254`, host phân giải ra IP nội bộ, hoặc redirect sang chúng → bị từ chối.
- Bằng chứng unit: `packages/leads/src/__tests__/{channels,safeRequest,config}.test.ts`;
  gói có unit admin/intake, còn chờ DB thật (`leads.int.test.ts`, `leadChannels.int.test.ts`) và e2e `turnstile.spec.ts`.
- Phụ thuộc: S01, E10-S05 · Agent: Codex · Cỡ: M
- Backlog: Zalo OA triển khai ở story sau; E11-S02 dùng Resend HTTP cho email, chưa thêm SES/SMTP.

### E11-S03 · Hộp thư lead trong CMS ✅ · PR [#72](https://github.com/votuandi/landing-page-full-page-ui/pull/72)
**Là** nhân viên kinh doanh của tenant, **tôi muốn** xem, lọc và cập nhật trạng thái lead, **để** chăm sóc khách kịp thời.
- **Chi tiết**: danh sách lead (nguồn, phân khúc, tỉnh, kết quả dự toán, sản phẩm trong giỏ), trạng thái
  `mới|đã liên hệ|báo giá|chốt|hủy`, ghi chú, gán người phụ trách/chi nhánh (gói Cao cấp), xuất CSV (gói Cao cấp),
  thống kê theo nguồn/tuần. Dữ liệu cá nhân: chỉ vai trò có permission `leads.view` xem (E7-S01); xóa lead theo yêu cầu (tuân thủ Nghị định 13/2023 về
  bảo vệ dữ liệu cá nhân — có checkbox đồng ý trên form).
- **Chuyển từ E11-S01 (review PR #41)**: e2e submit thật (timer ≥ 3 s) qua mọi form tenant — section LeadForm, dealer, popup,
  giỏ báo giá — kiểm lead + outbox xuất hiện trong hộp thư đúng tenant.
- **AC**: [x] Lead mới hiện ≤ 5 s không cần tải lại · [x] Xuất CSV đúng UTF-8 mở được bằng Excel. PR [#72](https://github.com/votuandi/landing-page-full-page-ui/pull/72)
- **Bằng chứng E11-S03**: `apps/admin/src/__tests__/leadInbox.test.ts` kiểm BOM UTF-8, CRLF, tiếng Việt, quote và chống công thức;
  spec `tooling/visual/admin.spec.ts` ("lead inbox…") kiểm 4 form thật, poll, giữ ghi chú, quyền/gói, CSV, resend/xóa và tenant isolation — xanh local 29/10/2026 (2/2, mỗi lead hiện ≤ 5 s sau POST; axe A/AA 390/1440).
- Phụ thuộc: S01, E7-S02 · Agent: Claude · Cỡ: M

### E11-S04 · Email theo tên miền (Zoho Mail / Google Workspace)
**Là** tenant, **tôi muốn** có email `ten@congty.vn` mà không phải tự lo máy chủ mail, **để** chuyên nghiệp; **là** chủ dự án, **tôi muốn** hưởng hoa hồng/phí cài đặt.
- **Chi tiết**: trang "Email theo tên miền": so sánh Zoho Mail và Google Workspace (giá tham khảo, super admin cập nhật trong cấu hình nền tảng E15-S06),
  nút đăng ký qua link đối tác (affiliate/reseller) có gắn mã theo tenant, hoặc nút "Nhờ cài hộ" (tạo yêu cầu dịch vụ, phí cài
  đặt). Sau khi khách có tài khoản: hiển thị bản ghi MX, SPF, DKIM, DMARC cần thêm theo nhà cung cấp; nút "Kiểm tra" tra DNS
  và báo từng bản ghi đúng/sai; cảnh báo xung đột (hai SPF). Không chạy mail server trên hạ tầng nền tảng.
- **Target**: khách tự cấu hình xong DNS email ≤ 15 phút.
- **AC**:
  - [ ] Kiểm tra DNS phát hiện thiếu DKIM / SPF trùng.
  - [ ] Super admin xem danh sách tenant đã bấm link đối tác và trạng thái (để đối soát hoa hồng).
- Phụ thuộc: E9-S01 · Agent: Claude · Cỡ: M

### E11-S05 · Email gửi đi từ nền tảng ✅ · PR [#73](https://github.com/votuandi/landing-page-full-page-ui/pull/73)
- **Chi tiết**: email hệ thống (mời thành viên, magic link, thông báo lead, cảnh báo tên miền) gửi qua Resend hoặc Amazon SES từ
  tên miền nền tảng có SPF/DKIM/DMARC. Gửi "thay mặt" tên miền khách tách sang E11-S06 (người dùng chốt 30/10/2026).
- **AC**: [ ] Email hệ thống vào hộp thư chính Gmail (mail-tester ≥ 9/10).
- **Còn mở**: AC mail-tester chưa đo, cần tên miền và API key thật (`infra/mail/README.md`). ✅ ở đây chỉ nghĩa là đã merge.
- Phụ thuộc: E10-S05 · Agent: Codex · Cỡ: S

### E11-S06 · Gửi thông báo lead thay mặt tên miền khách
**Là** tenant gói Cao cấp, **tôi muốn** thông báo lead gửi từ tên miền của tôi, **để** đồng bộ thương hiệu.
- **Chi tiết**: entitlement riêng cho gói Cao cấp, kiểm cả server lẫn API. Admin nhập tên miền gửi, nền tảng tạo domain ở nhà cung
  cấp gửi (Resend Domains API), hiển thị bản ghi DNS cần thêm và nút "Kiểm tra". Chỉ dùng tên miền đã xác minh làm `from`;
  chưa xác minh hoặc hết gói thì quay về tên miền nền tảng, không mất lead.
- **AC**:
  - [ ] Tên miền chưa xác minh không bao giờ xuất hiện trong `from`.
  - [ ] Hạ gói hoặc gỡ xác minh → lead vẫn được gửi từ tên miền nền tảng.
  - [ ] Tenant không xem hoặc dùng được tên miền gửi của tenant khác.
- Phụ thuộc: S02, S05 · Agent: Claude · Cỡ: M
