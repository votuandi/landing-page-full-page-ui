import assert from "node:assert/strict";
import { test } from "node:test";
import { getHostResolver, invalidateHosts } from "../index";

test("resolver fails clearly without DATABASE_URL instead of serving a fallback tenant", () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try { assert.throws(getHostResolver, /MULTI_TENANT=1 requires DATABASE_URL/); }
  finally { if (previous !== undefined) process.env.DATABASE_URL = previous; }
});

test("invalidation rejects malformed hosts before starting a resolver", async () => {
  await assert.rejects(invalidateHosts(["tenant.localhost/evil"]), /Invalid hostname/);
});
