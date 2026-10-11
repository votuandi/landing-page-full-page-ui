import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { matrixTypes } from "./matrix";

async function stable(page: Page) {
  await page.addStyleTag({ content: "section, footer { content-visibility: visible !important; } *, *::before, *::after { animation: none !important; transition: none !important; }" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((done) => setTimeout(done, 30));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode().catch(() => {}))));
}

for (const id of ["t05", "t06", "t09"]) {
  for (const width of [390, 1440]) for (const theme of [id, "t15"]) {
    test(`${id} at ${width}px with ${theme}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.addInitScript(() => { localStorage.setItem("t15-theme", "light"); sessionStorage.setItem("t15-consult-shown", "1"); });
      expect((await page.goto(`/lab/presets/${id}?theme=${theme}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
      await stable(page);
      await expect(page.locator("header")).toHaveCount(1);
      await expect(page.locator("[data-section-type=site-footer] footer")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
      await expect(page.locator("[data-section-type=projects] h2")).toBeVisible();
      await expect(page.locator("[data-section-type=services] h3")).toHaveCount(id === "t05" ? 3 : 4);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (id === "t05") {
        const faq = page.locator("[data-section-type=faq] details").first();
        await faq.locator("summary").click();
        await expect(faq).toHaveAttribute("open", "");
        await faq.locator("summary").click();
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      } else {
        await expect(page.locator("[data-section-type=load-profile] polyline")).toHaveCount(2);
      }
      expect(errors).toEqual([]);
      const evidence = resolve(__dirname, "../../roadmap/evidence/E4", id);
      mkdirSync(evidence, { recursive: true });
      await page.screenshot({ path: resolve(evidence, `${theme === id ? "after" : "theme-t15"}-${width}.jpg`), type: "jpeg", quality: 15, fullPage: true, animations: "disabled" });
      if (theme === "t15" && width === 1440) {
        const total = ["after-390", "after-1440", "theme-t15-390", "theme-t15-1440"].reduce((sum, name) => sum + statSync(resolve(evidence, `${name}.jpg`)).size, 0);
        expect(total).toBeLessThan(3_000_000);
      }
    });
  }
  test(`${id} preserves content without JavaScript`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    try {
      const page = await context.newPage();
      expect((await page.goto(`/lab/presets/${id}`))?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("[data-section-type=projects] h2")).toBeVisible();
      await expect(page.locator("[data-section-type=lead-form] form")).toBeVisible();
      for (const heading of await page.locator("[data-section-type=services] h3").all()) await expect(heading).toBeVisible();
      if (id === "t05") {
        const faq = page.locator("[data-section-type=faq] details").first();
        await faq.locator("summary").click();
        await expect(faq.locator("p")).toBeVisible();
      } else await expect(page.locator("[data-section-type=load-profile] svg")).toBeVisible();
    } finally { await context.close(); }
  });
}

test("matrix includes all types and the C&I variants on native and t15 themes", async ({ page }) => {
  expect((await page.goto("/lab/sections/matrix"))?.status()).toBe(200);
  const types = await page.locator("[data-lab-type]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-lab-type")));
  expect(types.sort()).toEqual([...matrixTypes].sort());
  for (const type of ["hero", "load-profile", "energy-monitoring", "services", "investment-models", "trust", "process", "faq", "lead-form"]) {
    expect((await page.goto(`/lab/sections/${type}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
    const variant = ["hero", "load-profile", "energy-monitoring", "services"].includes(type) ? "t06" : "t05";
    for (const theme of ["t05", "t06", "t09", "t15"]) await expect(page.locator(`[data-lab-cell="${variant}--${theme}"]`)).toHaveCount(1);
    await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
  }
});
