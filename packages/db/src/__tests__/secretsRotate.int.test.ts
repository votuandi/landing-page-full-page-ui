import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { decryptSecret, encryptSecret, needsRotation, type SecretContext } from "@solar/env/secrets";
import { createPlatformDb, forTenant } from "../index.ts";
import { rotateIntegrationSecrets } from "../secretsRotate.ts";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "requires migrated PostgreSQL";
test("re-encrypt mọi tenant + AuditLog; giá trị cũ không đúng định dạng giữ nguyên; idempotent", { skip }, async () => {
  const db = createPlatformDb({ pool: 2 });
  const ids = [randomUUID(), randomUUID()];
  const oldKey = Buffer.alloc(32, 1).toString("base64"), newKey = Buffer.alloc(32, 2).toString("base64");
  const ring = `${newKey},${oldKey}`;
  const rotate = (value: string, context: SecretContext) => !value.startsWith("v1.") ? null
    : needsRotation(value, ring, context) ? encryptSecret(decryptSecret(value, ring, context), ring, context) : value;
  const rows: { tenantId: string; id: string; text: string }[] = [];
  try {
    for (const [index, tenantId] of ids.entries()) {
      await db.tenant.create({ data: { id: tenantId, slug: `rotate-${tenantId}`, name: "[DỮ LIỆU MẪU] Rotate", planId: "pro" } });
      const repo = forTenant(db, tenantId), text = `token-${index}`;
      const id = randomUUID(), context = { tenantId, integrationId: id };
      const row = await repo.leadIntegration.create({ id, name: "[DỮ LIỆU MẪU] Telegram", kind: "telegram", configEncrypted: encryptSecret(text, oldKey, context) });
      rows.push({ tenantId, id: row.id, text });
      await repo.leadIntegration.create({ name: "[DỮ LIỆU MẪU] Legacy", kind: "webhook", configEncrypted: "test" });
    }
    await rotateIntegrationSecrets(db, rotate);
    for (const row of rows) {
      const repo = forTenant(db, row.tenantId), value = (await repo.leadIntegration.get(row.id))!.configEncrypted;
      const context = { tenantId: row.tenantId, integrationId: row.id };
      assert.equal(decryptSecret(value, newKey, context), row.text);
      assert.equal(needsRotation(value, ring, context), false);
      assert.equal(await repo.leadIntegration.get(rows.find(other => other.tenantId !== row.tenantId)!.id), null);
      assert.equal((await repo.leadIntegration.first({ where: { name: "[DỮ LIỆU MẪU] Legacy" } }))!.configEncrypted, "test");
      const audit = await repo.auditLog.first({ where: { action: "secrets.rotate" } });
      assert.deepEqual(audit?.data, { rotated: 1, skipped: 1 });
      assert.equal(audit?.actorType, "system");
    }
    const auditCounts = await Promise.all(ids.map(tenantId => forTenant(db, tenantId).auditLog.count({ where: { action: "secrets.rotate" } })));
    const again = await rotateIntegrationSecrets(db, rotate);
    assert.equal(again.rotated, 0);
    assert.deepEqual(await Promise.all(ids.map(tenantId => forTenant(db, tenantId).auditLog.count({ where: { action: "secrets.rotate" } }))), auditCounts);
    // Copying a valid envelope across tenants must fail authentication even with the same key ring.
    const first = await forTenant(db, rows[0].tenantId).leadIntegration.get(rows[0].id);
    const otherRepo = forTenant(db, rows[1].tenantId), other = await otherRepo.leadIntegration.get(rows[1].id);
    await otherRepo.leadIntegration.update(rows[1].id, { configEncrypted: first!.configEncrypted });
    assert.throws(() => decryptSecret(first!.configEncrypted, ring, { tenantId: rows[1].tenantId, integrationId: rows[1].id }), /Bí mật không hợp lệ/);
    await assert.rejects(() => rotateIntegrationSecrets(db, rotate), /Không thể xoay khóa/);
    assert.equal((await otherRepo.leadIntegration.get(rows[1].id))!.configEncrypted, first!.configEncrypted);
    await otherRepo.leadIntegration.update(rows[1].id, { configEncrypted: other!.configEncrypted });
    // A failed callback rolls back this tenant's updates and audit together.
    const repo = forTenant(db, ids[0]);
    const rollbackId = randomUUID();
    await repo.leadIntegration.create({ id: rollbackId, name: "[DỮ LIỆU MẪU] Rollback", kind: "telegram",
      configEncrypted: encryptSecret("rollback", newKey, { tenantId: ids[0], integrationId: rollbackId }) });
    const before = await repo.leadIntegration.list({ orderBy: { id: "asc" } });
    const ownValues = new Set(before.filter(row => row.configEncrypted.startsWith("v1.")).map(row => row.configEncrypted));
    const audits = await repo.auditLog.count({ where: { action: "secrets.rotate" } });
    let calls = 0;
    await assert.rejects(() => rotateIntegrationSecrets(db, (value, context) => {
      if (ownValues.has(value)) {
        if (++calls === 2) throw new Error("sentinel-private");
        return encryptSecret("would-change", newKey, context);
      }
      return value;
    }), /Không thể xoay khóa/);
    assert.equal(calls, 2);
    assert.deepEqual(await repo.leadIntegration.list({ orderBy: { id: "asc" } }), before);
    assert.equal(await repo.auditLog.count({ where: { action: "secrets.rotate" } }), audits);
  } finally {
    await db.tenant.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  }
});
