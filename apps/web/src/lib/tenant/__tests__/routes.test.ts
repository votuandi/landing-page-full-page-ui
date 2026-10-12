import assert from "node:assert/strict";
import test from "node:test";
import { resolveRoute } from "../routes";

test("public route matrix preserves Vietnamese slugs and reserves system routes", () => {
  assert.deepEqual(resolveRoute([]), { kind: "page", slug: "" });
  for (const [prefix, collection] of [["san-pham", "product"], ["cong-trinh", "project"], ["giai-phap", "service"], ["tin-tuc", "post"]]) {
    assert.deepEqual(resolveRoute([prefix, "slug"]), { kind: "detail", collection, slug: "slug" });
    assert.equal(resolveRoute([prefix, "slug", "extra"]), null);
  }
  assert.equal(resolveRoute(["cong-trinh"]), null);
  assert.equal(resolveRoute(["robots.txt"]), null);
  assert.equal(resolveRoute([".."]), null);
  assert.deepEqual(resolveRoute(["uu-dai", "nang-luong"]), { kind: "page", slug: "uu-dai/nang-luong" });
});
