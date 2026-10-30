import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { adminEnv, consoleEnv, loadEnv, webEnv, workerEnv } from "../index.ts";

const admin = { DATABASE_URL: "postgresql://app_runtime:password@localhost/solar", PLATFORM_DOMAIN: "solar.localhost", ADMIN_SESSION_SECRET: "a".repeat(32) };
function invalid(schema: Parameters<typeof loadEnv>[0], values: NodeJS.ProcessEnv) {
  const lines: string[] = [];
  assert.throws(() => loadEnv(schema, values, { log: line => lines.push(line), exit: code => { throw new Error(`exit ${code}`); } }), /exit 1/);
  return lines.join("\n");
}
test("admin env hợp lệ", () => assert.equal(loadEnv(adminEnv, admin).PLATFORM_DOMAIN, admin.PLATFORM_DOMAIN));

test("E11-S02: env giữ cấu hình lead optional qua admin/web/worker/console và kiểm bot username", () => {
  const lead = { TELEGRAM_BOT_TOKEN: "test-token", TELEGRAM_BOT_USERNAME: "solar_demo_bot", RESEND_API_KEY: "test-resend", LEAD_EMAIL_FROM: "Solar <lead@x.vn>" };
  for (const [schema, base] of [[adminEnv, admin], [webEnv, {}], [workerEnv, { PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar" }],
    [consoleEnv, { PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar", CONSOLE_SESSION_SECRET: "b".repeat(32) }]] as const) {
    const parsed = loadEnv(schema, { ...base, ...lead });
    for (const [key, value] of Object.entries(lead)) assert.equal(parsed[key as keyof typeof parsed], value);
    const empty = loadEnv(schema, { ...base, ...Object.fromEntries(Object.keys(lead).map(key => [key, ""])) });
    for (const key of Object.keys(lead)) assert.equal(empty[key as keyof typeof empty], undefined);
    assert.ok(!schema.safeParse({ ...base, TELEGRAM_BOT_USERNAME: "bad/<script>" }).success);
  }
});
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
test("mọi biến runtime app và dependency có trong schema và env.example", () => {
  const root = fileURLToPath(new URL("../../../../", import.meta.url));
  const packages = new Map(readdirSync(join(root, "packages")).flatMap(dir => {
    const manifest = join(root, "packages", dir, "package.json");
    return existsSync(manifest) ? [[JSON.parse(readFileSync(manifest, "utf8")).name, join(root, "packages", dir)] as const] : [];
  }));
  // Next/Node inject these runtime selectors; they are not application configuration.
  const allow = new Set(["NODE_ENV", "NEXT_RUNTIME", "NEXT_PHASE"]);
  function sources(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      if (["__tests__", "scripts", "fixtures", "__fixtures__"].includes(entry.name) || /\.(test|fixture)\.[cm]?[jt]sx?$/.test(entry.name)) return [];
      const path = join(dir, entry.name);
      return entry.isDirectory() ? sources(path) : /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
    });
  }
  const missing: string[] = [];
  for (const [app, schema] of [["web", webEnv], ["admin", adminEnv], ["worker", workerEnv]] as const) {
    const dirs = new Set<string>();
    function visit(dir: string) {
      if (dirs.has(dir)) return;
      dirs.add(dir);
      const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
      for (const name of Object.keys(manifest.dependencies ?? {})) if (packages.has(name)) visit(packages.get(name)!);
    }
    visit(join(root, "apps", app));
    const example = readFileSync(join(root, "apps", app, ".env.example"), "utf8");
    const exampleKeys = new Set([...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(match => match[1]));
    for (const dir of dirs) for (const path of sources(join(dir, "src"))) {
      const source = readFileSync(path, "utf8");
      const names = new Set([...source.matchAll(/process\.env(?:\.([A-Z][A-Z0-9_]*)|\[["']([A-Z][A-Z0-9_]*)["']\])/g)].map(match => match[1] ?? match[2]));
      if (dir === packages.get("@solar/storage")) {
        // Storage accepts an env object and selects S3 keys dynamically; include its literal schema keys too.
        for (const match of source.matchAll(/\b(?:STORAGE|S3|MEDIA)_[A-Z][A-Z0-9_]*\b/g)) if (!match[0].endsWith("_")) names.add(match[0]);
      }
      for (const name of names) if (!allow.has(name)) {
        if (!Object.hasOwn(schema.shape, name)) missing.push(`${app}: schema thiếu ${name}`);
        if (!exampleKeys.has(name)) missing.push(`${app}: env.example thiếu ${name}`);
      }
    }
  }
  assert.deepEqual([...new Set(missing)].sort(), []);
});
test("storage/media/lab env tùy chọn nhưng kiểm định dạng khi có", () => {
  for (const [schema, base] of [[webEnv, {}], [adminEnv, admin], [workerEnv, { PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar" }]] as const) {
    assert.ok(schema.safeParse(base).success);
    for (const patch of [{ STORAGE_DRIVER: "r2" }, { S3_ENDPOINT: "file:///secret" }, { S3_FORCE_PATH_STYLE: "1" }, { STORAGE_LOCAL_ROOT: "bad\0path" }])
      assert.ok(!schema.safeParse({ ...base, ...patch }).success, JSON.stringify(patch));
    assert.ok(schema.safeParse({ ...base, STORAGE_DRIVER: "s3", S3_REGION: "auto", S3_ENDPOINT: "https://example.r2.cloudflarestorage.com", S3_FORCE_PATH_STYLE: "true" }).success);
  }
  assert.ok(!webEnv.safeParse({ LAB_ENABLED: "1" }).success);
  assert.ok(!workerEnv.safeParse({ PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar", MEDIA_REQUIRE_FFMPEG: "true" }).success);
});
test("MAIL_FROM is optional, empty is unset, and configured sender survives parsing", () => {
  for (const [schema, base] of [[webEnv, {}], [adminEnv, admin], [workerEnv, { PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar" }]] as const) {
    assert.equal(schema.parse({ ...base, MAIL_FROM: "" }).MAIL_FROM, undefined);
    assert.equal(schema.parse({ ...base, MAIL_FROM: "Solar <mail@example.vn>" }).MAIL_FROM, "Solar <mail@example.vn>");
  }
});

test("index không import node:crypto", () => {
  for (const file of ["index.ts", "keyFormat.ts"]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /node:|from ["']\.\/secrets/);
  }
});
