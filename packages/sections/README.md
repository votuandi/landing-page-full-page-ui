# @solar/sections

Khung khai báo type, variant, registry và kiểu trường chuẩn. Mỗi type có một zod schema chung; các variant nhận dữ liệu đã parse
(`z.output`), `SiteContext` và `sectionId`. Registry sản phẩm có đủ 28 type qua E3-S04–S06, xem mục "Type đã có".

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

`link.kind` hỗ trợ `page` (slug, rỗng = trang chủ, tùy chọn kèm query như `san-pham?category=panel`; không nhận `#`, khoảng trắng, `//`), `url` (chỉ HTTP/HTTPS), `anchor` (id không có `#`),
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

## Render trang

Trang là danh sách section đã parse bằng `pageConfigSchema`: `{ id, type, variant, enabled = true, anchor?, data }`.
`id` và `anchor` không được trùng; `anchor` (`[a-z0-9-]+`) thành `id` neo, ví dụ `#du-toan`.

```tsx
import { PageRenderer, pageConfigSchema } from "@solar/sections";

<PageRenderer page={pageConfigSchema.parse(raw)} site={site} canUse={(feature) => can(site, feature)} loadData={load} />;
```

`PageRenderer` là async Server Component, render theo thứ tự cấu hình:

- Bỏ section `enabled: false`, type không có trong registry, và section có `meta.entitlement` mà `canUse` trả `false`.
  Section bị bỏ vì quyền không gọi `load()` nên không tải chunk. `canUse` mặc định cho phép tới E6.
- Chuẩn bị song song cho mọi section: gọi `loadData` với `data` thô (E5 truy vấn collection), nạp module variant, rồi
  parse kết quả bằng schema của type — dữ liệu loader trả về sai schema cũng thành fallback. Lỗi ở bước này được log
  `console.error("[sections] chuẩn bị section lỗi", { tenantId, sectionId, type, variant, error })` và section đó
  thành wrapper rỗng có `data-section-fallback`.
- Mỗi section nằm trong `<div id={anchor} data-section-id data-section-type>` → `SectionBoundary` (error boundary
  client). Lỗi render ở client làm section rỗng và log `[sections] render section lỗi` với `tenantId`, `sectionId`; các
  section khác vẫn hiện, trang vẫn 200.
- Không bọc `Suspense` quanh section: island `next/dynamic` suspend khi SSR, nên Suspense sẽ stream section vào
  `<div hidden>` và nội dung mất khi tắt JavaScript. Lazy-load dưới màn hình đầu đến từ chunk async của island (S01).
  Hệ quả: lỗi khi render Server Component của variant trên server vẫn làm hỏng trang — đưa mọi việc có thể lỗi
  (I/O, parse) vào `loadData`, nơi renderer bắt lỗi.
- Wrapper giữ `id` neo nên variant không tự gắn `id` neo. Variant nên là component đồng bộ; dữ liệu và module đã chuẩn bị
  trước nên HTML server có đủ nội dung khi tắt JavaScript.

`/lab/renderer` dựng trang mẫu với registry demo: một section tắt, một lỗi `loadData`, một island ném lỗi khi hydrate.

## Tra cứu thủ công

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

## Type đã có (E3-S04)

| Type | Variant | Island | Entitlement |
| --- | --- | --- | --- |
| `site-header` | `t15` | mega menu, hotline, drawer mobile | — |
| `hero` | `t15` | đếm số liệu | — |
| `segments` | `t15` | không (thẻ là link `?phan-khuc=<slug>#<targetAnchor>`) | — |
| `packages` | `t15` | tab phân khúc, nút mở dự toán | `packages` |
| `calculator` | `t15` | ô nhập + kết quả + form lead | `calculator` |
| `lead-form` | `t15` | form lead | `leadForm` |
| `site-footer` | `t15` | không | — |

Mỗi type: `schema.ts` (export `<type>Schema` + definition, `defaults = schema.parse(fixture)`), `fixtures.ts`
(`[DỮ LIỆU MẪU]` của t15), `index.ts`, `t15.tsx`. Server variant chọn ngôn ngữ (`pickLocale`) và resolve link
(`toClientLink`) trước khi truyền xuống island, nên island không import zod.

- `calculator` giữ mọi hệ số dự toán trong dữ liệu section (`tariffs`, `vatRate`, `pricePerKwp`, `peakSunHours`,
  `segmentRatios`, `system`, `inputs`); `toCalculatorParams(data)` đổi sang `CalculatorParams` của `@solar/core`.
  `steps` là các ô nhập hiển thị theo thứ tự (`segment|bill|roof|province|ratio`). Danh sách tỉnh/vùng là dữ liệu địa lý
  ở core (`PROVINCES`, `REGION_LABELS`). Island nhận điền sẵn từ URL và `calculatorBus`.
- `packages.items[].monthlySaving` là số tenant nhập (fixture tính bằng `estimateSavingForKwp`); trống → ẩn.
- State phân khúc dùng chung giữa section là E3-S08; hiện `packages` đọc `?phan-khuc=` khi mở.
- `mediaSrc(ref)` tạm thời: `id` bắt đầu bằng `/` (không phải `//`) là ảnh tĩnh của app, còn lại vẽ placeholder;
  E5 thay bằng resolver media theo tenant.
- Header chưa có công tắc theme, giỏ báo giá, đổi ngôn ngữ (widget E3-S07 / i18n).

`/lab/sections/t15` render 7 type bằng `PageRenderer` + registry sản phẩm (`?lang=en` cho tiếng Anh). Trang lab vẫn
nằm trong `SiteShell` cũ nên có thêm header/footer cũ tới E4-S01.

## Collection và type nội dung (E3-S05)

11 type mới có schema, fixture và variant `t15`: `projects`, `shorts`, `stats`, `energy-monitoring`, `process`,
`testimonials`, `trust`, `brands`, `faq`, `blog`, `cta-banner`. Fixture đọc collection chỉ chứa `query`; `items`
mặc định rỗng và được loader điền. `projects`, `shorts`, `blog` không có item thì không render;
`testimonials` vẫn có thể render điểm đánh giá. Các entitlement khai báo trong metadata theo plan; E6 nối kiểm tra gói thật.

`collections/schemas.ts` chuẩn hóa `projectItem`, `storyItem`, `testimonialItem`, `postItem` và `storySource`.
Chuỗi collection đã chọn ngôn ngữ ở adapter; văn bản cấu hình section dùng `localized()`. Nguồn video chỉ nhận ID
YouTube/TikTok hợp lệ, đường dẫn file cùng origin không traversal, hoặc URL Bunny HTTPS. `storyEmbed` kiểm lại
nguồn trước khi dựng URL nhúng, dùng YouTube no-cookie và TikTok player; file/Bunny dùng `<video>`.

```tsx
import { PageRenderer, createCollectionLoader } from "@solar/sections";

<PageRenderer page={page} site={site} loadData={createCollectionLoader(source)} />;
```

`CollectionSource` nhận `site` ở mỗi lần gọi để E5 thay nguồn bằng repository tenant. Adapter mẫu
`apps/web/src/lib/sectionCollections.ts` đọc `src/data/*.ts`, thêm nhãn `[DỮ LIỆU MẪU]`, map `storyId` của project
thành nguồn video và tạo href chi tiết. Adapter hiện chỉ có dữ liệu VI; EN fallback VI tới khi E5 cung cấp nội dung dịch.
`applyCollectionQuery` giữ thứ tự `ids`, rồi filter so bằng, sort, limit; không sửa mảng nguồn. Thiếu source giữ nguyên
fixture; lỗi source truyền ra cho `PageRenderer` ghi log và cô lập section. Kết quả được schema kiểm trước khi render.

`faq` dùng `<details>` và sinh JSON-LD `FAQPage` từ chính câu hỏi/đáp theo `site.locale`, có thể tắt bằng `jsonLd: false`.
`serializeJsonLd` escape `<`, `>`, `&`, U+2028/U+2029, render bằng text child của `<script>`; không dùng HTML thô.
Projects và player shorts có link dự toán chứa `nguon=story-cta` và `#du-toan`, điền nhu cầu + phân khúc; form calculator
gửi lead với `source: "story-cta"`. Filter/player là state riêng mỗi section tới E3-S08.

Projects/shorts thông báo trạng thái trống theo VI/EN khi phân khúc được chọn không có item. Shorts nhận nhãn chip
từ `segmentLabels` như projects; schema v2 có default cho dữ liệu cũ và `shorts/migrations.ts` bổ sung nhãn khi chuyển
từ v1, giữ nguyên nội dung, query và items.

Stats hiển thị số cuối trong HTML server; sau hydrate mới đếm khi vào viewport và không đếm với reduced motion.
Trust có ảnh lớn trong dialog; thẻ vẫn đọc đủ thông tin khi tắt JavaScript. `process`, `testimonials`, `energy-monitoring`,
`faq`, `blog`, `cta-banner` là server-only; các type tương tác chỉ hydrate island.

`/lab/sections/t15-content` render 11 type + calculator qua registry và loader mẫu. `content.test.ts` kiểm fixture,
schema, query/loader, JSON-LD an toàn và href CTA. `tooling/visual/content.spec.ts` kiểm adapter mẫu, production SSR,
JSON-LD trong HTML, filter riêng từng section, player/phím/focus, hai nguồn CTA gửi lead, nội dung khi tắt JS.

`pnpm --filter web test` biên dịch adapter và workspace dependencies sang JS rồi chạy `node:test`, như các package.
`apps/web/src/lib/__tests__/sectionCollections.test.ts` kiểm đủ 6 collection, mapping video/link/media và loader
với ids/filter thật; test này cũng chạy bởi `pnpm test` / `pnpm turbo run test`. Unit sections kiểm SSR stats
(sinceYear, decimals, suffix, VI/EN), cả 11 type ở EN và các nhánh dữ liệu thiếu.

## Type đợt 3 — E3-S06

10 type mới có fixture mẫu và variant t15: products, dealer, branch-map, press, tiktok, social,
investment-models, warranty, about-story, services. Nội dung tenant dùng localized/richText/mediaRef/link;
variant server chọn locale trước khi truyền chuỗi vào island. Press, social, investment-models và warranty
không hydrate. Các type tương tác nạp island qua stub dynamic, giữ nội dung SSR khi tắt JavaScript.

Products dùng collectionQuery("products"), mặc định featured=true, tối đa 12 item, quick view (ảnh phụ,
thông số, bảo hành, focus trap/Escape) và nút thêm yêu cầu báo giá qua quoteCartStore của core.
Branch-map dùng collectionQuery("branches"), tọa độ lat 8–24/lng 102–118; Google Maps được dựng từ
tọa độ đã validate. Bản đồ giữ Hoàng Sa/Trường Sa; SSR hiện đủ địa chỉ và hotline của mọi chi nhánh.
Dealer có tab chính sách/hỏi đáp, gallery và form dùng provinces/isVnMobile từ core, POST /api/lead
với source="dealer". TikTok, services và about-story tái dùng StoryPlayer; video TikTok thiếu segment
không hiện CTA công trình tương tự.

Collection schemas mới: productItem (giá nguyên không âm, 1–8 ảnh, tối đa 12 thông số), branchItem,
geoPoint. Adapter web đọc data/products.ts và siteConfig.branches; loader vẫn nhận SiteContext.
Entitlement: products=catalog; dealer=dealer; branch-map=branchMap; press=press; tiktok=tiktok;
social=social; investment-models=investmentModels. Services, warranty và about-story là Cơ bản.
E6 bổ sung kiểm quyền theo gói thật; story này khai meta cho renderer.

Giỏ dùng QUOTE_CART_KEY từ core, event t15:quote-cart-change và t15:open-quote-cart.
Section tự thêm sản phẩm khi không có provider; provider/drawer cũ của web nghe cùng store.
Nội dung/default không mất khi đổi theme; variant t14 riêng nằm ngoài S06 theo plan.

Lab: /lab/sections/t15-premium (EN: ?lang=en). premium.test.ts kiểm 28 type và entitlement,
fixture, validation, loader, SSR/locale. premium.spec.ts kiểm production rendering, quick view,
giỏ đồng bộ với drawer, form đại lý (validation/success/error/retry), ghim bản đồ, video/tab
và nội dung/href khi tắt JavaScript.

## Lệnh kiểm tra

- `pnpm --filter @solar/sections typecheck`: gồm `@ts-expect-error` cho trường sai, loader sai type, default variant
  sai và defaults thiếu trường; các file `*.typecheck.ts` không chạy trong unit test.
- `pnpm --filter @solar/sections test`: type đợt 1 (fixture parse, dữ liệu sai bị chặn, đổi giá điện → dự toán đổi,
  không import cấu hình app), registry, parse trường, metadata, link/click calculator, renderer richText
  (escape, whitelist, locale, URL độc) và `PageRenderer` (thứ tự, bỏ section, entitlement, fallback + log). Cấu hình test biên dịch dependency core cùng sections; preload test trỏ
  `@solar/core` tới bản JS thật vừa sinh vì Node 20 không chạy trực tiếp workspace export TypeScript.
- `pnpm --filter @solar/sections lint` và `pnpm lint:tokens`.
- `pnpm turbo run build --filter=web` rồi `pnpm --filter @solar/visual test:sections`: production SSR, counter island
  và danh sách response JS. Spec yêu cầu marker v1 có mặt, marker v2 vắng mặt; đính kèm danh sách request và ảnh lab.
  `/lab/fields` kiểm calculatorBus nhận prefill, click/Enter không reload, fallback href không JavaScript và
  richText độc chỉ hiện dạng chữ; `/lab/sections/t15` (`conversion.spec.ts`) kiểm 7 section render, nhập tiền điện đổi kết quả, tab gói và nút gói mở
  dự toán, bản EN; `/lab/renderer` kiểm thứ tự, HTTP 200, fallback lỗi server/client và log
  client có `tenantId`, `sectionId`; ảnh trang được đính kèm vào report Playwright.

`/lab/sections` và `/lab/renderer` dùng registry demo riêng (demo-a, demo-b mỗi type hai variant, demo-crash), không
thêm vào registry sản phẩm. Các lab chỉ mở ở development hoặc production có `LAB_ENABLED=true`. `SiteContext` hiện có `tenantId`, `locale`,
`themeId`; E5 mở rộng ngữ cảnh tenant.


## Widget toàn site

`siteWidgetsSchema` đọc cấu hình `widgets: { [key]: { enabled, variant, data } }` gồm `contact-dock`,
`consult-popup`, `mobile-bottom-nav`, `commitments-strip`, `quote-cart`, `theme-switch`, `scroll-progress`.
Widget mặc định tắt; variant mặc định `t15`, variant lạ fallback; data thiếu dùng defaults của schema.
Bật đồng thời contact-dock `mobileBar` và mobile-bottom-nav bị từ chối.

Render `<SiteWidgets widgets={site.widgets} site={context} slot="inline" canUse={canUse} />` trước footer
(`commitments-strip`) và `slot="overlay"` cuối body (các widget còn lại). Renderer kiểm entitlement trước khi
load variant/collection; `quote-cart` yêu cầu `catalog`. E6 sẽ nối `canUse` với `can(site, feature)` ở server.
Dữ liệu lỗi bị bỏ riêng từng widget và log tenant; mọi widget được bọc SectionBoundary.

`createCollectionLoader(source, widgetRegistry)` nạp catalog cho giỏ (query limit mặc định 48).
Giỏ chia sẻ `@solar/core` store/event với products, lọc SKU theo catalog, gửi lead `source: "quote-cart"`
và chỉ xóa sau khi gửi thành công. Khi mở drawer, đọc dự toán gần nhất từ `@solar/core` (tối đa 30 ngày);
checkbox mặc định bật gửi kèm `segment` và `estimate`. Storage bị chặn hoặc dữ liệu sai/quá hạn thì bỏ phần này.
Schema quote-cart v2 thêm hai nhãn VI/EN; `migrateQuoteCartV1` bổ sung nhãn mà giữ nội dung cũ, dữ liệu v1 vẫn parse được.

Bus: `openConsult`/`onOpenConsult` dùng `t15:open-consult`; `toggleSiteMenu`/`onToggleSiteMenu` dùng
`t15:toggle-site-menu`. Header section nghe event menu. Popup mở theo thời gian hoặc ngưỡng cuộn,
tối đa một lần mỗi phiên, hoãn 5 giây nếu có modal khác; gọi thủ công luôn mở kèm form.
Theme-switch lưu `t15-theme`; layout app giữ script áp theme trước khi vẽ.

Lab: `/lab/sections/t15-widgets` (tất cả bật), `?plan=basic` (không catalog), `?lang=en`.
Widget cũ của SiteShell tạm tắt trên route này tới E4-S01. Kiểm tra: `widgets.test.tsx`,
`tooling/visual/widgets.spec.ts` trong `pnpm --filter @solar/visual test:sections`.

## State liên section

Đặt `<SiteStateProvider>` ở layout site, bao cả section và widget. `useSegment()` cung cấp phân khúc
(`null` = Tất cả), `version`, `source`, `setSegment` và `focusSegment`. Chọn ở lưới, tab gói, video,
công trình hoặc calculator đồng bộ ngay; URL `?phan-khuc=` được thay bằng `history.replaceState`, giữ
query khác và hash. Link lưới vẫn render ở server và hoạt động khi tắt JavaScript; click có phím bổ trợ
giữ hành vi trình duyệt. Thiếu anchor chỉ cập nhật state, không điều hướng.

`useOpenCalculator()` nhận `Segment` hoặc `CalculatorPrefill`: nếu có `#du-toan` dùng bus;
thiếu calculator thì `calculatorHref` mặc định/undefined điều hướng tới `/?…#du-toan`, đường dẫn
nội bộ như `/bang-gia` điều hướng tới trang đó với prefill, `null` hoặc đường dẫn không hợp lệ mở
`consult-popup`. Nhánh tư vấn yêu cầu widget consult-popup bật. E5-S04 sẽ truyền đường dẫn từ cấu hình site.

Thiếu provider, hook phân khúc dùng state cục bộ và đọc URL; calculator vẫn dùng bus/fallback trang chủ.
Lab `/lab/sections/*` có provider; `/lab/sections/t15?an=segments` hoặc `?an=calculator` kiểm các section vắng mặt.
Store quote cart của core giữ nguyên; dự toán lưu qua `saveLastEstimate`/`readLastEstimate`.
