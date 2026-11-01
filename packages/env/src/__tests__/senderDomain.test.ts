import assert from "node:assert/strict";
import test from "node:test";
import { adminEnv, webEnv, workerEnv, consoleEnv } from "../index.ts";

test("RESEND_DOMAINS_API_KEY chỉ tồn tại trong adminEnv và là optional", () => {
  const admin = { DATABASE_URL: "postgresql://app_runtime@localhost/solar", PLATFORM_DOMAIN: "solar.localhost", ADMIN_SESSION_SECRET: "a".repeat(32) };
  assert.equal(adminEnv.parse({ ...admin, RESEND_DOMAINS_API_KEY: "domain-key" }).RESEND_DOMAINS_API_KEY, "domain-key");
  assert.equal(adminEnv.parse({ ...admin, RESEND_DOMAINS_API_KEY: "" }).RESEND_DOMAINS_API_KEY, undefined);
  for (const [schema, base] of [[webEnv, {}], [workerEnv, { PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar" }],
    [consoleEnv, { PLATFORM_DATABASE_URL: "postgresql://app_platform@localhost/solar", CONSOLE_SESSION_SECRET: "b".repeat(32) }]] as const) {
    assert.equal("RESEND_DOMAINS_API_KEY" in schema.parse({ ...base, RESEND_DOMAINS_API_KEY: "domain-key" }), false);
  }
});
