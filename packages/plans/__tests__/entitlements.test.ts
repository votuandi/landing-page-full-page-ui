import assert from "node:assert/strict";
import test from "node:test";
import { assertCan, assertWithinLimit, can, canUse, EntitlementError, featureOverridesSchema, disabledFeaturesSchema, limit, TRIAL_DAYS, type EntitlementSubject } from "../index";

const now = new Date("2026-10-15T00:00:00Z");
const later = "2026-11-01T00:00:00Z", earlier = "2026-10-01T00:00:00Z";
const site = (patch: Partial<EntitlementSubject> = {}): EntitlementSubject => ({ planId: "pro", addons: [], status: "active", createdAt: new Date("2026-01-01T00:00:00Z"), ...patch });

test("resolution table (D19): kill switch > tenant override > plan + addons + trial", () => {
  const rows: [string, EntitlementSubject, string[], string, boolean][] = [
    ["kill switch beats override on", site({ featureOverrides: { shorts: { on: true, reason: "tặng" } } }), ["shorts"], "shorts", false],
    ["kill switch beats plan", site(), ["calculator"], "calculator", false],
    ["override on beats plan", site({ featureOverrides: { shorts: { on: true, until: later, reason: "tặng" } } }), [], "shorts", true],
    ["override off beats plan", site({ planId: "premium", featureOverrides: { shorts: { on: false, reason: "vi phạm" } } }), [], "shorts", false],
    ["override off beats addon", site({ addons: ["shorts"], featureOverrides: { shorts: { on: false, reason: "x" } } }), [], "shorts", false],
    ["expired override on → plan", site({ featureOverrides: { shorts: { on: true, until: earlier, reason: "hết hạn" } } }), [], "shorts", false],
    ["expired override off → plan", site({ featureOverrides: { calculator: { on: false, until: earlier, reason: "hết hạn" } } }), [], "calculator", true],
    ["override without reason is ignored", site({ featureOverrides: { shorts: { on: true } } }), [], "shorts", false],
    ["malformed overrides ignored", site({ featureOverrides: "bad" }), [], "calculator", true],
    ["plan feature", site(), [], "calculator", true],
    ["outside plan", site(), [], "shorts", false],
    ["addon", site({ addons: ["shorts"] }), [], "shorts", true],
    ["unknown feature", site({ addons: ["unknown"] }), [], "unknown", false],
    ["unknown plan", site({ planId: "missing" }), [], "leadForm", false],
    ["suspended tenant", site({ planId: "premium", status: "suspended" }), [], "leadForm", false],
    ["trial day 13 → premium", site({ planId: "basic", status: "trial", createdAt: new Date(now.getTime() - 13 * 86_400_000) }), [], "shorts", true],
    ["trial expired → plan", site({ planId: "basic", status: "trial", createdAt: new Date(now.getTime() - TRIAL_DAYS * 86_400_000) }), [], "shorts", false],
    ["quoteCart needs catalog", site({ addons: ["quoteCart"] }), [], "quoteCart", false],
    ["quoteCart + catalog addons", site({ addons: ["quoteCart", "catalog"] }), [], "quoteCart", true],
    ["kill switch on prerequisite", site({ planId: "premium" }), ["catalog"], "quoteCart", false],
  ];
  for (const [name, subject, disabled, feature, expected] of rows) assert.equal(can(subject, feature, { disabled, now }), expected, name);
  assert.equal(canUse(site(), { now })("calculator"), true);
});

test("limit() adds unexpired limitOverrides to the plan", () => {
  assert.equal(limit(site(), "mediaGb", { now }), 5);
  assert.equal(limit(site({ limitOverrides: { mediaGb: { add: 10, until: later, reason: "mua thêm" } } }), "mediaGb", { now }), 15);
  assert.equal(limit(site({ limitOverrides: { mediaGb: { add: 10, until: earlier, reason: "hết hạn" } } }), "mediaGb", { now }), 5);
  assert.equal(limit(site({ limitOverrides: { mediaGb: { add: -3, reason: "âm" } } }), "mediaGb", { now }), 5);
  assert.equal(limit(site({ planId: "missing" }), "pages", { now }), 0);
});

test("assertCan / assertWithinLimit throw EntitlementError with Vietnamese messages", () => {
  assert.doesNotThrow(() => assertCan(site(), "calculator", { now }));
  assert.throws(() => assertCan(site(), "quoteCart", { now }), (error: unknown) =>
    error instanceof EntitlementError && error.status === 403 && error.code === "quoteCart" && /Giỏ báo giá/.test(error.message));
  const GB = 1024 ** 3;
  assert.doesNotThrow(() => assertWithinLimit(site(), "mediaGb", 4 * GB, GB, { now }));
  assert.throws(() => assertWithinLimit(site(), "mediaGb", 4.5 * GB, GB, { now }), (error: unknown) =>
    error instanceof EntitlementError && error.status === 413 && /Vượt dung lượng media của gói/.test(error.message) && /5 GB/.test(error.message));
  assert.throws(() => assertWithinLimit(site(), "domains", 1, 1, { now }), (error: unknown) => error instanceof EntitlementError && error.status === 403);
});

test("override schemas validate admin input; disabled list drops unknown names", () => {
  assert.equal(featureOverridesSchema.safeParse({ shorts: { on: true, reason: "ok" } }).success, true);
  assert.equal(featureOverridesSchema.safeParse({ unknown: { on: true, reason: "ok" } }).success, false);
  assert.equal(featureOverridesSchema.safeParse({ shorts: { on: true, reason: " " } }).success, false);
  assert.deepEqual(disabledFeaturesSchema.parse(["shorts", "nope"]), ["shorts"]);
});
