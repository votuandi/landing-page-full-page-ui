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
  for (const model of ["Plan", "Tenant", "Customer", "PlatformAdmin", "PlatformSession", "GhostGrant", "PlatformSetting"]) assert.doesNotThrow(() => assertTenantScoped(model, "findMany", {}));
});

test("tenant filters reject unknown shapes in required and optional tables", () => {
  const invalid = [undefined, "", 1, false, [], {}, { not: "B" }, { in: [] }, { in: ["A", null] },
    { in: ["A", 1] }, { in: new Array<string>(1) }, { equals: undefined }, { equals: "A", not: "B" },
    { in: ["A"], mode: "insensitive" }, Object.assign(Object.create({ equals: "A" }), { not: "B" })];
  for (const model of [...tenantModels, ...optionalTenantModels]) {
    const optional = (optionalTenantModels as readonly string[]).includes(model);
    for (const tenantId of [...invalid, ...(optional ? [] : [null, { equals: null }])]) {
      for (const operation of reads) {
        assert.throws(() => assertTenantScoped(model, operation, { where: { tenantId } }), MissingTenantError, `${model}.${operation}: ${JSON.stringify(tenantId)}`);
      }
      for (const operation of ["create", "createMany", "createManyAndReturn"]) {
        assert.throws(() => assertTenantScoped(model, operation, { data: { tenantId } }), MissingTenantError);
        assert.throws(() => assertTenantScoped(model, operation, { data: { tenantId, tenant: { connect: { id: "A" } } } }), MissingTenantError);
      }
    }
    for (const tenantId of ["A", { equals: "A" }, { in: ["A", "B"] }, ...(optional ? [null, { equals: null }] : [])]) {
      assert.doesNotThrow(() => assertTenantScoped(model, "findMany", { where: { tenantId } }));
    }
    for (const tenantId of [{ equals: "A" }, { in: ["A"] }]) {
      assert.throws(() => assertTenantScoped(model, "create", { data: { tenantId } }), MissingTenantError);
    }
  }
});

test("updates cannot change tenant through scalar data or tenant.connect", () => {
  for (const model of [...tenantModels, ...optionalTenantModels]) {
    for (const operation of ["update", "updateMany", "updateManyAndReturn"]) {
      for (const where of [{ tenantId: "A" }, { tenantId: { equals: "A" } }, { tenantId: { in: ["A"] } }, { tenantId_id: { tenantId: "A", id: "id" } }]) {
        for (const data of [{}, { tenantId: "A" }, { tenant: { connect: { id: "A" } } }]) {
          assert.doesNotThrow(() => assertTenantScoped(model, operation, { where, data }));
        }
        for (const data of [{ tenantId: "B" }, { tenantId: null }, { tenantId: { set: "B" } }, { tenantId: {} },
          { tenantId: undefined }, { tenant: { connect: { id: "B" } } }, { tenantId: "A", tenant: { connect: { id: "B" } } }]) {
          assert.throws(() => assertTenantScoped(model, operation, { where, data }), MissingTenantError);
        }
      }
      assert.throws(() => assertTenantScoped(model, operation, { where: { tenantId: { in: ["A", "B"] } }, data: { tenantId: "A" } }), MissingTenantError);
      assert.throws(() => assertTenantScoped(model, operation, { where: { tenantId: "A", tenantId_id: { tenantId: "B", id: "id" } }, data: { tenantId: "A" } }), MissingTenantError);
    }
  }
  for (const model of optionalTenantModels) {
    assert.doesNotThrow(() => assertTenantScoped(model, "updateMany", { where: { tenantId: null }, data: { tenantId: null } }));
    assert.throws(() => assertTenantScoped(model, "updateMany", { where: { tenantId: null }, data: { tenantId: "A" } }), MissingTenantError);
  }
});

test("upsert create and update must match the where tenant", () => {
  for (const model of [...tenantModels, ...optionalTenantModels]) {
    for (const where of [{ tenantId: "A" }, { tenantId: { equals: "A" } }, { tenantId_id: { tenantId: "A", id: "id" } }]) {
      for (const create of [{ tenantId: "A" }, { tenant: { connect: { id: "A" } } }]) {
        assert.doesNotThrow(() => assertTenantScoped(model, "upsert", { where, create, update: { tenantId: "A" } }));
        for (const update of [{ tenantId: "B" }, { tenant: { connect: { id: "B" } } }]) {
          assert.throws(() => assertTenantScoped(model, "upsert", { where, create, update }), MissingTenantError);
        }
      }
      for (const create of [{ tenantId: "B" }, { tenant: { connect: { id: "B" } } }, { tenantId: "A", tenant: { connect: { id: "B" } } }]) {
        assert.throws(() => assertTenantScoped(model, "upsert", { where, create, update: {} }), MissingTenantError);
      }
    }
  }
  for (const model of optionalTenantModels) {
    assert.doesNotThrow(() => assertTenantScoped(model, "upsert", { where: { tenantId: null }, create: { tenantId: null }, update: { tenantId: null } }));
    assert.throws(() => assertTenantScoped(model, "upsert", { where: { tenantId: null }, create: { tenantId: "A" }, update: {} }), MissingTenantError);
  }
});
