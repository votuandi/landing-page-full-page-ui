---
name: solar-section-variant
description: Port a homepage block from one of the template branches (minwy, template-2 … template-15) into packages/sections as a token-only section variant that shares its type's schema. Use when creating or editing anything under packages/sections, adding a new section type, or when a story says "port <Section> from template-NN".
---

# Port một section thành variant dùng chung

Mục tiêu: `packages/sections/<type>/<variant>.tsx` chạy đúng trong **mọi** theme và đọc dữ liệu từ schema chung của type.

## Quy trình

1. **Tìm nguồn.** Tra `roadmap/01-template-analysis.md` để biết file gốc, rồi đọc:
   `git show origin/template-NN:src/components/<File>.tsx`. Đọc cả data/config mà component dùng
   (`src/config/*`, `src/data/*`, `src/content/*`).
2. **Schema trước, UI sau.** Mở `packages/sections/<type>/schema.ts`.
   - Đã có: map dữ liệu của component gốc vào các trường sẵn có. Trường còn thiếu mà thật sự cần → thêm **tùy chọn**
     (`.optional()` + default), tăng `schemaVersion`, viết migration nếu đổi nghĩa trường cũ.
   - Chưa có: tạo schema (zod) + `defaults` + `meta` (`label`, `icon`, `entitlement`, `maxPerPage`). Văn bản hiển thị
     dùng kiểu `localized()` (`{ vi, en? }`); ảnh/video dùng `mediaRef()`; không nhúng URL tuyệt đối.
3. **Viết variant.** `export default function Hero_t08({ data, site }: SectionProps<"hero">)`.
   - Thay mọi màu cứng theo bảng ở `.agents/skills/solar-theme-port/token-map.md`. Không còn `#hex`, `rgb(`,
     `bg-[…]`, `text-[…]`, `rounded-[…]`, `shadow-[…]`, `bg-white`, `text-slate-*`.
   - Bo góc dùng `rounded-card` / `rounded-pill` / `rounded-media`; bóng dùng `shadow-sm|lg|xl|2xl`; thời gian
     animation dùng `duration-motion` / biến `--motion-*`.
   - Logic nghiệp vụ (tính toán, giá, SĐT, giỏ báo giá) import từ `packages/core`, không chép vào section.
   - Ảnh qua `<Media>` của `packages/ui` (tự xử lý storage driver + next/image).
   - Gửi lead qua `submitLead()` của `packages/leads/client`, truyền `source` ổn định (`calculator`, `story-cta`…).
   - Hiệu ứng reveal dùng `data-reveal` sẵn có; tôn trọng reduced motion.
4. **Đăng ký.** Thêm vào `packages/sections/registry.ts` (`type`, `variant`, `component` lazy, `thumbnail`, `themesTested`).
5. **Kiểm tra.**
   - `pnpm lint:tokens` (không vi phạm).
   - Fixture: `packages/sections/<type>/fixtures.ts` dùng chung cho mọi variant; render variant mới với fixture.
   - Mở `/lab/sections/<type>/<variant>?theme=t08,t12,t15` (apps/web, chỉ ở dev) và chụp ảnh qua MCP `playwright`
     với ít nhất 3 theme, cả light/dark nếu theme có dark. So sánh tương phản chữ (AA).
   - Đổi variant khác của cùng type trên cùng dữ liệu: không mất trường nào.
6. Ghi variant vào bảng trong `roadmap/01-template-analysis.md` (cột "Đã port").

## Lỗi hay gặp

- Gradient viết cứng `from-[#0d3b78]` → dùng `from-primary-deep to-primary` hoặc utility `bg-hero-gradient` của theme.
- Ảnh trang trí SVG có `fill="#…"` → đổi sang `fill="currentColor"` hoặc `rgb(var(--c-…))`.
- Chữ trên ảnh: dùng `text-on-media` + lớp `bg-scrim/…`, không dùng `text-white`.
- Dữ liệu cứng trong JSX (số liệu, danh sách) → đưa vào schema + defaults.
