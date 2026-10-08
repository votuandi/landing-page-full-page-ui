# Kế hoạch refactor: Mono-repo · Multi-theme · Multi-tenant

> Branch gốc: `mono-repo-multi-tenent` (tách từ `template-15`, commit `9899660`). Ngày lập: 08/10/2026.
> Người đọc: chủ sản phẩm + các agent (Claude Code, Codex) thực thi story. Quy ước code: [`AGENTS.md`](../AGENTS.md).

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
   Postgres (Prisma, tenantId mọi bảng) ◀── apps/admin (CMS, builder) ── lưu → revalidateTag(tenant:<id>…)
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

## 4. Gói dịch vụ ↔ code

| | **Cơ bản** | **Nâng cao** | **Cao cấp** |
|---|---|---|---|
| Theme | Nhóm Classic (minwy, t02–t04) | + nhóm Pro (t05–t11) | + nhóm Signature (t12–t15), override màu/font |
| Section | Hero, giới thiệu, dịch vụ, dự án, tin tức, liên hệ, footer | + máy tính chi phí, form "Nhận báo giá", gói giải pháp, FAQ, đánh giá, số liệu | + video Shorts, catalog + giỏ báo giá, đại lý, bản đồ chi nhánh, TikTok, song ngữ |
| Tùy biến | Chọn 1 preset, sửa nội dung | Bật/tắt + sắp xếp section, đổi variant | **Builder kéo-thả**, nhiều trang landing, A/B CTA |
| Tên miền riêng + SSL | 1 | 1 | 3 (đa thương hiệu) |
| Media | 1 GB | 5 GB | 20 GB, video tự host |
| Lead | Email + Telegram | + Webhook/Google Sheets, hộp thư lead | + phân bổ theo chi nhánh, xuất CSV, API |
| Email tên miền | Hướng dẫn tự cài | Cài hộ (phí cài đặt) | Cài hộ + quản lý (hoa hồng Zoho/Google) |

Bảng này được sinh từ `packages/plans/plans.ts` (E6) — trang bảng giá và code luôn khớp nhau.

## 5. Lộ trình

| Giai đoạn | Epic | Kết quả có thể demo | Thời lượng (ước) |
|---|---|---|---|
| **P0 — Nền móng** | E0, E1, E2 | Monorepo build xanh, template-15 chạy trong `apps/web` qua theme t15 | 2 tuần |
| **P1 — Thư viện section** | E3, E4 (đợt 1: t12–t15) | `/lab` hiển thị mọi section của 4 template Signature × 4 theme | 3 tuần |
| **P2 — Multi-tenant MVP** | E5, E6, E8, E10 (VPS) | 2 site demo khác tên miền chạy trên 1 VPS, nội dung từ DB, ISR | 3 tuần |
| **P3 — CMS** | E7, E11 | Khách tự sửa nội dung, sắp xếp section, nhận lead; trang cập nhật ≤ 60 s | 3 tuần |
| **P4 — Tên miền & bán hàng** | E9, E13 | Khách trỏ tên miền riêng, SSL tự động; tạo site mới từ preset ≤ 30 phút | 2 tuần |
| **P5 — Phủ template** | E4 (đợt 2–3: t05–t11, Classic) | Đủ 15 preset | 3 tuần (song song P3–P4) |
| **P6 — Cao cấp & AWS** | E12, E10 (AWS), E14 | Builder kéo-thả; bản deploy AWS; kiểm thử tải/bảo mật | 4 tuần |

Đường găng: E1 → E2 → E3 → E5 → E7. E4 (port template) chạy song song bằng Codex sau khi E3-S01…S03 xong.

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

> Kế hoạch đã được Codex review chéo (adversarial) ngày 08/10/2026; 25 góp ý (4 P0) đã được đưa vào các epic E2–E14 và ADR D3, D7, D13, D14.
