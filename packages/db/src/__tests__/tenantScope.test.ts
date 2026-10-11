import assert from "node:assert/strict";
import test from "node:test";
import { assertTenantScoped, MissingTenantError, tenantModels, optionalTenantModels } from "../tenantScope.ts";

const reads = ["findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy", "update", "updateMany", "updateManyAndReturn", "delete", "deleteMany"];
for (const model of tenantModels) {
  test(`${model}: every read/mutation requires a positive tenant scope`, () => {
    for (const operation of reads) {
      for (const args of [undefined, {}, { where: { id: "id" } }, { where: { tenantId: { not: "B" } } }, { where: { tenantId: { in: [] } } }]) {
        assert.throws(() => assertTenantScoped(model, operation, args), MissingTenantError);
      }
      for (const tenantId of ["A", { equals: "A" }, { in: ["A", "B"] }]) {
        assert.doesNotThrow(() => assertTenantScoped(model, operation, { where: { tenantId } }));
      }
      assert.doesNotThrow(() => assertTenantScoped(model, operation, { where: { tenantId_id: { tenantId: "A", id: "id" } } }));
    }
  });
}
test("creates and upserts check every data item and both upsert branches", () => {
  for (const operation of ["create", "createMany", "createManyAndReturn"]) {
    assert.throws(() => assertTenantScoped("Project", operation, { data: {} }), MissingTenantError);
    assert.doesNotThrow(() => assertTenantScoped("Project", operation, { data: { tenantId: "A" } }));
    assert.doesNotThrow(() => assertTenantScoped("Project", operation, { data: { tenant: { connect: { id: "A" } } } }));
    if (operation !== "create") {
      assert.throws(() => assertTenantScoped("Project", operation, { data: [{ tenantId: "A" }, {}] }), MissingTenantError);
    }
  }
  assert.throws(() => assertTenantScoped("Project", "upsert", { where: { tenantId: "A" }, create: {} }), MissingTenantError);
  assert.throws(() => assertTenantScoped("Project", "upsert", { where: { id: "id" }, create: { tenantId: "A" } }), MissingTenantError);
  assert.doesNotThrow(() => assertTenantScoped("Project", "upsert", { where: { tenantId: "A" }, create: { tenantId: "A" } }));
});
test("optional tenant tables need an explicit scope, including null for platform work", () => {
  for (const model of optionalTenantModels) {
    assert.throws(() => assertTenantScoped(model, "findMany", {}), MissingTenantError);
    assert.throws(() => assertTenantScoped(model, "create", { data: {} }), MissingTenantError);
    assert.doesNotThrow(() => assertTenantScoped(model, "findMany", { where: { tenantId: null } }));
    assert.doesNotThrow(() => assertTenantScoped(model, "create", { data: { tenantId: null } }));
    assert.throws(() => assertTenantScoped(model, "findMany", { where: { tenantId: undefined } }), MissingTenantError);
  }
});
test("raw queries are blocked and platform model queries remain available", () => {
  for (const operation of ["$queryRaw", "$queryRawUnsafe", "$executeRaw", "$executeRawUnsafe"]) {
    assert.throws(() => assertTenantScoped(undefined, operation, {}), (error: unknown) => {
      assert.ok(error instanceof MissingTenantError);
      assert.equal(error.operation, operation);
      return true;
    });
  }
  for (const model of ["Plan", "Tenant", "User", "PlatformAdmin"]) assert.doesNotThrow(() => assertTenantScoped(model, "findMany", {}));
});
