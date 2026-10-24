import assert from "node:assert/strict";
import test from "node:test";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server.js";
import { config } from "../proxy.ts";

test("local upload bypasses proxy body cloning; reservation, complete and reads retain proxy", () => {
  const upload = "/api/media/019a06e0-1234-7000-8000-000000000001/upload";
  for (const url of [upload, `${upload}/`, `${upload}?x=1`]) assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }), false, url);
  for (const url of ["/api/media", "/api/media/019a06e0-1234-7000-8000-000000000001", "/api/media/019a06e0-1234-7000-8000-000000000001/complete", `${upload}/nested`, "/api/session"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }), true, url);
  }
});
