# Template 12 — Website công ty lắp đặt điện mặt trời

Website một trang chính (kèm các trang phụ) cho đơn vị lắp đặt điện mặt trời tại Việt Nam, hướng tới 3 nhóm khách:
**hộ gia đình / khu dân cư**, **cửa hàng & chuỗi cửa hàng**, **nhà xưởng / xí nghiệp / trang trại**.

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 — không thêm thư viện UI/animation.
- Toàn bộ nội dung tiếng Việt; mọi thông tin công ty, giá, hệ số tính toán nằm trong file config/data.
- Bảng màu mặc định **Sky & Sun** (nền sáng, xanh ngọc + vàng hổ phách), có sẵn bảng tối **Emerald Dusk** — xem mục Đổi màu.

## Chạy dự án

```bash
yarn install
cp .env.example .env.local   # điền biến môi trường nếu cần
yarn dev                     # http://localhost:3000
yarn test                    # unit test công cụ dự toán, số điện thoại, quy tắc giá
yarn typecheck && yarn lint && yarn build
```

## Các section trang chủ

1. Hero (CTA "Dự toán chi phí" cuộn xuống công cụ)
2. **Dự toán chi phí lắp đặt + Nhận báo giá** (5 bước, kết quả hiện ngay, form gửi kèm thông số)
3. Lợi ích theo công trình (bấm thẻ → mở tab gói tương ứng)
4. **Gói giải pháp** — tab Hộ gia đình / Cửa hàng / Nhà xưởng, tối đa 4 gói mỗi tab
5. **Hình thức đầu tư** — Mua đứt / Trả góp / Thuê hệ thống / Lắp đặt 0 đồng (ESCO)
6. **Công trình đã thực hiện** — gallery lọc theo phân khúc
7. **Video công trình thực tế** — carousel Shorts + trình phát ngay trong trang
8. **Số liệu nổi bật** — đếm số khi cuộn tới
9. Theo dõi điện năng 24/7 · Quy trình · Bảo hành · Khách hàng nói gì (+ dải thương hiệu thiết bị) · FAQ · Form liên hệ cuối trang
10. **Thanh liên hệ cố định** — mobile: thanh đáy Gọi ngay / Chat Zalo / Messenger; desktop: nút nổi góc phải

## Đổi thông tin công ty — `src/config/site.ts`

| Mục | Ý nghĩa |
| --- | --- |
| `brand.name`, `legalName`, `tagline` | Tên hiển thị khắp website, tiêu đề trang, schema SEO |
| `brand.logo` | Đường dẫn ảnh logo trong `/public`. Để `""` → logo tự vẽ theo màu template + tên công ty |
| `brand.foundedYear` | Năm thành lập — "số năm kinh nghiệm" và mốc thời gian tự tính theo năm hiện tại |
| `contact.phone` / `phoneRaw` | Số hiển thị / số dùng cho `tel:` |
| `contact.zalo`, `contact.messenger` | Link chat. **Để trống thì nút tương ứng tự ẩn** |
| `socials.tiktok / youtube / facebook` | Nút mạng xã hội ở section video. Không có `url` → không hiển thị |
| `capabilities` | MWp đã lắp, số khách hàng, kỹ thuật viên, số công trình |
| `siteMode` | `"installer"` hoặc `"installer_distributor"` (xem dưới) |
| `themeColor` | Màu thanh trình duyệt trên điện thoại (nên trùng `--bg`) |

**Chế độ website (`siteMode`, hoặc biến `NEXT_PUBLIC_SITE_MODE`)**

- `installer`: chỉ lắp đặt — không có trang `/san-pham`, menu không có "Sản phẩm", không có giỏ yêu cầu báo giá thiết bị.
- `installer_distributor`: bật trang `/san-pham` (lọc tấm pin / inverter / pin lưu trữ / phụ kiện). Trang chủ **không** hiện lưới sản phẩm, chỉ thêm dải logo thương hiệu thiết bị và link "Xem thiết bị".

Menu chính (`NAV_ITEMS`) tối đa 6 mục.

## Đổi màu — `src/app/globals.css`

Mọi màu là **design token** khai báo trong `:root`. Component không dùng mã màu cứng; Tailwind chỉ sinh class từ token
(`bg-primary`, `text-fg-muted`, `bg-accent/20`…), nên đổi màu toàn site chỉ cần sửa một chỗ.

Mỗi màu có 2 dạng: `--primary: #10B981` (để đọc) và `--c-primary: 16 185 129` (kênh R G B — **dạng này mới được dùng**).
Khi đổi màu, sửa **cả hai**.

| Token | Vai trò |
| --- | --- |
| `--c-bg`, `--c-bg-elevated`, `--c-bg-deep`, `--c-bg-tint` | Nền trang, nền thẻ, section tối nhất, nền xen kẽ |
| `--glass`, `--glass-border` | Nền / viền kính mờ |
| `--c-primary`, `--c-primary-strong`, `--c-primary-deep` | Màu thương hiệu; `primary-deep` là điểm cuối gradient section lớn |
| `--c-accent` | **CTA chính** (vàng nắng) |
| `--c-on-primary`, `--c-on-accent` | Màu chữ đặt trên nền primary / accent (giữ tương phản ≥ 4.5:1) |
| `--c-fg`, `--c-fg-muted`, `--c-fg-subtle` | Chữ chính / phụ / phụ cấp 3 |
| `--c-scrim`, `--c-on-media` | Lớp phủ tối và chữ trên ảnh (cố định cho mọi theme) |

- **Mặc định là theme sáng "Sky & Sun"** (`data-theme="light"` trên thẻ `<html>` trong `src/app/layout.tsx`). Xóa thuộc tính đó để dùng bảng tối "Emerald Dusk".
- Ở theme sáng, section có class `t12-invert` (quy trình, dự án, footer…) dùng nền pastel cùng sắc độ và thẻ kính trắng; chữ/số `text-accent` tự đổi sang màu đậm để đủ tương phản (trừ chữ trên ảnh).
- Section luôn tối (footer, quy trình…) có class `t12-invert` để giữ chữ sáng khi dùng theme sáng.
- Sau khi đổi màu, kiểm tra lại độ tương phản chữ (WCAG AA ≥ 4.5:1), đặc biệt `fg-muted` trên nền glass.
- Thanh demo (bật bằng `NEXT_PUBLIC_DEMO_MODE`) cho phép thử nhanh vài bộ màu và nền sáng/tối.

## Chỉnh giá điện, đơn giá, giờ nắng — `src/config/solar.ts`

Công cụ dự toán đọc **toàn bộ** số liệu từ file này:

| Hằng số | Nội dung |
| --- | --- |
| `TARIFFS` | Biểu giá EVN: hộ gia đình = bậc thang (`tiers`), cửa hàng / nhà xưởng = giá bình quân `averageRate` (quy đổi hóa đơn → kWh) và `solarOffsetRate` (giá của kWh điện mặt trời thay thế) |
| `VAT_RATE` | Thuế GTGT trong hóa đơn |
| `PRICE_PER_KWP` | Đơn giá trọn gói đ/kWp theo phân khúc |
| `SYSTEM` | PR (0,8), m² mỗi kWp (5,5), công suất tấm pin (580 W), bước làm tròn (0,5 kWp), mái tối thiểu (16 m²) |
| `PEAK_SUN_HOURS` | Giờ nắng đỉnh theo 5 vùng |
| `PROVINCES` | 34 tỉnh/thành (sau sắp xếp 2025) và vùng tương ứng |
| `BILL_INPUT`, `ROOF_INPUT` | Khoảng & giá trị mặc định của thanh trượt |

Cách tính (hàm thuần `src/lib/solarCalculator.ts`, có unit test):

1. Bỏ VAT, tính ngược biểu giá → kWh/tháng.
2. kWh ban ngày = kWh/tháng × tỷ lệ ban ngày.
3. kWp cần = kWh ban ngày ÷ (30 × giờ nắng đỉnh × PR), làm tròn 0,5.
4. kWp tối đa theo mái = diện tích ÷ m²/kWp (làm tròn **xuống** 0,5). Lấy giá trị nhỏ hơn.
5. Số tấm = ⌈kWp × 1000 ÷ công suất tấm⌉. Chi phí = kWp × đơn giá.
6. Tiết kiệm chỉ tính phần sản lượng thay thế được điện dùng ban ngày (hộ gia đình: phần cắt khỏi bậc cao nhất). Hoàn vốn = chi phí ÷ tiết kiệm năm.

## Dữ liệu nội dung — `src/data/`

| File | Nội dung |
| --- | --- |
| `packages.ts` | Gói giải pháp. `price`/`salePrice` (VNĐ) — **salePrice chỉ hiển thị khi nhỏ hơn price**. Mỗi phân khúc hiện tối đa 4 gói; "Giảm ~X/tháng" tự tính từ config theo `PACKAGE_REFERENCE_PROVINCE` |
| `projects.ts` | Công trình đã thực hiện (gallery + trang `/cong-trinh/[slug]`) |
| `stories.ts` | Video Shorts (xem dưới) |
| `solar.ts` | Sản phẩm (có `salePrice`), giải pháp, FAQ, đội ngũ, đánh giá khách hàng |

### Video Shorts — `src/data/stories.ts`

```ts
{ id, shortTitle, location, kwp, segment: "household" | "shop" | "factory",
  type: "progress" | "done" | "customer", poster,
  source: { provider: "youtube" | "tiktok" | "file" | "bunny", id_or_src, originalUrl } }
```

- `youtube`: `id_or_src` = ID video (phát qua `youtube-nocookie.com`).
- `tiktok`: `id_or_src` = ID số của video (player chính thức `tiktok.com/player/v1`).
- `file` / `bunny`: `id_or_src` = đường dẫn/URL file `.mp4`.
- `originalUrl` dùng cho nút phụ "Xem trên TikTok/YouTube" (mở tab mới). Nút chính luôn là "Nhận báo giá công trình tương tự".
- Ban đầu chỉ tải poster; iframe/video chỉ được tạo khi mở trình phát và hủy khi chuyển/đóng.
- Tiến trình & tự chuyển video với YouTube/TikTok dựa trên postMessage API của từng nền tảng — cần kiểm tra lại với video thật.

**Nguồn video demo:** 8 video và poster trong `public/videos/stories/` và `public/images/stories/` được tự dựng
(hiệu ứng lia máy, ffmpeg) từ các ảnh minh họa của chính template trong `public/images/illustrations/`
— không dùng video của bên thứ ba. Thay bằng video công trình thật trước khi xuất bản.

## Cấu hình gửi lead

Form gọi `POST /api/lead` → kiểm tra họ tên, **số di động Việt Nam**, ô ẩn chống spam (honeypot) → gửi tới các adapter
trong `src/lib/leads/`. Không cấu hình adapter nào thì chạy **chế độ demo** (form báo thành công nhưng không gửi đi đâu).

| Adapter | Biến môi trường |
| --- | --- |
| Webhook chung (Zapier, Make, n8n, CRM) | `LEAD_WEBHOOK_URL`, `LEAD_WEBHOOK_TOKEN` (tùy chọn, gửi dạng `Authorization: Bearer`) |
| Google Sheet (Apps Script) | `GOOGLE_SHEETS_WEBAPP_URL`, `GOOGLE_SHEETS_SECRET` — script mẫu: `scripts/lead-google-apps-script.gs` (hướng dẫn trong file) |
| Telegram bot | `TELEGRAM_BOT_TOKEN` (tạo qua @BotFather), `TELEGRAM_CHAT_ID` |

- Mặc định gửi tới **mọi** adapter đã đủ biến. Muốn chọn cụ thể: `LEAD_ADAPTERS=webhook,telegram`.
- Lead từ công cụ dự toán kèm toàn bộ thông số trong trường `estimate` (đối tượng, hóa đơn, mái, tỉnh, kWp, số tấm, chi phí, tiết kiệm, hoàn vốn…).
- Thêm adapter mới: tạo file theo kiểu `LeadAdapter` trong `src/lib/leads/` và thêm vào mảng `ALL` ở `index.ts`.

## Cấu trúc thư mục

```text
src/
  app/                 # trang: / , /san-pham, /giai-phap, /cong-trinh/[slug], /ve-chung-toi, /lien-he, /api/lead
  components/          # section & UI (HeroT8, SolarEstimator, PackagesSection, VideoStories, StoryPlayer…)
  config/site.ts       # thông tin công ty, menu, siteMode
  config/solar.ts      # biểu giá, đơn giá, giờ nắng, tỉnh/thành
  data/                # gói, công trình, video, sản phẩm, FAQ
  lib/                 # solarCalculator, phone, price, leads/*, calculatorBus
```

Đường dẫn cũ (`/product`, `/service`, `/about-us`, `/contact-us`, `/project/...`) được chuyển hướng 308 sang slug tiếng Việt.

## Cần xác minh trước khi xuất bản

- `TARIFFS` (biểu giá EVN sinh hoạt bậc thang, kinh doanh, sản xuất) và `VAT_RATE` — đánh dấu `TODO: XÁC MINH VỚI BIỂU GIÁ EVN HIỆN HÀNH`.
- `PRICE_PER_KWP` và giá trong `data/packages.ts` — giá mẫu.
- `PEAK_SUN_HOURS` — giá trị ước tính theo vùng.
- Mọi mục `[DỮ LIỆU MẪU]` / `[CẦN XÁC MINH]`: tên pháp lý, MST, giấy phép, đánh giá khách hàng, công trình, điều kiện trả góp/ESCO.
