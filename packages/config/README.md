# @solar/config

Cấu hình dùng chung, private và dùng trực tiếp từ source JSON/ESM; không có bước build hay dist.

- `@solar/config/tsconfig.base.json`: TypeScript strict, bundler. Consumer tự khai báo alias, plugin Next,
  include/exclude và đường dẫn output; cấu hình test CommonJS độc lập.
- `@solar/config/eslint`: base JS/ESM và `nextConfig(appDirectory)` tương đương `next/core-web-vitals` của
  ESLint 8. Factory phân giải plugin tại package config và đặt `settings.next.rootDir` theo consumer.
- `@solar/config/tailwind`: theme/plugins template-15, không có content glob. `theme.colors` thay toàn bộ màu
  Tailwind mặc định; giá trị token vẫn ở `src/app/globals.css`. Preset sẽ chuyển sang `packages/tokens` ở E2.

`pnpm --filter @solar/config typecheck` kiểm các file ESM bằng checkJs;
`pnpm --filter @solar/config lint` lint chính các file cấu hình.

`eslint-v8.d.ts` mô tả các API base/FlatCompat đang dùng vì hai package ESLint 8 này chưa có declaration.
Consumer Next được khai báo glob JS/JSX/TS/TSX rõ ràng để flat config vẫn lint toàn bộ source.

Dependency của package phục vụ tooling: `@eslint/js` cung cấp base rule, `@eslint/eslintrc` cung cấp FlatCompat,
`eslint-config-next` cung cấp rule Next. ESLint, TypeScript và Tailwind dùng cùng phiên bản resolved của app.
