import assert from "node:assert/strict";
import { test } from "node:test";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config } from "../proxy.ts";

test("health bypasses host proxy", () => {
  for (const url of ["/api/health", "/api/health/", "/api/health?probe=1"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), false, url);
  }
  for (const url of ["/api/lead", "/api/health-private", "/api/health/other"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, url }), true, url);
  }
});
