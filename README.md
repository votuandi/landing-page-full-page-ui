# Template 14 — Nhà phân phối thiết bị + tổng thầu EPC điện mặt trời

Nhánh từ template-12: **giữ nguyên** design system (bo tròn, glassmorphism, animation reveal), công cụ dự toán chi phí
và form "Nhận báo giá". Nội dung demo là một công ty **hư cấu** — *Lumivolt Energy* — vừa phân phối thiết bị
(tấm pin, inverter, lithium, all-in-one, BESS, phụ kiện) vừa làm tổng thầu EPC.

> ⚠️ Toàn bộ tên công ty, thương hiệu, tên báo, số điện thoại, địa chỉ, số giấy phép và số liệu là **dữ liệu mẫu hư cấu**.
> Logo thương hiệu/báo là chữ tự sinh (wordmark), badge Bộ Công Thương là placeholder — không dùng logo thật.

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 — không thêm thư viện UI/animation.
- Song ngữ VI/EN cho phần khung (top bar, header, mega menu, thanh đáy, footer, tiêu đề các section mới).
  Công cụ dự toán, trang phụ và dữ liệu nội dung (mô tả dự án, bài báo…) vẫn là tiếng Việt.

## Chạy dự án

```bash
yarn install
cp .env.example .env.local   # điền biến môi trường nếu cần
yarn dev                     # http://localhost:3000
yarn test                    # unit test công cụ dự toán, số điện thoại, quy tắc giá
yarn typecheck && yarn lint && yarn build
```

## Một file cấu hình — `src/config/site.config.ts`

Mọi thông tin công ty nằm trong `siteConfig`. `src/config/site.ts` chỉ là lớp dẫn xuất (helper `telHref`, `zaloHref`,
`mapsUrl`, `SITE_CONFIG` tương thích template-12 cho các trang phụ) — **không sửa dữ liệu ở đó**.

| Khóa | Nội dung |
| --- | --- |
| `brand` | Tên, pháp danh, tagline, logo (`""` = logo tự vẽ), năm thành lập, URL, ảnh OG, email |
| `i18n` | `enabled` bật/tắt switch VI/EN; `defaultLang` |
| `zalo` | Zalo **Gia đình** và Zalo **Nhà xưởng** (thanh đáy mobile, CTA) |
| `branches[]` | Mỗi chi nhánh: văn phòng + kho (địa chỉ, **lat/lng**), hotline `main` / `household` / `project`, cửa hàng (footer), giờ mở cửa |
| `complaintHotline`, `workingHours` | Hotline khiếu nại (footer), giờ làm việc |
| `legal` | Số ĐKKD, giấy phép, ISO, badge Bộ Công Thương (placeholder, điền `url` khi có), danh sách chính sách → `/chinh-sach/[slug]` |
| `socials[]` | Facebook / YouTube / TikTok / Zalo OA + số follower (section mạng xã hội, `sameAs` trong schema) |
| `stats` | MWp, công trình, đại lý, tỉnh, kỹ sư, khách hàng |
| `topBar.items` | Các cam kết chạy marquee |
| `pricing.categories` | Mega menu **Bảng giá lắp đặt**: loại công trình → nhóm → chip (`bill` = tiền điện điền sẵn, `popular` = badge "Phổ biến") |
| `equipment.groups` | Mega menu **Thiết bị**: nhóm + chip lọc (`query` → tham số `/san-pham?category=&brand=&tech=&segment=&minPower=&maxPower=`) |
| `guide` | Mega menu **Cẩm nang** + nội dung trang `/cam-nang` (thuật ngữ, văn bản pháp luật) |
| `certificates`, `brands`, `projects`, `solutions`, `press`, `tiktok`, `dealer`… | Dữ liệu từng section (xem dưới) |
| `legacy` | Bật lại các section cũ của template-12 (gallery công trình, video shorts, quy trình…) |

**Mỗi section có `enabled: true/false`.** Tắt section → không render; FAQ/schema tự bỏ phần tương ứng.

Video: `{ provider: "youtube", id: "<ID>" }` (phát qua youtube-nocookie, iframe chỉ tạo khi mở modal) hoặc
`{ provider: "file", src: "/videos/x.mp4" }`. Bản demo dùng file mp4 cục bộ để không phụ thuộc video YouTube thật.
Ảnh để `""` → khung placeholder theo màu template.

## Các section trang chủ (theo thứ tự)

0. **Top bar marquee** (CSS animation, dừng khi hover/focus, đứng yên với `prefers-reduced-motion`) · **Header**: mega menu
   Bảng giá lắp đặt / Thiết bị / Cẩm nang, dropdown **Hotline** theo chi nhánh (số chính + Hộ gia đình + Dự án + Google Maps
   văn phòng/kho), switch VI/EN, nút **Báo giá** · **Thanh đáy mobile**: Trang chủ · Danh mục · Gọi · Zalo Gia đình · Zalo Nhà xưởng
1. Hero
2. **Dự toán chi phí + Nhận báo giá** — bấm chip ở mega menu bảng giá → cuộn tới đây, điền sẵn phân khúc + tiền điện,
   hiện "Đang hỏi giá: …" và gửi kèm lead (`Nhu cầu`). Từ trang khác: `/?phan-khuc=household&hoa-don=4000000&nhu-cau=…#du-toan`
3. Chứng chỉ & giấy phép — carousel, bấm mở lightbox (ảnh, cơ quan cấp, số hiệu, hiệu lực, phạm vi)
4. Thương hiệu phân phối — thẻ video "Lễ ký kết" + lưới logo (link sang catalog đã lọc)
5. Gói giải pháp (template-12)
6. Dự án tiêu biểu — tab theo logo khách hàng, 4 chỉ số đếm số, modal video
7. Giải pháp theo phân khúc + slider video công trình (đếm "01 / N")
8. Số liệu nổi bật
9. Báo chí & truyền hình — lưới logo báo + carousel bài viết (link ngoài)
10. TikTok — carousel video dọc 9:16, hiển thị @creator (trình phát StoryPlayer của template-12)
11. Trở thành đại lý — 3 số liệu, tab Chính sách / Hỏi đáp, gallery sự kiện, **form đăng ký riêng** (tên, SĐT, tỉnh, loại hình) → lead `source: "dealer"`
12. Bản đồ chi nhánh — SVG Việt Nam (có Q.Đ. Hoàng Sa, Q.Đ. Trường Sa), ghim tự đặt theo lat/lng trong config
13. Banner đội ngũ kỹ sư + CTA Zalo/hotline + nhắc gửi khu vực, công suất, hóa đơn điện
14. Quy trình (template-12) · Mạng xã hội · FAQ · Form Nhận báo giá cuối trang
15. Footer: pháp lý (ĐKKD, giấy phép, ISO), hotline khiếu nại, cửa hàng theo chi nhánh (mỗi số có nút Zalo), chính sách, badge Bộ Công Thương

Trang mới: `/cam-nang` (Thuật ngữ, Biểu giá điện — đọc từ `config/solar.ts`, Văn bản pháp luật, Hỏi đáp, Tin tức) và `/chinh-sach/[slug]`.

## SEO

- `@graph` JSON-LD trong `layout.tsx`: **Organization** (contactPoint theo chi nhánh, sameAs, ISO) + **LocalBusiness** cho từng
  chi nhánh (địa chỉ, geo, giờ mở cửa, hasMap, parentOrganization).
- **FAQPage** ở trang chủ = FAQ chung + hỏi đáp đại lý (chỉ phần đang hiển thị).
- Open Graph đầy đủ (title, description, url, siteName, locale `vi_VN` + `en_US`, ảnh 1200×630 có alt) và Twitter card.

## Hiệu năng

- Video (YouTube iframe / mp4) chỉ được tạo khi mở modal; modal tải bằng `next/dynamic`. Ảnh dùng `next/image` lazy.
- Marquee và hiệu ứng là CSS; mọi animation/scroll mượt tôn trọng `prefers-reduced-motion`.

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

- Dùng bảng sáng **Sky & Sun**: thêm `data-theme="light"` vào thẻ `<html>` trong `src/app/layout.tsx`.
- Section luôn tối (footer, quy trình, dự án, đại lý…) có class `t12-invert` để giữ chữ sáng khi dùng theme sáng.
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
| `solar.ts` | Sản phẩm (hãng/model hư cấu; `category`: panel · inverter · battery · allinone · bess · accessory; `tech`, `segment` cho chip lọc mega menu), giải pháp, FAQ, đội ngũ, đánh giá |

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
  config/site.config.ts  # TOÀN BỘ thông tin công ty + cờ enabled từng section
  config/site.ts         # lớp dẫn xuất (helper, tương thích template-12)
  components/t14/        # header, mega menu, thanh đáy, các section mới của template-14
  i18n/                  # switch VI/EN (LangProvider, Tr, pickText)
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
