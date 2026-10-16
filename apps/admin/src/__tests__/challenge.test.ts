import assert from "node:assert/strict";
import { test } from "node:test";
import { sealChallenge, openChallenge } from "../lib/challenge.ts";

test("challenge encrypts credentials, binds tenant/purpose/session, expires and rejects tampering", () => {
  const data = { identifier: "owner@demo.vn", password: "secret-value" };
  const token = sealChallenge(data, "a", "login", "s".repeat(32), 1000);
  assert.equal(token.includes(data.password), false);
  assert.deepEqual(openChallenge(token, "a", "login", "s".repeat(32), 1001), data);
  for (const [value, tenant, purpose, secret, time] of [[token, "b", "login", "s".repeat(32), 1001], [token, "a", "setup", "s".repeat(32), 1001], [token, "a", "login", "x".repeat(32), 1001], [token, "a", "login", "s".repeat(32), 301001], [token + "x", "a", "login", "s".repeat(32), 1001]] as const) {
    assert.equal(openChallenge(value, tenant, purpose, secret, time), null);
  }
});
