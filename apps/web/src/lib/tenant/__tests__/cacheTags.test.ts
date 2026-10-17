import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidTag } from "@solar/cache";
import { COLLECTIONS, tenantPageTags } from "../cacheTags";

const a = "11111111-1111-4111-8111-111111111111";
const b = "22222222-2222-4222-8222-222222222222";

test("tenant page tags cover the S05 contract and never another tenant", () => {
  const tags = tenantPageTags(a, "lien-he");
  for (const tag of [`tenant:${a}`, `tenant:${a}:site`, `tenant:${a}:page:lien-he`, `tenant:${a}:collection:product`, "platform:entitlements"]) assert.ok(tags.includes(tag), tag);
  assert.equal(tags.length, 3 + COLLECTIONS.length + 1);
  assert.ok(tags.every(isValidTag));
  assert.ok(!tags.some((tag) => tag.includes(b)));
  assert.deepEqual(tenantPageTags(a, "").filter((tag) => tag.includes(":page:")), [`tenant:${a}:page:`]);
});
