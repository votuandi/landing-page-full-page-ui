import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const evidence = resolve(__dirname, "../../roadmap/evidence/E4/t07");

async function stable(page: Page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; } section, footer { content-visibility: visible !important; } *, *::before, *::after { animation: none !important; transition: none !important; }" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((done) => setTimeout(done, 30));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode().catch(() => {}))));
}

for (const width of [390, 1440]) test(`t07 preset and theme swap at ${width}px`, async ({ page }) => {
  const errors: string[] = [];
  const consoleMessages: string[] = [];
  const failedResponses: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (["warning", "error"].includes(message.type())) consoleMessages.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`); });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  mkdirSync(evidence, { recursive: true });
  const checks = [];
  for (const theme of ["t07", "t15"]) {
    expect((await page.goto(`/lab/presets/t07?theme=${theme}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
    await stable(page);
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("[data-section-type=site-footer] footer")).toHaveCount(1);
    await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
    await expect(page.locator("[data-section-type]")).toHaveCount(15);
    await expect(page.locator('[data-section-type="projects"]')).toContainText("Nhà máy thực phẩm Long An");
    await expect(page.locator('[data-section-type="testimonials"]')).toContainText("An Phát");
    expect(await page.locator("img").evaluateAll((images) => images.filter((image) => !(image as HTMLImageElement).naturalWidth).map((image) => (image as HTMLImageElement).src))).toEqual([]);
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth, scrollWidth: document.documentElement.scrollWidth,
      primary: getComputedStyle(document.documentElement).getPropertyValue("--c-primary").trim(),
      heights: [...document.querySelectorAll('[data-section-type="segments"] section')].map((section) => ({ height: section.getBoundingClientRect().height, minHeight: getComputedStyle(section).minHeight })),
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.heights).toHaveLength(4);
    if (theme === "t07") for (const section of layout.heights) expect(section.height).toBeGreaterThanOrEqual(width === 390 ? 844 : 900);
    expect(layout.primary).toBe(theme === "t07" ? "21 91 215" : "21 128 61");
    checks.push({ theme, ...layout });
    const filename = theme === "t07" ? `after-${width}.jpg` : `theme-t15-${width}.jpg`;
    await page.screenshot({ path: resolve(evidence, filename), fullPage: true, type: "jpeg", quality: 15, animations: "disabled" });
  }
  expect(errors).toEqual([]);
  expect(consoleMessages.filter((message) => message.includes("hydrated"))).toEqual([]);
  writeFileSync(resolve(evidence, `runtime-${width}.json`), JSON.stringify({ errors, consoleMessages, failedResponses, checks }, null, 2) + "\n");
  expect([`after-${width}.jpg`, `theme-t15-${width}.jpg`].reduce((bytes, file) => bytes + statSync(resolve(evidence, file)).size, 0)).toBeLessThan(1_500_000);
});

test("t07 anchors and content work without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    expect((await page.goto("/lab/presets/t07"))?.status()).toBe(200);
    await expect(page.locator('[data-section-type="hero"] h1')).toBeVisible();
    await page.getByRole("link", { name: "Khám phá giải pháp", exact: true }).click();
    await expect(page).toHaveURL(/#giai-phap$/);
    await page.locator('[data-section-type="segments"] nav').getByRole("link", { name: /Nhà máy/ }).click();
    await expect(page).toHaveURL(/#solutions-factory$/);
    await expect(page.locator("#solutions-factory h3")).toBeVisible();
    await expect(page.locator('[data-section-type="process"] li')).toHaveCount(5);
    await expect(page.locator('[data-section-type="faq"] summary').first()).toBeVisible();
    await page.locator('[data-section-type="faq"] summary').first().click();
    await expect(page.locator('[data-section-type="faq"] details').first()).toHaveAttribute("open", "");
    await expect(page.locator('[data-section-type="lead-form"] input').first()).toBeAttached();
  } finally { await context.close(); }
});

test("matrix includes t07 variants and SVG animation obeys reduced motion", async ({ page }) => {
  expect((await page.goto("/lab/sections/matrix", { waitUntil: "networkidle" }))?.status()).toBe(200);
  for (const type of ["hero", "segments", "energy-monitoring", "process"]) {
    await expect(page.locator("li").filter({ has: page.locator(`[data-lab-type="${type}"]`) })).toContainText("t07");
  }
  await page.goto("/lab/presets/t07", { waitUntil: "networkidle" });
  await expect(page.locator('.t07-illustration .ill-float').first()).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator('.t07-illustration .ill-float').first()).toHaveCSS("animation-name", "t07-float");
});
