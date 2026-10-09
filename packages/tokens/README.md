# @solar/tokens

Schema Zod `ThemeTokensSchema` và kiểu suy ra `ThemeTokens` mô tả màu, font,
bo góc, bóng, kính, motion, mật độ và metadata của một theme.

```ts
import { parseTheme, safeParseTheme, type ThemeTokens } from "@solar/tokens";

const theme: ThemeTokens = parseTheme(input);
const result = safeParseTheme(input);
if (!result.ok) {
  console.error(result.error.issues); // [{ path: "colors.light.primary", message: "…" }]
}
```

`input` là dữ liệu chưa kiểm tra (ví dụ JSON của theme). `parseTheme()` trả dữ liệu
đã kiểm tra hoặc ném `ThemeParseError`; lỗi chứa ID theme, đường dẫn trường và lý do.
`safeParseTheme()` trả `{ ok: true, theme }` hoặc `{ ok: false, error }` cho CMS.
Mọi object đều từ chối trường lạ; parser không ép kiểu, đổi giá trị hay điền mặc định.

- `colors.light` bắt buộc có đủ 35 khóa `COLOR_KEYS` dạng `"R G B"` (0–255)
  và 4 khóa `GLASS_COLOR_KEYS` dạng `rgba(R,G,B,A)` (alpha 0–1).
- `colors.dark` là tập ghi đè tùy chọn: token thiếu sẽ kế thừa light khi render.
  Parser giữ nguyên tập con này. `meta.supportsDark` phải đúng khi và chỉ khi có `dark`.
- `font.weights` chứa các số nguyên 100–900, bội 100, không trùng; nguồn là `google` hoặc `local`.
- `radius` dùng chuỗi `px` hoặc `rem`; `shadow.tint` tham chiếu một khóa RGB.
- Blur, reveal distance và container tính bằng px; duration tính bằng ms.
  `density.sectionY` là `sm`, `md` hoặc `lg`; `meta.group` là `classic`, `pro` hoặc `signature`.

Fixture `src/__tests__/fixtures/t15.ts` giữ token thật của Fresh Energy (t15), độc lập
với `packages/themes/t15/theme.ts`. Test đối chiếu fixture với theme và CSS sinh ra.

## Sinh CSS theo theme

```ts
import { themeToCss, type ThemeOverrides } from "@solar/tokens";

const overrides: ThemeOverrides = { colors: { light: { primary: "1 2 3" } } };
const css = themeToCss(theme, overrides);
// Inline trong <head> của layout server:
// <style dangerouslySetInnerHTML={{ __html: css }} />
```

`theme` phải được kiểm tra bằng `parseTheme()` trước khi truyền vào. Hàm luôn kiểm
tra `overrides` bằng `ThemeOverridesSchema`: chỉ cho ghi đè màu light/dark hợp lệ,
từ chối khóa lạ và chuỗi chèn CSS/HTML. `motion.easing` chứa `<`, `>`, `{`, `}`, `;`
cũng bị từ chối. Override light và dark độc lập, không tự suy dark từ light.

CSS có thứ tự màu ổn định theo `COLOR_KEYS` rồi `GLASS_COLOR_KEYS`: màu RGB dùng
`--c-<key>`, kính dùng `--<key>`. Khối `:root,[data-theme="light"]` chứa màu light
và các biến radius, shadow, glass blur, motion, reveal distance, container.
Blur/reveal distance bằng `0px` khi tắt. Font và `density.sectionY` chưa sinh ở đây.

Khi `meta.supportsDark` đúng, hàm thêm `[data-theme="dark"]` và media query
`prefers-color-scheme:dark` cho `:root:not([data-theme])`; lựa chọn `data-theme`
tường minh luôn thắng media query. Dark chỉ khai báo tập màu ghi đè, các màu còn
lại kế thừa light; dark rỗng vẫn có `color-scheme:dark`.

`apps/web` inline CSS t15 vào `<head>`, không thêm request CSS. Unit test kiểm
CSS t15 ≤ 4096 byte, override, dữ liệu sai và hai theme render xen kẽ không lẫn biến.

Dependency runtime `zod@4.6.5` (đã được AGENTS.md chấp thuận) dùng để kiểm tra dữ liệu
theme và suy ra một kiểu TypeScript duy nhất, tránh lệch giữa validation và kiểu dữ liệu.
Tailwind preset và cấu hình font thuộc các story sau.

Kiểm tra: `pnpm --filter @solar/tokens typecheck`, `pnpm --filter @solar/tokens lint`,
`pnpm --filter @solar/tokens test`.
