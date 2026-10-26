import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("worker startup từ chối thiếu DB trước khi mở pool", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "src/main.ts"], {
    cwd: new URL("../../", import.meta.url), encoding: "utf8", timeout: 15_000,
    env: { ...process.env, PLATFORM_DATABASE_URL: "", APP_ENCRYPTION_KEY: "" },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /\[env\].*Cấu hình không hợp lệ/);
  assert.match(result.stderr, /PLATFORM_DATABASE_URL/);
  assert.doesNotMatch(result.stdout, /đang chạy/);
});
