# @solar/themes

Các theme đã kiểm tra bằng `parseTheme()` của `@solar/tokens`.
`t15/theme.ts` giữ màu light/dark và token của Fresh Energy (template-15).

```ts
import { t15 } from "@solar/themes";
import { themeToCss } from "@solar/tokens";

const css = themeToCss(t15);
```

App inline CSS của đúng theme vào `<head>`; package tokens không phụ thuộc themes.
Fixture t15 trong tokens giữ độc lập để kiểm tra dữ liệu chuẩn, tránh vòng phụ thuộc.
Font do app cấu hình; trang `/lab/themes` thuộc E2-S07.

Kiểm tra: `pnpm --filter @solar/themes typecheck`, `pnpm --filter @solar/themes lint`,
`pnpm --filter @solar/themes test`.
Test dùng TypeScript đã có để nạp các workspace package xuất source trên Node 20.
