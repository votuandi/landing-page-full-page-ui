# E9 — Tên miền riêng & SSL

**Mục tiêu**: khách dùng tên miền của chính mình (khách đứng tên sở hữu), SSL tự động, miễn phí trên VPS
(Caddy on-demand TLS) hoặc qua Cloudflare for SaaS.
**Target epic**: từ lúc khách trỏ DNS đúng đến lúc site chạy HTTPS ≤ 10 phút; 0 chứng chỉ cấp cho tên miền không có
trong DB; cảnh báo trước khi tên miền/SSL gặp sự cố.
**Phụ thuộc**: E5-S03, E10-S01. Quy trình gắn tên miền: D21 §4.

---

### E9-S01 · Gắn tên miền thật & hướng dẫn trỏ DNS (console)
**Là** super admin, **tôi muốn** gắn tên miền khách đã mua (vd. `nang-luong-solar.net`) vào site đang chạy ở
`nang-luong-solar.<platform>`, **để** tên miền thật thành địa chỉ chính và subdomain nền tảng chuyển hướng về đó.
- **Chi tiết**:
  - Console, tab "Tên miền" của site: danh sách `Domain` (host, chính/phụ, trạng thái `pending|verified|active|error|removed`,
    SSL, lần kiểm gần nhất). Subdomain nền tảng luôn có, không gỡ được.
  - Thêm tên miền: nhập `nang-luong-solar.net` → chuẩn hóa (punycode, bỏ `http://`, bỏ `/`, bỏ `www.` để lấy apex) → kiểm trùng
    toàn hệ thống → tạo **hai** bản ghi apex + `www` (cùng `verificationToken`). Hiện bản ghi cần thêm: `www` CNAME →
    `sites.<platform>`; apex A → IP VPS (hoặc ALIAS/CNAME flattening); TXT `_solar-verify.<apex>` = token. Hướng dẫn có ảnh
    cho nhà đăng ký phổ biến ở VN (Mắt Bão, PA Việt Nam, Nhân Hòa, iNET, Tenten, Cloudflare), nút "Sao chép", nút "Kiểm tra ngay".
  - Trạng thái cập nhật trực tiếp theo job xác minh (S02). Khi apex hoặc `www` thành `active`: nút "Đặt làm tên miền chính"
    (mặc định gợi ý apex trên VPS, `www` khi dùng Cloudflare theo D7), hoặc tùy chọn "Tự đặt làm chính khi sẵn sàng".
  - CMS site: owner thấy cùng danh sách ở chế độ chỉ đọc. Owner tự thêm tên miền khi có permission `domains.manage` (super
    admin tắt được, E15-S05), dùng chung thành phần `packages/cms-ui`.
  - Nhắc: tên miền đứng tên công ty khách, nền tảng không giữ tên miền.
- **AC**:
  - [ ] Không thêm được tên miền đã thuộc tenant khác.
  - [ ] Giới hạn số tên miền theo gói (E6): apex + `www` tính là 1; subdomain nền tảng không tính.
  - [ ] Nút "Đặt làm tên miền chính" bị khóa khi tên miền chưa `active`.
- Phụ thuộc: E15-S02 · Agent: Claude · Cỡ: M

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
  Host nền tảng không đi qua `ask`: `console.<platform>` dùng cert thường; `*.<platform>`, `*.admin.<platform>`,
  `*.preview.<platform>` dùng cert wildcard (ACME DNS-01) — Caddy định tuyến `*.admin` → `admin:3000`,
  `console` → `console:3000`, còn lại → `web` (D17).
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
- **Chi tiết**: chọn tên miền chính (console S01, chỉ khi `active`); tên miền khác + `www`/không `www` + subdomain nền tảng
  → 308 về chính, giữ nguyên path và query; HSTS bật sau khi `active` 7 ngày; HTTP → HTTPS. Canonical, sitemap, OG chuyển
  sang tên miền chính mới (E5-S08) và `noindex` của subdomain nền tảng theo D21 §3. Tên miền chính bị lỗi (`error`) quá
  24 h → cảnh báo, **không** tự đổi lại (tránh nhảy qua lại); super admin đổi tay về subdomain nếu cần.
- **AC**: [ ] Đổi tên miền chính có hiệu lực ≤ 60 s · [ ] Không có vòng lặp redirect (test ma trận 4 biến thể host +
  subdomain nền tảng) · [ ] `nang-luong-solar.<platform>/san-pham?x=1` → 308 `https://nang-luong-solar.net/san-pham?x=1`.
- Phụ thuộc: S02, E5-S03 · Agent: Codex · Cỡ: S

### E9-S05 · Giám sát tên miền & SSL
- **Chi tiết**: job ngày kiểm DNS vẫn trỏ đúng, cert còn > 14 ngày, tên miền sắp hết hạn đăng ký (WHOIS/RDAP nếu có) →
  cảnh báo cho owner (email/Telegram) và super admin.
- **AC**: [ ] Tên miền bị trỏ đi nơi khác → trạng thái `error` + thông báo trong ≤ 24 h.
- Phụ thuộc: S02 · Agent: Codex · Cỡ: S
