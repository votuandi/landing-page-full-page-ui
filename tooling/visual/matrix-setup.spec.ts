import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { matrixTypes, matrixThemes, matrixVariants } from "./matrix";
import { matrixCapturePolicy } from "./matrix-baseline.js";

test("registry and exact-base manifest", async ({ page }, testInfo) => {
  expect((await page.goto("/lab/sections/matrix"))?.status()).toBe(200);
  // Read existing index markup so the PR harness also supports older merge-base source.
  const manifest = await page.evaluate(() => ({
    types: Object.fromEntries([...document.querySelectorAll("[data-lab-type]")].map((node) => [
      node.getAttribute("data-lab-type")!,
      node.parentElement!.querySelector("p")!.textContent!.replace(/^Variant:\s*/, "").split(",").map((id) => id.trim()),
    ])),
    themes: [...document.querySelectorAll("main > p")].find((node) => node.textContent?.startsWith("Theme:"))!
      .textContent!.replace(/^Theme:\s*/, "").split(",").map((id) => id.trim()),
  }));
  const captureManifest = { ...manifest, capturePolicy: matrixCapturePolicy };
  const updating = testInfo.config.updateSnapshots !== "none";
  for (const type of Object.keys(manifest.types)) expect(matrixTypes).toContain(type);
  if (!updating) {
    expect(Object.keys(manifest.types).sort()).toEqual([...matrixTypes].sort());
    expect(manifest.themes.sort()).toEqual([...matrixThemes].sort());
    for (const type of matrixTypes) expect(manifest.types[type].sort()).toEqual([...matrixVariants[type]].sort());
  }
  await mkdir("test-results/matrix", { recursive: true });
  await writeFile("test-results/matrix/manifest.json", JSON.stringify(captureManifest));
  if (updating) {
    const directory = resolve(`__screenshots__/${process.platform}`);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, "matrix-manifest.json"), JSON.stringify(captureManifest, null, 2));
  }
});
