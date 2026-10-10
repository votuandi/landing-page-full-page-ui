# E2 — Design tokens & theme engine

**Mục tiêu**: "chất" riêng của mỗi template trở thành dữ liệu (theme), đổi được lúc chạy theo tenant mà không build lại.
**Target epic**: cùng một section render đúng ở mọi theme; đổi theme của một site = đổi 1 trường trong DB, có hiệu lực sau
revalidate; 0 vi phạm `lint:tokens`.
**Phụ thuộc**: E1-S01, E1-S06.

---

### E2-S01 · Schema `ThemeTokens` ✅ · PR [#12](https://github.com/votuandi/landing-page-full-page-ui/pull/12)
**Là** dev, **tôi muốn** một kiểu dữ liệu duy nhất mô tả theme, **để** mọi theme có cùng bộ biến và section tin cậy được biến đó tồn tại.
- **Chi tiết**: `packages/tokens/src/schema.ts` (zod) gồm:
  - `colors` (light, `dark?`): bộ token của t15 — `bg, bg-elevated, bg-deep, bg-tint, bg-sky, bg-sun, primary, primary-strong,
    primary-deep, secondary, secondary-deep, leaf, sky, accent, accent-soft, accent-ink, on-primary, on-secondary, on-accent,
    on-media, fg, fg-muted, fg-subtle, line, scrim, shadow, success, danger, chart-a, chart-b, skin*, device, glass-tint`
    dạng `"R G B"`; `glass`, `glass-border`, `glass-strong`, `glass-strong-border` dạng rgba.
  - `font`: `sans`, `display`, `weights[]`, nguồn (`google` | `local`).
  - `radius`: `card`, `pill`, `media`, `input`, `button`.
  - `shadow`: `strength` (0–1), `tint`.
  - `glass`: `blur` (px), `enabled`.
  - `motion`: `durationFast|Base|Slow`, `easing`, `revealDistance`, `revealEnabled`.
  - `density`: `sectionY` (sm|md|lg), `container` (px).
  - `meta`: `id`, `name`, `group` (`classic|pro|signature`), `supportsDark`, `preview` (ảnh).
- **Target**: t15 hiện tại biểu diễn được 100% bằng schema mà không mất biến nào.
- **AC**:
  - [x] `parseTheme()` báo lỗi rõ trường thiếu/sai định dạng.
  - [x] Unit test: theme t15 parse thành công; theme thiếu `primary` bị từ chối.
- Agent: Claude · Cỡ: M

### E2-S02 · Sinh CSS variables theo theme lúc render ✅ · PR [#13](https://github.com/votuandi/landing-page-full-page-ui/pull/13)
**Là** tenant, **tôi muốn** site của tôi khoác đúng theme ngay từ byte đầu, **để** không nhấp nháy màu.
- **Chi tiết**: `themeToCss(theme, overrides) → string` sinh `:root{…}` + `[data-theme="dark"]{…}` +
  `@media (prefers-color-scheme: dark)` nếu `supportsDark`. `apps/web` inline vào `<head>` qua `<style>` (CSP tĩnh cho phép style inline, không dùng nonce — D13, để trang vẫn cache tĩnh).
  Script chống nhấp nháy dark mode giữ cách t15 đang làm.
- **Target**: CSS theme ≤ 4 KB/tenant; không thêm request.
- **AC**:
  - [x] Ảnh chụp t15 sau khi chuyển sang CSS sinh động khớp baseline (≤ 0,5%).
  - [x] Override `primary` của tenant thắng giá trị theme.
  - [x] Không có biến CSS nào của theme khác lẫn vào HTML.
- Phụ thuộc: S01 · Agent: Codex · Cỡ: M

### E2-S03 · Tailwind preset từ token ✅ · PR [#14](https://github.com/votuandi/landing-page-full-page-ui/pull/14)
**Là** dev, **tôi muốn** Tailwind chỉ sinh class từ token, **để** không thể vô tình dùng màu cứng.
- **Chi tiết**: `packages/tokens/tailwind-preset.ts` thay hẳn `theme.colors`, thêm `borderRadius` (`card`, `pill`, `media`,
  `input`, `button`), `boxShadow` dựa `--c-shadow` + `--shadow-strength`, `backdropBlur.glass`, `transitionDuration.motion*`,
  `spacing.section`, `fontFamily.sans|display`. Mọi app/package dùng preset này (content glob gồm `packages/sections`, `packages/ui`).
- **AC**:
  - [x] `bg-white`, `text-slate-500`, `rounded-3xl` (nếu bị cấm) không sinh CSS.
  - [x] Class `/opacity` hoạt động với token (`bg-primary/20`).
- Phụ thuộc: S01 · Agent: Codex · Cỡ: S

### E2-S04 · `lint:tokens` — chặn hard-code ✅ · PR [#15](https://github.com/votuandi/landing-page-full-page-ui/pull/15)
**Là** chủ dự án, **tôi muốn** CI từ chối mọi màu/font/bo góc viết cứng, **để** section luôn trộn được giữa các theme.
- **Chi tiết**: ESLint rule tùy biến (`@solar/eslint-plugin/no-hardcoded-style`) kiểm chuỗi className và style object:
  cấm `#[0-9a-f]{3,8}`, `rgb(`/`hsl(` (trừ `rgb(var(--c-…))`), class arbitrary `bg-[`, `text-[`, `from-[`, `to-[`,
  `via-[`, `border-[`, `rounded-[`, `shadow-[`, `font-[`, và `fill`/`stroke` hex trong SVG. Allowlist theo đường dẫn
  (`packages/themes/**`, `packages/ui/brand-icons/**`) và theo comment `// token-exempt: <lý do>`.
- **Target**: 0 vi phạm ở `packages/sections`, `packages/ui`, `apps/*`.
- **AC**:
  - [x] Rule có test (ca đúng/ca sai).
  - [x] `pnpm lint:tokens` chạy trong CI; PR thêm `bg-[#0E7C3A]` bị fail với thông báo gợi ý token thay thế.
- Phụ thuộc: E1-S01 · Agent: Codex · Cỡ: M

### E2-S05 · Kiểm tra tương phản tự động ✅ · PR [#16](https://github.com/votuandi/landing-page-full-page-ui/pull/16)
**Là** khách hàng, **tôi muốn** chữ luôn đọc được dù đổi màu thương hiệu, **để** site không xấu và đạt tiêu chuẩn truy cập.
- **Chi tiết**: `check-contrast` duyệt các cặp bắt buộc (`fg*` trên `bg*`, `on-primary` trên `primary`, `on-accent`
  trên `accent`, `accent-ink` trên `bg`, `on-media` trên `scrim/60` …) cho light và dark. Dùng cả khi khách override màu
  trong CMS: báo lỗi và gợi ý màu gần nhất đạt chuẩn.
- **Target**: mọi theme gốc đạt WCAG AA cho chữ thường (4.5:1).
- **AC**:
  - [x] Chạy trong CI cho mọi theme.
  - [x] API `suggestAccessible(color, against)` trả màu đạt chuẩn, dùng ở E7-S08.
- Phụ thuộc: S01 · Agent: Codex · Cỡ: S

### E2-S06 · Font theo theme ✅ · PR [#17](https://github.com/votuandi/landing-page-full-page-ui/pull/17)
**Là** tenant, **tôi muốn** font đúng của theme mà site không tải font thừa, **để** trang nhanh.
- **Chi tiết**: registry font tự host trong `packages/themes/src/fonts.ts` (Inter, Be Vietnam Pro, Manrope,
  Plus Jakarta Sans, Montserrat); CSS và preload được chọn từ `theme.font` lúc render. Mỗi woff2 gộp latin + vietnamese.
  Không dùng `next/font` vì preload theo module import, không theo className; quyết định và công cụ dựng nằm trong plan E2-S06.
- **Target**: mỗi trang tải ≤ 2 họ font, ≤ 4 file woff2.
- **AC**:
  - [x] Trang tenant theme t11 chỉ preload Manrope + Be Vietnam Pro. Bằng chứng theo plan: fixture t11 kiểm đúng 4 file / 2 họ; e2e t15 kiểm cùng cơ chế preload (t11 chưa port).
  - [x] Font có subset `vietnamese`. Script kiểm cmap nguồn/woff2; unit test kiểm unicode-range; e2e kiểm chữ có dấu.
- Phụ thuộc: S02 · Agent: Claude · Cỡ: S

### E2-S07 · Theme t15 làm theme chuẩn + trang `/lab/themes` ✅ · PR [#18](https://github.com/votuandi/landing-page-full-page-ui/pull/18)
**Là** dev/designer, **tôi muốn** xem mọi token của một theme trên một trang, **để** kiểm nhanh theme mới.
- **Chi tiết**: `packages/themes/t15/theme.ts` đã có từ E2-S02; trang dev-only `/lab/themes/[id]`
  hiển thị bảng màu, typography, bo góc, kính, bóng, motion, và lưới tất cả section đã port với theme đó; bộ chọn theme để so sánh.
- **AC**:
  - [x] `apps/web` không còn khối `:root` màu cứng trong `globals.css`. Bằng chứng: tìm `:root`/`t15-radius` rỗng; 48/48 ảnh hồi quy qua.
  - [x] `/lab` bị chặn ở production (404) trừ khi `LAB_ENABLED=true`. Bằng chứng: `lab.spec.ts` 16/16 qua; cùng build bật env lúc start trả 200 cho `/lab/themes/t15` và `/lab/ui` (report `.agent-runs/E2-S07/codex-report.md`).
- Phụ thuộc: S02, S03 · Agent: Claude · Cỡ: M
