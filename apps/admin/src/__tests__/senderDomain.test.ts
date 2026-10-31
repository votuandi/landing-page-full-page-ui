import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { effectivePermissions, type Session, type Permission } from "@solar/auth";
import { createAction, type ActionContext } from "../lib/action.ts";
import { createSenderDomainHandlers, senderHostnameSchema, senderEmptySchema, type SendingDomainRow, type SenderDomainDeps } from "../lib/senderDomain.ts";
import type { ResendDomain } from "@solar/leads";

function setup() {
  const tenantId = randomUUID(); let row: SendingDomainRow | null = null, created = 0, reads = 0;
  const provider: ResendDomain = { id: randomUUID(), name: "mail.congty.vn", status: "pending", records: [{ name: "send", type: "MX", value: "mx.example.vn", priority: 10 }] };
  const audits: string[] = [], scopes: string[] = [];
  const session: Session = { id: randomUUID(), accountId: randomUUID(), tenantId, realm: "site", audience: "admin", kind: "user", role: "owner", permissions: effectivePermissions({ role: "owner", audience: "admin" }), expiresAt: new Date(Date.now() + 60000), mustChangePassword: false };
  const context: ActionContext = { tenantId, slug: "mau", session };
  const deps: SenderDomainDeps = {
    env: { RESEND_DOMAINS_API_KEY: "hidden-key" }, reserved: ["platform.vn", "system.vn"], can: async () => () => true,
    get: async tenant => { scopes.push(tenant); reads++; return tenant === row?.tenantId ? row : null; },
    reserve: async (tenant, _session, hostname) => {
      scopes.push(tenant);
      if (row) throw Object.assign(new Error("unique owner-secret"), { code: "P2002" });
      row = { id: randomUUID(), tenantId: tenant, hostname, status: "pending", providerId: null, records: [], verifiedAt: null }; return row;
    },
    update: async (tenant, _session, before, patch, action) => {
      scopes.push(tenant); if (row?.id !== before.id) return false;
      row = { ...row, ...patch }; audits.push(action); return true;
    },
    remove: async (tenant, _session, before) => { scopes.push(tenant); if (row?.id !== before.id) return false; row = null; audits.push("remove"); return true; },
    provider: { create: async hostname => { assert.ok(row, "reserve before API"); assert.equal(hostname, "mail.congty.vn"); created++; return provider; },
      get: async id => { assert.equal(id, provider.id); return provider; }, verify: async id => { assert.equal(id, provider.id); }, remove: async id => { assert.equal(id, provider.id); } },
  };
  const handlers = createSenderDomainHandlers(deps), action = createAction(async () => context);
  const run = (operation: "add" | "check" | "remove", hostname = " Mail.CongTy.VN. ") => {
    const form = new FormData(); if (operation === "add") form.set("hostname", hostname);
    return operation === "add" ? action("email.manage", senderHostnameSchema, handlers.add)({}, form)
      : action("email.manage", senderEmptySchema, handlers[operation])({}, form);
  };
  return { deps, run, context, provider, audits, scopes, get row() { return row; }, get created() { return created; }, get reads() { return reads; } };
}

test("thêm tên miền chuẩn hóa rồi tạo ở nhà cung cấp; giữ DNS priority, audit", async () => {
  const s = setup(); assert.equal((await s.run("add")).ok, true);
  assert.equal(s.row?.hostname, "mail.congty.vn"); assert.equal(s.created, 1);
  assert.deepEqual(s.row?.records, s.provider.records); assert.deepEqual(s.audits, ["add"]);
  assert.ok(s.scopes.every(tenant => tenant === s.context.tenantId));
  assert.equal((await s.run("add")).status, 400); assert.equal(s.created, 1);
});

test("gói thấp bị 403 ở mọi action trước truy vấn", async () => {
  const s = setup(); s.deps.can = async () => () => false;
  for (const operation of ["add", "check", "remove"] as const) assert.equal((await s.run(operation)).status, 403);
  assert.equal(s.reads, 0); assert.equal(s.created, 0);
});

test("phiên client, thiếu email.manage, tenant khác bị chặn trước dữ liệu", async () => {
  for (const patch of [{ role: "client" as const, audience: "storefront" as const }, { permissions: new Set<Permission>() }, { tenantId: randomUUID() }]) {
    const s = setup(); s.context.session = { ...s.context.session!, ...patch };
    for (const operation of ["add", "check", "remove"] as const) assert.ok([401, 403].includes((await s.run(operation)).status!));
    assert.equal(s.reads, 0); assert.equal(s.created, 0);
  }
});

test("kiểm tra đồng bộ trạng thái; temporary_failure không giữ verified", async () => {
  const s = setup(); await s.run("add");
  for (const status of ["pending", "verified", "temporary_failure", "failed", "not_started"]) {
    s.provider.status = status;
    const result = await s.run("check"); assert.equal(result.ok, true);
    assert.equal(s.row?.status, status === "verified" ? "verified" : status === "failed" ? "failed" : "pending");
    assert.equal(s.row?.verifiedAt instanceof Date, status === "verified");
  }
});

test("POST lỗi xóa giữ chỗ; thiếu khóa không tạo hàng; unique không lộ chủ", async () => {
  const s = setup(), create = s.deps.provider.create;
  s.deps.provider.create = async () => { throw new Error("hidden-key secret provider URL"); };
  const failure = await s.run("add"); assert.equal(failure.status, 400); assert.ok(!/hidden-key|secret|URL/.test(failure.error!));
  assert.equal(s.row, null); s.deps.provider.create = create; assert.equal((await s.run("add")).ok, true);
  const unique = await s.run("add"); assert.equal(unique.status, 400); assert.ok(!unique.error?.includes("owner-secret"));
  const empty = setup(); empty.deps.env = {}; assert.match((await empty.run("add")).error!, /chưa cấu hình/);
  assert.equal(empty.row, null);
});

test("hàng kẹt providerId null xóa được không gọi Resend; check hướng dẫn thêm lại", async () => {
  const s = setup(); await s.deps.reserve(s.context.tenantId, s.context.session!, "mail.congty.vn");
  s.deps.env = {};
  for (const key of ["get", "verify", "remove"] as const) s.deps.provider[key] = async () => { assert.fail("no provider call"); };
  assert.match((await s.run("check")).error!, /xóa.*thêm lại/);
  assert.equal((await s.run("remove")).ok, true); assert.equal(s.row, null);
});

test("check/remove lỗi nhà cung cấp giữ dữ liệu; status không đổi; missing an toàn", async () => {
  const s = setup(); assert.equal((await s.run("check")).status, 404);
  await s.run("add");
  s.deps.provider.get = async () => { throw new Error("hidden-key"); };
  assert.equal((await s.run("check")).status, 400); assert.equal(s.row?.status, "pending");
  s.deps.provider.remove = async () => { throw new Error("hidden-key"); };
  assert.equal((await s.run("remove")).status, 400); assert.ok(s.row);
  s.deps.provider.remove = async () => {}; assert.equal((await s.run("remove")).ok, true);
  assert.equal((await s.run("remove")).status, 404);
});

test("tên miền nền tảng bị cấm trước khi giữ chỗ", async () => {
  const s = setup(); for (const hostname of ["platform.vn", "x.platform.vn", "x.system.vn"]) assert.equal((await s.run("add", hostname)).status, 400);
  assert.equal(s.created, 0); assert.equal(s.row, null);
});

test("hai lần add đồng thời chỉ tạo một domain nhà cung cấp", async () => {
  const s = setup();
  const results = await Promise.all([s.run("add"), s.run("add")]);
  assert.equal(results.filter(result => result.ok).length, 1); assert.equal(s.created, 1);
});

test("reservation bị xóa khi POST đang chạy: dọn provider mới, không gắn sang hàng khác", async () => {
  const s = setup(); let removed = 0;
  s.deps.provider.create = async () => {
    await s.deps.remove(s.context.tenantId, s.context.session!, s.row!); return s.provider;
  };
  s.deps.provider.remove = async id => { assert.equal(id, s.provider.id); removed++; };
  assert.equal((await s.run("add")).status, 404); assert.equal(removed, 1); assert.equal(s.row, null);
});

test("phản hồi domain khác không được dùng để xác minh tenant", async () => {
  const s = setup(); await s.run("add"); s.provider.name = "mail.other.vn"; s.provider.status = "verified";
  assert.equal((await s.run("check")).status, 400); assert.equal(s.row?.status, "pending");
});
