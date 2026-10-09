# @solar/config

Cấu hình dùng chung, private và dùng trực tiếp từ source JSON/ESM; không có bước build hay dist.

- `@solar/config/tsconfig.base.json`: TypeScript strict, bundler. Consumer tự khai báo alias, plugin Next,
  include/exclude và đường dẫn output; cấu hình test CommonJS độc lập.
- `@solar/config/eslint`: base JS/ESM và `nextConfig(appDirectory)` dùng flat config gốc
  `eslint-config-next/core-web-vitals` (16.3.8); chạy bằng ESLint 9 và đặt `settings.next.rootDir` theo consumer.
  Next 16 không còn lint trong `next build` — lint chạy qua `pnpm lint`. Ba luật React Compiler mới của
  `react-hooks` v7 (`refs`, `set-state-in-effect`, `immutability`) đang để `warn` vì code cũ còn vi phạm (D2).
- `@solar/config/tailwind`: theme/plugins template-15, không có content glob. `theme.colors` thay toàn bộ màu
  Tailwind mặc định; giá trị token vẫn ở `src/app/globals.css`. Preset sẽ chuyển sang `packages/tokens` ở E2.

`pnpm --filter @solar/config typecheck` kiểm các file ESM bằng checkJs;
`pnpm --filter @solar/config lint` lint chính các file cấu hình.

`@eslint/js` 9 dùng declaration đi kèm package;
không cần shim kiểu của ESLint 8 trước đây.
Consumer Next được khai báo glob JS/JSX/TS/TSX rõ ràng để flat config vẫn lint toàn bộ source.

Dependency của package phục vụ tooling: `@eslint/js` cung cấp base rule, `eslint-config-next` cung cấp rule Next. ESLint, TypeScript và Tailwind dùng cùng phiên bản resolved của app.
