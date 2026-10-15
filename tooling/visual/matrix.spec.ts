import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectColorSamples, findOffTokenColors } from "./matrix-colors";
import { matrixTypes, matrixThemes, matrixVariants } from "./matrix";
import { baselineCells } from "./matrix-baseline.js";

test("painted SVG colors: lines use stroke while area shapes also use fill", async ({ page }) => {
  await page.setContent('<svg data-lab-cell="probe"><line x1="1" y1="1" x2="20" y2="20" fill="red" stroke="blue"/><rect x="30" y="1" width="20" height="20" fill="red"/><path d="M60 1V20 M80 1L90 20" stroke="blue"/><path d="M100 1 L120 1 L120 20" fill="red"/></svg>');
  const samples = await page.locator("svg").evaluate(collectColorSamples);
  expect(samples.filter((sample) => sample.selector.includes("line:") && sample.property === "fill")).toEqual([]);
  expect(samples.some((sample) => sample.selector.includes("line:") && sample.property === "stroke")).toBe(true);
  expect(samples.some((sample) => sample.selector.includes("rect:") && sample.property === "fill")).toBe(true);
  expect(samples.filter((sample) => sample.selector.includes("path:nth-child(3)") && sample.property === "fill")).toEqual([]);
  expect(samples.some((sample) => sample.selector.includes("path:nth-child(4)") && sample.property === "fill")).toBe(true);
});

test("registry coverage", async ({ page }, testInfo) => {
  const response = await page.goto("/lab/sections/matrix");
  expect(response?.status()).toBe(200);
  const registered = await page.locator("[data-lab-type]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-lab-type")));
  if (testInfo.config.updateSnapshots === "none") expect(registered.sort()).toEqual([...matrixTypes].sort());
  else for (const type of registered) expect(matrixTypes).toContain(type);
});

// Interleave types so each shard gets a mix of small and expensive sections.
for (const selectedTheme of matrixThemes) for (const type of matrixTypes) {
  test(`${type}/${selectedTheme}`, async ({ page, colorScheme, viewport }, testInfo) => {
    const updating = testInfo.config.updateSnapshots !== "none";
    const manifest = JSON.parse(readFileSync(resolve(`__screenshots__/${process.platform}/matrix-manifest.json`), "utf8")) as {
      types: Record<string, string[]>; themes: string[];
    };
    const oldCells = new Set(baselineCells(manifest));
    // Base source can legitimately predate a type/theme added by this PR.
    if (updating && (!manifest.types[type] || !manifest.themes.includes(selectedTheme))) {
      test.skip(true, "Cell is new relative to exact base");
      return;
    }
    const mode = colorScheme === "dark" ? "dark" : "light";
    await page.addInitScript((value) => {
      localStorage.setItem("t15-theme", value);
      localStorage.setItem("t15-lang", "vi");
      sessionStorage.setItem("t15-consult-shown", "1");
    }, mode);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`/lab/sections/${type}?themes=${selectedTheme}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
    await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
    await page.addStyleTag({ content: '[data-lab-cell] *, [data-lab-cell] { content-visibility: visible !important; animation: none !important; transition: none !important; }' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      document.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((done) => setTimeout(done, 50));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
    await page.evaluate(() => Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => {}))));
    await page.mouse.move(-1, -1);
    expect(errors, "No browser runtime errors").toEqual([]);
    const palettes = JSON.parse(await page.locator("#lab-palette").textContent() ?? "{}") as Record<string, {
      supportsDark: boolean; light: Record<string, string>; dark: Record<string, string>;
    }>;
    const cells = page.locator("[data-lab-cell]");
    expect(await cells.count()).toBe((updating ? manifest.types[type] : matrixVariants[type]).length);
    await expect(page.locator(`[data-lab-theme-id]:not([data-lab-theme-id="${selectedTheme}"])`)).toHaveCount(0);
    // One axe traversal per page; attribute each violation to its cell below.
    const axe = await new AxeBuilder({ page }).include("[data-lab-cell]").withRules(["color-contrast"]).analyze();
    const results = [];
    try {
      for (const cell of await cells.all()) {
        const theme = (await cell.getAttribute("data-lab-theme-id"))!;
        const variant = (await cell.getAttribute("data-lab-variant"))!;
        const palette = palettes[theme];
        const offToken = findOffTokenColors(await cell.evaluate(collectColorSamples), palette[mode === "dark" && palette.supportsDark ? "dark" : "light"]);
        const inCell = async (target: unknown) => typeof target === "string" && await cell.locator(target).count() > 0;
        const contrast = [];
        const incomplete = [];
        for (const { id, nodes } of axe.violations) {
          const matching = [];
          for (const { target, failureSummary } of nodes) if (await inCell(target[0])) matching.push({ target, failureSummary });
          if (matching.length) contrast.push({ id, nodes: matching });
        }
        for (const { id, nodes } of axe.incomplete) {
          let count = 0;
          for (const { target } of nodes) if (await inCell(target[0])) count++;
          if (count) incomplete.push({ id, nodes: count });
        }
        results.push({ type, variant, theme, mode, viewport: viewport!.width, project: testInfo.project.name,
          offToken, contrast, incomplete });
        expect.soft(offToken, `${type}/${variant}/${theme}: màu ngoài token`).toEqual([]);
        const file = `${variant}--${theme}.png`;
        const name = [type, file];
        await writeFile(testInfo.outputPath("cells.json"), JSON.stringify(results, null, 2));
        if (!updating && !oldCells.has(name.join("/"))) {
          testInfo.annotations.push({ type: "baseline-new", description: name.join("/") });
          continue;
        }
        if (!updating) expect(existsSync(testInfo.snapshotPath(type, file)), `Existing base snapshot missing: ${name.join("/")}`).toBe(true);
        await expect.soft(cell).toHaveScreenshot(name, {
          mask: [cell.locator(".t15-marquee, iframe, video"), cell.locator("dd.tabular-nums, .tabular-nums")],
        });
      }
    } finally {
      await writeFile(testInfo.outputPath("cells.json"), JSON.stringify(results, null, 2));
    }
  });
}
