---
name: solar-theme-port
description: Turn a template branch's visual identity (colors, fonts, radius, glass, shadows, motion) into a theme token set under packages/themes, and map its hard-coded colors to semantic tokens. Use when creating or editing a theme, auditing hard-coded colors in a template, or when a story says "theme tNN".
---

# Chuyển một template thành theme

Theme chỉ là dữ liệu: `packages/themes/tNN/theme.ts` thỏa `ThemeTokens` của `packages/tokens`. Không chứa component.

## Quy trình

1. **Thu thập nhận diện** của branch:
   ```bash
   git show origin/template-NN:src/app/globals.css          # CSS variables, keyframes, lớp t5-/t8-
   git show origin/template-NN:tailwind.config.ts
   git show origin/template-NN:src/app/layout.tsx           # font (next/font/google hoặc localFont)
   git grep -ohE '#[0-9a-fA-F]{6}\b' origin/template-NN -- 'src/**/*.tsx' | sort | uniq -c | sort -rn
   git grep -ohE 'rounded-\[[^]]+\]|rounded-(2xl|3xl|full)|backdrop-blur[-a-z]*' origin/template-NN -- 'src/**/*.tsx' | sort | uniq -c | sort -rn
   ```
2. **Gom màu** thành vai trò ngữ nghĩa theo `token-map.md` (cùng thư mục). Mỗi hex phải thuộc đúng một token;
   hex chỉ xuất hiện 1–2 lần thường là biến thể alpha của token khác → dùng `token/opacity`.
3. **Điền `theme.ts`**: `colors` (light, và `dark` nếu template có), `font` (sans, display, độ đậm đã tải),
   `radius` (`card`, `pill`, `media`, `input`), `glass` (`bg`, `border`, `blur`), `shadow` (`tint`, `strength`),
   `motion` (`durationBase`, `easing`, `revealDistance`), `density` (`sectionY`, `container`).
4. **Tương phản**: chạy `pnpm --filter @solar/tokens check-contrast tNN` — mọi cặp `fg/*` trên `bg/*`, `on-*` trên
   màu tương ứng phải ≥ 4.5:1 (chữ thường) hoặc ≥ 3:1 (chữ ≥ 24px). Sửa token, không sửa component.
5. **Font**: dùng `next/font`; theme khai báo tên font, `apps/web` nạp đúng font của theme đang render
   (không nạp font của theme khác).
6. **Preset**: tạo `packages/presets/tNN.json` = theme + danh sách section/variant theo đúng thứ tự trang chủ gốc
   (xem `roadmap/01-template-analysis.md`).
7. **Kiểm tra trực quan**: `/lab/themes/tNN` hiển thị toàn bộ section đã port bằng theme này; chụp so sánh với
   branch gốc (chạy branch gốc trong worktree riêng) ở 390px và 1440px.

## Quy tắc

- Theme không được thêm token mới ngoài schema `ThemeTokens`. Cần token mới → sửa `packages/tokens` (cập nhật mọi theme
  với giá trị mặc định) trong một PR riêng.
- Giá trị RGB lưu dạng kênh `"R G B"` để Tailwind hỗ trợ `/opacity`.
