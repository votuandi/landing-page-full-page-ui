# Template 15 — Năng lượng xanh: phân phối thiết bị + lắp đặt trọn gói

Gộp **toàn bộ trang, section trang chủ và tính năng** của template-13 (catalog có giỏ báo giá, 4 phân khúc dùng chung,
video Shorts, blog, đánh giá, popup tư vấn) và template-14 (một file cấu hình, song ngữ VI/EN, mega menu, chứng chỉ,
thương hiệu, dự án, đại lý, bản đồ chi nhánh, cẩm nang, chính sách) — với design system mới **"Fresh Energy"**:
nền sáng, xanh lá – xanh dương – vàng nắng, font Be Vietnam Pro, giữ hiệu ứng reveal khi cuộn.

> ⚠️ Tên công ty (*Lumivolt Energy*), thương hiệu, báo chí, số điện thoại, địa chỉ, giấy phép, số liệu là **dữ liệu mẫu hư cấu**.

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 — không thêm thư viện UI/animation.
- Song ngữ VI/EN cho khung trang và các section; dữ liệu nội dung (bài viết, mô tả dự án…) là tiếng Việt.

## Chạy dự án

```bash
yarn install
cp .env.example .env.local   # điền biến môi trường nếu cần
yarn dev                     # http://localhost:3000
yarn test                    # unit test: dự toán, giỏ báo giá, quy tắc giá, số điện thoại
yarn typecheck && yarn lint && yarn build
```

## Trang chủ (theo thứ tự — bật/tắt từng section trong `src/config/site.config.ts`)

| # | Section | Nguồn | File |
| --- | --- | --- | --- |
| — | Thanh demo · Top bar cam kết (marquee) · Header + mega menu Bảng giá / Thiết bị / Cẩm nang, Hotline theo chi nhánh, VI/EN, giỏ báo giá, nút "Báo giá" | 13 + 14 | `SiteShell.tsx`, `layout/*` |
| 1 | Hero: chữ gradient, CTA dự toán / video, điểm Google, 3 số đếm, ảnh vòm + mặt trời + thẻ dữ liệu | 13 + 14 | `Hero.tsx`, `HeroStats.tsx` |
| 2 | Lưới 4 phân khúc (gia đình, cửa hàng, nhà xưởng, trang trại) → lọc video, gói, công trình, điền dự toán | 13 | `SegmentGrid.tsx`, `lib/segment.tsx` |
| 3 | Video Shorts công trình + trình phát trong trang | 13 | `VideoStories.tsx`, `StoryPlayer.tsx` |
| 4 | Gói giải pháp (theo phân khúc chung, nhãn "Giảm Y%") | 13 + 14 | `PackagesSection.tsx` |
| 5 | Dự toán chi phí + form "Nhận báo giá chi tiết" | 13 + 14 | `SolarEstimator.tsx` |
| 6 | Chứng chỉ & giấy phép (carousel + lightbox, ảnh scan mẫu) | 14 (+ ảnh 13) | `sections/CertificatesSection.tsx` |
| 7 | Thương hiệu phân phối + video lễ ký kết | 14 | `sections/BrandsSection.tsx` |
| 8 | Dự án tiêu biểu (tab khách hàng, chỉ số đếm, video) | 14 | `sections/FeaturedProjects.tsx` |
| 9 | Gallery công trình (lọc phân khúc, nút play mở đúng video) | 13 | `ProjectsGallery.tsx` |
| 10 | Giải pháp theo phân khúc + slider video | 14 | `sections/SolutionsSection.tsx` |
| 11 | Dải sản phẩm nổi bật (xem nhanh, thêm vào giỏ) | 13 | `ProductStrip.tsx` |
| 12 | Số liệu nổi bật | 14 | `StatsSection.tsx` |
| 13 | Báo chí & truyền hình | 14 | `sections/PressSection.tsx` |
| 14 | Theo dõi điện năng 24/7 | 13 + 14 | `EnergyMonitoringSection.tsx` |
| 15 | Đánh giá khách hàng + điểm Google/Trustpilot | 13 | `TestimonialsSection.tsx` |
| 16 | TikTok (video dọc) | 14 | `sections/TikTokSection.tsx` |
| 17 | Trở thành đại lý (chính sách, hỏi đáp, sự kiện, form riêng) | 14 | `sections/DealerSection.tsx` |
| 18 | Bản đồ chi nhánh (có Q.Đ. Hoàng Sa, Trường Sa) | 14 | `sections/BranchMap.tsx` |
| 19 | Banner đội ngũ kỹ sư | 14 | `sections/EngineerBanner.tsx` |
| 20 | Quy trình 5 bước | 14 | `ProcessSection.tsx` |
| 21 | Blog theo tình huống (3–6 bài) | 13 | `BlogSection.tsx` |
| 22 | Mạng xã hội | 14 | `sections/SocialSection.tsx` |
| 23 | FAQ (+ FAQPage schema) | 13 + 14 | `FaqSection.tsx`, `data/faq.ts` |
| 24 | Form "Nhận báo giá" cuối trang | 14 | `ContactSection.tsx` |
| — | Dải cam kết dịch vụ (mọi trang) · Footer · Liên hệ nhanh · Thanh đáy mobile · Popup tư vấn | 13 + 14 | `CommitmentsStrip.tsx`, `SiteFooter.tsx`, `ContactDock.tsx`, `ConsultPopup.tsx` |

Section kế thừa tắt sẵn: `legacy.investmentModels`, `legacy.warranty` (bảng bảo hành nằm ở `/ve-chung-toi`).

**Trang phụ:** `/san-pham`, `/san-pham/[slug]`, `/cong-trinh/[slug]`, `/giai-phap`, `/giai-phap/[slug]`, `/tin-tuc`,
`/tin-tuc/[slug]`, `/cam-nang`, `/chinh-sach/[slug]`, `/ve-chung-toi`, `/lien-he`. Đường dẫn cũ của template-8
(`/product`, `/service`, `/news`, `/about-us`, `/contact-us`, `/project/...`) chuyển hướng 308.

## Luồng dữ liệu giữa các section

- **Phân khúc dùng chung** (`lib/segment.tsx`): lưới phân khúc, bộ lọc video/công trình, tab gói giải pháp và dự toán
  đọc/ghi cùng một state; hỗ trợ `?phan-khuc=trang-trai` trên URL.
- **Mở dự toán** (`lib/calculatorBus.ts` → `openCalculator({ segment, bill, topic, source })`): chip mega menu "Bảng giá lắp đặt",
  nút gói, dự án, video ("Nhận báo giá công trình tương tự" → lead `source: "story-cta"`). Từ trang khác:
  `/?phan-khuc=household&hoa-don=4000000&nhu-cau=…#du-toan`.
- **Giỏ yêu cầu báo giá** (`lib/quoteCart.ts`, `lib/quoteCartContext.tsx`): số lượng, lưu localStorage (fallback bộ nhớ),
  drawer gửi lead `source: "quote-cart"` kèm `items`; tick "Đính kèm kết quả dự toán" để gửi luôn kết quả dự toán gần nhất.

## Cấu hình — `src/config/site.config.ts` (một file duy nhất)

| Khóa | Nội dung |
| --- | --- |
| `brand`, `legal`, `branches[]`, `zalo`, `socials`, `stats` | Thông tin công ty, pháp lý, chi nhánh (lat/lng), hotline, mạng xã hội, số liệu |
| `siteMode`, `catalog.enabled` | `installer` ẩn catalog/menu Thiết bị/giỏ; `catalog.enabled=false` (hoặc `NEXT_PUBLIC_CATALOG_ENABLED=false`) chỉ tắt catalog |
| `reviews`, `commitments`, `popup`, `callbackHours` | Điểm Google, 4 cam kết trên footer, popup tư vấn (`delayMs`, `scrollRatio`, 1 lần/phiên), số giờ gọi lại |
| `topBar`, `pricing`, `equipment`, `guide` | Marquee, mega menu (chip `bill` điền sẵn tiền điện; `query` lọc `/san-pham`), cẩm nang (`href` tùy chọn) |
| `certificates`, `brands`, `projects`, `solutions`, `press`, `tiktok`, `dealer` | Dữ liệu từng section |
| `<section>.enabled`, `legacy` | Bật/tắt section |

`src/config/site.ts` chỉ là lớp dẫn xuất (helper `telHref`, `zaloHref`, `mapsUrl`, `catalogEnabled`, bộ màu demo) — không sửa dữ liệu ở đó.
Phân khúc & tỷ lệ dùng điện ban ngày: `src/config/segments.ts`. Biểu giá, đơn giá, giờ nắng: `src/config/solar.ts`.

## Dữ liệu — `src/data/`

| File | Nội dung |
| --- | --- |
| `products.ts` | Catalog gộp: tấm pin, inverter, pin lưu trữ, All-in-one, BESS, **đèn năng lượng mặt trời**, phụ kiện. `price`/`salePrice` (giảm chỉ khi `salePrice < price`, nhãn "Giảm Y%" khi Y ≥ 5, không giá → "Liên hệ"), `powerKw`, `tech`, `segment` (lọc mega menu), `featured`, `compatible` |
| `packages.ts` | Gói giải pháp (≤ 4 gói/phân khúc) |
| `projects.ts`, `stories.ts` | Công trình (`storyId` gắn video), video Shorts (`provider`: youtube · tiktok · file · bunny) |
| `posts.ts`, `faq.ts`, `testimonials.ts` | Blog, hỏi đáp, đánh giá |
| `solar.ts` | Dịch vụ `/giai-phap`, đội ngũ |

Ảnh minh họa demo (không logo thật, có chữ "MẪU"): `node scripts/make-catalog-images.js` (sản phẩm),
`node scripts/make-trust-images.js` (chứng chỉ); video Shorts demo: `scripts/make-demo-shorts.sh`.

## Đổi màu — `src/app/globals.css`

Mọi màu là token trong `:root` (dạng `--c-<tên>: R G B`); Tailwind chỉ sinh class từ token nên không có mã màu cứng.

| Token | Vai trò |
| --- | --- |
| `--c-bg`, `bg-elevated`, `bg-tint`, `bg-sky`, `bg-sun` | Nền trang, thẻ, nền xen kẽ bạc hà / trời / nắng |
| `--c-primary` (xanh lá), `--c-secondary` (xanh dương) | Chữ, icon, nút (gradient lá → dương); đều đạt AA trên nền trắng |
| `--c-leaf`, `--c-sky` | Xanh tươi — chỉ trang trí |
| `--c-accent` (vàng nắng), `--c-accent-ink` | Nền CTA/badge; `accent-ink` là chữ màu vàng đạt AA |
| `--c-fg`, `fg-muted`, `fg-subtle` | Chữ chính / phụ / cấp 3 |

- Section tối "Ocean Forest" (xanh rừng → xanh biển): class `t15-invert t15-ocean`. Thẻ sáng nằm trong section tối: thêm `t15-light`.
- Thanh demo (`NEXT_PUBLIC_DEMO_MODE`) có bảng thử bộ màu (`THEME_PRESETS` trong `site.ts`).
- Hiệu ứng: reveal khi cuộn (`data-reveal="up|down|left|right|zoom"`, `data-reveal-stagger`), hero chạy bằng CSS (`data-hero`),
  thanh tiến trình cuộn trang, mặt trời xoay, dòng năng lượng — tất cả tắt với `prefers-reduced-motion`.

## Gửi lead

Mọi form gọi `POST /api/lead` (kiểm tra họ tên, số di động VN, honeypot) → adapter trong `src/lib/leads/`.
Không cấu hình adapter = **chế độ demo**. `source`: `calculator`, `story-cta`, `quote-cart`, `popup`, `contact`, `home-bottom`,
`dealer`, `service-<slug>`; payload có thể kèm `estimate`, `items`, `province`, `businessType`, `page`.

| Adapter | Biến môi trường |
| --- | --- |
| Webhook (Zapier, Make, n8n, CRM) | `LEAD_WEBHOOK_URL`, `LEAD_WEBHOOK_TOKEN` |
| Google Sheet (Apps Script) | `GOOGLE_SHEETS_WEBAPP_URL`, `GOOGLE_SHEETS_SECRET` — `scripts/lead-google-apps-script.gs` |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |

Chọn adapter cụ thể: `LEAD_ADAPTERS=webhook,telegram`.

## Cần xác minh trước khi xuất bản

- `TARIFFS`, `VAT_RATE`, `PRICE_PER_KWP`, `PEAK_SUN_HOURS` (`config/solar.ts`); giá trong `packages.ts`, `products.ts`.
- Mọi mục `[DỮ LIỆU MẪU]`, `[HƯ CẤU]`, `[CẦN XÁC MINH]`, "(mẫu)", "MẪU": pháp lý, giấy phép, chứng chỉ, báo chí, đánh giá, công trình, video.
