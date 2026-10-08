# E4 — Port 15 template thành theme + variant + preset

**Mục tiêu**: mọi template cũ tồn tại dưới dạng `packages/themes/tNN` + các variant `packages/sections/*/tNN.tsx` +
`packages/presets/tNN.json`; branch template chỉ còn để tham khảo (lưu trữ).
**Target epic**: 15 preset; preset render khớp trang chủ gốc về bố cục và nhận diện (designer duyệt ảnh so sánh);
0 vi phạm `lint:tokens`; mỗi theme đạt AA.
**Phụ thuộc**: E2 xong, E3-S01…S04; story nào cần type/widget của E3-S05…S08 thì phụ thuộc thêm story đó (ghi ở từng story).
Chạy song song bằng Codex (E0-S06), mỗi story một worktree.
**Quy trình chung mỗi template**: skill `solar-theme-port` → skill `solar-section-variant` cho từng section có giá trị →
preset → ảnh so sánh với branch gốc (390/1440px) → cập nhật bảng ở `01-template-analysis.md`.

**AC chung cho mọi story E4** (ngoài AC riêng):
- [ ] `packages/themes/tNN/theme.ts` parse qua `ThemeTokens`, `check-contrast` đạt AA.
- [ ] Mọi variant mới qua `lint:tokens`, render với fixture chung của type, render đúng ở ít nhất theme t15 và theme gốc.
- [ ] Preset `tNN.json` liệt kê section theo đúng thứ tự trang chủ gốc; section gốc không đủ giá trị được thay bằng variant
      gần nhất và ghi chú trong preset (`"note"`).
- [ ] Ảnh so sánh trước/sau lưu trong PR.

---

### E4-S01 · Signature: t15 (hoàn thiện)
- **Chi tiết**: t15 đã là nguồn của E3; story này hoàn tất preset đầy đủ 24 section + widget, theme light + dark, trang con.
- **Target**: preset t15 = trang hiện tại (ảnh khớp ≤ 0,5%) — đây là nghiệm thu "trang chủ t15 render từ cấu hình" của E3.
- Phụ thuộc: E3-S04…S08 · Agent: Claude · Cỡ: M

### E4-S02 · Signature: t12 "Sky & Sun / Emerald Dusk"
- **Chi tiết**: theme t12 (dark là bảng thứ hai). Variant: `calculator/t12` (SolarEstimator 5 bước bản gốc), `hero/t12`
  (HeroT8 trên nền tối), `packages/t12`, `investment-models/t12`, `projects/t12` (ProjectsGallery), `shorts/t12`,
  `stats/t12`, `segments/t12` (SavingsBySegment), `contact-dock/t12`.
- **Target**: lấy t12 làm bản đầu tiên chứng minh "đổi variant không mất dữ liệu" (`calculator/t12` ↔ `calculator/t15`).
- Phụ thuộc: E3-S05, E3-S06 (investment-models), E3-S07 (contact-dock) · Agent: Codex · Cỡ: M

### E4-S03 · Signature: t13 "Warm Sand"
- **Chi tiết**: theme đất nung + teal. Variant: `segments/t13` (SegmentGrid 4 phân khúc), `shorts/t13`, `products/t13`
  (ProductStrip + QuickView), `trust/t13`, `blog/t13`, `faq/t13`, widget `consult-popup/t13`, `commitments-strip/t13`.
- Phụ thuộc: E3-S05, E3-S06 (products), E3-S07, E3-S08 · Agent: Codex · Cỡ: M

### E4-S04 · Signature: t14 "EPC tối"
- **Chi tiết**: theme emerald tối, glass. Variant: `site-header/t14` (top bar + mega menu), `trust/t14` (Certificates),
  `brands/t14`, `projects/t14` (FeaturedProjects), `services/t14` (Solutions + slider video), `press/t14`, `tiktok/t14`,
  `dealer/t14`, `branch-map/t14`, `cta-banner/t14` (EngineerBanner), `social/t14`, widget `mobile-bottom-nav/t14`.
- Phụ thuộc: E3-S05, E3-S06, E3-S07 · Agent: Codex · Cỡ: L

### E4-S05 · Pro: t11 "Hóa đơn → gói"
- **Chi tiết**: map `--solar-*` → token; font Manrope (display) + Be Vietnam Pro (sans) local → khai báo trong
  `packages/themes/fonts.ts`. Variant: `hero/t11` (BillHero — nhập hóa đơn ngay hero, đẩy giá trị sang calculator qua bus),
  `calculator/t11` (PackageCalculator + `YieldChart` dùng token `chart-a/b`), `segments/t11` (SegmentComparison),
  `projects/t11` (ProjectEvidence), `trust/t11` (TrustLegal), `contact-dock/t11` (StickyContact).
  `lib/solar-calc.ts` gộp vào `packages/core` (bổ sung hàm còn thiếu, không nhân đôi).
- Agent: Codex · Cỡ: L

### E4-S06 · Pro: t10 "Xanh lá – dương"
- **Chi tiết**: theme từ `--solar-green` + mint. Variant: `hero/t10` (+ BenefitHeroes), `services/t10` (Solutions),
  `brands/t10` (ClientWall + Partners), `stats/t10` (Counters), `projects/t10` (CaseStudies), `investment-models/t10`
  (Finance), `energy-monitoring/t10`, `process/t10`, `testimonials/t10`, `trust/t10`, `faq/t10`, `lead-form/t10`
  (ContactSection), `contact-dock/t10` (FloatingContact). `SegmentContext` → dùng `useSegment()` chung.
- Agent: Codex · Cỡ: L

### E4-S07 · Pro: t08 "Glass + hero vòm"
- **Chi tiết**: theme navy + vàng + sky/beige, glass mạnh. Variant: `hero/t08` (vòm ảnh, chip nổi, thẻ "Sản lượng hôm nay",
  hotspot — đây là variant hero chủ lực cho gói Nâng cao), `segments/t08` (SavingsBySegment), `energy-monitoring/t08`
  (điện thoại cầm tay — token `skin`, `device`), `warranty/t08`, `lead-form/t08` (nửa ảnh nửa form).
  `RoiCalculator` **không port** (đã thay bằng `calculator/t12`, xem AUDIT.md).
- **Target**: 129 hex → 0.
- Agent: Codex · Cỡ: L

### E4-S08 · Pro: t07 "Mỗi section một màn hình"
- **Chi tiết**: theme xanh dương/vàng/be; thêm token `density.sectionY = "screen"` (min-height 100svh) nếu cần — sửa
  `packages/tokens` trong PR riêng. Variant: `hero/t07` (nhà minh họa, chỉ số absolute), `segments/t07` (3 khối toàn màn hình
  nhà máy/cửa hàng/gia đình, số liệu tính bằng `packages/core`), `energy-monitoring/t07`, `process/t07`.
  Minh họa `SolarIllustrations.tsx` → SVG dùng `currentColor`/token.
- **Target**: 155 hex → 0.
- Agent: Codex · Cỡ: L

### E4-S09 · Pro: nhóm C&I — t05, t06, t09
- **Chi tiết**: ba theme (t05 navy-vàng; t06 navy + burgundy, `radius.card = 0`; t09 navy đậm + burgundy, glass tối).
  Variant dùng chung cho cả ba (khác nhau chỉ ở theme): `investment-models/t05` (cấu trúc tài chính), `trust/t05`
  (phân vai trách nhiệm + tóm tắt pháp lý), `process/t05` (bước có đầu ra), `faq/t05`, `lead-form/t05`, `hero/t06`
  (kỹ thuật + biểu đồ phụ tải), `energy-monitoring/t06` (PowerChart 24h dùng `chart-*`).
  Thêm type mới nếu cần: `load-profile` (biểu đồ phụ tải) — gói Nâng cao.
- **Target**: 3 preset dùng chung ≥ 80% variant.
- Agent: Codex · Cỡ: L

### E4-S10 · Classic: minwy, t02, t03, t04
- **Chi tiết**: 4 theme nhẹ. Variant: `hero/minwy` (SliderBanner), `brands/minwy` (OurPartners), `products/minwy`
  (ProductSection danh mục), `blog/minwy` (NewsSection), `about-story/minwy` (CompanyStory + IntroductionVideo),
  `warranty/minwy`, `site-header/minwy`, `site-footer/minwy`, `hero/t02` (chia đôi), `services/t02`, `process/t02`,
  `cta-banner/t02`, `faq/t02` (`<details>` không JS), `hero/t03` + `WarmPageHero` làm `page-hero` cho trang con,
  `hero/t04` (hóa đơn giảm bao nhiêu), `packages/t04`, `stats/t04`.
- **Target**: gói Cơ bản có ≥ 4 preset Classic, mỗi preset **mặc định** chỉ bật section thuộc gói Cơ bản. Các variant Classic
  thuộc gói cao hơn (`products/minwy`, `packages/t04`, `stats/t04`, `faq/t02`) vẫn được port để khách gói Nâng cao/Cao cấp
  dùng cùng theme Classic; trong preset chúng ở trạng thái `enabled: false`.
- Agent: Codex · Cỡ: L

### E4-S11 · Lưu trữ branch template
**Là** chủ dự án, **tôi muốn** branch template cũ được đóng băng có chú thích, **để** không ai tiếp tục sửa ở đó.
- **Chi tiết**: tag `archive/template-NN` cho mỗi branch; README mỗi branch thêm dòng "Đã chuyển sang monorepo, xem
  `packages/presets/tNN.json`"; bật branch protection chỉ đọc. Site demo cũ chuyển sang tenant demo (E13-S04).
- **AC**: [ ] 15 tag tồn tại · [ ] site demo `template-NN.minwysoft.com` phục vụ từ nền tảng mới.
- Phụ thuộc: S01–S10, E13-S04 · Agent: Claude · Cỡ: S
