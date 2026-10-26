import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { adminEnv, consoleEnv, loadEnv, webEnv, workerEnv } from "../index.ts";

const admin = { DATABASE_URL: "postgresql://app_runtime:password@localhost/solar", PLATFORM_DOMAIN: "solar.localhost", ADMIN_SESSION_SECRET: "a".repeat(32) };
function invalid(schema: Parameters<typeof loadEnv>[0], values: NodeJS.ProcessEnv) {
  const lines: string[] = [];
  assert.throws(() => loadEnv(schema, values, { log: line => lines.push(line), exit: code => { throw new Error(`exit ${code}`); } }), /exit 1/);
  return lines.join("\n");
}
test("admin env hợp lệ", () => assert.equal(loadEnv(adminEnv, admin).PLATFORM_DOMAIN, admin.PLATFORM_DOMAIN));
test("chuỗi rỗng = thiếu", () => assert.match(invalid(adminEnv, { ...admin, DATABASE_URL: "" }), /DATABASE_URL/));
test("liệt kê mọi lỗi", () => {
  const log = invalid(adminEnv, {});
  for (const key of Object.keys(admin)) assert.match(log, new RegExp(key));
});
test("thông báo lỗi không lộ giá trị", () => {
  const log = invalid(adminEnv, { ...admin, DATABASE_URL: "postgresql://wrong:sentinel-password@localhost/db", ADMIN_SESSION_SECRET: "abc" });
  assert.match(log, /DATABASE_URL/); assert.match(log, /ADMIN_SESSION_SECRET/);
  for (const secret of ["sentinel-password", "abc", admin.ADMIN_SESSION_SECRET]) assert.ok(!log.includes(secret));
});
test("thiếu DATABASE_URL thoát 1", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", 'import {loadEnv,adminEnv} from "./src/index.ts"; loadEnv(adminEnv);'],
    { encoding: "utf8", cwd: new URL("../../", import.meta.url), env: { ...process.env, ...admin, DATABASE_URL: "" } });
  assert.equal(result.status, 1); assert.match(result.stderr, /\n- DATABASE_URL:/);
});
test("web single-site và multi-tenant", () => {
  assert.ok(webEnv.safeParse({}).success);
  assert.ok(!webEnv.safeParse({ MULTI_TENANT: "1" }).success);
  assert.ok(webEnv.safeParse({ MULTI_TENANT: "1", DATABASE_URL: admin.DATABASE_URL }).success);
});
test("console secret riêng", () => {
  const env = { PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar", CONSOLE_SESSION_SECRET: "b".repeat(32) };
  assert.ok(consoleEnv.safeParse(env).success);
  assert.ok(!consoleEnv.safeParse({ ...env, CONSOLE_SESSION_SECRET: "short" }).success);
  assert.ok(!consoleEnv.safeParse({ ...env, ADMIN_SESSION_SECRET: env.CONSOLE_SESSION_SECRET }).success);
});
test("role DB theo app", () => {
  assert.match(invalid(adminEnv, { ...admin, DATABASE_URL: "postgresql://app_platform@localhost/solar" }), /app_runtime/);
  for (const schema of [consoleEnv, workerEnv]) assert.match(invalid(schema, { PLATFORM_DATABASE_URL: admin.DATABASE_URL }), /app_platform/);
  assert.ok(workerEnv.safeParse({ PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar" }).success);
});
test("định dạng URL, secret theo byte và khóa startup", () => {
  assert.ok(adminEnv.safeParse({ ...admin, ADMIN_SESSION_SECRET: "đ".repeat(16) }).success);
  for (const patch of [{ REDIS_URL: "garbage" }, { PREVIEW_SECRET: "short" }, { APP_ENCRYPTION_KEY: "garbage" }, { DATABASE_URL: "https://app_runtime@localhost/db" }])
    assert.ok(!adminEnv.safeParse({ ...admin, ...patch }).success);
});
test("revalidate giữ tương thích secret hiện có, không áp thêm độ dài", () => {
  assert.ok(webEnv.safeParse({ REVALIDATE_SECRET: "existing-secret" }).success);
  assert.ok(workerEnv.safeParse({ PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar", REVALIDATE_SECRET: "existing-secret" }).success);
});
test("danh sách URL revalidate chỉ nhận HTTP(S)", () => {
  for (const schema of [webEnv, workerEnv]) {
    const base = { PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar" };
    assert.ok(schema.safeParse({ ...base, WEB_REVALIDATE_URLS: "http://web-1:3000/api/revalidate, https://web-2/api/revalidate" }).success);
    for (const value of ["http://valid/api,invalid", "file:///private"]) assert.ok(!schema.safeParse({ ...base, WEB_REVALIDATE_URLS: value }).success);
  }
});
test("env.example khớp schema", () => {
  for (const [app, schema] of [["web", webEnv], ["admin", adminEnv], ["worker", workerEnv]] as const) {
    const example = readFileSync(new URL(`../../../../apps/${app}/.env.example`, import.meta.url), "utf8");
    const keys = [...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(match => match[1]).sort();
    assert.deepEqual(keys, Object.keys(schema.shape).sort(), app);
  }
});
test("index không import node:crypto", () => {
  for (const file of ["index.ts", "keyFormat.ts"]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /node:|from ["']\.\/secrets/);
  }
});
