# Phân tích repo và 15 template

Dữ liệu lấy bằng `git ls-tree` / `git grep` trên `origin/<branch>` ngày 08/10/2026.

## 1. Hiện trạng chung

- Mọi template: Next.js 15.4.10, React 19, TypeScript, Tailwind 3.4, `@heroicons/react`. Không thư viện UI/animation;
  hiệu ứng bằng CSS + `IntersectionObserver`.
- Mỗi template là **một app Next.js hoàn chỉnh** trên một branch; dữ liệu công ty/sản phẩm nằm trong file TS
  (`src/config`, `src/data`, `src/content`). Không có DB.
- Branch `develop` là nhánh khác hẳn: CMS có **Prisma 7 + Postgres**, đăng nhập JWT (`jose`, `bcryptjs`), Redux Toolkit,
  trang `/admin` (sản phẩm, dự án, tin tức, dịch vụ, văn phòng, form liên hệ, người dùng, cài đặt), upload media vào
  `public/`, backup/restore, cron dọn media mồ côi, đếm lượt truy cập. Model: `ProductCategory, Product, News, Banner,
  Partner, HeroContent, Project, Service, StorageMedia, Office, ContactForm, CompanyInfo, User, Visit, BackupHistory`.
  → Tái sử dụng **ý tưởng và luồng** (upload, backup, dọn media, phân quyền), không tái sử dụng nguyên code: chưa có
  `tenantId`, lưu file vào `public/`, Redux phía admin không cần với Server Actions.
- `/docs` đang bị `.gitignore` (chứa tài liệu của `develop`). Kế hoạch đặt ở `roadmap/`.
- Tiến hóa: `master/minwy` → `template-2…4` (bản đầu, Inter, nhiều hex) → `template-5` (C&I, thêm LeadForm,
  RoiCalculator, catalog, `/api/lead`) → `6…9` (biến thể của 5) → `10` (viết lại gọn, `src/content/site.ts`) →
  `11` (hệ CSS var `--solar-*`, font local) → **`12` (token hóa hoàn toàn, test)** → `13`, `14` (nhánh từ 12) →
  **`15` = 13 + 14** với design system "Fresh Energy".

## 2. Từng template

| Template | Định vị | Nhận diện (màu · font · hình khối) | Hex cứng trong TSX | Đáng giữ |
|---|---|---|---|---|
| **minwy** (t01) | Nhà phân phối, site công ty cổ điển | Xanh thương hiệu, Inter, slider banner | 1 | Slider banner, partners, product categories, tin tức |
| **t02** | Minwy Solar bản 2, catalog chung + SEO | Xanh rừng `#14532d` + vàng nắng `#f4d548`, nền giấy `#f4f6ef` | 1 | Hero chia đôi, thẻ giải pháp, quy trình, FAQ `<details>`, banner liên hệ, smoke test |
| **t03** | "Trọng Tín Solar", site công ty | Inter, ấm (WarmPageHero) | 21 | SolarBenefits, SolarExpertise, WarmPageHero cho trang con |
| **t04** | Thiết kế lại trải nghiệm | Inter, `HomeExperience` một file | 120 | Hero "hóa đơn giảm bao nhiêu" + calculator, cấu hình gói, con số, FAQ, form 1 phút |
| **t05** | Bán hàng C&I (nhà máy) | Navy `#0d3b78` + vàng, `t5-` classes, radius 14px | 109 | Tài chính (mô hình đầu tư), phân vai trách nhiệm, tóm tắt pháp lý, LeadForm, RoiCalculator, `/api/lead` |
| **t06** | C&I kỹ thuật | t05 + burgundy, ô vuông không bo, biểu đồ phụ tải | 120 | Biểu đồ phụ tải 24h, sơ đồ hệ thống, hồ sơ CFO, EnergyMonitoring |
| **t07** | "Solar cho mọi công trình" | Xanh dương/vàng/be, section 100svh, minh họa SVG | 155 | 3 section phân khúc toàn màn hình, minh họa, reveal 4 hướng, chi tiết đầu tư |
| **t08** | Glass + hero vòm | Navy + vàng + sky/beige, glass, rounded-full | 129 | **HeroT8** (vòm ảnh, chip nổi, thẻ glass), SavingsBySegment, EnergyMonitoring, SectionReveal |
| **t09** | Glass, slogan lợi nhuận | Navy đậm `#071b33` + burgundy `#8c1d2c` + vàng | 119 | Biến thể glass tối của t05/t08 |
| **t10** | Viết lại gọn, xanh lá-dương | `--solar-green #087a55`, mint | 4 | BenefitHeroes, Calculator, ClientWall, Counters, CaseStudies, Finance, Trust, FloatingContact, SegmentContext |
| **t11** | Hóa đơn → gói | `--solar-*` xanh lá + vàng, **Manrope + Be Vietnam Pro** (local) | 1 | BillHero, PackageCalculator, **YieldChart**, SegmentComparison, ProjectEvidence, TrustLegal, StickyContact, `solar-calc` |
| **t12** | Lắp đặt cho 3 phân khúc | **Token hóa**; "Sky & Sun" + dark "Emerald Dusk"; glass | 0 | **SolarEstimator 5 bước**, Packages, InvestmentModels, ProjectsGallery, VideoStories, Stats, lead adapters, unit test |
| **t13** | Uy tín & trải nghiệm, lắp đặt + bán thiết bị | Token; "Warm Sand" đất nung `#C2410C` + teal | 0 | SegmentGrid, **giỏ yêu cầu báo giá**, ProductStrip/QuickView, TrustSection, Blog, FAQ, ConsultPopup, CommitmentsStrip |
| **t14** | Phân phối + tổng thầu EPC | Token; nền tối emerald, glass | 0 | **site.config.ts một file**, song ngữ VI/EN, mega menu, Certificates, Brands, FeaturedProjects, Press, TikTok, Dealer, BranchMap, MobileBottomNav |
| **t15** | Gộp 13 + 14, "Fresh Energy" | Token; nền sáng xanh lá–dương–vàng, **Be Vietnam Pro**, dark switch | 0 | Bản tham chiếu kiến trúc: 24 section bật/tắt bằng config, luồng dữ liệu giữa section, 2 bộ test |

Kết luận: t12–t15 port gần như **chỉ di chuyển file** (đã đọc token). t10, t11 cần map biến CSS riêng sang token.
t03–t09 cần thay 100–155 màu cứng mỗi branch → port chọn lọc. minwy, t02 ít màu cứng nhưng ít section giá trị.

## 3. Danh mục section type (đề xuất 28 type)

Cột "Variant" liệt kê template có bản đáng làm variant. **Đậm** = bản đề xuất làm variant mặc định của type.

| # | Type | Schema dùng chung (trường chính) | Variant | Gói tối thiểu |
|---|---|---|---|---|
| 1 | `site-header` | logo, menu (mega tùy chọn), hotline theo chi nhánh, nút CTA, ngôn ngữ, topBar | minwy, t05, t08, t13, **t15** | Cơ bản |
| 2 | `hero` | eyebrow, title, subtitle, CTA[], media, stats[], badges[], rating | minwy (slider), t02, t04, t06, t07, **t08**, t09, t10, t11, t15 | Cơ bản |
| 3 | `segments` | segments[] (key, tên, mô tả, ảnh, lợi ích, liên kết) | t07, t08, t10, t11, **t13** | Cơ bản |
| 4 | `services` | items[] (tên, mô tả, icon/ảnh, slug) | minwy, t02, t10, **t15** | Cơ bản |
| 5 | `calculator` | tariffs, VAT, pricePerKwp, peakSunHours, segment ratios, bước hiển thị, CTA | t04, t05, t10, t11, **t12** | Nâng cao |
| 6 | `lead-form` | tiêu đề, trường hiển thị, nguồn (`source`), lời cảm ơn, ảnh nền | t05, t06, t08, t10, **t15** | Nâng cao (form liên hệ đơn giản: Cơ bản) |
| 7 | `packages` | packages[] theo segment (giá, công suất, ưu đãi), tab | t04, **t12** | Nâng cao |
| 8 | `investment-models` | models[] (mua đứt, trả góp, thuê, ESCO) | t05, t10, **t12** | Nâng cao |
| 9 | `projects` | lấy từ collection Project (lọc, số lượng), kiểu hiển thị | minwy, t08, t10, t11, **t12**, t14 | Cơ bản |
| 10 | `shorts` | lấy từ collection Story (provider youtube/tiktok/file/bunny) | **t13**, t12 | Cao cấp |
| 11 | `tiktok` | handle, video[] | **t14** | Cao cấp |
| 12 | `stats` | items[] (số, đơn vị, nhãn) | t04, t10, **t12** | Nâng cao |
| 13 | `energy-monitoring` | ảnh, chỉ số[], đoạn mô tả | t06, t07, **t08** | Nâng cao |
| 14 | `process` | steps[] | t02, t05, t07, **t15** | Cơ bản |
| 15 | `testimonials` | lấy từ collection Testimonial, điểm Google/Trustpilot | t04, t10, **t15** | Nâng cao |
| 16 | `trust` | chứng chỉ[], giấy phép, pháp lý tóm tắt | t05, t10, t11, t13, **t14** | Nâng cao |
| 17 | `brands` | logos[], video ký kết | minwy, t10, **t14** | Cơ bản |
| 18 | `press` | bài báo[] | **t14** | Cao cấp |
| 19 | `products` | lấy từ collection Product (lọc, featured) + quick view + thêm vào giỏ | minwy, t05, **t13** | Cao cấp (catalog) |
| 20 | `blog` | lấy từ collection Post (số lượng, chủ đề) | minwy, **t13** | Cơ bản |
| 21 | `faq` | items[] (+ FAQPage JSON-LD) | t02, t04, t10, **t15** | Nâng cao |
| 22 | `warranty` | bảng bảo hành | minwy, **t08** | Cơ bản |
| 23 | `dealer` | chính sách, hỏi đáp, sự kiện, form đại lý | **t14** | Cao cấp |
| 24 | `branch-map` | lấy từ collection Branch (lat/lng) | **t14** | Cao cấp |
| 25 | `cta-banner` | tiêu đề, mô tả, CTA, ảnh | t02, t06, **t14** (EngineerBanner) | Cơ bản |
| 26 | `social` | kênh[] | **t14** | Nâng cao |
| 27 | `about-story` | câu chuyện, video giới thiệu, mốc, giá trị cốt lõi | **minwy**, t03 | Cơ bản |
| 28 | `site-footer` | cột link, thông tin pháp lý, chi nhánh, cam kết | minwy, t08, **t15** | Cơ bản |

**Widget toàn site** (không nằm trong danh sách section, bật/tắt ở cấu hình site): `contact-dock` (t10, t11, **t12**),
`consult-popup` (**t13**), `mobile-bottom-nav` (**t14**), `commitments-strip` (**t13**), `quote-cart` (**t13**,
cần entitlement `catalog`), `theme-switch` (**t15**), `scroll-progress` (t15).

Đã port trong E3-S07: cả 7 widget có variant `t15` tại `packages/sections/src/widgets/`,
schema + fixture riêng, registry và renderer theo slot. Giao diện dùng token; lab `/lab/sections/t15-widgets`.

**Trang con** (page type có layout cố định + vùng section tùy chọn): danh sách/chi tiết sản phẩm, dự án, dịch vụ (giải pháp),
bài viết; giới thiệu; liên hệ; cẩm nang; chính sách. Nguồn chuẩn: t15 (slug tiếng Việt + redirect 308 từ slug cũ).

## 4. Logic nghiệp vụ dùng chung → `packages/core`

| Module | Nguồn | Ghi chú |
|---|---|---|
| `solarCalculator` | t15 `lib/solarCalculator.ts` (+ test) | Thay `RoiCalculator` (t05–t09), `solar-calc` (t11), `utils/solar` (t07). Hệ số chuyển vào schema `calculator` |
| `price` | t15 `lib/price.ts` | Quy tắc giảm giá, nhãn "Giảm Y%", "Liên hệ" |
| `phone` | t15 `lib/phone.ts` | Validate số di động VN |
| `quoteCart` | t15 `lib/quoteCart.ts` (+ test) | Lưu localStorage, fallback bộ nhớ |
| `segment` | t15 `lib/segment.tsx`, `config/segments.ts` | State phân khúc chung giữa section, `?phan-khuc=` |
| `calculatorBus` | t15 `lib/calculatorBus.ts` | Mở dự toán từ bất kỳ section |
| `leads` | t15 `lib/leads/*` | Webhook, Google Sheets, Telegram → `packages/leads`, cấu hình theo tenant |
| `i18n` | t15 `i18n/*` | VI/EN cho khung trang → trường `localized` |

## 5. Thứ tự port đề xuất

1. **t15** — làm baseline (E1-S04): chạy nguyên trạng trong `apps/web`, rồi tách dần thành section.
2. **t12, t13, t14** — variant còn thiếu so với t15 (SolarEstimator gốc t12, SegmentGrid t13, dark theme t14).
3. **t11, t10** — map `--solar-*` sang token; lấy BillHero, PackageCalculator, YieldChart, Calculator, BenefitHeroes.
4. **t08, t07** — HeroT8, minh họa t07; thay hex.
5. **t05, t06, t09** — gộp thành variant "C&I" (tài chính, phân vai, pháp lý, biểu đồ phụ tải); t09 chủ yếu là theme.
6. **minwy, t02, t03, t04** — nhóm Classic: theme + 4–6 variant cơ bản (slider hero, partners, product categories, news).
