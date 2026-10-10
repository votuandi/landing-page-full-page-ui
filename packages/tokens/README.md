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
và các biến radius, shadow, glass blur, motion, reveal distance, container, section spacing.
Blur/reveal distance bằng `0px` khi tắt. `--section-y` ánh xạ `density.sectionY`:
`sm` → `64px`, `md` → `80px`, `lg` → `112px`. Font được gắn bởi cấu hình font của app.

Khi `meta.supportsDark` đúng, hàm thêm `[data-theme="dark"]` và media query
`prefers-color-scheme:dark` cho `:root:not([data-theme])`; lựa chọn `data-theme`
tường minh luôn thắng media query. Dark chỉ khai báo tập màu ghi đè, các màu còn
lại kế thừa light; dark rỗng vẫn có `color-scheme:dark`.

`apps/web` inline CSS t15 vào `<head>`, không thêm request CSS. Unit test kiểm
CSS t15 ≤ 4096 byte, override, dữ liệu sai và hai theme render xen kẽ không lẫn biến.

Dependency runtime `zod@4.6.5` (đã được AGENTS.md chấp thuận) dùng để kiểm tra dữ liệu
theme và suy ra một kiểu TypeScript duy nhất, tránh lệch giữa validation và kiểu dữ liệu.

## Tailwind preset

```ts
import preset from "@solar/tokens/tailwind";

export default {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}", "../../packages/sections/src/**/*.{ts,tsx}"],
};
```

Preset thay toàn bộ `theme.colors` bằng `COLOR_KEYS` và `GLASS_COLOR_KEYS` từ schema,
cộng `transparent`, `current`, `inherit`. Màu mặc định như `bg-white`, `text-slate-500`
không sinh CSS; màu RGB hỗ trợ opacity (`bg-primary/20`).

Utility token: `rounded-card|pill|media|input|button`, `shadow-sm|lg|xl|2xl`
(alpha nhân `--shadow-strength`), `backdrop-blur-glass`, `duration-motion-fast|base|slow`,
`py-section`, `font-sans`, `font-display`. Display fallback về sans khi chưa gắn
`--font-display`. Thang radius mặc định (kể cả `rounded-3xl`) vẫn giữ để tương thích
t15; việc đổi class sang token thuộc lúc port section.

`tailwindcss@3.4.19` và `postcss@8.5.8` chỉ là devDependencies cho type và test
biên dịch Tailwind thật; preset không import runtime Tailwind. Hằng màu nằm trong
`src/color-keys.ts` và được schema re-export, để jiti không phải nạp Zod.
Test dùng `tailwindcss/loadConfig` kiểm tra cấu hình TypeScript thật của web.

Kiểm tra: `pnpm --filter @solar/tokens typecheck`, `pnpm --filter @solar/tokens lint`,
`pnpm --filter @solar/tokens test`.

## Utility bổ sung cho t15 (E2-S04)

Mọi giá trị giữ đúng pixel cũ ở t15; radius lớn suy từ `--radius-media`, shadow
nhân alpha với `--shadow-strength`, glow đọc màu của theme và giữ nguyên alpha/stop.

| Utility | Giá trị ở t15 |
|---|---|
| rounded-screen / hero / dashboard (có thể dùng rounded-b-hero) | 36 / 40 / 44px: media + 4 / 8 / 12px |
| text-6xs / 5xs / 4xs / 3xs / 2xs | 8 / 9 / 10 / 10.5 / 11px |
| text-body-sm / body | 13 / 15px |
| text-display-xs / sm / md / lg / xl | 1.75 / 2 / 2.55 / 2.6 / 3.9rem |
| text-display-relative | 0.62em |
| border-5 / border-6 | 5 / 6px |

`shadow-card`, `card-hover`, `glass`, `float`, `dashboard`, `sun`, `hero`, `bottom-nav`,
`package`, `feature`, `certificate`, `video` giữ geometry cũ và dùng màu shadow,
primary hoặc accent tương ứng. `bg-glow-<màu>-<phần trăm>`: accent 18/22/25/30,
accent-soft 14/30, bg-tint 18, leaf 16/22, primary 14/25, sky 20; stop 65%, riêng
accent-soft-30 là 68%. `bg-sun-disc` giữ gradient mặt trời ở Hero.
Các class này thay thế arbitrary style; không dùng opacity riêng cho glow vì sẽ đổi pixel.

`colorChannelsToHex(channels)` đổi token RGB đã kiểm bằng `RgbChannels` sang hex
cho metadata (vd. viewport.themeColor); từ chối kênh sai hoặc ngoài 0–255.
App lấy token bg từ theme đang render, thay cho màu cứng trong cấu hình công ty.

## Kiểm tra tương phản

```ts
import { checkContrast, contrastRatio, suggestAccessible } from "@solar/tokens";

const issues = checkContrast(theme, { colors: { light: { "fg-subtle": "200 200 200" } } });
// [{ mode, fg, bg, scrimAlpha?, ratio, min, suggestion }]
const accessible = suggestAccessible("200 200 200", "255 255 255"); // "118 118 118"
const ratio = contrastRatio(accessible, "255 255 255"); // >= 4.5
```

`checkContrast()` nhận theme đã qua `parseTheme()`, kiểm tra override bằng
`ThemeOverridesSchema` và trả `[]` khi mọi cặp đạt WCAG AA cho chữ thường (4.5:1).
Light dùng màu theme + override light; dark kế thừa bộ light hiệu lực, rồi ghi đè
màu dark của theme và override dark. Chỉ kiểm dark khi `meta.supportsDark` đúng.
Không sửa dữ liệu đầu vào. `CONTRAST_PAIRS` gồm 21 cặp ở mỗi mode:

- `fg`, `fg-muted`, `fg-subtle` trên từng nền `bg`, `bg-elevated`, `bg-tint`, `bg-sky`, `bg-sun`.
- `on-primary`/`primary`, `on-secondary`/`secondary`, `on-accent`/`accent`.
- `accent-ink` trên `bg` và `bg-elevated`.
- `on-media` trên `scrim` alpha 0.6: ghép scrim lên trắng và đen, làm tròn kênh RGB,
  lấy tỷ lệ thấp hơn và gợi ý màu chữ trên nền ghép đó.

`contrastRatio()` dùng luminance sRGB WCAG 2.x, không làm tròn tỷ lệ khi so ngưỡng;
cả hai màu phải là chuỗi `"R G B"` hợp lệ. `suggestAccessible(color, against, min = 4.5)`
giữ nguyên màu đã đạt; nếu chưa đạt, tìm mức trộn nhỏ nhất về đen hoặc trắng,
kiểm tra cả sau khi làm tròn kênh và chọn hướng cần trộn ít hơn. Đây là màu gần nhất
theo mức trộn của hai hướng này. Nếu ngưỡng không thể đạt (vd. 22), trả đen hoặc
trắng có tương phản cao hơn; khi đó kết quả vẫn có thể dưới ngưỡng yêu cầu.

Test `@solar/themes` kiểm mọi theme export từ `src/index.ts`, chạy trong CI Workspace
qua `pnpm turbo run test`; theme mới tự được kiểm. E7-S08 sẽ dùng các API này để báo
lỗi và gợi ý màu cho override CMS. UI CMS, chữ lớn 3:1 và cặp ngoài danh sách thuộc
story khác. Với scrim, đây là phép kiểm hai nền trắng/đen theo quy ước, không đo ảnh thật.
