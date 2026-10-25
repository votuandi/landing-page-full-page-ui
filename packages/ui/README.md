# @solar/ui

Primitive giao diện dùng chung, xuất source TypeScript qua `@solar/ui` (không có bước build riêng).
React, Next.js và Heroicons là peer dependency đã có trong app; logic giá và định dạng dùng `@solar/core`.

App sử dụng phải thêm `@solar/ui` vào `transpilePackages`, quét `packages/ui/src/**/*.{ts,tsx}` trong Tailwind
và dùng preset `@solar/tokens/tailwind`. Mỗi file client giữ `"use client"`; barrel không có directive.

Trong E1, app vẫn cung cấp CSS `.t15-eyebrow`, `.t15-heading`, `.t15-subheading`, `.t15-glass`,
`.t15-no-scrollbar` (cùng `.can-drag`/`.is-dragging`) và `[data-reveal]`/`[data-reveal-stagger]`/`--rd`
từ `apps/web/src/app/globals.css`. E2 sẽ chuyển các style này sang token/theme.

`AdminShell` là server component dùng chung cho admin/console, chỉ đọc token của app. Props:
`brand: ReactNode`, `nav: AdminNavGroup[]`, `banners?: ReactNode`, `account?: ReactNode`, `children`.
Mỗi group có `label?` và `items: { href, label, current? }[]`. App lọc quyền/gói và xác định `current` trước khi truyền vào;
shell chỉ render link (`aria-current="page"`), không thay thế guard server. Sidebar cố định từ breakpoint `lg`,
mobile dùng `<details>`/`<summary>` "Menu" không cần JavaScript. Slot banner có region được đặt tên;
`main#noi-dung` nhận skip link từ root layout của app. App không bọc shell bằng một `<main>` khác.

`CarouselNav` nhận `prevLabel`/`nextLabel`, `VideoModal` nhận `closeLabel`, mặc định tiếng Việt.
App truyền label đã dịch để hỗ trợ EN; package không phụ thuộc provider hay config của app.
`VideoSource` là kiểu union YouTube (`id`) hoặc file (`src`) do package xuất.

Ví dụ mọi primitive và hook nằm ở `/lab/ui`: chỉ mở trong dev hoặc production có `LAB_ENABLED=true` lúc build.
Route không được index, không có trong sitemap.

`MediaImage` nhận `src?`, `alt`, `sizes`, `priority?`, `className?`, `focal?: { x, y }` (0–1),
`style?`, `quality?`; mặc định fill và lazy. Cha phải có kích thước và position relative. Thiếu src → placeholder token.
`Wordmark` và `ResponsiveImage` (cùng props ảnh Next, dùng cho logo kích thước cố định) đi chung đường render ảnh.

Ảnh upload do resolver server đổi UUID thành `encodeMediaUrl(publicUrlW1920Webp, [width640, width1280, width1920], focal?)`.
Codec `mediaUrl.ts` là nơi duy nhất định nghĩa fragment `#m=…&f=…`; fragment không gửi đến storage.
`parseMediaUrl` kiểm metadata rồi chọn biến thể nhỏ nhất đủ width, giới hạn ở ảnh lớn nhất có thật.
Primitive render `<picture>` AVIF + WebP bằng loader riêng qua
[`getImageProps`](https://nextjs.org/docs/app/api-reference/components/image#getimageprops), srcset có width thật và loại trùng.
Focal trong URL ưu tiên prop focal, truyền thành object-position. Ảnh tĩnh vẫn dùng Next optimizer;
ảnh HTTP(S) gốc của `MediaImage` dùng unoptimized. Không bật loader toàn cục.

Kiểm tra: `pnpm --filter @solar/ui test`, `typecheck`, `lint`, `lint:tokens`.
Test SSR primitive ở `@solar/sections` (tái dùng react-dom và runner sẵn có).
`lint:tokens` dùng ESLint rule AST của `@solar/eslint-plugin`; bỏ qua `brand-icons/` và comment thật
`token-exempt: <lý do không rỗng>` trên cùng dòng hoặc ngay phía trên. Test rule nằm trong package plugin. Không dùng exemption cho style của app thông thường.
