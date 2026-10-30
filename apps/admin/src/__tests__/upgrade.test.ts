import assert from "node:assert/strict";
import { test } from "node:test";
import { createAction, type ActionContext } from "../lib/action.ts";
import { createUpgradeHandler, upgradeSchema, type UpgradeDeps } from "../lib/upgrade.ts";
import { setup as settings } from "./siteSettings.test.ts";

function setup() {
  const context = settings().context;
  const rows: { tenantId: string; feature: string; message?: string; actorId: string; createdAt: Date }[] = [];
  let now = new Date("2026-10-22T00:00:00Z");
  const deps: UpgradeDeps = {
    tenant: async () => ({ tenantId: context.tenantId, planId: "basic" }),
    entitlements: async () => feature => feature === "leadForm",
    now: () => now,
    record: async (input, since) => {
      if (!rows.some(r => r.tenantId === input.tenantId && r.feature === input.feature && r.createdAt > since)) rows.push({ ...input, createdAt: now });
    },
  };
  const action = createAction(async () => context)("session", upgradeSchema, createUpgradeHandler(deps));
  const send = (feature = "shorts", message = "Tư vấn giúp tôi") => { const f = new FormData(); f.set("feature", feature); f.set("message", message); return action({}, f); };
  return { context, rows, send, deps, later: () => { now = new Date(now.getTime() + 86_400_000); } };
}

test("accepts limit:users", async () => {
  const s = setup();
  s.deps.entitlements = async () => { throw new Error("limits are not feature availability"); };
  assert.equal((await s.send("limit:users")).ok, true);
  assert.equal(s.rows[0]?.feature, "limit:users");
});
test("ghi AuditLog qua dependency tenant, feature, message, actor", async () => {
  const s = setup(); assert.equal((await s.send()).ok, true);
  assert.equal(s.rows.length, 1); assert.equal(s.rows[0].tenantId, s.context.tenantId);
  assert.equal(s.rows[0].actorId, s.context.session!.accountId); assert.equal(s.rows[0].feature, "shorts"); assert.equal(s.rows[0].message, "Tư vấn giúp tôi");
});
test("tenant khác / không phiên / storefront không ghi", async () => {
  for (const change of [ (c: ActionContext) => { c.session = null; }, (c: ActionContext) => { c.session!.tenantId = "other"; }, (c: ActionContext) => { c.session!.audience = "storefront"; }, (c: ActionContext) => { c.session!.realm = "platform"; }, (c: ActionContext) => { c.session!.role = "client"; } ]) {
    const s = setup(); change(s.context); assert.equal((await s.send()).status, 401); assert.equal(s.rows.length, 0);
  }
  const s = setup(); s.deps.tenant = async () => ({ tenantId: "other", planId: "basic" });
  assert.equal((await s.send()).status, 403); assert.equal(s.rows.length, 0);
  const ghost = setup(); ghost.context.session!.kind = "ghost";
  assert.equal((await ghost.send()).status, 403); assert.equal(ghost.rows.length, 0);
});
test("input lạ, quá dài, feature có trong gói không ghi", async () => {
  const s = setup();
  for (const [feature, message] of [["unknown", ""], ["theme:unknown", ""], ["shorts", "x".repeat(1001)], ["leadForm", ""], ["theme:classic", ""]]) assert.equal((await s.send(feature, message)).status, 400);
  assert.equal(s.rows.length, 0);
  assert.equal((await s.send("theme:signature", "")).ok, true);
});
test("chống trùng trong 24h; feature khác và hết 24h được gửi", async () => {
  const s = setup(); await s.send(); await s.send(); assert.equal(s.rows.length, 1);
  await s.send("theme:signature"); assert.equal(s.rows.length, 2);
  s.later(); await s.send(); assert.equal(s.rows.length, 3);
});
