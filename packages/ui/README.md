# @solar/ui

Primitive giao diện dùng chung, xuất source TypeScript qua `@solar/ui` (không có bước build riêng).
React, Next.js và Heroicons là peer dependency đã có trong app; logic giá và định dạng dùng `@solar/core`.

App sử dụng phải thêm `@solar/ui` vào `transpilePackages`, quét `packages/ui/src/**/*.{ts,tsx}` trong Tailwind
và dùng preset `@solar/tokens/tailwind`. Mỗi file client giữ `"use client"`; barrel không có directive.

Trong E1, app vẫn cung cấp CSS `.t15-eyebrow`, `.t15-heading`, `.t15-subheading`, `.t15-glass`,
`.t15-no-scrollbar` (cùng `.can-drag`/`.is-dragging`) và `[data-reveal]`/`[data-reveal-stagger]`/`--rd`
từ `apps/web/src/app/globals.css`. E2 sẽ chuyển các style này sang token/theme.

`CarouselNav` nhận `prevLabel`/`nextLabel`, `VideoModal` nhận `closeLabel`, mặc định tiếng Việt.
App truyền label đã dịch để hỗ trợ EN; package không phụ thuộc provider hay config của app.
`VideoSource` là kiểu union YouTube (`id`) hoặc file (`src`) do package xuất.

Ví dụ mọi primitive và hook nằm ở `/lab/ui`: chỉ mở trong dev hoặc production có `LAB_ENABLED=true` lúc build.
Route không được index, không có trong sitemap.

Kiểm tra: `pnpm --filter @solar/ui typecheck`, `lint`, `test`, `lint:tokens`.
`lint:tokens` là scanner regex tạm đến E2-S04; bỏ qua `brand-icons/` và dòng có comment
`token-exempt: <lý do>`. Không dùng exemption cho style của app thông thường.
