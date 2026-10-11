import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { collectColorSamples, findOffTokenColors } from "./matrix-colors";
import { matrixTypes } from "./matrix";

test("registry coverage", async ({ page }) => {
  const response = await page.goto("/lab/sections/matrix");
  expect(response?.status()).toBe(200);
  const registered = await page.locator("[data-lab-type]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-lab-type")));
  expect(registered.sort()).toEqual([...matrixTypes].sort());
});

for (const type of matrixTypes) {
  test(type, async ({ page, colorScheme, viewport }, testInfo) => {
    const mode = colorScheme === "dark" ? "dark" : "light";
    await page.addInitScript((value) => {
      localStorage.setItem("t15-theme", value);
      localStorage.setItem("t15-lang", "vi");
      sessionStorage.setItem("t15-consult-shown", "1");
    }, mode);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`/lab/sections/${type}`, { waitUntil: "networkidle" });
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
    expect(await cells.count()).toBeGreaterThan(0);
    const results = [];
    try {
      for (const cell of await cells.all()) {
        const theme = (await cell.getAttribute("data-lab-theme-id"))!;
        const variant = (await cell.getAttribute("data-lab-variant"))!;
        const palette = palettes[theme];
        const offToken = findOffTokenColors(await cell.evaluate(collectColorSamples), palette[mode === "dark" && palette.supportsDark ? "dark" : "light"]);
        const selector = `[data-lab-cell="${variant}--${theme}"]`;
        const axe = await new AxeBuilder({ page }).include(selector).withRules(["color-contrast"]).analyze();
        const contrast = axe.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
        results.push({ type, variant, theme, mode, viewport: viewport!.width, project: testInfo.project.name,
          offToken, contrast, incomplete: axe.incomplete.map(({ id, nodes }) => ({ id, nodes: nodes.length })) });
        expect.soft(offToken, `${type}/${variant}/${theme}: màu ngoài token`).toEqual([]);
        const file = `${variant}--${theme}.png`;
        const name = [type, file];
        // Ô mới (PR đầu, theme/variant mới ở E4) chưa có baseline: không so ảnh; job baseline trên base tạo sau merge.
        if (testInfo.config.updateSnapshots === "none" && !existsSync(testInfo.snapshotPath(type, file))) {
          testInfo.annotations.push({ type: "baseline-missing", description: name.join("/") });
          continue;
        }
        await expect.soft(cell).toHaveScreenshot(name, {
          mask: [cell.locator(".t15-marquee, iframe, video"), cell.locator("dd.tabular-nums, .tabular-nums")],
        });
      }
    } finally {
      await writeFile(testInfo.outputPath("cells.json"), JSON.stringify(results, null, 2));
    }
  });
}
