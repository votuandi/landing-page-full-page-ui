# @solar/sections

Khung khai báo type, variant và registry. Mỗi type có một zod schema chung; các variant nhận dữ liệu đã parse
(`z.output`), `SiteContext` và `sectionId`. Registry thật đang rỗng ở E3-S01; S04 đăng ký các type sản phẩm.

## Khai báo một type

Đặt definition ở `src/<type>/schema.ts`:

```ts
import { z } from "zod";
import { defineSectionType } from "../define";

export const hero = defineSectionType({
  type: "hero",
  schemaVersion: 1,
  schema: z.object({ title: z.object({ vi: z.string(), en: z.string().optional() }) }),
  defaults: { title: { vi: "[DỮ LIỆU MẪU] Điện mặt trời" } },
  meta: { label: { vi: "Banner chính" }, icon: "image", maxPerPage: 1 },
});
```

`defaults` phải đủ các trường của output, kể cả trường có zod default. Nội dung hiển thị dùng `{ vi, en? }`.
Thay đổi schema phải tăng `schemaVersion` và kèm migration theo AGENTS.md. E3-S02 bổ sung các kiểu trường chuẩn;
E3-S09 bổ sung khung migration. `meta.entitlement` tạm là string tới E6.

## Thêm variant thuần server: hai file

1. Tạo `src/hero/t15.tsx`, export default Server Component nhận `SectionPropsOf<typeof hero>` (import type từ
   `schema.ts`), hoặc `SectionProps<"hero">` khi type đã đăng ký trong registry.
2. Thêm loader vào `src/hero/index.ts`:

```ts
import { defineVariants } from "../define";
import { hero } from "./schema";

export const variants = defineVariants(hero, "t15", {
  t15: () => import("./t15"),
  t08: () => import("./t08"),
});
```

Khi thêm type mới, import nhóm variant vào `src/registry.ts` rồi thêm `{ hero: variants }` vào `createRegistry`.
Key phải trùng `def.type`; variant mặc định phải là key trong nhóm. TypeScript chặn loader nhận props của type khác.

Variant không đặt `"use client"`. Variant có tương tác thêm hai file: `<variant>.island.tsx` chứa code tương tác
và `<variant>.client.tsx` làm stub nạp island. Target ≤ 2 file áp dụng cho variant thuần server.

Next 16.3.8 chưa hỗ trợ automatic code splitting khi Server Component dùng `next/dynamic` để import Client
Component (tài liệu đi kèm Next: `dist/docs/01-app/02-guides/lazy-loading.md`). Gọi `dynamic` trong stub client
để island có chunk async riêng, chỉ tải khi stub được render. Stub có thể nằm trong chunk route nhưng không
chứa code hoặc marker của island. Giữ SSR mặc định, không dùng `ssr: false`, để nội dung hiện khi tắt JavaScript:

```tsx
// t15.island.tsx
"use client";
import { useState } from "react";

export default function Island() {
  const [count, setCount] = useState(0);
  return <button type="button" onClick={() => setCount((value) => value + 1)}>Số lần nhấn: {count}</button>;
}
```

```tsx
// t15.client.tsx
"use client";
import dynamic from "next/dynamic";
export default dynamic(() => import("./t15.island"));
```

Variant server import tĩnh stub, không import trực tiếp `.island`:

```tsx
// t15.tsx
import Island from "./t15.client";
// Render <Island /> trong Server Component của variant.
```

Section chỉ dùng class token; animation phải tôn trọng `prefers-reduced-motion`.

## Tra cứu và render

```tsx
const resolved = sectionRegistry.getVariant(type, variant);
const def = sectionRegistry.getType(type);
if (!resolved || !def) return null;
const { default: Variant } = await resolved.load();
return <Variant data={def.schema.parse(rawData)} site={site} sectionId={sectionId} />;
```

`getVariant` trả `{ type, variant, fallback, load }`; variant lạ fallback về mặc định và ghi một cảnh báo với
`{ type, variant, fallback }`. Type lạ trả `null` và cảnh báo. `getType` trả definition hoặc `undefined`.
Lookup bằng string trộn nhiều schema, nên renderer phải parse dữ liệu bằng definition tương ứng trước khi render.
`SectionPropsOf` và `defineVariants` giữ kiểm tra kiểu tại nơi khai báo variant.

## Kiểm tra

- `pnpm --filter @solar/sections typecheck`: gồm `@ts-expect-error` cho trường sai, loader sai type, default variant
  sai và defaults thiếu trường; các file `*.typecheck.ts` không chạy trong unit test.
- `pnpm --filter @solar/sections test`: lookup, fallback/log, key/type không trùng và parse defaults cho mọi type thật.
- `pnpm --filter @solar/sections lint` và `pnpm lint:tokens`.
- `pnpm turbo run build --filter=web` rồi `pnpm --filter @solar/visual test:sections`: production SSR, counter island
  và danh sách response JS. Spec yêu cầu marker v1 có mặt, marker v2 vắng mặt; đính kèm danh sách request và ảnh lab.

`/lab/sections` dùng registry demo riêng gồm hai type, mỗi type hai variant, không thêm vào registry sản phẩm.
Lab chỉ mở ở development hoặc production có `LAB_ENABLED=true`. `SiteContext` hiện có `tenantId`, `locale`,
`themeId`; E5 mở rộng ngữ cảnh tenant.
