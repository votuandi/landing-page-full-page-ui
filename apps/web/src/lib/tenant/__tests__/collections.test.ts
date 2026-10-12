import assert from "node:assert/strict";
import test from "node:test";
import type { TenantRepo } from "@solar/db";
import { createCollectionLoader, sectionRegistry } from "@solar/sections";
import { createCollections } from "../collections";

test("empty DB collections stay empty; UUID selectors never select demo slugs or foreign records", async () => {
  const row = { id: "00000000-0000-4000-8000-000000000001", slug: "shared", title: { vi: "Tenant A" }, data: { excerpt: { vi: "Published A" }, cover: "/images/a.webp", readMinutes: 2, body: ["Body"] } };
  const repo = { post: { list: async ({ where }: { where: unknown }) => { assert.deepEqual(where, { status: "published" }); return [row]; } }, project: { list: async () => [] } } as unknown as TenantRepo;
  const adapter = createCollections(repo, "tenant-a");
  assert.deepEqual(await adapter.source.projects!({ tenantId: "tenant-a", themeId: "t15", locale: "vi" }), []);
  const def = sectionRegistry.types.blog;
  const load = createCollectionLoader(adapter.source);
  const base = { ...def.defaults, query: { ...def.defaults.query, ids: [row.id] } };
  const run = (data: unknown) => load({ section: { id: "blog", type: "blog", variant: "t15", enabled: true, data }, data, site: { tenantId: "tenant-a", themeId: "t15", locale: "vi" } });
  const result = def.schema.parse(await run(base));
  assert.equal(result.items[0].id, row.id);
  assert.equal(result.items[0].href, "/tin-tuc/shared");
  const foreign = def.schema.parse(await run({ ...base, query: { ...base.query, ids: ["00000000-0000-4000-8000-000000000002"] } }));
  assert.deepEqual(foreign.items, []);
});
