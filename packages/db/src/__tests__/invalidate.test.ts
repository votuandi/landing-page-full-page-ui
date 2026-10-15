import assert from "node:assert/strict";
import test from "node:test";
import { enqueueInvalidate } from "../invalidate.ts";
import type { TenantRepo } from "../repository.ts";
import { pageTag } from "@solar/cache";
test("enqueueInvalidate uses the supplied transaction repository and propagates failure", async () => {
  const tag = pageTag("00000000-0000-4000-8000-000000000001", "");
  let stored: unknown;
  const repo = { outbox: { create: async (job: unknown) => { stored = job; return { id: "queued" }; } } } as unknown as TenantRepo;
  assert.equal((await enqueueInvalidate(repo, [tag], ["t15.localhost"])).id, "queued");
  assert.deepEqual((stored as { payload: unknown }).payload, { tags: [tag], hosts: ["t15.localhost"] });
  assert.throws(() => enqueueInvalidate(repo, ["bad"]), /Invalid cache tags/);
  const failure = { outbox: { create: async () => { throw Error("transaction aborted"); } } } as unknown as TenantRepo;
  await assert.rejects(enqueueInvalidate(failure, [tag]), /transaction aborted/);
});
