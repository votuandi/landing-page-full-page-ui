import assert from "node:assert/strict";
import test from "node:test";
import { uploadInput, MediaError, mediaUsage, publishMedia } from "../media.ts";
import type { TenantRepo } from "../repository.ts";

test("uploadInput sanitizes display name without accepting storage keys", () => {
  assert.equal(uploadInput({ mime: "image/png", size: 1, name: " ../a\u0000\\.png " }).name, "..a.png");
  assert.throws(() => uploadInput({ mime: "image/png", size: 1, name: "a".repeat(201) }), MediaError);
  assert.throws(() => uploadInput({ mime: "image/png", size: 1, key: "tenants/other/a.png" }), MediaError);
});

test("limits: reject SVG, invalid integer sizes and every over-limit kind before DB", () => {
  for (const mime of ["image/svg+xml", "text/html", "image/jpg", ""]) assert.throws(() => uploadInput({ mime, size: 1 }), MediaError);
  for (const size of [0, -1, 0.5, NaN, Infinity]) assert.throws(() => uploadInput({ mime: "image/jpeg", size }), MediaError);
  for (const [mime, mb] of [["image/jpeg", 15], ["video/mp4", 200], ["application/pdf", 20]] as const) {
    assert.doesNotThrow(() => uploadInput({ mime, size: mb * 1024 ** 2 }));
    assert.throws(() => uploadInput({ mime, size: mb * 1024 ** 2 + 1 }), MediaError);
  }
});

test("publishMedia ignores static asset paths in bundled sections", async () => {
  const repo = { media: { list: async () => { throw Error("static paths must not be queried as UUIDs"); } } } as unknown as TenantRepo;
  await publishMedia(repo, ["/images/hero.jpg", "not-a-uuid"]);
});

test("mediaUsage: ready plus quarantine reservations, failed releases space", async () => {
  const repo = { media: { list: async (args: unknown) => {
    assert.deepEqual(args, { where: { status: { in: ["quarantine", "ready"] } }, select: { size: true } });
    return [{ size: 10 }, { size: 20 }];
  } } } as unknown as TenantRepo;
  assert.equal(await mediaUsage(repo), 30);
});
