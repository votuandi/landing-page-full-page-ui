# E14 — Chất lượng: test, bảo mật, hiệu năng, truy cập, SEO

**Mục tiêu**: nền tảng nhiều khách đủ an toàn và nhanh để bán cho doanh nghiệp; lỗi bị chặn ở CI thay vì ở site khách.
**Target epic**: 0 lỗi nghiêm trọng mở trước mỗi release; Lighthouse mobile trang chủ mọi preset ≥ 90 Performance,
≥ 95 Accessibility, ≥ 95 SEO; bộ test cô lập tenant chạy mỗi PR.
**Phụ thuộc**: chạy xuyên suốt; mỗi story gắn với epic tương ứng.

---

### E14-S01 · Chiến lược test
- **Chi tiết**: unit (`packages/core`, `tokens`, `plans`, schema section — chọn vitest hoặc giữ `node:test` ở E1-S05);
  contract test (storage driver, lead adapter); integration (repository + Postgres thật qua Testcontainers/compose);
  e2e Playwright (luồng: xem trang → dự toán → gửi lead; CMS sửa → revalidate; thêm tên miền); visual (E1-S04, E3-S10).
- **AC**: [ ] Tài liệu `TESTING.md` · [ ] Ngưỡng phủ: core ≥ 85%, packages khác ≥ 70%.
- Agent: Claude · Cỡ: S

### E14-S02 · E2E luồng chuyển đổi chính
- **Chi tiết**: kịch bản Playwright trên 3 preset (t08, t12, t15): mở trang chủ → chọn phân khúc → nhập hóa đơn → xem kết quả →
  gửi "Nhận báo giá" → lead xuất hiện trong CMS; giỏ báo giá (t13/t15); popup tư vấn.
- **AC**: [ ] Chạy mỗi PR chạm `sections`, `core`, `leads`, `apps/web` · [ ] ≤ 6 phút.
- Phụ thuộc: E11-S01 · Agent: Codex · Cỡ: M

### E14-S03 · Bộ test cô lập tenant
**Là** chủ dự án, **tôi muốn** bằng chứng tự động rằng khách A không bao giờ thấy dữ liệu khách B, **để** yên tâm bán.
- **Chi tiết**: seed 2 tenant có dữ liệu trùng slug; kiểm: trang công khai, sitemap, API lead, API admin (user A gọi id của B →
  404), media (đoán khóa của B), cache (revalidate A không ảnh hưởng B), preview token A trên host B, RLS truy vấn thô.
- **Target**: 100% endpoint admin có trong ma trận kiểm.
- **AC**: [ ] Test sinh danh sách endpoint tự động và fail khi có endpoint mới chưa vào ma trận.
- Phụ thuộc: E5-S09, E7 · Agent: Codex (review Claude adversarial) · Cỡ: M

### E14-S04 · Bảo mật ứng dụng
- **Chi tiết**: CSP theo D13 — `apps/web` CSP tĩnh + hash script (không nonce để giữ ISR), `apps/admin` nonce; `frame-src`
  cho YouTube/TikTok/Bunny theo cấu hình; chống SSRF cho mọi URL do tenant nhập (webhook, ảnh từ URL); cookie `Secure; HttpOnly;
  SameSite=Lax`; CSRF cho Server Actions (origin check mặc định của Next) và API; rate-limit đăng nhập/lead/upload; kiểm phụ thuộc
  (`pnpm audit`, Dependabot/Renovate); `/security-review` của Claude và `/codex:adversarial-review` trước mỗi release;
  pentest nội bộ theo OWASP ASVS L1.
- **AC**: [ ] securityheaders.com hạng A cho site demo · [ ] 0 lỗ hổng High/Critical đã biết trong dependency khi release ·
  [ ] Trang công khai vẫn là static/ISR sau khi bật CSP (kiểm output `next build`).
- Agent: Claude · Cỡ: M

### E14-S05 · Ngân sách hiệu năng
- **Chi tiết**: ngân sách JS trang chủ ≤ 120 KB gzip (section dưới màn hình đầu lazy, variant code-split); ảnh qua E8-S03;
  font ≤ 2 họ; kiểm bằng Lighthouse CI trên 15 preset; k6 tải 200 RPS trang đã cache trên VPS chuẩn.
- **AC**: [ ] CI fail khi vượt ngân sách · [ ] p95 TTFB ≤ 300 ms ở 200 RPS (trang cache).
- Phụ thuộc: E4, E5 · Agent: Codex · Cỡ: M

### E14-S06 · Truy cập (a11y)
- **Chi tiết**: axe-core trong e2e và ma trận section; bàn phím cho carousel, dialog, mega menu, builder; `prefers-reduced-motion`;
  nội dung hiện khi tắt JS (yêu cầu sẵn có từ t07); kiểm tương phản sau override màu (E2-S05).
- **AC**: [ ] 0 vi phạm axe mức serious/critical trên 15 preset.
- Agent: Codex · Cỡ: M

### E14-S07 · Tài liệu & bàn giao
- **Chi tiết**: README từng package; `docs-public/` (không bị `.gitignore` như `/docs`) cho hướng dẫn khách dùng CMS; runbook vận hành
  (deploy, rollback, khôi phục, xử lý tên miền lỗi); cập nhật `AGENTS.md` khi quy ước đổi.
- **AC**: [ ] Một dev mới (hoặc agent mới) dựng môi trường dev và hoàn thành một story nhỏ chỉ dựa vào tài liệu.
- Agent: Claude · Cỡ: S
