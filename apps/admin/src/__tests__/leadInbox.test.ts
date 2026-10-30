import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { effectivePermissions, type Session } from "@solar/auth";
import { createAction, createRoute, type ActionContext } from "../lib/action.ts";
import { createLeadInboxHandlers, parseFilters, summarize, weeklyStats, leadCsvRows, updateSchema, idSchema, resendSchema, type LeadInboxDeps } from "../lib/leadInbox.ts";

test("leadInbox parseFilters ignores garbage and uses Vietnam date bounds", () => {
  assert.deepEqual(parseFilters(new URLSearchParams("trang-thai=xyz&tu=2026-02-30&den=no&q=%20")), {});
  assert.deepEqual(parseFilters(new URLSearchParams("trang-thai=won&nguon=dealer&q=0901&tu=2026-10-25&den=2026-10-25")), {
    status: "won", source: "dealer", q: "0901", from: "2026-10-24T17:00:00.000Z", until: "2026-10-25T17:00:00.000Z",
  });
  assert.deepEqual(parseFilters(new URLSearchParams("tu=2026-10-29&den=2026-10-01")), {});
});
test("leadInbox summarize handles legacy/malformed JSON, estimate and cart", () => {
  assert.deepEqual(summarize(null), { province: "—", estimate: "—", items: "—", consentAt: "—" });
  assert.match(summarize({ estimate: { kWp: 5 }, items: [{ name: "Pin", qty: 2 }], province: "Hà Nội" }).estimate, /5 kWp/);
  assert.equal(summarize({ items: [{ name: "Pin", qty: 2 }] }).items, "2 × Pin");
  assert.equal(summarize({ items: [null, {}, "bad"] }).items, "—");
});
test("leadInbox schema accepts quoted/spam and 2000 note, rejects 2001 and bad assignments", () => {
  const id = randomUUID();
  for (const status of ["quoted", "spam"]) assert.ok(updateSchema.safeParse({ id, status, note: "x".repeat(2000) }).success);
  assert.ok(!updateSchema.safeParse({ id, note: "x".repeat(2001) }).success);
  assert.ok(!updateSchema.safeParse({ id, assigneeId: "other" }).success);
});
test("leadInbox weeklyStats Sunday 23:30 VN stays in that week, totals source × week", () => {
  const result = weeklyStats([
    { source: "dealer", createdAt: new Date("2026-10-25T16:30:00Z"), count: 1 },
    { source: "dealer", createdAt: new Date("2026-10-25T17:30:00Z"), count: 1 },
    { source: "contact", createdAt: new Date("2026-10-26T01:00:00Z"), count: 1 },
  ]);
  assert.deepEqual(result.weeks, ["2026-10-19", "2026-10-26"]);
  assert.deepEqual(result.rows, [{ source: "contact", counts: [0, 1], total: 1 }, { source: "dealer", counts: [1, 1], total: 2 }]);
});
test("leadInbox csv has one BOM, CRLF, Vietnamese, quotes and neutralizes formulas", () => {
  const row = { id: randomUUID(), source: "contact", phone: "0901234567", name: "Nguyễn Văn Á", status: "new", createdAt: new Date("2026-10-29"), data: {}, note: '=1+1,"x"\nnext' };
  const csv = leadCsvRows([row]);
  assert.deepEqual([...Buffer.from(csv).subarray(0, 3)], [239, 187, 191]);
  assert.equal(csv.split("\uFEFF").length, 2);
  assert.match(csv, /Nguyễn Văn Á/); assert.match(csv, /"'=1\+1,""x""\nnext"/); assert.match(csv, /\r\n/);
  for (const name of ["=1", "+1", "-1", "@a", "\tformula", "\rformula", "  =1"]) assert.ok(leadCsvRows([{ ...row, name }]).includes(`'${name}`));
});

function setup() {
  const tenantId = randomUUID();
  const session: Session = { id: randomUUID(), accountId: randomUUID(), tenantId, realm: "site", audience: "admin", kind: "user", role: "owner", permissions: effectivePermissions({ role: "owner", audience: "admin" }), expiresAt: new Date(Date.now() + 60000), mustChangePassword: false };
  const ctx: ActionContext = { tenantId, slug: "mau", session };
  const calls: unknown[] = [], allowed = new Set(["leadInbox", "leadExport", "leadAssign"]);
  const deps: LeadInboxDeps = {
    can: async () => feature => allowed.has(feature),
    list: async (tenant, filters, options) => { calls.push({ tenant, filters, options }); return { rows: [], cursor: null }; },
    latest: async tenant => { calls.push(tenant); return null; },
    update: async (...args) => { calls.push(args); return true; },
    remove: async (...args) => { calls.push(args); return true; },
    resend: async (...args) => { calls.push(args); return true; },
    auditExport: async (...args) => { calls.push(args); },
  };
  const handlers = createLeadInboxHandlers(deps), action = createAction(async () => ctx), route = createRoute(async () => ctx);
  const run = (kind: "update" | "remove" | "resend", data: Record<string, string>) => {
    const form = new FormData(); Object.entries(data).forEach(([key, value]) => form.set(key, value));
    if (kind === "update") return action("leads.manage", updateSchema, handlers.update)({}, form);
    if (kind === "resend") return action("leads.manage", resendSchema, handlers.resend)({}, form);
    return action("leads.manage", idSchema, handlers.remove)({}, form);
  };
  return { ctx, deps, calls, allowed, handlers, run, csv: route("leads.view", handlers.export), latest: route("leads.view", handlers.latest) };
}
test("leadInbox permissions and entitlements checked server-side before I/O", async () => {
  const s = setup(), id = randomUUID();
  s.allowed.delete("leadAssign");
  assert.equal((await s.run("update", { id, assigneeId: randomUUID() })).status, 403);
  assert.equal((await s.run("update", { id, branchId: "" })).status, 403);
  assert.equal(s.calls.length, 0);
  s.allowed.delete("leadExport"); assert.equal((await s.csv(new Request("https://a/api/lead/csv"))).status, 403);
  s.allowed.delete("leadInbox");
  assert.equal((await s.latest(new Request("https://a/api/lead/moi-nhat"))).status, 403);
  assert.equal((await s.run("remove", { id })).status, 403);
  s.ctx.session = { ...s.ctx.session!, permissions: new Set() };
  assert.equal((await s.csv(new Request("https://a/api/lead/csv"))).status, 403);
  s.ctx.session = { ...s.ctx.session, permissions: new Set(["leads.view"]) };
  assert.equal((await s.run("update", { id, note: "a" })).status, 403);
  assert.equal(s.calls.length, 0);
});
test("leadInbox CSV applies list filters, private no-store and export audit excludes PII", async () => {
  const s = setup();
  const response = await s.csv(new Request("https://a/api/lead/csv?nguon=dealer&q=PRIVATE-PHONE"));
  assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.equal(JSON.stringify(s.calls.at(-1)).includes("PRIVATE-PHONE"), false);
  assert.equal((s.calls[0] as {filters: {source: string}}).filters.source, "dealer");
});

test("leadInbox actions: valid pro update, server validation and missing lead/job never succeed", async () => {
  const s = setup(), id = randomUUID();
  s.allowed.delete("leadAssign");
  assert.equal((await s.run("update", { id, status: "quoted", note: "x".repeat(2000) })).ok, true);
  assert.equal((s.calls[0] as unknown[])[0], s.ctx.tenantId);
  assert.equal((await s.run("update", { id, note: "x".repeat(2001) })).status, 400);
  s.deps.update = async () => false; s.deps.remove = async () => false; s.deps.resend = async () => false;
  assert.equal((await s.run("update", { id, status: "won" })).status, 404);
  assert.equal((await s.run("remove", { id })).status, 404);
  assert.equal((await s.run("resend", { id, jobId: randomUUID() })).status, 404);
});

test("leadInbox export visits every cursor with the same filters and latest response is private", async () => {
  const s = setup(), cursor = randomUUID();
  let page = 0;
  s.deps.list = async (tenant, filters, options) => {
    assert.equal(tenant, s.ctx.tenantId); assert.deepEqual(filters, { source: "dealer", q: "0901" });
    assert.equal(options?.cursor, page === 0 ? undefined : cursor);
    return { rows: [], cursor: page++ === 0 ? cursor : null };
  };
  assert.equal((await s.csv(new Request("https://a/api/lead/csv?nguon=dealer&q=0901"))).status, 200);
  assert.equal(page, 2);
  const latest = await s.latest(new Request("https://a/api/lead/moi-nhat"));
  assert.equal(latest.headers.get("cache-control"), "private, no-store"); assert.deepEqual(await latest.json(), { latest: null });
});
