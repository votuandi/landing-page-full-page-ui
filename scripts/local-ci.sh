#!/usr/bin/env bash
# Chạy ở local các bước cần Postgres/Redis của job `db` (.github/workflows/workspace.yml) trước khi push.
#   bash scripts/local-ci.sh up        dựng container Postgres 16 + Redis, tạo role, migrate, seed (chạy lại an toàn)
#   bash scripts/local-ci.sh db        test DB thật: @solar/db, web test:tenant, admin
#   bash scripts/local-ci.sh storage   contract local + S3 trên MinIO (tự dựng MinIO nếu chưa có)
#   bash scripts/local-ci.sh e2e [cfg] e2e Playwright (mặc định admin; vd. tenant, preview, admin)
#   bash scripts/local-ci.sh all       up + db + e2e admin
#   bash scripts/local-ci.sh down      xóa container (dữ liệu mất)
#   source <(bash scripts/local-ci.sh env)   nạp biến môi trường vào shell hiện tại
# Mật khẩu sinh ngẫu nhiên một lần, lưu ở .env.ci.local (gitignore `.env*.local`).
set -euo pipefail
cd "$(dirname "$0")/.."

# Dưới vùng dynamic (49152+): Hyper-V dành riêng dải cổng trong vùng đó và đổi sau mỗi lần boot (E11-S03: 56379 bị chặn).
PG=solar-local-pg REDIS=solar-local-redis PG_PORT=${LOCAL_PG_PORT:-45432} REDIS_PORT=${LOCAL_REDIS_PORT:-46379}
MINIO=solar-local-minio MINIO_PORT=${LOCAL_MINIO_PORT:-49000}
MINIO_IMAGE=bitnamilegacy/minio:2025.4.22 # minio/minio đã gỡ khỏi Docker Hub; image bitnami tự chạy `server`
ENV_FILE=.env.ci.local

rand() { node -e 'process.stdout.write(require("crypto").randomBytes(24).toString("hex"))'; }

ensure_env() {
  [ -f "$ENV_FILE" ] && return
  local owner runtime platform seed
  owner=$(rand) runtime=$(rand) platform=$(rand) seed=$(rand)
  cat > "$ENV_FILE" <<EOF
APP_OWNER_PASSWORD=$owner
APP_RUNTIME_PASSWORD=$runtime
APP_PLATFORM_PASSWORD=$platform
MIGRATION_DATABASE_URL=postgresql://app_owner:$owner@localhost:$PG_PORT/solar_e5
DATABASE_URL=postgresql://app_runtime:$runtime@localhost:$PG_PORT/solar_e5
PLATFORM_DATABASE_URL=postgresql://app_platform:$platform@localhost:$PG_PORT/solar_e5
TEST_OWNER_DATABASE_URL=postgresql://postgres:postgres@localhost:$PG_PORT/solar_e5
SEED_PASSWORD=$seed
REDIS_URL=redis://localhost:$REDIS_PORT
RLS_REQUIRED=1
E2E_PLATFORM_DOMAIN=solar.example.com
EOF
}

load_env() { ensure_env; set -a; . "./$ENV_FILE"; set +a; }

start() { # name, docker run args...
  local name=$1; shift
  if docker container inspect "$name" >/dev/null 2>&1; then docker start "$name" >/dev/null
  else docker run -d --name "$name" "$@" >/dev/null; fi
}

minio_up() {
  start "$MINIO" -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
    -p "127.0.0.1:$MINIO_PORT:9000" "$MINIO_IMAGE"
  for attempt in {1..60}; do
    if curl --fail --silent --output /dev/null --max-time 1 "http://127.0.0.1:$MINIO_PORT/minio/health/live"; then return; fi
    sleep 1
  done
  docker logs "$MINIO"
  echo "MinIO chưa sẵn sàng sau 60 lần thử" >&2
  return 1
}

storage() {
  minio_up
  # Bucket được contract fixture tạo; credentials này chỉ dùng cho container test local.
  STORAGE_REQUIRE_S3=1 STORAGE_S3_TEST_ENDPOINT="http://127.0.0.1:$MINIO_PORT" \
    STORAGE_S3_TEST_BUCKET=solar-storage-test STORAGE_S3_TEST_ACCESS_KEY_ID=minioadmin \
    STORAGE_S3_TEST_SECRET_ACCESS_KEY=minioadmin pnpm --filter @solar/storage test
}

up() {
  load_env
  start "$PG" -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=solar_e5 -p "$PG_PORT:5432" postgres:16-alpine \
    -c fsync=off -c synchronous_commit=off -c full_page_writes=off
  start "$REDIS" -p "$REDIS_PORT:6379" redis:7-alpine
  minio_up
  until docker exec "$PG" pg_isready -U postgres -d solar_e5 >/dev/null 2>&1; do sleep 1; done
  docker exec -i -e APP_OWNER_PASSWORD -e APP_RUNTIME_PASSWORD -e APP_PLATFORM_PASSWORD "$PG" \
    psql -q -U postgres -d solar_e5 -v ON_ERROR_STOP=1 -f - < packages/db/scripts/provision-roles.sql
  pnpm --filter @solar/db db:deploy
  pnpm db:seed
}

db() {
  load_env
  minio_up
  # Cùng env MinIO với job `db` của workspace.yml (không có bucket sẵn): int test S3 chạy thật, không SKIP (E8-S06).
  export STORAGE_REQUIRE_S3=1 STORAGE_S3_TEST_ENDPOINT="http://127.0.0.1:$MINIO_PORT" \
    STORAGE_S3_TEST_ACCESS_KEY_ID=minioadmin STORAGE_S3_TEST_SECRET_ACCESS_KEY=minioadmin
  unset STORAGE_S3_TEST_BUCKET
  pnpm --filter @solar/db test
  # Job `db` của CI chạy cả worker (outbox.int.test); thiếu bước này E11-S03 lọt hồi quy tới CI.
  pnpm --filter worker test
  pnpm --filter web test:tenant
  pnpm --filter admin test
}

# Build an app only when a source is newer than its last build (E2E_SERVER=start serves that build).
build_if_stale() {
  local app=$1 id="apps/$1/.next/BUILD_ID" newer
  [ -f "$id" ] && newer=$(find "apps/$app/src" "apps/$app/public" packages -newer "$id" -type f \
    \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' -o -name '*.json' \) -not -path '*/node_modules/*' -not -path '*/generated/*' -print -quit 2>/dev/null)
  if [ ! -f "$id" ] || [ -n "$newer" ]; then echo "→ build $app${newer:+ ($newer mới hơn bản build)}"; pnpm --filter "$app" build; fi
}

e2e() {
  load_env
  local cfg=${1:-admin}; shift || true
  local project=(); [ "$cfg" = admin ] && project=(--project=chromium)
  # E11-S03: two `next dev --webpack` servers per admin run (3–7 GB each) ran Windows out of commit and crashed VS Code
  # 8 times; cold compiles also caused most local timeouts. Single tests (`-g`) therefore run on production builds: 2 lead
  # inbox tests took 1.5 min and 2.3 GB. Whole suites stay on `next dev` like CI: in production the app itself emits https
  # URLs without port and secure cookies, which suites served over http:// assert on. E2E_SERVER overrides.
  case " $* " in *" -g "*|*" --grep "*|*" --grep="*) : "${E2E_SERVER:=start}" ;; *) : "${E2E_SERVER:=dev}" ;; esac
  export E2E_SERVER
  if [ "$E2E_SERVER" = start ]; then
    case "$cfg" in admin) build_if_stale admin; build_if_stale web ;; *) build_if_stale web ;; esac
  fi
  # A runaway server then dies alone instead of exhausting commit memory for the whole machine. next dev needs more: it
  # restarts itself near the heap limit, and that restart crashes on Windows (ENOTEMPTY in .next/dev/types).
  local heap=3072; [ "$E2E_SERVER" = dev ] && heap=6144
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=$heap}"
  pnpm --filter @solar/visual exec playwright test --config "playwright.$cfg.config.ts" "${project[@]}" "$@"
}

case "${1:-}" in
  up) up ;;
  db) db ;;
  storage) storage ;;
  e2e) shift; e2e "$@" ;;
  all) up; db; e2e admin ;;
  down) docker rm -f "$PG" "$REDIS" "$MINIO" >/dev/null; echo "Đã xóa $PG, $REDIS, $MINIO" ;;
  env) ensure_env; sed 's/^/export /' "$ENV_FILE" ;;
  *) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
