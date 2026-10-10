# E3 — Thư viện section: schema, registry, variant

**Mục tiêu**: section là đơn vị sản phẩm. Mỗi type có một schema; mỗi variant là một cách vẽ schema đó; trang là danh sách
`{type, variant, enabled}` render qua registry.
**Target epic**: trang chủ t15 được render 100% từ một file cấu hình section (không còn `HomePage.tsx` viết tay); đổi
variant của bất kỳ section nào không mất dữ liệu; 28 type có schema.
**Phụ thuộc**: E1-S05, E1-S06, E2-S03.

---

### E3-S01 · Khung `defineSection` + registry ✅ · PR [#19](https://github.com/votuandi/landing-page-full-page-ui/pull/19)
**Là** dev, **tôi muốn** một API khai báo section thống nhất, **để** CMS, builder và renderer đều biết section có gì.
- **Chi tiết**:
  ```ts
  export const calculator = defineSectionType({
    type: "calculator", schemaVersion: 1,
    schema: z.object({...}), defaults: {...},
    meta: { label: { vi: "Máy tính chi phí" }, icon: "calculator", entitlement: "calculator", maxPerPage: 1,
            collections: [] /* hoặc ["projects"] nếu đọc collection */ },
  });
  export const variants = { t12: lazy(() => import("./t12")), t14: lazy(() => import("./t14")) };
  ```
  `registry.ts` gom mọi type; `getVariant(type, variant)` fallback về variant mặc định nếu variant không tồn tại (ghi log).
  Kiểu `SectionProps<"calculator">` = `{ data: z.infer<schema>, site: SiteContext, sectionId: string }`.
- **Target**: thêm một variant mới chỉ chạm ≤ 2 file (component + registry).
- **AC**:
  - [x] TS báo lỗi khi variant đọc trường không có trong schema.
  - [x] Unit test: registry trả fallback + cảnh báo khi variant không tồn tại.
  - [x] Variant là Server Component mặc định; phần tương tác tách thành client island import qua `next/dynamic` → JS của variant
        không dùng không xuất hiện trong trang. Kiểm bằng bundle analyzer + danh sách request mạng của trang có 1 variant/type.
- Agent: Claude · Cỡ: M

### E3-S02 · Kiểu dữ liệu nền: `localized`, `mediaRef`, `link`, `richText`, `collectionQuery` ✅ · PR [#20](https://github.com/votuandi/landing-page-full-page-ui/pull/20)
**Là** dev, **tôi muốn** các kiểu trường chuẩn, **để** schema mọi section nhất quán và CMS biết dùng widget nào.
- **Chi tiết**: `localized()` = `{ vi: string; en?: string }`; `mediaRef()` = `{ id, alt, focal? }`; `link()` =
  `{ kind: "page"|"url"|"anchor"|"phone"|"zalo"|"calculator", value, label }`; `richText()` (JSON an toàn, không HTML thô);
  `collectionQuery("projects")` = `{ filter, sort, limit, ids? }`. Mỗi kiểu khai báo `widget` cho form tự sinh (E7-S03).
- **AC**:
  - [x] `richText` render qua renderer whitelist (không `dangerouslySetInnerHTML` với dữ liệu khách).
  - [x] `link.kind = "calculator"` mở dự toán qua `calculatorBus` với tham số.
- Phụ thuộc: S01 · Agent: Claude · Cỡ: M

### E3-S03 · Renderer trang từ cấu hình ✅ · PR [#21](https://github.com/votuandi/landing-page-full-page-ui/pull/21)
**Là** tenant, **tôi muốn** trang chủ hiện đúng thứ tự section tôi chọn, **để** tôi kiểm soát bố cục.
- **Chi tiết**: `<PageRenderer page={…} site={…}/>` (Server Component) duyệt danh sách, bỏ section `enabled=false` hoặc
  không đủ entitlement (E6), lazy-load section dưới màn hình đầu, gắn `id` neo (`#du-toan`).
  *Chốt phạm vi (người dùng, 10/10/2026, review PR #21)*: lazy-load nghiệm thu ở mức island — variant là Server Component
  (không hydrate), island tách chunk async (E3-S01). Không bọc `Suspense`/`<Lazy>` theo section: island `next/dynamic`
  suspend khi SSR nên section bị stream vào `<div hidden>`, trái luật "nội dung hiện khi tắt JavaScript" (AGENTS.md).
  Widget toàn site render ở layout. Cô lập lỗi hai phía: phía server, renderer chuẩn bị dữ liệu từng section (parse schema,
  truy vấn collection) trong `try/catch` và render fallback nếu lỗi; phía client, mỗi section bọc error boundary.
- **Target**: TTFB không tăng > 10% so với `HomePage.tsx` viết tay — *chuyển nghiệm thu sang E4-S01* (người dùng chốt
  10/10/2026), khi trang t15 render qua renderer. Bằng chứng tạm ở story này: lab production, renderer +5% trung vị so với
  render tay cùng registry demo.
- **AC** (nghiệm thu với 2–3 section mẫu + fixture; khớp toàn bộ trang t15 thuộc E4-S01):
  - [x] Trang thử nghiệm render đúng thứ tự, bỏ section `enabled=false`.
  - [x] Inject lỗi khi lấy dữ liệu (server) và lỗi khi render (client) → section đó hiện fallback rỗng + log có `tenantId`,
        `sectionId`; các section khác vẫn hiện, HTTP 200.
- Phụ thuộc: S01 · Agent: Claude · Cỡ: M

### E3-S04 · Schema + variant đợt 1 (luồng chuyển đổi) ✅ · PR [#23](https://github.com/votuandi/landing-page-full-page-ui/pull/23)
**Là** chủ dự án, **tôi muốn** các section tạo lead có schema trước, **để** gói Nâng cao bán được sớm.
- **Chi tiết**: type `hero`, `calculator`, `lead-form`, `packages`, `segments`, `site-header`, `site-footer` — schema + variant
  t15 (nguồn: README t15 mục Trang chủ). `calculator` chứa `tariffs`, `vatRate`, `pricePerKwp`, `peakSunHours`,
  `segmentRatios`, `steps`, `ctaLabel` — đọc chung cho variant t12/t14/t15 (theo yêu cầu: giá điện, đơn giá/kWp, hệ số sản lượng).
- **Target**: 7 type, mỗi type có fixture + ít nhất 1 variant.
- **AC**:
  - [x] Mỗi type có `schema.ts`, `fixtures.ts`, `t15.tsx`, test parse fixture.
  - [x] Đổi giá điện trong dữ liệu section → kết quả dự toán thay đổi tương ứng (test `packages/core`).
  - [x] Không còn import `config/solar.ts` cứng từ section.
- Phụ thuộc: S01–S03 · Agent: Codex (review Claude) · Cỡ: L

### E3-S05 · Schema + variant đợt 2 (uy tín & nội dung) ✅ · PR [#25](https://github.com/votuandi/landing-page-full-page-ui/pull/25)
- **Chi tiết**: `projects`, `shorts`, `stats`, `energy-monitoring`, `process`, `testimonials`, `trust`, `brands`, `faq`,
  `blog`, `cta-banner` — variant t15. Section đọc collection dùng `collectionQuery` (dữ liệu thật đến từ E5; tạm thời
  adapter đọc `src/data/*.ts`).
- **Target**: 11 type.
- **AC**:
  - [x] 11 type có `schema.ts`, `fixtures.ts`, `t15.tsx`, variant trong registry và test parse fixture.
  - [x] Section không import cấu hình app (`config/*`, `@/`); giao diện chỉ dùng token.
  - [x] Section collection dùng `collectionQuery`; adapter tạm đọc `src/data/*.ts`, loader điền item qua `PageRenderer`.
  - [x] `faq` sinh JSON-LD `FAQPage` từ dữ liệu theo locale, escape an toàn và hỗ trợ `jsonLd: false`.
  - [x] `projects`/`shorts` có nút "Nhận báo giá công trình tương tự" → lead `source: "story-cta"` (e2e cả hai nguồn).
- Bằng chứng triển khai: `/lab/sections/t15-content`, `content.test.ts`, `tooling/visual/content.spec.ts`.
  Design pass và review Claude đang chờ theo mode split; PR được ghi sau khi Claude tạo.
- Phụ thuộc: S04 · Agent: Codex · Cỡ: L

### E3-S06 · Schema + variant đợt 3 (tính năng cao cấp)
- **Chi tiết**: `products` (+ quick view, thêm vào giỏ), `dealer`, `branch-map`, `press`, `tiktok`, `social`,
  `investment-models`, `warranty`, `about-story`, `services` — variant t15/t14.
- **Target**: đủ 28 type (bảng ở `01-template-analysis.md` §3).
- **AC**:
  - [x] 10 type có `schema.ts`, `fixtures.ts`, `t15.tsx`, variant trong registry và test parse fixture/defaults (như S04).
  - [x] Registry đủ 28 type theo bảng Target ở `01-template-analysis.md` §3.
  - [x] Không import `config/*`/`@/` từ section; giao diện chỉ dùng token (như S04).
  - [x] `meta.entitlement` đúng gói theo bảng §3 cho cả 28 type.
  - [x] `products` có quick view và thêm vào giỏ báo giá, dùng được không cần provider của app.
  - [x] Section collection dùng `collectionQuery` cho `products` và `branch-map`.
- Bằng chứng triển khai: `premium.test.ts` (fixture/defaults, 28 type, entitlement, loader, SSR),
  `conversion.test.ts` (quét import), `quoteCartStore.test.ts` (storage fallback/event),
  `sectionCollections.test.ts` (adapter), `tooling/visual/premium.spec.ts` và `/lab/sections/t15-premium`.
  Kiểm tra: typecheck/lint/test 23/23 tasks; lint:tokens 0 vi phạm; build web PASS; sections e2e 23/23 PASS.
  Log: `.agent-runs/E3-S06/{checks,tokens,build,visual}-resume.log`. Design pass Claude: `.agent-runs/E3-S06/design-pass.md`; review Claude vòng 1 APPROVE.
  PR [#26](https://github.com/votuandi/landing-page-full-page-ui/pull/26).
- Phụ thuộc: S04 · Agent: Codex · Cỡ: L

### E3-S07 · Widget toàn site
**Là** tenant, **tôi muốn** bật/tắt nút liên hệ nổi, popup tư vấn, thanh đáy mobile, giỏ báo giá, công tắc sáng/tối, **để** tùy theo gói và nhu cầu.
- **Chi tiết**: `packages/sections/widgets/*` với schema riêng (`contact-dock`, `consult-popup` có `delayMs`, `scrollRatio`,
  1 lần/phiên; `mobile-bottom-nav`; `commitments-strip`; `quote-cart`; `theme-switch`; `scroll-progress`).
- **AC**:
  - [ ] Cấu hình site có `widgets: { [key]: { enabled, variant, data } }`.
  - [ ] `quote-cart` chỉ hiện khi có entitlement `catalog`.
- Phụ thuộc: S03 · Agent: Codex · Cỡ: M

### E3-S08 · Trạng thái liên section (segment, calculator bus, quote cart)
**Là** khách truy cập, **tôi muốn** chọn phân khúc một lần mà video, gói, công trình, dự toán đều lọc theo, **để** không phải chọn lại.
- **Chi tiết**: giữ hành vi t15 (`lib/segment.tsx`, `?phan-khuc=`, `calculatorBus`) nhưng chuyển provider lên layout của
  site; section chỉ đăng ký/đọc qua hook `useSegment()`, `openCalculator()`. Nếu trang không có section `calculator`,
  `openCalculator` điều hướng tới trang có calculator hoặc mở dialog lead đơn giản.
- **AC**:
  - [ ] Bỏ section `segments` khỏi trang → các section khác vẫn chạy (segment mặc định).
  - [ ] Test e2e: chọn "Trang trại" ở lưới phân khúc → tab gói và dự toán đổi theo.
- Phụ thuộc: S04 · Agent: Claude · Cỡ: M

### E3-S09 · Migration dữ liệu section theo `schemaVersion`
**Là** dev, **tôi muốn** đổi schema mà dữ liệu cũ của khách vẫn chạy, **để** nâng cấp không phá site đang hoạt động.
- **Chi tiết**: mỗi type có `migrations: Record<number, (old) => new>`; đọc dữ liệu → chạy migration lười (lazy) và ghi lại
  khi lưu. Phần 1 (khung migration thuần JSON + test) làm ngay sau S01; phần 2 (script `pnpm sections:migrate --dry-run` chạy
  toàn DB, gồm `data`, `draftData`, `PageVersion`, file backup) làm sau E5-S01.
- **AC**:
  - [ ] Test: dữ liệu v1 → v2 đúng, idempotent; áp cho cả bản nháp và snapshot phiên bản.
  - [ ] CI fail nếu `schemaVersion` tăng mà thiếu migration.
  - [ ] App bản cũ đọc được dữ liệu đã migrate trong lúc rolling deploy (migration chỉ thêm trường tùy chọn — expand/contract).
- Phụ thuộc: phần 1 — S01; phần 2 — E5-S01 · Agent: Codex · Cỡ: M

### E3-S10 · Trang `/lab/sections` — ma trận variant × theme
**Là** designer/dev, **tôi muốn** thấy mọi variant với mọi theme, **để** kiểm "trộn module" trông liền mạch.
- **Chi tiết**: `/lab/sections/[type]?themes=t08,t12,t15&variant=…`; dùng fixture; chụp ảnh tự động ma trận
  (variant × 4 theme đại diện × 2 viewport) trong CI, so baseline.
- **Target**: mọi variant render ở ≥ 4 theme không lỗi tương phản; màu cứng bị chặn bởi `lint:tokens` (AST) — ma trận ảnh là lưới
  an toàn thứ hai: script đọc `getComputedStyle` của mọi phần tử, cảnh báo màu không thuộc bảng token của theme đang render.
- **AC**:
  - [ ] Script computed-style báo 0 màu ngoài token trên toàn ma trận.
  - [ ] Ma trận chạy ≤ 6 phút trong CI (song song).
  - [ ] Report HTML đánh dấu cặp variant–theme có tương phản < AA (dùng axe-core).
- Phụ thuộc: S03, E2-S07 · Agent: Codex · Cỡ: M
