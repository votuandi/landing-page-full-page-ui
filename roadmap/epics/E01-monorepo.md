# E1 — Nền móng mono-repo

**Mục tiêu**: chuyển repo một-app (template-15) thành monorepo pnpm + Turborepo mà site vẫn chạy y nguyên.
**Target epic**: `pnpm turbo run typecheck lint test build` xanh; trang chủ t15 trong `apps/web` khớp ảnh chụp trước khi
refactor (sai khác pixel ≤ 0,5%); CI ≤ 8 phút với cache.
**Phụ thuộc**: không. **Chặn**: mọi epic khác.

---

### E1-S01 · Khởi tạo workspace pnpm + Turborepo
**Là** dev, **tôi muốn** một workspace với app và package tách bạch, **để** chia sẻ code giữa site công khai và admin.
- **Chi tiết**:
  - `pnpm-workspace.yaml` (`apps/*`, `packages/*`), `turbo.json` (task `build`, `dev`, `lint`, `typecheck`, `test`,
    `lint:tokens` với `dependsOn: ["^build"]` khi cần), `packageManager` cố định phiên bản pnpm.
  - `packages/config`: `tsconfig.base.json` (strict, `moduleResolution: bundler`), ESLint flat config dùng chung,
    Tailwind preset tạm (chuyển sang `packages/tokens` ở E2).
  - Xóa `yarn.lock`, `tsconfig.tsbuildinfo` khỏi git; `.gitignore` thêm `.turbo`.
  - Node 22 LTS (skills CLI và Next 16 yêu cầu ≥ 20.9; CI đang dùng 22) — ghi `.nvmrc`.
- **Target**: `pnpm install` sạch ≤ 60 s trên máy dev.
- **AC**:
  - [x] `pnpm install --frozen-lockfile` thành công trên Windows và Ubuntu (CI) —
    [CI run 37802956059](https://github.com/votuandi/landing-page-full-page-ui/actions/runs/37802956059) tại `d7e74ad`.
  - [x] `pnpm turbo run typecheck lint` chạy trên mọi package, lần 2 trúng cache (`FULL TURBO`).
  - [x] README gốc mô tả cấu trúc và lệnh mới.
- Agent: Codex · Cỡ: M

### E1-S02 · Di chuyển template-15 vào `apps/web`
**Là** dev, **tôi muốn** app hiện tại chạy trong `apps/web` không đổi hành vi, **để** có baseline cho mọi bước tách sau.
- **Chi tiết**: `git mv src public next.config.ts tailwind.config.ts postcss.config.mjs → apps/web/`; alias `@/*` giữ
  nguyên; script test `node:test` chạy trong `apps/web`. Chưa tách package.
- **Target**: 0 thay đổi giao diện.
- **AC**:
  - [x] `pnpm --filter web dev|build|test` chạy được; 2 bộ test (`solarCalculator`, `quoteCart`) qua.
    Kiểm local: 17 test qua, build 54 trang, smoke dev và wrapper root; lỗi trùng `/robots.txt` ở dev đã tái hiện trên baseline.
  - [x] Bộ ảnh chụp baseline (E1-S04) so khớp ≤ 0,5% trên 11 trang.
    Harness tạm E1-S02: 12 route × 2 viewport × light/dark = 48/48; sai khác lớn nhất 0,432%; artifact giữ local tại `.agent-runs/E1-S02/visual/`, E1-S04 dùng làm baseline và lưu bền (LFS/artifact CI).
  - [x] Lịch sử git của file giữ được (`git log --follow`).
    Commit `e142ad1`: 251 rename 100% + `tsconfig.json` 85%; `--follow` trên page/solarCalculator/quoteCart.test/favicon về tới commit gốc.
- Phụ thuộc: S01 · Agent: Codex · Cỡ: S
- PR: [#4](https://github.com/votuandi/landing-page-full-page-ui/pull/4)

### E1-S03 · Nâng Next.js 16
**Là** dev, **tôi muốn** dùng Next 16 (proxy.ts, Cache Components), **để** làm phân giải tenant và cache theo tag đúng cách.
- **Chi tiết**: chạy `npx @next/codemod@latest upgrade`; React 19.2; kiểm `next.config` (`images.remotePatterns`,
  redirects 308); dùng skill `next-dev-loop` + MCP `next-devtools` để quét lỗi. Chưa bật `cacheComponents` (E5-S06).
- **Target**: build không cảnh báo deprecation.
- **AC**:
  - [ ] `next build` thành công, không có route lỗi trong MCP `get_errors`.
  - [ ] Ảnh chụp baseline vẫn khớp; Lighthouse trang chủ không giảm quá 3 điểm.
  - [ ] Ghi kết quả vào `02-decisions.md` D2 (giữ hay hoãn).
- Phụ thuộc: S02, S04 · Agent: Claude (review: Codex) · Cỡ: M

### E1-S04 · Ảnh chụp hồi quy trực quan (baseline)
**Là** dev, **tôi muốn** bộ ảnh chụp tự động của site trước khi refactor, **để** phát hiện mọi thay đổi giao diện ngoài ý muốn.
- **Chi tiết**: `@playwright/test` trong `tooling/visual`; 11 route của t15 × 2 viewport (390, 1440) × light/dark;
  tắt animation (`prefers-reduced-motion`), che vùng động (marquee, đếm số). Lưu baseline trong git LFS hoặc artifact CI.
- **Target**: chạy ≤ 3 phút.
- **AC**:
  - [x] `pnpm visual:test` so sánh và xuất report HTML khi lệch.
    Local: 12 route × 4 cấu hình = 48 ảnh; 3 lượt liên tiếp 48/48 PASS (1,4 phút/lượt).
    Đổi tạm token nền light: 24 FAIL / 24 PASS, exit 1, HTML + diff; đã hoàn tác CSS.
  - [x] `pnpm visual:update` cập nhật baseline có chủ đích.
    Đã tạo đủ 48 ảnh Chromium; baseline tách win32/linux, ignored; CI cấu hình artifact 90 ngày.
  - [x] Chạy trong CI ở PR chạm `apps/web` hoặc `packages/{ui,sections,themes,tokens}`. (PR [#6](https://github.com/votuandi/landing-page-full-page-ui/pull/6): job [`compare`](https://github.com/votuandi/landing-page-full-page-ui/actions/runs/37893001051/job/113697905515) xanh, nhánh fallback, ~5 phút)
- Phụ thuộc: S02 · Agent: Codex · Cỡ: M

### E1-S05 · Tách `packages/core` (logic nghiệp vụ)
**Là** dev, **tôi muốn** logic tính toán/giá/SĐT/giỏ báo giá nằm ở package thuần TS, **để** section và API dùng chung, test độc lập.
- **Chi tiết**: chuyển `solarCalculator`, `price`, `phone`, `quoteCart`, `format`, `segment` (phần không phải React),
  `calculatorBus` → `packages/core`; test chuyển theo (giữ `node:test` hoặc chuyển vitest — chọn một, ghi ADR).
  Hệ số (`TARIFFS`, `VAT_RATE`, `PRICE_PER_KWP`, `PEAK_SUN_HOURS`) thành tham số hàm, không import config cứng.
- **Target**: độ phủ test `packages/core` ≥ 85% dòng.
- **AC**:
  - [ ] `packages/core` không phụ thuộc React/Next.
  - [ ] Hàm tính toán nhận `CalculatorParams` (sẽ đến từ schema section `calculator`).
  - [ ] `apps/web` import từ `@solar/core`, mọi test qua.
- Phụ thuộc: S02 · Agent: Codex · Cỡ: M

### E1-S06 · Tách `packages/ui` (primitive)
**Là** dev, **tôi muốn** primitive giao diện dùng chung, **để** section không tự viết lại nút, thẻ, dialog, carousel.
- **Chi tiết**: từ t15 `components/ui/*`, `DragScroll`, `SectionReveal`, `useSnapCarousel`, `useDialog`, `useCountUp`,
  `Media`, `VideoModal`, `BrandIcons`, `PriceTag` → `packages/ui`. Mỗi primitive có props tối thiểu, chỉ class token.
- **AC**:
  - [ ] Không còn bản sao primitive trong `apps/web`.
  - [ ] Mỗi primitive có ví dụ trong `/lab/ui` (route dev-only).
  - [ ] `lint:tokens` (tạm thời regex) không báo lỗi trong `packages/ui`.
- Phụ thuộc: S02 · Agent: Codex · Cỡ: M

### E1-S07 · CI cho monorepo
**Là** chủ dự án, **tôi muốn** CI chỉ chạy phần bị ảnh hưởng và có cache, **để** PR nhanh mà vẫn an toàn.
- **Chi tiết**: GitHub Actions: pnpm cache, `turbo run … --filter=...[origin/mono-repo-multi-tenent]`, job visual (S04),
  job `pr-meta` (E0-S05). Bỏ trigger theo branch template cũ cho workflow mới.
- **Target**: PR nhỏ ≤ 5 phút, PR toàn repo ≤ 12 phút.
- **AC**:
  - [ ] PR chỉ sửa `packages/core` không chạy build `apps/admin`.
  - [ ] Cache Turborepo (remote cache tùy chọn) hoạt động.
- Phụ thuộc: S01 · Agent: Codex · Cỡ: S
