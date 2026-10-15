import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { baselineCells, verifyBaseline, matrixCapturePolicy } from "./matrix-baseline.js";

test("cached baselines captured with global widgets are rejected", () => {
  const directory = mkdtempSync(join(tmpdir(), "matrix-capture-"));
  writeFileSync(join(directory, "matrix-manifest.json"), JSON.stringify({ types: { process: ["t10"] }, themes: ["t11"] }));
  assert.throws(() => verifyBaseline(directory, []), /capture policy/);
});

test("exact-base manifest requires every existing cell in every project while excluding genuinely new cells", () => {
  const directory = mkdtempSync(join(tmpdir(), "matrix-baseline-"));
  const manifest = { types: { hero: ["t15", "t12"] }, themes: ["t15"], capturePolicy: matrixCapturePolicy };
  writeFileSync(join(directory, "matrix-manifest.json"), JSON.stringify(manifest));
  assert.ok(!baselineCells(manifest).includes("page-hero/t15--t15.png"));
  assert.throws(() => verifyBaseline(directory, ["matrix-mobile", "matrix-desktop"]), /4 missing snapshots/);
  for (const project of ["matrix-mobile", "matrix-desktop"]) {
    mkdirSync(join(directory, project, "hero"), { recursive: true });
    for (const cell of baselineCells(manifest)) writeFileSync(join(directory, project, cell), "png");
  }
  assert.equal(verifyBaseline(directory, ["matrix-mobile", "matrix-desktop"]), 4);
});
