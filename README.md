# Template 13 — "Uy tín & trải nghiệm"

Website cho công ty **vừa lắp đặt hệ thống điện mặt trời, vừa bán thiết bị/đèn năng lượng mặt trời**, hướng tới 4 nhóm khách:
**hộ gia đình · cửa hàng & chuỗi cửa hàng · nhà xưởng/xí nghiệp · trang trại**.

Điểm nhấn: video công trình dạng Shorts phát ngay trên trang, khối uy tín dày (chứng chỉ, báo chí, đánh giá), điều hướng theo
phân khúc, công cụ dự toán chi phí và giỏ yêu cầu báo giá (không thanh toán).

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 — không thêm thư viện UI/animation (giữ stack template-8).
- Nội dung tiếng Việt. Mọi thông tin công ty, sản phẩm, video, giá, hệ số tính toán nằm trong `src/config/` và `src/data/`.
- Bảng màu **Warm Sand** (nền sáng, đất nung + xanh ngọc). Lý do chọn và hiện trạng template-8: xem `AUDIT.md`.

## Chạy dự án

```bash
yarn install
cp .env.example .env.local   # điền biến môi trường nếu cần
yarn dev                     # http://localhost:3000
yarn test                    # unit test: dự toán, giỏ báo giá, quy tắc giá, số điện thoại
yarn typecheck && yarn lint && yarn build
```

## Trang chủ (theo thứ tự)

| # | Section | File |
| --- | --- | --- |
| 3.1 | Topbar hotline theo mục đích (desktop) | `SiteShell.tsx` |
| 3.2 | Header ≤ 6 mục menu, icon "Giỏ báo giá" có badge, nút "Nhận tư vấn" | `SiteShell.tsx` |
| 3.3 | Hero: tiêu đề lợi ích, "Dự toán chi phí" / "Xem công trình thực tế", 3 con số đếm | `HeroT8.tsx`, `HeroStats.tsx` |
| 3.4 | Lưới 4 phân khúc → ghi vào state chung, các section dưới tự lọc/điền sẵn | `SegmentGrid.tsx`, `lib/segment.tsx` |
| 3.5 | Video Shorts công trình + trình phát trong trang | `VideoStories.tsx`, `StoryPlayer.tsx` |
| 3.6 | Gói giải pháp + Dự toán chi phí | `PackagesSection.tsx`, `SolarEstimator.tsx` |
| 3.7 | Công trình đã thực hiện (icon play mở đúng video) | `ProjectsGallery.tsx` |
| 3.8 | Dải "Thiết bị & sản phẩm năng lượng mặt trời" (≤ 8 sản phẩm) | `ProductStrip.tsx` |
| — | Theo dõi điện năng 24/7 (giữ từ template-8) | `EnergyMonitoringSection.tsx` |
| 3.9 | Khối uy tín: chứng chỉ, báo chí, đánh giá, thương hiệu thiết bị | `TrustSection.tsx` |
| 3.10 | Blog theo tình huống (3 bài mới nhất) + FAQ | `BlogSection.tsx`, `FaqSection.tsx` |
| 3.11 | Dải cam kết dịch vụ (trên footer, mọi trang) | `CommitmentsStrip.tsx` |
| 3.12 | Liên hệ: thanh đáy mobile / nút nổi desktop + popup "Tư vấn sản phẩm" | `ContactDock.tsx`, `ConsultPopup.tsx` |

Trang phụ: `/san-pham`, `/san-pham/[sku]`, `/cong-trinh/[slug]`, `/tin-tuc`, `/tin-tuc/[slug]`, `/ve-chung-toi`, `/lien-he`.
Đường dẫn cũ của template-8 (`/product`, `/about-us`, `/contact-us`, `/project/...`, `/service`, `/news`) chuyển hướng 308.

## Đổi thông tin công ty, hotline, mạng xã hội — `src/config/site.ts`

| Mục | Ý nghĩa |
| --- | --- |
| `brand.name`, `legalName`, `tagline`, `foundedYear` | Tên hiển thị, tên pháp lý, khẩu hiệu. "Số năm kinh nghiệm" tự tính từ `foundedYear` |
| `brand.logo` | Ảnh logo trong `/public`. Để `""` → logo vẽ sẵn theo màu template + tên công ty |
| `brand.logoText` | Chữ viết tắt trên avatar kênh (thẻ "Xem thêm" của video) |
| `hotlines` | Danh sách `{ label, phone }` — hiện ở topbar, footer, trang liên hệ. **Số đầu tiên** dùng cho nút "Gọi" trên mobile |
| `contact.zalo`, `contact.messenger`, `email`, `address`, `workingHours` | Link/thông tin liên hệ. **Link để trống thì nút tương ứng tự ẩn** |
| `socials.tiktok / youtube / facebook` | `{ url, handle }`. Kênh không có `url` → không hiện nút. `handle` hiện ở dòng "từ kênh @…" |
| `capabilities.mwp`, `capabilities.customers` | Con số ở hero và tiêu đề gallery |
| `reviews.google / trustpilot` | Link + điểm đánh giá ở khối uy tín. `url: ""` để ẩn |
| `commitments` | 4 cam kết trên footer |
| `callbackHours` | "Chúng tôi sẽ gọi lại trong X giờ" sau khi gửi form/giỏ |
| `popup` | `enabled`, `delayMs` (mặc định 30 000), `scrollRatio` (mặc định 0,6) — tối đa 1 lần/phiên |
| `themeColor` | Màu thanh trình duyệt mobile (nên trùng `--bg`) |

Menu chính `NAV_ITEMS` ở cuối file (tối đa 6 mục; "Sản phẩm" chỉ có khi bật catalog). Tên 4 phân khúc và tỷ lệ dùng điện
ban ngày mặc định ở `src/config/segments.ts`.

## Đổi màu — `src/app/globals.css`

Mọi màu là **design token** trong `:root`. Tailwind đã bỏ hẳn bảng màu mặc định (`tailwind.config.ts`), component chỉ dùng
class sinh từ token (`bg-primary`, `text-fg-muted`, `bg-accent/10`…) → đổi màu toàn site chỉ sửa một chỗ.

Mỗi màu có 2 dạng: `--primary: #C2410C` (để đọc) và `--c-primary: 194 65 12` (kênh R G B — **dạng này mới được dùng**). Sửa cả hai.

| Token | Vai trò |
| --- | --- |
| `--c-bg`, `--c-bg-elevated`, `--c-bg-tint`, `--c-bg-deep` | Nền trang, nền thẻ, nền xen kẽ, section tối |
| `--glass`, `--glass-border` | Kính mờ trên nền sáng (trắng 70%) |
| `--c-primary`, `--c-primary-strong`, `--c-primary-deep` | Thương hiệu / nút chính; `primary-strong` cho chữ màu trên nền tint |
| `--c-accent` | CTA phụ ("Nhận tư vấn", nút play, Zalo) |
| `--c-fg`, `--c-fg-muted`, `--c-fg-subtle` | Chữ chính / phụ / cấp 3 |
| `--c-sun`, `--c-highlight` | Vàng nắng (chỉ trang trí) / số liệu nổi bật trên nền tối |
| `--c-scrim`, `--c-on-media` | Lớp phủ và chữ trên ảnh/video |

- Toàn site dùng nền sáng (light mode). Khối "nhấn" (kết quả dự toán, theo dõi 24/7, hero trang phụ, footer) có class `t13-invert`: nền kem `bg-tint` cùng tông đất nung, thẻ kính trắng, số liệu màu `primary-strong` — không dùng gradient nâu đậm.
- Sau khi đổi màu, kiểm tra tương phản chữ ≥ 4.5:1 (WCAG AA), nhất là `fg-muted` trên nền kính và chữ trắng trên `primary`/`accent`.
  Bảng tỉ lệ của palette hiện tại: `AUDIT.md` mục 5.4.
- Thanh demo (`NEXT_PUBLIC_DEMO_MODE=true`) có bảng thử vài bộ màu (`THEME_PRESETS` trong `site.ts`).
- Font Inter tự host trong `public/fonts/` (2 subset latin + vietnamese, giấy phép SIL OFL) khai báo ở đầu `globals.css`.

## Thêm video — `src/data/stories.ts`

```ts
{ id, shortTitle, location, kwp, segment: "household" | "shop" | "factory" | "farm",
  type: "progress" | "done" | "customer", poster: "/images/…webp",
  source: { provider: "youtube" | "tiktok" | "file" | "bunny", idOrSrc, originalUrl? } }
```

| provider | `idOrSrc` | Phát bằng |
| --- | --- | --- |
| `youtube` | ID video (vd. `dQw4w9WgXcQ`) | `youtube-nocookie.com` (IFrame API) |
| `tiktok` | ID số của video | Player chính thức `tiktok.com/player/v1` |
| `file` | Đường dẫn `.mp4` trong `/public` | Thẻ `<video>` |
| `bunny` | URL `.mp4` trên Bunny Stream/CDN | Thẻ `<video>` |

- `originalUrl` → nút phụ "Xem trên TikTok/YouTube" (tab mới). Nút chính luôn là "Nhận báo giá công trình tương tự".
- Poster nên là ảnh 9:16 (khoảng 360×640, WebP). Ban đầu chỉ tải poster; iframe/video chỉ tạo khi mở trình phát.
- Gắn video vào công trình: đặt `storyId` trong `src/data/projects.ts` bằng `id` của video.
- `TOTAL_CHANNEL_VIDEOS` = con số "Hơn X video công trình" ở thẻ cuối.
- Tiến trình/tự chuyển với YouTube, TikTok dựa vào postMessage API của nền tảng — kiểm tra lại với video thật.

**Nguồn video demo:** 8 video và poster trong `public/videos/shorts/`, `public/images/shorts/` được tạo bằng
`scripts/make-demo-shorts.sh` (ffmpeg, hiệu ứng lia/zoom) từ ảnh minh họa của chính template trong `public/images/illustrations/`
— không dùng nội dung của bên thứ ba. Thay bằng video công trình thật trước khi xuất bản.

## Thêm sản phẩm, bật/tắt catalog — `src/data/products.ts`

```ts
{ sku, category: "panel" | "inverter" | "battery" | "light" | "accessory", brand, name,
  images: ["/images/…"], price?, salePrice?, unit?, warranty, specs: { "Thông số": "Giá trị" }, featured? }
```

- **Giá:** `salePrice` chỉ hiện khi nhỏ hơn `price` (giá gốc gạch ngang). Nhãn "Giảm Y%" chỉ hiện khi Y ≥ 5
  (`MIN_BADGE_DISCOUNT` trong `src/lib/price.ts`). Bỏ trống `price` → "Liên hệ".
- `featured: true` → xuất hiện ở dải sản phẩm trang chủ (tối đa 8, mỗi sản phẩm một lần).
- Danh mục và khoảng giá của bộ lọc `/san-pham`: `CATEGORIES`, `PRICE_RANGES` cùng file.
- Ảnh demo (SVG, không logo hãng) tạo bằng `node scripts/make-catalog-images.js`; ảnh thật có thể là jpg/webp/png.
- **Bật/tắt catalog:** `catalog.enabled` trong `site.ts` hoặc biến `NEXT_PUBLIC_CATALOG_ENABLED=false`
  → ẩn `/san-pham`, dải sản phẩm, icon giỏ và mục menu "Sản phẩm".
- Giỏ yêu cầu báo giá lưu trong `localStorage` (có fallback bộ nhớ khi trình duyệt chặn). Logic ở `src/lib/quoteCart.ts`.

## Nội dung khác — `src/data/`

| File | Nội dung |
| --- | --- |
| `packages.ts` | Gói giải pháp (≤ 4 gói/phân khúc); "Giảm ~X/tháng" tự tính theo `PACKAGE_REFERENCE_PROVINCE` |
| `projects.ts` | Công trình (gallery + `/cong-trinh/[slug]`) |
| `trust.ts` | `CERTIFICATES` (`logo` + `image` ảnh lớn), `PRESS` (mảng rỗng → ẩn khối báo chí), `TESTIMONIALS` |
| `posts.ts` | Bài blog (bài mới nhất đặt đầu mảng; không ghi năm cố định) |
| `faq.ts`, `team.ts` | Hỏi đáp (kèm FAQPage schema), đội ngũ |

Ảnh chứng chỉ/logo báo demo là **hư cấu, có chữ "MẪU"** (`scripts/make-trust-images.js`). Thay bằng bản scan/logo thật.

## Chỉnh giá điện, đơn giá, giờ nắng — `src/config/solar.ts`

| Hằng số | Nội dung |
| --- | --- |
| `TARIFFS` | Biểu giá EVN: hộ gia đình = bậc thang (`tiers`); cửa hàng / nhà xưởng / trang trại = giá bình quân `averageRate` (quy đổi hóa đơn → kWh) và `solarOffsetRate` (giá của kWh điện mặt trời thay thế) |
| `VAT_RATE` | Thuế GTGT trong hóa đơn |
| `PRICE_PER_KWP` | Đơn giá trọn gói đ/kWp theo phân khúc |
| `SYSTEM` | PR 0,8 · 5,5 m²/kWp · tấm 580 W · bước làm tròn 0,5 kWp · mái tối thiểu 16 m² |
| `PEAK_SUN_HOURS` | Giờ nắng: Bắc Bộ 3,5 · Bắc Trung Bộ 4,0 · Nam Trung Bộ 4,8 · Tây Nguyên 4,8 · Nam Bộ 4,6 |
| `PROVINCES` | 34 tỉnh/thành sau sắp xếp 2025 và vùng tương ứng |
| `BILL_INPUT`, `ROOF_INPUT` | Khoảng & giá trị mặc định của ô nhập |

Cách tính (hàm thuần `src/lib/solarCalculator.ts`, có unit test): bỏ VAT, tính ngược biểu giá → kWh/tháng → kWh ban ngày →
kWp = kWh ban ngày ÷ (30 × giờ nắng × PR) → giới hạn theo mái (diện tích ÷ 5,5, làm tròn xuống 0,5) → số tấm →
chi phí = kWp × đơn giá → tiết kiệm/tháng (chỉ phần thay thế được điện dùng ban ngày) → số năm hoàn vốn.

## Cấu hình gửi lead (webhook)

Calculator, giỏ báo giá, popup và trang liên hệ cùng gọi `POST /api/lead` → kiểm tra họ tên, **số di động Việt Nam**,
ô ẩn chống spam (honeypot) → gửi tới các adapter trong `src/lib/leads/`. Không cấu hình adapter nào = **chế độ demo**
(form báo thành công nhưng không gửi đi đâu).

| Adapter | Biến môi trường |
| --- | --- |
| Webhook chung (Zapier, Make, n8n, CRM) | `LEAD_WEBHOOK_URL`, `LEAD_WEBHOOK_TOKEN` (tùy chọn, gửi `Authorization: Bearer`) |
| Google Sheet (Apps Script) | `GOOGLE_SHEETS_WEBAPP_URL`, `GOOGLE_SHEETS_SECRET` — script mẫu + hướng dẫn: `scripts/lead-google-apps-script.gs` |
| Telegram bot | `TELEGRAM_BOT_TOKEN` (tạo qua @BotFather), `TELEGRAM_CHAT_ID` |

- Mặc định gửi tới **mọi** adapter đủ biến; chọn cụ thể: `LEAD_ADAPTERS=webhook,telegram`.
- Payload: `name, phone, zalo, address, message, segment, estimate, items, page, submittedAt` và
  **`source`** = `"calculator" | "quote-cart" | "popup" | "story-cta" | "contact"`
  (`story-cta` = khách bấm "Nhận báo giá công trình tương tự" trong video rồi gửi form dự toán).
- `estimate`: toàn bộ thông số dự toán; giỏ báo giá gửi kèm khi khách tick "Đính kèm kết quả dự toán". `items`: sản phẩm × số lượng.

## Chất lượng

- Lighthouse mobile (Lighthouse 12, cấu hình mobile mặc định, bản build production): trang chủ Performance 92–94,
  Accessibility / Best practices / SEO 100; các trang phụ Performance 92–98. Chi tiết: `AUDIT.md` mục 6.
- Responsive từ 360 px (không tràn ngang ở 360 / 768 / 1280 px).
- `prefers-reduced-motion`: tắt hiệu ứng reveal/hover, tắt tự chuyển video.

## Cần xác minh trước khi xuất bản

- `TARIFFS`, `VAT_RATE` — đánh dấu `TODO: XÁC MINH VỚI BIỂU GIÁ EVN HIỆN HÀNH`.
- `PRICE_PER_KWP`, giá trong `packages.ts` và `products.ts` — giá mẫu.
- `PEAK_SUN_HOURS` — giá trị ước tính theo vùng.
- Chứng chỉ, báo chí, đánh giá, công trình, video, đội ngũ — dữ liệu mẫu (`[DỮ LIỆU MẪU]`, "(mẫu)", "MẪU").
- Tên pháp lý, MST, giấy phép, nội dung FAQ về thủ tục đấu nối (`[CẦN XÁC MINH]`).
