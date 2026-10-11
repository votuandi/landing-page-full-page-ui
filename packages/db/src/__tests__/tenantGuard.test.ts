import assert from "node:assert/strict";
import test from "node:test";
import { assertNoCrossTenantConnect as guard } from "../tenantGuard.ts";
import { CrossTenantRefError } from "../refs.ts";

const local = { tenantId_id: { tenantId: "A", id: "category" } };
const foreign = { tenantId_id: { tenantId: "B", id: "category" } };

test("tenant relation selectors require the parent's composite tenant identity", () => {
  for (const connect of [{ id: "category" }, foreign, { tenantId: "A", id: "category" }]) {
    assert.throws(() => guard("Product", "create", { data: { tenant: { connect: { id: "A" } }, category: { connect } } }), CrossTenantRefError);
  }
  assert.doesNotThrow(() => guard("Product", "create", { data: { tenantId: "A", category: { connect: local } } }));
  assert.throws(() => guard("Product", "create", { data: { category: { connect: local } } }), CrossTenantRefError);
});

test("write operations resolve tenant from data or where and inspect both upsert branches", () => {
  for (const operation of ["create", "createMany", "createManyAndReturn", "update", "updateMany", "updateManyAndReturn"]) {
    for (const args of [
      { data: { tenantId: "A", category: { connect: foreign } } },
      { where: { tenantId: "A" }, data: { category: { connect: foreign } } },
      { where: { tenantId_id: { tenantId: "A", id: "product" } }, data: { category: { connect: foreign } } },
    ]) assert.throws(() => guard("Product", operation, args), CrossTenantRefError);
  }
  for (const branch of ["create", "update"]) {
    assert.throws(() => guard("Product", "upsert", {
      where: { tenantId_id: { tenantId: "A", id: "product" } }, create: {}, update: {},
      [branch]: { category: { connect: foreign } },
    }), CrossTenantRefError);
  }
  assert.throws(() => guard("Product", "createMany", { data: [{ tenantId: "A" }, { tenantId: "A", category: { connect: foreign } }] }), CrossTenantRefError);
  assert.doesNotThrow(() => guard("Product", "findMany", { where: { category: { connect: foreign } } }));
});

test("connectOrCreate and set validate every selector including arrays", () => {
  for (const selector of [{ id: "category" }, foreign]) {
    assert.throws(() => guard("Product", "create", { data: { tenantId: "A", category: { connectOrCreate: { where: selector, create: {} } } } }), CrossTenantRefError);
    assert.throws(() => guard("ProductCategory", "update", { where: { tenantId: "A" }, data: { children: { set: [local, selector] } } }), CrossTenantRefError);
    assert.throws(() => guard("ProductCategory", "update", { where: { tenantId: "A" }, data: { children: { connect: [local, selector] } } }), CrossTenantRefError);
  }
  assert.doesNotThrow(() => guard("ProductCategory", "update", { where: { tenantId: "A" }, data: { children: { set: [] } } }));
  assert.doesNotThrow(() => guard("Product", "create", { data: { tenantId: "A", category: { connectOrCreate: { where: local, create: {} } } } }));
});

test("nested writes inherit tenant and reject conflicting explicit tenant identities", () => {
  for (const data of [
    { category: { connect: foreign } }, { tenantId: "B" }, { tenant: { connect: { id: "B" } } },
  ]) {
    for (const products of [{ create: data }, { create: [{}, data] }, { createMany: { data: [{}, data] } }]) {
      assert.throws(() => guard("Tenant", "update", { where: { id: "A" }, data: { products } }), CrossTenantRefError);
    }
  }
  for (const products of [
    { update: { where: { id: "p" }, data: { category: { connect: foreign } } } },
    { updateMany: { where: {}, data: { tenantId: { set: "B" } } } },
    { upsert: { where: { id: "p" }, create: {}, update: { category: { connect: foreign } } } },
    { create: { category: { create: { parent: { connect: foreign } } } } },
  ]) assert.throws(() => guard("Tenant", "update", { where: { id: "A" }, data: { products } }), CrossTenantRefError);
  assert.doesNotThrow(() => guard("Tenant", "update", { where: { id: "A" }, data: { products: { create: { category: { connect: local } } } } }));
});

test("tenant connect agrees with data and where, including scalar set updates", () => {
  assert.throws(() => guard("Product", "create", { data: { tenantId: "A", tenant: { connect: { id: "B" } } } }), CrossTenantRefError);
  assert.throws(() => guard("Product", "update", { where: { tenantId: "A" }, data: { tenantId: { set: "B" } } }), CrossTenantRefError);
  assert.throws(() => guard("Product", "update", { where: { tenantId: "A" }, data: { tenant: { connect: { id: "B" } } } }), CrossTenantRefError);
});

test("global relations and JSON objects containing relation-like keys remain valid", () => {
  assert.doesNotThrow(() => guard("Membership", "create", { data: { tenantId: "A", user: { connect: { id: "user" } } } }));
  assert.doesNotThrow(() => guard("Tenant", "update", { where: { id: "A" }, data: { plan: { connect: { id: "premium" } } } }));
  assert.doesNotThrow(() => guard("PageVersion", "create", { data: { tenantId: "A", publishedBy: { connect: { id: "user" } } } }));
  assert.doesNotThrow(() => guard("Product", "create", { data: { tenantId: "A", data: { category: { connect: foreign }, tenantId: "B" }, title: { connect: { id: "text" } } } }));
  assert.doesNotThrow(() => guard("AuditLog", "create", { data: { tenantId: null, actorUser: { connect: { id: "user" } } } }));
});
