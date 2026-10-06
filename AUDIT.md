# AUDIT — template-8 → template-12

Branch gốc: `template-8` (commit `aae6535`). Branch làm việc: `template-12`.
Tài liệu này ghi lại hiện trạng template-8 **trước khi sửa** và là mốc đối chiếu sau khi đổi màu.

---

## 1. Stack (giữ nguyên, không thêm framework)

| Hạng mục | Đang dùng |
|---|---|
| Framework | Next.js 15.4 (App Router), React 19, TypeScript 5 (strict) |
| Styling | Tailwind CSS 3.4 + `globals.css` (lớp `@layer components` tiền tố `t5-` / `t8-`) |
| Font | `next/font/google` Inter (latin + vietnamese) |
| Icon | `@heroicons/react` 2 (outline) |
| Animation | **Không có thư viện.** CSS keyframes + transition, `IntersectionObserver` trong `SectionReveal.tsx` bật/tắt `data-shown` |
| Ảnh | `next/image` (AVIF/WebP) |
| Lead | Route handler `src/app/api/lead/route.ts` → `LEAD_WEBHOOK_URL` (tùy chọn) |
| Test | Chưa có. template-12 dùng **`node:test` có sẵn của Node + `tsc`** (không thêm dependency) |
| CI | `.github/workflows/ci.yml`: typecheck → lint → build |

Code chết (không được import ở đâu, mang theo từ template cũ, chứa nhiều màu hex cứng):
`AllProductsSection, AllServicesSection, BestSellerSection, CompanyStorySection, CompletedProjectsSection,
ContactUsContent, Footer, Header, Hero, HomeExperience, IntroductionVideoSection, NewsCard, NewsSection,
OurPartners, ProductCard, ProductDetailContent, ProductSection, ProjectsSection, ScrollRevealObserver,
ServiceCard, ServiceDetailContent, SliderBanner, SolarBenefitsSection, SolarExpertiseSection,
StaggeredScrollAnimation, WarmPageHero, WarrantySection`, cùng `src/utils/constants.ts`, `src/types/index.ts`,
`src/hooks/*`. Trang `/news` và `/news/[slug]` không nằm trong menu/sitemap, nội dung cố định năm 2024
và biểu giá điện cũ → **BỎ** cùng `NewsPageContent`, `NewsDetailContent`, `ScrollAnimationWrapper`.

---

## 2. Các section trang chủ (theo thứ tự trong `HomeT8.tsx`)

| # | Section | Đánh giá | Lý do / hướng xử lý |
|---|---|---|---|
| 1 | **Hero** (`HeroT8`) – vòm ảnh, chip nổi, thẻ glass "Sản lượng hôm nay", hotspot | **CẢI TIẾN** | Giữ toàn bộ bố cục & hiệu ứng. CTA chính đổi thành "Dự toán chi phí" cuộn tới công cụ dự toán; số liệu lấy từ config; câu chữ hướng cả 3 phân khúc |
| 2 | **Lợi ích theo công trình** – lưới 3 thẻ minh họa | **CẢI TIẾN** | Giữ lưới 3 thẻ (nhận diện của template-8). Thẻ bấm vào mở tab gói tương ứng thay vì nhảy tới 3 màn chi tiết |
| 3–5 | **3 màn chi tiết phân khúc** (nhà máy / cửa hàng / gia đình, mỗi màn full-screen) | **BỎ** | 3 màn hình dài, lặp ý; nội dung được thay bằng section "Gói giải pháp" có tab theo phân khúc. Ảnh minh họa tái sử dụng ở tab gói |
| 6 | **ROI Calculator** (`RoiCalculator`) | **BỎ → thay thế** | Chỉ 3 vùng, quy đổi hóa đơn bằng 1 giá điện phẳng, không tính diện tích mái, xin SĐT không validate. Thay bằng công cụ "Dự toán chi phí lắp đặt" 5 bước (3.1) đặt ngay sau hero |
| 7 | **Theo dõi điện năng 24/7** (`EnergyMonitoringSection`) – điện thoại cầm tay | **GIỮ** | Điểm khác biệt mạnh, hợp cả B2C. Chỉ đổi màu sang token |
| 8 | **Case study** – 3 công trình lưới ảnh | **CẢI TIẾN** | Thành gallery "Công trình đã thực hiện" có tab phân khúc, dữ liệu từ `data/projects.ts` (3.4) |
| 9 | **Quy trình triển khai** 5 bước | **GIỮ** | Tạo niềm tin, hợp mọi phân khúc |
| 10 | **Mô hình đầu tư** – bảng 5 cột | **CẢI TIẾN** | Bảng ngang phải cuộn trên mobile. Chuyển thành 4 thẻ: Mua đứt / Trả góp / Thuê hệ thống / Lắp đặt 0 đồng – ESCO (3.3) |
| 11 | **Bảo hành tách bạch** | **GIỮ** | Ngắn, minh bạch |
| 12 | **Chính sách mái nhà** | **BỎ** | Nội dung pháp lý thuần B2B, giá trị chuyển đổi thấp; ý chính gộp vào FAQ |
| 13 | **Khách hàng nói gì** + dải thương hiệu thiết bị | **CẢI TIẾN** | Giữ testimonial (thêm khách hộ gia đình/cửa hàng). Dải logo thương hiệu chỉ hiện khi `siteMode = "installer_distributor"`, kèm link "Xem thiết bị" |
| 14 | **FAQ** | **GIỮ** | Thêm câu hỏi B2C (mất điện, mái tôn, trả góp) |
| 15 | **CTA cuối + LeadForm** | **CẢI TIẾN** | Giữ bố cục 2 nửa; form có validate SĐT VN, honeypot, trạng thái gửi |

Thêm mới: Gói giải pháp (3.2), Hình thức đầu tư (3.3), Gallery công trình (3.4), Số liệu nổi bật (3.5),
Thanh liên hệ cố định (3.6), Video Shorts (3.7).

Header: menu hiện 6 mục (Trang chủ, Giải pháp, Thiết bị, Dự án, Về chúng tôi, Liên hệ). template-12 giữ ≤ 6
mục, "Sản phẩm" chỉ có khi `siteMode = "installer_distributor"`. Không mega-menu.

---

## 3. Bảng màu hiện tại (template-8)

### 3.1 CSS variables (`globals.css :root`)
| Biến | Giá trị | Vai trò |
|---|---|---|
| `--t5-primary` | `#0d3b78` | Navy – nút chính, tiêu đề |
| `--t5-accent` | `#f7b928` | Vàng – CTA phụ, hotspot |
| `--t5-bg` | `#ffffff` | Nền trang |
| `--t5-text` | `#0f172a` | Chữ |
| `--t5-muted` | `#64748b` | Chữ phụ |
| `--t5-border` | `#e2e8f0` | Viền |
| `--t8-blue` | `#2f6fe4` | Xanh dương phụ (icon, biểu đồ) |
| `--t8-sky` | `#dbe9ff` | Nền xanh nhạt |
| `--t8-sun` | `#ffd666` | Vàng nắng nhạt (số liệu trên nền tối) |
| `--t8-beige` | `#f8f2e7` | Nền be |
| `--t8-sand` | `#efe3cc` | Be đậm (glow) |
| `--t8-ink` | `#0b1f3a` | Navy rất tối (chữ tiêu đề, section tối) |
| `.t5-dark` | `#0b1220 #e5edf8 #9fb0c4 #26364a #111c2c #0f1a29 #a8b7c8 #29394d` | Chế độ tối demo (ghi đè `!important`) |

### 3.2 Hex cứng trong component / config
| File | Màu |
|---|---|
| `layout.tsx` | `themeColor: #0d3b78` |
| `globals.css` | `#1d5bb8` (gradient page hero), `rgb(13 59 120 / .55)` (shadow nút), `rgb(7 27 51 / .1 / .5)`, `rgb(247 185 40 / .22)` |
| `HeroT8.tsx` | `#eaf2ff` (gradient), `#ffffff` (stroke SVG), `rgb(47 111 228/.32/.22/.15)`, `rgb(255 214 102/.55)`, `rgb(239 227 204/.9)`, `rgb(13 59 120/.7/.55)`, `rgb(11 31 58/.55/.60)`, `rgb(247 185 40/.90)`, `rgb(255 255 255/.9)` |
| `HomeT8.tsx` | `#1d5bb8` (×3), `rgb(11 31 58/.7/.9/.3/.15)`, `rgb(247 185 40/.3/.35)`, `rgb(219 233 255/.6/.4)` |
| `SavingsBySegment.tsx` | `#f3f7ff`, `rgb(11 31 58/.55/.85/.15/.45)`, `rgb(255 214 102/.4/.3)`, `rgb(47 111 228/.16)`, `rgb(248 242 231/.35)` |
| `RoiCalculator.tsx` | `#1d5bb8`, `rgb(13 59 120/.7)`, `rgb(247 185 40/.35)`, `rgba(255,255,255,.25/.6)` |
| `EnergyMonitoringSection.tsx` | `#082a57`, `#1d5bb8`, `#f4f8ff`, `#f7b928`, `#f0a500`, `#2f6fe4`, da tay `#f1c7a3 #dfa982 #f8dcc4`, `#1d5bb8`, `#f7b928`, `#000`, `rgb(0 0 0/.6)`, `rgb(255 255 255/.2)`, `rgb(255 214 102/.3)`, `rgb(219 233 255/.18)`, `rgb(247 185 40/.35)` |
| `config/site.ts` `THEME_PRESETS` | `#0d3b78 #f7b928 #071b33 #f5b927 #17202b #ffb703 #12372a #f4c95d #172554 #facc15` |
| `tailwind.config.ts` | `primary.*` `#f1f7f3 #deeee3 #2f7a5a #1B5E45 #12372A`, `solar.*` `#F4C95D #1B5E45 #12372A #C9E265 #eef4ef #f7f9f6` (chỉ code chết dùng) |
| `not-found.tsx` | class `sky-50/600/700`, `blue-100`, `gray-600/800` |

### 3.3 Class Tailwind màu cứng (file đang render, đếm xấp xỉ)
`text-white` 65 · `bg-white/*` 61 · `text-slate-500` 32 · `border-white/*` 27 · `border-slate-200` 23 ·
`text-slate-600` 17 · `text-slate-400` 16 · `text-slate-700` 10 · `bg-slate-50` 9 · `text-slate-900` 6 ·
`bg-slate-100` 6 · `border-slate-300` 4 · `text-amber-600/700/800`, `bg-amber-100`, `border-amber-300` ·
`text-emerald-300/600/700/800/900`, `bg-emerald-50/100/400/500`, `border-emerald-200` · `text-red-600` ·
`bg-slate-900/950`, `from-slate-700 to-slate-900` (khung điện thoại).

---

## 4. Ngôn ngữ thiết kế cần bảo toàn (giá trị đối chiếu)

### 4.1 Border-radius
| Thành phần | Giá trị |
|---|---|
| Nút, chip, badge, thanh mobile, icon button | `rounded-full` (9999px) |
| Input, filter option | `--t5-radius: 14px` |
| `.t8-card` (FAQ, bảng, testimonial) | `28px` |
| Thẻ phân khúc, khung form CTA, panel ROI | `32px` |
| Thẻ glass nổi (sản lượng, hóa đơn), card flows | `rounded-3xl` = 24px |
| Ô số liệu, thẻ nhỏ, icon tile | `rounded-2xl` = 16px |
| Ô theme preset | `rounded-xl` = 12px |
| Vòm ảnh hero | `rounded-t-full` + `rounded-b-[36px]` |
| Điện thoại | khung `44px`, màn `36px` |
| Drawer RFQ | `rounded-l-[32px]` |

### 4.2 Backdrop-blur
| Thành phần | Giá trị |
|---|---|
| `.t8-glass`, `.t8-glass-dark`, header, thanh mobile, panel theme, drawer, thẻ overlay phân khúc | `backdrop-blur-xl` = 24px |
| `.t8-card`, eyebrow, pill hero, ô lợi ích, quy trình, policy | `backdrop-blur` = 8px |
| Lớp phủ modal | `backdrop-blur-sm` = 4px |

### 4.3 Độ trong suốt nền/viền glass
| Thành phần | Nền | Viền |
|---|---|---|
| `.t8-glass` (glass sáng) | `white / .60` | `white / .70` |
| `.t8-glass-dark` (glass trên nền tối) | `white / .10` | `white / .15` |
| `.t8-card` | `white / .80` | `slate-200 / .70` |
| Header | `white / .70` | `white / .60` |
| Thanh CTA mobile | `white / .75` | `white / .70` |
| Overlay thông tin trên thẻ phân khúc | `white / .10` | `white / .20` |
| Ô quy trình | `white / .04` → hover `.12` | `white / .15` |
| Gradient phủ ảnh | đáy `.85` → giữa `.15` → trong suốt; footer ảnh `.7`; CTA `.9/.3` |
| Glow tròn | `.16 – .55` (radial, tắt dần ở 65–70%) |

### 4.4 Shadow (hình học)
| Thành phần | Giá trị |
|---|---|
| `.t8-glass` | `0 18px 50px -20px` α .35 |
| `.t8-card` | `0 20px 60px -30px` α .25 |
| Thẻ phân khúc | `0 30px 60px -35px` α .55 |
| Vòm ảnh hero | `0 40px 80px -30px` α .55 |
| Panel kết quả ROI | `0 40px 80px -40px` α .70 |
| Nút CTA hero | `0 14px 30px -12px` α .70 |
| Nút primary hover | `0 12px 30px -12px` α .55 |
| Điện thoại | `0 50px 100px -30px` đen α .60 |

### 4.5 Animation / hiệu ứng
| Hiệu ứng | Giá trị |
|---|---|
| Scroll reveal (`data-reveal`) | opacity/translate/scale **.9s `cubic-bezier(.16,1,.3,1)`**, transform .5s, màu .3s; dịch `64px` (up/down), `80px` (left/right), zoom `scale(.86)` |
| IntersectionObserver | `threshold .12`, `rootMargin 0 0 -6% 0`, phát lại khi rời qua mép dưới |
| Stagger | bước `.06 – .15s` qua `data-reveal-step` |
| Float | `t8-float` 6s · `t8-float-delay` 7s trễ 1.2s · `t8-float-slow` 9s trễ .6s; `ease-in-out`, `translateY(-10px)` |
| Hotspot | pulse-ring 2s ease-out, scale .8 → 2.4 |
| Dây nối | dash 1.6s linear |
| Hover ảnh | `scale(1.05)` `duration-700` (thẻ to), `scale(1.03)` `duration-500` (catalog) |
| Hover thẻ | `-translate-y-1.5` (6px); mũi tên `translate-x-1` |
| Transition mặc định | Tailwind `transition` 150ms `cubic-bezier(.4,0,.2,1)` |
| `prefers-reduced-motion` | Tắt toàn bộ animation/transition; reveal hiện ngay |
| Section | `.t8-screen` min-height `100svh`, căn giữa dọc |

---

## 5. Lựa chọn bảng màu mới

**Chọn A — "Emerald Dusk" (nền tối).**

Lý do:
1. template-8 là giao diện **nền sáng** (trắng / be / xanh trời) với chủ đạo **navy xanh dương** `#0d3b78`.
   Bảng B "Sky & Sun" cũng nền sáng, chủ đạo xanh lam-cyan `#0E7490` và CTA vàng → gần như cùng họ màu
   và cùng độ sáng, khách sẽ thấy là "template-8 đổi tông nhẹ".
2. Bảng A khác biệt ở cả **độ sáng nền** (tối) lẫn **sắc độ** (xanh lục emerald thay xanh dương), trong khi
   vẫn giữ "vàng nắng" cho CTA – phù hợp chủ đề năng lượng mặt trời.
3. Glass trên nền tối vẫn giữ được chất "kính mờ" của template-8 (blur 24px, viền trắng mờ).

Bảng B vẫn được cài sẵn dưới dạng giao diện phụ `data-theme="light"` (đổi bằng 1 thuộc tính) để chủ
template có thêm lựa chọn — không phải giao diện mặc định.

### Ghi chú bảo toàn
- `--glass` / `--glass-border` của bảng A (`.06` / `.12`) được dùng cho `.t8-glass` (thay `.60/.70` vốn chỉ hợp
  nền sáng). Đây là thay đổi độ trong suốt **duy nhất**, do bảng màu yêu cầu. `.t8-glass-dark` giữ `.10/.15`.
- Shadow giữ nguyên offset/blur/spread/α; chỉ đổi **màu** bóng từ navy sang token `--c-shadow`.
- Kết quả đối chiếu sau khi đổi màu: xem mục 6.

---

## 6. Đối chiếu sau khi đổi màu

Tokens nằm ở `src/app/globals.css` (`:root` = bảng A, `[data-theme="light"]` = bảng B).
`tailwind.config.ts` **thay hẳn** bảng màu mặc định của Tailwind bằng token → `bg-white`, `text-slate-500`… không còn sinh CSS.
Kiểm tra: `grep` hex / `rgb(` số / class màu Tailwind trong `src/components` và `src/app/**/*.tsx` → 0 kết quả
(ngoại lệ có chủ đích: `themeColor` trong `config/site.ts` vì meta tag cần chuỗi màu).

| Giá trị | template-8 | template-12 | Kết quả |
|---|---|---|---|
| Radius nút / input / card / thẻ phân khúc / glass | full / 14px / 28px / 32px / 24px | giữ nguyên class | ✅ giữ |
| Vòm hero, điện thoại, drawer | 36px+full / 44-36px / 32px | giữ | ✅ |
| Blur glass, header, mobile bar, drawer | 24px | 24px | ✅ |
| Blur card, eyebrow | 8px | 8px | ✅ |
| Blur overlay modal | 4px | 4px | ✅ |
| `.t8-glass` nền / viền | white .60 / .70 | `--glass` .06 / `--glass-border` .12 | ⚠️ đổi theo bảng A (có chủ đích, mục 5) |
| `.t8-glass-dark` | .10 / .15 | `--glass-strong` .10 / .15 | ✅ |
| Gradient phủ ảnh | .85/.15/.55/.7/.9/.3 | cùng alpha trên `--c-scrim` | ✅ |
| Glow radial | .16–.55, tắt ở 65–70% | cùng alpha/điểm dừng, màu token | ✅ |
| Shadow (offset/blur/spread/α) | mục 4.4 | giữ, màu `--c-shadow` | ✅ |
| Reveal .9s cubic-bezier(.16,1,.3,1), 64/80px, scale .86 | | không đổi | ✅ |
| Float 6/7/9s, pulse 2s, dash 1.6s | | không đổi | ✅ |
| Hover ảnh 1.05/700ms, thẻ -6px | | không đổi | ✅ |
| prefers-reduced-motion | | giữ + carousel/video tôn trọng | ✅ |

Độ tương phản (WCAG, tính theo công thức relative luminance):
| Cặp | Tỷ lệ | AA |
|---|---|---|
| `--text` #E8F3EF / `--bg` | 15.4 | ✅ |
| `--text-muted` #9FB8B1 / `--bg` | 8.1 | ✅ |
| `--text-muted` / glass trên `--bg-elevated` (~#1C3531) | 6.2 | ✅ |
| `fg-subtle` #8AA59E / glass | 4.9 | ✅ |
| `--primary` #10B981 / `--bg` | 6.8 | ✅ |
| chữ `on-primary` #041C15 / `--primary` | 7.0 | ✅ |
| chữ `on-accent` #0B1F1C / `--accent` #F5B83D | 9.6 | ✅ |
| `--text-muted` / `primary-deep` #064E3B (section thương hiệu) | 4.6 | ✅ |
| Trắng trên `--primary` | 2.5 | ❌ → **không dùng**, thay bằng `on-primary` |
