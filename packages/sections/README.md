# @solar/sections

Khung khai báo type, variant, registry và kiểu trường chuẩn. Mỗi type có một zod schema chung; các variant nhận dữ liệu đã parse
(`z.output`), `SiteContext` và `sectionId`. Registry thật đang rỗng ở E3-S01; S04 đăng ký các type sản phẩm.

## Khai báo một type

Đặt definition ở `src/<type>/schema.ts`:

```ts
import { z } from "zod";
import { defineSectionType } from "../define";
import { localized } from "../fields";

export const hero = defineSectionType({
  type: "hero",
  schemaVersion: 1,
  schema: z.object({ title: localized() }),
  defaults: { title: { vi: "[DỮ LIỆU MẪU] Điện mặt trời" } },
  meta: { label: { vi: "Banner chính" }, icon: "image", maxPerPage: 1 },
});
```

`defaults` phải đủ các trường của output, kể cả trường có zod default. Nội dung hiển thị dùng `{ vi, en? }`.
Thay đổi schema phải tăng `schemaVersion` và kèm migration theo AGENTS.md. E3-S09 bổ sung khung migration.
`meta.entitlement` tạm là string tới E6.

## Kiểu trường chuẩn

Import từ `@solar/sections`. Kiểu TypeScript suy ra từ zod; `LocalizedText` giữ alias tương thích với S01.

| Hàm | Shape | Widget |
| --- | --- | --- |
| `localized({ multiline?, max? })` | `{ vi: string, en?: string }` | `localized` / `localizedTextarea` |
| `mediaRef()` | `{ id, alt: Localized, focal?: { x, y } }` | `media` |
| `link()` | `{ kind, value: string, label: Localized }` | `link` |
| `richText()` | `{ vi: Block[], en?: Block[] }` | `richText` |
| `collectionQuery("projects")` | `{ filter, sort?, limit, ids? }` | `collectionQuery` |

`fieldMeta(schema)` đọc `fieldRegistry` riêng, kể cả qua `.optional()`, `.default()`, `.nullable()` lồng nhau.
Metadata collection có thêm `{ collection: "projects" }`. Registry dùng API [Zod metadata](https://zod.dev/metadata),
không ghi `z.globalRegistry`. CMS đọc metadata ở E7-S03.

`localized` cho phép VI rỗng để dùng cho alt ảnh trang trí; từng section tự ràng buộc nội dung bắt buộc.
`pickLocale(value, locale)` lấy EN khi có nội dung, fallback VI khi EN thiếu/rỗng. `mediaRef.id` là id bản ghi Media;
focal nằm trong 0..1. S02 chưa resolve URL media hay kiểm tenant; E5 kiểm media/id collection cùng tenant.

`link.kind` hỗ trợ `page` (slug, rỗng = trang chủ), `url` (chỉ HTTP/HTTPS), `anchor` (id không có `#`),
`phone`/`zalo` (số VN được chuẩn hóa) và `calculator`. `resolveLink` trả `{ href, external, calculator? }`,
kiểm lại protocol URL lúc render và fallback `#` nếu sai. Calculator dùng query string, ví dụ
`phan-khuc=factory&hoa-don=15000000`; `calculatorBus` parse và serialize các trường đã biết, bỏ qua tham số sai.

`richText` chỉ nhận JSON: paragraph; heading cấp 2/3/4; list có `ordered` và `items`; inline text có `bold`/`italic`
hoặc link chứa các text node. Không đệ quy, tối đa 200 block/ngôn ngữ và 5000 ký tự/text node. Inline link dùng
schema `link()`; nội dung hiển thị từ `children`, không từ `link.label`.

```tsx
import { RichText, SectionLink } from "@solar/sections";

<RichText value={richTextData} locale={site.locale} />;
<SectionLink link={cta} locale={site.locale} className="text-primary" />;
```

Hai renderer là Server Component. `RichText` chỉ dựng element whitelist và React text node tự escape; node/heading
lạ bị bỏ qua. EN thiếu/rỗng fallback toàn tài liệu VI. ESLint và unit test chặn API HTML thô trong source sections.
Variant bọc typography/khoảng cách bằng token theo nhu cầu.

`SectionLink` render anchor với href dùng được khi tắt JavaScript; link ngoài có `target="_blank"`
và `rel="noopener noreferrer"`. Calculator dùng `CalculatorLink` client nhỏ: click thường/Enter gọi
`openCalculator(prefill)`, Ctrl/Meta/Shift/Alt hoặc nút chuột khác giữ hành vi trình duyệt.
Handler đặt riêng trong `fields/calculatorClick.ts` để client không import schema/Zod.
Primitive này import tĩnh vì chỉ có một handler dùng chung, không phải variant; không cần cặp `.client/.island`
và chunk async riêng như variant ở S01.

`collectionQuery` default `filter: {}`, `limit: 6` (1..48), `ids` tối đa 48 id không rỗng. Filter chỉ nhận
string/number/boolean; `sort` gồm field không rỗng và `dir: "asc" | "desc"`. E5 kiểm whitelist field và chạy query thật.

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
- `pnpm --filter @solar/sections test`: registry, parse trường, metadata, link/click calculator và renderer richText
  (escape, whitelist, locale, URL độc). Cấu hình test biên dịch dependency core cùng sections; preload test trỏ
  `@solar/core` tới bản JS thật vừa sinh vì Node 20 không chạy trực tiếp workspace export TypeScript.
- `pnpm --filter @solar/sections lint` và `pnpm lint:tokens`.
- `pnpm turbo run build --filter=web` rồi `pnpm --filter @solar/visual test:sections`: production SSR, counter island
  và danh sách response JS. Spec yêu cầu marker v1 có mặt, marker v2 vắng mặt; đính kèm danh sách request và ảnh lab.
  `/lab/fields` kiểm calculatorBus nhận prefill, click/Enter không reload, fallback href không JavaScript và
  richText độc chỉ hiện dạng chữ; ảnh trang được đính kèm vào report Playwright.

`/lab/sections` dùng registry demo riêng gồm hai type, mỗi type hai variant, không thêm vào registry sản phẩm.
Hai lab chỉ mở ở development hoặc production có `LAB_ENABLED=true`. `SiteContext` hiện có `tenantId`, `locale`,
`themeId`; E5 mở rộng ngữ cảnh tenant.
