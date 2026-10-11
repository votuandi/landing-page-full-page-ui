import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { Prisma } from "../../generated/client.ts";
import { createDb } from "../client.ts";
import { assertRefsBelongToTenant, CrossTenantRefError } from "../refs.ts";

describe("Postgres tenant isolation", { skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires migrated Postgres 16" }, () => {
  let db: ReturnType<typeof createDb>;
  const a = randomUUID(), b = randomUUID(), categoryB = randomUUID(), mediaB = randomUUID();
  const siteA = randomUUID(), siteB = randomUUID(), pageB = randomUUID();
  const planId = `test-${randomUUID()}`;
  before(async () => {
    db = createDb({ pool: 2 });
    await db.plan.create({ data: { id: planId, name: "Test", features: [], limits: {} } });
    for (const id of [a, b]) await db.tenant.create({ data: { id, name: "Test", slug: `test-${id}`, planId } });
    await db.productCategory.create({ data: { id: categoryB, tenantId: b, slug: "category", title: { vi: "Test" } } });
    await db.media.create({ data: { id: mediaB, tenantId: b, key: `tenants/${b}/test`, driver: "local", mime: "image/png", size: 1 } });
    for (const [id, tenantId] of [[siteA, a], [siteB, b]]) {
      await db.site.create({ data: { id, tenantId, name: "Test", themeId: "t15" } });
    }
    await db.page.create({ data: { id: pageB, tenantId: b, siteId: siteB, slug: "", sections: [] } });
  });
  after(async () => {
    if (!db) return;
    try {
      await db.tenant.deleteMany({ where: { id: { in: [a, b] } } });
      await db.plan.deleteMany({ where: { id: planId } });
    } finally { await db.$disconnect(); }
  });

  const fkError = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
  const inputOrFkError = (error: unknown) => error instanceof CrossTenantRefError || error instanceof Prisma.PrismaClientValidationError || fkError(error);
  async function rejectedProductWrite(write: () => Promise<unknown>, slug: string, scalar = false) {
    await assert.rejects(write, scalar ? fkError : inputOrFkError);
    // Check both tenants: a connect must never silently move the new row into B.
    assert.equal(await db.product.count({ where: { slug, tenantId: { in: [a, b] } } }), 0);
  }

  test("unchecked product scalar FK rejects a category belonging to B", async () => {
    await rejectedProductWrite(() => db.product.create({ data: { tenantId: a, slug: "scalar", title: {}, categoryId: categoryB } }), "scalar", true);
  });
  for (const selector of ["id", "composite"] as const) {
    const connect = selector === "id" ? { id: categoryB } : { tenantId_id: { tenantId: b, id: categoryB } };
    test(`nested tenant.update product create with ${selector} connect rejects B`, async () => {
      const slug = `nested-${selector}`;
      await rejectedProductWrite(() => db.tenant.update({ where: { id: a }, data: {
        products: { create: { slug, title: {}, category: { connect } } },
      } }), slug);
    });
    test(`product.create tenant A and ${selector} category connect B rejects without writing`, async () => {
      const slug = `direct-${selector}`;
      await rejectedProductWrite(() => db.product.create({ data: {
        slug, title: {}, tenant: { connect: { id: a } }, category: { connect },
      } }), slug);
    });
  }

  test("media and page scalar FKs reject references to B", async () => {
    await assert.rejects(db.project.create({ data: { tenantId: a, slug: "foreign-media", title: {}, coverMediaId: mediaB } }), fkError);
    assert.equal(await db.project.count({ where: { tenantId: { in: [a, b] }, slug: "foreign-media" } }), 0);
    await assert.rejects(db.sectionContent.create({ data: {
      tenantId: a, siteId: siteA, pageId: pageB, sectionId: "foreign-page", type: "hero", schemaVersion: 1, data: {},
    } }), fkError);
    assert.equal(await db.sectionContent.count({ where: { tenantId: { in: [a, b] }, sectionId: "foreign-page" } }), 0);
  });

  for (const selector of ["id", "composite"] as const) {
    test(`nested media and page ${selector} connects reject B without moving content to B`, async () => {
      const slug = `nested-media-${selector}`, sectionId = `nested-page-${selector}`;
      const mediaConnect = selector === "id" ? { id: mediaB } : { tenantId_id: { tenantId: b, id: mediaB } };
      const pageConnect = selector === "id" ? { id: pageB } : { tenantId_id: { tenantId: b, id: pageB } };
      await assert.rejects(db.project.create({ data: {
        slug, title: {}, tenant: { connect: { id: a } }, coverMedia: { connect: mediaConnect },
      } }), inputOrFkError);
      assert.equal(await db.project.count({ where: { tenantId: { in: [a, b] }, slug } }), 0);
      await assert.rejects(db.sectionContent.create({ data: {
        sectionId, type: "hero", schemaVersion: 1, data: {},
        tenant: { connect: { id: a } }, site: { connect: { tenantId_id: { tenantId: a, id: siteA } } },
        page: { connect: pageConnect },
      } }), inputOrFkError);
      assert.equal(await db.sectionContent.count({ where: { tenantId: { in: [a, b] }, sectionId } }), 0);
    });
  }

  test("composite connect within A works directly, nested and in a transaction", async () => {
    const category = await db.productCategory.create({ data: { tenantId: a, slug: "local", title: {} } });
    const connect = { tenantId_id: { tenantId: a, id: category.id } };
    const product = await db.product.create({ data: {
      slug: "local-direct", title: {}, tenant: { connect: { id: a } }, category: { connect },
    } });
    assert.equal(product.tenantId, a);
    assert.equal(product.categoryId, category.id);
    await db.tenant.update({ where: { id: a }, data: {
      products: { create: { slug: "local-nested", title: {}, category: { connect } } },
    } });
    assert.equal(await db.product.count({ where: { tenantId: a, slug: "local-nested", categoryId: category.id } }), 1);
    await db.$transaction(async (tx) => {
      await assert.rejects(tx.product.create({ data: {
        slug: "transaction-foreign", title: {}, tenant: { connect: { id: a } },
        category: { connect: { tenantId_id: { tenantId: b, id: categoryB } } },
      } }), CrossTenantRefError);
      assert.equal(await tx.product.count({ where: { tenantId: { in: [a, b] }, slug: "transaction-foreign" } }), 0);
    });
  });

  test("product slugs are unique within a tenant and reusable across tenants", async () => {
    for (const tenantId of [a, b]) await db.product.create({ data: { tenantId, slug: "shared", title: {} } });
    await assert.rejects(db.product.create({ data: { tenantId: a, slug: "shared", title: {} } }), { code: "P2002" });
    assert.equal(await db.product.count({ where: { tenantId: { in: [a, b] }, slug: "shared" } }), 2);
  });

  test("domain hostnames are unique globally", async () => {
    const hostname = `${a}.localhost`;
    await db.domain.create({ data: { tenantId: a, siteId: siteA, hostname, verificationToken: "test" } });
    await assert.rejects(db.domain.create({ data: { tenantId: b, siteId: siteB, hostname, verificationToken: "test" } }), { code: "P2002" });
  });

  test("JSON refs work with a transaction client and report every missing ref", async () => {
    const absent = randomUUID();
    await db.$transaction(async (tx) => {
      await assertRefsBelongToTenant(tx, b, { media: [mediaB, "/images/x.jpg"], collections: { productCategories: [categoryB] } });
      await assert.rejects(assertRefsBelongToTenant(tx, a, {
        media: [mediaB, absent, "not-a-uuid", "/images/x.jpg"], collections: { productCategories: [categoryB] },
      }), (error: unknown) => {
        assert.ok(error instanceof CrossTenantRefError);
        assert.deepEqual(error.missing, [
          { kind: "media", ids: [mediaB, absent, "not-a-uuid"] },
          { kind: "productCategories", ids: [categoryB] },
        ]);
        return true;
      });
    });
  });
});
