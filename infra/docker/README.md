# Images web / admin

Chạy từ gốc repo, cần Docker BuildKit:

```bash
docker build --build-arg APP=web -t solar-web:dev .
docker build --build-arg APP=admin -t solar-admin:dev .
```

Build không cần DB, Redis hay secret. `turbo prune --docker` chỉ giữ workspace cần cho app; build sinh Prisma client
trong `packages/db/generated`, Next đóng gói vào standalone. Runner chỉ chứa standalone, public và static, chạy UID/GID
1001, port 3000. Không chạy migration khi container khởi động; deploy phải migrate bằng role owner riêng.

Biến runtime: `DATABASE_URL` dùng role `app_runtime` cô lập, `REDIS_URL` (bỏ trống → health `redis: skipped`),
`MULTI_TENANT=1` cho web. Admin thêm `ADMIN_SESSION_SECRET` (ít nhất 32 byte), `PLATFORM_DOMAIN`.
Web có thể cần `PREVIEW_SECRET`, `PLATFORM_DOMAIN`, `REVALIDATE_SECRET` và các biến storage theo tính năng sử dụng.
`PORT` mặc định 3000, `HOSTNAME=0.0.0.0`. Health `/api/health` kiểm DB/role + Redis mỗi lần, timeout 2 giây/check,
200/503, `Cache-Control: no-store`, không yêu cầu Host tenant hoặc session. Không trả thông tin kết nối hay lỗi nội bộ.

```bash
docker run --rm --read-only --env-file .env.runtime -e MULTI_TENANT=1 \
  --tmpfs /tmp:rw,nosuid,nodev,mode=1777 \
  --tmpfs /app/apps/web/.next/cache:rw,nosuid,nodev,uid=1001,gid=1001,mode=0755 \
  -p 3000:3000 solar-web:dev
```

Admin thay đường dẫn cache thành `/app/apps/admin/.next/cache`. Compose tương đương: `read_only: true`, hai mount
`tmpfs` như trên. Web tắt ISR flush ra `.next/server` để chạy read-only; E10-S03 bổ sung cache Redis dùng chung.
Nếu `STORAGE_DRIVER=local`, đặt `STORAGE_LOCAL_ROOT=/media`, mount volume `/media` có quyền ghi UID/GID 1001 và
cấu hình `MEDIA_PUBLIC_BASE`; thư mục local chứa public/private/quarantine theo `packages/storage`, chỉ `tenants/`
được phục vụ public. S3/R2 không cần volume media. Không mount source code hoặc `.env` vào image build.

Smoke cần Node, curl, Docker, DB đã migrate/seed (`bash scripts/local-ci.sh up`) và Redis chạy sẵn:

```bash
set -a
. ./.env.ci.local
set +a
# Linux/CI: dùng host network, PORT=3400 (SMOKE_PORT có thể đổi).
bash infra/docker/smoke.sh web solar-web:dev
export ADMIN_SESSION_SECRET="$(openssl rand -hex 32)" PLATFORM_DOMAIN=solar.localhost
bash infra/docker/smoke.sh admin solar-admin:dev
```

Windows Docker Desktop: đặt `SMOKE_NETWORK=bridge`; đổi host của `DATABASE_URL` và `REDIS_URL` từ `localhost` sang
`host.docker.internal`, giữ nguyên port từ `.env.ci.local`. Script publish cổng ngẫu nhiên ở loopback. Git Bash cần
`MSYS_NO_PATHCONV=1` khi truyền đường dẫn container. Không bật shell tracing vì biến chứa secret.

Script dọn container qua trap, yêu cầu UID 1001, root filesystem read-only, health 200, Docker healthy, startup ≤5s,
web ≤250 MiB (262144000 bytes), tenant page + Next image 200 (admin: trang đăng nhập), không EROFS/EACCES, DB lỗi
trả 503 ≤5s. Seed mặc định web `t15.localhost`, admin `demo-t15.admin.<PLATFORM_DOMAIN>`; đổi bằng `SMOKE_HOST`.
Kích thước/startup được đo trên máy chạy smoke, chưa được xác nhận chỉ bằng kiểm cú pháp.

CI `.github/workflows/images.yml`: PR build/load + smoke; merge base build/load + smoke rồi push GHCR tag commit SHA.
Chỉ manual dispatch trên `mono-repo-multi-tenent` được publish. ECR là tùy chọn: cấu hình **cả** `AWS_ECR_REGISTRY`
và `AWS_ROLE_ARN`, thêm `AWS_REGION`; role OIDC cần quyền đẩy ECR, các repository `<repo>-web` / `<repo>-admin` phải
được tạo trước. Mọi bước login/OIDC/push đều bị chặn trên PR và trên manual dispatch ngoài base.

`apps/console` chưa tồn tại: E15-S02 thêm standalone, health dùng đúng realm/role platform, thêm `console` vào matrix
workflow và smoke; Dockerfile nhận `APP=console` sẵn. Compose VPS mới thuộc E10-S02; compose/Dockerfile.dev cũ đã xóa.
