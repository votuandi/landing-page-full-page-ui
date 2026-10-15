# Kế hoạch refactor: Mono-repo · Multi-theme · Multi-tenant

> Branch gốc: `mono-repo-multi-tenent` (tách từ `template-15`, commit `9899660`). Ngày lập: 08/10/2026.
> Người đọc: chủ sản phẩm + các agent (Claude Code, Codex) thực thi story. Quy ước code: [`AGENTS.md`](../AGENTS.md).
> Cập nhật 15/10/2026: thêm hai CMS / hai realm tài khoản (D17–D19): story nâng cấp E5-S10, epic mới E15 (console super admin),
> E7 viết lại theo tài khoản riêng từng site.

## 1. Mục tiêu

Hiện tại mỗi khách = một bản copy của một branch template, sửa màu/nội dung bằng tay, deploy riêng.
Sau refactor: **một codebase phục vụ nhiều khách**. Khách mới = một bản ghi trong database, không phải một lần deploy.

| Chỉ số | Hiện tại | Đích |
|---|---|---|
| Thời gian dựng site cho khách mới | 1–3 ngày (fork branch, sửa code) | ≤ 30 phút (chọn preset, nhập nội dung, trỏ tên miền) |
| Số bản deploy cần bảo trì | 1 / khách | 1 cho mọi khách (VPS hoặc AWS) |
| Sửa lỗi một section | sửa trên từng branch | sửa 1 lần, mọi khách dùng variant đó nhận bản sửa |
| Khách đổi nội dung | nhờ dev | tự sửa trong CMS, trang cập nhật ≤ 60 giây (ISR revalidate) |
| Trộn module giữa template | không thể | chọn variant bất kỳ cho từng section, tự khoác theme |
| TTFB trang đã cache | — | ≤ 200 ms (p75), LCP ≤ 2,5 s trên 4G |

## 2. Bốn khái niệm

```
Theme   = design tokens (màu, font, bo góc, kính, bóng, motion)          packages/themes/t08
Section = type (schema dữ liệu chung) × variant (giao diện)             packages/sections/hero/t08.tsx
Preset  = theme + danh sách section sắp sẵn ("template" cũ)              packages/presets/t08.json
Site    = preset đã tùy biến + nội dung + tên miền + gói                 bảng Site trong Postgres
```
Một site = một tenant (D17); một `Customer` (công ty khách của nền tảng) có thể có nhiều site. Khách hàng cuối của site
có tài khoản vai trò `client`, chỉ dùng trên site công khai (D20).

Hai CMS, hai loại tài khoản không dùng chéo được (D17):

| | CMS site (`apps/admin`, E7) | Console nền tảng (`apps/console`, E15) |
|---|---|---|
| Địa chỉ | `<slug>.admin.<platform>` | `console.<platform>` |
| Tài khoản | `SiteUser` — email/SĐT unique **trong site**, site khác được trùng | `PlatformAdmin` — email unique toàn hệ thống, 2FA bắt buộc |
| Vai trò | `owner, admin, editor, staff, viewer` → permission. `client` **không** vào được CMS | super admin |
| Việc chính | dashboard site, trang/section, sản phẩm, dịch vụ, collection, media, lead, lịch hẹn, tài khoản nhân viên & client | customer, site, tài khoản site admin, gói, tính năng/permission theo site, cấu hình nền tảng, thống kê section/theme |
| Vào CMS còn lại | không | ghost login có lý do, 30 phút, audit (D18) |

Tài khoản `client` (E16) cũng nằm trong bảng `SiteUser` nhưng đăng nhập trên **tên miền công khai** của site (`/dang-nhap`):
giỏ hàng gắn tài khoản, đặt lịch dịch vụ, xem lịch sử. Không vào được CMS, không xem dashboard.

Cấu hình một site (lưu trong DB, kiểm bằng zod):
```json
{
  "theme": "t08",
  "themeOverrides": { "colors": { "primary": "21 128 61" }, "logo": "media:abc" },
  "pages": {
    "home": [
      { "id": "s1", "type": "hero",       "variant": "t08", "enabled": true },
      { "id": "s2", "type": "services",   "variant": "t08", "enabled": true },
      { "id": "s3", "type": "calculator", "variant": "t12", "enabled": true },
      { "id": "s4", "type": "lead-form",  "variant": "t12", "enabled": true },
      { "id": "s5", "type": "projects",   "variant": "t11", "enabled": true },
      { "id": "s6", "type": "footer",     "variant": "t08", "enabled": true }
    ]
  }
}
```
Nội dung của từng section nằm ở bảng `SectionContent` theo `(siteId, sectionId)` và theo schema của **type**,
nên đổi variant/theme không mất dữ liệu.

## 3. Kiến trúc đích

```
                 ┌───────────── Cloudflare for SaaS (tùy chọn) ──────────────┐
khách.vn ──DNS──▶│  hoặc Caddy on-demand TLS (VPS)  ── ask: /api/domains/allow │
                 └──────────────────────────────┬───────────────────────────┘
                                                ▼
         apps/web (Next.js)  proxy.ts: host → tenant (cache 60s) → rewrite /sites/[site]/...
           │  page = render(sections từ registry, theme CSS vars) — ISR, tag tenant:<id>
           │  /api/lead  → packages/leads (adapter theo tenant)
           ▼
   Postgres (Prisma, tenantId mọi bảng) ◀── apps/admin (<slug>.admin: CMS site, builder) ── lưu → revalidateTag(tenant:<id>…)
                                        ◀── apps/console (console.<platform>: super admin, role app_platform) ── ghost → apps/admin
   Redis (cache handler ISR dùng chung nhiều instance, rate-limit)
   Storage driver: local SSD | S3 | R2  (khóa tenants/<id>/…)  → CDN/Caddy file_server
```

Quyết định kiến trúc chính (chi tiết và lựa chọn bị loại: [`02-decisions.md`](02-decisions.md)):

| # | Quyết định |
|---|---|
| D1 | pnpm workspaces + Turborepo; hai app `web` (công khai) và `admin` (CMS) — tách để bundle site công khai nhẹ, bảo mật admin riêng |
| D2 | Nâng Next.js 15.4 → 16 ở E1 (proxy.ts, `cacheComponents`, `revalidateTag(tag, profile)`, `updateTag`) |
| D3 | Postgres + Prisma (đã dùng ở branch `develop`), một schema dùng chung, cột `tenantId` + repository bắt buộc tenant; RLS Postgres là lớp bảo vệ thứ hai (E5) |
| D4 | Token: CSS variables dạng kênh `R G B` + Tailwind preset **thay hẳn** bảng màu mặc định (cách template-15 đang làm) |
| D5 | Schema section bằng zod; form CMS sinh tự động từ schema |
| D6 | Media qua interface `StorageDriver` (local / S3 / R2 — R2 dùng chung driver S3 với endpoint riêng) |
| D7 | Tên miền: Caddy on-demand TLS trên VPS; Cloudflare for SaaS khi chạy AWS hoặc khi cần WAF/CDN. Khách đứng tên tên miền |
| D8 | Gói dịch vụ → entitlements kiểm tra phía server; bảng giá bán hàng sinh từ cùng một file `packages/plans` |
| D9 | Email theo tên miền: không tự host; tích hợp hướng dẫn + kiểm tra DNS cho Zoho Mail / Google Workspace (affiliate) |
| D10 | Builder gói Premium: kéo-thả **section** (không phải pixel), preview trực tiếp; spike Puck vs dnd-kit ở E12 |
| D17 | Hai CMS (`admin` cho site, `console` cho nền tảng), hai bảng tài khoản `SiteUser` (unique theo tenant) / `PlatformAdmin`, phiên và cookie riêng; tenant lấy từ host trước khi đăng nhập |
| D18 | Ghost login: grant 1 lần từ console → phiên ghost 30 phút ở admin, có lý do, banner, audit, chặn thao tác bảo mật tài khoản |
| D19 | Tính năng hiệu lực = kill switch nền tảng → override của tenant → gói/addons; permission tenant chỉ hạ quyền |
| D20 | Vai trò `client` cho khách hàng cuối: cùng bảng `SiteUser`, phiên `storefront` trên site công khai chỉ có quyền `storefront.*`; trang cache không bao giờ đọc cookie |
| D21 | Tạo site từ console: subdomain → gói → theme → cấu trúc trang → section; gói Cơ bản chỉ chọn theme; `<slug>.<platform>` là địa chỉ đầu tiên, tên miền thật thành chính khi `active`; admin `<slug>_admin` mật khẩu tạm bắt buộc đổi |

## 4. Gói dịch vụ ↔ code

<!-- plans:table:start -->
|  | **Cơ bản** | **Nâng cao** | **Cao cấp** |
|---|---|---|---|
| Nhóm theme | Classic (minwy, t02–t04) | Classic (minwy, t02–t04), Pro (t05–t11) | Classic (minwy, t02–t04), Pro (t05–t11), Signature (t12–t15) |
| Form liên hệ/tư vấn (`leadForm`) | Có | Có | Có |
| Tin tức (`blog`) | Có | Có | Có |
| Tên miền riêng + SSL (`customDomain`) | Có | Có | Có |
| Máy tính chi phí (`calculator`) | — | Có | Có |
| Form nhận báo giá (`quoteForm`) | — | Có | Có |
| Gói giải pháp (`packages`) | — | Có | Có |
| Câu hỏi thường gặp (`faq`) | — | Có | Có |
| Đánh giá khách hàng (`testimonials`) | — | Có | Có |
| Số liệu (`stats`) | — | Có | Có |
| Giám sát năng lượng / biểu đồ phụ tải (`energyMonitoring`) | — | Có | Có |
| Mô hình đầu tư (`investmentModels`) | — | Có | Có |
| Chứng nhận / uy tín (`trust`) | — | Có | Có |
| Mạng xã hội (`social`) | — | Có | Có |
| Lead Webhook / Google Sheets (`leadWebhook`) | — | Có | Có |
| Hộp thư lead (`leadInbox`) | — | Có | Có |
| Sắp xếp section (`sectionReorder`) | — | Có | Có |
| Đổi variant (`variantSwitch`) | — | Có | Có |
| Video Shorts (`shorts`) | — | — | Có |
| TikTok (`tiktok`) | — | — | Có |
| Danh mục sản phẩm (`catalog`) | — | — | Có |
| Giỏ báo giá (`quoteCart`) | — | — | Có |
| Đại lý (`dealer`) | — | — | Có |
| Bản đồ chi nhánh (`branchMap`) | — | — | Có |
| Báo chí (`press`) | — | — | Có |
| Song ngữ VI/EN (`bilingual`) | — | — | Có |
| Xuất lead (`leadExport`) | — | — | Có |
| Override màu/font (`themeOverride`) | — | — | Có |
| Builder kéo-thả (`builder`) | — | — | Có |
| Trang landing (`landingPages`) | — | — | Có |
| A/B CTA (`abTest`) | — | — | Có |
| Số tên miền | 1 | 1 | 3 |
| Media (GB) | 1 | 5 | 20 |
| Số trang do khách tạo | 1 | 3 | 20 |
| Số người dùng | 1 | 3 | 10 |
<!-- plans:table:end -->

Mức tùy biến khi tạo site và trong CMS (chọn theme / cấu trúc trang / section) theo gói: xem D21 §1.
Bảng quyền sinh từ `packages/plans/plans.ts` bằng `pnpm plans:table`; CI kiểm bằng `pnpm plans:table --check`.
Feature mô tả quyền sản phẩm, không xác nhận tính năng tương lai đã được triển khai. Nội dung chung gồm hero,
giới thiệu, dịch vụ, dự án, liên hệ và footer. Limits áp dụng theo tenant; pages tính home + landing do khách tạo,
không tính trang hệ thống hoặc từng trang chi tiết sản phẩm/tin tức.

Dịch vụ lead Email/Telegram là mô tả kênh dịch vụ, không phải entitlement section mới. Webhook/Google Sheets,
hộp thư và xuất lead có feature riêng trong bảng; phân bổ/API/video hosting sẽ cập nhật contract khi triển khai.
Email tên miền: Cơ bản hướng dẫn tự cài; Nâng cao cài hộ (phí cài đặt); Cao cấp cài hộ + quản lý
(hoa hồng Zoho/Google). Đây là dịch vụ cài đặt, không thêm feature flag trong E6-S01.

## 5. Lộ trình

| Giai đoạn | Epic | Kết quả có thể demo | Thời lượng (ước) |
|---|---|---|---|
| **P0 — Nền móng** | E0, E1, E2 | Monorepo build xanh, template-15 chạy trong `apps/web` qua theme t15 | 2 tuần |
| **P1 — Thư viện section** | E3, E4 (đợt 1: t12–t15) | `/lab` hiển thị mọi section của 4 template Signature × 4 theme | 3 tuần |
| **P2 — Multi-tenant MVP** | E5, E6, E8, E10 (VPS) | 2 site demo khác tên miền chạy trên 1 VPS, nội dung từ DB, ISR | 3 tuần |
| **P3 — CMS** | E5-S10, E15-S01…S04, E15-S07, E7, E11 | Hai CMS: khách tự sửa nội dung, quản lý nhân viên, nhận lead; super admin tạo site, cấp tài khoản, ghost hỗ trợ; trang cập nhật ≤ 60 s | 4 tuần |
| **P4 — Tên miền & bán hàng** | E9, E13, E15-S05, E15-S06, E15-S08 | Khách trỏ tên miền riêng, SSL tự động; tạo site mới từ preset ≤ 30 phút | 2 tuần |
| **P4b — Khách hàng cuối** | E16 | Khách của khách đăng ký/đăng nhập trên site, giỏ gắn tài khoản, đặt lịch dịch vụ; site admin quản lý client & lịch hẹn | 2 tuần (song song P5) |
| **P5 — Phủ template** | E4 (đợt 2–3: t05–t11, Classic) | Đủ 15 preset | 3 tuần (song song P3–P4) |
| **P6 — Cao cấp & AWS** | E12, E10 (AWS), E14 | Builder kéo-thả; bản deploy AWS; kiểm thử tải/bảo mật | 4 tuần |

Đường găng: E1 → E2 → E3 → E5 (S10) → E15-S01 → E7. E4 (port template) chạy song song bằng Codex sau khi E3-S01…S03 xong.

## 6. Danh sách epic

| ID | Epic | File |
|---|---|---|
| E0 | Môi trường làm việc AI (Claude Code + Codex) | [epics/E00-ai-workflow.md](epics/E00-ai-workflow.md) |
| E1 | Nền móng mono-repo | [epics/E01-monorepo.md](epics/E01-monorepo.md) |
| E2 | Design tokens & theme engine | [epics/E02-tokens-themes.md](epics/E02-tokens-themes.md) |
| E3 | Thư viện section: schema, registry, variant | [epics/E03-sections.md](epics/E03-sections.md) |
| E4 | Port 15 template thành theme + variant + preset | [epics/E04-template-port.md](epics/E04-template-port.md) |
| E5 | Lõi multi-tenant: dữ liệu, phân giải tên miền, render, ISR | [epics/E05-multi-tenant-core.md](epics/E05-multi-tenant-core.md) |
| E6 | Gói dịch vụ & cờ tính năng | [epics/E06-plans-entitlements.md](epics/E06-plans-entitlements.md) |
| E7 | CMS quản trị nội dung | [epics/E07-cms.md](epics/E07-cms.md) |
| E8 | Lưu trữ media: local / S3 / R2 | [epics/E08-media-storage.md](epics/E08-media-storage.md) |
| E9 | Tên miền riêng & SSL | [epics/E09-domains-ssl.md](epics/E09-domains-ssl.md) |
| E10 | Triển khai VPS & AWS, vận hành | [epics/E10-deploy-ops.md](epics/E10-deploy-ops.md) |
| E11 | Lead, tích hợp & email theo tên miền | [epics/E11-leads-integrations.md](epics/E11-leads-integrations.md) |
| E12 | Builder kéo-thả (gói Cao cấp) | [epics/E12-builder.md](epics/E12-builder.md) |
| E13 | Khởi tạo site & quy trình bán hàng | [epics/E13-onboarding-sales.md](epics/E13-onboarding-sales.md) |
| E14 | Chất lượng: test, bảo mật, hiệu năng, SEO | [epics/E14-quality.md](epics/E14-quality.md) |
| E15 | Console nền tảng cho super admin | [epics/E15-platform-console.md](epics/E15-platform-console.md) |
| E16 | Tài khoản client & đặt lịch dịch vụ trên site công khai | [epics/E16-client-accounts.md](epics/E16-client-accounts.md) |

Mỗi story có: **ID**, câu chuyện người dùng, **Chi tiết**, **Target** (đo được), **AC** (tiêu chí nghiệm thu),
phụ thuộc, agent đề xuất, cỡ (S ≤ 1 ngày, M 2–3 ngày, L 4–5 ngày).

## 7. Rủi ro chính

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Template cũ (t03–t09) hard-code 100–155 màu/branch | Port chậm, lệch tông | Port t12–t15 trước (đã token hóa); t03–t09 chỉ lấy section có giá trị, còn lại gộp vào variant gần nhất (E4) |
| ISR nhiều instance không dùng chung cache | Khách sửa nội dung nhưng instance khác vẫn trả bản cũ | Cache handler Redis dùng chung từ ngày đầu (E10-S03) |
| Rò dữ liệu giữa tenant | Nghiêm trọng (pháp lý, uy tín) | Repository bắt buộc tenantId + RLS + test cô lập tự động (E14-S03) |
| Caddy on-demand TLS bị lạm dụng | Bị rate-limit Let's Encrypt | Endpoint `ask` chỉ cho tên miền đã xác minh trong DB (E9-S02) |
| Nâng Next 16 làm vỡ template-15 | Chậm P0 | Nâng ở E1-S03 với test hồi quy trực quan trước/sau |
| Builder phình phạm vi | Trễ P6 | Builder chỉ thao tác trên section/variant/props có sẵn; không tự do pixel |
| CSP nonce buộc render động, mất ISR | TTFB tăng mạnh | CSP tĩnh + hash cho `apps/web` (D13) |
| Webhook/URL do khách nhập bị lợi dụng SSRF | Lộ mạng nội bộ, metadata cloud | Chặn IP nội bộ, kiểm lại IP lúc kết nối (E11-S02) |
| Mất lead / mất lệnh revalidate khi crash | Mất khách, site cũ | Transactional outbox + worker idempotent (D14, E11-S01) |
| Lộ tài khoản super admin / lạm dụng ghost | Truy cập mọi site | Console tách app + 2FA bắt buộc + IP allowlist tùy chọn; ghost cần lý do, nhập lại TOTP, 30 phút, audit, owner thấy được (D18) |
| Trang cache chứa dữ liệu cá nhân của client | Lộ thông tin khách giữa người xem | Trang cache không đọc cookie; phần cá nhân là island `no-store` hoặc trang động (D20, E16-S01) |
| Tài khoản trùng tên ở nhiều site bị lẫn | Đăng nhập nhầm site, rò dữ liệu | Tenant lấy từ host trước khi tìm user, cookie host-only, RLS cho `SiteUser` (D17, E5-S09, E14-S03) |

> Kế hoạch đã được Codex review chéo (adversarial) ngày 08/10/2026; 25 góp ý (4 P0) đã được đưa vào các epic E2–E14 và ADR D3, D7, D13, D14.
