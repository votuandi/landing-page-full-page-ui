# Checklist bảo mật trước release

Lưu kết quả, ngày kiểm, commit, người kiểm và link log trong hồ sơ release. Chỉ phát hành khi các mục bắt buộc đạt;
finding chưa xử lý phải có người chịu trách nhiệm và thời hạn. Console 2FA/IP allowlist/TOTP trước ghost thuộc E15-S02/S07.

- [ ] Chạy `/security-review` của Claude và `/codex:adversarial-review`; xử lý finding P0/P1 và case chưa được cover.
- [ ] `pnpm audit --prod --audit-level high` exit 0 ở local và job `audit` CI; không còn High/Critical tại thời điểm release.
  Kiểm GHSA của từng `pnpm.overrides` trong `package.json`; gỡ override khi upstream đã vá. Dependabot chạy hàng tuần cho
  npm (nhóm minor/patch) và GitHub Actions. Audit không thay thế review mã hoặc nguồn gốc dependency.
- [ ] Chạy test auth/CSRF, web/admin/sections; xác nhận cookie production `__Host-`, `Secure`, `HttpOnly`, `SameSite=Lax`;
  không có phiên admin cho `client`, không dùng cookie tenant khác/realm khác.
- [ ] Kiểm API mutation và Server Action: chặn origin lạ; xác thực + permission + entitlement trước thao tác dữ liệu;
  repository bắt buộc tenantId, cache tag có tiền tố tenant, dữ liệu cá nhân `private, no-store`.
- [ ] Kiểm rate-limit đăng nhập, lead, upload (60 reserve/10 phút/tenant), 429 có `Retry-After`; Redis lỗi vẫn có bộ đếm
  memory. Memory chỉ giới hạn trong một process khi Redis mất: kiểm cảnh báo Redis trước khi chạy nhiều replica.
- [ ] Kiểm webhook SSRF với localhost, IP private, DNS rebinding và redirect; không fetch URL tenant nhập ngoài adapter
  đã kiểm. Media chỉ public dưới `tenants/<tenantId>/`; private/quarantine không được phục vụ public.
- [ ] Chạy e2e production/admin/preview/Turnstile/journey: hydration, đăng nhập, mở story/dialog, gửi lead, builder iframe;
  không có console violation CSP. Admin script có nonce khớp CSP và đổi sau mỗi request; preview chỉ cho admin của nó nhúng.
- [ ] So sánh bảng route `next build` web với base: trang public vẫn static/ISR. Không dùng request nonce trên web.
- [ ] Sau deploy HTTPS demo, quét [securityheaders.com](https://securityheaders.com/) đạt hạng A, lưu URL và ảnh kết quả:
  CSP, HSTS `max-age=31536000` (không `includeSubDomains`/`preload`), `nosniff`, Referrer-Policy, Permissions-Policy,
  XFO DENY (preview không XFO, dùng `frame-ancestors` admin). Không suy ra hạng từ unit test.
- [ ] Pentest nội bộ theo [OWASP ASVS Level 1](https://owasp.org/www-project-application-security-verification-standard/):
  xác thực/phiên, phân quyền/tenant, validation/encoding/XSS, upload, CSRF/SSRF, cấu hình TLS/header, dữ liệu nhạy cảm và log.
  Ghi rõ phiên bản ASVS, mã yêu cầu, PASS/FAIL/N/A và bằng chứng từng mục; checklist này chưa phải kết quả pentest.

CSP public chấp nhận `'unsafe-inline'` theo [ADR D13](../roadmap/02-decisions.md); inline script injection vẫn phải được
ngăn tại bước render/sanitize. CSP không tự làm nội dung tenant an toàn.
