import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createDb, createPlatformDb, forTenant } from "../index.ts";
import { importSiteConfig } from "../siteConfigImport.ts";
import { siteConfig } from "../../../../apps/web/src/config/site.config.ts";

test("import CLI rejects missing export and invalid schema", () => {
  const dir = mkdtempSync(join(tmpdir(), "solar-config-"));
  try {
    for (const [name, source, pattern] of [["missing.mjs", "export const other = {};", /export siteConfig/], ["invalid.mjs", 'export default { brand: { email: "bad" } };', /email/]] as const) {
      const path = join(dir, name); writeFileSync(path, source);
      const result = spawnSync(process.execPath, ["--import", "tsx", resolve("scripts/import-site-config.ts"), path, "--tenant", "absent", "--dry-run"], { encoding: "utf8" });
      assert.equal(result.status, 1); assert.match(result.stderr, pattern);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test("site config import integration", { skip: !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "requires local PostgreSQL" }, async t => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 2 });
  const tenantId = randomUUID(), slug = `config-${tenantId}`, repo = forTenant(db, tenantId);
  await ops.tenant.create({ data: { id: tenantId, slug, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
  try {
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15", profile: { theme: { default: "dark", switcher: true }, guide: { items: [] }, extra: "keep" } });
    await t.test("import is idempotent", async () => {
      await importSiteConfig(ops, slug, siteConfig); await importSiteConfig(ops, slug, siteConfig);
      assert.equal(await repo.branch.count(), siteConfig.branches.length);
      const profile = (await repo.site.get(site.id))!.profile as Record<string, unknown>;
      assert.equal(profile.extra, "keep"); assert.deepEqual(profile.theme, { default: "dark", switcher: true });
      assert.deepEqual(profile.guide, { items: [] });
      assert.equal(await repo.auditLog.count({ where: { action: "site.import-config" } }), 2);
    });
    await t.test("invalid config writes nothing", async () => {
      const before = await repo.site.get(site.id), count = await repo.branch.count();
      await assert.rejects(importSiteConfig(ops, slug, { ...siteConfig, brand: { ...siteConfig.brand, email: "bad" } }), /email/);
      await assert.rejects(importSiteConfig(ops, "no-such-tenant", siteConfig), /tenant/);
      assert.deepEqual(await repo.site.get(site.id), before); assert.equal(await repo.branch.count(), count);
    });
  } finally {
    await ops.tenant.delete({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});
