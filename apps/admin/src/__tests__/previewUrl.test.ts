import assert from "node:assert/strict";
import { test } from "node:test";
import { previewUrl } from "../lib/previewUrl.ts";
test("preview URL uses tenant web port only in dev", () => {
  for (const production of [false, true]) {
    const url = new URL(previewUrl({ slug: "a", platform: "solar.vn", path: "/gioi-thieu", token: "token", production, port: "3212" }));
    assert.equal(url.origin, production ? "https://a.preview.solar.vn" : "http://a.preview.solar.vn:3212");
    assert.equal(url.searchParams.get("path"), "/gioi-thieu"); assert.equal(url.searchParams.get("token"), "token");
  }
});
