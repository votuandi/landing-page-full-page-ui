import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
// Source import: @solar/core compiles to CommonJS and tsx cannot see its re-exports.
import { RESERVED_TENANT_SLUGS } from "../../../core/src/tenantSlug.ts";
import test from "node:test";
import { globalRelations, tenantRelations } from "../tenantGuard.ts";
import { tenantModels as scopedModels, optionalTenantModels } from "../tenantScope.ts";

const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
const models = [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)];
const platform = new Set(["Tenant", "Plan", "Customer", "PlatformAdmin", "PlatformSession", "GhostGrant", "PlatformSetting"]);
const optionalTenant = new Set(["Outbox", "AuditLog"]);
const tenantModels = new Set(models.filter(([, name]) => !platform.has(name)).map(([, name]) => name));
const migrationsDir = new URL("../../prisma/migrations/", import.meta.url);
const migrations = readdirSync(migrationsDir).filter((name) => /^\d+_/.test(name)).sort();
const migration = migrations.map((name) => readFileSync(new URL(`${name}/migration.sql`, migrationsDir), "utf8")).join("\n");

test("billing expiry is nullable, indexed by status and added without changing RLS or grants", () => {
  const tenant = models.find(([, name]) => name === "Tenant")![2];
  assert.match(tenant, /planExpiresAt\s+DateTime\?/);
  assert.match(tenant, /@@index\(\[status, planExpiresAt\]\)/);
  const name = migrations.find(name => name.endsWith("_tenant_plan_expiry"));
  assert.ok(name && name > "20261017000000");
  const sql = readFileSync(new URL(`${name}/migration.sql`, migrationsDir), "utf8");
  assert.match(sql, /current_user <> 'app_owner'/);
  assert.match(sql, /ADD COLUMN "planExpiresAt" TIMESTAMP\(3\)/);
  assert.match(sql, /CREATE INDEX "Tenant_status_planExpiresAt_idx" ON public\."Tenant"\("status", "planExpiresAt"\)/);
  assert.doesNotMatch(sql, /\b(?:GRANT|REVOKE|POLICY|DISABLE ROW LEVEL SECURITY)\b/);
});

test("scope guard classifies every required and optional tenant model", () => {
  assert.deepEqual([...scopedModels].sort(), models.filter(([, , body]) => /tenantId\s+String\s/.test(body)).map(([, name]) => name).sort());
  assert.deepEqual([...optionalTenantModels].sort(), models.filter(([, , body]) => /tenantId\s+String\?/.test(body)).map(([, name]) => name).sort());
});

test("guard classifies every schema relation by its target model", () => {
  const expectedGlobal: Record<string, Record<string, string>> = {};
  const expectedTenant: Record<string, Record<string, string>> = {};
  const names = new Set(models.map(([, name]) => name));
  for (const [, model, body] of models) {
    for (const [, field, target] of body.matchAll(/^\s*(\w+)\s+(\w+)[?\[\]]*/gm)) {
      if (!names.has(target)) continue;
      const classification = platform.has(target) ? expectedGlobal : expectedTenant;
      (classification[model] ??= {})[field] = target;
    }
  }
  assert.deepEqual(globalRelations, expectedGlobal);
  assert.deepEqual(tenantRelations, expectedTenant);
});

test("schema includes every platform, content and delivery model", () => {
  const expected = "Plan Tenant Customer PlatformAdmin PlatformSession GhostGrant PlatformSetting SiteUser SiteSession SiteToken Domain Site Page PageVersion SectionContent Product ProductCategory Project Story Post Faq Testimonial Branch Certificate Brand PressItem Service Media Lead Outbox LeadIntegration AuditLog".split(" ");
  assert.deepEqual(models.map(([, name]) => name).sort(), expected.sort());
});

test("tenant tables have a tenant FK, composite identity and tenant-leading index", () => {
  for (const [, name, body] of models) {
    if (platform.has(name)) continue;
    assert.match(body, /tenantId\s+String\??\s+@db\.Uuid/, name);
    assert.match(body, /Tenant\??\s+@relation\(fields: \[tenantId\], references: \[id\], onDelete: Cascade\)/, name);
    assert.match(body, /@@unique\(\[tenantId, id\]\)/, name);
    assert.match(body, /@@index\(\[tenantId(?:,|\])/, name);
    assert.equal(/tenantId\s+String\?/.test(body), optionalTenant.has(name), name);
  }
});

test("every content FK uses the tenant composite key without cascading tenant changes", () => {
  let checked = 0;
  for (const [, name, body] of models) {
    for (const line of body.split("\n")) {
      const relation = line.match(/^\s*\w+\s+(\w+)\??\s+@relation\((.*)\)/);
      if (!relation || !tenantModels.has(name) || !tenantModels.has(relation[1])) continue;
      assert.match(relation[2], /fields: \[tenantId, \w+\], references: \[tenantId, id\]/, `${name}: ${line}`);
      assert.match(relation[2], /onUpdate: Restrict/, `${name}: ${line}`);
      checked++;
    }
  }
  assert.equal(checked, 16, "must inspect all composite relations in this schema");
});

test("SQL migrations enforce the same tenant identities and composite foreign keys", () => {
  for (const name of tenantModels) {
    assert.ok(migration.includes(`CREATE UNIQUE INDEX "${name}_tenantId_id_key" ON "${name}"("tenantId", "id")`), name);
  }
  let checked = 0;
  for (const [, source, target, relation] of migration.matchAll(/ALTER TABLE "(\w+)" ADD CONSTRAINT "\w+" FOREIGN KEY \(([^)]+)\) REFERENCES "(\w+)"/g)) {
    // Capture order is source, foreign key columns, referenced model.
    if (!tenantModels.has(source) || !tenantModels.has(relation)) continue;
    assert.match(target, /^"tenantId", "\w+"$/, `${source} -> ${relation}`);
    checked++;
  }
  assert.equal(checked, 16);
});

test("account migration keeps DB checks in sync with core slug rules (D17, D21)", () => {
  for (const slug of RESERVED_TENANT_SLUGS) assert.ok(migration.includes(`'${slug}'`), slug);
  for (const name of ["Tenant_slug_check", "SiteUser_identifier_check", "SiteUser_email_check", "SiteUser_phone_check", "SiteUser_username_check", "SiteSession_kind_check"]) {
    assert.ok(migration.includes(`"${name}"`), name);
  }
  assert.ok(migration.includes(`CREATE UNIQUE INDEX "Site_tenantId_key"`));
});
