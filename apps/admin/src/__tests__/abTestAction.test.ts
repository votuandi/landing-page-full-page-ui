import assert from "node:assert/strict";
import test from "node:test";
import { effectivePermissions, type Session } from "@solar/auth";
import { StructureError } from "@solar/db";
import { createAction } from "../lib/action.ts";
import { abTestFormSchema, createAbTestHandler } from "../lib/abTest.ts";

const tenantId = "e8000000-0000-4000-8000-000000000001", siteId = "e8000000-0000-4000-8000-000000000002", pageId = "e8000000-0000-4000-8000-000000000003";
const owner = { realm: "site", tenantId, audience: "admin", kind: "user", role: "owner", permissions: effectivePermissions({ role: "owner", audience: "admin" }), mustChangePassword: false } as Session;
const values = { pageId, action: "start", lead: "B", highlight: "Nhấn mạnh", sub: "", subHighlight: "", ctaLabel: "Nút B", leadEn: "English B" };
const input = (patch: Record<string, string> = {}) => { const f = new FormData(); for (const [k, v] of Object.entries({ ...values, ...patch })) f.set(k, v); return f; };
test("A/B action: quyền trước đọc, pro/khác tenant/site chặn, VI/EN, start/save/end status", async () => {
  let reads = 0, writes = 0, allowed = true, currentSite = siteId, running = false;
  const handler = createAbTestHandler({ tenant: async () => { reads++; return { tenantId, siteId }; }, entitlements: async () => () => allowed,
    page: async () => ({ siteId: currentSite, abTest: running ? { id: pageId, status: "running", title: { lead: { vi: "A" }, highlight: { vi: "" }, sub: { vi: "" }, subHighlight: { vi: "" } }, ctaLabel: { vi: "A" } } : null }),
    save: async (t, data) => { writes++; assert.equal(t, tenantId); if (data.action === "start") { assert.deepEqual(data.title.lead, { vi: "B", en: "English B" }); } },
  });
  const run = (session = owner, t = tenantId) => createAction(async () => ({ tenantId: t, slug: "demo", session }))("pages.structure", abTestFormSchema, handler);
  const viewer = { ...owner, permissions: effectivePermissions({ role: "viewer", audience: "admin" }) };
  assert.equal((await run(viewer)({}, input())).status, 403); assert.equal(reads, 0);
  assert.equal((await run(owner, siteId)({}, input())).status, 401);
  assert.equal((await handler(abTestFormSchema.parse(values), { tenantId: siteId, slug: "demo", session: owner })).status, 404);
  allowed = false; assert.equal((await run()({}, input())).status, 400); allowed = true;
  currentSite = "foreign"; assert.equal((await run()({}, input())).status, 404); currentSite = siteId;
  assert.equal((await run()({}, input())).message, "Đã bắt đầu thử nghiệm A/B");
  running = true; assert.equal((await run()({}, input())).message, "Đã lưu phiên bản B");
  assert.equal((await run()({}, input({ action: "end", winner: "B" }))).message, "Đã chọn phiên bản B");
  assert.equal(writes, 3);
  assert.equal((await run()({}, input({ lead: "a".repeat(61) }))).status, 400);
});
test("A/B action: StructureError thành lỗi tiếng Việt 400", async () => {
  const handler = createAbTestHandler({ tenant: async () => ({ tenantId, siteId }), entitlements: async () => () => true,
    page: async () => ({ siteId, abTest: null }), save: async () => { throw new StructureError("Trang không có hero đang bật"); } });
  const result = await handler(abTestFormSchema.parse(values), { tenantId, slug: "demo", session: owner });
  assert.equal(result.status, 400); assert.match(result.error!, /hero/);
});
