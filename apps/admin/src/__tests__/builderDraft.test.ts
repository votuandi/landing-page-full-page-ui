import assert from "node:assert/strict";
import test from "node:test";
import { RevisionConflictError, StructureError, type DraftInput } from "@solar/db";
import { sectionRegistry } from "@solar/sections";
import type { Session } from "@solar/auth";
import { createPageSectionHandlers, type PageSectionsDeps } from "../lib/pageSections.ts";

const pageId = "11111111-1111-4111-8111-111111111111", tenantId = "t1", siteId = "s1";
const hero = { id: "hero", type: "hero", variant: "t15", enabled: true };
const session = { accountId: "22222222-2222-4222-8222-222222222222" } as Session;
function setup(options: { foreign?: boolean; can?: (feature: string) => boolean; conflict?: boolean; reject?: string } = {}) {
  const writes: DraftInput[] = [];
  const deps = {
    tenant: async () => ({ tenantId, siteId, slug: "mau" }),
    page: async () => ({ id: pageId, siteId: options.foreign ? "foreign" : siteId, slug: "", title: {}, revision: 2, sections: [hero], draftSections: null, hasDraft: false }),
    entitlements: async () => options.can ?? (() => true),
    contents: async () => [{ sectionId: "hero", type: "hero" }],
    actor: async () => ({ siteUserId: session.accountId! }),
    save: async (_tenant: string, input: DraftInput) => {
      if (options.conflict) throw new RevisionConflictError(3);
      if (options.reject) throw new StructureError(options.reject);
      writes.push(input); return { revision: 3 };
    },
  } as unknown as PageSectionsDeps;
  const save = (sections: unknown, contents: unknown = {}) => createPageSectionHandlers(deps).saveBuilder(
    { pageId, revision: 2, sections: JSON.stringify(sections), contents: JSON.stringify(contents) }, { tenantId, slug: "mau", session });
  return { save, writes };
}

test("từ chối page tenant khác", async () => {
  const { save, writes } = setup({ foreign: true });
  assert.equal((await save([hero])).status, 404);
  assert.equal(writes.length, 0);
});
test("chặn type ngoài gói", async () => {
  const { save } = setup({ reject: "Section ngoài gói: calculator (trang /)" });
  const result = await save([hero, { id: "c", type: "calculator", variant: "t15", enabled: true }]);
  assert.equal(result.status, 400);
  assert.match(result.error!, /ngoài gói/);
});
test("chặn gói thiếu builder", async () => {
  const { save, writes } = setup({ can: feature => feature !== "builder" });
  assert.equal((await save([hero])).status, 403);
  assert.equal(writes.length, 0);
});
test("props sai không ghi", async () => {
  const { save, writes } = setup();
  assert.equal((await save([hero], { hero: { title: 1 } })).status, 400);
  assert.equal(writes.length, 0);
});
test("xung đột revision", async () => {
  assert.equal((await setup({ conflict: true }).save([hero])).status, 409);
});
test("descriptor và props tách riêng, section mới nhận defaults", async () => {
  const { save, writes } = setup();
  const fresh = { id: "f", type: "faq", variant: "t15", enabled: true };
  assert.equal((await save([hero, fresh], { hero: sectionRegistry.types.hero.defaults })).ok, true);
  assert.deepEqual(writes[0]!.draftSections, [hero, fresh]);
  assert.deepEqual(writes[0]!.sections?.map(s => s.sectionId), ["hero", "f"]);
});
