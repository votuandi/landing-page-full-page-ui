# Bảng ánh xạ màu cứng → token ngữ nghĩa

Token lấy theo bộ của template-15 (`src/app/globals.css`), là chuẩn cho `packages/tokens`.

| Vai trò | Token / class | Dấu hiệu nhận biết trong code cũ |
|---|---|---|
| Nền trang | `bg-bg` | `bg-white` ở `<main>`, `--t5-bg`, `--solar-background` |
| Nền thẻ, form | `bg-bg-elevated` | `bg-white` trong card, `bg-white/90` |
| Nền xen kẽ | `bg-bg-tint`, `bg-bg-sky`, `bg-bg-sun` | `--t8-sky`, `--t8-beige`, `bg-[#f7f8fa]`, `bg-slate-50` |
| Nền section tối | `bg-bg-deep` | `--t8-ink`, navy `#0b1f3a`, `#071b33` |
| Màu thương hiệu | `bg-primary`, `text-primary` | `--t5-primary`, `--solar-primary`, `#0d3b78`, `#15803d` |
| Thương hiệu đậm (chữ trên nền tint, hover) | `primary-strong` | `--solar-primary-dark`, hover của nút chính |
| Điểm cuối gradient | `primary-deep` | `to-[#…]` đậm trong hero/section thương hiệu |
| Màu thứ hai | `secondary`, `secondary-deep` | `--t8-blue #2f6fe4`, teal phụ |
| CTA nổi bật | `bg-accent text-on-accent` | `--t5-accent`, vàng `#f7b928`, `#f5b927` |
| Chữ màu nhấn trên nền sáng | `text-accent-ink` | chữ vàng trên nền trắng |
| Chữ chính / phụ / cấp 3 | `text-fg`, `text-fg-muted`, `text-fg-subtle` | `--t5-text`, `text-slate-900/500/400`, `--t5-muted` |
| Chữ trên primary/accent/ảnh | `text-on-primary`, `text-on-accent`, `text-on-media` | `text-white` trên nút, trên ảnh |
| Viền | `border-line` | `--t5-border`, `border-slate-200` |
| Lớp phủ ảnh | `bg-scrim/60` | `bg-black/50`, `from-black/70` |
| Kính | `bg-glass border-glass-border backdrop-blur-glass` | `bg-white/10 border-white/20 backdrop-blur` |
| Kính trên ảnh/nền tối | `bg-glass-strong border-glass-strong-border` | `.t8-glass-dark` |
| Trạng thái | `text-success`, `text-danger` | xanh/đỏ của form |
| Biểu đồ | `chart-a`, `chart-b` | màu series trong YieldChart, PowerChart |
| Minh họa (da, thiết bị) | `skin`, `skin-shade`, `device` | tay cầm điện thoại ở EnergyMonitoring |
| Màu riêng (burgundy t09, đất nung t13…) | `secondary` hoặc `accent` của theme đó | `--t5-burgundy` |

| Ngoài màu | Token |
|---|---|
| `rounded-[28px]`, `rounded-[32px]`, `rounded-3xl` ở thẻ | `rounded-card` |
| `rounded-full` ở nút/chip | `rounded-pill` |
| bo góc ảnh/video | `rounded-media` |
| `backdrop-blur`, `backdrop-blur-xl` | `backdrop-blur-glass` |
| `duration-500`, `duration-700` ở reveal | `duration-motion`, `duration-motion-slow` |
| `py-20 md:py-28` ở section | `py-section` |
| font tiêu đề riêng (Manrope ở t11) | `font-display` |
