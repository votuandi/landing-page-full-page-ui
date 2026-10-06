# AUDIT — template-8 → template-13

Branch gốc: `template-8` (commit `aae6535`). Branch làm việc: `template-13`.
Định vị template-13: **"Uy tín & trải nghiệm"** — công ty vừa lắp đặt hệ thống, vừa bán thiết bị/đèn năng lượng mặt trời.
Tài liệu này ghi hiện trạng template-8 **trước khi sửa code** và là mốc đối chiếu sau khi đổi màu.

---

## 1. Stack (giữ nguyên, không thêm framework)

| Hạng mục | Đang dùng |
|---|---|
| Framework | Next.js 15.4 (App Router), React 19, TypeScript 5 (strict) |
| Styling | Tailwind CSS 3.4 + `src/app/globals.css` (lớp `@layer components`, tiền tố `t5-` / `t8-`) |
| Font | `next/font/google` Inter (latin + vietnamese) |
| Icon | `@heroicons/react` 2 |
| Animation | **Không dùng thư viện.** CSS keyframes/transition + `IntersectionObserver` trong `SectionReveal.tsx` (bật/tắt `data-shown`) |
| Ảnh | `next/image` (AVIF/WebP) |
| Lead | `src/app/api/lead/route.ts` → `LEAD_WEBHOOK_URL` (tùy chọn), không validate, không chống spam |
| Test | Chưa có. template-13 dùng **`node:test` có sẵn của Node + `tsc`** — không thêm dependency |
| CI | `.github/workflows/ci.yml`: typecheck → lint → build |

**Code chết** (không được import ở đâu, mang theo từ template cũ, chứa phần lớn mã màu cứng):
`AllProductsSection, AllServicesSection, BestSellerSection, CompanyStorySection, CompletedProjectsSection,
ContactUsContent, Footer, Header, Hero, HomeExperience, IntroductionVideoSection, NewsCard, NewsSection,
OurPartners, ProductCard, ProductDetailContent, ProductSection, ProjectsSection, ScrollRevealObserver,
ServiceCard, ServiceDetailContent, SliderBanner, SolarBenefitsSection, SolarExpertiseSection,
StaggeredScrollAnimation, WarmPageHero, WarrantySection`, `src/utils/constants.ts`, `src/types/index.ts`,
`src/hooks/*`. → **XÓA** ở bước đổi màu.

---

## 2. Section của template-8 và đánh giá

### 2.1 Trang chủ (thứ tự trong `HomeT8.tsx`)

| # | Section | Đánh giá | Lý do / vị trí trong khung template-13 |
|---|---|---|---|
| 1 | **Hero** (`HeroT8`): vòm ảnh, chip nổi, thẻ glass "Sản lượng hôm nay", hotspot | **CẢI TIẾN** → 3.3 | Giữ bố cục & toàn bộ hiệu ứng. Tiêu đề hướng lợi ích (tiết kiệm tiền điện), 2 CTA "Dự toán chi phí" / "Xem công trình thực tế", 3 con số đếm khi xuất hiện, lấy từ config |
| 2 | **Lợi ích theo công trình**: lưới 3 thẻ minh họa | **CẢI TIẾN** → 3.4 | Thành lưới **4 ô glass** (thêm Trang trại). Bấm vào ghi phân khúc vào state chung, các section sau tự lọc |
| 3–5 | **3 màn chi tiết phân khúc** (full-screen, xen kẽ ảnh/chữ) | **BỎ** | 3 màn hình dài, lặp ý, không có trang trại. Ý chính chuyển vào thẻ "Gói giải pháp" theo phân khúc; ảnh minh họa dùng lại |
| 6 | **ROI Calculator** (`RoiCalculator`) | **BỎ → thay thế** → 3.6 | Chỉ 3 miền, quy đổi hóa đơn bằng 1 giá điện phẳng, không có diện tích mái, xin SĐT không validate. Thay bằng calculator 5 bước (module từ template-12, mở rộng 4 phân khúc) |
| 7 | **Theo dõi điện năng 24/7** (`EnergyMonitoringSection`, tay cầm điện thoại) | **GIỮ** | Minh họa "trải nghiệm sau lắp đặt" — đúng định vị. Chỉ đổi sang token màu. Đặt sau 3.7 |
| 8 | **Case study** 3 công trình | **CẢI TIẾN** → 3.7 | Gallery lọc theo phân khúc, có tiết kiệm/tháng, icon play mở đúng video trong 3.5 |
| 9 | **Quy trình triển khai** 5 bước (đầu ra B2B) | **BỎ** | Ngôn ngữ chủ đầu tư B2B, chiếm 1 màn hình. Cam kết khảo sát/bàn giao được tóm trong dải cam kết 3.11 |
| 10 | **Mô hình đầu tư** (bảng 5 cột) | **BỎ** | Bảng phải cuộn ngang trên mobile, nội dung PPA/thuê mái không thuộc định vị B2C của template-13 |
| 11 | **Bảo hành tách bạch** | **CẢI TIẾN** | Rút thành mục "Bảo hành dài hạn" trong 3.11; bảng chi tiết chuyển sang trang `/ve-chung-toi` |
| 12 | **Chính sách mái nhà** | **BỎ** | Pháp lý B2B, giá trị chuyển đổi thấp; ý "hỗ trợ thủ tục đấu nối" nằm trong 3.11 và FAQ |
| 13 | **Khách hàng nói gì** + dải thương hiệu thiết bị | **CẢI TIẾN** → 3.9 | Thành khối uy tín: chứng chỉ, báo chí, đánh giá (có phân khúc/địa điểm/kWp), dải thương hiệu |
| 14 | **FAQ** (8 câu, có FAQPage schema) | **CẢI TIẾN** | Rút còn 6 câu cho khách gia đình/cửa hàng/trang trại, giữ schema. Đặt sau Blog |
| 15 | **CTA cuối + LeadForm** | **BỎ** | Trùng chức năng với form calculator, popup tư vấn và thanh liên hệ cố định |

**Thêm mới:** Topbar hotline theo mục đích (3.1), Video Shorts + trình phát trong trang (3.5), Gói giải pháp (3.6),
dải Sản phẩm + Giỏ yêu cầu báo giá (3.8), Khối uy tín (3.9), Blog theo tình huống (3.10), Dải cam kết (3.11),
Thanh liên hệ + popup tư vấn (3.12).

### 2.2 Khung trang & trang phụ

| Thành phần | Đánh giá | Ghi chú |
|---|---|---|
| Thanh demo + bảng thử màu (`SiteShell`) | **CẢI TIẾN** | Giữ (công cụ bán template). Preset màu chuyển sang token, không còn hex |
| Header: 6 mục menu, nút giỏ RFQ, CTA "Đặt lịch khảo sát" | **CẢI TIẾN** → 3.2 | ≤ 6 mục, không mega-menu; icon "Giỏ báo giá" có badge + CTA "Nhận tư vấn" màu accent |
| Thanh đáy mobile Gọi / Zalo / Báo giá | **CẢI TIẾN** → 3.12 | Gọi (hotline đầu tiên) / Zalo / Messenger; desktop có nút nổi; không render link rỗng |
| Drawer RFQ (chỉ danh sách slug) | **CẢI TIẾN** → 3.8 | Số lượng, xóa, form gửi trực tiếp, localStorage có try/catch |
| Footer | **CẢI TIẾN** | Thêm hotline theo mục đích, mạng xã hội |
| `/product`, `/product/[slug]` | **CẢI TIẾN** | → `/san-pham` (lọc danh mục + khoảng giá, xem nhanh, thêm vào giỏ) và `/san-pham/[slug]` |
| `/project/[slug]` | **CẢI TIẾN** | → `/cong-trinh/[slug]` |
| `/about-us`, `/contact-us` | **CẢI TIẾN** | → `/ve-chung-toi`, `/lien-he` |
| `/service`, `/service/[slug]` | **BỎ** | Thay bằng gói giải pháp trên trang chủ; chuyển hướng 308 |
| `/news`, `/news/[slug]` | **BỎ** | Nội dung cố định năm 2024, chính sách cũ, không có trong menu/sitemap. Thay bằng `/tin-tuc` (blog theo tình huống) |

Đường dẫn cũ được chuyển hướng 308 trong `next.config.ts`.

---

## 3. Ngôn ngữ thiết kế cần bảo toàn

Giá trị đo trực tiếp từ code template-8. Sau khi đổi màu, các giá trị này **không đổi** (xem mục 5).

### 3.1 Bo góc (border-radius)
| Thành phần | Giá trị |
|---|---|
| Nút (`.t5-button`), chip, badge, icon button, thanh đáy mobile | `9999px` (rounded-full) |
| Ô nhập (`.t5-input`, `.t5-filter-option`) | `14px` (`--t5-radius`) |
| Thẻ `.t8-card`, thẻ FAQ, testimonial | `28px` |
| Khối lớn (form CTA, kết quả ROI, thẻ phân khúc, drawer RFQ `rounded-l`) | `32px` |
| Thẻ glass nổi (hero, monitoring) | `24px` (rounded-3xl) |
| Ô số liệu, icon tile, lợi ích | `16px` (rounded-2xl) |
| Vòm ảnh hero | `rounded-t-full` + `rounded-b-[36px]`, viền `6px` |
| Khung điện thoại | `44px` ngoài / `36px` màn hình |

### 3.2 Kính mờ (glass) & blur
| Lớp | Nền | Viền | Blur | Shadow |
|---|---|---|---|---|
| `.t8-glass` (trên nền sáng) | trắng **60%** | trắng 70%, 1px | `backdrop-blur-xl` = **24px** | `0 18px 50px -20px` màu thương hiệu 35% |
| `.t8-glass-dark` (trên nền tối/ảnh) | trắng **10%** | trắng 15%, 1px | 24px | — |
| `.t8-card` | trắng **80%** | slate-200 70%, 1px | `backdrop-blur` = **8px** | `0 20px 60px -30px` màu mực 25% |
| Header `.t5-header` | trắng **70%** | trắng 60% (đáy) | 24px | — |
| Thanh đáy mobile | trắng **75%** | trắng 70% | 24px | `shadow-2xl` |
| Overlay drawer/modal | slate-950 **40%** | — | `backdrop-blur-sm` = 4px | — |
| Thẻ nổi trong ảnh phân khúc | trắng 10% | trắng 20% | 24px | — |

### 3.3 Shadow
- `.t8-glass`: `0 18px 50px -20px rgb(primary / .35)`
- `.t8-card`: `0 20px 60px -30px rgb(ink / .25)`
- Thẻ phân khúc: `0 30px 60px -35px rgb(ink / .55)`; vòm hero: `0 40px 80px -30px rgb(primary / .55)`
- Nút chính hover: `0 12px 30px -12px rgb(primary / .55)` + `brightness(1.1)`
- Tailwind `shadow-3xl`: `0 25px 50px -12px rgb(0 0 0 / .25)` (khai báo nhưng không dùng)

### 3.4 Animation
| Hiệu ứng | Giá trị |
|---|---|
| Scroll reveal (`data-reveal`, `data-reveal-stagger`) | opacity + `translate` **0.9s** `cubic-bezier(.16,1,.3,1)`; dịch **64px** (up/down), **80px** (left/right), `scale .86` (zoom); delay `--rd`, stagger mặc định 0.1s; `threshold .12`, `rootMargin 0 0 -6% 0`; replay khi rời viewport qua đáy |
| Transition màu/shadow đi kèm reveal | 0.3s; `transform` 0.5s |
| Float (`t8-float`, `-delay`, `-slow`) | `translateY(-10px)` ease-in-out, **6s / 7s (delay 1.2s) / 9s (delay .6s)** |
| Hotspot pulse | `scale .8 → 2.4`, opacity .7 → 0, **2s** ease-out |
| Dash (đường nối hotspot) | `stroke-dasharray 4 4`, offset −24, **1.6s** linear |
| Hover ảnh | `scale(1.05)` **700ms** (`duration-700`); ảnh full-bleed `scale(1.03)` |
| Hover thẻ | `-translate-y-1.5` (6px); mũi tên `translate-x-1` |
| Transition mặc định Tailwind | 150ms `cubic-bezier(.4,0,.2,1)` |
| `prefers-reduced-motion: reduce` | tắt toàn bộ animation/transition (0.01ms), hiện ngay mọi phần tử reveal |

### 3.5 Bố cục
- `.t5-container`: `max-w-[1280px]`, padding `16 / 24 / 32px`; dưới 360px: 14px.
- `.t5-section`: `py-16 md:py-24`. `.t8-screen`: section full-screen (`min-height:100svh`).
- Tiêu đề `.t5-heading`: `text-4xl sm:text-5xl`, `font-black`, `tracking-[-0.045em]`.

---

## 4. Bảng màu template-8 và nơi viết màu cứng

### 4.1 CSS variables (`globals.css :root`)
| Biến | Giá trị | Vai trò |
|---|---|---|
| `--t5-primary` | `#0d3b78` | Navy — nút chính, tiêu đề |
| `--t5-accent` | `#f7b928` | Vàng — CTA phụ, hotspot |
| `--t5-bg` / `--t5-text` | `#ffffff` / `#0f172a` | Nền / chữ |
| `--t5-muted` / `--t5-border` | `#64748b` / `#e2e8f0` | Chữ phụ / viền |
| `--t8-blue` | `#2f6fe4` | Xanh dương phụ (icon, biểu đồ) |
| `--t8-sky` / `--t8-beige` / `--t8-sand` | `#dbe9ff` / `#f8f2e7` / `#efe3cc` | Nền nhạt xen kẽ, glow |
| `--t8-sun` | `#ffd666` | Số liệu nổi bật trên nền tối |
| `--t8-ink` | `#0b1f3a` | Navy rất tối — tiêu đề, section tối |
| `.t5-dark` | `#0b1220 #e5edf8 #9fb0c4 #26364a #111c2c #0f1a29 #a8b7c8 #29394d` | Chế độ tối demo (ghi đè `!important`) |

### 4.2 Màu cứng trong code (file đang dùng)
| File | Hex | `rgb()` literal | Class màu Tailwind mặc định (slate/amber/emerald/white…) |
|---|---|---|---|
| `tailwind.config.ts` | 11 (`primary.*`, `solar.*`) | — | — |
| `src/app/globals.css` | 20 | 6 | nhiều trong `@apply` |
| `src/config/site.ts` (`THEME_PRESETS`) | 5 cặp | — | — |
| `src/app/layout.tsx` (`themeColor`) | 1 (`#0d3b78`) | — | — |
| `HeroT8.tsx` | 4 (`#eaf2ff`, `#ffffff` ×3) | 11 | 26 |
| `EnergyMonitoringSection.tsx` | 13 (`#082a57 #1d5bb8 #f4f8ff #f7b928 #f0a500 #2f6fe4 #f1c7a3 #dfa982 #f8dcc4`) | 5 | 38 |
| `HomeT8.tsx` | 2 (`#1d5bb8`) | 6 | 45 |
| `SavingsBySegment.tsx` | 1 (`#f3f7ff`) | 7 | 22 |
| `RoiCalculator.tsx` | 1 (`#1d5bb8`) | 4 | 8 |
| `SiteShell.tsx` | 0 (đọc từ preset) | — | 36 |
| `ProductCatalog.tsx`, `LeadForm.tsx` | 0 | — | 17 / 5 |
| `src/app/**/page.tsx` | 0 | — | 108 (chủ yếu `slate-*`, `bg-white`, `!text-…`) |
| Code chết (mục 1) | 107 | 8 | rất nhiều |

Kết luận: màu nằm rải rác ở 3 lớp (biến CSS, giá trị cứng trong config/component, class palette mặc định của Tailwind).
template-13 gom về **một** nguồn: token trong `globals.css`, Tailwind chỉ được sinh class từ token.

---

## 5. Bảng màu template-13

### 5.1 So sánh và lựa chọn

| | template-8 | template-12 | C — Midnight Solar | D — Warm Sand |
|---|---|---|---|---|
| Nền | sáng (trắng/be) | **tối** `#0B1F1C` | **tối** `#0A1224` | sáng `#FBF7F1` |
| Primary | navy/xanh dương `#0d3b78`, `#2f6fe4` | xanh lục `#10B981` | **xanh dương** `#3B82F6` | **đất nung** `#C2410C` |
| Accent / CTA | vàng `#f7b928` | vàng `#F5B83D` | **cam** `#FB923C` | xanh ngọc đậm `#0F766E` |
| Trùng với template khác | — | — | nền tối = t12; primary xanh dương = t8; CTA cam-vàng ấm = t8 và t12 | nền sáng = t8 (nhưng sắc ấm cát, không phải trắng/xanh) |

**Chọn D — "Warm Sand".**
- C trùng 3 trục: chế độ tối giống template-12, sắc xanh dương gần như trùng `--t8-blue` (#2f6fe4 ≈ #3B82F6), CTA cam ấm giống vàng của cả hai.
- D chỉ trùng một trục (nền sáng) với template-8, còn **sắc chủ đạo hoàn toàn khác**: đất nung/cam cháy và xanh ngọc đậm không xuất hiện ở template nào trước đó. Khi khách xem 3 demo cạnh nhau, D dễ phân biệt nhất.
- D hợp định vị "Uy tín & trải nghiệm": tông ấm, giống vật liệu ngói/gạch, cảm giác gần gũi với hộ gia đình, cửa hàng.

### 5.2 Token (định nghĩa trong `src/app/globals.css`)
Giá trị palette D giữ nguyên; các token phụ được suy ra để thay mọi vai trò màu của template-8.

| Token | Giá trị | Vai trò |
|---|---|---|
| `--bg` | `#FBF7F1` | Nền trang |
| `--bg-elevated` | `#FFFFFF` | Thẻ, drawer, modal |
| `--bg-tint` | `#F3EBDF` | Nền section xen kẽ (thay `--t8-beige`, `--t8-sky`) |
| `--bg-deep` | `#2A1A12` | Section tối (thay `--t8-ink`) |
| `--glass` / `--glass-border` | `rgba(255,255,255,0.7)` / `rgba(194,65,12,0.15)` | Kính mờ trên nền sáng |
| `--glass-strong` / `--glass-strong-border` | `rgba(255,255,255,0.10)` / `rgba(255,255,255,0.15)` | Kính mờ trên nền tối/ảnh (= `.t8-glass-dark`) |
| `--primary` / `--primary-strong` | `#C2410C` / `#9A3412` | Thương hiệu, nút chính |
| `--primary-deep` | `#7C2D12` | Điểm cuối gradient section tối |
| `--accent` | `#0F766E` | CTA phụ ("Nhận tư vấn", nút play) |
| `--text` / `--text-muted` / `--text-subtle` | `#1C1917` / `#57534E` / `#6B6560` | Chữ chính / phụ / cấp 3 |
| `--sun` | `#F59E0B` | Chỉ dùng trang trí (glow, biểu đồ sản lượng, hotspot) — không dùng cho chữ trên nền sáng |
| `--highlight` | `#FDBA74` | Số liệu nổi bật trên nền tối (thay `--t8-sun`) |
| `--scrim` / `--on-media` | `#1C1917` / `#FFFFFF` | Lớp phủ ảnh / chữ trên ảnh |
| `--success` / `--danger` | `#15803D` / `#B91C1C` | Trạng thái form |

### 5.3 Độ trong suốt glass
Palette D quy định `--glass` = trắng **70%**. template-8 dùng 60% cho `.t8-glass`. Giữ nguyên blur (24px), viền 1px, shadow
và bo góc; chỉ nâng nền kính từ 60% → 70% theo đúng palette, vì chữ `--text-muted` đặt trên kính sáng hơn sẽ có
tương phản tốt hơn. `.t8-card` (80%), `.t8-glass-dark` (10%), header (70%), thanh đáy (75%) giữ nguyên.

### 5.4 Tương phản (WCAG 2.1 AA, ngưỡng 4.5:1 cho chữ thường)
| Cặp | Tỉ lệ |
|---|---|
| `--text` trên `--bg` / `--bg-tint` | 16,4:1 / 14,8:1 |
| `--text-muted` trên `--bg` / `--bg-tint` | 7,2:1 / 6,5:1 |
| `--text-muted` trên glass 70% phủ `--bg-tint` (màu tổng hợp `#FBF9F5`) | 7,3:1 |
| `--text-subtle` trên `--bg` / `--bg-tint` | 5,4:1 / 4,9:1 |
| `--primary` trên `--bg` / glass (link, số liệu) | 4,9:1 / 4,9:1 |
| `--primary` trên `--bg-tint` | **4,4:1 — không đạt** → chữ trên nền tint dùng `--primary-strong` (6,2:1) |
| `--accent` trên `--bg` / `--bg-tint` | 5,1:1 / 4,6:1 |
| Trắng trên `--primary` (nút chính) | 5,2:1 |
| Trắng trên `--accent` (CTA phụ, nút play) | 5,5:1 |
| `--highlight` trên `--bg-deep` / `--primary-deep` | 9,9:1 / 5,6:1 |
| Trắng 75% / 60% (chữ phụ) trên `--bg-deep` | 9,9:1 / 6,7:1 |
| Trắng trên ảnh — scrim 55% / 70% / 80% (ảnh nền trắng, trường hợp xấu nhất) | 3,9 / 6,5 / 9,2:1 → **chữ trên ảnh phải nằm ở vùng scrim ≥ 70%** |

### 5.5 Đối chiếu sau khi đổi màu
Mục này được kiểm lại sau commit đổi màu: bo góc, blur, shadow (chỉ đổi màu, giữ offset/blur/spread/alpha),
thời lượng/easing animation ở mục 3 **không thay đổi**; ngoại lệ duy nhất là nền glass 60% → 70% (mục 5.3).
