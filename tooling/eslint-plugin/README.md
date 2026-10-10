# @solar/eslint-plugin

Cổng `lint:tokens` dùng ESLint AST cho JS/TS/JSX/TSX và matcher theo dòng cho CSS.
Rule `@solar/no-hardcoded-style` kiểm mọi chuỗi literal/template (className, cn/clsx,
map class, style object, SVG fill/stroke), bỏ qua nguồn import/export, directive,
thuộc tính href/id. Mỗi đoạn vi phạm báo một lỗi với gợi ý token bằng tiếng Việt.

```sh
pnpm lint:tokens
pnpm --filter @solar/eslint-plugin test
pnpm --filter @solar/eslint-plugin lint
solar-lint-tokens src  # mặc định: src; có thể truyền nhiều thư mục
```

Cấm hex 3/4/6/8 ký tự, rgb/rgba/hsl/hsla viết cứng, màu mặc định Tailwind và class
arbitrary bg/text/from/to/via/border/rounded/shadow/font/fill/stroke (kể cả radius
riêng từng cạnh). Hàm màu có tham số đầu `var(--…)` hợp lệ. Utility khác như
`z-[90]`, `leading-[1.2]`, `bg-primary/[.08]` vẫn hợp lệ; màu cứng bên trong vẫn bị bắt.

Allowlist: `packages/themes/**`, `**/brand-icons/**`. Comment thật
`token-exempt: <lý do không rỗng>` trên cùng dòng hoặc ngay phía trên node được miễn
(`//`, `/* */`, JSX comment; CSS dùng `/* */`). Không dùng miễn trừ cho style thông thường.
Bỏ qua node_modules, .next, dist, .test-dist. CLI chỉ bật rule token và không đọc
ESLint config của app hoặc các eslint-disable cho rule khác; dùng token-exempt có lý do.
Exit 1 khi có lỗi/vi phạm, exit 0 khi sạch; tổng kết `lint:tokens: N vi phạm`.

Package UI/app/sections mới phải thêm devDependency `@solar/eslint-plugin: workspace:*`
và script `lint:tokens: solar-lint-tokens src` để Turbo/CI kiểm package đó.
Không đưa rule vào nextConfig/editor trong E2-S04. Có thể import default plugin và
named export `tokensConfig` cho tích hợp sau.

ESLint 9.39.5 và @typescript-eslint/parser 8.71.1 là peer/dev dependencies đã có
trong workspace; parser cần thiết để đọc TSX thay vì scanner regex. Không thêm
dependency runtime vào app. Package chạy source .mjs trực tiếp, không có bước build.
