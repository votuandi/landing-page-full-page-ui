#!/usr/bin/env bash
set -euo pipefail

app=${1:?Usage: bash infra/docker/smoke.sh <web|admin> <image>}
image=${2:?Image is required}
case "$app" in web|admin) ;; *) echo 'App must be web or admin' >&2; exit 1 ;; esac
: "${DATABASE_URL:?DATABASE_URL must use the isolated app_runtime role}"
: "${REDIS_URL:?REDIS_URL is required for the smoke test}"
if [[ $app == admin ]]; then
  : "${ADMIN_SESSION_SECRET:?ADMIN_SESSION_SECRET is required}"
  : "${PLATFORM_DOMAIN:?PLATFORM_DOMAIN is required}"
fi

temp=$(mktemp -d)
container=''
cleanup() {
  if [[ -n $container ]]; then docker rm -f "$container" >/dev/null 2>&1 || true; fi
  rm -rf -- "$temp"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1" >&2; exit 1; }

size=$(docker image inspect --format '{{.Size}}' "$image")
printf 'INFO  %s image: %s bytes\n' "$app" "$size"
if [[ $app == web && $size -gt 262144000 ]]; then fail 'web image > 250 MiB'; fi
pass 'size'

network=${SMOKE_NETWORK:-host}
port=${SMOKE_PORT:-3400}
args=(--detach --read-only --network "$network" --tmpfs /tmp:rw,nosuid,nodev,mode=1777
  --tmpfs "/app/apps/$app/.next/cache:rw,nosuid,nodev,uid=1001,gid=1001,mode=0755")
if [[ $network != host ]]; then
  port=3000
  args+=(-p 127.0.0.1::3000)
fi
# Keep credentials out of process arguments and restrict the throwaway env file.
umask 077
write_env() {
  printf 'DATABASE_URL=%s\nREDIS_URL=%s\nPORT=%s\nMULTI_TENANT=1\n' "$1" "$REDIS_URL" "$port" > "$temp/env"
  if [[ $app == admin ]]; then
    printf 'ADMIN_SESSION_SECRET=%s\nPLATFORM_DOMAIN=%s\n' "$ADMIN_SESSION_SECRET" "$PLATFORM_DOMAIN" >> "$temp/env"
  fi
}
start_container() {
  write_env "$1"
  container=$(docker run "${args[@]}" --env-file "$temp/env" "$image")
  if [[ $network == host ]]; then
    base="http://127.0.0.1:$port"
  else
    published=$(docker port "$container" 3000/tcp)
    base="http://127.0.0.1:${published##*:}"
  fi
}
health_code() {
  curl --silent --max-time 1 -D "$temp/headers" -o "$temp/health" -w '%{http_code}' "$base/api/health" || true
}
assert_health() {
  node -e '
    const assert = require("node:assert/strict"), fs = require("node:fs");
    const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    assert.deepEqual(body, {status: process.argv[2], db: process.argv[3], redis: "ok"});
  ' "$temp/health" "$1" "$2" || fail 'health body'
  grep -qi '^cache-control:.*no-store' "$temp/headers" || fail 'health no-store'
}

start=$(date +%s%3N)
start_container "$DATABASE_URL"
while [[ $(health_code) != 200 ]]; do
  [[ $(( $(date +%s%3N) - start )) -le 5000 ]] || fail 'startup > 5 seconds'
  sleep 0.1
done
elapsed=$(( $(date +%s%3N) - start ))
[[ $elapsed -le 5000 ]] || fail 'startup > 5 seconds'
printf 'PASS  startup: %s ms\n' "$elapsed"
assert_health ok ok
pass 'health 200 (DB + Redis, no-store)'

[[ $(docker exec "$container" id -u) == 1001 ]] || fail 'non-root UID must be 1001'
[[ $(docker inspect --format '{{.HostConfig.ReadonlyRootfs}}' "$container") == true ]] || fail 'read-only root'
docker exec "$container" sh -c 'test -f server.js && test ! -e /app/.git && test -z "$(find /app -name ".env*" ! -name .env.example -print -quit)"' || fail 'standalone / secrets'
pass 'non-root, read-only, standalone, no env/git files'

if [[ $app == web ]]; then
  # seed-demo.ts publishes t15.localhost; override when using a different active seed.
  host=${SMOKE_HOST:-t15.localhost}
  [[ $(curl --silent --max-time 15 -H "Host: $host" -o "$temp/page" -w '%{http_code}' "$base/") == 200 ]] || fail 'tenant page'
  [[ $(curl --silent --max-time 15 -H "Host: $host" -o "$temp/image" -w '%{http_code}' "$base/_next/image?url=%2Fpreset-media%2Fci%2Fsolar-panels-hero.jpg&w=640&q=75") == 200 ]] || fail 'Next image cache'
  pass 'read-only tenant page + Next image'
else
  host=${SMOKE_HOST:-demo-t15.admin.$PLATFORM_DOMAIN}
  [[ $(curl --silent --max-time 15 -H "Host: $host" -o "$temp/page" -w '%{http_code}' "$base/dang-nhap") == 200 ]] || fail 'admin login page'
  pass 'read-only admin login page'
fi

healthy=false
for ((attempt=0; attempt<30; attempt++)); do
  if [[ $(docker inspect --format '{{.State.Health.Status}}' "$container") == healthy ]]; then healthy=true; break; fi
  sleep 1
done
[[ $healthy == true ]] || fail 'Docker HEALTHCHECK'
pass 'docker health healthy'
docker logs "$container" > "$temp/container.log" 2>&1
if grep -qE 'EROFS|EACCES' "$temp/container.log"; then fail 'read-only filesystem errors'; fi
pass 'no EROFS / EACCES'

docker rm -f "$container" >/dev/null
container=''
start=$(date +%s%3N)
start_container 'postgresql://invalid:invalid@127.0.0.1:1/unavailable?connect_timeout=1'
while [[ $(health_code) != 503 ]]; do
  [[ $(( $(date +%s%3N) - start )) -le 5000 ]] || fail 'bad DB did not return 503 within 5 seconds'
  sleep 0.1
done
[[ $(( $(date +%s%3N) - start )) -le 5000 ]] || fail 'bad DB response > 5 seconds'
assert_health error error
pass 'bad DB is uncached 503 without details'
printf 'PASS  %s smoke\n' "$app"
