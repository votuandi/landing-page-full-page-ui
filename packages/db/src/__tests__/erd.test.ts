import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("ERD.md matches the checked-in Prisma schema", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("../../scripts/erd.mjs", import.meta.url)), "--check"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});
