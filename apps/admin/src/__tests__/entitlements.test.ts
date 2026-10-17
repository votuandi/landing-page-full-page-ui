import assert from "node:assert/strict";
import { test } from "node:test";
import { canUse, type EntitlementSubject } from "@solar/plans";
import { assertPageFeature } from "../lib/entitlements.ts";

const site: EntitlementSubject = { planId: "pro", addons: [], status: "active", createdAt: new Date("2026-01-01") };

test("page feature guard permits entitled features and returns Next 404 for unavailable ones without a DB", () => {
  assert.doesNotThrow(() => assertPageFeature(canUse(site), "leadInbox"));
  for (const can of [
    canUse({ ...site, planId: "basic" }),
    canUse(site, { disabled: ["leadInbox"] }),
    canUse({ ...site, featureOverrides: { leadInbox: { on: false, reason: "Tạm tắt" } } }),
    canUse({ ...site, status: "suspended" }),
  ]) assert.throws(() => assertPageFeature(can, "leadInbox"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
});
