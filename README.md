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
   Node 24 cũng chạy được; cảnh báo "Ignored build scripts" khi install bỏ qua được.

   > **Nhiều worktree dùng chung một bộ container** (`solar-local-*`). Worktree chưa có `.env.ci.local` mà chạy `up`
   > sẽ sinh mật khẩu mới, đổi mật khẩu role và tài khoản demo của mọi cây khác. Ở worktree thứ hai, chép
   > `.env.ci.local` từ cây chính rồi mới chạy `up`/`env`; lỡ chạy rồi thì chạy lại `up` ở cây chính.

3. Chép mẫu cấu hình (chỉ khi chưa có file local) rồi sửa theo bảng. Biến đã nạp từ shell (bước 2) **ưu tiên hơn**
   `.env.local`, nên các dòng DB/Redis của file mẫu có thể xóa đi.

   ```bash
   cp --update=none apps/web/.env.example apps/web/.env.local
   cp --update=none apps/admin/.env.example apps/admin/.env.local
   ```

   | App | Biến | Giá trị |
   |---|---|---|
   | web | `MULTI_TENANT` | `1` |
   | web, admin | `PLATFORM_DOMAIN` | `solar.localhost` |
   | admin | `TENANT_PUBLIC_PORT` | `3000` |
   | web, admin | `DATABASE_URL`, `REDIS_URL` | xóa dòng (lấy từ bước 2, role app_runtime) |
   | admin | `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` |
   | web, admin | `PREVIEW_SECRET` | `openssl rand -hex 32`, **cùng một giá trị** ở hai app |
   | web, worker | `REVALIDATE_SECRET` | `openssl rand -hex 32`, **cùng một giá trị** ở web và shell worker |

   Media/email cấu hình thêm khi cần theo README từng app. Không chép secret vào tài liệu.

4. Mở ba terminal tại gốc repo; **mỗi terminal** nạp biến bước 2 (`source <(bash scripts/local-ci.sh env)`).
   Worker không đọc `.env.local`, chỉ nhận biến từ shell; trước khi chạy worker:

   ```bash
   export REVALIDATE_SECRET=<giống web> WEB_REVALIDATE_URLS=http://localhost:3000/api/revalidate
   ```

   Rồi mỗi terminal chạy một lệnh:

   ```bash
   pnpm --filter web dev
   pnpm --filter admin dev
   pnpm --filter worker start
   ```

   Worker chạy trên DB dev có outbox cũ sẽ in nhiều dòng "invalidate trễ > 5 phút": đây là cảnh báo, không phải lỗi.

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
Kiểm theo loại thay đổi, trước tiên chạy `node scripts/agents/doctor.mjs`:

| Đổi gì | Chạy |
|---|---|
| Chỉ `*.md` | `node --test scripts/ci/docs-check.test.mjs`, `node scripts/ci/docs-check.mjs`, `pnpm lint:root` |
| Code của package/app | thêm typecheck, lint, test của từng package đổi, vd. `pnpm --filter @solar/core test` |
| Bộ DB/e2e bắt buộc | `git diff --name-only mono-repo-multi-tenent \| node scripts/ci/checks-map.mjs --stdin` (có story ID thì `node scripts/agents/run.mjs verify <ID>`), rồi chạy bằng `scripts/local-ci.sh` |

## Tài liệu khác

- [Hướng dẫn khách dùng CMS](docs-public/cms/README.md)
- [Runbook vận hành](docs-public/runbook.md)
- [Docker và image](infra/docker/README.md), [email](infra/mail/README.md), [cron](CRON.md)
- [Kiểm thử trình duyệt](tooling/visual/README.md), [luật ESLint](tooling/eslint-plugin/README.md)
- [Checklist bảo mật](docs-public/security-checklist.md)

Console nền tảng: chưa có — E15-S02. Hạ tầng production xem trạng thái trong runbook.
