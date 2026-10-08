# E9 — Tên miền riêng & SSL

**Mục tiêu**: khách dùng tên miền của chính mình (khách đứng tên sở hữu), SSL tự động, miễn phí trên VPS
(Caddy on-demand TLS) hoặc qua Cloudflare for SaaS.
**Target epic**: từ lúc khách trỏ DNS đúng đến lúc site chạy HTTPS ≤ 10 phút; 0 chứng chỉ cấp cho tên miền không có
trong DB; cảnh báo trước khi tên miền/SSL gặp sự cố.
**Phụ thuộc**: E5-S03, E10-S01.

---

### E9-S01 · Thêm tên miền & hướng dẫn trỏ DNS
**Là** tenant, **tôi muốn** nhập tên miền của tôi và nhận hướng dẫn rõ ràng, **để** tự trỏ được dù không rành kỹ thuật.
- **Chi tiết**: admin nhập `congty.vn` → chuẩn hóa (punycode, bỏ `http://`, bỏ `/`), kiểm trùng toàn hệ thống. Hiển thị bản
  ghi cần thêm: `www` CNAME → `sites.<platform>`; tên miền gốc A → IP VPS (hoặc ALIAS/CNAME flattening nếu nhà đăng ký hỗ
  trợ); TXT `_solar-verify.congty.vn` = token. Hướng dẫn có ảnh cho nhà đăng ký phổ biến ở VN (Mắt Bão, PA Việt Nam,
  Nhân Hòa, iNET, Tenten, Cloudflare). Nhắc: tên miền đứng tên công ty khách, nền tảng không giữ tên miền.
- **AC**:
  - [ ] Không thêm được tên miền đã thuộc tenant khác.
  - [ ] Giới hạn số tên miền theo gói (E6).
- Agent: Claude · Cỡ: M

### E9-S02 · Xác minh DNS & endpoint `ask` cho Caddy
**Là** chủ dự án, **tôi muốn** chỉ cấp SSL cho tên miền đã xác minh, **để** không bị lạm dụng và không vượt rate-limit Let's Encrypt.
- **Chi tiết**: job kiểm DNS (TXT + CNAME/A) mỗi 1 phút trong 1 giờ đầu, sau đó mỗi 30 phút trong 72 giờ → `verified`.
  Endpoint `ask` chạy trên **listener nội bộ riêng** (worker, cổng 4000 chỉ trong mạng Docker) — không phải route của `web`, nên
  không thể lọt ra Internet qua `reverse_proxy`. Trả 200 khi tên miền `verified|active`, 404 nếu không — cache 60 s. Caddyfile:
  ```caddyfile
  { on_demand_tls { ask http://worker:4000/domains/allow } }
  https:// {
    tls { on_demand }
    @internal path /api/internal/* /sites/*
    respond @internal 404
    reverse_proxy web:3000
  }
  ```
  `verified → active`: job gọi thử `https://<host>/api/health` sau khi xác minh; handshake thành công → `active`.
  Gỡ tên miền: proxy (E5-S03) trả 404 ngay ở tầng HTTP; chứng chỉ còn hạn không làm site tiếp tục phục vụ.
- **Target**: 0 lần cấp chứng chỉ cho host lạ (kiểm bằng log Caddy).
- **AC**:
  - [ ] Truy cập host chưa xác minh → không có handshake TLS hợp lệ, không gọi ACME.
  - [ ] Sau khi `verified`, request HTTPS đầu tiên cấp cert ≤ 30 s; trạng thái chuyển `active`.
  - [ ] Endpoint `allow` không truy cập được từ Internet (test qua tên miền public và IP trực tiếp).
  - [ ] Tên miền đã gỡ (cert vẫn còn hạn) → 404 trong ≤ 60 s; gán lại cho tenant khác bắt buộc xác minh token mới.
- Phụ thuộc: S01 · Agent: Codex (review Claude adversarial) · Cỡ: M

### E9-S03 · Cloudflare for SaaS (Custom Hostnames)
**Là** chủ dự án, **tôi muốn** lựa chọn dùng Cloudflare làm lớp SSL/CDN/WAF cho tên miền khách, **để** chạy trên AWS hoặc khi cần chống DDoS.
- **Chi tiết**: `DOMAIN_PROVIDER=caddy|cloudflare`. Với Cloudflare: thêm tên miền → gọi API tạo Custom Hostname
  (DCV qua HTTP hoặc TXT), lưu `cfHostnameId`, đồng bộ trạng thái SSL bằng webhook/poll; khách CNAME tới
  `fallback-origin` của zone nền tảng. Ghi chi phí ước tính (100 hostname đầu miễn phí, sau đó khoảng $0,1/hostname/tháng)
  vào báo cáo super admin.
  Tên miền gốc (apex): theo D7 — mặc định `www` là chính, apex redirect; chỉ proxy apex khi DNS khách có CNAME flattening hoặc
  đã bật Apex Proxying. Origin chỉ nhận traffic từ Cloudflare (Authenticated Origin Pulls hoặc danh sách IP), SNI/TLS tới origin
  cấu hình đúng.
- **AC**:
  - [ ] Thêm/xóa tên miền đồng bộ hai chiều với Cloudflare.
  - [ ] Thử thật với 1 tên miền `www` và 1 apex (DNS Cloudflare) trên staging: HTTPS hợp lệ.
  - [ ] Gọi thẳng IP origin với Host của khách → bị từ chối.
  - [ ] Cùng codebase chạy được cả hai provider (test với mock API).
- Phụ thuộc: S01 · Agent: Codex · Cỡ: M

### E9-S04 · Tên miền chính, www và chuyển hướng
- **Chi tiết**: chọn tên miền chính; tên miền khác + `www`/không `www` + subdomain nền tảng → 308 về chính; HSTS bật sau khi
  `active` 7 ngày; HTTP → HTTPS.
- **AC**: [ ] Đổi tên miền chính có hiệu lực ≤ 60 s · [ ] Không có vòng lặp redirect (test ma trận 4 biến thể host).
- Phụ thuộc: S02, E5-S03 · Agent: Codex · Cỡ: S

### E9-S05 · Giám sát tên miền & SSL
- **Chi tiết**: job ngày kiểm DNS vẫn trỏ đúng, cert còn > 14 ngày, tên miền sắp hết hạn đăng ký (WHOIS/RDAP nếu có) →
  cảnh báo cho owner (email/Telegram) và super admin.
- **AC**: [ ] Tên miền bị trỏ đi nơi khác → trạng thái `error` + thông báo trong ≤ 24 h.
- Phụ thuộc: S02 · Agent: Codex · Cỡ: S
