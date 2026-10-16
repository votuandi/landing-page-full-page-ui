import assert from "node:assert/strict";
import test from "node:test";
import type { Db } from "../client.ts";
import { saveDraft, publishPage } from "../publish.ts";
import { createPreviewToken, consumePreviewToken } from "../preview.ts";

test("draft/publish reject invalid revision, page or ambiguous actor before DB access", async () => {
  const db = {} as Db;
  const id = "00000000-0000-4000-8000-000000000001";
  const input = { pageId: id, expectedRevision: 0, actor: { siteUserId: id } };
  for (const patch of [{ pageId: "invalid" }, { expectedRevision: -1 }, { expectedRevision: 0.5 }, { actor: {} }, { actor: { siteUserId: id, platformAdminId: id } }]) {
    await assert.rejects(saveDraft(db, id, { ...input, ...patch }));
    await assert.rejects(publishPage(db, id, { ...input, ...patch }));
  }
});
test("preview rejects invalid TTL and malformed tokens before DB access", async () => {
  for (const ttlMs of [0, -1, NaN, Infinity, 600_001]) await assert.rejects(createPreviewToken({} as Db, "a", "s", { ttlMs }), /TTL/);
  assert.equal(await consumePreviewToken({} as Db, "a", "invalid"), null);
});
