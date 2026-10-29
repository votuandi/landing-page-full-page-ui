import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createPlatformDb, forTenant } from "@solar/db";
import { effectivePermissions, type Session } from "@solar/auth";
import { createLeadChannelHandlers } from "../lib/leadChannels.ts";
import { leadChannelDeps } from "../lib/leadChannelsRuntime.ts";
import { getRuntime } from "../lib/runtime.ts";

test("Postgres lead channels: mã hóa/AAD, tenant A sửa/xóa id B bị chặn, audit không chứa config", {
  skip: !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL),
}, async () => {
  process.env.ADMIN_SESSION_SECRET ??= "lead-channels-integration-secret-0123456789";
  process.env.PLATFORM_DOMAIN ??= "solar.localhost";
  const platform = createPlatformDb({ pool: 1 }), tenantId = randomUUID(), otherId = randomUUID();
  const session: Session = { id: randomUUID(), tenantId, realm: "site", audience: "admin", kind: "user", role: "owner", accountId: randomUUID(),
    permissions: effectivePermissions({ role: "owner", audience: "admin" }), mustChangePassword: false, expiresAt: new Date(Date.now() + 60000) };
  const context = { tenantId, slug: "mau", session };
  const deps = { ...leadChannelDeps, env: { APP_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64") }, can: async () => () => true, validateUrl: async () => {}, send: async () => {} };
  const handlers = createLeadChannelHandlers(deps);
  try {
    for (const id of [tenantId, otherId]) await platform.tenant.create({ data: { id, slug: id, name: "[DỮ LIỆU MẪU]", planId: "pro", status: "active" } });
    const save = (payload: unknown, ctx = context) => handlers.save({ payload: JSON.stringify(payload) }, ctx);
    assert.equal((await save({ kind: "telegram", name: "Nhóm", config: { chatId: "-1001234" } })).ok, true);
    assert.equal((await save({ kind: "email", name: "Email", config: { to: ["a@x.vn"] } })).ok, true);
    const rows = await deps.list(tenantId);
    assert.equal(rows.length, 2);
    for (const row of rows) { assert.match(row.configEncrypted, /^v1\./); assert.ok(!row.configEncrypted.includes("-1001234")); }
    const id = rows[0].id, foreign = { ...context, tenantId: otherId, session: { ...session, tenantId: otherId } };
    assert.equal((await save({ id, kind: rows[0].kind, name: "Đổi", config: {} }, foreign)).status, 404);
    assert.equal((await handlers.remove({ id }, foreign)).status, 404);
    assert.equal((await handlers.test({ id }, foreign)).status, 404);
    assert.ok(await deps.get(tenantId, id)); assert.equal(await deps.get(otherId, id), null);
    const audits = await forTenant(getRuntime().db, tenantId).auditLog.list({ where: { entity: "LeadIntegration" } });
    assert.equal(audits.length, 2);
    assert.ok(!JSON.stringify(audits).includes("-1001234")); assert.ok(!JSON.stringify(audits).includes("configEncrypted"));
  } finally {
    await platform.tenant.deleteMany({ where: { id: { in: [tenantId, otherId] } } });
    await platform.$disconnect(); await getRuntime().close();
  }
});
