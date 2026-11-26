# Nền tảng website điện mặt trời

Một codebase phục vụ nhiều công ty điện mặt trời Việt Nam, mỗi site có nội dung, tên miền và gói riêng.
Theme cung cấp token thiết kế; preset ghép các section dùng chung schema. Kiến trúc và quy ước: [AGENTS.md](AGENTS.md#1-dự-án-là-gì).

## Quickstart (Linux/WSL, Bash)

1. Cài Node 22, Corepack và Docker đang chạy. Bật phiên bản pnpm đã khóa trong `package.json`:

   ```bash
   corepack enable
   corepack prepare pnpm@10.34.6 --activate
   pnpm install --frozen-lockfile
   ```

2. Dựng Postgres, Redis, MinIO; provision role, migrate và seed:

   ```bash
   bash scripts/local-ci.sh up
   source <(bash scripts/local-ci.sh env)
   ```

   Script sinh `.env.ci.local` chứa mật khẩu ngẫu nhiên; giữ riêng, không commit, không bật shell tracing.
   `down` xóa container và dữ liệu. Xem [DB](packages/db/README.md#seed-demo) về seed và role.

3. Chép mẫu cấu hình (chỉ làm khi chưa có file local):

   ```bash
   cp -n apps/web/.env.example apps/web/.env.local
   cp -n apps/admin/.env.example apps/admin/.env.local
   ```

   Sửa web: `MULTI_TENANT=1`, `PLATFORM_DOMAIN=solar.localhost`.
   Sửa admin: `PLATFORM_DOMAIN=solar.localhost`, `TENANT_PUBLIC_PORT=3000`.
   Web/admin dùng `DATABASE_URL` role app_runtime từ bước 2; worker dùng `PLATFORM_DATABASE_URL` role app_platform.
   Xóa giá trị DB/Redis ví dụ khỏi file local nếu dùng biến đã nạp từ bước 2.
   Sinh `ADMIN_SESSION_SECRET` ít nhất 32 byte; `PREVIEW_SECRET` ít nhất 32 byte dùng chung web/admin.
   Web/worker dùng cùng `REVALIDATE_SECRET`; worker đặt `WEB_REVALIDATE_URLS=http://localhost:3000/api/revalidate`.
   Dùng `openssl rand -hex 32` để sinh từng secret riêng, không chép secret vào tài liệu.
   Cấu hình thêm media/email khi cần theo README app; worker nhận biến từ shell, không tự nạp `.env.local`.

4. Mở ba terminal tại gốc repo; **mỗi terminal** nạp biến bước 2. Đặt các biến dùng chung còn lại trong shell worker
   (đặc biệt `REVALIDATE_SECRET` giống web), rồi chạy lần lượt:

   ```bash
   pnpm --filter web dev
   pnpm --filter admin dev
   pnpm --filter worker start
   ```

   Web: [http://t15.localhost:3000](http://t15.localhost:3000).
   CMS: [http://demo-t15.admin.solar.localhost:3300/dang-nhap](http://demo-t15.admin.solar.localhost:3300/dang-nhap).
   Nếu OS không phân giải host, thêm chúng vào hosts file trỏ `127.0.0.1`.
   Tài khoản [DỮ LIỆU MẪU]: `owner@demo.vn`, mật khẩu là giá trị `$SEED_PASSWORD` nối `-t15`.
   Không dùng tài khoản demo cho khách thật. Worker chạy nền, không có trang web.

## Workspace

| App | Tài liệu |
|---|---|
| web | [Website công khai](apps/web/README.md) |
| admin | [CMS theo tenant](apps/admin/README.md) |
| worker | [Outbox và cron](apps/worker/README.md) |

| Package | Tài liệu |
|---|---|
| auth | [README](packages/auth/README.md) |
| cache | [README](packages/cache/README.md) |
| cms-ui | [README](packages/cms-ui/README.md) |
| config | [README](packages/config/README.md) |
| core | [README](packages/core/README.md) |
| db | [README](packages/db/README.md) |
| env | [README](packages/env/README.md) |
| leads | [README](packages/leads/README.md) |
| plans | [README](packages/plans/README.md) |
| presets | [README](packages/presets/README.md) |
| sections | [README](packages/sections/README.md) |
| storage | [README](packages/storage/README.md) |
| themes | [README](packages/themes/README.md) |
| tokens | [README](packages/tokens/README.md) |
| ui | [README](packages/ui/README.md) |

## Làm một story

Đọc [AGENTS.md](AGENTS.md), [roadmap](roadmap/README.md) và [chiến lược test](TESTING.md).
Chọn việc bằng `node scripts/agents/story.mjs next`, rồi dùng `/run-story <ID|next>` trong Claude Code.
Plan được duyệt trước implementation; kiểm local trước CI, review trước merge; agent không tự merge.
Kiểm tài liệu: `node --test scripts/ci/docs-check.test.mjs`, `node scripts/ci/docs-check.mjs`, `pnpm lint:root`.

## Tài liệu khác

- [Hướng dẫn khách dùng CMS](docs-public/cms/README.md)
- [Runbook vận hành](docs-public/runbook.md)
- [Docker và image](infra/docker/README.md), [email](infra/mail/README.md), [cron](CRON.md)
- [Kiểm thử trình duyệt](tooling/visual/README.md), [luật ESLint](tooling/eslint-plugin/README.md)
- [Checklist bảo mật](docs-public/security-checklist.md)

Console nền tảng: chưa có — E15-S02. Hạ tầng production xem trạng thái trong runbook.
