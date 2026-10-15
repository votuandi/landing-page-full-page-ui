const { existsSync, readFileSync } = require("node:fs");
const { resolve, join } = require("node:path");
const matrixCapturePolicy = "isolated-site-widgets";

/** @param {{ types: Record<string, string[]>; themes: string[] }} manifest */
function baselineCells(manifest) {
  return Object.entries(manifest.types).flatMap(([type, variants]) =>
    variants.flatMap((variant) => manifest.themes.map((theme) => `${type}/${variant}--${theme}.png`)));
}

/** @param {string} directory @param {string[]} projects */
function verifyBaseline(directory, projects) {
  const manifest = JSON.parse(readFileSync(join(directory, "matrix-manifest.json"), "utf8"));
  if (manifest.capturePolicy !== matrixCapturePolicy) throw new Error("Incompatible matrix capture policy; capture exact base with the current harness");
  const cells = baselineCells(manifest);
  if (!cells.length) throw new Error("Matrix baseline manifest is empty");
  const missing = projects.flatMap((project) => cells.map((cell) => join(project, cell)))
    .filter((file) => !existsSync(join(directory, file)));
  if (missing.length) throw new Error(`Incomplete matrix baseline: ${missing.length} missing snapshots; ${missing.slice(0, 5).join(", ")}`);
  return cells.length * projects.length;
}

module.exports = { baselineCells, verifyBaseline, matrixCapturePolicy };

if (require.main === module) {
  const projects = [390, 1440].flatMap((width) => ["light", "dark"].map((mode) =>
    `matrix-${width === 390 ? "mobile-390" : "desktop-1440"}-${mode}`));
  console.log(`Verified ${verifyBaseline(resolve(process.argv[2] ?? `__screenshots__/${process.platform}`), projects)} matrix snapshots`);
}
